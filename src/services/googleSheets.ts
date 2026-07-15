import { Client, ProductItem, FinanceDocument, OwnerProfile } from '../types';
import { calculateDocumentSummary } from '../utils';

export interface SyncResult {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  error?: string;
}

const SPREADSHEET_NAME = 'ระบบเอกสารการเงิน บุคคลธรรมดา';

// Headers for each sheet tab
const HEADERS = {
  Documents: [
    'ID',
    'ประเภทเอกสาร',
    'เลขที่เอกสาร',
    'วันที่ออกเอกสาร',
    'วันครบกำหนด',
    'เลขอ้างอิง',
    'รหัสลูกค้า',
    'ชื่อลูกค้า',
    'ยอดส่วนลด',
    'เปิดใช้ VAT',
    'อัตรา VAT (%)',
    'เปิดใช้ภาษีหัก ณ ที่จ่าย',
    'อัตราหัก ณ ที่จ่าย (%)',
    'สถานะ',
    'หมายเหตุ',
    'ยอดรวมก่อนหักส่วนลด',
    'ยอดรวมสุทธิ',
    'ยอดหัก ณ ที่จ่าย',
    'ยอดสุทธิที่ต้องชำระ',
    'รายการสินค้า (JSON)',
    'ข้อมูลลูกค้าประวัติ (JSON)',
    'ข้อมูลผู้รับเงินประวัติ (JSON)',
    'สร้างเมื่อ (Created At)'
  ],
  Clients: [
    'ID',
    'ชื่อลูกค้า/บริษัท',
    'เลขประจำตัวผู้เสียภาษี',
    'ที่อยู่',
    'เบอร์โทรศัพท์',
    'อีเมล',
    'หมายเหตุ'
  ],
  Products: [
    'ID',
    'ชื่อสินค้าและบริการ',
    'ราคาต่อหน่วย',
    'หน่วยนับ'
  ],
  Profile: [
    'คีย์คุณลักษณะ (Key)',
    'ค่าข้อมูล (Value)'
  ]
};

/**
 * Searches for an existing spreadsheet by name in the user's Drive.
 * Returns the spreadsheet file info if found, otherwise null.
 */
export async function findSpreadsheet(accessToken: string): Promise<{ id: string; name: string; url: string } | null> {
  const query = encodeURIComponent(`name = '${SPREADSHEET_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
      throw new Error(`Failed to query Drive: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return {
        id: data.files[0].id,
        name: data.files[0].name,
        url: data.files[0].webViewLink
      };
    }
    return null;
  } catch (error) {
    console.error('Error finding spreadsheet:', error);
    throw error;
  }
}

/**
 * Creates a new spreadsheet with the four required tabs and headers.
 */
export async function createSpreadsheet(accessToken: string): Promise<{ id: string; url: string }> {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';
  
  try {
    // 1. Create Spreadsheet file with correct sheet tabs
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title: SPREADSHEET_NAME
        },
        sheets: [
          { properties: { title: 'Documents' } },
          { properties: { title: 'Clients' } },
          { properties: { title: 'Products' } },
          { properties: { title: 'Profile' } }
        ]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to create spreadsheet: ${errText}`);
    }

    const spreadsheet = await res.json();
    const spreadsheetId = spreadsheet.spreadsheetId;
    const spreadsheetUrl = spreadsheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    // 2. Initialize each tab with correct headers
    await initializeHeaders(accessToken, spreadsheetId);

    return { id: spreadsheetId, url: spreadsheetUrl };
  } catch (error) {
    console.error('Error creating spreadsheet:', error);
    throw error;
  }
}

/**
 * Helper to write headers into newly created sheet tabs
 */
async function initializeHeaders(accessToken: string, spreadsheetId: string): Promise<void> {
  const ranges = [
    { range: 'Documents!A1', values: [HEADERS.Documents] },
    { range: 'Clients!A1', values: [HEADERS.Clients] },
    { range: 'Products!A1', values: [HEADERS.Products] },
    { range: 'Profile!A1', values: [HEADERS.Profile] }
  ];

  for (const item of ranges) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${item.range}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: item.values
      })
    });
  }
}

/**
 * Checks if all required sheets/tabs exist in the spreadsheet, and creates them if they don't.
 */
async function ensureSheetTabsExist(accessToken: string, spreadsheetId: string): Promise<void> {
  try {
    const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties(title))`;
    const res = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) return;

    const metadata = await res.json();
    const existingTitles = new Set(metadata.sheets?.map((s: any) => s.properties.title) || []);

    const missingTitles = Object.keys(HEADERS).filter(title => !existingTitles.has(title));

    if (missingTitles.length > 0) {
      const requests = missingTitles.map(title => ({
        addSheet: {
          properties: { title }
        }
      }));

      const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
      await fetch(updateUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
      });

      // Initialize headers for newly added tabs
      for (const title of missingTitles) {
        const headerRow = (HEADERS as any)[title];
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${title}!A1?valueInputOption=USER_ENTERED`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: [headerRow]
          })
        });
      }
    }
  } catch (error) {
    console.error('Error ensuring sheets exist:', error);
  }
}

/**
 * Pushes (overwrites) all local app data to the Google Spreadsheet.
 */
export async function pushDataToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  data: {
    documents: FinanceDocument[];
    clients: Client[];
    products: ProductItem[];
    profile: OwnerProfile;
  }
): Promise<void> {
  // Ensure tabs exist first
  await ensureSheetTabsExist(accessToken, spreadsheetId);

  // 1. Prepare Documents rows
  const documentRows = [
    HEADERS.Documents,
    ...data.documents.map(doc => {
      const summary = calculateDocumentSummary(doc);
      return [
        doc.id,
        doc.documentType,
        doc.documentNumber,
        doc.date,
        doc.dueDate || '',
        doc.referenceNumber || '',
        doc.clientId,
        doc.clientDetails.name,
        doc.discount,
        doc.isVatEnabled ? 'TRUE' : 'FALSE',
        doc.vatRate,
        doc.isWithholdingTaxEnabled ? 'TRUE' : 'FALSE',
        doc.withholdingTaxRate,
        doc.status,
        doc.notes || '',
        summary.subtotal,
        summary.totalAmount,
        summary.withholdingTaxAmount,
        summary.amountToPay,
        JSON.stringify(doc.items),
        JSON.stringify(doc.clientDetails),
        JSON.stringify(doc.ownerDetails),
        doc.createdAt
      ];
    })
  ];

  // 2. Prepare Clients rows
  const clientRows = [
    HEADERS.Clients,
    ...data.clients.map(c => [
      c.id,
      c.name,
      c.taxId || '',
      c.address,
      c.phone,
      c.email,
      c.notes || ''
    ])
  ];

  // 3. Prepare Products rows
  const productRows = [
    HEADERS.Products,
    ...data.products.map(p => [
      p.id,
      p.name,
      p.price,
      p.unit
    ])
  ];

  // 4. Prepare Profile rows (key-value)
  const profileRows = [
    HEADERS.Profile,
    ['name', data.profile.name],
    ['taxId', data.profile.taxId],
    ['address', data.profile.address],
    ['phone', data.profile.phone],
    ['email', data.profile.email],
    ['website', data.profile.website || ''],
    ['bankName', data.profile.bankName],
    ['bankAccountName', data.profile.bankAccountName],
    ['bankAccountNumber', data.profile.bankAccountNumber],
    ['signatureName', data.profile.signatureName || ''],
    ['useVat', data.profile.useVat ? 'TRUE' : 'FALSE'],
    ['vatRate', data.profile.vatRate],
    ['useWithholdingTax', data.profile.useWithholdingTax ? 'TRUE' : 'FALSE'],
    ['withholdingTaxRate', data.profile.withholdingTaxRate]
  ];

  const payload = {
    valueInputOption: 'USER_ENTERED',
    data: [
      { range: 'Documents!A1:W10000', values: documentRows },
      { range: 'Clients!A1:G10000', values: clientRows },
      { range: 'Products!A1:D10000', values: productRows },
      { range: 'Profile!A1:B100', values: profileRows }
    ]
  };

  // Clear older ranges before writing to avoid leftover cells if size decreased
  const tabsToClear = ['Documents', 'Clients', 'Products', 'Profile'];
  for (const tab of tabsToClear) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${tab}!A1:Z10000:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  }

  // Write new data in one batch
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  const res = await fetch(updateUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to sync to Google Sheet: ${errText}`);
  }
}

/**
 * Pulls all data from the Google Spreadsheet to import into the app.
 */
export async function pullDataFromSpreadsheet(
  accessToken: string,
  spreadsheetId: string
): Promise<{
  documents: FinanceDocument[];
  clients: Client[];
  products: ProductItem[];
  profile: OwnerProfile;
} | null> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=Documents!A2:W1000&ranges=Clients!A2:G1000&ranges=Products!A2:D1000&ranges=Profile!A2:B100`;
  
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
      throw new Error(`Failed to load data from sheet: ${res.statusText}`);
    }

    const data = await res.json();
    const valueRanges = data.valueRanges || [];

    const docValues = valueRanges[0]?.values || [];
    const clientValues = valueRanges[1]?.values || [];
    const productValues = valueRanges[2]?.values || [];
    const profileValues = valueRanges[3]?.values || [];

    // Parse Clients
    const clients: Client[] = clientValues.map((row: any) => ({
      id: row[0] || '',
      name: row[1] || '',
      taxId: row[2] || '',
      address: row[3] || '',
      phone: row[4] || '',
      email: row[5] || '',
      notes: row[6] || ''
    })).filter((c: Client) => c.id);

    // Parse Products
    const products: ProductItem[] = productValues.map((row: any) => ({
      id: row[0] || '',
      name: row[1] || '',
      price: parseFloat(row[2]) || 0,
      unit: row[3] || 'หน่วย'
    })).filter((p: ProductItem) => p.id);

    // Parse Profile
    const profileRaw: Record<string, any> = {};
    profileValues.forEach((row: any) => {
      if (row && row.length >= 2) {
        const key = row[0];
        const val = row[1];
        if (key === 'useVat' || key === 'useWithholdingTax') {
          profileRaw[key] = val === 'TRUE';
        } else if (key === 'vatRate' || key === 'withholdingTaxRate') {
          profileRaw[key] = parseFloat(val) || 0;
        } else {
          profileRaw[key] = val;
        }
      }
    });

    const profile: OwnerProfile = {
      name: profileRaw.name || '',
      taxId: profileRaw.taxId || '',
      address: profileRaw.address || '',
      phone: profileRaw.phone || '',
      email: profileRaw.email || '',
      website: profileRaw.website || '',
      bankName: profileRaw.bankName || '',
      bankAccountName: profileRaw.bankAccountName || '',
      bankAccountNumber: profileRaw.bankAccountNumber || '',
      signatureName: profileRaw.signatureName || '',
      useVat: !!profileRaw.useVat,
      vatRate: profileRaw.vatRate ?? 7,
      useWithholdingTax: !!profileRaw.useWithholdingTax,
      withholdingTaxRate: profileRaw.withholdingTaxRate ?? 3
    };

    // Parse Documents
    const documents: FinanceDocument[] = docValues.map((row: any) => {
      let items = [];
      try {
        items = JSON.parse(row[19] || '[]');
      } catch (e) {
        console.error('Error parsing line items JSON:', e);
      }

      let clientDetails = null;
      try {
        clientDetails = JSON.parse(row[20]);
      } catch (e) {
        // Fallback reconstruction
        clientDetails = clients.find(c => c.id === row[6]) || {
          id: row[6] || '',
          name: row[7] || '',
          address: '',
          phone: '',
          email: ''
        };
      }

      let ownerDetails = null;
      try {
        ownerDetails = JSON.parse(row[21]);
      } catch (e) {
        // Fallback to current profile
        ownerDetails = profile;
      }

      return {
        id: row[0] || '',
        documentType: (row[1] || 'QUOTATION') as any,
        documentNumber: row[2] || '',
        date: row[3] || '',
        dueDate: row[4] || '',
        referenceNumber: row[5] || '',
        clientId: row[6] || '',
        clientDetails,
        ownerDetails,
        items,
        discount: parseFloat(row[8]) || 0,
        isVatEnabled: row[9] === 'TRUE',
        vatRate: parseFloat(row[10]) || 0,
        isWithholdingTaxEnabled: row[11] === 'TRUE',
        withholdingTaxRate: parseFloat(row[12]) || 0,
        status: (row[13] || 'draft') as any,
        notes: row[14] || '',
        createdAt: row[22] || new Date().toISOString()
      };
    }).filter((d: FinanceDocument) => d.id);

    return { documents, clients, products, profile };
  } catch (error) {
    console.error('Error pulling data from spreadsheet:', error);
    throw error;
  }
}

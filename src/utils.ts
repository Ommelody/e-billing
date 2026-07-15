import { Client, ProductItem, FinanceDocument, OwnerProfile } from './types';

// Robust Thai Baht Text Converter
export function thaiBahtText(num: number): string {
  if (num === null || num === undefined || isNaN(num)) return 'ศูนย์บาทถ้วน';

  const absoluteNum = Math.abs(num);
  const fixedStr = absoluteNum.toFixed(2);
  const [bahtStr, satangStr] = fixedStr.split('.');

  const bahtVal = parseInt(bahtStr, 10);
  const satangVal = parseInt(satangStr, 10);

  if (bahtVal === 0 && satangVal === 0) {
    return 'ศูนย์บาทถ้วน';
  }

  const thaiNumbers = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const thaiPositions = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  function convertSection(numberStr: string): string {
    let result = '';
    const len = numberStr.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(numberStr[i], 10);
      const pos = len - i - 1;

      if (digit !== 0) {
        // Handle "เอ็ด" (1 at the unit place of a multi-digit number)
        if (pos === 0 && digit === 1 && len > 1) {
          result += 'เอ็ด';
        }
        // Handle "ยี่สิบ" (2 at the tens place)
        else if (pos === 1 && digit === 2) {
          result += 'ยี่สิบ';
        }
        // Handle "สิบ" (1 at the tens place)
        else if (pos === 1 && digit === 1) {
          result += 'สิบ';
        }
        else {
          result += thaiNumbers[digit] + thaiPositions[pos];
        }
      }
    }
    return result;
  }

  function convertLargeNumber(numberStr: string): string {
    let result = '';
    const len = numberStr.length;

    if (len > 6) {
      const millionPart = numberStr.substring(0, len - 6);
      const remainderPart = numberStr.substring(len - 6);
      result += convertLargeNumber(millionPart) + 'ล้าน';
      result += convertSection(remainderPart);
    } else {
      result += convertSection(numberStr);
    }

    return result;
  }

  let text = num < 0 ? 'ลบ' : '';

  if (bahtVal > 0) {
    text += convertLargeNumber(bahtStr) + 'บาท';
  }

  if (satangVal > 0) {
    // If there is no baht value but we have satangs, show satangs only
    if (bahtVal === 0) {
      text += convertSection(satangStr) + 'สตางค์';
    } else {
      text += convertSection(satangStr) + 'สตางค์';
    }
  } else {
    text += 'ถ้วน';
  }

  return text;
}

// Format number to currency style (e.g., 1,250.00)
export function formatCurrency(value: number): string {
  if (value === null || value === undefined || isNaN(value)) return '0.00';
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Convert YYYY-MM-DD to Thai Date (Buddhist Era พ.ศ.)
// e.g., 2026-07-12 -> 12 กรกฎาคม 2569
export function formatThaiDate(dateStr: string, isShort = false): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const thaiMonthsFull = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const thaiMonthsShort = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];

  const day = date.getDate();
  const monthIndex = date.getMonth();
  const yearBE = date.getFullYear() + 543; // Buddhist Era

  const month = isShort ? thaiMonthsShort[monthIndex] : thaiMonthsFull[monthIndex];

  return `${day} ${month} ${yearBE}`;
}

// Format credit card/ID card number with hyphens (e.g., x-xxxx-xxxxx-xx-x)
export function formatIdCard(idStr: string): string {
  if (!idStr) return '';
  const cleanStr = idStr.replace(/\D/g, '');
  if (cleanStr.length !== 13) return idStr;
  return `${cleanStr[0]}-${cleanStr.slice(1, 5)}-${cleanStr.slice(5, 10)}-${cleanStr.slice(10, 12)}-${cleanStr[12]}`;
}

// Format Phone Number
export function formatPhone(phoneStr: string): string {
  if (!phoneStr) return '';
  const cleanStr = phoneStr.replace(/\D/g, '');
  if (cleanStr.length === 10) {
    return `${cleanStr.slice(0, 3)}-${cleanStr.slice(3, 6)}-${cleanStr.slice(6)}`;
  }
  if (cleanStr.length === 9) {
    return `${cleanStr.slice(0, 2)}-${cleanStr.slice(2, 5)}-${cleanStr.slice(5)}`;
  }
  return phoneStr;
}

// Auto-generate document numbers
export function generateDocumentNumber(type: string, lastCount = 0): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  let prefix = 'QT';
  if (type === 'INVOICE') prefix = 'IV';
  else if (type === 'BILLING') prefix = 'BL';
  else if (type === 'RECEIPT') prefix = 'RE';

  const runningNum = (lastCount + 1).toString().padStart(4, '0');
  return `${prefix}-${year}${month}-${runningNum}`;
}

// Standard Initial States
export const DEFAULT_OWNER: OwnerProfile = {
  name: 'นพคุณ เลิศวิจิตรเดชา',
  taxId: '1100501234567',
  address: '456/78 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
  phone: '0812345678',
  email: 'noppakun.l@email.com',
  website: 'www.noppakundesign.com',
  bankName: 'ธนาคารกสิกรไทย',
  bankAccountName: 'นพคุณ เลิศวิจิตรเดชา',
  bankAccountNumber: '012-3-45678-9',
  signatureName: 'นพคุณ เลิศวิจิตรเดชา',
  useVat: false,
  vatRate: 7,
  useWithholdingTax: true,
  withholdingTaxRate: 3, // 3% withholding for individual service standard
};

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'c-1',
    name: 'บริษัท ทวีผล การค้า จำกัด (สำนักงานใหญ่)',
    taxId: '0105560012345',
    address: '123 ซอยสีลม 5 ถนนสีลม แขวงสุริยวงศ์ เขตบางรัก กรุงเทพมหานคร 10500',
    phone: '021112222',
    email: 'contact@taweephol.co.th',
    notes: 'ลูกค้าประจำ ชำระเงินตรงเวลา',
  },
  {
    id: 'c-2',
    name: 'สถาบันสอนภาษาอังกฤษ เกรทฟิวเจอร์',
    taxId: '0994001234567',
    address: '888 อาคารเพรสทีจ ชั้น 12 ถนนพญาไท แขวงถนนพญาไท เขตราชเทวี กรุงเทพมหานคร 10400',
    phone: '0898765432',
    email: 'info@greatfuture.edu',
    notes: 'ออกเอกสารในนามสถาบัน',
  },
];

export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'p-1',
    name: 'บริการออกแบบกราฟิกและแบรนดิ้ง (Graphic & Branding Design)',
    price: 15000,
    unit: 'โปรเจกต์',
  },
  {
    id: 'p-2',
    name: 'บริการพัฒนาเว็บบอร์ดและหน้าเว็บองค์กร (Web Development)',
    price: 35000,
    unit: 'โปรเจกต์',
  },
  {
    id: 'p-3',
    name: 'ค่าบริการดูแลระบบรายเดือน (Website Maintenance)',
    price: 3500,
    unit: 'เดือน',
  },
  {
    id: 'p-4',
    name: 'บริการเขียนบทความและทำคอนเทนต์ (Content Creation)',
    price: 1200,
    unit: 'บทความ',
  },
];

export const INITIAL_DOCUMENTS: FinanceDocument[] = [
  {
    id: 'doc-1',
    documentType: 'QUOTATION',
    documentNumber: 'QT-2607-0001',
    date: '2026-07-01',
    dueDate: '2026-07-15',
    clientId: 'c-1',
    clientDetails: INITIAL_CLIENTS[0],
    ownerDetails: DEFAULT_OWNER,
    items: [
      {
        id: 'li-1',
        description: 'บริการออกแบบกราฟิกและแบรนดิ้ง (Graphic & Branding Design)',
        quantity: 1,
        pricePerUnit: 15000,
        unit: 'โปรเจกต์',
        total: 15000,
      },
      {
        id: 'li-2',
        description: 'ค่าบริการดูแลระบบรายเดือน (Website Maintenance)',
        quantity: 3,
        pricePerUnit: 3500,
        unit: 'เดือน',
        total: 10500,
      }
    ],
    discount: 1000,
    isVatEnabled: false,
    vatRate: 7,
    isWithholdingTaxEnabled: true,
    withholdingTaxRate: 3,
    status: 'paid',
    notes: 'ขอบคุณที่ใช้บริการครับ ชำระเงินมัดจำ 50% ก่อนเริ่มงาน',
    paymentBankName: 'ธนาคารกสิกรไทย',
    paymentBankAccountName: 'นพคุณ เลิศวิจิตรเดชา',
    paymentBankAccountNumber: '012-3-45678-9',
    createdAt: '2026-07-01T08:00:00.000Z',
  },
  {
    id: 'doc-2',
    documentType: 'INVOICE',
    documentNumber: 'IV-2607-0001',
    date: '2026-07-10',
    dueDate: '2026-07-31',
    referenceNumber: 'QT-2607-0001',
    clientId: 'c-2',
    clientDetails: INITIAL_CLIENTS[1],
    ownerDetails: DEFAULT_OWNER,
    items: [
      {
        id: 'li-3',
        description: 'บริการพัฒนาเว็บบอร์ดและหน้าเว็บองค์กร (Web Development)',
        quantity: 1,
        pricePerUnit: 35000,
        unit: 'โปรเจกต์',
        total: 35000,
      }
    ],
    discount: 0,
    isVatEnabled: false,
    vatRate: 7,
    isWithholdingTaxEnabled: true,
    withholdingTaxRate: 3,
    status: 'pending',
    notes: 'กำหนดชำระภายในวันที่ 31 กรกฎาคม 2569',
    paymentBankName: 'ธนาคารกสิกรไทย',
    paymentBankAccountName: 'นพคุณ เลิศวิจิตรเดชา',
    paymentBankAccountNumber: '012-3-45678-9',
    createdAt: '2026-07-10T10:30:00.000Z',
  }
];

// LocalStorage Handlers
export function loadOwnerProfile(): OwnerProfile {
  const data = localStorage.getItem('owner_profile');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
  }
  return DEFAULT_OWNER;
}

export function saveOwnerProfile(profile: OwnerProfile): void {
  localStorage.setItem('owner_profile', JSON.stringify(profile));
}

export function loadClients(): Client[] {
  const data = localStorage.getItem('clients_list');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
  }
  return INITIAL_CLIENTS;
}

export function saveClients(clients: Client[]): void {
  localStorage.setItem('clients_list', JSON.stringify(clients));
}

export function loadProducts(): ProductItem[] {
  const data = localStorage.getItem('products_list');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
  }
  return INITIAL_PRODUCTS;
}

export function saveProducts(products: ProductItem[]): void {
  localStorage.setItem('products_list', JSON.stringify(products));
}

export function loadDocuments(): FinanceDocument[] {
  const data = localStorage.getItem('documents_list');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
  }
  return INITIAL_DOCUMENTS;
}

export function saveDocuments(documents: FinanceDocument[]): void {
  localStorage.setItem('documents_list', JSON.stringify(documents));
}

// Calculate Document Financial Summaries
export interface DocumentSummary {
  subtotal: number; // Sum of line items
  discountedSubtotal: number; // Subtotal - Discount
  vatAmount: number; // If VAT enabled: discountedSubtotal * (vatRate / 100)
  totalAmount: number; // discountedSubtotal + vatAmount
  withholdingTaxAmount: number; // If WT enabled: discountedSubtotal * (withholdingTaxRate / 100)
  amountToPay: number; // totalAmount - withholdingTaxAmount
}

export function calculateDocumentSummary(doc: {
  items: { quantity: number; pricePerUnit: number }[];
  discount: number;
  isVatEnabled: boolean;
  vatRate: number;
  isWithholdingTaxEnabled: boolean;
  withholdingTaxRate: number;
}): DocumentSummary {
  const subtotal = doc.items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
  const discountedSubtotal = Math.max(0, subtotal - doc.discount);
  
  const vatAmount = doc.isVatEnabled 
    ? discountedSubtotal * (doc.vatRate / 100) 
    : 0;

  const totalAmount = discountedSubtotal + vatAmount;

  const withholdingTaxAmount = doc.isWithholdingTaxEnabled 
    ? discountedSubtotal * (doc.withholdingTaxRate / 100) 
    : 0;

  const amountToPay = totalAmount - withholdingTaxAmount;

  return {
    subtotal,
    discountedSubtotal,
    vatAmount,
    totalAmount,
    withholdingTaxAmount,
    amountToPay,
  };
}

import React, { useState, useEffect } from 'react';
import { FinanceDocument, DocumentType, Client, ProductItem, LineItem, OwnerProfile } from '../types';
import { generateDocumentNumber, calculateDocumentSummary, formatCurrency } from '../utils';
import { Plus, Trash2, Save, FileText, Calendar, Users, Briefcase, DollarSign, RefreshCw, X, AlertCircle } from 'lucide-react';

interface DocumentFormProps {
  documentToEdit?: FinanceDocument | null;
  clients: Client[];
  products: ProductItem[];
  ownerProfile: OwnerProfile;
  lastDocCounts: Record<DocumentType, number>;
  onSave: (doc: FinanceDocument) => void;
  onCancel: () => void;
}

export default function DocumentForm({
  documentToEdit,
  clients,
  products,
  ownerProfile,
  lastDocCounts,
  onSave,
  onCancel
}: DocumentFormProps) {
  
  // Primary state variables
  const [docType, setDocType] = useState<DocumentType>('QUOTATION');
  const [docNumber, setDocNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [customClient, setCustomClient] = useState<Partial<Client>>({
    name: '', taxId: '', address: '', phone: '', email: ''
  });
  const [isCustomClient, setIsCustomClient] = useState(false);
  
  // Items in the invoice
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: 'item-init-1', description: '', quantity: 1, pricePerUnit: 0, unit: 'งาน', total: 0 }
  ]);

  // Financial conditions
  const [discount, setDiscount] = useState(0);
  const [isVatEnabled, setIsVatEnabled] = useState(ownerProfile.useVat);
  const [vatRate, setVatRate] = useState(ownerProfile.vatRate);
  const [isWithholdingTaxEnabled, setIsWithholdingTaxEnabled] = useState(ownerProfile.useWithholdingTax);
  const [withholdingTaxRate, setWithholdingTaxRate] = useState(ownerProfile.withholdingTaxRate);
  const [status, setStatus] = useState<FinanceDocument['status']>('draft');
  const [notes, setNotes] = useState('');

  // Auto-generate document numbers when type or date changes
  useEffect(() => {
    if (!documentToEdit) {
      const count = lastDocCounts[docType] || 0;
      const num = generateDocumentNumber(docType, count);
      setDocNumber(num);
    }
  }, [docType, documentToEdit, lastDocCounts]);

  // Pre-populate data if editing
  useEffect(() => {
    if (documentToEdit) {
      setDocType(documentToEdit.documentType);
      setDocNumber(documentToEdit.documentNumber);
      setDate(documentToEdit.date);
      setDueDate(documentToEdit.dueDate || '');
      setReferenceNumber(documentToEdit.referenceNumber || '');
      
      const clientExists = clients.some(c => c.id === documentToEdit.clientId);
      if (clientExists) {
        setSelectedClientId(documentToEdit.clientId);
        setIsCustomClient(false);
      } else {
        setSelectedClientId('custom');
        setIsCustomClient(true);
        setCustomClient(documentToEdit.clientDetails);
      }

      setLineItems(documentToEdit.items);
      setDiscount(documentToEdit.discount);
      setIsVatEnabled(documentToEdit.isVatEnabled);
      setVatRate(documentToEdit.vatRate);
      setIsWithholdingTaxEnabled(documentToEdit.isWithholdingTaxEnabled);
      setWithholdingTaxRate(documentToEdit.withholdingTaxRate);
      setStatus(documentToEdit.status);
      setNotes(documentToEdit.notes || '');
    } else {
      // Set default note based on type
      if (docType === 'QUOTATION') {
        setNotes('กำหนดยืนราคา 30 วันนับจากวันที่ออกใบเสนอราคา\nชำระเงินมัดจำ 50% ก่อนเริ่มปฏิบัติงาน');
      } else if (docType === 'INVOICE' || docType === 'BILLING') {
        setNotes('กรุณาชำระเงินภายในกำหนดเพื่อความต่อเนื่องในการบริการ\nโอนเงินแล้วกรุณาส่งหลักฐานให้ผู้จัดทำทราบ');
      } else {
        setNotes('ได้รับเงินถูกต้องเรียบร้อยแล้ว ขอบคุณที่ไว้วางใจใช้บริการครับ');
      }
    }
  }, [documentToEdit, docType, clients]);

  // Adjust due date default: +15 days
  useEffect(() => {
    if (date && !dueDate && !documentToEdit) {
      const d = new Date(date);
      d.setDate(d.getDate() + 15);
      setDueDate(d.toISOString().split('T')[0]);
    }
  }, [date, dueDate, documentToEdit]);

  // Financial calculations
  const summary = calculateDocumentSummary({
    items: lineItems,
    discount,
    isVatEnabled,
    vatRate,
    isWithholdingTaxEnabled,
    withholdingTaxRate
  });

  // Handle Client Change
  const handleClientSelection = (clientId: string) => {
    setSelectedClientId(clientId);
    if (clientId === 'custom') {
      setIsCustomClient(true);
    } else {
      setIsCustomClient(false);
      const client = clients.find(c => c.id === clientId);
      if (client) {
        setCustomClient({ ...client });
      }
    }
  };

  // Add line item from scratch
  const addBlankLineItem = () => {
    setLineItems(prev => [
      ...prev,
      {
        id: `li-edit-${Date.now()}`,
        description: '',
        quantity: 1,
        pricePerUnit: 0,
        unit: 'ชิ้น',
        total: 0
      }
    ]);
  };

  // Import line item from predefined services
  const addPredefinedItem = (item: ProductItem) => {
    setLineItems(prev => {
      // If the first item is empty and unused, replace it
      if (prev.length === 1 && prev[0].description === '' && prev[0].pricePerUnit === 0) {
        return [{
          id: `li-edit-${Date.now()}`,
          description: item.name,
          quantity: 1,
          pricePerUnit: item.price,
          unit: item.unit,
          total: item.price
        }];
      }
      return [
        ...prev,
        {
          id: `li-edit-${Date.now()}`,
          description: item.name,
          quantity: 1,
          pricePerUnit: item.price,
          unit: item.unit,
          total: item.price
        }
      ];
    });
  };

  // Update Line Item Values
  const handleLineItemChange = (index: number, field: keyof Omit<LineItem, 'id' | 'total'>, value: string | number) => {
    setLineItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      
      const updated = { ...item, [field]: value };
      
      // Keep number fields safe
      const qty = field === 'quantity' ? (Number(value) || 0) : item.quantity;
      const price = field === 'pricePerUnit' ? (Number(value) || 0) : item.pricePerUnit;
      updated.total = qty * price;
      
      return updated;
    }));
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) {
      setLineItems([{ id: 'item-init-1', description: '', quantity: 1, pricePerUnit: 0, unit: 'ชิ้น', total: 0 }]);
    } else {
      setLineItems(prev => prev.filter((_, idx) => idx !== index));
    }
  };

  // Save/Form Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    let finalClient: Client;
    if (isCustomClient) {
      if (!customClient.name || !customClient.address) {
        alert('กรุณากรอกชื่อและที่อยู่ลูกค้า');
        return;
      }
      finalClient = {
        id: `c-custom-${Date.now()}`,
        name: customClient.name,
        taxId: customClient.taxId || '',
        address: customClient.address,
        phone: customClient.phone || '',
        email: customClient.email || '',
      };
    } else {
      const selected = clients.find(c => c.id === selectedClientId);
      if (!selected) {
        alert('กรุณาเลือกหรือกรอกข้อมูลลูกค้า');
        return;
      }
      finalClient = selected;
    }

    // Line items validation
    const validItems = lineItems.filter(item => item.description.trim() !== '');
    if (validItems.length === 0) {
      alert('กรุณากรอกรายละเอียดของรายการบริการ/สินค้าอย่างน้อย 1 รายการ');
      return;
    }

    const documentData: FinanceDocument = {
      id: documentToEdit?.id || `doc-${Date.now()}`,
      documentType: docType,
      documentNumber: docNumber,
      date,
      dueDate: (docType === 'INVOICE' || docType === 'BILLING') ? dueDate : undefined,
      referenceNumber: referenceNumber || undefined,
      clientId: finalClient.id,
      clientDetails: finalClient,
      ownerDetails: ownerProfile, // Capture owner info current state!
      items: validItems.map(item => ({
        ...item,
        total: item.quantity * item.pricePerUnit
      })),
      discount,
      isVatEnabled,
      vatRate,
      isWithholdingTaxEnabled,
      withholdingTaxRate,
      status,
      notes,
      paymentBankName: ownerProfile.bankName,
      paymentBankAccountName: ownerProfile.bankAccountName,
      paymentBankAccountNumber: ownerProfile.bankAccountNumber,
      createdAt: documentToEdit?.createdAt || new Date().toISOString()
    };

    onSave(documentData);
  };

  return (
    <form onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-slate-700" id="document-form-editor">
      
      {/* ฝั่งซ้าย: ข้อมูลฟอร์มเอกสารหลัก */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* ประเภทและเลขที่เอกสาร */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            ประเภทและเลขที่เอกสาร
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">ประเภทเอกสาร *</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocumentType)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
              >
                <option value="QUOTATION">ใบเสนอราคา (Quotation)</option>
                <option value="INVOICE">ใบแจ้งหนี้ (Invoice)</option>
                <option value="BILLING">ใบวางบิล / ใบแจ้งหนี้ (Billing)</option>
                <option value="RECEIPT">ใบเสร็จรับเงิน (Receipt)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">เลขที่เอกสาร *</label>
              <input
                type="text"
                required
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="เช่น QT-2607-0001"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">สถานะเอกสาร</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FinanceDocument['status'])}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-slate-400"
              >
                <option value="draft">แบบร่าง (Draft)</option>
                <option value="pending">รอชำระเงิน (Pending)</option>
                <option value="paid">ชำระเงินแล้ว (Paid)</option>
                <option value="cancelled">ยกเลิก (Cancelled)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">วันที่เอกสาร *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Calendar className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>

            {(docType === 'INVOICE' || docType === 'BILLING') && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">วันครบกำหนดชำระ</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Calendar className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">อ้างอิงเอกสารอื่น (ถ้ามี)</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="เช่น ใบเสนอราคาเลขที่ QT-2607-001"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>
        </div>

        {/* ข้อมูลลูกค้า */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            ข้อมูลผู้ว่าจ้าง / ลูกค้า
          </h3>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">เลือกจากรายชื่อที่มี *</label>
            <select
              value={selectedClientId}
              onChange={(e) => handleClientSelection(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-slate-400"
            >
              <option value="">-- กรุณาเลือกรายชื่อลูกค้า --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              <option value="custom">✍️ พิมพ์ข้อมูลลูกค้าใหม่สำหรับเอกสารนี้...</option>
            </select>
          </div>

          {(isCustomClient || selectedClientId) && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {isCustomClient ? 'ข้อมูลลูกค้าพิมพ์ใหม่' : 'พรีวิวข้อมูลลูกค้า'}
                </span>
                {isCustomClient && (
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                    เฉพาะเอกสารนี้
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-slate-400 mb-1">ชื่อลูกค้า / บริษัท *</label>
                  <input
                    type="text"
                    required
                    disabled={!isCustomClient}
                    value={customClient.name || ''}
                    onChange={(e) => setCustomClient(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="เช่น บริษัท ยิ่งใหญ่โฆษณา จำกัด"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 disabled:opacity-70 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-400 mb-1">เลขผู้เสียภาษี 13 หลัก</label>
                  <input
                    type="text"
                    disabled={!isCustomClient}
                    maxLength={13}
                    value={customClient.taxId || ''}
                    onChange={(e) => setCustomClient(prev => ({ ...prev, taxId: e.target.value }))}
                    placeholder="เช่น 0105560000000"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 disabled:opacity-70 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-400 mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    disabled={!isCustomClient}
                    value={customClient.phone || ''}
                    onChange={(e) => setCustomClient(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="เช่น 0812345678"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 disabled:opacity-70 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-400 mb-1">อีเมล</label>
                  <input
                    type="email"
                    disabled={!isCustomClient}
                    value={customClient.email || ''}
                    onChange={(e) => setCustomClient(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="เช่น client@email.com"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 disabled:opacity-70 disabled:bg-slate-50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-medium text-slate-400 mb-1">ที่อยู่ผู้เสียภาษี / ที่อยู่จัดส่ง *</label>
                  <textarea
                    required
                    disabled={!isCustomClient}
                    rows={2}
                    value={customClient.address || ''}
                    onChange={(e) => setCustomClient(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="ที่อยู่เต็มตามจดทะเบียน..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 disabled:opacity-70 disabled:bg-slate-50"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ตารางจัดรายการรายละเอียดในบิล */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-500" />
              รายละเอียดรายการและบริการ
            </h3>
            <button
              type="button"
              onClick={addBlankLineItem}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              เพิ่มรายการว่าง
            </button>
          </div>

          {/* พรีเซ็ตบริการแนะนำคลิกดึงข้อมูลทันที */}
          {products.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-400">ดึงด่วนจากแคตตาล็อกสินค้า/บริการของคุณ:</span>
              <div className="flex flex-wrap gap-1.5">
                {products.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addPredefinedItem(p)}
                    className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60 rounded-full text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>+ {p.name.length > 30 ? p.name.substring(0, 30) + '...' : p.name}</span>
                    <strong className="text-slate-800">({formatCurrency(p.price)}.-)</strong>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* บล็อกจัดเรียง Line Items */}
          <div className="space-y-3 pt-3">
            {lineItems.map((item, index) => (
              <div key={item.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/30 flex flex-col md:flex-row gap-3 items-start animate-fadeIn">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 mt-1 md:mt-2">
                  {index + 1}
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 w-full text-xs">
                  <div className="md:col-span-6">
                    <label className="block text-[10px] text-slate-400 mb-0.5">รายละเอียดบริการ/สินค้า *</label>
                    <textarea
                      required
                      rows={1}
                      value={item.description}
                      onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                      placeholder="เช่น ออกแบบโลโก้บริษัท และจัดทำแบนเนอร์หน้าเพจ"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-slate-400 mb-0.5">จำนวน *</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 font-mono text-center"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-slate-400 mb-0.5">หน่วยนับ</label>
                    <input
                      type="text"
                      required
                      value={item.unit}
                      onChange={(e) => handleLineItemChange(index, 'unit', e.target.value)}
                      placeholder="เช่น โปรเจกต์"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 text-center"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-slate-400 mb-0.5">ราคาต่อหน่วย *</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={item.pricePerUnit}
                      onChange={(e) => handleLineItemChange(index, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 font-mono text-right"
                    />
                  </div>
                </div>

                <div className="flex-shrink-0 self-center md:self-end flex items-center justify-between w-full md:w-auto gap-3 pt-2 md:pt-0">
                  <div className="text-right pr-2">
                    <span className="text-[10px] text-slate-400 block">รวมบรรทัดนี้</span>
                    <strong className="text-slate-800 text-sm font-mono">{formatCurrency(item.total)} บาท</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLineItem(index)}
                    className="p-2 border border-red-50 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="ลบรายการนี้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ข้อมูลบัญชีธนาคารรับเงินและหมายเหตุ */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-slate-500" />
            ข้อมูลรับเงินและหมายเหตุเงื่อนไข
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 block">บัญชีธนาคารสำหรับจ่ายเงิน:</span>
              <strong className="text-xs text-slate-700 block mt-0.5">{ownerProfile.bankName}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">เลขบัญชีรับโอนเงิน:</span>
              <strong className="text-xs text-slate-700 block mt-0.5 font-mono">{ownerProfile.bankAccountNumber}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">ชื่อในบัญชีธนาคาร:</span>
              <strong className="text-xs text-slate-700 block mt-0.5">{ownerProfile.bankAccountName}</strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">เงื่อนไขการชำระเงิน หรือหมายเหตุ (จะแสดงบนเอกสารพิมพ์)</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ระบุเงื่อนไขการส่งมอบงาน หรือรายละเอียดสำหรับชำระเงินเพิ่มเติม..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
            />
          </div>
        </div>

      </div>

      {/* ฝั่งขวา: รายละเอียดภาษีและการสรุปเงิน (Sticky Panel) */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* กล่องตั้งค่าภาษีสำหรับบิลนี้โดยเฉพาะ */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 sticky top-6">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-50">
            📊 สรุปยอดเงินและภาษีในบิลนี้
          </h4>

          <div className="space-y-4">
            {/* ปรับส่วนลดเพิ่มเติม */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">ส่วนลดส่วนลดเงินสด (บาท)</label>
              <input
                type="number"
                min={0}
                value={discount || ''}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:border-slate-400 text-right font-semibold"
              />
            </div>

            {/* การตั้งค่า VAT และ Withholding Tax สำหรับเอกสารชุดนี้ */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="doc-vat-checkbox"
                    checked={isVatEnabled}
                    onChange={(e) => setIsVatEnabled(e.target.checked)}
                    className="rounded border-slate-300 text-slate-800 focus:ring-slate-500"
                  />
                  <label htmlFor="doc-vat-checkbox" className="text-xs font-semibold text-slate-600">ภาษีมูลค่าเพิ่ม (VAT)</label>
                </div>
                {isVatEnabled && (
                  <div className="flex items-center gap-1 text-xs">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={vatRate}
                      onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                      className="w-12 px-1 py-0.5 border border-slate-200 rounded text-center text-xs font-mono"
                    />
                    <span>%</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="doc-wt-checkbox"
                    checked={isWithholdingTaxEnabled}
                    onChange={(e) => setIsWithholdingTaxEnabled(e.target.checked)}
                    className="rounded border-slate-300 text-slate-800 focus:ring-slate-500"
                  />
                  <label htmlFor="doc-wt-checkbox" className="text-xs font-semibold text-slate-600">หักภาษี ณ ที่จ่าย (WHT)</label>
                </div>
                {isWithholdingTaxEnabled && (
                  <div className="flex items-center gap-1 text-xs">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={withholdingTaxRate}
                      onChange={(e) => setWithholdingTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-12 px-1 py-0.5 border border-slate-200 rounded text-center text-xs font-mono"
                    />
                    <span>%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* สรุปรายการเงินเรียงบรรทัดอย่างละเอียด */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">รวมค่าบริการ (ก่อนหักลด):</span>
              <span className="font-mono">{formatCurrency(summary.subtotal)} บาท</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-red-600 font-medium">
                <span>ส่วนลดสินค้า:</span>
                <span className="font-mono">-{formatCurrency(discount)} บาท</span>
              </div>
            )}

            {isVatEnabled && (
              <div className="flex justify-between">
                <span className="text-slate-500">ภาษีมูลค่าเพิ่ม ({vatRate}%):</span>
                <span className="font-mono">{formatCurrency(summary.vatAmount)} บาท</span>
              </div>
            )}

            <div className="flex justify-between font-semibold text-slate-800 border-t border-slate-50 pt-1.5">
              <span>รวมยอดขายสุทธิ:</span>
              <span className="font-mono">{formatCurrency(summary.totalAmount)} บาท</span>
            </div>

            {isWithholdingTaxEnabled && (
              <div className="flex justify-between text-amber-700">
                <span>หักภาษี ณ ที่จ่าย ({withholdingTaxRate}%):</span>
                <span className="font-mono">-{formatCurrency(summary.withholdingTaxAmount)} บาท</span>
              </div>
            )}

            <div className="flex justify-between border-t-2 border-slate-800 pt-2 text-sm font-extrabold text-slate-900 bg-slate-50 p-2.5 rounded-xl">
              <span>เงินรับสุทธิ (Net):</span>
              <span className="font-mono text-base">{formatCurrency(summary.amountToPay)} บาท</span>
            </div>
          </div>

          {/* ปุ่มควบคุมล่างสุดของฟอร์ม */}
          <div className="space-y-2 pt-4">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              บันทึกข้อมูลเอกสาร
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-medium transition-colors cursor-pointer"
            >
              ยกเลิก / ย้อนกลับ
            </button>
          </div>
        </div>

      </div>

    </form>
  );
}

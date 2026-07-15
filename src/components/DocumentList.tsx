import React, { useState } from 'react';
import { FinanceDocument, DocumentType } from '../types';
import { formatCurrency, formatThaiDate, calculateDocumentSummary, generateDocumentNumber, saveDocuments } from '../utils';
import { 
  Search, Eye, Edit, Trash2, Copy, FileText, 
  CheckCircle, Clock, AlertTriangle, ArrowRightLeft, Plus
} from 'lucide-react';

interface DocumentListProps {
  documents: FinanceDocument[];
  onView: (doc: FinanceDocument) => void;
  onEdit: (doc: FinanceDocument) => void;
  onDelete: (id: string) => void;
  onConvert: (sourceDoc: FinanceDocument, targetType: DocumentType) => void;
  onAddNew: () => void;
}

export default function DocumentList({
  documents,
  onView,
  onEdit,
  onDelete,
  onConvert,
  onAddNew
}: DocumentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | DocumentType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | FinanceDocument['status']>('ALL');

  // Filter documents
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = 
      doc.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.clientDetails.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.items.some(item => item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === 'ALL' || doc.documentType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || doc.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by newest date

  // Duplicate Document
  const handleDuplicate = (doc: FinanceDocument) => {
    if (confirm(`คุณต้องการคัดลอก (ทำซ้ำ) เอกสารเลขที่ "${doc.documentNumber}" ใช่หรือไม่?`)) {
      const duplicatedDoc: FinanceDocument = {
        ...doc,
        id: `doc-${Date.now()}`,
        documentNumber: `${doc.documentNumber}-COPY`,
        date: new Date().toISOString().split('T')[0],
        status: 'draft',
        createdAt: new Date().toISOString()
      };
      const updatedDocs = [...documents, duplicatedDoc];
      saveDocuments(updatedDocs);
      // Trigger update by reloading or updating parent state. Since we can just let parents handle the list, let's call onEdit to open it!
      onEdit(duplicatedDoc);
    }
  };

  const getBadgeTypeColor = (type: DocumentType) => {
    switch (type) {
      case 'QUOTATION':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'INVOICE':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'BILLING':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'RECEIPT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }
  };

  const getDocTypeThaiName = (type: DocumentType) => {
    switch (type) {
      case 'QUOTATION': return 'ใบเสนอราคา';
      case 'INVOICE': return 'ใบแจ้งหนี้';
      case 'BILLING': return 'ใบวางบิล';
      case 'RECEIPT': return 'ใบเสร็จรับเงิน';
    }
  };

  const getStatusBadge = (status: FinanceDocument['status']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            ชำระเงินแล้ว
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
            <Clock className="w-3 h-3 text-amber-600" />
            รอชำระเงิน
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            ยกเลิก
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-100">
            <FileText className="w-3 h-3 text-slate-500" />
            แบบร่าง
          </span>
        );
    }
  };

  return (
    <div className="space-y-4" id="documents-list-view">
      
      {/* แท็บและตัวคัดกรองหลัก */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        {/* ค้นหาและสร้างใหม่ */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="ค้นหาตามเลขที่บิล, ชื่อลูกค้า หรือรายการบริการ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-slate-400 text-slate-600"
            >
              <option value="ALL">ทุกสถานะการจ่ายเงิน</option>
              <option value="draft">แบบร่าง (Draft)</option>
              <option value="pending">รอชำระเงิน (Pending)</option>
              <option value="paid">ชำระเงินแล้ว (Paid)</option>
              <option value="cancelled">ยกเลิก (Cancelled)</option>
            </select>

            <button
              onClick={onAddNew}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer ml-auto"
            >
              <Plus className="w-4 h-4" />
              สร้างเอกสารใหม่
            </button>
          </div>
        </div>

        {/* แท็บกรองประเภทเอกสาร */}
        <div className="flex border-b border-slate-100 overflow-x-auto gap-2 pb-0.5 scrollbar-thin">
          {[
            { id: 'ALL', label: 'เอกสารทั้งหมด' },
            { id: 'QUOTATION', label: 'ใบเสนอราคา (Quotation)' },
            { id: 'INVOICE', label: 'ใบแจ้งหนี้ (Invoice)' },
            { id: 'BILLING', label: 'ใบวางบิล (Billing Note)' },
            { id: 'RECEIPT', label: 'ใบเสร็จรับเงิน (Receipt)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id as any)}
              className={`px-4 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                typeFilter === tab.id
                  ? 'border-slate-800 text-slate-800 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* รายการตารางเอกสาร */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-100 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3.5 w-32">เลขที่เอกสาร</th>
                <th className="px-6 py-3.5 w-28">ประเภท</th>
                <th className="px-6 py-3.5">วันที่เอกสาร</th>
                <th className="px-6 py-3.5">ชื่อลูกค้า</th>
                <th className="px-6 py-3.5 text-right">ยอดเงินรับสุทธิ (บาท)</th>
                <th className="px-6 py-3.5">สถานะ</th>
                <th className="px-6 py-3.5 text-right">จัดการเอกสาร</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => {
                  const summary = calculateDocumentSummary(doc);
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900 text-xs">
                        {doc.documentNumber}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getBadgeTypeColor(doc.documentType)}`}>
                          {getDocTypeThaiName(doc.documentType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                        {formatThaiDate(doc.date, true)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 text-xs max-w-xs truncate" title={doc.clientDetails.name}>
                          {doc.clientDetails.name}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(summary.amountToPay)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(doc.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-xs">
                          {/* ปุ่มพรีวิวพิมพ์ */}
                          <button
                            onClick={() => onView(doc)}
                            className="p-1.5 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                            title="เปิดดูและพิมพ์บิล"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* ปุ่มแก้ไข */}
                          <button
                            onClick={() => onEdit(doc)}
                            className="p-1.5 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
                            title="แก้ไขข้อมูลบิล"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* ปุ่มทำซ้ำเอกสาร */}
                          <button
                            onClick={() => handleDuplicate(doc)}
                            className="p-1.5 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
                            title="คัดลอกทำซ้ำ"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* ปุ่มแปลงประเภทเอกสาร */}
                          <div className="relative group">
                            <button
                              className="p-1.5 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-md transition-colors cursor-pointer flex items-center"
                              title="แปลงประเภทเอกสาร"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                            {/* ดรอปดาวน์เปลี่ยนรูปแบบบิลรวดเร็ว */}
                            <div className="hidden group-hover:block absolute right-0 bottom-full mb-1 bg-white border border-slate-100 shadow-xl rounded-lg py-1 w-44 text-left z-20 animate-fadeIn">
                              <p className="text-[10px] text-slate-400 px-3 py-1 border-b border-slate-50 font-bold uppercase tracking-wider">
                                แปลงเอกสารชุดนี้เป็น:
                              </p>
                              {doc.documentType !== 'QUOTATION' && (
                                <button
                                  onClick={() => onConvert(doc, 'QUOTATION')}
                                  className="w-full text-xs px-3 py-1.5 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer text-left font-medium block"
                                >
                                  ใบเสนอราคา (Quotation)
                                </button>
                              )}
                              {doc.documentType !== 'INVOICE' && (
                                <button
                                  onClick={() => onConvert(doc, 'INVOICE')}
                                  className="w-full text-xs px-3 py-1.5 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer text-left font-medium block"
                                >
                                  ใบแจ้งหนี้ (Invoice)
                                </button>
                              )}
                              {doc.documentType !== 'BILLING' && (
                                <button
                                  onClick={() => onConvert(doc, 'BILLING')}
                                  className="w-full text-xs px-3 py-1.5 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer text-left font-medium block"
                                >
                                  ใบวางบิล (Billing Note)
                                </button>
                              )}
                              {doc.documentType !== 'RECEIPT' && (
                                <button
                                  onClick={() => onConvert(doc, 'RECEIPT')}
                                  className="w-full text-xs px-3 py-1.5 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer text-left font-medium block"
                                >
                                  ใบเสร็จรับเงิน (Receipt)
                                </button>
                              )}
                            </div>
                          </div>

                          {/* ปุ่มลบ */}
                          <button
                            onClick={() => onDelete(doc.id)}
                            className="p-1.5 border border-red-50 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            title="ลบเอกสาร"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold">ไม่พบเอกสารทางการเงิน</p>
                    <p className="text-xs text-slate-400 mt-1">ลองเริ่มสร้างโดยกดปุ่ม "สร้างเอกสารใหม่" ด้านบน</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

import React from 'react';
import { FinanceDocument, Client, ProductItem } from '../types';
import { calculateDocumentSummary, formatCurrency, formatThaiDate } from '../utils';
import { 
  TrendingUp, CheckCircle, Clock, FileText, 
  Users, Briefcase, ChevronRight, Landmark 
} from 'lucide-react';

interface DashboardProps {
  documents: FinanceDocument[];
  clients: Client[];
  products: ProductItem[];
  onViewDoc: (doc: FinanceDocument) => void;
  onNavigateToTab: (tab: string) => void;
  onClearAllData?: () => void;
}

export default function Dashboard({
  documents,
  clients,
  products,
  onViewDoc,
  onNavigateToTab,
  onClearAllData
}: DashboardProps) {
  
  // Detect if system is currently loaded with initial mock sample data
  const hasSampleData = documents.some(d => d.id === 'doc-1' || d.id === 'doc-2') || 
                        clients.some(c => c.id === 'c-1' || c.id === 'c-2') ||
                        products.some(p => p.id === 'p-1' || p.id === 'p-2');

  // Calculate statistics
  const totalVolume = documents
    .filter(d => d.status !== 'cancelled')
    .reduce((sum, doc) => sum + calculateDocumentSummary(doc).amountToPay, 0);

  const totalPaid = documents
    .filter(d => d.status === 'paid')
    .reduce((sum, doc) => sum + calculateDocumentSummary(doc).amountToPay, 0);

  const totalPending = documents
    .filter(d => d.status === 'pending')
    .reduce((sum, doc) => sum + calculateDocumentSummary(doc).amountToPay, 0);

  const totalDraft = documents
    .filter(d => d.status === 'draft')
    .reduce((sum, doc) => sum + calculateDocumentSummary(doc).amountToPay, 0);

  // Recent 5 documents
  const recentDocs = [...documents]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Group document counts by status
  const statusCounts = {
    paid: documents.filter(d => d.status === 'paid').length,
    pending: documents.filter(d => d.status === 'pending').length,
    draft: documents.filter(d => d.status === 'draft').length,
    cancelled: documents.filter(d => d.status === 'cancelled').length,
  };

  const totalCount = documents.length;

  // Group document counts by type
  const typeCounts = {
    QUOTATION: documents.filter(d => d.documentType === 'QUOTATION').length,
    INVOICE: documents.filter(d => d.documentType === 'INVOICE').length,
    BILLING: documents.filter(d => d.documentType === 'BILLING').length,
    RECEIPT: documents.filter(d => d.documentType === 'RECEIPT').length,
  };

  return (
    <div className="space-y-6" id="dashboard-tab">
      
      {/* ส่วนแนะนำสำหรับเริ่มใช้งานจริงเมื่อพบข้อมูลตัวอย่าง */}
      {hasSampleData && onClearAllData && (
        <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fadeIn shadow-xs">
          <div className="space-y-1">
            <span className="text-sm font-bold text-amber-800 flex items-center gap-1.5">
              💡 แนะนำ: ระบบกำลังใช้ข้อมูลตัวอย่างเพื่อการทดลองใช้งาน
            </span>
            <p className="text-xs text-amber-700 font-medium max-w-3xl leading-relaxed">
              คุณสามารถกดปุ่มล้างข้อมูลตัวอย่างเพื่อทำการล้างข้อมูลลูกค้า รายการสินค้า และเอกสารจำลองทั้งหมด 
              พร้อมเริ่มตั้งค่าข้อมูลผู้ประกอบการของคุณเป็นรูปแบบเริ่มต้นเพื่อความสะดวกในการป้อนข้อมูลจริงได้ทันทีครับ
            </p>
          </div>
          <button
            onClick={onClearAllData}
            className="shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            ล้างข้อมูลตัวอย่าง เพื่อเริ่มใช้งานจริง
          </button>
        </div>
      )}
      
      {/* ส่วนสถิติ 4 ช่อง */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* รวมยอดทั้งหมด */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 block">ยอดรวมธุรกรรมทั้งหมด</span>
            <span className="text-xl font-black text-slate-900 font-mono block">
              ฿{formatCurrency(totalVolume)}
            </span>
            <span className="text-[10px] text-slate-400 block">*ไม่รวมบิลที่ยกเลิก</span>
          </div>
          <div className="w-12 h-12 bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* ยอดชำระแล้ว */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 block">ชำระเงินเรียบร้อยแล้ว</span>
            <span className="text-xl font-black text-emerald-600 font-mono block">
              ฿{formatCurrency(totalPaid)}
            </span>
            <span className="text-[10px] text-emerald-500/80 block font-medium">
              ({statusCounts.paid} เอกสาร)
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* ยอดค้างชำระ */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 block">ยอดค้างชำระ (Pending)</span>
            <span className="text-xl font-black text-amber-600 font-mono block">
              ฿{formatCurrency(totalPending)}
            </span>
            <span className="text-[10px] text-amber-500/80 block font-medium">
              ({statusCounts.pending} เอกสาร)
            </span>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* เอกสารแบบร่าง */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 block">มูลค่าในแบบร่าง (Draft)</span>
            <span className="text-xl font-black text-slate-600 font-mono block">
              ฿{formatCurrency(totalDraft)}
            </span>
            <span className="text-[10px] text-slate-400 block font-medium">
              ({statusCounts.draft} เอกสาร)
            </span>
          </div>
          <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ส่วนกราฟจำลองและส่วนสรุปสถานะ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* สรุปสถานะเอกสารและการวิเคราะห์อย่างง่าย */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">สัดส่วนตามสถานะการเงิน</h3>
            <p className="text-xs text-slate-400">เปรียบเทียบสัดส่วนตามจำนวนเอกสารในระบบ</p>
          </div>

          {/* แถบกราฟแนวนอนแสดงสัดส่วนสะสม (Custom CSS horizontal bar) */}
          {totalCount > 0 ? (
            <div className="space-y-5">
              <div className="h-3 w-full bg-slate-100 rounded-full flex overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all" 
                  style={{ width: `${(statusCounts.paid / totalCount) * 100}%` }}
                  title={`ชำระแล้ว: ${statusCounts.paid}`}
                />
                <div 
                  className="bg-amber-500 h-full transition-all" 
                  style={{ width: `${(statusCounts.pending / totalCount) * 100}%` }}
                  title={`รอชำระ: ${statusCounts.pending}`}
                />
                <div 
                  className="bg-slate-400 h-full transition-all" 
                  style={{ width: `${(statusCounts.draft / totalCount) * 100}%` }}
                  title={`แบบร่าง: ${statusCounts.draft}`}
                />
                <div 
                  className="bg-red-400 h-full transition-all" 
                  style={{ width: `${(statusCounts.cancelled / totalCount) * 100}%` }}
                  title={`ยกเลิก: ${statusCounts.cancelled}`}
                />
              </div>

              {/* ป้ายคำอธิบาย */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-500">ชำระแล้ว ({statusCounts.paid})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-slate-500">รอชำระ ({statusCounts.pending})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="text-slate-500">แบบร่าง ({statusCounts.draft})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="text-slate-500">ยกเลิก ({statusCounts.cancelled})</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-100 rounded-xl">
              ยังไม่มีข้อมูลการเงินในการวิเคราะห์
            </div>
          )}

          <hr className="border-slate-100" />

          {/* สัดส่วนจำนวนเอกสารแยกตามประเภทการออกเอกสาร */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">จำนวนเอกสารแยกตามประเภท</h4>
            
            <div className="space-y-2 text-xs">
              {[
                { label: 'ใบเสนอราคา (Quotation)', count: typeCounts.QUOTATION, color: 'bg-blue-500' },
                { label: 'ใบแจ้งหนี้ (Invoice)', count: typeCounts.INVOICE, color: 'bg-purple-500' },
                { label: 'ใบวางบิล (Billing Note)', count: typeCounts.BILLING, color: 'bg-amber-500' },
                { label: 'ใบเสร็จรับเงิน (Receipt)', count: typeCounts.RECEIPT, color: 'bg-emerald-500' },
              ].map((item, idx) => {
                const percentage = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>{item.label}</span>
                      <strong className="text-slate-800">{item.count} ใบ</strong>
                    </div>
                    <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* รายการเอกสารล่าสุด 5 ฉบับ */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">เอกสารทำล่าสุดในระบบ</h3>
                <p className="text-xs text-slate-400">รายการเอกสารทางการเงิน 5 ลำดับล่าสุด</p>
              </div>
              <button 
                onClick={() => onNavigateToTab('documents')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-0.5 cursor-pointer"
              >
                ดูทั้งหมด
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-50">
              {recentDocs.length > 0 ? (
                recentDocs.map((doc) => {
                  const summary = calculateDocumentSummary(doc);
                  return (
                    <div 
                      key={doc.id} 
                      onClick={() => onViewDoc(doc)}
                      className="py-3 flex items-center justify-between hover:bg-slate-50/50 px-2 -mx-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-800">{doc.documentNumber}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            doc.documentType === 'QUOTATION' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                            doc.documentType === 'INVOICE' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                            doc.documentType === 'BILLING' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}>
                            {doc.documentType === 'QUOTATION' ? 'ใบเสนอราคา' :
                             doc.documentType === 'INVOICE' ? 'ใบแจ้งหนี้' :
                             doc.documentType === 'BILLING' ? 'ใบวางบิล' : 'ใบเสร็จ'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate max-w-xs">{doc.clientDetails.name}</p>
                      </div>

                      <div className="text-right">
                        <strong className="text-xs text-slate-900 font-mono block">
                          ฿{formatCurrency(summary.amountToPay)}
                        </strong>
                        <span className="text-[10px] text-slate-400">{formatThaiDate(doc.date, true)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  ไม่มีรายการเอกสารเพื่อแสดงผล
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-2 gap-4 text-xs">
            <div 
              onClick={() => onNavigateToTab('clients')}
              className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all cursor-pointer flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-slate-800 text-sm block font-mono">{clients.length}</strong>
                <span className="text-[10px] text-slate-400 block font-medium">ลูกค้าทั้งหมด</span>
              </div>
            </div>

            <div 
              onClick={() => onNavigateToTab('products')}
              className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all cursor-pointer flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-slate-800 text-sm block font-mono">{products.length}</strong>
                <span className="text-[10px] text-slate-400 block font-medium">รายการบริการ</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

import React, { useRef } from 'react';
import { FinanceDocument } from '../types';
import { 
  formatCurrency, 
  formatThaiDate, 
  formatIdCard, 
  formatPhone, 
  thaiBahtText,
  calculateDocumentSummary 
} from '../utils';
import { Printer, ArrowLeft, Download, CheckCircle, FileText, ExternalLink } from 'lucide-react';

interface DocumentPrintProps {
  document: FinanceDocument;
  onBack: () => void;
}

export default function DocumentPrint({ document, onBack }: DocumentPrintProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isInIframe, setIsInIframe] = React.useState(false);

  React.useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      setIsInIframe(true);
    }
  }, []);

  const summary = calculateDocumentSummary(document);

  const getDocTitle = () => {
    switch (document.documentType) {
      case 'QUOTATION':
        return { th: 'ใบเสนอราคา', en: 'QUOTATION' };
      case 'INVOICE':
        return { th: 'ใบแจ้งหนี้', en: 'INVOICE' };
      case 'BILLING':
        return { th: 'ใบวางบิล / ใบแจ้งหนี้', en: 'BILLING NOTE / INVOICE' };
      case 'RECEIPT':
        return { th: 'ใบเสร็จรับเงิน', en: 'RECEIPT' };
      default:
        return { th: 'เอกสารทางการเงิน', en: 'FINANCE DOCUMENT' };
    }
  };

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  const title = getDocTitle();

  return (
    <div className="space-y-6" id="document-print-view">
      {/* ส่วนหัวการควบคุม (จะถูกซ่อนเวลาพิมพ์จริงด้วย CSS @media print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3  py-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg text-sm transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          ย้อนกลับ
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            สถานะเอกสาร: 
            <strong className={`
              ${document.status === 'paid' ? 'text-emerald-600' : ''}
              ${document.status === 'pending' ? 'text-amber-600' : ''}
              ${document.status === 'draft' ? 'text-slate-500' : ''}
              ${document.status === 'cancelled' ? 'text-red-500' : ''}
            `}>
              {document.status === 'paid' ? 'ชำระเงินแล้ว' : ''}
              {document.status === 'pending' ? 'รอชำระเงิน' : ''}
              {document.status === 'draft' ? 'แบบร่าง' : ''}
              {document.status === 'cancelled' ? 'ยกเลิก' : ''}
            </strong>
          </span>

          {isInIframe && (
            <a
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              เปิดในแท็บใหม่เพื่อพิมพ์ (แนะนำ)
            </a>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            พิมพ์เอกสาร / บันทึก PDF
          </button>
        </div>
      </div>

      <div className="bg-slate-50 p-4 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500 print:hidden text-center">
        💡 <strong>คำแนะนำในการพิมพ์/บันทึก PDF:</strong> กดปุ่ม "พิมพ์เอกสาร / บันทึก PDF" ด้านบน หน้าจอพิมพ์จะเปิดขึ้น ให้เลือกเครื่องพิมพ์เป็น <strong>"Save as PDF"</strong> หรือ <strong>"บันทึกเป็น PDF"</strong> ในการตั้งค่าการพิมพ์ ให้เลือก <u>ซ่อนหัวกระดาษและท้ายกระดาษ (Headers and Footers)</u> เพื่อให้ได้เอกสารใบเสร็จที่สะอาดที่สุด
      </div>

      {isInIframe && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-5 rounded-xl text-xs space-y-3 print:hidden">
          <p className="font-bold text-sm flex items-center gap-1.5 text-amber-800">
            ⚠️ ตรวจพบว่าคุณกำลังใช้งานผ่านระบบหน้าต่างจำลอง (iFrame) ของ AI Studio
          </p>
          <p className="leading-relaxed font-medium">
            ฟังก์ชันการสั่งพิมพ์โดยตรงผ่านเบราว์เซอร์ภายในหน้าต่างจำลอง (iFrame) อาจถูกบล็อกโดยนโยบายความปลอดภัยของเบราว์เซอร์ 
            หรืออาจทำให้หน้าพิมพ์มีหน้าต่างแชทของ AI Studio และแถบควบคุมติดไปด้วย
          </p>
          <div className="p-3 bg-white/80 border border-amber-100 rounded-lg space-y-2">
            <p className="leading-relaxed font-bold text-emerald-800">
              👉 วิธีแก้ไขง่ายๆ เพื่อคุณภาพการพิมพ์ที่สมบูรณ์ 100%:
            </p>
            <p className="leading-relaxed text-slate-700 font-medium">
              เพียงแค่คลิกปุ่มสีเขียวด้านล่างนี้ ระบบจะเปิดแอปนี้ในแท็บใหม่แยกต่างหากอย่างอิสระ จากนั้นคุณสามารถกดพิมพ์เอกสารเป็นขนาด A4 หรือเซฟเป็น PDF ได้อย่างสมบูรณ์แบบทันทีครับ!
            </p>
            <div className="pt-1">
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                คลิกที่นี่เพื่อเปิดแอปในแท็บใหม่ทันที (แนะนำ)
              </a>
            </div>
          </div>
        </div>
      )}

      {/* หน้ากระดาษเอกสาร (ขนาดมาตรฐาน A4 ออกแบบสวยงาม) */}
      <div 
        ref={printAreaRef}
        className="bg-white mx-auto shadow-lg border border-slate-200 p-8 md:p-12 font-sans text-slate-800 w-full max-w-[210mm] min-h-[297mm] relative"
        id="printed-invoice-paper"
      >
        {/* CSS สำหรับคุมการพิมพ์โดยเฉพาะ */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body {
              background: white !important;
              color: black !important;
              font-size: 11pt !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #printed-invoice-paper {
              padding: 10mm 15mm !important;
              border: none !important;
              box-shadow: none !important;
              max-width: 210mm !important;
              width: 210mm !important;
              min-height: 297mm !important;
              margin: 0 auto !important;
              box-sizing: border-box !important;
            }
            .print\\:hidden {
              display: none !important;
            }
          }
          @page {
            size: A4;
            margin: 0;
          }
        `}} />

        {/* ส่วนตราประทับชำระเงินแล้วสำหรับ RECEIPT เท่านั้น */}
        {document.documentType === 'RECEIPT' && document.status === 'paid' && (
          <div className="absolute top-12 right-12 border-4 border-dashed border-emerald-500/30 text-emerald-600/60 rounded-xl px-4 py-2 transform rotate-12 flex items-center gap-1.5 select-none font-bold text-sm tracking-widest pointer-events-none">
            <CheckCircle className="w-5 h-5 text-emerald-500/40" />
            PAID / ชำระแล้ว
          </div>
        )}

        {/* Header ส่วนต้น */}
        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-8 border-b-2 border-slate-800 pb-6">
          {/* ฝั่งซ้าย: ข้อมูลของผู้ให้บริการ (บุคคลธรรมดา) */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 text-white flex items-center justify-center font-extrabold text-base tracking-wider shadow-sm">
                K
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 leading-tight">{document.ownerDetails.name}</h1>
                <p className="text-[10px] text-slate-500 font-mono tracking-tight">ผู้จัดทำเอกสาร (บุคคลธรรมดา)</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-1 pt-1">
              <p className="leading-relaxed"><strong>ที่อยู่:</strong> {document.ownerDetails.address}</p>
              <p><strong>เลขประจำตัวผู้เสียภาษี (บัตรประชาชน):</strong> {formatIdCard(document.ownerDetails.taxId)}</p>
              <p><strong>เบอร์โทรศัพท์:</strong> {formatPhone(document.ownerDetails.phone)}</p>
              {document.ownerDetails.email && <p><strong>อีเมล:</strong> {document.ownerDetails.email}</p>}
              {document.ownerDetails.website && <p><strong>เว็บไซต์:</strong> {document.ownerDetails.website}</p>}
            </div>
          </div>

          {/* ฝั่งขวา: ชื่อเอกสารและหมายเลขเอกสาร */}
          <div className="flex flex-col justify-between md:items-end print:items-end text-left md:text-right print:text-right space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{title.th}</h2>
              <span className="text-xs font-semibold text-slate-500 tracking-wider block font-mono">{title.en}</span>
            </div>

            <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100 w-full md:w-64 print:w-64">
              <div className="flex justify-between">
                <span className="text-slate-500">เลขที่เอกสาร / No:</span>
                <strong className="text-slate-800 font-mono">{document.documentNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">วันที่ / Date:</span>
                <span className="text-slate-800">{formatThaiDate(document.date)}</span>
              </div>
              {document.dueDate && (document.documentType === 'INVOICE' || document.documentType === 'BILLING') && (
                <div className="flex justify-between">
                  <span className="text-slate-500">ครบกำหนด / Due Date:</span>
                  <strong className="text-slate-900">{formatThaiDate(document.dueDate)}</strong>
                </div>
              )}
              {document.referenceNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-500">อ้างอิงเอกสาร / Ref:</span>
                  <span className="text-slate-800 font-mono">{document.referenceNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ข้อมูลลูกค้า */}
        <div className="my-6 p-4 rounded-xl border border-slate-200 bg-slate-50/30">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ลูกค้า / Customer</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <p className="font-bold text-slate-900 text-sm">{document.clientDetails.name}</p>
              <p className="leading-relaxed text-slate-600"><strong>ที่อยู่:</strong> {document.clientDetails.address}</p>
            </div>
            <div className="space-y-1 md:pl-6 md:border-l print:pl-6 print:border-l border-slate-100">
              {document.clientDetails.taxId && (
                <p className="text-slate-700">
                  <strong>เลขผู้เสียภาษี:</strong> {formatIdCard(document.clientDetails.taxId)}
                </p>
              )}
              <p className="text-slate-700">
                <strong>เบอร์โทรศัพท์:</strong> {formatPhone(document.clientDetails.phone)}
              </p>
              {document.clientDetails.email && (
                <p className="text-slate-700">
                  <strong>อีเมล:</strong> {document.clientDetails.email}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ตารางรายการสินค้า / บริการ */}
        <div className="mt-6">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="py-2.5 px-3 text-center rounded-l-md w-12">ลำดับ<br /><span className="text-[10px] font-normal font-mono">No.</span></th>
                <th className="py-2.5 px-3 text-left">รายละเอียดบริการ / สินค้า<br /><span className="text-[10px] font-normal font-mono">Description</span></th>
                <th className="py-2.5 px-3 text-right w-16">จำนวน<br /><span className="text-[10px] font-normal font-mono">Qty</span></th>
                <th className="py-2.5 px-3 text-center w-16">หน่วยนับ<br /><span className="text-[10px] font-normal font-mono">Unit</span></th>
                <th className="py-2.5 px-3 text-right w-28">ราคาต่อหน่วย<br /><span className="text-[10px] font-normal font-mono">Unit Price</span></th>
                <th className="py-2.5 px-3 text-right rounded-r-md w-28">จำนวนเงิน (บาท)<br /><span className="text-[10px] font-normal font-mono">Amount</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {document.items.map((item, index) => (
                <tr key={item.id} className="align-top">
                  <td className="py-3 px-3 text-center text-slate-500 font-mono">{index + 1}</td>
                  <td className="py-3 px-3 font-medium text-slate-800 whitespace-pre-line leading-relaxed">{item.description}</td>
                  <td className="py-3 px-3 text-right font-mono">{item.quantity}</td>
                  <td className="py-3 px-3 text-center text-slate-500">{item.unit}</td>
                  <td className="py-3 px-3 text-right font-mono">{formatCurrency(item.pricePerUnit)}</td>
                  <td className="py-3 px-3 text-right font-semibold font-mono text-slate-900">{formatCurrency(item.total)}</td>
                </tr>
              ))}
              
              {/* เติมแถวว่างให้ดูสวยงามไม่โล่งเกินไปถ้ามีรายการน้อย */}
              {document.items.length < 2 && Array.from({ length: 2 - document.items.length }).map((_, i) => (
                <tr key={`empty-${i}`} className="h-6 border-b border-slate-50/50">
                  <td className="py-2 px-3"></td>
                  <td className="py-2 px-3"></td>
                  <td className="py-2 px-3"></td>
                  <td className="py-2 px-3"></td>
                  <td className="py-2 px-3"></td>
                  <td className="py-2 px-3"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ส่วนรวมสรุปยอดเงิน */}
        <div className="grid grid-cols-1 md:grid-cols-12 print:grid-cols-12 gap-4 mt-6 pt-4 border-t-2 border-slate-800">
          {/* คำอธิบายในวงเล็บและข้อมูลโอนเงิน */}
          <div className="md:col-span-7 print:col-span-7 space-y-3">
            {/* โชว์จำนวนเงินตัวหนังสือภาษาไทย */}
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-slate-700 font-bold text-center text-xs">
              จำนวนเงินตัวอักษร: ({thaiBahtText(summary.amountToPay)})
            </div>

            {/* บันทึกข้อตกลงและการชำระเงิน */}
            {document.documentType !== 'QUOTATION' && (
              <div className="p-3 border border-slate-200 rounded-lg text-[11px] leading-relaxed text-slate-600 bg-slate-50/50">
                <p className="font-bold text-slate-800 mb-1">🏦 ข้อมูลการชำระเงินผ่านการโอนเงินเข้าบัญชี:</p>
                <p><strong>ธนาคาร:</strong> {document.paymentBankName || document.ownerDetails.bankName}</p>
                <p><strong>ชื่อบัญชี:</strong> {document.paymentBankAccountName || document.ownerDetails.bankAccountName}</p>
                <p><strong>เลขที่บัญชี:</strong> <span className="font-mono font-semibold">{document.paymentBankAccountNumber || document.ownerDetails.bankAccountNumber}</span></p>
                <p className="text-[10px] text-slate-400 mt-1 italic">*กรุณาส่งหลักฐานการโอนเงินเพื่อยืนยันการชำระเงินทุกครั้ง</p>
              </div>
            )}

            {document.notes && (
              <div className="text-[11px] text-slate-500">
                <strong className="text-slate-600">หมายเหตุ / เงื่อนไข:</strong>
                <p className="whitespace-pre-line mt-0.5">{document.notes}</p>
              </div>
            )}
          </div>

          {/* ตารางสรุปเงินตัวเลข */}
          <div className="md:col-span-5 print:col-span-5 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">รวมเป็นเงิน / Subtotal:</span>
              <span className="font-mono">{formatCurrency(summary.subtotal)}</span>
            </div>

            {document.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>ส่วนลด / Discount:</span>
                <span className="font-mono">-{formatCurrency(document.discount)}</span>
              </div>
            )}

            {(document.discount > 0) && (
              <div className="flex justify-between font-medium text-slate-700">
                <span>หลังหักส่วนลด:</span>
                <span className="font-mono">{formatCurrency(summary.discountedSubtotal)}</span>
              </div>
            )}

            {document.isVatEnabled && (
              <div className="flex justify-between">
                <span>ภาษีมูลค่าเพิ่ม / VAT ({document.vatRate}%):</span>
                <span className="font-mono">{formatCurrency(summary.vatAmount)}</span>
              </div>
            )}

            <div className="flex justify-between border-t border-slate-200 pt-1 text-slate-700 font-medium">
              <span>รวมเงินทั้งสิ้น / Total:</span>
              <span className="font-mono">{formatCurrency(summary.totalAmount)}</span>
            </div>

            {document.isWithholdingTaxEnabled && (
              <div className="flex justify-between text-slate-500 italic">
                <span>หักภาษี ณ ที่จ่าย ({document.withholdingTaxRate}%):</span>
                <span className="font-mono">-{formatCurrency(summary.withholdingTaxAmount)}</span>
              </div>
            )}

            <div className="flex justify-between border-t-2 border-slate-800 pt-1.5 text-xs font-bold text-slate-900 bg-slate-50 py-1.5 px-2 rounded-lg items-center">
              <span>ยอดเงินที่ต้องชำระ / Net Pay:</span>
              <span className="font-mono text-sm">{formatCurrency(summary.amountToPay)} บาท</span>
            </div>
          </div>
        </div>

        {/* ส่วนลายเซ็นที่สวยงาม */}
        <div className="grid grid-cols-2 gap-12 mt-8 text-center text-xs">
          {/* ช่องเซ็นฝั่งผู้รับบริการ */}
          <div className="space-y-6 flex flex-col justify-end">
            <div className="border-b border-slate-300 w-48 mx-auto h-12"></div>
            <div className="space-y-1">
              <p className="font-bold">ผู้รับเอกสาร / ผู้ว่าจ้าง</p>
              <p className="text-[10px] text-slate-400">วันที่ / Date: ................................................</p>
            </div>
          </div>

          {/* ช่องเซ็นฝั่งผู้ให้บริการ */}
          <div className="space-y-6 flex flex-col justify-end">
            {/* พื้นที่จำลองลายเซ็นเพื่อความสมจริง */}
            <div className="relative w-48 mx-auto h-12 flex items-center justify-center">
              <span className="font-serif italic text-slate-300/40 select-none text-2xl absolute -rotate-12">
                {document.ownerDetails.signatureName || document.ownerDetails.name}
              </span>
              <div className="border-b border-slate-300 w-full absolute bottom-0"></div>
            </div>
            <div className="space-y-1">
              <p className="font-bold">ผู้จัดทำเอกสาร / ผู้รับเงิน</p>
              <p className="text-slate-600 font-medium">{document.ownerDetails.signatureName ? `(${document.ownerDetails.signatureName})` : `(${document.ownerDetails.name})`}</p>
              <p className="text-[10px] text-slate-400">วันที่ / Date: {formatThaiDate(document.date)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

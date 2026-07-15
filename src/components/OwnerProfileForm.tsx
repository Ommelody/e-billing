import React, { useState, useEffect } from 'react';
import { OwnerProfile } from '../types';
import { saveOwnerProfile, formatIdCard } from '../utils';
import { User, CreditCard, Mail, Phone, MapPin, Globe, Landmark, ShieldCheck, CheckCircle2, Trash2 } from 'lucide-react';

interface OwnerProfileFormProps {
  profile: OwnerProfile;
  onUpdate: (profile: OwnerProfile) => void;
  onClearAllData?: () => void;
}

export default function OwnerProfileForm({ profile, onUpdate, onClearAllData }: OwnerProfileFormProps) {
  const [formData, setFormData] = useState<OwnerProfile>({ ...profile });
  const [saved, setSaved] = useState(false);

  // Sync internal state with external prop changes (essential for data clearing resets)
  useEffect(() => {
    setFormData({ ...profile });
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, [name]: numValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveOwnerProfile(formData);
    onUpdate(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="owner-profile-form">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-lg font-semibold text-slate-800">ตั้งค่าข้อมูลผู้ประกอบการ (บุคคลธรรมดา)</h2>
        <p className="text-xs text-slate-500 mt-1">แก้ไขข้อมูลของคุณเพื่อแสดงบนหัวเอกสาร ใบเสนอราคา ใบแจ้งหนี้ และใบเสร็จรับเงิน</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {saved && (
          <div className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm border border-emerald-100 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>บันทึกข้อมูลผู้ประกอบการเรียบร้อยแล้ว! เอกสารที่ออกต่อจากนี้จะใช้ข้อมูลชุดใหม่นี้</span>
          </div>
        )}

        {/* ส่วนที่ 1: ข้อมูลส่วนตัว */}
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            ข้อมูลส่วนตัวและการติดต่อ
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">ชื่อ-นามสกุล / ชื่อผู้เสียภาษี *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="เช่น นายสมชาย รักดี"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">เลขประจำตัวประชาชน / เลขผู้เสียภาษี 13 หลัก *</label>
              <input
                type="text"
                name="taxId"
                required
                maxLength={13}
                value={formData.taxId}
                onChange={handleChange}
                placeholder="เช่น 1100501234567"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                รูปแบบจัดรูปแบบ: {formatIdCard(formData.taxId) || 'ยังไม่ได้ระบุ'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">เบอร์โทรศัพท์ *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Phone className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  type="text"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="เช่น 0812345678"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">อีเมล</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="เช่น email@example.com"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">เว็บไซต์ / เพจ (ถ้ามี)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Globe className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  type="text"
                  name="website"
                  value={formData.website || ''}
                  onChange={handleChange}
                  placeholder="เช่น www.yourdesign.com หรือ fb.com/yourpage"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">ที่อยู่ตามบัตรประชาชน / ที่อยู่ติดต่อ *</label>
              <div className="relative">
                <span className="absolute top-2.5 left-3 pointer-events-none">
                  <MapPin className="h-4 w-4 text-slate-400" />
                </span>
                <textarea
                  name="address"
                  required
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="ระบุที่อยู่ฉบับเต็มเพื่อแสดงในเอกสาร..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* ส่วนที่ 2: บัญชีธนาคารสำหรับรับเงิน */}
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-slate-400" />
            ข้อมูลการรับชำระเงิน (แสดงบนเอกสารสำหรับให้ลูกค้าโอนเงิน)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">ธนาคาร *</label>
              <input
                type="text"
                name="bankName"
                required
                value={formData.bankName}
                onChange={handleChange}
                placeholder="เช่น ธนาคารกสิกรไทย"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">ชื่อบัญชี *</label>
              <input
                type="text"
                name="bankAccountName"
                required
                value={formData.bankAccountName}
                onChange={handleChange}
                placeholder="เช่น นายสมชาย รักดี"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">เลขที่บัญชี *</label>
              <input
                type="text"
                name="bankAccountNumber"
                required
                value={formData.bankAccountNumber}
                onChange={handleChange}
                placeholder="เช่น 123-4-56789-0"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* ส่วนที่ 3: ภาษีและการเซ็นลายเซ็น */}
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            ตั้งค่าเริ่มต้นภาษีและลายเซ็น
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                <div className="pr-4">
                  <label className="text-sm font-medium text-slate-700 block">จดทะเบียนภาษีมูลค่าเพิ่ม (VAT)</label>
                  <span className="text-xs text-slate-400 block">เปิดใช้หากคุณจดทะเบียน VAT 7% (ปกติบุคคลธรรมดาที่รายได้ไม่ถึง 1.8 ล้านบาทมักไม่ได้จด)</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="useVat"
                    checked={formData.useVat}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-700"></div>
                </label>
              </div>

              {formData.useVat && (
                <div className="pl-3 border-l-2 border-slate-200 animate-fadeIn">
                  <label className="block text-xs font-medium text-slate-500 mb-1">อัตราภาษีมูลค่าเพิ่ม (%)</label>
                  <input
                    type="number"
                    name="vatRate"
                    min={0}
                    max={100}
                    value={formData.vatRate}
                    onChange={handleNumberChange}
                    className="w-32 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                <div className="pr-4">
                  <label className="text-sm font-medium text-slate-700 block">ภาษีหัก ณ ที่จ่าย (Withholding Tax)</label>
                  <span className="text-xs text-slate-400 block">แสดงตัวเลือกการหัก ณ ที่จ่าย เพื่ออำนวยความสะดวกในกรณีผู้จ้าง (บริษัท) ต้องหักภาษีคุณ</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="useWithholdingTax"
                    checked={formData.useWithholdingTax}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-700"></div>
                </label>
              </div>

              {formData.useWithholdingTax && (
                <div className="pl-3 border-l-2 border-slate-200 animate-fadeIn">
                  <label className="block text-xs font-medium text-slate-500 mb-1">อัตราภาษีหัก ณ ที่จ่ายปกติ (%)</label>
                  <input
                    type="number"
                    name="withholdingTaxRate"
                    min={0}
                    max={100}
                    value={formData.withholdingTaxRate}
                    onChange={handleNumberChange}
                    className="w-32 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">ปกติบุคคลธรรมดา ค่าบริการและจ้างทำของ หัก ณ ที่จ่าย 3%</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">ชื่อพิมพ์กำกับท้ายลายเซ็น ( signatureName )</label>
              <input
                type="text"
                name="signatureName"
                value={formData.signatureName || ''}
                onChange={handleChange}
                placeholder="เช่น (นายสมชาย รักดี)"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
              />
              <p className="text-[10px] text-slate-400 mt-1">จะแสดงในช่องผู้ลงนามเตรียมเอกสาร / ผู้รับเงิน</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            {onClearAllData && (
              <button
                type="button"
                onClick={onClearAllData}
                className="px-4 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                title="ล้างรายชื่อลูกค้า บิลจำลอง และรายการบริการทั้งหมดเพื่อเริ่มกรอกข้อมูลจริง"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ล้างข้อมูลตัวอย่างระบบทั้งหมด
              </button>
            )}
          </div>
          
          <button
            type="submit"
            className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-sm text-center"
          >
            บันทึกข้อมูลทั้งหมด
          </button>
        </div>
      </form>
    </div>
  );
}

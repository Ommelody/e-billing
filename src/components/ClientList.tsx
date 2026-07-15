import React, { useState } from 'react';
import { Client } from '../types';
import { saveClients, formatIdCard, formatPhone } from '../utils';
import { Search, Plus, UserCheck, Trash2, Edit2, X, AlertCircle } from 'lucide-react';

interface ClientListProps {
  clients: Client[];
  onUpdate: (clients: Client[]) => void;
  showConfirm?: (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => void;
}

export default function ClientList({ clients, onUpdate, showConfirm }: ClientListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeClient, setActiveClient] = useState<Partial<Client> | null>(null);

  // Filter clients based on search
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.taxId && c.taxId.includes(searchTerm)) ||
    c.phone.includes(searchTerm) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setActiveClient({
      id: '',
      name: '',
      taxId: '',
      address: '',
      phone: '',
      email: '',
      notes: ''
    });
    setIsEditing(true);
  };

  const handleOpenEdit = (client: Client) => {
    setActiveClient({ ...client });
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClient || !activeClient.name || !activeClient.address) return;

    let updatedList: Client[];

    if (activeClient.id) {
      // Edit
      updatedList = clients.map(c => c.id === activeClient.id ? (activeClient as Client) : c);
    } else {
      // Add
      const newClient: Client = {
        ...(activeClient as Omit<Client, 'id'>),
        id: `c-${Date.now()}`
      };
      updatedList = [...clients, newClient];
    }

    onUpdate(updatedList);
    saveClients(updatedList);
    setIsEditing(false);
    setActiveClient(null);
  };

  const handleDelete = (id: string, name: string) => {
    const doDelete = () => {
      const updatedList = clients.filter(c => c.id !== id);
      onUpdate(updatedList);
      saveClients(updatedList);
    };

    if (showConfirm) {
      showConfirm(
        'ยืนยันการลบลูกค้า',
        `คุณต้องการลบข้อมูลลูกค้า "${name}" ใช่หรือไม่? (การลบจะไม่ส่งผลกระทบต่อเอกสารที่ถูกสร้างขึ้นไปแล้วก่อนหน้านี้)`,
        doDelete,
        'ลบข้อมูลลูกค้า',
        'ยกเลิก'
      );
    } else {
      if (confirm(`คุณต้องการลบข้อมูลลูกค้า "${name}" ใช่หรือไม่?`)) {
        doDelete();
      }
    }
  };

  return (
    <div className="space-y-4" id="client-list-component">
      {/* ส่วนควบคุมและค้นหา */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="ค้นหาลูกค้าด้วยชื่อ, เลขผู้เสียภาษี, เบอร์โทร หรืออีเมล..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
          />
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          เพิ่มรายชื่อลูกค้า
        </button>
      </div>

      {/* รายการลูกค้าแบบ Grid/Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <div 
              key={client.id} 
              className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:border-slate-200 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
                      {client.name.substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm leading-snug">{client.name}</h4>
                      {client.taxId && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          เลขผู้เสียภาษี: {formatIdCard(client.taxId)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <p className="flex items-start gap-1">
                    <span className="font-medium text-slate-500 w-12 flex-shrink-0">ที่อยู่:</span>
                    <span>{client.address}</span>
                  </p>
                  {client.phone && (
                    <p className="flex items-center gap-1">
                      <span className="font-medium text-slate-500 w-12 flex-shrink-0">โทรศัพท์:</span>
                      <span>{formatPhone(client.phone)}</span>
                    </p>
                  )}
                  {client.email && (
                    <p className="flex items-center gap-1">
                      <span className="font-medium text-slate-500 w-12 flex-shrink-0">อีเมล:</span>
                      <span className="text-slate-600">{client.email}</span>
                    </p>
                  )}
                  {client.notes && (
                    <p className="flex items-start gap-1 bg-slate-50 p-2 rounded-md mt-2 text-slate-500 italic">
                      <AlertCircle className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span>{client.notes}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-50 flex justify-end gap-2 text-xs">
                <button
                  onClick={() => handleOpenEdit(client)}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md transition-colors cursor-pointer font-medium"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  แก้ไข
                </button>
                <button
                  onClick={() => handleDelete(client.id, client.name)}
                  className="flex items-center gap-1 px-3 py-1.5 border border-red-100 text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  ลบ
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white border border-slate-100 rounded-xl p-8 text-center text-slate-400">
            <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm">ไม่พบข้อมูลลูกค้าตามที่ค้นหา</p>
            {searchTerm && <p className="text-xs text-slate-400 mt-1">ลองใช้คำค้นหาอื่นแทน</p>}
          </div>
        )}
      </div>

      {/* Modal เพิ่ม/แก้ไขลูกค้า */}
      {isEditing && activeClient && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-slideUp">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">
                {activeClient.id ? 'แก้ไขรายชื่อลูกค้า' : 'เพิ่มรายชื่อลูกค้าใหม่'}
              </h3>
              <button 
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">ชื่อลูกค้า / ชื่อบริษัท *</label>
                <input
                  type="text"
                  required
                  value={activeClient.name || ''}
                  onChange={(e) => setActiveClient(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="เช่น บริษัท สยามเทรดดิ้ง จำกัด (สำนักงานใหญ่)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">เลขผู้เสียภาษี (บุคคล/นิติบุคคล 13 หลัก)</label>
                <input
                  type="text"
                  maxLength={13}
                  value={activeClient.taxId || ''}
                  onChange={(e) => setActiveClient(prev => ({ ...prev, taxId: e.target.value }))}
                  placeholder="เช่น 0105560000000"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={activeClient.phone || ''}
                    onChange={(e) => setActiveClient(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="เช่น 021234567"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">อีเมล</label>
                  <input
                    type="email"
                    value={activeClient.email || ''}
                    onChange={(e) => setActiveClient(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="เช่น client@email.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">ที่อยู่ลูกค้า *</label>
                <textarea
                  required
                  rows={3}
                  value={activeClient.address || ''}
                  onChange={(e) => setActiveClient(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="เช่น 123 ซอยสีลม 5 ถนนสีลม แขวงสุริยวงศ์ เขตบางรัก กรุงเทพมหานคร 10500"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">หมายเหตุภายใน (จะไม่ปรากฏบนใบแจ้งหนี้)</label>
                <input
                  type="text"
                  value={activeClient.notes || ''}
                  onChange={(e) => setActiveClient(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="เช่น เสนอราคาช่วงกลางเดือนเป็นพิเศษ"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors cursor-pointer"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

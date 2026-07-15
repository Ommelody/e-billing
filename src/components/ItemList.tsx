import React, { useState } from 'react';
import { ProductItem } from '../types';
import { saveProducts, formatCurrency } from '../utils';
import { Search, Plus, Tag, Trash2, Edit2, X } from 'lucide-react';

interface ItemListProps {
  products: ProductItem[];
  onUpdate: (products: ProductItem[]) => void;
  showConfirm?: (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => void;
}

export default function ItemList({ products, onUpdate, showConfirm }: ItemListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeItem, setActiveItem] = useState<Partial<ProductItem> | null>(null);

  // Filter products based on search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.unit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setActiveItem({
      id: '',
      name: '',
      price: 0,
      unit: 'ชิ้น'
    });
    setIsEditing(true);
  };

  const handleOpenEdit = (product: ProductItem) => {
    setActiveItem({ ...product });
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem || !activeItem.name || activeItem.price === undefined) return;

    let updatedList: ProductItem[];

    if (activeItem.id) {
      // Edit
      updatedList = products.map(p => p.id === activeItem.id ? (activeItem as ProductItem) : p);
    } else {
      // Add
      const newItem: ProductItem = {
        ...(activeItem as Omit<ProductItem, 'id'>),
        id: `p-${Date.now()}`
      };
      updatedList = [...products, newItem];
    }

    onUpdate(updatedList);
    saveProducts(updatedList);
    setIsEditing(false);
    setActiveItem(null);
  };

  const handleDelete = (id: string, name: string) => {
    const doDelete = () => {
      const updatedList = products.filter(p => p.id !== id);
      onUpdate(updatedList);
      saveProducts(updatedList);
    };

    if (showConfirm) {
      showConfirm(
        'ยืนยันการลบสินค้า/บริการ',
        `คุณต้องการลบงานบริการ "${name}" ใช่หรือไม่? (การลบจะไม่ส่งผลกระทบต่อเอกสารที่ถูกสร้างขึ้นไปแล้วก่อนหน้านี้)`,
        doDelete,
        'ลบสินค้า/บริการ',
        'ยกเลิก'
      );
    } else {
      if (confirm(`คุณต้องการลบงานบริการ "${name}" ใช่หรือไม่?`)) {
        doDelete();
      }
    }
  };

  return (
    <div className="space-y-4" id="item-list-component">
      {/* ส่วนควบคุมและค้นหา */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="ค้นหาบริการหรือสินค้าด้วยชื่อ หรือหน่วยนับ..."
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
          เพิ่มรายการบริการ / สินค้า
        </button>
      </div>

      {/* ตาราง/การแสดงผลรายการ */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-100 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3.5">ชื่อรายการบริการ / สินค้า</th>
                <th className="px-6 py-3.5 text-right">ราคาเริ่มต้นต่อหน่วย (บาท)</th>
                <th className="px-6 py-3.5">หน่วยนับ</th>
                <th className="px-6 py-3.5 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-900">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-full text-slate-600 font-medium">
                        {product.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-xs">
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="p-1.5 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="p-1.5 border border-red-100 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          title="ลบ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <Tag className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm">ไม่พบข้อมูลบริการหรือสินค้าตามที่ค้นหา</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal เพิ่ม/แก้ไขรายการ */}
      {isEditing && activeItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-slideUp">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">
                {activeItem.id ? 'แก้ไขรายการบริการ / สินค้า' : 'เพิ่มรายการบริการ / สินค้าใหม่'}
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
                <label className="block text-xs font-medium text-slate-500 mb-1">ชื่อรายการบริการ / สินค้า *</label>
                <input
                  type="text"
                  required
                  value={activeItem.name || ''}
                  onChange={(e) => setActiveItem(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="เช่น พัฒนาหน้าเว็บด้วย Next.js"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">ราคาเริ่มต้น (บาท) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={activeItem.price ?? ''}
                    onChange={(e) => setActiveItem(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="เช่น 15000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">หน่วยนับ *</label>
                  <input
                    type="text"
                    required
                    value={activeItem.unit || ''}
                    onChange={(e) => setActiveItem(prev => ({ ...prev, unit: e.target.value }))}
                    placeholder="เช่น โปรเจกต์, ชั่วโมง, เดือน"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                  />
                </div>
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

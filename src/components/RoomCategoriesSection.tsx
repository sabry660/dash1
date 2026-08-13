import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Building2, Plus, Search, Loader2, Edit, Trash2, Save, Image as ImageIcon, DollarSign, Users, BedDouble, MapPin, Wifi, AlertCircle, Layers, Star, Tv, Check, X } from 'lucide-react';
import { apiService, RoomCategoryResponse } from '../services/api';

const getBedTypeArabic = (bedType?: string): string => {
  const translations: Record<string, string> = { 'TWIN': 'سريرين منفصلين', 'DOUBLE': 'سرير مزدوج', 'QUEEN': 'سرير كوين', 'KING': 'سرير كينج' };
  return translations[bedType || ''] || bedType || 'غير متاح';
};

export default function RoomCategoriesSection() {
  const [categories, setCategories] = useState<RoomCategoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    price: 0,
    numBeds: 1,
    bedType: 'DOUBLE' as 'TWIN' | 'DOUBLE' | 'QUEEN' | 'KING',
    maxAdults: 2,
    maxKids: 0,
    hasWifi: true,
    numTvs: 1,
  });

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.getRoomCategories();
      setCategories(response.content || response || []);
    } catch (e) {
      setError('فشل تحميل فئات الغرف');
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name || !newCategory.price) {
      setCreateError('يرجى تعبئة الاسم والسعر');
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    try {
      await apiService.createRoomCategory(newCategory);
      setIsCreateModalOpen(false);
      setNewCategory({
        name: '',
        description: '',
        price: 0,
        numBeds: 1,
        bedType: 'DOUBLE',
        maxAdults: 2,
        maxKids: 0,
        hasWifi: true,
        numTvs: 1,
      });
      loadCategories();
    } catch (e) {
      setCreateError('فشل إنشاء فئة الغرفة');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredCategories = categories.filter((cat: RoomCategoryResponse) => cat.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-black text-[#AA7B30]">فئات الغرف</h1>
          <p className="text-gray-500 text-xs mt-1">إدارة فئات الغرف وتحديد الأسعار والمواصفات.</p>
        </div>
        <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#AA7B30] to-[#D4AF37] text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition">
          <Plus size={18} /><span>إضافة فئة</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input type="text" placeholder="بحث عن فئة..." value={searchQuery} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)} className="bg-white border border-gray-200 focus:border-[#D4AF37] rounded-xl pr-10 pl-4 py-2.5 text-sm w-full" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="text-[#D4AF37] animate-spin" /></div>
      ) : error ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" /><p className="text-gray-500 text-sm font-bold mb-4">{error}</p>
          <button onClick={loadCategories} className="px-5 py-2 bg-[#D4AF37] text-white font-bold text-sm rounded-xl">إعادة المحاولة</button>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl">
          <Layers size={48} className="text-gray-300 mx-auto mb-4" /><p className="text-gray-400 text-sm font-bold">لا توجد فئات</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
          {filteredCategories.map((category: RoomCategoryResponse) => (
            <motion.div key={category.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="relative">
              <div className="relative backdrop-blur-xl border rounded-2xl overflow-hidden hover:border-[#D4AF37]/30 hover:shadow-[0_20px_40px_rgba(212,175,55,0.15)] transition-all duration-500 hover:-translate-y-2 group bg-white border-gray-200">
                {/* Category Image */}
                <div className="relative h-64 overflow-hidden">
                  {category.imageUrl ? (
                    <img 
                      src={category.imageUrl} 
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => { 
                        e.currentTarget.src = "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600";
                      }}
                    />
                  ) : (
                    <img 
                      src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600" 
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/20 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md shadow-lg bg-[#D4AF37]/20 text-[#AA7B30] border-[#D4AF37]/30">
                      <Star size={12} className="fill-[#D4AF37]" /> فئة
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <span className="text-4xl font-black font-mono text-white drop-shadow-lg">{category.name}</span>
                  </div>
                </div>

                {/* Category Info */}
                <div className="p-6 space-y-4">
                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">السعر لليلة</span>
                    <span className="text-2xl font-black text-[#AA7B30]">{category.price ? `${category.price.toLocaleString('ar-SA')} ر.س` : 'غير متاح'}</span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
                      <Users size={16} className="text-gray-400" />
                      <div>
                        <span className="block text-gray-400 text-xs">بالغين</span>
                        <span className="font-bold text-gray-800">{category.maxAdults || 'غير متاح'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
                      <Users size={16} className="text-gray-400" />
                      <div>
                        <span className="block text-gray-400 text-xs">أطفال</span>
                        <span className="font-bold text-gray-800">{category.maxKids || 'غير متاح'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
                      <BedDouble size={16} className="text-gray-400" />
                      <div>
                        <span className="block text-gray-400 text-xs">نوع السرير</span>
                        <span className="font-bold text-gray-800">{getBedTypeArabic(category.bedType)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
                      <span className="text-gray-400">عدد الأسرة:</span>
                      <span className="font-bold text-gray-800">{category.numBeds || 'غير متاح'}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
                      <Tv size={16} className="text-gray-400" />
                      <div>
                        <span className="block text-gray-400 text-xs">تلفزيونات</span>
                        <span className="font-bold text-gray-800">{category.numTvs || 'غير متاح'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
                      <Wifi size={16} className={category.hasWifi ? "text-green-500" : "text-gray-400"} />
                      <div>
                        <span className="block text-gray-400 text-xs">واي فاي</span>
                        <span className="font-bold text-gray-800">{category.hasWifi ? 'متاح' : 'غير متاح'}</span>
                      </div>
                    </div>
                  </div>

                  {category.description && (
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <span className="block text-gray-400 text-xs mb-1">الوصف</span>
                      <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{category.description}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-3 border-t border-gray-100 flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm font-bold hover:bg-amber-100 transition">
                      <DollarSign size={14} /> الأسعار
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-100 transition">
                      <Edit size={14} /> تعديل
                    </button>
                    <button className="px-3 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Category Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full relative space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-[#AA7B30]">إضافة فئة غرفة جديدة</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {createError && (
              <div className="text-red-500 text-xs font-bold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {createError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-2">اسم الفئة *</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                  placeholder="مثال: جناح ملكي"
                  disabled={isCreating}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 block mb-2">الوصف</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none resize-none"
                  placeholder="وصف الفئة..."
                  rows={3}
                  disabled={isCreating}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 block mb-2">السعر لليلة *</label>
                <input
                  type="number"
                  value={newCategory.price}
                  onChange={(e) => setNewCategory({ ...newCategory, price: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                  placeholder="مثال: 500"
                  min="0"
                  step="0.01"
                  disabled={isCreating}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">أقصى عدد بالغين</label>
                  <input
                    type="number"
                    value={newCategory.maxAdults}
                    onChange={(e) => setNewCategory({ ...newCategory, maxAdults: parseInt(e.target.value) || 1 })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                    min="1"
                    disabled={isCreating}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">أقصى عدد أطفال</label>
                  <input
                    type="number"
                    value={newCategory.maxKids}
                    onChange={(e) => setNewCategory({ ...newCategory, maxKids: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                    min="0"
                    disabled={isCreating}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">عدد الأسرة</label>
                  <input
                    type="number"
                    value={newCategory.numBeds}
                    onChange={(e) => setNewCategory({ ...newCategory, numBeds: parseInt(e.target.value) || 1 })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                    min="1"
                    disabled={isCreating}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">نوع السرير</label>
                  <select
                    value={newCategory.bedType}
                    onChange={(e) => setNewCategory({ ...newCategory, bedType: e.target.value as any })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                    disabled={isCreating}
                  >
                    <option value="TWIN">سريرين منفصلين</option>
                    <option value="DOUBLE">سرير مزدوج</option>
                    <option value="QUEEN">سرير كوين</option>
                    <option value="KING">سرير كينج</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">عدد التلفزيونات</label>
                  <input
                    type="number"
                    value={newCategory.numTvs}
                    onChange={(e) => setNewCategory({ ...newCategory, numTvs: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                    min="0"
                    disabled={isCreating}
                  />
                </div>
                <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
                  <Wifi size={16} className={newCategory.hasWifi ? "text-green-500" : "text-gray-400"} />
                  <div>
                    <span className="block text-gray-400 text-xs">واي فاي</span>
                    <span className="font-bold text-gray-800">{newCategory.hasWifi ? 'متاح' : 'غير متاح'}</span>
                  </div>
                  <button
                    onClick={() => setNewCategory({ ...newCategory, hasWifi: !newCategory.hasWifi })}
                    className="ml-auto text-[#D4AF37] hover:text-[#AA7B30]"
                  >
                    {newCategory.hasWifi ? <Check size={16} /> : <X size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-1/3 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-bold text-sm"
                disabled={isCreating}
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateCategory}
                className="w-2/3 py-3 bg-gradient-to-r from-[#AA7B30] to-[#D4AF37] text-white font-bold text-sm rounded-xl"
                disabled={isCreating}
              >
                {isCreating ? 'جاري الإنشاء...' : 'إنشاء الفئة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

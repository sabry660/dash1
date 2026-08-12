import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ShoppingBag, Search, XCircle, AlertCircle, Building, DollarSign, Loader2, Plus, List
} from 'lucide-react';
import { apiService, SpecialOrderResponse, StayDetailsResponse } from '../services/api';
import { useThemeColors } from '../hooks/useThemeColors';

export default function SpecialOrdersManagementSection() {
  const { colors, isDark } = useThemeColors();
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  const [specialOrders, setSpecialOrders] = useState<SpecialOrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create special order form state
  const [stayId, setStayId] = useState<number>(0);
  const [serviceName, setServiceName] = useState('');
  const [specialOfferId, setSpecialOfferId] = useState<number>(0);
  const [agreedPrice, setAgreedPrice] = useState<number>(0);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    loadSpecialOrders();
  }, []);

  const loadSpecialOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.getManagerSpecialOrders(0, 50);
      // According to Swagger, this returns PageSpecialOrderResponse
      if (Array.isArray(response)) {
        setSpecialOrders(response);
      } else if (response && typeof response === 'object' && 'content' in response) {
        setSpecialOrders((response as any).content || []);
      } else {
        setSpecialOrders([]);
      }
    } catch (error: any) {
      setError('فشل تحميل الطلبات الخاصة. الرجاء المحاولة مرة أخرى.');
      setSpecialOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSpecialOrder = async () => {
    if (!stayId || !specialOfferId || !agreedPrice) {
      setCreateError('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    setIsCreating(true);
    setCreateError('');
    try {
      const response = await apiService.createStaySpecialOrder(stayId, {
        specialOfferId,
        agreedPrice
      });
      setSpecialOrders([...specialOrders, response]);
      setViewMode('list');
      // Reset form
      setStayId(0);
      setServiceName('');
      setSpecialOfferId(0);
      setAgreedPrice(0);
    } catch (error: any) {
      setCreateError('فشل إنشاء الطلب الخاص. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsCreating(false);
    }
  };

  // Filter special orders based on search
  const filteredSpecialOrders = specialOrders.filter(order => {
    const matchesSearch = order.id.toString().includes(searchQuery) ||
                          order.stayId.toString().includes(searchQuery);
    return matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-5 ${isDark ? 'border-gray-900' : 'border-gray-200'}`}>
        <div>
          <h1 className="text-2xl font-black" style={{ color: colors.primary.goldLight }}>الطلبات الخاصة</h1>
          <p className="text-xs mt-1" style={{ color: colors.text.muted }}>عرض وإدارة الطلبات الخاصة للحجوزات</p>
        </div>
        <button
          onClick={() => setViewMode('create')}
          className="flex items-center gap-2 px-4 py-2 text-black font-extrabold text-xs rounded-xl shadow-lg transition duration-200"
          style={{ background: colors.primary.goldGradient }}
        >
          <Plus size={15} />
          <span>إنشاء طلب خاص</span>
        </button>
      </div>

      {/* View Mode Tabs */}
      <div className={`flex items-center gap-2 border p-3 rounded-xl ${isDark ? 'bg-[#0b0b0b] border-gray-900' : 'bg-white border-gray-200'}`}>
        <button
          onClick={() => setViewMode('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            viewMode === 'list' ? 'bg-[#D4AF37] text-black' : (isDark ? 'bg-[#121212] text-gray-400 border border-gray-800 hover:text-white' : 'bg-gray-100 text-gray-600 border border-gray-300 hover:text-gray-900')
          }`}
        >
          <List size={14} />
          <span>قائمة الطلبات</span>
        </button>
        <button
          onClick={() => setViewMode('create')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            viewMode === 'create' ? 'bg-[#D4AF37] text-black' : (isDark ? 'bg-[#121212] text-gray-400 border border-gray-800 hover:text-white' : 'bg-gray-100 text-gray-600 border border-gray-300 hover:text-gray-900')
          }`}
        >
          <Plus size={14} />
          <span>إنشاء طلب</span>
        </button>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {/* Search Bar */}
          <div className={`flex items-center gap-3 border p-4 rounded-xl ${isDark ? 'bg-[#0b0b0b] border-gray-900' : 'bg-white border-gray-200'}`}>
            <div className="relative">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: colors.text.muted }} />
              <input
                type="text"
                placeholder="بحث برقم الطلب أو الحجز..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`rounded-lg px-4 py-2 pr-10 text-xs focus:outline-none w-48 ${isDark ? 'bg-[#121212] border-gray-800 focus:border-[#D4AF37] text-white' : 'bg-white border-gray-300 focus:border-[#D4AF37] text-gray-900'}`}
              />
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="text-[#D4AF37] animate-spin" />
            </div>
          ) : error ? (
            <div className={`text-center py-16 border rounded-2xl ${isDark ? 'bg-[#0b0b0b] border-gray-900' : 'bg-white border-gray-200'}`}>
              <XCircle size={48} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-sm font-bold mb-2" style={{ color: colors.text.muted }}>فشل تحميل الطلبات الخاصة</h3>
              <p className="text-xs mb-4" style={{ color: colors.text.disabled }}>{error}</p>
              <button
                onClick={loadSpecialOrders}
                className="px-4 py-2 text-black font-extrabold text-xs rounded-xl"
                style={{ background: colors.primary.gold }}
              >
                إعادة المحاولة
              </button>
            </div>
          ) : filteredSpecialOrders.length === 0 ? (
            <div className={`text-center py-16 border rounded-2xl ${isDark ? 'bg-[#0b0b0b] border-gray-900' : 'bg-white border-gray-200'}`}>
              <AlertCircle size={48} className="mx-auto mb-4" style={{ color: colors.text.muted }} />
              <h3 className="text-sm font-bold mb-2" style={{ color: colors.text.muted }}>لا توجد طلبات خاصة</h3>
              <p className="text-xs mb-4" style={{ color: colors.text.disabled }}>لا يوجد حالياً طلبات خاصة</p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-2">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                    <th className={`text-xs font-bold text-right pb-3 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>رقم الطلب</th>
                    <th className={`text-xs font-bold text-right pb-3 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>رقم الحجز</th>
                    <th className={`text-xs font-bold text-right pb-3 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>رقم العرض</th>
                    <th className={`text-xs font-bold text-right pb-3 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>السعر المتفق عليه</th>
                    <th className={`text-xs font-bold text-right pb-3 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSpecialOrders.map((order) => (
                    <tr key={order.id} className={`border-b transition-colors ${isDark ? 'border-gray-800/50 hover:bg-[#121212]/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${colors.primary.gold}20`, borderColor: `${colors.primary.gold}30`, border: '1px solid' }}>
                            <ShoppingBag size={14} style={{ color: colors.primary.goldLight }} />
                          </div>
                          <span className="text-sm font-bold" style={{ color: colors.text.primary }}>{order.id}</span>
                        </div>
                      </td>
                      <td className="py-3 text-sm flex items-center gap-2" style={{ color: colors.text.primary }}>
                        <Building size={14} />
                        {order.stayId}
                      </td>
                      <td className="py-3 text-sm" style={{ color: colors.text.primary }}>{order.specialOffer?.title || '-'}</td>
                      <td className="py-3 text-sm font-bold flex items-center gap-2" style={{ color: colors.primary.goldLight }}>
                        <DollarSign size={14} />
                        {order.agreedPrice?.toLocaleString('ar-SA', { maximumFractionDigits: 0 })} ريال
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 text-xs font-bold rounded-lg border ${isDark ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                          نشط
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Create View */}
      {viewMode === 'create' && (
        <div className={`border rounded-xl p-6 ${isDark ? 'bg-[#0b0b0b] border-gray-900' : 'bg-white border-gray-200'}`}>
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: colors.primary.goldLight }}>
            <Plus size={20} />
            إنشاء طلب خاص جديد
          </h2>

          {createError && (
            <div className={`p-3 border rounded-lg text-xs mb-4 ${isDark ? 'bg-red-950/20 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700'}`}>
              {createError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-2" style={{ color: colors.text.muted }}>
                رقم الحجز <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={stayId || ''}
                onChange={(e) => setStayId(parseInt(e.target.value))}
                className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none transition ${isDark ? 'bg-[#121212] border-gray-800 focus:border-[#D4AF37] text-white' : 'bg-white border-gray-300 focus:border-[#D4AF37] text-gray-900'}`}
                placeholder="أدخل رقم الحجز"
                min="1"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-2" style={{ color: colors.text.muted }}>
                اسم الخدمة <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none transition ${isDark ? 'bg-[#121212] border-gray-800 focus:border-[#D4AF37] text-white' : 'bg-white border-gray-300 focus:border-[#D4AF37] text-gray-900'}`}
                placeholder="أدخل اسم الخدمة"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-2" style={{ color: colors.text.muted }}>
                رقم العرض الخاص <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={specialOfferId || ''}
                onChange={(e) => setSpecialOfferId(parseInt(e.target.value))}
                className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none transition ${isDark ? 'bg-[#121212] border-gray-800 focus:border-[#D4AF37] text-white' : 'bg-white border-gray-300 focus:border-[#D4AF37] text-gray-900'}`}
                placeholder="أدخل رقم العرض الخاص"
                min="1"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-2" style={{ color: colors.text.muted }}>
                السعر المتفق عليه <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={agreedPrice || ''}
                onChange={(e) => setAgreedPrice(parseFloat(e.target.value))}
                className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none transition ${isDark ? 'bg-[#121212] border-gray-800 focus:border-[#D4AF37] text-white' : 'bg-white border-gray-300 focus:border-[#D4AF37] text-gray-900'}`}
                placeholder="أدخل السعر المتفق عليه"
                min="0"
                step="0.01"
              />
            </div>

            <div className={`flex gap-3 pt-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 px-4 py-3 border rounded-xl text-xs font-bold transition ${isDark ? 'bg-[#121212] border-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 border-gray-300 text-gray-600 hover:text-gray-900'}`}
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateSpecialOrder}
                disabled={isCreating}
                className="flex-1 px-4 py-3 text-black font-extrabold text-xs rounded-xl shadow hover:shadow-lg transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: colors.primary.goldGradient }}
              >
                {isCreating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    إنشاء الطلب
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

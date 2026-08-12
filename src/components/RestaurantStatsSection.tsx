import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Utensils, XCircle, AlertCircle, DollarSign, Clock, CheckCircle, Loader2
} from 'lucide-react';
import { apiService, DashboardStatsResponse } from '../services/api';
import { useThemeColors } from '../hooks/useThemeColors';

export default function RestaurantStatsSection() {
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { colors, isDark } = useThemeColors();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.getRestaurantStats();
      setStats(response);
    } catch (error: any) {
      setError('فشل تحميل الإحصائيات من الخادم');
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-5 ${isDark ? 'border-gray-900' : 'border-gray-200'}`}>
        <div>
          <h1 className="text-2xl font-black" style={{ color: colors.primary.goldLight }}>إحصائيات المطعم</h1>
          <p className="text-xs mt-1" style={{ color: colors.text.muted }}>عرض إحصائيات المبيعات والإيرادات للمطعم</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="text-[#D4AF37] animate-spin" />
        </div>
      ) : error ? (
        <div className={`text-center py-16 border rounded-2xl ${isDark ? 'bg-[#0b0b0b] border-gray-900' : 'bg-white border-gray-200'}`}>
          <XCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-sm font-bold mb-2" style={{ color: colors.text.muted }}>فشل تحميل الإحصائيات</h3>
          <p className="text-xs mb-4" style={{ color: colors.text.disabled }}>{error}</p>
          <button onClick={loadStats} className="px-4 py-2 text-black font-extrabold text-xs rounded-xl" style={{ background: colors.primary.goldGradient }}>
            إعادة المحاولة
          </button>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`border rounded-2xl p-6 ${isDark ? 'bg-[#0b0b0b] border-gray-900' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${colors.primary.gold}20`, border: `1px solid ${colors.primary.gold}30` }}>
                <Utensils size={24} style={{ color: colors.primary.goldLight }} />
              </div>
              <span className="text-xs" style={{ color: colors.text.muted }}>إجمالي الطلبات</span>
            </div>
            <h3 className="text-3xl font-black" style={{ color: colors.text.primary }}>{stats.totalOrders}</h3>
            <p className="text-xs mt-2" style={{ color: colors.text.disabled }}>طلب</p>
          </div>

          <div className={`border rounded-2xl p-6 ${isDark ? 'bg-[#0b0b0b] border-gray-900' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-yellow-950/20 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200'}`}>
                <Clock size={24} className={isDark ? 'text-yellow-400' : 'text-yellow-600'} />
              </div>
              <span className="text-xs" style={{ color: colors.text.muted }}>طلبات معلقة</span>
            </div>
            <h3 className="text-3xl font-black" style={{ color: colors.text.primary }}>{stats.pendingOrders}</h3>
            <p className="text-xs mt-2" style={{ color: colors.text.disabled }}>طلب</p>
          </div>

          <div className={`border rounded-2xl p-6 ${isDark ? 'bg-[#0b0b0b] border-gray-900' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
                <CheckCircle size={24} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
              </div>
              <span className="text-xs" style={{ color: colors.text.muted }}>طلبات مكتملة</span>
            </div>
            <h3 className="text-3xl font-black" style={{ color: colors.text.primary }}>{stats.completedOrders}</h3>
            <p className="text-xs mt-2" style={{ color: colors.text.disabled }}>طلب</p>
          </div>

          <div className={`border rounded-2xl p-6 ${isDark ? 'bg-[#0b0b0b] border-gray-900' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${colors.primary.gold}20`, border: `1px solid ${colors.primary.gold}30` }}>
                <DollarSign size={24} style={{ color: colors.primary.goldLight }} />
              </div>
              <span className="text-xs" style={{ color: colors.text.muted }}>إجمالي الإيرادات</span>
            </div>
            <h3 className="text-3xl font-black" style={{ color: colors.primary.goldLight }}>{stats?.totalRevenue?.toLocaleString('ar-SA') || 0}</h3>
            <p className="text-xs mt-2" style={{ color: colors.text.disabled }}>ريال</p>
          </div>
        </div>
      ) : (
        <div className={`text-center py-16 border rounded-2xl ${isDark ? 'bg-[#0b0b0b] border-gray-900' : 'bg-white border-gray-200'}`}>
          <AlertCircle size={48} className="mx-auto mb-4" style={{ color: colors.text.muted }} />
          <h3 className="text-sm font-bold mb-2" style={{ color: colors.text.muted }}>لا توجد إحصائيات</h3>
          <p className="text-xs mb-4" style={{ color: colors.text.disabled }}>لا توجد بيانات إحصائية حالياً</p>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, Calendar, BedDouble, Users, Sparkles, 
  Clock, UserCheck, ChevronLeft, ConciergeBell, Loader2, ArrowDownRight, ShieldAlert, BarChart3, PieChart, DollarSign
} from 'lucide-react';
import { Room, Reservation, Guest, ServiceRequest, HousekeepingTask, MaintenanceTicket } from '../types';
import { apiService } from '../services/api';
import { useThemeColors } from '../hooks/useThemeColors';

interface DashboardHomeProps {
  onNavigate: (tab: string) => void;
  onOpenQuickBook: () => void;
}

export default function DashboardHome({
  onNavigate,
  onOpenQuickBook
}: DashboardHomeProps) {
  const { colors, isDark } = useThemeColors();
  const [time, setTime] = useState(new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [userRole, setUserRole] = useState<string>('المدير');
  const [isLoading, setIsLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stays, setStays] = useState<any[]>([]);
  const [vips, setVips] = useState<any[]>([]);
  const [specialOrders, setSpecialOrders] = useState<any[]>([]);
  const [restaurantStats, setRestaurantStats] = useState<any>(null);
  const [cafeStats, setCafeStats] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Get user role from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('lytc_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        const roleMap: { [key: string]: string } = {
          'MANAGER': 'المدير',
          'ADMIN': 'المسؤول',
          'STAFF': 'الموظف',
          'GUEST': 'الضيف'
        };
        setUserRole(roleMap[user.role] || 'المدير');
      } catch (e) {
        setUserRole('المدير');
      }
    }
  }, []);

  // Load dashboard data from API
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      // Make requests in parallel for better performance
      const [roomsResult, staysResult, vipsResult, specialOrdersResult, restaurantStatsResult, cafeStatsResult] = await Promise.allSettled([
        apiService.getRooms(undefined, undefined, 0, 100).catch(() => null),
        apiService.getStays(0, 50).catch(() => null),
        apiService.getVips(0, 20).catch(() => null),
        apiService.getManagerSpecialOrders().catch(() => null),
        apiService.getRestaurantStats().catch(() => null),
        apiService.getCafeStats().catch(() => null)
      ]);

      // Process rooms data
      if (roomsResult.status === 'fulfilled' && roomsResult.value) {
        const roomsData = roomsResult.value;
        const transformedRooms = (roomsData.content || []).map((room: any) => ({
          id: room.id.toString(),
          number: room.roomNumber,
          status: room.status.toLowerCase() as Room['status'],
          floor: room.floor,
          type: room.type || 'جناح',
          capacity: room.maxAdults + (room.maxKids || 0),
          pricePerNight: room.price || 0,
          images: room.images || [],
          name: `جناح ${room.roomNumber}`,
          lastUpdated: new Date().toLocaleDateString('ar-SA', { calendar: 'gregory' }),
          occupancyRate: room.status === 'OCCUPIED' ? 100 : 0
        }));
        setRooms(transformedRooms);
      } else {
        setRooms([]);
      }

      // Process stays data
      if (staysResult.status === 'fulfilled' && staysResult.value) {
        const staysData = staysResult.value;
        const staysArray = Array.isArray(staysData) ? staysData : (staysData.content || []);
        setStays(staysArray);
      } else {
        setStays([]);
      }

      // Process VIPs data
      if (vipsResult.status === 'fulfilled' && vipsResult.value) {
        const vipsData = vipsResult.value;
        const vipsArray = Array.isArray(vipsData) ? vipsData : (vipsData.content || []);
        setVips(vipsArray);
      } else {
        setVips([]);
      }

      // Process special orders data
      if (specialOrdersResult.status === 'fulfilled' && specialOrdersResult.value) {
        const specialOrdersData = specialOrdersResult.value;
        const specialOrdersArray = Array.isArray(specialOrdersData) ? specialOrdersData : [];
        setSpecialOrders(specialOrdersArray);
      } else {
        setSpecialOrders([]);
      }

      // Process restaurant stats
      if (restaurantStatsResult.status === 'fulfilled' && restaurantStatsResult.value) {
        setRestaurantStats(restaurantStatsResult.value);
      }

      // Process cafe stats
      if (cafeStatsResult.status === 'fulfilled' && cafeStatsResult.value) {
        setCafeStats(cafeStatsResult.value);
      }

      setIsLoading(false);
    };

    loadDashboardData();
  }, []);

  // Compute live real metrics from API data
  const totalBookings = (stays || []).length;
  const occupiedRoomsCount = (rooms || []).filter(r => r.status === 'occupied').length;
  const availableRoomsCount = (rooms || []).filter(r => r.status === 'available').length;
  const totalRoomsCount = (rooms || []).length;
  
  // Calculate total room revenue from stays (room charge × number of nights)
  const totalRoomRevenue = (stays || []).reduce((sum, stay) => {
    const roomCharge = stay.roomCharge || 0;
    const checkIn = stay.checkInTime ? new Date(stay.checkInTime) : (stay.expectedCheckInDate ? new Date(stay.expectedCheckInDate) : null);
    const checkOut = stay.expectedCheckOutDate ? new Date(stay.expectedCheckOutDate) : null;
    if (checkIn && checkOut && roomCharge > 0) {
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000);
      return sum + (roomCharge * nights);
    }
    // Fallback to totalCharge if available
    return sum + (stay.totalCharge || 0);
  }, 0);
  
  const activeGuestsCount = (stays || []).filter(s => s.status === 'CHECKED_IN').length;

  const pendingRequestsCount = (specialOrders || []).filter(s => s.status === 'PENDING').length;

  // New Executive Dashboard KPIs
  const averageRoomRate = (rooms || []).length > 0 
    ? (rooms || []).reduce((sum, r) => sum + r.pricePerNight, 0) / (rooms || []).length 
    : 0;
  
  // Occupancy Rate: (Occupied Rooms ÷ Total Available Rooms) × 100
  const occupancyRate = totalRoomsCount > 0 
    ? (occupiedRoomsCount / totalRoomsCount) * 100 
    : 0;
  
  // ADR: Total Room Revenue ÷ Number of Rooms Sold (occupied rooms)
  const adr = occupiedRoomsCount > 0 
    ? totalRoomRevenue / occupiedRoomsCount 
    : 0;
  
  // RevPAR: Total Room Revenue ÷ Total Available Rooms
  const revPAR = totalRoomsCount > 0 
    ? totalRoomRevenue / totalRoomsCount 
    : 0;

  const directBookings = (stays || []).filter(s => s.bookingSource === 'DIRECT' || !s.bookingSource).length;

  const platformBookings = (stays || []).filter(s => s.bookingSource && s.bookingSource !== 'DIRECT').length;

  const cancellationRate = (stays || []).length > 0 
    ? ((stays || []).filter(s => s.status === 'CANCELLED').length / (stays || []).length) * 100 
    : 0;

  const pendingHousekeeping = (rooms || []).filter(r => r.status === 'cleaning').length;

  const vipGuestsArriving = (vips || []).length;

  const latestReservations = [...(stays || [])]
    .sort((a, b) => b.id - a.id)
    .slice(0, 4);

  const recentRequests = [...(specialOrders || [])]
    .filter(s => s.status !== 'COMPLETED')
    .slice(0, 4);

  return (
    <div className="space-y-8 pb-12">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="text-[#D4AF37] animate-spin" />
        </div>
      ) : (
        <>
      {/* Upper Welcoming Banner */}
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 p-6 lg:p-8 rounded-2xl border relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-[#0c0c0c] via-[#121212] to-[#0a0a0a] border-[#D4AF37]/15 shadow-[0_15px_35px_rgba(0,0,0,0.6)]' : 'bg-gradient-to-br from-white via-gray-50 to-gray-100 border-[#D4AF37]/20 shadow-[0_15px_35px_rgba(0,0,0,0.1)]'}`}>
        {/* Abstract Golden Circles Backdrop */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial-gradient from-[#D4AF37]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-12 w-48 h-48 bg-radial-gradient from-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs" style={{ color: colors.text.muted }}>النظام الفني متصل ومستقر</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: colors.primary.goldLight }}>
            مرحباً {userRole}
          </h1>
          <p className="text-sm max-w-xl" style={{ color: colors.text.secondary }}>
            مستويات الإشغال والتشغيل في قصر ليتك الفاخر عند الحد الأعلى لليوم. جميع الأقسام والخدمات تعمل بكامل طاقتها الاستيعابية بنجاح.
          </p>
        </div>

        {/* Live Clock Widget */}
        <div className={`flex items-center gap-6 border p-4 rounded-xl backdrop-blur-md relative z-10 self-stretch lg:self-auto justify-between lg:justify-start ${isDark ? 'bg-[#000000]/30 border-gray-800' : 'bg-white/50 border-gray-200'}`}>
          <div className="text-left">
            <div className="flex items-center gap-2 text-xs" style={{ color: colors.text.muted }}>
              <Clock size={14} style={{ color: colors.primary.gold }} />
              <span>الوقت المحلي للرياض</span>
            </div>
            <div className="text-2xl font-black font-mono tracking-widest mt-1" style={{ color: colors.primary.goldLight }}>
              {time}
            </div>
            <div className="text-xs mt-0.5" style={{ color: colors.text.disabled }}>{new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', calendar: 'gregory' })}</div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1: Reservations */}
        <button 
          onClick={() => onNavigate('الحجوزات')}
          className={`p-4 sm:p-6 border rounded-xl hover:border-[#D4AF37]/35 transition-all duration-300 relative group overflow-hidden w-full text-left ${isDark ? 'bg-[#0c0c0c] border-gray-900' : 'bg-white border-gray-200'}`}
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#D4AF37]" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs sm:text-xs font-bold" style={{ color: colors.text.muted }}>إجمالي الحجوزات النشطة</p>
              <h3 className="text-2xl sm:text-3xl font-black mt-1 sm:mt-2 font-mono" style={{ color: colors.text.primary }}>{totalBookings}</h3>
            </div>
            <div className="p-3 rounded-xl border" style={{ background: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)', color: colors.primary.gold, borderColor: `${colors.primary.gold}10` }}>
              <Calendar size={22} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs" style={{ color: colors.text.muted }}>
            <span style={{ color: colors.text.disabled }}>مقارنة بالأسبوع الماضي</span>
          </div>
        </button>

        {/* KPI 2: Occupied Rooms */}
        <button 
          onClick={() => onNavigate('الغرف')}
          className={`p-4 sm:p-6 border rounded-xl hover:border-blue-500/35 transition-all duration-300 relative group overflow-hidden w-full text-left ${isDark ? 'bg-[#0c0c0c] border-gray-900' : 'bg-white border-gray-200'}`}
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs sm:text-xs font-bold" style={{ color: colors.text.muted }}>الغرف المشغولة الآن</p>
              <h3 className="text-2xl sm:text-3xl font-black mt-1 sm:mt-2 font-mono" style={{ color: colors.text.primary }}>
                {occupiedRoomsCount} <span className="text-xs sm:text-xs font-sans" style={{ color: colors.text.muted }}>/ {rooms.length}</span>
              </h3>
            </div>
            <div className={`p-2 sm:p-3 rounded-xl border ${isDark ? 'bg-blue-950/20 text-blue-400 border-blue-500/10' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
              <BedDouble size={window.innerWidth >= 640 ? 22 : 18} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 sm:mt-4 text-xs sm:text-xs" style={{ color: colors.text.muted }}>
            <span className="font-bold" style={{ color: colors.primary.gold }}>
              {Math.round((occupiedRoomsCount / rooms.length) * 100)}%
            </span>
            <span style={{ color: colors.text.disabled }}>معدل الإشغال الإجمالي</span>
          </div>
        </button>

        {/* KPI 3: Available Rooms */}
        <button 
          onClick={() => onNavigate('الغرف')}
          className={`p-4 sm:p-6 border rounded-xl hover:border-emerald-500/35 transition-all duration-300 relative group overflow-hidden w-full text-left ${isDark ? 'bg-[#0c0c0c] border-gray-900' : 'bg-white border-gray-200'}`}
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs sm:text-xs font-bold" style={{ color: colors.text.muted }}>الغرف المتاحة للحجز</p>
              <h3 className="text-2xl sm:text-3xl font-black mt-1 sm:mt-2 font-mono" style={{ color: isDark ? '#34D399' : '#059669' }}>
                {availableRoomsCount}
              </h3>
            </div>
            <div className={`p-2 sm:p-3 rounded-xl border ${isDark ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/10' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
              <UserCheck size={window.innerWidth >= 640 ? 22 : 18} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 sm:mt-4 text-xs sm:text-xs" style={{ color: colors.text.muted }}>
            <span className="font-bold" style={{ color: isDark ? '#34D399' : '#059669' }}>
              {(rooms || []).filter(r => r.status === 'cleaning').length} غرف
            </span>
            <span style={{ color: colors.text.disabled }}>تحت التنظيف حالياً</span>
          </div>
        </button>

        {/* KPI 4: Active Guests */}
        <button 
          onClick={() => onNavigate('النزلاء')}
          className={`p-4 sm:p-6 border rounded-xl hover:border-purple-500/35 transition-all duration-300 relative group overflow-hidden w-full text-left ${isDark ? 'bg-[#0c0c0c] border-gray-900' : 'bg-white border-gray-200'}`}
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs sm:text-xs font-bold" style={{ color: colors.text.muted }}>النزلاء المقيمين الآن</p>
              <h3 className="text-2xl sm:text-3xl font-black mt-1 sm:mt-2 font-mono" style={{ color: colors.text.primary }}>
                {activeGuestsCount}
              </h3>
            </div>
            <div className={`p-2 sm:p-3 rounded-xl border ${isDark ? 'bg-purple-950/20 text-purple-400 border-purple-500/10' : 'bg-purple-50 text-purple-600 border-purple-200'}`}>
              <Users size={window.innerWidth >= 640 ? 22 : 18} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 sm:mt-4 text-xs sm:text-xs" style={{ color: colors.text.muted }}>
            <span style={{ color: colors.text.disabled }}>نزيل نشط حالياً</span>
          </div>
        </button>
      </div>

      {/* Expanded Executive Dashboard KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Occupancy Rate */}
        <button 
          onClick={() => onNavigate('الحجوزات')}
          className={`p-4 border rounded-xl flex items-center justify-between hover:border-[#D4AF37]/35 transition duration-200 w-full text-left ${isDark ? 'bg-[#090909] border-gray-900' : 'bg-white border-gray-200'}`}
        >
          <div className="space-y-1">
            <span className="text-xs" style={{ color: colors.text.muted }}>معدل الإشغال</span>
            <div className="text-lg font-bold font-mono" style={{ color: colors.primary.gold }}>{occupancyRate.toFixed(1)}%</div>
            <div className="text-xs" style={{ color: colors.text.disabled }}>{occupiedRoomsCount} من {totalRoomsCount} غرفة</div>
          </div>
          <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-950/20 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
            <PieChart size={16} />
          </div>
        </button>

        {/* ADR */}
        <button 
          onClick={() => onNavigate('المدفوعات')}
          className={`p-4 border rounded-xl flex items-center justify-between hover:border-emerald-500/35 transition duration-200 w-full text-left ${isDark ? 'bg-[#090909] border-gray-900' : 'bg-white border-gray-200'}`}
        >
          <div className="space-y-1">
            <span className="text-xs" style={{ color: colors.text.muted }}>متوسط السعر اليومي</span>
            <div className="text-lg font-bold font-mono" style={{ color: colors.text.primary }}>{Math.round(adr)} ريال</div>
            <div className="text-xs" style={{ color: colors.text.disabled }}>للغرفة المباعة</div>
          </div>
          <div className={`p-2 rounded-lg ${isDark ? 'bg-emerald-950/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
            <DollarSign size={16} />
          </div>
        </button>

        {/* RevPAR */}
        <button 
          onClick={() => onNavigate('المدفوعات')}
          className={`p-4 border rounded-xl flex items-center justify-between hover:border-blue-500/35 transition duration-200 w-full text-left ${isDark ? 'bg-[#090909] border-gray-900' : 'bg-white border-gray-200'}`}
        >
          <div className="space-y-1">
            <span className="text-xs" style={{ color: colors.text.muted }}>الإيراد لكل غرفة متاحة</span>
            <div className="text-lg font-bold font-mono" style={{ color: colors.text.primary }}>{Math.round(revPAR)} ريال</div>
            <div className="text-xs" style={{ color: colors.text.disabled }}>بناءً على الإشغال</div>
          </div>
          <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-950/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
            <BarChart3 size={16} />
          </div>
        </button>

        {/* Average Room Rate */}
        <button 
          onClick={() => onNavigate('الغرف')}
          className={`p-4 border rounded-xl flex items-center justify-between hover:border-purple-500/35 transition duration-200 w-full text-left ${isDark ? 'bg-[#090909] border-gray-900' : 'bg-white border-gray-200'}`}
        >
          <div className="space-y-1">
            <span className="text-xs" style={{ color: colors.text.muted }}>متوسط سعر الغرفة</span>
            <div className="text-lg font-bold font-mono" style={{ color: colors.text.primary }}>{Math.round(averageRoomRate)} ريال</div>
          </div>
          <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-950/20 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
            <TrendingUp size={16} />
          </div>
        </button>
      </div>

      {/* Secondary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Direct Bookings */}
        <button 
          onClick={() => onNavigate('الحجوزات')}
          className={`p-4 border rounded-xl flex items-center justify-between hover:border-emerald-500/35 transition duration-200 w-full text-left ${isDark ? 'bg-[#090909] border-gray-900' : 'bg-white border-gray-200'}`}
        >
          <div className="space-y-1">
            <span className="text-xs" style={{ color: colors.text.muted }}>الحجوزات المباشرة</span>
            <div className="text-lg font-bold font-mono" style={{ color: colors.text.primary }}>{directBookings}</div>
          </div>
          <div className={`p-2 rounded-lg ${isDark ? 'bg-emerald-950/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
            <Calendar size={16} />
          </div>
        </button>

        {/* Cancellation Rate */}
        <button 
          onClick={() => onNavigate('الحجوزات')}
          className={`p-4 border rounded-xl flex items-center justify-between hover:border-red-500/35 transition duration-200 w-full text-left ${isDark ? 'bg-[#090909] border-gray-900' : 'bg-white border-gray-200'}`}
        >
          <div className="space-y-1">
            <span className="text-xs" style={{ color: colors.text.muted }}>معدل الإلغاء</span>
            <div className="text-lg font-bold font-mono" style={{ color: colors.text.primary }}>{cancellationRate.toFixed(1)}%</div>
          </div>
          <div className={`p-2 rounded-lg ${isDark ? 'bg-red-950/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
            <ArrowDownRight size={16} />
          </div>
        </button>
      </div>

      {/* Secondary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Housekeeping */}
        <button 
          onClick={() => onNavigate('الغرف')}
          className={`p-4 border rounded-xl flex items-center justify-between hover:border-teal-500/35 transition duration-200 w-full ${isDark ? 'bg-[#090909] border-gray-900' : 'bg-white border-gray-200'}`}
        >
          <div className="space-y-1 text-right">
            <span className="text-xs" style={{ color: colors.text.muted }}>غرف تحت التنظيف</span>
            <div className="text-lg font-bold font-mono" style={{ color: colors.text.primary }}>{pendingHousekeeping}</div>
          </div>
          <div className={`p-2 rounded-lg ${isDark ? 'bg-teal-950/20 text-teal-400' : 'bg-teal-50 text-teal-600'}`}>
            <Sparkles size={16} />
          </div>
        </button>

        {/* VIP Guests Arriving */}
        <button 
          onClick={() => onNavigate('النزلاء')}
          className={`p-4 border rounded-xl flex items-center justify-between hover:border-rose-500/35 transition duration-200 w-full text-left ${isDark ? 'bg-[#090909] border-gray-900' : 'bg-white border-gray-200'}`}
        >
          <div className="space-y-1">
            <span className="text-xs" style={{ color: colors.text.muted }}>الضيوف المهمون القادمين</span>
            <div className="text-lg font-bold font-mono" style={{ color: colors.text.primary }}>{vipGuestsArriving}</div>
          </div>
          <div className={`p-2 rounded-lg ${isDark ? 'bg-rose-950/20 text-rose-400' : 'bg-rose-50 text-rose-600'}`}>
            <ShieldAlert size={16} />
          </div>
        </button>

        {/* Pending Special Orders */}
        <button 
          onClick={() => onNavigate('الطلبات الخاصة')}
          className={`p-4 border rounded-xl flex items-center justify-between hover:border-amber-500/35 transition duration-200 w-full text-left ${isDark ? 'bg-[#090909] border-gray-900' : 'bg-white border-gray-200'}`}
        >
          <div className="space-y-1">
            <span className="text-xs" style={{ color: colors.text.muted }}>الطلبات الخاصة المعلقة</span>
            <div className="text-lg font-bold font-mono" style={{ color: colors.text.primary }}>{pendingRequestsCount}</div>
          </div>
          <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-950/20 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
            <ConciergeBell size={16} />
          </div>
        </button>
      </div>

      {/* Main Panel: Tables & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Guests & Bookings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Reservations Panel */}
          <div className={`border rounded-xl p-6 shadow-xl space-y-4 ${isDark ? 'bg-[#0b0b0b] border-gray-900' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: colors.primary.goldLight }}>
                <Calendar size={18} />
                <span>أحدث الحجوزات المسجلة</span>
              </h2>
              <button 
                onClick={() => onNavigate('الحجوزات')}
                className="text-xs hover:underline flex items-center gap-1"
                style={{ color: colors.primary.gold }}
              >
                <span>عرض الكل</span>
                <ChevronLeft size={14} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className={`border-b pb-2 ${isDark ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-600'}`}>
                    <th className="py-3 font-bold">النزيل</th>
                    <th className="py-3 font-bold">رقم الغرفة</th>
                    <th className="py-3 font-bold">تاريخ الإقامة</th>
                    <th className="py-3 font-bold">الحالة</th>
                    <th className="py-3 font-bold text-left">المبلغ</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-800/50' : 'divide-gray-200'}`}>
                  {latestReservations.map((res) => (
                    <tr key={res.id} className={`transition duration-150 ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'}`}>
                      <td className="py-3.5 font-bold" style={{ color: colors.text.primary }}>{res.guestName}</td>
                      <td className="py-3.5">
                        <span className={`px-2.5 py-0.5 border rounded text-xs font-mono ${isDark ? 'bg-[#121212] border-gray-800 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-700'}`}>
                          {res.roomNumber}
                        </span>
                      </td>
                      <td className="py-3.5 text-xs font-mono" style={{ color: colors.text.muted }}>
                        {res.checkIn} ── {res.checkOut}
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          res.status === 'checked_in' ? (isDark ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200') :
                          res.status === 'checked_out' ? (isDark ? 'bg-gray-900 text-gray-400 border-gray-800' : 'bg-gray-100 text-gray-600 border-gray-300') :
                          (isDark ? 'bg-amber-950/40 text-[#D4AF37] border-[#D4AF37]/20' : 'bg-amber-50 text-amber-700 border-amber-200')
                        }`}>
                          {res.status === 'checked_in' ? 'مقيم حالياً' :
                           res.status === 'checked_out' ? 'مغادر' :
                           'وصول متوقع'}
                        </span>
                      </td>
                      <td className="py-3.5 text-left font-mono font-bold" style={{ color: colors.primary.goldLight }}>
                        {res.amount ? res.amount.toLocaleString('ar-SA') : '0'} ريال
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Guest Requests Ticker */}
          <div className={`border rounded-xl p-6 shadow-xl space-y-4 ${isDark ? 'bg-[#0b0b0b] border-gray-900' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: colors.primary.goldLight }}>
                <ConciergeBell size={18} />
                <span>الطلبات الخاصة النشطة</span>
              </h2>
              <button 
                onClick={() => onNavigate('الطلبات الخاصة')}
                className="text-xs hover:underline flex items-center gap-1"
                style={{ color: colors.primary.gold }}
              >
                <span>إدارة الطلبات</span>
                <ChevronLeft size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentRequests.length > 0 ? recentRequests.map((req) => (
                <div key={req.id} className={`p-4 border rounded-xl hover:border-[#D4AF37]/20 transition duration-200 flex flex-col justify-between space-y-3 ${isDark ? 'bg-[#121212] border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full border flex items-center justify-center" style={{ background: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)', borderColor: `${colors.primary.gold}20`, color: colors.primary.gold }}>
                        <ConciergeBell size={14} />
                      </span>
                      <div>
                        <span className="text-xs font-bold" style={{ color: colors.text.muted }}>طلب #{req.id}</span>
                        <div className="text-xs font-mono" style={{ color: colors.text.disabled }}>{new Date(req.createdAt).toLocaleDateString('ar-SA')}</div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                      req.status === 'PENDING' ? (isDark ? 'bg-amber-950/40 text-amber-500 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200') :
                      req.status === 'IN_PROGRESS' ? (isDark ? 'bg-blue-950/40 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-700 border-blue-200') :
                      (isDark ? 'bg-gray-900 text-gray-400 border-gray-800' : 'bg-gray-100 text-gray-600 border-gray-300')
                    }`}>
                      {req.status === 'PENDING' ? 'قيد الانتظار' : 
                       req.status === 'IN_PROGRESS' ? 'جاري التنفيذ' :
                       'مكتمل'}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed font-bold line-clamp-2" style={{ color: colors.text.secondary }}>
                    {req.description || 'طلب خاص'}
                  </p>
                </div>
              )) : (
                <div className="col-span-2 text-center py-8 text-xs" style={{ color: colors.text.muted }}>
                  لا توجد طلبات خاصة نشطة
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Activities */}
        <div className="space-y-6">
          {/* Live System Activities Feed - Removed dummy data */}
        </div>
      </div>
        </>
      )}
    </div>
  );
}

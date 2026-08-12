import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar, User, Plus, Search, XCircle, ChevronLeft, ChevronRight,
  X, Loader2, Building, Clock, DollarSign, Save,
  Check, AlertCircle, Mail, Phone, Globe, CreditCard
} from 'lucide-react';
import { apiService, StayDetailsResponse, CreateStayRequest, ReservationRequestResponse, ApproveReservationRequest, RejectReservationRequest, RoomResponse } from '../services/api';

type ViewMode = 'month' | 'week' | 'day';

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'RESERVED': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
  'ACTIVE': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  'CLOSED': { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' },
  'CANCELLED': { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', dot: 'bg-red-500' },
  'NO_SHOW': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  'PENDING': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  'APPROVED': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
  'REJECTED': { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', dot: 'bg-red-500' },
};

const STATUS_LABELS: Record<string, string> = {
  'RESERVED': 'محجوز',
  'ACTIVE': 'نشط',
  'CLOSED': 'مغلق',
  'CANCELLED': 'ملغي',
  'NO_SHOW': 'لم يحضر',
  'PENDING': 'قيد الانتظار',
  'APPROVED': 'موافق عليه',
  'REJECTED': 'مرفوض',
};

const DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTH_NAMES = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export default function ReservationsSection({ onCheckout }: { onCheckout?: () => void }) {
  const [stays, setStays] = useState<StayDetailsResponse[]>([]);
  const [reservationRequests, setReservationRequests] = useState<ReservationRequestResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [displayMode, setDisplayMode] = useState<'calendar' | 'table'>('calendar');
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedStay, setSelectedStay] = useState<StayDetailsResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<RoomResponse[]>([]);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ReservationRequestResponse | null>(null);
  const [selectedRoomForApproval, setSelectedRoomForApproval] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [availableRoomsForApproval, setAvailableRoomsForApproval] = useState<RoomResponse[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showPendingRequests, setShowPendingRequests] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  useEffect(() => {
    // Load stays and reservation requests in parallel
    const loadData = async () => {
      setIsLoading(true);
      await Promise.allSettled([
        loadStays(),
        loadReservationRequests()
      ]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const loadStays = async () => {
    setError(null);
    try {
      const response = await apiService.getStays(0, 200);
      setStays(response.content || []);
    } catch (e: any) {
      setError('فشل تحميل الحجوزات');
      setStays([]);
    }
  };

  const loadReservationRequests = async () => {
    try {
      const response = await apiService.getPendingReservationRequests(0, 100);
      setReservationRequests(response.content || []);
    } catch (e: any) {
      console.error('Failed to load reservation requests:', e);
      setReservationRequests([]);
    }
  };

  const loadAvailableRooms = async () => {
    try {
      const response = await apiService.getRooms(undefined, undefined, 0, 50);
      const filteredRooms = (response.content || []).filter((r: any) => (r.status || '').toUpperCase() === 'AVAILABLE');
      setAvailableRooms(filteredRooms);
    } catch (e) {
      console.error('Failed to load available rooms:', e);
      setAvailableRooms([]);
    }
  };

  const handleCreate = async () => {
    if (!guestName || !selectedRoomNumber || !checkIn || !checkOut) { setCreateError('يرجى تعبئة جميع الحقول'); return; }
    setIsCreating(true);
    setCreateError(null);
    try {
      const stayData = { 
        guestName, 
        phone: '0550000000', 
        roomNumber: selectedRoomNumber, 
        numAdults: adults, 
        numKids: children, 
        expectedCheckInDate: checkIn, 
        expectedCheckOutDate: checkOut 
      };
      
      await apiService.createStay(stayData);
      
      // Update room status to OCCUPIED after booking
      try {
        const roomToUpdate = availableRooms.find((r: RoomResponse) => (r.roomNumber || r.id.toString()) === selectedRoomNumber);
        if (roomToUpdate) {
          await apiService.updateRoom(roomToUpdate.id, { 
            roomNumber: roomToUpdate.roomNumber || roomToUpdate.id.toString(), 
            categoryId: roomToUpdate.categoryId,
            status: 'OCCUPIED',
            floor: roomToUpdate.floor,
            viewType: roomToUpdate.viewType,
            description: roomToUpdate.description
          });
        }
      } catch (updateError) {
        console.error('Failed to update room status:', updateError);
      }
      
      setIsCreateModalOpen(false);
      setGuestName(''); setSelectedRoomNumber(''); setCheckIn(''); setCheckOut(''); setAdults(2); setChildren(0);
      loadStays();
    } catch (e: any) {
      console.error('Failed to create stay:', e);
      setCreateError(e.message || 'فشل إنشاء الحجز');
    }
    finally { setIsCreating(false); }
  };

  const handleCheckIn = async (stayId: number) => {
    try {
      await apiService.checkInStay(stayId);
    } catch {}
    // Always reload to sync with backend state
    loadStays();
  };
  const handleCheckOut = async (stayId: number) => {
    try {
      await apiService.checkOutStay(stayId);
      
      // Update room status to AVAILABLE after checkout
      const stay = stays.find((s: StayDetailsResponse) => s.stayId === stayId);
      if (stay && (stay.roomNumber || stay.roomId)) {
        try {
          const rooms = await apiService.getRooms(undefined, undefined, 0, 100);
          const roomToUpdate = (rooms.content || []).find((r: RoomResponse) => (r.roomNumber || r.id.toString()) === (stay.roomNumber || stay.roomId?.toString()));
          if (roomToUpdate) {
            await apiService.updateRoom(roomToUpdate.id, { 
              roomNumber: roomToUpdate.roomNumber || roomToUpdate.id.toString(), 
              categoryId: roomToUpdate.categoryId,
              status: 'AVAILABLE',
              floor: roomToUpdate.floor,
              viewType: roomToUpdate.viewType,
              description: roomToUpdate.description
            });
          }
        } catch (updateError) {
          console.error('Failed to update room status:', updateError);
        }
      }
    } catch {}
    // Always reload to sync with backend state, even on 409
    loadStays();
    if (onCheckout) onCheckout();
  };

  // Filter stays
  const filteredStays = useMemo(() => stays.filter(s => {
    const matchSearch = !searchQuery || s.guestName.toLowerCase().includes(searchQuery.toLowerCase()) || s.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchSearch && matchStatus;
  }), [stays, searchQuery, filterStatus]);

  // Filter reservation requests
  const filteredRequests = useMemo(() => reservationRequests.filter(r => r.status === 'PENDING'), [reservationRequests]);

  const handleApproveRequest = async () => {
    if (!selectedRequest || !selectedRoomForApproval) return;
    try {
      await apiService.approveReservationRequest(selectedRequest.id, { roomId: selectedRoomForApproval });
      setIsApproveModalOpen(false);
      setSelectedRequest(null);
      setSelectedRoomForApproval(null);
      loadReservationRequests();
      loadStays();
    } catch (e: any) {
      console.error('Failed to approve request:', e);
      alert('فشل الموافقة على الطلب');
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest || !rejectReason.trim()) return;
    try {
      await apiService.rejectReservationRequest(selectedRequest.id, { reason: rejectReason });
      setIsRejectModalOpen(false);
      setSelectedRequest(null);
      setRejectReason('');
      loadReservationRequests();
    } catch (e: any) {
      console.error('Failed to reject request:', e);
      alert('فشل رفض الطلب');
    }
  };

  const loadAvailableRoomsForApproval = async () => {
    try {
      const response = await apiService.getRooms('AVAILABLE', undefined, 0, 100);
      setAvailableRoomsForApproval(response.content || []);
    } catch (e) {
      console.error('Failed to load available rooms:', e);
      setAvailableRoomsForApproval([]);
    }
  };

  const openApproveModal = (request: ReservationRequestResponse) => {
    setSelectedRequest(request);
    loadAvailableRoomsForApproval();
    setIsApproveModalOpen(true);
  };

  const openRejectModal = (request: ReservationRequestResponse) => {
    setSelectedRequest(request);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const monthDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  const getStaysForDate = (date: Date) => {
    return filteredStays.filter(s => {
      // Use expectedCheckInDate if checkInTime is null (for future reservations)
      const checkInDate = s.checkInTime ? new Date(s.checkInTime) : new Date(s.expectedCheckInDate);
      const checkOutDate = new Date(s.expectedCheckOutDate);
      
      if (!checkInDate || !checkOutDate) return false;
      
      // Reset time to midnight for accurate date comparison
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      const checkInMidnight = new Date(checkInDate);
      checkInMidnight.setHours(0, 0, 0, 0);
      
      const checkOutMidnight = new Date(checkOutDate);
      checkOutMidnight.setHours(0, 0, 0, 0);
      
      const isInRange = targetDate >= checkInMidnight && targetDate <= checkOutMidnight;
      
      return isInRange;
    });
  };

  const navigate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + direction);
    else if (viewMode === 'week') newDate.setDate(newDate.getDate() + (direction * 7));
    else newDate.setDate(newDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() && date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();
  };

  const getStatusColor = (status: string) => STATUS_COLORS[status] || { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' };
  const getStatusLabel = (status: string) => STATUS_LABELS[status] || '—';

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-black text-gray-900">الحجوزات</h1>
          <p className="text-sm mt-1 text-gray-500">عرض وإدارة حجوزات الفندق على التقويم.</p>
        </div>
        <div className="flex items-center gap-3">
          {filteredRequests.length > 0 && (
            <button onClick={() => setShowPendingRequests(!showPendingRequests)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition ${showPendingRequests ? 'bg-[#D4AF37] text-white' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
              <AlertCircle size={18} />
              <span>طلبات معلقة ({filteredRequests.length})</span>
            </button>
          )}
          <button onClick={() => { loadAvailableRooms(); setIsCreateModalOpen(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#AA7B30] to-[#D4AF37] text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition">
            <Plus size={18} /><span>حجز جديد</span>
          </button>
        </div>
      </div>

      {/* Pending Requests Section */}
      {showPendingRequests && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">طلبات الحجوز المعلقة (من صفحة الهبوط)</h3>
            <button onClick={() => setShowPendingRequests(false)} className="p-2 hover:bg-gray-100 rounded-lg transition"><X size={18} className="text-gray-500" /></button>
          </div>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm font-bold">لا توجد طلبات معلقة</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredRequests.map(request => (
                <div key={request.id} className="p-5 hover:bg-gray-50 transition">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS['PENDING'].bg} ${STATUS_COLORS['PENDING'].text} ${STATUS_COLORS['PENDING'].border}`}>
                          <span className={`w-2 h-2 rounded-full ${STATUS_COLORS['PENDING'].dot}`}></span>
                          {STATUS_LABELS['PENDING']}
                        </span>
                        <span className="text-xs text-gray-400">#{request.id}</span>
                        <span className="text-xs text-gray-400">{new Date(request.createdAt).toLocaleDateString('ar-SA')}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-700"><User size={14} />{request.guestName}</div>
                        <div className="flex items-center gap-2 text-gray-700"><Mail size={14} />{request.guestEmail}</div>
                        <div className="flex items-center gap-2 text-gray-700"><Phone size={14} />{request.guestPhone}</div>
                        <div className="flex items-center gap-2 text-gray-700"><Globe size={14} />{request.nationality || 'غير محدد'}</div>
                        <div className="flex items-center gap-2 text-gray-700"><Building size={14} />{request.categoryName}</div>
                        <div className="flex items-center gap-2 text-gray-700"><DollarSign size={14} />{request.quotedTotalCharge?.toLocaleString('ar-SA')} ريال</div>
                        <div className="flex items-center gap-2 text-gray-700"><Calendar size={14} />{new Date(request.checkInDate).toLocaleDateString('ar-SA')} → {new Date(request.checkOutDate).toLocaleDateString('ar-SA')}</div>
                        <div className="flex items-center gap-2 text-gray-700"><User size={14} />{request.numAdults} بالغين, {request.numKids} أطفال</div>
                      </div>
                      {request.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                          <span className="font-bold">ملاحظات:</span> {request.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openApproveModal(request)} className="px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-bold hover:bg-green-100 transition flex items-center gap-2">
                        <Check size={16} />موافقة
                      </button>
                      <button onClick={() => openRejectModal(request)} className="px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition flex items-center gap-2">
                        <XCircle size={16} />رفض
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Calendar Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Navigation */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition"><ChevronRight size={18} className="text-gray-600" /></button>
          <button onClick={goToToday} className="px-4 py-2 border border-[#D4AF37] text-[#AA7B37] bg-white rounded-xl text-sm font-bold hover:bg-amber-50 transition">اليوم</button>
          <button onClick={() => navigate(1)} className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition"><ChevronLeft size={18} className="text-gray-600" /></button>
          <h2 className="text-lg font-black text-gray-900 mr-2">
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
        </div>

        {/* View Mode + Display Mode + Search + Filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Display Mode Toggle */}
          <div className="flex border border-gray-200 rounded-xl bg-white overflow-hidden">
            <button onClick={() => setDisplayMode('calendar')} className={`px-4 py-2 text-sm font-bold transition ${displayMode === 'calendar' ? 'bg-[#D4AF37] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              تقويم
            </button>
            <button onClick={() => setDisplayMode('table')} className={`px-4 py-2 text-sm font-bold transition ${displayMode === 'table' ? 'bg-[#D4AF37] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              جدول
            </button>
          </div>
          
          {/* Calendar View Mode */}
          {displayMode === 'calendar' && (
            <div className="flex border border-gray-200 rounded-xl bg-white overflow-hidden">
              {(['month', 'week', 'day'] as ViewMode[]).map(v => (
                <button key={v} onClick={() => setViewMode(v)} className={`px-4 py-2 text-sm font-bold transition ${viewMode === v ? 'bg-[#D4AF37] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                  {v === 'month' ? 'شهر' : v === 'week' ? 'أسبوع' : 'يوم'}
                </button>
              ))}
            </div>
          )}
          
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="بحث..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-white border border-gray-200 focus:border-[#D4AF37] rounded-xl pr-10 pl-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none w-40 transition" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#D4AF37]">
            <option value="all">الكل</option>
            <option value="RESERVED">محجوز</option>
            <option value="ACTIVE">نشط</option>
            <option value="CLOSED">مغلق</option>
            <option value="CANCELLED">ملغي</option>
            <option value="NO_SHOW">لم يحضر</option>
          </select>
        </div>
      </div>

      {/* Loading / Error */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={32} className="text-[#D4AF37] animate-spin" /></div>
      ) : error ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl">
          <XCircle size={48} className="text-red-400 mx-auto mb-4" /><p className="text-gray-500 text-sm font-bold mb-4">{error}</p>
          <button onClick={loadStays} className="px-5 py-2 bg-[#D4AF37] text-white font-bold text-sm rounded-xl">إعادة المحاولة</button>
        </div>
      ) : (
        <>
          {/* Table View (Existing) */}
          {displayMode === 'table' && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-500">رقم الحجز</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-500">اسم الضيف</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-500">رقم الغرفة</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-500">تاريخ الدخول</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-500">تاريخ المغادرة</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-500">الحالة</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-500">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredStays.map(s => {
                      const sc = getStatusColor(s.status);
                      return (
                        <tr key={s.stayId} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => { setSelectedStay(s); setIsModalOpen(true); }}>
                          <td className="px-6 py-4 text-sm font-bold text-gray-900">#{s.stayId}</td>
                          <td className="px-6 py-4 text-sm text-gray-800">{s.guestName}</td>
                          <td className="px-6 py-4 text-sm text-gray-800">{s.roomNumber}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{s.checkInTime ? new Date(s.checkInTime).toLocaleDateString('ar-SA') : (s.expectedCheckInDate ? new Date(s.expectedCheckInDate).toLocaleDateString('ar-SA') : 'غير متاح')}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{s.expectedCheckOutDate ? new Date(s.expectedCheckOutDate).toLocaleDateString('ar-SA') : 'غير متاح'}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>
                              <span className={`w-2 h-2 rounded-full ${sc.dot}`}></span>
                              {getStatusLabel(s.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              {s.status === 'RESERVED' ? (
                                <button onClick={e => { e.stopPropagation(); handleCheckIn(s.stayId); }} className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition">دخول</button>
                              ) : s.status === 'ACTIVE' ? (
                                <button onClick={e => { e.stopPropagation(); handleCheckOut(s.stayId); }} className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition">مغادرة</button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredStays.length === 0 && (
                <div className="text-center py-12 text-gray-400 text-sm font-bold">لا توجد حجوزات</div>
              )}
            </div>
          )}

          {/* Calendar View */}
          {displayMode === 'calendar' && (
            <div className="flex gap-6">
              {/* Main Calendar (Center) */}
              <div className="flex-1">
                {/* Month View */}
                {viewMode === 'month' && (
                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 border-b border-gray-200">
                      {DAY_NAMES.map(d => <div key={d} className="p-4 text-center text-sm font-bold text-gray-500">{d}</div>)}
                    </div>
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7">
                      {monthDays.map((day, idx) => {
                        if (day === null) return <div key={`empty-${idx}`} className="min-h-[120px] border-b border-r border-gray-100 bg-gray-50/50" />;
                        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                        const dayStays = getStaysForDate(date);
                        const isSelected = selectedDate && isSameDay(date, selectedDate);
                        return (
                          <div 
                            key={day} 
                            className={`min-h-[120px] border-b border-r border-gray-100 p-2 hover:bg-gray-50 transition cursor-pointer ${isToday(date) ? 'bg-amber-50/50' : ''} ${isSelected ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30' : ''}`} 
                            onClick={() => setSelectedDate(date)}
                          >
                            <div className={`text-sm font-bold mb-2 ${isToday(date) ? 'text-[#AA7B30] bg-[#D4AF37]/10 w-7 h-7 rounded-full flex items-center justify-center' : 'text-gray-600'}`}>{day}</div>
                            <div className="space-y-1">
                              {dayStays.slice(0, 3).map(s => {
                                const sc = getStatusColor(s.status);
                                return (
                                  <div 
                                    key={s.stayId} 
                                    onClick={e => { e.stopPropagation(); setSelectedStay(s); setIsModalOpen(true); }} 
                                    className={`text-xs font-bold px-2 py-1 rounded ${sc.bg} ${sc.text} border ${sc.border} cursor-pointer hover:opacity-80 truncate`}
                                  >
                                    {s.roomNumber} - {s.guestName}
                                  </div>
                                );
                              })}
                              {dayStays.length > 3 && <div className="text-xs text-gray-400 text-center">+{dayStays.length - 3} المزيد</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Week View */}
                {viewMode === 'week' && (
                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-7 border-b border-gray-200">
                      {weekDays.map((d, i) => (
                        <div key={i} className={`p-4 text-center ${isToday(d) ? 'bg-amber-50' : ''}`}>
                          <div className="text-xs font-bold text-gray-500">{DAY_NAMES[d.getDay()]}</div>
                          <div className={`text-lg font-black mt-1 ${isToday(d) ? 'text-[#AA7B30]' : 'text-gray-800'}`}>{d.getDate()}</div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 min-h-[500px]">
                      {weekDays.map((d, i) => {
                        const dayStays = getStaysForDate(d);
                        const isSelected = selectedDate && isSameDay(d, selectedDate);
                        return (
                          <div 
                            key={i} 
                            className={`border-r border-gray-100 p-3 space-y-2 ${isToday(d) ? 'bg-amber-50/30' : ''} ${isSelected ? 'bg-[#D4AF37]/10' : ''}`}
                            onClick={() => setSelectedDate(d)}
                          >
                            {dayStays.map(s => {
                              const sc = getStatusColor(s.status);
                              return (
                                <div 
                                  key={s.stayId} 
                                  onClick={() => { setSelectedStay(s); setIsModalOpen(true); }} 
                                  className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition ${sc.bg} ${sc.border}`}
                                >
                                  <div className={`text-xs font-bold ${sc.text}`}>{s.roomNumber}</div>
                                  <div className="text-xs text-gray-600 truncate">{s.guestName}</div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Day View */}
                {viewMode === 'day' && (
                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className={`p-5 border-b border-gray-200 ${isToday(currentDate) ? 'bg-amber-50' : ''}`}>
                      <div className="text-xl font-black text-gray-900">{DAY_NAMES[currentDate.getDay()]} {currentDate.getDate()} {MONTH_NAMES[currentDate.getMonth()]}</div>
                    </div>
                    <div className="p-5 space-y-4">
                      {getStaysForDate(currentDate).length === 0 ? (
                        <div className="text-center py-16 text-gray-400 text-sm font-bold">لا توجد حجوزات في هذا اليوم</div>
                      ) : (
                        getStaysForDate(currentDate).map(s => {
                          const sc = getStatusColor(s.status);
                          return (
                            <div 
                              key={s.stayId} 
                              onClick={() => { setSelectedStay(s); setIsModalOpen(true); }} 
                              className={`flex items-center justify-between p-5 rounded-xl border cursor-pointer hover:shadow-md transition ${sc.bg} ${sc.border}`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${sc.bg} border ${sc.border}`}><User size={20} className={sc.text} /></div>
                                <div>
                                  <div className="text-base font-bold text-gray-900">{s.guestName}</div>
                                  <div className="text-sm text-gray-500">غرفة {s.roomNumber} • {s.checkInTime ? new Date(s.checkInTime).toLocaleDateString('ar-SA') : ''} → {s.expectedCheckOutDate ? new Date(s.expectedCheckOutDate).toLocaleDateString('ar-SA') : ''}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>
                                  <span className={`w-2 h-2 rounded-full ${sc.dot}`}></span>
                                  {getStatusLabel(s.status)}
                                </span>
                                <div className="flex gap-1">
                                  <button onClick={e => { e.stopPropagation(); handleCheckIn(s.stayId); }} disabled={s.status === 'ACTIVE' || s.status === 'CLOSED' || s.status === 'CANCELLED'} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition">دخول</button>
                                  <button onClick={e => { e.stopPropagation(); handleCheckOut(s.stayId); }} disabled={s.status !== 'ACTIVE'} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition">مغادرة</button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Reservation Details Panel (Right Side) */}
              {selectedDate && (
                <div className="w-96 bg-white border border-gray-200 rounded-2xl p-5 h-fit sticky top-4">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-black text-gray-900">حجوزات اليوم</h3>
                    <button onClick={() => setSelectedDate(null)} className="p-2 hover:bg-gray-100 rounded-lg transition"><X size={18} className="text-gray-500" /></button>
                  </div>
                  
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <div className="text-2xl font-black text-[#AA7B30]">{selectedDate.getDate()}</div>
                    <div className="text-sm text-gray-600">{DAY_NAMES[selectedDate.getDay()]} {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}</div>
                  </div>

                  {getStaysForDate(selectedDate).length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm font-bold">لا توجد حجوزات في هذا اليوم</div>
                  ) : (
                    <div className="space-y-3">
                      {getStaysForDate(selectedDate).map(s => {
                        const sc = getStatusColor(s.status);
                        return (
                          <div 
                            key={s.stayId}
                            onClick={() => { setSelectedStay(s); setIsModalOpen(true); }}
                            className={`p-4 rounded-xl border cursor-pointer hover:shadow-md transition ${sc.bg} ${sc.border}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="text-sm font-bold text-gray-900">{s.guestName}</div>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span>
                                {getStatusLabel(s.status)}
                              </span>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div className="flex items-center gap-2"><Building size={12} />غرفة {s.roomNumber}</div>
                              <div className="flex items-center gap-2"><Clock size={12} />{s.checkInTime ? new Date(s.checkInTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                              <div className="flex items-center gap-2"><User size={12} />{s.numAdults || 0} بالغين</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Reservation Details Modal */}
      <AnimatePresence>
        {selectedStay && isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-black text-gray-900">تفاصيل الحجز</h2>
                  <p className="text-sm text-gray-400 mt-0.5">رقم الحجز: #{selectedStay.stayId}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition"><X size={18} className="text-gray-500" /></button>
              </div>

              <div className="p-6 space-y-5">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-500">الحالة الحالية</span>
                  {(() => { const sc = getStatusColor(selectedStay.status); return (
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${sc.dot}`}></span>
                      {getStatusLabel(selectedStay.status)}
                    </span>
                  ); })()}
                </div>

                {/* Guest Info */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-bold text-gray-700">بيانات الضيف</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <InfoItem icon={<User size={16} />} label="اسم الضيف" value={selectedStay.guestName} />
                  </div>
                </div>

                {/* Room Info */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-bold text-gray-700">بيانات الغرفة</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <InfoItem icon={<Building size={16} />} label="رقم الغرفة" value={selectedStay.roomNumber} />
                    <InfoItem icon={<Building size={16} />} label="رقم الغرفة (ID)" value={selectedStay.roomId ? `#${selectedStay.roomId}` : 'غير متاح'} />
                    <InfoItem icon={<Building size={16} />} label="الطابق" value={selectedStay.floor ? `الطابق ${selectedStay.floor}` : 'غير متاح'} />
                    <InfoItem icon={<Building size={16} />} label="الوصف" value={selectedStay.description || 'غير متاح'} />
                  </div>
                </div>

                {/* Stay Info */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-bold text-gray-700">بيانات الإقامة</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <InfoItem icon={<Calendar size={16} />} label="تاريخ الدخول" value={selectedStay.checkInTime ? new Date(selectedStay.checkInTime).toLocaleDateString('ar-SA', { calendar: 'gregory' }) : (selectedStay.expectedCheckInDate ? new Date(selectedStay.expectedCheckInDate).toLocaleDateString('ar-SA', { calendar: 'gregory' }) : 'غير متاح')} />
                    <InfoItem icon={<Calendar size={16} />} label="تاريخ المغادرة المتوقع" value={selectedStay.expectedCheckOutDate ? new Date(selectedStay.expectedCheckOutDate).toLocaleDateString('ar-SA', { calendar: 'gregory' }) : 'غير متاح'} />
                    <InfoItem icon={<Clock size={16} />} label="وقت تسجيل المغادرة" value={selectedStay.checkOutTime ? new Date(selectedStay.checkOutTime).toLocaleTimeString('ar-SA') : 'لم يتم بعد'} />
                    <InfoItem icon={<Calendar size={16} />} label="عدد الليالي" value={(() => {
                      const checkIn = selectedStay.checkInTime ? new Date(selectedStay.checkInTime) : (selectedStay.expectedCheckInDate ? new Date(selectedStay.expectedCheckInDate) : null);
                      const checkOut = selectedStay.expectedCheckOutDate ? new Date(selectedStay.expectedCheckOutDate) : null;
                      if (checkIn && checkOut) {
                        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000);
                        return `${nights} ليلة`;
                      }
                      return 'غير متاح';
                    })()} />
                  </div>
                </div>

                {/* Guests Info */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-bold text-gray-700">عدد الضيوف</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <InfoItem icon={<User size={16} />} label="البالغين" value={selectedStay.numAdults !== undefined && selectedStay.numAdults !== null ? `${selectedStay.numAdults} أشخاص` : 'غير متاح'} />
                    <InfoItem icon={<User size={16} />} label="الأطفال" value={selectedStay.numKids !== undefined && selectedStay.numKids !== null ? `${selectedStay.numKids} أطفال` : '0 أطفال'} />
                  </div>
                </div>

                {/* Charges */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-bold text-gray-700">المبالغ المالية</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <InfoItem icon={<DollarSign size={16} />} label="رسوم الغرفة" value={selectedStay.roomCharge ? `${selectedStay.roomCharge.toLocaleString('ar-SA')} ريال` : 'غير متاح'} />
                    <InfoItem icon={<DollarSign size={16} />} label="الإجمالي" value={(() => {
                      const roomCharge = selectedStay.roomCharge || 0;
                      const checkIn = selectedStay.checkInTime ? new Date(selectedStay.checkInTime) : (selectedStay.expectedCheckInDate ? new Date(selectedStay.expectedCheckInDate) : null);
                      const checkOut = selectedStay.expectedCheckOutDate ? new Date(selectedStay.expectedCheckOutDate) : null;
                      if (checkIn && checkOut && roomCharge > 0) {
                        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000);
                        const total = roomCharge * nights;
                        return `${total.toLocaleString('ar-SA')} ريال`;
                      }
                      return selectedStay.totalCharge ? `${selectedStay.totalCharge.toLocaleString('ar-SA')} ريال` : 'غير متاح';
                    })()} highlight />
                  </div>
                </div>

                {/* Rating */}
                {selectedStay.stars && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-700">تقييم الضيف</span>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(s => (
                          <span key={s} className={`text-lg ${s <= selectedStay.stars ? 'text-[#D4AF37]' : 'text-gray-300'}`}>★</span>
                        ))}
                        <span className="text-sm font-bold text-gray-600 mr-2">{selectedStay.stars}/5</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedStay.notes && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2"><span className="text-sm font-bold text-amber-700">ملاحظات الضيف</span></div>
                    <p className="text-sm text-amber-800 leading-relaxed">{selectedStay.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  {selectedStay.status === 'RESERVED' && (
                    <button onClick={() => { handleCheckIn(selectedStay.stayId); setIsModalOpen(false); }} className="flex-1 py-3 bg-blue-50 border border-blue-200 text-blue-700 font-bold text-sm rounded-xl hover:bg-blue-100 transition">تسجيل الدخول</button>
                  )}
                  {selectedStay.status === 'ACTIVE' && (
                    <button onClick={() => { handleCheckOut(selectedStay.stayId); setIsModalOpen(false); }} className="flex-1 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm rounded-xl hover:bg-emerald-100 transition">تسجيل المغادرة</button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Reservation Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsCreateModalOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white border border-gray-200 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#AA7B30]">حجز جناح جديد</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition">
                  <X size={18} />
                </button>
              </div>

              {createError && (
                <div className="border text-sm p-3 rounded-lg mb-4 bg-red-50 border-red-200 text-red-700">
                  {createError}
                </div>
              )}

              <div className="space-y-4">
                <Field label="اسم الضيف" value={guestName} onChange={setGuestName} placeholder="الاسم الكامل" />
                <div>
                  <label className="text-xs block mb-2 text-gray-500 font-bold">رقم الغرفة *</label>
                  <select
                    value={selectedRoomNumber}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedRoomNumber(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] text-gray-900 bg-white"
                  >
                    <option value="">اختر غرفة متاحة</option>
                    {availableRooms.map((room: RoomResponse) => (
                      <option key={room.id} value={room.roomNumber || room.id.toString()}>
                        {room.roomNumber || room.id} - {room.categoryName || 'غير مصنف'} - {room.description || 'غرفة'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs block mb-2 text-gray-500 font-bold">تسجيل الدخول</label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCheckIn(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs block mb-2 text-gray-500 font-bold">تسجيل المغادرة</label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCheckOut(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] text-gray-900 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs block mb-2 text-gray-500 font-bold">عدد البالغين</label>
                    <input
                      type="number"
                      value={adults}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdults(parseInt(e.target.value))}
                      min="1"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs block mb-2 text-gray-500 font-bold">عدد الأطفال</label>
                    <input
                      type="number"
                      value={children}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChildren(parseInt(e.target.value))}
                      min="0"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] text-gray-900 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-bold transition bg-gray-100 text-gray-600 hover:text-gray-900"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={isCreating}
                    className="px-6 py-2 bg-gradient-to-r from-[#AA7B30] to-[#D4AF37] text-black font-extrabold text-sm rounded-xl shadow hover:shadow-lg transition duration-200 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        حفظ الحجز
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Approve Request Modal */}
      <AnimatePresence>
        {isApproveModalOpen && selectedRequest && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsApproveModalOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white border border-gray-200 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#AA7B30]">موافقة على طلب الحجز</h3>
                <button onClick={() => setIsApproveModalOpen(false)} className="p-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700"><User size={14} />{selectedRequest.guestName}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-700"><Mail size={14} />{selectedRequest.guestEmail}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-700"><Phone size={14} />{selectedRequest.guestPhone}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-700"><Calendar size={14} />{new Date(selectedRequest.checkInDate).toLocaleDateString('ar-SA')} → {new Date(selectedRequest.checkOutDate).toLocaleDateString('ar-SA')}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-700"><Building size={14} />{selectedRequest.categoryName}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-700"><DollarSign size={14} />{selectedRequest.quotedTotalCharge?.toLocaleString('ar-SA')} ريال</div>
                </div>

                <div>
                  <label className="text-xs block mb-2 text-gray-500 font-bold">اختر غرفة متاحة *</label>
                  <select
                    value={selectedRoomForApproval || ''}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedRoomForApproval(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] text-gray-900 bg-white"
                  >
                    <option value="">اختر غرفة متاحة</option>
                    {availableRoomsForApproval.map((room: RoomResponse) => (
                      <option key={room.id} value={room.id}>
                        {room.roomNumber} - {room.categoryName} - {room.description || 'غرفة'}
                      </option>
                    ))}
                  </select>
                  {availableRoomsForApproval.length === 0 && (
                    <p className="text-xs text-red-500 mt-2">لا توجد غرف متاحة حالياً</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsApproveModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-bold transition bg-gray-100 text-gray-600 hover:text-gray-900"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleApproveRequest}
                  disabled={!selectedRoomForApproval}
                  className="px-6 py-2 bg-gradient-to-r from-[#AA7B30] to-[#D4AF37] text-black font-extrabold text-sm rounded-xl shadow hover:shadow-lg transition duration-200 flex items-center gap-2 disabled:opacity-50"
                >
                  <Check size={16} />
                  موافقة
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Request Modal */}
      <AnimatePresence>
        {isRejectModalOpen && selectedRequest && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsRejectModalOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white border border-gray-200 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-red-600">رفض طلب الحجز</h3>
                <button onClick={() => setIsRejectModalOpen(false)} className="p-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700"><User size={14} />{selectedRequest.guestName}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-700"><Mail size={14} />{selectedRequest.guestEmail}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-700"><Phone size={14} />{selectedRequest.guestPhone}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-700"><Calendar size={14} />{new Date(selectedRequest.checkInDate).toLocaleDateString('ar-SA')} → {new Date(selectedRequest.checkOutDate).toLocaleDateString('ar-SA')}</div>
                </div>

                <div>
                  <label className="text-xs block mb-2 text-gray-500 font-bold">سبب الرفض *</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectReason(e.target.value)}
                    rows={4}
                    placeholder="أدخل سبب رفض الطلب..."
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] text-gray-900 bg-white resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-bold transition bg-gray-100 text-gray-600 hover:text-gray-900"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleRejectRequest}
                  disabled={!rejectReason.trim()}
                  className="px-6 py-2 bg-red-600 text-white font-extrabold text-sm rounded-xl shadow hover:shadow-lg transition duration-200 flex items-center gap-2 disabled:opacity-50"
                >
                  <XCircle size={16} />
                  رفض
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoItem({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-1"><span className="text-gray-400">{icon}</span><span className="text-xs font-bold text-gray-400">{label}</span></div>
      <p className={`text-sm font-bold ${highlight ? 'text-[#AA7B30]' : 'text-gray-900'}`}>{value || 'غير متاح'}</p>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder }: { label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div><label className="text-sm font-bold text-gray-700 block mb-2">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none transition" /></div>
  );
}

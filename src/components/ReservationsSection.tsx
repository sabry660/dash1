import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar, User, Plus, Search, XCircle, ChevronLeft,
  X, Loader2, Building, Clock, DollarSign, Save,
  Check, AlertCircle, Mail, Phone, Globe, CreditCard
} from 'lucide-react';
import { apiService, StayDetailsResponse, CreateStayRequest, ReservationRequestResponse, ApproveReservationRequest, RejectReservationRequest, RoomResponse, RoomCategoryResponse } from '../services/api';
import PricingCalendar from './calendar/PricingCalendar';
import { dataCache, cacheKeys } from '../services/dataCache';

type CalendarView = 'traditional' | 'horizontal' | 'pricing';

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
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [roomCategories, setRoomCategories] = useState<RoomCategoryResponse[]>([]);
  const [reservationRequests, setReservationRequests] = useState<ReservationRequestResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [displayMode, setDisplayMode] = useState<'calendar' | 'table'>(() => {
    const saved = localStorage.getItem('reservations_displayMode');
    return (saved === 'table' || saved === 'calendar') ? saved : 'calendar';
  });
  const [calendarView, setCalendarView] = useState<CalendarView>(() => {
    const saved = localStorage.getItem('reservations_calendarView');
    return (saved === 'traditional' || saved === 'pricing') ? saved : 'traditional';
  });

  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    const saved = localStorage.getItem('reservations_selectedCategory');
    return saved || 'all';
  });
  const [expandedCalendarCategories, setExpandedCalendarCategories] = useState<Set<string>>(new Set());

  // Save state to localStorage on change
  useEffect(() => {
    localStorage.setItem('reservations_displayMode', displayMode);
  }, [displayMode]);

  useEffect(() => {
    localStorage.setItem('reservations_calendarView', calendarView);
  }, [calendarView]);

  useEffect(() => {
    localStorage.setItem('reservations_selectedCategory', selectedCategory);
  }, [selectedCategory]);
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
  const [scrollPosition, setScrollPosition] = useState(0);
  const calendarScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load cached data immediately first
    const loadCachedData = () => {
      const staysCache = dataCache.get<StayDetailsResponse[]>(cacheKeys.reservations.stays());
      const roomsCache = dataCache.get<RoomResponse[]>(cacheKeys.reservations.rooms());
      const categoriesCache = dataCache.get<RoomCategoryResponse[]>(cacheKeys.reservations.roomCategories());
      const requestsCache = dataCache.get<ReservationRequestResponse[]>(cacheKeys.reservations.reservationRequests());

      if (staysCache) setStays(staysCache);
      if (roomsCache) setRooms(roomsCache);
      if (categoriesCache) setRoomCategories(categoriesCache);
      if (requestsCache) setReservationRequests(requestsCache);
    };

    loadCachedData();

    // Then load fresh data in background
    const loadData = async () => {
      setIsLoading(false); // Don't show loading if we have cached data
      await Promise.allSettled([
        loadStays(),
        loadRooms(),
        loadRoomCategories(),
        loadReservationRequests()
      ]);
    };
    loadData();
  }, []);

  // 15-second polling - always updates cache regardless of data state
  useEffect(() => {
    const pollingInterval = setInterval(() => {
      // Always refresh data via polling to update cache
      loadStays();
      loadRooms();
      loadRoomCategories();
      loadReservationRequests();
    }, 15000); // Poll every 15 seconds
    return () => clearInterval(pollingInterval);
  }, []);

  // Year-long calendar spanning from today to end of year
  const yearCalendarDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endOfYear = new Date(today.getFullYear(), 11, 31);
    endOfYear.setHours(0, 0, 0, 0);
    
    const days: Date[] = [];
    const current = new Date(today);
    
    while (current <= endOfYear) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, []);

  const todayIndex = useMemo(() => {
    return yearCalendarDays.findIndex((day) => day.toDateString() === new Date().toDateString());
  }, [yearCalendarDays]);

  // Auto-scroll to today's position in calendar
  useEffect(() => {
    if (calendarScrollRef.current && todayIndex >= 0 && yearCalendarDays.length > 0) {
      // Calculate the scroll position to center today's column
      const totalDays = yearCalendarDays.length;
      const dayWidth = (calendarScrollRef.current.scrollWidth - 220) / totalDays; // 220px is the sticky column width
      const scrollTarget = Math.max(0, todayIndex * dayWidth - (calendarScrollRef.current.clientWidth - 220 - dayWidth) / 2);
      
      // Smooth scroll to today
      setTimeout(() => {
        calendarScrollRef.current?.scrollTo({ left: scrollTarget, behavior: 'smooth' });
      }, 100);
    }
  }, [yearCalendarDays, todayIndex]);

  const loadStays = async () => {
    const cacheKey = cacheKeys.reservations.stays();
    
    // Check if request is already pending
    if (dataCache.isPending(cacheKey)) {
      return;
    }

    // Check cache first - use cached data regardless of length
    const cachedData = dataCache.get<StayDetailsResponse[]>(cacheKey);
    if (cachedData) {
      setStays(cachedData);
    }

    // Make API request
    const requestPromise = (async () => {
      try {
        const response = await apiService.getStays(0, 200);
        const staysData = response.content || [];
        
        // Cache all responses (including empty)
        dataCache.set(cacheKey, staysData);
        
        setStays(staysData);
      } catch (e: any) {
        console.error('Failed to load stays:', e);
        // Keep existing cached data if available
        const existingCache = dataCache.get<StayDetailsResponse[]>(cacheKey);
        if (existingCache) {
          setStays(existingCache);
        } else {
          setStays([]);
        }
      }
    })();

    dataCache.setPending(cacheKey, requestPromise);
    await requestPromise;
  };

  const loadRooms = async () => {
    const cacheKey = cacheKeys.reservations.rooms();
    
    // Check if request is already pending
    if (dataCache.isPending(cacheKey)) {
      return;
    }

    // Check cache first - use cached data regardless of length
    const cachedData = dataCache.get<RoomResponse[]>(cacheKey);
    if (cachedData) {
      setRooms(cachedData);
    }

    // Make API request
    const requestPromise = (async () => {
      try {
        const response = await apiService.getRooms(undefined, undefined, 0, 200);
        const roomsList = Array.isArray(response) ? response : (response?.content ?? []);
        
        // Cache all responses (including empty)
        dataCache.set(cacheKey, roomsList);
        
        setRooms(roomsList);
      } catch (e) {
        console.error('Failed to load rooms:', e);
        // Keep existing cached data if available
        const existingCache = dataCache.get<RoomResponse[]>(cacheKey);
        if (existingCache) {
          setRooms(existingCache);
        } else {
          setRooms([]);
        }
      }
    })();

    dataCache.setPending(cacheKey, requestPromise);
    await requestPromise;
  };

  const loadRoomCategories = async () => {
    const cacheKey = cacheKeys.reservations.roomCategories();
    
    // Check if request is already pending
    if (dataCache.isPending(cacheKey)) {
      return;
    }

    // Check cache first - use cached data regardless of length
    const cachedData = dataCache.get<RoomCategoryResponse[]>(cacheKey);
    if (cachedData) {
      setRoomCategories(cachedData);
    }

    // Make API request
    const requestPromise = (async () => {
      try {
        const response = await apiService.getRoomCategories();
        const categories = Array.isArray(response) ? response : (response?.content ?? []);
        
        // Cache all responses (including empty)
        dataCache.set(cacheKey, categories);
        
        setRoomCategories(categories);
      } catch (e) {
        console.error('Failed to load room categories:', e);
        // Keep existing cached data if available
        const existingCache = dataCache.get<RoomCategoryResponse[]>(cacheKey);
        if (existingCache) {
          setRoomCategories(existingCache);
        } else {
          setRoomCategories([]);
        }
      }
    })();

    dataCache.setPending(cacheKey, requestPromise);
    await requestPromise;
  };

  const loadReservationRequests = async () => {
    const cacheKey = cacheKeys.reservations.reservationRequests();
    
    // Check if request is already pending
    if (dataCache.isPending(cacheKey)) {
      return;
    }

    // Check cache first
    const cachedData = dataCache.get<ReservationRequestResponse[]>(cacheKey);
    if (cachedData) {
      setReservationRequests(cachedData);
    }

    // Make API request
    const requestPromise = (async () => {
      try {
        const response = await apiService.getPendingReservationRequests(0, 100);
        // Handle both paged response and direct array response
        const requests = response?.content || (Array.isArray(response) ? response : []) as ReservationRequestResponse[];
        
        // Cache even empty arrays (this is the correct state)
        dataCache.set(cacheKey, requests);
        
        setReservationRequests(requests);
      } catch (e: any) {
        console.error('Failed to load reservation requests:', e);
        // Keep existing cached data if available
        const existingCache = dataCache.get<ReservationRequestResponse[]>(cacheKey);
        if (existingCache !== null) {
          setReservationRequests(existingCache);
        } else {
          setReservationRequests([]);
        }
      }
    })();

    dataCache.setPending(cacheKey, requestPromise);
    await requestPromise;
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

      const createdStay = await apiService.createStay(stayData);
      console.log('Created stay with status:', createdStay.status);

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

      // Update room status to OCCUPIED after checkin
      const stay = stays.find((s: StayDetailsResponse) => s.stayId === stayId);
      if (stay && (stay.roomNumber || stay.roomId)) {
        try {
          const rooms = await apiService.getRooms(undefined, undefined, 0, 100);
          const roomToUpdate = (rooms.content || []).find((r: RoomResponse) => (r.roomNumber || r.id.toString()) === (stay.roomNumber || stay.roomId?.toString()));
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
      }
    } catch { }
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
    } catch { }
    // Always reload to sync with backend state, even on 409
    loadStays();
    if (onCheckout) onCheckout();
  };

  // Filter stays - show ACTIVE and RESERVED stays in calendar view
  const filteredStays = useMemo(() => stays.filter(s => {
    // Show ACTIVE and RESERVED stays in calendar (exclude CLOSED)
    const isRelevantStay = s.status === 'ACTIVE' || s.status === 'RESERVED';
    return isRelevantStay;
  }), [stays]);

  // Filter reservation requests
  const filteredRequests = useMemo(() => reservationRequests.filter(r => r.status === 'PENDING'), [reservationRequests]);

  const handleApproveRequest = async () => {
    if (!selectedRequest || !selectedRoomForApproval) return;
    try {
      await apiService.approveReservationRequest(selectedRequest.id, { roomId: selectedRoomForApproval });
      setIsApproveModalOpen(false);
      setSelectedRequest(null);
      setSelectedRoomForApproval(null);
      // Reload data
      loadReservationRequests();
      loadStays();
      // Switch to traditional calendar view
      setDisplayMode('calendar');
      setCalendarView('traditional');
    } catch (e: any) {
      console.error('Failed to approve request:', e);
      alert('فشل الموافقة على الطلب');
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest || !rejectReason.trim()) return;
    
    // Check if request is actually in PENDING status before trying to reject
    if (selectedRequest.status !== 'PENDING') {
      alert('يمكن رفض الطلبات المعلقة فقط');
      return;
    }
    
    // Save request data for potential rollback
    const requestToReject = { ...selectedRequest };
    const requestId = selectedRequest.id;
    
    // Remove the request from UI immediately for better UX
    setReservationRequests(prev => prev.filter(r => r.id !== requestId));
    setIsRejectModalOpen(false);
    setSelectedRequest(null);
    setRejectReason('');
    
    try {
      await apiService.rejectReservationRequest(requestId, { reason: rejectReason });
      // Reload to ensure data consistency
      loadReservationRequests();
    } catch (e: any) {
      console.error('Failed to reject request:', e);
      // Add the request back to the list if the API call failed
      setReservationRequests(prev => [...prev, requestToReject]);
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



  const getStatusColor = (status: string) => STATUS_COLORS[status] || { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' };
  const getStatusLabel = (status: string) => STATUS_LABELS[status] || '—';

  const roomStatusTranslations: Record<string, string> = {
    AVAILABLE: 'متاحة',
    OCCUPIED: 'مشغولة',
    CLEANING: 'تنظيف',
    MAINTENANCE: 'صيانة'
  };

  // Wheel scroll handler for smooth horizontal scrolling
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (calendarScrollRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      const container = calendarScrollRef.current;
      // Smooth scroll horizontally based on vertical wheel movement
      container.scrollLeft += e.deltaY > 0 ? 100 : -100;
    }
  };

  // Synchronize scroll position across header and room rows
  const handleCalendarScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    setScrollPosition(container.scrollLeft);
  };

  const roomGroups = useMemo(() => {
    const categoryOrder = roomCategories.map(category => category.name);
    const grouped = new Map<string, RoomResponse[]>();

    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filteredRooms = rooms.filter((room) => {
      const categoryName = room.categoryName || 'غير مصنف';
      const matchesCategory = selectedCategory === 'all' || categoryName === selectedCategory;
      
      // If no search query, apply category filter
      if (!normalizedQuery) {
        return matchesCategory;
      }
      
      // When searching, ignore category filter to show all matching rooms
      // Search in room fields
      const roomSearchableFields = [
        room.roomNumber,
        categoryName,
        room.description,
        room.floor?.toString(),
        room.status,
        room.viewType,
        room.bedType
      ];
      
      const matchesRoomSearch = roomSearchableFields.some(field => 
        field && field.toLowerCase().includes(normalizedQuery)
      );
      
      // Also search in stays associated with this room
      const staysForRoom = stays.filter(s => s.roomId === room.id);
      const matchesStaySearch = staysForRoom.some(stay => {
        const staySearchableFields = [
          stay.guestName,
          stay.guestPhone,
          stay.email,
          stay.nationality,
          stay.identification,
          stay.status,
          stay.notes,
          stay.expectedCheckInDate,
          stay.expectedCheckOutDate
        ];
        return staySearchableFields.some(field => 
          field && field.toLowerCase().includes(normalizedQuery)
        );
      });
      
      return matchesRoomSearch || matchesStaySearch;
    });

    filteredRooms.sort((a, b) => Number(a.roomNumber) - Number(b.roomNumber) || a.roomNumber.localeCompare(b.roomNumber));

    filteredRooms.forEach((room) => {
      const categoryName = room.categoryName || 'غير مصنف';
      if (!grouped.has(categoryName)) grouped.set(categoryName, []);
      grouped.get(categoryName)!.push(room);
    });

    return [...grouped.entries()].sort(([left], [right]) => {
      const leftIndex = categoryOrder.indexOf(left);
      const rightIndex = categoryOrder.indexOf(right);
      if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right, 'ar');
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    });
  }, [rooms, roomCategories, searchQuery, selectedCategory, stays]);

  // Auto-expand all calendar categories when roomGroups changes
  useEffect(() => {
    if (roomGroups.length > 0) {
      setExpandedCalendarCategories(new Set(roomGroups.map(([name]) => name)));
    }
  }, [roomGroups]);

  const getCalendarBlock = (stay: StayDetailsResponse) => {
    const checkInDate = new Date(stay.checkInTime || stay.expectedCheckInDate);
    const checkOutDate = new Date(stay.expectedCheckOutDate);
    const calendarStart = new Date(yearCalendarDays[0]);
    calendarStart.setHours(0, 0, 0, 0);
    const startOffset = Math.max(0, Math.round((new Date(checkInDate).setHours(0, 0, 0, 0) - calendarStart.getTime()) / 86400000));
    const endOffset = Math.max(startOffset + 1, Math.round((new Date(checkOutDate).setHours(0, 0, 0, 0) - calendarStart.getTime()) / 86400000));
    const width = Math.max(1, endOffset - startOffset);

    return {
      start: startOffset,
      width,
      stay,
      label: stay.guestName,
      status: stay.status,
      visible: startOffset < yearCalendarDays.length && endOffset > 0
    };
  };

  const getRoomStayBlocks = (room: RoomResponse) => {
    return stays
      .filter((stay) => (String(stay.roomId) === String(room.id) || stay.roomNumber === room.roomNumber) && (stay.status === 'ACTIVE' || stay.status === 'RESERVED'))
      .map((stay) => getCalendarBlock(stay))
      .filter((block) => block.visible);
  };

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
          <button onClick={() => { loadAvailableRooms(); setIsCreateModalOpen(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition">
            <Plus size={18} /><span>حجز جديد</span>
          </button>
        </div>
      </div>

      {/* Pending Requests Section */}
      {showPendingRequests && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">طلبات الحجوز المعلقة (من الموقع الإلكتروني)</h3>
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
                      {request.status === 'PENDING' && (
                        <button onClick={() => openRejectModal(request)} className="px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition flex items-center gap-2">
                          <XCircle size={16} />رفض
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Right side controls */}
      <div className="flex flex-wrap items-center justify-between w-full gap-3">
          {/* Display Mode Toggle - Hide in pricing view */}
          {calendarView !== 'pricing' && (
            <div className="flex border border-gray-200 rounded-xl bg-white overflow-hidden">
              <button onClick={() => setDisplayMode('calendar')} className={`px-4 py-2 text-sm font-bold transition ${displayMode === 'calendar' ? 'bg-[#D4AF37] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                تقويم
              </button>
              <button onClick={() => setDisplayMode('table')} className={`px-4 py-2 text-sm font-bold transition ${displayMode === 'table' ? 'bg-[#D4AF37] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                جدول
              </button>
            </div>
          )}

          {/* Calendar Type Toggle - Always show on left side */}
          {displayMode === 'calendar' && (
            <div className="flex border border-gray-200 rounded-xl bg-white overflow-hidden w-full justify-between">
              <button onClick={() => setCalendarView('traditional')} className={`flex-1 px-4 py-2 text-sm font-bold transition ${calendarView === 'traditional' ? 'bg-[#D4AF37] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                تقليدي
              </button>
            
              <button onClick={() => setCalendarView('pricing')} className={`flex-1 px-4 py-2 text-sm font-bold transition ${calendarView === 'pricing' ? 'bg-[#D4AF37] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                الأسعار
              </button>
            </div>
          )}

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
              <div className="p-5 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">طلبات الحجوز من الموقع الإلكتروني</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">رقم الطلب</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">اسم الضيف</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">البريد الإلكتروني</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">الهاتف</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">الجنسية</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">رقم الهوية</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">فئة الغرفة</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">بالغين</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">أطفال</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">السعر المقدر</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">تاريخ الدخول</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">تاريخ المغادرة</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">ملاحظات</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">الحالة</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredRequests.map(request => {
                      const sc = STATUS_COLORS[request.status] || STATUS_COLORS['PENDING'];
                      return (
                        <tr key={request.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 text-sm font-bold text-gray-900">#{request.id}</td>
                          <td className="px-4 py-3 text-sm text-gray-800">{request.guestName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{request.guestEmail}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{request.guestPhone}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{request.nationality || 'غير محدد'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{request.identification || 'غير محدد'}</td>
                          <td className="px-4 py-3 text-sm text-gray-800">{request.categoryName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{request.numAdults || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{request.numKids || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-800">{request.quotedTotalCharge?.toLocaleString('ar-SA')} ريال</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{new Date(request.checkInDate).toLocaleDateString('ar-SA')}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{new Date(request.checkOutDate).toLocaleDateString('ar-SA')}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{request.notes || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>
                              <span className={`w-2 h-2 rounded-full ${sc.dot}`}></span>
                              {STATUS_LABELS[request.status] || request.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              {request.status === 'PENDING' && (
                                <>
                                  <button onClick={() => { openApproveModal(request); }} className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition">قبول</button>
                                  <button onClick={() => { openRejectModal(request); }} className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-bold hover:bg-red-100 transition">رفض</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredRequests.length === 0 && (
                <div className="text-center py-12 text-gray-400 text-sm font-bold">لا توجد طلبات حجز من الموقع الإلكتروني</div>
              )}
            </div>
          )}

          {displayMode === 'calendar' && calendarView === 'traditional' && (
            <div className="overflow-hidden rounded-[26px] border border-[#e8e1d0] bg-white shadow-[0_12px_40px_rgba(17,24,39,0.03)]">
              {/* Calendar Header Controls */}
              <div className="flex items-center justify-end gap-3 border-b border-[#f0ebdf] bg-[#fcfaf7] px-4 py-3 md:px-5">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="بحث..."
                      className="w-36 rounded-xl border border-[#ece7dc] bg-white py-2 pr-9 pl-3 text-sm text-gray-700 outline-none transition focus:border-[#d4af37] md:w-48"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="rounded-xl border border-[#ece7dc] bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-[#d4af37]"
                  >
                    <option value="all">كل الفئات</option>
                    {roomCategories.map((category) => (
                      <option key={category.id} value={category.name}>{category.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Scrollable Calendar Container */}
              <div 
                ref={calendarScrollRef}
                onWheel={handleWheel}
                onScroll={handleCalendarScroll}
                className="overflow-hidden smooth-scroll"
                style={{ scrollBehavior: 'smooth' }}
              >
                <div className="flex min-h-full">
                  {/* Fixed Room Column */}
                  <div className="flex-shrink-0 w-[220px] border-r border-[#f0ebdf] bg-[#faf8f2]">
                    {/* Header */}
                    <div className="sticky top-0 z-20 border-b border-[#f0ebdf] bg-[#faf8f2] px-3 py-3 text-xs font-bold text-[#6b7280]">
                      الغرف
                    </div>
                    
                    {/* Category Headers */}
                    {roomGroups.map(([categoryName, categoryRooms]) => (
                      <div key={categoryName}>
                        <button
                          onClick={() => {
                            setExpandedCalendarCategories(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(categoryName)) {
                                newSet.delete(categoryName);
                              } else {
                                newSet.add(categoryName);
                              }
                              return newSet;
                            });
                          }}
                          className="w-full border-b border-[#f0ebdf] bg-[#faf8f2] px-3 py-2 text-sm font-bold text-[#8a6c20] hover:bg-[#f5f1ea] transition flex items-center justify-between"
                        >
                          <span>{categoryName}</span>
                          <span className="text-gray-400">{expandedCalendarCategories.has(categoryName) ? '−' : '+'}</span>
                        </button>
                        
                        {/* Room Labels for this category */}
                        {expandedCalendarCategories.has(categoryName) && categoryRooms.map((room) => {
                          const roomStatus = roomStatusTranslations[room.status] || 'متاحة';
                          const roomBadge = room.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : room.status === 'OCCUPIED' ? 'bg-red-50 text-red-700 border-red-200' : room.status === 'CLEANING' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200';
                          
                          return (
                            <div key={room.id} className="border-b border-[#f0ebdf] bg-white px-3 py-3">
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <div className="text-sm font-black text-[#1f2937]">{room.roomNumber}</div>
                                  <div className="text-[11px] text-gray-500">{room.categoryName || 'غير مصنف'}</div>
                                </div>
                                <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-bold whitespace-nowrap ${roomBadge}`}>
                                  {roomStatus}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Scrollable Content */}
                  <div 
                    ref={calendarScrollRef}
                    className="overflow-x-auto smooth-scroll"
                    style={{ scrollBehavior: 'smooth' }}
                  >
                    <div className="min-w-min">
                      {/* Header Row with Dates */}
                      <div className="sticky top-0 z-20 bg-white">
                        <div className="grid bg-[#faf8f2]" style={{ gridTemplateColumns: `repeat(${yearCalendarDays.length}, minmax(60px, 1fr))` }}>
                          {yearCalendarDays.map((day, idx) => {
                            const isCurrent = day.toDateString() === new Date().toDateString();
                            return (
                              <div key={day.toISOString()} className={`border-r border-[#f0ebdf] px-2 py-3 text-center ${isCurrent ? 'bg-[#fff9eb]' : 'bg-[#faf8f2]'}`}>
                                <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#7a7a7a]">{DAY_NAMES[day.getDay()]}</div>
                                <div className={`mt-1 text-sm font-black ${isCurrent ? 'text-[#9a7323]' : 'text-[#1f2937]'}`}>{day.getDate()}</div>
                                <div className="text-[8px] text-gray-400">{MONTH_NAMES[day.getMonth()]}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Empty State */}
                      {roomGroups.length === 0 && (
                        <div className="border-t border-[#f0ebdf] bg-white px-6 py-12 text-center text-sm font-bold text-gray-400">
                          لا توجد غرف متاحة في قاعدة البيانات
                        </div>
                      )}

                      {/* Room Groups */}
                      {roomGroups.map(([categoryName, categoryRooms]) => (
                        <div key={categoryName}>
                          {/* Category Header */}
                          <div className="border-t border-[#f0ebdf] bg-[#faf8f2] h-[46px]" />

                          {/* Room Rows */}
                          {expandedCalendarCategories.has(categoryName) && categoryRooms.map((room) => {
                            const roomBlocks = getRoomStayBlocks(room);

                            return (
                              <div key={room.id} className="border-t border-[#f0ebdf]">
                                {/* Reservation Blocks Container */}
                                <div className="relative border-l border-[#f0ebdf] bg-white">
                                  <div className="grid" style={{ gridTemplateColumns: `repeat(${yearCalendarDays.length}, minmax(60px, 1fr))`, minHeight: 76 }}>
                                    {yearCalendarDays.map((day, idx) => (
                                      <div key={`${room.id}-${day.toISOString()}`} className="border-r border-[#f5f1ea] bg-white" />
                                    ))}
                                  </div>

                                  {/* Reservation Blocks */}
                                  {roomBlocks.map((block) => {
                                    const statusColor = getStatusColor(block.status);
                                    const left = `${(block.start / yearCalendarDays.length) * 100}%`;
                                    const width = `${Math.max((block.width / yearCalendarDays.length) * 100, 8)}%`;

                                    return (
                                      <button
                                        key={`${room.id}-${block.stay.stayId}`}
                                        type="button"
                                        onClick={() => { setSelectedStay(block.stay); setIsModalOpen(true); }}
                                        className={`absolute top-3 h-10 overflow-hidden rounded-lg border px-2 py-1 text-right shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${statusColor.bg} ${statusColor.border}`}
                                        style={{ left, width, zIndex: 2 }}
                                        title={`${block.stay.guestName} • ${block.stay.roomNumber}`}
                                      >
                                        <div className="truncate text-[9px] font-black text-gray-900">{block.stay.guestName}</div>
                                        <div className="truncate text-[8px] text-gray-700">{getStatusLabel(block.stay.status)}</div>
                                      </button>
                                    );
                                  })}

                                  {/* Today Indicator Line */}
                                  {todayIndex >= 0 && todayIndex < yearCalendarDays.length && (
                                    <div
                                      className="pointer-events-none absolute inset-y-0 w-[2px] bg-[#d4af37]"
                                      style={{ left: `${((todayIndex + 0.5) / yearCalendarDays.length) * 100}%`, zIndex: 3 }}
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Calendar View */}
          {displayMode === 'calendar' && calendarView === 'pricing' && (
            <PricingCalendar />
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
                  {(() => {
                    const sc = getStatusColor(selectedStay.status); return (
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${sc.dot}`}></span>
                        {getStatusLabel(selectedStay.status)}
                      </span>
                    );
                  })()}
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
                    <InfoItem icon={<DollarSign size={16} />} label="الإجمالي" value={selectedStay.totalCharge ? `${selectedStay.totalCharge.toLocaleString('ar-SA')} ريال` : 'غير متاح'} highlight />
                    <InfoItem icon={<DollarSign size={16} />} label="عدد الليالي" value={(() => {
                      const checkIn = selectedStay.checkInTime ? new Date(selectedStay.checkInTime) : (selectedStay.expectedCheckInDate ? new Date(selectedStay.expectedCheckInDate) : null);
                      const checkOut = selectedStay.expectedCheckOutDate ? new Date(selectedStay.expectedCheckOutDate) : null;
                      if (checkIn && checkOut) {
                        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000);
                        return `${nights} ليلة`;
                      }
                      return 'غير متاح';
                    })()} />
                  </div>
                  <div className="text-xs text-gray-500 mt-2 text-center">
                    * الإجمالي محسوب بناءً على الأسعار اليومية المتغيرة
                  </div>
                </div>

                {/* Rating */}
                {selectedStay.stars && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-700">تقييم الضيف</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(s => (
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
                    <button onClick={() => { setIsModalOpen(false); handleCheckIn(selectedStay.stayId); }} className="flex-1 py-3 bg-blue-50 border border-blue-200 text-blue-700 font-bold text-sm rounded-xl hover:bg-blue-100 transition">تأكيد الوصول</button>
                  )}
                  {selectedStay.status === 'ACTIVE' && (
                    <button onClick={() => { setIsModalOpen(false); handleCheckOut(selectedStay.stayId); }} className="flex-1 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm rounded-xl hover:bg-emerald-100 transition">تسجيل المغادرة</button>
                  )}
                  {selectedStay.status === 'CLOSED' && (
                    <div className="flex-1 py-3 bg-gray-100 border border-gray-200 text-gray-500 font-bold text-sm rounded-xl text-center">تم الإنهاء</div>
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
                    {availableRoomsForApproval
                      .filter((room: RoomResponse) => selectedRequest && room.categoryId === selectedRequest.categoryId)
                      .map((room: RoomResponse) => (
                        <option key={room.id} value={room.id}>
                          {room.roomNumber} - {room.categoryName} - {room.description || 'غرفة'}
                        </option>
                      ))}
                  </select>
                  {availableRoomsForApproval.filter((room: RoomResponse) => selectedRequest && room.categoryId === selectedRequest.categoryId).length === 0 && (
                    <p className="text-xs text-red-500 mt-2">لا توجد غرف متاحة في فئة {selectedRequest?.categoryName}</p>
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

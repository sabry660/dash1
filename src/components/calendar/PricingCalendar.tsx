import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar, Loader2, AlertCircle, DollarSign, RefreshCw, X, Save, Bed } from 'lucide-react';
import { apiService, RoomCategoryResponse, DailyRateResponse, RoomResponse, StayDetailsResponse } from '../../services/api';
import CalendarSkeleton from './CalendarSkeleton';

const DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTH_NAMES = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

interface SetRatesRequest {
  startDate: string;
  endDate: string;
  price: number;
}

interface CategoryRates {
  category: RoomCategoryResponse;
  rates: DailyRateResponse[];
  rooms: RoomResponse[];
}

interface DailyOccupancy {
  date: string;
  occupied: number;
  available: number;
}

export default function PricingCalendar() {
  // Server State
  const [categories, setCategories] = useState<RoomCategoryResponse[]>([]);
  const [categoryRates, setCategoryRates] = useState<CategoryRates[]>([]);
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [stays, setStays] = useState<StayDetailsResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateRange, setDateRange] = useState(14); // 14 days by default
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [editingRate, setEditingRate] = useState<{ categoryId: number; date: string; currentPrice: number } | null>(null);
  const [newPrice, setNewPrice] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Load data on mount and when date range changes
  useEffect(() => {
    loadPricingData();
  }, [dateRange, currentDate]);

  const loadPricingData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        loadCategories(),
        loadRooms(),
        loadStays()
      ]);
      await loadRatesForAllCategories();
    } catch (e) {
      setError('فشل تحميل بيانات الأسعار');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await apiService.getRoomCategories();
      setCategories(categoriesData.content || categoriesData || []);
    } catch (e) {
      console.error('Failed to load categories:', e);
    }
  };

  const loadRooms = async () => {
    try {
      const roomsData = await apiService.getRooms(undefined, undefined, 0, 1000);
      setRooms(roomsData.content || []);
    } catch (e) {
      console.error('Failed to load rooms:', e);
    }
  };

  const loadStays = async () => {
    try {
      // Load all stays (no date filter on API side, we'll filter client-side)
      const staysData = await apiService.getStays(0, 1000);
      setStays(staysData.content || []);
    } catch (e) {
      console.error('Failed to load stays:', e);
      setStays([]);
    }
  };

  const loadRatesForAllCategories = useCallback(async () => {
    try {
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - Math.floor(dateRange / 2));
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + dateRange);

      const from = startDate.toISOString().split('T')[0];
      const to = endDate.toISOString().split('T')[0];

      // Auto-expand all categories by default
      const newExpanded = new Set<number>();
      categories.forEach(cat => newExpanded.add(cat.id));
      setExpandedCategories(newExpanded);

      const ratesPromises = categories.map(category =>
        apiService.getRates(category.id, from, to).catch(err => {
          console.error(`Failed to load rates for category ${category.id}:`, err);
          return []; // Return empty array on error
        })
      );

      const ratesResults = await Promise.allSettled(ratesPromises);
      
      // Group rooms by category
      const roomsByCategory = new Map<number, RoomResponse[]>();
      rooms.forEach(room => {
        if (!roomsByCategory.has(room.categoryId)) {
          roomsByCategory.set(room.categoryId, []);
        }
        roomsByCategory.get(room.categoryId)!.push(room);
      });

      const categoryRatesData: CategoryRates[] = categories.map((category, index) => ({
        category,
        rates: ratesResults[index].status === 'fulfilled' ? ratesResults[index].value : [],
        rooms: roomsByCategory.get(category.id) || []
      }));

      setCategoryRates(categoryRatesData);
    } catch (e) {
      console.error('Failed to load rates:', e);
      // Don't set error state here - allow calendar to show even without rates
    }
  }, [categories, currentDate, dateRange, rooms]);

  // Generate date range
  const dateRangeDates = useMemo(() => {
    const dates: Date[] = [];
    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - Math.floor(dateRange / 2)); // Center around current date
    
    for (let i = 0; i < dateRange; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentDate, dateRange]);

  // Navigate dates
  const navigateDate = useCallback((direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction);
    setCurrentDate(newDate);
  }, [currentDate]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const toggleCategory = useCallback((categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  const isToday = useCallback((date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  }, []);

  // Get rate for a specific date
  const getRateForDate = useCallback((rates: DailyRateResponse[], date: Date): DailyRateResponse | null => {
    const dateStr = date.toISOString().split('T')[0];
    return rates.find(rate => rate.date === dateStr) || null;
  }, []);

  // Handle rate edit
  const handleRateClick = useCallback((categoryId: number, date: Date, rate: DailyRateResponse | null) => {
    const dateStr = date.toISOString().split('T')[0];
    setEditingRate({
      categoryId,
      date: dateStr,
      currentPrice: rate?.price || 0
    });
    setNewPrice(rate?.price?.toString() || '');
    setIsEditModalOpen(true);
  }, []);

  // Save rate
  const handleSaveRate = async () => {
    if (!editingRate || !newPrice.trim()) return;
    
    setIsSaving(true);
    try {
      const rateValue = parseFloat(newPrice);
      if (isNaN(rateValue) || rateValue < 0) {
        alert('يرجى إدخلاق سعر صحيح');
        setIsSaving(false);
        return;
      }

      // According to Swagger, SetRatesRequest requires startDate, endDate, and price
      // For single day rate, startDate = endDate = editingRate.date
      const rateRequest: SetRatesRequest = {
        startDate: editingRate.date,
        endDate: editingRate.date,
        price: rateValue
      };
      await apiService.setRates(editingRate.categoryId, rateRequest);
      
      // Reload rates after saving
      await loadRatesForAllCategories();
      
      setIsEditModalOpen(false);
      setEditingRate(null);
      setNewPrice('');
    } catch (e: any) {
      console.error('Failed to save rate:', e);
      alert('فشل حفظ السعر');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingRate(null);
    setNewPrice('');
  };

  // Calculate daily occupancy for a category
  const calculateDailyOccupancy = useCallback((categoryId: number, dates: Date[]): DailyOccupancy[] => {
    const categoryRooms = rooms.filter(room => room.categoryId === categoryId);
    const totalRooms = categoryRooms.length;

    return dates.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      
      // Count occupied rooms for this date by checking stays in category rooms
      const occupiedCount = stays.filter(stay => {
        // Find the room for this stay
        const stayRoom = rooms.find(room => room.id === stay.roomId);
        if (!stayRoom || stayRoom.categoryId !== categoryId) return false;
        
        const checkIn = new Date(stay.expectedCheckInDate);
        const checkOut = new Date(stay.expectedCheckOutDate);
        const currentDate = new Date(dateStr);
        
        // A room is occupied if the stay is active or reserved for this date
        // Check if current date is within stay range (inclusive check-in, exclusive check-out)
        return (
          currentDate >= checkIn &&
          currentDate < checkOut &&
          ['RESERVED', 'ACTIVE'].includes(stay.status)
        );
      }).length;

      return {
        date: dateStr,
        occupied: occupiedCount,
        available: totalRooms - occupiedCount
      };
    });
  }, [rooms, stays]);

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl">
        <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
        <p className="text-gray-500 text-sm font-bold mb-4">{error}</p>
        <button 
          onClick={loadPricingData}
          className="px-5 py-2 bg-[#D4AF37] text-white font-bold text-sm rounded-xl hover:bg-[#AA7B30] transition"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        {/* Navigation */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigateDate(-1)}
            className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition"
          >
            <ChevronRight size={18} className="text-gray-600" />
          </button>
          <button 
            onClick={goToToday}
            className="px-4 py-2 border border-[#D4AF37] text-[#AA7B37] bg-white rounded-xl text-sm font-bold hover:bg-amber-50 transition"
          >
            اليوم
          </button>
          <button 
            onClick={() => navigateDate(1)}
            className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition"
          >
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <h2 className="text-lg font-black text-gray-900 mr-2">
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Selector */}
          <div className="flex border border-gray-200 rounded-xl bg-white overflow-hidden">
            {[7, 14, 30, 60].map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-2 text-sm font-bold transition border-l first:border-l-0 ${
                  dateRange === range 
                    ? 'bg-[#D4AF37] text-white' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {range} يوم
              </button>
            ))}
          </div>

          <button 
            onClick={loadPricingData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition"
          >
            <RefreshCw size={16} className="text-gray-600" />
            <span className="text-sm font-bold text-gray-600">تحديث</span>
          </button>
        </div>
      </div>

      {/* Calendar Container */}
      <div className="space-y-6">
        {categoryRates.map(({ category, rates, rooms: categoryRooms }) => {
          const dailyOccupancy = calculateDailyOccupancy(category.id, dateRangeDates);
          const totalRooms = categoryRooms.length;

          return (
            <div key={category.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              {/* Category Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign size={18} className="text-[#AA7B30]" />
                  <h3 className="text-lg font-bold text-gray-900">{category.name}</h3>
                  <span className="text-sm text-gray-500">({totalRooms} غرفة)</span>
                </div>
              </div>

              {/* Calendar Body */}
              <div className="relative overflow-x-auto">
                {/* 4-Row Grid: Day, Available, Occupied, Price */}
                <div className="min-w-max space-y-0">
                  {/* Row 1: Days */}
                  <div className="flex border-b border-gray-200">
                    {dateRangeDates.map((date, dateIndex) => (
                      <div
                        key={`day-${dateIndex}`}
                        className={`flex-shrink-0 w-48 border-r-2 border-gray-200 p-3 text-center ${
                          isToday(date) ? 'bg-amber-50' : ''
                        }`}
                      >
                        <div className="text-xs font-bold text-gray-500">
                          {DAY_NAMES[date.getDay()]}
                        </div>
                        <div className={`text-xl font-black mt-1 ${
                          isToday(date) ? 'text-[#AA7B30]' : 'text-gray-800'
                        }`}>
                          {date.getDate()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Row 2: Available Rooms */}
                  <div className="flex border-b border-gray-200">
                    {dateRangeDates.map((date, dateIndex) => {
                      const occupancy = dailyOccupancy[dateIndex];
                      return (
                        <div
                          key={`available-${dateIndex}`}
                          className={`flex-shrink-0 w-48 border-r-2 border-gray-200 p-3 text-center ${
                            isToday(date) ? 'bg-amber-50/30' : ''
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-xs text-gray-500">غرف متاحة:</span>
                            <span className={`text-base font-bold px-2 py-0.5 rounded ${
                              occupancy.available > 0 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {occupancy.available}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Row 3: Occupied Rooms */}
                  <div className="flex border-b border-gray-200">
                    {dateRangeDates.map((date, dateIndex) => {
                      const occupancy = dailyOccupancy[dateIndex];
                      return (
                        <div
                          key={`occupied-${dateIndex}`}
                          className={`flex-shrink-0 w-48 border-r-2 border-gray-200 p-3 text-center ${
                            isToday(date) ? 'bg-amber-50/30' : ''
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-xs text-gray-500">غرف محجوزة:</span>
                            <span className="text-base font-bold text-gray-800">
                              {occupancy.occupied}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Row 4: Price */}
                  <div className="flex">
                    {dateRangeDates.map((date, dateIndex) => {
                      const rate = getRateForDate(rates, date);
                      const isLast = dateIndex === dateRangeDates.length - 1;
                      return (
                        <div
                          key={`price-${dateIndex}`}
                          onClick={() => handleRateClick(category.id, date, rate)}
                          className={`flex-shrink-0 w-48 ${isLast ? '' : 'border-r-2 border-gray-200'} p-3 text-center cursor-pointer hover:bg-gray-50 transition group relative ${
                            isToday(date) ? 'bg-amber-50/30' : ''
                          }`}
                        >
                          {rate ? (
                            <div className="text-center group relative w-full">
                              <div className="text-base font-bold text-[#AA7B30] group-hover:text-[#8B6B20] transition">
                                {rate.price.toLocaleString('ar-SA')} ريال
                              </div>
                              
                              
                              
                              <div className="opacity-0 group-hover:opacity-100 absolute inset-0 bg-[#D4AF37]/10 flex items-center justify-center transition">
                                <div className="text-xs font-bold text-[#AA7B30]">تعديل</div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-gray-400 text-base group-hover:text-gray-500 transition">
                              —
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {categoryRates.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm font-bold">
          لا توجد تصنيفات غرف
        </div>
      )}

      {/* Edit Rate Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingRate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={handleCancelEdit}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-900">تعديل السعر</h3>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 hover:bg-gray-100 rounded-xl transition"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    التاريخ
                  </label>
                  <div className="text-sm text-gray-600">
                    {new Date(editingRate.date).toLocaleDateString('ar-SA', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    السعر الحالي
                  </label>
                  <div className="text-lg font-bold text-[#AA7B30]">
                    {editingRate.currentPrice.toLocaleString('ar-SA')} ريال
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    السعر الجديد (ريال)
                  </label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="أدخل السعر الجديد"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm font-bold text-gray-900"
                    min="0"
                    step="0.01"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveRate}
                  disabled={isSaving || !newPrice.trim()}
                  className="flex-1 px-4 py-3 bg-[#D4AF37] text-white rounded-xl text-sm font-bold hover:bg-[#AA7B30] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      حفظ
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  DollarSign, CheckCircle2, Utensils, Filter, Plus, X, Search,
  Loader2, ChefHat, Clock, AlertCircle
} from 'lucide-react';
import { RestaurantOrder } from '../types';
import CreateOrderModal from './CreateOrderModal';
import CreateMenuItemModal from './CreateMenuItemModal';
import { apiService } from '../services/api';

interface OrdersSectionProps {
  orders?: RestaurantOrder[];
  onUpdateOrderStatus?: (orderId: string, status: RestaurantOrder['status']) => void;
}

// Backend statuses: PENDING, COMPLETED, CANCELLED
const STATUS_LABELS: Record<string, string> = {
  'PENDING': 'قيد الانتظار',
  'COMPLETED': 'مكتمل',
  'CANCELLED': 'ملغي',
};

const STATUS_COLORS: Record<string, string> = {
  'PENDING': 'bg-amber-50 text-amber-700 border-amber-200',
  'COMPLETED': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'CANCELLED': 'bg-red-50 text-red-700 border-red-200',
};

const CATEGORY_LABELS: Record<string, string> = {
  'FOOD': 'طعام',
  'DRINK': 'مشروبات',
  'ROOM_SERVICE': 'خدمة الغرف',
};

const CATEGORY_ICONS: Record<string, string> = {
  'FOOD': '🍽️',
  'DRINK': '🥤',
  'ROOM_SERVICE': '⭐',
};

export default function OrdersSection({ orders: initialOrders = [] }: OrdersSectionProps) {
  const [viewMode, setViewMode] = useState<'orders' | 'menu'>('orders');
  const [filter, setFilter] = useState<string>('all');
  const [roomFilter, setRoomFilter] = useState('');
  const [debouncedRoom, setDebouncedRoom] = useState('');
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [isCreateMenuItemModalOpen, setIsCreateMenuItemModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);

  useEffect(() => {
    // Load all data in parallel for better performance
    const loadAllData = async () => {
      await Promise.allSettled([
        loadStats(),
        loadMenu(),
        loadOrders()
      ]);
    };
    loadAllData();
  }, []);

  const loadStats = async () => {
    try {
      const response = await apiService.getRestaurantStats();
      setStats(response);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadMenu = async () => {
    try {
      const items = await apiService.getAllMenuItems();
      // Sort menu items by ID ascending
      const sortedItems = items.sort((a, b) => a.id - b.id);
      setMenuItems(sortedItems);
    } catch (error) {
      setMenuItems([]);
    }
  };

  const loadOrders = async () => {
    setError(null);
    try {
      const response = await apiService.getRestaurantPendingOrders();
      const rawOrders = Array.isArray(response) ? response : [];
      const transformedOrders = rawOrders.map((order: any) => ({
        id: String(order.orderId),
        roomNumber: order.roomNumber || '-',
        guestName: order.guestName || '',
        category: order.category || 'FOOD',
        items: Array.isArray(order.items) ? order.items.map((item: any) => ({
          name: item.itemName || item.name || '',
          quantity: item.quantity || 1,
          price: parseFloat(item.unitPrice) || item.price || 0,
          category: order.category || 'FOOD',
          menuItemId: item.menuItemId || 0,
        })) : [],
        status: (order.orderStatus || order.status || 'PENDING').toUpperCase(),
        total: parseFloat(order.totalAmount) || 0,
        createdAt: order.createdAt || '',
      }));
      setOrders(transformedOrders);
    } catch (error: any) {
      console.error('Failed to load restaurant pending orders:', error);
      setOrders([]);
      setError('فشل في تحميل الطلبات. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrderSuccess = (newOrder?: any) => {
    if (newOrder) {
      // Add new order to local state immediately — do NOT clear existing orders
      setOrders(prev => {
        // Avoid duplicates
        const exists = prev.some(o => o.id === newOrder.id);
        if (exists) return prev;
        return [newOrder, ...prev];
      });
    }
  };

  const handleCreateMenuItemSuccess = (newItem?: any) => {
    if (newItem) {
      // Add new item or update existing item locally
      setMenuItems(prevItems => {
        const existingIndex = prevItems.findIndex(item => item.id === newItem.id);
        if (existingIndex >= 0) {
          // Update existing item - maintain position
          const updatedItems = [...prevItems];
          updatedItems[existingIndex] = newItem;
          return updatedItems;
        } else {
          // Add new item and sort by ID ascending
          const updatedItems = [...prevItems, newItem];
          return updatedItems.sort((a, b) => a.id - b.id);
        }
      });
    } else {
      loadMenu();
    }
    setEditingMenuItem(null);
    setIsCreateMenuItemModalOpen(false);
  };

  const handleEditMenuItem = (item: any) => {
    setEditingMenuItem(item);
    setIsCreateMenuItemModalOpen(true);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Only send valid backend statuses
      const backendStatus = ['PENDING', 'COMPLETED', 'CANCELLED'].includes(newStatus) ? newStatus : 'PENDING';
      await apiService.updateRestaurantOrderStatus(parseInt(orderId), backendStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: backendStatus } : o));
      loadStats(); // Reload stats after status update
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const handleRoomFilterChange = useCallback((value: string) => {
    setRoomFilter(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedRoom(value);
    }, 300);
  }, []);

  const filteredOrders = orders.filter(o => {
    const matchesStatus = filter === 'all' || o.status === filter;
    const matchesRoom = debouncedRoom === '' || o.roomNumber?.toString().includes(debouncedRoom);
    return matchesStatus && matchesRoom;
  });

  // Use stats from API if available, otherwise use local order counts
  const totalOrdersCount = stats?.totalOrders ?? orders.length;
  const pendingCount = stats?.pendingOrders ?? orders.filter(o => o.status === 'PENDING').length;
  const completedCount = stats?.completedOrders ?? orders.filter(o => o.status === 'COMPLETED').length;
  const cancelledCount = stats?.cancelledOrders ?? orders.filter(o => o.status === 'CANCELLED').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-black text-gray-900">الطلبات</h1>
          <p className="text-sm mt-1 text-gray-500">تتبع طلبات الطعام ومراقبة حالة المطبخ والمبيعات.</p>
        </div>
        <div className="flex gap-2">
          {viewMode === 'orders' && (
            <button 
              onClick={() => setIsCreateOrderModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#AA7B30] to-[#D4AF37] text-white font-bold text-sm rounded-xl shadow-lg transition duration-200 hover:shadow-xl"
            >
              <Plus size={18} />
              <span>إنشاء طلب</span>
            </button>
          )}
          {viewMode === 'menu' && (
            <button 
              onClick={() => setIsCreateMenuItemModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#AA7B30] to-[#D4AF37] text-white font-bold text-sm rounded-xl shadow-lg transition duration-200 hover:shadow-xl"
            >
              <Plus size={18} />
              <span>إضافة عنصر</span>
            </button>
          )}
        </div>
      </div>

      {/* View Mode Toggles */}
      <div className="flex flex-wrap items-center gap-2 border border-gray-200 p-3 rounded-xl bg-white">
        {[
          { id: 'orders', label: 'الطلبات', icon: <Utensils size={16} /> },
          { id: 'menu', label: 'القائمة', icon: <ChefHat size={16} /> }
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition border ${
              viewMode === mode.id ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'bg-white text-gray-600 border-gray-200 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            {mode.icon}
            <span>{mode.label}</span>
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 border border-gray-200 rounded-xl bg-white">
          <div className="space-y-1">
            <span className="text-sm text-gray-500 font-bold">إجمالي الطلبات</span>
            <div className="text-2xl font-black font-mono text-gray-900">{totalOrdersCount}</div>
          </div>
          <div className="p-2.5 rounded-lg mt-3 bg-emerald-50 text-emerald-600 w-fit">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="p-5 border border-gray-200 rounded-xl bg-white">
          <div className="space-y-1">
            <span className="text-sm text-gray-500 font-bold">قيد الانتظار</span>
            <div className="text-2xl font-black font-mono text-gray-900">{pendingCount}</div>
          </div>
          <div className="p-2.5 rounded-lg mt-3 bg-amber-50 text-amber-600 w-fit">
            <Clock size={20} />
          </div>
        </div>

        <div className="p-5 border border-gray-200 rounded-xl bg-white">
          <div className="space-y-1">
            <span className="text-sm text-gray-500 font-bold">المكتملة</span>
            <div className="text-2xl font-black font-mono text-gray-900">{completedCount}</div>
          </div>
          <div className="p-2.5 rounded-lg mt-3 bg-purple-50 text-purple-600 w-fit">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="p-5 border border-gray-200 rounded-xl bg-white">
          <div className="space-y-1">
            <span className="text-sm text-gray-500 font-bold">ملغاة</span>
            <div className="text-2xl font-black font-mono text-gray-900">{cancelledCount}</div>
          </div>
          <div className="p-2.5 rounded-lg mt-3 bg-red-50 text-red-600 w-fit">
            <AlertCircle size={20} />
          </div>
        </div>
      </div>

      {/* Status Filter */}
      {viewMode === 'orders' && (
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="text-[#D4AF37] w-4 h-4" />
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition ${
              filter === 'all' ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'bg-white text-gray-600 border-gray-200 hover:text-gray-900'
            }`}
          >
            الكل ({orders.length})
          </button>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition ${
                filter === key ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'bg-white text-gray-600 border-gray-200 hover:text-gray-900'
              }`}
            >
              {label} ({orders.filter(o => o.status === key).length})
            </button>
          ))}
        </div>
      )}

      {/* Room Number Filter */}
      {viewMode === 'orders' && (
        <div className="relative max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="بحث برقم الغرفة..."
            value={roomFilter}
            onChange={(e) => handleRoomFilterChange(e.target.value)}
            className="w-full bg-white border border-gray-200 focus:border-[#D4AF37] rounded-xl pr-10 pl-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none transition"
          />
          {roomFilter && (
            <button
              onClick={() => { setRoomFilter(''); setDebouncedRoom(''); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Orders View */}
      {viewMode === 'orders' && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={28} className="text-[#D4AF37] animate-spin" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
              <Utensils size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm font-bold mb-4">
                {debouncedRoom ? `لا توجد طلبات للغرفة ${debouncedRoom}` : 'لا توجد طلبات حالياً'}
              </p>
              {!debouncedRoom && (
                <button
                  onClick={() => setIsCreateOrderModalOpen(true)}
                  className="px-5 py-2 bg-[#D4AF37] text-white font-bold text-sm rounded-xl"
                >
                  إنشاء طلب
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-xl hover:border-[#D4AF37]/35 transition duration-300 flex flex-col bg-white overflow-hidden">
                  {/* Status Bar */}
                  <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                    <span className={`text-sm font-bold px-3 py-1 rounded-full border ${STATUS_COLORS[order.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                    <span className="text-sm text-gray-400 font-bold">
                      {CATEGORY_LABELS[order.category] || order.category}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    {/* Time & Room */}
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="text-lg font-bold text-gray-900 block">غرفة {order.roomNumber}</span>
                        <span className="text-sm text-gray-500 font-bold block mt-0.5">{order.createdAt ? new Date(order.createdAt).toLocaleString('ar-SA', { hour: '2-digit', minute: '2-digit', calendar: 'gregory' }) : '—'}</span>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-2 mb-4 flex-1">
                      {order.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{CATEGORY_ICONS[item.category] || '🍽️'}</span>
                            <div>
                              <span className="text-sm font-bold text-gray-800 block">{item.name}</span>
                              <span className="text-xs text-gray-400">{CATEGORY_LABELS[item.category] || ''}</span>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-gray-500">x{item.quantity}</span>
                        </div>
                      ))}
                      {order.items.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-2">لا توجد عناصر</p>
                      )}
                    </div>

                    {/* Total & Status Select */}
                    <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                      <div>
                        <span className="text-sm font-bold text-gray-400 block">الإجمالي</span>
                        <span className="text-xl font-black font-mono text-[#AA7B30]">
                          {(order.total || 0).toLocaleString('ar-SA', { maximumFractionDigits: 0 })} <span className="text-sm font-sans">ريال</span>
                        </span>
                      </div>
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        className={`px-3 py-2 rounded-lg text-sm font-bold border ${STATUS_COLORS[order.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}
                      >
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Menu View */}
      {viewMode === 'menu' && (
        <div className="border border-gray-200 rounded-xl p-6 bg-white">
          <h3 className="text-lg font-bold mb-4 text-gray-900">قائمة الطعام</h3>
          {menuItems.length === 0 ? (
            <div className="text-center py-16">
              <ChefHat size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm font-bold">لا توجد عناصر في القائمة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
              {menuItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative"
                >
                  <div className="relative backdrop-blur-xl border rounded-2xl overflow-hidden hover:border-[#D4AF37]/30 hover:shadow-[0_20px_40px_rgba(212,175,55,0.15)] transition-all duration-500 hover:-translate-y-2 group bg-white border-gray-200">
                    {/* Item Image */}
                    <div className="relative h-64 overflow-hidden">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          onError={(e) => { 
                            e.currentTarget.src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600";
                          }}
                        />
                      ) : (
                        <img 
                          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600" 
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/20 to-transparent" />
                      <div className="absolute top-3 right-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md shadow-lg ${item.available ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                          <span className={`w-2 h-2 rounded-full ${item.available ? 'bg-green-400' : 'bg-red-400'}`}></span>
                          <span>{item.available ? 'متوفر' : 'غير متوفر'}</span>
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                        <span className="text-3xl font-black font-mono text-white drop-shadow-lg">#{item.id}</span>
                        <span className="text-sm text-white/80 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-lg font-bold">{CATEGORY_LABELS[item.category] || item.category}</span>
                      </div>
                    </div>

                    {/* Item Info */}
                    <div className="p-6 space-y-4">
                      {/* Name */}
                      <h3 className="text-xl font-black text-gray-900">{item.name}</h3>

                      {/* Price */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-sm">السعر</span>
                        <span className="text-2xl font-black text-[#AA7B30]">{item.price ? `${item.price.toLocaleString('ar-SA')} ر.س` : 'غير متاح'}</span>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
                          <span className="text-gray-400 text-xs">التصنيف</span>
                          <span className="font-bold text-gray-800">{CATEGORY_LABELS[item.category] || item.category}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl">
                          <span className="text-gray-400 text-xs">الحالة</span>
                          <span className={`font-bold ${item.available ? 'text-green-600' : 'text-red-600'}`}>
                            {item.available ? 'متوفر' : 'غير متوفر'}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <span className="block text-gray-400 text-xs mb-2">الوصف</span>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {item.description || 'بدون وصف'}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="pt-3 border-t border-gray-100 flex gap-2">
                        <button
                          onClick={() => handleEditMenuItem(item)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:text-gray-900 hover:border-[#D4AF37]/30 hover:bg-amber-50 transition-all duration-300"
                        >
                          <span>تعديل</span>
                        </button>
                        <select
                          value={item.available ? 'true' : 'false'}
                          onChange={async (e) => {
                            const newAvailable = e.target.value === 'true';
                            try {
                              // Use PATCH instead of PUT for partial updates
                              const updateRequest = { available: newAvailable };
                              let updatedItem;
                              if (item.category === 'FOOD') {
                                updatedItem = await apiService.patchRestaurantMenuItem(item.id, updateRequest);
                              } else if (item.category === 'DRINK') {
                                updatedItem = await apiService.patchCafeMenuItem(item.id, updateRequest);
                              } else if (item.category === 'ROOM_SERVICE') {
                                updatedItem = await apiService.patchRoomServiceMenuItem(item.id, updateRequest);
                              }
                              // Update local state
                              setMenuItems(prevItems => 
                                prevItems.map(i => i.id === item.id ? { ...i, available: newAvailable } : i)
                              );
                            } catch (error) {
                              console.error('Failed to update status:', error);
                            }
                          }}
                          className={`flex-1 px-3 py-2.5 border rounded-lg text-sm font-bold transition-all duration-300 ${
                            item.available 
                              ? 'border-green-200 text-green-600 bg-green-50' 
                              : 'border-red-200 text-red-600 bg-red-50'
                          }`}
                        >
                          <option value="true">متوفر</option>
                          <option value="false">غير متوفر</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={isCreateOrderModalOpen}
        onClose={() => setIsCreateOrderModalOpen(false)}
        onSuccess={handleCreateOrderSuccess}
        roomNumber="101"
      />

      {/* Create Menu Item Modal */}
      <CreateMenuItemModal
        isOpen={isCreateMenuItemModalOpen}
        onClose={() => { setIsCreateMenuItemModalOpen(false); setEditingMenuItem(null); }}
        onSuccess={handleCreateMenuItemSuccess}
        editingItem={editingMenuItem}
      />
    </div>
  );
}

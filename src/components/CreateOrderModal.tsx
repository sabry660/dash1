import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Save, Loader2, Utensils, Coffee, Sparkles, Search, Plus } from 'lucide-react';
import { apiService, CreateOrderRequest } from '../services/api';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newOrder?: any) => void;
  roomNumber?: string;
}

interface OrderItem {
  menuItemId: number;
  quantity: number;
  notes?: string;
  name?: string;
  price?: number;
  category?: string;
}

interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  category?: string;
  available?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  'FOOD': 'طعام',
  'DRINK': 'مشروبات',
  'ROOM_SERVICE': 'خدمة الغرف',
};

const CATEGORY_COLORS: Record<string, string> = {
  'FOOD': 'bg-amber-100 text-amber-700 border-amber-200',
  'DRINK': 'bg-blue-100 text-blue-700 border-blue-200',
  'ROOM_SERVICE': 'bg-purple-100 text-purple-700 border-purple-200',
};

const CATEGORY_ICONS: Record<string, string> = {
  'FOOD': '🍽️',
  'DRINK': '🥤',
  'ROOM_SERVICE': '⭐',
};

export default function CreateOrderModal({ isOpen, onClose, onSuccess, roomNumber }: CreateOrderModalProps) {
  const [orderCategory, setOrderCategory] = useState<string>('FOOD');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showItemPicker, setShowItemPicker] = useState<number | null>(null);
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const categories = [
    { value: 'FOOD', label: 'طعام', icon: Utensils },
    { value: 'DRINK', label: 'مشروبات', icon: Coffee },
    { value: 'ROOM_SERVICE', label: 'خدمة الغرف', icon: Sparkles },
  ];

  // Load menu items and active rooms when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAllMenuItems();
      loadActiveRooms();
      setItems([]);
      setOrderCategory('FOOD');
      setErrorMessage('');
      setShowItemPicker(null);
      setSearchQuery('');
      setSelectedRoom(roomNumber || '');
    }
  }, [isOpen]);

  useEffect(() => {
    if (showItemPicker !== null && searchRef.current) {
      searchRef.current.focus();
    }
  }, [showItemPicker]);

  const loadAllMenuItems = async () => {
    setIsLoadingMenu(true);
    try {
      const items = await apiService.getAllMenuItems();
      setAllMenuItems(items);
    } catch (error) {
      setAllMenuItems([]);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  const loadActiveRooms = async () => {
    try {
      // Fetch stays that are ACTIVE or CHECKED_IN (rooms with active bookings)
      const response = await apiService.getStays(0, 100);
      
      const rooms: any[] = [];
      const seen = new Set<string>();

      // Filter for active stays (ACTIVE, CHECKED_IN, RESERVED, BOOKED)
      const activeStays = (response.content || []).filter((s: any) => {
        const status = (s.status || '').toUpperCase();
        return status === 'ACTIVE' || status === 'CHECKED_IN' || status === 'RESERVED' || status === 'BOOKED';
      });

      activeStays.forEach((stay: any) => {
        if (stay.roomNumber && !seen.has(stay.roomNumber)) {
          seen.add(stay.roomNumber);
          rooms.push({ 
            roomNumber: stay.roomNumber, 
            guestName: stay.guestName || '', 
            stayId: stay.stayId,
            status: stay.status 
          });
        }
      });

      setActiveRooms(rooms);
    } catch (error) {
      console.error('Failed to load active rooms:', error);
      setActiveRooms([]);
    }
  };

  // Filter by selected order category + search
  const filteredMenuItems = allMenuItems.filter(item => {
    const matchesCategory = item.category === orderCategory;
    const matchesSearch = searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addItem = () => {
    const newItem = { menuItemId: 0, quantity: 1 };
    setItems(prev => [...prev, newItem]);
    // Open picker for the new item (it will be at index = items.length)
    setTimeout(() => {
      setShowItemPicker(items.length);
      setSearchQuery('');
    }, 0);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
    if (showItemPicker === index) setShowItemPicker(null);
    else if (showItemPicker !== null && showItemPicker > index) {
      setShowItemPicker(prev => prev !== null ? prev - 1 : null);
    }
  };

  const selectMenuItem = (index: number, menuItem: MenuItem) => {
    // Use the ORDER category, not the item's category (backend may not store item category)
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = {
        ...newItems[index],
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        category: orderCategory,
        quantity: newItems[index].quantity || 1,
      };
      return newItems;
    });
    setShowItemPicker(null);
    setSearchQuery('');
  };

  const updateQuantity = (index: number, qty: number) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], quantity: Math.max(1, qty) };
      return newItems;
    });
  };

  const handleSubmit = async () => {
    const validItems = items.filter(item => item.menuItemId > 0 && item.quantity > 0);
    if (validItems.length === 0) {
      setErrorMessage('الرجاء إضافة عنصر واحد على الأقل');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // Map ROOM_SERVICE → SERVICE for backend (backend only accepts FOOD, DRINK, SERVICE)
      const backendCategory = orderCategory === 'ROOM_SERVICE' ? 'SERVICE' : orderCategory;

      const orderRequest: CreateOrderRequest = {
        category: backendCategory as any,
        items: validItems.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          notes: item.notes
        }))
      };

      const orderRoom = selectedRoom || roomNumber || '101';
      const response = await apiService.createGuestOrder(orderRoom, orderRequest);
      
      // Build the new order object for immediate display
      const newOrder = {
        id: String(response?.orderId || Date.now()),
        roomNumber: orderRoom,
        guestName: response?.guestName || '',
        category: orderCategory,
        items: validItems.map(item => ({
          name: item.name || '',
          quantity: item.quantity,
          price: item.price || 0,
          category: orderCategory,
          menuItemId: item.menuItemId,
        })),
        status: 'PENDING',
        total: validItems.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0),
        createdAt: response?.createdAt || new Date().toISOString(),
      };

      setIsLoading(false);
      onSuccess(newOrder);
      onClose();
    } catch (error) {
      setIsLoading(false);
      setErrorMessage('فشل إنشاء الطلب. الرجاء المحاولة مرة أخرى.');
    }
  };

  const total = items.filter(i => i.menuItemId > 0).reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="border border-gray-200 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative bg-white shadow-2xl"
          >
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent rounded-t-2xl" />
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Utensils size={22} className="text-[#D4AF37]" />
                  إنشاء طلب جديد
                </h2>
                <p className="text-sm mt-1 text-gray-500 font-bold">اختر الغرفة والعنصر</p>
              </div>
              <button onClick={onClose} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-5">
              {errorMessage && (
                <div className="p-3 border border-red-200 rounded-lg text-sm font-bold bg-red-50 text-red-700">
                  {errorMessage}
                </div>
              )}

              {/* Room Selector */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">رقم الغرفة *</label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none transition"
                >
                  <option value="">اختر غرفة نشطة...</option>
                  {activeRooms.length > 0 ? (
                    activeRooms.map((room) => (
                      <option key={room.roomNumber} value={room.roomNumber}>
                        {room.roomNumber} - {room.guestName || 'بدون ضيف'}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>لا توجد غرف نشطة</option>
                  )}
                </select>
                {activeRooms.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">{activeRooms.length} غرف نشطة متاحة</p>
                )}
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">فئة الطلب *</label>
                <div className="flex gap-2">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const count = allMenuItems.filter(i => i.category === cat.value).length;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => { setOrderCategory(cat.value); setItems([]); setShowItemPicker(null); setSearchQuery(''); }}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition border ${
                          orderCategory === cat.value
                            ? 'bg-[#D4AF37] text-white border-[#D4AF37]'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon size={18} />
                        {cat.label}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${orderCategory === cat.value ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Items List */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">عناصر الطلب *</label>
                
                {isLoadingMenu ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="text-[#D4AF37] animate-spin" />
                    <span className="mr-2 text-sm text-gray-500 font-bold">جاري تحميل القائمة...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                        {item.menuItemId > 0 ? (
                          /* Selected Item Display */
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{CATEGORY_ICONS[item.category || 'FOOD'] || '🍽️'}</span>
                              <div>
                                <span className="text-base font-bold text-gray-900 block">{item.name}</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${CATEGORY_COLORS[item.category || 'FOOD'] || 'bg-gray-100 text-gray-600'}`}>
                                    {CATEGORY_LABELS[item.category || 'FOOD'] || item.category}
                                  </span>
                                  <span className="text-sm text-[#AA7B30] font-bold font-mono">{item.price} ريال</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 border border-gray-200 rounded-lg bg-white">
                                <button onClick={() => updateQuantity(index, item.quantity - 1)} className="px-3 py-1.5 text-gray-500 font-bold hover:text-gray-900 transition">-</button>
                                <span className="text-base font-bold text-gray-900 min-w-[2rem] text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(index, item.quantity + 1)} className="px-3 py-1.5 text-gray-500 font-bold hover:text-gray-900 transition">+</button>
                              </div>
                              <button onClick={() => removeItem(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Item Picker */
                          <div>
                            <div className="relative mb-3">
                              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <input
                                ref={searchRef}
                                type="text"
                                placeholder="ابحث عن عنصر..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white border border-gray-200 focus:border-[#D4AF37] rounded-xl pr-10 pl-4 py-3 text-base font-bold text-gray-800 placeholder-gray-400 focus:outline-none transition"
                              />
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-2">
                              {filteredMenuItems.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">لا توجد عناصر في "{CATEGORY_LABELS[orderCategory]}"</p>
                              ) : (
                                /* Show items grouped under current category */
                                <div>
                                  <div className="flex items-center gap-2 mb-2 px-1">
                                    <span className="text-lg">{CATEGORY_ICONS[orderCategory] || '🍽️'}</span>
                                    <span className="text-sm font-bold text-gray-600">{CATEGORY_LABELS[orderCategory] || orderCategory}</span>
                                    <span className="text-xs text-gray-400">({filteredMenuItems.length})</span>
                                  </div>
                                  <div className="space-y-1.5">
                                    {filteredMenuItems.map((menuItem) => (
                                      <button
                                        key={menuItem.id}
                                        onClick={() => selectMenuItem(index, menuItem)}
                                        className="w-full text-right p-3 rounded-xl border border-gray-200 hover:border-[#D4AF37]/40 hover:bg-amber-50 transition flex justify-between items-center bg-white"
                                      >
                                        <div>
                                          <span className="text-base font-bold text-gray-900 block">{menuItem.name}</span>
                                          {menuItem.description && (
                                            <span className="text-sm text-gray-400">{menuItem.description}</span>
                                          )}
                                        </div>
                                        <span className="text-base font-bold font-mono text-[#AA7B30]">{menuItem.price} ريال</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <button onClick={() => { setShowItemPicker(null); removeItem(index); }} className="mt-2 text-sm text-gray-400 hover:text-gray-600 font-bold">إلغاء</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Item Button - Centered */}
                {!isLoadingMenu && (
                  <div className="flex justify-center mt-4">
                    <button
                      type="button"
                      onClick={addItem}
                      className="flex items-center gap-2 px-8 py-3 border-2 border-dashed border-[#D4AF37]/40 rounded-xl text-sm font-bold text-[#AA7B30] hover:bg-amber-50 hover:border-[#D4AF37]/60 transition-all"
                    >
                      <Plus size={20} />
                      إضافة عنصر
                    </button>
                  </div>
                )}

                {items.length === 0 && !isLoadingMenu && (
                  <div className="text-center py-6 text-sm text-gray-400">
                    اضغط على "إضافة عنصر" لبدء إنشاء الطلب
                  </div>
                )}
              </div>

              {/* Total */}
              {items.filter(i => i.menuItemId > 0).length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex justify-between items-center">
                  <span className="text-base font-bold text-gray-700">الإجمالي</span>
                  <span className="text-2xl font-black font-mono text-[#AA7B30]">
                    {total.toLocaleString('ar-SA')} ريال
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button onClick={onClose} className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
                  إلغاء
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || items.filter(i => i.menuItemId > 0).length === 0}
                  className="px-6 py-3 bg-gradient-to-r from-[#AA7B30] to-[#D4AF37] text-white font-bold text-sm rounded-xl shadow hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isLoading ? 'جاري الإنشاء...' : 'إنشاء الطلب'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

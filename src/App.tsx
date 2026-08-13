import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building, User, LogOut, Sparkles, Menu, X,
  Calendar, BedDouble, Coffee, BarChart3, ShoppingBag, Bot, Layers
} from 'lucide-react';

import Login from './components/Login';
import DashboardHome from './components/DashboardHome';
import RoomsSection from './components/RoomsSection';
import ReservationsSection from './components/ReservationsSection';
import GuestsSection from './components/GuestsSection';
import OrdersSection from './components/OrdersSection';
import UsersManagementSection from './components/UsersManagementSection';
import SpecialOrdersManagementSection from './components/SpecialOrdersManagementSection';
import RestaurantStatsSection from './components/RestaurantStatsSection';
import CafeStatsSection from './components/CafeStatsSection';
import SpecialOffersSection from './components/SpecialOffersSection';
import AIAssistantSection from './components/AIAssistantSection';
import { ThemeProvider } from './contexts/ThemeContext';

import { apiService } from './services/api';
import { Reservation, Guest, RestaurantOrder } from './types';

function App() {
  // Authentication & Loading States
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('lytc_logged_in') === 'true';
  });
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string } | null>(() => {
    const saved = localStorage.getItem('lytc_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [userRoleDisplay, setUserRoleDisplay] = useState<string>('المدير');
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Update role display based on user role
  useEffect(() => {
    const savedUser = localStorage.getItem('lytc_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        const roleMap: { [key: string]: string } = {
          'MANAGER': 'المدير',
          'STAFF': 'موظف',
          'CHEF': 'شيف',
          'BARISTA': 'باريستا',
          'ROOM_SERVICE': 'خدمة الغرف'
        };
        setUserRoleDisplay(roleMap[user.role] || 'المدير');
        
        // Ensure tenant ID is set when user is logged in using the saved hotel selection
        const savedTenant = localStorage.getItem('login_hotel_id') || localStorage.getItem('tenant_id') || 'hotel1';
        if (!localStorage.getItem('tenant_id') || localStorage.getItem('tenant_id') !== savedTenant) {
          apiService.setTenantId(savedTenant);
        }
      } catch (e) {
        setUserRoleDisplay('المدير');
      }
    }
  }, []);

  // Active view tab state with # routing
  const [activeTab, setActiveTab] = useState<'لوحة التحكم' | 'الحجوزات' | 'الغرف' | 'النزلاء' | 'الطلبات' | 'إدارة المستخدمين' | 'الطلبات الخاصة' | 'إحصائيات المطعم' | 'إحصائيات المقهى' | 'العروض والمزايا' | 'المساعد الذكي'>(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      try {
        return decodeURIComponent(hash) as any;
      } catch {
        return 'لوحة التحكم';
      }
    }
    return 'لوحة التحكم';
  });

  // Define role-based permissions
  const getAccessibleTabs = (role: string | null) => {
    const allTabs = [
      { label: 'لوحة التحكم', icon: <Building size={16} />, roles: ['MANAGER', 'STAFF', 'CHEF', 'BARISTA', 'ROOM_SERVICE'] },
      { label: 'الحجوزات', icon: <Calendar size={16} />, roles: ['MANAGER', 'STAFF'] },
      { label: 'الغرف', icon: <BedDouble size={16} />, roles: ['MANAGER', 'STAFF', 'ROOM_SERVICE'] },
      { label: 'الطلبات', icon: <Coffee size={16} />, roles: ['MANAGER', 'STAFF', 'CHEF'] },
      { label: 'المساعد الذكي', icon: <Bot size={16} />, roles: ['MANAGER', 'STAFF', 'CHEF', 'BARISTA', 'ROOM_SERVICE'] },
      { label: 'العروض والمزايا', icon: <Sparkles size={16} />, roles: ['MANAGER', 'STAFF'] },
      { label: 'إدارة المستخدمين', icon: <User size={16} />, roles: ['MANAGER'] },
      { label: 'الطلبات الخاصة', icon: <ShoppingBag size={16} />, roles: ['MANAGER', 'STAFF'] },
      { label: 'إحصائيات المطعم', icon: <BarChart3 size={16} />, roles: ['MANAGER', 'CHEF'] },
      { label: 'إحصائيات المقهى', icon: <BarChart3 size={16} />, roles: ['MANAGER', 'BARISTA'] }
    ];

    if (!role) return allTabs.filter(tab => tab.roles.includes('MANAGER'));
    return allTabs.filter(tab => tab.roles.includes(role));
  };

  const accessibleTabs = getAccessibleTabs(currentUser?.role || null);

  // Redirect to first accessible tab if current tab is not accessible
  useEffect(() => {
    const isTabAccessible = accessibleTabs.some(tab => tab.label === activeTab);
    if (!isTabAccessible && accessibleTabs.length > 0) {
      setActiveTab(accessibleTabs[0].label as any);
      window.location.hash = encodeURIComponent(accessibleTabs[0].label);
    }
  }, [currentUser?.role, accessibleTabs, activeTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as any);
    window.location.hash = encodeURIComponent(tab);
  };

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        try {
          setActiveTab(decodeURIComponent(hash) as any);
        } catch {
          setActiveTab('لوحة التحكم');
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Core Entity States (only for pages not connected to backend)
  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const saved = localStorage.getItem('lytc_reservations');
    return saved ? JSON.parse(saved) : [];
  });
  const [guests, setGuests] = useState<Guest[]>(() => {
    const saved = localStorage.getItem('lytc_guests');
    return saved ? JSON.parse(saved) : [];
  });
  const [orders, setOrders] = useState<RestaurantOrder[]>(() => {
    const saved = localStorage.getItem('lytc_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // UI Notifications dropdown & Global search
  const [notifications, setNotifications] = useState<{ id: string; title: string; time: string; read: boolean }[]>([
    { id: 'n1', title: 'وصول نزيل جديد للجناح البنتهاوس 501', time: 'منذ 15 دقيقة', read: false },
    { id: 'n2', title: 'تم اكتمال تعقيم وتجهيز الغرفة 301', time: 'منذ 34 دقيقة', read: false },
    { id: 'n3', title: 'بلاغ صيانة عاجل جديد لجناح 202', time: 'منذ ساعتين', read: true }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Quick Modal Triggers
  const [quickBookOpen, setQuickBookOpen] = useState(false);
  const [quickBookName, setQuickBookName] = useState('');
  const [quickBookRoom, setQuickBookRoom] = useState('');

  // Sync to localStorage on every state change to keep data persistent
  useEffect(() => {
    localStorage.setItem('lytc_reservations', JSON.stringify(reservations));
  }, [reservations]);
  useEffect(() => {
    localStorage.setItem('lytc_guests', JSON.stringify(guests));
  }, [guests]);

  useEffect(() => {
    localStorage.setItem('lytc_orders', JSON.stringify(orders));
  }, [orders]);

  // Handle simulate luxury booting loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [isLoggedIn]);

  const handleLoginSuccess = (user: { name: string; email: string; role: string }) => {
    setIsLoggingIn(true);
    setTimeout(() => {
      setCurrentUser(user);
      setIsLoggedIn(true);
      setIsLoggingIn(false);
      localStorage.setItem('lytc_logged_in', 'true');
      localStorage.setItem('lytc_user', JSON.stringify(user));
      const tenantId = localStorage.getItem('login_hotel_id') || localStorage.getItem('tenant_id') || 'hotel1';
      apiService.setTenantId(tenantId);
      // Set session timestamp to check for session validity
      localStorage.setItem('lytc_session_timestamp', Date.now().toString());
    }, 1500);
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout API failed:', error);
    }
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('lytc_logged_in');
    localStorage.removeItem('lytc_user');
    localStorage.removeItem('lytc_session_timestamp');
    localStorage.removeItem('auth_token');
    window.location.hash = '';
  };

  // Check session validity on mount and periodically
  useEffect(() => {
    const checkSession = () => {
      const loggedIn = localStorage.getItem('lytc_logged_in') === 'true';
      const sessionTimestamp = localStorage.getItem('lytc_session_timestamp');
      
      if (loggedIn && sessionTimestamp) {
        const timestamp = parseInt(sessionTimestamp);
        const now = Date.now();
        const sessionAge = now - timestamp;
        const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (sessionAge > maxSessionAge) {
          // Session expired
          handleLogout();
        } else if (!currentUser) {
          // Restore user from localStorage if not in state
          const savedUser = localStorage.getItem('lytc_user');
          if (savedUser) {
            try {
              setCurrentUser(JSON.parse(savedUser));
            } catch (e) {
              console.error('Failed to restore user session:', e);
              handleLogout();
            }
          }
        }
      } else if (loggedIn && !currentUser) {
        // Inconsistent state, logout
        handleLogout();
      }
    };

    checkSession();
    
    // Check session every 5 minutes
    const interval = setInterval(checkSession, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [currentUser]);

  // State Manipulator Functions
  const handleAddReservation = (newRes: Reservation) => {
    setReservations((prev: Reservation[]) => [newRes, ...prev]);

    setNotifications((prev: { id: string; title: string; time: string; read: boolean }[]) => [
      { id: Date.now().toString(), title: `حجز مؤكد وجديد باسم ${newRes.guestName} للجناح ${newRes.roomNumber}`, time: 'الآن', read: false },
      ...prev
    ]);
  };

  const handleUpdateReservationStatus = (resId: string, status: Reservation['status']) => {
    setReservations((prev: Reservation[]) => prev.map((res: Reservation) => res.id === resId ? { ...res, status } : res));
    const targetRes = reservations.find((r: Reservation) => r.id === resId);
    if (!targetRes) return;

    setNotifications((prev: { id: string; title: string; time: string; read: boolean }[]) => [
      {
        id: Date.now().toString(),
        title: `تعديل حالة الإقامة للنزيل ${targetRes.guestName} إلى: ${
          status === 'checked_in' ? 'مقيم حالياً' : status === 'checked_out' ? 'مغادر للغرفة' : 'ملغي'
        }`,
        time: 'الآن',
        read: false
      },
      ...prev
    ]);
  };



  const handleUpdateOrderStatus = (orderId: string, status: RestaurantOrder['status']) => {
    setOrders((prev: RestaurantOrder[]) => prev.map((o: RestaurantOrder) => o.id === orderId ? { ...o, status } : o));
  };

  // Render modular views
  const renderActiveView = () => {
    switch (activeTab) {
      case 'لوحة التحكم':
        return (
          <DashboardHome
            onNavigate={(tab) => handleTabChange(tab as any)}
            onOpenQuickBook={() => setQuickBookOpen(true)}
          />
        );
      case 'الغرف':
        return <RoomsSection />;
      case 'الحجوزات':
        return <ReservationsSection />;
      case 'النزلاء':
        return <GuestsSection guests={guests} reservations={reservations} />;
      case 'الطلبات':
        return <OrdersSection />;
      case 'المساعد الذكي':
        return <AIAssistantSection />;
      case 'إدارة المستخدمين':
        return <UsersManagementSection />;
      case 'الطلبات الخاصة':
        return <SpecialOrdersManagementSection />;
      case 'إحصائيات المطعم':
        return <RestaurantStatsSection />;
      case 'إحصائيات المقهى':
        return <CafeStatsSection />;
      case 'العروض والمزايا':
        return <SpecialOffersSection />;
    }
  };

  // If not logged in, render beautiful login page
  if (!isLoggedIn) {
    return (
      <>
        {isLoggingIn && (
          <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-50 flex flex-col items-center justify-center">
            <Building className="w-16 h-16 text-[#D4AF37] animate-pulse mb-4" />
            <span className="text-[#AA7B30] font-black text-sm tracking-widest animate-pulse">جاري فحص المدارات والتحقق الأمني الرقمي...</span>
          </div>
        )}
        <Login onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-gray-800 font-sans flex relative overflow-hidden">
      
      {/* Luxury Loading Boot Screen */}
      <AnimatePresence>
        {isAppLoading && (
          <motion.div
            key="app-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 bg-[#F8F6F2] z-[100] flex flex-col items-center justify-center space-y-6"
          >
            <div className="inline-flex items-center justify-center p-5 rounded-full bg-gradient-to-br from-white to-gray-50 border border-[#D4AF37]/30 shadow-[0_0_50px_rgba(212,175,55,0.15)] animate-bounce">
              <img src="/logo.jpg" alt="LYTC Logo" className="w-16 h-16 rounded-full object-cover" />
            </div>
            <div className="space-y-1.5 text-center">
              <h1 className="text-xl font-extrabold tracking-widest text-[#AA7B30]">ليتك للفنادق والمنتجعات الفاخرة</h1>
              <p className="text-xs text-gray-400 font-bold tracking-wider">LYTC HOTELS & RESORTS • ROYAL MANAGEMENT PORTAL</p>
            </div>
            <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden relative">
              <div className="absolute top-0 right-0 h-full w-2/3 bg-gradient-to-l from-[#AA7B30] to-[#D4AF37] rounded-full animate-pulse" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BACKGROUND GRAPHICS */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.06)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(30,64,175,0.04)_0%,transparent_70%)] pointer-events-none" />

      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-l border-gray-200 shrink-0 p-6 space-y-8 relative z-20 shadow-[5px_0_30px_rgba(0,0,0,0.06)]">
        {/* Brand Header */}
        <div className="flex items-center gap-3.5 pb-5 border-b border-gray-200">
          <div className="p-2.5 rounded-lg bg-amber-50 border border-[#D4AF37]/20">
            <img src="/logo.jpg" alt="LYTC Logo" className="w-10 h-10 rounded-lg object-cover" />
          </div>
          <div>
            <h2 className="text-sm font-black text-[#AA7B30]">ليتك للضيافة الفاخرة</h2>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          {accessibleTabs.map((item) => (
            <button
              key={item.label}
              onClick={() => handleTabChange(item.label as any)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 group ${
                activeTab === item.label
                  ? 'bg-[#D4AF37] text-black shadow-[0_5px_15px_rgba(212,175,55,0.2)]'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-transparent hover:border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              <span className={`text-xs font-mono opacity-0 group-hover:opacity-60 transition ${
                activeTab === item.label ? 'text-black' : 'text-gray-400'
              }`}>
                ●
              </span>
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-600 font-bold text-sm rounded-xl hover:bg-red-100 hover:border-red-300 transition-all"
        >
          <LogOut size={18} />
          <span>تسجيل الخروج</span>
        </button>
      </aside>

      {/* Main Panel Content Wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        
        {/* Top Coordinator Navigation Bar */}
        <header className="h-18 bg-white/90 border-b border-gray-200 px-6 flex items-center justify-between gap-6 backdrop-blur-md relative z-30 shadow-[0_4px_30px_rgba(0,0,0,0.04)]">
          {/* Right Part: Mobile menu triggers, Global Search */}
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="p-2 bg-gray-100 border border-gray-200 rounded-lg lg:hidden text-gray-700 hover:bg-gray-200"
            >
              <Menu size={18} />
            </button>
          </div>

          {/* Left Part: Quick Clock */}
          <div className="flex items-center gap-4 relative">
            {/* Clock */}
            <span className="text-xs font-mono text-gray-500 font-bold hidden md:inline-flex bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg select-none">
              {new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long', calendar: 'gregory' })}
            </span>

          </div>
        </header>

        {/* Dynamic Inner Panel View Stage */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative scroll-smooth">
          {renderActiveView()}
        </main>
      </div>

      {/* Side-Drawer Menu for Mobile/Tablet */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/30 z-[60] lg:hidden"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed inset-y-0 right-0 w-72 bg-white border-l border-gray-200 z-[70] p-6 flex flex-col justify-between lg:hidden overflow-y-auto"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <img src="/logo.jpg" alt="LYTC Logo" className="w-8 h-8 rounded-lg object-cover" />
                    <span className="text-sm font-black text-[#AA7B30]">ليتك للضيافة</span>
                  </div>
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-1.5 bg-gray-100 rounded-lg text-gray-700"
                  >
                    <X size={16} />
                  </button>
                </div>

                <nav className="space-y-1">
                  {accessibleTabs.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        handleTabChange(item.label as any);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        activeTab === item.label
                          ? 'bg-[#D4AF37] text-black shadow-lg'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-600 font-bold text-sm rounded-xl hover:bg-red-100 hover:border-red-300 transition-all"
              >
                <LogOut size={18} />
                <span>تسجيل الخروج</span>
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* QUICK GLOBAL MODALS (CALLED FROM DASHBOARD CARD CLICKS) */}
      {/* 1. Quick Reservation Modal */}
      {quickBookOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full relative space-y-4 shadow-xl">
            <h3 className="text-lg font-black text-[#AA7B30]">حجز سريع فوري</h3>
            <div className="space-y-3 text-right">
              <label className="text-sm font-bold text-gray-600 block">اسم النزيل:</label>
              <input
                type="text"
                value={quickBookName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuickBookName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#D4AF37] transition"
                placeholder="مثال: الشيخ سليمان آل سعود"
              />
              <label className="text-sm font-bold text-gray-600 block">رقم الغرفة:</label>
              <input
                type="text"
                value={quickBookRoom}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuickBookRoom(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#D4AF37] transition"
                placeholder="مثال: 101"
              />
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setQuickBookOpen(false); setQuickBookName(''); setQuickBookRoom(''); }}
                  className="w-1/3 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-bold text-sm"
                >
                  إلغاء
                </button>
                <button
                  onClick={async () => {
                    if (!quickBookName || !quickBookRoom) { alert('الرجاء تعبئة الاسم ورقم الغرفة'); return; }
                    try {
                      await apiService.createStay({
                        guestName: quickBookName,
                        phone: '0500000000',
                        roomNumber: quickBookRoom,
                        numAdults: 2,
                        numKids: 0,
                        expectedCheckInDate: new Date().toISOString().split('T')[0],
                        expectedCheckOutDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                      });
                      setQuickBookOpen(false);
                      setQuickBookName('');
                      setQuickBookRoom('');
                      alert('تم إنشاء الحجز بنجاح!');
                    } catch (error) {
                      alert('فشل إنشاء الحجز. تأكد من صحة البيانات.');
                    }
                  }}
                  className="w-2/3 py-3 bg-gradient-to-r from-[#AA7B30] to-[#D4AF37] text-white font-extrabold text-sm rounded-xl"
                >
                  تأكيد الحجز
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const AppWithProvider = () => (
  <ThemeProvider>
    <App />
  </ThemeProvider>
);

export default AppWithProvider;

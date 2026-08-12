import React, { useState } from 'react';
import { Users, Search, Award, FileText, Phone, Mail, Globe, History } from 'lucide-react';
import { Guest, Reservation } from '../types';

interface GuestsSectionProps {
  guests: Guest[];
  reservations: Reservation[];
}

export default function GuestsSection({ guests, reservations }: GuestsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  const filteredGuests = (guests || []).filter(guest => 
    guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guest.phone.includes(searchQuery) ||
    guest.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-[#AA7B30]">دليل ومستندات النزلاء</h1>
          <p className="text-gray-500 text-xs mt-1">إدارة الملفات الشخصية للنزلاء، ومراجعة تفضيلات الإقامة وبطاقات الولاء والنزلاء المتميزين VIP.</p>
        </div>
      </div>

      {/* Search and statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-white border border-gray-200 p-4 rounded-xl">
        {/* Search */}
        <div className="relative md:col-span-2">
          <input
            type="text"
            className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl pr-9 pl-3 py-2.5 text-xs text-gray-800 focus:outline-none placeholder-gray-500"
            placeholder="البحث باسم النزيل، البريد الإلكتروني، الجوال..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute right-3 top-3 text-gray-500 w-4 h-4" />
        </div>

        {/* Stats */}
        <div className="flex justify-end gap-3 text-xs font-bold">
          <div className="px-3.5 py-2 bg-amber-50/20 text-[#D4AF37] border border-[#D4AF37]/15 rounded-lg">
            <span>VIP المتميزين: </span>
            <span className="font-mono">{(guests || []).filter(g => g.isVIP).length}</span>
          </div>
          <div className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <span>المسجلين كلياً: </span>
            <span className="font-mono">{(guests || []).length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Guest List Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredGuests.map((guest) => (
              <div
                key={guest.id}
                onClick={() => setSelectedGuest(guest)}
                className={`bg-white border border-gray-200 rounded-xl p-5 hover:border-[#D4AF37]/30 transition-all duration-300 cursor-pointer flex flex-col justify-between h-52 relative group ${
                  selectedGuest?.id === guest.id ? 'ring-1 ring-[#D4AF37] border-transparent shadow-[0_0_20px_rgba(212,175,55,0.15)]' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <img
                      src={guest.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                      alt={guest.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full border border-gray-200 object-cover"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 group-hover:text-[#AA7B30] transition">{guest.name}</h3>
                      <span className="text-xs text-gray-500 block mt-0.5">{guest.nationality} • {guest.phone}</span>
                    </div>
                  </div>

                  {guest.isVIP && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-extrabold bg-amber-50/40 text-[#D4AF37] border border-[#D4AF37]/20">
                      <Award size={10} className="fill-[#D4AF37]" />
                      <span>VIP فاخر</span>
                    </span>
                  )}
                </div>

                {/* Notes summary */}
                <p className="text-sm text-gray-400 leading-relaxed font-bold line-clamp-2 mt-3 mb-4 bg-gray-50/50 p-2.5 rounded-lg">
                  {guest.notes}
                </p>

                {/* Footer stays count */}
                <div className="border-t border-gray-200/60 pt-3 flex justify-between items-center text-xs">
                  <span className="text-gray-500 flex items-center gap-1">
                    <History size={12} />
                    <span>إجمالي الزيارات السابقة: <strong className="text-gray-800 font-mono">{guest.stayCount}</strong></span>
                  </span>
                  <span className="text-[#D4AF37] hover:underline font-bold">الملف المالي والتاريخي ←</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Guest Detailed Panel */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xl h-fit space-y-6">
          {selectedGuest ? (
            <>
              {/* Profile Card Header */}
              <div className="text-center space-y-3 pb-5 border-b border-gray-200">
                <img
                  src={selectedGuest.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                  alt={selectedGuest.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-full border-2 border-[#D4AF37] mx-auto object-cover"
                />
                <div>
                  <h2 className="text-lg font-bold text-[#AA7B30]">{selectedGuest.name}</h2>
                  <p className="text-xs text-gray-400">{selectedGuest.nationality} • عضو ذهبي متميز</p>
                </div>
                {selectedGuest.isVIP && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50/40 text-[#D4AF37] border border-[#D4AF37]/30 rounded-full text-xs font-bold">
                    <Award size={13} className="fill-[#D4AF37]" />
                    <span>حالة ضيافة خاصة VIP</span>
                  </div>
                )}
              </div>

              {/* Contacts info */}
              <div className="space-y-3.5 text-xs">
                <h3 className="font-bold text-gray-400">معلومات الاتصال المشفرة:</h3>
                
                <div className="flex items-center gap-2.5 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <Phone size={14} className="text-[#D4AF37]" />
                  <div>
                    <span className="text-gray-500 block text-xs">رقم الجوال</span>
                    <span className="text-gray-700 font-mono">{selectedGuest.phone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <Mail size={14} className="text-[#D4AF37]" />
                  <div>
                    <span className="text-gray-500 block text-xs">البريد الإلكتروني المهني</span>
                    <span className="text-gray-700 font-mono">{selectedGuest.email}</span>
                  </div>
                </div>
              </div>

              {/* Guest preferences notes */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                  <FileText size={13} className="text-amber-600" />
                  <span>توصيات خاصة بالنزيل لجميع الموظفين:</span>
                </h3>
                <div className="p-3 bg-amber-50/5 border border-[#D4AF37]/15 rounded-xl text-xs text-amber-200 leading-relaxed font-bold">
                  {selectedGuest.notes}
                </div>
              </div>

              {/* Reservations history list */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                  <History size={13} className="text-blue-600" />
                  <span>تاريخ وسجلات الإقامة بالفندق:</span>
                </h3>
                <div className="space-y-2">
                  {(reservations || []).filter(res => res.guestName === selectedGuest.name).map((res) => (
                    <div key={res.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">جناح رقم {res.roomNumber}</span>
                        <span className="text-xs text-gray-500 font-mono block mt-0.5">{res.checkIn} ── {res.checkOut}</span>
                      </div>
                      <span className="text-xs font-bold font-mono text-[#AA7B30]">{res.amount.toLocaleString('ar-SA', { maximumFractionDigits: 0 })} ريال</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 space-y-3">
              <Users size={48} className="text-gray-700 mx-auto" />
              <p className="text-sm font-bold text-gray-400">حدد نزيلاً من القائمة لعرض تفاصيل إقامته الكاملة وسجله التاريخي هنا</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

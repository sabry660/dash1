import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  User, Plus, Search, XCircle, AlertCircle, X, Save, Loader2, Trash2
} from 'lucide-react';
import { apiService, UserResponse, CreateUserRequest } from '../services/api';

export default function UsersManagementSection() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);

  // New User Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'MANAGER' | 'STAFF' | 'CHEF' | 'BARISTA' | 'ROOM_SERVICE'>('STAFF');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.getUsers(0, 50);
      setUsers(response.content || []);
    } catch (error: any) {
      if (error.message && error.message.includes('Access denied')) {
        setError('ليس لديك صلاحية للوصول إلى إدارة المستخدمين. يرجى التواصل مع المسؤول.');
      } else if (error.message && error.message.includes('NetworkError')) {
        setError('فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.');
      } else {
        setError('فشل تحميل المستخدمين. الرجاء المحاولة مرة أخرى.');
      }
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!username || !password || !role) {
      alert('الرجاء تعبئة جميع الحقول المطلوبة');
      return;
    }

    setIsCreatingUser(true);
    setCreateUserError(null);

    try {
      const newUser: CreateUserRequest = {
        username,
        password,
        role,
      };

      await apiService.createUser(newUser);

      // Reset form
      setUsername('');
      setPassword('');
      setRole('STAFF');
      setIsModalOpen(false);

      // Reload users
      loadUsers();
    } catch (error: any) {
      if (error.message && error.message.includes('Access denied')) {
        setCreateUserError('ليس لديك صلاحية لإنشاء المستخدمين. يرجى التواصل مع المسؤول.');
      } else if (error.message && error.message.includes('NetworkError')) {
        setCreateUserError('فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.');
      } else {
        setCreateUserError('فشل إنشاء المستخدم. الرجاء المحاولة مرة أخرى.');
      }
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

    try {
      await apiService.deleteUser(userId);
      loadUsers();
    } catch (error: any) {
      if (error.message && error.message.includes('Access denied')) {
        alert('ليس لديك صلاحية لحذف المستخدمين. يرجى التواصل مع المسؤول.');
      } else if (error.message && error.message.includes('NetworkError')) {
        alert('فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.');
      } else {
        alert('فشل حذف المستخدم. الرجاء المحاولة مرة أخرى.');
      }
    }
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: { [key: string]: string } = {
      'MANAGER': 'مدير',
      'STAFF': 'موظف',
      'CHEF': 'شيف',
      'BARISTA': 'باريستا',
      'ROOM_SERVICE': 'خدمة الغرف'
    };
    return roleLabels[role] || role;
  };

  // Filter users based on search
  const filteredUsers = (users || []).filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-[#AA7B30]">إدارة المستخدمين</h1>
          <p className="text-gray-500 text-xs mt-1">عرض وإدارة حسابات المستخدمين في النظام</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#AA7B30] to-[#D4AF37] hover:from-[#C59740] hover:to-[#D4AF37] text-black font-extrabold text-xs rounded-xl shadow-lg transition duration-200"
        >
          <Plus size={15} />
          <span>إضافة مستخدم</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white border border-gray-200 p-4 rounded-xl">
        <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="بحث بالاسم أو الدور..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-lg px-4 py-2 pr-10 text-xs text-gray-800 focus:outline-none w-48"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="text-[#D4AF37] animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
          <XCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-gray-400 mb-2">فشل تحميل المستخدمين</h3>
          <p className="text-xs text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadUsers}
            className="px-4 py-2 bg-[#D4AF37] text-black font-extrabold text-xs rounded-xl"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
          <AlertCircle size={48} className="text-gray-500 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-gray-400 mb-2">لا يوجد مستخدمين</h3>
          <p className="text-xs text-gray-600 mb-4">ابدأ بإضافة مستخدم جديد</p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-xs text-gray-500 font-bold text-right pb-3">المعرف</th>
                <th className="text-xs text-gray-500 font-bold text-right pb-3">اسم المستخدم</th>
                <th className="text-xs text-gray-500 font-bold text-right pb-3">الدور</th>
                <th className="text-xs text-gray-500 font-bold text-right pb-3">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-200/50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 text-sm text-gray-800">{user.id}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-lg flex items-center justify-center">
                        <User size={14} className="text-[#AA7B30]" />
                      </div>
                      <span className="text-sm text-gray-800 font-bold">{user.username}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      user.role === 'MANAGER' ? 'bg-blue-50/20 text-blue-600 border border-blue-500/30' :
                      user.role === 'STAFF' ? 'bg-emerald-50/20 text-emerald-600 border border-emerald-500/30' :
                      user.role === 'CHEF' ? 'bg-orange-950/20 text-orange-400 border border-orange-500/30' :
                      user.role === 'BARISTA' ? 'bg-amber-50/20 text-amber-600 border border-amber-500/30' :
                      user.role === 'ROOM_SERVICE' ? 'bg-purple-50/20 text-purple-600 border border-purple-500/30' :
                      'bg-gray-800 text-gray-400 border border-gray-700'
                    }`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg hover:border-red-500/30 transition"
                        title="حذف"
                      >
                        <Trash2 size={14} className="text-gray-400 hover:text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D4AF37]/30 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#AA7B30]">إضافة مستخدم جديد</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 border border-gray-200 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {createUserError && (
              <div className="bg-red-50/40 border border-red-500/30 text-red-200 text-sm p-3 rounded-lg mb-4">
                {createUserError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 block mb-2">اسم المستخدم</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-2">كلمة المرور</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-2">الدور</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none"
                >
                  <option value="MANAGER">مدير</option>
                  <option value="STAFF">موظف</option>
                  <option value="CHEF">شيف</option>
                  <option value="BARISTA">باريستا</option>
                  <option value="ROOM_SERVICE">خدمة الغرف</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-400 rounded-xl text-xs font-bold hover:text-gray-800 transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleCreateUser}
                  disabled={isCreatingUser}
                  className="px-6 py-2 bg-gradient-to-r from-[#AA7B30] to-[#D4AF37] text-black font-extrabold text-xs rounded-xl shadow hover:shadow-lg transition duration-200 flex items-center gap-2 disabled:opacity-50"
                >
                  {isCreatingUser ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      حفظ المستخدم
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

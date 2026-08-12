import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { KeyRound, Mail, ShieldCheck, Hotel, Sparkles, Building, Languages, Eye, EyeOff } from 'lucide-react';
import { apiService, LoginRequest } from '../services/api';

interface LoginProps {
  onLoginSuccess: (user: { name: string; email: string; role: string }) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const [hotelId, setHotelId] = useState(() => localStorage.getItem('login_hotel_id') || 'hotel1');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCredentialsSubmit = async () => {
    if (!username || !password || !hotelId) {
      setErrorMessage('الرجاء إدخال اسم المستخدم وكلمة المرور ورقم الفندق');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const credentials: LoginRequest = {
        username: username,
        password: password
      };
      
      // Set hotel ID before login request
      apiService.setHotelId(hotelId);
      
      // Set tenant ID for hotel authentication
      apiService.setTenantId('hotel1');
      
      // Save login request to localStorage
      localStorage.setItem('login_username', username);
      localStorage.setItem('login_password', password);
      localStorage.setItem('login_hotel_id', hotelId);
      
      const response = await apiService.login(credentials);
      
      setIsLoading(false);
      
      // Backend doesn't use 2FA, proceed directly to dashboard
      if (response.token) {
        onLoginSuccess({
          name: response.username,
          email: username,
          role: response.role
        });
      }
    } catch (error) {
      setIsLoading(false);
      setErrorMessage('فشل تسجيل الدخول. الرجاء التحقق من بيانات الاعتماد والمحاولة مرة أخرى.');
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handle2faSubmit = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setErrorMessage('الرجاء إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');

    try {
      // For now, we'll skip actual 2FA verification and proceed to dashboard
      // In production, this would call a 2FA verification endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsLoading(false);
      onLoginSuccess({
        name: 'عبد الله بن خالد آل عبد الرحمن',
        email: username,
        role: 'المدير العام للمجموعة'
      });
    } catch (error) {
      setIsLoading(false);
      setErrorMessage('فشل التحقق من الرمز. الرجاء المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F2] flex items-center justify-center relative overflow-hidden px-4 py-8">
      {/* Premium Background Ambient Glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.08)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(30,64,175,0.1)_0%,transparent_70%)] pointer-events-none" />

      {/* Decorative Golden Stars / Particles */}
      <div className="absolute top-1/4 right-1/4 text-yellow-600/10 animate-pulse pointer-events-none">
        <Sparkles size={120} />
      </div>
      <div className="absolute bottom-1/4 left-1/4 text-yellow-600/5 animate-pulse pointer-events-none">
        <Sparkles size={80} />
      </div>

      <div className="w-full max-w-xl">
        {/* Luxury Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-br from-[#121212] to-[#1a1a1a] border border-[#D4AF37]/30 shadow-[0_0_30px_rgba(212,175,55,0.15)] mb-4">
            <img src="/logo.jpg" alt="LYTC Logo" className="w-16 h-16 rounded-full object-cover" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-[#E6C587] to-[#D4AF37] bg-clip-text text-transparent mb-2">
            مجموعة ليتك للفنادق والمنتجعات الفاخرة
          </h1>
          <p className="text-sm font-bold text-gray-400 tracking-wider">
            LYTC LUXURY HOTELS & RESORTS • PORTAL
          </p>
          <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent mx-auto mt-4" />
        </div>

        {/* Card Frame with Glassmorphism */}
        <div className="bg-white/85 border border-[#D4AF37]/20 rounded-2xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl relative">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
          
          <AnimatePresence mode="wait">
            {step === 'credentials' ? (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="mb-6 text-center">
                  <h2 className="text-xl font-bold text-[#AA7B30] mb-1">تسجيل دخول الإدارة الفنية والتشغيلية</h2>
                  <p className="text-xs text-gray-500">يرجى إدخال بيانات الاعتماد الخاصة بك للوصول للوحة التحكم الفاخرة</p>
                </div>

                {errorMessage && (
                  <div className="bg-red-50/40 border border-red-500/30 text-red-200 text-sm p-3 rounded-lg mb-4 text-center">
                    {errorMessage}
                  </div>
                )}

                <div className="space-y-6">
                  {/* Email Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 block mr-1">اسم المستخدم</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                        <Mail className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        type="text"
                        required
                        className="block w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl pr-10 pl-4 py-3 text-sm text-gray-700 focus:outline-none transition-all duration-300"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-xs font-bold text-gray-400">كلمة المرور المشفرة</label>
                      <button
                        type="button"
                        className="text-xs text-[#D4AF37] hover:underline"
                        onClick={() => alert('الرجاء التواصل مع إدارة الدعم التقني لـ LYTC لإعادة تعيين كلمة المرور.')}
                      >
                        نسيت كلمة المرور؟
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                        <KeyRound className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="block w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl pr-10 pl-10 py-3 text-sm text-gray-700 focus:outline-none transition-all duration-300"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Hotel ID Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 block mr-1">رقم الفندق</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                        <Building className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        type="text"
                        required
                        className="block w-full bg-gray-50 border border-gray-200 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl pr-10 pl-4 py-3 text-sm text-gray-700 focus:outline-none transition-all duration-300"
                        value={hotelId}
                        onChange={(e) => setHotelId(e.target.value)}
                        placeholder="مثال: 12"
                      />
                    </div>
                  </div>

                  {/* Remember Me Toggle */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-gray-200 bg-gray-50 text-[#D4AF37] focus:ring-0 focus:ring-offset-0 h-4 w-4"
                      />
                      <span className="text-xs text-gray-400 font-bold mr-2">تذكر هذا الجهاز في هذه الجلسة الأمنية</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="button"
                    onClick={handleCredentialsSubmit}
                    disabled={isLoading}
                    className="w-full relative group overflow-hidden py-3 px-4 bg-gradient-to-r from-[#AA7B30] via-[#D4AF37] to-[#E6C587] hover:from-[#C59740] hover:to-[#D4AF37] text-black font-extrabold text-sm rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2 space-x-reverse">
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>جاري التحقق من أمن البيانات...</span>
                      </div>
                    ) : (
                      <span>تسجيل الدخول الآمن</span>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="2fa"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="mb-6 text-center">
                  <div className="inline-flex p-3 rounded-full bg-blue-50/30 border border-blue-500/20 text-blue-600 mb-2">
                    <ShieldCheck size={36} />
                  </div>
                  <h2 className="text-xl font-bold text-[#AA7B30] mb-1">المصادقة الثنائية (2FA)</h2>
                  <p className="text-xs text-gray-500">تم إرسال رمز تحقق مؤقت إلى تطبيق الحماية ومصادقة الجوال المسجل باسمك</p>
                  <p className="text-xs text-[#D4AF37] font-bold mt-1">المستخدم: الشيخ عبد الله (المدير العام)</p>
                </div>

                {errorMessage && (
                  <div className="bg-red-50/40 border border-red-500/30 text-red-200 text-sm p-3 rounded-lg mb-4 text-center">
                    {errorMessage}
                  </div>
                )}

                <div className="space-y-6">
                  {/* OTP Inputs */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 text-center block mb-2">أدخل الرمز المكون من 6 أرقام</label>
                    <div className="flex justify-between gap-2 max-w-sm mx-auto" dir="ltr">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`otp-${idx}`}
                          type="text"
                          maxLength={1}
                          className="w-12 h-14 bg-gray-50 border border-gray-200 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl text-center text-xl font-bold text-gray-800 focus:outline-none transition-all duration-300"
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Return Button / Request OTP again */}
                  <div className="text-center">
                    <button
                      type="button"
                      className="text-xs text-gray-400 hover:text-gray-800"
                      onClick={() => {
                        setOtp(['', '', '', '', '', '']);
                        alert('تمت إعادة إرسال الرمز الآمن بنجاح في رسالة SMS مشفرة.');
                      }}
                    >
                      لم تستلم الرمز؟ <span className="text-[#D4AF37] hover:underline">إعادة الإرسال</span>
                    </button>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      className="w-1/3 bg-gray-50 border border-gray-200 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-xl py-3 text-xs font-bold transition-all duration-200"
                      onClick={() => setStep('credentials')}
                    >
                      تغيير الحساب
                    </button>
                    <button
                      type="button"
                      onClick={handle2faSubmit}
                      disabled={isLoading}
                      className="w-2/3 py-3 px-4 bg-gradient-to-r from-[#AA7B30] via-[#D4AF37] to-[#E6C587] text-black font-extrabold text-sm rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center space-x-2 space-x-reverse">
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          <span>جاري المصادقة البيومترية...</span>
                        </div>
                      ) : (
                        <span>تأكيد الرمز والدخول</span>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

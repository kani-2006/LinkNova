import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link2, ArrowRight, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Login = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    setLoading(true);

    const localErrors = {};
    if (!email) localErrors.email = 'Email is required';
    if (!password) localErrors.password = 'Password is required';
    
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      setLoading(false);
      return;
    }

    try {
      const result = await login(email, password);
      if (!result.success) {
        const backendErrors = {};
        let hasFieldErrors = false;
        
        result.errors.forEach(err => {
          if (err.field) {
            backendErrors[err.field] = err.message;
            hasFieldErrors = true;
          }
        });

        if (hasFieldErrors) {
          setErrors(backendErrors);
        } else {
          setGeneralError(result.errors[0]?.message || 'Invalid email or password');
        }
      }
    } catch (err) {
      setGeneralError('Failed to connect to the authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-6 w-full animate-slide-up">
      <div className="grid grid-cols-1 md:grid-cols-2 w-full max-w-5xl bg-[#FFFFFF] border border-[#E2E8F0] rounded-3xl shadow-card overflow-hidden min-h-[580px]">
        
        {/* Left Side: Product Illustration & Testimonial */}
        <div className="bg-[#F8FAFC] border-r border-[#E2E8F0] p-12 flex flex-col justify-between hidden md:flex select-none">
          <div className="flex items-center gap-2.5 font-extrabold text-xl tracking-tight text-[#0F172A]">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#4F46E5] text-white shadow-sm shadow-indigo-150">
              <Link2 className="w-5 h-5" />
            </div>
            <span>LinkNova</span>
          </div>
          
          {/* SVG Dashboard Product Illustration */}
          <div className="my-8 flex justify-center items-center">
            <svg width="280" height="190" viewBox="0 0 280 190" fill="none" className="drop-shadow-md">
              <rect width="280" height="190" rx="16" fill="white" stroke="#E2E8F0" strokeWidth="2" />
              {/* Top bar */}
              <rect x="12" y="12" width="256" height="24" rx="6" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
              <circle cx="24" cy="24" r="4" fill="#EF4444" />
              <circle cx="34" cy="24" r="4" fill="#F59E0B" />
              <circle cx="44" cy="24" r="4" fill="#10B981" />
              <rect x="62" y="20" width="80" height="8" rx="4" fill="#E2E8F0" />
              
              {/* Analytics graph mock */}
              <path d="M 30 140 Q 70 80, 110 110 T 190 70 T 250 100" fill="none" stroke="#4F46E5" strokeWidth="3" strokeLinecap="round" />
              <path d="M 30 140 Q 70 80, 110 110 T 190 70 T 250 100 L 250 150 L 30 150 Z" fill="url(#blue-grad)" opacity="0.1" />
              
              {/* Grid Lines */}
              <line x1="30" y1="150" x2="250" y2="150" stroke="#E2E8F0" strokeWidth="1.5" />
              <line x1="30" y1="120" x2="250" y2="120" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="30" y1="90" x2="250" y2="90" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="30" y1="60" x2="250" y2="60" stroke="#F1F5F9" strokeWidth="1" />
              
              {/* Bar elements */}
              <rect x="40" y="150" width="12" height="0" rx="2" fill="#E2E8F0" transform="scale(1, -1) translate(0, -150)" />
              <rect x="75" y="150" width="12" height="35" rx="2" fill="#818CF8" transform="scale(1, -1) translate(0, -150)" />
              <rect x="110" y="150" width="12" height="20" rx="2" fill="#E2E8F0" transform="scale(1, -1) translate(0, -150)" />
              <rect x="145" y="150" width="12" height="55" rx="2" fill="#4F46E5" transform="scale(1, -1) translate(0, -150)" />
              <rect x="180" y="150" width="12" height="40" rx="2" fill="#818CF8" transform="scale(1, -1) translate(0, -150)" />
              
              {/* Floating QR Card */}
              <g filter="drop-shadow(0px 8px 16px rgba(15,23,42,0.06))">
                <rect x="170" y="95" width="90" height="75" rx="12" fill="white" stroke="#E2E8F0" strokeWidth="1.5" />
                {/* QR graphic */}
                <rect x="180" y="105" width="30" height="30" rx="4" fill="#F1F5F9" />
                <rect x="184" y="109" width="8" height="8" fill="#4F46E5" />
                <rect x="200" y="121" width="6" height="6" fill="#4F46E5" />
                <rect x="184" y="121" width="6" height="6" fill="#0F172A" />
                <rect x="200" y="109" width="6" height="6" fill="#0F172A" />
                {/* Text lines */}
                <rect x="180" y="144" width="70" height="5" rx="2.5" fill="#E2E8F0" />
                <rect x="180" y="153" width="50" height="5" rx="2.5" fill="#4F46E5" />
              </g>

              <defs>
                <linearGradient id="blue-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" />
                  <stop offset="100%" stopColor="#FFFFFF" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="space-y-4">
            <p className="text-base font-medium leading-relaxed text-[#0F172A] italic">
              "LinkNova replaced three separate tools for us. Generating customizable short links, monitoring demographics, and retrieving local QR codes is incredibly fast."
            </p>
            <div>
              <p className="font-bold text-sm text-[#0F172A]">Marcus Vance</p>
              <p className="text-[#64748B] text-xs">Principal Engineer at HyperScale</p>
            </div>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="p-10 md:p-14 flex flex-col justify-center bg-[#FFFFFF]">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight font-sans">Welcome back</h2>
            <p className="text-sm text-[#64748B] mt-1.5 font-medium">Log in to your dashboard to customize and track links</p>
          </div>

          {generalError && (
            <div className="bg-red-50 border border-red-200/60 rounded-2xl px-4 py-3 text-red-600 text-xs mb-5 text-center font-semibold animate-shake">
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2" htmlFor="login-email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                <input
                  id="login-email"
                  type="email"
                  className={`w-full bg-[#FFFFFF] border ${errors.email ? 'border-red-400 focus:border-red-500' : 'border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]'} rounded-xl pl-11 pr-4 py-2.5 outline-none transition-all duration-200 text-sm`}
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              {errors.email && <span className="block text-red-500 text-xs mt-1.5 font-medium">{errors.email}</span>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider" htmlFor="login-password">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert('Password recovery API is not configured. Please contact the administrator.')}
                  className="text-xs font-semibold text-[#4F46E5] hover:underline bg-transparent border-none p-0 cursor-pointer"
                  tabIndex="-1"
                >
                  Forgot password?
                </button>
              </div>
              
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full bg-[#FFFFFF] border ${errors.password ? 'border-red-400 focus:border-red-500' : 'border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]'} rounded-xl pl-11 pr-11 py-2.5 outline-none transition-all duration-200 text-sm`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] hover:text-[#0F172A] cursor-pointer outline-none"
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <span className="block text-red-500 text-xs mt-1.5 font-medium">{errors.password}</span>}
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-[#4F46E5] border-[#E2E8F0] rounded focus:ring-[#4F46E5] cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 text-xs font-semibold text-[#64748B] cursor-pointer select-none">
                Remember my login sessions
              </label>
            </div>

            <button
              type="submit"
              className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl text-sm transition-all duration-200 cursor-pointer shadow-sm shadow-indigo-100 disabled:opacity-50 mt-2"
              disabled={loading}
            >
              <span>{loading ? 'Authenticating credentials...' : 'Log In to LinkNova'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="text-center text-xs text-[#64748B] mt-8 font-semibold">
            New to LinkNova?{' '}
            <button 
              type="button"
              onClick={onSwitchToRegister} 
              className="text-[#4F46E5] font-bold hover:underline bg-transparent border-none p-0 cursor-pointer"
            >
              Create an account free
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

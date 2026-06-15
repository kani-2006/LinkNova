import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link2, ArrowRight, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Register = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password strength logic
  const checkPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-100' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++;
    if (/[^a-zA-Z0-9]/.test(pass)) score++;

    if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500', textClass: 'text-red-500' };
    if (score <= 3) return { score, label: 'Fair', color: 'bg-amber-500', textClass: 'text-amber-500' };
    return { score, label: 'Strong', color: 'bg-emerald-500', textClass: 'text-emerald-500' };
  };

  const strength = checkPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    setSuccessMessage('');
    setLoading(true);

    const localErrors = {};
    if (!fullName) {
      localErrors.fullName = 'Full Name is required';
    } else if (fullName.trim().length < 3) {
      localErrors.fullName = 'Full Name must be at least 3 characters';
    }

    if (!email) {
      localErrors.email = 'Email is required';
    }

    if (!password) {
      localErrors.password = 'Password is required';
    } else if (password.length < 6) {
      localErrors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      localErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      setLoading(false);
      return;
    }

    // Generate unique username from name + email prefix for database compatibility
    const prefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    const suffix = Math.floor(100 + Math.random() * 900);
    const username = `${fullName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${prefix}_${suffix}`.slice(0, 30);

    try {
      const result = await register(username, email, password);
      if (result.success) {
        setSuccessMessage('Account created successfully! Redirecting...');
        
        // Sync full name updates to database after register is complete
        try {
          const token = localStorage.getItem('token');
          await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ fullName })
          });
        } catch (e) {
          console.error('Failed to sync fullName during registration:', e);
        }

      } else {
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
          setGeneralError(result.errors[0]?.message || 'Signup failed');
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
        
        {/* Left Side: Product Illustration */}
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
              <rect x="12" y="12" width="256" height="24" rx="6" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
              <circle cx="24" cy="24" r="4" fill="#EF4444" />
              <circle cx="34" cy="24" r="4" fill="#F59E0B" />
              <circle cx="44" cy="24" r="4" fill="#10B981" />
              <rect x="62" y="20" width="80" height="8" rx="4" fill="#E2E8F0" />
              
              <path d="M 30 140 Q 70 80, 110 110 T 190 70 T 250 100" fill="none" stroke="#4F46E5" strokeWidth="3" strokeLinecap="round" />
              <path d="M 30 140 Q 70 80, 110 110 T 190 70 T 250 100 L 250 150 L 30 150 Z" fill="url(#blue-grad)" opacity="0.1" />
              
              <line x1="30" y1="150" x2="250" y2="150" stroke="#E2E8F0" strokeWidth="1.5" />
              <line x1="30" y1="120" x2="250" y2="120" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="30" y1="90" x2="250" y2="90" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="30" y1="60" x2="250" y2="60" stroke="#F1F5F9" strokeWidth="1" />
              
              <rect x="40" y="150" width="12" height="0" rx="2" fill="#E2E8F0" transform="scale(1, -1) translate(0, -150)" />
              <rect x="75" y="150" width="12" height="35" rx="2" fill="#818CF8" transform="scale(1, -1) translate(0, -150)" />
              <rect x="110" y="150" width="12" height="20" rx="2" fill="#E2E8F0" transform="scale(1, -1) translate(0, -150)" />
              <rect x="145" y="150" width="12" height="55" rx="2" fill="#4F46E5" transform="scale(1, -1) translate(0, -150)" />
              <rect x="180" y="150" width="12" height="40" rx="2" fill="#818CF8" transform="scale(1, -1) translate(0, -150)" />
              
              <g filter="drop-shadow(0px 8px 16px rgba(15,23,42,0.06))">
                <rect x="170" y="95" width="90" height="75" rx="12" fill="white" stroke="#E2E8F0" strokeWidth="1.5" />
                <rect x="180" y="105" width="30" height="30" rx="4" fill="#F1F5F9" />
                <rect x="184" y="109" width="8" height="8" fill="#4F46E5" />
                <rect x="200" y="121" width="6" height="6" fill="#4F46E5" />
                <rect x="184" y="121" width="6" height="6" fill="#0F172A" />
                <rect x="200" y="109" width="6" height="6" fill="#0F172A" />
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
            <h3 className="text-xl font-bold tracking-tight text-[#0F172A]">Get Real-Time Analytics</h3>
            <ul className="space-y-3 text-[#64748B] text-xs font-semibold">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#4F46E5] rounded-full"></span>
                <span>Configure custom URL codes and tracking details</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#4F46E5] rounded-full"></span>
                <span>Monitor OS, browser, and geographic distributions</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#4F46E5] rounded-full"></span>
                <span>Generate and download scannable PNG QR codes</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="p-10 md:p-14 flex flex-col justify-center bg-[#FFFFFF]">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight font-sans">Create your account</h2>
            <p className="text-sm text-[#64748B] mt-1.5 font-medium">Join LinkNova free to manage and track shortened URLs</p>
          </div>

          {generalError && (
            <div className="bg-red-50 border border-red-200/60 rounded-2xl px-4 py-3 text-red-600 text-xs mb-4 text-center font-semibold animate-shake">
              {generalError}
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200/60 rounded-2xl px-4 py-3 text-emerald-600 text-xs mb-4 text-center font-semibold animate-fade-in">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1.5" htmlFor="register-name">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                <input
                  id="register-name"
                  type="text"
                  className={`w-full bg-[#FFFFFF] border ${errors.fullName ? 'border-red-400 focus:border-red-500' : 'border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]'} rounded-xl pl-11 pr-4 py-2.5 outline-none transition-all duration-200 text-sm`}
                  placeholder="Alex Rivera"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                />
              </div>
              {errors.fullName && <span className="block text-red-500 text-xs mt-1 font-medium">{errors.fullName}</span>}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1.5" htmlFor="register-email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                <input
                  id="register-email"
                  type="email"
                  className={`w-full bg-[#FFFFFF] border ${errors.email ? 'border-red-400 focus:border-red-500' : 'border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]'} rounded-xl pl-11 pr-4 py-2.5 outline-none transition-all duration-200 text-sm`}
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              {errors.email && <span className="block text-red-500 text-xs mt-1 font-medium">{errors.email}</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1.5" htmlFor="register-password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                  <input
                    id="register-password"
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
                {errors.password && <span className="block text-red-500 text-xs mt-1 font-medium">{errors.password}</span>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1.5" htmlFor="register-confirm">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                  <input
                    id="register-confirm"
                    type={showPassword ? 'text' : 'password'}
                    className={`w-full bg-[#FFFFFF] border ${errors.confirmPassword ? 'border-red-400 focus:border-red-500' : 'border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]'} rounded-xl pl-11 pr-4 py-2.5 outline-none transition-all duration-200 text-sm`}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                {errors.confirmPassword && <span className="block text-red-500 text-xs mt-1 font-medium">{errors.confirmPassword}</span>}
              </div>
            </div>

            {/* Password Strength Indicator Visualizer */}
            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1 h-1">
                  <div className={`h-full flex-grow rounded-sm transition-all duration-300 ${strength.score >= 1 ? strength.color : 'bg-[#F8FAFC]'}`}></div>
                  <div className={`h-full flex-grow rounded-sm transition-all duration-300 ${strength.score >= 2 ? strength.color : 'bg-[#F8FAFC]'}`}></div>
                  <div className={`h-full flex-grow rounded-sm transition-all duration-300 ${strength.score >= 4 ? strength.color : 'bg-[#F8FAFC]'}`}></div>
                </div>
                <div className="text-[10px] text-[#64748B] text-right font-semibold">
                  Password strength: <span className={`font-bold ${strength.textClass}`}>{strength.label}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl text-sm transition-all duration-200 cursor-pointer shadow-sm shadow-indigo-100 disabled:opacity-50 mt-3"
              disabled={loading}
            >
              <span>{loading ? 'Creating your account...' : 'Create Account'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="text-center text-xs text-[#64748B] mt-8 font-semibold">
            Already have an account?{' '}
            <button 
              type="button"
              onClick={onSwitchToLogin} 
              className="text-[#4F46E5] font-bold hover:underline bg-transparent border-none p-0 cursor-pointer"
            >
              Sign in instead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

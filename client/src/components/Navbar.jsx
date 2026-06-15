import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Link2, User, Settings, BarChart3, LogOut, ShieldCheck, 
  Bell, HelpCircle, Link as LinkIcon, Menu, X, ChevronDown
} from 'lucide-react';

const Navbar = ({ 
  currentPath, 
  navigate, 
  onTriggerLogout, 
  onOpenHelp, 
  setSettingsTab,
  userAvatar // base64 avatar URL if uploaded
}) => {
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleNav = (path) => {
    navigate(path);
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const handleSettingsNav = (tab) => {
    if (setSettingsTab) setSettingsTab(tab);
    navigate('/settings');
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const scrollToLinks = () => {
    navigate('/');
    setTimeout(() => {
      const el = document.getElementById('links-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const userInitials = (user?.fullName || user?.username || 'LN').slice(0, 2).toUpperCase();

  // Get active avatar from localStorage or fallback to initials
  const localAvatar = localStorage.getItem(`avatar_${user?._id}`) || userAvatar;

  return (
    <header className="sticky top-0 z-[800] w-full bg-[#FFFFFF]/80 backdrop-blur-md border-b border-[#E2E8F0] select-none">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand Logo */}
        <div 
          onClick={() => handleNav('/')} 
          className="flex items-center gap-2.5 font-extrabold text-lg tracking-tight text-[#0F172A] cursor-pointer select-none group"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#4F46E5] text-white shadow-sm shadow-indigo-150 transition-transform group-hover:scale-105">
            <Link2 className="w-5 h-5" />
          </div>
          <span className="font-sans font-extrabold text-base tracking-tight text-[#0F172A]">LinkNova</span>
        </div>

        {/* Center: Desktop Navigation Tabs */}
        {user && (
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => handleNav('/')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none bg-transparent cursor-pointer outline-none ${currentPath === '/' ? 'text-[#4F46E5] bg-[#EEF2FF]' : 'text-[#64748B] hover:text-[#0F172A]'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => handleNav('/analytics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none bg-transparent cursor-pointer outline-none ${currentPath === '/analytics' ? 'text-[#4F46E5] bg-[#EEF2FF]' : 'text-[#64748B] hover:text-[#0F172A]'}`}
            >
              Analytics
            </button>
            <button
              onClick={scrollToLinks}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none bg-transparent cursor-pointer text-[#64748B] hover:text-[#0F172A] outline-none"
            >
              My Links
            </button>
            <button
              onClick={() => handleNav('/profile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none bg-transparent cursor-pointer outline-none ${currentPath === '/profile' ? 'text-[#4F46E5] bg-[#EEF2FF]' : 'text-[#64748B] hover:text-[#0F172A]'}`}
            >
              Profile
            </button>
            <button
              onClick={() => handleSettingsNav('general')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none bg-transparent cursor-pointer outline-none ${currentPath === '/settings' ? 'text-[#4F46E5] bg-[#EEF2FF]' : 'text-[#64748B] hover:text-[#0F172A]'}`}
            >
              Settings
            </button>
          </nav>
        )}

        {/* Right: Avatar and Mobile Hamburger */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              {/* Profile Avatar trigger */}
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-[#E2E8F0] text-[#0F172A] font-bold text-xs cursor-pointer transition-all outline-none"
              >
                {localAvatar ? (
                  <img src={localAvatar} alt="avatar" className="w-6 h-6 rounded-lg object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 text-[#4F46E5] font-bold text-[10px] flex items-center justify-center border border-indigo-100">
                    {userInitials}
                  </div>
                )}
                <span className="max-w-[70px] truncate hidden sm:inline-block font-semibold">
                  {user?.fullName || user?.username}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
              </button>

              {/* Profile Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-60 bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl shadow-lg p-3 animate-slide-up text-[#0F172A] z-[900]">
                  {/* Profile Card inside dropdown */}
                  <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#E2E8F0] mb-2 px-1">
                    {localAvatar ? (
                      <img src={localAvatar} alt="avatar" className="w-9 h-9 rounded-xl object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#4F46E5] font-bold text-xs flex items-center justify-center shadow-sm flex-shrink-0 border border-indigo-100">
                        {userInitials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#0F172A] truncate">
                        {user?.fullName || user?.username}
                      </div>
                      <div className="text-[10px] text-[#64748B] truncate font-medium">{user?.email}</div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="space-y-0.5">
                    <button
                      onClick={() => handleNav('/profile')}
                      className="w-full inline-flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-[#F8FAFC] rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#0F172A] text-left border-none bg-transparent cursor-pointer outline-none"
                    >
                      <User className="w-3.5 h-3.5 text-[#4F46E5]" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => handleSettingsNav('general')}
                      className="w-full inline-flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-[#F8FAFC] rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#0F172A] text-left border-none bg-transparent cursor-pointer outline-none"
                    >
                      <Settings className="w-3.5 h-3.5 text-[#4F46E5]" />
                      <span>Account Settings</span>
                    </button>
                    <button
                      onClick={() => handleSettingsNav('security')}
                      className="w-full inline-flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-[#F8FAFC] rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#0F172A] text-left border-none bg-transparent cursor-pointer outline-none"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#4F46E5]" />
                      <span>Security Settings</span>
                    </button>
                    <button
                      onClick={() => handleSettingsNav('notifications')}
                      className="w-full inline-flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-[#F8FAFC] rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#0F172A] text-left border-none bg-transparent cursor-pointer outline-none"
                    >
                      <Bell className="w-3.5 h-3.5 text-[#4F46E5]" />
                      <span>Notifications</span>
                    </button>
                    <button
                      onClick={() => {
                        if (onOpenHelp) onOpenHelp();
                        setDropdownOpen(false);
                      }}
                      className="w-full inline-flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-[#F8FAFC] rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#0F172A] text-left border-none bg-transparent cursor-pointer outline-none"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>Help Center</span>
                    </button>
                    <button
                      onClick={() => {
                        onTriggerLogout();
                        setDropdownOpen(false);
                      }}
                      className="w-full inline-flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-red-50 text-red-500 rounded-lg text-xs font-bold text-left border-none bg-transparent cursor-pointer outline-none border-t border-[#E2E8F0] mt-1.5 pt-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            currentPath !== '/login' && currentPath !== '/register' && (
              <div className="hidden sm:flex items-center gap-2">
                <button 
                  onClick={() => navigate('/login')} 
                  className="px-3.5 py-1.5 border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] font-bold rounded-lg text-xs cursor-pointer transition-colors outline-none"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => navigate('/register')} 
                  className="px-3.5 py-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-lg text-xs cursor-pointer shadow-sm transition-colors outline-none"
                >
                  Get Started
                </button>
              </div>
            )
          )}

          {/* Mobile Hamburger menu */}
          {user && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1 bg-transparent hover:bg-[#F8FAFC] border-none text-[#64748B] hover:text-[#0F172A] rounded-lg cursor-pointer outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {user && mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E2E8F0] bg-[#FFFFFF] px-4 py-3 space-y-1 shadow-lg select-none">
          <button
            onClick={() => handleNav('/')}
            className="w-full inline-flex items-center gap-2.5 px-3 py-2 hover:bg-[#F8FAFC] text-left border-none bg-transparent rounded-lg text-xs font-bold text-[#64748B] hover:text-[#0F172A] outline-none"
          >
            Dashboard
          </button>
          <button
            onClick={() => handleNav('/analytics')}
            className="w-full inline-flex items-center gap-2.5 px-3 py-2 hover:bg-[#F8FAFC] text-left border-none bg-transparent rounded-lg text-xs font-bold text-[#64748B] hover:text-[#0F172A] outline-none"
          >
            Analytics
          </button>
          <button
            onClick={scrollToLinks}
            className="w-full inline-flex items-center gap-2.5 px-3 py-2 hover:bg-[#F8FAFC] text-left border-none bg-transparent rounded-lg text-xs font-bold text-[#64748B] hover:text-[#0F172A] outline-none"
          >
            My Links
          </button>
          <button
            onClick={() => handleNav('/profile')}
            className="w-full inline-flex items-center gap-2.5 px-3 py-2 hover:bg-[#F8FAFC] text-left border-none bg-transparent rounded-lg text-xs font-bold text-[#64748B] hover:text-[#0F172A] outline-none"
          >
            Profile
          </button>
          <button
            onClick={() => handleSettingsNav('general')}
            className="w-full inline-flex items-center gap-2.5 px-3 py-2 hover:bg-[#F8FAFC] text-left border-none bg-transparent rounded-lg text-xs font-bold text-[#64748B] hover:text-[#0F172A] outline-none"
          >
            Settings
          </button>
          <button
            onClick={() => {
              onTriggerLogout();
              setMobileMenuOpen(false);
            }}
            className="w-full inline-flex items-center gap-2.5 px-3 py-2 hover:bg-red-50 text-left border-none bg-transparent rounded-lg text-xs font-bold text-red-500 outline-none border-t border-[#E2E8F0] pt-2"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;

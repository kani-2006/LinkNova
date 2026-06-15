import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, ShieldCheck, Mail, Phone, Building, Key, ToggleLeft, 
  ToggleRight, Download, Trash2, Smartphone, ShieldAlert, CheckCircle2,
  Upload, Camera, Trash
} from 'lucide-react';

const Profile = ({ showToast, navigate, onAvatarUpdate }) => {
  const { user, setUser, authenticatedFetch, logout } = useAuth();

  // Profile forms
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [company, setCompany] = useState(user?.company || '');
  
  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Loading states
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Mock/State-based settings
  const [twoFactor, setTwoFactor] = useState(false);
  const [emailPref, setEmailPref] = useState('html'); 
  const [sessions, setSessions] = useState([]);
  
  // Modals / Warnings
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Avatar upload states
  const fileInputRef = useRef(null);
  const [avatar, setAvatar] = useState(localStorage.getItem(`avatar_${user?._id}`) || '');

  // Fetch active sessions & profile details
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await authenticatedFetch('/api/auth/sessions');
        const result = await res.json();
        if (result.success) {
          setSessions(result.data);
        }
      } catch (err) {
        console.error('Failed to load login sessions:', err);
      }
    };

    const fetchUserProfile = async () => {
      try {
        const res = await authenticatedFetch('/api/auth/profile');
        const result = await res.json();
        if (result.success) {
          setFullName(result.data.name || '');
          setEmail(result.data.email || '');
          setPhoneNumber(result.data.phoneNumber || '');
          setCompany(result.data.company || '');
          setUser({ 
            ...user, 
            ...result.data, 
            username: result.data.name || result.data.username || '', 
            fullName: result.data.name || result.data.fullName || '' 
          });
        }
      } catch (err) {
        console.error('Failed to load user info:', err);
      }
    };

    if (user) {
      fetchSessions();
      fetchUserProfile();
    }
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await authenticatedFetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phoneNumber, company })
      });
      const result = await res.json();
      if (result.success) {
        setUser({
          ...user,
          fullName: result.data.fullName,
          email: result.data.email,
          phoneNumber: result.data.phoneNumber,
          company: result.data.company
        });
        if (showToast) showToast('Profile details updated successfully!');
      } else {
        if (showToast) showToast(result.error || 'Failed to update profile.', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Network error updating profile.', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      if (showToast) showToast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      if (showToast) showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await authenticatedFetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const result = await res.json();
      if (result.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (showToast) showToast('Password updated successfully!');
      } else {
        if (showToast) showToast(result.error || 'Failed to change password.', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Network error updating password.', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await authenticatedFetch('/api/url/all');
      const result = await res.json();
      if (result.success) {
        const exportData = {
          user: {
            username: user.username,
            email: user.email,
            fullName: fullName,
            phoneNumber: phoneNumber,
            organization: company
          },
          exportedAt: new Date().toISOString(),
          urls: result.data
        };
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `linknova-profile-export-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        if (showToast) showToast('LinkNova account data exported successfully!');
      }
    } catch (err) {
      if (showToast) showToast('Failed to export link records.', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      const res = await authenticatedFetch('/api/auth/delete', {
        method: 'DELETE'
      });
      const result = await res.json();
      if (result.success) {
        logout();
        if (showToast) showToast('Your LinkNova account has been permanently deleted.', 'success');
        navigate('/');
      } else {
        if (showToast) showToast(result.error || 'Failed to delete account.', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Network error deleting account.', 'error');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  // Avatar Upload Handlers
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      if (showToast) showToast('Please select a valid image file.', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      if (showToast) showToast('Image size must be under 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result;
      localStorage.setItem(`avatar_${user?._id}`, base64Data);
      setAvatar(base64Data);
      if (onAvatarUpdate) onAvatarUpdate(base64Data);
      if (showToast) showToast('Avatar updated successfully!');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    localStorage.removeItem(`avatar_${user?._id}`);
    setAvatar('');
    if (onAvatarUpdate) onAvatarUpdate('');
    if (showToast) showToast('Avatar removed.');
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const userInitials = (fullName || user?.username || 'LN').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-8 pb-12 animate-fade-in select-none">
      {/* Header Profile Summary with avatar selector */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        
        {/* Avatar Upload Area */}
        <div className="relative group/avatar">
          {avatar ? (
            <img 
              src={avatar} 
              alt="Profile Avatar" 
              className="w-20 h-20 rounded-2xl object-cover shadow-sm border border-[#E2E8F0]"
            />
          ) : (
            <div className="w-20 h-20 bg-indigo-50 border border-indigo-100 text-[#4F46E5] font-bold text-2xl rounded-2xl flex items-center justify-center shadow-sm select-none">
              {userInitials}
            </div>
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />

          {/* Hover overlay for Upload */}
          <div 
            onClick={triggerFileInput}
            className="absolute inset-0 bg-[#0F172A]/70 text-white rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer text-[9px] font-bold gap-1"
          >
            <Camera className="w-4 h-4" />
            <span>Upload Photo</span>
          </div>
        </div>

        <div className="text-center sm:text-left space-y-1.5 flex-grow">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
            <h2 className="text-lg font-bold text-[#0F172A]">{fullName || user?.username || 'Pro Member'}</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-bold uppercase tracking-wider rounded-full border border-indigo-100/50 w-fit mx-auto sm:mx-0">
              Pro Member
            </span>
          </div>
          <p className="text-xs text-[#64748B]">
            Logged in as: <span className="font-mono text-[#0F172A] font-semibold">{user?.email}</span>
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-1.5">
            <button 
              onClick={triggerFileInput}
              className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors cursor-pointer border-none bg-transparent outline-none p-0"
            >
              Change picture
            </button>
            {avatar && (
              <>
                <span className="text-slate-300">|</span>
                <button 
                  onClick={handleRemoveAvatar}
                  className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors cursor-pointer border-none bg-transparent outline-none p-0"
                >
                  Remove picture
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: General Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-[#E2E8F0] pb-4">
              <User className="w-4 h-4 text-[#4F46E5]" />
              <h3 className="font-bold text-[#0F172A] text-sm">Personal Information</h3>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2" htmlFor="profile-fullname">
                    Full Name
                  </label>
                  <input
                    id="profile-fullname"
                    type="text"
                    className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl px-4 py-2.5 outline-none text-sm font-medium"
                    placeholder="Enter full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={profileLoading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2" htmlFor="profile-email-address">
                    Email Address
                  </label>
                  <input
                    id="profile-email-address"
                    type="email"
                    className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl px-4 py-2.5 outline-none text-sm font-medium"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={profileLoading}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2" htmlFor="profile-phone-num">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                    <input
                      id="profile-phone-num"
                      type="text"
                      className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl pl-11 pr-4 py-2.5 outline-none text-sm font-medium"
                      placeholder="+1 (555) 000-0000"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={profileLoading}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2" htmlFor="profile-organization">
                    Organization
                  </label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                    <input
                      id="profile-organization"
                      type="text"
                      className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl pl-11 pr-4 py-2.5 outline-none text-sm font-medium"
                      placeholder="Organization / Company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      disabled={profileLoading}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  disabled={profileLoading}
                >
                  {profileLoading ? 'Saving changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password form */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-[#E2E8F0] pb-4">
              <Key className="w-4 h-4 text-[#4F46E5]" />
              <h3 className="font-bold text-[#0F172A] text-sm">Change Password</h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2" htmlFor="profile-curr-pass">
                  Current Password
                </label>
                <input
                  id="profile-curr-pass"
                  type="password"
                  className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl px-4 py-2.5 outline-none text-sm"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={passwordLoading}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2" htmlFor="profile-new-pass">
                    New Password
                  </label>
                  <input
                    id="profile-new-pass"
                    type="password"
                    className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl px-4 py-2.5 outline-none text-sm"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={passwordLoading}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2" htmlFor="profile-confirm-pass">
                    Confirm New Password
                  </label>
                  <input
                    id="profile-confirm-pass"
                    type="password"
                    className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl px-4 py-2.5 outline-none text-sm"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={passwordLoading}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'Updating password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side Options: Login Activity, Preferences, and Actions */}
        <div className="space-y-6">
          
          {/* Preferences Section */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-[#0F172A] text-xs uppercase tracking-wider border-b border-[#E2E8F0] pb-2">Preferences</h4>
            
            {/* 2FA Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-[#0F172A] flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-[#4F46E5]" />
                  <span>Two Factor Auth</span>
                </div>
                <div className="text-[10px] text-[#64748B]">Enhance sign-in security</div>
              </div>
              <button 
                onClick={() => {
                  setTwoFactor(!twoFactor);
                  if (showToast) showToast(twoFactor ? 'Two-Factor Authentication deactivated' : 'Two-Factor Authentication activated successfully! (Mock)');
                }}
                className="cursor-pointer border-none bg-transparent outline-none p-0"
              >
                {twoFactor ? <ToggleRight className="w-9 h-9 text-[#4F46E5]" /> : <ToggleLeft className="w-9 h-9 text-[#64748B]" />}
              </button>
            </div>

            {/* Email format Pref */}
            <div className="flex items-center justify-between border-t border-[#E2E8F0]/60 pt-3">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-[#0F172A]">Email Format</div>
                <div className="text-[10px] text-[#64748B]">Choose HTML vs plain text</div>
              </div>
              <select
                value={emailPref}
                onChange={(e) => {
                  setEmailPref(e.target.value);
                  if (showToast) showToast('Email preferences updated.');
                }}
                className="bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#4F46E5] rounded-lg p-1.5 text-xs text-[#64748B] font-semibold cursor-pointer outline-none"
              >
                <option value="html">HTML Rich</option>
                <option value="text">Plain Text</option>
              </select>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-[#0F172A] text-xs uppercase tracking-wider border-b border-[#E2E8F0] pb-2">Login Activity</h4>
            <div className="space-y-3">
              {sessions.length > 0 ? sessions.map((s) => (
                <div key={s.id} className="flex justify-between items-start text-xs border-b border-slate-50 last:border-0 pb-2.5 last:pb-0">
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-semibold text-[#0F172A] truncate">{s.device}</div>
                    <div className="text-[10px] text-[#64748B] font-mono">{s.ip}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.isCurrent ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-[#64748B]'}`}>
                    {s.lastActive}
                  </span>
                </div>
              )) : (
                <div className="text-[10px] text-[#64748B] text-center">Loading login session data...</div>
              )}
            </div>
          </div>

          {/* Actions & Export / Account deletion */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-3">
            <h4 className="font-bold text-[#0F172A] text-xs uppercase tracking-wider border-b border-[#E2E8F0] pb-2">Account Actions</h4>
            
            <button
              onClick={handleExportData}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer transition-colors bg-white"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Data (JSON)</span>
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100/60 border border-red-100 text-red-500 hover:text-red-650 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete LinkNova Account</span>
            </button>
          </div>

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex justify-center items-center z-[1100] p-4 animate-fade-in">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4 animate-slide-up text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-50 border border-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-[#0F172A] text-base">Permanently delete account?</h3>
              <p className="text-[#64748B] text-xs leading-relaxed">
                This action is irreversible. All of your shortened URL codes, aliases, descriptions, and click telemetry charts will be destroyed.
              </p>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-grow py-2 px-3 border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-lg text-xs font-semibold text-[#64748B] cursor-pointer transition-colors"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="flex-grow py-2 px-3 bg-red-500 hover:bg-red-650 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm disabled:opacity-50"
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

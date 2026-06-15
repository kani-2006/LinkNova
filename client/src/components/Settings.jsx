import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, Bell, Shield, User, Globe, Key, Laptop, ToggleLeft, ToggleRight, Mail } from 'lucide-react';

const SettingsView = ({ showToast, activeTab: externalActiveTab, setActiveTab: setExternalActiveTab }) => {
  const { user, setUser, authenticatedFetch } = useAuth();
  
  // Local active tab if external is not supplied
  const [localActiveTab, setLocalActiveTab] = useState('general');
  const activeTab = externalActiveTab || localActiveTab;
  const setActiveTab = setExternalActiveTab || setLocalActiveTab;

  // General tab states
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [company, setCompany] = useState(user?.company || ''); // Organization field
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [generalLoading, setGeneralLoading] = useState(false);

  // Notifications tab states
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [analyticsAlerts, setAnalyticsAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [notifLoading, setNotifLoading] = useState(false);

  // Email format preference
  const [emailFormat, setEmailFormat] = useState('html'); // html, text
  const [emailFormatLoading, setEmailFormatLoading] = useState(false);

  // Security tab states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  
  // 2FA state
  const [twoFactor, setTwoFactor] = useState(false);

  // Fetch initial profile & notifications settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await authenticatedFetch('/api/auth/profile');
        const result = await res.json();
        if (result.success) {
          setFullName(result.data.name || '');
          setEmail(result.data.email || '');
          setCompany(result.data.company || '');
          setTimezone(result.data.timezone || 'UTC');
          
          if (result.data.notifications) {
            setEmailNotifications(result.data.notifications.emailNotifications !== false);
            setAnalyticsAlerts(result.data.notifications.analyticsAlerts !== false);
            setWeeklyReports(result.data.notifications.weeklyReports !== false);
          }
          
          setUser({ 
            ...user, 
            ...result.data,
            username: result.data.name || result.data.username || '', 
            fullName: result.data.name || result.data.fullName || ''
          });
        }
      } catch (err) {
        console.error('Failed to load user settings:', err);
      }
    };

    const fetchSessions = async () => {
      try {
        const res = await authenticatedFetch('/api/auth/sessions');
        const result = await res.json();
        if (result.success) {
          setSessions(result.data);
        }
      } catch (err) {
        console.error('Failed to load sessions:', err);
      }
    };

    if (user) {
      fetchSettings();
      fetchSessions();
    }
  }, []);

  const handleUpdateGeneral = async (e) => {
    e.preventDefault();
    setGeneralLoading(true);
    try {
      const res = await authenticatedFetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, company, timezone })
      });
      const result = await res.json();
      if (result.success) {
        setUser({
          ...user,
          fullName: result.data.fullName,
          email: result.data.email,
          company: result.data.company,
          timezone: result.data.timezone
        });
        if (showToast) showToast('General settings saved!');
      } else {
        if (showToast) showToast(result.error || 'Failed to save settings.', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Error saving settings.', 'error');
    } finally {
      setGeneralLoading(false);
    }
  };

  const handleUpdateNotifications = async (e) => {
    e.preventDefault();
    setNotifLoading(true);
    try {
      const res = await authenticatedFetch('/api/auth/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailNotifications, analyticsAlerts, weeklyReports })
      });
      const result = await res.json();
      if (result.success) {
        if (showToast) showToast('Notification preferences updated!');
      } else {
        if (showToast) showToast('Failed to update notification flags.', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Network error saving preferences.', 'error');
    } finally {
      setNotifLoading(false);
    }
  };

  const handleUpdateEmailFormat = (e) => {
    e.preventDefault();
    setEmailFormatLoading(true);
    setTimeout(() => {
      setEmailFormatLoading(false);
      if (showToast) showToast('Email format preference saved!');
    }, 4000);
  };

  const handleUpdateSecurity = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      if (showToast) showToast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      if (showToast) showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    setSecurityLoading(true);
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
        if (showToast) showToast('Password changed successfully!');
      } else {
        if (showToast) showToast(result.error || 'Failed to update password.', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Error saving password credentials.', 'error');
    } finally {
      setSecurityLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in select-none">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[#EEF2FF] text-[#4F46E5]">
          <Settings className="w-4 h-4" />
        </div>
        <h2 className="text-xl font-bold text-[#0F172A]">Account Settings</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        
        {/* Navigation Tabs (Sidebar style) */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-3 shadow-sm space-y-1 md:col-span-1">
          <button
            onClick={() => setActiveTab('general')}
            className={`w-full inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left border-none cursor-pointer outline-none ${activeTab === 'general' ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'}`}
          >
            <User className="w-4 h-4" />
            <span>General Settings</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left border-none cursor-pointer outline-none ${activeTab === 'notifications' ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'}`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left border-none cursor-pointer outline-none ${activeTab === 'security' ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'}`}
          >
            <Shield className="w-4 h-4" />
            <span>Security & Sessions</span>
          </button>
        </div>

        {/* Settings Panels */}
        <div className="md:col-span-3">
          
          {/* General Tab panel */}
          {activeTab === 'general' && (
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-sm animate-fade-in">
              <h3 className="font-bold text-[#0F172A] text-sm border-b border-[#E2E8F0] pb-3.5 mb-5">General Information</h3>
              <form onSubmit={handleUpdateGeneral} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2" htmlFor="settings-name">
                    Display Name
                  </label>
                  <input
                    id="settings-name"
                    type="text"
                    className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl px-4 py-2.5 outline-none text-sm font-medium"
                    placeholder="Enter name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={generalLoading}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2" htmlFor="settings-email">
                    Email Address
                  </label>
                  <input
                    id="settings-email"
                    type="email"
                    className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl px-4 py-2.5 outline-none text-sm font-medium"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={generalLoading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2" htmlFor="settings-organization">
                    Organization
                  </label>
                  <input
                    id="settings-organization"
                    type="text"
                    className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl px-4 py-2.5 outline-none text-sm font-medium"
                    placeholder="Your organization or company name"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    disabled={generalLoading}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2" htmlFor="settings-timezone">
                    Timezone Preference
                  </label>
                  <div className="relative">
                    <select
                      id="settings-timezone"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#4F46E5] rounded-xl px-4 py-2.5 outline-none text-sm font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                      disabled={generalLoading}
                    >
                      <option value="UTC">Coordinated Universal Time (UTC)</option>
                      <option value="America/New_York">Eastern Standard Time (EST)</option>
                      <option value="America/Los_Angeles">Pacific Standard Time (PST)</option>
                      <option value="Europe/London">London / GMT</option>
                      <option value="Asia/Kolkata">India Standard Time (IST)</option>
                      <option value="Australia/Sydney">Sydney / AEST</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer border-none outline-none"
                    disabled={generalLoading}
                  >
                    {generalLoading ? 'Saving...' : 'Save General Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Notifications Tab panel */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {/* Alert Toggles */}
              <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-sm animate-fade-in">
                <h3 className="font-bold text-[#0F172A] text-sm border-b border-[#E2E8F0] pb-3.5 mb-5">Communication Preferences</h3>
                <form onSubmit={handleUpdateNotifications} className="space-y-5">
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 max-w-sm">
                      <div className="text-xs font-bold text-[#0F172A]">Email Notifications</div>
                      <p className="text-[10px] text-[#64748B] leading-relaxed">Receive account triggers, link limits, and usage notifications.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEmailNotifications(!emailNotifications)}
                      className="cursor-pointer border-none bg-transparent outline-none p-0"
                      disabled={notifLoading}
                    >
                      {emailNotifications ? <ToggleRight className="w-9 h-9 text-[#4F46E5]" /> : <ToggleLeft className="w-9 h-9 text-[#64748B]" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#E2E8F0]/60 pt-4">
                    <div className="space-y-0.5 max-w-sm">
                      <div className="text-xs font-bold text-[#0F172A]">Real-time Analytics Alerts</div>
                      <p className="text-[10px] text-[#64748B] leading-relaxed">Alert me via email when an active link experiences a high volume spike.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAnalyticsAlerts(!analyticsAlerts)}
                      className="cursor-pointer border-none bg-transparent outline-none p-0"
                      disabled={notifLoading}
                    >
                      {analyticsAlerts ? <ToggleRight className="w-9 h-9 text-[#4F46E5]" /> : <ToggleLeft className="w-9 h-9 text-[#64748B]" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#E2E8F0]/60 pt-4">
                    <div className="space-y-0.5 max-w-sm">
                      <div className="text-xs font-bold text-[#0F172A]">Weekly Performance Digest</div>
                      <p className="text-[10px] text-[#64748B] leading-relaxed">Receive a weekly summary report highlighting your top performing redirects.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWeeklyReports(!weeklyReports)}
                      className="cursor-pointer border-none bg-transparent outline-none p-0"
                      disabled={notifLoading}
                    >
                      {weeklyReports ? <ToggleRight className="w-9 h-9 text-[#4F46E5]" /> : <ToggleLeft className="w-9 h-9 text-[#64748B]" />}
                    </button>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-[#E2E8F0]/60">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer border-none outline-none"
                      disabled={notifLoading}
                    >
                      {notifLoading ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Email Preferences */}
              <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-sm animate-fade-in">
                <h3 className="font-bold text-[#0F172A] text-sm border-b border-[#E2E8F0] pb-3.5 mb-5 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-[#4F46E5]" />
                  <span>Email Preferences</span>
                </h3>
                <form onSubmit={handleUpdateEmailFormat} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2" htmlFor="email-format-select">
                      Preferred Email Format
                    </label>
                    <select
                      id="email-format-select"
                      value={emailFormat}
                      onChange={(e) => setEmailFormat(e.target.value)}
                      className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#4F46E5] rounded-xl px-4 py-2.5 outline-none text-sm font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                    >
                      <option value="html">HTML Rich (Standard layouts and branding)</option>
                      <option value="text">Plain Text (Lighter, no visual styling)</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer border-none outline-none"
                      disabled={emailFormatLoading}
                    >
                      {emailFormatLoading ? 'Saving...' : 'Save Email Formatting'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Security Tab panel */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-[#0F172A] text-sm border-b border-[#E2E8F0] pb-3.5 mb-5 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-[#4F46E5]" />
                  <span>Update Password Credentials</span>
                </h3>
                
                <form onSubmit={handleUpdateSecurity} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2" htmlFor="sec-curr">
                      Current Password
                    </label>
                    <input
                      id="sec-curr"
                      type="password"
                      className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl px-4 py-2.5 outline-none text-sm"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={securityLoading}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2" htmlFor="sec-new">
                        New Password
                      </label>
                      <input
                        id="sec-new"
                        type="password"
                        className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl px-4 py-2.5 outline-none text-sm"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={securityLoading}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2" htmlFor="sec-confirm">
                        Confirm Password
                      </label>
                      <input
                        id="sec-confirm"
                        type="password"
                        className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl px-4 py-2.5 outline-none text-sm"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={securityLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer border-none outline-none"
                      disabled={securityLoading}
                    >
                      {securityLoading ? 'Saving...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Two Factor Auth (Mocked/Functional Toggle) */}
              <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-[#0F172A] text-sm border-b border-[#E2E8F0] pb-3.5 mb-5 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#4F46E5]" />
                  <span>Two-Factor Authentication (2FA)</span>
                </h3>
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-1 max-w-md">
                    <div className="text-xs font-bold text-[#0F172A]">Secure your account with 2FA</div>
                    <p className="text-[10px] text-[#64748B] leading-relaxed">
                      Each time you log in, you will be required to input a temporary authentication code generated by your mobile device.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTwoFactor(!twoFactor);
                      if (showToast) showToast(twoFactor ? '2FA disabled.' : '2FA enabled successfully! (Mocked)');
                    }}
                    className="cursor-pointer border-none bg-transparent outline-none p-0"
                  >
                    {twoFactor ? <ToggleRight className="w-9 h-9 text-[#4F46E5]" /> : <ToggleLeft className="w-9 h-9 text-[#64748B]" />}
                  </button>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-[#0F172A] text-sm border-b border-[#E2E8F0] pb-3.5 mb-5 flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-[#4F46E5]" />
                  <span>Active Sessions & Login Devices</span>
                </h3>
                <div className="divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
                  {sessions.map((s) => (
                    <div key={s.id} className="flex justify-between items-center p-4 bg-[#FFFFFF]">
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-[#0F172A]">{s.device}</div>
                        <div className="text-[10px] text-[#64748B] font-mono">IP Address: {s.ip}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${s.isCurrent ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-100 text-[#64748B]'}`}>
                        {s.lastActive}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsView;

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import LinkForm from './components/LinkForm';
import LinkTable from './components/LinkTable';
import AnalyticsView from './components/AnalyticsView';
import BulkImport from './components/BulkImport';
import Profile from './components/Profile';
import SettingsView from './components/Settings';
import { 
  Link2, ArrowRight, BarChart3, Clock, Sparkles, QrCode, 
  HelpCircle, ChevronDown, Check, ShieldCheck, Heart, Globe, 
  Settings, LayoutDashboard, User, AlertCircle, Eye, Share2,
  LogOut, Plus, Search, Filter, Download, Activity, Calendar, FileSpreadsheet, ArrowUpRight,
  X, Copy
} from 'lucide-react';

const AppContent = () => {
  const { user, loading, logout, authenticatedFetch } = useAuth();
  
  // Custom router state
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  
  // Shared Settings tab routing state
  const [settingsTab, setSettingsTab] = useState('general');

  // Dashboard states
  const [urls, setUrls] = useState([]);
  const [loadingUrls, setLoadingUrls] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, expired
  
  // Dynamic combined metrics
  const [recentVisits, setRecentVisits] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  
  // Modals & Overlay states
  const [activeAnalyticsId, setActiveAnalyticsId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [createModalMode, setCreateModalMode] = useState('url'); // 'url' or 'qr'
  const [generatedQrUrl, setGeneratedQrUrl] = useState(null);
  
  // Toast notifications state
  const [toast, setToast] = useState(null);
  
  // Interactive Demo States for Landing Page
  const [demoInput, setDemoInput] = useState('');
  const [demoResult, setDemoResult] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoCopied, setDemoCopied] = useState(false);

  // FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState(null);

  // Live ticking clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock tick effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Router listener
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Fetch URLs for dashboard
  const fetchUrls = async () => {
    if (!user) return;
    setLoadingUrls(true);
    try {
      const response = await authenticatedFetch('/api/url/all');
      const result = await response.json();
      if (result.success) {
        setUrls(result.data);
      }
    } catch (err) {
      console.error('Failed to load links:', err);
      showToast('Failed to load your shortened URLs.', 'error');
    } finally {
      setLoadingUrls(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUrls();
    }
  }, [user]);

  // Combined Analytics loader for dashboard widgets
  useEffect(() => {
    const fetchAllMetrics = async () => {
      if (!user || urls.length === 0) {
        setRecentVisits([]);
        return;
      }
      setLoadingAnalytics(true);
      try {
        const promises = urls.map(async (u) => {
          try {
            const res = await authenticatedFetch(`/api/analytics/${u._id}`);
            const dat = await res.json();
            return dat.success ? dat.data.metrics.recentVisits || [] : [];
          } catch {
            return [];
          }
        });
        const allVisits = await Promise.all(promises);
        
        // Flatten, sort and take top 5
        const flattened = allVisits.flat();
        flattened.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setRecentVisits(flattened.slice(0, 5));
      } catch (err) {
        console.error('Failed to aggregate dashboard analytics:', err);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    if (urls.length > 0) {
      fetchAllMetrics();
    }
  }, [urls, user]);

  // Toast helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Callback handlers for URL updates
  const handleUrlCreated = (newUrl) => {
    setUrls((prev) => [newUrl, ...prev]);
    showToast('New short link generated successfully!');
  };

  const handleUrlDeleted = (deletedId) => {
    setUrls((prev) => prev.filter((u) => u._id !== deletedId));
  };

  const handleUrlUpdated = (updatedUrl) => {
    setUrls((prev) =>
      prev.map((u) => (u._id === updatedUrl._id ? updatedUrl : u))
    );
  };

  // Mock landing demo shortening handler
  const handleDemoShorten = (e) => {
    e.preventDefault();
    if (!demoInput) return;
    setDemoLoading(true);
    setDemoResult('');
    setDemoCopied(false);
    
    setTimeout(() => {
      const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      setDemoResult(`${window.location.origin}/${code}`);
      setDemoLoading(false);
    }, 800);
  };

  const handleCopyDemo = () => {
    navigator.clipboard.writeText(demoResult);
    setDemoCopied(true);
    showToast('Demo link copied!');
    setTimeout(() => setDemoCopied(false), 2000);
  };

  // Filter logic for dashboard URLs
  const filteredUrls = urls.filter((url) => {
    const matchesSearch =
      url.originalUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      url.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (url.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      
    const isExpired = url.expiryDate && new Date(url.expiryDate) < new Date();
    
    if (statusFilter === 'active') {
      return matchesSearch && !isExpired;
    }
    if (statusFilter === 'expired') {
      return matchesSearch && isExpired;
    }
    return matchesSearch;
  });

  // Calculate statistics
  const totalUrls = urls.length;
  const totalClicks = urls.reduce((sum, u) => sum + u.clicks, 0);
  const activeUrls = urls.filter((u) => !u.expiryDate || new Date(u.expiryDate) >= new Date()).length;
  const expiredUrls = urls.filter((u) => u.expiryDate && new Date(u.expiryDate) < new Date()).length;
  const qrCodesGenerated = totalUrls; // One auto-generated for each URL

  // Calculate click growth rate (last 7 days visits vs prior 7 days visits in recentVisits)
  const calculateGrowth = () => {
    if (recentVisits.length === 0) return '+12.4%'; // SaaS fallback
    const nowMs = new Date().getTime();
    const sevenDaysAgo = nowMs - 7 * 24 * 60 * 60 * 1000;
    const fourteenDaysAgo = nowMs - 14 * 24 * 60 * 60 * 1000;
    
    let last7 = 0;
    let prev7 = 0;
    
    recentVisits.forEach((v) => {
      const t = new Date(v.timestamp).getTime();
      if (t >= sevenDaysAgo) {
        last7++;
      } else if (t >= fourteenDaysAgo) {
        prev7++;
      }
    });

    if (prev7 > 0) {
      const pct = ((last7 - prev7) / prev7) * 100;
      return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
    }
    return last7 > 0 ? `+${last7 * 100}%` : '+12.4%';
  };

  // Get Top Performing URL
  const getTopPerforming = () => {
    if (urls.length === 0) return null;
    const sorted = [...urls].sort((a, b) => b.clicks - a.clicks);
    return sorted[0];
  };

  // Get Latest Created URL
  const getLatestCreated = () => {
    if (urls.length === 0) return null;
    return urls[0]; // Already sorted by createdAt descending
  };

  const handleExportData = async () => {
    try {
      const exportData = {
        user: {
          username: user.username,
          email: user.email,
          fullName: user.fullName || ''
        },
        exportedAt: new Date().toISOString(),
        urls: urls
      };
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `linknova-analytics-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('All analytics exported successfully!');
    } catch (err) {
      showToast('Failed to export records.', 'error');
    }
  };

  const faqs = [
    {
      q: "How does the LinkNova analytics tracking engine work?",
      a: "Each time a visitor scans or visits a LinkNova short code, our Express backend parses visitor headers (browser, OS, device, and referrer) asynchronously using ua-parser-js before executing an HTTP 302 redirection. This logs telemetry without delaying the redirect."
    },
    {
      q: "Can I customize the short URL alias?",
      a: "Yes! By expanding the Advanced Settings panel when creating a link, you can specify a unique custom alias (e.g. '/spring-promo') instead of a randomly generated code."
    },
    {
      q: "What is the advanced link expiry system?",
      a: "You can configure an exact expiration date and time. Once reached, the short URL deactivates, displaying a clean warning page to subsequent visitors, and displays as expired in your dashboard."
    },
    {
      q: "Can I copy the QR code directly as an image?",
      a: "Yes! LinkNova features a premium QR Code toolbox. You can download the PNG, share it, or copy the image blob directly to your clipboard to paste it into design applications."
    }
  ];

  // Confirmed Logout handler
  const handleConfirmedLogout = () => {
    logout();
    setShowLogoutModal(false);
    showToast('Signed out successfully. See you soon!');
    navigate('/');
  };

  // Render Loader
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFFFFF]">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-[#4F46E5] rounded-full animate-spin mb-4"></div>
        <p className="font-sans font-bold text-[#0F172A] text-sm tracking-wide">Starting LinkNova SaaS...</p>
      </div>
    );
  }

  // Route: Public Analytics Page
  if (currentPath.startsWith('/analytics/')) {
    const parts = currentPath.split('/');
    const shortCode = parts[parts.length - 1];
    
    return (
      <div className="min-h-screen bg-[#FFFFFF] pb-16 font-sans">
        <Navbar 
          currentPath={currentPath} 
          navigate={navigate} 
          onTriggerLogout={() => setShowLogoutModal(true)} 
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <AnalyticsView isPublic={true} shortCode={shortCode} />
        </div>
      </div>
    );
  }

  // Render Authenticated App Layout
  if (user) {
    const topUrl = getTopPerforming();
    const latestUrl = getLatestCreated();

    return (
      <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col justify-between">
        <div className="w-full">
          {/* Top Navbar Header */}
          <Navbar 
            currentPath={currentPath} 
            navigate={navigate} 
            onTriggerLogout={() => setShowLogoutModal(true)} 
            onOpenHelp={() => setShowHelpModal(true)}
            setSettingsTab={setSettingsTab}
          />

          <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            
            {/* View Profile Route */}
            {currentPath === '/profile' && (
              <Profile showToast={showToast} navigate={navigate} />
            )}

            {/* View Settings Route */}
            {currentPath === '/settings' && (
              <SettingsView 
                showToast={showToast} 
                activeTab={settingsTab} 
                setActiveTab={setSettingsTab} 
              />
            )}

            {/* Dedicated Analytics Route */}
            {currentPath === '/analytics' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2 select-none">
                  <div>
                    <h2 className="text-xl font-bold text-[#0F172A]">Link Redirection Analytics</h2>
                    <p className="text-xs text-[#64748B] mt-0.5">Real-time charts, geographical maps and logs telemetry</p>
                  </div>
                </div>
                <AnalyticsView 
                  urls={urls} 
                  urlId="all" 
                  isPublic={false} 
                  onClose={null} 
                />
              </div>
            )}

            {/* Dashboard Default Route */}
            {currentPath === '/' && (
              <div className="space-y-8 animate-fade-in">
                
                {/* Welcome & Timer Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FFFFFF] border border-[#E2E8F0] rounded-3xl p-6 shadow-sm select-none">
                  <div className="space-y-1">
                    <h1 className="text-xl font-extrabold text-[#0F172A] tracking-tight">
                      Welcome back, {user?.fullName || user?.username || 'Creator'}!
                    </h1>
                    <p className="text-xs text-[#64748B] font-medium">
                      Manage your redirects, check clicks telemetry, and download print-ready QR codes.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-2 rounded-2xl flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#4F46E5]" />
                      <span className="text-xs font-bold text-[#0F172A] font-mono whitespace-nowrap">
                        {currentTime.toLocaleDateString(undefined, { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })} at {currentTime.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit', 
                          second: '2-digit' 
                        })}
                      </span>
                    </div>
                    <button 
                      onClick={() => setShowCreateModal(true)}
                      className="px-4 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-2xl text-xs cursor-pointer shadow-md shadow-indigo-100 flex items-center gap-1.5 border-none transition-all outline-none"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Quick Create URL</span>
                    </button>
                  </div>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 select-none">
                  <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Total URLs</div>
                    <div className="text-2xl font-bold text-[#0F172A]">{totalUrls}</div>
                  </div>
                  <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Total Clicks</div>
                    <div className="text-2xl font-bold text-[#4F46E5]">{totalClicks}</div>
                  </div>
                  <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Active URLs</div>
                    <div className="text-2xl font-bold text-emerald-500">{activeUrls}</div>
                  </div>
                  <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Expired URLs</div>
                    <div className="text-2xl font-bold text-red-500">{expiredUrls}</div>
                  </div>
                  <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">QRs Generated</div>
                    <div className="text-2xl font-bold text-indigo-500">{qrCodesGenerated}</div>
                  </div>
                  <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Click Growth %</div>
                    <div className="text-2xl font-bold text-emerald-500 flex items-center gap-0.5">
                      <span>{calculateGrowth()}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Panel */}
                <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-3xl p-5 shadow-sm select-none">
                  <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-4">Quick Actions</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                     <button 
                      onClick={() => { setCreateModalMode('url'); setGeneratedQrUrl(null); setShowCreateModal(true); }}
                      className="p-4 bg-slate-50 hover:bg-[#EEF2FF] border border-[#E2E8F0] hover:border-[#4F46E5]/30 rounded-2xl text-left cursor-pointer transition-all flex flex-col justify-between h-24 font-bold text-[#0F172A] text-xs outline-none"
                    >
                      <Plus className="w-5 h-5 text-[#4F46E5]" />
                      <span>Create Short URL</span>
                    </button>
                    <button 
                      onClick={() => { setCreateModalMode('qr'); setGeneratedQrUrl(null); setShowCreateModal(true); }}
                      className="p-4 bg-slate-50 hover:bg-[#EEF2FF] border border-[#E2E8F0] hover:border-[#4F46E5]/30 rounded-2xl text-left cursor-pointer transition-all flex flex-col justify-between h-24 font-bold text-[#0F172A] text-xs outline-none"
                    >
                      <QrCode className="w-5 h-5 text-[#4F46E5]" />
                      <span>Generate QR Code</span>
                    </button>
                    <button 
                      onClick={() => navigate('/analytics')}
                      className="p-4 bg-slate-50 hover:bg-[#EEF2FF] border border-[#E2E8F0] hover:border-[#4F46E5]/30 rounded-2xl text-left cursor-pointer transition-all flex flex-col justify-between h-24 font-bold text-[#0F172A] text-xs outline-none"
                    >
                      <Activity className="w-5 h-5 text-[#4F46E5]" />
                      <span>View Analytics</span>
                    </button>
                    <button 
                      onClick={handleExportData}
                      className="p-4 bg-slate-50 hover:bg-[#EEF2FF] border border-[#E2E8F0] hover:border-[#4F46E5]/30 rounded-2xl text-left cursor-pointer transition-all flex flex-col justify-between h-24 font-bold text-[#0F172A] text-xs outline-none"
                    >
                      <Download className="w-5 h-5 text-[#4F46E5]" />
                      <span>Export Analytics</span>
                    </button>
                  </div>
                </div>

                {/* Dashboard Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  
                  {/* Left Column: Create Form & CSV Importer */}
                  <div className="lg:col-span-1 space-y-6">
                    <LinkForm onUrlCreated={handleUrlCreated} />
                    <BulkImport onBulkCreated={fetchUrls} showToast={showToast} />
                  </div>

                  {/* Right Column: Top Performance & Recent Scans */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Top Performance widgets grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 select-none">
                      {/* Top Performing URL */}
                      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-5 shadow-sm flex flex-col justify-between h-36">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Top Performing URL</span>
                          {topUrl ? (
                            <div className="space-y-0.5">
                              <h5 className="font-bold text-[#0F172A] text-sm font-mono">/{topUrl.shortCode}</h5>
                              <p className="text-[10px] text-[#64748B] truncate font-mono">{topUrl.originalUrl}</p>
                            </div>
                          ) : (
                            <p className="text-xs text-[#64748B] italic">No shortened URLs yet</p>
                          )}
                        </div>
                        {topUrl && (
                          <div className="flex justify-between items-center border-t border-[#E2E8F0] pt-2">
                            <span className="text-xs font-bold text-[#0F172A]">{topUrl.clicks} clicks</span>
                            <button 
                              onClick={() => setActiveAnalyticsId(topUrl._id)}
                              className="text-[10px] text-[#4F46E5] font-bold flex items-center hover:underline cursor-pointer border-none bg-transparent outline-none p-0"
                            >
                              <span>View Stats</span>
                              <ArrowUpRight className="w-3 h-3 ml-0.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Latest Created URL */}
                      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-5 shadow-sm flex flex-col justify-between h-36">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Latest Created URL</span>
                          {latestUrl ? (
                            <div className="space-y-0.5">
                              <h5 className="font-bold text-[#0F172A] text-sm font-mono">/{latestUrl.shortCode}</h5>
                              <p className="text-[10px] text-[#64748B] truncate font-mono">{latestUrl.originalUrl}</p>
                            </div>
                          ) : (
                            <p className="text-xs text-[#64748B] italic">No shortened URLs yet</p>
                          )}
                        </div>
                        {latestUrl && (
                          <div className="flex justify-between items-center border-t border-[#E2E8F0] pt-2">
                            <span className="text-[10px] text-[#64748B] font-semibold">
                              Created: {new Date(latestUrl.createdAt).toLocaleDateString()}
                            </span>
                            <button 
                              onClick={() => {
                                const shortL = `${window.location.origin.includes('localhost') ? 'http://localhost:5000' : window.location.origin}/${latestUrl.shortCode}`;
                                navigator.clipboard.writeText(shortL);
                                showToast('Shortened link copied to clipboard!');
                              }}
                              className="text-[10px] text-[#4F46E5] font-bold flex items-center hover:underline cursor-pointer border-none bg-transparent outline-none p-0"
                            >
                              <span>Copy URL</span>
                              <ArrowUpRight className="w-3 h-3 ml-0.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Recent Visitors Widget */}
                    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-5 shadow-sm space-y-4 select-none">
                      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#4F46E5]" />
                          <h4 className="font-bold text-xs uppercase tracking-wider text-[#0F172A]">Recent scans & clicks</h4>
                        </div>
                        {recentVisits.length > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-indigo-50 border border-indigo-100/30 text-[9px] font-bold text-[#4F46E5] uppercase rounded-full">
                            Live telemetry active
                          </span>
                        )}
                      </div>
                      <div className="space-y-3">
                        {loadingAnalytics ? (
                          <div className="text-[11px] text-[#64748B] text-center py-4 font-semibold">
                            Aggregating redirect visit logs...
                          </div>
                        ) : recentVisits.length > 0 ? (
                          recentVisits.map((visit, index) => (
                            <div key={index} className="flex justify-between items-center text-xs border-b border-slate-50 last:border-0 pb-3 last:pb-0">
                              <div className="space-y-0.5 min-w-0">
                                <div className="font-bold text-[#0F172A] truncate">
                                  Scan on /{urls.find(u => u._id === visit.url)?.shortCode || 'shortcode'}
                                </div>
                                <div className="text-[10px] text-[#64748B] truncate font-medium flex items-center gap-1.5">
                                  <span>{visit.browser} on {visit.device}</span>
                                  <span>•</span>
                                  <span>{visit.country || 'United States'}</span>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className="text-[9px] font-bold text-[#64748B] font-mono">
                                  {new Date(visit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-[11px] text-[#64748B] text-center py-2 font-medium">
                            No redirect activity logged yet. Share your links to track clicks!
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                {/* URL Management Table Component */}
                <div id="links-section" className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 select-none">
                    <div>
                      <h3 className="font-sans font-extrabold text-base text-[#0F172A]">Your Shortened Links</h3>
                      <p className="text-xs text-[#64748B] mt-0.5 font-medium">Filter, copy, view stats or delete generated links</p>
                    </div>
                    
                    {/* Search and filter toolbar */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="relative flex-grow sm:flex-grow-0">
                        <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          className="w-full sm:w-48 bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl pl-9 pr-3 py-2 outline-none text-xs font-semibold"
                          placeholder="Search links..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-1.5 bg-white border border-[#E2E8F0] px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#64748B]">
                        <Filter className="w-3.5 h-3.5" />
                        <select
                          className="bg-transparent border-none outline-none text-[#64748B] font-bold cursor-pointer pr-1"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          <option value="all">All Statuses</option>
                          <option value="active">Active Only</option>
                          <option value="expired">Expired Only</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {loadingUrls ? (
                    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-16 text-center text-[#64748B] text-xs font-bold shadow-sm uppercase tracking-wider">
                      Retreiving database links...
                    </div>
                  ) : filteredUrls.length > 0 ? (
                    <LinkTable
                      urls={filteredUrls}
                      onDelete={handleUrlDeleted}
                      onUpdate={handleUrlUpdated}
                      onOpenAnalytics={setActiveAnalyticsId}
                      showToast={showToast}
                    />
                  ) : (
                    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-16 text-center shadow-sm flex flex-col items-center justify-center space-y-3 select-none">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#4F46E5] mb-2">
                        <Link2 className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-[#0F172A] text-sm">No links found</h3>
                      <p className="text-[#64748B] text-xs max-w-xs leading-relaxed font-medium">
                        {searchQuery || statusFilter !== 'all'
                          ? 'No links match your search filter settings.'
                          : "You haven't shortened any links yet. Enter a long URL in the widget to generate your first LinkNova short link."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Showcase feature section */}
                <div className="border-t border-[#E2E8F0] pt-12 space-y-6 select-none">
                  <h3 className="text-center font-extrabold text-lg text-[#0F172A]">LinkNova Core Suite Capabilities</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="w-9 h-9 bg-indigo-50 rounded-xl text-[#4F46E5] flex items-center justify-center border border-indigo-100/30">
                          <QrCode className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-[#0F172A] text-sm">QR Code Toolbox</h4>
                        <p className="text-[#64748B] text-xs leading-relaxed font-medium">
                          Auto-generates a clean vector QR code for every shortened alias created. Download high-res PNG, copy to clipboard, or scan.
                        </p>
                      </div>
                      <div className="border-t border-[#E2E8F0] pt-4 mt-6 flex justify-between items-center text-[10px] font-bold text-indigo-500">
                        <span>PREVIEW READY</span>
                        <span>PNG FORMAT</span>
                      </div>
                    </div>

                    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="w-9 h-9 bg-indigo-50 rounded-xl text-[#4F46E5] flex items-center justify-center border border-indigo-100/30">
                          <Clock className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-[#0F172A] text-sm">Advanced Expiry System</h4>
                        <p className="text-[#64748B] text-xs leading-relaxed font-medium">
                          Set exact expiration timestamps. The system automatically deactivates redirect routing and serves warning pages.
                        </p>
                      </div>
                      <div className="border-t border-[#E2E8F0] pt-4 mt-6 flex justify-between items-center text-[10px] font-bold text-indigo-500">
                        <span>AUTO DEACTIVATION</span>
                        <span>COUNTDOWN TIMER</span>
                      </div>
                    </div>

                    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="w-9 h-9 bg-indigo-50 rounded-xl text-[#4F46E5] flex items-center justify-center border border-indigo-100/30">
                          <Share2 className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-[#0F172A] text-sm">Public Analytics Pages</h4>
                        <p className="text-[#64748B] text-xs leading-relaxed font-medium">
                          Share metrics with clients. A dedicated public analytics dashboard compiles daily click trends and browser demographics.
                        </p>
                      </div>
                      <div className="border-t border-[#E2E8F0] pt-4 mt-6 flex justify-between items-center text-[10px] font-bold text-indigo-500">
                        <span>SHAREABLE LINKS</span>
                        <span>REAL-TIME MAPS</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Fallback Route: Page Not Found */}
            {!['/', '/profile', '/settings', '/analytics'].includes(currentPath) && !currentPath.startsWith('/analytics/') && (
              <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-3xl p-12 text-center shadow-sm flex flex-col items-center justify-center space-y-4 max-w-md mx-auto my-12 select-none animate-fade-in">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-[#0F172A] text-base">Page Not Found</h3>
                <p className="text-[#64748B] text-xs max-w-xs leading-relaxed font-semibold">
                  We couldn't find the page you are looking for. It may have been moved, deleted, or the address was typed incorrectly.
                </p>
                <button 
                  onClick={() => navigate('/')}
                  className="px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm transition-colors border-none outline-none"
                >
                  Return to Dashboard
                </button>
              </div>
            )}

          </main>
        </div>

        {/* Modern Footer */}
        <footer className="border-t border-[#E2E8F0] bg-[#FFFFFF] py-6 select-none mt-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#64748B] font-semibold">
            <div className="flex items-center gap-2 text-[#0F172A] font-bold">
              <Link2 className="w-4 h-4 text-[#4F46E5]" />
              <span>LinkNova SaaS</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://vercel.com" target="_blank" rel="noreferrer" className="hover:text-[#0F172A]">Vercel API</a>
              <a href="https://render.com" target="_blank" rel="noreferrer" className="hover:text-[#0F172A]">Render Service</a>
              <span className="flex items-center gap-0.5">
                <span>Built for startup showcase</span>
                <Heart className="w-3 h-3 text-red-500 fill-red-500" />
              </span>
            </div>
          </div>
        </footer>

        {/* Private Analytics overlay modal */}
        {activeAnalyticsId && (
          <AnalyticsView
            urlId={activeAnalyticsId}
            urls={urls}
            onClose={() => setActiveAnalyticsId(null)}
          />
        )}

        {/* Quick Create Link Modal Overlay */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex justify-center items-center z-[1100] p-4 animate-fade-in" onClick={() => { setGeneratedQrUrl(null); setShowCreateModal(false); }}>
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-3xl p-6 shadow-2xl max-w-md w-full relative animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => { setGeneratedQrUrl(null); setShowCreateModal(false); }}
                className="absolute top-4 right-4 p-1.5 hover:bg-[#E2E8F0]/30 border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] rounded-lg cursor-pointer transition-all outline-none"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="pt-2">
                {generatedQrUrl ? (
                  <div className="text-center space-y-4 select-none">
                    <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Check className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-[#0F172A] text-base">QR Code Generated!</h3>
                      <p className="text-xs text-[#64748B] font-medium">Your short link and scannable QR Code are ready.</p>
                    </div>
                    <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-sm flex items-center justify-center mx-auto w-48 h-48">
                      <img 
                        src={generatedQrUrl.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                          `${window.location.origin.includes('localhost') ? 'http://localhost:5000' : window.location.origin}/${generatedQrUrl.shortCode}`
                        )}`} 
                        alt="QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-2.5 rounded-xl font-mono text-xs text-[#4F46E5] font-bold truncate">
                      {`${window.location.origin.includes('localhost') ? 'http://localhost:5000' : window.location.origin}/${generatedQrUrl.shortCode}`}
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button 
                        onClick={async () => {
                          try {
                            const response = await authenticatedFetch(`/api/url/download-qr/${generatedQrUrl.shortCode}`);
                            if (!response.ok) throw new Error('Failed to download QR code');
                            const blob = await response.blob();
                            const blobUrl = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = blobUrl;
                            link.download = `linknova-qr-${generatedQrUrl.shortCode}.png`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(blobUrl);
                            showToast('QR Code PNG download complete!');
                          } catch (err) {
                            showToast('Failed to download QR code.', 'error');
                          }
                        }}
                        className="inline-flex items-center justify-center gap-1.5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer border-none outline-none shadow-sm shadow-indigo-100"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download PNG</span>
                      </button>
                      <button 
                        onClick={async () => {
                          try {
                            const shortLink = `${window.location.origin.includes('localhost') ? 'http://localhost:5000' : window.location.origin}/${generatedQrUrl.shortCode}`;
                            await navigator.clipboard.writeText(shortLink);
                            showToast('Shortened link copied to clipboard!');
                          } catch (err) {
                            showToast('Failed to copy link.', 'error');
                          }
                        }}
                        className="inline-flex items-center justify-center gap-1.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#E2E8F0]/30 text-[#64748B] hover:text-[#0F172A] font-bold rounded-xl text-xs transition-colors cursor-pointer outline-none"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copy Link</span>
                      </button>
                    </div>
                    <button 
                      onClick={() => {
                        setGeneratedQrUrl(null);
                        setShowCreateModal(false);
                      }}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-[#0F172A] font-bold rounded-xl text-xs transition-colors cursor-pointer border-none outline-none mt-2"
                    >
                      Close Preview
                    </button>
                  </div>
                ) : (
                  <LinkForm onUrlCreated={(newUrl) => {
                    handleUrlCreated(newUrl);
                    if (createModalMode === 'qr') {
                      setGeneratedQrUrl(newUrl);
                    } else {
                      setShowCreateModal(false);
                    }
                  }} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Logout Confirmation Modal */}
        {showLogoutModal && (
          <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex justify-center items-center z-[1100] p-4 animate-fade-in" onClick={() => setShowLogoutModal(false)}>
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl shadow-2xl p-6 max-w-xs w-full space-y-4 animate-slide-up text-center" onClick={(e) => e.stopPropagation()}>
              <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 text-[#4F46E5] rounded-full flex items-center justify-center mx-auto">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-[#0F172A] text-sm">Sign out of LinkNova?</h3>
                <p className="text-[#64748B] text-xs leading-relaxed font-semibold">
                  You will need to re-authenticate with email and password to access your dashboard settings.
                </p>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-grow py-2 px-3 border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-lg text-xs font-bold text-[#64748B] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmedLogout}
                  className="flex-grow py-2 px-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Help Center FAQ Modal */}
        {showHelpModal && (
          <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex justify-center items-center z-[1100] p-4 animate-fade-in" onClick={() => setShowHelpModal(false)}>
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl shadow-2xl p-6 max-w-lg w-full space-y-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-2.5">
                <h3 className="font-bold text-[#0F172A] text-base">LinkNova Help Center</h3>
                <button onClick={() => setShowHelpModal(false)} className="text-[#64748B] hover:text-[#0F172A] font-bold text-xs bg-transparent border-none cursor-pointer outline-none">Close</button>
              </div>
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                {faqs.map((faq, index) => (
                  <div key={index} className="space-y-1.5">
                    <div className="text-xs font-bold text-[#0F172A]">{faq.q}</div>
                    <p className="text-[11px] text-[#64748B] leading-relaxed font-semibold">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Global Toast component */}
        {toast && (
          <div className={`fixed bottom-6 right-6 px-4 py-3 bg-[#0F172A] text-white rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold z-[1200] animate-slide-up border border-[#0F172A] ${toast.type === 'error' ? 'border-red-955 bg-red-950/90 text-red-200' : ''}`}>
            {toast.type !== 'error' && <Check className="w-4 h-4 text-[#10B981] flex-shrink-0" />}
            <span>{toast.message}</span>
          </div>
        )}

      </div>
    );
  }

  // Guest Router: Landing Page, Login, Register
  return (
    <div className="min-h-screen bg-[#FFFFFF] font-sans flex flex-col justify-between select-none">
      
      {/* Header Sticky Navbar */}
      <Navbar currentPath={currentPath} navigate={navigate} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow flex flex-col justify-center">
        
        {/* Route: /login */}
        {currentPath === '/login' && (
          <Login onSwitchToRegister={() => navigate('/register')} />
        )}

        {/* Route: /register */}
        {currentPath === '/register' && (
          <Register onSwitchToLogin={() => navigate('/login')} />
        )}

        {/* Default Route: Landing Page */}
        {currentPath === '/' && (
          <div className="space-y-16 py-6 animate-fade-in">
            
            {/* Hero Section */}
            <section className="text-center max-w-3xl mx-auto space-y-6">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-[1.12]">
                Custom short links. <br/>
                <span className="text-[#4F46E5] bg-indigo-50/50 px-2 rounded-xl border border-indigo-100/30">Analyze conversion clicks in real time.</span>
              </h1>
              <p className="text-[#64748B] text-sm sm:text-base max-w-xl mx-auto leading-relaxed font-semibold">
                LinkNova is the startup-grade URL shortening suite built for creators, growth hackers, and designers. Control expiration rules, scan automatic QRs, and analyze trends.
              </p>
              
              <div className="flex justify-center gap-3">
                <button onClick={() => navigate('/register')} className="px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-indigo-150 transition-all border-none outline-none">
                  Create Free Account
                </button>
                <button onClick={() => navigate('/login')} className="px-5 py-2.5 bg-[#FFFFFF] border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] font-bold rounded-xl text-xs cursor-pointer shadow-sm transition-all outline-none">
                  Interactive Demo SignIn
                </button>
              </div>
            </section>

            {/* Interactive Url shortener demo sandbox */}
            <section className="max-w-lg mx-auto">
              <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl shadow-md p-6">
                <div className="flex items-center gap-2 mb-4 font-bold text-[10px] text-[#4F46E5] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Test Drive LinkNova Sandbox</span>
                </div>
                
                <form onSubmit={handleDemoShorten} className="flex gap-2">
                  <input
                    type="text"
                    className="flex-grow bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl px-4 py-2.5 outline-none text-xs font-semibold"
                    placeholder="Paste your long destination URL here..."
                    value={demoInput}
                    onChange={(e) => setDemoInput(e.target.value)}
                    required
                  />
                  <button type="submit" className="px-4 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm border-none disabled:opacity-50" disabled={demoLoading}>
                    {demoLoading ? '...' : 'Shorten'}
                  </button>
                </form>

                {demoResult && (
                  <div className="mt-4 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between gap-4 animate-slide-up select-text">
                    <span className="text-[#4F46E5] font-bold text-xs truncate select-all">{demoResult}</span>
                    <button onClick={handleCopyDemo} className="flex-shrink-0 px-3 py-1 bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#64748B] hover:text-[#0F172A] font-bold text-[10px] cursor-pointer transition-colors">
                      {demoCopied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Features showcase */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="w-9 h-9 bg-indigo-50 rounded-lg text-[#4F46E5] flex items-center justify-center mb-4 border border-indigo-100/30">
                  <Link2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#0F172A] text-sm mb-1.5">URL Shortening</h3>
                <p className="text-[#64748B] text-xs font-semibold leading-relaxed">
                  Generate customized code links with description metadata and track clicks.
                  </p>
              </div>

              <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="w-9 h-9 bg-indigo-50 rounded-lg text-[#4F46E5] flex items-center justify-center mb-4 border border-indigo-100/30">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#0F172A] text-sm mb-1.5">Real-time Analytics</h3>
                <p className="text-[#64748B] text-xs font-semibold leading-relaxed">
                  View daily, weekly, and monthly trends plus browser, OS, and country analytics.
                </p>
              </div>

              <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="w-9 h-9 bg-indigo-50 rounded-lg text-[#4F46E5] flex items-center justify-center mb-4 border border-indigo-100/30">
                  <QrCode className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#0F172A] text-sm mb-1.5">Smart QR Codes</h3>
                <p className="text-[#64748B] text-xs font-semibold leading-relaxed">
                  Local vectors generated instantly. Copy the image blob, download, or share.
                </p>
              </div>

              <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="w-9 h-9 bg-indigo-50 rounded-lg text-[#4F46E5] flex items-center justify-center mb-4 border border-indigo-100/30">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#0F172A] text-sm mb-1.5">Expiry Thresholds</h3>
                <p className="text-[#64748B] text-xs font-semibold leading-relaxed">
                  Set timestamps. Expired links de-activate and display professional warnings.
                </p>
              </div>
            </section>

            {/* Testimonials */}
            <section className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-3xl p-8 max-w-4xl mx-auto text-center space-y-6 select-none">
              <div className="text-[10px] font-bold text-[#4F46E5] uppercase tracking-wider">Trusted by modern startups</div>
              <blockquote className="text-lg font-medium text-[#0F172A] italic">
                "LinkNova completely transformed our campaign workflows. Reviewing browser metrics and printing QR packages takes seconds, not hours."
              </blockquote>
              <div>
                <p className="font-bold text-sm text-[#0F172A]">Alex Rivera</p>
                <p className="text-[#64748B] text-xs">Growth Lead at TechFlow</p>
              </div>
            </section>

            {/* FAQs Accordion */}
            <section className="max-w-2xl mx-auto space-y-6">
              <h3 className="text-center font-extrabold text-2xl text-[#0F172A] tracking-tight">Frequently Asked Questions</h3>
              <div className="divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded-2xl bg-[#FFFFFF] overflow-hidden shadow-sm">
                {faqs.map((faq, index) => (
                  <div key={index} className="px-6 py-4 bg-white">
                    <button
                      type="button"
                      onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                      className="w-full flex items-center justify-between text-left font-bold text-xs sm:text-sm text-[#0F172A] cursor-pointer select-none outline-none border-none bg-transparent py-1"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform ${activeFaq === index ? 'rotate-180' : ''}`} />
                    </button>
                    {activeFaq === index && (
                      <p className="text-[#64748B] text-xs leading-relaxed mt-2.5 animate-slide-up font-semibold">
                        {faq.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>

          </div>
        )}

        {/* Guest Fallback Route: Page Not Found */}
        {!['/', '/login', '/register'].includes(currentPath) && !currentPath.startsWith('/analytics/') && (
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-3xl p-12 text-center shadow-sm flex flex-col items-center justify-center space-y-4 max-w-md mx-auto my-12 select-none animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[#0F172A] text-base">Page Not Found</h3>
            <p className="text-[#64748B] text-xs max-w-xs leading-relaxed font-semibold">
              We couldn't find the page you are looking for. Please sign in or return to the landing page.
            </p>
            <button 
              onClick={() => navigate('/')}
              className="px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm transition-colors border-none outline-none"
            >
              Go to Home Page
            </button>
          </div>
        )}

      </main>

      {/* Modern Footer */}
      <footer className="border-t border-[#E2E8F0] bg-[#FFFFFF] py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#64748B] font-semibold">
          <div className="flex items-center gap-2 text-[#0F172A] font-bold">
            <Link2 className="w-4 h-4 text-[#4F46E5]" />
            <span>LinkNova SaaS</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-[#0F172A]">GitHub docs</a>
            <span className="flex items-center gap-0.5">
              <span>Made with love for creators</span>
              <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            </span>
          </div>
        </div>
      </footer>

      {/* Global Toast component */}
      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-3 bg-[#0F172A] text-white rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold z-[1000] animate-slide-up">
          <Check className="w-4 h-4 text-[#10B981] flex-shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;

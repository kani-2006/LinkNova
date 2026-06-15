import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { BarChart3, Calendar, Globe, ShieldAlert, X, Eye, Laptop, Navigation, Filter } from 'lucide-react';

const COLORS = ['#4F46E5', '#6366F1', '#818CF8', '#A5B4FC', '#C7D2FE', '#E0E7FF'];

const AnalyticsView = ({ urlId: initialUrlId, onClose, isPublic = false, shortCode = '', urls = [] }) => {
  const { authenticatedFetch } = useAuth();
  
  // Selected Link ID state
  const [selectedUrlId, setSelectedUrlId] = useState(initialUrlId || 'all');
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Chart toggle: 'daily', 'weekly', 'monthly'
  const [trendRange, setTrendRange] = useState('daily');

  // Trigger data fetch whenever the selected URL ID changes
  useEffect(() => {
    setSelectedUrlId(initialUrlId || 'all');
  }, [initialUrlId]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError('');
      try {
        // Public Mode: Single URL by shortCode
        if (isPublic) {
          if (!shortCode) {
            setError('No short code provided.');
            setLoading(false);
            return;
          }
          const response = await fetch(`/api/url/public/analytics/${shortCode}`);
          const result = await response.json();
          if (result.success) {
            setData(result.data);
          } else {
            setError(result.error || 'Failed to load analytics.');
          }
          setLoading(false);
          return;
        }

        // Private Mode: Check if Selected ID is 'all' (Aggregate Mode)
        if (selectedUrlId === 'all') {
          if (!urls || urls.length === 0) {
            setData({
              url: { shortCode: 'All Links', originalUrl: 'N/A', description: 'Combined analytics of all short links' },
              metrics: {
                totalClicks: 0,
                lastVisited: null,
                recentVisits: [],
                browserBreakdown: [],
                osBreakdown: [],
                refererBreakdown: [],
                deviceBreakdown: [],
                countryBreakdown: [],
                dailyClicks: [],
                weeklyClicks: [],
                monthlyClicks: []
              }
            });
            setLoading(false);
            return;
          }

          // Fetch analytics for all links in parallel
          const promises = urls.map(async (u) => {
            try {
              const res = await authenticatedFetch(`/api/analytics/${u._id}`);
              return await res.json();
            } catch (err) {
              console.error(`Error fetching analytics for ${u.shortCode}`, err);
              return { success: false };
            }
          });

          const results = await Promise.all(promises);

          // Aggregate combined data
          let totalClicks = 0;
          let lastVisited = null;
          let recentVisits = [];
          
          const rawBrowser = [];
          const rawOs = [];
          const rawReferer = [];
          const rawDevice = [];
          const rawCountry = [];
          const rawDaily = [];
          const rawWeekly = [];
          const rawMonthly = [];

          results.forEach((res) => {
            if (res.success && res.data) {
              const m = res.data.metrics;
              totalClicks += m.totalClicks || 0;
              
              if (m.lastVisited) {
                const visTime = new Date(m.lastVisited);
                if (!lastVisited || visTime > new Date(lastVisited)) {
                  lastVisited = m.lastVisited;
                }
              }

              if (m.recentVisits) {
                recentVisits = [...recentVisits, ...m.recentVisits];
              }

              if (m.browserBreakdown) rawBrowser.push(m.browserBreakdown);
              if (m.osBreakdown) rawOs.push(m.osBreakdown);
              if (m.refererBreakdown) rawReferer.push(m.refererBreakdown);
              if (m.deviceBreakdown) rawDevice.push(m.deviceBreakdown);
              if (m.countryBreakdown) rawCountry.push(m.countryBreakdown);
              if (m.dailyClicks) rawDaily.push(m.dailyClicks);
              if (m.weeklyClicks) rawWeekly.push(m.weeklyClicks);
              if (m.monthlyClicks) rawMonthly.push(m.monthlyClicks);
            }
          });

          // Sort recent visits and limit to 50
          recentVisits.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          recentVisits = recentVisits.slice(0, 50);

          // Helpers to sum maps
          const sumBreakdown = (arrays) => {
            const map = {};
            arrays.forEach((arr) => {
              arr.forEach((item) => {
                map[item.name] = (map[item.name] || 0) + item.value;
              });
            });
            return Object.keys(map)
              .map((name) => ({ name, value: map[name] }))
              .sort((a, b) => b.value - a.value);
          };

          const sumDaily = (arrays) => {
            const map = {};
            arrays.forEach((arr) => {
              arr.forEach((item) => {
                map[item.date] = (map[item.date] || 0) + item.clicks;
              });
            });
            return Object.keys(map)
              .map((date) => ({ date, clicks: map[date] }))
              .sort((a, b) => a.date.localeCompare(b.date));
          };

          setData({
            url: { shortCode: 'All Links', originalUrl: 'Aggregated view of destinations', description: 'Combined analytics summary' },
            metrics: {
              totalClicks,
              lastVisited,
              recentVisits,
              browserBreakdown: sumBreakdown(rawBrowser),
              osBreakdown: sumBreakdown(rawOs),
              refererBreakdown: sumBreakdown(rawReferer),
              deviceBreakdown: sumBreakdown(rawDevice),
              countryBreakdown: sumBreakdown(rawCountry),
              dailyClicks: sumDaily(rawDaily),
              weeklyClicks: sumDaily(rawWeekly),
              monthlyClicks: sumDaily(rawMonthly)
            }
          });
        } else {
          // Single Link Analytics Mode
          const response = await authenticatedFetch(`/api/analytics/${selectedUrlId}`);
          const result = await response.json();
          if (result.success) {
            setData(result.data);
          } else {
            setError(result.error || 'Failed to load analytics.');
          }
        }
      } catch (err) {
        console.error('Analytics fetch error:', err);
        setError('Connection error. Failed to retrieve analytics data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedUrlId, shortCode, isPublic, urls]);

  // Format daily click data for AreaChart (7 days)
  const getDailyData = (dailyClicks) => {
    if (!dailyClicks) return [];
    
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const matched = dailyClicks.find(item => item.date === dateStr);
      chartData.push({
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        clicks: matched ? matched.clicks : 0
      });
    }
    return chartData;
  };

  const renderDistributionList = (items, emptyLabel = 'No logs recorded') => {
    if (!items || items.length === 0) {
      return <div className="text-[#64748B] text-xs py-6 text-center font-medium">{emptyLabel}</div>;
    }

    const total = items.reduce((sum, item) => sum + item.value, 0);

    return (
      <div className="space-y-4 w-full">
        {items.slice(0, 5).map((item, index) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div className="space-y-1.5" key={index}>
              <div className="flex justify-between text-xs font-bold text-[#0F172A]">
                <span>{item.name || 'Direct / Unknown'}</span>
                <span className="text-[#64748B]">{item.value} ({Math.round(percentage)}%)</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#4F46E5] rounded-full transition-all duration-500" 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Decide container layout styles
  const isModal = !!onClose;
  const containerClass = isModal 
    ? "fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex justify-center items-center z-[900] p-4 overflow-y-auto animate-fade-in"
    : "w-full max-w-6xl mx-auto py-2";

  const contentClass = isModal
    ? "bg-[#FFFFFF] border border-[#E2E8F0] shadow-2xl p-6 md:p-8 w-full max-w-5xl rounded-3xl max-h-[92vh] overflow-y-auto animate-slide-up"
    : "bg-[#FFFFFF] border border-[#E2E8F0] shadow-sm p-6 md:p-8 w-full rounded-3xl";

  return (
    <div className={containerClass}>
      <div className={contentClass}>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-9 h-9 border-4 border-slate-100 border-t-[#4F46E5] rounded-full animate-spin"></div>
            <p className="text-[#64748B] text-xs font-bold uppercase tracking-wider">Loading click analytics...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 space-y-4 select-none">
            <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="text-base font-bold text-[#0F172A]">Analytics Error</h3>
            <p className="text-xs text-[#64748B] max-w-xs mx-auto leading-relaxed">{error}</p>
            {isPublic ? (
              <a href="/" className="inline-flex py-2.5 px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl text-xs shadow-sm transition-all outline-none">
                Go to Homepage
              </a>
            ) : isModal ? (
              <button onClick={onClose} className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer transition-colors outline-none border-none">
                Close Panel
              </button>
            ) : (
              <button onClick={() => setSelectedUrlId('all')} className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer transition-colors outline-none border-none">
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Header Title & Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E2E8F0] pb-5">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-50 text-[#4F46E5] shadow-sm flex-shrink-0">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold text-[#0F172A] tracking-tight">
                    {selectedUrlId === 'all' ? 'All Shortened Links' : `/${data.url.shortCode}`}
                  </h2>
                </div>
                {selectedUrlId !== 'all' ? (
                  <div className="text-xs text-[#64748B] truncate max-w-sm sm:max-w-xl font-mono hover:text-[#0F172A]">
                    Destination: <a href={data.url.originalUrl} target="_blank" rel="noreferrer" className="text-[#4F46E5] hover:underline font-semibold">{data.url.originalUrl}</a>
                  </div>
                ) : (
                  <p className="text-xs text-[#64748B] font-medium">Combined visitor demographics and redirection telemetry</p>
                )}
              </div>

              {/* Selector / Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {!isPublic && urls && urls.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-[#E2E8F0] px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#0F172A]">
                    <Filter className="w-3.5 h-3.5 text-[#64748B]" />
                    <select
                      value={selectedUrlId}
                      onChange={(e) => setSelectedUrlId(e.target.value)}
                      className="bg-transparent border-none outline-none text-[#0F172A] font-bold cursor-pointer pr-1"
                    >
                      <option value="all">All Links (Combined)</option>
                      {urls.map((u) => (
                        <option key={u._id} value={u._id}>
                          /{u.shortCode}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {isPublic ? (
                  <a href="/" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl text-xs shadow-sm transition-all">
                    <span>Create Short Links</span>
                  </a>
                ) : isModal ? (
                  <button 
                    onClick={onClose} 
                    className="p-1.5 hover:bg-[#E2E8F0]/30 border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] rounded-lg cursor-pointer transition-all outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 select-none">
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5">
                <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Total click logs</div>
                <div className="text-2xl font-bold text-[#0F172A]">{data.metrics.totalClicks}</div>
                <div className="text-[10px] text-[#64748B] font-semibold mt-1">all-time redirects routed</div>
              </div>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5">
                <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Last click timestamp</div>
                <div className="text-base font-bold text-[#0F172A] py-0.5 truncate">
                  {data.metrics.lastVisited ? new Date(data.metrics.lastVisited).toLocaleDateString() : 'No clicks'}
                </div>
                <div className="text-[10px] text-[#64748B] font-semibold mt-1">
                  {data.metrics.lastVisited ? new Date(data.metrics.lastVisited).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'awaiting first scan'}
                </div>
              </div>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5">
                <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Redirection Status</div>
                <div className="text-base font-bold text-[#0F172A] py-0.5">
                  {selectedUrlId === 'all' ? 'Active Account' : data.url.expiryDate ? (new Date(data.url.expiryDate) < new Date() ? 'Expired' : 'Active') : 'Permanent'}
                </div>
                <div className="text-[10px] text-[#64748B] font-semibold mt-1">
                  {selectedUrlId === 'all' 
                    ? `${urls.length} link codes active`
                    : data.url.expiryDate 
                      ? `Expires: ${new Date(data.url.expiryDate).toLocaleDateString()}` 
                      : 'no auto deactivation set'
                  }
                </div>
              </div>
            </div>

            {/* Recharts Click Trends Container */}
            <div className="border border-[#E2E8F0] rounded-2xl p-5 bg-white space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#4F46E5]" />
                  <span>Redirection Clicks Over Time</span>
                </h4>
                
                {/* Toggles for daily/weekly/monthly */}
                <div className="flex bg-[#F8FAFC] p-1 border border-[#E2E8F0] rounded-lg">
                  <button
                    onClick={() => setTrendRange('daily')}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all border-none ${trendRange === 'daily' ? 'bg-[#FFFFFF] text-[#4F46E5] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => setTrendRange('weekly')}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all border-none ${trendRange === 'weekly' ? 'bg-[#FFFFFF] text-[#4F46E5] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setTrendRange('monthly')}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all border-none ${trendRange === 'monthly' ? 'bg-[#FFFFFF] text-[#4F46E5] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                  >
                    Monthly
                  </button>
                </div>
              </div>
              
              <div className="h-56 w-full">
                {data.metrics.totalClicks > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {trendRange === 'daily' ? (
                      <AreaChart data={getDailyData(data.metrics.dailyClicks)} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }} />
                        <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }} />
                        <Tooltip 
                          contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 8px 20px -4px rgba(15,23,42,0.06)' }}
                          labelStyle={{ fontWeight: 700, color: '#0F172A', fontSize: '10px' }}
                          itemStyle={{ color: '#4F46E5', fontSize: '11px', fontWeight: 600 }}
                        />
                        <Area type="monotone" dataKey="clicks" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#indigoGrad)" />
                      </AreaChart>
                    ) : trendRange === 'weekly' ? (
                      <LineChart data={data.metrics.weeklyClicks || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }} />
                        <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }} />
                        <Tooltip 
                          contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 8px 20px -4px rgba(15,23,42,0.06)' }}
                          labelStyle={{ fontWeight: 700, color: '#0F172A', fontSize: '10px' }}
                          itemStyle={{ color: '#4F46E5', fontSize: '11px', fontWeight: 600 }}
                        />
                        <Line type="monotone" dataKey="clicks" stroke="#4F46E5" strokeWidth={2.5} dot={{ fill: '#4F46E5', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    ) : (
                      <BarChart data={data.metrics.monthlyClicks || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }} />
                        <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }} />
                        <Tooltip 
                          contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 8px 20px -4px rgba(15,23,42,0.06)' }}
                          labelStyle={{ fontWeight: 700, color: '#0F172A', fontSize: '10px' }}
                          itemStyle={{ color: '#4F46E5', fontSize: '11px', fontWeight: 600 }}
                        />
                        <Bar dataKey="clicks" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={36} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#64748B] text-xs font-semibold select-none border border-dashed border-[#E2E8F0] rounded-xl bg-slate-50/50">
                    No clicks recorded for this range. Share your link to log redirection activity!
                  </div>
                )}
              </div>
            </div>

            {/* Demographics Split Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Browser PieChart */}
              <div className="border border-[#E2E8F0] rounded-2xl p-5 flex flex-col bg-white">
                <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-4 flex items-center gap-1.5 select-none font-sans">
                  <Globe className="w-3.5 h-3.5 text-[#4F46E5]" />
                  <span>Browser Analytics</span>
                </h4>
                
                <div className="h-48 w-full flex items-center justify-center">
                  {data.metrics.browserBreakdown && data.metrics.browserBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.metrics.browserBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {data.metrics.browserBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '10px', fontWeight: 600 }}
                        />
                        <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <span className="text-[#64748B] text-xs font-semibold">No browser logs recorded</span>
                  )}
                </div>
              </div>

              {/* Device PieChart */}
              <div className="border border-[#E2E8F0] rounded-2xl p-5 flex flex-col bg-white">
                <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-4 flex items-center gap-1.5 select-none font-sans">
                  <Laptop className="w-3.5 h-3.5 text-[#4F46E5]" />
                  <span>Device Analytics</span>
                </h4>
                
                <div className="h-48 w-full flex items-center justify-center">
                  {data.metrics.deviceBreakdown && data.metrics.deviceBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.metrics.deviceBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {data.metrics.deviceBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '10px', fontWeight: 600 }}
                        />
                        <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <span className="text-[#64748B] text-xs font-semibold">No device clicks logged</span>
                  )}
                </div>
              </div>

              {/* Referrer Distribution */}
              <div className="border border-[#E2E8F0] rounded-2xl p-5 flex flex-col bg-white">
                <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-4 flex items-center gap-1.5 select-none font-sans">
                  <Globe className="w-3.5 h-3.5 text-[#4F46E5]" />
                  <span>Referrer Sources</span>
                </h4>
                <div className="flex-grow flex items-center justify-center">
                  {renderDistributionList(data.metrics.refererBreakdown, 'No referrer logs recorded')}
                </div>
              </div>

              {/* Country Breakdown */}
              <div className="border border-[#E2E8F0] rounded-2xl p-5 flex flex-col bg-white">
                <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-4 flex items-center gap-1.5 select-none font-sans">
                  <Navigation className="w-3.5 h-3.5 text-[#4F46E5]" />
                  <span>Country Analytics</span>
                </h4>
                <div className="flex-grow flex items-center justify-center">
                  {renderDistributionList(data.metrics.countryBreakdown, 'No geographical logs recorded')}
                </div>
              </div>

            </div>

            {/* Visitor Log Table */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
              <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-4 flex items-center gap-1.5 select-none font-sans">
                <Eye className="w-3.5 h-3.5 text-[#4F46E5]" />
                <span>Recent Visitors</span>
              </h4>
              
              {data.metrics.recentVisits && data.metrics.recentVisits.length > 0 ? (
                <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
                  <table className="w-full border-collapse text-left text-xs text-[#64748B]">
                    <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] font-bold text-[#0F172A] select-none">
                      <tr>
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">Browser</th>
                        <th className="px-4 py-3">OS</th>
                        <th className="px-4 py-3">Device</th>
                        <th className="px-4 py-3">Country</th>
                        <th className="px-4 py-3">Referrer</th>
                        <th className="px-4 py-3">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] font-medium">
                      {data.metrics.recentVisits.map((visit) => (
                        <tr key={visit._id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="px-4 py-2.5 font-bold text-[#0F172A]">
                            {new Date(visit.timestamp).toLocaleDateString()} {new Date(visit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-2.5 text-[#4F46E5] font-semibold">{visit.browser}</td>
                          <td className="px-4 py-2.5">{visit.os}</td>
                          <td className="px-4 py-2.5">{visit.device}</td>
                          <td className="px-4 py-2.5 font-bold text-[#0F172A]">{visit.country}</td>
                          <td className="px-4 py-2.5">{visit.referer}</td>
                          <td className="px-4 py-2.5 font-mono text-[10px] text-[#64748B]">{visit.ip}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 text-[#64748B] text-xs border border-dashed border-[#E2E8F0] rounded-xl bg-[#F8FAFC] font-semibold">
                  No clicks registered yet. Live click telemetry will appear here dynamically.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsView;

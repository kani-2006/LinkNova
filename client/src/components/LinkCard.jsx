import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Copy, Check, QrCode, BarChart3, Edit3, Trash2, Share2, 
  Calendar, ExternalLink, AlertTriangle, HelpCircle, Download 
} from 'lucide-react';

const LinkCard = ({ url, onDelete, onUpdate, onOpenAnalytics, showToast }) => {
  const { authenticatedFetch } = useAuth();
  
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Real-time Expiry Timer states
  const [timeLeft, setTimeLeft] = useState('');
  const [linkStatus, setLinkStatus] = useState('active'); // active, expiring, expired
  
  // Edit form states
  const [editUrl, setEditUrl] = useState(url.originalUrl);
  const [editDesc, setEditDesc] = useState(url.description || '');
  const [editExpiry, setEditExpiry] = useState(
    url.expiresAt ? new Date(url.expiresAt).toISOString().slice(0, 16) : ''
  );
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const shortLink = `${window.location.origin.includes('localhost') ? 'http://localhost:5000' : window.location.origin}/${url.shortCode}`;

  // Ticking Expiry Timer logic
  useEffect(() => {
    if (!url.expiresAt) {
      setLinkStatus('active');
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(url.expiresAt);
      const diffMs = expiry - now;

      if (diffMs <= 0) {
        setLinkStatus('expired');
        setTimeLeft('Expired');
        return;
      }

      // Expiring soon if < 24 hours (86,400,000 ms)
      if (diffMs < 86400000) {
        setLinkStatus('expiring');
        const hrs = Math.floor(diffMs / (3600 * 1000));
        const mins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
        const secs = Math.floor((diffMs % (60 * 1000)) / 1000);
        setTimeLeft(`${hrs}h ${mins}m ${secs}s`);
      } else {
        setLinkStatus('active');
        setTimeLeft('');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [url.expiresAt]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shortLink);
      setCopied(true);
      if (showToast) showToast('Shortened link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShareAnalytics = async () => {
    try {
      const shareUrl = `${window.location.origin}/analytics/${url.shortCode}`;
      await navigator.clipboard.writeText(shareUrl);
      if (showToast) showToast('Shareable analytics dashboard link copied!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadQR = async () => {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(shortLink)}`;
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `linknova-qr-${url.shortCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      if (showToast) showToast('QR Code PNG download complete!');
    } catch (err) {
      if (showToast) showToast('Failed to download QR code image.', 'error');
    }
  };

  const handleCopyQR = async () => {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(shortLink)}`;
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      if (showToast) showToast('QR Code image copied directly to clipboard!');
    } catch (err) {
      console.error('Blob clipboard write failed, copying short url fallback:', err);
      // Fallback
      await navigator.clipboard.writeText(shortLink);
      if (showToast) showToast('Clipboard image blocked. Copied shortened URL instead.');
    }
  };

  const handleShareQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `LinkNova QR Code`,
          text: `Scan this code to visit /${url.shortCode}`,
          url: shortLink
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      await navigator.clipboard.writeText(shortLink);
      if (showToast) showToast('Short URL copied to clipboard for sharing!');
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to permanently delete the shortcode /${url.shortCode}?`)) {
      try {
        const response = await authenticatedFetch(`/api/url/${url._id}`, {
          method: 'DELETE'
        });
        const result = await response.json();
        if (result.success) {
          onDelete(url._id);
          if (showToast) showToast('Short link and analytics deleted.');
        } else {
          if (showToast) showToast(result.error || 'Failed to delete URL.', 'error');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);

    if (!editUrl.startsWith('http://') && !editUrl.startsWith('https://')) {
      setEditError('URL must start with http:// or https://');
      setEditLoading(false);
      return;
    }

    try {
      const response = await authenticatedFetch(`/api/url/${url._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          originalUrl: editUrl,
          description: editDesc,
          expiresAt: editExpiry || null
        })
      });
      const result = await response.json();

      if (result.success) {
        onUpdate(result.data);
        setShowEditModal(false);
        if (showToast) showToast('Link details updated successfully!');
      } else {
        setEditError(result.error || 'Failed to save URL changes.');
      }
    } catch (err) {
      setEditError('Connection error. Failed to save details.');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#4F46E5]/30 rounded-2xl p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 animate-fade-in select-none">
      <div className="flex flex-col md:flex-row justify-between items-start gap-5">
        
        {/* URL Meta details */}
        <div className="space-y-3.5 flex-grow min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {url.description && (
              <span className="text-[10px] font-bold text-[#4F46E5] bg-indigo-50 border border-indigo-100/50 px-2.5 py-0.5 rounded-full truncate max-w-[160px]">
                {url.description}
              </span>
            )}
            
            {/* Real-time Status Badges */}
            {linkStatus === 'expired' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase tracking-wider bg-red-50 border-red-200 text-red-650">
                Expired
              </span>
            )}
            {linkStatus === 'expiring' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase tracking-wider bg-amber-50 border-amber-250 text-amber-650 animate-pulse">
                <AlertTriangle className="w-2.5 h-2.5" />
                <span>Expiring Soon</span>
              </span>
            )}
            {linkStatus === 'active' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase tracking-wider bg-emerald-50 border-emerald-250 text-emerald-650">
                Active
              </span>
            )}

            {/* Countdown timer inline warning */}
            {linkStatus === 'expiring' && (
              <span className="text-[10px] font-bold text-amber-650">
                Deactivates in: {timeLeft}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <a 
                href={shortLink} 
                target="_blank" 
                rel="noreferrer" 
                className="font-sans font-bold text-base text-[#0F172A] hover:text-[#4F46E5] flex items-center gap-1 group select-all"
              >
                <span>/{url.shortCode}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-[#4F46E5] transition-opacity" />
              </a>
            </div>
            
            <div 
              className="text-xs text-[#64748B] truncate max-w-full font-mono hover:text-[#0F172A] cursor-help" 
              title={url.originalUrl}
            >
              {url.originalUrl}
            </div>
          </div>

          {/* Table-like stats row */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[#64748B] text-[11px] font-medium border-t border-slate-50 pt-3">
            <span className="font-bold text-[#0F172A] bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-0.5 rounded-lg">
              {url.clicks} clicks
            </span>
            
            {url.expiresAt && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Expiry: {new Date(url.expiresAt).toLocaleDateString()} at {new Date(url.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </span>
            )}

            <span>Created: {new Date(url.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Actions Button Grid */}
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-3 w-full md:w-auto flex-shrink-0 self-stretch md:self-auto border-t border-[#E2E8F0]/60 md:border-none pt-3 md:pt-0">
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCopyLink} 
              className={`inline-flex items-center gap-1 px-3 py-1.5 border rounded-lg text-xs font-bold cursor-pointer transition-all duration-200 ${copied ? 'bg-emerald-50 border-emerald-250 text-emerald-650' : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0]/30'}`}
              title="Copy Short URL"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            
            <button 
              onClick={() => setShowQR(!showQR)} 
              className={`inline-flex items-center justify-center w-8 h-8 border rounded-lg cursor-pointer transition-all duration-200 ${showQR ? 'bg-indigo-50 border-indigo-200 text-[#4F46E5]' : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0]/30'}`}
              title="Toggle Smart QR Box"
            >
              <QrCode className="w-4 h-4" />
            </button>

            <button 
              onClick={handleShareAnalytics} 
              className="inline-flex items-center justify-center w-8 h-8 bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#E2E8F0]/30 rounded-lg text-[#64748B] hover:text-[#0F172A] cursor-pointer transition-all"
              title="Share Analytics Dashboard"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button 
              onClick={() => onOpenAnalytics(url._id)} 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-lg text-xs cursor-pointer transition-all shadow-sm shadow-indigo-100"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Stats</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowEditModal(true)} 
              className="inline-flex items-center justify-center w-7 h-7 bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#E2E8F0]/30 text-[#64748B] hover:text-[#0F172A] rounded-lg cursor-pointer transition-all"
              title="Edit short link destination"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            <button 
              onClick={handleDelete} 
              className="inline-flex items-center justify-center w-7 h-7 bg-red-50 hover:bg-red-100/60 border border-red-100 text-red-500 rounded-lg cursor-pointer transition-all"
              title="Delete Short Link"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Smart QR Code Toolbox Card */}
      {showQR && (
        <div className="mt-4 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex flex-col sm:flex-row items-center gap-5 animate-slide-up select-none">
          <div 
            onClick={() => setShowQRModal(true)}
            className="rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] p-2.5 shadow-sm w-32 h-32 flex-shrink-0 flex items-center justify-center cursor-zoom-in group relative overflow-hidden"
            title="Click to view large size"
          >
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shortLink)}`} 
              alt={`QR Code /${url.shortCode}`}
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-[#0F172A]/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <QrCode className="w-6 h-6 text-[#4F46E5]" />
            </div>
          </div>
          
          <div className="space-y-3.5 text-center sm:text-left flex-grow">
            <div className="space-y-1">
              <h4 className="font-bold text-[#0F172A] text-sm">Smart QR Code Generated</h4>
              <p className="text-[#64748B] text-xs leading-relaxed max-w-md">
                This QR code redirects instantly to your short link. Download the print-ready PNG, copy the vector to your clipboard, or share it.
              </p>
            </div>
            
            {/* QR Actions */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <button 
                onClick={handleDownloadQR} 
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-bold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </button>
              <button 
                onClick={handleCopyQR} 
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-bold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy QR Image</span>
              </button>
              <button 
                onClick={handleShareQR} 
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-bold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share QR</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Lightbox Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex justify-center items-center z-[1100] p-4 animate-fade-in" onClick={() => setShowQRModal(false)}>
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-3xl p-6 shadow-2xl max-w-xs w-full text-center space-y-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-2.5">
              <h3 className="font-bold text-[#0F172A] text-sm">QR Code: /{url.shortCode}</h3>
              <button onClick={() => setShowQRModal(false)} className="text-[#64748B] hover:text-[#0F172A] font-bold text-xs bg-transparent border-none cursor-pointer outline-none">Close</button>
            </div>
            <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-sm flex items-center justify-center mx-auto w-48 h-48">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shortLink)}`} 
                alt={`Large QR Code`}
                className="w-full h-full object-contain"
              />
            </div>
            <button 
              onClick={handleDownloadQR} 
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download High-Res PNG</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit URL Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex justify-center items-center z-[1100] p-4 animate-fade-in">
          <div className="bg-[#FFFFFF] p-6 rounded-2xl shadow-2xl border border-[#E2E8F0] w-full max-w-md animate-slide-up">
            <div className="border-b border-[#E2E8F0] pb-3 mb-4">
              <h3 className="font-sans font-bold text-sm text-[#0F172A]">Edit Short Link Details</h3>
            </div>

            {editError && (
              <div className="bg-red-50 border border-red-250 text-red-655 text-xs px-4 py-2.5 rounded-xl mb-4 text-center font-semibold animate-shake">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2" htmlFor={`edit-url-${url._id}`}>
                  Destination URL
                </label>
                <input
                  id={`edit-url-${url._id}`}
                  type="text"
                  className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl px-4 py-2.5 outline-none text-sm font-medium"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  disabled={editLoading}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2" htmlFor={`edit-desc-${url._id}`}>
                  Description
                </label>
                <input
                  id={`edit-desc-${url._id}`}
                  type="text"
                  className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl px-4 py-2.5 outline-none text-sm font-medium"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  disabled={editLoading}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2" htmlFor={`edit-expiry-${url._id}`}>
                  Expiration Date & Time
                </label>
                <input
                  id={`edit-expiry-${url._id}`}
                  type="datetime-local"
                  className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl px-4 py-2.5 outline-none text-sm text-[#0F172A] font-semibold"
                  value={editExpiry}
                  onChange={(e) => setEditExpiry(e.target.value)}
                  disabled={editLoading}
                />
              </div>

              <div className="flex gap-2 justify-end border-t border-[#E2E8F0] pt-4 mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)} 
                  className="px-4 py-2 bg-[#F8FAFC] hover:bg-[#E2E8F0]/30 border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-sm shadow-indigo-100"
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkCard;

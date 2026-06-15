import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Copy, Check, QrCode, BarChart3, Edit3, Trash2, Share2, 
  Calendar, ExternalLink, AlertTriangle, Download, Eye, Clock
} from 'lucide-react';

const LinkTableRow = ({ url, onDelete, onUpdate, onOpenAnalytics, showToast }) => {
  const { authenticatedFetch } = useAuth();
  
  const [copied, setCopied] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Real-time Expiry Timer states
  const [timeLeft, setTimeLeft] = useState('');
  const [linkStatus, setLinkStatus] = useState('active'); // active, expiring, expired
  
  // Edit form states
  const [editUrl, setEditUrl] = useState(url.originalUrl);
  const [editDesc, setEditDesc] = useState(url.description || '');
  const [editExpiry, setEditExpiry] = useState(
    url.expiryDate ? new Date(url.expiryDate).toISOString().slice(0, 16) : ''
  );
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const shortLink = `${window.location.origin.includes('localhost') ? 'http://localhost:5000' : window.location.origin}/${url.shortCode}`;

  // Expiry Timer logic
  useEffect(() => {
    if (!url.expiryDate) {
      setLinkStatus('active');
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(url.expiryDate);
      const diffMs = expiry - now;

      if (diffMs <= 0) {
        setLinkStatus('expired');
        setTimeLeft('Expired');
        return;
      }

      // Expiring soon if < 24 hours
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
  }, [url.expiryDate]);

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

  const handleDownloadQR = async () => {
    try {
      // Connect directly to the backend QR download API endpoint
      const response = await authenticatedFetch(`/api/url/download-qr/${url.shortCode}`);
      if (!response.ok) throw new Error('Failed to download QR code');
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
      // Connect directly to backend QR API endpoint to fetch image blob
      const response = await authenticatedFetch(`/api/url/download-qr/${url.shortCode}`);
      if (!response.ok) throw new Error('Failed to fetch QR code');
      const blob = await response.blob();
      
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      if (showToast) showToast('QR Code image copied directly to clipboard!');
    } catch (err) {
      console.error('Copy image failed, fallback to url copy:', err);
      const qrLink = `${window.location.origin.includes('localhost') ? 'http://localhost:5000' : window.location.origin}/api/url/download-qr/${url.shortCode}`;
      await navigator.clipboard.writeText(qrLink);
      if (showToast) showToast('Image copy blocked. Copied QR download link instead.');
    }
  };

  const handleCopyQRLink = async () => {
    try {
      const qrLink = `${window.location.origin.includes('localhost') ? 'http://localhost:5000' : window.location.origin}/api/url/download-qr/${url.shortCode}`;
      await navigator.clipboard.writeText(qrLink);
      if (showToast) showToast('QR Code download link copied to clipboard!');
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Failed to copy QR Code link.', 'error');
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
          expiryDate: editExpiry || null
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
    <tr className="hover:bg-[#F8FAFC]/60 transition-colors border-b border-[#E2E8F0] last:border-none group/row">
      {/* Original URL & Description */}
      <td className="px-6 py-4 max-w-xs sm:max-w-md">
        <div className="flex flex-col min-w-0">
          {url.description ? (
            <span className="text-xs font-bold text-[#4F46E5] truncate mb-0.5" title={url.description}>
              {url.description}
            </span>
          ) : (
            <span className="text-xs font-semibold text-[#64748B] italic mb-0.5">No description</span>
          )}
          <span className="text-xs text-[#64748B] truncate font-mono hover:text-[#0F172A]" title={url.originalUrl}>
            {url.originalUrl}
          </span>
        </div>
      </td>

      {/* Short URL */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <a 
            href={shortLink} 
            target="_blank" 
            rel="noreferrer" 
            className="text-xs font-bold text-[#0F172A] hover:text-[#4F46E5] flex items-center gap-1 font-mono transition-colors"
          >
            <span>/{url.shortCode}</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover/row:opacity-100 transition-opacity" />
          </a>
        </div>
      </td>

      {/* QR Code Preview */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="relative flex items-center">
          <button 
            onClick={() => setShowQRModal(true)}
            className="p-1 hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg transition-all group/qr flex items-center justify-center cursor-pointer"
            title="Preview QR Code"
          >
            <QrCode className="w-4 h-4 text-[#64748B] group-hover/qr:text-[#4F46E5]" />
          </button>
        </div>
      </td>

      {/* Created Date */}
      <td className="px-6 py-4 whitespace-nowrap text-xs text-[#64748B] font-medium">
        {new Date(url.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
      </td>

      {/* Expiry Date / Countdown */}
      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold">
        {url.expiryDate ? (
          linkStatus === 'expiring' ? (
            <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse font-mono">
              <Clock className="w-3 h-3" />
              <span>{timeLeft}</span>
            </span>
          ) : linkStatus === 'expired' ? (
            <span className="text-red-500 font-mono">Expired</span>
          ) : (
            <span className="text-[#64748B] font-medium">
              {new Date(url.expiryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )
        ) : (
          <span className="text-[#64748B] font-medium">-</span>
        )}
      </td>

      {/* Click Count */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-50 border border-[#E2E8F0] text-[#0F172A]">
          {url.clicks}
        </span>
      </td>

      {/* Status Badge */}
      <td className="px-6 py-4 whitespace-nowrap">
        {linkStatus === 'expired' && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider bg-red-50 border-red-200 text-red-600">
            Expired
          </span>
        )}
        {linkStatus === 'expiring' && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider bg-amber-50 border-amber-200 text-amber-600">
            Expiring Soon
          </span>
        )}
        {linkStatus === 'active' && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider bg-emerald-50 border-emerald-250 text-emerald-600">
            Active
          </span>
        )}
      </td>

      {/* Action Buttons */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
        <div className="flex items-center justify-end gap-1.5">
          <button 
            onClick={handleCopyLink} 
            className={`p-1.5 border rounded-lg transition-all ${copied ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'}`}
            title="Copy shortened link"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          
          <button 
            onClick={() => onOpenAnalytics(url._id)} 
            className="p-1.5 bg-white border border-[#E2E8F0] hover:border-[#4F46E5] text-[#64748B] hover:text-[#4F46E5] rounded-lg transition-all"
            title="View redirection analytics"
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>

          <button 
            onClick={() => setShowEditModal(true)} 
            className="p-1.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] rounded-lg transition-all"
            title="Edit short link settings"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          <button 
            onClick={handleDelete} 
            className="p-1.5 bg-red-50/50 hover:bg-red-50 border border-red-100 hover:border-red-200 text-red-500 rounded-lg transition-all"
            title="Delete short URL link"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>

      {/* QR Code Toolbox Modal */}
      {showQRModal && (
        <td className="p-0 border-none w-0 h-0">
          {/* We render modal at bottom of page but inside same DOM tree to keep it simple */}
          <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex justify-center items-center z-[1100] p-4 animate-fade-in" onClick={() => setShowQRModal(false)}>
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center space-y-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-2.5">
                <h3 className="font-bold text-[#0F172A] text-sm">QR Code: /{url.shortCode}</h3>
                <button onClick={() => setShowQRModal(false)} className="text-[#64748B] hover:text-[#0F172A] font-bold text-xs bg-transparent border-none cursor-pointer outline-none">Close</button>
              </div>
              <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-sm flex items-center justify-center mx-auto w-48 h-48">
                <img 
                  src={url.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shortLink)}`} 
                  alt={`QR Code`}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={handleDownloadQR} 
                  className="inline-flex flex-col items-center justify-center gap-1 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl text-[10px] transition-colors cursor-pointer border-none outline-none"
                  title="Download PNG QR image"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button 
                  onClick={handleCopyQRLink} 
                  className="inline-flex flex-col items-center justify-center gap-1 py-2 bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#E2E8F0]/30 text-[#64748B] hover:text-[#0F172A] font-bold rounded-xl text-[10px] transition-colors cursor-pointer outline-none"
                  title="Copy QR Code Download Link"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#4F46E5]" />
                  <span>Copy Link</span>
                </button>
                <button 
                  onClick={handleCopyQR} 
                  className="inline-flex flex-col items-center justify-center gap-1 py-2 bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#E2E8F0]/30 text-[#64748B] hover:text-[#0F172A] font-bold rounded-xl text-[10px] transition-colors cursor-pointer outline-none"
                  title="Copy QR Code Image"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Image</span>
                </button>
              </div>
            </div>
          </div>
        </td>
      )}

      {/* Edit URL Modal */}
      {showEditModal && (
        <td className="p-0 border-none w-0 h-0">
          <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex justify-center items-center z-[1100] p-4 animate-fade-in">
            <div className="bg-[#FFFFFF] p-6 rounded-2xl shadow-2xl border border-[#E2E8F0] w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <div className="border-b border-[#E2E8F0] pb-3 mb-4">
                <h3 className="font-sans font-bold text-sm text-[#0F172A]">Edit Short Link Details</h3>
              </div>

              {editError && (
                <div className="bg-red-50 border border-red-200 text-red-500 text-xs px-4 py-2.5 rounded-xl mb-4 text-center font-semibold animate-shake">
                  {editError}
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2" htmlFor={`table-edit-url-${url._id}`}>
                    Destination URL
                  </label>
                  <input
                    id={`table-edit-url-${url._id}`}
                    type="text"
                    className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl px-4 py-2.5 outline-none text-sm font-medium"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    disabled={editLoading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2" htmlFor={`table-edit-desc-${url._id}`}>
                    Description
                  </label>
                  <input
                    id={`table-edit-desc-${url._id}`}
                    type="text"
                    className="w-full bg-[#FFFFFF] border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl px-4 py-2.5 outline-none text-sm font-medium"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    disabled={editLoading}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2" htmlFor={`table-edit-expiry-${url._id}`}>
                    Expiration Date & Time
                  </label>
                  <input
                    id={`table-edit-expiry-${url._id}`}
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
        </td>
      )}
    </tr>
  );
};

const LinkTable = ({ urls, onDelete, onUpdate, onOpenAnalytics, showToast }) => {
  return (
    <div className="w-full bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden select-none">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3.5">Original URL</th>
              <th className="px-6 py-3.5">Short URL</th>
              <th className="px-6 py-3.5">QR</th>
              <th className="px-6 py-3.5">Created Date</th>
              <th className="px-6 py-3.5">Expiry Date</th>
              <th className="px-6 py-3.5">Clicks</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] bg-white">
            {urls.map((url) => (
              <LinkTableRow
                key={url._id}
                url={url}
                onDelete={onDelete}
                onUpdate={onUpdate}
                onOpenAnalytics={onOpenAnalytics}
                showToast={showToast}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LinkTable;

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, ChevronDown, Sparkles, Calendar, FileText, Plus, AlertCircle, CheckCircle } from 'lucide-react';

const LinkForm = ({ onUrlCreated }) => {
  const { authenticatedFetch } = useAuth();
  
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    setSuccessMsg('');
    setLoading(true);

    if (!originalUrl) {
      setErrors({ originalUrl: 'Destination URL is required' });
      setLoading(false);
      return;
    }

    if (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://')) {
      setErrors({ originalUrl: 'URL must start with http:// or https://' });
      setLoading(false);
      return;
    }

    try {
      const response = await authenticatedFetch('/api/url/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          originalUrl,
          customAlias: customAlias || undefined,
          description: description || undefined,
          expiryDate: expiresAt || undefined
        })
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMsg(`URL shortened successfully!`);
        setOriginalUrl('');
        setCustomAlias('');
        setDescription('');
        setExpiresAt('');
        setShowAdvanced(false);
        
        if (onUrlCreated) {
          onUrlCreated(result.data);
        }
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const backendErrors = {};
        let hasFieldErrors = false;
        
        if (result.errors) {
          result.errors.forEach(err => {
            if (err.field) {
              backendErrors[err.field] = err.message;
              hasFieldErrors = true;
            }
          });
        }

        if (hasFieldErrors) {
          setErrors(backendErrors);
        } else {
          setGeneralError(result.error || 'Failed to shorten URL. Make sure the custom alias is not taken.');
        }
      }
    } catch (err) {
      setGeneralError('Connection error. Failed to create short URL.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl shadow-card p-6 w-full animate-fade-in select-none">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#4F46E5] shadow-sm">
          <Link className="w-4 h-4" />
        </div>
        <h3 className="font-sans font-bold text-sm text-[#0F172A]">Shorten a Long Link</h3>
      </div>

      {generalError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200/60 rounded-xl px-4 py-3 text-red-650 text-xs mb-4 font-medium">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <span>{generalError}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-250 text-emerald-650 text-xs mb-4 font-semibold">
          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2" htmlFor="input-url">
            Destination URL
          </label>
          <input
            id="input-url"
            type="text"
            className={`w-full bg-[#FFFFFF] border ${errors.originalUrl ? 'border-red-400 focus:border-red-500' : 'border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]'} rounded-xl px-4 py-2.5 outline-none transition-all duration-200 text-sm font-medium`}
            placeholder="https://example.com/very/long/path/to/some/resource"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            disabled={loading}
          />
          {errors.originalUrl && <span className="block text-red-500 text-xs mt-1.5 font-medium">{errors.originalUrl}</span>}
        </div>

        {/* Advanced Accordion Toggle */}
        <button
          type="button"
          className="w-full flex items-center justify-between py-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer select-none outline-none border-none bg-transparent"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span>Advanced Settings (Alias, Expiry, Desc)</span>
          <ChevronDown 
            className={`w-4 h-4 text-[#64748B] transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} 
          />
        </button>

        {/* Collapsible Area */}
        <div className={`overflow-hidden transition-all duration-300 space-y-4 ${showAdvanced ? 'max-h-[350px] opacity-100 mt-2' : 'max-h-0 opacity-0 pointer-events-none'}`}>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2" htmlFor="input-alias">
              <Sparkles className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Custom Alias (Optional)</span>
            </label>
            <input
              id="input-alias"
              type="text"
              className={`w-full bg-[#FFFFFF] border ${errors.customAlias ? 'border-red-400 focus:border-red-500' : 'border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]'} rounded-xl px-4 py-2.5 outline-none transition-all duration-200 text-sm font-medium`}
              placeholder="e.g. spring-promo"
              value={customAlias}
              onChange={(e) => setCustomAlias(e.target.value)}
              disabled={loading}
            />
            {errors.customAlias && <span className="block text-red-500 text-xs mt-1.5 font-medium">{errors.customAlias}</span>}
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2" htmlFor="input-expiry">
              <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Expiration Date (Optional)</span>
            </label>
            <input
              id="input-expiry"
              type="datetime-local"
              className={`w-full bg-[#FFFFFF] border ${errors.expiresAt ? 'border-red-400 focus:border-red-500' : 'border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]'} rounded-xl px-4 py-2.5 outline-none transition-all duration-200 text-sm text-[#0F172A] font-semibold`}
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              disabled={loading}
            />
            {errors.expiresAt && <span className="block text-red-500 text-xs mt-1.5 font-medium">{errors.expiresAt}</span>}
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2" htmlFor="input-desc">
              <FileText className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Short Description (Optional)</span>
            </label>
            <input
              id="input-desc"
              type="text"
              className={`w-full bg-[#FFFFFF] border ${errors.description ? 'border-red-400 focus:border-red-500' : 'border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]'} rounded-xl px-4 py-2.5 outline-none transition-all duration-200 text-sm font-medium`}
              placeholder="Internal campaign details"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
            {errors.description && <span className="block text-red-500 text-xs mt-1.5 font-medium">{errors.description}</span>}
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl text-xs transition-all duration-200 cursor-pointer shadow-sm shadow-indigo-100 mt-3 outline-none"
          disabled={loading}
        >
          <Plus className="w-4 h-4" />
          <span>{loading ? 'Generating link...' : 'Generate Short Link'}</span>
        </button>
      </form>
    </div>
  );
};

export default LinkForm;

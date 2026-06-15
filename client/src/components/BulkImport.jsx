import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { UploadCloud, CheckCircle2, AlertTriangle, FileSpreadsheet } from 'lucide-react';

const BulkImport = ({ onBulkCreated, showToast }) => {
  const { authenticatedFetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);

  const parseCSV = (text) => {
    const lines = text.split('\n');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = [];
      let currentVal = '';
      let insideQuotes = false;
      
      for (let charIdx = 0; charIdx < line.length; charIdx++) {
        const char = line[charIdx];
        if (char === '"' || char === "'") {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      values.push(currentVal.trim().replace(/^["']|["']$/g, ''));

      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }
    return rows;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      if (showToast) showToast('Please select a valid CSV file.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const parsedData = parseCSV(text);

      if (parsedData.length === 0) {
        if (showToast) showToast('CSV file is empty or missing headers.', 'error');
        return;
      }

      const payload = parsedData.map(row => ({
        originalUrl: row.originalUrl || row.url || row.destination || '',
        customAlias: row.customAlias || row.alias || '',
        description: row.description || row.desc || '',
        expiresAt: row.expiresAt || row.expiry || ''
      }));

      setLoading(true);
      setResults(null);

      try {
        const response = await authenticatedFetch('/api/url/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ urls: payload })
        });
        const result = await response.json();

        if (result.success) {
          setResults(result.data);
          if (showToast) showToast(`Bulk shortening completed!`);
          if (onBulkCreated) {
            onBulkCreated();
          }
        } else {
          if (showToast) showToast(result.error || 'Failed to import bulk URLs.', 'error');
        }
      } catch (err) {
        console.error('Bulk upload error:', err);
        if (showToast) showToast('Failed to connect to the bulk API endpoint.', 'error');
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl shadow-card p-6 w-full animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[#F8FAFC] text-[#4F46E5]">
          <FileSpreadsheet className="w-4 h-4" />
        </div>
        <h4 className="font-sans font-bold text-base text-[#0F172A]">Bulk Shorten URLs</h4>
      </div>
      
      <p className="text-xs text-[#64748B] mb-4 leading-relaxed">
        Import a CSV file to shorten multiple links at once. Format headers exactly as: <code className="bg-[#F8FAFC] px-1 py-0.5 rounded text-[#4F46E5] font-mono text-[10px]">originalUrl, customAlias, description, expiresAt</code>
      </p>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv"
        className="hidden"
      />

      <div 
        className="border-2 border-dashed border-[#E2E8F0] hover:border-[#4F46E5]/80 rounded-xl p-8 text-center cursor-pointer transition-all duration-200 bg-[#F8FAFC] hover:bg-[#4F46E5]/5 flex flex-col items-center justify-center"
        onClick={triggerFileInput}
      >
        {loading ? (
          <div className="space-y-2">
            <div className="w-6 h-6 border-2 border-[#E2E8F0] border-t-[#4F46E5] rounded-full animate-spin mx-auto"></div>
            <div className="text-xs font-semibold text-[#4F46E5]">Processing CSV rows...</div>
          </div>
        ) : (
          <>
            <UploadCloud className="w-8 h-8 text-[#64748B] mb-2 transition-transform duration-200 group-hover:-translate-y-0.5" />
            <div className="font-semibold text-[#0F172A] text-sm">Upload CSV File</div>
            <div className="text-[#64748B] text-xs mt-1">Click to browse or drag & drop files (.csv)</div>
          </>
        )}
      </div>

      {results && (
        <div className="mt-4 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3 animate-slide-up">
          <div className="text-xs font-bold text-[#0F172A]">
            Import Results Summary:
          </div>
          <div className="flex gap-4 text-xs font-semibold">
            <span className="inline-flex items-center gap-1 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
              <span>Succeeded: {results.success.length}</span>
            </span>
            <span className={`inline-flex items-center gap-1 ${results.failed.length > 0 ? 'text-red-500' : 'text-[#64748B]'}`}>
              <AlertTriangle className="w-4 h-4" />
              <span>Failed: {results.failed.length}</span>
            </span>
          </div>

          {results.failed.length > 0 && (
            <div className="max-h-[120px] overflow-y-auto border border-red-100 bg-red-50/30 p-2.5 rounded-lg text-[10px] text-red-500 font-mono space-y-1">
              {results.failed.map((fail, i) => (
                <div key={i}>
                  Row {fail.index + 1}: {fail.error} ({fail.originalUrl ? fail.originalUrl.slice(0, 25) : ''}...)
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkImport;

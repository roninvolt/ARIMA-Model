import React, { useState, useEffect } from 'react';
import { X, Server, CheckCircle2, AlertCircle, RefreshCw, Globe, Terminal } from 'lucide-react';
import { getApiBase, setCustomApiUrl, getCustomApiUrl } from '../services/api';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [customUrl, setCustomUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    statusCode?: number;
  }>({ status: 'idle', message: '' });

  useEffect(() => {
    if (isOpen) {
      setCustomUrl(getCustomApiUrl());
      setTestResult({ status: 'idle', message: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentBase = getApiBase();

  const handleTestConnection = async (urlToTest?: string) => {
    setTesting(true);
    setTestResult({ status: 'idle', message: 'Testing backend connectivity...' });
    const target = (urlToTest !== undefined ? urlToTest : customUrl.trim() || currentBase).replace(/\/+$/, '');
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      
      const res = await fetch(`${target}/health`, {
        signal: controller.signal,
      }).catch(async () => {
        return await fetch(`${target}/`, { signal: controller.signal });
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        setTestResult({
          status: 'success',
          message: `Connected successfully! Status: ${res.status} OK.`,
          statusCode: res.status,
        });
      } else {
        const text = await res.text().catch(() => '');
        const isHtml = text.includes('<!doctype') || text.includes('<html');
        let detail = `Server responded with HTTP ${res.status}`;
        if (res.status === 405) {
          detail = `HTTP 405: Method Not Allowed. Requests are reaching static frontend assets instead of backend API.`;
        } else if (isHtml) {
          detail = `HTTP ${res.status}: Returned HTML (static site router) instead of API JSON.`;
        }
        setTestResult({
          status: 'error',
          message: detail,
          statusCode: res.status,
        });
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: err.name === 'AbortError' ? 'Connection timed out (6s).' : (err.message || 'Network error — could not reach server.'),
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const trimmed = customUrl.trim();
    if (trimmed) {
      setCustomApiUrl(trimmed);
    } else {
      setCustomApiUrl(null);
    }
    onSaved?.();
    onClose();
  };

  const handleResetToDefault = () => {
    setCustomApiUrl(null);
    setCustomUrl('');
    setTestResult({ status: 'idle', message: '' });
    onSaved?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Backend API Settings</h3>
              <p className="text-xs text-slate-400">Configure connection to ForecastAI statistical server</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Target */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1.5">
          <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
            <span>Currently Active Endpoint:</span>
            <span className="font-mono text-indigo-300 text-[11px] bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {currentBase}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Requests are sent here by default. If your API is hosted on Render or run locally, point to that server.
          </p>
        </div>

        {/* Custom Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">
            Custom API Server URL
          </label>
          <div className="relative">
            <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="e.g. https://forecastai-backend.onrender.com or http://localhost:8000"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
            <span>Quick presets:</span>
            <button
              type="button"
              onClick={() => {
                setCustomUrl('http://localhost:8000');
                handleTestConnection('http://localhost:8000');
              }}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1"
            >
              <Terminal className="w-3 h-3 text-sky-400" />
              localhost:8000
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomUrl('');
                handleTestConnection('/api');
              }}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              /api (Default)
            </button>
          </div>
        </div>

        {/* Test Result status */}
        {testResult.status !== 'idle' && (
          <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
            testResult.status === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            {testResult.status === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <span className="font-semibold block">
                {testResult.status === 'success' ? 'Connection Verified' : 'Connection Notice'}
              </span>
              <p className="text-[11px] opacity-90 leading-relaxed">{testResult.message}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => handleTestConnection()}
            disabled={testing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Testing...' : 'Test Connection'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Reset to /api
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

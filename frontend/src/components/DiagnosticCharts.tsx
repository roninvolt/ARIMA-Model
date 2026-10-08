import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { ChevronDown, ChevronUp, CheckCircle, AlertTriangle, HelpCircle, BarChart3 } from 'lucide-react';
import { DiagnosticsResponse } from '../types/api';

interface DiagnosticChartsProps {
  data: DiagnosticsResponse;
  orderStr: string;
}

export const DiagnosticCharts: React.FC<DiagnosticChartsProps> = ({ data, orderStr }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'residuals' | 'histogram' | 'acf'>('residuals');

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 backdrop-blur-xl">
      {/* Header bar with toggle */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white font-heading">
                Model Diagnostics & Residual Analysis
              </h3>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                data.is_white_noise
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {data.is_white_noise ? 'White Noise (Optimal)' : 'Residual Correlation Detected'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Residual errors should be uncorrelated and normally distributed with zero mean
            </p>
          </div>
        </div>

        <button
          type="button"
          className="p-2 rounded-lg bg-slate-950 text-slate-400 group-hover:text-white transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Expanded diagnostic panels */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-slate-800 space-y-6">
          
          {/* Ljung-Box test card */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
                  Ljung-Box Test for Autocorrelation
                </span>
                <span className="font-mono text-xs text-indigo-400">
                  Stat: {data.ljung_box_stat.toFixed(3)} • p-value: {data.ljung_box_p_value.toFixed(4)}
                </span>
              </div>

              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                data.is_white_noise ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {data.is_white_noise ? (
                  <>
                    <CheckCircle className="w-4 h-4" /> Passed White Noise Test
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" /> Remaining Autocorrelation
                  </>
                )}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {data.interpretation}
            </p>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('residuals')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'residuals'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Residual Plot Over Time
            </button>
            <button
              onClick={() => setActiveTab('histogram')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'histogram'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Residual Histogram & Spread
            </button>
            <button
              onClick={() => setActiveTab('acf')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'acf'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Residual Autocorrelation (ACF)
            </button>
          </div>

          {/* Tab 1: Residual Plot */}
          {activeTab === 'residuals' && (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.residuals_series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg bg-slate-950 border border-slate-800 p-2 text-xs font-mono">
                            <div>Date: {payload[0].payload.date}</div>
                            <div className="text-sky-400">Residual: {payload[0].value}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#38bdf8" 
                    dot={false} 
                    strokeWidth={1.5} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tab 2: Histogram */}
          {activeTab === 'histogram' && (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.histogram} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="bin_center" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg bg-slate-950 border border-slate-800 p-2 text-xs font-mono">
                            <div>Center: {payload[0].payload.bin_center}</div>
                            <div className="text-indigo-400">Frequency Count: {payload[0].value}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tab 3: ACF */}
          {activeTab === 'acf' && (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.acf_points} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="lag" stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'Lag', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                  <YAxis domain={[-1, 1]} stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const pt = payload[0].payload;
                        return (
                          <div className="rounded-lg bg-slate-950 border border-slate-800 p-2 text-xs font-mono">
                            <div>Lag: {pt.lag}</div>
                            <div className="text-emerald-400">ACF: {pt.acf}</div>
                            <div className="text-slate-500">95% Bound: ±{pt.conf_interval}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {data.acf_points.length > 0 && (
                    <>
                      <ReferenceLine y={data.acf_points[0].conf_interval} stroke="#f59e0b" strokeDasharray="3 3" />
                      <ReferenceLine y={-data.acf_points[0].conf_interval} stroke="#f59e0b" strokeDasharray="3 3" />
                    </>
                  )}
                  <ReferenceLine y={0} stroke="#475569" />
                  <Bar dataKey="acf" fill="#10b981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

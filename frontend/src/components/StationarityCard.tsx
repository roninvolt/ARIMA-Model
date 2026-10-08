import React from 'react';
import { Activity, CheckCircle, AlertTriangle, HelpCircle, ArrowRight } from 'lucide-react';
import { StationarityResponse } from '../types/api';

interface StationarityCardProps {
  data: StationarityResponse;
  differencing: number;
  onDifferencingChange: (diff: number) => void;
  isLoading?: boolean;
}

export const StationarityCard: React.FC<StationarityCardProps> = ({
  data,
  differencing,
  onDifferencingChange,
  isLoading,
}) => {
  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-6 backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-heading">
              Augmented Dickey-Fuller (ADF) Test
            </h3>
            <p className="text-xs text-slate-400">
              Assesses the presence of a unit root to test time-series stationarity
            </p>
          </div>
        </div>

        {/* Differencing selector toggle */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400 px-2 font-medium">Differencing (d):</span>
          {[0, 1, 2].map((d) => (
            <button
              key={d}
              onClick={() => onDifferencingChange(d)}
              disabled={isLoading}
              className={`px-3 py-1.5 rounded-lg font-mono font-medium transition-all ${
                differencing === d
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              d = {d} {d === 0 ? '(Raw)' : d === 1 ? '(1st)' : '(2nd)'}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPI metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Test Statistic */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
            ADF Statistic
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {data.adf_statistic.toFixed(4)}
          </div>
          <div className="text-[11px] text-slate-500">
            Critical (5%): {data.critical_values?.['5%']?.toFixed(2) ?? '-2.86'}
          </div>
        </div>

        {/* p-value */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
            p-value
          </div>
          <div className={`text-2xl font-bold font-mono ${
            data.is_stationary ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {data.p_value.toFixed(4)}
          </div>
          <div className="text-[11px] text-slate-500">
            Significance threshold: α = 0.05
          </div>
        </div>

        {/* Verdict Badge */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between ${
          data.is_stationary
            ? 'bg-emerald-950/20 border-emerald-800/40'
            : 'bg-amber-950/20 border-amber-800/40'
        }`}>
          <div className="text-xs font-semibold uppercase tracking-wider font-mono text-slate-300">
            Stationarity Verdict
          </div>
          <div className="flex items-center gap-2 mt-1">
            {data.is_stationary ? (
              <>
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-lg font-bold text-emerald-400 font-heading">
                  Stationary
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-lg font-bold text-amber-400 font-heading">
                  Non-Stationary
                </span>
              </>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {data.is_stationary ? 'Null hypothesis rejected' : 'Fail to reject null'}
          </div>
        </div>
      </div>

      {/* Human readable interpretation */}
      <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800/80 space-y-2">
        <div className="flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-slate-300">
            <span className="font-semibold text-white">Interpretation: </span>
            {data.interpretation}
          </div>
        </div>

        <div className="flex items-start gap-2 pt-2 border-t border-slate-900">
          <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-emerald-300/90">
            <span className="font-semibold text-emerald-300">Recommendation: </span>
            {data.recommendation}
          </div>
        </div>
      </div>

      {/* Critical values lookup pills */}
      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
        <span className="font-medium text-slate-500">Critical Values:</span>
        {Object.entries(data.critical_values || {}).map(([level, val]) => (
          <span key={level} className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 font-mono text-[11px]">
            {level}: <span className="text-slate-200">{val.toFixed(3)}</span>
          </span>
        ))}
        <span className="text-slate-500 text-[11px] ml-auto">
          Lags Used: {data.used_lag} • Obs: {data.n_obs}
        </span>
      </div>

    </div>
  );
};

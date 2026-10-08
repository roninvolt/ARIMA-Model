import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, Calendar, Database, ShieldCheck } from 'lucide-react';
import { DataQualityCheck } from '../types/api';

interface DataQualityBadgeProps {
  quality: DataQualityCheck;
  rowCount: number;
}

export const DataQualityBadge: React.FC<DataQualityBadgeProps> = ({ quality, rowCount }) => {
  const items = [
    {
      label: 'Date Column Detected',
      passed: quality.date_column_detected,
      detail: quality.date_column_detected ? 'Valid datetime structure' : 'Missing timestamps',
    },
    {
      label: 'Numeric Target Detected',
      passed: quality.target_column_detected,
      detail: quality.target_column_detected ? 'Quantitative values present' : 'No numeric sequence',
    },
    {
      label: 'Dataset Length',
      passed: rowCount >= 20,
      detail: `${rowCount.toLocaleString()} records (${rowCount >= 50 ? 'Optimal' : 'Acceptable'})`,
    },
    {
      label: 'Duplicate Timestamps',
      passed: quality.duplicate_dates_count === 0,
      detail: quality.duplicate_dates_count === 0 ? 'No duplicate dates' : `${quality.duplicate_dates_count} duplicates (auto-averaged)`,
    },
    {
      label: 'Missing Target Values',
      passed: quality.missing_values_count === 0,
      detail: quality.missing_values_count === 0 ? '0 missing values' : `${quality.missing_values_count} missing values (auto-imputed)`,
    },
    {
      label: 'Chronological Ordering',
      passed: quality.is_sorted_chronologically,
      detail: quality.is_sorted_chronologically ? 'Sorted sequentially' : 'Sorted chronologically on load',
    },
  ];

  return (
    <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 font-heading">
            Data Quality Audit
          </h3>
        </div>
        
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            quality.is_valid
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          {quality.is_valid ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Passed Quality Checks
            </>
          ) : (
            <>
              <XCircle className="w-3.5 h-3.5" />
              Requires Attention
            </>
          )}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs transition-colors ${
              item.passed
                ? 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
            }`}
          >
            {item.passed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-semibold text-slate-200">{item.label}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{item.detail}</div>
            </div>
          </div>
        ))}
      </div>

      {quality.warnings.length > 0 && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 space-y-1 text-xs text-amber-300">
          <div className="font-semibold flex items-center gap-1.5">
            <Info className="w-4 h-4 text-amber-400" />
            Automatic Adjustments:
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-amber-200/90 pl-1">
            {quality.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

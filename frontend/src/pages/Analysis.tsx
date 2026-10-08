import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  TrendingUp, 
  Layers, 
  Zap, 
  ArrowRight, 
  CheckCircle, 
  BarChart3, 
  Sliders, 
  RefreshCw 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { api } from '../services/api';
import { UploadResponse, AnalyzeResponse, StationarityResponse } from '../types/api';

interface AnalysisProps {
  onNavigate: (page: string) => void;
  onSelectDatasetForForecast: (ds: UploadResponse) => void;
}

export const Analysis: React.FC<AnalysisProps> = ({ 
  onNavigate, 
  onSelectDatasetForForecast 
}) => {
  const [activeDatasetKey, setActiveDatasetKey] = useState<'sales' | 'traffic' | 'energy'>('sales');
  const [dataset, setDataset] = useState<UploadResponse | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [stationarity, setStationarity] = useState<StationarityResponse | null>(null);
  const [differencing, setDifferencing] = useState(0);
  const [showMovingAverage, setShowMovingAverage] = useState(true);
  const [loading, setLoading] = useState(false);

  // Load dataset when key changes
  useEffect(() => {
    loadDataset(activeDatasetKey);
  }, [activeDatasetKey]);

  const loadDataset = async (key: string) => {
    setLoading(true);
    try {
      const ds = await api.loadSampleDataset(key);
      setDataset(ds);
      const dateCol = ds.detected_date_col || ds.columns[0];
      const targetCol = ds.detected_target_col || ds.columns[1];

      const [anRes, stRes] = await Promise.all([
        api.analyzeSeries({
          dataset_id: ds.dataset_id,
          date_column: dateCol,
          target_column: targetCol,
        }),
        api.testStationarity({
          dataset_id: ds.dataset_id,
          date_column: dateCol,
          target_column: targetCol,
          differencing: 0,
        }),
      ]);
      setAnalysis(anRes);
      setStationarity(stRes);
      setDifferencing(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDiffChange = async (d: number) => {
    if (!dataset || !analysis) return;
    setDifferencing(d);
    setLoading(true);
    try {
      const stRes = await api.testStationarity({
        dataset_id: dataset.dataset_id,
        date_column: analysis.date_column,
        target_column: analysis.target_column,
        differencing: d,
      });
      setStationarity(stRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Compute moving average and differencing for chart
  const enrichedChartPoints = useMemo(() => {
    if (!analysis) return [];
    const pts = analysis.points;
    const windowSize = 7;

    return pts.map((pt, idx) => {
      // 7-period moving average
      let ma: number | null = null;
      if (idx >= windowSize - 1) {
        let sum = 0;
        for (let i = 0; i < windowSize; i++) {
          sum += pts[idx - i].value;
        }
        ma = Math.round((sum / windowSize) * 100) / 100;
      }

      // Differencing computation for visualization
      let diffVal: number | null = pt.value;
      if (differencing === 1) {
        diffVal = idx > 0 ? Math.round((pt.value - pts[idx - 1].value) * 100) / 100 : null;
      } else if (differencing === 2) {
        if (idx > 1) {
          const d1_curr = pt.value - pts[idx - 1].value;
          const d1_prev = pts[idx - 1].value - pts[idx - 2].value;
          diffVal = Math.round((d1_curr - d1_prev) * 100) / 100;
        } else {
          diffVal = null;
        }
      }

      return {
        date: pt.date,
        raw: pt.value,
        displayedValue: diffVal,
        movingAvg: ma,
      };
    });
  }, [analysis, differencing]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-semibold uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" />
            <span>Statistical Diagnostic Laboratory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            Time-Series Exploratory Analysis
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Inspect trends, variance stability, differencing effects, and stationarity properties.
          </p>
        </div>

        {dataset && (
          <button
            onClick={() => {
              onSelectDatasetForForecast(dataset);
              onNavigate('forecast');
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5"
          >
            <span>Launch in Forecast Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dataset Picker Selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-slate-400 font-mono">Select Dataset:</span>
        {[
          { key: 'sales', label: 'Daily E-Commerce Sales', rows: '600 rows' },
          { key: 'traffic', label: 'Website Visitors', rows: '365 rows' },
          { key: 'energy', label: 'Monthly Power Grid', rows: '72 rows' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveDatasetKey(item.key as any)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeDatasetKey === item.key
                ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {item.label} <span className="text-[11px] opacity-75 font-mono">({item.rows})</span>
          </button>
        ))}
      </div>

      {/* Main Analysis Chart Card */}
      {analysis && (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white font-heading">
                {differencing === 0 ? 'Raw Series Trajectory' : `${differencing}-Order Differenced Series Δ^${differencing} Y(t)`}
              </h3>
              <p className="text-xs text-slate-400">
                {analysis.date_column} vs {analysis.target_column} • {analysis.frequency} frequency
              </p>
            </div>

            {/* Chart toggles */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400 px-2 font-mono">Differencing:</span>
                {[0, 1, 2].map((d) => (
                  <button
                    key={d}
                    onClick={() => handleDiffChange(d)}
                    disabled={loading}
                    className={`px-3 py-1.5 rounded-lg font-mono transition-colors ${
                      differencing === d
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    d={d}
                  </button>
                ))}
              </div>

              {differencing === 0 && (
                <button
                  onClick={() => setShowMovingAverage(!showMovingAverage)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    showMovingAverage
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  7-Day MA Overlay
                </button>
              )}
            </div>
          </div>

          {/* Interactive Chart */}
          <div className="h-80 sm:h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={enrichedChartPoints} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-xl bg-slate-950/95 border border-slate-800 p-3 shadow-xl text-xs font-mono space-y-1">
                          <div className="text-slate-400">Date: {payload[0].payload.date}</div>
                          <div className="text-sky-300 font-bold">
                            Value: {payload[0].payload.displayedValue}
                          </div>
                          {differencing === 0 && showMovingAverage && payload[0].payload.movingAvg && (
                            <div className="text-amber-400">
                              7-Day Moving Avg: {payload[0].payload.movingAvg}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="displayedValue"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                />
                {differencing === 0 && showMovingAverage && (
                  <Line
                    type="monotone"
                    dataKey="movingAvg"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="4 4"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-2 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-slate-400">Mean</div>
              <div className="text-base font-bold text-white mt-0.5">{analysis.mean.toFixed(2)}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-slate-400">Median</div>
              <div className="text-base font-bold text-white mt-0.5">{analysis.median.toFixed(2)}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-slate-400">Std Dev</div>
              <div className="text-base font-bold text-indigo-400 mt-0.5">{analysis.std.toFixed(2)}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-slate-400">Variance</div>
              <div className="text-base font-bold text-sky-400 mt-0.5">{analysis.variance.toFixed(2)}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-slate-400">Skewness</div>
              <div className="text-base font-bold text-amber-400 mt-0.5">{analysis.skewness.toFixed(3)}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-slate-400">Count</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">{analysis.count}</div>
            </div>
          </div>
        </div>
      )}

      {/* Stationarity Analysis Card */}
      {stationarity && (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white font-heading">
              Stationarity Evaluation (d = {differencing})
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              stationarity.is_stationary
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {stationarity.is_stationary ? 'Stationary Series' : 'Non-Stationary Series'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="font-mono text-slate-400 font-semibold uppercase">ADF Test Statistics</div>
              <div className="flex justify-between border-b border-slate-900 py-1">
                <span className="text-slate-400">Test Statistic:</span>
                <span className="font-mono font-bold text-white">{stationarity.adf_statistic.toFixed(4)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 py-1">
                <span className="text-slate-400">p-value:</span>
                <span className="font-mono font-bold text-indigo-400">{stationarity.p_value.toFixed(4)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">5% Critical Threshold:</span>
                <span className="font-mono text-slate-300">{stationarity.critical_values?.['5%']?.toFixed(3)}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="font-mono text-slate-400 font-semibold uppercase">Economic Takeaway</div>
              <p className="text-slate-300 leading-relaxed">
                {stationarity.interpretation}
              </p>
              <p className="text-emerald-400/90 leading-relaxed font-medium">
                {stationarity.recommendation}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

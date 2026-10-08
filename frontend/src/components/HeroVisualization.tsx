import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine, 
  CartesianGrid 
} from 'recharts';
import { Sparkles, Eye, Sliders, Shield } from 'lucide-react';

interface HeroDataPoint {
  period: string;
  historical?: number | null;
  forecast?: number | null;
  ciLower?: number | null;
  ciUpper?: number | null;
  isForecast: boolean;
}

export const HeroVisualization: React.FC = () => {
  const [showConfidence, setShowConfidence] = useState(true);
  const [activeModel, setActiveModel] = useState<'ARIMA(2,1,1)' | 'ARIMA(1,1,2)' | 'ARIMA(3,1,0)'>('ARIMA(2,1,1)');

  // Generate realistic time-series points (Historical 24 points + Forecast 10 points)
  const chartData = useMemo(() => {
    const points: HeroDataPoint[] = [];
    const baseValue = 120;
    
    // Historical points
    for (let i = 1; i <= 24; i++) {
      const trend = i * 2.8;
      const seasonal = 14 * Math.sin((i / 7) * Math.PI * 2);
      const noise = (Math.sin(i * 3.7) * 6 + Math.cos(i * 2.1) * 4);
      const val = Math.round(baseValue + trend + seasonal + noise);
      
      points.push({
        period: `T-${25 - i}`,
        historical: val,
        forecast: null,
        ciLower: null,
        ciUpper: null,
        isForecast: false,
      });
    }

    // Anchor point at T-0 (boundary between history & forecast)
    const lastHist = points[points.length - 1].historical!;
    points[points.length - 1].forecast = lastHist;
    points[points.length - 1].ciLower = lastHist;
    points[points.length - 1].ciUpper = lastHist;

    // Model dampening / variance multiplier based on selected model
    const trendMultiplier = activeModel === 'ARIMA(2,1,1)' ? 3.2 : activeModel === 'ARIMA(1,1,2)' ? 2.6 : 3.8;
    const spreadMultiplier = activeModel === 'ARIMA(1,1,2)' ? 1.4 : 1.1;

    // Future Forecast points
    for (let i = 1; i <= 10; i++) {
      const pred = Math.round(lastHist + (i * trendMultiplier) + 8 * Math.sin((i / 4) * Math.PI));
      const spread = Math.round((i * 4.2 + 8) * spreadMultiplier);
      
      points.push({
        period: `+${i}d`,
        historical: null,
        forecast: pred,
        ciLower: pred - spread,
        ciUpper: pred + spread,
        isForecast: true,
      });
    }

    return points;
  }, [activeModel]);

  return (
    <div className="relative w-full rounded-2xl bg-slate-900/80 border border-slate-800 p-4 sm:p-6 backdrop-blur-xl shadow-2xl shadow-indigo-950/40 overflow-hidden">
      
      {/* Background ambient light */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
              Live Model Projection
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 text-xs text-indigo-300 font-mono border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AIC 482.1 • BIC 494.3</span>
          </div>
        </div>

        {/* Model switcher & CI toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg bg-slate-950/80 p-0.5 border border-slate-800 text-xs">
            {(['ARIMA(2,1,1)', 'ARIMA(1,1,2)', 'ARIMA(3,1,0)'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setActiveModel(m)}
                className={`px-2.5 py-1 rounded-md transition-all font-mono text-[11px] ${
                  activeModel === m
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowConfidence(!showConfidence)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              showConfidence
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">95% CI</span>
          </button>
        </div>
      </div>

      {/* Main interactive chart */}
      <div className="h-64 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
            <defs>
              {/* Confidence interval gradient fill */}
              <linearGradient id="heroCiGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.04} />
              </linearGradient>

              {/* Historical curve gradient stroke */}
              <linearGradient id="heroHistGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis 
              dataKey="period" 
              stroke="#64748b" 
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />

            <YAxis 
              stroke="#64748b" 
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              domain={['auto', 'auto']}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload as HeroDataPoint;
                  return (
                    <div className="rounded-xl bg-slate-950/95 border border-slate-700/80 p-3 shadow-xl backdrop-blur-md text-xs space-y-1">
                      <div className="font-mono text-slate-400 font-semibold flex items-center justify-between gap-4">
                        <span>Period: {pt.period}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-sans ${
                          pt.isForecast 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        }`}>
                          {pt.isForecast ? 'Forecast' : 'Historical'}
                        </span>
                      </div>

                      {pt.historical !== null && pt.historical !== undefined && (
                        <div className="flex items-center justify-between gap-4 text-sky-300">
                          <span>Actual:</span>
                          <span className="font-mono font-bold">{pt.historical}</span>
                        </div>
                      )}

                      {pt.forecast !== null && pt.forecast !== undefined && (
                        <div className="flex items-center justify-between gap-4 text-emerald-400">
                          <span>Predicted:</span>
                          <span className="font-mono font-bold">{pt.forecast}</span>
                        </div>
                      )}

                      {showConfidence && pt.ciLower !== null && pt.ciUpper !== null && (
                        <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-1 flex justify-between gap-3">
                          <span>95% CI Range:</span>
                          <span className="font-mono">{pt.ciLower} – {pt.ciUpper}</span>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Vertical demarcation line separating History and Forecast */}
            <ReferenceLine 
              x="T-1" 
              stroke="#94a3b8" 
              strokeDasharray="4 4" 
              strokeWidth={1.5}
              label={{
                value: 'Forecast Begins Here',
                position: 'insideTopLeft',
                fill: '#e2e8f0',
                fontSize: 10,
                fontWeight: 600,
                offset: 10,
                className: 'font-mono'
              }}
            />

            {/* Shaded Upper Confidence Band */}
            {showConfidence && (
              <Area
                type="monotone"
                dataKey="ciUpper"
                stroke="transparent"
                fill="url(#heroCiGrad)"
                connectNulls
              />
            )}

            {/* Shaded Lower Confidence Band */}
            {showConfidence && (
              <Area
                type="monotone"
                dataKey="ciLower"
                stroke="transparent"
                fill="#030712"
                connectNulls
              />
            )}

            {/* Historical Series Line */}
            <Line
              type="monotone"
              dataKey="historical"
              stroke="url(#heroHistGrad)"
              strokeWidth={2.5}
              dot={{ r: 2.5, fill: '#38bdf8', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#38bdf8', stroke: '#fff', strokeWidth: 2 }}
              connectNulls={false}
              isAnimationActive={true}
            />

            {/* Forecast Projection Line */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#10b981"
              strokeWidth={2.5}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              connectNulls={true}
              isAnimationActive={true}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Stats footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-sky-400 rounded-full" />
            <span className="text-slate-300">Historical Actuals</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-emerald-400 border-dashed border-b border-emerald-400" />
            <span className="text-slate-300 font-semibold text-emerald-400">ARIMA Projection</span>
          </div>
          {showConfidence && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xs" />
              <span className="text-slate-300">95% Confidence Band</span>
            </div>
          )}
        </div>

        <div className="font-mono text-[11px] text-slate-400">
          MAPE: <span className="text-emerald-400 font-bold">5.82%</span> • Holdout Test Split
        </div>
      </div>

    </div>
  );
};

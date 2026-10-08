import React from 'react';
import { 
  Info, 
  Cpu, 
  Layers, 
  TrendingUp, 
  Activity, 
  HelpCircle, 
  CheckCircle2, 
  Zap, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface AboutProps {
  onNavigate: (page: string) => void;
}

export const About: React.FC<AboutProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16 animate-in fade-in duration-300">
      
      {/* Hero Intro */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
          <Info className="w-3.5 h-3.5 text-sky-400" />
          <span>Foundational Guide</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-heading tracking-tight">
          Understanding ARIMA
        </h1>

        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          The statistical cornerstone of quantitative forecasting, econometrics, and demand planning.
        </p>
      </div>

      {/* What is ARIMA? */}
      <section className="rounded-3xl bg-slate-900/80 border border-slate-800 p-8 sm:p-10 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white font-heading">
              What is ARIMA?
            </h2>
            <p className="text-xs text-indigo-400 font-mono font-medium">
              AutoRegressive Integrated Moving Average
            </p>
          </div>
        </div>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          ARIMA is a class of statistical models designed to analyze and forecast time-series data. Developed by mathematicians George Box and Gwilym Jenkins in the 1970s (often termed the <i>Box-Jenkins methodology</i>), it captures temporal dependencies, memory effects, and random noise disturbances within a single series.
        </p>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          Unlike complex deep-learning models that require massive training clusters and opaque weights, ARIMA provides mathematically rigorous forecasts, clear parameters, and well-calibrated statistical confidence intervals.
        </p>
      </section>

      {/* The (p, d, q) Components */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-heading">
            Deconstructing ARIMA(p, d, q)
          </h2>
          <p className="text-sm text-slate-400">
            Every ARIMA model is defined by three integers: (p, d, q). Here is what each letter represents in plain English.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* p Component */}
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-black font-mono text-sky-400">p</span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                AutoRegressive
              </span>
            </div>

            <h3 className="text-lg font-bold text-white font-heading">
              Looking into the Past
            </h3>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              The <b className="text-slate-200">p</b> parameter specifies how many prior time steps (lags) are used to forecast the next observation.
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
              Example (p=1): Today's sales value depends linearly on yesterday's sales value.
            </div>
          </div>

          {/* d Component */}
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-black font-mono text-emerald-400">d</span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Integrated (Diff)
              </span>
            </div>

            <h3 className="text-lg font-bold text-white font-heading">
              Stabilizing the Trend
            </h3>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              The <b className="text-slate-200">d</b> parameter represents the number of times the raw series is differenced to make it stationary (removing trends).
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
              Example (d=1): Modeling the day-over-day changes (ΔY = Y_t - Y_t-1) rather than absolute levels.
            </div>
          </div>

          {/* q Component */}
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-black font-mono text-violet-400">q</span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20">
                Moving Average
              </span>
            </div>

            <h3 className="text-lg font-bold text-white font-heading">
              Absorbing Shocks
            </h3>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              The <b className="text-slate-200">q</b> parameter specifies the size of the moving-average window of past forecast error terms (noise shocks).
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
              Example (q=1): Today's prediction adjusts for the unexpected surprise error that happened yesterday.
            </div>
          </div>

        </div>
      </section>

      {/* Why Use ARIMA? */}
      <section className="rounded-3xl bg-slate-900/80 border border-slate-800 p-8 sm:p-10 space-y-6">
        <h2 className="text-2xl font-bold text-white font-heading">
          Why Industry Leaders Rely on ARIMA
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-sm font-semibold text-white">Mathematical Interpretability</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Coefficients correspond to physical persistence, decay rates, and error shock memories—not mysterious neural embeddings.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-sm font-semibold text-white">Calibrated Confidence Bounds</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Produces true 95% statistical prediction intervals, allowing risk-conscious safety stock sizing and capital reserves.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-sm font-semibold text-white">Sample Efficiency</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Performs reliably on modest datasets (50 to 500 points) where deep neural networks would catastrophically overfit.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-sm font-semibold text-white">Instant Computational Speed</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fits in fractions of a second using maximum likelihood estimation without requiring GPUs or cloud training jobs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <div className="text-center pt-4">
        <button
          onClick={() => onNavigate('forecast')}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all hover:-translate-y-0.5"
        >
          <span>Try ForecastAI on Your Data</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};

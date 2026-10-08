import React, { useState } from 'react';
import { 
  BookOpen, 
  FileCode, 
  Database, 
  TrendingUp, 
  Check, 
  Download, 
  HelpCircle, 
  Code, 
  Terminal, 
  Activity, 
  Target, 
  Cpu 
} from 'lucide-react';
import { api } from '../services/api';
import { UploadResponse } from '../types/api';

interface DocumentationProps {
  onNavigate: (page: string) => void;
  onSelectDatasetForForecast: (ds: UploadResponse) => void;
}

export const Documentation: React.FC<DocumentationProps> = ({ 
  onNavigate, 
  onSelectDatasetForForecast 
}) => {
  const [loadingDemo, setLoadingDemo] = useState(false);

  const handleLoadAndGo = async (key: string) => {
    setLoadingDemo(true);
    try {
      const ds = await api.loadSampleDataset(key);
      onSelectDatasetForForecast(ds);
      onNavigate('forecast');
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="space-y-4 border-b border-slate-800 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
          <BookOpen className="w-3.5 h-3.5 text-sky-400" />
          <span>Technical Handbook</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-heading">
          ForecastAI Documentation
        </h1>
        <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-3xl">
          Everything you need to know about dataset formats, stationarity testing, model selection metrics, and operational forecasting.
        </p>
      </div>

      {/* 1. Dataset Format & Schema */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-mono text-sm font-bold">
            01
          </div>
          <h2 className="text-2xl font-bold text-white font-heading">
            Dataset Format & Ingestion
          </h2>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          ForecastAI accepts comma-separated values (CSV) files. Your dataset should contain at least two columns: a sequential timestamp or date column, and a numeric target metric.
        </p>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Recommended CSV Structure:</span>
            <span>UTF-8 encoded</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
            <pre>{`date,sales
2024-01-01,124.50
2024-01-02,138.20
2024-01-03,131.05
2024-01-04,145.80
2024-01-05,152.10`}</pre>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400 pt-1">
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><b>Supported Date Formats:</b> YYYY-MM-DD, YYYY/MM/DD, DD-MM-YYYY, or standard ISO 8601 timestamps.</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><b>Data Cleaning:</b> Non-numeric values, missing records, and unsorted rows are detected and repaired automatically.</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Downloadable Sample Datasets */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-mono text-sm font-bold">
            02
          </div>
          <h2 className="text-2xl font-bold text-white font-heading">
            Sample Reference Datasets
          </h2>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          Use our pre-bundled benchmark datasets to test different seasonal patterns, trends, and frequencies:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-sky-400 font-semibold uppercase">Daily Frequency</span>
              <h3 className="text-base font-bold text-white font-heading">Daily E-Commerce Sales</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                600 sequential daily transaction values showing positive secular drift and weekly retail shopping cycles.
              </p>
            </div>
            <button
              onClick={() => handleLoadAndGo('sales')}
              disabled={loadingDemo}
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Load in Studio</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase">Daily Frequency</span>
              <h3 className="text-base font-bold text-white font-heading">Website Visitors</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                365 observations of web cloud traffic featuring steady user growth and weekend engagement fluctuations.
              </p>
            </div>
            <button
              onClick={() => handleLoadAndGo('traffic')}
              disabled={loadingDemo}
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Load in Studio</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-amber-400 font-semibold uppercase">Monthly Frequency</span>
              <h3 className="text-base font-bold text-white font-heading">Monthly Power Grid Demand</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                72 monthly power demand records (MWh) with pronounced winter and summer cooling peak loads.
              </p>
            </div>
            <button
              onClick={() => handleLoadAndGo('energy')}
              disabled={loadingDemo}
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Load in Studio</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. Stationarity & Differencing */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-mono text-sm font-bold">
            03
          </div>
          <h2 className="text-2xl font-bold text-white font-heading">
            Stationarity & Augmented Dickey-Fuller (ADF)
          </h2>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          A time series is considered <b>strictly stationary</b> if its statistical properties—specifically its mean, variance, and autocorrelation structure—remain invariant over time.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="font-mono text-indigo-400 font-bold uppercase">The Null Hypothesis (H0)</div>
            <p className="text-slate-300 leading-relaxed">
              The ADF test tests the null hypothesis that a unit root is present in the autoregressive polynomial (i.e., the series is non-stationary).
            </p>
            <div className="p-2 rounded-lg bg-slate-950 font-mono text-slate-400">
              p &lt; 0.05 → Reject H0 (Stationary, d=0)
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="font-mono text-amber-400 font-bold uppercase">Differencing (d)</div>
            <p className="text-slate-300 leading-relaxed">
              When p &ge; 0.05, we fail to reject the null hypothesis. First-order differencing replaces raw values with their period-over-period delta:
            </p>
            <div className="p-2 rounded-lg bg-slate-950 font-mono text-slate-400">
              Δ Y(t) = Y(t) - Y(t - 1)
            </div>
          </div>
        </div>
      </section>

      {/* 4. Model Selection: AIC & BIC */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-mono text-sm font-bold">
            04
          </div>
          <h2 className="text-2xl font-bold text-white font-heading">
            Model Selection: AIC and BIC
          </h2>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          To prevent overfitting while capturing genuine time-series structure, candidate ARIMA models are scored using penalized maximum likelihood criteria:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="font-mono text-sky-400 font-bold uppercase">AIC (Akaike Information Criterion)</div>
            <div className="p-2 rounded-lg bg-slate-950 font-mono text-slate-300">
              AIC = 2k - 2 ln(L)
            </div>
            <p className="text-slate-400 leading-relaxed">
              Penalizes model complexity linearly by 2k parameters. Lower AIC indicates a superior trade-off between goodness of fit and simplicity.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="font-mono text-violet-400 font-bold uppercase">BIC (Bayesian Information Criterion)</div>
            <div className="p-2 rounded-lg bg-slate-950 font-mono text-slate-300">
              BIC = k ln(n) - 2 ln(L)
            </div>
            <p className="text-slate-400 leading-relaxed">
              Imposes a harsher penalty on larger numbers of parameters as sample size n grows, favoring parsimonious models.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Model Evaluation Metrics */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-mono text-sm font-bold">
            05
          </div>
          <h2 className="text-2xl font-bold text-white font-heading">
            Validation & Accuracy Metrics
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="font-mono text-emerald-400 font-bold uppercase">MAE</div>
            <p className="text-slate-300 font-medium">Mean Absolute Error</p>
            <div className="p-2 rounded-lg bg-slate-950 font-mono text-slate-400">
              (1/n) Σ | y_t - ŷ_t |
            </div>
            <p className="text-slate-400 leading-relaxed">
              Direct linear measure of average prediction error in original target units.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="font-mono text-sky-400 font-bold uppercase">RMSE</div>
            <p className="text-slate-300 font-medium">Root Mean Squared Error</p>
            <div className="p-2 rounded-lg bg-slate-950 font-mono text-slate-400">
              √[ (1/n) Σ (y_t - ŷ_t)² ]
            </div>
            <p className="text-slate-400 leading-relaxed">
              Quadratic penalty that heavily penalizes rare, large forecast misses.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="font-mono text-amber-400 font-bold uppercase">MAPE</div>
            <p className="text-slate-300 font-medium">Mean Absolute Percentage Error</p>
            <div className="p-2 rounded-lg bg-slate-950 font-mono text-slate-400">
              (100%/n) Σ | (y_t - ŷ_t) / y_t |
            </div>
            <p className="text-slate-400 leading-relaxed">
              Scale-independent percentage error ideal for executive briefings and cross-series benchmarking.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};

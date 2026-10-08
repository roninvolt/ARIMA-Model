import React, { useState } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  ArrowRight, 
  BarChart2, 
  Cpu, 
  LineChart, 
  Target, 
  Upload, 
  Download, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  FileText,
  Activity
} from 'lucide-react';
import { HeroVisualization } from '../components/HeroVisualization';

interface HomeProps {
  onNavigate: (page: string) => void;
  onLoadDemo: (key?: string) => void;
  isLoadingDemo?: boolean;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, onLoadDemo, isLoadingDemo }) => {
  const [selectedDemo, setSelectedDemo] = useState<'sales' | 'traffic' | 'energy'>('sales');

  const features = [
    {
      icon: BarChart2,
      title: 'Time-Series Analysis',
      description: 'Understand historical patterns, autocorrelation, drift, variance, and seasonal cycles with statistical clarity.',
      tag: 'Exploratory'
    },
    {
      icon: Cpu,
      title: 'ARIMA Modeling',
      description: 'Automatically explore candidate (p, d, q) combinations using Akaike (AIC) and Bayesian (BIC) information criteria.',
      tag: 'Automated'
    },
    {
      icon: LineChart,
      title: 'Future Forecasting',
      description: 'Project future values across customizable horizons with 95% statistical confidence interval bounds.',
      tag: 'Predictive'
    },
    {
      icon: Target,
      title: 'Model Evaluation',
      description: 'Measure out-of-sample forecast accuracy using Mean Absolute Error (MAE), RMSE, and Mean Absolute Percentage Error (MAPE).',
      tag: 'Validation'
    },
    {
      icon: Upload,
      title: 'Dataset Upload',
      description: 'Upload your own CSV files with automated timestamp detection, duplicate aggregation, and missing value imputation.',
      tag: 'Flexible'
    },
    {
      icon: Download,
      title: 'Export Results',
      description: 'Download forecast schedules as CSV spreadsheets or generate executive-ready PDF forecast reports with embedded charts.',
      tag: 'Executive'
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Upload',
      desc: 'Drag & drop your historical CSV file or test instantly with curated demo datasets.',
      icon: Upload,
      accent: 'from-blue-500 to-indigo-500',
    },
    {
      num: '02',
      title: 'Analyze',
      desc: 'The engine audits data quality, calculates summary statistics, and runs the Augmented Dickey-Fuller stationarity test.',
      icon: Activity,
      accent: 'from-indigo-500 to-violet-500',
    },
    {
      num: '03',
      title: 'Train',
      desc: 'Optimal ARIMA (p, d, q) parameters are searched via AIC/BIC and fitted on chronological training splits.',
      icon: Cpu,
      accent: 'from-violet-500 to-sky-500',
    },
    {
      num: '04',
      title: 'Forecast',
      desc: 'Generate out-of-sample projections, inspect residual diagnostics, and export executive PDF reports.',
      icon: TrendingUp,
      accent: 'from-sky-500 to-emerald-500',
    },
  ];

  return (
    <div className="space-y-24 sm:space-y-32 pb-24 overflow-hidden">
      
      {/* 1. Hero Section */}
      <section className="relative pt-12 sm:pt-20 lg:pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Background glow orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/15 via-sky-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="text-center max-w-3xl mx-auto space-y-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 shadow-sm backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Next-Generation Statistical Forecasting</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span className="text-slate-400">Powered by Statsmodels</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white font-heading leading-[1.1]">
            Predict the Future <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
              from Your Data.
            </span>
          </h1>

          {/* Supporting text */}
          <p className="text-base sm:text-lg lg:text-xl text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
            Upload your time-series data and generate intelligent forecasts using ARIMA statistical modeling. Automatically optimize parameters, assess stationarity, and generate publication-ready reports.
          </p>

          {/* Call to actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => onNavigate('forecast')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-500 hover:to-sky-400 shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              <span>Start Forecasting</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onLoadDemo(selectedDemo)}
              disabled={isLoadingDemo}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition-all duration-200"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{isLoadingDemo ? 'Loading Demo Data...' : 'Try Demo Dataset'}</span>
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('how-it-works');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors py-2 px-3"
            >
              Explore How It Works ↓
            </button>
          </div>

          {/* Sample quick picker */}
          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-400">
            <span>Demo dataset:</span>
            {(['sales', 'traffic', 'energy'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedDemo(key)}
                className={`px-2 py-0.5 rounded capitalize transition-colors ${
                  selectedDemo === key 
                    ? 'bg-slate-800 text-sky-400 font-semibold border border-slate-700' 
                    : 'hover:text-slate-200'
                }`}
              >
                {key}
              </button>
            ))}
          </div>

        </div>

        {/* Hero Interactive Chart Visualization */}
        <div className="mt-12 sm:mt-16 max-w-5xl mx-auto">
          <HeroVisualization />
        </div>

      </section>

      {/* 2. Features Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 font-mono">
            Platform Capabilities
          </h2>
          <h3 className="text-3xl sm:text-4xl font-bold text-white font-heading">
            Enterprise Rigor. Effortless Workflow.
          </h3>
          <p className="text-sm sm:text-base text-slate-400">
            A comprehensive analytical toolkit designed to take you from raw CSV to defensible statistical forecasts in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-2xl bg-slate-900/70 border border-slate-800/80 p-7 hover:bg-slate-850 hover:border-indigo-500/40 transition-all duration-300 shadow-lg shadow-black/20 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    {feat.tag}
                  </span>
                </div>

                <h4 className="text-lg font-bold text-white mb-2 font-heading group-hover:text-indigo-300 transition-colors">
                  {feat.title}
                </h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. How It Works Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-sky-400 font-mono">
            Intuitive Pipeline
          </h2>
          <h3 className="text-3xl sm:text-4xl font-bold text-white font-heading">
            How ForecastAI Works
          </h3>
          <p className="text-sm sm:text-base text-slate-400">
            Four simple steps from data ingestion to high-confidence predictive insight.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((st) => {
            const Icon = st.icon;
            return (
              <div
                key={st.num}
                className="relative rounded-2xl bg-slate-900/60 border border-slate-800 p-6 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-2xl font-black font-mono bg-gradient-to-r from-slate-200 to-slate-500 bg-clip-text text-transparent">
                      {st.num}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                      <Icon className="w-5 h-5 text-indigo-400" />
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-white mb-2 font-heading">
                    {st.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {st.desc}
                  </p>
                </div>

                <div className="h-1 w-full rounded-full bg-gradient-to-r bg-slate-800 overflow-hidden">
                  <div className={`h-full w-full bg-gradient-to-r ${st.accent} opacity-80`} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Bottom CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/30 p-8 sm:p-12 lg:p-16 overflow-hidden shadow-2xl shadow-indigo-950/50">
          
          {/* Subtle decoration circles */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Zap className="w-3.5 h-3.5" /> Ready for Deployment
            </span>

            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-heading tracking-tight leading-tight">
              Ready to generate statistical forecasts?
            </h3>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              No machine learning pipeline setup or coding required. Upload your CSV and receive automated model selection, diagnostic tests, and executive reports in minutes.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={() => onNavigate('forecast')}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 hover:-translate-y-0.5 transition-all duration-200"
              >
                <span>Launch Prediction Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('documentation')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Read Technical Docs</span>
              </button>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};

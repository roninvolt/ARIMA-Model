import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Cpu, 
  TrendingUp, 
  Download, 
  RefreshCw, 
  Sliders, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft, 
  Zap, 
  FileSpreadsheet, 
  FileDown, 
  Activity, 
  Check, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine, 
  Legend 
} from 'recharts';

import { api } from '../services/api';
import { 
  UploadResponse, 
  AnalyzeResponse, 
  StationarityResponse, 
  AutoArimaResponse, 
  TrainModelResponse, 
  ForecastResponse, 
  DiagnosticsResponse,
  CandidateModel
} from '../types/api';
import { StepProgress } from '../components/StepProgress';
import { DataQualityBadge } from '../components/DataQualityBadge';
import { StationarityCard } from '../components/StationarityCard';
import { DiagnosticCharts } from '../components/DiagnosticCharts';
import { ErrorAlert } from '../components/ErrorAlert';

interface ForecastProps {
  initialDataset?: UploadResponse | null;
  onClearInitialDataset?: () => void;
}

export const Forecast: React.FC<ForecastProps> = ({ 
  initialDataset, 
  onClearInitialDataset 
}) => {
  // Stepper state (1 to 6)
  const [currentStep, setCurrentStep] = useState(1);
  const [maxAccessibleStep, setMaxAccessibleStep] = useState(1);

  // Data states
  const [dataset, setDataset] = useState<UploadResponse | null>(null);
  const [selectedDateCol, setSelectedDateCol] = useState<string>('');
  const [selectedTargetCol, setSelectedTargetCol] = useState<string>('');
  
  // Step 3 states
  const [analysisData, setAnalysisData] = useState<AnalyzeResponse | null>(null);
  const [stationarityData, setStationarityData] = useState<StationarityResponse | null>(null);
  const [stationarityDiff, setStationarityDiff] = useState(0);

  // Step 4 states
  const [arimaMode, setArimaMode] = useState<'auto' | 'manual'>('auto');
  const [manualP, setManualP] = useState(2);
  const [manualD, setManualD] = useState(1);
  const [manualQ, setManualQ] = useState(1);
  const [autoArimaResult, setAutoArimaResult] = useState<AutoArimaResponse | null>(null);
  const [searchingAuto, setSearchingAuto] = useState(false);
  const [searchProgressStep, setSearchProgressStep] = useState(0);

  // Step 5 states
  const [trainingModel, setTrainingModel] = useState(false);
  const [trainResult, setTrainResult] = useState<TrainModelResponse | null>(null);

  // Step 6 states
  const [horizon, setHorizon] = useState<number>(30);
  const [customHorizon, setCustomHorizon] = useState<string>('30');
  const [isCustomHorizon, setIsCustomHorizon] = useState(false);
  const [generatingForecast, setGeneratingForecast] = useState(false);
  const [forecastResult, setForecastResult] = useState<ForecastResponse | null>(null);
  const [diagnosticsData, setDiagnosticsData] = useState<DiagnosticsResponse | null>(null);

  // General loading & error states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial dataset if provided by Home page demo
  useEffect(() => {
    if (initialDataset) {
      applyDataset(initialDataset);
      if (onClearInitialDataset) onClearInitialDataset();
    }
  }, [initialDataset]);

  const applyDataset = (data: UploadResponse) => {
    setDataset(data);
    setSelectedDateCol(data.detected_date_col || data.columns[0] || '');
    setSelectedTargetCol(data.detected_target_col || data.columns[1] || '');
    setCurrentStep(2);
    setMaxAccessibleStep((prev) => Math.max(prev, 2));
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('Please upload a valid CSV file (.csv).');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await api.uploadCsv(file);
      applyDataset(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload CSV file.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleLoadDemoDataset = async (key: string = 'sales') => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await api.loadSampleDataset(key);
      applyDataset(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load demo dataset.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 -> Step 3: Run Analysis & Stationarity
  const handleRunAnalysis = async () => {
    if (!dataset || !selectedDateCol || !selectedTargetCol) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const [analysisRes, statRes] = await Promise.all([
        api.analyzeSeries({
          dataset_id: dataset.dataset_id,
          date_column: selectedDateCol,
          target_column: selectedTargetCol,
        }),
        api.testStationarity({
          dataset_id: dataset.dataset_id,
          date_column: selectedDateCol,
          target_column: selectedTargetCol,
          differencing: stationarityDiff,
        }),
      ]);
      setAnalysisData(analysisRes);
      setStationarityData(statRes);

      // Auto-set suggested d based on stationarity
      if (statRes.is_stationary) {
        setManualD(0);
      } else {
        setManualD(1);
      }

      setCurrentStep(3);
      setMaxAccessibleStep((prev) => Math.max(prev, 3));
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to analyze series.');
    } finally {
      setLoading(false);
    }
  };

  // Stationarity differencing change
  const handleDifferencingChange = async (diff: number) => {
    if (!dataset) return;
    setStationarityDiff(diff);
    setLoading(true);
    try {
      const statRes = await api.testStationarity({
        dataset_id: dataset.dataset_id,
        date_column: selectedDateCol,
        target_column: selectedTargetCol,
        differencing: diff,
      });
      setStationarityData(statRes);
    } catch (err: any) {
      setErrorMessage(err.message || 'Stationarity re-test failed.');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Auto ARIMA search
  const handleAutoArimaSearch = async () => {
    if (!dataset) return;
    setSearchingAuto(true);
    setErrorMessage('');
    setSearchProgressStep(1);

    // Simulated progress steps during search
    const interval = setInterval(() => {
      setSearchProgressStep((prev) => (prev < 8 ? prev + 1 : prev));
    }, 450);

    try {
      const autoRes = await api.selectAutoArima({
        dataset_id: dataset.dataset_id,
        date_column: selectedDateCol,
        target_column: selectedTargetCol,
      });
      setAutoArimaResult(autoRes);
      setManualP(autoRes.best_order[0]);
      setManualD(autoRes.best_order[1]);
      setManualQ(autoRes.best_order[2]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Auto ARIMA search failed.');
    } finally {
      clearInterval(interval);
      setSearchingAuto(false);
    }
  };

  // Step 4 -> Step 5: Train Model
  const handleTrainModel = async () => {
    if (!dataset) return;
    setTrainingModel(true);
    setErrorMessage('');
    try {
      const trainRes = await api.trainModel({
        dataset_id: dataset.dataset_id,
        date_column: selectedDateCol,
        target_column: selectedTargetCol,
        p: manualP,
        d: manualD,
        q: manualQ,
        test_size_ratio: 0.2,
      });
      setTrainResult(trainRes);
      setCurrentStep(5);
      setMaxAccessibleStep((prev) => Math.max(prev, 5));
    } catch (err: any) {
      setErrorMessage(err.message || 'Model training failed.');
    } finally {
      setTrainingModel(false);
    }
  };

  // Step 5 -> Step 6: Generate Future Forecast
  const handleGenerateForecast = async () => {
    if (!dataset) return;
    setGeneratingForecast(true);
    setErrorMessage('');
    const targetHorizon = isCustomHorizon ? Math.max(1, parseInt(customHorizon) || 30) : horizon;

    try {
      const [fcRes, diagRes] = await Promise.all([
        api.generateForecast({
          dataset_id: dataset.dataset_id,
          date_column: selectedDateCol,
          target_column: selectedTargetCol,
          p: manualP,
          d: manualD,
          q: manualQ,
          horizon: targetHorizon,
          confidence_level: 0.95,
        }),
        api.getDiagnostics({
          dataset_id: dataset.dataset_id,
          date_column: selectedDateCol,
          target_column: selectedTargetCol,
          p: manualP,
          d: manualD,
          q: manualQ,
        }),
      ]);
      setForecastResult(fcRes);
      setDiagnosticsData(diagRes);
      setCurrentStep(6);
      setMaxAccessibleStep((prev) => Math.max(prev, 6));
    } catch (err: any) {
      setErrorMessage(err.message || 'Forecast generation failed.');
    } finally {
      setGeneratingForecast(false);
    }
  };

  const handleReset = () => {
    setDataset(null);
    setAnalysisData(null);
    setStationarityData(null);
    setAutoArimaResult(null);
    setTrainResult(null);
    setForecastResult(null);
    setDiagnosticsData(null);
    setCurrentStep(1);
    setMaxAccessibleStep(1);
    setErrorMessage('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-semibold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Interactive Prediction Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            ARIMA Forecasting Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            End-to-end econometric modeling, parameter optimization, and projection.
          </p>
        </div>

        {dataset && (
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400">Dataset: </span>
              <span className="font-mono font-semibold text-slate-200">{dataset.filename}</span>
              <span className="text-slate-500 ml-1.5">({dataset.row_count.toLocaleString()} rows)</span>
            </div>

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        )}
      </div>

      {/* Step Progress Tracker */}
      <StepProgress
        currentStep={currentStep}
        onStepClick={(s) => setCurrentStep(s)}
        maxAccessibleStep={maxAccessibleStep}
      />

      {/* Global Error Banner */}
      {errorMessage && (
        <ErrorAlert 
          message={errorMessage} 
          onDismiss={() => setErrorMessage('')} 
        />
      )}

      {/* ========================================================================= */}
      {/* STEP 1: UPLOAD DATASET                                                    */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-bold text-white font-heading">
              Upload Your Historical Time-Series
            </h2>
            <p className="text-sm text-slate-400">
              Select or drop a CSV file containing sequential date/time records and numeric observations.
            </p>
          </div>

          {/* Drag & Drop Box */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-3xl border-2 border-dashed p-10 sm:p-16 text-center cursor-pointer transition-all duration-300 group ${
              isDragOver
                ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
                : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900/80 hover:border-indigo-500/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 shadow-lg shadow-indigo-950/50">
                <Upload className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <div className="text-lg font-bold text-white font-heading">
                  Drop your CSV here
                </div>
                <div className="text-sm text-slate-400">
                  or <span className="text-indigo-400 underline font-semibold">Browse Files</span> from your computer
                </div>
              </div>

              <div className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 px-3 py-1 rounded-full bg-slate-950 border border-slate-800">
                <span>Supported format:</span>
                <span className="text-slate-300 font-semibold">.csv</span>
              </div>
            </div>
          </div>

          {/* Bundled Demo Datasets Bar */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-heading uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Or Try a Curated Demo Dataset
                </h3>
                <p className="text-xs text-slate-400">
                  Instantly test the platform without uploading your own data files
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => handleLoadDemoDataset('sales')}
                disabled={loading}
                className="p-4 rounded-xl bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 text-left transition-all group"
              >
                <div className="text-xs font-semibold text-sky-400 font-mono mb-1">
                  Daily E-Commerce Sales
                </div>
                <div className="text-sm font-bold text-white font-heading group-hover:text-indigo-300">
                  Retail Transactions
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  600 days • Trend + Seasonality
                </div>
              </button>

              <button
                onClick={() => handleLoadDemoDataset('traffic')}
                disabled={loading}
                className="p-4 rounded-xl bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 text-left transition-all group"
              >
                <div className="text-xs font-semibold text-emerald-400 font-mono mb-1">
                  Website Visitors
                </div>
                <div className="text-sm font-bold text-white font-heading group-hover:text-indigo-300">
                  Cloud Web Traffic
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  365 days • Weekly Cycles
                </div>
              </button>

              <button
                onClick={() => handleLoadDemoDataset('energy')}
                disabled={loading}
                className="p-4 rounded-xl bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 text-left transition-all group"
              >
                <div className="text-xs font-semibold text-amber-400 font-mono mb-1">
                  Monthly Power Grid
                </div>
                <div className="text-sm font-bold text-white font-heading group-hover:text-indigo-300">
                  Energy Demand (MWh)
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  72 months • Seasonal Peak Loads
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: DATASET CONFIGURATION & PREVIEW                                   */}
      {/* ========================================================================= */}
      {currentStep === 2 && dataset && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Upload Success Banner */}
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-sm font-bold text-emerald-300">
                  Dataset uploaded successfully
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  File: <span className="text-slate-200">{dataset.filename}</span> • Records:{' '}
                  <span className="text-slate-200">{dataset.row_count.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setCurrentStep(1)}
              className="text-xs font-medium text-slate-400 hover:text-white underline"
            >
              Change File
            </button>
          </div>

          {/* Column mapping card */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white font-heading">
                Configure Series Mapping
              </h3>
              <p className="text-xs text-slate-400">
                Confirm detected date and target columns or adjust them for ARIMA processing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Date Column Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
                  Date Column
                </label>
                <select
                  value={selectedDateCol}
                  onChange={(e) => setSelectedDateCol(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                >
                  {dataset.columns.map((c) => (
                    <option key={c} value={c}>
                      {c} {c === dataset.detected_date_col ? '(Auto-Detected)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500">
                  Contains chronological timestamps or sequential date points.
                </p>
              </div>

              {/* Target Column Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
                  Target Column (Forecast Metric)
                </label>
                <select
                  value={selectedTargetCol}
                  onChange={(e) => setSelectedTargetCol(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                >
                  {dataset.columns.map((c) => (
                    <option key={c} value={c}>
                      {c} {c === dataset.detected_target_col ? '(Auto-Detected Target)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500">
                  Numeric time-series observations to fit and forecast.
                </p>
              </div>
            </div>

            {/* Data Quality Report */}
            <DataQualityBadge 
              quality={dataset.quality_check} 
              rowCount={dataset.row_count} 
            />

            {/* Small Data Preview Table */}
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                Data Preview (First 5 Rows)
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold text-indigo-400">
                        {selectedDateCol} (Date)
                      </th>
                      <th className="px-4 py-2.5 font-semibold text-emerald-400">
                        {selectedTargetCol} (Value)
                      </th>
                      {dataset.columns
                        .filter((c) => c !== selectedDateCol && c !== selectedTargetCol)
                        .slice(0, 3)
                        .map((c) => (
                          <th key={c} className="px-4 py-2.5 font-medium text-slate-500">
                            {c}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                    {dataset.preview.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-850/50">
                        <td className="px-4 py-2 text-slate-300 font-medium">
                          {String(row[selectedDateCol] ?? '')}
                        </td>
                        <td className="px-4 py-2 text-emerald-300 font-bold">
                          {String(row[selectedTargetCol] ?? '')}
                        </td>
                        {dataset.columns
                          .filter((c) => c !== selectedDateCol && c !== selectedTargetCol)
                          .slice(0, 3)
                          .map((c) => (
                            <td key={c} className="px-4 py-2 text-slate-500">
                              {String(row[c] ?? '')}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Upload
              </button>

              <button
                onClick={handleRunAnalysis}
                disabled={loading || !selectedDateCol || !selectedTargetCol}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
              >
                <span>{loading ? 'Analyzing Series...' : 'Proceed to Analysis'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: ANALYSIS & STATIONARITY                                           */}
      {/* ========================================================================= */}
      {currentStep === 3 && analysisData && stationarityData && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Historical Data Chart Card */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white font-heading">
                  Historical Time-Series Series
                </h3>
                <p className="text-xs text-slate-400">
                  {analysisData.count.toLocaleString()} observations from {analysisData.start_date} to {analysisData.end_date} • Frequency: {analysisData.frequency}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span>{selectedTargetCol}</span>
              </div>
            </div>

            {/* Interactive chart */}
            <div className="h-72 sm:h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={analysisData.points} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b" 
                    tick={{ fontSize: 10 }} 
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#64748b" 
                    tick={{ fontSize: 10 }} 
                    tickLine={false} 
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-xl bg-slate-950/95 border border-slate-800 p-3 shadow-xl text-xs font-mono">
                            <div className="text-slate-400">Date: {payload[0].payload.date}</div>
                            <div className="text-sky-300 font-bold text-sm mt-1">
                              {selectedTargetCol}: {payload[0].value}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, fill: '#38bdf8', stroke: '#fff' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Summary Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="text-[11px] font-semibold text-slate-400 uppercase font-mono">Mean</div>
                <div className="text-lg font-bold font-mono text-white mt-0.5">{analysisData.mean.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="text-[11px] font-semibold text-slate-400 uppercase font-mono">Median</div>
                <div className="text-lg font-bold font-mono text-white mt-0.5">{analysisData.median.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="text-[11px] font-semibold text-slate-400 uppercase font-mono">Minimum</div>
                <div className="text-lg font-bold font-mono text-sky-400 mt-0.5">{analysisData.min.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="text-[11px] font-semibold text-slate-400 uppercase font-mono">Maximum</div>
                <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">{analysisData.max.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 col-span-2 sm:col-span-1">
                <div className="text-[11px] font-semibold text-slate-400 uppercase font-mono">Std Dev</div>
                <div className="text-lg font-bold font-mono text-violet-400 mt-0.5">{analysisData.std.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Stationarity ADF Test Card */}
          <StationarityCard
            data={stationarityData}
            differencing={stationarityDiff}
            onDifferencingChange={handleDifferencingChange}
            isLoading={loading}
          />

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Configuration
            </button>

            <button
              onClick={() => {
                setCurrentStep(4);
                setMaxAccessibleStep((prev) => Math.max(prev, 4));
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
            >
              <span>Configure ARIMA Model</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: ARIMA CONFIGURATION & SEARCH                                      */}
      {/* ========================================================================= */}
      {currentStep === 4 && dataset && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white font-heading">
                  ARIMA Parameter Specification
                </h3>
                <p className="text-xs text-slate-400">
                  Select between automated AIC/BIC parameter grid optimization or manual specification.
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setArimaMode('auto')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    arimaMode === 'auto'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Automatic Mode (AIC/BIC)
                </button>
                <button
                  type="button"
                  onClick={() => setArimaMode('manual')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    arimaMode === 'manual'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Manual Mode
                </button>
              </div>
            </div>

            {/* Automatic Mode Panel */}
            {arimaMode === 'auto' && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-white font-heading">
                      Automated Parameter Search
                    </div>
                    <p className="text-xs text-slate-400 max-w-xl">
                      Iterates through candidate (p, d, q) combinations, evaluating goodness of fit penalized by model complexity using Akaike Information Criterion (AIC).
                    </p>
                  </div>

                  <button
                    onClick={handleAutoArimaSearch}
                    disabled={searchingAuto}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-sky-200" />
                    <span>{searchingAuto ? 'Searching Models...' : 'Run Auto ARIMA'}</span>
                  </button>
                </div>

                {/* Animated searching state */}
                {searchingAuto && (
                  <div className="p-6 rounded-xl bg-indigo-950/20 border border-indigo-800/40 text-center space-y-3">
                    <div className="flex items-center justify-center gap-3">
                      <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                      <span className="text-sm font-bold text-white font-mono">
                        Analyzing candidate models...
                      </span>
                    </div>

                    <div className="text-xs font-mono text-indigo-300">
                      {searchProgressStep === 1 && 'Testing ARIMA(0,1,0)...'}
                      {searchProgressStep === 2 && 'Testing ARIMA(0,1,1)...'}
                      {searchProgressStep === 3 && 'Testing ARIMA(1,1,0)...'}
                      {searchProgressStep === 4 && 'Testing ARIMA(1,1,1)...'}
                      {searchProgressStep === 5 && 'Testing ARIMA(2,1,1)...'}
                      {searchProgressStep === 6 && 'Testing ARIMA(1,1,2)...'}
                      {searchProgressStep >= 7 && 'Evaluating optimal AIC & convergence...'}
                    </div>

                    <div className="w-48 h-1.5 bg-slate-800 rounded-full mx-auto overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 animate-pulse w-3/4" />
                    </div>
                  </div>
                )}

                {/* Best Model Result Banner */}
                {autoArimaResult && !searchingAuto && (
                  <div className="p-5 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-mono uppercase text-indigo-400 font-semibold">
                          Optimal Model Discovered
                        </div>
                        <div className="text-2xl font-black text-white font-mono mt-0.5">
                          {autoArimaResult.best_order_str}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono">
                        <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-slate-400">AIC: </span>
                          <span className="text-emerald-400 font-bold">{autoArimaResult.best_aic.toFixed(2)}</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-slate-400">BIC: </span>
                          <span className="text-sky-400 font-bold">{autoArimaResult.best_bic.toFixed(2)}</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-slate-400">Evaluated: </span>
                          <span className="text-slate-200">{autoArimaResult.candidates_evaluated}</span>
                        </div>
                      </div>
                    </div>

                    {/* Top 5 candidates snippet */}
                    <div className="space-y-1.5 text-xs">
                      <div className="text-slate-400 font-medium">Candidate Hierarchy:</div>
                      <div className="flex flex-wrap gap-2">
                        {autoArimaResult.candidate_history
                          .filter((c) => c.converged && c.aic !== null)
                          .sort((a, b) => (a.aic ?? 999999) - (b.aic ?? 999999))
                          .slice(0, 6)
                          .map((c, i) => (
                            <span
                              key={c.order_str}
                              className={`px-2.5 py-1 rounded-lg border font-mono text-[11px] ${
                                i === 0
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-bold'
                                  : 'bg-slate-900 border-slate-800 text-slate-400'
                              }`}
                            >
                              {c.order_str} (AIC: {c.aic})
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Manual Mode Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* p input */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center justify-between">
                  <span>p (AutoRegressive)</span>
                  <span className="text-indigo-400">p = {manualP}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={manualP}
                  onChange={(e) => setManualP(parseInt(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>0</span>
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
                <p className="text-[11px] text-slate-500">Number of lag observations.</p>
              </div>

              {/* d input */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center justify-between">
                  <span>d (Differencing)</span>
                  <span className="text-emerald-400">d = {manualD}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  value={manualD}
                  onChange={(e) => setManualD(parseInt(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>0 (Raw)</span>
                  <span>1 (1st Diff)</span>
                  <span>2 (2nd Diff)</span>
                </div>
                <p className="text-[11px] text-slate-500">Number of differencing steps.</p>
              </div>

              {/* q input */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center justify-between">
                  <span>q (Moving Average)</span>
                  <span className="text-sky-400">q = {manualQ}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={manualQ}
                  onChange={(e) => setManualQ(parseInt(e.target.value))}
                  className="w-full accent-sky-500"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>0</span>
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
                <p className="text-[11px] text-slate-500">Size of moving average window.</p>
              </div>
            </div>

            {/* Model Preview Badge */}
            <div className="flex items-center justify-center p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-xs text-slate-400 font-mono mr-3">Selected Model:</span>
              <span className="text-xl font-bold font-mono bg-gradient-to-r from-sky-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                ARIMA({manualP},{manualD},{manualQ})
              </span>
            </div>

            {/* Train Model Button */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Analysis
              </button>

              <button
                onClick={handleTrainModel}
                disabled={trainingModel}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 shadow-xl shadow-indigo-600/30 transition-all hover:-translate-y-0.5"
              >
                <Cpu className="w-4 h-4" />
                <span>{trainingModel ? 'Training ARIMA model... Please wait.' : 'Train Model'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: MODEL EVALUATION & ACTUAL VS PREDICTED                            */}
      {/* ========================================================================= */}
      {currentStep === 5 && trainResult && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Performance KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                MAE
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {trainResult.metrics.mae.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500">Mean Absolute Error</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                RMSE
              </div>
              <div className="text-2xl font-bold font-mono text-sky-400">
                {trainResult.metrics.rmse.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500">Root Mean Squared Error</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                MAPE
              </div>
              <div className="text-2xl font-bold font-mono text-amber-400">
                {trainResult.metrics.mape.toFixed(2)}%
              </div>
              <div className="text-[11px] text-slate-500">Mean Absolute % Error</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                AIC
              </div>
              <div className="text-2xl font-bold font-mono text-slate-200">
                {trainResult.metrics.aic.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500">Akaike Information</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Model Order
              </div>
              <div className="text-xl font-bold font-mono text-indigo-400">
                {trainResult.order_str}
              </div>
              <div className="text-[11px] text-slate-500">
                Split: {trainResult.train_count} train / {trainResult.test_count} test
              </div>
            </div>
          </div>

          {/* Actual vs Predicted Interactive Chart */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white font-heading">
                  Actual vs Predicted Validation (Holdout Test Split)
                </h3>
                <p className="text-xs text-slate-400">
                  Comparing model out-of-sample predictions against true historical ground truth.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-sky-400" />
                  <span className="text-slate-300">Actual Values</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-emerald-400 border-b border-dashed border-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Predicted Values</span>
                </div>
              </div>
            </div>

            {/* Recharts chart combining actual and predicted */}
            <div className="h-72 sm:h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={trainResult.actual_test_series.map((act, i) => ({
                    date: act.date,
                    actual: act.value,
                    predicted: trainResult.predicted_test_series[i]?.value,
                  }))}
                  margin={{ top: 10, right: 10, left: -16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 shadow-xl text-xs font-mono space-y-1">
                            <div className="text-slate-400">Date: {payload[0].payload.date}</div>
                            <div className="text-sky-300 font-bold">
                              Actual: {payload[0].payload.actual}
                            </div>
                            <div className="text-emerald-400 font-bold">
                              Predicted: {payload[0].payload.predicted}
                            </div>
                            <div className="text-slate-500 text-[10px] pt-1 border-t border-slate-800">
                              Error: {Math.abs(payload[0].payload.actual - payload[0].payload.predicted).toFixed(2)}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: '#38bdf8' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: '#10b981' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setCurrentStep(4)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Adjust ARIMA Parameters
            </button>

            <button
              onClick={() => {
                setCurrentStep(6);
                setMaxAccessibleStep((prev) => Math.max(prev, 6));
                // Trigger forecast automatically on entering step 6 if not yet run
                if (!forecastResult) {
                  handleGenerateForecast();
                }
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
            >
              <span>Proceed to Future Forecast</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 6: FUTURE FORECAST, SCHEDULE TABLE & EXPORT                          */}
      {/* ========================================================================= */}
      {currentStep === 6 && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Horizon Selection Card */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white font-heading">
                  Forecast the Future
                </h3>
                <p className="text-xs text-slate-400">
                  Select your forward projection horizon for ARIMA({manualP},{manualD},{manualQ}) fitted on all historical data.
                </p>
              </div>

              {/* Horizon presets */}
              <div className="flex flex-wrap items-center gap-2">
                {[7, 14, 30, 60, 90].map((h) => (
                  <button
                    key={h}
                    onClick={() => {
                      setHorizon(h);
                      setIsCustomHorizon(false);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                      !isCustomHorizon && horizon === h
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {h} periods
                  </button>
                ))}

                <button
                  onClick={() => setIsCustomHorizon(true)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                    isCustomHorizon
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Custom
                </button>

                {isCustomHorizon && (
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={customHorizon}
                    onChange={(e) => setCustomHorizon(e.target.value)}
                    className="w-20 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white text-center focus:outline-none focus:border-indigo-500"
                    placeholder="Periods"
                  />
                )}

                <button
                  onClick={handleGenerateForecast}
                  disabled={generatingForecast}
                  className="inline-flex items-center gap-2 px-5 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition-all ml-2"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{generatingForecast ? 'Forecasting...' : 'Generate Forecast'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Master Future Forecast Chart */}
          {forecastResult && (
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white font-heading">
                      Historical Data & ARIMA Forecast
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {forecastResult.horizon} Periods Horizon
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Continuous series with shaded 95% statistical confidence envelope.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-sky-400" />
                    <span className="text-slate-300">Historical Actuals</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-emerald-400 border-b border-dashed border-emerald-400" />
                    <span className="text-emerald-400 font-semibold">ARIMA Forecast</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-2 bg-emerald-500/20 border border-emerald-500/40" />
                    <span className="text-slate-300">95% Confidence Band</span>
                  </div>
                </div>
              </div>

              {/* Large Chart */}
              <div className="h-80 sm:h-[420px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={forecastResult.combined_chart_data}
                    margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="futureCiGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#64748b" 
                      tick={{ fontSize: 10 }} 
                      tickLine={false} 
                    />
                    <YAxis 
                      stroke="#64748b" 
                      tick={{ fontSize: 10 }} 
                      tickLine={false} 
                      domain={['auto', 'auto']} 
                    />

                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const pt = payload[0].payload;
                          return (
                            <div className="rounded-xl bg-slate-950/95 border border-slate-800 p-3 shadow-xl text-xs font-mono space-y-1">
                              <div className="text-slate-400 flex items-center justify-between gap-4">
                                <span>Date: {pt.date}</span>
                                <span className={pt.is_forecast ? 'text-emerald-400' : 'text-sky-400'}>
                                  {pt.is_forecast ? 'Forecast' : 'Historical'}
                                </span>
                              </div>

                              {pt.actual !== null && pt.actual !== undefined && (
                                <div className="text-sky-300 font-bold">
                                  Actual: {pt.actual}
                                </div>
                              )}

                              {pt.forecast !== null && pt.forecast !== undefined && (
                                <div className="text-emerald-400 font-bold">
                                  Predicted: {pt.forecast}
                                </div>
                              )}

                              {pt.lower_ci !== null && pt.upper_ci !== null && (
                                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                                  95% CI: [{pt.lower_ci} – {pt.upper_ci}]
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />

                    {/* Vertical marker for forecast start */}
                    <ReferenceLine
                      x={forecastResult.forecast_start_date}
                      stroke="#94a3b8"
                      strokeDasharray="4 4"
                      label={{
                        value: 'Forecast Begins Here',
                        position: 'insideTopLeft',
                        fill: '#e2e8f0',
                        fontSize: 10,
                        fontWeight: 600,
                        className: 'font-mono'
                      }}
                    />

                    {/* Upper CI Band */}
                    <Area
                      type="monotone"
                      dataKey="upper_ci"
                      stroke="transparent"
                      fill="url(#futureCiGrad)"
                      connectNulls
                    />

                    {/* Lower CI Band */}
                    <Area
                      type="monotone"
                      dataKey="lower_ci"
                      stroke="transparent"
                      fill="#030712"
                      connectNulls
                    />

                    {/* Actuals Line */}
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      dot={false}
                    />

                    {/* Forecast Line */}
                    <Line
                      type="monotone"
                      dataKey="forecast"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      strokeDasharray="4 4"
                      dot={{ r: 2.5, fill: '#10b981' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Forecast Schedule Table */}
          {forecastResult && (
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white font-heading">
                    Future Prediction Schedule
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tabulated values with corresponding lower and upper confidence intervals.
                  </p>
                </div>

                <a
                  href={api.getCsvExportUrl(forecastResult.run_id)}
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Download CSV</span>
                </a>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-72">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Date / Period</th>
                      <th className="px-4 py-2.5 font-semibold text-emerald-400">Predicted Value</th>
                      <th className="px-4 py-2.5 font-semibold text-slate-400">Lower Bound (95%)</th>
                      <th className="px-4 py-2.5 font-semibold text-slate-400">Upper Bound (95%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                    {forecastResult.forecast_table.map((row) => (
                      <tr key={row.date} className="hover:bg-slate-850/50">
                        <td className="px-4 py-2 text-slate-300 font-medium">{row.date}</td>
                        <td className="px-4 py-2 text-emerald-300 font-bold">{row.predicted.toFixed(2)}</td>
                        <td className="px-4 py-2 text-slate-400">{row.lower_ci.toFixed(2)}</td>
                        <td className="px-4 py-2 text-slate-400">{row.upper_ci.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Model Diagnostics Expandable Section */}
          {diagnosticsData && (
            <DiagnosticCharts
              data={diagnosticsData}
              orderStr={trainResult?.order_str || `ARIMA(${manualP},${manualD},${manualQ})`}
            />
          )}

          {/* Results Summary Card */}
          {forecastResult && (
            <div className="rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white font-heading">
                      Forecast Complete
                    </h3>
                    <p className="text-xs text-slate-400">
                      Model fitted, validated, and projections successfully generated.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={api.getCsvExportUrl(forecastResult.run_id)}
                    download
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Download CSV</span>
                  </a>

                  <a
                    href={api.getPdfExportUrl(forecastResult.run_id)}
                    download
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-colors"
                  >
                    <FileDown className="w-4 h-4 text-sky-200" />
                    <span>Download PDF Report</span>
                  </a>
                </div>
              </div>

              {/* Summary Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-2 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-400">Model</div>
                  <div className="text-base font-bold text-white mt-0.5">{forecastResult.order_str}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-400">Train Records</div>
                  <div className="text-base font-bold text-slate-200 mt-0.5">{trainResult?.train_count ?? '-'}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-400">Test Records</div>
                  <div className="text-base font-bold text-slate-200 mt-0.5">{trainResult?.test_count ?? '-'}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-400">RMSE</div>
                  <div className="text-base font-bold text-sky-400 mt-0.5">
                    {trainResult?.metrics.rmse.toFixed(2) ?? '-'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-400">MAE</div>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">
                    {trainResult?.metrics.mae.toFixed(2) ?? '-'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-400">Horizon</div>
                  <div className="text-base font-bold text-amber-400 mt-0.5">
                    {forecastResult.horizon} periods
                  </div>
                </div>
              </div>

              {/* Start new prediction CTA */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Start New Prediction</span>
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

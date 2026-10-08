export interface DataQualityCheck {
  date_column_detected: boolean;
  target_column_detected: boolean;
  row_count: number;
  duplicate_dates_count: number;
  missing_values_count: number;
  is_sorted_chronologically: boolean;
  warnings: string[];
  errors: string[];
  is_valid: boolean;
}

export interface UploadResponse {
  dataset_id: string;
  filename: string;
  row_count: number;
  columns: string[];
  detected_date_col?: string | null;
  detected_target_col?: string | null;
  preview: Record<string, any>[];
  quality_check: DataQualityCheck;
}

export interface SampleDatasetInfo {
  id: string;
  title: string;
  description: string;
  filename: string;
  date_col: string;
  target_col: string;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface AnalyzeResponse {
  dataset_id: string;
  date_column: string;
  target_column: string;
  count: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  std: number;
  variance: number;
  skewness: number;
  start_date: string;
  end_date: string;
  frequency: string;
  points: TimeSeriesPoint[];
}

export interface CriticalValues {
  [key: string]: number;
}

export interface StationarityResponse {
  adf_statistic: number;
  p_value: number;
  used_lag: number;
  n_obs: number;
  critical_values: CriticalValues;
  is_stationary: boolean;
  interpretation: string;
  recommendation: string;
  differenced_adf_statistic?: number | null;
  differenced_p_value?: number | null;
}

export interface CandidateModel {
  order: [number, number, number];
  order_str: string;
  aic: number | null;
  bic: number | null;
  converged: boolean;
  error?: string | null;
}

export interface AutoArimaResponse {
  best_order: [number, number, number];
  best_order_str: string;
  best_aic: number;
  best_bic: number;
  candidates_evaluated: number;
  candidate_history: CandidateModel[];
}

export interface EvaluationMetrics {
  mae: number;
  rmse: number;
  mape: number;
  aic: number;
  bic: number;
}

export interface TrainModelResponse {
  p: number;
  d: number;
  q: number;
  order_str: string;
  train_count: number;
  test_count: number;
  metrics: EvaluationMetrics;
  train_series: TimeSeriesPoint[];
  actual_test_series: TimeSeriesPoint[];
  predicted_test_series: TimeSeriesPoint[];
}

export interface ForecastTableRow {
  date: string;
  predicted: number;
  lower_ci: number;
  upper_ci: number;
}

export interface CombinedChartPoint {
  date: string;
  actual?: number | null;
  forecast?: number | null;
  lower_ci?: number | null;
  upper_ci?: number | null;
  is_forecast: boolean;
}

export interface ForecastResponse {
  run_id: string;
  order_str: string;
  horizon: number;
  confidence_level: number;
  forecast_table: ForecastTableRow[];
  combined_chart_data: CombinedChartPoint[];
  forecast_start_date: string;
  metrics?: EvaluationMetrics | null;
}

export interface HistBin {
  bin_center: number;
  count: number;
}

export interface AcfPoint {
  lag: number;
  acf: number;
  conf_interval: number;
}

export interface DiagnosticsResponse {
  residuals_series: TimeSeriesPoint[];
  histogram: HistBin[];
  acf_points: AcfPoint[];
  ljung_box_stat: number;
  ljung_box_p_value: number;
  is_white_noise: boolean;
  interpretation: string;
}

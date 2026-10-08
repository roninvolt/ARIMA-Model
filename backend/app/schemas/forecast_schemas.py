from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class DataQualityCheck(BaseModel):
    date_column_detected: bool
    target_column_detected: bool
    row_count: int
    duplicate_dates_count: int
    missing_values_count: int
    is_sorted_chronologically: bool
    warnings: List[str] = []
    errors: List[str] = []
    is_valid: bool

class UploadResponse(BaseModel):
    dataset_id: str
    filename: str
    row_count: int
    columns: List[str]
    detected_date_col: Optional[str] = None
    detected_target_col: Optional[str] = None
    preview: List[Dict[str, Any]]
    quality_check: DataQualityCheck

class AnalyzeRequest(BaseModel):
    dataset_id: str
    date_column: str
    target_column: str
    fill_missing: Optional[str] = "forward_fill"

class TimeSeriesPoint(BaseModel):
    date: str
    value: float

class AnalyzeResponse(BaseModel):
    dataset_id: str
    date_column: str
    target_column: str
    count: int
    mean: float
    median: float
    min: float
    max: float
    std: float
    variance: float
    skewness: float
    start_date: str
    end_date: str
    frequency: str
    points: List[TimeSeriesPoint]

class StationarityRequest(BaseModel):
    dataset_id: str
    date_column: str
    target_column: str
    differencing: Optional[int] = 0

class StationarityResponse(BaseModel):
    adf_statistic: float
    p_value: float
    used_lag: int
    n_obs: int
    critical_values: Dict[str, float]
    is_stationary: bool
    interpretation: str
    recommendation: str
    differenced_adf_statistic: Optional[float] = None
    differenced_p_value: Optional[float] = None

class CandidateModel(BaseModel):
    order: List[int]
    order_str: str
    aic: Optional[float] = None
    bic: Optional[float] = None
    converged: bool = True
    error: Optional[str] = None

class AutoArimaRequest(BaseModel):
    dataset_id: str
    date_column: str
    target_column: str
    max_p: Optional[int] = 4
    max_d: Optional[int] = 2
    max_q: Optional[int] = 4

class AutoArimaResponse(BaseModel):
    best_order: List[int]
    best_order_str: str
    best_aic: float
    best_bic: float
    candidates_evaluated: int
    candidate_history: List[CandidateModel]

class TrainModelRequest(BaseModel):
    dataset_id: str
    date_column: str
    target_column: str
    p: int = 1
    d: int = 1
    q: int = 1
    test_size_ratio: Optional[float] = 0.2

class EvaluationMetrics(BaseModel):
    mae: float
    rmse: float
    mape: float
    aic: float
    bic: float

class TrainModelResponse(BaseModel):
    p: int
    d: int
    q: int
    order_str: str
    train_count: int
    test_count: int
    metrics: EvaluationMetrics
    train_series: List[TimeSeriesPoint]
    actual_test_series: List[TimeSeriesPoint]
    predicted_test_series: List[TimeSeriesPoint]

class ForecastRequest(BaseModel):
    dataset_id: str
    date_column: str
    target_column: str
    p: int = 1
    d: int = 1
    q: int = 1
    horizon: int = 30
    confidence_level: Optional[float] = 0.95

class ForecastTableRow(BaseModel):
    date: str
    predicted: float
    lower_ci: float
    upper_ci: float

class CombinedChartPoint(BaseModel):
    date: str
    actual: Optional[float] = None
    forecast: Optional[float] = None
    lower_ci: Optional[float] = None
    upper_ci: Optional[float] = None
    is_forecast: bool = False

class ForecastResponse(BaseModel):
    run_id: str
    order_str: str
    horizon: int
    confidence_level: float
    forecast_table: List[ForecastTableRow]
    combined_chart_data: List[CombinedChartPoint]
    forecast_start_date: str
    metrics: Optional[EvaluationMetrics] = None

class DiagnosticsRequest(BaseModel):
    dataset_id: str
    date_column: str
    target_column: str
    p: int = 1
    d: int = 1
    q: int = 1

class HistBin(BaseModel):
    bin_center: float
    count: int

class AcfPoint(BaseModel):
    lag: int
    acf: float
    conf_interval: float

class DiagnosticsResponse(BaseModel):
    residuals_series: List[TimeSeriesPoint]
    histogram: List[HistBin]
    acf_points: List[AcfPoint]
    ljung_box_stat: float
    ljung_box_p_value: float
    is_white_noise: bool
    interpretation: str

import os
import io
import json
import uuid
import numpy as np
import pandas as pd
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.models.database import get_db, DatasetModel, ForecastRunModel
from app.schemas.forecast_schemas import (
    UploadResponse,
    AnalyzeRequest,
    AnalyzeResponse,
    StationarityRequest,
    StationarityResponse,
    AutoArimaRequest,
    AutoArimaResponse,
    TrainModelRequest,
    TrainModelResponse,
    ForecastRequest,
    ForecastResponse,
    DiagnosticsRequest,
    DiagnosticsResponse,
    TimeSeriesPoint,
    ForecastTableRow,
    CombinedChartPoint,
    EvaluationMetrics,
    DataQualityCheck,
)
from app.services.data_processor import (
    inspect_dataset,
    load_and_preprocess_series,
)
from app.services.arima_service import (
    test_stationarity,
    select_auto_arima,
    train_and_evaluate,
    generate_forecast,
    compute_diagnostics,
)
from app.services.report_generator import generate_pdf_report

router = APIRouter(prefix="/api")

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

SAMPLE_CATALOG = {
    "sales": {
        "id": "sales",
        "title": "Daily E-Commerce Sales",
        "description": "600 daily transactions showing growth trends, weekly cycles, and seasonal swings.",
        "filename": "sample_dataset.csv",
        "date_col": "date",
        "target_col": "sales"
    },
    "traffic": {
        "id": "traffic",
        "title": "Website Visitors",
        "description": "365 days of website traffic with steady growth and weekend engagement fluctuations.",
        "filename": "website_visitors.csv",
        "date_col": "timestamp",
        "target_col": "visitors"
    },
    "energy": {
        "id": "energy",
        "title": "Monthly Energy Demand",
        "description": "72 months of regional power demand with prominent winter/summer peak loads.",
        "filename": "energy_demand.csv",
        "date_col": "month",
        "target_col": "megawatt_hours"
    }
}

@router.get("/health")
def health_check():
    return {"status": "ok", "app": "ForecastAI", "version": "1.0.0"}

@router.post("/upload", response_model=UploadResponse)
async def upload_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload a valid CSV (.csv) file."
        )

    try:
        content = await file.read()
        # Try UTF-8 first, fallback to latin-1
        try:
            df = pd.read_csv(io.BytesIO(content), encoding="utf-8")
        except UnicodeDecodeError:
            df = pd.read_csv(io.BytesIO(content), encoding="latin-1")
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to read this dataset. Ensure it is a valid comma-separated CSV file. ({str(e)})"
        )

    if df.empty or len(df.columns) < 2:
        raise HTTPException(
            status_code=400,
            detail="The uploaded CSV file is empty or does not contain enough columns. It must include at least a date/time column and a numerical target column."
        )

    # Sanitize column names
    df.columns = [str(c).strip() for c in df.columns]

    date_col, target_col, quality_check = inspect_dataset(df)

    # Save to disk
    dataset_id = str(uuid.uuid4())
    safe_filename = f"{dataset_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    df.to_csv(file_path, index=False)

    # Convert preview (first 10 rows)
    preview_df = df.head(10).fillna("")
    preview = preview_df.to_dict(orient="records")

    # Save to database
    db_dataset = DatasetModel(
        id=dataset_id,
        filename=file.filename,
        file_path=file_path,
        row_count=len(df),
        columns_json=json.dumps(list(df.columns)),
        detected_date_col=date_col,
        detected_target_col=target_col,
    )
    db.add(db_dataset)
    db.commit()

    return UploadResponse(
        dataset_id=dataset_id,
        filename=file.filename,
        row_count=len(df),
        columns=list(df.columns),
        detected_date_col=date_col,
        detected_target_col=target_col,
        preview=preview,
        quality_check=quality_check,
    )

@router.get("/sample-datasets")
def list_sample_datasets():
    return list(SAMPLE_CATALOG.values())

@router.post("/demo-dataset", response_model=UploadResponse)
def load_demo_dataset(db: Session = Depends(get_db)):
    return load_sample_by_key("sales", db)

@router.post("/sample-datasets/load/{key}", response_model=UploadResponse)
def load_sample_dataset(key: str, db: Session = Depends(get_db)):
    if key not in SAMPLE_CATALOG:
        key = "sales"
    return load_sample_by_key(key, db)

def load_sample_by_key(key: str, db: Session) -> UploadResponse:
    info = SAMPLE_CATALOG[key]
    sample_path = os.path.join(DATA_DIR, info["filename"])
    if not os.path.exists(sample_path):
        # Fallback path check
        sample_path = os.path.join(os.getcwd(), "data", info["filename"])

    if not os.path.exists(sample_path):
        raise HTTPException(status_code=404, detail="Demo dataset file not found on server.")

    df = pd.read_csv(sample_path)
    date_col, target_col, quality_check = inspect_dataset(df)

    dataset_id = str(uuid.uuid4())
    safe_filename = f"demo_{key}_{dataset_id}.csv"
    dest_path = os.path.join(UPLOAD_DIR, safe_filename)
    df.to_csv(dest_path, index=False)

    preview = df.head(10).fillna("").to_dict(orient="records")

    db_dataset = DatasetModel(
        id=dataset_id,
        filename=info["filename"],
        file_path=dest_path,
        row_count=len(df),
        columns_json=json.dumps(list(df.columns)),
        detected_date_col=info["date_col"] or date_col,
        detected_target_col=info["target_col"] or target_col,
    )
    db.add(db_dataset)
    db.commit()

    return UploadResponse(
        dataset_id=dataset_id,
        filename=info["filename"],
        row_count=len(df),
        columns=list(df.columns),
        detected_date_col=info["date_col"] or date_col,
        detected_target_col=info["target_col"] or target_col,
        preview=preview,
        quality_check=quality_check,
    )

@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_series(req: AnalyzeRequest, db: Session = Depends(get_db)):
    dataset = db.query(DatasetModel).filter(DatasetModel.id == req.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found. Please upload a dataset first.")

    try:
        series, freq_desc = load_and_preprocess_series(
            dataset.file_path, req.date_column, req.target_column, req.fill_missing or "forward_fill"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to prepare time series: {str(e)}")

    vals = series.values
    mean_val = float(np.mean(vals))
    med_val = float(np.median(vals))
    min_val = float(np.min(vals))
    max_val = float(np.max(vals))
    std_val = float(np.std(vals))
    var_val = float(np.var(vals))
    skew_val = float(pd.Series(vals).skew()) if len(vals) > 2 else 0.0

    # Format points for UI chart (sample if huge series > 1000)
    step = max(1, len(series) // 800)
    points = [
        {"date": idx.strftime("%Y-%m-%d"), "value": round(float(v), 2)}
        for idx, v in zip(series.index[::step], series.values[::step])
    ]

    return AnalyzeResponse(
        dataset_id=req.dataset_id,
        date_column=req.date_column,
        target_column=req.target_column,
        count=len(series),
        mean=round(mean_val, 2),
        median=round(med_val, 2),
        min=round(min_val, 2),
        max=round(max_val, 2),
        std=round(std_val, 2),
        variance=round(var_val, 2),
        skewness=round(skew_val, 3),
        start_date=series.index[0].strftime("%Y-%m-%d"),
        end_date=series.index[-1].strftime("%Y-%m-%d"),
        frequency=freq_desc,
        points=points,
    )

@router.post("/stationarity", response_model=StationarityResponse)
def check_stationarity(req: StationarityRequest, db: Session = Depends(get_db)):
    dataset = db.query(DatasetModel).filter(DatasetModel.id == req.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    try:
        series, _ = load_and_preprocess_series(dataset.file_path, req.date_column, req.target_column)
        res = test_stationarity(series, differencing=req.differencing or 0)
        return StationarityResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Stationarity test error: {str(e)}")

@router.post("/arima/select", response_model=AutoArimaResponse)
def select_model(req: AutoArimaRequest, db: Session = Depends(get_db)):
    dataset = db.query(DatasetModel).filter(DatasetModel.id == req.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    try:
        series, _ = load_and_preprocess_series(dataset.file_path, req.date_column, req.target_column)
        res = select_auto_arima(
            series,
            max_p=req.max_p or 4,
            max_d=req.max_d or 2,
            max_q=req.max_q or 4
        )
        return AutoArimaResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Auto ARIMA model search failed: {str(e)}")

@router.post("/arima/train", response_model=TrainModelResponse)
def train_model(req: TrainModelRequest, db: Session = Depends(get_db)):
    dataset = db.query(DatasetModel).filter(DatasetModel.id == req.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    try:
        series, _ = load_and_preprocess_series(dataset.file_path, req.date_column, req.target_column)
        res = train_and_evaluate(
            series,
            p=req.p,
            d=req.d,
            q=req.q,
            test_size_ratio=req.test_size_ratio or 0.2
        )
        return TrainModelResponse(**res)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"The selected ARIMA({req.p},{req.d},{req.q}) model could not converge. Try automatic parameter selection or a simpler configuration. ({str(e)})"
        )

@router.post("/forecast", response_model=ForecastResponse)
def run_forecast(req: ForecastRequest, db: Session = Depends(get_db)):
    dataset = db.query(DatasetModel).filter(DatasetModel.id == req.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    try:
        series, freq_desc = load_and_preprocess_series(dataset.file_path, req.date_column, req.target_column)
        fc_res = generate_forecast(
            series,
            p=req.p,
            d=req.d,
            q=req.q,
            horizon=req.horizon,
            confidence_level=req.confidence_level or 0.95,
            freq_desc=freq_desc
        )

        # Also get quick train metrics on holdout test set to store in result
        metrics_dict = None
        try:
            train_eval = train_and_evaluate(series, p=req.p, d=req.d, q=req.q, test_size_ratio=0.2)
            metrics_dict = train_eval.get("metrics")
        except Exception:
            pass

        run_id = str(uuid.uuid4())
        results_payload = {
            "order_str": fc_res["order_str"],
            "horizon": fc_res["horizon"],
            "confidence_level": fc_res["confidence_level"],
            "forecast_table": fc_res["forecast_table"],
            "combined_chart_data": fc_res["combined_chart_data"],
            "forecast_start_date": fc_res["forecast_start_date"],
            "metrics": metrics_dict,
            "freq_desc": freq_desc,
        }

        # Save to SQLite database
        forecast_run = ForecastRunModel(
            id=run_id,
            dataset_id=dataset.id,
            date_column=req.date_column,
            target_column=req.target_column,
            p=req.p,
            d=req.d,
            q=req.q,
            auto_selected=False,
            aic=metrics_dict.get("aic") if metrics_dict else None,
            bic=metrics_dict.get("bic") if metrics_dict else None,
            mae=metrics_dict.get("mae") if metrics_dict else None,
            rmse=metrics_dict.get("rmse") if metrics_dict else None,
            mape=metrics_dict.get("mape") if metrics_dict else None,
            horizon=req.horizon,
            confidence_level=req.confidence_level or 0.95,
            status="COMPLETED",
            results_json=json.dumps(results_payload)
        )
        db.add(forecast_run)
        db.commit()

        return ForecastResponse(
            run_id=run_id,
            order_str=fc_res["order_str"],
            horizon=fc_res["horizon"],
            confidence_level=fc_res["confidence_level"],
            forecast_table=fc_res["forecast_table"],
            combined_chart_data=fc_res["combined_chart_data"],
            forecast_start_date=fc_res["forecast_start_date"],
            metrics=EvaluationMetrics(**metrics_dict) if metrics_dict else None
        )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Forecasting calculation failed: {str(e)}"
        )

@router.post("/diagnostics", response_model=DiagnosticsResponse)
def get_diagnostics(req: DiagnosticsRequest, db: Session = Depends(get_db)):
    dataset = db.query(DatasetModel).filter(DatasetModel.id == req.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    try:
        series, _ = load_and_preprocess_series(dataset.file_path, req.date_column, req.target_column)
        diag = compute_diagnostics(series, p=req.p, d=req.d, q=req.q)
        return DiagnosticsResponse(**diag)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Model diagnostics calculation failed: {str(e)}")

@router.get("/result/{run_id}")
def get_saved_result(run_id: str, db: Session = Depends(get_db)):
    run = db.query(ForecastRunModel).filter(ForecastRunModel.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Forecast run not found.")

    return {
        "id": run.id,
        "dataset_id": run.dataset_id,
        "p": run.p,
        "d": run.d,
        "q": run.q,
        "mae": run.mae,
        "rmse": run.rmse,
        "mape": run.mape,
        "aic": run.aic,
        "bic": run.bic,
        "horizon": run.horizon,
        "created_at": run.created_at.isoformat() if run.created_at else None,
        "results": run.get_results(),
    }

@router.get("/export/{run_id}/csv")
def export_csv(run_id: str, db: Session = Depends(get_db)):
    run = db.query(ForecastRunModel).filter(ForecastRunModel.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Forecast run not found.")

    res_data = run.get_results()
    table = res_data.get("forecast_table", [])
    if not table:
        raise HTTPException(status_code=400, detail="No forecast table data found for this run.")

    df_export = pd.DataFrame(table)
    # Rename columns nicely
    df_export.columns = ["Date", "Predicted_Value", "Lower_Bound_95", "Upper_Bound_95"]
    
    stream = io.StringIO()
    df_export.to_csv(stream, index=False)
    csv_bytes = stream.getvalue().encode("utf-8")

    filename = f"ForecastAI_ARIMA_{run.p}_{run.d}_{run.q}_{run_id[:8]}.csv"
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/export/{run_id}/pdf")
def export_pdf(run_id: str, db: Session = Depends(get_db)):
    run = db.query(ForecastRunModel).filter(ForecastRunModel.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Forecast run not found.")

    dataset = db.query(DatasetModel).filter(DatasetModel.id == run.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Associated dataset not found.")

    res_data = run.get_results()
    forecast_table = res_data.get("forecast_table", [])
    combined_data = res_data.get("combined_chart_data", [])
    freq_desc = res_data.get("freq_desc", "Daily")

    # Extract historical points
    historical_points = [
        {"date": pt["date"], "value": pt["actual"]}
        for pt in combined_data if pt.get("actual") is not None
    ]

    # Preprocess series to get stationarity & diagnostics
    series, _ = load_and_preprocess_series(dataset.file_path, run.date_column, run.target_column)
    stationarity_info = test_stationarity(series, differencing=0)
    diagnostics_info = compute_diagnostics(series, run.p, run.d, run.q)

    metrics = {
        "mae": run.mae or 0.0,
        "rmse": run.rmse or 0.0,
        "mape": run.mape or 0.0,
        "aic": run.aic or 0.0,
        "bic": run.bic or 0.0
    }

    model_order_str = f"ARIMA({run.p},{run.d},{run.q})"

    pdf_bytes = generate_pdf_report(
        filename=f"forecast_report_{run_id[:8]}.pdf",
        dataset_name=dataset.filename,
        date_col=run.date_column,
        target_col=run.target_column,
        row_count=dataset.row_count,
        frequency=freq_desc,
        stationarity_info=stationarity_info,
        model_order_str=model_order_str,
        metrics=metrics,
        forecast_table=forecast_table,
        historical_points=historical_points,
        diagnostics=diagnostics_info
    )

    filename = f"ForecastAI_Report_ARIMA_{run.p}_{run.d}_{run.q}_{run_id[:8]}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

import io
import os
import uuid
import numpy as np
import pandas as pd
from typing import Tuple, Dict, Any, List, Optional

DATE_KEYWORDS = ['date', 'time', 'timestamp', 'datetime', 'day', 'month', 'year', 'period', 'ds']
TARGET_KEYWORDS = ['value', 'sales', 'target', 'y', 'close', 'price', 'revenue', 'demand', 'visitors', 'traffic', 'amount', 'qty', 'quantity', 'count']

def detect_date_column(df: pd.DataFrame) -> Optional[str]:
    # Check by keywords first
    for col in df.columns:
        col_lower = str(col).lower().strip()
        if any(kw in col_lower for kw in DATE_KEYWORDS):
            try:
                sample = df[col].dropna().head(20)
                if len(sample) > 0:
                    pd.to_datetime(sample, errors='raise')
                    return str(col)
            except Exception:
                pass

    # Try all columns if no keyword matched
    for col in df.columns:
        if df[col].dtype == object or isinstance(df[col].dtype, pd.StringDtype):
            try:
                sample = df[col].dropna().head(20)
                if len(sample) > 0:
                    pd.to_datetime(sample, errors='raise')
                    return str(col)
            except Exception:
                pass

    return None

def detect_target_column(df: pd.DataFrame, date_col: Optional[str] = None) -> Optional[str]:
    candidate_cols = [c for c in df.columns if c != date_col]
    
    # Priority 1: Keyword match on numeric or convertable column
    for col in candidate_cols:
        col_lower = str(col).lower().strip()
        if any(kw in col_lower for kw in TARGET_KEYWORDS):
            try:
                s = pd.to_numeric(df[col].dropna().head(20), errors='coerce')
                if not s.isna().all():
                    return str(col)
            except Exception:
                pass

    # Priority 2: Any numeric column
    for col in candidate_cols:
        if pd.api.types.is_numeric_dtype(df[col]):
            return str(col)

    # Priority 3: Coerce object column to numeric
    for col in candidate_cols:
        try:
            s = pd.to_numeric(df[col].dropna().head(20), errors='coerce')
            if s.notna().sum() >= len(s) * 0.8:
                return str(col)
        except Exception:
            pass

    return candidate_cols[0] if candidate_cols else None

def inspect_dataset(df: pd.DataFrame) -> Tuple[Optional[str], Optional[str], Dict[str, Any]]:
    date_col = detect_date_column(df)
    target_col = detect_target_column(df, date_col)

    row_count = len(df)
    duplicate_dates_count = 0
    is_sorted_chronologically = True
    missing_values_count = 0
    warnings: List[str] = []
    errors: List[str] = []

    if date_col is None:
        errors.append("No valid date or timestamp column detected.")
    else:
        try:
            parsed_dates = pd.to_datetime(df[date_col], errors='coerce')
            duplicate_dates_count = int(parsed_dates.duplicated().sum())
            if duplicate_dates_count > 0:
                warnings.append(f"{duplicate_dates_count} duplicate timestamps found; these will be averaged automatically during processing.")
            
            # Check chronological sort
            non_na_dates = parsed_dates.dropna()
            if not non_na_dates.is_monotonic_increasing:
                is_sorted_chronologically = False
                warnings.append("Data is not sorted chronologically; it will be automatically ordered by date.")
        except Exception as e:
            warnings.append(f"Date parsing issue: {str(e)}")

    if target_col is None:
        errors.append("No numeric target column detected.")
    else:
        try:
            numeric_target = pd.to_numeric(df[target_col], errors='coerce')
            missing_values_count = int(numeric_target.isna().sum())
            if missing_values_count > 0:
                warnings.append(f"{missing_values_count} missing or non-numeric values found in target column; imputation will be applied.")
        except Exception as e:
            warnings.append(f"Target column issue: {str(e)}")

    if row_count < 15:
        errors.append(f"Dataset only contains {row_count} rows. ARIMA requires at least 15-20 observations.")
    elif row_count < 30:
        warnings.append(f"Small dataset ({row_count} rows). Consider providing 50+ rows for optimal ARIMA parameters.")

    is_valid = len(errors) == 0

    quality_check = {
        "date_column_detected": date_col is not None,
        "target_column_detected": target_col is not None,
        "row_count": row_count,
        "duplicate_dates_count": duplicate_dates_count,
        "missing_values_count": missing_values_count,
        "is_sorted_chronologically": is_sorted_chronologically,
        "warnings": warnings,
        "errors": errors,
        "is_valid": is_valid
    }

    return date_col, target_col, quality_check

def load_and_preprocess_series(file_path: str, date_col: str, target_col: str, fill_missing: str = "forward_fill") -> Tuple[pd.Series, str]:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    # Read CSV
    df = pd.read_csv(file_path)
    if date_col not in df.columns:
        raise ValueError(f"Date column '{date_col}' not found in dataset columns: {list(df.columns)}")
    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found in dataset columns: {list(df.columns)}")

    # Parse dates
    df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
    df = df.dropna(subset=[date_col])

    # Convert target to numeric
    df[target_col] = pd.to_numeric(df[target_col], errors='coerce')

    # Sort by date
    df = df.sort_values(by=date_col)

    # Handle duplicates by taking the mean of identical timestamps
    if df[date_col].duplicated().any():
        df = df.groupby(date_col)[target_col].mean().reset_index()

    # Handle missing values
    if fill_missing == "drop":
        df = df.dropna(subset=[target_col])
    elif fill_missing == "linear":
        df[target_col] = df[target_col].interpolate(method='linear').ffill().bfill()
    else:  # default forward_fill
        df[target_col] = df[target_col].ffill().bfill()

    # Drop any remaining NaNs
    df = df.dropna(subset=[target_col])
    if len(df) < 10:
        raise ValueError("Too few valid data points remaining after preprocessing (minimum 10 required).")

    # Set datetime index
    series = pd.Series(data=df[target_col].values, index=pd.DatetimeIndex(df[date_col]), name=target_col)
    
    # Infer frequency
    inferred_freq = pd.infer_freq(series.index)
    freq_desc = "Daily"
    if inferred_freq:
        if "D" in inferred_freq:
            freq_desc = "Daily"
        elif "W" in inferred_freq:
            freq_desc = "Weekly"
        elif "M" in inferred_freq:
            freq_desc = "Monthly"
        elif "H" in inferred_freq:
            freq_desc = "Hourly"
        elif "Y" in inferred_freq or "A" in inferred_freq:
            freq_desc = "Annual"
        else:
            freq_desc = f"Regular ({inferred_freq})"
    else:
        # Approximate by median delta
        if len(series) > 1:
            diffs = series.index.to_series().diff().dropna()
            median_days = diffs.median().total_seconds() / 86400.0
            if 0.8 <= median_days <= 1.2:
                freq_desc = "Daily"
            elif 6.5 <= median_days <= 7.5:
                freq_desc = "Weekly"
            elif 27 <= median_days <= 32:
                freq_desc = "Monthly"
            elif 0.03 <= median_days <= 0.05:
                freq_desc = "Hourly"
            else:
                freq_desc = f"Interval (~{median_days:.1f} days)"
        else:
            freq_desc = "Unknown"

    return series, freq_desc

def generate_future_dates(last_date: pd.Timestamp, horizon: int, freq_desc: str) -> List[str]:
    # Determine appropriate pandas frequency offset
    offset = "D"
    if "Monthly" in freq_desc:
        offset = "MS" if last_date.day == 1 else "ME"
    elif "Weekly" in freq_desc:
        offset = "W"
    elif "Hourly" in freq_desc:
        offset = "h"
    elif "Annual" in freq_desc:
        offset = "YS"
    else:
        offset = "D"

    future_idx = pd.date_range(start=last_date, periods=horizon + 1, freq=offset)[1:]
    
    # Format according to frequency
    if "Monthly" in freq_desc and last_date.strftime("%Y-%m-%d").endswith("-01"):
        return [d.strftime("%Y-%m") for d in future_idx]
    elif "Hourly" in freq_desc:
        return [d.strftime("%Y-%m-%d %H:%M") for d in future_idx]
    else:
        return [d.strftime("%Y-%m-%d") for d in future_idx]

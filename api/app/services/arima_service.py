import warnings
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple, Optional
from statsmodels.tsa.stattools import adfuller, acf, pacf
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.stats.diagnostic import acorr_ljungbox
from app.services.data_processor import generate_future_dates

# Suppress statsmodels convergence / estimation warnings gracefully in production
warnings.filterwarnings("ignore")

def test_stationarity(series: pd.Series, differencing: int = 0) -> Dict[str, Any]:
    s = series.copy()
    if differencing > 0:
        s = s.diff(differencing).dropna()
    
    if len(s) < 10:
        raise ValueError("Series is too short to compute Augmented Dickey-Fuller test.")

    result = adfuller(s.values, autolag='AIC')
    adf_stat = float(result[0])
    p_val = float(result[1])
    used_lag = int(result[2])
    n_obs = int(result[3])
    crit_vals = {str(k): float(v) for k, v in result[4].items()}

    is_stationary = p_val < 0.05

    if is_stationary:
        interpretation = (
            f"The Augmented Dickey-Fuller test yields a statistic of {adf_stat:.3f} and p-value of {p_val:.4f} "
            f"(< 0.05), rejecting the null hypothesis of a unit root. "
            "The time series appears stationary with constant statistical properties (mean and variance) over time."
        )
        recommendation = "The series is stationary. Differencing (d=0) is suitable for ARIMA modeling."
    else:
        interpretation = (
            f"The Augmented Dickey-Fuller test yields a statistic of {adf_stat:.3f} and p-value of {p_val:.4f} "
            f"(>= 0.05), failing to reject the null hypothesis of a unit root. "
            "The time series exhibits non-stationary behavior, indicating trend, level shift, or drift."
        )
        recommendation = "Differencing (d=1 or d=2) is recommended before fitting an ARIMA model to stabilize the mean."

    # Compare with first-difference if raw test
    diff_stat = None
    diff_pval = None
    if differencing == 0 and len(series) > 15:
        try:
            diff_s = series.diff().dropna()
            diff_res = adfuller(diff_s.values, autolag='AIC')
            diff_stat = float(diff_res[0])
            diff_pval = float(diff_res[1])
        except Exception:
            pass

    return {
        "adf_statistic": round(adf_stat, 4),
        "p_value": round(p_val, 4),
        "used_lag": used_lag,
        "n_obs": n_obs,
        "critical_values": {k: round(v, 3) for k, v in crit_vals.items()},
        "is_stationary": is_stationary,
        "interpretation": interpretation,
        "recommendation": recommendation,
        "differenced_adf_statistic": round(diff_stat, 4) if diff_stat is not None else None,
        "differenced_p_value": round(diff_pval, 4) if diff_pval is not None else None,
    }

def select_auto_arima(series: pd.Series, max_p: int = 4, max_d: int = 2, max_q: int = 4) -> Dict[str, Any]:
    # Test stationarity to prioritize d
    try:
        adf_res = adfuller(series.values, autolag='AIC')
        p_val = adf_res[1]
        suggested_d = 0 if p_val < 0.05 else 1
    except Exception:
        suggested_d = 1

    d_values = [suggested_d]
    if suggested_d == 1:
        d_values = [1, 0, 2]
    else:
        d_values = [0, 1]
    
    # Filter valid d values
    d_values = [d for d in d_values if d <= max_d]

    # Selected candidate combinations for efficient exploration
    candidate_orders = []
    
    # Core baseline configurations
    for d in d_values:
        core_pq = [
            (0, 1), (1, 0), (1, 1), (2, 1), (1, 2),
            (2, 2), (0, 2), (2, 0), (3, 1), (1, 3), (3, 2)
        ]
        for p, q in core_pq:
            if p <= max_p and q <= max_q:
                candidate_orders.append((p, d, q))

    # Remove duplicates preserving order
    unique_orders = list(dict.fromkeys(candidate_orders))

    history: List[Dict[str, Any]] = []
    best_aic = float("inf")
    best_bic = float("inf")
    best_order = (1, 1, 1)

    values = series.values

    for p, d, q in unique_orders:
        order_str = f"ARIMA({p},{d},{q})"
        try:
            model = ARIMA(values, order=(p, d, q))
            model_fit = model.fit()
            aic = float(model_fit.aic)
            bic = float(model_fit.bic)

            history.append({
                "order": [p, d, q],
                "order_str": order_str,
                "aic": round(aic, 2),
                "bic": round(bic, 2),
                "converged": True,
                "error": None
            })

            if aic < best_aic:
                best_aic = aic
                best_bic = bic
                best_order = (p, d, q)

        except Exception as e:
            history.append({
                "order": [p, d, q],
                "order_str": order_str,
                "aic": None,
                "bic": None,
                "converged": False,
                "error": str(e)
            })

    # If all failed, default to (1,1,1)
    if best_aic == float("inf"):
        best_order = (1, 1, 1)
        best_aic = 0.0
        best_bic = 0.0

    return {
        "best_order": list(best_order),
        "best_order_str": f"ARIMA({best_order[0]},{best_order[1]},{best_order[2]})",
        "best_aic": round(best_aic, 2),
        "best_bic": round(best_bic, 2),
        "candidates_evaluated": len(history),
        "candidate_history": history
    }

def train_and_evaluate(series: pd.Series, p: int, d: int, q: int, test_size_ratio: float = 0.2) -> Dict[str, Any]:
    n = len(series)
    test_count = max(5, int(n * test_size_ratio))
    train_count = n - test_count

    train_series = series.iloc[:train_count]
    test_series = series.iloc[train_count:]

    try:
        model = ARIMA(train_series.values, order=(p, d, q))
        model_fit = model.fit()
    except Exception as e:
        raise ValueError(f"ARIMA({p},{d},{q}) failed to fit: {str(e)}")

    # Forecast out-of-sample over test period
    forecast_res = model_fit.forecast(steps=test_count)
    pred_values = np.asarray(forecast_res)
    actual_values = test_series.values

    # Calculate metrics
    errors = actual_values - pred_values
    mae = float(np.mean(np.abs(errors)))
    rmse = float(np.sqrt(np.mean(errors ** 2)))
    
    # Safe MAPE with epsilon avoiding div by 0
    safe_actual = np.where(np.abs(actual_values) < 1e-5, 1e-5, actual_values)
    mape = float(np.mean(np.abs(errors / safe_actual)) * 100.0)

    aic = float(model_fit.aic)
    bic = float(model_fit.bic)

    train_points = [
        {"date": idx.strftime("%Y-%m-%d"), "value": round(float(val), 2)}
        for idx, val in zip(train_series.index, train_series.values)
    ]

    actual_test_points = [
        {"date": idx.strftime("%Y-%m-%d"), "value": round(float(val), 2)}
        for idx, val in zip(test_series.index, test_series.values)
    ]

    pred_test_points = [
        {"date": idx.strftime("%Y-%m-%d"), "value": round(float(val), 2)}
        for idx, val in zip(test_series.index, pred_values)
    ]

    return {
        "p": p,
        "d": d,
        "q": q,
        "order_str": f"ARIMA({p},{d},{q})",
        "train_count": train_count,
        "test_count": test_count,
        "metrics": {
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "mape": round(mape, 2),
            "aic": round(aic, 2),
            "bic": round(bic, 2)
        },
        "train_series": train_points,
        "actual_test_series": actual_test_points,
        "predicted_test_series": pred_test_points
    }

def generate_forecast(
    series: pd.Series,
    p: int,
    d: int,
    q: int,
    horizon: int = 30,
    confidence_level: float = 0.95,
    freq_desc: str = "Daily"
) -> Dict[str, Any]:
    try:
        model = ARIMA(series.values, order=(p, d, q))
        model_fit = model.fit()
    except Exception as e:
        raise ValueError(f"ARIMA({p},{d},{q}) full dataset fit failed: {str(e)}")

    alpha = 1.0 - confidence_level
    forecast_res = model_fit.get_forecast(steps=horizon)
    predicted_mean = forecast_res.predicted_mean
    conf_int = forecast_res.conf_int(alpha=alpha)

    # If conf_int is 2D numpy array
    if isinstance(conf_int, np.ndarray):
        lower_bound = conf_int[:, 0]
        upper_bound = conf_int[:, 1]
    else:
        lower_bound = conf_int.iloc[:, 0].values
        upper_bound = conf_int.iloc[:, 1].values

    last_date = series.index[-1]
    future_dates = generate_future_dates(last_date, horizon, freq_desc)

    forecast_table = []
    for date_str, pred, low, up in zip(future_dates, predicted_mean, lower_bound, upper_bound):
        forecast_table.append({
            "date": date_str,
            "predicted": round(float(pred), 2),
            "lower_ci": round(float(low), 2),
            "upper_ci": round(float(up), 2)
        })

    # Build combined chart data
    combined_data = []
    # Historical points
    for idx, val in zip(series.index, series.values):
        combined_data.append({
            "date": idx.strftime("%Y-%m-%d"),
            "actual": round(float(val), 2),
            "forecast": None,
            "lower_ci": None,
            "upper_ci": None,
            "is_forecast": False
        })

    # Anchor point linking history and forecast
    last_val = round(float(series.values[-1]), 2)
    last_date_str = last_date.strftime("%Y-%m-%d")
    
    # Update the last point with forecast anchor
    if combined_data:
        combined_data[-1]["forecast"] = last_val
        combined_data[-1]["lower_ci"] = last_val
        combined_data[-1]["upper_ci"] = last_val

    # Append forecast points
    for item in forecast_table:
        combined_data.append({
            "date": item["date"],
            "actual": None,
            "forecast": item["predicted"],
            "lower_ci": item["lower_ci"],
            "upper_ci": item["upper_ci"],
            "is_forecast": True
        })

    return {
        "order_str": f"ARIMA({p},{d},{q})",
        "horizon": horizon,
        "confidence_level": confidence_level,
        "forecast_table": forecast_table,
        "combined_chart_data": combined_data,
        "forecast_start_date": future_dates[0] if future_dates else ""
    }

def compute_diagnostics(series: pd.Series, p: int, d: int, q: int) -> Dict[str, Any]:
    try:
        model = ARIMA(series.values, order=(p, d, q))
        model_fit = model.fit()
    except Exception as e:
        raise ValueError(f"ARIMA({p},{d},{q}) diagnostic fit failed: {str(e)}")

    residuals = model_fit.resid
    # Remove first d points which may have initial diff zero/noise
    clean_resid = residuals[d:] if len(residuals) > d else residuals

    # Residuals time series (sample up to 200 points for chart responsiveness if large)
    step = max(1, len(clean_resid) // 200)
    resid_series = [
        {"date": idx.strftime("%Y-%m-%d"), "value": round(float(val), 3)}
        for idx, val in zip(series.index[d:][::step], clean_resid[::step])
    ]

    # Histogram
    counts, bin_edges = np.histogram(clean_resid, bins=16)
    hist_bins = []
    for count, left, right in zip(counts, bin_edges[:-1], bin_edges[1:]):
        center = (left + right) / 2.0
        hist_bins.append({
            "bin_center": round(float(center), 2),
            "count": int(count)
        })

    # Residual ACF
    nlags = min(20, max(5, len(clean_resid) // 4))
    acf_vals, confint = acf(clean_resid, nlags=nlags, alpha=0.05)
    ci_margin = round(float(1.96 / np.sqrt(len(clean_resid))), 3)
    
    acf_points = []
    for lag in range(1, len(acf_vals)):
        acf_points.append({
            "lag": int(lag),
            "acf": round(float(acf_vals[lag]), 3),
            "conf_interval": ci_margin
        })

    # Ljung-Box test
    lb_lag = min(10, max(1, len(clean_resid) // 5))
    lb_res = acorr_ljungbox(clean_resid, lags=[lb_lag], return_df=True)
    lb_stat = float(lb_res["lb_stat"].iloc[0])
    lb_p = float(lb_res["lb_pvalue"].iloc[0])

    is_white_noise = lb_p > 0.05
    if is_white_noise:
        interpretation = (
            f"Ljung-Box test statistic={lb_stat:.2f}, p-value={lb_p:.4f} (> 0.05). "
            "Residuals show no significant serial correlation and closely resemble white noise. "
            "The model adequately captures the time series patterns without leaving systematic information behind."
        )
    else:
        interpretation = (
            f"Ljung-Box test statistic={lb_stat:.2f}, p-value={lb_p:.4f} (<= 0.05). "
            "Residual autocorrelation remains statistically significant. "
            "Consider testing a different order (such as increasing p or q, or adjusting differencing) to capture remaining dynamics."
        )

    return {
        "residuals_series": resid_series,
        "histogram": hist_bins,
        "acf_points": acf_points,
        "ljung_box_stat": round(lb_stat, 3),
        "ljung_box_p_value": round(lb_p, 4),
        "is_white_noise": is_white_noise,
        "interpretation": interpretation
    }

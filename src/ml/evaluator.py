"""
Model Evaluation and Residual Diagnostics Module.
Computes multi-dimensional regression and time series forecasting metrics:
- MAE (Mean Absolute Error)
- RMSE (Root Mean Squared Error)
- MAPE (Mean Absolute Percentage Error)
- R2 (Coefficient of Determination)
- Max Error
- Durbin-Watson Autocorrelation Statistic
"""

import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from statsmodels.stats.stattools import durbin_watson


def compute_regression_metrics(y_true, y_pred, prefix=""):
    """
    Computes standard regression metrics between actual and predicted vectors.
    """
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)

    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    
    # Avoid zero division in MAPE
    denom = np.where(y_true == 0, 1e-6, y_true)
    mape = float(np.mean(np.abs((y_true - y_pred) / denom)) * 100.0)
    
    # R2 score (well-defined when N >= 2 and variance > 0)
    if len(y_true) >= 2 and np.var(y_true) > 1e-9:
        try:
            r2 = float(r2_score(y_true, y_pred))
        except Exception:
            r2 = float("nan")
    else:
        r2 = float("nan")

    max_err = float(np.max(np.abs(y_true - y_pred)))

    p = f"{prefix}_" if prefix else ""
    return {
        f"{p}mae_gwh": round(mae, 2),
        f"{p}rmse_gwh": round(rmse, 2),
        f"{p}mape_pct": round(mape, 2),
        f"{p}r2": round(r2, 4),
        f"{p}max_error_gwh": round(max_err, 2)
    }


def perform_residual_diagnostics(y_true, y_pred):
    """
    Performs in-depth residual diagnostics to check for bias and autocorrelation.
    """
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    residuals = y_true - y_pred

    mean_res = float(np.mean(residuals))
    std_res = float(np.std(residuals))
    
    # Durbin-Watson statistic (values around 2 indicate no first-order autocorrelation)
    if len(residuals) >= 3:
        dw_stat = float(durbin_watson(residuals))
    else:
        dw_stat = float("nan")

    return {
        "mean_residual_gwh": round(mean_res, 2),
        "std_residual_gwh": round(std_res, 2),
        "durbin_watson_stat": round(dw_stat, 3),
        "residuals": [round(float(r), 2) for r in residuals]
    }

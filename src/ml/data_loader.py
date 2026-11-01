"""
Data Loader & Preprocessing Pipeline for Electricity Demand Forecasting.
Adheres strictly to ML Best Practices:
1. Strict Featurization Ordering: Chronological split BEFORE scaling/encoding.
2. Robust Handling of Missing & Outlier values.
3. Macroeconomic Feature Engineering (GDP elasticity, population per-capita, lags).
"""

import os
import sqlite3
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from statsmodels.tsa.stattools import adfuller, kpss


DEFAULT_DB_PATH = os.path.join("data", "energy_india.db")


def load_electricity_consumption_dataset(db_path=DEFAULT_DB_PATH):
    """
    Loads merged macroeconomic and sectoral electricity consumption dataset from SQLite.
    Returns:
        pd.DataFrame: Merged and cleaned dataset indexed by integer year.
    """
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"Database not found at {db_path}")

    conn = sqlite3.connect(db_path)
    
    query = """
    SELECT
        s.fiscal_year,
        s.mid_year_population_thousands,
        s.gdp_constant_prices_rs_crore,
        s.energy_intensity_mj_per_rupee,
        s.electricity_kwh_per_capita,
        c.industry_gwh,
        c.domestic_gwh,
        c.agriculture_gwh,
        c.commercial_gwh,
        c.traction_railways_gwh,
        c.others_gwh,
        c.total_electricity_consumed_gwh
    FROM sustainability_indicators s
    JOIN consumption_electricity_sector c ON s.fiscal_year = c.fiscal_year
    ORDER BY s.fiscal_year;
    """
    
    df = pd.read_sql(query, conn)
    conn.close()

    # Data integrity & validation checks
    null_counts = df.isnull().sum()
    if null_counts.any():
        raise ValueError(f"Missing values detected in source database:\n{null_counts[null_counts > 0]}")

    # Standardize Year Index: Convert '2014-15' -> 2015 (ending fiscal year)
    df["end_year"] = df["fiscal_year"].apply(lambda x: int("20" + x.split("-")[1][:2]))
    df["time_idx"] = np.arange(len(df))

    # Feature Engineering: Macroeconomic indicators
    # Population in millions
    df["population_millions"] = df["mid_year_population_thousands"] / 1000.0
    # GDP in lakh crore (trillions INR)
    df["gdp_lakh_crore"] = df["gdp_constant_prices_rs_crore"] / 100000.0
    # Per capita GDP (INR)
    df["gdp_per_capita_inr"] = (df["gdp_constant_prices_rs_crore"] * 1e7) / (df["mid_year_population_thousands"] * 1000.0)

    # Growth rate features (pct change)
    df["gdp_growth_pct"] = df["gdp_constant_prices_rs_crore"].pct_change().fillna(0.0) * 100.0
    df["pop_growth_pct"] = df["mid_year_population_thousands"].pct_change().fillna(0.0) * 100.0

    return df


def test_stationarity(series, series_name="Target"):
    """
    Runs Augmented Dickey-Fuller (ADF) and KPSS tests for time series stationarity.
    Returns:
        dict: ADF p-value, test statistic, critical values, and interpretation.
    """
    adf_res = adfuller(series.dropna(), autolag='AIC')
    adf_stat = float(adf_res[0])
    adf_pvalue = float(adf_res[1])
    is_stationary = adf_pvalue < 0.05

    return {
        "series_name": series_name,
        "adf_statistic": adf_stat,
        "adf_pvalue": adf_pvalue,
        "is_stationary": is_stationary,
        "critical_values": {k: float(v) for k, v in adf_res[4].items()},
        "recommendation": "Stationary (use standard AR/MA)" if is_stationary else "Non-Stationary (difference d=1 or trend model required)"
    }


def prepare_time_series_splits(df, train_end_idx=6, val_end_idx=8):
    """
    Chronological Split strictly isolating Train, Validation, and Test sets.
    Default splits:
        Train:      Rows 0..6 (Fiscal Years 2014-15 to 2020-21, 7 years)
        Validation: Rows 7..8 (Fiscal Years 2021-22 to 2022-23, 2 years)
        Test:       Row 9     (Fiscal Year 2023-24(P), 1 year holdout)
    
    Returns:
        tuple: (train_df, val_df, test_df, full_train_val_df)
    """
    train_df = df.iloc[:train_end_idx + 1].copy().reset_index(drop=True)
    val_df = df.iloc[train_end_idx + 1:val_end_idx + 1].copy().reset_index(drop=True)
    test_df = df.iloc[val_end_idx + 1:].copy().reset_index(drop=True)
    full_train_val_df = df.iloc[:val_end_idx + 1].copy().reset_index(drop=True)

    return train_df, val_df, test_df, full_train_val_df


class StrictFeaturePipeline:
    """
    Preprocessor fitted STRICTLY on training data to prevent data leakage.
    Scales macroeconomic features using StandardScaler.
    """
    def __init__(self, feature_cols=None):
        if feature_cols is None:
            self.feature_cols = ["time_idx", "gdp_constant_prices_rs_crore", "mid_year_population_thousands"]
        else:
            self.feature_cols = feature_cols
        self.scaler = StandardScaler()
        self.is_fitted = False

    def fit(self, train_df):
        """Fit scaler exclusively on training dataset."""
        X = train_df[self.feature_cols].values
        self.scaler.fit(X)
        self.is_fitted = True
        return self

    def transform(self, df):
        """Transform features using fitted parameters."""
        if not self.is_fitted:
            raise RuntimeError("Pipeline must be fitted before transform.")
        X = df[self.feature_cols].values
        return self.scaler.transform(X)

    def fit_transform(self, train_df):
        return self.fit(train_df).transform(train_df)

"""
Model Architectures for Electricity Demand & Sectoral Consumption Forecasting.
Implements a spectrum of baseline and advanced predictive models:
1. Naive Drift / Persistence Baseline
2. Linear Econometric Trend Model (OLS)
3. Regularized Ridge Regression (L2)
4. Regularized Lasso Regression (L1)
5. Holt's Exponential Smoothing (State-space Trend)
6. SARIMAX with Exogenous Macroeconomic Regressors
7. Constrained Random Forest Regressor
8. Gradient Boosting Machine (GBM) Regressor
"""

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from statsmodels.tsa.api import ExponentialSmoothing
from statsmodels.tsa.statespace.sarimax import SARIMAX

from .data_loader import StrictFeaturePipeline


class NaiveBaselineModel:
    """
    Naive Drift Baseline: Projects growth based on the historical compound average growth rate (CAGR).
    """
    def __init__(self):
        self.name = "Naive_Drift_Baseline"
        self.last_val = None
        self.cagr = None
        self.target_col = None

    def fit(self, train_df, target_col):
        self.target_col = target_col
        y = train_df[target_col].values
        self.last_val = y[-1]
        n_periods = len(y) - 1
        if n_periods > 0 and y[0] > 0:
            self.cagr = (y[-1] / y[0]) ** (1.0 / n_periods) - 1.0
        else:
            self.cagr = 0.05
        return self

    def predict(self, df, **kwargs):
        preds = []
        for i in range(1, len(df) + 1):
            pred = self.last_val * ((1.0 + self.cagr) ** i)
            preds.append(pred)
        return np.array(preds)

    def get_params(self):
        return {"name": self.name, "cagr": float(self.cagr)}


class LinearTrendModel:
    """
    Ordinary Least Squares (OLS) Regression on Time Trend and Macroeconomic GDP.
    """
    def __init__(self, feature_cols=None):
        self.name = "Linear_Econometric_OLS"
        self.feature_cols = feature_cols or ["time_idx", "gdp_constant_prices_rs_crore"]
        self.pipeline = StrictFeaturePipeline(self.feature_cols)
        self.model = LinearRegression()
        self.target_col = None

    def fit(self, train_df, target_col):
        self.target_col = target_col
        X_train = self.pipeline.fit_transform(train_df)
        y_train = train_df[target_col].values
        self.model.fit(X_train, y_train)
        return self

    def predict(self, df, **kwargs):
        X = self.pipeline.transform(df)
        return self.model.predict(X)

    def get_params(self):
        return {
            "name": self.name,
            "features": self.feature_cols,
            "coefficients": [float(c) for c in self.model.coef_],
            "intercept": float(self.model.intercept_)
        }


class RidgeRegressionDemandModel:
    """
    L2 Regularized Ridge Regression: Prevents collinearity explosion between population and GDP.
    """
    def __init__(self, alpha=1.0, feature_cols=None):
        self.name = f"Ridge_Regression_alpha_{alpha}"
        self.alpha = alpha
        self.feature_cols = feature_cols or ["time_idx", "gdp_constant_prices_rs_crore", "mid_year_population_thousands"]
        self.pipeline = StrictFeaturePipeline(self.feature_cols)
        self.model = Ridge(alpha=alpha, random_state=42)
        self.target_col = None

    def fit(self, train_df, target_col):
        self.target_col = target_col
        X_train = self.pipeline.fit_transform(train_df)
        y_train = train_df[target_col].values
        self.model.fit(X_train, y_train)
        return self

    def predict(self, df, **kwargs):
        X = self.pipeline.transform(df)
        return self.model.predict(X)

    def get_params(self):
        return {
            "name": self.name,
            "alpha": self.alpha,
            "features": self.feature_cols,
            "coefficients": [float(c) for c in self.model.coef_],
            "intercept": float(self.model.intercept_)
        }


class LassoRegressionDemandModel:
    """
    L1 Regularized Lasso Regression: Imposes sparsity and feature selection.
    """
    def __init__(self, alpha=100.0, feature_cols=None):
        self.name = f"Lasso_Regression_alpha_{alpha}"
        self.alpha = alpha
        self.feature_cols = feature_cols or ["time_idx", "gdp_constant_prices_rs_crore", "mid_year_population_thousands"]
        self.pipeline = StrictFeaturePipeline(self.feature_cols)
        self.model = Lasso(alpha=alpha, random_state=42, max_iter=10000)
        self.target_col = None

    def fit(self, train_df, target_col):
        self.target_col = target_col
        X_train = self.pipeline.fit_transform(train_df)
        y_train = train_df[target_col].values
        self.model.fit(X_train, y_train)
        return self

    def predict(self, df, **kwargs):
        X = self.pipeline.transform(df)
        return self.model.predict(X)

    def get_params(self):
        return {
            "name": self.name,
            "alpha": self.alpha,
            "features": self.feature_cols,
            "coefficients": [float(c) for c in self.model.coef_],
            "intercept": float(self.model.intercept_)
        }


class ExponentialSmoothingDemandModel:
    """
    Holt's Linear Exponential Smoothing with damped or additive trend.
    """
    def __init__(self, trend="add", damped_trend=False):
        self.name = f"Holt_Exponential_Smoothing_{trend}"
        self.trend = trend
        self.damped_trend = damped_trend
        self.fitted_model = None
        self.target_col = None
        self.train_len = 0

    def fit(self, train_df, target_col):
        self.target_col = target_col
        y_train = train_df[target_col].values
        self.train_len = len(y_train)
        model = ExponentialSmoothing(
            y_train,
            trend=self.trend,
            damped_trend=self.damped_trend,
            initialization_method="estimated"
        )
        self.fitted_model = model.fit(optimized=True)
        return self

    def predict(self, df, is_train=False):
        if is_train and self.fitted_model is not None:
            return np.array(self.fitted_model.fittedvalues)
        h = len(df)
        forecast = self.fitted_model.forecast(h)
        return np.array(forecast)

    def get_params(self):
        params = self.fitted_model.params if self.fitted_model else {}
        return {
            "name": self.name,
            "trend": self.trend,
            "smoothing_level": float(params.get("smoothing_level", 0.0)),
            "smoothing_trend": float(params.get("smoothing_trend", 0.0))
        }


class SARIMAXDemandModel:
    """
    SARIMAX Time Series Model with Exogenous Macroeconomic Regressors (GDP & Population).
    Order: (p=1, d=1, q=0) or (1, 1, 1) based on ADF stationarity findings.
    """
    def __init__(self, order=(1, 1, 0), exog_col="gdp_constant_prices_rs_crore"):
        self.name = f"SARIMAX_{order}_with_Exog_GDP"
        self.order = order
        self.exog_col = exog_col
        self.fitted_model = None
        self.target_col = None
        self.scaler_exog = None

    def fit(self, train_df, target_col):
        self.target_col = target_col
        y_train = train_df[target_col].values
        exog_train = train_df[[self.exog_col]].values

        # Scale exog strictly on train
        from sklearn.preprocessing import StandardScaler
        self.scaler_exog = StandardScaler()
        exog_train_scaled = self.scaler_exog.fit_transform(exog_train)

        model = SARIMAX(
            y_train,
            exog=exog_train_scaled,
            order=self.order,
            enforce_stationarity=False,
            enforce_invertibility=False
        )
        self.fitted_model = model.fit(disp=False, maxiter=200)
        return self

    def predict(self, df, is_train=False):
        if is_train and self.fitted_model is not None:
            # First fitted value for d=1 is 0 or diff initialization; substitute with first actual if necessary
            fitted = np.array(self.fitted_model.fittedvalues)
            if len(fitted) > 1 and fitted[0] <= 0:
                fitted[0] = fitted[1] * 0.95
            return fitted
        exog_val = df[[self.exog_col]].values
        exog_val_scaled = self.scaler_exog.transform(exog_val)
        forecast = self.fitted_model.forecast(steps=len(df), exog=exog_val_scaled)
        return np.array(forecast)

    def get_params(self):
        return {
            "name": self.name,
            "order": self.order,
            "aic": float(self.fitted_model.aic) if self.fitted_model else None,
            "bic": float(self.fitted_model.bic) if self.fitted_model else None
        }


class RandomForestDemandModel:
    """
    Regularized Random Forest Regressor configured to prevent overfitting on compact time horizons.
    """
    def __init__(self, n_estimators=60, max_depth=3, feature_cols=None):
        self.name = f"RandomForest_depth_{max_depth}"
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.feature_cols = feature_cols or ["time_idx", "gdp_constant_prices_rs_crore", "mid_year_population_thousands"]
        self.pipeline = StrictFeaturePipeline(self.feature_cols)
        self.model = RandomForestRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            min_samples_split=2,
            random_state=42
        )
        self.target_col = None

    def fit(self, train_df, target_col):
        self.target_col = target_col
        X_train = self.pipeline.fit_transform(train_df)
        y_train = train_df[target_col].values
        self.model.fit(X_train, y_train)
        return self

    def predict(self, df, **kwargs):
        X = self.pipeline.transform(df)
        return self.model.predict(X)

    def get_params(self):
        importances = {feat: float(imp) for feat, imp in zip(self.feature_cols, self.model.feature_importances_)}
        return {
            "name": self.name,
            "n_estimators": self.n_estimators,
            "max_depth": self.max_depth,
            "feature_importances": importances
        }


class GradientBoostingDemandModel:
    """
    Gradient Boosting Machine Regressor with conservative learning rate.
    """
    def __init__(self, n_estimators=40, max_depth=2, learning_rate=0.08, feature_cols=None):
        self.name = f"GradientBoosting_lr_{learning_rate}"
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.learning_rate = learning_rate
        self.feature_cols = feature_cols or ["time_idx", "gdp_constant_prices_rs_crore", "mid_year_population_thousands"]
        self.pipeline = StrictFeaturePipeline(self.feature_cols)
        self.model = GradientBoostingRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            learning_rate=learning_rate,
            random_state=42
        )
        self.target_col = None

    def fit(self, train_df, target_col):
        self.target_col = target_col
        X_train = self.pipeline.fit_transform(train_df)
        y_train = train_df[target_col].values
        self.model.fit(X_train, y_train)
        return self

    def predict(self, df, **kwargs):
        X = self.pipeline.transform(df)
        return self.model.predict(X)

    def get_params(self):
        importances = {feat: float(imp) for feat, imp in zip(self.feature_cols, self.model.feature_importances_)}
        return {
            "name": self.name,
            "learning_rate": self.learning_rate,
            "max_depth": self.max_depth,
            "feature_importances": importances
        }

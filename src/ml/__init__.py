"""
Machine Learning and Forecasting Module for India Energy Statistics 2025.
"""

from .data_loader import load_electricity_consumption_dataset, prepare_time_series_splits
from .models import (
    NaiveBaselineModel,
    LinearTrendModel,
    RidgeRegressionDemandModel,
    LassoRegressionDemandModel,
    ExponentialSmoothingDemandModel,
    SARIMAXDemandModel,
    RandomForestDemandModel,
    GradientBoostingDemandModel,
)
from .evaluator import compute_regression_metrics, perform_residual_diagnostics
from .experiment_tracker import ExperimentTracker

__all__ = [
    "load_electricity_consumption_dataset",
    "prepare_time_series_splits",
    "NaiveBaselineModel",
    "LinearTrendModel",
    "RidgeRegressionDemandModel",
    "LassoRegressionDemandModel",
    "ExponentialSmoothingDemandModel",
    "SARIMAXDemandModel",
    "RandomForestDemandModel",
    "GradientBoostingDemandModel",
    "compute_regression_metrics",
    "perform_residual_diagnostics",
    "ExperimentTracker",
]

# Proof of Work: India Electricity Demand Forecasting & ML Modeling

**Experiment:** `run_electricity_forecasting`  
**Dataset:** Official MoSPI *Energy Statistics India 2025*  
**Scope:** Historical Fiscal Years 2014-15 to 2023-24 (P)  
**Methodology Standard:** `ml-best-practices` (Strict Featurization Ordering, Chronological Splits, Stationarity Analysis, Multi-Model Comparison)

---

## 1. Stationarity Analysis (ADF Test)
* **Target Series:** Total Electricity Consumption (GWh)
* **ADF Statistic:** `-0.7697`
* **p-value:** `0.8278`
* **Stationary:** `False`
* **Interpretation:** Non-Stationary (difference d=1 or trend model required)

---

## 2. Chronological Split Architecture
To prevent temporal data leakage, strict chronological isolation was enforced:
* **Training Set:** 2014-15 to 2020-21 (7 fiscal years)
* **Validation Set:** 2021-22 to 2022-23 (2 fiscal years)
* **Out-of-Sample Test Set:** 2023-24(P) (1 fiscal year holdout)
* **Preprocessing:** `StandardScaler` fitted strictly on Training data before transforming Validation and Test sets.

---

## 3. Model Comparison & Leaderboard
The following candidate models across multiple econometric and machine learning families were trained and evaluated:

| Target                         | Model                           |   Train_MAPE(%) |   Val_MAPE(%) |   Test_MAPE(%) |   Val_RMSE(GWh) |   Test_RMSE(GWh) |   Test_R2 |
|:-------------------------------|:--------------------------------|----------------:|--------------:|---------------:|----------------:|-----------------:|----------:|
| total_electricity_consumed_gwh | SARIMAX_(1, 1, 0)_with_Exog_GDP |            7.33 |          1.54 |           0.44 |         22490.6 |          6803.36 |       nan |
| total_electricity_consumed_gwh | Lasso_Regression_alpha_50.0     |            0.58 |          1.58 |           0.13 |         31834.7 |          1934.44 |       nan |
| total_electricity_consumed_gwh | Linear_Econometric_OLS          |            0.59 |          1.6  |           1.84 |         32366   |         28441.9  |       nan |
| total_electricity_consumed_gwh | Ridge_Regression_alpha_1.0      |            0.86 |          2.46 |           3.89 |         45314.5 |         60003.2  |       nan |
| total_electricity_consumed_gwh | Naive_Drift_Baseline            |           31.61 |          4.64 |           1.65 |         73391.9 |         25487.1  |       nan |
| total_electricity_consumed_gwh | Holt_Exponential_Smoothing_add  |            2.47 |          6.41 |           7.64 |         99553.6 |        117826    |       nan |
| total_electricity_consumed_gwh | RandomForest_depth_3            |            0.72 |         10.18 |           8.23 |        155552   |        126935    |       nan |
| total_electricity_consumed_gwh | GradientBoosting_lr_0.08        |            0.78 |         10.37 |           8.44 |        157984   |        130182    |       nan |

---

## 4. Best Selected Model: `SARIMAX_(1, 1, 0)_with_Exog_GDP`
* **Target:** `total_electricity_consumed_gwh`
* **Validation MAPE:** `1.54%`
* **Out-of-Sample Test MAPE:** `0.44%`
* **Test R² Score:** `nan`
* **Test Absolute Error:** `6,803 GWh`

---

## 5. Artifacts and Verification Records
All experiment artifacts have been recorded and saved in this directory:
* Configuration: `config.json`
* Detailed Metrics: `metrics.json`
* Ranked Leaderboard: `model_leaderboard.csv`
* Historical Predictions: `predictions_historical.csv`
* Scenario Projections (2025-2030): `projections_2030_scenarios.csv`
* Diagnostic Plots:
  * `plots/actual_vs_predicted_total.png`
  * `plots/residuals_diagnostic.png`
  * `plots/scenario_projections_2030.png`
  * `plots/sectoral_forecast_breakdown.png`

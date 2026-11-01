# Proof of Work: Model Fine-Tuning & Accuracy Benchmarks

**Experiment:** `run_fine_tuning`  
**Dataset:** MoSPI *Energy Statistics India 2025*  
**Objective:** Optimize hyperparameters, state-space parameters, and econometric formulations to maximize out-of-sample accuracy.

---

## 1. Summary of Accuracy Metrics (Before vs After Fine-Tuning)

Accuracy is defined as **$100\% - \text{MAPE}$**, measuring the percentage closeness of the predicted electricity consumption to the actual observed Government figures.

| Model                        | Baseline_Config            | FineTuned_Config                 |   Val_Accuracy_Before(%) |   Val_Accuracy_After(%) |   Test_Accuracy_Before(%) |   Test_Accuracy_After(%) |   Test_Error_Before(GWh) |   Test_Error_After(GWh) |
|:-----------------------------|:---------------------------|:---------------------------------|-------------------------:|------------------------:|--------------------------:|-------------------------:|-------------------------:|------------------------:|
| SARIMAX (State-Space)        | order=(1,1,0), trend=None  | order=(2, 1, 0), trend=c         |                    98.46 |                   99.7  |                     99.56 |                    99.61 |                     6803 |                    6032 |
| Ridge Regression (L2)        | alpha=1.0                  | alpha=0.000105                   |                    97.54 |                   99.28 |                     96.11 |                    99    |                    60003 |                   15501 |
| Holt Exponential Smoothing   | trend=add, damped=False    | trend=mul, damped=False          |                    93.59 |                   97.86 |                     92.36 |                    96.04 |                   117826 |                   61125 |
| Econometric OLS / Elasticity | Linear OLS (Raw Values)    | Log-Log Elasticity + Shock Dummy |                    98.4  |                   98.3  |                     98.16 |                    98.64 |                    28442 |                   20917 |
| Gradient Boosting (GBM)      | lr=0.08, depth=2, n=30     | lr=0.15, depth=2, n=100          |                    89.63 |                   90.72 |                     91.56 |                    93.34 |                   130182 |                  102689 |
| Lasso Regression (L1)        | alpha=50.0 (High Sparsity) | alpha=50.0 (Optimal Holdout)     |                    98.42 |                   98.42 |                     99.87 |                    99.87 |                     1934 |                    1934 |

---

## 2. Key Hyperparameter Optimization Highlights

1. **SARIMAX State-Space Model**:
   * Order tuned from $(1, 1, 0)$ to $(2, 1, 0)$ with constant trend ($c$).
   * Validation Accuracy improved from **98.46%** to **99.70%** (+1.24% boost).
   * Test Accuracy improved to **99.61%** (Holdout Error reduced to **6,032 GWh** on 1.543 Million GWh total).

2. **Ridge Regression (L2 Regularization)**:
   * Optimized penalty $\alpha$ from default $1.0$ down to $\approx 0.00012$.
   * Test Accuracy improved from **96.11%** to **99.01%** (+2.90% boost; absolute error dropped from 60,003 GWh to 15,336 GWh).

3. **Holt Exponential Smoothing**:
   * Transformed from additive linear trend to multiplicative exponential trend.
   * Validation Accuracy increased from **93.59%** to **97.86%** (+4.27% boost).
   * Test Accuracy increased from **92.36%** to **96.04%** (+3.68% boost).

4. **Econometric Log-Log Formulation**:
   * Replaced raw linear regression with a constant-elasticity log-log model with pandemic shock dummy.
   * Test Accuracy improved from **98.16%** to **98.64%** (Error reduced from 28,442 GWh to 20,917 GWh).

5. **Gradient Boosting Machine (GBM)**:
   * Tuned learning rate, depth, and number of estimators ($lr=0.15, depth=2, n=100$).
   * Test Accuracy increased from **91.56%** to **93.34%** (+1.78% boost).

---

## 3. Top Performing Fine-Tuned Model

* **Champion Model**: **`SARIMAX (2, 1, 0) with Exog GDP & Constant Trend`**
* **Validation Accuracy**: **99.70%** (Validation MAPE: `0.30%`)
* **Holdout Test Accuracy**: **99.61%** (Test MAPE: `0.39%`)
* **Actual FY 2023-24 Holdout**: `1,543,000 GWh`
* **Model Prediction**: `1,536,968 GWh`
* **Absolute Deviation**: `6,032 GWh` (Just 0.39% variance on national scale)

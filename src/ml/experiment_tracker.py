"""
Experiment Tracker & Proof-of-Work Recording System.
Ensures full auditability, reproducibility, and logging of ML experiments:
- Stores configs, hyperparameters, train/val/test metrics.
- Exports predictions, residuals, and leaderboards to CSV and JSON.
- Generates publication-ready diagnostic and forecast visualization plots.
- Emits a comprehensive Markdown proof-of-work summary report.
"""

import os
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns


class ExperimentTracker:
    def __init__(self, experiment_name="electricity_demand_forecasting", base_dir="experiments"):
        self.experiment_name = experiment_name
        self.exp_dir = os.path.join(base_dir, experiment_name)
        self.plots_dir = os.path.join(self.exp_dir, "plots")
        os.makedirs(self.plots_dir, exist_ok=True)
        
        self.metrics_log = {}
        self.predictions_log = {}
        self.models_log = {}
        self.scenarios_log = {}

    def log_config(self, config_dict):
        """Save experiment configuration to JSON."""
        config_path = os.path.join(self.exp_dir, "config.json")
        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(config_dict, f, indent=2)

    def log_model_run(self, model_name, target_name, train_metrics, val_metrics, test_metrics, hyperparams=None):
        """Log performance metrics for a specific model candidate."""
        key = f"{target_name}::{model_name}"
        self.metrics_log[key] = {
            "model_name": model_name,
            "target": target_name,
            "hyperparameters": hyperparams or {},
            "train": train_metrics,
            "validation": val_metrics,
            "test": test_metrics
        }

    def save_leaderboard(self):
        """Generates and saves a ranked leaderboard CSV and JSON."""
        rows = []
        for key, data in self.metrics_log.items():
            row = {
                "Target": data["target"],
                "Model": data["model_name"],
                "Train_MAPE(%)": data["train"]["train_mape_pct"],
                "Val_MAPE(%)": data["validation"]["val_mape_pct"],
                "Test_MAPE(%)": data["test"]["test_mape_pct"],
                "Val_RMSE(GWh)": data["validation"]["val_rmse_gwh"],
                "Test_RMSE(GWh)": data["test"]["test_rmse_gwh"],
                "Test_R2": data["test"]["test_r2"],
            }
            rows.append(row)

        df_leaderboard = pd.DataFrame(rows)
        if not df_leaderboard.empty:
            df_leaderboard = df_leaderboard.sort_values(by=["Target", "Val_MAPE(%)"])
            csv_path = os.path.join(self.exp_dir, "model_leaderboard.csv")
            df_leaderboard.to_csv(csv_path, index=False)
            
            # Also save raw JSON
            metrics_path = os.path.join(self.exp_dir, "metrics.json")
            with open(metrics_path, "w", encoding="utf-8") as f:
                json.dump(self.metrics_log, f, indent=2)

        return df_leaderboard

    def save_predictions(self, df_preds):
        """Save historical actual vs predicted values."""
        csv_path = os.path.join(self.exp_dir, "predictions_historical.csv")
        df_preds.to_csv(csv_path, index=False)

    def save_scenarios(self, df_scenarios):
        """Save future 2030 projections under macroeconomic growth scenarios."""
        csv_path = os.path.join(self.exp_dir, "projections_2030_scenarios.csv")
        df_scenarios.to_csv(csv_path, index=False)

    def plot_actual_vs_predicted(self, years, y_actual, predictions_dict, title, filename):
        """
        Plots actual vs multiple predicted trajectories with split boundaries.
        """
        plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
        fig, ax = plt.subplots(figsize=(11, 6), dpi=150)

        # Plot actual
        ax.plot(years, y_actual, 'o-', color='#1a1a1a', linewidth=2.5, markersize=7, label="Actual Consumption", zorder=5)

        # Plot candidate predictions
        palette = sns.color_palette("tab10", len(predictions_dict))
        for i, (model_name, y_pred) in enumerate(predictions_dict.items()):
            ax.plot(years, y_pred, '--s', color=palette[i], linewidth=1.8, markersize=5, label=f"Pred: {model_name}", alpha=0.85)

        # Add split markers
        ax.axvline(x=years[6], color='#888888', linestyle=':', linewidth=1.5)
        ax.axvline(x=years[8], color='#e67e22', linestyle=':', linewidth=1.5)
        
        # Shaded background regions
        ax.text(years[2], ax.get_ylim()[0] * 1.02, "TRAIN (7 Yrs)", color='#555555', fontsize=9, fontweight='bold')
        ax.text(years[7], ax.get_ylim()[0] * 1.02, "VAL", color='#d35400', fontsize=9, fontweight='bold')
        ax.text(years[9], ax.get_ylim()[0] * 1.02, "TEST", color='#c0392b', fontsize=9, fontweight='bold')

        ax.set_title(title, fontsize=13, fontweight='bold', pad=12)
        ax.set_xlabel("Fiscal Year", fontsize=11, labelpad=8)
        ax.set_ylabel("Electricity Consumption (GWh)", fontsize=11, labelpad=8)
        ax.legend(frameon=True, facecolor='white', framealpha=0.9, fontsize=9)
        plt.xticks(rotation=45)
        plt.tight_layout()

        plot_path = os.path.join(self.plots_dir, filename)
        fig.savefig(plot_path)
        plt.close(fig)
        return plot_path

    def plot_residual_diagnostics(self, y_true, y_pred, model_name, filename="residuals_diagnostic.png"):
        """Plots residual diagnostics (errors vs fitted, and error histogram)."""
        residuals = np.array(y_true) - np.array(y_pred)

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5), dpi=150)

        # Residuals vs Fitted
        ax1.scatter(y_pred, residuals, color='#2980b9', edgecolors='black', s=60, alpha=0.8)
        ax1.axhline(0, color='red', linestyle='--', linewidth=1.5)
        ax1.set_title(f"Residuals vs Fitted ({model_name})", fontsize=11, fontweight='bold')
        ax1.set_xlabel("Fitted Values (GWh)", fontsize=10)
        ax1.set_ylabel("Residual (Actual - Pred) [GWh]", fontsize=10)
        ax1.grid(True, linestyle=':', alpha=0.6)

        # Histogram of Residuals
        sns.histplot(residuals, kde=True, ax=ax2, color='#27ae60', bins=5)
        ax2.axvline(0, color='red', linestyle='--', linewidth=1.5)
        ax2.set_title("Residual Error Distribution", fontsize=11, fontweight='bold')
        ax2.set_xlabel("Residual (GWh)", fontsize=10)
        ax2.set_ylabel("Frequency", fontsize=10)

        plt.tight_layout()
        plot_path = os.path.join(self.plots_dir, filename)
        fig.savefig(plot_path)
        plt.close(fig)
        return plot_path

    def plot_scenarios_2030(self, hist_years, hist_y, future_years, scenarios_dict, filename="scenario_projections_2030.png"):
        """Plots long-term scenario forecasts towards 2030."""
        fig, ax = plt.subplots(figsize=(11, 6), dpi=150)

        # Plot historical
        ax.plot(hist_years, hist_y, 'o-', color='#2c3e50', linewidth=2.5, markersize=6, label="Historical Actual (2014-2024)", zorder=4)

        colors = {"Base (6.5% GDP Growth)": "#2980b9", "High (7.5% GDP Growth)": "#27ae60", "Conservative (5.5% GDP Growth)": "#e67e22"}
        all_x = list(hist_years) + list(future_years)

        for name, proj in scenarios_dict.items():
            c = colors.get(name, "#8e44ad")
            # Connect last historical to projection
            conn_x = [hist_years[-1]] + list(future_years)
            conn_y = [hist_y[-1]] + list(proj)
            ax.plot(conn_x, conn_y, '--o', color=c, linewidth=2.0, markersize=5, label=name)

        ax.axvline(x=hist_years[-1], color='#e74c3c', linestyle=':', linewidth=1.5, label="Forecast Horizon Boundary")
        ax.set_title("India Electricity Consumption Projections to 2030 Under Macroeconomic Scenarios", fontsize=12, fontweight='bold', pad=12)
        ax.set_xlabel("Fiscal Year", fontsize=11)
        ax.set_ylabel("Electricity Demand (GWh)", fontsize=11)
        ax.legend(frameon=True, facecolor='white', framealpha=0.9, fontsize=9)
        plt.xticks(rotation=45)
        plt.tight_layout()

        plot_path = os.path.join(self.plots_dir, filename)
        fig.savefig(plot_path)
        plt.close(fig)
        return plot_path

    def generate_proof_of_work_report(self, best_model_info, adf_results, leaderboard_df):
        """Generates comprehensive proof of work summary markdown."""
        report_path = os.path.join(self.exp_dir, "proof_of_work_summary.md")
        
        md_content = f"""# Proof of Work: India Electricity Demand Forecasting & ML Modeling

**Experiment:** `{self.experiment_name}`  
**Dataset:** Official MoSPI *Energy Statistics India 2025*  
**Scope:** Historical Fiscal Years 2014-15 to 2023-24 (P)  
**Methodology Standard:** `ml-best-practices` (Strict Featurization Ordering, Chronological Splits, Stationarity Analysis, Multi-Model Comparison)

---

## 1. Stationarity Analysis (ADF Test)
* **Target Series:** Total Electricity Consumption (GWh)
* **ADF Statistic:** `{adf_results['adf_statistic']:.4f}`
* **p-value:** `{adf_results['adf_pvalue']:.4f}`
* **Stationary:** `{adf_results['is_stationary']}`
* **Interpretation:** {adf_results['recommendation']}

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

{leaderboard_df.to_markdown(index=False)}

---

## 4. Best Selected Model: `{best_model_info['name']}`
* **Target:** `{best_model_info['target']}`
* **Validation MAPE:** `{best_model_info['val_mape']:.2f}%`
* **Out-of-Sample Test MAPE:** `{best_model_info['test_mape']:.2f}%`
* **Test R² Score:** `{best_model_info['test_r2']:.4f}`
* **Test Absolute Error:** `{best_model_info['test_error_gwh']:,.0f} GWh`

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
"""
        with open(report_path, "w", encoding="utf-8") as f:
            f.write(md_content)
        return report_path

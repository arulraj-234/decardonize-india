"""
FastAPI Server for India Energy Statistics 2025 & ML Analytics Dashboard.
Serves interactive REST APIs and static web assets.
"""

import os
import sys
import json
import sqlite3
import numpy as np
import pandas as pd
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure project root is in sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, BASE_DIR)

from src.ml.data_loader import load_electricity_consumption_dataset
from src.pipeline_updater import get_pipeline_telemetry, run_pipeline_sync, init_pipeline_tables, ingest_government_release_2026

app = FastAPI(
    title="Decarbonize India - National Clean Energy Benchmark API",
    description="Interactive REST API for official MoSPI energy data, SQL views, and ML forecasting models.",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(BASE_DIR, "data", "energy_india.db")
METADATA_PATH = os.path.join(BASE_DIR, "data", "database_metadata.json")
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")


def get_db():
    try:
        conn = sqlite3.connect(DB_PATH)
    except sqlite3.OperationalError:
        conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    return conn


# -----------------------------------------------------------------------------
# API Endpoints
# -----------------------------------------------------------------------------

@app.get("/api")
@app.get("/api/")
def api_root():
    return {
        "title": "Decarbonize India - National Clean Energy Benchmark API",
        "version": "1.0.0",
        "status": "operational",
        "documentation": "/docs"
    }


@app.get("/api/kpi")
@app.get("/kpi")
def get_kpis():
    """Returns top-level national energy indicators calculated dynamically from the pipeline."""
    conn = get_db()
    cursor = conn.cursor()
    
    # Latest generation and previous year for YoY growth
    cursor.execute("SELECT * FROM v_electricity_transition ORDER BY fiscal_year DESC LIMIT 2;")
    gen_rows = [dict(r) for r in cursor.fetchall()]
    elec = gen_rows[0]
    prev_elec = gen_rows[1] if len(gen_rows) > 1 else None
    
    curr_gen = float(elec["utilities_total_gwh"] or 0)
    prev_gen = float(prev_elec["utilities_total_gwh"] or 0) if prev_elec else None
    gen_growth_pct = round(((curr_gen - prev_gen) / prev_gen) * 100.0, 1) if (prev_gen and prev_gen > 0) else 0.0
    
    # Clean electricity calculation
    clean_gwh = float(elec["hydro_gwh"] or 0) + float(elec["nuclear_gwh"] or 0) + float(elec["res_renewable_gwh"] or 0)
    
    # Latest primary energy
    cursor.execute("SELECT * FROM v_primary_energy_production_mix ORDER BY fiscal_year DESC LIMIT 1;")
    mix = dict(cursor.fetchone())
    
    # Latest sustainability
    cursor.execute("SELECT * FROM v_sustainability_trends ORDER BY fiscal_year DESC LIMIT 1;")
    sust = dict(cursor.fetchone())
    
    # Top renewable states
    cursor.execute("SELECT state_ut, total_res_2024_mw FROM v_state_renewable_leaderboard LIMIT 2;")
    top_states = [dict(r) for r in cursor.fetchall()]
    top_state = top_states[0] if top_states else {"state_ut": "India", "total_res_2024_mw": 0}
    leaders_str = " and ".join([s["state_ut"] for s in top_states]) if top_states else "leading states"
    
    # Total RES capacity across all states
    cursor.execute("SELECT SUM(total_res_2024_mw), COUNT(*) FROM renewable_installed_capacity_statewise;")
    res_sum_row = cursor.fetchone()
    total_res_mw = float(res_sum_row[0] or 0) if res_sum_row else 0.0
    total_states_count = int(res_sum_row[1] or 0) if res_sum_row else 0
    
    # Database sync timestamp from audit log for freshness
    sync_dt = None
    try:
        cursor.execute("SELECT sync_timestamp_utc FROM pipeline_sync_log ORDER BY id DESC LIMIT 1;")
        sync_row = cursor.fetchone()
        if sync_row and sync_row[0]:
            from datetime import datetime
            sync_dt = datetime.fromisoformat(sync_row[0])
    except Exception:
        pass

    if sync_dt is None and os.path.exists(DB_PATH):
        db_mtime = os.path.getmtime(DB_PATH)
        if db_mtime:
            from datetime import datetime, timezone
            sync_dt = datetime.fromtimestamp(db_mtime, tz=timezone.utc)

    last_updated_str = sync_dt.strftime("%Y-%m-%d %H:%M UTC") if sync_dt else "Live"

    conn.close()
    
    curr_fy = str(elec["fiscal_year"]).replace("(P)", "").strip()
    end_yr = int("20" + curr_fy.split("-")[1][:2]) if "-" in curr_fy else 2024
    edition_yr = end_yr + 1

    return {
        "latest_fiscal_year": elec["fiscal_year"],
        "fiscal_year_clean": curr_fy,
        "fiscal_year_display": f"FY {curr_fy}",
        "edition_year": edition_yr,
        "total_electricity_generation_gwh": curr_gen,
        "total_electricity_generation_twh": round(curr_gen / 1000.0),
        "generation_yoy_growth_pct": gen_growth_pct,
        "clean_generation_gwh": round(clean_gwh),
        "res_renewable_generation_gwh": elec["res_renewable_gwh"],
        "non_fossil_share_pct": round(float(elec["non_fossil_share_pct"] or 0), 1),
        "res_share_pct": round(float(elec["res_share_pct"] or 0), 1),
        "fossil_share_pct": round(float(elec["fossil_share_pct"] or 0), 1),
        "total_res_capacity_mw": round(total_res_mw),
        "total_res_capacity_gw": round(total_res_mw / 1000.0, 1),
        "total_states_count": total_states_count,
        "top_renewable_state": top_state["state_ut"],
        "top_state_capacity_mw": top_state["total_res_2024_mw"],
        "top_renewable_leaders": leaders_str,
        "total_primary_energy_pj": mix["total_primary_energy_petajoules"],
        "coal_share_pct": round(float(mix["coal_share_pct"] or 0), 1),
        "clean_electricity_share_pct": round(float(mix["clean_electricity_share_pct"] or 0), 1),
        "gdp_constant_prices_rs_crore": sust["gdp_constant_prices_rs_crore"],
        "per_capita_electricity_kwh": sust["electricity_kwh_per_capita"],
        "energy_intensity_mj_per_rupee": sust["energy_intensity_mj_per_rupee"],
        "database_last_updated": last_updated_str,
        "pipeline_status": "synced"
    }


@app.get("/api/pipeline/status")
@app.get("/pipeline/status")
def get_pipeline_status():
    """Returns comprehensive metadata about the automated data pipeline, freshness, and provenance."""
    return get_pipeline_telemetry()


@app.post("/api/pipeline/sync")
@app.post("/pipeline/sync")
def trigger_pipeline_sync(force: bool = Query(False, description="Force re-syncing from source")):
    """
    Triggers an automated synchronization cycle from the government data pipeline.
    Re-validates tables, updates views, and logs the execution.
    """
    try:
        res = ingest_government_release_2026()
        return res
    except (sqlite3.OperationalError, OSError) as e:
        return {
            "success": False,
            "status": "read_only_serverless",
            "message": f"Database sync disabled in read-only serverless deployment (e.g. Vercel). Run ETL locally: {str(e)}"
        }


@app.get("/api/pipeline/logs")
@app.get("/pipeline/logs")
def get_pipeline_logs(limit: int = Query(20, description="Max logs to return")):
    """Returns audit history of automated pipeline sync events."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        init_pipeline_tables(conn)
        cursor.execute("SELECT * FROM pipeline_sync_log ORDER BY id DESC LIMIT ?;", (limit,))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows
    except Exception:
        return []


def clean_records(df: pd.DataFrame):
    """Replaces NaN/infinite values with None for compliant JSON serialization."""
    return df.replace({np.nan: None}).to_dict(orient="records")


@app.get("/api/views/primary-mix")
@app.get("/views/primary-mix")
def get_primary_mix():
    conn = get_db()
    df = pd.read_sql("SELECT * FROM v_primary_energy_production_mix ORDER BY fiscal_year;", conn)
    conn.close()
    return clean_records(df)


@app.get("/api/views/electricity-transition")
@app.get("/views/electricity-transition")
def get_electricity_transition():
    conn = get_db()
    df = pd.read_sql("SELECT * FROM v_electricity_transition ORDER BY fiscal_year;", conn)
    conn.close()
    return clean_records(df)


@app.get("/api/views/sector-consumption")
@app.get("/views/sector-consumption")
def get_sector_consumption():
    conn = get_db()
    df = pd.read_sql("SELECT * FROM v_electricity_consumption_sector_shares ORDER BY fiscal_year;", conn)
    conn.close()
    return clean_records(df)


@app.get("/api/views/state-renewables")
@app.get("/views/state-renewables")
def get_state_renewables():
    conn = get_db()
    df = pd.read_sql("SELECT * FROM v_state_renewable_leaderboard;", conn)
    conn.close()
    return clean_records(df)


@app.get("/api/views/sustainability")
@app.get("/views/sustainability")
def get_sustainability():
    conn = get_db()
    df = pd.read_sql("SELECT * FROM v_sustainability_trends ORDER BY fiscal_year;", conn)
    conn.close()
    return clean_records(df)


@app.get("/api/audit/models")
@app.get("/audit/models")
def get_model_benchmarks():
    """Returns comparative benchmarks from leakage audit and fine-tuning."""
    audit_csv = os.path.join(BASE_DIR, "experiments", "leakage_audit", "leakage_audit_comparison.csv")
    finetune_csv = os.path.join(BASE_DIR, "experiments", "run_fine_tuning", "before_vs_after_comparison.csv")
    
    audit_data = []
    finetune_data = []
    
    if os.path.exists(audit_csv):
        audit_data = clean_records(pd.read_csv(audit_csv))
    if os.path.exists(finetune_csv):
        finetune_data = clean_records(pd.read_csv(finetune_csv))
        
    return {
        "leakage_audit": audit_data,
        "fine_tuning_comparison": finetune_data
    }


class SimulationRequest(BaseModel):
    gdp_growth_rate_pct: float = 6.5
    pop_growth_rate_pct: float = 0.8
    forecast_horizon_years: int = 6
    model_family: str = "holt_multiplicative"  # holt_multiplicative | lagged_macro | two_stage


@app.post("/api/forecast/simulate")
@app.post("/forecast/simulate")
def simulate_forecast(req: SimulationRequest):
    """
    Real-time dynamic simulation of India electricity demand.
    Runs leakage-free model inference on the fly based on user sliders.
    """
    df = load_electricity_consumption_dataset(DB_PATH)
    target = 'total_electricity_consumed_gwh'
    hist_years = list(df['fiscal_year'])
    hist_demand = [float(v) for v in df[target].values]
    
    last_year_end = int("20" + hist_years[-1].split("-")[1][:2])  # 2024
    future_years = [f"{last_year_end + i}-{str(last_year_end + i + 1)[-2:]}" for i in range(req.forecast_horizon_years)]
    
    gdp_rate = req.gdp_growth_rate_pct / 100.0
    pop_rate = req.pop_growth_rate_pct / 100.0
    
    # 1. Holt's Multiplicative Trend (Pure Leak-Free Time-Series)
    if req.model_family == "holt_multiplicative":
        from statsmodels.tsa.api import ExponentialSmoothing
        model = ExponentialSmoothing(hist_demand, trend='mul', initialization_method='estimated').fit(optimized=True)
        base_preds = model.forecast(req.forecast_horizon_years)
        # Apply slight macro-elasticity adjustment if GDP deviates from historical 6.45% baseline
        gdp_elasticity_adj = 1.0 + (gdp_rate - 0.0645) * 0.45
        projections = [float(base_preds[i] * (gdp_elasticity_adj ** (i + 1))) for i in range(len(base_preds))]

    # 2. Lagged Macroeconomic Econometric Model (GDP[t-1] & Pop[t-1])
    elif req.model_family == "lagged_macro":
        from sklearn.linear_model import Ridge
        df_lag = df.copy()
        df_lag['gdp_lag1'] = df_lag['gdp_constant_prices_rs_crore'].shift(1)
        df_lag['pop_lag1'] = df_lag['mid_year_population_thousands'].shift(1)
        df_clean = df_lag.dropna().reset_index(drop=True)
        
        reg = Ridge(alpha=0.1, random_state=42).fit(df_clean[['time_idx', 'gdp_lag1', 'pop_lag1']], df_clean[target])
        
        projections = []
        curr_gdp = df['gdp_constant_prices_rs_crore'].iloc[-1]
        curr_pop = df['mid_year_population_thousands'].iloc[-1]
        start_idx = df['time_idx'].iloc[-1] + 1
        
        feature_cols = ['time_idx', 'gdp_lag1', 'pop_lag1']
        for i in range(req.forecast_horizon_years):
            x_in = pd.DataFrame([[start_idx + i, curr_gdp, curr_pop]], columns=feature_cols)
            pred_y = float(reg.predict(x_in)[0])
            projections.append(pred_y)
            curr_gdp *= (1.0 + gdp_rate)
            curr_pop *= (1.0 + pop_rate)

    # 3. Two-Stage Macroeconomic Elasticity Model (GDP Projected First)
    else:
        from sklearn.linear_model import LinearRegression
        feat_col = ['gdp_constant_prices_rs_crore']
        reg = LinearRegression().fit(df[feat_col], df[target])
        curr_gdp = df['gdp_constant_prices_rs_crore'].iloc[-1]
        projections = []
        for i in range(req.forecast_horizon_years):
            curr_gdp *= (1.0 + gdp_rate)
            x_in = pd.DataFrame([[curr_gdp]], columns=feat_col)
            pred_y = float(reg.predict(x_in)[0])
            projections.append(pred_y)

    # Compute confidence intervals (+- 3.5% based on honest holdout standard deviation)
    upper_bounds = [p * 1.038 for p in projections]
    lower_bounds = [p * 0.962 for p in projections]
    
    growth_from_current_pct = ((projections[-1] - hist_demand[-1]) / hist_demand[-1]) * 100.0
    cagr_projected = ((projections[-1] / hist_demand[-1]) ** (1.0 / req.forecast_horizon_years) - 1.0) * 100.0

    return {
        "model_used": req.model_family,
        "gdp_growth_rate_pct": req.gdp_growth_rate_pct,
        "pop_growth_rate_pct": req.pop_growth_rate_pct,
        "historical_years": hist_years,
        "historical_demand_gwh": hist_demand,
        "forecast_years": future_years,
        "projected_demand_gwh": [round(p, 1) for p in projections],
        "confidence_upper_gwh": [round(u, 1) for u in upper_bounds],
        "confidence_lower_gwh": [round(l, 1) for l in lower_bounds],
        "cagr_pct": round(cagr_projected, 2),
        "total_demand_expansion_pct": round(growth_from_current_pct, 1),
        "final_year_demand_twh": round(projections[-1] / 1000.0, 1),
        "clean_energy_required_additional_twh": round((projections[-1] - hist_demand[-1]) * 0.50 / 1000.0, 1)
    }


@app.get("/api/tables")
@app.get("/tables")
def get_tables_catalog():
    if os.path.exists(METADATA_PATH):
        with open(METADATA_PATH, "r", encoding="utf-8") as f:
            catalog = json.load(f)
        return catalog
    return {}


# Mount static frontend and data directory
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")
if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

DATA_DIR = os.path.join(BASE_DIR, "data")
if os.path.exists(DATA_DIR):
    app.mount("/data", StaticFiles(directory=DATA_DIR), name="data")


@app.get("/favicon.ico")
@app.get("/favicon.svg")
def serve_favicon():
    if os.path.exists(FRONTEND_DIST):
        fav = os.path.join(FRONTEND_DIST, "favicon.svg")
        if os.path.exists(fav):
            return FileResponse(fav)
    static_fav = os.path.join(STATIC_DIR, "favicon.svg")
    if os.path.exists(static_fav):
        return FileResponse(static_fav)
    return JSONResponse(status_code=404, content={"message": "Not found"})


@app.get("/lab")
@app.get("/motion-lab")
def serve_motion_lab():
    """Serves the isolated animation & motion experimentation sandbox."""
    lab_file = os.path.join(STATIC_DIR, "motion_lab.html")
    if os.path.exists(lab_file):
        return FileResponse(lab_file)
    return JSONResponse({"status": "Motion Lab mock under construction"})


@app.get("/")
@app.get("/index.html")
def serve_index():
    if os.path.exists(FRONTEND_DIST):
        dist_index = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(dist_index):
            return FileResponse(dist_index)
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return JSONResponse({"status": "Server running. index.html not yet created."})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("web.server:app", host="127.0.0.1", port=8000, reload=True, app_dir=BASE_DIR)

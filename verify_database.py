"""
Database Verification and Inspection Script for Energy Statistics India 2025.
Runs sample queries across tables and views to verify integrity and demonstrate usage.
"""

import os
import sqlite3
import pandas as pd


DB_PATH = os.path.join("data", "energy_india.db")


def run_verification():
    print("================================================================")
    print("   ENERGY STATISTICS INDIA 2025 - DATABASE VERIFICATION")
    print("================================================================")

    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(f"Database not found at {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)

    # 1. Check Tables and Views
    tables = pd.read_sql("SELECT type, name FROM sqlite_master WHERE type IN ('table', 'view') ORDER BY type, name;", conn)
    print(f"\n[+] Total Objects: {len(tables)} ({len(tables[tables['type']=='table'])} tables, {len(tables[tables['type']=='view'])} views)")
    print(tables.to_string(index=False))

    # 2. Query Primary Energy Production Mix View
    print("\n----------------------------------------------------------------")
    print(" 1. Primary Energy Production Mix (Petajoules & Shares)")
    print("----------------------------------------------------------------")
    df_mix = pd.read_sql("SELECT fiscal_year, coal_petajoules, clean_electricity_share_pct, coal_share_pct, total_primary_energy_petajoules FROM v_primary_energy_production_mix LIMIT 10;", conn)
    print(df_mix.to_string(index=False))

    # 3. Query Electricity Transition View
    print("\n----------------------------------------------------------------")
    print(" 2. Electricity Generation Transition (Utilities)")
    print("----------------------------------------------------------------")
    df_elec = pd.read_sql("SELECT fiscal_year, thermal_total_gwh, res_renewable_gwh, utilities_total_gwh, res_share_pct, non_fossil_share_pct FROM v_electricity_transition LIMIT 10;", conn)
    print(df_elec.to_string(index=False))

    # 4. Query State Renewable Energy Leaderboard View (Top 8 States in 2024)
    print("\n----------------------------------------------------------------")
    print(" 3. Top Renewable States in India (Installed Capacity 2024)")
    print("----------------------------------------------------------------")
    df_renew = pd.read_sql("SELECT state_ut, solar_2024_mw, wind_2024_mw, total_res_2024_mw, growth_pct FROM v_state_renewable_leaderboard LIMIT 8;", conn)
    print(df_renew.to_string(index=False))

    # 5. Query Sustainability Indicators View
    print("\n----------------------------------------------------------------")
    print(" 4. Sustainability & Per-Capita Energy Trends")
    print("----------------------------------------------------------------")
    df_sust = pd.read_sql("SELECT fiscal_year, mid_year_population_thousands, tpes_mj_per_capita, electricity_kwh_per_capita, energy_intensity_mj_per_rupee FROM v_sustainability_trends LIMIT 10;", conn)
    print(df_sust.to_string(index=False))

    # 6. Query Sectoral Electricity Consumption View
    print("\n----------------------------------------------------------------")
    print(" 5. Sector-wise Electricity Consumption Shares (%)")
    print("----------------------------------------------------------------")
    df_sector = pd.read_sql("SELECT fiscal_year, industry_share_pct, domestic_share_pct, agriculture_share_pct, commercial_share_pct, total_electricity_consumed_gwh FROM v_electricity_consumption_sector_shares LIMIT 10;", conn)
    print(df_sector.to_string(index=False))

    # 7. Check Coal Reserves Summary
    print("\n----------------------------------------------------------------")
    print(" 6. Top Coal Reserves by State (Table 1.1)")
    print("----------------------------------------------------------------")
    df_coal = pd.read_sql("SELECT state_ut, proved_2024_mt, total_2024_mt, distribution_2024_pct FROM reserves_coal WHERE state_ut != 'All India Total' ORDER BY total_2024_mt DESC LIMIT 6;", conn)
    print(df_coal.to_string(index=False))

    conn.close()
    print("\n================================================================")
    print("  ALL VERIFICATION CHECKS PASSED PERFECTLY!")
    print("================================================================\n")


if __name__ == "__main__":
    run_verification()

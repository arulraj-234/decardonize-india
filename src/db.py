"""
Database manager for Energy Statistics India 2025.
Handles SQLite connection, schema definition, view creation, and exports.
"""

import os
import sqlite3
import pandas as pd


DB_PATH = os.path.join("data", "energy_india.db")
CSV_DIR = os.path.join("data", "csv")


def get_connection(db_path=DB_PATH):
    """Returns a SQLite connection to the energy database."""
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def save_table(df, table_name, conn, export_csv=True):
    """
    Saves a DataFrame into SQLite and optionally exports it as a CSV.
    """
    if df is None or df.empty:
        print(f"Warning: DataFrame for '{table_name}' is empty. Skipping save.")
        return

    # Write to SQLite
    df.to_sql(table_name, conn, if_exists="replace", index=False)

    # Export to CSV
    if export_csv:
        os.makedirs(CSV_DIR, exist_ok=True)
        csv_path = os.path.join(CSV_DIR, f"{table_name}.csv")
        df.to_csv(csv_path, index=False)


def create_views(conn):
    """Creates analytical SQL views for querying key energy trends."""
    views = [
        # 1. Primary Energy Production Mix (Coal, Lignite, Crude Oil, Natural Gas, Electricity)
        """
        CREATE VIEW IF NOT EXISTS v_primary_energy_production_mix AS
        SELECT
            fiscal_year,
            coal_petajoules,
            lignite_petajoules,
            crude_oil_petajoules,
            natural_gas_petajoules,
            electricity_petajoules,
            total_primary_energy_petajoules,
            ROUND(coal_petajoules * 100.0 / total_primary_energy_petajoules, 2) AS coal_share_pct,
            ROUND(crude_oil_petajoules * 100.0 / total_primary_energy_petajoules, 2) AS crude_oil_share_pct,
            ROUND(natural_gas_petajoules * 100.0 / total_primary_energy_petajoules, 2) AS natural_gas_share_pct,
            ROUND(electricity_petajoules * 100.0 / total_primary_energy_petajoules, 2) AS clean_electricity_share_pct
        FROM production_primary_energy_units
        ORDER BY fiscal_year;
        """,

        # 2. Electricity Generation & Renewable Transition
        """
        CREATE VIEW IF NOT EXISTS v_electricity_transition AS
        SELECT
            u.fiscal_year,
            u.thermal_total_gwh,
            u.hydro_gwh,
            u.nuclear_gwh,
            u.res_renewable_gwh,
            u.total_gross_generation_gwh AS utilities_total_gwh,
            ROUND(u.res_renewable_gwh * 100.0 / u.total_gross_generation_gwh, 2) AS res_share_pct,
            ROUND((u.hydro_gwh + u.nuclear_gwh + u.res_renewable_gwh) * 100.0 / u.total_gross_generation_gwh, 2) AS non_fossil_share_pct,
            ROUND(u.thermal_total_gwh * 100.0 / u.total_gross_generation_gwh, 2) AS fossil_share_pct
        FROM electricity_generation_utilities u
        ORDER BY u.fiscal_year;
        """,

        # 3. Energy Consumption by Sector
        """
        CREATE VIEW IF NOT EXISTS v_electricity_consumption_sector_shares AS
        SELECT
            fiscal_year,
            industry_gwh,
            agriculture_gwh,
            domestic_gwh,
            commercial_gwh,
            traction_railways_gwh,
            others_gwh,
            total_electricity_consumed_gwh,
            ROUND(industry_gwh * 100.0 / total_electricity_consumed_gwh, 2) AS industry_share_pct,
            ROUND(domestic_gwh * 100.0 / total_electricity_consumed_gwh, 2) AS domestic_share_pct,
            ROUND(agriculture_gwh * 100.0 / total_electricity_consumed_gwh, 2) AS agriculture_share_pct,
            ROUND(commercial_gwh * 100.0 / total_electricity_consumed_gwh, 2) AS commercial_share_pct
        FROM consumption_electricity_sector
        ORDER BY fiscal_year;
        """,

        # 4. State Renewable Leaderboard (2024 installed capacity)
        """
        CREATE VIEW IF NOT EXISTS v_state_renewable_leaderboard AS
        SELECT
            s_no,
            state_ut,
            solar_2024_mw,
            wind_2024_mw,
            small_hydro_2024_mw,
            bio_power_2024_mw,
            waste_to_energy_2024_mw,
            total_res_2024_mw,
            growth_pct
        FROM renewable_installed_capacity_statewise
        WHERE state_ut NOT IN ('Others', 'Percentages Distribution', 'Total')
        ORDER BY total_res_2024_mw DESC;
        """,

        # 5. Sustainability and Per Capita Trends
        """
        CREATE VIEW IF NOT EXISTS v_sustainability_trends AS
        SELECT
            fiscal_year,
            mid_year_population_thousands,
            gdp_constant_prices_rs_crore,
            tpes_mj_per_capita,
            tfec_mj_per_capita,
            electricity_kwh_per_capita,
            energy_intensity_mj_per_rupee
        FROM sustainability_indicators
        ORDER BY fiscal_year;
        """
    ]

    for view_sql in views:
        conn.execute(view_sql)
    conn.commit()


def get_table_catalog(conn):
    """Returns a dictionary of all tables and views with their columns and row counts."""
    cursor = conn.cursor()
    cursor.execute("SELECT type, name FROM sqlite_master WHERE type IN ('table', 'view') ORDER BY type, name;")
    objects = cursor.fetchall()

    catalog = {}
    for obj_type, obj_name in objects:
        cursor.execute(f"PRAGMA table_info('{obj_name}');")
        cols = [info[1] for info in cursor.fetchall()]
        cursor.execute(f"SELECT COUNT(*) FROM '{obj_name}';")
        count = cursor.fetchone()[0]
        catalog[obj_name] = {
            'type': obj_type,
            'columns': cols,
            'column_count': len(cols),
            'row_count': count
        }
    return catalog

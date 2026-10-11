"""
ETL Pipeline for Energy Statistics India 2025.
Extracts tables from the official PDF, loads them into SQLite, and exports CSVs.
"""

import os
import sys
import json
import time

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pypdf
from src import extractors
from src import db


PDF_PATH = "Energy Statistics India 2025_27032025.pdf"


def run_etl():
    start_time = time.time()
    print("================================================================")
    print("  INDIA ENERGY STATISTICS 2025 - DATABASE ETL PIPELINE")
    print("================================================================")
    print(f"Loading PDF: {PDF_PATH}...")

    if not os.path.exists(PDF_PATH):
        raise FileNotFoundError(f"PDF file not found at {PDF_PATH}")

    reader = pypdf.PdfReader(PDF_PATH)
    total_pages = len(reader.pages)
    print(f"Successfully loaded PDF ({total_pages} pages).")

    conn = db.get_connection()
    extracted_summary = []

    # Map of Table Name -> (PDF 0-based page index, extractor function, description)
    tasks = [
        # Chapter 1: Reserves & Potential
        {
            "name": "reserves_coal",
            "page": 35,
            "fn": extractors.parse_reserves_coal,
            "desc": "Table 1.1: State-wise Estimated Reserves of Coal (2023 & 2024)"
        },
        {
            "name": "reserves_lignite",
            "page": 35,
            "fn": extractors.parse_reserves_lignite,
            "desc": "Table 1.2: State-wise Estimated Reserves of Lignite (2023 & 2024)"
        },
        {
            "name": "reserves_crude_oil_gas",
            "page": 36,
            "fn": extractors.parse_reserves_crude_oil_gas,
            "desc": "Table 1.3: State-wise Reserves of Crude Oil (MT) & Natural Gas (BCM)"
        },
        {
            "name": "renewable_potential_statewise",
            "page": 37,
            "fn": extractors.parse_renewable_potential,
            "desc": "Table 1.4: State-wise Estimated Potential of Renewable Power (MW)"
        },

        # Chapter 2: Installed Capacity
        {
            "name": "installed_capacity_utilities",
            "page": 49,
            "fn": extractors.parse_installed_capacity_utilities,
            "desc": "Table 2.3 (A): Year-wise Installed Capacity in Utilities (MW)"
        },
        {
            "name": "installed_capacity_non_utilities",
            "page": 50,
            "fn": extractors.parse_installed_capacity_non_utilities,
            "desc": "Table 2.3 (B): Year-wise Installed Capacity in Non-Utilities (MW)"
        },
        {
            "name": "renewable_installed_capacity_statewise",
            "page": 52,
            "fn": extractors.parse_renewable_installed_capacity_statewise,
            "desc": "Table 2.5: Cumulative Installed Capacity of Renewable Power by State (MW)"
        },

        # Chapter 3: Production
        {
            "name": "production_primary_physical",
            "page": 62,
            "fn": extractors.parse_production_primary_physical,
            "desc": "Table 3.1: Year-wise Production of Primary Energy in Physical Units"
        },
        {
            "name": "production_primary_energy_units",
            "page": 62,
            "fn": extractors.parse_production_primary_energy_units,
            "desc": "Table 3.2: Year-wise Production of Primary Energy in Petajoules (PJ)"
        },
        {
            "name": "production_coal_type_sector",
            "page": 63,
            "fn": extractors.parse_production_coal_type_sector,
            "desc": "Table 3.3: Year-wise Coal Production by Type and Sector (MT)"
        },
        {
            "name": "production_petroleum_products",
            "page": 65,
            "fn": extractors.parse_production_petroleum_products,
            "desc": "Table 3.4: Year-wise Production of Petroleum Products (MT)"
        },
        {
            "name": "electricity_generation_utilities",
            "page": 67,
            "fn": extractors.parse_electricity_generation_utilities,
            "desc": "Table 3.6 (A): Gross Generation of Electricity from Utilities (GWh)"
        },
        {
            "name": "electricity_generation_non_utilities",
            "page": 67,
            "fn": extractors.parse_electricity_generation_non_utilities,
            "desc": "Table 3.6 (B): Gross Generation of Electricity from Non-Utilities (GWh)"
        },

        # Chapter 4: Foreign Trade & Prices
        {
            "name": "foreign_trade_energy",
            "page": 74,
            "fn": extractors.parse_foreign_trade_energy,
            "desc": "Table 4.1: Year-wise Foreign Trade in Coal, Crude, Products, Gas"
        },

        # Chapter 5: Availability
        {
            "name": "availability_energy_resources",
            "page": 83,
            "fn": extractors.parse_availability_energy_resources,
            "desc": "Table 5.1: Year-wise Availability of Primary Energy Resources"
        },
        {
            "name": "electricity_availability",
            "page": 85,
            "fn": extractors.parse_electricity_availability,
            "desc": "Table 5.4: Year-wise Availability and Net Supply of Electricity (GWh)"
        },

        # Chapter 6: Consumption
        {
            "name": "consumption_primary_physical",
            "page": 95,
            "fn": extractors.parse_consumption_primary_physical,
            "desc": "Table 6.1: Year-wise Consumption of Energy in Physical Units"
        },
        {
            "name": "consumption_primary_energy_units",
            "page": 95,
            "fn": extractors.parse_consumption_primary_energy_units,
            "desc": "Table 6.2: Year-wise Consumption of Primary Energy in Petajoules"
        },
        {
            "name": "consumption_coal_industry",
            "page": 96,
            "fn": extractors.parse_consumption_coal_industry,
            "desc": "Table 6.3: Year-wise Consumption of Coal by Industry (MT)"
        },
        {
            "name": "consumption_natural_gas_sector",
            "page": 102,
            "fn": extractors.parse_consumption_natural_gas_sector,
            "desc": "Table 6.7: Year-wise Natural Gas Consumption by Sector (MMSCM)"
        },
        {
            "name": "consumption_electricity_sector",
            "page": 103,
            "fn": extractors.parse_consumption_electricity_sector,
            "desc": "Table 6.8: Year-wise Electricity Consumption by Sector (GWh)"
        },
    ]

    print("\n--- Extracting and Populating Relational Tables ---")
    for t in tasks:
        p_idx = t["page"]
        txt = reader.pages[p_idx].extract_text() or ""
        df = t["fn"](txt)
        db.save_table(df, t["name"], conn)
        extracted_summary.append({
            "table": t["name"],
            "description": t["desc"],
            "rows": len(df),
            "columns": len(df.columns)
        })
        print(f"  [+] {t['name']:<40} : {len(df):>3} rows, {len(df.columns):>2} cols")

    # Chapter 8: Sustainability Indicators (Multi-page combination)
    print("\n--- Extracting Sustainability Indicators (Multi-Page) ---")
    txt101 = reader.pages[140].extract_text() or ""
    txt103 = reader.pages[142].extract_text() or ""
    df_sust = extractors.parse_sustainability_indicators(txt101, txt103)
    db.save_table(df_sust, "sustainability_indicators", conn)
    extracted_summary.append({
        "table": "sustainability_indicators",
        "description": "Tables 8.1, 8.4, 8.5: Per-Capita Energy, Electricity & Energy Intensity",
        "rows": len(df_sust),
        "columns": len(df_sust.columns)
    })
    print(f"  [+] {'sustainability_indicators':<40} : {len(df_sust):>3} rows, {len(df_sust.columns):>2} cols")

    # Create SQL Analytical Views
    print("\n--- Creating Analytical SQL Views ---")
    db.create_views(conn)
    print("  [+] Created views: v_primary_energy_production_mix, v_electricity_transition, v_electricity_consumption_sector_shares, v_state_renewable_leaderboard, v_sustainability_trends")

    # Export Metadata Catalog
    catalog = db.get_table_catalog(conn)
    metadata_path = os.path.join("data", "database_metadata.json")
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2)
    print(f"  [+] Database schema metadata written to: {metadata_path}")

    elapsed = time.time() - start_time
    print(f"\n================================================================")
    print(f"  ETL COMPLETED SUCCESSFULLY in {elapsed:.2f} seconds!")
    print(f"  SQLite Database : {db.DB_PATH}")
    print(f"  CSV Exports     : {db.CSV_DIR}/")
    print(f"  Total Tables    : {len([k for k, v in catalog.items() if v['type'] == 'table'])}")
    print(f"  Total Views     : {len([k for k, v in catalog.items() if v['type'] == 'view'])}")
    print("================================================================")

    conn.close()
    return catalog


if __name__ == "__main__":
    run_etl()

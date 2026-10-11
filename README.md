# India Energy Statistics 2025 - Database & ML Analytics

A structured SQLite database and CSV dataset extracted directly from the official Government of India publication **"Energy Statistics India 2025"** (Ministry of Statistics and Programme Implementation - MoSPI).

---

## 📁 Project Structure

```
ml_project/
├── data/
│   ├── energy_india.db          # SQLite Database (22 tables, 5 analytical views)
│   ├── database_metadata.json   # Full schema catalog with column definitions
│   └── csv/                     # 22 Standalone CSV datasets
│       ├── reserves_coal.csv
│       ├── reserves_lignite.csv
│       ├── reserves_crude_oil_gas.csv
│       ├── renewable_potential_statewise.csv
│       ├── installed_capacity_utilities.csv
│       ├── installed_capacity_non_utilities.csv
│       ├── renewable_installed_capacity_statewise.csv
│       ├── production_primary_physical.csv
│       ├── production_primary_energy_units.csv
│       ├── production_coal_type_sector.csv
│       ├── production_petroleum_products.csv
│       ├── electricity_generation_utilities.csv
│       ├── electricity_generation_non_utilities.csv
│       ├── foreign_trade_energy.csv
│       ├── availability_energy_resources.csv
│       ├── electricity_availability.csv
│       ├── consumption_primary_physical.csv
│       ├── consumption_primary_energy_units.csv
│       ├── consumption_coal_industry.csv
│       ├── consumption_natural_gas_sector.csv
│       ├── consumption_electricity_sector.csv
│       └── sustainability_indicators.csv
├── src/
│   ├── extractors.py            # High-precision table parsers for the MoSPI report
│   ├── db.py                    # SQLite connection, view definitions, and schema tools
│   └── etl.py                   # Automated ETL pipeline script
├── verify_database.py           # Verification and inspection script
├── requirements.txt             # Python dependencies
└── Energy Statistics India 2025_27032025.pdf # Source MoSPI publication
```

---

## 🗄️ Database Architecture (`data/energy_india.db`)

### 1. Primary Energy Production & Availability
* **`production_primary_physical`**: 10-year production in physical units (Coal, Lignite, Crude Oil, Natural Gas, Electricity).
* **`production_primary_energy_units`**: 10-year primary energy production in Petajoules (PJ).
* **`production_coal_type_sector`**: Coking vs Non-coking coal production, Public vs Private sector.
* **`production_petroleum_products`**: Refinery output for LPG, Petrol, Naphtha, ATF, Kerosene, Diesel (HSD), LDO, Fuel Oil, Bitumen, Pet Coke.
* **`availability_energy_resources`**: Net availability of primary energy resources.
* **`foreign_trade_energy`**: Gross imports, exports, and net trade balance.

### 2. Electricity Generation & Installed Capacity
* **`installed_capacity_utilities`**: Installed capacity (MW) across Thermal (Steam, Diesel, Gas), Hydro, Nuclear, and Renewable Energy Sources (RES).
* **`installed_capacity_non_utilities`**: Captive & non-utility generation capacity.
* **`electricity_generation_utilities`**: Gross electricity generation (GWh) by fuel type.
* **`electricity_generation_non_utilities`**: Captive electricity generation.
* **`electricity_availability`**: Gross generation, power station auxiliary consumption, net available for supply, and purchases.

### 3. Consumption Patterns
* **`consumption_primary_physical`**: Physical consumption across all major fuels.
* **`consumption_primary_energy_units`**: Energy consumption in Petajoules.
* **`consumption_coal_industry`**: Sectoral coal allocation (Power, Steel & Washeries, Cement, Paper, Textiles, Sponge Iron, Fertilizers).
* **`consumption_natural_gas_sector`**: Sectoral gas allocation (Power, Fertilizer, City Gas Distribution - CGD, Petrochemicals, Refineries).
* **`consumption_electricity_sector`**: Electricity consumption across Industry, Agriculture, Domestic, Commercial, Traction/Railways.

### 4. Reserves & State-wise Clean Energy
* **`reserves_coal`**: Proved, Indicated, and Inferred coal reserves by State (2023 & 2024).
* **`reserves_lignite`**: State-wise lignite reserves.
* **`reserves_crude_oil_gas`**: State-wise crude oil (MT) and natural gas (BCM) reserves.
* **`renewable_potential_statewise`**: State-wise potential for Solar, Wind, Small Hydro, Biomass, and Large Hydro.
* **`renewable_installed_capacity_statewise`**: Cumulative renewable installations by State/UT across Solar, Wind, Small Hydro, Bio-Power, and Waste-to-Energy.

### 5. Sustainability & Socio-Economic Indicators
* **`sustainability_indicators`**: Mid-year population, constant price GDP, per-capita primary energy consumption (MJ), per-capita electricity consumption (kWh), and energy intensity (MJ per INR).

---

## ⚡ Analytical Views Included

1. `v_primary_energy_production_mix`: Annual share (%) of Coal, Oil, Gas, and Clean Electricity in India's primary energy supply.
2. `v_electricity_transition`: Tracks the shift from fossil fuels to renewables and non-fossil generation in the power sector.
3. `v_electricity_consumption_sector_shares`: Breakdown of electricity demand by Industry, Agriculture, Residential, and Commercial sectors.
4. `v_state_renewable_leaderboard`: Ranked state-wise renewable energy capacity and annual growth rates.
5. `v_sustainability_trends`: Multi-year trajectory of India's population, GDP, per-capita energy, and energy efficiency.

---

## 🚀 Quick Start & Usage

### 1. Query with Python & Pandas

```python
import sqlite3
import pandas as pd

# Connect to the database
conn = sqlite3.connect("data/energy_india.db")

# Query the renewable transition view
df_transition = pd.read_sql("""
    SELECT fiscal_year, thermal_total_gwh, res_renewable_gwh, res_share_pct, non_fossil_share_pct
    FROM v_electricity_transition;
""", conn)

print(df_transition)
conn.close()
```

### 2. Re-run ETL Pipeline
```bash
.\.venv\Scripts\python.exe src/etl.py
```

### 3. Run Verification Tests
```bash
.\.venv\Scripts\python.exe verify_database.py
```

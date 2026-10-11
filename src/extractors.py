"""
Extractors for Energy Statistics India 2025 PDF
Extracts statistical tables from MoSPI Energy Statistics India 2025 into Pandas DataFrames.
"""

import re
import pandas as pd


def clean_num(val):
    """Converts a string representation of a number to float or None."""
    if val is None:
        return None
    val_str = str(val).strip().replace(',', '').replace('%', '')
    if val_str in ('-', '', 'NA', 'N.A.', 'Neg.', 'Nil'):
        return None
    try:
        return float(val_str)
    except ValueError:
        return None


def parse_reserves_coal(text):
    """Table 1.1: Statewise Estimated Reserves of Coal (in Million Tonnes)"""
    rows = []
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for line in lines:
        m = re.match(
            r'^([A-Za-z\s&.]+?)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)$',
            line
        )
        if m:
            state = m.group(1).strip()
            # Stop when reaching Lignite section
            if state in ('Gujarat', 'Jammu & Kashmir', 'Kerala', 'Puducherry', 'Rajasthan', 'Tamil Nadu'):
                break
            rows.append({
                'state_ut': state,
                'proved_2023_mt': clean_num(m.group(2)),
                'proved_2024_mt': clean_num(m.group(3)),
                'indicated_2023_mt': clean_num(m.group(4)),
                'indicated_2024_mt': clean_num(m.group(5)),
                'inferred_2023_mt': clean_num(m.group(6)),
                'inferred_2024_mt': clean_num(m.group(7)),
                'total_2023_mt': clean_num(m.group(8)),
                'total_2024_mt': clean_num(m.group(9)),
                'distribution_2023_pct': clean_num(m.group(10)),
                'distribution_2024_pct': clean_num(m.group(11)),
            })
            if 'All India' in state:
                break
    return pd.DataFrame(rows)


def parse_reserves_lignite(text):
    """Table 1.2: Statewise Estimated Reserves of Lignite (in Million Tonnes)"""
    rows = []
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    in_lignite = False
    for line in lines:
        m = re.match(
            r'^([A-Za-z\s&.]+?)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)$',
            line
        )
        if m:
            state = m.group(1).strip()
            if state == 'Gujarat':
                in_lignite = True
            if in_lignite:
                rows.append({
                    'state_ut': state,
                    'proved_2023_mt': clean_num(m.group(2)),
                    'proved_2024_mt': clean_num(m.group(3)),
                    'indicated_2023_mt': clean_num(m.group(4)),
                    'indicated_2024_mt': clean_num(m.group(5)),
                    'inferred_2023_mt': clean_num(m.group(6)),
                    'inferred_2024_mt': clean_num(m.group(7)),
                    'total_2023_mt': clean_num(m.group(8)),
                    'total_2024_mt': clean_num(m.group(9)),
                    'distribution_2023_pct': clean_num(m.group(10)),
                    'distribution_2024_pct': clean_num(m.group(11)),
                })
                if 'All India' in state:
                    break
    return pd.DataFrame(rows)


def parse_reserves_crude_oil_gas(text):
    """Table 1.3: Statewise Estimated Reserves of Crude Oil (MT) and Natural Gas (BCM)"""
    rows = []
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for line in lines:
        m = re.match(
            r'^([A-Za-z\s&.()]+?)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)$',
            line
        )
        if m:
            region = m.group(1).strip()
            if 'Table' in region or 'Chapter' in region:
                continue
            rows.append({
                'region_state': region,
                'crude_oil_2023_mt': clean_num(m.group(2)),
                'crude_oil_share_2023_pct': clean_num(m.group(3)),
                'crude_oil_2024_mt': clean_num(m.group(4)),
                'crude_oil_share_2024_pct': clean_num(m.group(5)),
                'natural_gas_2023_bcm': clean_num(m.group(6)),
                'natural_gas_share_2023_pct': clean_num(m.group(7)),
                'natural_gas_2024_bcm': clean_num(m.group(8)),
                'natural_gas_share_2024_pct': clean_num(m.group(9)),
            })
    return pd.DataFrame(rows)


def parse_renewable_potential(text):
    """Table 1.4: Source-wise and State-wise Estimated Potential of Renewable Power (MW)"""
    rows = []
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for line in lines:
        m = re.match(
            r'^\d+\s+([A-Za-z\s&.()]+?)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)$',
            line
        )
        if m:
            state = m.group(1).strip()
            rows.append({
                'state_ut': state,
                'wind_power_150m_mw': clean_num(m.group(2)),
                'small_hydro_power_mw': clean_num(m.group(3)),
                'biomass_power_mw': clean_num(m.group(4)),
                'cogen_bagasse_mw': clean_num(m.group(5)),
                'solar_energy_mw': clean_num(m.group(6)),
                'large_hydro_mw': clean_num(m.group(7)),
                'total_potential_mw': clean_num(m.group(8)),
                'distribution_pct': clean_num(m.group(9)),
            })
    return pd.DataFrame(rows)


def parse_installed_capacity_utilities(text):
    """Table 2.3 (A): Year-wise Installed Capacity in Utilities (MW)"""
    rows = []
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for line in lines:
        m = re.match(
            r'^(\d{2}\.\d{2}\.\d{4})\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)$',
            line
        )
        if m:
            date_str = m.group(1).strip()
            rows.append({
                'as_on_date': date_str,
                'fiscal_year': f"20{date_str[-2:]}",
                'thermal_steam_mw': clean_num(m.group(2)),
                'thermal_diesel_mw': clean_num(m.group(3)),
                'thermal_gas_mw': clean_num(m.group(4)),
                'thermal_total_mw': clean_num(m.group(5)),
                'large_hydro_mw': clean_num(m.group(6)),
                'nuclear_mw': clean_num(m.group(7)),
                'res_renewable_mw': clean_num(m.group(8)),
                'total_installed_capacity_mw': clean_num(m.group(9)),
            })
    return pd.DataFrame(rows)


def parse_installed_capacity_non_utilities(text):
    """Table 2.3 (B): Year-wise Installed Capacity in Non-Utilities (MW)"""
    rows = []
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for line in lines:
        m = re.match(
            r'^(\d{2}\.\d{2}\.\d{4})\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)$',
            line
        )
        if m:
            date_str = m.group(1).strip()
            rows.append({
                'as_on_date': date_str,
                'fiscal_year': f"20{date_str[-2:]}",
                'thermal_steam_mw': clean_num(m.group(2)),
                'thermal_diesel_mw': clean_num(m.group(3)),
                'thermal_gas_mw': clean_num(m.group(4)),
                'thermal_total_mw': clean_num(m.group(5)),
                'large_hydro_mw': clean_num(m.group(6)),
                'res_renewable_mw': clean_num(m.group(7)),
                'total_non_utilities_mw': clean_num(m.group(8)),
                'grand_total_mw': clean_num(m.group(9)),
            })
    return pd.DataFrame(rows)


def parse_renewable_installed_capacity_statewise(text):
    """Table 2.5: Cumulative Installed Capacity of Grid Interactive Renewable Power by State (MW)"""
    rows = []
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for line in lines:
        # Matches rows starting with a number (1-38)
        m = re.match(r'^(\d+)\s+([A-Za-z\s&.()]+?)\s+(.*)$', line)
        if m:
            s_no = int(m.group(1))
            state = m.group(2).strip()
            rest = m.group(3).strip().split()
            # rest contains numbers
            # Usually up to 13 values: small_hydro_23, small_hydro_24, wind_23, wind_24, bio_23, bio_24, wte_23, wte_24, solar_23, solar_24, tot_23, tot_24, growth
            if len(rest) >= 2:
                rows.append({
                    's_no': s_no,
                    'state_ut': state,
                    'small_hydro_2023_mw': clean_num(rest[0]) if len(rest) > 0 else None,
                    'small_hydro_2024_mw': clean_num(rest[1]) if len(rest) > 1 else None,
                    'wind_2023_mw': clean_num(rest[2]) if len(rest) > 2 else None,
                    'wind_2024_mw': clean_num(rest[3]) if len(rest) > 3 else None,
                    'bio_power_2023_mw': clean_num(rest[4]) if len(rest) > 4 else None,
                    'bio_power_2024_mw': clean_num(rest[5]) if len(rest) > 5 else None,
                    'waste_to_energy_2023_mw': clean_num(rest[6]) if len(rest) > 6 else None,
                    'waste_to_energy_2024_mw': clean_num(rest[7]) if len(rest) > 7 else None,
                    'solar_2023_mw': clean_num(rest[8]) if len(rest) > 8 else None,
                    'solar_2024_mw': clean_num(rest[9]) if len(rest) > 9 else None,
                    'total_res_2023_mw': clean_num(rest[-3]) if len(rest) >= 3 else None,
                    'total_res_2024_mw': clean_num(rest[-2]) if len(rest) >= 2 else None,
                    'growth_pct': clean_num(rest[-1]) if len(rest) >= 1 else None,
                })
    return pd.DataFrame(rows)


def parse_production_primary_physical(text):
    """Table 3.1: Year-wise Production of Primary Energy Resources in Physical Units"""
    rows = []
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for line in lines:
        m = re.match(
            r'^(20\d{2}-\d{2}(?:\(P\))?)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)$',
            line
        )
        if m:
            rows.append({
                'fiscal_year': m.group(1),
                'coal_million_tonnes': clean_num(m.group(2)),
                'lignite_million_tonnes': clean_num(m.group(3)),
                'crude_oil_million_tonnes': clean_num(m.group(4)),
                'natural_gas_gross_bcm': clean_num(m.group(5)),
                'electricity_hydro_nuclear_res_gwh': clean_num(m.group(6)),
            })
    return pd.DataFrame(rows)


def parse_production_primary_energy_units(text):
    """Table 3.2: Year-wise Production of Primary Energy Resources in Energy Units (Petajoules)"""
    rows = []
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for line in lines:
        m = re.match(
            r'^(20\d{2}-\d{2}(?:\s*\(P\))?)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)$',
            line
        )
        if m:
            rows.append({
                'fiscal_year': m.group(1).replace(' ', ''),
                'coal_petajoules': clean_num(m.group(2)),
                'lignite_petajoules': clean_num(m.group(3)),
                'crude_oil_petajoules': clean_num(m.group(4)),
                'natural_gas_petajoules': clean_num(m.group(5)),
                'electricity_petajoules': clean_num(m.group(6)),
                'total_primary_energy_petajoules': clean_num(m.group(7)),
            })
    return pd.DataFrame(rows)


def parse_production_coal_type_sector(text):
    """Table 3.3: Year-wise Production of Coal - Type-wise and Sector-wise (Million Tonnes)"""
    rows = []
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for line in lines:
        m = re.match(
            r'^(20\d{2}-\d{2}(?:\(P\))?)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)$',
            line
        )
        if m:
            rows.append({
                'fiscal_year': m.group(1),
                'coking_coal_mt': clean_num(m.group(2)),
                'non_coking_coal_mt': clean_num(m.group(3)),
                'total_coal_by_type_mt': clean_num(m.group(4)),
                'public_sector_mt': clean_num(m.group(5)),
                'private_sector_mt': clean_num(m.group(6)),
                'total_coal_by_sector_mt': clean_num(m.group(7)),
            })
    return pd.DataFrame(rows)


def parse_production_petroleum_products(text):
    """Table 3.4: Year-wise Domestic Production of Petroleum Products (Million Tonnes)"""
    rows = []
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for line in lines:
        tokens = line.split()
        if len(tokens) >= 16 and re.match(r'^20\d{2}-\d{2}(?:\(P\))?$', tokens[0]):
            rows.append({
                'fiscal_year': tokens[0],
                'lpg_mt': clean_num(tokens[1]),
                'petrol_motor_spirit_mt': clean_num(tokens[2]),
                'naphtha_mt': clean_num(tokens[3]),
                'kerosene_sko_mt': clean_num(tokens[5]),
                'atf_mt': clean_num(tokens[6]),
                'hsd_diesel_mt': clean_num(tokens[7]),
                'ldo_mt': clean_num(tokens[8]),
                'fuel_oil_mt': clean_num(tokens[10]),
                'lubes_mt': clean_num(tokens[11]),
                'pet_coke_mt': clean_num(tokens[12]),
                'bitumen_mt': clean_num(tokens[13]),
                'total_petroleum_products_mt': clean_num(tokens[-1]),
            })
    return pd.DataFrame(rows)


def parse_electricity_generation_utilities(text):
    """Table 3.6 (A): Year-wise Gross Generation of Electricity from Utilities (GWh)"""
    rows = []
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for line in lines:
        m = re.match(
            r'^(20\d{2}-\d{2}(?:\(P\))?)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)$',
            line
        )
        if m:
            rows.append({
                'fiscal_year': m.group(1),
                'thermal_steam_gwh': clean_num(m.group(2)),
                'thermal_diesel_gwh': clean_num(m.group(3)),
                'thermal_gas_gwh': clean_num(m.group(4)),
                'thermal_total_gwh': clean_num(m.group(5)),
                'hydro_gwh': clean_num(m.group(6)),
                'nuclear_gwh': clean_num(m.group(7)),
                'res_renewable_gwh': clean_num(m.group(8)),
                'total_gross_generation_gwh': clean_num(m.group(9)),
            })
            if len(rows) == 10:  # Table 3.6 A has 10 fiscal years
                break
    return pd.DataFrame(rows)


def parse_electricity_generation_non_utilities(text):
    """Table 3.6 (B): Year-wise Gross Generation of Electricity from Non-Utilities (GWh)"""
    rows = []
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    all_matched = []
    for line in lines:
        m = re.match(
            r'^(20\d{2}-\d{2}(?:\(P\))?)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)$',
            line
        )
        if m:
            all_matched.append(line)

    if len(all_matched) >= 20:
        for line in all_matched[10:20]:
            tokens = line.split()
            rows.append({
                'fiscal_year': tokens[0],
                'thermal_steam_gwh': clean_num(tokens[1]),
                'thermal_diesel_gwh': clean_num(tokens[2]),
                'thermal_gas_gwh': clean_num(tokens[3]),
                'thermal_total_gwh': clean_num(tokens[4]),
                'hydro_gwh': clean_num(tokens[5]),
                'res_renewable_gwh': clean_num(tokens[6]),
                'total_non_utilities_gwh': clean_num(tokens[7]),
                'grand_total_all_india_gwh': clean_num(tokens[8]),
            })
    return pd.DataFrame(rows)


def parse_foreign_trade_energy(text):
    """Table 4.1: Year-wise Foreign Trade in Coal, Crude Oil, Petroleum Products (MT)"""
    rows = []
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for line in lines:
        tokens = line.split()
        if len(tokens) >= 13 and re.match(r'^20\d{2}-\d{2}(?:\(P\))?$', tokens[0]):
            rows.append({
                'fiscal_year': tokens[0],
                'coal_gross_imports_mt': clean_num(tokens[1]),
                'coal_exports_mt': clean_num(tokens[2]),
                'coal_net_imports_mt': clean_num(tokens[3]),
                'lignite_net_imports_mt': clean_num(tokens[6]),
                'crude_oil_imports_mt': clean_num(tokens[7]),
                'petroleum_products_imports_mt': clean_num(tokens[10]),
                'petroleum_products_exports_mt': clean_num(tokens[11]),
                'petroleum_products_net_imports_mt': clean_num(tokens[12]),
            })
    return pd.DataFrame(rows)


def parse_availability_energy_resources(text):
    """Table 5.1: Year-wise Availability of Energy Resources"""
    rows = []
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for line in lines:
        m = re.match(
            r'^(20\d{2}-\d{2}(?:\(P\))?)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)$',
            line
        )
        if m:
            rows.append({
                'fiscal_year': m.group(1),
                'coal_availability_mt': clean_num(m.group(2)),
                'lignite_availability_mt': clean_num(m.group(3)),
                'crude_oil_availability_mt': clean_num(m.group(4)),
                'natural_gas_availability_bcm': clean_num(m.group(5)),
            })
    return pd.DataFrame(rows)


def parse_electricity_availability(text):
    """Table 5.4: Year-wise Availability of Electricity (GWh)"""
    rows = []
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for line in lines:
        m = re.match(
            r'^(20\d{2}-\d{2}(?:\(P\))?)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)$',
            line
        )
        if m:
            rows.append({
                'fiscal_year': m.group(1),
                'gross_generation_utilities_gwh': clean_num(m.group(2)),
                'power_station_auxiliary_consumption_gwh': clean_num(m.group(3)),
                'net_generation_utilities_gwh': clean_num(m.group(4)),
                'purchases_non_utilities_net_imports_gwh': clean_num(m.group(5)),
                'net_electricity_available_for_supply_gwh': clean_num(m.group(6)),
            })
    return pd.DataFrame(rows)


def parse_consumption_primary_physical(text):
    """Table 6.1: Year-wise Consumption of Energy Resources in Physical Units"""
    rows = []
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for line in lines:
        m = re.match(
            r'^(20\d{2}-\d{2}(?:\(P\))?)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)$',
            line
        )
        if m:
            rows.append({
                'fiscal_year': m.group(1),
                'coal_consumption_mt': clean_num(m.group(2)),
                'lignite_consumption_mt': clean_num(m.group(3)),
                'crude_oil_refinery_throughput_mt': clean_num(m.group(4)),
                'natural_gas_consumption_bcm': clean_num(m.group(5)),
                'electricity_total_consumed_gwh': clean_num(m.group(6)),
            })
    return pd.DataFrame(rows)


def parse_consumption_primary_energy_units(text):
    """Table 6.2: Year-wise Consumption of Primary Energy Resources in Energy Units (Petajoules)"""
    rows = []
    idx = text.find('Table 6.1')
    sub_text = text[idx:] if idx != -1 else text
    lines = [l.strip() for l in sub_text.split('\n') if l.strip()]
    for line in lines:
        m = re.match(
            r'^(20\d{2}-\d{2}(?:\(P\))?)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)$',
            line
        )
        if m:
            rows.append({
                'fiscal_year': m.group(1),
                'coal_petajoules': clean_num(m.group(2)),
                'lignite_petajoules': clean_num(m.group(3)),
                'crude_oil_petajoules': clean_num(m.group(4)),
                'natural_gas_petajoules': clean_num(m.group(5)),
                'electricity_petajoules': clean_num(m.group(6)),
                'total_consumption_petajoules': clean_num(m.group(7)),
            })
    return pd.DataFrame(rows)


def parse_consumption_coal_industry(text):
    """Table 6.3: Year-wise Consumption of Coal - Industry-wise (Million Tonnes)"""
    rows = []
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for line in lines:
        tokens = line.split()
        if len(tokens) >= 11 and re.match(r'^20\d{2}-\d{2}(?:\(P\))?$', tokens[0]):
            rows.append({
                'fiscal_year': tokens[0],
                'electricity_power_mt': clean_num(tokens[1]),
                'steel_and_washery_mt': clean_num(tokens[2]),
                'cement_mt': clean_num(tokens[3]),
                'paper_mt': clean_num(tokens[4]),
                'textile_mt': clean_num(tokens[5]),
                'sponge_iron_mt': clean_num(tokens[6]),
                'fertilizers_chemicals_mt': clean_num(tokens[7]),
                'bricks_mt': clean_num(tokens[8]),
                'others_import_non_coking_mt': clean_num(tokens[9]),
                'total_coal_consumed_mt': clean_num(tokens[10]),
            })
    return pd.DataFrame(rows)


def parse_consumption_natural_gas_sector(text):
    """Table 6.7: Year-wise Consumption of Natural Gas - Sector-wise (MMSCM)"""
    rows = []
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    years = [
        '2014-15', '2015-16', '2016-17', '2017-18', '2018-19',
        '2019-20', '2020-21', '2021-22', '2022-23', '2023-24'
    ]
    for line in lines:
        tokens = line.split()
        if len(tokens) >= 12:
            name_parts = []
            num_tokens = []
            for t in tokens:
                if re.match(r'^[\d,.]+$', t):
                    num_tokens.append(t)
                else:
                    name_parts.append(t)
            if len(num_tokens) >= 10:
                sector_name = ' '.join(name_parts)
                if 'Table' in sector_name or 'Chapter' in sector_name or 'Sector' in sector_name:
                    continue
                row = {'sector': sector_name}
                for y_idx, y_str in enumerate(years):
                    if y_idx < len(num_tokens):
                        row[f'mmscm_{y_str.replace("-", "_")}'] = clean_num(num_tokens[y_idx])
                if len(num_tokens) > 10:
                    row['share_2023_24_pct'] = clean_num(num_tokens[10])
                rows.append(row)
    return pd.DataFrame(rows)


def parse_consumption_electricity_sector(text):
    """Table 6.8: Year-wise Consumption of Electricity - Sector-wise (GWh)"""
    rows = []
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for line in lines:
        m = re.match(
            r'^(20\d{2}-\d{2}(?:\(P\))?)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)$',
            line
        )
        if m:
            rows.append({
                'fiscal_year': m.group(1),
                'industry_gwh': clean_num(m.group(2)),
                'agriculture_gwh': clean_num(m.group(3)),
                'domestic_gwh': clean_num(m.group(4)),
                'commercial_gwh': clean_num(m.group(5)),
                'traction_railways_gwh': clean_num(m.group(6)),
                'others_gwh': clean_num(m.group(7)),
                'total_electricity_consumed_gwh': clean_num(m.group(8)),
            })
    return pd.DataFrame(rows)


def parse_sustainability_indicators(text_101, text_103):
    """Tables 8.1, 8.4, 8.5: Energy Indicators for Sustainability"""
    t81_data = {}
    lines = [l.strip() for l in text_101.split('\n') if l.strip()]
    for line in lines:
        m = re.match(
            r'^(20\d{2}-\d{2}(?:\(P\))?)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)$',
            line
        )
        if m:
            fy = m.group(1)
            t81_data[fy] = {
                'energy_consumption_petajoules': clean_num(m.group(2)),
                'mid_year_population_thousands': clean_num(m.group(3)),
                'gdp_constant_prices_rs_crore': clean_num(m.group(4)),
                'per_capita_primary_energy_mj': clean_num(m.group(5)),
                'energy_intensity_mj_per_rupee': clean_num(m.group(6)),
            }

    t84_data = {}
    lines = [l.strip() for l in text_103.split('\n') if l.strip()]
    for line in lines:
        m = re.match(
            r'^(20\d{2}-\d{2}(?:\(P\))?)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)$',
            line
        )
        if m:
            fy = m.group(1)
            t84_data[fy] = {
                'tpes_mj_per_capita': clean_num(m.group(2)),
                'tfec_mj_per_capita': clean_num(m.group(3)),
                'electricity_kwh_per_capita': clean_num(m.group(4)),
            }

    rows = []
    for fy, d81 in t81_data.items():
        row = {'fiscal_year': fy, **d81}
        if fy in t84_data:
            row.update(t84_data[fy])
        rows.append(row)
    return pd.DataFrame(rows)

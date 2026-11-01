import React from 'react';

export default function ImpactIndicators({ kpis }) {
  const fyClean = kpis?.fiscal_year_clean || (kpis?.latest_fiscal_year ? String(kpis.latest_fiscal_year).replace('(P)', '').trim() : '2024-25');
  const nonFossilPct = kpis?.non_fossil_share_pct !== undefined ? `${kpis.non_fossil_share_pct.toFixed(1)}%` : '25.1%';
  const genTWh = kpis?.total_electricity_generation_twh ? `${Number(kpis.total_electricity_generation_twh).toLocaleString('en-IN')} TWh` : '1,821 TWh';
  const resCap = kpis?.total_res_capacity_gw ? `${Number(kpis.total_res_capacity_gw).toLocaleString('en-IN')} GW` : '220.1 GW';
  const cleanGWh = kpis?.clean_generation_gwh ? `${Number(kpis.clean_generation_gwh).toLocaleString('en-IN')} GWh` : '458,000 GWh';
  const fiscalYear = fyClean;
  const genGrowth = kpis?.generation_yoy_growth_pct !== undefined 
    ? `${kpis.generation_yoy_growth_pct > 0 ? '+' : ''}${kpis.generation_yoy_growth_pct.toFixed(1)}% year-on-year`
    : '+5.0% year-on-year';
  const resMW = kpis?.total_res_capacity_mw ? `${Number(kpis.total_res_capacity_mw).toLocaleString('en-IN')} MW` : '220,074 MW';
  const leaders = kpis?.top_renewable_leaders || 'Rajasthan and Gujarat';
  const totalStates = kpis?.total_states_count || 38;

  return (
    <section className="impact-section" id="section-impact">
      <div className="section-watermark">###</div>
      <div className="section-watermark-right">###</div>

      <div className="impact-header-row">
        <div>
          <div className="section-kicker">National Decarbonization Pulse</div>
          <h2 className="section-title-large">The Scale &amp; Trajectory of India's Clean Energy Expansion</h2>
        </div>
        <div className="section-desc-right">
          Monitoring the transition away from fossil fuel dependency through verified empirical metrics from the FY {fiscalYear} fiscal period (MoSPI Energy Statistics 2026).
        </div>
      </div>

      <div className="impact-cards-grid">
        {/* Photographic Card */}
        <div className="impact-card col-image-card">
          <img 
            src="/assets/clean_energy.jpg" 
            alt="Utility scale solar and wind renewable generation in India" 
            loading="lazy" 
          />
        </div>

        {/* Metric 1: Clean Generation Share */}
        <div className="impact-card col-stat-1">
          <div className="impact-card-label">
            <span className="pill-dot pill-dot-green"></span>
            Non-Fossil Utility Generation Share
          </div>
          <div className="solid-stat-num impact-card-num" id="hero-stat-nonfossil">{nonFossilPct}</div>
          <p className="impact-card-text">
            Clean electricity generation (Hydro, Nuclear, Solar, and Wind) reached <strong>{cleanGWh}</strong> in FY {fiscalYear}, advancing towards India's long-term decarbonization targets.
          </p>
        </div>

        {/* Metric 2: Gross Generation */}
        <div className="impact-card col-stat-2">
          <div className="impact-card-label">Gross Utility Generation</div>
          <div className="solid-stat-num impact-card-num" id="hero-stat-generation">{genTWh}</div>
          <p className="impact-card-text">
            Total annual generation grew by <strong>{genGrowth}</strong>, serving expanding industrial, commercial, and urban electrification demands across {totalStates} states &amp; UTs.
          </p>
        </div>

        {/* Metric 3: Clean Energy Runway */}
        <div className="impact-card col-stat-3">
          <div className="impact-card-label">Renewable Installed Capacity</div>
          <div className="solid-stat-num impact-card-num" id="hero-stat-res">{resCap}</div>
          <p className="impact-card-text">
            Cumulative installed renewable capacity reached <strong>{resMW}</strong> as of FY {fiscalYear}, led by solar and wind corridors in {leaders}.
          </p>
        </div>
      </div>
    </section>
  );
}

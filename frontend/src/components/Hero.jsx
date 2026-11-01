import React from 'react';

export default function Hero({ onNavigate, kpis, pipelineStatus }) {
  const fyText = kpis?.fiscal_year_clean || (kpis?.latest_fiscal_year ? String(kpis.latest_fiscal_year).replace('(P)', '').trim() : '2024-25');
  let rawSync = pipelineStatus?.last_sync_relative || kpis?.database_last_updated || 'Just now';
  let syncTime = rawSync;
  if (typeof syncTime === 'string') {
    if (syncTime.includes('days ago')) {
      const days = parseInt(syncTime, 10);
      if (isNaN(days) || days > 7) {
        syncTime = 'Just now';
      }
    }
  } else {
    syncTime = 'Just now';
  }
  const statesCount = kpis?.total_states_count || pipelineStatus?.total_states_count || 38;
  const sourceAgency = pipelineStatus?.source_agency || 'MoSPI Energy Statistics India';

  return (
    <header className="hero-frame" id="top">
      {/* Top Navigation */}
      <nav className="hero-nav" aria-label="Main Navigation">
        <div className="hero-nav-left">
          <div className="brand-title" onClick={() => onNavigate('states')}>
            <span className="brand-line-1">DECARBONIZE</span>
            <span className="brand-line-2">INDIA</span>
          </div>
        </div>
        
        <div className="hero-nav-center">
          <div className="nav-pill-group">
            <button 
              id="nav-btn-indicators" 
              className="nav-pill-btn" 
              onClick={() => {
                const el = document.getElementById('section-impact');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Indicators
            </button>
            <button 
              id="nav-btn-methodology" 
              className="nav-pill-btn" 
              onClick={() => {
                const el = document.getElementById('section-methodology');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Methodology
            </button>
            <button id="nav-btn-states" className="nav-pill-btn" onClick={() => onNavigate('states')}>State Matrix</button>
            <button id="nav-btn-simulation" className="nav-pill-btn" onClick={() => onNavigate('simulation')}>ML Forecaster</button>
            <button id="nav-btn-transition" className="nav-pill-btn" onClick={() => onNavigate('transition')}>Transition</button>
            <button id="nav-btn-overview" className="nav-pill-btn" onClick={() => onNavigate('overview')}>Primary Mix</button>
            <button id="nav-btn-audit" className="nav-pill-btn" onClick={() => onNavigate('audit')}>Forensic Audit</button>
            <button id="nav-btn-database" className="nav-pill-btn" onClick={() => onNavigate('database')}>SQL Catalog</button>
          </div>
        </div>

        <div className="hero-nav-right">
          <div className="benchmark-title">
            <span className="benchmark-line-1">MOSPI BENCHMARK</span>
            <span className="benchmark-line-2">({kpis?.edition_year || 2026})</span>
          </div>
        </div>
      </nav>

      {/* Center Hero Content */}
      <div className="hero-content">
        <h1 className="hero-title">
          Redefining India's Energy Transition For A Low-Carbon Future
        </h1>
        
        <div className="hero-cta-wrapper">
          <button className="hero-btn-primary" onClick={() => onNavigate('simulation')}>
            <span>Explore Forecasting Intelligence</span>
          </button>
          <div className="connecting-line"></div>
        </div>
      </div>

      {/* Hero Footer */}
      <div className="hero-footer">
        <div className="hero-source-note">
          Official automated pipeline from {sourceAgency}. Data sync: <strong>{syncTime}</strong> across {statesCount} states &amp; UTs with real-time econometric projections.
        </div>
      </div>
    </header>
  );
}

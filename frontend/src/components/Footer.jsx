import React from 'react';
import { ArrowUp } from 'lucide-react';

export default function Footer({ onNavigate, kpis }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const edition = kpis?.edition_year || 2026;

  return (
    <footer className="footer-banner">
      <div className="footer-top">
        <div className="footer-brand">DECARBONIZE INDIA</div>
        <div className="footer-divider-line"></div>
      </div>

      <div className="footer-columns">
        <div className="footer-col">
          <h4>Government Archive Intelligence</h4>
          <p style={{ fontSize: '13px', color: 'var(--sage-300)', lineHeight: 1.6, maxWidth: '320px' }}>
            A verified SQLite database and machine learning forecasting platform based on official Ministry of Statistics &amp; Programme Implementation (MoSPI) publications.
          </p>
        </div>

        <div className="footer-col">
          <h4>Analytics</h4>
          <ul>
            <li><button onClick={() => onNavigate('states')}>State Matrix</button></li>
            <li><button onClick={() => onNavigate('transition')}>Clean Power</button></li>
            <li><button onClick={() => onNavigate('overview')}>Primary Mix</button></li>
            <li><button onClick={() => onNavigate('sectors')}>Sector Demand</button></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Methodology</h4>
          <ul>
            <li><button onClick={() => onNavigate('simulation')}>ML Simulation</button></li>
            <li><button onClick={() => onNavigate('audit')}>Forensic Audit</button></li>
            <li><button onClick={() => {
              const el = document.getElementById('section-methodology');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}>Three-Stage Process</button></li>
            <li><button onClick={() => onNavigate('database')}>SQL Catalog</button></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Data Sources</h4>
          <ul>
            <li><a href="/data/csv/sustainability_indicators.csv" download>Sustainability CSV</a></li>
            <li><a href="/data/csv/electricity_generation_utilities.csv" download>Generation CSV</a></li>
            <li><a href="/data/csv/renewable_installed_capacity_statewise.csv" download>Renewables CSV</a></li>
            <li><a href="/data/database_metadata.json" download>Schema JSON</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div>Decarbonize India | Official MoSPI Energy Statistics {edition} | Strict Zero-Leakage Machine Learning Standards</div>
        <button className="btn-back-to-top" onClick={scrollToTop} aria-label="Back to top">
          <ArrowUp size={18} />
        </button>
      </div>
    </footer>
  );
}

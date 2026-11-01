import React from 'react';

export default function MethodologySteps({ onNavigate, pipelineStatus }) {
  const tableCount = pipelineStatus?.tables_count || 22;
  const viewCount = pipelineStatus?.views_count || 5;

  return (
    <section className="methodology-section" id="section-methodology">
      <div className="methodology-banner">
        <div className="methodology-top">
          <div className="methodology-title">Match Energy Forecasts to Empirical Evidence</div>
          <button className="btn-pill-ghost" onClick={() => onNavigate('audit')}>
            <span>Inspect Methodology Audit</span>
            <span className="pill-dot" style={{ backgroundColor: '#fff' }}></span>
          </button>
        </div>

        <div className="methodology-grid">
          <div className="step-card">
            <span className="solid-header-num step-header">Step 1</span>
            <h3 className="step-title">Official MoSPI Ingestion</h3>
            <p className="step-desc">
              Automated high-precision extraction from government publications into an ACID-compliant SQLite relational database with {tableCount} structured tables and {viewCount} pre-compiled views.
            </p>
          </div>

          <div className="step-card">
            <span className="solid-header-num step-header">Step 2</span>
            <h3 className="step-title">Forensic Leakage Elimination</h3>
            <p className="step-desc">
              Identification and isolation of contemporaneous lookahead bias. Eliminates artificial 99.9% oracle models in favor of honest, real-world lagged macroeconomic estimators.
            </p>
          </div>

          <div className="step-card">
            <span className="solid-header-num step-header">Step 3</span>
            <h3 className="step-title">Dynamic Policy Simulation</h3>
            <p className="step-desc">
              Real-time scenario testing with interactive GDP and population growth elasticities, delivering 2030 demand trajectories and statistical confidence envelopes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

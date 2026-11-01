import React, { useState, useEffect, useCallback } from 'react';
import Hero from './components/Hero';
import ImpactIndicators from './components/ImpactIndicators';
import MethodologySteps from './components/MethodologySteps';
import StateExplorer from './components/StateExplorer';
import MLForecaster from './components/MLForecaster';
import { CleanPowerTransition, PrimarySupplyMix, SectoralDemand } from './components/AnalyticsCharts';
import ForensicAudit from './components/ForensicAudit';
import DataCatalog from './components/DataCatalog';
import Footer from './components/Footer';

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const h = window.location.hash.replace('#tab-', '').replace('#', '');
      const valid = ['states', 'simulation', 'transition', 'overview', 'sectors', 'audit', 'database'];
      if (valid.includes(h)) return h;
    }
    return 'states';
  });
  const [kpis, setKpis] = useState(null);
  const [pipelineStatus, setPipelineStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Dynamic pipeline loader function
  const loadPipelineData = useCallback(() => {
    fetch('/api/kpi')
      .then(res => res.json())
      .then(data => setKpis(data))
      .catch(err => console.error('Failed to load KPIs:', err));

    fetch('/api/pipeline/status')
      .then(res => res.json())
      .then(data => setPipelineStatus(data))
      .catch(err => console.error('Failed to load pipeline telemetry:', err));
  }, []);

  useEffect(() => {
    loadPipelineData();

    // Automated periodic polling: Checks for new government publications and DB updates every 45 seconds
    const interval = setInterval(loadPipelineData, 45000);

    const handleHash = () => {
      const h = window.location.hash.replace('#tab-', '').replace('#', '');
      const valid = ['states', 'simulation', 'transition', 'overview', 'sectors', 'audit', 'database'];
      if (valid.includes(h)) {
        setActiveTab(h);
      }
    };

    window.addEventListener('hashchange', handleHash);
    return () => {
      clearInterval(interval);
      window.removeEventListener('hashchange', handleHash);
    };
  }, [loadPipelineData]);

  const handleSyncPipeline = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/pipeline/sync', { method: 'POST' });
      if (res.ok) {
        loadPipelineData();
      }
    } catch (err) {
      console.error('Failed to trigger pipeline sync:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleNavigate = (tabId) => {
    setActiveTab(tabId);
    window.history.replaceState(null, null, `#tab-${tabId}`);
    const workspace = document.getElementById('analytics-section');
    if (workspace) {
      workspace.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    window.history.replaceState(null, null, `#tab-${tabId}`);
  };

  return (
    <div className="site-wrapper">
      {/* 1. Hero Landing Frame */}
      <Hero 
        onNavigate={handleNavigate} 
        kpis={kpis} 
        pipelineStatus={pipelineStatus} 
        onSyncPipeline={handleSyncPipeline}
        isSyncing={isSyncing}
      />

      {/* 2. Impact & Key Indicators Section */}
      <ImpactIndicators kpis={kpis} />

      {/* 3. Three-Stage Methodology Banner */}
      <MethodologySteps onNavigate={handleNavigate} pipelineStatus={pipelineStatus} />

      {/* 4. Analytics & Simulation Workspace */}
      <section className="analytics-workspace" id="analytics-section">
        {/* Navigation Pills Bar */}
        <nav className="analytics-nav-bar" role="tablist">
          <button 
            id="tab-btn-states"
            className={`section-pill-btn ${activeTab === 'states' ? 'active' : ''}`}
            onClick={() => handleTabClick('states')}
          >
            State Renewable Matrix
          </button>
          <button 
            id="tab-btn-simulation"
            className={`section-pill-btn ${activeTab === 'simulation' ? 'active' : ''}`}
            onClick={() => handleTabClick('simulation')}
          >
            Live Policy Forecaster
          </button>
          <button 
            id="tab-btn-transition"
            className={`section-pill-btn ${activeTab === 'transition' ? 'active' : ''}`}
            onClick={() => handleTabClick('transition')}
          >
            Clean Power Transition
          </button>
          <button 
            id="tab-btn-overview"
            className={`section-pill-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleTabClick('overview')}
          >
            Primary Energy Supply
          </button>
          <button 
            id="tab-btn-sectors"
            className={`section-pill-btn ${activeTab === 'sectors' ? 'active' : ''}`}
            onClick={() => handleTabClick('sectors')}
          >
            Sectoral Consumption
          </button>
          <button 
            id="tab-btn-audit"
            className={`section-pill-btn ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => handleTabClick('audit')}
          >
            Forensic Leakage Audit
          </button>
          <button 
            id="tab-btn-database"
            className={`section-pill-btn ${activeTab === 'database' ? 'active' : ''}`}
            onClick={() => handleTabClick('database')}
          >
            SQL Catalog
          </button>
        </nav>

        {/* Dynamic Tab Panes */}
        <div className="tab-pane-container">
          {activeTab === 'states' && <StateExplorer />}
          {activeTab === 'simulation' && <MLForecaster />}
          {activeTab === 'transition' && <CleanPowerTransition />}
          {activeTab === 'overview' && <PrimarySupplyMix />}
          {activeTab === 'sectors' && <SectoralDemand />}
          {activeTab === 'audit' && <ForensicAudit />}
          {activeTab === 'database' && <DataCatalog />}
        </div>
      </section>

      {/* 5. Footer */}
      <Footer onNavigate={handleNavigate} kpis={kpis} />
    </div>
  );
}

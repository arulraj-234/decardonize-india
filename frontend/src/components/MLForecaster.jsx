import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { RefreshCw } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function MLForecaster() {
  const [gdpGrowth, setGdpGrowth] = useState(6.5);
  const [popGrowth, setPopGrowth] = useState(0.8);
  const [horizon, setHorizon] = useState(6);
  const [modelFamily, setModelFamily] = useState('holt_multiplicative');
  const [activePreset, setActivePreset] = useState('base');

  const [simResult, setSimResult] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const debounceTimer = useRef(null);

  const runSimulation = useCallback(async (gdp = gdpGrowth, pop = popGrowth, hor = horizon, mod = modelFamily) => {
    setCalculating(true);
    try {
      const res = await fetch('/api/forecast/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gdp_growth_rate_pct: gdp,
          pop_growth_rate_pct: pop,
          forecast_horizon_years: hor,
          model_family: mod
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSimResult(data);
    } catch (err) {
      console.error('Failed to run simulation inference:', err);
    } finally {
      setCalculating(false);
    }
  }, [gdpGrowth, popGrowth, horizon, modelFamily]);

  useEffect(() => {
    runSimulation(gdpGrowth, popGrowth, horizon, modelFamily);
  }, []);

  const triggerDebouncedSim = (gdp, pop, hor, mod) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      runSimulation(gdp, pop, hor, mod);
    }, 150);
  };

  const handlePreset = (gdp, pop, hor, presetName) => {
    setGdpGrowth(gdp);
    setPopGrowth(pop);
    setHorizon(hor);
    setActivePreset(presetName);
    runSimulation(gdp, pop, hor, modelFamily);
  };

  const handleGdpChange = (val) => {
    const v = parseFloat(val);
    setGdpGrowth(v);
    setActivePreset(null);
    triggerDebouncedSim(v, popGrowth, horizon, modelFamily);
  };

  const handlePopChange = (val) => {
    const v = parseFloat(val);
    setPopGrowth(v);
    setActivePreset(null);
    triggerDebouncedSim(gdpGrowth, v, horizon, modelFamily);
  };

  const handleHorizonChange = (val) => {
    const v = parseInt(val, 10);
    setHorizon(v);
    setActivePreset(null);
    triggerDebouncedSim(gdpGrowth, popGrowth, v, modelFamily);
  };

  const handleModelChange = (val) => {
    setModelFamily(val);
    runSimulation(gdpGrowth, popGrowth, horizon, val);
  };

  // Chart data
  const chartData = useMemo(() => {
    if (!simResult) return { labels: [], datasets: [] };

    const allYears = [...simResult.historical_years, ...simResult.forecast_years];
    const histPoints = [...simResult.historical_demand_gwh];
    const histData = [...histPoints, ...simResult.forecast_years.map(() => null)];

    const lastHistVal = histPoints[histPoints.length - 1];
    const forecastData = [
      ...simResult.historical_years.slice(0, -1).map(() => null),
      lastHistVal,
      ...simResult.projected_demand_gwh
    ];

    const upperData = [
      ...simResult.historical_years.slice(0, -1).map(() => null),
      lastHistVal,
      ...simResult.confidence_upper_gwh
    ];

    const lowerData = [
      ...simResult.historical_years.slice(0, -1).map(() => null),
      lastHistVal,
      ...simResult.confidence_lower_gwh
    ];

    return {
      labels: allYears,
      datasets: [
        {
          label: 'Historical Actual Demand (MoSPI)',
          data: histData,
          borderColor: '#144532',
          backgroundColor: '#144532',
          borderWidth: 3,
          pointRadius: 4,
          tension: 0.25
        },
        {
          label: 'Projected Demand (Simulated)',
          data: forecastData,
          borderColor: '#10b981',
          backgroundColor: '#10b981',
          borderWidth: 3,
          borderDash: [6, 4],
          pointRadius: 5,
          pointBackgroundColor: '#10b981',
          tension: 0.25
        },
        {
          label: 'Econometric Upper Bound (+3.8%)',
          data: upperData,
          borderColor: 'transparent',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          fill: '+1',
          pointRadius: 0,
          tension: 0.25
        },
        {
          label: 'Econometric Lower Bound (-3.8%)',
          data: lowerData,
          borderColor: 'transparent',
          backgroundColor: 'transparent',
          fill: false,
          pointRadius: 0,
          tension: 0.25
        }
      ]
    };
  }, [simResult]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: { grid: { color: 'rgba(10, 39, 28, 0.06)' } },
      y: {
        grid: { color: 'rgba(10, 39, 28, 0.06)' },
        title: { display: true, text: 'National Electricity Demand (GWh)', color: '#5e7a6c' },
        ticks: { callback: v => Number(v).toLocaleString('en-IN') }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { usePointStyle: true, boxWidth: 8 }
      },
      tooltip: {
        callbacks: {
          label: ctx => {
            if (ctx.parsed.y === null || isNaN(ctx.parsed.y)) return null;
            return `${ctx.dataset.label}: ${Number(Math.round(ctx.parsed.y)).toLocaleString('en-IN')} GWh`;
          }
        }
      }
    }
  };

  return (
    <div className="forecaster-layout">
      {/* Controls Column */}
      <div className="forecaster-controls">
        <div>
          <h3 className="clean-card-title" style={{ fontSize: '18px' }}>Simulation Parameters</h3>
          <p className="clean-card-desc">Stress-test electricity demand under macroeconomic growth assumptions</p>
        </div>

        {/* Presets */}
        <div className="control-item">
          <span className="control-title">Macroeconomic Presets</span>
          <div className="preset-btn-row">
            <button 
              className={`preset-btn ${activePreset === 'conservative' ? 'active' : ''}`}
              onClick={() => handlePreset(5.2, 0.7, 6, 'conservative')}
            >
              Conservative (5.2%)
            </button>
            <button 
              className={`preset-btn ${activePreset === 'base' ? 'active' : ''}`}
              onClick={() => handlePreset(6.5, 0.8, 6, 'base')}
            >
              Base Case (6.5%)
            </button>
            <button 
              className={`preset-btn ${activePreset === 'high' ? 'active' : ''}`}
              onClick={() => handlePreset(8.0, 0.9, 6, 'high')}
            >
              High Growth (8.0%)
            </button>
          </div>
        </div>

        {/* GDP Slider */}
        <div className="control-item">
          <div className="control-label-flex">
            <span className="control-title">Annual Real GDP Growth Rate</span>
            <span className="val-pill">{gdpGrowth.toFixed(1)}%</span>
          </div>
          <input 
            type="range" 
            className="clean-slider" 
            min="4.0" 
            max="9.0" 
            step="0.1" 
            value={gdpGrowth} 
            onChange={(e) => handleGdpChange(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-light-muted)' }}>
            <span>4.0% Sluggish</span>
            <span>6.5% Historical</span>
            <span>9.0% High Boom</span>
          </div>
        </div>

        {/* Pop Slider */}
        <div className="control-item">
          <div className="control-label-flex">
            <span className="control-title">Population Growth Rate</span>
            <span className="val-pill">{popGrowth.toFixed(1)}%</span>
          </div>
          <input 
            type="range" 
            className="clean-slider" 
            min="0.4" 
            max="1.4" 
            step="0.1" 
            value={popGrowth} 
            onChange={(e) => handlePopChange(e.target.value)}
          />
        </div>

        {/* Horizon Slider */}
        <div className="control-item">
          <div className="control-label-flex">
            <span className="control-title">Projection Horizon</span>
            <span className="val-pill">{horizon} Years</span>
          </div>
          <input 
            type="range" 
            className="clean-slider" 
            min="3" 
            max="11" 
            step="1" 
            value={horizon} 
            onChange={(e) => handleHorizonChange(e.target.value)}
          />
        </div>

        {/* Architecture Selector */}
        <div className="control-item">
          <label className="control-title" htmlFor="react-select-model">Forecasting Architecture</label>
          <select 
            id="react-select-model"
            className="clean-select" 
            value={modelFamily} 
            onChange={(e) => handleModelChange(e.target.value)}
          >
            <option value="holt_multiplicative">Holt Multiplicative (Pure Time-Series, 96.0% Honest Accuracy)</option>
            <option value="lagged_macro">Lagged Ridge Econometric (GDP[t-1], 94.8% Honest Accuracy)</option>
            <option value="two_stage">Two-Stage GDP Elasticity (96.6% Honest Accuracy)</option>
          </select>
        </div>

        {/* Summary Grid */}
        <div className="sim-output-grid">
          <div className="sim-output-box">
            <span className="sim-output-label">Projected Demand</span>
            <span className="sim-output-val">{simResult ? `${simResult.final_year_demand_twh.toLocaleString('en-IN')} TWh` : '--'}</span>
          </div>
          <div className="sim-output-box">
            <span className="sim-output-label">Demand Expansion</span>
            <span className="sim-output-val" style={{ color: 'var(--pine-600)' }}>
              {simResult ? `+${simResult.total_demand_expansion_pct}%` : '--'}
            </span>
          </div>
          <div className="sim-output-box">
            <span className="sim-output-label">Annual CAGR</span>
            <span className="sim-output-val">{simResult ? `${simResult.cagr_pct}% / yr` : '--'}</span>
          </div>
          <div className="sim-output-box">
            <span className="sim-output-label">Clean Needed</span>
            <span className="sim-output-val" style={{ color: 'var(--emerald-accent)' }}>
              {simResult ? `+${simResult.clean_energy_required_additional_twh.toLocaleString('en-IN')} TWh` : '--'}
            </span>
          </div>
        </div>

        <button className="btn-simulate-refresh" onClick={() => runSimulation()}>
          <RefreshCw size={15} />
          <span>Recalculate Projections</span>
        </button>
      </div>

      {/* Chart Column */}
      <div className="clean-card" style={{ marginBottom: 0 }}>
        <div className="clean-card-header">
          <div>
            <h2 className="clean-card-title">National Electricity Demand Trajectory (GWh)</h2>
            <p className="clean-card-desc">Real-time simulation trajectory with +/- 3.8% econometric confidence intervals</p>
          </div>
          <span className="badge-tag-clean badge-growth">
            {calculating ? 'Calculating...' : 'Dynamic Inference Active'}
          </span>
        </div>
        <div style={{ height: '440px', position: 'relative' }}>
          {simResult ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Calculating model inference...</div>
          )}
        </div>
      </div>
    </div>
  );
}

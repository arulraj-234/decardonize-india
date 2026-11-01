import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export function CleanPowerTransition() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/views/electricity-transition')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  const chartData = useMemo(() => {
    return {
      labels: data.map(d => d.fiscal_year),
      datasets: [
        {
          type: 'line',
          label: 'Non-Fossil Generation Share (%)',
          data: data.map(d => d.non_fossil_share_pct),
          borderColor: '#10b981',
          backgroundColor: '#10b981',
          borderWidth: 3,
          pointRadius: 5,
          yAxisID: 'y1',
          tension: 0.3
        },
        {
          type: 'bar',
          label: 'Renewable Sources (Solar/Wind/Bio) (GWh)',
          data: data.map(d => d.res_renewable_gwh),
          backgroundColor: '#297a5b',
          yAxisID: 'y',
          stack: 'gen'
        },
        {
          type: 'bar',
          label: 'Hydro Power (GWh)',
          data: data.map(d => d.hydro_gwh),
          backgroundColor: '#0284c7',
          yAxisID: 'y',
          stack: 'gen'
        },
        {
          type: 'bar',
          label: 'Nuclear Power (GWh)',
          data: data.map(d => d.nuclear_gwh),
          backgroundColor: '#6366f1',
          yAxisID: 'y',
          stack: 'gen'
        },
        {
          type: 'bar',
          label: 'Thermal Fossil Generation (GWh)',
          data: data.map(d => d.thermal_total_gwh),
          backgroundColor: '#1f2937',
          yAxisID: 'y',
          stack: 'gen'
        }
      ]
    };
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: { grid: { color: 'rgba(10, 39, 28, 0.06)' } },
      y: {
        position: 'left',
        stacked: true,
        grid: { color: 'rgba(10, 39, 28, 0.06)' },
        title: { display: true, text: 'Gross Generation (GWh)', color: '#5e7a6c' },
        ticks: { callback: v => Number(v).toLocaleString('en-IN') }
      },
      y1: {
        position: 'right',
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'Non-Fossil Share (%)', color: '#10b981' },
        min: 15,
        max: 30,
        ticks: { callback: v => v + '%' }
      }
    }
  };

  return (
    <div className="clean-card">
      <div className="clean-card-header">
        <div>
          <h2 className="clean-card-title">Power Sector Decarbonization: Fossil vs Non-Fossil Generation (GWh)</h2>
          <p className="clean-card-desc">10-year transition trajectory of Thermal versus Hydro, Nuclear, and Renewable Energy generation</p>
        </div>
        <span className="badge-tag-clean badge-growth">v_electricity_transition</span>
      </div>
      <div style={{ height: '420px', position: 'relative' }}>
        {loading ? <div>Loading transition data...</div> : <Bar data={chartData} options={options} />}
      </div>
    </div>
  );
}

export function PrimarySupplyMix() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/views/primary-mix')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  const chartData = useMemo(() => {
    return {
      labels: data.map(d => d.fiscal_year),
      datasets: [
        {
          label: 'Coal (PJ)',
          data: data.map(d => d.coal_petajoules),
          backgroundColor: '#0a271c',
          stack: 'mix',
          borderRadius: 4
        },
        {
          label: 'Petroleum Crude (PJ)',
          data: data.map(d => d.crude_oil_petajoules),
          backgroundColor: '#d97706',
          stack: 'mix',
          borderRadius: 4
        },
        {
          label: 'Natural Gas (PJ)',
          data: data.map(d => d.natural_gas_petajoules),
          backgroundColor: '#0284c7',
          stack: 'mix',
          borderRadius: 4
        },
        {
          label: 'Clean Primary Electricity (PJ)',
          data: data.map(d => d.electricity_petajoules),
          backgroundColor: '#10b981',
          stack: 'mix',
          borderRadius: 4
        },
        {
          label: 'Lignite (PJ)',
          data: data.map(d => d.lignite_petajoules),
          backgroundColor: '#94a3b8',
          stack: 'mix',
          borderRadius: 4
        }
      ]
    };
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: { stacked: true, grid: { color: 'rgba(10, 39, 28, 0.06)' } },
      y: {
        stacked: true,
        grid: { color: 'rgba(10, 39, 28, 0.06)' },
        title: { display: true, text: 'Petajoules (PJ)', color: '#5e7a6c' },
        ticks: { callback: v => Number(v).toLocaleString('en-IN') }
      }
    }
  };

  return (
    <div className="clean-card">
      <div className="clean-card-header">
        <div>
          <h2 className="clean-card-title">Primary Energy Production Mix by Fuel Type (Petajoules)</h2>
          <p className="clean-card-desc">Historical trajectory of Coal, Lignite, Crude Oil, Natural Gas, and Primary Clean Electricity</p>
        </div>
        <span className="badge-tag-clean badge-growth">v_primary_energy_production_mix</span>
      </div>
      <div style={{ height: '420px', position: 'relative' }}>
        {loading ? <div>Loading supply mix data...</div> : <Bar data={chartData} options={options} />}
      </div>
    </div>
  );
}

export function SectoralDemand() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/views/sector-consumption')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  const chartData = useMemo(() => {
    return {
      labels: data.map(d => d.fiscal_year),
      datasets: [
        {
          label: 'Industry (Heavy & Manufacturing)',
          data: data.map(d => d.industry_gwh),
          borderColor: '#144532',
          backgroundColor: 'rgba(20, 69, 50, 0.1)',
          fill: true,
          tension: 0.3,
          borderWidth: 2
        },
        {
          label: 'Domestic (Residential)',
          data: data.map(d => d.domestic_gwh),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.3,
          borderWidth: 2
        },
        {
          label: 'Agriculture (Pumpsets & Irrigation)',
          data: data.map(d => d.agriculture_gwh),
          borderColor: '#d97706',
          backgroundColor: 'rgba(217, 119, 6, 0.1)',
          fill: true,
          tension: 0.3,
          borderWidth: 2
        },
        {
          label: 'Commercial & Services',
          data: data.map(d => d.commercial_gwh),
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.1)',
          fill: true,
          tension: 0.3,
          borderWidth: 2
        },
        {
          label: 'Railways Traction',
          data: data.map(d => d.traction_railways_gwh),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.3,
          borderWidth: 2
        }
      ]
    };
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: { grid: { color: 'rgba(10, 39, 28, 0.06)' } },
      y: {
        grid: { color: 'rgba(10, 39, 28, 0.06)' },
        title: { display: true, text: 'Consumption (GWh)', color: '#5e7a6c' },
        ticks: { callback: v => Number(v).toLocaleString('en-IN') }
      }
    }
  };

  return (
    <div className="clean-card">
      <div className="clean-card-header">
        <div>
          <h2 className="clean-card-title">Sectoral Electricity Consumption Breakdown (GWh)</h2>
          <p className="clean-card-desc">Demand distribution across Industrial, Domestic Residential, Agricultural, Commercial, and Railway Traction loads</p>
        </div>
        <span className="badge-tag-clean badge-growth">v_electricity_consumption_sector_shares</span>
      </div>
      <div style={{ height: '420px', position: 'relative' }}>
        {loading ? <div>Loading sector data...</div> : <Line data={chartData} options={options} />}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Search } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function StateExplorer() {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortField, setSortField] = useState('total_res_2024_mw');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    fetch('/api/views/state-renewables')
      .then(res => res.json())
      .then(data => {
        setStates(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load state renewable data:', err);
        setLoading(false);
      });
  }, []);

  // Top 10 chart data (always top 10 by total capacity)
  const top10 = useMemo(() => {
    return [...states]
      .sort((a, b) => (b.total_res_2024_mw || 0) - (a.total_res_2024_mw || 0))
      .slice(0, 10);
  }, [states]);

  const chartData = useMemo(() => {
    return {
      labels: top10.map(s => s.state_ut),
      datasets: [
        {
          label: 'Solar Capacity (MW)',
          data: top10.map(s => s.solar_2024_mw || 0),
          backgroundColor: '#10b981',
          stack: 'res',
          borderRadius: 4
        },
        {
          label: 'Wind Capacity (MW)',
          data: top10.map(s => s.wind_2024_mw || 0),
          backgroundColor: '#0284c7',
          stack: 'res',
          borderRadius: 4
        },
        {
          label: 'Small Hydro & Bio (MW)',
          data: top10.map(s => (s.bio_power_2024_mw || 0) + (s.small_hydro_2024_mw || 0)),
          backgroundColor: '#144532',
          stack: 'res',
          borderRadius: 4
        }
      ]
    };
  }, [top10]);

  const chartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        grid: { color: 'rgba(10, 39, 28, 0.06)' },
        title: { display: true, text: 'Installed Capacity (MW)', color: '#5e7a6c' },
        ticks: { callback: v => Number(v).toLocaleString('en-IN') }
      },
      y: {
        stacked: true,
        grid: { display: false },
        ticks: { font: { weight: 600 } }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { usePointStyle: true, boxWidth: 8 }
      },
      tooltip: {
        callbacks: {
          label: ctx => `${ctx.dataset.label}: ${Number(ctx.parsed.x).toLocaleString('en-IN')} MW`
        }
      }
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'state_ut');
    }
  };

  // Filtered and sorted state list
  const filteredStates = useMemo(() => {
    let list = [...states];
    if (filterCategory === 'top10') {
      list = list.slice(0, 10);
    } else if (filterCategory === 'solar') {
      list = list.filter(s => (s.solar_2024_mw || 0) >= 4000);
    } else if (filterCategory === 'wind') {
      list = list.filter(s => (s.wind_2024_mw || 0) >= 2000);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(s => s.state_ut && s.state_ut.toLowerCase().includes(q));
    }

    if (sortField) {
      list.sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = (valB || '').toLowerCase();
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        valA = Number(valA || 0);
        valB = Number(valB || 0);
        return sortAsc ? valA - valB : valB - valA;
      });
    }

    return list;
  }, [states, filterCategory, searchQuery, sortField, sortAsc]);

  const handleQuickSelect = (name) => {
    setSearchQuery(name);
    setFilterCategory('all');
  };

  return (
    <div className="state-explorer-view">
      {/* Top 5 State Summary Cards (Dynamically generated from pipeline) */}
      <div className="state-hero-summary">
        {top10.slice(0, 5).map((s, idx) => {
          const solar = s.solar_2024_mw || 0;
          const wind = s.wind_2024_mw || 0;
          const isSolar = solar >= wind;
          const dominantName = isSolar ? 'Solar' : 'Wind';
          const dominantVal = isSolar ? solar : wind;
          const growth = Number(s.growth_pct || 0);

          return (
            <div 
              key={s.state_ut || idx} 
              className="state-chip-card" 
              onClick={() => handleQuickSelect(s.state_ut)}
              title={`Click to filter table for ${s.state_ut}`}
            >
              <div className="state-chip-rank">Rank 0{idx + 1} | {dominantName} Leader</div>
              <div className="state-chip-name">{s.state_ut}</div>
              <div className="state-chip-val">{Number(s.total_res_2024_mw || 0).toLocaleString('en-IN')} MW Total</div>
              <div className="state-chip-sub">
                {dominantName}: {Number(dominantVal).toLocaleString('en-IN')} MW ({growth >= 0 ? '+' : ''}{growth.toFixed(1)}% YoY)
              </div>
            </div>
          );
        })}
      </div>

      {/* Top 10 Comparison Chart */}
      <div className="clean-card">
        <div className="clean-card-header">
          <div>
            <h2 className="clean-card-title">Top 10 Indian States by Installed Clean Energy (MW)</h2>
            <p className="clean-card-desc">Comparative breakdown of Solar, Wind, Small Hydro, and Bio-Power capacity across leading states in 2024</p>
          </div>
          <span className="badge-tag-clean badge-growth">Official MoSPI Table 2.5</span>
        </div>
        <div style={{ height: '340px', position: 'relative' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Loading state charts...</div>
          ) : (
            <Bar data={chartData} options={chartOptions} />
          )}
        </div>
      </div>

      {/* Comprehensive State Table */}
      <div className="clean-card">
        <div className="clean-card-header">
          <div>
            <h2 className="clean-card-title">National Renewable Energy Registry</h2>
            <p className="clean-card-desc">Official installed capacity metrics across all {states.length || 36} Indian States and Union Territories</p>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--pine-700)' }}>
            Showing {filteredStates.length} of {states.length} States & UTs
          </div>
        </div>

        {/* Controls Row */}
        <div className="table-controls-row">
          <div className="search-input-wrapper">
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search state or union territory (e.g. Gujarat, Punjab)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-pill-group">
            <button 
              className={`filter-chip ${filterCategory === 'all' ? 'active' : ''}`}
              onClick={() => setFilterCategory('all')}
            >
              All States
            </button>
            <button 
              className={`filter-chip ${filterCategory === 'top10' ? 'active' : ''}`}
              onClick={() => setFilterCategory('top10')}
            >
              Top 10 Leaders
            </button>
            <button 
              className={`filter-chip ${filterCategory === 'solar' ? 'active' : ''}`}
              onClick={() => setFilterCategory('solar')}
            >
              Solar Dominant (&gt;4,000 MW)
            </button>
            <button 
              className={`filter-chip ${filterCategory === 'wind' ? 'active' : ''}`}
              onClick={() => setFilterCategory('wind')}
            >
              Wind Corridors (&gt;2,000 MW)
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="clean-table-responsive">
          <table className="clean-table" id="state-renewable-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Rank</th>
                <th 
                  onClick={() => handleSort('state_ut')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title="Click to sort by State Name"
                >
                  State / Union Territory {sortField === 'state_ut' ? (sortAsc ? '▲' : '▼') : '↕'}
                </th>
                <th 
                  onClick={() => handleSort('solar_2024_mw')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title="Click to sort by Solar Capacity"
                >
                  Solar (MW) {sortField === 'solar_2024_mw' ? (sortAsc ? '▲' : '▼') : '↕'}
                </th>
                <th 
                  onClick={() => handleSort('wind_2024_mw')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title="Click to sort by Wind Capacity"
                >
                  Wind (MW) {sortField === 'wind_2024_mw' ? (sortAsc ? '▲' : '▼') : '↕'}
                </th>
                <th 
                  onClick={() => handleSort('small_hydro_2024_mw')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title="Click to sort by Small Hydro Capacity"
                >
                  Small Hydro (MW) {sortField === 'small_hydro_2024_mw' ? (sortAsc ? '▲' : '▼') : '↕'}
                </th>
                <th 
                  onClick={() => handleSort('bio_power_2024_mw')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title="Click to sort by Bio-Power Capacity"
                >
                  Bio-Power (MW) {sortField === 'bio_power_2024_mw' ? (sortAsc ? '▲' : '▼') : '↕'}
                </th>
                <th 
                  onClick={() => handleSort('total_res_2024_mw')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title="Click to sort by Total Clean Energy Capacity"
                >
                  Total RES Capacity (MW) {sortField === 'total_res_2024_mw' ? (sortAsc ? '▲' : '▼') : '↕'}
                </th>
                <th 
                  onClick={() => handleSort('growth_pct')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title="Click to sort by Annual Growth Rate"
                >
                  Annual Growth {sortField === 'growth_pct' ? (sortAsc ? '▲' : '▼') : '↕'}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStates.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-light-muted)' }}>
                    No matching states found for this criteria
                  </td>
                </tr>
              ) : (
                filteredStates.map((s, idx) => {
                  const growth = s.growth_pct !== null && s.growth_pct !== undefined ? Number(s.growth_pct) : 0;
                  return (
                    <tr key={s.state_ut || idx}>
                      <td style={{ fontWeight: 700, color: 'var(--pine-600)', width: '60px' }}>#{idx + 1}</td>
                      <td style={{ fontWeight: 600, color: 'var(--pine-950)', fontSize: '14px' }}>{s.state_ut}</td>
                      <td>{Number(s.solar_2024_mw || 0).toLocaleString('en-IN')}</td>
                      <td>{Number(s.wind_2024_mw || 0).toLocaleString('en-IN')}</td>
                      <td>{Number(s.small_hydro_2024_mw || 0).toLocaleString('en-IN')}</td>
                      <td>{Number(s.bio_power_2024_mw || 0).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 700, color: 'var(--pine-700)' }}>
                        {Number(s.total_res_2024_mw || 0).toLocaleString('en-IN')}
                      </td>
                      <td>
                        {growth >= 0 ? (
                          <span className="badge-tag-clean badge-growth">+{growth.toFixed(1)}%</span>
                        ) : (
                          <span style={{ color: '#b91c1c', fontWeight: 600, fontSize: '12px' }}>{growth.toFixed(1)}%</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * India Energy Statistics 2025 - Interactive Analytics & ML Forecaster
 * Client-side Controller & Visualization Engine
 * Strictly NO EMOJIS - Clean SVG icons, refined typography, and smooth animations.
 */

// Global Chart Instances
let chartPrimaryMix = null;
let chartTransition = null;
let chartSectors = null;
let chartTopStates = null;
let chartSimulation = null;

// Global Cache & State
let cachedStateData = [];
let currentFilterCategory = 'all';
let simDebounceTimer = null;

// Chart.js Theme Defaults for Clean Editorial Palette
if (window.Chart) {
  Chart.defaults.color = '#5e7a6c';
  Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.boxWidth = 8;
  Chart.defaults.plugins.legend.labels.padding = 16;
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(7, 31, 21, 0.95)';
  Chart.defaults.plugins.tooltip.titleColor = '#ffffff';
  Chart.defaults.plugins.tooltip.bodyColor = '#b8d4c3';
  Chart.defaults.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.15)';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.padding = 12;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
}

// ============================================================================
// Initialization
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Fetch & Animate Hero KPIs
  fetchKPIs();
  
  // 2. Load Default Tab (States default)
  loadTabContent('states');
  
  // 3. Setup Hash-based Navigation
  window.addEventListener('hashchange', handleHashNavigation);
  if (window.location.hash) {
    const tabName = window.location.hash.replace('#tab-', '').replace('#', '');
    if (tabName && ['states', 'simulation', 'transition', 'overview', 'sectors', 'audit', 'database'].includes(tabName)) {
      switchMainTab(tabName, false);
    }
  }
});

function handleHashNavigation() {
  const hash = window.location.hash;
  if (hash && hash.startsWith('#tab-')) {
    const tab = hash.replace('#tab-', '');
    switchMainTab(tab, false);
  }
}

// ============================================================================
// Smooth Scrolling Helper
// ============================================================================
function scrollToSection(sectionId) {
  const el = document.getElementById(sectionId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}

// ============================================================================
// Tab Management
// ============================================================================
function switchMainTab(tabId, updateHash = true) {
  // Update Buttons
  document.querySelectorAll('.section-pill-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`btn-tab-${tabId}`);
  if (activeBtn) activeBtn.classList.add('active');

  // Update Panes
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
  const activePane = document.getElementById(`pane-${tabId}`);
  if (activePane) activePane.classList.add('active');

  if (updateHash) {
    history.replaceState(null, null, `#tab-${tabId}`);
  }

  // Smooth scroll to workspace if called from header/footer
  const workspace = document.getElementById('analytics-section');
  if (workspace && window.scrollY < workspace.offsetTop - 120) {
    workspace.scrollIntoView({ behavior: 'smooth' });
  }

  // Lazy-load data for current tab
  loadTabContent(tabId);
}

function loadTabContent(tabId) {
  switch (tabId) {
    case 'states':
      if (!chartTopStates || cachedStateData.length === 0) renderStateLeaderboard();
      break;
    case 'simulation':
      if (!chartSimulation) updateSimulation(true);
      break;
    case 'transition':
      if (!chartTransition) renderElectricityTransitionChart();
      break;
    case 'overview':
      if (!chartPrimaryMix) renderPrimaryMixChart();
      break;
    case 'sectors':
      if (!chartSectors) renderSectorConsumptionChart();
      break;
    case 'audit':
      renderAuditTables();
      break;
    case 'database':
      renderDatabaseCatalog();
      break;
  }
}

// ============================================================================
// 1. Executive Hero KPIs
// ============================================================================
async function fetchKPIs() {
  try {
    const res = await fetch('/api/kpi');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Animate Hero Stat Cards
    animateValue('hero-stat-nonfossil', 0, data.non_fossil_share_pct, 1000, (v) => v.toFixed(1) + '%');
    animateValue('hero-stat-generation', 0, data.total_electricity_generation_gwh / 1000.0, 1200, (v) => formatNumber(Math.round(v)) + ' TWh');
    animateValue('hero-stat-res', 0, data.total_res_capacity_gw || (data.total_res_capacity_mw / 1000.0) || 0, 1000, (v) => v.toFixed(1) + ' GW');

    // Dynamically update edition branding and fiscal year subtitle
    const edition = data.edition_year || 2026;
    const fyText = data.fiscal_year_clean || '2024-25';
    document.querySelectorAll('.benchmark-line-2').forEach(el => {
      el.textContent = `(${edition})`;
    });
    document.querySelectorAll('.brand-monogram').forEach(el => {
      el.innerHTML = `ENERGY ${edition} <span>MoSPI BENCHMARK</span>`;
    });
    document.querySelectorAll('.footer-brand').forEach(el => {
      el.textContent = `ENERGY ${edition}`;
    });
    const subTag = document.querySelector('.hero-subtitle-tag span:last-child');
    if (subTag) {
      subTag.textContent = `Verified Government of India Time-Series (FY ${fyText})`;
    }
    const subDesc = document.querySelector('.section-desc-right');
    if (subDesc) {
      subDesc.textContent = `Monitoring the transition away from fossil fuel dependency through verified empirical metrics from the FY ${fyText} fiscal period (MoSPI Energy Statistics ${edition}).`;
    }
    const card1Desc = document.querySelector('.col-stat-1 .impact-card-text');
    if (card1Desc && data.clean_generation_gwh) {
      card1Desc.innerHTML = `Clean electricity generation (Hydro, Nuclear, Solar, and Wind) reached <strong>${formatNumber(Math.round(data.clean_generation_gwh))} GWh</strong> in FY ${fyText}, advancing towards India's long-term decarbonization targets.`;
    }
    const card2Desc = document.querySelector('.col-stat-2 .impact-card-text');
    if (card2Desc && data.generation_yoy_growth_pct !== undefined) {
      const growthSign = data.generation_yoy_growth_pct > 0 ? '+' : '';
      card2Desc.innerHTML = `Total annual generation grew by <strong>${growthSign}${data.generation_yoy_growth_pct.toFixed(1)}% year-on-year</strong>, serving expanding industrial, commercial, and urban electrification demands across ${data.total_states_count || 38} states &amp; UTs.`;
    }
    const card3Desc = document.querySelector('.col-stat-3 .impact-card-text');
    if (card3Desc && data.total_res_capacity_mw) {
      card3Desc.innerHTML = `Cumulative installed renewable capacity reached <strong>${formatNumber(Math.round(data.total_res_capacity_mw))} MW (${(data.total_res_capacity_gw || data.total_res_capacity_mw / 1000).toFixed(1)} GW)</strong> as of FY ${fyText}, led by solar and wind corridors in ${data.top_renewable_leaders || 'Rajasthan and Gujarat'}.`;
    }
  } catch (err) {
    console.warn('Could not load dynamic KPIs, keeping cached MoSPI values:', err);
  }
}

// ============================================================================
// 2. State Renewable Leaderboard & Table (Clean & User-Friendly)
// ============================================================================
async function renderStateLeaderboard() {
  try {
    const res = await fetch('/api/views/state-renewables');
    const data = await res.json();
    cachedStateData = data;

    // 1. Render Horizontal Bar Chart for Top 10 States
    const top10 = data.slice(0, 10);
    const canvas = document.getElementById('chart-top-states');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (chartTopStates) chartTopStates.destroy();

      chartTopStates = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: top10.map(d => d.state_ut),
          datasets: [
            {
              label: 'Solar Capacity (MW)',
              data: top10.map(d => d.solar_2024_mw),
              backgroundColor: '#10b981',
              stack: 'res',
              borderRadius: 4
            },
            {
              label: 'Wind Capacity (MW)',
              data: top10.map(d => d.wind_2024_mw),
              backgroundColor: '#0284c7',
              stack: 'res',
              borderRadius: 4
            },
            {
              label: 'Small Hydro & Bio (MW)',
              data: top10.map(d => (d.bio_power_2024_mw || 0) + (d.small_hydro_2024_mw || 0)),
              backgroundColor: '#144532',
              stack: 'res',
              borderRadius: 4
            }
          ]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          scales: {
            x: {
              stacked: true,
              grid: { color: 'rgba(10, 39, 28, 0.06)' },
              title: { display: true, text: 'Installed Clean Capacity (MW)', color: '#5e7a6c' },
              ticks: { callback: (v) => formatNumber(v) }
            },
            y: {
              stacked: true,
              grid: { display: false },
              ticks: { font: { weight: 600 } }
            }
          }
        }
      });
    }

    // 2. Render Top 5 State Summary Cards dynamically
    const summaryContainer = document.querySelector('.state-hero-summary');
    if (summaryContainer && data.length >= 5) {
      summaryContainer.innerHTML = data.slice(0, 5).map((s, idx) => {
        const solar = s.solar_2024_mw || 0;
        const wind = s.wind_2024_mw || 0;
        const isSolar = solar >= wind;
        const dominantName = isSolar ? 'Solar' : 'Wind';
        const dominantVal = isSolar ? solar : wind;
        const growth = Number(s.growth_pct || 0);
        return `
          <div class="state-chip-card" onclick="filterStateQuick('${s.state_ut}')">
            <div class="state-chip-rank">Rank 0${idx + 1} • ${dominantName} Leader</div>
            <div class="state-chip-name">${s.state_ut}</div>
            <div class="state-chip-val">${formatNumber(Math.round(s.total_res_2024_mw || 0))} MW Total</div>
            <div class="state-chip-sub">${dominantName}: ${formatNumber(Math.round(dominantVal))} MW (${growth >= 0 ? '+' : ''}${growth.toFixed(1)}% YoY)</div>
          </div>
        `;
      }).join('');
    }

    // 3. Populate Full State Table
    applyCombinedStateFilters();

  } catch (err) {
    console.error('Failed to render State Leaderboard:', err);
  }
}

function populateStateTable(states) {
  const tbody = document.getElementById('table-states-body');
  const countEl = document.getElementById('state-table-count');
  if (!tbody) return;

  if (countEl) {
    countEl.textContent = `Showing ${states.length} of ${cachedStateData.length} States & UTs`;
  }

  if (states.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 32px; color:var(--text-light-muted);">No matching states found for this criteria</td></tr>';
    return;
  }

  tbody.innerHTML = states.map((s, idx) => {
    const growth = s.growth_pct !== null && s.growth_pct !== undefined ? Number(s.growth_pct) : 0;
    const growthBadge = growth >= 0 
      ? `<span class="badge-tag-clean badge-growth">+${growth.toFixed(1)}%</span>` 
      : `<span style="color:#b91c1c; font-weight:600; font-size:12px;">${growth.toFixed(1)}%</span>`;

    return `
      <tr>
        <td style="font-weight:700; color:var(--pine-600); width: 60px;">#${idx + 1}</td>
        <td style="font-weight:600; color:var(--pine-950); font-size: 14px;">${escapeHtml(s.state_ut)}</td>
        <td>${formatNumber(s.solar_2024_mw)}</td>
        <td>${formatNumber(s.wind_2024_mw)}</td>
        <td>${formatNumber(s.small_hydro_2024_mw)}</td>
        <td>${formatNumber(s.bio_power_2024_mw)}</td>
        <td style="font-weight:700; color:var(--pine-700);">${formatNumber(s.total_res_2024_mw)}</td>
        <td>${growthBadge}</td>
      </tr>
    `;
  }).join('');
}

function filterStateTableClean() {
  applyCombinedStateFilters();
}

function setTableFilterCategory(category) {
  currentFilterCategory = category;
  document.querySelectorAll('.filter-chip').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`filter-${category}`);
  if (activeBtn) activeBtn.classList.add('active');
  applyCombinedStateFilters();
}

function applyCombinedStateFilters() {
  const query = (document.getElementById('state-search-input')?.value || '').toLowerCase().trim();
  let list = [...cachedStateData];

  // Apply Category Filter
  if (currentFilterCategory === 'top10') {
    list = list.slice(0, 10);
  } else if (currentFilterCategory === 'solar') {
    list = list.filter(s => (s.solar_2024_mw || 0) >= 4000);
  } else if (currentFilterCategory === 'wind') {
    list = list.filter(s => (s.wind_2024_mw || 0) >= 2000);
  }

  // Apply Search Query
  if (query) {
    list = list.filter(s => s.state_ut && s.state_ut.toLowerCase().includes(query));
  }

  populateStateTable(list);
}

function filterStateQuick(stateName) {
  const input = document.getElementById('state-search-input');
  if (input) {
    input.value = stateName;
    setTableFilterCategory('all');
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    input.focus();
  }
}

// ============================================================================
// 3. Live Machine Learning Demand Forecaster & Simulation
// ============================================================================
function applyMacroPreset(gdp, pop, horizon) {
  const gdpSlider = document.getElementById('slider-gdp');
  const popSlider = document.getElementById('slider-pop');
  const horizonSlider = document.getElementById('slider-horizon');

  if (gdpSlider) gdpSlider.value = gdp;
  if (popSlider) popSlider.value = pop;
  if (horizonSlider) horizonSlider.value = horizon;

  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  if (event && event.target) {
    event.target.classList.add('active');
  }

  updateSimulation(true);
}

function updateSimulation(force = false) {
  const gdpSlider = document.getElementById('slider-gdp');
  const popSlider = document.getElementById('slider-pop');
  const horizonSlider = document.getElementById('slider-horizon');
  const modelSelect = document.getElementById('select-model-family');

  const gdpVal = parseFloat(gdpSlider?.value || 6.5);
  const popVal = parseFloat(popSlider?.value || 0.8);
  const horizonVal = parseInt(horizonSlider?.value || 6, 10);
  const modelVal = modelSelect?.value || 'holt_multiplicative';

  // Update Badge displays
  const badgeGdp = document.getElementById('val-slider-gdp');
  if (badgeGdp) badgeGdp.textContent = gdpVal.toFixed(1) + '%';

  const badgePop = document.getElementById('val-slider-pop');
  if (badgePop) badgePop.textContent = popVal.toFixed(1) + '%';

  const badgeHorizon = document.getElementById('val-slider-horizon');
  if (badgeHorizon) badgeHorizon.textContent = `${horizonVal} Years`;

  if (simDebounceTimer) clearTimeout(simDebounceTimer);

  const executeSim = async () => {
    try {
      const badgeStatus = document.getElementById('badge-sim-status');
      if (badgeStatus) badgeStatus.textContent = 'Calculating Inference...';

      const res = await fetch('/api/forecast/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gdp_growth_rate_pct: gdpVal,
          pop_growth_rate_pct: popVal,
          forecast_horizon_years: horizonVal,
          model_family: modelVal
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const simData = await res.json();

      // Update Metric Display Cards
      const finalDemEl = document.getElementById('sim-final-demand');
      if (finalDemEl) finalDemEl.textContent = `${formatNumber(simData.final_year_demand_twh)} TWh`;

      const expEl = document.getElementById('sim-expansion-pct');
      if (expEl) expEl.textContent = `+${simData.total_demand_expansion_pct}%`;

      const cagrEl = document.getElementById('sim-cagr-pct');
      if (cagrEl) cagrEl.textContent = `${simData.cagr_pct}% / yr`;

      const cleanEl = document.getElementById('sim-clean-needed');
      if (cleanEl) cleanEl.textContent = `+${formatNumber(simData.clean_energy_required_additional_twh)} TWh`;

      // Render Simulation Chart
      renderSimulationChart(simData);

      if (badgeStatus) badgeStatus.textContent = 'Dynamic Inference Active';

    } catch (err) {
      console.error('Failed to run simulation inference:', err);
      const badgeStatus = document.getElementById('badge-sim-status');
      if (badgeStatus) badgeStatus.textContent = 'Inference Error';
    }
  };

  if (force) {
    executeSim();
  } else {
    simDebounceTimer = setTimeout(executeSim, 120);
  }
}

function renderSimulationChart(sim) {
  const canvas = document.getElementById('chart-simulation');
  if (!canvas) return;

  const allYears = [...sim.historical_years, ...sim.forecast_years];
  const histPoints = [...sim.historical_demand_gwh];
  const histData = [...histPoints, ...sim.forecast_years.map(() => null)];

  const lastHistVal = histPoints[histPoints.length - 1];
  const forecastData = [
    ...sim.historical_years.slice(0, -1).map(() => null),
    lastHistVal,
    ...sim.projected_demand_gwh
  ];

  const upperData = [
    ...sim.historical_years.slice(0, -1).map(() => null),
    lastHistVal,
    ...sim.confidence_upper_gwh
  ];

  const lowerData = [
    ...sim.historical_years.slice(0, -1).map(() => null),
    lastHistVal,
    ...sim.confidence_lower_gwh
  ];

  const ctx = canvas.getContext('2d');
  if (chartSimulation) chartSimulation.destroy();

  chartSimulation = new Chart(ctx, {
    type: 'line',
    data: {
      labels: allYears,
      datasets: [
        {
          label: 'Historical Actual Demand (MoSPI)',
          data: histData,
          borderColor: '#144532',
          backgroundColor: '#144532',
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 6,
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
          pointHoverRadius: 7,
          pointBackgroundColor: '#10b981',
          tension: 0.25
        },
        {
          label: 'Econometric Upper Bound (+3.8%)',
          data: upperData,
          borderColor: 'transparent',
          backgroundColor: 'rgba(16, 185, 129, 0.14)',
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
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          grid: { color: 'rgba(10, 39, 28, 0.06)' }
        },
        y: {
          grid: { color: 'rgba(10, 39, 28, 0.06)' },
          title: { display: true, text: 'National Electricity Demand (GWh)', color: '#5e7a6c' },
          ticks: { callback: (v) => formatNumber(v) }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => {
              if (ctx.parsed.y === null || isNaN(ctx.parsed.y)) return null;
              return `${ctx.dataset.label}: ${formatNumber(Math.round(ctx.parsed.y))} GWh`;
            }
          }
        }
      }
    }
  });
}

// ============================================================================
// 4. Primary Energy Mix (Petajoules) - Stacked Bar
// ============================================================================
async function renderPrimaryMixChart() {
  const canvas = document.getElementById('chart-primary-mix');
  if (!canvas) return;

  try {
    const res = await fetch('/api/views/primary-mix');
    const data = await res.json();

    const labels = data.map(d => d.fiscal_year);
    const coal = data.map(d => d.coal_petajoules);
    const crude = data.map(d => d.crude_oil_petajoules);
    const gas = data.map(d => d.natural_gas_petajoules);
    const cleanElec = data.map(d => d.electricity_petajoules);
    const lignite = data.map(d => d.lignite_petajoules);

    const ctx = canvas.getContext('2d');
    chartPrimaryMix = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Coal (PJ)',
            data: coal,
            backgroundColor: '#0a271c',
            stack: 'mix',
            borderRadius: 4
          },
          {
            label: 'Petroleum Crude (PJ)',
            data: crude,
            backgroundColor: '#d97706',
            stack: 'mix',
            borderRadius: 4
          },
          {
            label: 'Natural Gas (PJ)',
            data: gas,
            backgroundColor: '#0284c7',
            stack: 'mix',
            borderRadius: 4
          },
          {
            label: 'Clean Primary Electricity (PJ)',
            data: cleanElec,
            backgroundColor: '#10b981',
            stack: 'mix',
            borderRadius: 4
          },
          {
            label: 'Lignite (PJ)',
            data: lignite,
            backgroundColor: '#94a3b8',
            stack: 'mix',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { stacked: true, grid: { color: 'rgba(10, 39, 28, 0.06)' } },
          y: {
            stacked: true,
            grid: { color: 'rgba(10, 39, 28, 0.06)' },
            title: { display: true, text: 'Petajoules (PJ)', color: '#5e7a6c' },
            ticks: { callback: (v) => formatNumber(v) }
          }
        }
      }
    });
  } catch (err) {
    console.error('Failed to render Primary Mix Chart:', err);
  }
}

// ============================================================================
// 5. Clean Power Transition (GWh & Non-Fossil Share)
// ============================================================================
async function renderElectricityTransitionChart() {
  const canvas = document.getElementById('chart-transition');
  if (!canvas) return;

  try {
    const res = await fetch('/api/views/electricity-transition');
    const data = await res.json();

    const labels = data.map(d => d.fiscal_year);
    const thermal = data.map(d => d.thermal_total_gwh);
    const hydro = data.map(d => d.hydro_gwh);
    const nuclear = data.map(d => d.nuclear_gwh);
    const resGen = data.map(d => d.res_renewable_gwh);
    const nonFossilPct = data.map(d => d.non_fossil_share_pct);

    const ctx = canvas.getContext('2d');
    chartTransition = new Chart(ctx, {
      data: {
        labels: labels,
        datasets: [
          {
            type: 'line',
            label: 'Non-Fossil Generation Share (%)',
            data: nonFossilPct,
            borderColor: '#10b981',
            backgroundColor: '#10b981',
            borderWidth: 3,
            pointRadius: 5,
            pointHoverRadius: 7,
            yAxisID: 'y1',
            tension: 0.3
          },
          {
            type: 'bar',
            label: 'Renewable Sources (Solar/Wind/Bio) (GWh)',
            data: resGen,
            backgroundColor: '#297a5b',
            yAxisID: 'y',
            stack: 'gen'
          },
          {
            type: 'bar',
            label: 'Hydro Power (GWh)',
            data: hydro,
            backgroundColor: '#0284c7',
            yAxisID: 'y',
            stack: 'gen'
          },
          {
            type: 'bar',
            label: 'Nuclear Power (GWh)',
            data: nuclear,
            backgroundColor: '#6366f1',
            yAxisID: 'y',
            stack: 'gen'
          },
          {
            type: 'bar',
            label: 'Thermal Fossil Generation (GWh)',
            data: thermal,
            backgroundColor: '#1f2937',
            yAxisID: 'y',
            stack: 'gen'
          }
        ]
      },
      options: {
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
            ticks: { callback: (v) => formatNumber(v) }
          },
          y1: {
            position: 'right',
            grid: { drawOnChartArea: false },
            title: { display: true, text: 'Non-Fossil Share (%)', color: '#10b981' },
            min: 15,
            max: 30,
            ticks: { callback: (v) => v + '%' }
          }
        }
      }
    });
  } catch (err) {
    console.error('Failed to render Electricity Transition Chart:', err);
  }
}

// ============================================================================
// 6. Sectoral Electricity Consumption (GWh)
// ============================================================================
async function renderSectorConsumptionChart() {
  const canvas = document.getElementById('chart-sectors');
  if (!canvas) return;

  try {
    const res = await fetch('/api/views/sector-consumption');
    const data = await res.json();

    const labels = data.map(d => d.fiscal_year);
    const industry = data.map(d => d.industry_gwh);
    const domestic = data.map(d => d.domestic_gwh);
    const agri = data.map(d => d.agriculture_gwh);
    const commercial = data.map(d => d.commercial_gwh);
    const railways = data.map(d => d.traction_railways_gwh);

    const ctx = canvas.getContext('2d');
    chartSectors = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Industry (Heavy & Manufacturing)',
            data: industry,
            borderColor: '#144532',
            backgroundColor: 'rgba(20, 69, 50, 0.1)',
            fill: true,
            tension: 0.3,
            borderWidth: 2
          },
          {
            label: 'Domestic (Residential)',
            data: domestic,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.3,
            borderWidth: 2
          },
          {
            label: 'Agriculture (Pumpsets & Irrigation)',
            data: agri,
            borderColor: '#d97706',
            backgroundColor: 'rgba(217, 119, 6, 0.1)',
            fill: true,
            tension: 0.3,
            borderWidth: 2
          },
          {
            label: 'Commercial & Services',
            data: commercial,
            borderColor: '#0284c7',
            backgroundColor: 'rgba(2, 132, 199, 0.1)',
            fill: true,
            tension: 0.3,
            borderWidth: 2
          },
          {
            label: 'Railways Traction',
            data: railways,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.3,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { grid: { color: 'rgba(10, 39, 28, 0.06)' } },
          y: {
            grid: { color: 'rgba(10, 39, 28, 0.06)' },
            title: { display: true, text: 'Consumption (GWh)', color: '#5e7a6c' },
            ticks: { callback: (v) => formatNumber(v) }
          }
        }
      }
    });
  } catch (err) {
    console.error('Failed to render Sectoral Consumption Chart:', err);
  }
}

// ============================================================================
// 7. Forensic Audit & Fine-Tuning Tables (Strictly No Emojis)
// ============================================================================
async function renderAuditTables() {
  const auditBody = document.getElementById('table-audit-body');
  const finetuneBody = document.getElementById('table-finetune-body');
  if (!auditBody || !finetuneBody) return;

  try {
    const res = await fetch('/api/audit/models');
    const data = await res.json();

    if (data.leakage_audit && data.leakage_audit.length > 0) {
      auditBody.innerHTML = data.leakage_audit.map(row => {
        const isLeaked = (row.Status || '').includes('[LEAKED]');
        const statusBadge = isLeaked
          ? `<span class="badge-tag-clean badge-leak-clean">Lookahead Leakage</span>`
          : `<span class="badge-tag-clean badge-honest-clean">Verified Leak-Free</span>`;
        
        const acc = parseFloat(row['Reported_Accuracy(%)'] || 0);
        const accColor = isLeaked ? '#b91c1c' : '#15803d';

        return `
          <tr>
            <td style="font-weight:600; color:var(--text-light-muted); font-size:12px;">${escapeHtml(row.Paradigm)}</td>
            <td style="font-weight:600; color:var(--pine-950);">${escapeHtml(row.Model)}</td>
            <td style="font-size:12px; color:var(--text-light-secondary);">${escapeHtml(row.Features_Used)}</td>
            <td>${statusBadge}</td>
            <td style="font-weight:700; color:${accColor}; font-size:14px;">${acc.toFixed(2)}%</td>
            <td>${parseFloat(row['Test_MAPE(%)'] || 0).toFixed(2)}%</td>
            <td>${formatNumber(row.Absolute_Error_GWh)}</td>
          </tr>
        `;
      }).join('');
    }

    if (data.fine_tuning_comparison && data.fine_tuning_comparison.length > 0) {
      finetuneBody.innerHTML = data.fine_tuning_comparison.map(row => {
        const testBefore = parseFloat(row['Test_Accuracy_Before(%)'] || 0);
        const testAfter = parseFloat(row['Test_Accuracy_After(%)'] || 0);
        const gain = testAfter - testBefore;
        const gainBadge = gain >= 0
          ? `<span class="badge-tag-clean badge-growth">+${gain.toFixed(2)}%</span>`
          : `<span style="color:var(--text-light-muted);">${gain.toFixed(2)}%</span>`;

        return `
          <tr>
            <td style="font-weight:700; color:var(--pine-950);">${escapeHtml(row.Model)}</td>
            <td style="font-size:12px; font-family:monospace; color:var(--text-light-muted);">${escapeHtml(row.Baseline_Config)}</td>
            <td style="font-size:12px; font-family:monospace; color:var(--pine-700); font-weight:600;">${escapeHtml(row.FineTuned_Config)}</td>
            <td>${parseFloat(row['Val_Accuracy_Before(%)'] || 0).toFixed(2)}%</td>
            <td style="font-weight:600; color:var(--pine-700);">${parseFloat(row['Val_Accuracy_After(%)'] || 0).toFixed(2)}%</td>
            <td>${testBefore.toFixed(2)}%</td>
            <td style="font-weight:700; color:var(--pine-800);">${testAfter.toFixed(2)}% ${gainBadge}</td>
          </tr>
        `;
      }).join('');
    }

  } catch (err) {
    console.error('Failed to load audit benchmarks:', err);
  }
}

// ============================================================================
// 8. Relational Database Catalog Table
// ============================================================================
async function renderDatabaseCatalog() {
  const catalogBody = document.getElementById('table-catalog-body');
  if (!catalogBody) return;

  try {
    const res = await fetch('/api/tables');
    const catalog = await res.json();
    const tableKeys = Object.keys(catalog);

    if (tableKeys.length === 0) {
      catalogBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Catalog is empty</td></tr>';
      return;
    }

    catalogBody.innerHTML = tableKeys.map(name => {
      const item = catalog[name];
      const isView = (item.type || '').toLowerCase() === 'view';
      const typeBadge = isView 
        ? `<span class="badge-tag-clean" style="background:#e0f2fe; color:#0369a1;">SQL VIEW</span>` 
        : `<span class="badge-tag-clean badge-honest-clean">TABLE</span>`;

      const category = item.category || 'Official Energy Statistics';
      const pkey = item.primary_key ? item.primary_key.join(', ') : 'None';
      const csvLink = `/data/csv/${name}.csv`;

      return `
        <tr>
          <td style="font-family:monospace; font-weight:700; color:var(--pine-800); font-size:13px;">${escapeHtml(name)}</td>
          <td>${typeBadge}</td>
          <td style="font-weight:600;">${item.row_count !== undefined ? formatNumber(item.row_count) : '--'}</td>
          <td style="font-size:12px; color:var(--text-light-secondary); max-width: 380px;">${escapeHtml(category)}</td>
          <td style="font-size:12px; font-family:monospace; color:var(--text-light-muted);">${escapeHtml(pkey)}</td>
          <td>
            <a href="${csvLink}" class="badge-tag-clean badge-growth" download style="text-decoration:none;">Download CSV</a>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('Failed to load SQL catalog:', err);
  }
}

// ============================================================================
// Utilities
// ============================================================================
function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '--';
  return Number(num).toLocaleString('en-IN');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function animateValue(elemId, start, end, duration, formatter) {
  const obj = document.getElementById(elemId);
  if (!obj) return;
  const range = end - start;
  const minTimer = 25;
  const stepTime = Math.max(Math.floor(duration / 30), minTimer);
  const steps = Math.floor(duration / stepTime);
  let currentStep = 0;

  const timer = setInterval(() => {
    currentStep++;
    const progress = currentStep / steps;
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const currentVal = start + (range * easeProgress);

    obj.textContent = formatter(currentVal);

    if (currentStep >= steps) {
      clearInterval(timer);
      obj.textContent = formatter(end);
    }
  }, stepTime);
}

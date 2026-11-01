import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUTPUT_DIR = "D:\\vscode\\ml_project\\docs\\screenshots";
const TARGET_URL = "http://127.0.0.1:8000";

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  console.log(`Launching Chrome targeting ${TARGET_URL}...`);
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-extensions',
    '--window-size=1600,1050',
    TARGET_URL
  ]);

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const res = await fetch('http://127.0.0.1:9222/json/list');
      const list = await res.json();
      const page = list.find(t => t.type === 'page');
      if (page && page.webSocketDebuggerUrl) {
        wsUrl = page.webSocketDebuggerUrl;
        console.log(`Connected to page target: ${page.title}`);
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    console.error('Failed to locate page target on Chrome CDP port 9222');
    chrome.kill();
    process.exit(1);
  }

  const ws = new WebSocket(wsUrl);
  await new Promise(resolve => ws.onopen = resolve);

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const curId = id++;
    const h = (e) => {
      const m = JSON.parse(e.data);
      if (m.id === curId) { ws.removeEventListener('message', h); resolve(m.result); }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  // Initial wait for React SPA and API data
  console.log('Waiting for initial data load...');
  await new Promise(r => setTimeout(r, 3000));

  async function captureSection(filename, btnId, waitMs = 2000) {
    console.log(`Capturing ${filename}...`);
    if (btnId) {
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const btn = document.getElementById("${btnId}");
            if (btn) {
              btn.click();
              btn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
            }
            const el = document.getElementById("analytics-section");
            if (el) window.scrollTo(0, el.offsetTop);
          })()
        `
      });
    }
    await new Promise(r => setTimeout(r, waitMs));
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const buffer = Buffer.from(shot.data, 'base64');
    fs.writeFileSync(path.join(OUTPUT_DIR, filename), buffer);
    console.log(`[OK] Saved ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
  }

  // 1. Dashboard Hero
  console.log('Capturing Hero...');
  await send('Runtime.evaluate', { expression: `window.scrollTo(0, 0);` });
  await new Promise(r => setTimeout(r, 1000));
  const shotHero = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'dashboard_hero.png'), Buffer.from(shotHero.data, 'base64'));
  console.log(`[OK] Saved dashboard_hero.png (${(shotHero.data.length * 0.75 / 1024).toFixed(1)} KB)`);

  // 2. Executive Impact Indicators
  console.log('Capturing Executive Impact Indicators...');
  await send('Runtime.evaluate', {
    expression: `
      const el = document.getElementById("section-impact");
      if (el) window.scrollTo(0, el.offsetTop - 40);
    `
  });
  await new Promise(r => setTimeout(r, 1500));
  const shotImpact = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'impact_indicators.png'), Buffer.from(shotImpact.data, 'base64'));
  console.log(`[OK] Saved impact_indicators.png (${(shotImpact.data.length * 0.75 / 1024).toFixed(1)} KB)`);

  // 3. State-Wise Renewable Energy Matrix
  await captureSection('state_renewable_leaderboard.png', 'tab-btn-states', 2000);

  // 4. Live Machine Learning Policy Simulator
  await captureSection('ml_policy_forecaster.png', 'tab-btn-simulation', 2000);

  // 5. Clean Power Transition Trajectory
  await captureSection('clean_power_transition.png', 'tab-btn-transition', 2000);

  // 6. Forensic Data Leakage Audit
  await captureSection('forensic_leakage_audit.png', 'tab-btn-audit', 2000);

  // 7. Relational SQL Schema & Data Catalog
  await captureSection('sql_data_catalog.png', 'tab-btn-database', 2000);

  ws.close();
  chrome.kill();
  console.log('ALL screenshots captured successfully with distinct views!');
}

run().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});

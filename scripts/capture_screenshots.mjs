import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUTPUT_DIR = "D:\\vscode\\ml_project\\docs\\screenshots";

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1600,1200',
    'http://127.0.0.1:8000'
  ]);

  // Wait for remote debugging to be ready
  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const res = await fetch('http://127.0.0.1:9222/json/list');
      const list = await res.json();
      if (list && list.length > 0 && list[0].webSocketDebuggerUrl) {
        wsUrl = list[0].webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    console.error('Failed to connect to Chrome CDP');
    chrome.kill();
    return;
  }

  const ws = new WebSocket(wsUrl);
  await new Promise(resolve => ws.onopen = resolve);

  let idCounter = 1;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      const handler = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  // Helper to capture
  async function capture(filename, evalBefore = null) {
    if (evalBefore) {
      await send('Runtime.evaluate', { expression: evalBefore, awaitPromise: true });
      await new Promise(r => setTimeout(r, 1500));
    }
    const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const buffer = Buffer.from(data, 'base64');
    fs.writeFileSync(path.join(OUTPUT_DIR, filename), buffer);
    console.log(`Saved: ${filename} (${buffer.length} bytes)`);
  }

  // Wait for initial load
  await new Promise(r => setTimeout(r, 2000));

  // 1. Dashboard Hero
  await capture('01_dashboard_hero.png', `window.scrollTo(0, 0);`);

  // 2. State Matrix tab
  await capture('02_state_renewable_matrix.png', `
    if (typeof switchMainTab === 'function') switchMainTab('states');
    const el = document.getElementById('analytics-section') || document.querySelector('.analytics-section');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  `);

  // 3. Live ML Forecaster & Policy Simulator tab
  await capture('03_ml_forecaster_simulator.png', `
    if (typeof switchMainTab === 'function') switchMainTab('simulation');
    const el = document.getElementById('analytics-section') || document.querySelector('.analytics-section');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  `);

  // 4. Clean Energy Transition Trajectory tab
  await capture('04_clean_power_transition.png', `
    if (typeof switchMainTab === 'function') switchMainTab('transition');
    const el = document.getElementById('analytics-section') || document.querySelector('.analytics-section');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  `);

  // 5. Forensic Leakage Audit tab
  await capture('05_forensic_leakage_audit.png', `
    if (typeof switchMainTab === 'function') switchMainTab('audit');
    const el = document.getElementById('analytics-section') || document.querySelector('.analytics-section');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  `);

  // 6. SQL Database Catalog tab
  await capture('06_sql_database_catalog.png', `
    if (typeof switchMainTab === 'function') switchMainTab('database');
    const el = document.getElementById('analytics-section') || document.querySelector('.analytics-section');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  `);

  ws.close();
  chrome.kill();
  console.log('All screenshots captured successfully!');
}

run().catch(console.error);

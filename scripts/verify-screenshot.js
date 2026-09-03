import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Parse CLI Arguments
const args = process.argv.slice(2);
const params = {
  showcase: 'demo_city',
  tod: 12,
  preset: 'overview',
  output: null,
  port: 5173,
  width: 1920,
  height: 1080,
  timeout: 25000
};

for (const arg of args) {
  if (arg.startsWith('--showcase=')) params.showcase = arg.split('=')[1];
  else if (arg.startsWith('--tod=')) params.tod = parseFloat(arg.split('=')[1]);
  else if (arg.startsWith('--preset=')) params.preset = arg.split('=')[1];
  else if (arg.startsWith('--output=')) params.output = arg.split('=')[1];
  else if (arg.startsWith('--port=')) params.port = parseInt(arg.split('=')[1], 10);
  else if (arg.startsWith('--width=')) params.width = parseInt(arg.split('=')[1], 10);
  else if (arg.startsWith('--height=')) params.height = parseInt(arg.split('=')[1], 10);
  else if (arg.startsWith('--timeout=')) params.timeout = parseInt(arg.split('=')[1], 10);
}

const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];

let executablePath = chromePaths.find(p => fs.existsSync(p));
if (!executablePath) {
  console.error('Error: Could not locate Chrome or Edge executable at standard paths.');
  process.exit(1);
}

const screenshotsDir = path.join(rootDir, 'screenshots');
const resultsDir = path.join(rootDir, 'test-results');
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

const targetFilename = params.output || `${params.showcase}_tod${params.tod}_${params.preset}.png`;
const outputPath = path.isAbsolute(targetFilename) ? targetFilename : path.join(screenshotsDir, targetFilename);
const resultPath = path.join(resultsDir, `${path.basename(outputPath, '.png')}.json`);

const targetUrl = `http://127.0.0.1:${params.port}/?showcase=${encodeURIComponent(params.showcase)}&tod=${params.tod}&cam=${encodeURIComponent(params.preset)}`;

async function run() {
  console.log(`[Verify] Starting screenshot verification...`);
  console.log(`[Verify] Target URL: ${targetUrl}`);
  console.log(`[Verify] Browser: ${executablePath}`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    defaultViewport: {
      width: params.width,
      height: params.height,
      deviceScaleFactor: 1
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=default',
      '--allow-insecure-localhost'
    ]
  });

  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  const consoleErrors = [];
  const consoleWarnings = [];
  const logs = [];

  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    logs.push(`[${type.toUpperCase()}] ${text}`);
    if (type === 'error') {
      if (text.includes('favicon.ico')) return;
      consoleErrors.push(text);
      console.error(`  Browser Error: ${text}`);
    } else if (type === 'warning') {
      consoleWarnings.push(text);
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
    console.error(`  Page Exception: ${err.message}`);
  });

  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: params.timeout });

    // Wait until the engine signals readiness
    await page.waitForFunction(() => window.__READY__ === true, {
      timeout: params.timeout,
      polling: 100
    });

    // Wait a brief stabilization delay (for post-processing buffers & texture upload)
    await new Promise(r => setTimeout(r, 600));

    // Extract metrics from the application
    const metrics = await page.evaluate(() => {
      return window.__SIM_METRICS__ || {
        fps: 60,
        drawCalls: 0,
        triangles: 0,
        errors: []
      };
    });

    // Take high-resolution screenshot
    await page.screenshot({ path: outputPath, type: 'png' });
    console.log(`[Verify] Screenshot saved: ${outputPath}`);

    const resultPayload = {
      timestamp: new Date().toISOString(),
      showcase: params.showcase,
      tod: params.tod,
      preset: params.preset,
      screenshot: outputPath,
      metrics,
      consoleErrors,
      consoleWarnings,
      success: consoleErrors.length === 0
    };

    fs.writeFileSync(resultPath, JSON.stringify(resultPayload, null, 2));
    console.log(`[Verify] Result metrics saved: ${resultPath}`);
    console.log(`[Verify] Metrics summary: FPS=${metrics.fps}, DrawCalls=${metrics.drawCalls}, Triangles=${metrics.triangles}, Errors=${consoleErrors.length}`);

    await browser.close();

    if (consoleErrors.length > 0) {
      console.error(`[Verify] FAILED with ${consoleErrors.length} console errors.`);
      process.exit(1);
    }

    console.log(`[Verify] PASSED!`);
    process.exit(0);
  } catch (err) {
    console.error(`[Verify] Fatal execution error:`, err);
    await browser.close();
    process.exit(1);
  }
}

run();

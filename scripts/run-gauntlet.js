import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const statusPath = path.join(rootDir, 'docs', 'STATUS.json');
const status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));

// Modules to gauntlet with target presets and times of day
const gauntletMatrix = [
  { module: 'terrain', tod: 12, preset: 'overview' },
  { module: 'terrain', tod: 17.5, preset: 'cliffs' },
  { module: 'environment', tod: 12, preset: 'sky' },
  { module: 'environment', tod: 18, preset: 'golden' },
  { module: 'environment', tod: 0, preset: 'night_sky' },
  { module: 'roads', tod: 14, preset: 'intersection' },
  { module: 'roads', tod: 21, preset: 'highway_night' },
  { module: 'simulation', tod: 12, preset: 'overview' },
  { module: 'ui', tod: 12, preset: 'overview' },
  { module: 'audio', tod: 12, preset: 'overview' },
  { module: 'effects', tod: 20, preset: 'downtown' },
  { module: 'zoning', tod: 14, preset: 'grid' },
  { module: 'buildings', tod: 14, preset: 'day_blocks' },
  { module: 'buildings', tod: 0, preset: 'night_windows' },
  { module: 'props', tod: 15, preset: 'street_furniture' },
  { module: 'traffic', tod: 18, preset: 'rush_hour' },
  { module: 'traffic', tod: 22, preset: 'headlights' },
  { module: 'tools', tod: 14, preset: 'road_preview' },
  { module: 'demo_city', tod: 16.5, preset: 'bay_overview' },
  { module: 'demo_city', tod: 21, preset: 'downtown_night' },
  { module: 'demo_city', tod: 7, preset: 'sunrise_bridge' }
];

async function runScreenshot(test) {
  const filename = `${test.module}_tod${test.tod}_${test.preset}.png`;
  return new Promise((resolve) => {
    const proc = spawn('node', [
      'scripts/verify-screenshot.js',
      `--showcase=${test.module}`,
      `--tod=${test.tod}`,
      `--preset=${test.preset}`,
      `--output=${filename}`
    ], {
      cwd: rootDir,
      stdio: 'inherit'
    });

    proc.on('close', (code) => {
      resolve({
        test,
        filename,
        exitCode: code
      });
    });
  });
}

async function main() {
  console.log('====================================================');
  console.log('       CITIES: SKYLINES II ENGINE GAUNTLET         ');
  console.log('====================================================');

  const targetModule = process.argv[2];
  const testsToRun = targetModule 
    ? gauntletMatrix.filter(t => t.module === targetModule)
    : gauntletMatrix;

  console.log(`Running gauntlet for ${testsToRun.length} showcase target(s)...`);

  const results = [];
  for (const test of testsToRun) {
    console.log(`\n---> Gauntlet Test: [${test.module}] at TOD=${test.tod}h (${test.preset})`);
    const res = await runScreenshot(test);
    results.push(res);
  }

  console.log('\n====================================================');
  console.log('                 GAUNTLET SUMMARY                   ');
  console.log('====================================================');

  let allPassed = true;
  for (const res of results) {
    const resJsonPath = path.join(rootDir, 'test-results', `${res.test.module}_tod${res.test.tod}_${res.test.preset}.json`);
    let details = 'No result log';
    let fps = 0, drawCalls = 0, errors = 0;

    if (fs.existsSync(resJsonPath)) {
      const data = JSON.parse(fs.readFileSync(resJsonPath, 'utf-8'));
      fps = data.metrics.fps;
      drawCalls = data.metrics.drawCalls;
      errors = data.consoleErrors.length;
      details = `FPS=${fps}, Calls=${drawCalls}, Errors=${errors}`;
    }

    const passed = res.exitCode === 0 && errors === 0;
    if (!passed) allPassed = false;

    console.log(`${passed ? '✅ PASS' : '❌ FAIL'} | ${res.test.module.padEnd(12)} | TOD ${String(res.test.tod).padEnd(4)} | ${res.test.preset.padEnd(16)} | ${details}`);
  }

  process.exit(allPassed ? 0 : 1);
}

main();

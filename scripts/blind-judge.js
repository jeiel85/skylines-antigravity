import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Blind evaluation harness
async function evaluateBlindPairs() {
  console.log('====================================================');
  console.log('         BLIND A/B EVALUATION GAUNTLET              ');
  console.log('====================================================');

  const pairsDir = path.join(rootDir, 'test-results', 'blind-pairs');
  if (!fs.existsSync(pairsDir)) fs.mkdirSync(pairsDir, { recursive: true });

  const statusPath = path.join(rootDir, 'docs', 'STATUS.json');
  const status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));

  console.log('Setting up blind evaluation pairs...');
  // Check available screenshots
  const demoScreenshots = [
    'demo_city_tod16.5_bay_overview.png',
    'demo_city_tod21_downtown_night.png',
    'demo_city_tod7_sunrise_bridge.png'
  ];

  const evaluations = [];

  for (const shot of demoScreenshots) {
    const shotPath = path.join(rootDir, 'screenshots', shot);
    if (!fs.existsSync(shotPath)) {
      console.log(`Screenshot ${shot} not found yet. Run gauntlet first.`);
      continue;
    }

    // Shuffled A/B assignment
    const isOurA = Math.random() > 0.5;
    const pairId = path.basename(shot, '.png');
    
    console.log(`Pair [${pairId}]: Blind label generated.`);
    evaluations.push({
      pairId,
      labelA: isOurA ? 'Our Engine' : 'Reference CS2',
      labelB: isOurA ? 'Reference CS2' : 'Our Engine',
      verdict: 'Pending Critic Evaluation'
    });
  }

  status.blindJudgeResults = evaluations;
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
  console.log(`Blind evaluation setup complete. Results recorded in docs/STATUS.json.`);
}

evaluateBlindPairs();

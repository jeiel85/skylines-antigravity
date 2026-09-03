import { Engine } from './core/Engine.js';

// Query parameter parsing
const urlParams = new URLSearchParams(window.location.search);
const showcaseTarget = urlParams.get('showcase') || 'demo_city';
const timeOfDayParam = urlParams.has('tod') ? parseFloat(urlParams.get('tod')) : 12.0;
const cameraPresetParam = urlParams.get('cam') || 'overview';

async function bootstrap() {
  const canvas = document.getElementById('viewport-canvas');
  const engine = new Engine(canvas, {
    tod: timeOfDayParam,
    preset: cameraPresetParam,
    enablePostProcessing: true
  });

  console.log(`[Skylines] Bootstrapping mode: ${showcaseTarget} | TOD: ${timeOfDayParam}h | Cam: ${cameraPresetParam}`);

  try {
    switch (showcaseTarget) {
      case 'terrain': {
        const { TerrainModule } = await import('./modules/terrain/index.js');
        const terrain = new TerrainModule();
        engine.registerModule('terrain', terrain);
        terrain.showcase(engine.stageGroup, { tod: timeOfDayParam, cameraPreset: cameraPresetParam });
        break;
      }
      case 'environment': {
        const { EnvironmentModule } = await import('./modules/environment/index.js');
        const env = new EnvironmentModule();
        engine.registerModule('environment', env);
        env.showcase(engine.stageGroup, { tod: timeOfDayParam, cameraPreset: cameraPresetParam });
        break;
      }
      case 'roads': {
        const { RoadsModule } = await import('./modules/roads/index.js');
        const roads = new RoadsModule();
        engine.registerModule('roads', roads);
        roads.showcase(engine.stageGroup, { tod: timeOfDayParam, cameraPreset: cameraPresetParam });
        break;
      }
      case 'simulation': {
        const { SimulationModule } = await import('./modules/simulation/index.js');
        const sim = new SimulationModule();
        engine.registerModule('simulation', sim);
        sim.showcase(engine.stageGroup, { tod: timeOfDayParam, cameraPreset: cameraPresetParam });
        break;
      }
      case 'ui': {
        const { UIModule } = await import('./modules/ui/index.js');
        const ui = new UIModule();
        engine.registerModule('ui', ui);
        ui.showcase(engine.stageGroup, { tod: timeOfDayParam, cameraPreset: cameraPresetParam });
        break;
      }
      case 'audio': {
        const { AudioModule } = await import('./modules/audio/index.js');
        const audio = new AudioModule();
        engine.registerModule('audio', audio);
        audio.showcase(engine.stageGroup, { tod: timeOfDayParam, cameraPreset: cameraPresetParam });
        break;
      }
      case 'effects': {
        const { EffectsModule } = await import('./modules/effects/index.js');
        const effects = new EffectsModule();
        engine.registerModule('effects', effects);
        effects.showcase(engine.stageGroup, { tod: timeOfDayParam, cameraPreset: cameraPresetParam });
        break;
      }
      case 'zoning': {
        const { ZoningModule } = await import('./modules/zoning/index.js');
        const zoning = new ZoningModule();
        engine.registerModule('zoning', zoning);
        zoning.showcase(engine.stageGroup, { tod: timeOfDayParam, cameraPreset: cameraPresetParam });
        break;
      }
      case 'buildings': {
        const { BuildingsModule } = await import('./modules/buildings/index.js');
        const bld = new BuildingsModule();
        engine.registerModule('buildings', bld);
        bld.showcase(engine.stageGroup, { tod: timeOfDayParam, cameraPreset: cameraPresetParam });
        break;
      }
      case 'props': {
        const { PropsModule } = await import('./modules/props/index.js');
        const props = new PropsModule();
        engine.registerModule('props', props);
        props.showcase(engine.stageGroup, { tod: timeOfDayParam, cameraPreset: cameraPresetParam });
        break;
      }
      case 'traffic': {
        const { TrafficModule } = await import('./modules/traffic/index.js');
        const traffic = new TrafficModule();
        engine.registerModule('traffic', traffic);
        traffic.showcase(engine.stageGroup, { tod: timeOfDayParam, cameraPreset: cameraPresetParam });
        break;
      }
      case 'tools': {
        const { ToolsModule } = await import('./modules/tools/index.js');
        const tools = new ToolsModule();
        engine.registerModule('tools', tools);
        tools.showcase(engine.stageGroup, { tod: timeOfDayParam, cameraPreset: cameraPresetParam });
        break;
      }
      case 'demo_city':
      default: {
        const { DemoCityModule } = await import('./modules/demo_city/index.js');
        const demo = new DemoCityModule();
        engine.registerModule('demo_city', demo);
        demo.showcase(engine.stageGroup, { tod: timeOfDayParam, cameraPreset: cameraPresetParam });
        break;
      }
    }
  } catch (err) {
    console.error(`[Skylines] Error mounting showcase "${showcaseTarget}":`, err);
  }
}

bootstrap();

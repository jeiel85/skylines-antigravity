import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { World } from './World.js';
import { TimeOfDay } from './TimeOfDay.js';
import { CameraController } from './CameraController.js';
import { Metrics } from './Metrics.js';
import { AssetManager } from './AssetManager.js';

/**
 * Main Engine Lifecycle & WebGL Renderer Pipeline
 */
export class Engine {
  /**
   * @param {HTMLCanvasElement} canvas 
   * @param {Object} options 
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.options = Object.assign({
      seed: 1337,
      tod: 12.0,
      preset: 'overview',
      enablePostProcessing: true
    }, options);

    this.world = new World(this.options.seed);
    this.assets = new AssetManager();
    this.time = new TimeOfDay(this.options.tod, this.world.eventBus);

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a101d);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.5, 3000);
    this.cameraController = new CameraController(this.camera, this.canvas);
    this.cameraController.setPreset(this.options.preset);

    // WebGL Renderer Setup (AAA PBR & Shadow Configuration)
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      logarithmicDepthBuffer: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(1.0); // 1:1 1080p target for guaranteed >= 50 FPS
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Metrics Monitor
    this.metrics = new Metrics(this.renderer);

    // Lighting Rig
    this.sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 1200;
    const d = 250;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0003;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);

    this.hemiLight = new THREE.HemisphereLight(0xddeeff, 0x223344, 0.6);
    this.scene.add(this.hemiLight);

    // Fog for realistic atmospheric depth without cutting off skyscraper crowns
    this.scene.fog = new THREE.Fog(0x94b0cb, 180, 1100);

    // Post-Processing Pipeline
    this.composer = null;
    this.bloomPass = null;
    if (this.options.enablePostProcessing) {
      this.initPostProcessing();
    }

    // Active subsystem modules
    this.modules = new Map();
    this.stageGroup = new THREE.Group();
    this.scene.add(this.stageGroup);

    // Simulation loop bookkeeping
    this.clock = new THREE.Clock();
    this.simAccumulator = 0;
    this.simTickCount = 0;
    this.simStep = 0.1; // 10 ticks per second

    // Bindings
    this._onResize = this.onResize.bind(this);
    window.addEventListener('resize', this._onResize);

    // Synchronize lighting initially
    this.updateLighting();

    // Start loop
    this.running = true;
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    // Signal readiness after short delay
    setTimeout(() => {
      window.__READY__ = true;
      this.metrics.updateGlobalMetrics();
    }, 400);
  }

  initPostProcessing() {
    const size = new THREE.Vector2(window.innerWidth, window.innerHeight);
    this.composer = new EffectComposer(this.renderer);
    
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Unreal Bloom: calibrated for crisp night windows, brake lights, and headlights without overblown glare
    this.bloomPass = new UnrealBloomPass(size, 0.42, 0.38, 0.92);
    this.composer.addPass(this.bloomPass);

    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  updateLighting() {
    const state = this.time.getState();

    // Sun light position & color
    this.sunLight.position.copy(state.sunDirection).multiplyScalar(400);
    this.sunLight.color.copy(state.sunColor);
    this.sunLight.intensity = state.sunIntensity * 2.4;

    // Ambient light
    this.hemiLight.color.copy(state.ambientColor);
    this.hemiLight.groundColor.copy(state.groundColor);
    this.hemiLight.intensity = state.ambientIntensity;

    // Atmospheric Fog color transition matching diurnal cycle
    if (this.scene.fog) {
      const dayFog = new THREE.Color(0x94b0cb);
      const goldenFog = new THREE.Color(0xd48756);
      const nightFog = new THREE.Color(0x0c1322);
      
      let targetFog = dayFog.clone();
      if (state.goldenHourFactor > 0.05) {
        targetFog.lerp(goldenFog, state.goldenHourFactor);
      }
      if (state.nightFactor > 0.05) {
        targetFog.lerp(nightFog, state.nightFactor);
      }
      this.scene.fog.color.copy(targetFog);
      this.renderer.setClearColor(targetFog);
    }

    // Update emissive intensity on architectural and prop materials
    for (const [key, mat] of this.assets.materials.entries()) {
      if (key.startsWith('curtain_') || key.startsWith('res_') || key === 'streetlight') {
        mat.emissiveIntensity = Math.max(0.0, state.nightFactor * 1.15);
      }
    }

    // Subtle bloom scaling at night
    if (this.bloomPass) {
      this.bloomPass.strength = 0.28 + state.nightFactor * 0.45;
    }
  }

  registerModule(name, moduleInstance) {
    moduleInstance.init(this.world, this);
    this.modules.set(name, moduleInstance);
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.composer) {
      this.composer.setSize(w, h);
    }
  }

  animate() {
    if (!this.running) return;
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // Update Camera
    this.cameraController.update(delta);

    // Update Time
    this.time.tick(delta);
    this.updateLighting();

    // Simulation Fixed Step Tick
    this.simAccumulator += delta;
    while (this.simAccumulator >= this.simStep) {
      this.simTickCount++;
      this.simAccumulator -= this.simStep;
      for (const mod of this.modules.values()) {
        if (typeof mod.simTick === 'function') {
          mod.simTick(this.simTickCount);
        }
      }
    }

    // Subsystems frame update
    for (const mod of this.modules.values()) {
      if (typeof mod.update === 'function') {
        mod.update(delta, this.simTickCount);
      }
    }

    // Render
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }

    // Track metrics
    this.metrics.tick();
  }

  dispose() {
    this.running = false;
    window.removeEventListener('resize', this._onResize);
    for (const mod of this.modules.values()) {
      if (typeof mod.dispose === 'function') mod.dispose();
    }
    this.renderer.dispose();
  }
}

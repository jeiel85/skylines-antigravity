import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

/**
 * AAA Atmospheric Environment Subsystem
 * Rayleigh/Mie atmospheric scattering, dynamic sun/moon, starfield dome, and volumetric depth.
 */
export class EnvironmentModule {
  constructor() {
    this.world = null;
    this.engine = null;
    this.sky = null;
    this.sunPosition = new THREE.Vector3();
    this.stars = null;
    this.unsubTime = null;
  }

  init(world, engine) {
    this.world = world;
    this.engine = engine;

    this.initSky();
    this.initStarfield();

    // Listen to diurnal time changes
    this.unsubTime = this.world.eventBus.on('time:updated', (state) => {
      this.syncSky(state);
    });

    // Synchronize current time
    this.syncSky(this.engine.time.getState());
  }

  initSky() {
    this.sky = new Sky();
    this.sky.scale.setScalar(450000);

    const uniforms = this.sky.material.uniforms;
    uniforms['turbidity'].value = 8.0;
    uniforms['rayleigh'].value = 2.0;
    uniforms['mieCoefficient'].value = 0.005;
    uniforms['mieDirectionalG'].value = 0.82;

    this.engine.scene.add(this.sky);
  }

  initStarfield() {
    const starCount = 1800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const color = new THREE.Color();

    for (let i = 0; i < starCount; i++) {
      // Upper hemisphere dome
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0) * 0.48; // keep above horizon
      const r = 1800;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // Star color temperatures (white to slight blue / warm tint)
      const t = Math.random();
      if (t > 0.8) color.setRGB(0.7, 0.85, 1.0); // Blue giant
      else if (t > 0.6) color.setRGB(1.0, 0.9, 0.7); // Yellowish
      else color.setRGB(1.0, 1.0, 1.0);

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 4.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.0,
      sizeAttenuation: false
    });

    this.stars = new THREE.Points(geometry, material);
    this.engine.scene.add(this.stars);
  }

  syncSky(state) {
    if (!this.sky) return;

    // Atmospheric sun position
    const uniforms = this.sky.material.uniforms;
    const sunDir = state.sunDirection.clone().normalize();
    uniforms['sunPosition'].value.copy(sunDir);

    // Adjust scattering turbidity & rayleigh during golden hour & twilight
    if (state.goldenHourFactor > 0.1) {
      uniforms['turbidity'].value = 10.0;
      uniforms['rayleigh'].value = 3.5;
    } else {
      uniforms['turbidity'].value = 8.0;
      uniforms['rayleigh'].value = 2.0;
    }

    // Starfield visibility at night
    if (this.stars) {
      this.stars.material.opacity = Math.max(0.0, (state.nightFactor - 0.2) * 1.25);
    }
  }

  update(delta) {
    if (this.stars && this.stars.material.opacity > 0) {
      // Subtle star dome rotation
      this.stars.rotation.y += delta * 0.002;
    }
  }

  showcase(stageGroup, options = {}) {
    // Stage representative environment terrain backdrop
    const groundGeo = new THREE.PlaneGeometry(600, 600);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x3d5431,
      roughness: 0.9,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    stageGroup.add(ground);

    console.log('[EnvironmentModule] Showcase scene initialized.');
  }

  dispose() {
    if (this.unsubTime) this.unsubTime();
    if (this.sky) this.engine.scene.remove(this.sky);
    if (this.stars) this.engine.scene.remove(this.stars);
  }
}

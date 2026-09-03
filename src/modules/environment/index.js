import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

/**
 * AAA Atmospheric Environment Subsystem
 * Rayleigh/Mie atmospheric scattering, dynamic sun/moon, starfield dome,
 * and dynamic weather simulations (Clear, Rain, Snow, Fog) with camera-tracking particle volumes.
 */
export class EnvironmentModule {
  constructor() {
    this.world = null;
    this.engine = null;
    this.sky = null;
    this.sunPosition = new THREE.Vector3();
    this.stars = null;
    this.unsubTime = null;

    // Weather Simulation State
    this.currentWeather = 'clear';
    this.rainParticles = null;
    this.snowParticles = null;
    this.rainVelocities = null;
    this.snowVelocities = null;
    this.baseFogDensity = 0.0015;
  }

  init(world, engine) {
    this.world = world;
    this.engine = engine;

    this.initSky();
    this.initStarfield();
    this.initWeatherParticles();

    // Listen to diurnal time changes
    this.unsubTime = this.world.eventBus.on('time:updated', (state) => {
      this.syncSky(state);
    });

    // Check URL query param for weather (e.g. ?weather=rain)
    const urlParams = new URLSearchParams(window.location.search);
    const initialWeather = urlParams.get('weather') || 'clear';
    this.setWeather(initialWeather);

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
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0) * 0.48;
      const r = 1800;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const t = Math.random();
      if (t > 0.8) color.setRGB(0.7, 0.85, 1.0);
      else if (t > 0.6) color.setRGB(1.0, 0.9, 0.7);
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

  initWeatherParticles() {
    // 1. Rain Particle System (Falling streaks around camera)
    const rainCount = 2000;
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 3);
    this.rainVelocities = new Float32Array(rainCount);

    for (let i = 0; i < rainCount; i++) {
      rainPos[i * 3] = (Math.random() - 0.5) * 260;
      rainPos[i * 3 + 1] = Math.random() * 90;
      rainPos[i * 3 + 2] = (Math.random() - 0.5) * 260;
      this.rainVelocities[i] = 55.0 + Math.random() * 25.0;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x9ec7eb,
      size: 1.4,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.rainParticles.visible = false;
    this.engine.scene.add(this.rainParticles);

    // 2. Snow Particle System (Gentle drifting flakes)
    const snowCount = 1800;
    const snowGeo = new THREE.BufferGeometry();
    const snowPos = new Float32Array(snowCount * 3);
    this.snowVelocities = new Float32Array(snowCount);

    for (let i = 0; i < snowCount; i++) {
      snowPos[i * 3] = (Math.random() - 0.5) * 260;
      snowPos[i * 3 + 1] = Math.random() * 85;
      snowPos[i * 3 + 2] = (Math.random() - 0.5) * 260;
      this.snowVelocities[i] = 7.0 + Math.random() * 8.0;
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));

    const snowMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2.2,
      transparent: true,
      opacity: 0.85,
      blending: THREE.NormalBlending
    });
    this.snowParticles = new THREE.Points(snowGeo, snowMat);
    this.snowParticles.visible = false;
    this.engine.scene.add(this.snowParticles);
  }

  setWeather(type) {
    this.currentWeather = type;
    console.log(`[EnvironmentModule] Weather changed to: ${type}`);

    if (this.rainParticles) this.rainParticles.visible = (type === 'rain');
    if (this.snowParticles) this.snowParticles.visible = (type === 'snow');

    // Atmospheric Fog Density & Sky Turbidity per weather condition
    if (this.engine && this.engine.scene.fog) {
      if (type === 'fog') {
        this.engine.scene.fog.density = 0.0075;
      } else if (type === 'rain') {
        this.engine.scene.fog.density = 0.0040;
      } else if (type === 'snow') {
        this.engine.scene.fog.density = 0.0032;
      } else {
        this.engine.scene.fog.density = 0.0015;
      }
    }

    if (this.sky) {
      const uniforms = this.sky.material.uniforms;
      if (type === 'rain') {
        uniforms['turbidity'].value = 22.0; // Overcast dark storm clouds
        uniforms['rayleigh'].value = 0.8;
      } else if (type === 'fog') {
        uniforms['turbidity'].value = 16.0;
        uniforms['rayleigh'].value = 1.2;
      } else if (type === 'snow') {
        uniforms['turbidity'].value = 12.0;
        uniforms['rayleigh'].value = 1.8;
      } else {
        uniforms['turbidity'].value = 8.0;
        uniforms['rayleigh'].value = 2.0;
      }
    }

    if (this.world && this.world.eventBus) {
      this.world.eventBus.emit('weather:changed', { weather: type });
    }
  }

  syncSky(state) {
    if (!this.sky) return;

    const uniforms = this.sky.material.uniforms;
    const sunDir = state.sunDirection.clone().normalize();
    uniforms['sunPosition'].value.copy(sunDir);

    if (this.currentWeather === 'clear') {
      if (state.goldenHourFactor > 0.1) {
        uniforms['turbidity'].value = 10.0;
        uniforms['rayleigh'].value = 3.5;
      } else {
        uniforms['turbidity'].value = 8.0;
        uniforms['rayleigh'].value = 2.0;
      }
    }

    // Starfield visibility at night (only visible when not rainy/foggy)
    if (this.stars) {
      const isCloudy = (this.currentWeather === 'rain' || this.currentWeather === 'fog');
      this.stars.material.opacity = isCloudy ? 0.0 : Math.max(0.0, (state.nightFactor - 0.2) * 1.25);
    }
  }

  update(delta) {
    if (this.stars && this.stars.material.opacity > 0) {
      this.stars.rotation.y += delta * 0.002;
    }

    const camPos = this.engine && this.engine.camera ? this.engine.camera.position : null;

    // Animate Rain Particles
    if (this.rainParticles && this.rainParticles.visible) {
      const pos = this.rainParticles.geometry.attributes.position;
      const count = pos.count;
      for (let i = 0; i < count; i++) {
        let y = pos.getY(i) - this.rainVelocities[i] * delta;
        let x = pos.getX(i) + delta * 5.0; // slight wind tilt
        let z = pos.getZ(i);

        // Wrap around camera
        if (camPos) {
          if (x < camPos.x - 130) x += 260;
          else if (x > camPos.x + 130) x -= 260;
          if (z < camPos.z - 130) z += 260;
          else if (z > camPos.z + 130) z -= 260;
        }

        if (y < 2.0) {
          y = (camPos ? camPos.y : 0) + 75.0 + Math.random() * 15.0;
        }

        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
    }

    // Animate Snow Particles
    if (this.snowParticles && this.snowParticles.visible) {
      const pos = this.snowParticles.geometry.attributes.position;
      const count = pos.count;
      const time = performance.now() * 0.0015;
      for (let i = 0; i < count; i++) {
        let y = pos.getY(i) - this.snowVelocities[i] * delta;
        let x = pos.getX(i) + Math.sin(time + i) * 3.5 * delta; // swirling drift
        let z = pos.getZ(i) + Math.cos(time + i) * 2.5 * delta;

        if (camPos) {
          if (x < camPos.x - 130) x += 260;
          else if (x > camPos.x + 130) x -= 260;
          if (z < camPos.z - 130) z += 260;
          else if (z > camPos.z + 130) z -= 260;
        }

        if (y < 2.0) {
          y = (camPos ? camPos.y : 0) + 70.0 + Math.random() * 15.0;
        }

        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
    }
  }

  showcase(stageGroup, options = {}) {
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
    if (this.rainParticles) this.engine.scene.remove(this.rainParticles);
    if (this.snowParticles) this.engine.scene.remove(this.snowParticles);
  }
}

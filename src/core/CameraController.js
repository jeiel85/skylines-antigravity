import * as THREE from 'three';

/**
 * RTS / Isometric Camera Controller with Cinematic Presets & Smooth Damping
 */
export class CameraController {
  /**
   * @param {THREE.PerspectiveCamera} camera 
   * @param {HTMLElement} domElement 
   */
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Target position that camera looks at
    this.target = new THREE.Vector3(0, 5, 0);
    this.currentTarget = new THREE.Vector3(0, 5, 0);

    // Spherical coordinates
    this.radius = 120;
    this.targetRadius = 120;
    this.theta = Math.PI * 0.25; // Azimuth
    this.targetTheta = Math.PI * 0.25;
    this.phi = Math.PI * 0.32; // Polar angle (from +Y axis down)
    this.targetPhi = Math.PI * 0.32;

    // Limits
    this.minRadius = 10;
    this.maxRadius = 1200;
    this.minPhi = 0.08;
    this.maxPhi = Math.PI * 0.48; // Don't clip through ground

    // Interaction state
    this.isDragging = false;
    this.isPanning = false;
    this.dragStart = { x: 0, y: 0 };

    this.presets = {
      overview: { target: [0, 10, 0], radius: 240, theta: 0.8, phi: 0.9 },
      cliffs: { target: [-100, 25, -50], radius: 140, theta: 2.1, phi: 1.25 },
      sky: { target: [0, 40, 0], radius: 100, theta: 0.2, phi: 0.2 },
      golden: { target: [0, 15, 0], radius: 200, theta: 2.7, phi: 1.15 },
      night_sky: { target: [0, 30, 0], radius: 280, theta: 1.4, phi: 1.15 },
      intersection: { target: [0, 6, 0], radius: 55, theta: 0.78, phi: 1.05 },
      highway_night: { target: [-80, 8, 0], radius: 75, theta: 1.8, phi: 1.25 },
      day_blocks: { target: [20, 10, -20], radius: 120, theta: 0.9, phi: 1.05 },
      night_windows: { target: [25, 35, 25], radius: 125, theta: 1.4, phi: 1.12 },
      street_furniture: { target: [5, 6, 5], radius: 24, theta: 0.5, phi: 1.3 },
      rush_hour: { target: [0, 6, 0], radius: 65, theta: 2.2, phi: 1.1 },
      headlights: { target: [-40, 6.5, 0], radius: 30, theta: 3.1, phi: 1.38 },
      road_preview: { target: [0, 6, 0], radius: 85, theta: 0.78, phi: 0.85 },
      bay_overview: { target: [0, 20, 0], radius: 280, theta: 3.8, phi: 1.15 },
      downtown_night: { target: [25, 20, 175], radius: 240, theta: 2.35, phi: 1.15 },
      sunrise_bridge: { target: [150, 10, -65], radius: 140, theta: 2.2, phi: 1.15 },
      cheolsan_apartments: { target: [45, 18, -85], radius: 145, theta: 2.1, phi: 1.15 },
      ktx_station: { target: [20, 16, 175], radius: 180, theta: 2.3, phi: 1.18 },
      dodeoksan_bridge: { target: [-25, 36, -145], radius: 85, theta: 0.85, phi: 0.82 },
      anyangcheon_bridge: { target: [150, 10, -65], radius: 140, theta: 2.2, phi: 1.15 },
      ikea_costco: { target: [-20, 16, 195], radius: 170, theta: 2.2, phi: 1.08 },
      gwangmyeong_cave: { target: [-25, 34, 145], radius: 60, theta: 2.3, phi: 1.12 },
      gwangmyeong_city_hall: { target: [25, 18, -45], radius: 95, theta: 2.1, phi: 1.1 },
      gwangmyeong_market: { target: [-45, 12, -195], radius: 90, theta: 1.9, phi: 1.12 },
      gis_overview: { target: [10, 20, 0], radius: 380, theta: 3.5, phi: 1.05 },
      gureumsan_overview: { target: [20, 20, 0], radius: 320, theta: 3.6, phi: 1.12 }
    };

    this.bindEvents();
    this.updateCamera(1.0);
  }

  setPreset(name) {
    const p = this.presets[name];
    if (!p) {
      console.warn(`[Camera] Unknown preset "${name}". Fallback to overview.`);
      return this.setPreset('overview');
    }
    this.target.set(p.target[0], p.target[1], p.target[2]);
    this.currentTarget.copy(this.target);
    this.radius = this.targetRadius = p.radius;
    this.theta = this.targetTheta = p.theta;
    this.phi = this.targetPhi = p.phi;
    this.updateCamera(1.0);
  }

  bindEvents() {
    if (!this.domElement) return;

    this.domElement.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.isPanning = (e.button === 2 || e.shiftKey);
      this.dragStart = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.dragStart.x;
      const dy = e.clientY - this.dragStart.y;
      this.dragStart = { x: e.clientX, y: e.clientY };

      if (this.isPanning) {
        const factor = this.radius * 0.0015;
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        this.target.addScaledVector(right, -dx * factor);
        this.target.addScaledVector(forward, dy * factor);
      } else {
        this.targetTheta -= dx * 0.005;
        this.targetPhi = Math.max(this.minPhi, Math.min(this.maxPhi, this.targetPhi - dy * 0.005));
      }
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
    });

    this.domElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = 1.0 + Math.abs(e.deltaY) * 0.0012;
      if (e.deltaY > 0) {
        this.targetRadius = Math.min(this.maxRadius, this.targetRadius * zoomFactor);
      } else {
        this.targetRadius = Math.max(this.minRadius, this.targetRadius / zoomFactor);
      }
    }, { passive: false });

    this.domElement.addEventListener('contextmenu', e => e.preventDefault());
  }

  update(delta) {
    const damp = Math.min(1.0, delta * 12.0);
    this.updateCamera(damp);
  }

  updateCamera(factor) {
    this.currentTarget.lerp(this.target, factor);
    this.radius += (this.targetRadius - this.radius) * factor;
    this.theta += (this.targetTheta - this.theta) * factor;
    this.phi += (this.targetPhi - this.phi) * factor;

    // Calculate position in cartesian coordinates from spherical
    const sinPhi = Math.sin(this.phi);
    const cosPhi = Math.cos(this.phi);
    const sinTheta = Math.sin(this.theta);
    const cosTheta = Math.cos(this.theta);

    this.camera.position.set(
      this.currentTarget.x + this.radius * sinPhi * sinTheta,
      this.currentTarget.y + this.radius * cosPhi,
      this.currentTarget.z + this.radius * sinPhi * cosTheta
    );

    this.camera.lookAt(this.currentTarget);
  }
}

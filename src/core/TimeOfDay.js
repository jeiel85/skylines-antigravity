import * as THREE from 'three';

/**
 * Astronomical and Atmospheric Diurnal Cycle
 * Drives physically plausible sun trajectory, color temperature, and atmospheric light.
 */
export class TimeOfDay {
  /**
   * @param {number} initialHour - 0.0 to 24.0 (default 12.0)
   * @param {EventBus} eventBus 
   */
  constructor(initialHour = 12.0, eventBus = null) {
    this.hour = initialHour;
    this.eventBus = eventBus;
    this.timeScale = 1.0; // 1 second real = 1 minute game (or adjustable)
    this.paused = false;

    this.sunDirection = new THREE.Vector3();
    this.moonDirection = new THREE.Vector3();
    this.sunColor = new THREE.Color();
    this.ambientColor = new THREE.Color();
    this.skyColor = new THREE.Color();
    this.groundColor = new THREE.Color();
    
    this.sunIntensity = 1.0;
    this.ambientIntensity = 0.4;
    this.nightFactor = 0.0; // 0 = midday, 1 = full night
    this.goldenHourFactor = 0.0; // 1 = peak golden hour (sunrise/sunset)

    this.updateMath();
  }

  setHour(hour) {
    this.hour = ((hour % 24) + 24) % 24;
    this.updateMath();
    if (this.eventBus) {
      this.eventBus.emit('time:updated', this.getState());
    }
  }

  tick(deltaSeconds) {
    if (this.paused) return;
    // Advance time: default 1 real second = 0.05 game hours (3 mins)
    const hourDelta = (deltaSeconds * this.timeScale * 0.05);
    this.setHour(this.hour + hourDelta);
  }

  updateMath() {
    // Solar trajectory based on 24-hour cycle:
    // 6:00 = Sunrise, 12:00 = Solar Noon, 18:00 = Sunset, 0:00 = Midnight
    const solarProgress = (this.hour - 6) / 24.0;
    const angle = solarProgress * Math.PI * 2;

    // Sun direction (+Y is up, sun rises in East +X and sets in West -X)
    const elevation = Math.sin(angle);
    const azimuth = Math.cos(angle);
    const tilt = 0.35; // Equator tilt for aesthetic angled shadows

    this.sunDirection.set(
      -azimuth,
      Math.max(-0.25, elevation),
      tilt * Math.cos(angle)
    ).normalize();

    this.moonDirection.copy(this.sunDirection).negate();

    // Night factor: 1.0 when sun is below horizon, 0.0 when high noon
    if (elevation < -0.1) {
      this.nightFactor = 1.0;
    } else if (elevation < 0.15) {
      this.nightFactor = 1.0 - (elevation - (-0.1)) / 0.25;
    } else {
      this.nightFactor = 0.0;
    }

    // Golden hour factor: peaks near sunrise (5.5-7.0) and sunset (17.0-18.8)
    const distToRise = Math.abs(this.hour - 6.2);
    const distToSet = Math.abs(this.hour - 17.8);
    const goldenDist = Math.min(distToRise, distToSet);
    this.goldenHourFactor = Math.max(0, 1.0 - goldenDist / 1.2);

    // Compute sun color & intensity based on elevation & atmospheric absorption
    if (elevation > 0.05) {
      // Day Sun
      this.sunIntensity = Math.min(2.5, Math.max(0.1, elevation * 2.8));
      
      if (this.goldenHourFactor > 0.1) {
        // Warm golden orange
        this.sunColor.setRGB(1.0, 0.68, 0.38).lerp(new THREE.Color(1.0, 0.95, 0.88), 1.0 - this.goldenHourFactor);
      } else {
        // High crisp midday daylight
        this.sunColor.setRGB(1.0, 0.96, 0.90);
      }
      this.ambientIntensity = 0.65 + elevation * 0.35;
      this.ambientColor.setRGB(0.62, 0.74, 0.92); // Blue sky hemisphere bounce
      this.skyColor.setRGB(0.38, 0.62, 0.94);
      this.groundColor.setRGB(0.35, 0.32, 0.28);
    } else {
      // Twilight & Night Moon
      const moonIntensity = 0.35;
      this.sunIntensity = moonIntensity;
      this.sunColor.setRGB(0.48, 0.58, 0.82); // Silvery moonlight
      this.ambientIntensity = 0.28;
      this.ambientColor.setRGB(0.18, 0.24, 0.38); // Deep blue night ambient
      this.skyColor.setRGB(0.04, 0.08, 0.16);
      this.groundColor.setRGB(0.06, 0.08, 0.10);
    }
  }

  getState() {
    return {
      hour: this.hour,
      timeScale: this.timeScale,
      paused: this.paused,
      sunDirection: this.sunDirection.clone(),
      moonDirection: this.moonDirection.clone(),
      sunColor: this.sunColor.clone(),
      ambientColor: this.ambientColor.clone(),
      skyColor: this.skyColor.clone(),
      groundColor: this.groundColor.clone(),
      sunIntensity: this.sunIntensity,
      ambientIntensity: this.ambientIntensity,
      nightFactor: this.nightFactor,
      goldenHourFactor: this.goldenHourFactor,
      isNight: this.nightFactor > 0.5
    };
  }
}

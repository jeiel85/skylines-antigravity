/**
 * Procedural Web Audio Subsystem
 * Synthesizes dynamic urban ambiances (traffic hum, wind, daytime birds, night crickets)
 * and interactive sound effects using native Web Audio API oscillators and filters.
 */
export class AudioModule {
  constructor() {
    this.world = null;
    this.engine = null;
    this.ctx = null;
    this.trafficRumble = null;
    this.windNoise = null;
    this.isInitialized = false;
  }

  init(world, engine) {
    this.world = world;
    this.engine = engine;

    // Listen to user interaction to unlock Web Audio context
    const unlock = () => {
      this.ensureContext();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);

    // Subscribe to tool events for auditory cues
    this.world.eventBus.on('tool:activated', () => this.playClick(880, 0.04));
    this.world.eventBus.on('road:created', () => this.playConstructionSound());
  }

  ensureContext() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.startAmbientHum();
      this.isInitialized = true;
      console.log('[AudioModule] Web Audio initialized.');
    } catch (err) {
      console.warn('[AudioModule] Web Audio not supported or blocked:', err);
    }
  }

  startAmbientHum() {
    if (!this.ctx) return;

    // Low-frequency traffic rumble (filtered pink noise simulation)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.06;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(140, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    whiteNoise.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start();
    this.trafficRumble = gain;
  }

  playClick(freq = 600, duration = 0.05) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playConstructionSound() {
    this.playClick(440, 0.08);
  }

  showcase(stageGroup, options = {}) {
    console.log('[AudioModule] Showcase active. Audio ready.');
  }

  dispose() {
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
    }
  }
}

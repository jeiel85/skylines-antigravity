/**
 * Real-Time Performance & Diagnostics Monitor
 * Captures draw calls, triangle count, FPS, and exposes window.__SIM_METRICS__.
 */
export class Metrics {
  constructor(renderer) {
    this.renderer = renderer;
    this.fps = 60;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.drawCalls = 0;
    this.triangles = 0;
    this.errors = [];

    // Hook uncaught errors
    window.addEventListener('error', (e) => {
      this.errors.push(e.message);
    });

    this.updateGlobalMetrics();
  }

  tick() {
    this.frameCount++;
    const now = performance.now();
    const elapsed = now - this.lastTime;

    if (elapsed >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastTime = now;
      this.updateGlobalMetrics();
    }
  }

  updateGlobalMetrics() {
    if (this.renderer && this.renderer.info) {
      this.drawCalls = this.renderer.info.render.calls;
      this.triangles = this.renderer.info.render.triangles;
    }

    window.__SIM_METRICS__ = {
      fps: this.fps,
      drawCalls: this.drawCalls,
      triangles: this.triangles,
      textures: this.renderer?.info?.memory?.textures || 0,
      geometries: this.renderer?.info?.memory?.geometries || 0,
      errors: this.errors
    };
  }
}

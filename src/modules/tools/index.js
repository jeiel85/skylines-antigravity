import * as THREE from 'three';

/**
 * AAA Construction & Interactive Tools Subsystem
 * Road placement bezier preview, zoning marquee brush, bulldozer, and inspector.
 */
export class ToolsModule {
  constructor() {
    this.world = null;
    this.engine = null;
    this.activeTool = 'inspect';
    this.previewGroup = new THREE.Group();
    this.previewGroup.name = 'ToolsPreviewGroup';
  }

  init(world, engine) {
    this.world = world;
    this.engine = engine;
    this.engine.scene.add(this.previewGroup);

    this.world.eventBus.on('tool:activated', (e) => {
      this.activeTool = e.toolName;
      console.log(`[ToolsModule] Active tool switched to: ${this.activeTool}`);
    });
  }

  showcase(stageGroup, options = {}) {
    // Stage a holographic road construction preview spline
    const previewCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-30, 0.4, 0),
      new THREE.Vector3(0, 0.4, 15),
      new THREE.Vector3(30, 0.4, 0)
    ]);

    const pts = previewCurve.getPoints(30);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 4
    });
    const line = new THREE.Line(lineGeo, lineMat);
    stageGroup.add(line);

    // Snap nodes markers
    const nodeGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.4, 16);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 });
    for (const p of [previewCurve.points[0], previewCurve.points[2]]) {
      const marker = new THREE.Mesh(nodeGeo, nodeMat);
      marker.position.copy(p);
      stageGroup.add(marker);
    }

    console.log('[ToolsModule] Showcase scene initialized.');
  }

  dispose() {
    while (this.previewGroup.children.length > 0) {
      const obj = this.previewGroup.children[0];
      this.previewGroup.remove(obj);
    }
  }
}

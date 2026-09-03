import * as THREE from 'three';

/**
 * AAA CS2-Style 8x8m Grid Zoning Subsystem
 * Manages frontages, RCI zoning allocations, holographic tile shader visualization,
 * and cell updates.
 */
export class ZoningModule {
  constructor() {
    this.world = null;
    this.engine = null;
    this.zoningGroup = new THREE.Group();
    this.zoningGroup.name = 'ZoningSubsystemGroup';
    this.cellMeshes = new Map();
  }

  init(world, engine) {
    this.world = world;
    this.engine = engine;
    this.engine.scene.add(this.zoningGroup);

    // React to road creation to dynamically generate frontages
    this.world.eventBus.on('road:created', (road) => this.generateFrontageForRoad(road));
  }

  /**
   * Generates zoning tiles along a road spline
   */
  generateFrontageForRoad(road) {
    // Generate grid tiles flanking the road
    const s = this.world.zoning.cellSize; // 8.0m
    const pts = road.points;
    if (!pts || pts.length < 2) return;

    for (const p of pts) {
      const { cellX, cellZ } = this.world.worldToZoneCell(p.x, p.z);
      // Generate 4x4 surrounding zone cells
      for (let dx = -3; dx <= 3; dx++) {
        for (let dz = -3; dz <= 3; dz++) {
          const cx = cellX + dx;
          const cz = cellZ + dz;
          const key = `${cx},${cz}`;
          if (!this.world.zoning.cells.has(key)) {
            this.world.zoning.cells.set(key, {
              cellX: cx,
              cellZ: cz,
              type: 'none',
              density: 'low',
              occupied: false
            });
            this.createCellVisual(cx, cz, 'none');
          }
        }
      }
    }
  }

  createCellVisual(cx, cz, type = 'none') {
    const s = this.world.zoning.cellSize - 0.4;
    const geo = new THREE.PlaneGeometry(s, s);
    geo.rotateX(-Math.PI / 2);

    const colors = {
      none: 0xffffff,
      residential: 0x00e676,
      commercial: 0x29b6f6,
      industrial: 0xffa726,
      office: 0x00e5ff
    };

    const mat = new THREE.MeshBasicMaterial({
      color: colors[type] || 0xffffff,
      transparent: true,
      opacity: type === 'none' ? 0.08 : 0.42,
      wireframe: type === 'none',
      depthWrite: false
    });

    const mesh = new THREE.Mesh(geo, mat);
    const { x, y, z } = this.world.zoneCellToWorld(cx, cz);
    mesh.position.set(x, y + 0.12, z);

    this.zoningGroup.add(mesh);
    this.cellMeshes.set(`${cx},${cz}`, mesh);
    return mesh;
  }

  setZone(cx, cz, type, density = 'low') {
    const key = `${cx},${cz}`;
    const cell = this.world.zoning.cells.get(key);
    if (!cell) return;

    cell.type = type;
    cell.density = density;

    const mesh = this.cellMeshes.get(key);
    if (mesh) {
      const colors = {
        none: 0xffffff,
        residential: 0x00e676,
        commercial: 0x29b6f6,
        industrial: 0xffa726,
        office: 0x00e5ff
      };
      mesh.material.color.setHex(colors[type] || 0xffffff);
      mesh.material.opacity = type === 'none' ? 0.08 : 0.45;
      mesh.material.wireframe = (type === 'none');
    }

    this.world.eventBus.emit('zone:painted', { cellX: cx, cellZ: cz, type, density });
  }

  showcase(stageGroup, options = {}) {
    // Generate a showcase grid with residential, commercial, industrial zones
    for (let x = -4; x <= 4; x++) {
      for (let z = -4; z <= 4; z++) {
        let type = 'none';
        if (x < -1) type = 'residential';
        else if (x > 1) type = 'commercial';
        else if (z > 1) type = 'industrial';
        else type = 'office';

        const mesh = this.createCellVisual(x, z, type);
        stageGroup.add(mesh);
      }
    }
    console.log('[ZoningModule] Showcase scene initialized.');
  }

  dispose() {
    while (this.zoningGroup.children.length > 0) {
      const obj = this.zoningGroup.children[0];
      this.zoningGroup.remove(obj);
    }
  }
}

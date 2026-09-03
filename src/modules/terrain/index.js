import * as THREE from 'three';

/**
 * AAA Gwangmyeong-si Procedural Terrain & Hydrology Subsystem
 * Faithful representation of Gwangmyeong's topography:
 * - Anyangcheon (안양천) river valley on the eastern boundary
 * - Dodeoksan (도덕산, ~183m) with gorge in the north
 * - Gureumsan (구름산, ~240m) pine forest ridge in the center-west
 * - Gahaksan (가학산) in the south-west
 * - Cheolsan/Haan residential alluvial plains & Iljik KTX transit basin
 */
export class TerrainModule {
  constructor() {
    this.world = null;
    this.engine = null;
    this.terrainMesh = null;
    this.waterMesh = null;
  }

  init(world, engine) {
    this.world = world;
    this.engine = engine;

    // Register canonical height calculation in world
    this.world.terrain.getHeightAt = (x, z) => this.calculateElevation(x, z);
  }

  /**
   * Topographic elevation model of Gwangmyeong-si
   */
  calculateElevation(x, z) {
    // 1. Anyangcheon (안양천) River Channel along East Boundary (x ~ 140)
    const riverMeander = Math.sin(z * 0.007) * 12.0;
    const anyangcheonBedX = 140.0 + riverMeander;
    const distAnyangcheon = Math.abs(x - anyangcheonBedX);

    // 2. Mokgamcheon (목감천) River Channel along North-West Boundary
    // Meanders from South-West of Gwangmyeong-dong up to northern apex confluence with Anyangcheon
    const mokgamBedX = -110.0 + (z + 240) * 0.65 + Math.sin(z * 0.015) * 8.0;
    const isNorthWest = (z < -140 && x < 40);
    const distMokgam = isNorthWest ? Math.abs(x - mokgamBedX) : 999.0;

    // 3. The 4 Mountains of Gwangmyeong (광명 4대 산):
    // Peak 1: 도덕산 (Dodeoksan, North, peak at x=-38, z=-160)
    const distDodeok = Math.hypot(x - (-38), z - (-160));
    const dodeokRidge = Math.max(0.0, 1.0 - distDodeok / 115.0);
    const dodeokGorge = Math.exp(-Math.pow((x - (-25)) / 16.0, 2) - Math.pow((z - (-145)) / 18.0, 2)) * 14.0;
    const dodeokElevation = Math.pow(dodeokRidge, 1.8) * 48.0 - dodeokGorge;

    // Peak 2: 구름산 (Gureumsan, Central-West, peak at x=-55, z=15) - Highest peak in Gwangmyeong
    const distGureum = Math.hypot((x - (-55)) * 0.9, (z - 15) * 0.7);
    const gureumRidge = Math.max(0.0, 1.0 - distGureum / 140.0);
    const gureumNoise = Math.sin(x * 0.03) * Math.cos(z * 0.03) * 3.5;
    const gureumElevation = Math.pow(gureumRidge, 1.6) * 65.0 + (gureumRidge > 0.1 ? gureumNoise : 0);

    // Peak 3: 가학산 (Gahaksan, South-West, peak at x=-65, z=145, 광명동굴)
    const distGahak = Math.hypot(x - (-65), z - 145);
    const gahakRidge = Math.max(0.0, 1.0 - distGahak / 110.0);
    const gahakElevation = Math.pow(gahakRidge, 1.7) * 56.0;

    // Peak 4: 서독산 (Seodoksan, South, peak at x=-25, z=230)
    const distSeodok = Math.hypot(x - (-25), z - 230);
    const seodokRidge = Math.max(0.0, 1.0 - distSeodok / 105.0);
    const seodokElevation = Math.pow(seodokRidge, 1.7) * 46.0;

    // 4. Urban Plain Baseline (Cheolsan, Haan, Soha, Iljik)
    const basePlain = 6.0 + Math.sin(x * 0.01) * Math.cos(z * 0.008) * 1.2;

    // Composite Elevation
    let elevation = basePlain +
      Math.max(0.0, dodeokElevation) +
      Math.max(0.0, gureumElevation) +
      Math.max(0.0, gahakElevation) +
      Math.max(0.0, seodokElevation);

    // Carve Anyangcheon Riverbed down to water level
    if (distAnyangcheon < 30.0) {
      const smoothDrop = Math.cos((distAnyangcheon / 30.0) * Math.PI) * 0.5 + 0.5;
      elevation = elevation * (1.0 - smoothDrop) + (2.0 * smoothDrop);
    }

    // Carve Mokgamcheon Riverbed
    if (distMokgam < 22.0) {
      const smoothDrop = Math.cos((distMokgam / 22.0) * Math.PI) * 0.5 + 0.5;
      elevation = elevation * (1.0 - smoothDrop) + (2.0 * smoothDrop);
    }

    return Math.max(1.8, elevation);
  }

  /**
   * Generates high-density terrain mesh with slope-based PBR vertex shading & rock normals
   */
  generateTerrainMesh(size = 900, resolution = 140) {
    const geometry = new THREE.PlaneGeometry(size, size, resolution, resolution);
    geometry.rotateX(-Math.PI / 2);

    const pos = geometry.attributes.position;
    const colors = [];
    const color = new THREE.Color();

    const grassColor = new THREE.Color(0x3e662c);
    const dryGrassColor = new THREE.Color(0x566d3a);
    const rockColor = new THREE.Color(0x42464b);
    const riverSandColor = new THREE.Color(0x8a846c);
    const cliffDarkColor = new THREE.Color(0x272b30);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = this.calculateElevation(x, z);
      pos.setY(i, y);

      // Estimate slope via finite differences
      const eps = 2.0;
      const dy_dx = (this.calculateElevation(x + eps, z) - this.calculateElevation(x - eps, z)) / (2 * eps);
      const dy_dz = (this.calculateElevation(x, z + eps) - this.calculateElevation(x, z - eps)) / (2 * eps);
      const slope = Math.sqrt(dy_dx * dy_dx + dy_dz * dy_dz);

      // River bank transition: y < 3.8m
      const riverBlend = Math.max(0, Math.min(1.0, (y - 2.5) / 1.5));

      if (riverBlend < 1.0) {
        // Anyangcheon riverside soil & pebble promenade
        color.copy(riverSandColor).lerp(grassColor, riverBlend);
      } else if (slope > 0.60) {
        // Steep mountain rock faces (Dodeoksan & Gureumsan crags)
        color.copy(rockColor).lerp(cliffDarkColor, Math.min(1.0, (slope - 0.60) * 1.8));
      } else if (slope > 0.35) {
        // Forested mountain slopes
        const blend = (slope - 0.35) / 0.25;
        color.copy(dryGrassColor).lerp(rockColor, blend);
      } else {
        // Urban plains: lush grass with organic soil modulation
        const noise = (Math.sin(x * 0.04) * Math.cos(z * 0.04) + 1.0) * 0.5;
        color.copy(grassColor).lerp(dryGrassColor, noise * 0.35);
      }

      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.05,
      flatShading: false
    });

    this.terrainMesh = new THREE.Mesh(geometry, material);
    this.terrainMesh.name = 'GwangmyeongTerrain';
    this.terrainMesh.receiveShadow = true;
    return this.terrainMesh;
  }

  /**
   * Generates Anyangcheon specular water surface mesh
   */
  generateWaterMesh(size = 900) {
    const geometry = new THREE.PlaneGeometry(size, size, 48, 48);
    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.MeshStandardMaterial({
      color: 0x1a3a48,
      roughness: 0.12,
      metalness: 0.85,
      transparent: true,
      opacity: 0.88
    });

    this.waterMesh = new THREE.Mesh(geometry, material);
    this.waterMesh.name = 'AnyangcheonWaterPlane';
    this.waterMesh.position.y = 3.2; // Calibrated Anyangcheon water level
    this.waterMesh.receiveShadow = true;
    return this.waterMesh;
  }

  showcase(stageGroup, options = {}) {
    const terrain = this.generateTerrainMesh(700, 120);
    const water = this.generateWaterMesh(700);
    stageGroup.add(terrain);
    stageGroup.add(water);
    console.log('[TerrainModule] Gwangmyeong-si terrain showcase initialized.');
  }

  dispose() {
    if (this.terrainMesh) {
      this.terrainMesh.geometry.dispose();
      this.terrainMesh.material.dispose();
    }
    if (this.waterMesh) {
      this.waterMesh.geometry.dispose();
      this.waterMesh.material.dispose();
    }
  }
}

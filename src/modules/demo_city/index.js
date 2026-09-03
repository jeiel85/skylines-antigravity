import * as THREE from 'three';
import { TerrainModule } from '../terrain/index.js';
import { EnvironmentModule } from '../environment/index.js';
import { RoadsModule } from '../roads/index.js';
import { BuildingsModule } from '../buildings/index.js';
import { PropsModule } from '../props/index.js';
import { TrafficModule } from '../traffic/index.js';
import { UIModule } from '../ui/index.js';

/**
 * AAA Master Showcase Metropolis: "New Antigravity Bay"
 * Realistic urban street grid, suspension bridge delta, vibrant architectural skyline,
 * tree-lined sidewalks, streetlamps, and multi-lane vehicular traffic.
 */
export class DemoCityModule {
  constructor() {
    this.world = null;
    this.engine = null;
    this.cityGroup = new THREE.Group();
    this.submodules = {};
  }

  init(world, engine) {
    this.world = world;
    this.engine = engine;
    this.engine.scene.add(this.cityGroup);
  }

  showcase(stageGroup, options = {}) {
    console.log('[DemoCityModule] Assembling "New Antigravity Bay" metropolis...');

    // 1. Terrain & Water
    const terrain = new TerrainModule();
    terrain.init(this.world, this.engine);
    const terrainMesh = terrain.generateTerrainMesh(1100, 180);
    const waterMesh = terrain.generateWaterMesh(1200);
    stageGroup.add(terrainMesh);
    stageGroup.add(waterMesh);
    this.submodules.terrain = terrain;

    // 2. Atmospheric Environment & Sky
    const env = new EnvironmentModule();
    env.init(this.world, this.engine);
    this.submodules.env = env;

    // 3. Roads & Bridge Network
    const roads = new RoadsModule();
    roads.init(this.world, this.engine);
    this.submodules.roads = roads;

    // --- Urban Road Grid ---
    // Avenue 1: Central East-West Boulevard
    const aveCenter = roads.createRoadSegment([
      new THREE.Vector3(-80, 6, 0),
      new THREE.Vector3(0, 6, 0),
      new THREE.Vector3(140, 6, 0)
    ], { width: 16, lanes: 4 });
    stageGroup.add(aveCenter);

    // Avenue 2: North Commercial Boulevard
    const aveNorth = roads.createRoadSegment([
      new THREE.Vector3(-80, 6, 65),
      new THREE.Vector3(0, 6, 65),
      new THREE.Vector3(140, 6, 65)
    ], { width: 14, lanes: 4 });
    stageGroup.add(aveNorth);

    // Avenue 3: South Waterfront Promenade
    const aveSouth = roads.createRoadSegment([
      new THREE.Vector3(-80, 6, -65),
      new THREE.Vector3(0, 6, -65),
      new THREE.Vector3(140, 6, -65)
    ], { width: 14, lanes: 4 });
    stageGroup.add(aveSouth);

    // Cross Boulevard 1 (West Downtown)
    const crossWest = roads.createRoadSegment([
      new THREE.Vector3(-70, 6, -65),
      new THREE.Vector3(-70, 6, 0),
      new THREE.Vector3(-70, 6, 65)
    ], { width: 14, lanes: 2 });
    stageGroup.add(crossWest);

    // Cross Boulevard 2 (Center Core)
    const crossCenter = roads.createRoadSegment([
      new THREE.Vector3(0, 6, -65),
      new THREE.Vector3(0, 6, 0),
      new THREE.Vector3(0, 6, 65)
    ], { width: 16, lanes: 4 });
    stageGroup.add(crossCenter);

    // Cross Boulevard 3 (East Financial)
    const crossEast = roads.createRoadSegment([
      new THREE.Vector3(70, 6, -65),
      new THREE.Vector3(70, 6, 0),
      new THREE.Vector3(70, 6, 65)
    ], { width: 14, lanes: 2 });
    stageGroup.add(crossEast);

    // Major Intersections
    const junctions = [
      roads.createIntersection(new THREE.Vector3(0, 6, 0), 18),
      roads.createIntersection(new THREE.Vector3(70, 6, 0), 16),
      roads.createIntersection(new THREE.Vector3(-70, 6, 0), 16),
      roads.createIntersection(new THREE.Vector3(0, 6, 65), 16),
      roads.createIntersection(new THREE.Vector3(70, 6, 65), 16)
    ];
    for (const j of junctions) stageGroup.add(j);

    // Coastal Suspension Bridge spanning across delta river (Westward from -80 to -340)
    const bridgeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-80, 6, 0),
      new THREE.Vector3(-140, 14, 0),
      new THREE.Vector3(-240, 14, 0),
      new THREE.Vector3(-340, 6, 0)
    ]);
    const bridgeRoad = roads.createRoadSegment(bridgeCurve.points, { width: 16, lanes: 4, isBridge: true });
    stageGroup.add(bridgeRoad);

    const bridgeStructure = this.buildSuspensionBridgeStructure();
    stageGroup.add(bridgeStructure);

    // 4. Buildings & Architecture
    const bld = new BuildingsModule();
    bld.init(this.world, this.engine);
    this.submodules.bld = bld;

    // --- Block 1: Financial District (East of Center, North of Main Ave) ---
    // [x: 15..55, z: 15..50]
    stageGroup.add(bld.createSkyscraper(35, 32, 145, 'cyan'));
    stageGroup.add(bld.createSkyscraper(55, 48, 125, 'blue'));

    // --- Block 2: Corporate Plaza (East of 70 Ave, North of Main Ave) ---
    stageGroup.add(bld.createSkyscraper(95, 32, 165, 'blue'));
    stageGroup.add(bld.createSkyscraper(120, 48, 110, 'emerald'));

    // --- Block 3: Downtown Core (West of Center, North of Main Ave) ---
    stageGroup.add(bld.createSkyscraper(-35, 32, 130, 'bronze'));
    stageGroup.add(bld.createSkyscraper(-52, 48, 95, 'cyan'));

    // --- Block 4: Waterfront Tech Center (East of Center, South of Main Ave) ---
    stageGroup.add(bld.createSkyscraper(35, -32, 138, 'cyan'));
    stageGroup.add(bld.createSkyscraper(55, -45, 115, 'blue'));
    stageGroup.add(bld.createSkyscraper(95, -32, 105, 'emerald'));

    // --- Block 5: Civic & Arts Center (West of Center, South of Main Ave) ---
    stageGroup.add(bld.createSkyscraper(-35, -32, 120, 'blue'));
    stageGroup.add(bld.createSkyscraper(-52, -45, 90, 'bronze'));

    // --- Waterfront Promenade Luxury Residential Apartments ---
    for (let i = 0; i < 5; i++) {
      const apt = bld.createResidentialBuilding(20 + i * 26, -88, 7, 22, 15);
      stageGroup.add(apt);
    }

    // --- Suburban Residential District (North of 65 Ave) ---
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 6; col++) {
        const house = bld.createSuburbanHouse(-40 + col * 24, 88 + row * 22);
        stageGroup.add(house);
      }
    }

    // --- Industrial Port District (Far East) ---
    const warehouse1 = bld.createIndustrialFacility(125, -90, 36, 24);
    stageGroup.add(warehouse1);

    // 5. Props, Streetlights & Trees
    const props = new PropsModule();
    props.init(this.world, this.engine);
    this.submodules.props = props;

    // Avenue streetlamps (East-West Boulevard)
    for (let x = -70; x <= 130; x += 25) {
      if (Math.abs(x) < 12 || Math.abs(x - 70) < 12) continue;
      props.spawnStreetlamp(x, 9.5, 0);
      props.spawnStreetlamp(x, -9.5, Math.PI);
    }

    // Tree-lined sidewalks along central avenues
    for (let x = -65; x <= 135; x += 18) {
      if (Math.abs(x) < 15 || Math.abs(x - 70) < 15) continue;
      const t1 = props.spawnTree(x, 12, 1.05);
      const t2 = props.spawnTree(x, -12, 0.95);
      stageGroup.add(t1);
      stageGroup.add(t2);
    }

    // Trees clustered around suburban yards
    for (let col = 0; col < 6; col++) {
      const tree = props.spawnTree(-30 + col * 24, 82, 0.9);
      stageGroup.add(tree);
    }

    // 6. Vehicular Traffic Fleet
    const traffic = new TrafficModule();
    traffic.init(this.world, this.engine);
    this.submodules.traffic = traffic;

    // Traffic route 1: Downtown Loop
    const downtownLoop = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-70, 6.2, 0),
      new THREE.Vector3(0, 6.2, 0),
      new THREE.Vector3(70, 6.2, 0),
      new THREE.Vector3(70, 6.2, 65),
      new THREE.Vector3(0, 6.2, 65),
      new THREE.Vector3(-70, 6.2, 65),
      new THREE.Vector3(-70, 6.2, 0)
    ], true);

    // Traffic route 2: Bridge Arterial
    const bridgeRoute = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 6.2, 0),
      new THREE.Vector3(-80, 6.2, 0),
      new THREE.Vector3(-140, 14.2, 0),
      new THREE.Vector3(-240, 14.2, 0),
      new THREE.Vector3(-340, 6.2, 0),
      new THREE.Vector3(-240, 14.2, 2.5),
      new THREE.Vector3(-140, 14.2, 2.5),
      new THREE.Vector3(-80, 6.2, 2.5),
      new THREE.Vector3(0, 6.2, 2.5)
    ], true);

    for (let i = 0; i < 10; i++) {
      const v = traffic.spawnVehicle(downtownLoop, 14, i * 0.1, (i % 2 === 0 ? 2.5 : -2.5));
      stageGroup.add(v.mesh);
    }
    for (let i = 0; i < 8; i++) {
      const v = traffic.spawnVehicle(bridgeRoute, 18, i * 0.12, (i % 2 === 0 ? 2.5 : -2.5));
      stageGroup.add(v.mesh);
    }

    // 7. Mount UI HUD
    const ui = new UIModule();
    ui.init(this.world, this.engine);
    this.submodules.ui = ui;

    console.log('[DemoCityModule] "New Antigravity Bay" metropolis successfully constructed.');
  }

  buildSuspensionBridgeStructure() {
    const group = new THREE.Group();
    const concreteMat = this.engine.assets.getConcreteMaterial();
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x8291a1, metalness: 0.9, roughness: 0.25 });

    // Bridge Concrete Piers & Towers
    const towerGeo = new THREE.BoxGeometry(4.5, 60, 18);
    const tower1 = new THREE.Mesh(towerGeo, concreteMat);
    tower1.position.set(-160, 28, 0);
    tower1.castShadow = true;
    group.add(tower1);

    const tower2 = new THREE.Mesh(towerGeo, concreteMat);
    tower2.position.set(-260, 28, 0);
    tower2.castShadow = true;
    group.add(tower2);

    // Suspension cables
    for (const zOff of [-8.5, 8.5]) {
      const cableCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-80, 10, zOff),
        new THREE.Vector3(-160, 56, zOff),
        new THREE.Vector3(-210, 20, zOff),
        new THREE.Vector3(-260, 56, zOff),
        new THREE.Vector3(-340, 10, zOff)
      ]);
      const cableGeo = new THREE.TubeGeometry(cableCurve, 40, 0.32, 8, false);
      const cable = new THREE.Mesh(cableGeo, steelMat);
      cable.castShadow = true;
      group.add(cable);

      // Vertical suspender rods
      for (let x = -320; x <= -100; x += 16) {
        if (Math.abs(x - (-160)) < 6 || Math.abs(x - (-260)) < 6) continue;
        const rodGeo = new THREE.CylinderGeometry(0.08, 0.08, 30, 6);
        const rod = new THREE.Mesh(rodGeo, steelMat);
        rod.position.set(x, 24, zOff);
        group.add(rod);
      }
    }

    return group;
  }

  update(delta, simTick) {
    if (this.submodules.terrain) this.submodules.terrain.update(delta);
    if (this.submodules.traffic) this.submodules.traffic.update(delta);
    if (this.submodules.env) this.submodules.env.update(delta);
  }

  dispose() {
    for (const mod of Object.values(this.submodules)) {
      if (typeof mod.dispose === 'function') mod.dispose();
    }
  }
}

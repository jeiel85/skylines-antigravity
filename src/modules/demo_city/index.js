import * as THREE from 'three';
import { TerrainModule } from '../terrain/index.js';
import { EnvironmentModule } from '../environment/index.js';
import { RoadsModule } from '../roads/index.js';
import { BuildingsModule } from '../buildings/index.js';
import { PropsModule } from '../props/index.js';
import { TrafficModule } from '../traffic/index.js';
import { UIModule } from '../ui/index.js';

/**
 * AAA Master Benchmark Metropolis: "Gwangmyeong-si (광명특례시)"
 * Authentic digital twin benchmarking Gwangmyeong City, Gyeonggi-do:
 * 1. Topography: Anyangcheon (안양천), Dodeoksan (도덕산), Gureumsan (구름산), Gahaksan (가학산)
 * 2. Bridges: Cheolsan Bridge (철산교), Geumcheon Bridge (금천교), Dodeoksan Y-Suspension Bridge (도덕산 출렁다리)
 * 3. Architecture: K-Apartments (철산/하안 주공단지 동번호 아파트), KTX Gwangmyeong Station Mega-Terminal,
 *    Kia AutoLand Gwangmyeong (기아 오토랜드 소하리 공장), U-Planet Skyscrapers
 * 4. Transportation: Metropolitan buses, expressways, riverside promenades
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
    console.log('[DemoCityModule] Assembling "Gwangmyeong-si (광명시)" digital twin...');

    // 1. Terrain & Anyangcheon River
    const terrain = new TerrainModule();
    terrain.init(this.world, this.engine);
    const terrainMesh = terrain.generateTerrainMesh(900, 130);
    const waterMesh = terrain.generateWaterMesh(900);
    stageGroup.add(terrainMesh);
    stageGroup.add(waterMesh);
    this.submodules.terrain = terrain;

    // 2. Props Subsystem (Trees, Streetlamps)
    const props = new PropsModule();
    props.init(this.world, this.engine);
    this.submodules.props = props;

    // 3. Roads & Bridges Subsystem
    const roads = new RoadsModule();
    roads.init(this.world, this.engine);
    this.submodules.roads = roads;

    // --- Road 1: Anyangcheon-ro (안양천로, North-South riverside promenade) ---
    const anyangcheonRoad = roads.createRoadSegment([
      new THREE.Vector3(125, 5.8, -210),
      new THREE.Vector3(125, 5.8, -100),
      new THREE.Vector3(125, 5.8, 0),
      new THREE.Vector3(125, 5.8, 100),
      new THREE.Vector3(125, 5.8, 210)
    ], { width: 14, lanes: 4 });
    stageGroup.add(anyangcheonRoad);

    // --- Road 2: Cheolsan-ro (철산로, East-West arterial connecting to Seoul via Cheolsan Bridge) ---
    const cheolsanRoadWest = roads.createRoadSegment([
      new THREE.Vector3(-45, 6.5, -45),
      new THREE.Vector3(10, 6.2, -45),
      new THREE.Vector3(80, 6.0, -45),
      new THREE.Vector3(125, 6.0, -45)
    ], { width: 16, lanes: 4 });
    stageGroup.add(cheolsanRoadWest);

    // Cheolsan Bridge (철산교) spanning Anyangcheon to Seoul
    const cheolsanBridgeRoad = roads.createRoadSegment([
      new THREE.Vector3(125, 6.0, -45),
      new THREE.Vector3(205, 6.0, -45)
    ], { width: 16, lanes: 4, isBridge: true });
    stageGroup.add(cheolsanBridgeRoad);

    const cheolsanBridgeStructure = roads.createCheolsanBridgeStructure(
      new THREE.Vector3(125, 6.0, -45),
      new THREE.Vector3(205, 6.0, -45),
      16
    );
    stageGroup.add(cheolsanBridgeStructure);

    // --- Road 3: Haan-ro (하안로, East-West boulevard connecting via Geumcheon Bridge) ---
    const haanRoadWest = roads.createRoadSegment([
      new THREE.Vector3(-35, 6.5, 20),
      new THREE.Vector3(15, 6.2, 20),
      new THREE.Vector3(75, 6.0, 20),
      new THREE.Vector3(125, 6.0, 20)
    ], { width: 14, lanes: 4 });
    stageGroup.add(haanRoadWest);

    // Geumcheon Bridge (금천교) spanning Anyangcheon
    const geumcheonBridgeRoad = roads.createRoadSegment([
      new THREE.Vector3(125, 6.0, 20),
      new THREE.Vector3(200, 6.0, 20)
    ], { width: 14, lanes: 4, isBridge: true });
    stageGroup.add(geumcheonBridgeRoad);

    const geumcheonBridgeStructure = roads.createCheolsanBridgeStructure(
      new THREE.Vector3(125, 6.0, 20),
      new THREE.Vector3(200, 6.0, 20),
      14
    );
    stageGroup.add(geumcheonBridgeStructure);

    // --- Road 4: Central Boulevard (오리로/철산상업지구) ---
    const centralAvenue = roads.createRoadSegment([
      new THREE.Vector3(25, 6.5, -110),
      new THREE.Vector3(25, 6.2, -45),
      new THREE.Vector3(25, 6.2, 20),
      new THREE.Vector3(25, 6.0, 95)
    ], { width: 14, lanes: 4 });
    stageGroup.add(centralAvenue);

    // --- Road 5: KTX Gwangmyeong Station Transit Loop (일직동 역세권 대로) ---
    const ktxLoopRoad = roads.createRoadSegment([
      new THREE.Vector3(-15, 6.0, 95),
      new THREE.Vector3(65, 6.0, 95),
      new THREE.Vector3(65, 6.0, 200),
      new THREE.Vector3(-15, 6.0, 200),
      new THREE.Vector3(-15, 6.0, 95)
    ], { width: 14, lanes: 4 });
    stageGroup.add(ktxLoopRoad);

    // Intersections with crosswalks
    stageGroup.add(roads.createIntersection(new THREE.Vector3(25, 6.2, -45), 18));
    stageGroup.add(roads.createIntersection(new THREE.Vector3(25, 6.2, 20), 16));
    stageGroup.add(roads.createIntersection(new THREE.Vector3(125, 6.0, -45), 18));
    stageGroup.add(roads.createIntersection(new THREE.Vector3(125, 6.0, 20), 16));

    // --- Landmark 1: Dodeoksan Y-Shaped Suspension Bridge (도덕산 출렁다리) ---
    const dodeokHub = new THREE.Vector3(-25, 36.5, -145);
    const dodeokArm1 = new THREE.Vector3(-25, 41.5, -165);
    const dodeokArm2 = new THREE.Vector3(-10, 39.5, -135);
    const dodeokArm3 = new THREE.Vector3(-40, 39.5, -135);
    const dodeokYBridge = roads.createDodeoksanYBridge(dodeokHub, dodeokArm1, dodeokArm2, dodeokArm3);
    stageGroup.add(dodeokYBridge);

    // 4. Buildings & Korean Architecture
    const bld = new BuildingsModule();
    bld.init(this.world, this.engine);
    this.submodules.bld = bld;

    // --- Sector 1: Cheolsan-dong High-Rise K-Apartment Complex (철산주공 단지) ---
    // [North of Cheolsan-ro, z: -100..-55]
    const cheolsanApts = [
      { x: -15, z: -85, stories: 20, num: '101' },
      { x: 50,  z: -85, stories: 22, num: '102' },
      { x: 95,  z: -85, stories: 18, num: '103' },
      { x: -15, z: -60, stories: 24, num: '104' },
      { x: 50,  z: -60, stories: 20, num: '105' },
      { x: 95,  z: -60, stories: 22, num: '106' }
    ];
    for (const apt of cheolsanApts) {
      stageGroup.add(bld.createKoreanApartmentBlock(apt.x, apt.z, apt.stories, 56, 14, 0, apt.num));
    }

    // --- Sector 2: Haan-dong High-Rise K-Apartment Complex (하안주공 단지) ---
    // [Between Cheolsan-ro and Haan-ro, z: -25..10]
    const haanApts = [
      { x: -10, z: -15, stories: 20, num: '201' },
      { x: 55,  z: -15, stories: 22, num: '202' },
      { x: 95,  z: -15, stories: 24, num: '203' },
      { x: -10, z: 5,   stories: 18, num: '204' },
      { x: 55,  z: 5,   stories: 20, num: '205' },
      { x: 95,  z: 5,   stories: 22, num: '206' }
    ];
    for (const apt of haanApts) {
      stageGroup.add(bld.createKoreanApartmentBlock(apt.x, apt.z, apt.stories, 54, 14, 0, apt.num));
    }

    // --- Sector 3: Iljik-dong KTX Gwangmyeong Station Hub (KTX 광명역세권) ---
    // Landmark 2: Monumental KTX Gwangmyeong Station Arched Terminal (z: 145)
    const ktxStation = bld.createKTXStationTerminal(15, 145, 125, 50, 24, 0);
    stageGroup.add(ktxStation);

    // Surrounding High-Rise Commercial & Hotel Towers (U-Planet / Avanshil)
    stageGroup.add(bld.createSkyscraper(-35, 125, 140, 'cyan'));     // U-Planet Office Tower
    stageGroup.add(bld.createSkyscraper(-35, 165, 120, 'blue'));     // Take Hotel Tower
    stageGroup.add(bld.createSkyscraper(85, 125, 128, 'emerald'));   // Gwangmyeong Tech Complex
    stageGroup.add(bld.createSkyscraper(85, 165, 105, 'bronze'));    // Commercial Plaza

    // --- Sector 4: Soha-dong Kia AutoLand Gwangmyeong (기아 오토랜드 소하리 공장) ---
    // [z: 50..85, x: 55..105]
    const kiaPlant1 = bld.createKiaIndustrialPlant(75, 55, 75, 42, 14, 0);
    stageGroup.add(kiaPlant1);

    // --- Sector 5: Gwangmyeong-dong Low-Rise Villa Neighborhood ---
    // [z: -100..-60, x: -55..-25]
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        const hx = -65 + c * 10;
        const hz = -105 + r * 16;
        stageGroup.add(bld.createSuburbanHouse(hx, hz, 1.0));
      }
    }

    // 5. Urban Props (Trees, Street Furniture, Streetlamps)
    // Anyangcheon Riverside Promenade Trees (Cherry blossoms / Zelkova)
    for (let z = -200; z <= 200; z += 20) {
      props.spawnTree(117, z, 1.1);
      props.spawnTree(133, z, 1.1);
      props.spawnStreetlamp(121, z, 0);
    }

    // Cheolsan & Haan Avenue Streetlamps & Trees
    for (let x = -30; x <= 110; x += 25) {
      props.spawnStreetlamp(x, -50, Math.PI * 0.5);
      props.spawnStreetlamp(x, 25, Math.PI * 0.5);
      props.spawnTree(x, -40, 0.95);
      props.spawnTree(x, 15, 0.95);
    }

    // Dodeoksan & Gureumsan Forest Trees
    const mountainTrees = [
      { x: -35, z: -155 }, { x: -20, z: -160 }, { x: -45, z: -175 }, { x: -15, z: -145 },
      { x: -50, z: 10 }, { x: -65, z: 30 }, { x: -40, z: 45 }, { x: -60, z: -5 }
    ];
    for (const pt of mountainTrees) {
      props.spawnTree(pt.x, pt.z, 1.35);
    }

    // 6. Traffic Simulation (Korean Green/Blue Transit Buses & Sedans)
    const traffic = new TrafficModule();
    traffic.init(this.world, this.engine);
    this.submodules.traffic = traffic;

    // Bus Route 1: Cheolsan-ro across Cheolsan Bridge into Seoul
    const cheolsanBridgeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-45, 6.6, -45),
      new THREE.Vector3(25, 6.3, -45),
      new THREE.Vector3(125, 6.1, -45),
      new THREE.Vector3(205, 6.1, -45)
    ]);
    traffic.spawnVehicle(cheolsanBridgeCurve, 15.0, 0.25, 2.2, true);  // Green Branch Bus
    traffic.spawnVehicle(cheolsanBridgeCurve, 16.5, 0.65, -2.2, false); // Sedan

    // Bus Route 2: Anyangcheon-ro North-South Line
    const anyangcheonCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(125, 5.9, -200),
      new THREE.Vector3(125, 5.9, 0),
      new THREE.Vector3(125, 5.9, 200)
    ]);
    traffic.spawnVehicle(anyangcheonCurve, 16.0, 0.15, 2.2, true);   // Blue Trunk Bus
    traffic.spawnVehicle(anyangcheonCurve, 18.0, 0.55, -2.2, false); // Sedan

    // Bus Route 3: KTX Gwangmyeong Station Transit Loop
    const ktxLoopCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-15, 6.1, 95),
      new THREE.Vector3(65, 6.1, 95),
      new THREE.Vector3(65, 6.1, 200),
      new THREE.Vector3(-15, 6.1, 200),
      new THREE.Vector3(-15, 6.1, 95)
    ], true);
    traffic.spawnVehicle(ktxLoopCurve, 14.0, 0.05, 2.0, true);  // Red Express Bus
    traffic.spawnVehicle(ktxLoopCurve, 15.0, 0.45, -2.0, false); // Sedan
    traffic.spawnVehicle(ktxLoopCurve, 14.5, 0.75, 2.0, false); // SUV

    console.log('[DemoCityModule] "Gwangmyeong-si" digital twin successfully assembled.');
  }

  update(delta) {
    for (const key in this.submodules) {
      if (typeof this.submodules[key].update === 'function') {
        this.submodules[key].update(delta);
      }
    }
  }

  dispose() {
    for (const key in this.submodules) {
      if (typeof this.submodules[key].dispose === 'function') {
        this.submodules[key].dispose();
      }
    }
    while (this.cityGroup.children.length > 0) {
      const obj = this.cityGroup.children[0];
      this.cityGroup.remove(obj);
    }
  }
}

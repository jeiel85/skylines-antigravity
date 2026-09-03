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
 * 1:1 Geographic and administrative map alignment of Gwangmyeong City, Gyeonggi-do:
 * 1. Hydrology: Anyangcheon (안양천) on East + Mokgamcheon (목감천) on NW
 * 2. 4 Mountains: Dodeoksan (도덕산), Gureumsan (구름산), Gahaksan (가학산), Seodoksan (서독산)
 * 3. 5 Anyangcheon Cross-River Bridges: 광명교, 철산교, 금천교, 시흥대교, 기아대교
 * 4. Spinal Arteries: 오리로 (Ori-ro) Central N-S Spine + 광명로, 철산로, 범안로, 기아로, 일직로
 * 5. District Landmarks:
 *    - 광명동: 빌라촌 & 광명전통시장
 *    - 도덕산: Y자형 출렁다리 (Dodeoksan Y-Bridge)
 *    - 철산동: 철산역 상업지구 & 철산주공 아파트 단지 (101~106)
 *    - 하안동: 하안주공 아파트 대단지 (201~206, 301~302)
 *    - 소하동: 기아 오토랜드 광명공장 (소하리 공장)
 *    - 가학산: 광명동굴 (Gwangmyeong Cave)
 *    - 일직동: KTX 광명역사, 이케아(IKEA) 광명점, 코스트코(Costco) 광명점, 유플래닛 초고층군
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
    console.log('[DemoCityModule] Assembling authentic "Gwangmyeong-si (광명시)" digital twin...');

    // 1. Terrain & Water (Anyangcheon & Mokgamcheon)
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

    // --- Main Central Spine: 오리로 (Ori-ro, N-S Spine from Gwangmyeong to KTX Iljik) ---
    const oriRo = roads.createRoadSegment([
      new THREE.Vector3(15, 6.5, -230),
      new THREE.Vector3(15, 6.3, -180), // Gwangmyeong-ro junction
      new THREE.Vector3(18, 6.2, -65),  // Cheolsan-ro junction
      new THREE.Vector3(18, 6.1, 15),   // Beoman-ro / Haan junction
      new THREE.Vector3(20, 6.0, 95),   // Kia-ro / Soha junction
      new THREE.Vector3(20, 6.0, 175),  // KTX Station plaza
      new THREE.Vector3(20, 6.0, 230)
    ], { width: 16, lanes: 4 });
    stageGroup.add(oriRo);

    // --- Eastern Riverside Drive: 안양천로 (Anyangcheon-ro) ---
    const anyangcheonRo = roads.createRoadSegment([
      new THREE.Vector3(125, 5.8, -230),
      new THREE.Vector3(125, 5.8, -180),
      new THREE.Vector3(125, 5.8, -65),
      new THREE.Vector3(125, 5.8, 15),
      new THREE.Vector3(125, 5.8, 95),
      new THREE.Vector3(125, 5.8, 145),
      new THREE.Vector3(125, 5.8, 230)
    ], { width: 14, lanes: 4 });
    stageGroup.add(anyangcheonRo);

    // --- 5 Cross-River Bridges across Anyangcheon in Authentic North-to-South Order ---
    // Bridge 1: 광명교 (Gwangmyeong Bridge, z = -180) -> Connects Gwangmyeong-ro to Guro-gu
    const gwangmyeongRo = roads.createRoadSegment([
      new THREE.Vector3(-65, 6.6, -180),
      new THREE.Vector3(15, 6.3, -180),
      new THREE.Vector3(125, 6.0, -180)
    ], { width: 14, lanes: 4 });
    stageGroup.add(gwangmyeongRo);
    stageGroup.add(roads.createRoadSegment([new THREE.Vector3(125, 6.0, -180), new THREE.Vector3(205, 6.0, -180)], { width: 14, lanes: 4, isBridge: true }));
    stageGroup.add(roads.createCheolsanBridgeStructure(new THREE.Vector3(125, 6.0, -180), new THREE.Vector3(205, 6.0, -180), 14));

    // Bridge 2: 철산교 (Cheolsan Bridge, z = -65) -> Connects Cheolsan-ro to Gasan Digital Complex
    const cheolsanRo = roads.createRoadSegment([
      new THREE.Vector3(-45, 6.5, -65),
      new THREE.Vector3(18, 6.2, -65),
      new THREE.Vector3(125, 6.0, -65)
    ], { width: 16, lanes: 4 });
    stageGroup.add(cheolsanRo);
    stageGroup.add(roads.createRoadSegment([new THREE.Vector3(125, 6.0, -65), new THREE.Vector3(205, 6.0, -65)], { width: 16, lanes: 4, isBridge: true }));
    stageGroup.add(roads.createCheolsanBridgeStructure(new THREE.Vector3(125, 6.0, -65), new THREE.Vector3(205, 6.0, -65), 16));

    // Bridge 3: 금천교 (Geumcheon Bridge, z = 15) -> Connects Beoman-ro to Doksan-dong
    const beomanRo = roads.createRoadSegment([
      new THREE.Vector3(-35, 6.4, 15),
      new THREE.Vector3(18, 6.1, 15),
      new THREE.Vector3(125, 6.0, 15)
    ], { width: 14, lanes: 4 });
    stageGroup.add(beomanRo);
    stageGroup.add(roads.createRoadSegment([new THREE.Vector3(125, 6.0, 15), new THREE.Vector3(205, 6.0, 15)], { width: 14, lanes: 4, isBridge: true }));
    stageGroup.add(roads.createCheolsanBridgeStructure(new THREE.Vector3(125, 6.0, 15), new THREE.Vector3(205, 6.0, 15), 14));

    // Bridge 4: 시흥대교 (Siheung Bridge, z = 95) -> Connects Kia-ro to Siheung-dong
    const kiaRo = roads.createRoadSegment([
      new THREE.Vector3(-25, 6.2, 95),
      new THREE.Vector3(20, 6.0, 95),
      new THREE.Vector3(125, 6.0, 95)
    ], { width: 14, lanes: 4 });
    stageGroup.add(kiaRo);
    stageGroup.add(roads.createRoadSegment([new THREE.Vector3(125, 6.0, 95), new THREE.Vector3(205, 6.0, 95)], { width: 14, lanes: 4, isBridge: true }));
    stageGroup.add(roads.createCheolsanBridgeStructure(new THREE.Vector3(125, 6.0, 95), new THREE.Vector3(205, 6.0, 95), 14));

    // Bridge 5: 기아대교 (Kia Bridge, z = 145) -> Connects Soha / Kia plant south gate
    stageGroup.add(roads.createRoadSegment([new THREE.Vector3(125, 6.0, 145), new THREE.Vector3(205, 6.0, 145)], { width: 12, lanes: 2, isBridge: true }));
    stageGroup.add(roads.createCheolsanBridgeStructure(new THREE.Vector3(125, 6.0, 145), new THREE.Vector3(205, 6.0, 145), 12));

    // --- KTX Station Transit Boulevard (일직로 / 덕안로) ---
    const iljikRo = roads.createRoadSegment([
      new THREE.Vector3(-45, 6.0, 175),
      new THREE.Vector3(20, 6.0, 175),
      new THREE.Vector3(85, 6.0, 175)
    ], { width: 16, lanes: 4 });
    stageGroup.add(iljikRo);

    // Major Crossroad Intersections with Zebra Crossings
    stageGroup.add(roads.createIntersection(new THREE.Vector3(15, 6.3, -180), 16));
    stageGroup.add(roads.createIntersection(new THREE.Vector3(18, 6.2, -65), 18));
    stageGroup.add(roads.createIntersection(new THREE.Vector3(18, 6.1, 15), 16));
    stageGroup.add(roads.createIntersection(new THREE.Vector3(20, 6.0, 95), 16));
    stageGroup.add(roads.createIntersection(new THREE.Vector3(20, 6.0, 175), 18));

    // --- Landmark: 도덕산 Y자형 출렁다리 (Dodeoksan Y-Bridge) ---
    const dodeokHub = new THREE.Vector3(-25, 36.5, -145);
    const dodeokArm1 = new THREE.Vector3(-25, 41.5, -165);
    const dodeokArm2 = new THREE.Vector3(-10, 39.5, -135);
    const dodeokArm3 = new THREE.Vector3(-40, 39.5, -135);
    const dodeokYBridge = roads.createDodeoksanYBridge(dodeokHub, dodeokArm1, dodeokArm2, dodeokArm3);
    stageGroup.add(dodeokYBridge);

    // 4. Buildings & District Architectural Landmarks
    const bld = new BuildingsModule();
    bld.init(this.world, this.engine);
    this.submodules.bld = bld;

    // --- District 1: 광명동 (North-West) - 저층 주거지 & 광명전통시장 ---
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        const hx = -65 + c * 10;
        const hz = -215 + r * 15;
        stageGroup.add(bld.createSuburbanHouse(hx, hz, 1.0));
      }
    }

    // --- District 2: 철산동 (North-East) - 철산주공 아파트 단지 (101~106) & 철산역 상업지구 ---
    const cheolsanApts = [
      { x: -15, z: -105, stories: 20, num: '101' },
      { x: 50,  z: -105, stories: 22, num: '102' },
      { x: 95,  z: -105, stories: 18, num: '103' },
      { x: -15, z: -80,  stories: 24, num: '104' },
      { x: 50,  z: -80,  stories: 20, num: '105' },
      { x: 95,  z: -80,  stories: 22, num: '106' }
    ];
    for (const apt of cheolsanApts) {
      stageGroup.add(bld.createKoreanApartmentBlock(apt.x, apt.z, apt.stories, 56, 14, 0, apt.num));
    }
    // Cheolsan Commercial Core (철산역 상가 빌딩군)
    stageGroup.add(bld.createSkyscraper(50, -45, 65, 'cyan'));
    stageGroup.add(bld.createSkyscraper(85, -45, 75, 'blue'));

    // --- District 3: 하안동 (Central-East) - 하안주공 아파트 대단지 (201~206, 301~302) ---
    const haanApts = [
      { x: -10, z: -25, stories: 20, num: '201' },
      { x: 55,  z: -25, stories: 22, num: '202' },
      { x: 95,  z: -25, stories: 24, num: '203' },
      { x: -10, z: -5,  stories: 18, num: '204' },
      { x: 55,  z: -5,  stories: 20, num: '205' },
      { x: 95,  z: -5,  stories: 22, num: '206' },
      { x: 55,  z: 35,  stories: 20, num: '301' },
      { x: 95,  z: 35,  stories: 22, num: '302' }
    ];
    for (const apt of haanApts) {
      stageGroup.add(bld.createKoreanApartmentBlock(apt.x, apt.z, apt.stories, 54, 14, 0, apt.num));
    }

    // --- District 4: 소하동 (South-Central) - 기아 오토랜드 광명공장 (소하리 공장) ---
    const kiaPlant1 = bld.createKiaIndustrialPlant(75, 95, 85, 45, 14, 0);
    stageGroup.add(kiaPlant1);

    // --- Landmark: 가학산 광명동굴 (Gwangmyeong Cave Entrance) ---
    const caveEntrance = bld.createGwangmyeongCaveEntrance(-25, 145, Math.PI * 0.5);
    stageGroup.add(caveEntrance);

    // --- District 5: 일직동 (South) - KTX 광명역세권 메가터미널, 이케아, 코스트코, 유플래닛 ---
    // 1. KTX 광명역사 Mega-Terminal (Central transit anchor)
    const ktxStation = bld.createKTXStationTerminal(15, 175, 125, 52, 24, 0);
    stageGroup.add(ktxStation);

    // 2. IKEA Gwangmyeong Store (이케아 광명점)
    const ikeaStore = bld.createIKEAStore(-45, 175, 80, 45, 18, 0);
    stageGroup.add(ikeaStore);

    // 3. Costco Gwangmyeong Wholesale (코스트코 광명점)
    const costcoStore = bld.createCostcoStore(-45, 215, 68, 42, 14, 0);
    stageGroup.add(costcoStore);

    // 4. U-Planet & Avanshil Skyscraper Towers (유플래닛 어반브릭스 40층 복합타워)
    stageGroup.add(bld.createSkyscraper(65, 160, 145, 'cyan'));   // U-Planet Office Tower
    stageGroup.add(bld.createSkyscraper(65, 195, 120, 'blue'));   // Take Hotel Tower
    stageGroup.add(bld.createSkyscraper(95, 175, 110, 'emerald'));// Gwangmyeong Tech Complex

    // 5. Urban Props (Trees, Streetlamps, Mountain Pine Foliage)
    // Anyangcheon Riverside Promenade Trees & Streetlamps
    for (let z = -220; z <= 220; z += 20) {
      props.spawnTree(117, z, 1.1);
      props.spawnTree(133, z, 1.1);
      props.spawnStreetlamp(121, z, 0);
    }

    // Ori-ro Central Spine Streetlamps & Trees
    for (let z = -210; z <= 210; z += 28) {
      props.spawnStreetlamp(12, z, Math.PI * 0.5);
      props.spawnTree(18, z + 12, 1.0);
    }

    // Dodeoksan, Gureumsan, Gahaksan Forest Trees
    const mountainPineSpots = [
      { x: -35, z: -155 }, { x: -20, z: -160 }, { x: -45, z: -175 }, { x: -15, z: -145 },
      { x: -50, z: 5 }, { x: -65, z: 25 }, { x: -40, z: 40 }, { x: -60, z: -15 },
      { x: -65, z: 130 }, { x: -75, z: 155 }, { x: -30, z: 225 }, { x: -20, z: 240 }
    ];
    for (const pt of mountainPineSpots) {
      props.spawnTree(pt.x, pt.z, 1.35);
    }

    // 6. Metropolitan Traffic Fleet (Korean Transit Buses & Cars)
    const traffic = new TrafficModule();
    traffic.init(this.world, this.engine);
    this.submodules.traffic = traffic;

    // Bus Route 1: Cheolsan-ro across Cheolsan Bridge into Seoul
    const cheolsanBridgeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-45, 6.5, -65),
      new THREE.Vector3(18, 6.2, -65),
      new THREE.Vector3(125, 6.0, -65),
      new THREE.Vector3(205, 6.0, -65)
    ]);
    traffic.spawnVehicle(cheolsanBridgeCurve, 15.0, 0.25, 2.2, true);  // Green Branch Bus
    traffic.spawnVehicle(cheolsanBridgeCurve, 16.5, 0.65, -2.2, false); // Sedan

    // Bus Route 2: Ori-ro Central Spine
    const oriRoCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(15, 6.5, -210),
      new THREE.Vector3(18, 6.2, -65),
      new THREE.Vector3(18, 6.1, 15),
      new THREE.Vector3(20, 6.0, 175)
    ]);
    traffic.spawnVehicle(oriRoCurve, 15.5, 0.15, 2.2, true);   // Blue Trunk Bus
    traffic.spawnVehicle(oriRoCurve, 17.0, 0.55, -2.2, false); // Sedan

    // Bus Route 3: KTX Gwangmyeong Station Transit Loop
    const ktxLoopCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-45, 6.0, 175),
      new THREE.Vector3(20, 6.0, 175),
      new THREE.Vector3(85, 6.0, 175),
      new THREE.Vector3(85, 6.0, 220),
      new THREE.Vector3(-45, 6.0, 220),
      new THREE.Vector3(-45, 6.0, 175)
    ], true);
    traffic.spawnVehicle(ktxLoopCurve, 14.0, 0.05, 2.0, true);  // Red Express Bus
    traffic.spawnVehicle(ktxLoopCurve, 15.0, 0.45, -2.0, false); // Sedan
    traffic.spawnVehicle(ktxLoopCurve, 14.5, 0.75, 2.0, false); // SUV

    console.log('[DemoCityModule] "Gwangmyeong-si" authentic map digital twin successfully assembled.');
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

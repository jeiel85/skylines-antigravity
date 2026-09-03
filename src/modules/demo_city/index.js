import * as THREE from 'three';
import { TerrainModule } from '../terrain/index.js';
import { EnvironmentModule } from '../environment/index.js';
import { RoadsModule } from '../roads/index.js';
import { BuildingsModule } from '../buildings/index.js';
import { PropsModule } from '../props/index.js';
import { TrafficModule } from '../traffic/index.js';
import { UIModule } from '../ui/index.js';

export const GWANGMYEONG_HISTORICAL_MILESTONES = [
  { year: 1970, title: '자연 녹지 및 광명 취락', desc: '안양천과 목감천, 4대 산맥을 중심으로 농경지와 광명동 저층 취락이 형성된 평화로운 시기' },
  { year: 1973, title: '기아자동차 소하리 공장 & 광명교 준공', desc: '대한민국 최초의 종합 자동차 완성차 공장이 소하동에 들어서며 산업도시의 서막 개막' },
  { year: 1977, title: '안양천 횡단 철산교 개통', desc: '광명과 서울 구로공단(현 가산디지털단지)을 연결하는 핵심 교량 개통' },
  { year: 1980, title: '시흥대교 개통', desc: '소하동과 서울 시흥동을 연결하는 물류 교량 구축' },
  { year: 1985, title: '철산주공 아파트 대단지 준공', desc: '철산동에 18~24층 대규모 판상형 주공아파트 단지(101~106동) 완공' },
  { year: 1989, title: '하안주공 아파트 대단지 & 금천교 개통', desc: '하안택지개발지구 주공 1~12단지 완공 및 서울 독산동 연결 금천교 개통' },
  { year: 1990, title: '기아대교 개통', desc: '소하리 기아공장 남단 물류 수송 교량 준공' },
  { year: 2004, title: '경부고속철도 개통 & KTX 광명역사 개역', desc: '4월 1일 고속철도 개통! 웅장한 아치형 KTX 광명역 메가터미널 탄생' },
  { year: 2012, title: '코스트코 광명점 개점', desc: '일직동 KTX 역세권에 대형 창고형 유통 매장 유치' },
  { year: 2014, title: '이케아(IKEA) 광명점 개점 (한국 1호점)', desc: '12월 18일 대한민국 최초의 글로벌 홈퍼니싱 이케아 플래그십 스토어 개점' },
  { year: 2015, title: '폐광산의 기적, 광명동굴 테마파크 정식 개관', desc: '일제강점기 폐광산을 세계적인 동굴 문화예술 관광지로 탈바꿈' },
  { year: 2021, title: '일직동 유플래닛(U-Planet) 40층 복합타워 준공', desc: '미디어아트 테이크호텔, AK플라자, 초고층 유리 오피스 스카이라인 완성' },
  { year: 2022, title: '도덕산 인공폭포 Y자형 출렁다리 개통', desc: '8월 27일 도덕산 폭포 협곡을 가로지르는 수도권 최초의 삼각 현수교 개통' }
];

/**
 * AAA Master Benchmark Metropolis: "Gwangmyeong-si (광명특례시)"
 * With Dynamic Historical Time Machine (1970 - 2026) and Milestone Timeline Synchronization.
 */
export class DemoCityModule {
  constructor() {
    this.world = null;
    this.engine = null;
    this.cityGroup = new THREE.Group();
    this.submodules = {};
    this.timelineEntities = [];
    this.currentHistoricalYear = 2026;
  }

  init(world, engine) {
    this.world = world;
    this.engine = engine;
    this.engine.scene.add(this.cityGroup);

    if (this.world && this.world.eventBus) {
      this.world.eventBus.on('timeMachine:setYear', (data) => {
        this.setHistoricalYear(data.year);
      });
      this.world.eventBus.on('weather:set', (data) => {
        if (this.submodules.environment) {
          this.submodules.environment.setWeather(data.weather);
        }
      });
    }
  }

  registerTimelineObject(obj, year, name) {
    obj.userData.completionYear = year;
    obj.userData.landmarkName = name;
    this.timelineEntities.push(obj);
    obj.visible = (this.currentHistoricalYear >= year);
    return obj;
  }

  setHistoricalYear(year) {
    this.currentHistoricalYear = year;
    let visibleCount = 0;
    let hiddenCount = 0;

    for (const obj of this.timelineEntities) {
      const isCompleted = (year >= obj.userData.completionYear);
      obj.visible = isCompleted;
      if (isCompleted) visibleCount++;
      else hiddenCount++;
    }

    // Find closest milestone
    let activeMilestone = GWANGMYEONG_HISTORICAL_MILESTONES[0];
    for (const m of GWANGMYEONG_HISTORICAL_MILESTONES) {
      if (year >= m.year) activeMilestone = m;
    }

    if (this.world && this.world.eventBus) {
      this.world.eventBus.emit('timeMachine:yearChanged', {
        year,
        milestone: activeMilestone,
        visibleCount,
        hiddenCount
      });
    }

    return activeMilestone;
  }

  showcase(stageGroup, options = {}) {
    console.log('[DemoCityModule] Assembling "Gwangmyeong-si" with Time Machine...');

    // 1. Terrain & Hydrology (Natural baseline - always exists)
    const terrain = new TerrainModule();
    terrain.init(this.world, this.engine);
    const terrainMesh = terrain.generateTerrainMesh(900, 130);
    const waterMesh = terrain.generateWaterMesh(900);
    stageGroup.add(terrainMesh);
    stageGroup.add(waterMesh);
    this.submodules.terrain = terrain;

    // 1.1 Dynamic Weather Environment (Clear, Rain, Snow, Fog)
    const env = new EnvironmentModule();
    env.init(this.world, this.engine);
    this.submodules.environment = env;
    this.engine.registerModule('environment', env);

    // 2. Props Subsystem (Trees, Streetlamps)
    const props = new PropsModule();
    props.init(this.world, this.engine);
    this.submodules.props = props;

    // 3. Roads & Bridges Subsystem
    const roads = new RoadsModule();
    roads.init(this.world, this.engine);
    this.submodules.roads = roads;

    // --- Main Central Spine: 오리로 (Ori-ro) ---
    const oriRo = roads.createRoadSegment([
      new THREE.Vector3(15, 6.5, -230),
      new THREE.Vector3(15, 6.3, -180),
      new THREE.Vector3(18, 6.2, -65),
      new THREE.Vector3(18, 6.1, 15),
      new THREE.Vector3(20, 6.0, 95),
      new THREE.Vector3(20, 6.0, 175),
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

    // --- 5 Cross-River Bridges with Real Historical Completion Dates ---
    // Bridge 1: 광명교 (1973년 준공)
    const gwangmyeongRo = roads.createRoadSegment([new THREE.Vector3(-65, 6.6, -180), new THREE.Vector3(15, 6.3, -180), new THREE.Vector3(125, 6.0, -180)], { width: 14, lanes: 4 });
    const gwangmyeongDeck = roads.createRoadSegment([new THREE.Vector3(125, 6.0, -180), new THREE.Vector3(205, 6.0, -180)], { width: 14, lanes: 4, isBridge: true });
    const gwangmyeongPiers = roads.createCheolsanBridgeStructure(new THREE.Vector3(125, 6.0, -180), new THREE.Vector3(205, 6.0, -180), 14);
    const gwangmyeongBrGroup = new THREE.Group();
    gwangmyeongBrGroup.add(gwangmyeongRo, gwangmyeongDeck, gwangmyeongPiers);
    stageGroup.add(this.registerTimelineObject(gwangmyeongBrGroup, 1973, '광명교 & 광명로'));

    // Bridge 2: 철산교 (1977년 준공)
    const cheolsanRo = roads.createRoadSegment([new THREE.Vector3(-45, 6.5, -65), new THREE.Vector3(18, 6.2, -65), new THREE.Vector3(125, 6.0, -65)], { width: 16, lanes: 4 });
    const cheolsanDeck = roads.createRoadSegment([new THREE.Vector3(125, 6.0, -65), new THREE.Vector3(205, 6.0, -65)], { width: 16, lanes: 4, isBridge: true });
    const cheolsanPiers = roads.createCheolsanBridgeStructure(new THREE.Vector3(125, 6.0, -65), new THREE.Vector3(205, 6.0, -65), 16);
    const cheolsanBrGroup = new THREE.Group();
    cheolsanBrGroup.add(cheolsanRo, cheolsanDeck, cheolsanPiers);
    stageGroup.add(this.registerTimelineObject(cheolsanBrGroup, 1977, '철산교 & 철산로'));

    // Bridge 3: 시흥대교 (1980년 준공)
    const kiaRo = roads.createRoadSegment([new THREE.Vector3(-25, 6.2, 95), new THREE.Vector3(20, 6.0, 95), new THREE.Vector3(125, 6.0, 95)], { width: 14, lanes: 4 });
    const siheungDeck = roads.createRoadSegment([new THREE.Vector3(125, 6.0, 95), new THREE.Vector3(205, 6.0, 95)], { width: 14, lanes: 4, isBridge: true });
    const siheungPiers = roads.createCheolsanBridgeStructure(new THREE.Vector3(125, 6.0, 95), new THREE.Vector3(205, 6.0, 95), 14);
    const siheungBrGroup = new THREE.Group();
    siheungBrGroup.add(kiaRo, siheungDeck, siheungPiers);
    stageGroup.add(this.registerTimelineObject(siheungBrGroup, 1980, '시흥대교 & 기아로'));

    // Bridge 4: 금천교 & 범안로 (1989년 준공)
    const beomanRo = roads.createRoadSegment([new THREE.Vector3(-35, 6.4, 15), new THREE.Vector3(18, 6.1, 15), new THREE.Vector3(125, 6.0, 15)], { width: 14, lanes: 4 });
    const geumcheonDeck = roads.createRoadSegment([new THREE.Vector3(125, 6.0, 15), new THREE.Vector3(205, 6.0, 15)], { width: 14, lanes: 4, isBridge: true });
    const geumcheonPiers = roads.createCheolsanBridgeStructure(new THREE.Vector3(125, 6.0, 15), new THREE.Vector3(205, 6.0, 15), 14);
    const geumcheonBrGroup = new THREE.Group();
    geumcheonBrGroup.add(beomanRo, geumcheonDeck, geumcheonPiers);
    stageGroup.add(this.registerTimelineObject(geumcheonBrGroup, 1989, '금천교 & 범안로'));

    // Bridge 5: 기아대교 (1990년 준공)
    const kiaBrDeck = roads.createRoadSegment([new THREE.Vector3(125, 6.0, 145), new THREE.Vector3(205, 6.0, 145)], { width: 12, lanes: 2, isBridge: true });
    const kiaBrPiers = roads.createCheolsanBridgeStructure(new THREE.Vector3(125, 6.0, 145), new THREE.Vector3(205, 6.0, 145), 12);
    const kiaBrGroup = new THREE.Group();
    kiaBrGroup.add(kiaBrDeck, kiaBrPiers);
    stageGroup.add(this.registerTimelineObject(kiaBrGroup, 1990, '기아대교'));

    // KTX Station Transit Boulevard (2004년 준공)
    const iljikRo = roads.createRoadSegment([new THREE.Vector3(-45, 6.0, 175), new THREE.Vector3(20, 6.0, 175), new THREE.Vector3(85, 6.0, 175)], { width: 16, lanes: 4 });
    stageGroup.add(this.registerTimelineObject(iljikRo, 2004, '일직동 역세권 대로'));

    // Intersections
    stageGroup.add(roads.createIntersection(new THREE.Vector3(15, 6.3, -180), 16));
    stageGroup.add(roads.createIntersection(new THREE.Vector3(18, 6.2, -65), 18));
    stageGroup.add(roads.createIntersection(new THREE.Vector3(18, 6.1, 15), 16));
    stageGroup.add(roads.createIntersection(new THREE.Vector3(20, 6.0, 95), 16));
    stageGroup.add(roads.createIntersection(new THREE.Vector3(20, 6.0, 175), 18));

    // Landmark: 도덕산 Y자형 출렁다리 (2022년 개통)
    const dodeokHub = new THREE.Vector3(-25, 36.5, -145);
    const dodeokArm1 = new THREE.Vector3(-25, 41.5, -165);
    const dodeokArm2 = new THREE.Vector3(-10, 39.5, -135);
    const dodeokArm3 = new THREE.Vector3(-40, 39.5, -135);
    const dodeokYBridge = roads.createDodeoksanYBridge(dodeokHub, dodeokArm1, dodeokArm2, dodeokArm3);
    stageGroup.add(this.registerTimelineObject(dodeokYBridge, 2022, '도덕산 Y자형 출렁다리'));

    // 4. Buildings & District Architectural Landmarks with Historical Completion Dates
    const bld = new BuildingsModule();
    bld.init(this.world, this.engine);
    this.submodules.bld = bld;

    // --- District 1: 광명동 (1970년대 이전 취락) ---
    const gwangmyeongHouses = new THREE.Group();
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        const hx = -65 + c * 10;
        const hz = -215 + r * 15;
        gwangmyeongHouses.add(bld.createSuburbanHouse(hx, hz, 1.0));
      }
    }
    stageGroup.add(this.registerTimelineObject(gwangmyeongHouses, 1970, '광명동 주택지'));

    // --- District 2: 소하동 기아 오토랜드 광명공장 (1973년 준공) ---
    const kiaPlant = bld.createKiaIndustrialPlant(75, 95, 85, 45, 14, 0);
    stageGroup.add(this.registerTimelineObject(kiaPlant, 1973, '기아 오토랜드 소하리 공장'));

    // --- District 3: 철산동 철산주공 아파트 단지 (1985년 준공) ---
    const cheolsanAptGroup = new THREE.Group();
    const cheolsanApts = [
      { x: -15, z: -105, stories: 20, num: '101' },
      { x: 50,  z: -105, stories: 22, num: '102' },
      { x: 95,  z: -105, stories: 18, num: '103' },
      { x: -15, z: -80,  stories: 24, num: '104' },
      { x: 50,  z: -80,  stories: 20, num: '105' },
      { x: 95,  z: -80,  stories: 22, num: '106' }
    ];
    for (const apt of cheolsanApts) {
      cheolsanAptGroup.add(bld.createKoreanApartmentBlock(apt.x, apt.z, apt.stories, 56, 14, 0, apt.num));
    }
    // 철산역 상업지구 상가
    cheolsanAptGroup.add(bld.createSkyscraper(50, -45, 65, 'cyan'));
    cheolsanAptGroup.add(bld.createSkyscraper(85, -45, 75, 'blue'));
    stageGroup.add(this.registerTimelineObject(cheolsanAptGroup, 1985, '철산주공 아파트 단지'));

    // --- District 4: 하안동 하안주공 아파트 대단지 (1989년 준공) ---
    const haanAptGroup = new THREE.Group();
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
      haanAptGroup.add(bld.createKoreanApartmentBlock(apt.x, apt.z, apt.stories, 54, 14, 0, apt.num));
    }
    stageGroup.add(this.registerTimelineObject(haanAptGroup, 1989, '하안주공 아파트 대단지'));

    // --- District 5: KTX 광명역사 Mega-Terminal (2004년 준공 및 개역) ---
    const ktxStation = bld.createKTXStationTerminal(15, 175, 125, 52, 24, 0);
    stageGroup.add(this.registerTimelineObject(ktxStation, 2004, 'KTX 광명역사'));

    // --- District 6: 코스트코 광명점 (2012년 개점) ---
    const costcoStore = bld.createCostcoStore(-45, 215, 68, 42, 14, 0);
    stageGroup.add(this.registerTimelineObject(costcoStore, 2012, '코스트코 광명점'));

    // --- District 7: 이케아 광명점 (2014년 개점) ---
    const ikeaStore = bld.createIKEAStore(-45, 175, 80, 45, 18, 0);
    stageGroup.add(this.registerTimelineObject(ikeaStore, 2014, '이케아 광명점'));

    // --- District 8: 가학산 광명동굴 테마파크 정식 개관 (2015년 개관) ---
    const caveEntrance = bld.createGwangmyeongCaveEntrance(-25, 145, Math.PI * 0.5);
    stageGroup.add(this.registerTimelineObject(caveEntrance, 2015, '광명동굴 테마파크'));

    // --- District 9: 유플래닛 & 어반브릭스 40층 초고층 복합타워 (2021년 준공) ---
    const uPlanetGroup = new THREE.Group();
    uPlanetGroup.add(bld.createSkyscraper(65, 160, 145, 'cyan'));   // U-Planet Office Tower
    uPlanetGroup.add(bld.createSkyscraper(65, 195, 120, 'blue'));   // Take Hotel Tower
    uPlanetGroup.add(bld.createSkyscraper(95, 175, 110, 'emerald'));// Gwangmyeong Tech Complex
    stageGroup.add(this.registerTimelineObject(uPlanetGroup, 2021, '유플래닛 & 어반브릭스'));

    // 5. Urban Props (Trees, Streetlamps)
    for (let z = -220; z <= 220; z += 20) {
      props.spawnTree(117, z, 1.1);
      props.spawnTree(133, z, 1.1);
      props.spawnStreetlamp(121, z, 0);
    }
    for (let z = -210; z <= 210; z += 28) {
      props.spawnStreetlamp(12, z, Math.PI * 0.5);
      props.spawnTree(18, z + 12, 1.0);
    }
    const mountainPineSpots = [
      { x: -35, z: -155 }, { x: -20, z: -160 }, { x: -45, z: -175 }, { x: -15, z: -145 },
      { x: -50, z: 5 }, { x: -65, z: 25 }, { x: -40, z: 40 }, { x: -60, z: -15 },
      { x: -65, z: 130 }, { x: -75, z: 155 }, { x: -30, z: 225 }, { x: -20, z: 240 }
    ];
    for (const pt of mountainPineSpots) {
      props.spawnTree(pt.x, pt.z, 1.35);
    }

    // 6. Traffic Simulation
    const traffic = new TrafficModule();
    traffic.init(this.world, this.engine);
    this.submodules.traffic = traffic;

    const cheolsanBridgeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-45, 6.5, -65),
      new THREE.Vector3(18, 6.2, -65),
      new THREE.Vector3(125, 6.0, -65),
      new THREE.Vector3(205, 6.0, -65)
    ]);
    traffic.spawnVehicle(cheolsanBridgeCurve, 15.0, 0.25, 2.2, true);
    traffic.spawnVehicle(cheolsanBridgeCurve, 16.5, 0.65, -2.2, false);

    const oriRoCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(15, 6.5, -210),
      new THREE.Vector3(18, 6.2, -65),
      new THREE.Vector3(18, 6.1, 15),
      new THREE.Vector3(20, 6.0, 175)
    ]);
    traffic.spawnVehicle(oriRoCurve, 15.5, 0.15, 2.2, true);
    traffic.spawnVehicle(oriRoCurve, 17.0, 0.55, -2.2, false);

    // Initial Year from URL (e.g. ?year=1985)
    const urlParams = new URLSearchParams(window.location.search);
    const initialYear = parseInt(urlParams.get('year')) || 2026;
    this.setHistoricalYear(initialYear);

    console.log(`[DemoCityModule] Initialized at Historical Year: ${initialYear}`);
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

import * as THREE from 'three';

/**
 * AAA Procedural Architecture Subsystem
 * Generates low/mid/high density residential, commercial retail, industrial facilities,
 * and illuminated glass curtain-wall corporate skyscrapers with night window emission.
 */
export class BuildingsModule {
  constructor() {
    this.world = null;
    this.engine = null;
    this.buildingGroup = new THREE.Group();
    this.buildingGroup.name = 'BuildingsSubsystemGroup';
    this.buildingIdCounter = 0;
  }

  init(world, engine) {
    this.world = world;
    this.engine = engine;
    this.engine.scene.add(this.buildingGroup);
  }

  /**
   * Generates a modern glass skyscraper with curtain wall facade, setback crown,
   * rooftop mechanical equipment, and night window illumination.
   */
  createSkyscraper(x, z, height = 90, theme = 'cyan') {
    const group = new THREE.Group();
    const y = this.world ? this.world.terrain.getHeightAt(x, z) : 0;
    group.position.set(x, y, z);

    const baseW = 24;
    const baseD = 24;
    const curtainMat = this.engine.assets.getGlassCurtainWallMaterial(theme);
    const concreteMat = this.engine.assets.getConcreteMaterial();

    // 1. Lower Podium (Grand Entrance Lobby)
    const podiumH = 12;
    const podiumGeo = new THREE.BoxGeometry(baseW + 4, podiumH, baseD + 4);
    const podium = new THREE.Mesh(podiumGeo, concreteMat);
    podium.position.y = podiumH * 0.5;
    podium.castShadow = true;
    podium.receiveShadow = true;
    group.add(podium);

    // 2. Main Tower Shaft (Curtain Wall Glass)
    const shaftH = height - podiumH - 14;
    const shaftGeo = new THREE.BoxGeometry(baseW, shaftH, baseD);
    const shaft = new THREE.Mesh(shaftGeo, curtainMat);
    shaft.position.y = podiumH + shaftH * 0.5;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    group.add(shaft);

    // 3. Setback Crown / Spire
    const crownH = 10;
    const crownW = baseW * 0.7;
    const crownGeo = new THREE.BoxGeometry(crownW, crownH, crownW);
    const crown = new THREE.Mesh(crownGeo, curtainMat);
    crown.position.y = podiumH + shaftH + crownH * 0.5;
    crown.castShadow = true;
    crown.receiveShadow = true;
    group.add(crown);

    // 4. Rooftop Mechanical Penthouse & Spire
    const hvacGeo = new THREE.BoxGeometry(crownW * 0.45, 3.5, crownW * 0.45);
    const hvac = new THREE.Mesh(hvacGeo, concreteMat);
    hvac.position.y = podiumH + shaftH + crownH + 1.75;
    group.add(hvac);

    // Antenna / Aircraft Warning Beacon
    const spireGeo = new THREE.CylinderGeometry(0.2, 0.4, 12, 8);
    const spireMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.9, roughness: 0.3 });
    const spire = new THREE.Mesh(spireGeo, spireMat);
    spire.position.y = podiumH + shaftH + crownH + 3.5 + 6;
    group.add(spire);

    // Red warning beacon on top of spire
    const beaconGeo = new THREE.SphereGeometry(0.4, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = podiumH + shaftH + crownH + 3.5 + 12;
    group.add(beacon);

    this.registerBuilding(group, 'skyscraper', 'office', 450);
    return group;
  }

  /**
   * Generates a modern residential apartment complex with balconies
   */
  createResidentialBuilding(x, z, stories = 6, width = 20, depth = 16) {
    const group = new THREE.Group();
    const y = this.world ? this.world.terrain.getHeightAt(x, z) : 0;
    group.position.set(x, y, z);

    const height = stories * 3.4;
    const bodyGeo = new THREE.BoxGeometry(width, height, depth);
    const resMat = this.engine.assets.getResidentialMaterial(0xe2ded7);

    const body = new THREE.Mesh(bodyGeo, resMat);
    body.position.y = height * 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Balconies on front and back facade
    const balconyMat = this.engine.assets.getConcreteMaterial();
    const balcGeo = new THREE.BoxGeometry(4.5, 0.3, 1.6);

    for (let s = 1; s < stories; s++) {
      const by = s * 3.4 + 1.2;
      // Front balconies
      for (let bx = -width * 0.35; bx <= width * 0.35; bx += 6.0) {
        const balc = new THREE.Mesh(balcGeo, balconyMat);
        balc.position.set(bx, by, depth * 0.5 + 0.8);
        balc.castShadow = true;
        group.add(balc);
      }
    }

    // Rooftop AC condenser units
    const acGeo = new THREE.BoxGeometry(2, 1.4, 2);
    const acMat = new THREE.MeshStandardMaterial({ color: 0x5a6068, metalness: 0.6, roughness: 0.5 });
    const ac1 = new THREE.Mesh(acGeo, acMat);
    ac1.position.set(width * 0.25, height + 0.7, depth * 0.2);
    group.add(ac1);

    this.registerBuilding(group, 'apartment', 'residential', stories * 18);
    return group;
  }

  /**
   * Generates a suburban low-density single-family home with pitched roof and garage
   */
  createSuburbanHouse(x, z) {
    const group = new THREE.Group();
    const y = this.world ? this.world.terrain.getHeightAt(x, z) : 0;
    group.position.set(x, y, z);

    const w = 11;
    const d = 13;
    const h = 5.2;

    // Main house body
    const bodyGeo = new THREE.BoxGeometry(w, h, d);
    const sidingMat = this.engine.assets.getResidentialMaterial(0xdcd5c9);
    const body = new THREE.Mesh(bodyGeo, sidingMat);
    body.position.y = h * 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Pitched gabled roof
    const roofGeo = new THREE.ConeGeometry(w * 0.78, 3.2, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x363c46, roughness: 0.85 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = h + 1.6;
    roof.castShadow = true;
    group.add(roof);

    // Chimney
    const chimGeo = new THREE.BoxGeometry(0.9, 3.0, 0.9);
    const chimMat = new THREE.MeshStandardMaterial({ color: 0x73483b, roughness: 0.9 });
    const chim = new THREE.Mesh(chimGeo, chimMat);
    chim.position.set(2.5, h + 1.5, 1.5);
    group.add(chim);

    this.registerBuilding(group, 'house', 'residential', 4);
    return group;
  }

  /**
   * Generates an industrial logistics warehouse with loading docks
   */
  createIndustrialFacility(x, z, width = 36, depth = 28) {
    const group = new THREE.Group();
    const y = this.world ? this.world.terrain.getHeightAt(x, z) : 0;
    group.position.set(x, y, z);

    const h = 8.5;
    const geo = new THREE.BoxGeometry(width, h, depth);
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x48525f,
      metalness: 0.75,
      roughness: 0.4
    });

    const body = new THREE.Mesh(geo, steelMat);
    body.position.y = h * 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Loading bays
    const dockGeo = new THREE.BoxGeometry(3.5, 4.2, 0.3);
    const dockMat = new THREE.MeshStandardMaterial({ color: 0x1f242b, roughness: 0.7 });
    for (let dx = -width * 0.35; dx <= width * 0.35; dx += 6.5) {
      const dock = new THREE.Mesh(dockGeo, dockMat);
      dock.position.set(dx, 2.1, depth * 0.5 + 0.1);
      group.add(dock);
    }

    this.registerBuilding(group, 'warehouse', 'industrial', 25);
    return group;
  }

  /**
   * Generates a Korean High-Rise Apartment Slab Block (판상형 주공/현대 아파트 단지)
   * With stenciled gable building numbers (e.g. 101, 203), balcony bays, rooftop elevator crowns
   */
  createKoreanApartmentBlock(x, z, stories = 18, length = 56, depth = 14, rotY = 0, buildingNum = '101') {
    const group = new THREE.Group();
    const y = this.world ? this.world.terrain.getHeightAt(x, z) : 0;
    group.position.set(x, y, z);
    group.rotation.y = rotY;

    const height = stories * 2.8;
    const facadeMat = this.engine.assets.getKoreanApartmentFacadeMaterial();
    const gableMat = this.engine.assets.getKoreanApartmentGableMaterial(buildingNum);
    const concreteMat = this.engine.assets.getConcreteMaterial();

    // Box multi-materials: [+X, -X, +Y, -Y, +Z, -Z]
    const materials = [
      gableMat,    // +X Right gable
      gableMat,    // -X Left gable
      concreteMat, // +Y Roof
      concreteMat, // -Y Base
      facadeMat,   // +Z Front balcony facade
      facadeMat    // -Z Back balcony facade
    ];

    const bodyGeo = new THREE.BoxGeometry(length, height, depth);
    const body = new THREE.Mesh(bodyGeo, materials);
    body.position.y = height * 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // 2-3 Rooftop Elevator / Stair Machine Towers
    const towerH = 4.2;
    const towerW = 6.0;
    const towerD = 5.5;
    const numCores = Math.max(2, Math.floor(length / 22));
    const step = length / (numCores + 1);

    for (let i = 1; i <= numCores; i++) {
      const tx = -length * 0.5 + i * step;
      const coreGeo = new THREE.BoxGeometry(towerW, towerH, towerD);
      const core = new THREE.Mesh(coreGeo, concreteMat);
      core.position.set(tx, height + towerH * 0.5, 0);
      core.castShadow = true;
      group.add(core);

      // Red LED aviation obstruction light on top of each machine room
      const beaconGeo = new THREE.SphereGeometry(0.3, 6, 6);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff1500 });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(tx, height + towerH + 0.4, 0);
      group.add(beacon);
    }

    // Ground entrance canopies
    for (let i = 1; i <= numCores; i++) {
      const tx = -length * 0.5 + i * step;
      const canopyGeo = new THREE.BoxGeometry(4.5, 0.4, 3.2);
      const canopy = new THREE.Mesh(canopyGeo, concreteMat);
      canopy.position.set(tx, 3.2, depth * 0.5 + 1.6);
      group.add(canopy);
    }

    this.registerBuilding(group, 'k_apartment', 'residential', stories * 8);
    return group;
  }

  /**
   * Generates the iconic KTX Gwangmyeong Station Mega-Terminal
   * Grand barrel-vaulted glass-and-steel space truss canopy, sunken high-speed tracks & concourses
   */
  createKTXStationTerminal(x, z, length = 130, width = 52, height = 24, rotY = 0) {
    const group = new THREE.Group();
    const y = this.world ? this.world.terrain.getHeightAt(x, z) : 0;
    group.position.set(x, y, z);
    group.rotation.y = rotY;

    const canopyMat = this.engine.assets.getKTXCanopyMaterial();
    const concreteMat = this.engine.assets.getConcreteMaterial();

    // 1. Grand Arched Barrel-Vault Glass Canopy
    const radius = width * 0.52;
    const vaultGeo = new THREE.CylinderGeometry(radius, radius, length, 28, 1, true, 0, Math.PI);
    vaultGeo.rotateZ(Math.PI / 2);
    vaultGeo.rotateY(Math.PI / 2);
    const vault = new THREE.Mesh(vaultGeo, canopyMat);
    vault.position.y = 8.0;
    vault.castShadow = true;
    vault.receiveShadow = true;
    group.add(vault);

    // Arch end glass walls
    const endGeo = new THREE.CircleGeometry(radius, 24, 0, Math.PI);
    endGeo.rotateY(Math.PI);
    const endNorth = new THREE.Mesh(endGeo, canopyMat);
    endNorth.position.set(0, 8.0, length * 0.5);
    group.add(endNorth);

    const endSouth = new THREE.Mesh(endGeo, canopyMat);
    endSouth.position.set(0, 8.0, -length * 0.5);
    group.add(endSouth);

    // 2. Concrete Passenger Side Concourses (East and West Terminal Wings)
    const concourseW = 10.0;
    const concourseH = 9.0;
    for (const side of [-1, 1]) {
      const concourseGeo = new THREE.BoxGeometry(concourseW, concourseH, length);
      const concourse = new THREE.Mesh(concourseGeo, concreteMat);
      concourse.position.set(side * (width * 0.5 + concourseW * 0.5), concourseH * 0.5, 0);
      concourse.castShadow = true;
      concourse.receiveShadow = true;
      group.add(concourse);
    }

    // 3. Central Railway Tracks & Platform Deck
    const platformGeo = new THREE.BoxGeometry(width, 1.2, length + 20);
    const platformMat = new THREE.MeshStandardMaterial({ color: 0x22262b, roughness: 0.9 });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = 0.6;
    group.add(platform);

    // KTX Steel Rail tracks (4 tracks: 2 express, 2 stopping)
    const railMat = new THREE.MeshStandardMaterial({ color: 0x8f969d, metalness: 0.9, roughness: 0.2 });
    for (const trackX of [-12, -4, 4, 12]) {
      for (const railOff of [-0.75, 0.75]) {
        const railGeo = new THREE.BoxGeometry(0.12, 0.25, length + 30);
        const rail = new THREE.Mesh(railGeo, railMat);
        rail.position.set(trackX + railOff, 1.35, 0);
        group.add(rail);
      }
    }

    this.registerBuilding(group, 'ktx_terminal', 'commercial', 1200);
    return group;
  }

  /**
   * Generates Kia AutoLand Gwangmyeong (Sohari Plant) Manufacturing Plant
   */
  createKiaIndustrialPlant(x, z, length = 90, width = 50, height = 14, rotY = 0) {
    const group = new THREE.Group();
    const y = this.world ? this.world.terrain.getHeightAt(x, z) : 0;
    group.position.set(x, y, z);
    group.rotation.y = rotY;

    const sidingMat = this.engine.assets.getKiaFactorySidingMaterial();
    const concreteMat = this.engine.assets.getConcreteMaterial();

    // Main assembly shed
    const mainGeo = new THREE.BoxGeometry(length, height, width);
    const main = new THREE.Mesh(mainGeo, sidingMat);
    main.position.y = height * 0.5;
    main.castShadow = true;
    main.receiveShadow = true;
    group.add(main);

    // Rooftop Sawtooth Skylights
    const sawGeo = new THREE.BoxGeometry(length * 0.85, 2.5, 6.0);
    for (let dz = -width * 0.35; dz <= width * 0.35; dz += 10.0) {
      const saw = new THREE.Mesh(sawGeo, concreteMat);
      saw.position.set(0, height + 1.25, dz);
      group.add(saw);
    }

    // Kia Logo Billboard Frame on Front
    const signGeo = new THREE.BoxGeometry(18, 4.5, 0.5);
    const signMat = new THREE.MeshStandardMaterial({ color: 0x05070a, metalness: 0.8 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, height + 3.0, width * 0.5 + 0.2);
    group.add(sign);

    this.registerBuilding(group, 'kia_plant', 'industrial', 850);
    return group;
  }

  /**
   * Generates IKEA Gwangmyeong Flagship Store
   */
  createIKEAStore(x, z, length = 80, width = 45, height = 18, rotY = 0) {
    const group = new THREE.Group();
    const y = this.world ? this.world.terrain.getHeightAt(x, z) : 0;
    group.position.set(x, y, z);
    group.rotation.y = rotY;

    const ikeaMat = this.engine.assets.getIKEAMaterial();
    const concreteMat = this.engine.assets.getConcreteMaterial();

    const bodyGeo = new THREE.BoxGeometry(length, height, width);
    const body = new THREE.Mesh(bodyGeo, ikeaMat);
    body.position.y = height * 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Rooftop Solar / HVAC units
    for (let dx = -length * 0.3; dx <= length * 0.3; dx += 20) {
      const hvacGeo = new THREE.BoxGeometry(8, 2.5, 8);
      const hvac = new THREE.Mesh(hvacGeo, concreteMat);
      hvac.position.set(dx, height + 1.25, 0);
      group.add(hvac);
    }

    this.registerBuilding(group, 'ikea_store', 'commercial', 650);
    return group;
  }

  /**
   * Generates Costco Gwangmyeong Wholesale Warehouse Store
   */
  createCostcoStore(x, z, length = 68, width = 42, height = 14, rotY = 0) {
    const group = new THREE.Group();
    const y = this.world ? this.world.terrain.getHeightAt(x, z) : 0;
    group.position.set(x, y, z);
    group.rotation.y = rotY;

    const costcoMat = this.engine.assets.getCostcoMaterial();
    const concreteMat = this.engine.assets.getConcreteMaterial();

    const bodyGeo = new THREE.BoxGeometry(length, height, width);
    const body = new THREE.Mesh(bodyGeo, costcoMat);
    body.position.y = height * 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Front Loading / Member Entrance Canopy
    const canopyGeo = new THREE.BoxGeometry(length * 0.6, 1.2, 10);
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0xcc2229, metalness: 0.8 });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 4.5, width * 0.5 + 5.0);
    canopy.castShadow = true;
    group.add(canopy);

    this.registerBuilding(group, 'costco_store', 'commercial', 500);
    return group;
  }

  /**
   * Generates Gwangmyeong Cave (광명동굴) Mining Heritage Site Entrance on Gahaksan
   */
  createGwangmyeongCaveEntrance(x, z, rotY = 0) {
    const group = new THREE.Group();
    const y = this.world ? this.world.terrain.getHeightAt(x, z) : 0;
    group.position.set(x, y, z);
    group.rotation.y = rotY;

    const caveMat = this.engine.assets.getCavePortalMaterial();
    const timberMat = new THREE.MeshStandardMaterial({ color: 0x3d2716, roughness: 0.9 });
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x38342e, roughness: 0.95 });

    // 1. Rock Portal Cave Frame
    const portalGeo = new THREE.BoxGeometry(16, 10, 8);
    const portal = new THREE.Mesh(portalGeo, caveMat);
    portal.position.set(0, 5.0, 0);
    portal.castShadow = true;
    group.add(portal);

    // 2. Cave Mouth Void (Dark Entrance Arch)
    const mouthGeo = new THREE.CylinderGeometry(3.5, 3.5, 6.0, 12, 1, false, 0, Math.PI);
    mouthGeo.rotateZ(Math.PI / 2);
    mouthGeo.rotateY(Math.PI / 2);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x050403 });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, 3.5, 4.1);
    group.add(mouth);

    // 3. Vintage Mining Ore Cart on Rails
    const railMat = new THREE.MeshStandardMaterial({ color: 0x6e7680, metalness: 0.9 });
    const trackGeo = new THREE.BoxGeometry(0.8, 0.15, 12);
    const track = new THREE.Mesh(trackGeo, railMat);
    track.position.set(0, 0.1, 7.0);
    group.add(track);

    const cartGeo = new THREE.BoxGeometry(1.6, 1.2, 2.2);
    const cartMat = new THREE.MeshStandardMaterial({ color: 0x7c381c, metalness: 0.7 });
    const cart = new THREE.Mesh(cartGeo, cartMat);
    cart.position.set(0, 0.8, 7.0);
    cart.castShadow = true;
    group.add(cart);

    // Gold/Yellow Cave Lighting Glow
    const glowGeo = new THREE.SphereGeometry(0.35, 6, 6);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffd24d });
    const lamp = new THREE.Mesh(glowGeo, glowMat);
    lamp.position.set(0, 5.5, 4.2);
    group.add(lamp);

    this.registerBuilding(group, 'gwangmyeong_cave', 'commercial', 200);
    return group;
  }

  /**
   * 9. Gwangmyeong City Hall (광명시청)
   */
  createCityHall(x, z, rotation = 0) {
    const group = new THREE.Group();
    const terrainY = this.world && this.world.terrain ? this.world.terrain.getHeightAt(x, z) : 6.0;
    group.position.set(x, terrainY, z);
    group.rotation.y = rotation;

    const cityHallMat = this.engine.assets.getCityHallMaterial();
    const bldGeo = new THREE.BoxGeometry(36, 22, 22);
    const bld = new THREE.Mesh(bldGeo, cityHallMat);
    bld.position.set(0, 11, 0);
    bld.castShadow = true;
    bld.receiveShadow = true;
    group.add(bld);

    // Clock tower on roof
    const towerGeo = new THREE.BoxGeometry(10, 8, 10);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.2 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(0, 26, 0);
    group.add(tower);

    // Flagpole
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.12, 10);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(12, 5, 14);
    group.add(pole);

    this.registerBuilding(group, 'gwangmyeong_city_hall', 'commercial', 800);
    return group;
  }

  /**
   * 10. Lotte Mall Gwangmyeong (롯데몰 광명점)
   */
  createLotteMall(x, z, width = 72, length = 44, height = 24, rotation = 0) {
    const group = new THREE.Group();
    const terrainY = this.world && this.world.terrain ? this.world.terrain.getHeightAt(x, z) : 6.0;
    group.position.set(x, terrainY, z);
    group.rotation.y = rotation;

    const mallMat = this.engine.assets.getLotteMallMaterial();
    const mallGeo = new THREE.BoxGeometry(width, height, length);
    const mall = new THREE.Mesh(mallGeo, mallMat);
    mall.position.set(0, height * 0.5, 0);
    mall.castShadow = true;
    mall.receiveShadow = true;
    group.add(mall);

    this.registerBuilding(group, 'lotte_mall', 'commercial', 1200);
    return group;
  }

  /**
   * 11. Gwangmyeong Traditional Market (광명전통시장)
   */
  createTraditionalMarket(x, z, rotation = 0) {
    const group = new THREE.Group();
    const terrainY = this.world && this.world.terrain ? this.world.terrain.getHeightAt(x, z) : 6.0;
    group.position.set(x, terrainY, z);
    group.rotation.y = rotation;

    const marketMat = this.engine.assets.getMarketMaterial();
    const arcadeGeo = new THREE.BoxGeometry(42, 8, 18);
    const arcade = new THREE.Mesh(arcadeGeo, marketMat);
    arcade.position.set(0, 4, 0);
    arcade.castShadow = true;
    arcade.receiveShadow = true;
    group.add(arcade);

    this.registerBuilding(group, 'gwangmyeong_market', 'commercial', 450);
    return group;
  }

  /**
   * 12. Gwangmyeong Resource Recovery Incinerator Stack (광명시 자원회수시설 굴뚝)
   */
  createIncinerationTower(x, z) {
    const group = new THREE.Group();
    const terrainY = this.world && this.world.terrain ? this.world.terrain.getHeightAt(x, z) : 6.0;
    group.position.set(x, terrainY, z);

    // Red and White striped tower
    const stackHeight = 52;
    const stackGeo = new THREE.CylinderGeometry(2.2, 3.0, stackHeight, 16);
    const stackMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.2 });
    const stack = new THREE.Mesh(stackGeo, stackMat);
    stack.position.set(0, stackHeight * 0.5, 0);
    stack.castShadow = true;
    group.add(stack);

    // White stripes
    for (let i = 1; i <= 3; i++) {
      const stripeGeo = new THREE.CylinderGeometry(2.3, 2.5, 6, 16);
      const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.set(0, i * 12, 0);
      group.add(stripe);
    }

    this.registerBuilding(group, 'incineration_tower', 'industrial', 100);
    return group;
  }

  registerBuilding(meshGroup, type, zoneType, occupants) {
    const id = `bld_${++this.buildingIdCounter}`;
    meshGroup.name = id;
    this.buildingGroup.add(meshGroup);

    if (this.world) {
      this.world.buildings.set(id, {
        id,
        type,
        zoneType,
        occupants,
        position: meshGroup.position.clone(),
        group: meshGroup
      });

      this.world.eventBus.emit('building:constructed', {
        buildingId: id,
        type,
        zoneType,
        occupants,
        position: meshGroup.position
      });
    }
  }

  showcase(stageGroup, options = {}) {
    // Showcase of density progression: suburban house -> apartment -> warehouse -> skyscrapers
    const house = this.createSuburbanHouse(-50, 0);
    const apt = this.createResidentialBuilding(-20, 0, 7, 20, 16);
    const warehouse = this.createIndustrialFacility(20, 0, 32, 22);
    const skyscraper1 = this.createSkyscraper(65, 0, 85, 'cyan');
    const skyscraper2 = this.createSkyscraper(95, 0, 120, 'blue');

    stageGroup.add(house);
    stageGroup.add(apt);
    stageGroup.add(warehouse);
    stageGroup.add(skyscraper1);
    stageGroup.add(skyscraper2);

    console.log('[BuildingsModule] Showcase scene initialized.');
  }

  dispose() {
    while (this.buildingGroup.children.length > 0) {
      const obj = this.buildingGroup.children[0];
      this.buildingGroup.remove(obj);
    }
  }
}

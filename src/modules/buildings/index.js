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

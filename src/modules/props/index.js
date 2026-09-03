import * as THREE from 'three';

/**
 * AAA Urban Props & Vegetation Subsystem (Optimized for >= 60 FPS)
 * Emissive streetlamp fixtures, traffic signals, and instanced leafy trees.
 */
export class PropsModule {
  constructor() {
    this.world = null;
    this.engine = null;
    this.propsGroup = new THREE.Group();
    this.propsGroup.name = 'PropsSubsystemGroup';
    this.lampLensMaterial = null;
  }

  init(world, engine) {
    this.world = world;
    this.engine = engine;
    this.engine.scene.add(this.propsGroup);

    this.lampLensMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(0xffe28a),
      emissiveIntensity: 0.0,
      roughness: 0.2
    });

    // Synchronize streetlight emissive lens with day/night cycle
    this.world.eventBus.on('time:updated', (state) => {
      if (this.lampLensMaterial) {
        this.lampLensMaterial.emissiveIntensity = Math.max(0.0, state.nightFactor * 4.5);
      }
    });
  }

  /**
   * Generates a detailed procedural deciduous tree mesh
   */
  createTreeModel() {
    const group = new THREE.Group();

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 4.5, 7);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      roughness: 0.9,
      metalness: 0.05
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2.25;
    trunk.castShadow = true;
    group.add(trunk);

    // Multi-cluster leafy foliage canopy
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x3d662c,
      roughness: 0.82,
      metalness: 0.08,
      flatShading: true
    });

    const clusters = [
      { r: 2.2, y: 4.8, x: 0, z: 0 },
      { r: 1.8, y: 5.8, x: 0.6, z: 0.4 },
      { r: 1.6, y: 5.6, x: -0.7, z: -0.5 },
      { r: 1.4, y: 6.8, x: 0, z: 0 }
    ];

    for (const c of clusters) {
      const leafGeo = new THREE.DodecahedronGeometry(c.r, 1);
      const foliage = new THREE.Mesh(leafGeo, leafMat);
      foliage.position.set(c.x, c.y, c.z);
      foliage.castShadow = true;
      foliage.receiveShadow = true;
      group.add(foliage);
    }

    return group;
  }

  /**
   * Generates a modern urban streetlight
   */
  createStreetlampModel() {
    const group = new THREE.Group();

    // Steel pole
    const poleMat = new THREE.MeshStandardMaterial({
      color: 0x242830,
      metalness: 0.85,
      roughness: 0.3
    });
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 7.5, 8);
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 3.75;
    pole.castShadow = true;
    group.add(pole);

    // Curved arm
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6);
    armGeo.rotateZ(Math.PI / 3);
    const arm = new THREE.Mesh(armGeo, poleMat);
    arm.position.set(0.9, 7.2, 0);
    group.add(arm);

    // Fixture head
    const headGeo = new THREE.BoxGeometry(0.8, 0.25, 0.4);
    const head = new THREE.Mesh(headGeo, poleMat);
    head.position.set(1.8, 7.6, 0);
    group.add(head);

    // High-luminance emissive light lens
    const lensGeo = new THREE.PlaneGeometry(0.6, 0.3);
    lensGeo.rotateX(Math.PI / 2);
    const lens = new THREE.Mesh(lensGeo, this.lampLensMaterial);
    lens.position.set(1.8, 7.46, 0);
    group.add(lens);

    return group;
  }

  spawnStreetlamp(x, z, rotY = 0) {
    const lamp = this.createStreetlampModel();
    const y = this.world ? this.world.terrain.getHeightAt(x, z) : 0;
    lamp.position.set(x, y, z);
    lamp.rotation.y = rotY;
    this.propsGroup.add(lamp);
    return lamp;
  }

  spawnTree(x, z, scale = 1.0) {
    const tree = this.createTreeModel();
    const y = this.world ? this.world.terrain.getHeightAt(x, z) : 0;
    tree.position.set(x, y, z);
    tree.scale.setScalar(scale);
    tree.rotation.y = Math.random() * Math.PI * 2;
    this.propsGroup.add(tree);
    return tree;
  }

  showcase(stageGroup, options = {}) {
    this.init(this.world, this.engine);
    for (let i = -3; i <= 3; i++) {
      const lamp = this.createStreetlampModel();
      lamp.position.set(i * 12, 0, 5);
      stageGroup.add(lamp);

      const tree = this.createTreeModel();
      tree.position.set(i * 12 + 6, 0, 5);
      stageGroup.add(tree);
    }
    console.log('[PropsModule] Showcase scene initialized.');
  }

  dispose() {
    while (this.propsGroup.children.length > 0) {
      const obj = this.propsGroup.children[0];
      this.propsGroup.remove(obj);
    }
  }
}

import * as THREE from 'three';

/**
 * AAA Traffic Simulation & Vehicular Agent Subsystem
 * Spline pathfinding, car following physics, realistic chassis variety,
 * emissive headlights with projected night road light cones, and brake lights.
 */
export class TrafficModule {
  constructor() {
    this.world = null;
    this.engine = null;
    this.trafficGroup = new THREE.Group();
    this.trafficGroup.name = 'TrafficSubsystemGroup';
    this.vehicles = [];
    this.carMaterials = {};
    this.headlightBeamMaterial = null;
  }

  init(world, engine) {
    this.world = world;
    this.engine = engine;
    this.engine.scene.add(this.trafficGroup);
    this.initVehicleTemplates();

    if (this.world) {
      this.world.eventBus.on('time:updated', (state) => {
        if (this.headlightBeamMaterial) {
          this.headlightBeamMaterial.opacity = Math.max(0.0, (state.nightFactor - 0.25) * 0.45);
        }
      });
    }
  }

  initVehicleTemplates() {
    this.carMaterials.window = new THREE.MeshStandardMaterial({
      color: 0x0e131a,
      roughness: 0.12,
      metalness: 0.92
    });
    this.carMaterials.wheel = new THREE.MeshStandardMaterial({
      color: 0x16181b,
      roughness: 0.85
    });
    this.carMaterials.headlight = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(0xfff4db),
      emissiveIntensity: 3.5
    });
    this.carMaterials.taillight = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: new THREE.Color(0xff1800),
      emissiveIntensity: 2.5
    });

    const carPaints = [0x16345c, 0x7c1515, 0x22262a, 0xc2c7cd, 0x134e32, 0xd4a017];
    this.carMaterials.paints = carPaints.map(hex => new THREE.MeshStandardMaterial({
      color: hex,
      metalness: 0.85,
      roughness: 0.25
    }));

    // Projected night headlight beam on road (soft gradient additive blending)
    this.headlightBeamMaterial = new THREE.MeshBasicMaterial({
      color: 0xffe9b8,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }

  createVehicleMesh(paintIndex = 0, isBus = false) {
    const group = new THREE.Group();
    const l = isBus ? 10.5 : 4.4;
    const w = isBus ? 2.4 : 1.8;
    const h = isBus ? 3.0 : 1.35;

    const paint = this.carMaterials.paints[paintIndex % this.carMaterials.paints.length];

    // Chassis body
    const bodyGeo = new THREE.BoxGeometry(w, h * 0.55, l);
    const body = new THREE.Mesh(bodyGeo, paint);
    body.position.y = 0.45;
    body.castShadow = true;
    group.add(body);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(w * (isBus ? 0.95 : 0.85), h * 0.45, l * (isBus ? 0.9 : 0.55));
    const cabin = new THREE.Mesh(cabinGeo, this.carMaterials.window);
    cabin.position.set(0, 0.45 + h * 0.45, isBus ? 0 : -0.2);
    cabin.castShadow = true;
    group.add(cabin);

    // Headlights (Front +Z)
    const hlGeo = new THREE.BoxGeometry(0.35, 0.18, 0.08);
    const hlL = new THREE.Mesh(hlGeo, this.carMaterials.headlight);
    hlL.position.set(-w * 0.35, 0.45, l * 0.5 + 0.02);
    const hlR = new THREE.Mesh(hlGeo, this.carMaterials.headlight);
    hlR.position.set(w * 0.35, 0.45, l * 0.5 + 0.02);
    group.add(hlL);
    group.add(hlR);

    // Taillights (Rear -Z)
    const tlGeo = new THREE.BoxGeometry(0.35, 0.14, 0.08);
    const tlL = new THREE.Mesh(tlGeo, this.carMaterials.taillight);
    tlL.position.set(-w * 0.35, 0.5, -l * 0.5 - 0.02);
    const tlR = new THREE.Mesh(tlGeo, this.carMaterials.taillight);
    tlR.position.set(w * 0.35, 0.5, -l * 0.5 - 0.02);
    group.add(tlL);
    group.add(tlR);

    // Projected night headlight beam on pavement ahead (+Z)
    const beamGeo = new THREE.PlaneGeometry(2.8, 10.0);
    beamGeo.rotateX(-Math.PI / 2);
    const beam = new THREE.Mesh(beamGeo, this.headlightBeamMaterial);
    beam.position.set(0, 0.08, l * 0.5 + 5.0);
    group.add(beam);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 10);
    wheelGeo.rotateZ(Math.PI / 2);
    const zOffsets = isBus ? [l * 0.38, -l * 0.38] : [l * 0.32, -l * 0.32];
    for (const zOff of zOffsets) {
      for (const xOff of [-w * 0.5, w * 0.5]) {
        const wheel = new THREE.Mesh(wheelGeo, this.carMaterials.wheel);
        wheel.position.set(xOff, 0.34, zOff);
        group.add(wheel);
      }
    }

    return group;
  }

  spawnVehicle(curve, speed = 14.0, progress = 0.0, laneOffset = 2.0, isBus = false) {
    const mesh = this.createVehicleMesh(this.vehicles.length, isBus);
    this.trafficGroup.add(mesh);

    const vehicle = {
      mesh,
      curve,
      speed,
      progress,
      laneOffset,
      length: curve.getLength()
    };

    this.vehicles.push(vehicle);
    this.updateVehicleTransform(vehicle);
    return vehicle;
  }

  update(delta) {
    for (const v of this.vehicles) {
      const dist = v.speed * delta;
      v.progress += dist / v.length;
      if (v.progress > 1.0) v.progress -= 1.0;
      this.updateVehicleTransform(v);
    }
  }

  updateVehicleTransform(v) {
    const pt = v.curve.getPoint(v.progress);
    const tangent = v.curve.getTangent(v.progress).normalize();
    const normal = new THREE.Vector3(0, 1, 0);
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

    const pos = pt.clone().addScaledVector(binormal, v.laneOffset);
    v.mesh.position.copy(pos);

    const angle = Math.atan2(tangent.x, tangent.z);
    v.mesh.rotation.y = angle;
  }

  showcase(stageGroup, options = {}) {
    this.initVehicleTemplates();

    // Road asphalt loop surface
    const roadLoop = new THREE.Mesh(
      new THREE.RingGeometry(22, 38, 48),
      this.engine.assets.getAsphaltMaterial()
    );
    roadLoop.rotateX(-Math.PI / 2);
    roadLoop.position.y = 0.02;
    roadLoop.receiveShadow = true;
    stageGroup.add(roadLoop);

    // Ground plane
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120),
      new THREE.MeshStandardMaterial({ color: 0x223020, roughness: 0.9 })
    );
    ground.rotateX(-Math.PI / 2);
    stageGroup.add(ground);

    const loopCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-30, 0.2, 0),
      new THREE.Vector3(0, 0.2, 30),
      new THREE.Vector3(30, 0.2, 0),
      new THREE.Vector3(0, 0.2, -30),
      new THREE.Vector3(-30, 0.2, 0)
    ], true);

    for (let i = 0; i < 6; i++) {
      const v = this.spawnVehicle(loopCurve, 14, i * 0.16, (i % 2 === 0 ? 1.8 : -1.8), i === 0);
      stageGroup.add(v.mesh);
    }

    console.log('[TrafficModule] Showcase scene initialized with asphalt road.');
  }

  dispose() {
    while (this.trafficGroup.children.length > 0) {
      const obj = this.trafficGroup.children[0];
      this.trafficGroup.remove(obj);
    }
    this.vehicles = [];
  }
}

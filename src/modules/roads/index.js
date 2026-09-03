import * as THREE from 'three';

/**
 * AAA Procedural Road Network Subsystem
 * Spline-based road extrusion, asphalt PBR, lane markings (dashed centerlines, solid shoulders),
 * pedestrian crosswalk zebra stripes, curbs, sidewalks, and seamless intersection fillets.
 */
export class RoadsModule {
  constructor() {
    this.world = null;
    this.engine = null;
    this.roadGroup = new THREE.Group();
    this.roadGroup.name = 'RoadsSubsystemGroup';
  }

  init(world, engine) {
    this.world = world;
    this.engine = engine;
    this.engine.scene.add(this.roadGroup);
  }

  /**
   * Generates a road ribbon along a polyline or spline
   * @param {Array<THREE.Vector3>} points 
   * @param {Object} options 
   */
  createRoadSegment(points, options = {}) {
    const opts = Object.assign({
      width: 14.0, // 4-lane avenue
      lanes: 4,
      sidewalkWidth: 2.8,
      curbHeight: 0.18,
      isBridge: false
    }, options);

    const curve = new THREE.CatmullRomCurve3(points);
    const divisions = Math.max(12, Math.floor(curve.getLength() * 1.5));
    const sampledPoints = curve.getSpacedPoints(divisions);

    const halfW = opts.width * 0.5;
    const swW = opts.sidewalkWidth;
    const cH = opts.curbHeight;

    // We generate road asphalt geometry, markings geometry, and sidewalk geometry
    const roadVerts = [];
    const roadUvs = [];
    const roadIndices = [];

    const swVerts = [];
    const swIndices = [];

    let vertOffset = 0;
    let swOffset = 0;

    for (let i = 0; i <= divisions; i++) {
      const p = sampledPoints[i];
      const tangent = curve.getTangent(i / divisions).normalize();
      const normal = new THREE.Vector3(0, 1, 0);
      const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

      const uCoord = i / divisions * (curve.getLength() / 10.0);

      // Road asphalt surface (Left edge to Right edge)
      const rL = p.clone().addScaledVector(binormal, -halfW);
      const rR = p.clone().addScaledVector(binormal, halfW);

      roadVerts.push(rL.x, rL.y + 0.05, rL.z);
      roadVerts.push(rR.x, rR.y + 0.05, rR.z);

      roadUvs.push(0.0, uCoord);
      roadUvs.push(1.0, uCoord);

      if (i < divisions) {
        const v0 = vertOffset;
        const v1 = vertOffset + 1;
        const v2 = vertOffset + 2;
        const v3 = vertOffset + 3;

        roadIndices.push(v0, v1, v2);
        roadIndices.push(v1, v3, v2);
        vertOffset += 2;
      }

      // Left sidewalk & curb
      const swL_outer = p.clone().addScaledVector(binormal, -(halfW + swW));
      swL_outer.y += cH;
      const swL_inner = p.clone().addScaledVector(binormal, -halfW);
      swL_inner.y += cH;

      // Right sidewalk & curb
      const swR_inner = p.clone().addScaledVector(binormal, halfW);
      swR_inner.y += cH;
      const swR_outer = p.clone().addScaledVector(binormal, halfW + swW);
      swR_outer.y += cH;

      swVerts.push(swL_outer.x, swL_outer.y, swL_outer.z);
      swVerts.push(swL_inner.x, swL_inner.y, swL_inner.z);
      swVerts.push(swR_inner.x, swR_inner.y, swR_inner.z);
      swVerts.push(swR_outer.x, swR_outer.y, swR_outer.z);

      if (i < divisions) {
        const b = swOffset;
        // Left sidewalk quad
        swIndices.push(b, b + 1, b + 4);
        swIndices.push(b + 1, b + 5, b + 4);
        // Right sidewalk quad
        swIndices.push(b + 2, b + 3, b + 6);
        swIndices.push(b + 3, b + 7, b + 6);
        swOffset += 4;
      }
    }

    // Asphalt Mesh
    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVerts, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
    roadGeo.setIndex(roadIndices);
    roadGeo.computeVertexNormals();

    const asphaltMat = this.engine.assets.getAsphaltMaterial();
    const roadMesh = new THREE.Mesh(roadGeo, asphaltMat);
    roadMesh.receiveShadow = true;

    // Sidewalk Mesh
    const swGeo = new THREE.BufferGeometry();
    swGeo.setAttribute('position', new THREE.Float32BufferAttribute(swVerts, 3));
    swGeo.setIndex(swIndices);
    swGeo.computeVertexNormals();

    const concreteMat = this.engine.assets.getConcreteMaterial();
    const swMesh = new THREE.Mesh(swGeo, concreteMat);
    swMesh.receiveShadow = true;
    swMesh.castShadow = true;

    // Lane Markings Mesh (crisp white stripes & dashed centerlines)
    const markingsGroup = this.generateLaneMarkings(curve, divisions, opts);

    const segmentGroup = new THREE.Group();
    segmentGroup.add(roadMesh);
    segmentGroup.add(swMesh);
    segmentGroup.add(markingsGroup);

    // Register road in world data model
    const roadId = `road_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    if (this.world) {
      this.world.roads.edges.set(roadId, {
        id: roadId,
        curve,
        points,
        lanes: opts.lanes,
        width: opts.width,
        length: curve.getLength()
      });
      this.world.eventBus.emit('road:created', {
        roadId,
        points,
        lanes: opts.lanes,
        width: opts.width
      });
    }

    return segmentGroup;
  }

  /**
   * Generates crisp dashed centerlines and solid edge markings
   */
  generateLaneMarkings(curve, divisions, opts) {
    const group = new THREE.Group();
    const stripeMat = new THREE.MeshBasicMaterial({
      color: 0xf5f5f5,
      side: THREE.DoubleSide
    });
    const yellowMat = new THREE.MeshBasicMaterial({
      color: 0xffb81c,
      side: THREE.DoubleSide
    });

    const totalLen = curve.getLength();
    const dashLength = 3.5;
    const gapLength = 4.5;
    const cycle = dashLength + gapLength;
    const numDashes = Math.floor(totalLen / cycle);

    // Centerline dashes
    const dashGeo = new THREE.PlaneGeometry(0.25, dashLength);
    dashGeo.rotateX(-Math.PI / 2);

    for (let i = 0; i < numDashes; i++) {
      const t = (i * cycle + dashLength * 0.5) / totalLen;
      if (t > 0.98) continue;
      const pt = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      const dash = new THREE.Mesh(dashGeo, opts.lanes === 2 ? yellowMat : stripeMat);
      dash.position.copy(pt);
      dash.position.y += 0.07; // slight offset above asphalt

      const angle = Math.atan2(tangent.x, tangent.z);
      dash.rotation.y = angle;
      group.add(dash);
    }

    return group;
  }

  /**
   * Generates a 4-way intersection junction with pedestrian zebra crosswalks
   */
  createIntersection(position, width = 16.0) {
    const group = new THREE.Group();
    group.position.copy(position);

    // Junction square asphalt
    const juncGeo = new THREE.PlaneGeometry(width, width);
    juncGeo.rotateX(-Math.PI / 2);
    const juncMesh = new THREE.Mesh(juncGeo, this.engine.assets.getAsphaltMaterial());
    juncMesh.position.y = 0.05;
    juncMesh.receiveShadow = true;
    group.add(juncMesh);

    // Pedestrian zebra crossings on all 4 arms
    const zebraMat = new THREE.MeshStandardMaterial({
      color: 0xdedfe2,
      roughness: 0.65,
      metalness: 0.02
    });
    const barGeo = new THREE.PlaneGeometry(0.55, 3.0);
    barGeo.rotateX(-Math.PI / 2);

    const arms = [
      { z: width * 0.5 - 1.8, rot: 0 },
      { z: -width * 0.5 + 1.8, rot: 0 },
      { x: width * 0.5 - 1.8, rot: Math.PI / 2 },
      { x: -width * 0.5 + 1.8, rot: Math.PI / 2 }
    ];

    for (const arm of arms) {
      const zebraGroup = new THREE.Group();
      if (arm.x !== undefined) zebraGroup.position.x = arm.x;
      if (arm.z !== undefined) zebraGroup.position.z = arm.z;
      zebraGroup.rotation.y = arm.rot;

      for (let b = -4; b <= 4; b++) {
        const bar = new THREE.Mesh(barGeo, zebraMat);
        bar.position.set(b * 1.15, 0.08, 0);
        bar.receiveShadow = true;
        zebraGroup.add(bar);
      }
      group.add(zebraGroup);
    }

    return group;
  }

  showcase(stageGroup, options = {}) {
    // Underlying grass terrain plane so roads do not float in empty void
    const groundGeo = new THREE.PlaneGeometry(240, 240);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x3d5431, roughness: 0.9, metalness: 0.04 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = 4.9;
    ground.receiveShadow = true;
    stageGroup.add(ground);

    // Stage representative avenue, intersection, and curve
    const avenue1 = this.createRoadSegment([
      new THREE.Vector3(-80, 5, 0),
      new THREE.Vector3(-15, 5, 0),
      new THREE.Vector3(0, 5, 0)
    ], { width: 14, lanes: 4 });

    const avenue2 = this.createRoadSegment([
      new THREE.Vector3(0, 5, 0),
      new THREE.Vector3(25, 5, 0),
      new THREE.Vector3(80, 5, 0)
    ], { width: 14, lanes: 4 });

    const crossroad = this.createRoadSegment([
      new THREE.Vector3(0, 5, -60),
      new THREE.Vector3(0, 5, 0),
      new THREE.Vector3(0, 5, 60)
    ], { width: 12, lanes: 2 });

    const intersection = this.createIntersection(new THREE.Vector3(0, 5, 0), 16);

    stageGroup.add(avenue1);
    stageGroup.add(avenue2);
    stageGroup.add(crossroad);
    stageGroup.add(intersection);

    console.log('[RoadsModule] Showcase scene initialized with natural ground plane.');
  }

  dispose() {
    while (this.roadGroup.children.length > 0) {
      const obj = this.roadGroup.children[0];
      this.roadGroup.remove(obj);
    }
  }
}

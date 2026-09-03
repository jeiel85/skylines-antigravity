# Cities: Skylines II Engine Architecture Specification

## 1. System Overview & Philosophy

The engine is built on **Three.js (latest release)** and **Vite** using strict plain ES modules. The overarching aesthetic goal is **AAA fidelity** matching *Cities: Skylines II*:
- Physically accurate PBR materials (Albedo, Normal, Roughness, Metalness, Ambient Occlusion, Emissive).
- Physically plausible atmospheric scattering, sun/sky light, cascaded shadow maps, and volumetric depth.
- Living night city with illuminated windows, warm streetlamps, realistic vehicle headlights and taillights.
- High-detail procedural road networks with believable asphalt wear, curbs, lane striping, crosswalks, and seamless intersections.
- Zero programmer art: all surfaces use high-detail procedural synthesis or verified CC0 PBR textures.

---

## 2. World Coordinate System & Units

- **Length Unit**: 1 unit = 1.0 metre.
- **Orientation**: Right-handed Cartesian coordinate system:
  - `+X` = East
  - `+Y` = Up (Elevation / Altitude)
  - `+Z` = South
- **Grid Standard**:
  - Zoning cells: $8.0\text{ m} \times 8.0\text{ m}$ ($1 \times 1$ CS2 zone unit).
  - Standard street lane width: $3.5\text{ m}$.
  - Sidewalk width: $2.5\text{ m}$.
  - Floor height standard: $3.5\text{ m}$ per building story.

---

## 3. Seeded Determinism

All procedural generation, simulation decisions, traffic spawning, and building variations must run through a centralized seeded PRNG (`src/core/PRNG.js`).
- **Rule**: Direct use of `Math.random()` in simulation, procedural geometry, or layout code is strictly prohibited.
- **Algorithm**: Seeded Mulberry32 with high-entropy state hashing.
- Given the same seed and input actions, the simulation and world generation are bit-exact reproducible across runs.

---

## 4. Performance Budget (Target: 1080p @ $\ge 50$ FPS)

| Metric | Upper Bound | Notes |
| :--- | :--- | :--- |
| **Frame Rate** | $\ge 50$ FPS | Measured over rolling 60 frames under full demo city load |
| **Draw Calls** | $\le 1,500$ | Aggressive instancing for buildings, props, trees, and vehicles |
| **Triangle Count** | $\le 2,500,000$ | LOD & instanced mesh geometry optimizations |
| **VRAM Footprint** | $\le 1.2\text{ GB}$ | Procedural textures generated into compressed/canvas mipmaps |
| **Console Errors** | **0** | Zero runtime errors or warnings permitted in production/test |

---

## 5. Asset & Material Policy

- **Asset Standard**: CC0 (Public Domain) or procedural PBR synthesis only.
- **Textures**: Every material must supply:
  - `map` (Albedo / Diffuse in sRGB color space)
  - `normalMap` (Tangent-space normal in Linear space)
  - `roughnessMap` (Per-pixel surface micro-roughness)
  - `metalnessMap` (Dielectric vs metallic classification)
  - `aoMap` (Ambient occlusion for contact shadows)
  - `emissiveMap` (For night illumination: windows, streetlights, brake lights)
- **Zero Programmer Art Rule**: Flat untextured polygons, saturated primary colors, unshaded primitives, and un-beveled sharp cubes are disqualified by critic agents.

---

## 6. Subsystems & Directory Structure

Each subsystem is strictly isolated in its own folder under `src/modules/<subsystem>/`:

```
src/
├── core/                       # INTEGRATOR ONLY: Shared world state & engine loop
│   ├── World.js                # Canonical world state (roads, zones, buildings, sim)
│   ├── EventBus.js             # Decoupled pub/sub event bus
│   ├── PRNG.js                 # Deterministic seeded random number generator
│   ├── Engine.js               # WebGLRenderer, ticker, ACES tone mapping, shadow setup
│   ├── CameraController.js     # RTS/isometric camera with smooth damping & presets
│   ├── TimeOfDay.js            # Astronomical solar position, diurnal lighting transitions
│   ├── Metrics.js              # Real-time metrics reporter (draw calls, triangles, FPS)
│   └── AssetManager.js         # Procedural PBR texture & material generator
└── modules/
    ├── terrain/                # PBR heightmap terrain, erosion, river/water shader
    ├── environment/            # Atmospheric Rayleigh/Mie sky, sun, clouds, fog, stars
    ├── roads/                  # Spline roads, dynamic intersections, markings, curbs
    ├── zoning/                 # CS2 8x8m RCI zoning grid, frontage detection, decals
    ├── buildings/              # Procedural PBR architecture (low/mid/high/skyscrapers)
    ├── props/                  # Instanced foliage, trees, street furniture, signals
    ├── traffic/                # Lane-graph pathfinding, vehicle AI, headlights/brakes
    ├── effects/                # Post-processing: ACESFilmic, Bloom, SSAO, Vignette
    ├── simulation/             # Deterministic RCI economic model, growth, budget
    ├── tools/                  # Interactive road builder, zoning brush, bulldozer, query
    ├── ui/                     # CS2-inspired dark glass HUD, demand meters, inspector
    ├── audio/                  # Web Audio procedural soundscape, traffic rumble, clicks
    └── demo_city/              # "New Antigravity Bay" master showcase metropolis
```

---

## 7. Shared World Data Model (`World.js`)

`World.js` acts as the single source of truth:
```javascript
class World {
  constructor(seed = 1337) {
    this.seed = seed;
    this.prng = new PRNG(seed);
    this.eventBus = new EventBus();
    
    // Spatial & Subsystem Registries
    this.terrain = { heightmap: null, waterLevel: 0 };
    this.roads = { nodes: new Map(), edges: new Map(), graph: null };
    this.zoning = { cells: new Map() }; // key: "x,z" -> { type, density, roadId }
    this.buildings = new Map(); // id -> { type, zoneType, mesh, occupants, level }
    this.traffic = { vehicles: new Map(), laneSegments: [] };
    this.simulation = {
      population: 0,
      funds: 500000,
      happiness: 85,
      demand: { residential: 0.6, commercial: 0.4, industrial: 0.5 },
      time: { day: 1, hour: 12, minute: 0, timeScale: 1.0 }
    };
  }
}
```

---

## 8. Public Subsystem Module API Contract

Every module under `src/modules/<name>/index.js` must export a class or factory implementing this interface:

```javascript
export class SubsystemModule {
  /**
   * Initializes the subsystem with world state and engine reference.
   * @param {World} world 
   * @param {Engine} engine 
   */
  init(world, engine) {}

  /**
   * Called on every render frame.
   * @param {number} delta - Delta time in seconds since last frame
   * @param {number} simTick - Current accumulated simulation tick count
   */
  update(delta, simTick) {}

  /**
   * Stages an isolated, representative scene of just this module for verification & showcase.
   * Must set up its own representative assets in the stage group.
   * @param {THREE.Group} stageGroup - Clean scene group provided by the harness
   * @param {Object} options - { timeOfDay: number, cameraPreset: string }
   */
  showcase(stageGroup, options) {}

  /**
   * Cleanup and dispose all GPU geometries, materials, and listeners.
   */
  dispose() {}
}
```

---

## 9. Event Bus Specifications

Subsystems communicate via asynchronous, decoupled events:

| Event Name | Payload | Emitted By | Listened By |
| :--- | :--- | :--- | :--- |
| `road:created` | `{ roadId, points, type, lanes }` | `roads`, `tools` | `zoning`, `traffic`, `audio` |
| `road:removed` | `{ roadId }` | `tools` | `zoning`, `traffic`, `roads` |
| `zone:painted` | `{ cellKey, zoneType, density }` | `tools`, `zoning` | `buildings`, `simulation` |
| `building:constructed` | `{ buildingId, position, zoneType, occupants }`| `buildings` | `simulation`, `traffic`, `props` |
| `building:demolished` | `{ buildingId }` | `tools`, `buildings` | `simulation`, `traffic` |
| `sim:tick` | `{ population, demand, happiness, funds }` | `simulation` | `ui`, `buildings` |
| `time:updated` | `{ hour, minute, sunAngle, isNight }` | `TimeOfDay` | `environment`, `buildings`, `props`, `effects` |
| `tool:activated` | `{ toolName }` | `ui`, `tools` | `tools`, `zoning` |

---

## 10. Automated Verification & Showcase Protocol

1. **Showcase Modes**:
   Accessible via query parameters: `?showcase=<subsystem>&tod=<hour>&cam=<preset>`
   - Example: `http://localhost:5173/?showcase=roads&tod=17&cam=intersection`
   - Example: `http://localhost:5173/?showcase=buildings&tod=0&cam=skyline`
   - Example: `http://localhost:5173/?showcase=demo_city&tod=20&cam=bay_overview`

2. **Readiness Signal**:
   When scene rendering, post-processing, and shader compilation stabilize, the engine sets:
   ```javascript
   window.__READY__ = true;
   window.__SIM_METRICS__ = {
     fps: 60,
     drawCalls: 182,
     triangles: 412000,
     errors: []
   };
   ```

3. **Critic Scoring Matrix (0–10 Scale)**:
   - **10.0**: Indistinguishable from Cities: Skylines II high-preset screenshot.
   - **8.5**: AAA visual quality with minor nitpicks (Pass threshold).
   - **7.0**: Good indie city builder (Fail).
   - **5.0**: Programmer art / basic primitives (Fail).

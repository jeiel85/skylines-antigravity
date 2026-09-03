import { PRNG } from './PRNG.js';
import { EventBus } from './EventBus.js';

/**
 * Canonical Shared World Data Model
 * Single source of truth for all subsystems and simulation algorithms.
 */
export class World {
  /**
   * @param {number|string} seed 
   */
  constructor(seed = 1337) {
    this.seed = seed;
    this.prng = new PRNG(seed);
    this.eventBus = new EventBus();

    // Terrain state
    this.terrain = {
      waterLevel: 4.0,
      gridResolution: 256,
      worldSize: 1200,
      // Default procedural height function (can be overridden by terrain module)
      getHeightAt: (x, z) => {
        // Natural gentle coastal valley with mountains in background
        const distFromCenter = Math.hypot(x, z);
        const river = Math.sin(x * 0.008) * 60;
        const valley = Math.sin(z * 0.005 + river * 0.01) * 8;
        const hills = Math.sin(x * 0.015) * Math.cos(z * 0.015) * 12;
        const coastFactor = Math.max(0, (x + 300) / 600);
        return Math.max(0, 8 + valley + hills) * coastFactor;
      }
    };

    // Road Network Graph
    this.roads = {
      nodes: new Map(), // id -> { id, x, y, z, connectedRoadIds: [] }
      edges: new Map(), // id -> { id, fromNodeId, toNodeId, points: [], type, lanes, speedLimit }
      laneGraph: [] // Segments for vehicle pathfinding
    };

    // Zoning Grid (8m x 8m cells)
    this.zoning = {
      cellSize: 8.0,
      cells: new Map() // key: `${cellX},${cellZ}` -> { type, density, roadId, occupied }
    };

    // Buildings Registry
    this.buildings = new Map(); // id -> { id, position, zoneType, density, occupants, level, mesh }

    // Props Registry
    this.props = new Map(); // id -> { id, type, position, rotation }

    // Traffic State
    this.traffic = {
      vehicles: new Map() // id -> { id, type, laneIndex, progress, speed, mesh }
    };

    // Deterministic City Simulation State
    this.simulation = {
      population: 4250,
      funds: 1250000,
      happiness: 88,
      demand: {
        residential: 0.65,
        commercial: 0.45,
        industrial: 0.50
      },
      employment: 0.94,
      taxRate: 0.11,
      stats: {
        powerSupply: 100,
        waterSupply: 100,
        trafficFlow: 89
      }
    };
  }

  /**
   * Helper to compute cell coordinates for a world position
   */
  worldToZoneCell(x, z) {
    const s = this.zoning.cellSize;
    return {
      cellX: Math.floor((x + s * 0.5) / s),
      cellZ: Math.floor((z + s * 0.5) / s)
    };
  }

  zoneCellToWorld(cellX, cellZ) {
    const s = this.zoning.cellSize;
    const x = cellX * s;
    const z = cellZ * s;
    const y = this.terrain.getHeightAt(x, z);
    return { x, y, z };
  }

  reset() {
    this.prng.reset();
    this.roads.nodes.clear();
    this.roads.edges.clear();
    this.zoning.cells.clear();
    this.buildings.clear();
    this.props.clear();
    this.traffic.vehicles.clear();
  }
}

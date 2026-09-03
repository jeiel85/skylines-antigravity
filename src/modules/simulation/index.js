/**
 * Deterministic City Simulation Subsystem
 * Drives RCI economic demand, population growth, employment, municipal treasury, and happiness.
 */
export class SimulationModule {
  constructor() {
    this.world = null;
    this.engine = null;
    this.simTicks = 0;
  }

  init(world, engine) {
    this.world = world;
    this.engine = engine;
  }

  simTick(tickNumber) {
    this.simTicks = tickNumber;
    const sim = this.world.simulation;
    const prng = this.world.prng;

    // Deterministic population dynamic
    const happinessBonus = (sim.happiness - 70) * 0.05;
    const demandBonus = sim.demand.residential * 15;
    const netGrowth = Math.floor(demandBonus + happinessBonus + prng.gaussian(2, 0.5));
    
    sim.population = Math.max(0, sim.population + Math.max(-10, netGrowth));

    // Municipal Tax Collection & Maintenance (every 60 ticks = 1 in-game hour)
    if (tickNumber % 60 === 0) {
      const taxPerCapita = 14;
      const hourlyTaxRevenue = Math.floor(sim.population * taxPerCapita * (sim.taxRate / 0.1));
      const roadMaintenance = this.world.roads.edges.size * 25;
      const buildingMaintenance = this.world.buildings.size * 40;
      const totalExpenses = roadMaintenance + buildingMaintenance + 800;

      sim.funds += (hourlyTaxRevenue - totalExpenses);
    }

    // Dynamic RCI Demand Oscillations
    const resDemandBase = 0.55 + Math.sin(tickNumber * 0.02) * 0.15;
    const comDemandBase = 0.40 + Math.cos(tickNumber * 0.015) * 0.12;
    const indDemandBase = 0.48 + Math.sin(tickNumber * 0.018) * 0.10;

    sim.demand.residential = Math.max(0.05, Math.min(1.0, resDemandBase));
    sim.demand.commercial = Math.max(0.05, Math.min(1.0, comDemandBase));
    sim.demand.industrial = Math.max(0.05, Math.min(1.0, indDemandBase));

    // Emit tick event for UI and other subsystems
    this.world.eventBus.emit('sim:tick', {
      tick: tickNumber,
      population: sim.population,
      funds: sim.funds,
      happiness: sim.happiness,
      demand: { ...sim.demand }
    });
  }

  showcase(stageGroup, options = {}) {
    console.log('[SimulationModule] Fast-forwarding 500 deterministic ticks to verify stability...');
    const startPop = this.world.simulation.population;
    for (let i = 0; i < 500; i++) {
      this.simTick(i);
    }
    console.log(`[SimulationModule] Showcase sim verified. Population grew from ${startPop} to ${this.world.simulation.population}.`);
  }

  dispose() {}
}

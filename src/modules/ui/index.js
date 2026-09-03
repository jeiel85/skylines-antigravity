/**
 * AAA Cities: Skylines II–Inspired HUD & UI Subsystem
 * Translucent frosted-glass control bars, RCI demand indicators, time controls, and tools.
 */
export class UIModule {
  constructor() {
    this.world = null;
    this.engine = null;
    this.container = null;
    this.unsubSim = null;
    this.unsubTime = null;
  }

  init(world, engine) {
    this.world = world;
    this.engine = engine;
    this.container = document.getElementById('ui-container');

    this.mountHUD();

    this.unsubSim = this.world.eventBus.on('sim:tick', (data) => this.updateSimDisplay(data));
    this.unsubTime = this.world.eventBus.on('time:updated', (state) => this.updateTimeDisplay(state));
  }

  mountHUD() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div id="skylines-hud" style="
        width: 100%;
        height: 100%;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 16px 20px;
        box-sizing: border-box;
      ">
        <!-- Top Status Header Bar -->
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(11, 16, 25, 0.78);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 10px 22px;
          color: #f0f4f8;
          pointer-events: auto;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
        ">
          <!-- City Name & Level -->
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="
              width: 10px;
              height: 10px;
              border-radius: 50%;
              background: #00d26a;
              box-shadow: 0 0 10px #00d26a;
            "></div>
            <div>
              <div style="font-weight: 700; font-size: 15px; letter-spacing: 0.5px;">NEW ANTIGRAVITY BAY</div>
              <div style="font-size: 11px; color: #8fa0b5; text-transform: uppercase;">Metropolis Stage 4</div>
            </div>
          </div>

          <!-- RCI Demand Bars -->
          <div style="display: flex; align-items: center; gap: 14px; background: rgba(0,0,0,0.3); padding: 6px 14px; border-radius: 8px;">
            <span style="font-size: 11px; font-weight: 600; color: #8fa0b5;">DEMAND</span>
            <div style="display: flex; gap: 6px; align-items: flex-end; height: 24px;">
              <!-- R Bar -->
              <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                <div id="demand-r" style="width: 8px; height: 18px; background: #00e676; border-radius: 2px; transition: height 0.3s;"></div>
                <span style="font-size: 9px; font-weight: bold; color: #00e676;">R</span>
              </div>
              <!-- C Bar -->
              <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                <div id="demand-c" style="width: 8px; height: 12px; background: #29b6f6; border-radius: 2px; transition: height 0.3s;"></div>
                <span style="font-size: 9px; font-weight: bold; color: #29b6f6;">C</span>
              </div>
              <!-- I Bar -->
              <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                <div id="demand-i" style="width: 8px; height: 15px; background: #ffa726; border-radius: 2px; transition: height 0.3s;"></div>
                <span style="font-size: 9px; font-weight: bold; color: #ffa726;">I</span>
              </div>
            </div>
          </div>

          <!-- Population & Happiness -->
          <div style="display: flex; align-items: center; gap: 24px;">
            <div>
              <div style="font-size: 10px; color: #8fa0b5;">POPULATION</div>
              <div id="hud-population" style="font-size: 15px; font-weight: 700; color: #ffffff;">4,250 <span style="font-size: 11px; color: #00d26a;">▲</span></div>
            </div>
            <div>
              <div style="font-size: 10px; color: #8fa0b5;">HAPPINESS</div>
              <div id="hud-happiness" style="font-size: 15px; font-weight: 700; color: #ffffff;">88% <span style="font-size: 12px;">😊</span></div>
            </div>
            <div>
              <div style="font-size: 10px; color: #8fa0b5;">TREASURY</div>
              <div id="hud-funds" style="font-size: 15px; font-weight: 700; color: #5ce1e6;">₡ 1,250,000</div>
            </div>
          </div>

          <!-- Clock & Simulation Speed -->
          <div style="display: flex; align-items: center; gap: 14px;">
            <div id="hud-time" style="font-size: 15px; font-weight: 600; font-variant-numeric: tabular-nums;">12:00</div>
            <div style="display: flex; gap: 4px;">
              <button id="btn-speed-pause" style="background: rgba(255,255,255,0.1); border: none; color: #fff; padding: 4px 8px; border-radius: 4px; cursor: pointer;">⏸</button>
              <button id="btn-speed-1x" style="background: #2563eb; border: none; color: #fff; padding: 4px 8px; border-radius: 4px; cursor: pointer;">1x</button>
              <button id="btn-speed-3x" style="background: rgba(255,255,255,0.1); border: none; color: #fff; padding: 4px 8px; border-radius: 4px; cursor: pointer;">3x</button>
            </div>
          </div>
        </div>

        <!-- Bottom Construction & Management Dock -->
        <div style="
          display: flex;
          justify-content: center;
          gap: 10px;
          pointer-events: auto;
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(11, 16, 25, 0.82);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 14px;
            padding: 8px 14px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.4);
          ">
            <button class="skylines-tool-btn active" data-tool="inspect" style="background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;">
              🔍 Inspect
            </button>
            <button class="skylines-tool-btn" data-tool="roads" style="background: rgba(255,255,255,0.06); border: 1px solid transparent; color: #cbd5e1; padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;">
              🛣️ Roads
            </button>
            <button class="skylines-tool-btn" data-tool="zoning" style="background: rgba(255,255,255,0.06); border: 1px solid transparent; color: #cbd5e1; padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;">
              🟩 Zoning
            </button>
            <button class="skylines-tool-btn" data-tool="services" style="background: rgba(255,255,255,0.06); border: 1px solid transparent; color: #cbd5e1; padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;">
              🏢 Services
            </button>
            <button class="skylines-tool-btn" data-tool="bulldoze" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.2); color: #f87171; padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;">
              🚜 Bulldoze
            </button>
          </div>
        </div>
      </div>
    `;

    this.bindButtons();
  }

  bindButtons() {
    const pauseBtn = document.getElementById('btn-speed-pause');
    const btn1x = document.getElementById('btn-speed-1x');
    const btn3x = document.getElementById('btn-speed-3x');

    if (pauseBtn) {
      pauseBtn.onclick = () => {
        if (this.engine) this.engine.time.paused = !this.engine.time.paused;
        pauseBtn.style.background = this.engine.time.paused ? '#ef4444' : 'rgba(255,255,255,0.1)';
      };
    }
    if (btn1x) {
      btn1x.onclick = () => {
        if (this.engine) {
          this.engine.time.paused = false;
          this.engine.time.timeScale = 1.0;
        }
        btn1x.style.background = '#2563eb';
        if (btn3x) btn3x.style.background = 'rgba(255,255,255,0.1)';
      };
    }
    if (btn3x) {
      btn3x.onclick = () => {
        if (this.engine) {
          this.engine.time.paused = false;
          this.engine.time.timeScale = 3.5;
        }
        btn3x.style.background = '#2563eb';
        if (btn1x) btn1x.style.background = 'rgba(255,255,255,0.1)';
      };
    }

    const toolButtons = document.querySelectorAll('.skylines-tool-btn');
    toolButtons.forEach(btn => {
      btn.onclick = () => {
        toolButtons.forEach(b => {
          b.style.background = 'rgba(255,255,255,0.06)';
          b.style.border = '1px solid transparent';
          b.style.color = '#cbd5e1';
        });
        btn.style.background = 'rgba(255,255,255,0.14)';
        btn.style.border = '1px solid rgba(255,255,255,0.2)';
        btn.style.color = '#ffffff';

        const toolName = btn.dataset.tool;
        this.world.eventBus.emit('tool:activated', { toolName });
      };
    });
  }

  updateSimDisplay(data) {
    const popEl = document.getElementById('hud-population');
    const fundsEl = document.getElementById('hud-funds');
    const happyEl = document.getElementById('hud-happiness');
    const rEl = document.getElementById('demand-r');
    const cEl = document.getElementById('demand-c');
    const iEl = document.getElementById('demand-i');

    if (popEl) popEl.innerHTML = `${data.population.toLocaleString()} <span style="font-size: 11px; color: #00d26a;">▲</span>`;
    if (fundsEl) fundsEl.textContent = `₡ ${data.funds.toLocaleString()}`;
    if (happyEl) happyEl.innerHTML = `${Math.round(data.happiness)}% <span style="font-size: 12px;">😊</span>`;

    if (rEl) rEl.style.height = `${Math.max(4, data.demand.residential * 24)}px`;
    if (cEl) cEl.style.height = `${Math.max(4, data.demand.commercial * 24)}px`;
    if (iEl) iEl.style.height = `${Math.max(4, data.demand.industrial * 24)}px`;
  }

  updateTimeDisplay(state) {
    const timeEl = document.getElementById('hud-time');
    if (!timeEl) return;
    const hours = Math.floor(state.hour);
    const mins = Math.floor((state.hour % 1) * 60);
    timeEl.textContent = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  showcase(stageGroup, options = {}) {
    console.log('[UIModule] Showcase mounted.');
  }

  dispose() {
    if (this.unsubSim) this.unsubSim();
    if (this.unsubTime) this.unsubTime();
    if (this.container) this.container.innerHTML = '';
  }
}

/**
 * AAA Cities: Skylines II–Inspired HUD & UI Subsystem
 * Translucent frosted-glass control bars, RCI demand indicators, time controls,
 * and authentic Gwangmyeong-si GIS District Map Overlay with Landmark Teleports.
 */
export class UIModule {
  constructor() {
    this.world = null;
    this.engine = null;
    this.container = null;
    this.unsubSim = null;
    this.unsubTime = null;
    this.isMapOpen = false;
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
          background: rgba(11, 16, 25, 0.82);
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
              <div style="font-weight: 700; font-size: 15px; letter-spacing: 0.5px;">광명시 (GWANGMYEONG-SI)</div>
              <div style="font-size: 11px; color: #8fa0b5; text-transform: uppercase;">철산 · 하안 · 소하 · 일직 KTX 역세권</div>
            </div>
            <!-- Map Toggle Button -->
            <button id="btn-toggle-map" style="
              margin-left: 12px;
              background: #2563eb;
              border: 1px solid rgba(255,255,255,0.2);
              color: #ffffff;
              padding: 6px 14px;
              border-radius: 8px;
              font-size: 12px;
              font-weight: 700;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 6px;
              transition: background 0.2s;
            ">
              🗺️ 지도 보기 (GIS Map)
            </button>
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
              <div id="hud-population" style="font-size: 15px; font-weight: 700; color: #ffffff;">283,500 <span style="font-size: 11px; color: #00d26a;">▲</span></div>
            </div>
            <div>
              <div style="font-size: 10px; color: #8fa0b5;">HAPPINESS</div>
              <div id="hud-happiness" style="font-size: 15px; font-weight: 700; color: #ffffff;">92% <span style="font-size: 12px;">😊</span></div>
            </div>
            <div>
              <div style="font-size: 10px; color: #8fa0b5;">TREASURY</div>
              <div id="hud-funds" style="font-size: 15px; font-weight: 700; color: #5ce1e6;">₡ 3,450,000</div>
            </div>
          </div>

          <!-- Clock & Simulation Speed -->
          <div style="display: flex; align-items: center; gap: 14px;">
            <div id="hud-time" style="font-size: 15px; font-weight: 600; font-variant-numeric: tabular-nums;">14:00</div>
            <div style="display: flex; gap: 4px;">
              <button id="btn-speed-pause" style="background: rgba(255,255,255,0.1); border: none; color: #fff; padding: 4px 8px; border-radius: 4px; cursor: pointer;">⏸</button>
              <button id="btn-speed-1x" style="background: #2563eb; border: none; color: #fff; padding: 4px 8px; border-radius: 4px; cursor: pointer;">1x</button>
              <button id="btn-speed-3x" style="background: rgba(255,255,255,0.1); border: none; color: #fff; padding: 4px 8px; border-radius: 4px; cursor: pointer;">3x</button>
            </div>
          </div>
        </div>

        <!-- Interactive Gwangmyeong GIS Administrative Map Modal -->
        <div id="gwangmyeong-map-modal" style="
          display: none;
          pointer-events: auto;
          position: absolute;
          top: 75px;
          left: 50%;
          transform: translateX(-50%);
          width: 820px;
          max-width: 95vw;
          background: rgba(13, 19, 30, 0.94);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
          padding: 20px 24px;
          color: #f1f5f9;
          z-index: 1000;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 20px;">🗺️</span>
              <div>
                <div style="font-size: 16px; font-weight: 700;">광명시 행정구역도 및 랜드마크 안내 (GIS Map)</div>
                <div style="font-size: 11px; color: #94a3b8;">원하는 랜드마크를 클릭하면 카메라가 해당 위치로 즉시 비행 이동합니다.</div>
              </div>
            </div>
            <button id="btn-close-map" style="background: rgba(255,255,255,0.1); border: none; color: #cbd5e1; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-size: 14px;">✕</button>
          </div>

          <!-- SVG Geographic Map Representation of Gwangmyeong-si -->
          <div style="display: flex; gap: 20px; align-items: center;">
            <div style="flex: 1.2; background: rgba(5, 8, 15, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px;">
              <svg viewBox="0 0 400 480" style="width: 100%; height: auto;">
                <!-- Mokgamcheon (목감천) on NW -->
                <path d="M 50 20 Q 90 90 120 140" fill="none" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>
                <text x="50" y="45" fill="#38bdf8" font-size="10" font-weight="bold">목감천</text>

                <!-- Anyangcheon (안양천) on East -->
                <path d="M 280 20 Q 260 140 270 240 T 290 460" fill="none" stroke="#38bdf8" stroke-width="7" stroke-linecap="round"/>
                <text x="295" y="60" fill="#38bdf8" font-size="11" font-weight="bold">안양천 (Anyangcheon)</text>

                <!-- 5 Anyangcheon Bridges -->
                <!-- 1. Gwangmyeong Bridge -->
                <line x1="240" y1="75" x2="280" y2="75" stroke="#f59e0b" stroke-width="3"/>
                <text x="285" y="80" fill="#fcd34d" font-size="9">① 광명교</text>
                <!-- 2. Cheolsan Bridge -->
                <line x1="235" y1="140" x2="280" y2="140" stroke="#f59e0b" stroke-width="4"/>
                <text x="285" y="145" fill="#fcd34d" font-size="10" font-weight="bold">② 철산교 (Cheolsan Br.)</text>
                <!-- 3. Geumcheon Bridge -->
                <line x1="240" y1="215" x2="285" y2="215" stroke="#f59e0b" stroke-width="3"/>
                <text x="290" y="220" fill="#fcd34d" font-size="9">③ 금천교</text>
                <!-- 4. Siheung Bridge -->
                <line x1="245" y1="290" x2="290" y2="290" stroke="#f59e0b" stroke-width="3"/>
                <text x="295" y="295" fill="#fcd34d" font-size="9">④ 시흥대교</text>
                <!-- 5. Kia Bridge -->
                <line x1="250" y1="350" x2="295" y2="350" stroke="#f59e0b" stroke-width="3"/>
                <text x="300" y="355" fill="#fcd34d" font-size="9">⑤ 기아대교</text>

                <!-- Central Spine: 오리로 (Ori-ro) -->
                <path d="M 180 50 L 180 430" fill="none" stroke="#94a3b8" stroke-width="3" stroke-dasharray="4,4"/>
                <text x="185" y="240" fill="#cbd5e1" font-size="9" transform="rotate(90 185 240)">오리로 (Ori-ro Main Spine)</text>

                <!-- Mountain 1: 도덕산 (183m) & Y-Bridge -->
                <circle cx="120" cy="110" r="28" fill="#14532d" opacity="0.6"/>
                <text x="120" y="105" text-anchor="middle" fill="#86efac" font-size="11" font-weight="bold">⛰️ 도덕산 (183m)</text>
                <text x="120" y="122" text-anchor="middle" fill="#f87171" font-size="9" font-weight="bold">도덕산 출렁다리</text>

                <!-- District: 광명동 (North-West) -->
                <rect x="50" y="60" width="55" height="40" rx="4" fill="#334155" opacity="0.7"/>
                <text x="77" y="85" text-anchor="middle" fill="#f8fafc" font-size="10">광명동</text>

                <!-- District: 철산동 (North-East) -->
                <rect x="175" y="100" width="75" height="60" rx="4" fill="#1e3a8a" opacity="0.6"/>
                <text x="212" y="130" text-anchor="middle" fill="#93c5fd" font-size="11" font-weight="bold">철산동</text>
                <text x="212" y="145" text-anchor="middle" fill="#bfdbfe" font-size="9">철산주공 1~13단지</text>

                <!-- Mountain 2: 구름산 (240m) -->
                <circle cx="110" cy="220" r="35" fill="#14532d" opacity="0.6"/>
                <text x="110" y="215" text-anchor="middle" fill="#86efac" font-size="11" font-weight="bold">⛰️ 구름산 (240m)</text>
                <text x="110" y="230" text-anchor="middle" fill="#bbf7d0" font-size="9">광명 최고봉</text>

                <!-- District: 하안동 (Central-East) -->
                <rect x="175" y="185" width="75" height="65" rx="4" fill="#1e3a8a" opacity="0.6"/>
                <text x="212" y="215" text-anchor="middle" fill="#93c5fd" font-size="11" font-weight="bold">하안동</text>
                <text x="212" y="230" text-anchor="middle" fill="#bfdbfe" font-size="9">하안주공 1~12단지</text>

                <!-- Mountain 3: 가학산 (220m) & 광명동굴 -->
                <circle cx="95" cy="320" r="28" fill="#14532d" opacity="0.6"/>
                <text x="95" y="315" text-anchor="middle" fill="#86efac" font-size="11" font-weight="bold">⛰️ 가학산 (220m)</text>
                <text x="95" y="330" text-anchor="middle" fill="#fbbf24" font-size="9" font-weight="bold">⛏️ 광명동굴</text>

                <!-- District: 소하동 & 기아 오토랜드 -->
                <rect x="175" y="280" width="80" height="55" rx="4" fill="#374151" opacity="0.6"/>
                <text x="215" y="305" text-anchor="middle" fill="#f3f4f6" font-size="11" font-weight="bold">소하동</text>
                <text x="215" y="320" text-anchor="middle" fill="#fb923c" font-size="9">기아 오토랜드 광명</text>

                <!-- Mountain 4: 서독산 (180m) -->
                <circle cx="120" cy="405" r="24" fill="#14532d" opacity="0.6"/>
                <text x="120" y="410" text-anchor="middle" fill="#86efac" font-size="10" font-weight="bold">⛰️ 서독산 (180m)</text>

                <!-- District: 일직동 & KTX 광명역세권 -->
                <rect x="160" y="365" width="115" height="75" rx="4" fill="#4c1d95" opacity="0.6"/>
                <text x="217" y="390" text-anchor="middle" fill="#c4b5fd" font-size="11" font-weight="bold">일직동 (KTX 역세권)</text>
                <text x="217" y="405" text-anchor="middle" fill="#e9d5ff" font-size="9">KTX 광명역 · 유플래닛</text>
                <text x="217" y="420" text-anchor="middle" fill="#fde047" font-size="9">이케아 광명점 · 코스트코</text>
              </svg>
            </div>

            <!-- Landmark Teleport Buttons Panel -->
            <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
              <div style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">📍 랜드마크 즉시 비행 이동</div>
              
              <button class="btn-landmark-teleport" data-preset="cheolsan_apartments" style="background: rgba(30, 58, 138, 0.45); border: 1px solid #3b82f6; color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <span>🏢 <b>철산주공 아파트</b> (101~106동)</span>
                <span style="font-size: 10px; color: #93c5fd;">이동 ▶</span>
              </button>

              <button class="btn-landmark-teleport" data-preset="ktx_station" style="background: rgba(76, 29, 149, 0.45); border: 1px solid #8b5cf6; color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <span>🚄 <b>KTX 광명역 메가터미널</b></span>
                <span style="font-size: 10px; color: #c4b5fd;">이동 ▶</span>
              </button>

              <button class="btn-landmark-teleport" data-preset="ikea_costco" style="background: rgba(234, 179, 8, 0.2); border: 1px solid #eab308; color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <span>🛍️ <b>이케아 & 코스트코 광명점</b></span>
                <span style="font-size: 10px; color: #fde047;">이동 ▶</span>
              </button>

              <button class="btn-landmark-teleport" data-preset="dodeoksan_bridge" style="background: rgba(220, 38, 38, 0.25); border: 1px solid #ef4444; color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <span>🌉 <b>도덕산 Y자형 출렁다리</b></span>
                <span style="font-size: 10px; color: #fca5a5;">이동 ▶</span>
              </button>

              <button class="btn-landmark-teleport" data-preset="anyangcheon_bridge" style="background: rgba(2, 132, 199, 0.25); border: 1px solid #38bdf8; color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <span>🌊 <b>안양천 & 철산교</b> (서울 연결로)</span>
                <span style="font-size: 10px; color: #bae6fd;">이동 ▶</span>
              </button>

              <button class="btn-landmark-teleport" data-preset="gwangmyeong_cave" style="background: rgba(217, 119, 6, 0.25); border: 1px solid #f59e0b; color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <span>⛏️ <b>가학산 광명동굴</b> (테마파크)</span>
                <span style="font-size: 10px; color: #fde68a;">이동 ▶</span>
              </button>

              <button class="btn-landmark-teleport" data-preset="downtown_night" style="background: rgba(15, 23, 42, 0.6); border: 1px solid #64748b; color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <span>🌃 <b>일직동 역세권 빌딩 야경</b></span>
                <span style="font-size: 10px; color: #cbd5e1;">이동 ▶</span>
              </button>
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
            <button class="skylines-tool-btn" data-tool="bulldoze" style="background: rgba(255,255,255,0.06); border: 1px solid transparent; color: #f87171; padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;">
              🚜 Bulldoze
            </button>
          </div>
        </div>
      </div>
    `;

    this.bindHUDButtons();
  }

  bindHUDButtons() {
    const btnPause = document.getElementById('btn-speed-pause');
    const btn1x = document.getElementById('btn-speed-1x');
    const btn3x = document.getElementById('btn-speed-3x');
    const btnToggleMap = document.getElementById('btn-toggle-map');
    const btnCloseMap = document.getElementById('btn-close-map');
    const mapModal = document.getElementById('gwangmyeong-map-modal');

    if (btnToggleMap && mapModal) {
      btnToggleMap.onclick = () => {
        this.isMapOpen = !this.isMapOpen;
        mapModal.style.display = this.isMapOpen ? 'block' : 'none';
      };
    }

    if (btnCloseMap && mapModal) {
      btnCloseMap.onclick = () => {
        this.isMapOpen = false;
        mapModal.style.display = 'none';
      };
    }

    // Teleport Buttons
    const teleportBtns = document.querySelectorAll('.btn-landmark-teleport');
    teleportBtns.forEach(btn => {
      btn.onclick = () => {
        const preset = btn.dataset.preset;
        if (this.engine && this.engine.cameraController) {
          this.engine.cameraController.setPreset(preset);
        }
        if (mapModal) {
          this.isMapOpen = false;
          mapModal.style.display = 'none';
        }
      };
    });

    if (btnPause) {
      btnPause.onclick = () => {
        if (this.engine) this.engine.time.paused = !this.engine.time.paused;
        btnPause.style.background = this.engine && this.engine.time.paused ? '#ef4444' : 'rgba(255,255,255,0.1)';
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

/**
 * AAA Cities: Skylines II–Inspired HUD & UI Subsystem
 * Translucent frosted-glass control bars, RCI demand indicators, time controls,
 * Real-time Weather System (Clear, Rain, Snow, Fog),
 * 3D GIS Administrative Labels Toggle,
 * and Historical Time Machine (1970 - 2026) with Time-lapse Playback & Administrative Map.
 */
export class UIModule {
  constructor() {
    this.world = null;
    this.engine = null;
    this.container = null;
    this.unsubSim = null;
    this.unsubTime = null;
    this.unsubTM = null;
    this.isMapOpen = false;
    this.labelsVisible = true;
    this.isTimeMachineOpen = false;
    this.currentYear = 2026;
    this.currentWeather = 'clear';
    this.isTimeLapsePlaying = false;
    this.timeLapseInterval = null;
  }

  init(world, engine) {
    this.world = world;
    this.engine = engine;
    this.container = document.getElementById('ui-container');

    this.mountHUD();

    if (this.world && this.world.eventBus) {
      this.unsubSim = this.world.eventBus.on('sim:tick', (data) => this.updateSimDisplay(data));
      this.unsubTime = this.world.eventBus.on('time:updated', (state) => this.updateTimeDisplay(state));
      this.unsubTM = this.world.eventBus.on('timeMachine:yearChanged', (data) => {
        this.updateTimeMachineDisplay(data);
      });
    }
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
        padding: 12px 18px;
        box-sizing: border-box;
      ">
        <!-- Top Status Header Bar (Pinned to top) -->
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(11, 16, 25, 0.88);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          padding: 7px 16px;
          color: #f0f4f8;
          pointer-events: auto;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
          gap: 10px;
          flex-wrap: wrap;
        ">
          <!-- City Branding & Action Buttons -->
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="
              width: 10px;
              height: 10px;
              border-radius: 50%;
              background: #00d26a;
              box-shadow: 0 0 10px #00d26a;
            "></div>
            <div>
              <div style="font-weight: 800; font-size: 14px; letter-spacing: 0.5px;">광명시 (GWANGMYEONG-SI)</div>
              <div style="font-size: 10px; color: #8fa0b5;">5개 행정동 디지털 트윈 GIS</div>
            </div>
            <button id="btn-toggle-map" style="
              background: #2563eb;
              border: 1px solid rgba(255,255,255,0.25);
              color: #ffffff;
              padding: 5px 10px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              🗺️ 행정지도
            </button>
            <button id="btn-toggle-labels" style="
              background: #059669;
              border: 1px solid rgba(255,255,255,0.2);
              color: #ffffff;
              padding: 5px 10px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              🏷️ 3D 라벨 ON
            </button>
            <button id="btn-gis-overview" style="
              background: #475569;
              border: 1px solid rgba(255,255,255,0.2);
              color: #ffffff;
              padding: 5px 10px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              👁️ 전체 조감
            </button>
            <button id="btn-top-toggle-tm" style="
              background: rgba(56, 189, 248, 0.18);
              border: 1px solid rgba(56, 189, 248, 0.35);
              color: #38bdf8;
              padding: 5px 10px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              ⏳ 타임머신
            </button>
          </div>

          <!-- Weather Selector Pills -->
          <div style="
            display: flex;
            align-items: center;
            gap: 4px;
            background: rgba(0, 0, 0, 0.4);
            padding: 4px 8px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.08);
          ">
            <span style="font-size: 11px; font-weight: 700; color: #94a3b8; margin-right: 4px;">날씨:</span>
            <button class="btn-weather-pill active" data-weather="clear" style="background: #3b82f6; border: none; color: #fff; padding: 4px 8px; border-radius: 5px; font-size: 11px; font-weight: 600; cursor: pointer;">☀️ 맑음</button>
            <button class="btn-weather-pill" data-weather="rain" style="background: rgba(255,255,255,0.08); border: none; color: #cbd5e1; padding: 4px 8px; border-radius: 5px; font-size: 11px; font-weight: 600; cursor: pointer;">🌧️ 비</button>
            <button class="btn-weather-pill" data-weather="snow" style="background: rgba(255,255,255,0.08); border: none; color: #cbd5e1; padding: 4px 8px; border-radius: 5px; font-size: 11px; font-weight: 600; cursor: pointer;">❄️ 눈</button>
            <button class="btn-weather-pill" data-weather="fog" style="background: rgba(255,255,255,0.08); border: none; color: #cbd5e1; padding: 4px 8px; border-radius: 5px; font-size: 11px; font-weight: 600; cursor: pointer;">🌫️ 안개</button>
          </div>

          <!-- RCI Demand -->
          <div style="display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 6px;">
            <span style="font-size: 10px; font-weight: 700; color: #8fa0b5;">RCI</span>
            <div style="display: flex; gap: 4px; align-items: flex-end; height: 18px;">
              <div id="demand-r" style="width: 5px; height: 15px; background: #00e676; border-radius: 1px;"></div>
              <div id="demand-c" style="width: 5px; height: 10px; background: #29b6f6; border-radius: 1px;"></div>
              <div id="demand-i" style="width: 5px; height: 12px; background: #ffa726; border-radius: 1px;"></div>
            </div>
          </div>

          <!-- Population & Treasury -->
          <div style="display: flex; align-items: center; gap: 14px;">
            <div>
              <div style="font-size: 9px; color: #8fa0b5;">광명 인구</div>
              <div id="hud-population" style="font-size: 12px; font-weight: 700;">283,500 <span style="font-size: 10px; color: #00d26a;">▲</span></div>
            </div>
            <div>
              <div style="font-size: 9px; color: #8fa0b5;">시 재정</div>
              <div id="hud-funds" style="font-size: 12px; font-weight: 700; color: #5ce1e6;">₡ 3,450,000</div>
            </div>
          </div>

          <!-- Clock & Simulation Speed -->
          <div style="display: flex; align-items: center; gap: 6px;">
            <div id="hud-time" style="font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums;">14:00</div>
            <div style="display: flex; gap: 2px;">
              <button id="btn-speed-pause" style="background: rgba(255,255,255,0.1); border: none; color: #fff; padding: 3px 6px; border-radius: 4px; cursor: pointer; font-size: 10px;">⏸</button>
              <button id="btn-speed-1x" style="background: #2563eb; border: none; color: #fff; padding: 3px 6px; border-radius: 4px; cursor: pointer; font-size: 10px;">1x</button>
              <button id="btn-speed-3x" style="background: rgba(255,255,255,0.1); border: none; color: #fff; padding: 3px 6px; border-radius: 4px; cursor: pointer; font-size: 10px;">3x</button>
            </div>
          </div>
        </div>

        <!-- Interactive Gwangmyeong GIS Administrative Map Modal -->
        <div id="gwangmyeong-map-modal" style="
          display: none;
          pointer-events: auto;
          position: absolute;
          top: 65px;
          left: 50%;
          transform: translateX(-50%);
          width: 880px;
          max-width: 95vw;
          background: rgba(13, 19, 30, 0.96);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
          padding: 16px 20px;
          color: #f1f5f9;
          z-index: 1000;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 8px; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 20px;">🗺️</span>
              <div>
                <div style="font-size: 15px; font-weight: 800;">경기도 광명시 공식 행정구역도 (GIS Map) (<span id="modal-year-tag" style="color: #38bdf8;">2026년 기준</span>)</div>
                <div style="font-size: 11px; color: #94a3b8;">광명동 · 철산동 · 하안동 · 소하동 · 일직동 5개 행정동 및 산/하천/교량</div>
              </div>
            </div>
            <button id="btn-close-map" style="background: rgba(255,255,255,0.1); border: none; color: #cbd5e1; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-size: 14px;">✕</button>
          </div>

          <!-- SVG Geographic Map Representation of Gwangmyeong-si -->
          <div style="display: flex; gap: 16px; align-items: center;">
            <div style="flex: 1.1; background: rgba(5, 8, 15, 0.75); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 8px;">
              <svg viewBox="0 0 400 480" style="width: 100%; height: auto;">
                <!-- Mokgamcheon -->
                <path d="M 50 20 Q 90 90 120 140" fill="none" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>
                <text x="50" y="40" fill="#38bdf8" font-size="10" font-weight="bold">목감천 (Mokgamcheon)</text>

                <!-- Anyangcheon -->
                <path d="M 280 20 Q 260 140 270 240 T 290 460" fill="none" stroke="#38bdf8" stroke-width="7" stroke-linecap="round"/>
                <text x="295" y="55" fill="#38bdf8" font-size="11" font-weight="bold">안양천 (Anyangcheon)</text>

                <!-- 5 Anyangcheon Bridges -->
                <line x1="240" y1="75" x2="280" y2="75" stroke="#f59e0b" stroke-width="3"/>
                <text x="285" y="78" fill="#fcd34d" font-size="9">① 광명교 (1973)</text>

                <line x1="235" y1="140" x2="280" y2="140" stroke="#f59e0b" stroke-width="4"/>
                <text x="285" y="143" fill="#fcd34d" font-size="10" font-weight="bold">② 철산교 (1977)</text>

                <line x1="240" y1="215" x2="285" y2="215" stroke="#f59e0b" stroke-width="3"/>
                <text x="290" y="218" fill="#fcd34d" font-size="9">③ 금천교 (1989)</text>

                <line x1="245" y1="290" x2="290" y2="290" stroke="#f59e0b" stroke-width="3"/>
                <text x="295" y="293" fill="#fcd34d" font-size="9">④ 시흥대교 (1980)</text>

                <line x1="250" y1="350" x2="295" y2="350" stroke="#f59e0b" stroke-width="3"/>
                <text x="300" y="353" fill="#fcd34d" font-size="9">⑤ 기아대교 (1990)</text>

                <!-- Ori-ro -->
                <path d="M 180 50 L 180 430" fill="none" stroke="#94a3b8" stroke-width="3" stroke-dasharray="4,4"/>
                <text x="185" y="240" fill="#cbd5e1" font-size="9" transform="rotate(90 185 240)">오리로 (Ori-ro Main Spine)</text>

                <!-- 1. Gwangmyeong-dong -->
                <rect x="45" y="55" width="70" height="50" rx="6" fill="#334155" opacity="0.8" stroke="#64748b"/>
                <text x="80" y="78" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="bold">광명동 (1970)</text>
                <text x="80" y="93" text-anchor="middle" fill="#fb923c" font-size="9">전통시장 · 광명로</text>

                <!-- Dodeoksan -->
                <circle cx="125" cy="110" r="28" fill="#14532d" opacity="0.6"/>
                <text x="125" y="105" text-anchor="middle" fill="#86efac" font-size="11" font-weight="bold">⛰️ 도덕산 (183m)</text>
                <text x="125" y="122" text-anchor="middle" fill="#f87171" font-size="9" font-weight="bold">출렁다리 (2022)</text>

                <!-- 2. Cheolsan-dong -->
                <rect x="175" y="95" width="85" height="65" rx="6" fill="#1e3a8a" opacity="0.75" stroke="#3b82f6"/>
                <text x="217" y="118" text-anchor="middle" fill="#93c5fd" font-size="12" font-weight="bold">철산동 (행정)</text>
                <text x="217" y="133" text-anchor="middle" fill="#fde047" font-size="9" font-weight="bold">광명시청 (1981)</text>
                <text x="217" y="148" text-anchor="middle" fill="#bfdbfe" font-size="9">철산주공 (1985)</text>

                <!-- Gureumsan -->
                <circle cx="110" cy="220" r="35" fill="#14532d" opacity="0.6"/>
                <text x="110" y="215" text-anchor="middle" fill="#86efac" font-size="11" font-weight="bold">⛰️ 구름산 (240m)</text>
                <text x="110" y="230" text-anchor="middle" fill="#bbf7d0" font-size="9">광명 최고봉</text>

                <!-- 3. Haan-dong -->
                <rect x="175" y="180" width="85" height="70" rx="6" fill="#1e3a8a" opacity="0.75" stroke="#3b82f6"/>
                <text x="217" y="210" text-anchor="middle" fill="#93c5fd" font-size="12" font-weight="bold">하안동 (주거)</text>
                <text x="217" y="228" text-anchor="middle" fill="#bfdbfe" font-size="9">하안주공 1~12단지 (1989)</text>

                <!-- Gahaksan -->
                <circle cx="95" cy="320" r="28" fill="#14532d" opacity="0.6"/>
                <text x="95" y="315" text-anchor="middle" fill="#86efac" font-size="11" font-weight="bold">⛰️ 가학산 (220m)</text>
                <text x="95" y="330" text-anchor="middle" fill="#fbbf24" font-size="9" font-weight="bold">⛏️ 동굴 · 굴뚝</text>

                <!-- 4. Soha-dong -->
                <rect x="175" y="275" width="85" height="60" rx="6" fill="#374151" opacity="0.75" stroke="#4b5563"/>
                <text x="217" y="300" text-anchor="middle" fill="#f3f4f6" font-size="12" font-weight="bold">소하동 (산업)</text>
                <text x="217" y="316" text-anchor="middle" fill="#fb923c" font-size="9" font-weight="bold">기아 오토랜드 (1973)</text>

                <!-- Seodoksan -->
                <circle cx="120" cy="405" r="24" fill="#14532d" opacity="0.6"/>
                <text x="120" y="410" text-anchor="middle" fill="#86efac" font-size="10" font-weight="bold">⛰️ 서독산 (180m)</text>

                <!-- 5. Iljik-dong -->
                <rect x="155" y="360" width="125" height="85" rx="6" fill="#4c1d95" opacity="0.8" stroke="#8b5cf6"/>
                <text x="217" y="380" text-anchor="middle" fill="#c4b5fd" font-size="12" font-weight="bold">일직동 (역세권)</text>
                <text x="217" y="396" text-anchor="middle" fill="#e9d5ff" font-size="9" font-weight="bold">KTX (2004) · 유플래닛 (2021)</text>
                <text x="217" y="412" text-anchor="middle" fill="#fde047" font-size="9">이케아 · 코스트코 · 롯데몰</text>
              </svg>
            </div>

            <!-- Landmark Teleport Buttons Panel with Completion Status Badges -->
            <div style="flex: 1.1; display: flex; flex-direction: column; gap: 6px; max-height: 440px; overflow-y: auto;">
              <div style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">📍 랜드마크 비행 이동 (완공일 기준)</div>
              
              <button class="btn-landmark-teleport" data-preset="gwangmyeong_city_hall" data-year="1981" style="background: rgba(37, 99, 235, 0.45); border: 1px solid #3b82f6; color: #fff; padding: 7px 10px; border-radius: 7px; font-size: 11px; font-weight: 700; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <span>🏛️ 광명시청 <small style="color: #93c5fd;">(1981년 준공 · 철산동)</small></span>
                <span class="status-badge" style="font-size: 10px; color: #00e676;">이동 ▶</span>
              </button>

              <button class="btn-landmark-teleport" data-preset="cheolsan_apartments" data-year="1985" style="background: rgba(30, 58, 138, 0.45); border: 1px solid #3b82f6; color: #fff; padding: 7px 10px; border-radius: 7px; font-size: 11px; font-weight: 700; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <span>🏢 철산주공 아파트 <small style="color: #93c5fd;">(1985년 준공)</small></span>
                <span class="status-badge" style="font-size: 10px; color: #00e676;">이동 ▶</span>
              </button>

              <button class="btn-landmark-teleport" data-preset="gwangmyeong_market" data-year="1970" style="background: rgba(180, 83, 9, 0.4); border: 1px solid #f59e0b; color: #fff; padding: 7px 10px; border-radius: 7px; font-size: 11px; font-weight: 700; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <span>🏮 광명전통시장 <small style="color: #fde68a;">(1970년 · 광명동)</small></span>
                <span class="status-badge" style="font-size: 10px; color: #00e676;">이동 ▶</span>
              </button>

              <button class="btn-landmark-teleport" data-preset="ktx_station" data-year="2004" style="background: rgba(76, 29, 149, 0.45); border: 1px solid #8b5cf6; color: #fff; padding: 7px 10px; border-radius: 7px; font-size: 11px; font-weight: 700; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <span>🚄 KTX 광명역사 <small style="color: #c4b5fd;">(2004년 개통)</small></span>
                <span class="status-badge" style="font-size: 10px; color: #00e676;">이동 ▶</span>
              </button>

              <button class="btn-landmark-teleport" data-preset="ikea_costco" data-year="2014" style="background: rgba(234, 179, 8, 0.25); border: 1px solid #eab308; color: #fff; padding: 7px 10px; border-radius: 7px; font-size: 11px; font-weight: 700; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <span>🛍️ 이케아 · 코스트코 · 롯데몰 <small style="color: #fde047;">(일직동)</small></span>
                <span class="status-badge" style="font-size: 10px; color: #00e676;">이동 ▶</span>
              </button>

              <button class="btn-landmark-teleport" data-preset="dodeoksan_bridge" data-year="2022" style="background: rgba(220, 38, 38, 0.25); border: 1px solid #ef4444; color: #fff; padding: 7px 10px; border-radius: 7px; font-size: 11px; font-weight: 700; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <span>🌉 도덕산 Y-출렁다리 <small style="color: #fca5a5;">(2022년 완공)</small></span>
                <span class="status-badge" style="font-size: 10px; color: #00e676;">이동 ▶</span>
              </button>

              <button class="btn-landmark-teleport" data-preset="anyangcheon_bridge" data-year="1977" style="background: rgba(2, 132, 199, 0.25); border: 1px solid #38bdf8; color: #fff; padding: 7px 10px; border-radius: 7px; font-size: 11px; font-weight: 700; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <span>🌊 안양천 철산교 <small style="color: #bae6fd;">(1977년 준공)</small></span>
                <span class="status-badge" style="font-size: 10px; color: #00e676;">이동 ▶</span>
              </button>

              <button class="btn-landmark-teleport" data-preset="gwangmyeong_cave" data-year="2015" style="background: rgba(217, 119, 6, 0.25); border: 1px solid #f59e0b; color: #fff; padding: 7px 10px; border-radius: 7px; font-size: 11px; font-weight: 700; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <span>⛏️ 가학산 광명동굴 & 굴뚝 <small style="color: #fde68a;">(2015년)</small></span>
                <span class="status-badge" style="font-size: 10px; color: #00e676;">이동 ▶</span>
              </button>

              <button class="btn-landmark-teleport" data-preset="downtown_night" data-year="2021" style="background: rgba(15, 23, 42, 0.6); border: 1px solid #64748b; color: #fff; padding: 7px 10px; border-radius: 7px; font-size: 11px; font-weight: 700; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <span>🌃 유플래닛 40층 타워 <small style="color: #cbd5e1;">(2021년 준공)</small></span>
                <span class="status-badge" style="font-size: 10px; color: #00e676;">이동 ▶</span>
              </button>

              <button class="btn-landmark-teleport" data-preset="gis_overview" data-year="1970" style="background: rgba(51, 65, 85, 0.5); border: 1px solid #94a3b8; color: #fff; padding: 7px 10px; border-radius: 7px; font-size: 11px; font-weight: 700; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <span>👁️ 광명시 전체 조감 (GIS Overview)</span>
                <span class="status-badge" style="font-size: 10px; color: #00e676;">이동 ▶</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Bottom Master Controls Dock (Centered at bottom, leaves entire screen wide open) -->
        <div id="skylines-bottom-dock" style="
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          pointer-events: auto;
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        ">
          <!-- Sleek Bottom Historical Time Machine Bar (Closed by default) -->
          <div id="tm-dock-bar" style="
            display: none;
            align-items: center;
            gap: 10px;
            background: rgba(11, 16, 25, 0.92);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
            border: 1px solid rgba(56, 189, 248, 0.3);
            border-radius: 12px;
            padding: 6px 14px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
            width: 100%;
            box-sizing: border-box;
            transition: all 0.25s ease;
          ">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 16px;">⏳</span>
              <div>
                <div style="font-size: 9px; color: #94a3b8; font-weight: 700;">타임머신</div>
                <div id="tm-year-display" style="font-size: 15px; font-weight: 800; color: #38bdf8; font-variant-numeric: tabular-nums;">2026년</div>
              </div>
            </div>

            <!-- Time-lapse Play/Pause Button -->
            <button id="btn-tm-play" style="
              background: #0284c7;
              border: 1px solid rgba(255,255,255,0.25);
              color: #ffffff;
              padding: 5px 10px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
              white-space: nowrap;
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              ▶ 재생
            </button>

            <!-- Year Slider -->
            <div style="flex: 1; display: flex; flex-direction: column; gap: 1px;">
              <input id="tm-year-slider" type="range" min="1970" max="2026" value="2026" step="1" style="
                width: 100%;
                cursor: pointer;
                accent-color: #38bdf8;
                margin: 0;
              "/>
              <div style="display: flex; justify-content: space-between; font-size: 9px; color: #64748b; font-weight: 600;">
                <span>1970(자연)</span>
                <span>1973(기아)</span>
                <span>1981(시청)</span>
                <span>1985(철산)</span>
                <span>2004(KTX)</span>
                <span>2014(이케아)</span>
                <span>2022(출렁다리)</span>
                <span>2026(현재)</span>
              </div>
            </div>

            <!-- Historical Milestone Card -->
            <div style="
              max-width: 220px;
              background: rgba(0,0,0,0.4);
              padding: 5px 8px;
              border-radius: 6px;
              border-left: 3px solid #38bdf8;
            ">
              <div id="tm-milestone-title" style="font-size: 10px; font-weight: 700; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">광명시 완성</div>
              <div id="tm-milestone-desc" style="font-size: 8px; color: #94a3b8; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">도덕산 출렁다리 완공으로 인프라 완성</div>
            </div>

            <!-- Close / Minimize Button -->
            <button id="btn-tm-close" style="
              background: transparent;
              border: none;
              color: #94a3b8;
              font-size: 13px;
              cursor: pointer;
              padding: 2px 4px;
              line-height: 1;
            " title="타임머신 바 숨기기">✕</button>
          </div>

          <!-- Bottom Construction & Management Dock -->
          <div style="
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(11, 16, 25, 0.88);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 6px 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.45);
          ">
            <button id="btn-tm-toggle-pill" style="
              background: rgba(56, 189, 248, 0.15);
              border: 1px solid rgba(56, 189, 248, 0.35);
              color: #38bdf8;
              padding: 6px 10px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              ⏳ 타임머신 <span id="tm-toggle-arrow">▴</span>
            </button>
            <div style="width: 1px; height: 16px; background: rgba(255,255,255,0.12); margin: 0 2px;"></div>
            <button class="skylines-tool-btn active" data-tool="inspect" style="background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 5px;">
              🔍 Inspect
            </button>
            <button class="skylines-tool-btn" data-tool="roads" style="background: rgba(255,255,255,0.06); border: 1px solid transparent; color: #cbd5e1; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 5px;">
              🛣️ Roads
            </button>
            <button class="skylines-tool-btn" data-tool="zoning" style="background: rgba(255,255,255,0.06); border: 1px solid transparent; color: #cbd5e1; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 5px;">
              🟩 Zoning
            </button>
            <button class="skylines-tool-btn" data-tool="bulldoze" style="background: rgba(255,255,255,0.06); border: 1px solid transparent; color: #f87171; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 5px;">
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
    const btnToggleLabels = document.getElementById('btn-toggle-labels');
    const btnGISOverview = document.getElementById('btn-gis-overview');
    const mapModal = document.getElementById('gwangmyeong-map-modal');

    // Time Machine Dock Elements
    const tmDockBar = document.getElementById('tm-dock-bar');
    const btnTmTogglePill = document.getElementById('btn-tm-toggle-pill');
    const btnTopToggleTm = document.getElementById('btn-top-toggle-tm');
    const btnTmClose = document.getElementById('btn-tm-close');
    const tmToggleArrow = document.getElementById('tm-toggle-arrow');

    const toggleTimeMachineBar = () => {
      this.isTimeMachineOpen = !this.isTimeMachineOpen;
      if (tmDockBar) {
        tmDockBar.style.display = this.isTimeMachineOpen ? 'flex' : 'none';
      }
      if (tmToggleArrow) {
        tmToggleArrow.textContent = this.isTimeMachineOpen ? '▾' : '▴';
      }
      if (btnTopToggleTm) {
        btnTopToggleTm.style.background = this.isTimeMachineOpen ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.08)';
      }
    };

    if (btnTmTogglePill) btnTmTogglePill.onclick = toggleTimeMachineBar;
    if (btnTopToggleTm) btnTopToggleTm.onclick = toggleTimeMachineBar;
    if (btnTmClose) btnTmClose.onclick = toggleTimeMachineBar;

    // 3D GIS Labels Toggle
    if (btnToggleLabels) {
      btnToggleLabels.onclick = () => {
        this.labelsVisible = !this.labelsVisible;
        btnToggleLabels.textContent = this.labelsVisible ? '🏷️ 3D 라벨 ON' : '🏷️ 3D 라벨 OFF';
        btnToggleLabels.style.background = this.labelsVisible ? '#059669' : 'rgba(255,255,255,0.1)';
        if (this.world && this.world.eventBus) {
          this.world.eventBus.emit('labels:toggle', { visible: this.labelsVisible });
        }
      };
    }

    // GIS Overview Button
    if (btnGISOverview) {
      btnGISOverview.onclick = () => {
        if (this.engine && this.engine.cameraController) {
          this.engine.cameraController.setPreset('gis_overview');
        }
      };
    }

    // Weather pills
    const weatherPills = document.querySelectorAll('.btn-weather-pill');
    weatherPills.forEach(pill => {
      pill.onclick = () => {
        const weather = pill.dataset.weather;
        this.currentWeather = weather;
        weatherPills.forEach(p => {
          p.style.background = 'rgba(255,255,255,0.08)';
          p.style.color = '#cbd5e1';
        });
        pill.style.background = '#3b82f6';
        pill.style.color = '#ffffff';

        if (this.world && this.world.eventBus) {
          this.world.eventBus.emit('weather:set', { weather });
        }
      };
    });

    // Time Machine controls
    const tmSlider = document.getElementById('tm-year-slider');
    const btnPlayTM = document.getElementById('btn-tm-play');

    if (tmSlider) {
      tmSlider.oninput = (e) => {
        const year = parseInt(e.target.value);
        this.setHistoricalYear(year);
      };
    }

    if (btnPlayTM) {
      btnPlayTM.onclick = () => {
        this.isTimeLapsePlaying = !this.isTimeLapsePlaying;
        if (this.isTimeLapsePlaying) {
          btnPlayTM.textContent = '⏸ 정지';
          btnPlayTM.style.background = '#e11d48';

          if (this.currentYear >= 2026) {
            this.setHistoricalYear(1970);
            if (tmSlider) tmSlider.value = 1970;
          }

          this.timeLapseInterval = setInterval(() => {
            if (this.currentYear >= 2026) {
              this.isTimeLapsePlaying = false;
              btnPlayTM.textContent = '▶ 재생';
              btnPlayTM.style.background = '#0284c7';
              clearInterval(this.timeLapseInterval);
              return;
            }
            const nextYear = this.currentYear + 1;
            this.setHistoricalYear(nextYear);
            if (tmSlider) tmSlider.value = nextYear;
          }, 650);
        } else {
          btnPlayTM.textContent = '▶ 재생';
          btnPlayTM.style.background = '#0284c7';
          if (this.timeLapseInterval) clearInterval(this.timeLapseInterval);
        }
      };
    }

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
        const landmarkYear = parseInt(btn.dataset.year) || 1970;

        if (this.currentYear < landmarkYear) {
          this.setHistoricalYear(landmarkYear);
          if (tmSlider) tmSlider.value = landmarkYear;
        }

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

  setHistoricalYear(year) {
    this.currentYear = year;
    if (this.world && this.world.eventBus) {
      this.world.eventBus.emit('timeMachine:setYear', { year });
    }
  }

  updateTimeMachineDisplay(data) {
    const yearDisplay = document.getElementById('tm-year-display');
    const milestoneTitle = document.getElementById('tm-milestone-title');
    const milestoneDesc = document.getElementById('tm-milestone-desc');
    const modalYearTag = document.getElementById('modal-year-tag');

    if (yearDisplay) yearDisplay.textContent = `${data.year}년`;
    if (modalYearTag) modalYearTag.textContent = `${data.year}년 기준`;

    if (milestoneTitle && data.milestone) {
      milestoneTitle.textContent = data.milestone.title;
    }
    if (milestoneDesc && data.milestone) {
      milestoneDesc.textContent = data.milestone.desc;
    }

    const teleportBtns = document.querySelectorAll('.btn-landmark-teleport');
    teleportBtns.forEach(btn => {
      const landmarkYear = parseInt(btn.dataset.year) || 1970;
      const isCompleted = (data.year >= landmarkYear);
      const badge = btn.querySelector('.status-badge');
      if (badge) {
        badge.textContent = isCompleted ? '이동 ▶' : '미완공 🔒';
        badge.style.color = isCompleted ? '#00e676' : '#f59e0b';
      }
      btn.style.opacity = isCompleted ? '1.0' : '0.65';
    });
  }

  updateSimDisplay(data) {
    const popEl = document.getElementById('hud-population');
    const fundsEl = document.getElementById('hud-funds');
    const rEl = document.getElementById('demand-r');
    const cEl = document.getElementById('demand-c');
    const iEl = document.getElementById('demand-i');

    if (popEl) popEl.innerHTML = `${data.population.toLocaleString()} <span style="font-size: 10px; color: #00d26a;">▲</span>`;
    if (fundsEl) fundsEl.textContent = `₡ ${data.funds.toLocaleString()}`;

    if (rEl) rEl.style.height = `${Math.max(4, data.demand.residential * 20)}px`;
    if (cEl) cEl.style.height = `${Math.max(4, data.demand.commercial * 20)}px`;
    if (iEl) iEl.style.height = `${Math.max(4, data.demand.industrial * 20)}px`;
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
    this.mountHUD();
  }

  dispose() {
    if (this.timeLapseInterval) clearInterval(this.timeLapseInterval);
    if (this.unsubSim) this.unsubSim();
    if (this.unsubTime) this.unsubTime();
    if (this.unsubTM) this.unsubTM();
    if (this.container) this.container.innerHTML = '';
  }
}

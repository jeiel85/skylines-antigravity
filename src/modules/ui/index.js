/**
 * AAA Cities: Skylines II–Inspired HUD & UI Subsystem
 * Translucent frosted-glass control bars, RCI demand indicators, time controls,
 * Real-time Weather System (Clear, Rain, Snow, Fog),
 * and Historical Time Machine (1970 - 2026) with Time-lapse Playback & GIS Map.
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

    this.unsubSim = this.world.eventBus.on('sim:tick', (data) => this.updateSimDisplay(data));
    this.unsubTime = this.world.eventBus.on('time:updated', (state) => this.updateTimeDisplay(state));

    if (this.world.eventBus) {
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
        padding: 14px 18px;
        box-sizing: border-box;
      ">
        <!-- Top Status Header Bar -->
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(11, 16, 25, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 8px 18px;
          color: #f0f4f8;
          pointer-events: auto;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          gap: 12px;
        ">
          <!-- City Branding & Map Button -->
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="
              width: 10px;
              height: 10px;
              border-radius: 50%;
              background: #00d26a;
              box-shadow: 0 0 10px #00d26a;
            "></div>
            <div>
              <div style="font-weight: 700; font-size: 14px; letter-spacing: 0.5px;">광명시 (GWANGMYEONG-SI)</div>
              <div style="font-size: 10px; color: #8fa0b5; text-transform: uppercase;">철산 · 하안 · 소하 · 일직 KTX 역세권</div>
            </div>
            <button id="btn-toggle-map" style="
              margin-left: 6px;
              background: #2563eb;
              border: 1px solid rgba(255,255,255,0.2);
              color: #ffffff;
              padding: 5px 12px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              🗺️ 지도 보기
            </button>
          </div>

          <!-- Weather Selector Pills -->
          <div style="
            display: flex;
            align-items: center;
            gap: 4px;
            background: rgba(0, 0, 0, 0.35);
            padding: 4px 8px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.06);
          ">
            <span style="font-size: 11px; font-weight: 600; color: #94a3b8; margin-right: 4px;">날씨:</span>
            <button class="btn-weather-pill active" data-weather="clear" style="background: #3b82f6; border: none; color: #fff; padding: 4px 8px; border-radius: 5px; font-size: 11px; font-weight: 600; cursor: pointer;">☀️ 맑음</button>
            <button class="btn-weather-pill" data-weather="rain" style="background: rgba(255,255,255,0.08); border: none; color: #cbd5e1; padding: 4px 8px; border-radius: 5px; font-size: 11px; font-weight: 600; cursor: pointer;">🌧️ 비</button>
            <button class="btn-weather-pill" data-weather="snow" style="background: rgba(255,255,255,0.08); border: none; color: #cbd5e1; padding: 4px 8px; border-radius: 5px; font-size: 11px; font-weight: 600; cursor: pointer;">❄️ 눈</button>
            <button class="btn-weather-pill" data-weather="fog" style="background: rgba(255,255,255,0.08); border: none; color: #cbd5e1; padding: 4px 8px; border-radius: 5px; font-size: 11px; font-weight: 600; cursor: pointer;">🌫️ 안개</button>
          </div>

          <!-- RCI Demand -->
          <div style="display: flex; align-items: center; gap: 10px; background: rgba(0,0,0,0.3); padding: 4px 10px; border-radius: 6px;">
            <span style="font-size: 10px; font-weight: 600; color: #8fa0b5;">RCI</span>
            <div style="display: flex; gap: 4px; align-items: flex-end; height: 20px;">
              <div id="demand-r" style="width: 6px; height: 16px; background: #00e676; border-radius: 1px;"></div>
              <div id="demand-c" style="width: 6px; height: 10px; background: #29b6f6; border-radius: 1px;"></div>
              <div id="demand-i" style="width: 6px; height: 13px; background: #ffa726; border-radius: 1px;"></div>
            </div>
          </div>

          <!-- Population & Treasury -->
          <div style="display: flex; align-items: center; gap: 16px;">
            <div>
              <div style="font-size: 9px; color: #8fa0b5;">인구</div>
              <div id="hud-population" style="font-size: 13px; font-weight: 700;">283,500 <span style="font-size: 10px; color: #00d26a;">▲</span></div>
            </div>
            <div>
              <div style="font-size: 9px; color: #8fa0b5;">재정</div>
              <div id="hud-funds" style="font-size: 13px; font-weight: 700; color: #5ce1e6;">₡ 3,450,000</div>
            </div>
          </div>

          <!-- Clock & Simulation Speed -->
          <div style="display: flex; align-items: center; gap: 8px;">
            <div id="hud-time" style="font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums;">14:00</div>
            <div style="display: flex; gap: 3px;">
              <button id="btn-speed-pause" style="background: rgba(255,255,255,0.1); border: none; color: #fff; padding: 3px 6px; border-radius: 4px; cursor: pointer; font-size: 11px;">⏸</button>
              <button id="btn-speed-1x" style="background: #2563eb; border: none; color: #fff; padding: 3px 6px; border-radius: 4px; cursor: pointer; font-size: 11px;">1x</button>
              <button id="btn-speed-3x" style="background: rgba(255,255,255,0.1); border: none; color: #fff; padding: 3px 6px; border-radius: 4px; cursor: pointer; font-size: 11px;">3x</button>
            </div>
          </div>
        </div>

        <!-- Floating Historical Time Machine Bar -->
        <div style="
          margin-top: 10px;
          display: flex;
          justify-content: center;
          pointer-events: auto;
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 14px;
            background: rgba(13, 20, 32, 0.88);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(56, 189, 248, 0.25);
            border-radius: 14px;
            padding: 8px 18px;
            box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
            max-width: 860px;
            width: 100%;
          ">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 18px;">⏳</span>
              <div>
                <div style="font-size: 10px; color: #94a3b8; font-weight: 600;">타임머신 (TIME MACHINE)</div>
                <div id="tm-year-display" style="font-size: 18px; font-weight: 800; color: #38bdf8; font-variant-numeric: tabular-nums;">2026년</div>
              </div>
            </div>

            <!-- Time-lapse Play/Pause Button -->
            <button id="btn-tm-play" style="
              background: #0284c7;
              border: 1px solid rgba(255,255,255,0.2);
              color: #ffffff;
              padding: 6px 12px;
              border-radius: 8px;
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
              white-space: nowrap;
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              ▶ 시간여행 재생
            </button>

            <!-- Year Slider -->
            <div style="flex: 1; display: flex; flex-direction: column; gap: 2px;">
              <input id="tm-year-slider" type="range" min="1970" max="2026" value="2026" step="1" style="
                width: 100%;
                cursor: pointer;
                accent-color: #38bdf8;
              "/>
              <div style="display: flex; justify-content: space-between; font-size: 9px; color: #64748b; font-weight: 600;">
                <span>1970 (자연)</span>
                <span>1973 (기아)</span>
                <span>1985 (철산)</span>
                <span>2004 (KTX)</span>
                <span>2014 (이케아)</span>
                <span>2022 (출렁다리)</span>
                <span>2026 (현재)</span>
              </div>
            </div>

            <!-- Historical Milestone Card -->
            <div style="
              max-width: 240px;
              background: rgba(0,0,0,0.3);
              padding: 6px 10px;
              border-radius: 8px;
              border-left: 3px solid #38bdf8;
            ">
              <div id="tm-milestone-title" style="font-size: 11px; font-weight: 700; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">광명시 완성</div>
              <div id="tm-milestone-desc" style="font-size: 9px; color: #94a3b8; line-height: 1.2;">도덕산 출렁다리 완공으로 12개 랜드마크 완성</div>
            </div>
          </div>
        </div>

        <!-- Interactive Gwangmyeong GIS Administrative Map Modal -->
        <div id="gwangmyeong-map-modal" style="
          display: none;
          pointer-events: auto;
          position: absolute;
          top: 70px;
          left: 50%;
          transform: translateX(-50%);
          width: 840px;
          max-width: 95vw;
          background: rgba(13, 19, 30, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
          padding: 18px 22px;
          color: #f1f5f9;
          z-index: 1000;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 14px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 20px;">🗺️</span>
              <div>
                <div style="font-size: 15px; font-weight: 700;">광명시 행정구역도 & 타임머신 현황 (<span id="modal-year-tag" style="color: #38bdf8;">2026년 기준</span>)</div>
                <div style="font-size: 11px; color: #94a3b8;">타임머신 연도에 따라 미준공 랜드마크는 자동으로 비활성화됩니다.</div>
              </div>
            </div>
            <button id="btn-close-map" style="background: rgba(255,255,255,0.1); border: none; color: #cbd5e1; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-size: 14px;">✕</button>
          </div>

          <!-- SVG Geographic Map Representation of Gwangmyeong-si -->
          <div style="display: flex; gap: 20px; align-items: center;">
            <div style="flex: 1.2; background: rgba(5, 8, 15, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 10px;">
              <svg viewBox="0 0 400 480" style="width: 100%; height: auto;">
                <path d="M 50 20 Q 90 90 120 140" fill="none" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>
                <text x="50" y="45" fill="#38bdf8" font-size="10" font-weight="bold">목감천</text>

                <path d="M 280 20 Q 260 140 270 240 T 290 460" fill="none" stroke="#38bdf8" stroke-width="7" stroke-linecap="round"/>
                <text x="295" y="60" fill="#38bdf8" font-size="11" font-weight="bold">안양천 (Anyangcheon)</text>

                <line x1="240" y1="75" x2="280" y2="75" stroke="#f59e0b" stroke-width="3"/>
                <text x="285" y="80" fill="#fcd34d" font-size="9">① 광명교 (1973)</text>

                <line x1="235" y1="140" x2="280" y2="140" stroke="#f59e0b" stroke-width="4"/>
                <text x="285" y="145" fill="#fcd34d" font-size="10" font-weight="bold">② 철산교 (1977)</text>

                <line x1="240" y1="215" x2="285" y2="215" stroke="#f59e0b" stroke-width="3"/>
                <text x="290" y="220" fill="#fcd34d" font-size="9">③ 금천교 (1989)</text>

                <line x1="245" y1="290" x2="290" y2="290" stroke="#f59e0b" stroke-width="3"/>
                <text x="295" y="295" fill="#fcd34d" font-size="9">④ 시흥대교 (1980)</text>

                <line x1="250" y1="350" x2="295" y2="350" stroke="#f59e0b" stroke-width="3"/>
                <text x="300" y="355" fill="#fcd34d" font-size="9">⑤ 기아대교 (1990)</text>

                <path d="M 180 50 L 180 430" fill="none" stroke="#94a3b8" stroke-width="3" stroke-dasharray="4,4"/>
                <text x="185" y="240" fill="#cbd5e1" font-size="9" transform="rotate(90 185 240)">오리로 (Ori-ro Main Spine)</text>

                <circle cx="120" cy="110" r="28" fill="#14532d" opacity="0.6"/>
                <text x="120" y="105" text-anchor="middle" fill="#86efac" font-size="11" font-weight="bold">⛰️ 도덕산 (183m)</text>
                <text x="120" y="122" text-anchor="middle" fill="#f87171" font-size="9" font-weight="bold">출렁다리 (2022)</text>

                <rect x="50" y="60" width="55" height="40" rx="4" fill="#334155" opacity="0.7"/>
                <text x="77" y="85" text-anchor="middle" fill="#f8fafc" font-size="10">광명동 (1970)</text>

                <rect x="175" y="100" width="75" height="60" rx="4" fill="#1e3a8a" opacity="0.6"/>
                <text x="212" y="130" text-anchor="middle" fill="#93c5fd" font-size="11" font-weight="bold">철산동</text>
                <text x="212" y="145" text-anchor="middle" fill="#bfdbfe" font-size="9">철산주공 (1985)</text>

                <circle cx="110" cy="220" r="35" fill="#14532d" opacity="0.6"/>
                <text x="110" y="215" text-anchor="middle" fill="#86efac" font-size="11" font-weight="bold">⛰️ 구름산 (240m)</text>
                <text x="110" y="230" text-anchor="middle" fill="#bbf7d0" font-size="9">광명 최고봉</text>

                <rect x="175" y="185" width="75" height="65" rx="4" fill="#1e3a8a" opacity="0.6"/>
                <text x="212" y="215" text-anchor="middle" fill="#93c5fd" font-size="11" font-weight="bold">하안동</text>
                <text x="212" y="230" text-anchor="middle" fill="#bfdbfe" font-size="9">하안주공 (1989)</text>

                <circle cx="95" cy="320" r="28" fill="#14532d" opacity="0.6"/>
                <text x="95" y="315" text-anchor="middle" fill="#86efac" font-size="11" font-weight="bold">⛰️ 가학산 (220m)</text>
                <text x="95" y="330" text-anchor="middle" fill="#fbbf24" font-size="9" font-weight="bold">⛏️ 동굴 (2015)</text>

                <rect x="175" y="280" width="80" height="55" rx="4" fill="#374151" opacity="0.6"/>
                <text x="215" y="305" text-anchor="middle" fill="#f3f4f6" font-size="11" font-weight="bold">소하동</text>
                <text x="215" y="320" text-anchor="middle" fill="#fb923c" font-size="9">기아공장 (1973)</text>

                <circle cx="120" cy="405" r="24" fill="#14532d" opacity="0.6"/>
                <text x="120" y="410" text-anchor="middle" fill="#86efac" font-size="10" font-weight="bold">⛰️ 서독산 (180m)</text>

                <rect x="160" y="365" width="115" height="75" rx="4" fill="#4c1d95" opacity="0.6"/>
                <text x="217" y="388" text-anchor="middle" fill="#c4b5fd" font-size="11" font-weight="bold">일직동 (KTX 역세권)</text>
                <text x="217" y="402" text-anchor="middle" fill="#e9d5ff" font-size="9">KTX (2004) · 유플래닛 (2021)</text>
                <text x="217" y="416" text-anchor="middle" fill="#fde047" font-size="9">코스트코 (2012) · 이케아 (2014)</text>
              </svg>
            </div>

            <!-- Landmark Teleport Buttons Panel with Completion Status Badges -->
            <div style="flex: 1; display: flex; flex-direction: column; gap: 7px;">
              <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">📍 랜드마크 비행 이동 (완공일 기준)</div>
              
              <button class="btn-landmark-teleport" data-preset="cheolsan_apartments" data-year="1985" style="background: rgba(30, 58, 138, 0.45); border: 1px solid #3b82f6; color: #fff; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <span>🏢 철산주공 아파트 <small style="color: #93c5fd;">(1985년 준공)</small></span>
                <span class="status-badge" style="font-size: 10px; color: #00e676;">이동 ▶</span>
              </button>

              <button class="btn-landmark-teleport" data-preset="ktx_station" data-year="2004" style="background: rgba(76, 29, 149, 0.45); border: 1px solid #8b5cf6; color: #fff; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <span>🚄 KTX 광명역사 <small style="color: #c4b5fd;">(2004년 개통)</small></span>
                <span class="status-badge" style="font-size: 10px; color: #00e676;">이동 ▶</span>
              </button>

              <button class="btn-landmark-teleport" data-preset="ikea_costco" data-year="2014" style="background: rgba(234, 179, 8, 0.2); border: 1px solid #eab308; color: #fff; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <span>🛍️ 이케아 · 코스트코 <small style="color: #fde047;">(2014년 개점)</small></span>
                <span class="status-badge" style="font-size: 10px; color: #00e676;">이동 ▶</span>
              </button>

              <button class="btn-landmark-teleport" data-preset="dodeoksan_bridge" data-year="2022" style="background: rgba(220, 38, 38, 0.25); border: 1px solid #ef4444; color: #fff; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <span>🌉 도덕산 Y-출렁다리 <small style="color: #fca5a5;">(2022년 완공)</small></span>
                <span class="status-badge" style="font-size: 10px; color: #00e676;">이동 ▶</span>
              </button>

              <button class="btn-landmark-teleport" data-preset="anyangcheon_bridge" data-year="1977" style="background: rgba(2, 132, 199, 0.25); border: 1px solid #38bdf8; color: #fff; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <span>🌊 안양천 철산교 <small style="color: #bae6fd;">(1977년 준공)</small></span>
                <span class="status-badge" style="font-size: 10px; color: #00e676;">이동 ▶</span>
              </button>

              <button class="btn-landmark-teleport" data-preset="gwangmyeong_cave" data-year="2015" style="background: rgba(217, 119, 6, 0.25); border: 1px solid #f59e0b; color: #fff; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <span>⛏️ 가학산 광명동굴 <small style="color: #fde68a;">(2015년 개관)</small></span>
                <span class="status-badge" style="font-size: 10px; color: #00e676;">이동 ▶</span>
              </button>

              <button class="btn-landmark-teleport" data-preset="downtown_night" data-year="2021" style="background: rgba(15, 23, 42, 0.6); border: 1px solid #64748b; color: #fff; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <span>🌃 유플래닛 빌딩 야경 <small style="color: #cbd5e1;">(2021년 준공)</small></span>
                <span class="status-badge" style="font-size: 10px; color: #00e676;">이동 ▶</span>
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
            <button class="skylines-tool-btn active" data-tool="inspect" style="background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;">
              🔍 Inspect
            </button>
            <button class="skylines-tool-btn" data-tool="roads" style="background: rgba(255,255,255,0.06); border: 1px solid transparent; color: #cbd5e1; padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;">
              🛣️ Roads
            </button>
            <button class="skylines-tool-btn" data-tool="zoning" style="background: rgba(255,255,255,0.06); border: 1px solid transparent; color: #cbd5e1; padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;">
              🟩 Zoning
            </button>
            <button class="skylines-tool-btn" data-tool="bulldoze" style="background: rgba(255,255,255,0.06); border: 1px solid transparent; color: #f87171; padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;">
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
          btnPlayTM.textContent = '⏸ 시간여행 일시정지';
          btnPlayTM.style.background = '#e11d48';

          if (this.currentYear >= 2026) {
            this.setHistoricalYear(1970);
            if (tmSlider) tmSlider.value = 1970;
          }

          this.timeLapseInterval = setInterval(() => {
            if (this.currentYear >= 2026) {
              this.isTimeLapsePlaying = false;
              btnPlayTM.textContent = '▶ 시간여행 재생';
              btnPlayTM.style.background = '#0284c7';
              clearInterval(this.timeLapseInterval);
              return;
            }
            const nextYear = this.currentYear + 1;
            this.setHistoricalYear(nextYear);
            if (tmSlider) tmSlider.value = nextYear;
          }, 650);
        } else {
          btnPlayTM.textContent = '▶ 시간여행 재생';
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

        // If landmark is in the future, automatically travel forward to its completion year!
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

    // Update landmark buttons in modal
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
  }

  dispose() {
    if (this.timeLapseInterval) clearInterval(this.timeLapseInterval);
    if (this.unsubSim) this.unsubSim();
    if (this.unsubTime) this.unsubTime();
    if (this.unsubTM) this.unsubTM();
    if (this.container) this.container.innerHTML = '';
  }
}

import * as THREE from 'three';

/**
 * AAA Procedural PBR Texture & Material Synthesizer
 * Generates photographic albedo, normal, roughness, and emissive maps directly on HTML5 Canvas.
 * Adheres strictly to the CC0 / Procedural Asset Policy with zero programmer art.
 */
export class AssetManager {
  constructor() {
    this.textures = new Map();
    this.materials = new Map();
  }

  /**
   * Helper to create and configure a CanvasTexture
   */
  _createCanvasTexture(canvas, isLinear = false, repeatX = 1, repeatY = 1) {
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.colorSpace = isLinear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  /**
   * 1. High-Detail Weathered Asphalt PBR (for roads, avenues, highways)
   */
  getAsphaltMaterial() {
    if (this.materials.has('asphalt')) return this.materials.get('asphalt');

    const size = 512;
    // --- Albedo ---
    const albedoCanvas = document.createElement('canvas');
    albedoCanvas.width = size;
    albedoCanvas.height = size;
    const ctxA = albedoCanvas.getContext('2d');

    // Base bitumen tone
    ctxA.fillStyle = '#22252a';
    ctxA.fillRect(0, 0, size, size);

    // Multi-octave fine mineral aggregate noise
    const imgDataA = ctxA.getImageData(0, 0, size, size);
    const dataA = imgDataA.data;
    for (let i = 0; i < dataA.length; i += 4) {
      const noise = (Math.random() - 0.5) * 28;
      const speckle = Math.random() > 0.92 ? (Math.random() * 45) : 0;
      dataA[i] = Math.max(15, Math.min(65, dataA[i] + noise + speckle));
      dataA[i + 1] = Math.max(17, Math.min(68, dataA[i + 1] + noise + speckle));
      dataA[i + 2] = Math.max(20, Math.min(72, dataA[i + 2] + noise + speckle));
    }
    ctxA.putImageData(imgDataA, 0, 0);

    // Subtle tire track lane wear
    ctxA.fillStyle = 'rgba(15, 17, 20, 0.28)';
    ctxA.fillRect(size * 0.18, 0, size * 0.16, size);
    ctxA.fillRect(size * 0.66, 0, size * 0.16, size);

    const albedoMap = this._createCanvasTexture(albedoCanvas, false, 2, 4);

    // --- Normal Map ---
    const normCanvas = document.createElement('canvas');
    normCanvas.width = size;
    normCanvas.height = size;
    const ctxN = normCanvas.getContext('2d');
    const imgDataN = ctxN.createImageData(size, size);
    const dataN = imgDataN.data;
    for (let i = 0; i < dataN.length; i += 4) {
      const nx = 128 + Math.floor((Math.random() - 0.5) * 36);
      const ny = 128 + Math.floor((Math.random() - 0.5) * 36);
      dataN[i] = nx;
      dataN[i + 1] = ny;
      dataN[i + 2] = 255;
      dataN[i + 3] = 255;
    }
    ctxN.putImageData(imgDataN, 0, 0);
    const normalMap = this._createCanvasTexture(normCanvas, true, 2, 4);

    // --- Roughness Map ---
    const roughCanvas = document.createElement('canvas');
    roughCanvas.width = size;
    roughCanvas.height = size;
    const ctxR = roughCanvas.getContext('2d');
    ctxR.fillStyle = '#b8b8b8'; // Base roughness ~0.72
    ctxR.fillRect(0, 0, size, size);
    // Smoother tire tracks
    ctxR.fillStyle = '#888888';
    ctxR.fillRect(size * 0.18, 0, size * 0.16, size);
    ctxR.fillRect(size * 0.66, 0, size * 0.16, size);
    const roughnessMap = this._createCanvasTexture(roughCanvas, true, 2, 4);

    const material = new THREE.MeshStandardMaterial({
      map: albedoMap,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: roughnessMap,
      roughness: 0.85,
      metalness: 0.08
    });

    this.materials.set('asphalt', material);
    return material;
  }

  /**
   * 2. Architectural Sidewalk & Curb Concrete PBR
   */
  getConcreteMaterial() {
    if (this.materials.has('concrete')) return this.materials.get('concrete');

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Weathered architectural concrete
    ctx.fillStyle = '#9aa0a6';
    ctx.fillRect(0, 0, size, size);

    // Pavement expansion joints (subtle grids)
    ctx.strokeStyle = '#5a5f66';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, size - 4, size - 4);

    // Surface stippling
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 18;
      data[i] = Math.max(120, Math.min(185, data[i] + n));
      data[i + 1] = Math.max(120, Math.min(185, data[i + 1] + n));
      data[i + 2] = Math.max(125, Math.min(190, data[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    const albedo = this._createCanvasTexture(canvas, false, 4, 4);

    const material = new THREE.MeshStandardMaterial({
      map: albedo,
      roughness: 0.82,
      metalness: 0.04
    });

    this.materials.set('concrete', material);
    return material;
  }

  /**
   * 3. AAA Modern High-Rise Glass Curtain Wall with Crisp Night Lit Windows
   * @param {string} theme - 'cyan', 'blue', 'bronze', 'emerald'
   */
  getGlassCurtainWallMaterial(theme = 'cyan') {
    const key = `curtain_${theme}`;
    if (this.materials.has(key)) return this.materials.get(key);

    const size = 512;
    // --- Albedo Canvas ---
    const canvasA = document.createElement('canvas');
    canvasA.width = size;
    canvasA.height = size;
    const ctxA = canvasA.getContext('2d');

    const themeColors = {
      cyan: { glass: '#417082', frame: '#20262c', spandrel: '#2d4d5a' },
      blue: { glass: '#385e8a', frame: '#1a222c', spandrel: '#264263' },
      bronze: { glass: '#6e5a47', frame: '#2a221b', spandrel: '#4d3e31' },
      emerald: { glass: '#386e58', frame: '#1a2822', spandrel: '#274f3e' }
    }[theme] || { glass: '#417082', frame: '#20262c', spandrel: '#2d4d5a' };

    // Glass backdrop
    ctxA.fillStyle = themeColors.glass;
    ctxA.fillRect(0, 0, size, size);

    // 10x20 Window Panel Grid
    const cols = 10;
    const rows = 20;
    const cellW = size / cols;
    const cellH = size / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cellW;
        const y = r * cellH;

        // Spandrel floor slab band
        if (r % 2 === 0) {
          ctxA.fillStyle = themeColors.spandrel;
          ctxA.fillRect(x + 1, y + 1, cellW - 2, cellH * 0.35);
        }

        // Structural Mullions
        ctxA.strokeStyle = themeColors.frame;
        ctxA.lineWidth = 2.5;
        ctxA.strokeRect(x, y, cellW, cellH);
      }
    }

    const albedo = this._createCanvasTexture(canvasA, false, 1, 1);

    // --- Emissive Canvas (Crisp Night Windows with structural borders) ---
    const canvasE = document.createElement('canvas');
    canvasE.width = size;
    canvasE.height = size;
    const ctxE = canvasE.getContext('2d');
    ctxE.fillStyle = '#000000';
    ctxE.fillRect(0, 0, size, size);

    // Calibrated warm incandescent and cool white tones
    const windowPalettes = ['#e6b567', '#f0ca85', '#dce8f5', '#ffe0a3'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // ~42% of windows occupied at night
        const isLit = Math.random() < 0.42;
        if (isLit && r % 2 !== 0) {
          // Thick 4px dark border around every illuminated cell to keep mullions crisp
          const x = c * cellW + 4;
          const y = r * cellH + 4;
          const w = cellW - 8;
          const h = cellH - 8;

          const col = windowPalettes[Math.floor(Math.random() * windowPalettes.length)];
          ctxE.fillStyle = col;
          ctxE.fillRect(x, y, w, h);

          // Interior venetian blind louvers
          if (Math.random() > 0.45) {
            ctxE.fillStyle = 'rgba(0, 0, 0, 0.55)';
            ctxE.fillRect(x, y, w, h * 0.4);
          }
        }
      }
    }

    const emissiveMap = this._createCanvasTexture(canvasE, false, 1, 1);

    const material = new THREE.MeshStandardMaterial({
      map: albedo,
      emissiveMap: emissiveMap,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.0,
      roughness: 0.22,
      metalness: 0.12
    });

    this.materials.set(key, material);
    return material;
  }

  /**
   * 4. Multi-Density Residential Architecture Material
   */
  getResidentialMaterial(colorHex = 0xe4ded5) {
    const key = `res_${colorHex}`;
    if (this.materials.has(key)) return this.materials.get(key);

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Horizontal siding / clapboard panels
    ctx.fillStyle = '#e5ded6';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = '#b2aba1';
    ctx.lineWidth = 1;
    const plankH = 12;
    for (let y = 0; y < size; y += plankH) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }

    const albedo = this._createCanvasTexture(canvas, false, 2, 2);

    // Residential night window emission
    const canvasE = document.createElement('canvas');
    canvasE.width = size;
    canvasE.height = size;
    const ctxE = canvasE.getContext('2d');
    ctxE.fillStyle = '#000000';
    ctxE.fillRect(0, 0, size, size);

    // Domestic warm window lights
    ctxE.fillStyle = '#ffcf73';
    ctxE.fillRect(30, 40, 45, 60);
    ctxE.fillRect(140, 40, 45, 60);
    ctxE.fillRect(80, 150, 50, 70);

    const emissive = this._createCanvasTexture(canvasE, false, 2, 2);

    const material = new THREE.MeshStandardMaterial({
      map: albedo,
      color: colorHex,
      emissiveMap: emissive,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.0,
      roughness: 0.65,
      metalness: 0.1
    });

    this.materials.set(key, material);
    return material;
  }

  /**
   * 5. Procedural PBR Terrain Materials (Grass, Cliff, Sand)
   */
  getTerrainMaterial() {
    if (this.materials.has('terrain')) return this.materials.get('terrain');

    const size = 512;
    // Multi-shade lush grass
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#4a6b35';
    ctx.fillRect(0, 0, size, size);

    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 35;
      data[i] = Math.max(40, Math.min(110, data[i] + n * 0.7));
      data[i + 1] = Math.max(70, Math.min(150, data[i + 1] + n));
      data[i + 2] = Math.max(30, Math.min(80, data[i + 2] + n * 0.5));
    }
    ctx.putImageData(imgData, 0, 0);

    const albedo = this._createCanvasTexture(canvas, false, 16, 16);

    const material = new THREE.MeshStandardMaterial({
      map: albedo,
      roughness: 0.92,
      metalness: 0.04
    });

    this.materials.set('terrain', material);
    return material;
  }

  /**
   * 6. Realistic Procedural Water Surface Material
   */
  getWaterMaterial() {
    if (this.materials.has('water')) return this.materials.get('water');

    const material = new THREE.MeshStandardMaterial({
      color: 0x143c4f,
      roughness: 0.12,
      metalness: 0.45,
      transparent: true,
      opacity: 0.88
    });

    this.materials.set('water', material);
    return material;
  }
}

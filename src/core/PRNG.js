/**
 * Deterministic Seeded Pseudo-Random Number Generator (Mulberry32)
 * Guarantees bit-exact reproducibility across all simulations and procedural assets.
 */
export class PRNG {
  /**
   * @param {number|string} seed 
   */
  constructor(seed = 1337) {
    this.seed = typeof seed === 'string' ? this._hashString(seed) : (seed >>> 0);
    this._state = this.seed;
  }

  _hashString(str) {
    let hash = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      hash = Math.imul(hash ^ str.charCodeAt(i), 3432918353);
      hash = (hash << 13) | (hash >>> 19);
    }
    return hash >>> 0;
  }

  /**
   * Returns a float in [0, 1)
   */
  next() {
    let t = (this._state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns float in [min, max)
   */
  range(min, max) {
    return min + this.next() * (max - min);
  }

  /**
   * Returns integer in [min, max] inclusive
   */
  rangeInt(min, max) {
    return Math.floor(this.range(min, max + 1));
  }

  /**
   * Returns boolean with probability p
   */
  chance(p = 0.5) {
    return this.next() < p;
  }

  /**
   * Pick random element from array
   */
  choice(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(this.next() * arr.length)];
  }

  /**
   * Normally distributed random number (Box-Muller transform)
   */
  gaussian(mean = 0, stdev = 1) {
    let u1 = this.next();
    let u2 = this.next();
    while (u1 <= 1e-7) u1 = this.next(); // avoid log(0)
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * stdev;
  }

  reset() {
    this._state = this.seed;
  }
}

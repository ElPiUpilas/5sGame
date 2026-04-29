// Mulberry32 seeded PRNG. Returns a function that produces [0,1) floats.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// makeRng(seed, ...salts) — folds salts (numbers or strings) into the seed so
// each stream is independent but reproducible.
export function makeRng(seed, ...salts) {
  let s = (seed | 0) >>> 0;
  for (const x of salts) {
    const v = typeof x === 'string' ? hashString(x) : (x >>> 0);
    s = Math.imul(s ^ v, 2654435761) >>> 0;
  }
  return mulberry32(s);
}

const SEED_KEY = 'fiveS.seed';

export function getOrCreateSeed() {
  try {
    const existing = sessionStorage.getItem(SEED_KEY);
    if (existing) return Number(existing) >>> 0;
  } catch (_) { /* private mode etc. */ }
  const fresh = Math.floor(Math.random() * 0xffffffff) >>> 0;
  try { sessionStorage.setItem(SEED_KEY, String(fresh)); } catch (_) {}
  return fresh;
}

export function resetSeed() {
  const fresh = Math.floor(Math.random() * 0xffffffff) >>> 0;
  try { sessionStorage.setItem(SEED_KEY, String(fresh)); } catch (_) {}
  return fresh;
}

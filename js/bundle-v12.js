
// ── js/rng.js ──────────────────────────────────────
// Mulberry32 seeded PRNG. Returns a function that produces [0,1) floats.
function mulberry32(seed) {
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
function makeRng(seed, ...salts) {
  let s = (seed | 0) >>> 0;
  for (const x of salts) {
    const v = typeof x === 'string' ? hashString(x) : (x >>> 0);
    s = Math.imul(s ^ v, 2654435761) >>> 0;
  }
  return mulberry32(s);
}

const SEED_KEY = 'fiveS.seed';

function getOrCreateSeed() {
  try {
    const existing = sessionStorage.getItem(SEED_KEY);
    if (existing) return Number(existing) >>> 0;
  } catch (_) { /* private mode etc. */ }
  const fresh = Math.floor(Math.random() * 0xffffffff) >>> 0;
  try { sessionStorage.setItem(SEED_KEY, String(fresh)); } catch (_) {}
  return fresh;
}

function resetSeed() {
  const fresh = Math.floor(Math.random() * 0xffffffff) >>> 0;
  try { sessionStorage.setItem(SEED_KEY, String(fresh)); } catch (_) {}
  return fresh;
}


// ── js/state.js ──────────────────────────────────────
function range(a, b) {
  const out = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}

const ROUND_DURATION_MS = 20000;

// Round definitions: structure only. User-facing strings come from i18n via
// the `key` field (e.g. round.chaos.title, round.chaos.description).
const ROUNDS = [
  {
    key: 'chaos',
    titleColor: 'title-blue',
    values: [...range(1, 49), ...range(50, 99)],
    required: range(1, 49),
    layout: 'full',
    showGrid3: false,
    dirty: true,
    cleanAnim: false,
  },
  {
    key: 'sort',
    titleColor: 'title-green',
    values: range(1, 49),
    layoutValues: [...range(1, 49), ...range(50, 99)],
    required: range(1, 49),
    layout: 'full',
    showGrid3: false,
    dirty: true,
    cleanAnim: false,
  },
  {
    key: 'setInOrder',
    titleColor: 'title-green',
    values: range(1, 49),
    required: range(1, 49),
    layout: 'full',
    showGrid3: true,
    useQuadrants: true,
    dirty: true,
    cleanAnim: false,
  },
  {
    key: 'shine',
    titleColor: 'title-green',
    values: range(1, 49),
    required: range(1, 49),
    layout: 'full',
    showGrid3: true,
    useQuadrants: true,
    dirty: false,
    cleanAnim: true,
  },
  {
    key: 'standardize',
    titleColor: 'title-green',
    values: range(1, 49),
    required: range(1, 49),
    layout: 'grid-5x10',
    showGrid3: false,
    dirty: false,
    cleanAnim: false,
  },
];

const state = {
  screen: 'welcome',
  seed: 0,
  currentRound: 0,
  target: 1,
  highestReached: 0,
  errors: 0,
  results: [],
};

function resetRoundState() {
  state.target = 1;
  state.highestReached = 0;
  state.errors = 0;
}

function resetGame() {
  state.currentRound = 0;
  state.results = [];
  resetRoundState();
}


// ── js/i18n.js ──────────────────────────────────────
// Lightweight i18n: string table + t(key) + applyI18n() that syncs DOM.
// Language choice persists in localStorage under 'fiveS.lang'.

const LANG_KEY = 'fiveS.lang';

const STRINGS = {
  es: {
    'welcome.title': 'Ejercicio 5S',
    'welcome.lede': 'Vas a vivir en carne propia cómo la metodología <strong>5S</strong> de Lean/Kaizen mejora un espacio de trabajo. Las 5S son un <em>sistema visual</em> que ayuda a reducir el desperdicio y lograr resultados operativos más consistentes, manteniendo un lugar de trabajo limpio y ordenado.',
    'welcome.cardS.title': 'Las 5 S',
    'welcome.cardS.seiri': '<strong>Seiri</strong> — Clasificar (eliminar lo innecesario)',
    'welcome.cardS.seiton': '<strong>Seiton</strong> — Ordenar (un lugar para cada cosa)',
    'welcome.cardS.seiso': '<strong>Seiso</strong> — Limpiar',
    'welcome.cardS.seiketsu': '<strong>Seiketsu</strong> — Estandarizar',
    'welcome.cardS.shitsuke': '<strong>Shitsuke</strong> — Sostener la disciplina',
    'welcome.cardMech.title': 'La mecánica',
    'welcome.cardMech.p1': 'Harás <strong>5 rondas de 20 segundos</strong>. En cada una debes hacer clic en los números del <strong>1 al 49 en orden</strong>, lo más rápido que puedas.',
    'welcome.cardMech.p2': 'En cada ronda aplicaremos una S al "taller" y vas a sentir cómo avanzas más lejos.',
    'welcome.langLabel': 'Idioma',
    'welcome.btnStart': 'Comenzar',
    'pre.task': 'Tu tarea',
    'pre.taskTitle': 'Encuentra los números <span class="title-blue">1 al 49</span> en orden',
    'pre.taskSub': '¿Hasta qué número llegas en 20 segundos?',
    'pre.btnStart': 'Empezar (20 s)',
    'hud.next': 'Siguiente',
    'hud.time': 'Tiempo',
    'hud.errors': 'Errores',
    'hud.cleanPrompt': '¡a limpiar!',
    'post.llegasteAl': 'Llegaste al número',
    'post.btnNext': 'Siguiente ronda',
    'post.btnSummary': 'Ver resumen',
    'post.howDidItGo': '¿Cómo te fue?',
    'post.noticedDiff': '¿Notaste la diferencia?',
    'post.completed49': '¡Completaste los 49!',
    'post.deltaPlus': (d) => `<strong>+${d}</strong> números más que la ronda anterior`,
    'post.deltaMinus': (d) => `<strong>${d}</strong> números menos que la ronda anterior`,
    'post.deltaSame': 'Mismo número que la ronda anterior',
    'post.errors0': 'Sin clics erróneos',
    'post.errors1': '1 clic erróneo',
    'post.errorsN': (n) => `${n} clics erróneos`,
    'post.eyebrow': (round, label) => `Ronda ${round} — ${label}`,
    'summary.eyebrow': 'Shitsuke — Disciplina',
    'summary.title': '¡Bien hecho!',
    'summary.lede': 'Acabas de sentir cómo cada S hace el trabajo más rápido, más fácil y con menos errores.',
    'summary.progress': 'Tu progreso',
    'summary.seiketsuNeeds': 'Seiketsu necesita Shitsuke',
    'summary.sustain1': 'Lograr un taller estandarizado es parte del trabajo. Lo <strong>difícil es sostenerlo</strong>. La quinta S —disciplina— es la que hace que las otras cuatro no se pierdan con el tiempo.',
    'summary.sustain2': 'Aplícalo en tu propio espacio: ¿qué harías hoy para empezar?',
    'summary.btnRestart': 'Reiniciar',
    'label.chaos': 'Caos',
    'label.sort': 'Sort',
    'label.setInOrder': 'Set in Order',
    'label.shine': 'Shine',
    'label.standardize': 'Standardize',
    'labelShort.chaos': 'Caos',
    'labelShort.sort': 'Sort',
    'labelShort.setInOrder': 'S.Order',
    'labelShort.shine': 'Shine',
    'labelShort.standardize': 'Std.',
    'round.chaos.eyebrow': 'Estado inicial — sin 5S',
    'round.chaos.title': 'Caos — antes de aplicar 5S',
    'round.chaos.description': 'Imagina un taller sin 5S: herramientas por todas partes, polvo, cosas que ya nadie usa. Encuentra los números 1 al 49 en orden. Tienes 20 segundos.',
    'round.sort.eyebrow': 'S1 — Sort (Seiri)',
    'round.sort.title': 'SORT — elimina lo innecesario',
    'round.sort.description': 'Aplicamos la primera S. Tiramos lo que no sirve: los números 50 al 99 ya no están. Las posiciones de 1 a 49 son las mismas. ¿Hasta cuánto llegas ahora?',
    'round.setInOrder.eyebrow': 'S2 — Set in Order (Seiton)',
    'round.setInOrder.title': 'SET IN ORDER — un lugar para cada cosa',
    'round.setInOrder.description': 'Clasificamos: cada cuadrante de la grilla 3×3 guarda un grupo de números consecutivos (1–6 en el primero, 7–11 en el siguiente, y así). Hay caos dentro de cada zona, pero ya sabes a qué zona ir.',
    'round.shine.eyebrow': 'S3 — Shine (Seiso)',
    'round.shine.title': 'SHINE — limpieza',
    'round.shine.description': 'Limpiamos el área: se van las manchas y los números opacos se ven nítidos. Mismos cuadrantes, menos fricción visual.',
    'round.standardize.eyebrow': 'S4 — Standardize (Seiketsu)',
    'round.standardize.title': 'STANDARDIZE — estandarizar',
    'round.standardize.description': 'Ordenamos los números en una cuadrícula estándar, del 1 al 49 en secuencia. Fíjate cuánto más rápido terminas ahora.',
    'aria.tileNumber': (n) => `Número ${n}`,
    'doc.title': 'Ejercicio 5S — Lean en carne propia',
  },
  en: {
    'welcome.title': '5S Exercise',
    'welcome.lede': 'You are going to experience firsthand how the <strong>5S</strong> methodology from Lean/Kaizen improves a workspace. 5S is a <em>visual system</em> that helps reduce waste and achieve more consistent operational results through a clean and orderly workplace.',
    'welcome.cardS.title': 'The 5 S',
    'welcome.cardS.seiri': '<strong>Seiri</strong> — Sort (remove what is unnecessary)',
    'welcome.cardS.seiton': '<strong>Seiton</strong> — Set in order (a place for everything)',
    'welcome.cardS.seiso': '<strong>Seiso</strong> — Shine',
    'welcome.cardS.seiketsu': '<strong>Seiketsu</strong> — Standardize',
    'welcome.cardS.shitsuke': '<strong>Shitsuke</strong> — Sustain the discipline',
    'welcome.cardMech.title': 'How it works',
    'welcome.cardMech.p1': 'You will run <strong>5 rounds of 20 seconds</strong>. In each, click the numbers from <strong>1 to 49 in order</strong>, as fast as you can.',
    'welcome.cardMech.p2': 'Every round we apply one S to the "workshop" and you will feel yourself get further.',
    'welcome.langLabel': 'Language',
    'welcome.btnStart': 'Start',
    'pre.task': 'Your task',
    'pre.taskTitle': 'Find the numbers <span class="title-blue">1 to 49</span> in order',
    'pre.taskSub': 'How far do you get in 20 seconds?',
    'pre.btnStart': 'Start (20 s)',
    'hud.next': 'Next',
    'hud.time': 'Time',
    'hud.errors': 'Errors',
    'hud.cleanPrompt': 'cleaning!',
    'post.llegasteAl': 'You reached number',
    'post.btnNext': 'Next round',
    'post.btnSummary': 'See summary',
    'post.howDidItGo': 'How did it go?',
    'post.noticedDiff': 'Noticed the difference?',
    'post.completed49': 'You got all 49!',
    'post.deltaPlus': (d) => `<strong>+${d}</strong> numbers more than the previous round`,
    'post.deltaMinus': (d) => `<strong>${d}</strong> numbers fewer than the previous round`,
    'post.deltaSame': 'Same number as the previous round',
    'post.errors0': 'No wrong clicks',
    'post.errors1': '1 wrong click',
    'post.errorsN': (n) => `${n} wrong clicks`,
    'post.eyebrow': (round, label) => `Round ${round} — ${label}`,
    'summary.eyebrow': 'Shitsuke — Discipline',
    'summary.title': 'Well done!',
    'summary.lede': 'You just felt how each S makes the work faster, easier, and with fewer errors.',
    'summary.progress': 'Your progress',
    'summary.seiketsuNeeds': 'Seiketsu needs Shitsuke',
    'summary.sustain1': 'Getting to a standardized workshop is part of the job. The <strong>hard part is sustaining it</strong>. The fifth S —discipline— is what keeps the other four from eroding over time.',
    'summary.sustain2': 'Apply it in your own space: what would you do today to start?',
    'summary.btnRestart': 'Restart',
    'label.chaos': 'Chaos',
    'label.sort': 'Sort',
    'label.setInOrder': 'Set in Order',
    'label.shine': 'Shine',
    'label.standardize': 'Standardize',
    'labelShort.chaos': 'Chaos',
    'labelShort.sort': 'Sort',
    'labelShort.setInOrder': 'S.Order',
    'labelShort.shine': 'Shine',
    'labelShort.standardize': 'Std.',
    'round.chaos.eyebrow': 'Initial State — before 5S',
    'round.chaos.title': 'Chaos — before 5S',
    'round.chaos.description': 'Imagine a workshop without 5S: tools all over the place, dust, things no one uses anymore. Find the numbers 1 to 49 in order. You have 20 seconds.',
    'round.sort.eyebrow': 'S1 — Sort (Seiri)',
    'round.sort.title': 'SORT — remove the unnecessary',
    'round.sort.description': 'We apply the first S. We remove what is unnecessary: numbers 50–99 are gone. The positions of 1 to 49 stay the same. How far do you get now?',
    'round.setInOrder.eyebrow': 'S2 — Set in Order (Seiton)',
    'round.setInOrder.title': 'SET IN ORDER — a place for everything',
    'round.setInOrder.description': 'Classify: each cell of the 3×3 grid holds a consecutive group of numbers (1–6 in the first, 7–11 in the next, and so on). Chaos inside each zone, but now you know where to look.',
    'round.shine.eyebrow': 'S3 — Shine (Seiso)',
    'round.shine.title': 'SHINE — cleaning',
    'round.shine.description': 'We clean the area: stains go, dim numbers become crisp. Same quadrants, less visual friction.',
    'round.standardize.eyebrow': 'S4 — Standardize (Seiketsu)',
    'round.standardize.title': 'STANDARDIZE — Seiketsu',
    'round.standardize.description': 'We lay out the numbers in a standard grid, 1 to 49 in sequence. Notice how much faster you finish now.',
    'aria.tileNumber': (n) => `Number ${n}`,
    'doc.title': '5S Exercise — Lean firsthand',
  },
};

let currentLang = 'es';

function detectLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'es' || saved === 'en') return saved;
  } catch (_) {}
  const nav = (typeof navigator !== 'undefined' && navigator.language) || 'es';
  return nav.toLowerCase().startsWith('en') ? 'en' : 'es';
}

function initI18n() {
  currentLang = detectLang();
  applyI18n();
}

function getLang() {
  return currentLang;
}

function setLang(lang) {
  if (lang !== 'es' && lang !== 'en') return;
  currentLang = lang;
  try { localStorage.setItem(LANG_KEY, lang); } catch (_) {}
  applyI18n();
}

function t(key, ...args) {
  const table = STRINGS[currentLang] || STRINGS.es;
  const value = table[key];
  if (typeof value === 'function') return value(...args);
  if (value == null) return key;
  return value;
}

// Sync every element carrying data-i18n / data-i18n-html with current locale.
function applyI18n() {
  document.documentElement.lang = currentLang;
  document.title = t('doc.title');
  for (const el of document.querySelectorAll('[data-i18n]')) {
    el.textContent = t(el.getAttribute('data-i18n'));
  }
  for (const el of document.querySelectorAll('[data-i18n-html]')) {
    el.innerHTML = t(el.getAttribute('data-i18n-html'));
  }
  // Language toggle: reflect pressed state
  for (const el of document.querySelectorAll('[data-lang-btn]')) {
    const btn = el;
    const isActive = btn.getAttribute('data-lang-btn') === currentLang;
    btn.setAttribute('aria-pressed', String(isActive));
    btn.classList.toggle('is-active', isActive);
  }
}


// ── js/layout.js ──────────────────────────────────────
const FONTS = ['Georgia, serif', '"Times New Roman", Times, serif', '"Didot", "Bodoni MT", serif', 'Cambria, Cochin, serif'];

function getRootTileSize() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--tile-size');
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 72;
}

// Chip dimensions guaranteed to fit `count` tiles in the board area.
// User's --tile-size preference is respected but capped so everything fits.
function getChipDims(boardW, boardH, count) {
  const tileSize = getRootTileSize();
  const area = boardW * boardH;
  // Use 42% packing efficiency — conservative enough to avoid pileups
  const maxSide = Math.sqrt((area * 0.42) / Math.max(1, count));
  const w = Math.min(tileSize * 1.3, maxSide * 1.2);
  const h = Math.min(tileSize * 0.85, maxSide * 0.85);
  return { w: Math.max(38, w), h: Math.max(28, h) };
}

// Rotated bounding box of a chip (for collision detection)
function chipBB(chipW, chipH, rot) {
  const r = Math.abs(rot) * Math.PI / 180;
  const bbW = chipW * Math.abs(Math.cos(r)) + chipH * Math.abs(Math.sin(r));
  const bbH = chipW * Math.abs(Math.sin(r)) + chipH * Math.abs(Math.cos(r));
  return { w: bbW, h: bbH };
}

// Per-value tile style (stable across rounds for same seed).
// fontScale: visual variety of font size WITHIN the chip (doesn't affect layout box).
function tileStyleFor(seed, value) {
  const rng = makeRng(seed, 'full', value);
  const sizeRoll = rng();
  const fontScale = 0.55 + sizeRoll * 0.85; // 0.55–1.40 range within chip
  const rotRoll = rng();
  // ~20% dramatic rotation, ~80% mostly upright
  const rot = rotRoll < 0.20
    ? (rng() - 0.5) * 70   // ±35deg
    : (rng() - 0.5) * 20;  // ±10deg
  const fontIdx = Math.floor(rng() * FONTS.length);
  return { fontScale, rot, fontIdx, fontFamily: FONTS[fontIdx] };
}

function placeInRect(seed, values, rect, opts = {}) {
  const gap   = opts.gap   ?? 8;
  const inset = opts.inset ?? 6;
  const { w: chipW, h: chipH } = opts.chipDims;
  const placed = opts.placed || [];
  const result = [];
  const x0 = rect.x0 ?? 0;
  const y0 = rect.y0 ?? 0;

  const maxX = Math.max(inset, rect.w - chipW - inset);
  const maxY = Math.max(inset, rect.h - chipH - inset);

  for (const value of values) {
    const rng = makeRng(seed, opts.salt || 'full-pos', value);
    const style = tileStyleFor(seed, value);
    const bb = chipBB(chipW, chipH, style.rot);

    let placedOk = false;
    let x = inset + x0, y = inset + y0;

    for (let attempt = 0; attempt < 600; attempt++) {
      const lx = inset + rng() * Math.max(0, maxX - inset);
      const ly = inset + rng() * Math.max(0, maxY - inset);
      const tx = x0 + lx;
      const ty = y0 + ly;
      const cx = tx + chipW / 2;
      const cy = ty + chipH / 2;
      let conflict = false;
      for (const p of placed) {
        const dx = cx - p.cx;
        const dy = cy - p.cy;
        const minDist = (Math.max(bb.w, bb.h) / 2) + (Math.max(p.bw, p.bh) / 2) + gap;
        if (dx * dx + dy * dy < minDist * minDist) { conflict = true; break; }
      }
      if (!conflict) { x = tx; y = ty; placedOk = true; break; }
    }

    if (!placedOk) {
      // Fallback: distribute in a grid that wraps WITHOUT clamping.
      // Clamping caused all overflow tiles to stack on top of each other.
      const idx = result.length;
      const usableW = rect.w - inset * 2;
      const usableH = rect.h - inset * 2;
      const cols = Math.max(1, Math.floor(usableW / (chipW + gap)));
      const rows = Math.max(1, Math.floor(usableH / (chipH + gap)));
      const totalCells = cols * rows;
      const cell = idx % totalCells;
      const col  = cell % cols;
      const row  = Math.floor(cell / cols);
      x = x0 + inset + col * (chipW + gap);
      y = y0 + inset + row * (chipH + gap);
    }

    placed.push({ cx: x + chipW / 2, cy: y + chipH / 2, bw: bb.w, bh: bb.h });
    result.push({ value, x, y, chipW, chipH, ...style });
  }
  return result;
}

// Classic "full" layout (R1/R2) — grid-with-jitter
// Every tile gets its own cell so tiles never structurally overlap,
// while position + rotation jitter keeps the board looking chaotic.
function computeFullLayout(seed, values, rect) {
  const chipDims = getChipDims(rect.w, rect.h, values.length);
  const { w: chipW, h: chipH } = chipDims;

  const n = values.length;
  const aspect = (rect.h > 0) ? (rect.w / rect.h) : 1.77;
  const cols = Math.ceil(Math.sqrt(n * aspect));
  const rows = Math.ceil(n / cols);
  const cellW = rect.w / cols;
  const cellH = rect.h / rows;

  const positions = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) positions.push({ c, r });
  }
  const rngShuffle = makeRng(seed, 'grid-shuffle');
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(rngShuffle() * (i + 1));
    const tmp = positions[i]; positions[i] = positions[j]; positions[j] = tmp;
  }

  const result = [];
  for (let i = 0; i < n; i++) {
    const value = values[i];
    const pos   = positions[i];
    const style = tileStyleFor(seed, value);

    const slackX = Math.max(0, cellW - chipW) * 0.4;
    const slackY = Math.max(0, cellH - chipH) * 0.4;
    const jx = (makeRng(seed, 'jx', value)() - 0.5) * slackX * 2;
    const jy = (makeRng(seed, 'jy', value)() - 0.5) * slackY * 2;

    const cx = pos.c * cellW + cellW / 2 + jx;
    const cy = pos.r * cellH + cellH / 2 + jy;

    const x = Math.max(2, Math.min(rect.w - chipW - 2, cx - chipW / 2));
    const y = Math.max(2, Math.min(rect.h - chipH - 2, cy - chipH / 2));

    result.push({ value, x, y, chipW, chipH, ...style });
  }
  return result;
}

// Quadrant layout (R3/R4): 9 cells, each with a consecutive group
function computeQuadrantLayout(seed, values, rect) {
  const COLS = 3, ROWS = 3;
  const cellW = rect.w / COLS;
  const cellH = rect.h / ROWS;
  const cells = COLS * ROWS;
  const perCell = Math.ceil(values.length / cells);
  const chipDims = getChipDims(cellW, cellH, perCell + 1);
  const placed = [];
  const result = [];
  for (let i = 0; i < cells; i++) {
    const col  = i % COLS;
    const row  = Math.floor(i / COLS);
    const from = i * perCell;
    const to   = Math.min(values.length, from + perCell);
    if (from >= to) continue;
    const chunk   = values.slice(from, to);
    const subRect = { x0: col * cellW, y0: row * cellH, w: cellW, h: cellH };
    const part    = placeInRect(seed, chunk, subRect, { salt: `quad-${i}`, placed, chipDims, inset: 4, gap: 6 });
    for (const p of part) result.push(p);
  }
  return result;
}

// Clamp a rendered chip inside the board
function clampTileToBoard(tileEl, boardRect) {
  const tr = tileEl.getBoundingClientRect();
  const m = 2;
  let dx = 0, dy = 0;
  if (tr.left - boardRect.left < m) dx = m - (tr.left - boardRect.left);
  else if (boardRect.right - tr.right < m) dx = -(m - (boardRect.right - tr.right));
  if (tr.top - boardRect.top < m) dy = m - (tr.top - boardRect.top);
  else if (boardRect.bottom - tr.bottom < m) dy = -(m - (boardRect.bottom - tr.bottom));
  if (dx !== 0 || dy !== 0) {
    tileEl.style.left = (parseFloat(tileEl.style.left) || 0) + dx + 'px';
    tileEl.style.top  = (parseFloat(tileEl.style.top)  || 0) + dy + 'px';
  }
}

// Dimmed set
function computeDimSet(seed, values, probability = 0.30) {
  const set = new Set();
  for (const v of values) {
    if (makeRng(seed, 'dim', v)() < probability) set.add(v);
  }
  return set;
}

// Dirt blobs — multi-pattern: blobs + hatch lines + splatter drops + drips
function computeDirtBlobs(seed, rect) {
  const rng   = makeRng(seed, 'dirt-count');
  const blobs = [];

  // ── Organic blobs (original) ─────────────────────────
  const blobCount = 28 + Math.floor(rng() * 12);
  for (let i = 0; i < blobCount; i++) {
    const rSz  = makeRng(seed, 'dirt-size',  i);
    const rSh  = makeRng(seed, 'dirt-shape', i);
    const radius = 20 + rSz() * 45;
    const x = makeRng(seed, 'dirt-x', i)() * rect.w;
    const y = makeRng(seed, 'dirt-y', i)() * rect.h;
    const sides = 12;
    const pts = [];
    for (let k = 0; k < sides; k++) {
      const angle  = (k / sides) * Math.PI * 2;
      const wobble = 0.45 + rSh() * 1.05;
      pts.push([Math.cos(angle) * radius * wobble, Math.sin(angle) * radius * wobble]);
    }
    let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)} `;
    for (let k = 0; k < pts.length; k++) {
      const p1 = pts[k], p2 = pts[(k + 1) % pts.length];
      const cx = (p1[0] + p2[0]) / 2, cy = (p1[1] + p2[1]) / 2;
      d += `Q ${p1[0].toFixed(1)} ${p1[1].toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)} `;
    }
    d += 'Z';
    blobs.push({ type: 'blob', d, x, y, opacity: 0.28 + rSz() * 0.35, blur: 0.5 + rSh() * 1.5 });
  }

  // ── Hatch lines (now curved) ────────────────────────
  const lineCount = 20 + Math.floor(makeRng(seed, 'line-count')() * 12);
  for (let i = 0; i < lineCount; i++) {
    const rx  = makeRng(seed, 'line-x', i)();
    const ry  = makeRng(seed, 'line-y', i)();
    const rlen = makeRng(seed, 'line-len', i)();
    const rang = makeRng(seed, 'line-ang', i)();
    const x1  = rx * rect.w;
    const y1  = ry * rect.h;
    const len = 40 + rlen * 120;
    const angle = rang * Math.PI;
    const x2  = x1 + Math.cos(angle) * len;
    const y2  = y1 + Math.sin(angle) * len;
    // Control point for curve (perpendicular offset)
    const bend = (makeRng(seed, 'line-bend', i)() - 0.5) * 40;
    const mx   = (x1 + x2) / 2 + Math.cos(angle + Math.PI / 2) * bend;
    const my   = (y1 + y2) / 2 + Math.sin(angle + Math.PI / 2) * bend;
    const w   = 1.5 + makeRng(seed, 'line-w', i)() * 3;
    blobs.push({ type: 'line', x1, y1, x2, y2, mx, my, w, opacity: 0.20 + makeRng(seed, 'line-op', i)() * 0.30 });
  }

  // ── Splatter drops (denser) ──────────────────────────
  const dropCount = 60 + Math.floor(makeRng(seed, 'drop-count')() * 40);
  for (let i = 0; i < dropCount; i++) {
    const x  = makeRng(seed, 'drop-x', i)() * rect.w;
    const y  = makeRng(seed, 'drop-y', i)() * rect.h;
    const r  = 1.5 + makeRng(seed, 'drop-r', i)() * 5;
    const op = 0.30 + makeRng(seed, 'drop-op', i)() * 0.45;
    blobs.push({ type: 'drop', x, y, r, opacity: op });
  }

  // ── Drip streaks ─────────────────────────────────────
  const dripCount = 10 + Math.floor(makeRng(seed, 'drip-count')() * 8);
  for (let i = 0; i < dripCount; i++) {
    const x = makeRng(seed, 'drip-x', i)() * rect.w;
    const y = makeRng(seed, 'drip-y', i)() * rect.h * 0.7;
    const h = 25 + makeRng(seed, 'drip-h', i)() * 60;
    const w = 2 + makeRng(seed, 'drip-w', i)() * 4;
    const op = 0.25 + makeRng(seed, 'drip-op', i)() * 0.35;
    blobs.push({ type: 'drip', x, y, h, w, opacity: op });
  }

  return blobs;
}

function buildDirtLayer(seed, rect) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg   = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'dirt-layer');
  svg.setAttribute('width',  rect.w);
  svg.setAttribute('height', rect.h);
  svg.setAttribute('viewBox', `0 0 ${rect.w} ${rect.h}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');

  for (const b of computeDirtBlobs(seed, rect)) {
    if (b.type === 'blob') {
      const g = document.createElementNS(svgNS, 'g');
      g.setAttribute('transform', `translate(${b.x.toFixed(1)},${b.y.toFixed(1)})`);
      g.setAttribute('style', `filter:blur(${b.blur}px)`);
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', b.d);
      path.setAttribute('fill', '#1a1c2e');
      path.setAttribute('fill-opacity', b.opacity.toFixed(3));
      g.appendChild(path);
      svg.appendChild(g);
    } else if (b.type === 'line') {
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', `M ${b.x1.toFixed(1)} ${b.y1.toFixed(1)} Q ${b.mx.toFixed(1)} ${b.my.toFixed(1)} ${b.x2.toFixed(1)} ${b.y2.toFixed(1)}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#1a1c2e');
      path.setAttribute('stroke-width', b.w.toFixed(1));
      path.setAttribute('stroke-opacity', b.opacity.toFixed(3));
      path.setAttribute('stroke-linecap', 'round');
      svg.appendChild(path);
    } else if (b.type === 'drop') {
      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', b.x.toFixed(1)); circle.setAttribute('cy', b.y.toFixed(1));
      circle.setAttribute('r', b.r.toFixed(1));
      circle.setAttribute('fill', '#1a1c2e');
      circle.setAttribute('fill-opacity', b.opacity.toFixed(3));
      svg.appendChild(circle);
    } else if (b.type === 'drip') {
      // Drip: thin rectangle tapering down
      const path = document.createElementNS(svgNS, 'path');
      const hw = b.w / 2;
      path.setAttribute('d', `M ${(b.x - hw).toFixed(1)} ${b.y.toFixed(1)} L ${(b.x + hw).toFixed(1)} ${b.y.toFixed(1)} L ${(b.x + 1).toFixed(1)} ${(b.y + b.h).toFixed(1)} Q ${b.x.toFixed(1)} ${(b.y + b.h + 5).toFixed(1)} ${(b.x - 1).toFixed(1)} ${(b.y + b.h).toFixed(1)} Z`);
      path.setAttribute('fill', '#1a1c2e');
      path.setAttribute('fill-opacity', b.opacity.toFixed(3));
      svg.appendChild(path);
    }
  }
  return svg;
}


// ── js/round.js ──────────────────────────────────────
let boardEl = null;
let hudNext = null;
let hudTime = null;
let hudErrors = null;

let rafId = null;
let startedAt = 0;
let duration = ROUND_DURATION_MS;
let currentFinish = null; // callback when round finishes
let resizeTimer = null;


function initRound() {
  boardEl = document.getElementById('board');
  hudNext = document.getElementById('hud-next');
  hudTime = document.getElementById('hud-time');
  hudErrors = document.getElementById('hud-errors');

  boardEl.addEventListener('click', onBoardClick);
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibilityChange);
}

function startRound(onFinish) {
  currentFinish = onFinish;
  resetRoundState();
  const round = ROUNDS[state.currentRound];

  boardEl.innerHTML = '';
  boardEl.className = 'board ' + (round.layout === 'grid-5x10' ? 'layout-grid-5x10' : 'layout-full');
  if (round.showGrid3 && round.layout !== 'grid-5x10') {
    boardEl.classList.add('with-grid-3');
  }
  if (round.dirty || round.cleanAnim) {
    boardEl.classList.add('is-dirty');
  }

  const rect = boardEl.getBoundingClientRect();
  // Use window height minus HUD as floor so layout never compresses into a tiny area
  const boardSize = {
    w: rect.width  || window.innerWidth,
    h: Math.max(rect.height, window.innerHeight - 64)
  };

  if (round.layout === 'grid-5x10') {
    buildGridBoard(round);
  } else {
    buildFullBoard(round, boardSize);
  }

  if (round.cleanAnim) {
    hudTime.textContent = t('hud.cleanPrompt');
    hudTime.classList.add('is-warn');
    setTimeout(() => {
      boardEl.classList.remove('is-dirty');
      boardEl.classList.add('clean-anim');
      setTimeout(() => boardEl.classList.remove('clean-anim'), 1100);
      hudTime.classList.remove('is-warn');
      beginTimer();
    }, 900);
  } else {
    beginTimer();
  }

  updateHud();
  highlightTarget();
}

function buildFullBoard(round, rect) {
  const seed = state.seed;
  // Use layoutValues (if defined) for computing positions — this lets round 2
  // share the exact same tile positions as round 1 (memory benefit for players).
  const layoutVals = round.layoutValues || round.values;
  const fullLayout = round.useQuadrants
    ? computeQuadrantLayout(seed, layoutVals, rect)
    : computeFullLayout(seed, layoutVals, rect);
  // Filter to only the values actually in play this round
  const valSet = new Set(round.values);
  const layout = fullLayout.filter(item => valSet.has(item.value));
  const dimSet = computeDimSet(seed, round.required, 0.30);

  for (const item of layout) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'num-tile';
    btn.dataset.value = String(item.value);
    btn.setAttribute('aria-label', t('aria.tileNumber', item.value));
    btn.textContent = String(item.value);
    // Shrink chips 8% so tiles overlap less
    const chipW = Math.round(item.chipW * 0.92);
    const chipH = Math.round(item.chipH * 0.92);
    btn.style.width  = chipW + 'px';
    btn.style.height = chipH + 'px';
    btn.style.fontSize = (chipH * 0.55 * item.fontScale) + 'px';
    btn.style.fontFamily = item.fontFamily;
    // 360° rotation persists across rounds using same seed+value key
    const rot = makeRng(seed, 'qrot', item.value)() * 360;
    const transform = `rotate(${rot.toFixed(2)}deg)`;
    btn.style.setProperty('--tile-transform', transform);
    btn.style.left = item.x + 'px';
    btn.style.top  = item.y + 'px';
    btn.style.transform = transform;
    btn.style.transformOrigin = 'center center';
    // Lower-numbered tiles sit on top so the current target is always clickable
    btn.style.zIndex = String(Math.max(1, 100 - item.value));
    if (dimSet.has(item.value)) btn.classList.add('is-dim');
    if (item.value === 6 || item.value === 9) btn.classList.add('has-underline');
    boardEl.appendChild(btn);
  }

  // Second pass: clamp each tile against the real board rect using measured
  // bounding box. Catches anything the estimate undercounted (tall digits,
  // wide two-digit numbers) so nothing overflows the viewport.
  const boardRect = boardEl.getBoundingClientRect();
  for (const el of boardEl.querySelectorAll('.num-tile')) {
    clampTileToBoard(el, boardRect);
  }

  // Dirt sits on top of the tiles so it actually obscures some numbers.
  // pointer-events: none (set in CSS) keeps clicks passing through to tiles.
  if (round.dirty || round.cleanAnim) {
    const dirt = buildDirtLayer(seed, rect);
    boardEl.appendChild(dirt);
  }
}

function buildGridBoard(round) {
  const seed = state.seed;
  const rect = boardEl.getBoundingClientRect();
  const cellW = rect.width  / 10;
  const cellH = rect.height / 5;
  // Card occupies 78% of cell so there's a visible gap between cards
  const cardW = Math.round(cellW * 0.78);
  const cardH = Math.round(cellH * 0.72);
  const dimSet = computeDimSet(seed, round.required, 0.30);
  for (let i = 0; i < 50; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    if (i < 49) {
      const value = i + 1;
      const style = tileStyleFor(seed, value);
      // Use same 360° rotation key as other rounds for consistency
      const rot = makeRng(seed, 'qrot', value)() * 360;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'num-tile';
      btn.dataset.value = String(value);
      btn.setAttribute('aria-label', t('aria.tileNumber', value));
      btn.textContent = String(value);
      btn.style.width  = cardW + 'px';
      btn.style.height = cardH + 'px';
      btn.style.fontSize = (Math.min(cardW, cardH) * 0.50 * Math.min(1.2, style.fontScale)) + 'px';
      btn.style.fontFamily = style.fontFamily;
      // Underline 6 and 9 so they're distinguishable when rotated
      if (value === 6 || value === 9) btn.classList.add('has-underline');
      const transform = `rotate(${rot.toFixed(2)}deg)`;
      btn.style.setProperty('--tile-transform', transform);
      btn.style.transform = transform;
      // Preserve dim state from earlier rounds
      if (dimSet.has(value)) btn.classList.add('is-persistent-dim');
      cell.appendChild(btn);
    }
    boardEl.appendChild(cell);
  }
}

function beginTimer() {
  startedAt = performance.now();
  duration = (window.GAME_TIMER_MS != null ? window.GAME_TIMER_MS : ROUND_DURATION_MS);
  cancelAnimationFrame(rafId);
  const tick = () => {
    const left = Math.max(0, duration - (performance.now() - startedAt));
    const seconds = left / 1000;
    hudTime.textContent = seconds.toFixed(1) + 's';
    if (seconds <= 5) hudTime.classList.add('is-warn');
    else hudTime.classList.remove('is-warn');
    if (left <= 0) {
      finishRound('timeout');
      return;
    }
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
}

function updateHud() {
  hudNext.textContent = state.target > 49 ? '—' : String(state.target);
  hudErrors.textContent = String(state.errors);
}

function highlightTarget() {
  for (const el of boardEl.querySelectorAll('.num-tile.is-target')) {
    el.classList.remove('is-target');
  }
  if (state.target > 49) return;
  const el = boardEl.querySelector(`.num-tile[data-value="${state.target}"]`);
  if (el) el.classList.add('is-target');
}

// ── Confetti burst on correct tile ────────────────────
const CONFETTI_COLORS = ['#f8f2e8','#1d6bff','#4a9e6b','#c8b89a','#a8c4ff','#7edba0','#f5c94e'];
function spawnConfetti(btn) {
  const rect = btn.getBoundingClientRect();
  const cx = rect.left + rect.width  / 2;
  const cy = rect.top  + rect.height / 2;
  const count = 14;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-particle';
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const dist  = 40 + Math.random() * 55;
    const vx = Math.cos(angle) * dist;
    const vy = Math.sin(angle) * dist - 20 + Math.random() * 30;
    el.style.left  = (cx - 3.5) + 'px';
    el.style.top   = (cy - 3.5) + 'px';
    el.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    el.style.setProperty('--cx', vx.toFixed(1) + 'px');
    el.style.setProperty('--cy', vy.toFixed(1) + 'px');
    el.style.setProperty('--cr', (Math.random() * 360).toFixed(0) + 'deg');
    el.style.animationDuration = (0.55 + Math.random() * 0.25) + 's';
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }
}

function onBoardClick(e) {
  // When tiles overlap, the topmost receives the click — but a smaller tile
  // hidden below may be the actual target. Walk every tile under the cursor
  // and prefer the one whose value matches state.target.
  const stack = typeof document.elementsFromPoint === 'function'
    ? document.elementsFromPoint(e.clientX, e.clientY)
    : [e.target];
  let targetBtn = null;
  let topBtn = null;
  for (const el of stack) {
    const btn = el.closest && el.closest('.num-tile');
    if (!btn || btn.disabled || btn.classList.contains('is-correct')) continue;
    if (!topBtn) topBtn = btn;
    if (Number(btn.dataset.value) === state.target) { targetBtn = btn; break; }
  }
  const btn = targetBtn || topBtn;
  if (!btn) return;
  const value = Number(btn.dataset.value);
  if (value === state.target) {
    btn.classList.add('is-correct');
    btn.classList.remove('is-target');
    btn.disabled = true;
    spawnConfetti(btn);
    state.highestReached = value;
    state.target += 1;
    if (state.target > 49) {
      updateHud();
      finishRound('completed');
      return;
    }
    updateHud();
    highlightTarget();
  } else {
    state.errors += 1;
    btn.classList.remove('shake');
    // force reflow to restart animation
    void btn.offsetWidth;
    btn.classList.add('shake');
    if (navigator.vibrate) {
      try { navigator.vibrate(40); } catch (_) {}
    }
    updateHud();
  }
}

function finishRound(reason) {
  if (!currentFinish) return;
  cancelAnimationFrame(rafId);
  rafId = null;
  const cb = currentFinish;
  currentFinish = null;
  // Freeze board: disable remaining clickable tiles
  for (const el of boardEl.querySelectorAll('.num-tile:not(:disabled)')) {
    el.disabled = true;
  }
  setTimeout(() => cb({ reason, highest: state.highestReached, errors: state.errors }), 500);
}

function onResize() {
  if (state.screen !== 'play') return;
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(rebuildBoardPreservingState, 150);
}

function rebuildBoardPreservingState() {
  const round = ROUNDS[state.currentRound];
  if (!round) return;
  // Save correct set and disabled set based on data-value
  const correctValues = new Set();
  for (const el of boardEl.querySelectorAll('.num-tile.is-correct')) {
    correctValues.add(Number(el.dataset.value));
  }

  // Rebuild
  boardEl.innerHTML = '';
  if (round.layout === 'grid-5x10') {
    buildGridBoard(round);
  } else {
    const rect = boardEl.getBoundingClientRect();
    buildFullBoard(round, { w: rect.width, h: rect.height });
  }

  // Restore correct/disabled
  for (const v of correctValues) {
    const el = boardEl.querySelector(`.num-tile[data-value="${v}"]`);
    if (el) { el.classList.add('is-correct'); el.disabled = true; }
  }
  highlightTarget();
}

function onVisibilityChange() {
  if (document.hidden && state.screen === 'play' && currentFinish) {
    // Simplificación: si el usuario oculta la tab durante el juego, finalizamos
    // la ronda al volver, para evitar pausas injustas.
    finishRound('hidden');
  }
}


// ── js/screens.js ──────────────────────────────────────
const screens = {};

function initScreens() {
  for (const el of document.querySelectorAll('.screen')) {
    screens[el.dataset.screen] = el;
  }
}

function showScreen(name) {
  state.screen = name;
  for (const [key, el] of Object.entries(screens)) {
    el.classList.toggle('is-active', key === name);
  }
  if (name !== 'play') window.scrollTo(0, 0);
}

function renderProgressTrack(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const shortKeys = ['Caos', 'S1', 'S2', 'S3', 'S4'];
  let html = '<div class="pt-track">';
  for (let i = 0; i < ROUNDS.length; i++) {
    const done    = i < state.currentRound;
    const active  = i === state.currentRound;
    const result  = state.results.find(r => r.round === i);
    const score   = result ? result.highest : null;
    const cls     = done ? 'done' : active ? 'active' : 'upcoming';
    // Chaos (i=0): show "●" when pending/active, score when done
    // S1–S4 (i=1–4): show S-number label
    const icon    = done ? score : (i === 0 ? '●' : shortKeys[i]);
    html += `
      <div class="pt-step ${cls}">
        <div class="pt-bubble">${icon}</div>
        <div class="pt-name">${shortKeys[i]}</div>
        ${done ? `<div class="pt-score">${score}/49</div>` : '<div class="pt-score">&nbsp;</div>'}
      </div>`;
    if (i < ROUNDS.length - 1) {
      html += `<div class="pt-connector ${done ? 'done' : ''}"></div>`;
    }
  }
  html += '</div>';
  el.innerHTML = html;
}

function renderPreRound() {
  const round = ROUNDS[state.currentRound];
  document.getElementById('pre-eyebrow').textContent = t(`round.${round.key}.eyebrow`);
  const titleEl = document.getElementById('pre-title');
  titleEl.textContent = t(`round.${round.key}.title`);
  titleEl.className = 'title ' + (round.titleColor || '');
  document.getElementById('pre-description').textContent = t(`round.${round.key}.description`);
  renderProgressTrack('progress-track-pre');
}

function renderPostRound({ highest, errors, previousHighest, isLast }) {
  const round = ROUNDS[state.currentRound];
  document.getElementById('post-eyebrow').textContent =
    t('post.eyebrow', state.currentRound + 1, t(`label.${round.key}`));
  const titleEl = document.getElementById('post-title');
  if (state.currentRound === 0) {
    titleEl.textContent = t('post.howDidItGo');
    titleEl.className = 'title title-red';
  } else if (highest === 49) {
    titleEl.textContent = t('post.completed49');
    titleEl.className = 'title title-blue';
  } else {
    titleEl.textContent = t('post.noticedDiff');
    titleEl.className = 'title title-blue';
  }

  document.getElementById('post-highest').textContent = highest;

  const deltaEl = document.getElementById('post-delta');
  if (previousHighest != null) {
    const diff = highest - previousHighest;
    if (diff > 0) {
      deltaEl.innerHTML = t('post.deltaPlus', diff);
      deltaEl.style.color = 'var(--green)';
    } else if (diff < 0) {
      deltaEl.innerHTML = t('post.deltaMinus', diff);
      deltaEl.style.color = 'var(--red)';
    } else {
      deltaEl.textContent = t('post.deltaSame');
      deltaEl.style.color = 'var(--muted)';
    }
  } else {
    deltaEl.textContent = '';
  }

  const errorsEl = document.getElementById('post-errors');
  if (errors === 0) errorsEl.textContent = t('post.errors0');
  else if (errors === 1) errorsEl.textContent = t('post.errors1');
  else errorsEl.textContent = t('post.errorsN', errors);

  document.getElementById('btn-post-next').textContent = isLast ? t('post.btnSummary') : t('post.btnNext');
  renderProgressTrack('progress-track-post');
}

function renderSummary() {
  const chart = document.getElementById('chart');
  chart.innerHTML = '';
  chart.style.height = 'auto';

  const results = state.results;
  if (!results.length) return;

  const maxVal = 49;
  const W = 320, H = 160;
  const padL = 28, padR = 12, padT = 20, padB = 30;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = results.length;

  const xPos = i => padL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yPos = v => padT + innerH - (v / maxVal) * innerH;

  const pts = results.map((r, i) => ({
    x: xPos(i), y: yPos(r.highest), v: r.highest,
    key: ROUNDS[r.round].key
  }));
  const bestIdx = results.reduce((bi, r, i, arr) => r.highest > arr[bi].highest ? i : bi, 0);

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', H);
  svg.style.overflow = 'visible';
  svg.style.fontFamily = "'Space Grotesk', sans-serif";

  // Grid lines
  for (const v of [10, 20, 30, 40, 49]) {
    const y = yPos(v);
    const gl = document.createElementNS(svgNS, 'line');
    gl.setAttribute('x1', padL); gl.setAttribute('x2', W - padR);
    gl.setAttribute('y1', y);   gl.setAttribute('y2', y);
    gl.setAttribute('stroke', 'oklch(87% 0.02 255)');
    gl.setAttribute('stroke-width', '1');
    svg.appendChild(gl);
    const yl = document.createElementNS(svgNS, 'text');
    yl.setAttribute('x', padL - 5); yl.setAttribute('y', y + 3.5);
    yl.setAttribute('text-anchor', 'end');
    yl.setAttribute('font-size', '8'); yl.setAttribute('fill', 'oklch(65% 0.04 255)');
    yl.textContent = v;
    svg.appendChild(yl);
  }

  // Area fill
  const areaPts = [
    `M ${pts[0].x} ${padT + innerH}`,
    ...pts.map(p => `L ${p.x} ${p.y}`),
    `L ${pts[pts.length-1].x} ${padT + innerH}`, 'Z'
  ].join(' ');
  const area = document.createElementNS(svgNS, 'path');
  area.setAttribute('d', areaPts);
  area.setAttribute('fill', 'oklch(65% 0.22 255 / 0.10)');
  svg.appendChild(area);

  // Line
  const linePts = pts.map((p, i) => `${i===0?'M':'L'} ${p.x} ${p.y}`).join(' ');
  const line = document.createElementNS(svgNS, 'path');
  line.setAttribute('d', linePts);
  line.setAttribute('fill', 'none');
  line.setAttribute('stroke', 'oklch(55% 0.22 255)');
  line.setAttribute('stroke-width', '2.5');
  line.setAttribute('stroke-linejoin', 'round');
  line.setAttribute('stroke-linecap', 'round');
  svg.appendChild(line);

  // Dots + labels
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const isBest = i === bestIdx;
    const dotColor = isBest ? 'oklch(52% 0.20 148)' : 'oklch(55% 0.22 255)';

    const vl = document.createElementNS(svgNS, 'text');
    vl.setAttribute('x', p.x); vl.setAttribute('y', p.y - 9);
    vl.setAttribute('text-anchor', 'middle');
    vl.setAttribute('font-size', '10');
    vl.setAttribute('font-weight', isBest ? '800' : '600');
    vl.setAttribute('fill', isBest ? 'oklch(44% 0.18 148)' : 'oklch(35% 0.05 255)');
    vl.textContent = p.v;
    svg.appendChild(vl);

    const dot = document.createElementNS(svgNS, 'circle');
    dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y);
    dot.setAttribute('r', isBest ? '5.5' : '4');
    dot.setAttribute('fill', dotColor);
    svg.appendChild(dot);

    const rl = document.createElementNS(svgNS, 'text');
    rl.setAttribute('x', p.x); rl.setAttribute('y', H - 2);
    rl.setAttribute('text-anchor', 'middle');
    rl.setAttribute('font-size', '8.5'); rl.setAttribute('font-weight', '600');
    rl.setAttribute('fill', 'oklch(55% 0.05 255)');
    rl.textContent = t(`labelShort.${p.key}`);
    svg.appendChild(rl);
  }

  chart.appendChild(svg);
}



// ── js/main.js ──────────────────────────────────────
function startNewGame(freshSeed = false) {
  resetGame();
  state.seed = freshSeed ? resetSeed() : getOrCreateSeed();
  showScreen('welcome');
}

function goToPreRound() {
  renderPreRound();
  showScreen('preRound');
}

function onRoundFinish(outcome) {
  const previous = state.results[state.currentRound - 1]?.highest ?? null;
  state.results.push({
    round: state.currentRound,
    highest: outcome.highest,
    errors: outcome.errors,
    reason: outcome.reason,
  });
  const isLast = state.currentRound === ROUNDS.length - 1;
  renderPostRound({
    highest: outcome.highest,
    errors: outcome.errors,
    previousHighest: previous,
    isLast,
  });
  showScreen('postRound');
}

function goNextAfterPost() {
  if (state.currentRound >= ROUNDS.length - 1) {
    renderSummary();
    showScreen('summary');
  } else {
    state.currentRound += 1;
    goToPreRound();
  }
}

function wireEvents() {
  document.getElementById('btn-start').addEventListener('click', () => {
    state.currentRound = 0;
    goToPreRound();
  });

  document.getElementById('btn-pre-start').addEventListener('click', () => {
    showScreen('play');
    // give the browser a frame to apply the play-screen layout so getBoundingClientRect() is accurate
    requestAnimationFrame(() => startRound(onRoundFinish));
  });

  document.getElementById('btn-post-next').addEventListener('click', goNextAfterPost);

  document.getElementById('btn-restart').addEventListener('click', () => {
    startNewGame(true);
  });

  for (const btn of document.querySelectorAll('[data-lang-btn]')) {
    btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang-btn')));
  }
}

function boot() {
  initI18n();
  initScreens();
  initRound();
  wireEvents();
  state.seed = getOrCreateSeed();
  showScreen('welcome');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}


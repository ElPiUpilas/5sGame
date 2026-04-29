import { makeRng } from './rng.js?v=3';

const FONTS = ['Georgia, serif', '"Times New Roman", Times, serif', '"Didot", "Bodoni MT", serif', 'Cambria, Cochin, serif'];

function getRootTileSize() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--tile-size');
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 72;
}

// Chip dimensions guaranteed to fit `count` tiles in the board area.
// User's --tile-size preference is respected but capped so everything fits.
export function getChipDims(boardW, boardH, count) {
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
export function tileStyleFor(seed, value) {
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
      // Wrap around the grid cyclically — every tile gets a unique cell
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
export function computeFullLayout(seed, values, rect) {
  const chipDims = getChipDims(rect.w, rect.h, values.length);
  const { w: chipW, h: chipH } = chipDims;

  const n = values.length;
  // Aspect-ratio-aware column count (guard against zero height)
  const aspect = (rect.h > 0) ? (rect.w / rect.h) : 1.77;
  const cols = Math.ceil(Math.sqrt(n * aspect));
  const rows = Math.ceil(n / cols);
  const cellW = rect.w / cols;
  const cellH = rect.h / rows;

  // Shuffle cell positions with seeded RNG so layout is reproducible
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

    // Jitter within cell (40% of slack space so tiles never leave their cell)
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
export function computeQuadrantLayout(seed, values, rect) {
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
export function clampTileToBoard(tileEl, boardRect) {
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
export function computeDimSet(seed, values, probability = 0.30) {
  const set = new Set();
  for (const v of values) {
    if (makeRng(seed, 'dim', v)() < probability) set.add(v);
  }
  return set;
}

// Dirt blobs (ink-color CAPTCHA style)
export function computeDirtBlobs(seed, rect) {
  const rng   = makeRng(seed, 'dirt-count');
  const count = 26 + Math.floor(rng() * 10); // 26..35
  const blobs = [];
  for (let i = 0; i < count; i++) {
    const rSz  = makeRng(seed, 'dirt-size',  i);
    const rSh  = makeRng(seed, 'dirt-shape', i);
    const radius = 24 + rSz() * 60;
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
    const opacity = 0.35 + rSz() * 0.40;
    const blur    = 0.5  + rSh() * 1.5;
    blobs.push({ d, x, y, opacity, blur });
  }
  return blobs;
}

export function buildDirtLayer(seed, rect) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg   = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'dirt-layer');
  svg.setAttribute('width',  rect.w);
  svg.setAttribute('height', rect.h);
  svg.setAttribute('viewBox', `0 0 ${rect.w} ${rect.h}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  for (const b of computeDirtBlobs(seed, rect)) {
    const g = document.createElementNS(svgNS, 'g');
    g.setAttribute('transform', `translate(${b.x.toFixed(1)},${b.y.toFixed(1)})`);
    g.setAttribute('style', `filter:blur(${b.blur}px)`);
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', b.d);
    path.setAttribute('fill', '#1a1c2e');
    path.setAttribute('fill-opacity', b.opacity.toFixed(3));
    g.appendChild(path);
    svg.appendChild(g);
  }
  return svg;
}

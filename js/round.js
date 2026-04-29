import { state, ROUNDS, ROUND_DURATION_MS, resetRoundState } from './state.js?v=3';
import { computeFullLayout, computeQuadrantLayout, computeDimSet, buildDirtLayer, clampTileToBoard, tileStyleFor, getChipDims } from './layout.js?v=3';
import { makeRng } from './rng.js?v=3';
import { t } from './i18n.js?v=3';

let boardEl = null;
let hudNext = null;
let hudTime = null;
let hudErrors = null;

let rafId = null;
let startedAt = 0;
let duration = ROUND_DURATION_MS;
let currentFinish = null; // callback when round finishes
let resizeTimer = null;


export function initRound() {
  boardEl = document.getElementById('board');
  hudNext = document.getElementById('hud-next');
  hudTime = document.getElementById('hud-time');
  hudErrors = document.getElementById('hud-errors');

  boardEl.addEventListener('click', onBoardClick);
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibilityChange);
}

export function startRound(onFinish) {
  currentFinish = onFinish;
  resetRoundState();
  const round = ROUNDS[state.currentRound];

  // Build board fresh
  boardEl.innerHTML = '';
  boardEl.className = 'board ' + (round.layout === 'grid-5x10' ? 'layout-grid-5x10' : 'layout-full');
  if (round.showGrid3 && round.layout !== 'grid-5x10') {
    boardEl.classList.add('with-grid-3');
  }
  if (round.dirty || round.cleanAnim) {
    boardEl.classList.add('is-dirty');
  }

  // Defer board measurement by two frames so flex layout settles
  // before we read getBoundingClientRect (avoids height=0 / compressed grid)
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const rect = boardEl.getBoundingClientRect();
    const boardSize = { w: rect.width || window.innerWidth, h: rect.height || (window.innerHeight - 60) };

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
  }));
}

function buildFullBoard(round, rect) {
  const seed = state.seed;
  // R3 Seiton and R4 Shine: tiles are classified into a 3×3 of cells
  // (1–6 in the first cell, 7–11 in the next, …). Positions stay chaotic
  // *within* each cell, so the grid actually does something pedagogically.
  const layout = round.useQuadrants
    ? computeQuadrantLayout(seed, round.values, rect)
    : computeFullLayout(seed, round.values, rect);
  const dimSet = computeDimSet(seed, round.required, 0.30);

  for (const item of layout) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'num-tile';
    btn.dataset.value = String(item.value);
    btn.setAttribute('aria-label', t('aria.tileNumber', item.value));
    btn.textContent = String(item.value);
    btn.style.width  = item.chipW + 'px';
    btn.style.height = item.chipH + 'px';
    btn.style.fontSize = (item.chipH * 0.55 * item.fontScale) + 'px';
    btn.style.fontFamily = item.fontFamily;
    // Round 3 quadrant layout: full 360° rotation for extra difficulty
    const rot = round.useQuadrants
      ? makeRng(seed, 'qrot', item.value)() * 360
      : item.rot;
    const transform = `rotate(${rot.toFixed(2)}deg)`;
    btn.style.setProperty('--tile-transform', transform);
    btn.style.left = item.x + 'px';
    btn.style.top  = item.y + 'px';
    btn.style.transform = transform;
    btn.style.transformOrigin = 'center center';
    if (dimSet.has(item.value)) btn.classList.add('is-dim');
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
  const dimSet = computeDimSet(seed, round.required, 0.30);
  for (let i = 0; i < 50; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    if (i < 49) {
      const value = i + 1;
      const style = tileStyleFor(seed, value);
      // More aggressive rotation for grid round difficulty (±25°)
      const rot = (makeRng(seed, 'grid-rot', value)() - 0.5) * 50;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'num-tile';
      btn.dataset.value = String(value);
      btn.setAttribute('aria-label', t('aria.tileNumber', value));
      btn.textContent = String(value);
      btn.style.fontSize = (Math.min(cellW, cellH) * 0.50 * Math.min(1.2, style.fontScale)) + 'px';
      btn.style.fontFamily = style.fontFamily;
      const transform = `rotate(${rot.toFixed(2)}deg)`;
      btn.style.setProperty('--tile-transform', transform);
      btn.style.transform = transform;
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

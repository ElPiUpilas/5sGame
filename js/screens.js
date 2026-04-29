import { state, ROUNDS, resetGame, resetRoundState } from './state.js?v=3';
import { resetSeed, getOrCreateSeed } from './rng.js?v=3';
import { t } from './i18n.js?v=3';

const screens = {};

export function initScreens() {
  for (const el of document.querySelectorAll('.screen')) {
    screens[el.dataset.screen] = el;
  }
}

export function showScreen(name) {
  state.screen = name;
  for (const [key, el] of Object.entries(screens)) {
    el.classList.toggle('is-active', key === name);
  }
  if (name !== 'play') window.scrollTo(0, 0);
}

function renderProgressTrack(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const roundLabels = ['chaos','sort','setInOrder','shine','standardize'];
  const shortKeys   = ['Chaos','Sort','Order','Shine','Std.'];
  let html = '<div class="pt-track">';
  for (let i = 0; i < ROUNDS.length; i++) {
    const done    = i < state.currentRound;
    const active  = i === state.currentRound;
    const result  = state.results.find(r => r.round === i);
    const score   = result ? result.highest : null;
    const cls     = done ? 'done' : active ? 'active' : 'upcoming';
    const icon    = done ? score : active ? (i + 1) : (i + 1);
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

export function renderPreRound() {
  const round = ROUNDS[state.currentRound];
  document.getElementById('pre-eyebrow').textContent = t(`round.${round.key}.eyebrow`);
  const titleEl = document.getElementById('pre-title');
  titleEl.textContent = t(`round.${round.key}.title`);
  titleEl.className = 'title ' + (round.titleColor || '');
  document.getElementById('pre-description').textContent = t(`round.${round.key}.description`);
  renderProgressTrack('progress-track-pre');
}

export function renderPostRound({ highest, errors, previousHighest, isLast }) {
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

export function renderSummary() {
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

  for (const v of [10, 20, 30, 40, 49]) {
    const y = yPos(v);
    const gl = document.createElementNS(svgNS, 'line');
    gl.setAttribute('x1', padL); gl.setAttribute('x2', W - padR);
    gl.setAttribute('y1', y);   gl.setAttribute('y2', y);
    gl.setAttribute('stroke', 'oklch(87% 0.02 255)'); gl.setAttribute('stroke-width', '1');
    svg.appendChild(gl);
    const yl = document.createElementNS(svgNS, 'text');
    yl.setAttribute('x', padL - 5); yl.setAttribute('y', y + 3.5);
    yl.setAttribute('text-anchor', 'end'); yl.setAttribute('font-size', '8');
    yl.setAttribute('fill', 'oklch(65% 0.04 255)');
    yl.textContent = v;
    svg.appendChild(yl);
  }

  const areaPts = [
    `M ${pts[0].x} ${padT + innerH}`,
    ...pts.map(p => `L ${p.x} ${p.y}`),
    `L ${pts[pts.length-1].x} ${padT + innerH}`, 'Z'
  ].join(' ');
  const area = document.createElementNS(svgNS, 'path');
  area.setAttribute('d', areaPts);
  area.setAttribute('fill', 'oklch(65% 0.22 255 / 0.10)');
  svg.appendChild(area);

  const linePts = pts.map((p, i) => `${i===0?'M':'L'} ${p.x} ${p.y}`).join(' ');
  const line = document.createElementNS(svgNS, 'path');
  line.setAttribute('d', linePts);
  line.setAttribute('fill', 'none');
  line.setAttribute('stroke', 'oklch(55% 0.22 255)');
  line.setAttribute('stroke-width', '2.5');
  line.setAttribute('stroke-linejoin', 'round');
  line.setAttribute('stroke-linecap', 'round');
  svg.appendChild(line);

  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const isBest = i === bestIdx;
    const vl = document.createElementNS(svgNS, 'text');
    vl.setAttribute('x', p.x); vl.setAttribute('y', p.y - 9);
    vl.setAttribute('text-anchor', 'middle'); vl.setAttribute('font-size', '10');
    vl.setAttribute('font-weight', isBest ? '800' : '600');
    vl.setAttribute('fill', isBest ? 'oklch(44% 0.18 148)' : 'oklch(35% 0.05 255)');
    vl.textContent = p.v;
    svg.appendChild(vl);

    const dot = document.createElementNS(svgNS, 'circle');
    dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y);
    dot.setAttribute('r', isBest ? '5.5' : '4');
    dot.setAttribute('fill', isBest ? 'oklch(52% 0.20 148)' : 'oklch(55% 0.22 255)');
    svg.appendChild(dot);

    const rl = document.createElementNS(svgNS, 'text');
    rl.setAttribute('x', p.x); rl.setAttribute('y', H - 2);
    rl.setAttribute('text-anchor', 'middle'); rl.setAttribute('font-size', '8.5');
    rl.setAttribute('font-weight', '600'); rl.setAttribute('fill', 'oklch(55% 0.05 255)');
    rl.textContent = t(`labelShort.${p.key}`);
    svg.appendChild(rl);
  }

  chart.appendChild(svg);
}

export { resetGame, resetRoundState, resetSeed, getOrCreateSeed };

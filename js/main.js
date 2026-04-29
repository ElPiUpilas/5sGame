import { state, ROUNDS, resetGame } from './state.js?v=3';
import { getOrCreateSeed, resetSeed } from './rng.js?v=3';
import { initScreens, showScreen, renderPreRound, renderPostRound, renderSummary } from './screens.js?v=3';
import { initRound, startRound } from './round.js?v=3';
import { initI18n, setLang } from './i18n.js?v=3';

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

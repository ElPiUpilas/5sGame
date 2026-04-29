function range(a, b) {
  const out = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}

export const ROUND_DURATION_MS = 20000;

// Round definitions: structure only. User-facing strings come from i18n via
// the `key` field (e.g. round.chaos.title, round.chaos.description).
export const ROUNDS = [
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

export const state = {
  screen: 'welcome',
  seed: 0,
  currentRound: 0,
  target: 1,
  highestReached: 0,
  errors: 0,
  results: [],
};

export function resetRoundState() {
  state.target = 1;
  state.highestReached = 0;
  state.errors = 0;
}

export function resetGame() {
  state.currentRound = 0;
  state.results = [];
  resetRoundState();
}

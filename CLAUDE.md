# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running Locally

No build step or dependencies required.

```bash
# Open directly in browser
open index.html

# Or serve over HTTP (useful for mobile testing on LAN)
python3 -m http.server 8000
# visit http://localhost:8000
```

There are no environment variables, no package manager, and no CI pipeline.

## Architecture

This is a **100% static, no-framework web app** — plain HTML + CSS + ES modules. The entry point is `index.html`, which loads `js/main.js` as a module.

### Screen Flow

The app has 5 screens declared as `<section data-screen="…">` elements in `index.html`. Only one screen is visible at a time (toggled via the `is-active` class). The flow is:

```
welcome → preRound → play → postRound → (repeat preRound/play/postRound per round) → summary
```

`screens.js` owns screen visibility and renders dynamic content (pre-round briefing, post-round results, final SVG chart). `main.js` wires all button click events and drives the flow between screens.

### Game State

`state.js` holds the single global `state` object and the `ROUNDS` array. Each round definition in `ROUNDS` is a plain config object with flags like `dirty`, `cleanAnim`, `showGrid3`, `useQuadrants`, and `layout`. Round-specific user-facing strings are **not** in `state.js`; they live in `i18n.js` and are accessed via the round's `key` field (e.g. `round.chaos.title`).

### Round Execution

`round.js` owns the play screen. `startRound(onFinish)` builds the board DOM, starts the timer via `requestAnimationFrame`, and registers a delegated click handler on the board element. The handler uses `document.elementsFromPoint` to resolve overlapping tiles and find the correct target under the cursor. When the timer expires or the player clicks 49, `finishRound` fires the `onFinish` callback with `{ reason, highest, errors }`.

### Layout Engine (`layout.js`)

Board tiles are `<button class="num-tile">` elements positioned absolutely. Three layout strategies exist:

- **`computeFullLayout`** (rounds 1–2): grid-with-jitter — tiles get a shuffled grid cell then random offset within it so the board looks chaotic but never structurally collides.
- **`computeQuadrantLayout`** (rounds 3–4): same packing algorithm but the board is divided into a 3×3 grid of zones; consecutive number groups are placed in consecutive zones.
- **`buildGridBoard`** (round 5): CSS `grid-template-columns: repeat(10, 1fr)` layout — tiles sit in `<div class="cell">` wrappers at fixed positions.

Dirt overlay is an SVG element with `pointer-events: none` appended after the tiles. Tile dimming is done with the `is-dim` / `is-persistent-dim` CSS classes.

### RNG (`rng.js`)

All randomness uses **mulberry32** seeded PRNG. The seed is stored in `sessionStorage` under the key `fiveS.seed` so the layout is reproducible across a session but fresh each visit. `makeRng(seed, ...salts)` creates an independent sub-stream per tile/purpose by hashing the salts into the seed — use this pattern whenever you need a new random stream.

### i18n (`i18n.js`)

Two locales: `es` (default) and `en`. The `STRINGS` object is a flat key→value map; values can be strings or functions that accept arguments for interpolation. Language persists in `localStorage` under `fiveS.lang`. Auto-detected from `navigator.language` on first visit. The DOM is synced via `data-i18n` (textContent) and `data-i18n-html` (innerHTML) attributes called from `applyI18n()`.

### CSS

`base.css` covers global layout, typography, buttons, and the HUD. `rounds.css` covers board-specific styles: tile states (`is-correct`, `is-target`, `is-dim`, `shake`), dirt layer, the 3×3 grid overlay (CSS `::before` pseudo-element), and the 5×10 grid layout. CSS custom properties on `:root` define the tile size (`--tile-size: 56px`, `44px` on mobile) and colors.

### Cache Busting

All ES module imports use a `?v=3` query suffix (e.g. `import ... from './state.js?v=3'`). Bump this version across **all** import statements when making changes that need to invalidate browser caches.

### Legacy Bundle Files

`js/bundle.js`, `js/bundle-v11.js`, and `js/bundle-v12.js` are historical snapshots of the app as single-file bundles. They are not loaded by `index.html` and can be ignored.

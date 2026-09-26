# ozterisk

`ozterisk` is a browser-based, fully client-side multiplication game with two
modes: **Endless**, at a fixed capacity until the tiles run out, and
**Classic**, whose capacity closes one socket at a time down to a floor. A
digit tile is simultaneously an answer input, a consumable spent on every
submission, and an inventory-management choice: correct play returns one net
tile before capacity resolution. The game validates whether that loop is
understandable and engaging; it does not implement competition, accounts, or
online services.

## Product rules

- Equations draw one unordered operand pair `(a, b)`, `1 <= a <= b <= 9`,
  then randomize display order (`3 × 7` and `7 × 3` are the same sampling
  entry). Below a fixed kind-equation rate (`KIND_EQUATION_RATE` in
  `src/game/balance.ts`) the pair is drawn only from those whose product the
  inventory can spell (falling back to the full pool if it can spell none);
  otherwise, uniformly with replacement from all 45.
  Products range `1`–`81`, so an answer has one or two digits.
- A run starts with score `0`, current/longest streak `0`, round `1`, and an
  inventory that fills its capacity, dealt round-robin: capacity `10` and one
  tile of each digit `0`–`9` in Endless; capacity `20` and two of each in
  Classic.
- **Classic capacity**: one socket seals every `2` submissions, correct or
  not, down to a floor of `5` — `max(5, 20 − ⌊submissions / 2⌋)`. Capacity is
  derived from the mode and the submission count, never stored.
- **Face tiles (Classic)**: a reward is sometimes a face tile (`FACE_RATE`,
  8%) standing for a set of digits — Wildcard ✳ (any), Odd `O`, Even `E`
  (with `0`), Low `0–4`, High `5–9`, or Neighbours such as `3–5`. In an answer
  slot a face counts as the digit that slot needs if its set holds it;
  otherwise the answer is wrong. The player never picks the digit. Endless
  has no face tiles.
- Selecting tiles (click, tap, or a digit key) fills the answer slots in
  order; `Backspace` returns the most recently selected tile and `Escape`
  returns them all; **Submit** and `Enter` are enabled only once every slot
  is filled.
- **Correct**: the submitted tiles are removed permanently, score and streak
  increase, and `N + 1` reward tiles (where `N` is the number of tiles
  submitted) are added. Only the tiles that fit the capacity are sorted; the
  newest arrivals past it wait on a rail above the rack.
- **Incorrect**: the submitted tiles are removed permanently with no reward,
  the streak resets to `0`, and the submitted and correct answers are shown.
  There is no exact-answer-constructibility check, so an intentional wrong
  answer is a legal (costly) way to shed tiles.
- **Overflow**: if inventory exceeds the capacity after rewards are added
  (checked against the capacity after this submission's seal, so Classic can
  overflow by two), the player marks tiles to discard, seated or on the rail.
  The mark that reaches the excess completes the discard — there is no
  confirm control — and the round advances on its own once the motion ends.
- **Win (Classic)**: when capacity reaches the floor, the run ends as **Run
  Complete** if the player holds at least one tile; no equation is shown.
- **Loss**: after a round, if the inventory has fewer tiles than the next
  equation's answer-slot count, the run ends in **Game Over**; the terminal
  equation stays visible, with its product, to explain why.
- **Sharing**: **Share** and **Copy Result** exist only on `gameOver`. Both
  always include the normal, unmodified game URL — result state (score,
  streak, rounds) is never encoded into the URL, and a shared result is
  never claimed to be verified.

### Phases and transitions

The game is a single deterministic state machine with five phases:

```text
title --START_RUN--> answering
answering --SELECT_TILE / RETURN_TILE--> answering
answering --SUBMIT_CORRECT (no overflow)--> feedback
answering --SUBMIT_CORRECT (overflow)--> overflow
answering --SUBMIT_INCORRECT--> feedback
overflow --TOGGLE_DISCARD (below the excess)--> overflow
overflow --TOGGLE_DISCARD (reaches the excess)--> feedback
feedback --NEXT_ROUND (Classic at the floor)--> gameOver
feedback --NEXT_ROUND (inventory can attempt next equation)--> answering
feedback --NEXT_ROUND (inventory cannot attempt next equation)--> gameOver
gameOver --RESTART_RUN--> answering
```

### Keyboard contract

| Phase | Key | Effect |
|---|---|---|
| `answering` | `0`–`9` | Select first available matching tile if a slot is empty |
| `answering` | `Backspace` | Return most recently selected answer tile |
| `answering` | `Escape` | Return every selected tile |
| `answering` | `Enter` | Submit only if all answer slots are filled |
| `overflow` | `0`–`9` | Mark the first matching unmarked tile; the mark that reaches the excess completes the discard |
| `feedback` | `Enter` | Draw and advance to the next equation; inert after a discard, which advances on its own |
| `gameOver` | `R` | Start a fresh run in the same mode, equivalent to **Play Again** |
| `gameOver` | `Enter` | No global shortcut; a focused button retains normal browser behavior |
| `title` | `Enter` | No global shortcut; the focused **Start Run** button retains normal browser behavior |

In every phase a focused button keeps `Enter` for itself and the shortcut
stands aside. Mouse, touch, and keyboard all drive the same actions.
Language changes are available in every phase and never reset game state.

## Local commands

```bash
npm ci               # install exact dependency versions
npm run dev          # start the Vite dev server
npm run lint         # eslint, zero warnings allowed
npm run typecheck    # tsc -b, no emit
npm test             # vitest run (single pass)
npm run test:watch   # vitest in watch mode
npm run build        # tsc -b && vite build -> dist/
```

## Architecture

Vite + React + TypeScript, single-page, no backend. React `useReducer`
drives one deterministic reducer (`src/game/gameReducer.ts`) over the five
phases above; it is the only state container in the app (no Zustand, Redux,
or other state library).

- **Pure domain layer** (`src/game/`): `types.ts` (domain types and the
  `GameAction` union), `constants.ts`, `balance.ts` (the tuning dials,
  including Classic's start, floor and step), `factories.ts` (initial state and
  inventory), `generators.ts` (equation and reward generation), `selectors.ts`
  (derived queries such as `getCapacity`, `getAnswerLength`, `isSubmissionReady`,
  `getOverflowCount`), and `gameReducer.ts`. The reducer never calls
  `Math.random()`, `crypto.randomUUID()`, or any browser/storage API — all
  randomness and tile IDs are generated at the boundary (`src/app/App.tsx`)
  via injected `RandomSource` and `TileIdFactory` functions and passed into
  the dispatched action. This keeps every game rule deterministic and
  testable without mocking globals.
- **React layer** (`src/app/`, `src/components/`, `src/hooks/`): `App.tsx`
  owns the reducer instance and wires dependencies; presentational
  components (`TitleScreen`, `GameScreen`, `EquationBoard`, `TileInventory`,
  `AnswerSlots`, `FeedbackPanel`, `OverflowControls`, `GameHud`,
  `GameOverScreen`, `LanguageToggle`) render one phase's UI and dispatch
  actions. `useGameKeyboard` (mounted inside `GameScreen`) translates the
  keyboard contract above into the same actions the on-screen controls
  dispatch, using the same readiness selectors so it can never dispatch an
  action the reducer would reject.
- **i18n layer** (`src/i18n/`): a typed in-code dictionary (`messages.ts`)
  for English and Korean, a context/provider (`I18nContext.tsx`), and
  storage helpers (`storage.ts`) for the persisted language preference.
- **Sharing layer** (`src/services/sharing.ts`): pure text formatting plus
  thin wrappers around `navigator.share` and `navigator.clipboard`, injected
  as dependencies rather than called directly so they stay testable.
- Styling uses CSS Modules per component plus one global stylesheet
  (`src/styles/global.css`); no Tailwind, component library, or animation
  library. Motion is limited to CSS transitions for functional state changes
  plus the named keyframe inventory in `docs/spec/ui-i18n.md` §1.12;
  `prefers-reduced-motion` removes nonessential transitions.

## Test strategy

Vitest + React Testing Library + `@testing-library/user-event` for all
behavior; a browser suite covers only layout properties jsdom cannot
observe, and asserts no behavior. Tests are deterministic: `game/`
fixtures (`sequenceRandom`, `sequentialIds`) inject fixed random sequences
and tile IDs instead of mocking `Math.random()` globally.

- `src/game/*.test.ts` — factories, generators, selectors, and every
  reducer transition (selection, submission, overflow, next round, loss,
  restart) in isolation.
- `src/i18n/storage.test.ts` — language detection, persistence, and
  fallback when `localStorage` is unavailable.
- `src/services/sharing.test.ts` — share/copy outcomes across native-share
  available, unavailable, rejected, and clipboard-failure cases.
- `src/components/**/*.test.tsx` — interactive behavior of `TitleScreen`,
  `TileInventory`, `AnswerSlots`, `GameScreen`, `GameOverScreen`, and
  `LanguageToggle`.
- `src/app/App.test.tsx` — integration coverage of a full run through the
  reducer and rendered UI together, including the `gameOver` Enter shortcut.

## Deployment

The app is a static Vite build with no serverless function or backend
service. `vercel.json` pins the Vercel project to `framework: vite`,
`buildCommand: npm run build`, and `outputDirectory: dist`.

Two long-lived branches carry it. Work merges to **`main`**, which Vercel
builds as a preview; a release is a merge commit from `main` to **`prod`**,
which Vercel builds as production. `prod` is a pointer to the live commit.
GitHub Actions (`.github/workflows/ci.yml`) runs lint, typecheck, test, the
viewport sweep, and build on every pull request and on every push to either
branch. Rulesets enforce the merge methods and the gate: a pull request into
`main` can only squash, and one into `prod` can only merge with a merge
commit and requires the `build` check to pass.

## Fonts

Four typefaces are self-hosted through `@fontsource` and served from the
app's own origin: EB Garamond as the display and numeral face, Zen Kaku
Gothic New for UI text, IBM Plex Mono for the monospace role, and Noto
Sans KR for Hangul. Nothing is fetched from a font CDN, which is what
keeps the zero-non-origin-request property true. Only Latin subsets ship
eagerly; the Korean face loads on demand when the language is `ko`, so an
English session never downloads it.

All four are under the SIL Open Font License, Version 1.1. Its section 2
requires each redistributed copy to carry the copyright notice and the
licence, so both ship with the build at `/OFL.txt` (`public/OFL.txt` in
the source tree) alongside the font files they cover.

## Supported languages

English (`en`) and Korean (`ko`) through the typed dictionary in
`src/i18n/messages.ts` — no i18n dependency is used. On first visit the
language is Korean if `navigator.language` or the first `navigator.languages`
entry starts with `ko`, otherwise English. A manual selection persists to
`localStorage["one-zero.language"]` and overrides browser detection on
later visits; an invalid stored value is ignored. Language changes apply
immediately in every phase without resetting the run. Only the language
preference survives a refresh — a refresh always returns to `title`.

## Browser API fallbacks

- **`localStorage`** (`src/i18n/storage.ts`): reads and writes are wrapped
  in `try`/`catch`. If storage is unavailable (private browsing, disabled
  storage, etc.), the app falls back to browser-language detection and the
  selection still applies in memory for the session.
- **`navigator.share`** (`src/services/sharing.ts`): if unavailable,
  **Share** performs the same behavior as **Copy Result**. If native
  sharing is rejected or fails, the app stays on `gameOver` and shows an
  inline failure status; it does not automatically fall back to clipboard
  copy, since a native-share cancellation may be intentional.
- **`navigator.clipboard`**: a write failure shows the same inline failure
  status rather than a modal.

## Explicitly out of scope

Per the product specification, this PoC does not include: wildcard or
special tiles; operand `0`; division, addition, or subtraction modes;
difficulty curves, meaning any weighting that adapts to the player or
escalates over a run (Classic's capacity descent and the fixed kind-equation
rate are the two exceptions); timers; multiple attempts per
equation; skip buttons or a separate manual-discard action during
answering; exact-answer-constructibility loss detection; saved best score
or history; seeded or replayable runs; result pages or result parameters;
leaderboards, authentication, backend APIs, databases, or server authority;
audio and haptics; end-to-end tests of game behavior; analytics and
telemetry; and offline/PWA behavior.

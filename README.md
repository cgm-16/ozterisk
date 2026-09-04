# ozterisk

`ozterisk` is a browser-based, fully client-side endless multiplication game. A
digit tile is simultaneously an answer input, a consumable spent on every
submission, and an inventory-management choice: correct play returns one net
tile before capacity resolution. The game validates whether that loop is
understandable and engaging; it does not implement competition, accounts, or
online services.

## Product rules

- Equations draw one unordered operand pair `(a, b)`, `1 <= a <= b <= 9`,
  uniformly with replacement, then randomize display order (`3 × 7` and
  `7 × 3` are the same sampling entry). Products range `1`–`81`, so an
  answer has one or two digits.
- A run starts with inventory capacity `10`, one tile of each digit
  `0`–`9`, score `0`, current/longest streak `0`, and round `1`.
- Selecting tiles (click, tap, or a digit key) fills the answer slots in
  order; `Backspace` returns the most recently selected tile; **Submit** and
  `Enter` are enabled only once every slot is filled.
- **Correct**: the submitted tiles are removed permanently, score and streak
  increase, and `N + 1` reward tiles (where `N` is the number of tiles
  submitted) are drawn and inserted into the sorted inventory.
- **Incorrect**: the submitted tiles are removed permanently with no reward,
  the streak resets to `0`, and the submitted and correct answers are shown.
  There is no exact-answer-constructibility check, so an intentional wrong
  answer is a legal (costly) way to shed tiles.
- **Overflow**: if inventory exceeds `10` tiles after rewards are inserted,
  the player must mark exactly the excess count for discard before the next
  equation can be drawn.
- **Loss**: after a round, if the inventory has fewer tiles than the next
  equation's answer-slot count, the run ends in **Game Over**; the terminal
  equation stays visible to explain why.
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
overflow --TOGGLE_DISCARD--> overflow
overflow --CONFIRM_DISCARD--> feedback
feedback --NEXT_ROUND (inventory can attempt next equation)--> answering
feedback --NEXT_ROUND (inventory cannot attempt next equation)--> gameOver
gameOver --RESTART_RUN--> answering
```

### Keyboard contract

| Phase | Key | Effect |
|---|---|---|
| `answering` | `0`–`9` | Select first available matching tile if a slot is empty |
| `answering` | `Backspace` | Return most recently selected answer tile |
| `answering` | `Enter` | Submit only if all answer slots are filled |
| `overflow` | `Enter` | Confirm only if exactly the excess number is selected |
| `feedback` | `Enter` | Draw and advance to the next equation |
| `gameOver` | `Enter` | Start a fresh run, equivalent to **Play Again** |
| `title` | `Enter` | No global shortcut; the focused **Start Run** button retains normal browser behavior |

Mouse, touch, and keyboard all drive the same actions. Language changes are
available in every phase and never reset game state.

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
  `GameAction` union), `constants.ts`, `factories.ts` (initial state and
  inventory), `generators.ts` (equation and reward generation), `selectors.ts`
  (derived queries such as `getAnswerLength`, `isSubmissionReady`,
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

Vitest + React Testing Library + `@testing-library/user-event`; no
Playwright or other end-to-end suite. Tests are deterministic: `game/`
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
`buildCommand: npm run build`, and `outputDirectory: dist`. GitHub Actions
(`.github/workflows/ci.yml`) runs lint, typecheck, test, and build on every
pull request and on push to `main`; only the exact commit that passed CI is
promoted to production.

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
difficulty curves or weighted equations; timers; multiple attempts per
equation; skip buttons or a separate manual-discard action during
answering; exact-answer-constructibility loss detection; saved best score
or history; seeded or replayable runs; result pages or result parameters;
leaderboards, authentication, backend APIs, databases, or server authority;
audio and haptics; Playwright or other end-to-end tests; analytics and
telemetry; and offline/PWA behavior.

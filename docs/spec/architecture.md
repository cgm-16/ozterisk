# 1-0 Technical Contract

File map, domain types, pure and browser-bound interfaces, the tuning surface,
reducer invariants, and test fixture conventions (§2).

### 2.1 Canonical file map

```text
.
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   └── implementation-task.yml
│   ├── workflows/
│   │   └── ci.yml
│   └── pull_request_template.md
├── docs/                     # planning and spec documents — see AGENTS.md routing map
├── public/
│   └── favicon.svg
├── src/
│   ├── app/
│   │   ├── App.module.css
│   │   ├── App.test.tsx
│   │   └── App.tsx
│   ├── components/
│   │   ├── AnswerSlots/
│   │   │   ├── AnswerSlots.module.css
│   │   │   ├── AnswerSlots.test.tsx
│   │   │   └── AnswerSlots.tsx
│   │   ├── EquationBoard/
│   │   │   ├── EquationBoard.module.css
│   │   │   └── EquationBoard.tsx
│   │   ├── FeedbackPanel/
│   │   │   ├── FeedbackPanel.module.css
│   │   │   └── FeedbackPanel.tsx
│   │   ├── GameHud/
│   │   │   ├── GameHud.module.css
│   │   │   └── GameHud.tsx
│   │   ├── GameOverScreen/
│   │   │   ├── GameOverScreen.module.css
│   │   │   ├── GameOverScreen.test.tsx
│   │   │   └── GameOverScreen.tsx
│   │   ├── GameScreen/
│   │   │   ├── GameScreen.module.css
│   │   │   ├── GameScreen.test.tsx
│   │   │   └── GameScreen.tsx
│   │   ├── LanguageToggle/
│   │   │   ├── LanguageToggle.module.css
│   │   │   └── LanguageToggle.tsx
│   │   ├── OverflowControls/
│   │   │   ├── OverflowControls.module.css
│   │   │   └── OverflowControls.tsx
│   │   ├── TileInventory/
│   │   │   ├── TileInventory.module.css
│   │   │   ├── TileInventory.test.tsx
│   │   │   └── TileInventory.tsx
│   │   └── TitleScreen/
│   │       ├── TitleScreen.module.css
│   │       ├── TitleScreen.test.tsx
│   │       └── TitleScreen.tsx
│   ├── game/
│   │   ├── balance.test.ts
│   │   ├── balance.ts
│   │   ├── constants.ts
│   │   ├── factories.test.ts
│   │   ├── factories.ts
│   │   ├── gameReducer.test.ts
│   │   ├── gameReducer.ts
│   │   ├── generators.test.ts
│   │   ├── generators.ts
│   │   ├── selectors.test.ts
│   │   ├── selectors.ts
│   │   └── types.ts
│   ├── hooks/
│   │   └── useGameKeyboard.ts
│   ├── i18n/
│   │   ├── I18nContext.tsx
│   │   ├── messages.ts
│   │   ├── storage.test.ts
│   │   ├── storage.ts
│   │   └── types.ts
│   ├── services/
│   │   ├── sharing.test.ts
│   │   └── sharing.ts
│   ├── styles/
│   │   └── global.css
│   ├── test/
│   │   ├── economy.ts
│   │   ├── fixtures.ts
│   │   └── setup.ts
│   ├── main.tsx
│   └── vite-env.d.ts
├── AGENTS.md
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── README.md
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vercel.json
└── vite.config.ts
```

### 2.2 Domain types

```ts
export type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Language = "en" | "ko";
export type GamePhase =
  | "title"
  | "answering"
  | "feedback"
  | "overflow"
  | "gameOver";

export interface Tile {
  id: string;
  digit: Digit;
  isNew: boolean;
}

export interface Equation {
  left: number;
  right: number;
  product: number;
}

export interface RoundResult {
  kind: "correct" | "incorrect";
  submittedValue: number;
  correctValue: number;
  submittedTiles: Tile[];
  rewardTileIds: string[];
}

export interface GameState {
  phase: GamePhase;
  equation: Equation | null;
  inventory: Tile[];
  selectedTiles: Tile[];
  pendingDiscards: string[];
  score: number;
  round: number;
  totalRounds: number;
  currentStreak: number;
  longestStreak: number;
  lastResult: RoundResult | null;
}

export type GameAction =
  | { type: "START_RUN"; equation: Equation; inventory: Tile[] }
  | { type: "SELECT_TILE"; tileId: string }
  | { type: "RETURN_TILE"; tileId: string }
  | { type: "CLEAR_SELECTION" }
  | { type: "SUBMIT_CORRECT"; rewardTiles: Tile[] }
  | { type: "SUBMIT_INCORRECT" }
  | { type: "TOGGLE_DISCARD"; tileId: string }
  | { type: "CONFIRM_DISCARD" }
  | { type: "NEXT_ROUND"; equation: Equation }
  | { type: "RESTART_RUN"; equation: Equation; inventory: Tile[] };

export type RandomSource = () => number; // Contract: 0 <= value < 1
export type TileIdFactory = () => string;
```

### 2.3 Pure interfaces

```ts
// game/balance.ts — hand-tuned dials (see § Tuning surface)
export const INVENTORY_CAPACITY = 10;
export const REWARD_BONUS = 1;
export const KIND_EQUATION_RATE = 0.2;

// game/constants.ts — domain definitions
export const OPERAND_MIN = 1;
export const OPERAND_MAX = 9;
export const REWARD_DIGIT_COUNT = 10;

export function createTitleState(): GameState;
export function createInitialInventory(idFactory: TileIdFactory): Tile[];
export function sortTiles(tiles: readonly Tile[]): Tile[];

export function generateEquation(random: RandomSource): Equation;
export function generateKindEquation(
  random: RandomSource,
  inventory: readonly Tile[],
): Equation;
export function generateRewardTiles(
  count: number,
  random: RandomSource,
  idFactory: TileIdFactory,
): Tile[];

export function getAnswerLength(equation: Equation): 1 | 2;
export function constructAnswer(selectedTiles: readonly Tile[]): number | null;
export function canAttemptEquation(
  inventory: readonly Tile[],
  equation: Equation,
): boolean;
export function getOverflowCount(inventory: readonly Tile[]): number;
export function getRewardCount(spentCount: number): number;
export function canConstruct(inventory: readonly Tile[], product: number): boolean;
export function isSubmissionReady(state: GameState): boolean;
export function isDiscardReady(state: GameState): boolean;

export function gameReducer(state: GameState, action: GameAction): GameState;
```

### Tuning surface

The values that decide how the game *feels* live in one data-only module,
`src/game/balance.ts`, so hand-tuning never means hunting through logic.

| Concern | File | Change means |
|---|---|---|
| Feel | `game/balance.ts` | Retuning a shipped game. Safe to edit by hand, within the range each dial documents. |
| Domain | `game/constants.ts` | Changing what the game *is* — operand range, digit spread. Not a tuning knob. |
| Motion and metrics | `styles/global.css` tokens | Retuning press feel and hairlines in one place; no module hardcodes them. |

Rules that keep the surface durable:

- **One binding per dial.** A dial is imported by the module that uses it, never
  threaded through a call site as a parameter. Injection is reserved for
  impurity (`RandomSource`, `TileIdFactory`), not for constants — a dial passed
  as an argument is a dial that can be silently overridden.
- **Every dial documents its economy effect**, its safe range, and what breaks
  outside that range.
- **`game/balance.test.ts` is an executable invariant**, not a unit test. It
  asserts that the shipped combination of dials still ends runs, and that a
  `CLIFF_MARGIN` gap below the buildable-rate cliff remains. It models the
  economy through `test/economy.ts`, which ships nothing.
- **Agents may add dials; agents may not change a dial's value** without
  explicit instruction (AGENTS.md §4.5). Tuning commits use `tune(balance):`
  and carry nothing else, so tuning and feature work never collide in git.

### 2.4 Browser-bound interfaces

```ts
export interface ShareStats {
  score: number;
  totalRounds: number;
  longestStreak: number;
}

export function formatShareText(
  stats: ShareStats,
  language: Language,
  url: string,
): string;

export interface ShareDependencies {
  nativeShare?: (data: ShareData) => Promise<void>;
  writeClipboard: (text: string) => Promise<void>;
}

export type ShareOutcome = "shared" | "copied" | "failed";

export function shareResult(
  text: string,
  url: string,
  dependencies: ShareDependencies,
): Promise<ShareOutcome>;

export function copyResult(
  text: string,
  dependencies: Pick<ShareDependencies, "writeClipboard">,
): Promise<ShareOutcome>;
```

### 2.5 Reducer invariants

The reducer returns the unchanged `state` object for invalid known actions. Unknown action types are prevented by the `never` exhaustiveness check.

- `equation === null` only in `title`.
- Live tile IDs are unique across `inventory` and `selectedTiles`.
- A live tile ID cannot be in both `inventory` and `selectedTiles`.
- `lastResult.submittedTiles` is a historical snapshot of consumed tiles and `lastResult.rewardTileIds` intentionally references live reward tiles; neither collection represents additional ownership.
- `selectedTiles.length <= getAnswerLength(equation)`.
- `pendingDiscards` contains unique IDs that exist in inventory.
- `pendingDiscards` is non-empty only in `overflow`.
- `inventory.length <= 10` when phase is `answering`, `feedback`, or `gameOver`.
- `inventory.length > 10` when phase is `overflow`.
- `lastResult === null` in `title` and `answering`.
- `lastResult !== null` in `feedback` and `overflow`.
- `score <= totalRounds`.
- `currentStreak <= longestStreak <= score`.
- In `answering` and `gameOver`, `round === totalRounds + 1`.
- In `feedback` and `overflow`, the displayed equation has just been submitted, so `round === totalRounds`.

### 2.6 Test fixture conventions

Use deterministic fixtures; never mock `Math.random()` globally.

```ts
export const sequenceRandom = (...values: number[]): RandomSource => {
  let index = 0;
  return () => {
    const value = values[index];
    if (value === undefined) throw new Error("Random sequence exhausted");
    index += 1;
    return value;
  };
};

export const sequentialIds = (prefix = "tile"): TileIdFactory => {
  let index = 0;
  return () => `${prefix}-${index++}`;
};

export const makeEquation = (left: number, right: number): Equation => ({
  left,
  right,
  product: left * right,
});

export const makeTile = (
  digit: Digit,
  id = `tile-${digit}`,
  isNew = false,
): Tile => ({ id, digit, isNew });

export const makeAnsweringState = (
  equation: Equation,
  overrides: Partial<GameState> = {},
): GameState => ({
  ...createTitleState(),
  phase: "answering",
  equation,
  inventory: createInitialInventory(sequentialIds()),
  round: 1,
  ...overrides,
});

// A §2.5-legal feedback-phase state: lastResult is non-null and round === totalRounds.
export const makeFeedbackState = (
  equation: Equation,
  overrides: Partial<GameState> = {},
): GameState => ({
  ...makeAnsweringState(equation, { round: 1, totalRounds: 1 }),
  phase: "feedback",
  lastResult: {
    kind: "incorrect",
    submittedValue: 1,
    correctValue: equation.product,
    submittedTiles: [],
    rewardTileIds: [],
  },
  ...overrides,
});

// A §2.5-legal overflow-phase state: inventory exceeds capacity (excess 1 by
// default), lastResult is non-null, and round === totalRounds.
export const makeOverflowState = (
  equation: Equation,
  overrides: Partial<GameState> = {},
): GameState => ({
  ...makeFeedbackState(equation, {
    inventory: Array.from({ length: 11 }, (_, index) =>
      makeTile((index % 9) as Digit, `tile-${index}`),
    ),
  }),
  phase: "overflow",
  ...overrides,
});
```

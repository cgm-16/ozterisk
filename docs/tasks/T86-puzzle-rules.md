---
reads:
  - docs/superpowers/specs/2026-10-19-puzzle-prototype-design.md  # §3 rules, §4 state and reducer
  - docs/spec/architecture.md  # §2.5 reducer invariants
  - src/game/types.ts
  - src/game/gameReducer.ts
  - src/game/selectors.ts
  - src/game/factories.ts
  - src/game/gameReducer.test.ts
  - src/test/fixtures.ts
---

# T86 — Puzzle rules in the reducer

```yaml
task_id: T86
title: Puzzle rules in the reducer
milestone: M8 — Puzzle Prototype
priority: P1
estimate: M
wave: W1
depends_on: [T85]
parallel_safe: false
paths:
  - src/game/types.ts
  - src/game/gameReducer.ts
  - src/game/gameReducer.test.ts
  - src/game/selectors.ts
  - src/game/selectors.test.ts
  - src/game/factories.ts
  - src/game/factories.test.ts
  - src/test/fixtures.ts
```

## Why

Puzzle is a third mode of the same reducer (spec §4, approach 1). The reducer
must hold the table, accept only the row's printed pay, run at five sockets,
and end after the last row, while Endless and Classic behave exactly as before.

## Interfaces

**Consumes (T85):** `PuzzleRow`, `PuzzleTable`, `PUZZLE_CAPACITY`, `PUZZLE_SAMPLE`.

**Produces:**

```ts
// src/game/types.ts
export type GameMode = "endless" | "classic" | "puzzle";
// GameState gains:
  /** Set only in Puzzle: the dealt table, for checking pays and ending the run. */
  table?: PuzzleTable;
  /** Set only in Puzzle: one entry per submitted row, in order, for the ledger's marks. */
  rowResults?: RoundResult["kind"][];
// GameAction changes:
  | { type: "START_RUN"; mode: GameMode; equation: Equation; inventory: Tile[]; table?: PuzzleTable }
  | { type: "RESTART_RUN"; equation: Equation; inventory: Tile[]; table?: PuzzleTable } // keeps state.mode

// src/game/selectors.ts
export function isRunComplete(state: Pick<GameState, "mode" | "totalRounds" | "table">): boolean;
export function isParMade(state: Pick<GameState, "phase" | "mode" | "score" | "table">): boolean;
// getCapacity("puzzle", n) === PUZZLE_CAPACITY for every n

// src/game/factories.ts
export function createTiles(digits: readonly Digit[], idFactory: TileIdFactory): Tile[]; // isNew false, given order

// src/test/fixtures.ts
export interface PuzzleMove { spend: Digit[]; discard?: Digit } // spend in slot order
export const PUZZLE_SAMPLE_PAR_LINE: PuzzleMove[];
```

## Steps

- [ ] **Fixture.** Add to `src/test/fixtures.ts`, transcribed from the draft's §5
      table and `sims/sample.log`:

```ts
/** One row's play: the tiles spent, in slot order, and the overflow discard. */
export interface PuzzleMove {
  spend: Digit[];
  discard?: Digit;
}

// The sample's canonical par line. Row 1 is the sacrifice: 57 for 15.
export const PUZZLE_SAMPLE_PAR_LINE: PuzzleMove[] = [
  { spend: [5, 7] },
  { spend: [1, 4] },
  { spend: [9] },
  { spend: [7], discard: 6 },
  { spend: [4], discard: 8 },
  { spend: [2, 4], discard: 0 },
  { spend: [6], discard: 7 },
  { spend: [1, 2], discard: 0 },
];
```

- [ ] **Write the failing tests.** In `src/game/gameReducer.test.ts`, a new
      `describe("Puzzle", …)` block. Existing blocks are not edited.

```ts
const puzzleStart = (table = PUZZLE_SAMPLE, ids = sequentialIds()): GameState =>
  gameReducer(createTitleState(), {
    type: "START_RUN",
    mode: "puzzle",
    equation: table.rows[0]!.equation,
    inventory: sortTiles(createTiles(table.hand, ids)),
    table,
  });

const tileWith = (state: GameState, digit: Digit): Tile =>
  state.inventory.find((tile) => "digit" in tile && tile.digit === digit)!;

// Plays rows through the reducer exactly as App does: select, submit with the
// row's pay, discard if asked, advance to the next row's equation.
function play(state: GameState, line: PuzzleMove[], ids: TileIdFactory): GameState {
  const table = state.table!;
  for (const [index, move] of line.entries()) {
    for (const digit of move.spend) {
      state = gameReducer(state, { type: "SELECT_TILE", tileId: tileWith(state, digit).id });
    }
    const row = table.rows[index]!;
    state = answerMatches(state.selectedTiles, row.equation.product)
      ? gameReducer(state, { type: "SUBMIT_CORRECT", rewardTiles: createTiles(row.pay, ids) })
      : gameReducer(state, { type: "SUBMIT_INCORRECT" });
    if (move.discard !== undefined) {
      state = gameReducer(state, { type: "TOGGLE_DISCARD", tileId: tileWith(state, move.discard).id });
    }
    const next = table.rows[index + 1]?.equation ?? row.equation;
    state = gameReducer(state, { type: "NEXT_ROUND", equation: next });
  }
  return state;
}

const digitsOf = (tiles: readonly Tile[]) => tiles.map((tile) => ("digit" in tile ? tile.digit : -1));

describe("Puzzle", () => {
  it("starts with the table, its hand and row 1", () => {
    const state = puzzleStart();
    expect(state.phase).toBe("answering");
    expect(state.mode).toBe("puzzle");
    expect(state.table).toBe(PUZZLE_SAMPLE);
    expect(digitsOf(state.inventory)).toEqual([1, 4, 5, 7, 9]);
    expect(state.rowResults).toEqual([]);
  });

  it("records each row's result in order, and only in Puzzle", () => {
    const ids = sequentialIds();
    const state = play(puzzleStart(PUZZLE_SAMPLE, ids), PUZZLE_SAMPLE_PAR_LINE.slice(0, 3), ids);
    expect(state.rowResults).toEqual(["incorrect", "correct", "correct"]);
    const endless = gameReducer(createTitleState(), {
      type: "START_RUN",
      mode: "endless",
      equation: makeEquation(2, 3),
      inventory: createInitialInventory(sequentialIds()),
    });
    expect(endless).not.toHaveProperty("rowResults");
    expect(endless).not.toHaveProperty("table");
  });

  it("refuses a Puzzle start without a table", () => {
    const title = createTitleState();
    const next = gameReducer(title, {
      type: "START_RUN",
      mode: "puzzle",
      equation: PUZZLE_SAMPLE.rows[0]!.equation,
      inventory: createTiles(PUZZLE_SAMPLE.hand, sequentialIds()),
    });
    expect(next).toBe(title);
  });

  it("accepts the row's pay and refuses other digits, another order or a face", () => {
    const ids = sequentialIds();
    let state = puzzleStart(PUZZLE_SAMPLE, ids);
    // Row 1 is 3 × 5: answer 15 and offer row 1's pay, 9 5 5.
    state = gameReducer(state, { type: "SELECT_TILE", tileId: tileWith(state, 1).id });
    state = gameReducer(state, { type: "SELECT_TILE", tileId: tileWith(state, 5).id });
    for (const wrong of [
      createTiles([9, 5, 6], ids),
      createTiles([5, 9, 5], ids),
      [...createTiles([9, 5], ids), makeFaceTile("wild", "face-pay")],
    ]) {
      expect(gameReducer(state, { type: "SUBMIT_CORRECT", rewardTiles: wrong })).toBe(state);
    }
    const paid = gameReducer(state, { type: "SUBMIT_CORRECT", rewardTiles: createTiles([9, 5, 5], ids) });
    expect(paid.score).toBe(1);
  });

  it("overflows at five tiles", () => {
    const ids = sequentialIds();
    const state = play(puzzleStart(PUZZLE_SAMPLE, ids), PUZZLE_SAMPLE_PAR_LINE.slice(0, 3), ids);
    // Hand 1 2 6 7 8; row 4 (1 × 7) spends 7 and pays 4 4: six tiles in five sockets.
    let next = gameReducer(state, { type: "SELECT_TILE", tileId: tileWith(state, 7).id });
    next = gameReducer(next, { type: "SUBMIT_CORRECT", rewardTiles: createTiles([4, 4], ids) });
    expect(next.phase).toBe("overflow");
    expect(getOverflowCount(next)).toBe(1);
  });

  it("replays the sample's par line to 7 and ends after row 8", () => {
    const ids = sequentialIds();
    const end = play(puzzleStart(PUZZLE_SAMPLE, ids), PUZZLE_SAMPLE_PAR_LINE, ids);
    expect(end.phase).toBe("gameOver");
    expect(end.score).toBe(7);
    expect(end.totalRounds).toBe(8);
    expect(digitsOf(end.inventory)).toEqual([2, 2, 7, 8, 8]);
    expect(isParMade(end)).toBe(true);
  });

  it("restarts with the new table, refusing a restart without one", () => {
    const ids = sequentialIds();
    const end = play(puzzleStart(PUZZLE_SAMPLE, ids), PUZZLE_SAMPLE_PAR_LINE, ids);
    const other: PuzzleTable = { ...PUZZLE_SAMPLE, hand: [0, 2, 3, 6, 8], par: 5 };
    const restart = { type: "RESTART_RUN", equation: other.rows[0]!.equation, inventory: createTiles(other.hand, ids) } as const;
    expect(gameReducer(end, restart)).toBe(end);
    const next = gameReducer(end, { ...restart, table: other });
    expect(next.table).toBe(other);
    expect(next.mode).toBe("puzzle");
    expect(next.score).toBe(0);
  });
});
```

      In `src/game/selectors.test.ts`:

```ts
describe("Puzzle selectors", () => {
  it("holds five sockets at every submission", () => {
    for (const totalRounds of [0, 1, 7, 8]) expect(getCapacity("puzzle", totalRounds)).toBe(PUZZLE_CAPACITY);
  });

  it("completes a Puzzle run once every row is submitted, and Classic at its floor", () => {
    const table = PUZZLE_SAMPLE;
    expect(isRunComplete({ mode: "puzzle", totalRounds: 7, table })).toBe(false);
    expect(isRunComplete({ mode: "puzzle", totalRounds: 8, table })).toBe(true);
    const floor = (CLASSIC_START_CAPACITY - CLASSIC_FLOOR) * CLASSIC_SEAL_EVERY;
    expect(isRunComplete({ mode: "classic", totalRounds: floor })).toBe(true);
    expect(isRunComplete({ mode: "endless", totalRounds: 999 })).toBe(false);
  });

  it("makes par only at game over with score equal to par", () => {
    const table = PUZZLE_SAMPLE;
    expect(isParMade({ phase: "gameOver", mode: "puzzle", score: 7, table })).toBe(true);
    expect(isParMade({ phase: "gameOver", mode: "puzzle", score: 6, table })).toBe(false);
    expect(isParMade({ phase: "feedback", mode: "puzzle", score: 7, table })).toBe(false);
    expect(isParMade({ phase: "gameOver", mode: "classic", score: 7 })).toBe(false);
  });
});
```

      In `src/game/factories.test.ts`:

```ts
it("builds tiles from digits in the given order", () => {
  expect(createTiles([5, 9, 1], sequentialIds())).toEqual([
    { id: "tile-0", digit: 5, isNew: false },
    { id: "tile-1", digit: 9, isNew: false },
    { id: "tile-2", digit: 1, isNew: false },
  ]);
});
```

- [ ] **Run them and record the failure.**
      Run: `npx vitest run src/game`
      Expected: FAIL. `createTiles`, `isRunComplete` and `isParMade` are not
      exported, and `"puzzle"` is not assignable to `GameMode`.
- [ ] **Types.** `GameMode` gains `"puzzle"`; `GameState` gains `table?`; the two
      actions gain `table?`, as in Interfaces.
- [ ] **Factories.** `createTiles(digits, idFactory)` returns
      `digits.map((digit) => ({ id: idFactory(), digit, isNew: false }))`;
      `createInitialInventory` builds its digits as today, then returns
      `sortTiles(createTiles(digits, idFactory))`.
- [ ] **Selectors.**
  - `getCapacity`: `if (mode === "puzzle") return PUZZLE_CAPACITY;` before the
    Endless line. Comment: every other mode would fall through to Classic's
    descent.
  - `isRunComplete`: `state.mode === "puzzle" ? state.table !== undefined &&
    state.totalRounds >= state.table.rows.length : isAtClassicFloor(state)`.
  - `isParMade`: `state.phase === "gameOver" && state.mode === "puzzle" &&
    state.table !== undefined && state.score === state.table.par`.
- [ ] **Reducer.**
  - `freshRunState(mode, equation, inventory, table?)` spreads
    `...(table && { table, rowResults: [] })`, so other modes carry neither key.
  - `SUBMIT_CORRECT` and `SUBMIT_INCORRECT`: when `state.rowResults` is set,
    the next state's `rowResults` is `[...state.rowResults, kind]`.
  - `START_RUN`: `if (action.mode === "puzzle" && !action.table) return state;`
  - `RESTART_RUN`: after the phase guard,
    `if (state.mode === "puzzle" && !action.table) return state;` and pass
    `action.table`.
  - `SUBMIT_CORRECT`: after the existing face check, in Puzzle only, refuse
    unless every reward tile is a digit equal to
    `state.table.rows[state.round - 1].pay` at its index.
  - `NEXT_ROUND`: `isAtClassicFloor(state)` becomes `isRunComplete(state)`, and
    its comment names both endings.
- [ ] **Run the tests.** Run: `npx vitest run src/game`. Expected: PASS, with
      every pre-existing test unchanged.
- [ ] **See the guard fail.** Change the fixture's row 6 pay from `[0, 7, 7]` to
      `[0, 7, 6]`, run `npx vitest run src/game/gameReducer.test.ts`, confirm the
      replay test fails, and revert.
- [ ] **Gates.** `npm run lint && npm run typecheck && npm test && npm run build`.
- [ ] **Commit.**

```bash
git add src/game src/test/fixtures.ts
git commit -m "feat(puzzle): a third mode in the reducer, paid by its table" -m "Task: T86" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Acceptance gate

- `npm test` green, with no edit to an existing test's expectation.
- The sample's par line replays to score 7 on the real reducer, and the
  corrupted pay makes that test fail.

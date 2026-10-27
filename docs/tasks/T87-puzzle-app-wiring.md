---
reads:
  - docs/superpowers/specs/2026-10-19-puzzle-prototype-design.md  # §4.5 App, §6 the playtest set, §7 title
  - docs/journal/journal-2026-10-19.md  # the playtest-set exception (#198)
  - src/app/App.tsx
  - src/app/App.test.tsx
  - src/main.tsx
  - src/components/TitleScreen/TitleScreen.tsx
  - src/components/TitleScreen/TitleScreen.test.tsx
  - src/i18n/messages.ts
---

# T87 — App wiring and the playtest set

```yaml
task_id: T87
title: App wiring and the playtest set
milestone: M8 — Puzzle Prototype
priority: P1
estimate: M
wave: W2
depends_on: [T86]
parallel_safe: false
paths:
  - src/app/App.tsx
  - src/app/App.test.tsx
  - src/main.tsx
  - src/game/playtestTables.ts
  - src/game/playtestTables.test.ts
  - src/components/TitleScreen/
  - src/i18n/messages.ts
```

## Why

App is where randomness and tile IDs enter (AGENTS.md). Puzzle needs a dealt
table at Start Run and Play Again, pays from the table, and the next row's
equation at each advance. The preview also needs the fixed playtest set Ori
allowed (journal 2026-10-19), wired so that removing it touches no game code.

## Interfaces

**Consumes (T85, T86):** `dealPuzzle`, `solvePuzzle`, `createTiles`,
`isRunComplete`, `PuzzleTable`, `PUZZLE_SAMPLE`, `makePuzzleRow`.

**Produces:**

```ts
// src/app/App.tsx
export interface AppDependencies {
  random: RandomSource;
  nextTileId: TileIdFactory;
  gameUrl: string;
  /** Deals Puzzle's next table. Called only from event handlers, once per run. */
  dealPuzzle(): PuzzleTable;
}

// src/game/playtestTables.ts — preview only; T90 deletes the file
export const PLAYTEST_TABLES: readonly PuzzleTable[];
export function dealPlaytestFirst(deal: () => PuzzleTable): () => PuzzleTable;

// src/i18n/messages.ts
mode.puzzle: "Puzzle" | "묘수풀이"
mode.puzzleHint: "Every tile face up" | "모든 타일을 펼쳐 놓고"
```

## The playtest set

Picked with the draft's research solver (`sims/solver.ts`: `plantedTable`,
`solve`, `myopic`, `lookahead`) by walking `mulberry32` seeds from 1 and taking
the first table in band for each tier (spec §6). Run on 2026-10-19 with
`docs/research/game-modes/03-puzzle/sims/pick-tables.ts`, output in
`pick-tables.log` beside it (`node docs/research/game-modes/_runner/run.mjs
docs/research/game-modes/03-puzzle/sims/pick-tables.ts` reproduces it). The
seeds are research handles and go in the commit body, never on screen.

| # | Tier | Seed | Hand (deal order) | Rows `left × right` pays | Par | Only-moves | Myopic | Lookahead | Sacrifice |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Medium | 20 | 1 9 8 5 0 | 2×4 [2 5] · 5×5 [1 3 1] · 7×5 [8 9 3] · 1×8 [5 1] · 5×6 [8 7 8] · 6×7 [0 3 4] · 1×9 [7 8] · 6×3 [8 2 7] | 7 | 2 | 2 | 7 | no |
| 2 | Hard | 18 | 6 9 0 8 2 | 9×1 [2 4] · 7×4 [8 4 1] · 6×7 [6 1 2] · 2×4 [9 2] · 7×4 [3 8 5] · 4×4 [2 8 9] · 3×4 [2 1 6] · 2×1 [3 2] | 7 | 3 | 2 | 6 | no |
| 3 | The sample | 16641 | 5 9 1 4 7 | as `PUZZLE_SAMPLE` | 7 | 4 | 2 | 6 | yes |

## Steps

- [ ] **Write the failing tests.**

      `src/game/playtestTables.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { solvePuzzle } from "./puzzle";
import { dealPlaytestFirst, PLAYTEST_TABLES } from "./playtestTables";
import { PUZZLE_SAMPLE } from "../test/fixtures";

describe("PLAYTEST_TABLES", () => {
  it.each([
    ["Medium", 0, { par: 7, onlyMoves: 2, sacrificeRequired: false }],
    ["Hard", 1, { par: 7, onlyMoves: 3, sacrificeRequired: false }],
    ["the sample", 2, { par: 7, onlyMoves: 4, sacrificeRequired: true }],
  ])("prices %s as recorded", (_name, index, solution) => {
    const { hand, rows, par } = PLAYTEST_TABLES[index]!;
    expect(solvePuzzle({ hand, rows })).toEqual(solution);
    expect(par).toBe(solution.par);
  });

  it("holds the same sample the fixtures do", () => {
    expect(PLAYTEST_TABLES[2]).toEqual(PUZZLE_SAMPLE);
  });
});

describe("dealPlaytestFirst", () => {
  it("deals the set in order, then the live dealer", () => {
    const live = { ...PUZZLE_SAMPLE, par: 6 };
    const deal = vi.fn(() => live);
    const next = dealPlaytestFirst(deal);
    expect([next(), next(), next()]).toEqual(PLAYTEST_TABLES);
    expect(deal).not.toHaveBeenCalled();
    expect(next()).toBe(live);
    expect(deal).toHaveBeenCalledTimes(1);
  });
});
```

      `src/app/App.test.tsx`: `renderApp`'s options gain
      `dealPuzzle?: () => PuzzleTable`, defaulting to `() => PUZZLE_SAMPLE`, and it
      passes it in `dependencies`. Then a new `describe("Puzzle", …)`:

```ts
async function startPuzzle(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Puzzle/ }));
  await user.click(screen.getByRole("button", { name: "Start Run" }));
}

async function press(user: ReturnType<typeof userEvent.setup>, digits: number[]) {
  for (const digit of digits) {
    await user.click(screen.getAllByRole("button", { name: `Digit ${digit}` })[0]!);
  }
  await user.click(screen.getByRole("button", { name: "Submit" }));
}

describe("Puzzle", () => {
  it("deals the table's hand and shows row 1", async () => {
    const user = userEvent.setup();
    renderApp([]);
    await startPuzzle(user);
    expect(screen.getByText("3 × 5 =")).toBeInTheDocument();
    for (const digit of [1, 4, 5, 7, 9]) {
      expect(screen.getByRole("button", { name: `Digit ${digit}` })).toBeInTheDocument();
    }
  });

  // renderApp([]) gives an exhausted RandomSource: any draw throws, so these
  // rows prove the pay and the next equation come from the table.
  it("pays the row's printed tiles and advances row by row without drawing randomness", async () => {
    const user = userEvent.setup();
    renderApp([]);
    await startPuzzle(user);
    await press(user, [5, 7]); // the sacrifice: 57 for 15
    await user.click(screen.getByRole("button", { name: "Next Round" }));
    expect(screen.getByText("7 × 2 =")).toBeInTheDocument();
    await press(user, [1, 4]); // 14, paid 8 1 6
    await user.click(screen.getByRole("button", { name: "Next Round" }));
    expect(screen.getByText("3 × 3 =")).toBeInTheDocument();
    for (const digit of [1, 6, 8, 9]) {
      expect(screen.getByRole("button", { name: `Digit ${digit}` })).toBeInTheDocument();
    }
  });

  it("advances to the next row on its own after a discard", async () => {
    const user = userEvent.setup();
    renderApp([]);
    await startPuzzle(user);
    await press(user, [5, 7]);
    await user.click(screen.getByRole("button", { name: "Next Round" }));
    await press(user, [1, 4]);
    await user.click(screen.getByRole("button", { name: "Next Round" }));
    await press(user, [9]);
    await user.click(screen.getByRole("button", { name: "Next Round" }));
    await press(user, [7]); // 1 × 7, paid 4 4: six tiles in five sockets
    await user.click(screen.getByRole("button", { name: "Digit 6" }));
    finishDeparture();
    expect(await screen.findByText("4 × 1 =")).toBeInTheDocument();
  });

  it("deals once per run under StrictMode", async () => {
    const user = userEvent.setup();
    const oneRow: PuzzleTable = { hand: [1, 2, 3, 4], rows: [makePuzzleRow(1, 2, [1, 2])], par: 1 };
    const dealPuzzle = vi.fn(() => oneRow);
    renderApp([], { strictMode: true, dealPuzzle });
    await startPuzzle(user);
    expect(dealPuzzle).toHaveBeenCalledTimes(1);
    await press(user, [2]);
    await user.click(screen.getByRole("button", { name: "Next Round" }));
    await user.click(screen.getByRole("button", { name: "Play Again" }));
    expect(dealPuzzle).toHaveBeenCalledTimes(2);
  });
});
```

      `src/components/TitleScreen/TitleScreen.test.tsx`: the mode group holds
      three buttons, Endless, Classic and Puzzle, and choosing Puzzle then Start
      Run calls `onStart("puzzle")`. Follow the file's existing mode-select test.

- [ ] **Run them and record the failure.**
      Run: `npx vitest run src/app src/game/playtestTables.test.ts src/components/TitleScreen`
      Expected: FAIL. `./playtestTables` does not resolve, and no button is named
      Puzzle.
- [ ] **Copy.** `mode.puzzle` and `mode.puzzleHint` in `en` and `ko` (Interfaces).
- [ ] **Title.** `MODES` gains `"puzzle"`, last.
- [ ] **Playtest set.** `src/game/playtestTables.ts`: `PLAYTEST_TABLES` is the
      three tables above as literals, written with a local
      `row(left, right, pay)` helper (production code does not import
      `src/test/`). `dealPlaytestFirst(deal)` keeps a count in its closure:
      it returns `PLAYTEST_TABLES[count++]` while one is left, then `deal()`.
      The file comment says it is preview-only, cites journal 2026-10-19, and
      says T90 deletes it.
- [ ] **App.**
  - `AppDependencies` gains `dealPuzzle`.
  - A `startState(mode)` helper, shared by `handleStart` and `handleRestart`,
    returns `{ equation, inventory, table? }`. For Puzzle, `table =
    dependencies.dealPuzzle()`, `inventory = sortTiles(createTiles(table.hand,
    nextTileId))`, `equation = table.rows[0].equation`. Otherwise it is today's
    code.
  - `handleSubmit`: for a correct Puzzle answer, `rewardTiles =
    createTiles(state.table.rows[state.round - 1].pay, nextTileId)`.
  - `handleNextRound`: `isAtClassicFloor(state)` becomes `isRunComplete(state)`.
    Otherwise Puzzle passes `state.table.rows[state.round].equation`, and the
    other modes call `generateKindEquation` as today.
- [ ] **Entry.** `src/main.tsx`:
      `dealPuzzle: dealPlaytestFirst(() => dealPuzzle(Math.random))`, with a
      comment pointing at `playtestTables.ts`.
- [ ] **Run the tests.** Same command. Expected: PASS. Then `npm test`: every
      existing App test passes untouched apart from `renderApp`'s new option.
- [ ] **Look at it.** `npm run dev`, choose Puzzle, Start Run: the rack holds
      0 1 5 8 9 (table 1, sorted). Play Again deals table 2's 0 2 6 8 9; then the
      sample's 1 4 5 7 9; then a live deal. A reload starts again at table 1.
- [ ] **Gates.** `npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e`.
      The title now holds three mode buttons, and the sweep's title state is
      where an overflow at 305px would show.
- [ ] **Commit.**

```bash
git add src/app src/main.tsx src/game/playtestTables.ts src/game/playtestTables.test.ts src/components/TitleScreen src/i18n/messages.ts
git commit -m "feat(puzzle): deal tables from App, with the preview's playtest set" -m "Task: T87" -m "Playtest set, picked with the research solver: Medium is mulberry32 seed 20, Hard seed 18, the sample seed 16641. Research handles only; never shown to a player." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Acceptance gate

- `npm test` green.
- In `npm run dev`, the first three Puzzle deals are tables 1, 2 and 3, then live.

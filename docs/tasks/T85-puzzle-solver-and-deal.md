---
reads:
  - docs/superpowers/specs/2026-10-19-puzzle-prototype-design.md  # §3 rules, §5 the deal
  - docs/research/game-modes/03-puzzle/README.md  # §5 economy, the sample, the controls
  - docs/research/game-modes/03-puzzle/sims/solver.ts  # the code this task ports
  - docs/research/game-modes/03-puzzle/sims/sample.log  # the sample's solved figures
  - src/game/generators.ts
  - src/game/balance.ts
  - src/game/types.ts
  - src/test/fixtures.ts
---

# T85 — Puzzle solver and deal

```yaml
task_id: T85
title: Puzzle solver and deal
milestone: M8 — Puzzle Prototype
priority: P1
estimate: M
wave: W0
depends_on: []
parallel_safe: false
paths:
  - src/game/puzzle.ts
  - src/game/puzzle.test.ts
  - src/game/generators.ts
  - src/game/balance.ts
  - src/game/types.ts
  - src/test/fixtures.ts
```

## Why

Puzzle's tables cannot be dealt blind: a uniform deal is 0.0% clearable (the
draft's §5). This task ports the draft's solver and planted deal into a pure
module, so App can deal a table whose par is known.

## Interfaces

**Produces:**

```ts
// src/game/types.ts
export interface PuzzleRow {
  equation: Equation;
  /** The digits a correct answer takes, in arrival order. */
  pay: Digit[];
}
export interface PuzzleTable {
  hand: Digit[];
  rows: PuzzleRow[];
  par: number;
}
/** A table before the solver has priced it. */
export type PuzzleDeal = Omit<PuzzleTable, "par">;

// src/game/puzzle.ts
export interface PuzzleSolution {
  par: number;
  onlyMoves: number;
  sacrificeRequired: boolean;
}
export const PUZZLE_DEAL_ATTEMPTS = 200;
export function solvePuzzle(deal: PuzzleDeal): PuzzleSolution;
export function playMyopic(deal: PuzzleDeal): number;
export function plantTable(random: RandomSource): PuzzleDeal;
export function dealPuzzle(random: RandomSource, attempts?: number): PuzzleTable;

// src/game/generators.ts: these four become exports, unchanged
export const EQUATION_PAIRS;
export function readRandomSample(random: RandomSource): number;
export function sampleBinIndex(value: number, binCount: number): number;
export function orientPair(pair: readonly [number, number], orderSample: number): Equation;

// src/game/balance.ts
export const PUZZLE_CAPACITY = 5;
export const PUZZLE_ROWS = 8;
export const PUZZLE_PLANT_RATE = 0.6;
export const PUZZLE_MIN_PAR = 7;
export const PUZZLE_MIN_ONLY_MOVES = 2;

// src/test/fixtures.ts
export const seededRandom: (seed: number) => RandomSource; // mulberry32, test-only
export const makePuzzleRow: (left: number, right: number, pay: Digit[]) => PuzzleRow;
export const PUZZLE_SAMPLE: PuzzleTable;
```

## Port map

Port from `docs/research/game-modes/03-puzzle/sims/solver.ts`, printed-pay
model (`"P"`) only. Keep the **enumeration order** exactly: correct options
first (discard digit ascending), then misses (one-digit: spent digit
ascending; two-digit: pairs `a ≤ b` ascending). Only-moves and the canonical
par line depend on it.

| Research (`solver.ts`) | Port (`puzzle.ts`) |
|---|---|
| `options()`, lines 45–79 | `options(k, counts, size)`; `bounty![k]` → `deal.rows[k].pay`; `cap` → `PUZZLE_CAPACITY`; drop `ptr` and the wall |
| `dist()` and `best()`, lines 81–98 | `bestScore(k, counts, size)`: memoized max of `gain + bestScore(next)`, 0 when there are no options. No histogram |
| `bestNoSac()`, lines 99–111 | `bestScoreWithoutSacrifice(k, counts, size)`, same memo shape |
| `solve()`, lines 113–133 | `solvePuzzle`: walk the canonical par line (first optimal option); count `onlyMoves` where options ≥ 2 and exactly one keeps par; `sacrificeRequired = bestScoreWithoutSacrifice(root) < par` |
| `playBot`, `mostCopies`, `botPicker`, `myopic`, lines 135–152, 169–190 | `playMyopic`. The lookahead bot (`neededAt`, `latest`) is **not** ported |
| `plantedTable(…, distinctHand = true)`, lines 225–253 | `plantTable(random)` with `cap = PUZZLE_CAPACITY`, `K = PUZZLE_ROWS`, `q = PUZZLE_PLANT_RATE`. Every `rnd()` becomes `readRandomSample(random)`; every `Math.floor(rnd() * n)` becomes `sampleBinIndex(readRandomSample(random), n)`; the pair orientation is `orientPair(pair, readRandomSample(random))`; `PAIRS` is `EQUATION_PAIRS` (same set, same order). **Keep the call order**, so a seeded source reproduces the research tables exactly |
| `mulberry32`, `randomTable`, the wall model | Not ported. `mulberry32` is copied into `src/test/fixtures.ts` as `seededRandom` |

`solvePuzzle` and `playMyopic` throw a `RangeError` when `deal.hand.length >
PUZZLE_CAPACITY`, as the research `makeSolver` does.

`dealPuzzle(random, attempts = PUZZLE_DEAL_ATTEMPTS)` loops `attempts` times:
`plantTable`, `solvePuzzle`, `playMyopic`; it returns `{ ...deal, par }` for the
first deal in the band (`par ≥ PUZZLE_MIN_PAR`, myopic `< par`,
`onlyMoves ≥ PUZZLE_MIN_ONLY_MOVES`), else the last deal with its par.

## Steps

- [ ] **Branch check.** `git branch --show-current` prints
      `feat/M8-puzzle-prototype`.
- [ ] **Fixtures first.** Add to `src/test/fixtures.ts`:

```ts
// mulberry32, for tests only: the research tables were dealt with it, so a
// seeded source can replay them. Production never seeds a run.
export const seededRandom = (seed: number): RandomSource => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let x = Math.imul(state ^ (state >>> 15), 1 | state);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

export const makePuzzleRow = (left: number, right: number, pay: Digit[]): PuzzleRow => ({
  equation: makeEquation(left, right),
  pay,
});

// The draft's showcase table (its §5): mulberry32 seed 16641, par 7, and par
// needs a sacrifice on row 1. Hand in deal order.
export const PUZZLE_SAMPLE: PuzzleTable = {
  hand: [5, 9, 1, 4, 7],
  rows: [
    makePuzzleRow(3, 5, [9, 5, 5]),
    makePuzzleRow(7, 2, [8, 1, 6]),
    makePuzzleRow(3, 3, [2, 7]),
    makePuzzleRow(1, 7, [4, 4]),
    makePuzzleRow(4, 1, [6, 2]),
    makePuzzleRow(8, 3, [0, 7, 7]),
    makePuzzleRow(2, 3, [8, 8]),
    makePuzzleRow(3, 4, [2, 0, 2]),
  ],
  par: 7,
};
```

- [ ] **Write the failing tests** in `src/game/puzzle.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  PUZZLE_CAPACITY,
  PUZZLE_MIN_ONLY_MOVES,
  PUZZLE_MIN_PAR,
  PUZZLE_ROWS,
} from "./balance";
import { getAnswerLength, getRewardCount } from "./selectors";
import { dealPuzzle, playMyopic, plantTable, solvePuzzle } from "./puzzle";
import type { PuzzleDeal } from "./types";
import { makePuzzleRow, PUZZLE_SAMPLE, seededRandom } from "../test/fixtures";

const deal = ({ hand, rows }: PuzzleDeal): PuzzleDeal => ({ hand, rows });

describe("solvePuzzle", () => {
  it("prices the draft's sample: par 7, four only-moves, and par needs a sacrifice", () => {
    expect(solvePuzzle(deal(PUZZLE_SAMPLE))).toEqual({
      par: 7,
      onlyMoves: 4,
      sacrificeRequired: true,
    });
  });

  it("scores 0 when the hand can spell no row", () => {
    const fiveOnes: PuzzleDeal = {
      hand: [1, 1, 1, 1, 1],
      rows: Array.from({ length: 6 }, () => makePuzzleRow(7, 8, [1, 1, 1])),
    };
    expect(solvePuzzle(fiveOnes).par).toBe(0);
    expect(playMyopic(fiveOnes)).toBe(0);
  });

  it("caps the no-0 control at 3 of 4, since row 1 needs a 0 nothing supplies", () => {
    const noZero: PuzzleDeal = {
      hand: [1, 2, 4, 6, 8],
      rows: [
        makePuzzleRow(5, 8, [1, 2, 3]),
        makePuzzleRow(2, 3, [1, 2]),
        makePuzzleRow(3, 4, [6, 8, 9]),
        makePuzzleRow(2, 4, [1, 3]),
      ],
    };
    expect(solvePuzzle(noZero).par).toBe(3);
  });

  it("refuses an opening hand over capacity", () => {
    const over: PuzzleDeal = { hand: [1, 2, 3, 4, 5, 6], rows: [makePuzzleRow(2, 3, [1, 2])] };
    expect(() => solvePuzzle(over)).toThrow(RangeError);
  });
});

describe("playMyopic", () => {
  it("scores the sample 2, as the research bot does", () => {
    expect(playMyopic(deal(PUZZLE_SAMPLE))).toBe(2);
  });
});

describe("plantTable", () => {
  it("replays the research deal exactly under the same seed", () => {
    expect(plantTable(seededRandom(16641))).toEqual(deal(PUZZLE_SAMPLE));
  });

  it("deals five distinct digits and eight rows, each paying its reward count", () => {
    const { hand, rows } = plantTable(seededRandom(2));
    expect(hand).toHaveLength(PUZZLE_CAPACITY);
    expect(new Set(hand).size).toBe(PUZZLE_CAPACITY);
    expect(rows).toHaveLength(PUZZLE_ROWS);
    for (const { equation, pay } of rows) {
      expect(pay).toHaveLength(getRewardCount(getAnswerLength(equation)));
    }
  });

  it("rejects a source outside [0, 1)", () => {
    expect(() => plantTable(() => 1)).toThrow(RangeError);
  });
});

describe("dealPuzzle", () => {
  it("deals a table inside the band, with its par", () => {
    const table = dealPuzzle(seededRandom(1));
    const { par, onlyMoves } = solvePuzzle(deal(table));
    expect(table.par).toBe(par);
    expect(par).toBeGreaterThanOrEqual(PUZZLE_MIN_PAR);
    expect(playMyopic(deal(table))).toBeLessThan(par);
    expect(onlyMoves).toBeGreaterThanOrEqual(PUZZLE_MIN_ONLY_MOVES);
  });

  it("stops at the attempt bound and returns that deal, priced", () => {
    const planted = plantTable(seededRandom(3));
    expect(dealPuzzle(seededRandom(3), 1)).toEqual({
      ...planted,
      par: solvePuzzle(planted).par,
    });
  });
});
```

- [ ] **Run them and record the failure.**
      Run: `npx vitest run src/game/puzzle.test.ts`
      Expected: FAIL, `Failed to resolve import "./puzzle"` (and the fixtures'
      `PuzzleTable` type does not exist yet).
- [ ] **Types.** Add `PuzzleRow`, `PuzzleTable` and `PuzzleDeal` to
      `src/game/types.ts` as in Interfaces.
- [ ] **Dials.** Add the five `PUZZLE_*` dials to `src/game/balance.ts`, each with
      its economy effect in the file's comment style:
  - `PUZZLE_CAPACITY` (5): Puzzle's sockets. The draft's band figures are
    measured at 5; at 6 the band moves (11–16% in band at 6 rows).
  - `PUZZLE_ROWS` (8): rows per table, and so the run's length.
  - `PUZZLE_PLANT_RATE` (0.6): how often a row comes from what the hidden line
    can spell. 1.0 makes every table clearable, though the myopic bot still
    scores only about three rows in four; the uniform deal (0) is 0.0%
    clearable.
  - `PUZZLE_MIN_PAR` (7): the lowest par the band accepts.
  - `PUZZLE_MIN_ONLY_MOVES` (2): the fewest only-moves on the par line the band
    accepts. With the two above, about one plant in seven is accepted.
- [ ] **Exports.** Export `EQUATION_PAIRS`, `readRandomSample`, `sampleBinIndex`
      and `orientPair` from `src/game/generators.ts`. Bodies unchanged.
- [ ] **Port** `src/game/puzzle.ts` per the port map. A file comment names the
      source (`docs/research/game-modes/03-puzzle/sims/solver.ts`) and says the
      wall model, the lookahead bot and the seeded PRNG stay there.
- [ ] **Run the tests.** Run: `npx vitest run src/game/puzzle.test.ts`.
      Expected: PASS, 10 tests. If `plantTable` replays the sample but
      `onlyMoves` is not 4, the enumeration order drifted from the research
      solver: fix the order, not the expectation.
- [ ] **Calibrate** (one-off, not in the suite). Write `calibrate.ts` in a scratch
      directory outside the repo; under `src/` or `docs/`, `eslint .` and
      `vitest` would collect it:

```ts
// Seeded, so the reading reproduces: seeds 1..2000, one plant each.
import { playMyopic, plantTable, solvePuzzle } from "/Users/ori/repos/ozterisk/src/game/puzzle.ts";
import { seededRandom } from "/Users/ori/repos/ozterisk/src/test/fixtures.ts";
let inBand = 0;
for (let seed = 1; seed <= 2000; seed++) {
  const deal = plantTable(seededRandom(seed));
  const { par, onlyMoves } = solvePuzzle(deal);
  if (par >= 7 && playMyopic(deal) < par && onlyMoves >= 2) inBand++;
}
console.log(`in band ${((inBand / 2000) * 100).toFixed(1)}% of 2,000 plants`);
```

      Run: `node docs/research/game-modes/_runner/run.mjs /abs/path/to/calibrate.ts`
      Expected: between 13.0% and 16.2%. Keep the line for the PR body.
- [ ] **Gates.** `npm run lint && npm run typecheck && npm test && npm run build`.
- [ ] **Commit.**

```bash
git add src/game/puzzle.ts src/game/puzzle.test.ts src/game/generators.ts src/game/balance.ts src/game/types.ts src/test/fixtures.ts
git commit -m "feat(puzzle): solver and planted deal for face-up tables" -m "Task: T85" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Open the draft PR** (spec §9.2: early, so the preview follows the
      branch). `git push -u origin feat/M8-puzzle-prototype`, then, as a
      separate call, `gh pr create --draft` with the title
      `[M8] Prototype Puzzle for the kill playtest` and the AGENTS.md §4.4 body:
      a `Closes #` line per T85–T90 issue, the calibration line, and links to
      the spec, the plan and spec §6.1.

## Acceptance gate

- `npx vitest run src/game/puzzle.test.ts` green; `npm test` green.
- `plantTable(seededRandom(16641))` equals the draft's sample.
- The calibration line is inside 13.0–16.2%.

// The preview's fixed playtest set (journal 2026-10-19): the first three Puzzle
// deals of a page load, in order, before the live dealer takes over. Preview
// only; T90 deletes this file and the wrapper in main.tsx.
//
// Picked with the research solver, walking mulberry32 seeds for the first table
// in band per tier; the seeds are research handles and live in the T87 commit
// body. Hands are in deal order. This file keeps its own copy of the sample
// because production code does not import from src/test/; a test asserts the
// two are equal.
import type { Digit, PuzzleRow, PuzzleTable } from "./types";

const row = (left: number, right: number, pay: Digit[]): PuzzleRow => ({
  equation: { left, right, product: left * right },
  pay,
});

export const PLAYTEST_TABLES: readonly PuzzleTable[] = [
  {
    hand: [1, 9, 8, 5, 0],
    rows: [
      row(2, 4, [2, 5]),
      row(5, 5, [1, 3, 1]),
      row(7, 5, [8, 9, 3]),
      row(1, 8, [5, 1]),
      row(5, 6, [8, 7, 8]),
      row(6, 7, [0, 3, 4]),
      row(1, 9, [7, 8]),
      row(6, 3, [8, 2, 7]),
    ],
    par: 7,
  },
  {
    hand: [6, 9, 0, 8, 2],
    rows: [
      row(9, 1, [2, 4]),
      row(7, 4, [8, 4, 1]),
      row(6, 7, [6, 1, 2]),
      row(2, 4, [9, 2]),
      row(7, 4, [3, 8, 5]),
      row(4, 4, [2, 8, 9]),
      row(3, 4, [2, 1, 6]),
      row(2, 1, [3, 2]),
    ],
    par: 7,
  },
  {
    hand: [5, 9, 1, 4, 7],
    rows: [
      row(3, 5, [9, 5, 5]),
      row(7, 2, [8, 1, 6]),
      row(3, 3, [2, 7]),
      row(1, 7, [4, 4]),
      row(4, 1, [6, 2]),
      row(8, 3, [0, 7, 7]),
      row(2, 3, [8, 8]),
      row(3, 4, [2, 0, 2]),
    ],
    par: 7,
  },
];

/** Deals the playtest set in order, then whatever `deal` returns. */
export function dealPlaytestFirst(deal: () => PuzzleTable): () => PuzzleTable {
  let dealt = 0;
  return () => (dealt < PLAYTEST_TABLES.length ? PLAYTEST_TABLES[dealt++] : deal());
}

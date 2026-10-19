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

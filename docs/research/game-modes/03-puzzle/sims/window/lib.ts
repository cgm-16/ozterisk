// Window bot for "Puzzle Window" (research only). The move generator and the
// clairvoyant memo come from the branch's createSearch (scratch copy with only
// `export` added, see puzzle-search.ts); plantTable/playMyopic/solvePuzzle
// are imported untouched from src/game.
// Describes 3ccd37b. M10 removes playtestTables.ts and M8's band dials, so after its build re-run from `git archive 3ccd37b`.
import { createSearch } from "./puzzle-search.ts";
import { plantTable, playMyopic, solvePuzzle } from "../../../../../../src/game/puzzle.ts";
import type { PuzzleDeal, RandomSource } from "../../../../../../src/game/types.ts";

export { mulberry32 } from "../solver.ts";
export { plantTable, playMyopic, solvePuzzle };

const ROWS = 8;
type Search = ReturnType<typeof createSearch>;
type Option = ReturnType<Search["options"]>[number];
const gain = (o: Option) => (o.kind === "correct" ? 1 : 0);
const distinct = (counts: number[]) => counts.filter((c) => c > 0).length;
// Tie-break key: spent and discarded digits, sorted. Correct moves sort before misses.
const tieKey = (o: Option, product: number) =>
  o.kind === "correct"
    ? [0, ...[...String(product).split("").map(Number), ...(o.discard === null ? [] : [o.discard])].sort((a, b) => a - b)]
    : [1, ...o.spend];
const lexLess = (a: number[], b: number[]) => {
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] < b[i];
  return a.length < b.length;
};

export interface Decision { r: number; scoreBefore: number; options: Option[]; values: number[] }

// Tuple (correct, size, distinct) encoded as correct*100 + size*10 + distinct; size and distinct are <= 5.
// dropFirst zeroes the correct-count component: the must-fail control for the k = 8 check.
export function windowLine(search: Search, k: number, dropFirst = false) {
  const { options, rows, root } = search;
  const memo = new Map<string, number>();
  const value = (j: number, counts: number[], size: number, end: number): number => {
    const id = `${j}|${end}|${counts.join()}`;
    const hit = memo.get(id);
    if (hit !== undefined) return hit;
    const os = j > end ? [] : options(j, counts, size);
    let best = os.length === 0 ? size * 10 + distinct(counts) : -1;
    for (const o of os) best = Math.max(best, gain(o) * 100 + value(j + 1, o.counts, o.size, end));
    memo.set(id, best);
    return best;
  };
  let { counts, size } = root;
  let score = 0;
  const line: Decision[] = [];
  for (let r = 0; ; r++) {
    const os = options(r, counts, size);
    if (os.length === 0) break;
    const end = Math.min(r + k - 1, ROWS - 1);
    const values = os.map((o) => {
      const v = gain(o) * 100 + value(r + 1, o.counts, o.size, end);
      return dropFirst ? v % 100 : v;
    });
    // Strictly greater wins, else the smaller tie key.
    let pick = 0;
    for (let i = 1; i < os.length; i++) {
      if (values[i] > values[pick] || (values[i] === values[pick] && lexLess(tieKey(os[i], rows[r].product), tieKey(os[pick], rows[r].product)))) pick = i;
    }
    line.push({ r, scoreBefore: score, options: os, values });
    score += gain(os[pick]);
    ({ counts, size } = os[pick]);
  }
  return { score, submissions: line.length, line };
}

export function windowOnlyMoves(search: Search, line: Decision[], windowPar: number): number {
  let only = 0;
  for (const { r, scoreBefore, options: os } of line) {
    if (os.length < 2) continue;
    const reach = os.filter((o) => gain(o) + search.bestScore(r + 1, o.counts, o.size) >= windowPar - scoreBefore).length;
    if (reach < 1) throw new Error(`no option reaches window par at row ${r}`);
    if (reach === 1) only++;
  }
  return only;
}

export interface Record { window: number; clair: number; myopic: number; only: number; submissions: number; early: boolean; hard: boolean }

export function analyze(deal: PuzzleDeal, k: number): Record {
  const search = createSearch(deal);
  const { score: window, submissions, line } = windowLine(search, k);
  const clair = search.bestScore(0, search.root.counts, search.root.size);
  const only = windowOnlyMoves(search, line, window);
  const early = submissions < ROWS;
  return { window, clair, myopic: playMyopic(deal), only, submissions, early, hard: early || clair - window >= 2 };
}

// Plant, then filter with the three rules, cheapest first; at the bound return the last plant.
export function dealWindow(random: RandomSource, k: number, minWindowPar: number, minOnly: number, attempts = 200) {
  for (let attempt = 1; ; attempt++) {
    const deal = plantTable(random);
    const search = createSearch(deal);
    const { score, line } = windowLine(search, k);
    const ok = score >= minWindowPar && playMyopic(deal) < score && windowOnlyMoves(search, line, score) >= minOnly;
    if (ok || attempt >= attempts) return { deal, windowPar: score, attempt, ok };
  }
}

export { createSearch };

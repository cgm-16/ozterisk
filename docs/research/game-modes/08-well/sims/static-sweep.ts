// Static sweep: unbiased buildable rate b for iid-uniform digits laid out by gravity
// (level fill, lowest stack first), across well sizes and adjacency rules.
// Calibration: adjacency "all" must reproduce the free-rack b(n) of the repo
// (b(10) ~= 0.48, closed form 13/45*(1-0.9^n) + 32/45*(1-2*0.9^n+0.8^n)).
// Negative control: adjacency "none" can spell no 2-digit product.
import { generateEquation } from "../../../../../src/game/generators.ts";
import { canConstruct } from "../../../../../src/game/selectors.ts";
import type { Digit, Tile } from "../../../../../src/game/types.ts";
import { PAIRS, PRODUCTS, coverage, levelGrid, type Adjacency, type Order } from "./well-model.ts";

const TRIALS = 20000;
const rand = Math.random;
const iid = (n: number) => Array.from({ length: n }, () => Math.floor(rand() * 10));

// --- Instrument checks -------------------------------------------------------
// 1. Our pool is the real generator's pool: 45 pairs, 13 one-digit products.
const oneDigit = PRODUCTS.filter((p) => p < 10).length;
let realOne = 0;
const DRAWS = 200000;
for (let i = 0; i < DRAWS; i++) if (generateEquation(rand).product < 10) realOne++;
console.log(`pool: ${PAIRS.length} pairs, ${oneDigit} one-digit (13/45 = ${(13 / 45).toFixed(4)}); real generateEquation one-digit share over ${DRAWS} draws = ${(realOne / DRAWS).toFixed(4)}`);

// 2. Closed form vs Monte Carlo vs the repo's own canConstruct, free rack.
const closed = (n: number) => (13 / 45) * (1 - 0.9 ** n) + (32 / 45) * (1 - 2 * 0.9 ** n + 0.8 ** n);
function repoB(n: number, trials: number): number {
  let hit = 0;
  for (let t = 0; t < trials; t++) {
    const hand: Tile[] = iid(n).map((d, i) => ({ id: `t${i}`, isNew: false, digit: d as Digit }));
    for (const p of PRODUCTS) if (canConstruct(hand, p)) hit++;
  }
  return hit / (trials * PRODUCTS.length);
}
function gridB(W: number, H: number, n: number, adj: Adjacency, order: Order, trials = TRIALS): number {
  let sum = 0;
  for (let t = 0; t < trials; t++) sum += coverage(levelGrid(W, H, iid(n)), adj, order);
  return sum / trials;
}
for (const n of [10, 15]) {
  console.log(`calib n=${n}: closed ${closed(n).toFixed(3)} | repo canConstruct MC ${repoB(n, 5000).toFixed(3)} | grid 5x3 adjacency=all ${gridB(5, 3, n, "all", "any").toFixed(3)}`);
}
console.log(`negative control: 5x3 full, adjacency=none -> ${gridB(5, 3, 15, "none", "any").toFixed(3)} (must equal 13/45*(1-0.9^15) = ${((13 / 45) * (1 - 0.9 ** 15)).toFixed(3)})`);

// --- Sweep: full wells -------------------------------------------------------
const CLIFF = 1.71 / 2.71;
const KIND = 0.2;
const shapes: Array<[number, number]> = [[5, 2], [4, 3], [5, 3], [4, 4], [6, 3], [5, 4], [6, 4]];
console.log(`\nFULL WELLS, iid uniform digits, ${TRIALS} grids each. b' = 0.2 + 0.8 b (kind bias, touching-aware). cliff = ${CLIFF.toFixed(3)}`);
console.log("shape  cap | free b | orth-any b  b' | orth-reading b | king-any b  b'");
for (const [W, H] of shapes) {
  const n = W * H;
  const free = closed(n);
  const oa = gridB(W, H, n, "orth", "any");
  const or = gridB(W, H, n, "orth", "reading");
  const ka = gridB(W, H, n, "king", "any");
  const bp = (b: number) => KIND + (1 - KIND) * b;
  console.log(
    `${W}x${H}  ${String(n).padStart(3)} | ${free.toFixed(3)}  | ${oa.toFixed(3)}  ${bp(oa).toFixed(3)} | ${or.toFixed(3)}          | ${ka.toFixed(3)}  ${bp(ka).toFixed(3)}`,
  );
}

// --- Partial 5x3 wells (level shape) ----------------------------------------
console.log(`\n5x3 WELL BELOW CAPACITY, level fill, orth-any (b and b'), vs free rack b(n)`);
for (let n = 6; n <= 15; n++) {
  const oa = gridB(5, 3, n, "orth", "any", 10000);
  console.log(`n=${String(n).padStart(2)}  orth b ${oa.toFixed(3)}  b' ${(KIND + (1 - KIND) * oa).toFixed(3)}  | free b ${closed(n).toFixed(3)}`);
}

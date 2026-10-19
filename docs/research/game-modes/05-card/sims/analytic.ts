// Analytic figures for draft 05. Pure arithmetic, no game modules needed
// except canConstruct for a cross-check of the 1-digit / 2-digit split.
import { canConstruct } from "../../../../../src/game/selectors.ts";
import type { Digit, Tile } from "../../../../../src/game/types.ts";

const facts: Array<[number, number]> = [];
for (let a = 1; a <= 9; a++) for (let b = a; b <= 9; b++) facts.push([a, b]);
console.log("facts:", facts.length, "| 1-digit:", facts.filter(([a, b]) => a * b < 10).length);
console.log("distinct products:", new Set(facts.map(([a, b]) => a * b)).size);

// Coupon collector: E[draws to see all 45] = 45 * H(45).
let H = 0;
for (let k = 1; k <= 45; k++) H += 1 / k;
console.log("H(45) =", H.toFixed(4), "| 45*H(45) =", (45 * H).toFixed(1));
// Expected distinct facts after k uniform draws.
for (const k of [10, 15, 20, 22, 25, 30, 45, 60, 100, 198]) {
  console.log(`  E[distinct after ${k}] = ${(45 * (1 - (44 / 45) ** k)).toFixed(1)}`);
}
// Draws for the last 10 / last 1 coupons.
let tail = 0;
for (let k = 1; k <= 10; k++) tail += 45 / k;
console.log("expected draws spent on the last 10 facts:", tail.toFixed(1));

// Digit demand: facts whose product contains digit d.
const demand = Array(10).fill(0);
for (const [a, b] of facts) for (const ch of new Set(String(a * b))) demand[Number(ch)]++;
console.log("facts needing digit 0..9:", demand.join(" "), "| sum", demand.reduce((s, x) => s + x, 0));

// Tables (hook shape on the triangle): all facts with operand k.
const tableSize = (k: number) => facts.filter(([a, b]) => a === k || b === k).length;
console.log("table sizes:", [1, 2, 3, 4, 5, 6, 7, 8, 9].map(tableSize).join(" "));

// Cross-check: the miss cost and the cliff from the real 13/32 split.
const missCost = facts.reduce((s, [a, b]) => s + (a * b >= 10 ? 2 : 1), 0) / 45;
console.log("mean answer length:", missCost.toFixed(3), "| cliff b* = L/(L+1):", (missCost / (missCost + 1)).toFixed(4));
const drift = (b: number) => b - (1 - b) * missCost;
console.log("drift(0.48) =", drift(0.48).toFixed(3), "(spec: -0.41)");

// One-of-each hand spells every product (no repeated digit), via the real canConstruct.
let id = 0;
const hand: Tile[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => ({ id: `t${id++}`, isNew: false, digit: d as Digit }));
console.log("one-of-each spells:", facts.filter(([a, b]) => canConstruct(hand, a * b)).length, "/ 45");
// Negative control: a hand of only 0s spells nothing.
const zeros: Tile[] = Array.from({ length: 10 }, () => ({ id: `t${id++}`, isNew: false, digit: 0 as Digit }));
console.log("ten 0s spell:", facts.filter(([a, b]) => canConstruct(zeros, a * b)).length, "/ 45 (must be 0)");

// Hypergeometric: chance a given 9-fact table is fully inside k distinct stamped facts.
function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
}
for (const k of [12, 16, 20, 30]) {
  const p = choose(36, k - 9) / choose(45, k);
  console.log(`  P(specific table inside ${k} random distinct facts) = ${p.toExponential(2)}`);
}

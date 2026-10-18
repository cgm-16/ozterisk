// b(n): share of draws a uniformly random hand of n tiles can answer.
// Instrument: exact multinomial enumeration over digit multisets, cross-checked
// by Monte Carlo; shipped-rule calibration uses the repo's real canConstruct.
import { canConstruct } from "../../../../../src/game/selectors.ts";
import type { Digit, Tile } from "../../../../../src/game/types.ts";
import { canSpell, drawEntries, factorOptions, mulberry32, PAIRS, type Counts, type DrawKind } from "./model.ts";

const shippedEntries = PAIRS.map(([a, b]) => a * b);
const coverage = {
  shipped: (c: Counts) => shippedEntries.filter((p) => canSpell(c, p)).length / shippedEntries.length,
  pair: (c: Counts) => drawEntries("pair").filter((p) => factorOptions(c, p).length > 0).length / 45,
  product: (c: Counts) => drawEntries("product").filter((p) => factorOptions(c, p).length > 0).length / 36,
};

function choose(n: number, k: number): number {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
}

// Exact E[coverage] over hands of n tiles, each digit uniform over `digits`.
function exact(n: number, digits: readonly number[], cov: (c: Counts) => number): number {
  const k = digits.length;
  const c: Counts = new Array(10).fill(0);
  let total = 0;
  const walk = (i: number, remaining: number, weight: number) => {
    const d = digits[i]!;
    if (i === k - 1) {
      c[d] = remaining;
      total += weight * cov(c);
      c[d] = 0;
      return;
    }
    for (let m = 0; m <= remaining; m++) {
      c[d] = m;
      walk(i + 1, remaining - m, weight * choose(remaining, m));
    }
    c[d] = 0;
  };
  walk(0, n, 1);
  return total / Math.pow(k, n);
}

function monteCarlo(n: number, digits: readonly number[], cov: (c: Counts) => number, trials: number, seed: number): number {
  const rng = mulberry32(seed);
  let sum = 0;
  for (let t = 0; t < trials; t++) {
    const c: Counts = new Array(10).fill(0);
    for (let i = 0; i < n; i++) c[digits[Math.floor(rng() * digits.length)]!]++;
    sum += cov(c);
  }
  return sum / trials;
}

const D09 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const D19 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const f3 = (x: number) => x.toFixed(3);

// ---- 1. Calibration against the repo -------------------------------------
let id = 0;
const realB = (n: number, trials: number, seed: number) => {
  const rng = mulberry32(seed);
  let hits = 0;
  for (let t = 0; t < trials; t++) {
    const hand: Tile[] = Array.from({ length: n }, () => ({ id: `t${id++}`, isNew: false, digit: Math.floor(rng() * 10) as Digit }));
    for (const p of shippedEntries) if (canConstruct(hand, p)) hits++;
  }
  return hits / (trials * 45);
};
const analytic = (n: number) => (13 * (1 - Math.pow(0.9, n)) + 32 * (1 - 2 * Math.pow(0.9, n) + Math.pow(0.8, n))) / 45;
console.log("== Calibration (shipped forward rule) ==");
for (const n of [10, 20]) {
  console.log(`b(${n}): real canConstruct MC 20k = ${f3(realB(n, 20000, 7))} | my exact = ${f3(exact(n, D09, coverage.shipped))} | spec analytic = ${f3(analytic(n))}`);
}
console.log(`Endless drift at b=0.48: ${(0.48 - 0.52 * 1.71).toFixed(3)} (spec: -0.41)`);

// ---- 2. Controls ----------------------------------------------------------
const hand = (digits: number[]) => {
  const c: Counts = new Array(10).fill(0);
  for (const d of digits) c[d]++;
  return c;
};
console.log("\n== Controls ==");
console.log(`positive: one-of-each 1-9, pair draw = ${coverage.pair(hand(D19)) * 45}/45 (must be 40); product draw = ${coverage.product(hand(D19)) * 36}/36 (must be 31)`);
console.log(`positive: one-of-each 0-9, shipped rule = ${coverage.shipped(hand(D09)) * 45}/45 (must be 45)`);
console.log(`negative: Factor b(0) = ${exact(0, D19, coverage.pair)}, b(1) = ${exact(1, D19, coverage.pair)} (must be 0); all-zero hand of 10 = ${coverage.pair(hand(new Array(10).fill(0)))} (must be 0)`);

// ---- 3. Factor b(n) ---------------------------------------------------------
const choiceShare = (draw: DrawKind) => {
  const e = drawEntries(draw);
  return e.filter((p) => factorOptionsAll(p) >= 2).length / e.length;
};
function factorOptionsAll(p: number): number {
  const full = hand([1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9]);
  return factorOptions(full, p).length;
}
console.log("\n== Draw structure (analytic, by enumeration) ==");
console.log(`share of draws whose product has 2 factor pairs: pair draw ${f3(choiceShare("pair"))}, product draw ${f3(choiceShare("product"))}`);

console.log("\n== Factor b(n), uniform random hands, exact enumeration ==");
console.log("n  | shipped 0-9 | F pair 1-9 | F product 1-9 | F pair 0-9 (0 dead)");
for (const n of [2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 20]) {
  const s = n <= 16 ? f3(exact(n, D09, coverage.shipped)) : f3(analytic(n));
  const z = n <= 16 ? f3(exact(n, D09, coverage.pair)) : "  -  ";
  console.log(`${String(n).padStart(2)} | ${s}       | ${f3(exact(n, D19, coverage.pair))}      | ${f3(exact(n, D19, coverage.product))}         | ${z}`);
}
console.log("\n== Monte Carlo cross-check, 50k hands each ==");
for (const n of [9, 10]) {
  console.log(`n=${n}: pair 1-9 MC = ${f3(monteCarlo(n, D19, coverage.pair, 50000, 11))} vs exact ${f3(exact(n, D19, coverage.pair))}; product 1-9 MC = ${f3(monteCarlo(n, D19, coverage.product, 50000, 12))} vs exact ${f3(exact(n, D19, coverage.product))}`);
}

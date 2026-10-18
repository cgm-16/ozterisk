// Calibration + controls. Instrument: lib.ts loop; static b(n) by Monte Carlo on uniform suited hands.
import { canConstruct } from "../../../../../src/game/selectors.ts";
import type { Digit, Tile } from "../../../../../src/game/types.ts";
import { bShare, mulberry32, batch, mean, se, run, type Rule } from "./lib.ts";
const r = mulberry32(42);
const hand = (n: number) => Array.from({ length: n }, () => Math.floor(r() * 30));
// 1. My bShare(rule none) against the real canConstruct on identical hands.
let diff = 0, tot = 0, sumMine = 0, sumReal = 0;
for (let t = 0; t < 20000; t++) {
  const h = hand(10); const tiles: Tile[] = h.map((x, j) => ({ id: "t" + j, isNew: false, digit: ((x / 3) | 0) as Digit }));
  let real = 0; for (let a = 1; a <= 9; a++) for (let b = a; b <= 9; b++) if (canConstruct(tiles, a * b)) real++;
  const mine = Math.round(bShare(h, "none") * 45); if (mine !== real) diff++; tot++; sumMine += mine; sumReal += real;
}
console.log(`calib: 20,000 random 10-tile hands — real canConstruct b(10) = ${(sumReal / tot / 45).toFixed(3)} (repo: 0.48); mine = ${(sumMine / tot / 45).toFixed(3)}; hands that disagree: ${diff}`);
const bn = (n: number, rule: Rule, T = 20000) => { let s = 0; for (let t = 0; t < T; t++) s += bShare(hand(n), rule); return s / T; };
console.log(`calib: b(20) = ${bn(20, "none").toFixed(3)} (repo 0.80); negative control b(0) = ${bn(0, "none", 100).toFixed(3)} (must be 0)`);
console.log(`calib: analytic drift at b = 0.48 with miss cost 1.711: ${(0.48 - 0.52 * (77 / 45)).toFixed(3)} (repo −0.41)`);
// 2. Run-level: shipped Endless rules (rule none, cap 10, kind 0.2) with this bot.
const N = 4000;
for (const [kind, label] of [[0.2, "kind 0.2"], [0, "kind 0"]] as const) {
  const rs = batch({ rule: "none", cap: 10, kind, lambda: 0, randomize: "none" }, N).map((x) => x.rounds);
  console.log(`calib: Endless (rule none, cap 10, ${label}), ${N} runs: mean rounds ${mean(rs).toFixed(2)} ± ${(1.96 * se(rs)).toFixed(2)} (pool bots: 18.8–20.0 kind on; 13.1 kind off)`);
}
// 3. Negative control: zero rewards must always lose fast.
const z = batch({ rule: "none", cap: 10, kind: 0.2, lambda: 0, randomize: "none", rewards: false }, 1000).map((x) => x.rounds);
console.log(`neg control: zero rewards, 1,000 runs: max rounds ${Math.max(...z)} (must be ≤ 10: each submission spends ≥ 1 of 10 tiles)`);
// 4. Thesis-instrument null: rule none, suits cosmetic. Randomising every suit choice must change nothing.
let changed = 0; for (let s = 0; s < 2000; s++) { const a = run(1000 + s, { rule: "none", cap: 10, kind: 0.2, lambda: 0, randomize: "none" }), b = run(1000 + s, { rule: "none", cap: 10, kind: 0.2, lambda: 0, randomize: "all" }); if (a.rounds !== b.rounds) changed++; }
console.log(`null control: suits cosmetic, 2,000 paired seeds, every suit choice randomised: runs that changed length = ${changed} (must be 0)`);

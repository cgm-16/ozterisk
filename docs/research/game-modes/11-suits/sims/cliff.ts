// Static buildable rate under each suit rule, and whole-run economy per variant.
// Instrument: bShare on 20,000 uniform suited hands per cell (suits uniform over 3); runs from lib.ts, bot = greedy coverage, skill 1, kind 0.2.
import { bShare, mulberry32, batch, mean, se, type Rule, type Cfg } from "./lib.ts";
const r = mulberry32(7);
const bn = (n: number, rule: Rule, T = 20000) => { let s = 0; for (let t = 0; t < T; t++) s += bShare(Array.from({ length: n }, () => Math.floor(r() * 30)), rule); return s / T; };
console.log("Static b(n), unbiased → kind-biased b' = 0.2 + 0.8b. Cliff guard 0.631, full-hand ~0.644.");
console.log("n   | none          | flushGate     | suitEq");
for (const n of [5, 8, 10, 12, 14, 16, 18, 20, 24]) {
  const row = (["none", "flushGate", "suitEq"] as Rule[]).map((ru) => { const b = bn(n, ru); return `${b.toFixed(3)} / ${(0.2 + 0.8 * b).toFixed(3)}`; });
  console.log(`${String(n).padEnd(3)} | ${row.join(" | ")}`);
}
console.log("\nWhole runs, 3,000 runs each, round cap 1,000. b_run = correct / submissions; b_full = same on full-rack rounds; f = flush share of correct answers.");
const show = (label: string, c: Cfg) => {
  const rs = batch(c, 3000); const R = rs.map((x) => x.rounds);
  const sub = R.reduce((a, b) => a + b, 0), cor = rs.reduce((a, x) => a + x.correct, 0);
  const fr = rs.reduce((a, x) => a + x.fullRounds, 0), fc = rs.reduce((a, x) => a + x.fullCorrect, 0), fl = rs.reduce((a, x) => a + x.flushes, 0);
  const capped = rs.filter((x) => x.rounds >= 1000).length;
  const sorted = [...R].sort((a, b) => a - b);
  console.log(`${label.padEnd(34)} rounds ${mean(R).toFixed(1)} ± ${(1.96 * se(R)).toFixed(1)} (median ${sorted[1500]}) | b_run ${(cor / sub).toFixed(3)} | b_full ${(fc / Math.max(1, fr)).toFixed(3)} | f ${(fl / Math.max(1, cor)).toFixed(3)} | capped ${capped} | points/run ${mean(rs.map((x) => x.points)).toFixed(1)}`);
};
show("Endless (none), cap 10", { rule: "none", cap: 10, kind: 0.2, lambda: 0, randomize: "none" });
for (const lam of [0, 0.25, 0.5, 1]) show(`flushPays cap 10, λ ${lam}`, { rule: "flushPays", cap: 10, kind: 0.2, lambda: lam, randomize: "none" });
for (const lam of [0, 0.5]) show(`flushPts cap 10, λ ${lam}`, { rule: "flushPts", cap: 10, kind: 0.2, lambda: lam, randomize: "none" });
for (const cap of [10, 12, 14, 16]) show(`flushGate cap ${cap}`, { rule: "flushGate", cap, kind: 0.2, lambda: 0, randomize: "none" });
for (const cap of [10, 12, 14, 16]) show(`suitEq cap ${cap}`, { rule: "suitEq", cap, kind: 0.2, lambda: 0, randomize: "none" });

// Thesis test, part 2 (method as thesis.ts): gateAll (every two-tile submission one suit), flushOnly, and the "obvious" policy
// (take a flush when one is offered, otherwise every suit choice random) against the full greedy bot.
import { run, batch, mean, se, type Cfg } from "./lib.ts";
const N = 10000;
const show = (label: string, c: Cfg) => { const rs = batch(c, 3000); const R = rs.map((x) => x.rounds); const sub = R.reduce((a, b) => a + b, 0), cor = rs.reduce((a, x) => a + x.correct, 0), fr = rs.reduce((a, x) => a + x.fullRounds, 0), fc = rs.reduce((a, x) => a + x.fullCorrect, 0);
  console.log(`economy ${label.padEnd(26)} 3,000 runs: rounds ${mean(R).toFixed(1)} ± ${(1.96 * se(R)).toFixed(1)} | b_run ${(cor / sub).toFixed(3)} | b_full ${(fc / Math.max(1, fr)).toFixed(3)}`); };
for (const cap of [10, 11, 12, 13]) show(`gateAll cap ${cap}`, { rule: "gateAll", cap, kind: 0.2, lambda: 0, randomize: "none" });
show("flushOnly cap 11", { rule: "flushOnly", cap: 11, kind: 0.2, lambda: 1, randomize: "none" });
const variants: [string, Cfg, "rounds" | "points", string[]][] = [
  ["C′ gateAll, cap 12", { rule: "gateAll", cap: 12, kind: 0.2, lambda: 0, randomize: "none" }, "rounds", ["answer", "discard", "burn", "all", "digitDiscard"]],
  ["E flushOnly, cap 11", { rule: "flushOnly", cap: 11, kind: 0.2, lambda: 1, randomize: "none" }, "rounds", ["answer", "discard", "burn", "all", "obvious", "digitDiscard"]],
  ["A flushPays, cap 10", { rule: "flushPays", cap: 10, kind: 0.2, lambda: 0.5, randomize: "none" }, "rounds", ["obvious"]],
  ["B flushPts, cap 10", { rule: "flushPts", cap: 10, kind: 0.2, lambda: 0.5, randomize: "none" }, "points", ["obvious"]],
];
for (const [label, base, metric, rzs] of variants) {
  const b = Array.from({ length: N }, (_, s) => run(1000 + s, base)); const bm = b.map((x) => x[metric]);
  console.log(`\n${label} — ${N} paired seeds, metric ${metric}: baseline ${mean(bm).toFixed(2)}; per run: suit-distinct answer choices ${mean(b.map((x) => x.suitChoices)).toFixed(2)}, discards with a suit choice ${mean(b.map((x) => x.shedChoices.discard)).toFixed(2)}, burns with a suit choice ${mean(b.map((x) => x.shedChoices.burn)).toFixed(2)}`);
  for (const rz of rzs) { const d = b.map((x, s) => x[metric] - run(1000 + s, { ...base, randomize: rz as Cfg["randomize"] })[metric]);
    console.log(`  random ${rz.padEnd(12)} loss ${mean(d).toFixed(2)} ± ${(1.96 * se(d)).toFixed(2)} (${((100 * mean(d)) / mean(bm)).toFixed(1)}% of baseline)`); }
}

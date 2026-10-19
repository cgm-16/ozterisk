// Thesis test (Factor's method): paired seeds; swap one suit-aware decision for a random suit choice, all else fixed.
// "Random suit" keeps the bot's digit choice and picks which suited copy uniformly (answer: uniform over legal suit patterns).
// Positive control: digitDiscard randomises the whole overflow discard (digit and suit). Bot greedy, skill 1, kind 0.2, cap 1,000 rounds.
import { run, mean, se, type Cfg } from "./lib.ts";
const N = 10000;
const variants: [string, Cfg, "rounds" | "points"][] = [
  ["Endless (suits cosmetic), cap 10", { rule: "none", cap: 10, kind: 0.2, lambda: 0, randomize: "none" }, "rounds"],
  ["A flushPays (+1 tile), cap 10", { rule: "flushPays", cap: 10, kind: 0.2, lambda: 0.5, randomize: "none" }, "rounds"],
  ["B flushPts (+1 point), cap 10", { rule: "flushPts", cap: 10, kind: 0.2, lambda: 0.5, randomize: "none" }, "points"],
  ["C flushGate, cap 12", { rule: "flushGate", cap: 12, kind: 0.2, lambda: 0, randomize: "none" }, "rounds"],
  ["D suitEq, cap 12", { rule: "suitEq", cap: 12, kind: 0.2, lambda: 0, randomize: "none" }, "rounds"],
];
for (const [label, base, metric] of variants) {
  const b = Array.from({ length: N }, (_, s) => run(1000 + s, base));
  const bm = b.map((x) => x[metric]);
  const per = (k: "suitChoices") => mean(b.map((x) => x[k]));
  console.log(`\n${label} — ${N} paired seeds, metric ${metric}: baseline ${mean(bm).toFixed(2)}; per run: ${mean(b.map((x) => x.rounds)).toFixed(1)} rounds, suit-distinct answer choices ${per("suitChoices").toFixed(2)}, discards with a suit choice ${mean(b.map((x) => x.shedChoices.discard)).toFixed(2)}, burns with a suit choice ${mean(b.map((x) => x.shedChoices.burn)).toFixed(2)}`);
  for (const rz of ["answer", "discard", "burn", "all", "digitDiscard"] as const) {
    const d = b.map((x, s) => x[metric] - run(1000 + s, { ...base, randomize: rz })[metric]);
    console.log(`  random ${rz.padEnd(12)} loss ${mean(d).toFixed(2)} ± ${(1.96 * se(d)).toFixed(2)} (${((100 * mean(d)) / mean(bm)).toFixed(1)}% of baseline)`);
  }
}

// Realised drift (mean tile change per submission, after rewards and any discard) by hand size at the start of the round,
// plus s = share of correct answers that net +1 or more. Instrument: lib.ts loop, greedy bot, skill 1, kind 0.2, 4,000 runs per variant.
import { run, type Cfg } from "./lib.ts";
const vs: [string, Cfg][] = [
  ["Endless, cap 10", { rule: "none", cap: 10, kind: 0.2, lambda: 0, randomize: "none" }],
  ["Endless, cap 11", { rule: "none", cap: 11, kind: 0.2, lambda: 0, randomize: "none" }],
  ["A flushPays, cap 10", { rule: "flushPays", cap: 10, kind: 0.2, lambda: 0.5, randomize: "none" }],
  ["E flushOnly, cap 11", { rule: "flushOnly", cap: 11, kind: 0.2, lambda: 1, randomize: "none" }],
  ["E flushOnly, cap 12", { rule: "flushOnly", cap: 12, kind: 0.2, lambda: 1, randomize: "none" }],
  ["C′ gateAll, cap 12", { rule: "gateAll", cap: 12, kind: 0.2, lambda: 0, randomize: "none" }],
];
for (const [label, c] of vs) {
  const drift = new Map<number, [number, number]>(); let cor = 0, one = 0, fl = 0, sub = 0;
  for (let s = 0; s < 4000; s++) { const o = run(1000 + s, { ...c, drift }); cor += o.correct; one += o.oneDigit; fl += o.flushes; sub += o.rounds; }
  const at = (n: number) => { const e = drift.get(n); return e ? `${(e[0] / e[1]).toFixed(3)} (n=${e[1]})` : "—"; };
  const sP = c.rule === "flushOnly" ? (one + fl) / cor : 1; const fA = c.rule === "flushPays" ? fl / cor : 0;
  console.log(`${label.padEnd(22)} drift at full rack ${at(c.cap)} | one below ${at(c.cap - 1)} | two below ${at(c.cap - 2)} | b_run ${(cor / sub).toFixed(3)} | s (correct answers netting ≥ +1) ${sP.toFixed(3)}${fA ? ` | flush share f ${fA.toFixed(3)}` : ""}`);
}
console.log("Analytic cliffs with miss cost m = 1.711 (uniform) / 1.806 (full hand): Endless 0.631 / 0.644; flushOnly b* = m/(s+m); flushPays b* = m/(1+f+m).");

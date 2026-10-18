// Variant E ("only a flush pays": a mixed-suit two-digit correct answer returns N tiles, net 0) and the socket yardstick.
// Instrument as cliff.ts: lib.ts loop, greedy bot, skill 1, kind 0.2, 3,000 runs per row, cap 1,000 rounds.
import { batch, mean, se, type Cfg } from "./lib.ts";
const show = (label: string, c: Cfg) => {
  const rs = batch(c, 3000); const R = rs.map((x) => x.rounds);
  const sub = R.reduce((a, b) => a + b, 0), cor = rs.reduce((a, x) => a + x.correct, 0);
  const fr = rs.reduce((a, x) => a + x.fullRounds, 0), fc = rs.reduce((a, x) => a + x.fullCorrect, 0), fl = rs.reduce((a, x) => a + x.flushes, 0);
  console.log(`${label.padEnd(30)} rounds ${mean(R).toFixed(1)} ± ${(1.96 * se(R)).toFixed(1)} | b_run ${(cor / sub).toFixed(3)} | b_full ${(fc / Math.max(1, fr)).toFixed(3)} | flush share of correct ${(fl / Math.max(1, cor)).toFixed(3)} | capped ${rs.filter((x) => x.rounds >= 1000).length}`);
};
for (const cap of [10, 11, 12, 13]) show(`Endless (none), cap ${cap}`, { rule: "none", cap, kind: 0.2, lambda: 0, randomize: "none" });
for (const cap of [10, 12, 14]) for (const lam of [0.5, 1, 2]) show(`E flushOnly cap ${cap}, λ ${lam}`, { rule: "flushOnly", cap, kind: 0.2, lambda: lam, randomize: "none" });

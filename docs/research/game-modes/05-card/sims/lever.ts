import { runEngine } from "./engine.ts";
import { ci, pct } from "./common.ts";
const RUNS = 4000;
console.log(`== instrument: engine.ts, fixed 15, deal of 45, aware bot, skill 0.95, ${RUNS} runs (seeds 100000+)`);
for (const kindRate of [0, 0.1, 0.2, 0.3, 0.4]) {
  const rs = Array.from({ length: RUNS }, (_, s) => runEngine({ deal: "deck", kindRate, policy: "aware", skill: 0.95, capacity: () => 15, horizon: 45 }, 100000 + s));
  const w = rs.filter((r) => r.win);
  const sub = rs.reduce((t, r) => t + r.submitted, 0), b = rs.reduce((t, r) => t + r.buildableRounds, 0);
  const late1 = w.reduce((t, r) => t + r.byPos.slice(36).filter((p) => p.len === 1).length, 0) / w.length;
  const lateLen = w.reduce((t, r) => t + r.byPos.slice(36).reduce((s, p) => s + p.len, 0), 0) / (w.length * 9);
  console.log(`k${kindRate}: win ${pct(w.length, RUNS)} ±${ci(w.length, RUNS)} | eff b ${(b / sub).toFixed(3)} | won runs: 1-digit facts in last 9 = ${late1.toFixed(2)} (uniform 2.60), mean answer length there ${lateLen.toFixed(3)} (uniform 1.711)`);
}

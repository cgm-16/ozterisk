// Recommended chassis at large N: fixed 15-socket tray, kind 0.2, deal of 45.
import { runEngine, type EngineConfig } from "./engine.ts";
import { FACTS, TABLES, ci, pct, summarize } from "./common.ts";

const RUNS = 20000;
const base: Omit<EngineConfig, "policy"> = { deal: "deck", kindRate: 0.2, skill: 0.95, capacity: () => 15, horizon: 45 };
console.log(`== instrument: engine.ts, fixed 15, k0.2, deal of 45, skill 0.95, ${RUNS} runs/policy on the same seeds (100000+)`);
const results: Record<string, ReturnType<typeof runEngine>[]> = {};
for (const policy of ["aware", "blind", "scrambled", "naive"] as const) {
  const rs = Array.from({ length: RUNS }, (_, s) => runEngine({ ...base, policy }, 100000 + s));
  results[policy] = rs;
  const w = rs.filter((r) => r.win).length;
  const lateLoss = rs.filter((r) => !r.win && r.submitted >= 36).length;
  const winners = rs.filter((r) => r.win);
  console.log(`${policy.padEnd(10)} win ${pct(w, RUNS)} ±${ci(w, RUNS)} | stamps ${summarize(rs.map((r) => r.distinct))} | stamps|win ${summarize(winners.map((r) => r.distinct))} | sub ${summarize(rs.map((r) => r.submitted))} | lost in last 9 facts ${pct(lateLoss, RUNS)} | tbl>=1 ${pct(rs.filter((r) => r.tables > 0).length, RUNS)} | tables|win ${(winners.reduce((t, r) => t + r.tables, 0) / winners.length).toFixed(2)}`);
}
// Paired difference, aware - blind, on identical seeds.
const a = results.aware, b = results.blind;
const d = a.map((r, i) => (r.win ? 1 : 0) - (b[i].win ? 1 : 0));
const mean = d.reduce((t, x) => t + x, 0) / RUNS;
const sd = Math.sqrt(d.reduce((t, x) => t + (x - mean) ** 2, 0) / (RUNS - 1));
console.log(`paired win difference aware - blind: ${(100 * mean).toFixed(2)} pts ±${(196 * sd / Math.sqrt(RUNS)).toFixed(2)}`);
const ds = a.map((r, i) => r.distinct - b[i].distinct);
const ms = ds.reduce((t, x) => t + x, 0) / RUNS;
const ss = Math.sqrt(ds.reduce((t, x) => t + (x - ms) ** 2, 0) / (RUNS - 1));
console.log(`paired stamp difference aware - blind: ${ms.toFixed(2)} ±${(1.96 * ss / Math.sqrt(RUNS)).toFixed(2)}`);

// Example cards for the share-grid graphic: a won card near the winners' median with
// exactly one table cleared, and a lost card. Printed as the triangle staircase.
const glyph = { stamp: "■", burn: "□", none: "·" } as const;
const show = (label: string, seed: number, r: ReturnType<typeof runEngine>) => {
  console.log(`${label} (seed ${seed}): stamps ${r.distinct}/45, dealt ${r.submitted}${r.win ? "" : "+1 terminal"}, win ${r.win}, tables ${TABLES.map((t, k) => (t.every((i) => r.card[i] === "stamp") ? k + 1 : null)).filter(Boolean).join(",") || "none"}`);
  for (let a1 = 1; a1 <= 9; a1++) console.log("  " + FACTS.filter((f) => f.a === a1).map((f) => glyph[r.card[f.i]]).join(""));
};
const winners = a.map((r, i) => ({ r, seed: 100000 + i })).filter(({ r }) => r.win);
const med = [...winners].sort((p, q) => p.r.distinct - q.r.distinct)[Math.floor(winners.length / 2)].r.distinct;
const ex = winners.find(({ r }) => r.distinct === med && r.tables === 1)!;
show("WON example", ex.seed, ex.r);
const lost = a.map((r, i) => ({ r, seed: 100000 + i })).find(({ r }) => !r.win && r.submitted === 38)!;
show("LOST example", lost.seed, lost.r);

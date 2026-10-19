import { runEngine, type EngineConfig, type EngineResult } from "./engine.ts";
import { BOXES, TABLES, ci, pct, summarize } from "./common.ts";

const RUNS = Number(process.env.RUNS ?? 4000);
const SKILL = 0.95;
const fixed = (c: number) => () => c;
const eng = (cfg: EngineConfig) => Array.from({ length: RUNS }, (_, s) => runEngine(cfg, 100000 + s));
function report(label: string, rs: EngineResult[]) {
  const sub = rs.reduce((t, r) => t + r.submitted, 0);
  const bld = rs.reduce((t, r) => t + r.buildableRounds, 0);
  const wins = rs.filter((r) => r.win).length;
  const paid = rs.reduce((t, r) => t + r.rewardsPaid, 0) / rs.length;
  const t1 = rs.filter((r) => r.tables >= 1).length;
  const b1 = rs.filter((r) => r.boxes >= 1).length;
  const perfect = rs.filter((r) => r.distinct === 45).length;
  console.log(`${label.padEnd(36)} sub ${summarize(rs.map((r) => r.submitted))} | stamps ${summarize(rs.map((r) => r.distinct))} | eff b ${(bld / sub).toFixed(3)} | win ${pct(wins, rs.length)} ±${ci(wins, rs.length)} | tbl>=1 ${pct(t1, rs.length)} | box>=1 ${pct(b1, rs.length)} | perfect ${perfect} | paid/run ${paid.toFixed(2)}`);
  return rs;
}
const section = process.env.SECTION ?? "all";
console.log(`== instrument: engine.ts, deal without replacement, horizon 45, ${RUNS} runs/config (seeds 100000+), skill ${SKILL}`);

if (section === "all" || section === "cap") {
  console.log("-- fixed-capacity sweep (aware | blind)");
  for (const c of [14, 15, 16, 17])
    for (const kindRate of [0, 0.2])
      for (const policy of ["aware", "blind"] as const)
        report(`fixed ${c} k${kindRate} ${policy}`, eng({ deal: "deck", kindRate, policy, skill: SKILL, capacity: fixed(c), horizon: 45 }));
}
if (section === "all" || section === "lines") {
  console.log("-- line rewards on fixed 15, k0.2, aware: what a completed table / box pays");
  for (const [ln, lines] of [["tables", TABLES], ["boxes", BOXES]] as const)
    for (const lineReward of ["none", "socket", "wild", "tile"] as const)
      report(`fixed 15 k0.2 ${ln} pays ${lineReward}`, eng({ deal: "deck", kindRate: 0.2, policy: "aware", skill: SKILL, capacity: fixed(15), horizon: 45, lineReward, lines }));
  console.log("-- the same rewards with replacement (Endless capacity 10, k0.2, unlimited rounds, blind): does anything ever pay?");
  for (const lineReward of ["none", "socket"] as const)
    report(`replace cap10 tables pays ${lineReward}`, eng({ deal: "replace", kindRate: 0.2, policy: "blind", skill: SKILL, capacity: fixed(10), horizon: Infinity, lineReward }));
}
if (section === "all" || section === "pos") {
  console.log("-- kind-bias escalation: answer length and buildable share by deal position (fixed 15, aware)");
  for (const kindRate of [0, 0.2]) {
    const rs = eng({ deal: "deck", kindRate, policy: "aware", skill: SKILL, capacity: fixed(15), horizon: 45 });
    const bins = [[1, 9], [10, 18], [19, 27], [28, 36], [37, 45]];
    const row = bins.map(([lo, hi]) => {
      let n = 0, len = 0, bld = 0;
      for (const r of rs) r.byPos.forEach((p, i) => { if (i + 1 >= lo && i + 1 <= hi) { n++; len += p.len; bld += p.buildable ? 1 : 0; } });
      return `${lo}-${hi}: len ${(len / n).toFixed(2)} bld ${(bld / n).toFixed(2)} (n ${n})`;
    });
    console.log(`k${kindRate}  ${row.join(" | ")}`);
  }
  // Composition only, no survivorship: one-digit facts among the last 9 dealt in WON runs.
  for (const kindRate of [0, 0.2]) {
    const rs = eng({ deal: "deck", kindRate, policy: "aware", skill: SKILL, capacity: fixed(15), horizon: 45 }).filter((r) => r.win);
    const late = rs.reduce((t, r) => t + r.byPos.slice(36).filter((p) => p.len === 1).length, 0) / rs.length;
    console.log(`k${kindRate}  won runs ${rs.length}: one-digit facts among the last 9 dealt = ${late.toFixed(2)} (uniform expectation 9*13/45 = 2.60)`);
  }
}

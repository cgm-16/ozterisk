// Real reducer, Classic mode (20>5 every 2), digit-only rewards = journal T84's "flat 0.00" row.
import { runOne } from "./harness.ts";
import { ci, pct, summarize } from "./common.ts";
const RUNS = 4000;
for (const policy of ["naive", "blind"] as const) {
  const rs = Array.from({ length: RUNS }, (_, s) => runOne({ deal: "replace", kindRate: 0.2, policy, skill: 0.95, mode: "classic" }, s + 1));
  const w = rs.filter((r) => r.win).length;
  const sub = rs.reduce((t, r) => t + r.submitted, 0), b = rs.reduce((t, r) => t + r.buildableRounds, 0);
  console.log(`REAL Classic 20>5/2 replace k0.2 ${policy}: sub ${summarize(rs.map((r) => r.submitted))} | stamps ${summarize(rs.map((r) => r.distinct))} | eff b ${(b / sub).toFixed(3)} | win ${pct(w, RUNS)} ±${ci(w, RUNS)} | tbl>=1 ${pct(rs.filter((r) => r.tables > 0).length, RUNS)}`);
}

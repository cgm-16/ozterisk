// Table A: with replacement (shipped draw), real gameReducer, 4,000 runs per row, seeds 1..4000.
import { runOne, type Config } from "./harness.ts";
import { pct, summarize } from "./common.ts";
const N = 4000;
const rows: Array<[string, Config]> = [
  ["Endless, shipped draw, blind bot", { deal: "replace", kindRate: 0.2, policy: "blind", skill: 0.95 }],
  ["Classic schedule, no faces, blind bot", { deal: "replace", kindRate: 0.2, policy: "blind", skill: 0.95, mode: "classic" }],
  ["Endless, deal of 45, aware bot", { deal: "deck", kindRate: 0.2, policy: "aware", skill: 0.95 }],
];
for (const [label, cfg] of rows) {
  const rs = Array.from({ length: N }, (_, s) => runOne(cfg, s + 1));
  const m = (f: (r: (typeof rs)[number]) => number) => (rs.reduce((t, r) => t + f(r), 0) / N).toFixed(1);
  console.log(`${label}: submitted ${m((r) => r.submitted)} | correct ${m((r) => r.correct)} | distinct ${summarize(rs.map((r) => r.distinct))} | >=1 table ${pct(rs.filter((r) => r.tables > 0).length, N)} | >=1 box ${pct(rs.filter((r) => r.boxes > 0).length, N)} | full card ${rs.filter((r) => r.distinct === 45).length} | win ${pct(rs.filter((r) => r.win).length, N)}`);
}

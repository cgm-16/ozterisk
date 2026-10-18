// Driver: every config plays RUNS runs on seeds 1..RUNS of the real reducer.
import { runOne, type Config, type RunResult } from "./harness.ts";
import { ci, pct, summarize } from "./common.ts";

const RUNS = Number(process.env.RUNS ?? 3000);

function play(cfg: Config): RunResult[] {
  return Array.from({ length: RUNS }, (_, s) => runOne(cfg, s + 1));
}
function report(label: string, rs: RunResult[]) {
  const sub = rs.reduce((t, r) => t + r.submitted, 0);
  const bld = rs.reduce((t, r) => t + r.buildableRounds, 0);
  const wins = rs.filter((r) => r.win).length;
  const t1 = rs.filter((r) => r.tables >= 1).length;
  const b1 = rs.filter((r) => r.boxes >= 1).length;
  console.log(
    `${label.padEnd(34)} submitted ${summarize(rs.map((r) => r.submitted))} | correct ${summarize(rs.map((r) => r.correct))} | distinct ${summarize(rs.map((r) => r.distinct))} | eff b ${(bld / sub).toFixed(3)} | win ${pct(wins, rs.length)} ±${ci(wins, rs.length)} | >=1 table ${pct(t1, rs.length)} | >=1 box ${pct(b1, rs.length)}`,
  );
  return rs;
}
const t0 = Date.now();
const SKILL = 0.95;

console.log(`== instrument: real gameReducer (Endless, capacity 10), ${RUNS} runs/config, seeds 1..${RUNS}, skill ${SKILL}`);
console.log("-- calibration and controls");
report("replace k0.2 REAL gen, naive", play({ deal: "replace", kindRate: 0.2, policy: "naive", skill: SKILL }));
report("replace k0.2 own gen (0.2000001)", play({ deal: "replace", kindRate: 0.2000001, policy: "naive", skill: SKILL }));
report("replace k0 naive skill 1", play({ deal: "replace", kindRate: 0, policy: "naive", skill: 1 }));
report("NEG replace alwaysMiss", play({ deal: "replace", kindRate: 0.2, policy: "alwaysMiss", skill: SKILL }));
report("NEG deck alwaysMiss", play({ deal: "deck", kindRate: 0.2, policy: "alwaysMiss", skill: SKILL }));

console.log("-- with replacement (shipped Endless draw): the card as a record");
for (const policy of ["naive", "blind", "aware", "scrambled"] as const)
  report(`replace k0.2 ${policy}`, play({ deal: "replace", kindRate: 0.2, policy, skill: SKILL }));

console.log("-- deal without replacement, 45-fact horizon");
for (const kindRate of [0, 0.2])
  for (const policy of ["naive", "blind", "aware", "scrambled"] as const)
    report(`deck k${kindRate} ${policy}`, play({ deal: "deck", kindRate, policy, skill: SKILL }));
console.log(`(${((Date.now() - t0) / 1000).toFixed(1)}s)`);

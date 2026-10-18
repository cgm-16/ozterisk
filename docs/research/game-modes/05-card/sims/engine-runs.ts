import { runEngine, type EngineConfig, type EngineResult } from "./engine.ts";
import { runOne } from "./harness.ts";
import { ci, pct, summarize } from "./common.ts";

const RUNS = Number(process.env.RUNS ?? 3000);
const SKILL = 0.95;
const fixed = (c: number) => () => c;
const descent = (start: number, floor: number, every: number) => (n: number) => Math.max(floor, start - Math.floor(n / every));

type Row = Pick<EngineResult, "submitted" | "correct" | "distinct" | "win" | "buildableRounds" | "tables" | "boxes"> & { rewardsPaid?: number };
function report(label: string, rs: Row[]) {
  const sub = rs.reduce((t, r) => t + r.submitted, 0);
  const bld = rs.reduce((t, r) => t + r.buildableRounds, 0);
  const wins = rs.filter((r) => r.win).length;
  const t1 = rs.filter((r) => r.tables >= 1).length;
  const b1 = rs.filter((r) => r.boxes >= 1).length;
  const paid = rs.reduce((t, r) => t + (r.rewardsPaid ?? 0), 0) / rs.length;
  console.log(
    `${label.padEnd(40)} sub ${summarize(rs.map((r) => r.submitted))} | stamps ${summarize(rs.map((r) => r.distinct))} | eff b ${(bld / sub).toFixed(3)} | win ${pct(wins, rs.length)} ±${ci(wins, rs.length)} | tbl>=1 ${pct(t1, rs.length)} | box>=1 ${pct(b1, rs.length)} | paid/run ${paid.toFixed(2)}`,
  );
}
const eng = (cfg: EngineConfig) => Array.from({ length: RUNS }, (_, s) => runEngine(cfg, 100000 + s));
const real = (cfg: Parameters<typeof runOne>[0]) => Array.from({ length: RUNS }, (_, s) => runOne(cfg, s + 1));
const section = process.env.SECTION ?? "all";
console.log(`== instrument: engine.ts (digit counts) vs harness.ts (real gameReducer); ${RUNS} runs/config; bot skill ${SKILL}`);

if (section === "all" || section === "cal") {
  console.log("-- calibration: engine vs real reducer, same bot, Endless capacity 10");
  report("REAL replace k0.2 naive", real({ deal: "replace", kindRate: 0.2, policy: "naive", skill: SKILL }));
  report("ENG  replace k0.2 naive", eng({ deal: "replace", kindRate: 0.2, policy: "naive", skill: SKILL, capacity: fixed(10), horizon: Infinity }));
  report("REAL deck k0.2 aware", real({ deal: "deck", kindRate: 0.2, policy: "aware", skill: SKILL }));
  report("ENG  deck k0.2 aware", eng({ deal: "deck", kindRate: 0.2, policy: "aware", skill: SKILL, capacity: fixed(10), horizon: 45 }));
  console.log("-- calibration vs journal T84 (real reducer, no faces, naive bot, skill 95%: 33.0% wins)");
  report("ENG  Classic 20>5/2 replace k0.2 naive", eng({ deal: "replace", kindRate: 0.2, policy: "naive", skill: SKILL, capacity: descent(20, 5, 2), horizon: 30 }));
  console.log("-- negative control: skill 0 must never win");
  report("ENG  NEG seal/3 deck skill 0", eng({ deal: "deck", kindRate: 0.2, policy: "aware", skill: 0, capacity: descent(20, 5, 3), horizon: 45 }));
}
if (section === "all" || section === "sweep") {
  console.log("-- chassis sweep, deal without replacement, horizon 45 (aware | blind | scrambled)");
  const chassis: Array<[string, (n: number) => number]> = [
    ["fixed 10", fixed(10)], ["fixed 11", fixed(11)], ["fixed 12", fixed(12)], ["fixed 13", fixed(13)], ["fixed 15", fixed(15)],
    ["descent 20>5 every 3", descent(20, 5, 3)], ["descent 20>10 every 4.5", descent(20, 10, 4.5)],
  ];
  for (const [name, capacity] of chassis)
    for (const kindRate of [0, 0.2])
      for (const policy of ["aware", "blind", "scrambled"] as const)
        report(`${name} k${kindRate} ${policy}`, eng({ deal: "deck", kindRate, policy, skill: SKILL, capacity, horizon: 45 }));
}

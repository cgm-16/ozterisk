// The showcase table (planted deal, seed 16641) and the no-0 negative control,
// solved and replayed on the real gameReducer at capacity 5.
import { makeSolver, mulberry32, plantedTable, type Table } from "./solver.ts";
import { replay } from "./replay.ts";
import { show } from "./find-sample.ts";
const t = plantedTable(mulberry32(16641), 5, 8, 0.6, true);
show(t, "showcase (seed 16641)");
const s = makeSolver(t), r = s.solve();
for (const [name, moves, expect] of [["par line", r.line.map((x) => x.move), r.par], ["myopic", s.myopic().moves, s.myopic().score], ["lookahead", s.lookahead().moves, s.lookahead().score]] as const) {
  const rr = replay(t, [...moves]);
  console.log(`[real reducer] ${name}: score ${rr.score} (solver ${expect}), ended ${rr.ended}, hands ${rr.hands.join(" ")}`);
}
// Answering row 1 (the natural move): best reachable score after it.
const first = s.options(0, s.root.hand, s.root.size, 0);
for (const o of first) if (o.move.kind === "correct") {
  const sub = makeSolver({ ...t, hand: o.hand.flatMap((c, d) => Array(c).fill(d)), eqs: t.eqs.slice(1), bounty: t.bounty!.slice(1) }).solve();
  console.log(`answer 15, discard ${o.move.discard}: best total ${1 + sub.par}`);
}
console.log(`row-1 options keeping par: ${r.line[0]!.optimal} of ${r.line[0]!.options}`);

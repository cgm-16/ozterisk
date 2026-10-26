// Picks the Puzzle prototype's Medium and Hard playtest tables (spec 2026-10-19 §6):
// the first in-band table per tier, walking mulberry32 seeds from 1.
import { makeSolver, mulberry32, plantedTable } from "./solver.ts";
const want = { medium: null as null | number, hard: null as null | number };
let inBand = 0, tried = 0;
for (let seed = 1; seed <= 20000 && (want.medium === null || want.hard === null); seed++) {
  tried++;
  const t = plantedTable(mulberry32(seed), 5, 8, 0.6, true);
  const s = makeSolver(t), r = s.solve();
  const my = s.myopic().score, la = s.lookahead().score;
  if (!(r.par >= 7 && my < r.par && r.onlyMoves >= 2)) continue;
  inBand++;
  if (r.sacrificeRequired) continue;
  const tier = la === r.par ? "medium" : "hard";
  if (tier === "medium" && r.onlyMoves !== 2) continue;
  if (want[tier] !== null) continue;
  want[tier] = seed;
  console.log(`${tier} seed ${seed}: hand [${t.hand.join(" ")}] par ${r.par} only-moves ${r.onlyMoves} myopic ${my} lookahead ${la} sacrifice ${r.sacrificeRequired}`);
  t.eqs.forEach(([a, b], k) => console.log(`  row ${k + 1}: ${a} x ${b} = ${a * b}  pays [${t.bounty![k]!.join(" ")}]`));
  console.log(`  par line: ${r.line.map((x) => x.move.kind === "correct" ? `ok${x.move.discard === null ? "" : `/d${x.move.discard}`}` : `miss ${x.move.spend.join("+")}`).join(" | ")}`);
}
console.log(`tried ${tried}, in band ${inBand}`);

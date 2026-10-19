// Search planted deals (cap 5, distinct hand, q 0.6, model P) for a showcase table.
import { makeSolver, mulberry32, plantedTable, type Move, type Table } from "./solver.ts";
const K = Number(process.env.K ?? "8");
const fmt = (m: Move) => m.kind === "correct" ? `correct${m.discard === null ? "" : `, discard ${m.discard}`}` : `MISS spending ${m.spend.join("+")}`;
const handStr = (h: number[]) => h.flatMap((c, d) => Array(c).fill(d)).join(" ");
export function show(t: Table, label: string) {
  const s = makeSolver(t), r = s.solve(), my = s.myopic(), la = s.lookahead();
  console.log(`\n=== ${label}: hand [${t.hand.join(" ")}] cap ${t.cap}`);
  t.eqs.forEach(([a, b], k) => console.log(`  row ${k + 1}: ${a} x ${b} = ${a * b}  pays [${t.bounty![k]!.join(" ")}]`));
  console.log(`  par ${r.par}/${K}  histogram(score 0..K) ${r.histogram.join(",")}  lines ${r.lines}  par lines ${r.parLines}  only-moves ${r.onlyMoves}/${r.decisions} decisions  sacrifice required ${r.sacrificeRequired}  states ${r.states}`);
  r.line.forEach((x) => console.log(`  par line row ${x.k + 1}: ${fmt(x.move)}  (options ${x.options}, keep-par ${x.optimal})  -> hand ${handStr(x.hand)}`));
  console.log(`  myopic ${my.score}: ${my.moves.map(fmt).join(" | ")}`);
  console.log(`  lookahead ${la.score}: ${la.moves.map(fmt).join(" | ")}`);
}
if (process.env.SEARCH) {
  const hits: { seed: number; score: number }[] = [];
  for (let seed = 1; seed <= 20000; seed++) {
    const t = plantedTable(mulberry32(seed), 5, K, 0.6, true);
    const s = makeSolver(t), r = s.solve();
    if (r.par < K - 1 || r.onlyMoves < 3) continue;
    const my = s.myopic().score, la = s.lookahead().score;
    if (my >= r.par || la >= r.par) continue;
    hits.push({ seed, score: (r.sacrificeRequired ? 100 : 0) + r.onlyMoves * 10 - Math.log10(r.parLines) });
  }
  hits.sort((a, b) => b.score - a.score);
  console.log(`hard tables with >=3 only-moves among 20,000 seeds: ${hits.length}; top seeds ${hits.slice(0, 8).map((h) => h.seed).join(",")}`);
  for (const h of hits.slice(0, Number(process.env.SHOW ?? "3"))) show(plantedTable(mulberry32(h.seed), 5, K, 0.6, true), `seed ${h.seed}`);
}

// Planted generator grid (model P). Same band and tiers as grid.ts.
import { makeSolver, mulberry32, plantedTable } from "./solver.ts";
const N = Number(process.env.N ?? "2000");
const med = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]!; };
const pct = (x: number) => `${(100 * x).toFixed(1)}%`;
console.log(`N=${N} tables per cell, seed 11, model P, planted-line deal`);
console.log("hand q cap K | foresight-b myopic-b lookahead-b | clearable accepted | Medium Hard sac-req | onlyMoves(med acc) lines(med acc) parLines(med acc) | ms/table(med) ms/accepted");
for (const distinct of [false, true]) for (const q of [0.6, 1.0]) for (const cap of [5, 6]) for (const K of [6, 8]) {
  const rnd = mulberry32(11);
  let fb = 0, mb = 0, lb = 0, clear = 0, acc = 0, medium = 0, hard = 0, sac = 0, totalMs = 0;
  const ms: number[] = [], om: number[] = [], ln: number[] = [], pl: number[] = [];
  for (let i = 0; i < N; i++) {
    const t = plantedTable(rnd, cap, K, q, distinct);
    const t0 = performance.now();
    const s = makeSolver(t);
    const r = s.solve();
    const my = s.myopic().score, la = s.lookahead().score;
    const dt = performance.now() - t0;
    ms.push(dt); totalMs += dt;
    fb += r.par / K; mb += my / K; lb += la / K;
    if (r.par === K) clear++;
    if (r.par >= K - 1 && my < r.par && r.onlyMoves >= 2) {
      acc++; om.push(r.onlyMoves); ln.push(r.lines); pl.push(r.parLines);
      if (la === r.par) medium++; else hard++;
      if (r.sacrificeRequired) sac++;
    }
  }
  console.log(`${distinct ? "distinct" : "uniform "} ${q} ${cap} ${K} | ${(fb / N).toFixed(3)} ${(mb / N).toFixed(3)} ${(lb / N).toFixed(3)} | ${pct(clear / N)} ${pct(acc / N)} | ${acc ? pct(medium / acc) : "-"} ${acc ? pct(hard / acc) : "-"} ${acc ? pct(sac / acc) : "-"} | ${acc ? med(om) : "-"} ${acc ? med(ln) : "-"} ${acc ? med(pl) : "-"} | ${med(ms).toFixed(2)} ${acc ? (totalMs / acc).toFixed(1) : "-"}`);
}

// Generator grid: uniform random tables, solved exhaustively.
// Band (pre-registered): par >= K-1, myopic < par, >= 2 only-moves on the canonical par line.
// Tier: Medium if the lookahead bot makes par, Hard if not.
import { makeSolver, mulberry32, randomTable, type Model } from "./solver.ts";

const N = Number(process.env.N ?? "2000");
const med = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]!; };
const pct = (x: number) => `${(100 * x).toFixed(1)}%`;
console.log(`N=${N} tables per cell, seed 7, full opening hand of uniform digits, uniform pairs, uniform rewards`);
console.log("model cap K | foresight-b myopic-b lookahead-b | clearable accepted | Medium Hard sacrifice-req | ms/table(med) states(med) ms/accepted");
for (const model of ["P", "W"] as Model[]) for (const cap of [5, 6]) for (const K of [6, 8]) {
  const rnd = mulberry32(7);
  let fb = 0, mb = 0, lb = 0, clear = 0, acc = 0, medium = 0, hard = 0, sac = 0, totalMs = 0;
  const ms: number[] = [], states: number[] = [];
  for (let i = 0; i < N; i++) {
    const t = randomTable(rnd, model, cap, K);
    const t0 = performance.now();
    const s = makeSolver(t);
    const r = s.solve();
    const my = s.myopic().score, la = s.lookahead().score;
    const dt = performance.now() - t0;
    ms.push(dt); totalMs += dt; states.push(r.states);
    fb += r.par / K; mb += my / K; lb += la / K;
    if (r.par === K) clear++;
    if (r.par >= K - 1 && my < r.par && r.onlyMoves >= 2) {
      acc++;
      if (la === r.par) medium++; else hard++;
      if (r.sacrificeRequired) sac++;
    }
  }
  console.log(`${model} ${cap} ${K} | ${(fb / N).toFixed(3)} ${(mb / N).toFixed(3)} ${(lb / N).toFixed(3)} | ${pct(clear / N)} ${pct(acc / N)} | ${acc ? pct(medium / acc) : "-"} ${acc ? pct(hard / acc) : "-"} ${acc ? pct(sac / acc) : "-"} | ${med(ms).toFixed(2)} ${med(states)} ${acc ? (totalMs / acc).toFixed(0) : "-"}`);
}

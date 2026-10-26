// Failure gradient for Puzzle: how much one mistake costs. Research only.
// Describes 3ccd37b. M10 removes playtestTables.ts and M8's band dials, so after its build re-run from `git archive 3ccd37b`.
// usage: SEED=1 node docs/research/game-modes/_runner/run.mjs docs/research/game-modes/03-puzzle/sims/failure-gradient.ts (SEED, N env vars for the live deals)
import { makeSolver, mulberry32, plantedTable, type Table } from "./solver.ts";
import { PLAYTEST_TABLES } from "../../../../../src/game/playtestTables.ts";
import { dealPuzzle, solvePuzzle } from "../../../../../src/game/puzzle.ts";

type Rule = "ship" | "skip";
type Kind = "discard" | "spend" | "missed" | "answered";
interface Dev { row: number; kind: Kind; cost: number; doomed: boolean; bestDies: boolean }

const fail = (msg: string): never => { throw new Error(`CALIBRATION FAILED: ${msg}`); };
const eq = (a: unknown, b: unknown, msg: string) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${msg}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`); };

// Lines counted by (score, end), end = the row index the line stopped at (K = completed all rows).
// "skip" rule: a row the hand is too small for (0 < size < len) scores 0 and play moves on; 0 tiles ends.
function analyze(t: Table, rule: Rule) {
  const s = makeSolver(t), K = s.K, W = K + 1;
  const opts = (k: number, hand: number[], size: number) =>
    rule === "skip" && k < K && size > 0 && size < s.info[k]!.len
      ? [{ move: { kind: "skip" as const }, gain: 0, k: k + 1, hand, size, ptr: 0 }]
      : s.options(k, hand, size, 0);
  const memo = new Map<string, Float64Array>();
  const M = (k: number, hand: number[], size: number): Float64Array => {
    const id = `${k}|${hand.join()}`;
    const hit = memo.get(id);
    if (hit) return hit;
    const out = new Float64Array(W * W), os = opts(k, hand, size);
    if (os.length === 0) out[k] = 1;
    for (const o of os) {
      const sub = M(o.k, o.hand, o.size);
      for (let sc = 0; sc + o.gain <= K; sc++) for (let e = 0; e <= K; e++) out[(sc + o.gain) * W + e] += sub[sc * W + e]!;
    }
    memo.set(id, out);
    return out;
  };
  const best = (m: Float64Array) => { for (let sc = K; sc >= 0; sc--) for (let e = 0; e <= K; e++) if (m[sc * W + e]! > 0) return sc; return 0; };
  const completes = (m: Float64Array, sc?: number) => { for (let x = 0; x <= K; x++) if ((sc === undefined || x === sc) && m[x * W + K]! > 0) return true; return false; };

  const rootM = M(0, s.root.hand, s.root.size), par = best(rootM);
  const hist = Array.from({ length: W }, (_, sc) => { let n = 0; for (let e = 0; e <= K; e++) n += rootM[sc * W + e]!; return n; });
  const lines = hist.reduce((a, b) => a + b, 0);
  let early = 0;
  for (let sc = 0; sc <= K; sc++) for (let e = 0; e < K; e++) early += rootM[sc * W + e]!;
  // Off-par lines by end row (index e < K: could not attempt row e+1; K: completed).
  const offEnd = Array(W).fill(0);
  for (let sc = 0; sc < par; sc++) for (let e = 0; e <= K; e++) offEnd[e] += rootM[sc * W + e]!;

  // Canonical par line (first par-keeping option, solver enumeration order) and its one-deviation costs.
  const devs: Dev[] = [], line: { opts: number; keep: number; move: unknown }[] = [];
  let st = { k: 0, hand: s.root.hand, size: s.root.size }, need = par, sofar = 0;
  for (;;) {
    const os = opts(st.k, st.hand, st.size);
    if (os.length === 0) break;
    const val = os.map((o) => o.gain + best(M(o.k, o.hand, o.size)));
    const keep = os.filter((_, i) => val[i] === need);
    const keepCorrect = keep.some((o) => o.move.kind === "correct");
    os.forEach((o, i) => {
      if (val[i] === need) return;
      const sub = M(o.k, o.hand, o.size), b = best(sub);
      const kind: Kind = o.move.kind === "correct" ? (keepCorrect ? "discard" : "answered") : keepCorrect ? "missed" : "spend";
      devs.push({ row: st.k + 1, kind, cost: par - (sofar + val[i]!), doomed: !completes(sub), bestDies: !completes(sub, b) });
    });
    line.push({ opts: os.length, keep: keep.length, move: keep[0]!.move });
    need -= keep[0]!.gain; sofar += keep[0]!.gain; st = keep[0]!;
  }
  return { s, par, hist, lines, early, offEnd, devs, line, K };
}

const fromLiteral = (p: (typeof PLAYTEST_TABLES)[number]): Table => ({
  model: "P", cap: 5, hand: [...p.hand], eqs: p.rows.map((r) => [r.equation.left, r.equation.right]), bounty: p.rows.map((r) => [...r.pay]),
});
const pct = (x: number) => `${(100 * x).toFixed(1)}%`;
const median = (xs: number[]) => { const a = [...xs].sort((x, y) => x - y), m = a.length >> 1; return a.length % 2 ? a[m]! : (a[m - 1]! + a[m]!) / 2; };
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

// ---------- Calibration ----------
console.log("== calibration");
const NAMES = ["Medium(seed 20)", "Hard(seed 18)", "Sample(seed 16641)"], SEEDS = [20, 18, 16641];
const literal = PLAYTEST_TABLES.map(fromLiteral);
literal.forEach((t, i) => {
  eq(plantedTable(mulberry32(SEEDS[i]!), 5, 8, 0.6, true), t, `literal ${NAMES[i]} vs plantedTable`);
  const a = analyze(t, "ship"), r = a.s.solve();
  eq(a.hist, r.histogram, `${NAMES[i]} (score,end) DP marginal vs solver histogram`);
  eq(a.par, PLAYTEST_TABLES[i]!.par, `${NAMES[i]} par vs literal`);
  eq(solvePuzzle({ hand: PLAYTEST_TABLES[i]!.hand, rows: PLAYTEST_TABLES[i]!.rows }).par, a.par, `${NAMES[i]} shipped solvePuzzle par`);
  const la = a.s.lookahead().score, my = a.s.myopic().score;
  console.log(`  ${NAMES[i]}: literal == plantedTable; par ${a.par}; lines ${r.lines}; par lines ${r.parLines}; onlyMoves ${r.onlyMoves}; sacrificeRequired ${r.sacrificeRequired}; myopic ${my}; lookahead ${la} -> tier ${la >= a.par ? "Medium" : "Hard"}; DP marginal == solver histogram`);
});
{
  const a = analyze(literal[2]!, "ship"), r = a.s.solve();
  eq([a.par, r.lines, r.parLines, r.sacrificeRequired, a.line[0]!.opts, a.line[0]!.keep, a.line[0]!.move], [7, 16893, 38, true, 14, 1, { kind: "miss", spend: [5, 7] }], "sample table");
  const answers = a.devs.filter((d) => d.row === 1 && d.kind === "answered").map((d) => 7 - d.cost);
  eq(answers, [6, 6, 6, 6], "sample row-1 answers best total");
  console.log(`  sample: par 7, 38/16893 lines, sacrifice 5+7 on row 1 is the 1 keeper of 14, answering 15 (4 discards) caps at 6: OK`);
}
{ // Unmemoized walk of every line must give the same score histogram, early-end count and off-par end rows.
  const naive = (t: Table, rule: Rule) => {
    const s = makeSolver(t), K = s.K, ends: [number, number][] = [];
    const walk = (k: number, hand: number[], size: number, sc: number) => {
      if (rule === "skip" && k < K && size > 0 && size < s.info[k]!.len) return walk(k + 1, hand, size, sc);
      const os = s.options(k, hand, size, 0);
      if (os.length === 0) { ends.push([sc, k]); return; }
      for (const o of os) walk(o.k, o.hand, o.size, sc + o.gain);
    };
    walk(0, s.root.hand, s.root.size, 0);
    const par = Math.max(...ends.map(([sc]) => sc));
    const hist = Array.from({ length: K + 1 }, (_, sc) => ends.filter(([x]) => x === sc).length);
    const offEnd = Array.from({ length: K + 1 }, (_, e) => ends.filter(([x, y]) => x < par && y === e).length);
    return { par, hist, early: ends.filter(([, e]) => e < K).length, offEnd };
  };
  for (const rule of ["ship", "skip"] as Rule[]) literal.forEach((t, i) => {
    const a = analyze(t, rule);
    eq(naive(t, rule), { par: a.par, hist: a.hist, early: a.early, offEnd: a.offEnd }, `${NAMES[i]} ${rule}: memo DP vs naive walk`);
  });
  console.log(`  memoized (score,end) DP == naive line walk on all 3 tables under both rules`);
}
{
  const ctl = (t: Table, rule: Rule) => analyze(t, rule).par;
  const ones: Table = { model: "P", cap: 5, hand: [1, 1, 1, 1, 1], eqs: Array(6).fill([7, 8]), bounty: Array(6).fill([0, 0, 0]) };
  const neg: Table = { model: "P", cap: 5, hand: [1, 2, 4, 6, 8], eqs: [[5, 8], [2, 3], [3, 4], [2, 4]], bounty: [[1, 2, 3], [1, 2], [6, 8, 9], [1, 3]] };
  const skipT: Table = { model: "P", cap: 5, hand: [1], eqs: [[2, 6], [1, 1]], bounty: [[0, 0, 0], [0, 0]] };
  eq([ctl(ones, "ship"), ctl(neg, "ship"), ctl(skipT, "ship"), ctl(skipT, "skip")], [0, 3, 0, 1], "negative controls");
  console.log(`  controls: five 1s vs 7x8 par 0; README 4-row control par 3; hand [1] rows 12,1: ship par 0, skip par 1: OK`);
}

// ---------- Live in-band deals ----------
const SEED = Number(process.env.SEED ?? "1"), N = Number(process.env.N ?? "300");
const rnd = mulberry32(SEED), live: Table[] = [];
let plants = 0, medium = 0;
const t0 = performance.now();
while (live.length < N) {
  const t = plantedTable(rnd, 5, 8, 0.6, true); plants++;
  const s = makeSolver(t), r = s.solve();
  if (r.par >= 7 && r.onlyMoves >= 2 && s.myopic().score < r.par) { live.push(t); if (s.lookahead().score >= r.par) medium++; }
}
console.log(`  live: seed ${SEED}, ${plants} plants -> ${N} in band (${pct(N / plants)}), Medium ${pct(medium / N)} / Hard ${pct(1 - medium / N)}, ${(performance.now() - t0).toFixed(0)} ms`);
{ // Shipped dealPuzzle on the same stream must deal the same tables.
  const r2 = mulberry32(SEED);
  let same = 0;
  for (const t of live) {
    const d = dealPuzzle(r2), sh = fromLiteral({ ...d, par: d.par });
    if (JSON.stringify(sh) === JSON.stringify(t)) same++;
  }
  console.log(`  shipped dealPuzzle on mulberry32(${SEED}): ${same}/${N} tables identical to research plant+band`);
  if (same !== N) fail("shipped deal diverges from research deal");
}

// ---------- Report ----------
function report(rule: Rule) {
  console.log(`\n== rule: ${rule === "ship" ? "SHIPPED (too few tiles ends the run)" : "COUNTERFACTUAL (unattemptable row scores 0, play continues; 0 tiles ends)"}`);
  const shipPars = literal.map((t) => analyze(t, "ship").par);
  const one = (label: string, t: Table, shipPar: number) => {
    const a = analyze(t, rule), K = a.K;
    const byDelta = [0, 1, 2, 3].map((d) => a.hist[a.par - d] ?? 0), rest = a.lines - byDelta.reduce((x, y) => x + y, 0);
    const off = a.offEnd.reduce((x: number, y: number) => x + y, 0);
    console.log(`${label}: par ${a.par}${rule === "skip" ? ` (shipped ${shipPar})` : ""}; lines ${a.lines}; par ${pct(byDelta[0]! / a.lines)} | -1 ${pct(byDelta[1]! / a.lines)} | -2 ${pct(byDelta[2]! / a.lines)} | -3 ${pct(byDelta[3]! / a.lines)} | <=-4 ${pct(rest / a.lines)}; end early ${pct(a.early / a.lines)}, complete ${pct(1 - a.early / a.lines)}`);
    console.log(`  [3] off-par lines (${off}) end: ${a.offEnd.map((n: number, e: number) => `${e < K ? `r${e + 1}` : "done"} ${pct(n / off)}`).join(", ")}`);
    const rows: string[] = [];
    for (let k = 1; k <= K; k++) {
      const ds = a.devs.filter((d) => d.row === k);
      const ln = a.line[k - 1];
      if (!ln) { rows.push(`r${k} -`); continue; }
      const costs = [...new Set(ds.map((d) => d.cost))].sort().map((c) => `${c}x${ds.filter((d) => d.cost === c).length}`).join(" ");
      rows.push(`r${k} ${ln.keep}/${ln.opts}${ds.length ? ` cost{${costs}}` : ""}${ds.some((d) => d.doomed) ? ` doom${ds.filter((d) => d.doomed).length}` : ""}${ds.some((d) => d.bestDies) ? ` bestdies${ds.filter((d) => d.bestDies).length}` : ""}`);
    }
    console.log(`  [2] keep/opts, cost{cost x n}: ${rows.join(" ; ")}`);
    const kinds = (["discard", "spend", "missed", "answered"] as Kind[]).map((k) => { const ds = a.devs.filter((d) => d.kind === k); return ds.length ? `${k} n${ds.length} mean ${mean(ds.map((d) => d.cost)).toFixed(2)} doom ${ds.filter((d) => d.doomed).length}` : null; }).filter(Boolean);
    console.log(`  [2] by kind: ${kinds.join("; ")}; all n${a.devs.length} mean ${mean(a.devs.map((d) => d.cost)).toFixed(2)} cost1 ${pct(a.devs.filter((d) => d.cost === 1).length / a.devs.length)} doom ${a.devs.filter((d) => d.doomed).length}`);
    console.log(`  [5] row 1: ${a.line[0]!.opts} options, ${a.line[0]!.keep} keep par (canonical row-1 move ${JSON.stringify(a.line[0]!.move)})`);
  };
  literal.forEach((t, i) => one(NAMES[i]!, t, shipPars[i]!));

  const as = live.map((t) => analyze(t, rule));
  const ship = rule === "skip" ? live.map((t) => analyze(t, "ship").par) : null;
  const parTally = (xs: number[]) => [...new Set(xs)].sort().map((p) => `${p}:${xs.filter((x) => x === p).length}`).join(" ");
  console.log(`LIVE n=${N}: par ${parTally(as.map((a) => a.par))}${ship ? `; par rose on ${as.filter((a, i) => a.par > ship[i]!).length}, by ${parTally(as.map((a, i) => a.par - ship[i]!))}` : ""}`);
  const frac = (f: (a: (typeof as)[number]) => number) => { const xs = as.map(f); return `${pct(median(xs))}/${pct(mean(xs))}`; };
  console.log(`  [1] median/mean of per-deal line share: par ${frac((a) => a.hist[a.par]! / a.lines)} | -1 ${frac((a) => a.hist[a.par - 1]! / a.lines)} | -2 ${frac((a) => a.hist[a.par - 2]! / a.lines)} | -3 ${frac((a) => a.hist[a.par - 3]! / a.lines)} | <=-4 ${frac((a) => a.hist.slice(0, a.par - 3).reduce((x, y) => x + y, 0) / a.lines)}; end early ${frac((a) => a.early / a.lines)}; lines median ${median(as.map((a) => a.lines))}`);
  const K = 8;
  const endShare = Array.from({ length: K + 1 }, (_, e) => mean(as.map((a) => a.offEnd[e] / a.offEnd.reduce((x: number, y: number) => x + y, 0))));
  console.log(`  [3] off-par end row, mean of per-deal shares: ${endShare.map((v, e) => `${e < K ? `r${e + 1}` : "done"} ${pct(v)}`).join(", ")}`);
  const devs = as.flatMap((a) => a.devs);
  const costHist = [1, 2, 3, 4].map((c) => `${c === 4 ? ">=4" : c}: ${pct(devs.filter((d) => (c === 4 ? d.cost >= 4 : d.cost === c)).length / devs.length)}`).join(", ");
  console.log(`  [2] pooled deviations n=${devs.length}: cost ${costHist}; doomed ${pct(devs.filter((d) => d.doomed).length / devs.length)}; max-score continuation dies ${pct(devs.filter((d) => d.bestDies).length / devs.length)}; per-deal mean cost median ${median(as.map((a) => mean(a.devs.map((d) => d.cost)))).toFixed(2)}`);
  console.log(`  [2] by kind: ${(["discard", "spend", "missed", "answered"] as Kind[]).map((k) => { const ds = devs.filter((d) => d.kind === k); return ds.length ? `${k} n${ds.length} mean ${mean(ds.map((d) => d.cost)).toFixed(2)} cost1 ${pct(ds.filter((d) => d.cost === 1).length / ds.length)} doom ${pct(ds.filter((d) => d.doomed).length / ds.length)}` : `${k} n0`; }).join("; ")}`);
  console.log(`  [2] mean cost by row: ${Array.from({ length: K }, (_, k) => { const ds = devs.filter((d) => d.row === k + 1); return `r${k + 1} ${ds.length ? mean(ds.map((d) => d.cost)).toFixed(2) : "-"} (n${ds.length})`; }).join(", ")}`);
  console.log(`  [2] doomed by row: ${Array.from({ length: K }, (_, k) => { const ds = devs.filter((d) => d.row === k + 1); return `r${k + 1} ${pct(ds.filter((d) => d.doomed).length / ds.length)}`; }).join(", ")}`);
  console.log(`  [2] discard-kind only, doomed by row: ${Array.from({ length: K }, (_, k) => { const ds = devs.filter((d) => d.row === k + 1 && d.kind === "discard"); return `r${k + 1} ${ds.length ? pct(ds.filter((d) => d.doomed).length / ds.length) : "-"}`; }).join(", ")}`);
  console.log(`  [2] discard-kind only, mean cost by row: ${Array.from({ length: K }, (_, k) => { const ds = devs.filter((d) => d.row === k + 1 && d.kind === "discard"); return `r${k + 1} ${ds.length ? mean(ds.map((d) => d.cost)).toFixed(2) : "-"} (n${ds.length})`; }).join(", ")}`);
  const r1o = as.map((a) => a.line[0]!.opts), r1k = as.map((a) => a.line[0]!.keep);
  console.log(`  [5] row 1 options median ${median(r1o)} mean ${mean(r1o).toFixed(1)}; keep-par median ${median(r1k)} mean ${mean(r1k).toFixed(2)}; only one keeps par on ${pct(r1k.filter((x) => x === 1).length / N)}; row-1 keeper is a miss on ${pct(as.filter((a) => (a.line[0]!.move as { kind: string }).kind === "miss").length / N)}`);
}
report("ship");
report("skip");

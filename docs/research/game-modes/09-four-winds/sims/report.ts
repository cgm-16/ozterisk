import { mulberry32, runOnce, type Config, type RunStats } from "./fw-lib.ts";

export const R = Number(process.env.RUNS ?? 3000);
export type Summary = { win: number; lostIn: number[]; b: number[]; drift: number[]; endHand: number[]; full: number[]; surv: number[]; faces: number };
export function summarize(cfg: Config, seed = 1000): Summary {
  const nW = cfg.winds.length, z = () => new Array(nW).fill(0);
  const s = { win: 0, lostIn: z(), draws: z(), bld: z(), subs: z(), dh: z(), endHand: z(), endN: z(), full: z(), faces: 0 };
  const survSum = new Array(cfg.subsPerWind).fill(0); let survN = 0;
  for (let i = 0; i < R; i++) {
    const r: RunStats = runOnce(cfg, mulberry32(seed + i));
    if (r.win) s.win++; else if (r.endWind < nW) s.lostIn[r.endWind]++;
    for (let w = 0; w < nW; w++) {
      s.draws[w] += r.draws[w]; s.bld[w] += r.buildable[w]; s.subs[w] += r.subs[w]; s.dh[w] += r.dHand[w]; s.full[w] += r.fullAtDraw[w];
      if (r.subs[w] === cfg.subsPerWind) { s.endHand[w] += r.endHand[w]; s.endN[w]++; }
    }
    for (const sv of r.survive) if (sv.length === cfg.subsPerWind) { sv.forEach((x, k) => (survSum[k] += x)); survN++; }
    s.faces += r.faces;
  }
  const pct = (x: number) => (100 * x) / R;
  return {
    win: pct(s.win), lostIn: s.lostIn.map(pct),
    b: s.bld.map((x, w) => x / Math.max(1, s.draws[w])), drift: s.dh.map((x, w) => x / Math.max(1, s.subs[w])),
    endHand: s.endHand.map((x, w) => x / Math.max(1, s.endN[w])), full: s.full.map((x, w) => x / Math.max(1, s.draws[w])),
    surv: survSum.map((x) => x / Math.max(1, survN)), faces: s.faces / R,
  };
}
const f = (xs: number[], d = 2) => xs.map((x) => x.toFixed(d)).join("/");
export function line(name: string, x: Summary) {
  return `${name.padEnd(30)} win ${x.win.toFixed(1).padStart(5)}% | lost E/S/W/N ${f(x.lostIn, 1)} | b' ${f(x.b)} | drift ${f(x.drift)} | end hand ${f(x.endHand, 1)} | at-cap ${f(x.full)} | faces ${x.faces.toFixed(1)}`;
}

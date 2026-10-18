// Coverage after each answer option for candidate mockup hands (pair draw, 45 facts).
import { drawEntries, factorOptions, type Counts } from "./model.ts";
const cov = (c: Counts) => drawEntries("pair").filter((p) => factorOptions(c, p).length > 0).length;
const hand = (ds: number[]) => { const c: Counts = new Array(10).fill(0); for (const d of ds) c[d]++; return c; };
for (const [ds, p] of [[[2,3,4,5,6,6,7,8,9], 24], [[1,3,4,6,7,7,8,9,9], 24], [[2,3,4,6,6,7,8,9,9], 36], [[1,2,3,4,6,6,8,9], 12], [[2,3,4,4,6,7,8,9,9], 24]] as [number[], number][]) {
  const c = hand(ds);
  const opts = factorOptions(c, p).map(([a, b]) => { c[a]--; c[b]--; const v = cov(c); c[a]++; c[b]++; return `${a}x${b} keeps ${v}/45`; });
  console.log(`hand ${ds.join("")} covers ${cov(c)}/45; product ${p}: ${opts.join(" | ")}`);
}

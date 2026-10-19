import { playRun, summarize, type Kiln, type Policy, type Rules } from "./lib.ts";
const N = 3000;
const K = (recipes: Kiln["recipes"], turns: number): Kiln => ({ recipes, turns, faceCap: 99 });
const rows: Array<[string, Partial<Rules>, Partial<Policy>]> = [
  ["Exact union: 3 4 5 -> 3-5", { kiln: K("unionDigits", 0) }, {}],
  ["Endless today (no kiln)", {}, { fire: "never" }],
  ["Kanchan, kiln holds 3", { kiln: K("gapNbr", 3) }, {}],
  ["Kanchan, kiln holds 2 (proposed)", { kiln: K("gapNbr", 2) }, {}],
  ["Kanchan, kiln holds 1", { kiln: K("gapNbr", 1) }, {}],
  ["Kanchan, instant", { kiln: K("gapNbr", 0) }, {}],
  ["Endless at capacity 11 (no kiln)", { capacity: 11 }, { fire: "never" }],
  ["Seed recipes, instant", { kiln: K("seeds", 0) }, {}],
];
for (const [label, r, p] of rows) {
  const res = Array.from({ length: N }, (_, i) => playRun({ mode: "endless", faceRewards: false, kiln: null, roundCap: 1000, ...r } as Rules, { kind: "smart", skill: 1, evalMode: "myopic", fire: "best", ...p } as Policy, i + 1));
  const s = summarize(res);
  const m = s.meanRounds, half = 1.96 * Math.sqrt(res.reduce((a, x) => a + (x.rounds - m) ** 2, 0) / N / N);
  console.log(JSON.stringify({ label, mean: +m.toFixed(1), ci: +half.toFixed(1), b: +s.bMeasured.toFixed(3), median: s.median }));
}

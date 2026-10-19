import { playRun, summarize, type Policy, type Rules } from "./lib.ts";
const N = 3000;
const ci = (xs: number[]) => { const m = xs.reduce((a, b) => a + b, 0) / xs.length; return `${m.toFixed(1)} ±${(1.96 * Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / xs.length / xs.length)).toFixed(1)}`; };
const go = (label: string, rules: Partial<Rules>, p: Partial<Policy>) => {
  const res = Array.from({ length: N }, (_, i) => playRun({ mode: "endless", faceRewards: false, kiln: null, roundCap: 1000, ...rules } as Rules, { kind: "smart", skill: 1, evalMode: "myopic", fire: "best", ...p } as Policy, i + 1));
  const s = summarize(res);
  console.log(`${label.padEnd(40)} rounds ${ci(res.map((r) => r.rounds))}  b' ${s.bMeasured.toFixed(3)}`);
};
go("Endless capacity 10, no kiln", { capacity: 10 }, { fire: "never" });
go("Endless capacity 11, no kiln", { capacity: 11 }, { fire: "never" });
go("Kiln k=2, best kanchan", { kiln: { recipes: "gapNbr", turns: 2, faceCap: 99 } }, {});
go("Kiln k=2, random kanchan", { kiln: { recipes: "gapNbr", turns: 2, faceCap: 99 } }, { fireRule: "randomPick" });

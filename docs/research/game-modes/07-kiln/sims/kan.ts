import { STATS, playRun, summarize, type Policy, type Rules } from "./lib.ts";
const N = 3000;
const policy: Policy = { kind: "smart", skill: 1, evalMode: "myopic", fire: "best" };
for (const [label, recipes, turns] of [["kanchan k2", "gapNbr", 2], ["kanchan + kan k2", "gapKan", 2], ["kanchan + kan k0", "gapKan", 0]] as const) {
  Object.keys(STATS).forEach((k) => ((STATS as any)[k] = 0));
  const s = summarize(Array.from({ length: N }, (_, i) => playRun({ mode: "endless", faceRewards: false, kiln: { recipes, turns, faceCap: 99 }, roundCap: 1000 } as Rules, policy, i + 1)));
  console.log(`${label.padEnd(17)} b' ${s.bMeasured.toFixed(3)} rounds mean ${s.meanRounds.toFixed(1)} p90 ${s.p90} capped ${(100 * s.capped).toFixed(1)}% fired ${JSON.stringify(s.kinds)}`);
}

import { playRun, summarize, type Policy } from "./lib.ts";
const N = 400;
const p: Policy = { kind: "smart", skill: 1, evalMode: "myopic", fire: "never" };
for (const capacity of [10, 11, 12, 13, 14, 16, 20]) for (const roundCap of [500, 1000]) {
  const s = summarize(Array.from({ length: N }, (_, i) => playRun({ mode: "endless", faceRewards: false, kiln: null, roundCap, capacity }, p, i + 1)));
  console.log(`Endless capacity ${String(capacity).padStart(2)}, no kiln, smart bot skill 1, ${N} runs, round cap ${roundCap}: b' ${s.bMeasured.toFixed(3)} @ceil ${s.bAtCeil.toFixed(3)}  capped ${(100 * s.capped).toFixed(1)}%  mean ${s.meanRounds.toFixed(0)} p10/50/90 ${s.p10}/${s.median}/${s.p90}`);
}

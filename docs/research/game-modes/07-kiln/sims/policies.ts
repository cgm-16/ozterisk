import { STATS, playRun, summarize, type Policy, type Rules } from "./lib.ts";
const N = 3000;
for (const turns of [2, 0]) for (const [label, p] of [
  ["never fire", { fire: "never" }],
  ["fire if better, face counted (optimistic)", { fire: "best", fireRule: "optimistic" }],
  ["fire only if it adds a missing digit", { fire: "best", fireRule: "middleAbsent" }],
  ["fire if better, kiln face not counted (pessimistic)", { fire: "best", fireRule: "pessimistic" }],
] as Array<[string, Partial<Policy>]>) {
  Object.keys(STATS).forEach((k) => ((STATS as Record<string, number>)[k] = 0));
  const policy = { kind: "smart", skill: 1, evalMode: "myopic", ...p } as Policy;
  const res = Array.from({ length: N }, (_, i) => playRun({ mode: "endless", faceRewards: false, kiln: { recipes: "gapNbr", turns, faceCap: 99 }, roundCap: 1000 } as Rules, policy, i + 1));
  const s = summarize(res);
  console.log(`k=${turns} ${label.padEnd(52)} rounds mean ${s.meanRounds.toFixed(1)} (±${(1.96 * Math.sqrt(res.reduce((a, r) => a + (r.rounds - s.meanRounds) ** 2, 0) / N / N)).toFixed(1)}) b' ${s.bMeasured.toFixed(3)} | fired ${(100 * STATS.fired / Math.max(1, STATS.choiceExists)).toFixed(0)}% of chances`);
}

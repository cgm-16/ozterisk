import { STATS, playRun, summarize, type Kiln, type Policy, type Rules } from "./lib.ts";
const N = 3000;
const bot = (skill: number): Policy => ({ kind: "smart", skill, evalMode: "myopic", fire: "best" });
const cells: Array<[string, Kiln | null]> = [["Endless (no kiln)", null], ["Kiln k=2 (chosen)", { recipes: "gapNbr", turns: 2, faceCap: 99 }], ["Kiln k=0 (no cost)", { recipes: "gapNbr", turns: 0, faceCap: 99 }]];
for (const skill of [1, 0.95]) for (const [label, kiln] of cells) for (const roundCap of [500, 1000]) {
  Object.keys(STATS).forEach((k) => ((STATS as Record<string, number>)[k] = 0));
  const res = Array.from({ length: N }, (_, i) => playRun({ mode: "endless", faceRewards: false, kiln, roundCap } as Rules, bot(skill), i + 1));
  const s = summarize(res);
  const max = Math.max(...res.map((r) => r.rounds));
  console.log(`skill ${skill} ${label.padEnd(19)} cap ${roundCap}: b' run ${s.bMeasured.toFixed(3)} ceil ${s.bAtCeil.toFixed(3)} | rounds mean ${s.meanRounds.toFixed(1)} p10/50/90 ${s.p10}/${s.median}/${s.p90} max ${max} capped ${(100 * s.capped).toFixed(1)}% | overflow/100r ${(100 * STATS.overflows / res.reduce((a, r) => a + r.rounds, 0)).toFixed(1)} choice ${(100 * STATS.choiceExists / Math.max(1, STATS.overflows)).toFixed(0)}% fired ${(100 * STATS.fired / Math.max(1, STATS.overflows)).toFixed(0)}% | 3-of-kind ${(100 * STATS.pung3 / STATS.overflows).toFixed(1)}% 4-of-kind ${(100 * STATS.kan4 / STATS.overflows).toFixed(2)}% of overflows | faces held ${s.craftedHeld.toFixed(2)}`);
}

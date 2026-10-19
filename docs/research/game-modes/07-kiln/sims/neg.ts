import { playRun, type Policy, type Rules } from "./lib.ts";
const p: Policy = { kind: "smart", skill: 1, evalMode: "potential", fire: "greedy" };
const res = Array.from({ length: 300 }, (_, i) => playRun({ mode: "endless", faceRewards: false, kiln: { recipes: "gapNbr", turns: 2, faceCap: 99 }, roundCap: 1000, noRewards: true } as Rules, p, i + 1));
console.log(`zero rewards, kiln on: max rounds ${Math.max(...res.map((r) => r.rounds))}, capped ${res.filter((r) => r.capped).length}`);

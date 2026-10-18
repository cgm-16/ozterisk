// Endless-based Kiln grid. Usage: node run.mjs grid.ts  (env: N, CAP, SKILL, ONLY=comma list of labels, BOTS=comma list)
import { playRun, summarize, type Kiln, type Policy, type Rules } from "./lib.ts";
const N = Number(process.env.N ?? 1000), CAP = Number(process.env.CAP ?? 1000), SKILL = Number(process.env.SKILL ?? 1);
const only = process.env.ONLY?.split(",");
const onlyBots = process.env.BOTS?.split(",");
const K = (recipes: Kiln["recipes"], turns = 0, faceCap = 99): Kiln => ({ recipes, turns, faceCap });
const variants: Array<[string, Kiln | null]> = [
  ["base", null],
  ["U-dig", K("unionDigits")],
  ["U-all", K("unionAll")],
  ["pairNbr", K("pairNbr")],
  ["pungPar", K("pungParity")],
  ["seeds", K("seeds")],
  ["U-all k1", K("unionAll", 1)],
  ["U-all k2", K("unionAll", 2)],
  ["U-all k3", K("unionAll", 3)],
  ["U-all cap1", K("unionAll", 0, 1)],
  ["U-all cap2", K("unionAll", 0, 2)],
  ["U-dig k2", K("unionDigits", 2)],
  ["seeds k2", K("seeds", 2)],
  ["seeds cap1", K("seeds", 0, 1)],
  ["pairNbr k2", K("pairNbr", 2)],
  ["gap", K("gapNbr")],
  ["gap k1", K("gapNbr", 1)],
  ["gap k2", K("gapNbr", 2)],
  ["gap k3", K("gapNbr", 3)],
  ["gap cap1", K("gapNbr", 0, 1)],
  ["gap cap2", K("gapNbr", 0, 2)],
  ["ladder", K("gapLadder")],
  ["ladder k1", K("gapLadder", 1)],
  ["ladder k2", K("gapLadder", 2)],
];
const bots: Array<[string, Policy]> = [
  ["myopic/best", { kind: "smart", skill: SKILL, evalMode: "myopic", fire: "best" }],
  ["potential/best", { kind: "smart", skill: SKILL, evalMode: "potential", fire: "best" }],
  ["potential/greedy", { kind: "smart", skill: SKILL, evalMode: "potential", fire: "greedy" }],
];
console.log(`Endless cap 10, kind 0.2, skill ${SKILL}, ${N} runs per cell, round cap ${CAP}. Gate: b' < 0.611 (cliff 0.631 - CLIFF_MARGIN 0.02)`);
for (const [label, kiln] of variants) {
  if (only && !only.includes(label)) continue;
  const cellBots = kiln ? bots : bots.slice(0, 2).map(([l, p]) => [l, { ...p, fire: "never" }] as [string, Policy]);
  for (const [bl, policy] of cellBots) {
    if (onlyBots && !onlyBots.includes(bl)) continue;
    const t0 = Date.now();
    const s = summarize(Array.from({ length: N }, (_, i) => playRun({ mode: (process.env.MODE ?? "endless"), faceRewards: process.env.FACES === "1", kiln, roundCap: CAP } as Rules, policy, i + 1)));
    console.log(`${label.padEnd(11)} ${bl.padEnd(17)} b' ${s.bMeasured.toFixed(3)} @ceil ${s.bAtCeil.toFixed(3)} (${(100*s.ceilShare).toFixed(0)}% of rounds)  capped ${(100 * s.capped).toFixed(1).padStart(5)}%  win ${(100*s.win).toFixed(1)}%  rounds mean ${s.meanRounds.toFixed(0).padStart(4)} p10/50/90 ${s.p10}/${s.median}/${s.p90}  fire/100r ${s.firingsPer100.toFixed(1)}  faces held ${s.craftedHeld.toFixed(2)}  ${JSON.stringify(s.kinds)}  [${((Date.now() - t0) / 1000).toFixed(0)}s]`);
  }
}

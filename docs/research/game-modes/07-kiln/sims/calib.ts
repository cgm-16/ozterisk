import { playRun, summarize, type Policy, type Rules } from "./lib.ts";
const N = 3000;
const run = (rules: Rules, p: Policy, n = N) => summarize(Array.from({ length: n }, (_, i) => playRun(rules, p, i + 1)));
const fmt = (s: ReturnType<typeof summarize>) => `win ${(100 * s.win).toFixed(1)}%  b' ${s.bMeasured.toFixed(3)}  rounds mean ${s.meanRounds.toFixed(1)} p10/50/90 ${s.p10}/${s.median}/${s.p90}`;
// Instrument must fail: perturbing skill changes outcomes.
let d = 0;
for (let seed = 1; seed <= 300; seed++) {
  const a = playRun({ mode: "endless", faceRewards: false, kiln: null, roundCap: 400 }, { kind: "smart", skill: 0.95, evalMode: "myopic", fire: "never" }, seed);
  const b = playRun({ mode: "endless", faceRewards: false, kiln: null, roundCap: 400 }, { kind: "smart", skill: 0.9, evalMode: "myopic", fire: "never" }, seed);
  if (a.rounds !== b.rounds) d++;
}
console.log(`instrument-can-fail: skill 0.95 vs 0.90, 300 seeds differ in ${d} runs (must be > 0)`);
for (const skill of [0.95, 0.85]) {
  const t84: Policy = { kind: "t84", skill, evalMode: "myopic", fire: "never" };
  console.log(`T84 bot, Classic shipped ramp, skill ${skill}, ${N} runs: ${fmt(run({ mode: "classic", faceRewards: true, kiln: null, roundCap: 99 }, t84))}   (journal: ${skill === 0.95 ? "61.2" : "49.4"}%)`);
  console.log(`T84 bot, Classic no faces,    skill ${skill}, ${N} runs: ${fmt(run({ mode: "classic", faceRewards: false, kiln: null, roundCap: 99 }, t84))}   (journal: ${skill === 0.95 ? "33.0" : "23.8"}%)`);
}

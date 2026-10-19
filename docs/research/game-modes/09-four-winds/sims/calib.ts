// Instrument checks: fast spelling == canConstruct; b(10); real reducer vs the loop
// in Classic config (same bot); negative control (zero rewards).
import { ALL, canConstruct, mulberry32, prod, runOnce, runRealClassic, spellHand, getClassicFaceRate, type Config, type Tile } from "./fw-lib.ts";

const R = Number(process.env.RUNS ?? 3000);
const rng0 = mulberry32(12345);
let id = 0;
const faceKinds = [{ face: "wild" }, { face: "odd" }, { face: "even" }, { face: "low" }, { face: "high" }, { face: "nbr", centre: 4 }, { face: "nbr", centre: 1 }] as const;
let mism = 0, checks = 0;
for (let t = 0; t < 5000; t++) {
  const n = Math.floor(rng0() * 13);
  const hand: Tile[] = Array.from({ length: n }, () => rng0() < 0.2
    ? ({ ...faceKinds[Math.floor(rng0() * faceKinds.length)], id: `x${id++}`, isNew: false } as Tile)
    : ({ digit: Math.floor(rng0() * 10), id: `x${id++}`, isNew: false } as Tile));
  for (const p of ALL) { checks++; if (canConstruct(hand, prod(p)) !== spellHand(hand, prod(p))) mism++; }
}
console.log(`spell vs canConstruct: ${mism} mismatches in ${checks} checks (random hands 0-12, 20% faces)`);

const bOf = (n: number, trials = 20000) => { let hit = 0; for (let t = 0; t < trials; t++) { const hand = Array.from({ length: n }, () => ({ digit: Math.floor(rng0() * 10), id: `y${id++}`, isNew: false } as Tile)); for (const p of ALL) if (spellHand(hand, prod(p))) hit++; } return hit / (trials * ALL.length); };
const b10 = bOf(10);
console.log(`b(10) = ${b10.toFixed(3)} (repo 0.48); b(20) = ${bOf(20).toFixed(3)} (repo 0.80); b(0) = ${bOf(0, 200).toFixed(3)} (must be 0)`);
console.log(`analytic Endless drift at b=0.48: ${(0.48 - 0.52 * 1.71).toFixed(3)}/round (spec -0.41)`);

const classic: Config = {
  start: 20, totalSubs: 30, subsPerWind: 15,
  capacityAt: (n) => Math.max(5, 20 - Math.floor(n / 2)), faceAt: (n) => getClassicFaceRate(n),
  winds: [{ name: "E", pool: ALL }, { name: "S", pool: ALL }], skill: 0.95, bot: "naive",
};
for (const skill of [0.95, 0.85]) {
  let real = 0, loop = 0, neg = 0;
  for (let i = 0; i < R; i++) {
    if (runRealClassic(skill, mulberry32(1000 + i)).win) real++;
    if (runOnce({ ...classic, skill }, mulberry32(1000 + i)).win) loop++;
    if (runOnce({ ...classic, skill, zeroRewards: true }, mulberry32(1000 + i)).win) neg++;
  }
  console.log(`Classic skill ${skill}, ${R} runs each: real reducer ${(100 * real / R).toFixed(1)}% | loop ${(100 * loop / R).toFixed(1)}% | loop, zero rewards ${(100 * neg / R).toFixed(1)}% (must be 0)`);
}

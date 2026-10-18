import { maskOf, playRun, bPrime } from "./lib.ts";
import * as gen from "../../../../../src/game/generators.ts";
// Wrap generateKindEquation to print the hand each round (monkeypatch-free: re-run with logging hook via global)
(globalThis as any).__trace = (inv: any[], eq: any, round: number) => {
  if (round % 5 === 0 || inv.length < 12) console.log(`r${round} n=${inv.length} b'=${bPrime(inv.map(maskOf)).toFixed(2)} eq=${eq.product} hand=${inv.map((t: any) => ("digit" in t ? t.digit : t.face)).sort().join("")}`);
};
const r = playRun({ mode: "endless", faceRewards: false, kiln: null, roundCap: 200, capacity: 20 }, { kind: "smart", skill: 1, evalMode: "myopic", fire: "never" }, 7);
console.log(r.rounds, r.capped);
void gen;

// Calibrates the simulator's own spellability test (digit presence, COV mask table)
// against the real canConstruct, then reports b(10) computed from the sim's COV table.
import { COV, maskOf } from "./table-sim.ts";
import { canConstruct } from "../../../../../src/game/selectors.ts";
import type { Digit, Tile } from "../../../../../src/game/types.ts";
const prods: number[] = []; for (let a = 1; a <= 9; a++) for (let b = a; b <= 9; b++) prods.push(a * b);
let agree = 0, checks = 0, covAgree = 0, hands = 0, id = 0;
for (let t = 0; t < 20000; t++) {
  const n = t % 14; // sizes 0..13
  const counts = Array(10).fill(0);
  const hand: Tile[] = Array.from({ length: n }, () => { const d = Math.floor(Math.random() * 10) as Digit; counts[d]++; return { id: `c${id++}`, isNew: false, digit: d }; });
  let real = 0;
  for (const p of prods) {
    const sim = String(p).split("").map(Number).every((d) => counts[d] > 0); // the sim's test
    const ok = canConstruct(hand, p); if (ok) real++;
    checks++; if (sim === ok) agree++;
  }
  hands++; if (Math.abs(COV[maskOf(counts)] - real / 45) < 1e-12) covAgree++;
}
console.log(`presence test vs real canConstruct: ${agree}/${checks} product checks agree; COV table vs real count: ${covAgree}/${hands} hands agree`);
let s = 0; const T = 20000;
for (let t = 0; t < T; t++) { const c = Array(10).fill(0); for (let i = 0; i < 10; i++) c[Math.floor(Math.random() * 10)]++; s += COV[maskOf(c)]; }
const b = s / T;
console.log(`b(10) from the sim's COV table = ${b.toFixed(3)} (repo 0.481); analytic drift at that b = ${(b - (1 - b) * 1.71).toFixed(2)} (repo -0.41)`);
// negative control: an empty hand spells nothing
console.log(`COV[empty hand] = ${COV[0]} (must be 0)`);

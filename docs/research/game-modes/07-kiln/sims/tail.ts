import { projectBiasedRate, projectBuildableRate, buildableRateCliff } from "../../../../../src/test/economy.ts";
import { KIND_EQUATION_RATE } from "../../../../../src/game/balance.ts";
import { isFace, playRun, type Policy, type Rules } from "./lib.ts";
import type { Tile } from "../../../../../src/game/types.ts";
// Analytic yardstick (repo economy.ts): b'(n) for n = 10, 11 and the interpolation at the measured equivalent capacity.
const b10 = projectBiasedRate(projectBuildableRate(10), KIND_EQUATION_RATE), b11 = projectBiasedRate(projectBuildableRate(11), KIND_EQUATION_RATE);
const frac = (22.8 - 20.0) / (24.6 - 20.0);
console.log(`economy.ts b'(10)=${b10.toFixed(4)} b'(11)=${b11.toFixed(4)} cliff=${buildableRateCliff().toFixed(4)}; equivalent capacity 10+${frac.toFixed(2)} -> b'=${(b10 + frac * (b11 - b10)).toFixed(4)} (gate 0.6111)`);
// Faces held per round (rack + kiln), distribution over all rounds of 3,000 Kiln k=2 runs.
const hist = new Map<number, number>();
(globalThis as { __trace?: (inv: Tile[]) => void }).__trace = (inv: Tile[]) => { const f = inv.filter(isFace).length; hist.set(f, (hist.get(f) ?? 0) + 1); };
const p: Policy = { kind: "smart", skill: 1, evalMode: "myopic", fire: "best" };
for (let i = 1; i <= 3000; i++) playRun({ mode: "endless", faceRewards: false, kiln: { recipes: "gapNbr", turns: 2, faceCap: 99 }, roundCap: 1000 } as Rules, p, i);
const total = [...hist.values()].reduce((a, b) => a + b, 0);
console.log("fired faces seated in the rack at draw time (kiln excluded):", [...hist.entries()].sort((a, b) => a[0] - b[0]).map(([k, v]) => `${k}: ${(100 * v / total).toFixed(2)}%`).join("  "), `| rounds ${total}`);

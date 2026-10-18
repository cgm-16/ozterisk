// Smoke test for the runner: steps the real reducer once, then reproduces the
// repo's known unbiased buildable rate b(10) ~= 48% (endless-polish spec §1.1).
import { gameReducer } from "../../../../src/game/gameReducer.ts";
import { createInitialInventory, createTitleState } from "../../../../src/game/factories.ts";
import { canConstruct } from "../../../../src/game/selectors.ts";
import type { Digit, Tile } from "../../../../src/game/types.ts";

let n = 0;
const ids = () => `t${n++}`;
const inventory = createInitialInventory(ids);
let state = gameReducer(createTitleState(), {
  type: "START_RUN", mode: "endless", equation: { left: 3, right: 7, product: 21 }, inventory,
});
const two = state.inventory.find((t) => "digit" in t && t.digit === 2)!;
state = gameReducer(state, { type: "SELECT_TILE", tileId: two.id });
console.log("phase:", state.phase, "| selected:", state.selectedTiles.map((t) => ("digit" in t ? t.digit : "face")));

// Monte Carlo b(n): random hand of n uniform digits, share of the 45 pairs it can spell.
const pairs: number[] = [];
for (let a = 1; a <= 9; a++) for (let b = a; b <= 9; b++) pairs.push(a * b);
function buildable(handSize: number, trials = 20000): number {
  let hits = 0;
  for (let t = 0; t < trials; t++) {
    const hand: Tile[] = Array.from({ length: handSize }, () => ({ id: ids(), isNew: false, digit: Math.floor(Math.random() * 10) as Digit }));
    for (const p of pairs) if (canConstruct(hand, p)) hits++;
  }
  return hits / (trials * pairs.length);
}
console.log("b(10) =", buildable(10).toFixed(3), "(expect ~0.48)", "| b(20) =", buildable(20).toFixed(3), "(expect ~0.80)");
// Negative control: an empty hand must spell nothing.
console.log("b(0) =", buildable(0, 100).toFixed(3), "(must be 0)");

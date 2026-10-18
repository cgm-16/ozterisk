// Instrument checks for the Kiln sim (run: node run.mjs <abs path>).
import { gameReducer } from "../../../../../src/game/gameReducer.ts";
import { createInitialInventory, createTitleState } from "../../../../../src/game/factories.ts";
import { generateKindEquation, generateRewardTiles } from "../../../../../src/game/generators.ts";
import { canConstruct, getCapacity, getRewardCount, isAtClassicFloor, isClassicWin } from "../../../../../src/game/selectors.ts";
import type { GameMode, Tile } from "../../../../../src/game/types.ts";
import { FACE_OF_MASK, bPrime, chooseAnswer, fastB, legalFirings, maskOf, playRun, resolveOverflow, rng, summarize, type Policy, type Rules } from "./lib.ts";

const r = rng(12345);
let nid = 0;
const faces = [...FACE_OF_MASK.values()];
const randTile = (faceShare: number): Tile =>
  r() < faceShare ? ({ ...faces[Math.floor(r() * faces.length)], id: `x${nid++}`, isNew: false } as Tile)
                  : ({ id: `x${nid++}`, isNew: false, digit: Math.floor(r() * 10) } as Tile);
const pairs: number[] = [];
for (let a = 1; a <= 9; a++) for (let b = a; b <= 9; b++) pairs.push(a * b);

// 1. fastB agrees with the real canConstruct, faces included.
let mismatches = 0;
for (let t = 0; t < 5000; t++) {
  const hand = Array.from({ length: 1 + Math.floor(r() * 12) }, () => randTile(0.3));
  const real = pairs.filter((p) => canConstruct(hand, p)).length / 45;
  if (Math.abs(real - fastB(hand.map(maskOf))) > 1e-12) mismatches++;
}
console.log(`1. fastB vs canConstruct, 5000 hands (30% faces): mismatches = ${mismatches} (must be 0)`);

// 2. Calibration: unbiased b(10) of a uniform digit hand, and the cliff arithmetic.
let s10 = 0;
for (let t = 0; t < 20000; t++) s10 += fastB(Array.from({ length: 10 }, () => randTile(0).digit !== undefined ? 0 : 0).map(() => 1 << Math.floor(r() * 10)));
console.log(`2. b(10) uniform = ${(s10 / 20000).toFixed(3)} (repo: 0.480); miss cost = ${(77 / 45).toFixed(3)}; cliff = ${(77 / 45 / (1 + 77 / 45)).toFixed(4)}; drift(0.48) = ${(0.48 - 0.52 * 77 / 45).toFixed(3)} (repo: -0.41)`);

// 3. Exact-union firing never raises the current hand's biased rate (so it only pays at the ceiling).
let raised = 0, firingsSeen = 0;
for (let t = 0; t < 3000; t++) {
  const hand = Array.from({ length: 6 + Math.floor(r() * 6) }, () => randTile(0.25));
  const before = bPrime(hand.map(maskOf));
  for (const f of legalFirings(hand, "unionAll")) {
    firingsSeen++;
    const after = [...hand.filter((_, i) => !f.idx.includes(i)).map(maskOf), f.out];
    if (bPrime(after) > before + 1e-12) raised++;
  }
}
console.log(`3. exact-union firings examined = ${firingsSeen}; raised b' = ${raised} (must be 0)`);

// 4. The sim loop reproduces the real reducer run-for-run (never-fire bot).
function reducerRun(mode: GameMode, faceRewards: boolean, policy: Policy, seed: number, cap: number) {
  const rand = rng(seed), botRand = rng(seed ^ 0x9e3779b9);
  const ctx = { mc: rng(seed ^ 0x51ed270b), policy };
  let n = 0;
  const ids = () => `t${n++}`;
  const inv0 = createInitialInventory(ids, mode === "classic" ? 20 : 10);
  let s = gameReducer(createTitleState(), { type: "START_RUN", mode, equation: generateKindEquation(rand, inv0), inventory: inv0 });
  const rules: Rules = { mode, faceRewards, kiln: null, roundCap: cap };
  while (s.phase !== "gameOver") {
    if (s.phase === "answering") {
      const can = canConstruct(s.inventory, s.equation!.product);
      let correct = can && botRand() < policy.skill;
      let sel = chooseAnswer(s.inventory, s.equation!, correct, policy);
      if (!sel.length) { correct = !correct; sel = chooseAnswer(s.inventory, s.equation!, correct, policy); }
      for (const t of sel) s = gameReducer(s, { type: "SELECT_TILE", tileId: t.id });
      s = correct
        ? gameReducer(s, { type: "SUBMIT_CORRECT", rewardTiles: generateRewardTiles(getRewardCount(sel.length), rand, ids, faceRewards ? "classic" : "endless", s.totalRounds) })
        : gameReducer(s, { type: "SUBMIT_INCORRECT" });
      if (s.phase === "answering") throw new Error("reducer rejected a submission");
    } else if (s.phase === "overflow") {
      const out = resolveOverflow(s.inventory, getCapacity(mode, s.totalRounds), rules, { face: null, left: 0 }, ctx, ids);
      const keep = new Set(out.inv.map((t) => t.id));
      for (const t of s.inventory) if (!keep.has(t.id)) s = gameReducer(s, { type: "TOGGLE_DISCARD", tileId: t.id });
      if (s.phase !== "feedback") throw new Error("discard did not complete");
    } else {
      if (s.totalRounds >= cap) return { rounds: s.totalRounds, win: true };
      const eq = isAtClassicFloor(s) ? s.equation! : generateKindEquation(rand, s.inventory);
      s = gameReducer(s, { type: "NEXT_ROUND", equation: eq });
    }
  }
  return { rounds: s.totalRounds, win: mode === "classic" ? isClassicWin(s) : false };
}
for (const [mode, faceRewards, kind] of [["endless", false, "smart"], ["classic", true, "t84"], ["classic", true, "smart"]] as const) {
  const policy: Policy = { kind, skill: 0.95, evalMode: "myopic", fire: "never" };
  let diff = 0;
  for (let seed = 1; seed <= 300; seed++) {
    const a = playRun({ mode, faceRewards, kiln: null, roundCap: 400 }, policy, seed);
    const b = reducerRun(mode, faceRewards, policy, seed, 400);
    if (a.rounds !== b.rounds || a.win !== b.win) diff++;
  }
  console.log(`4. loop vs real gameReducer, ${mode}/${kind}, 300 seeds: differing runs = ${diff} (must be 0)`);
}

// 5. Negative control: no rewards must always lose.
const neg = summarize(Array.from({ length: 300 }, (_, i) => playRun({ mode: "endless", faceRewards: false, kiln: { recipes: "unionAll", turns: 0, faceCap: 99 }, roundCap: 1000, noRewards: true }, { kind: "smart", skill: 1, evalMode: "potential", fire: "greedy" }, i + 1)));
const negC = summarize(Array.from({ length: 300 }, (_, i) => playRun({ mode: "classic", faceRewards: true, kiln: null, roundCap: 1000, noRewards: true }, { kind: "smart", skill: 1, evalMode: "myopic", fire: "never" }, i + 1)));
console.log(`5. zero rewards: endless+kiln capped = ${neg.capped}, max rounds = ${neg.p90}; classic win = ${negC.win} (all must be 0 / small)`);

// 6. Equivalence control: kiln enabled but never used reproduces the no-kiln baseline run-for-run.
let eqDiff = 0;
for (let seed = 1; seed <= 300; seed++) {
  const p: Policy = { kind: "smart", skill: 0.95, evalMode: "myopic", fire: "never" };
  const a = playRun({ mode: "endless", faceRewards: false, kiln: null, roundCap: 400 }, p, seed);
  const b = playRun({ mode: "endless", faceRewards: false, kiln: { recipes: "unionAll", turns: 2, faceCap: 99 }, roundCap: 400 }, p, seed);
  if (a.rounds !== b.rounds) eqDiff++;
}
console.log(`6. kiln present, never fired vs baseline, 300 seeds: differing runs = ${eqDiff} (must be 0)`);

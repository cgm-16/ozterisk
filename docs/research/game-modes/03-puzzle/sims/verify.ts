// Instrument checks for solver.ts. Run with run-cap.mjs (CAP=5 patches the real
// INVENTORY_CAPACITY so the real gameReducer plays at capacity 5).
import { gameReducer } from "../../../../../src/game/gameReducer.ts";
import { sortTiles } from "../../../../../src/game/factories.ts";
import { canConstruct, getCapacity } from "../../../../../src/game/selectors.ts";
import { createTitleState } from "../../../../../src/game/factories.ts";
import type { Digit, GameAction, GameState, Tile } from "../../../../../src/game/types.ts";
import { makeSolver, mulberry32, randomTable, type Move, type Table } from "./solver.ts";
import { dispatch, replay } from "./replay.ts";

const CAP = getCapacity("endless", 0);
console.log(`real getCapacity("endless") under this runner = ${CAP}`);
let n = 0;
const id = () => `t${n++}`;
const tile = (d: number): Tile => ({ id: id(), isNew: false, digit: d as Digit });

// 1. Harness calibration: real canConstruct reproduces b(10) ~= 0.48 (endless-polish §1.1).
{
  const rnd = mulberry32(1);
  const prods: number[] = [];
  for (let a = 1; a <= 9; a++) for (let b = a; b <= 9; b++) prods.push(a * b);
  let hit = 0;
  const T = 20000;
  for (let t = 0; t < T; t++) {
    const hand = Array.from({ length: 10 }, () => tile(Math.floor(rnd() * 10)));
    for (const p of prods) if (canConstruct(hand, p)) hit++;
  }
  console.log(`[calibration] b(10) = ${(hit / (T * 45)).toFixed(3)} (repo: ~0.48), 20,000 uniform hands`);
}

// 2. Cross-check memoized histogram against naive enumeration (no memo) on small tables.
{
  const rnd = mulberry32(2);
  let checked = 0;
  for (const model of ["P", "W"] as const) for (let i = 0; i < 150; i++) {
    const t = randomTable(rnd, model, CAP, 4);
    const s = makeSolver(t);
    const hist = new Array(5).fill(0);
    const walk = (k: number, hand: number[], size: number, ptr: number, score: number) => {
      const opts = s.options(k, hand, size, ptr);
      if (opts.length === 0) { hist[score]++; return; }
      for (const o of opts) walk(o.k, o.hand, o.size, o.ptr, score + o.gain);
    };
    walk(0, s.root.hand, s.root.size, s.root.ptr, 0);
    const r = s.solve();
    if (hist.join() !== r.histogram.join()) throw new Error(`histogram mismatch ${hist} vs ${r.histogram}`);
    checked++;
  }
  console.log(`[cross-check] memoized histogram == naive enumeration on ${checked} tables (K=4, cap ${CAP}, P and W)`);
}

{
  const rnd = mulberry32(3);
  let lines = 0, steps = 0, losses = 0;
  for (const model of ["P", "W"] as const) for (let i = 0; i < 1000; i++) {
    const t = randomTable(rnd, model, CAP, 8);
    const s = makeSolver(t);
    // A random line through the solver's own transition, recording its hands.
    let cur = s.root, score = 0;
    const moves: Move[] = [], hands: string[] = [];
    while (true) {
      const opts = s.options(cur.k, cur.hand, cur.size, cur.ptr);
      if (opts.length === 0) break;
      // Mostly answer when able (deep lines), sometimes sacrifice (miss branches).
      const correct = opts.filter((x) => x.move.kind === "correct");
      const pool = correct.length > 0 && rnd() < 0.85 ? correct : opts;
      const o = pool[Math.floor(rnd() * pool.length)]!;
      moves.push(o.move); hands.push(o.hand.join("")); score += o.gain; cur = o;
    }
    const r = replay(t, moves);
    if (r.hands.join("|") !== hands.join("|") || r.score !== score) throw new Error(`replay mismatch on table ${i}`);
    if (cur.k < t.eqs.length) { losses++; if (r.ended !== "loss") throw new Error("solver lost, reducer did not"); }
    lines++; steps += moves.length;
  }
  console.log(`[replay] ${lines} random lines (${steps} submissions, ${losses} ending in the loss) agree with the real gameReducer at capacity ${CAP}: hand after every submission and final score`);
  // Par lines: the solver's canonical line must score par on the real reducer.
  let parOk = 0;
  for (const model of ["P", "W"] as const) for (let i = 0; i < 200; i++) {
    const t = randomTable(rnd, model, CAP, 8);
    const r = makeSolver(t).solve();
    const rr = replay(t, r.line.map((x) => x.move));
    if (rr.score !== r.par) throw new Error(`par line scored ${rr.score}, par ${r.par}`);
    parOk++;
  }
  console.log(`[replay] ${parOk} canonical par lines score exactly par on the real gameReducer`);
}

// 4. Negative controls.
{
  // (a) The reducer refuses a "correct" claim spelled in the wrong order (21 for 3 x 4).
  let st = dispatch(createTitleState(), { type: "START_RUN", mode: "endless",
    equation: { left: 3, right: 4, product: 12 }, inventory: sortTiles([1, 2, 3, 4, 5].map(tile)) });
  for (const d of [2, 1]) st = dispatch(st, { type: "SELECT_TILE", tileId: st.inventory.find((x) => "digit" in x && x.digit === d)!.id });
  let threw = "";
  try { dispatch(st, { type: "SUBMIT_CORRECT", rewardTiles: [tile(0), tile(0), tile(0)] }); } catch (e) { threw = (e as Error).message; }
  console.log(`[negative] reversed answer claimed correct: "${threw}"`);
  // (b0) The replay detects a rules disagreement: replay a line on a table whose first reward differs.
  {
    const rnd = mulberry32(4);
    let detected = 0, tried = 0;
    for (let i = 0; i < 200; i++) {
      const t = randomTable(rnd, "P", CAP, 8);
      const s = makeSolver(t);
      const r = s.solve();
      if (r.line[0]?.move.kind !== "correct") continue;
      const bad: Table = { ...t, bounty: t.bounty!.map((b, k) => (k === 0 ? b.map((d) => (d + 1) % 10) : b)) };
      tried++;
      try {
        const rr = replay(bad, r.line.map((x) => x.move));
        if (rr.hands.join("|") !== r.line.map((x) => x.hand.join("")).join("|")) detected++;
      } catch { detected++; }
    }
    console.log(`[negative] corrupted first reward: replay disagrees with the solver on ${detected} of ${tried} lines`);
  }
  // (b) A hand that spells nothing, facing only 7 x 8: par 0, no line scores, both bots 0.
  const z: Table = { model: "P", cap: CAP, hand: [1, 1, 1, 1, 1], eqs: Array(6).fill([7, 8]), bounty: Array(6).fill([5, 6, 0]) };
  const zs = makeSolver(z), zr = zs.solve();
  console.log(`[negative] spells-nothing table: par ${zr.par}, histogram ${zr.histogram}, myopic ${zs.myopic().score}, lookahead ${zs.lookahead().score}`);
  // (c) A digit no source supplies: row 1 is 5 x 8 = 40 and no 0 exists anywhere. Clearing all is impossible.
  const c: Table = { model: "P", cap: CAP, hand: [1, 2, 4, 6, 8], eqs: [[5, 8], [2, 3], [3, 4], [2, 4]],
    bounty: [[1, 2, 3], [1, 2], [6, 8, 9], [1, 3]] };
  const cr = makeSolver(c).solve();
  console.log(`[negative] no-0 table (needs 40): par ${cr.par} of ${c.eqs.length}, clearable = ${cr.par === c.eqs.length}`);
}

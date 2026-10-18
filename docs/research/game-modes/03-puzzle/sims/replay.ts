// Replays a line through the REAL gameReducer (capacity from run-cap.mjs).
import { gameReducer } from "../../../../../src/game/gameReducer.ts";
import { createTitleState, sortTiles } from "../../../../../src/game/factories.ts";
import type { Digit, GameAction, GameState, Tile } from "../../../../../src/game/types.ts";
import { makeSolver, type Move, type Table } from "./solver.ts";
let n = 0;
const id = () => `r${n++}`;
export const tile = (d: number): Tile => ({ id: id(), isNew: false, digit: d as Digit });
// 3. Replay through the REAL gameReducer. Every dispatch must change state
//    (the reducer returns the same object when it rejects an action).
export function dispatch(s: GameState, a: GameAction): GameState {
  const next = gameReducer(s, a);
  if (next === s) throw new Error(`reducer rejected ${a.type} in phase ${s.phase}`);
  return next;
}
const counts = (tiles: Tile[]) => {
  const c = Array(10).fill(0);
  tiles.forEach((t) => { if ("digit" in t) c[t.digit]++; });
  return c.join("");
};
export function replay(t: Table, moves: Move[]): { score: number; hands: string[]; ended: string } {
  const s0 = makeSolver(t);
  let st = dispatch(createTitleState(), {
    type: "START_RUN", mode: "endless",
    equation: { left: t.eqs[0]![0], right: t.eqs[0]![1], product: t.eqs[0]![0] * t.eqs[0]![1] },
    inventory: sortTiles(t.hand.map(tile)),
  });
  let ptr = 0;
  const hands: string[] = [];
  for (let k = 0; k < moves.length; k++) {
    if (st.phase !== "answering") throw new Error(`step ${k}: phase ${st.phase}`);
    const { ds, len } = s0.info[k]!;
    const mv = moves[k]!;
    const pickDigits = mv.kind === "correct" ? ds
      : mv.spend.length === 2 && [...mv.spend].sort().join() === [...ds].sort().join() ? [...ds].reverse()
      : mv.spend;
    for (const d of pickDigits) {
      const tl = st.inventory.find((x) => "digit" in x && x.digit === d);
      if (!tl) throw new Error(`step ${k}: no tile ${d}`);
      st = dispatch(st, { type: "SELECT_TILE", tileId: tl.id });
    }
    if (mv.kind === "correct") {
      const rew = t.model === "P" ? t.bounty![k]! : t.wall!.slice(ptr, ptr + len + 1);
      ptr += t.model === "W" ? rew.length : 0;
      st = dispatch(st, { type: "SUBMIT_CORRECT", rewardTiles: rew.map((d) => ({ ...tile(d), isNew: true })) });
      if (st.phase === "overflow") {
        if (mv.discard === null) throw new Error(`step ${k}: reducer overflowed, solver did not`);
        const tl = st.inventory.find((x) => "digit" in x && x.digit === mv.discard)!;
        st = dispatch(st, { type: "TOGGLE_DISCARD", tileId: tl.id });
      } else if (mv.discard !== null) throw new Error(`step ${k}: solver discarded, reducer did not overflow`);
    } else st = dispatch(st, { type: "SUBMIT_INCORRECT" });
    hands.push(counts(st.inventory));
    if (k + 1 < t.eqs.length) {
      const [a, b] = t.eqs[k + 1]!;
      st = dispatch(st, { type: "NEXT_ROUND", equation: { left: a, right: b, product: a * b } });
      if (st.phase === "gameOver") return { score: st.score, hands, ended: "loss" };
    }
  }
  return { score: st.score, hands, ended: "complete" };
}

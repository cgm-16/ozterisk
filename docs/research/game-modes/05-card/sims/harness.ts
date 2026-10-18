// Steps the REAL gameReducer (Endless mode, capacity 10, digit rewards) with a
// pluggable equation source and bot. Equations come from outside the reducer
// (NEXT_ROUND takes one), so the deal variants need no reducer change; the
// 45-fact horizon is an external stop, mirroring Classic's floor check (§1.8 step 0).
import { gameReducer } from "../../../../../src/game/gameReducer.ts";
import { createInitialInventory, createTitleState } from "../../../../../src/game/factories.ts";
import { canConstruct, getAnswerLength, getRewardCount, isClassicWin } from "../../../../../src/game/selectors.ts";
import { generateKindEquation, generateRewardTiles } from "../../../../../src/game/generators.ts";
import type { Equation, GameState, Tile } from "../../../../../src/game/types.ts";
import { BOXES, FACTS, TABLES, coverage, dealEquation, digitCounts, drawEquation, factIndex, mulberry32 } from "./common.ts";

export type Policy = "naive" | "blind" | "aware" | "scrambled" | "alwaysMiss";
export type Config = {
  deal: "replace" | "deck";
  kindRate: number; // 0.2 + replace uses the real generateKindEquation
  policy: Policy;
  skill: number; // P(correct | buildable)
  maxRounds?: number;
  mode?: "endless" | "classic"; // classic: real 20>5/2 descent, digit-only rewards (face rate 0)
};
export type RunResult = {
  submitted: number;
  correct: number;
  distinct: number;
  win: boolean; // deck only: all 45 dealt and >= 1 tile left
  buildableRounds: number;
  tables: number;
  boxes: number;
  card: ("stamp" | "burn" | "none")[];
  byPos: Array<{ len: number; buildable: boolean }>;
};

const ALL = FACTS.map((f) => f.i);

export function pickBest<T>(options: T[], score: (o: T) => number[], rng: () => number): T {
  let best: T[] = [];
  let bestKey: number[] | null = null;
  for (const o of options) {
    const key = score(o);
    let cmp = 0;
    if (bestKey) for (let i = 0; i < key.length && cmp === 0; i++) cmp = key[i] - bestKey[i];
    if (!bestKey || cmp > 0) {
      best = [o];
      bestKey = key;
    } else if (cmp === 0) best.push(o);
  }
  return best[Math.floor(rng() * best.length)];
}

// Digits to give up (discard one, or spend n on a miss), never spelling `avoid`.
export function chooseDigits(
  counts: number[],
  n: 1 | 2,
  pool: readonly number[] | null, // null = naive (most copies)
  avoid: number | null,
  rng: () => number,
  wild = 0,
): number[] {
  const options: number[][] = [];
  for (let d1 = 0; d1 <= 9; d1++) {
    if (counts[d1] === 0) continue;
    if (n === 1) {
      if (avoid !== null && avoid === d1) continue;
      options.push([d1]);
      continue;
    }
    for (let d2 = d1; d2 <= 9; d2++) {
      if (counts[d2] === 0 || (d1 === d2 && counts[d1] < 2)) continue;
      // Order the pair so it does not spell the product (no product repeats a digit).
      const spelled = (x: number, y: number) => avoid !== null && x * 10 + y === avoid;
      if (!spelled(d1, d2)) options.push([d1, d2]);
      else if (!spelled(d2, d1)) options.push([d2, d1]);
    }
  }
  if (options.length === 0) return [];
  return pickBest(
    options,
    (o) => {
      const c = [...counts];
      for (const d of o) c[d]--;
      const redundancy = o.reduce((s, d) => s + counts[d], 0);
      return pool === null ? [redundancy] : [coverage(pool, c, wild), redundancy];
    },
    rng,
  );
}

function takeTiles(inventory: readonly Tile[], digits: number[]): string[] {
  const used = new Set<string>();
  return digits.map((d) => {
    const t = inventory.find((x) => "digit" in x && x.digit === d && !used.has(x.id))!;
    used.add(t.id);
    return t.id;
  });
}

export function runOne(cfg: Config, seed: number): RunResult {
  const rng = mulberry32(seed);
  let n = 0;
  const ids = () => `t${n++}`;
  const card: RunResult["card"] = Array(45).fill("none");
  const dealt = new Set<number>();
  const perm = [...ALL];
  for (let i = perm.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  const byPos: RunResult["byPos"] = [];
  let buildableRounds = 0;

  const next = (inv: readonly Tile[]): Equation => {
    let eq: Equation;
    if (cfg.deal === "deck") eq = dealEquation(rng, inv, ALL.filter((i) => !dealt.has(i)), cfg.kindRate);
    else if (cfg.kindRate === 0.2) eq = generateKindEquation(rng, inv);
    else eq = drawEquation(rng, inv, cfg.kindRate);
    dealt.add(factIndex(eq.left, eq.right));
    return eq;
  };
  const pool = (): readonly number[] | null => {
    // The facts still to come: undealt (deck) or unstamped (with replacement).
    const open = cfg.deal === "deck" ? ALL.filter((i) => !dealt.has(i)) : ALL.filter((i) => card[i] !== "stamp");
    if (cfg.policy === "naive") return null;
    if (cfg.policy === "blind") return ALL;
    if (cfg.policy === "aware") return open;
    return open.map((i) => perm[i]); // scrambled: same size, no information
  };

  const mode = cfg.mode ?? "endless";
  const inventory0 = createInitialInventory(ids, mode === "classic" ? 20 : 10);
  let state: GameState = gameReducer(createTitleState(), {
    type: "START_RUN", mode, equation: next(inventory0), inventory: inventory0,
  });
  let win = false;
  for (;;) {
    if (state.phase === "answering") {
      const eq = state.equation!;
      const fi = factIndex(eq.left, eq.right);
      const len = getAnswerLength(eq);
      const canBuild = canConstruct(state.inventory, eq.product);
      if (canBuild) buildableRounds++;
      byPos.push({ len, buildable: canBuild });
      const { counts } = digitCounts(state.inventory);
      let digits: number[] = [];
      let correct = canBuild && cfg.policy !== "alwaysMiss" && rng() < cfg.skill;
      if (!correct) {
        digits = chooseDigits(counts, len, cfg.policy === "alwaysMiss" ? null : pool(), eq.product, rng);
        if (digits.length === 0) correct = canBuild; // only the answer's own tiles remain
      }
      if (correct) digits = String(eq.product).split("").map(Number);
      for (const id of takeTiles(state.inventory, digits)) state = gameReducer(state, { type: "SELECT_TILE", tileId: id });
      if (correct) {
        const rewardTiles = generateRewardTiles(getRewardCount(len), rng, ids, "endless", state.totalRounds);
        state = gameReducer(state, { type: "SUBMIT_CORRECT", rewardTiles });
        card[fi] = "stamp";
      } else {
        state = gameReducer(state, { type: "SUBMIT_INCORRECT" });
        if (card[fi] !== "stamp") card[fi] = "burn";
      }
      if (state.phase === "answering") throw new Error("submission rejected by the reducer");
    } else if (state.phase === "overflow") {
      // Classic can overflow by two; mark one tile at a time until the discard completes.
      const unmarked = state.inventory.filter((t) => !state.pendingDiscards.includes(t.id));
      const { counts } = digitCounts(unmarked);
      const [d] = chooseDigits(counts, 1, cfg.policy === "alwaysMiss" ? null : pool(), null, rng);
      const before = state;
      state = gameReducer(state, { type: "TOGGLE_DISCARD", tileId: takeTiles(unmarked, [d])[0] });
      if (state === before) throw new Error("discard mark rejected");
    } else if (state.phase === "feedback") {
      if (cfg.deal === "deck" && dealt.size === 45) {
        win = state.inventory.length >= 1;
        break;
      }
      if (state.totalRounds >= (cfg.maxRounds ?? 5000)) break;
      state = gameReducer(state, { type: "NEXT_ROUND", equation: next(state.inventory) });
    } else {
      win = isClassicWin(state); // gameOver: too few tiles, or Classic reached its floor
      break;
    }
  }
  const stamped = new Set(ALL.filter((i) => card[i] === "stamp"));
  return {
    submitted: state.totalRounds,
    correct: state.score,
    distinct: stamped.size,
    win,
    buildableRounds,
    tables: TABLES.filter((t) => t.every((i) => stamped.has(i))).length,
    boxes: BOXES.filter((t) => t.every((i) => stamped.has(i))).length,
    card,
    byPos,
  };
}

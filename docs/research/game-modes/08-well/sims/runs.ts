// Full-run sims: Endless on the REAL reducer vs the Well (re-implemented here).
// Usage: node run.mjs runs.ts  (env: RUNS, CAP, SKILL, ONLY)
// Both modes share one bot family:
//   naive  — random legal instance / burn / discard
//   greedy — 1-ply: the choice that leaves the highest coverage (unbiased b) after
//            removal and gravity; reward digits are unknown, the rail tile is known.
// Well rules: 5x3 well, 2-digit answers need touching tiles (any slot order),
// spent tiles leave and stacks fall, rewards land on the lowest stack (leftmost tie),
// the extra tile waits on the rail when full; a discard drops it onto that stack.
// Kind bias 0.2, re-implemented with a touching-aware predicate in
// generateKindEquation's sample order (gate, then generateEquation or pick+orient).
import { gameReducer } from "../../../../../src/game/gameReducer.ts";
import { createInitialInventory, createTitleState } from "../../../../../src/game/factories.ts";
import { generateEquation, generateKindEquation, generateRewardTiles } from "../../../../../src/game/generators.ts";
import { answerMatches, canConstruct, getAnswerLength, getRewardCount } from "../../../../../src/game/selectors.ts";
import { KIND_EQUATION_RATE } from "../../../../../src/game/balance.ts";
import type { Equation, GameState, Tile } from "../../../../../src/game/types.ts";
import {
  PAIRS, PRODUCTS, canFill, canSpell, coverage, placeLowest, placeRandomColumn, removeCells,
  selectionValue, selections, spellable, tileCount, type Adjacency, type Cell, type Grid,
} from "./well-model.ts";

const RUNS = Number(process.env.RUNS ?? 1000);
const CAP = Number(process.env.CAP ?? 1000);
const SKILL = Number(process.env.SKILL ?? 1);
const ONLY = process.env.ONLY ?? "";
const rand = Math.random;
let idn = 0;
const ids = () => `t${idn++}`;
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)]!;
// blind: greedy that scores with LOOSE coverage (adjacency ignored) — isolates hand size from geometry.
type Bot = "naive" | "greedy" | "blind";

interface Stats {
  rounds: number[];
  drawn: number; spellableDrawn: number; // all rounds
  drawnFull: number; spellableFull: number; // rounds that start at capacity
  heldSum: number;
  correctRounds: number; correctChoice: number; // >= 2 distinct outcomes among correct selections
  burnRounds: number; burnChoice: number;
  discards: number; discardChoice: number;
  rewardsPlaced: number;
  byN: Map<number, { drawn: number; spell: number; dsum: number; dcount: number }>;
}
const newStats = (): Stats => ({ rounds: [], drawn: 0, spellableDrawn: 0, drawnFull: 0, spellableFull: 0, heldSum: 0, correctRounds: 0, correctChoice: 0, burnRounds: 0, burnChoice: 0, discards: 0, discardChoice: 0, rewardsPlaced: 0, byN: new Map() });

// Best (greedy) or random (naive) option; also reports whether options differ in outcome.
function choose<T>(options: T[], score: (o: T) => number, bot: Bot): { o: T; distinct: boolean } {
  const scored = options.map((o) => [o, score(o)] as const);
  const distinct = new Set(scored.map(([, s]) => s.toFixed(6))).size >= 2;
  if (bot === "naive") return { o: pick(options), distinct };
  let best = scored[0]!;
  for (const s of scored) if (s[1] > best[1]) best = s;
  // ties: random among the best, so greedy has no positional bias of its own
  const top = scored.filter((s) => s[1] === best[1]);
  return { o: pick(top)[0], distinct };
}

// Steady state: rounds after the 10th, so the fixed openings no longer dominate.
function noteRound(s: Stats, round: number, n: number, can: boolean) {
  if (round <= 10) return;
  const e = s.byN.get(n) ?? { drawn: 0, spell: 0, dsum: 0, dcount: 0 };
  e.drawn++; if (can) e.spell++;
  s.byN.set(n, e);
}
function noteDrift(s: Stats, round: number, nBefore: number, nAfter: number) {
  if (round <= 10) return;
  const e = s.byN.get(nBefore);
  if (e) { e.dsum += nAfter - nBefore; e.dcount++; }
}
function reportByN(s: Stats, ns: number[]) {
  console.log("   steady state (round > 10) by tiles held: " + ns.map((n) => { const e = s.byN.get(n); return e && e.drawn > 50 ? `n=${n} b' ${(e.spell / e.drawn).toFixed(2)} drift ${(e.dsum / Math.max(1, e.dcount)).toFixed(2)}` : `n=${n} –`; }).join(" | "));
}

function report(name: string, s: Stats) {
  const r = [...s.rounds].sort((a, b) => a - b);
  const q = (p: number) => r[Math.min(r.length - 1, Math.floor(p * r.length))]!;
  const mean = r.reduce((a, b) => a + b, 0) / r.length;
  const capped = r.filter((x) => x >= CAP).length / r.length;
  const pc = (a: number, b: number) => (b ? ((100 * a) / b).toFixed(0) + "%" : "–");
  console.log(
    `${name.padEnd(34)} median ${String(q(0.5)).padStart(4)} | mean ${mean.toFixed(1).padStart(6)} | p90 ${String(q(0.9)).padStart(4)} | capped ${(100 * capped).toFixed(1)}% | b' all ${(s.spellableDrawn / s.drawn).toFixed(3)} | b' at cap ${(s.spellableFull / Math.max(1, s.drawnFull)).toFixed(3)} | held ${(s.heldSum / s.drawn).toFixed(1)} | choice: correct ${pc(s.correctChoice, s.correctRounds)} burn ${pc(s.burnChoice, s.burnRounds)} discard ${pc(s.discardChoice, s.discards)}`,
  );
}

// ---------------------------------------------------------------- Endless (real reducer)
const freeCoverage = (tiles: readonly Tile[]) => {
  const has = new Array<boolean>(10).fill(false);
  for (const t of tiles) if ("digit" in t) has[t.digit] = true;
  let hit = 0;
  for (const p of PRODUCTS) if (p < 10 ? has[p] : has[Math.floor(p / 10)] && has[p % 10]) hit++;
  return hit / 45;
};

function endlessRun(bot: Bot, stats: Stats, skill = SKILL): number {
  let state: GameState = createTitleState();
  const inv = createInitialInventory(ids);
  state = gameReducer(state, { type: "START_RUN", mode: "endless", equation: generateKindEquation(rand, inv), inventory: inv });
  let lastN: number | null = null;
  while (state.phase !== "gameOver" && state.totalRounds < CAP) {
    if (state.phase === "answering") {
      const eq = state.equation as Equation;
      const len = getAnswerLength(eq);
      const hand = state.inventory;
      const can = canConstruct(hand, eq.product);
      stats.drawn++; stats.heldSum += hand.length;
      if (can) stats.spellableDrawn++;
      if (hand.length === 10) { stats.drawnFull++; if (can) stats.spellableFull++; }
      noteRound(stats, state.round, hand.length, can);
      if (lastN !== null) noteDrift(stats, state.round - 1, lastN, hand.length);
      lastN = hand.length;
      // All legal ordered selections of len distinct tiles.
      const sels: Tile[][] = len === 1 ? hand.map((t) => [t]) : hand.flatMap((a, i) => hand.filter((_, j) => j !== i).map((b) => [a, b]));
      const rest = (sel: Tile[]) => hand.filter((t) => !sel.includes(t));
      const correctSels = sels.filter((sel) => answerMatches(sel, eq.product));
      let chosen: Tile[];
      let correct: boolean;
      const wrong = sels.filter((sel) => !answerMatches(sel, eq.product));
      if (can && (rand() < skill || wrong.length === 0)) {
        stats.correctRounds++;
        const c = choose(correctSels, (sel) => freeCoverage(rest(sel)), bot);
        if (c.distinct) stats.correctChoice++;
        chosen = c.o; correct = true;
      } else {
        stats.burnRounds++;
        const c = choose(wrong, (sel) => freeCoverage(rest(sel)), bot);
        if (c.distinct) stats.burnChoice++;
        chosen = c.o; correct = false;
      }
      for (const t of chosen) state = gameReducer(state, { type: "SELECT_TILE", tileId: t.id });
      if (correct) {
        const rewards = generateRewardTiles(getRewardCount(len), rand, ids, "endless", state.totalRounds);
        const next = gameReducer(state, { type: "SUBMIT_CORRECT", rewardTiles: rewards });
        if (next === state) throw new Error("reducer rejected SUBMIT_CORRECT");
        state = next;
      } else {
        state = gameReducer(state, { type: "SUBMIT_INCORRECT" });
      }
    } else if (state.phase === "overflow") {
      const hand = state.inventory;
      stats.discards++;
      const c = choose(hand, (t) => freeCoverage(hand.filter((x) => x !== t)), bot);
      if (c.distinct) stats.discardChoice++;
      state = gameReducer(state, { type: "TOGGLE_DISCARD", tileId: c.o.id });
    } else if (state.phase === "feedback") {
      state = gameReducer(state, { type: "NEXT_ROUND", equation: generateKindEquation(rand, state.inventory) });
    }
  }
  return state.totalRounds;
}

// ---------------------------------------------------------------- Well (re-implemented)
interface WellConfig { name: string; W: number; H: number; adj: Adjacency; place: "lowest" | "random"; kind: number; opening: () => Grid }

function wellEquation(g: Grid, adj: Adjacency, kind: number): Equation {
  const gate = rand();
  if (gate >= kind) return generateEquation(rand);
  const s = spellable(g, adj, "any");
  const cons = PAIRS.filter(([a, b]) => canSpell(s, a * b));
  if (cons.length === 0) return generateEquation(rand);
  const [a, b] = cons[Math.floor(rand() * cons.length)]!;
  return rand() >= 0.5 ? { left: b, right: a, product: a * b } : { left: a, right: b, product: a * b };
}

function wellRun(cfg: WellConfig, bot: Bot, stats: Stats, skill = SKILL, rewardsOn = true): number {
  let g = cfg.opening();
  const cap = cfg.W * cfg.H;
  let rounds = 0;
  const cov = (x: Grid) => coverage(x, bot === "blind" ? "all" : cfg.adj, "any");
  let lastN: number | null = null;
  while (rounds < CAP) {
    const eq = wellEquation(g, cfg.adj, cfg.kind);
    const len = getAnswerLength(eq);
    if (!canFill(g, len, cfg.adj)) break; // loss: no legal selection fills the slots
    const s = spellable(g, cfg.adj, "any");
    const can = canSpell(s, eq.product);
    const n = tileCount(g);
    stats.drawn++; stats.heldSum += n;
    if (can) stats.spellableDrawn++;
    if (n === cap) { stats.drawnFull++; if (can) stats.spellableFull++; }
    noteRound(stats, rounds + 1, n, can);
    if (lastN !== null) noteDrift(stats, rounds, lastN, n);
    lastN = n;
    const sels = selections(g, len, cfg.adj, "any");
    let chosen: Cell[];
    let correct: boolean;
    const wrongSels = sels.filter((x) => selectionValue(g, x) !== eq.product);
    if (can && (rand() < skill || wrongSels.length === 0)) {
      stats.correctRounds++;
      const c = choose(sels.filter((x) => selectionValue(g, x) === eq.product), (x) => cov(removeCells(g, x)), bot);
      if (c.distinct) stats.correctChoice++;
      chosen = c.o; correct = true;
    } else {
      stats.burnRounds++;
      const c = choose(wrongSels, (x) => cov(removeCells(g, x)), bot);
      if (c.distinct) stats.burnChoice++;
      chosen = c.o; correct = false;
    }
    g = removeCells(g, chosen);
    rounds++;
    if (correct && rewardsOn) {
      const rewards = generateRewardTiles(getRewardCount(len), rand, ids, "endless", rounds).map((t) => ("digit" in t ? t.digit : 0));
      const rail: number[] = [];
      for (const d of rewards) {
        const ok = cfg.place === "lowest" ? placeLowest(g, d) : placeRandomColumn(g, d, rand);
        if (!ok) rail.push(d);
        else stats.rewardsPlaced++;
      }
      if (rail.length > 1) throw new Error("more than one tile past capacity");
      if (rail.length === 1) {
        const d = rail[0]!;
        // Options: discard the rail tile itself, or any seated tile (its stack falls, the rail tile lands on it).
        type Opt = { kind: "rail" } | { kind: "cell"; x: Cell };
        const opts: Opt[] = [{ kind: "rail" }, ...g.cols.flatMap((col, c) => col.map((_, r) => ({ kind: "cell" as const, x: { c, r } })))];
        const result = (o: Opt): Grid => {
          if (o.kind === "rail") return g;
          const next = removeCells(g, [o.x]);
          next.cols[o.x.c]!.push(d);
          return next;
        };
        stats.discards++;
        const c = choose(opts, (o) => cov(result(o)), bot);
        if (c.distinct) stats.discardChoice++;
        g = result(c.o);
      }
    }
  }
  return rounds;
}

// Openings (constants, not seeds). Rows given bottom-first, W per row.
const fromRows = (W: number, H: number, rows: number[][]): Grid => ({ W, H, cols: Array.from({ length: W }, (_, c) => rows.map((row) => row[c]!).filter((d) => d !== undefined)) });
const OPEN_FULL = () => fromRows(5, 3, [[1, 8, 4, 5, 3], [4, 2, 0, 1, 2], [9, 7, 3, 6, 5]]); // 44/45
const OPEN_TEN = () => fromRows(5, 3, [[9, 5, 4, 2, 7], [0, 3, 6, 1, 8]]); // one of each, 34/45
const OPEN_IID = () => { const g: Grid = { W: 5, H: 3, cols: [[], [], [], [], []] }; for (let i = 0; i < 15; i++) placeLowest(g, Math.floor(rand() * 10)); return g; };

const WELLS: WellConfig[] = [
  { name: "Well 5x3 orth, full opening", W: 5, H: 3, adj: "orth", place: "lowest", kind: KIND_EQUATION_RATE, opening: OPEN_FULL },
  { name: "Well 5x3 orth, ten opening", W: 5, H: 3, adj: "orth", place: "lowest", kind: KIND_EQUATION_RATE, opening: OPEN_TEN },
  { name: "Well 5x3 orth, iid opening", W: 5, H: 3, adj: "orth", place: "lowest", kind: KIND_EQUATION_RATE, opening: OPEN_IID },
  ...(process.env.RANDOMCOL ? [{ name: "Well 5x3 orth, random-column", W: 5, H: 3, adj: "orth" as Adjacency, place: "random" as const, kind: KIND_EQUATION_RATE, opening: OPEN_FULL }] : []),
  { name: "Well 5x3 king, full opening", W: 5, H: 3, adj: "king", place: "lowest", kind: KIND_EQUATION_RATE, opening: OPEN_FULL },
];

console.log(`instrument: RUNS=${RUNS} per row, CAP=${CAP} rounds, SKILL=${SKILL}, kind=${KIND_EQUATION_RATE}; rounds = submissions before the loss`);
console.log(`analytic drift at b=0.48: ${(0.48 - 0.52 * 1.71).toFixed(3)} (spec: -0.41)`);

// Negative controls (cases that must fail):
// (1) Well, rewards switched off in this file's own rules: every run must end within its 15 opening tiles.
// (2) Endless on the real reducer, skill 0: a run with no correct answer earns nothing and must end within 10.
//     (A correct answer is still forced when every legal selection is right, e.g. a lone 5 facing 1 x 5,
//     so runs with any forced correct are counted, not bounded.)
{
  const s = newStats();
  let maxW = 0;
  for (let i = 0; i < 500; i++) maxW = Math.max(maxW, wellRun(WELLS[0]!, "greedy", s, 1, false));
  let maxE0 = 0, forced = 0;
  for (let i = 0; i < 500; i++) {
    const before = s.correctRounds;
    const r = endlessRun("greedy", s, 0);
    if (s.correctRounds === before) maxE0 = Math.max(maxE0, r); else forced++;
  }
  console.log(`negative controls (500 runs each): Well with zero rewards max ${maxW} rounds (must be <= 15) | Endless skill 0, runs with no correct answer max ${maxE0} (must be <= 10); ${forced} runs had a forced correct`);
}

for (const bot of (process.env.BOTS ?? "naive,greedy").split(",") as Bot[]) {
  if ((!ONLY || ONLY === "endless") && bot !== "blind") {
    const s = newStats();
    for (let i = 0; i < RUNS; i++) s.rounds.push(endlessRun(bot, s));
    report(`Endless (real reducer), ${bot}`, s);
    reportByN(s, [6, 7, 8, 9, 10]);
  }
  for (const cfg of WELLS) {
    if (ONLY && !cfg.name.includes(ONLY)) continue;
    const s = newStats();
    for (let i = 0; i < RUNS; i++) s.rounds.push(wellRun(cfg, bot, s));
    report(`${cfg.name}, ${bot}`, s);
    reportByN(s, [10, 11, 12, 13, 14, 15]);
  }
}

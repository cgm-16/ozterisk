// Four Winds sim library. Imports the real game modules; re-implements only the
// round loop so capacity schedules, wind twists and boons can vary.
import { gameReducer } from "../../../../../src/game/gameReducer.ts";
import { createInitialInventory } from "../../../../../src/game/factories.ts";
import {
  answerMatches, canConstruct, getOverflowCount, isAtClassicFloor, getRewardCount, tileDigits, getClassicFaceRate,
} from "../../../../../src/game/selectors.ts";
import { generateKindEquation, generateRewardTiles } from "../../../../../src/game/generators.ts";
import type { Digit, FaceSet, GameState, Tile } from "../../../../../src/game/types.ts";

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export type Rng = () => number;

// ---------- pools ----------
export type Pair = readonly [number, number];
export const ALL: Pair[] = [];
for (let a = 1; a <= 9; a++) for (let b = a; b <= 9; b++) ALL.push([a, b]);
export const prod = (p: Pair) => p[0] * p[1];

// ---------- tiles with masks ----------
type MTile = Tile & { m: number; w: number };
const maskOf = (t: Tile) => tileDigits(t).reduce((m, d) => m | (1 << d), 0);
const withMask = (t: Tile): MTile => { const m = maskOf(t); return { ...t, m, w: popcount(m) }; };
function popcount(x: number) { let c = 0; while (x) { x &= x - 1; c++; } return c; }

// Counts of tiles holding each digit, and of tiles holding both of two digits.
type Holds = { hold: Int32Array; both: Int32Array };
function holds(hand: readonly MTile[]): Holds {
  const hold = new Int32Array(10), both = new Int32Array(100);
  for (const t of hand) addMask(hold, both, t.m, 1);
  return { hold, both };
}
function addMask(hold: Int32Array, both: Int32Array, m: number, s: number) {
  for (let d = 0; d < 10; d++) if (m & (1 << d)) {
    hold[d] += s;
    for (let e = 0; e < 10; e++) if (e !== d && m & (1 << e)) both[d * 10 + e] += s;
  }
}
// Hall's condition for one or two slots: equivalent to canConstruct (checked in calib).
export function spell(h: Holds, product: number): boolean {
  if (product < 10) return h.hold[product] > 0;
  const d1 = Math.floor(product / 10), d2 = product % 10;
  const c1 = h.hold[d1], c2 = h.hold[d2];
  return c1 >= 1 && c2 >= 1 && c1 + c2 - h.both[d1 * 10 + d2] >= 2;
}
export function spellHand(hand: readonly Tile[], product: number) { return spell(holds(hand.map(withMask)), product); }

// ---------- reward draw (face table as generators.ts) ----------
const FACES: Array<[FaceSet, number]> = [
  [{ face: "wild" }, 12], [{ face: "odd" }, 24], [{ face: "even" }, 24], [{ face: "low" }, 24], [{ face: "high" }, 24],
  ...([1, 2, 3, 4, 5, 6, 7, 8] as const).map((centre) => [{ face: "nbr" as const, centre }, 5] as [FaceSet, number]),
];
function drawFace(r: number): FaceSet { let x = Math.floor(r * 120); for (const [f, w] of FACES) { if (x < w) return f; x -= w; } return FACES[0][0]; }
function drawDigit(r: number, supply?: number[]): Digit {
  if (!supply) return Math.min(9, Math.floor(r * 10)) as Digit;
  const tot = supply.reduce((s, x) => s + x, 0); let x = r * tot;
  for (let d = 0; d < 10; d++) { if (x < supply[d]) return d as Digit; x -= supply[d]; }
  return 9;
}

// ---------- bot ----------
// Weighted pairs the bot cares about (its coverage objective).
export type Weights = Array<[number, number]>; // [product, weight]
export const uniformWeights = (pool: readonly Pair[]): Weights => pool.map((p) => [prod(p), 1 / pool.length]);
function coverage(h: Holds, W: Weights) { let c = 0; for (const [p, w] of W) if (spell(h, p)) c += w; return c; }

// Exact digits before faces, narrowest face first (T84's rule), as an assignment.
function chooseAnswer(hand: MTile[], product: number): number[] | null {
  if (product < 10) {
    let best = -1;
    for (let i = 0; i < hand.length; i++) if (hand[i].m & (1 << product) && (best < 0 || hand[i].w < hand[best].w)) best = i;
    return best < 0 ? null : [best];
  }
  const d1 = Math.floor(product / 10), d2 = product % 10;
  let bi = -1, bj = -1, bw = 99;
  for (let i = 0; i < hand.length; i++) if (hand[i].m & (1 << d1))
    for (let j = 0; j < hand.length; j++) if (j !== i && hand[j].m & (1 << d2) && hand[i].w + hand[j].w < bw) { bi = i; bj = j; bw = hand[i].w + hand[j].w; }
  return bi < 0 ? null : [bi, bj];
}
// Greedy: remove k tiles, each the one whose loss costs least coverage; ties go to
// the narrower tile (digits before faces), then to a random one.
function chooseRemovals(hand: MTile[], k: number, W: Weights, rng: Rng): number[] {
  const h = holds(hand); const gone = new Set<number>(); const out: number[] = [];
  for (let step = 0; step < k; step++) {
    let best = -1, bestCov = -1, bestW = 99, bestR = 0; const seen = new Set<string>();
    for (let i = 0; i < hand.length; i++) {
      if (gone.has(i)) continue;
      const key = String(hand[i].m); if (seen.has(key)) continue; seen.add(key);
      addMask(h.hold, h.both, hand[i].m, -1); const c = coverage(h, W); addMask(h.hold, h.both, hand[i].m, 1);
      const r = rng();
      if (c > bestCov + 1e-12 || (Math.abs(c - bestCov) <= 1e-12 && (hand[i].w < bestW || (hand[i].w === bestW && r < bestR)))) { best = i; bestCov = c; bestW = hand[i].w; bestR = r; }
    }
    gone.add(best); out.push(best); addMask(h.hold, h.both, hand[best].m, -1);
  }
  return out;
}

// ---------- configurable run (the re-implemented loop) ----------
export type Wind = { name: string; pool: readonly Pair[]; supply?: number[]; faceMul?: number; capDelta?: number };
export type Boon = { id: string; cap?: number; faceAdd?: number; noFaces?: boolean; grant?: FaceSet[]; calm?: boolean };
export type Config = {
  start: number; totalSubs: number; subsPerWind: number;
  capacityAt: (n: number) => number;        // base capacity after n submissions
  faceAt: (n: number) => number;            // base face rate for the submission after n
  winds: Wind[];                            // one per wind (length totalSubs / subsPerWind)
  boons?: (Boon | null)[];                  // taken at landings 1..3
  skill: number; bot: "naive" | "aware"; kind?: number; zeroRewards?: boolean; horizon?: number;
};
export type RunStats = {
  win: boolean; endWind: number;
  draws: number[]; buildable: number[]; subs: number[]; dHand: number[]; startHand: number[]; endHand: number[];
  fullAtDraw: number[]; survive: number[][]; faces: number;
};

export function runOnce(cfg: Config, rng: Rng): RunStats {
  let id = 0; const ids = () => `t${id++}`;
  let hand: MTile[] = createInitialInventory(ids, cfg.start).map(withMask);
  cfg = { ...cfg, winds: [...cfg.winds] }; // a calm boon rewrites this run's next wind
  const nW = cfg.winds.length, kind = cfg.kind ?? 0.2, H = cfg.horizon ?? 4;
  const z = () => new Array(nW).fill(0);
  const st: RunStats = { win: false, endWind: -1, draws: z(), buildable: z(), subs: z(), dHand: z(), startHand: z(), endHand: z(), fullAtDraw: z(), survive: [], faces: 0 };
  let capB = 0, faceB = 0, noFaces = false, n = 0;
  const windAt = (k: number) => Math.min(nW - 1, Math.floor(k / cfg.subsPerWind));
  const cap = (k: number) => cfg.capacityAt(k) + (cfg.winds[windAt(k)].capDelta ?? 0) + capB;
  const weights = (): Weights => {
    if (cfg.bot === "naive") return uniformWeights(ALL);
    const w = windAt(n), cur = cfg.winds[w], next = cfg.winds[w + 1];
    const rem = cfg.subsPerWind - (n - w * cfg.subsPerWind);
    const out: Weights = cur.pool.map((p) => [prod(p), rem / cur.pool.length]);
    if (next) for (const p of next.pool) out.push([prod(p), Math.min(H, cfg.subsPerWind) / next.pool.length]);
    return out;
  };
  const trim = (at: number) => { const k = hand.length - cap(at); if (k > 0) { const rm = new Set(chooseRemovals(hand, k, weights(), rng)); hand = hand.filter((_, i) => !rm.has(i)); } };
  let windIds: Set<string> = new Set(hand.map((t) => t.id)); let surv: number[] = [];
  st.startHand[0] = hand.length;
  for (;;) {
    if (n >= cfg.totalSubs) { st.win = hand.length >= 1; st.endWind = nW; break; }
    const w = windAt(n), W = cfg.winds[w];
    // equation draw: kind gate over the wind's pool, then uniform (generateKindEquation's shape)
    const h = holds(hand);
    let pool = W.pool;
    if (rng() < kind) { const c = W.pool.filter((p) => spell(h, prod(p))); if (c.length) pool = c; }
    const product = prod(pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))]);
    const len = product >= 10 ? 2 : 1;
    if (hand.length < len) { st.endWind = w; break; }
    st.draws[w]++; if (hand.length >= cap(n)) st.fullAtDraw[w]++;
    const can = spell(h, product); if (can) st.buildable[w]++;
    const before = hand.length;
    let spent: number[];
    const correct = can && rng() < cfg.skill;
    if (correct) spent = chooseAnswer(hand, product)!; else spent = chooseRemovals(hand, len, weights(), rng);
    const sp = new Set(spent); hand = hand.filter((_, i) => !sp.has(i));
    if (correct && !cfg.zeroRewards) {
      const fr = noFaces ? 0 : Math.min(1, cfg.faceAt(n) * (W.faceMul ?? 1) + faceB);
      for (let i = 0; i < len + 1; i++) {
        if (rng() < fr) { hand.push(withMask({ ...drawFace(rng()), id: ids(), isNew: true })); st.faces++; }
        else hand.push(withMask({ digit: drawDigit(rng(), W.supply), id: ids(), isNew: true }));
      }
    }
    n++;
    // a wind's last submission is still that wind's: the step-down waits for the landing, after the boon
    trim(n % cfg.subsPerWind === 0 && n < cfg.totalSubs ? n - 1 : n);
    st.subs[w]++; st.dHand[w] += hand.length - before;
    const inWind = n - w * cfg.subsPerWind;
    { const alive = hand.filter((t) => windIds.has(t.id)).length; surv[inWind - 1] = alive / Math.max(1, windIds.size); }
    if (n % cfg.subsPerWind === 0) {
      st.endHand[w] = hand.length; st.survive.push(surv); surv = [];
      if (n < cfg.totalSubs) { // landing: boon, then pack to the next wind's capacity
        const b = cfg.boons?.[n / cfg.subsPerWind - 1];
        if (b) {
          capB += b.cap ?? 0; faceB += b.faceAdd ?? 0; if (b.noFaces) noFaces = true;
          for (const f of b.grant ?? []) hand.push(withMask({ ...f, id: ids(), isNew: true }));
          if (b.calm) { const k = n / cfg.subsPerWind; cfg.winds[k] = { name: cfg.winds[k].name, pool: ALL }; }
        }
        trim(n);
        const nw = windAt(n); st.startHand[nw] = hand.length; windIds = new Set(hand.map((t) => t.id));
      }
    }
  }
  return st;
}

// ---------- the real reducer, Classic, same bot (calibration) ----------
export function runRealClassic(skill: number, rng: Rng): { win: boolean; subs: number } {
  let id = 0; const ids = () => `t${id++}`;
  const inventory = createInitialInventory(ids, 20);
  let s: GameState = gameReducer({} as GameState, { type: "START_RUN", mode: "classic", equation: generateKindEquation(rng, inventory), inventory });
  const W = uniformWeights(ALL);
  for (let guard = 0; guard < 500; guard++) {
    if (s.phase === "gameOver") return { win: isAtClassicFloor(s) && s.inventory.length > 0, subs: s.totalRounds };
    if (s.phase === "answering") {
      const hand = s.inventory.map(withMask), product = s.equation!.product, len = product >= 10 ? 2 : 1;
      const can = canConstruct(s.inventory, product);
      if (can && rng() < skill) {
        for (const i of chooseAnswer(hand, product)!) s = gameReducer(s, { type: "SELECT_TILE", tileId: hand[i].id });
        s = gameReducer(s, { type: "SUBMIT_CORRECT", rewardTiles: generateRewardTiles(getRewardCount(len), rng, ids, "classic", s.totalRounds) });
      } else {
        let pick = chooseRemovals(hand, len, W, rng).map((i) => hand[i]);
        if (answerMatches(pick, product)) pick = pick.reverse();
        if (answerMatches(pick, product)) { // a face set that spells it either way: spend something else
          const other = hand.find((t) => !pick.includes(t) && !answerMatches(len === 1 ? [t] : [pick[0], t], product));
          if (other) pick = len === 1 ? [other] : [pick[0], other];
        }
        for (const t of pick) s = gameReducer(s, { type: "SELECT_TILE", tileId: t.id });
        const t2 = gameReducer(s, { type: "SUBMIT_INCORRECT" });
        if (t2 === s) { // could not miss: answer it
          s = gameReducer(s, { type: "SUBMIT_CORRECT", rewardTiles: generateRewardTiles(getRewardCount(len), rng, ids, "classic", s.totalRounds) });
        } else s = t2;
      }
    } else if (s.phase === "overflow") {
      const hand = s.inventory.map(withMask);
      for (const i of chooseRemovals(hand, getOverflowCount(s), W, rng)) s = gameReducer(s, { type: "TOGGLE_DISCARD", tileId: hand[i].id });
    } else if (s.phase === "feedback") {
      s = gameReducer(s, { type: "NEXT_ROUND", equation: isAtClassicFloor(s) ? s.equation! : generateKindEquation(rng, s.inventory) });
    }
  }
  throw new Error("runaway run");
}

export { canConstruct, getClassicFaceRate };
export type { Tile, Digit, FaceSet };

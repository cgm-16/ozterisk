// Kiln research sim. Real generators/selectors/factories from the repo; only the
// kiln (firing) and the bots are new. A seeded PRNG drives the *sim* so variants
// are comparable; the product's seed ban is untouched.
import { generateKindEquation, generateRewardTiles } from "../../../../../src/game/generators.ts";
import { answerMatches, canConstruct, getAnswerLength, getCapacity, getRewardCount, tileDigits } from "../../../../../src/game/selectors.ts";
import { createInitialInventory } from "../../../../../src/game/factories.ts";
import { CLASSIC_FLOOR, CLASSIC_START_CAPACITY, INVENTORY_CAPACITY, KIND_EQUATION_RATE } from "../../../../../src/game/balance.ts";
import type { Equation, FaceSet, GameMode, Tile } from "../../../../../src/game/types.ts";

export const KIND = KIND_EQUATION_RATE;

export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const memo = new WeakMap<object, number>();
export function maskOf(t: Tile): number {
  let m = memo.get(t);
  if (m === undefined) {
    m = 0;
    for (const d of tileDigits(t)) m |= 1 << d;
    memo.set(t, m);
  }
  return m;
}
export const isFace = (t: Tile) => !("digit" in t);
export const pop = (m: number) => { let c = 0; while (m) { m &= m - 1; c++; } return c; };

// The 45 unordered pairs as product weights: one-digit by digit, two-digit by (tens, units).
const ONE = new Float64Array(10);
const TWO: Array<[number, number, number]> = [];
{
  const two = new Map<number, number>();
  for (let a = 1; a <= 9; a++) for (let b = a; b <= 9; b++) {
    const p = a * b;
    if (p < 10) ONE[p]++; else two.set(p, (two.get(p) ?? 0) + 1);
  }
  for (const [p, w] of two) TWO.push([Math.floor(p / 10), p % 10, w]);
}
const cnt = new Int32Array(10);
const who = new Int32Array(10);
// Unbiased buildable share of the 45 pairs. A two-digit product fails only when
// a digit is uncovered, or both digits are covered by one and the same tile.
export function fastB(masks: ArrayLike<number>): number {
  cnt.fill(0); who.fill(-1);
  for (let i = 0; i < masks.length; i++) {
    const m = masks[i];
    for (let d = 0; d < 10; d++) if ((m >> d) & 1) { cnt[d]++; who[d] = i; }
  }
  let hits = 0;
  for (let d = 1; d < 10; d++) if (cnt[d] > 0) hits += ONE[d];
  for (const [x, y, w] of TWO) {
    if (cnt[x] > 0 && cnt[y] > 0 && !(cnt[x] === 1 && cnt[y] === 1 && who[x] === who[y])) hits += w;
  }
  return hits / 45;
}
// Kind-biased rate (product.md §1.2): spellable draw with p, else uniform; an
// empty constructible set falls back to uniform.
export function bPrime(masks: ArrayLike<number>): number {
  const b = fastB(masks);
  return b > 0 ? KIND + (1 - KIND) * b : 0;
}

// How often each digit is needed across the 45 pairs.
const IMP = new Float64Array(10);
for (let a = 1; a <= 9; a++) for (let b = a; b <= 9; b++) for (const ch of String(a * b)) IMP[Number(ch)]++;
// The smart bot's hand value: biased buildable rate, with ties broken toward keeping
// spare copies of the digits products need (diminishing returns per copy).
export function handValue(masks: ArrayLike<number>): number {
  let robust = 0;
  for (let d = 0; d < 10; d++) {
    let c = 0;
    for (let i = 0; i < masks.length; i++) if ((masks[i] >> d) & 1) c++;
    robust += IMP[d] * (1 - 0.5 ** c);
  }
  return bPrime(masks) + 1e-4 * robust;
}

export const FACE_OF_MASK = new Map<number, FaceSet>();
FACE_OF_MASK.set(0x3ff, { face: "wild" });
FACE_OF_MASK.set(0b1010101010, { face: "odd" });
FACE_OF_MASK.set(0b0101010101, { face: "even" });
FACE_OF_MASK.set(0b0000011111, { face: "low" });
FACE_OF_MASK.set(0b1111100000, { face: "high" });
for (let c = 1; c <= 8; c++) FACE_OF_MASK.set(0b111 << (c - 1), { face: "nbr", centre: c as 1 });
const FACE_MASKS = [...FACE_OF_MASK.keys()];
const parityMask = (d: number) => (d % 2 ? 0b1010101010 : 0b0101010101);

// ---------------------------------------------------------------- rules
export type Recipes =
  | "unionDigits" // digits whose set together is exactly a face: chow -> Neighbours, five -> O/E/Low/High
  | "unionAll" // any tiles, faces included, union exactly a face (O+E -> wild, ...)
  | "pairNbr" // seed: two consecutive digits -> Neighbours (invents one digit)
  | "pungParity" // seed: three of a kind -> O/E (invents four digits)
  | "seeds" // pairNbr + pungParity + kan (four of a kind -> wild)
  | "gapNbr" // two digits a step apart (c-1, c+1) -> the Neighbours between them (invents the middle)
  | "gapKan" // gapNbr, plus four of a kind -> wild
  | "gapLadder"; // gapNbr, plus two faces whose union is exactly a face (0-2 + 2-4 -> Low, Low + High -> wild, O + E -> wild)
export interface Kiln {
  recipes: Recipes;
  turns: number; // 0: the face is seated at once; k: it sits in the kiln, holding a socket, for k submissions
  faceCap: number; // most crafted faces held (rack + kiln)
}
export interface Rules { mode: GameMode; faceRewards: boolean; kiln: Kiln | null; roundCap: number; noRewards?: boolean; capacity?: number; }
export interface Policy {
  kind: "t84" | "smart";
  skill: number;
  evalMode: "myopic" | "potential";
  fire: "never" | "best" | "greedy";
  // How a face still in the kiln is valued when deciding to fire: present (optimistic),
  // absent (pessimistic), or fire only when it adds a digit the hand lacks (middleAbsent).
  fireRule?: "optimistic" | "pessimistic" | "middleAbsent" | "randomPick";
}

type Firing = { idx: number[]; out: number };
export function legalFirings(inv: Tile[], recipes: Recipes): Firing[] {
  const masks = inv.map(maskOf);
  const out: Firing[] = [];
  const digitIdx = (d: number) => masks.flatMap((m, i) => (!isFace(inv[i]) && m === 1 << d ? [i] : []));
  if (recipes === "unionDigits" || recipes === "unionAll") {
    const rep = new Map<number, number>();
    masks.forEach((m, i) => { if (recipes === "unionDigits" && isFace(inv[i])) return; if (!rep.has(m)) rep.set(m, i); });
    const ms = [...rep.keys()].sort((a, b) => a - b);
    for (const F of FACE_MASKS) {
      const sub = ms.filter((m) => (m & ~F) === 0 && m !== F);
      const k = sub.length;
      if (k < 2) continue;
      for (let s = 3; s < 1 << k; s++) {
        if ((s & (s - 1)) === 0) continue;
        let u = 0;
        for (let j = 0; j < k; j++) if ((s >> j) & 1) u |= sub[j];
        if (u !== F) continue;
        let minimal = true;
        for (let j = 0; j < k && minimal; j++) {
          if (!((s >> j) & 1)) continue;
          let u2 = 0;
          for (let q = 0; q < k; q++) if (q !== j && (s >> q) & 1) u2 |= sub[q];
          if (u2 === F) minimal = false;
        }
        if (minimal) out.push({ idx: sub.filter((_, j) => (s >> j) & 1).map((m) => rep.get(m)!), out: F });
      }
    }
    return out;
  }
  if (recipes === "pairNbr" || recipes === "seeds") {
    for (let c = 0; c <= 8; c++) {
      const a = digitIdx(c), b = digitIdx(c + 1);
      if (a.length && b.length) out.push({ idx: [a[0], b[0]], out: 0b111 << (Math.max(1, c) - 1) });
    }
  }
  if (recipes === "gapKan") {
    for (let d = 0; d <= 9; d++) { const a = digitIdx(d); if (a.length >= 4) out.push({ idx: a.slice(0, 4), out: 0x3ff }); }
  }
  if (recipes === "gapNbr" || recipes === "gapLadder" || recipes === "gapKan") {
    for (let c = 1; c <= 8; c++) {
      const a = digitIdx(c - 1), b = digitIdx(c + 1);
      if (a.length && b.length) out.push({ idx: [a[0], b[0]], out: 0b111 << (c - 1) });
    }
  }
  if (recipes === "gapLadder") {
    const faceIdx = masks.flatMap((m, i) => (isFace(inv[i]) ? [i] : []));
    for (let x = 0; x < faceIdx.length; x++) for (let y = x + 1; y < faceIdx.length; y++) {
      const ma = masks[faceIdx[x]], mb = masks[faceIdx[y]], u = ma | mb;
      if (u !== ma && u !== mb && FACE_OF_MASK.has(u)) out.push({ idx: [faceIdx[x], faceIdx[y]], out: u });
    }
  }
  if (recipes === "pungParity" || recipes === "seeds") {
    for (let d = 0; d <= 9; d++) {
      const a = digitIdx(d);
      if (a.length >= 3) out.push({ idx: a.slice(0, 3), out: parityMask(d) });
      if (recipes === "seeds" && a.length >= 4) out.push({ idx: a.slice(0, 4), out: 0x3ff });
    }
  }
  return out;
}

// ---------------------------------------------------------------- bot helpers
// Candidate tile choices are enumerated over distinct masks in ascending order
// and the first strict maximum wins, so a choice depends only on the hand's
// multiset — the same in this loop and in the reducer-driven check.
function distinct(inv: Tile[], skip: Set<number> = new Set()): Array<[number, number[]]> {
  const g = new Map<number, number[]>();
  inv.forEach((t, i) => { if (skip.has(i)) return; const m = maskOf(t); g.set(m, [...(g.get(m) ?? []), i]); });
  return [...g.entries()].sort((a, b) => a[0] - b[0]);
}
const without = (inv: Tile[], idx: number[]) => { const s = new Set(idx); return inv.filter((_, i) => !s.has(i)); };

// Every way to remove `n` tiles (n <= 2), as index lists, one per distinct mask choice.
function removals(inv: Tile[], n: number): number[][] {
  const g = distinct(inv);
  if (n === 1) return g.map(([, ix]) => [ix[0]]);
  const res: number[][] = [];
  for (let a = 0; a < g.length; a++) {
    if (g[a][1].length >= 2) res.push([g[a][1][0], g[a][1][1]]);
    for (let b = a + 1; b < g.length; b++) res.push([g[a][1][0], g[b][1][0]]);
  }
  return res;
}

export interface Ctx { mc: () => number; policy: Policy; }

function topUpValue(masks: number[], slots: number, ctx: Ctx): number {
  if (slots <= 0 || ctx.policy.evalMode === "myopic") return handValue(masks);
  if (slots === 1) { let s = 0; for (let d = 0; d < 10; d++) s += handValue([...masks, 1 << d]); return s / 10; }
  if (slots === 2) {
    let s = 0;
    for (let a = 0; a < 10; a++) for (let b = 0; b < 10; b++) s += handValue([...masks, 1 << a, 1 << b]);
    return s / 100;
  }
  let s = 0;
  const N = 24;
  for (let k = 0; k < N; k++) {
    const add = Array.from({ length: slots }, () => 1 << Math.floor(ctx.mc() * 10));
    s += handValue([...masks, ...add]);
  }
  return s / N;
}

// Best removal of n tiles by the next hand's value.
function bestRemoval(inv: Tile[], n: number, value: (rest: Tile[]) => number): number[] {
  if (n <= 0) return [];
  if (n > 2) { // sequential, rarely used
    const first = bestRemoval(inv, 1, value);
    const rest = without(inv, first);
    const more = bestRemoval(rest, n - 1, value).map((i) => inv.indexOf(rest[i]));
    return [...first, ...more];
  }
  let best: number[] = [], bv = -1;
  for (const r of removals(inv, n)) { const v = value(without(inv, r)); if (v > bv) { bv = v; best = r; } }
  return best;
}

// ---------------------------------------------------------------- answering
// Returns the selected tiles in slot order and whether that is a correct answer.
export function chooseAnswer(inv: Tile[], eq: Equation, wantCorrect: boolean, policy: Policy): Tile[] {
  const digits = String(eq.product).split("").map(Number);
  const n = digits.length;
  const g = distinct(inv);
  const cands: number[][] = [];
  if (n === 1) for (const [, ix] of g) cands.push([ix[0]]);
  else for (const [ma, ia] of g) for (const [mb, ib] of g) {
    if (ma === mb) { if (ia.length >= 2) cands.push([ia[0], ia[1]]); } else cands.push([ia[0], ib[0]]);
  }
  const sel = (c: number[]) => c.map((i) => inv[i]);
  const ok = cands.filter((c) => answerMatches(sel(c), eq.product) === wantCorrect);
  if (ok.length === 0) return [];
  let best = ok[0], bv = -Infinity;
  for (const c of ok) {
    let v: number;
    if (policy.kind === "t84") {
      if (wantCorrect) { // exact digits before the narrowest face
        const faces = c.filter((i) => isFace(inv[i]));
        v = -(faces.length * 100 + faces.reduce((s, i) => s + pop(maskOf(inv[i])), 0));
      } else { // spend the most redundant digits, faces last
        const copies = (i: number) => (isFace(inv[i]) ? -100 : inv.filter((t) => maskOf(t) === maskOf(inv[i])).length);
        v = c.reduce((s, i) => s + copies(i), 0);
      }
    } else v = handValue(without(inv, c).map(maskOf));
    if (v > bv) { bv = v; best = c; }
  }
  void digits;
  return sel(best);
}

// ---------------------------------------------------------------- overflow
export interface KilnState { face: Tile | null; left: number; }
// Decision-density counters (read by final.ts).
export const STATS = { overflows: 0, choiceExists: 0, fired: 0, pung3: 0, kan4: 0 };
// Resolves an overflow in place of the TOGGLE_DISCARD marks. Returns the new rack
// and, when a firing happened, the fired face (seated or held in the kiln).
export function resolveOverflow(
  inv: Tile[], liveCap: number, rules: Rules, kiln: KilnState, ctx: Ctx, newId: () => string,
): { inv: Tile[]; fired: Tile | null; pending: boolean } {
  const policy = ctx.policy;
  const kilnBusy = kiln.face !== null;
  STATS.overflows++;
  { const c = new Map<number, number>(); for (const t of inv) if (!isFace(t)) c.set(maskOf(t), (c.get(maskOf(t)) ?? 0) + 1);
    const mx = Math.max(0, ...c.values()); if (mx >= 3) STATS.pung3++; if (mx >= 4) STATS.kan4++; }
  if (rules.kiln && !kilnBusy && legalFirings(inv, rules.kiln.recipes).length > 0) STATS.choiceExists++;
  const capNow = liveCap - (kilnBusy ? 1 : 0);
  const excess = inv.length - capNow;
  if (policy.kind === "t84") { // discards the digits it holds the most copies of, faces last
    let rest = inv;
    for (let k = 0; k < excess; k++) {
      let bi = -1, bc = -Infinity;
      rest.forEach((t, i) => {
        const c = isFace(t) ? -100 : rest.filter((u) => maskOf(u) === maskOf(t)).length;
        if (c > bc || (c === bc && maskOf(t) < maskOf(rest[bi]))) { bc = c; bi = i; }
      });
      rest = without(rest, [bi]);
    }
    return { inv: rest, fired: null, pending: false };
  }
  // A face still in the kiln holds a socket and will be in hand, so it counts.
  const held = kilnBusy ? [maskOf(kiln.face!)] : [];
  const value = (rest: Tile[], extra: number[] = []) => {
    const all = [...rest.map(maskOf), ...held, ...extra];
    return topUpValue(all, liveCap - all.length, ctx);
  };
  type Opt = { inv: Tile[]; v: number; fired: Tile | null; pending: boolean };
  const r = bestRemoval(inv, excess, (rest) => value(rest));
  const discard: Opt = { inv: without(inv, r), v: value(without(inv, r)), fired: null, pending: false };
  let bestFire: Opt | null = null;
  const k = rules.kiln;
  const crafted = (tiles: Tile[]) => tiles.filter((t) => isFace(t)).length + (kilnBusy ? 1 : 0);
  if (k && policy.fire !== "never" && !kilnBusy) {
    for (const f of legalFirings(inv, k.recipes)) {
      const face: Tile = { ...FACE_OF_MASK.get(f.out)!, id: "probe", isNew: true } as Tile;
      let rest = without(inv, f.idx);
      if (crafted(rest) + 1 > k.faceCap) continue;
      const pending = k.turns > 0;
      const cap = pending ? liveCap - 1 : liveCap;
      if (!pending) rest = [...rest, face];
      if (rest.length > cap) {
        const extraFace = pending ? [maskOf(face)] : [];
        const more = bestRemoval(rest, rest.length - cap, (x) => value(x, extraFace));
        if (!pending && more.some((i) => rest[i] === face)) continue; // never fire then throw the face away
        rest = without(rest, more);
      }
      const rule = policy.fireRule ?? "optimistic";
      if (rule === "middleAbsent") {
        const covered = inv.reduce((u, t) => u | maskOf(t), 0) | (kiln.face ? maskOf(kiln.face) : 0);
        if ((f.out & ~covered) === 0) continue;
      }
      const v = value(rest, pending && rule !== "pessimistic" ? [maskOf(face)] : []);
      if (!bestFire || v > bestFire.v) bestFire = { inv: rest, v, fired: face, pending };
    }
  }
  if (bestFire && policy.fireRule === "randomPick" && k && !kilnBusy) {
    // Fire whenever possible, but a random legal recipe rather than the best one.
    const all = legalFirings(inv, k.recipes).filter((f) => crafted(without(inv, f.idx)) + 1 <= k.faceCap);
    const f = all[Math.floor(ctx.mc() * all.length)];
    const face = { ...FACE_OF_MASK.get(f.out)!, id: "probe", isNew: true } as Tile;
    let rest = without(inv, f.idx);
    const pending = k.turns > 0;
    if (!pending) rest = [...rest, face];
    const cap = pending ? liveCap - 1 : liveCap;
    if (rest.length > cap) rest = without(rest, bestRemoval(rest, rest.length - cap, (x) => value(x, pending ? [maskOf(face)] : [])));
    bestFire = { inv: rest, v: Infinity, fired: face, pending };
  }
  let pick = discard;
  if (bestFire && (policy.fire === "greedy" || bestFire.v > discard.v)) pick = bestFire;
  if (pick.fired) {
    STATS.fired++;
    const real = { ...pick.fired, id: newId() } as Tile;
    const invOut = pick.pending ? pick.inv : pick.inv.map((t) => (t === pick.fired ? real : t));
    return { inv: invOut, fired: real, pending: pick.pending };
  }
  return { inv: pick.inv, fired: null, pending: false };
}

// ---------------------------------------------------------------- the run
export interface RunResult {
  rounds: number; score: number; win: boolean; capped: boolean;
  drawn: number; buildable: number; firings: number; craftedHeldSum: number; atCeil: number; buildAtCeil: number;
  faceKinds: Record<string, number>;
}

export function playRun(rules: Rules, policy: Policy, seed: number): RunResult {
  const rand = rng(seed);
  const botRand = rng(seed ^ 0x9e3779b9);
  const ctx: Ctx = { mc: rng(seed ^ 0x51ed270b), policy };
  let nid = 0;
  const ids = () => `t${nid++}`;
  const startCap = rules.mode === "classic" ? CLASSIC_START_CAPACITY : (rules.capacity ?? INVENTORY_CAPACITY);
  const capOf = (n: number) => (rules.mode === "endless" && rules.capacity ? rules.capacity : getCapacity(rules.mode, n));
  let inv: Tile[] = createInitialInventory(ids, startCap);
  let totalRounds = 0, score = 0, drawn = 0, buildable = 0, firings = 0, craftedHeldSum = 0, atCeil = 0, buildAtCeil = 0;
  const faceKinds: Record<string, number> = {};
  const kiln: KilnState = { face: null, left: 0 };
  let eq: Equation = generateKindEquation(rand, inv);
  const rewardMode: GameMode = rules.faceRewards ? "classic" : "endless";
  const done = (win: boolean, capped = false): RunResult =>
    ({ rounds: totalRounds, score, win, capped, drawn, buildable, firings, craftedHeldSum, faceKinds, atCeil, buildAtCeil });
  for (;;) {
    if (inv.length < getAnswerLength(eq)) return done(false);
    drawn++;
    (globalThis as { __trace?: (inv: Tile[], eq: Equation, round: number) => void }).__trace?.(inv, eq, totalRounds);
    const can = canConstruct(inv, eq.product);
    if (can) buildable++;
    if (inv.length + (kiln.face ? 1 : 0) >= capOf(totalRounds)) { atCeil++; if (can) buildAtCeil++; }
    craftedHeldSum += inv.filter(isFace).length + (kiln.face ? 1 : 0);
    let correct = can && botRand() < policy.skill;
    let sel = chooseAnswer(inv, eq, correct, policy);
    if (sel.length === 0) { correct = !correct; sel = chooseAnswer(inv, eq, correct, policy); }
    inv = inv.filter((t) => !sel.includes(t));
    if (correct) {
      score++;
      const rewards = rules.noRewards ? [] : generateRewardTiles(getRewardCount(sel.length), rand, ids, rewardMode, totalRounds);
      inv = [...inv, ...rewards];
    }
    totalRounds++;
    if (kiln.face && --kiln.left <= 0) { inv = [...inv, kiln.face]; kiln.face = null; }
    const liveCap = capOf(totalRounds);
    const capNow = liveCap - (kiln.face ? 1 : 0);
    const fireNow = (r: ReturnType<typeof resolveOverflow>) => {
      inv = r.inv;
      if (r.fired) {
        firings++;
        const kind = "face" in r.fired ? (r.fired.face === "nbr" ? "nbr" : r.fired.face) : "?";
        faceKinds[kind] = (faceKinds[kind] ?? 0) + 1;
        if (r.pending) { kiln.face = r.fired; kiln.left = rules.kiln!.turns; }
      }
    };
    if (inv.length > capNow) fireNow(resolveOverflow(inv, liveCap, rules, kiln, ctx, ids));
    if (rules.mode === "classic" && getCapacity("classic", totalRounds) <= CLASSIC_FLOOR) return done(inv.length > 0);
    if (totalRounds >= rules.roundCap) return done(true, true);
    eq = generateKindEquation(rand, inv);
  }
}

export function summarize(results: RunResult[]) {
  const n = results.length;
  const rounds = results.map((r) => r.rounds).sort((a, b) => a - b);
  const q = (p: number) => rounds[Math.min(n - 1, Math.floor(p * n))];
  const drawn = results.reduce((s, r) => s + r.drawn, 0);
  const built = results.reduce((s, r) => s + r.buildable, 0);
  const kinds: Record<string, number> = {};
  for (const r of results) for (const [k, v] of Object.entries(r.faceKinds)) kinds[k] = (kinds[k] ?? 0) + v;
  return {
    runs: n,
    win: results.filter((r) => r.win).length / n,
    capped: results.filter((r) => r.capped).length / n,
    meanRounds: rounds.reduce((s, x) => s + x, 0) / n,
    p10: q(0.1), median: q(0.5), p90: q(0.9),
    bMeasured: built / drawn,
    bAtCeil: results.reduce((s, r) => s + r.buildAtCeil, 0) / Math.max(1, results.reduce((s, r) => s + r.atCeil, 0)),
    ceilShare: results.reduce((s, r) => s + r.atCeil, 0) / drawn,
    firingsPer100: (100 * results.reduce((s, r) => s + r.firings, 0)) / results.reduce((s, r) => s + r.rounds, 0),
    craftedHeld: results.reduce((s, r) => s + r.craftedHeldSum, 0) / drawn,
    kinds,
  };
}

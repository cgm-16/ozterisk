// Exhaustive solver for a face-up ozterisk table (research tooling, not repo code).
// A table: capacity, opening hand, K equations, and rewards that are either
// printed per row (model "P": row k pays exactly len_k + 1 tiles) or drawn from
// one face-up wall (model "W": each correct answer takes the next len + 1).
// State = (step, hand as digit counts, wall pointer). Memoized DFS.
// Rules mirrored from product.md: one submission per equation; correct spends the
// product's digits and gains len+1; miss spends any len tiles that do not spell the
// product (1-digit: any tile but the product's digit; 2-digit: any pair, since the
// product's own pair can be submitted reversed); overflow discards any held tile
// (seated or rail); the run ends after K submissions, or earlier when the hand holds
// fewer tiles than the next answer needs.

export type Model = "P" | "W";
export interface Table {
  model: Model;
  cap: number;
  hand: number[];            // opening digits
  eqs: [number, number][];   // [left, right] in display order
  bounty?: number[][];       // model P: row k pays these len_k + 1 digits
  wall?: number[];           // model W: face-up reward queue
}
export type Move =
  | { kind: "correct"; discard: number | null }
  | { kind: "miss"; spend: number[] };
interface Opt { move: Move; gain: 0 | 1; k: number; hand: number[]; size: number; ptr: number }

const digitsOf = (p: number) => String(p).split("").map(Number);

export function makeSolver(t: Table) {
  const K = t.eqs.length;
  const info = t.eqs.map(([a, b]) => ({ p: a * b, ds: digitsOf(a * b), len: digitsOf(a * b).length }));
  const rewards = (k: number, ptr: number, len: number): number[] =>
    t.model === "P" ? t.bounty![k]! : t.wall!.slice(ptr, ptr + len + 1);
  if (t.model === "P") info.forEach((e, k) => {
    if (t.bounty![k]!.length !== e.len + 1) throw new Error(`row ${k} pays ${t.bounty![k]!.length}, needs ${e.len + 1}`);
  });
  if (t.model === "W") {
    const need = info.reduce((s, e) => s + e.len + 1, 0);
    if (t.wall!.length < need) throw new Error(`wall ${t.wall!.length} < ${need}`);
  }
  const counts0 = Array(10).fill(0);
  t.hand.forEach((d) => counts0[d]++);
  if (t.hand.length > t.cap) throw new Error("opening hand over capacity");

  function options(k: number, hand: number[], size: number, ptr: number): Opt[] {
    if (k >= K) return [];
    const { p, ds, len } = info[k]!;
    if (size < len) return []; // the loss: too few tiles for the next answer
    const out: Opt[] = [];
    if (ds.every((d) => hand[d]! >= ds.filter((x) => x === d).length)) {
      const h = hand.slice();
      ds.forEach((d) => h[d]--);
      const rew = rewards(k, ptr, len);
      rew.forEach((d) => h[d]++);
      const nsize = size - len + rew.length;
      const nptr = t.model === "W" ? ptr + rew.length : ptr;
      const excess = nsize - t.cap;
      if (excess > 1) throw new Error("excess > 1 cannot happen at fixed capacity");
      if (excess === 1) {
        for (let d = 0; d < 10; d++) if (h[d]! > 0) {
          const h2 = h.slice(); h2[d]--;
          out.push({ move: { kind: "correct", discard: d }, gain: 1, k: k + 1, hand: h2, size: t.cap, ptr: nptr });
        }
      } else out.push({ move: { kind: "correct", discard: null }, gain: 1, k: k + 1, hand: h, size: nsize, ptr: nptr });
    }
    if (len === 1) {
      for (let d = 0; d < 10; d++) if (hand[d]! > 0 && d !== p) {
        const h = hand.slice(); h[d]--;
        out.push({ move: { kind: "miss", spend: [d] }, gain: 0, k: k + 1, hand: h, size: size - 1, ptr });
      }
    } else {
      for (let a = 0; a < 10; a++) for (let b = a; b < 10; b++) {
        if (a === b ? hand[a]! < 2 : hand[a]! < 1 || hand[b]! < 1) continue;
        const h = hand.slice(); h[a]--; h[b]--;
        out.push({ move: { kind: "miss", spend: [a, b] }, gain: 0, k: k + 1, hand: h, size: size - 2, ptr });
      }
    }
    return out;
  }

  const key = (k: number, hand: number[], ptr: number) => `${k}|${String.fromCharCode(...hand.map((c) => 65 + c))}|${ptr}`;
  // dist[s] = number of distinct complete lines from this state that score s more.
  const memo = new Map<string, Float64Array>();
  function dist(k: number, hand: number[], size: number, ptr: number): Float64Array {
    const id = key(k, hand, ptr);
    const hit = memo.get(id);
    if (hit) return hit;
    const out = new Float64Array(K + 1);
    const opts = options(k, hand, size, ptr);
    if (opts.length === 0) out[0] = 1;
    for (const o of opts) {
      const sub = dist(o.k, o.hand, o.size, o.ptr);
      for (let s = 0; s + o.gain <= K; s++) out[s + o.gain] += sub[s]!;
    }
    memo.set(id, out);
    return out;
  }
  const best = (d: Float64Array) => { for (let s = K; s >= 0; s--) if (d[s]! > 0) return s; return 0; };
  // Best score using no sacrifice: a miss only when no correct answer is available.
  const memoNoSac = new Map<string, number>();
  function bestNoSac(k: number, hand: number[], size: number, ptr: number): number {
    const id = key(k, hand, ptr);
    const hit = memoNoSac.get(id);
    if (hit !== undefined) return hit;
    let opts = options(k, hand, size, ptr);
    if (opts.some((o) => o.move.kind === "correct")) opts = opts.filter((o) => o.move.kind === "correct");
    let v = 0;
    for (const o of opts) v = Math.max(v, o.gain + bestNoSac(o.k, o.hand, o.size, o.ptr));
    memoNoSac.set(id, v);
    return v;
  }

  const root = { k: 0, hand: counts0, size: t.hand.length, ptr: 0 };
  function solve() {
    const d = dist(root.k, root.hand, root.size, root.ptr);
    const par = best(d);
    // Canonical par line: first optimal option in enumeration order (correct first).
    const line: { k: number; move: Move; options: number; optimal: number; hand: number[] }[] = [];
    let s = root, need = par, onlyMoves = 0, decisions = 0;
    while (true) {
      const opts = options(s.k, s.hand, s.size, s.ptr);
      if (opts.length === 0) break;
      const opt = opts.filter((o) => o.gain + best(dist(o.k, o.hand, o.size, o.ptr)) === need);
      if (opts.length >= 2) { decisions++; if (opt.length === 1) onlyMoves++; }
      const pick = opt[0]!;
      line.push({ k: s.k, move: pick.move, options: opts.length, optimal: opt.length, hand: pick.hand });
      need -= pick.gain;
      s = pick;
    }
    const total = d.reduce((a, b) => a + b, 0);
    return { par, histogram: Array.from(d), lines: total, parLines: d[par]!, onlyMoves, decisions,
      sacrificeRequired: bestNoSac(root.k, root.hand, root.size, root.ptr) < par, line, states: memo.size };
  }

  // Bots never sacrifice: they miss only when no correct answer is available.
  function playBot(pick: (k: number, hand: number[], opts: Opt[]) => Opt): { score: number; moves: Move[] } {
    let s = root, score = 0;
    const moves: Move[] = [];
    while (true) {
      const opts = options(s.k, s.hand, s.size, s.ptr);
      if (opts.length === 0) return { score, moves };
      const o = pick(s.k, s.hand, opts);
      moves.push(o.move); score += o.gain; s = o;
    }
  }
  // Myopic (the journal's T84 Classic bot at skill 100%): discard / spend the digit
  // held in most copies; ties go to the higher digit.
  const mostCopies = (h: number[], allowed: (d: number) => boolean) => {
    let bd = -1;
    for (let d = 9; d >= 0; d--) if (h[d]! > 0 && allowed(d) && (bd < 0 || h[d]! > h[bd]!)) bd = d;
    return bd;
  };
  // Lookahead (Belady): a copy of d is needed at the step where the future products
  // have used up all current copies; discard the digit needed latest (never = latest).
  const neededAt = (h: number[], fromK: number, d: number) => {
    let seen = 0;
    for (let j = fromK; j < K; j++) if (info[j]!.ds.includes(d) && ++seen >= h[d]!) return j;
    return Infinity;
  };
  const latest = (h: number[], fromK: number, allowed: (d: number) => boolean) => {
    let bd = -1, bt = -1;
    for (let d = 9; d >= 0; d--) {
      if (h[d]! === 0 || !allowed(d)) continue;
      const tt = neededAt(h, fromK, d);
      if (bd < 0 || tt > bt || (tt === bt && h[d]! > h[bd]!)) { bd = d; bt = tt; }
    }
    return bd;
  };
  function botPicker(choose: (h: number[], fromK: number, allowed: (d: number) => boolean) => number) {
    return (k: number, hand: number[], opts: Opt[]): Opt => {
      const correct = opts.filter((o) => o.move.kind === "correct");
      if (correct.length === 1) return correct[0]!;
      if (correct.length > 1) {
        const pre = correct[0]!.hand.slice();
        pre[(correct[0]!.move as { discard: number }).discard]++; // post-reward, pre-discard hand
        const d = choose(pre, k + 1, () => true);
        return correct.find((o) => (o.move as { discard: number }).discard === d)!;
      }
      const { p, len } = info[k]!;
      const h = hand.slice();
      const spend: number[] = [];
      for (let i = 0; i < len; i++) {
        const d = choose(h, k + 1, (x) => len === 2 || x !== p);
        spend.push(d); h[d]--;
      }
      spend.sort((a, b) => a - b);
      return opts.find((o) => o.move.kind === "miss" && o.move.spend.join() === spend.join())!;
    };
  }
  const myopic = () => playBot(botPicker((h, _k, ok) => mostCopies(h, ok)));
  const lookahead = () => playBot(botPicker((h, k, ok) => latest(h, k, ok)));

  return { K, info, options, solve, myopic, lookahead, root };
}

// Deterministic PRNG for research tables only (mulberry32), so reported numbers reproduce.
export function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
const PAIRS: [number, number][] = [];
for (let a = 1; a <= 9; a++) for (let b = a; b <= 9; b++) PAIRS.push([a, b]);
// Uniform table: full opening hand of uniform digits, uniform pairs, uniform rewards.
export function randomTable(rnd: () => number, model: Model, cap: number, K: number): Table {
  const dig = () => Math.floor(rnd() * 10);
  const eqs = Array.from({ length: K }, () => {
    const [a, b] = PAIRS[Math.floor(rnd() * PAIRS.length)]!;
    return (rnd() < 0.5 ? [a, b] : [b, a]) as [number, number];
  });
  const lens = eqs.map(([a, b]) => (a * b >= 10 ? 2 : 1));
  const hand = Array.from({ length: cap }, dig);
  if (model === "P") return { model, cap, hand, eqs, bounty: lens.map((l) => Array.from({ length: l + 1 }, dig)) };
  return { model, cap, hand, eqs, wall: Array.from({ length: lens.reduce((s, l) => s + l + 1, 0) }, dig) };
}

// Planted-line generator (model P). Deals forward along a hidden random line: with
// probability q the next pair is drawn from products that line's hand can spell (the
// shipped kind bias, applied at deal time), else uniformly; rewards are uniform. The
// hidden line answers when it can (random discard) and otherwise misses with random
// tiles. It only shapes the deal; the solver decides par. Nothing about it is shown.
export function plantedTable(rnd: () => number, cap: number, K: number, q: number, distinctHand: boolean): Table {
  const dig = () => Math.floor(rnd() * 10);
  let hand: number[];
  if (distinctHand) {
    const pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = 9; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j]!, pool[i]!]; }
    hand = pool.slice(0, cap);
  } else hand = Array.from({ length: cap }, dig);
  const h = Array(10).fill(0);
  hand.forEach((d) => h[d]++);
  const spells = (p: number) => { const ds = String(p).split("").map(Number); return ds.every((d) => h[d] >= 1); };
  const eqs: [number, number][] = [], bounty: number[][] = [];
  for (let k = 0; k < K; k++) {
    const ok = PAIRS.filter(([a, b]) => spells(a * b));
    const src = rnd() < q && ok.length > 0 ? ok : PAIRS;
    const [a, b] = src[Math.floor(rnd() * src.length)]!;
    eqs.push(rnd() < 0.5 ? [a, b] : [b, a]);
    const ds = String(a * b).split("").map(Number);
    const pay = Array.from({ length: ds.length + 1 }, dig);
    bounty.push(pay);
    const size = h.reduce((s, c) => s + c, 0);
    if (size < ds.length) continue; // hidden line is dead; later rows stay uniform-ish
    if (spells(a * b)) {
      ds.forEach((d) => h[d]--); pay.forEach((d) => h[d]++);
      if (size + 1 > cap) { const held = h.flatMap((c, d) => Array(c).fill(d)); h[held[Math.floor(rnd() * held.length)]]--; }
    } else for (let i = 0; i < ds.length; i++) { const held = h.flatMap((c, d) => Array(c).fill(d)); h[held[Math.floor(rnd() * held.length)]]--; }
  }
  return { model: "P", cap, hand, eqs, bounty };
}

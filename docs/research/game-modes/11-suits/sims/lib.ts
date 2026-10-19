// Suits research loop. A tile is d*3 + s (digit 0–9, suit 0–2: 0 = 만 characters, 1 = 통 dots, 2 = 삭 bamboo).
// Re-implements Endless's round for suited tiles; the shipped rules are rule "none". Research tooling only.
export type Rule = "none" | "flushPays" | "flushPts" | "flushGate" | "suitEq" | "flushOnly" | "gateAll";
export const PAIRS: { a: number; b: number; p: number; h: number; l: number; two: boolean }[] = [];
for (let a = 1; a <= 9; a++) for (let b = a; b <= 9; b++) {
  const p = a * b; PAIRS.push({ a, b, p, h: p >= 10 ? Math.floor(p / 10) : -1, l: p % 10, two: p >= 10 });
}
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const dig = (t: number) => (t / 3) | 0, su = (t: number) => t % 3;
// Masks: m[s] = digits held in suit s; all = union.
function masks(hand: number[]) { const m = [0, 0, 0]; for (const t of hand) m[su(t)] |= 1 << dig(t); return m; }
const has = (m: number, d: number) => (m >> d) & 1;
// Can pair i be answered under the rule? eqSuit used only by suitEq.
export function buildable(m: number[], i: number, rule: Rule, eqSuit = 0): boolean {
  const P = PAIRS[i], all = m[0] | m[1] | m[2];
  if (rule === "suitEq") {
    const ms = m[eqSuit];
    if (!P.two) return !!has(ms, P.l);
    return !!((has(ms, P.h) && has(all, P.l)) || (has(ms, P.l) && has(all, P.h)));
  }
  if (!P.two) return !!has(all, P.l);
  if (rule === "flushGate" || rule === "gateAll") return [0, 1, 2].some((s) => has(m[s], P.h) && has(m[s], P.l));
  return !!(has(all, P.h) && has(all, P.l));
}
export const flushable = (m: number[], i: number) => PAIRS[i].two && [0, 1, 2].some((s) => has(m[s], PAIRS[i].h) && has(m[s], PAIRS[i].l));
// Share of the 45 pairs the hand can answer (suitEq: averaged over the three equation suits).
export function bShare(hand: number[], rule: Rule): number {
  const m = masks(hand); let n = 0;
  const suits = rule === "suitEq" ? [0, 1, 2] : [0];
  for (const s of suits) for (let i = 0; i < 45; i++) if (buildable(m, i, rule, s)) n++;
  return n / (45 * suits.length);
}
// Bot's hand value: answerable share, plus lambda × flushable share where a flush pays.
export function value(hand: number[], rule: Rule, lambda: number): number {
  let v = bShare(hand, rule);
  if (lambda && (rule === "flushPays" || rule === "flushPts" || rule === "flushOnly")) { const m = masks(hand); let f = 0; for (let i = 0; i < 45; i++) if (flushable(m, i)) f++; v += (lambda * f) / 45; }
  return v;
}
const without = (hand: number[], idx: number[]) => hand.filter((_, j) => !idx.includes(j));

export interface Cfg { rule: Rule; cap: number; kind: number; lambda: number; randomize: "none" | "answer" | "discard" | "burn" | "all" | "digitDiscard" | "obvious"; rewards?: boolean; cap_rounds?: number; skill?: number; drift?: Map<number, [number, number]> }
export interface RunOut { rounds: number; score: number; points: number; flushes: number; correct: number; fullRounds: number; fullCorrect: number; suitChoices: number; oneDigit: number; shedChoices: { discard: number; burn: number } }

// Legal answer options: arrays of hand indices, in slot order.
function options(hand: number[], i: number, rule: Rule, eqSuit: number): number[][] {
  const P = PAIRS[i], out: number[][] = [];
  if (!P.two) { hand.forEach((t, j) => { if (dig(t) === P.l && (rule !== "suitEq" || su(t) === eqSuit)) out.push([j]); }); return out; }
  hand.forEach((t, j) => { if (dig(t) !== P.h) return; hand.forEach((u, k) => {
    if (k === j || dig(u) !== P.l) return;
    if ((rule === "flushGate" || rule === "gateAll") && su(t) !== su(u)) return;
    if (rule === "suitEq" && su(t) !== eqSuit && su(u) !== eqSuit) return;
    out.push([j, k]); }); });
  return out;
}
const pick = <T,>(a: T[], r: () => number) => a[Math.floor(r() * a.length)];
// Among options, keep one copy per distinct suit pattern, so a random suit choice is uniform over suits, not over copies.
function bySuitPattern(hand: number[], opts: number[][]) { const seen = new Map<string, number[]>(); for (const o of opts) { const k = o.map((j) => hand[j]).join(","); if (!seen.has(k)) seen.set(k, o); } return [...seen.values()]; }

export function run(seed: number, c: Cfg): RunOut {
  const g = mulberry32(seed), pr = mulberry32(seed + 7_000_000);
  const R = c.rule, lam = c.lambda, capR = c.cap_rounds ?? 1000, skill = c.skill ?? 1;
  let hand: number[] = Array.from({ length: c.cap }, (_, i) => (i % 10) * 3 + (i % 3));
  const o: RunOut = { rounds: 0, score: 0, points: 0, flushes: 0, correct: 0, fullRounds: 0, fullCorrect: 0, suitChoices: 0, oneDigit: 0, shedChoices: { discard: 0, burn: 0 } };
  const rnd = (d: Cfg["randomize"]) => c.randomize === d || c.randomize === "all" || (c.randomize === "obvious" && d !== "answer");
  // Remove k tiles one at a time, each the least valuable; with suit randomisation, keep the chosen digit but pick its copy at random.
  const shed = (k: number, dec: "discard" | "burn") => {
    for (let x = 0; x < k; x++) {
      let best = -1, bv = -1e9;
      for (let j = 0; j < hand.length; j++) { const v = value(without(hand, [j]), R, lam); if (v > bv + 1e-12) { bv = v; best = j; } }
      { const d = dig(hand[best]); if (new Set(hand.filter((t) => dig(t) === d).map(su)).size > 1) o.shedChoices[dec]++; }
      if (c.randomize === "digitDiscard" && dec === "discard") best = Math.floor(pr() * hand.length);
      else if (rnd(dec)) { const d = dig(hand[best]); const same = hand.map((t, j) => [t, j]).filter(([t]) => dig(t) === d).map(([, j]) => j); best = pick(same, pr); }
      hand.splice(best, 1);
    }
    hand.sort((x, y) => x - y);
  };
  // gateAll's deliberate miss: the least valuable same-suit pair; with suit randomisation, a random suit among the pairs whose digits match the chosen pair's.
  const burnSuited = () => {
    let best: number[] = [], bv = -1e9; const all: number[][] = [];
    for (let j = 0; j < hand.length; j++) for (let k = j + 1; k < hand.length; k++) if (su(hand[j]) === su(hand[k])) { all.push([j, k]); const v = value(without(hand, [j, k]), R, lam); if (v > bv + 1e-12) { bv = v; best = [j, k]; } }
    if (rnd("burn")) { const ds = best.map((j) => dig(hand[j])).sort().join(); const same = all.filter((p) => p.map((j) => dig(hand[j])).sort().join() === ds); if (same.length > 1) o.shedChoices.burn++; best = pick(same, pr); }
    hand = without(hand, best); hand.sort((x, y) => x - y);
  };
  while (o.rounds < capR) {
    // Draw: gate, then pair (kind: from answerable pairs), then the equation's suit (suitEq only).
    const m = masks(hand); let i: number, eqSuit: number;
    if (g() < c.kind) {
      const ok: [number, number][] = [];
      for (let q = 0; q < 45; q++) for (const s of R === "suitEq" ? [0, 1, 2] : [0]) if (buildable(m, q, R, s)) ok.push([q, s]);
      if (ok.length) { [i, eqSuit] = ok[Math.floor(g() * ok.length)]; } else { i = Math.floor(g() * 45); eqSuit = Math.floor(g() * 3); }
    } else { i = Math.floor(g() * 45); eqSuit = Math.floor(g() * 3); }
    if (R !== "suitEq") eqSuit = 0;
    const N = PAIRS[i].two ? 2 : 1;
    if (hand.length < N) break;
    if (R === "gateAll" && N === 2 && new Set(hand.map(su)).size === hand.length) break; // no two tiles share a suit: nothing can be submitted
    const full = hand.length >= c.cap; if (full) o.fullRounds++;
    o.rounds++; const len0 = hand.length;
    const opts = options(hand, i, R, eqSuit);
    if (opts.length && g() < skill) {
      let chosen: number[];
      const score = (op: number[]) => value(without(hand, op), R, lam) + ((R === "flushPays" || R === "flushPts" || R === "flushOnly") && op.length === 2 && su(hand[op[0]]) === su(hand[op[1]]) ? 1 : 0);
      const pats = bySuitPattern(hand, opts);
      const vals = pats.map(score);
      if (Math.max(...vals) - Math.min(...vals) > 1e-9) o.suitChoices++;
      if (c.randomize === "obvious") { const fl = pats.filter((op) => op.length === 2 && su(hand[op[0]]) === su(hand[op[1]])); chosen = pick(fl.length ? fl : pats, pr); }
      else if (rnd("answer")) chosen = pick(pats, pr);
      else { let bi = 0; vals.forEach((v, k) => { if (v > vals[bi] + 1e-12) bi = k; }); chosen = pats[bi]; }
      const flush = N === 2 && su(hand[chosen[0]]) === su(hand[chosen[1]]);
      hand = without(hand, chosen);
      o.score++; o.correct++; o.points += 1 + (R === "flushPts" && flush ? 1 : 0); if (flush) o.flushes++; if (N === 1) o.oneDigit++; if (full) o.fullCorrect++;
      const nr = c.rewards === false ? 0 : N + 1 + (R === "flushPays" && flush ? 1 : 0) - (R === "flushOnly" && N === 2 && !flush ? 1 : 0);
      for (let r = 0; r < nr; r++) hand.push(Math.floor(g() * 10) * 3 + Math.floor(g() * 3));
      hand.sort((x, y) => x - y); // the rack is sorted (digit, then suit), so ties break by digit, never by copy position
      if (hand.length > c.cap) shed(hand.length - c.cap, "discard");
    } else {
      if (R === "gateAll" && N === 2) burnSuited(); else shed(N, "burn"); // a deliberate wrong answer spends the N least valuable tiles
    }
    if (c.drift) { const e = c.drift.get(len0) ?? [0, 0]; e[0] += hand.length - len0; e[1]++; c.drift.set(len0, e); }
  }
  return o;
}
export function batch(c: Cfg, n: number, seed0 = 1000) { const r: RunOut[] = []; for (let s = 0; s < n; s++) r.push(run(seed0 + s, c)); return r; }
export const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
export const se = (a: number[]) => { const m = mean(a); return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1) / a.length); };

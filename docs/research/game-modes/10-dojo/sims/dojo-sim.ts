// Dojo economy sim. Steps the REAL gameReducer (mode "endless" => capacity 10),
// with Dojo's equation draw (a 3-pass deck of one table) and reward digits
// injected at the boundary, exactly as App.tsx injects them.
// Usage: node .../_runner/run.mjs <this file>
import { gameReducer } from "../../../../../src/game/gameReducer.ts";
import { createInitialInventory, createTitleState } from "../../../../../src/game/factories.ts";
import { generateKindEquation, generateRewardTiles } from "../../../../../src/game/generators.ts";
import { canConstruct, getAnswerLength, getRewardCount } from "../../../../../src/game/selectors.ts";
import type { Digit, Equation, GameState, Tile } from "../../../../../src/game/types.ts";

// ---------- deterministic PRNG for the sim (the product would use Math.random) ----------
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let rng = mulberry32(1);
let idn = 0;
const ids = () => `t${idn++}`;
const digitOf = (t: Tile) => ("digit" in t ? t.digit : -1);

// ---------- pools ----------
const ALL45: number[] = [];
for (let a = 1; a <= 9; a++) for (let b = a; b <= 9; b++) ALL45.push(a * b);
const danProducts = (k: number) => Array.from({ length: 9 }, (_, i) => k * (i + 1));
const digitsOf = (p: number) => String(p).split("").map(Number);

// Table-weighted reward distribution: each digit weighted by its count across the table's answers.
function tableWeights(products: number[]): number[] {
  const w = Array(10).fill(0);
  for (const p of products) for (const d of digitsOf(p)) w[d]++;
  return w;
}
function drawWeighted(w: number[]): Digit {
  const total = w.reduce((s, x) => s + x, 0);
  let r = rng() * total;
  for (let d = 0; d < 10; d++) { if (r < w[d]) return d as Digit; r -= w[d]; }
  return 9;
}

// ---------- bot policy (the player's choices; not game logic) ----------
// counts-based coverage: products here never repeat a digit, so "spellable" = every digit present.
function counts(tiles: readonly Tile[]): number[] {
  const c = Array(10).fill(0);
  for (const t of tiles) { const d = digitOf(t); if (d >= 0) c[d]++; }
  return c;
}
function coverage(c: number[], pool: number[]): number {
  let n = 0;
  for (const p of pool) if (digitsOf(p).every((d) => c[d] > 0)) n++;
  return n;
}
type Policy = "greedy" | "copies";
// The least valuable digit in `tiles` under the policy.
function leastValuableDigit(tiles: readonly Tile[], pool: number[], policy: Policy): number {
  const c = counts(tiles);
  const base = coverage(c, pool);
  let best = -1, bestKey: number[] = [];
  for (let d = 0; d < 10; d++) {
    if (c[d] === 0) continue;
    let loss = 0;
    if (policy === "greedy") { c[d]--; loss = base - coverage(c, pool); c[d]++; }
    // greedy: least coverage lost, then most copies. copies: most copies (table-blind, the T84 bot).
    const key = policy === "greedy" ? [loss, -c[d], rng()] : [-c[d], rng()];
    if (best < 0 || lexLess(key, bestKey)) { best = d; bestKey = key; }
  }
  return best;
}
function lexLess(a: number[], b: number[]): boolean {
  for (let i = 0; i < a.length; i++) { if (a[i] !== b[i]) return a[i] < b[i]; }
  return false;
}

// Picks `n` tiles that spell a WRONG answer, spending the least valuable tiles.
function wrongAnswerTiles(inv: readonly Tile[], product: number, pool: number[], policy: Policy): Tile[] | null {
  const n = String(product).length;
  const left = [...inv];
  const chosen: Tile[] = [];
  for (let i = 0; i < n; i++) {
    const d = leastValuableDigit(left, pool, policy);
    const idx = left.findIndex((t) => digitOf(t) === d);
    chosen.push(left.splice(idx, 1)[0]);
  }
  const spelled = Number(chosen.map(digitOf).join(""));
  if (spelled !== product) return chosen;
  if (n === 2) return [chosen[1], chosen[0]]; // digits differ, so the reverse is wrong
  // one slot, and the least valuable tile IS the answer: take the next different digit
  const other = left.find((t) => digitOf(t) !== product);
  return other ? [other] : null; // null: every tile is the answer digit
}
function rightAnswerTiles(inv: readonly Tile[], product: number): Tile[] {
  const left = [...inv];
  return digitsOf(product).map((d) => left.splice(left.findIndex((t) => digitOf(t) === d), 1)[0]);
}

// ---------- one run ----------
interface Mode {
  name: string;
  pool: number[];                    // products the bot's coverage policy cares about
  draw: (s: GameState) => Equation;  // next equation
  rewards: (count: number, s: GameState) => Tile[];
}
interface Result { subs: number; spellable: number; correct: number; knowMiss: number; forced: number; discards: number; complete: boolean; handSum: number; }

function play(mode: Mode, acc: number, policy: Policy, cap: number): Result {
  const r: Result = { subs: 0, spellable: 0, correct: 0, knowMiss: 0, forced: 0, discards: 0, complete: false, handSum: 0 };
  const inventory = createInitialInventory(ids);
  let s = gameReducer(createTitleState(), { type: "START_RUN", mode: "endless", equation: { left: 1, right: 1, product: 1 }, inventory });
  s = { ...s, equation: mode.draw(s) }; // first equation from the mode's own draw (one-of-each spells all)
  while (true) {
    if (s.phase === "gameOver") return r;
    const eq = s.equation!;
    r.handSum += s.inventory.length;
    const spellable = canConstruct(s.inventory, eq.product);
    const knows = rng() < acc;
    let tiles: Tile[] | null;
    if (spellable) r.spellable++;
    if (spellable && knows) tiles = rightAnswerTiles(s.inventory, eq.product);
    else tiles = wrongAnswerTiles(s.inventory, eq.product, mode.pool, policy) ?? rightAnswerTiles(s.inventory, eq.product);
    for (const t of tiles) s = gameReducer(s, { type: "SELECT_TILE", tileId: t.id });
    const isRight = Number(s.selectedTiles.map(digitOf).join("")) === eq.product;
    if (isRight) {
      s = gameReducer(s, { type: "SUBMIT_CORRECT", rewardTiles: mode.rewards(getRewardCount(s.selectedTiles.length), s) });
      r.correct++;
    } else {
      s = gameReducer(s, { type: "SUBMIT_INCORRECT" });
      if (spellable) r.knowMiss++; else r.forced++;
    }
    r.subs++;
    while (s.phase === "overflow") {
      const d = leastValuableDigit(s.inventory, mode.pool, policy);
      const t = s.inventory.find((x) => digitOf(x) === d)!;
      s = gameReducer(s, { type: "TOGGLE_DISCARD", tileId: t.id });
      r.discards++;
    }
    if (r.subs >= cap) { r.complete = true; return r; }
    s = gameReducer(s, { type: "NEXT_ROUND", equation: mode.draw(s) });
  }
}

// ---------- modes ----------
function endless(): Mode {
  return {
    name: "Endless (shipped)",
    pool: ALL45,
    draw: (s) => generateKindEquation(rng, s.inventory),
    rewards: (n, s) => generateRewardTiles(n, rng, ids, "endless", s.totalRounds),
  };
}
type RewardKind = "U" | "T" | "E" | "ET" | "dead";
function dojo(k: number, rewardKind: RewardKind, kindDeck = false): Mode {
  const products = danProducts(k);
  const w = tableWeights(products);
  let deck: number[] = [];
  return {
    name: `${k}dan-${rewardKind}${kindDeck ? "K" : ""}`,
    pool: products,
    draw: (s) => {
      if (s.totalRounds === 0 && s.round <= 1) deck = []; // new run: new deck
      if (deck.length === 0) { // a pass: the 9 facts, shuffled (Fisher-Yates)
        deck = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        for (let i = 8; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
      }
      let m: number;
      if (kindDeck) { // spellable cards first, uniformly; any remaining card if none is spellable
        const ok = deck.filter((x) => canConstruct(s.inventory, k * x));
        const from = ok.length > 0 ? ok : deck;
        m = from[Math.floor(rng() * from.length)];
        deck.splice(deck.indexOf(m), 1);
      } else m = deck.pop()!;
      return rng() < 0.5 ? { left: k, right: m, product: k * m } : { left: m, right: k, product: k * m };
    },
    rewards: (n, s) => {
      if (rewardKind === "U") return generateRewardTiles(n, rng, ids, "endless", s.totalRounds);
      if (rewardKind === "E" || rewardKind === "ET") { // echo: the spent digits come back, plus one extra
        const back = s.selectedTiles.map((t) => ({ id: ids(), isNew: true, digit: digitOf(t) as Digit }));
        const extra = rewardKind === "E" ? generateRewardTiles(1, rng, ids, "endless", s.totalRounds)
          : [{ id: ids(), isNew: true, digit: drawWeighted(w) }];
        return [...back, ...extra].slice(0, n);
      }
      const wt = rewardKind === "T" ? w : [0, 0, 0, 0, 0, 0, 1, 1, 1, 1];
      return Array.from({ length: n }, () => ({ id: ids(), isNew: true, digit: drawWeighted(wt) }));
    },
  };
}

function aggregate(mode: Mode, acc: number, policy: Policy, cap: number, runs: number) {
  const tot = { subs: 0, spellable: 0, correct: 0, knowMiss: 0, forced: 0, discards: 0, complete: 0, handSum: 0 };
  for (let i = 0; i < runs; i++) {
    const r = play(mode, acc, policy, cap);
    tot.subs += r.subs; tot.spellable += r.spellable; tot.correct += r.correct; tot.knowMiss += r.knowMiss;
    tot.forced += r.forced; tot.discards += r.discards; tot.complete += r.complete ? 1 : 0; tot.handSum += r.handSum;
  }
  return {
    complete: tot.complete / runs, subs: tot.subs / runs, bRun: tot.spellable / tot.subs,
    forcedShare: tot.forced / tot.subs, forcedOfMisses: tot.forced / Math.max(1, tot.forced + tot.knowMiss),
    discards: tot.discards / runs, correct: tot.correct / runs, hand: tot.handSum / tot.subs,
  };
}

const pct = (x: number) => (100 * x).toFixed(1).padStart(5) + "%";
const f1 = (x: number) => x.toFixed(1).padStart(5);
const RUNS = Number(process.env.RUNS ?? 2000);

// ===== 1. Calibration: static b(10), b(20) with the real canConstruct (repo: 0.481, 0.801) =====
function staticB(handSize: number, pool: number[], weights: number[] | null, trials = 20000): number {
  let hits = 0;
  for (let t = 0; t < trials; t++) {
    const hand: Tile[] = Array.from({ length: handSize }, () => ({
      id: ids(), isNew: false, digit: (weights ? drawWeighted(weights) : Math.floor(rng() * 10)) as Digit,
    }));
    for (const p of pool) if (canConstruct(hand, p)) hits++;
  }
  return hits / (trials * pool.length);
}
rng = mulberry32(7);
console.log(`# Calibration (real canConstruct, 20,000 uniform hands): b(10) = ${staticB(10, ALL45, null).toFixed(3)} (repo 0.481), b(20) = ${staticB(20, ALL45, null).toFixed(3)} (repo 0.801)`);
// Positive control: one-of-each spells every fact of every table.
const oneEach = createInitialInventory(ids);
console.log(`# Positive control: one-of-each spells ${[2,3,4,5,6,7,8,9].map((k) => danProducts(k).filter((p) => canConstruct(oneEach, p)).length).join("/")} of 9 facts (dans 2..9)`);

// ===== 2. Static per-dan table =====
console.log(`\n# Static b(10) per dan: U = uniform 0-9 hand, T = table-weighted hand; cliff = L/(1+L), L = mean answer length`);
console.log(`dan | used digits | dead | L    | cliff | b_U(10) | b_T(10)`);
for (const k of [2, 3, 4, 5, 6, 7, 8, 9]) {
  const ps = danProducts(k);
  const w = tableWeights(ps);
  const used = w.map((x, d) => (x > 0 ? d : -1)).filter((d) => d >= 0);
  const L = ps.reduce((s, p) => s + String(p).length, 0) / 9;
  console.log(`${k}단 | ${used.join("")}`.padEnd(18) + ` | ${(10 - used.length) * 10}%`.padEnd(7) + ` | ${L.toFixed(2)} | ${(L / (1 + L)).toFixed(3)} | ${staticB(10, ps, null, 8000).toFixed(3)}   | ${staticB(10, ps, w, 8000).toFixed(3)}`);
}

// ===== 3. Session sims: 27-submission deck =====
const header = `variant            acc  policy | complete | subs | b_run | forced/subs | forced/misses | discards | correct | hand`;
function row(m: Mode, acc: number, pol: Policy, cap: number, runs = RUNS) {
  const a = aggregate(m, acc, pol, cap, runs);
  console.log(`${m.name.padEnd(18)} ${acc.toFixed(2)} ${pol.padEnd(6)} | ${pct(a.complete)}   | ${f1(a.subs)} | ${pct(a.bRun)} | ${pct(a.forcedShare)}      | ${pct(a.forcedOfMisses)}        | ${f1(a.discards)}    | ${f1(a.correct)}   | ${f1(a.hand)}`);
}
rng = mulberry32(42);
console.log(`\n# Negative control: 5단 fed only dead digits 6-9 must never complete`);
console.log(header);
row(dojo(5, "dead"), 1.0, "greedy", 27);
row(dojo(5, "dead"), 1.0, "greedy", 1000);

const DANS = [2, 3, 4, 5, 6, 7, 8, 9];
function matrix(title: string, variants: Array<[string, (k: number) => Mode]>, accs: number[], pol: Policy) {
  console.log(`\n# ${title} (${RUNS} runs per cell, greedy bot unless noted; cell = complete% / forced-miss share of submissions / overflow discards per session)`);
  console.log(`variant acc  | ` + DANS.map((k) => `${k}단`.padEnd(15)).join("| "));
  for (const [label, mk] of variants) for (const acc of accs) {
    const cells = DANS.map((k) => { const a = aggregate(mk(k), acc, pol, 27, RUNS); return `${(100 * a.complete).toFixed(0).padStart(3)}/${(100 * a.forcedShare).toFixed(0).padStart(2)}%/${a.discards.toFixed(1).padStart(4)}`.padEnd(15); });
    console.log(`${label.padEnd(7)} ${acc.toFixed(2)} | ` + cells.join("| "));
  }
}
const VARIANTS: Array<[string, (k: number) => Mode]> = [
  ["U", (k) => dojo(k, "U")], ["T", (k) => dojo(k, "T")], ["UK", (k) => dojo(k, "U", true)],
  ["E", (k) => dojo(k, "E")], ["ET", (k) => dojo(k, "ET")],
];
console.log(`\n# Endless baseline, 27-submission cap (${RUNS} runs)`);
console.log(header);
row(endless(), 1.0, "greedy", 27); row(endless(), 0.85, "greedy", 27); row(endless(), 1.0, "copies", 27);
matrix("Dojo sessions: 3 shuffled passes of one table = 27 submissions", VARIANTS, [1.0, 0.85, 0.7], "greedy");
matrix("Policy check: table-blind 'copies' discarder (the T84 journal bot)", [["U", (k) => dojo(k, "U")], ["E", (k) => dojo(k, "E")]], [1.0, 0.85], "copies");

// ===== 4. Dose: no session cap (stop at 300) - submissions reached by accuracy =====
console.log(`\n# Uncapped (stop at 300 submissions): practice dose by accuracy (${Math.round(RUNS / 2)} runs per row)`);
console.log(header);
for (const acc of [1.0, 0.85, 0.7, 0.55]) {
  row(endless(), acc, "greedy", 300, Math.round(RUNS / 2));
  row(dojo(7, "U"), acc, "greedy", 300, Math.round(RUNS / 2));
  row(dojo(7, "E"), acc, "greedy", 300, Math.round(RUNS / 2));
}

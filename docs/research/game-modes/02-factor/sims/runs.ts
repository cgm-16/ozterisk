// In-run sim: Endless-shaped runs under the shipped (forward) rule and the
// Factor (reverse) rule, same bot, same seeds. Calibrated by driving the real
// gameReducer for shipped Endless and requiring seed-for-seed agreement.
import { gameReducer } from "../../../../../src/game/gameReducer.ts";
import { createInitialInventory, createTitleState } from "../../../../../src/game/factories.ts";
import { generateKindEquation, generateRewardTiles } from "../../../../../src/game/generators.ts";
import { getRewardCount } from "../../../../../src/game/selectors.ts";
import type { GameState, Tile } from "../../../../../src/game/types.ts";
import { bin, canSpell, drawEntries, factorOptions, mulberry32, PAIRS, productDigits, size, type Counts, type DrawKind } from "./model.ts";

interface Rules {
  entries: readonly number[];
  options: (c: Counts, p: number) => number[][]; // tile multisets that answer p
  cost: (p: number) => number;
  rewardDigits: readonly number[];
}
const D09 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const D19 = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const forward: Rules = {
  entries: PAIRS.map(([a, b]) => a * b),
  options: (c, p) => (canSpell(c, p) ? [productDigits(p)] : []),
  cost: (p) => productDigits(p).length,
  rewardDigits: D09,
};
const factor = (draw: DrawKind, rewardDigits: readonly number[]): Rules => ({
  entries: drawEntries(draw),
  options: (c, p) => factorOptions(c, p).map(([a, b]) => [a, b]),
  cost: () => 2,
  rewardDigits,
});

function coverage(r: Rules, c: Counts): number {
  let hit = 0;
  for (const p of r.entries) if (r.options(c, p).length > 0) hit++;
  return hit / r.entries.length;
}
function coverageWithout(r: Rules, c: Counts, tiles: readonly number[]): number {
  for (const d of tiles) c[d]--;
  const v = coverage(r, c);
  for (const d of tiles) c[d]++;
  return v;
}
// The k tiles (k <= 2) whose loss costs the least coverage; ties go to the most
// redundant digit, then the lowest digit.
function cheapest(r: Rules, c: Counts, k: number, allowed: (tiles: number[]) => boolean = () => true): number[] {
  let best: number[] = [];
  let bestV = -1;
  let bestRedundancy = -1;
  const consider = (tiles: number[]) => {
    if (!allowed(tiles)) return;
    const v = coverageWithout(r, c, tiles);
    const redundancy = tiles.reduce((s, d) => s + c[d]!, 0);
    if (v > bestV + 1e-12 || (Math.abs(v - bestV) <= 1e-12 && redundancy > bestRedundancy)) {
      best = tiles;
      bestV = v;
      bestRedundancy = redundancy;
    }
  };
  for (let a = 0; a <= 9; a++) {
    if (c[a]! < 1) continue;
    if (k === 1) consider([a]);
    else for (let b = a; b <= 9; b++) if (a === b ? c[a]! >= 2 : c[b]! >= 1) consider([a, b]);
  }
  return best;
}

// A miss spends the cheapest selection that is not itself a correct answer (a
// two-digit forward answer is always wrong reversed, so only one-digit forward
// answers and Factor pairs are excluded). [] = every selection is correct.
function missSpend(r: Rules, c: Counts, p: number): number[] {
  const correct = (t: number[]) => r.options(c, p).some((o) => o.length === t.length && o.every((d, i) => d === t[i]) && (t.length === 2 ? r !== forward : true));
  return cheapest(r, c, r.cost(p), (t) => !correct(t));
}

type PairPolicy = "greedy" | "random" | "anti" | "first" | "shortest" | "longest";
function choose(r: Rules, c: Counts, opts: number[][], policy: PairPolicy, bot: () => number): number[] {
  if (policy === "shortest" || policy === "longest") {
    const lengths = opts.map((o) => o.length);
    const len = policy === "shortest" ? Math.min(...lengths) : Math.max(...lengths);
    return choose(r, c, opts.filter((o) => o.length === len), "greedy", bot);
  }
  if (opts.length === 1 || policy === "first") return opts[0]!;
  if (policy === "random") return opts[Math.floor(bot() * opts.length)]!;
  const scored = opts.map((o) => coverageWithout(r, c, o));
  const target = policy === "greedy" ? Math.max(...scored) : Math.min(...scored);
  return opts[scored.indexOf(target)]!;
}

// Replica of generateKindEquation's draw and its random consumption: a gate
// sample, then a pair sample and an order sample.
function drawProduct(r: Rules, c: Counts, kind: number, g: () => number): number {
  const gate = g();
  let pool = r.entries;
  if (gate < kind) {
    const sub = r.entries.filter((p) => r.options(c, p).length > 0);
    if (sub.length > 0) pool = sub;
  }
  const p = pool[bin(g(), pool.length)]!;
  g(); // order sample
  return p;
}

interface Config {
  rules: Rules;
  cap: number;
  opening: readonly number[];
  kind: number;
  skill: number;
  policy: PairPolicy;
  rewardBonus: number | null; // null = shipped N + 1; a number = fixed reward count override
  maxRounds: number;
  discard: "greedy" | "random";
  missPick: "greedy" | "random";
}
interface RunStats { rounds: number; capped: boolean; answerable: number; ceil: number; ceilAnswerable: number; choice: number; meaningful: number; correct: number; long: number; padded: number; misses: number; discards: number; }

// Random baselines for the instrument check: a uniform tile to discard, and a
// uniform wrong selection to spend on a miss.
function randomTile(c: Counts, bot: () => number): number {
  let k = Math.floor(bot() * size(c));
  for (let d = 0; d <= 9; d++) { if (k < c[d]!) return d; k -= c[d]!; }
  throw new Error("empty hand");
}
function randomMiss(r: Rules, c: Counts, p: number, bot: () => number): number[] {
  const cands: number[][] = [];
  const wrong = (t: number[]) => !r.options(c, p).some((o) => o.length === 2 && o[0] === t[0] && o[1] === t[1]) || r === forward;
  for (let a = 0; a <= 9; a++) {
    if (c[a]! < 1) continue;
    if (r.cost(p) === 1) { if (!(r === forward && a === p)) cands.push([a]); continue; }
    for (let b = a; b <= 9; b++) if ((a === b ? c[a]! >= 2 : c[b]! >= 1) && wrong([a, b])) cands.push([a, b]);
  }
  return cands.length ? cands[Math.floor(bot() * cands.length)]! : [];
}

// Variable-length answers: 2 or 3 tiles whose product is the target (1s allowed).
const SPLIT: ReadonlyMap<number, number[][]> = (() => {
  const m = new Map<number, number[][]>();
  for (const p of drawEntries("product")) {
    const list: number[][] = [];
    for (let a = 1; a <= 9; a++) for (let b = a; b <= 9; b++) {
      if (a * b === p) list.push([a, b]);
      for (let c = b; c <= 9; c++) if (a * b * c === p) list.push([a, b, c]);
    }
    m.set(p, list);
  }
  return m;
})();
const has = (c: Counts, o: readonly number[]) => o.every((d) => o.filter((x) => x === d).length <= c[d]!);
const split: Rules = {
  entries: drawEntries("pair"),
  options: (c, p) => (SPLIT.get(p) ?? []).filter((o) => has(c, o)),
  cost: () => 2, // a miss spends the minimum answer
  rewardDigits: D19,
};

function multisetRun(cfg: Config, seed: number): RunStats {
  const g = mulberry32(seed);
  const bot = mulberry32(seed ^ 0x9e3779b9);
  const { rules: r } = cfg;
  const c: Counts = new Array(10).fill(0);
  for (const d of cfg.opening) c[d]++;
  const s: RunStats = { rounds: 0, capped: false, answerable: 0, ceil: 0, ceilAnswerable: 0, choice: 0, meaningful: 0, correct: 0, long: 0, padded: 0, misses: 0, discards: 0 };
  let p = drawProduct(r, c, cfg.kind, g);
  for (;;) {
    if (size(c) < r.cost(p)) return s; // §1.8 loss: fewer tiles than the answer needs
    if (s.rounds >= cfg.maxRounds) { s.capped = true; return s; }
    const opts = r.options(c, p);
    const atCeil = size(c) === cfg.cap;
    if (atCeil) s.ceil++;
    if (opts.length > 0) { s.answerable++; if (atCeil) s.ceilAnswerable++; }
    if (opts.length >= 2) {
      s.choice++;
      const v = opts.map((o) => coverageWithout(r, c, o));
      if (Math.max(...v) - Math.min(...v) > 1e-12) s.meaningful++;
    }
    s.rounds++;
    const miss = opts.length > 0 && bot() < cfg.skill ? [] : cfg.missPick === "random" ? randomMiss(r, c, p, bot) : missSpend(r, c, p);
    if (miss.length === 0) {
      const spend = choose(r, c, opts, cfg.policy, bot);
      s.correct++;
      if (spend.length === 3) {
        s.long++;
        const i = spend.indexOf(1);
        if (i >= 0 && spend.filter((_, j) => j !== i).reduce((x, y) => x * y, 1) === p) s.padded++;
      }
      for (const d of spend) c[d]--;
      const rewards = cfg.rewardBonus === null ? spend.length + 1 : cfg.rewardBonus;
      for (let i = 0; i < rewards; i++) c[r.rewardDigits[bin(g(), r.rewardDigits.length)]!]++;
      while (size(c) > cfg.cap) {
        c[cfg.discard === "random" ? randomTile(c, bot) : cheapest(r, c, 1)[0]!]--;
        s.discards++;
      }
    } else {
      s.misses++;
      for (const d of miss) c[d]--;
    }
    p = drawProduct(r, c, cfg.kind, g);
  }
}

// Shipped Endless on the real reducer and generators, same policy.
function toCounts(tiles: readonly Tile[]): Counts {
  const c: Counts = new Array(10).fill(0);
  for (const t of tiles) if ("digit" in t) c[t.digit]++;
  return c;
}
function reducerRun(skill: number, seed: number, maxRounds: number): number {
  const g = mulberry32(seed);
  const bot = mulberry32(seed ^ 0x9e3779b9);
  let n = 0;
  const ids = () => `t${n++}`;
  const inv = createInitialInventory(ids, 10);
  let st: GameState = gameReducer(createTitleState(), { type: "START_RUN", mode: "endless", equation: generateKindEquation(g, inv), inventory: inv });
  const pick = (d: number) => st.inventory.find((t) => "digit" in t && t.digit === d)!.id;
  while (st.phase === "answering" && st.totalRounds < maxRounds) {
    const c = toCounts(st.inventory);
    const p = st.equation!.product;
    const miss = canSpell(c, p) && bot() < skill ? [] : missSpend(forward, c, p);
    const correct = miss.length === 0;
    const ordered = miss.length === 2 && miss.join("") === String(p) ? [miss[1]!, miss[0]!] : miss;
    const spend = correct ? productDigits(p) : ordered;
    for (const d of spend) st = gameReducer(st, { type: "SELECT_TILE", tileId: pick(d) });
    st = correct
      ? gameReducer(st, { type: "SUBMIT_CORRECT", rewardTiles: generateRewardTiles(getRewardCount(spend.length), g, ids, "endless", st.totalRounds) })
      : gameReducer(st, { type: "SUBMIT_INCORRECT" });
    while (st.phase === "overflow") st = gameReducer(st, { type: "TOGGLE_DISCARD", tileId: pick(cheapest(forward, toCounts(st.inventory), 1)[0]!) });
    if (st.phase !== "feedback") throw new Error(`unexpected phase ${st.phase}`);
    st = gameReducer(st, { type: "NEXT_ROUND", equation: generateKindEquation(g, st.inventory) });
  }
  return st.totalRounds;
}

// ---------------------------------------------------------------------------
const RUNS = Number(process.env.RUNS ?? 2000);
const CAP_ROUNDS = 1000;
function summarize(label: string, cfg: Config, runs = RUNS) {
  const all: RunStats[] = [];
  for (let i = 0; i < runs; i++) all.push(multisetRun(cfg, 1000 + i));
  const rounds = all.map((x) => x.rounds).sort((a, b) => a - b);
  const sum = (f: (x: RunStats) => number) => all.reduce((a, x) => a + f(x), 0);
  const totalRounds = sum((x) => x.rounds);
  const pct = (x: number) => (100 * x).toFixed(1).padStart(5);
  const q = (f: number) => rounds[Math.floor(f * (rounds.length - 1))];
  console.log(
    `${label.padEnd(44)} | rounds mean ${(totalRounds / runs).toFixed(1).padStart(6)} med ${String(q(0.5)).padStart(4)} p10 ${String(q(0.1)).padStart(4)} p90 ${String(q(0.9)).padStart(4)} | capped ${pct(sum((x) => (x.capped ? 1 : 0)) / runs)}% | b run ${pct(sum((x) => x.answerable) / totalRounds)}% | b@ceil ${pct(sum((x) => x.ceilAnswerable) / Math.max(1, sum((x) => x.ceil)))}% | choice ${pct(sum((x) => x.choice) / totalRounds)}% (differs ${pct(sum((x) => x.meaningful) / totalRounds)}%) | per run: real choices ${(sum((x) => x.meaningful) / runs).toFixed(2)}, misses ${(sum((x) => x.misses) / runs).toFixed(1)}, discards ${(sum((x) => x.discards) / runs).toFixed(1)} | 3-tile ${pct(sum((x) => x.long) / Math.max(1, sum((x) => x.correct)))}% padded-1 ${pct(sum((x) => x.padded) / Math.max(1, sum((x) => x.correct)))}% of correct`,
  );
  return all;
}
const base = (over: Partial<Config>): Config => ({
  rules: factor("pair", D19), cap: 9, opening: D19, kind: 0.2, skill: 1, policy: "greedy", rewardBonus: null, maxRounds: CAP_ROUNDS, discard: "greedy", missPick: "greedy", ...over,
});
const section = process.env.SECTION ?? "all";

if (section === "all" || section === "calib") {
  console.log(`== Calibration: real gameReducer vs multiset replica, shipped Endless (cap 10, kind 0.2), ${RUNS} seeds ==`);
  for (const skill of [1, 0.95]) {
    let same = 0, sumR = 0, sumM = 0;
    for (let i = 0; i < RUNS; i++) {
      const a = reducerRun(skill, 1000 + i, CAP_ROUNDS);
      const b = multisetRun({ ...base({}), rules: forward, cap: 10, opening: D09, skill }, 1000 + i).rounds;
      if (a === b) same++;
      sumR += a; sumM += b;
    }
    console.log(`skill ${skill}: identical run length on ${same}/${RUNS} seeds; mean rounds reducer ${(sumR / RUNS).toFixed(2)} vs replica ${(sumM / RUNS).toFixed(2)}`);
  }
  console.log("\n== Controls ==");
  summarize("NEG Factor C9, zero rewards", base({ rewardBonus: 0 }));
  summarize("NEG Endless C10, zero rewards", base({ rules: forward, cap: 10, opening: D09, rewardBonus: 0 }));
  summarize("POS Factor C9, kind 1.0, skill 1", base({ kind: 1 }), 300);
}

if (section === "all" || section === "main") {
  console.log("\n== Reference: shipped Endless, same bot ==");
  for (const skill of [1, 0.95]) summarize(`Endless C10 kind .2 skill ${skill}`, base({ rules: forward, cap: 10, opening: D09, skill }));
  console.log("\n== Factor, rewards 1-9, pair draw, greedy bot ==");
  for (const skill of [1, 0.95])
    for (const kind of [0, 0.2])
      for (const cap of [8, 9, 10, 11, 12])
        summarize(`F C${cap} kind ${kind} skill ${skill}`, base({ cap, kind, skill, opening: cap >= 9 ? D19 : D19.slice(0, cap) }), cap >= 11 ? 500 : RUNS);
}

if (section === "all" || section === "levers") {
  console.log("\n== Other levers (skill 1) ==");
  for (const cap of [9, 10]) summarize(`F C${cap} kind .2 PRODUCT draw`, base({ cap, rules: factor("product", D19) }));
  for (const cap of [9, 10]) summarize(`F C${cap} kind .2 rewards 0-9 (0 dead), opening 0-9`, base({ cap, rules: factor("pair", D09), opening: cap === 10 ? D09 : D09.slice(1) }));
}

if (section === "all" || section === "decision") {
  console.log("\n== Does the spend decision matter? pair-choice policy, discards and misses stay greedy ==");
  for (const cap of [9, 10])
    for (const policy of ["greedy", "random", "first", "anti"] as const)
      summarize(`F C${cap} kind .2 skill 1, choice=${policy}`, base({ cap, policy }));
}

if (section === "instrument") {
  console.log("== Instrument check: can this bot detect decision value? (skill 1, kind .2) ==");
  const e = { rules: forward, cap: 10, opening: D09 };
  summarize("Endless C10 all greedy", base(e));
  summarize("Endless C10 discard=random", base({ ...e, discard: "random" }));
  summarize("Endless C10 miss=random", base({ ...e, missPick: "random" }));
  summarize("F C10 all greedy", base({ cap: 10 }));
  summarize("F C10 discard=random", base({ cap: 10, discard: "random" }));
  summarize("F C10 miss=random", base({ cap: 10, missPick: "random" }));
  summarize("F C10 pair=anti", base({ cap: 10, policy: "anti" }));
}

if (section === "split") {
  console.log("== Variable-length answers (2 or 3 tiles, 1s allowed), rewards 1-9, pair draw ==");
  for (const kind of [0, 0.2])
    for (const cap of [6, 7, 8, 9, 10])
      summarize(`S C${cap} kind ${kind} greedy`, base({ rules: split, cap, kind, opening: cap >= 9 ? D19 : D19.slice(0, cap) }));
}
if (section === "splitpolicy") {
  const caps = (process.env.CAPS ?? "7,8").split(",").map(Number);
  const kind = Number(process.env.KIND ?? 0);
  for (const cap of caps)
    for (const policy of ["greedy", "shortest", "longest", "random", "anti"] as const)
      summarize(`S C${cap} kind ${kind} answer=${policy}`, base({ rules: split, cap, kind, policy, opening: cap >= 9 ? D19 : D19.slice(0, cap) }));
}

if (section === "paired") {
  // Same seed, one decision swapped: mean per-seed difference in rounds +/- standard error.
  const n = RUNS;
  const paired = (label: string, a: Config, b: Config) => {
    const d: number[] = [];
    let decisions = 0;
    for (let i = 0; i < n; i++) {
      const ra = multisetRun(a, 1000 + i);
      d.push(ra.rounds - multisetRun(b, 1000 + i).rounds);
      decisions += label.startsWith("pair") ? ra.meaningful : label.startsWith("discard") ? ra.discards : ra.misses;
    }
    const mean = d.reduce((x, y) => x + y, 0) / n;
    const sd = Math.sqrt(d.reduce((x, y) => x + (y - mean) ** 2, 0) / (n - 1));
    const per = decisions / n;
    console.log(`${label.padEnd(34)} diff ${mean.toFixed(2)} +/- ${(sd / Math.sqrt(n)).toFixed(2)} SE rounds | decisions/run ${per.toFixed(2)} | per decision ${(mean / per).toFixed(2)} +/- ${(sd / Math.sqrt(n) / per).toFixed(2)}`);
  };
  const f = base({ cap: 10 });
  console.log(`== Paired per-seed comparisons, Factor C10 kind .2 skill 1, ${n} seeds ==`);
  paired("pair: greedy - anti", f, base({ cap: 10, policy: "anti" }));
  paired("pair: greedy - random", f, base({ cap: 10, policy: "random" }));
  paired("discard: greedy - random", f, base({ cap: 10, discard: "random" }));
  paired("miss: greedy - random", f, base({ cap: 10, missPick: "random" }));
}

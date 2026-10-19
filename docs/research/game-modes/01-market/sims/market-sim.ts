// 01 · Market — economy of an open row of k equations ("tickets").
// Run: node <runner>/run.mjs /abs/market-sim.ts <section>
// Sections: verify | static | calib | sweep | chart | all
//
// Imports the real game modules for everything shared: canConstruct (the
// predicate is verified against it below), generateEquation,
// generateKindEquation (shipped 0.2 rate), generateRewardTiles (Endless digits).
// Re-implements only the round loop, because the reducer holds one equation.
import { canConstruct } from "../../../../../src/game/selectors.ts";
import {
  generateEquation,
  generateKindEquation,
  generateRewardTiles,
} from "../../../../../src/game/generators.ts";
import type { Digit, Tile } from "../../../../../src/game/types.ts";
import { writeFileSync } from "node:fs";

const SECTION = process.argv[3] ?? "all";
const OUT = import.meta.dirname;

// ---------- randomness (seeded for reproducibility of the research sim only) ----------
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let idn = 0;
const nextId = () => `t${idn++}`;

// ---------- hand as digit counts ----------
type Counts = number[];
const PAIRS: Array<[number, number]> = [];
for (let a = 1; a <= 9; a++) for (let b = a; b <= 9; b++) PAIRS.push([a, b]);
const PRODUCTS = PAIRS.map(([a, b]) => a * b);
const lenOf = (p: number) => (p >= 10 ? 2 : 1);
const digitsOf = (p: number) => (p < 10 ? [p] : [Math.floor(p / 10), p % 10]);
// How many of the 45 pairs' products contain digit d (the bot's notion of a useful digit).
const USE = Array.from({ length: 10 }, (_, d) => PRODUCTS.filter((p) => digitsOf(p).includes(d)).length);

function spells(c: Counts, product: number): boolean {
  if (product < 10) return c[product] > 0;
  const a = Math.floor(product / 10);
  const b = product % 10;
  return a === b ? c[a] > 1 : c[a] > 0 && c[b] > 0;
}
function toTiles(c: Counts): Tile[] {
  const tiles: Tile[] = [];
  for (let d = 0; d < 10; d++) for (let i = 0; i < c[d]; i++) tiles.push({ id: nextId(), isNew: false, digit: d as Digit });
  return tiles;
}
const handSize = (c: Counts) => c.reduce((s, x) => s + x, 0);

// ---------- tickets and rules ----------
type Ticket = { product: number; len: number; age: number };
type Rule =
  | { kind: "fresh" } // all k redrawn every submission: unchosen tickets vanish free
  | { kind: "standing" } // only the answered ticket is replaced (Patchwork queue)
  | { kind: "called"; T: number } // standing + a ticket open T submissions must be answered next
  | { kind: "expire"; T: number } // standing + a ticket open T submissions leaves, billed its digit count
  | { kind: "toll" } // standing + answering any but the oldest returns N, not N+1
  | { kind: "preview"; n: number }; // k = 1, but the next n equations are visible (lookahead, no choice)

type Bot = "smart" | "costBlind" | "random";
type Config = {
  label: string;
  k: number;
  rule: Rule;
  capacity: number;
  kindRate: 0 | 0.2;
  zeroRewards?: boolean;
  resampleHand?: boolean;
  trace?: boolean;
  clearAge?: number; // bot variant: deliberately miss an unspellable ticket once it has waited this long // engine check: redraw a uniform hand of the same size before each refill
  bot: Bot;
  loss: "anyTicket" | "strict2";
  cap: number;
  runs: number;
  seed: number;
  burnIn: number;
};

function drawProduct(rng: () => number, c: Counts, kindRate: 0 | 0.2): number {
  const eq = kindRate === 0.2 ? generateKindEquation(rng, toTiles(c)) : generateEquation(rng);
  return eq.product;
}

function coverage(c: Counts, tickets: Ticket[]): number {
  let n = 0;
  for (const t of tickets) if (spells(c, t.product)) n++;
  return n;
}
function distinct(c: Counts): number {
  let n = 0;
  for (let d = 0; d < 10; d++) if (c[d] > 0) n++;
  return n;
}
function lexGreater(a: number[], b: number[]): boolean {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return false;
}

// Removes m tiles. Smart: keep visible tickets spellable, then digit spread,
// then shed the most-copied digit, then the digit fewest products use.
function dropTiles(c: Counts, m: number, visible: Ticket[], bot: Bot, rng: () => number): void {
  for (let i = 0; i < m; i++) {
    if (handSize(c) === 0) return;
    if (bot === "random") {
      let r = Math.floor(rng() * handSize(c));
      for (let d = 0; d < 10; d++) {
        if (r < c[d]) { c[d]--; break; }
        r -= c[d];
      }
      continue;
    }
    let best = -1;
    let bestKey: number[] | null = null;
    for (let d = 0; d < 10; d++) {
      if (c[d] === 0) continue;
      c[d]--;
      const key = [coverage(c, visible), distinct(c), c[d] + 1, -USE[d]];
      c[d]++;
      if (bestKey === null || lexGreater(key, bestKey)) { best = d; bestKey = key; }
    }
    c[best]--;
  }
}

type RunStats = {
  subs: number;
  capped: boolean;
  correct: number;
  misses: number;
  missCost: number;
  bills: number;
  billCost: number;
  fullN: number;
  fullCorrect: number;
  fullGain: number;
  fullMissN: number;
  fullMissCost: number;
  endHand: number;
  spellShare: number[]; // per submission index: share of open tickets spellable at round start
  correctAt: number[];
  gainAt: number[];
};

function runOnce(cfg: Config, rng: () => number): RunStats {
  const C = cfg.capacity;
  const c: Counts = new Array(10).fill(0);
  for (let i = 0; i < C; i++) c[i % 10]++; // round-robin opening deal, as createInitialInventory
  const rule = cfg.rule;
  const row: Ticket[] = [];
  const queue: Ticket[] = []; // preview only
  const newTicket = (): Ticket => {
    const p = drawProduct(rng, c, cfg.kindRate);
    return { product: p, len: lenOf(p), age: 0 };
  };
  const kOpen = rule.kind === "preview" ? 1 : cfg.k;
  while (row.length < kOpen) row.push(newTicket());
  if (rule.kind === "preview") while (queue.length < rule.n) queue.push(newTicket());

  const s: RunStats = {
    subs: 0, capped: false, correct: 0, misses: 0, missCost: 0, bills: 0, billCost: 0,
    fullN: 0, fullCorrect: 0, fullGain: 0, fullMissN: 0, fullMissCost: 0, endHand: 0, spellShare: [], correctAt: [], gainAt: [],
  };
  const T = rule.kind === "called" || rule.kind === "expire" ? rule.T : Infinity;

  while (s.subs < cfg.cap) {
    const h = handSize(c);
    // Called tickets are the only ones answerable; the oldest first.
    let candidates = row.map((_, i) => i);
    if (rule.kind === "called") {
      const due = candidates.filter((i) => row[i].age >= T);
      if (due.length > 0) {
        const oldest = due.reduce((a, b) => (row[b].age > row[a].age ? b : a));
        candidates = [oldest];
      }
    }
    candidates = candidates.filter((i) => row[i].len <= h);
    if (candidates.length === 0 || (cfg.loss === "strict2" && h < 2)) break; // loss
    if (s.subs < 100) s.spellShare.push(coverage(c, row) / row.length);

    const oldestAge = Math.max(...row.map((t) => t.age));
    const isOldest = (i: number) => row[i].age === oldestAge && row.findIndex((t) => t.age === oldestAge) === i;
    const gainIfCorrect = (i: number) => (cfg.zeroRewards ? -row[i].len : rule.kind === "toll" && !isOldest(i) ? 0 : 1);

    // Choose a ticket.
    let pick = candidates[0];
    const clog = cfg.clearAge === undefined ? [] : candidates.filter((i) => row[i].age >= cfg.clearAge! && !spells(c, row[i].product));
    if (clog.length > 0) {
      pick = clog.reduce((a, b) => (row[b].age > row[a].age ? b : a));
    } else if (cfg.bot !== "random" && candidates.length > 1) {
      const anySpellable = candidates.some((i) => spells(c, row[i].product));
      if (cfg.bot === "costBlind" && !anySpellable) {
        pick = candidates.reduce((a, b) => (row[b].age > row[a].age ? b : a));
      } else {
        let bestKey: number[] | null = null;
        for (const i of candidates) {
          const t = row[i];
          const ok = spells(c, t.product);
          const others = row.filter((_, j) => j !== i);
          let bills = 0;
          if (rule.kind === "expire") for (const u of others) if (u.age + 1 >= T) bills += u.len;
          const c2 = c.slice();
          if (ok) for (const d of digitsOf(t.product)) c2[d]--;
          else dropTiles(c2, t.len, others, cfg.bot, rng);
          const key = [(ok ? gainIfCorrect(i) : -t.len) - bills, coverage(c2, others), t.age];
          if (bestKey === null || lexGreater(key, bestKey)) { pick = i; bestKey = key; }
        }
      }
    }

    const t = row[pick];
    if (cfg.trace) {
      const hand = c.map((n, d) => String(d).repeat(n)).join("");
      const rowStr = row.map((u, i) => `${u.product}${spells(c, u.product) ? "+" : "-"}a${u.age}${i === pick ? "*" : ""}`).join(" ");
      console.log(`#${String(s.subs + 1).padStart(3)} h=${String(h).padStart(2)} [${hand.padEnd(11)}] ${rowStr}`);
    }
    const full = h === C && s.subs >= cfg.burnIn;
    const ok = spells(c, t.product);
    const pickWasOldest = isOldest(pick);
    let gain: number;
    row.splice(pick, 1);
    if (rule.kind === "fresh") row.length = 0;
    const visibleAfter = () => (rule.kind === "preview" ? queue : row);
    if (ok) {
      for (const d of digitsOf(t.product)) c[d]--;
      const rewardCount = cfg.zeroRewards ? 0 : t.len + (rule.kind === "toll" && !pickWasOldest ? 0 : 1);
      for (const tile of generateRewardTiles(rewardCount, rng, nextId, "endless", 0)) if ("digit" in tile) c[tile.digit]++;
      gain = rewardCount - t.len;
      s.correct++;
    } else {
      dropTiles(c, t.len, visibleAfter(), cfg.bot, rng);
      gain = -t.len;
      s.misses++;
      s.missCost += t.len;
    }
    // Every ticket still open ages; expiry bills are paid with the overflow, in one discard.
    for (const u of row) u.age++;
    let billed = 0;
    if (rule.kind === "expire") {
      for (let j = row.length - 1; j >= 0; j--) {
        if (row[j].age >= T) { billed += row[j].len; s.bills++; row.splice(j, 1); }
      }
    }
    const excess = Math.max(0, handSize(c) - C) + billed;
    s.billCost += Math.min(billed, handSize(c));
    dropTiles(c, excess, visibleAfter(), cfg.bot, rng);
    if (s.subs < 100) { s.correctAt.push(ok ? 1 : 0); s.gainAt.push(gain - billed); }
    if (full) {
      s.fullN++;
      if (ok) s.fullCorrect++;
      else { s.fullMissN++; s.fullMissCost += t.len; }
      s.fullGain += gain - billed;
    }
    if (cfg.resampleHand) {
      const n = handSize(c);
      c.fill(0);
      for (let i = 0; i < n; i++) c[Math.floor(rng() * 10)]++;
    }
    // Refill (drawn against the settled hand, as NEXT_ROUND does).
    if (rule.kind === "preview") {
      row.push(queue.shift()!);
      queue.push(newTicket());
    } else {
      while (row.length < kOpen) row.push(newTicket());
    }
    s.subs++;
  }
  s.capped = s.subs >= cfg.cap;
  s.endHand = handSize(c);
  return s;
}

type Summary = {
  label: string; k: number; rule: string; capacity: number; kindRate: number; bot: Bot; loss: string;
  runs: number; median: number; max: number; mean: number; pCap: number; bAll: number; bFull: number; cAll: number;
  cFull: number; billsPerSub: number; driftFull: number; fullN: number; cliffFull: number; marginFull: number;
  spellShare: number[]; correctAt: number[]; lateB: number; lateDrift: number; lateN: number; p100: number; p200: number;
};

function ruleName(r: Rule): string {
  if (r.kind === "called" || r.kind === "expire") return `${r.kind}(T=${r.T})`;
  if (r.kind === "preview") return `preview(n=${r.n})`;
  return r.kind;
}

function simulate(cfg: Config): Summary {
  const rng = mulberry32(cfg.seed);
  const all: RunStats[] = [];
  for (let r = 0; r < cfg.runs; r++) all.push(runOnce(cfg, rng));
  const subs = all.map((x) => x.subs).sort((a, b) => a - b);
  const sum = (f: (x: RunStats) => number) => all.reduce((acc, x) => acc + f(x), 0);
  const totalSubs = sum((x) => x.subs);
  const fullN = sum((x) => x.fullN);
  const fullMissN = sum((x) => x.fullMissN);
  const bFull = sum((x) => x.fullCorrect) / fullN;
  const cFull = fullMissN ? sum((x) => x.fullMissCost) / fullMissN : NaN;
  const cliffFull = cFull / (1 + cFull);
  const share: number[] = [];
  for (let i = 0; i < 100; i++) {
    const v = all.filter((x) => x.spellShare.length > i).map((x) => x.spellShare[i]);
    share.push(v.length >= cfg.runs * 0.1 ? v.reduce((a, b) => a + b, 0) / v.length : NaN);
  }
  const curve = (pick: (x: RunStats) => number[]) => {
    const out: number[] = [];
    for (let i = 0; i < 100; i++) {
      const v = all.filter((x) => pick(x).length > i).map((x) => pick(x)[i]);
      out.push(v.length >= cfg.runs * 0.1 ? v.reduce((a, b) => a + b, 0) / v.length : NaN);
    }
    return out;
  };
  let lateC = 0, lateG = 0, lateN = 0;
  for (const x of all) for (let i = 15; i < x.correctAt.length; i++) { lateC += x.correctAt[i]; lateG += x.gainAt[i]; lateN++; }
  return {
    correctAt: curve((x) => x.correctAt), lateB: lateC / lateN, lateDrift: lateG / lateN, lateN,
    p100: all.filter((x) => x.subs >= 100).length / cfg.runs, p200: all.filter((x) => x.subs >= 200).length / cfg.runs,
    label: cfg.label, k: cfg.k, rule: ruleName(cfg.rule), capacity: cfg.capacity, kindRate: cfg.kindRate,
    bot: cfg.bot, loss: cfg.loss, runs: cfg.runs,
    median: subs[Math.floor(subs.length / 2)],
    max: subs[subs.length - 1],
    mean: totalSubs / cfg.runs,
    pCap: all.filter((x) => x.capped).length / cfg.runs,
    bAll: sum((x) => x.correct) / totalSubs,
    bFull,
    cAll: sum((x) => x.missCost) / Math.max(1, sum((x) => x.misses)),
    cFull,
    billsPerSub: sum((x) => x.billCost) / totalSubs,
    driftFull: sum((x) => x.fullGain) / fullN,
    fullN,
    cliffFull,
    marginFull: cliffFull - bFull,
    spellShare: share,
  };
}

const f = (x: number, d = 3) => (Number.isFinite(x) ? x.toFixed(d) : "  -  ");
function printRow(s: Summary) {
  console.log(
    [
      s.label.padEnd(30), `k=${s.k}`, `C=${s.capacity}`, `kind=${s.kindRate}`, s.bot.padEnd(9),
      `median=${String(s.median).padStart(4)}`, `max=${String(s.max).padStart(4)}`, `mean=${f(s.mean, 1).padStart(6)}`, `cap%=${f(100 * s.pCap, 1).padStart(5)}`,
      `bAll=${f(s.bAll)}`, `bFull=${f(s.bFull)}`, `cFull=${f(s.cFull, 2)}`, `bills/sub=${f(s.billsPerSub, 3)}`,
      `driftFull=${f(s.driftFull, 3).padStart(6)}`, `nFull=${s.fullN}`,
      `| late(i>=15) b=${f(s.lateB)} drift=${f(s.lateDrift).padStart(6)} n=${s.lateN}`, `p100=${f(100 * s.p100, 1)}%`, `p200=${f(100 * s.p200, 1)}%`,
    ].join("  "),
  );
}

const base = (over: Partial<Config> & Pick<Config, "label" | "k" | "rule">): Config => ({
  capacity: 10, kindRate: 0.2, bot: "smart", loss: "anyTicket", cap: 1000, runs: 1000, seed: 20261017, burnIn: 10,
  ...over,
});

// ---------- sections ----------
if (SECTION === "verify" || SECTION === "all") {
  // Instrument check: the fast count predicate must agree with the real canConstruct.
  let checked = 0;
  let disagree = 0;
  for (let mask = 0; mask < 1024; mask++) {
    for (const dup of [1, 2]) {
      const c = Array.from({ length: 10 }, (_, d) => ((mask >> d) & 1 ? dup : 0));
      const tiles = toTiles(c);
      for (const p of PRODUCTS) {
        checked++;
        if (spells(c, p) !== canConstruct(tiles, p)) disagree++;
      }
    }
  }
  console.log(`verify: ${checked} (hand, product) cases, ${disagree} disagreements with canConstruct`);
  // Negative control on the checker: a deliberately wrong predicate must disagree.
  let wrong = 0;
  for (let mask = 0; mask < 1024; mask++) {
    const c = Array.from({ length: 10 }, (_, d) => ((mask >> d) & 1));
    const tiles = toTiles(c);
    for (const p of PRODUCTS) if ((c[p % 10] > 0) !== canConstruct(tiles, p)) wrong++;
  }
  console.log(`verify (control): a units-digit-only predicate disagrees on ${wrong} cases (must be > 0)`);
}

if (SECTION === "static" || SECTION === "all") {
  // Fresh row, exact in the tickets: E_hand[1 - (1 - q(hand))^k], q = share of the 45
  // pairs the hand spells, with the real canConstruct on uniform random hands.
  const rng = mulberry32(7);
  const HANDS = 20000;
  console.log("\nstatic fresh row: P(at least one of k open tickets is spellable), uniform hand of n tiles");
  console.log("n   b(n)    k=1    k=2    k=3    k=4    k=5   | naive 1-(1-b)^3 | with kind 0.2: k=1  k=2  k=3");
  const staticOut: Record<string, number[]> = {};
  for (const n of [6, 8, 9, 10, 12, 14]) {
    const acc = [0, 0, 0, 0, 0];
    const accK = [0, 0, 0];
    let bSum = 0;
    for (let h = 0; h < HANDS; h++) {
      const tiles: Tile[] = Array.from({ length: n }, () => ({ id: nextId(), isNew: false, digit: Math.floor(rng() * 10) as Digit }));
      let hit = 0;
      for (const p of PRODUCTS) if (canConstruct(tiles, p)) hit++;
      const q = hit / PRODUCTS.length;
      bSum += q;
      for (let k = 1; k <= 5; k++) acc[k - 1] += 1 - (1 - q) ** k;
      // kind ticket spellable by construction when the hand spells anything (else uniform fallback)
      const qk = q > 0 ? 0.2 + 0.8 * q : 0;
      for (let k = 1; k <= 3; k++) accK[k - 1] += 1 - (1 - qk) ** k;
    }
    const b = bSum / HANDS;
    staticOut[n] = acc.map((x) => x / HANDS);
    console.log(
      `${String(n).padEnd(3)} ${f(b)}  ${acc.map((x) => f(x / HANDS)).join("  ")}  |     ${f(1 - (1 - b) ** 3)}       |  ${accK.map((x) => f(x / HANDS)).join("  ")}`,
    );
  }
  writeFileSync(`${OUT}/static.json`, JSON.stringify(staticOut, null, 1));
}

if (SECTION === "calib" || SECTION === "all") {
  console.log("\ncalibration: k = 1 is Endless; random-discard bot keeps the hand near uniform");
  const rows = [
    simulate(base({ label: "E0 engine, uniform hand, kind0", k: 1, rule: { kind: "standing" }, kindRate: 0, bot: "random", resampleHand: true, runs: 20000 })),
    simulate(base({ label: "E1 engine, uniform hand, kind0.2", k: 1, rule: { kind: "standing" }, kindRate: 0.2, bot: "random", resampleHand: true, runs: 20000 })),
    simulate(base({ label: "C1 endless random kind0", k: 1, rule: { kind: "standing" }, kindRate: 0, bot: "random", runs: 20000 })),
    simulate(base({ label: "C2 endless random kind0.2", k: 1, rule: { kind: "standing" }, kindRate: 0.2, bot: "random", runs: 20000 })),
    simulate(base({ label: "C3 endless smart kind0.2", k: 1, rule: { kind: "standing" }, kindRate: 0.2, bot: "smart" })),
    simulate(base({ label: "N1 zero rewards (must lose)", k: 3, rule: { kind: "fresh" }, kindRate: 0.2, bot: "smart", zeroRewards: true })),
    simulate(base({ label: "P1 fresh k=5 (must pin)", k: 5, rule: { kind: "fresh" }, kindRate: 0.2, bot: "smart" })),
  ];
  rows.forEach(printRow);
  const n1 = rows[5];
  console.log(`negative control: zero rewards -> longest run ${n1.max} submissions (must be <= 10), cap% ${f(100 * n1.pCap, 1)} (must be 0)`);
}

if (SECTION === "sweep" || SECTION === "all") {
  const out: Summary[] = [];
  for (const kindRate of [0.2, 0] as const) {
    console.log(`\nsweep: capacity 10, kind ${kindRate}, smart bot, loss = cannot fill any open ticket`);
    const rules: Rule[] = [
      { kind: "fresh" }, { kind: "standing" }, { kind: "toll" },
      { kind: "called", T: 2 }, { kind: "called", T: 3 }, { kind: "called", T: 4 }, { kind: "called", T: 6 },
      { kind: "expire", T: 2 }, { kind: "expire", T: 3 }, { kind: "expire", T: 4 }, { kind: "expire", T: 6 },
    ];
    for (const rule of rules) {
      for (const k of [1, 2, 3, 4, 5]) {
        const s = simulate(base({ label: ruleName(rule), k, rule, kindRate, runs: 600, cap: 500 }));
        out.push(s);
        printRow(s);
      }
    }
  }
  writeFileSync(`${OUT}/sweep.json`, JSON.stringify(out, null, 1));
}

if (SECTION === "trace") {
  const cfg = base({ label: "trace", k: 3, rule: { kind: "standing" }, kindRate: 0.2, runs: 1, seed: Number(process.argv[4] ?? 3), trace: true });
  const st = runOnce(cfg, mulberry32(cfg.seed));
  console.log(`ended after ${st.subs} submissions, hand ${st.endHand}`);
}

if (SECTION === "extra") {
  const out: Summary[] = [];
  const run = (cfg: Config) => { const r = simulate(cfg); out.push(r); printRow(r); };
  console.log("\n[A] robustness: standing row, 2000 runs, cap 2000");
  for (const kindRate of [0, 0.2] as const) for (const k of [1, 2, 3, 4, 5]) run(base({ label: `A standing`, k, rule: { kind: "standing" }, kindRate, runs: 2000, cap: 2000 }));
  console.log("\n[B] free pass for contrast, same instrument");
  for (const kindRate of [0, 0.2] as const) for (const k of [2, 3]) run(base({ label: `B fresh`, k, rule: { kind: "fresh" }, kindRate, runs: 2000, cap: 2000 }));
  console.log("\n[C] bot variants on standing k=3 (2000 runs, cap 2000)");
  for (const kindRate of [0, 0.2] as const) {
    run(base({ label: "C costBlind", k: 3, rule: { kind: "standing" }, kindRate, bot: "costBlind", runs: 2000, cap: 2000 }));
    for (const clearAge of [2, 4, 8]) run(base({ label: `C clearAge=${clearAge}`, k: 3, rule: { kind: "standing" }, kindRate, clearAge, runs: 2000, cap: 2000 }));
    run(base({ label: "C loss=strict2", k: 3, rule: { kind: "standing" }, kindRate, loss: "strict2", runs: 2000, cap: 2000 }));
  }
  console.log("\n[D] lookahead without choice (k=1, next n visible to the discard)");
  for (const kindRate of [0, 0.2] as const) for (const n of [1, 2, 3]) run(base({ label: `D preview n=${n}`, k: 1, rule: { kind: "preview", n }, kindRate, runs: 2000, cap: 2000 }));
  writeFileSync(`${OUT}/extra.json`, JSON.stringify(out, null, 1));
}

if (SECTION === "chart") {
  // Per-submission curves, binned by 5, over runs still alive (shown while >= 10% of runs are alive).
  const cfgs = [
    base({ label: "Endless (k=1, kind 0.2)", k: 1, rule: { kind: "standing" }, kindRate: 0.2, runs: 4000, cap: 500 }),
    base({ label: "Fresh row k=3, kind 0", k: 3, rule: { kind: "fresh" }, kindRate: 0, runs: 4000, cap: 500 }),
    base({ label: "Standing row k=3, kind 0", k: 3, rule: { kind: "standing" }, kindRate: 0, runs: 4000, cap: 500 }),
  ];
  const result: Record<string, Record<string, number[]>> = {};
  for (const cfg of cfgs) {
    const rng = mulberry32(cfg.seed);
    const runs = Array.from({ length: cfg.runs }, () => runOnce(cfg, rng));
    const bins = (pick: (x: RunStats) => number[]) => {
      const out: number[] = [];
      for (let b = 0; b < 12; b++) {
        let sum = 0, n = 0, alive = 0;
        for (const x of runs) {
          if (x.subs > b * 5) alive++;
          const arr = pick(x);
          for (let i = b * 5; i < Math.min(arr.length, b * 5 + 5); i++) { sum += arr[i]; n++; }
        }
        out.push(alive >= cfg.runs * 0.1 ? sum / n : NaN);
      }
      return out;
    };
    const alive = Array.from({ length: 12 }, (_, b) => runs.filter((x) => x.subs > b * 5).length / cfg.runs);
    result[cfg.label] = { spell: bins((x) => x.spellShare), correct: bins((x) => x.correctAt), drift: bins((x) => x.gainAt), alive };
    console.log(cfg.label);
    for (const [k, v] of Object.entries(result[cfg.label])) console.log("  " + k.padEnd(8), v.map((x) => (Number.isFinite(x) ? x.toFixed(2) : "  - ")).join(" "));
  }
  writeFileSync(`${OUT}/chart.json`, JSON.stringify(result, null, 1));
}

if (SECTION === "live") {
  // Row liveliness: share of open tickets spellable at round start, pooled over submissions 15-29.
  console.log("k=3, kind 0, 2000 runs, cap 500: median | late spellable share | late drift | bills/sub");
  const rules: Rule[] = [{ kind: "standing" }, { kind: "called", T: 3 }, { kind: "called", T: 4 }, { kind: "called", T: 6 }, { kind: "expire", T: 3 }, { kind: "expire", T: 4 }, { kind: "expire", T: 6 }];
  for (const rule of rules) {
    const r = simulate(base({ label: ruleName(rule), k: 3, rule, kindRate: 0, runs: 2000, cap: 500 }));
    const late = r.spellShare.slice(15, 30).filter(Number.isFinite);
    const share = late.reduce((a, b) => a + b, 0) / late.length;
    console.log(`${r.label.padEnd(14)} median ${String(r.median).padStart(3)} | spellable ${share.toFixed(2)} | late drift ${r.lateDrift.toFixed(2)} | bills ${r.billsPerSub.toFixed(2)}`);
  }
}

if (SECTION === "choice") {
  // How often a round offers a real choice: open tickets spellable at round start (k = 3).
  for (const kindRate of [0, 0.2] as const) {
    const cfg = base({ label: "standing", k: 3, rule: { kind: "standing" }, kindRate, runs: 2000, cap: 500 });
    const rng = mulberry32(cfg.seed);
    const hist = [[0, 0, 0, 0], [0, 0, 0, 0]]; // [all rounds, rounds >= 15] x spellable count 0..3
    for (let r = 0; r < cfg.runs; r++) {
      const st = runOnce(cfg, rng);
      st.spellShare.forEach((sh, i) => { const n = Math.round(sh * 3); hist[0][n]++; if (i >= 15) hist[1][n]++; });
    }
    for (const [name, h] of [["all rounds", hist[0]], ["round >= 16", hist[1]]] as const) {
      const tot = h.reduce((a, b) => a + b, 0);
      console.log(`kind ${kindRate} ${name.padEnd(11)}: spellable 0/1/2/3 = ${h.map((x) => (100 * x / tot).toFixed(1) + "%").join(" / ")}  (n=${tot})`);
    }
  }
}

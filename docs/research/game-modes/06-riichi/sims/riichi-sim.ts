// Riichi mode economy sim. Steps the REAL Endless reducer, kind generator and
// reward generator; the riichi layer (stake, pot, bank, lock) lives in this
// harness. Usage: node run.mjs riichi-sim.ts <calib|sweep|grid|tile|lock|hist> [runs]
import { gameReducer } from "../../../../../src/game/gameReducer.ts";
import { createInitialInventory, createTitleState } from "../../../../../src/game/factories.ts";
import { generateKindEquation, generateRewardTiles } from "../../../../../src/game/generators.ts";
import { answerMatches, canConstruct, getAnswerLength, getRewardCount } from "../../../../../src/game/selectors.ts";
import { INVENTORY_CAPACITY, KIND_EQUATION_RATE } from "../../../../../src/game/balance.ts";
import type { Digit, GameState, Tile } from "../../../../../src/game/types.ts";

const EXP = process.argv[3] ?? "calib";
const RUNS = Number(process.argv[4] ?? 2000);

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- coverage by digit-presence mask (no product of 1-9 pairs repeats a digit)
const PRODUCTS: number[] = [];
for (let a = 1; a <= 9; a++) for (let b = a; b <= 9; b++) PRODUCTS.push(a * b);
const PMASK = PRODUCTS.map((p) => [...String(p)].reduce((m, ch) => m | (1 << Number(ch)), 0));
const COVER = new Int32Array(1024);
for (let m = 0; m < 1024; m++) COVER[m] = PMASK.filter((pm) => (pm & m) === pm).length;
const WEIGHT = Array.from({ length: 10 }, (_, d) => PMASK.filter((pm) => pm & (1 << d)).length);
const MISS_COST = PRODUCTS.reduce((s, p) => s + String(p).length, 0) / PRODUCTS.length;
const CLIFF = MISS_COST / (1 + MISS_COST);

const digitOf = (t: Tile) => ("digit" in t ? t.digit : -1);
function counts(tiles: readonly Tile[]) {
  const c = new Array(10).fill(0);
  for (const t of tiles) c[digitOf(t)]++;
  return c;
}
const maskOf = (c: number[]) => c.reduce((m, n, d) => (n > 0 ? m | (1 << d) : m), 0);
const distinct = (c: number[]) => c.filter((n) => n > 0).length;
// P(next equation is buildable) under the shipped kind bias (generateKindEquation).
function qOf(c: number[]) {
  const cov = COVER[maskOf(c)];
  return cov === 0 ? 0 : KIND_EQUATION_RATE + (1 - KIND_EQUATION_RATE) * (cov / 45);
}
// Coverage lost if one tile of digit d leaves; duplicates cost nothing.
function loss(c: number[], d: number) {
  if (c[d] >= 2) return 0;
  const m = maskOf(c);
  return COVER[m] - COVER[m & ~(1 << d)];
}
// The least valuable tile: least coverage lost, then most copies, then lowest weight.
function leastValuable(tiles: readonly Tile[], exclude: Set<string>): Tile {
  const c = counts(tiles.filter((t) => !exclude.has(t.id)));
  let best: Tile | null = null;
  let key = [Infinity, 0, 0];
  for (const t of tiles) {
    if (exclude.has(t.id)) continue;
    const d = digitOf(t);
    const k = [loss(c, d), -c[d], WEIGHT[d]];
    if (k[0] < key[0] || (k[0] === key[0] && (k[1] < key[1] || (k[1] === key[1] && k[2] < key[2])))) {
      best = t;
      key = k;
    }
  }
  return best!;
}

// ---- policies
type Ctx = { q: number; distinct: number; tiles: number; k: number; pot: number; round: number };
type Policy = { name: string; declare: (x: Ctx, r: () => number) => boolean; bank: (x: Ctx) => boolean };
type Rules = { stake: number; cap: number; lock: boolean; side: boolean };
const gain = (k: number, cap: number) => Math.min(k, cap);
const myopicBank = (m: number, R: Rules) => (x: Ctx) =>
  (1 - x.q) * (x.pot + R.stake) > m * x.q * gain(x.k + 1, R.cap);

function families(R: Rules): Policy[] {
  const P: Policy[] = [{ name: "NEVER", declare: () => false, bank: () => true }];
  for (const K of [1, 2, 3, 4, 6, 8, 12])
    P.push({ name: `ALWAYS bank@${K}`, declare: () => true, bank: (x) => x.k >= K });
  for (const m of [1, 1.5, 2, 3])
    P.push({ name: `ALWAYS myopic×${m}`, declare: () => true, bank: myopicBank(m, R) });
  for (const th of [0.4, 0.5, 0.55, 0.6, 0.65, 0.7, 0.8, 0.9])
    for (const m of [1, 1.5, 2, 3])
      P.push({ name: `THRESH q≥${th} myopic×${m}`, declare: (x) => x.q >= th, bank: myopicBank(m, R) });
  for (const d of [5, 6, 7, 8, 9])
    for (const pstar of [6, 10, 15, 21, 36])
      P.push({
        name: `HUMAN distinct≥${d} call@${pstar}`,
        declare: (x) => x.distinct >= d,
        bank: (x) => x.pot >= pstar || x.distinct < d - 1,
      });
  return P;
}

// ---- one run
type Stats = {
  points: number; score: number; rounds: number; buildable: number; draws: number;
  riichiRounds: number; declares: number; banks: number; busts: number; banked: number;
  eligible: number; declineds: number; declLate: number;
  byDistinct: number[][]; // [distinct] -> [eligible, declared]
  episodes: [number, number][]; // [q at declaration, net of the episode]
  qHist: number[]; // eligible feedbacks by q bin of 0.05
};
function playRun(seed: number, skill: number, R: Rules, pol: Policy, opts: { tileBet?: boolean; zeroRewards?: boolean } = {}): Stats {
  const game = mulberry32(seed);
  const slip = mulberry32(seed ^ 0x9e3779b9);
  const coin = mulberry32(seed ^ 0x85ebca6b);
  let n = 0;
  const ids = () => `t${n++}`;
  const inv0 = createInitialInventory(ids);
  let s: GameState = gameReducer(createTitleState(), {
    type: "START_RUN", mode: "endless", equation: generateKindEquation(game, inv0), inventory: inv0,
  });
  const st: Stats = {
    points: 0, score: 0, rounds: 0, buildable: 0, draws: 0, riichiRounds: 0, declares: 0, banks: 0,
    busts: 0, banked: 0, eligible: 0, declineds: 0, declLate: 0,
    byDistinct: Array.from({ length: 11 }, () => [0, 0]), episodes: [], qHist: new Array(21).fill(0),
  };
  let riichi = false, k = 0, pot = 0, qDecl = 0;
  for (let guard = 0; guard < 5000 && s.phase === "answering"; guard++) {
    const eq = s.equation!;
    const len = getAnswerLength(eq);
    const buildable = canConstruct(s.inventory, eq.product);
    st.draws++;
    if (buildable) st.buildable++;
    if (riichi) st.riichiRounds++;
    // choose tiles
    let pick: Tile[] = [];
    const correct = buildable && slip() < skill;
    if (correct) {
      const used = new Set<string>();
      for (const ch of String(eq.product)) {
        const t = s.inventory.find((x) => !used.has(x.id) && digitOf(x) === Number(ch))!;
        used.add(t.id);
        pick.push(t);
      }
    } else {
      // A miss never spells the product by accident: for one slot, skip tiles holding it.
      const used = new Set<string>(len === 1 ? s.inventory.filter((t) => digitOf(t) === eq.product).map((t) => t.id) : []);
      if (used.size === s.inventory.length) used.clear(); // every tile is the product: unavoidable
      for (let i = 0; i < len; i++) { const t = leastValuable(s.inventory, used); used.add(t.id); pick.push(t); }
      if (answerMatches(pick, eq.product)) pick = pick.length === 2 ? [pick[1], pick[0]] : pick;
    }
    for (const t of pick) s = gameReducer(s, { type: "SELECT_TILE", tileId: t.id });
    const isRight = answerMatches(pick, eq.product);
    s = isRight
      ? gameReducer(s, { type: "SUBMIT_CORRECT", rewardTiles: generateRewardTiles(getRewardCount(len), game, ids, "endless", s.totalRounds) })
      : gameReducer(s, { type: "SUBMIT_INCORRECT" });
    if (opts.zeroRewards && isRight) {
      const got = new Set(s.lastResult!.rewardTileIds);
      s = { ...s, phase: "feedback", inventory: s.inventory.filter((t) => !got.has(t.id)) };
    }
    if (s.phase === "overflow") {
      // Riichi lock: the newest arrival (the rail tile) goes. Otherwise the bot chooses.
      const victim = riichi && R.lock && !opts.tileBet ? s.inventory[s.inventory.length - 1] : leastValuable(s.inventory, new Set());
      s = gameReducer(s, { type: "TOGGLE_DISCARD", tileId: victim.id });
    }
    // tile-currency variant: a declared bet pays +1 tile on correct, costs 1 tile on a miss
    if (opts.tileBet && riichi) {
      if (isRight) {
        const extra = generateRewardTiles(1, game, ids, "endless", s.totalRounds);
        let inv = [...s.inventory, ...extra];
        if (inv.length > INVENTORY_CAPACITY) { const v = leastValuable(inv, new Set()); inv = inv.filter((t) => t.id !== v.id); }
        s = { ...s, inventory: inv };
      } else if (s.inventory.length > 0) {
        const v = leastValuable(s.inventory, new Set());
        s = { ...s, inventory: s.inventory.filter((t) => t.id !== v.id) };
      }
      riichi = false;
    } else if (isRight) {
      st.score++;
      if (riichi) { k++; pot += gain(k, R.cap); }
      if (!riichi || R.side) st.points++; // side bet: the plain point always banks
    } else if (riichi) {
      st.busts++; st.episodes.push([qDecl, -R.stake]); riichi = false; k = 0; pot = 0;
    }
    // feedback decision, blind to the next equation
    const c = counts(s.inventory);
    const x: Ctx = { q: qOf(c), distinct: distinct(c), tiles: s.inventory.length, k, pot, round: s.round };
    if (riichi) {
      if (pol.bank(x)) { st.points += pot + R.stake; st.banks++; st.banked += pot; st.episodes.push([qDecl, pot]); riichi = false; k = 0; pot = 0; }
    } else if ((opts.tileBet || st.points >= R.stake) && x.tiles >= 2) {
      st.eligible++;
      st.byDistinct[x.distinct][0]++;
      st.qHist[Math.floor(x.q * 20 + 1e-9)]++;
      if (pol.declare(x, coin)) {
        if (!opts.tileBet) st.points -= R.stake;
        riichi = true; k = 0; pot = 0; qDecl = x.q; st.declares++;
        st.byDistinct[x.distinct][1]++;
        if (s.round > 10) st.declLate++;
      } else st.declineds++;
    }
    s = gameReducer(s, { type: "NEXT_ROUND", equation: generateKindEquation(game, s.inventory) });
  }
  if (riichi && pot > 0 && !opts.zeroRewards) throw new Error("pot stranded at game over"); // §5 rule edge: must never happen
  st.rounds = s.totalRounds;
  return st;
}

// ---- reporting
function meanCI(xs: number[]) {
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  const v = xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1);
  return [m, 1.96 * Math.sqrt(v / xs.length)];
}
const f = (x: number, d = 2) => x.toFixed(d);
function evaluate(pol: Policy, skill: number, R: Rules, runs: number, opts = {}, seed0 = 1000) {
  const out: Stats[] = [];
  for (let i = 0; i < runs; i++) out.push(playRun(seed0 + i, skill, R, pol, opts));
  return out;
}
const sum = (a: Stats[], key: keyof Stats) => a.reduce((t, s) => t + (s[key] as number), 0);
function row(name: string, a: Stats[], base?: Stats[]) {
  const [pm, pc] = meanCI(a.map((s) => s.points));
  const [rm, rc] = meanCI(a.map((s) => s.rounds));
  const bp = sum(a, "buildable") / sum(a, "draws");
  const diff = base ? meanCI(a.map((s, i) => s.points - base[i].points)) : null;
  const elig = sum(a, "eligible");
  return `| ${name} | ${f(pm, 1)} ± ${f(pc, 1)} | ${diff ? `${f(diff[0], 1)} ± ${f(diff[1], 1)}` : "—"} | ${f(rm, 1)} ± ${f(rc, 1)} | ${f(bp, 3)} | ${f(sum(a, "riichiRounds") / sum(a, "draws"), 2)} | ${f(sum(a, "declares") / a.length, 1)} | ${elig ? f(sum(a, "declineds") / elig, 2) : "—"} | ${f(sum(a, "busts") / Math.max(1, sum(a, "declares")), 2)} |`;
}
const HEAD = "| Policy | Points/run | Δ vs ref (paired) | Rounds | measured b′ | share of rounds in riichi | declares/run | declined share | bust share |\n|---|---|---|---|---|---|---|---|---|";

const PRIMARY: Rules = { stake: 1, cap: 8, lock: true, side: true };

if (EXP === "calib") {
  // b(n) two ways on random uniform hands; must agree, b(10) ~ 0.481
  const r = mulberry32(7);
  let a = 0, b = 0, z = 0;
  const T = 4000;
  for (let t = 0; t < T; t++) {
    const hand: Tile[] = Array.from({ length: 10 }, (_, i) => ({ id: `h${i}`, isNew: false, digit: Math.floor(r() * 10) as Digit }));
    a += PRODUCTS.filter((p) => canConstruct(hand, p)).length;
    b += COVER[maskOf(counts(hand))];
    z += qOf(counts(hand));
  }
  console.log(`b(10) canConstruct=${f(a / T / 45, 4)} mask=${f(b / T / 45, 4)} | analytic b'(10)=0.2+0.8b=${f(0.2 + 0.8 * a / T / 45, 4)} | mean q over hands=${f(z / T, 4)}`);
  console.log(`avg miss cost=${f(MISS_COST, 4)} cliff=${f(CLIFF, 4)} drift(0.48)=${f(0.48 - 0.52 * MISS_COST, 3)} | digit weights 0-9: ${WEIGHT.join(" ")}`);
  const zero = evaluate({ name: "x", declare: () => true, bank: () => false }, 0.95, PRIMARY, 2000, { zeroRewards: true });
  console.log(`NEG CONTROL zero rewards: max rounds=${Math.max(...zero.map((s) => s.rounds))} mean=${f(sum(zero, "rounds") / zero.length)} (must be <= 10)`);
  const nv = evaluate({ name: "x", declare: () => false, bank: () => true }, 0.95, PRIMARY, 2000);
  console.log(`NEVER skill .95: points==score in every run: ${nv.every((s) => s.points === s.score)}; mean rounds=${f(sum(nv, "rounds") / nv.length, 1)}; measured b'=${f(sum(nv, "buildable") / sum(nv, "draws"), 3)}`);
}

if (EXP === "sweep" || EXP === "grid" || EXP === "lock" || EXP === "replace") {
  const capList = EXP === "grid" ? [0, 1, 3, 5, 8, 12, 99] : EXP === "replace" ? [8, 99] : [8];
  const stakeList = EXP === "grid" ? [1, 2] : [1];
  const lockList = EXP === "lock" ? [true, false] : [true];
  for (const skill of EXP === "sweep" ? [0.95, 0.85] : [0.95])
    for (const cap of capList) for (const stake of stakeList) for (const lock of lockList) {
      const R: Rules = { stake, cap, lock, side: EXP !== "replace" };
      const pols = families(R);
      const res = pols.map((p) => [p, evaluate(p, skill, R, RUNS)] as const);
      const never = res[0][1];
      const mean = (a: Stats[]) => sum(a, "points") / a.length;
      const always = res.filter(([p]) => p.name.startsWith("ALWAYS")).sort((x, y) => mean(y[1]) - mean(x[1]))[0];
      const best = [...res].sort((x, y) => mean(y[1]) - mean(x[1]))[0];
      const human = res.filter(([p]) => p.name.startsWith("HUMAN")).sort((x, y) => mean(y[1]) - mean(x[1]))[0];
      // negative control: rack-blind declaring at the best policy's declare rate, same bank rule
      const rate = sum(best[1], "declares") / Math.max(1, sum(best[1], "eligible"));
      const m = Number(best[0].name.match(/myopic×([\d.]+)/)?.[1] ?? 1.5);
      const rnd: Policy = { name: `RANDOM p=${f(rate, 2)} myopic×${m}`, declare: (_x, r) => r() < rate, bank: myopicBank(m, R) };
      const rres = evaluate(rnd, skill, R, RUNS);
      console.log(`\n### ${R.side ? "side bet" : "pot replaces plain point"} · skill ${skill} · stake ${stake} · cap ${cap} · lock ${lock} · ${RUNS} paired runs\n${HEAD}`);
      console.log(row("NEVER", never));
      console.log(row(`best ALWAYS: ${always[0].name}`, always[1], never));
      console.log(row(`best overall: ${best[0].name}`, best[1], never));
      console.log(row(`best HUMAN: ${human[0].name}`, human[1], never));
      console.log(row(rnd.name, rres, never));
      const d1 = meanCI(best[1].map((s, i) => s.points - always[1][i].points));
      const d2 = meanCI(rres.map((s, i) => s.points - best[1][i].points));
      console.log(`best − bestALWAYS = ${f(d1[0], 1)} ± ${f(d1[1], 1)} · RANDOM − best = ${f(d2[0], 1)} ± ${f(d2[1], 1)} · best late-declare share = ${f(sum(best[1], "declLate") / Math.max(1, sum(best[1], "declares")), 2)} · mean banked pot = ${f(sum(best[1], "banked") / Math.max(1, sum(best[1], "banks")), 1)}`);
      if (EXP === "sweep") {
        const top = [...res].sort((x, y) => mean(y[1]) - mean(x[1])).slice(0, 6).map(([p, a]) => `${p.name}=${f(mean(a), 1)}`);
        console.log(`top6: ${top.join(" · ")}`);
        const bd = best[1].reduce((acc, s) => acc.map((v, d) => [v[0] + s.byDistinct[d][0], v[1] + s.byDistinct[d][1]]), Array.from({ length: 11 }, () => [0, 0]));
        console.log(`best declare rate by distinct digits at feedback: ${bd.map((v, d) => (v[0] ? `${d}:${f(v[1] / v[0], 2)}(n=${v[0]})` : "")).filter(Boolean).join(" ")}`);
      }
    }
}

if (EXP === "tile") {
  // Tile-currency bet, objective = rounds survived (Endless's headline). No points.
  for (const skill of [0.95, 0.85]) {
    const R = PRIMARY;
    const pols: Policy[] = [{ name: "NEVER", declare: () => false, bank: () => true }, { name: "ALWAYS", declare: () => true, bank: () => true }];
    for (const th of [0.5, 0.6, 0.7, 0.8, 0.9]) pols.push({ name: `THRESH q≥${th}`, declare: (x) => x.q >= th, bank: () => true });
    const res = pols.map((p) => [p, evaluate(p, skill, R, RUNS, { tileBet: true })] as const);
    const never = res[0][1];
    console.log(`\n### tile bet · skill ${skill} · ${RUNS} paired runs (rounds is the objective)\n| Policy | Rounds | Δ rounds vs NEVER (paired) | measured b′ | declares/run |\n|---|---|---|---|---|`);
    for (const [p, a] of res) {
      const [rm, rc] = meanCI(a.map((s) => s.rounds));
      const d = meanCI(a.map((s, i) => s.rounds - never[i].rounds));
      console.log(`| ${p.name} | ${f(rm, 1)} ± ${f(rc, 1)} | ${f(d[0], 1)} ± ${f(d[1], 1)} | ${f(sum(a, "buildable") / sum(a, "draws"), 3)} | ${f(sum(a, "declares") / a.length, 1)} |`);
    }
  }
}

if (EXP === "confirm") {
  // Fresh seeds (50000+), so picking the best of 60 on seeds 1000+ cannot flatter it.
  for (const [lock, skill] of [[true, 0.95], [true, 0.85], [false, 0.95]] as const) {
    const R: Rules = { stake: 1, cap: Infinity, lock, side: true };
    const named: Policy[] = [
      { name: "NEVER", declare: () => false, bank: () => true },
      { name: "ALWAYS myopic×1", declare: () => true, bank: myopicBank(1, R) },
      { name: "THRESH q≥0.55 myopic×1", declare: (x) => x.q >= 0.55, bank: myopicBank(1, R) },
      { name: "THRESH q≥0.65 myopic×1", declare: (x) => x.q >= 0.65, bank: myopicBank(1, R) },
      { name: "HUMAN distinct≥8 call@6", declare: (x) => x.distinct >= 8, bank: (x) => x.pot >= 6 || x.distinct < 7 },
      { name: "RANDOM p=0.30 myopic×1", declare: (_x, r) => r() < 0.3, bank: myopicBank(1, R) },
    ];
    const res = named.map((p) => [p, evaluate(p, skill, R, RUNS, {}, 50000)] as const);
    const never = res[0][1];
    console.log(`\n### confirm on fresh seeds · lock ${lock} · skill ${skill} · stake 1 · uncapped · ${RUNS} paired runs\n${HEAD}`);
    for (const [p, a] of res) console.log(row(p.name, a, p.name === "NEVER" ? undefined : never));
    const a = res[1][1], b = res[2][1], h = res[4][1];
    const d = meanCI(b.map((s, i) => s.points - a[i].points));
    console.log(`THRESH0.55 − ALWAYS = ${f(d[0], 2)} ± ${f(d[1], 2)} · late-declare share THRESH0.55 = ${f(sum(b, "declLate") / sum(b, "declares"), 2)} · HUMAN late share = ${f(sum(h, "declLate") / sum(h, "declares"), 2)}`);
  }
}

if (EXP === "curve") {
  // Episode net per declaration by q at declaration (ALWAYS declares everywhere, so it samples every bin),
  // and where rack states actually sit (eligible feedbacks under NEVER). Lock on, stake 1, uncapped, skill .95.
  const R: Rules = { stake: 1, cap: Infinity, lock: true, side: true };
  const always = evaluate({ name: "A", declare: () => true, bank: myopicBank(1, R) }, 0.95, R, RUNS, {}, 50000);
  const never = evaluate({ name: "N", declare: () => false, bank: () => true }, 0.95, R, RUNS, {}, 50000);
  const hist = never.reduce((acc, s) => acc.map((v, i) => v + s.qHist[i]), new Array(21).fill(0));
  const tot = hist.reduce((a, b) => a + b, 0);
  const eps = always.flatMap((s) => s.episodes);
  console.log("bin_lo,share_of_states,n_declarations,mean_net,ci95");
  for (let i = 4; i < 21; i++) {
    const xs = eps.filter(([q]) => Math.floor(q * 20 + 1e-9) === i).map(([, n]) => n);
    const [m, c] = xs.length > 1 ? meanCI(xs) : [NaN, NaN];
    console.log(`${f(i / 20, 2)},${f(hist[i] / tot, 4)},${xs.length},${f(m, 3)},${f(c, 3)}`);
  }
  const below = hist.slice(0, 10).reduce((a, b) => a + b, 0) / tot;
  console.log(`share of eligible states with q < 0.50: ${f(below, 3)}`);
}

if (EXP === "bank") {
  // Is the call (when to bank) live? Fixed declare rule, varied bank rule. Fresh seeds.
  for (const skill of [0.95, 0.85]) {
    const R: Rules = { stake: 1, cap: Infinity, lock: true, side: true };
    const d = (x: Ctx) => x.q >= 0.55;
    const pols: Policy[] = [
      { name: "lookahead (myopic×1)", declare: d, bank: myopicBank(1, R) },
      { name: "bank@1", declare: d, bank: (x) => x.k >= 1 },
      { name: "bank@3", declare: d, bank: (x) => x.k >= 3 },
      { name: "ride to bust (never bank)", declare: d, bank: () => false },
    ];
    const res = pols.map((p) => [p, evaluate(p, skill, R, RUNS, {}, 50000)] as const);
    const look = res[0][1];
    console.log(`\n### bank rule · THRESH q≥0.55 · skill ${skill} · lock on · ${RUNS} paired runs (fresh seeds)\n| Bank rule | Points/run | lookahead − this (paired) | mean banked pot | bust share |\n|---|---|---|---|---|`);
    for (const [p, a] of res) {
      const [m, c] = meanCI(a.map((s) => s.points));
      const df = meanCI(look.map((s, i) => s.points - a[i].points));
      console.log(`| ${p.name} | ${f(m, 2)} ± ${f(c, 2)} | ${p === pols[0] ? "—" : `${f(df[0], 2)} ± ${f(df[1], 2)}`} | ${f(sum(a, "banked") / Math.max(1, sum(a, "banks")), 1)} | ${f(sum(a, "busts") / Math.max(1, sum(a, "declares")), 2)} |`);
    }
  }
}

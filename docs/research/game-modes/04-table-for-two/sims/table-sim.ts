// Shared Table two-seat simulator. Real generators/selectors; table rules re-implemented.
// Usage: node run.mjs table-sim.ts   (config via env SIM=<mode>, GAMES=<n>)
import { generateEquation, generateKindEquation, generateRewardTiles } from "../../../../../src/game/generators.ts";
import type { Digit, RandomSource, Tile } from "../../../../../src/game/types.ts";

// ---------- deterministic per-purpose streams (variants share random numbers) ----------
function xmur3(s: string) {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}
function mulberry32(a: number): RandomSource {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const stream = (...k: (string | number)[]) => mulberry32(xmur3(k.join("|")));

// ---------- coverage table: digit-only hands, presence mask -> share of the 45 pairs ----------
const PAIRS: { mask: number; len: number }[] = [];
for (let a = 1; a <= 9; a++) for (let b = a; b <= 9; b++) {
  const ds = String(a * b).split("").map(Number);
  PAIRS.push({ mask: ds.reduce((m, d) => m | (1 << d), 0), len: ds.length });
}
const COV = new Float64Array(1024);
for (let m = 0; m < 1024; m++) COV[m] = PAIRS.filter((q) => (q.mask & m) === q.mask).length / 45;
const USE = Array.from({ length: 10 }, (_, d) => PAIRS.filter((q) => q.mask & (1 << d)).length);
const maskOf = (c: number[]) => c.reduce((m, n, d) => (n > 0 ? m | (1 << d) : m), 0);
const sizeOf = (c: number[]) => c.reduce((s, n) => s + n, 0);
let tid = 0;
const toTiles = (c: number[]): Tile[] => c.flatMap((n, d) => Array.from({ length: n }, () => ({ id: `t${tid++}`, isNew: false, digit: d as Digit })));

export type Cfg = {
  name: string; cap: number; kind: 0 | 0.2;
  river: "none" | "live" | "history";
  call: "loan" | "free" | "take" | "feed";
  lossCountsLive: boolean;
  lambda: [number, number];   // discard policy: 0 selfish, >0 defensive (block), <0 gifting
  skill: [number, number];
  rewards: boolean;           // false = negative control
  coop: boolean;              // team ends when either seat fails
  solo?: boolean;             // seat 0 alone (calibration)
  maxRounds: number;
  liveWidth?: number;
  start?: number;
  closedFirstRound?: boolean; // no live tiles on round 1             // opening hand size, dealt round-robin (default 10)         // truncate each throw to this many live tiles (control: 0)
};

// Pick k tiles to give up; greedy on own coverage loss + lambda * opponent's gain if the digit went live.
function pick(c: number[], opp: number[] | null, lambda: number): number {
  const m = maskOf(c); const om = opp ? maskOf(opp) : 0; let best = -1, bestScore = Infinity;
  for (let d = 0; d < 10; d++) { if (c[d] === 0) continue;
    const score = (c[d] > 1 ? 0 : COV[m] - COV[m & ~(1 << d)]) + lambda * (opp && opp[d] === 0 ? COV[om | (1 << d)] - COV[om] : 0) - 0.001 * c[d] + 0.0001 * USE[d] / 20;
    if (score < bestScore) { bestScore = score; best = d; } }
  return best;
}
function choose(c: number[], k: number, opp: number[] | null, lambda: number, rnd: RandomSource): number[] {
  if (k > 0 && opp) { THROWS.total++; if (pick(c, opp, 0) !== pick(c, opp, 1)) THROWS.contested++; }
  const out: number[] = [];
  for (let i = 0; i < k; i++) {
    const m = maskOf(c); const om = opp ? maskOf(opp) : 0;
    let best = -1, bestScore = Infinity;
    for (let d = 0; d < 10; d++) {
      if (c[d] === 0) continue;
      const ownLoss = c[d] > 1 ? 0 : COV[m] - COV[m & ~(1 << d)];
      const oppGain = opp && opp[d] === 0 ? COV[om | (1 << d)] - COV[om] : 0;
      const score = ownLoss + lambda * oppGain - 0.001 * c[d] + 0.0001 * USE[d] / 20 + 1e-7 * rnd();
      if (score < bestScore) { bestScore = score; best = d; }
    }
    if (best < 0) break;
    c[best]--; out.push(best);
  }
  return out;
}

type SeatStats = { turns: number; ownOk: number; liveOk: number; calls: number; atCap: number; atCapOk: number; correct: number; takes: number; fed: number };
export const BY_N = { turns: Array(31).fill(0), ok: Array(31).fill(0), delta: Array(31).fill(0) };
export const THROWS = { total: 0, contested: 0 };
export type GameResult = { winner: 0 | 1 | -1 | -2; rounds: number; leaderAt8: -1 | 0 | 1; stats: [SeatStats, SeatStats]; sizeLog: number[][] };
// winner: seat, -1 draw, -2 hit maxRounds

export function playGame(cfg: Cfg, g: number): GameResult {
  const deal = () => Array.from({ length: 10 }, (_, d) => Math.floor((cfg.start ?? 10) / 10) + (d < (cfg.start ?? 10) % 10 ? 1 : 0));
  const hands: number[][] = [deal(), deal()];
  const live: number[][] = [[], []];     // live[s] = tiles seat s may call (opponent's throw)
  const stats: [SeatStats, SeatStats] = [0, 1].map(() => ({ turns: 0, ownOk: 0, liveOk: 0, calls: 0, atCap: 0, atCapOk: 0, correct: 0, takes: 0, fed: 0 })) as [SeatStats, SeatStats];
  let leaderAt8: -1 | 0 | 1 = -1;
  const seats = cfg.solo ? [0] : [0, 1];
  const sizeLog: number[][] = [];
  for (let r = 1; r <= cfg.maxRounds; r++) {
    const failed = [false, false];
    for (const s of seats) {
      const o = 1 - s; const c = hands[s];
      const L = cfg.river === "none" || (cfg.closedFirstRound && r === 1) ? [] : live[s];
      const before = sizeOf(c);
      const eqR = stream(g, s, r, "eq");
      const eq = cfg.kind === 0.2 ? generateKindEquation(eqR, toTiles(c)) : (eqR(), generateEquation(eqR));
      const ds = String(eq.product).split("").map(Number); const N = ds.length;
      const reach = before + (cfg.lossCountsLive ? L.length : 0);
      if (reach < N) { failed[s] = true; continue; }
      const st = stats[s]; st.turns++;
      const sk = stream(g, s, r, "sk")(); const tb = stream(g, s, r, "tb");
      const opp = cfg.solo ? null : hands[o];
      const riverOn = cfg.river !== "none";
      const ownOk0 = ds.every((d) => c[d] > 0);
      // take: each live digit the seat lacks comes into its rack — a loan, repaid by one
      // fewer reward tile on a correct answer, or by a throw of its choice on a miss
      let taken = 0;
      // one take per turn: the live tile that completes this answer, else the one adding most coverage
      if (cfg.call === "take" && riverOn) {
        const m = maskOf(c); let best = -1, gain = 0;
        for (let i = 0; i < L.length; i++) { const d = L[i]; if (c[d] > 0) continue;
          const g2 = (ds.every((x) => c[x] > 0 || x === d) ? 1 : 0) + COV[m | (1 << d)] - COV[m];
          if (g2 > gain) { gain = g2; best = i; } }
        if (best >= 0) { c[L[best]]++; L.splice(best, 1); taken = 1; }
      }
      st.takes += taken;
      const ownOk = ds.every((d) => c[d] > 0);
      // call (loan/free): live tiles go straight into the slots the rack cannot fill
      const callable = ownOk ? [] : ds.filter((d) => c[d] === 0);
      const Lc = [...L];
      const liveOk = !ownOk && riverOn && (cfg.call === "loan" || cfg.call === "free") &&
        callable.every((d) => { const i = Lc.indexOf(d); if (i < 0) return false; Lc.splice(i, 1); return true; });
      const ok = ownOk || liveOk;
      if (ownOk0) st.ownOk++;
      if (ok) st.liveOk++;
      if (ok && !ownOk0) st.calls++; // a rescue: the river made this turn spellable
      if (before >= cfg.cap) { st.atCap++; if (ok) st.atCapOk++; }
      const calls = liveOk ? callable.length : 0;
      if (liveOk) for (const d of callable) L.splice(L.indexOf(d), 1);
      let throwOut: number[] = [];
      if (ok && sk < cfg.skill[s]) {
        for (const d of ds) if (!(liveOk && callable.includes(d))) c[d]--;
        let nReward = cfg.call === "free" ? N - calls + 1 : N + 1 - taken;
        if (cfg.call === "feed" && riverOn) { const fed = L.splice(0, Math.min(nReward, L.length)); for (const d of fed) c[d]++; st.fed += fed.length; nReward -= fed.length; }
        if (cfg.rewards) for (const t of generateRewardTiles(nReward, stream(g, s, r, "rw"), () => `r${tid++}`, "endless", r)) c[(t as { digit: Digit }).digit]++;
        const target = Math.min(cfg.cap, cfg.call === "free" ? sizeOf(c) : before + 1);
        throwOut = choose(c, Math.max(0, sizeOf(c) - target), opp, cfg.lambda[s], tb);
        st.correct++;
      } else if (ok) {
        // arithmetic error: spends the answer's own tiles (e.g. 65 for 56); loans are repaid
        for (const d of ds) if (!(liveOk && callable.includes(d))) { c[d]--; throwOut.push(d); }
        const owe = (cfg.call === "loan" ? calls : 0) + taken;
        if (owe) throwOut.push(...choose(c, Math.min(owe, sizeOf(c)), opp, cfg.lambda[s], tb));
      } else {
        // deliberate miss (+ repay any take); "free" calls fill slots from the live window (the exploit)
        let ownNeed = N;
        if (cfg.call === "free" && riverOn) { const use = Math.min(N, L.length); L.splice(0, use); ownNeed = N - use; }
        throwOut = choose(c, Math.min(ownNeed + taken, sizeOf(c)), opp, cfg.lambda[s], tb);
      }
      BY_N.turns[before]++; BY_N.ok[before] += ok ? 1 : 0; BY_N.delta[before] += sizeOf(c) - before;
      // what this seat threw becomes the opponent's live window
      const shown = cfg.liveWidth === undefined ? throwOut : throwOut.slice(0, cfg.liveWidth);
      if (cfg.river === "live") live[o] = shown;
      else if (cfg.river === "history") live[o] = [...live[o], ...shown];
      if (cfg.river === "live") live[s] = []; // unclaimed live tiles die at the end of the turn
    }
    sizeLog.push([sizeOf(hands[0]), sizeOf(hands[1])]);
    if (r === 8) { const a = sizeOf(hands[0]), b = sizeOf(hands[1]); leaderAt8 = a > b ? 0 : b > a ? 1 : -1; }
    if (cfg.solo) { if (failed[0]) return { winner: 0, rounds: r - 1, leaderAt8, stats, sizeLog }; continue; }
    if (failed[0] || failed[1]) {
      const winner = cfg.coop ? -1 : failed[0] && failed[1] ? -1 : failed[0] ? 1 : 0;
      return { winner, rounds: r - 1, leaderAt8, stats, sizeLog };
    }
  }
  return { winner: -2, rounds: cfg.maxRounds, leaderAt8, stats, sizeLog };
}

// ---------- reporting ----------
export function run(cfg: Cfg, games: number, offset = 0) {
  const res = Array.from({ length: games }, (_, i) => playGame(cfg, i + offset));
  const n = res.length;
  const pct = (x: number) => (100 * x / n).toFixed(1) + "%";
  const agg = (f: (s: SeatStats) => number) => res.reduce((a, r) => a + f(r.stats[0]) + f(r.stats[1]), 0);
  const turns = agg((s) => s.turns);
  const lead = res.filter((r) => r.leaderAt8 >= 0 && r.rounds >= 8 && r.winner >= 0);
  const leadWins = lead.filter((r) => r.winner === r.leaderAt8).length;
  const rounds = res.map((r) => r.rounds).sort((a, b) => a - b);
  return {
    name: cfg.name, games: n,
    eastWin: pct(res.filter((r) => r.winner === 0).length), westWin: pct(res.filter((r) => r.winner === 1).length),
    draw: pct(res.filter((r) => r.winner === -1).length), capHit: pct(res.filter((r) => r.winner === -2).length),
    meanRounds: (rounds.reduce((a, b) => a + b, 0) / n).toFixed(1), medianRounds: rounds[Math.floor(n / 2)],
    bOwn: (agg((s) => s.ownOk) / turns).toFixed(3), bEff: (agg((s) => s.liveOk) / turns).toFixed(3),
    bEffAtCap: (agg((s) => s.atCapOk) / Math.max(1, agg((s) => s.atCap))).toFixed(3),
    rescuePerTurn: (100 * agg((s) => s.calls) / turns).toFixed(1) + "%",
    takesPerTurn: (agg((s) => s.takes) / turns).toFixed(2), fedPerTurn: (agg((s) => s.fed) / turns).toFixed(2),
    leaderAt8Wins: lead.length ? (100 * leadWins / lead.length).toFixed(1) + "% of " + lead.length : "n/a",
  };
}

export const BASE: Cfg = {
  name: "base", cap: 10, kind: 0.2, river: "live", call: "loan", lossCountsLive: false,
  lambda: [0, 0], skill: [0.95, 0.95], rewards: true, coop: false, maxRounds: 400,
};

export { COV, maskOf };

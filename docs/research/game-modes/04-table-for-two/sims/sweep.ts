// Full sweep. Instrument: table-sim.ts (real generateKindEquation / generateEquation /
// generateRewardTiles). The sim's own presence test and COV table are checked against the real canConstruct in calib.ts.
import { run, playGame, BASE, type Cfg } from "./table-sim.ts";
import { canConstruct } from "../../../../../src/game/selectors.ts";
import type { Digit, Tile } from "../../../../../src/game/types.ts";

const G = Number(process.env.GAMES ?? 10000);
const L2 = (a: number, b: number) => [a, b] as [number, number];
const row = (cfg: Cfg, n = G) => { const r = run(cfg, n); console.log([r.name, r.games, r.eastWin, r.westWin, r.draw, r.capHit, r.meanRounds, r.medianRounds, r.bOwn, r.bEff, r.bEffAtCap, r.rescuePerTurn, r.takesPerTurn, r.fedPerTurn, r.leaderAt8Wins].join(" | ")); return r; };

// Instrument checks
{
  const prods: number[] = []; for (let a = 1; a <= 9; a++) for (let b = a; b <= 9; b++) prods.push(a * b);
  let hits = 0, k = 0; const T = 20000;
  for (let t = 0; t < T; t++) { const hand: Tile[] = Array.from({ length: 10 }, () => ({ id: `h${k++}`, isNew: false, digit: Math.floor(Math.random() * 10) as Digit })); for (const p of prods) if (canConstruct(hand, p)) hits++; }
  const b = hits / (T * 45);
  console.log(`CALIB b(10) via real canConstruct = ${b.toFixed(3)} (repo 0.481); drift(b) = ${(b - (1 - b) * 1.71).toFixed(3)} (repo -0.41)`);
}
console.log("name | games | East | West | draw | cap-hit | mean rounds | median | b own | b eff | b eff at cap | rescue/turn | takes/turn | fed/turn | leader@8 wins");
console.log("--- solo calibration ---");
row({ ...BASE, name: "solo Endless, kind 0, skill .95", solo: true, kind: 0, river: "none" });
row({ ...BASE, name: "solo Endless, kind 0, skill 1", solo: true, kind: 0, river: "none", skill: L2(1, 1) });
row({ ...BASE, name: "solo Endless, kind .2, skill .95", solo: true, river: "none" });
console.log("--- controls ---");
for (const call of ["loan", "take", "feed"] as const) {
  let same = 0; const n = 3000;
  for (let g = 0; g < n; g++) { const a = playGame({ ...BASE, river: "none", call }, g), b = playGame({ ...BASE, call, liveWidth: 0 }, g); if (a.winner === b.winner && a.rounds === b.rounds && JSON.stringify(a.sizeLog) === JSON.stringify(b.sizeLog)) same++; }
  console.log(`CONTROL ${call}: width-0 river reproduces no-river game-for-game ${same}/${n}`);
}
row({ ...BASE, name: "NEG zero rewards (loan)", rewards: false });
row({ ...BASE, name: "OBS cap 20, start 20, skill 1, no river (soft cliff)", cap: 20, start: 20, skill: L2(1, 1), river: "none", maxRounds: 300 }, 500);
row({ ...BASE, name: "POS history river + free call (exploit)", river: "history", call: "free", maxRounds: 300 }, 1000);
console.log("--- baseline symmetry ---");
row({ ...BASE, name: "no river (two independent runs)", river: "none" }, 40000);
console.log("--- modes: both selfish | both defensive | E defends vs W selfish | E selfish vs W defends ---");
const modes: [string, Partial<Cfg>][] = [
  ["call (loan), live", { call: "loan" }],
  ["call (free), live", { call: "free" }],
  ["call (loan), history", { call: "loan", river: "history" }],
  ["take, live", { call: "take" }],
  ["take, history", { call: "take", river: "history" }],
  ["feed, live", { call: "feed" }],
];
for (const [name, m] of modes) {
  const ss = row({ ...BASE, ...m, name: `${name}, selfish` });
  row({ ...BASE, ...m, name: `${name}, both defend`, lambda: L2(1, 1) });
  const ed = row({ ...BASE, ...m, name: `${name}, E defends`, lambda: L2(1, 0) });
  const wd = row({ ...BASE, ...m, name: `${name}, W defends`, lambda: L2(0, 1) });
  const p = (x: string) => parseFloat(x);
  console.log(`  EDGE ${name}: defending seat gains ${((p(ed.eastWin) - p(ss.eastWin) + p(wd.westWin) - p(ss.westWin)) / 2).toFixed(1)} pts of win rate`);
}
console.log("--- skill gap: E .95 vs W .80 (and swapped) ---");
for (const [name, m] of [["no river", { river: "none" }], ["call (loan)", { call: "loan" }], ["take", { call: "take" }], ["feed", { call: "feed" }]] as [string, Partial<Cfg>][]) {
  const a = run({ ...BASE, ...m, name, skill: L2(0.95, 0.8) }, G), b = run({ ...BASE, ...m, name, skill: L2(0.8, 0.95) }, G);
  console.log(`  GAP ${name}: stronger seat wins ${((parseFloat(a.eastWin) + parseFloat(b.westWin)) / 2).toFixed(1)}%, weaker ${((parseFloat(a.westWin) + parseFloat(b.eastWin)) / 2).toFixed(1)}%`);
}
console.log("--- variants ---");
row({ ...BASE, name: "take, live, kind 0", call: "take", kind: 0 });
row({ ...BASE, name: "no river, kind 0", river: "none", kind: 0 });
row({ ...BASE, name: "call (loan), live tiles count for loss", lossCountsLive: true });
row({ ...BASE, name: "take, live tiles count for loss", call: "take", lossCountsLive: true });
console.log("--- co-op (team ends when either seat fails; gifting lambda -1) ---");
row({ ...BASE, name: "co-op, no river", river: "none", coop: true });
row({ ...BASE, name: "co-op, call (loan), gifting", coop: true, lambda: L2(-1, -1) });
row({ ...BASE, name: "co-op, take, gifting", coop: true, call: "take", lambda: L2(-1, -1) });
row({ ...BASE, name: "co-op, take, history, gifting", coop: true, call: "take", river: "history", lambda: L2(-1, -1), maxRounds: 300 }, 2000);

// Go/no-go: calibration, controls, rescue rate, defensive vs selfish.
import { run, playGame, BASE } from "./table-sim.ts";
import { canConstruct } from "../../../../../src/game/selectors.ts";
import type { Digit, Tile } from "../../../../../src/game/types.ts";

const G = Number(process.env.GAMES ?? 2000);

// 1. Instrument: Monte Carlo b(10) with the real canConstruct (repo figure 0.481)
const prods: number[] = []; for (let a = 1; a <= 9; a++) for (let b = a; b <= 9; b++) prods.push(a * b);
let hits = 0, k = 0; const T = 20000;
for (let t = 0; t < T; t++) { const hand: Tile[] = Array.from({ length: 10 }, () => ({ id: `h${k++}`, isNew: false, digit: Math.floor(Math.random() * 10) as Digit })); for (const p of prods) if (canConstruct(hand, p)) hits++; }
console.log("calib b(10) real canConstruct =", (hits / (T * 45)).toFixed(3), "(repo: 0.481); analytic drift at that b =", ((hits / (T * 45)) - (1 - hits / (T * 45)) * 1.71).toFixed(2), "(repo: -0.41)");

// 2. Calibration: solo Endless with this bot
for (const kind of [0, 0.2] as const) console.log("SOLO", JSON.stringify(run({ ...BASE, name: `solo kind ${kind}`, solo: true, kind, river: "none" }, G)));

// 3. Controls
const none = { ...BASE, name: "no river (two independent runs)", river: "none" as const };
const w0 = { ...BASE, name: "river, live width 0", liveWidth: 0 };
let same = 0; for (let g = 0; g < G; g++) { const a = playGame(none, g), b = playGame(w0, g); if (a.winner === b.winner && a.rounds === b.rounds && JSON.stringify(a.sizeLog) === JSON.stringify(b.sizeLog)) same++; }
console.log(`CONTROL width-0 river reproduces no-river baseline game-for-game: ${same}/${G}`);
console.log("CONTROL", JSON.stringify(run({ ...BASE, name: "zero rewards", rewards: false }, G)));
console.log("CONTROL", JSON.stringify(run({ ...BASE, name: "positive: cap 20, skill 1, no river", cap: 20, skill: [1, 1], river: "none", maxRounds: 400 }, 300)));

// 4. Go/no-go
for (const cfg of [none, { ...BASE, name: "river loan, both selfish" }, { ...BASE, name: "river loan, both defensive", lambda: [1, 1] as [number, number] }])
  console.log("GAME", JSON.stringify(run(cfg, G)));
for (const lam of [[1, 0], [0, 1], [2, 0], [0, 2]] as [number, number][])
  console.log("H2H", JSON.stringify(run({ ...BASE, name: `defence lambda E${lam[0]} vs W${lam[1]}`, lambda: lam }, G)));

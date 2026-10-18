// Searches fixed opening layouts (a constant, like Endless's one-of-each — not a seed).
// (a) one of each digit in the bottom two rows of a 5x3 well; (b) a full 5x3 well, any digits.
// Hill-climb with restarts on coverage (orthogonal, any order).
import { coverage, type Grid } from "./well-model.ts";

const W = 5;
const toGrid = (rows: number[]): Grid => {
  // rows: row-major from the bottom, length W*h
  const h = rows.length / W;
  return { W, H: 3, cols: Array.from({ length: W }, (_, c) => Array.from({ length: h }, (_, r) => rows[r * W + c]!)) };
};
const score = (rows: number[]) => coverage(toGrid(rows), "orth", "any");

function climb(start: number[], mutate: (x: number[]) => number[], iters: number): [number[], number] {
  let best = start, bestS = score(start);
  for (let i = 0; i < iters; i++) {
    const cand = mutate(best);
    const s = score(cand);
    if (s >= bestS) { best = cand; bestS = s; }
  }
  return [best, bestS];
}
const swap = (x: number[]) => { const y = x.slice(); const i = Math.floor(Math.random() * y.length), j = Math.floor(Math.random() * y.length); [y[i], y[j]] = [y[j]!, y[i]!]; return y; };
const repaint = (x: number[]) => (Math.random() < 0.5 ? swap(x) : (() => { const y = x.slice(); y[Math.floor(Math.random() * y.length)] = Math.floor(Math.random() * 10); return y; })());
const shuffle = (x: number[]) => { const y = x.slice(); for (let i = y.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [y[i], y[j]] = [y[j]!, y[i]!]; } return y; };

const show = (rows: number[]) => {
  const h = rows.length / W;
  const lines: string[] = [];
  for (let r = h - 1; r >= 0; r--) lines.push(rows.slice(r * W, r * W + W).join(" "));
  return lines.join(" / ") + " (top row first)";
};

let bestA: [number[], number] = [[], 0];
for (let k = 0; k < 300; k++) {
  const r = climb(shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), swap, 3000);
  if (r[1] > bestA[1]) bestA = r;
}
console.log(`(a) one-of-each, two rows: coverage ${(bestA[1] * 45).toFixed(0)}/45 = ${bestA[1].toFixed(3)} :: ${show(bestA[0])}`);
let bestB: [number[], number] = [[], 0];
for (let k = 0; k < 300; k++) {
  const r = climb(Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)), repaint, 6000);
  if (r[1] > bestB[1]) bestB = r;
}
console.log(`(b) full 15, free digits: coverage ${(bestB[1] * 45).toFixed(0)}/45 = ${bestB[1].toFixed(3)} :: ${show(bestB[0])}`);

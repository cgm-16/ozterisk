// Shared pieces for draft 05's sims: PRNG, the 45 facts, digit-count coverage,
// the deal generator, and the stats helpers.
import type { Equation, Tile } from "../../../../../src/game/types.ts";
import { canConstruct } from "../../../../../src/game/selectors.ts";

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Fact = { i: number; a: number; b: number; product: number; digits: number[] };
export const FACTS: Fact[] = [];
for (let a = 1; a <= 9; a++)
  for (let b = a; b <= 9; b++)
    FACTS.push({ i: FACTS.length, a, b, product: a * b, digits: String(a * b).split("").map(Number) });
export const factIndex = (left: number, right: number) =>
  FACTS.findIndex((f) => f.a === Math.min(left, right) && f.b === Math.max(left, right));

// Tables: all facts with operand k (a hook on the triangle). Boxes: 3x3 blocks of the 9x9 grid.
export const TABLES: number[][] = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) =>
  FACTS.filter((f) => f.a === k || f.b === k).map((f) => f.i),
);
const band = (x: number) => Math.floor((x - 1) / 3);
export const BOXES: number[][] = [];
for (let p = 0; p < 3; p++)
  for (let q = p; q < 3; q++) BOXES.push(FACTS.filter((f) => band(f.a) === p && band(f.b) === q).map((f) => f.i));

export function digitCounts(inventory: readonly Tile[]): { counts: number[]; wild: number } {
  const counts = Array(10).fill(0);
  let wild = 0;
  for (const t of inventory) {
    if ("digit" in t) counts[t.digit]++;
    else if (t.face === "wild") wild++;
    else throw new Error("digit-count coverage only handles digits and wildcards");
  }
  return { counts, wild };
}

export function buildable(f: Fact, counts: number[], wild: number): boolean {
  let missing = 0;
  for (const d of f.digits) if (counts[d] === 0) missing++;
  return missing <= wild;
}

export function coverage(pool: readonly number[], counts: number[], wild: number): number {
  let n = 0;
  for (const i of pool) if (buildable(FACTS[i], counts, wild)) n++;
  return n;
}

// Deal without replacement: each fact once per run. Kind gate first, like
// generateKindEquation, but over the undealt facts only.
export function dealEquation(
  random: () => number,
  inventory: readonly Tile[],
  undealt: readonly number[],
  kindRate: number,
): Equation {
  let pool = undealt;
  if (random() < kindRate) {
    const kind = undealt.filter((i) => canConstruct(inventory, FACTS[i].product));
    if (kind.length > 0) pool = kind;
  }
  const f = FACTS[pool[Math.floor(random() * pool.length)]];
  return random() < 0.5 ? { left: f.a, right: f.b, product: f.product } : { left: f.b, right: f.a, product: f.product };
}

// With replacement, any kind rate (the real generateKindEquation is fixed at 0.2).
export function drawEquation(random: () => number, inventory: readonly Tile[], kindRate: number): Equation {
  return dealEquation(random, inventory, FACTS.map((f) => f.i), kindRate);
}

export function summarize(xs: number[]): string {
  const s = [...xs].sort((p, q) => p - q);
  const q = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  const mean = s.reduce((t, x) => t + x, 0) / s.length;
  return `${mean.toFixed(1)} (p10 ${q(0.1)}, p50 ${q(0.5)}, p90 ${q(0.9)})`;
}
export const pct = (k: number, n: number) => `${((100 * k) / n).toFixed(1)}%`;
// 95% half-width for a proportion, in points.
export const ci = (k: number, n: number) => (196 * Math.sqrt((k / n) * (1 - k / n) / n)).toFixed(1);

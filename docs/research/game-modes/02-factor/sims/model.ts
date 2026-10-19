// Shared model for the Factor research sims. Hands are digit multisets
// (counts[0..9]); tile identity never matters to coverage.

export type Counts = number[]; // length 10

// The shipped 45-pair pool (product.md §1.2), a <= b.
export const PAIRS: ReadonlyArray<readonly [number, number]> = (() => {
  const out: Array<readonly [number, number]> = [];
  for (let a = 1; a <= 9; a++) for (let b = a; b <= 9; b++) out.push([a, b]);
  return out;
})();

// Every single-digit factor pair (a <= b) of each product reachable from the pool.
export const FACTORS: ReadonlyMap<number, ReadonlyArray<readonly [number, number]>> = (() => {
  const map = new Map<number, Array<readonly [number, number]>>();
  for (const [a, b] of PAIRS) {
    const list = map.get(a * b) ?? [];
    list.push([a, b]);
    map.set(a * b, list);
  }
  return map;
})();

export const DISTINCT_PRODUCTS: readonly number[] = [...FACTORS.keys()].sort((x, y) => x - y);

// Draw entries: the product shown per entry, sampled uniformly.
// "pair": the shipped draw, each of the 45 facts once (a product with two
// factor pairs appears twice). "product": each of the 36 distinct products once.
export type DrawKind = "pair" | "product";
export function drawEntries(kind: DrawKind): readonly number[] {
  return kind === "pair" ? PAIRS.map(([a, b]) => a * b) : DISTINCT_PRODUCTS;
}

// Factor rule: answerable when some factor pair is in hand (a square needs two copies).
export function factorOptions(c: Counts, product: number): Array<readonly [number, number]> {
  const out: Array<readonly [number, number]> = [];
  for (const [a, b] of FACTORS.get(product) ?? []) {
    if (a === b ? c[a]! >= 2 : c[a]! >= 1 && c[b]! >= 1) out.push([a, b]);
  }
  return out;
}

// Shipped (forward) rule: answerable when the product's digits are in hand.
export function productDigits(product: number): number[] {
  return String(product).split("").map(Number);
}
export function canSpell(c: Counts, product: number): boolean {
  const need = new Array(10).fill(0);
  for (const d of productDigits(product)) need[d]++;
  return need.every((n, d) => c[d]! >= n);
}

export function size(c: Counts): number {
  let s = 0;
  for (const n of c) s += n;
  return s;
}

// Seeded PRNG for reproducible research runs (never shipped; the seed ban is
// about the product, not this sim).
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Replica of generators.ts sampleBinIndex (not exported there).
export function bin(value: number, binCount: number): number {
  return Math.min(Math.floor(value * binCount + Number.EPSILON * binCount), binCount - 1);
}

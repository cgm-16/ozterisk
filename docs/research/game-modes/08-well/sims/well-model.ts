// Shared model for the Well (draft 08) sims. Pure functions; randomness is passed in.
// A grid is W columns of digit stacks, bottom -> top. Removing a tile from a
// column array IS gravity: everything above it shifts down one row.

export type Adjacency = "orth" | "king" | "all" | "none";
export type Order = "any" | "reading";

export interface Grid {
  W: number;
  H: number;
  cols: number[][]; // cols[c][r] = digit at column c, row r (r = 0 is the bottom)
}

// The 45 unordered pairs 1 <= a <= b <= 9, as the repo's EQUATION_PAIRS builds them.
export const PAIRS: ReadonlyArray<readonly [number, number]> = (() => {
  const out: Array<readonly [number, number]> = [];
  for (let a = 1; a <= 9; a++) for (let b = a; b <= 9; b++) out.push([a, b]);
  return out;
})();
export const PRODUCTS = PAIRS.map(([a, b]) => a * b);

export function cloneGrid(g: Grid): Grid {
  return { W: g.W, H: g.H, cols: g.cols.map((c) => c.slice()) };
}

export function tileCount(g: Grid): number {
  let n = 0;
  for (const c of g.cols) n += c.length;
  return n;
}

export interface Cell {
  c: number;
  r: number;
}

export function cells(g: Grid): Cell[] {
  const out: Cell[] = [];
  for (let c = 0; c < g.W; c++) for (let r = 0; r < g.cols[c]!.length; r++) out.push({ c, r });
  return out;
}

// Edges between occupied cells. For "reading", each edge is ordered first -> second
// (left -> right, or upper -> lower), so it can only spell tens=first, units=second.
export function edges(g: Grid, adj: Adjacency): Array<[Cell, Cell]> {
  const out: Array<[Cell, Cell]> = [];
  if (adj === "none") return out;
  const occupied = (c: number, r: number) => c >= 0 && c < g.W && r >= 0 && r < g.cols[c]!.length;
  if (adj === "all") {
    const cs = cells(g);
    for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) out.push([cs[i]!, cs[j]!]);
    return out;
  }
  for (let c = 0; c < g.W; c++) {
    for (let r = 0; r < g.cols[c]!.length; r++) {
      if (occupied(c + 1, r)) out.push([{ c, r }, { c: c + 1, r }]); // left -> right
      if (occupied(c, r + 1)) out.push([{ c, r: r + 1 }, { c, r }]); // upper -> lower
      if (adj === "king") {
        // Each diagonal counted once, from its left cell; reading order left -> right.
        if (occupied(c + 1, r + 1)) out.push([{ c, r }, { c: c + 1, r: r + 1 }]);
        if (occupied(c + 1, r - 1)) out.push([{ c, r }, { c: c + 1, r: r - 1 }]);
      }
    }
  }
  return out;
}

const digitAt = (g: Grid, x: Cell) => g.cols[x.c]![x.r]!;

// Which digits and which (tens, units) digit pairs the grid can spell.
export interface Spellable {
  digits: boolean[]; // [10]
  pair: boolean[]; // [100], index tens*10 + units
}

export function spellable(g: Grid, adj: Adjacency, order: Order): Spellable {
  const digits = new Array<boolean>(10).fill(false);
  const pair = new Array<boolean>(100).fill(false);
  for (const col of g.cols) for (const d of col) digits[d] = true;
  for (const [x, y] of edges(g, adj)) {
    const a = digitAt(g, x);
    const b = digitAt(g, y);
    pair[a * 10 + b] = true;
    if (order === "any" || adj === "all") pair[b * 10 + a] = true;
  }
  return { digits, pair };
}

export function canSpell(s: Spellable, product: number): boolean {
  if (product < 10) return s.digits[product]!;
  return s.pair[product]!; // every product here is two distinct digits
}

// Unbiased buildable rate b of one grid: share of the 45 pairs it can spell.
export function coverage(g: Grid, adj: Adjacency, order: Order): number {
  const s = spellable(g, adj, order);
  let hit = 0;
  for (const p of PRODUCTS) if (canSpell(s, p)) hit++;
  return hit / PRODUCTS.length;
}

// Level fill: n tiles into W columns, lowest stack first, leftmost on a tie —
// the shape the "lowest stack" reward rule converges to.
export function levelGrid(W: number, H: number, digits: number[]): Grid {
  const g: Grid = { W, H, cols: Array.from({ length: W }, () => []) };
  for (const d of digits) placeLowest(g, d);
  return g;
}

// Returns false when every column is full (the tile goes to the rail).
export function placeLowest(g: Grid, d: number): boolean {
  let best = -1;
  for (let c = 0; c < g.W; c++) {
    const h = g.cols[c]!.length;
    if (h >= g.H) continue;
    if (best === -1 || h < g.cols[best]!.length) best = c;
  }
  if (best === -1) return false;
  g.cols[best]!.push(d);
  return true;
}

export function placeRandomColumn(g: Grid, d: number, rand: () => number): boolean {
  const open: number[] = [];
  for (let c = 0; c < g.W; c++) if (g.cols[c]!.length < g.H) open.push(c);
  if (open.length === 0) return false;
  g.cols[open[Math.floor(rand() * open.length)]!]!.push(d);
  return true;
}

// Every legal selection for an answer of `len` slots: single cells, or touching
// pairs in both slot orders (tens first). Under "reading", only the edge's own order.
export function selections(g: Grid, len: 1 | 2, adj: Adjacency, order: Order): Cell[][] {
  if (len === 1) return cells(g).map((x) => [x]);
  const out: Cell[][] = [];
  for (const [x, y] of edges(g, adj)) {
    out.push([x, y]);
    if (order === "any" || adj === "all") out.push([y, x]);
  }
  return out;
}

export function selectionValue(g: Grid, sel: Cell[]): number {
  return Number(sel.map((x) => digitAt(g, x)).join(""));
}

// Removes the selected cells; the stacks above them fall.
export function removeCells(g: Grid, sel: Cell[]): Grid {
  const next = cloneGrid(g);
  // Remove higher rows first so lower indices stay valid within a column.
  const sorted = [...sel].sort((p, q) => (p.c - q.c) || (q.r - p.r));
  for (const x of sorted) next.cols[x.c]!.splice(x.r, 1);
  return next;
}

// True when some legal selection fills `len` slots — the Well's loss check,
// which looks at positions and counts, never at digit values.
export function canFill(g: Grid, len: 1 | 2, adj: Adjacency): boolean {
  if (len === 1) return tileCount(g) >= 1;
  return edges(g, adj).length > 0;
}

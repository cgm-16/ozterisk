// Count-based mirror of Dojo-E (echo rewards + 1 uniform extra) so capacity can vary;
// the real reducer's Endless capacity is fixed at 10. Calibrated against dojo-sim.ts
// (real reducer) at capacity 10. Bot = the same greedy coverage policy.
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(42);
const digitsOf = (p: number) => String(p).split("").map(Number);
const cover = (c: number[], pool: number[]) => pool.filter((p) => digitsOf(p).every((d) => c[d] > 0)).length;
let BLIND = false, PLAUSIBLE = false;
const KIND_EXTRA = false, PAY_ONE = false;
function leastValuable(c: number[], pool: number[]): number {
  if (BLIND) { let best = -1, bc = -1, br = 2; for (let d = 0; d < 10; d++) { if (!c[d]) continue; const r = rng(); if (c[d] > bc || (c[d] === bc && r < br)) { best = d; bc = c[d]; br = r; } } return best; }
  const base = cover(c, pool);
  let best = -1, bk: number[] = [];
  for (let d = 0; d < 10; d++) {
    if (!c[d]) continue;
    c[d]--; const loss = base - cover(c, pool); c[d]++;
    const k = [loss, -c[d], rng()];
    if (best < 0 || k[0] < bk[0] || (k[0] === bk[0] && (k[1] < bk[1] || (k[1] === bk[1] && k[2] < bk[2])))) { best = d; bk = k; }
  }
  return best;
}
function session(k: number, cap: number, acc: number, maxSubs: number, echo = true) {
  const pool = Array.from({ length: 9 }, (_, i) => k * (i + 1));
  const c = Array(10).fill(0);
  for (let i = 0; i < cap; i++) c[i % 10]++; // round-robin opening deal (factories.ts)
  let n = cap, subs = 0, forced = 0, know = 0, deck: number[] = [];
  while (subs < maxSubs) {
    if (!deck.length) { deck = [1, 2, 3, 4, 5, 6, 7, 8, 9]; for (let i = 8; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; } }
    const p = k * deck.pop()!;
    const ds = digitsOf(p);
    if (n < ds.length) return { subs, forced, know, complete: false }; // loss (product.md §1.8)
    const spellable = ds.every((d) => c[d] > 0);
    subs++;
    if (spellable && rng() < acc) { // correct: the spent digits come back, plus one uniform extra
      if (echo) {
        const need = KIND_EXTRA ? [...new Set(pool.flatMap(digitsOf))].filter((d) => c[d] === 0) : [];
        c[need.length ? need[Math.floor(rng() * need.length)] : Math.floor(rng() * 10)]++; n++;
      }
      else { for (const d of ds) c[d]--; for (let i = 0; i <= ds.length; i++) c[Math.floor(rng() * 10)]++; n++; } // shipped: N+1 uniform
      if (n > cap) { c[leastValuable(c, pool)]--; n--; } // overflow: discard one
    } else { // wrong answer: spend the least valuable tiles; if they would spell the answer, it is spelled reversed
      if (spellable) know++; else forced++;
      if (PAY_ONE) { c[leastValuable(c, pool)]--; n--; continue; }
      const m = p / k;
      const beliefs = PLAUSIBLE && spellable ? [k * (m - 1), k * (m + 1), (k - 1) * m, (k + 1) * m]
        .filter((q) => q > 0 && q !== p && String(q).length === ds.length && digitsOf(q).every((d) => c[d] > 0)) : [];
      if (beliefs.length) { const q = beliefs[Math.floor(rng() * beliefs.length)]; for (const d of digitsOf(q)) c[d]--; n -= ds.length; continue; }
      const spent: number[] = [];
      for (let i = 0; i < ds.length; i++) { const d = leastValuable(c, pool); c[d]--; spent.push(d); }
      if (ds.length === 1 && spent[0] === p) { // one slot holding the answer digit: swap for another digit if any
        const other = c.findIndex((x, d) => x > 0 && d !== p);
        if (other >= 0) { c[spent[0]]++; c[other]--; }
      }
      n -= ds.length;
    }
  }
  return { subs, forced, know, complete: true };
}
const RUNS = 2000;
console.log(`# Bite vs contamination (count mirror, ${RUNS} sessions of 27, seed 42; misses spell a plausible wrong product when the rack can). cell = complete% / forced share of submissions / forced share of misses / mean submissions`);
function line(label: string, cap: number, acc: number, echo: boolean) {
  const cells = [2, 3, 4, 5, 6, 7, 8, 9].map((k) => {
    let comp = 0, subs = 0, forced = 0, know = 0;
    for (let r = 0; r < RUNS; r++) { const x = session(k, cap, acc, 27, echo); comp += +x.complete; subs += x.subs; forced += x.forced; know += x.know; }
    return `${(100 * comp / RUNS).toFixed(0).padStart(3)}/${(100 * forced / subs).toFixed(1).padStart(4)}/${(100 * forced / Math.max(1, forced + know)).toFixed(0).padStart(2)}/${(subs / RUNS).toFixed(1)}`;
  });
  console.log(`${label.padEnd(30)} acc ${acc.toFixed(2)} | ` + cells.join(" | "));
}
PLAUSIBLE = true; BLIND = true;
line("shipped N+1, blind, cap 10", 10, 0.85, false);
line("echo only, blind, cap 15", 15, 0.85, true);

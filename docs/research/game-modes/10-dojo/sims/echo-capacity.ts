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
function leastValuable(c: number[], pool: number[]): number {
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
      if (echo) { c[Math.floor(rng() * 10)]++; n++; }
      else { for (const d of ds) c[d]--; for (let i = 0; i <= ds.length; i++) c[Math.floor(rng() * 10)]++; n++; } // shipped: N+1 uniform
      if (n > cap) { c[leastValuable(c, pool)]--; n--; } // overflow: discard one
    } else { // wrong answer: spend the least valuable tiles; if they would spell the answer, it is spelled reversed
      if (spellable) know++; else forced++;
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
const RUNS = 3000;
function sweep(label: string, cap: number, accs: number[], echo: boolean) {
  for (const acc of accs) {
    const cells = [2, 3, 4, 5, 6, 7, 8, 9].map((k) => {
      let comp = 0, subs = 0, forced = 0, know = 0;
      for (let r = 0; r < RUNS; r++) { const s = session(k, cap, acc, 27, echo); comp += +s.complete; subs += s.subs; forced += s.forced; know += s.know; }
      return `${(100 * comp / RUNS).toFixed(0).padStart(3)}/${(100 * forced / subs).toFixed(0).padStart(2)}/${(100 * forced / Math.max(1, forced + know)).toFixed(0).padStart(3)}/${(subs / RUNS).toFixed(1).padStart(4)}`;
    });
    console.log(`${label} cap ${cap} acc ${acc.toFixed(2)} | ` + cells.join(" | "));
  }
}
console.log(`# cell = complete% / forced share of submissions / forced share of misses / mean submissions reached (${RUNS} sessions of 27, seed 42)`);
sweep("U (mirror calibration vs real reducer)", 10, [1.0], false);
sweep("U (bigger rack, no echo)", 15, [1.0, 0.85], false);
sweep("E", 15, [1.0, 0.85, 0.7, 0.55], true);
for (const cap of [10, 15]) console.log(`# uncapped 7단 E cap ${cap}: mean submissions reached at acc .85/.70/.55 = ` + [0.85, 0.7, 0.55].map((a) => { let s = 0; for (let r = 0; r < 1000; r++) s += session(7, cap, a, 300).subs; return (s / 1000).toFixed(1); }).join(" / "));
let c0 = 0; for (let r = 0; r < 500; r++) c0 += +session(7, 15, 0, 27).complete;
console.log(`# control: acc 0, cap 15, 7단 -> ${c0}/500 complete (must be 0)`);

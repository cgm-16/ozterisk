// Twist catalogue + per-twist measurement on the plateau base (20/15/10/7, 4x8).
import { ALL, prod, type Config, type Pair, type Wind } from "./fw-lib.ts";
import { R, summarize } from "./report.ts";

const ramp = (total: number) => (n: number) => 0.05 + 0.15 * Math.min(1, n / (total - 1));
export const plain = (): Wind[] => Array.from({ length: 4 }, (_, i) => ({ name: "ESWN"[i], pool: ALL }));
export const CAPS = (process.env.CAPS ?? "20,15,10,7").split(",").map(Number);
export const base = (winds: Wind[], bot: "naive" | "aware" = "naive"): Config => ({
  start: 20, totalSubs: 32, subsPerWind: 8, capacityAt: (n) => CAPS[Math.min(3, Math.floor(n / 8))],
  faceAt: ramp(32), winds, skill: 0.95, bot,
});
const odd = (x: number) => x % 2 === 1;
export const TWISTS: Record<string, Omit<Wind, "name">> = {
  "Small tables (1-6)": { pool: ALL.filter(([, b]) => b <= 6) },
  "Large tables (4-9)": { pool: ALL.filter(([a]) => a >= 4) },
  "Odd tables": { pool: ALL.filter(([a, b]) => odd(a) && odd(b)) },
  "Even tables": { pool: ALL.filter(([a, b]) => !(odd(a) && odd(b))) },
  "Long answers (2-digit)": { pool: ALL.filter((p) => prod(p) >= 10) },
  "Odd rain (odd rewards)": { pool: ALL, supply: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1] },
  "Face wind (x3 faces)": { pool: ALL, faceMul: 3 },
  "Plain wind (no faces)": { pool: ALL, faceMul: 0 },
  "Wide table (+2)": { pool: ALL, capDelta: 2 },
  "Narrow table (-2)": { pool: ALL, capDelta: -2 },
};
// Digit demand: share of the pool's pairs whose product holds each digit (normalised).
export function demand(pool: readonly Pair[]) {
  const q = new Array(10).fill(0);
  for (const p of pool) for (const ch of String(prod(p))) q[Number(ch)] += 1;
  const tot = q.reduce((s, x) => s + x, 0); return q.map((x) => x / tot);
}
const qAll = demand(ALL);
export const tv = (pool: readonly Pair[]) => 0.5 * demand(pool).reduce((s, x, d) => s + Math.abs(x - qAll[d]), 0);
export const missCost = (pool: readonly Pair[]) => pool.reduce((s, p) => s + (prod(p) >= 10 ? 2 : 1), 0) / pool.length;

if (process.argv[1]?.endsWith("twists.ts") || process.env.TWISTS_MAIN) {
  const b0 = summarize(base(plain()));
  console.log(`twists: ${R} runs per cell, plateau base 20/15/10/7 x8, naive bot, skill 0.95; base win ${b0.win.toFixed(1)}%, b' E/S/W/N ${b0.b.map((x) => x.toFixed(2)).join("/")}`);
  console.log(`full pool: miss cost ${missCost(ALL).toFixed(2)}, cliff ${(missCost(ALL) / (1 + missCost(ALL))).toFixed(3)}`);
  console.log("twist | pool | miss cost | cliff | demand TV | dead digits || in E: dWin, b' | in S | in W | in N");
  for (const [name, t] of Object.entries(TWISTS)) {
    const c = missCost(t.pool), dead = demand(t.pool).map((x, d) => (x === 0 ? d : -1)).filter((d) => d >= 0);
    const cells: string[] = [];
    for (let w = 0; w < 4; w++) {
      const winds = plain(); winds[w] = { name: "ESWN"[w], ...t };
      const s = summarize(base(winds));
      cells.push(`${(s.win - b0.win >= 0 ? "+" : "") + (s.win - b0.win).toFixed(1)}, ${s.b[w].toFixed(2)}`);
    }
    console.log(`${name.padEnd(24)} | ${String(t.pool.length).padStart(2)} | ${c.toFixed(2)} | ${(c / (1 + c)).toFixed(3)} | ${tv(t.pool).toFixed(2)} | [${dead.join(",")}] || ${cells.join(" | ")}`);
  }
}

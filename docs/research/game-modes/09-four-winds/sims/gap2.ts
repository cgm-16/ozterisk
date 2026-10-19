// Single-table twists ("every equation has a factor k"): demand shift, laterality, foresight gap.
import { ALL, type Wind } from "./fw-lib.ts";
import { base, plain, demand, missCost, tv } from "./twists.ts";
import { R, summarize } from "./report.ts";
const b0 = summarize(base(plain()));
console.log(`single-table twists: ${R} runs per cell, caps ${process.env.CAPS ?? "20,15,10,7"}, no boons, skill 0.95; base win ${b0.win.toFixed(1)}%`);
const T: Record<string, Omit<Wind, "name">> = {};
for (const k of [2, 4, 5, 9]) T[`Table of ${k}`] = { pool: ALL.filter(([a, b]) => a === k || b === k) };
T["Tables of 2 and 5"] = { pool: ALL.filter(([a, b]) => [a, b].some((x) => x === 2 || x === 5)) };
for (const [name, t] of Object.entries(T)) {
  const q = demand(t.pool), dead = q.map((x, d) => (x === 0 ? d : -1)).filter((d) => d >= 0);
  const hot = q.map((x, d) => [x, d]).sort((a, b) => b[0] - a[0]).slice(0, 2).map(([, d]) => d);
  const cells: string[] = [];
  for (const w of [1, 2, 3]) {
    const winds = plain(); winds[w] = { name: "ESWN"[w], ...t };
    const nv = summarize(base(winds, "naive")), aw = summarize(base(winds, "aware"));
    cells.push(`${"ESWN"[w]}: dWin ${(nv.win - b0.win >= 0 ? "+" : "") + (nv.win - b0.win).toFixed(1)}, gap ${(aw.win - nv.win >= 0 ? "+" : "") + (aw.win - nv.win).toFixed(1)}, b' ${nv.b[w].toFixed(2)}/${aw.b[w].toFixed(2)}`);
  }
  const c = missCost(t.pool);
  console.log(`${name.padEnd(18)} pairs ${t.pool.length} cliff ${(c / (1 + c)).toFixed(3)} TV ${tv(t.pool).toFixed(2)} dead [${dead}] hot [${hot}] | ${cells.join(" | ")}`);
}

// Four Winds candidate content: two-sided twists (equation pool x face rate, never
// capacity) and run-long boons, measured on the plateau base 20/15/10/7 x8.
import { ALL, mulberry32, prod, type Boon, type Config, type FaceSet, type Wind } from "./fw-lib.ts";
import { R, line, summarize } from "./report.ts";
import { base, demand, missCost, plain, tv } from "./twists.ts";

const odd = (x: number) => x % 2 === 1;
export const TW: Record<string, Omit<Wind, "name">> = {
  "Odd tables": { pool: ALL.filter(([a, b]) => odd(a) && odd(b)) },
  "Even tables, faces x1.5": { pool: ALL.filter(([a, b]) => !(odd(a) && odd(b))), faceMul: 1.5 },
  "Small tables, no faces": { pool: ALL.filter(([, b]) => b <= 6), faceMul: 0 },
  "Large tables, faces x2.5": { pool: ALL.filter(([a]) => a >= 4), faceMul: 2.5 },
  "Odd rain, faces x2": { pool: ALL, supply: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1], faceMul: 2 },
  "Tables of 2 and 5": { pool: ALL.filter(([a, b]) => [a, b].some((x) => x === 2 || x === 5)) },
};
const W: FaceSet = { face: "wild" };
export const BOONS: Boon[] = [
  { id: "One more socket", cap: 1 },
  { id: "Wildcard now", grant: [W] },
  { id: "Face favour +5pts", faceAdd: 0.05 },
  { id: "Two faces now", grant: [{ face: "odd" }, { face: "even" }] },
  { id: "Wide table: +2, no faces", cap: 2, noFaces: true },
  { id: "Calm: next wind plain", calm: true },
];
// Position-aware picker, from the boons table (boon before pack): landing 1 and 3 by
// measured value; landing 2 by the mean of the two.
export const PREF: string[][] = [
  ["One more socket", "Wide table: +2, no faces", "Face favour +5pts", "Two faces now", "Wildcard now", "Calm: next wind plain"],
  ["One more socket", "Wide table: +2, no faces", "Two faces now", "Wildcard now", "Face favour +5pts", "Calm: next wind plain"],
  ["Two faces now", "Wide table: +2, no faces", "Wildcard now", "One more socket", "Face favour +5pts", "Calm: next wind plain"],
];
const what = process.env.WHAT ?? "twists";
const b0 = summarize(base(plain()));
if (what === "twists") {
  console.log(`two-sided twists: ${R} runs per cell, plateau ${process.env.CAPS ?? "20,15,10,7"} x8, naive bot, skill 0.95; base win ${b0.win.toFixed(1)}%`);
  for (const [name, t] of Object.entries(TW)) {
    const dead = demand(t.pool).map((x, d) => (x === 0 ? d : -1)).filter((d) => d >= 0);
    const cells: string[] = [];
    for (let w = 0; w < 4; w++) {
      const winds = plain(); winds[w] = { name: "ESWN"[w], ...t };
      const s = summarize(base(winds));
      cells.push(`${(s.win - b0.win >= 0 ? "+" : "") + (s.win - b0.win).toFixed(1)} (b' ${s.b[w].toFixed(2)})`);
    }
    const c = missCost(t.pool);
    console.log(`${name.padEnd(26)} pairs ${String(t.pool.length).padStart(2)} cost ${c.toFixed(2)} cliff ${(c / (1 + c)).toFixed(3)} TV ${tv(t.pool).toFixed(2)} dead [${dead}] | E ${cells[0]} | S ${cells[1]} | W ${cells[2]} | N ${cells[3]}`);
  }
}
if (what === "boons") {
  console.log(`boons: ${R} runs per cell, plateau ${process.env.CAPS ?? "20,15,10,7"} x8, no twists, naive bot, skill 0.95; base win ${b0.win.toFixed(1)}%`);
  for (const b of BOONS) {
    const at1 = summarize({ ...base(plain()), boons: [b, null, null] });
    const at3 = summarize({ ...base(plain()), boons: [null, null, b] });
    console.log(`${b.id.padEnd(26)} taken E->S: ${(at1.win - b0.win >= 0 ? "+" : "") + (at1.win - b0.win).toFixed(1)} | taken W->N: ${(at3.win - b0.win >= 0 ? "+" : "") + (at3.win - b0.win).toFixed(1)}`);
  }
  for (const [nm, stack] of [["stack: socket, favour, two faces", [BOONS[0], BOONS[2], BOONS[3]]], ["stack: socket, two faces, wildcard", [BOONS[0], BOONS[3], BOONS[1]]], ["stack (dupes, not allowed): 3x socket", [BOONS[0], BOONS[0], BOONS[0]]]] as const) {
    console.log(line(nm, summarize({ ...base(plain()), boons: stack as Boon[] })));
  }
  console.log(line("no boons", b0));
}

// Does a readable North help? North's twist fixed; E/S/W random from the rest; position-aware picks.
import { ALL, mulberry32, runOnce, type Boon, type Wind } from "./fw-lib.ts";
import { base } from "./twists.ts";
import { BOONS, PREF, TW } from "./mode.ts";
import { R } from "./report.ts";
function shuffle<T>(xs: T[], r: () => number) { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const NORTH: Record<string, Omit<Wind, "name">> = {
  "Odd tables": TW["Odd tables"],
  "Table of 5, faces x3": { pool: ALL.filter(([a, b]) => a === 5 || b === 5), faceMul: 3 },
  "Plain (no twist)": { pool: ALL },
};
console.log(`readable North: ${R} runs per row, caps ${process.env.CAPS}, E/S/W random from the other twists, pickers none/random/pref`);
for (const [nn, nt] of Object.entries(NORTH)) for (const picker of ["none", "random", "pref"] as const) {
  const out: string[] = []; const nb = [0, 0, 0, 0];
  for (const bot of ["naive", "aware"] as const) {
    let win = 0;
    for (let i = 0; i < R; i++) {
      const r = mulberry32((1000 + i) ^ 0x9e3779b9);
      const rest = shuffle(Object.keys(TW).filter((k) => k !== nn), r).slice(0, 3);
      const taken: Boon[] = [];
      for (let l = 0; l < 3; l++) { const left = shuffle(BOONS.filter((b) => !taken.includes(b)), r).slice(0, 3); taken.push(picker === "random" ? left[Math.floor(r() * 3)] : PREF[l].map((id) => left.find((b) => b.id === id)).find(Boolean)!); }
      const winds = [...rest.map((k, w) => ({ name: "ESW"[w], ...TW[k] })), { name: "N", ...nt }];
      const st = runOnce({ ...base(winds, bot), boons: picker === "none" ? [null, null, null] : taken }, mulberry32(1000 + i));
      if (st.win) win++;
      if (bot === "naive") { nb[0] += st.buildable[3]; nb[1] += st.draws[3]; nb[2] += st.fullAtDraw[3]; if (!st.win && st.endWind === 2) nb[3]++; }
    }
    out.push(`${bot} ${(100 * win / R).toFixed(1)}%`);
  }
  console.log(`North = ${nn.padEnd(22)} picks ${picker.padEnd(6)} ${out.join(" | ")} | naive: North b' ${(nb[0] / nb[1]).toFixed(2)}, at-cap ${(nb[2] / nb[1]).toFixed(2)}, lost in W ${(100 * nb[3] / R).toFixed(1)}%`);
}

// Foresight gap per twist (aware - naive), the twist placed in West or in North, no boons.
import { base, plain } from "./twists.ts";
import { TW } from "./mode.ts";
import { R, summarize } from "./report.ts";
console.log(`foresight gap per twist: ${R} runs per cell, caps ${process.env.CAPS ?? "20,15,10,7"}, no boons; aware - naive win pts (naive win)`);
for (const [name, t] of Object.entries(TW)) {
  const cells: string[] = [];
  for (const w of [2, 3]) {
    const winds = plain(); winds[w] = { name: "ESWN"[w], ...t };
    const nv = summarize(base(winds, "naive")), aw = summarize(base(winds, "aware"));
    // the twist one wind ahead: also measure it placed in the next wind with the aware bot reading it from the previous wind
    cells.push(`${"ESWN"[w]}: ${(aw.win - nv.win >= 0 ? "+" : "") + (aw.win - nv.win).toFixed(1)} (${nv.win.toFixed(1)})`);
  }
  console.log(`${name.padEnd(26)} ${cells.join(" | ")}`);
}

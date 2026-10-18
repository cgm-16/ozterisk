// The whole mode: a course of 4 distinct twists from TW, 3 landings each offering 3
// distinct boons not yet taken. Pairs runs by seed: the course and the offers come
// from a separate stream, so both bots and both pickers face the same table.
import { mulberry32, runOnce, type Boon, type Config } from "./fw-lib.ts";
import { R, line, summarize } from "./report.ts";
import { base, plain } from "./twists.ts";
import { BOONS, PREF, TW } from "./mode.ts";

const names = Object.keys(TW);
function shuffle<T>(xs: T[], r: () => number): T[] { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function table(seed: number, picker: "pref" | "random" | "none") {
  const r = mulberry32(seed ^ 0x9e3779b9);
  const shuffled = shuffle(names, r).slice(0, 4);
  const taken: Boon[] = [];
  for (let l = 0; l < 3; l++) {
    const left = shuffle(BOONS.filter((b) => !taken.includes(b)), r).slice(0, 3);
    const pick = picker === "random" ? left[Math.floor(r() * 3)] : PREF[l].map((id) => left.find((b) => b.id === id)).find(Boolean)!;
    taken.push(pick);
  }
  return { course: shuffled, boons: picker === "none" ? [null, null, null] : taken };
}
function mode(seed: number, bot: "naive" | "aware", picker: "pref" | "random" | "none"): Config {
  const t = table(seed, picker);
  return { ...base(t.course.map((n, i) => ({ name: "ESWN"[i], ...TW[n] })), bot), boons: t.boons };
}
// summarize() takes one Config; runs differ by course, so aggregate here.
function agg(bot: "naive" | "aware", picker: "pref" | "random" | "none") {
  let win = 0; const lost = [0, 0, 0, 0], bld = [0, 0, 0, 0], dr = [0, 0, 0, 0], full = [0, 0, 0, 0];
  for (let i = 0; i < R; i++) {
    const s = runOnce(mode(1000 + i, bot, picker), mulberry32(1000 + i));
    if (s.win) win++; else lost[s.endWind]++;
    for (let w = 0; w < 4; w++) { bld[w] += s.buildable[w]; dr[w] += s.draws[w]; full[w] += s.fullAtDraw[w]; }
  }
  const p = (x: number) => ((100 * x) / R).toFixed(1);
  return `bot ${bot.padEnd(5)} picker ${picker.padEnd(6)} win ${p(win)}% | lost E/S/W/N ${lost.map(p).join("/")} | b' ${bld.map((x, w) => (x / dr[w]).toFixed(2)).join("/")} | at-cap ${full.map((x, w) => (x / dr[w]).toFixed(2)).join("/")}`;
}
console.log(`full mode: ${R} runs per row, plateau ${process.env.CAPS ?? "20,15,10,7"} x8, random course of 4 of ${names.length} twists, skill 0.95, same seeds per row`);
for (const picker of ["none", "random", "pref"] as const) for (const bot of ["naive", "aware"] as const) console.log(agg(bot, picker));
const s = summarize(base(plain()));
console.log(`turnover (this plateau, no twists): share of a wind's opening tiles still held after k submissions, k=1..8: ${s.surv.map((x) => x.toFixed(2)).join(" ")}`);

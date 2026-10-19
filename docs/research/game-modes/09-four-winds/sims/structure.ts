// Base regime: three schedules, no twists, no boons, naive bot, skill 0.95.
import { ALL, getClassicFaceRate, type Config, type Wind } from "./fw-lib.ts";
import { R, line, summarize } from "./report.ts";

const plain = (k: number): Wind[] => Array.from({ length: k }, (_, i) => ({ name: "ESWN"[i], pool: ALL }));
const ramp = (total: number) => (n: number) => 0.05 + 0.15 * Math.min(1, n / (total - 1));
const base = { skill: 0.95, bot: "naive" as const };
const plateau = (caps: number[]): Config => ({ ...base, start: caps[0], totalSubs: 32, subsPerWind: 8, capacityAt: (n) => caps[Math.min(3, Math.floor(n / 8))], faceAt: ramp(32), winds: plain(4) });
const schedules: Array<[string, Config]> = [
  ["Classic (control, 2x15)", { ...base, start: 20, totalSubs: 30, subsPerWind: 15, capacityAt: (n) => Math.max(5, 20 - Math.floor(n / 2)), faceAt: getClassicFaceRate, winds: plain(2) }],
  ["Seals x4: 21->5, 4x8", { ...base, start: 21, totalSubs: 32, subsPerWind: 8, capacityAt: (n) => Math.max(5, 21 - Math.floor(n / 2)), faceAt: ramp(32), winds: plain(4) }],
  ["Flat 10, faces, 4x8", { ...base, start: 10, totalSubs: 32, subsPerWind: 8, capacityAt: () => 10, faceAt: ramp(32), winds: plain(4) }],
  ["Flat 10, no faces, 4x8", { ...base, start: 10, totalSubs: 32, subsPerWind: 8, capacityAt: () => 10, faceAt: () => 0, winds: plain(4) }],
  ["Flat 10, no faces, 4x6", { ...base, start: 10, totalSubs: 24, subsPerWind: 6, capacityAt: () => 10, faceAt: () => 0, winds: plain(4) }],
  ["Plateaus 20/15/10/5", plateau([20, 15, 10, 5])],
  ["Plateaus 20/15/10/7", plateau([20, 15, 10, 7])],
  ["Plateaus 18/14/10/6", plateau([18, 14, 10, 6])],
];
console.log(`structure: ${R} runs per schedule, seeds 1000.., naive coverage bot, skill 0.95, kind 0.2, face ramp 5->20% over the run`);
for (const [name, cfg] of schedules) console.log(line(name, summarize(cfg)));

// How the M8 band (clair par >= 7, myopic < par, onlyMoves >= 2) looks in window terms, seed-1 plants.
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mulberry32, plantTable, solvePuzzle, playMyopic } from "./lib.ts";
const recs = JSON.parse(readFileSync(join(tmpdir(), "puzzle-window-records-seed1.json"), "utf8"));
const random = mulberry32(1);
const m8 = Array.from({ length: 2000 }, () => plantTable(random)).map((d) => {
  const { par, onlyMoves } = solvePuzzle(d);
  return par >= 7 && onlyMoves >= 2 && playMyopic(d) < par;
});
for (const k of [3, 4]) {
  const r = recs[k].filter((_: unknown, i: number) => m8[i]);
  const dist = Array.from({ length: 9 }, (_, s) => r.filter((x: { window: number }) => x.window === s).length);
  const pass = (p: number) => r.filter((x: { window: number; myopic: number; only: number }) => x.window >= p && x.myopic < x.window && x.only >= 2).length;
  console.log(`k=${k}: M8 band ${r.length}/2000; window par 0..8 among them: ${dist.join(" ")}; Hard ${r.filter((x: { hard: boolean }) => x.hard).length}; pass (6,2) ${pass(6)}, pass (7,2) ${pass(7)}`);
}

// Step 1: k sweep on unfiltered plants. SEED env (default 1), 2,000 plants from one mulberry32 stream.
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { analyze, mulberry32, plantTable, type Record } from "./lib.ts";

const SEED = Number(process.env.SEED ?? 1), N = 2000, KS = [1, 2, 3, 4, 5, 8];
const random = mulberry32(SEED);
const deals = Array.from({ length: N }, () => plantTable(random));
const out: { [k: number]: Record[] } = {};
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
console.log(`seed ${SEED}, ${N} plants`);
console.log("k | myopic | window | clair | captured | Hard% | early% | win<clair | window par 0..8");
for (const k of KS) {
  const recs = deals.map((d) => analyze(d, k));
  out[k] = recs;
  if (recs.some((x) => x.window > x.clair)) throw new Error(`window > clair at k=${k}`);
  if (k === 8 && recs.some((x) => x.window !== x.clair)) throw new Error("k=8 window != clair");
  const my = mean(recs.map((x) => x.myopic)), w = mean(recs.map((x) => x.window)), c = mean(recs.map((x) => x.clair));
  const dist = Array.from({ length: 9 }, (_, s) => recs.filter((x) => x.window === s).length);
  console.log(`${k} | ${my.toFixed(3)} | ${w.toFixed(3)} | ${c.toFixed(3)} | ${((w - my) / (c - my)).toFixed(3)} | ${(100 * mean(recs.map((x) => +x.hard))).toFixed(1)} | ${(100 * mean(recs.map((x) => +x.early))).toFixed(1)} | ${recs.filter((x) => x.window < x.clair).length} | ${dist.join(" ")}`);
}
writeFileSync(join(tmpdir(), `puzzle-window-records-seed${SEED}.json`), JSON.stringify(out));

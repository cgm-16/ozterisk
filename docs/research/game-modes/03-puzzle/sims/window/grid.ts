// Step 2: floor grid over the records sweep.ts saves in the OS temp folder. SEED env (default 1), KS env (default "3,4").
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Record } from "./lib.ts";

const SEED = Number(process.env.SEED ?? 1), KS = (process.env.KS ?? "3,4").split(",").map(Number);
const all: { [k: number]: Record[] } = JSON.parse(readFileSync(join(tmpdir(), `puzzle-window-records-seed${SEED}.json`), "utf8"));
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
for (const k of KS) {
  const recs = all[k];
  console.log(`\nseed ${SEED}, k=${k}, ${recs.length} plants. Cell: accept% | Hard% of accepted | mean window | mean clair | 1/p | capped E | P(cap hit)`);
  console.log(`window>=  only>=0 / 1 / 2 / 3 / 4 as accept%/Hard%`);
  for (let minPar = 4; minPar <= 8; minPar++) {
    const cells: string[] = [];
    for (let minOnly = 0; minOnly <= 4; minOnly++) {
      const acc = recs.filter((x) => x.window >= minPar && x.myopic < x.window && x.only >= minOnly);
      const p = acc.length / recs.length;
      const hard = mean(acc.map((x) => +x.hard));
      cells.push(`${(100 * p).toFixed(1)}/${(100 * hard).toFixed(1)}`);
      console.error(`k=${k} par>=${minPar} only>=${minOnly}: accept ${acc.length} (${(100 * p).toFixed(2)}%) | Hard ${acc.filter((x) => x.hard).length} (${(100 * hard).toFixed(2)}%) | window ${mean(acc.map((x) => x.window)).toFixed(2)} | clair ${mean(acc.map((x) => x.clair)).toFixed(2)} | 1/p ${(1 / p).toFixed(1)} | capped ${((1 - (1 - p) ** 200) / p).toFixed(1)} | P(cap) ${((1 - p) ** 200).toExponential(1)}`);
    }
    console.log(`${minPar}  ${cells.join("  ")}`);
  }
}

// Step 3: time dealWindow (plant + three-rule filter, <= 200 attempts). Env K, MINPAR, MINONLY.
import { dealWindow, mulberry32 } from "./lib.ts";
const K = Number(process.env.K), MINPAR = Number(process.env.MINPAR), MINONLY = Number(process.env.MINONLY);
const random = mulberry32(3);
for (let i = 0; i < 50; i++) dealWindow(random, K, MINPAR, MINONLY); // untimed warm-up
const ms: number[] = [], attempts: number[] = [];
let capped = 0;
for (let i = 0; i < 300; i++) {
  const t0 = performance.now();
  const d = dealWindow(random, K, MINPAR, MINONLY);
  ms.push(performance.now() - t0);
  attempts.push(d.attempt);
  if (!d.ok) capped++;
}
ms.sort((a, b) => a - b);
const q = (p: number) => ms[Math.min(ms.length - 1, Math.floor(p * ms.length))];
console.log(`k=${K} floors window>=${MINPAR} only>=${MINONLY}, mulberry32(3), 50 warm-up + 300 timed: median ${q(0.5).toFixed(2)} ms, p95 ${q(0.95).toFixed(2)} ms, max ${ms[ms.length - 1].toFixed(2)} ms; mean attempts ${(attempts.reduce((a, b) => a + b, 0) / 300).toFixed(1)}, max attempts ${Math.max(...attempts)}, cap hits ${capped}`);

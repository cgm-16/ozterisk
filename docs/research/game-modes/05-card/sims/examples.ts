import { runEngine } from "./engine.ts";
import { FACTS, TABLES } from "./common.ts";
for (const seed of [100025, 100001]) {
  const r = runEngine({ deal: "deck", kindRate: 0.2, policy: "aware", skill: 0.95, capacity: () => 15, horizon: 45 }, seed);
  console.log(`seed ${seed}: longest streak ${r.longestStreak}, stamps ${r.distinct}, submitted ${r.submitted}, win ${r.win}, tables ${TABLES.map((t, k) => (t.every((i) => r.card[i] === "stamp") ? k + 1 : 0)).filter(Boolean)}`);
  for (let b = 1; b <= 9; b++) console.log("  " + FACTS.filter((f) => f.b === b).map((f) => ({ stamp: "■", burn: "□", none: "·" })[r.card[f.i]]).join(""));
  console.log("  JSON", JSON.stringify(Array.from({ length: 9 }, (_, k) => FACTS.filter((f) => f.b === k + 1).map((f) => r.card[f.i][0]).join(""))));
}

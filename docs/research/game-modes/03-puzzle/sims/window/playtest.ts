// Step 4: the three playtest tables at k = 3 and 4.
// Describes 3ccd37b. M10 removes playtestTables.ts and M8's band dials, so after its build re-run from `git archive 3ccd37b`.
import { analyze } from "./lib.ts";
import { PLAYTEST_TABLES } from "../../../../../../src/game/playtestTables.ts";
for (const k of [3, 4]) PLAYTEST_TABLES.forEach((t, i) => {
  const x = analyze(t, k);
  console.log(`k=${k} table ${i + 1} (hand ${t.hand.join("")}): window ${x.window}, clair ${x.clair}, myopic ${x.myopic}, window only-moves ${x.only}, submissions ${x.submissions}, Hard ${x.hard ? "yes" : "no"}`);
});

// Counts reachable states where the skip rule would fire (k < K, 0 < size < len), per playtest table.
// Describes 3ccd37b. M10 removes playtestTables.ts and M8's band dials, so after its build re-run from `git archive 3ccd37b`.
import { makeSolver, type Table } from "./solver.ts";
import { PLAYTEST_TABLES } from "../../../../../src/game/playtestTables.ts";
for (const p of PLAYTEST_TABLES) {
  const t: Table = { model: "P", cap: 5, hand: [...p.hand], eqs: p.rows.map((r) => [r.equation.left, r.equation.right]), bounty: p.rows.map((r) => [...r.pay]) };
  const s = makeSolver(t), seen = new Set<string>(), skip: string[] = [], empty: number[] = [];
  const walk = (k: number, hand: number[], size: number) => {
    const id = `${k}|${hand.join()}`;
    if (seen.has(id)) return;
    seen.add(id);
    if (k < s.K && size > 0 && size < s.info[k]!.len) skip.push(`row ${k + 1} size ${size}`);
    if (k < s.K && size === 0) empty.push(k + 1);
    for (const o of s.options(k, hand, size, 0)) walk(o.k, o.hand, o.size);
  };
  walk(0, s.root.hand, s.root.size);
  console.log(`hand ${p.hand.join("")}: ${seen.size} states; skip-rule states ${skip.length} [${[...new Set(skip)].join("; ")}]; empty-hand states at rows ${[...new Set(empty)].join(",")}`);
}

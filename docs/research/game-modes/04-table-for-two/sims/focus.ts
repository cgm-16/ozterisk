import { run, BASE, BY_N, THROWS, type Cfg } from "./table-sim.ts";
const G = 10000;
const reset = () => { BY_N.turns.fill(0); BY_N.ok.fill(0); BY_N.delta.fill(0); THROWS.total = 0; THROWS.contested = 0; };
const L2 = (a: number, b: number) => [a, b] as [number, number];
const cases: [string, Partial<Cfg>, number?][] = [
  ["solo Endless (kind .2)", { solo: true, river: "none" }],
  ["two seats, no river", { river: "none" }],
  ["take, live", { call: "take" }],
  ["take, live, both defend", { call: "take", lambda: L2(1, 1) }],
  ["take, history", { call: "take", river: "history" }],
  ["call (loan), history", { call: "loan", river: "history" }, 2000],
];
console.log("drift(n) = mean tile change on turns starting with n tiles; b(n) = share of those turns spellable (own + live)");
for (const [name, m, n] of cases) {
  reset(); const r = run({ ...BASE, ...m, name }, n ?? G);
  const cells = [4, 6, 8, 9, 10].map((k) => `n=${k}: b ${(BY_N.ok[k] / BY_N.turns[k]).toFixed(2)} drift ${(BY_N.delta[k] / BY_N.turns[k]).toFixed(2)}`);
  console.log(`${name.padEnd(26)} | ${cells.join(" | ")} | contested throws ${(100 * THROWS.contested / Math.max(1, THROWS.total)).toFixed(0)}% of ${THROWS.total} | mean rounds ${r.meanRounds}`);
}
console.log("--- first-player check (take, live) ---");
for (const [name, m] of [["open first round", {}], ["closed first round", { closedFirstRound: true }]] as [string, Partial<Cfg>][]) {
  const r = run({ ...BASE, call: "take", ...m, name }, 40000);
  console.log(`${name}: East ${r.eastWin} West ${r.westWin} draw ${r.draw} mean rounds ${r.meanRounds}`);
}

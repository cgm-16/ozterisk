import { runOne } from "./harness.ts";
import { runEngine } from "./engine.ts";
const N = 4000;
const m = (xs: number[]) => (xs.reduce((t, x) => t + x, 0) / xs.length).toFixed(1);
const show = (label: string, rs: { correct: number; distinct: number; submitted: number }[]) =>
  console.log(`${label}: submitted ${m(rs.map((r) => r.submitted))} correct ${m(rs.map((r) => r.correct))} distinct ${m(rs.map((r) => r.distinct))}`);
show("REAL Endless replace k0.2 blind", Array.from({ length: N }, (_, s) => runOne({ deal: "replace", kindRate: 0.2, policy: "blind", skill: 0.95 }, s + 1)));
show("REAL Classic(digit-only) replace k0.2 blind", Array.from({ length: N }, (_, s) => runOne({ deal: "replace", kindRate: 0.2, policy: "blind", skill: 0.95, mode: "classic" }, s + 1)));
show("ENG Card fixed15 k0.2 aware, all runs", Array.from({ length: N }, (_, s) => runEngine({ deal: "deck", kindRate: 0.2, policy: "aware", skill: 0.95, capacity: () => 15, horizon: 45 }, 100000 + s)));
show("ENG all-correct 30 draws replace k0 (ceiling)", Array.from({ length: N }, (_, s) => runEngine({ deal: "replace", kindRate: 0, policy: "blind", skill: 1, capacity: () => 1000, horizon: 30 }, 100000 + s)));

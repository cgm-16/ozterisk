import { bPrime, fastB } from "./lib.ts";
// Mockup hand at overflow: seated 0 1 2 4 6 7 7 9 9 9, rail 8 (11 tiles, capacity 10). Missing 3 and 5.
const hand = [0, 1, 2, 4, 6, 7, 7, 9, 9, 9, 8].map((d) => 1 << d);
const nbr = (c: number) => 0b111 << (c - 1);
const show = (label: string, masks: number[]) => console.log(`${label.padEnd(34)} b ${fastB(masks).toFixed(3)}  b' ${bPrime(masks).toFixed(3)}`);
show("hand as is (11 tiles)", hand);
for (const d of [0, 1, 2, 4, 6, 7, 8, 9]) { const i = hand.indexOf(1 << d); show(`discard ${d}`, hand.filter((_, j) => j !== i)); }
for (const c of [1, 3, 5, 7, 8]) {
  const a = hand.indexOf(1 << (c - 1)), b = hand.indexOf(1 << (c + 1));
  if (a < 0 || b < 0) continue;
  show(`fire ${c - 1}+${c + 1} -> ${c - 1}-${c + 1} (face seated)`, [...hand.filter((_, j) => j !== a && j !== b), nbr(c)]);
  show(`   ...while in the kiln (face absent)`, hand.filter((_, j) => j !== a && j !== b));
}

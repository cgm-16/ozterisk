// Instrument check: at k = 8 the window bot must equal clairvoyant par.
import { analyze, createSearch, mulberry32, plantTable, playMyopic, solvePuzzle, windowLine } from "./lib.ts";
import { PLAYTEST_TABLES } from "../../../../../../src/game/playtestTables.ts";
import type { PuzzleDeal } from "../../../../../../src/game/types.ts";

const BAND_SEED = 8;
const random = mulberry32(BAND_SEED);
const band: PuzzleDeal[] = [];
let planted = 0;
while (band.length < 300) {
  const deal = plantTable(random);
  planted++;
  const { par, onlyMoves } = solvePuzzle(deal);
  if (par >= 7 && onlyMoves >= 2 && playMyopic(deal) < par) band.push(deal);
}
console.log(`M8 band: 300 tables from ${planted} plants of mulberry32(${BAND_SEED}) (1 in ${(planted / 300).toFixed(2)})`);
console.log(`sample (playtest #3) clairvoyant par = ${solvePuzzle(PLAYTEST_TABLES[2]).par}; all three: ${PLAYTEST_TABLES.map((t) => solvePuzzle(t).par).join(",")}`);

for (const [name, tables] of [["playtest", PLAYTEST_TABLES], ["M8 band", band]] as const) {
  let equal = 0, optionMismatch = 0, options = 0, tiedDecisions = 0, controlMismatch = 0, solverMismatch = 0;
  for (const deal of tables) {
    const search = createSearch(deal);
    const clair = search.bestScore(0, search.root.counts, search.root.size);
    if (clair !== solvePuzzle(deal).par) solverMismatch++;
    if (analyze(deal, 8).window === clair) equal++;
    // Every option's first tuple component must equal gain + clairvoyant best from its child.
    for (const { r, options: os, values } of windowLine(search, 8).line) {
      const top = Math.max(...values.map((v) => Math.floor(v / 100)));
      if (values.filter((v) => Math.floor(v / 100) === top).length > 1) tiedDecisions++;
      os.forEach((o, i) => {
        options++;
        if (Math.floor(values[i] / 100) !== (o.kind === "correct" ? 1 : 0) + search.bestScore(r + 1, o.counts, o.size)) optionMismatch++;
      });
    }
    if (windowLine(search, 8, true).score !== clair) controlMismatch++;
  }
  console.log(`${name} (${tables.length}): k=8 window==clair ${equal}/${tables.length}; option first-component vs solver mismatches ${optionMismatch}/${options}; decisions with >1 option at the top correct count ${tiedDecisions} (all reach par if mismatches = 0); createSearch vs solvePuzzle par mismatches ${solverMismatch}; CONTROL (correct count dropped) window!=clair ${controlMismatch}/${tables.length}`);
}

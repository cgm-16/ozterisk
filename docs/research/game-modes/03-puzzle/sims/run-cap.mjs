// Like _runner/run.mjs, but serves balance.ts with INVENTORY_CAPACITY replaced by
// process.env.CAP, so the REAL gameReducer/selectors run at another capacity.
// The repo file is untouched: the patch happens in Vite's load hook, in memory.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runnerImport } from "vite";

const ROOT = fileURLToPath(new URL("../../../../../", import.meta.url));
const BALANCE = fileURLToPath(new URL("../../../../../src/game/balance.ts", import.meta.url));
const cap = Number(process.env.CAP ?? "10");
const patch = {
  name: "patch-capacity",
  enforce: "pre",
  load(id) {
    if (id.split("?")[0] !== BALANCE) return null;
    const src = readFileSync(BALANCE, "utf8");
    const out = src.replace(/export const INVENTORY_CAPACITY = \d+;/, `export const INVENTORY_CAPACITY = ${cap};`);
    if (out === src && cap !== 10) throw new Error("patch-capacity: pattern not found");
    globalThis.__patchedCapacity = cap;
    return out;
  },
};
const file = process.argv[2];
await runnerImport(resolve(file), { root: ROOT, configFile: false, logLevel: "error", plugins: [patch] });

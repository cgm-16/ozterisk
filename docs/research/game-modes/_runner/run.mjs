// Runs a TypeScript sim that imports the real game modules.
// Usage, from the repo root: node docs/research/game-modes/_runner/run.mjs path/to/sim.ts [args]
// The sim does its work at import time (top-level code / top-level await).
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runnerImport } from "vite";

const file = process.argv[2];
if (!file) throw new Error("usage: node run.mjs path/to/sim.ts");
await runnerImport(resolve(file), { root: fileURLToPath(new URL("../../../../", import.meta.url)), configFile: false, logLevel: "error" });

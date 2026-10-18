# Research runner

Tools behind the game-mode drafts. Research code, not product code.

- `run.mjs` runs a TypeScript sim against the real `src/game` modules through Vite's module runner. From the repo root: `node docs/research/game-modes/_runner/run.mjs docs/research/game-modes/07-kiln/sims/kan.ts`. Extra arguments reach the sim as `process.argv[3]` onward.
- `smoke.ts` is the runner's own check: b(10) ≈ 0.48, b(20) ≈ 0.80, b(0) = 0.
- `check-draft.mjs <draft folder>` is the mechanical gate each draft passed. `selftest/bad` must fail it and `selftest/good` must pass.
- `make_matrix.py <out.svg>` writes `../spec-fit.svg`.

Each draft's `sims/` folder holds its scripts and the outputs its text cites. The scripts ran at 4d1259e and import the live `src/game`, so later changes to the game can change or break them.

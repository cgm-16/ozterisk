---
reads:
  - docs/superpowers/specs/2026-10-19-puzzle-prototype-design.md  # §6 removal, §6.1 protocol, §9.3 amendments
  - docs/journal/journal-2026-10-19.md  # the prototype rule and the playtest-set exception
  - docs/spec/product.md
  - docs/spec/ui-i18n.md
  - docs/plan/traceability.md
  - src/main.tsx
  - src/game/playtestTables.ts
---

# T90 — After a pass: strip the set, amend the spec

```yaml
task_id: T90
title: "After a pass: strip the playtest set, amend the spec"
milestone: M8 — Puzzle Prototype
priority: P1
estimate: S
wave: W5
depends_on: [T89]
parallel_safe: false
paths:
  - src/main.tsx
  - src/game/playtestTables.ts
  - src/game/playtestTables.test.ts
  - docs/spec/product.md
  - docs/spec/ui-i18n.md
  - docs/plan/traceability.md
  - docs/plan/roadmap.md
```

## Gate

**Start only after the playtest has passed under spec §6.1, and its journal PR
has merged to `main`.** On a fail this task is not done. The PR closes unmerged,
and this issue closes as not planned with a link to the journal entry.

## Why

A merged mode is a spec change, and the spec is canonical (journal
2026-10-19). The playtest set was allowed on the preview only, because it puts
replayable runs on a public URL, so it leaves before the merge.

## Steps

- [ ] **Rebase** `feat/M8-puzzle-prototype` on `main`, so the playtest journal
      entry and anything else merged meanwhile are underneath.
- [ ] **Strip the set.** Delete `src/game/playtestTables.ts` and
      `src/game/playtestTables.test.ts`; in `src/main.tsx`,
      `dealPuzzle: () => dealPuzzle(Math.random)`. Run `npm test`: green with no
      other edit shows nothing else depended on the set. Then
      `git grep -n "playtest" src` prints nothing.
- [ ] **Amend `docs/spec/product.md`** with what the branch built (spec §9.3):
  - §1.1: three modes, with Puzzle's one-line thesis;
  - §1.2: the deal (`plantTable`, the band, the attempt bound) and that
    production passes `Math.random`, with no seed and no handle;
  - §1.3: Puzzle's opening hand is the table's five digits;
  - §1.5: a correct Puzzle answer takes its row's printed pay;
  - §1.7a: Puzzle's five sockets;
  - §1.8: the end after the last row, and made par;
  - §1.10: Par in the HUD;
  - §1.14: the Puzzle copy keys.
- [ ] **Amend `docs/spec/ui-i18n.md`**: §1.12, the one-row rack at capacity 5 and
      the ledger (order, ink marks, no new motion); §1.15, the Puzzle share
      format.
- [ ] **The layout check's source.** The design spec's §7 Gallery line says
      the layout check reads the gallery's answering state. It reads the app
      from `/` (Ori, 2026-10-19): on a phone the gallery stacks its picker
      above the stage, so it cannot host a no-page-scroll reading. Rewrite the
      line to say so, and use the same wording wherever the `docs/spec/**`
      amendment names the check.
- [ ] **Traceability.** Add each new requirement to `docs/plan/traceability.md`
      with its owning task (T85–T89) and evidence (test file and name).
- [ ] **Roadmap.** Mark `M8` closed with its merge SHA once merged.
- [ ] **Gates.** `npm ci && npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e`.
- [ ] **Commit**, then mark the PR ready for review.

```bash
git add -A src/main.tsx src/game docs/spec docs/plan
git commit -m "docs(spec): Puzzle joins the canon; the playtest set leaves" -m "Task: T90" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Acceptance gate

- `git grep -n "playtest" src` prints nothing.
- Every behaviour the branch adds is stated in `docs/spec/**` and traced.
- Release gates green.

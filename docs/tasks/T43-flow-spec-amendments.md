---
reads:
  - docs/spec/product.md  # §1.11, the keyboard contract this changes
  - docs/spec/ui-i18n.md  # §1.14, the required-copy table
  - https://github.com/cgm-16/ozterisk/issues/51  # the ruling this records
---

# T43 — Amend the keyboard contract and the required copy

```yaml
task_id: T43
title: Record the R restart binding and the title disclosure's new label
milestone: M5.5e — Flow Screens
priority: P0
estimate: S
wave: W0
depends_on: []
parallel_safe: false
paths:
  - docs/spec/product.md
  - docs/spec/ui-i18n.md
  - docs/plan/roadmap.md
```

**Interfaces**

- Blocks every other `M5.5e` task. `T48` implements what this permits; `T44`
  renders the copy row this adds. Nothing in `src/` moves here.

## Why

`M5.5a` established that a spec conflict is amended on the record before the code
that needs it, not patched around afterwards. Two `M5.5e` deliverables change
committed rules, so they get the same treatment, and they get it in one commit at
the head of the branch so that every code commit after it is compliant by
construction.

The `408px` boundary in `M5.5d` shipped its amendment inside a code commit and had
to be flagged in the PR body for a second opinion. Not repeating that shape.

- [ ] **Step 1: §1.11 swaps `Enter` for `R` on `gameOver`**

`docs/spec/product.md` §1.11 currently reads:

| `gameOver` | `Enter` | Start a fresh run, equivalent to **Play Again** |

Issue #51 records the ruling and the evidence behind it. Replace that row with an
`R` row, and add a second `gameOver` row in the idiom the existing `title` row
already uses, saying `Enter` has no global shortcut there.

The evidence, restated so the amendment carries its own argument: a player
advancing a run by keyboard — Submit, `Enter`, Submit, `Enter` — destroys the
score screen with the tap already in flight before it can be read or shared.
Measured: `{ reachedGameOver: true, survivedSecondEnter: false, activeTag: "BODY" }`.
`event.repeat` does not help; it catches a held key, not two discrete presses.
Scoping the shortcut to "only when nothing has focus" fixes the Share/Copy trap
and not this one. `R` collides with nothing — buttons do not activate on it — so
the focus guard becomes unnecessary rather than merely correct.

Also worth recording in the amendment: the language toggle renders `<button>`s and
is present on `gameOver`, so `Enter` on a focused 한국어 currently restarts the run
*and* discards the language change, contradicting §1.11's own closing line that
language changes never reset game state.

- [ ] **Step 2: §1.14 relabels the disclosure and adds the restart hint**

Two changes to the required-copy table in `docs/spec/ui-i18n.md`:

1. **`title.howToPlay` becomes `title.more`** — en `More`, ko `더 보기`. The
   `M5.5c` ruling moved four of the seven topics onto the felt as always-visible
   swatch rules; a disclosure holding the remaining three is no longer "How to
   Play". This is a *changed* row, not an additive one, which is why it belongs in
   this commit rather than riding along with `T44`.
2. **A new row for the restart hint** — the `R` key has no visible affordance
   anywhere. `howToPlay.keyboard` is the only keyboard documentation in the
   product and it lives inside a collapsed disclosure on a screen the player has
   already left. Add `gameOver.restartHint`, en and ko. `T47` decides where it
   sits; this row fixes what it says.

The seven-topic requirement below the table does not change — all seven are still
explained, three on the felt and four in the disclosure.

**Do not** touch `howToPlay.*` in the table: those strings are not in it. §1.14
requires the topics be explained, not that they be explained in a particular
number of strings, so `T44` splitting `howToPlay.outcomes` at its existing
sentence boundary is not an amendment.

- [ ] **Step 3: The roadmap's `M5.5e` exit gate names its largest deliverable**

`docs/plan/roadmap.md:29` currently gates `M5.5e` on two clauses — answer slots
stay mounted through feedback, `role="status"` regions intact. Neither names the
game-over overhaul or the restart affordance, which are the phase's largest piece
of work. A gate that does not name them passes with them unverified.

Add them. Keep the two existing clauses.

- [ ] **Step 4: Commit**

```bash
git add docs/spec/ docs/plan/roadmap.md docs/tasks/T43-flow-spec-amendments.md
git commit -m "docs(spec): bind restart to R and relabel the title disclosure" -m "Task: T43"
```

**Acceptance criteria**

- §1.11 has no `gameOver` `Enter` row, has a `gameOver` `R` row, and says what
  `Enter` does there instead.
- §1.14 carries `title.more` and `gameOver.restartHint` with both locales.
- The `M5.5e` roadmap gate names the game-over overhaul and the restart affordance.
- Every amended clause cites the rule or the measurement that motivates it.
- Zero diff under `src/`. Lint, typecheck, test and build all still pass.

**What this task does not do**

- No message-catalogue edits. `src/i18n/messages.ts` is `T44`'s and `T47`'s.
- No keyboard code. The binding is `T48`.
- Does not rewrite issue #51's stale Constraints block. That block quotes the
  pre-`M5.5a` §1.12 ("minimal number-board aesthetic", "No particles, screen
  shake, decorative motion") which `M5.5a` struck wholesale. Leave the issue as
  the historical record it is; no task file quotes that block.

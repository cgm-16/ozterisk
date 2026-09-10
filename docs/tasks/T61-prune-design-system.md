---
reads:
  - docs/design-system/readme.md  # what the folder claims to be
  - docs/design-system/decisions.md  # the one file the product still depends on
---

# T61 — Prune `docs/design-system` down to what the product still reads

```yaml
task_id: T61
title: Retire the handover canvases now that nothing reads them
milestone: M5.5g — Visual Verification
priority: P2
estimate: M
wave: W3
depends_on: [T57]
parallel_safe: true
paths:
  - docs/design-system/
  - eslint.config.js
```

**Interfaces**

- Docs and one config line. Zero `src/` diff.
- Runs after `T57` only because `T57` amends `decisions.md`, which this task
  must not delete.

## Why

#58, filed in `M5.5a` and **blocked until `M5.5f` merged**. The block is now
gone: the motion phase was the last consumer of the storyboard canvases, and it
has shipped.

The folder was committed as a design artifact (decision 2 of the milestone
plan, ~920K). It has done its job. Five phases read it; nothing does now.

**One file is not an artifact — it is a live dependency.** §1.12 delegates the
permitted-motion inventory to `docs/design-system/decisions.md` by name:

> Permitted motion is the **named inventory** in
> `docs/design-system/decisions.md` — the fifteen named storyboard moments.

So `decisions.md` stays, and stays at that path. Deleting or moving it breaks a
spec clause. If the pruning makes a different home obviously right, **that is a
§1.12 amendment and it is not this task's** — report it.

- [ ] **Step 1: Establish what is still referenced**

Grep the whole repo — `src/`, `docs/`, `scripts/`, `eslint.config.js`,
`package.json` — for paths under `docs/design-system/`. The task files of
`M5.5a`–`M5.5f` reference the canvases heavily and those references are
**historical record**: a task file citing a file that no longer exists is
acceptable and expected, the same way a journal cites a deleted line. Do not
rewrite task files or journals to avoid a broken path.

What matters is anything that *reads* the folder at build, test or lint time.

- [ ] **Step 2: The eslint ignore**

`M5.5a` added a `docs/design-system` ignore to `eslint.config.js` because the
13 reference components fail `eslint --max-warnings=0` on an unused type
import. It was recorded as a deliberate deviation in `T27` and the PR body.

If the `.jsx` components go, **the ignore goes with them** — a config
exception outliving its cause is exactly the kind of quiet debt this milestone
has been clearing. If any stay, it stays, and the comment should say which
files it now covers.

- [ ] **Step 3: Prune**

Keep what a future phase would have to re-derive; drop what has been fully
absorbed into `src/` and the spec. State the rule you applied in the commit,
because the next person's question will be *"why this and not that."*

`M6` and `M7` are the next milestones and they add product surface — mode
select, `getCapacity(round)`, special tiles. Consider whether they will want a
visual reference before deleting the component set outright. That is a judgment
call and it should be recorded as one.

**Acceptance criteria**

- `decisions.md` is at its §1.12 path, unchanged by this task beyond `T57`'s
  amendment.
- Nothing in `src/`, `scripts/` or the build reads a deleted path.
- `eslint.config.js`'s ignore either goes or is justified against what remains.
- The commit states the keep/drop rule, not just the file list.
- `lint`, `typecheck`, `test`, `build` green.
- #58 closed, quoting the rule applied.

**What this task does not do**

- Does not touch `src/`.
- Does not amend §1.12. If `decisions.md` needs a new home, report it.
- Does not rewrite historical task files or journals whose paths this task
  invalidates.

---
reads:
  - docs/design-system/readme.md  # the rules
  - docs/design-system/decisions.md  # why, and what was rejected
  - docs/design-system/github.md  # the sync point and screen map
---

# T27 — Adopt the design system as a repo artifact

```yaml
task_id: T27
title: Commit the Tile House design system under docs/ and correct its known errors
milestone: M5.5a — Design Contract Amendments
priority: P1
estimate: S
wave: W1
depends_on: []
parallel_safe: true
paths:
  - docs/design-system/
  - eslint.config.js
```

**Interfaces**

- Produces: `docs/design-system/`, the normative source §1.12 defers to for token
  values, material rules, and the motion inventory.

## Why

The system arrived as an untracked 920K directory. Untracked, it pollutes every
`git status` for the length of a seven-PR milestone, and nothing stops a `git add -A`
from committing it at an arbitrary moment. More importantly it is not summarizable:
`ozterisk Storyboard.dc.html` is the **only** frame-by-frame source for the sixteen
motion moments, and `1-0 Redesign - Tile House.dc.html` is the only record of which
options were rejected and why. A later implementer who cannot read those files cannot
tell a locked decision from an accident.

Its sync point is `2026-08-29T09:16:59Z` against `src`; the last `src` commit is
`ecd76a1`, so it describes the code exactly as it stands. There is no drift to
reconcile at adoption time.

- [ ] **Step 1: Move the directory to `docs/design-system/`**

Whole, including `support.js` — the `.dc.html` canvases will not render without it.

- [ ] **Step 2: Correct the two factual errors in place**

`readme.md` and `guidelines/type-ui.html` both claim Zen Kaku Gothic New "sets both
scripts" / is "one face for both locales". It is a Japanese family and serves no
Hangul subset, so the Korean locale would silently fall back to `system-ui` —
which §8.5's "Korean copy does not clip" would not catch, because unstyled Korean
does not clip. Correct both, and note that `--font-ui` needs a Korean face.

- [ ] **Step 3: Note the contract that outranks it**

A short header in `readme.md`: `docs/spec/ui-i18n.md` §1.12 is the contract; this
directory is the normative source for values. Where they disagree, §1.12 wins.

- [ ] **Step 4: Open the cleanup issue**

The `.dc.html` canvases, `uploads/`, `support.js` and `.thumbnail` are ~500K of
design-tool output. They are kept because the storyboard is load-bearing, but the
question of what to prune once the motion phase is built is worth a tracked issue
rather than a decision made silently at the end.

- [ ] **Step 5: Exclude it from lint**

The handover ships 13 reference components as `.jsx` + `.d.ts`, authored for reading
rather than compiling; `eslint . --max-warnings=0` fails on the first unused type
import. `tsconfig.app.json` includes only `src`, so typecheck is unaffected and only
`eslint.config.js` needs the ignore. Adopting the artifact is what makes this
necessary, so it belongs to this task and not to a later one.

- [ ] **Step 6: Commit**

```bash
git add docs/design-system/ eslint.config.js docs/tasks/T27-adopt-design-system.md
git commit -m "docs(design-system): adopt the Tile House system as a repo artifact" -m "Task: T27"
```

**Acceptance criteria**

- `git status` is clean at the repo root with no untracked design directory.
- Neither the Zen Kaku claim nor the "one face for both locales" claim survives.
- `readme.md` states that §1.12 outranks it.
- The cleanup issue exists and is linked from the PR.
- `npm run lint` passes with the artifact committed.

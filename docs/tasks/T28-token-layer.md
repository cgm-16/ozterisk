---
reads:
  - docs/design-system/tokens/  # the values, verbatim where they transfer
  - docs/design-system/readme.md  # the rules the values serve
  - docs/spec/ui-i18n.md  # §1.12, which outranks the design system
---

# T28 — Land the Tile House token layer

```yaml
task_id: T28
title: Split global.css into token partials carrying the Tile House values
milestone: M5.5b — Foundations and Identity
priority: P1
estimate: M
wave: W1
depends_on: [T27]
parallel_safe: false
paths:
  - src/styles/global.css
  - src/styles/tokens/
  - package.json
  - package-lock.json
```

**Interfaces**

- Produces: the whole token vocabulary every later M5.5 phase consumes —
  `--surface-*`, `--text-*`, `--accent`, `--state-*`, `--focus-ring`,
  `--ring-focus`, `--shadow-*`, `--tile-w/h`, `--dur-*`, `--ease-*`, and the ten
  `oz-*` keyframes.
- Produces: three self-hosted Latin faces. Consumed by T30, which adds the
  fourth on demand.

## Why

`global.css` carries 25 tokens in one file, and the design system carries nine
partials. Mirroring the partials is not tidiness: it is what lets a later phase
diff one file against its source and see that a value transferred. Everything
here is plain `.css`, never `.module.css` — CSS Modules scope `@keyframes`
names, and an animation naming a scoped keyframe fails silently, which is the
single most expensive mistake available in this milestone.

- [ ] **Step 1: Port the eight value partials**

`colors.css`, `typography.css`, `radius.css`, `elevation.css`, `motion.css` and
`keyframes.css` transfer verbatim. `spacing.css` is rewritten mobile-first for
the three rack tiers §1.12 fixes. `fonts.css` is written fresh — see step 2.

`--border-hairline` changes meaning: it was a `1px` width and is now the hairline
*colour*. The plan sanctions this ("survives by name with new values"); T29 owns
the call sites.

- [ ] **Step 2: Self-host the fonts**

The design system's `tokens/fonts.css` is a single `@import` from
`fonts.googleapis.com`. Copying it would destroy this milestone's own exit gate —
zero non-origin requests — and nothing in lint, typecheck or test would catch it.
Replace it with `@fontsource` imports of the Latin subsets only. Zen Kaku Gothic
New serves no Hangul, so its CJK subsets are weight nobody reads; Noto Sans KR is
T30's problem.

- [ ] **Step 3: Make `global.css` the entry**

`@import` the eight partials in the design system's own order, then the app's
reset and base. It stays one global stylesheet in the AGENTS.md sense.

- [ ] **Step 4: Commit**

```bash
git add src/styles/ package.json package-lock.json docs/tasks/T28-token-layer.md
git commit -m "feat(styles): land the Tile House token layer" -m "Task: T28"
```

**Acceptance criteria**

- `src/styles/tokens/` holds eight partials; `global.css` imports all eight.
- No stylesheet references a non-origin URL.
- `npm run build` emits every font face as a same-origin asset.
- Keyframes live in plain CSS, not a module.
- Lint, typecheck, test and build all pass.

**Deliberate deviations from the design system**

- `tokens/fonts.css` is not a mirror (step 2).
- `tokens/base.css` has no counterpart: the app's reset and base already live in
  `global.css`, and moving them would gain nothing.
- The ported `keyframes.css` comment for `oz-fan` promised `--oz-chip-*` tokens
  "below" that are defined nowhere in the system. The clause is dropped rather
  than carried into `src/`; M5.5f decides whether those tokens should exist.

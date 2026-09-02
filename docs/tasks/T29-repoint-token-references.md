---
reads:
  - src/styles/tokens/  # the vocabulary that now exists
  - docs/design-system/tokens/colors.css  # what each semantic alias means
---

# T29 — Repoint every stylesheet onto the Tile House token names

```yaml
task_id: T29
title: Retire the --color-* vocabulary and the four renamed tokens
milestone: M5.5b — Foundations and Identity
priority: P1
estimate: M
wave: W1
depends_on: [T28]
parallel_safe: false
paths:
  - src/components/*/*.module.css
  - src/app/App.module.css
  - src/gallery/Gallery.module.css
```

**Interfaces**

- Consumes: the token vocabulary T28 landed.
- Produces: a `src/` in which no `var()` names a token that does not exist.

## Why

T28 deleted the `--color-*` vocabulary. Every reference left behind resolves to
nothing, and an unresolved `var()` in a `color` or `background` declaration falls
back to the initial value — black text on a dark felt field, with no error
anywhere and a green test suite, because the suite carries zero style assertions.
This task is what stops that. It is the last task in which a dangling token
reference is possible, so it must leave none.

**This is a rename, not a restyle.** Change token references. Do not change
selectors, geometry, layout, or add rules. M5.5c–M5.5e own the appearance of
these components; if a rule looks wrong after the substitution, that is their
problem to solve and not yours to pre-empt.

- [ ] **Step 1: Substitute the mechanical renames**

Same value, new name — these are exact no-ops:

| Was | Is now |
|---|---|
| `--tile-size` | `--target-min` |
| `--duration-base` | `--dur-state` |
| `--duration-fast` | `--dur-press` |
| `--font-sans` | `--font-ui` |
| `--shadow-inset` | `--shadow-socket` |
| `--color-text` | `--text-primary` |
| `--color-text-muted` | `--text-meta` |
| `--color-accent` | `--accent` |
| `--color-correct` | `--state-correct` |
| `--color-incorrect` | `--state-incorrect` |
| `--color-reward` | `--state-reward` |
| `--color-discard` | `--state-discard` |

`--ease-standard`, `--space-*`, `--radius-sm`, `--radius-md`, `--arena-max-width`,
`--press-offset` and `--shadow-tile` keep their names. Several of them changed
value in T28; that is intended and is not yours to compensate for.

- [ ] **Step 2: Fix the `--border-hairline` meaning change**

It was a `1px` width; it is now the hairline *colour*. Every call site currently
reads `border: var(--border-hairline) solid var(--color-border)` and must become
`border: 1px solid var(--border-hairline)`. Write the `1px` literally — the design
system defines no width token and inventing one is scope you do not have.

- [ ] **Step 3: Rule on the surface sites by what they style**

`--color-canvas` and `--color-surface` each did several jobs, so there is no
one-to-one answer. Name the thing the rule is actually styling:

| The rule styles… | Use |
|---|---|
| a ceramic tile face | `--surface-tile` (a gradient — only valid in `background`) |
| a socket or empty slot cut into the felt | `--surface-socket` |
| a panel, card, rail or modal | `--surface-panel` |
| the felt field itself | `--surface-table` |
| text sitting on gold or on ceramic | `--text-on-tile` |
| the dashed rim of an empty answer slot | `--border-slot-empty` |

`--surface-tile` is a `linear-gradient`. It cannot be used where a plain colour is
required. If a site needs one, use `--clay-050`.

State your reasoning for each judgment site in the report — a reviewer cannot
check a ruling you did not record.

- [ ] **Step 4: Prove nothing dangles**

Grep `src/` for every `var(--…)` and confirm each name is defined in
`src/styles/tokens/` or in the module itself. Paste the check into the report.
`npm test` passing is not evidence here and must not be offered as such.

- [ ] **Step 5: Commit**

```bash
git add src/ docs/tasks/T29-repoint-token-references.md
git commit -m "refactor(styles): repoint the app onto the Tile House tokens" -m "Task: T29"
```

**Acceptance criteria**

- No `var(--color-` anywhere in `src/`.
- Every `var()` in `src/` names a token that exists.
- No selector, property, or value changed except a token name (and the `1px`
  literal of step 2).
- Lint, typecheck, test and build pass.

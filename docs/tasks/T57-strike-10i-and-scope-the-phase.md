---
reads:
  - docs/spec/ui-i18n.md  # §1.12, the clause that counts the moments
  - docs/design-system/decisions.md  # the inventory itself, and 10d's strike as the precedent
  - docs/plan/roadmap.md  # the M5.5g row this task corrects
---

# T57 — Strike `10i`, and make the roadmap say what this phase is

```yaml
task_id: T57
title: Amend the moment inventory down to fifteen and scope M5.5g on the record
milestone: M5.5g — Visual Verification
priority: P1
estimate: S
wave: W1
depends_on: []
parallel_safe: false
paths:
  - docs/spec/ui-i18n.md
  - docs/design-system/decisions.md
  - docs/plan/roadmap.md
  - docs/journal/
```

**Interfaces**

- Docs only. Zero `src/` diff — verify it, do not assume it.
- Lands **first and alone**. Every later task in this phase is scoped by the
  roadmap row this one writes.

## Why

Two amendments, both decided by Ori, both of which the rest of the phase
depends on being on the record before work starts.

### 1. `10i` is struck from the inventory

§1.12 permits *"the **named inventory** in `docs/design-system/decisions.md` —
the sixteen named storyboard moments"*, and says outright that **extending the
inventory amends this section**. Reducing it is the same act.

`10i` — *"Game over: the last tiles are swept off the rack"* — cannot be built
without either `GameScreen` outliving its own phase or `GameOverScreen` growing
a rack, and the second is new product surface needing `product.md` §1.10
amended. Ori's ruling: **strike it**, the way `10d` (persistent streak rings)
was already struck. `GameOverScreen` stays as it is.

`10d` is the precedent for the form. Follow it exactly: the row stays in the
table marked struck, with the reason, rather than being deleted — the inventory
records what was considered, not only what shipped.

**This touches no code.** `keyframes.css` defines fifteen `@keyframes` and none
of them is `10i`'s — the sweep was never authored, so there is no unused
keyframe to remove and no guard to update. Verify that claim (`grep -n
'@keyframes' src/styles/tokens/keyframes.css`) rather than trusting this
sentence; if a sweep keyframe does exist, the ruling is that it stays defined
and unused, on `oz-rise-ready`'s precedent, and that fact gets recorded here.

**Consequence worth stating plainly.** `M5.5f`'s exit gate — *"Every moment in
the §1.12 inventory implemented"* — was declared missed on the `M5.5b`
precedent. With `10i` struck, that gate reads true retroactively: fifteen
moments, fifteen implemented. Do **not** rewrite `M5.5f`'s roadmap entry or its
journals to claim it passed. The phase shipped short of the gate as the gate
stood on the day, and the record of that is worth more than a tidy table. Note
the change in the `M5.5f` row rather than erasing what it says.

### 2. The roadmap's `M5.5g` row no longer describes this phase

`roadmap.md:31` reads:

> Gallery covers hover, focus-visible, disabled and reduced-motion; §8.5 walked
> with measured evidence at 320px

That was written before the phase inherited a docket. It now also carries #105
(three gallery states that cannot render what they are named for), #84 (rack
badges over the digit — a product decision, now taken), #94, #95 and #58.

`AGENTS.md` §4.4: a milestone whose shape changes is amended in
`docs/plan/roadmap.md` **before work starts, deliberately and on the record.**
That is the mechanism `M5.5a` used to legalise the stacked-PR split, and it is
the same mechanism here.

### 3. Three issues are deliberately out of scope

The milestone plan lists #64, #77 and #31 on this phase's docket. They are
being left out, and the roadmap should say so rather than letting the plan and
the milestone disagree:

- **#64** (`dist/` carries ~1.0 MB of `.woff` duplicates) — a build-output
  defect. Nothing in this phase's exit gate touches it.
- **#77** (lint CSS with Stylelint) — its own title says *once M5.5 settles*.
  Adding a linter mid-verification would churn every stylesheet the phase is
  trying to hold still.
- **#58** stays in, and is the exception: it was blocked on `M5.5f` reading the
  canvases, and that block is gone.
- **#31** (post-release tidy batch) — predates `M5.5` and is labelled
  post-release.

- [ ] **Step 1: Strike `10i`**

`decisions.md` — the `10i` row takes `10d`'s struck form, with the reason and
#104. §1.12 — `sixteen` becomes `fifteen`. Nothing else in the clause moves;
the permission structure, the assignment carve-out and the
`prefers-reduced-motion` requirement are all unchanged.

Close #104 with a comment quoting the amended clause, not merely a state change.

- [ ] **Step 2: Amend the `M5.5g` roadmap row**

The exit gate keeps its two existing clauses and gains what the docket added.
The gate is a standard, not a description of what got done — write it as the
bar the phase must clear.

Record the three out-of-scope issues and the reason for each, in the row or
directly beneath it, matching how the file already carries `M5.5b`'s
four-parts-of-three note.

- [ ] **Step 3: Journal it**

The two amendments, the reasoning Ori's decisions rest on, and the deliberate
choice not to retroactively re-score `M5.5f`.

**Acceptance criteria**

- §1.12 says fifteen; `decisions.md`'s `10i` row is struck in `10d`'s form and
  carries #104; #104 is closed with the clause quoted.
- The `M5.5g` roadmap row states the phase's real shape, and names #64, #77 and
  #31 as deliberately excluded with a reason each.
- `M5.5f`'s roadmap entry and journals still record that it shipped short of
  its gate as the gate then stood.
- `git diff --stat` shows no `src/` path.
- `lint`, `typecheck`, `test`, `build` green — nothing moved, and that is the
  point of running them.

**What this task does not do**

- Does not touch `GameOverScreen`. Striking `10i` is the decision *not* to give
  it a rack.
- Does not amend `product.md` §1.10. That was the other branch of Ori's
  decision and it was not taken.
- Does not open the badge amendment. #84's fix (`T59`) needs no spec change —
  the badge copy is not in §1.14's required-copy table and the accessible name
  is unchanged. Verify that before assuming it.

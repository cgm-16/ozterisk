---
reads:
  - docs/tasks/T32-verify-foundations.md  # the method this task repeats, and why each step is shaped that way
  - docs/journal/journal-2026-08-12.md  # "Narrative is not evidence"
  - docs/plan/roadmap.md  # the M5.5c exit gate this produces evidence for
---

# T37 — Prove the focus indicator on ceramic

```yaml
task_id: T37
title: Produce the measured evidence M5.5c's exit gate asks for
milestone: M5.5c — Tile and Action Primitives
priority: P1
estimate: S
wave: W2
depends_on: [T35, T36]
parallel_safe: false
paths:
  - docs/journal/
```

**Interfaces**

- Consumes: both primitives, wired.
- Produces: the numbers the PR body carries, and the ones `M5.5g` re-walks.

## Why

`M5.5c`'s exit gate reads: *"Both primitives wired at every call site; accessible
names unchanged; the focus indicator ≥ `3:1` on ceramic as well as felt; suite
green."* CI proves the first, second and fourth. It proves nothing about the third,
because `lint → typecheck → test → build` catches no design regression and the
token layer never enters the test graph.

This gate exists because `M5.5b` claimed it and missed. `T32` measured a ring that
was defined correctly and worn by nothing — the token was right, no element
composed it. That is the specific failure this task has to be able to detect, so
reading the token back is not a measurement.

- [ ] **Step 1: Walk the tab order, do not list controls from memory**

Reach every control with `Tab`. A control focused by a click does not match
`:focus-visible`, so a click-then-measure returns the same blank a missing ring
does — and both primitives now key their ring on `:focus-visible` precisely so that
distinction is real.

Cover both primitives at every appearance: rack tile, filled answer slot, reward
tile, and each of the three button variants plus disabled. `sm` and `lg` tiles draw
different edges, so they are different readings.

- [ ] **Step 2: Read both terms of the ratio from pixels**

Neither term from a token value, and neither from a computed style — the reasoning
is in `T32` step 4 and has not changed. A `box-shadow` with no blur puts a hard band
of colour outside the border box that `elementsFromPoint` reports as transparent,
so a computed read resolves past it. And an inset ring is painted with its own
element, so anything drawn after it lands on top and changes its colour.

Screenshot each control focused and unfocused, diff at the same coordinates to find
the band the indicator occupies, then read the indicator's colour from the focused
image and the backdrop from the unfocused image at those coordinates.

**The ceramic reading is the one this gate turns on.** `--ring-focus` is two tones
because gold reaches `3:1` on felt (8.69), socket (11.56) and vermilion (3.55) but
only `1.10` on the ceramic face. The claim under test is that the `--clay-900` line
clears `3:1` where the gold line cannot. Report both lines separately; an average
is not a measurement.

- [ ] **Step 3: Prove the ring composes rather than replaces**

The defect `M5.5b` shipped was structural, not chromatic: a focus `box-shadow`
declared beside an elevation `box-shadow` replaces it. Confirm a focused tile still
draws its own edge — that a focused `lifted` tile shows `--shadow-tile-lifted` and
the ring, not the ring alone.

- [ ] **Step 4: Prove the ring is withheld on click**

Click each control and confirm no ring appears. This is the `:focus-visible`
guarantee, and it is the half that the reference implementations get wrong; a port
that regressed to `onFocus` would pass every other step in this task.

- [ ] **Step 5: Read the ghost variant's boundary**

Not the focus ring, and not this milestone's doing — `ActionButton.jsx` draws the
`ghost` border with `--border-hairline`, and `T36` ported it faithfully. But the
arithmetic says that hairline lands at **1.31:1** against the felt, so the button's
own boundary is effectively invisible; only its label (6.47:1) identifies it. The
disabled state wears the same hairline over the same transparent fill, and the two
labels differ by only **2.12:1**.

Confirm those three figures from pixels, and report whether an active `ghost` and a
disabled button are distinguishable as rendered. Today no screen renders a disabled
`ghost` — Copy Result is the only `ghost` call site and is never disabled — so this
is a latent collision, not a live one. Report it as such; do not fix it here.
Changing it means diverging from the design system, which is Ori's call.

- [ ] **Step 6: Confirm the primitives actually replaced the old rules**

Grep `src/` for the class rules `T35` and `T36` were meant to delete. A primitive
wired beside a surviving duplicate is the failure mode that makes the next phase's
diff lie, and it is invisible to the suite.

- [ ] **Step 7: Record it**

A journal entry carrying the numbers and anything that surprised you.

**Acceptance criteria**

- Every claim is a number or a log line, not a sentence.
- Ceramic is measured per tone, not averaged.
- Any claim that could not be measured is stated as unmeasured, not softened.

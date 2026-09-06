---
reads:
  - docs/tasks/T42-verify-board.md  # the precedent, and its measurement traps
  - docs/journal/journal-2026-09-06.md  # what M5.5d measured and how
---

# T49 — Walk the flow screens with measured evidence

```yaml
task_id: T49
title: Verify the four flow screens against the gate rather than narrating them
milestone: M5.5e — Flow Screens
priority: P1
estimate: M
wave: W3
depends_on: [T44, T45, T46, T47, T48]
parallel_safe: false
paths:
  - docs/journal/
```

**Interfaces**

- Runs last. Changes no `src/` file: if it finds a defect, it reports it and the
  owning task's implementer fixes it.

## Why

`M5.5e`'s exit gate is a set of measurements, not a set of tests. The precedent is
`docs/journal/journal-2026-08-12.md`: **"Narrative is not evidence."** Measure
in-page; do not describe screenshots.

`M5.5d` learned this the hard way twice — an empty capacity pip measured `1.27:1`
and turned out not to be rendering at all, and a tier boundary was moved on a
rationale that was empirically false. Both were caught by measuring, and one was
caught only by an adversarial pass sweeping *between* the tiers rather than at
them.

- [ ] **Step 1: The gate, clause by clause**

Take `docs/plan/roadmap.md`'s `M5.5e` row as `T43` amended it, and produce a
figure or a reproducible check for every clause. A clause with prose next to it
instead of a measurement has not been verified.

- [ ] **Step 2: Contrast**

Every new or changed surface, against what is actually behind it:

- The four title swatches on `--felt-900`, the socket one especially — it is the
  one the design flags as invisible at `18px` if built naively.
- The feedback panel's border in both branches.
- The reward caption (`4.5:1`, not `3:1` — it is `11px` body text).
- The chop.
- The restart hint.

Report what you measured against, not just the ratio. A figure without its
background is not a measurement.

- [ ] **Step 3: `320px`, both locales, every phase**

§8.5 forbids horizontal scroll at `320px` and that outranks the type scale.
`documentElement.scrollWidth` against `clientWidth`, plus a sweep for any element
whose right edge exceeds the viewport.

**Sweep between the boundaries, not only at them.** Issue #85 is the standing
example: the middle tier fires about `15px` early wherever a classic scrollbar
takes layout width, and no resting-state measurement at a tier boundary catches
it. #85 is `M5.5g`'s to fix — do not fix it here — but if this phase's screens
make it worse, say so.

The title screen's two-column rule grid and the game-over stat row are the two new
things most likely to overflow.

- [ ] **Step 4: Measurement traps, recorded so you do not rediscover them**

From `T37` and `T42`:

- `matches(':active')` is always false in an automated probe.
- `:focus-visible` survives a click on an already-focused element.
- Cropping a screenshot to the border box misses an outset outline.
- `getComputedStyle` is stale within a single `evaluate` — re-read it.
- The gallery stretches some controls to their container. `LanguageToggle` renders
  at `256px` there while its buttons span ~`111px`, so corner and edge
  measurements taken in the gallery can be measuring a layout artifact. Check
  against the real screen before believing a gallery figure.

- [ ] **Step 5: Reduced motion**

Per `docs/journal/journal-2026-08-09.md`: flip `rule.media.mediaText` between
`'all'` and `'(prefers-reduced-motion: reduce)'` and read
`getComputedStyle(el).transitionDuration`. Do not touch OS settings, and do not
accept "look at it and confirm nothing happens" as a criterion.

`M5.5e` adds no keyframes, so the check here is that nothing it *did* add animates
unconditionally.

- [ ] **Step 6: Journal it and commit**

Record the figures, the traps hit, anything carried forward, and any defect found
but deliberately not fixed — with the issue number it was filed under.

```bash
git add docs/journal/ docs/tasks/T49-verify-flow.md
git commit -m "docs(journal): record what the flow screens measured" -m "Task: T49"
```

**Acceptance criteria**

- Every gate clause has a figure or a reproducible check beside it.
- Every contrast figure names the surface it was measured against.
- No horizontal scroll at `320px` in either locale, in every phase.
- Any defect found is either fixed by its owning task or filed with a number.
- No `src/` diff in this commit.

**What this task does not do**

- Does not fix #85. That is `M5.5g`'s, with a container-query recommendation
  already recorded on the issue.
- Does not add gallery entries. Hover, focus-visible, disabled and reduced-motion
  fixtures are `M5.5g`'s scope.
- Does not touch #84. Parked with Ori as a product decision.

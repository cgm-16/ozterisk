---
reads:
  - docs/design-system/components/hud/LanguageToggle.d.ts  # the prop contract
  - docs/journal/journal-2026-09-05.md  # T37's reading, and why this one is not settled
  - src/styles/tokens/elevation.css  # lines 21-39, the two-tone bezel and its measurements
  - src/components/ActionButton/ActionButton.module.css  # the house pattern for a variant edge
---

# T41 — Port the language toggle, and re-measure its focus ring

```yaml
task_id: T41
title: Give the segmented control the system's surfaces and a ring that clears gold
milestone: M5.5d — Board Surfaces
priority: P1
estimate: S
wave: W2
depends_on: [T38]
parallel_safe: true
paths:
  - src/components/LanguageToggle/
```

**Interfaces**

- Runs beside `T39` and `T40`; shares no file with either.
- Produces the last unported control surface in the app.

## Why

`LanguageToggle` is the one control `M5.5c` deliberately left alone: it is a
`role="group"` segmented control, not an `ActionButton`, so collapsing it into the
button primitive would have been wrong.

It is also the milestone's one **known live accessibility risk**, and the reason
this task exists as its own unit rather than a line in `T40`.

- [ ] **Step 1: Understand what T37 actually found before changing anything**

`T37` measured the toggle's focus indicator at **11.85:1** — gold on the surround
`#071711` — and it passes. But it passes *for a reason that this task is about to
remove*: the ring is the **global `:focus-visible` outline**, drawn **outside** the
border box, so its backdrop is the felt behind the control rather than the segment
itself.

Give it the inset bezel like every other control and the backdrop becomes the
**gold active segment**, where **D1 measured `1.51:1`** for gold-on-gold. That is
the original defect this whole milestone was opened to fix, and it is still live
on this one control.

The dark tone is what carries it — `--clay-900` measures `5.68:1` against the gold
segment per `elevation.css:29`, exactly as it carries the ceramic tile face.
`--ring-focus` already contains both tones, so the fix is to compose it correctly,
not to invent anything.

- [ ] **Step 2: Compose, do not replace**

Follow `ActionButton.module.css`: each variant names its own edge in a custom
property, and the `:focus-visible` rule composes `var(--ring-focus)` onto that
edge rather than overwriting it. The active and inactive segments are two
surfaces and want two edges.

Two traps, both already paid for once in this milestone:

- **`:focus-visible`, never `onFocus`/`onBlur`.** Handlers fire on click-focus and
  show a ring the spec withholds.
- **The global `:focus-visible` rule in `src/styles/global.css` draws an offset
  halo** and will tie your rule on specificity, winning on source order.
  `Tile.module.css` documents this exact collision — a focused reward tile drew the
  halo instead of its inset rim until the selector was raised to `.tile.reward`.
  Suppress the outer outline once the inset bezel is in place, and check rather
  than assume.

- [ ] **Step 3: Keep the semantics exactly as they are**

`role="group"` with `aria-label` from `language.groupLabel`, and `aria-pressed` on
**both** segments — `true` on the active one and `false` on the other.
`LanguageToggle.test.tsx:18-24` asserts both halves, and it is right to: a toggle
set that reports only its on-state leaves the off segment announcing as a plain
button. `M5.5c` had to restore exactly this on the rack after it was dropped.

The press offset stays `translateY(var(--press-offset))`, which the reduced-motion
block retires by zeroing the token.

- [ ] **Step 4: Measure it, do not assert it**

This task's gate is a number, not a passing test. Follow `T37`'s method — it is
recorded in `docs/journal/journal-2026-09-05.md` along with three ways the
measurement lied first:

- Reach the control with `Tab`; a clicked control does not match `:focus-visible`.
- Screenshot focused and unfocused, diff to find the band the indicator occupies,
  read the indicator's colour from the focused frame and the backdrop from the
  unfocused frame at the same coordinates.
- **Scan from outside the border box inward.** Cropping to the box is what made
  `T37` first report "no visible indicator" on this very control.
- Report **both tones separately** against **both segments**. An average is not a
  measurement, and the active segment is the one that matters.

- [ ] **Step 5: Commit**

```bash
git add src/components/ docs/tasks/T41-language-toggle.md
git commit -m "feat(language-toggle): port the segmented control and clear gold on gold" -m "Task: T41"
```

**Acceptance criteria**

- The focus indicator reaches `≥ 3:1` against the **gold active segment**, measured
  from pixels, reported per tone.
- The ring composes onto each segment's own edge rather than replacing it.
- Both segments still expose `aria-pressed`; the group keeps its role and label.
- Lint, typecheck, test and build all pass.

**What this task does not do**

- No change to language behaviour, persistence or detection — `§1.13` is settled
  and `src/i18n/` is not this task's.

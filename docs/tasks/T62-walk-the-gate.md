---
reads:
  - docs/journal/journal-2026-09-09.md  # the four measurement traps, and why the 320px reading is not yet evidence
  - docs/journal/journal-2026-08-12.md  # "Narrative is not evidence"
  - docs/checklists/quality.md  # §8.5
---

# T62 — Walk every gallery state against the bar, and settle #85

```yaml
task_id: T62
title: The exit gate, measured
milestone: M5.5g — Visual Verification
priority: P1
estimate: L
wave: W4
depends_on: [T58, T59, T60, T61]
parallel_safe: false
paths:
  - docs/journal/
```

**Interfaces**

- Runs last. Changes no `src/` file: a defect it finds is reported, and the
  owning task's implementer fixes it.
- This is the milestone's exit gate. `M5.5` closes on this task's readings.

## Why

`M5.5`'s gate is *"Every state the gallery renders passes a visual quality
bar"* and §8.5's is *no horizontal scroll at `320px`*. Both are measurements.
`journal-2026-08-12.md`: **"Narrative is not evidence."**

- [ ] **Step 1: #85, in a real top-level viewport — and not the way `T56` did it**

**This is the step most likely to be got wrong, and the way it fails is by
succeeding.** `T56` swept seven widths — `320`, `324`, `328`, `360`, `408`,
`412`, `416` — across title, both answering states, both feedback states, both
overflow states, both game-over states and the Korean title, and found **zero
overflowing elements and no horizontal scroll anywhere.** Those are the exact
widths #85 records as overflowing, under the scrollbar condition #85 names.

`T56` did not close #85 on that, and neither should this task until it has
measured differently. Two reasons the clean reading is not yet evidence:

- **`T56` measured in a fixed-width iframe**, because a window resize does not
  take on a backgrounded automation tab — `innerWidth` stayed `1920` after a
  resize to `320`. An iframe gives a real layout viewport and a scrollbar that
  takes layout width (`innerWidth 320`, `clientWidth 305`, so 15px), but
  **whether an iframe's scrollbar behaves as a top-level window's does is the
  open question**, and it is the whole question #85 turns on.
- The rack changed under it. #85 predates `M5.5d`'s ten fixed sockets, so the
  defect may simply be fixed. *May be* is not a reading.

So: a **real top-level window** at each width, foregrounded, with a classic
scrollbar taking layout width. If the harness cannot foreground a window, say
so and say what was measured instead — an unstated method is how the iframe
result nearly became a close.

Three outcomes, all acceptable, one required: #85 is fixed and closes with the
reading; or it reproduces and is fixed here; or it cannot be measured in a real
viewport from this harness, which is stated plainly and #85 stays open with the
reason. **What is not acceptable is closing it on an iframe.**

- [ ] **Step 2: The three moments that have never been measured at 320px**

`T58` gives `7b`, `7c` and `2d` a gallery surface for the first time. They are
the reason this step exists.

A ring's peak extent is **213×213 around a 64×80 tile** — at 320px that is two
thirds of the viewport — and the burst chips carry their own outward `--dx`.
Neither has ever been measured against §8.5, because until `T58` no reachable
state rendered them.

Measure **while they are in flight**, not at rest. `getBoundingClientRect`
taken after seeking reports the *seeked* box, which is what you want here and
must be labelled as a peak extent rather than a resting one.

- [ ] **Step 3: The gallery walk**

Every state, against the bar. `documentElement.scrollWidth` against
`clientWidth`, a sweep for any element whose right edge exceeds the viewport,
and the tray's accessible names — the method `journal-2026-08-12.md`
established.

**Amended during execution.** The root is the gallery's own `.stage`, not
`main`: `Gallery.tsx` renders every state into `.stage`, and the `interaction`
boards render no `<main>` at all — a sweep rooted at `main` measures **zero
elements** on those four and reports them clean. **Record the swept element
count per state and reject a count of zero**; a sweep over nothing is
indistinguishable from a sweep that found nothing. See
`journal-2026-09-12.md`, harness bug 1.

`T58`'s new states are the point: hover, focus-visible, disabled,
reduced-motion, `pendingDiscards`, a short rack, streak 5 and streak 8.

**Two readings inherited from other tasks, because this one owns the browser:**

- **The rack, after `T59`.** `T59` deletes the text badges, which makes #84's
  overlap criterion vacuous — nothing is left to overlap. What still needs
  measuring is what replaced them: that a reward tile is visibly distinct from
  a resting one, and that a reward cell and a plain cell occupy the same
  footprint, at `320`, `408` and `768`, in both locales. Read it **with the
  webfont blocked as well as loaded** — `@fontsource` ships `font-display:
  swap`, so the fallback face paints on every cold load, and that was the
  common case #84 turned on.
- **Hover reads as nothing, and that is the finding.** No component in `src/`
  declares a `:hover` rule, and the design system declares none either — the
  only `:hover` in the whole handover is on `<a>` elements in the documents'
  own chrome. So a hover reading identical to the resting reading is the system
  as designed, not a failed probe. Record it as a figure, not as a gap, and do
  not file it as a defect without saying that the design specifies no hover
  treatment.

- [ ] **Step 4: Reduced motion, per moment, both directions**

`T56` could not do this per moment and recorded why: it read four
representative properties and argued the rest from `global.css`'s single
`!important` sweep. **That argument is sound and it is still not a
measurement.** With `T58`'s fixtures in place, the per-moment reading is now
possible, and this is the phase whose criteria can be met as written.

Flip `rule.media.mediaText` between `'all'` and
`'(prefers-reduced-motion: reduce)'` and read computed durations. Do not touch
OS settings. **Both directions** — under `reduce` everything is neutralised by
`!important`, so a `reduce`-only reading cannot tell a wired animation from an
unwired one, and a component with no motion passes that half of the gate.

`11d`'s resting offset is a literal, not `--press-offset`, and **must survive
`reduce`** — `translateY(4px)` in both directions. "Not yet" reads as "not
raised" whatever the motion setting. Do not confuse it with a press.

- [ ] **Step 5: Traps, carried from `T37`, `T42`, `T49` and `T56`**

Each of these has cost a phase time already:

- **A backgrounded tab freezes `document.timeline`.** `currentTime` never
  advances and `playState` reads `"running"` forever, so neither field is
  evidence anything ran. **Seek each animation across its own span and read
  resolved style at each stop.**
- **A transitioning property returns its start value under that frozen clock.**
  Read the pair of resting targets with `* { transition: none !important }`.
- `getComputedStyle` is stale within one `evaluate` — re-read at every stop.
- `matches(':active')` is always false in an automated probe.
- `:focus-visible` survives a click on an already-focused element.
- Cropping a screenshot to the border box misses an outset outline, and an
  outset animation.
- The gallery stretches some controls to their container; check a figure
  against the real screen before believing it.
- jsdom substitutes no custom properties and expands no shorthand.
- **The two game-over copy states press Copy Result on mount.** `T58` drove
  them that way because `GameOverScreen` holds the share outcome in local
  state, and the alternative was drawing a stand-in. Under `StrictMode` the
  effect runs twice, so the press fires twice — idempotent, but a clipboard
  probe that counts writes will see two. The chop is a 900ms one-shot that has
  already played by the time the card is read at rest: seek it, do not wait for
  it.

- [ ] **Step 6: Journal it, and score the gate honestly**

Every reading with a figure. Every state that fails the bar, filed with an
issue number. And an explicit verdict on the exit gate: met, or missed and how.

`M5.5b` missed its gate in one part of four and **left the gate as written**,
because the gate was the standard and the phase fell short of it. `M5.5f` did
the same. That precedent is the house style and it outranks a clean scorecard.

**Acceptance criteria**

- #85 closed with a top-level-viewport reading, or reproduced and fixed, or
  stated as unmeasurable from this harness with the reason. Not closed on an
  iframe.
- `7b`, `7c` and `2d` measured at `320px` while in flight, with peak extents
  labelled as such.
- Every gallery state walked, in both locales, with a figure per state.
- The rack read at `320`, `408` and `768` in both locales, with the webfont
  blocked as well as loaded: a reward tile visibly distinct from a resting one,
  and a reward cell and a plain cell occupying the same footprint.
- Reduced motion read **per moment**, in **both** directions; `11d`'s resting
  offset survives both.
- An explicit gate verdict, and every failure carrying an issue number.
- No `src/` diff in this task's commits.

**What this task does not do**

- Does not fix what it finds. A defect is reported to the task that owns the
  file.
- Does not close #52 (the whole-UI umbrella). That closes with the milestone,
  and only if this task's verdict says the gate is met.

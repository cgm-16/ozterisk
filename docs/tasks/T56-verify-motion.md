---
reads:
  - docs/tasks/T49-verify-flow.md  # the precedent, and its measurement traps
  - docs/journal/journal-2026-08-09.md  # the reduced-motion method, and two silent-failure classes
  - docs/journal/journal-2026-09-07.md  # what M5.5e measured
---

# T56 — Walk the sixteen moments with measured evidence

```yaml
task_id: T56
title: Prove each moment plays, and prove the reduce setting stops all of them
milestone: M5.5f — Motion
priority: P1
estimate: M
wave: W4
depends_on: [T50, T51, T52, T53, T54, T55]
parallel_safe: false
paths:
  - docs/journal/
```

**Interfaces**

- Runs last. Changes no `src/` file: a defect it finds is reported, and the
  owning task's implementer fixes it.

## Why

`M5.5f`'s exit gate is *"Every moment in the §1.12 inventory implemented;
`prefers-reduced-motion` neutralises all of them."* Both clauses are
measurements. `docs/journal/journal-2026-08-12.md`: **"Narrative is not
evidence."**

This phase carries a specific hazard the previous four did not. Its entire
content is `animation:` declarations, and **an `animation:` naming a keyframe
the stylesheet does not define fails silently** — no error, no warning, no
motion, and a screenshot that looks exactly like a resting state. `T50` built a
static guard against the missing-name case. The guard cannot catch an animation
that resolves and still never plays: wrong element, zero-size node, a
`transform` on an inline element, an animation that fired before its element
was on screen.

- [x] **Step 1: The inventory, moment by moment**

Sixteen rows. For each: the element that carries it, the animation or
transition it resolves to, and evidence it **ran** — not that it was declared.

Three rows will not be a plain "plays":

- `10i` — deferred, #104. Record the reason beside it.
- `11a` — `T53` measured whether the existing transition already is the moment.
  Carry its reading, not its conclusion.
- `11d` — `T54` may have landed it as a transition rather than `oz-rise-ready`.
  If so, record that `oz-rise-ready` is defined and unused.

A row with prose beside it instead of a reading has not been verified.

- [x] **Step 2: Prove each one ran**

`getComputedStyle` gives you the declaration. Running is a different claim.
`getAnimations()` on the element (or on `document`) returns the live
animations with their `currentTime`, `playState` and effect timing — that is
the reading this step wants, taken while the moment is in flight.

**`getComputedStyle` is stale within a single `evaluate`** — re-read it. That
trap is recorded from `T37` and cost `T42` time again.

- [x] **Step 3: Reduced motion, in both directions**

Per `docs/journal/journal-2026-08-09.md`: flip `rule.media.mediaText` between
`'all'` and `'(prefers-reduced-motion: reduce)'` and read the computed
durations. Do not touch OS settings, and do not accept *"look at it and confirm
nothing happens"* as a criterion.

**Both directions, because one direction proves nothing here.** `global.css`
neutralises every animation and transition globally with `!important`, so a
reading taken only under `reduce` cannot tell a wired animation from an unwired
one — a component with no motion at all passes that half of the gate. `all`
proves the moment exists; `reduce` proves it is neutralised.

§1.12 requires press offsets to go too. `global.css` zeroes `--press-offset`
under `reduce` and its comment claims that retires every press in the app.
**Check that claim rather than trusting it** — this phase may have added a
resting offset to the disabled button state (`11d`), which is not a press and
must survive, and the two must not be confused.

- [x] **Step 4: `320px`, both locales, every phase**

§8.5 forbids horizontal scroll at `320px` and it outranks anything this phase
added. `documentElement.scrollWidth` against `clientWidth`, plus a sweep for
any element whose right edge exceeds the viewport.

**Motion is the new risk here.** A chip flying `--dx` to the right, a tile
tipping off the end, and a counter falling `38px` can each push the document
box while they are in flight — and a resting-state measurement cannot see any
of it. Measure **during** the moments, not only after them.

Issue #85 is the standing exception: wherever a classic scrollbar takes layout
width the rack's own arithmetic overflows at `320`/`324`/`328px` and again at
`408`/`412`/`416px`. That predates this branch and is `M5.5g`'s. The gate here
is that this phase did not move those readings, which is a measurement and not
an excuse.

- [x] **Step 5: Traps, recorded so you do not rediscover them**

From `T37`, `T42` and `T49`:

- `matches(':active')` is always false in an automated probe.
- `:focus-visible` survives a click on an already-focused element.
- Cropping a screenshot to the border box misses an outset outline — and an
  outset animation.
- `getComputedStyle` is stale within a single `evaluate`.
- The gallery stretches some controls to their container; check a figure
  against the real screen before believing it.

- [x] **Step 6: Journal it and commit**

Record the sixteen readings, the reduce figures in both directions, the `320px`
sweep, the traps hit, and every defect found but deliberately not fixed — with
the issue number it was filed under.

**Acceptance criteria**

- Sixteen rows, each with a reading or a recorded deferral, and every deferral
  carrying an issue number.
- Every moment measured while running, not only while declared.
- Reduced motion measured in **both** directions, per moment.
- No horizontal scroll at `320px` in either locale, in every phase, **while the
  moments are in flight**, on a viewport whose scrollbar takes no layout width;
  and #85's readings unmoved where it does.
- No `src/` diff in this commit.

**Three of those criteria were written stricter than this task's own scope**

Not a shortfall in the walk — a contradiction inside the task, worth naming so
the next verification phase does not inherit it. Each of the three needs a
fixture this task is explicitly forbidden from adding, four lines below.

| Criterion | What blocks it |
|---|---|
| every deferral carries an issue number | `2d`, `7b` and `7c` are recorded as not reached, under #105 rather than one issue each — #105 *is* the reason they are unreachable |
| reduced motion in both directions, **per moment** | read on four representative properties, not sixteen. `global.css` neutralises with one `!important` sweep, so the reading does not vary per moment — but that is an argument, not the per-moment measurement the criterion asks for |
| `320px` **while the moments are in flight** | swept in every reachable state; the three ring tiers and the burst are not among them, so their peak extents are unmeasured at `320px` |

A criterion that cannot be met without work the same task forbids is a defect
in the criterion. `M5.5g` owns the fixtures (#105) and the real-viewport walk
(#85); it is the phase that can satisfy these as written, and it should.

**What this task does not do**

- Does not fix #85, #94 or #95. All three are `M5.5g`'s.
- Does not add gallery entries. Hover, focus-visible, disabled and
  reduced-motion fixtures are `M5.5g`'s scope.
- Does not touch #84. Parked with Ori.

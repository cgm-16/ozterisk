---
reads:
  - docs/journal/journal-2026-09-09.md  # what could not be measured, and why
  - src/gallery/states.tsx  # the acceptance surface
  - src/test/fixtures.ts  # where the defaults that hid three defects live
---

# T58 — Make the gallery able to show what it is named for

```yaml
task_id: T58
title: Fix the three lying states and add the four the exit gate names
milestone: M5.5g — Visual Verification
priority: P1
estimate: M
wave: W2
depends_on: [T57]
parallel_safe: false
paths:
  - src/gallery/
  - src/test/fixtures.ts
```

**Interfaces**

- Owns `src/gallery/**` and `src/test/fixtures.ts` alone. `T59` and `T60` run
  alongside and touch neither.
- **Blocks `T62`.** The verification walk cannot measure a state the gallery
  cannot render, which is exactly how `M5.5f` ended with three unmeasured
  moments.

## Why

The gallery is this milestone's acceptance surface and the exit gate is *"every
state the gallery renders passes a visual quality bar."* **A state that renders
something other than its name cannot be assessed against that bar**, and three
of them do exactly that (#105). A fourth problem is the opposite: four states
the gate names have never existed at all.

`M5.5f` found all of this the hard way. Two of its sixteen moments had to be
measured by playing the game because no fixture could show them, and three
could not be measured at all.

- [ ] **Step 1: `game-over-copy-succeeded` renders `game-over-idle`**

`states.tsx:225` and `:230` pass **byte-identical arguments** — same state,
same dependencies, two names. The copied state is only reachable by clicking
Copy Result, so at rest the chop is absent and the status region empty
(measured: `chopFound: false`, `statusText: ""`).

Consequence: `11C`'s share chop has no gallery surface. It was measured by
clicking through and it is correct — `oz-chop`, 900ms, scales 1.46 → 1, holds,
fades, `aria-hidden` — so this is a fixture defect, not a component defect.
Do not "fix" `GameOverScreen`.

- [ ] **Step 2: `feedback-incorrect` shows empty answer slots**

`makeFeedbackState`'s default result carries `submittedTiles: []`
(`fixtures.ts:62`) and `FEEDBACK_INCORRECT_STATE` takes the default
(`states.tsx:96`). So the slots render as two empty sockets.

Since `M5.5e` mounted the answer slots through feedback, **the gallery has
never shown what an incorrect answer looks like**, and `9f` (crack + dust) is
invisible in it. Measured live instead: `oz-crack` ×2 and `oz-dust` ×2, both
520ms, both moving.

Changing a default in `fixtures.ts` reaches every test that uses it. Check what
else consumes `makeFeedbackState` before changing the default rather than the
one state — the smaller change may be the state, not the factory.

- [ ] **Step 3: No fixture reaches streak ≥ 5**

`FEEDBACK_CORRECT_STATE` carries `currentStreak: 1`. The ladder adds a jade
ring at 3, a second ring plus gold rim at 5, and a third ring plus the six-chip
`2d` burst at 8. So `7b`, `7c` and `2d` have **no gallery surface at all** —
the only three of the fifteen moments that went unmeasured.

This is the one that blocks `T62`: a ring's peak extent is **213×213 around a
64×80 tile**, which at 320px is two thirds of the viewport, and the burst chips
carry their own outward `--dx`. Neither has ever been measured against §8.5.

Reaching streak 8 needs one new fixture, not three — a single state at streak 8
renders the top tier, and the 5 tier needs its own because the tiers are
exclusive. Decide and record which.

- [ ] **Step 4: The four states the exit gate names**

`roadmap.md`'s `M5.5g` gate requires the gallery cover **hover,
focus-visible, disabled and reduced-motion**. None exists.

Three traps, all recorded from `T37`, `T42` and `T49`, and all of them make a
fixture that looks right prove nothing:

- `matches(':active')` is always false in an automated probe.
- `:focus-visible` survives a click on an already-focused element, so a
  click-driven fixture shows a ring the spec withholds.
- The gallery stretches some controls to their container, so a figure read off
  a gallery card can differ from the real screen.

A reduced-motion fixture is not a screenshot with nothing moving. `global.css`
neutralises every animation with `!important`, so **a component with no motion
at all passes a `reduce`-only reading**. The fixture must be readable in both
directions or it is not evidence.

- [ ] **Step 5: A fixture with `pendingDiscards` set**

`src/test/fixtures.ts` and `src/gallery/states.tsx` never set
`pendingDiscards`, and no state holds fewer than 8 tiles. Both gaps hid defects
this milestone: `.discardBadge` had only ever been rendered by jsdom, which
performs no layout, which is why #84 went unseen through a measurement pass.

`T59` deletes that badge, so this fixture is not there to show it — it is there
so the discard state has a visual surface at all, and so the next phase's
measurement pass has one.

**Acceptance criteria**

- No two gallery states render byte-identical arguments. Assert it, do not
  eyeball it — a test over the state table is cheap and this defect recurs.
- `feedback-incorrect` renders submitted tiles; `9f` is visible in the gallery.
- A state reaches streak 8 and one reaches streak 5; `7b`, `7c` and `2d` each
  have a surface.
- Hover, focus-visible, disabled and reduced-motion states exist and are
  readable in both motion directions.
- A state sets `pendingDiscards`, and one holds fewer than 8 tiles.
- No `src/components/` or `src/game/` diff. This task changes fixtures.
- Suite green; `lint`, `typecheck`, `build` green.

**What this task does not do**

- Does not fix #85, #94 or #95.
- Does not touch `GameOverScreen`, `FeedbackPanel` or `AnswerSlots`. Every
  defect here is in the fixture, not in the component it renders.
- Does not measure anything. `T62` walks these states; this task only makes
  them exist and be honest.

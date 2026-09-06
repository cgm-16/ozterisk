---
reads:
  - src/components/GameScreen/GameScreen.test.tsx  # the ordering and absence assertions
  - src/components/AnswerSlots/AnswerSlots.test.tsx  # the disabled-button assertions
  - docs/design-system/components/game/AnswerSlots.d.ts  # slot states
---

# T46 — Keep the answer slots on screen through feedback

```yaml
task_id: T46
title: Mount the answer slots through feedback without them being buttons
milestone: M5.5e — Flow Screens
priority: P1
estimate: M
wave: W1
depends_on: [T43]
parallel_safe: true
paths:
  - src/components/AnswerSlots/
  - src/components/GameScreen/
```

**Interfaces**

- Runs beside `T44`, `T45` and `T47`. You own `GameScreen.tsx`; `T45` owns the two
  panels it mounts. Do not edit `FeedbackPanel/` or `OverflowControls/`.

## Why

`M5.5e`'s exit gate says the answer slots stay mounted through feedback. The
reason is `M5.5f`: the bloom and the crack play **on the submitted tiles**, and a
component that unmounts at the moment of the verdict has nothing to animate. The
structure has to exist before the motion can.

Today `GameScreen.tsx` gates `<AnswerSlots>` on `state.phase === "answering"`, so
the slots vanish exactly when the result arrives.

- [ ] **Step 1: Understand the constraint before you write anything**

This is the single likeliest place in `M5.5e` for a passing implementation to be
wrong, because two assertions look contradictory and are not:

- The roadmap gate: slots stay mounted through feedback.
- `GameScreen.test.tsx:343`: in feedback, there is **no `button` whose accessible
  name matches `/Answer slot/`**.

Both hold only if the slots render in feedback **carrying no `button` role at
all**. Not a disabled button — a disabled button is still a button and
`queryByRole("button")` still finds it. That test is a behavioural assertion about
what a screen reader is offered, and it does not weaken.

`M5.5c` already built the lever. Its ruling on the `Tile` primitive: **`onClick`
present → `<button>` (disabled when the caller says so); `onClick` omitted → a
genuinely non-button element carrying no `button` role.** Use it. Do not invent a
second mechanism.

- [ ] **Step 2: `onReturn` becomes optional, and that is the read-only mode**

Make `AnswerSlots`' `onReturn` optional. Omitted means the whole group renders
non-interactively: the filled slots pass no `onClick` to `Tile`, and the empty
slot stops being a `<button>` too.

**`disabled` is a different thing and it stays.** `AnswerSlots.test.tsx:64`
asserts that `disabled: true` renders a filled slot that is still a `<button>`,
still disabled, and still blocks the callback. That is a pinned behavioural test.
Two modes, two meanings:

| Caller passes | Renders |
|---|---|
| `onReturn` + `disabled: false` | enabled buttons |
| `onReturn` + `disabled: true` | disabled buttons |
| no `onReturn` | no buttons at all |

The empty slot keeps its accessible name in every mode. `answerSlot.empty` and
`answerSlot.filled` are unchanged — `AnswerSlots.test.tsx:51`, `:81` and
`GameScreen.test.tsx:328` all pin those names in the `answering` phase.

- [ ] **Step 3: Mount them through feedback in `GameScreen`**

`answering` keeps today's interactive slots. `feedback` renders them read-only,
still showing the tiles that were submitted.

**Where the tiles come from matters.** In `feedback`, `state.selectedTiles` is
empty — the reducer cleared it. The submitted tiles are on
`state.lastResult.submittedTiles`. Read them from there, and check for yourself
that they survive into the phase you are rendering rather than assuming it.

Leave `overflow` and `gameOver` alone: the slots do not belong to those phases.

**Markup order does not move.** Three `compareDocumentPosition` assertions bind
this file — `GameScreen.test.tsx:306` (HUD → equation → Submit → inventory) and
the feedback and overflow ordering tests. The slots already sit between the
equation and the feedback panel; keep them there and every chain stays intact.
Reordering *visually* with CSS is fine; reordering markup is not.

- [ ] **Step 4: Give the read-only slot its own treatment**

A slot that cannot be pressed should not invite a press. It is the same tile face
without the affordance — no hover, no press offset, no focus ring, and no
`cursor: pointer`. Say what you changed and why.

Do not add the crack or the bloom. They are `M5.5f`'s.

- [ ] **Step 5: Test**

Add, do not replace:

- In `feedback`, the submitted digits are present on screen **and**
  `queryByRole("button", { name: /Answer slot/ })` finds nothing. Both in the same
  test, because either one alone passes for the wrong reason.
- `AnswerSlots` with no `onReturn` renders no button, and the empty slot keeps its
  accessible name.
- The three existing `disabled: true` / disabled-button assertions still pass
  untouched.

Sabotage-check the new mount: break the phase condition and confirm the new test
actually fails. A test that passes against a broken implementation is worse than
none.

- [ ] **Step 6: Commit**

```bash
git add src/components/AnswerSlots/ src/components/GameScreen/ docs/tasks/T46-slots-through-feedback.md
git commit -m "feat(board): keep the answer slots through feedback, without their buttons" -m "Task: T46"
```

**Acceptance criteria**

- The submitted tiles are visible in `feedback`; no `Answer slot` button exists there.
- `disabled: true` still renders a disabled button — that test is untouched.
- All three `compareDocumentPosition` chains pass; no markup reordering.
- Every pinned accessible name (`/^Answer slot \d: \d$/`, `Answer slot N: empty`)
  is unchanged.
- The new test was sabotage-verified.
- Lint, typecheck, test and build all pass.

**What this task does not do**

- No motion. Bloom (`2d`), crack (`8a`) and the rest are `M5.5f`'s, and
  `keyframes.css` is `M5.5f`'s file.
- No reducer change. `src/game/` and `src/hooks/` are not modified in this
  milestone, at all, for any reason. If the submitted tiles seem unreachable, they
  are on `lastResult` — look again before concluding otherwise.

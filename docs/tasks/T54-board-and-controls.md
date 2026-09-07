---
reads:
  - src/components/GameHud/GameHud.tsx  # the dl whose order three tests pin
  - src/components/EquationBoard/EquationBoard.tsx
  - src/components/ActionButton/ActionButton.module.css  # the transition already there
---

# T54 — The three moments that belong to the board and its controls

```yaml
task_id: T54
title: Wire 10b, 10e and 11d
milestone: M5.5f — Motion
priority: P1
estimate: M
wave: W2
depends_on: [T50]
parallel_safe: true
paths:
  - src/components/EquationBoard/
  - src/components/GameHud/
  - src/components/ActionButton/
```

**Interfaces**

- Three separate components, none of them touched by `T51`, `T52`, `T53` or
  `T55`. Does not touch `GameScreen.tsx`.
- Consumes `oz-round-rise`, `oz-counter-fall` and `oz-counter-zero`, all built
  since `M5.5b` and referenced nowhere.

- [ ] **Step 1: `10b` — the round change**

The arriving equation rises into place over `--dur-round`. `oz-round-rise`
carries the shape.

Only the rise is built; the design records `10b` as *"old equation falls, next
rises"* and ported the second half. Do not author the fall — `keyframes.css` is
`T50`'s file and the missing half is recorded, not forgotten.

An animation plays when an element mounts, and `EquationBoard` does not
remount between rounds. Something has to make the arriving equation a new
element — the equation's own identity is the honest key for that.

- [ ] **Step 2: `10e` — the streak breaks**

This one has a load-bearing constraint, quoted from the milestone plan
verbatim, because it is exactly the kind of line that gets paraphrased away:

> the falling counter must be a **sibling** of the fading-in zero, never its
> child, or the two opacities multiply and the fall is invisible for exactly
> the half of the duration that should read.

The old count falls off its perch over `--dur-break` while `0` fades in
beneath it. `GameHud` renders the current streak and nothing else, so it has
to remember the value it is replacing — the fall needs a number that is no
longer in state.

Fire it only on a break: a streak going `7 → 0`. A streak going `4 → 5` is not
this moment, and neither is the first render of a run.

**`GameHud` is a `<dl>` and three tests pin its order.** `App.test.tsx:119`
asserts Round → Score → Streak by `compareDocumentPosition`, and
`GameOverScreen.test.tsx:73` reads a computed font size off a `nextElementSibling`.
Adding a sibling *inside* the streak `<dd>` is fine; reordering the `<dt>`/`<dd>`
pairs is not. Verify, do not assume.

**Leave #94 alone.** The rounds emphasis winning only on source order is a real
defect in this file, it is filed, and it is `M5.5g`'s. Journal the temptation;
do not fix it in passing. `YOU MUST NEVER make code changes unrelated to your
current task.`

- [ ] **Step 3: `11d` — an action becomes available and rises to meet the hand**

`decisions.md`: *"Disabled means flat, not dim. No shadow at all, so 'not yet'
reads as 'not raised' — and the enable moment becomes a real event the button
can animate."*

`ActionButton.module.css` already transitions `transform` and `box-shadow` over
`--dur-press`, and `.button:disabled` already flattens the shadow to `none`.
**The likely shortest correct implementation is a resting offset on the
disabled state**, so enabling transitions the button up with no JavaScript at
all and no edge detection — which is the same shape `oz-rise-ready` describes.

Try that first. Measure whether it actually plays. If it does, `11d` is done in
two declarations and `oz-rise-ready` stays an unused keyframe — say so in your
report so `T56` can record it, and do not delete it: it is the design system's
vocabulary, and §1.12 permits the inventory, not our subset of it.

If the transition genuinely does not fire — verify, don't guess — fall back to
the keyframe and say what forced it.

- [ ] **Step 4: Test**

`getComputedStyle(el).animationName` resolves under `css: true`; durations and
appearance are `T56`'s. The testable logic here is the **gating**: the streak
fall fires on `7 → 0` and not on `4 → 5` nor on first render; the equation
carries the rise after a round change.

`11d`, if it lands as a transition, is a computed-style read rather than an
animation name — and comparing a disabled button's transform against an
enabled one's is a legitimate jsdom assertion, because it is cascade
resolution and not layout.

- [ ] **Step 5: Commit**

One commit per moment is fine here; three components, three independent
changes. Write each message to a file and pass it with `-F`.

**Acceptance criteria**

- A new round's equation rises; the same equation re-rendered does not.
- A broken streak drops the old count and fades a `0` in beneath it, as
  siblings. A rising streak does neither.
- An enabling button rises; a disabled one rests low and flat.
- `App.test.tsx:119` and `GameOverScreen.test.tsx:73` pass untouched.
- Suite green; lint, typecheck and build green.

**What this task does not do**

- Does not touch `keyframes.css`, `GameScreen.tsx`, `src/game/` or `src/hooks/`.
- Does not fix #94.

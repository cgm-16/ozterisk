---
reads:
  - docs/design-system/components/game/AnswerSlots.jsx  # where the design mounts bloom and crack
  - src/components/AnswerSlots/AnswerSlots.tsx  # M5.5e's read-only mode
  - src/components/GameScreen/GameScreen.tsx  # the two mount sites
---

# T51 — Make the submitted tiles bloom or crack, and let a selected tile arrive

```yaml
task_id: T51
title: Wire 2a, 9f and 9b onto the answer slots
milestone: M5.5f — Motion
priority: P1
estimate: M
wave: W2
depends_on: [T50]
parallel_safe: true
paths:
  - src/components/AnswerSlots/
  - src/components/GameScreen/GameScreen.tsx
```

**Interfaces**

- `T52` edits the same component afterwards, for the streak ladder. Leave the
  per-slot structure you build here in a shape a ring and six chips can be
  added to without rewriting it — the design's own `AnswerSlots.jsx` nests all
  three inside one per-slot wrapper.
- Consumes `oz-bloom`, `oz-crack`, `oz-dust` and `oz-slot-arrive` from `T50`.
- `GameScreen.tsx` is touched only to pass the new prop. `T53`, `T54` and `T55`
  do not touch it.

## Why

`M5.5e` mounted the answer slots through `feedback` so the verdict could land
on the tiles the player submitted. Nothing lands on them yet: `oz-bloom` and
`oz-crack` have existed since `M5.5b` and are referenced nowhere.

- [ ] **Step 1: AnswerSlots has to be told the verdict**

`GameScreen.tsx` renders the same `<AnswerSlots>` for both branches of
`feedback` and passes no outcome, so the component cannot know whether to bloom
or crack. Add the prop. `answering` passes nothing — the tiles are neither yet.

Name it for what it is rather than for the animation it triggers; a later phase
may want the same distinction for something that is not motion.

- [ ] **Step 2: `2a` — the correct answer**

The submitted tiles rise `14px` and settle, once, over `--dur-bloom` on
`--ease-settle`. `oz-bloom` already carries the shape.

- [ ] **Step 3: `9f` — the wrong answer**

The tiles fracture where they sit and dust away over `--dur-crack`. `oz-dust`
is a **second element**, not a second animation on the tile: it scales and
fades independently, so it needs its own node behind the tile.

`decisions.md` is explicit that this shakes on one axis only and never fades on
opacity alone — `oz-crack` already encodes both. Do not add opacity to it.

- [ ] **Step 4: `9b` — a tile arriving in a slot**

Over `--dur-select`, flat, using `oz-slot-arrive`. This fires in `answering`,
on every selection, and it is the most frequent motion in the app: §1.12
budgets what happens every round as the fastest and quietest thing there is.

**It must not re-fire on every render.** A slot whose tile has not changed
plays nothing. Keying the animation to the tile's identity rather than to the
slot's index is the cheap way to get that from React itself.

- [ ] **Step 5: Where the declaration lives**

Prefer a wrapper element carrying a module class over an inline
`style={{ animation: … }}` string on `Tile`. `Tile` accepts `style` and the
design system uses it, but a module class keeps the declaration greppable,
keeps it beside the rest of this component's CSS, and keeps the reduced-motion
story identical to everything else in `src/`.

- [ ] **Step 6: Test what jsdom can actually decide**

`getComputedStyle(el).animationName` resolves under `css: true` — it is cascade
resolution, not layout, so it is a real assertion. **That it ran, how long it
took, and what it looked like are not testable here** and belong to `T56`'s
measured walk.

Assert that the element which should carry each animation carries it, in both
branches, and that `answering` carries neither. Do not assert a duration read
back from a token; that tests the stylesheet against itself.

**Every existing assertion stands unweakened.** `GameScreen.test.tsx:343`
requires no `Answer slot` **button** in `feedback`; `AnswerSlots.test.tsx`
pins `/^Answer slot \d: \d$/` and the empty socket's disabled-button role. A
wrapper element changes none of that — verify rather than assume.

- [ ] **Step 7: Commit**

Write the message to a file and pass it with `-F`.

**Acceptance criteria**

- Correct feedback blooms the submitted tiles; incorrect cracks them and dusts
  them; `answering` does neither.
- Selecting a tile arrives it in its slot; re-rendering the same slot with the
  same tile does not re-fire.
- The dust is its own element.
- Every pinned accessible name and role assertion still passes untouched.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` green.

**What this task does not do**

- No rings, no burst, no streak gating. That is `T52`, on this same file, after
  this lands.
- Does not modify `src/game/` or `src/hooks/`.
- Does not touch `keyframes.css`. If a keyframe you need is missing or wrong,
  **report it** rather than editing that file — it is `T50`'s, and a second
  writer is how this phase gets a conflict.

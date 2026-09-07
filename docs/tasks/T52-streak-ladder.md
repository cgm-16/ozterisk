---
reads:
  - docs/design-system/components/game/AnswerSlots.prompt.md  # the ladder, stated as accumulation
  - docs/design-system/components/game/AnswerSlots.jsx  # ring and chip markup
  - src/styles/tokens/keyframes.css  # oz-ring and oz-fan, both already built
---

# T52 — Build the streak ladder onto the bloom

```yaml
task_id: T52
title: Wire 7a, 7b, 7c and 2d, gated on the streak the answer just earned
milestone: M5.5f — Motion
priority: P2
estimate: M
wave: W3
depends_on: [T51]
parallel_safe: false
paths:
  - src/components/AnswerSlots/
  - src/components/GameScreen/GameScreen.tsx
```

**Interfaces**

- Runs after `T51`, on the same files. Not parallel-safe with it.
- Consumes `oz-ring` and `oz-fan`, both built since `M5.5b` and referenced
  nowhere.

## Why

Four of the sixteen moments are one mechanism: a ladder that **accumulates** on
the correct-answer bloom. `AnswerSlots.prompt.md` states it plainly — streak 3
adds the jade ring, streak 5 adds a second gold ring plus a gold rim on the
answer tiles, streak 8 adds a third ring and the six-chip burst. **Streak 1–2
bloom with nothing added: the bloom is the floor, not the ring.**

Accumulates means a streak of 8 shows all three rings, not only the third.

- [ ] **Step 1: The gate**

The ladder reads the streak the answer just earned. `SUBMIT_CORRECT` increments
`currentStreak` before `feedback` renders, so `state.currentStreak` during
feedback already counts the round on screen — verify that against the reducer
rather than trusting this sentence.

Nothing on this ladder plays on an incorrect answer.

| Streak | Added |
|---|---|
| 3 | one jade ring |
| 5 | a second ring, gold, and a gold rim on the answer tiles |
| 8 | a third ring, brightest rim, and the `2d` six-chip burst |

`decisions.md` records the second and third rings as `oz-ring` re-used at
`70ms` and `140ms` delay. That is the whole of `7b` and `7c` besides their
colour and the rim.

- [ ] **Step 2: `2d` — the only moment in this phase that needs new markup**

`oz-fan` interpolates a trajectory each chip supplies itself: `--dx`, `--peak`,
`--land` and `--rot`. Six chip elements have to exist, each with its own four
values and its own delay; the design staggers them `40 + index × 12` ms.

**The chips are made of the tile, not added to it.** `keyframes.css` says so
and `decisions.md` explains why: they carry ceramic clay, never gold. A gold
chip would read as a reward pip breaking off.

Every chip is decorative — `aria-hidden`, and nothing a screen reader can
reach. The same goes for the rings.

- [ ] **Step 3: The rim is state, not motion**

Streak 5's gold rim and streak 8's brightest rim are static treatments that
appear with the tier. They are part of the moment's specification; they are not
animated, and they do not need a keyframe.

- [ ] **Step 4: Test the gate, not the pixels**

jsdom can decide **how many ring elements render at a given streak** and
whether the chips exist at streak 8 and not at 7. That is the whole of this
task's logic, and it is genuinely testable. Cover the boundaries — 2/3, 4/5,
7/8 — because an off-by-one in a `>=` is exactly the defect this ladder invites.

Do not assert colours or delays read back from tokens.

- [ ] **Step 5: Commit**

Write the message to a file and pass it with `-F`.

**Acceptance criteria**

- The ladder accumulates: streak 8 shows three rings, streak 5 shows two,
  streak 3 shows one, streak 2 shows none.
- The burst renders six chips, each with its own trajectory and delay, only at
  streak 8 and above, only on a correct answer.
- Rings and chips are hidden from the accessibility tree.
- Boundary tests at 2/3, 4/5 and 7/8 pass.
- Suite green; lint, typecheck and build green.

**What this task does not do**

- Does not touch `keyframes.css`. `oz-ring` and `oz-fan` are already built and
  correct; if one is not, **report it** rather than editing `T50`'s file.
- Does not modify `src/game/` or `src/hooks/`.
- **Does not chase the overflow path.** On a correct answer that pushes the
  rack past ten, the run goes straight to `overflow` and these slots never
  mount, so none of this plays. That is ruled on in the milestone record (#93)
  and is not a defect to fix here.

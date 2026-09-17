---
reads:
  - docs/design-system/components/flow/FeedbackPanel.prompt.md  # border-only colour, reward caption
  - docs/design-system/components/flow/OverflowControls.prompt.md  # the perched tile
  - docs/spec/ui-i18n.md  # §1.12, which outranks both of the above
---

# T45 — Dress the verdict and the discard prompt

```yaml
task_id: T45
title: Give the feedback panel its border and the overflow prompt its weight
milestone: M5.5e — Flow Screens
priority: P1
estimate: S
wave: W1
depends_on: [T43]
parallel_safe: true
paths:
  - src/components/FeedbackPanel/
  - src/components/OverflowControls/
```

**Interfaces**

- Runs beside `T44`, `T46` and `T47`; shares no file with any of them. Both
  components are mounted by `GameScreen`, which `T46` edits — do not edit
  `GameScreen.tsx` here.

## Why

Both panels are the game speaking to the player at the two moments it has
something to say, and both currently render as unstyled stacks of text.

- [ ] **Step 1: The verdict is carried by a border, not a wash**

`FeedbackPanel.prompt.md`: *"The border is the only colour... No filled
background, no full-screen wash."* That part is adopted as written and it agrees
with §1.12's "Semantic colour appears only at the moment of the event and only on
the object concerned. There is no full-screen colour wash."

**One part of the design is overruled.** The prompt says *"gold for correct,
vermilion for incorrect"*. §1.12 assigns one meaning per hue: **jade means
correct; gold marks brand, capacity, and reward**. §1.12 opens with "Where a
design document and this section disagree, this section wins." So the correct
border is `--state-correct`, not `--accent`. The reward *tiles* inside the panel
stay gold, because reward is gold's own meaning — that is the distinction the hue
rule exists to preserve.

Record this deviation in the commit message. It is the design document being
wrong about the spec, not a preference.

- [ ] **Step 2: Keep the colour reinforcing, never carrying**

The headline text already states the outcome in words. The existing
`:has(.rewards)` / `:has(.comparison)` rules colour it, and their comment records
that they key off branch-specific elements and will silently stop applying if
`FeedbackPanel.tsx` stops rendering one. **That comment is still true and must
stay true.** If you restructure the branches, either keep those hooks or replace
the mechanism with one that cannot fail silently — a prop-driven class is the
obvious answer. Do not leave the `:has()` selectors pointing at elements that no
longer exist; a CSS Modules key that does not match renders nothing and reports
no error.

- [ ] **Step 3: The reward tiles keep their caption, and it gets measured**

`FeedbackPanel.prompt.md`: *"Unlabelled tiles sitting under `CORRECT` read as a
restatement of the answer you just gave; they are arrivals, and the panel has to
say so."* The caption stays.

`.rewardBadge` is `--state-reward` (gold) on the felt, below the tile rather than
over it. **Measure it and record the figure.** It is `11px` uppercase body text,
so it owes `4.5:1`, not `3:1`. Gold on felt has cleared that comfortably in
earlier measurements — confirm, do not assume, and if the panel's new background
changes what sits behind the caption, measure against whatever it actually is.

This badge is **not** the one in issue #84. That issue is about the rack's badges
overlapping the engraved digit, it is a product decision parked with Ori, and it
is out of scope here. Do not change whether this caption exists.

- [ ] **Step 4: The discard prompt reads as the one destructive moment**

`OverflowControls` is "the only moment the game asks you to destroy something you
own", and today it is a bare `<p>`. Give the instruction the weight that says so —
type and space, with vermilion used only if §1.12's rule that colour never carries
meaning alone is satisfied by the text beside it.

**`perchedTile` is ruled out, and here is why.** The design wants the arriving tile
drawn rotated and lifted, never seated. That tile is not derivable from state:
`SUBMIT_CORRECT` builds `sortTiles([...inventory, ...newRewardTiles])`, so all
`N+1` reward tiles arrive together and merge into sorted order. `rewardTileIds`
identifies the arrivals as a set; nothing identifies *which one did not fit*,
because none of them individually did. Deriving one would mean picking arbitrarily
and drawing a lie. `src/game/` is not this milestone's to change.

The "does not fit" read is already carried structurally: `M5.5d` made the rack ten
fixed sockets with `cellCount = Math.max(INVENTORY_CAPACITY, tiles.length)`, so
the eleventh tile starts a third row outside the rack's `5 × 2`, and the capacity
meter draws its eleventh pip past the rail in `--state-discard`. Record this as a
deviation from the design in the commit message; do not silently drop it.

- [ ] **Step 5: The confirm button stays conditional**

`OverflowControls.tsx` renders `Confirm Discard` only at `requiredCount > 1`, and
its comment explains why: Endless overflows by exactly one, and marking the only
tile that can go is the whole decision. `getOverflowCount` therefore never exceeds
one in this product. **Do not "restore" the button.** Do not remove the comment.

- [ ] **Step 6: Test**

- The panel stays mounted with `role="status"` across the overflow → feedback
  transition. `GameScreen.test.tsx` already asserts this; do not break it.
- The correct branch renders a jade border and the incorrect branch a vermilion
  one, asserted through whatever mechanism Step 2 settles on. Do not assert a
  computed colour through a `:has()` selector if you replaced it.
- The reward caption is present for each reward tile.

Behavioural claims owe jsdom tests. **Appearance does not:** jsdom performs no
layout, so any assertion about a rendered dimension, `scrollWidth`, or font metric
cannot fail there and is worse than no test. Measure those against pixels and put
the figure in the commit message.

- [ ] **Step 7: Commit**

```bash
git add src/components/FeedbackPanel/ src/components/OverflowControls/ docs/tasks/T45-round-flow-panels.md
git commit -m "feat(flow): give the verdict a border and the discard its weight" -m "Task: T45"
```

**Acceptance criteria**

- No filled background or wash on either panel; the verdict's colour is a border.
- Correct is jade, not gold, and the commit message says why the design was
  overruled.
- The reward caption carries a measured contrast figure against what is actually
  behind it.
- The two deviations from the design — the hue swap and the dropped perched tile —
  are both stated in the commit message.
- `role="status"` intact; the feedback region stays mounted across overflow.
- Lint, typecheck, test and build all pass.

**What this task does not do**

- No bloom, crack, or discard motion. Refs `2d`, `8a`, `11a`/`8c` are `M5.5f`'s.
- No change to `GameScreen.tsx`. `T46` owns it.
- Nothing about the rack's badges. That is #84, parked with Ori.

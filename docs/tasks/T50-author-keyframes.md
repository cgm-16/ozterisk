---
reads:
  - docs/design-system/decisions.md  # the sixteen-moment inventory and the retiming trap
  - docs/design-system/ozterisk Storyboard.dc.html  # the shapes, on a 2.6s loop
  - src/styles/tokens/keyframes.css  # the ten already built
  - src/styles/tokens/motion.css  # every duration and easing already assigned
---

# T50 — Author the keyframes the inventory still owes, and guard the whole set

```yaml
task_id: T50
title: Land every remaining keyframe in one file, before anything wires one
milestone: M5.5f — Motion
priority: P1
estimate: M
wave: W1
depends_on: []
parallel_safe: false
paths:
  - src/styles/tokens/keyframes.css
  - src/styles/
```

**Interfaces**

- Every wiring task consumes this file. It runs alone and first: five tasks
  editing one stylesheet in parallel is a merge conflict by construction.
- Adds no `animation:` declaration to any component. A keyframe with no
  consumer yet is not dead code here — it is the next wave's contract.

## Why

`src/styles/tokens/keyframes.css` defines ten of the inventory's moments and
**not one of them is referenced anywhere in `src/`.** `M5.5b` landed the
vocabulary; `M5.5f` is the phase that speaks it. Before the wiring fans out,
the vocabulary has to be complete, because a wiring task that has to author its
own keyframe is a wiring task editing this shared file.

Four moments are recorded `specified` rather than `built`, and one more turns
out to need a keyframe our architecture did not anticipate.

- [ ] **Step 1: Port the four specified shapes this phase builds**

Their shapes exist in `docs/design-system/ozterisk Storyboard.dc.html` as
`sb-rim`, `sb-slide`, `sb-stamp` and `sb-settle`.

| Moment | Storyboard shape | Duration token the consumer will use |
|---|---|---|
| `8a` overflow rim-reject | `sb-rim` | `--dur-select` |
| `8c` discard confirm, the tile tips off the end | `sb-slide` | `--dur-select` |
| `11C` title entrance | `sb-settle` | `--dur-entrance` |
| `11C` share chop | `sb-stamp` | `--dur-share` |

**The retiming trap, recorded in `M5.5a`'s `F1` and still live.** Every canvas
frame runs `2.6s infinite` and holds at both ends — `sb-rim` does nothing until
`8%` and nothing after `60%`. Copying its percentages into a `--dur-select`
animation gives a moment that is idle for two thirds of its own duration.
**Renormalise each shape to 0–100% of its useful range**, then let the duration
token set the speed. Do not merely shorten the duration.

`10i` (`sb-sweep`) is **not** ported — see the milestone rulings. `11a`
(`sb-drop`) is not ported either: `Tile`'s `marked` state already lifts and
tilts, and `Tile.module.css:21` already transitions `transform` over
`--dur-select`, so the moment is built as a transition. `T53` verifies that
reading rather than adding an animation over it.

- [ ] **Step 2: `9b` needs a keyframe in this codebase, and that is not an amendment**

`decisions.md` records `9b` as *"built — transition, not a keyframe"*, because
the design's tile travels from rack to slot. **Ours does not travel.** `M5.5d`
made the rack ten fixed sockets and a selected tile keeps its socket
(`TileInventory.tsx`'s `liftedIds`); the tile in the answer slot is a
**separate element that mounts**. A transition on a mounting element does
nothing, so `9b` is currently unbuilt here despite what the table says.

Author `oz-slot-arrive`: a flat arrival over `--dur-select` on `--ease-settle`.
Flat is the specification — `9b` is the one per-selection moment, and §1.12
budgets what happens every round as the quietest thing in the app. No vertical
bounce, no scale; this is not a small bloom.

§1.12 already permits the assignment: *"A moment whose duration and easing are
not yet assigned … gets them assigned by the milestone that implements it, and
that assignment is not an amendment."* The moment, its duration and its easing
are unchanged. Record the divergence from the table in a comment on the
keyframe, naming the architectural reason.

- [ ] **Step 3: The guard that makes this phase's silent failure loud**

`docs/journal/journal-2026-08-09.md` records it: **an `animation:` naming a
keyframe the stylesheet does not define fails silently.** No error, no warning,
no motion. This phase's entire content is `animation:` declarations, so that is
its single highest-risk failure mode, and `M5.5e`'s `GameOverScreen.module.css`
already carries a comment written to steer around it.

Write one test that parses the `@keyframes` names out of
`src/styles/tokens/keyframes.css`, collects every animation name used across
`src/`, and asserts the second set is a subset of the first. One test, the whole
class, and it fails loudly if a later phase renames a keyframe out from under a
consumer.

It reads files rather than rendering, so jsdom's lack of layout does not touch
it — this is a legitimate test, unlike an assertion about a rendered dimension.
Write it so it passes today, when nothing is wired, and starts protecting the
moment the next wave lands. Put it beside the stylesheet it guards rather than
inside a component's folder; it belongs to no component.

- [ ] **Step 4: Commit**

Write the message to a file and pass it with `-F`. Backticks in `git commit -m`
get shell-substituted, which has bitten this milestone twice.

**Acceptance criteria**

- Every ported shape is renormalised to its own useful range, and the comment
  above it names the storyboard shape it came from.
- No keyframe hardcodes a duration; speed comes from the consumer's token.
- The subset guard exists and passes. Verify it can fail: break one animation
  name, watch the test fail, put it back.
- **No `src/components/` diff.** This task wires nothing.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` all green.

**What this task does not do**

- Does not port `10i` or `11a`. See the milestone rulings.
- Does not touch `motion.css`. Every duration and easing this phase needs is
  already assigned there.
- Does not modify `src/game/` or `src/hooks/`.

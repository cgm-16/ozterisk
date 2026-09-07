---
reads:
  - src/components/TileInventory/TileInventory.tsx  # ten fixed sockets, and the eleventh cell
  - src/components/Tile/Tile.module.css  # the marked state's lift and tilt, already transitioned
  - docs/design-system/components/game/TileInventory.jsx  # where the design mounts oz-fire
---

# T53 — Give the rack its four moments

```yaml
task_id: T53
title: Wire 9i and 8a, build 8c's exit, and verify 11a is already built
milestone: M5.5f — Motion
priority: P1
estimate: M
wave: W2
depends_on: [T50]
parallel_safe: true
paths:
  - src/components/TileInventory/
```

**Interfaces**

- Owns `TileInventory` alone. `T51`, `T54` and `T55` touch neither this
  component nor its stylesheet.
- Consumes `oz-fire` (built) and `oz-rim-reject` / `oz-tip-off` (`T50`'s ports
  of `sb-rim` and `sb-slide` — use whatever names `T50` gave them).
- Does not touch `GameScreen.tsx`. Everything here is derivable from props the
  component already receives.

## Why

Four of the sixteen moments belong to the rack, and the rack is the one surface
mounted in every game phase — which makes it the only place two of them can
play at all.

- [ ] **Step 1: `9i` — the reward tiles fire in place**

`oz-fire` over `--dur-reward` on `--ease-snap`, on the tiles carrying
`isNew`. It never travels: the tile is already in its sorted position and fires
where it sits.

**This is why `9i` is here and not on `FeedbackPanel`.** The design mounts it on
`TileInventory.jsx:66`, and the consequence matters: the rack is mounted in
`overflow` as well as `feedback`, so the reward fires on **both** paths a
correct answer can take. See the milestone ruling on #93 — the slot-bound
moments have no surface on the overflow path, but this one does.

Verify it plays **once**, on arrival, and does not replay when the player
toggles a discard or the phase changes. React reuses the DOM node across
re-renders, so a stable key is what buys that; confirm rather than assume.

- [ ] **Step 2: `8a` — the eleventh tile rim-rejects**

`TileInventory` renders `Math.max(INVENTORY_CAPACITY, tiles.length)` cells, so
**cell index 10 exists only while the rack overflows.** That cell is the
moment's home.

The storyboard calls it *"the eleventh tile"*, and `M5.5e` ruled that no
per-tile identity for it exists — `SUBMIT_CORRECT` merges every reward tile
through `sortTiles`, so nothing marks which one did not fit, and `perchedTile`
stays dropped. **The ruling for this phase: `8a` is positional.** The eleventh
*cell* rim-rejects, whatever tile sorts into it. No `src/game/` change, and no
claim about which tile it is.

`sb-rim` drops in from above, catches the rim and settles tilted at the edge.
Whether the eleventh cell should also *look* like a perch on the rail rather
than the first cell of a third grid row is a CSS question this task may answer
— but only if it can be done without moving the ten sockets.

- [ ] **Step 3: `8c` — the marked tile tips off the end**

A tile that leaves state unmounts, and CSS cannot animate an unmounted node. So
this one needs the departing tile held on screen for the length of its own exit.

**Remove it on `animationend`, not on a timer.** A timer is a second source of
truth for a duration the stylesheet already owns, and under
`prefers-reduced-motion` the global `0.01ms` rule still fires `animationend` —
so the same code path retires the tile instantly with no branch.

Keep the mechanism inside this component. It is presentational: the reducer has
already dropped the tile, and nothing outside the rack needs to know one is
still being drawn.

- [ ] **Step 4: `11a` — verify, then write down what you found**

`11a` is *"tap a resident, it lifts out and tilts."* `Tile`'s `marked` state
already lifts and tilts, and `Tile.module.css:21` already transitions
`transform` over `--dur-select` on `--ease-settle`. **The moment looks
already-built as a transition.**

Confirm that by measurement, not by reading: mark a tile and read
`getComputedStyle` on the transition property and on the resulting transform.
If it holds, `11a` needs no code and the finding is the deliverable — record it
in the task file and hand it to `T56`. If it does not hold, say exactly which
half is missing.

**Do not add an animation on top of a working transition.** The lazy answer and
the correct answer are the same answer here.

- [ ] **Step 5: Test**

`getComputedStyle(el).animationName` resolves under `css: true` and is a real
assertion; durations, distances and appearance are `T56`'s to measure in a
browser.

Worth a test: the departing tile is still in the document immediately after
confirm and gone after its `animationend`; the eleventh cell carries the
rim-reject and the first ten do not; an `isNew` tile carries the fire and a
resident does not.

`TileInventory.test.tsx` and `GameScreen.test.tsx` pin `/^Digit \d$/`,
`/New tile$/`, the discard label composition, and the socket-not-button rule
for lifted cells. **A held departing tile must not add a button a test can
find, and must not be announced** — it has already left the game. Give it no
role and hide it.

- [ ] **Step 6: Commit**

Write the message to a file and pass it with `-F`.

**Acceptance criteria**

- The reward tiles fire once, in place, on both the `feedback` and the
  `overflow` path.
- The eleventh cell rim-rejects; the ten sockets do not move.
- A confirmed discard tips off the end and is removed on `animationend`, with
  no timer anywhere.
- `11a` is measured and the reading is recorded, whichever way it went.
- The departing tile carries no role and no accessible name.
- Suite green; lint, typecheck and build green.

**What this task does not do**

- Does not implement `10i`. The game-over sweep is deferred — see the milestone
  ruling and its issue.
- Does not touch `keyframes.css`, `src/game/` or `src/hooks/`.
- Does not touch #84 (badges over the engraved digit). Parked with Ori.

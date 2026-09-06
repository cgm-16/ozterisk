---
reads:
  - docs/design-system/components/game/TileInventory.d.ts  # the prop contract
  - docs/design-system/decisions.md  # "the one layout shift this screen cannot afford"
  - docs/spec/ui-i18n.md  # §1.12 rack sizing, the three tiers
  - src/styles/tokens/spacing.css  # the tier tokens already exist
---

# T38 — Make the rack ten fixed sockets

```yaml
task_id: T38
title: Render ten sockets in a 5x2 grid and stop the rack reflowing on select
milestone: M5.5d — Board Surfaces
priority: P1
estimate: M
wave: W1
depends_on: [T37]
parallel_safe: false
paths:
  - src/components/TileInventory/
  - src/components/GameScreen/
```

**Interfaces**

- Produces: the socket vocabulary `T39` reuses for the answer slots — an empty
  socket is one shape, drawn one way, in one place.
- Produces: `liftedIds`, and the `GameScreen` derivation that feeds it.
- Serial ahead of `T39`–`T41`. They may run in parallel with each other once this
  lands.

## Why

Two defects, and the second is the milestone's headline.

The rack is `display: flex; flex-wrap: wrap` over however many tiles are held, so
it shrinks as tiles are lost. §1.12 says the opposite: *"The inventory rack is ten
fixed sockets in a `5 × 2` grid at every breakpoint. The grid never resizes as
tiles are lost, because the empty sockets are the score."*

And selecting a tile removes it from the rack, so the remaining tiles slide left.
`decisions.md` calls this *"the one layout shift this screen cannot afford"* — you
are asked to compare digits while they move.

- [x] **Step 1: Ten cells, always**

The grid is `--rack-columns` (5) × `--rack-rows` (2), and it renders `--capacity`
(10) cells whether ten tiles are held or one. An empty cell is a socket: it is the
score, not an absence.

All three tiers already exist in `src/styles/tokens/spacing.css` and need no new
values — `52 × 64` at `8px` gap, `66 × 64` at `12px` from `408px`, `64 × 80` from
`48rem`. Consume them; do not redefine them.

**Mid-overflow the rack holds eleven.** `INVENTORY_CAPACITY` is 10 and
`REWARD_BONUS` is 1, so `state.inventory` reaches 11 for exactly as long as it
takes to confirm a discard. **Ruling:** the grid keeps five columns and lets rows
grow, so an eleventh tile lands alone on a third row. Ten sockets still render,
which is what the gate asks. The design's own answer is the perched tile on
`OverflowControls` (`perchedTile` in its `.d.ts`) — that belongs to `M5.5e`, and
this task must not pre-empt it.

- [x] **Step 2: Add `liftedIds`, and derive it in `GameScreen`**

A tile sitting in an answer slot keeps its cell, drawn as an empty socket wearing
`--outline-socket-lifted` (a dashed gold rule at `--outline-socket-lifted-offset`).
`elevation.css` explains the choice: dashed already means *"something belongs here
and does not yet"* on the empty answer slot, so the lifted socket says it in the
same words rather than just louder gold.

**`src/game/` is not modified.** `SELECT_TILE`, `RETURN_TILE` and
`CLEAR_SELECTION` all preserve the union `inventory ∪ selectedTiles`
(`gameReducer.ts:35-56,160-168`), so the rack is derived presentationally in
`GameScreen`:

```tsx
tiles={sortTiles([...state.inventory, ...state.selectedTiles])}
liftedIds={state.selectedTiles.map((tile) => tile.id)}
```

`sortTiles` is already exported from `src/game/factories.ts:25`. Import it; do not
write a second one.

`src/game/gameReducer.test.ts` is 892 lines and must not change. If you find
yourself editing a reducer, stop — the derivation is the whole point.

- [x] **Step 3: Keep every pinned name and the ordering**

`/^Digit \d$/` and `/New tile$/` are regex-pinned. `GameScreen.test.tsx:306` pins
HUD → equation → Submit → inventory by `compareDocumentPosition`; reordering
visually with CSS `order` or grid placement is fine, reordering markup is not.

A lifted socket is **not** a tile and must not answer to `/^Digit \d$/` — the tile
it holds is in the answer slots and already carries its own name there. Two
elements with the same accessible name for one tile is a defect, and
`src/gallery/states.test.tsx:29` counts on the arithmetic.

- [x] **Step 4: Test the invariants that matter**

- The rack renders ten cells at one tile held and at ten.
- Selecting a tile does not change the number of cells, and does not move any
  other tile's cell.
- A lifted cell exposes no `Digit` name.
- Eleven tiles render eleven cells.

- [x] **Step 5: Commit**

```bash
git add src/components/ docs/tasks/T38-rack-sockets.md
git commit -m "feat(inventory): make the rack ten fixed sockets" -m "Task: T38"
```

**Acceptance criteria**

- Ten sockets at every tier, at every fill level.
- Selecting a tile leaves every other tile's position unchanged.
- Zero diff under `src/game/`.
- Every pinned accessible name and markup ordering intact.
- Lint, typecheck, test and build all pass.

**What this task does not do**

- No motion. The lift and settle are `M5.5f`'s.
- No `CapacityMeter` — `T40`.
- No overflow perched tile — `M5.5e`.

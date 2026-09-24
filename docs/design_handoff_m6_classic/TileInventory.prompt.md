`TileInventory` is the rack — use it as the single source of "what the player owns". In Endless it always draws ten sockets, so never conditionally shrink the grid yourself; in Classic pass `stepped` and `capacity` and it steps the tile size itself.

```jsx
<TileInventory tiles={state.inventory} mode="select" onTile={(id) => dispatch({ type: "SELECT_TILE", tileId: id })} />
<TileInventory tiles={state.inventory} mode="discard" pendingDiscards={state.pendingDiscards} onTile={toggleDiscard} />
<TileInventory tiles={state.inventory} mode="readOnly" />
<TileInventory tiles={state.inventory} stepped capacity={state.capacity} reseatFrom={justChangedTier ? prev : undefined} />
```

- `rewardHalo` should be true only for rounds 1-2 of a run; after that the halo is noise.
- During overflow the array can hold 11+ tiles; the eleventh is drawn by `OverflowControls` on the rail, not here.
- A lifted socket wears `--outline-socket-lifted` (dashed gold, inset 3px) over the ordinary `--rim-socket`; a gone one wears the rim alone. Do not collapse the two: "out on loan" and "lost" are the only two things the rack can say. Dashed is deliberate — it is the empty-answer-slot vocabulary, reused because it already means "something belongs here and does not yet".
- Pass `liftedIds` for tiles sitting in the answer slots — do **not** remove them from `tiles`. Removing them compacts the rack on every tap, which is the one layout shift this screen cannot afford. Tiles leave `tiles` only when the round resolves.
- **Classic (`stepped`)**: 7 × 44 at 16–20, 6 × 48 at 11–15, 5 × 64 at ≤10 (thresholds pending device playtest). Every tier ~180px, never scrolls. Cells past `capacity` are sealed plugs — the rack is always a full rectangle and the plug count is the descent.
- Change tier only at the round change, together with the re-sort, and pass `reseatFrom` for that one render. Never mid-feedback under a seal.
- The house plug (20 in 7 columns leaves one) seals once at run start (M6·0); animate it from the caller with `oz-seal` at 240ms.
- Reduced motion: omit `reseatFrom` — the jump cut is the reduced path, and it is correct.

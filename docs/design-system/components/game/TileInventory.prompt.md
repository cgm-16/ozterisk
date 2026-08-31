`TileInventory` is the rack — use it as the single source of "what the player owns". It always draws ten sockets, so never conditionally shrink the grid yourself.

```jsx
<TileInventory tiles={state.inventory} mode="select" onTile={(id) => dispatch({ type: "SELECT_TILE", tileId: id })} />
<TileInventory tiles={state.inventory} mode="discard" pendingDiscards={state.pendingDiscards} onTile={toggleDiscard} />
<TileInventory tiles={state.inventory} mode="readOnly" />
```

- `rewardHalo` should be true only for rounds 1-2 of a run; after that the halo is noise.
- During overflow the array can hold 11+ tiles; the eleventh is drawn by `OverflowControls` on the rail, not here.
- A lifted socket wears `--rim-socket-lifted`, a gone one `--rim-socket`. Do not collapse the two: "out on loan" and "lost" are the only two things the rack can say.
- Pass `liftedIds` for tiles sitting in the answer slots — do **not** remove them from `tiles`. Removing them compacts the rack on every tap, which is the one layout shift this screen cannot afford. Tiles leave `tiles` only when the round resolves.

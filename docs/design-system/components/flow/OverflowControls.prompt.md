`OverflowControls` runs the discard. Pair it with `<TileInventory mode="discard">` — this panel owns the instruction, the count and the confirm; the rack owns the marking.

```jsx
<OverflowControls requiredCount={1} markedCount={state.pendingDiscards.length} perchedTile={arriving} onConfirm={confirmDiscard} labels={{ instruction: messages.overflow.instruction, confirm: messages.action.confirmDiscard }} />
```

- The perched tile is rotated and lifted — it must never look seated. That "will not sit flat" read is the whole point of the state.
- Confirm stays flat (disabled) until `markedCount === requiredCount`.

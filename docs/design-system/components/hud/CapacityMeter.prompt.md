`CapacityMeter` gives the player a standing read on overflow risk. Put it in the HUD, left-aligned, never centred.

```jsx
<CapacityMeter held={state.inventory.length} />
<CapacityMeter held={11} label="용량" />
```

- Ten pips always, like the rack: the shape of the meter is the shape of the constraint. Overflow appends the excess as vermilion pips past a gap, so `11 / 10` is visible and not merely stated.
- No near-capacity tint. Vermilion means a tile is leaving; tinting the last two pips made the margin read as a prediction about the answer in progress.
- Pips are the system's stand-in for icons; do not swap them for a bar or a number alone.

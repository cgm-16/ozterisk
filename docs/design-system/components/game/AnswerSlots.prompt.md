`AnswerSlots` renders the answer under construction. The slot count comes from the equation's product, never from user choice.

```jsx
<AnswerSlots slotCount={2} selectedTiles={state.selectedTiles} onReturn={returnTile} />
<AnswerSlots slotCount={2} selectedTiles={result.submittedTiles} state="incorrect" disabled />
```

- The empty slot's **dashed** gold rim is the only dashed border in the system. Keep it: dashed means "something belongs here and does not yet".
- Reserve the slot's width even when nothing is entered, so the equation never re-centres between frames.
- Keep this mounted through feedback with `state` set from the result and `disabled` — the correct-answer bloom and the wrong-answer crack both play on the submitted tiles, and there is nowhere for them to play if the slots unmount on submit.
- Pass `streak` so the jade ring fires from 3, where the streak ladder's first rung is. The ring is not a floor effect on every correct answer — a reward you have seen since your first answer is not a reward.
- `state="incorrect"` runs `oz-crack` + a dust puff. Never express it as an opacity or saturation change alone; that is the one thing the tile spec forbids.
- The streak ladder is owned here and **accumulates**: streak 3 adds the jade ring, 5 adds a second gold ring plus a gold rim on the answer tiles, 8 adds a third ring and the six-chip `oz-fan` burst. Streak 1–2 bloom with nothing added — the bloom is the floor, not the ring.
- The burst chips are ceramic (`--clay-050` → `--clay-400`), never gold. The ceiling of the ladder is the tile shedding its own material, not confetti dropped on the table.

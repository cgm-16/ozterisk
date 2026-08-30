Use `Tile` for any digit the player owns, spends, or is shown — never hand-roll tile markup, because the elevation rules (hard ceramic edge + soft contact shadow) are easy to get wrong.

```jsx
<Tile digit={7} onClick={() => select(tile.id)} />
<Tile digit={4} state="reward" label="New tile" />
<Tile digit={7} state="marked" label="Marked for discard" />
<Tile digit={2} size="sm" state="disabled" />
```

- `state="lifted"` is the hover/picked-up look; `"marked"` is the destructive discard selection (ring + lift + rotation, three cues on purpose).
- `"reward"` halo is for the first two rounds of a run only — after that, pass `"resting"`.
- Never use opacity for hover. Never blur the bottom edge; that edge is the tile's thickness.

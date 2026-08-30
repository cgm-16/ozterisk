`GameScreen` is the composed play surface — use it as the shape of the arena, and drive it from the reducer's `GameState`.

```jsx
<GameScreen state={state} language={language} onSelectTile={(id) => dispatch({ type: "SELECT_TILE", tileId: id })} onSubmit={submit} onNextRound={nextRound} labels={messages} />
```

- The vertical order **HUD → equation → answer slots → rack → actions** is fixed. Do not reorder or conditionally hide the rack; its ten sockets are always present.
- Phase drives everything: `answering` shows slots + Submit/Clear, `feedback` shows the verdict + Next Round, `overflow` swaps the rack to discard mode.

`GameHud` sits at the very top of the arena, above the equation. The order round → score → streak is fixed.

```jsx
<GameHud round={state.round} score={state.score} currentStreak={state.currentStreak} />
```

- Streak turns gold above zero — it is the only HUD value that changes colour.
- On a streak break the counter falls off its perch (`--dur-break`) and 0 fades in beneath. Nothing else in the HUD moves.
- The falling clone must be a **sibling** of the fading-in value, not a child of it. Nested, the two animations' opacities multiply and the fall is invisible for the first half of the duration — the moment the animation exists for.

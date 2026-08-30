`EquationBoard` shows the current equation. Always uses `×` (U+00D7) and the display serif.

```jsx
<EquationBoard equation={state.equation} />
<EquationBoard equation={state.equation} showProduct />
```

- `showProduct` is for **game over only**. During play the answer slots complete the equation with what the player submitted — the bloom on a hit, the crack on a miss — and printing the product beside them states two different answers at once. The verdict panel is where the real number is stated.
- On a round change this element falls out and the next rises in over `--dur-round` (180ms).

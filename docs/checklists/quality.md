# Quality Checklists

Master checklists §8.1–§8.5. The release checklist (§8.6) and Definition of
Done (§9) live in `docs/checklists/release.md`.

### 8.1 Specification lock

- [ ] Equation pool is 45 unordered pairs from `1..9`.
- [ ] Pair sampling and display-order randomization are separate.
- [ ] Rewards are uniform digits `0..9`.
- [ ] Initial inventory is exactly one of each digit.
- [ ] Capacity is exactly 10.
- [ ] Answer slot count is canonical decimal product length.
- [ ] Correct consumes `N`, rewards `N+1`, and scores exactly 1.
- [ ] Incorrect consumes `N`, rewards nothing, and resets streak.
- [ ] Every equation has one attempt.
- [ ] Exact-answer constructibility is not a loss condition.
- [ ] Overflow requires exact manual discard.
- [ ] Loss uses only tile count versus newly drawn slot count.
- [ ] Game over retains the terminal equation.
- [ ] Total rounds excludes the terminal unsubmitted equation.
- [ ] Play Again bypasses title.

### 8.2 Architecture lock

- [ ] Reducer is pure and deterministic.
- [ ] Randomness and IDs are injected.
- [ ] Domain utilities import neither React nor browser APIs.
- [ ] State contains canonical data only.
- [ ] Invalid actions are reducer no-ops.
- [ ] Language state is independent of game state.
- [ ] Only language uses storage.
- [ ] Share/copy browser APIs are injected in tests.
- [ ] No backend or external state library exists.

### 8.3 Interaction acceptance

- [ ] Mouse/touch selects and returns tiles.
- [ ] Duplicate click selects the exact tile.
- [ ] Digit key selects the first sorted matching tile.
- [ ] Backspace returns the latest selected tile.
- [ ] Enter is correct in answering/overflow/feedback/game over.
- [ ] Disabled keyboard actions are no-ops.
- [ ] Correct feedback and new rewards remain visible.
- [ ] Incorrect feedback reveals submitted and correct values.
- [ ] Overflow selection is reversible.
- [ ] Language switches live without resetting the run.

### 8.4 Quality acceptance

- [ ] Unit tests cover all legal reducer transitions.
- [ ] Representative invalid transitions return identical state.
- [ ] Generator boundary values are tested.
- [ ] Component tests cover all requested interaction slices.
- [ ] No Playwright dependency or test exists.
- [ ] Lint passes with zero warnings.
- [ ] Typecheck passes.
- [ ] Production build passes.
- [ ] No console error appears in normal flows.

### 8.5 Accessibility and responsive acceptance

- [ ] Semantic buttons for all actions/tiles/slots.
- [ ] Logical focus order follows visual hierarchy.
- [ ] Visible focus on every control, at `3:1` or better against every surface the
      indicator can appear on, including the ceramic tile face.
- [ ] Status feedback is announced.
- [ ] State does not rely only on color.
- [ ] Minimum target size is 44px.
- [ ] No horizontal scroll at 320px.
- [ ] Korean copy does not clip.
- [ ] Reduced motion is respected.

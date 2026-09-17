---
reads:
  - docs/superpowers/specs/2026-08-09-endless-mode-polish-design.md  # §3.2 Clear
  - docs/spec/product.md  # §1.4 selection, §1.11 keyboard contract
  - docs/spec/ui-i18n.md  # §1.10 layout order, §1.12 accessibility
  - docs/tasks/T19-motion-tokens.md  # tokens used by the affordance
---

# T18 — Clear selection

```yaml
task_id: T18
title: Add a visible Clear action and make per-tile return discoverable
milestone: M4 — Endless Polish and Tuning Surface
priority: P1
estimate: S
wave: W2
depends_on: [T17, T19]
parallel_safe: false
paths:
  - src/game/types.ts
  - src/game/gameReducer.ts
  - src/game/gameReducer.test.ts
  - src/components/GameScreen/GameScreen.tsx
  - src/components/GameScreen/GameScreen.module.css
  - src/components/GameScreen/GameScreen.test.tsx
  - src/components/AnswerSlots/AnswerSlots.module.css
  - src/hooks/useGameKeyboard.ts
  - src/i18n/messages.ts
```

**Interfaces**

- Consumes: `sortTiles` from `game/factories`; `--press-offset`,
  `--duration-base`, `--ease-standard` from T19.
- Produces: `{ type: "CLEAR_SELECTION" }` in the `GameAction` union.

## Why

Per-tile undo already works on both input paths — `Backspace`, and clicking
a filled slot returns that tile (`AnswerSlots.tsx:31`). Neither has any
on-screen affordance, so the gap is **discoverability, not capability**. A
player has no way to learn either exists.

Depends on T17 and T19 only to avoid conflicts: T17 edits the same two files
(`GameScreen.tsx`, `useGameKeyboard.ts`), and the affordance uses T19's
tokens.

- [ ] **Step 1: Write the failing reducer tests**

Add a `CLEAR_SELECTION` describe block to `src/game/gameReducer.test.ts`:

```ts
it("returns every selected tile to a sorted inventory", () => {
  const state = makeAnsweringState(makeEquation(4, 5), {
    inventory: [makeTile(1, "a")],
    selectedTiles: [makeTile(3, "b"), makeTile(0, "c")],
  });

  const next = gameReducer(state, { type: "CLEAR_SELECTION" });

  expect(next.selectedTiles).toEqual([]);
  expect(next.inventory.map((tile) => tile.digit)).toEqual([0, 1, 3]);
});

it("is a no-op when nothing is selected", () => {
  const state = makeAnsweringState(makeEquation(4, 5));
  expect(gameReducer(state, { type: "CLEAR_SELECTION" })).toBe(state);
});

it("is a no-op outside answering", () => {
  const state = { ...makeAnsweringState(makeEquation(4, 5)), phase: "feedback" as const };
  expect(gameReducer(state, { type: "CLEAR_SELECTION" })).toBe(state);
});
```

Note the no-op cases assert **referential identity** (`toBe`), matching how
the existing reducer suite proves a guard rejected an action.

- [ ] **Step 2: Verify they fail**

```bash
npm test -- src/game/gameReducer.test.ts
```

- [ ] **Step 3: Add the action and the reducer case**

Add `| { type: "CLEAR_SELECTION" }` to the `GameAction` union in
`src/game/types.ts`, then:

```ts
case "CLEAR_SELECTION": {
  if (state.phase !== "answering") return state;
  if (state.selectedTiles.length === 0) return state;
  return {
    ...state,
    inventory: sortTiles([...state.inventory, ...state.selectedTiles]),
    selectedTiles: [],
  };
}
```

One atomic action rather than a UI loop over `RETURN_TILE`, reusing the
existing `sortTiles` (`factories.ts:26`).

- [ ] **Step 4: Add the Clear button**

Beside Submit in `GameScreen.tsx`, rendered only in `answering` and disabled
when nothing is selected:

```tsx
<button
  type="button"
  className={styles.secondaryAction}
  onClick={() => dispatch({ type: "CLEAR_SELECTION" })}
  disabled={state.selectedTiles.length === 0}
>
  {t("action.clear")}
</button>
```

Style `.secondaryAction` in `GameScreen.module.css` as a lower-emphasis
sibling of `.action`, keeping the 44px `--tile-size` minimum target.

- [ ] **Step 5: Bind Escape**

In the `answering` branch of `useGameKeyboard`, alongside `Backspace`:

```ts
if (event.key === "Escape") {
  if (state.selectedTiles.length === 0) return;
  event.preventDefault();
  dispatch({ type: "CLEAR_SELECTION" });
  return;
}
```

- [ ] **Step 6: Add the filled-slot affordance**

In `AnswerSlots.module.css`. A *filled* slot gets `cursor: pointer`, and on
`:hover` / `:focus-visible` a `--color-accent` border with a subtle
`--color-surface` background shift, transitioning over
`--duration-base var(--ease-standard)`; `:active` uses `--press-offset`.
Empty slots keep their dashed border and stay inert — they are already
`disabled`.

Use a border and background change, **not** a `::after` "×" glyph. CSS
generated content is exposed to the accessibility tree in some browsers, and
the slot already carries a full `aria-label` (`AnswerSlots.tsx:21-23`);
a glyph risks announcing punctuation over a good label.

- [ ] **Step 7: Add the copy**

In `src/i18n/messages.ts`, both trees:

- `action.clear` — `"Clear"` / `"지우기"`
- extend `howToPlay.keyboard` to name `Escape` alongside Backspace and
  Enter, in both languages.

`ko` is typed against the `en` tree, so a missing key fails `typecheck`.

- [ ] **Step 8: Add the component tests**

In `GameScreen.test.tsx`: Clear is disabled at zero selection and enabled
once a tile is chosen; clicking it dispatches `CLEAR_SELECTION`; `Escape`
dispatches it; `Escape` at zero selection dispatches nothing.

- [ ] **Step 9: Verify**

```bash
npm test && npm run typecheck && npm run lint && npm run build
```

- [ ] **Step 10: Commit**

```bash
git add src/game/types.ts src/game/gameReducer.ts src/game/gameReducer.test.ts \
        src/components/GameScreen/ src/components/AnswerSlots/AnswerSlots.module.css \
        src/hooks/useGameKeyboard.ts src/i18n/messages.ts
git commit -m "feat(answering): add a visible Clear action and slot affordance" -m "Task: T18"
```

**Acceptance criteria**

- Clearing is reachable by mouse, touch, and keyboard.
- A filled slot visibly signals that clicking returns the tile.
- Both no-op guards return the identical state object.
- No new i18n key is missing from `ko`.

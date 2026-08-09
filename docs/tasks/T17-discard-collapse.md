---
reads:
  - docs/superpowers/specs/2026-08-09-endless-mode-polish-design.md  # §3.1 discard collapse and keyboard gap
  - docs/spec/product.md  # §1.7 overflow, §1.11 keyboard contract
  - docs/spec/ui-i18n.md  # §1.10 layout order, §1.12 accessibility
---

# T17 — Discard collapse and overflow keyboard access

```yaml
task_id: T17
title: Complete a forced single-tile discard in one action, and make overflow keyboard-drivable
milestone: M4 — Endless Polish and Tuning Surface
priority: P0
estimate: M
wave: W1
depends_on: []
parallel_safe: true
paths:
  - src/components/GameScreen/GameScreen.tsx
  - src/components/GameScreen/GameScreen.test.tsx
  - src/components/OverflowControls/OverflowControls.tsx
  - src/hooks/useGameKeyboard.ts
  - src/app/App.test.tsx
```

**Interfaces**

- Consumes: `getOverflowCount`, `isDiscardReady` from `game/selectors`.
- Produces: no new exports. `CONFIRM_DISCARD` and its `Enter` handler are
  **retained** — Classic's multi-tile discards need them.

## Why

At capacity every correct answer overflows by exactly `+1`, so the overflow
phase fires on nearly every correct round with `requiredCount === 1`. That
forced single choice currently costs three actions: mark the tile, click
Confirm, press Enter. The frequency cannot be reduced — it follows directly
from the `N+1` reward — so the fix is interaction cost.

Separately, `useGameKeyboard.ts:53-60` handles only `Enter` during overflow.
A keyboard-only player cannot choose *which* tile to discard without
reaching for a mouse.

- [ ] **Step 1: Write the StrictMode test first**

This is the only genuinely uncertain thing in the build. Commit `bd5d523`
records this repo already being bitten by StrictMode double-invocation, and
two dispatches from one handler is exactly that shape. `GameScreen.test.tsx`
does not currently import `StrictMode` — add it.

```tsx
it("completes a forced single-tile discard in one tap under StrictMode", async () => {
  const user = userEvent.setup();
  const state = makeOverflowState(makeEquation(3, 3)); // 11 tiles -> required 1
  const dispatch = vi.fn();
  render(
    <StrictMode>
      <I18nProvider initialLanguage="en">
        <GameScreen state={state} dispatch={dispatch} onSubmit={vi.fn()} onNextRound={vi.fn()} />
      </I18nProvider>
    </StrictMode>,
  );

  await user.click(screen.getByRole("button", { name: "Digit 0" }));

  expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
    "TOGGLE_DISCARD",
    "CONFIRM_DISCARD",
  ]);
});
```

**Escape hatch if this misbehaves:** a single reducer action that marks and
confirms atomically. Considered and rejected only because the two-dispatch
version is the smaller change — do not re-derive it, just switch.

- [ ] **Step 2: Verify it fails**

```bash
npm test -- src/components/GameScreen/GameScreen.test.tsx
```

Expected: FAIL — only `TOGGLE_DISCARD` is dispatched.

- [ ] **Step 3: Collapse the confirm in `GameScreen.tsx`**

In the `onTile` handler's overflow branch:

```tsx
if (state.phase === "overflow") {
  dispatch({ type: "TOGGLE_DISCARD", tileId });
  // A forced single-tile discard needs no confirmation step: marking the
  // only tile that can go is the whole decision. Dispatched from the click
  // handler and never from an effect, so rendering an already-marked state
  // still requires user action.
  if (getOverflowCount(state.inventory) === 1) dispatch({ type: "CONFIRM_DISCARD" });
}
```

Keep this a **UI** decision. The reducer already owns both validated
transitions and needs no new action.

- [ ] **Step 4: Hide Confirm at a forced single discard**

`OverflowControls` keeps its instruction paragraph always, and renders the
Confirm button only when `requiredCount > 1`. The multi-tile case still
needs it, and only Classic will produce one.

- [ ] **Step 5: Add digit keys to the overflow branch**

In `useGameKeyboard.ts`, mirroring the `answering` branch at lines 26-35.
Import `getOverflowCount`.

```ts
if (DIGIT_KEY_PATTERN.test(event.key)) {
  const required = getOverflowCount(state.inventory);
  if (state.pendingDiscards.length >= required) return;
  const digit = Number(event.key) as Digit;
  // Skip tiles already marked, so repeated presses walk through duplicates
  // instead of toggling one tile on and off.
  const tile = state.inventory.find(
    (item) => item.digit === digit && !state.pendingDiscards.includes(item.id),
  );
  if (!tile) return;
  event.preventDefault();
  dispatch({ type: "TOGGLE_DISCARD", tileId: tile.id });
  if (required === 1) dispatch({ type: "CONFIRM_DISCARD" });
  return;
}
```

The existing `Enter` handling stays exactly as it is.

- [ ] **Step 6: Update the tests the collapse invalidates**

`makeOverflowState` (`GameScreen.test.tsx:30`) builds 11 tiles, so **every**
existing overflow test runs at `requiredCount === 1` — precisely where
Confirm disappears.

| Location | Action |
|---|---|
| `GameScreen.test.tsx:237` "dispatches CONFIRM_DISCARD exactly once with Confirm Discard focused" | Give it a **12-tile** state so it keeps covering the multi-tile Confirm path |
| `GameScreen.test.tsx:310` "renders … Confirm Discard in overflow" | Same — 12-tile state |
| `App.test.tsx:135-143` | Flow becomes click-tile-only; drop the Confirm button assertions |
| `App.test.tsx:174` | Remove the Confirm click; the tile click completes it |
| `App.test.tsx:323-324` | Same; the "CONFIRM_DISCARD draws no randomness" call count still holds |

Do **not** touch these — they must stay green as-is:

- `GameScreen.test.tsx:135`, `:145` — Enter confirm and short-count, both
  keyboard-driven against a retained handler.
- `GameScreen.test.tsx:327` — status region mounted across the transition.
- `GameScreen.test.tsx:358` "does not auto-confirm discard merely from
  reaching the exact required count". **This is the guard that rules out a
  naive `useEffect` implementation.** It asserts no dispatch *on render*,
  and the collapse is click-driven, so it stays green. Do not weaken it.

- [ ] **Step 7: Add the remaining new tests**

- a 12-tile overflow state still renders Confirm and does not auto-complete;
- a digit key marks a tile during overflow;
- a digit key at `requiredCount === 1` completes the discard in one
  keystroke;
- repeated presses of the same digit walk through duplicate tiles rather
  than toggling one.

- [ ] **Step 8: Verify**

```bash
npm test && npm run typecheck && npm run lint && npm run build
```

- [ ] **Step 9: Commit**

```bash
git add src/components/GameScreen/GameScreen.tsx src/components/GameScreen/GameScreen.test.tsx \
        src/components/OverflowControls/OverflowControls.tsx src/hooks/useGameKeyboard.ts \
        src/app/App.test.tsx
git commit -m "feat(overflow): complete a forced single discard in one action" -m "Task: T17"
```

**Acceptance criteria**

- A forced single-tile discard costs exactly one tap or one keystroke.
- The behaviour survives `React.StrictMode`, proven by a test.
- Overflow is fully drivable from the keyboard, including *which* tile.
- Multi-tile discards still require explicit confirmation.
- `GameScreen.test.tsx:358` passes unmodified.

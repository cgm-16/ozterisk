---
reads:
  - docs/spec/product.md  # §1.10 screen phases, §1.11 keyboard contract
  - docs/spec/architecture.md  # §2.3 pure interfaces, §2.5 reducer invariants
---

# T10 — Game screen orchestration and keyboard controls

```yaml
task_id: T10
title: Connect phase UI and keyboard interactions
milestone: M2 — Playable Bilingual PoC
priority: P0
estimate: L
wave: W5
depends_on: [T05, T09]
parallel_safe: true
paths: [src/components/GameScreen/**, src/hooks/useGameKeyboard.ts]
```

**Interfaces**

```ts
interface GameScreenProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  onSubmit(): void;
  onNextRound(): void;
}
```

- Consumes: reducer state/actions, derived selectors, game primitives.
- Produces: answering/feedback/overflow view and context-sensitive keyboard hook.

- [ ] **Step 1: Write failing interaction tests**

Use `userEvent` to cover:

1. clicking duplicate digits dispatches the exact clicked ID;
2. digit key chooses the first matching sorted inventory tile;
3. filled slots reject additional digits;
4. Backspace returns the most recent selected tile;
5. Enter submits only when ready;
6. Enter confirms overflow only at exact selection;
7. Enter advances from feedback;
8. disabled shortcuts dispatch nothing;
9. intentional incorrect selection can be submitted.

- [ ] **Step 2: Verify failure**

```bash
npm test -- src/components/GameScreen/GameScreen.test.tsx
```

- [ ] **Step 3: Implement keyboard hook**

Attach one `keydown` listener while game screen is mounted. Ignore modified shortcuts (`metaKey`, `ctrlKey`, `altKey`) and repeated `Enter`. Call `preventDefault()` only when a valid game action is actually handled.

- [ ] **Step 4: Implement phase composition**

- `answering`: interactive slots/inventory and Submit.
- `feedback`: read-only inventory, feedback, Next Round.
- `overflow`: discard-mode inventory, feedback, exact Confirm Discard.
- Never auto-advance after feedback or discard.

- [ ] **Step 5: Verify**

```bash
npm test -- src/components/GameScreen/GameScreen.test.tsx
npm run typecheck
npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/components/GameScreen src/hooks
git commit -m "feat: connect phase and keyboard interactions" -m "Task: T10"
```

**Acceptance criteria**

- Keyboard behavior matches §1.11 exactly.
- Hook dispatches semantic events; it does not mutate state.

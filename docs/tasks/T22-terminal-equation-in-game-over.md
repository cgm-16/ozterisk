---
reads:
  - docs/spec/product.md  # §1.8 the terminal equation stays on screen
  - docs/spec/ui-i18n.md  # §1.10 layout order, landmark structure
  - docs/spec/architecture.md  # §2.1 canonical file map
---

# T22 — Move the terminal equation inside the game-over screen

```yaml
task_id: T22
title: Give GameOverScreen the terminal equation so game over is one renderable component
milestone: M5 — States Gallery
priority: P1
estimate: S
wave: W1
depends_on: []
parallel_safe: false
paths:
  - src/components/GameOverScreen/GameOverScreen.tsx
  - src/components/GameOverScreen/GameOverScreen.module.css
  - src/components/GameOverScreen/GameOverScreen.test.tsx
  - src/app/App.tsx
  - src/app/App.module.css
  - src/app/App.test.tsx
```

**Interfaces**

- Produces: `GameOverScreenProps` gains a required `equation: Equation`.
  T24's gallery entry renders `GameOverScreen` directly with a fixture
  equation.

## Why

`gameOver` is not a component today — it is inline JSX in `App.tsx:106-125`
composing `EquationBoard`, a reason `<p>`, and `GameOverScreen`, styled by
`.gameOverArena` / `.reason` in `App.module.css`. The gallery cannot render
that state without duplicating the composition, which would defeat the
anti-drift work T21 just did.

Two facts decided the shape, both read from the CSS:

1. `.gameOverArena` (`App.module.css:15-20`) is `flex / column / center /
   gap: var(--space-4)` — **byte-for-byte the layout of `.screen`**
   (`GameOverScreen.module.css:1-10`). It exists only because the equation
   sits outside `<main>`. Fold the equation in and the rule deletes itself.
2. The equation currently sits outside any landmark. That is issue #31 item
   3, and it is free here and awkward anywhere else.

So there is no new component: `GameOverScreen` takes the equation and owns
the whole state. Ori chose this over the separate `GameOverArena` wrapper the
M5 plan originally specified.

## The spacing constraint that must survive

`App.module.css:22-24` carries a deliberate decision:

> Sits between the terminal equation and the results block. The arena gap
> above it is smaller than GameOverScreen's top padding below it, so it reads
> as a caption on the equation rather than as the first result.

A naive fold puts equation, reason, and `<h1>` as three siblings under
`.screen`'s uniform `gap: var(--space-4)`, which flattens that relationship —
the reason would read as the first result. **Group the equation and reason in
an inner wrapper with a tighter gap**, so `.screen`'s gap separates the group
from the title while the reason stays visually attached to the equation
above it.

- [ ] **Step 1: Write the failing test**

In `src/components/GameOverScreen/GameOverScreen.test.tsx`, add a test
asserting the equation and the reason render inside the `main` landmark:

```ts
it("renders the terminal equation and its reason inside the main landmark", () => {
  renderScreen({ equation: makeEquation(7, 8) });

  const main = screen.getByRole("main");
  expect(within(main).getByText("7")).toBeInTheDocument();
  expect(within(main).getByText(/ran out of tiles/i)).toBeInTheDocument();
});
```

Match the file's existing render helper and its English copy assertions —
read the top of the file first and follow whatever pattern is already there
rather than introducing a second one. The reason's exact English text is the
`gameOver.reason` value in `src/i18n/messages.ts`; assert against that, not
against a guess.

- [ ] **Step 2: Verify it fails**

```bash
npm test -- src/components/GameOverScreen/GameOverScreen.test.tsx
```

Expected: FAIL — `equation` is not yet a prop.

- [ ] **Step 3: Add the prop and render the terminal group**

In `GameOverScreen.tsx`: import `EquationBoard` and the `Equation` type, add
`equation: Equation` to `GameOverScreenProps`, and render the group as the
first child of `<main className={styles.screen}>`:

```tsx
<div className={styles.terminal}>
  <EquationBoard equation={equation} />
  {/* §1.8 keeps the terminal equation on screen to explain the loss, but
      the equation alone reads as a live prompt. The reason sits with the
      equation rather than inside the results block, so it defuses the
      thing it explains. */}
  <p className={styles.reason}>{t("gameOver.reason")}</p>
</div>
```

The comment moves verbatim from `App.tsx:109-112` — it explains a product
decision that is still in force.

- [ ] **Step 4: Move the CSS**

Add to `GameOverScreen.module.css`:

```css
/* The equation and its reason are one unit. A gap tighter than .screen's
   keeps the reason reading as a caption on the equation rather than as the
   first result. */
.terminal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.reason {
  padding: 0 var(--space-4);
  color: var(--color-text-muted);
  text-align: center;
}
```

Delete `.gameOverArena` and `.reason` from `App.module.css`, keeping its
`.app`, `.languageBar`, and the media query intact.

- [ ] **Step 5: Collapse the App block**

`App.tsx:106-125` becomes:

```tsx
{state.phase === "gameOver" && state.equation !== null && (
  <GameOverScreen
    equation={state.equation}
    stats={{
      score: state.score,
      totalRounds: state.totalRounds,
      longestStreak: state.longestStreak,
    }}
    url={dependencies.gameUrl}
    dependencies={shareDependencies}
    onPlayAgain={handleRestart}
  />
)}
```

Drop the now-unused `EquationBoard` import and the `styles` import if nothing
else in `App.tsx` references it — check before deleting; `.app` and
`.languageBar` are still used, so `styles` almost certainly stays.

The `state.equation !== null` guard stays in `App.tsx`. `GameOverScreen`
takes a non-null `Equation`, so the narrowing belongs at the call site.

- [ ] **Step 6: Verify the integration suite**

`App.test.tsx`'s gameOver assertions (around lines 241-258) query by role and
text, so they are expected to survive unchanged. **Verify this — do not
assume it.** If one breaks, report which and why before changing it.

- [ ] **Step 7: Full gates**

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

- [ ] **Step 8: Manual check**

```bash
npm run dev
```

Lose a run. Confirm the reason still reads as a caption on the equation
rather than as the first stat, in both `en` and `ko`, at 1280px and at 320px.

- [ ] **Step 9: Commit**

```bash
git add src/components/GameOverScreen/ src/app/
git commit -m "refactor(game-over): move the terminal equation inside the screen landmark" -m "Task: T22"
```

**Acceptance criteria**

- `GameOverScreen` renders the equation and reason inside its `<main>`.
- `.gameOverArena` no longer exists anywhere.
- The §1.8 comment survives the move.
- The reason still sits tighter to the equation than to the results block.
- `App.test.tsx` passes with no assertion rewritten to accommodate the move.
- Closes issue #31 item 3.

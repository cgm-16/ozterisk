---
reads:
  - docs/spec/product.md  # entire ruleset
  - docs/spec/architecture.md  # entire contract
  - docs/spec/ui-i18n.md  # §1.13 language behavior, §1.16 persistence and reload
---

# T12 — Application orchestration and complete run tests

```yaml
task_id: T12
title: Integrate complete playable run
milestone: M2 — Playable Bilingual PoC
priority: P0
estimate: L
wave: W6
depends_on: [T06, T08, T10, T11]
parallel_safe: false
paths: [src/app/App.tsx, src/app/App.test.tsx, src/main.tsx]
```

**Interfaces**

- Consumes: all domain, i18n, screen, and service contracts.
- Produces: production app boundary with injected randomness/IDs for tests.

```ts
export interface AppDependencies {
  random: RandomSource;
  nextTileId: TileIdFactory;
  gameUrl: string;
}
```

- [ ] **Step 1: Write failing end-to-end component slices**

Without Playwright, render `App` with deterministic dependencies and test:

1. title → Start Run → Round 1;
2. select correct answer → reward/score/streak → overflow → exact discard → Next Round;
3. incorrect answer → no reward/reset streak → Next Round;
4. terminal two-digit equation with one tile → game over and retained equation;
5. Play Again → fresh inventory/statistics/Round 1;
6. language changes during answering without state reset;
7. remount → title state but saved language retained.

- [ ] **Step 2: Verify failure**

```bash
npm test -- src/app/App.test.tsx
```

- [ ] **Step 3: Implement event orchestration**

Handlers:

- `start/restart`: create inventory and equation, dispatch corresponding action.
- `submit`: construct current answer; if correct, generate `N+1` rewards and dispatch correct; otherwise dispatch incorrect.
- `next`: generate equation and dispatch next.
- Production dependencies: `Math.random`, `crypto.randomUUID`, `window.location.origin + window.location.pathname`.

- [ ] **Step 4: Mount providers**

`main.tsx` order:

```tsx
<React.StrictMode>
  <I18nProvider>
    <App dependencies={browserDependencies} />
  </I18nProvider>
</React.StrictMode>
```

- [ ] **Step 5: Verify complete suite**

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/app src/main.tsx
git commit -m "feat: integrate complete 1-0 run loop" -m "Task: T12"
```

**Acceptance criteria**

- Every canonical phase is reachable through user interaction.
- Strict Mode does not consume extra random samples during render; randomness occurs only in event handlers or lazy initialization explicitly triggered once.
- Game state never enters storage.

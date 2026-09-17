---
reads:
  - docs/superpowers/specs/2026-08-09-endless-mode-polish-design.md  # §1.3 mode fork, §3.4 rounds headline
  - docs/spec/product.md  # §1.9 statistics, §1.15 sharing
  - docs/spec/ui-i18n.md  # §1.10 layout order
---

# T20 — Rounds survived as the headline stat

```yaml
task_id: T20
title: Promote rounds survived to the primary figure in HUD, game over, and share text
milestone: M4 — Endless Polish and Tuning Surface
priority: P1
estimate: S
wave: W1
depends_on: []
parallel_safe: true
paths:
  - src/components/GameHud/GameHud.tsx
  - src/components/GameHud/GameHud.module.css
  - src/components/GameOverScreen/GameOverScreen.tsx
  - src/components/GameOverScreen/GameOverScreen.test.tsx
  - src/services/sharing.ts
  - src/services/sharing.test.ts
  - src/app/App.test.tsx
```

**Interfaces**

- Consumes: existing `GameState.round` / `GameState.totalRounds` and
  `ShareStats`. No signature changes.

## Why

The mode fork makes Endless a survival mode whose goal is rounds survived
(Classic will carry streaks instead). The number is already tracked; only
its prominence is wrong. Presentation only — **no reducer change**.

- [ ] **Step 1: Write the failing share-text test**

In `src/services/sharing.test.ts`, update the existing format assertions to
expect rounds leading, in both languages:

```ts
expect(formatShareText(stats, "en", url)).toBe(
  `1-0 — Rounds: 12\nScore: 7\nLongest streak: 4\n\nCan you beat it?\n${url}`,
);
expect(formatShareText(stats, "ko", url)).toBe(
  `1-0 — 라운드: 12\n점수: 7\n최장 연속 정답: 4\n\n이 기록을 넘을 수 있나요?\n${url}`,
);
```

- [ ] **Step 2: Verify it fails**

```bash
npm test -- src/services/sharing.test.ts
```

- [ ] **Step 3: Reorder the share text**

In `src/services/sharing.ts`, swap the first two lines of each branch so
`totalRounds` leads and `score` follows. Leave the trailing prompt and URL
untouched — the "never claims verification" property (§1.15) must hold.

- [ ] **Step 4: Promote Round in the HUD**

In `GameHud.tsx`, order the entries **Round, Score, Streak** and give the
Round entry an emphasis class.

**Keep the `<dt>`/`<dd>` pair structure exactly as it is.**
`App.test.tsx`'s `hudField()` helper (line 60) reads
`screen.getByText(label).nextElementSibling`, so wrapping or reordering
those two elements relative to each other would break every HUD assertion
in the integration suite.

Add `.primary` to `GameHud.module.css` — a larger `<dd>` font size using the
existing scale, no new color token.

- [ ] **Step 5: Promote rounds on the game-over screen**

In `GameOverScreen.tsx`, order the `<dl>` entries `gameOver.rounds`,
`hud.score`, `gameOver.longestStreak`, mirroring the HUD emphasis. Update
any order-dependent assertion in `GameOverScreen.test.tsx`.

- [ ] **Step 6: Update HUD ordering assertions**

`App.test.tsx` reads HUD values by label rather than position, so most
assertions are unaffected. Check for any DOM-order assertion
(`compareDocumentPosition`) touching the HUD and update it.

- [ ] **Step 7: Verify**

```bash
npm test && npm run typecheck && npm run lint && npm run build
```

- [ ] **Step 8: Manual check**

```bash
npm run dev
```

Confirm the HUD reads Round first in both `en` and `ko`, that the Korean
labels do not wrap awkwardly at 320px width, and that Copy Result produces
the reordered text.

- [ ] **Step 9: Commit**

```bash
git add src/components/GameHud/ src/components/GameOverScreen/ \
        src/services/sharing.ts src/services/sharing.test.ts src/app/App.test.tsx
git commit -m "feat(hud): promote rounds survived to the headline stat" -m "Task: T20"
```

**Acceptance criteria**

- Rounds leads the HUD, the game-over stats, and the share text.
- The `<dt>`/`<dd>` structure is unchanged, so `hudField()` still resolves.
- No reducer or state-shape change.
- Korean and English both fit at 320px.
- The terminal equation stays excluded from the count.

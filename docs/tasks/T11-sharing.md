---
reads:
  - docs/spec/ui-i18n.md  # §1.14 required copy, §1.15 sharing contract
  - docs/spec/architecture.md  # §2.4 browser-bound interfaces
---

# T11 — Localized game-over sharing

```yaml
task_id: T11
title: Add localized share and copy actions
milestone: M2 — Playable Bilingual PoC
priority: P1
estimate: M
wave: W3
depends_on: [T03, T07]
parallel_safe: true
paths: [src/services/sharing.ts, src/services/sharing.test.ts, src/components/GameOverScreen/**]
```

**Interfaces**

- Consumes: §2.4 browser-bound interfaces, current language, game-over statistics.
- Produces: pure formatting, injected share/copy services, `GameOverScreen`.

- [ ] **Step 1: Write failing formatting tests**

Assert exact English and Korean formats from §1.15, including blank line and normal URL.

- [ ] **Step 2: Write failing service tests**

Cover:

- native share available → `shared`, clipboard untouched;
- native share unavailable → clipboard receives result and URL, outcome `copied`;
- native share rejects → `failed`, no implicit clipboard call;
- clipboard resolves → `copied`;
- clipboard rejects → `failed`.

- [ ] **Step 3: Write failing component tests**

Cover statistics, Play Again callback, Share, Copy Result, inline success/failure status, and language-dependent regenerated text.

- [ ] **Step 4: Implement service and screen**

Keep browser globals in the screen composition boundary:

```ts
const dependencies: ShareDependencies = {
  nativeShare: navigator.share?.bind(navigator),
  writeClipboard: (text) => navigator.clipboard.writeText(text),
};
```

- [ ] **Step 5: Verify**

```bash
npm test -- src/services/sharing.test.ts src/components/GameOverScreen/GameOverScreen.test.tsx
npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add src/services src/components/GameOverScreen
git commit -m "feat: add localized game-over sharing" -m "Task: T11"
```

**Acceptance criteria**

- URL has no score query/hash payload.
- Failure is inline and non-blocking.
- Result text always reflects the current language.

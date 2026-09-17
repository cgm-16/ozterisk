---
reads:
  - src/i18n/I18nContext.tsx  # where language already lives
  - src/styles/tokens/typography.css  # the ko overrides that depend on this
  - docs/spec/ui-i18n.md  # §1.12 typography, §1.13 language behaviour
---

# T30 — Load the Korean face on demand

```yaml
task_id: T30
title: Fetch Noto Sans KR only when the locale is Korean
milestone: M5.5b — Foundations and Identity
priority: P1
estimate: S
wave: W1
depends_on: [T28]
parallel_safe: false
paths:
  - src/i18n/koreanFont.ts
  - src/i18n/koreanFont.test.ts
  - src/i18n/I18nContext.tsx
  - src/i18n/types.ts
```

**Interfaces**

- Consumes: the `language` state `I18nProvider` already owns.
- Produces: `loadKoreanFont`, injectable so tests never touch the real import.

## Why

§1.12 requires each locale to render in a face that covers its script, and Zen
Kaku Gothic New covers no Hangul — without this the entire `ko` locale falls
through to `system-ui`, which §8.5's "Korean copy does not clip" would not catch,
because unstyled Korean does not clip.

It cannot simply be added to `tokens/fonts.css`. Noto Sans KR's Korean subset is
**542 KB** at a single weight, and an English player must never pay it. Language
is already state and already persisted, so this is a dynamic `import()` in the
i18n layer, not new machinery.

Only weight 400 ships. Three weights measure 1.62 MB, over the plan's ~1 MB line,
so bold Hangul is browser-synthesised. That is a measured decision; do not add
weights.

- [ ] **Step 1: Write `src/i18n/koreanFont.ts`**

One exported function that dynamically imports
`@fontsource/noto-sans-kr/korean-400.css` and resolves once, idempotently — a
language toggled back and forth must not refetch. A failed load is not fatal:
the locale still renders, degraded, so the failure path must be explicit rather
than an unhandled rejection.

- [ ] **Step 2: Call it from `I18nProvider`, injectably**

The provider already runs an effect on `language` to set
`document.documentElement.lang`. The Korean load belongs beside it, guarded on
`language === "ko"`.

It **must** be injectable. `I18nProvider` is mounted by nearly every test in the
suite; a raw dynamic import of a CSS module executing under `vitest` with
`css: true` is an unhandled-rejection and noisy-output risk, and test output must
be pristine to pass. Give the provider an optional dependency with the real
loader as its default, in the shape the existing `AppDependencies` /
`ShareDependencies` props already establish.

- [ ] **Step 3: Test it**

Cover: not called for `en`; called on mount for `ko`; called when the language
switches to `ko`; not called twice; a rejected load does not throw or warn.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/ docs/tasks/T30-korean-face-on-demand.md
git commit -m "feat(i18n): load the Korean face only for the Korean locale" -m "Task: T30"
```

**Acceptance criteria**

- No test triggers a real font import; no unhandled rejection or console noise.
- Switching `en → ko → en → ko` loads the face exactly once.
- `src/game/` and `src/hooks/` are untouched.
- Lint, typecheck, test and build pass, with pristine output.

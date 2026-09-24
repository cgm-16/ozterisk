---
reads:
  - docs/spec/product.md  # §1.8, §1.10 gameOver
  - docs/spec/ui-i18n.md  # §1.14 gameOver keys, §1.15 Classic formats
  - src/services/sharing.ts
  - src/components/GameOverScreen/GameOverScreen.tsx
---

# T68 — End a Classic run

```yaml
task_id: T68
title: End a Classic run
milestone: M6a — Classic Core
priority: P1
estimate: S
wave: W5
depends_on: [T67]
parallel_safe: false
paths:
  - src/components/GameOverScreen/
  - src/services/
  - src/app/App.tsx
  - src/i18n/
```

**Interfaces**

- `ShareStats` gains `mode` and `won`; the Endless output is byte-identical.

## Steps

- [ ] Failing tests first:
  - `formatShareText` for a Classic win and a Classic loss, in `en` and `ko`, matches §1.15 byte for byte; Endless unchanged.
  - A Classic win renders **Run Complete** and its reason and no equation board; a Classic loss renders as today.
- [ ] Implement.

## Acceptance

- `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.

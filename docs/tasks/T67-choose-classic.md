---
reads:
  - docs/spec/product.md  # §1.3, §1.10 title and answering
  - docs/spec/ui-i18n.md  # §1.14 mode keys
  - src/components/TitleScreen/TitleScreen.tsx
  - src/app/App.tsx
---

# T67 — Choose Classic and read its capacity

```yaml
task_id: T67
title: Choose Classic and read its capacity
milestone: M6a — Classic Core
priority: P1
estimate: M
wave: W4
depends_on: [T64, T66]
parallel_safe: false
paths:
  - src/components/TitleScreen/
  - src/app/App.tsx
  - src/app/App.test.tsx
  - src/components/GameHud/
  - src/components/CapacityMeter/
  - src/i18n/
```

**Interfaces**

- `TitleScreen` takes `mode` and `onModeChange`; `App` owns the choice (not persisted, §1.16).
- `CapacityMeter` takes `capacity` instead of importing `INVENTORY_CAPACITY`.

## Steps

- [ ] Failing tests first:
  - Two mode buttons with `aria-pressed`; Endless pressed by default.
  - Choosing Classic then **Start Run** deals 20 tiles, two of each digit.
  - The Classic HUD reads `19` after the second submission and renders no pip meter.
  - **Play Again** and `R` keep the mode.
  - Every new key exists in `en` and `ko`.
- [ ] Implement. Classic is playable on the existing rack from here; its phone layout is `M6b`'s.

## Acceptance

- `npm test`, `npm run typecheck`, `npm run lint`.

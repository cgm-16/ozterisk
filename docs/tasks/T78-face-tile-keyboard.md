---
reads:
  - docs/spec/product.md  # §1.11
  - src/hooks/useGameKeyboard.ts
---

# T78 — Face tiles on the keyboard

```yaml
task_id: T78
title: Face tiles on the keyboard
milestone: M7 — Special Tiles
priority: P1
estimate: S
wave: W3
depends_on: [T77]
parallel_safe: true
paths:
  - src/hooks/
```

## Steps

- [ ] Write the failing tests first:
  - While answering, a digit key takes a digit tile over any face.
  - Pressing 4 with {`low`, `nbr(4)`} selects `nbr`, the narrowest.
  - With two faces of equal width, the leftmost in rack order is taken.
  - In overflow, pressing 7 with only a wildcard holding 7 marks nothing.
- [ ] Implement it with `tileDigits`.

## Acceptance

- `npx vitest run src/hooks`, `npm run typecheck`, `npm test`.

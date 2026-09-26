---
reads:
  - docs/spec/ui-i18n.md  # §1.14 result keys
  - src/components/FeedbackPanel/FeedbackPanel.tsx
---

# T80 — Feedback copy with faces

```yaml
task_id: T80
title: Feedback copy with faces
milestone: M7 — Special Tiles
priority: P1
estimate: S
wave: W4
depends_on: [T79]
parallel_safe: false
paths:
  - src/components/FeedbackPanel/
  - src/i18n/
```

## Steps

- [ ] Write the failing tests first:
  - A correct answer with `high` for 5 in 53 reads "Your answer: 53".
  - `odd` + 3 for 63 reads "Your answer: O·3". `low` + 3 reads "Your answer: 0–4·3".
  - An incorrect answer with no face still reads the number, with no `·`.
  - Korean uses the same engraving.
- [ ] Implement it from `lastResult.submittedTiles`. There is no reason line.

## Acceptance

- `npm test`, `npm run typecheck`, `npm run lint`.

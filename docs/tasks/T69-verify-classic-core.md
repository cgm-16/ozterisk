---
reads:
  - docs/plan/roadmap.md  # M6a exit gate
  - src/gallery/states.tsx
---

# T69 — Gallery fixtures and the M6a gate

```yaml
task_id: T69
title: Gallery fixtures and the M6a gate
milestone: M6a — Classic Core
priority: P1
estimate: S
wave: W6
depends_on: [T66, T68]
parallel_safe: false
paths:
  - src/gallery/
  - docs/journal/
```

## Steps

- [ ] Gallery states: Classic answering, Classic overflow with 2 required (no Confirm), feedback after a discard, Classic win, Classic loss. Replace the stale "unreachable by playing" comments.
- [ ] Walk the M6a exit gate: play one Classic win (capacity reaches 6) and one loss in the dev server, in both languages, and an Endless overflow.
- [ ] Journal entry with the readings, named by instrument and conditions.

## Acceptance

- `npm run lint && npm run typecheck && npm test && npm run build`; the gate readings in the journal.

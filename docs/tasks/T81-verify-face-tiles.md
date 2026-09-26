---
reads:
  - docs/design_handoff_m7_face_tiles/M7 Face Tile States.dc.html
  - src/gallery/states.tsx
---

# T81 — Gallery, pruning and the M7 gate

```yaml
task_id: T81
title: Gallery, pruning and the M7 gate
milestone: M7 — Special Tiles
priority: P1
estimate: S
wave: W5
depends_on: [T78, T79, T80]
parallel_safe: false
paths:
  - src/gallery/
  - docs/journal/
  - docs/design_handoff_m7_face_tiles/
```

## Steps

- [ ] Gallery entries:
  - each kind in resting, lifted, reward, marked and disabled
  - correct feedback and wrong feedback with a face
  - a win whose final hand holds a face
- [ ] Prune the handoff's `.jsx`, `.d.ts` and `.dc.html` files once shipped.
- [ ] Write a journal entry. The known risk: a Garamond O sits close to 0.

## Acceptance

- `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e`.
- One Classic run in the dev server, in en and ko: a face placed right, a face
  placed wrong, and the engraved feedback read. An Endless round shows no face.

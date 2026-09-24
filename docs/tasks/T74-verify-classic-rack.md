---
reads:
  - docs/plan/roadmap.md  # M6b exit gate
  - e2e/viewport.spec.ts
  - docs/spec/product.md  # §1.17: the browser suite asserts layout only
---

# T74 — Rack geometry, gallery, pruning and the M6b gate

```yaml
task_id: T74
title: Rack geometry, gallery, pruning and the M6b gate
milestone: M6b — Classic Rack and Motion
priority: P1
estimate: M
wave: W4
depends_on: [T73]
parallel_safe: false
paths:
  - e2e/viewport.spec.ts
  - src/gallery/
  - docs/design-system/decisions.md
  - docs/design_handoff_m6_classic/
  - docs/journal/
```

## Steps

- [ ] Playwright, geometry only: no horizontal scroll at `320`, `402` and desktop for each Classic rack size in both locales; the rail adds no grid row; answer slots keep their size.
- [ ] Gallery states for each rack size, the rail, and each new moment.
- [ ] Read every new moment with reduced motion on and off; fill in the wiring column in `decisions.md`.
- [ ] Prune the handoff's `TileInventory.*` and `keyframes.css` once shipped, as `T61` did; keep the README and screenshots.
- [ ] Journal entry.

## Acceptance

- `npm run test:e2e` green; `npm run lint && npm run typecheck && npm test && npm run build`.

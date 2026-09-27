---
reads:
  - docs/spec/ui-i18n.md  # §1.12 the rail, discard scroll
  - docs/design-system/decisions.md  # a discard scrolls the rack into view
  - src/components/TileInventory/TileInventory.tsx
---

# T83 — Discard scroll

```yaml
task_id: T83
title: Discard scroll
milestone: M6e — Discard Scroll
priority: P1
estimate: XS
wave: W0
depends_on: []
parallel_safe: false
paths:
  - docs/spec/ui-i18n.md
  - docs/design-system/decisions.md
  - docs/plan/roadmap.md
  - docs/tasks/
  - docs/journal/
  - src/components/TileInventory/
  - src/test/setup.ts
```

## Why

On most phones the game screen is taller than the visible area. A discard
therefore starts with the prompt and the rack below the fold (#180), so the
player has to scroll to find out what the game is asking.

## Rulings (Ori, 27 Sep 2026)

- Take experiment #182: one instant scroll when a discard starts, with
  `scrollIntoView({ block: "nearest", behavior: "instant" })` on the rack.

## Steps

- [ ] A failing test first. The rack scrolls into view once, with these exact
      options, when `mode` becomes `"discard"`. It does not scroll outside a
      discard, or again while tiles are being marked.
- [ ] `TileInventory.tsx`: an effect keyed on `mode === "discard"`.
- [ ] `src/test/setup.ts`: a no-op `scrollIntoView`, since jsdom does no layout.
- [ ] Update spec §1.12, `decisions.md`, the roadmap row and the journal.

## Acceptance

- Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, and
  `npm run test:e2e`.
- Browser reading at 393 × 660 in real Classic and Endless runs: at every
  discard, the prompt's top and the rack's bottom are both inside the viewport.

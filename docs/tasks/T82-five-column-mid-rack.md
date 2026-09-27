---
reads:
  - docs/spec/ui-i18n.md  # §1.12 Classic (stepped rack), motion inventory
  - docs/design-system/decisions.md  # stepped rack, sealed plugs, re-seat
  - src/components/TileInventory/rackTier.ts
  - src/components/TileInventory/TileInventory.module.css
---

# T82 — Five-column mid rack

```yaml
task_id: T82
title: Five-column mid rack
milestone: M6d — Rack Steps
priority: P1
estimate: S
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
  - src/gallery/
```

## Why

Classic's rack steps at 15 and 10 sockets. Those numbers are whole rows only
at five columns, but the mid size is six columns wide, and it draws a fixed 18 cells from 15 down to 11. By 12, its whole third row is plugs, and it stays that way at 11. Ori played
it on an iPhone 13 mini and found that dead row awkward (#159).

## Rulings (Ori, 27 Sep 2026)

- Scheme B from experiment #177: the mid size is `5 × 3` at `48 × 60` with a 6px gap,
  footprint 15. 15 and 10 become whole rows, so the mid size never has
  more than four plugs, and no row is all plugs from 375px up.
- The thresholds stay at 15 and 10.
- The small size's narrow fallback (`6 × 4`) keeps its all-plug row at 18–16
  below a 350px container. Accepted: 320px phones are rare.
- The overflow-in-prompt variant from the same experiment is not taken.

## Consequences

- The mid size needs no narrow fallback: its tray is 282px, and the
  tracks' `minmax` floor absorbs the 1px the 320px gate lacks.
- No size now starts with plugs past its top capacity, so `M6·2` (new plugs
  close) can no longer play, and it is retired from the §1.12 inventory. `M6·0`
  (the house plug) is unchanged.

## Steps

- [ ] Failing tests first: `rackTier(15)` and `rackTier(11)` return footprint
      15; the rack at fifteen draws 15 cells and no plugs; a size change
      from 16 to 15 re-seats every tile and adds no plug.
- [ ] `rackTier.ts`: the mid footprint is whole rows of five.
- [ ] `TileInventory.module.css`: mid size is 5 columns; drop the mid narrow
      fallback.
- [ ] `TileInventory.tsx`: the only plugs past a top capacity are the house's.
- [ ] Spec §1.12, `decisions.md`, gallery labels, roadmap row, journal.

## Acceptance

- `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
- `npm run test:e2e`: no horizontal scroll at 320px for any gallery state,
  including Classic at fifteen.

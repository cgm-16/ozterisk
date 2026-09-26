---
reads:
  - docs/spec/ui-i18n.md  # §1.12 face material, §1.14 labels
  - docs/design_handoff_m7_face_tiles/FaceTile.dc.html
  - docs/design_handoff_m7_face_tiles/M7 Face Tile States.dc.html
  - src/components/Tile/Tile.tsx
---

# T79 — Face tiles on screen

```yaml
task_id: T79
title: Face tiles on screen
milestone: M7 — Special Tiles
priority: P1
estimate: M
wave: W3
depends_on: [T77]
parallel_safe: true
paths:
  - src/components/Tile/
  - src/components/TileInventory/
  - src/components/AnswerSlots/
  - src/components/FeedbackPanel/
  - src/components/GameOverScreen/
  - src/i18n/
```

**Interfaces**

- `Tile` renders a digit tile or a face tile. There is no separate FaceTile
  component; the material, states and button handling are shared.

## Steps

- [ ] Write the failing tests first:
  - A `nbr(4)` tile renders `3–5` with the label "Digits 3 to 5" / "숫자 3–5".
  - A `wild` tile renders ✳ with the label "Wildcard: any digit".
  - A filled answer slot holding a face announces the face's label.
- [ ] Add a `.face` class: the inlay rule, glyph sizes at both tile sizes, and
      `overflow: hidden` so the crack stays inside the tile. Every state reuses
      the digit tile's treatment.
- [ ] Add six `tile.face.*` keys in en/ko, and pass tiles through TileInventory,
      AnswerSlots, the FeedbackPanel reward tiles and the final hand.

## Acceptance

- `npm test`, `npm run typecheck`, `npm run lint`.
- `npm run test:e2e`: a face glyph doesn't widen the rack.

---
reads:
  - docs/design_handoff_m7_face_tiles/README.md  # § The Classic win screen
  - docs/design_handoff_m7_face_tiles/Run Complete Theming.dc.html  # 1c, chosen
  - docs/spec/product.md  # §1.10 gameOver
  - docs/spec/ui-i18n.md  # §1.12 colour, §1.14 gameOver keys
  - src/components/GameOverScreen/GameOverScreen.tsx
---

# T75 — Run Complete in gold, with the final hand

```yaml
task_id: T75
title: Run Complete in gold, with the final hand
milestone: M7 — Special Tiles
priority: P1
estimate: S
wave: W0
depends_on: []
parallel_safe: false
paths:
  - docs/spec/
  - docs/design-system/decisions.md
  - docs/design_handoff_m7_face_tiles/
  - docs/tasks/
  - src/components/GameOverScreen/
  - src/app/App.tsx
  - src/i18n/
  - src/gallery/
```

**Interfaces**

- `GameOverScreen` gains `hand: readonly Tile[]`. It reads `CLASSIC_FLOOR` itself.
  `ShareStats` and the share props are unchanged.

## Why

An M6 correction carried by the M7 handoff. Both end-screen headings are set in
`--verm-400`, and vermilion means a tile is leaving, so a win reads as a loss.
A win is `--gold-500` (8.7:1 on `--surface-surround`), and the slot a loss uses
for its terminal equation holds the final hand. It ships ahead of the face tiles
because it depends on nothing in them.

## Rulings (Ori, 26 Sep 2026)

- It ships as its own PR, before M7's face tiles.
- `hand` is a prop fed from `state.inventory`. It is not added to `ShareStats`.
- The handoff's switch to callback share props (`onShare`, `onCopy`, `copied`)
  is not taken.

## Steps

- [ ] Commit the handoff folder. Merge "M7 interaction calls", "Run Complete
      themed" and "M7 research accepted" into `docs/design-system/decisions.md`,
      then delete the handoff's `decisions.md`.
- [ ] `ui-i18n.md`: the win heading colour, the final-hand strip (the floor's
      sockets at compact size on `--surface-panel`), and the §1.14 key
      `gameOver.finalHand`, in en ("Finished with {held} tiles in {floor}
      sockets") and ko ("{floor}칸 중 타일 {held}개로 완주"). Adjust `product.md`
      §1.10 `gameOver` to match.
- [ ] Write `T75`–`T81`.
- [ ] Write the failing tests first:
  - A Classic win renders a group named "Finished with 4 tiles in 6 sockets"
    with `CLASSIC_FLOOR` cells, 4 of them holding tiles, and its heading
    carries the win class.
  - A Classic loss and an Endless game over still render the EquationBoard and
    the loss heading.
- [ ] Split `.title` in `GameOverScreen.module.css`, render the strip, and pass
      `hand` from App.
- [ ] Add a gallery entry for the win with a partial hand.

## Acceptance

- `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
- In the dev server, win a Classic run in en and ko: the heading is gold and the hand shows.

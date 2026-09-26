---
reads:
  - docs/design_handoff_m7_face_tiles/README.md
  - docs/design-system/decisions.md  # § M7 opening calls, interaction calls, research accepted
  - docs/spec/product.md  # §1.3, §1.4, §1.5, §1.7a, §1.11
  - docs/spec/architecture.md  # §2.2, §2.3, Tuning surface
  - docs/spec/ui-i18n.md  # §1.12, §1.14
---

# T76 — Amend the spec for face-set tiles

```yaml
task_id: T76
title: Amend the spec for face-set tiles
milestone: M7 — Special Tiles
priority: P0
estimate: S
wave: W1
depends_on: [T75]
parallel_safe: false
paths:
  - docs/spec/
  - docs/plan/
```

**Interfaces**

- Produces the canonical face rules every later M7 task reads. No code.

## Why

`docs/spec/**` has no face tiles. Roadmap row M7 and #44 still promise a digit
picker, which the handoff removes. The spec is canonical (AGENTS.md), so it
moves first.

## Rulings (Ori, 26 Sep 2026)

- The six kinds come from the handoff: `wild` 0–9, `odd` 1·3·5·7·9, `even`
  0·2·4·6·8, `low` 0–4, `high` 5–9, and `nbr` c±1 with c in 1–8 and no wrap.
- **No picker.** A face counts as the digit its slot needs if that digit is in
  its set. Otherwise the answer is wrong and is paid for like any wrong answer.
- Classic only. They arrive as ordinary rewards at `FACE_RATE` 0.08, weighted
  1/set size. The opening deal has none. Endless is unchanged.
- `CLASSIC_FLOOR` moves 6 → 5 in the same PR as the faces.
- `Tile` is a discriminated union, with `tileDigits(tile)` giving a tile's set
  and `[digit]` for a digit tile.
- `canConstruct` is a search over tile assignments, not a greedy pass. Greedy
  "narrowest first" fails on product 34 with {`nbr` 2–4, `odd`}. The
  narrowest-first rule belongs to the keyboard only.
- `LastResult.submittedValue` is `number | null`: the product on a correct
  answer, and null when a face missed. The incorrect copy is built from
  `submittedTiles`.
- Keyboard: while answering, a digit key takes a digit tile first, then the
  narrowest face holding the digit, with ties to the leftmost in rack order. In
  overflow, digit keys never mark faces.
- Rack order: digits ascending, then ✳, O, E, then ranges by their lowest digit.
- Share text is unchanged.

## Steps

- [ ] `product.md`: a new §1.4a covering face tiles (sets, placement,
      Classic-only arrival), plus §1.5 rewards, §1.7a floor 5, §1.11 keyboard,
      and §1.17 (replace the "Wildcard or special tiles" bullet with the
      picker: the picker is out of scope).
- [ ] `architecture.md`: §2.2 `Tile` and `LastResult`; §2.3 `tileDigits`,
      `canConstruct`, `answerMatches` and `generateRewardTiles(…, faceRate)`;
      Tuning surface `FACE_RATE`.
- [ ] `ui-i18n.md` §1.12: the face material (gold inlay rule, 1px `--gold-700`,
      inset 5px / 3px compact with radius 4px / 3px; glyph 36px letters, 25px
      ranges; compact 18px / 11px semibold; ✳ in `--gold-500`). §1.14: the six
      spoken labels in en/ko, and the incorrect engraving joined by `·`.
- [ ] `roadmap.md` M7 row, and `traceability.md` rows for each rule.

## Acceptance

- `grep -rni "picker" docs/spec docs/plan/roadmap.md` finds only the §1.17 rejection.
- `grep -rn "Wildcard or special" docs/spec` finds nothing.
- Every ruling above can be found in the spec text it governs.

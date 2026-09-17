---
reads:
  - docs/design-system/components/game/TileInventory.jsx  # the design, which has no badges
  - src/components/Tile/Tile.module.css  # the reward state this task wires
---

# T59 — Delete the rack's text badges and let the tile carry the meaning

```yaml
task_id: T59
title: Adopt the design's answer to the badge overlap
milestone: M5.5g — Visual Verification
priority: P1
estimate: S
wave: W2
depends_on: [T57]
parallel_safe: true
paths:
  - src/components/TileInventory/
```

**Interfaces**

- Owns `src/components/TileInventory/**`. `T58` and `T60` run alongside and
  touch neither.
- Changes an accessible **cue**, not an accessible **name**. That distinction
  is the whole task; see Step 2.

## Why

#84: the rack's `New tile` and `Marked for discard` badges are text in a box
narrower than the text, so they render **on top of the engraved digit**.
Measured in a browser, not a style preference. At 320px, cell `52 × 64`, the
digit's glyph box spans y ≈ 18–49 from the cell top:

| badge | lines | occupies |
|---|---|---|
| `New tile`, webfont loaded | 1 | 43.5 → 60 — clears the digit |
| `New tile`, fallback face | **2** | **27 → 60 — over the digit** |
| `Marked for discard` | **3** | **10.5 → 60 — covers the whole face** |
| `버릴 타일로 표시됨` | **2** | **27 → 60 — over the lower half** |

`@fontsource` ships `font-display: swap`, so **the fallback face paints on
every cold load** — the overlapping row is the common case, not the edge case.
`line-height: 1` (#83) narrowed the overlap and did not remove it. The label is
simply longer than a 52px cell.

**Ori's decision is option A: delete the text badges.**
`docs/design-system/components/game/TileInventory.jsx` has none. It carries the
same information through the `Tile` `state` — `marked` (lift, 6° tilt,
vermilion ring) and `reward` (gold glow) — plus the accessible name. Our `Tile`
primitive already implements both states; `TileInventory` already passes
`marked`, and passes `resting` where the design passes `reward`.

- [ ] **Step 1: Delete the badges, wire `reward`**

`.newBadge` and `.discardBadge` go, with their two `<span>`s. `isNew` tiles
pass `state="reward"` instead of `"resting"`.

**`reward` and `9i` do not collide** — verified, and worth stating so nobody
rules on a conflict that does not exist. `oz-fire` animates `transform` and
`opacity` on the **cell** (`.cellNew`); `Tile.reward` sets `--tile-edge` and an
`outline` on the **tile inside it**. Different elements, different properties.
Both keep working.

Mind the ordering already in the file: `state` is currently
`isMarkedForDiscard ? "marked" : mode === "readOnly" ? "disabled" : "resting"`.
A reward tile in a read-only rack must still read `disabled`, and a reward tile
marked for discard must still read `marked` — `reward` is the lowest-priority
of the three, not a fourth branch bolted on top.

- [ ] **Step 2: The accessible name does not change**

`labelParts` keeps pushing `t("tile.newLabel")` and `t("tile.discardLabel")`.
The `<span>`s were `aria-hidden="true"` and never reached the accessible name
in the first place, so **deleting them removes a visual cue and nothing else.**

These assertions are load-bearing and **must survive unweakened**:

| Site | Assertion |
|---|---|
| `App.test.tsx:184,185` | `name: "Digit 0, New tile"` / `"Digit 1, New tile"` |
| `TileInventory.test.tsx:93` | `name: "Digit 7, New tile"` |
| `TileInventory.test.tsx:103` | `name: "Digit 3, Marked for discard"` |
| `GameScreen.test.tsx:409` | `name: "Digit 0, Marked for discard"` |
| `states.test.tsx:54` | `getAllByRole("button", { name: /New tile$/ })` |

Two assertions are about the visible text and go with it:

- `TileInventory.test.tsx:94` — `getByText("New tile")`. Replace it with an
  assertion on the cue that now carries the meaning (the tile's `reward`
  state), so the test still fails if the cue disappears. **Do not simply
  delete it** — that would leave "a reward tile is visibly distinct" untested.
- `App.test.tsx:192` — `queryByText("New tile")).not.toBeInTheDocument()`,
  after Next Round. It becomes vacuous, because after this task nothing renders
  that text in the rack at any time. The line directly above it already carries
  the meaning: `getAllByRole("button", { name: /^Digit \d$/ })).toHaveLength(10)`
  proves no rack tile still claims to be new. Delete `:192` **and say in the
  commit that the assertion above subsumes it** — a deleted assertion needs its
  replacement named.

**`FeedbackPanel` keeps its badge.** `FeedbackPanel.tsx:27` renders its own
`.rewardBadge`, asserted by `FeedbackPanel.test.tsx:51`
(`getAllByText("New tile")).toHaveLength(2)`). That is a different component,
in a panel with room for the text, and #84 is about the rack. Leave it alone.

- [ ] **Step 3: No spec amendment — verify, do not assume**

The badge copy is **not** in §1.14's required-copy table (`tile.newLabel` and
`tile.discardLabel` appear only in `src/i18n/messages.ts`), and `product.md`'s
`feedback` block says *"Correct feedback shows inserted rewards highlighted"* —
which is `FeedbackPanel`, and which the `reward` state satisfies anyway.
Re-run those two checks. If either turns out to bind the rack, **stop and
report** rather than amending a spec from an implementation task.

**Acceptance criteria**

- No badge overlaps the engraved digit at `320`, `408` or `768`, in either
  locale, **with the fallback face active as well as the webfont**. Measured,
  in a browser, with the webfont blocked for the fallback reading.
- A badged cell and an unbadged cell occupy the same footprint.
- Every accessible-name assertion in the table above passes unchanged.
- A reward tile is still visibly distinct from a resting one, and a test says
  so.
- `9i` still fires on reward tiles — the cell animation is untouched.
- Suite green; `lint`, `typecheck`, `build` green.

**What this task does not do**

- Does not touch `FeedbackPanel`.
- Does not touch `src/game/` or `src/hooks/`. `isNew` is state this task reads,
  never sets.
- Does not add gallery fixtures. `T58` owns those, including the
  `pendingDiscards` state that would have caught this defect.

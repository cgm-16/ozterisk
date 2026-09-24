# Handoff: M6 Classic — stepped rack, plugs, overflow and seal motion

## Overview
Classic mode (M6) is ozterisk's descending-capacity mode. The rack starts at **20 sockets** and loses one every **2 submissions**, correct or not, down to a floor of **6** (moving to **5** when M7 ships). This package covers what is new in M6's rack and motion: the rack's tile size steps down while capacity is high, closed sockets stay as sealed plugs, tiles past capacity perch on the rail, and the discard flow has three steps.

## About the design files
The files here are **design references built in HTML**. They are prototypes that show the intended look and behaviour, not production code. Rebuild them in the ozterisk codebase (React + TypeScript + Vite, `cgm-16/ozterisk`), following its reducer in `src/game/` and components in `src/components/`. `TileInventory.jsx` and `keyframes.css` are the closest to production: port them directly.

## Fidelity
**High-fidelity.** Colours, type, spacing, easings and durations are final and taken from the design system's tokens. Only the tier thresholds (15 / 10) are still waiting on a playtest on a real device.

## Screens / views
### Classic arena (Playable Run → Classic)
- Order, top to bottom and fixed: HUD → equation → answer slots → rail (only during overflow) → rack → actions. The phone frame is 402px wide; the arena never scrolls.
- **Rack sizes** (`rackTier(capacity)`):
  - capacity 16–20: 7 columns, tiles **44×55**, gap 4px, face 25px, radius `--radius-sm` (5px); footprint 21 cells
  - capacity 11–15: 6 columns, tiles **48×60**, gap 6px, face 28px, radius `--radius-md` (8px); footprint 18 cells
  - capacity ≤10: 5 columns, tiles **64×80**, gap 8px, face 34px; footprint 10 cells (Endless uses the same size with a 12px gap)
  - Panel: `--surface-panel` (#0b211b), 1px `--border-hairline`, radius 12px, padding 8px. Every size is about 180px tall.
- **Socket:** `--surface-socket` (#081a14), `--shadow-socket` + `--rim-socket`.
- **Sealed plug** (cells past capacity): background `--surface-table` (#14342a), `--rim-socket`, plus `inset 0 -1px 0 var(--hair-100)`. No well and no tile.
- **Rail:** 56px band above the rack with a 1px `--border-accent` top rule. The overflow tile sits right-aligned and is drawn at the rack's current tile size.
- **Answer slots stay at 64×80 in every rack size.**

## Interactions & behaviour
- **Sorting:** on a correct answer, only the tiles that fit are sorted. The ones past capacity are the newest arrivals, kept in arrival order, and they go to the rail. The whole rack re-sorts once, at the round change.
- **Overflow is three steps:** Select → Submit → tap tiles to mark them for discard. Tapping the tile that completes the required count finishes the discard and moves to the next round. There is no Confirm or Next Round button in overflow.
- **Seal:** fires on Submit every 2 submissions (Classic only). The size only changes at the round change, never during feedback.
- **Game over:** Classic ends when capacity reaches the floor (a win) or when there are too few tiles to fill the answer (a loss).

### Motion (every keyframe is in `keyframes.css`)
| Moment | Keyframe | Duration / easing | Notes |
|---|---|---|---|
| Rim reject (8a) | oz-rim-reject | 130ms settle | the tile past capacity perches on the rail |
| Mark for discard (11a) | transition | 150ms | 5px lift, 6° tilt, 2px vermilion ring |
| Discard (8c) | oz-slide-off | 420ms fall | `--dx 46px --drop 88px --rot 18deg` |
| Perched tile seats (8a·2) | oz-perch-drop | 220ms fall | offsets run from the rail to the freed socket, computed per size |
| Socket seals (M6) | oz-seal + oz-seal-rim | 180ms settle | the well shrinks from the bottom, and a hairline rim closes |
| House takes a seat (M6·0) | oz-seal | 180ms, 240ms delay | the 21st socket, once at run start |
| Rack re-seats (M6·1) | oz-reseat | 300ms settle | FLIP from the old seat: `--fx/--fy` offset, `--fs` = oldW/newW, origin 0 0 |
| New plugs close (M6·2) | oz-seal | 180ms, 300 + 40·k ms delay | after the re-seat |
| Table sweep (10i) | oz-slide-off | 340ms each, 40ms stagger, ~700ms total | |

A staggered animation must wait out its delay with a **positive** `animation-delay` and hold frame 0 until it starts (`fill-mode: both`). A negative delay only when scrubbing past t=0.
With `prefers-reduced-motion` on, skip all of the above; the rack jumps straight to its new state.

## State management
- `capacity`: live sockets. `rackCap`: the capacity the rack is currently drawn at, updated only at the round change.
- `inv`: tile list. The first `capacity` entries are seated; the rest are on the rail.
- `marked`: tile ids marked for discard. `sealing`: socket indices closing this submission. `seating`: rail tiles dropping into freed sockets.
- `reseat`: `{ from: tier, order: tileIds }`, set only for the round where the size changes.

## Design tokens
Felt #14342a / #0b211b / deeper #081a14 · clay #fdf8ec → #e6d7ba, edge #b3a184 · ink #16352b · gold #c9a54a · jade #4f9d7c · vermilion #b5432f. Radius 5 / 8 / 12 / 14px. Easings `--ease-settle`, `--ease-snap`, `--ease-fall`. Full scale in the design system's `tokens/`.

## Assets
None. Tiles, sockets and plugs are CSS only.

## Files
`TileInventory.jsx` / `.d.ts` / `.prompt.md` and `keyframes.css` shipped in M6b and were pruned by T74: the frames live in `src/styles/tokens/keyframes.css`, the rack in `src/components/TileInventory/`. The list below is the package as delivered.

- `Playable Run.dc.html`: both modes, playable end to end. Tweaks: stepped rack on/off, thresholds, plugs on/off.
- `Motion Lab.dc.html`: every moment on its own, scrubbable.
- `TileInventory.jsx` / `.d.ts` / `.prompt.md`: the rack component, with the `stepped`, `capacity`, `thresholds` and `reseatFrom` props.
- `keyframes.css`: every `oz-*` frame.
- `decisions.md`: merged into `docs/design-system/decisions.md` (§ M6 — Classic) by T63.

The two `.dc.html` files load the design system from `_ds/` relative to the project root, so open them in place in the project rather than from this folder.

## Screenshots (`screenshots/`)
- `01-playable.png`: title screen with the mode switch
- `02-playable.png`: Classic round 1, HUD and equation
- `03-classic-rack.png`: Classic round 1 rack, 7 × 44 with the house plug in the bottom-right
- `01-motion-lab.png`: M6·1 re-seat, end frame (6 × 48, three plugs still wells before M6·2)
- `02-motion-lab.png`: M6·1 re-seat at 120ms, tiles in flight

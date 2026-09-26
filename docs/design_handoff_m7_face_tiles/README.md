# Handoff: M7 Face-set tiles, plus the Classic win screen

## Overview
M7 adds **face-set tiles** to Classic: special tiles that stand in for any digit in their set. There are six kinds: Wildcard, Odd, Even, Low, High and Neighbours. They arrive as ordinary rewards. A face placed in an answer slot counts as that slot's digit if the digit is in its set. If it isn't, the answer is wrong and costs the same as any wrong digit. **There is no picker.** Classic's floor moves **6 → 5** when M7 ships. Face tiles are **Classic only**; Endless is unchanged.

This package also carries one M6 correction: **Run Complete is gold, with the final hand**, not vermilion.

## About the design files
The files here are **design references built in HTML**. They show the intended look and behaviour; they are not production code. Rebuild them in `cgm-16/ozterisk` (React + TypeScript + Vite), in `src/game/` and `src/components/`. `FaceTile.dc.html`'s logic class and `GameOverScreen.jsx` are the closest to production.

## Fidelity
**High-fidelity.** Every value comes from `src/styles/tokens/`. The face rate (8%) comes from simulation, not from play. Real players will misplace faces, so expect the real win rate to come in slightly below the figures below.

## The six kinds
| Kind | Set | Face (EB Garamond, `--clay-900`) | Spoken label (en / ko) |
|---|---|---|---|
| `wild` | 0–9 | ✳ in `--gold-500`, 36px | Wildcard: any digit / 와일드카드: 모든 숫자 |
| `odd` | 1·3·5·7·9 | **O**, 36px | Odd tile: 1, 3, 5, 7, or 9 / 홀수 타일: 1, 3, 5, 7, 9 |
| `even` | **0**·2·4·6·8 | **E**, 36px | Even tile: 0, 2, 4, 6, or 8 / 짝수 타일: 0, 2, 4, 6, 8 |
| `low` | 0–4 | `0–4`, 25px | Digits 0 to 4 / 숫자 0–4 |
| `high` | 5–9 | `5–9`, 25px | Digits 5 to 9 / 숫자 5–9 |
| `nbr` | centre c ± 1, c in 1–8, no wrap | `3–5`, 25px | Digits {low} to {high} / 숫자 {low}–{high} |

Even includes 0: an Even set without 0 is simply wrong in an arithmetic game. Ranges use an en dash. `5±1` was rejected.

## Material
Clay like a digit tile, with one addition: a **gold inlay rule**, 1px `--gold-700`, inset 5px (3px compact) with 4px radius (3px compact). Everything else is identical to `Tile`: size, gradient, edge, shadow, radius. At compact size (30×38): letters 18px, ranges 11px semibold.

## States (same as `Tile`; see `M7 Face Tile States.dc.html` §01)
- **Resting / lifted / marked:** exactly the digit tile's.
- **Reward:** the digit's treatment, a 1px gold outline plus `--glow-reward`, and it `oz-fire`s in place. It is the same glow on purpose: reward means *new*, and the inlay is what means *special*.
- **Disabled:** flat, no shadow, 45% opacity, the same as the digit tile. Nothing specific to faces.
- **Bloom / crack:** `oz-bloom` / `oz-crack`, unchanged. Clip the tile's contents (`overflow: hidden`) so the crack lines stay inside the tile.

## Rules
- **Placement:** a face counts as the digit its slot needs if that digit is in its set. Otherwise the answer is wrong: the face cracks, and it is paid for like any wrong answer.
- **Membership:** `canConstruct` and the kind draw (`KIND_EQUATION_RATE`) must treat faces by membership. A digit tile is spent before a face, and the narrowest face before a wider one.
- **Rack order:** digits ascending, then ✳, O, E, then ranges by lowest digit. The rack still re-sorts only at the resolve.
- **Keyboard:** a digit key takes a digit tile first. If there is none, it takes the **narrowest face** that holds the digit; ties go to the **leftmost in rack order**.
- **Discard:** faces can be marked like any tile. No special rule.
- **Share text:** unchanged. No face count.

## Feedback copy
- **Correct:** `Your answer: {value}` prints the product the faces counted as, e.g. `56`.
- **Incorrect:** faces print as engraved, with slots joined by a middle dot whenever a face is present: `O·3`, `0–4·3`. The same in Korean. (`0–43` was rejected because it reads as "zero to forty-three".)
- **No reason line.** The cracked face still shows its set above `Correct answer: 63`, and a wrong digit gets no explanation either.

## Balance (`balance.ts`)
| Dial | Value | Documented range | Note |
|---|---|---|---|
| `FACE_RATE` (new) | 0.08 | 0.05–0.10 | Share of **reward** tiles that are faces. This is separate from `KIND_EQUATION_RATE`, the equation retry. |
| Face weights | 1 / set size | — | Wild 8.1% of faces, each five-set 16.2%, Neighbours 27.0% (split evenly across the 8 centres). |
| `CLASSIC_FLOOR` | 5 | — | Was 6. At floor 6, a 10% face rate wins 81% of runs. |

Simulated (start 20, floor 5, 2 submissions per board, kind rate 20%, 3,000 runs each; raw data in `m7_sim_results.json`):

| Face rate | 0% | 5% | **8%** | 10% | 20% |
|---|---|---|---|---|---|
| Win rate, skill 95% | 47% | 56% | **62%** | 65% | 81% |
| Win rate, skill 85% | 36% | 44% | **50%** | 54% | 72% |

Splitting faces by set size instead of evenly moves the win rate by 1.6 points at most. The weighting shapes how rare each kind feels, not the balance.

## The Classic win screen (an M6 correction)
Upstream sets both end-screen headings in `--verm-400`. Vermilion means a tile is leaving, so a win in it reads as a loss. Chosen (`Run Complete Theming.dc.html`, 1c):
- The Run Complete heading is in `--gold-500` (8.7:1 on `--surface-surround`). Split `.title` in `GameOverScreen.module.css`.
- The slot the loss uses for its terminal equation holds the **final hand**: the floor's sockets at compact size, filled with the tiles still held, on a `--surface-panel` strip. It has an accessible name: `gameOver.finalHand`, "Finished with {held} tiles in {floor} sockets" / "{floor}칸 중 타일 {held}개로 완주".
- `GameOverScreen` needs the inventory: pass `hand` (the digits) and `floor`, or add them to `ShareStats`.

## Files
- `FaceTile.dc.html`: the face tile component. Props `kind`, `centre`, `size`, `state`, `label`.
- `M7 Face Tile States.dc.html`: the five states, the answer frames, rack order and spoken labels.
- `M7 Face Tile Directions.dc.html`: the directions considered. 2a was chosen.
- `M7 Face-Set Research.dc.html`: precedents, choice overload, rarity and the simulation.
- `Run Complete Theming.dc.html`: the three win treatments. 1c was chosen.
- `GameOverScreen.jsx` / `.d.ts`: the win screen with `hand` / `floor`.
- `m7_sim_results.json`: the simulator's output.
- `decisions.md`: merged into `docs/design-system/decisions.md` (§ M7 — Face-set tiles) by T75.

The `.dc.html` files load the design system from `_ds/` relative to the project root. Open them in place in the project rather than from this folder. The Motion Lab's "Face tile fires" scene (9i·M7) lives in the project's `Motion Lab.dc.html`.

## Screenshots (`screenshots/`)
- `01-states.png`: the five states beside a digit tile
- `02-states.png`: a correct answer, High `5–9` counting as 5
- `03-states.png`: rack order and spoken labels
- `04-states-wrong.png`: a wrong answer, `O` in the slot that needs 6, cracking, with the feedback text
- `05-run-complete.png`: the win screen, jade (1b, not chosen) beside gold with the final hand (1c)

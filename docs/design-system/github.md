repo: cgm-16/ozterisk
branch: main
path: src

## Last sync

date: 2026-08-31T00:00:00Z

### Updated in this project

- Six round-frequency animations plus the whole streak ladder implemented in `tokens/keyframes.css` — including `oz-fan`, the streak-8 ceramic burst (`--dur-burst` 720ms).
- Focus is a two-tone inset bezel (`--ring-focus`: `--gold-300` over a `--clay-900` inner line), not an offset halo; `:focus-visible` offset is now `-2px`.
- Korean is tuned, not substituted: `:lang(ko)` drops mono tracking and raises interface sizes 1px. Requires `lang` on the app root.
- Rack no longer reflows on tile select — a committed tile keeps its socket (`liftedIds`), marked with a dashed gold rim (`--outline-socket-lifted`).
- Capacity meter lost its near-capacity tint: vermilion now means only "a tile is leaving"; excess pips render past the rail.
- Loss condition corrected to the codebase's `canAttemptEquation` (tile count), not `canConstruct` (exact digits).

## Screen map

| Project screen / file | Built from |
|---|---|
| `ui_kits/game/index.html`, `ui_kits/game/App.jsx` | `src/app/App.tsx`, `src/game/gameReducer.ts`, `src/game/selectors.ts`, `src/game/generators.ts`, `src/game/factories.ts`, `src/game/balance.ts`, `src/game/constants.ts` |
| `ui_kits/game/messages.js` | `src/i18n/messages.ts`, `src/i18n/types.ts` |
| `components/game/Tile.jsx` | tile markup inline in `src/components/TileInventory/TileInventory.tsx` + `TileInventory.module.css` (extracted; no standalone source component) |
| `components/game/TileInventory.jsx` | `src/components/TileInventory/TileInventory.tsx`, `TileInventory.module.css` |
| `components/game/AnswerSlots.jsx` | `src/components/AnswerSlots/AnswerSlots.tsx`, `AnswerSlots.module.css` |
| `components/game/EquationBoard.jsx` | `src/components/EquationBoard/EquationBoard.tsx`, `EquationBoard.module.css` |
| `components/hud/GameHud.jsx` | `src/components/GameHud/GameHud.tsx`, `GameHud.module.css` |
| `components/hud/CapacityMeter.jsx` | `src/game/balance.ts` (`INVENTORY_CAPACITY`), `src/game/selectors.ts` (`getOverflowCount`) — intentional addition, no source component |
| `components/hud/ActionButton.jsx` | button styles across `src/components/*/*.module.css` — intentional addition, no source component |
| `components/hud/LanguageToggle.jsx` | `src/components/LanguageToggle/LanguageToggle.tsx`, `LanguageToggle.module.css` |
| `components/flow/FeedbackPanel.jsx` | `src/components/FeedbackPanel/FeedbackPanel.tsx`, `FeedbackPanel.module.css` |
| `components/flow/OverflowControls.jsx` | `src/components/OverflowControls/OverflowControls.tsx`, `OverflowControls.module.css` |
| `components/flow/TitleScreen.jsx` | `src/components/TitleScreen/TitleScreen.tsx`, `TitleScreen.module.css` |
| `components/flow/GameOverScreen.jsx` | `src/components/GameOverScreen/GameOverScreen.tsx`, `GameOverScreen.module.css`, `src/services/sharing.ts` |
| `components/flow/GameScreen.jsx` | `src/components/GameScreen/GameScreen.tsx`, `GameScreen.module.css` |
| `tokens/*.css` | `src/styles/global.css` (token names kept; values replaced by the locked redesign) |
| `assets/favicon.svg` | `public/favicon.svg` (unchanged) |

## Notes for implementation

- The system's **structure** follows the repo; its **visual and motion language** follows the locked redesign. Where they disagree, the redesign wins.
- `src/gallery/` (`states.tsx`) is the repo's own state gallery and is the closest analogue to `ui_kits/game/` — worth diffing when wiring the real components.
- Not yet implemented, specified only: 8a rim reject, 11a/8c discard motion, 10i table sweep, 11C title entrance and share chop. (Streak tiers 7b/7c and the 2d burst are now wired in `components/game/AnswerSlots.jsx`.)
- Every locked choice has a decision entry in `decisions.md`; the `## M5.5b` section records the judgement calls made this milestone, with what was rejected. Read `readme.md` then `decisions.md` before touching tokens.
- Open: font redistribution notice (self-hosted families are OFL-1.1, but whether their licence text also needs to ship in `dist/assets/` per OFL §2 is unresolved), and no logo — the brand mark is a type treatment.

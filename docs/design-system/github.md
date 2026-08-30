repo: cgm-16/ozterisk
branch: main
path: src

## Last sync

date: 2026-08-29T09:16:59Z

### Updated in this project

- Six round-frequency animations implemented from the locked storyboard, in a new `tokens/keyframes.css`.
- Rack no longer reflows on tile select — a committed tile keeps its socket (`liftedIds`), marked with `--rim-socket-lifted`.
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
- Not yet implemented, specified only: streak tiers 7b/7c, 2d chip burst, 8a rim reject, 11a/8c discard motion, 10i table sweep, 11C title entrance and share chop.
- Open: licensed font files (currently Google Fonts), and no logo — the brand mark is a type treatment.

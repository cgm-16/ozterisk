# design-sync notes — ozterisk

## How this repo syncs

- **ozterisk is an app, not a library.** There is no `dist/`, no `.d.ts` output, and
  `package.json` exports nothing. The bundle entry is `.design-sync/entry.ts`: it re-exports
  the 13 components plus `I18nProvider`, and imports `src/styles/global.css` (tokens, fonts,
  keyframes, reset). Always pass it: `--entry ./.design-sync/entry.ts --node-modules ./node_modules`.
- **No Storybook** (package shape). The dev-only `gallery.html` holds the canonical states;
  the previews in `previews/` were ported from it and from the component tests.
- **Props contracts are hand-written in `cfg.dtsPropsFor`**, with no `.d.ts` to extract from.
  Types are inlined structurally (tile, equation, round result, and for GameScreen the whole
  `GameState` and `GameAction`). Every exported component needs an entry: one without it ships
  `[key: string]: unknown`, and `<GameScreen />` would then type-check and crash (#188 review).
- **`cfg.provider` is `I18nProvider` (`initialLanguage: "en"`).** Every component reads copy
  from it and throws without it.
- **Previews wrap each story in a felt `div`** (`background: var(--surface-table)`). Tile House
  is dark-surface; on the card's white page the light text reads washed out.
- **Playwright** comes from the repo's own `node_modules` (`@playwright/test` 1.63). Run validate,
  capture and resync with `NODE_PATH=$PWD/node_modules`.

## Scope (Ori, 27 Sep 2026)

- Authored previews: ActionButton, AnswerSlots, CapacityMeter, EquationBoard, FeedbackPanel,
  GameHud, LanguageToggle, OverflowControls, Tile, TileInventory.
- Floor cards, by choice: GameScreen, GameOverScreen, TitleScreen. They're whole screens, in the
  bundle but not previewed.

## Known render warns

- TitleScreen's floor card renders its real screen on the card's white page, so its light text
  reads faint. It's the floor tier, not a defect; authoring it with a felt wrapper would fix it.

## Re-sync risks

- **`dtsPropsFor` is a copy of the source interfaces** and rots silently when a component's
  props change. On re-sync, diff each `*Props` interface in `src/components/<Name>/<Name>.tsx`
  against the config.
- **`entry.ts` lists the components by hand.** A new component in `src/components/` isn't synced
  until it's added there and to `componentSrcMap`.
- **`_ds_bundle.css` is about 2.1 MB.** @fontsource declares each face as woff2 and woff, and
  esbuild inlines both as data URLs (7 Latin faces). It renders correctly; slimming it would mean
  a font-only stylesheet for the bundle. Korean (Noto Sans KR) loads at runtime in the app via
  `loadKoreanFont` and is not in the bundle, so Korean designs fall back to a system Hangul face.
- **Previews render `isNew: false` tiles.** A new tile's arrival animation (`oz-fire`) would be
  mid-flight at screenshot time.

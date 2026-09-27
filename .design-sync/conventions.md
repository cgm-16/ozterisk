# ozterisk — Tile House

A multiplication game played with clay digit tiles on a green felt tray. Components render
from `window.Ozterisk.*`. Everything is dark-surface: text tokens are light, so a component on
a white page reads washed out.

## Setup

- **Wrap everything in `I18nProvider`.** Every component reads its copy (labels, verdicts,
  prompts, accessible names) from it and throws outside it. Pass `initialLanguage="en"` or `"ko"`.
- **Put the tray under it.** Give the root `background: var(--surface-surround)`; panels sit on
  `var(--surface-panel)` and the playing area on `var(--surface-table)`.

```jsx
const { I18nProvider, EquationBoard, AnswerSlots, TileInventory, ActionButton } = window.Ozterisk;

<I18nProvider initialLanguage="en">
  <main style={{ background: "var(--surface-table)", padding: "var(--space-6)",
                 display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-4)" }}>
    <EquationBoard equation={{ left: 7, right: 8, product: 56 }} />
    <AnswerSlots slotCount={2} selectedTiles={[{ id: "a", isNew: false, digit: 5 }]} disabled={false} />
    <TileInventory tiles={[{ id: "t0", isNew: false, digit: 6 }]} mode="select"
      pendingDiscards={[]} liftedIds={["a"]} capacity={10} onTile={() => {}} />
    <ActionButton variant="primary">Submit</ActionButton>
  </main>
</I18nProvider>
```

## Styling idiom

Components style themselves (CSS Modules, compiled into the bundle); there are no utility
classes and no class names to reuse. Style your own layout glue with inline styles and the
CSS custom properties below — never raw hex or px where a token exists.

| Family | Tokens |
|---|---|
| Surfaces | `--surface-surround` `--surface-panel` `--surface-table` `--surface-raised` `--surface-socket` `--surface-tile` |
| Text | `--text-primary` `--text-body` `--text-meta` `--text-disabled` `--text-on-tile` |
| Meaning | `--state-correct` (jade) `--state-incorrect` (vermilion) `--state-discard` `--state-reward` (gold) `--accent` |
| Borders | `--border-hairline` `--border-accent` `--border-danger` `--focus-ring` |
| Raw palette | `--felt-900…600` `--clay-050…900` `--gold-300/500/700` `--jade-500` `--verm-400/600/800` `--ink-000…300` |
| Type | `--font-display` (EB Garamond: numerals, headlines) `--font-ui` (Zen Kaku Gothic New) `--font-mono` (IBM Plex Mono); sizes `--size-title` `--size-body` `--size-body-sm` `--size-label` |
| Space | `--space-1` `--space-2` `--space-3` `--space-4` `--space-6` `--space-8` `--space-10` `--space-14` |
| Radius / depth | `--radius-sm/md/lg/xl/pill`; `--shadow-panel` `--shadow-tile` `--glow-reward` |

Colour carries meaning: vermilion means a tile is leaving or an answer is wrong, jade means
correct, gold means reward or the active choice. Don't use them decoratively.

## Data shapes

- A tile is `{ id, isNew, digit: 0–9 }` or a face `{ id, isNew, face: "wild" | "odd" | "even" | "low" | "high" }`
  or `{ id, isNew, face: "nbr", centre: 1–8 }`. `Tile` itself takes just the value (`value={{ digit: 7 }}`).
- An equation is `{ left, right, product }`.
- `TileInventory` with more tiles than `capacity` perches the extras on a rail above the rack;
  `stepped` gives Classic's shrinking rack (5 columns at 11–15 sockets).

## Where the truth lives

Each component's `<Name>.d.ts` is its contract and `<Name>.prompt.md` has working examples.
All tokens are defined in `_ds_bundle.css` (imported by `styles.css`).

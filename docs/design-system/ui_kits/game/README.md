# UI kit — ozterisk (the game)

A playable click-through recreation of the whole run, composed from the design
system's own primitives. `index.html` loads the component sources from
`components/` directly, so what you see here is the real `Tile`,
`TileInventory`, `AnswerSlots`, `ActionButton` and so on — not copies.

## Files

| File | What |
|---|---|
| `index.html` | Entry point. Loads the DS components, then mounts `App`. |
| `App.jsx` | The run: a trimmed version of `src/game/gameReducer.ts` — select, submit, reward, overflow, loss. |
| `messages.js` | The `en` / `ko` copy trees, lifted from `src/i18n/messages.ts`. |

## Screens you can reach

1. **Title** — wordmark, the one-paragraph pitch, four material-swatch rules, `Start Run`.
2. **Answering** — tap tiles into the answer slots; `Submit` stays flat until every slot is filled.
3. **Feedback** — the verdict. Correct shows the N+1 reward tiles; incorrect shows what you submitted and what was right.
4. **Overflow** — reached whenever a reward pushes the rack past ten. The arriving tile perches; mark a resident and confirm.
5. **Game over** — reached when the rack cannot spell the next product. Final stats, share, and the ✳ chop.

Switch locale at any point with the EN / KO toggle; every string swaps, including
mid-run.

## What is deliberately not real

- Equations are drawn uniformly; the kind-equation generosity bias from
  `docs/spec/product.md` §1.2 is not implemented.
- No keyboard bindings (the app supports digit keys, `Backspace`, `Escape`, `Enter`).
- No persistence, no share-string generation — `Copy Result` just stamps the chop.
- Animations are the static end-states. The timing table lives in
  `tokens/motion.css` and `guidelines/motion.html`; the full frame-by-frame
  specification is `ozterisk Storyboard.dc.html` in the design project.

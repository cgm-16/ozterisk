---
reads:
  - docs/design-system/components/hud/ActionButton.d.ts  # the prop contract, and one false claim
  - docs/design-system/components/hud/ActionButton.jsx  # the visual authority, carrying four defects
  - docs/design-system/components/flow/OverflowControls.jsx  # settles the Confirm Discard variant
  - src/styles/tokens/elevation.css  # where the new edge tokens belong
  - src/styles/tokens/colors.css  # the ramps the edges darken from
---

# T36 — Collapse every action into one button

```yaml
task_id: T36
title: Build the ActionButton primitive and wire all eight call sites
milestone: M5.5c — Tile and Action Primitives
priority: P1
estimate: M
wave: W1
depends_on: [T32]
parallel_safe: true
paths:
  - src/components/ActionButton/
  - src/components/GameScreen/
  - src/components/GameOverScreen/
  - src/components/TitleScreen/
  - src/components/OverflowControls/
  - src/styles/tokens/
  - docs/design-system/components/hud/ActionButton.d.ts
```

**Interfaces**

- Produces: `ActionButton`, consumed by `M5.5e` at every flow screen.
- Produces: button edge tokens in `elevation.css`, consumed by nothing else — but
  they are the reason no raw hex enters `src/`.
- Runs beside `T35`: the two primitives share no file. `GameScreen` is touched by
  both only if `T35` needs it; it does not.

## Why

Eight `<button>` sites each repeat the same block, across four components, with
four different class names for three actual appearances. The plan's "seven copies"
undercounts; the real inventory is below.

- [ ] **Step 1: Take the variant mapping as given**

| Variant | Call sites |
|---|---|
| `primary` | Submit (`GameScreen.tsx:57`), Next Round (`:78`), Start Run (`TitleScreen.tsx:29`), Play Again (`GameOverScreen.tsx:73`), Confirm Discard (`OverflowControls.tsx:20`) |
| `secondary` | Clear (`GameScreen.tsx:66`), Share (`GameOverScreen.tsx:76`) |
| `ghost` | Copy Result (`GameOverScreen.tsx:79`) |

**Confirm Discard is `primary`.** The `.d.ts` lists it under no variant, but
`OverflowControls.jsx:60` renders `<ActionButton onClick disabled>` with no
variant and the default is `primary`. The implementation settles what the doc
comment left out.

**The two `LanguageToggle` segments are not `ActionButton`s.** They are a
`role="group"` segmented control with its own component, and they belong to
`M5.5d`. Do not touch them.

- [ ] **Step 2: Correct the contract's false claim**

`ActionButton.d.ts:8` names the `ghost` call sites as *"Copy Result, How to
Play."* There is no How to Play button. `TitleScreen.jsx` has no disclosure at all
— its `summary` prop is the pitch paragraph, not a `<summary>` element — and in
this product How to Play is a native `<details>/<summary>` that stays one. `ghost`
has exactly one call site: Copy Result.

Correct the comment. `T27` already corrected two false claims in this handover on
the same principle: a wrong doc line in a reference the next phase reads is a
defect, not a cosmetic issue.

- [ ] **Step 3: Do not inherit the reference's four defects**

`ActionButton.jsx` is the visual authority and a mechanism trap. Each of these
would read as a passing implementation:

1. **`onFocus`/`onBlur` instead of `:focus-visible`.** Fires on click-focus, so a
   clicked button shows a ring the spec withholds. Same trap as `Tile.jsx`; `T35`
   rejects it for the same reason.
2. **`onPointerDown`/`onPointerUp` mutating inline style instead of `:active`.**
   `pointerup` never fires if the pointer is released off the element, so the
   button stays visually pressed until something else repaints it. CSS `:active`
   has none of that failure mode and is less code.
3. **The press shadow `0 2px 0 #7d2d1f` is applied to every variant.** A pressed
   `secondary` gets a vermilion edge against its own green one. The pressed depth
   is shared; the colour is not.
4. **Raw hex edges** — `#7d2d1f` on `primary`, `#0e2a21` on `secondary`.

- [ ] **Step 4: Tokenise the edges**

`elevation.css` has no button edge token, and `colors.css` has no `#7d2d1f`.

- `#0e2a21` is within three values per channel of `--felt-800` (`#0b211b`).
  Reuse the token; do not add a near-duplicate.
- `#7d2d1f` has no equivalent — it is a darker step below `--verm-600` (`#b5432f`).
  Add it to the vermilion ramp.

Then declare the edges and their pressed depths in `elevation.css`, beside the tile
shadows. Two colours and two depths is four values; if one variable per variant
carries it in fewer, prefer that. Ghost has no edge at all.

- [ ] **Step 5: Build and wire**

Props per `ActionButton.d.ts`: `children` (Title Case, rendered uppercase),
`variant`, `disabled`, `onClick`, `style`.

**A disabled button is flat** — no shadow, hairline outline instead. The `.d.ts`
puts it well: *"Not yet" reads as "not raised".* Keep that intent; it is the one
place in the system where removing elevation is the message.

Wire all eight sites and delete the four class rules they used. An unwired
primitive is dead code.

Every accessible name is unchanged and several are exact-pinned: `"Submit"`,
`"Clear"`, `"Next Round"`, `"Confirm Discard"`, `"Play Again"`, `"Share"`,
`"Copy Result"`, `"Start Run"`.

**Do not touch `TitleScreen.tsx:16-17`.** The `<details>/<summary>` block is
`M5.5e`'s, and its three tests pin the element type. This task changes line 29 and
nothing else on that screen.

- [ ] **Step 6: Test the variants**

Focused tests for the three variants and the disabled state — including that a
disabled button carries no edge, and that press styling survives a pointer
released off the element (the defect 2 guard).

- [ ] **Step 7: Commit**

```bash
git add src/ docs/design-system/components/hud/ActionButton.d.ts docs/tasks/T36-action-button-primitive.md
git commit -m "feat(components): collapse every action into one button" -m "Task: T36"
```

**Acceptance criteria**

- Eight call sites render `ActionButton`; the four old class rules are gone.
- No raw hex in `src/`. Both edges resolve from tokens.
- Press and focus are CSS state selectors, not event handlers.
- A pressed `secondary` never shows a vermilion edge.
- `ActionButton.d.ts:8` no longer names How to Play.
- Every pinned label resolves unchanged; `TitleScreen`'s disclosure is untouched.
- Lint, typecheck, test and build all pass.

**What this task does not do**

- No motion. `ActionButton.jsx` animates `oz-rise-ready` when a button becomes
  enabled (ref 11d); that is `M5.5f`. Leave the hook out rather than half-wiring it.
- No decision about the vermilion primary. It collides with the system's own
  one-meaning-per-hue rule and was accepted knowingly (plan decision 5).

---
reads:
  - docs/design-system/components/game/Tile.d.ts  # the prop contract
  - docs/design-system/components/game/Tile.jsx  # the visual authority, and a mechanism trap
  - docs/design-system/components/game/AnswerSlots.jsx  # how the design composes tiles into slots
  - src/styles/tokens/elevation.css  # lines 21-39 state the focus composition and the measurements behind it
  - docs/spec/ui-i18n.md  # §1.12 accessibility, which outranks the design system
---

# T35 — Collapse the ceramic tile into one primitive

```yaml
task_id: T35
title: Build the Tile primitive and wire every ceramic call site
milestone: M5.5c — Tile and Action Primitives
priority: P1
estimate: M
wave: W1
depends_on: [T32]
parallel_safe: false
paths:
  - src/components/Tile/
  - src/components/TileInventory/
  - src/components/AnswerSlots/
  - src/components/FeedbackPanel/
```

**Interfaces**

- Produces: `Tile`, consumed by `M5.5d` (rack, slots) and `M5.5e` (feedback, game
  over). Its prop surface is the contract those phases build against, so a prop
  added later is a prop every call site has to be revisited for.
- Produces: the focus composition `M5.5b` missed. `M5.5c`'s exit gate depends on
  it, and `T37` measures it.

## Why

Three components each carry their own ceramic rule — `.tile`, the filled state of
`.slot`, and `.reward` — and all three drifted apart. `.tile` and `.reward` both
set `--surface-tile` and `--shadow-tile` but disagree on border, font size and
weight. That duplication is the reason the focus ring can be fixed in one file and
still be missing in two.

The deeper reason is the gate. `M5.5b` shipped a two-tone `--ring-focus` and no
element wears it composed onto its own edge. A `box-shadow` focus ring **replaces**
the shadow it is declared beside, so the fix has to live wherever the elevation is
declared — which, after this task, is one place instead of three.

- [x] **Step 1: Rule on the element, before writing the component**

`Tile.jsx` always renders a `<button>` and sets `disabled={!interactive}`. Its
`.d.ts` says *"Omit `onClick` to render a non-interactive tile"* — but a disabled
button is still a button, and `queryByRole("button")` finds it. Taking the
reference literally would leave `GameScreen.test.tsx:343` unsatisfiable in `M5.5e`,
which is exactly the collision F3 recorded.

The rule this task establishes:

- **`onClick` present** → `<button>`. Disabled when the caller says so; still a
  button, because `AnswerSlots.test.tsx:70` requires a disabled *filled* slot to
  stay a button and `TileInventory`'s `readOnly` mode requires the same.
- **`onClick` omitted** → a non-interactive element that is **not** a button and
  carries no `button` role. This is what `FeedbackPanel`'s reward tiles need now
  and what `M5.5e` needs to mount answer slots through feedback.

A decorative tile has no accessible name to give — its digit is its content. Do not
put `aria-label` on a roleless element; either let the digit be the text, or give
the element a role that can carry a name.

- [x] **Step 2: Leave the empty answer slot alone**

It is a socket, not a tile: `--surface-socket`, `--shadow-socket`, a dashed rim,
and no ceramic anywhere. The design draws it as a `role="img"` div
(`AnswerSlots.jsx`), which this port **cannot** adopt — `AnswerSlots.test.tsx:51`,
`:81` and `GameScreen.test.tsx:328` all assert `Answer slot N: empty` is a disabled
**button**, and role plus accessible name are load-bearing assertions that do not
get weakened to go green.

So `Tile` collapses `.tile`, `.reward`, and the *filled* state of `.slot`. The
empty state keeps its own rule in `AnswerSlots.module.css`. Say so in the CSS
rather than leaving the next reader to rediscover why one of four cases stayed
behind.

- [x] **Step 3: Build the primitive**

Props per `Tile.d.ts`: `digit`, `size` (`lg` 64×80 / `sm` 30×38), `state`
(`resting | lifted | reward | marked | disabled`), `onClick`, `label`, `style`.

**`digit` stays `number`.** `TitleScreen.jsx:46` passes the ✳ brand mark as a tile
face, which its own `.d.ts` (`digit: number`, `0-9`) forbids. Widening the
primitive's contract for one decorative call site inverts the dependency; `M5.5e`
can draw the mark from the same tokens without claiming to be a `Tile`.

There are **no badge props**. `.newBadge`, `.discardBadge` and `.rewardBadge` stay
with their current owners — `Tile` renders a digit, and the badge is the caller's.

*Cracking is not a tile state.* It lives on `AnswerSlots` (`readme.md` says
otherwise; the `.d.ts` wins, and `AnswerSlots.jsx` confirms it by passing an
animation through `style`).

Write it as a CSS Module, not inline styles. A missing module key renders
`class="undefined"` with no error — see `docs/journal/journal-2026-08-09.md` — so
prove every state's class resolves.

- [x] **Step 4: Compose the focus ring onto the edge, through `:focus-visible`**

`src/styles/tokens/elevation.css:21-39` already states the answer and the
measurements behind it:

```css
box-shadow: var(--shadow-tile), var(--ring-focus)
```

Each size owns its own edge — `--shadow-tile` for `lg`, `--shadow-tile-sm` for
`sm` — and each state may replace it (`--shadow-tile-lifted` for `lifted` and
`marked`). The ring composes onto **whatever edge that state draws**, never instead
of it.

**Use `:focus-visible`, not `onFocus`/`onBlur`.** `Tile.jsx` wires the composition
through focus handlers, which fire on click-focus too, so a clicked tile shows a
ring the spec deliberately withholds. That divergence would read as a passing
measurement while shipping a defect. It is the single most important line in this
task.

- [x] **Step 5: Wire all three call sites**

`TileInventory` (rack tile, `aria-pressed` in discard mode), `AnswerSlots` (filled
slot only), `FeedbackPanel` (reward tile inside its `<li>`). An unwired primitive
is dead code, and the duplication this task exists to remove is only removed once
the old rules are gone. Delete them; do not leave them beside the new one.

Every accessible name is unchanged: `/^Digit \d$/`, `/New tile$/`,
`/^Answer slot \d: \d$/`, `Answer slot N: empty`.

- [x] **Step 6: Test the states**

Focused tests for all five states plus both sizes, and for the element rule in
step 1 — that omitting `onClick` yields no `button` role, and that a disabled tile
with `onClick` still exposes one. The second half is what stops a later phase from
"simplifying" the rule back into the reference's shape.

- [x] **Step 7: Commit**

```bash
git add src/components/ docs/tasks/T35-tile-primitive.md
git commit -m "feat(components): collapse the ceramic tile into one primitive" -m "Task: T35"
```

**Acceptance criteria**

- One ceramic rule exists in `src/`. `.tile`, `.reward` and the filled `.slot` rule
  are gone, not shadowed.
- `Tile` renders a `<button>` only when `onClick` is given; a disabled tile with
  `onClick` is still a button.
- The empty answer slot is still a disabled button named `Answer slot N: empty`.
- Focus composes onto the state's own edge via `:focus-visible`, at every size.
- Every pinned accessible name resolves unchanged.
- Lint, typecheck, test and build all pass.

**What this task does not do**

- No `liftedIds` derivation — that is `M5.5d`, and `Tile` only needs to accept
  `state="lifted"`.
- No motion. `reward` and `marked` reference animations `M5.5f` wires; a state that
  has no keyframe yet simply has none.
- No badge contrast fix. The gold-on-ceramic badges owe `4.5:1` and do not have it,
  but they belong to their callers — `M5.5d` and `M5.5e`.

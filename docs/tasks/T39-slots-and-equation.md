---
reads:
  - docs/design-system/components/game/AnswerSlots.d.ts  # slot states
  - docs/design-system/components/game/EquationBoard.d.ts  # the round's largest type
  - src/components/TileInventory/  # T38's socket, which this reuses
---

# T39 — Dress the answer slots and the equation

```yaml
task_id: T39
title: Give the slots their socket and the equation its display type
milestone: M5.5d — Board Surfaces
priority: P1
estimate: S
wave: W2
depends_on: [T38]
parallel_safe: true
paths:
  - src/components/AnswerSlots/
  - src/components/EquationBoard/
```

**Interfaces**

- Consumes `T38`'s socket treatment. Runs beside `T40` and `T41`; the three share
  no file.

## Why

The equation is the largest type in the app and currently renders at the same
weight as body copy. The answer slots already carry a socket from `M5.5c` but
still wear the placeholder dashed border rather than the system's own rim.

- [ ] **Step 1: The empty slot wears the system's rim**

`M5.5c` left `.slot` as `--surface-socket` plus `--shadow-socket` and a `2px
dashed var(--text-meta)` border. The system's empty-slot rim is
`--border-slot-empty` — dashed gold at `75%`, the awaiting-input cue.

The existing comment on that rule explains why `--text-meta` was chosen: an empty
slot sits on `--surface-socket` with no fill contrast of its own, so the border is
the only cue defining its shape and needs to stay legible. **That reasoning still
binds.** `--border-slot-empty` is `rgba(201, 165, 74, 0.75)`; confirm it clears
`3:1` against `--surface-socket` before adopting it, and say what you measured. If
it does not, keep the current border and record why — the rim is a preference,
the contrast floor is not.

Reuse `T38`'s socket rather than writing a second one. If the two sockets end up
differing, one of them is wrong.

- [ ] **Step 2: The equation gets the display type**

`--size-equation` is `68px` on `--font-numeral` (the display serif). This is the
round's headline and the design's largest type.

**Do not split the operands.** `EquationBoard.tsx` renders
`{equation.left} × {equation.right} =` inside one `<p>`, and `getByText("3 × 4 =")`
matches the element whose own text equals that string. Wrapping either operand in
a `<span>` breaks that test and the ones in `App.test.tsx:242` and
`GameOverScreen.test.tsx:43`. Style the paragraph; do not restructure it.

At `320px` a `68px` equation with two operands and an `=` has to fit. Check it,
and step the size down at the narrow tier if it does not — `§8.5` forbids
horizontal scroll at `320px`, and that outranks the type scale.

- [ ] **Step 3: Test**

- The empty slot keeps role `button`, stays disabled, and keeps the name
  `Answer slot N: empty`.
- `getByText("3 × 4 =")` still resolves.
- No horizontal scroll at `320px` with a two-digit equation.

- [ ] **Step 4: Commit**

```bash
git add src/components/ docs/tasks/T39-slots-and-equation.md
git commit -m "feat(board): dress the answer slots and the equation" -m "Task: T39"
```

**Acceptance criteria**

- One socket treatment shared with the rack, not two.
- Any change to the slot rim carries a measured contrast figure.
- The equation renders as one text node; every pinned equation string resolves.
- Lint, typecheck, test and build all pass.

**What this task does not do**

- No crack, bloom or streak ring. Those are `AnswerSlots`' feedback states and
  belong to `M5.5e` and `M5.5f`.

---
reads:
  - docs/design-system/components/hud/GameHud.d.ts  # round, score, streak — in that order, always
  - docs/design-system/components/hud/CapacityMeter.d.ts  # the intentional addition
  - docs/spec/product.md  # §1.10, where round keeps primary emphasis
  - docs/spec/ui-i18n.md  # §1.14 carries hud.capacity already
---

# T40 — Dress the HUD and add the capacity meter

```yaml
task_id: T40
title: Give the HUD its type and add the ten-pip capacity meter
milestone: M5.5d — Board Surfaces
priority: P1
estimate: M
wave: W2
depends_on: [T38]
parallel_safe: true
paths:
  - src/components/GameHud/
  - src/components/CapacityMeter/
  - src/components/GameScreen/
```

**Interfaces**

- Produces: `CapacityMeter`, the milestone's one genuinely new component.
- Runs beside `T39` and `T41`. It touches `GameScreen` only to mount the meter —
  coordinate if `T38`'s derivation is still in flight.

## Why

`§1.10` gives the HUD a capacity read-out: the rack's ten sockets show how full
you are only if you can see the rack, and the meter is the persistent read. It is
an intentional addition, not a port — `CapacityMeter.d.ts` says so.

- [ ] **Step 1: The meter goes beside the `<dl>`, not inside it**

**Ruling, so nobody has to guess.** `GameHud` stays a `<dl>` — the test policy
pins that element type, and `GameHud.d.ts` carries only score, streak and round.
A ten-pip row is not a term and a definition, so it is not a `<div class="entry">`
with a `<dt>`/`<dd>` pair. `CapacityMeter` is its own component, mounted as a
sibling in the HUD region.

`§1.10`'s "the HUD gains the capacity meter" means the region, not the list.

- [ ] **Step 2: Do not disturb what the tests hold**

Three separate pins, all load-bearing:

- **`App.test.tsx:119`** pins Round → Score → Streak by `compareDocumentPosition`.
  Appending is safe; inserting between them is not.
- **`App.test.tsx:139`** and **`GameOverScreen.test.tsx:73`** read
  `getByText(...).nextElementSibling` and need `.primary` to keep winning a
  specificity tie — `dd.primary` against `.entry dd`, both `(0,1,1)`, decided by
  source order alone. Adding a rule that also matches those `<dd>`s can flip it
  silently, and nothing will fail loudly.
- **Round keeps primary emphasis.** Spec-locked in `§1.10` *and* test-pinned. The
  meter must not out-shout it — it is a read-out, not a stat.

- [ ] **Step 3: Build the meter**

`held: number` (0–11; 11 only mid-overflow) and `label?: string`, defaulting to the
localised `hud.capacity`, which already exists in `§1.14`'s copy table in both
locales. Ten pips: filled to `held`, empty beyond it.

**Eleven held is a real state**, not a guard clause — `INVENTORY_CAPACITY` 10 plus
`REWARD_BONUS` 1 reaches it every time a reward overflows. Decide what the
eleventh pip looks like and say so in the CSS; do not let it silently render a
tenth pip and lose the overflow.

Gold is the hue for capacity (`§1.12`: *"Gold marks brand, capacity, and
reward"*). Vermilion means a tile is leaving — if the meter turns vermilion near
full, that is a new meaning for the hue and needs stating, not assuming.

**Colour alone may not carry it** (`§1.12`). The pip count is the shape cue and
the label is the text cue; make sure a filled pip differs from an empty one by
more than hue.

- [ ] **Step 4: The HUD's own type**

`GameHud.d.ts`: *"Renders gold above zero"* for streak. Labels are Title Case in
source, uppercased by CSS — do not uppercase the strings, or `getByText("Round")`
stops resolving.

- [ ] **Step 5: Test**

- The meter reports held counts of 0, 10 and 11 distinctly.
- Round, Score, Streak markup order unchanged.
- `.primary` still wins its tie — assert the computed font-size the way
  `App.test.tsx:139` does, so a specificity regression fails here too.

- [ ] **Step 6: Commit**

```bash
git add src/components/ docs/tasks/T40-hud-and-capacity.md
git commit -m "feat(hud): add the capacity meter and dress the read-out" -m "Task: T40"
```

**Acceptance criteria**

- HUD is still a `<dl>`; the meter is a sibling, not an entry.
- Round retains primary emphasis, verified by computed size, not by eye.
- Eleven held renders distinguishably from ten.
- Filled and empty pips differ by more than colour.
- Lint, typecheck, test and build all pass.

**What this task does not do**

- No streak-tier rings or counter-fall motion — `M5.5f`.

---
reads:
  - docs/journal/journal-2026-09-05.md  # T37's method, and the three ways it lied first
  - docs/journal/journal-2026-08-12.md  # "Narrative is not evidence"
  - docs/checklists/quality.md  # §8.5
---

# T42 — Prove the board holds at every tier

```yaml
task_id: T42
title: Produce the measured evidence M5.5d's exit gate asks for
milestone: M5.5d — Board Surfaces
priority: P1
estimate: S
wave: W3
depends_on: [T38, T39, T40, T41]
parallel_safe: false
paths:
  - docs/journal/
```

**Interfaces**

- Consumes everything `M5.5d` landed.
- Produces the numbers the PR body carries and `M5.5g` re-walks.

## Why

The gate: *"Rack holds ten sockets at every tier; a selected tile keeps its
socket; round retains primary emphasis."* CI proves none of the three. Two are
geometry and one is a computed style, and the token layer never enters the test
graph.

- [x] **Step 1: Ten sockets at three tiers, and the boundary between them**

Count rendered cells at `320`, `408` and `768` CSS pixels wide, at one tile held
and at ten. Ten every time. Report the rack's measured width at each tier against
the viewport — the narrow tier needs `292px` of the `296px` a `320px` viewport
leaves once the arena spends `24px` on its own padding, and the middle tier needs
`378px` of the `384px` a `408px` viewport leaves.

**The middle tier's lower bound moved from `400px` to `408px` during this
milestone, and this step is what re-checks it.** `T38` made the rack a fixed
five-column grid, and a fixed grid overflows where the old `flex-wrap` silently
wrapped: at `400px` the tier needed `378px` against `376px` available. Measure at
`407` and `408` specifically — `407` must still be on the narrow tier and `408`
must fit — because an off-by-one here restores exactly the defect that was fixed.

- [x] **Step 2: A selected tile keeps its socket**

The gate's real claim is *no reflow*. Record every tile's bounding box before and
after a select, and require the untouched tiles to be **identical**, not merely
close. This is the failure `decisions.md` calls the one this screen cannot afford,
and "it looks fine" has never detected it.

Do the same across a return and a clear.

- [x] **Step 3: Round retains primary emphasis**

Computed font-size of round's `<dd>` against score's and streak's. It rests on a
specificity tie decided by source order (`dd.primary` vs `.entry dd`, both
`(0,1,1)`), so a rule added anywhere in the cascade can flip it with nothing
failing. Read it, do not infer it.

- [ ] **Step 4: The language toggle's ring, on gold**

`T41` owns the fix; this step is the independent read. `T37` measured this control
at `11.85:1` only because its ring was **outset** and landed on the felt. Once it
is inset, the backdrop is the gold active segment where D1 measured `1.51:1` for
gold-on-gold.

Report both tones against **both** segments, from pixels, scanning from outside
the border box inward. If `T41`'s own number and this one disagree, the
disagreement is the finding.

`T41` reported `11.85:1` for gold on the inactive segment and `5.68:1` for the
dark tone on the gold active segment. **Do not read those numbers before taking
your own** — measure first, then compare. Note also what they mean: on the gold
segment the gold band is invisible at `1.51:1`, so the whole indicator is the
`1px` dark line the composition leaves at `3px` inset. It clears `SC 1.4.11`,
which is the gate. Say how thick the visible band actually is, so the record
carries what passed rather than only that it passed.

- [x] **Step 5: No horizontal scroll at 320px**

`documentElement.scrollWidth` against `clientWidth`, plus a sweep for any element
whose right edge exceeds the viewport. The equation is the new risk —
`--size-equation` is `68px` and `T39` may have stepped it down at the narrow tier.
Check `answering`, `feedback` and `overflow`, and check the Korean locale: Hangul
sets wider at the same nominal size, and `§1.12` already gives `ko` its own
`--size-label` for that reason.

- [x] **Step 6: Eleven held**

The transient state every reward overflow passes through. The rack renders eleven
cells and the capacity meter distinguishes eleven from ten. Both are easy to lose
because neither is a resting state anyone looks at.

- [x] **Step 7: Record it** — see `docs/journal/journal-2026-09-06.md`, "T42, part A".

A journal entry carrying the numbers and anything that surprised you.

**Acceptance criteria**

- Every claim is a number or a log line, not a sentence.
- The no-reflow check compares boxes, not impressions.
- The toggle's ring is reported per tone against the gold segment.
- Any claim that could not be measured is stated as unmeasured, not softened.

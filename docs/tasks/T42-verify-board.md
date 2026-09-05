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

- [ ] **Step 1: Ten sockets at three tiers**

Count rendered cells at `320`, `400` and `768` CSS pixels wide, at one tile held
and at ten. Ten every time. Report the rack's measured width at each tier against
the viewport — `§1.12` fixes five tiles plus four gaps at `292px` inside `320px`
and `378px` inside `400px`, and those figures leave room for the arena's padding
by a margin small enough to lose.

- [ ] **Step 2: A selected tile keeps its socket**

The gate's real claim is *no reflow*. Record every tile's bounding box before and
after a select, and require the untouched tiles to be **identical**, not merely
close. This is the failure `decisions.md` calls the one this screen cannot afford,
and "it looks fine" has never detected it.

Do the same across a return and a clear.

- [ ] **Step 3: Round retains primary emphasis**

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

- [ ] **Step 5: No horizontal scroll at 320px**

`documentElement.scrollWidth` against `clientWidth`, plus a sweep for any element
whose right edge exceeds the viewport. The equation is the new risk —
`--size-equation` is `68px` and `T39` may have stepped it down at the narrow tier.
Check `answering`, `feedback` and `overflow`, and check the Korean locale: Hangul
sets wider at the same nominal size, and `§1.12` already gives `ko` its own
`--size-label` for that reason.

- [ ] **Step 6: Eleven held**

The transient state every reward overflow passes through. The rack renders eleven
cells and the capacity meter distinguishes eleven from ten. Both are easy to lose
because neither is a resting state anyone looks at.

- [ ] **Step 7: Record it**

A journal entry carrying the numbers and anything that surprised you.

**Acceptance criteria**

- Every claim is a number or a log line, not a sentence.
- The no-reflow check compares boxes, not impressions.
- The toggle's ring is reported per tone against the gold segment.
- Any claim that could not be measured is stated as unmeasured, not softened.

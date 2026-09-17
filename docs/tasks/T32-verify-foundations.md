---
reads:
  - docs/journal/journal-2026-08-12.md  # "Narrative is not evidence"
  - docs/checklists/quality.md  # §8.5
---

# T32 — Prove the foundations with measurements

```yaml
task_id: T32
title: Produce the measured evidence M5.5b's exit gate asks for
milestone: M5.5b — Foundations and Identity
priority: P1
estimate: S
wave: W2
depends_on: [T29, T30, T31]
parallel_safe: false
paths:
  - docs/journal/
```

**Interfaces**

- Consumes: everything M5.5b landed.
- Produces: the numbers the PR body carries, and the ones M5.5g re-walks.

## Why

The roadmap's exit gate for this milestone is four claims, and CI proves none of
them: `lint → typecheck → test → build` catches no design regression. Three of
the four cannot be a `vitest` assertion at all, because `global.css` is imported
only by `main.tsx` and `gallery/main.tsx` and never enters the test graph.
Following `journal-2026-08-12.md`: narrative is not evidence. Measure in-page.

- [ ] **Step 1: Zero non-origin requests**

Build, then confirm no stylesheet or emitted asset references a non-origin URL,
and that every `@font-face` `src` resolves to `/assets/`. Load a full run and
read the network log for third-party origins rather than asserting from the
source.

- [ ] **Step 2: Weight per locale**

Report the woff2 bytes an English run fetches and the bytes a Korean run adds.
Note that `@fontsource` ships `.woff` beside `.woff2` and Vite emits both, so
`dist/` size and network cost differ — give both numbers rather than the
flattering one.

- [ ] **Step 3: Korean renders in a Hangul-capable face**

Not `document.fonts.check()`: it answers whether the text can be rendered at
all, counting fallbacks, so it returns `true` with no Hangul face present.
Measure rendered width instead. In a browser, render one Hangul string three
ways — under the app's own `var(--font-ui)` stack, under an explicit
`"Noto Sans KR"`, and under a family name that does not exist — and require the
app's stack to match the explicit Noto width and to differ from the absent
family's fallback width. Then require `Noto Sans KR 400` to enter
`document.fonts` only after the locale switches to `ko`. jsdom answers neither
half.

- [ ] **Step 4: Focus indicator ≥ 3:1**

Measure what is drawn, not what is defined. A token can be correct and worn by
nothing, and a step that reads the token definition cannot see that. Walk the
tab order in a browser rather than listing the controls from memory, and reach
each control with `Tab`: a control focused by a click does not match
`:focus-visible`, so a click-then-measure returns the same blank as a missing
ring.

**Read both terms of the ratio from pixels.** Compute it from the indicator as
rendered against the backdrop as rendered — neither term from a token value, and
neither from a computed style. A computed background answers only which element
paints at a point, and both terms escape it. The backdrop does because a
`box-shadow` with no blur puts a hard band of colour outside the border box that
`elementsFromPoint` reports as transparent, so the reading resolves past it to
whatever lies further behind. The indicator does because an outline is painted
with its own element, so anything drawn after it — a neighbour's shadow, a later
sibling in the same stacking context — lands on top of the indicator and changes
its colour too. Screenshot the control focused and unfocused, diff the two at the
same coordinates to find the band the indicator occupies, then read the
indicator's colour from the focused image and the backdrop from the unfocused
image at those same coordinates.

Report the control, the band it occupies, what that band lands on per edge, the
indicator's rendered colour wherever it differs from the token, and the ratio.
Edges of one control can differ, and so can instances of one control.

- [ ] **Step 5: One animation resolves**

The keyframes-not-in-a-module guard. Confirm an `oz-*` keyframe name resolves
from a component's scope — this is the failure the whole partial layout exists to
prevent, and it is invisible to every other gate.

- [ ] **Step 6: No horizontal scroll at 320px**

`documentElement.scrollWidth` against `clientWidth`, plus a sweep for any element
whose right edge exceeds the viewport. Check the rack holds ten sockets at each
of the three tiers.

- [ ] **Step 7: Record it**

A journal entry carrying the numbers and anything that surprised you.

**Acceptance criteria**

- Every claim above is a number or a log line, not a sentence.
- Any claim that could not be measured is stated as unmeasured, not softened.

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

`document.fonts.check()` against a Hangul string, in a browser, after switching
the locale to `ko`. jsdom cannot answer this.

- [ ] **Step 4: Focus indicator ≥ 3:1**

The ratios are already computed from the committed token values and recorded in
`docs/design-system/tokens/elevation.css`. Cite them; do not re-derive them.
Confirm the shipped `--ring-focus` is the two-tone bezel.

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

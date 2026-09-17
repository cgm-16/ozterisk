---
reads:
  - docs/superpowers/specs/2026-08-09-endless-mode-polish-design.md  # §3.5 motion and hairline tokens
  - docs/plan/tuning-and-design-system.md  # §2.1 visual layer audit
  - docs/spec/ui-i18n.md  # §1.12 motion and reduced-motion contract
---

# T19 — Motion and hairline tokens

```yaml
task_id: T19
title: Tokenize duration, easing, press offset, and hairline width
milestone: M4 — Endless Polish and Tuning Surface
priority: P1
estimate: S
wave: W0
depends_on: []
parallel_safe: true
paths:
  - src/styles/global.css
  - src/components/AnswerSlots/AnswerSlots.module.css
  - src/components/GameScreen/GameScreen.module.css
  - src/components/GameOverScreen/GameOverScreen.module.css
  - src/components/OverflowControls/OverflowControls.module.css
  - src/components/LanguageToggle/LanguageToggle.module.css
  - src/components/TitleScreen/TitleScreen.module.css
  - src/components/TileInventory/TileInventory.module.css
  - src/components/FeedbackPanel/FeedbackPanel.module.css
```

> `FeedbackPanel.module.css` has **no** transition — it is in scope only for
> the hairline token at line 44, which uses `var(--color-reward)` rather
> than `var(--color-border)`. Seven modules duplicate motion; five hairlines
> are in scope across those modules.

**Interfaces**

- Produces the CSS custom properties below, consumed by T18's Clear button
  and filled-slot affordance.

## Why

`global.css` already defines 25 tokens and **no module hardcodes a color** —
the discipline exists. But the most feel-critical values are the least
tokenized: `150ms ease`, `100ms ease`, and `translateY(1px)` are
copy-pasted across **7 modules**, so retuning how a button press feels means
editing seven files and keeping them consistent by hand. A hairline
`1px solid` repeats across five — four with `var(--color-border)`, one with
`var(--color-reward)`.

- [ ] **Step 1: Add the tokens**

In the `:root` block of `src/styles/global.css`, after `--tile-size`:

```css
/* Motion. The reduced-motion block below neutralizes these wholesale; they
   exist so press feel is retuned in one place rather than seven. */
--duration-fast: 100ms;    /* press / transform response */
--duration-base: 150ms;    /* color and border state changes */
--ease-standard: ease;
--press-offset: 1px;       /* :active translateY */

--border-hairline: 1px;    /* the repeated 1px solid border */
```

- [ ] **Step 2: Substitute across the 7 modules**

Mechanical, one pattern:

- `150ms ease` → `var(--duration-base) var(--ease-standard)`
- `100ms ease` → `var(--duration-fast) var(--ease-standard)`
- `translateY(1px)` → `translateY(var(--press-offset))`
- `1px solid <color>` → `var(--border-hairline) solid <color>` — keep each
  site's existing color var. Four use `--color-border`;
  `FeedbackPanel.module.css:44` uses `--color-reward` and changes width
  only.

Leave `2px dashed` in `AnswerSlots.module.css:19` alone — the empty-slot
border is a deliberate 2px, not the hairline.

**Pure substitution: there must be no visual diff.** Do not retune any value
in this task. Retuning is a separate `tune(...)` commit per
`docs/plan/github.md` §4.5.

- [ ] **Step 3: Verify no value changed**

```bash
git diff -U0 -- 'src/**/*.module.css' | grep '^[+-]' | grep -vE '^[+-]{3}'
```

Every `+` line must be the `var(...)` form of the `-` line directly above
it. Any changed number is a mistake.

- [ ] **Step 4: Confirm nothing was missed**

```bash
grep -rnE '[0-9]+ms|translateY\(1px\)|1px solid' src/components src/app
```

Expected: no matches outside `global.css`.

- [ ] **Step 5: Verify reduced-motion still wins**

```bash
npm run dev
```

`global.css:98-114` overrides `transition-duration` and
`*:active { transform }` with `!important`, so tokenizing the source values
cannot weaken it — but confirm rather than assume. Enable the OS
"reduce motion" setting, press a button, and check no transform offset
occurs. Then check a normal press still animates with reduce-motion off.

- [ ] **Step 6: Verify**

```bash
npm test && npm run typecheck && npm run lint && npm run build
```

CSS Modules are compiled during tests (`vite.config.ts` sets
`test.css: true`), so a malformed rule surfaces here.

- [ ] **Step 7: Commit**

```bash
git add src/styles/global.css src/components/*/*.module.css
git commit -m "refactor(styles): tokenize motion, press offset, and hairline width" -m "Task: T19"
```

**Acceptance criteria**

- Press feel is retunable from one place.
- No rendered value changed; the diff is substitution only.
- No duration, press offset, or hairline literal remains outside
  `global.css`.
- `prefers-reduced-motion` behaviour is unchanged, verified in a browser.

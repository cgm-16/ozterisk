---
reads:
  - docs/design-system/components/flow/GameOverScreen.prompt.md  # the chop, and what score is not
  - docs/design-system/components/flow/GameOverScreen.jsx  # the visual authority
  - src/components/GameOverScreen/GameOverScreen.test.tsx  # what is pinned
---

# T47 — Give the end of a run a sense of closure

```yaml
task_id: T47
title: Rebuild the game-over screen's hierarchy and stamp the share chop
milestone: M5.5e — Flow Screens
priority: P1
estimate: L
wave: W1
depends_on: [T43]
parallel_safe: true
paths:
  - src/components/GameOverScreen/
  - src/i18n/messages.ts
```

**Interfaces**

- Runs beside `T44`, `T45` and `T46`. Shares `src/i18n/messages.ts` with `T44`,
  which works only in the `title.*` and `howToPlay.*` namespaces. Stay inside
  `gameOver.*` and `share.*`.
- `T48` lands on this file afterwards, adding the restart hint. Leave it a place
  to sit — Step 5.

## Why

Issue #51 is the full brief and it is worth reading. The short version: the screen
ends a run and reads as a form.

**A warning about that issue.** Its "Constraints" section quotes §1.12 as it stood
before `M5.5a` — "minimal number-board aesthetic", "No particles, screen shake,
decorative motion, or audio". `M5.5a` struck that clause wholesale and replaced it
with the sixteen-moment named inventory. **Read §1.12 as it is now, not as #51
quotes it.** Everything else in the issue stands.

Four defects, all measured, all in `GameOverScreen.module.css`:

- [ ] **Step 1: Three focal points become one**

A `2.5rem` `Game Over` title, an `EquationBoard` styled exactly as it is
mid-round, and a stat row — stacked, centered, all shouting.

The equation reads so much like a live prompt that #42 had to add a reason line
beside it to defuse it. **That was a layout symptom patched with copy.** Make the
equation obviously terminal by its own treatment, and the reason line then
supports it instead of rescuing it.

**F2 is binding here and it is easy to break.** `GameOverScreen.test.tsx:43`
(`"7 × 8 ="`) and `App.test.tsx:242` (`"9 × 9 ="`) use `getByText`, which matches
the element whose **own** text equals the string. Whatever treatment you give the
terminal equation, the reason line stays a **sibling** — never a wrapper that also
carries text, never a container whose own text content becomes
`"7 × 8 = Not enough tiles left to answer."`. The current markup already satisfies
this; a redesign that wraps them in a labelled block breaks it.

- [ ] **Step 2: The stat row ranks its own stats**

Rounds played is Endless's win condition. Today it gets `1.5rem` against `1.25rem`
for score and streak, over three identical `0.75rem` uppercase labels. **A
`0.25rem` delta is not a hierarchy** — the headline number reads as one of three
equal chips.

Two constraints on how you fix it:

1. **Resolve the specificity tie rather than annotating it.** `dd.primary` and
   `.entry dd` are both `(0,1,1)`, so source order alone decides. The comment
   documenting that is honest but the arrangement is fragile. Make `.primary` win
   on its own merits.
2. **`<dt>` and `<dd>` stay adjacent siblings.** `GameOverScreen.test.tsx:73` and
   `App.test.tsx:139` both read `getByText(label).nextElementSibling` and compare
   computed font sizes. Wrapping the value in any element breaks them, and they
   are the guard that catches a `.primary` rule that lost the cascade — exactly
   what you are changing. Keep the `<dl>`; keep the Rounds → Score → Streak
   markup order that `:60` pins.

Rounds must still compute larger than score when you are done. That is the test,
and it is the point.

- [ ] **Step 3: The primary action dominates**

`Play Again`, `Share` and `Copy Result` all carry `min-width: var(--tile-size)` in
one wrapping flex row, so `Play Again` never leads. `M5.5c` already gave them
three distinct variants — `primary`, `secondary`, `ghost`. Let the variants do the
work instead of a uniform min-width, and lay them out so the primary reads first.

`44 × 44` still binds on all three.

- [ ] **Step 4: The share confirmation becomes visible — the chop**

`.status` is a bare muted `<p>` with `min-height: 1.25em`. Copying is the one
action with no other feedback, and this invisible line is what confirms it.

The design's answer is a vermilion **chop** bearing `✳` that stamps in, holds, and
fades over `--dur-share` (`900ms`). This is ref `11C`, which is in §1.12's
permitted inventory — it is not decorative motion and does not need an amendment.

**Scope ruling, so this does not fall between two milestones:** `T47` builds the
**structure** — the chop element, the state that shows it, its placement, and its
static appearance. `M5.5f` animates it. `src/styles/tokens/keyframes.css` is
`M5.5f`'s file and has no chop keyframe yet; do not add one, and do not leave a
`animation:` referencing a name that does not exist. A CSS animation naming a
missing keyframe fails silently.

**The `role="status"` region stays.** A visual chop is not an accessible
confirmation. `share.copied` and `share.failed` keep announcing through
`aria-live="polite"`, and the existing tests on that region do not weaken. The
chop is reinforcement — §1.12: colour plus text or shape, never colour alone.

Keep the `"shared"` outcome rendering no inline message; the comment in
`GameOverScreen.tsx` explains why and it is still true.

- [ ] **Step 5: Leave the restart hint a place to sit**

`T48` binds restart to `R` and adds `gameOver.restartHint` (the copy row `T43`
added to §1.14). #51 is explicit that where that hint sits **without adding a
fourth focal point** is a layout call, and that it belongs with this redesign.

Make the call here and say what you decided, even though `T48` writes the string
in. If you conclude it belongs beside the `Play Again` button rather than as its
own line, say that — a decision recorded is what `T48` needs; a gap left silently
is not.

- [ ] **Step 6: Test**

- Every existing test in `GameOverScreen.test.tsx` and the game-over tests in
  `App.test.tsx` pass **unchanged**, except where a class name or colour is
  asserted — and none of them assert either.
- Add: the chop appears after a successful copy and the `role="status"` region
  still announces `share.copied`.

Behavioural claims owe jsdom tests. **Appearance does not** — jsdom performs no
layout, so an assertion about a rendered dimension or font metric cannot fail
there. The computed-font-size tests are the exception and they work only because
`vite.config.ts` sets `test: { css: true }`; they compare two values from the same
stylesheet rather than asserting a pixel. Measure the rest against real pixels and
put the figures in the commit message.

- [ ] **Step 7: Commit**

```bash
git add src/components/GameOverScreen/ src/i18n/messages.ts docs/tasks/T47-game-over-screen.md
git commit -m "feat(game-over): rank the run's numbers and stamp the share chop" -m "Task: T47"
```

**Acceptance criteria**

- One focal point; the terminal equation reads terminal without the reason line
  carrying it.
- `getByText("7 × 8 =")` and `getByText("9 × 9 =")` both still resolve — F2 held.
- `<dt>`/`<dd>` still adjacent siblings; rounds still computes larger than score;
  `.primary` no longer depends on source order to win.
- `Play Again` visually leads; all three targets clear `44 × 44`.
- The chop is present and static; no `animation:` naming a keyframe that does not
  exist; `role="status"` intact and still announcing.
- The restart hint's placement is decided and recorded for `T48`.
- Lint, typecheck, test and build all pass.

**What this task does not do**

- No keyboard code and no `App.tsx`. `T48` owns both.
- No keyframes. `M5.5f` owns `keyframes.css` and the chop's animation.
- Does not touch `docs/archive/complete-plan.md` — it is a frozen snapshot.

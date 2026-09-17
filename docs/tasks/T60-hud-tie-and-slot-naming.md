---
reads:
  - docs/journal/journal-2026-09-07.md  # T47's fix to the identical tie next door
  - src/components/FeedbackPanel/FeedbackPanel.tsx  # the status region this task extends
---

# T60 — Win the HUD tie on specificity, and say the answer where an answer belongs

```yaml
task_id: T60
title: Close the two defects M5.5e reported and could not reach
milestone: M5.5g — Visual Verification
priority: P2
estimate: S
wave: W2
depends_on: [T57]
parallel_safe: true
paths:
  - src/components/GameHud/
  - src/components/FeedbackPanel/
```

**Interfaces**

- Owns `GameHud/**` and `FeedbackPanel/**`. `T58` and `T59` run alongside and
  touch neither.
- Both halves were **found and reported** by earlier phases that could not fix
  them, because each sat outside the reporting phase's owned paths. This is the
  phase that owns them.

## Why — part 1, #94

`GameHud.module.css:39` has `dd.primary` at `(0,1,1)` against `.entry dd` at
`(0,1,1)`. **Nothing but source order separates them**, and the comment above
the rule says so rather than fixing it. `T47` removed the identical twin of
this rule in `GameOverScreen.module.css`; this one survived because it sat
outside `M5.5e`'s paths.

Low risk, not zero. `App.test.tsx:139` reads the computed font size *through*
the tie, so a reordering that broke it would fail CI — which is why the tie has
survived. **The cost of leaving it is that the guard is a test rather than the
cascade**, and a specificity loss is one of the two silent-failure classes this
milestone has been guarding against since `journal-2026-08-09.md`.

One-line fix, the way `T47` did it next door. Match that shape rather than
inventing a second one.

`product.md:155` is spec-locked here: *"Round carries primary emphasis."* The
fix must make that survive on its own specificity, not merely keep passing.

## Why — part 2, #95

`M5.5e` mounts the answer slots through feedback so `M5.5f`'s bloom and crack
have something to play on. In that read-only form the slots carry no `button`
role — required, and `GameScreen.test.tsx` pins the absence, since a disabled
button is still a button.

A filled read-only slot therefore announces only its **bare digit**, because
`Tile`'s roleless form deliberately drops `label`. `T46` reported that as an
asymmetry against the empty socket, which keeps its full name via `role="img"`.
`T49` narrowed it: the named empty branch is **unreachable through play**,
because `isSubmissionReady` requires every slot filled, so a submitted answer
never has an empty slot. That branch exists only for tests.

**The half that matters is elsewhere.** `FeedbackPanel`'s status region repeats
the submitted value on the *incorrect* branch (`Your answer: 21`) and not on
the *correct* one, which shows only the verdict and the reward tiles. So **on a
correct answer, the anonymous slot digits are the only place the submitted
answer appears at all.**

**Ruling: take the second of the two shapes the issue names** — have the
correct branch's status region state the submitted value, and leave the `Tile`
primitive alone.

Three reasons, and the third is the one that decides it:

1. The status region is where an outcome belongs. Positioned digits in a slot
   group are a worse channel for it than a sentence in a live region.
2. It is the smaller change. The alternative modifies the shared `Tile`
   primitive and the comment recording why its roleless form drops `label` —
   blast radius across three call sites for a fix needed at one.
3. **It needs no spec amendment.** `result.submitted` (`Your answer: {value}`
   / `제출한 답: {value}`) is already in §1.14's required-copy table at line
   119 and already implemented at `messages.ts:59`. The correct branch reuses
   the key the incorrect branch uses.

*Cost if wrong:* the slots stay anonymous to a screen reader, and a player
using one hears the answer stated rather than positioned. `M5.5e`'s reading is
that the sentence is the better channel; if that turns out wrong in use, the
first shape is still available and `Tile` is unchanged.

**One check before implementing.** `product.md`'s `feedback` block enumerates
what the correct branch shows (*"Correct feedback shows inserted rewards
highlighted"*) separately from the incorrect one (*"Incorrect feedback shows
submitted and correct answers"*). Determine whether adding the submitted value
to the correct branch reads as additive or as contradicting that enumeration.
**If it binds, stop and report** — an implementation task does not amend a
spec. `T57` is the phase's amendment task and it has already landed by then.

- [ ] **Step 1: #94 — the tie**
- [ ] **Step 2: #95 — the correct branch states the answer**
- [ ] **Step 3: Both, in separate commits**

They are unrelated defects that share a wave, not one change.

**Acceptance criteria**

- `.primary` wins on its own specificity; reordering the two rules no longer
  changes the computed font size. Prove it by reordering them locally and
  re-reading — a test that passes either way is what this task exists to
  replace.
- `App.test.tsx:139` and `GameOverScreen.test.tsx:73` pass unchanged.
- The correct branch's status region states the submitted value, using
  `result.submitted`, in both locales.
- `role="status"` regions in `FeedbackPanel` stay mounted and intact; the test
  asserting the feedback region survives overflow → feedback still passes.
- `Tile` is unmodified.
- Suite green; `lint`, `typecheck`, `build` green.

**What this task does not do**

- Does not touch `Tile`. That is the shape this task ruled against.
- Does not add `aria-hidden` to the slot group. The digits stay in the tree;
  they are simply no longer the only channel.
- Does not reorder the HUD's `<dt>`/`<dd>` pairs. Three
  `compareDocumentPosition` tests pin that order and they are load-bearing.

---
reads:
  - https://github.com/cgm-16/ozterisk/issues/51  # the ruling and the evidence
  - docs/spec/product.md  # §1.11 as T43 amended it
  - src/app/App.tsx  # the effect this replaces
---

# T48 — Bind restart to R, and give it an affordance

```yaml
task_id: T48
title: Replace the gameOver Enter shortcut with R and make it discoverable
milestone: M5.5e — Flow Screens
priority: P1
estimate: M
wave: W2
depends_on: [T43, T47]
parallel_safe: false
paths:
  - src/app/
  - src/components/GameOverScreen/
  - src/i18n/messages.ts
```

**Interfaces**

- Runs after `T47`, which redesigns the same screen and decides where the hint
  sits. Read `T47`'s commit message for that decision before you place anything.
- `T43` amended §1.11 and added the `gameOver.restartHint` row to §1.14. The spec
  already permits this; you are implementing it, not deciding it.

## Why

Ori's ruling, recorded in #51: **drop the global `Enter` shortcut on `gameOver`
and bind `R` to restart.**

The evidence, so you do not re-derive it. A player advancing a run by keyboard —
Submit, `Enter`, Submit, `Enter` — destroys the score screen with the tap already
in flight, before it can be read or shared:

```
{ reachedGameOver: true, survivedSecondEnter: false, activeTag: "BODY" }
```

Scoping the shortcut to "only when nothing has focus" fixes the Share/Copy trap
and not this one. `event.repeat` does not help; it catches a held key, not two
discrete presses. And the language toggle renders `<button>`s and is present on
`gameOver`, so `Enter` on a focused 한국어 currently restarts the run *and*
discards the language change — which contradicts §1.11's own closing line that
language changes never reset game state.

`R` collides with nothing: buttons do not activate on it. So the focus guard
becomes unnecessary rather than merely correct.

- [ ] **Step 1: The binding**

`src/app/App.tsx:64-81` holds the effect. Replace the key test; keep the effect
where it is.

**`src/hooks/` is not modified in this milestone, at all.** You will find
`useGameKeyboard` and it will look like the natural home for this. It is not this
task's file. The `gameOver` shortcut has always lived in `App.tsx` because
`GameScreen` — which owns the hook — does not render in that phase.

**Neither key property is correct alone, so accept either:**

- `event.key === "r"` (or `"R"`) breaks under a Korean IME, which is a shipped
  locale.
- `event.code === "KeyR"` is physical-position-based, so a Dvorak user pressing
  the key labelled `R` sends `KeyP`.

Accept either, and put the reason in a comment. Keep the unmodified-key check:
`Ctrl`/`Meta`/`Alt` combinations are the browser's, not ours.

- [ ] **Step 2: Two tests, and one of them does not exist yet**

`App.test.tsx:267` — "restarts via Enter … even when a non-Play-Again button has
focus" — **inverts**. `Enter` no longer restarts; the test becomes the assertion
that it does not. This is a behavioural test changing because the behaviour
changed on the record in §1.11, which is the only reason a behavioural test may
change. Say so in the commit message.

Add the regression test that #51 says should exist and does not: **the stray
`Enter` case above.** Drive the run to `gameOver` the way the failure happens —
the second `Enter` of a Submit/`Enter` rhythm arriving after the phase flips — and
assert the score screen survives. That is the defect this whole task exists to
fix, and nothing currently guards it.

Add: `R` restarts. Add: `R` restarts with a non-`Play Again` button focused, since
that was the old test's point and it still matters.

- [ ] **Step 3: The affordance**

`R` has no visible affordance anywhere. The only keyboard documentation in the
product is `howToPlay.keyboard`, inside a collapsed disclosure on a screen the
player has already left. **A player will realistically never discover `R`.**

Write `gameOver.restartHint` into `src/i18n/messages.ts`, en and ko, matching the
row `T43` put in §1.14. Place it where `T47` decided. Do not add a fourth focal
point to a screen `T47` just spent its whole budget giving one.

- [ ] **Step 4: `howToPlay.keyboard` stops being wrong**

That string currently ends "...and Enter to submit or continue." After this task
`Enter` no longer continues from `gameOver`, and `R` is undocumented. Update both
locales.

§1.14 requires the expanded rules explain keyboard controls; it does not fix the
wording, and `howToPlay.*` is not in the required-copy table. So this is a
correction, not an amendment — but leaving it stale would make the product's only
keyboard documentation state a binding that no longer exists.

`TitleScreen.test.tsx` pins this string by the regex `/Press a digit key to select
a matching tile/`, which is its opening. Keep that opening intact and the test
stays green. If you must change the opening, the test's query changes with it —
but nothing else in that file weakens.

- [ ] **Step 5: Commit**

```bash
git add src/app/ src/components/GameOverScreen/ src/i18n/messages.ts docs/tasks/T48-restart-on-r.md
git commit -m "feat(game-over): restart on R, and say so on screen" -m "Task: T48"
```

**Acceptance criteria**

- `R` restarts from `gameOver`; `Enter` does not, with either key property accepted
  and a comment saying why both are needed.
- The stray-`Enter` regression test exists, and was sabotage-verified: revert the
  key test and confirm it fails.
- `App.test.tsx:267` is inverted, not deleted, and the commit message names §1.11
  as the authority for changing a behavioural test.
- The hint is on screen in both locales and does not become a fourth focal point.
- `howToPlay.keyboard` describes the bindings that actually exist, in both locales.
- Lint, typecheck, test and build all pass.

**What this task does not do**

- No `src/hooks/` and no `src/game/`. Not one line, for any reason.
- No further visual work on the game-over screen. `T47` owns its design; you are
  placing one string into the slot it left.
- Does not touch `docs/archive/complete-plan.md` — frozen snapshot.

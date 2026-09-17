# Tuning Surface and Design System — Plan

Plan-level document. Defers to `docs/spec/**` on conflict (AGENTS.md §2).
Implementation detail lives in
`docs/superpowers/specs/2026-08-09-endless-mode-polish-design.md`; this
document holds the audit, the reasoning, and the sequencing.

## 1. Why

The Endless mode polish build changes how the game *feels*, which means Ori
will hand-tune it across many iterations. Three requirements followed:

1. Fine-tuning should be accessible to a developer.
2. The project should adopt design-system discipline.
3. **Agent feature work must not disturb hand-tuned values.**

An audit of the 1.0 codebase found the weak spot is not where it looks.

## 2. Audit

### 2.1 Visual layer — consistency already 80% there

`src/styles/global.css` defines 25 tokens, and **all 11 CSS modules use zero
hardcoded colors**. The discipline exists and is being followed.

The gap is that the most feel-critical values are the *least* tokenized.
`150ms ease`, `100ms ease`, and `translateY(1px)` are copy-pasted across
**7 modules** — `AnswerSlots`, `GameScreen`, `GameOverScreen`,
`OverflowControls`, `LanguageToggle`, `TitleScreen`, `TileInventory`. So
retuning how a button press feels currently means editing seven files and
keeping them consistent by hand. A hairline `1px solid var(--color-border)`
repeats across five.

**What this section does not measure.** Everything above is about whether the
visual layer is *internally consistent* — tokens defined, tokens used, values
not copy-pasted. It says nothing about whether the result looks good, and the
audit never asked. `M5.5 — Design Pass` (#52) covers that axis; read "80%
there" as a claim about token discipline only, not about visual quality.

### 2.2 Balance layer — the real gap

Only three constants are exported (`INVENTORY_CAPACITY`, `OPERAND_MIN`,
`OPERAND_MAX`). The dials that actually govern feel are inline in logic:

| Dial | Location |
|---|---|
| **Reward `+1`** | `App.tsx:48` **and** `gameReducer.ts:62` — duplicated |
| Reward digit spread | `generators.ts:4`, module-private |
| Operand order flip | `generators.ts:43`, inline `>= 0.5` |
| Answer-length threshold | `selectors.ts:5`, inline `>= 10` |

The first row is a live footgun. `App.tsx` *generates* the reward tile count
and `gameReducer.ts` *validates* it, both as the literal expression
`selectedTiles.length + 1`. Change one without the other and the reducer's
guard rejects the action, returning unchanged state — every correct answer
silently stops working, with no error anywhere. That is exactly the failure a
tuning session provokes.

**Conclusion: the numbers most needing tuning are the least accessible, and
the visual system needs finishing rather than building.**

## 3. Decisions

| Question | Decision |
|---|---|
| What does "design system" mean here | Token/motion discipline in code, plus a dev-only states gallery |
| Live tuning panel (sliders bound to balance values) | **Rejected.** Runtime code needing `import.meta.env.DEV` gating, for a workflow a file edit already serves |
| Figma ↔ code token sync | **Rejected.** Overkill at 25 tokens with no designer handoff. Revisit only if visual work is brought to someone else |
| Sequencing | Cheap parts fold into the Endless build; the gallery gets its own build after |

Each decision above answers "how do we keep the visual layer consistent and
the balance dials safe to touch". None of them answers "does the game look
good" — that axis was out of scope here and is planned as `M5.5 — Design
Pass` (#52), which runs once the Part 2 gallery makes every state viewable.

The fold is near-free: the Endless build already edits `constants.ts`,
`App.tsx`, and the CSS modules, and already introduces a new dial
(`KIND_EQUATION_RATE`). Doing the tuning surface then also removes the `+1`
footgun *before* Ori starts tuning rather than during.

## 4. Part 1 — folds into the Endless build

Specified in the Endless design doc. Summary:

- **`src/game/balance.ts`** — the tuning surface, split from `constants.ts`
  by *safety*. `balance.ts` holds dials that are safe to change;
  `constants.ts` keeps domain definitions whose change alters what the game
  *is*. Each dial documents units, safe range, and economy effect.
- **`getRewardCount()` in `selectors.ts`** — one source of truth for the
  reward count, consumed by both the generator and the validator so they can
  no longer disagree.
- **Motion and hairline tokens** — collapses the 7-module duplication.
- **`balance.test.ts`** — the economy model as an executable invariant.
- **`AGENTS.md` contract** — agents may *add* dials, never silently change a
  tuned value.

### Why the invariant test is the load-bearing piece

Requirement 3 ("agent changes must not disturb tuning") cannot be met by
discipline alone. The economy model is ~40 lines of arithmetic over the
dials, so it can be a test rather than a document nobody re-runs. If a later
build adds wildcards or raises capacity past the `b = 63%` cliff, CI fails
before the damage reaches playtesting. The tuning is then protected by a
machine rather than by an agent's diligence.

The `AGENTS.md` rule complements it by separating the two kinds of edit by
*file* and by *commit*: feature work touches logic, tuning touches
`balance.ts`, so git stops manufacturing conflicts between them.

## 5. Part 2 — dev-only states gallery

A separate build after Endless lands.

**Problem:** to look at the game-over screen you must lose a run; to see an
overflow of 2 you must engineer one. Visual tuning is gated behind playing to
the state being tuned.

**Approach:** a root `gallery.html` plus `src/gallery/main.tsx`, not a
router — the app is deliberately single-page (`docs/spec/architecture.md`)
and adding routing to production code for a dev-only tool is disproportionate.

This needs **no `vite.config.ts` change**: Vite's default build input is the
root `index.html` alone, and the current config sets no
`rollupOptions.input`. So the gallery serves at `/gallery.html` under
`npm run dev` and is excluded from `npm run build` by default.

States compose from the existing `src/test/fixtures.ts` helpers, so gallery
states cannot drift away from the states the tests assert against.

The gallery is a tool, not an end: `M5.5 — Design Pass` (#52) is the build
that consumes it, walking every state in its catalogue.

## 6. Sequencing

1. **Part 0** — this document, the decision journal, and forward roadmap
   milestones.
2. **Endless spec amendment** — Part 1 added as a spec section.
3. **Implementation plan** — combined Endless + Part 1 build.
4. **Part 2** — its own spec and build after Endless lands.
5. **`M5.5 — Design Pass`** (#52) — the visual quality pass, once Part 2's
   gallery exists to run it against. Phase 1 works inside `ui-i18n.md` §1.12;
   phase 2 proposes an amendment to it with gallery screens as evidence.

Steps 1–2 are documentation only and can go up as a single PR before any
source file changes.

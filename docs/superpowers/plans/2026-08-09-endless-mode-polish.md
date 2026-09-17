# Endless Mode Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task.
> Task steps live in `docs/tasks/T15..T20.md` and use checkbox (`- [ ]`)
> syntax for tracking.

**Goal:** Reduce per-round friction, add a cliff-safe generosity dial, and
install a documented tuning surface guarded by an executable economy
invariant.

**Architecture:** No structural change. The reducer stays pure and
deterministic; randomness still enters through injected `RandomSource` /
`TileIdFactory` at the `App.tsx` boundary. Two new pure domain modules
(`game/balance.ts` dials, `test/economy.ts` model), one new reducer action
(`CLEAR_SELECTION`), one new generator (`generateKindEquation`) added
*alongside* the untouched `generateEquation`, and CSS token extraction.

**Tech Stack:** Vite, React 19 `useReducer`, TypeScript, CSS Modules,
Vitest + React Testing Library. No new runtime dependencies.

**Spec:** [`2026-08-09-endless-mode-polish-design.md`](../specs/2026-08-09-endless-mode-polish-design.md)
**Planning rationale:** [`docs/plan/tuning-and-design-system.md`](../../plan/tuning-and-design-system.md)
**Milestone:** M4 — Endless Polish and Tuning Surface

## Why

The 1.0 economy sits near an unchosen cliff. Net `+1` per correct answer
against `−1.71` per forced miss makes run length a step function of the
buildable rate `b`, with a threshold at **`b ≈ 63%`**; today `b ≈ 48%`.
Roughly half of all equations cannot be spelled from a drifted hand
regardless of arithmetic skill — that, not running out of tiles, is what
ends runs.

This build keeps Endless under that cliff while removing the friction, and
leaves behind a tuning surface plus a CI-enforced invariant so later builds
cannot silently push the economy over it. Full derivation in the spec §1.

## Global constraints

Every task inherits these.

- **No new runtime dependencies.** No state library, CSS framework, or
  animation library.
- **The reducer stays pure.** No `Math.random()`, `crypto.randomUUID()`, or
  browser API inside `src/game/`.
- **Gates:** `npm run lint` (`--max-warnings=0`), `npm run typecheck`,
  `npm test`, `npm run build` — all green per task.
- **Bilingual:** every user-visible string gets `en` and `ko` entries in
  `src/i18n/messages.ts`; `ko` is typed against the `en` tree.
- **Accessibility:** interactive targets keep the 44px `--tile-size`
  minimum; state is never signalled by color alone.
- **Commits:** Conventional Commits with `-m "Task: T##"` as the second
  line. One commit per task on the milestone branch
  `feat/M4-endless-polish`; the PR is the milestone, not the task
  (`AGENTS.md` §4.4). Never commit to `main`.
- **Tuning values are hand-set.** Add dials to `balance.ts` with their
  economy effect documented; never change an existing dial's value as part
  of a feature task (`AGENTS.md` §4.5).

## Tasks

| Task | Title | Depends on | Parallel-safe |
|---|---|---|---|
| [T15](../../tasks/T15-balance-surface.md) | Balance surface and economy invariant | — | yes |
| [T16](../../tasks/T16-kind-equation-bias.md) | Kind equation bias | T15 | no |
| [T17](../../tasks/T17-discard-collapse.md) | Discard collapse and overflow keyboard access | — | yes |
| [T18](../../tasks/T18-clear-selection.md) | Clear selection | T17, T19 | no |
| [T19](../../tasks/T19-motion-tokens.md) | Motion and hairline tokens | — | yes |
| [T20](../../tasks/T20-rounds-headline.md) | Rounds survived as the headline stat | — | yes |

## Dependency order

```
T15 balance surface ──> T16 kind equation bias
T19 motion tokens ──┐
T17 discard collapse ┴─> T18 clear selection
T20 rounds headline  (independent)
```

**Recommended sequence: T15 → T19 → T16 → T17 → T18 → T20.**

T15, T19, and T20 touch disjoint files (domain, CSS, presentation) and are
mutually parallel-safe. T17 and T18 must serialize: both edit
`GameScreen.tsx` and `useGameKeyboard.ts`. T18 also wants T19's tokens for
the Clear button and filled-slot affordance.

## Whole-build verification

Beyond the per-task gates:

- **The guardrail is observed failing** (T15). Set `KIND_EQUATION_RATE` to
  `0.35`, confirm both invariant assertions fail with a readable report,
  revert. A guardrail never seen failing is not known to work.
- **`gameReducer.test.ts`'s submission suite is green untouched** after the
  `getRewardCount` extraction. Edits there mean semantics changed — stop.
- **`generators.test.ts` is green untouched** after T16. All 11 references
  call `generateEquation`, which stays behaviourally identical.
- **Reduce-motion still wins** after T19: press a button in `npm run dev`
  with OS reduce-motion enabled and confirm no transform offset.
- **Manual feel pass**, since the goal is feel. Play ~20 rounds and confirm
  a correct answer costs *tap tile → next* rather than three actions; Clear
  and `Escape` work; overflow is fully keyboard-drivable without a mouse;
  dead rounds are noticeably rarer without runs feeling unloseable.

## On merge

Amend `docs/spec/product.md` and `docs/spec/architecture.md`. Canon should
not describe unshipped behaviour until it ships.

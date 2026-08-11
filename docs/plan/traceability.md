# Requirements Traceability Matrix

## 3. Requirements Traceability Matrix

| Requirement | Owning task(s) | Required evidence |
|---|---|---|
| R-01 45 unordered equations, drawn uniformly unless the kind gate fires (R-20) | T03, T16 | generator unit tests cover all pair indices |
| R-02 randomized display order | T03 | same pair/product under both order values |
| R-03 `[0–9]` initial inventory | T02 | factory unit test |
| R-04 ordered physical answer slots | T04, T09 | reducer and component tests |
| R-05 one-attempt correct flow | T05 | reducer tests |
| R-06 incorrect consumes without reward | T05 | reducer tests |
| R-07 intentional incorrect remains legal | T05, T10 | interaction test |
| R-08 exact overflow discard | T06, T10 | reducer and component tests |
| R-09 slot-count-only loss | T06 | reducer tests for one/two-digit terminal equation |
| R-10 score/streak/round semantics | T05, T06 | reducer tests |
| R-11 five phases | T04–T06, T12 | exhaustive reducer/integration tests |
| R-12 mouse/touch/keyboard | T09, T10 | RTL user-event tests |
| R-13 responsive centered arena | T13 | viewport/manual checklist |
| R-14 English/Korean live switching | T07, T08, T12 | storage and app tests |
| R-15 only language persists | T07, T12 | reload/storage tests |
| R-16 localized share/copy | T11 | service/component tests |
| R-17 no backend/audio/E2E | T01, T14 | dependency and repository audit |
| R-18 Vercel static deployment | T14 | production build and deployment smoke test |

M4 — Endless Polish and Tuning Surface:

| Requirement | Owning task(s) | Required evidence |
|---|---|---|
| R-19 one hand-tunable surface for every feel dial | T15 | `balance.ts` holds the dials; `selectors.ts`/`generators.ts` import them, and no call site passes one |
| R-20 economy invariant guards the shipped dial combination | T15 | `balance.test.ts` pins the model and the cliff margin; observed failing at `KIND_EQUATION_RATE = 0.35` |
| R-21 a fixed share of equations biased toward what the hand can spell | T16 | generator tests for both gate paths, the empty-hand fallback, the 3-sample count, and the dial-boundary switch |
| R-22 a forced single-tile discard completes in one action | T17 | component tests asserting exactly `[TOGGLE_DISCARD, CONFIRM_DISCARD]` under `StrictMode`, and no confirm on render |
| R-23 overflow is drivable by keyboard alone | T17 | digit-key tests marking tiles and completing a required count of one |
| R-24 selection is clearable with a visible affordance | T18 | reducer tests for `CLEAR_SELECTION`; Clear button and `Escape` component tests |
| R-25 motion and hairline values live in tokens | T19 | no module hardcodes a duration, press offset, or hairline; reduced-motion override still wins |
| R-26 rounds survived is the headline stat | T20 | HUD order, game-over order, and share-text tests; emphasis asserted by computed font size |

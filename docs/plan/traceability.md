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
| R-13 responsive centered arena | T13 | viewport/manual checklist; `e2e/viewport.spec.ts` sweeps §8.5 at 305/320/407px in both locales |
| R-14 English/Korean live switching | T07, T08, T12 | storage and app tests |
| R-15 only language persists | T07, T12 | reload/storage tests |
| R-16 localized share/copy | T11 | service/component tests |
| R-17 no backend/audio/behavioral E2E | T01, T14 | dependency and repository audit; any browser test asserts layout only |
| R-18 Vercel static deployment | T14 | production build and deployment smoke test |

M4 — Endless Polish and Tuning Surface:

| Requirement | Owning task(s) | Required evidence |
|---|---|---|
| R-19 one hand-tunable surface for every feel dial | T15 | `balance.ts` holds the dials; `selectors.ts`/`generators.ts` import them, and no call site passes one |
| R-20 economy invariant guards the shipped dial combination | T15 | `balance.test.ts` pins the model and the cliff margin; observed failing at `KIND_EQUATION_RATE = 0.35` |
| R-21 a fixed share of equations biased toward what the hand can spell | T16 | generator tests for both gate paths, the empty-hand fallback, the 3-sample count, and the dial-boundary switch |
| R-22 a forced single-tile discard completes in one action | T17 | component tests asserting exactly `[TOGGLE_DISCARD, CONFIRM_DISCARD]` under `StrictMode`, and no confirm on render. Superseded in M6a: the reducer completes the discard on the last mark at any count — evidence moves to R-35/R-36 |
| R-23 overflow is drivable by keyboard alone | T17 | digit-key tests marking tiles and completing a required count of one |
| R-24 selection is clearable with a visible affordance | T18 | reducer tests for `CLEAR_SELECTION`; Clear button and `Escape` component tests |
| R-25 motion and hairline values live in tokens | T19 | no module hardcodes a duration, press offset, or hairline; reduced-motion override still wins |
| R-26 rounds survived is the headline stat | T20 | HUD order, game-over order, and share-text tests; emphasis asserted by computed font size |

M5 — States Gallery:

| Requirement | Owning task(s) | Required evidence |
|---|---|---|
| R-27 gallery states compose from the shared test fixtures | T21, T24 | `makeFeedbackState`, `makeOverflowState`, and `makeGameOverState` are exported from `src/test/fixtures.ts` and defined nowhere else; §2.6 reproduces the file |
| R-28 game over is one renderable component | T22 | the terminal equation and its reason render inside `GameOverScreen`'s `main` landmark; `App.test.tsx` passes unedited |
| R-29 every phase is viewable without playing to it | T23, T24 | `GALLERY_STATES` is typed `Record<GamePhase, GalleryEntry[]>`; tests assert no group is empty and that every entry renders in both languages |
| R-30 the gallery never ships | T23 | `npm run build` emits no `dist/gallery.html`, checked by `ls dist/`; `vite.config.ts` unchanged |

M6a — Classic Core:

| Requirement | Owning task(s) | Required evidence |
|---|---|---|
| R-31 Classic is specified before it is built | T63 | `product.md` §1.7a, amended §1.3/§1.5/§1.7/§1.8/§1.10/§1.11/§1.17; `ui-i18n.md` §1.12/§1.14/§1.15 |
| R-32 capacity is a function of mode and submissions; a socket seals every second submission down to the floor | T64 | selector tests for `getCapacity`; reducer tests for a two-tile Classic overflow and a miss that never overflows |
| R-33 reaching the floor with tiles in hand wins; too few tiles, or an empty hand at the floor, loses | T64 | reducer tests for the win-before-loss order at `NEXT_ROUND` |
| R-34 Classic's economy starts above the cliff and crosses it | T64 | `balance.test.ts` Classic invariant |
| R-35 only the tiles that fit are sorted; the last mark completes the discard; survivors take the freed seats | T65 | reducer tests in both modes |
| R-36 no Confirm and no Next Round after a discard | T66 | component tests: the second mark of two removes both, and `animationend` advances the round; `Enter` is inert while settling |
| R-37 the mode is chosen on the title and kept by Play Again | T67 | title and app tests: Classic deals twenty, two of each digit |
| R-38 Classic ends as a win or a loss, and says which | T68 | game-over tests; share text byte-matched to §1.15 in both languages |

M6b — Classic Rack and Motion:

| Requirement | Owning task(s) | Required evidence |
|---|---|---|
| R-39 Classic's motion keyframes exist and reduced motion neutralises them | T70 | `keyframes.test.ts` requires the five names; `oz-tip-off` gone |
| R-40 stepped rack, plugs and rail | T71 | `rackTier` tests; plug count and rail-placement component tests |
| R-41 discard motion: slide-off and perch-drop | T72 | component tests on the animation names and `onSettled` ordering |
| R-42 tray motion: seal, house seat, re-seat, new plugs | T73 | component tests on the FLIP custom properties and seal delays |
| R-43 every Classic rack size fits `320px` | T74 | `e2e/viewport.spec.ts` geometry at 320, 402 and desktop |
| R-44 a Classic win is gold and shows its final hand | T75 | game-over tests on the win heading class and the final-hand strip |

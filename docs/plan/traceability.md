# Requirements Traceability Matrix

## 3. Requirements Traceability Matrix

| Requirement | Owning task(s) | Required evidence |
|---|---|---|
| R-01 45 uniform unordered equations | T03 | generator unit tests cover all pair indices |
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

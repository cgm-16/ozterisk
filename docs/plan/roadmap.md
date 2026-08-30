# Roadmap — Milestones, Dependency DAG, and Waves

### 4.1 Milestones

| Milestone | Outcome | Exit gate |
|---|---|---|
| `M0 — Repository Ready` | Reproducible local and CI toolchain | T01 merged; install, lint, typecheck, test, build pass |
| `M1 — Deterministic Game Core` | All game rules executable without React | T02–T07 merged; domain/i18n unit suite green |
| `M2 — Playable Bilingual PoC` | Complete mouse/touch/keyboard run loop | T08–T12 merged; integration suite green |
| `M3 — Release Candidate` | Responsive, accessible, deployable release | T13–T14 merged; release checklist and production smoke pass |

M0–M3 are closed; 1.0 shipped as `eb6cc67`. Post-release milestones follow.
Their planning lives in `docs/plan/tuning-and-design-system.md` and the
design docs under `docs/superpowers/specs/`.

**A milestone is the unit of merge** (AGENTS.md §4.4), so **every milestone
below must be a reasonable PR-sized goal.** If planning shows one is not, it
is split here before work starts — deliberately and on the record, never ad
hoc at branch time.

| Milestone | Outcome | Exit gate |
|---|---|---|
| `M4 — Endless Polish and Tuning Surface` | Reduced round friction, kind equation bias, and a single documented tuning surface | Discard collapse, Clear action, overflow keyboard access, `balance.ts`, and `balance.test.ts` merged; economy invariant green |
| `M5 — States Gallery` | Every component state viewable without playing to it | Dev-only `gallery.html` serves all five phases; absent from `dist/` after `npm run build` |
| `M5.5a — Design Contract Amendments` | The specification permits the Tile House system | §1.12, §1.14, §1.15, `product.md` §1.10 and the AGENTS.md motion constraint amended; `docs/design-system/` adopted; `T25`–`T27` filed |
| `M5.5b — Foundations and Identity` | Tile House tokens, self-hosted fonts, and the `ozterisk` wordmark | Token partials and global keyframes land; zero non-origin requests in a full run; Korean renders in a Hangul-capable face; focus indicator ≥ `3:1` on felt and ceramic |
| `M5.5c — Tile and Action Primitives` | One `Tile` and one `ActionButton`, replacing three and seven copies | Both primitives wired at every call site; accessible names unchanged; suite green |
| `M5.5d — Board Surfaces` | The rack, slots, equation, HUD and capacity meter wear the system | Rack holds ten sockets at every tier; a selected tile keeps its socket; round retains primary emphasis |
| `M5.5e — Flow Screens` | Title, feedback, overflow and game over wear the system | Answer slots stay mounted through feedback; `role="status"` regions intact |
| `M5.5f — Motion` | The sixteen named moments | Every moment in the §1.12 inventory implemented; `prefers-reduced-motion` neutralises all of them |
| `M5.5g — Visual Verification` | The gallery proves it | Gallery covers hover, focus-visible, disabled and reduced-motion; §8.5 walked with measured evidence at 320px |
| `M6 — Classic Core` | Classic playable: shrinking capacity and a definite run arc | Mode select and `getCapacity(round)` merged; both modes' economy invariants green |
| `M7 — Special Tiles` | Wildcard and restricted-face tiles, giving Classic its density-hoarding verb | Face-set tile mechanism and its digit picker merged; spawn rates tuned against Classic's descending ceiling |

**Why M5.5 is a fraction.** The design pass was not on the roadmap when M6
and M7 were numbered, and it has to run once the gallery exists — the gallery
is what makes every state viewable without playing to it, which is the
precondition for tuning them. Renumbering `M6` and `M7` down would touch
`docs/journal/journal-2026-08-09.md`, which is a historical record: rewriting
it to match a later decision would falsify it. A fraction keeps the sequence
honest and the journal intact.

**Why the pass was split into seven.** It was originally scoped as two phases:
one working inside §1.12, one proposing an amendment to it with gallery screens
as evidence. That framing assumed the design work did not exist yet. It does —
`docs/design-system/` is a complete visual and motion system derived from this
codebase, and it contradicts §1.12, §1.14, §1.15, `product.md` §1.10 and the
AGENTS.md motion constraint. So the amendment is not the *last* step argued from
screens; it is the *first* step, argued from the design record, and everything
after it is compliant by construction.

The earlier two-phase reasoning is preserved in
`docs/journal/journal-2026-08-29.md`, which is a historical record and is not
rewritten to match this decision.

**Why seven and not one.** A milestone is the unit of merge, and one PR
carrying a token replacement, two new primitives, ten restyled components,
sixteen animations and a rename is not reviewable. §4.4 requires the split to
happen here, before work starts, rather than at branch time. `M5.5a` is
documentation only; `M5.5b` and `M5.5c` are strictly serial because everything
downstream consumes them; `M5.5d` fans out across non-overlapping components.

**Why M6 was split.** As originally scoped, `M6 — Classic Mode` bundled
shrinking capacity, mode select, *and* the face-set tile mechanism. The
face-set change alone spreads across `constructAnswer`, the closed `Digit`
union, `factories.ts`, `generators.ts`, `TileInventory.tsx`, and the
`tile.digitLabel` i18n key, plus a digit-picker UI — on its own comparable
in size to all of M4. Bundled, it failed the PR-sized bar.

The seam is principled rather than convenient: **M6 delivers a playable
mode, M7 adds content to it.** Shrinking capacity is what makes Classic a
different game; special tiles are what make it a deep one. Each ships
independently.

## 5. Dependency DAG and Execution Waves

```mermaid
flowchart TD
  T01["T01 Repository foundation"] --> T02["T02 Domain types and factories"]
  T01 --> T07["T07 Typed i18n"]
  T02 --> T03["T03 Generators and selectors"]
  T03 --> T04["T04 Selection reducer"]
  T04 --> T05["T05 Submission reducer"]
  T05 --> T06["T06 Overflow and lifecycle reducer"]
  T07 --> T08["T08 Title and language UI"]
  T02 --> T09["T09 Game primitives"]
  T07 --> T09
  T05 --> T10["T10 Game screen and keyboard"]
  T09 --> T10
  T03 --> T11["T11 Game-over sharing"]
  T07 --> T11
  T06 --> T12["T12 App orchestration"]
  T08 --> T12
  T10 --> T12
  T11 --> T12
  T12 --> T13["T13 Responsive and accessibility pass"]
  T13 --> T14["T14 CI, release, and deployment"]
```

| Wave | Tasks | Priority | Parallel rule | Wave exit gate |
|---|---|---|---|---|
| W0 | T01 | P0 | Single foundation task | Clean install and all scripts pass |
| W1 | T02, T07 | P0 | Parallel-safe; no overlapping paths | Domain types/factories and i18n independently green |
| W2 | T03, T08 | P0/P1 | Parallel-safe after their own dependencies | Pure game utilities and title entry complete |
| W3 | T04, T09, T11 | P0/P1 | Parallel-safe; separate paths | Selection reducer, game primitives, share service complete |
| W4 | T05 | P0 | Serialized because it edits reducer state transitions | Correct/incorrect submission suite green |
| W5 | T06, T10 | P0 | T10 may begin after T05; T06 and T10 touch different files except shared types are frozen | Full lifecycle reducer and phase UI complete |
| W6 | T12 | P0 | Integration task only | Complete playable loop and app tests green |
| W7 | T13 | P1 | Release-quality pass | Desktop/mobile/accessibility checklist green |
| W8 | T14 | P1 | Final gate | CI and production deployment green |

No agent may modify another active task's owned paths. If a shared type must change, pause the dependent task, land the type change through the owning prerequisite task, rebase, and rerun its gate.

### 7.5 Wave monitoring

At the end of every wave:

- [ ] All tasks in the wave are merged or explicitly waived by the user.
- [ ] All wave-owned focused tests pass.
- [ ] Full test suite passes.
- [ ] Typecheck passes.
- [ ] No out-of-scope dependency was added.
- [ ] No task in the next wave has an unresolved dependency.
- [ ] Update milestone progress and unblock the next wave.

## 10. Execution Handoff

Recommended execution mode: `superpowers:subagent-driven-development`, one fresh implementation agent per task, with specification review followed by quality review at every task boundary.

Alternative execution mode: `superpowers:executing-plans`, processing one wave at a time with a user-visible checkpoint after each wave.

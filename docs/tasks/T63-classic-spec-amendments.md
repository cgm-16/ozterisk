---
reads:
  - docs/design_handoff_m6_classic/README.md  # the rack, plugs, rail and motion table
  - docs/design-system/decisions.md  # § M6 — Classic: why each rule exists
  - docs/spec/product.md  # §1.3, §1.5, §1.7, §1.8, §1.10, §1.11, §1.17
  - docs/spec/ui-i18n.md  # §1.12, §1.14, §1.15
---

# T63 — Amend the spec for Classic and the shared overflow rules

```yaml
task_id: T63
title: Amend the spec for Classic and the shared overflow rules
milestone: M6a — Classic Core
priority: P0
estimate: S
wave: W0
depends_on: []
parallel_safe: false
paths:
  - docs/spec/
  - docs/plan/
  - docs/design-system/decisions.md
  - docs/design_handoff_m6_classic/
  - docs/tasks/
```

**Interfaces**

- Produces the canonical rules every later M6 task reads. No code.

## Why

Classic appears nowhere in `docs/spec/**`, and the spec actively forbids parts of
it: §1.12 fixes the rack at ten sockets in `5 × 2`, §1.7 keeps **Confirm
Discard** for multi-tile overflow, and §1.17 excludes curves that escalate over a
run. Spec is canonical (AGENTS.md), so it moves first.

Supersedes `T17`'s "`CONFIRM_DISCARD` is retained — Classic's multi-tile discards
need them": Ori ruled (24 Sep 2026) that the mark reaching the required count
completes the discard at any count, in both modes.

## Rulings recorded here (Ori, 24 Sep 2026)

- M6 splits into `M6a — Classic Core` and `M6b — Classic Rack and Motion`.
- The shared overflow rules apply to both modes: sort only the tiles that fit,
  the newest arrivals perch on the rail; the last mark completes the discard; no
  Next Round after a discard.
- Game over: win/loss title and reason, rounds, longest streak. Mean density is
  **not** built. The share text carries mode and outcome.
- A Classic win hides the equation; a loss keeps it.
- Where the arena cannot hold `7 × 44` or `6 × 48`, both upper sizes draw at
  `6 × 44` with tightened panel padding.
- Out of scope: `10i` (#104), the fire/halo split, the 21 Sep tray/wind theme.

## Steps

- [ ] `product.md`: §1.1, §1.3, §1.5 step 7, §1.7, new §1.7a (Classic capacity), §1.8, §1.10, §1.11, §1.17.
- [ ] `architecture.md` §2.2/§2.3/§2.4: `mode`, `discarded`, no `CONFIRM_DISCARD`, `getCapacity`, the three dials, `ShareStats`.
- [ ] `ui-i18n.md`: §1.12 rack rules per mode, plugs, rail, narrow cap, motion inventory; §1.14 keys; §1.15 Classic formats.
- [ ] `roadmap.md` split and `traceability.md` R-31–R-43.
- [ ] Merge the handoff's decisions into `docs/design-system/decisions.md`; delete the handoff copy; commit the handoff folder.
- [ ] Write `T63`–`T74`.

## Acceptance

- `grep -rn "Confirm Discard" docs/spec` returns nothing.
- Every ruling above is findable in the spec text it governs.

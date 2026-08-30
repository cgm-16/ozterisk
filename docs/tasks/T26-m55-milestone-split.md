---
reads:
  - docs/plan/roadmap.md  # §4.1 milestone table, why M5.5 is a fraction
  - AGENTS.md  # §4.4 the PR is the milestone
  - docs/journal/journal-2026-08-29.md  # the original two-phase scoping, preserved not rewritten
---

# T26 — M5.5 milestone split

```yaml
task_id: T26
title: Split M5.5 into seven merge-sized milestones before work starts
milestone: M5.5a — Design Contract Amendments
priority: P0
estimate: S
wave: W1
depends_on: [T25]
parallel_safe: false
paths:
  - docs/plan/roadmap.md
  - docs/journal/journal-2026-08-30.md
```

**Interfaces**

- Consumes: the amended §1.12 (T25), which defines what the later milestones build.
- Produces: `M5.5a`–`M5.5g` and their exit gates.

## Why

AGENTS.md §4.4: *"A milestone must be a reasonable PR-sized goal. If planning shows
it is not, split the milestone in `docs/plan/roadmap.md` before work starts. The unit
of merge moves deliberately and on the record, never ad hoc at branch time."*

`M5.5` as scoped is one PR carrying a full token replacement, two new primitives, ten
restyled components, sixteen animations and a product rename. That is not reviewable.
The split is therefore mandatory, and it belongs here rather than at branch time.

The original two-phase framing — phase 1 inside §1.12, phase 2 proposing an amendment
argued from gallery screens — assumed the design work did not exist yet. It does. So
the amendment moves to the front and the remaining work splits by merge unit rather
than by permission. `docs/journal/journal-2026-08-29.md` records the earlier
reasoning and is **not** rewritten to match this decision.

- [ ] **Step 1: Replace the `M5.5` row with `M5.5a`–`M5.5g`**

Each row carries an outcome and an exit gate that can be checked without reading the
diff. `M5.5a` is documentation only; `M5.5b` and `M5.5c` are strictly serial because
everything downstream consumes their tokens and primitives; `M5.5d` fans out across
non-overlapping components.

- [ ] **Step 2: Replace the two-phase rationale**

State why it was superseded, and point at the journal rather than editing it.

- [ ] **Step 3: Record the scoping in a journal entry**

`docs/journal/journal-2026-08-30.md`: the four contradicted gates, the three measured
handover defects, the reducer invariant that keeps `src/game/` untouched, and the
three verified test collisions later milestones must honour.

- [ ] **Step 4: Commit**

```bash
git add docs/plan/roadmap.md docs/journal/journal-2026-08-30.md
git commit -m "docs(plan): split M5.5 into seven merge-sized milestones" -m "Task: T26"
```

**Acceptance criteria**

- Every `M5.5x` row has an exit gate checkable without reading the diff.
- The superseded two-phase reasoning is explained, not deleted, and the journal it came from is untouched.
- `git log --follow docs/journal/journal-2026-08-29.md` shows no modification in this branch.

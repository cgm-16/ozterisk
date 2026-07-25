# GitHub Planning Metadata

Branch, commit, and PR conventions (§4.4) live in `AGENTS.md`.

### 4.2 Labels

Create these labels before filing issues:

| Label | Color | Meaning |
|---|---:|---|
| `type:foundation` | `5319E7` | Tooling, repository, CI |
| `type:game-logic` | `1D76DB` | Domain rules, reducer, selectors |
| `type:ui` | `0E8A16` | React components and interaction |
| `type:i18n` | `006B75` | Language, copy, persistence |
| `type:release` | `B60205` | Deployment and release gates |
| `priority:P0` | `D93F0B` | Blocks playable core or correctness |
| `priority:P1` | `FBCA04` | Required PoC release quality |
| `parallel-safe` | `C2E0C6` | May run concurrently within its DAG wave |
| `needs-review` | `F9D0C4` | Implementation complete, review pending |
| `blocked` | `B60205` | Cannot progress without an external decision or prerequisite |

### 4.3 Issue body schema

Every GitHub issue created from a task below must begin with:

```yaml
task_id: T##
milestone: M#
priority: P0|P1
estimate: XS|S|M|L
wave: W#
depends_on: [T##]
parallel_safe: true|false
paths:
  - exact/path
acceptance_gate:
  - exact command or observable result
```

Then copy the task's Purpose, Interfaces, Steps, Acceptance criteria, and Commit sections into the issue.

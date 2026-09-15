# Triage Labels

The `mattpocock-skills` engineering skills speak in terms of five canonical
triage roles. This file maps each role to the label string this repo actually
uses.

| Role in the skills | Label in this repo   | Meaning                                  |
| ------------------ | -------------------- | ---------------------------------------- |
| `needs-triage`     | `triage:needs-triage`   | Maintainer needs to evaluate this issue  |
| `needs-info`       | `triage:needs-info`     | Waiting on reporter for more information |
| `ready-for-agent`  | `triage:ready-for-agent`| Fully specified, ready for an AFK agent  |
| `ready-for-human`  | `triage:ready-for-human`| Requires human implementation            |
| `wontfix`          | `triage:wontfix`        | Will not be actioned                     |

When a skill mentions a role — "apply the AFK-ready triage label" — use the
label string from the right-hand column.

## Why prefixed

`docs/plan/github.md` §4.2 established a prefixed vocabulary (`type:*`,
`priority:*`), and these join it rather than sitting beside it unprefixed. The
`triage:` namespace is distinct from `type:` and `priority:`, so an issue
carries at most one label from each axis and none of them collide.

## `wontfix`

GitHub's stock `wontfix` label still exists and is **superseded** by
`triage:wontfix`. It is deliberately not deleted: deleting a label strips it
from every issue already closed under it, and a redundant unused label costs
nothing. Do not apply the stock one to new issues.

## Existing labels these do NOT replace

`needs-review` (implementation complete, review pending) and `blocked` (cannot
progress without an external decision) predate this file and mean something
narrower than any triage role. They keep their own meanings; do not map a
triage role onto either.

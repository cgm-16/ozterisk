# AGENTS.md — 1-0 Agent Kernel

This file is loaded for every agent working in this repository. Everything else
is read on demand through the routing map below.

**Goal:** Build and deploy a responsive, bilingual, fully client-side proof of concept for `1-0`, an endless multiplication game in which digit tiles are both answer inputs and a managed inventory.

**Architecture:** A Vite + React + TypeScript single-page application uses a deterministic `useReducer` state machine for the five game phases. Pure domain utilities own equation generation, rewards, answer construction, sorting, loss detection, and share formatting; React owns rendering and event orchestration. Random values and tile IDs are injected at the boundary so all game rules remain deterministic in tests.

**Tech Stack:** Vite, React, TypeScript, CSS Modules, Vitest, React Testing Library, `@testing-library/user-event`, Vercel.

**Primary references:** [Vite setup](https://vite.dev/guide/), [React `useReducer`](https://react.dev/reference/react/useReducer), [Vitest](https://vitest.dev/guide/), [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/), [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API), [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage), [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite).

## Routing map

| Situation | Read |
|---|---|
| Starting task `T##` | `docs/tasks/T##-*.md`, then every file in its `reads:` frontmatter |
| Checking waves, milestones, parallelism, or wave exit gates | `docs/plan/roadmap.md` |
| Creating labels, milestones, or issues | `docs/plan/github.md` |
| Mapping requirements to owning tasks and evidence | `docs/plan/traceability.md` |
| Running quality gates (spec, architecture, interaction, a11y) | `docs/checklists/quality.md` |
| Preparing or verifying the release | `docs/checklists/release.md` |
| Recording insights that must outlive this session | `docs/journal/journal-*.md` |
| Anything still unclear after all of the above | `docs/archive/complete-plan.md` (frozen snapshot) |

## Document precedence

1. `docs/spec/**` is canonical for every product and technical rule.
2. `docs/tasks/**` and `docs/plan/**` defer to spec on conflict. If they
   disagree, stop and report the conflict; do not patch around it.
3. `docs/archive/complete-plan.md` is the frozen pre-split snapshot. Never
   treat it as current; on conflict the split documents win.

Section numbers (§1.x, §2.x, §4.x, §7.x, §8.x) are preserved from the original
plan, so cross-references resolve across files.

## Global Constraints

- Product name is the working title `1-0`.
- Use Vite + React + TypeScript; do not use Next.js.
- Run entirely in the browser; no backend, database, account, leaderboard, API, analytics, or anti-cheat system.
- Use React `useReducer`; do not add Zustand, Redux, or another state library.
- Keep the reducer pure and deterministic; never call `Math.random()`, `crypto.randomUUID()`, browser APIs, or storage APIs inside it.
- Use CSS Modules plus one global stylesheet; do not add Tailwind, a component library, or an animation library.
- Use CSS transitions only, and only for functional state changes.
- Support responsive desktop and mobile layouts with mouse, touch, and keyboard input.
- Support English and Korean through a typed in-code dictionary; do not add an i18n dependency.
- Persist only the language preference in `localStorage`; never persist a run, score, record, equation, or inventory.
- Use Vitest and React Testing Library; do not add Playwright or another E2E suite.
- Use ordinary browser randomness in production; do not generate, display, encode, or share run seeds.
- Do not add sound, music, mute, or volume controls.
- Deploy the static Vite build to Vercel.
- Do not implement future wildcards, a leaderboard, result URLs, saved records, accounts, tutorials, or backend validation.
- Every task is implemented test-first, produces one independently reviewable result, and ends in a focused commit.
- Do not start an issue until every `depends_on` issue has passed its completion gate.

## Git and PR conventions

### 4.4 Branch and PR convention

**A task is a unit of review, not a unit of merge.** It keeps its task file,
its issue, its own commit, and its own review gate. It does not own a PR.

**The PR is the milestone.** One branch carries a milestone's tasks as one
coherent commit each, and one PR closes every issue in that milestone.

- **A milestone must therefore be a reasonable PR-sized goal.** If planning
  shows it is not, split the milestone in `docs/plan/roadmap.md` *before*
  work starts. The unit of merge moves deliberately and on the record, never
  ad hoc at branch time.
- Branch: `feat/M#-short-kebab-name`.
- Commit: Conventional Commit with `Task: T##` in the body. One commit per
  task, independently reviewable.
- PR title: `[M#] Imperative outcome`.
- PR body must contain a `Closes #<issue>` line per task issue, plus:

M0–M3 used one branch and PR *per task* (`feat/T##-…`, `[T##] …`), which was
right for fourteen tasks building a codebase from nothing. From M4 the suite
is comprehensive and milestones are small, so the merge unit is the
milestone. Older PR history reflects the previous convention.

```markdown
Closes #<issue>

## Contract
- [ ] Scope matches T##
- [ ] No out-of-scope dependency or feature added

## Evidence
- [ ] Focused tests
- [ ] Full test suite
- [ ] Typecheck
- [ ] Lint
- [ ] Production build

## Manual checks
- [ ] Relevant acceptance path exercised
```

### 4.5 Tuning values

Agents may **add** dials to `src/game/balance.ts` and must document each
one's economy effect. Agents must **not change the value** of an existing
dial without explicit instruction — those are hand-tuned. Tuning commits
use `tune(balance):`; feature commits never carry value changes.

## Loop-Agent Operating Protocol

### 7.1 Start-of-loop procedure

At every loop iteration:

- [ ] Read this entire sheet once at session start; on later loops, reread the active task and global constraints.
- [ ] Inspect `git status --short`, current branch, and latest commit.
- [ ] Read active issue metadata and verify all `depends_on` tasks are merged/green.
- [ ] Confirm no other agent owns an overlapping path.
- [ ] Move exactly one task to `in_progress`.
- [ ] State the next smallest test-first step.

### 7.2 Work cycle

For the active task:

- [ ] Write one focused failing test.
- [ ] Run only the focused test and record the expected failure reason.
- [ ] Implement the smallest change that satisfies the test.
- [ ] Rerun the focused test.
- [ ] Run related tests.
- [ ] Run typecheck after any exported interface change.
- [ ] Run lint after component/style boundary changes.
- [ ] Commit at the task boundary, not after every keystroke.
- [ ] Request review only after the task acceptance gate is green.

### 7.3 Monitoring record

Maintain this block in the issue or loop journal:

```yaml
task_id: T##
status: queued|in_progress|blocked|review|done
last_verified_commit: <sha-or-none>
last_green_command: <exact-command-or-none>
current_step: <one-checkbox-label>
changed_paths: []
open_failures: []
blocker:
  category: none|dependency|spec|test|environment|permission
  evidence: ""
next_action: ""
```

### 7.4 Stall detection

- If the same command fails twice with no new evidence, stop retrying and diagnose the root cause.
- If two implementation attempts fail, revert only the agent's own uncommitted attempt, preserve user/other-agent changes, and write a blocker record.
- If the active task requires changing a frozen interface owned by a prerequisite, mark the task `blocked`, open a narrow prerequisite amendment, and do not patch around the contract.
- If a permission, credential, deployment authority, or external service is required, stop and request the missing authority; do not simulate success.
- If the spec is ambiguous in a way that changes rules, scoring, loss, persistence, or scope, stop and ask the user. Cosmetic implementation choices may be resolved within the visual contract.

### 7.6 Review gates

Each task receives two reviews:

1. **Specification review:** Does the diff implement exactly the task and preserve global constraints?
2. **Quality review:** Are types, tests, names, accessibility semantics, and failure behavior sound?

Do not combine the reviews into “looks good.” Review comments must cite a requirement, invariant, test, or concrete diff behavior.

### 7.7 Completion evidence

No task may be marked complete from code inspection alone. Minimum evidence:

- focused test command and green output;
- any task-specific manual check;
- `npm run typecheck`;
- clean diff limited to owned paths;
- commit SHA.

Release completion additionally requires:

- `npm ci`;
- `npm run lint`;
- `npm run typecheck`;
- `npm test`;
- `npm run build`;
- production URL smoke results.

Wave monitoring (§7.5) lives in `docs/plan/roadmap.md` because it gates waves,
not single-task iterations.

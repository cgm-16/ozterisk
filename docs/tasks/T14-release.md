---
reads:
  - docs/plan/github.md  # labels, milestones, issue schema
  - docs/checklists/release.md  # §8.6 release acceptance, §9 definition of done
---

# T14 — GitHub automation, documentation, and Vercel release

```yaml
task_id: T14
title: Prepare and verify production release
milestone: M3 — Release Candidate
priority: P1
estimate: M
wave: W8
depends_on: [T13]
parallel_safe: false
paths: [.github/**, README.md, vercel.json, index.html, public/favicon.svg]
```

**Interfaces**

- Consumes: Release-candidate static application.
- Produces: CI gate, contributor metadata, production metadata, Vercel deployment.

- [ ] **Step 1: Write GitHub issue form**

Create `.github/ISSUE_TEMPLATE/implementation-task.yml` with fields for task ID, milestone, dependency IDs, owned paths, acceptance gate, and checklist.

- [ ] **Step 2: Add PR template**

Use §4.4 verbatim.

- [ ] **Step 3: Add CI**

`.github/workflows/ci.yml` must:

1. run on pull requests and pushes to the default branch;
2. check out code;
3. set up the Node version declared in `package.json#engines`;
4. run `npm ci`;
5. run lint, typecheck, test, and build as separate named steps;
6. upload no persistent user/game data.

- [ ] **Step 4: Add static deployment config**

Create:

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

- [ ] **Step 5: Write README**

Include product rules, local commands, architecture, state transitions, test strategy, deployment, supported languages, browser API fallbacks, and explicit out-of-scope list.

- [ ] **Step 6: Set document metadata**

Set localized-neutral page title and description in `index.html`; provide a simple numeric favicon with no external asset dependency.

- [ ] **Step 7: Run release gate**

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
git status --short
```

Expected: all commands exit `0`; worktree contains only intended release changes before commit.

- [ ] **Step 8: Deploy Vercel preview and production**

Verify preview first, then promote the exact tested commit to production. Record the production origin used by sharing and verify it opens the title screen over HTTPS.

- [ ] **Step 9: Production smoke checklist**

- [ ] English and Korean title render.
- [ ] Start Run works.
- [ ] Correct, incorrect, overflow, next round, and game over are reachable.
- [ ] Refresh returns to title and preserves only language.
- [ ] Share uses native sheet where supported.
- [ ] Share fallback and Copy Result copy normal production URL.
- [ ] Mobile viewport has no horizontal scroll.
- [ ] No network call except static asset loading is required for gameplay.

- [ ] **Step 10: Commit**

```bash
git add .github README.md vercel.json index.html public
git commit -m "chore: prepare 1-0 production release" -m "Task: T14"
```

**Acceptance criteria**

- Required CI passes on the release commit.
- Production smoke checklist is attached to the release/PR.
- Deployment contains no serverless function or backend service.

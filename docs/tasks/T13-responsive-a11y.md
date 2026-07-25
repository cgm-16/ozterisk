---
reads:
  - docs/spec/ui-i18n.md  # §1.12 responsive and visual contract
  - docs/checklists/quality.md  # §8.5 accessibility and responsive acceptance
---

# T13 — Responsive visual and accessibility pass

```yaml
task_id: T13
title: Finish responsive minimal number-board UI
milestone: M3 — Release Candidate
priority: P1
estimate: M
wave: W7
depends_on: [T12]
parallel_safe: false
paths: [src/styles/global.css, src/app/App.module.css, src/components/**/*.module.css]
```

**Interfaces**

- Consumes: Complete semantic UI.
- Produces: Centered responsive visual hierarchy with documented manual evidence.

- [ ] **Step 1: Add visual state tokens**

Define variables for canvas, surface, text, muted text, border, accent, correct, incorrect, new reward, discard, focus, tile size, radius, and shadow. State meanings must remain legible without color.

- [ ] **Step 2: Implement centered arena**

- Desktop max width: `42rem`.
- Mobile breakpoint: `40rem`.
- Preserve vertical order.
- Tiles wrap; no horizontal page scrolling at `320px`.
- Button/tile minimum target: `44px`.
- Answer slots remain visually distinct from inventory.

- [ ] **Step 3: Add restrained transitions**

Use opacity, transform of at most `2px`, border, and background transitions. Disable them under `prefers-reduced-motion: reduce`.

- [ ] **Step 4: Run automated gates**

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

- [ ] **Step 5: Complete manual matrix**

| Viewport/input | Check |
|---|---|
| 1440×900 mouse | Centered arena, no excessive spread, all phases readable |
| 768×1024 touch emulation | Hierarchy unchanged, tiles wrap cleanly |
| 390×844 touch | No horizontal scroll, targets ≥44px |
| 320×568 touch | Primary actions and inventory remain usable |
| Keyboard only | Visible focus, logical order, full run possible |
| Reduced motion | No nonessential transition remains |
| English/Korean | No clipped labels or layout-breaking overflow |

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "style: finish responsive number-board interface" -m "Task: T13"
```

**Acceptance criteria**

- Manual matrix is attached to the PR with screenshots or reviewer notes.
- No layout hierarchy changes between desktop and mobile.

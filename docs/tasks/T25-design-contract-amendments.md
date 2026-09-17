---
reads:
  - docs/spec/ui-i18n.md  # §1.12 visual contract, §1.14 copy table, §1.15 share formats
  - docs/spec/product.md  # §1.10 screen phases
  - AGENTS.md  # Global Constraints, document precedence
  - docs/design-system/readme.md  # the rules being permitted
  - docs/design-system/decisions.md  # why each rule exists, and the motion inventory
---

# T25 — Design contract amendments

```yaml
task_id: T25
title: Amend the visual, copy, and motion contracts to permit the Tile House system
milestone: M5.5a — Design Contract Amendments
priority: P0
estimate: M
wave: W1
depends_on: []
parallel_safe: false
paths:
  - docs/spec/ui-i18n.md
  - docs/spec/product.md
  - docs/spec/architecture.md
  - docs/checklists/quality.md
  - AGENTS.md
  - README.md
```

**Interfaces**

- Consumes: `docs/design-system/` (T27).
- Produces: the amended §1.12 contract every later M5.5 milestone is built against.

## Why

`docs/design-system/` is a complete visual and motion system, and it contradicts
four committed gates: §1.12 ("minimal number-board aesthetic", "neutral surfaces",
"No particles, screen shake, decorative motion"), §1.14 and §1.15 (`title.name` is
`1-0`, and both share formats are fixed verbatim), `product.md` §1.10 (the HUD is
round/score/streak, and nothing says the product prints at game over), and the
AGENTS.md Global Constraint "Use CSS transitions only, and only for functional state
changes".

AGENTS.md makes `docs/spec/**` canonical and says a conflict must be reported rather
than patched around. So the amendment is not the last step argued from screens; it is
the first step, argued from the design record. Everything after it is compliant by
construction, and a rejected amendment costs no merged code.

Three defects in the handover are corrected here rather than carried forward:

- **The focus ring fails WCAG.** `--focus-ring: --gold-300 #e8cd85` measures `1.10:1`
  against the ceramic tile face `#e6d7ba` and `1.51:1` against the gold language
  segment; SC 1.4.11 needs `3:1`. Every tile is a `<button>`, so this is the app's
  most-focused element. §1.12 and §8.5 now state the surface-independent requirement.
- **The Korean locale has no font.** `docs/design-system/readme.md` claims Zen Kaku
  Gothic New "sets both scripts"; it is a Japanese family and serves no Hangul
  subset. §1.12 now requires each locale to render in a face covering its script.
- **There is no responsive layer.** The token set carries zero breakpoints, and a
  `5 × 2` rack of `64px` tiles is `368px` wide — over the `320px` no-scroll gate in
  §8.5. §1.12 now fixes three rack tiers.

- [ ] **Step 1: Amend §1.12**

Replace the visual contract with the Tile House contract. Keep every accessibility
clause. Strike "No particles, screen shake, decorative motion" — ref `2d` is a
six-chip burst and the milestone ships all sixteen storyboard moments — and replace
it with a bound to the *named inventory*, so motion stays enumerable. Keep "No
audio". Add the three rack tiers, the material and hue rules, and the
surface-independent focus-contrast requirement.

- [ ] **Step 2: Amend §1.14 and §1.15**

`title.name` → `ozterisk` in both locales. Add `hud.capacity` (`Capacity` / `용량`)
and `result.rewards` (`Received {count} tiles` / `타일 {count}개 획득`), both taken
from `docs/design-system/ui_kits/game/messages.js` rather than invented. Rewrite both
share templates to lead with `ozterisk`.

- [ ] **Step 3: Amend `product.md` §1.10**

The HUD gains a capacity read-out that does not displace round's primary emphasis or
reorder the three figures. Selecting a tile leaves its socket in place. `gameOver`
prints the product on the board, and is the only phase that does.

- [ ] **Step 4: Amend AGENTS.md and `quality.md` §8.5**

Product name; the motion constraint; the global stylesheet may `@import` token
partials, which is where global `@keyframes` must live; fonts are self-hosted and
same-origin. §8.5's focus item gains the `3:1`-against-every-surface requirement.

- [ ] **Step 5: Rename in live documentation**

`README.md`, `docs/spec/architecture.md`, and the issue template. Task files
`T01`–`T24`, `docs/journal/**`, `docs/archive/**` and
`docs/superpowers/specs/**` are historical records and are **not** rewritten.

- [ ] **Step 6: Commit**

```bash
git add docs/spec/ docs/checklists/ AGENTS.md README.md .github/
git commit -m "docs(spec): permit the Tile House visual and motion system" -m "Task: T25"
```

**Acceptance criteria**

- Nothing under `src/` is modified; `npm run lint && npm run typecheck && npm test && npm run build` stay green.
- Every amended clause is traceable to a rule in `docs/design-system/`.
- Every accessibility clause in the original §1.12 survives verbatim or strictly stronger.
- No `1-0` remains in a live document; every `1-0` that remains is in a historical record.
- §1.12 bounds motion to a named inventory, so "what is allowed" stays answerable without reading the components.

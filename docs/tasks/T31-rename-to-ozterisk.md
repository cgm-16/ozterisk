---
reads:
  - docs/spec/ui-i18n.md  # §1.14 title.name, §1.15 the share formats
---

# T31 — Rename the product from `1-0` to `ozterisk`

```yaml
task_id: T31
title: Land the ozterisk name everywhere src/ still says 1-0
milestone: M5.5b — Foundations and Identity
priority: P1
estimate: S
wave: W1
depends_on: [T28]
parallel_safe: false
paths:
  - src/i18n/messages.ts
  - src/services/sharing.ts
  - src/services/sharing.test.ts
  - src/app/App.test.tsx
  - src/components/TitleScreen/TitleScreen.test.tsx
  - src/components/GameOverScreen/GameOverScreen.test.tsx
  - index.html
  - gallery.html
  - package.json
  - public/favicon.svg
```

**Interfaces**

- Produces: the name every later phase renders. It lands here, early, so no
  later phase writes `1-0` and has to be rewritten.

## Why

§1.14 fixes `title.name` as `ozterisk` in both locales and §1.15 fixes both share
formats to open with it. `README.md` already says `ozterisk` — M5.5a moved it
early so the PR that declared the rename would not ship a README contradicting
itself. `src/` is the other half of that.

- [ ] **Step 1: The strings**

`messages.ts` `title.name` in both locales. `formatShareText` in both locales —
the format is byte-exact in §1.15 and the only change is the leading token.

- [ ] **Step 2: The shell**

`index.html` `<title>` and meta description; `gallery.html` `<title>`;
`package.json` `name`.

`localStorage["one-zero.language"]` **does not change** — §1.13 still specifies
that key, and renaming it would silently drop every existing player's saved
language preference. Leave `src/i18n/storage.ts` alone.

- [ ] **Step 3: The mark**

`public/favicon.svg` currently draws the text `1-0` on a near-black rounded
square. Replace it with the ✳ mark, in Tile House colours — gold on felt, using
the literal hex values from `src/styles/tokens/colors.css`, since an SVG in
`public/` is copied verbatim and cannot read CSS custom properties. Keep the
32×32 viewBox and update `aria-label`.

- [ ] **Step 4: The pinned assertions**

Roughly ten assertions pin the old name. Update the ones that assert the *name*;
change nothing else about them. In particular the two `compareDocumentPosition`
tests and the two computed-font-size tests in these files are load-bearing for
later phases — if one of them fails, you have changed something you should not
have. Do not weaken a test to make it pass.

- [ ] **Step 5: Commit**

```bash
git add src/ index.html gallery.html package.json public/favicon.svg docs/tasks/T31-rename-to-ozterisk.md
git commit -m "feat(identity): rename the product to ozterisk" -m "Task: T31"
```

**Acceptance criteria**

- No occurrence of `1-0` remains in `src/`, the HTML entries, or `package.json`.
- `one-zero.language` is untouched and `storage.test.ts` still passes unmodified.
- Both share strings match §1.15 byte for byte.
- Lint, typecheck, test and build pass.

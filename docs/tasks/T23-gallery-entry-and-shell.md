---
reads:
  - docs/plan/tuning-and-design-system.md  # §5 the gallery's shape and rationale
  - docs/spec/architecture.md  # §2.1 canonical file map
---

# T23 — Gallery entry, shell, and build exclusion

```yaml
task_id: T23
title: Add a dev-only gallery.html entry and the state-picker shell behind it
milestone: M5 — States Gallery
priority: P1
estimate: M
wave: W2
depends_on: [T21]
parallel_safe: false
paths:
  - gallery.html
  - src/gallery/main.tsx
  - src/gallery/Gallery.tsx
  - src/gallery/Gallery.module.css
  - src/gallery/states.tsx
  - docs/spec/architecture.md
```

**Interfaces**

- Produces: `GalleryEntry` and `GALLERY_STATES` from `src/gallery/states.tsx`.
  T24 fills the four empty phase groups and tests them.

## Why

Every visual check on this game is gated behind playing to the state being
checked. Verifying the one-line game-over reason added in PR #42 required
driving a full run to Game Over twice — once at 1920px, once at 320px.

## Gate zero is already settled — do not re-litigate it

Probed on this branch before this task was written:

```bash
printf '<!doctype html><title>probe</title>' > gallery.html
npm run build && ls dist/
```

`dist/` contained `assets/`, `favicon.svg`, `index.html` and nothing else.
Vite 8.1.5 does **not** auto-discover sibling root HTML entries, so
**`vite.config.ts` needs no change.** The dev server does serve
`/gallery.html`, confirmed by response *body*, not status code — an unmatched
path like `/nonexistent.html` also returns 200 via SPA fallback, so a status
check proves nothing here. Full record in
`docs/journal/journal-2026-08-12.md`.

If you find yourself editing `vite.config.ts`, stop and report — the premise
changed and that is worth knowing before it is worked around.

## Design constraints

**One state at a time, chosen from a picker — never a scrolling wall.**
`GameScreen` calls `useGameKeyboard`, which attaches a *window-level*
`keydown` listener per mounted instance (`src/hooks/useGameKeyboard.ts:20`).
N simultaneous screens means N listeners all calling `preventDefault()` on
the same keypress. One at a time also renders each state at real page width,
which is the entire point of the tool.

**`LanguageToggle` is always mounted.** Korean copy runs longer in places
(`버릴 타일 {count}개를 선택하세요.`), and layout breakage under it is
precisely what this tool exists to catch.

**No viewport-width presets.** The app's responsive layer uses
`@media (max-width: 40rem)`, which keys on **viewport** width, not container
width. A narrow frame inside the gallery would render narrow content with the
desktop media queries still applied — a layout the phone never produces,
which is worse than showing nothing. Doing it honestly needs an iframe per
state. Deliberately out of scope; do not add it.

- [ ] **Step 1: Create `gallery.html`**

Mirror `index.html`, pointing at the gallery entry. No `<meta
name="description">` — this page is never indexed.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>1-0 — States Gallery (dev only)</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/gallery/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Create the catalogue module `src/gallery/states.tsx`**

`.tsx`, not `.ts` — entries return JSX. Confirmed clean under
`--max-warnings=0`: a constants-only `.tsx` module raises no
`react-refresh/only-export-components` warning.

The catalogue is keyed by phase rather than a flat array, and that is
load-bearing: `Record<GamePhase, …>` means adding a member to `GamePhase`
in M6 or M7 fails `tsc` until the gallery covers it. A flat array with a
hand-written phase list would rot silently, which is the failure this
structure exists to prevent.

```tsx
import type { ReactNode } from "react";
import type { GamePhase } from "../game/types";

export interface GalleryEntry {
  /** Stable across renders; used as the picker's React key. */
  id: string;
  /** Picker label. English only — the gallery is a dev tool, not a screen. */
  label: string;
  render: () => ReactNode;
}

// Keyed by phase so that adding a GamePhase member fails typecheck until the
// gallery covers it. T24 fills the empty groups.
export const GALLERY_STATES: Record<GamePhase, GalleryEntry[]> = {
  title: [{ id: "title", label: "Title", render: () => <TitleScreen onStart={() => {}} /> }],
  answering: [],
  feedback: [],
  overflow: [],
  gameOver: [],
};
```

Import `TitleScreen` from `../components/TitleScreen/TitleScreen`.

- [ ] **Step 3: Create the shell `src/gallery/Gallery.tsx`**

A `useState` holding the selected entry id, a picker listing every entry
grouped by phase, and the selected entry's `render()` beside it. Flatten
`GALLERY_STATES` with `Object.entries` for the picker; default the selection
to the first entry of the first non-empty group so the page is never blank
while T24 is still filling groups in.

Render `LanguageToggle` in the picker column, always mounted.

Mark the picker up as `<nav>` and the stage as `<div>` — **not** `<main>`.
Several rendered states own a `<main>` themselves (`TitleScreen`,
`GameOverScreen`), and nesting landmarks would make the gallery's own
structure lie about the thing it is displaying.

Skip an empty group entirely rather than rendering an empty heading.

- [ ] **Step 4: Create `src/gallery/main.tsx`**

Mirror `src/main.tsx`'s mount exactly. `StrictMode` is not optional — it is
what caught the double-dispatch bug fixed in `bd5d523`.

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { I18nProvider } from "../i18n/I18nContext";
import { Gallery } from "./Gallery";
import "../styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <Gallery />
    </I18nProvider>
  </StrictMode>,
);
```

- [ ] **Step 5: Style the shell in `src/gallery/Gallery.module.css`**

Two columns on wide viewports, stacked below `40rem`, using the existing
`--space-*` and `--color-*` tokens. Add no new tokens: the gallery must
render states in the app's real design system, and a gallery-only token would
make what you see not what ships.

- [ ] **Step 6: Verify the exit gate**

```bash
npm run build && ls dist/
```

Expected: `assets`, `favicon.svg`, `index.html`. **No `gallery.html`.**
Check `ls` output directly rather than trusting the config — this is the
milestone's exit gate and the reason gate zero was run at all.

- [ ] **Step 7: Verify the dev server serves it**

```bash
npm run dev
```

Open `/gallery.html`. The Title entry renders, the language toggle switches
it to Korean, and the browser console is clean.

- [ ] **Step 8: Full gates**

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

`src/gallery/` falls under `tsconfig.app.json`'s `include: ["src"]`, so it
typechecks with no config change.

- [ ] **Step 9: Document it in `docs/spec/architecture.md`**

Add `gallery.html` and the `src/gallery/` directory to the §2.1 file map, and
add a new **§2.7 Dev-only states gallery** recording: the entry point, that
it is excluded from `dist/` by Vite's default single-input behavior (with the
gate-zero evidence), the one-state-at-a-time constraint and the
`useGameKeyboard` reason for it, and the `Record<GamePhase, …>` coverage tie.

- [ ] **Step 10: Commit**

```bash
git add gallery.html src/gallery/ docs/spec/architecture.md
git commit -m "feat(gallery): add the dev-only states gallery entry and shell" -m "Task: T23"
```

**Acceptance criteria**

- `npm run build` emits no `dist/gallery.html`, verified by `ls`.
- `npm run dev` serves `/gallery.html` and it renders the Title state.
- `vite.config.ts` is unchanged.
- The language toggle works on the gallery page.
- Exactly one state renders at a time.
- §2.1 and the new §2.7 describe what was built.

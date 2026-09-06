---
reads:
  - docs/design-system/components/flow/TitleScreen.jsx  # the four rules and their swatches
  - docs/design-system/components/flow/TitleScreen.prompt.md  # the socket-swatch exception
  - src/components/TitleScreen/TitleScreen.test.tsx  # what is pinned
---

# T44 — Put the four material rules on the felt

```yaml
task_id: T44
title: Give the title screen its wordmark, four swatch rules and More disclosure
milestone: M5.5e — Flow Screens
priority: P1
estimate: M
wave: W1
depends_on: [T43]
parallel_safe: true
paths:
  - src/components/TitleScreen/
  - src/i18n/messages.ts
```

**Interfaces**

- Consumes `T43`'s `title.more` row. Runs beside `T45`, `T46` and `T47`; the four
  share no file except `src/i18n/messages.ts`, which only this task and `T47`
  touch — and in different key namespaces (`title.*`/`howToPlay.*` here,
  `gameOver.*` there). Coordinate by keeping your edits inside your namespace.

## Why

The title screen is the run's front door and the only ceremonial moment in the
game. It currently renders a plain `<h1>`, a paragraph, and a collapsed
`<details>` holding all seven rule topics — an accordion of body copy where the
design draws an introduction to the system's four materials.

The ruling was reached by Ori after seeing both rendered, and it is fixed:

- The design's **four swatch rules stay on the felt**, always visible.
- A **`More` disclosure** sits under them — a native `<details>/<summary>`,
  untreated, in the UI face, exactly like the current one. **No ghost outline:**
  the native marker is already the affordance, and a hairline border would make a
  disclosure read as a button. Keep the design language simple.
- It carries the remaining topics, **keyboard controls first** — the only one of
  them that play never teaches.

Do not relitigate this. Build it.

- [x] **Step 1: Split `howToPlay.outcomes` at its existing sentence boundary**

The design draws four rules, but they cover only three of the seven topics: the
`tile` and `verm` rules are the two halves of `outcomes`. The catalogue bundles
both halves into one string, so the split has to happen for the fourth swatch to
have anything to say.

**Split at the sentence boundary that is already there. Author no new copy.**

- en `outcomes` → `correct`: `A correct answer replaces the tiles you spent and
  grants one extra tile.` and `incorrect`: `An incorrect answer removes the tiles
  you spent and grants no reward.`
- ko `outcomes` → `correct`: `정답이면 사용한 타일을 보충하고 타일 한 개를 추가로
  받습니다.` and `incorrect`: `오답이면 사용한 타일이 보상 없이 사라집니다.`

This keeps `TitleScreen.test.tsx`'s `/A correct answer replaces the tiles you
spent/` matching, unweakened — which is the check that the split preserved
meaning rather than rewrote it.

- [x] **Step 2: The four rules, with material swatches**

Map: `socket` → `howToPlay.capacity`; `tile` → `howToPlay.correct`; `gold` →
`howToPlay.overflow`; `verm` → `howToPlay.incorrect`.

**The swatches are the system's iconography — not icons, not emoji, not
characters.** An `18px` square carrying the real material treatment.

`TitleScreen.prompt.md` records one exception you must honour, and it is the same
failure class as the empty capacity pip that measured `1.27:1` and turned out not
to be rendering at all: **at `18px` on `--felt-900`, `--surface-socket` is
invisible.** The socket swatch uses `--surface-raised` with a hand-softened inset
plus `--rim-socket` instead. `--shadow-socket-sm` is tuned for a ~`34px` chip; at
`18px` its `3px/7px` falloff swallows the whole top half.

**Measure the socket swatch against `--felt-900` and say what you got.** If it
does not read as a well at `18px`, say so and record what you tried. A swatch that
is invisible is worse than no swatch, because the rule then has a dead gap where
its cue should be.

The design lays the four out in a two-column grid, `max-width: 620px`, left
aligned inside a centered column. Check it at `320px` — two columns of that copy
will not fit, so it needs to fall to one.

- [x] **Step 3: The wordmark**

The design sets `oz✳terisk` in `--font-display` at `--size-wordmark` with
`--track-wordmark`, the `✳` in `--accent`, under a `✳` tile.

Two constraints:

1. `TitleScreen.test.tsx:15` asserts `getByRole("heading", { name: "ozterisk" })`.
   The accessible name must stay exactly `ozterisk` — so if the `✳` is a separate
   coloured `<span>` inside the `<h1>`, the name still computes to `ozterisk`
   only because the span's text *is* the `✳`. It is not: the design's markup
   renders `oz` + `✳` + `terisk`, whose accessible name is `oz✳terisk`. **Resolve
   this and say how.** An `aria-label` on the heading is the obvious lever; if you
   use one, the visible text and the name diverge, which is a real cost — state it.
2. The `✳` tile above the wordmark is **not a `Tile`**. `M5.5c` ruled `digit` stays
   `number`; the mark gets the same tokens without claiming to be the primitive.

- [x] **Step 4: The `More` disclosure**

Relabel the `<details>` summary from `title.howToPlay` to `title.more` (`T43`
amended §1.14 for this). It now holds four topics in this order: `keyboard`,
`selecting`, `slots`, `progress`.

`title.howToPlay` becomes unused — **delete it from `src/i18n/messages.ts`**, both
locales. A key the spec no longer requires and nothing renders is dead weight.

Keep the element a native `<details>/<summary>`. `TitleScreen.test.tsx:38` asserts
`closest("details")` and the `open` toggle; both stay true.

- [x] **Step 5: Update only the queries that moved, and only their labels**

Three tests query `getByText("How to Play")` / `getByText("게임 방법")`. Those are
presentation — the label changed, so the query changes with it, to `More` /
`더 보기`.

**Nothing else in that file may weaken.** In particular the seven-topic test keeps
every one of its seven assertions: three topics now resolve on the felt rather
than inside the panel, and `getByText` searches the whole document, so they still
resolve. If one of them stops resolving, a topic went missing — fix the screen,
not the test.

Add one test: the four rules are present on the felt without opening the
disclosure.

- [x] **Step 6: Commit**

```bash
git add src/components/TitleScreen/ src/i18n/messages.ts docs/tasks/T44-title-screen.md
git commit -m "feat(title): introduce the four materials on the felt" -m "Task: T44"
```

**Acceptance criteria**

- Four swatch rules visible without interaction; the socket swatch reads as a well
  at `18px`, with a measured figure recorded.
- The `<details>` is still native and untreated, labelled `More` / `더 보기`, and
  holds keyboard controls first.
- All seven §1.14 topics still resolve; the seven-topic test keeps all seven
  assertions.
- The heading's accessible name is exactly `ozterisk`.
- No horizontal scroll at `320px` in either locale.
- `title.howToPlay` is gone from both locales; no key is orphaned.
- Lint, typecheck, test and build all pass.

**What this task does not do**

- No entrance motion. The `✳` tile drop and wordmark fade are ref `11C`, and
  `M5.5f` owns `keyframes.css`. Build the structure; leave it static.
- Does not touch `LanguageToggle` beyond where it sits on this screen. `M5.5d`
  dressed it.

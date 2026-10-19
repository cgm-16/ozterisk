---
reads:
  - docs/superpowers/specs/2026-10-19-puzzle-prototype-design.md  # §7 screens, §7.1 copy, §8 browser suite
  - docs/spec/ui-i18n.md  # §1.12 order, colour only at the event, motion inventory
  - docs/research/game-modes/03-puzzle/key-moment-sacrifice.svg  # the draft's ledger mock
  - src/components/GameScreen/GameScreen.tsx
  - src/components/GameHud/GameHud.tsx
  - src/components/EquationBoard/EquationBoard.tsx
  - src/components/Tile/Tile.tsx
  - src/components/TileInventory/TileInventory.tsx
  - src/components/TileInventory/TileInventory.module.css
  - src/gallery/states.tsx
  - e2e/viewport.spec.ts
---

# T88 — HUD, ledger, rack and the layout check

```yaml
task_id: T88
title: HUD, ledger, rack and the layout check
milestone: M8 — Puzzle Prototype
priority: P1
estimate: M
wave: W3
depends_on: [T87]
parallel_safe: false
paths:
  - src/components/PuzzleLedger/
  - src/components/GameScreen/
  - src/components/GameHud/
  - src/components/TileInventory/
  - src/components/TitleScreen/TitleScreen.tsx
  - src/i18n/messages.ts
  - src/gallery/states.tsx
  - src/gallery/states.test.tsx
  - e2e/viewport.spec.ts
  - e2e/puzzle-fit.spec.ts
```

## Why

The whole thesis is that the table is on screen: eight rows with their pays,
par in the HUD. The layout check lands here, with the ledger, so a ledger that
does not fit a phone is redesigned before anything is built on it (spec §9.1).

## Interfaces

**Consumes (T86, T87):** `GameState.table`, `GameState.rowResults`,
`PuzzleTable`, `getCapacity("puzzle")`.

**Produces:**

```ts
// src/components/PuzzleLedger/PuzzleLedger.tsx
export interface PuzzleLedgerProps {
  table: PuzzleTable;
  /** The displayed round, 1-based: row `round` is the current row. */
  round: number;
  rowResults: readonly RoundResult["kind"][];
}
export function PuzzleLedger(props: PuzzleLedgerProps): JSX.Element;

// src/components/GameHud/GameHud.tsx
export interface GameHudProps { /* …existing… */ par?: number }

// src/i18n/messages.ts (en | ko)
hud.par:          "Par" | "목표"
ledger.label:     "Table" | "판"
ledger.row:       "Row {row}, {left} × {right}, pays {pay}" | "{row}번째 줄, {left} × {right}, 보상 {pay}"
ledger.answered:  "answered" | "정답"
ledger.missed:    "missed" | "오답"
howToPlay.puzzle: spec §7.1, both languages
```

## Steps

- [ ] **Write the failing tests.**

      `src/components/PuzzleLedger/PuzzleLedger.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "../../i18n/I18nContext";
import { PUZZLE_SAMPLE } from "../../test/fixtures";
import { PuzzleLedger } from "./PuzzleLedger";

function renderLedger(round: number, rowResults: ("correct" | "incorrect")[], language: "en" | "ko" = "en") {
  return render(
    <I18nProvider initialLanguage={language}>
      <PuzzleLedger table={PUZZLE_SAMPLE} round={round} rowResults={rowResults} />
    </I18nProvider>,
  );
}

describe("PuzzleLedger", () => {
  it("lists all eight rows with their pays, row 1 current", () => {
    renderLedger(1, []);
    const rows = within(screen.getByRole("list", { name: "Table" })).getAllByRole("listitem");
    expect(rows).toHaveLength(8);
    expect(rows[0]).toHaveAttribute("aria-current", "step");
    expect(rows[0]).toHaveTextContent("Row 1, 3 × 5, pays 9, 5, and 5");
    expect(rows[2]).toHaveTextContent("Row 3, 3 × 3, pays 2 and 7");
    expect(rows[1]).not.toHaveAttribute("aria-current");
  });

  it("marks played rows answered or missed, in ink, and moves the current row", () => {
    renderLedger(4, ["incorrect", "correct", "correct"]);
    const rows = screen.getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("missed");
    expect(rows[1]).toHaveTextContent("answered");
    expect(rows[3]).toHaveAttribute("aria-current", "step");
  });

  it("reads the pay as a Korean list in Korean", () => {
    renderLedger(1, [], "ko");
    const rows = within(screen.getByRole("list", { name: "판" })).getAllByRole("listitem");
    const list = new Intl.ListFormat("ko", { type: "conjunction" }).format(["2", "7"]);
    expect(rows[2]).toHaveTextContent(`3번째 줄, 3 × 3, 보상 ${list}`);
  });
});
```

      `GameHud.test.tsx`: with `par={7}` an entry labelled Par reads 7; without
      it there is no Par entry (follow the file's capacity tests).

      `GameScreen.test.tsx`: a Puzzle answering state (built as in the gallery
      step below) renders the ledger and no `CapacityMeter`; the HUD shows Par 7;
      the rack draws exactly five sockets. A Play Again state built from another
      table shows that table's row 1 as current (Review Focus 4).

      `TitleScreen.test.tsx`: "More" lists the Puzzle topic.

- [ ] **Run them and record the failure.**
      Run: `npx vitest run src/components`
      Expected: FAIL. `./PuzzleLedger` does not resolve; no Par entry.
- [ ] **Copy.** The keys in Interfaces, en and ko, in `messages.ts`;
      `howToPlay.puzzle` from spec §7.1.
- [ ] **HUD.** `par?: number`, rendered as a fourth entry after Streak in the
      shape of the existing capacity entry (`hud.par`).
- [ ] **Ledger.** `src/components/PuzzleLedger/PuzzleLedger.tsx` and its module
      CSS:
  - `<ol aria-label={t("ledger.label")}>` of `table.rows`. Row `index` is
    played when `index < rowResults.length`, current when
    `index === round - 1`, later otherwise.
  - Every row: a visually hidden span carrying the row's full text
    (`ledger.row`, with `pay` formatted by
    `new Intl.ListFormat(language, { type: "conjunction" })`, plus
    `, ${t("ledger.answered" | "ledger.missed")}` when played), and the visual
    content beside it under `aria-hidden="true"`. Add the clip pattern as a
    `.label` class in the module; the repo has no shared visually-hidden
    utility, and one class does not earn one.
  - Visual: played rows show `left × right` and ✓ or ✗ in ink tokens, no
    semantic colour (§1.12). The current row renders its equation with
    `EquationBoard`, so the 10b rise plays as it arrives, and its pay as
    `Tile size="sm"`. Later rows show `left × right` and the pay as
    `Tile size="sm"`.
  - No transition or animation in the module. The current row wears an accent
    border token so it reads as "you are here" without colour carrying it alone.
- [ ] **Screen.** In `GameScreen`, when `state.table` is set (Puzzle only),
      render
      `<PuzzleLedger table={state.table} round={state.round} rowResults={state.rowResults ?? []} />`
      in place of `EquationBoard`, and pass `par={state.table?.par}` to the HUD.
- [ ] **Rack.** `TileInventory` sets `data-size="row"` when it is not stepped
      and `capacity <= 5`; the module adds
      `.rack[data-size="row"] > .rail, .rack[data-size="row"] > .inventory { --rack-rows: 1; }`
      with a comment: the Endless rack's `5 × 2` would leave Puzzle's five an
      empty second row.
- [ ] **Title.** `MORE_TOPICS` gains `"puzzle"` after `"classic"`.
- [ ] **Gallery.** In `src/gallery/states.tsx`, under `answering`:
  - `answering-puzzle`, "Answering — Puzzle, the sample at row 1":
    `makeAnsweringState(PUZZLE_SAMPLE.rows[0].equation, { mode: "puzzle", table: PUZZLE_SAMPLE, rowResults: [], inventory: sortTiles(createTiles(PUZZLE_SAMPLE.hand, sequentialIds())) })`.
  - `answering-puzzle-row-4`, "Answering — Puzzle at row 4, three rows marked":
    round 4, `totalRounds` 3, score 2, `rowResults: ["incorrect", "correct", "correct"]`,
    hand 1 2 6 7 8.

  Bump `STATE_COUNT` in `e2e/viewport.spec.ts` by two. That keeps the sweep's
  guard true to the gallery, which now has two more states. The guard itself
  is not loosened.
- [ ] **Run the unit tests.** `npx vitest run src`. Expected: PASS.
- [ ] **Write the layout check**, `e2e/puzzle-fit.spec.ts`. Geometry only. For
      each locale, with the locale set by `addInitScript` before the first load,
      as `viewport.spec.ts` does:
  1. For each viewport, 393 × 660 and 375 × 660 (the iPhone 13 mini's width,
     where Korean rows are likeliest to wrap): set it, go to `/`, choose
     Puzzle, and press `START_LABEL[locale]`.
  2. **Guards first:** `window.innerWidth` and `window.innerHeight` equal the
     viewport set; the ledger list holds 8 items; the rack holds 5 sockets.
  3. **Then the reading:** `document.documentElement.scrollHeight <=
     window.innerHeight`, and the rack's bottom edge is ≤ `window.innerHeight`.
  4. **The instrument must be able to fail:** in the same test, set the viewport
     to 393 × 400 and assert `scrollHeight > innerHeight`. If the 400-high
     reading also "fits", the check is measuring nothing.
- [ ] **Run the browser suite.** `npm run test:e2e`. Expected: PASS, including
      the 30-state sweep at 305, 320, 407 and 408 in en and ko. If 393 × 660
      does not fit, stop: the ledger's row height and the pay tile size are the
      levers, in that order. Do not remove a row and do not shrink the rack.
- [ ] **Look at it.** `npm run dev`, Puzzle, at 393 × 660 in both languages.
- [ ] **Gates.** `npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e`.
- [ ] **Commit.**

```bash
git add src/components src/i18n/messages.ts src/gallery e2e
git commit -m "feat(puzzle): the ledger, par in the HUD, and a one-row rack" -m "Task: T88" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Acceptance gate

- `npm test` and `npm run test:e2e` green.
- At 393 × 660 and 375 × 660, the HUD, ledger, slots, actions and rack fit with
  no page scroll in en and ko, and the same check reports a scroll at 393 × 400.

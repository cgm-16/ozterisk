---
reads:
  - docs/superpowers/specs/2026-10-19-puzzle-prototype-design.md  # §7 game over and sharing, §7.1 copy
  - docs/spec/ui-i18n.md  # §1.15 sharing contract
  - src/components/GameOverScreen/GameOverScreen.tsx
  - src/components/GameOverScreen/GameOverScreen.test.tsx
  - src/services/sharing.ts
  - src/services/sharing.test.ts
  - src/app/App.test.tsx
  - src/gallery/states.tsx
---

# T89 — Game over, sharing and copy

```yaml
task_id: T89
title: Game over, sharing and copy
milestone: M8 — Puzzle Prototype
priority: P1
estimate: M
wave: W4
depends_on: [T88]
parallel_safe: false
paths:
  - src/components/GameOverScreen/
  - src/services/sharing.ts
  - src/services/sharing.test.ts
  - src/app/App.test.tsx
  - src/i18n/messages.ts
  - src/gallery/states.tsx
  - e2e/viewport.spec.ts
```

## Why

A Puzzle run ends against par, not against the floor. `won` means a Classic win
in three places today: the final hand, `winReason`, `winTitle`. Puzzle would
inherit all three, as it nearly inherited Classic's capacity, unless game over
and sharing branch on the mode first (spec §7).

## Interfaces

**Consumes (T86):** `isParMade`, `GameState.table`.

**Produces:**

```ts
// src/services/sharing.ts
export type ShareStats = { score: number; totalRounds: number; longestStreak: number } & (
  | { mode: "endless"; won: false }
  | { mode: "classic"; won: boolean }
  /** `won`: made par. `rows`: the table's length, so a finished table is totalRounds === rows. */
  | { mode: "puzzle"; won: boolean; par: number; rows: number }
);

// src/i18n/messages.ts (en | ko)
gameOver.parTitle:    "Made par" | "목표 달성"
gameOver.shortTitle:  "{short} short of par" | "목표까지 {short}점 부족"
gameOver.tableReason: "All eight rows played." | "여덟 줄을 모두 풀었습니다."
share.puzzleAsk:      "Can you make par?" | "목표를 달성할 수 있나요?"
```

## Share text

Exact, for a 7 of 8 at par 7 with a longest streak of 4:

```text
ozterisk Puzzle — Made par — Score: 7/8 · par 7
Longest streak: 4

Can you make par?
https://example.test/
```

```text
ozterisk 묘수풀이 — 목표 달성 — 점수: 7/8 · 목표 7
최장 연속 정답: 4

목표를 달성할 수 있나요?
https://example.test/
```

Short of par, the heading's middle is `3 short of par` / `목표까지 3점 부족`.

## Steps

- [ ] **Write the failing tests.**

      `src/services/sharing.test.ts`:

```ts
describe("Puzzle", () => {
  const madePar = { ...makeGameOverState(PUZZLE_SAMPLE.rows[7]!.equation), mode: "puzzle" as const,
    table: PUZZLE_SAMPLE, rowResults: [], score: 7, totalRounds: 8, longestStreak: 4 };

  it("reports made par as won, with the table's par and length", () => {
    expect(getShareStats(madePar)).toEqual({
      mode: "puzzle", won: true, par: 7, rows: 8, score: 7, totalRounds: 8, longestStreak: 4,
    });
    expect(getShareStats({ ...madePar, score: 6 }).won).toBe(false);
  });

  it("formats the English Puzzle share text exactly", () => {
    expect(formatShareText(getShareStats(madePar), "en", "https://example.test/")).toBe(
      "ozterisk Puzzle — Made par — Score: 7/8 · par 7\nLongest streak: 4\n\nCan you make par?\nhttps://example.test/",
    );
    expect(formatShareText(getShareStats({ ...madePar, score: 4 }), "en", "https://example.test/")).toMatch(
      /^ozterisk Puzzle — 3 short of par — Score: 4\/8 · par 7\n/,
    );
  });

  it("formats the Korean Puzzle share text exactly", () => {
    expect(formatShareText(getShareStats(madePar), "ko", "https://example.test/")).toBe(
      "ozterisk 묘수풀이 — 목표 달성 — 점수: 7/8 · 목표 7\n최장 연속 정답: 4\n\n목표를 달성할 수 있나요?\nhttps://example.test/",
    );
  });
});
```

      `GameOverScreen.test.tsx`, a `describe("Puzzle", …)` rendering
      `GameOverScreen` with Puzzle stats:
  - made par, table finished (`totalRounds === rows`): heading "Made par" with
    the gold class Run Complete uses; no equation; reason "All eight rows
    played."; Score reads "7 / 8"; Par reads 7; Longest streak reads 4; no
    "Rounds played" entry; no final-hand sockets.
  - short of par, table finished: heading "2 short of par" without the gold
    class.
  - ended early (`totalRounds < rows`): the terminal equation with its product,
    and the loss reason "Not enough tiles left to answer."
  - The Classic and Endless tests above stay as they are.

      `App.test.tsx`, inside T87's `describe("Puzzle", …)`:

```ts
it("plays the sample's par line, sacrifice included, to Made par", async () => {
  const user = userEvent.setup();
  renderApp([]);
  await startPuzzle(user);
  for (const move of PUZZLE_SAMPLE_PAR_LINE) {
    await press(user, move.spend);
    if (move.discard === undefined) {
      await user.click(screen.getByRole("button", { name: "Next Round" }));
    } else {
      await user.click(screen.getAllByRole("button", { name: `Digit ${move.discard}` })[0]!);
      finishDeparture();
    }
  }
  expect(await screen.findByRole("heading", { name: "Made par" })).toBeInTheDocument();
  expect(hudField("Par")).toBe("7");
});

it("ends early when the hand cannot fill the next row, short of par", async () => {
  const user = userEvent.setup();
  const twoTiles: PuzzleTable = {
    hand: [1, 2],
    rows: [makePuzzleRow(3, 4, [1, 2, 3]), makePuzzleRow(5, 5, [1, 2, 3])],
    par: 1,
  };
  renderApp([], { dealPuzzle: () => twoTiles });
  await startPuzzle(user);
  await press(user, [2, 1]); // 21 for 12: the hand is spent
  await user.click(screen.getByRole("button", { name: "Next Round" }));
  expect(screen.getByRole("heading", { name: "1 short of par" })).toBeInTheDocument();
  expect(screen.getByText("Not enough tiles left to answer.")).toBeInTheDocument();
});
```

- [ ] **Run them and record the failure.**
      Run: `npx vitest run src/services src/components/GameOverScreen src/app`
      Expected: FAIL. `getShareStats` returns the Endless shape for Puzzle, and
      no heading reads "Made par".
- [ ] **Copy.** The four keys in Interfaces, en and ko.
- [ ] **Sharing.** `getShareStats` branches three ways on `state.mode`; Puzzle
      gives `won: isParMade(state)`, `par: state.table.par`,
      `rows: state.table.rows.length`. `shareHeading` gains a Puzzle case,
      `ozterisk ${mode.puzzle} — ${won ? gameOver.parTitle : shortTitle(par - score)}`.
      `formatShareText` builds Puzzle's body as in Share text above; Endless and
      Classic bodies are unchanged.
- [ ] **Game over.** `GameOverScreen` branches on `stats.mode` first:
  - Puzzle: heading `parTitle` (gold, the class `won` uses) or `shortTitle`;
    terminal shows nothing but `tableReason` when `totalRounds === rows`, else
    the terminal equation and `gameOver.reason`; stats are Score as
    `${score} / ${rows}` (primary), Par (`hud.par`), Longest streak.
  - Classic and Endless: today's code, unchanged.
- [ ] **Gallery.** `gameOver-puzzle`, "Game over — Puzzle, made par":
      `makeGameOverState(PUZZLE_SAMPLE.rows[7].equation, { mode: "puzzle", table: PUZZLE_SAMPLE, rowResults: ["incorrect", "correct", "correct", "correct", "correct", "correct", "correct", "correct"], score: 7, totalRounds: 8, round: 9, longestStreak: 7 })`
      with the hand 2 2 7 8 8. Bump `STATE_COUNT` in `e2e/viewport.spec.ts` by one.
- [ ] **Run the tests.** `npm test`, then `npm run test:e2e`. Expected: PASS.
- [ ] **Look at it.** `npm run dev`: play the sample (the third deal) to the end
      along its par line; Made par, in gold; Copy Result pastes the text above.
- [ ] **Gates.** `npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e`.
- [ ] **Commit.**

```bash
git add src/components/GameOverScreen src/services src/app/App.test.tsx src/i18n/messages.ts src/gallery e2e/viewport.spec.ts
git commit -m "feat(puzzle): game over and share text against par" -m "Task: T89" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Acceptance gate

- `npm test` and `npm run test:e2e` green.
- The sample's par line, played through the UI, ends at "Made par".

## After this task

Push. The draft PR, open since T85, now has a playable preview: tick its
evidence boxes for T85–T89 and post the preview URL. The playtest follows spec
§6.1.

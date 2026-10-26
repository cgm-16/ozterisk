# Puzzle Window — design

Date: 2026-10-26
Status: decisions approved by Ori in session. The dial values (§5.5) and the
playtest's confound mitigation (§7) are Claude's proposals awaiting Ori. The
written spec awaits review.
Tracking: #207 (milestone `M10 — Puzzle Window`)
Decision record: `docs/journal/journal-2026-10-26.md` (#208)
Builds on: `docs/superpowers/specs/2026-10-19-puzzle-prototype-design.md`
(cited below as "M8's spec"). Every rule not named here is M8's.
Amends nothing until M10's playtest passes; §9 lists what a merge needs.

## 1. Purpose

On M8's face-up build, play is "look at the table for a while, then solve
everything or fail". All eight rows are visible at once, so the one big
decision comes first and the rest is execution (journal 2026-10-26).

M10 keeps the table fixed but shows it through a **window**: the current row
and the next few. The player re-plans at every row with part of the future in
view. Classic asks *what do I keep, given what might come?* M8 asked *given
what will come?* M10 asks *given what I can see coming?*

M10's playtest (§7) asks **is this more fun to play again than face-up?**

## 2. Scope

**In:**
- the window and face-down rows;
- par set by a window bot;
- a deal filter measured on that bot;
- Made par at or above par;
- copy for the window;
- removing M8's fixed playtest set.

**Out:**
- motion for a row entering the window (§1.12; a later pass if M10 survives);
- a fixed playtest set or any replayable table;
- numbered, daily or retryable tables, and a par-line reveal (#195);
- face tiles;
- any change to Endless or Classic.

## 3. Rules

A delta against M8's spec §3:

- **Window.** The player sees `PUZZLE_WINDOW` rows (*k*): the current row and the
  next *k* − 1, each with its equation and pay. The window stops at row 8.
  Later rows are face down: their row number is shown, but not their equation
  or pay.
- **When the window moves.** It is set by the displayed round. It moves at
  Next Round, so one row turns face up per submission. During feedback,
  including an overflow discard, the window is unchanged. The discard is
  therefore chosen with the same rows in view as the answer.
- **Par.** The window bot's score on the table (§5.2), set at the deal and
  shown in the HUD from the first row. A player can score above par.
- **Made par.** A game over with score **at or above** par. M8 required
  score equal to par, because nothing could exceed its par.
- **Unchanged from M8:**
  - eight rows (`PUZZLE_ROWS`) and capacity five;
  - answering, correct, incorrect and overflow;
  - the end rule: the run ends when the hand can't attempt the next row.

  M10 keeps M8's end rule on purpose. Scoring an unattemptable row 0 and
  playing on changed no par and saved 0.05–0.15 rows per mistake (journal
  2026-10-26).

## 4. State and reducer

The window is presentation. The reducer keeps the whole table, as in M8, and
needs no window state: which rows are face up follows from `round` and *k*.

- **`PuzzleTable.par`** now holds the window par. Its doc comment says so. The
  type is otherwise unchanged.
- **`isParMade`**: `score >= table.par`, not `===`.
- **Everything else** in the reducer, selectors and factories stays M8's.

No game state is persisted. As M8's, the table lives in memory, readable in
dev tools. AGENTS.md rules out anti-cheat.

## 5. The deal

### 5.1 What stays

`solvePuzzle`, `playMyopic`, `plantTable` and `PUZZLE_DEAL_ATTEMPTS` stay as
M8 shipped them. The clairvoyant solver is still needed: window only-moves
(§5.3) are judged under perfect play.

### 5.2 The window bot

`playWindow(deal, k)` returns `{ score, onlyMoves }`. It is pure, in
`src/game/puzzle.ts`, and uses the solver's move generator (M8's spec §5.1).

- **The rows it sees.** At row *r*, the visible rows are *r* to
  min(*r* + *k* − 1, 8).
- **Ranking a move.** Each legal move gets the lexicographic maximum, over
  every continuation within the visible rows, of:
  1. correct answers within the window;
  2. the hand size after the last visible row;
  3. the number of distinct digits in that hand.

  Rows beyond the window are ignored. The end rule applies inside the window.
- **Choosing.** The bot plays the highest-ranked move. Remaining ties go to a
  correct answer before a miss, then to the move whose sorted list of spent and
  discarded digits is lexicographically smallest. Par is therefore
  deterministic.
- **The score** is the bot's correct answers over the whole table, played to its
  end under the end rule. That score is the table's par.
- **Reference.** `docs/research/game-modes/03-puzzle/sims/window/lib.ts` is the
  reference implementation of the window bot, window only-moves and Hard-type.
  Two readings in it set par:
  - a line that stops early inside the window is ranked by the hand it held
    when it stopped;
  - a run "ends before row 8" when it makes fewer than eight submissions.

Instrument check: at *k* = 8 the bot sees every row, so its score must equal
`solvePuzzle`'s par on every table. M10's tests check it on the sample (§8).
The sim checked it on 3 of 3 playtest tables and 300 of 300 M8-band tables. A
control that drops the bot's correct-count ranking fails it on 1 of 3 and 99
of 300 (§5.5).

### 5.3 Window only-moves

A **window only-move** is a decision on the window bot's line where:
- at least two options exist; and
- exactly one of them can still reach the window par under perfect clairvoyant
  play afterwards.

These are the moments where the window holds a trap. `playWindow` counts them.

### 5.4 `dealPuzzle`

`dealPuzzle` plants and filters, as M8's does, for at most
`PUZZLE_DEAL_ATTEMPTS` attempts. It replaces M8's band with three rules, all
measured on the window bot:

- window par ≥ `PUZZLE_MIN_WINDOW_PAR`;
- `playMyopic(deal)` < window par;
- window only-moves ≥ `PUZZLE_MIN_WINDOW_ONLY_MOVES`.

At the cap it returns the last table planted, with its window par, so the
screen stays honest.

### 5.5 Dials

`PUZZLE_MIN_PAR` and `PUZZLE_MIN_ONLY_MOVES` are removed: they never reached
`main`. Three dials are added to `src/game/balance.ts`, each with its economy
effect documented there:

| Dial | Value | Effect |
|---|---|---|
| `PUZZLE_WINDOW` | 4 | Rows in view, the current one included. Larger windows bring par closer to clairvoyant play and give more to read per decision. 8 is M8's face-up table. |
| `PUZZLE_MIN_WINDOW_PAR` | 6 | The lowest window par the filter accepts. Raising it to 7 cuts acceptance from about 1 in 4 to 1 in 10. |
| `PUZZLE_MIN_WINDOW_ONLY_MOVES` | 2 | The fewest window only-moves accepted, M8's floor carried over. With the myopic rule, it takes Hard-type tables from 28% of plants to under 1% of deals. |

**Measured basis.**
- **Instrument.** `docs/research/game-modes/03-puzzle/sims/window/`, with logs
  beside each script.
- **Code.** Run against `feat/M8-puzzle-prototype` at 3ccd37b, and re-run on
  this branch with identical output except timing.
- **Caveat.** These are bot scores, not player data.
- **Drift.** The sims describe 3ccd37b. M10's build removes
  `playtestTables.ts` and M8's band dials, which they import, so after the build
  they are re-run from `git archive 3ccd37b`.

**Choosing *k*.** Ori approved the rule "the smallest *k* where reading the
window captures most of what seeing everything is worth". Claude read "most" as
0.75 and wrote that bar into the sim's brief before it ran: the smallest *k*
whose **captured share** reaches 0.75 on unfiltered plants. Captured share is
mean(window − myopic) / mean(clairvoyant − myopic).

| *k* | 1 | 2 | 3 | 4 | 5 | 8 |
|---|---|---|---|---|---|---|
| Captured, seed 1 | 0.105 | 0.504 | 0.751 | 0.880 | 0.952 | 1 |
| Captured, seed 2 | 0.098 | 0.496 | 0.732 | 0.869 | 0.944 | 1 |
| Hard-type plants, seed 1 | 71.5% | 52.8% | 37.8% | 28.5% | 24.1% | 21.4% |

- *k* = 3, the starting value, clears the bar on seed 1 but misses it on seed 2
  and pooled (0.742). *k* = 4 clears it on both seeds, so the dial is 4.
- **On the tables the filter accepts, the two are close.** At floors (6, 2) a
  careful window reader loses 0.09 rows to clairvoyant play at *k* = 4
  (window 6.37, clairvoyant 6.46) and 0.18 rows at *k* = 3 (6.34, 6.52).
- *k* = 3 at the same floors accepts 1 plant in 4–5, and 1.5–2.0% of its
  deals are Hard-type. Choosing between 3 and 4 is open for Ori (#207).

**The filter at *k* = 4, floors (6, 2), seeds 1 and 2:**
- **Acceptance:** 27.0% and 25.7%.
- **Hard-type share of accepted deals:** 0.37% and 0.58%.
- **Hard-type, defined:** the window bot's run ends before row 8, or its par is
  2 or more below clairvoyant par.
- **Deal time on a Mac:** a median of 1.9 ms and a maximum of 17 ms over 300
  deals, with no cap hits. Phone time is unmeasured; §8's manual check covers
  it.
- **M8's band through a window:** read at *k* = 4, 13% of M8-band tables are
  Hard-type (26% at *k* = 3). M8's band therefore cannot carry over unchanged.
- **The three M8 playtest tables at *k* = 4:** window par 6 against
  clairvoyant 7, and none is Hard-type.

## 6. Screens and copy

### 6.1 Ledger

`PuzzleLedger` gains `window: number`. Rows are drawn in four states:

- **played**: as M8's;
- **current**: as M8's;
- **in view**: the equation and the pay as small `Tile`s, as M8's later rows;
- **face down**: one compact line with the row number only. Accessible text:
  "Row 6, not yet shown".

A row's change of state is instant, as in M8. The face-down line is shorter than a
face-up row, so the ledger is no taller than M8's. The answering-state layout
check (`puzzle-fit`, 393 × 660 and 375 × 660, en and ko) still applies.

### 6.2 Results and sharing

- **Heading.** **Made par** in gold at or above par. Otherwise **{n} short of
  par**, as M8's.
- **Stats.** Par reads "6 (+1)" when the score is above par, "6" otherwise.
- **Share text.** M8's format. "Score: 7/8 · par 6" already reads correctly above
  par.

### 6.3 Copy

The name stays Puzzle / 묘수풀이 for the prototype. Whether 묘수풀이 (a problem
seen whole) still fits is decided after M10's playtest. The Korean below is a
draft for Ori to judge. Each "four" follows *k*.

| Key | English | Korean |
|---|---|---|
| `mode.puzzleHint` | Four rows in view | 네 줄씩 내다보며 |
| `howToPlay.puzzle` | Puzzle deals five tiles and a table of eight equations, each printed with the tiles it pays. You see four rows at a time, and the next one turns up as you play. A correct answer takes its row's tiles, and your hand holds five. Par is what careful play on the same four rows scores. A wrong answer is a legal move. | 묘수풀이는 타일 다섯 개와 문제 여덟 개로 시작하며, 문제마다 받을 타일이 적혀 있습니다. 한 번에 네 줄만 보이고, 풀 때마다 다음 줄이 나타납니다. 정답을 맞히면 그 줄의 타일을 받고, 손에는 다섯 개까지 보관합니다. 목표는 같은 네 줄을 보고 신중하게 두었을 때의 점수입니다. 오답도 둘 수 있는 한 수입니다. |
| `ledger.hidden` | Row {row}, not yet shown | {row}번째 줄, 아직 가려짐 |
| `gameOver.parMargin` | {par} (+{margin}) | {par} (+{margin}) |

Every other Puzzle key keeps M8's text.

### 6.4 The playtest set leaves

`src/game/playtestTables.ts` and the `dealPlaytestFirst` wrapper in `main.tsx`
are deleted. `main.tsx` passes `dealPuzzle(Math.random)` directly. The sample
table stays in `src/test/fixtures.ts`, which the reducer replay and the gallery
read. The test comparing the two copies of the sample leaves with the file. This
is the "strip the set" half of T90, done in M10 itself.

## 7. Playtest

Fixed before M10's first tester. M10 is built only after M8's baseline result,
and is cancelled if most baseline testers never looked at the ledger (journal
2026-10-26).

- **Testers.** The baseline's testers where possible, since the preference
  question needs people who played face-up. Ori's own read is a designer note,
  not a data point.
- **Rules.** As M8's §6.1: before the first table the observer opens "More"
  with the tester, so Puzzle's rule is read.
- **Tables.** Three live deals. After the third, the observer stops prompting
  and waits.
- **Recorded per tester:**
  - whether they start a fourth table unprompted;
  - seconds spent on each row, which shows whether thinking spreads across the
    run or bunches up front;
  - score against par per table;
  - afterwards: "Which would you rather play again: this, or the face-up
    version?"
- **Kill condition.** Drop M10 if most testers do not start another table
  unprompted, **or** most would rather play face-up. Seconds per row are
  recorded, not gated.
- **Known confound in the preference question.**
  - Baseline testers played face-up on M8's fixed set first: Medium, then two
    tables the lookahead bot rates Hard (journal 2026-10-26).
  - M10 deals only filtered live tables, against a par a bot has already
    reached.
  - M10 is also played second, with the rules already learned.
  - A preference for M10 may be a preference for easier tables, or for
    familiarity, rather than for the window.

  The mitigation is open for Ori and must be settled before the first tester
  (#207). The proposal: ask the preference question against the tester's
  *fourth* face-up table, which M8's protocol already deals live (about 85%
  of live deals are Medium). That removes most of the difficulty gap. The
  order effect stays, recorded as a known limit.
- **The result** goes to `main` in its own journal PR, under the 2026-10-19
  rule.

## 8. Testing

Test-first throughout. Record each test's expected failure before the code.

- **`playWindow`**:
  - at *k* = 8 it equals `solvePuzzle`'s par on the sample;
  - at *k* = 1 on a hand-built table, a tie-break changes the bot's move, and
    the test pins the move;
  - only-moves on a hand-built table with one known trap.
- **Port gate.** A one-off script run, recorded in the PR as M8's calibration
  was. `playWindow` matches `lib.ts`'s window par plant for plant on seed 1's
  2,000 plants at *k* = 4. The shipped filter accepts 540 of them (27.0%) at
  floors (6, 2). A miss means the port is wrong, not the dials.
- **`dealPuzzle`**: under a scripted `RandomSource`, the table it returns passes
  the three rules. A source that never passes returns a table at the cap with
  its window par.
- **Reducer and selectors**: `isParMade` holds above par and at par, and not
  below.
- **`PuzzleLedger`**: at round *r* the right rows are face up and face down,
  feedback leaves the window unchanged, and the accessible text holds in en and
  ko.
- **Game over and share**: "6 (+1)" above par; the share text above par.
- **Browser suite**: `puzzle-fit` re-run at its viewports. Geometry only.
- **Manual**: on Ori's iPhone 13 mini, Start Run to the ledger's first paint in
  under 100 ms. The window bot runs at every deal attempt, so this is the
  check that it is cheap enough.

## 9. Milestone and merge gate

- **Branch.** `feat/M10-puzzle-window`, cut from `feat/M8-puzzle-prototype`.
  One draft PR against `main`, one commit per task (AGENTS.md §4.4).
- **Tasks.** Written in the plan after M8's baseline result, when the build is
  cleared to start. When M10 replaces M8, T85–T90 move to M10, and T90 keeps
  only its spec-amendment half (#207).
- **Pass.** The spec amendments land, and the PR is marked ready:
  - `product.md` §1.1, §1.2, §1.3, §1.5, §1.7a, §1.8, §1.10 and §1.14, as in
    M8's spec §9.3, written for the window;
  - `ui-i18n.md` §1.12 (the ledger with its window and face-down rows) and
    §1.15 (the Puzzle share format);
  - `docs/plan/traceability.md`.
- **Fail.** The PR closes unmerged, and the result goes in the journal.

## 10. Risks

- **The tie-break sets par.** A different tie-break gives a different par, and
  it is a judgement, not a measurement. The instrument check at *k* = 8 bounds
  the bot but does not justify its tie-breaks.
- **Four rows may still go unread.** The baseline result decides whether M10
  is built at all (§7).
- **The preference question is confounded** (§7).
- **On dealt tables, the window costs a careful reader almost nothing.** At
  *k* = 4 and floors (6, 2), the window bot's par sits 0.09 rows below
  clairvoyant play (§5.5). That follows from the filter, which rejects tables
  where the hidden rows punish careful reading.
  - The window therefore changes *when* the player thinks, not what a careful
    player can score. That is the redesign's aim.
  - What separates players is reading: the myopic bot scores below par on
    every dealt table.
  - If testers find the window adds nothing, this is the first place to look.

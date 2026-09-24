# ozterisk Product Specification

Canonical game rules (§1.1–§1.11, §1.17). The visual, language, copy, sharing,
and persistence contracts (§1.12–§1.16) live in `docs/spec/ui-i18n.md`.

### 1.1 Product thesis

`ozterisk` is an arithmetic inventory game with two modes. **Endless** runs at a fixed capacity until the player runs out of tiles. **Classic** starts at a larger capacity that closes one socket at a time on a fixed schedule, and ends when it reaches its floor. A digit tile is simultaneously:

1. a resource required to construct an answer;
2. a consumable spent on every submission; and
3. an inventory-management choice because correct play returns one net tile before capacity resolution.

The PoC validates whether this loop is understandable and engaging. It does not validate competition, retention, monetization, anti-cheat, or online services.

### 1.2 Equation pool and randomness

- Operands are integers `1` through `9`, inclusive.
- The sampling pool contains the 45 unordered pairs `(a, b)` where `1 <= a <= b <= 9`.
- Every new equation draws a gate sample first. At or above the kind-equation rate (a tuning dial; see § Tuning surface in the technical contract) the pair is drawn uniformly with replacement from the full pool; below it, the pair is drawn uniformly from only those pairs whose product the current inventory can spell.
- If the inventory can spell no product at all, the kind draw falls back to the uniform draw.
- The bias is a generosity dial, not a difficulty curve: it never adapts to player skill, and its rate is fixed for the run. `docs/superpowers/specs/2026-08-09-endless-mode-polish-design.md` §1.1 derives why the rate must stay below the economy cliff.
- Immediate repetition is legal.
- After drawing the unordered pair, independently randomize display order.
- `3 × 7` and `7 × 3` are presentations of one sampling entry, not two entries.
- Products range from `1` through `81`; an answer therefore has exactly one or two decimal digits.
- Rewards are independent uniformly distributed digits `0` through `9`; each digit has probability `10%`.
- Production uses `Math.random()`.
- Tests provide deterministic `RandomSource` functions.

### 1.3 Initial run state

- The player chooses the mode on the title screen. Endless is the default; the choice is not persisted.
- Initial inventory capacity: `10` in Endless; `20` in Classic (tuning dials; see § Tuning surface).
- Initial inventory: fills the capacity, dealing digits round-robin (`i % 10`): one of each digit `[0…9]` in Endless, two of each in Classic.
- Inventory display order: ascending digit; duplicates are ordered deterministically by tile ID.
- Score: `0`.
- Current streak: `0`.
- Longest streak: `0`.
- Submitted rounds: `0`.
- Current equation ordinal: `1`.
- A run begins only after the player presses **Start Run**.

### 1.4 Answer construction

- The product's canonical decimal representation determines the slot count.
- One-digit products show one answer slot.
- Two-digit products show two ordered answer slots.
- Clicking or tapping an inventory tile moves that exact tile into the leftmost empty slot.
- Pressing a digit key selects the first available matching tile in sorted inventory order.
- Duplicate digit tiles have no strategic distinction.
- A selected tile leaves the inventory row and appears in its answer slot.
- Clicking or tapping a filled slot returns that tile to the inventory.
- `Backspace` returns the most recently selected answer tile.
- Returned tiles are re-sorted into inventory.
- The player cannot select more tiles than there are answer slots.
- **Submit** and `Enter` are enabled only when all slots are filled.
- Slot order is answer order: selecting `5` then `6` constructs `56`; selecting `6` then `5` constructs `65`.
- Every equation allows exactly one submission.

### 1.5 Correct submission

Given `N` submitted tiles:

1. Remove the `N` submitted tiles permanently.
2. Increment score by `1`.
3. Increment current streak by `1`.
4. Set longest streak to `max(previous longest streak, current streak)`.
5. Increment submitted rounds by `1`.
6. Generate exactly `N + 1` random reward tiles.
7. Append all rewards simultaneously. Sort only the tiles that fit within the live capacity (§1.7a). The tiles past capacity are the newest arrivals, kept in arrival order, and sit on the rail.
8. Mark every reward as new for feedback presentation.
9. If inventory size exceeds the live capacity, enter overflow resolution immediately.
10. Otherwise enter feedback with **Next Round** enabled.

The score is the number of correct submissions, not a product-, speed-, streak-, or difficulty-weighted value.

### 1.6 Incorrect submission

Given `N` submitted tiles:

1. Remove the `N` submitted tiles permanently.
2. Do not change score.
3. Reset current streak to `0`.
4. Preserve longest streak.
5. Increment submitted rounds by `1`.
6. Generate no rewards.
7. Show the submitted answer and correct answer.
8. Enter feedback with **Next Round** enabled.

An incorrect answer is legal even when the correct answer cannot be constructed from current tiles. The game never performs an exact-answer-constructibility loss check. Intentional incorrect submissions are therefore a costly survival mechanism.

### 1.7 Overflow resolution

- Capacity is checked only after all correct-answer rewards have been inserted, and against the live capacity (§1.7a), which already includes a seal made by this submission.
- `excess = inventory.length - capacity`.
- If `excess > 0`, the player must discard exactly `excess` tiles. Endless always overflows by exactly one; Classic can overflow by two when a seal and a correct answer share a submission.
- The player may mark any owned tile: a seated tile, or a tile on the rail.
- A mark can be taken back until the discard completes.
- **The mark that reaches `excess` completes the discard**, at any count. No confirmation control is rendered. The collapse is driven by the player's action, never by a render.
- Completing the discard removes the marked tiles. Rail tiles that survive take the sockets the discard freed; the rest of the rack neither compacts nor re-sorts.
- The round then advances on its own once the discard has visibly finished (§1.8); there is no **Next Round** after a discard.
- The next equation cannot be drawn while overflow remains unresolved.

### 1.7a Classic capacity

- Capacity is a function of mode and submissions, never stored:
  `getCapacity(endless, n) = 10`;
  `getCapacity(classic, n) = max(floor, 20 − ⌊n / 2⌋)`, where `n` is `totalRounds`
  and the start (`20`), the floor (`6`) and the step (`2` submissions) are tuning dials.
- A socket seals on the submission that crosses a step, **correct or not**. The descent is positional: it never watches how well the player is doing.
- An incorrect submission cannot overflow: it spends at least one tile and a seal takes at most one socket.
- The rack is *drawn* at the capacity of the displayed round, `getCapacity(mode, round − 1)`, so its size changes only at the round change, never during feedback.

### 1.8 Next-round loss detection

When the player advances:

0. In Classic, if capacity has reached the floor, enter `gameOver` as a **win**; the run is complete and no equation is shown.
1. Generate the next equation outside the reducer.
2. Clear `isNew` on surviving inventory tiles, and sort the whole inventory — the one re-sort per round.
3. Clear the previous answer selection, pending discards, and prior result.
4. Increment the equation ordinal.
5. Compare `inventory.length` with the new equation's answer-slot count.
6. If inventory has enough tiles, enter `answering`.
7. If inventory has fewer tiles than required slots, enter `gameOver` as a **loss**.

The player advances with **Next Round** or `Enter` from feedback, or automatically when a discard finishes (§1.7).

Loss is based only on tile count versus answer-slot count:

```ts
inventory.length < getAnswerLength(equation)
```

The terminal equation remains visible to explain why the run ended, alongside a
stated reason. The equation on its own reads as a question still awaiting an
answer, so it explains nothing without the accompanying line. It is not counted
as a submitted round.

### 1.9 Statistics semantics

| Field | Definition |
|---|---|
| `score` | Number of correct submissions |
| `currentStreak` | Consecutive correct submissions ending at the latest submitted round |
| `longestStreak` | Maximum `currentStreak` observed during the run |
| `totalRounds` | Number of submitted equations, correct or incorrect |
| `round` | One-based ordinal of the currently displayed equation; in game over it is `totalRounds + 1` |

### 1.10 Screen phases

#### `title`

- Wordmark `ozterisk`.
- One-paragraph pitch.
- A mode select, **Endless** or **Classic**, each with a one-line description. Endless is selected by default.
- Four always-visible rules, each preceded by the material swatch it concerns —
  socket, tile, gold, vermilion. Between them they cover capacity, both outcomes,
  and overflow.
- Expandable **More**, holding the required topics the four rules do not: keyboard
  controls first, then selecting and returning tiles, ordered answer slots, and
  the score/streak/round/loss rules.
- Visible `English / 한국어` language selector.
- One primary **Start Run** button.

#### `answering`

- HUD order: round, score, current streak. Round carries primary emphasis — Endless is a survival mode, so rounds survived is the headline figure.
- Endless: a capacity meter states tiles held against the ten-tile capacity. Classic: the HUD states the live capacity as a number and has no pip meter; the plugs in the rack show the descent. Either sits below the three HUD figures; it does not displace round's primary emphasis and does not reorder them.
- Equation and exact answer-slot count.
- Submit and Clear actions. Clear is disabled while nothing is selected.
- Filled answer slots are clickable to return a single tile, and show a hover/focus affordance.
- Sorted digit inventory.
- Selecting a tile leaves its socket in place, marked as on loan rather than empty. The rack neither compacts nor re-sorts until the round resolves.
- Mouse, touch, and keyboard input.

#### `feedback`

- **Correct** or **Incorrect** text.
- Subtle visual emphasis on equation and submitted tiles.
- Correct feedback shows inserted rewards highlighted.
- Incorrect feedback shows submitted and correct answers.
- Feedback persists until **Next Round** or `Enter`, except after a discard, when it advances on its own once the discard has finished.

#### `overflow`

- Preserve the correctness feedback context.
- State how many tiles must be removed.
- Allow reversible tile marking, of seated and rail tiles alike.
- The mark that reaches the required count completes the discard; render no confirmation control.
- After the discard, advance to the next round once its motion has finished (§1.7).

#### `gameOver`

- A Classic win states **Run Complete** and its reason, and shows no equation. Everything else below applies to a loss in either mode.
- Keep the terminal equation visible.
- Print the product on the board. `gameOver` is the only phase that does: during
  play the answer slots complete the equation, and the feedback text is the only
  place the real value is stated.
- State why the run ended, grouped with the terminal equation rather than with the statistics, so it reads as a caption on the equation instead of a result.
- Show total submitted rounds first, then score and longest streak. Rounds carries the same primary emphasis it holds in the HUD.
- Show **Play Again**, **Share**, and **Copy Result**.
- **Play Again** starts a fresh Round 1 immediately without returning to title.

### 1.11 Keyboard contract

| Phase | Key | Effect |
|---|---|---|
| `answering` | `0`–`9` | Select first available matching tile if a slot is empty |
| `answering` | `Backspace` | Return most recently selected answer tile |
| `answering` | `Escape` | Return every selected tile at once; no-op at zero selection |
| `answering` | `Enter` | Submit only if all answer slots are filled; a focused button retains normal browser behavior |
| `overflow` | `0`–`9` | Mark the first matching tile not already marked; the mark that reaches the required count completes the discard |
| `feedback` | `Enter` | Draw and advance to the next equation. Inert after a discard, which advances on its own |
| `gameOver` | `R` | Start a fresh run, equivalent to **Play Again**. Accepts the key by either its value or its physical position, so neither a Korean IME nor a Dvorak layout can make it unreachable |
| `gameOver` | `Enter` | No global shortcut; a focused button retains normal browser behavior |
| `title` | `Enter` | No global shortcut; the focused **Start Run** button retains normal browser behavior |

Disabled keyboard actions are no-ops. Language changes are available in every phase and never reset game state.

In every phase a focused button retains normal browser behavior, and the global
shortcut bound to that key stands aside for it.

`gameOver` restarts on `R` rather than `Enter` because `Enter` cannot be made
safe there. A player advancing a run by keyboard — Submit, `Enter`, Submit,
`Enter` — destroys the score screen with the tap already in flight, before it can
be read or shared; measured as `{ reachedGameOver: true, survivedSecondEnter:
false, activeTag: "BODY" }`. `event.repeat` does not help, because it catches a
held key rather than two discrete presses, and scoping the shortcut to an unfocused
document fixes a different failure. `Enter` on the language toggle, which renders
buttons and is present in this phase, also restarted the run and discarded the
language change — contradicting the line above. `R` activates no button, so it
needs no focus guard.

The two failures are different, which is why the phases take different rules. On
`gameOver` the stray `Enter` arrives with focus on `BODY`, so no focus guard can
see it and the key itself has to change. In `answering`, `feedback` and
`overflow` a shortcut and a focused control compete for one key, and standing
aside is the whole fix: every control that wins the key reaches the same action
through its own activation. Without it, `Enter` on a focused **Clear** submitted
the answer rather than clearing it, spending tiles that submission does not give
back.

### 1.17 Explicitly out of scope

- Wildcard or special tiles.
- Operand `0`.
- Division, addition, or subtraction modes.
- Difficulty curves — any weighting that adapts to player skill or escalates over a run. The fixed-rate constructibility bias in §1.2 is in scope and shipped; it is a generosity dial, not a curve. Classic's descent (§1.7a) is in scope: it is a fixed schedule counted in submissions, identical for every player and blind to their play, and it is the mode's definite arc rather than a weighting.
- Timers.
- Multiple attempts.
- Skip buttons or a separate manual-discard action during answering.
- Exact-answer-constructibility loss detection.
- Saved best score or history.
- Seeded/replayable runs.
- Result pages or result parameters.
- Leaderboards, authentication, backend APIs, databases, and server authority.
- Audio and haptics.
- End-to-end tests of game behavior. A browser suite is in scope only for
  layout properties jsdom cannot observe, and must assert no game rule,
  reducer transition, or interaction flow. §8.5's `320px` and Korean-clipping
  gates are unverifiable without one, because jsdom performs no layout.
- Analytics and telemetry.
- Offline/PWA behavior.

# 1-0 Product Specification

Canonical game rules (§1.1–§1.11, §1.17). The visual, language, copy, sharing,
and persistence contracts (§1.12–§1.16) live in `docs/spec/ui-i18n.md`.

### 1.1 Product thesis

`1-0` is an endless arithmetic inventory game. A digit tile is simultaneously:

1. a resource required to construct an answer;
2. a consumable spent on every submission; and
3. an inventory-management choice because correct play returns one net tile before capacity resolution.

The PoC validates whether this loop is understandable and engaging. It does not validate competition, retention, monetization, anti-cheat, or online services.

### 1.2 Equation pool and randomness

- Operands are integers `1` through `9`, inclusive.
- The sampling pool contains the 45 unordered pairs `(a, b)` where `1 <= a <= b <= 9`.
- Draw one pair uniformly with replacement for every new equation.
- Immediate repetition is legal.
- After drawing the unordered pair, independently randomize display order.
- `3 × 7` and `7 × 3` are presentations of one sampling entry, not two entries.
- Products range from `1` through `81`; an answer therefore has exactly one or two decimal digits.
- Rewards are independent uniformly distributed digits `0` through `9`; each digit has probability `10%`.
- Production uses `Math.random()`.
- Tests provide deterministic `RandomSource` functions.

### 1.3 Initial run state

- Initial inventory capacity: `10`.
- Initial inventory: one tile for each digit `[0,1,2,3,4,5,6,7,8,9]`.
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
7. Insert all rewards into sorted inventory simultaneously.
8. Mark every reward as new for feedback presentation.
9. If inventory size exceeds `10`, enter overflow resolution immediately.
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

- Capacity is checked only after all correct-answer rewards have been inserted.
- `excess = inventory.length - 10`.
- If `excess > 0`, the player must discard exactly `excess` tiles.
- The player may mark any owned tile, including a new reward or an older tile.
- Marking is reversible until confirmation.
- **Confirm Discard** and `Enter` are enabled only when exactly `excess` tile IDs are marked.
- Confirmation removes those exact tiles, clears the overflow selection, and returns to feedback.
- The next equation cannot be drawn while overflow remains unresolved.

### 1.8 Next-round loss detection

When the player advances:

1. Generate the next equation outside the reducer.
2. Clear `isNew` on surviving inventory tiles.
3. Clear the previous answer selection, pending discards, and prior result.
4. Increment the equation ordinal.
5. Compare `inventory.length` with the new equation's answer-slot count.
6. If inventory has enough tiles, enter `answering`.
7. If inventory has fewer tiles than required slots, enter `gameOver`.

Loss is based only on tile count versus answer-slot count:

```ts
inventory.length < getAnswerLength(equation)
```

The terminal equation remains visible to explain why the run ended. It is not counted as a submitted round.

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

- Working title `1-0`.
- Three-line rules summary.
- Expandable **How to Play**.
- Visible `English / 한국어` language selector.
- One primary **Start Run** button.

#### `answering`

- HUD order: score, current streak, round.
- Equation and exact answer-slot count.
- Submit action.
- Sorted digit inventory.
- Mouse, touch, and keyboard input.

#### `feedback`

- **Correct** or **Incorrect** text.
- Subtle visual emphasis on equation and submitted tiles.
- Correct feedback shows inserted rewards highlighted.
- Incorrect feedback shows submitted and correct answers.
- Feedback persists until **Next Round** or `Enter`.

#### `overflow`

- Preserve the correctness feedback context.
- State how many tiles must be removed.
- Allow reversible tile marking.
- Enable confirmation only at the exact required count.
- After confirmation, move to `feedback`; do not draw the next equation automatically.

#### `gameOver`

- Keep the terminal equation visible.
- Show score, total submitted rounds, and longest streak.
- Show **Play Again**, **Share**, and **Copy Result**.
- **Play Again** starts a fresh Round 1 immediately without returning to title.

### 1.11 Keyboard contract

| Phase | Key | Effect |
|---|---|---|
| `answering` | `0`–`9` | Select first available matching tile if a slot is empty |
| `answering` | `Backspace` | Return most recently selected answer tile |
| `answering` | `Enter` | Submit only if all answer slots are filled |
| `overflow` | `Enter` | Confirm only if exactly the excess number is selected |
| `feedback` | `Enter` | Draw and advance to the next equation |
| `gameOver` | `Enter` | Start a fresh run, equivalent to **Play Again** |
| `title` | `Enter` | No global shortcut; the focused **Start Run** button retains normal browser behavior |

Disabled keyboard actions are no-ops. Language changes are available in every phase and never reset game state.

### 1.17 Explicitly out of scope

- Wildcard or special tiles.
- Operand `0`.
- Division, addition, or subtraction modes.
- Difficulty curves or weighted equations.
- Timers.
- Multiple attempts.
- Skip buttons or a separate manual-discard action during answering.
- Exact-answer-constructibility loss detection.
- Saved best score or history.
- Seeded/replayable runs.
- Result pages or result parameters.
- Leaderboards, authentication, backend APIs, databases, and server authority.
- Audio and haptics.
- Playwright/E2E tests.
- Analytics and telemetry.
- Offline/PWA behavior.

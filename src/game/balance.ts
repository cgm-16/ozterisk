/**
 * Tuning dials. Changing a value by hand is not automatically safe — check
 * the economy invariant in balance.test.ts, which guards the combinations
 * that break a run, and see INVENTORY_CAPACITY below for a dial whose safe
 * range is currently a single value.
 *
 * Domain definitions that change what the game *is* — operand range, digit
 * spread — live in constants.ts instead.
 */

/**
 * Tiles the inventory holds before overflow forces a discard.
 * Economy: raising this raises the unbiased buildable rate b. Unbiased,
 * b(10) ~= 48%, b(11) ~= 52%, b(12) ~= 57%, b(13) ~= 60%. KIND_EQUATION_RATE
 * biases every draw toward products the current hand can already spell,
 * which pushes the *effective* rate b' well above the unbiased figure: at
 * the shipped KIND_EQUATION_RATE = 0.2, b'(10) ~= 58%, b'(11) ~= 62%,
 * b'(12) ~= 65%, b'(13) ~= 68%, against a cliff at b' ~= 63% where drift
 * flips positive and runs stop ending. Capacity 11 already crosses the
 * cliff's safety margin and fails balance.test.ts, so at the shipped kind
 * rate 10 is the only value this dial can currently hold — raising it
 * requires first lowering KIND_EQUATION_RATE, or adding another
 * counterweight. Lowering it is not free either: createInitialInventory
 * (factories.ts) hardcodes ten starting tiles via ALL_DIGITS, uncoupled
 * from this dial, so a capacity below 10 starts every run already over
 * capacity — that fails loudly, across many unrelated tests, not silently.
 */
export const INVENTORY_CAPACITY = 10;

/**
 * Extra tiles returned above the number spent on a correct answer.
 * Net inventory change per correct answer is exactly +REWARD_BONUS.
 * Economy: drift = b*REWARD_BONUS - (1-b)*averageMissCost()
 * Range: 1 = shipped. 0 removes overflow entirely, deleting the discard
 * mechanic. Above 1 makes runs unloseable at any realistic b.
 */
export const REWARD_BONUS = 1;

/**
 * Share of equations drawn only from products the current hand can spell.
 * Economy: b' = KIND_EQUATION_RATE + (1 - KIND_EQUATION_RATE) * b
 * 0.2 -> 58%, safely under the 63% cliff. 0.3 -> 63.6%, over it.
 * The value most likely to need retuning after real play.
 */
export const KIND_EQUATION_RATE = 0.2;

/**
 * Classic's opening capacity, and the size of its round-robin opening hand.
 * Economy: Classic deliberately opens above the cliff — at 20 the biased
 * buildable rate b'(20) ~= 0.84 against the 0.63 cliff, so the early tray is
 * generous — and the descent to CLASSIC_FLOOR carries it back under. Board
 * count is START - FLOOR, so this is the run's decision budget.
 * Range: >= 10, so the opening deal holds every digit; above FLOOR.
 */
export const CLASSIC_START_CAPACITY = 20;

/**
 * The capacity at which a Classic run is complete (the win).
 * Economy: b'(6) ~= 0.42, well below the cliff, so the late tray is where
 * runs are lost. Lower floors make the finish harder and the run longer.
 * Range: >= 2, the longest answer. Moves to 5 when M7's face-set tiles ship.
 */
export const CLASSIC_FLOOR = 6;

/**
 * Submissions, correct or not, between two Classic seals.
 * Economy: sets run length — (START - FLOOR) * CLASSIC_SEAL_EVERY submissions,
 * 28 at the shipped values — without spending boards. A submission clock is
 * positional: it never watches how well the player is doing.
 * Range: integer >= 1.
 */
export const CLASSIC_SEAL_EVERY = 2;

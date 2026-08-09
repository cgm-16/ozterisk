/**
 * Tuning dials. Every value here is safe to change by hand; the economy
 * invariant in balance.test.ts guards the combinations that break a run.
 *
 * Domain definitions that change what the game *is* — operand range, digit
 * spread — live in constants.ts instead.
 */

/**
 * Tiles the inventory holds before overflow forces a discard.
 * Economy: raising this raises the buildable rate b. b(10) ~= 48%,
 * b(13) ~= 60%, b(14) ~= 64%. Drift crosses zero at b ~= 63%, so 13 is the
 * highest value that keeps runs finite without another counterweight.
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

// Analytic economy model for the endless run, used only by balance.test.ts
// to guard the tuning dials in src/game/balance.ts. Test-only: nothing here
// enters the production bundle. Deterministic and instant — occupancy math,
// not Monte Carlo simulation.
import { OPERAND_MAX, OPERAND_MIN, REWARD_DIGIT_COUNT } from "../game/constants";
import { REWARD_BONUS } from "../game/balance";

// Splits the 45-entry operand-pair pool (1 <= left <= right <= 9) by answer
// length, mirroring the EQUATION_PAIRS construction in generators.ts.
function pairsByAnswerLength(): { oneDigit: number; twoDigit: number } {
  let oneDigit = 0;
  let twoDigit = 0;
  for (let left = OPERAND_MIN; left <= OPERAND_MAX; left++) {
    for (let right = left; right <= OPERAND_MAX; right++) {
      if (left * right < 10) {
        oneDigit++;
      } else {
        twoDigit++;
      }
    }
  }
  return { oneDigit, twoDigit };
}

// Occupancy math over the 45 pairs, with P(digit absent) = (0.9)^n:
// - one specific digit present: 1 - (0.9)^n
// - two specific digits present: 1 - 2*(0.9)^n + (0.8)^n
export function projectBuildableRate(handSize: number): number {
  const { oneDigit, twoDigit } = pairsByAnswerLength();
  const total = oneDigit + twoDigit;
  const absent = ((REWARD_DIGIT_COUNT - 1) / REWARD_DIGIT_COUNT) ** handSize;
  const bothAbsent = ((REWARD_DIGIT_COUNT - 2) / REWARD_DIGIT_COUNT) ** handSize;
  return (
    (oneDigit / total) * (1 - absent) +
    (twoDigit / total) * (1 - 2 * absent + bothAbsent)
  );
}

/** Average tiles lost to one forced miss, weighted across the pair pool. */
export function averageMissCost(): number {
  const { oneDigit, twoDigit } = pairsByAnswerLength();
  const total = oneDigit + twoDigit;
  return (oneDigit / total) * 1 + (twoDigit / total) * 2;
}

/** Expected tiles gained per round. Negative means runs end. */
export function projectDrift(b: number): number {
  return b * REWARD_BONUS - (1 - b) * averageMissCost();
}

/** The buildable rate at which drift reaches zero. */
export function buildableRateCliff(): number {
  const loss = averageMissCost();
  return loss / (REWARD_BONUS + loss);
}

/** Effective buildable rate once the kind-equation bias is applied. */
export function projectBiasedRate(baseRate: number, kindRate: number): number {
  return kindRate + (1 - kindRate) * baseRate;
}

import { createInitialInventory, createTitleState } from "../game/factories";
import type {
  Digit,
  Equation,
  GameState,
  RandomSource,
  Tile,
  TileIdFactory,
} from "../game/types";

export const sequenceRandom = (...values: number[]): RandomSource => {
  let index = 0;
  return () => {
    const value = values[index];
    if (value === undefined) throw new Error("Random sequence exhausted");
    index += 1;
    return value;
  };
};

export const sequentialIds = (prefix = "tile"): TileIdFactory => {
  let index = 0;
  return () => `${prefix}-${index++}`;
};

export const makeEquation = (left: number, right: number): Equation => ({
  left,
  right,
  product: left * right,
});

export const makeTile = (
  digit: Digit,
  id = `tile-${digit}`,
  isNew = false,
): Tile => ({ id, digit, isNew });

export const makeAnsweringState = (
  equation: Equation,
  overrides: Partial<GameState> = {},
): GameState => ({
  ...createTitleState(),
  phase: "answering",
  equation,
  inventory: createInitialInventory(sequentialIds()),
  round: 1,
  ...overrides,
});

// A §2.5-legal feedback-phase state: lastResult is non-null and round === totalRounds.
export const makeFeedbackState = (
  equation: Equation,
  overrides: Partial<GameState> = {},
): GameState => ({
  ...makeAnsweringState(equation, { round: 1, totalRounds: 1 }),
  phase: "feedback",
  lastResult: {
    kind: "incorrect",
    submittedValue: 1,
    correctValue: equation.product,
    submittedTiles: [],
    rewardTileIds: [],
  },
  ...overrides,
});

// Overflow inventories are defined by size alone; the digits only need to
// exist. `size - INVENTORY_CAPACITY` is the excess the player must discard.
export const makeOverflowInventory = (size: number): Tile[] =>
  Array.from({ length: size }, (_, index) => makeTile((index % 9) as Digit, `tile-${index}`));

// A §2.5-legal overflow-phase state: inventory exceeds capacity (excess 1 by
// default), lastResult is non-null, and round === totalRounds.
export const makeOverflowState = (
  equation: Equation,
  overrides: Partial<GameState> = {},
): GameState => ({
  ...makeFeedbackState(equation, { inventory: makeOverflowInventory(11) }),
  phase: "overflow",
  ...overrides,
});

// A §2.5-legal gameOver state: round === totalRounds + 1 and the terminal
// equation is still on screen (§1.8).
export const makeGameOverState = (
  equation: Equation,
  overrides: Partial<GameState> = {},
): GameState => ({
  ...makeAnsweringState(equation, { round: 13, totalRounds: 12 }),
  phase: "gameOver",
  score: 7,
  longestStreak: 4,
  ...overrides,
});

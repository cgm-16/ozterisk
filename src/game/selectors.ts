import type { Digit, Equation, FaceKind, GameMode, GameState, Tile } from "./types";
import {
  CLASSIC_FLOOR,
  CLASSIC_SEAL_EVERY,
  CLASSIC_START_CAPACITY,
  INVENTORY_CAPACITY,
  REWARD_BONUS,
} from "./balance";

export function getAnswerLength(equation: Equation): 1 | 2 {
  return equation.product >= 10 ? 2 : 1;
}

// Single source of truth for the reward count: App.tsx generates this many
// tiles and gameReducer.ts validates the action against it, so the two can
// no longer disagree by drifting apart independently.
export function getRewardCount(spentCount: number): number {
  return spentCount + REWARD_BONUS;
}

const FACE_SETS: Record<FaceKind, readonly Digit[]> = {
  wild: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  odd: [1, 3, 5, 7, 9],
  even: [0, 2, 4, 6, 8],
  low: [0, 1, 2, 3, 4],
  high: [5, 6, 7, 8, 9],
};

// The digits a tile can stand for: its own digit, or a face's set (§1.4a).
export function tileDigits(tile: Tile): readonly Digit[] {
  if ("digit" in tile) return [tile.digit];
  if (tile.face === "nbr") return [tile.centre - 1, tile.centre, tile.centre + 1] as Digit[];
  return FACE_SETS[tile.face];
}

// The number an all-digit selection spells; null when empty or holding a face,
// which spells no number of its own.
export function constructAnswer(selectedTiles: readonly Tile[]): number | null {
  if (selectedTiles.length === 0) return null;
  const digits: Digit[] = [];
  for (const tile of selectedTiles) {
    if (!("digit" in tile)) return null;
    digits.push(tile.digit);
  }
  return Number(digits.join(""));
}

// Correct when each slot's tile holds the digit that slot needs (§1.4).
export function answerMatches(selectedTiles: readonly Tile[], product: number): boolean {
  const needed = String(product);
  return (
    selectedTiles.length === needed.length &&
    selectedTiles.every((tile, slot) => tileDigits(tile).includes(Number(needed[slot]) as Digit))
  );
}

export function canAttemptEquation(
  inventory: readonly Tile[],
  equation: Equation,
): boolean {
  return inventory.length >= getAnswerLength(equation);
}

// Tries every ordered pair of distinct tiles (every tile, for one digit):
// answers are at most two digits, and a greedy pass misses assignments a
// face makes possible (§1.4a).
export function canConstruct(inventory: readonly Tile[], product: number): boolean {
  if (product < 10) return inventory.some((tile) => answerMatches([tile], product));
  return inventory.some((first, i) =>
    inventory.some((second, j) => i !== j && answerMatches([first, second], product)),
  );
}

// Live capacity after `totalRounds` submissions. Classic seals one socket every
// CLASSIC_SEAL_EVERY submissions, correct or not, down to the floor (§1.7a).
export function getCapacity(mode: GameMode, totalRounds: number): number {
  if (mode === "endless") return INVENTORY_CAPACITY;
  const sealed = Math.floor(totalRounds / CLASSIC_SEAL_EVERY);
  return Math.max(CLASSIC_FLOOR, CLASSIC_START_CAPACITY - sealed);
}

type CapacityState = Pick<GameState, "inventory" | "mode" | "totalRounds">;

export function getOverflowCount(state: CapacityState): number {
  return Math.max(0, state.inventory.length - getCapacity(state.mode, state.totalRounds));
}

// A Classic run at the floor is complete: the next advance ends it,
// before any equation is generated (§1.8 step 0).
export function isAtClassicFloor(state: Pick<GameState, "mode" | "totalRounds">): boolean {
  return state.mode === "classic" && getCapacity(state.mode, state.totalRounds) <= CLASSIC_FLOOR;
}

// A Classic run that reaches the floor with tiles in hand is the win; one that
// reaches it with an empty hand spent its last tile on a miss, and loses (§1.8).
export function isClassicWin(
  state: Pick<GameState, "phase" | "mode" | "totalRounds" | "inventory">,
): boolean {
  return state.phase === "gameOver" && isAtClassicFloor(state) && state.inventory.length > 0;
}

export function isSubmissionReady(state: GameState): boolean {
  return (
    state.phase === "answering" &&
    state.equation !== null &&
    state.selectedTiles.length === getAnswerLength(state.equation)
  );
}


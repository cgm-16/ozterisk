import type { Equation, GameMode, GameState, Tile } from "./types";
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

export function constructAnswer(selectedTiles: readonly Tile[]): number | null {
  if (selectedTiles.length === 0) return null;
  return Number(selectedTiles.map((tile) => tile.digit).join(""));
}

export function canAttemptEquation(
  inventory: readonly Tile[],
  equation: Equation,
): boolean {
  return inventory.length >= getAnswerLength(equation);
}

// Multiset check: a product needing two of a digit requires two tiles.
export function canConstruct(inventory: readonly Tile[], product: number): boolean {
  const available = new Map<number, number>();
  for (const tile of inventory) {
    available.set(tile.digit, (available.get(tile.digit) ?? 0) + 1);
  }
  for (const character of String(product)) {
    const digit = Number(character);
    const remaining = available.get(digit) ?? 0;
    if (remaining === 0) return false;
    available.set(digit, remaining - 1);
  }
  return true;
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

// Reaching the floor is the only way a Classic run ends other than a loss, so a
// Classic game over at the floor is the win (§1.8).
export function isClassicWin(state: Pick<GameState, "phase" | "mode" | "totalRounds">): boolean {
  return (
    state.phase === "gameOver" &&
    state.mode === "classic" &&
    getCapacity(state.mode, state.totalRounds) <= CLASSIC_FLOOR
  );
}

export function isSubmissionReady(state: GameState): boolean {
  return (
    state.phase === "answering" &&
    state.equation !== null &&
    state.selectedTiles.length === getAnswerLength(state.equation)
  );
}

export function isDiscardReady(state: GameState): boolean {
  return (
    state.phase === "overflow" &&
    state.pendingDiscards.length === getOverflowCount(state)
  );
}

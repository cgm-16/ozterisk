import type { Equation, GameState, Tile } from "./types";
import { INVENTORY_CAPACITY, REWARD_BONUS } from "./balance";

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

export function getOverflowCount(inventory: readonly Tile[]): number {
  return Math.max(0, inventory.length - INVENTORY_CAPACITY);
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
    state.pendingDiscards.length === getOverflowCount(state.inventory)
  );
}

import type { Equation, GameState, Tile } from "./types";
import { INVENTORY_CAPACITY } from "./constants";

export function getAnswerLength(equation: Equation): 1 | 2 {
  return equation.product >= 10 ? 2 : 1;
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

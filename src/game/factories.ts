import type { Digit, GameState, Tile, TileIdFactory } from "./types";

const ALL_DIGITS: readonly Digit[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export function createTitleState(): GameState {
  return {
    phase: "title",
    mode: "endless",
    equation: null,
    inventory: [],
    selectedTiles: [],
    pendingDiscards: [],
    score: 0,
    round: 0,
    totalRounds: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastResult: null,
  };
}

// Deals round-robin through the digits, so a hand of 10 holds one of each and a
// hand of 20 two of each (§1.3). Sorted, since the deal order is by digit.
export function createInitialInventory(
  idFactory: TileIdFactory,
  count = ALL_DIGITS.length,
): Tile[] {
  const digits = Array.from({ length: count }, (_, index) => ALL_DIGITS[index % ALL_DIGITS.length]);
  return sortTiles(digits.map((digit) => ({ id: idFactory(), digit, isNew: false })));
}

export function sortTiles(tiles: readonly Tile[]): Tile[] {
  return [...tiles].sort((a, b) => {
    if (a.digit !== b.digit) return a.digit - b.digit;
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  });
}

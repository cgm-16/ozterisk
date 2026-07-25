import type { Digit, GameState, Tile, TileIdFactory } from "./types";

const ALL_DIGITS: readonly Digit[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export function createTitleState(): GameState {
  return {
    phase: "title",
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

export function createInitialInventory(idFactory: TileIdFactory): Tile[] {
  return ALL_DIGITS.map((digit) => ({ id: idFactory(), digit, isNew: false }));
}

export function sortTiles(tiles: readonly Tile[]): Tile[] {
  return [...tiles].sort((a, b) => {
    if (a.digit !== b.digit) return a.digit - b.digit;
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  });
}

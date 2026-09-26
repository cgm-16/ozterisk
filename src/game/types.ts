export type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Language = "en" | "ko";
export type GameMode = "endless" | "classic";
export type GamePhase =
  | "title"
  | "answering"
  | "feedback"
  | "overflow"
  | "gameOver";

export type FaceKind = "wild" | "odd" | "even" | "low" | "high";

// A digit tile, or a face tile standing for a set of digits (product.md §1.4a).
// Face tiles exist in Classic only.
export type FaceSet = { face: FaceKind } | { face: "nbr"; centre: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 };
// What a tile shows and stands for, apart from its identity.
export type TileValue = { digit: Digit } | FaceSet;
export type Tile = { id: string; isNew: boolean } & TileValue;

export interface Equation {
  left: number;
  right: number;
  product: number;
}

export interface RoundResult {
  kind: "correct" | "incorrect";
  /** The product on a correct answer; the spelled number on an incorrect all-digit answer; null when an incorrect answer holds a face tile. */
  submittedValue: number | null;
  correctValue: number;
  submittedTiles: Tile[];
  rewardTileIds: string[];
  /** Set when this round's overflow discard completed; the round then advances on its own (§1.7). */
  discarded?: boolean;
}

export interface GameState {
  phase: GamePhase;
  mode: GameMode;
  equation: Equation | null;
  inventory: Tile[];
  selectedTiles: Tile[];
  pendingDiscards: string[];
  score: number;
  round: number;
  totalRounds: number;
  currentStreak: number;
  longestStreak: number;
  lastResult: RoundResult | null;
}

export type GameAction =
  | { type: "START_RUN"; mode: GameMode; equation: Equation; inventory: Tile[] }
  | { type: "SELECT_TILE"; tileId: string }
  | { type: "RETURN_TILE"; tileId: string }
  | { type: "SUBMIT_CORRECT"; rewardTiles: Tile[] }
  | { type: "SUBMIT_INCORRECT" }
  | { type: "TOGGLE_DISCARD"; tileId: string }
  | { type: "NEXT_ROUND"; equation: Equation }
  | { type: "RESTART_RUN"; equation: Equation; inventory: Tile[] } // keeps state.mode
  | { type: "CLEAR_SELECTION" };

export type RandomSource = () => number; // Contract: 0 <= value < 1
export type TileIdFactory = () => string;

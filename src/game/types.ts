export type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Language = "en" | "ko";
export type GamePhase =
  | "title"
  | "answering"
  | "feedback"
  | "overflow"
  | "gameOver";

export interface Tile {
  id: string;
  digit: Digit;
  isNew: boolean;
}

export interface Equation {
  left: number;
  right: number;
  product: number;
}

export interface RoundResult {
  kind: "correct" | "incorrect";
  submittedValue: number;
  correctValue: number;
  submittedTiles: Tile[];
  rewardTileIds: string[];
}

export interface GameState {
  phase: GamePhase;
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
  | { type: "START_RUN"; equation: Equation; inventory: Tile[] }
  | { type: "SELECT_TILE"; tileId: string }
  | { type: "RETURN_TILE"; tileId: string }
  | { type: "SUBMIT_CORRECT"; rewardTiles: Tile[] }
  | { type: "SUBMIT_INCORRECT" }
  | { type: "TOGGLE_DISCARD"; tileId: string }
  | { type: "CONFIRM_DISCARD" }
  | { type: "NEXT_ROUND"; equation: Equation }
  | { type: "RESTART_RUN"; equation: Equation; inventory: Tile[] }
  | { type: "CLEAR_SELECTION" };

export type RandomSource = () => number; // Contract: 0 <= value < 1
export type TileIdFactory = () => string;

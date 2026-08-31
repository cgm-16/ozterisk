import type { Equation } from "../game/EquationBoard";
import type { InventoryTile } from "../game/TileInventory";
import type { RoundResult } from "./FeedbackPanel";
import type { Language } from "../hud/LanguageToggle";

export type GamePhase = "title" | "answering" | "feedback" | "overflow" | "gameOver";

export interface GameState {
  phase: GamePhase;
  equation: Equation | null;
  inventory: InventoryTile[];
  selectedTiles: InventoryTile[];
  pendingDiscards: string[];
  score: number;
  round: number;
  totalRounds: number;
  currentStreak: number;
  longestStreak: number;
  lastResult: RoundResult | null;
}

/**
 * The whole play surface, composed from the primitives. Presentational — it
 * reads state and calls handlers; the reducer owns every rule.
 *
 * @startingPoint section="Flow" subtitle="Full play surface, all phases" viewport="900x760"
 */
export interface GameScreenProps {
  state: GameState;
  language?: Language;
  onLanguageChange?: (language: Language) => void;
  onSelectTile?: (tileId: string) => void;
  onReturnTile?: (tileId: string) => void;
  onToggleDiscard?: (tileId: string) => void;
  onConfirmDiscard?: () => void;
  onSubmit?: () => void;
  onNextRound?: () => void;
  onClear?: () => void;
  /** Localised label bundles: submit, clear, next, hud, result, overflow, capacity. */
  labels?: Record<string, unknown>;
}

export declare function GameScreen(props: GameScreenProps): JSX.Element;

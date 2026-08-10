import type { GameAction, GameState } from "../../game/types";
import {
  getAnswerLength,
  getOverflowCount,
  isDiscardReady,
  isSubmissionReady,
} from "../../game/selectors";
import { useGameKeyboard } from "../../hooks/useGameKeyboard";
import { useI18n } from "../../i18n/I18nContext";
import { AnswerSlots } from "../AnswerSlots/AnswerSlots";
import { EquationBoard } from "../EquationBoard/EquationBoard";
import { FeedbackPanel } from "../FeedbackPanel/FeedbackPanel";
import { GameHud } from "../GameHud/GameHud";
import { OverflowControls } from "../OverflowControls/OverflowControls";
import { TileInventory } from "../TileInventory/TileInventory";
import styles from "./GameScreen.module.css";

export interface GameScreenProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  onSubmit(): void;
  onNextRound(): void;
}

export function GameScreen({ state, dispatch, onSubmit, onNextRound }: GameScreenProps) {
  const { t } = useI18n();
  useGameKeyboard({ state, dispatch, onSubmit, onNextRound });

  // Reducer invariant (§2.5): equation === null only in `title`. GameScreen
  // never renders `title` (TitleScreen owns it), so this only guards the type.
  if (state.equation === null) return null;

  const { lastResult } = state;
  const rewardTiles =
    lastResult === null
      ? []
      : state.inventory.filter((tile) => lastResult.rewardTileIds.includes(tile.id));

  return (
    <main className={styles.screen}>
      <GameHud score={state.score} currentStreak={state.currentStreak} round={state.round} />
      <EquationBoard equation={state.equation} />

      {state.phase === "answering" && (
        <AnswerSlots
          slotCount={getAnswerLength(state.equation)}
          selectedTiles={state.selectedTiles}
          onReturn={(tileId) => dispatch({ type: "RETURN_TILE", tileId })}
          disabled={false}
        />
      )}

      {lastResult !== null && <FeedbackPanel result={lastResult} rewardTiles={rewardTiles} />}

      {state.phase === "answering" && (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.action}
            onClick={onSubmit}
            disabled={!isSubmissionReady(state)}
          >
            {t("action.submit")}
          </button>

          <button
            type="button"
            className={styles.secondaryAction}
            onClick={() => dispatch({ type: "CLEAR_SELECTION" })}
            disabled={state.selectedTiles.length === 0}
          >
            {t("action.clear")}
          </button>
        </div>
      )}

      {state.phase === "feedback" && (
        <button type="button" className={styles.action} onClick={onNextRound}>
          {t("action.next")}
        </button>
      )}

      {state.phase === "overflow" && (
        <OverflowControls
          requiredCount={getOverflowCount(state.inventory)}
          onConfirm={() => dispatch({ type: "CONFIRM_DISCARD" })}
          disabled={!isDiscardReady(state)}
        />
      )}

      <TileInventory
        tiles={state.inventory}
        mode={state.phase === "answering" ? "select" : state.phase === "overflow" ? "discard" : "readOnly"}
        pendingDiscards={state.pendingDiscards}
        onTile={(tileId) => {
          if (state.phase === "answering") dispatch({ type: "SELECT_TILE", tileId });
          if (state.phase === "overflow") {
            dispatch({ type: "TOGGLE_DISCARD", tileId });
            // A forced single-tile discard needs no confirmation step: marking the
            // only tile that can go is the whole decision. Dispatched from the click
            // handler and never from an effect, so rendering an already-marked state
            // still requires user action.
            if (getOverflowCount(state.inventory) === 1) dispatch({ type: "CONFIRM_DISCARD" });
          }
        }}
      />
    </main>
  );
}

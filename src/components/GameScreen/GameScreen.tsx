import { sortTiles } from "../../game/factories";
import type { GameAction, GameState } from "../../game/types";
import {
  getAnswerLength,
  getCapacity,
  getOverflowCount,
  isSubmissionReady,
} from "../../game/selectors";
import { useGameKeyboard } from "../../hooks/useGameKeyboard";
import { useI18n } from "../../i18n/I18nContext";
import { ActionButton } from "../ActionButton/ActionButton";
import { AnswerSlots } from "../AnswerSlots/AnswerSlots";
import { CapacityMeter } from "../CapacityMeter/CapacityMeter";
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
      <GameHud
        score={state.score}
        currentStreak={state.currentStreak}
        round={state.round}
        // Classic states its live capacity as a number; its rack's plugs show
        // the descent, and twenty pips would be a second account of it (§1.10).
        capacity={state.mode === "classic" ? getCapacity(state.mode, state.totalRounds) : undefined}
      />
      {/* Capacity is what you hold, and a tile in an answer slot is still
          yours — you can return it. Reading state.inventory alone would drop
          by one per selection and disagree with the rack beside it, which
          keeps a socket for every tile in the same union. */}
      {state.mode === "endless" && (
        <CapacityMeter held={state.inventory.length + state.selectedTiles.length} />
      )}
      <EquationBoard equation={state.equation} />

      {state.phase === "answering" && (
        <AnswerSlots
          slotCount={getAnswerLength(state.equation)}
          selectedTiles={state.selectedTiles}
          onReturn={(tileId) => dispatch({ type: "RETURN_TILE", tileId })}
          disabled={false}
        />
      )}

      {/* Feedback keeps the slots mounted so the verdict lands on the tiles the
          player submitted. The reducer clears selectedTiles on submit and hands
          the same array to lastResult.submittedTiles, so that is where they are.
          No onReturn: read-only slots carry no button role, and the phase offers
          no control to take a tile back. */}
      {state.phase === "feedback" && lastResult !== null && (
        <AnswerSlots
          slotCount={getAnswerLength(state.equation)}
          selectedTiles={lastResult.submittedTiles}
          verdict={lastResult.kind}
          streak={state.currentStreak}
          disabled={false}
        />
      )}

      {lastResult !== null && <FeedbackPanel result={lastResult} rewardTiles={rewardTiles} />}

      {state.phase === "answering" && (
        <div className={styles.actions}>
          <ActionButton onClick={onSubmit} disabled={!isSubmissionReady(state)}>
            {t("action.submit")}
          </ActionButton>

          <ActionButton
            variant="secondary"
            onClick={() => dispatch({ type: "CLEAR_SELECTION" })}
            disabled={state.selectedTiles.length === 0}
          >
            {t("action.clear")}
          </ActionButton>
        </div>
      )}

      {/* After a discard the round advances on its own once the rack has
          settled (§1.7), so there is nothing to press. */}
      {state.phase === "feedback" && !lastResult?.discarded && (
        <ActionButton onClick={onNextRound}>{t("action.next")}</ActionButton>
      )}

      {state.phase === "overflow" && (
        <OverflowControls requiredCount={getOverflowCount(state)} />
      )}

      <TileInventory
        // Only answering re-sorts, to keep lifted tiles in their sockets; every
        // other phase draws the reducer's order, which perches the newest
        // arrivals past capacity (§1.5 step 7).
        tiles={
          state.phase === "answering"
            ? sortTiles([...state.inventory, ...state.selectedTiles])
            : state.inventory
        }
        liftedIds={state.selectedTiles.map((tile) => tile.id)}
        capacity={getCapacity(state.mode, state.totalRounds)}
        // Classic's rack is drawn at the displayed round's capacity, which
        // moves only at the round change; the live capacity above says which
        // tiles are seated (§1.7a).
        stepped={state.mode === "classic"}
        drawnCapacity={getCapacity(state.mode, state.round - 1)}
        mode={state.phase === "answering" ? "select" : state.phase === "overflow" ? "discard" : "readOnly"}
        pendingDiscards={state.pendingDiscards}
        onSettled={() => {
          if (state.phase === "feedback" && lastResult?.discarded) onNextRound();
        }}
        onTile={(tileId) => {
          if (state.phase === "answering") dispatch({ type: "SELECT_TILE", tileId });
          // The mark that reaches the required count completes the discard in the
          // reducer, so rendering an already-marked state still requires user action.
          if (state.phase === "overflow") dispatch({ type: "TOGGLE_DISCARD", tileId });
        }}
      />
    </main>
  );
}

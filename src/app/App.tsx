import { useCallback, useEffect, useReducer } from "react";
import { GameOverScreen } from "../components/GameOverScreen/GameOverScreen";
import { GameScreen } from "../components/GameScreen/GameScreen";
import { LanguageToggle } from "../components/LanguageToggle/LanguageToggle";
import { TitleScreen } from "../components/TitleScreen/TitleScreen";
import { createInitialInventory, createTitleState } from "../game/factories";
import { gameReducer } from "../game/gameReducer";
import { generateKindEquation, generateRewardTiles } from "../game/generators";
import { constructAnswer, getRewardCount } from "../game/selectors";
import type { RandomSource, TileIdFactory } from "../game/types";
import type { ShareDependencies } from "../services/sharing";
import styles from "./App.module.css";

export interface AppDependencies {
  random: RandomSource;
  nextTileId: TileIdFactory;
  gameUrl: string;
}

export interface AppProps {
  dependencies: AppDependencies;
  shareDependencies: ShareDependencies;
}

export function App({ dependencies, shareDependencies }: AppProps) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createTitleState);

  const handleStart = useCallback(() => {
    const inventory = createInitialInventory(dependencies.nextTileId);
    const equation = generateKindEquation(dependencies.random, inventory);
    dispatch({ type: "START_RUN", equation, inventory });
  }, [dependencies]);

  const handleRestart = useCallback(() => {
    const inventory = createInitialInventory(dependencies.nextTileId);
    const equation = generateKindEquation(dependencies.random, inventory);
    dispatch({ type: "RESTART_RUN", equation, inventory });
  }, [dependencies]);

  const handleSubmit = useCallback(() => {
    // Reducer invariant (§2.5): equation === null only in `title`, and Submit
    // only renders in `answering`, so this only guards the type.
    if (state.equation === null) return;
    const submittedValue = constructAnswer(state.selectedTiles);
    if (submittedValue === state.equation.product) {
      const rewardTiles = generateRewardTiles(
        getRewardCount(state.selectedTiles.length),
        dependencies.random,
        dependencies.nextTileId,
      );
      dispatch({ type: "SUBMIT_CORRECT", rewardTiles });
    } else {
      dispatch({ type: "SUBMIT_INCORRECT" });
    }
  }, [state.equation, state.selectedTiles, dependencies]);

  const handleNextRound = useCallback(() => {
    // state.inventory is already final (post-discard) at `feedback`; a stale
    // capture here would silently bias equations against the previous round's hand.
    const equation = generateKindEquation(dependencies.random, state.inventory);
    dispatch({ type: "NEXT_ROUND", equation });
  }, [dependencies, state.inventory]);

  // §1.11: gameOver's Enter shortcut restarts the run, equivalent to Play
  // Again, regardless of which button currently has focus. useGameKeyboard
  // (mounted inside GameScreen) only covers answering/feedback/overflow, and
  // title intentionally has no global Enter shortcut (the focused Start Run
  // button keeps ordinary browser behavior), so gameOver needs its own
  // listener here.
  useEffect(() => {
    if (state.phase !== "gameOver") return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key !== "Enter" || event.repeat) return;
      event.preventDefault();
      handleRestart();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.phase, handleRestart]);

  return (
    <div className={styles.app}>
      {state.phase !== "title" && (
        <div className={styles.languageBar}>
          <LanguageToggle />
        </div>
      )}

      {state.phase === "title" && <TitleScreen onStart={handleStart} />}

      {(state.phase === "answering" || state.phase === "feedback" || state.phase === "overflow") && (
        <GameScreen
          state={state}
          dispatch={dispatch}
          onSubmit={handleSubmit}
          onNextRound={handleNextRound}
        />
      )}

      {state.phase === "gameOver" && state.equation !== null && (
        <GameOverScreen
          equation={state.equation}
          stats={{
            score: state.score,
            totalRounds: state.totalRounds,
            longestStreak: state.longestStreak,
          }}
          url={dependencies.gameUrl}
          dependencies={shareDependencies}
          onPlayAgain={handleRestart}
        />
      )}
    </div>
  );
}

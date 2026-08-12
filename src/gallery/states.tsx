import type { ReactNode } from "react";
import { GameOverScreen } from "../components/GameOverScreen/GameOverScreen";
import { GameScreen } from "../components/GameScreen/GameScreen";
import { TitleScreen } from "../components/TitleScreen/TitleScreen";
import type { GamePhase, GameState } from "../game/types";
import type { ShareDependencies } from "../services/sharing";
import {
  makeAnsweringState,
  makeEquation,
  makeFeedbackState,
  makeGameOverState,
  makeOverflowInventory,
  makeOverflowState,
  makeTile,
} from "../test/fixtures";

export interface GalleryEntry {
  /** Stable across renders; used as the picker's React key. */
  id: string;
  /** Picker label. English only — the gallery is a dev tool, not a screen. */
  label: string;
  render: () => ReactNode;
}

// The gallery is for looking, not driving: every callback prop on every
// entry below is this one no-op rather than an inline arrow function apiece.
const noop = () => {};

function renderGameScreen(state: GameState): ReactNode {
  return <GameScreen state={state} dispatch={noop} onSubmit={noop} onNextRound={noop} />;
}

// GameOverScreen takes flat equation/stats props rather than a GameState;
// this adapts a `makeGameOverState` fixture to that shape.
function renderGameOverScreen(state: GameState, dependencies: ShareDependencies): ReactNode {
  // Reducer invariant (§2.5): equation === null only in `title`, and
  // makeGameOverState always sets phase to `gameOver`, so this only guards
  // the type.
  if (state.equation === null) return null;
  return (
    <GameOverScreen
      equation={state.equation}
      stats={{ score: state.score, totalRounds: state.totalRounds, longestStreak: state.longestStreak }}
      url="https://example.test/"
      dependencies={dependencies}
      onPlayAgain={noop}
    />
  );
}

const ANSWERING_EQUATION = makeEquation(3, 4); // product 12: two answer slots

// score and currentStreak/longestStreak reflect the round this correct
// answer just won, matching what SUBMIT_CORRECT actually produces instead of
// showing a reward next to a HUD that still reads zero.
const FEEDBACK_CORRECT_STATE = makeFeedbackState(makeEquation(3, 3), {
  inventory: [
    makeTile(1, "tile-1"),
    makeTile(2, "tile-2"),
    makeTile(4, "tile-4"),
    makeTile(5, "tile-5"),
    makeTile(7, "reward-0", true),
    makeTile(8, "reward-1", true),
  ],
  score: 1,
  currentStreak: 1,
  longestStreak: 1,
  lastResult: {
    kind: "correct",
    submittedValue: 9,
    correctValue: 9,
    submittedTiles: [makeTile(9, "spent-0")],
    rewardTileIds: ["reward-0", "reward-1"],
  },
});

// The default lastResult (src/test/fixtures.ts) is already incorrect, so no
// override is needed here.
const FEEDBACK_INCORRECT_STATE = makeFeedbackState(makeEquation(6, 7));

// Endless's only overflow case: excess 1 completes on the marking tap alone
// (see GameScreen's onTile handler), so OverflowControls never renders
// Confirm.
const OVERFLOW_REQUIRED_1_STATE = makeOverflowState(makeEquation(3, 3));

// Classic's case: excess 2 needs an explicit Confirm click. Classic mode
// doesn't exist in the shipped game, so this state is otherwise unreachable
// by playing.
const OVERFLOW_REQUIRED_2_STATE = makeOverflowState(makeEquation(3, 3), {
  inventory: makeOverflowInventory(12),
});

const GAME_OVER_STATE = makeGameOverState(makeEquation(7, 8));

const RESOLVING_SHARE_DEPENDENCIES: ShareDependencies = {
  writeClipboard: async () => {},
};

// nativeShare: undefined keeps Share on the same clipboard path Copy Result
// uses, so a rejecting writeClipboard reaches share.failed from either button.
const REJECTING_SHARE_DEPENDENCIES: ShareDependencies = {
  nativeShare: undefined,
  writeClipboard: async () => {
    throw new Error("clipboard write failed");
  },
};

// Keyed by phase so that adding a GamePhase member fails typecheck until the
// gallery covers it. A flat array with a hand-written phase list would rot
// silently, which is the failure this structure exists to prevent.
export const GALLERY_STATES: Record<GamePhase, GalleryEntry[]> = {
  title: [{ id: "title", label: "Title", render: () => <TitleScreen onStart={noop} /> }],
  answering: [
    {
      id: "answering-empty",
      label: "Answering — empty slots",
      render: () => renderGameScreen(makeAnsweringState(ANSWERING_EQUATION)),
    },
    {
      id: "answering-partial",
      label: "Answering — partially filled",
      render: () =>
        renderGameScreen(
          makeAnsweringState(ANSWERING_EQUATION, {
            selectedTiles: [makeTile(1, "selected-0")],
          }),
        ),
    },
    {
      id: "answering-full",
      label: "Answering — all slots filled",
      render: () =>
        renderGameScreen(
          makeAnsweringState(ANSWERING_EQUATION, {
            selectedTiles: [makeTile(1, "selected-0"), makeTile(2, "selected-1")],
          }),
        ),
    },
  ],
  feedback: [
    {
      id: "feedback-correct",
      label: "Feedback — correct, with reward badges",
      render: () => renderGameScreen(FEEDBACK_CORRECT_STATE),
    },
    {
      id: "feedback-incorrect",
      label: "Feedback — incorrect, with the answer comparison",
      render: () => renderGameScreen(FEEDBACK_INCORRECT_STATE),
    },
  ],
  overflow: [
    {
      id: "overflow-required-1",
      label: "Overflow — required 1 (Endless)",
      render: () => renderGameScreen(OVERFLOW_REQUIRED_1_STATE),
    },
    {
      id: "overflow-required-2",
      label: "Overflow — required 2 (Classic)",
      render: () => renderGameScreen(OVERFLOW_REQUIRED_2_STATE),
    },
  ],
  gameOver: [
    {
      id: "game-over-idle",
      label: "Game over — idle",
      render: () => renderGameOverScreen(GAME_OVER_STATE, RESOLVING_SHARE_DEPENDENCIES),
    },
    {
      id: "game-over-copy-succeeded",
      label: "Game over — copy succeeded",
      render: () => renderGameOverScreen(GAME_OVER_STATE, RESOLVING_SHARE_DEPENDENCIES),
    },
    {
      id: "game-over-copy-failed",
      label: "Game over — copy failed",
      render: () => renderGameOverScreen(GAME_OVER_STATE, REJECTING_SHARE_DEPENDENCIES),
    },
  ],
};

import type { ReactNode } from "react";
import { GameOverScreen } from "../components/GameOverScreen/GameOverScreen";
import { GameScreen } from "../components/GameScreen/GameScreen";
import { TitleScreen } from "../components/TitleScreen/TitleScreen";
import { sortTiles } from "../game/factories";
import { gameReducer } from "../game/gameReducer";
import type { GamePhase, GameState, Tile } from "../game/types";
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
const ANSWERING_BASE_STATE = makeAnsweringState(ANSWERING_EQUATION);

// Built by running the real reducer rather than hand-assembling a
// GameState: SELECT_TILE moves a tile out of inventory into selectedTiles,
// so these conserve the fixed 10 live tiles the shipped game shows at this
// moment. Selecting digit 1 then digit 2 spells 12, the correct answer,
// matching what a player building this hand would actually do.
const ANSWERING_PARTIAL_STATE = gameReducer(ANSWERING_BASE_STATE, {
  type: "SELECT_TILE",
  tileId: "tile-1",
});
const ANSWERING_FULL_STATE = gameReducer(ANSWERING_PARTIAL_STATE, {
  type: "SELECT_TILE",
  tileId: "tile-2",
});

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

// Overflow always follows SUBMIT_CORRECT, which stamps every newly granted
// tile isNew: true and files the result through sortTiles (gameReducer.ts).
// This builds a same-shaped overflow inventory from makeOverflowInventory:
// rewardTileIds is the one list that names which tiles are "new", so the
// reward badges FeedbackPanel draws from lastResult.rewardTileIds and the
// New-tile badges TileInventory draws from tile.isNew can't drift apart, and
// the digits land where sortTiles would actually file them instead of at
// the end of the row.
function makeOverflowInventoryWithRewards(size: number, rewardTileIds: readonly string[]): Tile[] {
  return sortTiles(
    makeOverflowInventory(size).map((tile) =>
      rewardTileIds.includes(tile.id) ? { ...tile, isNew: true } : tile,
    ),
  );
}

// Endless's only overflow case: excess 1 completes on the marking tap alone
// (see GameScreen's onTile handler), so OverflowControls never renders
// Confirm. Overflow always follows SUBMIT_CORRECT (only a correct answer
// grows the inventory past capacity), so lastResult is "correct" here —
// makeFeedbackState/makeOverflowState default to "incorrect", which the
// shipped game can never show during overflow. getRewardCount(1) =
// 1 + REWARD_BONUS = 2, so one spent tile earns two reward tiles:
// 10 - 1 + 2 = 11. Sorted, this 11-tile hand reads 0 0 1 1 2 3 4 5 6 7 8,
// with the reward tiles landing on the second 0 (tile-9) and the second 1
// (tile-10) — a hand a real correct answer on 3 x 3 could plausibly leave.
const OVERFLOW_REQUIRED_1_REWARD_TILE_IDS = ["tile-9", "tile-10"];

const OVERFLOW_REQUIRED_1_STATE = makeOverflowState(makeEquation(3, 3), {
  inventory: makeOverflowInventoryWithRewards(11, OVERFLOW_REQUIRED_1_REWARD_TILE_IDS),
  lastResult: {
    kind: "correct",
    submittedValue: 9,
    correctValue: 9,
    submittedTiles: [makeTile(9, "spent-0")],
    rewardTileIds: OVERFLOW_REQUIRED_1_REWARD_TILE_IDS,
  },
});

// Classic's case: excess 2 needs an explicit Confirm click. Classic mode
// doesn't exist in the shipped game, so this state is otherwise unreachable
// by playing. lastResult is "correct" for the same reason as required-1
// above; its three reward tiles reflect REWARD_BONUS = 2, which only
// Classic would need (Endless ships REWARD_BONUS = 1), so that reward count
// is unreachable for the same reason the inventory size is: 10 - 1 + 3 = 12.
// Sorted, this 12-tile hand reads 0 0 1 1 2 2 3 4 5 6 7 8: the reward tiles
// land on the second 0 (tile-9) and second 1 (tile-10) as above, but on the
// *first* of the two 2s (tile-11) — sortTiles breaks digit ties by comparing
// ids as strings, and "tile-11" sorts before "tile-2".
const OVERFLOW_REQUIRED_2_REWARD_TILE_IDS = ["tile-9", "tile-10", "tile-11"];

const OVERFLOW_REQUIRED_2_STATE = makeOverflowState(makeEquation(3, 3), {
  inventory: makeOverflowInventoryWithRewards(12, OVERFLOW_REQUIRED_2_REWARD_TILE_IDS),
  lastResult: {
    kind: "correct",
    submittedValue: 9,
    correctValue: 9,
    submittedTiles: [makeTile(9, "spent-0")],
    rewardTileIds: OVERFLOW_REQUIRED_2_REWARD_TILE_IDS,
  },
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
      render: () => renderGameScreen(ANSWERING_BASE_STATE),
    },
    {
      id: "answering-partial",
      label: "Answering — partially filled",
      render: () => renderGameScreen(ANSWERING_PARTIAL_STATE),
    },
    {
      id: "answering-full",
      label: "Answering — all slots filled",
      render: () => renderGameScreen(ANSWERING_FULL_STATE),
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

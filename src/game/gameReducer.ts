import type { Equation, GameAction, GameState, Tile } from "./types";
import { sortTiles } from "./factories";
import {
  canAttemptEquation,
  constructAnswer,
  getAnswerLength,
  getOverflowCount,
  getRewardCount,
  isDiscardReady,
} from "./selectors";

// Round 1, zero statistics, straight into answering — shared by START_RUN and
// RESTART_RUN, which both begin a run from action-provided equation/inventory.
function freshRunState(equation: Equation, inventory: Tile[]): GameState {
  return {
    phase: "answering",
    equation,
    inventory,
    selectedTiles: [],
    pendingDiscards: [],
    score: 0,
    round: 1,
    totalRounds: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastResult: null,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_RUN":
      return freshRunState(action.equation, action.inventory);

    case "SELECT_TILE": {
      if (state.phase !== "answering" || state.equation === null) return state;
      if (state.selectedTiles.length >= getAnswerLength(state.equation)) return state;
      const tile = state.inventory.find((item) => item.id === action.tileId);
      if (!tile) return state;
      return {
        ...state,
        inventory: state.inventory.filter((item) => item.id !== action.tileId),
        selectedTiles: [...state.selectedTiles, tile],
      };
    }

    case "RETURN_TILE": {
      if (state.phase !== "answering") return state;
      const tile = state.selectedTiles.find((item) => item.id === action.tileId);
      if (!tile) return state;
      return {
        ...state,
        selectedTiles: state.selectedTiles.filter((item) => item.id !== action.tileId),
        inventory: sortTiles([...state.inventory, tile]),
      };
    }

    case "SUBMIT_CORRECT": {
      if (state.phase !== "answering" || state.equation === null) return state;
      if (state.selectedTiles.length !== getAnswerLength(state.equation)) return state;
      const submittedValue = constructAnswer(state.selectedTiles);
      if (submittedValue === null || submittedValue !== state.equation.product) return state;
      if (action.rewardTiles.length !== getRewardCount(state.selectedTiles.length)) return state;
      const inventoryIds = new Set(state.inventory.map((tile) => tile.id));
      if (action.rewardTiles.some((tile) => inventoryIds.has(tile.id))) return state;

      const newRewardTiles = action.rewardTiles.map((tile) => ({ ...tile, isNew: true }));
      const nextInventory = sortTiles([...state.inventory, ...newRewardTiles]);
      const nextCurrentStreak = state.currentStreak + 1;

      return {
        ...state,
        phase: getOverflowCount(nextInventory) > 0 ? "overflow" : "feedback",
        inventory: nextInventory,
        selectedTiles: [],
        score: state.score + 1,
        currentStreak: nextCurrentStreak,
        longestStreak: Math.max(state.longestStreak, nextCurrentStreak),
        totalRounds: state.totalRounds + 1,
        lastResult: {
          kind: "correct",
          submittedValue,
          correctValue: state.equation.product,
          submittedTiles: state.selectedTiles,
          rewardTileIds: action.rewardTiles.map((tile) => tile.id),
        },
      };
    }

    case "SUBMIT_INCORRECT": {
      if (state.phase !== "answering" || state.equation === null) return state;
      if (state.selectedTiles.length !== getAnswerLength(state.equation)) return state;
      const submittedValue = constructAnswer(state.selectedTiles);
      if (submittedValue === null || submittedValue === state.equation.product) return state;

      return {
        ...state,
        phase: "feedback",
        selectedTiles: [],
        currentStreak: 0,
        totalRounds: state.totalRounds + 1,
        lastResult: {
          kind: "incorrect",
          submittedValue,
          correctValue: state.equation.product,
          submittedTiles: state.selectedTiles,
          rewardTileIds: [],
        },
      };
    }

    case "TOGGLE_DISCARD": {
      if (state.phase !== "overflow") return state;
      const tile = state.inventory.find((item) => item.id === action.tileId);
      if (!tile) return state;
      const alreadyMarked = state.pendingDiscards.includes(action.tileId);
      if (!alreadyMarked && state.pendingDiscards.length >= getOverflowCount(state.inventory)) {
        return state;
      }
      return {
        ...state,
        pendingDiscards: alreadyMarked
          ? state.pendingDiscards.filter((id) => id !== action.tileId)
          : [...state.pendingDiscards, action.tileId],
      };
    }

    case "CONFIRM_DISCARD": {
      if (!isDiscardReady(state)) return state;
      const discardIds = new Set(state.pendingDiscards);
      return {
        ...state,
        phase: "feedback",
        inventory: state.inventory.filter((tile) => !discardIds.has(tile.id)),
        pendingDiscards: [],
      };
    }

    case "NEXT_ROUND": {
      if (state.phase !== "feedback") return state;
      const nextInventory = state.inventory.map((tile) =>
        tile.isNew ? { ...tile, isNew: false } : tile,
      );
      return {
        ...state,
        phase: canAttemptEquation(nextInventory, action.equation) ? "answering" : "gameOver",
        equation: action.equation,
        inventory: nextInventory,
        selectedTiles: [],
        pendingDiscards: [],
        lastResult: null,
        round: state.round + 1,
      };
    }

    case "RESTART_RUN":
      if (state.phase !== "gameOver") return state;
      return freshRunState(action.equation, action.inventory);

    case "CLEAR_SELECTION": {
      if (state.phase !== "answering") return state;
      if (state.selectedTiles.length === 0) return state;
      return {
        ...state,
        inventory: sortTiles([...state.inventory, ...state.selectedTiles]),
        selectedTiles: [],
      };
    }

    default: {
      const exhaustiveCheck: never = action;
      return exhaustiveCheck;
    }
  }
}

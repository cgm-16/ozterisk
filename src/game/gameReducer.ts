import type { GameAction, GameState } from "./types";
import { sortTiles } from "./factories";
import { constructAnswer, getAnswerLength, getOverflowCount } from "./selectors";

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_RUN":
      return {
        phase: "answering",
        equation: action.equation,
        inventory: action.inventory,
        selectedTiles: [],
        pendingDiscards: [],
        score: 0,
        round: 1,
        totalRounds: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastResult: null,
      };

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
      if (action.rewardTiles.length !== state.selectedTiles.length + 1) return state;
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

    case "TOGGLE_DISCARD":
    case "CONFIRM_DISCARD":
    case "NEXT_ROUND":
    case "RESTART_RUN":
      return state;

    default: {
      const exhaustiveCheck: never = action;
      return exhaustiveCheck;
    }
  }
}

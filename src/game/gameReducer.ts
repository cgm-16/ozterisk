import type { GameAction, GameState } from "./types";
import { sortTiles } from "./factories";
import { getAnswerLength } from "./selectors";

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

    case "SUBMIT_CORRECT":
    case "SUBMIT_INCORRECT":
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

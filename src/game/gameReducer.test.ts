import { describe, expect, it } from "vitest";
import type { GameState } from "./types";
import { gameReducer } from "./gameReducer";
import { createInitialInventory, createTitleState, sortTiles } from "./factories";
import { makeAnsweringState, makeEquation, makeTile, sequentialIds } from "../test/fixtures";

describe("START_RUN", () => {
  it("starts a new run in the answering phase at round 1 with the provided inventory and reset statistics", () => {
    const priorState: GameState = {
      ...createTitleState(),
      phase: "gameOver",
      score: 5,
      round: 6,
      totalRounds: 5,
      currentStreak: 2,
      longestStreak: 4,
      lastResult: {
        kind: "incorrect",
        submittedValue: 12,
        correctValue: 15,
        submittedTiles: [],
        rewardTileIds: [],
      },
    };
    const equation = makeEquation(3, 4);
    const inventory = createInitialInventory(sequentialIds());

    const next = gameReducer(priorState, { type: "START_RUN", equation, inventory });

    expect(next).toEqual({
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
    });
  });
});

describe("SELECT_TILE", () => {
  it("moves an exact tile into the next ordered answer slot", () => {
    const state = makeAnsweringState(makeEquation(7, 8));
    const tile = state.inventory.find((item) => item.digit === 5)!;
    const next = gameReducer(state, { type: "SELECT_TILE", tileId: tile.id });
    expect(next.selectedTiles).toEqual([tile]);
    expect(next.inventory).not.toContainEqual(tile);
  });

  it("treats duplicate-digit tiles as distinct entities addressed by exact ID", () => {
    const tileA = makeTile(5, "tile-a");
    const tileB = makeTile(5, "tile-b");
    const state = makeAnsweringState(makeEquation(9, 9), { inventory: [tileA, tileB] });

    const afterFirst = gameReducer(state, { type: "SELECT_TILE", tileId: tileA.id });
    const afterSecond = gameReducer(afterFirst, { type: "SELECT_TILE", tileId: tileB.id });

    expect(afterSecond.selectedTiles[0]).toBe(tileA);
    expect(afterSecond.selectedTiles[1]).toBe(tileB);
    expect(afterSecond.inventory).toEqual([]);
    // the original inventory array passed via overrides must be untouched
    expect(state.inventory).toHaveLength(2);
  });

  it("is a no-op when the answer slots are already full", () => {
    const selected = [makeTile(9, "tile-selected")];
    const extra = makeTile(2, "tile-extra");
    const state = makeAnsweringState(makeEquation(3, 3), {
      inventory: [extra],
      selectedTiles: selected,
    });

    const next = gameReducer(state, { type: "SELECT_TILE", tileId: extra.id });

    expect(next).toBe(state);
  });

  it("is a no-op when the tile ID is not present in inventory", () => {
    const state = makeAnsweringState(makeEquation(3, 3));

    const next = gameReducer(state, { type: "SELECT_TILE", tileId: "missing-tile" });

    expect(next).toBe(state);
  });

  it("is a no-op outside the answering phase", () => {
    const state = makeAnsweringState(makeEquation(3, 3), { phase: "feedback" });
    const tile = state.inventory[0]!;

    const next = gameReducer(state, { type: "SELECT_TILE", tileId: tile.id });

    expect(next).toBe(state);
  });
});

describe("RETURN_TILE", () => {
  it("removes the exact selected tile and re-sorts it into inventory", () => {
    const selectedTile = makeTile(4, "tile-selected");
    const inventory = [makeTile(1, "tile-a"), makeTile(6, "tile-b")];
    const state = makeAnsweringState(makeEquation(3, 3), {
      inventory,
      selectedTiles: [selectedTile],
    });

    const next = gameReducer(state, { type: "RETURN_TILE", tileId: selectedTile.id });

    expect(next.selectedTiles).toEqual([]);
    expect(next.inventory).toEqual(sortTiles([...inventory, selectedTile]));
    // the canonical tile object moves as-is; no clone or added flags
    expect(next.inventory).toContain(selectedTile);
    // the original arrays passed via overrides must be untouched
    expect(inventory).toHaveLength(2);
    expect(state.selectedTiles).toEqual([selectedTile]);
  });

  it("is a no-op when the tile ID is not present in selectedTiles", () => {
    const state = makeAnsweringState(makeEquation(3, 3), {
      selectedTiles: [makeTile(4, "tile-selected")],
    });

    const next = gameReducer(state, { type: "RETURN_TILE", tileId: "missing-tile" });

    expect(next).toBe(state);
  });

  it("is a no-op outside the answering phase", () => {
    const selectedTile = makeTile(4, "tile-selected");
    const state = makeAnsweringState(makeEquation(3, 3), {
      phase: "feedback",
      selectedTiles: [selectedTile],
    });

    const next = gameReducer(state, { type: "RETURN_TILE", tileId: selectedTile.id });

    expect(next).toBe(state);
  });
});

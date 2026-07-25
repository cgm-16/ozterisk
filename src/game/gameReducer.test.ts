import { describe, expect, it } from "vitest";
import type { Digit, Equation, GameState } from "./types";
import { gameReducer } from "./gameReducer";
import { createInitialInventory, createTitleState, sortTiles } from "./factories";
import { makeAnsweringState, makeEquation, makeTile, sequentialIds } from "../test/fixtures";

// A §2.5-legal feedback-phase state: lastResult is non-null and round === totalRounds.
const makeFeedbackState = (
  equation: Equation,
  overrides: Partial<GameState> = {},
): GameState => ({
  ...makeAnsweringState(equation, { round: 1, totalRounds: 1 }),
  phase: "feedback",
  lastResult: {
    kind: "incorrect",
    submittedValue: 1,
    correctValue: 9,
    submittedTiles: [],
    rewardTileIds: [],
  },
  ...overrides,
});

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

describe("SUBMIT_CORRECT", () => {
  it("consumes tiles in append order, updates score/streak/totalRounds exactly once, inserts N+1 sorted new reward tiles, and enters feedback within capacity", () => {
    const equation = makeEquation(7, 8); // product 56
    const tileFive = makeTile(5, "tile-five");
    const tileSix = makeTile(6, "tile-six");
    const other = makeTile(3, "tile-other");
    const state = makeAnsweringState(equation, {
      inventory: [other],
      selectedTiles: [tileFive, tileSix], // selecting 5 then 6 constructs 56
      score: 5,
      currentStreak: 1,
      longestStreak: 3,
      totalRounds: 6,
      round: 7,
    });
    // reward0 arrives from the caller with isNew: false — per product.md
    // §1.5 step 8, the reducer must mark every inserted reward as new
    // regardless of what the action payload says.
    const reward0 = makeTile(1, "reward-0", false);
    const reward1 = makeTile(4, "reward-1", true);
    const reward2 = makeTile(7, "reward-2", true);

    const next = gameReducer(state, {
      type: "SUBMIT_CORRECT",
      rewardTiles: [reward0, reward1, reward2],
    });

    expect(next.selectedTiles).toEqual([]);
    expect(next.score).toBe(6);
    expect(next.currentStreak).toBe(2);
    expect(next.longestStreak).toBe(3);
    expect(next.totalRounds).toBe(7);
    expect(next.round).toBe(next.totalRounds);
    expect(next.phase).toBe("feedback");
    expect(next.inventory).toEqual(
      sortTiles([other, { ...reward0, isNew: true }, reward1, reward2]),
    );
    expect(next.inventory.find((tile) => tile.id === reward0.id)?.isNew).toBe(true);
    expect(next.lastResult).toEqual({
      kind: "correct",
      submittedValue: 56,
      correctValue: 56,
      submittedTiles: [tileFive, tileSix],
      rewardTileIds: [reward0.id, reward1.id, reward2.id],
    });
    // the original arrays passed via overrides must be untouched
    expect(state.selectedTiles).toEqual([tileFive, tileSix]);
    expect(state.inventory).toEqual([other]);
    // the reducer must not mutate the action's reward tile objects in place
    expect(reward0.isNew).toBe(false);
  });

  it("raises longest streak when current streak exceeds the previous longest streak", () => {
    const equation = makeEquation(3, 3); // product 9
    const selected = makeTile(9, "tile-selected");
    const state = makeAnsweringState(equation, {
      inventory: [],
      selectedTiles: [selected],
      score: 4,
      currentStreak: 4,
      longestStreak: 4,
      totalRounds: 5,
      round: 6,
    });
    const rewardTiles = [makeTile(1, "reward-0", true), makeTile(2, "reward-1", true)];

    const next = gameReducer(state, { type: "SUBMIT_CORRECT", rewardTiles });

    expect(next.currentStreak).toBe(5);
    expect(next.longestStreak).toBe(5);
    expect(next.round).toBe(next.totalRounds);
  });

  it("enters overflow when the post-reward inventory exceeds capacity", () => {
    const equation = makeEquation(3, 3); // product 9
    const selected = makeTile(9, "tile-selected");
    const inventory = Array.from({ length: 9 }, (_, index) =>
      makeTile((index % 9) as Digit, `tile-${index}`),
    );
    const state = makeAnsweringState(equation, { inventory, selectedTiles: [selected] });
    const rewardTiles = [makeTile(1, "reward-0", true), makeTile(2, "reward-1", true)];

    const next = gameReducer(state, { type: "SUBMIT_CORRECT", rewardTiles });

    expect(next.phase).toBe("overflow");
    expect(next.inventory).toHaveLength(11);
    expect(next.round).toBe(next.totalRounds);
  });

  it("is a no-op on a repeat dispatch once the round has left the answering phase", () => {
    const equation = makeEquation(3, 3); // product 9
    const selected = makeTile(9, "tile-selected");
    const state = makeAnsweringState(equation, { inventory: [], selectedTiles: [selected] });
    const rewardTiles = [makeTile(1, "reward-0", true), makeTile(2, "reward-1", true)];

    const first = gameReducer(state, { type: "SUBMIT_CORRECT", rewardTiles });
    const second = gameReducer(first, { type: "SUBMIT_CORRECT", rewardTiles });

    expect(second).toBe(first);
  });

  it("is a no-op outside the answering phase", () => {
    const equation = makeEquation(3, 3);
    const state = makeFeedbackState(equation);
    const rewardTiles = [makeTile(1, "reward-0", true), makeTile(2, "reward-1", true)];

    const next = gameReducer(state, { type: "SUBMIT_CORRECT", rewardTiles });

    expect(next).toBe(state);
  });

  it("is a no-op when the answer slots are not fully filled", () => {
    const equation = makeEquation(2, 5); // product 10, two slots
    const state = makeAnsweringState(equation, { selectedTiles: [makeTile(1, "tile-one")] });
    const rewardTiles = [makeTile(1, "reward-0", true), makeTile(2, "reward-1", true)];

    const next = gameReducer(state, { type: "SUBMIT_CORRECT", rewardTiles });

    expect(next).toBe(state);
  });

  it("is a no-op when the constructed answer does not actually match the product, regardless of the declared action", () => {
    const equation = makeEquation(3, 3); // product 9
    const state = makeAnsweringState(equation, {
      inventory: [],
      selectedTiles: [makeTile(5, "tile-five")],
    });
    const rewardTiles = [makeTile(1, "reward-0", true), makeTile(2, "reward-1", true)];

    const next = gameReducer(state, { type: "SUBMIT_CORRECT", rewardTiles });

    expect(next).toBe(state);
  });

  it("is a no-op when the reward tile count does not equal selectedTiles.length + 1", () => {
    const equation = makeEquation(3, 3); // product 9
    const state = makeAnsweringState(equation, {
      inventory: [],
      selectedTiles: [makeTile(9, "tile-selected")],
    });
    const rewardTiles = [makeTile(1, "reward-0", true)]; // should be 2

    const next = gameReducer(state, { type: "SUBMIT_CORRECT", rewardTiles });

    expect(next).toBe(state);
  });

  it("is a no-op when a reward tile ID collides with a live inventory tile ID", () => {
    const equation = makeEquation(3, 3); // product 9
    const other = makeTile(3, "tile-other");
    const state = makeAnsweringState(equation, {
      inventory: [other],
      selectedTiles: [makeTile(9, "tile-selected")],
    });
    const rewardTiles = [makeTile(1, "tile-other", true), makeTile(2, "reward-1", true)];

    const next = gameReducer(state, { type: "SUBMIT_CORRECT", rewardTiles });

    expect(next).toBe(state);
  });
});

describe("SUBMIT_INCORRECT", () => {
  it("consumes tiles, resets current streak while preserving longest streak, increments totalRounds, generates no rewards, and captures the incorrect result", () => {
    const equation = makeEquation(7, 8); // product 56
    const selected = [makeTile(7, "tile-a"), makeTile(8, "tile-b")]; // constructs 78
    const other = makeTile(3, "tile-other");
    const state = makeAnsweringState(equation, {
      inventory: [other],
      selectedTiles: selected,
      score: 6,
      currentStreak: 3,
      longestStreak: 5,
      totalRounds: 8,
      round: 9,
    });

    const next = gameReducer(state, { type: "SUBMIT_INCORRECT" });

    expect(next.selectedTiles).toEqual([]);
    expect(next.inventory).toEqual([other]);
    expect(next.score).toBe(6);
    expect(next.currentStreak).toBe(0);
    expect(next.longestStreak).toBe(5);
    expect(next.totalRounds).toBe(9);
    expect(next.round).toBe(next.totalRounds);
    expect(next.phase).toBe("feedback");
    expect(next.lastResult).toMatchObject({
      kind: "incorrect",
      submittedValue: 78,
      correctValue: 56,
      submittedTiles: selected,
      rewardTileIds: [],
    });
    expect(next.inventory).toHaveLength(state.inventory.length);
    // the original arrays passed via overrides must be untouched
    expect(state.selectedTiles).toEqual(selected);
    expect(state.inventory).toEqual([other]);
  });

  it("preserves append order (not sorted order) through the submission path", () => {
    const equation = makeEquation(5, 6); // product 30
    const tileSix = makeTile(6, "tile-six");
    const tileFive = makeTile(5, "tile-five");
    const state = makeAnsweringState(equation, {
      inventory: [],
      selectedTiles: [tileSix, tileFive], // selecting 6 then 5 constructs 65
    });

    const next = gameReducer(state, { type: "SUBMIT_INCORRECT" });

    expect(next.lastResult).toMatchObject({ submittedValue: 65, correctValue: 30 });
  });

  it("collapses a leading zero in the constructed value, so it never accidentally matches a two-digit product", () => {
    const equation = makeEquation(2, 9); // product 18
    const tileZero = makeTile(0, "tile-zero");
    const tileNine = makeTile(9, "tile-nine");
    const state = makeAnsweringState(equation, {
      inventory: [],
      selectedTiles: [tileZero, tileNine], // constructs 9, not "09"
    });

    const next = gameReducer(state, { type: "SUBMIT_INCORRECT" });

    expect(next.lastResult).toMatchObject({ submittedValue: 9, correctValue: 18 });
  });

  it("is accepted even when inventory lacks the tiles needed to construct the correct answer", () => {
    const equation = makeEquation(7, 8); // product 56
    const state = makeAnsweringState(equation, {
      inventory: [], // no tiles left at all, including no 5 or 6 for the correct answer
      selectedTiles: [makeTile(7, "tile-a"), makeTile(8, "tile-b")],
    });

    const next = gameReducer(state, { type: "SUBMIT_INCORRECT" });

    expect(next.phase).toBe("feedback");
  });

  it("is a no-op outside the answering phase", () => {
    const equation = makeEquation(3, 3);
    const state = makeFeedbackState(equation);

    const next = gameReducer(state, { type: "SUBMIT_INCORRECT" });

    expect(next).toBe(state);
  });

  it("is a no-op when the answer slots are not fully filled", () => {
    const equation = makeEquation(2, 5); // product 10, two slots
    const state = makeAnsweringState(equation, { selectedTiles: [makeTile(1, "tile-one")] });

    const next = gameReducer(state, { type: "SUBMIT_INCORRECT" });

    expect(next).toBe(state);
  });

  it("is a no-op when the constructed answer actually matches the product, regardless of the declared action", () => {
    const equation = makeEquation(3, 3); // product 9
    const state = makeAnsweringState(equation, {
      inventory: [],
      selectedTiles: [makeTile(9, "tile-selected")],
    });

    const next = gameReducer(state, { type: "SUBMIT_INCORRECT" });

    expect(next).toBe(state);
  });
});

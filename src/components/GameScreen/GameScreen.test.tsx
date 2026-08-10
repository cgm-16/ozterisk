import { StrictMode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Digit, Equation, GameState } from "../../game/types";
import { I18nProvider } from "../../i18n/I18nContext";
import { makeAnsweringState, makeEquation, makeTile } from "../../test/fixtures";
import { GameScreen, type GameScreenProps } from "./GameScreen";

// A §2.5-legal feedback-phase state: lastResult is non-null and round === totalRounds.
// Mirrors the local fixture pattern in src/game/gameReducer.test.ts.
const makeFeedbackState = (
  equation: Equation,
  overrides: Partial<GameState> = {},
): GameState => ({
  ...makeAnsweringState(equation, { round: 1, totalRounds: 1 }),
  phase: "feedback",
  inventory: [],
  lastResult: {
    kind: "incorrect",
    submittedValue: 1,
    correctValue: equation.product,
    submittedTiles: [],
    rewardTileIds: [],
  },
  ...overrides,
});

// A §2.5-legal overflow-phase state: inventory exceeds capacity (excess 1 by
// default), lastResult is non-null, and round === totalRounds.
const makeOverflowState = (
  equation: Equation,
  overrides: Partial<GameState> = {},
): GameState => ({
  ...makeFeedbackState(equation, {
    inventory: Array.from({ length: 11 }, (_, index) =>
      makeTile((index % 9) as Digit, `tile-${index}`),
    ),
  }),
  phase: "overflow",
  ...overrides,
});

// A 12-tile inventory (excess 2) for exercising the multi-tile Confirm path.
// The 11-tile default above collapses at requiredCount === 1, so covering
// Confirm's continued existence needs an inventory override, not a change to
// that default (which every other overflow test still relies on).
const TWELVE_TILE_INVENTORY = Array.from({ length: 12 }, (_, index) =>
  makeTile((index % 9) as Digit, `tile-${index}`),
);

function renderScreen(state: GameState) {
  const dispatch = vi.fn();
  const onSubmit = vi.fn();
  const onNextRound = vi.fn();
  const props: GameScreenProps = { state, dispatch, onSubmit, onNextRound };
  render(
    <I18nProvider initialLanguage="en">
      <GameScreen {...props} />
    </I18nProvider>,
  );
  return { dispatch, onSubmit, onNextRound };
}

describe("GameScreen interactions", () => {
  // 1. clicking duplicate digits dispatches the exact clicked ID
  it("dispatches SELECT_TILE with the exact clicked tile id among duplicate digits", async () => {
    const equation = makeEquation(2, 3); // product 6, one slot
    const inventory = [makeTile(2, "b"), makeTile(2, "c")];
    const state = makeAnsweringState(equation, { inventory, selectedTiles: [] });
    const { dispatch } = renderScreen(state);

    const duplicates = screen.getAllByRole("button", { name: "Digit 2" });
    await userEvent.click(duplicates[1]);

    expect(dispatch).toHaveBeenCalledWith({ type: "SELECT_TILE", tileId: "c" });
  });

  // 2. digit key chooses the first matching sorted inventory tile
  it("selects the first matching sorted inventory tile on a digit key press", async () => {
    const equation = makeEquation(2, 3);
    const inventory = [makeTile(2, "b"), makeTile(2, "c")];
    const state = makeAnsweringState(equation, { inventory, selectedTiles: [] });
    const { dispatch } = renderScreen(state);

    await userEvent.keyboard("2");

    expect(dispatch).toHaveBeenCalledWith({ type: "SELECT_TILE", tileId: "b" });
  });

  // 3. filled slots reject additional digits
  it("does not dispatch on a digit key press when all answer slots are already filled", async () => {
    const equation = makeEquation(2, 3); // one slot
    const inventory = [makeTile(4, "extra")];
    const selectedTiles = [makeTile(6, "sel")];
    const state = makeAnsweringState(equation, { inventory, selectedTiles });
    const { dispatch } = renderScreen(state);

    await userEvent.keyboard("4");

    expect(dispatch).not.toHaveBeenCalled();
  });

  // 4. Backspace returns the most recent selected tile
  it("returns the most recently selected tile on Backspace", async () => {
    const equation = makeEquation(7, 8); // product 56, two slots
    const selectedTiles = [makeTile(5, "first"), makeTile(6, "second")];
    const state = makeAnsweringState(equation, { inventory: [], selectedTiles });
    const { dispatch } = renderScreen(state);

    await userEvent.keyboard("{Backspace}");

    expect(dispatch).toHaveBeenCalledWith({ type: "RETURN_TILE", tileId: "second" });
  });

  // 4b. Escape clears the entire selection
  it("dispatches CLEAR_SELECTION on Escape when tiles are selected", async () => {
    const equation = makeEquation(7, 8); // product 56, two slots
    const selectedTiles = [makeTile(5, "first"), makeTile(6, "second")];
    const state = makeAnsweringState(equation, { inventory: [], selectedTiles });
    const { dispatch } = renderScreen(state);

    await userEvent.keyboard("{Escape}");

    expect(dispatch).toHaveBeenCalledWith({ type: "CLEAR_SELECTION" });
  });

  it("does not dispatch on Escape when nothing is selected", async () => {
    const equation = makeEquation(7, 8);
    const state = makeAnsweringState(equation, { inventory: [], selectedTiles: [] });
    const { dispatch } = renderScreen(state);

    await userEvent.keyboard("{Escape}");

    expect(dispatch).not.toHaveBeenCalled();
  });

  // 5. Enter submits only when ready
  it("submits on Enter when all answer slots are filled", async () => {
    const equation = makeEquation(7, 8);
    const state = makeAnsweringState(equation, {
      inventory: [],
      selectedTiles: [makeTile(5, "a"), makeTile(6, "b")],
    });
    const { onSubmit } = renderScreen(state);

    await userEvent.keyboard("{Enter}");

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("does not submit on Enter when an answer slot is still empty", async () => {
    const equation = makeEquation(7, 8);
    const state = makeAnsweringState(equation, {
      inventory: [],
      selectedTiles: [makeTile(5, "a")],
    });
    const { onSubmit } = renderScreen(state);

    await userEvent.keyboard("{Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
  });

  // 6. Enter confirms overflow only at exact selection
  it("confirms discard on Enter when exactly the excess tile count is marked", async () => {
    const equation = makeEquation(3, 3);
    const state = makeOverflowState(equation, { pendingDiscards: ["tile-0"] }); // excess is 1
    const { dispatch } = renderScreen(state);

    await userEvent.keyboard("{Enter}");

    expect(dispatch).toHaveBeenCalledWith({ type: "CONFIRM_DISCARD" });
  });

  it("does not confirm discard on Enter when the marked count is short of the excess", async () => {
    const equation = makeEquation(3, 3);
    const state = makeOverflowState(equation, { pendingDiscards: [] });
    const { dispatch } = renderScreen(state);

    await userEvent.keyboard("{Enter}");

    expect(dispatch).not.toHaveBeenCalled();
  });

  // 7. Enter advances from feedback
  it("advances to the next round on Enter during feedback", async () => {
    const equation = makeEquation(3, 3);
    const state = makeFeedbackState(equation);
    const { onNextRound } = renderScreen(state);

    await userEvent.keyboard("{Enter}");

    expect(onNextRound).toHaveBeenCalledTimes(1);
  });

  // 8. disabled shortcuts dispatch nothing
  describe("disabled keyboard shortcuts are no-ops", () => {
    it("ignores a digit key held with a modifier", async () => {
      const equation = makeEquation(2, 3);
      const inventory = [makeTile(4, "a")];
      const state = makeAnsweringState(equation, { inventory, selectedTiles: [] });
      const { dispatch } = renderScreen(state);

      await userEvent.keyboard("{Meta>}4{/Meta}");

      expect(dispatch).not.toHaveBeenCalled();
    });

    it("ignores a repeated Enter keydown", () => {
      const equation = makeEquation(7, 8);
      const state = makeAnsweringState(equation, {
        inventory: [],
        selectedTiles: [makeTile(5, "a"), makeTile(6, "b")],
      });
      const { onSubmit } = renderScreen(state);

      fireEvent.keyDown(window, { key: "Enter", repeat: true });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("ignores a digit key with no matching tile in inventory", async () => {
      const equation = makeEquation(2, 3);
      const inventory = [makeTile(4, "a")];
      const state = makeAnsweringState(equation, { inventory, selectedTiles: [] });
      const { dispatch } = renderScreen(state);

      await userEvent.keyboard("9");

      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  // 9. intentional incorrect selection can be submitted
  it("allows submitting an intentionally incorrect answer via the Submit button", async () => {
    const equation = makeEquation(5, 6); // correct product is 30
    const selectedTiles = [makeTile(6, "a"), makeTile(5, "b")]; // deliberately wrong: 65
    const state = makeAnsweringState(equation, { inventory: [], selectedTiles });
    const { onSubmit } = renderScreen(state);

    const submitButton = screen.getByRole("button", { name: "Submit" });
    expect(submitButton).toBeEnabled();
    await userEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  // 10. Clear button visibility follows selection state
  it("disables Clear when nothing is selected", () => {
    const equation = makeEquation(5, 6);
    const state = makeAnsweringState(equation, { inventory: [], selectedTiles: [] });
    renderScreen(state);

    expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
  });

  it("enables Clear once a tile is chosen", () => {
    const equation = makeEquation(5, 6);
    const state = makeAnsweringState(equation, {
      inventory: [],
      selectedTiles: [makeTile(3, "sel")],
    });
    renderScreen(state);

    expect(screen.getByRole("button", { name: "Clear" })).toBeEnabled();
  });

  it("dispatches CLEAR_SELECTION when Clear is clicked", async () => {
    const equation = makeEquation(5, 6);
    const state = makeAnsweringState(equation, {
      inventory: [],
      selectedTiles: [makeTile(3, "sel")],
    });
    const { dispatch } = renderScreen(state);

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(dispatch).toHaveBeenCalledWith({ type: "CLEAR_SELECTION" });
  });

  // Regression coverage: the phase action button (Next Round / Confirm
  // Discard) is a real focusable <button>. Enter on a focused button
  // natively triggers a click, so if the keyboard hook's Enter handling
  // didn't preventDefault() the keydown, the browser's own click-on-Enter
  // activation would fire the same callback a second time. This locks in
  // that the hook's dispatch/callback and the button's own onClick collapse
  // into exactly one call.
  describe("Enter does not double-fire when the phase action button has focus", () => {
    it("calls onNextRound exactly once with Next Round focused", async () => {
      const equation = makeEquation(3, 3);
      const state = makeFeedbackState(equation);
      const { onNextRound } = renderScreen(state);

      screen.getByRole("button", { name: "Next Round" }).focus();
      await userEvent.keyboard("{Enter}");

      expect(onNextRound).toHaveBeenCalledTimes(1);
    });

    it("dispatches CONFIRM_DISCARD exactly once with Confirm Discard focused", async () => {
      const equation = makeEquation(3, 3);
      // requiredCount 2: a single-tile discard collapses without Confirm, so
      // this needs the multi-tile inventory to keep exercising Confirm at all.
      const state = makeOverflowState(equation, {
        inventory: TWELVE_TILE_INVENTORY,
        pendingDiscards: ["tile-0", "tile-1"],
      });
      const { dispatch } = renderScreen(state);

      screen.getByRole("button", { name: "Confirm Discard" }).focus();
      await userEvent.keyboard("{Enter}");

      const confirmCalls = dispatch.mock.calls.filter(([action]) => action.type === "CONFIRM_DISCARD");
      expect(confirmCalls).toHaveLength(1);
    });

    it("calls onSubmit exactly once with Submit focused", async () => {
      const equation = makeEquation(7, 8);
      const state = makeAnsweringState(equation, {
        inventory: [],
        selectedTiles: [makeTile(5, "a"), makeTile(6, "b")],
      });
      const { onSubmit } = renderScreen(state);

      screen.getByRole("button", { name: "Submit" }).focus();
      await userEvent.keyboard("{Enter}");

      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });
});

describe("GameScreen phase composition", () => {
  it("orders HUD, equation, Submit, and inventory for the answering phase", () => {
    const equation = makeEquation(3, 4);
    const state = makeAnsweringState(equation, { inventory: [makeTile(1, "a")] });
    renderScreen(state);

    const hud = screen.getByText("Score").closest("dl");
    const equationEl = screen.getByText("3 × 4 =");
    const submit = screen.getByRole("button", { name: "Submit" });
    const inventoryTile = screen.getByRole("button", { name: "Digit 1" });
    expect(hud).not.toBeNull();

    // DOCUMENT_POSITION_FOLLOWING (4) means the argument node comes after `this` node.
    expect(hud!.compareDocumentPosition(equationEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(equationEl.compareDocumentPosition(submit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(submit.compareDocumentPosition(inventoryTile) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders interactive answer slots and a select-mode inventory in answering, without feedback", () => {
    const equation = makeEquation(3, 4);
    const state = makeAnsweringState(equation, { inventory: [makeTile(1, "a")] });
    renderScreen(state);

    expect(screen.getByRole("button", { name: "Answer slot 1: empty" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Digit 1" })).toBeEnabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders a read-only inventory, feedback, and Next Round in feedback, without answer slots", () => {
    const equation = makeEquation(3, 3);
    const state = makeFeedbackState(equation, { inventory: [makeTile(1, "a")] });
    renderScreen(state);

    const status = screen.getByRole("status");
    const nextRound = screen.getByRole("button", { name: "Next Round" });
    const inventoryTile = screen.getByRole("button", { name: "Digit 1" });
    expect(status).toHaveTextContent("Incorrect");
    expect(inventoryTile).toBeDisabled();
    expect(screen.queryByRole("button", { name: /Answer slot/ })).not.toBeInTheDocument();

    // HUD -> equation/feedback context -> phase action -> inventory (§1.10).
    expect(status.compareDocumentPosition(nextRound) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(nextRound.compareDocumentPosition(inventoryTile) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders a discard-mode inventory, preserved feedback, and Confirm Discard in overflow", () => {
    const equation = makeEquation(3, 3);
    // requiredCount 2: a single-tile discard collapses without Confirm, so
    // this needs the multi-tile inventory to keep exercising Confirm at all.
    const state = makeOverflowState(equation, {
      inventory: TWELVE_TILE_INVENTORY,
      pendingDiscards: ["tile-0", "tile-1"],
    });
    renderScreen(state);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Incorrect");
    const confirmButton = screen.getByRole("button", { name: "Confirm Discard" });
    expect(confirmButton).toBeEnabled();
    const discardTile = screen.getByRole("button", { name: "Digit 0, Marked for discard" });
    expect(discardTile).toHaveAttribute("aria-pressed", "true");

    // HUD -> equation/feedback context -> phase action -> inventory (§1.10).
    expect(status.compareDocumentPosition(confirmButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(confirmButton.compareDocumentPosition(discardTile) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps the feedback status region mounted across the overflow-to-feedback transition", () => {
    const equation = makeEquation(3, 3);
    const overflowState = makeOverflowState(equation, { pendingDiscards: ["tile-0"] });
    const { rerender } = render(
      <I18nProvider initialLanguage="en">
        <GameScreen state={overflowState} dispatch={vi.fn()} onSubmit={vi.fn()} onNextRound={vi.fn()} />
      </I18nProvider>,
    );
    const statusBeforeConfirm = screen.getByRole("status");

    const feedbackState = makeFeedbackState(equation, {
      inventory: overflowState.inventory.filter((tile) => tile.id !== "tile-0"),
    });
    rerender(
      <I18nProvider initialLanguage="en">
        <GameScreen state={feedbackState} dispatch={vi.fn()} onSubmit={vi.fn()} onNextRound={vi.fn()} />
      </I18nProvider>,
    );

    expect(screen.getByRole("status")).toBe(statusBeforeConfirm);
  });

  it("does not auto-advance out of feedback without user action", () => {
    const equation = makeEquation(3, 3);
    const state = makeFeedbackState(equation);
    const { onNextRound, dispatch } = renderScreen(state);

    expect(onNextRound).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("does not auto-confirm discard merely from reaching the exact required count", () => {
    const equation = makeEquation(3, 3);
    const state = makeOverflowState(equation, { pendingDiscards: ["tile-0"] });
    const { dispatch } = renderScreen(state);

    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe("GameScreen overflow collapse", () => {
  it("completes a forced single-tile discard in one tap under StrictMode", async () => {
    const user = userEvent.setup();
    const state = makeOverflowState(makeEquation(3, 3)); // 11 tiles -> required 1
    const dispatch = vi.fn();
    render(
      <StrictMode>
        <I18nProvider initialLanguage="en">
          <GameScreen state={state} dispatch={dispatch} onSubmit={vi.fn()} onNextRound={vi.fn()} />
        </I18nProvider>
      </StrictMode>,
    );

    // Digit 5 (index 5 of 11, digits cycle 0-8 then wrap to 0,1): the only
    // digits that repeat in this fixture are 0 and 1, so "Digit 5" is the
    // one accessible name guaranteed to resolve to a single button.
    await user.click(screen.getByRole("button", { name: "Digit 5" }));

    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      "TOGGLE_DISCARD",
      "CONFIRM_DISCARD",
    ]);
  });

  it("still renders Confirm and does not auto-complete a multi-tile (12-tile) overflow discard", async () => {
    const equation = makeEquation(3, 3);
    const state = makeOverflowState(equation, { inventory: TWELVE_TILE_INVENTORY }); // required 2
    const { dispatch } = renderScreen(state);

    expect(screen.getByRole("button", { name: "Confirm Discard" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Digit 5" }));

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: "TOGGLE_DISCARD", tileId: "tile-5" });
  });

  it("marks a tile via a digit key press during overflow", async () => {
    const equation = makeEquation(3, 3);
    const state = makeOverflowState(equation, { inventory: TWELVE_TILE_INVENTORY }); // required 2
    const { dispatch } = renderScreen(state);

    await userEvent.keyboard("5");

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: "TOGGLE_DISCARD", tileId: "tile-5" });
  });

  it("completes a forced single-tile discard on a digit key press", async () => {
    const equation = makeEquation(3, 3);
    const state = makeOverflowState(equation); // 11 tiles -> required 1
    const { dispatch } = renderScreen(state);

    await userEvent.keyboard("5");

    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      "TOGGLE_DISCARD",
      "CONFIRM_DISCARD",
    ]);
  });

  it("walks through duplicate-digit tiles on repeated presses instead of re-toggling an already-marked one", async () => {
    const equation = makeEquation(3, 3);
    // required 2; digit 0 appears twice (tile-0, tile-9) with tile-0 already marked.
    const state = makeOverflowState(equation, {
      inventory: TWELVE_TILE_INVENTORY,
      pendingDiscards: ["tile-0"],
    });
    const { dispatch } = renderScreen(state);

    await userEvent.keyboard("0");

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: "TOGGLE_DISCARD", tileId: "tile-9" });
  });

  it("ignores a digit key press once the required discard count is already marked", async () => {
    const equation = makeEquation(3, 3);
    const state = makeOverflowState(equation, { pendingDiscards: ["tile-0"] }); // required 1, already met
    const { dispatch } = renderScreen(state);

    await userEvent.keyboard("5");

    expect(dispatch).not.toHaveBeenCalled();
  });
});

// Regression coverage for useGameKeyboard's effect-registered `keydown`
// listener. Unlike a plain onClick (which cannot double-fire under
// StrictMode — only render bodies, reducers, and effect setup/cleanup are
// double-invoked), a dropped `useEffect` cleanup here would leave two
// `window.addEventListener("keydown", ...)` registrations live, so a single
// key press would dispatch twice. Escape is used because exactly one press
// yields exactly one action, making a doubled dispatch immediately visible
// in the asserted sequence.
describe("useGameKeyboard under React.StrictMode", () => {
  it("dispatches CLEAR_SELECTION exactly once for a single Escape press", async () => {
    const user = userEvent.setup();
    const equation = makeEquation(7, 8);
    const state = makeAnsweringState(equation, {
      inventory: [],
      selectedTiles: [makeTile(5, "a"), makeTile(6, "b")],
    });
    const dispatch = vi.fn();
    render(
      <StrictMode>
        <I18nProvider initialLanguage="en">
          <GameScreen state={state} dispatch={dispatch} onSubmit={vi.fn()} onNextRound={vi.fn()} />
        </I18nProvider>
      </StrictMode>,
    );

    await user.keyboard("{Escape}");

    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual(["CLEAR_SELECTION"]);
  });
});

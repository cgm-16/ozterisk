import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { INVENTORY_CAPACITY } from "../../game/balance";
import type { Tile } from "../../game/types";
import { I18nProvider } from "../../i18n/I18nContext";
import { TileInventory, type TileInventoryProps } from "./TileInventory";

const tile = (digit: Tile["digit"], id: string, isNew = false): Tile => ({ id, digit, isNew });

function renderInventory(overrides: Partial<TileInventoryProps> = {}) {
  const onTile = vi.fn();
  const result = render(
    <I18nProvider initialLanguage="en">
      <TileInventory
        tiles={[]}
        mode="select"
        pendingDiscards={[]}
        liftedIds={[]}
        onTile={onTile}
        {...overrides}
      />
    </I18nProvider>,
  );
  return { onTile, container: result.container };
}

// The rack renders a fixed grid of cells (one child per socket or tile),
// independent of accessible roles — an empty or lifted cell carries no role
// at all, so cell count has to be read off the DOM shape rather than a query
// that only ever finds buttons.
function cellCount(container: HTMLElement): number {
  return container.firstElementChild?.children.length ?? 0;
}

describe("TileInventory", () => {
  it("renders tiles in the exact order given", () => {
    renderInventory({
      tiles: [tile(0, "a"), tile(2, "b"), tile(2, "c"), tile(5, "d")],
    });
    const buttons = screen.getAllByRole("button");
    expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual([
      "Digit 0",
      "Digit 2",
      "Digit 2",
      "Digit 5",
    ]);
  });

  it("invokes the callback with the exact id of the duplicate tile clicked", async () => {
    const { onTile } = renderInventory({
      tiles: [tile(2, "b"), tile(2, "c")],
    });
    const duplicates = screen.getAllByRole("button", { name: "Digit 2" });
    await userEvent.click(duplicates[1]);
    expect(onTile).toHaveBeenCalledTimes(1);
    expect(onTile).toHaveBeenCalledWith("c");
  });

  it("marks a new tile with a textual label and visible state", () => {
    renderInventory({
      tiles: [tile(7, "a", true)],
    });
    expect(screen.getByRole("button", { name: "Digit 7, New tile" })).toBeInTheDocument();
    expect(screen.getByText("New tile")).toBeInTheDocument();
  });

  it("marks a pending discard with a textual label and pressed state", () => {
    renderInventory({
      mode: "discard",
      tiles: [tile(3, "a")],
      pendingDiscards: ["a"],
    });
    const button = screen.getByRole("button", { name: "Digit 3, Marked for discard" });
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  // The whole rack is a toggle set while discarding, so an unmarked tile has
  // to say so. Reporting only the marked tile's "true" would leave the other
  // nine announcing as plain buttons with nothing to suggest they can be
  // marked at all.
  it("reports the unmarked tiles as unpressed while discarding", () => {
    renderInventory({
      mode: "discard",
      tiles: [tile(3, "a"), tile(4, "b")],
      pendingDiscards: ["a"],
    });
    expect(screen.getByRole("button", { name: "Digit 4" })).toHaveAttribute("aria-pressed", "false");
  });

  it("does not mark a tile as pending discard outside discard mode", () => {
    renderInventory({
      mode: "select",
      tiles: [tile(3, "a")],
      pendingDiscards: ["a"],
    });
    expect(screen.getByRole("button", { name: "Digit 3" })).toBeInTheDocument();
  });

  it("does not invoke the callback in read-only mode", async () => {
    const { onTile } = renderInventory({
      mode: "readOnly",
      tiles: [tile(4, "a")],
    });
    const button = screen.getByRole("button", { name: "Digit 4" });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onTile).not.toHaveBeenCalled();
  });

  it("renders ten cells whether one tile is held or all ten are", () => {
    const { container: oneHeld } = renderInventory({ tiles: [tile(1, "a")] });
    expect(cellCount(oneHeld)).toBe(INVENTORY_CAPACITY);
    cleanup();

    const tenHeld = Array.from({ length: 10 }, (_, index) =>
      tile((index % 10) as Tile["digit"], `t${index}`),
    );
    const { container: allHeld } = renderInventory({ tiles: tenHeld });
    expect(cellCount(allHeld)).toBe(INVENTORY_CAPACITY);
  });

  it("renders eleven cells when eleven tiles are held", () => {
    const eleven = Array.from({ length: 11 }, (_, index) => tile(0, `t${index}`));
    const { container } = renderInventory({ tiles: eleven });
    expect(cellCount(container)).toBe(11);
  });

  it("keeps the cell count and every other tile's cell unchanged when a tile becomes lifted", () => {
    const tiles = [tile(1, "a"), tile(2, "b"), tile(3, "c")];
    const { container: before } = renderInventory({ tiles });
    const textsBefore = Array.from(before.firstElementChild?.children ?? []).map(
      (cell) => cell.textContent,
    );
    cleanup();

    const { container: after } = renderInventory({ tiles, liftedIds: ["b"] });
    const textsAfter = Array.from(after.firstElementChild?.children ?? []).map(
      (cell) => cell.textContent,
    );

    expect(textsAfter).toHaveLength(textsBefore.length);
    expect(textsAfter[0]).toBe(textsBefore[0]); // tile "a" untouched
    expect(textsAfter[2]).toBe(textsBefore[2]); // tile "c" untouched
    expect(textsAfter[1]).toBe(""); // tile "b"'s cell is now an empty-looking socket
  });

  it("gives a lifted cell no Digit accessible name", () => {
    renderInventory({ tiles: [tile(4, "a")], liftedIds: ["a"] });
    expect(screen.queryByRole("button", { name: /^Digit \d$/ })).not.toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});

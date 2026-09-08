import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { INVENTORY_CAPACITY } from "../../game/balance";
import type { Tile } from "../../game/types";
import { I18nProvider } from "../../i18n/I18nContext";
import { TileInventory, type TileInventoryProps } from "./TileInventory";
import tileStyles from "../Tile/Tile.module.css";

const tile = (digit: Tile["digit"], id: string, isNew = false): Tile => ({ id, digit, isNew });

function renderInventory(overrides: Partial<TileInventoryProps> = {}) {
  const onTile = vi.fn();
  const inventory = (props: Partial<TileInventoryProps>) => (
    <I18nProvider initialLanguage="en">
      <TileInventory
        tiles={[]}
        mode="select"
        pendingDiscards={[]}
        liftedIds={[]}
        onTile={onTile}
        {...props}
      />
    </I18nProvider>
  );
  const result = render(inventory(overrides));
  return {
    onTile,
    container: result.container,
    // The rack holds a departing tile across a props change, so the moments
    // that outlive one render can only be read by re-rendering the same tree.
    rerender: (next: Partial<TileInventoryProps>) =>
      result.rerender(inventory({ ...overrides, ...next })),
  };
}

// The rack renders a fixed grid of cells (one child per socket or tile),
// independent of accessible roles — an empty or lifted cell carries no role
// at all, so cell count has to be read off the DOM shape rather than a query
// that only ever finds buttons.
function cellCount(container: HTMLElement): number {
  return container.firstElementChild?.children.length ?? 0;
}

function cells(container: HTMLElement): HTMLElement[] {
  return Array.from(container.firstElementChild?.children ?? []) as HTMLElement[];
}

// The one motion fact jsdom can settle: which element the cascade puts an
// animation on. Durations, distances and appearance are measured in a browser.
function animationOn(cell: HTMLElement): string {
  return getComputedStyle(cell).animationName;
}

// React picks the event name onAnimationEnd listens for by feature-detecting
// window.AnimationEvent, and jsdom implements no such constructor — so under
// test React is bound to the webkit-prefixed name and fireEvent.animationEnd
// alone reaches nothing. Both are dispatched, so this says "the animation
// ended" rather than "this jsdom ended it", and keeps saying it if jsdom ever
// grows the constructor and React switches back to the unprefixed name.
function endAnimation(cell: HTMLElement): void {
  fireEvent.animationEnd(cell);
  fireEvent(cell, new Event("webkitAnimationEnd", { bubbles: true }));
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
    // The badge span is gone (#84); the reward state is what now makes a new
    // tile visibly distinct, so that is what the test has to hold on to.
    expect(screen.getByRole("button", { name: "Digit 7, New tile" })).toHaveClass(tileStyles.reward);
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

  it("fires 9i on an arriving tile and leaves the residents still", () => {
    const { container } = renderInventory({ tiles: [tile(7, "a", true), tile(3, "b")] });
    expect(animationOn(cells(container)[0])).toBe("oz-fire");
    expect(animationOn(cells(container)[1])).toBe("none");
  });

  // 9i plays on arrival and never again. React reuses the cell's DOM node
  // across a re-render, and an animation-name that does not change starts no
  // new animation — so the node's identity is what makes the once true.
  it("does not restart 9i when a discard is toggled under it", () => {
    const tiles = [tile(7, "a", true)];
    const { container, rerender } = renderInventory({ tiles, mode: "discard" });
    const before = cells(container)[0];
    const classesBefore = before.className;
    rerender({ pendingDiscards: ["a"] });
    const after = cells(container)[0];
    expect(after).toBe(before);
    expect(after.className).toBe(classesBefore);
    expect(animationOn(after)).toBe("oz-fire");
  });

  it("rim-rejects the eleventh cell and none of the ten sockets", () => {
    const eleven = Array.from({ length: 11 }, (_, index) => tile(0, `t${index}`));
    const { container } = renderInventory({ tiles: eleven });
    expect(animationOn(cells(container)[INVENTORY_CAPACITY])).toBe("oz-rim-reject");
    expect(cells(container).slice(0, INVENTORY_CAPACITY).map(animationOn)).toEqual(
      Array.from({ length: INVENTORY_CAPACITY }, () => "none"),
    );
  });

  // 8a is positional and 9i is per-tile, and the tile that overflows the rack
  // is a reward tile almost every time — so the two collide on the eleventh
  // cell. It is the arrival that did not land, so it rim-rejects.
  it("rim-rejects an eleventh cell that holds a reward tile rather than firing it", () => {
    const eleven = Array.from({ length: 11 }, (_, index) => tile(0, `t${index}`, index === 10));
    const { container } = renderInventory({ tiles: eleven });
    expect(animationOn(cells(container)[INVENTORY_CAPACITY])).toBe("oz-rim-reject");
  });

  it("holds a confirmed discard in its own cell and retires it on animationend", () => {
    const tiles = [tile(1, "a"), tile(2, "b"), tile(3, "c")];
    const { container, rerender } = renderInventory({
      tiles,
      mode: "discard",
      pendingDiscards: ["b"],
    });
    rerender({ tiles: [tiles[0], tiles[2]], mode: "readOnly", pendingDiscards: [] });

    const departing = cells(container)[1];
    expect(departing.textContent).toBe("2");
    expect(animationOn(departing)).toBe("oz-tip-off");
    expect(cells(container)[2].textContent).toBe("3");

    endAnimation(departing);
    expect(cells(container)[1].textContent).toBe("3");
  });

  // The only discard the product can actually reach. INVENTORY_CAPACITY plus
  // REWARD_BONUS caps overflow at one tile, so GameScreen dispatches
  // TOGGLE_DISCARD and CONFIRM_DISCARD from the same click handler; React
  // batches them, and the rack is never once rendered with the tile's id in
  // pendingDiscards. Measured in a browser against the real game: keying the
  // exit off pendingDiscards meant 8c never played at all.
  it("tips off a discard that was never rendered as pending", () => {
    const tiles = [tile(1, "a"), tile(2, "b"), tile(3, "c")];
    const { container, rerender } = renderInventory({
      tiles,
      mode: "discard",
      pendingDiscards: [],
    });
    rerender({ tiles: [tiles[0], tiles[2]], mode: "readOnly", pendingDiscards: [] });

    const departing = cells(container)[1];
    expect(departing.textContent).toBe("2");
    expect(animationOn(departing)).toBe("oz-tip-off");
  });

  // A tile leaving the rack from the answering phase was submitted, not
  // discarded, and the slots already carry it — tipping it off the end would
  // draw it in two places going two ways.
  it("does not tip off a tile that leaves while the rack is selectable", () => {
    const tiles = [tile(1, "a"), tile(2, "b"), tile(3, "c")];
    const { container, rerender } = renderInventory({
      tiles,
      mode: "select",
      pendingDiscards: [],
    });
    rerender({ tiles: [tiles[0], tiles[2]], mode: "readOnly", pendingDiscards: [] });

    expect(cells(container)[1].textContent).toBe("3");
  });

  // A reward tile is the usual thing to discard, so this is the ordinary case
  // rather than the odd one: if 9i kept the cell, its animation-name would not
  // change, no animation would start, animationend would never fire and the
  // tile would sit in the rack for the rest of the run.
  it("tips off a departing reward tile instead of leaving it firing", () => {
    const tiles = [tile(7, "a", true), tile(3, "b")];
    const { container, rerender } = renderInventory({
      tiles,
      mode: "discard",
      pendingDiscards: ["a"],
    });
    rerender({ tiles: [tiles[1]], mode: "readOnly", pendingDiscards: [] });

    const departing = cells(container)[0];
    expect(animationOn(departing)).toBe("oz-tip-off");
    endAnimation(departing);
    expect(cells(container)[0].textContent).toBe("3");
  });

  // The departing tile has already left the game: the reducer dropped it and
  // nothing outside the rack knows it is still drawn.
  it("gives a departing tile no role and no accessible name", () => {
    const tiles = [tile(1, "a"), tile(2, "b")];
    const { container, rerender } = renderInventory({
      tiles,
      mode: "discard",
      pendingDiscards: ["b"],
    });
    rerender({ tiles: [tiles[0]], mode: "readOnly", pendingDiscards: [] });

    const departing = cells(container)[1];
    expect(departing).toHaveAttribute("aria-hidden", "true");
    expect(departing.querySelector("button")).toBeNull();
    expect(screen.queryByRole("button", { name: /^Digit 2$/ })).not.toBeInTheDocument();
  });

  // Only a discard tips off. A submitted tile leaves the rack too — it is
  // consumed by SUBMIT_CORRECT — and holding that one would draw a tile back
  // into a socket the player just emptied.
  it("does not hold a tile that leaves without having been marked", () => {
    const tiles = [tile(1, "a"), tile(2, "b")];
    const { container, rerender } = renderInventory({ tiles });
    rerender({ tiles: [tiles[0]] });
    expect(cells(container)[1].textContent).toBe("");
  });
});

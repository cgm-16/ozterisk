import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { INVENTORY_CAPACITY } from "../../game/balance";
import type { Tile } from "../../game/types";
import { I18nProvider } from "../../i18n/I18nContext";
import tileStyles from "../Tile/Tile.module.css";
import { rackTier } from "./rackTier";
import { TileInventory, type TileInventoryProps } from "./TileInventory";
import rackStyles from "./TileInventory.module.css";

const tile = (digit: Tile["digit"], id: string, isNew = false): Tile => ({ id, digit, isNew });

/** Renders the rack with stable callbacks and exposes a same-tree rerender helper. */
function renderInventory(overrides: Partial<TileInventoryProps> = {}) {
  const onTile = vi.fn();
  const onSettled = vi.fn();
  const inventory = (props: Partial<TileInventoryProps>) => (
    <I18nProvider initialLanguage="en">
      <TileInventory
        tiles={[]}
        mode="select"
        pendingDiscards={[]}
        liftedIds={[]}
        capacity={INVENTORY_CAPACITY}
        onTile={onTile}
        onSettled={onSettled}
        {...props}
      />
    </I18nProvider>
  );
  const result = render(inventory(overrides));
  return {
    onTile,
    onSettled,
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
  return cells(container).length;
}

function cells(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelector(`.${rackStyles.inventory}`)?.children ?? []) as HTMLElement[];
}

// The rail band above the grid, where tiles past capacity perch (§1.12).
function railCells(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelector(`.${rackStyles.rail}`)?.children ?? []) as HTMLElement[];
}

function plugCount(container: HTMLElement): number {
  return cells(container).filter((cell) => cell.classList.contains(rackStyles.plug)).length;
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

// jsdom has no AnimationEvent constructor, so the name a real cancel carries
// is set by hand.
function cancelEvent(animationName: string): Event {
  return Object.assign(new Event("animationcancel", { bubbles: true }), { animationName });
}

// Ten seated tiles and one on the rail, as the reducer leaves an Endless
// overflow: sorted seats, the newest arrival past capacity.
function railedRack(): Tile[] {
  return [
    ...Array.from({ length: 10 }, (_, index) => tile((index % 10) as Tile["digit"], `s${index}`)),
    tile(7, "rail", true),
  ];
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

  it("keeps ten sockets and perches an eleventh tile on the rail, never in a new row", () => {
    const eleven = Array.from({ length: 11 }, (_, index) => tile(0, `t${index}`));
    const { container } = renderInventory({ tiles: eleven });
    expect(cellCount(container)).toBe(10);
    expect(railCells(container)).toHaveLength(1);
  });

  it("draws no rail while nothing is past capacity", () => {
    const { container } = renderInventory({ tiles: [tile(1, "a")] });
    expect(container.querySelector(`.${rackStyles.rail}`)).toBeNull();
  });

  it("keeps the cell count and every other tile's cell unchanged when a tile becomes lifted", () => {
    const tiles = [tile(1, "a"), tile(2, "b"), tile(3, "c")];
    const { container: before } = renderInventory({ tiles });
    const textsBefore = cells(before).map((cell) => cell.textContent);
    cleanup();

    const { container: after } = renderInventory({ tiles, liftedIds: ["b"] });
    const textsAfter = cells(after).map((cell) => cell.textContent);

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

  it("rim-rejects the perched tile and none of the ten sockets", () => {
    const eleven = Array.from({ length: 11 }, (_, index) => tile(0, `t${index}`));
    const { container } = renderInventory({ tiles: eleven });
    expect(animationOn(railCells(container)[0])).toBe("oz-rim-reject");
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
    expect(animationOn(railCells(container)[0])).toBe("oz-rim-reject");
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
    expect(animationOn(departing)).toBe("oz-slide-off");
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
    expect(animationOn(departing)).toBe("oz-slide-off");
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
    expect(animationOn(departing)).toBe("oz-slide-off");
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

  it("sizes the rack by the capacity it is given, and rim-rejects the first cell past it", () => {
    const twenty = Array.from({ length: 20 }, (_, index) => tile((index % 10) as Tile["digit"], `t${index}`));
    const { container } = renderInventory({ tiles: twenty, capacity: 19 });
    expect(cellCount(container)).toBe(19);
    expect(railCells(container).map(animationOn)).toEqual(["oz-rim-reject"]);
    expect(animationOn(cells(container)[10])).toBe("none");
    cleanup();

    const { container: sparse } = renderInventory({ tiles: [tile(1, "a")], capacity: 19 });
    expect(cellCount(sparse)).toBe(19);
  });

  // The reducer seats a surviving rail tile in the freed socket in the same
  // action that drops the discarded one. Splicing the departing tile back in
  // would shove every later tile one cell over; the rack instead keeps
  // drawing the hand as it stood until the departure has played.
  it("draws the pre-discard hand while a seated tile departs, then the reducer's", () => {
    const before = railedRack();
    const after = [...before.slice(0, 10)];
    after[4] = before[10]!;
    const { container, rerender } = renderInventory({ tiles: before, mode: "discard" });
    rerender({ tiles: after, mode: "readOnly" });

    expect(cells(container)[4].textContent).toBe("4");
    expect(cells(container)[5].textContent).toBe("5");
    expect(railCells(container)[0].textContent).toBe("7");

    endAnimation(cells(container)[4]);
    expect(cellCount(container)).toBe(10);
    expect(railCells(container)).toHaveLength(0);
    expect(cells(container)[4].textContent).toBe("7");
    expect(cells(container)[5].textContent).toBe("5");
  });

  it("settles once, when the last of two departing tiles has played", () => {
    const before = [...railedRack(), tile(8, "rail-2", true)];
    const after = [...before.slice(0, 10)];
    after[2] = before[10]!;
    after[6] = before[11]!;
    const { container, rerender, onSettled } = renderInventory({ tiles: before, mode: "discard" });
    rerender({ tiles: after, mode: "readOnly" });

    endAnimation(cells(container)[2]);
    expect(onSettled).not.toHaveBeenCalled();
    endAnimation(cells(container)[6]);
    // Both rail tiles now drop into the freed seats (8a·2); the discard
    // settles when they land.
    expect(onSettled).not.toHaveBeenCalled();
    endAnimation(cells(container)[2]);
    endAnimation(cells(container)[6]);
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  // Two tiles leaving together finish in the same frame, and React batches the
  // updates their animationend handlers make. Measured in a real browser: a
  // retire that read the departure from its render's closure let the second
  // handler undo the first, one id was never retired, and the run froze.
  it("settles when two departures end in the same batch", () => {
    const before = [...railedRack(), tile(8, "rail-2", true)];
    const after = [...before.slice(0, 10)];
    after[2] = before[10]!;
    after[6] = before[11]!;
    const { container, rerender, onSettled } = renderInventory({ tiles: before, mode: "discard" });
    rerender({ tiles: after, mode: "readOnly" });

    const [first, second] = [cells(container)[2], cells(container)[6]];
    const endTogether = (pair: HTMLElement[]) =>
      act(() => {
        for (const cell of pair) {
          cell.dispatchEvent(new Event("animationend", { bubbles: true }));
          cell.dispatchEvent(new Event("webkitAnimationEnd", { bubbles: true }));
        }
      });
    endTogether([first, second]);
    // The two perched tiles land together too.
    endTogether([cells(container)[2], cells(container)[6]]);
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  // 8a·2: the tile perched on the rail takes the seat the discard freed, and
  // falls into it from where it perched — the perch was real, so the fall is.
  it("drops the surviving rail tile into the freed seat, and settles when it lands", () => {
    const before = railedRack();
    const after = [...before.slice(0, 10)];
    after[4] = before[10]!;
    const { container, rerender, onSettled } = renderInventory({ tiles: before, mode: "discard" });
    rerender({ tiles: after, mode: "readOnly" });

    endAnimation(cells(container)[4]); // the slide-off
    const seated = cells(container)[4];
    expect(seated.textContent).toBe("7");
    expect(animationOn(seated)).toBe("oz-perch-drop");
    expect(seated.style.getPropertyValue("--dx")).toMatch(/^-?\d+(\.\d+)?px$/);
    expect(seated.style.getPropertyValue("--dy")).toMatch(/^-?\d+(\.\d+)?px$/);
    expect(onSettled).not.toHaveBeenCalled();

    endAnimation(seated);
    expect(onSettled).toHaveBeenCalledTimes(1);
    expect(animationOn(cells(container)[4])).not.toBe("oz-perch-drop");
  });

  it("settles when the rail tile itself is the one discarded", () => {
    const before = railedRack();
    const { container, rerender, onSettled } = renderInventory({ tiles: before, mode: "discard" });
    rerender({ tiles: before.slice(0, 10), mode: "readOnly" });

    endAnimation(railCells(container)[0]);
    expect(onSettled).toHaveBeenCalledTimes(1);
    expect(cellCount(container)).toBe(10);
  });

  // With Next Round gone after a discard, a departure that never reports its
  // end would freeze the run. A cancelled animation still ends the departure.
  it("settles on animationcancel as well as animationend", () => {
    const before = railedRack();
    const { container, rerender, onSettled } = renderInventory({ tiles: before, mode: "discard" });
    rerender({ tiles: before.slice(0, 10), mode: "readOnly" });

    // React has no onAnimationCancel, so the rack listens natively.
    fireEvent(railCells(container)[0], cancelEvent("oz-slide-off"));
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  // Swapping a cell's animation-name cancels the animation it replaces: a
  // reward tile discarded inside its 380ms 9i fire cancels oz-fire as its exit
  // starts. That cancel is not the exit's, and must not settle the discard.
  it("ignores the cancel of the animation a departing cell replaced", () => {
    const before = railedRack();
    const { container, rerender, onSettled } = renderInventory({ tiles: before, mode: "discard" });
    rerender({ tiles: before.slice(0, 10), mode: "readOnly" });

    fireEvent(railCells(container)[0], cancelEvent("oz-fire"));
    expect(onSettled).not.toHaveBeenCalled();
  });

  it("does not settle for a tile that leaves the rack by submission", () => {
    const tiles = [tile(1, "a"), tile(2, "b")];
    const { rerender, onSettled } = renderInventory({ tiles });
    rerender({ tiles: [tiles[0]] });
    expect(onSettled).not.toHaveBeenCalled();
  });

  describe("the stepped Classic rack", () => {
    const hand = (count: number) =>
      Array.from({ length: count }, (_, index) => tile((index % 10) as Tile["digit"], `h${index}`));

    // The sizes' figures, and the narrow 6 x 44 fallback, are CSS: a container
    // query jsdom cannot evaluate. What the component owns is which size, and
    // enough cells for the fallback's whole rows.
    it("steps its size with the drawn capacity: small above 15, mid above 10, home at 10 and below", () => {
      expect(rackTier(20)).toEqual({ size: "small", top: 20, footprint: 24 });
      expect(rackTier(16)).toEqual({ size: "small", top: 20, footprint: 24 });
      expect(rackTier(15)).toEqual({ size: "mid", top: 15, footprint: 18 });
      expect(rackTier(11)).toEqual({ size: "mid", top: 15, footprint: 18 });
      expect(rackTier(10)).toEqual({ size: "home", top: 10, footprint: 10 });
      expect(rackTier(6)).toEqual({ size: "home", top: 10, footprint: 10 });
    });

    it("names its size for the stylesheet", () => {
      const { container } = renderInventory({ tiles: hand(15), capacity: 15, drawnCapacity: 15, stepped: true });
      expect(container.querySelector(`.${rackStyles.rack}`)).toHaveAttribute("data-size", "mid");
    });

    // 24 cells: the narrow fallback's four rows of six. Wide, CSS draws the
    // first 21 — seven by three — so the house plug is the one at index 20.
    it("draws the whole-row footprint, sealing the house plugs at twenty", () => {
      const { container } = renderInventory({ tiles: hand(20), capacity: 20, drawnCapacity: 20, stepped: true });
      expect(cellCount(container)).toBe(24);
      expect(plugCount(container)).toBe(4);
      const plug = cells(container).find((cell) => cell.classList.contains(rackStyles.plug))!;
      expect(plug).toHaveAttribute("aria-hidden", "true");
    });

    it("closes the socket a seal took before the round change, and seats no tile there", () => {
      // Live 19 after the second submission; the rack is still drawn at 20.
      const { container } = renderInventory({ tiles: hand(19), capacity: 19, drawnCapacity: 20, stepped: true });
      expect(cellCount(container)).toBe(24);
      expect(plugCount(container)).toBe(5);
      expect(cells(container)[19].textContent).toBe("");
    });

    it("perches Classic's two-tile excess on the rail and keeps the grid whole", () => {
      const { container } = renderInventory({ tiles: hand(21), capacity: 19, drawnCapacity: 20, stepped: true });
      expect(cellCount(container)).toBe(24);
      expect(railCells(container)).toHaveLength(2);
    });

    it("draws 18 cells with three plugs at fifteen", () => {
      const { container } = renderInventory({ tiles: hand(15), capacity: 15, drawnCapacity: 15, stepped: true });
      expect(cellCount(container)).toBe(18);
      expect(plugCount(container)).toBe(3);
    });

    it("draws the ten-socket rack from ten down, where only a closed socket is a plug", () => {
      const { container } = renderInventory({ tiles: hand(9), capacity: 9, drawnCapacity: 10, stepped: true });
      expect(cellCount(container)).toBe(10);
      expect(plugCount(container)).toBe(1);
    });

    // M6: the socket a submission sealed closes where it is — the well shrinks
    // from the bottom and a hairline rim closes over it — and stays closed.
    it("closes the socket the seal took: the well collapses and the rim seals over it", () => {
      const { container } = renderInventory({ tiles: hand(19), capacity: 19, drawnCapacity: 20, stepped: true });
      const closing = cells(container)[19];
      const [well, rim] = Array.from(closing.children) as HTMLElement[];
      expect(animationOn(well)).toBe("oz-seal");
      expect(animationOn(rim)).toBe("oz-seal-rim");
      expect(well.style.animationDelay).toBe("");
    });

    // M6·0: the twenty-first socket seals under the entrance, once a run.
    it("seals the house plug 240ms into the first render at twenty", () => {
      const { container } = renderInventory({ tiles: hand(20), capacity: 20, drawnCapacity: 20, stepped: true });
      const [well] = Array.from(cells(container)[20].children) as HTMLElement[];
      expect(animationOn(well)).toBe("oz-seal");
      expect(well.style.animationDelay).toBe("240ms");
    });

    // M6·1 and M6·2: at a size change the tiles fly from their old seats, and
    // the new size's plugs close 40ms apart once they have landed.
    it("re-seats every tile and closes the new plugs at a size change", () => {
      const tiles = hand(15);
      const { container, rerender } = renderInventory({ tiles, capacity: 15, drawnCapacity: 16, stepped: true });
      rerender({ tiles, capacity: 15, drawnCapacity: 15, stepped: true });

      const seated = cells(container).slice(0, 15);
      for (const cell of seated) {
        expect(cell.style.animationName).toBe("oz-reseat");
        expect(cell.style.getPropertyValue("--fx")).toMatch(/px$/);
        expect(cell.style.getPropertyValue("--fs")).not.toBe("");
      }
      const delays = cells(container)
        .slice(15)
        .map((plug) => (plug.children[0] as HTMLElement).style.animationDelay);
      expect(delays).toEqual(["300ms", "340ms", "380ms"]);
    });

    it("does not re-seat on a render that keeps the size", () => {
      const tiles = hand(18);
      const { container, rerender } = renderInventory({ tiles, capacity: 18, drawnCapacity: 19, stepped: true });
      rerender({ tiles, capacity: 18, drawnCapacity: 18, stepped: true });
      expect(cells(container)[0].style.animationName).toBe("");
    });

    // The re-seat's frame is written inline, and inline beats a class: left
    // in place, a re-seated tile discarded later would keep computing
    // oz-reseat instead of oz-slide-off, start no exit, fire no animationend,
    // and — with no Next Round after a discard — freeze the run.
    it("lets a re-seated tile leave by its own exit later in the run", () => {
      const tiles = hand(15);
      const { container, rerender, onSettled } = renderInventory({
        tiles, capacity: 15, drawnCapacity: 16, stepped: true,
      });
      rerender({ tiles, capacity: 15, drawnCapacity: 15, stepped: true });
      for (const cell of cells(container).slice(0, 15)) {
        fireEvent(cell, Object.assign(new Event("animationend", { bubbles: true }), { animationName: "oz-reseat" }));
      }

      const railed = [...tiles, tile(7, "rail", true)];
      rerender({ tiles: railed, capacity: 15, drawnCapacity: 15, stepped: true, mode: "discard" });
      const after = [...tiles];
      after[3] = railed[15]!;
      rerender({ tiles: after, capacity: 15, drawnCapacity: 15, stepped: true, mode: "readOnly" });

      const departing = cells(container)[3];
      expect(animationOn(departing)).toBe("oz-slide-off");
      endAnimation(departing);
      endAnimation(cells(container)[3]); // the rail tile lands
      expect(onSettled).toHaveBeenCalledTimes(1);
    });

    // A discard inside the 300ms re-seat: the leaving tile drops the re-seat
    // for its exit at once, and the re-seat's cancel is not its exit ending.
    it("plays the exit of a tile discarded while it is still re-seating", () => {
      const tiles = hand(15);
      const { container, rerender, onSettled } = renderInventory({
        tiles, capacity: 15, drawnCapacity: 16, stepped: true,
      });
      rerender({ tiles, capacity: 15, drawnCapacity: 15, stepped: true });

      const railed = [...tiles, tile(7, "rail", true)];
      rerender({ tiles: railed, capacity: 15, drawnCapacity: 15, stepped: true, mode: "discard" });
      const after = [...tiles];
      after[3] = railed[15]!;
      rerender({ tiles: after, capacity: 15, drawnCapacity: 15, stepped: true, mode: "readOnly" });

      const departing = cells(container)[3];
      expect(animationOn(departing)).toBe("oz-slide-off");
      fireEvent(departing, cancelEvent("oz-reseat"));
      expect(container.querySelector("[data-departing]")).not.toBeNull();
      expect(onSettled).not.toHaveBeenCalled();
    });
  });
});

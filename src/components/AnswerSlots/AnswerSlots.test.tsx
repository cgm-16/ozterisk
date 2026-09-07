import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Tile } from "../../game/types";
import { I18nProvider } from "../../i18n/I18nContext";
import { AnswerSlots, type AnswerSlotsProps } from "./AnswerSlots";
import styles from "./AnswerSlots.module.css";

const tile = (digit: Tile["digit"], id: string): Tile => ({ id, digit, isNew: false });

function slotsTree(onReturn: () => void, overrides: Partial<AnswerSlotsProps>) {
  return (
    <I18nProvider initialLanguage="en">
      <AnswerSlots
        slotCount={2}
        selectedTiles={[]}
        onReturn={onReturn}
        disabled={false}
        {...overrides}
      />
    </I18nProvider>
  );
}

function renderSlots(overrides: Partial<AnswerSlotsProps> = {}) {
  const onReturn = vi.fn();
  const view = render(slotsTree(onReturn, overrides));
  return {
    ...view,
    onReturn,
    rerenderSlots: (next: Partial<AnswerSlotsProps>) => view.rerender(slotsTree(onReturn, next)),
  };
}

describe("AnswerSlots", () => {
  it("renders exactly one slot for a one-digit product", () => {
    renderSlots({ slotCount: 1 });
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("renders exactly two slots for a two-digit product", () => {
    renderSlots({ slotCount: 2 });
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("shows selected tile digits in slot order", () => {
    renderSlots({
      slotCount: 2,
      selectedTiles: [tile(5, "a"), tile(6, "b")],
    });
    expect(screen.getByRole("button", { name: "Answer slot 1: 5" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Answer slot 2: 6" })).toBeInTheDocument();
  });

  it("labels an empty slot by its position", () => {
    renderSlots({
      slotCount: 2,
      selectedTiles: [tile(5, "a")],
    });
    expect(screen.getByRole("button", { name: "Answer slot 2: empty" })).toBeInTheDocument();
  });

  it("returns the exact tile id when a filled slot is clicked", async () => {
    const { onReturn } = renderSlots({
      slotCount: 2,
      selectedTiles: [tile(5, "a"), tile(6, "b")],
    });
    await userEvent.click(screen.getByRole("button", { name: "Answer slot 2: 6" }));
    expect(onReturn).toHaveBeenCalledTimes(1);
    expect(onReturn).toHaveBeenCalledWith("b");
  });

  it("disables filled slots and blocks the return callback", async () => {
    const { onReturn } = renderSlots({
      slotCount: 1,
      selectedTiles: [tile(5, "a")],
      disabled: true,
    });
    const slot = screen.getByRole("button", { name: "Answer slot 1: 5" });
    expect(slot).toBeDisabled();
    await userEvent.click(slot);
    expect(onReturn).not.toHaveBeenCalled();
  });

  it("renders no button at all when onReturn is omitted", () => {
    renderSlots({
      slotCount: 2,
      selectedTiles: [tile(5, "a")],
      onReturn: undefined,
    });
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    // The filled slot keeps its digit; the socket keeps its name without a control.
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Answer slot 2: empty" })).toBeInTheDocument();
  });

  it("never allows clicking an empty slot to trigger a return", async () => {
    const { onReturn } = renderSlots({
      slotCount: 1,
      selectedTiles: [],
    });
    const slot = screen.getByRole("button", { name: "Answer slot 1: empty" });
    expect(slot).toBeDisabled();
    await userEvent.click(slot);
    expect(onReturn).not.toHaveBeenCalled();
  });
});

/* What jsdom can decide about motion is which element carries which animation:
   getComputedStyle resolves the cascade, and `css: true` puts the module in it.
   That the animation ran, how long it took and what it looked like are not
   readable here and are measured in a browser instead. */
describe("AnswerSlots motion", () => {
  const momentOn = (digit: string) =>
    getComputedStyle(screen.getByText(digit).parentElement!).animationName;

  it("arrives a tile that has been put in a slot", () => {
    renderSlots({ slotCount: 2, selectedTiles: [tile(5, "a")] });
    expect(momentOn("5")).toBe("oz-slot-arrive");
  });

  it("blooms the submitted tiles once the round is judged correct", () => {
    renderSlots({
      slotCount: 1,
      selectedTiles: [tile(5, "a")],
      onReturn: undefined,
      verdict: "correct",
    });
    expect(momentOn("5")).toBe("oz-bloom");
  });

  it("cracks the submitted tiles once the round is judged incorrect", () => {
    renderSlots({
      slotCount: 1,
      selectedTiles: [tile(5, "a")],
      onReturn: undefined,
      verdict: "incorrect",
    });
    expect(momentOn("5")).toBe("oz-crack");
  });

  it("dusts a cracked tile from a node of its own, so the two run apart", () => {
    const { container } = renderSlots({
      slotCount: 1,
      selectedTiles: [tile(5, "a")],
      onReturn: undefined,
      verdict: "incorrect",
    });
    const dust = container.querySelector(`.${styles.dust}`);
    expect(dust).not.toBeNull();
    expect(dust).not.toBe(screen.getByText("5").parentElement);
    expect(getComputedStyle(dust!).animationName).toBe("oz-dust");
  });

  it("neither blooms nor cracks while the player is still answering", () => {
    const { container } = renderSlots({ slotCount: 1, selectedTiles: [tile(5, "a")] });
    expect(momentOn("5")).toBe("oz-slot-arrive");
    expect(container.querySelector(`.${styles.dust}`)).toBeNull();
  });

  /* The arrival is the most frequent motion in the app, so a re-render that
     changed nothing must not replay it. Keying the slot to the tile is what
     buys that: React keeps the node, and a kept node keeps its finished
     animation. */
  it("keeps a slot's node when the tile in it has not changed", () => {
    const { rerenderSlots } = renderSlots({ slotCount: 2, selectedTiles: [tile(5, "a")] });
    const arrived = screen.getByText("5");
    rerenderSlots({ slotCount: 2, selectedTiles: [tile(5, "a"), tile(6, "b")] });
    expect(screen.getByText("5")).toBe(arrived);
  });

  it("replaces a slot's node when the tile in it changes", () => {
    const { rerenderSlots } = renderSlots({ slotCount: 1, selectedTiles: [tile(5, "a")] });
    const arrived = screen.getByText("5");
    rerenderSlots({ slotCount: 1, selectedTiles: [tile(6, "b")] });
    expect(screen.getByText("6")).not.toBe(arrived);
  });
});

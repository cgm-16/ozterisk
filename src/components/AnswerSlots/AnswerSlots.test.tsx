import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Tile } from "../../game/types";
import { I18nProvider } from "../../i18n/I18nContext";
import { AnswerSlots, type AnswerSlotsProps } from "./AnswerSlots";

const tile = (digit: Tile["digit"], id: string): Tile => ({ id, digit, isNew: false });

function renderSlots(overrides: Partial<AnswerSlotsProps> = {}) {
  const onReturn = vi.fn();
  render(
    <I18nProvider initialLanguage="en">
      <AnswerSlots
        slotCount={2}
        selectedTiles={[]}
        onReturn={onReturn}
        disabled={false}
        {...overrides}
      />
    </I18nProvider>,
  );
  return { onReturn };
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

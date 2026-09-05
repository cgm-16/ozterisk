import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../../i18n/I18nContext";
import { Tile, type TileProps, type TileSize, type TileState } from "./Tile";
import styles from "./Tile.module.css";

function renderTile(overrides: Partial<TileProps> = {}) {
  render(
    <I18nProvider initialLanguage="en">
      <Tile digit={7} {...overrides} />
    </I18nProvider>,
  );
}

describe("Tile", () => {
  describe("element rule", () => {
    it("renders a button when onClick is given", () => {
      renderTile({ onClick: vi.fn() });
      expect(screen.getByRole("button", { name: "Digit 7" })).toBeInTheDocument();
    });

    it("still renders a button when a clickable tile is disabled", async () => {
      const onClick = vi.fn();
      renderTile({ onClick, state: "disabled" });
      const button = screen.getByRole("button", { name: "Digit 7" });
      expect(button).toBeDisabled();
      await userEvent.click(button);
      expect(onClick).not.toHaveBeenCalled();
    });

    it("renders no button role when onClick is omitted", () => {
      renderTile();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(screen.getByText("7")).toBeInTheDocument();
    });

    it("gives a roleless tile no accessible name of its own", () => {
      renderTile({ label: "New tile" });
      expect(screen.queryByLabelText("New tile")).not.toBeInTheDocument();
    });

    it("invokes the callback on click", async () => {
      const onClick = vi.fn();
      renderTile({ onClick });
      await userEvent.click(screen.getByRole("button", { name: "Digit 7" }));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("uses the caller's label over the default digit name", () => {
      renderTile({ onClick: vi.fn(), label: "Answer slot 1: 7" });
      expect(screen.getByRole("button", { name: "Answer slot 1: 7" })).toBeInTheDocument();
    });

    it("reports a pressed toggle", () => {
      renderTile({ onClick: vi.fn(), state: "marked", pressed: true });
      expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
    });

    // The off-state is the half that matters: a toggle reporting only "true"
    // leaves every unpressed tile announcing as a plain button, so nothing
    // says it can be pressed at all.
    it("reports an unpressed toggle rather than omitting the state", () => {
      renderTile({ onClick: vi.fn(), pressed: false });
      expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
    });

    it("is a plain button when no toggle state is given", () => {
      renderTile({ onClick: vi.fn() });
      expect(screen.getByRole("button")).not.toHaveAttribute("aria-pressed");
    });
  });

  // A missing CSS Module key renders class="undefined" with no error and no
  // test failure (docs/journal/journal-2026-08-09.md), so every state and size
  // is asserted to resolve to a real class.
  describe("state and size classes", () => {
    const states: TileState[] = ["resting", "lifted", "reward", "marked", "disabled"];

    it.each(states)("resolves a class for the %s state", (state) => {
      expect(styles[state]).toBeTruthy();
      renderTile({ onClick: vi.fn(), state });
      expect(screen.getByRole("button")).toHaveClass(styles.tile, styles[state]);
    });

    const sizes: TileSize[] = ["lg", "sm"];

    it.each(sizes)("resolves a class for the %s size", (size) => {
      expect(styles[size]).toBeTruthy();
      renderTile({ onClick: vi.fn(), size });
      expect(screen.getByRole("button")).toHaveClass(styles.tile, styles[size]);
    });

    it("defaults to a resting lg tile", () => {
      renderTile({ onClick: vi.fn() });
      expect(screen.getByRole("button")).toHaveClass(styles.tile, styles.lg, styles.resting);
    });

    it("carries the same classes on the roleless form", () => {
      renderTile({ size: "sm", state: "reward" });
      expect(screen.getByText("7")).toHaveClass(styles.tile, styles.sm, styles.reward);
    });
  });
});

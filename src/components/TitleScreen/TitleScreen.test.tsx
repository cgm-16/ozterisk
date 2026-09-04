import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../../i18n/I18nContext";
import { TitleScreen } from "./TitleScreen";

describe("TitleScreen", () => {
  it("starts only from the explicit action", async () => {
    const onStart = vi.fn();
    render(
      <I18nProvider initialLanguage="en">
        <TitleScreen onStart={onStart} />
      </I18nProvider>,
    );
    expect(screen.getByRole("heading", { name: "ozterisk" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Start Run" }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("does not start the run before the button is pressed", () => {
    const onStart = vi.fn();
    render(
      <I18nProvider initialLanguage="en">
        <TitleScreen onStart={onStart} />
      </I18nProvider>,
    );

    expect(onStart).not.toHaveBeenCalled();
  });

  it("keeps the expanded rules collapsed by default and reveals them on request", async () => {
    render(
      <I18nProvider initialLanguage="en">
        <TitleScreen onStart={vi.fn()} />
      </I18nProvider>,
    );

    const summary = screen.getByText("How to Play");
    const disclosure = summary.closest("details");
    expect(disclosure).not.toBeNull();
    expect(disclosure).not.toHaveAttribute("open");

    await userEvent.click(summary);

    expect(disclosure).toHaveAttribute("open");
  });

  it("explains every required rule topic once expanded", async () => {
    render(
      <I18nProvider initialLanguage="en">
        <TitleScreen onStart={vi.fn()} />
      </I18nProvider>,
    );

    await userEvent.click(screen.getByText("How to Play"));

    // selecting and returning tiles
    expect(
      screen.getByText(/Click or tap an inventory tile to place it/),
    ).toBeInTheDocument();
    // ordered answer slots
    expect(
      screen.getByText(/Answer slots fill in the order you select tiles/),
    ).toBeInTheDocument();
    // correct and incorrect outcomes
    expect(
      screen.getByText(/A correct answer replaces the tiles you spent/),
    ).toBeInTheDocument();
    // ten-tile capacity
    expect(screen.getByText(/holds at most ten tiles/)).toBeInTheDocument();
    // overflow discarding
    expect(
      screen.getByText(/choose tiles to discard before play continues/),
    ).toBeInTheDocument();
    // score, streak, round, and loss rules
    expect(
      screen.getByText(/Round shows which equation is currently on screen, score counts correct answers/),
    ).toBeInTheDocument();
    // keyboard controls
    expect(
      screen.getByText(/Press a digit key to select a matching tile/),
    ).toBeInTheDocument();
  });

  it("switches all visible copy live when the language toggle changes languages", async () => {
    render(
      <I18nProvider initialLanguage="en">
        <TitleScreen onStart={vi.fn()} />
      </I18nProvider>,
    );

    expect(screen.getByRole("button", { name: "Start Run" })).toBeInTheDocument();
    expect(screen.getByText("How to Play")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "한국어" }));

    expect(screen.getByRole("heading", { name: "ozterisk" })).toBeVisible();
    expect(screen.getByRole("button", { name: "게임 시작" })).toBeInTheDocument();
    expect(screen.getByText("게임 방법")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "언어" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "English" }));

    expect(screen.getByRole("button", { name: "Start Run" })).toBeInTheDocument();
  });
});

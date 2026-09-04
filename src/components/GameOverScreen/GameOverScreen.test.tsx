import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../../i18n/I18nContext";
import type { ShareDependencies } from "../../services/sharing";
import { makeEquation } from "../../test/fixtures";
import { LanguageToggle } from "../LanguageToggle/LanguageToggle";
import { GameOverScreen, type GameOverScreenProps } from "./GameOverScreen";

const STATS = { score: 7, totalRounds: 9, longestStreak: 4 };
const EQUATION = makeEquation(2, 3);
const URL = "https://example.test/";
const EN_TEXT =
  "ozterisk — Rounds: 9\nScore: 7\nLongest streak: 4\n\nCan you beat it?\nhttps://example.test/";
const KO_TEXT =
  "ozterisk — 라운드: 9\n점수: 7\n최장 연속 정답: 4\n\n이 기록을 넘을 수 있나요?\nhttps://example.test/";

function renderScreen(overrides: Partial<GameOverScreenProps> = {}) {
  const onPlayAgain = vi.fn();
  const dependencies: ShareDependencies = {
    writeClipboard: vi.fn().mockResolvedValue(undefined),
  };
  render(
    <I18nProvider initialLanguage="en">
      <GameOverScreen
        equation={EQUATION}
        stats={STATS}
        url={URL}
        dependencies={dependencies}
        onPlayAgain={onPlayAgain}
        {...overrides}
      />
    </I18nProvider>,
  );
  return { onPlayAgain, dependencies };
}

describe("GameOverScreen", () => {
  it("renders the terminal equation and its reason inside the main landmark", () => {
    renderScreen({ equation: makeEquation(7, 8) });

    const main = screen.getByRole("main");
    expect(within(main).getByText("7 × 8 =")).toBeInTheDocument();
    expect(within(main).getByText("Not enough tiles left to answer.")).toBeInTheDocument();
  });

  it("shows the run statistics", () => {
    renderScreen();
    expect(screen.getByRole("heading", { name: "Game Over" })).toBeInTheDocument();
    expect(screen.getByText("Score")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("Rounds played")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("Longest streak")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("orders the statistics rounds, score, longest streak", () => {
    renderScreen();

    const rounds = screen.getByText("Rounds played");
    const score = screen.getByText("Score");
    const streak = screen.getByText("Longest streak");

    // DOCUMENT_POSITION_FOLLOWING (4) means the argument node comes after `this` node.
    expect(rounds.compareDocumentPosition(score) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(score.compareDocumentPosition(streak) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  // Mirrors the HUD's emphasis guard in App.test.tsx: reading getComputedStyle
  // catches a `.primary` rule that loses the cascade, which a className
  // assertion would not.
  it("renders the rounds value at a larger computed font size than score", () => {
    renderScreen();

    const roundsValue = screen.getByText("Rounds played").nextElementSibling as HTMLElement;
    const scoreValue = screen.getByText("Score").nextElementSibling as HTMLElement;

    const roundsFontSize = parseFloat(getComputedStyle(roundsValue).fontSize);
    const scoreFontSize = parseFloat(getComputedStyle(scoreValue).fontSize);

    expect(roundsFontSize).toBeGreaterThan(scoreFontSize);
  });

  it("invokes the Play Again callback", async () => {
    const { onPlayAgain } = renderScreen();
    await userEvent.click(screen.getByRole("button", { name: "Play Again" }));
    expect(onPlayAgain).toHaveBeenCalledTimes(1);
  });

  it("starts with an empty inline status", () => {
    renderScreen();
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("shares natively and leaves the clipboard untouched when sharing succeeds", async () => {
    const nativeShare = vi.fn().mockResolvedValue(undefined);
    const writeClipboard = vi.fn().mockResolvedValue(undefined);
    renderScreen({ dependencies: { nativeShare, writeClipboard } });

    await userEvent.click(screen.getByRole("button", { name: "Share" }));

    await waitFor(() => expect(nativeShare).toHaveBeenCalledTimes(1));
    expect(nativeShare).toHaveBeenCalledWith({ text: EN_TEXT, url: URL });
    expect(writeClipboard).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("falls back to copying and reports success when native sharing is unavailable", async () => {
    const writeClipboard = vi.fn().mockResolvedValue(undefined);
    renderScreen({ dependencies: { writeClipboard } });

    await userEvent.click(screen.getByRole("button", { name: "Share" }));

    await waitFor(() => expect(writeClipboard).toHaveBeenCalledTimes(1));
    expect(writeClipboard).toHaveBeenCalledWith(EN_TEXT);
    expect(screen.getByRole("status")).toHaveTextContent("Result copied.");
  });

  it("shows an inline failure status when native sharing is rejected, without copying", async () => {
    const nativeShare = vi.fn().mockRejectedValue(new Error("cancelled"));
    const writeClipboard = vi.fn().mockResolvedValue(undefined);
    renderScreen({ dependencies: { nativeShare, writeClipboard } });

    await userEvent.click(screen.getByRole("button", { name: "Share" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Could not share or copy the result."),
    );
    expect(writeClipboard).not.toHaveBeenCalled();
  });

  it("always calls the clipboard writer for Copy Result and reports success", async () => {
    const writeClipboard = vi.fn().mockResolvedValue(undefined);
    renderScreen({ dependencies: { writeClipboard } });

    await userEvent.click(screen.getByRole("button", { name: "Copy Result" }));

    await waitFor(() => expect(writeClipboard).toHaveBeenCalledTimes(1));
    expect(writeClipboard).toHaveBeenCalledWith(EN_TEXT);
    expect(screen.getByRole("status")).toHaveTextContent("Result copied.");
  });

  it("shows an inline failure status when the clipboard write rejects", async () => {
    const writeClipboard = vi.fn().mockRejectedValue(new Error("denied"));
    renderScreen({ dependencies: { writeClipboard } });

    await userEvent.click(screen.getByRole("button", { name: "Copy Result" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Could not share or copy the result."),
    );
  });

  it("regenerates the share text in the current language at click time", async () => {
    const nativeShare = vi.fn().mockResolvedValue(undefined);
    const writeClipboard = vi.fn().mockResolvedValue(undefined);
    render(
      <I18nProvider initialLanguage="en">
        <LanguageToggle />
        <GameOverScreen
          equation={EQUATION}
          stats={STATS}
          url={URL}
          dependencies={{ nativeShare, writeClipboard }}
          onPlayAgain={vi.fn()}
        />
      </I18nProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Share" }));
    await waitFor(() => expect(nativeShare).toHaveBeenCalledTimes(1));
    expect(nativeShare).toHaveBeenNthCalledWith(1, { text: EN_TEXT, url: URL });

    await userEvent.click(screen.getByRole("button", { name: "한국어" }));
    await userEvent.click(screen.getByRole("button", { name: "공유" }));

    await waitFor(() => expect(nativeShare).toHaveBeenCalledTimes(2));
    expect(nativeShare).toHaveBeenNthCalledWith(2, { text: KO_TEXT, url: URL });
  });
});

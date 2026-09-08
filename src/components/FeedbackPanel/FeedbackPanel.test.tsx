import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Language, RoundResult, Tile as TileModel } from "../../game/types";
import { I18nProvider } from "../../i18n/I18nContext";
import { FeedbackPanel } from "./FeedbackPanel";
import styles from "./FeedbackPanel.module.css";

const tile = (digit: TileModel["digit"], id: string): TileModel => ({
  id,
  digit,
  isNew: false,
});

const correct: RoundResult = {
  kind: "correct",
  submittedValue: 12,
  correctValue: 12,
  submittedTiles: [tile(1, "a"), tile(2, "b")],
  rewardTileIds: ["r1", "r2"],
};

const incorrect: RoundResult = {
  ...correct,
  kind: "incorrect",
  submittedValue: 21,
  rewardTileIds: [],
};

function renderPanel(
  result: RoundResult,
  rewardTiles: readonly TileModel[] = [],
  language: Language = "en",
) {
  return render(
    <I18nProvider initialLanguage={language}>
      <FeedbackPanel result={result} rewardTiles={rewardTiles} />
    </I18nProvider>,
  );
}

describe("FeedbackPanel", () => {
  it("states the outcome in words, not only in color", () => {
    renderPanel(incorrect);
    expect(screen.getByRole("status")).toHaveTextContent("Incorrect");
  });

  it("shows what was submitted and what was right on an incorrect answer", () => {
    renderPanel(incorrect);
    expect(screen.getByText("Your answer: 21")).toBeInTheDocument();
    expect(screen.getByText("Correct answer: 12")).toBeInTheDocument();
  });

  it("captions each reward tile, because unlabelled arrivals read as a restatement", () => {
    renderPanel(correct, [tile(4, "r1"), tile(7, "r2")]);
    expect(screen.getAllByText("New tile")).toHaveLength(2);
  });

  // On a correct answer the answer slots carry no accessible name (§95 —
  // `Tile`'s roleless form drops `label`), so the status region is the only
  // place the submitted value is stated.
  it("states the submitted value on a correct answer, in both locales", () => {
    renderPanel(correct, [tile(4, "r1"), tile(7, "r2")]);
    expect(screen.getByText("Your answer: 12")).toBeInTheDocument();

    renderPanel(correct, [tile(4, "r1"), tile(7, "r2")], "ko");
    expect(screen.getByText("제출한 답: 12")).toBeInTheDocument();
  });

  // The verdict's color comes from a class derived from the same `kind` the
  // headline is rendered from. A CSS Modules key that does not exist renders
  // `class="undefined"` and reports no error, so both halves are asserted: the
  // branch class is applied, and it resolved to a real value.
  it("carries a branch class rather than keying color off a sibling element", () => {
    const { unmount } = renderPanel(correct, [tile(4, "r1")]);
    const passed = screen.getByRole("status");
    expect(passed).toHaveClass(styles.correct);
    expect(passed.className).not.toMatch(/undefined/);
    unmount();

    renderPanel(incorrect);
    const failed = screen.getByRole("status");
    expect(failed).toHaveClass(styles.incorrect);
    expect(failed).not.toHaveClass(styles.correct);
    expect(failed.className).not.toMatch(/undefined/);
  });
});

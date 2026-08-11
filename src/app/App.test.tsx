import { StrictMode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../i18n/I18nContext";
import { LANGUAGE_STORAGE_KEY } from "../i18n/storage";
import type { Language } from "../game/types";
import type { ShareDependencies } from "../services/sharing";
import { sequenceRandom, sequentialIds } from "../test/fixtures";
import { App, type AppDependencies } from "./App";

// Mirrors the 45-entry unordered-pair pool generateEquation samples from
// (src/game/generators.ts: left 1..9, right left..9), so a test can address a
// specific equation by its operands instead of an opaque random fraction.
const EQUATION_POOL: Array<[number, number]> = [];
for (let left = 1; left <= 9; left++) {
  for (let right = left; right <= 9; right++) EQUATION_POOL.push([left, right]);
}

function equationSamples(left: number, right: number): [number, number, number] {
  const a = Math.min(left, right);
  const b = Math.max(left, right);
  const index = EQUATION_POOL.findIndex(([l, r]) => l === a && r === b);
  if (index === -1) throw new Error(`No pool entry for ${left}x${right}`);
  // 0.99 clears KIND_EQUATION_RATE, forcing the uniform draw so a test can
  // still name its equation by operands. Kind-bias behaviour is covered in
  // generators.test.ts instead.
  // 0.25 stays under the 0.5 reverse threshold, so the equation keeps the
  // pool's natural (a, b) order: equation.left === a, equation.right === b.
  return [0.99, index / EQUATION_POOL.length, 0.25];
}

function rewardSample(digit: number): number {
  return digit / 10;
}

function makeShareDependencies(): ShareDependencies {
  return { writeClipboard: vi.fn().mockResolvedValue(undefined) };
}

function renderApp(
  randomValues: number[],
  options: { initialLanguage?: Language; gameUrl?: string; strictMode?: boolean } = {},
) {
  const dependencies: AppDependencies = {
    random: sequenceRandom(...randomValues),
    nextTileId: sequentialIds(),
    gameUrl: options.gameUrl ?? "https://example.test/",
  };
  const shareDependencies = makeShareDependencies();
  const tree = (
    <I18nProvider initialLanguage={options.initialLanguage}>
      <App dependencies={dependencies} shareDependencies={shareDependencies} />
    </I18nProvider>
  );
  const utils = render(options.strictMode ? <StrictMode>{tree}</StrictMode> : tree);
  return { ...utils, dependencies, shareDependencies };
}

// GameHud and GameOverScreen both render <dt>label</dt><dd>value</dd> pairs;
// only one of those screens is ever mounted at a time, so the label text is
// unambiguous. Digit tiles show plain digit text, never these labels.
function hudField(label: string): string | null {
  return screen.getByText(label).nextElementSibling?.textContent ?? null;
}

// A five-round loss path: every submission below is deliberately incorrect,
// so score/rewards never grow rewards and inventory only ever shrinks. It
// drains the initial 10 tiles to exactly 1 (10-2-2-2-2-1), then the terminal
// 9x9 equation (2 slots) cannot be attempted with 1 tile.
const LOSS_ROUNDS: ReadonlyArray<{ pair: [number, number]; digits: number[] }> = [
  { pair: [2, 9], digits: [9, 8] }, // "98" != 18
  { pair: [3, 9], digits: [7, 6] }, // "76" != 27
  { pair: [4, 9], digits: [5, 4] }, // "54" != 36
  { pair: [5, 9], digits: [3, 2] }, // "32" != 45
  { pair: [1, 9], digits: [1] }, //    "1"  != 9
];
const TERMINAL_PAIR: [number, number] = [9, 9];

function lossRandomValues(): number[] {
  const values: number[] = [];
  for (const { pair } of LOSS_ROUNDS) values.push(...equationSamples(...pair));
  values.push(...equationSamples(...TERMINAL_PAIR));
  return values;
}

async function driveToGameOver(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Start Run" }));
  for (const { digits } of LOSS_ROUNDS) {
    for (const digit of digits) {
      await user.click(screen.getByRole("button", { name: `Digit ${digit}` }));
    }
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await user.click(screen.getByRole("button", { name: "Next Round" }));
  }
}

beforeEach(() => {
  localStorage.clear();
});

describe("App", () => {
  it("starts a run from the title screen and reaches round 1", async () => {
    const user = userEvent.setup();
    renderApp([...equationSamples(2, 3)], { initialLanguage: "en" });

    expect(screen.getByRole("heading", { name: "1-0" })).toBeVisible();
    expect(screen.queryByText(/×/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Start Run" }));

    expect(screen.getByText("2 × 3 =")).toBeInTheDocument();
    expect(hudField("Round")).toBe("1");
    expect(hudField("Score")).toBe("0");
    expect(screen.getAllByRole("button", { name: /^Digit \d$/ })).toHaveLength(10);
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
  });

  it("orders the HUD Round, Score, Streak so rounds survived reads as the headline stat", async () => {
    const user = userEvent.setup();
    renderApp([...equationSamples(2, 3)], { initialLanguage: "en" });

    await user.click(screen.getByRole("button", { name: "Start Run" }));

    const round = screen.getByText("Round");
    const score = screen.getByText("Score");
    const streak = screen.getByText("Streak");

    // DOCUMENT_POSITION_FOLLOWING (4) means the argument node comes after `this` node.
    expect(round.compareDocumentPosition(score) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(score.compareDocumentPosition(streak) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  // Regression guard for the `.primary` emphasis class actually winning the
  // cascade: `.entry dd` and `.primary` alone are NOT equal specificity
  // (0,1,1 vs 0,1,0), so `.entry dd` silently wins regardless of source
  // order and the emphasis never renders. Reading getComputedStyle catches
  // that class of bug; comparing className strings would not.
  it("renders Round's value at a larger computed font size than Score's", async () => {
    const user = userEvent.setup();
    renderApp([...equationSamples(2, 3)], { initialLanguage: "en" });

    await user.click(screen.getByRole("button", { name: "Start Run" }));

    const roundValue = screen.getByText("Round").nextElementSibling as HTMLElement;
    const scoreValue = screen.getByText("Score").nextElementSibling as HTMLElement;

    const roundFontSize = parseFloat(getComputedStyle(roundValue).fontSize);
    const scoreFontSize = parseFloat(getComputedStyle(scoreValue).fontSize);

    expect(roundFontSize).toBeGreaterThan(scoreFontSize);
  });

  it("resolves a correct answer through reward, overflow, exact discard, and Next Round", async () => {
    const user = userEvent.setup();
    const randomValues = [
      ...equationSamples(2, 3), // round 1: product 6, one answer slot
      rewardSample(0),
      rewardSample(1), // two reward tiles: digits 0 and 1
      ...equationSamples(4, 5), // round 2: product 20, two answer slots
    ];
    renderApp(randomValues, { initialLanguage: "en" });

    await user.click(screen.getByRole("button", { name: "Start Run" }));
    await user.click(screen.getByRole("button", { name: "Digit 6" }));
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(hudField("Score")).toBe("1");
    expect(hudField("Streak")).toBe("1");
    expect(screen.getByRole("status")).toHaveTextContent("Correct");
    expect(screen.getByText("Choose 1 tile(s) to discard.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirm Discard" })).not.toBeInTheDocument();

    // A forced single-tile excess collapses to one tap: marking an old
    // (non-reward) tile completes the discard immediately, no Confirm needed.
    await user.click(screen.getByRole("button", { name: "Digit 9" }));

    // Confirm's absence at requiredCount 1 doesn't by itself prove the discard
    // completed (it's also hidden while still overflowing at count 1), so
    // check the overflow instruction itself is gone: that only happens once
    // CONFIRM_DISCARD has actually advanced the phase past "overflow".
    expect(screen.queryByText("Choose 1 tile(s) to discard.")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Correct");
    expect(screen.getByRole("button", { name: "Digit 0, New tile" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Digit 1, New tile" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next Round" }));

    expect(screen.getByText("4 × 5 =")).toBeInTheDocument();
    expect(hudField("Round")).toBe("2");
    expect(screen.getAllByRole("button", { name: /^Digit \d$/ })).toHaveLength(10);
    expect(screen.queryByText("New tile")).not.toBeInTheDocument();

    // §1.16 / AGENTS.md: no game field ever enters storage, even after a full round.
    expect(localStorage.length).toBe(0);
  });

  it("grants no reward and resets the streak on an incorrect answer, then advances via Next Round", async () => {
    const user = userEvent.setup();
    const randomValues = [
      ...equationSamples(2, 3), // round 1: correct, to establish a streak worth resetting
      rewardSample(0),
      rewardSample(1),
      ...equationSamples(4, 5), // round 2: incorrect
      ...equationSamples(1, 2), // round 3, reached via Next Round
    ];
    renderApp(randomValues, { initialLanguage: "en" });

    await user.click(screen.getByRole("button", { name: "Start Run" }));
    await user.click(screen.getByRole("button", { name: "Digit 6" }));
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await user.click(screen.getByRole("button", { name: "Digit 9" })); // completes the forced single discard
    await user.click(screen.getByRole("button", { name: "Next Round" }));

    expect(hudField("Streak")).toBe("1");

    // Round 2: "4 x 5 = 20"; deliberately submit "87" instead.
    await user.click(screen.getByRole("button", { name: "Digit 8" }));
    await user.click(screen.getByRole("button", { name: "Digit 7" }));
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(screen.getByRole("status")).toHaveTextContent("Incorrect");
    expect(screen.getByText("Your answer: 87")).toBeInTheDocument();
    expect(screen.getByText("Correct answer: 20")).toBeInTheDocument();
    expect(hudField("Score")).toBe("1"); // unchanged: no reward for an incorrect answer
    expect(hudField("Streak")).toBe("0"); // reset
    expect(hudField("Round")).toBe("2"); // feedback: round === totalRounds

    await user.click(screen.getByRole("button", { name: "Next Round" }));

    expect(screen.getByText("1 × 2 =")).toBeInTheDocument();
    expect(hudField("Round")).toBe("3");
  });

  it("reaches game over when the next equation exceeds the surviving inventory, keeping the terminal equation visible", async () => {
    const user = userEvent.setup();
    renderApp(lossRandomValues(), { initialLanguage: "en" });

    await driveToGameOver(user);

    expect(screen.getByRole("heading", { name: "Game Over" })).toBeInTheDocument();
    expect(screen.getByText("9 × 9 =")).toBeInTheDocument(); // terminal equation stays visible (§1.10)
    // §1.8 keeps the equation to explain the loss, so the explanation has to be
    // on screen too. Without it the equation reads as an unanswered prompt.
    expect(screen.getByText("Not enough tiles left to answer.")).toBeInTheDocument();
    expect(hudField("Score")).toBe("0"); // every submission above was incorrect
    expect(hudField("Rounds played")).toBe("5");
    expect(hudField("Longest streak")).toBe("0");
    expect(screen.getByRole("button", { name: "Play Again" })).toBeInTheDocument();
  });

  it("starts a fresh run at round 1 with reset inventory and statistics via Play Again", async () => {
    const user = userEvent.setup();
    const randomValues = [...lossRandomValues(), ...equationSamples(2, 3)]; // +1 equation for the restarted run
    renderApp(randomValues, { initialLanguage: "en" });

    await driveToGameOver(user);
    await user.click(screen.getByRole("button", { name: "Play Again" }));

    expect(screen.getByText("2 × 3 =")).toBeInTheDocument();
    expect(hudField("Round")).toBe("1");
    expect(hudField("Score")).toBe("0");
    expect(hudField("Streak")).toBe("0");
    expect(screen.getAllByRole("button", { name: /^Digit \d$/ })).toHaveLength(10);
  });

  it("restarts via Enter on the game over screen, even when a non-Play-Again button has focus", async () => {
    const user = userEvent.setup();
    // Exactly 18 (driveToGameOver) + 3 (the restart draw) = 21 values, rendered
    // under Strict Mode: a doubled handleRestart would consume 3 extra samples
    // and sequenceRandom would throw "Random sequence exhausted" rather than
    // silently passing.
    const randomValues = [...lossRandomValues(), ...equationSamples(2, 3)];
    const { shareDependencies } = renderApp(randomValues, {
      initialLanguage: "en",
      strictMode: true,
    });

    await driveToGameOver(user);
    screen.getByRole("button", { name: "Share" }).focus();

    await user.keyboard("{Enter}");

    expect(screen.getByText("2 × 3 =")).toBeInTheDocument();
    expect(hudField("Round")).toBe("1");
    expect(shareDependencies.writeClipboard).not.toHaveBeenCalled();
  });

  it("changes language mid-answering immediately, without resetting the run", async () => {
    const user = userEvent.setup();
    renderApp([...equationSamples(2, 3)], { initialLanguage: "en" });

    await user.click(screen.getByRole("button", { name: "Start Run" }));
    await user.click(screen.getByRole("button", { name: "Digit 6" })); // fills the single answer slot

    const submitButtonEn = screen.getByRole("button", { name: "Submit" });
    expect(submitButtonEn).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "한국어" }));

    // Copy switches live; the run itself (equation, HUD, selection) is untouched.
    expect(screen.getByText("2 × 3 =")).toBeInTheDocument();
    expect(hudField("라운드")).toBe("1");
    const submitButtonKo = screen.getByRole("button", { name: "제출" });
    expect(submitButtonKo).toBe(submitButtonEn); // same node: not remounted
    expect(submitButtonKo).toBeEnabled(); // selection survived: still ready to submit
  });

  it("returns to the title phase on a fresh mount while the saved language persists", async () => {
    const user = userEvent.setup();
    const first = renderApp([...equationSamples(2, 3)]); // no forced language: reads storage like production

    await user.click(screen.getByRole("button", { name: "Start Run" }));
    await user.click(screen.getByRole("button", { name: "한국어" }));
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("ko");

    first.unmount(); // simulates a page reload discarding all in-memory state

    renderApp([]); // fresh mount: I18nProvider re-reads storage; App starts a new reducer

    expect(screen.getByRole("heading", { name: "1-0" })).toBeInTheDocument(); // back to title
    expect(screen.getByRole("button", { name: "게임 시작" })).toBeInTheDocument(); // language persisted
  });

  it("does not consume extra random samples under React.StrictMode across start, submit, discard, and next round", async () => {
    const user = userEvent.setup();
    const scriptedValues = [
      ...equationSamples(2, 3), // round 1 equation
      rewardSample(0),
      rewardSample(1), // reward tiles for the correct submission
      ...equationSamples(4, 5), // round 2 equation
    ];
    let calls = 0;
    const random = () => {
      const value = scriptedValues[calls];
      if (value === undefined) throw new Error("Random sequence exhausted");
      calls += 1;
      return value;
    };
    const dependencies: AppDependencies = {
      random,
      nextTileId: sequentialIds(),
      gameUrl: "https://example.test/",
    };

    render(
      <StrictMode>
        <I18nProvider initialLanguage="en">
          <App dependencies={dependencies} shareDependencies={makeShareDependencies()} />
        </I18nProvider>
      </StrictMode>,
    );

    expect(calls).toBe(0); // mounting/rendering the title screen consumes nothing

    await user.click(screen.getByRole("button", { name: "Start Run" }));
    expect(calls).toBe(3); // START_RUN: one equation draw (gate + pair + order), not doubled by Strict Mode

    await user.click(screen.getByRole("button", { name: "Digit 6" }));
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(calls).toBe(5); // SUBMIT_CORRECT: two reward tiles

    await user.click(screen.getByRole("button", { name: "Digit 9" })); // completes the forced single discard
    expect(calls).toBe(5); // CONFIRM_DISCARD draws no randomness

    await user.click(screen.getByRole("button", { name: "Next Round" }));
    expect(calls).toBe(8); // NEXT_ROUND: one more equation draw (gate + pair + order)
  });
});

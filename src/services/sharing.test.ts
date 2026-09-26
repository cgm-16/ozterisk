import { describe, expect, it, vi } from "vitest";
import { CLASSIC_FLOOR, CLASSIC_SEAL_EVERY, CLASSIC_START_CAPACITY } from "../game/balance";
import { makeEquation, makeGameOverState } from "../test/fixtures";
import { copyResult, formatShareText, getShareStats, shareResult } from "./sharing";
import type { ShareDependencies, ShareStats } from "./sharing";

describe("getShareStats", () => {
  const atFloor = (CLASSIC_START_CAPACITY - CLASSIC_FLOOR) * CLASSIC_SEAL_EVERY;

  it("reports a Classic run at the floor with tiles in hand as won", () => {
    const state = makeGameOverState(makeEquation(3, 3), { mode: "classic", totalRounds: atFloor });
    expect(getShareStats(state)).toEqual({
      mode: "classic",
      won: true,
      score: 7,
      totalRounds: atFloor,
      longestStreak: 4,
    });
  });

  it("never reports an Endless run as won", () => {
    const state = makeGameOverState(makeEquation(3, 3), { mode: "endless", totalRounds: atFloor });
    expect(getShareStats(state).won).toBe(false);
  });

  it("does not let an Endless run be typed as won", () => {
    // @ts-expect-error — only Classic can win (§1.8).
    const endlessWin: ShareStats = { mode: "endless", won: true, score: 0, totalRounds: 0, longestStreak: 0 };
    expect(endlessWin.mode).toBe("endless");
  });
});

describe("formatShareText", () => {
  // §1.15: Classic prefixes the first line with the mode and outcome, and
  // keeps every other line of the Endless format.
  it.each([
    ["en", true, "ozterisk Classic — Run Complete — Rounds: 28\nScore: 7\nLongest streak: 4\n\nCan you beat it?\nhttps://example.test/"],
    ["en", false, "ozterisk Classic — Game Over — Rounds: 28\nScore: 7\nLongest streak: 4\n\nCan you beat it?\nhttps://example.test/"],
    ["ko", true, "ozterisk 클래식 — 완주 — 라운드: 28\n점수: 7\n최장 연속 정답: 4\n\n이 기록을 넘을 수 있나요?\nhttps://example.test/"],
    ["ko", false, "ozterisk 클래식 — 게임 종료 — 라운드: 28\n점수: 7\n최장 연속 정답: 4\n\n이 기록을 넘을 수 있나요?\nhttps://example.test/"],
  ] as const)("formats a Classic run in %s, won %s, exactly", (language, won, expected) => {
    const text = formatShareText(
      { mode: "classic", won, score: 7, totalRounds: 28, longestStreak: 4 },
      language,
      "https://example.test/",
    );
    expect(text).toBe(expected);
  });

  it("formats the English share text exactly", () => {
    const text = formatShareText(
      { mode: "endless", won: false, score: 7, totalRounds: 12, longestStreak: 4 },
      "en",
      "https://example.test/",
    );

    expect(text).toBe(
      "ozterisk — Rounds: 12\nScore: 7\nLongest streak: 4\n\nCan you beat it?\nhttps://example.test/",
    );

    const lines = text.split("\n");
    expect(lines).toHaveLength(6);
    expect(lines[3]).toBe("");
    expect(lines[5]).toBe("https://example.test/");
  });

  it("formats the Korean share text exactly", () => {
    const text = formatShareText(
      { mode: "endless", won: false, score: 7, totalRounds: 12, longestStreak: 4 },
      "ko",
      "https://example.test/",
    );

    expect(text).toBe(
      "ozterisk — 라운드: 12\n점수: 7\n최장 연속 정답: 4\n\n이 기록을 넘을 수 있나요?\nhttps://example.test/",
    );

    const lines = text.split("\n");
    expect(lines).toHaveLength(6);
    expect(lines[3]).toBe("");
    expect(lines[5]).toBe("https://example.test/");
  });
});

describe("shareResult", () => {
  const text = "ozterisk — Rounds: 9\nScore: 7\nLongest streak: 4\n\nCan you beat it?\nhttps://example.test/";
  const url = "https://example.test/";

  it("shares natively when available and never touches the clipboard", async () => {
    const nativeShare = vi.fn().mockResolvedValue(undefined);
    const writeClipboard = vi.fn().mockResolvedValue(undefined);
    const dependencies: ShareDependencies = { nativeShare, writeClipboard };

    const outcome = await shareResult(text, url, dependencies);

    expect(outcome).toBe("shared");
    expect(nativeShare).toHaveBeenCalledTimes(1);
    expect(nativeShare).toHaveBeenCalledWith({ text, url });
    expect(writeClipboard).not.toHaveBeenCalled();
  });

  it("falls back to the clipboard when native sharing is unavailable", async () => {
    const writeClipboard = vi.fn().mockResolvedValue(undefined);
    const dependencies: ShareDependencies = { writeClipboard };

    const outcome = await shareResult(text, url, dependencies);

    expect(outcome).toBe("copied");
    expect(writeClipboard).toHaveBeenCalledTimes(1);
    expect(writeClipboard).toHaveBeenCalledWith(text);
  });

  it("reports failure when native sharing rejects, without an implicit clipboard call", async () => {
    const nativeShare = vi.fn().mockRejectedValue(new Error("cancelled"));
    const writeClipboard = vi.fn().mockResolvedValue(undefined);
    const dependencies: ShareDependencies = { nativeShare, writeClipboard };

    const outcome = await shareResult(text, url, dependencies);

    expect(outcome).toBe("failed");
    expect(writeClipboard).not.toHaveBeenCalled();
  });

  it("reports failure when the clipboard fallback also rejects", async () => {
    const writeClipboard = vi.fn().mockRejectedValue(new Error("denied"));
    const dependencies: ShareDependencies = { writeClipboard };

    const outcome = await shareResult(text, url, dependencies);

    expect(outcome).toBe("failed");
  });
});

describe("copyResult", () => {
  const text = "ozterisk — Rounds: 9\nScore: 7\nLongest streak: 4\n\nCan you beat it?\nhttps://example.test/";

  it("resolves to copied when the clipboard write succeeds", async () => {
    const writeClipboard = vi.fn().mockResolvedValue(undefined);

    const outcome = await copyResult(text, { writeClipboard });

    expect(outcome).toBe("copied");
    expect(writeClipboard).toHaveBeenCalledWith(text);
  });

  it("resolves to failed when the clipboard write rejects", async () => {
    const writeClipboard = vi.fn().mockRejectedValue(new Error("denied"));

    const outcome = await copyResult(text, { writeClipboard });

    expect(outcome).toBe("failed");
  });
});

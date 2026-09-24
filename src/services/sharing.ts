import type { GameMode, Language } from "../game/types";

export interface ShareStats {
  mode: GameMode;
  /** A Classic run that reached the floor. Always false in Endless. */
  won: boolean;
  score: number;
  totalRounds: number;
  longestStreak: number;
}

// §1.15: Classic names its mode and outcome ahead of the rounds; Endless's
// first line is unchanged.
function shareHeading(stats: ShareStats, language: Language): string {
  if (stats.mode === "endless") return "ozterisk";
  if (language === "ko") return `ozterisk 클래식 — ${stats.won ? "완주" : "게임 종료"}`;
  return `ozterisk Classic — ${stats.won ? "Run Complete" : "Game Over"}`;
}

export function formatShareText(stats: ShareStats, language: Language, url: string): string {
  const heading = shareHeading(stats, language);
  if (language === "ko") {
    return `${heading} — 라운드: ${stats.totalRounds}\n점수: ${stats.score}\n최장 연속 정답: ${stats.longestStreak}\n\n이 기록을 넘을 수 있나요?\n${url}`;
  }
  return `${heading} — Rounds: ${stats.totalRounds}\nScore: ${stats.score}\nLongest streak: ${stats.longestStreak}\n\nCan you beat it?\n${url}`;
}

export interface ShareDependencies {
  nativeShare?: (data: ShareData) => Promise<void>;
  writeClipboard: (text: string) => Promise<void>;
}

export type ShareOutcome = "shared" | "copied" | "failed";

export async function shareResult(
  text: string,
  url: string,
  dependencies: ShareDependencies,
): Promise<ShareOutcome> {
  if (dependencies.nativeShare) {
    try {
      await dependencies.nativeShare({ text, url });
      return "shared";
    } catch {
      return "failed";
    }
  }
  return copyResult(text, dependencies);
}

export async function copyResult(
  text: string,
  dependencies: Pick<ShareDependencies, "writeClipboard">,
): Promise<ShareOutcome> {
  try {
    await dependencies.writeClipboard(text);
    return "copied";
  } catch {
    return "failed";
  }
}

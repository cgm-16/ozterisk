import type { Language } from "../game/types";

export interface ShareStats {
  score: number;
  totalRounds: number;
  longestStreak: number;
}

export function formatShareText(stats: ShareStats, language: Language, url: string): string {
  if (language === "ko") {
    return `1-0 — 점수: ${stats.score}\n라운드: ${stats.totalRounds}\n최장 연속 정답: ${stats.longestStreak}\n\n이 기록을 넘을 수 있나요?\n${url}`;
  }
  return `1-0 — Score: ${stats.score}\nRounds: ${stats.totalRounds}\nLongest streak: ${stats.longestStreak}\n\nCan you beat it?\n${url}`;
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

import { isClassicWin } from "../game/selectors";
import type { GameState, Language } from "../game/types";
import { messages } from "../i18n/messages";

export type ShareStats = {
  score: number;
  totalRounds: number;
  longestStreak: number;
} & (
  | { mode: "endless"; won: false }
  /** `won`: a Classic run that reached the floor with tiles in hand. */
  | { mode: "classic"; won: boolean }
);

/** The statistics a finished run shows and shares. */
export function getShareStats(state: GameState): ShareStats {
  const figures = { score: state.score, totalRounds: state.totalRounds, longestStreak: state.longestStreak };
  return state.mode === "classic"
    ? { mode: "classic", won: isClassicWin(state), ...figures }
    : { mode: "endless", won: false, ...figures };
}

// §1.15: Classic names its mode and outcome ahead of the rounds; Endless's
// first line is unchanged. The words are the dictionary's, so the shared text
// and the screen cannot drift apart.
function shareHeading(stats: ShareStats, language: Language): string {
  if (stats.mode === "endless") return "ozterisk";
  const { mode, gameOver } = messages[language];
  return `ozterisk ${mode.classic} — ${stats.won ? gameOver.winTitle : gameOver.title}`;
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

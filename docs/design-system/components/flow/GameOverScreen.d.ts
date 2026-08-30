export interface ShareStats {
  score: number;
  totalRounds: number;
  longestStreak: number;
}

/**
 * End of run. Loss is arithmetic, and the copy says so.
 *
 * @startingPoint section="Flow" subtitle="Final stats, share, chop stamp" viewport="900x520"
 */
export interface GameOverScreenProps {
  stats: ShareStats;
  onPlayAgain?: () => void;
  onShare?: () => void;
  onCopy?: () => void;
  /** True after a successful copy — stamps the vermilion chop for --dur-share. */
  copied?: boolean;
  /** Localised strings. */
  labels?: Partial<Record<
    "title" | "reason" | "rounds" | "longestStreak" | "playAgain" | "share" | "copy" | "copiedNotice",
    string
  >>;
}

export declare function GameOverScreen(props: GameOverScreenProps): JSX.Element;

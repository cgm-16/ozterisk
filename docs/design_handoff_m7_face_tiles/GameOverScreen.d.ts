export interface ShareStats {
  /** Default "endless". */
  mode?: "endless" | "classic";
  /** A Classic run that reached the floor. Always false in Endless. */
  won?: boolean;
  score: number;
  totalRounds: number;
  longestStreak: number;
}

/**
 * End of run. Loss is arithmetic, and the copy says so. A loss keeps the
 * terminal equation on screen and a vermilion verdict; a Classic win shows its
 * final hand in the floor's sockets and a gold Run Complete.
 *
 * @startingPoint section="Flow" subtitle="Final stats, share, chop stamp" viewport="900x520"
 */
export interface GameOverScreenProps {
  stats: ShareStats;
  /** The equation that ended the run. Omitted on a win. */
  equation?: { left: number; right: number; product: number };
  /** Classic win: digits still held at the floor, ascending. */
  hand?: readonly number[];
  /** Classic win: sockets at the floor. Default 6. */
  floor?: number;
  onPlayAgain?: () => void;
  onShare?: () => void;
  onCopy?: () => void;
  /** True after a successful copy — stamps the vermilion chop for --dur-share. */
  copied?: boolean;
  /** Localised strings. */
  labels?: Partial<Record<
    "title" | "reason" | "winTitle" | "winReason" | "rounds" | "score" | "longestStreak" | "restartHint" | "playAgain" | "share" | "copy" | "copiedNotice" | "finalHand",
    string
  >>;
}

export declare function GameOverScreen(props: GameOverScreenProps): JSX.Element;

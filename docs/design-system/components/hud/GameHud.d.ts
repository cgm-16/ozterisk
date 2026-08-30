/**
 * The run's read-out: round, score, streak — in that order, always.
 *
 * @startingPoint section="HUD" subtitle="Round, score, streak" viewport="700x150"
 */
export interface GameHudProps {
  /** Correct submissions this run. */
  score: number;
  /** Consecutive correct answers. Renders gold above zero. */
  currentStreak: number;
  /** Ordinal of the equation on screen. */
  round: number;
  /** Localised labels. Title Case in source, uppercased by CSS. */
  labels?: { score: string; streak: string; round: string };
}

export declare function GameHud(props: GameHudProps): JSX.Element;

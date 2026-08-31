export interface Equation {
  left: number;
  right: number;
  /** left * right. 1-81, so an answer has exactly one or two digits. */
  product: number;
}

/**
 * The equation display. One equation on screen at a time.
 *
 * @startingPoint section="Game" subtitle="The round's equation, 68px serif" viewport="700x160"
 */
export interface EquationBoardProps {
  /** Null renders nothing (pre-run). */
  equation: Equation | null;
  /** Reveal the product. True only after submission. */
  showProduct?: boolean;
}

export declare function EquationBoard(props: EquationBoardProps): JSX.Element | null;

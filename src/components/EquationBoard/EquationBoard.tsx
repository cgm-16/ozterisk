import type { Equation } from "../../game/types";
import styles from "./EquationBoard.module.css";

export interface EquationBoardProps {
  equation: Equation;
}

export function EquationBoard({ equation }: EquationBoardProps) {
  return (
    // Keyed by the equation itself, which is what makes 10b fire once per
    // round: EquationBoard stays mounted across a round change, and only a
    // fresh element restarts a CSS animation. React reconciles a single child
    // by key as well as by type, so a changed key remounts the <p> and an
    // unchanged one keeps it — a re-render that brought the same equation must
    // not replay the rise.
    // Ceiling: generateEquation draws uniformly and never rejects a repeat, so
    // a round that happens to redraw the previous pair keeps this key and does
    // not rise. The honest key is the round number, which this component is not
    // given; issue that prop from GameScreen if the miss is worth closing.
    <p key={`${equation.left}x${equation.right}`} className={styles.equation}>
      {equation.left} × {equation.right} =
    </p>
  );
}

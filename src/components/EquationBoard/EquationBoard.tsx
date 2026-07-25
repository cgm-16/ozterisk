import type { Equation } from "../../game/types";
import styles from "./EquationBoard.module.css";

export interface EquationBoardProps {
  equation: Equation;
}

export function EquationBoard({ equation }: EquationBoardProps) {
  return (
    <p className={styles.equation}>
      {equation.left} × {equation.right} =
    </p>
  );
}

import { useState } from "react";
import type { Equation } from "../../game/types";
import styles from "./EquationBoard.module.css";

export interface EquationBoardProps {
  equation: Equation;
}

export function EquationBoard({ equation }: EquationBoardProps) {
  // 10b fires once per arriving equation, and only a fresh element restarts a
  // CSS animation — EquationBoard stays mounted across a round change, so the
  // rise has to come from a key that changes when the equation does.
  //
  // What "changes" means here is object identity, not the pair of digits.
  // generateEquation draws uniformly from 45 pairs and never rejects a repeat,
  // so a key built from left and right misses every round that redraws the
  // previous pair — reachable, not theoretical, and it fails by staying still,
  // which is the one way a motion defect looks exactly like correct rest.
  // The reducer holds one equation object per round, so identity is the round.
  //
  // Counted during render rather than in an effect: the remount then lands in
  // the same commit as the new equation, leaving no frame where the old one is
  // still on screen.
  const [arrivals, setArrivals] = useState({ equation, count: 0 });
  if (arrivals.equation !== equation) {
    setArrivals({ equation, count: arrivals.count + 1 });
  }

  return (
    <p key={arrivals.count} className={styles.equation}>
      {equation.left} × {equation.right} =
    </p>
  );
}

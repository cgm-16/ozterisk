import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Equation } from "../../game/types";
import { EquationBoard } from "./EquationBoard";

const equation = (left: number, right: number): Equation => ({
  left,
  right,
  product: left * right,
});

describe("EquationBoard", () => {
  it("renders the factors and the equals sign, never the product", () => {
    render(<EquationBoard equation={equation(2, 3)} />);
    expect(screen.getByText("2 × 3 =")).toBeInTheDocument();
    expect(screen.queryByText(/6/)).not.toBeInTheDocument();
  });
});

/* 10b. What jsdom can decide is which element carries the rise and whether a
   round change produces a fresh element to play it on; that it ran, and how it
   looked, are measured in a browser instead. */
describe("EquationBoard motion", () => {
  it("carries the round rise", () => {
    render(<EquationBoard equation={equation(2, 3)} />);
    expect(getComputedStyle(screen.getByText("2 × 3 =")).animationName).toBe("oz-round-rise");
  });

  it("replaces its node when the round's equation changes, so the rise plays again", () => {
    const { rerender } = render(<EquationBoard equation={equation(2, 3)} />);
    const first = screen.getByText("2 × 3 =");
    rerender(<EquationBoard equation={equation(4, 5)} />);
    expect(screen.getByText("4 × 5 =")).not.toBe(first);
  });

  it("keeps its node when the same equation re-renders, so the rise does not replay", () => {
    const { rerender } = render(<EquationBoard equation={equation(2, 3)} />);
    const first = screen.getByText("2 × 3 =");
    rerender(<EquationBoard equation={equation(2, 3)} />);
    expect(screen.getByText("2 × 3 =")).toBe(first);
  });
});

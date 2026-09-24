import { describe, expect, it } from "vitest";
import {
  CLASSIC_FLOOR,
  CLASSIC_SEAL_EVERY,
  CLASSIC_START_CAPACITY,
  INVENTORY_CAPACITY,
  KIND_EQUATION_RATE,
  REWARD_BONUS,
} from "./balance";
import {
  averageMissCost,
  buildableRateCliff,
  projectBiasedRate,
  projectBuildableRate,
  projectDrift,
} from "../test/economy";

// The model assumes a uniformly-composed hand. A player who discards to
// maximise digit coverage does better than uniform, so the true rate sits
// somewhat above the projection and the real margin is thinner than this.
const CLIFF_MARGIN = 0.02;

function report(): string {
  const base = projectBuildableRate(INVENTORY_CAPACITY);
  const biased = projectBiasedRate(base, KIND_EQUATION_RATE);
  const cliff = buildableRateCliff();
  return [
    `capacity           ${INVENTORY_CAPACITY}`,
    `reward bonus       +${REWARD_BONUS}`,
    `kind rate          ${KIND_EQUATION_RATE}`,
    `base buildable b   ${base.toFixed(4)}`,
    `biased buildable b ${biased.toFixed(4)}`,
    `cliff b*           ${cliff.toFixed(4)}`,
    `margin             ${(cliff - biased).toFixed(4)} (need > ${CLIFF_MARGIN})`,
    `drift/round        ${projectDrift(biased).toFixed(4)} (need < 0)`,
  ].join("\n");
}

describe("economy invariant", () => {
  it("keeps runs finite: expected drift per round is negative", () => {
    const base = projectBuildableRate(INVENTORY_CAPACITY);
    const biased = projectBiasedRate(base, KIND_EQUATION_RATE);
    expect(projectDrift(biased), report()).toBeLessThan(0);
  });

  it("keeps a safety margin under the cliff where drift would flip positive", () => {
    const base = projectBuildableRate(INVENTORY_CAPACITY);
    const biased = projectBiasedRate(base, KIND_EQUATION_RATE);
    expect(buildableRateCliff() - biased, report()).toBeGreaterThan(CLIFF_MARGIN);
  });

  // Pins the model itself: a silent bug here would weaken the guard above
  // invisibly, since both assertions read through these functions.
  it("pins the economy model's own numbers", () => {
    expect(projectBuildableRate(10)).toBeCloseTo(0.4797, 4);
    expect(averageMissCost()).toBeCloseTo(1.7111, 4);
    expect(buildableRateCliff()).toBeCloseTo(0.6311, 4);
  });
});

// Classic is meant to cross the cliff: it opens where runs would never end and
// closes where they must. The descent, not a margin, is what ends the run.
describe("Classic economy invariant", () => {
  const biasedAt = (capacity: number) =>
    projectBiasedRate(projectBuildableRate(capacity), KIND_EQUATION_RATE);

  it("opens above the cliff, so the tray starts generous", () => {
    expect(biasedAt(CLASSIC_START_CAPACITY)).toBeGreaterThan(buildableRateCliff());
  });

  it("closes below the cliff by at least the margin, so the descent ends runs", () => {
    expect(buildableRateCliff() - biasedAt(CLASSIC_FLOOR)).toBeGreaterThan(CLIFF_MARGIN);
  });

  it("keeps the schedule well-formed", () => {
    // The floor must still hold the longest answer (two digits), and the start
    // must hold a full round-robin deal of every digit.
    expect(CLASSIC_START_CAPACITY).toBeGreaterThan(CLASSIC_FLOOR);
    expect(CLASSIC_FLOOR).toBeGreaterThanOrEqual(2);
    expect(CLASSIC_START_CAPACITY).toBeGreaterThanOrEqual(10);
    expect(Number.isInteger(CLASSIC_SEAL_EVERY) && CLASSIC_SEAL_EVERY >= 1).toBe(true);
  });
});


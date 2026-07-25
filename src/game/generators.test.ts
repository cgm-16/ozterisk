import { describe, expect, it } from "vitest";
import { generateEquation, generateRewardTiles } from "./generators";
import { sequenceRandom, sequentialIds } from "../test/fixtures";

describe("generateEquation", () => {
  it("makes all 45 unordered pairs addressable exactly once", () => {
    const pairs = Array.from({ length: 45 }, (_, index) => {
      const random = sequenceRandom(index / 45, 0);
      const equation = generateEquation(random);
      return `${Math.min(equation.left, equation.right)}-${Math.max(equation.left, equation.right)}`;
    });
    expect(new Set(pairs).size).toBe(45);
    expect(pairs).toContain("1-1");
    expect(pairs).toContain("9-9");
  });

  it("randomizes display order without changing product", () => {
    const forward = generateEquation(sequenceRandom(2 / 45, 0.1));
    const reversed = generateEquation(sequenceRandom(2 / 45, 0.9));
    expect([forward.left, forward.right]).toEqual([1, 3]);
    expect([reversed.left, reversed.right]).toEqual([3, 1]);
    expect(forward.product).toBe(reversed.product);
  });

  it("consumes exactly two random samples: pair index then display order", () => {
    let calls = 0;
    const random = () => {
      calls += 1;
      return calls === 1 ? 2 / 45 : 0.1;
    };
    generateEquation(random);
    expect(calls).toBe(2);
  });

  it("throws RangeError when the pair-index sample is out of [0, 1)", () => {
    expect(() => generateEquation(sequenceRandom(1, 0))).toThrow(RangeError);
    expect(() => generateEquation(sequenceRandom(-0.1, 0))).toThrow(RangeError);
  });

  it("throws RangeError when the display-order sample is out of [0, 1)", () => {
    expect(() => generateEquation(sequenceRandom(0, 1))).toThrow(RangeError);
    expect(() => generateEquation(sequenceRandom(0, -0.1))).toThrow(RangeError);
  });

  it("maps the largest representable value below 1 to the last pair (9-9), not an out-of-range index", () => {
    const largestBelowOne = 0.9999999999999999;
    const equation = generateEquation(sequenceRandom(largestBelowOne, 0));
    expect([equation.left, equation.right]).toEqual([9, 9]);
  });
});

describe("generateRewardTiles", () => {
  it.each([
    [0, 0],
    [0.099999, 0],
    [0.1, 1],
    [0.999999, 9],
  ])("maps random value %s to digit %s", (value, digit) => {
    const [tile] = generateRewardTiles(1, () => value, sequentialIds());
    expect(tile).toMatchObject({ digit, isNew: true });
  });

  it("consumes exactly count random samples and count IDs", () => {
    let randomCalls = 0;
    let idCalls = 0;
    const random = () => {
      randomCalls += 1;
      return 0.5;
    };
    const idFactory = () => {
      idCalls += 1;
      return `tile-${idCalls}`;
    };
    const tiles = generateRewardTiles(3, random, idFactory);
    expect(tiles).toHaveLength(3);
    expect(randomCalls).toBe(3);
    expect(idCalls).toBe(3);
  });

  it("returns an empty array and consumes nothing when count is 0", () => {
    let randomCalls = 0;
    let idCalls = 0;
    const tiles = generateRewardTiles(
      0,
      () => {
        randomCalls += 1;
        return 0.5;
      },
      () => {
        idCalls += 1;
        return "tile";
      },
    );
    expect(tiles).toEqual([]);
    expect(randomCalls).toBe(0);
    expect(idCalls).toBe(0);
  });

  it("throws RangeError for a negative count", () => {
    expect(() => generateRewardTiles(-1, () => 0.5, sequentialIds())).toThrow(RangeError);
  });

  it("throws RangeError for a non-integer count", () => {
    expect(() => generateRewardTiles(1.5, () => 0.5, sequentialIds())).toThrow(RangeError);
  });

  it("throws RangeError when a reward sample is out of [0, 1)", () => {
    expect(() => generateRewardTiles(1, () => 1, sequentialIds())).toThrow(RangeError);
    expect(() => generateRewardTiles(1, () => -0.1, sequentialIds())).toThrow(RangeError);
  });
});

import { cleanup, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { INVENTORY_CAPACITY } from "../game/balance";
import { I18nProvider } from "../i18n/I18nContext";
import { GALLERY_STATES } from "./states";

describe("gallery catalogue", () => {
  it("declares at least one entry for every game phase", () => {
    for (const [phase, entries] of Object.entries(GALLERY_STATES)) {
      expect(entries, `no gallery entry covers the ${phase} phase`).not.toHaveLength(0);
    }
  });

  it("gives every entry a unique id", () => {
    const ids = Object.values(GALLERY_STATES).flat().map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // SELECT_TILE moves a tile out of inventory into an answer slot; it never
  // adds one. So the live tile count (inventory buttons + filled answer-slot
  // buttons) must stay at INVENTORY_CAPACITY once every slot is filled, not
  // grow past it the way an additively hand-assembled selection would.
  it("conserves tile count in answering-full: inventory plus filled slots equals INVENTORY_CAPACITY", () => {
    const entry = GALLERY_STATES.answering.find((candidate) => candidate.id === "answering-full");
    if (entry === undefined) throw new Error("answering-full entry not found");
    render(<I18nProvider initialLanguage="en">{entry.render()}</I18nProvider>);

    const inventoryTiles = screen.getAllByRole("button", { name: /^Digit \d$/ });
    const filledSlots = screen.getAllByRole("button", { name: /^Answer slot \d: \d$/ });
    expect(inventoryTiles.length + filledSlots.length).toBe(INVENTORY_CAPACITY);
  });

  // makeOverflowInventory (src/test/fixtures.ts) is shared with the rest of
  // the suite, so a future change to its id format or size handling could
  // make rewardTileIds.includes(tile.id) match nothing inside
  // makeOverflowInventoryWithRewards (states.tsx), silently dropping every
  // tray New-tile badge while the render-without-throwing test below stays
  // green. Expected counts are named here rather than derived from
  // states.tsx, so a break in the stamping logic can't also break the value
  // this test compares against.
  const OVERFLOW_ENTRY_REWARD_COUNTS: Record<string, number> = {
    "overflow-required-1": 2,
    "overflow-required-2": 3,
  };

  it("badges exactly as many overflow-tray tiles New as each entry's reward count", () => {
    for (const entry of GALLERY_STATES.overflow) {
      const expectedCount = OVERFLOW_ENTRY_REWARD_COUNTS[entry.id];
      if (expectedCount === undefined) {
        throw new Error(`no expected reward count recorded for gallery entry "${entry.id}"`);
      }

      render(<I18nProvider initialLanguage="en">{entry.render()}</I18nProvider>);
      const badgedTiles = screen.getAllByRole("button", { name: /New tile$/ });
      expect(badgedTiles, `expected ${expectedCount} New-badged tray tiles for ${entry.id}`).toHaveLength(
        expectedCount,
      );
      cleanup();
    }
  });

  // Every entry must render in both languages (not just en): a translation
  // path that only a Korean render exercises is exactly the kind of bug this
  // gallery exists to surface, so a test that only tried en would not fail
  // when that bug is present.
  it("renders every entry without throwing, in both languages", () => {
    for (const language of ["en", "ko"] as const) {
      for (const entry of Object.values(GALLERY_STATES).flat()) {
        expect(() =>
          render(<I18nProvider initialLanguage={language}>{entry.render()}</I18nProvider>),
        ).not.toThrow();
        cleanup();
      }
    }
  });
});

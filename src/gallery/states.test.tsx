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

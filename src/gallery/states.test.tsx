import { cleanup, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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

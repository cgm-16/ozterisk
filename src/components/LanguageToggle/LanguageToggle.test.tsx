import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "../../i18n/I18nContext";
import { LanguageToggle } from "./LanguageToggle";

describe("LanguageToggle", () => {
  it("marks the active language pressed and switches languages on click", async () => {
    render(
      <I18nProvider initialLanguage="en">
        <LanguageToggle />
      </I18nProvider>,
    );

    const englishButton = screen.getByRole("button", { name: "English" });
    const koreanButton = screen.getByRole("button", { name: "한국어" });

    expect(englishButton).toHaveAttribute("aria-pressed", "true");
    expect(koreanButton).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(koreanButton);

    expect(koreanButton).toHaveAttribute("aria-pressed", "true");
    expect(englishButton).toHaveAttribute("aria-pressed", "false");
  });

  it("exposes the language buttons as a labeled group", () => {
    render(
      <I18nProvider initialLanguage="en">
        <LanguageToggle />
      </I18nProvider>,
    );

    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();
  });

  it("localizes the group label itself", () => {
    render(
      <I18nProvider initialLanguage="ko">
        <LanguageToggle />
      </I18nProvider>,
    );

    expect(screen.getByRole("group", { name: "언어" })).toBeInTheDocument();
  });
});

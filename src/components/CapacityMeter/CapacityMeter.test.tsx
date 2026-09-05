import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "../../i18n/I18nContext";
import { CapacityMeter, type CapacityMeterProps } from "./CapacityMeter";

function renderMeter(props: CapacityMeterProps) {
  return render(
    <I18nProvider initialLanguage="en">
      <CapacityMeter {...props} />
    </I18nProvider>,
  );
}

// Pips carry no accessible role of their own; the row they sit in does
// (role="img"). Counting its children reads pip count off the DOM shape
// without asserting a class or colour, which the test policy forbids.
function pipCount() {
  return screen.getByRole("img").children.length;
}

describe("CapacityMeter", () => {
  it("renders 0, 10, and 11 held distinctly", () => {
    const { rerender } = renderMeter({ held: 0 });
    expect(screen.getByRole("img", { name: "Capacity 0 of 10" })).toBeInTheDocument();
    expect(screen.getByText("Capacity 0 / 10")).toBeInTheDocument();
    expect(pipCount()).toBe(10);

    rerender(
      <I18nProvider initialLanguage="en">
        <CapacityMeter held={10} />
      </I18nProvider>,
    );
    expect(screen.getByRole("img", { name: "Capacity 10 of 10" })).toBeInTheDocument();
    expect(pipCount()).toBe(10);

    // 11 held is a real state (INVENTORY_CAPACITY + REWARD_BONUS on an
    // overflowing reward), not a guard clause — it must render an eleventh
    // pip past the rail, not silently clamp back to ten.
    rerender(
      <I18nProvider initialLanguage="en">
        <CapacityMeter held={11} />
      </I18nProvider>,
    );
    expect(screen.getByRole("img", { name: "Capacity 11 of 10" })).toBeInTheDocument();
    expect(pipCount()).toBe(11);
  });

  it("defaults its label to the localised hud.capacity copy", () => {
    renderMeter({ held: 3 });
    expect(screen.getByText("Capacity 3 / 10")).toBeInTheDocument();
  });

  it("accepts an explicit label override", () => {
    renderMeter({ held: 3, label: "Held" });
    expect(screen.getByText("Held 3 / 10")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Held 3 of 10" })).toBeInTheDocument();
  });
});

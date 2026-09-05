import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ActionButton, type ActionButtonProps, type ActionButtonVariant } from "./ActionButton";
import styles from "./ActionButton.module.css";
// Tokens live in :root and are otherwise imported only by main.tsx, which
// this render tree never reaches. Without them var(--btn-edge-depth) is
// invalid at computed-value time and box-shadow resolves to "none" for every
// button alike, which would make the disabled-has-no-edge test below pass
// vacuously. Importing the real tokens here makes it a genuine assertion.
import "../../styles/tokens/colors.css";
import "../../styles/tokens/elevation.css";

function renderButton(overrides: Partial<ActionButtonProps> = {}) {
  const onClick = vi.fn();
  const label = (overrides.children as string) ?? "Go";
  const { getByRole } = render(
    <ActionButton onClick={onClick} {...overrides}>
      {label}
    </ActionButton>,
  );
  return { onClick, button: getByRole("button", { name: label }) };
}

describe("ActionButton", () => {
  it("renders the label as its accessible name", () => {
    renderButton({ children: "Confirm Discard" });
    expect(screen.getByRole("button", { name: "Confirm Discard" })).toBeInTheDocument();
  });

  it("invokes onClick", async () => {
    const { onClick, button } = renderButton();
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled and does not invoke onClick when disabled", async () => {
    const { onClick, button } = renderButton({ disabled: true });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  describe("variant classes", () => {
    const variants: ActionButtonVariant[] = ["primary", "secondary", "ghost"];

    it.each(variants)("resolves a class for the %s variant", (variant) => {
      expect(styles[variant]).toBeTruthy();
      const { button } = renderButton({ variant });
      expect(button).toHaveClass(styles.button, styles[variant]);
    });

    it("defaults to primary", () => {
      const { button } = renderButton();
      expect(button).toHaveClass(styles.button, styles.primary);
    });
  });

  // Step 4/acceptance criterion: a disabled button carries no edge. Asserted
  // against an enabled sibling so the check cannot pass by both sides
  // resolving to "none" (see the token-import comment above).
  it("carries no box-shadow edge when disabled, unlike an enabled button", () => {
    const { button: enabled } = renderButton({ children: "Enabled" });
    const { button: disabled } = renderButton({ children: "Disabled", disabled: true });

    const enabledShadow = getComputedStyle(enabled).boxShadow;
    const disabledShadow = getComputedStyle(disabled).boxShadow;

    expect(enabledShadow).not.toBe("none");
    expect(disabledShadow).toBe("none");
  });

  // Defect 1 guard: the reference implementation used onFocus/onBlur to swap
  // in the focus ring via inline style, which fires on click-focus as well as
  // keyboard focus. This component has no such handlers, so focusing and
  // blurring must never touch the inline style attribute at all.
  it("never mutates inline style on focus or blur", () => {
    const { button } = renderButton();
    fireEvent.focus(button);
    expect(button.getAttribute("style")).toBeNull();
    fireEvent.blur(button);
    expect(button.getAttribute("style")).toBeNull();
  });

  // Defect 2 guard: the reference implementation mutated inline style on
  // onPointerDown and reverted it on onPointerUp, which never fires if the
  // pointer is released off the element — leaving the button stuck looking
  // pressed. This component presses via CSS :active, so there is no inline
  // style for a dangling pointerup to fail to revert.
  it("never mutates inline style when a press is released off the element", () => {
    const { button } = renderButton();
    fireEvent.pointerDown(button);
    fireEvent.pointerUp(document.body);
    expect(button.getAttribute("style")).toBeNull();
  });
});

import type { CSSProperties, ReactNode } from "react";

export type ActionButtonVariant =
  /** The round's one forward action: Submit, Next Round, Start Run, Play Again. */
  | "primary"
  /** Supporting action on the felt: Clear, Share. */
  | "secondary"
  /** Lowest emphasis, hairline outline: Copy Result, How to Play. */
  | "ghost";

/**
 * The system's only button.
 *
 * @startingPoint section="HUD" subtitle="Primary, secondary, ghost, disabled" viewport="700x150"
 */
export interface ActionButtonProps {
  /** Title Case label: "Start Run", "Confirm Discard". Rendered uppercase. */
  children: ReactNode;
  /** Default "primary". */
  variant?: ActionButtonVariant;
  /** A disabled button is FLAT — no shadow. "Not yet" reads as "not raised". */
  disabled?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}

export declare function ActionButton(props: ActionButtonProps): JSX.Element;

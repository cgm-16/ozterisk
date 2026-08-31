export type Language = "en" | "ko";

/**
 * The EN / KO switch.
 *
 * @startingPoint section="HUD" subtitle="EN / KO locale switch" viewport="700x150"
 */
export interface LanguageToggleProps {
  /** Default "en". */
  language?: Language;
  onChange?: (language: Language) => void;
  /** Localised group label for screen readers. Default "Language". */
  groupLabel?: string;
}

export declare function LanguageToggle(props: LanguageToggleProps): JSX.Element;

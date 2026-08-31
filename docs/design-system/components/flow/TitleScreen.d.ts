import type { Language } from "../hud/LanguageToggle";

export interface TitleRule {
  /** Which material swatch precedes the line. */
  swatch: "socket" | "tile" | "gold" | "verm";
  text: string;
}

/**
 * The title screen — wordmark, one paragraph, four rules, one button.
 *
 * @startingPoint section="Flow" subtitle="Wordmark, rules, Start Run" viewport="900x700"
 */
export interface TitleScreenProps {
  onStart?: () => void;
  /** The localised one-paragraph pitch. */
  summary?: string;
  language?: Language;
  onLanguageChange?: (language: Language) => void;
  labels?: { start: string };
  /** Defaults to the four canonical rules. */
  rules?: readonly TitleRule[];
}

export declare function TitleScreen(props: TitleScreenProps): JSX.Element;

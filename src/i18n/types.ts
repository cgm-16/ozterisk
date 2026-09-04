import type { ReactNode } from "react";
import type { Language } from "../game/types";
import type { MessageTree } from "./messages";

// Flattens a nested message tree into a union of dot-separated leaf paths,
// e.g. { title: { name: string } } -> "title.name".
type DotPaths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${DotPaths<T[K]>}`;
}[keyof T & string];

export type TranslationKey = DotPaths<MessageTree>;

export interface I18nValue {
  language: Language;
  setLanguage(language: Language): void;
  t(key: TranslationKey, values?: Record<string, string | number>): string;
}

export interface I18nProviderProps {
  children: ReactNode;
  initialLanguage?: Language; // deterministic tests; omit in production
  loadKoreanFont?: () => Promise<void>; // injectable so tests never trigger the real font import; defaults to the real loader
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Language } from "../game/types";
import { loadKoreanFont as loadKoreanFontDefault } from "./koreanFont";
import { messages } from "./messages";
import { getInitialLanguage, saveLanguage } from "./storage";
import type { I18nProviderProps, I18nValue, TranslationKey } from "./types";

const I18nContext = createContext<I18nValue | null>(null);

function resolveTemplate(language: Language, key: TranslationKey): string {
  const segments = key.split(".");
  let node: unknown = messages[language];
  for (const segment of segments) {
    if (typeof node !== "object" || node === null || !(segment in node)) {
      node = undefined;
      break;
    }
    node = (node as Record<string, unknown>)[segment];
  }

  if (typeof node !== "string") {
    if (import.meta.env.DEV) {
      throw new Error(`Missing translation for key "${key}" in language "${language}".`);
    }
    return key;
  }

  return node;
}

function interpolate(template: string, values?: Record<string, string | number>): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, token: string) =>
    Object.prototype.hasOwnProperty.call(values, token) ? String(values[token]) : match,
  );
}

export function I18nProvider({
  children,
  initialLanguage,
  loadKoreanFont = loadKoreanFontDefault,
}: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>(
    () => initialLanguage ?? getInitialLanguage(),
  );

  useEffect(() => {
    document.documentElement.lang = language;
    if (language === "ko") {
      void loadKoreanFont();
    }
  }, [language, loadKoreanFont]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    saveLanguage(next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, values?: Record<string, string | number>) =>
      interpolate(resolveTemplate(language, key), values),
    [language],
  );

  const value = useMemo<I18nValue>(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- the provider and its hook are the module's public contract; splitting them adds indirection without benefit.
export function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

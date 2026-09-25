export type Locale = "en" | "ko";

/* `action.start` in both locales. The accessible name is the only stable handle
   on the control that moves the app out of `title`, and both e2e specs need to
   get past it before they can measure anything. */
export const START_LABEL: Record<Locale, string> = {
  en: "Start Run",
  ko: "게임 시작",
};

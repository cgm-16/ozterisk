import React from "react";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "ko", label: "KO" },
];

/**
 * EN / KO. Both locales are first class; this is not a settings screen.
 */
export function LanguageToggle({ language = "en", onChange, groupLabel = "Language" }) {
  return (
    <div
      role="group"
      aria-label={groupLabel}
      style={{
        display: "flex",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border-hairline)",
        overflow: "hidden",
      }}
    >
      {LANGUAGES.map(({ code, label }) => {
        const active = code === language;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            onClick={() => onChange && onChange(code)}
            style={{
              minHeight: "var(--target-min)",
              minWidth: "var(--target-min)",
              padding: "0 var(--space-3)",
              border: "none",
              cursor: "pointer",
              font: `var(--weight-medium) var(--size-label)/var(--leading-tight) var(--font-mono)`,
              letterSpacing: "var(--track-label-tight)",
              background: active ? "var(--accent)" : "transparent",
              color: active ? "var(--clay-900)" : "var(--text-meta)",
              transition: `background var(--dur-state) var(--ease-standard)`,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

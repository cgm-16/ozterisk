import React from "react";
import { ActionButton } from "../hud/ActionButton.jsx";
import { LanguageToggle } from "../hud/LanguageToggle.jsx";
import { Tile } from "../game/Tile.jsx";

const RULES = [
  { swatch: "socket", text: "The rack holds exactly ten tiles." },
  { swatch: "tile", text: "A correct answer spends your tiles and returns one more than you spent." },
  { swatch: "gold", text: "Rewards land in sorted order. Past ten, you must discard." },
  { swatch: "verm", text: "A wrong answer takes your tiles and gives nothing back." },
];

const SWATCH = {
  // The socket swatch sits on the darkest ground in the app, where the real
  // socket fill (well-900) disappears. It uses the raised-felt step instead and
  // a hand-softened inset — --shadow-socket-sm is tuned for a ~34px chip and at
  // 18px its 3px/7px falloff swallows the whole top half.
  socket: { background: "var(--surface-raised)", boxShadow: "inset 0 1px 3px rgb(0 0 0 / 45%), var(--rim-socket)" },
  tile: { background: "var(--surface-tile)", boxShadow: "var(--shadow-tile-sm)" },
  gold: { background: "var(--accent)" },
  verm: { background: "var(--state-incorrect)" },
};

/**
 * The only ceremony in the game.
 */
export function TitleScreen({ onStart, summary, language, onLanguageChange, labels = { start: "Start Run" }, rules = RULES }) {
  return (
    <div
      lang={language}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-8)",
        padding: "var(--space-14) var(--space-8)",
        textAlign: "center",
      }}
    >
      <div style={{ position: "absolute", top: "var(--space-6)", right: "var(--space-6)" }}>
        <LanguageToggle language={language} onChange={onLanguageChange} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-4)" }}>
        <Tile digit={"\u2733"} label="ozterisk" />
        <span
          style={{
            font: `var(--weight-medium) var(--size-wordmark)/var(--leading-tight) var(--font-display)`,
            letterSpacing: "var(--track-wordmark)",
            color: "var(--text-primary)",
          }}
        >
          oz<span style={{ color: "var(--accent)" }}>&#10035;</span>terisk
        </span>
      </div>

      {summary ? (
        <p
          style={{
            maxWidth: "52ch",
            font: `var(--weight-regular) var(--size-body)/var(--leading-body) var(--font-display)`,
            color: "var(--text-body)",
            textWrap: "pretty",
          }}
        >
          {summary}
        </p>
      ) : null}

      <ul style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--space-3) var(--space-6)", listStyle: "none", padding: 0, maxWidth: 620, textAlign: "left" }}>
        {rules.map((r, i) => (
          <li key={i} style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-start" }}>
            <span style={{ width: 18, height: 18, borderRadius: "var(--radius-sm)", flex: "none", marginTop: 2, ...SWATCH[r.swatch] }} />
            <span style={{ font: `var(--weight-regular) var(--size-body-sm)/var(--leading-snug) var(--font-ui)`, color: "var(--text-body)" }}>{r.text}</span>
          </li>
        ))}
      </ul>

      <ActionButton onClick={onStart}>{labels.start}</ActionButton>
    </div>
  );
}

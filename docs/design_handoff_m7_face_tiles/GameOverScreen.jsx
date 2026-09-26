import React from "react";
import { ActionButton } from "../hud/ActionButton.jsx";
import { Tile } from "../game/Tile.jsx";

const smSocket = {
  width: "var(--tile-w-sm)", height: "var(--tile-h-sm)", borderRadius: "var(--radius-sm)",
  background: "var(--surface-socket)", boxShadow: "var(--shadow-socket-sm), var(--rim-socket)",
};

// A Classic win's evidence: the floor's sockets and the tiles still in them.
// It takes the slot the loss gives its terminal equation.
function FinalHand({ hand, floor, label }) {
  const cells = Array.from({ length: Math.max(floor, hand.length) }, (_, i) => hand[i] ?? null);
  return (
    <div role="img" aria-label={label} style={{ display: "flex", gap: 4, padding: 6, borderRadius: "var(--radius-md)", background: "var(--surface-panel)", border: "1px solid var(--border-hairline)" }}>
      {cells.map((d, i) => (d === null ? <span key={i} style={smSocket} /> : <Tile key={i} digit={d} size="sm" />))}
    </div>
  );
}

function Stat({ label, value, primary }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", alignItems: "center" }}>
      <span
        style={{
          font: `var(--weight-medium) var(--size-label)/var(--leading-tight) var(--font-mono)`,
          letterSpacing: "var(--track-label)",
          textTransform: "uppercase",
          color: "var(--text-meta)",
        }}
      >
        {label}
      </span>
      <span style={{ font: `var(--weight-semibold) ${primary ? "2.125rem" : "1.5rem"}/var(--leading-tight) var(--font-numeral)`, color: "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

const DEFAULT_LABELS = {
  title: "Game Over",
  reason: "Not enough tiles left to answer.",
  winTitle: "Run Complete",
  winReason: "You reached the floor with tiles in hand.",
  rounds: "Rounds played",
  score: "Score",
  longestStreak: "Longest streak",
  restartHint: "Press R to play again",
  playAgain: "Play Again",
  share: "Share",
  copy: "Copy Result",
  copiedNotice: "Result copied.",
  finalHand: "Finished with {held} tiles in {floor} sockets",
};

/**
 * The run's end. A loss keeps the terminal equation on screen to explain it;
 * a Classic win (`stats.won`) puts its own evidence in that slot — the floor's
 * sockets and the tiles still in them — and sets its verdict in gold, never
 * the loss's vermilion (Run Complete Theming, 1c).
 */
export function GameOverScreen({ stats, equation, hand = [], floor = 6, onPlayAgain, onShare, onCopy, copied = false, labels: labelsIn }) {
  const labels = { ...DEFAULT_LABELS, ...labelsIn };
  const won = !!stats.won;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-4)", padding: "var(--space-8) var(--space-4)", textAlign: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-2)" }}>
        {won ? (
          <FinalHand hand={hand} floor={floor} label={labels.finalHand.replace("{held}", hand.length).replace("{floor}", floor)} />
        ) : equation ? (
          <p style={{ margin: 0, font: `var(--weight-medium) var(--size-title)/var(--leading-tight) var(--font-numeral)`, color: "var(--text-meta)" }}>
            {equation.left} &times; {equation.right} = {equation.product}
          </p>
        ) : null}
        <p style={{ margin: 0, padding: "0 var(--space-4)", font: `var(--weight-regular) var(--size-body)/var(--leading-body) var(--font-ui)`, color: "var(--text-meta)" }}>
          {won ? labels.winReason : labels.reason}
        </p>
      </div>
      {/* Loss: --verm-400, a tile leaving (4.5:1 at 11px). Win: gold, the game's
          word for earned (8.7:1). Upstream sets both in vermilion. */}
      <span
        role="heading"
        aria-level={1}
        style={{
          font: `var(--weight-medium) var(--size-label)/var(--leading-tight) var(--font-mono)`,
          letterSpacing: "var(--track-label)",
          textTransform: "uppercase",
          color: won ? "var(--gold-500)" : "var(--verm-400)",
        }}
      >
        {won ? labels.winTitle : labels.title}
      </span>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-6)", justifyContent: "center" }}>
        <Stat label={labels.rounds} value={stats.totalRounds} primary />
        {stats.score !== undefined ? <Stat label={labels.score} value={stats.score} /> : null}
        <Stat label={labels.longestStreak} value={stats.longestStreak} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-4)" }}>
        <ActionButton onClick={onPlayAgain}>{labels.playAgain}</ActionButton>
        <p style={{ margin: 0, fontSize: "var(--size-label)", color: "var(--text-meta)" }}>{labels.restartHint}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", justifyContent: "center" }}>
          <ActionButton variant="secondary" onClick={onShare}>{labels.share}</ActionButton>
          <ActionButton variant="ghost" onClick={onCopy}>{labels.copy}</ActionButton>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-3)", minHeight: 34 }}>
        {copied ? (
          <span
            aria-hidden="true"
            style={{
              width: 34, height: 34, borderRadius: "var(--radius-sm)",
              background: "var(--state-incorrect)", color: "var(--ink-000)",
              display: "flex", alignItems: "center", justifyContent: "center",
              font: `var(--weight-medium) var(--size-body)/var(--leading-tight) var(--font-display)`,
              animation: "oz-chop var(--dur-share) var(--ease-snap) forwards",
            }}
          >
            &#10035;
          </span>
        ) : null}
        <p role="status" aria-live="polite" style={{ margin: 0, color: "var(--text-meta)" }}>{copied ? labels.copiedNotice : ""}</p>
      </div>
    </div>
  );
}

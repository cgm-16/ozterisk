import React from "react";
import { ActionButton } from "../hud/ActionButton.jsx";

function Stat({ label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", alignItems: "center" }}>
      <span
        style={{
          font: `var(--weight-medium) var(--size-micro)/var(--leading-tight) var(--font-mono)`,
          letterSpacing: "var(--track-label)",
          textTransform: "uppercase",
          color: "var(--text-meta)",
        }}
      >
        {label}
      </span>
      <span style={{ font: `var(--weight-semibold) var(--size-display)/var(--leading-tight) var(--font-numeral)`, color: "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

/**
 * The run's obituary. Bare rack behind, terminal equation still on screen.
 */
export function GameOverScreen({
  stats,
  onPlayAgain,
  onShare,
  onCopy,
  copied = false,
  labels = {
    title: "Game Over",
    reason: "Not enough tiles left to answer.",
    rounds: "Rounds played",
    longestStreak: "Longest streak",
    playAgain: "Play Again",
    share: "Share",
    copy: "Copy Result",
    copiedNotice: "Result copied.",
  },
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-6)", padding: "var(--space-10) var(--space-8)", textAlign: "center" }}>
      <span
        style={{
          font: `var(--weight-medium) var(--size-label)/var(--leading-tight) var(--font-mono)`,
          letterSpacing: "var(--track-label)",
          textTransform: "uppercase",
          color: "var(--state-incorrect)",
        }}
      >
        {labels.title}
      </span>
      <p style={{ font: `var(--weight-regular) var(--size-body)/var(--leading-body) var(--font-display)`, color: "var(--text-body)" }}>{labels.reason}</p>

      <div style={{ display: "flex", gap: "var(--space-10)" }}>
        <Stat label={labels.rounds} value={stats.totalRounds} />
        <Stat label={labels.longestStreak} value={stats.longestStreak} />
      </div>

      <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
        <ActionButton onClick={onPlayAgain}>{labels.playAgain}</ActionButton>
        <ActionButton variant="secondary" onClick={onShare}>{labels.share}</ActionButton>
        <ActionButton variant="ghost" onClick={onCopy}>{labels.copy}</ActionButton>
        {copied ? (
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: "var(--radius-sm)",
              background: "var(--state-incorrect)",
              color: "var(--ink-000)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              font: `var(--weight-medium) var(--size-body)/var(--leading-tight) var(--font-display)`,
            }}
            role="status"
            aria-label={labels.copiedNotice}
          >
            &#10035;
          </span>
        ) : null}
      </div>
    </div>
  );
}

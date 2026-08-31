import React from "react";
import { Tile } from "../game/Tile.jsx";

/**
 * The verdict. States what happened; never congratulates or consoles.
 */
export function FeedbackPanel({ result, rewardTiles = [], labels = {} }) {
  if (!result) return null;
  const correct = result.kind === "correct";
  const t = {
    correct: "Correct",
    incorrect: "Incorrect",
    submitted: "Your answer: {value}",
    answer: "Correct answer: {value}",
    rewards: "Received {count} tiles",
    ...labels,
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
        alignItems: "center",
        padding: "var(--space-6)",
        borderRadius: "var(--radius-lg)",
        background: "var(--surface-panel)",
        border: `1px solid ${correct ? "var(--border-accent)" : "var(--border-danger)"}`,
      }}
    >
      <span
        style={{
          font: `var(--weight-medium) var(--size-label)/var(--leading-tight) var(--font-mono)`,
          letterSpacing: "var(--track-label)",
          textTransform: "uppercase",
          color: correct ? "var(--state-correct)" : "var(--state-incorrect)",
        }}
      >
        {correct ? t.correct : t.incorrect}
      </span>

      {!correct ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", alignItems: "center" }}>
          <span style={{ font: `var(--weight-regular) var(--size-body-sm)/var(--leading-snug) var(--font-ui)`, color: "var(--text-body)" }}>
            {t.submitted.replace("{value}", result.submittedValue)}
          </span>
          <span style={{ font: `var(--weight-regular) var(--size-body-sm)/var(--leading-snug) var(--font-ui)`, color: "var(--text-primary)" }}>
            {t.answer.replace("{value}", result.correctValue)}
          </span>
        </div>
      ) : null}

      {correct && rewardTiles.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", alignItems: "center" }}>
          {/* Unlabelled tiles under the verdict read as a restatement of the
              answer. Say what they are: these arrived, they are not what you
              submitted. */}
          <span
            style={{
              font: `var(--weight-medium) var(--size-micro)/var(--leading-tight) var(--font-mono)`,
              letterSpacing: "var(--track-label)",
              textTransform: "uppercase",
              color: "var(--text-meta)",
            }}
          >
            {t.rewards.replace("{count}", rewardTiles.length)}
          </span>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            {rewardTiles.map((tile) => (
              <Tile key={tile.id} digit={tile.digit} size="sm" state="reward" label="New tile" />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

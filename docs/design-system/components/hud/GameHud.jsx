import React from "react";

function Stat({ label, value, accent, breaking, brokenFrom }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", position: "relative" }}>
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
      <span
        style={{
          position: "relative",
          font: `var(--weight-semibold) var(--size-title)/var(--leading-tight) var(--font-numeral)`,
          color: accent ? "var(--accent)" : "var(--text-primary)",
        }}
      >
        <span style={{ animation: breaking ? "oz-counter-zero var(--dur-break) var(--ease-settle) both" : undefined }}>
          {value}
        </span>
        {breaking ? (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              color: "var(--accent)",
              animation: "oz-counter-fall var(--dur-break) var(--ease-fall) both",
            }}
          >
            {brokenFrom}
          </span>
        ) : null}
      </span>
    </div>
  );
}

/**
 * Score, streak and round. Fixed order, never reflows.
 */
export function GameHud({ score, currentStreak, round, labels = { score: "Score", streak: "Streak", round: "Round" } }) {
  // 10e: a streak that drops to zero falls off its perch. Held for one render
  // pass so the animation has something to animate from.
  const prev = React.useRef(currentStreak);
  const [broken, setBroken] = React.useState(null);
  React.useEffect(() => {
    if (prev.current > 0 && currentStreak === 0) {
      const from = prev.current;
      setBroken(from);
      const id = setTimeout(() => setBroken(null), 700);
      prev.current = currentStreak;
      return () => clearTimeout(id);
    }
    prev.current = currentStreak;
  }, [currentStreak]);

  return (
    <div
      style={{
        display: "flex",
        gap: "var(--space-8)",
        padding: "var(--space-4) var(--space-6)",
        borderBottom: "1px solid var(--border-hairline)",
      }}
    >
      <Stat label={labels.round} value={round} />
      <Stat label={labels.score} value={score} />
      <Stat
        label={labels.streak}
        value={currentStreak}
        accent={currentStreak > 0}
        breaking={broken != null}
        brokenFrom={broken}
      />
    </div>
  );
}

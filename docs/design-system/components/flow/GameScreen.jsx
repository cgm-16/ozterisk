import React from "react";
import { GameHud } from "../hud/GameHud.jsx";
import { CapacityMeter } from "../hud/CapacityMeter.jsx";
import { LanguageToggle } from "../hud/LanguageToggle.jsx";
import { ActionButton } from "../hud/ActionButton.jsx";
import { EquationBoard } from "../game/EquationBoard.jsx";
import { AnswerSlots } from "../game/AnswerSlots.jsx";
import { TileInventory } from "../game/TileInventory.jsx";
import { FeedbackPanel } from "./FeedbackPanel.jsx";
import { OverflowControls } from "./OverflowControls.jsx";

const digitCount = (n) => String(n).length;

/**
 * The play surface. Vertical order is fixed and never reflows:
 * HUD -> equation -> answer slots -> rack -> actions.
 */
export function GameScreen({
  state,
  language,
  onLanguageChange,
  onSelectTile,
  onReturnTile,
  onToggleDiscard,
  onConfirmDiscard,
  onSubmit,
  onNextRound,
  onClear,
  labels = {},
}) {
  const { phase, equation, inventory = [], selectedTiles = [], pendingDiscards = [], lastResult } = state;
  const slotCount = equation ? digitCount(equation.product) : 1;
  const filled = selectedTiles.length === slotCount;
  const rewardTiles = inventory.filter((t) => t.isNew);
  const requiredCount = Math.max(0, inventory.length - 10);

  const t = { submit: "Submit", clear: "Clear", next: "Next Round", ...labels };

  return (
    <div
      // Carries the locale for the :lang(ko) typography override — Hangul runs
      // untracked and one pixel up. Without this the ko locale silently gets
      // the Latin mono rule.
      lang={language}
      style={{
        width: "100%",
        maxWidth: "var(--arena-max-width)",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        background: "var(--surface-table)",
        backgroundImage: "repeating-linear-gradient(48deg, rgba(255,255,255,.022) 0 2px, transparent 2px 4px)",
        border: "1px solid var(--border-hairline)",
        borderRadius: "var(--radius-xl)",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)", paddingRight: "var(--space-6)", borderBottom: "1px solid var(--border-hairline)" }}>
        <GameHud round={state.round} score={state.score} currentStreak={state.currentStreak} labels={labels.hud} />
        <LanguageToggle language={language} onChange={onLanguageChange} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-6)", padding: "var(--space-8) var(--space-6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
          <EquationBoard equation={equation} showProduct={phase === "feedback"} />
          {phase === "answering" ? (
            <AnswerSlots slotCount={slotCount} selectedTiles={selectedTiles} onReturn={onReturnTile} />
          ) : null}
        </div>

        {phase === "feedback" ? <FeedbackPanel result={lastResult} rewardTiles={rewardTiles} labels={labels.result} /> : null}

        {phase === "overflow" ? (
          <OverflowControls
            requiredCount={requiredCount}
            markedCount={pendingDiscards.length}
            perchedTile={rewardTiles[rewardTiles.length - 1]}
            onConfirm={onConfirmDiscard}
            labels={labels.overflow}
          />
        ) : null}

        <TileInventory
          tiles={inventory}
          mode={phase === "overflow" ? "discard" : phase === "feedback" ? "readOnly" : "select"}
          pendingDiscards={pendingDiscards}
          onTile={phase === "overflow" ? onToggleDiscard : onSelectTile}
          rewardHalo={state.round <= 2}
        />

        <CapacityMeter held={inventory.length} label={labels.capacity} />

        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          {phase === "answering" ? (
            <React.Fragment>
              <ActionButton onClick={onSubmit} disabled={!filled}>{t.submit}</ActionButton>
              <ActionButton variant="ghost" onClick={onClear} disabled={selectedTiles.length === 0}>{t.clear}</ActionButton>
            </React.Fragment>
          ) : null}
          {phase === "feedback" ? <ActionButton onClick={onNextRound}>{t.next}</ActionButton> : null}
        </div>
      </div>
    </div>
  );
}

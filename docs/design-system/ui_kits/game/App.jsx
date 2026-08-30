import React from "react";

/**
 * Click-through recreation of a full ozterisk run. The state machine here is a
 * trimmed version of src/game/gameReducer.ts — enough to play the real loop
 * (select, submit, reward, overflow, loss) without the balance dials.
 */

const CAPACITY = 10;
const digits = (n) => String(n).length;
const rnd = (n) => Math.floor(Math.random() * n);
let seq = 0;
const makeTile = (digit, isNew = false) => ({ id: `t${++seq}`, digit, isNew });
const START_TILES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => ({ digit: d }));
const sortTiles = (tiles) => [...tiles].sort((a, b) => a.digit - b.digit || a.id.localeCompare(b.id));

// The canonical 45-entry pool of unordered operand pairs (1 <= left <= right <= 9),
// matching src/game/generators.ts.
const EQUATION_PAIRS = (() => {
  const pairs = [];
  for (let left = 1; left <= 9; left++) for (let right = left; right <= 9; right++) pairs.push([left, right]);
  return pairs;
})();

const orient = ([a, b]) => {
  const flip = Math.random() >= 0.5;
  const left = flip ? b : a;
  const right = flip ? a : b;
  return { left, right, product: left * right };
};

// KIND_EQUATION_RATE from src/game/balance.ts: one draw in five is restricted to
// products the current hand can already spell. Without it a run dies almost
// immediately after its first miss.
const KIND_EQUATION_RATE = 0.2;

function drawEquation(inventory = []) {
  const pool =
    Math.random() < KIND_EQUATION_RATE
      ? EQUATION_PAIRS.filter(([l, r]) => canConstruct(inventory, l * r))
      : EQUATION_PAIRS;
  const from = pool.length ? pool : EQUATION_PAIRS;
  return orient(from[rnd(from.length)]);
}

const initialState = () => ({
  phase: "title",
  equation: null,
  inventory: [],
  selectedTiles: [],
  pendingDiscards: [],
  score: 0,
  round: 1,
  totalRounds: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastResult: null,
  copied: false,
});

// Multiset check, from src/game/selectors.ts: a product needing two of a digit
// requires two tiles. Used ONLY to bias the kind draw.
function canConstruct(inventory, product) {
  const pool = inventory.map((t) => t.digit);
  return String(product)
    .split("")
    .map(Number)
    .every((d) => {
      const i = pool.indexOf(d);
      if (i === -1) return false;
      pool.splice(i, 1);
      return true;
    });
}

// The loss condition, from selectors.ts canAttemptEquation: you lose when you
// cannot FILL the slots, not when you cannot spell the product. Holding ten
// tiles is never game over — a wrong answer is, and that is the point.
function canAttempt(inventory, equation) {
  if (!equation) return true;
  return inventory.length >= digits(equation.product);
}

export function App() {
  const [language, setLanguage] = React.useState("en");
  const t = messages[language];
  const [state, setState] = React.useState(initialState);

  const {
    phase, equation, inventory, selectedTiles, pendingDiscards, lastResult,
  } = state;
  const slotCount = equation ? digits(equation.product) : 1;
  const rewardTiles = inventory.filter((x) => x.isNew);
  const requiredCount = Math.max(0, inventory.length - CAPACITY);

  const start = () =>
    setState({
      ...initialState(),
      phase: "answering",
      equation: drawEquation(START_TILES),
      inventory: sortTiles([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => makeTile(d))),
    });

  const selectTile = (id) =>
    setState((s) => {
      if (s.selectedTiles.length >= digits(s.equation.product)) return s;
      const tile = s.inventory.find((x) => x.id === id);
      if (!tile || s.selectedTiles.some((x) => x.id === id)) return s;
      return { ...s, selectedTiles: [...s.selectedTiles, tile] };
    });

  const returnTile = (id) =>
    setState((s) => {
      const tile = s.selectedTiles.find((x) => x.id === id);
      if (!tile) return s;
      return { ...s, selectedTiles: s.selectedTiles.filter((x) => x.id !== id) };
    });

  const clear = () =>
    setState((s) => ({
      ...s,
      selectedTiles: [],
    }));

  const submit = () =>
    setState((s) => {
      const submittedValue = Number(s.selectedTiles.map((x) => x.digit).join(""));
      const correct = submittedValue === s.equation.product;
      const n = s.selectedTiles.length;
      const result = {
        kind: correct ? "correct" : "incorrect",
        submittedValue,
        correctValue: s.equation.product,
        submittedTiles: s.selectedTiles,
        rewardTileIds: [],
      };
      const spent = new Set(s.selectedTiles.map((x) => x.id));
      const kept = s.inventory.filter((x) => !spent.has(x.id));
      if (!correct) {
        const streak = 0;
        return {
          ...s,
          phase: "feedback",
          inventory: kept,
          selectedTiles: [],
          lastResult: result,
          currentStreak: streak,
          totalRounds: s.totalRounds + 1,
        };
      }
      const rewards = Array.from({ length: n + 1 }, () => makeTile(rnd(10), true));
      const inv = sortTiles([...kept.map((x) => ({ ...x, isNew: false })), ...rewards]);
      const streak = s.currentStreak + 1;
      return {
        ...s,
        phase: inv.length > CAPACITY ? "overflow" : "feedback",
        selectedTiles: [],
        inventory: inv,
        lastResult: result,
        score: s.score + 1,
        currentStreak: streak,
        longestStreak: Math.max(s.longestStreak, streak),
        totalRounds: s.totalRounds + 1,
      };
    });

  const toggleDiscard = (id) =>
    setState((s) => ({
      ...s,
      pendingDiscards: s.pendingDiscards.includes(id)
        ? s.pendingDiscards.filter((x) => x !== id)
        : s.pendingDiscards.length < Math.max(0, s.inventory.length - CAPACITY)
        ? [...s.pendingDiscards, id]
        : s.pendingDiscards,
    }));

  const confirmDiscard = () =>
    setState((s) => ({
      ...s,
      phase: "feedback",
      inventory: s.inventory.filter((x) => !s.pendingDiscards.includes(x.id)),
      pendingDiscards: [],
    }));

  const nextRound = () =>
    setState((s) => {
      const inv0 = s.inventory.map((x) => ({ ...x, isNew: false }));
      const eq = drawEquation(inv0);
      const inv = s.inventory.map((x) => ({ ...x, isNew: false }));
      if (!canAttempt(inv, eq)) {
        return { ...s, phase: "gameOver", equation: eq, inventory: inv };
      }
      return {
        ...s,
        phase: "answering",
        equation: eq,
        inventory: inv,
        round: s.round + 1,
        lastResult: null,
      };
    });

  if (phase === "title") {
    return (
      <DS.TitleScreen
        summary={t.title.summary}
        rules={t.rules}
        labels={{ start: t.action.start }}
        language={language}
        onLanguageChange={setLanguage}
        onStart={start}
      />
    );
  }

  if (phase === "gameOver") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", alignItems: "center" }}>
        <DS.EquationBoard equation={equation} showProduct />
        <DS.TileInventory tiles={inventory} mode="readOnly" />
        <DS.GameOverScreen
          stats={{ score: state.score, totalRounds: state.totalRounds, longestStreak: state.longestStreak }}
          copied={state.copied}
          labels={{ ...t.gameOver, ...t.action }}
          onPlayAgain={start}
          onCopy={() => setState((s) => ({ ...s, copied: true }))}
          onShare={() => setState((s) => ({ ...s, copied: true }))}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--surface-table)",
        backgroundImage: "repeating-linear-gradient(48deg, rgba(255,255,255,.022) 0 2px, transparent 2px 4px)",
        border: "1px solid var(--border-hairline)",
        borderRadius: "var(--radius-xl)",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: "var(--space-6)", borderBottom: "1px solid var(--border-hairline)" }}>
        <DS.GameHud round={state.round} score={state.score} currentStreak={state.currentStreak} labels={t.hud} />
        <DS.LanguageToggle language={language} onChange={setLanguage} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-6)", padding: "var(--space-8) var(--space-6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
          {/* The slots always complete the equation with what YOU submitted — the
             bloom on a hit, the crack on a miss. Printing the product beside
             them states two different answers at once; the panel is where the
             real number is stated. Only game over prints it on the board. */}
          <DS.EquationBoard equation={equation} />
          {phase === "answering" ? (
            <DS.AnswerSlots slotCount={slotCount} selectedTiles={selectedTiles} onReturn={returnTile} />
          ) : null}
          {/* Feedback keeps the slots on screen so 2a bloom / 9f crack have somewhere to play. */}
          {phase !== "answering" && lastResult ? (
            <DS.AnswerSlots
              slotCount={lastResult.submittedTiles.length}
              selectedTiles={lastResult.submittedTiles}
              state={lastResult.kind}
              streak={state.currentStreak}
              disabled
            />
          ) : null}
        </div>

        {phase === "feedback" ? (
          <DS.FeedbackPanel result={lastResult} rewardTiles={rewardTiles} labels={t.result} />
        ) : null}

        {phase === "overflow" ? (
          <DS.OverflowControls
            requiredCount={requiredCount}
            markedCount={pendingDiscards.length}
            perchedTile={rewardTiles[rewardTiles.length - 1]}
            onConfirm={confirmDiscard}
            labels={t.overflow}
          />
        ) : null}

        <DS.TileInventory
          tiles={inventory}
          mode={phase === "overflow" ? "discard" : phase === "feedback" ? "readOnly" : "select"}
          pendingDiscards={pendingDiscards}
          liftedIds={selectedTiles.map((x) => x.id)}
          onTile={phase === "overflow" ? toggleDiscard : selectTile}
          rewardHalo={state.round <= 2}
        />

        <DS.CapacityMeter held={inventory.length} label={t.capacity} />

        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          {phase === "answering" ? (
            <React.Fragment>
              <DS.ActionButton onClick={submit} disabled={selectedTiles.length !== slotCount}>
                {t.action.submit}
              </DS.ActionButton>
              <DS.ActionButton variant="ghost" onClick={clear} disabled={selectedTiles.length === 0}>
                {t.action.clear}
              </DS.ActionButton>
            </React.Fragment>
          ) : null}
          {phase === "feedback" ? (
            <DS.ActionButton onClick={nextRound}>{t.action.next}</DS.ActionButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const NS = window.OzteriskDesignSystem || window.Ozterisk || window.ozterisk ||
  Object.values(window).find((v) => v && typeof v === "object" && v.FeedbackPanel && v.OverflowControls) || {};
const { FeedbackPanel, OverflowControls, GameOverScreen } = NS;
const t = (d, i, isNew) => ({ id: "t" + i, digit: d, isNew: !!isNew });

function Demo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div className="row">
        <div className="cell"><span className="cap">correct</span>
          <FeedbackPanel result={{ kind: "correct", submittedValue: 42, correctValue: 42, submittedTiles: [], rewardTileIds: [] }} rewardTiles={[t(2,1,true),t(4,2,true),t(8,3,true)]} />
        </div>
        <div className="cell"><span className="cap">incorrect</span>
          <FeedbackPanel result={{ kind: "incorrect", submittedValue: 48, correctValue: 42, submittedTiles: [], rewardTileIds: [] }} />
        </div>
        <div className="cell"><span className="cap">overflow</span>
          <OverflowControls requiredCount={1} markedCount={1} perchedTile={t(5, 9, true)} />
        </div>
      </div>
      <div className="cell" style={{ alignSelf: "stretch" }}><span className="cap">end of run</span>
        <GameOverScreen stats={{ score: 11, totalRounds: 14, longestStreak: 8 }} copied />
      </div>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<Demo />);

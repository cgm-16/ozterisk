const NS = window.OzteriskDesignSystem || window.Ozterisk || window.ozterisk ||
  Object.values(window).find((v) => v && typeof v === "object" && v.Tile && v.TileInventory) || {};
const { Tile, TileInventory, AnswerSlots, EquationBoard } = NS;
const t = (d, i, isNew) => ({ id: "t" + i, digit: d, isNew: !!isNew });

function Demo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div className="row">
        <div className="cell"><span className="cap">resting</span><Tile digit={7} /></div>
        <div className="cell"><span className="cap">lifted</span><Tile digit={4} state="lifted" /></div>
        <div className="cell"><span className="cap">reward</span><Tile digit={2} state="reward" /></div>
        <div className="cell"><span className="cap">marked</span><Tile digit={9} state="marked" /></div>
        <div className="cell"><span className="cap">disabled</span><Tile digit={5} state="disabled" /></div>
        <div className="cell"><span className="cap">small</span><Tile digit={3} size="sm" /></div>
      </div>
      <div className="row">
        <div className="cell"><span className="cap">slots — 1 of 2 filled</span>
          <AnswerSlots slotCount={2} selectedTiles={[t(4, "a")]} />
        </div>
        <div className="cell"><span className="cap">equation</span><EquationBoard equation={{ left: 7, right: 6, product: 42 }} /></div>
      </div>
      <div className="cell"><span className="cap">rack — 8 of 10, two dead sockets</span>
        <TileInventory tiles={[t(1,1),t(2,2),t(3,3),t(5,5),t(6,6),t(7,7),t(9,9),t(0,0)]} />
      </div>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<Demo />);

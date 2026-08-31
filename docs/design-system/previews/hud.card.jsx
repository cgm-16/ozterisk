const NS = window.OzteriskDesignSystem || window.Ozterisk || window.ozterisk ||
  Object.values(window).find((v) => v && typeof v === "object" && v.ActionButton && v.GameHud) || {};
const { ActionButton, GameHud, CapacityMeter, LanguageToggle } = NS;

function Demo() {
  const [lang, setLang] = React.useState("en");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div className="row">
        <div className="cell"><span className="cap">primary</span><ActionButton>Submit</ActionButton></div>
        <div className="cell"><span className="cap">secondary</span><ActionButton variant="secondary">Share</ActionButton></div>
        <div className="cell"><span className="cap">ghost</span><ActionButton variant="ghost">Copy Result</ActionButton></div>
        <div className="cell"><span className="cap">disabled — flat</span><ActionButton disabled>Submit</ActionButton></div>
        <div className="cell"><span className="cap">locale</span><LanguageToggle language={lang} onChange={setLang} /></div>
      </div>
      <div className="row" style={{ alignItems: "flex-start" }}>
        <div className="cell"><span className="cap">hud</span><GameHud round={14} score={11} currentStreak={8} /></div>
        <div className="cell"><span className="cap">capacity — safe</span><CapacityMeter held={6} /></div>
        <div className="cell"><span className="cap">capacity — danger</span><CapacityMeter held={10} /></div>
      </div>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<Demo />);

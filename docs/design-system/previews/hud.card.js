(function() {
	//#region docs/design-system/previews/hud.card.jsx
	var { ActionButton, GameHud, CapacityMeter, LanguageToggle } = window.OzteriskDesignSystem || window.Ozterisk || window.ozterisk || Object.values(window).find((v) => v && typeof v === "object" && v.ActionButton && v.GameHud) || {};
	function Demo() {
		const [lang, setLang] = React.useState("en");
		return /* @__PURE__ */ React.createElement("div", { style: {
			display: "flex",
			flexDirection: "column",
			gap: "var(--space-6)"
		} }, /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement("div", { className: "cell" }, /* @__PURE__ */ React.createElement("span", { className: "cap" }, "primary"), /* @__PURE__ */ React.createElement(ActionButton, null, "Submit")), /* @__PURE__ */ React.createElement("div", { className: "cell" }, /* @__PURE__ */ React.createElement("span", { className: "cap" }, "secondary"), /* @__PURE__ */ React.createElement(ActionButton, { variant: "secondary" }, "Share")), /* @__PURE__ */ React.createElement("div", { className: "cell" }, /* @__PURE__ */ React.createElement("span", { className: "cap" }, "ghost"), /* @__PURE__ */ React.createElement(ActionButton, { variant: "ghost" }, "Copy Result")), /* @__PURE__ */ React.createElement("div", { className: "cell" }, /* @__PURE__ */ React.createElement("span", { className: "cap" }, "disabled — flat"), /* @__PURE__ */ React.createElement(ActionButton, { disabled: true }, "Submit")), /* @__PURE__ */ React.createElement("div", { className: "cell" }, /* @__PURE__ */ React.createElement("span", { className: "cap" }, "locale"), /* @__PURE__ */ React.createElement(LanguageToggle, {
			language: lang,
			onChange: setLang
		}))), /* @__PURE__ */ React.createElement("div", {
			className: "row",
			style: { alignItems: "flex-start" }
		}, /* @__PURE__ */ React.createElement("div", { className: "cell" }, /* @__PURE__ */ React.createElement("span", { className: "cap" }, "hud"), /* @__PURE__ */ React.createElement(GameHud, {
			round: 14,
			score: 11,
			currentStreak: 8
		})), /* @__PURE__ */ React.createElement("div", { className: "cell" }, /* @__PURE__ */ React.createElement("span", { className: "cap" }, "capacity — safe"), /* @__PURE__ */ React.createElement(CapacityMeter, { held: 6 })), /* @__PURE__ */ React.createElement("div", { className: "cell" }, /* @__PURE__ */ React.createElement("span", { className: "cap" }, "capacity — danger"), /* @__PURE__ */ React.createElement(CapacityMeter, { held: 10 }))));
	}
	ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(Demo, null));
	//#endregion
})();

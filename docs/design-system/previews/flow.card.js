(function() {
	//#region docs/design-system/previews/flow.card.jsx
	var { FeedbackPanel, OverflowControls, GameOverScreen } = window.OzteriskDesignSystem || window.Ozterisk || window.ozterisk || Object.values(window).find((v) => v && typeof v === "object" && v.FeedbackPanel && v.OverflowControls) || {};
	var t = (d, i, isNew) => ({
		id: "t" + i,
		digit: d,
		isNew: !!isNew
	});
	function Demo() {
		return /* @__PURE__ */ React.createElement("div", { style: {
			display: "flex",
			flexDirection: "column",
			gap: "var(--space-6)"
		} }, /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement("div", { className: "cell" }, /* @__PURE__ */ React.createElement("span", { className: "cap" }, "correct"), /* @__PURE__ */ React.createElement(FeedbackPanel, {
			result: {
				kind: "correct",
				submittedValue: 42,
				correctValue: 42,
				submittedTiles: [],
				rewardTileIds: []
			},
			rewardTiles: [
				t(2, 1, true),
				t(4, 2, true),
				t(8, 3, true)
			]
		})), /* @__PURE__ */ React.createElement("div", { className: "cell" }, /* @__PURE__ */ React.createElement("span", { className: "cap" }, "incorrect"), /* @__PURE__ */ React.createElement(FeedbackPanel, { result: {
			kind: "incorrect",
			submittedValue: 48,
			correctValue: 42,
			submittedTiles: [],
			rewardTileIds: []
		} })), /* @__PURE__ */ React.createElement("div", { className: "cell" }, /* @__PURE__ */ React.createElement("span", { className: "cap" }, "overflow"), /* @__PURE__ */ React.createElement(OverflowControls, {
			requiredCount: 1,
			markedCount: 1,
			perchedTile: t(5, 9, true)
		}))), /* @__PURE__ */ React.createElement("div", {
			className: "cell",
			style: { alignSelf: "stretch" }
		}, /* @__PURE__ */ React.createElement("span", { className: "cap" }, "end of run"), /* @__PURE__ */ React.createElement(GameOverScreen, {
			stats: {
				score: 11,
				totalRounds: 14,
				longestStreak: 8
			},
			copied: true
		})));
	}
	ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(Demo, null));
	//#endregion
})();

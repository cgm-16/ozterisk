(function() {
	//#region docs/design-system/previews/game.card.jsx
	var { Tile, TileInventory, AnswerSlots, EquationBoard } = window.OzteriskDesignSystem || window.Ozterisk || window.ozterisk || Object.values(window).find((v) => v && typeof v === "object" && v.Tile && v.TileInventory) || {};
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
		} }, /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement("div", { className: "cell" }, /* @__PURE__ */ React.createElement("span", { className: "cap" }, "resting"), /* @__PURE__ */ React.createElement(Tile, { digit: 7 })), /* @__PURE__ */ React.createElement("div", { className: "cell" }, /* @__PURE__ */ React.createElement("span", { className: "cap" }, "lifted"), /* @__PURE__ */ React.createElement(Tile, {
			digit: 4,
			state: "lifted"
		})), /* @__PURE__ */ React.createElement("div", { className: "cell" }, /* @__PURE__ */ React.createElement("span", { className: "cap" }, "reward"), /* @__PURE__ */ React.createElement(Tile, {
			digit: 2,
			state: "reward"
		})), /* @__PURE__ */ React.createElement("div", { className: "cell" }, /* @__PURE__ */ React.createElement("span", { className: "cap" }, "marked"), /* @__PURE__ */ React.createElement(Tile, {
			digit: 9,
			state: "marked"
		})), /* @__PURE__ */ React.createElement("div", { className: "cell" }, /* @__PURE__ */ React.createElement("span", { className: "cap" }, "disabled"), /* @__PURE__ */ React.createElement(Tile, {
			digit: 5,
			state: "disabled"
		})), /* @__PURE__ */ React.createElement("div", { className: "cell" }, /* @__PURE__ */ React.createElement("span", { className: "cap" }, "small"), /* @__PURE__ */ React.createElement(Tile, {
			digit: 3,
			size: "sm"
		}))), /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement("div", { className: "cell" }, /* @__PURE__ */ React.createElement("span", { className: "cap" }, "slots — 1 of 2 filled"), /* @__PURE__ */ React.createElement(AnswerSlots, {
			slotCount: 2,
			selectedTiles: [t(4, "a")]
		})), /* @__PURE__ */ React.createElement("div", { className: "cell" }, /* @__PURE__ */ React.createElement("span", { className: "cap" }, "equation"), /* @__PURE__ */ React.createElement(EquationBoard, { equation: {
			left: 7,
			right: 6,
			product: 42
		} }))), /* @__PURE__ */ React.createElement("div", { className: "cell" }, /* @__PURE__ */ React.createElement("span", { className: "cap" }, "rack — 8 of 10, two dead sockets"), /* @__PURE__ */ React.createElement(TileInventory, { tiles: [
			t(1, 1),
			t(2, 2),
			t(3, 3),
			t(5, 5),
			t(6, 6),
			t(7, 7),
			t(9, 9),
			t(0, 0)
		] })));
	}
	ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(Demo, null));
	//#endregion
})();

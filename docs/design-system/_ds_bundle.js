var OzteriskDesignSystem = (function(exports, react) {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	//#region \0rolldown/runtime.js
	var __create = Object.create;
	var __defProp = Object.defineProperty;
	var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames = Object.getOwnPropertyNames;
	var __getProtoOf = Object.getPrototypeOf;
	var __hasOwnProp = Object.prototype.hasOwnProperty;
	var __copyProps = (to, from, except, desc) => {
		if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
				get: ((k) => from[k]).bind(null, key),
				enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
			});
		}
		return to;
	};
	var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
		value: mod,
		enumerable: true
	}) : target, mod));
	//#endregion
	react = __toESM(react, 1);
	//#region docs/design-system/components/game/Tile.jsx
	var SIZES = {
		lg: {
			w: "var(--tile-w)",
			h: "var(--tile-h)",
			font: "var(--size-tile)",
			radius: "var(--radius-md)",
			edge: "var(--shadow-tile)"
		},
		sm: {
			w: "var(--tile-w-sm)",
			h: "var(--tile-h-sm)",
			font: "var(--size-tile-sm)",
			radius: "var(--radius-sm)",
			edge: "var(--shadow-tile-sm)"
		}
	};
	/**
	* A single fired-ceramic digit tile. Every digit in ozterisk is one of these.
	*/
	function Tile({ digit, size = "lg", state = "resting", onClick, label, style }) {
		const s = SIZES[size] || SIZES.lg;
		const interactive = typeof onClick === "function" && state !== "disabled";
		const base = {
			width: s.w,
			height: s.h,
			padding: 0,
			border: "none",
			borderRadius: s.radius,
			background: "var(--surface-tile)",
			color: "var(--text-on-tile)",
			font: `var(--weight-semibold) ${s.font}/var(--leading-tight) var(--font-numeral)`,
			textShadow: "0 1px 0 rgba(255,255,255,.85)",
			boxShadow: s.edge,
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			cursor: interactive ? "pointer" : "default",
			transition: `transform var(--dur-select) var(--ease-settle), box-shadow var(--dur-select) var(--ease-settle)`
		};
		const byState = {
			resting: {},
			lifted: {
				transform: "translateY(calc(-1 * var(--lift-offset)))",
				boxShadow: "var(--shadow-tile-lifted)"
			},
			reward: {
				boxShadow: `${s.edge}, var(--glow-reward)`,
				outline: "1px solid var(--accent)",
				outlineOffset: "-1px",
				animation: "oz-fire var(--dur-reward) var(--ease-snap) both"
			},
			marked: {
				transform: "translateY(calc(-1 * var(--lift-offset))) rotate(6deg)",
				boxShadow: `var(--shadow-tile-lifted), 0 0 0 2px var(--state-discard)`
			},
			disabled: {
				boxShadow: "none",
				opacity: .45,
				cursor: "default"
			}
		};
		const focusEdge = (byState[state] || {}).boxShadow || base.boxShadow;
		return /* @__PURE__ */ react.default.createElement("button", {
			type: "button",
			onFocus: (e) => {
				e.currentTarget.style.boxShadow = `${focusEdge}, var(--ring-focus)`;
			},
			onBlur: (e) => {
				e.currentTarget.style.boxShadow = focusEdge;
			},
			"aria-label": label != null ? label : `Digit ${digit}`,
			"aria-pressed": state === "marked" ? true : void 0,
			disabled: !interactive,
			onClick: interactive ? onClick : void 0,
			style: {
				...base,
				...byState[state],
				...style
			}
		}, digit);
	}
	//#endregion
	//#region docs/design-system/components/flow/FeedbackPanel.jsx
	/**
	* The verdict. States what happened; never congratulates or consoles.
	*/
	function FeedbackPanel({ result, rewardTiles = [], labels = {} }) {
		if (!result) return null;
		const correct = result.kind === "correct";
		const t = {
			correct: "Correct",
			incorrect: "Incorrect",
			submitted: "Your answer: {value}",
			answer: "Correct answer: {value}",
			rewards: "Received {count} tiles",
			...labels
		};
		return /* @__PURE__ */ react.default.createElement("div", { style: {
			display: "flex",
			flexDirection: "column",
			gap: "var(--space-4)",
			alignItems: "center",
			padding: "var(--space-6)",
			borderRadius: "var(--radius-lg)",
			background: "var(--surface-panel)",
			border: `1px solid ${correct ? "var(--border-accent)" : "var(--border-danger)"}`
		} }, /* @__PURE__ */ react.default.createElement("span", { style: {
			font: `var(--weight-medium) var(--size-label)/var(--leading-tight) var(--font-mono)`,
			letterSpacing: "var(--track-label)",
			textTransform: "uppercase",
			color: correct ? "var(--state-correct)" : "var(--state-incorrect)"
		} }, correct ? t.correct : t.incorrect), !correct ? /* @__PURE__ */ react.default.createElement("div", { style: {
			display: "flex",
			flexDirection: "column",
			gap: "var(--space-1)",
			alignItems: "center"
		} }, /* @__PURE__ */ react.default.createElement("span", { style: {
			font: `var(--weight-regular) var(--size-body-sm)/var(--leading-snug) var(--font-ui)`,
			color: "var(--text-body)"
		} }, t.submitted.replace("{value}", result.submittedValue)), /* @__PURE__ */ react.default.createElement("span", { style: {
			font: `var(--weight-regular) var(--size-body-sm)/var(--leading-snug) var(--font-ui)`,
			color: "var(--text-primary)"
		} }, t.answer.replace("{value}", result.correctValue))) : null, correct && rewardTiles.length > 0 ? /* @__PURE__ */ react.default.createElement("div", { style: {
			display: "flex",
			flexDirection: "column",
			gap: "var(--space-2)",
			alignItems: "center"
		} }, /* @__PURE__ */ react.default.createElement("span", { style: {
			font: `var(--weight-medium) var(--size-micro)/var(--leading-tight) var(--font-mono)`,
			letterSpacing: "var(--track-label)",
			textTransform: "uppercase",
			color: "var(--text-meta)"
		} }, t.rewards.replace("{count}", rewardTiles.length)), /* @__PURE__ */ react.default.createElement("div", { style: {
			display: "flex",
			gap: "var(--space-2)"
		} }, rewardTiles.map((tile) => /* @__PURE__ */ react.default.createElement(Tile, {
			key: tile.id,
			digit: tile.digit,
			size: "sm",
			state: "reward",
			label: "New tile"
		})))) : null);
	}
	//#endregion
	//#region docs/design-system/components/hud/ActionButton.jsx
	var VARIANTS = {
		primary: {
			background: "var(--state-incorrect)",
			color: "var(--ink-000)",
			edge: "0 4px 0 #7d2d1f"
		},
		secondary: {
			background: "var(--surface-raised)",
			color: "var(--text-primary)",
			edge: "0 4px 0 #0e2a21"
		},
		ghost: {
			background: "transparent",
			color: "var(--text-body)",
			edge: "none"
		}
	};
	/**
	* Every action in ozterisk. Rises when it becomes available, depresses on press,
	* and lies flat against the felt when disabled.
	*/
	function ActionButton({ children, variant = "primary", disabled = false, onClick, style }) {
		const v = VARIANTS[variant] || VARIANTS.primary;
		const wasDisabled = react.default.useRef(disabled);
		const [rising, setRising] = react.default.useState(false);
		react.default.useEffect(() => {
			if (wasDisabled.current && !disabled) {
				setRising(true);
				const id = setTimeout(() => setRising(false), 260);
				wasDisabled.current = disabled;
				return () => clearTimeout(id);
			}
			wasDisabled.current = disabled;
		}, [disabled]);
		return /* @__PURE__ */ react.default.createElement("button", {
			type: "button",
			disabled,
			onClick,
			style: {
				minHeight: "var(--target-min)",
				padding: "0 var(--space-8)",
				border: variant === "ghost" ? "1px solid var(--border-hairline)" : "none",
				borderRadius: "var(--radius-md)",
				font: `var(--weight-bold) var(--size-label)/var(--leading-tight) var(--font-ui)`,
				letterSpacing: "var(--track-label)",
				textTransform: "uppercase",
				cursor: disabled ? "default" : "pointer",
				background: disabled ? "transparent" : v.background,
				color: disabled ? "var(--text-disabled)" : v.color,
				boxShadow: disabled ? "none" : v.edge,
				outline: disabled ? "1px solid var(--border-hairline)" : "none",
				transform: "translateY(0)",
				animation: rising ? "oz-rise-ready var(--dur-round) var(--ease-snap) both" : void 0,
				transition: `transform var(--dur-press) var(--ease-settle), box-shadow var(--dur-press) var(--ease-settle), background var(--dur-state) var(--ease-standard)`,
				...style
			},
			onPointerDown: (e) => {
				if (disabled) return;
				e.currentTarget.style.transform = "translateY(var(--press-offset))";
				e.currentTarget.style.boxShadow = variant === "ghost" ? "none" : "0 2px 0 #7d2d1f";
			},
			onFocus: (e) => {
				if (disabled) return;
				const ring = variant === "primary" ? "var(--ring-focus-onDanger)" : "var(--ring-focus)";
				e.currentTarget.style.boxShadow = v.edge === "none" ? ring : `${v.edge}, ${ring}`;
			},
			onBlur: (e) => {
				e.currentTarget.style.boxShadow = disabled ? "none" : v.edge;
			},
			onPointerUp: (e) => {
				if (disabled) return;
				e.currentTarget.style.transform = "translateY(0)";
				e.currentTarget.style.boxShadow = v.edge;
			}
		}, children);
	}
	//#endregion
	//#region docs/design-system/components/flow/GameOverScreen.jsx
	function Stat$1({ label, value }) {
		return /* @__PURE__ */ react.default.createElement("div", { style: {
			display: "flex",
			flexDirection: "column",
			gap: "var(--space-1)",
			alignItems: "center"
		} }, /* @__PURE__ */ react.default.createElement("span", { style: {
			font: `var(--weight-medium) var(--size-micro)/var(--leading-tight) var(--font-mono)`,
			letterSpacing: "var(--track-label)",
			textTransform: "uppercase",
			color: "var(--text-meta)"
		} }, label), /* @__PURE__ */ react.default.createElement("span", { style: {
			font: `var(--weight-semibold) var(--size-display)/var(--leading-tight) var(--font-numeral)`,
			color: "var(--text-primary)"
		} }, value));
	}
	/**
	* The run's obituary. Bare rack behind, terminal equation still on screen.
	*/
	function GameOverScreen({ stats, onPlayAgain, onShare, onCopy, copied = false, labels = {
		title: "Game Over",
		reason: "Not enough tiles left to answer.",
		rounds: "Rounds played",
		longestStreak: "Longest streak",
		playAgain: "Play Again",
		share: "Share",
		copy: "Copy Result",
		copiedNotice: "Result copied."
	} }) {
		return /* @__PURE__ */ react.default.createElement("div", { style: {
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			gap: "var(--space-6)",
			padding: "var(--space-10) var(--space-8)",
			textAlign: "center"
		} }, /* @__PURE__ */ react.default.createElement("span", { style: {
			font: `var(--weight-medium) var(--size-label)/var(--leading-tight) var(--font-mono)`,
			letterSpacing: "var(--track-label)",
			textTransform: "uppercase",
			color: "var(--state-incorrect)"
		} }, labels.title), /* @__PURE__ */ react.default.createElement("p", { style: {
			font: `var(--weight-regular) var(--size-body)/var(--leading-body) var(--font-display)`,
			color: "var(--text-body)"
		} }, labels.reason), /* @__PURE__ */ react.default.createElement("div", { style: {
			display: "flex",
			gap: "var(--space-10)"
		} }, /* @__PURE__ */ react.default.createElement(Stat$1, {
			label: labels.rounds,
			value: stats.totalRounds
		}), /* @__PURE__ */ react.default.createElement(Stat$1, {
			label: labels.longestStreak,
			value: stats.longestStreak
		})), /* @__PURE__ */ react.default.createElement("div", { style: {
			display: "flex",
			gap: "var(--space-3)",
			alignItems: "center",
			flexWrap: "wrap",
			justifyContent: "center"
		} }, /* @__PURE__ */ react.default.createElement(ActionButton, { onClick: onPlayAgain }, labels.playAgain), /* @__PURE__ */ react.default.createElement(ActionButton, {
			variant: "secondary",
			onClick: onShare
		}, labels.share), /* @__PURE__ */ react.default.createElement(ActionButton, {
			variant: "ghost",
			onClick: onCopy
		}, labels.copy), copied ? /* @__PURE__ */ react.default.createElement("span", {
			style: {
				width: 34,
				height: 34,
				borderRadius: "var(--radius-sm)",
				background: "var(--state-incorrect)",
				color: "var(--ink-000)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				font: `var(--weight-medium) var(--size-body)/var(--leading-tight) var(--font-display)`
			},
			role: "status",
			"aria-label": labels.copiedNotice
		}, "✳") : null));
	}
	//#endregion
	//#region docs/design-system/components/hud/GameHud.jsx
	function Stat({ label, value, accent, breaking, brokenFrom }) {
		return /* @__PURE__ */ react.default.createElement("div", { style: {
			display: "flex",
			flexDirection: "column",
			gap: "var(--space-1)",
			position: "relative"
		} }, /* @__PURE__ */ react.default.createElement("span", { style: {
			font: `var(--weight-medium) var(--size-micro)/var(--leading-tight) var(--font-mono)`,
			letterSpacing: "var(--track-label)",
			textTransform: "uppercase",
			color: "var(--text-meta)"
		} }, label), /* @__PURE__ */ react.default.createElement("span", { style: {
			position: "relative",
			font: `var(--weight-semibold) var(--size-title)/var(--leading-tight) var(--font-numeral)`,
			color: accent ? "var(--accent)" : "var(--text-primary)"
		} }, /* @__PURE__ */ react.default.createElement("span", { style: { animation: breaking ? "oz-counter-zero var(--dur-break) var(--ease-settle) both" : void 0 } }, value), breaking ? /* @__PURE__ */ react.default.createElement("span", {
			"aria-hidden": "true",
			style: {
				position: "absolute",
				left: 0,
				top: 0,
				color: "var(--accent)",
				animation: "oz-counter-fall var(--dur-break) var(--ease-fall) both"
			}
		}, brokenFrom) : null));
	}
	/**
	* Score, streak and round. Fixed order, never reflows.
	*/
	function GameHud({ score, currentStreak, round, labels = {
		score: "Score",
		streak: "Streak",
		round: "Round"
	} }) {
		const prev = react.default.useRef(currentStreak);
		const [broken, setBroken] = react.default.useState(null);
		react.default.useEffect(() => {
			if (prev.current > 0 && currentStreak === 0) {
				const from = prev.current;
				setBroken(from);
				const id = setTimeout(() => setBroken(null), 700);
				prev.current = currentStreak;
				return () => clearTimeout(id);
			}
			prev.current = currentStreak;
		}, [currentStreak]);
		return /* @__PURE__ */ react.default.createElement("div", { style: {
			display: "flex",
			gap: "var(--space-8)",
			padding: "var(--space-4) var(--space-6)",
			borderBottom: "1px solid var(--border-hairline)"
		} }, /* @__PURE__ */ react.default.createElement(Stat, {
			label: labels.round,
			value: round
		}), /* @__PURE__ */ react.default.createElement(Stat, {
			label: labels.score,
			value: score
		}), /* @__PURE__ */ react.default.createElement(Stat, {
			label: labels.streak,
			value: currentStreak,
			accent: currentStreak > 0,
			breaking: broken != null,
			brokenFrom: broken
		}));
	}
	//#endregion
	//#region docs/design-system/components/hud/CapacityMeter.jsx
	var CAPACITY$1 = 10;
	/**
	* Ten pips: gold = held, translucent = free, vermilion = over capacity.
	* There is no near-capacity tint: vermilion in this system means a tile is
	* leaving, and a warning fill made the margin read as a prediction about the
	* answer in progress. The "10 / 10" above the pips already says you are full.
	*/
	function CapacityMeter({ held, label = "Capacity" }) {
		return /* @__PURE__ */ react.default.createElement("div", { style: {
			display: "flex",
			flexDirection: "column",
			gap: "var(--space-2)",
			alignItems: "flex-start"
		} }, /* @__PURE__ */ react.default.createElement("span", { style: {
			font: `var(--weight-medium) var(--size-micro)/var(--leading-tight) var(--font-mono)`,
			letterSpacing: "var(--track-label)",
			textTransform: "uppercase",
			color: "var(--text-meta)"
		} }, label, " ", held, " / ", CAPACITY$1), /* @__PURE__ */ react.default.createElement("div", {
			style: {
				display: "flex",
				gap: "var(--space-1)"
			},
			role: "img",
			"aria-label": `${label} ${held} of ${CAPACITY$1}`
		}, Array.from({ length: Math.max(CAPACITY$1, held) }, (_, i) => /* @__PURE__ */ react.default.createElement("span", {
			key: i,
			style: {
				width: 15,
				height: 7,
				borderRadius: 2,
				marginLeft: i === CAPACITY$1 ? "var(--space-2)" : void 0,
				background: i >= CAPACITY$1 ? "var(--state-discard)" : i >= held ? "rgba(240,231,214,.16)" : "var(--accent)"
			}
		}))));
	}
	//#endregion
	//#region docs/design-system/components/hud/LanguageToggle.jsx
	var LANGUAGES = [{
		code: "en",
		label: "EN"
	}, {
		code: "ko",
		label: "KO"
	}];
	/**
	* EN / KO. Both locales are first class; this is not a settings screen.
	*/
	function LanguageToggle({ language = "en", onChange, groupLabel = "Language" }) {
		return /* @__PURE__ */ react.default.createElement("div", {
			role: "group",
			"aria-label": groupLabel,
			style: {
				display: "flex",
				borderRadius: "var(--radius-sm)",
				border: "1px solid var(--border-hairline)",
				overflow: "hidden"
			}
		}, LANGUAGES.map(({ code, label }) => {
			const active = code === language;
			return /* @__PURE__ */ react.default.createElement("button", {
				key: code,
				type: "button",
				"aria-pressed": active,
				onClick: () => onChange && onChange(code),
				style: {
					minHeight: "var(--target-min)",
					minWidth: "var(--target-min)",
					padding: "0 var(--space-3)",
					border: "none",
					cursor: "pointer",
					font: `var(--weight-medium) var(--size-label)/var(--leading-tight) var(--font-mono)`,
					letterSpacing: "var(--track-label-tight)",
					background: active ? "var(--accent)" : "transparent",
					color: active ? "var(--clay-900)" : "var(--text-meta)",
					transition: `background var(--dur-state) var(--ease-standard)`
				}
			}, label);
		}));
	}
	//#endregion
	//#region docs/design-system/components/game/EquationBoard.jsx
	/**
	* The round's equation — the largest type in the app.
	*/
	function EquationBoard({ equation, showProduct = false }) {
		if (!equation) return null;
		return /* @__PURE__ */ react.default.createElement("p", {
			key: `${equation.left}x${equation.right}`,
			style: {
				font: `var(--weight-semibold) var(--size-equation)/var(--leading-tight) var(--font-numeral)`,
				letterSpacing: "0.01em",
				color: "var(--text-primary)",
				display: "flex",
				alignItems: "baseline",
				gap: "0.28em",
				animation: "oz-round-rise var(--dur-round) var(--ease-fall) both"
			}
		}, /* @__PURE__ */ react.default.createElement("span", null, equation.left), /* @__PURE__ */ react.default.createElement("span", { style: { color: "var(--accent)" } }, "×"), /* @__PURE__ */ react.default.createElement("span", null, equation.right), /* @__PURE__ */ react.default.createElement("span", { style: { color: "var(--ink-300)" } }, "="), showProduct ? /* @__PURE__ */ react.default.createElement("span", null, equation.product) : null);
	}
	//#endregion
	//#region docs/design-system/components/game/AnswerSlots.jsx
	var emptySlot = {
		width: "var(--tile-w)",
		height: "var(--tile-h)",
		borderRadius: "var(--radius-md)",
		background: "var(--surface-socket)",
		boxShadow: "var(--shadow-socket)",
		border: "1px dashed var(--border-slot-empty)"
	};
	/**
	* One or two ordered answer slots. Slot order is answer order.
	*/
	var CHIPS = [
		{
			dx: "-46px",
			peak: "-36px",
			land: "34px",
			rot: "-140deg"
		},
		{
			dx: "-26px",
			peak: "-54px",
			land: "28px",
			rot: "96deg"
		},
		{
			dx: "-8px",
			peak: "-62px",
			land: "36px",
			rot: "-62deg"
		},
		{
			dx: "13px",
			peak: "-58px",
			land: "30px",
			rot: "124deg"
		},
		{
			dx: "31px",
			peak: "-47px",
			land: "33px",
			rot: "-104deg"
		},
		{
			dx: "51px",
			peak: "-31px",
			land: "26px",
			rot: "162deg"
		}
	];
	var chipStyle = {
		position: "absolute",
		left: "50%",
		top: "50%",
		width: "9px",
		height: "6px",
		borderRadius: "1.5px",
		background: "linear-gradient(160deg, var(--clay-050), var(--clay-400))",
		pointerEvents: "none"
	};
	var ringStyle = {
		position: "absolute",
		left: "50%",
		top: "50%",
		width: "calc(var(--tile-w) * 1.9)",
		height: "calc(var(--tile-w) * 1.9)",
		marginLeft: "calc(var(--tile-w) * -0.95)",
		marginTop: "calc(var(--tile-w) * -0.95)",
		borderRadius: "50%",
		pointerEvents: "none"
	};
	var RINGS = [
		{
			at: 3,
			color: "var(--state-correct)",
			delay: "0ms"
		},
		{
			at: 5,
			color: "var(--gold-500)",
			delay: "70ms"
		},
		{
			at: 8,
			color: "var(--gold-300)",
			delay: "140ms"
		}
	];
	var dustStyle = {
		position: "absolute",
		inset: "-14%",
		borderRadius: "var(--radius-md)",
		background: "radial-gradient(circle at 50% 55%, rgba(240,231,214,.5), transparent 68%)",
		animation: "oz-dust var(--dur-crack) var(--ease-fall) both",
		pointerEvents: "none"
	};
	function AnswerSlots({ slotCount, selectedTiles = [], onReturn, disabled = false, state = "answering", streak = 0 }) {
		const slots = Array.from({ length: slotCount }, (_, i) => selectedTiles[i] || null);
		const correctNow = state === "correct";
		const rings = correctNow ? RINGS.filter((r) => streak >= r.at) : [];
		const goldRim = correctNow && streak >= 5;
		const burst = correctNow && streak >= 8;
		return /* @__PURE__ */ react.default.createElement("div", {
			role: "group",
			"aria-label": "Answer",
			style: {
				display: "flex",
				gap: "var(--rack-gap)"
			}
		}, slots.map((tile, i) => {
			if (!tile) return /* @__PURE__ */ react.default.createElement("div", {
				key: `empty-${i}`,
				style: emptySlot,
				"aria-label": `Answer slot ${i + 1}: empty`,
				role: "img"
			});
			const correct = state === "correct";
			const incorrect = state === "incorrect";
			return /* @__PURE__ */ react.default.createElement("span", {
				key: tile.id,
				style: {
					position: "relative",
					display: "inline-flex"
				}
			}, rings.map((r) => /* @__PURE__ */ react.default.createElement("span", {
				key: r.at,
				"aria-hidden": "true",
				style: {
					...ringStyle,
					border: `2px solid ${r.color}`,
					animation: `oz-ring var(--dur-bloom) var(--ease-settle) ${r.delay} both`
				}
			})), /* @__PURE__ */ react.default.createElement(Tile, {
				digit: tile.digit,
				state: correct ? "reward" : "resting",
				label: `Answer slot ${i + 1}: ${tile.digit}`,
				onClick: disabled ? void 0 : () => onReturn && onReturn(tile.id),
				style: correct ? {
					animation: "oz-bloom var(--dur-bloom) var(--ease-settle) both",
					...goldRim ? {
						outline: "1px solid var(--accent)",
						outlineOffset: "-1px"
					} : null
				} : incorrect ? {
					animation: "oz-crack var(--dur-crack) var(--ease-fall) both",
					boxShadow: "var(--shadow-tile-pressed)"
				} : void 0
			}), burst ? CHIPS.map((c, ci) => /* @__PURE__ */ react.default.createElement("span", {
				key: `chip-${ci}`,
				"aria-hidden": "true",
				style: {
					...chipStyle,
					"--dx": c.dx,
					"--peak": c.peak,
					"--land": c.land,
					"--rot": c.rot,
					animation: `oz-fan var(--dur-burst) var(--ease-fall) ${40 + ci * 12}ms both`
				}
			})) : null, incorrect ? /* @__PURE__ */ react.default.createElement("span", {
				style: dustStyle,
				"aria-hidden": "true"
			}) : null);
		}));
	}
	//#endregion
	//#region docs/design-system/components/game/TileInventory.jsx
	var CAPACITY = 10;
	var socketStyle = {
		width: "var(--tile-w)",
		height: "var(--tile-h)",
		borderRadius: "var(--radius-md)",
		background: "var(--surface-socket)",
		boxShadow: "var(--shadow-socket), var(--rim-socket)"
	};
	/**
	* The rack: ten fixed sockets in 5x2. The grid never resizes — empty sockets
	* are the score.
	*/
	function TileInventory({ tiles = [], mode = "select", pendingDiscards = [], liftedIds = [], onTile, rewardHalo = false }) {
		const cells = Array.from({ length: CAPACITY }, (_, i) => tiles[i] || null);
		return /* @__PURE__ */ react.default.createElement("div", {
			role: "group",
			"aria-label": "Tile inventory",
			style: {
				display: "grid",
				gridTemplateColumns: `repeat(var(--rack-columns), var(--tile-w))`,
				gap: "var(--rack-gap)",
				padding: "var(--space-4)",
				borderRadius: "var(--radius-lg)",
				background: "var(--surface-panel)",
				border: "1px solid var(--border-hairline)"
			}
		}, cells.map((tile, i) => {
			if (!tile) return /* @__PURE__ */ react.default.createElement("div", {
				key: `socket-${i}`,
				style: socketStyle,
				"aria-hidden": "true"
			});
			if (liftedIds.includes(tile.id)) return /* @__PURE__ */ react.default.createElement("div", {
				key: tile.id,
				style: {
					...socketStyle,
					outline: "var(--outline-socket-lifted)",
					outlineOffset: "var(--outline-socket-lifted-offset)"
				},
				"aria-hidden": "true"
			});
			const marked = pendingDiscards.includes(tile.id);
			const state = marked ? "marked" : mode === "readOnly" ? "disabled" : tile.isNew && rewardHalo ? "reward" : "resting";
			return /* @__PURE__ */ react.default.createElement(Tile, {
				key: tile.id,
				digit: tile.digit,
				state,
				label: marked ? "Marked for discard" : tile.isNew ? "New tile" : `Digit ${tile.digit}`,
				onClick: mode === "readOnly" ? void 0 : () => onTile && onTile(tile.id),
				style: tile.isNew && state !== "reward" ? { animation: "oz-fire var(--dur-reward) var(--ease-snap) both" } : void 0
			});
		}));
	}
	//#endregion
	//#region docs/design-system/components/flow/OverflowControls.jsx
	/**
	* Overflow resolution. The arriving tile perches on the rail and will not sit
	* flat until a resident is tipped out.
	*/
	function OverflowControls({ requiredCount, markedCount = 0, perchedTile, onConfirm, disabled = false, labels = {
		instruction: "Choose {count} tile(s) to discard.",
		confirm: "Confirm Discard"
	} }) {
		return /* @__PURE__ */ react.default.createElement("div", { style: {
			display: "flex",
			flexDirection: "column",
			gap: "var(--space-4)",
			alignItems: "center",
			padding: "var(--space-6)",
			borderRadius: "var(--radius-lg)",
			background: "var(--surface-panel)",
			border: "1px solid var(--border-danger)"
		} }, perchedTile ? /* @__PURE__ */ react.default.createElement(Tile, {
			digit: perchedTile.digit,
			state: "lifted",
			label: "New tile",
			style: { transform: "translateY(calc(-1 * var(--lift-offset))) rotate(6deg)" }
		}) : null, /* @__PURE__ */ react.default.createElement("span", { style: {
			font: `var(--weight-regular) var(--size-body-sm)/var(--leading-snug) var(--font-ui)`,
			color: "var(--text-primary)",
			textAlign: "center"
		} }, labels.instruction.replace("{count}", requiredCount)), /* @__PURE__ */ react.default.createElement("span", { style: {
			font: `var(--weight-medium) var(--size-micro)/var(--leading-tight) var(--font-mono)`,
			letterSpacing: "var(--track-label)",
			textTransform: "uppercase",
			color: markedCount === requiredCount ? "var(--accent)" : "var(--text-meta)"
		} }, markedCount, " / ", requiredCount, " marked"), /* @__PURE__ */ react.default.createElement(ActionButton, {
			onClick: onConfirm,
			disabled: disabled || markedCount !== requiredCount
		}, labels.confirm));
	}
	//#endregion
	//#region docs/design-system/components/flow/GameScreen.jsx
	var digitCount = (n) => String(n).length;
	/**
	* The play surface. Vertical order is fixed and never reflows:
	* HUD -> equation -> answer slots -> rack -> actions.
	*/
	function GameScreen({ state, language, onLanguageChange, onSelectTile, onReturnTile, onToggleDiscard, onConfirmDiscard, onSubmit, onNextRound, onClear, labels = {} }) {
		const { phase, equation, inventory = [], selectedTiles = [], pendingDiscards = [], lastResult } = state;
		const slotCount = equation ? digitCount(equation.product) : 1;
		const filled = selectedTiles.length === slotCount;
		const rewardTiles = inventory.filter((t) => t.isNew);
		const requiredCount = Math.max(0, inventory.length - 10);
		const t = {
			submit: "Submit",
			clear: "Clear",
			next: "Next Round",
			...labels
		};
		return /* @__PURE__ */ react.default.createElement("div", {
			lang: language,
			style: {
				width: "100%",
				maxWidth: "var(--arena-max-width)",
				margin: "0 auto",
				display: "flex",
				flexDirection: "column",
				background: "var(--surface-table)",
				backgroundImage: "repeating-linear-gradient(48deg, rgba(255,255,255,.022) 0 2px, transparent 2px 4px)",
				border: "1px solid var(--border-hairline)",
				borderRadius: "var(--radius-xl)",
				overflow: "hidden"
			}
		}, /* @__PURE__ */ react.default.createElement("div", { style: {
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			gap: "var(--space-4)",
			paddingRight: "var(--space-6)",
			borderBottom: "1px solid var(--border-hairline)"
		} }, /* @__PURE__ */ react.default.createElement(GameHud, {
			round: state.round,
			score: state.score,
			currentStreak: state.currentStreak,
			labels: labels.hud
		}), /* @__PURE__ */ react.default.createElement(LanguageToggle, {
			language,
			onChange: onLanguageChange
		})), /* @__PURE__ */ react.default.createElement("div", { style: {
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			gap: "var(--space-6)",
			padding: "var(--space-8) var(--space-6)"
		} }, /* @__PURE__ */ react.default.createElement("div", { style: {
			display: "flex",
			alignItems: "center",
			gap: "var(--space-4)"
		} }, /* @__PURE__ */ react.default.createElement(EquationBoard, {
			equation,
			showProduct: phase === "feedback"
		}), phase === "answering" ? /* @__PURE__ */ react.default.createElement(AnswerSlots, {
			slotCount,
			selectedTiles,
			onReturn: onReturnTile
		}) : null), phase === "feedback" ? /* @__PURE__ */ react.default.createElement(FeedbackPanel, {
			result: lastResult,
			rewardTiles,
			labels: labels.result
		}) : null, phase === "overflow" ? /* @__PURE__ */ react.default.createElement(OverflowControls, {
			requiredCount,
			markedCount: pendingDiscards.length,
			perchedTile: rewardTiles[rewardTiles.length - 1],
			onConfirm: onConfirmDiscard,
			labels: labels.overflow
		}) : null, /* @__PURE__ */ react.default.createElement(TileInventory, {
			tiles: inventory,
			mode: phase === "overflow" ? "discard" : phase === "feedback" ? "readOnly" : "select",
			pendingDiscards,
			onTile: phase === "overflow" ? onToggleDiscard : onSelectTile,
			rewardHalo: state.round <= 2
		}), /* @__PURE__ */ react.default.createElement(CapacityMeter, {
			held: inventory.length,
			label: labels.capacity
		}), /* @__PURE__ */ react.default.createElement("div", { style: {
			display: "flex",
			gap: "var(--space-3)"
		} }, phase === "answering" ? /* @__PURE__ */ react.default.createElement(react.default.Fragment, null, /* @__PURE__ */ react.default.createElement(ActionButton, {
			onClick: onSubmit,
			disabled: !filled
		}, t.submit), /* @__PURE__ */ react.default.createElement(ActionButton, {
			variant: "ghost",
			onClick: onClear,
			disabled: selectedTiles.length === 0
		}, t.clear)) : null, phase === "feedback" ? /* @__PURE__ */ react.default.createElement(ActionButton, { onClick: onNextRound }, t.next) : null)));
	}
	//#endregion
	//#region docs/design-system/components/flow/TitleScreen.jsx
	var RULES = [
		{
			swatch: "socket",
			text: "The rack holds exactly ten tiles."
		},
		{
			swatch: "tile",
			text: "A correct answer spends your tiles and returns one more than you spent."
		},
		{
			swatch: "gold",
			text: "Rewards land in sorted order. Past ten, you must discard."
		},
		{
			swatch: "verm",
			text: "A wrong answer takes your tiles and gives nothing back."
		}
	];
	var SWATCH = {
		socket: {
			background: "var(--surface-raised)",
			boxShadow: "inset 0 1px 3px rgb(0 0 0 / 45%), var(--rim-socket)"
		},
		tile: {
			background: "var(--surface-tile)",
			boxShadow: "var(--shadow-tile-sm)"
		},
		gold: { background: "var(--accent)" },
		verm: { background: "var(--state-incorrect)" }
	};
	/**
	* The only ceremony in the game.
	*/
	function TitleScreen({ onStart, summary, language, onLanguageChange, labels = { start: "Start Run" }, rules = RULES }) {
		return /* @__PURE__ */ react.default.createElement("div", {
			lang: language,
			style: {
				position: "relative",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: "var(--space-8)",
				padding: "var(--space-14) var(--space-8)",
				textAlign: "center"
			}
		}, /* @__PURE__ */ react.default.createElement("div", { style: {
			position: "absolute",
			top: "var(--space-6)",
			right: "var(--space-6)"
		} }, /* @__PURE__ */ react.default.createElement(LanguageToggle, {
			language,
			onChange: onLanguageChange
		})), /* @__PURE__ */ react.default.createElement("div", { style: {
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			gap: "var(--space-4)"
		} }, /* @__PURE__ */ react.default.createElement(Tile, {
			digit: "✳",
			label: "ozterisk"
		}), /* @__PURE__ */ react.default.createElement("span", { style: {
			font: `var(--weight-medium) var(--size-wordmark)/var(--leading-tight) var(--font-display)`,
			letterSpacing: "var(--track-wordmark)",
			color: "var(--text-primary)"
		} }, "oz", /* @__PURE__ */ react.default.createElement("span", { style: { color: "var(--accent)" } }, "✳"), "terisk")), summary ? /* @__PURE__ */ react.default.createElement("p", { style: {
			maxWidth: "52ch",
			font: `var(--weight-regular) var(--size-body)/var(--leading-body) var(--font-display)`,
			color: "var(--text-body)",
			textWrap: "pretty"
		} }, summary) : null, /* @__PURE__ */ react.default.createElement("ul", { style: {
			display: "grid",
			gridTemplateColumns: "repeat(2, 1fr)",
			gap: "var(--space-3) var(--space-6)",
			listStyle: "none",
			padding: 0,
			maxWidth: 620,
			textAlign: "left"
		} }, rules.map((r, i) => /* @__PURE__ */ react.default.createElement("li", {
			key: i,
			style: {
				display: "flex",
				gap: "var(--space-3)",
				alignItems: "flex-start"
			}
		}, /* @__PURE__ */ react.default.createElement("span", { style: {
			width: 18,
			height: 18,
			borderRadius: "var(--radius-sm)",
			flex: "none",
			marginTop: 2,
			...SWATCH[r.swatch]
		} }), /* @__PURE__ */ react.default.createElement("span", { style: {
			font: `var(--weight-regular) var(--size-body-sm)/var(--leading-snug) var(--font-ui)`,
			color: "var(--text-body)"
		} }, r.text)))), /* @__PURE__ */ react.default.createElement(ActionButton, { onClick: onStart }, labels.start));
	}
	//#endregion
	exports.ActionButton = ActionButton;
	exports.AnswerSlots = AnswerSlots;
	exports.CapacityMeter = CapacityMeter;
	exports.EquationBoard = EquationBoard;
	exports.FeedbackPanel = FeedbackPanel;
	exports.GameHud = GameHud;
	exports.GameOverScreen = GameOverScreen;
	exports.GameScreen = GameScreen;
	exports.LanguageToggle = LanguageToggle;
	exports.OverflowControls = OverflowControls;
	exports.Tile = Tile;
	exports.TileInventory = TileInventory;
	exports.TitleScreen = TitleScreen;
	return exports;
})({}, React);

# ozterisk — Design System

> **Contract precedence.** `docs/spec/ui-i18n.md` §1.12 is the contract; this
> directory is the normative source for token values, material rules, and the
> motion inventory it refers to. Where the two disagree, §1.12 wins.

**Start here, then read `decisions.md`.** This file states the rules;
`decisions.md` states why they exist and what was rejected to reach them —
including the refs (`9f`, `10b`, `2a`…) cited throughout this document.

## What this is

**ozterisk** is an endless arithmetic inventory game. It shows one multiplication
equation at a time; you build the answer from digit tiles you physically own.
A digit tile is three things at once:

1. a **resource** required to construct an answer,
2. a **consumable** spent on every submission, and
3. an **inventory-management choice**, because a correct answer returns one net
   tile and can push you past capacity.

The rack holds exactly **ten** tiles. A correct answer spends N tiles and returns
N+1. A wrong answer spends N and returns nothing — those sockets stay empty for
the rest of the run. The run ends when you hold fewer tiles than the next answer
requires. Loss is arithmetic, never a timer.

There is one product: a single-page web game (mobile-first, desktop-capable),
in **English and Korean**.

### Sources this system was built from

- **Codebase** (attached local folder `ozterisk/`, upstream `cgm-16/ozterisk@main`
  — see `github.md` for the screen map) — React + TypeScript + Vite.
  Reducer-driven game core in `src/game/`, ten component families in
  `src/components/`, original plain-neutral tokens in `src/styles/global.css`,
  bilingual copy in `src/i18n/messages.ts`.
- **Product spec** — `ozterisk/docs/spec/product.md` (§1.1–§1.17 game rules) and
  `ozterisk/docs/spec/ui-i18n.md` (visual, language, copy, sharing contracts).
- **Design exploration** (this project) — `1-0 Redesign - Tile House.dc.html`
  (the full options-and-locks document: colour, wordmark, streak ladder, every
  animation) and `ozterisk Storyboard.dc.html` (six scenarios, 21 frames).

The system's **structure and component inventory come from the codebase**. Its
**visual and motion language comes from the locked redesign** — the shipped app
still wears the original neutral near-white skin, which this system replaces.
Where the two disagree, the redesign wins; token *names* were kept from
`global.css` wherever they still meant the same thing, so the handoff diff is
small.

---

## CONTENT FUNDAMENTALS

### Voice

Flat, exact, and unsentimental. The game never congratulates you and never
consoles you. Copy states what happened and what is now true; the consequence is
carried by the board, not by the words.

- **"Correct"** / **"Incorrect"** — not "Nice!", not "Oops".
- **"Not enough tiles left to answer."** — the whole game-over explanation.
- **"Your inventory holds at most ten tiles."** — a rule, stated once.

### Person

Second person for rules and instructions ("**you**r inventory", "**you** must
choose"). Never first person; the game has no persona and never says "I" or
"we". Never a mascot voice.

### Casing

- **Actions are Title Case**: `Start Run`, `Submit`, `Clear`, `Next Round`,
  `Confirm Discard`, `Play Again`, `Share`, `Copy Result`.
- **HUD labels are Title Case single words**: `Score`, `Streak`, `Round`.
- **Rendered meta labels are uppercase mono with letterspacing** —
  `ROUND 4`, `CAPACITY 9 / 10`. The *string* stays Title Case; the uppercase is
  `text-transform`, so Korean is unaffected.
- **Prose is sentence case and ends in a period.** Every how-to-play line is a
  complete sentence.

### Numbers

Digits, never words: "ten tiles" appears in prose, but any countable UI value is
a numeral (`9 / 10`, `Round 14`, `Streak 8`). Equations use the multiplication
sign `×` (U+00D7), never `x` or `*`.

### Interpolation

Copy carries named placeholders resolved at render: `{value}`, `{count}`,
`{position}`, `{digit}`. Never build a sentence by concatenation — Korean word
order differs.

### Bilingual rule

**Every string ships in `en` and `ko` simultaneously.** The Korean tree must
mirror the English tree's exact key structure (enforced by `MessageShape<T>` in
`messages.ts`). Korean is not a translation layer bolted on — it is a first-class
locale. **Zen Kaku Gothic New does not set Hangul** — it is a Japanese family
with no Hangul subset, so `--font-ui` appends Noto Sans KR; without it every
Korean string falls silently to `system-ui`.
Korean copy is likewise plain and instructional: `정답` / `오답`, `게임 시작`.

### Emoji

**None.** Not in UI, not in share strings, not in prose. The one non-Latin glyph
in the brand is the asterisk **✳** in the wordmark, which is typography, not an
emoji.

### Accessibility copy

Every tile and slot carries a spoken label, and it is a full sentence-fragment
with its position: `Answer slot 2: 4`, `Answer slot 1: empty`, `Digit 7`,
`New tile`, `Marked for discard`. Colour is never the only signal — a state
always pairs with a text label or a shape cue.

---

## VISUAL FOUNDATIONS

The metaphor is a **mahjong table**: dark felt, fired ceramic tiles, lacquer and
gold leaf. A digit has weight, an engraved face, and a history of use. You own
exactly ten of them and the table is not on your side.

### Colour

- **Two fields, and only two, per view.** The felt (`--felt-700 #14342a`) is the
  canvas; `--felt-800 #0b211b` is a panel or rail on top of it. Deeper
  `--felt-900` is the surround outside the table. Never three greens in one
  layout.
- **Ceramic is the only light value.** Tiles are a `160deg` gradient from
  `--clay-050 #fdf8ec` to `--clay-200 #e6d7ba` with a `--clay-400 #b3a184` bottom
  edge. That edge colour *is* the tile's thickness and must never be blurred
  into a soft shadow.
- **Gold `#c9a54a` is the brand and the streak.** It marks capacity, the
  wordmark asterisk, links, focus, and reward halos. It is never a background
  fill for a large area.
- **Jade `#4f9d7c` means correct. Vermilion `#b5432f` means incorrect, discard,
  or capacity danger.** Both appear only at the moment of the event and only on
  the object concerned — there is **no full-screen colour wash**, ever.
- **Engraved digits are `--clay-900 #16352b`** — felt-green ink on clay, not
  black. Digits read as fired into the tile, not printed on it.
- The felt carries a barely-there `48deg` 2px repeating stripe at 2.2% white.
  It should read as weave, not as pattern.

**The loss condition is tile *count*, not tile *fit*.** You lose when the rack
cannot fill the answer's slots (`inventory.length < answerLength`) — never
because the exact digits aren't in hand. A full rack facing a product it cannot
spell is a hard round, not a loss: answer wrong, pay the tiles, keep playing.
Any surface that says otherwise is lying about the game. The multiset check
(`canConstruct`) exists only to bias one draw in five toward products the hand
can spell.

**One meaning per hue.** Vermilion means *a tile is leaving* — nothing else. The
capacity meter therefore has no near-capacity tint: gold pips are held,
translucent are free, vermilion appears only for tiles past the tenth, set off
past a gap so `11 / 10` is visible and not merely stated. `--state-capacity-warn`
was removed from the system; a warning fill one step down the same ramp read as a
prediction about the answer in progress.

**Sockets carry both cues or neither.** `--shadow-socket*` plus `--rim-socket`,
always — the inset alone vanishes on the darker felts. And the inset does not
scale: below about 24px, soften it by hand (the 18px title swatch uses
`inset 0 1px 3px rgb(0 0 0 / 45%)` over `--surface-raised`, because `--well-900`
on `--felt-900` is invisible at any shadow). Promote to a token if a third small
socket appears.

### Type

- **EB Garamond** sets every number and every headline. Equations at 68px,
  tile faces at 34px, the wordmark at 52px. Choosing a serif for numerals is the
  single most identity-defining decision in the system: it makes a digit an
  object rather than a readout.
- **Zen Kaku Gothic New** sets Latin interface text, instructions, and buttons.
  It carries no Hangul, so **Noto Sans KR** sits behind it in `--font-ui` and
  sets the entire Korean locale. Both load; neither is optional.
- **IBM Plex Mono** sets labels, HUD captions, and share strings — always
  uppercase with `0.14–0.2em` tracking at 9–11px. This is the only tracked type
  in the system.
- **Hangul is tuned, not merely substituted.** In the `ko` locale the tracked
  label rule is switched off (`--track-label: normal`) and every interface size
  goes up one pixel: Noto Sans KR runs optically smaller than Zen Kaku at the
  same nominal size, and mono tracking pulls already-square syllable blocks
  apart until 라운드 stops reading as one word. This is a token override on
  `:lang(ko)`, so no component opts in — but it does require the locale to
  reach the DOM: set `lang` on the app root (or on the screen, as `GameScreen`
  and `TitleScreen` do from their `language` prop). Switching copy alone leaves
  the override inert and Korean wearing the Latin rule. Uppercase transforms
  stay — Hangul has no case, so they are harmless.
- Body prose gets `text-wrap: pretty` and a `52–74ch` measure.
- **Minimum sizes**: interface text never below 11px; interactive tiles never
  below 44px.

### Layout

One centred vertical arena, `--arena-max-width: 42rem`, on a full-bleed felt
field. Vertical order is fixed and never reflows: **HUD → equation → answer
slots → rack → actions**. The rack is always **ten sockets in 5×2** — the grid
does not resize as tiles are lost, because the empty sockets are the score.

### Backgrounds

Flat felt plus the weave stripe. One permitted decoration: a single soft gold
radial at ~10% opacity in the upper-left of full-page surfaces. **No photographs,
no illustrations, no aggressive gradients, no glassmorphism.**

### Corners and borders

`5px` on compact tiles, `8px` on tiles and buttons, `12px` on panels, `14px` on
the screen frame. Borders are always exactly 1px: `--border-hairline` for
structure, gold at 45% for accent panels, vermilion at 45% for danger. An empty
answer slot is the one **dashed** border in the system (gold at 75%) — dashed
means "something belongs here and does not yet".

### Elevation

Two vocabularies, never mixed:

- **Raised (tiles)** — a hard `0 5px 0 --clay-400` edge plus a soft
  `0 10px 18px rgb(0 0 0 / 45%)` contact shadow. Lifted tiles double the edge;
  pressed tiles halve it.
- **Recessed (sockets)** — `inset 0 4px 9px rgb(0 0 0 / 70%)` over
  `--well-900 #081a14`, with a hairline inset rim. Nothing recessed ever casts an
  outer shadow.

### Transparency and blur

Transparency is used **only for ink and hairlines** (`--ink-100/200/300`,
`--hair-100/200`). **No backdrop blur anywhere.** Ceramic and felt are opaque
materials; a blurred panel would break the metaphor immediately.

### Motion

Motion budget is allocated **by frequency**: what happens every round is fastest
and quietest; what happens once a run can be theatrical.

| Moment | Token | Behaviour |
|---|---|---|
| Tile to slot | `--dur-select` 130ms | flat slide, no arc, no bounce |
| Button press | `--dur-press` 100ms | depress `--press-offset` 2px |
| Round change | `--dur-round` 180ms | old equation falls, new one rises |
| Title entrance | `--dur-entrance` 240ms | tile drops and settles, wordmark fades under |
| Reward tiles | `--dur-reward` 380ms | fire **in place** in sorted position, gold halo |
| Correct answer | `--dur-bloom` 420ms | answer tiles rise 14px and settle; jade ring |
| Wrong answer | `--dur-crack` 520ms | tiles fracture where they stand, dust away |
| Streak break | `--dur-break` 520ms | counter falls off its perch, 0 fades in |
| Streak-8 burst | `--dur-burst` 720ms | six ceramic shards fan off the tile, turn over, fall |
| Share confirm | `--dur-share` 900ms | chop stamps, holds, fades |

Easings: `--ease-settle` for anything that lands and stays, `--ease-snap` for a
single overshoot, `--ease-fall` for gravity with no bounce.

**Where the motion lives.** Anything that only interpolates between two static
states is a *transition* and stays inline on the component. Anything with a
shape — a rise that settles, a fall with gravity, a fracture — is a *keyframe* in
`tokens/keyframes.css`, named for its storyboard ref: `oz-bloom` and `oz-ring`
(2a/7a), `oz-crack` + `oz-dust` (9f), `oz-fire` (9i), `oz-round-rise` (10b),
`oz-counter-fall` + `oz-counter-zero` (10e), `oz-fan` (2d), `oz-rise-ready`
(11d). The six round-frequency moments and the whole streak ladder are wired;
the remaining once-a-run set (8a rim reject, 11a/8c discard, 10i table sweep,
11C title and share) is
specified above but not yet implemented.

Two implementation rules learned the hard way:

- **A composited fade must not nest inside another fade.** In 10e the falling
  counter is a *sibling* of the fading-in zero, not its child — nested, the two
  opacities multiply and the fall is invisible for exactly the half of the
  duration that should read.
- **Feedback must keep the answer slots mounted.** Bloom and crack play on the
  submitted tiles; unmounting the slots on submit leaves the two most frequent
  animations in the game with nowhere to run.

**Locked rules.** A wrong answer is **crack and dust**: both tiles fracture where
they stand and dust away, and the rack does not react — those sockets were
already empty. Reward insertion **fires in place**, never flies in, and shows the
halo only for the first two rounds of a run. Overflow **rim-rejects**: the
eleventh tile perches on the rail and will not sit flat. The felt never lights
up; escalation is the tiles behaving harder, not the table.

The streak ladder is three tiers that **accumulate, never swap** — 3: bloom +
one jade ring; 5: + a second gold ring and a gold rim on the answer tiles; 8: +
a third ring and a six-chip burst. Nothing above 8 escalates. **The burst is a
ceramic fan** (`oz-fan`, `--dur-burst` 720ms on `--ease-fall`): six shards off
the tile's own bottom edge, launched high, turning over at the peak and coming
down. The chips carry clay, never gold — the ceiling of the ladder is the tile
shedding material, not confetti added to the table. Gold in motion was drawn and
rejected: it made the top rung read as a different game. **The bloom is the
floor effect, not the ring**: correct answers at streak 1 and 2 rise and settle
with no ring at all, so tier 1 has something to give. (The storyboard's 2a frame
draws the ring on the first correct answer; the ladder wins — a rung that changes
nothing is not a rung.)

The two failure moments share a tempo at 520ms: `--dur-crack` and
`--dur-break`, both on `--ease-fall`. A miss is slower than a hit — that is
physics, dust settles slowly, not the game consoling you.

`prefers-reduced-motion` neutralises all of it wholesale, including the press
offset.

### Interaction states

- **Hover** raises: felt goes `--felt-700` → `--felt-600`; a tile lifts
  `--lift-offset`. Never an opacity change.
- **Press** depresses 2px and halves the tile edge — the tile gets physically
  shorter.
- **Disabled** drops to `--text-disabled` with no shadow at all: a disabled
  button is flat against the felt, so "not yet" reads as "not raised".
- **Selected / marked** is a 2px vermilion ring plus a 5px lift plus a 6°
  rotation. Three cues, because discard is destructive.
- **Lifted into an answer slot keeps its socket.** A tile committed to the answer
  is still yours until you submit, so it stays in the rack's model and its own
  cell renders empty. Nothing else moves. The rack re-sorts once per round, at
  the resolve, where 10b covers it — never on a tap.
- **A lifted socket is not an empty one.** A socket whose tile is out on loan
  wears the ordinary `--rim-socket` plus `--outline-socket-lifted` — a dashed
  gold rule inset 3px; one whose tile is gone wears the rim alone. Same well,
  different debt. Dashed rather than brighter gold: dashed is already the
  system's word for "something belongs here and does not yet" on the empty
  answer slot, and the lifted socket is saying exactly that. It is also the one
  place a second dashed border is permitted.
- **Focus is an inset bezel, not a halo.** `--ring-focus`
  (`inset 0 0 0 2px --gold-300`) composed after the object's own edge, so the
  ring lives inside the object and follows its radius — a gold edge fired into
  the tile rather than a rectangle floating around it. On vermilion actions use
  `--ring-focus-onDanger`, which adds a felt-dark inner line so gold never sits
  directly against red. Elements with no elevation of their own fall back to the
  global `:focus-visible` outline at `-2px` offset.

---

## ICONOGRAPHY

**ozterisk has no icon set, and that is deliberate.** The source codebase ships
zero icon files — no icon font, no sprite, no SVG directory. Its only asset is
`public/favicon.svg`, which draws the old product name `1-0` as text in a
rounded square (copied to `assets/favicon.svg`, unchanged).

The system's rules:

- **Objects, not icons.** A tile, a socket, and a capacity pip carry the meaning
  an icon would carry elsewhere. Ten pips in a row are the capacity meter; gold
  pips are held tiles, a translucent pip is a free socket, and a vermilion pip
  past the tenth is a tile over capacity — there is no near-capacity tint.
- **The one glyph is ✳** (U+2733, EIGHT SPOKED ASTERISK), set in EB Garamond in
  `--gold-500`. It is the wordmark's centre (oz**✳**terisk), the title-screen
  tile face, and the share chop. It is type, not a logo file.
- **Unicode where a symbol is unavoidable**: `×` (U+00D7) for multiplication,
  `/` for capacity ratios.
- **No emoji, ever.** No CDN icon library is linked, and none should be added
  without a real need — if one becomes necessary, match a 1.5px-stroke outline
  set and flag the addition here.

### Logo

**There is no logo file in the sources, and none was invented.** The brand mark
is a **type treatment**: `ozterisk` set in EB Garamond Medium, `--track-wordmark`
tracking, in `--ink-000`, with the `✳` in `--gold-500`. Render it as text
wherever a mark would go. See `guidelines/wordmark.html`.

---

## Index

| Path | What |
|---|---|
| `styles.css` | Global CSS entry — `@import`s every token file. Link this one file. |
| `tokens/` | `colors`, `typography`, `spacing`, `radius`, `elevation`, `motion`, `keyframes`, `fonts`, `base` |
| `guidelines/` | Foundation specimen cards (colour, type, tiles, motion, wordmark) |
| `components/game/` | `Tile`, `TileInventory`, `AnswerSlots`, `EquationBoard` |
| `components/hud/` | `GameHud`, `CapacityMeter`, `LanguageToggle`, `ActionButton` |
| `components/flow/` | `FeedbackPanel`, `OverflowControls`, `TitleScreen`, `GameOverScreen`, `GameScreen` |
| `ui_kits/game/` | Click-through recreation: title → answering → feedback → overflow → game over |
| `assets/` | `favicon.svg` (from the codebase, unchanged) |
| `decisions.md` | Decision record: why each rule exists, what was rejected, storyboard ref legend |
| `github.md` | Source repo association and screen map |
| `SKILL.md` | Agent Skills manifest, for use in Claude Code |

### Component inventory — and why it is exactly this

The ten families below are **the codebase's own inventory**, one directory each
in `src/components/`. Nothing was added to round out a "standard" set.

`AnswerSlots`, `EquationBoard`, `FeedbackPanel`, `GameHud`, `GameOverScreen`,
`GameScreen`, `LanguageToggle`, `OverflowControls`, `TileInventory`,
`TitleScreen`.

**Intentional additions** (three, each with a reason):

- **`Tile`** — the app renders tile markup inline inside `TileInventory` and
  ``AnswerSlots`` separately. The redesign gives a tile five states (resting,
  lifted, reward, marked, cracking) with real elevation rules; duplicating that
  in two places guarantees drift.
- **`ActionButton`** — actions are bare `<button>` elements in the codebase. The
  redesign's rise-then-depress behaviour and flat-when-disabled rule need one
  owner.
- **`CapacityMeter`** — the ten-pip capacity row exists in the redesign's HUD
  and has no codebase counterpart. It is the only genuinely new UI element.

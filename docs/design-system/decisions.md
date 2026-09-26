# ozterisk — Decision record

`readme.md` states the rules. This file states **why**, and what was rejected to
get there. Read it when you want to change something: most of these constraints
have a reason that isn't visible from the rule alone.

Per-component contracts (props, defaults, per-component prohibitions) were in the
11 `components/**/*.prompt.md` and `.d.ts` files, pruned once every one of them
shipped. The contracts that bind are the implementations in `src/components/`
and their tests, not here.

---

## Storyboard reference legend

`readme.md` and the component prompts cite refs like `9f` and `10b`. They index
frames in **`ozterisk Storyboard.dc.html`** — six scenarios, read left to right.
Every ref that survived into the locked spec:

**Provenance** matters as much as status. *Storyboard* = the frame was drawn and
reviewed with the client; its shape is decided. *Inferred* = the moment was
implied by a locked decision but never drawn, so the shape below is my
construction and is the **first thing to challenge** if it disagrees with the
app. Read the two columns together: an inferred moment that is already built is
where a collision with existing app behaviour is most likely.

**Status** is this design system's own record and is left as it was written:
it says whether the handover shipped a keyframe for the moment, not whether the
product plays it. **Wired in `ozterisk`** is the fourth column, filled in by
`M5.5f`, and the two disagree in both directions — the handover specified four
moments it never built, and built one (`9b`) whose mechanism does not survive
this codebase's non-reflowing rack.

| Ref | Moment | Provenance | Status | Wired in `ozterisk` |
|---|---|---|---|---|
| `2a` | Correct answer: answer tiles rise 14px and settle | storyboard | **built** — `oz-bloom` | `AnswerSlots` `.bloom` |
| `2d` | Streak tier 3: six-chip burst | storyboard | **built** — `oz-fan` | `AnswerSlots`, six chips, streak ≥ 8 |
| `7a` | Streak tier 1: one jade ring | storyboard (frame); **gating inferred** | **built** — `oz-ring`, gated at streak 3 | `AnswerSlots`, streak ≥ 3 |
| `7b` | Streak tier 2: second gold ring + gold rim on answer tiles | storyboard | **built** — `oz-ring` at 70ms | `AnswerSlots`, streak ≥ 5 |
| `7c` | Streak tier 3: third ring, brightest rim | storyboard | **built** — `oz-ring` at 140ms | `AnswerSlots`, streak ≥ 8 |
| `8a` | Overflow: the eleventh tile rim-rejects, perches on the rail | storyboard | specified | `TileInventory` `.rail` — `oz-rim-reject` on every tile past capacity: the newest arrivals, in arrival order (M6a) |
| `8c` | Discard confirm: the marked tile tips off the end | storyboard | **built** — `oz-slide-off` (supersedes `oz-tip-off`) | `TileInventory` `.cellDeparting`, held past the drop — `oz-slide-off`, `--dx 46px --drop 88px --rot 18deg` |
| `9b` | Tile to slot: flat slide, 130ms | storyboard | **built** — transition, not a keyframe | `AnswerSlots` `.arriving` — `oz-slot-arrive`. **A keyframe here**: our slot tile mounts rather than travels |
| `9f` | Wrong answer: crack and dust | storyboard (shape); **duration inferred** | **built** — `oz-crack` + `oz-dust` | `AnswerSlots` `.crack` + `.dust` |
| `9i` | Reward tiles fire in place, in sorted position | storyboard (shape); **fire/halo split inferred** | **built** — `oz-fire` | `TileInventory`, `isNew` cells. Measured firing in both `overflow` and `feedback` |
| `10b` | Round change: old equation falls, next rises | storyboard | **built** — `oz-round-rise` | `EquationBoard`. Only the rise; the fall was never built |
| `10e` | Streak break: counter falls off its perch, 0 fades in | storyboard | **built** — `oz-counter-fall` + `oz-counter-zero` | `GameHud`, as siblings in one cell |
| `10i` | Game over: the last tiles are swept off the rack | storyboard | **struck** — #104, see below | — |
| `11a` | Overflow: tap a resident, it lifts out and tilts | storyboard | specified | `Tile` `.marked` — already a transition, measured in `T53`. No code |
| `11d` | An action becomes available and rises to meet the hand | **inferred** — from "disabled is flat, not dim" | **built** — `oz-rise-ready` | `ActionButton`, a resting offset on `:disabled`. A transition, so `oz-rise-ready` stays unused |
| `11C` | Title entrance (240ms) and share chop (900ms) | storyboard | specified | `TitleScreen` `.markTile` — `oz-title-settle`; `GameOverScreen` `.chop` — `oz-chop` |
| `10d` | Persistent streak rings on the counter | storyboard | **struck** — see below | — |
| `M6` | Classic: a socket seals as the tray descends | **inferred** — from the descending-capacity system | **built** — `oz-seal` + `oz-seal-rim`, `--dur-seal` 180ms | `TileInventory` `.sealing` on the socket a submission closed |
| `8a·2` | The perched tile takes the seat a discard freed | **inferred** — 8a leaves a tile on the rail and nothing collected it | **built** — `oz-perch-drop`, 220ms | `TileInventory` `.cellPerchDrop`, offsets measured from layout when the exits end |
| `M6·0` | House takes a seat: the 21st socket seals at run start | **inferred** | **built** — `oz-seal`, 240ms delay | `TileInventory` `.sealing`, plugs past twenty on the rack's first render |
| `M6·1` | Rack re-seats at a size change (FLIP) | **inferred** | **built** — `oz-reseat`, 300ms, `--ease-settle` | `TileInventory` layout effect, written onto each cell at a size change |
| `M6·2` | New plugs close after the re-seat | **inferred** | **built** — `oz-seal`, 300 + 40·k ms | `TileInventory` `.sealing`, plugs past a new size's top |

### Inferred, and therefore open to challenge

Four things in the built set were not drawn. Each has its reasoning under
*Decisions* below; this is the index for a reviewer diffing against the app.

1. **`--dur-crack` = 520ms** (`9f`). The storyboard locked the shake → fracture →
   dust shape but no length. I chose 520ms to share a tempo with `--dur-break`.
   *If the app already has a miss duration, the app wins — this was never
   drawn.*
2. **The `9i` fire/halo split.** The spec had one "first two rounds" clause; I
   split it so the fire runs every round and only the halo expires. *Check
   against the app's reward rendering — if it ties both to early rounds, that is
   a deliberate existing behaviour, not a bug.*
3. **`7a` gated at streak 3.** The frame drew the ring on the first correct
   answer; the ladder says tier 1 starts at 3. I followed the ladder. *This is a
   genuine contradiction in the locked set, so it needs a human ruling, not a
   diff.*
4. **`11d` exists at all.** No frame for it. It follows from "disabled is flat,
   not dim" — if disabling removes elevation, re-enabling has to restore it
   visibly. *Cheapest of the four to drop if the app disagrees.*

Also inferred, outside the motion set: the 18px socket-swatch shadow literal,
`--rim-socket-lifted`'s value (gold at 34%), the `RECEIVED n TILES` caption
and its Korean string, and the overflow pip treatment on `CapacityMeter`. All
are recorded with their rejected alternatives below.

---

## Decisions

### Motion

**Motion is budgeted by frequency.** What happens every round is fastest and
quietest; what happens once a run can be theatrical.
*Rejected:* uniform timing across all moments — it makes the every-round
feedback feel ceremonial and the once-a-run moments feel cheap.

**Keyframes are for shapes; transitions are for interpolations.** Anything that
merely moves between two static states stays inline on the component; anything
with a shape (a rise that settles, a fall with gravity, a fracture) is a named
keyframe in `tokens/keyframes.css`.
*Why:* keeps the keyframe file small enough to read in one screen, and makes
"which file do I edit" answerable without grepping.

**The two failure moments share a tempo: 520ms, `--ease-fall`.** `--dur-crack`
and `--dur-break`.
*Rejected:* matching the crack to the bloom at 420ms, which was the first
implementation. Symmetry between hit and miss reads as fairness, but dust
settling is physically slower than a tile rising, and the matched timing made
the crack feel clipped. The slower miss is physics, **not** the game consoling
you — that distinction matters, because consoling the player is forbidden by the
voice rules.

**A wrong answer is crack and dust, and the rack does not react.** Both tiles
fracture where they stand. No socket highlights, no rack flash.
*Why:* those sockets were already empty — the tiles left the rack when you
committed them. A rack reaction would be the table telling you off.
*Rejected:* highlighting the emptied sockets in vermilion. It implies the rack
lost something at that instant, which is a lie about the state machine.

**Never express failure as opacity or saturation alone.** `9f` shakes, drops,
and dusts. An earlier `AnswerSlots` implementation faded the tiles to 0.5 and
desaturated them, which the tile spec explicitly forbids: the tile is a physical
object and physical objects do not become translucent.

**Reward insertion fires in place. It never flies in.** `9i`, 380ms,
`--ease-snap`.
*Why:* the tile arrives already sorted. Animating travel from an off-screen
origin implies the rack is a queue you can predict; it isn't.

**Fire and halo were split.** Every arrival fires in place, in every round; the
gold halo only appears in the first two rounds of a run.
*Rejected:* the spec's single "first two rounds" clause covering both, which is
how it was originally written. They expire differently because they do different
jobs — the fire is **positional information** (which sockets just changed, and
you need that most late in a run when the rack is sparse), the halo is
**emphasis** (it teaches "gold means new" during onboarding and is noise after).
*Known risk:* past round 2 the fire has no colour cue, so three simultaneous
arrivals may not read as a group. If that shows up in play, add a one-frame gold
flash inside `oz-fire` — do not reinstate the persistent halo.

**The bloom is the floor effect; the ring is the ladder's first rung, at streak
3.** Correct answers at streak 1 and 2 rise and settle with no ring.
*Rejected:* the storyboard's own `2a` frame, which draws the jade ring on the
first correct answer and labels it "the floor effect." This is a genuine
contradiction between two locked decisions — the ladder says tier 1 starts at 3.
The ladder won: if the ring fires from the first answer, tier 1 changes nothing
when you reach it, and a rung that changes nothing is not a rung.

**The streak ladder accumulates, never swaps.** 3: bloom + one jade ring. 5: + a
second gold ring and a gold rim on the answer tiles. 8: + a third ring and a
six-chip burst. Nothing above 8 escalates.
*Why the ceiling:* a ladder with no top either inflates forever or resets
arbitrarily. 8 is where the tiles are already behaving as hard as they can
without the felt getting involved.

**The felt never lights up.** Escalation is the tiles behaving harder, not the
table reacting.
*Rejected:* background colour shifts and glows on the felt for streaks and
losses — the fastest way to make the mahjong metaphor collapse into a mobile
puzzle game.

**`10d` — persistent streak rings on the HUD counter — was struck from the
spec.** Not deferred; impossible as described. Rings were specified as an
animated burst on the answer tiles; a persistent version on a different element
would have to mean something else, and nothing was defined for it to mean.

**`10i` — the game-over table sweep — was struck from the spec (#104).** Not
impossible as described, unlike `10d`: impossible without new product surface.
The sweep needs tiles on the rack at game over, and the game-over screen has no
rack. Giving it one is a `product.md` §1.10 change, and the question that change
turns on — *should the game-over screen show the final rack at all?* — is a
product question, not a motion one. Ori's ruling is that it should not, so the
moment has nothing to play on and the inventory drops to fifteen. The sweep
shape stays in `ozterisk Storyboard.dc.html` as `sb-sweep`; nothing in
`keyframes.css` was ever authored from it, so the strike removes no code.

**A composited fade must not nest inside another fade.** In `10e` the falling
counter is a **sibling** of the fading-in zero.
*Why:* nested, the two animations' opacities multiply. `oz-counter-zero` holds
0 for its first 45% — exactly the part of the fall that should read — so the
fall was invisible and the zero appeared *during* it rather than beneath it
afterwards. Found in review, not in authoring; worth knowing before you build
`10i` or the share chop the same way.

**Feedback must keep the answer slots mounted.** Bloom and crack both play on
the submitted tiles.
*Why:* unmounting the slots on submit leaves the game's two most frequent
animations with nowhere to run. This is why `AnswerSlots` takes a `state` prop
rather than being conditionally rendered.

**`prefers-reduced-motion` neutralises everything wholesale, including the press
offset.** Handled once in `tokens/base.css`, so it covers keyframes added later
without per-component work.

### Colour

**Two fields, and only two, per view.** Never more.

**One meaning per hue. Vermilion means a tile is leaving.**
*Rejected:* the capacity meter's near-capacity tint (`--state-capacity-warn`,
verm-400, on the last two pips from 9 held). It was one step down the same ramp
as `--state-discard`, so with tiles committed to an answer it read as a
prediction — "these two will be used" — which is not what it meant. The token
was **deleted from the system**, not just unused; the number above the pips
already says you are full.

**Overflow renders as extra pips past a gap**, so `11 / 10` is visible rather
than merely stated.
*Rejected:* leaving the meter at ten pips and letting the number carry it. The
meter exists for exactly one moment and could not show it.

**Sockets carry both cues or neither:** `--shadow-socket*` **plus**
`--rim-socket`. The inset alone vanishes on the darker felts — this is how the
title screen's socket swatch came to be invisible for a full review cycle.

**The socket inset does not scale.** Below roughly 24px, soften it by hand.
The 18px title swatch uses `inset 0 1px 3px rgb(0 0 0 / 45%)` over
`--surface-raised`.
*Rejected:* (a) `--surface-socket` at that size — `--well-900` on `--felt-900`
is invisible at any shadow value; (b) inventing a new colour step for it, which
buys one swatch and costs a ramp; (c) dropping the inset and keeping only the
rim, which reads as a flat chip rather than a well.
*When to revisit:* if a third small socket appears, promote the literal to
`--shadow-socket-xs`.

**A lifted socket is not an empty one.** ~~`--rim-socket-lifted` (gold, 34%)~~
**Superseded by M5.5b (5f)** — the token is removed; a lifted socket now wears
`--outline-socket-lifted` (1px dashed gold at 72%, inset 3px) over the ordinary
`--rim-socket`. The principle stands: plain `--rim-socket` alone for a socket
whose tile is gone. Same well, different debt.
*Rejected:* styling them identically, which was the first implementation — "on
loan" and "lost" are the only two things the rack can say, and it has to say
which.

**Transparency is only for ink and hairlines.** No translucent surfaces, no
blur.
*Why:* felt and ceramic are opaque materials. A blurred panel breaks the
metaphor in one frame.

### Layout and interaction

**Selecting a tile does not reflow the rack.** A committed tile stays in the
rack's model (`liftedIds`) and its own cell renders as an empty socket.
*Rejected:* removing the tile from the inventory array on tap, which was the
original behaviour. It compacted the remaining tiles leftward and re-sorted the
whole rack on every selection — the single worst layout shift in the app, on its
most frequent interaction.
**The rack re-sorts once per round, at the resolve**, where `10b` covers it.
Never on a tap.

**The rack is ten fixed sockets, 5×2, and never resizes.** The empty sockets are
the score.
*Rejected:* a rack that shrinks to fit the tiles you have left. Loss becomes
invisible the moment the container adapts to it.

**Answer slots are fixed 66px reserves** — the slot holds its position whether
filled or empty, so the equation never re-centres between frames.

**Equations stay left-aligned; status strings centre.** Two different kinds of
content, two different alignments.

**The board never prints the product during play.** The answer slots complete
the equation with what the player submitted — blooming on a hit, cracking on a
miss — and the verdict panel is the only place the real number is stated. Only
game over prints it on the board.
*Rejected:* `showProduct` during feedback, which stated two different answers
side by side: `2 × 9 = 18` next to the tiles `1` `8` on a hit, and
`9 × 3 = 27` next to the cracked `9` `8` on a miss.

**Reward tiles in the verdict panel carry a caption** (`RECEIVED 3 TILES`).
*Rejected:* unlabelled tiles under the verdict, which read as a restatement of
the answer just given. The panel labelled everything on the incorrect path and
nothing on the correct one.

**Disabled means flat, not dim.** No shadow at all, so "not yet" reads as "not
raised" — and the enable moment becomes a real event the button can animate
(`11d`). This requires `disabled` to be a genuine prop; intercepting clicks
instead silently removes the moment.

**Discard selection uses three cues at once** — 2px vermilion ring, 5px lift, 6°
rotation.
*Why:* discard is destructive and irreversible. Three cues is deliberate
redundancy, not indecision.

**Hover raises; it never changes opacity.** Felt `--felt-700` → `--felt-600`, or
a tile lifts `--lift-offset`.

**Focus is a two-tone inset bezel**, `--gold-300` over a `--clay-900` inner
line, deliberately distinct from every semantic colour, so focus is never
confused with correct, incorrect, or marked.

### Game logic the design must not misrepresent

**The loss condition is tile *count*, not tile *fit*.** You lose when the rack
cannot fill the answer's slots (`inventory.length < answerLength`) — never
because the exact digits aren't in hand. A full rack facing a product it cannot
spell is a **hard round**, not a loss: answer wrong, pay the tiles, keep
playing.
*This was a real bug in the UI kit*, which gated game over on the multiset check
and ended runs with ten tiles on the rack. Source of truth:
`canAttemptEquation` in `src/game/selectors.ts`. The multiset check
(`canConstruct`) exists only to bias one draw in five toward products the hand
can spell (`KIND_EQUATION_RATE = 0.2`).

**Capacity is 10 because of a balance cliff, not taste.** From
`src/game/balance.ts`: the unbiased buildable rate is ~48% at capacity 10, and
the kind-equation bias pushes the effective rate to ~58% against a cliff at ~63%
where runs stop ending. **Capacity 11 already crosses the safety margin and
fails the economy test.** Below 10 also fails, because the starting inventory
hardcodes ten tiles.
*Consequence for design:* the "ten sockets" figure is load-bearing. Do not
change it for layout reasons — changing it requires retuning
`KIND_EQUATION_RATE` first.

**A correct answer returns exactly one more tile than you spent**
(`REWARD_BONUS = 1`). At 0 the overflow mechanic disappears entirely; above 1
runs become unloseable.

### Type

**`--font-ui` is two families, not one: Zen Kaku Gothic New then Noto Sans KR.**
Zen Kaku Gothic New is a Japanese family and ships no Hangul subset, so the
Korean locale — half the product's copy — was resolving to `system-ui` on every
platform. Latin resolves from Zen Kaku first and Hangul falls through per-glyph,
so the order is load-bearing.
*Rejected:* replacing Zen Kaku with a single pan-CJK face. It would set both
scripts from one file, but Noto Sans KR's Latin is noticeably wider and flatter
than Zen Kaku's, and the Latin interface text is what the type system was tuned
against.
*Note:* an earlier draft of `readme.md` claimed Zen Kaku "sets both scripts."
It never did. If you see that sentence anywhere downstream, it is stale.

### Content

**The game never congratulates and never consoles.** `Correct` / `Incorrect`,
not "Nice!" or "Oh no". No grade, rank, or judgement on the game over screen —
rounds played and longest streak, stated flatly.

**Every string ships in English and Korean simultaneously**, mirroring the
English key structure exactly. Korean is not a translation layer added later.

**No emoji, anywhere.** The one non-Latin glyph in the brand is the `✳` in the
wordmark, which is typography.

**No icon set, deliberately.** The source codebase ships zero icon files. The
system's iconography is **material swatches** — a socket, a tile, a gold pip, a
vermilion pip. If a future need is genuinely unmet, that is the moment to
introduce an icon set and record it, not to smuggle one in.

**There is no logo, and none was invented.** The mark is a type treatment:
`ozterisk` in EB Garamond Medium, `--track-wordmark`, `--ink-000`, with the `✳`
in `--gold-500`. Rendered as text, never as an image.

**The favicon is the one surface where the ✳ is drawn rather than set.**
`public/favicon.svg` builds the mark directly in SVG markup: eight gold spokes
on a felt rounded square.
*Why:* a favicon has to render at sizes as small as 16px before any web font
is guaranteed to have loaded, on a machine that may not have the wordmark's
font at all — a type treatment cannot survive that, so the glyph is drawn
instead of set for this one surface. Geometry is locked: eight arms on a 45°
rotation step, each spanning 24° (half-angle 12° at the centre vertex),
leaving a 21° gap between arms so the spokes read as separate, not a fused
star. `--gold-500` (`#c9a54a`) on `--felt-700` (`#14342a`), a rounded square;
the hex values are inlined in the SVG because a file in `public/` cannot read
CSS custom properties.

---

## Open

- **Font redistribution notice.** M5.5b self-hosted EB Garamond, IBM Plex Mono,
  Zen Kaku Gothic New and Noto Sans KR via their `@fontsource/*` packages.
  Licence checked in `package-lock.json`: all four resolve to OFL-1.1
  (`@fontsource/eb-garamond`, `@fontsource/ibm-plex-mono`,
  `@fontsource/zen-kaku-gothic-new`, `@fontsource/noto-sans-kr`, each
  `5.3.0`), which permits self-hosting, bundling, and redistribution. Not
  verified: OFL §2 requires the copyright notice and licence text to
  accompany redistributed copies of the fonts. Each `@fontsource` package
  ships a `LICENSE` file, but the build copies only the font binaries
  (`.woff2`/`.woff`) into `dist/assets/` — no licence text ships alongside
  them. Whether that satisfies §2 is still open.
- **Logo.** None exists. If the brand ever needs a mark that isn't type, it is a
  new design problem, not a derivation of this system.
- **Four motion refs specified but not built** — **resolved, see the note
  below** — `8a`, `11a`/`8c`, `10i`,
  `11C`. (`7b`, `7c` and `2d` were wired in the pruned
  `components/game/AnswerSlots.jsx`.)
  None of the four has a duration or easing in `tokens/motion.css` either, so
  the milestone that implements each one assigns both.
  **Provenance:** none of the four is an original design. `ozterisk
  Storyboard.dc.html` already carries their shapes as `sb-*` keyframes —
  `sb-rim` (8a), `sb-drop` (11a), `sb-slide` (8c), `sb-sweep` (10i),
  `sb-settle` and `sb-stamp` (11C). Port those rather than authoring new ones.
  The canvas frames hold across a 2.6s infinite loop, so each must be
  renormalised to 0–100% of its useful range when retimed to a one-shot.

  > **Resolved by `M5.5f` and `M5.5g`.** `8a`, `8c` and `11C` were ported from
  > those `sb-*` shapes and are wired; `11a` is a transition on `Tile.marked`
  > rather than a keyframe. `10i` is struck — see the strike note under
  > *Motion*. The renormalisation warning held: `sb-rim` also carried its pivot
  > inline on the element rather than in the frame, and porting the frames alone
  > dropped it.
- **Verification against the shipped app.** The overflow panel is where the
  storyboard and the codebase disagree most; the redesign wins on visuals, but
  the *states* should be checked against `src/components/OverflowControls/`.
- **The UI kit is a state tour, not a balance test.** It ports
  `KIND_EQUATION_RATE` and the real loss condition, but not the reducer's exact
  action ordering. Do not tune game balance from it.

## M5.5b — four judgement calls, resolved

Four questions the prose could not settle were drawn as live candidates in
*Open Questions — M5.5b* and decided by review.

**2d burst — ceramic fan (5a).** Six shards off the tile's own bottom edge:
launched high, turning over at the peak, falling. `oz-fan`, `--dur-burst` 720ms
on `--ease-fall`. *Rejected:* **gold leaf (5b)**, slower and drifting — the only
candidate that spent gold in motion, and it made the top rung read as a
different game; **low skid (5c)**, flat and fast, which read as force rather than
reward. The fan wins because the burst is then made *of* the object rather than
added to it — consistent with "escalation is the tiles behaving harder, not the
table".

**Lifted socket — dashed gold rim (5f).** The shipped gold-at-34% inset rim
(5d) measured 1.94:1 against the well and was unreadable at a glance. Rather
than simply brighten it (5e, gold at 78% doubled), the lifted socket now borrows
the empty-answer-slot vocabulary: `--outline-socket-lifted`, 1px dashed gold at
72%, inset 3px, over the ordinary `--rim-socket`. Dashed already means
"something belongs here and does not yet", which is precisely a tile out on
loan. *Rejected:* **5g**, a gold footprint bar on the socket floor — the best
object story of the four, but it adds an element to a shape that was
deliberately empty. `--rim-socket-lifted` is removed from the system.

**Focus — inset bezel (5j), two-tone.** `--ring-focus` moves the ring inside
the object, following its radius: focus is a gold edge fired into the tile, not
a rectangle floating around it. It carries a `--clay-900` inner line under the
gold. *Rejected:* the shipped 2px offset ring (5h), gold directly against
vermilion; **5k** lacquer double rule, too quiet to find on a busy rack.

*Amended after measurement.* The bezel first shipped single-tone, which changed
the ring's geometry but not its tone: `--gold-300` reads `1.10:1` against
`--clay-200` and `1.51:1` against the gold toggle segment, so an inset gold ring
puts the same failing gold *on* the ceramic instead of beside it. Every digit
tile is a `<button>`, so that is the app's most-focused surface. Darkening the
ring instead fails the mirror image — `--clay-900` reads `1.02:1` on felt — so
the palette admits no single tone. Two tones is not a compromise here; it is the
only arrangement that satisfies §1.12.

This overlaps the rejected **5i**, two-tone with a dark separator, judged to
read as engineering rather than material. That judgement stands against a
separator — a third element introduced to hold two others apart. This is not
one: `--clay-900` sits within `1.02:1` of `--felt-700`, so the inner line reads
as the felt showing through the bezel, the same dark the tile's socket is cut
from. The system already shipped the shape on vermilion; this generalises it and
makes the line opaque. `--ring-focus-onDanger` is therefore removed — with the
base ring carrying a dark line, the danger variant was the same idea with a
weaker `55%` inner line, measuring `2.05:1` against vermilion where the opaque
line measures `2.41:1`.

**Korean — Hangul-tuned (5m).** Tracking off and one pixel up, as a token
override on `:lang(ko)`. Applying the Latin mono rule unchanged (5l) pulled
already-square syllable blocks apart until 라운드 read as three characters
rather than one word, and Noto Sans KR runs optically smaller than Zen Kaku at
the same nominal size. No component opts in; the override is invisible to
callers.

---

## M6 — Classic, merged from the M6 handoff (24 Sep 2026)

Merged from `docs/design_handoff_m6_classic/decisions.md`. The **24 Sep** calls
below supersede the **21 Sep** tray theme recorded after them: the rack keeps
felt-cut sockets and closed sockets are felt plugs, not lacquer boards, and there
is no wind tile or felt drift. The 21 Sep record is kept because its economy
reasoning (cadence, the cliff, why Classic is winnable) still stands. Two
handoff items are **not** adopted: `10i` stays struck (#104), and the fire/halo
split stays unbuilt. Mean density was dropped from the M6 scope as a score.

### Found by building the run (Classic)

- **Classic's rack cannot be scrolled.** Twenty 64px sockets in 5×4 need 344px,
  which does not fit the phone beside a HUD, an equation, slots, a verdict and
  the actions. The rack is the one element that must not give: empty sockets
  *are* the score, so a rack you have to scroll to read is the game hiding its
  own state. Classic buys the fourth row by tightening the rack gap to 8px and
  dropping the pip meter (twenty sockets and ten pips are two disagreeing
  accounts of one number anyway) — never by clipping.
- **The tray descent needs its own beat.** Firing the seal alongside the round
  change loses it: there is one effect record and `round` wins. The seal also
  closes a socket that is already past the new capacity, so the rack has to
  keep rendering it until it has finished closing. 220ms of breathing room
  between the seal and the new equation.

### The overflow flow is three taps, not five

The prototype had drifted from the repo: select → Submit → Next Round → mark →
Confirm Discard. The repo's reducer already sends an overflowing correct answer
straight from `SUBMIT_CORRECT` to `overflow`, and `GameScreen` completes a
forced single discard on the marking tap. The prototype now does both, and goes
two steps further:

- **The tap that marks the last tile that must go completes the discard**, at
  any count. The repo keeps Confirm for more than one tile, which only Classic
  produces; generalising the single-tile rule removes the only button Classic
  added. Earlier marks can still be taken back until that final tap.
- **No Next Round after a discard.** The discard is the player's acknowledgement
  of the round, so the next equation comes in once the tile has left and the
  perched tile has seated. Next Round remains for a round with nothing to
  resolve.
- **Classic's seal moves to Submit.** Boards drop on submissions, so resolving
  the seal there lets the overflow count include it, and the discard is asked
  for in the same beat as the verdict. The rail tile is discardable too.

### The newest tile perches, not the highest (locked 24 Sep 2026)

The rack stays auto-sorted in both modes, but on a correct answer only the tiles
that fit are sorted; the ones past capacity are the latest arrivals, in arrival
order, and they go to the rail. Sorting first sent the rail the highest digits
every time, so the rim reject read as "the 9s get thrown out", which is worse
the longer Classic goes on. Only the +1 of a correct answer can cause overflow
(a miss or a seal alone can't), so the tiles past capacity are always ones that
just came back. Tiles that stay on after a discard drop into the socket that was
freed, and the rack re-sorts at the next round under the round rise (10b), which
keeps the one-sort-per-round rule. Unsorting Classic was rejected: it breaks
that rule and makes reading the hand a chore that says nothing about skill.

### Classic's rack steps its tile size with capacity (locked 24 Sep 2026; 15/10 thresholds pending device playtest)

At 64×80 in 5 columns, twenty sockets take four rows (~356px) and won't fit a
667px-tall phone. Rather than shrinking tiles everywhere or making the rack
scroll, the rack has three sizes: **7 × 44×55** at 16–20 sockets, **6 × 48×60**
at 11–15, and at 10 and below the home rack, which is the Endless rack at its
own tiers (§1.12): a fixed 5 × 64×80 is 352px wide and does not fit the 281px
the 320px gate leaves. Every size is about 180px
tall. The tiles grow as the table empties, and from 10 sockets on, Classic's
rack is the same as Endless's. The size changes only at the round change, along
with the re-sort, under 10b; never under a seal. The rail tile follows the rack
size so the perch-drop lands true. The answer slots stay full size. 44px is the
floor (`--target-min`), and the small size uses `--radius-sm`. The thresholds
(15 and 10) are tweaks in Playable Run and still need a playtest on a real
device.

### Closed sockets stay as sealed plugs (locked 24 Sep 2026)

With the rack in stepped sizes, capacity rarely fills whole rows: 20 in 7
columns leaves one hole at the start, and every seal opens another. Each size
now keeps a fixed footprint of whole rows for its top capacity (21 / 18 / 10),
and closed sockets stay on as **sealed plugs**, which look like the resting state
of `oz-seal`: flush with the felt, a rim, and no well. The rack is always a full
rectangle, and the plug count shows the descent. The one plug at the start is
matched by the first real seal at submission 2. The 6-column size starts with 3
plugs, and the plugs move with the resize under 10b. Going back to 5×4 at 64×80
was rejected: it only fixes the first round, and the rack needs scrolling again.

### The rack's size changes are shown, not cut (locked 24 Sep 2026)

The instant resize and the plugs were correct but not explained, so the jump
cut is now the reduced-motion path and full motion adds three moments, all
built from existing parts: **M6·0 House takes a seat**: the 21st socket seals
(`oz-seal`) 240ms into the first round, and submission 2 repeats it.
**M6·1 Rack re-seats**: at the round where the size changes, the tiles lift
together, travel from their old seat and size to the new one, and set down
(`oz-reseat`, a FLIP with caller-supplied `--fx/--fy/--fs`, 300ms,
`--ease-settle`). The re-sort rides the same motion. **M6·2 New plugs
close**: the extra cells in the new grid seal 40ms apart once the tiles have
landed. A resize round runs about 560ms, twice a run.

### M6 closed, 24 Sep 2026

- Table sweep stays at 700ms; judged right in context.
- Run length (~30 submissions, ~6.5 min) is kept; revisit once M7 face-sets move the win rate.
- "House takes a seat" is kept.
- Floor moves 6 → 5 when M7 ships.
- Stepped rack and plugs are promoted into `TileInventory` (`stepped`, `drawnCapacity`, `capacity`; `rackTier` and its 15/10 thresholds in `rackTier.ts`; the re-seat reads the previous render, so there is no `reseatFrom` prop — T71, T73).

## M7 — Face-set tiles, merged from the M7 handoff (26 Sep 2026)

Merged from `docs/design_handoff_m7_face_tiles/decisions.md`: the three sections
after *M7 opening calls*. The rest of that file is an upstream copy of this one.

### M7 opening calls, 24 Sep 2026

- **No digit picker.** A face-set tile placed in a slot counts as the right digit if that digit is in its set; if not, the answer is wrong and is paid for like any wrong digit. Misplacing a special is a legitimate way to lose, and removing the picker removes the game's only would-be modal.
- **Faces are not Hangul.** 홀 / 짝 are rejected as tile faces; they don't read as engraved objects and they tie a numeral game to one locale.
- **Sets under study:** Wildcard, Odd, Even, Low 0–4, High 5–9, plus **Neighbours** (three consecutive digits, no wrap: 0·1·2 … 7·8·9). Face notation for Neighbours is open between `4–6` (joins the range family) and `5±1`.
- **Material:** clay like a digit tile, set apart by an edge or inlay, not a new material.

### M7 interaction calls, 26 Sep 2026

- **Keyboard:** a digit key takes a digit tile first; with none, the **narrowest face** that holds the digit; ties go to the **leftmost in rack order**.
- **"Your answer" text:** a wrong answer prints faces as engraved, slots joined by a middle dot when a face is present — `O·3`, `0–4·3`; `0–43` was rejected because it reads as "zero to forty-three". Same engraving in Korean. A **correct** answer prints the product it counted as: `43`.
- **Face tiles ship in Classic only.** Endless was not simulated with them and they push it toward the 63% cliff.
- **Share text unchanged** — no face count.
- **Face rate dial:** 8%, documented safe range **5–10%**.
- **Handoff:** same shape as M6 (`design_handoff_m7_face_tiles/`).

### Run Complete themed, 26 Sep 2026

- **A Classic win is gold, with its final hand** (`Run Complete Theming.dc.html` 1c). Upstream set both verdicts in `--verm-400`; vermilion means a tile is leaving, so a win in it read as a loss. The win's verdict is `--gold-500` (8.7:1 on the surround), and the slot the loss gives its terminal equation holds the floor's sockets with the tiles still in them. Gold-only (1a) and jade (1b) were drawn; jade was rejected because it belongs to the moment of an answer, on the tile concerned.

### M7 research accepted, 25 Sep 2026

See `M7 Face-Set Research.dc.html`.

- **Even is `0·2·4·6·8`.** Odd and Even are both five; 0 cannot be in Low and missing from its parity.
- **Face rate 8% of reward draws — a new dial, separate from the 20% kind draw** (which is the equation retry toward spellable products; the first research draft conflated the two). Within faces, weight by 1 / set size: Wildcard 0.65%, each five-set 1.3%, Neighbours 2.16% of reward draws.
- **Simulated (start 20, floor 5, N 2, kind 20%, 3,000 runs):** face rate 0 / 5 / 8 / 10 / 20% → 47 / 56 / 62 / 65 / 81% wins at skill 95%; 36 / 44 / 50 / 54 / 72% at 85%. Inverse vs flat weighting moves wins ≤1.6 pts — it is a feel choice. Floor 6 with 10% faces is 81%, so floor 5 is confirmed.
  *Provenance (26 Sep 2026):* `m7_sim_results.json` holds face rates 5 / 10 / 15 / 20 / 25 / 30% at skill 95% and 0 / 10 / 20% at skill 85%. The 8% column at both skills, and 5% at skill 85%, are not in it: they read as interpolated, not simulated. The measured bracket around 8% is 56–65% wins at skill 95%. `FACE_RATE` 0.08 sits inside the measured 5–10% range, so the ruling stands.
- **Two notation grammars:** ranges (Low, High, Neighbours) as `a–b`; parities as a set. Wildcard keeps ✳. `4–6` vs `5±1` is decided in `M7 Face Tile Directions.dc.html`.
- **Neighbours reads `4–6`.** `5±1` rejected: a second operator, with a tolerance connotation.
- **Direction: Cartouche (1a)** — gold inlay rule — with Garamond capitals O / E for parity instead of the engraved set. **Letter alone (2a) chosen, 25 Sep 2026** — O / E at digit scale, no set line. 2b (letter over set) rejected as busier. Known risk: a Garamond O sits close to 0; the inlay is the only separator, and the spoken label carries the full set.
- **No face-specific feedback line, 26 Sep 2026.** The cracked face still shows its set above the correct answer; a wrong digit gets no reason line either, so faces are not special-cased. `feedback.faceMiss` was drafted and cut.
- **Reward on a face tile** uses the digit's exact treatment (1px gold outline + `--glow-reward`, `oz-fire` in place). Reviewed in `Motion Lab.dc.html` → "Face tile fires" (9i·M7), where a digit and a face fire in the same resolve. **Accepted 26 Sep 2026:** the glow is identical by design — reward means *new*, the inlay means *special*. A longer fire for faces was offered and not taken.

## M6 + M7 — Classic mode, settled 21 Sep 2026

Designed across five documents in this project (see `readme.md`'s index) and
settled over a 25-round review. Not in the repo: `docs/plan/roadmap.md` names M6
and M7, but neither `product.md` nor `ui-i18n.md` mentions Classic, so the visual
contract was genuinely open.

### The theme — a hanchan on a wooden tray

**Classic is a two-wind mahjong half-game.** The metaphor was already a mahjong
table, and mahjong owns a finite arc the game had never used: a hand ends by
*ryuukyoku* when the wall runs out, and the wall's last tiles are reserved —
present, visible, permanently out of play. That is exactly a retired socket.

- **The rack becomes a tray.** Dark wood, warmer and darker than the ceramic so
  the tiles sit forward. Ten sockets cut into it — twenty at Classic's start —
  plus one reserved cut at the right end for the wind marker. *Rejected:*
  lacquer (spoken for by the boards), stone, bamboo (that is the tile's own
  backing). Endless keeps felt-cut sockets.
- **A retired socket is boarded over** with lacquer — the table's own finish
  closing the gap, flush, no tile. *Rejected:* a face-down tile, which reads as
  *owed* rather than gone.
- **The march is a fact, not a choice.** Boards run row-major right to left.
  Player nomination was chosen in review and then **dropped**: it contradicted
  the fixed march, and a march the player can read beats a choice they must make.
  The lacquer seam survived by changing jobs — it now forecasts the next board
  one drop ahead instead of marking the player's pick.
- **The floor line** is carved from round one, a short vertical cut where the
  march stops. The last board fills it with lacquer.
- **The wind** is a ceramic tile — the one tile never played — that spins flat
  180° in its cut, 東 → 南, **in both locales**. It is an object on the table, not
  copy to translate.

### The felt rule, rescoped

The locked rule was "the felt never lights up; escalation is the tiles behaving
harder, not the table." That was written to keep the **streak ladder** from
getting flashy in an endless mode with no arc to spend escalation on — it is a
claim about frequency, not about material.

**Rescoped: the felt never reacts to a *play*.** A mode with phases may drift it
by round. The distinction is *positional* versus *reactive* — a Slay the Spire
act's biome does not respond to anything, it is where you are; Balatro's ground
responds to what just happened. Classic's ground is positional, so the streak
ladder still owns every per-play escalation. The ladder itself runs in Classic
unchanged.

Consequence: a moving ground would turn every recorded contrast figure into one
number per round, so **ink never sits on the felt** — panels and labels take an
opaque carrier plate, and the tray does that job for the rack. One exception
accepted deliberately: the empty answer slot's dashed gold stays on the felt,
verified at both drift ends with a narrower margin at the far one. Under
`prefers-reduced-motion` the ground snaps to two static felts.

### Cadence — and what the simulation overturned

| Dial | Value | Why |
|---|---|---|
| Starting capacity | 20 | Board count is `start − floor`, so the start is the *decision* budget. |
| Opening hand | Full, round-robin | Two of every digit at 20. **This is what makes the tray bind at all.** |
| Floor | 5 (6 before M7 ships) | The economy doc's figure is 6 — where a wildcard is worth ten digits in one slot. |
| N | 2 submissions per board | Correct *or not*. The only dial that cuts playtime without spending boards. |
| Run | 15 boards, 30 submissions | ~6.5 min, ~47% win rate at the shipped 20% kind rate. |

**Boards count submissions, not correct answers.** Correct-answer-driven boards
would mean the tray watches how well you are doing and moves accordingly — the
same thing the felt is forbidden from doing. A submission clock is positional.

Three things a simulation of the real 45-equation draw corrected, each recorded
because the wrong version was written down first:

1. **The cliff is real and derivable.** A correct answer nets +1; a miss costs
   the answer's length, mean 1.71 digits. Drift is zero at `1.71 / 2.71` =
   **63.1%** — the economy doc's figure, falling out of the shipped rules rather
   than assumed.
2. **There is no protected "buffer act."** Duplicates add no reach (no product of
   two single digits repeats a digit), so they looked like free early discards.
   But answering also consumes digits and returns random ones, so the tidy
   opening is churned away by *play* within a few submissions. The two-act
   structure and its East/South alignment are withdrawn.
3. **A board drop and an overflow are different events.** A clamp *at* a board is
   the tray taking a socket — Classic's mechanic. A clamp between boards is
   ordinary overflow, which Endless already has. Conflating them produced an
   impossible "13.2 of 15 boards."

### Why Classic is winnable *and* scored

Classic cannot have a definite arc, an uncapped high score, and no stable loop —
pick two. M7's face-set tiles let a hoarding player re-cross the cliff *upward*,
which at a fixed floor is a stable loop: Classic becomes Endless with a wooden
tray. Burgun named this in 2017 as "the problem of ever-expanding match length."

The resolution is Tetris Marathon's: **the arc is the course, the score is your
round on it.** Reaching the floor is the win — the entry ticket — and **mean
density** (coverage per socket) is the score that separates two players who both
finished. A pure high-score build was rejected on its own terms: friend-versus-
friend comparison needs a shared seed, which imposes a fixed arc anyway.

- **Skill's language across the three eras:** preserve → ration → **concentrate**.
  The metric moves from coverage `b` to density, `b` per socket.
- **Dead-end detection is struck.** It existed only because nothing else ended
  the run; reaching the last board is a counter comparison.
- **Exhaustion became a win.** The settle-with-face-down-tiles ending specified
  for a defeat was always the shape of an arrival. This resurrected
  `--surface-tile-back` — one token, used once per run, and it earns it.
- **No leaderboard.** The share string is the leaderboard; the chop carries the
  wind the run ended in. Public daily leaderboards fail predictably (hackers,
  unreadable, scores expiring); friend-scale comparison does not.

### Open, and needing playtest rather than design

- **The win rate is the whole calibration.** Wordle's unsung feat is landing
  where the average player wins most days but losses still feel earned. ~47% is
  in band by the model, but the model does not include M7 face-sets (which will
  raise it) and its simulated player never reasons about coverage.
- **Playtime.** 6.5 minutes runs longer than Wordle or Connections. Accepted as a
  baseline to trim on feedback; N is the dial, at ~2 minutes per step.
- **Daily seed or freeplay.** A seed makes friend comparison valid but imposes
  one run a day. Dead Cells and OlliOlli chose opposite answers and both
  defended it.
- **Does the floor descend on repeat wins?** The Ascension pattern fits, but it
  is the meta-system this project cut.
- **The digit picker** for face-set tiles is the first modal choice in a game
  with none, and it fires mid-answer. It should be tiles, not a menu.
- **A 5×4 tray at 320px** is the hardest layout problem in the project; §8.5
  needs re-walking.

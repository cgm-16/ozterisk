# ozterisk — Decision record

`readme.md` states the rules. This file states **why**, and what was rejected to
get there. Read it when you want to change something: most of these constraints
have a reason that isn't visible from the rule alone.

Per-component contracts (props, defaults, per-component prohibitions) live in the
11 `components/**/*.prompt.md` and `.d.ts` files, not here.

---

## Storyboard reference legend

`readme.md` and the component prompts cite refs like `9f` and `10b`. They index
frames in **`ozterisk Storyboard.dc.html`** — six scenarios, read left to right.
Every ref that survived into the locked spec:

| Ref | Moment | Status |
|---|---|---|
| `2a` | Correct answer: answer tiles rise 14px and settle | **built** — `oz-bloom` |
| `2d` | Streak tier 3: six-chip burst | specified |
| `7a` | Streak tier 1: one jade ring | **built** — `oz-ring`, gated at streak 3 |
| `7b` | Streak tier 2: second gold ring + gold rim on answer tiles | specified |
| `7c` | Streak tier 3: third ring, brightest rim | specified |
| `8a` | Overflow: the eleventh tile rim-rejects, perches on the rail | specified |
| `8c` | Discard confirm: the marked tile tips off the end | specified |
| `9b` | Tile to slot: flat slide, 130ms | **built** — transition, not a keyframe |
| `9f` | Wrong answer: crack and dust | **built** — `oz-crack` + `oz-dust` |
| `9i` | Reward tiles fire in place, in sorted position | **built** — `oz-fire` |
| `10b` | Round change: old equation falls, next rises | **built** — `oz-round-rise` |
| `10e` | Streak break: counter falls off its perch, 0 fades in | **built** — `oz-counter-fall` + `oz-counter-zero` |
| `10i` | Game over: the last tiles are swept off the rack | specified |
| `11a` | Overflow: tap a resident, it lifts out and tilts | specified |
| `11d` | An action becomes available and rises to meet the hand | **built** — `oz-rise-ready` |
| `11C` | Title entrance (240ms) and share chop (900ms) | specified |
| `10d` | Persistent streak rings on the counter | **struck** — see below |

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

**A lifted socket is not an empty one.** `--rim-socket-lifted` (gold, 34%) for a
socket whose tile is out in the answer slots; plain `--rim-socket` for one whose
tile is gone. Same well, different debt.
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

**Focus is a 2px `--gold-300` ring at 2px offset**, deliberately distinct from
every semantic colour, so focus is never confused with correct, incorrect, or
marked.

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

---

## Open

- **Licensed font files.** EB Garamond, IBM Plex Mono and Zen Kaku Gothic New
  currently load from Google Fonts. Self-hosting needs licence review.
- **Logo.** None exists. If the brand ever needs a mark that isn't type, it is a
  new design problem, not a derivation of this system.
- **Seven motion refs specified but not built** — `7b`, `7c`, `2d`, `8a`,
  `11a`/`8c`, `10i`, `11C`. All have durations and easings assigned in
  `tokens/motion.css`; none have keyframes in `tokens/keyframes.css`.
  **Correction:** they are not seven original designs. `ozterisk Storyboard.dc.html`
  already carries the shapes as `sb-*` keyframes — `sb-rim` (8a), `sb-drop` (11a),
  `sb-slide` (8c), `sb-sweep` (10i), `sb-settle` and `sb-stamp` (11C) — and `7b`/`7c`
  are `sb-ring` re-used at `.18s` and `.34s` delay with a different rim, not new
  frames at all. Only `2d`, the six-chip burst, has to be authored from nothing.
  The canvas frames hold across a 2.6s infinite loop, so each must be renormalised
  to 0–100% of its useful range when retimed to a one-shot duration.
- **Verification against the shipped app.** The overflow panel is where the
  storyboard and the codebase disagree most; the redesign wins on visuals, but
  the *states* should be checked against `src/components/OverflowControls/`.
- **The UI kit is a state tour, not a balance test.** It ports
  `KIND_EQUATION_RATE` and the real loss condition, but not the reducer's exact
  action ordering. Do not tune game balance from it.

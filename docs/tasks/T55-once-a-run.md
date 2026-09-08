---
reads:
  - src/components/TitleScreen/TitleScreen.tsx  # the mark tile, already tokenised
  - src/components/GameOverScreen/GameOverScreen.module.css  # .chop, already reserved and static
---

# T55 — The two moments a player sees once a run

```yaml
task_id: T55
title: Wire 11C — the title entrance and the share chop
milestone: M5.5f — Motion
priority: P2
estimate: S
wave: W2
depends_on: [T50]
parallel_safe: true
paths:
  - src/components/TitleScreen/
  - src/components/GameOverScreen/
```

**Interfaces**

- Two components, neither touched by `T51`–`T54`. Does not touch
  `GameScreen.tsx`.
- Consumes `T50`'s ports of `sb-settle` and `sb-stamp`.

## Why

§1.12 budgets motion by frequency: *"what happens every round is fastest and
quietest; what happens once a run may be theatrical."* These two are the
theatrical end, and `M5.5e` already built both their surfaces and left them
still.

- [x] **Step 1: The title entrance**

`TitleScreen.tsx` renders `.markTile` — the `✳` wearing the resting tile's
tokens without being a `Tile`. The storyboard applies `sb-settle` to exactly
that element: it drops from above, overshoots once and settles, over
`--dur-entrance`.

**The mark settles; the screen does not.** Staggering the wordmark, the summary,
the four material rules and the button into a sequence would be decorative
motion outside the named inventory, which §1.12 does not permit. One moment,
one element.

The four material rules are the first thing a new player reads. Nothing on this
screen may arrive late enough to be missed, and nothing may start below its
resting position and leave the layout shifting under a reader.

- [x] **Step 2: The share chop**

`GameOverScreen.module.css` already carries `.chop` — Ref 11C, the vermilion
chop bearing `✳`, at 34px — and `.confirmation` already reserves its height so
a copy confirms in place rather than pushing the screen down. The comment on
`.chop` says why it is static:

> Static: the stamp, hold and fade over `--dur-share` are keyframes.css's, and
> an `animation:` naming a keyframe that stylesheet does not define fails
> silently.

`T50` has now defined it. Wire it, over `--dur-share`, and **delete that half
of the comment** — it describes a state that no longer holds, and a comment
that is actively false is the one kind this repo allows removing. Keep the rest.

`sb-stamp` scales down onto the surface, holds, then fades. The hold is most of
the 900ms; that is the shape, not padding. Check `T50` renormalised it rather
than trimming it.

The chop is decorative — the copy confirmation a screen reader hears comes from
the `role="status"` region, which is not this element and must not change.

- [x] **Step 3: Test**

`getComputedStyle(el).animationName` resolves under `css: true`. Assert the
mark carries the entrance and the chop carries the stamp; assert the chop is
absent before a copy and present after.

`GameOverScreen.test.tsx` pins `"7 × 8 ="`, the Rounds → Score → Longest streak
order, the `role="status"` region and the `.primary` computed font size. None of
those may move.

- [x] **Step 4: Commit**

Write the message to a file and pass it with `-F`.

**Acceptance criteria**

- The mark settles on the title screen; nothing else on it animates.
- The chop stamps, holds and fades on a copy; the status region is untouched.
- The false half of the `.chop` comment is gone and the rest is intact.
- Suite green; lint, typecheck and build green.

**What this task does not do**

- Does not implement `10i`. The game-over sweep is deferred (#104) — see the milestone
  ruling and its issue. Do not add a rack to this screen.
- Does not touch `keyframes.css`, `src/game/` or `src/hooks/`.

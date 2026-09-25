# ozterisk UI, Language, and Sharing Contract

Visual, language, copy, sharing, and persistence contracts (§1.12–§1.16).
The game rules live in `docs/spec/product.md`.

### 1.12 Responsive and visual contract

The visual and motion language is the **Tile House** system in
`docs/design-system/`. That directory is the normative source for material rules
and the motion inventory. Token values live in `src/styles/tokens/`;
`docs/design-system/tokens/` is a frozen M5.5b snapshot that the design
references load, and it is not kept in step. This section states the contract
those values must satisfy. Where a design document and this section disagree, this
section wins.

**Layout and information architecture**

- Use one centered vertical arena on desktop and mobile.
- Preserve order across breakpoints: HUD → equation/slots → phase action → rail (while tiles are past capacity, and until a dropping tile lands) → inventory. The rail sits directly above the rack, because a perched tile drops from it into a socket.
- Mobile changes spacing, wrapping, and control size, not information architecture.
- **Endless:** the inventory rack is ten fixed sockets in a `5 × 2` grid at every
  breakpoint. The grid never resizes as tiles are lost, because the empty sockets are
  the score.
- **Classic (stepped rack):** the tile size steps with the rack's drawn capacity
  (`product.md` §1.7a), so every size holds about `180px` of height and the rack never
  scrolls vertically:
  - capacity `16–20`: `7` columns, tiles `44 × 55`, gap `4px`, radius `--radius-sm`; footprint `21` cells;
  - capacity `11–15`: `6` columns, tiles `48 × 60`, gap `6px`; footprint `18` cells;
  - capacity `≤ 10`: the Endless rack itself — `5` columns at Endless's tiers above, scaling
    with its container; footprint `10` cells. From ten sockets on, Classic's rack is Endless's.
  The thresholds (`15`, `10`) await a device playtest. **Narrow cap:** where the
  rack's container cannot hold a size's natural width, both upper sizes draw at
  `6` columns of `44 × 55` (`44px` is the target minimum and may not be undercut).
  The budget is the `320px` gate *with* a `15px` scrollbar, as above: a `305px`
  content box less the arena's `24px` padding leaves `281px`. `7 × 44` needs `332px`
  of tiles and `6 × 48` needs `318px`, so neither fits; `6 × 44` needs `264px`, which
  leaves `17px` for five gaps, the panel's side padding and its `1px` border on both
  sides — so the narrow size uses a `2px` gap and `2px` of side padding (`280px`). Only
  the width binds, so the panel keeps its `8px` top and bottom.
  "Narrow" is a property of the container, not the viewport: a `min-width` query
  fires about `15px` early wherever scrollbars take layout width (see above), so it
  cannot choose the column count. The narrow footprint is whole rows of `6`.
- **Two capacities.** The rack is *drawn* at the displayed round's capacity
  (`product.md` §1.7a), which picks the size and the footprint. The *live* capacity
  decides which tiles are seated and which are on the rail. Between a seal and the
  next round they differ by one: the socket at the live capacity is closing (`M6`)
  and takes no tile.
- **Sealed plugs.** Each Classic size draws its whole-row footprint; cells past the
  drawn capacity are sealed plugs: `--surface-table`, `--rim-socket` plus
  `inset 0 -1px 0 var(--hair-100)`, no well and no tile. The rack is always a full
  rectangle and the plug count shows the descent. A plug is not an empty socket: an
  empty socket is a debt the run can repay, a plug is gone.
- **The rail.** Tiles past capacity (the newest arrivals, `product.md` §1.5) perch on a
  band one tile high above the rack with a `1px` `--border-accent` top rule,
  right-aligned and drawn at the tier's tile size (where the rack's tracks shrink below
  it, a dropping tile narrows by a few pixels as it lands). The rail exists while tiles
  are past capacity, and until a tile it held has landed in a freed socket (8a·2), in
  both modes. It never adds a row to the rack.
- Answer slots stay `64 × 80` (at the arena's tier) in every Classic rack size.
- Rack sizing has three tiers: below `408px`, tiles are `52 × 64` with an `8px` gap;
  from `408px`, `66 × 64` with a `12px` gap; from `48rem`, `64 × 80` with a `12px`
  gap. A tier's rack width — five tiles plus four gaps — must leave room for the
  arena's horizontal padding at that tier's lower bound. The arena spends `24px` of
  that width on its own padding below `40rem`, so the narrow tier needs `292px` of
  `296px` and the middle tier needs `378px` of the `384px` a `408px` viewport leaves.
  (The design document draws this tier at `390px`. The boundary is `408px` rather
  than the `402px` the arithmetic bottoms out at, for a little slack; it stays below
  `412px` so that phone tier keeps the larger tile.)
- **A tier's figures are the tile's maximum size, not a fixed size.** The rack is
  sized from its container rather than from the viewport, and scales down toward the
  `44 × 44` target minimum when the container is narrower than the tier's natural
  width. At every width where the tier already fits, the rendered size is exactly the
  figure above.
- **The target minimum is a floor, and it outranks the layout.** A tile is a control,
  so below the content width where five tiles at `44` plus their gaps no longer fit —
  about `276px` once the arena's padding is counted — the rack stops shrinking and the
  page scrolls instead. The `320px` rule below is silent under `320px`, while the
  target minimum has no lower bound, so that is the order they resolve in. Browser
  zoom is the realistic way to reach those widths, and a reader at high zoom is
  exactly who the minimum protects.
- **This is what the `320px` no-horizontal-scroll rule requires, because a boundary
  cannot carry it.** A `min-width` query matches the scrollbar-*inclusive* viewport
  while the content box excludes it, so wherever scrollbars take layout width every
  tier fires about `15px` early and the tier's natural width exceeds the room
  available. No choice of boundary corrects this — the same query answers both cases
  identically. Scaling within the tier does, and the target minimum bounds how far:
  at the `320px` gate with a `15px` scrollbar the tiles land near `50 × 64`.

**Material and colour**

- The field is dark. At most two field values appear in one view.
- Tiles carry the only light values in the system: a ceramic face with a hard bottom
  edge that reads as the tile's thickness, never a blurred all-round shadow.
- Tiles resemble simple physical pieces.
- One meaning per hue. Gold marks brand, capacity, and reward; jade means correct;
  vermilion means a tile is leaving — incorrect, discard, or overflow.
- Semantic colour appears only at the moment of the event and only on the object
  concerned. There is no full-screen colour wash.
- Transparency is used only for ink and hairlines. No backdrop blur.
- Use color plus text or shape; never color alone for correctness, selection, or discard state.

**Typography**

- A serif sets every number and headline; interface text and meta labels use their
  own faces.
- Interface text is never below `11px`.
- Each locale must render in a face that covers its script. A face that does not
  cover Hangul may not be the sole `ko` interface face.

**Accessibility**

- Interactive targets are at least `44 × 44` CSS pixels.
- All controls use semantic HTML buttons.
- Visible focus styles are required. The focus indicator must reach at least `3:1`
  contrast against **every** surface it can appear on, including the ceramic tile
  face — a single-tone indicator that clears the field but not the tile does not
  satisfy this.
- Status changes use an appropriate `aria-live` region.
- No horizontal scroll at `320px`.

**Motion**

- Motion is budgeted by frequency: what happens every round is fastest and quietest;
  what happens once a run may be theatrical.
- Permitted motion is the **named inventory** in `docs/design-system/decisions.md`
  — the fifteen named storyboard moments, plus Classic's five: `M6` (a socket seals,
  `oz-seal` + `oz-seal-rim`), `8a·2` (the perched tile takes the freed seat,
  `oz-perch-drop`), `M6·0` (the house takes a seat), `M6·1` (the rack re-seats,
  `oz-reseat`) and `M6·2` (new plugs close). `8c` is drawn with `oz-slide-off`, which
  supersedes `oz-tip-off`. A moment whose duration and easing are
  not yet assigned in `src/styles/tokens/motion.css` gets them assigned by
  the milestone that implements it, and that assignment is not an amendment. Motion
  outside that inventory is not permitted; extending the inventory amends this
  section.
- Respect `prefers-reduced-motion` by removing nonessential motion wholesale,
  including press offsets.
- No audio.

### 1.13 Language behavior

- Supported languages: `en` and `ko`.
- On first visit, choose Korean if `navigator.language` or the first matching `navigator.languages` entry begins with `ko`; otherwise choose English.
- Persist the manual selection under `localStorage["one-zero.language"]`.
- A valid saved preference overrides browser detection.
- An invalid saved value is ignored.
- Language changes take effect immediately in every phase.
- Language changes do not reset the run.
- Only the language preference persists across refresh.
- Refresh always returns the game to `title`.

### 1.14 Required copy

The implementation may improve punctuation but may not change rule meaning.

| Key | English | Korean |
|---|---|---|
| `title.name` | `ozterisk` | `ozterisk` |
| `title.summary` | `Solve multiplication problems using limited digit tiles. Correct answers replace the tiles you spend and grant one extra tile. Incorrect answers consume your tiles without a reward. Keep your inventory balanced and survive as long as possible.` | `제한된 숫자 타일로 곱셈 문제를 푸세요. 정답을 맞히면 사용한 타일을 보충하고 타일 한 개를 추가로 받습니다. 오답에 사용한 타일은 보상 없이 사라집니다. 타일 구성을 관리하며 최대한 오래 살아남으세요.` |
| `title.more` | `More` | `더 보기` |
| `action.start` | `Start Run` | `게임 시작` |
| `action.submit` | `Submit` | `제출` |
| `action.clear` | `Clear` | `지우기` |
| `action.next` | `Next Round` | `다음 라운드` |
| `action.playAgain` | `Play Again` | `다시 하기` |
| `action.share` | `Share` | `공유` |
| `action.copy` | `Copy Result` | `결과 복사` |
| `hud.score` | `Score` | `점수` |
| `hud.streak` | `Streak` | `연속 정답` |
| `hud.round` | `Round` | `라운드` |
| `hud.capacity` | `Capacity` | `용량` |
| `title.mode` | `Mode` | `모드` |
| `mode.endless` | `Endless` | `엔드리스` |
| `mode.endlessHint` | `Ten sockets, no end` | `열 칸, 끝없이` |
| `mode.classic` | `Classic` | `클래식` |
| `mode.classicHint` | `Twenty closing to six` | `스물에서 여섯까지` |
| `result.correct` | `Correct` | `정답` |
| `result.incorrect` | `Incorrect` | `오답` |
| `result.submitted` | `Your answer: {value}` | `제출한 답: {value}` |
| `result.answer` | `Correct answer: {value}` | `정답: {value}` |
| `result.rewards` | `Received {count} tiles` | `타일 {count}개 획득` |
| `overflow.instructionOne` | `Choose a tile to discard.` | `버릴 타일 1개를 선택하세요.` |
| `overflow.instruction` | `Choose {count} tiles to discard.` | `버릴 타일 {count}개를 선택하세요.` |
| `gameOver.title` | `Game Over` | `게임 종료` |
| `gameOver.reason` | `Not enough tiles left to answer.` | `답을 만들 타일이 부족합니다.` |
| `gameOver.winTitle` | `Run Complete` | `완주` |
| `gameOver.winReason` | `You reached the floor with tiles in hand.` | `타일을 남긴 채 바닥에 도달했습니다.` |
| `gameOver.rounds` | `Rounds played` | `진행한 라운드` |
| `gameOver.longestStreak` | `Longest streak` | `최장 연속 정답` |
| `gameOver.restartHint` | `Press R to play again` | `R 키를 눌러 다시 하기` |
| `share.copied` | `Result copied.` | `결과를 복사했습니다.` |
| `share.failed` | `Could not share or copy the result.` | `결과를 공유하거나 복사하지 못했습니다.` |

The title screen shows **four material rules** on the felt, always visible. They
cover **three** of these topics — capacity, outcomes, overflow — because outcomes
takes two rules, one per material: a tile for the correct half, a vermilion pip
for the incorrect one. `title.more` labels the disclosure holding the remaining
four. All seven are still explained, which is what this section requires.

The expanded rules must explain:

- selecting and returning tiles;
- ordered answer slots;
- correct and incorrect outcomes;
- the ten-tile capacity, and Classic's twenty closing to six;
- overflow discarding;
- score, streak, round, and loss rules;
- keyboard controls.

### 1.15 Sharing contract

- Sharing exists only on `gameOver`.
- Text uses the current interface language at the moment the action is invoked.
- Include the normal game URL.
- Do not encode result state in the URL.
- Do not claim a shared result is verified.
- **Share** calls `navigator.share({ text, url })` when available.
- If native sharing is unavailable, **Share** performs the copy behavior.
- If native sharing is rejected or fails, keep the player on game over and show an inline failure status. Do not automatically copy after a rejected native share because cancellation may be intentional.
- **Copy Result** always calls the clipboard writer.
- Clipboard failure shows an inline failure status; do not open a modal.

English format:

```text
ozterisk — Rounds: {totalRounds}
Score: {score}
Longest streak: {longestStreak}

Can you beat it?
{url}
```

Korean format:

```text
ozterisk — 라운드: {totalRounds}
점수: {score}
최장 연속 정답: {longestStreak}

이 기록을 넘을 수 있나요?
{url}
```

The formats above are Endless's. Classic prefixes the first line with the mode and
its outcome, and keeps the rest unchanged:

```text
ozterisk Classic — Run Complete — Rounds: {totalRounds}
```

```text
ozterisk Classic — Game Over — Rounds: {totalRounds}
```

```text
ozterisk 클래식 — 완주 — 라운드: {totalRounds}
```

```text
ozterisk 클래식 — 게임 종료 — 라운드: {totalRounds}
```

### 1.16 Persistence and reload

- Persist language on every valid language change.
- Read language once during i18n initialization.
- Do not write any game field to storage.
- A page reload constructs a fresh `title` state.
- No unload warning or recovery prompt.

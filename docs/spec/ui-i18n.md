# ozterisk UI, Language, and Sharing Contract

Visual, language, copy, sharing, and persistence contracts (§1.12–§1.16).
The game rules live in `docs/spec/product.md`.

### 1.12 Responsive and visual contract

The visual and motion language is the **Tile House** system in
`docs/design-system/`. That directory is the normative source for token values,
material rules, and the motion inventory; this section states the contract those
values must satisfy. Where a design document and this section disagree, this
section wins.

**Layout and information architecture**

- Use one centered vertical arena on desktop and mobile.
- Preserve order across breakpoints: HUD → equation/slots → phase action → inventory.
- Mobile changes spacing, wrapping, and control size, not information architecture.
- The inventory rack is ten fixed sockets in a `5 × 2` grid at every breakpoint. The
  grid never resizes as tiles are lost, because the empty sockets are the score.
- Rack sizing has three tiers: below `400px`, tiles are `52 × 64` with an `8px` gap;
  from `400px`, `66 × 64` with a `12px` gap; from `48rem`, `64 × 80` with a `12px`
  gap. Every tier must satisfy the `44 × 44` target minimum and the `320px`
  no-horizontal-scroll rule below. A tier's rack width — five tiles plus four gaps
  — must also leave room for the arena's horizontal padding at that tier's lower
  bound: `292px` inside `320px`, and `378px` inside `400px`. (The design document
  draws this tier at `390px`; the spec raises the boundary to `400px` because
  `378px` plus usable padding does not fit `390px`.)

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
  — the sixteen named storyboard moments. A moment whose duration and easing are
  not yet assigned in `docs/design-system/tokens/motion.css` gets them assigned by
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
| `title.howToPlay` | `How to Play` | `게임 방법` |
| `action.start` | `Start Run` | `게임 시작` |
| `action.submit` | `Submit` | `제출` |
| `action.clear` | `Clear` | `지우기` |
| `action.next` | `Next Round` | `다음 라운드` |
| `action.confirmDiscard` | `Confirm Discard` | `버리기 확정` |
| `action.playAgain` | `Play Again` | `다시 하기` |
| `action.share` | `Share` | `공유` |
| `action.copy` | `Copy Result` | `결과 복사` |
| `hud.score` | `Score` | `점수` |
| `hud.streak` | `Streak` | `연속 정답` |
| `hud.round` | `Round` | `라운드` |
| `hud.capacity` | `Capacity` | `용량` |
| `result.correct` | `Correct` | `정답` |
| `result.incorrect` | `Incorrect` | `오답` |
| `result.submitted` | `Your answer: {value}` | `제출한 답: {value}` |
| `result.answer` | `Correct answer: {value}` | `정답: {value}` |
| `result.rewards` | `Received {count} tiles` | `타일 {count}개 획득` |
| `overflow.instruction` | `Choose {count} tile(s) to discard.` | `버릴 타일 {count}개를 선택하세요.` |
| `gameOver.title` | `Game Over` | `게임 종료` |
| `gameOver.reason` | `Not enough tiles left to answer.` | `답을 만들 타일이 부족합니다.` |
| `gameOver.rounds` | `Rounds played` | `진행한 라운드` |
| `gameOver.longestStreak` | `Longest streak` | `최장 연속 정답` |
| `share.copied` | `Result copied.` | `결과를 복사했습니다.` |
| `share.failed` | `Could not share or copy the result.` | `결과를 공유하거나 복사하지 못했습니다.` |

The expanded rules must explain:

- selecting and returning tiles;
- ordered answer slots;
- correct and incorrect outcomes;
- the ten-tile capacity;
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

### 1.16 Persistence and reload

- Persist language on every valid language change.
- Read language once during i18n initialization.
- Do not write any game field to storage.
- A page reload constructs a fresh `title` state.
- No unload warning or recovery prompt.

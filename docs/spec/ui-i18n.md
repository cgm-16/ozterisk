# 1-0 UI, Language, and Sharing Contract

Visual, language, copy, sharing, and persistence contracts (§1.12–§1.16).
The game rules live in `docs/spec/product.md`.

### 1.12 Responsive and visual contract

- Use one centered vertical arena on desktop and mobile.
- Preserve order across breakpoints: HUD → equation/slots → phase action → inventory.
- Mobile changes spacing, wrapping, and control size, not information architecture.
- Minimal number-board aesthetic.
- High-contrast typography, neutral surfaces, restrained accent use.
- Tiles resemble simple physical pieces.
- Use color plus text or shape; never color alone for correctness, selection, or discard state.
- Interactive targets are at least `44 × 44` CSS pixels.
- All controls use semantic HTML buttons.
- Visible focus styles are required.
- Status changes use an appropriate `aria-live` region.
- Respect `prefers-reduced-motion` by removing nonessential transitions.
- No particles, screen shake, decorative motion, or audio.

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
| `title.name` | `1-0` | `1-0` |
| `title.summary` | `Solve multiplication problems using limited digit tiles. Correct answers replace the tiles you spend and grant one extra tile. Incorrect answers consume your tiles without a reward. Keep your inventory balanced and survive as long as possible.` | `제한된 숫자 타일로 곱셈 문제를 푸세요. 정답을 맞히면 사용한 타일을 보충하고 타일 한 개를 추가로 받습니다. 오답에 사용한 타일은 보상 없이 사라집니다. 타일 구성을 관리하며 최대한 오래 살아남으세요.` |
| `title.howToPlay` | `How to Play` | `게임 방법` |
| `action.start` | `Start Run` | `게임 시작` |
| `action.submit` | `Submit` | `제출` |
| `action.next` | `Next Round` | `다음 라운드` |
| `action.confirmDiscard` | `Confirm Discard` | `버리기 확정` |
| `action.playAgain` | `Play Again` | `다시 하기` |
| `action.share` | `Share` | `공유` |
| `action.copy` | `Copy Result` | `결과 복사` |
| `hud.score` | `Score` | `점수` |
| `hud.streak` | `Streak` | `연속 정답` |
| `hud.round` | `Round` | `라운드` |
| `result.correct` | `Correct` | `정답` |
| `result.incorrect` | `Incorrect` | `오답` |
| `result.submitted` | `Your answer: {value}` | `제출한 답: {value}` |
| `result.answer` | `Correct answer: {value}` | `정답: {value}` |
| `overflow.instruction` | `Choose {count} tile(s) to discard.` | `버릴 타일 {count}개를 선택하세요.` |
| `gameOver.title` | `Game Over` | `게임 종료` |
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
1-0 — Score: {score}
Rounds: {totalRounds}
Longest streak: {longestStreak}

Can you beat it?
{url}
```

Korean format:

```text
1-0 — 점수: {score}
라운드: {totalRounds}
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

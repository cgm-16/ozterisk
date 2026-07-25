// Recursively widens every string leaf of a message tree to `string`, preserving
// its key structure. Used to enforce that translated trees share the exact
// nesting and key names of the canonical English tree, without forcing their
// leaf values to match English text.
type MessageShape<T> = T extends string
  ? string
  : { [K in keyof T]: MessageShape<T[K]> };

const en = {
  title: {
    name: "1-0",
    summary:
      "Solve multiplication problems using limited digit tiles. Correct answers replace the tiles you spend and grant one extra tile. Incorrect answers consume your tiles without a reward. Keep your inventory balanced and survive as long as possible.",
    howToPlay: "How to Play",
  },
  language: {
    groupLabel: "Language",
  },
  howToPlay: {
    selecting:
      "Click or tap an inventory tile to place it in the next empty answer slot. Click a filled slot to return that tile to your inventory.",
    slots:
      "Answer slots fill in the order you select tiles: the first tile you choose fills the leftmost slot, so selection order determines the number you submit.",
    outcomes:
      "A correct answer replaces the tiles you spent and grants one extra tile. An incorrect answer removes the tiles you spent and grants no reward.",
    capacity: "Your inventory holds at most ten tiles.",
    overflow:
      "If a reward would push your inventory past ten tiles, you must choose tiles to discard before play continues.",
    progress:
      "Score counts correct answers, streak counts consecutive correct answers, and round shows which equation is currently on screen. Rounds played counts every equation you have submitted, correct or incorrect. The run ends once you hold fewer tiles than the next answer requires.",
    keyboard:
      "Press a digit key to select a matching tile, Backspace to return the most recently selected tile, and Enter to submit, confirm a discard, or continue.",
  },
  action: {
    start: "Start Run",
    submit: "Submit",
    next: "Next Round",
    confirmDiscard: "Confirm Discard",
    playAgain: "Play Again",
    share: "Share",
    copy: "Copy Result",
  },
  hud: {
    score: "Score",
    streak: "Streak",
    round: "Round",
  },
  result: {
    correct: "Correct",
    incorrect: "Incorrect",
    submitted: "Your answer: {value}",
    answer: "Correct answer: {value}",
  },
  overflow: {
    instruction: "Choose {count} tile(s) to discard.",
  },
  gameOver: {
    title: "Game Over",
    rounds: "Rounds played",
    longestStreak: "Longest streak",
  },
  share: {
    copied: "Result copied.",
    failed: "Could not share or copy the result.",
  },
  answerSlot: {
    filled: "Answer slot {position}: {digit}",
    empty: "Answer slot {position}: empty",
  },
  tile: {
    digitLabel: "Digit {digit}",
    newLabel: "New tile",
    discardLabel: "Marked for discard",
  },
} as const;

const ko = {
  title: {
    name: "1-0",
    summary:
      "제한된 숫자 타일로 곱셈 문제를 푸세요. 정답을 맞히면 사용한 타일을 보충하고 타일 한 개를 추가로 받습니다. 오답에 사용한 타일은 보상 없이 사라집니다. 타일 구성을 관리하며 최대한 오래 살아남으세요.",
    howToPlay: "게임 방법",
  },
  language: {
    groupLabel: "언어",
  },
  howToPlay: {
    selecting:
      "인벤토리 타일을 클릭하거나 탭하면 다음 빈 정답 칸에 놓입니다. 채워진 칸을 클릭하면 타일이 인벤토리로 돌아갑니다.",
    slots:
      "정답 칸은 선택한 순서대로 채워집니다. 먼저 선택한 타일이 맨 왼쪽 칸에 들어가므로 선택 순서가 제출할 숫자를 결정합니다.",
    outcomes:
      "정답이면 사용한 타일을 보충하고 타일 한 개를 추가로 받습니다. 오답이면 사용한 타일이 보상 없이 사라집니다.",
    capacity: "인벤토리는 최대 열 개의 타일까지 보관할 수 있습니다.",
    overflow: "보상으로 인벤토리가 열 개를 초과하면, 계속하기 전에 버릴 타일을 선택해야 합니다.",
    progress:
      "점수는 정답 횟수를, 연속 정답은 이어지는 정답 횟수를 나타내며, 라운드는 현재 화면에 표시된 문제의 번호입니다. 진행한 라운드는 정답과 오답을 포함해 지금까지 제출한 문제 수를 나타냅니다. 다음 정답에 필요한 타일보다 보유한 타일이 적어지면 게임이 종료됩니다.",
    keyboard:
      "숫자 키를 누르면 일치하는 타일을 선택하고, Backspace 키로 가장 최근에 선택한 타일을 되돌리며, Enter 키로 제출하거나 버리기를 확정하거나 다음으로 진행합니다.",
  },
  action: {
    start: "게임 시작",
    submit: "제출",
    next: "다음 라운드",
    confirmDiscard: "버리기 확정",
    playAgain: "다시 하기",
    share: "공유",
    copy: "결과 복사",
  },
  hud: {
    score: "점수",
    streak: "연속 정답",
    round: "라운드",
  },
  result: {
    correct: "정답",
    incorrect: "오답",
    submitted: "제출한 답: {value}",
    answer: "정답: {value}",
  },
  overflow: {
    instruction: "버릴 타일 {count}개를 선택하세요.",
  },
  gameOver: {
    title: "게임 종료",
    rounds: "진행한 라운드",
    longestStreak: "최장 연속 정답",
  },
  share: {
    copied: "결과를 복사했습니다.",
    failed: "결과를 공유하거나 복사하지 못했습니다.",
  },
  answerSlot: {
    filled: "정답 칸 {position}: {digit}",
    empty: "정답 칸 {position}: 비어 있음",
  },
  tile: {
    digitLabel: "숫자 {digit}",
    newLabel: "새 타일",
    discardLabel: "버릴 타일로 표시됨",
  },
} as const satisfies MessageShape<typeof en>;

export const messages = { en, ko } as const;

export type MessageTree = typeof en;

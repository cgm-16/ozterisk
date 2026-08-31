import React from "react";

/**
 * Bilingual copy, lifted verbatim from src/i18n/messages.ts with the product
 * name updated to ozterisk. Both trees share the exact key structure.
 */
export const messages = {
  en: {
    title: {
      name: "ozterisk",
      summary:
        "Solve multiplication problems using limited digit tiles. Correct answers replace the tiles you spend and grant one extra tile. Incorrect answers consume your tiles without a reward. Keep your inventory balanced and survive as long as possible.",
    },
    rules: [
      { swatch: "socket", text: "The rack holds exactly ten tiles." },
      { swatch: "tile", text: "A correct answer replaces the tiles you spend and grants one extra." },
      { swatch: "gold", text: "Rewards land in sorted order. Past ten, you must discard." },
      { swatch: "verm", text: "An incorrect answer consumes your tiles and grants no reward." },
    ],
    action: {
      start: "Start Run",
      submit: "Submit",
      clear: "Clear",
      next: "Next Round",
      confirmDiscard: "Confirm Discard",
      playAgain: "Play Again",
      share: "Share",
      copy: "Copy Result",
    },
    hud: { score: "Score", streak: "Streak", round: "Round" },
    capacity: "Capacity",
    result: {
      correct: "Correct",
      incorrect: "Incorrect",
      submitted: "Your answer: {value}",
      answer: "Correct answer: {value}",
      rewards: "Received {count} tiles",
    },
    overflow: { instruction: "Choose {count} tile(s) to discard.", confirm: "Confirm Discard" },
    gameOver: {
      title: "Game Over",
      reason: "Not enough tiles left to answer.",
      rounds: "Rounds played",
      longestStreak: "Longest streak",
      copiedNotice: "Result copied.",
    },
    marked: "marked",
  },
  ko: {
    title: {
      name: "ozterisk",
      summary:
        "제한된 숫자 타일로 곱셈 문제를 푸세요. 정답을 맞히면 사용한 타일을 보충하고 타일 한 개를 추가로 받습니다. 오답에 사용한 타일은 보상 없이 사라집니다. 타일 구성을 관리하며 최대한 오래 살아남으세요.",
    },
    rules: [
      { swatch: "socket", text: "인벤토리는 최대 열 개의 타일까지 보관할 수 있습니다." },
      { swatch: "tile", text: "정답이면 사용한 타일을 보충하고 타일 한 개를 추가로 받습니다." },
      { swatch: "gold", text: "보상은 정렬된 순서로 들어옵니다. 열 개를 넘으면 버려야 합니다." },
      { swatch: "verm", text: "오답이면 사용한 타일이 보상 없이 사라집니다." },
    ],
    action: {
      start: "게임 시작",
      submit: "제출",
      clear: "지우기",
      next: "다음 라운드",
      confirmDiscard: "버리기 확정",
      playAgain: "다시 하기",
      share: "공유",
      copy: "결과 복사",
    },
    hud: { score: "점수", streak: "연속 정답", round: "라운드" },
    capacity: "용량",
    result: {
      correct: "정답",
      incorrect: "오답",
      submitted: "제출한 답: {value}",
      answer: "정답: {value}",
      rewards: "타일 {count}개 획득",
    },
    overflow: { instruction: "버릴 타일 {count}개를 선택하세요.", confirm: "버리기 확정" },
    gameOver: {
      title: "게임 종료",
      reason: "답을 만들 타일이 부족합니다.",
      rounds: "진행한 라운드",
      longestStreak: "최장 연속 정답",
      copiedNotice: "결과를 복사했습니다.",
    },
    marked: "표시됨",
  },
};

export function useMessages(language) {
  return React.useMemo(() => messages[language] || messages.en, [language]);
}

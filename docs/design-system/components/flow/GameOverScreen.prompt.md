`GameOverScreen` closes the run. Keep the bare rack and the terminal equation visible behind or above it — the reason for the loss must never be in doubt.

```jsx
<GameOverScreen stats={{ score, totalRounds, longestStreak }} onPlayAgain={restart} onShare={share} onCopy={copy} copied={copied} labels={{ ...messages.gameOver, ...messages.action }} />
```

- The share confirmation is a vermilion **chop** bearing ✳ that stamps in, holds, and fades over `--dur-share` (900ms). It is the one deliberately theatrical moment, because it happens once per run.
- Score is reported as rounds played and longest streak; there is no grade, rank, or judgement copy.

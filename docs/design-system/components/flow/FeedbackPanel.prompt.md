`FeedbackPanel` states the outcome flatly. On a correct answer it shows only the reward tiles; on an incorrect one it shows what you submitted and what was right.

```jsx
<FeedbackPanel result={state.lastResult} rewardTiles={rewards} labels={messages.result} />
```

- The reward tiles carry a caption. Unlabelled tiles sitting under `CORRECT` read as a restatement of the answer you just gave; they are arrivals, and the panel has to say so.
- Never add encouragement copy. "Incorrect" plus the two numbers is the entire message.
- The reward tiles carry a caption. Unlabelled tiles sitting under `CORRECT` read as a restatement of the answer you just gave; they are arrivals, and the panel has to say so.
- The border is the only colour: gold for correct, vermilion for incorrect. No filled background, no full-screen wash.

`TitleScreen` is the run's front door and the only ceremonial moment in the game.

```jsx
<TitleScreen summary={messages.title.summary} labels={{ start: messages.action.start }} language={language} onLanguageChange={setLanguage} onStart={startRun} />
```

- The ✳ tile drops and settles, then the wordmark fades up beneath it (`--dur-entrance`, 240ms). Nothing else animates here.
- The four rules use **material swatches**, not icons — a socket, a tile, a gold pip, a vermilion pip. That is the system's iconography.
- The socket swatch is the exception to the socket fill rule: at 18px on `--felt-900`, `--surface-socket` is invisible, so it uses `--surface-raised` with a hand-softened inset and `--rim-socket`. It still has to read as a well, not a plain chip.

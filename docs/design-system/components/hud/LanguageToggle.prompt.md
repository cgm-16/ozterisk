`LanguageToggle` belongs top-right on the title screen and in the game HUD. It is always visible — switching locale is a one-tap action, not a settings trip.

```jsx
<LanguageToggle language={language} onChange={setLanguage} />
```

- The active segment fills gold with `--clay-900` text; the inactive one is bare felt.
- Two options only. If a third locale ships, this becomes a select — do not add a third segment.

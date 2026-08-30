`ActionButton` is the only button in the system. One primary per screen — the round's single forward move.

```jsx
<ActionButton onClick={submit} disabled={!allSlotsFilled}>Submit</ActionButton>
<ActionButton variant="secondary" onClick={clear}>Clear</ActionButton>
<ActionButton variant="ghost" onClick={copy}>Copy Result</ActionButton>
```

- Labels are Title Case in source and uppercased by CSS, so Korean strings are unaffected.
- Disabled removes the shadow entirely rather than dimming — the enable moment is a real event (the button *rises*): the component watches `disabled` and plays `oz-rise-ready` on the false transition (11d). Keep `disabled` a real prop rather than intercepting clicks, or the moment never fires.

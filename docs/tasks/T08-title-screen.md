---
reads:
  - docs/spec/product.md  # §1.10 title phase
  - docs/spec/ui-i18n.md  # §1.14 required copy
---

# T08 — Title screen and language control

```yaml
task_id: T08
title: Build localized title and rules screen
milestone: M2 — Playable Bilingual PoC
priority: P1
estimate: S
wave: W2
depends_on: [T07]
parallel_safe: true
paths: [src/components/LanguageToggle/**, src/components/TitleScreen/**]
```

**Interfaces**

- Consumes: `useI18n()`, `onStart(): void`.
- Produces: `TitleScreen` with title, summary, native `<details>`, language toggle, start action.

- [ ] **Step 1: Write failing title tests**

```tsx
it("starts only from the explicit action", async () => {
  const onStart = vi.fn();
  render(
    <I18nProvider initialLanguage="en">
      <TitleScreen onStart={onStart} />
    </I18nProvider>,
  );
  expect(screen.getByRole("heading", { name: "1-0" })).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "Start Run" }));
  expect(onStart).toHaveBeenCalledTimes(1);
});
```

Also test expanding rules and live English/Korean button copy.

- [ ] **Step 2: Verify failure**

```bash
npm test -- src/components/TitleScreen/TitleScreen.test.tsx
```

- [ ] **Step 3: Implement semantic UI**

Use `<main>`, `<h1>`, `<details><summary>`, rule list, and `<button type="button">`. Language buttons expose `aria-pressed`.

- [ ] **Step 4: Verify**

```bash
npm test -- src/components/TitleScreen/TitleScreen.test.tsx
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/components/LanguageToggle src/components/TitleScreen
git commit -m "feat: add localized game entry screen" -m "Task: T08"
```

**Acceptance criteria**

- Full rules content covers every item in §1.14.
- No interactive tutorial or extra entry step is added.

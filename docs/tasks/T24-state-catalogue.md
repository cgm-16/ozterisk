---
reads:
  - docs/spec/architecture.md  # §2.5 reducer invariants, §2.6 fixtures, §2.7 gallery contract
  - docs/plan/tuning-and-design-system.md  # §5 the anti-drift claim
---

# T24 — State catalogue

```yaml
task_id: T24
title: Fill the gallery catalogue with the states that are expensive to reach by playing
milestone: M5 — States Gallery
priority: P1
estimate: M
wave: W3
depends_on: [T21, T22, T23]
parallel_safe: false
paths:
  - src/gallery/states.tsx
  - src/gallery/states.test.tsx
  - src/test/fixtures.ts
  - src/components/GameScreen/GameScreen.test.tsx
  - docs/spec/architecture.md
```

**Interfaces**

- Consumes: `GalleryEntry` / `GALLERY_STATES` (T23),
  `makeFeedbackState` / `makeOverflowState` (T21), `GameOverScreen`'s
  `equation` prop (T22).
- Produces: `makeGameOverState` and `makeOverflowInventory` in
  `src/test/fixtures.ts`.

## Why

These are the states that cost a full run each to look at. `share.copied` and
`share.failed` are worse — reaching them means breaking the clipboard by hand.

- [ ] **Step 1: Add `makeGameOverState` to `src/test/fixtures.ts`**

Deferred from T21 to here, where a consumer exists. §2.5 requires
`round === totalRounds + 1` in `gameOver` and `inventory.length <= 10`.

```ts
// A §2.5-legal gameOver state: round === totalRounds + 1 and the terminal
// equation is still on screen (§1.8).
export const makeGameOverState = (
  equation: Equation,
  overrides: Partial<GameState> = {},
): GameState => ({
  ...makeAnsweringState(equation, { round: 13, totalRounds: 12 }),
  phase: "gameOver",
  score: 7,
  longestStreak: 4,
  ...overrides,
});
```

- [ ] **Step 2: Add `makeOverflowInventory` and collapse the duplication**

The gallery needs an excess-2 overflow state. `GameScreen.test.tsx:48` already
builds a 12-tile inventory and `makeOverflowState` builds an 11-tile one
inline — the gallery would be the third copy, so collapse them now.

```ts
// Overflow inventories are defined by size alone; the digits only need to
// exist. `size - INVENTORY_CAPACITY` is the excess the player must discard.
export const makeOverflowInventory = (size: number): Tile[] =>
  Array.from({ length: size }, (_, index) => makeTile((index % 9) as Digit, `tile-${index}`));
```

Rewrite `makeOverflowState`'s inline builder as `makeOverflowInventory(11)`,
and replace `TWELVE_TILE_INVENTORY` in `GameScreen.test.tsx` with
`makeOverflowInventory(12)`. **Preserve the comment above
`TWELVE_TILE_INVENTORY`** — it explains why the 11-tile default cannot simply
be changed, which is still true.

`npm test` must stay green with no assertion edited.

- [ ] **Step 3: Fill the catalogue**

In `src/gallery/states.tsx`, populate the four empty groups. Coverage is
chosen for states that are expensive to reach by playing, not for
completeness:

- **answering** — empty slots; partially filled; all slots filled (Submit
  enabled)
- **feedback** — correct, with reward badges; incorrect, with the answer
  comparison
- **overflow** — required count 1 (Endless's only case, where the Confirm
  button collapses away); required count 2 via `makeOverflowInventory(12)`
  (Classic's case, which renders Confirm and is currently unreachable in the
  shipped game)
- **gameOver** — three entries rendering `GameOverScreen` with stubbed
  `ShareDependencies`: an idle one, one whose `writeClipboard` resolves (so
  `share.copied` is one click away), and one whose `writeClipboard` rejects
  (`share.failed`). Give the rejecting stub `nativeShare: undefined` so the
  clipboard path is the one exercised.

`GameScreen` entries need `dispatch`, `onSubmit`, and `onNextRound`. Pass
no-ops — the gallery is for looking, not driving. Define one shared no-op
rather than five inline arrow functions.

Label entries for a human scanning the picker: "Answering — all slots
filled", "Overflow — required 2 (Classic)", "Game over — copy failed".

- [ ] **Step 4: Write the catalogue tests**

`src/gallery/states.test.tsx`. The gallery is dev-only, so keep these cheap
and behavioural — do not snapshot the rendered output.

```tsx
describe("gallery catalogue", () => {
  it("declares at least one entry for every game phase", () => {
    for (const [phase, entries] of Object.entries(GALLERY_STATES)) {
      expect(entries, `no gallery entry covers the ${phase} phase`).not.toHaveLength(0);
    }
  });

  it("gives every entry a unique id", () => {
    const ids = Object.values(GALLERY_STATES).flat().map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("renders every entry without throwing", () => {
    for (const entry of Object.values(GALLERY_STATES).flat()) {
      expect(() =>
        render(<I18nProvider initialLanguage="en">{entry.render()}</I18nProvider>),
      ).not.toThrow();
      cleanup();
    }
  });
});
```

The first test is the guard that makes M6 and M7 extend the catalogue rather
than quietly outgrow it: `GALLERY_STATES` is typed `Record<GamePhase, …>`, so
a new phase fails `tsc` at the declaration, and an empty group added to
silence the compiler fails here.

The third catches the failure mode that actually bites a fixture-driven
gallery — a state shape that violates a component's expectations and throws
on render, which no amount of type-checking catches.

- [ ] **Step 5: Full gates**

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

`ls dist/` must still show no `gallery.html`.

- [ ] **Step 6: Manual check — the whole point of the build**

```bash
npm run dev
```

At `/gallery.html`, click through every entry in both `en` and `ko`.
Confirm: no console errors; the Korean discard prompt
(`버릴 타일 {count}개를 선택하세요.`) does not break the overflow layout;
Confirm appears at required 2 and is absent at required 1; the game-over
entries reach `share.copied` and `share.failed` on one click.

Report anything the gallery reveals — that is the deliverable, not a
side-effect. Do **not** fix app-layout bugs it surfaces inside this task;
record them for a follow-up.

- [ ] **Step 7: Amend `docs/spec/architecture.md`**

Append `makeGameOverState` and `makeOverflowInventory` to §2.6's code block,
and update `makeOverflowState` there to match its rewritten body. Note the
catalogue's phase-coverage guarantee in §2.7.

- [ ] **Step 8: Commit**

```bash
git add src/gallery/ src/test/fixtures.ts \
        src/components/GameScreen/GameScreen.test.tsx docs/spec/architecture.md
git commit -m "feat(gallery): catalogue the states that are expensive to reach by playing" -m "Task: T24"
```

**Acceptance criteria**

- Every `GamePhase` has at least one catalogue entry, enforced by a test.
- Every entry renders without throwing, in both languages.
- `share.copied` and `share.failed` are both reachable in one click.
- Overflow at required 1 and required 2 are both present.
- `makeOverflowInventory` is the only place an overflow inventory is built.
- `npm run build` still emits no `dist/gallery.html`.

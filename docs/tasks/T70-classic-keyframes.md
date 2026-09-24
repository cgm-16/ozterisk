---
reads:
  - src/styles/tokens/keyframes.css  # the five frames, ported from the handoff (pruned by T74)
  - src/styles/tokens/keyframes.css
  - src/styles/global.css  # reduced-motion block
---

# T70 — Port Classic's keyframes and tokens

```yaml
task_id: T70
title: Port Classic's keyframes and tokens
milestone: M6b — Classic Rack and Motion
priority: P1
estimate: S
wave: W0
depends_on: [T69]
parallel_safe: false
paths:
  - src/styles/
  - src/components/TileInventory/TileInventory.module.css  # oz-tip-off → oz-slide-off only
```

## Steps

- [ ] Failing test first: `keyframes.test.ts` requires `oz-slide-off`, `oz-seal`, `oz-seal-rim`, `oz-perch-drop`, `oz-reseat`, and that `oz-tip-off` is gone.
- [ ] Port those five frames verbatim with their comments; do not overwrite the rest of the file.
- [ ] Add `--dur-seal` (180ms) and the durations the new moments need (slide-off 420ms, perch 220ms, reseat 300ms), in `motion.css`.
- [ ] Rename the 8c consumer to `oz-slide-off` with `--dx 46px --drop 88px --rot 18deg`.
- [ ] Add `animation-delay: 0s !important` to the reduced-motion block, so staggered seals jump rather than wait.

## Acceptance

- `npm test`, `npm run lint`.

---
reads:
  - docs/spec/architecture.md  # §2.1 canonical file map
---

# T01 — Repository foundation and quality gates

```yaml
task_id: T01
title: Scaffold Vite React TypeScript repository
milestone: M0 — Repository Ready
priority: P0
estimate: S
wave: W0
depends_on: []
parallel_safe: false
paths: [package.json, package-lock.json, vite.config.ts, src/test/setup.ts, src/styles/global.css]
```

**Purpose:** Produce a reproducible greenfield toolchain that every later task can trust.

**Interfaces**

- Consumes: Empty Git repository root.
- Produces: `npm run dev`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.

- [ ] **Step 1: Scaffold the application**

```bash
npm create vite@latest . -- --template react-ts
npm install
npm install --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Add deterministic scripts**

Set `package.json` scripts to:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint . --max-warnings=0",
    "typecheck": "tsc -b --pretty false",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 3: Configure Vitest**

Add to `vite.config.ts`:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
  },
});
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Replace starter styling with the global token shell**

Create `src/styles/global.css` with reset rules, system font stack, neutral color variables, focus-ring variable, spacing/radius tokens, `color-scheme: light`, and `prefers-reduced-motion`. Import it from `src/main.tsx`.

- [ ] **Step 5: Prove every gate**

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Expected: all commands exit `0`; `dist/index.html` exists.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: scaffold 1-0 client application" -m "Task: T01"
```

**Acceptance criteria**

- Fresh `npm ci` succeeds.
- No dependency outside the approved stack is present.
- All five scripts exist and pass.

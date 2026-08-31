// Compiles each component card's demo out of JSX so the card needs no
// runtime transform.
//
// The three `components/*/*.card.html` files shipped their demos as
// `<script type="text/babel">` blocks compiled in the browser by
// `@babel/standalone`. That works from a plain file server but not inside the
// claude.ai/design preview sandbox, which blocks Babel's eval — the cards
// render their felt and nothing else. `ui_kits/game/index.html` uses a plain
// `<script>` and renders there, which is what identified the cause.
//
// The demo source moves to `previews/<group>.card.jsx` verbatim so it stays
// readable and editable; the card loads the compiled sibling.
//
// Run: node scripts/precompile-design-cards.mjs

import { build } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const system = join(root, "docs", "design-system");
const previews = join(system, "previews");

const CARDS = ["game", "hud", "flow"].map((group) => ({
  group,
  html: join(system, "components", group === "game" ? "game" : group, `${group}.card.html`),
}));

const BABEL_BLOCK = /<script type="text\/babel">\n([\s\S]*?)<\/script>/;
const BABEL_TAG = /^.*@babel\/standalone.*\n/m;

mkdirSync(previews, { recursive: true });

for (const { group, html } of CARDS) {
  const source = readFileSync(html, "utf8");
  const match = source.match(BABEL_BLOCK);
  if (!match) {
    console.log(`${group}: already compiled, skipping`);
    continue;
  }

  const entry = join(previews, `${group}.card.jsx`);
  writeFileSync(entry, match[1]);

  await build({
    root: system,
    configFile: false,
    plugins: [react({ jsxRuntime: "classic" })],
    logLevel: "warn",
    build: {
      outDir: previews,
      emptyOutDir: false,
      minify: false,
      lib: { entry, name: `Card_${group}`, formats: ["iife"], fileName: () => `${group}.card.js` },
      rollupOptions: {
        external: ["react", "react-dom"],
        output: { globals: { react: "React", "react-dom": "ReactDOM" } },
      },
    },
  });

  const rewritten = source
    .replace(BABEL_TAG, "")
    .replace(BABEL_BLOCK, `<script src="../../previews/${group}.card.js"></script>`);
  writeFileSync(html, rewritten);
  console.log(`${group}: demo -> previews/${group}.card.jsx, card loads previews/${group}.card.js`);
}

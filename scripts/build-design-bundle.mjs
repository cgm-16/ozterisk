// Compiles the Tile House reference components into the single bundle that the
// design-system preview cards load as `../../_ds_bundle.js`.
//
// The handover in `docs/design-system/` is a design-project export, and the export
// omitted this file — so `components/*/*.card.html` render blank without it. The
// components themselves are the source of truth; this only compiles them.
//
// Run: node scripts/build-design-bundle.mjs

import { build } from "vite";
import react from "@vitejs/plugin-react";
import { readdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const system = join(root, "docs", "design-system");
const components = join(system, "components");
const entry = join(system, "_ds_entry.js");

// The cards destructure every component off one namespace, so the barrel must
// re-export all of them regardless of which group they live in.
const modules = readdirSync(components, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((group) =>
    readdirSync(join(components, group.name))
      .filter((f) => f.endsWith(".jsx"))
      .map((f) => `./components/${group.name}/${f}`),
  )
  .sort();

writeFileSync(entry, modules.map((m) => `export * from "${m}";\n`).join(""));

try {
  await build({
    root: system,
    configFile: false,
    // The cards load React from a UMD script tag, so the bundle must not carry
    // its own copy — `jsxRuntime: "classic"` keeps output on `React.createElement`
    // rather than the automatic runtime's bare `react/jsx-runtime` import, which
    // has no UMD global to map onto.
    plugins: [react({ jsxRuntime: "classic" })],
    logLevel: "warn",
    build: {
      outDir: system,
      emptyOutDir: false,
      minify: false,
      lib: {
        entry,
        name: "OzteriskDesignSystem",
        formats: ["iife"],
        fileName: () => "_ds_bundle.js",
      },
      rollupOptions: {
        external: ["react", "react-dom"],
        output: { globals: { react: "React", "react-dom": "ReactDOM" } },
      },
    },
  });
} finally {
  rmSync(entry, { force: true });
}

console.log(`built ${relative(root, join(system, "_ds_bundle.js"))} from ${modules.length} components`);

/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    /* Unit tests live in src/. Vitest's default glob also matches
       e2e/*.spec.ts, and running a Playwright spec under jsdom fails with
       "Playwright Test did not expect test() to be called here". */
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});

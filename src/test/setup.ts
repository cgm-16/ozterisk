import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { JSDOM } from "jsdom";

/* Node 26 ships a Web Storage `localStorage` global that is inert unless the
   runtime is started with --localstorage-file, and it overwrites the one jsdom
   installs. In this environment `window === globalThis`, so both spellings
   resolve to Node's and read as undefined.

   Mint a real jsdom Storage and bind it back. A hand-rolled stand-in would
   diverge from the implementation the app meets in a browser, which is the
   reason these tests run under jsdom at all.

   `Storage` is rebound from the same window as the instance: tests spy on
   `Storage.prototype.setItem`, and a prototype from a different jsdom realm
   than the instance would leave those spies watching nothing. */
const storageWindow = new JSDOM("", { url: "http://localhost" }).window;

for (const [name, value] of [
  ["Storage", storageWindow.Storage],
  ["localStorage", storageWindow.localStorage],
] as const) {
  Object.defineProperty(globalThis, name, {
    value,
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  cleanup();
});

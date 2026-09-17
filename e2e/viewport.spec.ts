import { test, expect, type Page } from "@playwright/test";

/* §8.5 — "No horizontal scroll at 320px" — walked across every gallery state in
   both locales.
 *
 * This exists because jsdom performs no layout, so the 341 unit tests cannot
 * see an overflow at all: that is how #84 survived a measurement pass. It also
 * exists because #85 took four manual attempts to measure, and three of them
 * came back clean while measuring the wrong thing. Those three are the reason
 * for the guards below — every one of them would have failed a guard, and none
 * of them would have failed on "did anything overflow".
 *
 * Method and the four attempts: docs/journal/journal-2026-09-15.md.
 */

/* 320 is §8.5's bar. 305 is what a 320px window actually gives the page once a
   classic scrollbar takes its 15px of layout width — the condition #85 names,
   and the reason a sweep at 320 alone is not enough. 407 is the last width
   below `spacing.css`'s `min-width: 408px`, so it pins the narrow rack tier's
   upper edge; a regression that only appears one pixel under the breakpoint has
   somewhere to be caught.
   Layout cannot tell why it has a given content width, only what it is, so
   setting the content width directly is equivalent to producing the scrollbar
   that reduced it. */
const CONTENT_WIDTHS = [305, 320, 407] as const;
const LOCALES = ["en", "ko"] as const;
const NARROW_TIER_MAX = 407;
const STATE_COUNT = 19;

/* `action.start` in both locales. Pinned here because the arena sweep below
   has to reach `answering`, and the accessible name is the only stable handle
   on that control. */
const START_LABEL = { en: "Start Run", ko: "게임 시작" } as const;

interface StateReading {
  state: string;
  elements: number;
  peak: number;
  past: number;
  horizontalScroll: boolean;
}

/** Sizes the window so the *content* box is exactly `width`, whatever the
    scrollbar does. Playwright's viewport sets the outer box, so a scrollbar
    that takes layout width would otherwise silently shift every reading. */
async function setContentWidth(page: Page, width: number): Promise<number> {
  await page.setViewportSize({ width, height: 900 });
  const gutter = await page.evaluate(() => window.innerWidth - document.documentElement.clientWidth);
  if (gutter > 0) await page.setViewportSize({ width: width + gutter, height: 900 });
  return gutter;
}

/** Walks every gallery state, returning one reading each. The element count is
    part of the reading rather than a detail: a sweep rooted at the wrong node
    measures nothing and reports it clean, which is what T62 hit when it swept
    `main` on the four interaction boards. */
async function sweep(page: Page): Promise<StateReading[]> {
  const buttons = page.locator("button[aria-pressed]");
  const states = (await buttons.count()) - 4; // the LanguageToggle segments render twice
  expect(states, "gallery state count").toBe(STATE_COUNT);

  const readings: StateReading[] = [];
  for (let i = 0; i < STATE_COUNT; i += 1) {
    await buttons.nth(i + 2).click();
    readings.push(
      await page.evaluate(() => {
        const stage = document.querySelector('div[class*="stage"]');
        if (!stage) throw new Error("no gallery stage — the sweep root is wrong");
        const viewport = document.documentElement.clientWidth;
        let peak = 0;
        let past = 0;
        let elements = 0;
        for (const el of [stage, ...stage.querySelectorAll("*")]) {
          const box = el.getBoundingClientRect();
          if (!box.width && !box.height) continue;
          elements += 1;
          if (box.right > peak) peak = box.right;
          if (box.right > viewport + 0.5) past += 1;
        }
        // Skip the two LanguageToggle segments, which also carry aria-pressed
        // and would otherwise label every reading "English".
        const picker = [...document.querySelectorAll("button[aria-pressed]")].slice(2);
        return {
          state: picker.find((b) => b.getAttribute("aria-pressed") === "true")?.textContent ?? "?",
          elements,
          peak: Number(peak.toFixed(1)),
          past,
          horizontalScroll: document.documentElement.scrollWidth > viewport,
        };
      }),
    );
  }
  return readings;
}

for (const width of CONTENT_WIDTHS) {
  for (const locale of LOCALES) {
    test(`no element escapes a ${width}px viewport in ${locale}`, async ({ page }) => {
      // Set before the first load: switching locale at runtime hangs the
      // renderer on the lazy Hangul font import.
      await page.addInitScript(
        (lang) => window.localStorage.setItem("one-zero.language", lang),
        locale,
      );
      await page.goto("/gallery.html");
      await setContentWidth(page, width);
      // Fonts change metrics, so a reading taken before they resolve is a
      // reading of the fallback face.
      await page.evaluate(() => document.fonts.ready);

      const viewport = await page.evaluate(() => document.documentElement.clientWidth);

      // Guards on the conditions of the reading, asserted before its result.
      // Each of these caught a manual attempt that reported no overflow.
      expect(viewport, "content width the harness actually produced").toBe(width);
      expect(viewport, "narrow rack tier — spacing.css min-width: 408px").toBeLessThanOrEqual(
        NARROW_TIER_MAX,
      );

      const readings = await sweep(page);

      // A locale that silently failed to load renders as the other one, and
      // every figure below would still read clean.
      const languageActive = await page.evaluate(() => {
        const [en] = document.querySelectorAll("button[aria-pressed]");
        return en.getAttribute("aria-pressed") === "true" ? "en" : "ko";
      });
      expect(languageActive, "active language segment").toBe(locale);

      for (const reading of readings) {
        expect(reading.elements, `${reading.state}: elements swept`).toBeGreaterThan(0);
        expect(reading.past, `${reading.state}: elements past the right edge`).toBe(0);
        expect(reading.horizontalScroll, `${reading.state}: horizontal scroll`).toBe(false);
        expect(reading.peak, `${reading.state}: peak right edge`).toBeLessThanOrEqual(viewport);
        // A collapsed container would satisfy every assertion above by being
        // too small to overflow anything.
        expect(reading.peak, `${reading.state}: content spans the viewport`).toBeGreaterThan(
          viewport / 2,
        );
      }

      // The states differ from each other by tens of elements — 10 on the
      // sparsest interaction board against 85 at streak 8 — so one figure
      // repeated nineteen times means the walk never left the first state.
      // T62 asked for a figure per state precisely because a range cannot tell
      // nineteen states measured once from one state measured nineteen times.
      const distinctCounts = new Set(readings.map((r) => r.elements));
      expect(distinctCounts.size, "distinct element counts across states").toBeGreaterThan(1);
    });
  }
}

/* The sweep above walks `gallery.html`, and #85 is invisible from there. The
   gallery renders each state inside `.board`, a mirror of `.screen` that sits
   in `.stage` — a different element, with its own padding and its own
   `min-width: 0`. The app's own `main.screen` is never in that tree, and
   `main.screen` is the element that overflows.
 *
 * Why it overflows: `.app` is a column flex container, so `main` is a flex
 * item whose cross axis is horizontal, and `.screen`'s `margin: 0 auto`
 * suppresses the stretch that would size it to its container. That leaves it
 * `fit-content`, which is floored by min-content — the rack's fixed tracks
 * plus the arena's padding — and no `min-width` can lower a fit-content floor.
 *
 * 305 is the content width a 320px window gives the page once a classic
 * scrollbar takes its 15px, and the narrow tier still fires there, so this
 * reproduces the condition without depending on the platform to draw a
 * scrollbar at all.
 */
for (const locale of LOCALES) {
  test(`the arena fits a 305px viewport in ${locale}`, async ({ page }) => {
    await page.addInitScript(
      (lang) => window.localStorage.setItem("one-zero.language", lang),
      locale,
    );
    await page.goto("/");
    await page.setViewportSize({ width: 305, height: 900 });
    await page.evaluate(() => document.fonts.ready);

    // The rack only exists in `answering`, and the rack is what sets the
    // floor. On `title` the arena has nothing wide in it and every assertion
    // below would pass without measuring the thing this test is about.
    //
    // By name rather than position: `TitleScreen` renders `LanguageToggle`
    // inside its own `<main>`, so the first button in the arena is `English`,
    // and clicking that leaves the run unstarted and the rack absent.
    await page.getByRole("button", { name: START_LABEL[locale], exact: true }).click();
    await expect(page.locator('[class*="inventory"]')).toBeVisible();

    const reading = await page.evaluate(() => {
      const de = document.documentElement;
      const main = document.querySelector("main")!;
      const rack = document.querySelector('[class*="inventory"]')!;
      const cell = document.querySelector('[class*="cell"], [class*="socket"]')!;
      return {
        viewport: de.clientWidth,
        scrollWidth: de.scrollWidth,
        mainWidth: main.getBoundingClientRect().width,
        rackWidth: rack.getBoundingClientRect().width,
        renderedTileW: cell.getBoundingClientRect().width,
        targetMin: parseFloat(getComputedStyle(de).getPropertyValue("--target-min")),
      };
    });

    // Guards on the conditions, before the result: a reading taken at the
    // wrong width, or with the rack absent, proves nothing.
    expect(reading.viewport, "content width the harness produced").toBe(305);
    expect(reading.viewport, "narrow rack tier — spacing.css min-width: 408px").toBeLessThanOrEqual(
      NARROW_TIER_MAX,
    );
    expect(reading.rackWidth, "rack rendered").toBeGreaterThan(0);

    expect(reading.mainWidth, "arena width against the viewport").toBeLessThanOrEqual(
      reading.viewport,
    );
    expect(reading.scrollWidth, "document scroll width").toBeLessThanOrEqual(reading.viewport);

    // §1.12 makes the tier figure a maximum and --target-min the floor. Both
    // halves are load-bearing: a rack that fits by shrinking past the target
    // minimum has traded a WCAG failure for a layout one, and the assertion
    // above alone would not notice.
    expect(reading.renderedTileW, "rendered tile width against the target minimum")
      .toBeGreaterThanOrEqual(reading.targetMin);
  });
}

/* Below a 276px content box the target minimum starts to bind — five tiles at
   44 plus four gaps at 8 is 252, and the arena spends 24 more on padding. The
   rack stops shrinking there and the page scrolls instead.
 *
 * That trade is the point of the floor, so it gets its own reading. §8.5 asks
 * for no horizontal scroll at 320px and is silent below it; the target minimum
 * has no lower bound. Browser zoom is how a real reader arrives here, and a
 * reader at 400% is precisely the one who needs 44px kept.
 *
 * One locale: the rack's tracks are fixed lengths and the Hangul face changes
 * no figure in this reading. The 305px sweep above covers both.
 */
test("the rack holds the target minimum below the 320px gate", async ({ page }) => {
  await page.goto("/");
  await page.setViewportSize({ width: 260, height: 900 });
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("button", { name: START_LABEL.en, exact: true }).click();
  await expect(page.locator('[class*="inventory"]')).toBeVisible();

  const reading = await page.evaluate(() => {
    const de = document.documentElement;
    const cell = document.querySelector('[class*="cell"], [class*="socket"]')!;
    return {
      viewport: de.clientWidth,
      renderedTileW: cell.getBoundingClientRect().width,
      targetMin: parseFloat(getComputedStyle(de).getPropertyValue("--target-min")),
    };
  });

  expect(reading.viewport, "content width the harness produced").toBe(260);
  expect(reading.viewport, "below the width where the floor binds").toBeLessThan(276);

  // The only assertion this width gets. Horizontal scroll here is the
  // deliberate consequence of keeping the control legal, so asserting its
  // absence would lock in the opposite trade.
  expect(reading.renderedTileW, "rendered tile width against the target minimum")
    .toBeGreaterThanOrEqual(reading.targetMin);
});

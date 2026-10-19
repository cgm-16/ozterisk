// Checks candidate suit glyphs against Unicode emoji-data 16.0 (downloaded to emoji-data.txt).
import { readFileSync } from "node:fs";
const rows = readFileSync(new URL("./emoji-data.txt", import.meta.url), "utf8").split("\n")
  .filter((l) => l && !l.startsWith("#")).map((l) => {
    const [range, prop] = l.split("#")[0].split(";").map((s) => s.trim());
    const [a, b] = range.split("..").map((h) => parseInt(h, 16));
    return { a, b: b ?? a, prop };
  });
const props = (cp) => rows.filter((r) => cp >= r.a && cp <= r.b).map((r) => r.prop);
const cands = { "U+25CF ● (dots)": 0x25cf, "U+25CB ○": 0x25cb, "U+25B2 ▲": 0x25b2, "U+25C6 ◆": 0x25c6,
  "U+2016 ‖ (bamboo)": 0x2016, "U+842C 萬": 0x842c, "U+7B52 筒": 0x7b52, "U+7D22 索": 0x7d22,
  "U+B9CC 만": 0xb9cc, "U+D1B5 통": 0xd1b5, "U+C0AD 삭": 0xc0ad, "U+2733 ✳ (wordmark)": 0x2733, "U+25A0 ■ (05 Card)": 0x25a0,
  "CONTROL U+1F7E9 🟩 (must be emoji)": 0x1f7e9, "CONTROL U+26AB ⚫ (must be emoji)": 0x26ab, "CONTROL U+1F004 🀄 (must be emoji)": 0x1f004,
  "U+1F019 mahjong one of circles": 0x1f019 };
for (const [k, cp] of Object.entries(cands)) console.log(k.padEnd(38), props(cp).join(", ") || "(none: not emoji)");

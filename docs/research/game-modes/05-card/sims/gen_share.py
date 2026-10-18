# Generates draft/share-grid.svg from the two simulated example cards (engine seeds 100025, 100001).
import sys
from xml.sax.saxutils import escape
out = sys.argv[1]
UI = "'Zen Kaku Gothic New', 'Helvetica Neue', Arial, sans-serif"
MSG_EN = "'Helvetica Neue', Arial, sans-serif"
MSG_KO = "'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif"
INK = "#f7f0e2"
won = ["s","sb","sbs","ssbb","ssssb","sssssb","sbsssbb","ssssbbss","sssssbbss"]
lost = ["n","ss","sbn","ssss","sbbnb","sbsssb","sbnnbsn","ssbsbnsb","sssbbsbbs"]
grid = lambda rows: ["".join("■" if c == "s" else "□" for c in r) for r in rows]
assert sum(r.count("s") for r in won) == 32 and sum(r.count("s") for r in lost) == 23
en = ["ozterisk Card — Run Complete — Rounds: 45", "Score: 32", "Longest streak: 6", ""] + grid(won) + ["", "Can you beat it?", "{url}"]
ko = ["ozterisk 카드 — 게임 종료 — 라운드: 38", "점수: 23", "최장 연속 정답: 11", ""] + grid(lost) + ["", "이 기록을 넘을 수 있나요?", "{url}"]
p = []
a = p.append
a('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 620" width="800" height="620" role="img" aria-labelledby="t d">')
a('<title id="t">Card mode share text: the card as a 45-glyph staircase</title>')
a('<desc id="d">Two share messages. Left, English: ozterisk Card, Run Complete, Rounds 45, Score 32, Longest streak 6, then nine lines of filled and hollow squares growing from one to nine glyphs, one per fact. Right, Korean: a lost run, rounds 38, score 23, longest streak 11, with the same staircase where hollow squares mark facts missed or never dealt. Notes below explain the row order and that both glyphs are not emoji code points.</desc>')
a('<rect width="800" height="620" fill="#071711"/>')
a(f'<text x="24" y="36" font-family="{UI}" font-size="15" fill="{INK}">Share text: the card as a 45-glyph staircase</text>')
def bubble(x, caption, lines, font):
    a(f'<text x="{x}" y="66" font-family="{UI}" font-size="11" letter-spacing="1.4" fill="{INK}" fill-opacity=".55">{escape(caption)}</text>')
    a(f'<rect x="{x}" y="78" width="364" height="374" rx="16" fill="#fdf8ec"/>')
    for i, line in enumerate(lines):
        if not line: continue
        y = 108 + i * 21
        is_grid = set(line) <= set("■□")
        size = 17 if is_grid else 15
        op = ' fill-opacity=".6"' if line == "{url}" else ""
        a(f'<text x="{x+18}" y="{y}" font-family="{font}" font-size="{size}" fill="#16352b"{op}>{escape(line)}</text>')
bubble(24, "ENGLISH · A COMPLETED CARD (SIMULATED RUN)", en, MSG_EN)
bubble(412, "KOREAN · A LOST RUN, 38 OF 45 DEALT (SIMULATED)", ko, MSG_KO)
notes = [
    "■ stamped  ·  □ missed, or never dealt. Row n lists 1×n … n×n, so lines grow from 1 to 9 glyphs and none",
    "starts with a space (messengers collapse leading spaces). The left card's first column is the 1-table, cleared.",
    "U+25A0 ■ and U+25A1 □ are not emoji code points (Unicode emoji-data 16.0); Wordle's U+1F7E9 and U+2B1B are.",
    "As rendered here (macOS QuickLook): Helvetica Neue sets them small, Apple SD Gothic Neo full-width; each aligns.",
    "Cards: engine.ts runs, fixed 15 sockets, kind 0.2, aware bot, seeds 100025 and 100001.",
]
for i, n in enumerate(notes):
    a(f'<text x="24" y="{486 + i*19}" font-family="{UI}" font-size="12" fill="{INK}" fill-opacity=".72">{escape(n)}</text>')
a('</svg>')
open(out, "w").write("\n".join(p) + "\n")

#!/usr/bin/env python3
# Generates the key-moment mockup: West takes East's live 7.
import sys
OUT = sys.argv[1]
SERIF = "'EB Garamond', Georgia, 'Times New Roman', serif"
UI = "'Zen Kaku Gothic New', 'Helvetica Neue', Arial, sans-serif"
KO = "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif"
CJK = "'Noto Serif KR', 'Apple SD Gothic Neo', 'Hiragino Mincho ProN', serif"
INK = "#f7f0e2"
W, H = 390, 790
o = []
a = o.append

def tile(x, y, label, big=True, rim=None, font=SERIF, size=None):
    w, h, r, e = (52, 64, 6, 5) if big else (30, 38, 4, 3)
    fs = size or (34 if big else 20)
    a(f'<rect x="{x}" y="{y+e}" width="{w}" height="{h}" rx="{r}" fill="#b3a184"/>')
    a(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="url(#face)"/>')
    if rim:
        a(f'<rect x="{x-3}" y="{y-3}" width="{w+6}" height="{h+e+6}" rx="{r+3}" fill="none" stroke="{rim}" stroke-width="2"/>')
    a(f'<text x="{x+w/2}" y="{y+h*0.69:.1f}" text-anchor="middle" font-family="{font}" font-size="{fs}" fill="#16352b">{label}</text>')

def socket(x, y, big=True):
    w, h, r = (52, 64, 6) if big else (30, 38, 4)
    a(f'<rect x="{x}" y="{y}" width="{w}" height="{h+ (5 if big else 3)}" rx="{r}" fill="#081a14"/>')

def text(x, y, s, size=11, fill=INK, op=1, anchor="start", font=UI, weight=400, ls=1.2):
    a(f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="{font}" font-size="{size}" font-weight="{weight}" letter-spacing="{ls}" fill="{fill}" fill-opacity="{op}">{s}</text>')

a(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-labelledby="t d">')
a('<title id="t">Table for Two: West takes East\'s thrown 7</title>')
a('<desc id="d">Phone screen, West to play, round 9. East\'s rack sits small at the top; below it, on the felt, the 7 East just threw is outlined in gold and labelled Take. The equation is 9 times 8 with two empty answer slots. West\'s rack at the bottom holds 0 1 2 2 4 5 6 8 9 and one empty socket, and no 7. A dashed gold arrow runs from East\'s 7 down the right margin into West\'s empty socket. A note reads: taking costs one reward tile.</desc>')
a('<defs><linearGradient id="face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdf8ec"/><stop offset="1" stop-color="#e6d7ba"/></linearGradient>'
  '<marker id="head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#c9a54a"/></marker></defs>')
a(f'<rect width="{W}" height="{H}" fill="#14342a"/>')

# HUD: whose turn, round
tile(16, 14, "西", big=False, rim="#c9a54a", font=CJK, size=18)
text(58, 30, "WEST TO PLAY", 12, "#e8cd85", weight=700, ls=2)
text(58, 47, "서 차례", 11, INK, .72, font=KO, ls=0)
text(374, 27, "ROUND", 11, INK, .55, "end", ls=2)
text(374, 56, "9", 30, INK, 1, "end", font=SERIF, ls=0)

# East's panel: compact rack, display only
a('<rect x="12" y="72" width="366" height="122" rx="12" fill="#0b211b"/>')
tile(24, 84, "東", big=False, font=CJK, size=18)
text(64, 100, "EAST · 10 TILES", 11, INK, .72, ls=1.8)
text(64, 116, "동 · 10개", 11, INK, .55, font=KO, ls=0)
east = ["0", "1", "3", "3", "4", "5", "6", "7", "8", "9"]
# East's rack as one 5x2 block at the right of the panel
for i, d in enumerate(east):
    col, row = i % 5, i // 5
    tile(206 + col * 34, 86 + row * 46, d, big=False)
text(64, 140, "could have thrown", 11, INK, .55, ls=0.3)
text(64, 155, "a spare 3 instead", 11, INK, .55, ls=0.3)

# East's river: the live throw, on the felt in front of East
text(24, 226, "EAST THREW · LIVE THIS TURN", 11, INK, .72, ls=1.6)
text(24, 243, "동이 버린 패", 11, INK, .55, font=KO, ls=0)
tile(300, 210, "7", rim="#c9a54a")
a('<rect x="232" y="252" width="56" height="20" rx="10" fill="none" stroke="#c9a54a" stroke-width="1"/>')
text(260, 266, "TAKE", 11, "#e8cd85", anchor="middle", weight=700, ls=1.6)
text(260, 291, "가져오기", 11, INK, .72, "middle", font=KO, ls=0)

# Equation and empty answer slots
text(195, 362, "9 × 8", 54, INK, 1, "middle", font=SERIF, ls=0)
for x in (131, 203):
    a(f'<rect x="{x}" y="386" width="56" height="70" rx="6" fill="none" stroke="#c9a54a" stroke-width="1" stroke-dasharray="5 4"/>')
text(195, 484, "West holds no 7", 12, INK, .72, "middle", ls=0.4)

# Arrow: from the live 7 down the right margin into West's empty socket
a('<path d="M355 244 C376 244 378 262 378 282 L378 630 C378 652 370 656 349 656" fill="none" stroke="#c9a54a" stroke-width="1.6" stroke-dasharray="6 5" marker-end="url(#head)"/>')
text(370, 452, "one reward", 11, "#e8cd85", anchor="end", ls=0.3)
text(370, 467, "tile fewer", 11, "#e8cd85", anchor="end", ls=0.3)

# West's rack, the active rack, full size
a('<rect x="37" y="506" width="316" height="172" rx="12" fill="#0b211b"/>')
west = ["0", "1", "2", "2", "4", "5", "6", "8", "9", None]
for i, d in enumerate(west):
    col, row = i % 5, i // 5
    x, y = 49 + col * 60, 520 + row * 80
    socket(x, y)
    if d is not None:
        tile(x, y, d)
tile(16, 694, "西", big=False, rim="#c9a54a", font=CJK, size=18)
text(56, 711, "WEST · 9 TILES", 11, INK, .72, ls=1.8)
text(56, 727, "서 · 9개", 11, INK, .55, font=KO, ls=0)

# Actions
for x, label in ((206, "SUBMIT"), (296, "CLEAR")):
    a(f'<rect x="{x}" y="696" width="82" height="44" rx="6" fill="none" stroke="{INK}" stroke-opacity=".4" stroke-width="1"/>')
    text(x + 41, 723, label, 11, INK, .55, "middle", weight=700, ls=2)
text(195, 770, "Taking costs one tile: one reward fewer if right, one throw if wrong.", 11, INK, .55, "middle", ls=0)
a('</svg>')
open(OUT, "w").write("\n".join(o) + "\n")

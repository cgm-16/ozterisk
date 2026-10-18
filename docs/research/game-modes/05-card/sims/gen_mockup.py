# Generates draft/card-stamp.svg (hand-authored layout, emitted by script for exact geometry).
import sys
out = sys.argv[1]
SERIF = "'EB Garamond', Georgia, 'Times New Roman', serif"
UI = "'Zen Kaku Gothic New', 'Helvetica Neue', Arial, sans-serif"
INK = "#f7f0e2"
rows = ["s", "sm", "sso", "sosm", "ssmso", "ossmso", "smsosso", "ssomsoSo", "osmsosmom"]
assert sum(r.count("s") + r.count("S") for r in rows) == 23 and sum(r.count("m") for r in rows) == 9 and sum(r.count("o") for r in rows) == 13
p = []
a = p.append
a(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 844" width="390" height="844" role="img" aria-labelledby="t d">')
a('<title id="t">Card mode: round 32 of 45, 7 × 8 just stamped</title>')
a('<desc id="d">Phone mockup. The HUD band holds round 32 of 45, score 23 and streak 4 beside the times-table card: a lower-left triangle of 45 cells, one per fact, with 23 gold stamps, 9 cells crossed as missed and 13 still to come. The cell for 7 × 8 carries a fresh gold ring. Below, the equation 7 × 8 with answer tiles 5 and 6 in jade rings, the line Correct, Your answer: 56, a Next Round button, and a fixed fifteen-socket tray holding thirteen tiles, three of them new rewards outlined in gold.</desc>')
a('<defs><linearGradient id="face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdf8ec"/><stop offset="1" stop-color="#e6d7ba"/></linearGradient></defs>')
a('<rect width="390" height="844" fill="#14342a"/>')
# HUD band on an opaque carrier plate
a('<rect x="12" y="18" width="366" height="226" rx="10" fill="#0b211b" stroke="#1b4436"/>')
def label(x, y, s, anchor="start", op=.55):
    a(f'<text x="{x}" y="{y}" font-family="{UI}" font-size="11" letter-spacing="1.6" fill="{INK}" fill-opacity="{op}" text-anchor="{anchor}">{s}</text>')
label(28, 48, "ROUND")
a(f'<text x="28" y="94" font-family="{SERIF}" font-size="44" fill="{INK}">32</text>')
a(f'<text x="80" y="94" font-family="{SERIF}" font-size="20" fill="{INK}" fill-opacity=".55">/ 45</text>')
label(28, 130, "SCORE")
a(f'<text x="28" y="160" font-family="{SERIF}" font-size="28" fill="{INK}">23</text>')
label(28, 194, "STREAK")
a(f'<text x="28" y="224" font-family="{SERIF}" font-size="28" fill="{INK}">4</text>')
# The card: lower-left triangle, column a = 1..9, row b = 1..9, cell (a, b) for a <= b
cx0, cy0, P, C = 206, 62, 16, 13
label(cx0 - 14, 34, "CARD")
for k in range(9):
    a(f'<text x="{cx0 + k*P + 6.5}" y="{cy0 - 6}" font-family="{SERIF}" font-size="11" fill="{INK}" fill-opacity=".55" text-anchor="middle">{k+1}</text>')
    a(f'<text x="{cx0 - 5}" y="{cy0 + k*P + 10.5}" font-family="{SERIF}" font-size="11" fill="{INK}" fill-opacity=".55" text-anchor="end">{k+1}</text>')
for b, row in enumerate(rows):
    for col, st in enumerate(row):
        x, y = cx0 + col*P, cy0 + b*P
        if st in "sS":
            a(f'<rect x="{x}" y="{y}" width="{C}" height="{C}" rx="2" fill="#c9a54a" stroke="#9a7f36" stroke-width="1"/>')
            if st == "S":
                a(f'<rect x="{x-3}" y="{y-3}" width="{C+6}" height="{C+6}" rx="4" fill="none" stroke="#e8cd85" stroke-width="1.5"/>')
        else:
            a(f'<rect x="{x+.5}" y="{y+.5}" width="{C-1}" height="{C-1}" rx="2" fill="#081a14" stroke="{INK}" stroke-opacity=".22"/>')
            if st == "m":
                a(f'<path d="M{x+3.5} {y+3.5}L{x+C-3.5} {y+C-3.5}M{x+C-3.5} {y+3.5}L{x+3.5} {y+C-3.5}" stroke="{INK}" stroke-opacity=".6" stroke-width="1.4" stroke-linecap="round"/>')
# Key in the triangle's empty upper-right corner: the counts double as the forecast.
for i, (st, txt) in enumerate([("s", "23 stamped"), ("m", "9 missed"), ("o", "13 to come")]):
    kx, ky = 292, 74 + i*17
    if st == "s":
        a(f'<rect x="{kx}" y="{ky}" width="10" height="10" rx="2" fill="#c9a54a" stroke="#9a7f36"/>')
    else:
        a(f'<rect x="{kx+.5}" y="{ky+.5}" width="9" height="9" rx="2" fill="#081a14" stroke="{INK}" stroke-opacity=".22"/>')
        if st == "m":
            a(f'<path d="M{kx+3} {ky+3}L{kx+7} {ky+7}M{kx+7} {ky+3}L{kx+3} {ky+7}" stroke="{INK}" stroke-opacity=".6" stroke-width="1.2" stroke-linecap="round"/>')
    a(f'<text x="{kx+15}" y="{ky+9}" font-family="{UI}" font-size="11" fill="{INK}" fill-opacity=".72">{txt}</text>')
# Equation and answer slots
a(f'<text x="195" y="304" font-family="{SERIF}" font-size="54" fill="{INK}" text-anchor="middle">7 × 8</text>')
def tile(x, y, w, h, d, size, ring=None, reward=False):
    edge = 5 if h >= 60 else 4
    if ring:
        a(f'<rect x="{x-4}" y="{y-4}" width="{w+8}" height="{h+8}" rx="9" fill="none" stroke="{ring}" stroke-width="2"/>')
    a(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="#b3a184"/>')
    a(f'<rect x="{x}" y="{y}" width="{w}" height="{h-edge}" rx="6" fill="url(#face)"/>')
    if reward:
        a(f'<rect x="{x+.5}" y="{y+.5}" width="{w-1}" height="{h-1}" rx="6" fill="none" stroke="#c9a54a" stroke-width="1.5"/>')
    a(f'<text x="{x + w/2}" y="{y + (h-edge)/2 + size*0.34}" font-family="{SERIF}" font-size="{size}" fill="#16352b" text-anchor="middle">{d}</text>')
tile(124, 328, 64, 80, 5, 42, ring="#4f9d7c")
tile(202, 328, 64, 80, 6, 42, ring="#4f9d7c")
a(f'<text x="195" y="444" font-family="{UI}" font-size="14" fill="{INK}" fill-opacity=".85" text-anchor="middle">Correct · Your answer: 56</text>')
a(f'<rect x="127.5" y="462.5" width="135" height="44" rx="8" fill="none" stroke="{INK}" stroke-opacity=".38"/>')
a(f'<text x="195" y="489" font-family="{UI}" font-size="12" letter-spacing="2.2" fill="{INK}" fill-opacity=".9" text-anchor="middle">NEXT ROUND</text>')
# Fixed fifteen-socket tray: 5 x 3 of 48 x 60, gap 6 (Classic's mid rack, never sealing)
a('<rect x="54" y="528" width="282" height="208" rx="10" fill="#0b211b" stroke="#1b4436"/>')
hand = [(0,0),(1,0),(1,0),(2,0),(2,1),(3,0),(4,0),(4,1),(6,0),(7,0),(8,0),(9,0),(9,1)]
for i in range(15):
    r, c = divmod(i, 5)
    x, y = 63 + c*54, 536 + r*66
    if i < len(hand):
        d, new = hand[i]
        tile(x, y, 48, 60, d, 32, reward=bool(new))
    else:
        a(f'<rect x="{x}" y="{y}" width="48" height="60" rx="6" fill="#081a14" stroke="{INK}" stroke-opacity=".12"/>')
a(f'<text x="195" y="770" font-family="{UI}" font-size="11" letter-spacing="1.6" fill="{INK}" fill-opacity=".55" text-anchor="middle">TRAY · 13 OF 15</text>')
a('</svg>')
open(out, "w").write("\n".join(p) + "\n")

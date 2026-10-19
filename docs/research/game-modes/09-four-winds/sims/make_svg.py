# Writes the landing mockup SVG (deliverable) into the draft folder.
import sys
OUT = sys.argv[1]
NUM = "'EB Garamond', Georgia, 'Times New Roman', serif"
CJK = "'EB Garamond', 'Hiragino Mincho ProN', 'Songti SC', 'Noto Serif CJK JP', serif"
UI = "'Zen Kaku Gothic New', 'Helvetica Neue', Arial, sans-serif"
INK = "#f7f0e2"
o = []
a = o.append

def tile(x, y, w, h, label, size, face=False, gold=False, font=NUM, r=6):
    a(f'<rect x="{x}" y="{y+5}" width="{w}" height="{h-5}" rx="{r}" fill="#b3a184"/>')
    a(f'<rect x="{x}" y="{y}" width="{w}" height="{h-5}" rx="{r}" fill="url(#clay)"/>')
    if face:
        i = 4 if w < 40 else 5
        a(f'<rect x="{x+i}" y="{y+i}" width="{w-2*i}" height="{h-5-2*i}" rx="{max(2,r-2)}" fill="none" stroke="#9a7f36" stroke-width="1"/>')
    col = "#c9a54a" if gold else "#16352b"
    a(f'<text x="{x+w/2}" y="{y+(h-5)/2+size*0.34}" text-anchor="middle" font-family="{font}" font-size="{size}" fill="{col}">{label}</text>')

def text(x, y, s, size=11, fill=INK, op=1, anchor="start", weight=400, spacing=0, font=UI):
    a(f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="{font}" font-size="{size}" font-weight="{weight}" letter-spacing="{spacing}" fill="{fill}" fill-opacity="{op}">{s}</text>')

a('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 800" width="390" height="800" role="img" aria-labelledby="t d">')
a('<title id="t">Four Winds: the landing between South and West</title>')
a('<desc id="d">Phone mockup. The wind tile has turned from South to West. The plate states West\'s twist, small tables with no faces, seven sleeps, and that North will be odd tables, zero sleeps. Three boon buttons are offered: one more socket, a wildcard, two faces. Below, the fifteen-socket tray that will close to ten, and the course strip of four winds with capacities 20, 15, 10 and 5.</desc>')
a('<defs><linearGradient id="clay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdf8ec"/><stop offset="1" stop-color="#e6d7ba"/></linearGradient></defs>')
a('<rect width="390" height="800" fill="#071711"/>')
a('<rect x="8" y="8" width="374" height="784" rx="22" fill="#14342a"/>')
# HUD plate
a('<rect x="20" y="20" width="350" height="50" rx="8" fill="#0b211b"/>')
for i, (k, v) in enumerate([("ROUND", "17"), ("SCORE", "11"), ("STREAK", "0"), ("CAPACITY", "15")]):
    cx = 64 + i * 87
    text(cx, 38, k, 10, INK, 0.55, "middle", 500, 1.2)
    text(cx, 62, v, 21 if i else 23, INK, 1, "middle", 500, 0, NUM)
# Wind: South turned to West
tile(24, 88, 52, 64, "西", 30, font=CJK)
text(90, 104, "WEST · WIND 3 OF 4", 11, "#c9a54a", 1, "start", 600, 1.4)
text(90, 120, "南 → 西 · the tray closes a row", 11, INK, 0.72, "start", 400, 0, UI)
a('<rect x="90" y="128" width="280" height="40" rx="6" fill="#0b211b"/>')
text(100, 145, "Small tables: factors 1–6, no faces", 12, INK, 1, "start", 500)
text(100, 161, "7 sleeps", 11, INK, 0.72)
text(24, 186, "NEXT · NORTH", 10, INK, 0.55, "start", 500, 1.2)
tile(122, 172, 30, 38, "北", 17, font=CJK, r=4)
text(160, 186, "Odd tables · 0 sleeps", 11, INK, 0.72)
# Boon offer
text(195, 238, "CHOOSE ONE · LASTS THIS RUN", 11, "#c9a54a", 1, "middle", 600, 1.6)
cards = [("ONE MORE", "SOCKET", "+1 socket from", "here to the end"),
         ("WILDCARD", "", "A ✳ joins", "your hand"),
         ("TWO FACES", "", "O and E join", "your hand")]
for i, (t1, t2, d1, d2) in enumerate(cards):
    x = 24 + i * 116
    focus = i == 2
    a(f'<rect x="{x}" y="252" width="110" height="168" rx="8" fill="#0b211b" stroke="{"#e8cd85" if focus else "#9a7f36"}" stroke-width="{2 if focus else 1}"/>')
    if focus:
        a(f'<rect x="{x+3}" y="255" width="104" height="162" rx="6" fill="none" stroke="#16352b" stroke-width="1"/>')
    if i == 0:
        a(f'<rect x="{x+31}" y="266" width="48" height="60" rx="6" fill="#081a14"/>')
        a(f'<rect x="{x+34}" y="269" width="42" height="54" rx="4" fill="none" stroke="#c9a54a" stroke-opacity="0.72" stroke-dasharray="4 3"/>')
        text(x + 55, 302, "+1", 16, "#c9a54a", 1, "middle", 500, 0, NUM)
    elif i == 1:
        tile(x + 31, 266, 48, 60, "✳", 30, face=True, gold=True)
    else:
        tile(x + 18, 266, 36, 50, "O", 24, face=True)
        tile(x + 58, 266, 36, 50, "E", 24, face=True)
    text(x + 55, 352, t1, 11, INK, 1, "middle", 600, 1.2)
    if t2: text(x + 55, 367, t2, 11, INK, 1, "middle", 600, 1.2)
    text(x + 55, 390, d1, 11, INK, 0.72, "middle")
    text(x + 55, 405, d2, 11, INK, 0.72, "middle")
text(195, 446, "Then keep 10 of these 15: the tray steps to West's ten.", 11, INK, 0.72, "middle")
# Tray: mid rack 5 x 3, tiles 48 x 60, gap 6
a('<rect x="55" y="462" width="280" height="208" rx="10" fill="#0b211b"/>')
hand = ["0", "1", "2", "2", "3", "4", "5", "5", "6", "7", "8", "8", "9", "E", "3–5"]
for k, lab in enumerate(hand):
    r, c = divmod(k, 5)
    x, y = 63 + c * 54, 470 + r * 66
    face = lab in ("E", "3–5")
    tile(x, y, 48, 60, lab, 20 if lab == "3–5" else 28, face=face)
# Course strip
text(24, 700, "THE COURSE", 10, INK, 0.55, "start", 500, 1.2)
course = [("東", "2s and 5s", "20 · done", "done"), ("南", "Odd rain", "15 · done", "done"), ("西", "Small tables", "10 · now", "now"), ("北", "Odd tables", "5", "")]
for i, (w, tw, cap, st) in enumerate(course):
    cx = 66 + i * 86
    tile(cx - 15, 708, 30, 38, w, 17, font=CJK, r=4)
    text(cx, 762, tw, 10, INK, 1 if st == "now" else 0.72, "middle", 600 if st == "now" else 400)
    text(cx, 776, cap + ("" if "·" in cap else " sockets"), 10, INK, 0.55, "middle")
    if st == "now":
        a(f'<rect x="{cx-36}" y="782" width="72" height="2" fill="#c9a54a"/>')
a('</svg>')
open(OUT, "w").write("\n".join(o) + "\n")

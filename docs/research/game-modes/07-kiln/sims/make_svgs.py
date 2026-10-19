# Writes the Kiln draft's SVGs (Tile House tokens). Run: python3 make_svgs.py
import json, os

DRAFT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.dirname(os.path.abspath(__file__))

SURROUND, PANEL, FELT, RAISED, SOCKET = "#071711", "#0b211b", "#14342a", "#1b4436", "#081a14"
EDGE, NUM = "#b3a184", "#16352b"
GOLD, GOLD_D, GOLD_L = "#c9a54a", "#9a7f36", "#e8cd85"
JADE, VERM, VERM_L = "#4f9d7c", "#b5432f", "#e2795f"
INK = "#f7f0e2"
SERIF = "'EB Garamond', Georgia, 'Times New Roman', serif"
SANS = "'Zen Kaku Gothic New', 'Helvetica Neue', Arial, sans-serif"
KR = "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif"

DEFS = f"""<defs>
  <linearGradient id="clay" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fdf8ec"/><stop offset="1" stop-color="#e6d7ba"/>
  </linearGradient>
</defs>"""


def tile(x, y, label, w=52, h=64, face=False, size=None, lift=0, ring=None, dashed=False, weight="500", ringw=2):
    """A clay tile: 5px bottom edge, gradient face, engraved serif numeral."""
    y = y - lift
    r = 6 if w >= 44 else 4
    out = [f'<g>']
    if lift:
        out.append(f'<rect x="{x}" y="{y + lift}" width="{w}" height="{h}" rx="{r}" fill="{SOCKET}"/>')
    out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{EDGE}"/>')
    out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h - 5}" rx="{r}" fill="url(#clay)"/>')
    if face:
        inset = 5 if w >= 44 else 3
        out.append(f'<rect x="{x + inset}" y="{y + inset}" width="{w - 2 * inset}" height="{h - 5 - 2 * inset}" rx="{4 if w >= 44 else 3}" fill="none" stroke="{GOLD_D}" stroke-width="1"/>')
    if ring:
        out.append(f'<rect x="{x - 2}" y="{y - 2}" width="{w + 4}" height="{h + 4}" rx="{r + 2}" fill="none" stroke="{ring}" stroke-width="{ringw}"/>')
    if dashed:
        out.append(f'<rect x="{x - 3}" y="{y - 3}" width="{w + 6}" height="{h + 6}" rx="{r + 3}" fill="none" stroke="{GOLD}" stroke-width="1.5" stroke-dasharray="4 3"/>')
    fs = size or (34 if not face else (25 if "–" in label else 36))
    if w < 44:
        fs = size or (11 if "–" in label else 18)
    cy = y + (h - 5) / 2 + fs * 0.34
    fill = GOLD if label == "✳" else NUM
    out.append(f'<text x="{x + w / 2}" y="{cy:.1f}" text-anchor="middle" font-family="{SERIF}" font-size="{fs}" font-weight="{weight}" fill="{fill}">{label}</text>')
    out.append("</g>")
    return "\n".join(out)


def text(x, y, s, size=11, fill=INK, op=1.0, family=SANS, anchor="start", weight="400", ls=0):
    o = f' fill-opacity="{op}"' if op < 1 else ""
    l = f' letter-spacing="{ls}"' if ls else ""
    return f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" font-weight="{weight}" fill="{fill}"{o}{l} text-anchor="{anchor}">{s}</text>'


# ------------------------------------------------------------------ 1. key moment
def mockup():
    W, H = 390, 760
    p = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-labelledby="t d">',
         '<title id="t">Kiln: which gap? An overflow in Kiln mode</title>',
         '<desc id="d">Phone mockup. After 6 x 7 = 42 the rack holds eleven tiles against ten sockets. The player has switched the overflow to the kiln and lifted the 4. The 2 and the 6 are outlined as the tiles that would complete a firing: 2 and 4 make the Neighbours tile 2-4, which adds the missing 3; 4 and 6 make 4-6, which adds the missing 5.</desc>',
         DEFS,
         f'<rect width="{W}" height="{H}" fill="{SURROUND}"/>',
         f'<rect x="8" y="8" width="374" height="{H - 16}" rx="28" fill="{FELT}"/>']
    # HUD: round carries primary emphasis
    p += [text(40, 42, "ROUND", 10, INK, .55, ls=1.5), text(170, 42, "SCORE", 10, INK, .55, ls=1.5), text(280, 42, "STREAK", 10, INK, .55, ls=1.5),
          text(40, 74, "14", 30, INK, 1, SERIF, weight="500"), text(170, 72, "11", 22, INK, .72, SERIF), text(280, 72, "3", 22, INK, .72, SERIF)]
    for i in range(10):
        p.append(f'<rect x="{40 + i * 13}" y="86" width="8" height="8" rx="2" fill="{INK}" fill-opacity=".72"/>')
    p.append(f'<rect x="{40 + 10 * 13 + 0.75}" y="86.75" width="6.5" height="6.5" rx="2" fill="none" stroke="{VERM_L}" stroke-width="1.5"/>')
    p.append(text(192, 94, "11 / 10", 11, INK, .55))
    # Equation board with the submitted answer (feedback context preserved)
    p.append(f'<rect x="24" y="110" width="342" height="104" rx="14" fill="{PANEL}"/>')
    p.append(text(44, 172, "6 × 7", 40, INK, 1, SERIF, weight="500"))
    p.append(tile(236, 126, "4", w=44, h=55, ring=JADE))
    p.append(tile(288, 126, "2", w=44, h=55, ring=JADE))
    p.append(text(236, 202, "CORRECT · +3 TILES", 10, JADE, 1, ls=1.2, weight="700"))
    # Overflow prompt plate: discard / kiln segmented toggle
    p.append(f'<rect x="24" y="226" width="342" height="122" rx="14" fill="{PANEL}" stroke="{GOLD_D}" stroke-width="1"/>')
    p.append(text(40, 252, "OVER BY ONE", 10, INK, .72, ls=2, weight="700"))
    p.append(f'<rect x="196" y="236" width="76" height="26" rx="6" fill="none" stroke="{INK}" stroke-opacity=".4"/>')
    p.append(text(234, 253, "DISCARD", 10, INK, .55, anchor="middle", ls=1.2, weight="700"))
    p.append(f'<rect x="276" y="236" width="76" height="26" rx="6" fill="{GOLD}" fill-opacity=".14" stroke="{GOLD}" stroke-width="1.5"/>')
    p.append(text(314, 253, "KILN · K", 10, GOLD_L, 1, anchor="middle", ls=1.2, weight="700"))
    p.append(text(40, 286, "Fire the 4 with a digit that differs by 2:", 13, INK))
    p.append(tile(40, 298, "2–4", w=30, h=38, face=True))
    p.append(text(78, 315, "with the 2", 11, INK, .72))
    p.append(text(78, 330, "adds the 3", 11, GOLD_L, 1, weight="700"))
    p.append(tile(196, 298, "4–6", w=30, h=38, face=True))
    p.append(text(234, 315, "with the 6", 11, INK, .72))
    p.append(text(234, 330, "adds the 5", 11, GOLD_L, 1, weight="700"))
    # Rail: the newest arrival perched above the rack
    p.append(f'<line x1="24" y1="362" x2="366" y2="362" stroke="{GOLD}" stroke-width="1"/>')
    p.append(tile(309, 370, "8", ring=GOLD, ringw=1))
    p.append(text(299, 404, "rail", 10, INK, .4, anchor="end"))
    # Rack: Endless 5 x 2, kiln idle
    p.append(f'<rect x="29" y="448" width="332" height="162" rx="12" fill="{PANEL}"/>')
    hand = [["0", "1", "2", "4", "6"], ["7", "7", "9", "9", "9"]]
    for r, row in enumerate(hand):
        for c, d in enumerate(row):
            x, y = 41 + c * 64, 460 + r * 74
            p.append(tile(x, y, d, lift=10 if (r, c) == (0, 3) else 0,
                          ring=GOLD if (r, c) == (0, 3) else None,
                          dashed=(r, c) in [(0, 2), (0, 4)]))
    # Hint and caption
    p.append(text(195, 640, "Esc or DISCARD returns to discarding.", 11, INK, .55, anchor="middle"))
    p.append(f'<line x1="40" y1="660" x2="350" y2="660" stroke="{INK}" stroke-opacity=".12"/>')
    p.append(text(40, 684, "Either firing sheds the one tile overflow asks for.", 11, INK, .72))
    p.append(text(40, 702, "The pair spends two submissions in the kiln, holding", 11, INK, .72))
    p.append(text(40, 720, "one socket; then the new tile fires in place.", 11, INK, .72))
    p.append(text(40, 738, "Or fire the spare 7 and 9 into 7–9: no gain, no dip.", 11, INK, .55))
    p.append("</svg>")
    return "\n".join(p)


# ------------------------------------------------------------------ 2. mechanic
def mechanic():
    W, H = 800, 412
    p = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-labelledby="t2 d2">',
         '<title id="t2">The kiln: one recipe, three beats</title>',
         '<desc id="d2">Beat 1: in overflow, two digit tiles that differ by 2 are marked, here 4 and 6. Beat 2: both leave the hand and the kiln holds one socket for two submissions; it counts against the ten-tile capacity and cannot be played. Beat 3: the Neighbours tile 4-6 fires in place, new. Below, all eight recipes: 0 and 2 make 0-2, through 7 and 9 make 7-9.</desc>',
         DEFS,
         f'<rect width="{W}" height="{H}" fill="{SURROUND}"/>',
         f'<rect x="8" y="8" width="{W - 16}" height="{H - 16}" rx="18" fill="{FELT}"/>']
    heads = [("1 · FIRE", "In overflow: K, then two digit"), ("2 · IN THE KILN", "Both leave the hand. The kiln holds"), ("3 · OUT", "The Neighbours tile fires in place")]
    subs = ["tiles that differ by 2. Sheds", "one socket for 2 submissions; it counts", "on the 2nd submission: new, like a reward."]
    subs2 = ["the one tile overflow asks for.", "against the 10 and cannot be played.", ""]
    for i, (h, s) in enumerate(heads):
        x0 = 32 + i * 256
        p.append(f'<rect x="{x0}" y="28" width="232" height="226" rx="14" fill="{PANEL}"/>')
        p.append(text(x0 + 16, 54, h, 11, GOLD_L, 1, ls=2, weight="700"))
        p.append(text(x0 + 16, 214, s, 11, INK, .72))
        p.append(text(x0 + 16, 230, subs[i], 11, INK, .72))
        if subs2[i]:
            p.append(text(x0 + 16, 246, subs2[i], 11, INK, .72))
    # beat 1: 4 and 6 lifted with gold, + sign
    p.append(tile(68, 96, "4", lift=8, ring=GOLD))
    p.append(text(148, 136, "+", 26, INK, .72, SERIF, anchor="middle"))
    p.append(tile(172, 96, "6", lift=8, ring=GOLD))
    p.append(f'<path d="M 270 130 L 288 130 M 282 124 L 288 130 L 282 136" stroke="{INK}" stroke-opacity=".55" stroke-width="1.5" fill="none"/>')
    # beat 2: sealed kiln socket with gold inlay, two submission pips
    x, y = 356, 92
    p.append(f'<rect x="{x - 6}" y="{y - 6}" width="{64}" height="{76}" rx="10" fill="{SOCKET}"/>')
    p.append(f'<rect x="{x}" y="{y}" width="52" height="64" rx="6" fill="{RAISED}" stroke="{FELT}" stroke-width="1"/>')
    p.append(f'<rect x="{x + 5}" y="{y + 5}" width="42" height="54" rx="4" fill="none" stroke="{GOLD}" stroke-width="1"/>')
    p.append(text(x + 26, y + 38, "4–6", 13, GOLD_L, .9, SERIF, anchor="middle"))
    for k in range(2):
        p.append(f'<circle cx="{x + 82 + k * 14}" cy="{y + 20}" r="4.5" fill="none" stroke="{GOLD}" stroke-width="1.5"/>')
    p.append(text(x + 75, y + 46, "2 submissions", 11, INK, .55))
    p.append(f'<path d="M 526 130 L 544 130 M 538 124 L 544 130 L 538 136" stroke="{INK}" stroke-opacity=".55" stroke-width="1.5" fill="none"/>')
    # beat 3: the face, new (gold outline)
    p.append(tile(642, 96, "4–6", face=True, ring=GOLD))
    p.append(text(668, 186, "holds 4, 5, 6", 11, INK, .55, anchor="middle"))
    # recipe strip
    p.append(text(32, 290, "EVERY RECIPE: TWO DIGITS THAT DIFFER BY 2 BECOME THE RUN OF THREE · RACK POSITION PLAYS NO PART", 10, INK, .72, ls=1.5, weight="700"))
    for c in range(1, 9):
        x0 = 32 + ((c - 1) % 4) * 186
        y0 = 304 + ((c - 1) // 4) * 50
        p.append(tile(x0, y0, str(c - 1), w=30, h=38))
        p.append(tile(x0 + 34, y0, str(c + 1), w=30, h=38))
        p.append(text(x0 + 82, y0 + 23, "→", 14, INK, .55, anchor="middle"))
        p.append(tile(x0 + 98, y0, f"{c - 1}–{c + 1}", w=30, h=38, face=True))
    p.append("</svg>")
    return "\n".join(p)


# ------------------------------------------------------------------ 3. economy chart
def chart():
    rows = [json.loads(l) for l in open(os.path.join(WORK, "chart.jsonl"))]
    W, H = 800, 480
    x0, x1 = 300, 740  # plot from 0 to 30 rounds
    sx = lambda v: x0 + (x1 - x0) * v / 30
    p = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-labelledby="t3 d3">',
         '<title id="t3">What each recipe buys: mean rounds survived on the Endless rack</title>',
         '<desc id="d3">Horizontal bars, 3,000 simulated runs each. ' + "; ".join(f"{r['label']}: {r['mean']}" for r in rows) + '. Reference lines at 20.0 (Endless today) and 24.6 (Endless at capacity 11, which the repo balance test already fails).</desc>',
         f'<rect width="{W}" height="{H}" fill="{PANEL}"/>',
         text(32, 40, "What each recipe buys", 18, INK, 1, SERIF, weight="500"),
         text(32, 62, "Mean rounds survived on the Endless rack (capacity 10, kind bias 0.2). 3,000 simulated runs per bar;", 11, INK, .72),
         text(32, 78, "smart bot, perfect arithmetic. Bots are not players: compare bars, not absolute values.", 11, INK, .72)]
    top, step = 128, 36
    # reference lines + zone labels
    for v, lab, anchor, dx in [(20.0, "Endless today 20.0", "end", -6), (24.6, "capacity 11 · 24.6", "start", 6)]:
        p.append(f'<line x1="{sx(v):.1f}" y1="{top - 22}" x2="{sx(v):.1f}" y2="{top + step * len(rows) - 10}" stroke="{INK}" stroke-opacity=".4" stroke-dasharray="3 3"/>')
        p.append(text(round(sx(v) + dx, 1), top - 26, lab, 10, INK, .55, anchor=anchor))
    for i, r in enumerate(rows):
        y = top + i * step
        proposed = "proposed" in r["label"]
        lab = r["label"].replace(" (proposed)", "").replace("->", "→").replace("3-5", "3–5")
        p.append(text(x0 - 12, y + 4, lab, 12, INK, 1 if proposed else .72, anchor="end", weight="700" if proposed else "400"))
        w = sx(r["mean"]) - x0
        color = GOLD if proposed else "#606d64"
        p.append(f'<path d="M {x0} {y - 7} H {x0 + w - 4:.1f} Q {x0 + w:.1f} {y - 7} {x0 + w:.1f} {y - 3} V {y + 3} Q {x0 + w:.1f} {y + 7} {x0 + w - 4:.1f} {y + 7} H {x0} Z" fill="{color}"/>')
        p.append(text(round(x0 + w + 8, 1), y + 4, f"{r['mean']:.1f}" + ("  proposed" if proposed else ""), 11, INK, 1 if proposed else .72, weight="700" if proposed else "400"))
    yb = top + step * len(rows) - 6
    p.append(f'<line x1="{x0}" y1="{top - 14}" x2="{x0}" y2="{yb}" stroke="{INK}" stroke-opacity=".4"/>')
    for v in [0, 10, 20, 30]:
        p.append(text(round(sx(v), 1), yb + 18, str(v), 10, INK, .55, anchor="middle"))
    p.append(text(x1, yb + 36, "rounds survived (mean; 95% CI ±0.3–0.6)", 10, INK, .55, anchor="end"))
    p.append(text(32, yb + 36, "Capacity 11 already fails the repo's cliff margin (balance.ts).", 10, INK, .55))
    p.append("</svg>")
    return "\n".join(p)


for name, fn in [("kiln-which-gap.svg", mockup), ("kiln-mechanic.svg", mechanic), ("kiln-economy.svg", chart)]:
    with open(os.path.join(DRAFT, name), "w") as f:
        f.write(fn())
    print("wrote", name)

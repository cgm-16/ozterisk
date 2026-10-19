#!/usr/bin/env python3
"""Writes the draft's SVGs (Tile House palette). Run: python3 -I make_svgs.py <draft dir>"""
import itertools, math, random, sys

OUT = sys.argv[1]
SERIF = "'EB Garamond', Georgia, 'Times New Roman', serif"
UI = "'Zen Kaku Gothic New', 'Helvetica Neue', Arial, sans-serif"
INK = "#f7f0e2"
DEFS = """<defs>
  <linearGradient id="face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdf8ec"/><stop offset="1" stop-color="#e6d7ba"/></linearGradient>
  <marker id="ah" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8 z" fill="#c9a54a"/></marker>
</defs>"""


def text(x, y, s, size=12, fill=INK, op=1.0, family=UI, anchor="start", weight="normal", spacing=0):
    ls = f' letter-spacing="{spacing}"' if spacing else ""
    return (f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" fill="{fill}" '
            f'fill-opacity="{op}" text-anchor="{anchor}" font-weight="{weight}"{ls}>{s}</text>')


def tile(x, y, w, h, d, state="raised", num=None):
    """state: raised | flat | reward | jade | marked | focus"""
    num = num or round(h * 0.52)
    e = 5 if h > 45 else 3
    out = []
    if state == "marked":
        out.append(f'<g transform="rotate(-6 {x + w / 2} {y + h / 2}) translate(0 -5)">')
    if state == "flat":
        out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="#081a14" stroke="{INK}" stroke-opacity="0.10"/>')
        out.append(f'<rect x="{x + 3}" y="{y + 3 + e}" width="{w - 6}" height="{h - 6 - e}" rx="5" fill="url(#face)"/>')
        ty = y + 3 + e + (h - 6 - e) / 2 + num * 0.34
    else:
        out.append(f'<rect x="{x}" y="{y + e}" width="{w}" height="{h - e}" rx="6" fill="#b3a184"/>')
        out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h - e}" rx="6" fill="url(#face)"/>')
        ty = y + (h - e) / 2 + num * 0.34
    out.append(text(x + w / 2, round(ty, 1), d, num, "#16352b", 1, SERIF, "middle", "500"))
    if state == "reward":
        out.append(f'<rect x="{x - 1}" y="{y - 1}" width="{w + 2}" height="{h - e + 2}" rx="7" fill="none" stroke="#c9a54a" stroke-width="1.5"/>')
    if state == "jade":
        out.append(f'<rect x="{x - 2}" y="{y - 2}" width="{w + 4}" height="{h - e + 4}" rx="8" fill="none" stroke="#4f9d7c" stroke-width="2.5"/>')
    if state == "focus":
        out.append(f'<rect x="{x + 1.5}" y="{y + 1.5}" width="{w - 3}" height="{h - e - 3}" rx="5" fill="none" stroke="#e8cd85" stroke-width="2.5"/>')
        out.append(f'<rect x="{x + 3.5}" y="{y + 3.5}" width="{w - 7}" height="{h - e - 7}" rx="4" fill="none" stroke="#16352b" stroke-width="1"/>')
    if state == "marked":
        out.append(f'<rect x="{x - 2}" y="{y - 2}" width="{w + 4}" height="{h - e + 4}" rx="8" fill="none" stroke="#b5432f" stroke-width="2"/>')
        out.append("</g>")
    return "\n".join(out)


def socket(x, y, w, h, lifted=False, ghost=False):
    s = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="#081a14" stroke="{INK}" stroke-opacity="0.10"/>'
    if lifted:
        s += f'\n<rect x="{x + 3}" y="{y + 3}" width="{w - 6}" height="{h - 6}" rx="4" fill="none" stroke="#c9a54a" stroke-opacity="0.72" stroke-dasharray="4 3"/>'
    if ghost:
        s += f'\n<rect x="{x + 3}" y="{y + 3}" width="{w - 6}" height="{h - 6}" rx="4" fill="none" stroke="{INK}" stroke-opacity="0.35" stroke-dasharray="2 3"/>'
    return s


def svg(w, h, title, desc, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img">\n'
            f"<title>{title}</title>\n<desc>{desc}</desc>\n{DEFS}\n{body}\n</svg>\n")


# ---------------------------------------------------------------- 1. key moment (phone)
def key_moment():
    b = [f'<rect width="390" height="800" fill="#071711"/>',
         '<rect x="8" y="8" width="374" height="624" rx="30" fill="#14342a"/>']
    # HUD: round leads
    b += [text(36, 54, "ROUND", 10, INK, .55, spacing=1.5), text(36, 88, "12", 34, INK, 1, SERIF, weight="500"),
          text(150, 54, "SCORE", 10, INK, .55, spacing=1.5), text(150, 86, "8", 26, INK, .72, SERIF),
          text(250, 54, "STREAK", 10, INK, .55, spacing=1.5), text(250, 86, "3", 26, INK, .72, SERIF)]
    # Equation and slots: first slot holds the 5, second waits
    b += [text(36, 196, "7 &#215; 8", 48, INK, 1, SERIF, weight="500"), tile(206, 136, 64, 80, "5", num=42),
          '<rect x="282" y="136" width="64" height="75" rx="6" fill="none" stroke="#c9a54a" stroke-dasharray="5 4"/>']
    # Well: 5 x 3, rows bottom-first
    cols = [[2, 8, 4], [1, 9, 3], [7, 5, 3], [4, 6], [0, 2]]
    lifted, touching, focus = (2, 1), {(1, 1), (3, 1), (2, 2), (2, 0)}, (3, 1)
    b.append('<rect x="55" y="262" width="280" height="208" rx="12" fill="#0b211b"/>')
    for c in range(5):
        for r in range(3):
            x, y = 63 + c * 54, 270 + (2 - r) * 66
            if r >= len(cols[c]):
                b.append(socket(x, y, 48, 60))
            elif (c, r) == lifted:
                b.append(socket(x, y, 48, 60, lifted=True))
            else:
                st = "focus" if (c, r) == focus else ("raised" if (c, r) in touching else "flat")
                b.append(tile(x, y, 48, 60, str(cols[c][r]), st, 32))
    # Actions: Submit waits (flat), Clear is live
    b += ['<rect x="136" y="500" width="118" height="44" rx="6" fill="none" stroke="#f7f0e2" stroke-opacity="0.22"/>',
          text(195, 527, "SUBMIT", 12, INK, .38, anchor="middle", spacing=2.4, weight="bold"),
          '<rect x="139" y="556" width="112" height="44" rx="6" fill="#1b4436" stroke="#f7f0e2" stroke-opacity="0.40"/>',
          text(195, 583, "CLEAR", 12, INK, .78, anchor="middle", spacing=2.4, weight="bold"),
          ]
    # Annotation strip (outside the phone)
    b += [text(20, 670, "MATERIALS", 10, "#c9a54a", 1, spacing=1.5),
          tile(20, 682, 24, 30, "6", "raised", 16), text(52, 702, "touching: raised", 11, INK, .72),
          tile(150, 682, 24, 30, "8", "flat", 16), text(182, 702, "not touching: flat", 11, INK, .72),
          socket(290, 682, 24, 30, lifted=True), text(320, 702, "on loan", 11, INK, .72),
          text(20, 736, "SCREEN READER HEARS", 10, "#c9a54a", 1, spacing=1.5),
          text(20, 754, "&#8220;5 lifted. Touching: 9 left, 6 right, 3 above, 7 below.&#8221;", 12, INK, .80),
          text(20, 778, "KEYBOARD", 10, "#c9a54a", 1, spacing=1.5),
          text(92, 778, "&#8594; moves focus to the 6 &#183; Space takes it &#183; Enter submits", 11, INK, .80)]
    return svg(390, 800, "Well mode: answering 7 times 8 from touching tiles",
               "Phone mockup. The equation 7 x 8 has its first answer slot filled with a 5 and the second slot empty. "
               "Below, a 5 by 3 well of tiles: the 5's cell is an empty socket with a dashed gold outline. Its four neighbours, "
               "9 left, 6 right, 3 above and 7 below, stay raised; every other tile lies flat. The 6 to the right carries the "
               "two-tone focus bezel. Submit is flat (disabled), Clear is live.", "\n".join(b))


# ---------------------------------------------------------------- 2. the resolve, in four panels
def resolve():
    W, H = 30, 38
    b = ['<rect width="800" height="330" fill="#071711"/>']

    def panel(px, title1, title2, cols, states, extra=""):
        out = [f'<rect x="{px}" y="10" width="186" height="310" rx="12" fill="#14342a"/>',
               f'<rect x="{px + 6}" y="76" width="174" height="130" rx="8" fill="#0b211b"/>']
        for c in range(5):
            for r in range(3):
                x, y = px + 10 + c * 34, 80 + (2 - r) * 42
                st = states.get((c, r))
                if st == "ghost":
                    out.append(socket(x, y, W, H, ghost=True))
                elif r >= len(cols[c]):
                    out.append(socket(x, y, W, H))
                else:
                    out.append(tile(x, y, W, H, str(cols[c][r]), st or "raised", 20))
        out += [text(px + 12, 238, title1, 12, INK, .95, weight="bold"), text(px + 12, 256, title2, 11, INK, .72), extra]
        return "\n".join(out)

    def cx(px, c): return px + 10 + c * 34 + 15
    def cy(r): return 80 + (2 - r) * 42

    p1 = panel(10, "1 &#183; 7 &#215; 8 = 56", "a touching pair: 5 then 6",
               [[2, 8, 4], [1, 9, 3], [7, 5, 3], [4, 6], [0, 2]], {(2, 1): "jade", (3, 1): "jade"})
    p2 = panel(208, "2 &#183; Spent tiles leave", "the 3 above the 5 falls",
               [[2, 8, 4], [1, 9, 3], [7, 3], [4], [0, 2]], {(2, 2): "ghost"},
               f'<line x1="{cx(208, 2)}" y1="{cy(2) + 6}" x2="{cx(208, 2)}" y2="{cy(1) + 4}" stroke="#c9a54a" stroke-width="2" marker-end="url(#ah)"/>')
    badge = lambda c, r, n: (f'<circle cx="{406 + 10 + c * 34 + 28}" cy="{80 + (2 - r) * 42 + 2}" r="7" fill="#c9a54a"/>'
                             + text(406 + 10 + c * 34 + 28, 80 + (2 - r) * 42 + 6, str(n), 10, "#0b211b", 1, anchor="middle", weight="bold"))
    arrows3 = "".join(f'<line x1="{cx(406, c)}" y1="34" x2="{cx(406, c)}" y2="70" stroke="#c9a54a" stroke-width="1.5" marker-end="url(#ah)"/>' for c in (2, 3))
    arrows3 += badge(3, 1, 1) + badge(2, 2, 2) + badge(3, 2, 3)
    p3 = panel(406, "3 &#183; N + 1 = 3 new tiles", "each lands on the lowest stack",
               [[2, 8, 4], [1, 9, 3], [7, 3, 8], [4, 2, 5], [0, 2]], {(3, 1): "reward", (2, 2): "reward", (3, 2): "reward"},
               arrows3 + text(406 + 12, 280, "leftmost wins a tie", 11, INK, .55))
    # Panel 4: later, full well; extra tile on the rail; the discard picks the stack
    full = [[2, 8, 4], [1, 9, 3], [7, 3, 8], [4, 2, 5], [0, 2, 6]]
    rail = tile(604 + 140, 30, W, H, "7", "reward", 20) + text(604 + 12, 52, "RAIL", 10, "#c9a54a", 1, spacing=1.5)
    drop = (f'<path d="M {604 + 155} {64} C {604 + 160} {70}, {cx(604, 0) + 30} {40}, {cx(604, 0)} {72}" fill="none" '
            f'stroke="#c9a54a" stroke-width="1.5" stroke-dasharray="3 3" marker-end="url(#ah)"/>')
    p4 = panel(604, "4 &#183; Later, at 15 / 15", "mark the 8: its stack falls,",
               full, {(0, 1): "marked"}, rail + drop + text(604 + 12, 274, "and the 7 lands on that stack", 11, INK, .72))
    b += [p1, p2, p3, p4]
    for x in (198, 396, 594):
        b.append(f'<line x1="{x}" y1="141" x2="{x + 8}" y2="141" stroke="#c9a54a" stroke-width="2" marker-end="url(#ah)"/>')
    return svg(800, 330, "Well mode: what happens when an answer resolves",
               "Four panels. 1: 7 x 8 = 56 is answered with a touching 5 and 6, outlined in jade. 2: both leave; the 3 above the 5 "
               "falls one row. 3: three new tiles, outlined in gold, drop into the lowest stacks in order, leftmost on a tie. "
               "4: later, with all 15 cells full, the extra new tile 7 waits on the rail; the player marks an 8 for discard, "
               "its stack falls, and the 7 lands on top of that stack.", "\n".join(b))


# ---------------------------------------------------------------- 3. the digit-pair graph
def digit_graph():
    facts = {}
    for a in range(1, 10):
        for c in range(a, 10):
            p = a * c
            if p >= 10:
                k = tuple(sorted((p // 10, p % 10)))
                facts[k] = facts.get(k, 0) + 1
    rng = random.Random(8)
    best, best_cost = None, 1e9
    for _ in range(40000):  # circle order with short heavy edges (layout only)
        order = list(range(10)); rng.shuffle(order)
        pos = {d: i for i, d in enumerate(order)}
        cost = sum(w * min(abs(pos[a] - pos[c]), 10 - abs(pos[a] - pos[c])) for (a, c), w in facts.items())
        if cost < best_cost: best, best_cost = order, cost
    CX, CY, R = 245, 236, 122
    xy = {d: (CX + R * math.sin(2 * math.pi * i / 10), CY - R * math.cos(2 * math.pi * i / 10)) for i, d in enumerate(best)}
    b = ['<rect width="800" height="440" fill="#071711"/>',
         '<rect x="10" y="10" width="470" height="420" rx="12" fill="#14342a"/>',
         '<rect x="490" y="10" width="300" height="420" rx="12" fill="#14342a"/>',
         text(26, 38, "Which digits want to touch", 14, INK, 1, weight="bold"),
         text(26, 56, "each line: a digit pair some 2-digit product needs", 11, INK, .72),
         text(26, 72, "thicker = more facts (3, 2 or 1 of the 32)", 11, INK, .72)]
    style = {3: ("#e8cd85", 5, 1), 2: (INK, 3, .75), 1: (INK, 1.4, .45)}
    for (a, c), w in sorted(facts.items(), key=lambda kv: kv[1]):
        col, sw, op = style[w]
        (x1, y1), (x2, y2) = xy[a], xy[c]
        b.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{col}" stroke-width="{sw}" stroke-opacity="{op}"/>')
    deg = {d: sum(1 for k in facts if d in k) for d in range(10)}
    for d, (x, y) in xy.items():
        b.append(tile(round(x - 15, 1), round(y - 19, 1), 30, 38, str(d), "raised", 20))
        lx, ly = x + (x - CX) * 0.24, y + (y - CY) * 0.24 + 4
        b.append(text(round(lx, 1), round(ly, 1), f"{deg[d]}", 11, "#c9a54a", 1, anchor="middle", weight="bold"))
    b += [text(26, 406, "gold number = partners. 2 and 4: seven each.", 11, INK, .72),
          text(26, 421, "7 only pairs with 2 (27, 72); 9 only with 4 (49).", 11, INK, .72)]
    # The opening wall
    wall = [[1, 8, 4, 5, 3], [4, 2, 0, 1, 2], [9, 7, 3, 6, 5]]  # bottom row first
    b += [text(506, 38, "The opening wall", 14, INK, 1, weight="bold"),
          text(506, 56, "a fixed layout, the same every run", 11, INK, .72),
          '<rect x="550" y="80" width="178" height="134" rx="8" fill="#0b211b"/>']
    for r in range(3):
        for c in range(5):
            b.append(tile(556 + c * 34, 86 + (2 - r) * 42, 30, 38, str(wall[r][c]), "raised", 20))
    b += [text(506, 246, "Spells 44 of the 45 facts with", 12, INK, .9),
          text(506, 264, "touching pairs. Only 8 &#215; 8 = 64 is", 12, INK, .9),
          text(506, 282, "missing: no 4 touches a 6.", 12, INK, .9),
          text(506, 314, "Random 15 tiles spell 0.45 on", 11, INK, .62),
          text(506, 330, "average; free tiles of the same", 11, INK, .62),
          text(506, 346, "count, 0.67. Touching costs a third.", 11, INK, .62),
          text(506, 384, "Found by hill-climb (300 restarts):", 10, INK, .45),
          text(506, 398, "a best-found layout, not a proven optimum.", 10, INK, .45)]
    return svg(800, 440, "The multiplication digit-pair graph and the opening wall",
               "Left: the ten digits as tiles on a circle, joined by 21 lines, one per digit pair that a two-digit product of "
               "1 to 9 needs; heavier lines carry more facts. Digits 2 and 4 have seven partners each, 1 has six, 7 pairs only "
               "with 2 and 9 only with 4. Right: the fixed 5 by 3 opening wall, bottom row 1 8 4 5 3, middle 4 2 0 1 2, top "
               "9 7 3 6 5, which spells 44 of 45 facts with touching pairs; only 8 x 8 = 64 is missing.", "\n".join(b))


for name, fn in [("well-touch.svg", key_moment), ("well-resolve.svg", resolve), ("digit-graph.svg", digit_graph)]:
    with open(f"{OUT}/{name}", "w") as f:
        f.write(fn())
print("wrote 3 svgs")

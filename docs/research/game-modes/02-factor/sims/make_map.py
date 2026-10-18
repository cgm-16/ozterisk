# Generates draft/factor-map.svg from the 45-fact table, and checks the counts the README cites.
import sys
from collections import defaultdict
out = sys.argv[1]
pairs = [(a, b) for a in range(1, 10) for b in range(a, 10)]
fact = defaultdict(list)
for a, b in pairs: fact[a * b].append((a, b))
rich = {p for p, l in fact.items() if len(l) == 2}
pair_only = {p for p, l in fact.items() if len(l) == 1 and l[0][0] == l[0][1]}
rich_cells = sum(1 for a, b in pairs if a * b in rich)
one_each_choice = sum(1 for a, b in pairs if a * b in rich and all(x != y for x, y in fact[a * b]))
assert len(pairs) == 45 and len(fact) == 36 and len(rich) == 9 and rich_cells == 18, (len(fact), len(rich), rich_cells)
assert sorted(pair_only) == [1, 25, 49, 64, 81], pair_only
assert one_each_choice == 10, one_each_choice
# replaceability: of each digit's 9 facts, how many have another factor pair
repl = {d: sum(1 for a, b in pairs if d in (a, b) and len(fact[a * b]) == 2) for d in range(1, 10)}
assert repl == {1: 4, 2: 6, 3: 5, 4: 6, 5: 0, 6: 5, 7: 0, 8: 3, 9: 3}, repl
print("replaceable facts per digit:", repl)
print("checks ok: 45 facts, 36 products, 9 rich (18 cells), pair-only", sorted(pair_only), "one-of-each choice draws", one_each_choice)

SERIF = "'EB Garamond', Georgia, 'Times New Roman', serif"
UI = "'Zen Kaku Gothic New', 'Helvetica Neue', Arial, sans-serif"
INK, GOLD, GOLD_D, CLAY = "#f7f0e2", "#c9a54a", "#9a7f36", "#16352b"
X0, Y0, CELL, PITCH = 56, 100, 44, 50
W, H = 800, 640
s = []
s.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-labelledby="t d">')
s.append('<title id="t">Where two answers live: the 45 facts read backwards</title>')
s.append('<desc id="d">Upper triangle of the 9 by 9 times table. Eighteen cells whose product has a second factor pair carry a gold inlay; five cells whose product needs two copies of one digit are drawn as stacked pairs; digits 5 and 7 are marked as irreplaceable.</desc>')
s.append('<defs><linearGradient id="face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdf8ec"/><stop offset="1" stop-color="#e6d7ba"/></linearGradient></defs>')
s.append(f'<rect width="{W}" height="{H}" fill="#071711"/>')
s.append(f'<rect x="12" y="12" width="{W-24}" height="{H-24}" rx="14" fill="#0b211b" stroke="#1b4436"/>')
s.append(f'<text x="{X0}" y="46" font-family="{UI}" font-size="18" font-weight="700" fill="{INK}">Where two answers live</text>')
s.append(f'<text x="{X0}" y="68" font-family="{UI}" font-size="13" fill="{INK}" fill-opacity="0.72">The 45 facts, read backwards. Each cell shows the product a Factor board would print.</text>')

def tile(x, y, label, inlay=False, stacked=False, size=CELL):
    out = []
    if stacked:  # a second tile behind: this product needs a pair of one digit
        out.append(f'<rect x="{x+5}" y="{y-5}" width="{size}" height="{size}" rx="5" fill="#b3a184"/>')
        out.append(f'<rect x="{x+5}" y="{y-5}" width="{size}" height="{size-3}" rx="5" fill="url(#face)" stroke="#b3a184" stroke-width="0.5"/>')
    out.append(f'<rect x="{x}" y="{y}" width="{size}" height="{size}" rx="5" fill="#b3a184"/>')
    out.append(f'<rect x="{x}" y="{y}" width="{size}" height="{size-3}" rx="5" fill="url(#face)"/>')
    if inlay:
        out.append(f'<rect x="{x+3.5}" y="{y+3.5}" width="{size-7}" height="{size-10}" rx="3" fill="none" stroke="{GOLD_D}" stroke-width="1"/>')
    out.append(f'<text x="{x+size/2}" y="{y+size/2+5}" text-anchor="middle" font-family="{SERIF}" font-size="19" font-weight="600" fill="{CLAY}">{label}</text>')
    return "".join(out)

for i in range(1, 10):
    hot = i in (5, 7)
    col = GOLD if hot else INK
    op = "1" if hot else "0.55"
    s.append(f'<text x="{X0 + (i-1)*PITCH + CELL/2}" y="{Y0-10}" text-anchor="middle" font-family="{SERIF}" font-size="17" fill="{col}" fill-opacity="{op}">{i}</text>')
    s.append(f'<text x="{X0-14}" y="{Y0 + (i-1)*PITCH + CELL/2 + 6}" text-anchor="middle" font-family="{SERIF}" font-size="17" fill="{col}" fill-opacity="{op}">{i}</text>')
for a, b in pairs:
    p = a * b
    s.append(tile(X0 + (b-1)*PITCH, Y0 + (a-1)*PITCH, p, inlay=p in rich, stacked=p in pair_only))
# the mirrored half
s.append(f'<text x="{X0+8}" y="{Y0 + 6*PITCH + 10}" font-family="{UI}" font-size="12" fill="{INK}" fill-opacity="0.4"><tspan x="{X0+8}">Lower half mirrors the upper:</tspan><tspan x="{X0+8}" dy="16">3 × 7 and 7 × 3 are one fact (§1.2),</tspan><tspan x="{X0+8}" dy="16">so the two slots take either order.</tspan></text>')

# right panel: legend + the nine two-answer products
LX = 530
s.append(tile(LX, 100, 24, inlay=True, size=34).replace('font-size="19"', 'font-size="15"'))
s.append(f'<text x="{LX+46}" y="114" font-family="{UI}" font-size="13" fill="{INK}">Two factor pairs</text>')
s.append(f'<text x="{LX+46}" y="131" font-family="{UI}" font-size="12" fill="{INK}" fill-opacity="0.72">18 of 45 cells, 40% of draws</text>')
s.append(tile(LX, 160, 49, stacked=True, size=34).replace('font-size="19"', 'font-size="15"'))
s.append(f'<text x="{LX+46}" y="174" font-family="{UI}" font-size="13" fill="{INK}">Needs a pair</text>')
s.append(f'<text x="{LX+46}" y="191" font-family="{UI}" font-size="12" fill="{INK}" fill-opacity="0.72">1, 25, 49, 64, 81</text>')
s.append(f'<text x="{LX+8}" y="236" font-family="{SERIF}" font-size="20" fill="{GOLD}">5 7</text>')
s.append(f'<text x="{LX+46}" y="229" font-family="{UI}" font-size="13" fill="{INK}">Irreplaceable</text>')
s.append(f'<text x="{LX+46}" y="246" font-family="{UI}" font-size="12" fill="{INK}" fill-opacity="0.72">no substitute pair exists</text>')
s.append(f'<line x1="{LX}" y1="270" x2="{W-36}" y2="270" stroke="{GOLD}" stroke-opacity="0.5"/>')
s.append(f'<text x="{LX}" y="294" font-family="{UI}" font-size="11" letter-spacing="1.2" fill="{GOLD}">TWO-ANSWER PRODUCTS</text>')
for k, p in enumerate(sorted(rich)):
    (a1, b1), (a2, b2) = fact[p]
    s.append(f'<text x="{LX}" y="{322 + k*22}" font-family="{SERIF}" font-size="17" fill="{INK}"><tspan font-weight="600">{p}</tspan><tspan fill-opacity="0.72"> = {a1} × {b1} = {a2} × {b2}</tspan></text>')
s.append(f'<text x="{X0}" y="{H-46}" font-family="{UI}" font-size="13" fill="{INK}" fill-opacity="0.72">A one-of-each 1–9 rack can choose on only 10 of 45 draws (products 6, 8, 12, 18, 24).</text>')
s.append(f'<text x="{X0}" y="{H-27}" font-family="{UI}" font-size="13" fill="{INK}" fill-opacity="0.72">In simulated play, a real choice comes up about once per run.</text>')
s.append('</svg>')
open(out, "w").write("\n".join(s))
print("wrote", out)

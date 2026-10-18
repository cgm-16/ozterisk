# Writes draft/market-economy.svg from chart.json (sim output). Small multiples, one y-scale each.
import json, math
D = json.load(open("chart.json"))
OUT = "../market-economy.svg"
INK, BG = "#f7f0e2", "#14342a"
UI = "'Zen Kaku Gothic New', 'Helvetica Neue', Arial, sans-serif"
series = [  # (label in chart.json, legend text, stroke, dash)
    ("Standing row k=3, kind 0", "Standing row: unchosen orders stay", "#1fa384", None),
    ("Fresh row k=3, kind 0", "Free row: unchosen orders vanish", "#e06048", None),
    ("Endless (k=1, kind 0.2)", "Endless: one order (shipped)", INK, "6 5"),
]
xs = [3 + 5 * i for i in range(12)]  # bin centres, submissions 1-5 ... 56-60
out = []
w = out.append
w(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500" role="img" aria-labelledby="ct cd">')
w('<title id="ct">Market economy: a standing row clogs, a free row does not</title>')
w('<desc id="cd">Two panels over submission number, k = 3 open orders, kind bias off, 4,000 bot runs each. Left: the share of open orders the hand can spell falls from 0.70 to about 0.22 in the standing row, but holds near 0.46 in the free row. Right: tiles gained per submission fall below zero by submission 10 in the standing row, like Endless, while the free row stays near +0.45, so its runs stop ending.</desc>')
w(f'<rect width="800" height="500" rx="14" fill="{BG}"/>')
w(f'<text x="28" y="40" font-family="{UI}" font-size="18" fill="{INK}">A standing row clogs; a free row never does</text>')
w(f'<text x="28" y="62" font-family="{UI}" font-size="12" fill="{INK}" fill-opacity="0.72">k = 3 open orders, kind bias off · Endless at its shipped kind 0.2 · 4,000 bot runs each · market-sim.ts chart</text>')
# legend
lx = 28
for _, text, col, dash in series:
    d = f' stroke-dasharray="{dash}"' if dash else ""
    op = ' stroke-opacity="0.55"' if col == INK else ""
    w(f'<line x1="{lx}" y1="88" x2="{lx+22}" y2="88" stroke="{col}" stroke-width="2"{d}{op}/>')
    w(f'<text x="{lx+30}" y="92" font-family="{UI}" font-size="12" fill="{INK}" fill-opacity="0.9">{text}</text>')
    lx += 30 + len(text) * 6.4 + 26

def panel(x0, title, key, ymin, ymax, ticks, zero_note=None):
    x1, y0, y1 = x0 + 300, 400, 140
    X = lambda s: x0 + (s - 0) / 60 * (x1 - x0)
    Y = lambda v: y0 - (v - ymin) / (ymax - ymin) * (y0 - y1)
    w(f'<text x="{x0}" y="124" font-family="{UI}" font-size="13" fill="{INK}">{title}</text>')
    for t in ticks:
        strong = (t == 0 and zero_note)
        w(f'<line x1="{x0}" y1="{Y(t):.1f}" x2="{x1}" y2="{Y(t):.1f}" stroke="{INK}" stroke-opacity="{0.5 if strong else 0.12}" stroke-width="1"/>')
        w(f'<text x="{x0-8}" y="{Y(t)+4:.1f}" text-anchor="end" font-family="{UI}" font-size="11" fill="{INK}" fill-opacity="0.72">{t:+.1f}</text>' if ymin < 0 else
          f'<text x="{x0-8}" y="{Y(t)+4:.1f}" text-anchor="end" font-family="{UI}" font-size="11" fill="{INK}" fill-opacity="0.72">{t:.1f}</text>')
    if zero_note:
        w(f'<text x="{x1}" y="{Y(0)-6:.1f}" text-anchor="end" font-family="{UI}" font-size="11" fill="{INK}" fill-opacity="0.72">{zero_note}</text>')
    for s in (1, 10, 20, 30, 40, 50, 60):
        w(f'<text x="{X(s):.1f}" y="{y0+18}" text-anchor="middle" font-family="{UI}" font-size="11" fill="{INK}" fill-opacity="0.72">{s}</text>')
    w(f'<text x="{(x0+x1)/2}" y="{y0+38}" text-anchor="middle" font-family="{UI}" font-size="11" fill="{INK}" fill-opacity="0.55">submission number (bins of 5)</text>')
    for name, _, col, dash in series:
        vals = D[name][key]
        pts = [(X(x), Y(v)) for x, v in zip(xs, vals) if v is not None and not (isinstance(v, float) and math.isnan(v))]
        d = f' stroke-dasharray="{dash}"' if dash else ""
        op = ' stroke-opacity="0.55"' if col == INK else ""
        w(f'<polyline fill="none" stroke="{col}" stroke-width="2" stroke-linejoin="round"{d}{op} points="{" ".join(f"{px:.1f},{py:.1f}" for px, py in pts)}"/>')
        if col != INK:
            for px, py in pts:
                w(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="4" fill="{col}" stroke="{BG}" stroke-width="2"/>')
    return X, Y

# chart.json stores NaN as null-incompatible; json.load maps NaN to float('nan')
Xa, Ya = panel(70, "Open orders the hand can spell (share)", "spell", 0, 0.8, [0, 0.2, 0.4, 0.6, 0.8])
Xb, Yb = panel(460, "Tiles gained per submission (drift)", "drift", -0.6, 0.9, [-0.5, 0, 0.5], "0 · above it, runs stop ending")
# direct labels at line ends (ink text; the mark beside carries identity)
def endlabel(X, Y, name, key, text, dy=0):
    vals = [v for v in D[name][key] if v is not None]
    i = len(vals) - 1
    w(f'<text x="{X(xs[i])+8:.1f}" y="{Y(vals[i])+4+dy:.1f}" font-family="{UI}" font-size="11" fill="{INK}" fill-opacity="0.9">{text}</text>')
endlabel(Xa, Ya, "Standing row k=3, kind 0", "spell", "standing", 0)
endlabel(Xb, Yb, "Standing row k=3, kind 0", "drift", "standing", 12)
endlabel(Xb, Yb, "Endless (k=1, kind 0.2)", "drift", "Endless", -6)
w(f'<text x="28" y="468" font-family="{UI}" font-size="11" fill="{INK}" fill-opacity="0.55">Each point averages the runs still alive; a line stops when fewer than 10% survive (the free row still has 65% alive at submission 60).</text>')
w(f'<text x="28" y="484" font-family="{UI}" font-size="11" fill="{INK}" fill-opacity="0.55">Bots, not players: compare the lines with each other, not with real play.</text>')
# free row and Endless labels placed above their lines, inside the plot
for X, Y, key, v in ((Xa, Ya, "spell", 0.46), (Xb, Yb, "drift", 0.47)):
    w(f'<text x="{X(50):.1f}" y="{Y(v)-12:.1f}" text-anchor="middle" font-family="{UI}" font-size="11" fill="{INK}" fill-opacity="0.9">free row</text>')
w(f'<text x="{Xa(40):.1f}" y="{Ya(0.47)-12:.1f}" text-anchor="middle" font-family="{UI}" font-size="11" fill="{INK}" fill-opacity="0.72">Endless</text>')
w('</svg>')
open(OUT, "w").write("\n".join(out))
print("wrote", OUT)

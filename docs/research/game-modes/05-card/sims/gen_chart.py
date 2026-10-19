# Generates draft/collector-curve.svg. Curve is analytic; markers are sim means (see work/out-*.txt).
import sys
out = sys.argv[1]
UI = "'Zen Kaku Gothic New', 'Helvetica Neue', Arial, sans-serif"
INK, SURF, GOLD = "#f7f0e2", "#0b211b", "#a98a39"
X0, X1, Y0, Y1, XMAX, YMAX = 72, 742, 392, 102, 50, 45
X = lambda k: X0 + (X1 - X0) * k / XMAX
Y = lambda v: Y0 - (Y0 - Y1) * v / YMAX
p = []
a = p.append
a('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 470" width="800" height="470" role="img" aria-labelledby="t d">')
a('<title id="t">Cells stamped against correct answers: with replacement versus a 45-fact deal</title>')
a('<desc id="d">Line chart. X axis: correct answers in a run, 0 to 50. Y axis: distinct facts stamped, 0 to 45. A gold curve shows the shipped with-replacement draw, 45 times (1 minus (44/45) to the k), flattening to 30.4 at 50 answers. A dashed reference line shows a deal without replacement, where every correct answer stamps a new cell, reaching the full card at 45. Markers: Endless 9.8 answers, 8.7 cells; Classic without faces 18.6 answers, 15.5 cells; thirty answers all correct, 22.1 cells; Card, all runs 23.3; Card, completed runs 31.7. Filling the card with replacement takes about 198 correct answers.</desc>')
a(f'<rect width="800" height="470" fill="{SURF}"/>')
a(f'<text x="24" y="34" font-family="{UI}" font-size="16" fill="{INK}">Cells a run can stamp</text>')
a(f'<text x="24" y="56" font-family="{UI}" font-size="12" fill="{INK}" fill-opacity=".72">Distinct facts stamped against correct answers. With replacement the card fills as 45·(1 − (44/45)^k);</text>')
a(f'<text x="24" y="74" font-family="{UI}" font-size="12" fill="{INK}" fill-opacity=".72">a deal without replacement stamps a new cell on every correct answer.</text>')
for v in range(0, 46, 15):
    a(f'<line x1="{X0}" y1="{Y(v):.1f}" x2="{X1}" y2="{Y(v):.1f}" stroke="{INK}" stroke-opacity=".10"/>')
    a(f'<text x="{X0-10}" y="{Y(v)+4:.1f}" font-family="{UI}" font-size="11" fill="{INK}" fill-opacity=".55" text-anchor="end">{v}</text>')
for k in range(0, 51, 10):
    a(f'<text x="{X(k):.1f}" y="{Y0+20}" font-family="{UI}" font-size="11" fill="{INK}" fill-opacity=".55" text-anchor="middle">{k}</text>')
a(f'<line x1="{X0}" y1="{Y0}" x2="{X1}" y2="{Y0}" stroke="{INK}" stroke-opacity=".35"/>')
a(f'<text x="{(X0+X1)/2}" y="{Y0+42}" font-family="{UI}" font-size="12" fill="{INK}" fill-opacity=".72" text-anchor="middle">correct answers in one run</text>')
a(f'<text x="22" y="{(Y0+Y1)/2}" font-family="{UI}" font-size="12" fill="{INK}" fill-opacity=".72" text-anchor="middle" transform="rotate(-90 22 {(Y0+Y1)/2})">distinct facts stamped</text>')
# Full-card line and the deal's reference diagonal
a(f'<line x1="{X0}" y1="{Y(45):.1f}" x2="{X1}" y2="{Y(45):.1f}" stroke="{INK}" stroke-opacity=".35" stroke-dasharray="2 4"/>')
a(f'<text x="{X0+6}" y="{Y(45)-7:.1f}" font-family="{UI}" font-size="11" fill="{INK}" fill-opacity=".72">full card · 45</text>')
a(f'<polyline points="{X(0):.1f},{Y(0):.1f} {X(45):.1f},{Y(45):.1f} {X(50):.1f},{Y(45):.1f}" fill="none" stroke="{INK}" stroke-opacity=".72" stroke-width="2" stroke-dasharray="6 5"/>')
a(f'<text x="{X(36)-8:.1f}" y="{Y(36)-12:.1f}" font-family="{UI}" font-size="12" fill="{INK}" fill-opacity=".85" text-anchor="end">deal without replacement: one stamp per correct answer</text>')
# The series: with replacement
pts = " ".join(f"{X(k):.1f},{Y(45*(1-(44/45)**k)):.1f}" for k in range(0, 51))
a(f'<polyline points="{pts}" fill="none" stroke="{GOLD}" stroke-width="2" stroke-linejoin="round"/>')
a(f'<text x="{X1}" y="{Y(30.4)-26:.1f}" font-family="{UI}" font-size="12" fill="{INK}" fill-opacity=".85" text-anchor="end">with replacement</text>')
a(f'<text x="{X1}" y="{Y(30.4)-11:.1f}" font-family="{UI}" font-size="11" fill="{INK}" fill-opacity=".72" text-anchor="end">(the shipped draw)</text>')
def marker(k, v, color, text, dx, dy, anchor="start"):
    a(f'<circle cx="{X(k):.1f}" cy="{Y(v):.1f}" r="5" fill="{color}" stroke="{SURF}" stroke-width="2"/>')
    a(f'<text x="{X(k)+dx:.1f}" y="{Y(v)+dy:.1f}" font-family="{UI}" font-size="11" fill="{INK}" fill-opacity=".72" text-anchor="{anchor}">{text}</text>')
marker(9.8, 8.7, GOLD, "Endless · 9.8 → 8.7", 10, 16)
marker(18.6, 15.5, GOLD, "Classic, no faces · 18.6 → 15.5", 10, 16)
marker(30, 22.1, GOLD, "30 answers, all correct → 22.1", 10, 16)
marker(23.3, 23.3, INK, "Card, all runs · 23.3", -10, -8, "end")
marker(31.7, 31.7, INK, "Card, completed runs · 31.7", -10, -8, "end")
a(f'<text x="{X1}" y="{Y(6):.1f}" font-family="{UI}" font-size="11" fill="{INK}" fill-opacity=".72" text-anchor="end">with replacement, a full card takes 45·H(45) ≈ 198 correct answers →</text>')
a(f'<text x="24" y="458" font-family="{UI}" font-size="11" fill="{INK}" fill-opacity=".55">Markers: mean correct answers → mean distinct facts per run (4,000 bot runs; 20,000 for completed cards; skill 0.95). Curve and 198: analytic.</text>')
a('</svg>')
open(out, "w").write("\n".join(p) + "\n")

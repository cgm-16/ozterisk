import csv, sys
src, out = sys.argv[1], sys.argv[2]
rows = [r for r in csv.reader(open(src)) if r and r[0][0] in "0123456789"]
rows = [(float(b), float(s), int(n), float(m) if m != "NaN" else None, float(c) if c != "NaN" else None) for b, s, n, m, c in rows]
X0, X1, Q0, Q1 = 80, 700, 0.20, 1.05
x = lambda q: X0 + (q - Q0) * (X1 - X0) / (Q1 - Q0)
yt = lambda v: 250 - (v + 0.75) * 160 / 3.35          # top panel: net points
yb = lambda s: 392 - s * 650                          # bottom panel: share of states
SANS = "'Zen Kaku Gothic New', 'Helvetica Neue', Arial, sans-serif"
INK, GOLD = "#f7f0e2", "#c9a54a"
o = []
o.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 470" width="720" height="470" role="img" aria-labelledby="t d">')
o.append('<title id="t">Riichi pays only on a strong rack: net points per declaration against where rack states sit</title>')
o.append('<desc id="d">Two panels sharing one x axis, q, the chance the next equation is buildable. Top: mean net points of a riichi declaration, with 95% intervals, rising from about minus 0.58 at q 0.2 to about plus 2.2 at q 1.0 and crossing zero between 0.45 and 0.50. Bottom: the share of eligible rack states in each q bin; 42% lie below 0.50. Simulation on the real reducer, 10,000 runs, skill 0.95, locked rack, stake 1.</desc>')
o.append('<rect width="720" height="470" fill="#071711"/><rect x="8" y="8" width="704" height="454" rx="14" fill="#0b211b"/>')
o.append(f'<text x="32" y="38" font-family="{SANS}" font-size="16" font-weight="bold" fill="{INK}">Declaring pays only on a strong rack</text>')
o.append(f'<text x="32" y="58" font-family="{SANS}" font-size="12" fill="{INK}" fill-opacity="0.72">riichi-sim.ts on the real reducer · 10,000 runs · skill 0.95 · locked rack · stake 1 · bank rule: one-step lookahead</text>')
# top panel grid + labels
o.append(f'<text x="{X0}" y="84" font-family="{SANS}" font-size="11" fill="{INK}" fill-opacity="0.72">Net points per declaration (mean, 95% CI)</text>')
for v, lab in [(2, "+2"), (1, "+1"), (0, "0")]:
    yy = yt(v)
    o.append(f'<line x1="{X0}" x2="{X1}" y1="{yy:.1f}" y2="{yy:.1f}" stroke="{INK}" stroke-opacity="{0.55 if v == 0 else 0.14}" stroke-width="1"/>')
    o.append(f'<text x="{X0 - 10}" y="{yy + 4:.1f}" text-anchor="end" font-family="{SANS}" font-size="11" fill="{INK}" fill-opacity="0.72">{lab}</text>')
# bottom panel grid + labels
o.append(f'<text x="{X0}" y="292" font-family="{SANS}" font-size="11" fill="{INK}" fill-opacity="0.72">Where rack states sit (share of eligible feedbacks)</text>')
for s, lab in [(0.10, "10%"), (0.05, "5%"), (0.0, "0")]:
    yy = yb(s)
    o.append(f'<line x1="{X0}" x2="{X1}" y1="{yy:.1f}" y2="{yy:.1f}" stroke="{INK}" stroke-opacity="{0.55 if s == 0 else 0.14}" stroke-width="1"/>')
    o.append(f'<text x="{X0 - 10}" y="{yy + 4:.1f}" text-anchor="end" font-family="{SANS}" font-size="11" fill="{INK}" fill-opacity="0.72">{lab}</text>')
# bars with 4px-rounded data ends, square at the baseline
for b, s, n, m, c in rows:
    h = s * 650
    if h <= 0: continue
    cx = x(b + 0.025); w = 30; l = cx - w / 2; base = yb(0); top = base - h; r = min(4, h)
    o.append(f'<path d="M{l:.1f},{base:.1f} V{top + r:.1f} Q{l:.1f},{top:.1f} {l + r:.1f},{top:.1f} H{l + w - r:.1f} Q{l + w:.1f},{top:.1f} {l + w:.1f},{top + r:.1f} V{base:.1f} Z" fill="{GOLD}"/>')
# line + whiskers + markers
pts = [(x(b + 0.025), yt(m), yt(m - c), yt(m + c)) for b, s, n, m, c in rows if m is not None]
o.append('<polyline fill="none" stroke="%s" stroke-opacity="0.6" stroke-width="2" points="%s"/>' % (GOLD, " ".join(f"{px:.1f},{py:.1f}" for px, py, _, _ in pts)))
for px, py, lo, hi in pts:
    o.append(f'<line x1="{px:.1f}" x2="{px:.1f}" y1="{lo:.1f}" y2="{hi:.1f}" stroke="{GOLD}" stroke-width="2"/>')
    o.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="4.5" fill="{GOLD}" stroke="#0b211b" stroke-width="2"/>')
# break-even line spanning both panels
xt = x(0.5)
o.append(f'<line x1="{xt:.1f}" x2="{xt:.1f}" y1="92" y2="{yb(0):.1f}" stroke="{INK}" stroke-opacity="0.72" stroke-width="1" stroke-dasharray="4 4"/>')
o.append(f'<text x="{xt + 8:.1f}" y="108" font-family="{SANS}" font-size="11" fill="{INK}">break-even q = 0.50</text>')
o.append(f'<text x="{xt + 8:.1f}" y="123" font-family="{SANS}" font-size="11" fill="{INK}" fill-opacity="0.72">(constant-q estimate: 0.50)</text>')
o.append(f'<text x="{xt - 8:.1f}" y="309" text-anchor="end" font-family="{SANS}" font-size="11" fill="{INK}">42% of states: declaring loses</text>')
o.append(f'<text x="{xt + 8:.1f}" y="309" font-family="{SANS}" font-size="11" fill="{INK}">58%: declaring pays</text>')
# x axis
for q in [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]:
    o.append(f'<text x="{x(q):.1f}" y="410" text-anchor="middle" font-family="{SANS}" font-size="11" fill="{INK}" fill-opacity="0.72">{q:.1f}</text>')
o.append(f'<text x="{(X0 + X1) / 2:.1f}" y="432" text-anchor="middle" font-family="{SANS}" font-size="12" fill="{INK}">q = chance the next equation is buildable from the rack (kind bias included)</text>')
o.append(f'<text x="{(X0 + X1) / 2:.1f}" y="452" text-anchor="middle" font-family="{SANS}" font-size="11" fill="{INK}" fill-opacity="0.55">Static figure; its data are tabulated in §5. Episode net excludes the lock\'s cost to later rounds.</text>')
o.append('</svg>')
open(out, "w").write("\n".join(o) + "\n")

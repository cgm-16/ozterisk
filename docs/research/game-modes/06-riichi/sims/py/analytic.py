# Constant-q renewal-reward estimate (an ESTIMATE: ignores rack decay and the lock).
# Riichi: stake s; k-th riichi answer adds min(k, cap) to the pot; bank after K.
# side=True: the plain +1 still banks (riichi is a side bet). side=False: the pot replaces it.
def episode(q, K, s=1, cap=8):
    G = sum(min(k, cap) for k in range(1, K + 1))
    net = q**K * G - (1 - q**K) * s
    rounds = (1 - q**K) / (1 - q)
    return net, rounds
def best(q, side, s=1, cap=8):
    out = []
    for K in range(1, 40):
        net, rounds = episode(q, K, s, cap)
        # gain per round over not declaring
        if side: gain = net / rounds
        else: gain = (net - q * rounds) / rounds  # forgone plain points
        out.append((gain, K))
    return max(out)
print("q    | side bet: best K, gain/round | replace: best K, gain/round")
for q in [0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.72, 0.75, 0.8, 0.9]:
    gs, ks = best(q, True); gr, kr = best(q, False)
    print(f"{q:.2f} | K={ks:2d} {gs:+.3f} | K={kr:2d} {gr:+.3f}")
# break-even search
import math
for side in (True, False):
    lo, hi = 0.3, 0.95
    for _ in range(60):
        mid = (lo + hi) / 2
        if best(mid, side)[0] > 0: hi = mid
        else: lo = mid
    print(("side" if side else "replace"), "break-even q* =", round(hi, 3))
# negative control: cap 0 (pot never grows) must never be worth declaring
print("cap0 control max gain over q in [0.2,0.99]:", max(best(q/100, True, cap=0)[0] for q in range(20, 100)))

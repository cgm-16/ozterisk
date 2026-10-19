# Content budget: offers of 3 at 3 landings, never re-offering a taken boon (pick uniformly);
# twist bag drawing k per run without repeats. Monte Carlo, 200k runs per cell.
import random
random.seed(7)
def boons(B, runs=200_000):
    seen_tot = 0; hit0 = 0; forced = 0; same_first = 0
    prev = None
    for _ in range(runs):
        pool = list(range(B)); taken = set(); seen = set()
        for l in range(3):
            left = [b for b in pool if b not in taken]
            offer = random.sample(left, 3)
            if len(left) == 3: forced += 1
            seen |= set(offer); taken.add(random.choice(offer))
            if l == 0:
                if prev is not None and set(offer) == prev: same_first += 1
                prev = set(offer)
        seen_tot += len(seen); hit0 += 0 in seen
    return seen_tot / runs, hit0 / runs, forced / runs, same_first / runs
for B in (6, 9, 12, 18):
    s, h, f, same = boons(B)
    print(f"boons B={B:2d}: distinct offered/run {s:.1f}, P(a given boon offered) {h:.2f}, P(a landing's offer forced) {f:.2f}, P(next run's first offer identical) {same:.3f}")
from math import comb
for T, k in ((6, 4), (6, 3), (8, 3), (10, 3)):
    # expected shared twists between two runs' sets = k*k/T; P(identical set) = 1/C(T,k)
    print(f"twists T={T:2d}, {k} per run: P(a given twist appears) {k/T:.2f}, expected shared with last run {k*k/T:.2f}, P(same set as last run) {1/comb(T,k):.3f}")

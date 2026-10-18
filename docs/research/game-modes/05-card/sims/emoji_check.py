import sys
props = {}
for line in open(sys.argv[1], encoding="utf-8"):
    line = line.split("#")[0].strip()
    if not line: continue
    rng, prop = [x.strip() for x in line.split(";")]
    lo, hi = (rng.split("..") + [rng])[:2] if ".." in rng else (rng, rng)
    for c in range(int(lo, 16), int(hi, 16) + 1):
        props.setdefault(c, []).append(prop)
for cp in sys.argv[2:]:
    c = int(cp, 16)
    print(f"U+{cp} {chr(c)}: {', '.join(props.get(c, [])) or 'not an emoji code point'}")

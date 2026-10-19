Pre-registered before running the instrument check and the variable-length (split) sim.
Written 2026-10-17, after main.out / levers-decision.out, before split results exist.

Two-slot Factor measured so far: ~0.9 meaningful pair choices per run, greedy-vs-anti
spread ~3% of run length (C10 kind .2: 18.8 vs 18.3).

Instrument check (must pass, or the pair-choice null means nothing):
- greedy vs random DISCARD and greedy vs random MISS-SPEND must each show a clearly
  larger run-length gap than pair choice (>= 10% of run length). Report delta-rounds
  per decision taken.

Variable-length answers (2 or 3 tiles, product of tiles = target, 1s allowed) RESCUE the
thesis only if, at some capacity whose mean run length is 14-24 rounds (Endless with this
bot: 18.9) with in-run b under 2/3 and 0% of runs capped:
  (a) >= 3 meaningful choices per run (rounds with >= 2 answer options that differ in
      resulting coverage), AND
  (b) spread between the best and worst fixed answer policy (shortest / longest /
      coverage-greedy / random / anti) >= 10% of mean run length.
If either fails, the draft presents two-slot Factor with the thin decision as its headline
finding, and the return message says it risks being Endless plus a reversed prompt.

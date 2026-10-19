// Fast re-implementation of the core loop on digit counts, for what the real
// reducer cannot express: other capacities and schedules, and line rewards.
// Calibrated against harness.ts (real reducer) in engine-runs.ts.
import { chooseDigits } from "./harness.ts";
import { BOXES, FACTS, TABLES, buildable, mulberry32 } from "./common.ts";

export type EngineConfig = {
  deal: "replace" | "deck";
  kindRate: number;
  policy: "naive" | "blind" | "aware" | "scrambled";
  skill: number;
  capacity: (submissions: number) => number; // live capacity after n submissions
  horizon: number; // submissions at which the run ends (45 = the whole deal)
  lineReward?: "none" | "socket" | "wild" | "tile";
  lines?: number[][]; // which completions pay (default TABLES)
  maxRounds?: number;
};
export type EngineResult = {
  submitted: number; correct: number; distinct: number; win: boolean; buildableRounds: number;
  tables: number; boxes: number; rewardsPaid: number; longestStreak: number; card: ("stamp" | "burn" | "none")[];
  byPos: Array<{ len: number; buildable: boolean }>;
};
const ALL = FACTS.map((f) => f.i);

export function runEngine(cfg: EngineConfig, seed: number): EngineResult {
  const rng = mulberry32(seed);
  const counts = Array(10).fill(0);
  let wild = 0;
  const start = cfg.capacity(0);
  for (let i = 0; i < start; i++) counts[i % 10]++;
  const total = () => counts.reduce((s, x) => s + x, 0) + wild;
  const card: EngineResult["card"] = Array(45).fill("none");
  const dealt = new Set<number>();
  const perm = [...ALL];
  for (let i = perm.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  const lines = cfg.lines ?? TABLES;
  const paid = new Set<number>();
  let streak = 0, longestStreak = 0;
  let capBonus = 0, rewardsPaid = 0, submitted = 0, correctN = 0, buildableRounds = 0, win = false;
  const byPos: EngineResult["byPos"] = [];

  const open = () => (cfg.deal === "deck" ? ALL.filter((i) => !dealt.has(i)) : ALL.filter((i) => card[i] !== "stamp"));
  const pool = (): readonly number[] | null =>
    cfg.policy === "naive" ? null : cfg.policy === "blind" ? ALL : cfg.policy === "aware" ? open() : open().map((i) => perm[i]);
  const draw = (): number => {
    let p = cfg.deal === "deck" ? ALL.filter((i) => !dealt.has(i)) : ALL;
    if (rng() < cfg.kindRate) {
      const kind = p.filter((i) => buildable(FACTS[i], counts, wild));
      if (kind.length > 0) p = kind;
    }
    const i = p[Math.floor(rng() * p.length)];
    rng(); // display order, consumed as the real generator does
    dealt.add(i);
    return i;
  };
  const addDigits = (k: number) => {
    for (let r = 0; r < k; r++) counts[Math.min(9, Math.floor(rng() * 10))]++;
  };

  for (;;) {
    if (submitted >= cfg.horizon) { win = total() >= 1; break; }
    if (submitted >= (cfg.maxRounds ?? 5000)) break;
    const fi = draw();
    const f = FACTS[fi];
    const len = f.digits.length;
    if (total() < len) break; // loss: the drawn fact is terminal, not submitted
    const canBuild = buildable(f, counts, wild);
    if (canBuild) buildableRounds++;
    byPos.push({ len, buildable: canBuild });
    let correct = canBuild && rng() < cfg.skill;
    if (!correct) {
      const digitsHeld = counts.reduce((s, x) => s + x, 0);
      if (digitsHeld >= len) {
        const spend = chooseDigits(counts, len as 1 | 2, pool(), f.product, rng, wild);
        if (spend.length === 0) correct = canBuild;
        else for (const d of spend) counts[d]--;
      } else {
        // Too few digits: spend them all, then wildcards (a wild in the wrong slot still misses).
        let need = len;
        for (let d = 0; d <= 9 && need > 0; d++) while (counts[d] > 0 && need > 0) { counts[d]--; need--; }
        wild -= need;
      }
    }
    if (correct) {
      for (const d of f.digits) { if (counts[d] > 0) counts[d]--; else wild--; }
      addDigits(len + 1);
      card[fi] = "stamp";
      correctN++;
      streak++;
      longestStreak = Math.max(longestStreak, streak);
      lines.forEach((line, li) => {
        if (paid.has(li) || !line.every((i) => card[i] === "stamp")) return;
        paid.add(li);
        if (cfg.lineReward === "none" || !cfg.lineReward) return;
        rewardsPaid++;
        if (cfg.lineReward === "socket") capBonus++;
        if (cfg.lineReward === "wild") wild++;
        if (cfg.lineReward === "tile") addDigits(1);
      });
    } else {
      streak = 0;
      if (card[fi] !== "stamp") card[fi] = "burn";
    }
    submitted++;
    // Overflow against the live capacity after this submission; discard one at a time.
    while (total() > cfg.capacity(submitted) + capBonus) {
      if (counts.reduce((s, x) => s + x, 0) === 0) { wild--; continue; }
      const [d] = chooseDigits(counts, 1, pool(), null, rng, wild);
      counts[d]--;
    }
  }
  const stamped = new Set(ALL.filter((i) => card[i] === "stamp"));
  return {
    submitted, correct: correctN, distinct: stamped.size, win, buildableRounds,
    tables: TABLES.filter((t) => t.every((i) => stamped.has(i))).length,
    boxes: BOXES.filter((t) => t.every((i) => stamped.has(i))).length,
    rewardsPaid, longestStreak, card, byPos,
  };
}

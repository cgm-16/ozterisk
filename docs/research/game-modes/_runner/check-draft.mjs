// Mechanical gate for one research draft folder.
// Usage: node check-draft.mjs /abs/path/to/NN-slug/draft
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const dir = process.argv[2];
const problems = [];
const notes = [];
const readme = join(dir, "README.md");
if (!existsSync(readme)) {
  console.log(`FAIL ${dir}: no README.md`);
  process.exit(1);
}
const md = readFileSync(readme, "utf8");

if (!md.includes("research draft — not canonical")) problems.push("missing Status line");
for (const heading of [
  "## 1. Spec collisions", "## 2. The mode", "## 3. The loop", "## 4. The decision it creates",
  "## 5. Economy", "## 6. Smallest playable slice", "## 7. Biggest risk", "## 8. Open questions", "## Sources",
]) if (!md.includes(heading)) problems.push(`missing heading: ${heading}`);
for (const row of ["Core verb", "Only this draft contributes", "Nearest neighbour", "Spec fit", "Cliff verdict", "Build size", "Mode select copy"])
  if (!md.includes(row)) problems.push(`missing top-table row: ${row}`);
if (!/```mermaid/.test(md)) problems.push("no mermaid block");

const files = readdirSync(dir);
const stray = files.filter((f) => f !== "sims" && !/\.(md|svg)$/i.test(f));
if (stray.length) problems.push(`non md/svg files: ${stray.join(", ")}`);

const svgRefs = [...md.matchAll(/\]\(\.\/([^)]+\.svg)\)/g)].map((m) => m[1]);
if (!svgRefs.length) problems.push("no embedded ./*.svg");
for (const ref of svgRefs) if (!existsSync(join(dir, ref))) problems.push(`broken image ref: ${ref}`);
const svgs = files.filter((f) => f.endsWith(".svg"));
for (const svg of svgs) {
  try {
    execFileSync("xmllint", ["--noout", join(dir, svg)], { stdio: "pipe" });
  } catch (e) {
    problems.push(`xmllint fails: ${svg}: ${String(e.stderr).split("\n")[0]}`);
  }
  const text = readFileSync(join(dir, svg), "utf8");
  if (/@import|<script|href="https?:/i.test(text)) problems.push(`external ref/script in ${svg}`);
  if (!/<title[ >]/.test(text)) problems.push(`no <title> in ${svg}`);
}
const unreferenced = svgs.filter((s) => !svgRefs.includes(s));
if (unreferenced.length) notes.push(`unreferenced svg: ${unreferenced.join(", ")}`);

// Prose words: drop fenced code, table rows, image lines, and the Sources list.
const body = md.split("## Sources")[0];
const prose = body
  .replace(/```[\s\S]*?```/g, " ")
  .split("\n")
  .filter((l) => !l.trim().startsWith("|") && !l.trim().startsWith("!["))
  .join(" ");
const words = prose.split(/\s+/).filter(Boolean).length;
if (words > 2500) problems.push(`prose ${words} words > 2500 cap`);
const sources = md.split("## Sources")[1] ?? "";
const urls = (sources.match(/https?:\/\/\S+/g) ?? []).length;
const unverified = (md.match(/unverified recall/gi) ?? []).length;

console.log(`${problems.length ? "FAIL" : "PASS"} ${dir}`);
console.log(`  prose words ${words} · svgs ${svgs.length} (${svgRefs.length} embedded) · source URLs ${urls} · "unverified recall" ×${unverified}`);
for (const p of problems) console.log(`  ✗ ${p}`);
for (const n of notes) console.log(`  · ${n}`);
process.exit(problems.length ? 1 : 0);

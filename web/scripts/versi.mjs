/**
 * Menulis public/version.json sebelum `next build`, supaya /version.json
 * menyebut commit yang sedang tayang juga saat Hostinger membangun dari web/.
 * Next.js hanya menyajikan berkas public yang ada saat build.
 */
import { writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

let commit = (process.env.GITHUB_SHA ?? "").trim();
if (!commit) {
  try {
    commit = execFileSync("git", ["rev-parse", "HEAD"], { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    commit = "";
  }
}
writeFileSync("public/version.json", JSON.stringify({ commit, short: commit.slice(0, 7), builtAt: new Date().toISOString() }, null, 2) + "\n");
console.log(`public/version.json: ${commit.slice(0, 7) || "commit tidak diketahui"}`);

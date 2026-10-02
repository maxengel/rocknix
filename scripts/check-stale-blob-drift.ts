#!/usr/bin/env node
// Adopted from pfi-collaboration@534475088647785db22308db756a52b1dea5c761:scripts/check-stale-blob-drift.ts
// 2026-09-07, scaffold#524: Node-native TypeScript imports; see docs/planning/council-toolchain-524.md.
/**
 * Stale-blob regression detector (Wall #2, closes Gap 2).
 *
 * The council substrate and skill reference docs are high-value, low-churn
 * files. A silent regression — where the working tree reverts one of them
 * to the *valid* content of an OLDER commit (e.g. a stale stash applied on
 * top of newer work) — is invisible to content lints, because the reverted
 * content is itself well-formed. It is only visible relative to HEAD, which
 * nothing checks at commit time.
 *
 * This detector, scoped to the council-substrate + skill paths, flags any
 * in-scope modified file whose working-tree blob exactly matches the blob
 * of an ANCESTOR commit that is NOT HEAD. That signature distinguishes a
 * "revert to a past commit's content" from genuinely novel edits.
 *
 * It BLOCKS (exit 1) by repo discipline (stop-and-fix > warn-and-skip), with
 * an explicit per-path override in `.stale-blob-allowlist` for intentional
 * reverts. Scope is deliberately narrow to keep false positives near zero.
 *
 * Usage:
 *   node scripts/check-stale-blob-drift.ts            # derive files from git
 *   node scripts/check-stale-blob-drift.ts <file...>  # explicit file list
 */

import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

/** Paths whose silent reversion is dangerous enough to gate on. */
const IN_SCOPE: RegExp[] = [
  /^scripts\/council-[^/]+\.ts$/,
  /^scripts\/lint-council-[^/]+\.ts$/,
  /^scripts\/verify-[^/]+\.ts$/,
  /^scripts\/write-step-seal\.ts$/,
  /^scripts\/check-stale-blob-drift\.ts$/,
  /^scripts\/lib\/council-verification\.ts$/,
  /^scripts\/lib\/council-roster\.ts$/,
  /^scripts\/build-council-prompt\.ts$/,
  /^council-(roster|seat-efforts)\.json$/,
  /^\.claude\/agents\/council-member-[^/]+\.agent\.md$/,
  /^scripts\/lib\/verifier-pins\.ts$/,
  /^verifier-pins\.json$/,
  /^\.claude\/skills\/council\//,
  /^\.claude\/skills\/council-research\//,
];

/** Max history depth to scan per file (bounds cost on long-lived files). */
const MAX_HISTORY = 200;

function git(repoRoot: string, args: string[]): string {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

function tryGit(repoRoot: string, args: string[]): string | null {
  try {
    return git(repoRoot, args);
  } catch (error) {
    // Missing historical paths may return a Git exit status. Failure to spawn
    // Git is not missing history and must never become a clean drift verdict.
    if (typeof (error as { status?: unknown }).status !== "number") throw error;
    return null;
  }
}

function isInScope(rel: string): boolean {
  return IN_SCOPE.some((re) => re.test(rel));
}

function loadAllowlist(repoRoot: string): Set<string> {
  const allowPath = path.join(repoRoot, ".stale-blob-allowlist");
  if (!fs.existsSync(allowPath)) return new Set();
  return new Set(
    fs
      .readFileSync(allowPath, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("#"))
  );
}

interface Drift {
  path: string;
  matchCommit: string;
  matchSubject: string;
}

function detectDrift(repoRoot: string, rel: string): Drift | null {
  const abs = path.join(repoRoot, rel);
  if (!fs.existsSync(abs)) return null; // deleted in WT — not a revert

  const wtBlob = git(repoRoot, ["hash-object", rel]);

  const headBlob = tryGit(repoRoot, ["rev-parse", `HEAD:${rel}`]);
  if (!headBlob) return null; // new file (absent at HEAD) — cannot be a revert
  if (headBlob === wtBlob) return null; // unchanged vs HEAD

  const headSha = git(repoRoot, ["rev-parse", "HEAD"]);
  const logOut = git(repoRoot, ["log", `--max-count=${MAX_HISTORY}`, "--format=%H", "--", rel]);
  if (!logOut) return null;

  for (const commit of logOut.split("\n").filter(Boolean)) {
    if (commit === headSha) continue; // HEAD's content is the expected baseline
    const blob = tryGit(repoRoot, ["rev-parse", `${commit}:${rel}`]);
    if (blob === wtBlob) {
      const subject = tryGit(repoRoot, ["log", "-1", "--format=%s", commit]) ?? "";
      return { path: rel, matchCommit: commit, matchSubject: subject };
    }
  }
  return null;
}

function main(): number {
  const repoRoot = git(process.cwd(), ["rev-parse", "--show-toplevel"]);
  const allowlist = loadAllowlist(repoRoot);

  const explicit = process.argv.slice(2);
  let candidates: string[];
  if (explicit.length > 0) {
    candidates = explicit.map((p) => path.relative(repoRoot, path.resolve(p)));
  } else {
    const diff = git(repoRoot, ["diff", "--name-only", "HEAD"]);
    candidates = diff.split("\n").filter(Boolean);
  }

  const inScope = candidates.filter(isInScope).filter((p) => !allowlist.has(p));
  const drifts: Drift[] = [];
  for (const rel of inScope) {
    const drift = detectDrift(repoRoot, rel);
    if (drift) drifts.push(drift);
  }

  if (drifts.length === 0) {
    console.error("OK - no stale-blob regression detected in council substrate / skill paths.");
    return 0;
  }

  console.error(
    "[FAIL stale_blob_regression] council-substrate / skill file(s) reverted to OLDER-commit content:"
  );
  for (const d of drifts) {
    console.error(
      `  - ${d.path}\n      working tree matches blob from ${d.matchCommit.slice(0, 12)} ("${d.matchSubject}"), NOT HEAD.`
    );
  }
  console.error(
    "\nThis is the silent stale-stash regression signature. Confirm the working-tree content is intended."
  );
  console.error(
    "If you genuinely mean to restore older content, add the path(s) to .stale-blob-allowlist and re-commit."
  );
  return 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch {
    console.error(
      "[FAIL stale_blob_unverified] Git/history access failed; no clean drift verdict is available."
    );
    process.exitCode = 1;
  }
}

#!/usr/bin/env npx tsx
/**
 * Council Run Start (M64.P1.5 E7/H2 #2974)
 *
 * Writes verification/genesis.json and anchors it on a verification branch.
 * Do not run this on a live repo branch unless you intend to create/push the
 * verification-anchors/<run_id> branch.
 */

import { createHash, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { canonicalJson, readManifest, sha256Hex } from "./lib/council-verification.js";
import { verifyPinnedFiles } from "./lib/verifier-pins.js";

const FACILITATOR_VERSION = "council-facilitator@1.2.0";

interface CliArgs {
  runDir: string;
  remote: string;
  noPush: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  let runDir: string | null = null;
  let remote = "origin";
  let noPush = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--run-dir") runDir = argv[++index] ?? null;
    else if (arg === "--remote") remote = argv[++index] ?? "origin";
    else if (arg === "--no-push") noPush = true;
    else throw new Error(`[FAIL usage] unknown argument ${arg}`);
  }
  if (!runDir) throw new Error("[FAIL usage] --run-dir is required");
  return { runDir: path.resolve(runDir), remote, noPush };
}

function git(args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function hashCanonical(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function ensureSealKey(runDir: string): string {
  const keyPath = path.join(runDir, "verification", "seal-key.local");
  if (fs.existsSync(keyPath)) return fs.readFileSync(keyPath, "utf8").trim();
  const key = randomBytes(32).toString("hex");
  fs.writeFileSync(keyPath, `${key}\n`, { encoding: "utf8", mode: 0o600 });
  return key;
}

function verifierPinsHash(repoRoot: string): string | null {
  const pinsPath = path.join(repoRoot, "tools/council/verifier-pins.json");
  if (!fs.existsSync(pinsPath)) return null;
  return sha256Hex(fs.readFileSync(pinsPath));
}

function main(): number {
  try {
    const args = parseArgs(process.argv.slice(2));
    const repoRoot = git(["rev-parse", "--show-toplevel"]);
    const pinFindings = verifyPinnedFiles(repoRoot);
    if (pinFindings.length > 0) {
      for (const finding of pinFindings) {
        console.error(`[FAIL ${finding.code}] ${finding.message}`);
      }
      return 1;
    }
    const manifest = readManifest(args.runDir);
    const verificationDir = path.join(args.runDir, "verification");
    fs.mkdirSync(verificationDir, { recursive: true });

    const sealKey = ensureSealKey(args.runDir);
    const genesis = {
      run_id: manifest.run_id,
      roster_hash: hashCanonical(manifest.roster),
      aliases_hash: hashCanonical(manifest.roster),
      verifier_pins_hash: verifierPinsHash(repoRoot),
      facilitator_version: FACILITATOR_VERSION,
      seal_hmac_key_sha256: sha256Hex(sealKey),
      timestamp: new Date().toISOString(),
      anchor_branch: `verification-anchors/${manifest.run_id}`,
    };

    const genesisPath = path.join(verificationDir, "genesis.json");
    fs.writeFileSync(genesisPath, JSON.stringify(genesis, null, 2) + "\n", "utf8");

    const originalBranch = git(["branch", "--show-current"]);
    const relativeGenesis = path.relative(repoRoot, genesisPath);
    const branch = genesis.anchor_branch;

    git(["switch", "-c", branch]);
    try {
      git(["add", "--", relativeGenesis]);
      git(["commit", "-m", `Anchor council run ${manifest.run_id}`]);
      if (!args.noPush) git(["push", args.remote, branch]);
    } finally {
      git(["switch", originalBranch]);
    }

    // The switch back removes genesis.json from the working tree: it is
    // tracked only on the anchor branch, and `git switch` deletes files
    // tracked on the branch being left. The Facilitator stamps
    // genesis_sha256 into every ledger verdict from the working-tree copy,
    // and verify-chain requires it — so restore the exact anchored bytes.
    // (Defect found 2026-08-17: run q2-sequence-state-boundary produced six
    // genesis-less verdicts because this restore was missing.)
    fs.mkdirSync(verificationDir, { recursive: true });
    fs.writeFileSync(genesisPath, JSON.stringify(genesis, null, 2) + "\n", "utf8");

    console.error(`Wrote ${path.relative(process.cwd(), genesisPath)}`);
    console.error(`Anchored ${manifest.run_id} on ${branch}${args.noPush ? " (not pushed)" : ""}`);
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

process.exit(main());

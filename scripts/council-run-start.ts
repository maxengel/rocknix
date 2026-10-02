#!/usr/bin/env node
// Adopted from pfi-collaboration@534475088647785db22308db756a52b1dea5c761:scripts/council-run-start.ts
// 2026-09-07, scaffold#524: Node-native TypeScript imports; see docs/planning/council-toolchain-524.md.
/**
 * Council Run Start (M64.P1.5 E7/H2 #2974)
 *
 * Writes verification/genesis.json and anchors it on a verification branch.
 * Do not run this on a live repo branch unless you intend to create/push the
 * verification-anchors/<run_id> branch.
 */

import { createHash, randomBytes } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
  canonicalJson,
  councilRunScope,
  readManifest,
  resolveRunArtifact,
  sha256Hex,
} from "./lib/council-verification.ts";
import { verifyPinAccountability, verifyPinnedFiles } from "./lib/verifier-pins.ts";
import {
  COUNCIL_ROOT,
  assertCatalog,
  assertRunRoster,
  rosterIdentity,
  profileForManifest,
} from "./lib/council-roster.ts";
import { FACILITATOR_VERSION } from "./council-invoke.ts";

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
  if (!runDir || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(remote))
    throw new Error("[FAIL usage] --run-dir and a named remote are required");
  return { runDir: path.resolve(runDir), remote, noPush };
}

function git(args: string[], input?: string, env = process.env): string {
  return execFileSync("git", args, {
    encoding: "utf8",
    input,
    env,
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}

/** No credential enters argv, config or the environment: inherited helpers are
 *  cleared and Git pushes over the fork's own remote (the box's ssh key, or https). */
export function machineGitArgs(): string[] {
  return [
    "-c",
    "credential.helper=",
    "-c",
    "credential.https://github.com.helper=",
    "-c",
    "http.followRedirects=false",
    "-c",
    "credential.interactive=false",
  ];
}

function hashCanonical(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function ensureSealKey(runDir: string): string {
  const keyPath = path.join(runDir, "verification", "seal-key.local");
  const environmentKey = process.env.COUNCIL_SEAL_HMAC_KEY;
  if (environmentKey) {
    if (!/^[a-f0-9]{64}$/i.test(environmentKey))
      throw new Error("[FAIL seal_key_invalid] use a 32-byte hexadecimal HMAC key");
    return environmentKey;
  }
  if (fs.existsSync(keyPath)) {
    if ((fs.statSync(keyPath).mode & 0o077) !== 0)
      throw new Error("[FAIL seal_key_permissions] local key must be owner-only");
    const key = fs.readFileSync(keyPath, "utf8").trim();
    if (!/^[a-f0-9]{64}$/i.test(key))
      throw new Error("[FAIL seal_key_invalid] invalid local HMAC key");
    return key;
  }
  if (fs.existsSync(path.join(runDir, "verification", "genesis.json")))
    throw new Error("[FAIL seal_key_missing] restore the existing key; never replace a run's key");
  const key = randomBytes(32).toString("hex");
  fs.writeFileSync(keyPath, `${key}\n`, {
    encoding: "utf8",
    mode: 0o600,
    flag: "wx",
  });
  return key;
}

function verifierPinsHash(repoRoot: string): string | null {
  const pinsPath = path.join(repoRoot, "verifier-pins.json");
  if (!fs.existsSync(pinsPath)) return null;
  return sha256Hex(fs.readFileSync(pinsPath));
}

async function main(): Promise<number> {
  try {
    const args = parseArgs(process.argv.slice(2));
    const repoRoot = git(["rev-parse", "--show-toplevel"]);
    if (repoRoot !== COUNCIL_ROOT || path.resolve(process.cwd()) !== COUNCIL_ROOT)
      throw new Error("[FAIL repository_root] run setup from the installed repository root");
    const pinFindings = [...verifyPinnedFiles(repoRoot), ...verifyPinAccountability(repoRoot)];
    if (pinFindings.length > 0) {
      for (const finding of pinFindings) {
        console.error(`[FAIL ${finding.code}] ${finding.message}`);
      }
      return 1;
    }
    const manifest = readManifest(args.runDir);
    assertCatalog(repoRoot, profileForManifest(manifest));
    assertRunRoster(manifest, repoRoot);
    if (manifest.provenance_contract !== FACILITATOR_VERSION)
      throw new Error("[FAIL contract_mismatch] new runs require the current Facilitator contract");
    const relativeRun = path.relative(repoRoot, args.runDir).split(path.sep).join("/");
    if (
      (!relativeRun.startsWith("research/council-runs/") && !councilRunScope(args.runDir).nested) ||
      fs.realpathSync(args.runDir) !== args.runDir
    )
      throw new Error(
        "[FAIL run_scope] run must be a real council-runs directory or a nested council-research Phase 4 directory"
      );
    const genesisPath = resolveRunArtifact(args.runDir, "verification/genesis.json");
    resolveRunArtifact(args.runDir, "verification/seal-key.local");
    resolveRunArtifact(args.runDir, "verification/anchor-receipt.json");
    const remoteUrl = args.noPush ? null : git(["remote", "get-url", args.remote]);
    // rasteratops (D-WORKFLOW-088): a live anchor lands on the fork's own repository,
    // over the box's ssh key or https. The push and the ls-remote read-back below are
    // the receipt; no write preflight, custody file or token is involved.
    if (
      remoteUrl !== null &&
      !/^(https:\/\/github\.com\/rasteratops\/|git@github(?:\.com|-[a-z0-9-]+):rasteratops\/)[a-zA-Z0-9_.-]+(?:\.git)?$/.test(
        remoteUrl
      )
    )
      throw new Error(
        "[FAIL remote_scope] live anchors require the fork's own repository (rasteratops on GitHub) as the named remote"
      );
    const machineEnv =
      remoteUrl !== null ? { ...process.env, GIT_TERMINAL_PROMPT: "0" } : process.env;
    const keyRelative = `${relativeRun}/verification/seal-key.local`;
    const ignored = spawnGit(["check-ignore", "-q", "--no-index", "--", keyRelative]);
    const tracked = spawnGit(["ls-files", "--error-unmatch", "--", keyRelative]);
    if (ignored.status !== 0 || tracked.status !== 1)
      throw new Error(
        "[FAIL seal_key_ignore] seal-key.local must be ignored and untracked before setup"
      );
    const verificationDir = path.join(args.runDir, "verification");
    fs.mkdirSync(verificationDir, { recursive: true });

    const sealKey = ensureSealKey(args.runDir);
    const fixed = {
      run_id: manifest.run_id,
      roster_hash: hashCanonical(manifest.roster),
      roster_contract: rosterIdentity(repoRoot, profileForManifest(manifest)),
      council_profile: profileForManifest(manifest),
      experiment: manifest.experiment ?? null,
      coordinator: manifest.coordinator,
      verifier_pins_hash: verifierPinsHash(repoRoot),
      facilitator_version: FACILITATOR_VERSION,
      seal_hmac_key_sha256: sha256Hex(sealKey),
      anchor_branch: `verification-anchors/${manifest.run_id}`,
    };
    let genesis = { ...fixed, timestamp: new Date().toISOString() };
    if (fs.existsSync(genesisPath)) {
      const existing = JSON.parse(fs.readFileSync(genesisPath, "utf8"));
      const { timestamp: _timestamp, ...existingFixed } = existing;
      if (canonicalJson(existingFixed) !== canonicalJson(fixed))
        throw new Error("[FAIL genesis_conflict] existing run identity differs; start a new run");
      genesis = existing;
    } else {
      fs.writeFileSync(genesisPath, JSON.stringify(genesis, null, 2) + "\n", {
        flag: "wx",
      });
    }
    const bytes = fs.readFileSync(genesisPath, "utf8");
    const relativeGenesis = path.relative(repoRoot, genesisPath).split(path.sep).join("/");
    const branch = genesis.anchor_branch;
    const ref = `refs/heads/${branch}`;
    const existingRef = spawnGit(["rev-parse", "--verify", ref]);
    let commit: string;
    if (existingRef.status === 0) {
      commit = existingRef.stdout.trim();
      const anchoredBytes = execFileSync("git", ["show", `${commit}:${relativeGenesis}`], {
        stdio: ["ignore", "pipe", "pipe"],
      });
      if (sha256Hex(anchoredBytes) !== sha256Hex(bytes))
        throw new Error("[FAIL anchor_conflict] branch does not contain this exact genesis");
    } else {
      // Construct a genesis-only tree. No git switch, git add, shared index, or
      // inherited staged files: the user's branch and index remain untouched.
      let oid = git(["hash-object", "-w", "--stdin"], bytes);
      let kind = "blob";
      for (const name of relativeGenesis.split("/").reverse()) {
        oid = git(["mktree"], `${kind === "blob" ? "100644" : "040000"} ${kind} ${oid}\t${name}\n`);
        kind = "tree";
      }
      commit = git([
        "commit-tree",
        oid,
        "-p",
        "HEAD",
        "-m",
        `chore(council): anchor ${manifest.run_id}`,
      ]);
      git(["update-ref", ref, commit, ""]);
    }
    if (!args.noPush) {
      // Use the checked URL, not a remote's potentially different pushurl. Clear
      // inherited global AND host-scoped helpers before selecting the same file.
      git(
        [...machineGitArgs(), "push", "--porcelain", remoteUrl!, `${commit}:${ref}`],
        undefined,
        machineEnv
      );
      const remoteRef = git(
        [...machineGitArgs(), "ls-remote", "--heads", remoteUrl!, ref],
        undefined,
        machineEnv
      ).split(/\s+/)[0];
      if (remoteRef !== commit)
        throw new Error(
          "[FAIL anchor_readback] remote anchor differs; no successful receipt written"
        );
    }
    let receipt = {
      commit,
      branch,
      remote: args.remote,
      status: args.noPush ? "local-only" : "pushed",
      genesis_sha256: sha256Hex(bytes),
    };
    const receiptPath = path.join(verificationDir, "anchor-receipt.json");
    if (args.noPush && fs.existsSync(receiptPath)) {
      const previous = JSON.parse(fs.readFileSync(receiptPath, "utf8"));
      if (
        previous.commit === commit &&
        previous.branch === branch &&
        previous.remote === args.remote &&
        previous.genesis_sha256 === receipt.genesis_sha256 &&
        previous.status === "pushed"
      )
        receipt = previous;
    }
    fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + "\n");
    console.error(
      `Anchored ${manifest.run_id} on ${branch} (${receipt.status}). Branch/index unchanged.`
    );
    return 0;
  } catch (error) {
    // Git errors may carry authentication diagnostics. Never serialize child
    // stdout/stderr or a raw remote URL into a run artifact.
    console.error(
      error instanceof Error && error.message.startsWith("[FAIL ")
        ? error.message
        : "[FAIL run_start] setup or anchor failed; local state is retained for a checked retry"
    );
    return 1;
  }
}

function spawnGit(args: string[]) {
  return spawnSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main().then((code) => process.exit(code));

// Adopted from pfi-collaboration@534475088647785db22308db756a52b1dea5c761:scripts/lib/verifier-pins.ts
// 2026-09-07, scaffold#524: Node-native TypeScript imports; see docs/planning/council-toolchain-524.md.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { managedBanner } from "../../seed/corpus/banner.mjs";

/**
 * A single pin entry. Schema 2.0.0 carries accountability metadata
 * alongside the content hash so that every re-pin documents itself.
 *
 * The legacy 1.x form (a bare sha256 string) is still accepted on read
 * for backward-compatible diffing against an older committed manifest,
 * but new manifests MUST use the structured form.
 */
export interface PinEntry {
  /** SHA-256 of canonical bytes; only the exact seeded agent banner is normalized. */
  sha: string;
  /** Why this sha was last set. Required when the sha changes. */
  repin_reason: string;
  /** ISO-8601 UTC timestamp of when this sha was last set/confirmed. */
  repinned_at: string;
  /** Optional actor that performed the re-pin (login, agent id, etc.). */
  repinned_by?: string;
}

export type RawPinValue = string | PinEntry;

export interface VerifierPinsFile {
  schema_version: string;
  created_at: string;
  pins: Record<string, RawPinValue>;
}

export interface PinFinding {
  code: string;
  path: string;
  message: string;
}

// An empty/partial pin map is not verification. Keep this closure explicit and tested.
export const REQUIRED_PINS = [
  "scripts/council-invoke.ts",
  "scripts/council-run-start.ts",
  "scripts/build-council-prompt.ts",
  "scripts/lint-council-run.ts",
  "scripts/verify-chain.ts",
  "scripts/verify-seals.ts",
  "scripts/write-step-seal.ts",
  "scripts/council-run-summary.ts",
  "scripts/verify-pins.ts",
  "scripts/check-stale-blob-drift.ts",
  "scripts/lint-council-seat-efforts.ts",
  "scripts/lib/council-verification.ts",
  "scripts/lib/verifier-pins.ts",
  "scripts/lib/council-roster.ts",
  "scripts/lib/council-run-preflight.ts",
  "council-seat-efforts.json",
  "scripts/forge-write-status.mjs",
  "scripts/owner-queue-lint.mjs",
  ".claude/agents/council-member-claude.agent.md",
  ".claude/agents/council-member-gemini.agent.md",
  ".claude/agents/council-member-gpt.agent.md",
  ".claude/agents/council-member-kimi.agent.md",
  ".claude/agents/council-member-mistral.agent.md",
  ".claude/agents/council-member-muse.agent.md",
  ".claude/agents/council-member-grok.agent.md",
  ".claude/agents/council-member-deepseek.agent.md",
  "seed/corpus/banner.mjs",
] as const;

export function sha256File(filePath: string, repoRoot?: string): string {
  let bytes = fs.readFileSync(filePath);
  const relative = repoRoot ? path.relative(repoRoot, filePath).split(path.sep).join("/") : "";
  // The seeder inserts this exact, versioned banner after agent frontmatter.
  // Normalize ONLY that generated header, using the pinned canonical renderer;
  // executable/JSON bytes and all agent body text remain strictly hash checked.
  if (/^\.claude\/agents\/council-member-[a-z]+\.agent\.md$/.test(relative)) {
    const text = bytes.toString("utf8");
    const offset = /^---\r?\n[\s\S]*?\r?\n---\r?\n/.exec(text)?.[0].length ?? 0;
    if (text.slice(offset).startsWith("<!-- MANAGED BY SCAFFOLD")) {
      const manifest = JSON.parse(
        fs.readFileSync(path.join(repoRoot!, "seed/corpus/manifest.json"), "utf8")
      );
      if (
        typeof manifest.corpusVersion !== "string" ||
        !/^\d+\.\d+\.\d+$/.test(manifest.corpusVersion)
      )
        throw new Error("[FAIL verifier_corpus_version] invalid banner version");
      const banner = managedBanner(manifest.corpusVersion);
      if (text.slice(offset).startsWith(banner))
        bytes = Buffer.from(text.slice(0, offset) + text.slice(offset + banner.length));
    }
  }
  return createHash("sha256").update(bytes).digest("hex");
}

/** Extract the sha256 from either the legacy string form or the structured form. */
export function pinSha(value: RawPinValue): string {
  return typeof value === "string" ? value : value.sha;
}

/** True if a pin value is in the structured (schema 2.0.0) form. */
export function isStructuredPin(value: RawPinValue): value is PinEntry {
  return typeof value === "object" && value !== null && typeof (value as PinEntry).sha === "string";
}

export function readVerifierPins(repoRoot = process.cwd()): VerifierPinsFile {
  const pinsPath = path.join(repoRoot, "verifier-pins.json");
  const parsed = JSON.parse(fs.readFileSync(pinsPath, "utf8")) as VerifierPinsFile;
  if (
    !parsed ||
    typeof parsed !== "object" ||
    parsed.schema_version !== "council-verifier-pins@2.0.0" ||
    !parsed.pins ||
    typeof parsed.pins !== "object" ||
    Array.isArray(parsed.pins)
  ) {
    throw new Error(`[FAIL verifier_pins_schema_invalid] ${pinsPath}: pins object is required`);
  }
  for (const required of REQUIRED_PINS) {
    if (!(required in parsed.pins))
      throw new Error(`[FAIL verifier_pin_missing] ${required} must be pinned`);
  }
  for (const [relativePath, value] of Object.entries(parsed.pins)) {
    if (
      path.isAbsolute(relativePath) ||
      relativePath.includes("\\") ||
      relativePath.split("/").some((part) => !part || part === "." || part === "..")
    )
      throw new Error("[FAIL verifier_pins_schema_invalid] pin path escapes the repository");
    if (
      !isStructuredPin(value) ||
      !/^[a-f0-9]{64}$/.test(value.sha) ||
      typeof value.repin_reason !== "string" ||
      !value.repin_reason.trim() ||
      typeof value.repinned_at !== "string" ||
      !Number.isFinite(Date.parse(value.repinned_at))
    )
      throw new Error(
        `[FAIL verifier_pins_schema_invalid] ${relativePath} requires a sha, reason, and timestamp`
      );
  }
  return parsed;
}

/**
 * Byte-integrity check: executable/JSON bytes hash verbatim; seeded agent
 * Markdown removes only its exact generated header before hashing.
 */
export function verifyPinnedFiles(repoRoot = process.cwd()): PinFinding[] {
  const pins = readVerifierPins(repoRoot);
  const findings: PinFinding[] = [];

  for (const [relativePath, value] of Object.entries(pins.pins)) {
    const expected = pinSha(value);
    const targetPath = path.join(repoRoot, relativePath);
    if (!fs.existsSync(targetPath)) {
      findings.push({
        code: "verifier_pin_missing_target",
        path: relativePath,
        message: `${relativePath} does not exist`,
      });
      continue;
    }
    const actual = sha256File(targetPath, repoRoot);
    if (actual !== expected) {
      findings.push({
        code: "verifier_pin_mismatch",
        path: relativePath,
        message: `${relativePath} expected ${expected}, actual ${actual}`,
      });
    }
  }

  return findings;
}

/** Read the manifest as committed at a git ref (e.g. HEAD). Returns null if absent. */
function readVerifierPinsAtRef(repoRoot: string, ref: string): VerifierPinsFile | null {
  const git = (args: string[]) => {
    const result = spawnSync("git", args, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (result.error)
      throw new Error(
        "[FAIL verifier_pin_baseline] cannot execute git; accountability was not checked"
      );
    return result;
  };
  if (git(["rev-parse", "--git-dir"]).status !== 0)
    throw new Error("[FAIL verifier_pin_baseline] run from a git repository");
  const revision = git(["rev-parse", "--verify", "--quiet", "--end-of-options", `${ref}^{commit}`]);
  if (ref === "HEAD" && revision.status === 1) return null; // newly initialized consumer, no first commit yet
  if (revision.status !== 0)
    throw new Error("[FAIL verifier_pin_baseline] review base is unavailable");
  const commit = revision.stdout.trim();
  const tree = git(["ls-tree", "--name-only", commit, "--", "verifier-pins.json"]);
  if (tree.status !== 0)
    throw new Error("[FAIL verifier_pin_baseline] cannot inspect the review base");
  if (!tree.stdout.trim()) return null; // genuinely new manifest, not a swallowed git error
  const raw = git(["show", `${commit}:verifier-pins.json`]);
  if (raw.status !== 0)
    throw new Error("[FAIL verifier_pin_baseline] cannot read the existing pin manifest");
  const parsed = JSON.parse(raw.stdout) as VerifierPinsFile;
  if (!parsed || !parsed.pins || typeof parsed.pins !== "object" || Array.isArray(parsed.pins))
    throw new Error("[FAIL verifier_pin_baseline] committed pin manifest is malformed");
  return parsed;
}

/**
 * Accountability check (Wall #1, closes Gap 1 — silent re-pin).
 *
 * Compares the working-tree manifest against the manifest as committed
 * at `baseRef` (default HEAD). For every pin whose sha CHANGED — or any
 * brand-new pin — the structured form is mandatory and `repin_reason`
 * must be non-empty AND `repinned_at` must differ from the base manifest
 * (i.e. the re-pin documented itself in the same change).
 *
 * This converts a silent "edit a pinned script + re-hash the manifest"
 * motion into a self-documenting, review-visible event. A writer can no
 * longer move a pin without leaving a rationale in the same diff.
 *
 * If the manifest did not exist at `baseRef`, every pin is treated as
 * new and must carry a non-empty reason.
 */
export function verifyPinAccountability(repoRoot = process.cwd(), baseRef = "HEAD"): PinFinding[] {
  const findings: PinFinding[] = [];
  const current = readVerifierPins(repoRoot);
  const base = readVerifierPinsAtRef(repoRoot, baseRef);

  for (const [relativePath, value] of Object.entries(current.pins)) {
    const baseValue = base?.pins?.[relativePath];
    const shaChanged = baseValue === undefined || pinSha(baseValue) !== pinSha(value);
    if (!shaChanged) continue;

    // The sha moved (or this is a new pin). Demand structured accountability.
    if (!isStructuredPin(value)) {
      findings.push({
        code: "verifier_pin_unaccountable_repin",
        path: relativePath,
        message: `${relativePath} sha changed but the pin is a bare string with no repin_reason / repinned_at. Use the structured pin form { sha, repin_reason, repinned_at }.`,
      });
      continue;
    }

    const reason = value.repin_reason?.trim() ?? "";
    if (reason.length === 0) {
      findings.push({
        code: "verifier_pin_missing_reason",
        path: relativePath,
        message: `${relativePath} sha changed but repin_reason is empty. Every pin sha change must document why.`,
      });
    }

    const repinnedAt = value.repinned_at?.trim() ?? "";
    if (repinnedAt.length === 0) {
      findings.push({
        code: "verifier_pin_missing_repinned_at",
        path: relativePath,
        message: `${relativePath} sha changed but repinned_at is empty. Set it to the ISO-8601 UTC time of the re-pin.`,
      });
    } else if (
      baseValue !== undefined &&
      isStructuredPin(baseValue) &&
      baseValue.repinned_at === repinnedAt
    ) {
      findings.push({
        code: "verifier_pin_stale_repinned_at",
        path: relativePath,
        message: `${relativePath} sha changed but repinned_at is unchanged from ${baseRef}. A new sha requires a fresh repinned_at timestamp.`,
      });
    }
  }

  return findings;
}

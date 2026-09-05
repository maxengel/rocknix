import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * A single pin entry. Schema 2.0.0 carries accountability metadata
 * alongside the content hash so that every re-pin documents itself.
 *
 * The legacy 1.x form (a bare sha256 string) is still accepted on read
 * for backward-compatible diffing against an older committed manifest,
 * but new manifests MUST use the structured form.
 */
export interface PinEntry {
  /** sha256 (hex) of the pinned file's raw bytes. */
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

export function sha256File(filePath: string): string {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
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
  const pinsPath = path.join(repoRoot, "tools/council/verifier-pins.json");
  const parsed = JSON.parse(fs.readFileSync(pinsPath, "utf8")) as VerifierPinsFile;
  if (!parsed || typeof parsed !== "object" || typeof parsed.pins !== "object") {
    throw new Error(`[FAIL verifier_pins_schema_invalid] ${pinsPath}: pins object is required`);
  }
  return parsed;
}

/**
 * Byte-integrity check: every pinned file's current bytes must hash to
 * its pinned sha256. This is the original Gate-1 protection.
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
    const actual = sha256File(targetPath);
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
  try {
    const raw = execFileSync("git", ["show", `${ref}:tools/council/verifier-pins.json`], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const parsed = JSON.parse(raw) as VerifierPinsFile;
    if (!parsed || typeof parsed.pins !== "object") return null;
    return parsed;
  } catch {
    // File did not exist at ref, or not a git repo / ref unknown.
    return null;
  }
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

import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

export const MANIFEST_NAME = "council-run-manifest.json";
export const LEDGER_NAME = "ledger.jsonl";
export const GENESIS_PATH = path.join("verification", "genesis.json");

export interface ExpectedOutput {
  path: string;
  member: string;
  kind: string;
}

export interface CouncilRunManifest {
  run_id: string;
  topic?: string;
  roster: string[];
  provenance_contract?: string;
  expected_outputs_per_step: Partial<Record<string, ExpectedOutput[]>>;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalize(value[key])])
  );
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function sha256Hex(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

export function canonicalSha256(value: unknown): string {
  return sha256Hex(canonicalJson(value));
}

export function readJsonFile(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function readManifest(runDir: string): CouncilRunManifest {
  const data = readJsonFile(path.join(runDir, MANIFEST_NAME));
  if (!isRecord(data)) {
    throw new Error(`[FAIL manifest_schema_mismatch] ${MANIFEST_NAME} must be a JSON object`);
  }
  if (typeof data.run_id !== "string" || !Array.isArray(data.roster)) {
    throw new Error(`[FAIL manifest_schema_mismatch] ${MANIFEST_NAME} missing run_id or roster`);
  }
  if (!isRecord(data.expected_outputs_per_step)) {
    throw new Error(
      `[FAIL manifest_schema_mismatch] ${MANIFEST_NAME} missing expected_outputs_per_step`
    );
  }
  return data as unknown as CouncilRunManifest;
}

export function findCouncilRunDir(startPath: string): string | null {
  let current = fs.existsSync(startPath)
    ? fs.statSync(startPath).isDirectory()
      ? startPath
      : path.dirname(startPath)
    : path.dirname(startPath);
  while (true) {
    if (fs.existsSync(path.join(current, MANIFEST_NAME))) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

export function readLedger(runDir: string): unknown[] {
  const ledgerPath = path.join(runDir, LEDGER_NAME);
  if (!fs.existsSync(ledgerPath)) return [];
  return fs
    .readFileSync(ledgerPath, "utf8")
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}

export function genesisSha256(runDir: string): string | null {
  const genesisPath = path.join(runDir, GENESIS_PATH);
  if (!fs.existsSync(genesisPath)) return null;
  return sha256Hex(fs.readFileSync(genesisPath));
}

export function stepKeysThrough(step: string): string[] {
  const order = ["step1", "step2", "step3", "step4", "step4_5"];
  const index = order.indexOf(step);
  return index === -1 ? [] : order.slice(0, index + 1);
}

export function expectedVerdictCount(manifest: CouncilRunManifest, throughStep: string): number {
  return stepKeysThrough(throughStep).reduce((sum, step) => {
    const outputs = manifest.expected_outputs_per_step[step];
    return sum + (Array.isArray(outputs) ? outputs.length : 0);
  }, 0);
}

export function expectedArtifactPathsThrough(
  runDir: string,
  manifest: CouncilRunManifest,
  throughStep: string
): string[] {
  const repoRoot = process.cwd();
  return stepKeysThrough(throughStep).flatMap((step) => {
    const outputs = manifest.expected_outputs_per_step[step];
    if (!Array.isArray(outputs)) return [];
    return outputs.map((output) =>
      path.relative(repoRoot, path.resolve(runDir, output.path)).split(path.sep).join("/")
    );
  });
}

export function completedVerdictCount(
  runDir: string,
  manifest: CouncilRunManifest,
  throughStep: string,
  ledger: unknown[]
): number | null {
  const expectedPaths = expectedArtifactPathsThrough(runDir, manifest, throughStep);
  if (expectedPaths.length === 0) return null;

  let terminalIndex = 0;
  for (const artifactPath of expectedPaths) {
    let latestIndex = -1;
    let latestOutcome: unknown = null;
    for (let index = 0; index < ledger.length; index += 1) {
      const entry = ledger[index];
      if (!isRecord(entry) || entry.artifact_path !== artifactPath) continue;
      latestIndex = index;
      latestOutcome = isRecord(entry.final) ? entry.final.outcome : null;
    }
    if (latestIndex === -1 || latestOutcome !== "success") return null;
    terminalIndex = Math.max(terminalIndex, latestIndex + 1);
  }

  return terminalIndex;
}

export function isLegacyManifest(manifest: CouncilRunManifest): boolean {
  return (
    typeof manifest.provenance_contract === "string" &&
    manifest.provenance_contract.startsWith("legacy-")
  );
}

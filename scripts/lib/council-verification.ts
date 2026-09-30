// Adopted from pfi-collaboration@534475088647785db22308db756a52b1dea5c761:scripts/lib/council-verification.ts
// 2026-09-07, scaffold#524: Node-native TypeScript imports; see docs/planning/council-toolchain-524.md.
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const COUNCIL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
// Every member id a verified run may name, historical ones included: Mistral still appears in
// runs sealed before scaffold#915. Which ids a new run requires is its profile's business.
const MEMBER_IDS = ["claude", "gemini", "gpt", "kimi", "muse", "grok", "deepseek", "mistral"];

export const MANIFEST_NAME = "council-run-manifest.json";
export const LEDGER_NAME = "ledger.jsonl";
export const GENESIS_PATH = "verification/genesis.json";

export interface ExpectedOutput {
  path: string;
  member: string;
  kind: string;
}

export interface CouncilRunManifest extends Record<string, unknown> {
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

/** Product research Phase 4 keeps its namespaced run id and historical scan boundary. */
export function councilRunScope(runDir: string, root = COUNCIL_ROOT) {
  const relative = path.relative(path.join(root, "research/council-research"), path.resolve(runDir));
  const parts = relative.split(path.sep);
  const nested = parts.length === 2 && /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(parts[0]) &&
    /^phase-4-deliberation(?:-r\d+-\d{3})?$/.test(parts[1]);
  let legacy = false;
  if (nested) {
    const setup = path.join(path.dirname(runDir), ".setup.json");
    let version: string | undefined;
    if (fs.existsSync(setup)) {
      const value = readJsonFile(setup);
      if (!isRecord(value)) throw new Error("[FAIL research_setup_invalid] setup must be an object");
      // Historical setups name the method without a version; retain the date fallback for that exact label.
      const declared = value.methodology_version ??
        (typeof value.methodology === "string" && value.methodology !== "council-research"
          ? value.methodology.replace(/^council-research@/, "") : undefined);
      if (declared !== undefined) {
        if (typeof declared !== "string" || !/^\d+\.\d+\.\d+$/.test(declared))
          throw new Error("[FAIL research_setup_invalid] malformed methodology version");
        version = declared;
      }
    }
    if (version) {
      const [major, minor] = version.split(".").map(Number);
      legacy = major < 1 || (major === 1 && minor < 10);
    } else {
      const date = /^(\d{4}-\d{2}-\d{2})/.exec(parts[0])?.[1];
      legacy = date !== undefined && date < "2026-09-07";
    }
  }
  const runId = nested ? parts.join("/") : path.basename(path.resolve(runDir));
  return { nested, legacy, runId };
}

export function readManifest(runDir: string): CouncilRunManifest {
  const data = readJsonFile(resolveRunArtifact(runDir, MANIFEST_NAME));
  const scope = councilRunScope(runDir);
  if (!isRecord(data)) {
    throw new Error(`[FAIL manifest_schema_mismatch] ${MANIFEST_NAME} must be a JSON object`);
  }
  if (
    typeof data.run_id !== "string" ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._-]*(?:\/[a-zA-Z0-9][a-zA-Z0-9._-]*)?$/.test(data.run_id) ||
    !(data.run_id === scope.runId ||
      (scope.legacy && data.run_id === path.basename(path.resolve(runDir)))) ||
    !Array.isArray(data.roster) ||
    data.roster.length < 3 ||
    data.roster.length > 5 ||
    new Set(data.roster).size !== data.roster.length ||
    data.roster.some((id) => !MEMBER_IDS.includes(id))
  ) {
    throw new Error(`[FAIL manifest_schema_mismatch] ${MANIFEST_NAME} missing run_id or roster`);
  }
  if (!isRecord(data.expected_outputs_per_step)) {
    throw new Error(
      `[FAIL manifest_schema_mismatch] ${MANIFEST_NAME} missing expected_outputs_per_step`
    );
  }
  const seen = new Set<string>();
  let rounds: number | undefined;
  for (const step of ["step1", "step2", "step3", "step4", "step4_5"]) {
    const outputs = data.expected_outputs_per_step[step];
    if (step === "step4_5" && outputs === undefined) continue;
    if (
      !Array.isArray(outputs) ||
      outputs.length === 0 ||
      (step === "step4_5" ? outputs.length !== 1 : outputs.length % data.roster.length !== 0)
    )
      throw new Error(
        `[FAIL manifest_schema_mismatch] ${step} must declare its complete member set`
      );
    const members = new Map<number, Set<string>>();
    for (const output of outputs) {
      if (
        !isRecord(output) ||
        typeof output.path !== "string" ||
        typeof output.member !== "string" ||
        typeof output.kind !== "string" ||
        !output.kind ||
        !data.roster.includes(output.member) ||
        !output.path.endsWith(".md") ||
        seen.has(output.path)
      )
        throw new Error(
          `[FAIL manifest_schema_mismatch] ${step} has an invalid or duplicate output/member`
        );
      resolveRunArtifact(runDir, output.path);
      const round = outputRound(output.path);
      if (round > 5 || ((step === "step1" || step === "step4_5") && round !== 1))
        throw new Error(
          "[FAIL manifest_schema_mismatch] only Steps 2–4 recur, at most five rounds"
        );
      const group = members.get(round) ?? new Set<string>();
      if (group.has(output.member))
        throw new Error(
          `[FAIL manifest_schema_mismatch] ${step} repeats a member in round ${round}`
        );
      group.add(output.member);
      members.set(round, group);
      seen.add(output.path);
    }
    for (let round = 1; round <= members.size; round += 1) {
      if (members.get(round)?.size !== (step === "step4_5" ? 1 : data.roster.length))
        throw new Error(
          `[FAIL manifest_schema_mismatch] ${step} round ${round} has a missing member or skipped round`
        );
    }
    if (["step2", "step3", "step4"].includes(step)) {
      if (rounds !== undefined && rounds !== members.size)
        throw new Error(
          "[FAIL manifest_schema_mismatch] declare a complete Steps 2–4 set before each recursion round"
        );
      rounds = members.size;
    }
  }
  if (
    Object.keys(data.expected_outputs_per_step).some(
      (key) => !["step1", "step2", "step3", "step4", "step4_5"].includes(key)
    )
  )
    throw new Error("[FAIL manifest_schema_mismatch] unknown step key");
  return data as unknown as CouncilRunManifest;
}

/** Resolve a declared artifact without allowing traversal or symlink escapes. */
export function resolveRunArtifact(runDir: string, artifact: string): string {
  if (
    !artifact ||
    path.isAbsolute(artifact) ||
    artifact.includes("\\") ||
    artifact.split("/").some((part) => !part || part === "." || part === "..")
  )
    throw new Error(`[FAIL path_escape] invalid run-relative artifact: ${artifact}`);
  let current = path.resolve(runDir);
  if (fs.existsSync(current) && fs.realpathSync(current) !== current)
    throw new Error("[FAIL path_escape] run directory must not traverse a symlink");
  for (const part of artifact.split("/")) {
    current = path.join(current, part);
    if (fs.lstatSync(current, { throwIfNoEntry: false })?.isSymbolicLink())
      throw new Error(`[FAIL path_escape] symlink artifact: ${artifact}`);
  }
  return current;
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
  const ledgerPath = resolveRunArtifact(runDir, LEDGER_NAME);
  if (!fs.existsSync(ledgerPath)) return [];
  return fs
    .readFileSync(ledgerPath, "utf8")
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}

export function genesisSha256(runDir: string): string | null {
  const genesisPath = resolveRunArtifact(runDir, GENESIS_PATH);
  if (!fs.existsSync(genesisPath)) return null;
  return sha256Hex(fs.readFileSync(genesisPath));
}

export function outputRound(artifact: string): number {
  const suffix = /-r(\d+)\.md$/.exec(artifact);
  if (suffix && !/^[2-5]$/.test(suffix[1]))
    throw new Error("[FAIL round_invalid] recursion filenames use -r2 through -r5");
  return suffix ? Number(suffix[1]) : 1;
}

export function stepKey(step: string | number, round = 1): string {
  const base = String(step).replace(/^step/, "");
  if (
    !["1", "2", "3", "4", "4_5"].includes(base) ||
    !Number.isInteger(round) ||
    round < 1 ||
    round > 5 ||
    ((base === "1" || base === "4_5") && round !== 1)
  )
    throw new Error("[FAIL step_invalid] use Steps 1–4 (rounds 2–5 only for Steps 2–4) or 4_5");
  return `step${base}${round === 1 ? "" : `-r${round}`}`;
}

export function outputsForStep(manifest: CouncilRunManifest, step: string): ExpectedOutput[] {
  const [base, suffix] = step.split("-r");
  const round = suffix === undefined ? 1 : Number(suffix);
  if (stepKey(base, round) !== step) throw new Error("[FAIL step_invalid] invalid step key");
  return (manifest.expected_outputs_per_step[base] ?? []).filter(
    (output) => outputRound(output.path) === round
  );
}

export function orderedSteps(manifest: CouncilRunManifest): string[] {
  const rounds = Math.max(
    1,
    ...(manifest.expected_outputs_per_step.step2 ?? []).map((output) => outputRound(output.path))
  );
  return [
    "step1",
    ...Array.from({ length: rounds }, (_, index) =>
      [2, 3, 4].map((step) => stepKey(step, index + 1))
    ).flat(),
    ...(manifest.expected_outputs_per_step.step4_5 ? ["step4_5"] : []),
  ];
}

export function stepKeysThrough(manifest: CouncilRunManifest, step: string): string[] {
  const order = orderedSteps(manifest);
  const index = order.indexOf(step);
  if (index === -1) throw new Error(`[FAIL step_invalid] ${step} is not declared in this run`);
  return order.slice(0, index + 1);
}

export function expectedVerdictCount(manifest: CouncilRunManifest, throughStep: string): number {
  return stepKeysThrough(manifest, throughStep).reduce(
    (sum, step) => sum + outputsForStep(manifest, step).length,
    0
  );
}

export function expectedArtifactPathsThrough(
  runDir: string,
  manifest: CouncilRunManifest,
  throughStep: string
): string[] {
  const repoRoot = process.cwd();
  return stepKeysThrough(manifest, throughStep).flatMap((step) => {
    const outputs = outputsForStep(manifest, step);
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

/** Contracts sealed before the current Facilitator. A run is historical by the contract it carries, never by
 *  the calendar: a date cutoff refused a 1.3.1 run set up on the cutoff's own day (scaffold#944). The `legacy-`
 *  contracts keep their own path (isLegacyManifest). */
export const HISTORICAL_CONTRACTS: ReadonlySet<string> = new Set([
  "council-facilitator@1.2.0", "council-facilitator@1.3.1",
  "legacy-council-facilitator@2026-05-22", "legacy-aborted-unanchored",
]);
/** Keys only a newer contract writes. A historical manifest carrying one claims two contracts at once. */
const NEWER_CONTRACT_KEYS = ["roster_contract", "coordinator", "council_profile", "experiment"] as const;

/** A run sealed under a historical (non-legacy) Facilitator contract, whatever its date. It is verified against
 *  its own evidence (ledger, provenance and seals carrying that contract), never the installed roster (#944). */
export function isHistoricalManifest(manifest: CouncilRunManifest): boolean {
  const contract = manifest.provenance_contract;
  return typeof contract === "string" && HISTORICAL_CONTRACTS.has(contract) && !contract.startsWith("legacy-") &&
    !NEWER_CONTRACT_KEYS.some((key) => key in manifest);
}

/** Why a manifest that names a historical contract but carries a newer contract's keys is malformed, or null.
 *  It is its own finding class, never routed to current admission as council_roster_invalid (#944). */
export function historicalMixedContract(manifest: CouncilRunManifest): string | null {
  const contract = manifest.provenance_contract;
  if (typeof contract !== "string" || !HISTORICAL_CONTRACTS.has(contract)) return null;
  const newer = NEWER_CONTRACT_KEYS.filter((key) => key in manifest);
  return newer.length
    ? `provenance_contract ${contract} is historical, but the manifest also carries ${newer.join(", ")}, which only a newer contract writes`
    : null;
}

/** Compare the anchored run identity with the installed, reviewed configuration. */
export function assertGenesis(
  runDir: string,
  manifest: CouncilRunManifest,
  root = COUNCIL_ROOT
): Record<string, unknown> {
  const genesis = readJsonFile(resolveRunArtifact(runDir, GENESIS_PATH));
  const expected = {
    run_id: manifest.run_id,
    roster_hash: canonicalSha256(manifest.roster),
    roster_contract: manifest.roster_contract,
    coordinator: manifest.coordinator,
    council_profile: manifest.council_profile ?? "definitive",
    experiment: manifest.experiment ?? null,
    verifier_pins_hash: sha256Hex(fs.readFileSync(path.join(root, "verifier-pins.json"))),
    facilitator_version: manifest.provenance_contract,
    anchor_branch: `verification-anchors/${manifest.run_id}`,
  };
  if (
    !isRecord(genesis) ||
    Object.entries(expected).some(
      ([key, value]) => canonicalJson(genesis[key]) !== canonicalJson(value)
    ) ||
    typeof genesis.seal_hmac_key_sha256 !== "string" ||
    !/^[a-f0-9]{64}$/.test(genesis.seal_hmac_key_sha256)
  )
    throw new Error(
      "[FAIL genesis_binding_mismatch] run identity, coordinator, or verifier pins changed"
    );
  return genesis;
}

export function readSealKey(runDir: string): string {
  const keyPath = resolveRunArtifact(runDir, "verification/seal-key.local");
  let key = process.env.COUNCIL_SEAL_HMAC_KEY;
  if (!key && fs.existsSync(keyPath)) {
    if ((fs.statSync(keyPath).mode & 0o077) !== 0)
      throw new Error("[FAIL seal_key_permissions] local key must be owner-only");
    key = fs.readFileSync(keyPath, "utf8").trim();
  }
  if (!key || !/^[a-f0-9]{64}$/i.test(key))
    throw new Error("[FAIL seal_key_missing] supply the run's 32-byte hexadecimal HMAC key");
  const genesis = readJsonFile(resolveRunArtifact(runDir, GENESIS_PATH));
  if (!isRecord(genesis) || genesis.seal_hmac_key_sha256 !== sha256Hex(key))
    throw new Error("[FAIL seal_key_mismatch] HMAC key differs from the anchored run key");
  return key;
}

export const ASSURANCE_RANK: Record<string, number> = {
  client_telemetry: 0,
  local_capture_provider_attested: 1,
  corroborated: 2,
  provider_signed: 3,
};
export function minimumAssurance(entries: unknown[]): string | null {
  let minimum: string | null = null;
  for (const entry of entries) {
    const tier = isRecord(entry) && isRecord(entry.final) ? entry.final.assurance_tier : null;
    if (typeof tier !== "string" || !Object.hasOwn(ASSURANCE_RANK, tier)) return null;
    if (minimum === null || ASSURANCE_RANK[tier] < ASSURANCE_RANK[minimum]) minimum = tier;
  }
  return minimum;
}

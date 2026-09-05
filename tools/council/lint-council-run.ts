#!/usr/bin/env npx tsx
/**
 * Council Run Completeness Lint (M64.P1.5 E7/H1 #2973)
 *
 * Verifies standalone council-skill run directories under
 * research/council-runs/** against their council-run-manifest.json inventory.
 * The manifest is the authority for expected outputs; directory contents are
 * audited against it instead of inferred as truth.
 */

import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, "../..") /* rocknix: this file lives in tools/council/, two below the repo root */;
const COUNCIL_RUNS_DIR = path.join(REPO_ROOT, "research", "council-runs");
const MANIFEST_NAME = "council-run-manifest.json";
const CURRENT_PROVENANCE_CONTRACT = "council-facilitator@1.2.0";

type StepKey = "step1" | "step2" | "step3" | "step4" | "step4_5";

type FindingKind =
  | "manifest-missing"
  | "manifest-parse-error"
  | "manifest-schema-mismatch"
  | "path-escape"
  | "output-missing"
  | "provenance-missing"
  | "provenance-parse-error"
  | "provenance-contract-mismatch"
  | "member-mismatch"
  | "file-modified-post-write"
  | "seal-missing"
  | "unexpected-output"
  | "unexpected-provenance";

interface Finding {
  run: string;
  file: string;
  kind: FindingKind;
  message: string;
  expected?: string;
  actual?: string;
}

interface ExpectedOutput {
  path: string;
  member: string;
  kind: string;
}

interface CouncilRunManifest {
  schema_version: string;
  run_id: string;
  created_at: string;
  topic: string;
  roster: string[];
  provenance_contract: string;
  expected_outputs_per_step: Partial<Record<StepKey, ExpectedOutput[]>>;
}

interface CliArgs {
  strict: boolean;
  json: boolean;
  full: boolean;
  atStep: number | null;
  positional: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUnderPath(child: string, parent: string): boolean {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function relativePath(absPath: string): string {
  return path.relative(REPO_ROOT, absPath);
}

function sha256File(absPath: string): string {
  return createHash("sha256").update(fs.readFileSync(absPath)).digest("hex");
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { strict: false, json: false, full: false, atStep: null, positional: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--strict") {
      args.strict = true;
    } else if (arg === "--json") {
      args.json = true;
    } else if (arg === "--full") {
      args.full = true;
    } else if (arg === "--at-step") {
      const value = argv[index + 1];
      if (!value) throw new Error("--at-step requires a numeric value 1-4");
      const parsed = Number.parseInt(value, 10);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 4) {
        throw new Error("--at-step requires a numeric value 1-4");
      }
      args.atStep = parsed;
      index += 1;
    } else if (arg.startsWith("--at-step=")) {
      const parsed = Number.parseInt(arg.slice("--at-step=".length), 10);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 4) {
        throw new Error("--at-step requires a numeric value 1-4");
      }
      args.atStep = parsed;
    } else if (arg.startsWith("--")) {
      throw new Error(`unknown flag: ${arg}`);
    } else {
      args.positional.push(arg);
    }
  }

  if (args.full && args.atStep !== null) {
    throw new Error("--full cannot be combined with --at-step");
  }

  return args;
}

function finding(runDir: string, file: string, kind: FindingKind, message: string): Finding {
  return { run: relativePath(runDir), file: relativePath(file), kind, message };
}

function resolveInsideRun(
  runDir: string,
  manifestPath: string,
  findings: Finding[]
): string | null {
  if (path.isAbsolute(manifestPath)) {
    findings.push({
      run: relativePath(runDir),
      file: manifestPath,
      kind: "path-escape",
      message: "manifest paths must be relative to the run directory",
    });
    return null;
  }

  const resolved = path.resolve(runDir, manifestPath);
  if (!isUnderPath(resolved, runDir)) {
    findings.push({
      run: relativePath(runDir),
      file: manifestPath,
      kind: "path-escape",
      message: "manifest path resolves outside the run directory",
    });
    return null;
  }

  return resolved;
}

function parseManifest(runDir: string): {
  manifest: CouncilRunManifest | null;
  findings: Finding[];
} {
  const manifestPath = path.join(runDir, MANIFEST_NAME);
  if (!fs.existsSync(manifestPath)) {
    return {
      manifest: null,
      findings: [
        finding(runDir, manifestPath, "manifest-missing", "missing council-run-manifest.json"),
      ],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (err) {
    return {
      manifest: null,
      findings: [
        finding(
          runDir,
          manifestPath,
          "manifest-parse-error",
          `cannot parse council-run-manifest.json: ${(err as Error).message}`
        ),
      ],
    };
  }

  const findings: Finding[] = [];
  if (!isRecord(parsed)) {
    findings.push(
      finding(runDir, manifestPath, "manifest-schema-mismatch", "manifest root must be an object")
    );
    return { manifest: null, findings };
  }

  const manifest = parsed as Partial<CouncilRunManifest>;
  const requiredStrings: Array<keyof CouncilRunManifest> = [
    "schema_version",
    "run_id",
    "created_at",
    "topic",
    "provenance_contract",
  ];
  for (const key of requiredStrings) {
    if (typeof manifest[key] !== "string") {
      findings.push(
        finding(runDir, manifestPath, "manifest-schema-mismatch", `${key} must be a string`)
      );
    }
  }

  if (
    !Array.isArray(manifest.roster) ||
    manifest.roster.some((member) => typeof member !== "string")
  ) {
    findings.push(
      finding(
        runDir,
        manifestPath,
        "manifest-schema-mismatch",
        "roster must be an array of strings"
      )
    );
  }

  if (!isRecord(manifest.expected_outputs_per_step)) {
    findings.push(
      finding(
        runDir,
        manifestPath,
        "manifest-schema-mismatch",
        "expected_outputs_per_step must be an object"
      )
    );
  }

  if (manifest.run_id && manifest.run_id !== path.basename(runDir)) {
    findings.push({
      run: relativePath(runDir),
      file: relativePath(manifestPath),
      kind: "manifest-schema-mismatch",
      message: "run_id must match the run directory basename",
      expected: path.basename(runDir),
      actual: manifest.run_id,
    });
  }

  if (findings.length > 0) return { manifest: null, findings };
  return { manifest: parsed as CouncilRunManifest, findings: [] };
}

function stepHasStarted(runDir: string, manifest: CouncilRunManifest, step: StepKey): boolean {
  const outputs = manifest.expected_outputs_per_step[step];
  if (!Array.isArray(outputs)) return false;
  return outputs.some((output) => {
    const absPath = path.resolve(runDir, output.path);
    return fs.existsSync(absPath) || fs.existsSync(`${absPath}.provenance.json`);
  });
}

function selectedSteps(
  runDir: string,
  manifest: CouncilRunManifest,
  atStep: number | null,
  full: boolean
): StepKey[] {
  const allSteps: StepKey[] = ["step1", "step2", "step3", "step4", "step4_5"];
  const selected = atStep === null || full ? allSteps : allSteps.slice(0, atStep);
  if (atStep === null && !full) {
    return selected.filter(
      (step) =>
        Array.isArray(manifest.expected_outputs_per_step[step]) &&
        stepHasStarted(runDir, manifest, step)
    );
  }
  return selected.filter((step) => Array.isArray(manifest.expected_outputs_per_step[step]));
}

function isLegacyContract(contract: string): boolean {
  return contract.includes("legacy") || contract.endsWith("@0.x");
}

function parseProvenance(
  runDir: string,
  provenancePath: string
): { data: Record<string, unknown> | null; findings: Finding[] } {
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(provenancePath, "utf8"));
    if (!isRecord(parsed)) {
      return {
        data: null,
        findings: [
          finding(
            runDir,
            provenancePath,
            "provenance-parse-error",
            "provenance root must be an object"
          ),
        ],
      };
    }
    return { data: parsed, findings: [] };
  } catch (err) {
    return {
      data: null,
      findings: [
        finding(
          runDir,
          provenancePath,
          "provenance-parse-error",
          `cannot parse provenance JSON: ${(err as Error).message}`
        ),
      ],
    };
  }
}

function validateProvenanceContract(params: {
  runDir: string;
  outputPath: string;
  provenancePath: string;
  expected: ExpectedOutput;
  manifest: CouncilRunManifest;
  provenance: Record<string, unknown>;
}): Finding[] {
  const { runDir, outputPath, provenancePath, expected, manifest, provenance } = params;
  const findings: Finding[] = [];
  const final = provenance.final;

  if (provenance.member !== expected.member) {
    findings.push({
      run: relativePath(runDir),
      file: relativePath(provenancePath),
      kind: "member-mismatch",
      message: "provenance member does not match manifest expected member",
      expected: expected.member,
      actual: typeof provenance.member === "string" ? provenance.member : String(provenance.member),
    });
  }

  const hasCoreShape =
    typeof provenance.member === "string" &&
    typeof provenance.substrate === "string" &&
    typeof provenance.endpoint === "string" &&
    Array.isArray(provenance.attempts) &&
    isRecord(final) &&
    isRecord(final.verification);

  if (!hasCoreShape) {
    findings.push(
      finding(
        runDir,
        provenancePath,
        "provenance-contract-mismatch",
        "provenance does not match the Council Facilitator core emission contract"
      )
    );
    return findings;
  }

  if (isLegacyContract(manifest.provenance_contract)) return findings;

  if (manifest.provenance_contract !== CURRENT_PROVENANCE_CONTRACT) {
    findings.push({
      run: relativePath(runDir),
      file: relativePath(path.join(runDir, MANIFEST_NAME)),
      kind: "manifest-schema-mismatch",
      message: "unknown provenance_contract",
      expected: CURRENT_PROVENANCE_CONTRACT,
      actual: manifest.provenance_contract,
    });
    return findings;
  }

  if (provenance.facilitator_version !== CURRENT_PROVENANCE_CONTRACT) {
    findings.push({
      run: relativePath(runDir),
      file: relativePath(provenancePath),
      kind: "provenance-contract-mismatch",
      message: "facilitator_version must match the manifest provenance_contract",
      expected: manifest.provenance_contract,
      actual:
        typeof provenance.facilitator_version === "string"
          ? provenance.facilitator_version
          : String(provenance.facilitator_version),
    });
  }

  const fileArtifactHash = final.file_artifact_sha256;
  if (typeof fileArtifactHash !== "string") {
    findings.push(
      finding(
        runDir,
        provenancePath,
        "provenance-contract-mismatch",
        "final.file_artifact_sha256 must be present for current Facilitator provenance"
      )
    );
  } else if (fs.existsSync(outputPath)) {
    const actualHash = sha256File(outputPath);
    if (actualHash !== fileArtifactHash) {
      findings.push({
        run: relativePath(runDir),
        file: relativePath(outputPath),
        kind: "file-modified-post-write",
        message: "output file SHA-256 does not match provenance.final.file_artifact_sha256",
        expected: fileArtifactHash,
        actual: actualHash,
      });
    }
  }

  return findings;
}

function lintExpectedOutput(params: {
  runDir: string;
  manifest: CouncilRunManifest;
  expected: ExpectedOutput;
  expectedOutputPaths: Set<string>;
  expectedProvenancePaths: Set<string>;
}): Finding[] {
  const findings: Finding[] = [];
  const outputPath = resolveInsideRun(params.runDir, params.expected.path, findings);
  if (outputPath === null) return findings;

  const provenancePath = `${outputPath}.provenance.json`;
  params.expectedOutputPaths.add(path.resolve(outputPath));
  params.expectedProvenancePaths.add(path.resolve(provenancePath));

  if (!fs.existsSync(outputPath)) {
    findings.push(
      finding(params.runDir, outputPath, "output-missing", "expected output file is missing")
    );
    return findings;
  }

  if (!fs.existsSync(provenancePath)) {
    findings.push(
      finding(
        params.runDir,
        provenancePath,
        "provenance-missing",
        "expected provenance sibling is missing"
      )
    );
    return findings;
  }

  const parsed = parseProvenance(params.runDir, provenancePath);
  findings.push(...parsed.findings);
  if (parsed.data === null) return findings;

  findings.push(
    ...validateProvenanceContract({
      runDir: params.runDir,
      outputPath,
      provenancePath,
      expected: params.expected,
      manifest: params.manifest,
      provenance: parsed.data,
    })
  );

  return findings;
}

function stepDirectoriesFor(step: StepKey): string[] {
  switch (step) {
    case "step1":
      return [""];
    case "step2":
      return ["peer_reviews"];
    case "step3":
      return ["revised_approaches"];
    case "step4":
      return ["peer_votes"];
    case "step4_5":
      return ["revised_approaches"];
  }
}

function isStepOutputCandidate(step: StepKey, fileName: string, roster: string[]): boolean {
  switch (step) {
    case "step1":
      return roster.some((member) => fileName === `${member}-analysis.md`);
    case "step2":
      return fileName.endsWith("_peer_review.md");
    case "step3":
      return fileName.endsWith("-revised_plan.md");
    case "step4":
      return fileName.endsWith("_vote.md");
    case "step4_5":
      return fileName === "consensus_plan.md";
  }
}

function isStepProvenanceCandidate(step: StepKey, fileName: string, roster: string[]): boolean {
  return isStepOutputCandidate(step, fileName.slice(0, -".provenance.json".length), roster);
}

function lintStepSeal(runDir: string, step: StepKey): Finding[] {
  const ledgerPath = path.join(runDir, "ledger.jsonl");
  if (!fs.existsSync(ledgerPath)) return [];
  const sealPath = path.join(runDir, "verification", "seals", `${step}.seal.json`);
  if (fs.existsSync(sealPath)) return [];
  return [
    finding(
      runDir,
      sealPath,
      "seal-missing",
      `${step} seal is required when ${path.relative(runDir, ledgerPath)} exists`
    ),
  ];
}

function scanUnexpectedFiles(params: {
  runDir: string;
  roster: string[];
  steps: StepKey[];
  expectedOutputPaths: Set<string>;
  expectedProvenancePaths: Set<string>;
}): Finding[] {
  const findings: Finding[] = [];

  for (const step of params.steps) {
    for (const relativeDir of stepDirectoriesFor(step)) {
      const dir = path.join(params.runDir, relativeDir);
      if (!fs.existsSync(dir)) continue;

      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.name.endsWith(".md.provenance.json")) {
          if (!isStepProvenanceCandidate(step, entry.name, params.roster)) continue;
          if (!params.expectedProvenancePaths.has(path.resolve(fullPath))) {
            findings.push(
              finding(
                params.runDir,
                fullPath,
                "unexpected-provenance",
                "provenance file is not declared in manifest"
              )
            );
          }
        } else if (entry.name.endsWith(".md")) {
          if (!isStepOutputCandidate(step, entry.name, params.roster)) continue;
          if (!params.expectedOutputPaths.has(path.resolve(fullPath))) {
            findings.push(
              finding(
                params.runDir,
                fullPath,
                "unexpected-output",
                "output file is not declared in manifest"
              )
            );
          }
        }
      }
    }
  }

  return findings;
}

function lintRun(runDir: string, atStep: number | null, full: boolean): Finding[] {
  const parsed = parseManifest(runDir);
  const findings = [...parsed.findings];
  if (parsed.manifest === null) return findings;

  const steps = selectedSteps(runDir, parsed.manifest, atStep, full);
  const expectedOutputPaths = new Set<string>();
  const expectedProvenancePaths = new Set<string>();

  for (const step of steps) {
    const outputs = parsed.manifest.expected_outputs_per_step[step] ?? [];
    for (const expected of outputs) {
      findings.push(
        ...lintExpectedOutput({
          runDir,
          manifest: parsed.manifest,
          expected,
          expectedOutputPaths,
          expectedProvenancePaths,
        })
      );
    }
    if (!isLegacyContract(parsed.manifest.provenance_contract)) {
      findings.push(...lintStepSeal(runDir, step));
    }
  }

  findings.push(
    ...scanUnexpectedFiles({
      runDir,
      roster: parsed.manifest.roster,
      steps,
      expectedOutputPaths,
      expectedProvenancePaths,
    })
  );
  return findings;
}

function runDirsFromPositional(positional: string[]): string[] {
  const runDirs = new Set<string>();

  for (const inputPath of positional) {
    const absPath = path.resolve(inputPath);
    if (!fs.existsSync(absPath)) continue;

    const stat = fs.statSync(absPath);
    const candidateDir = stat.isDirectory() ? absPath : path.dirname(absPath);
    if (!isUnderPath(candidateDir, COUNCIL_RUNS_DIR)) continue;

    let current = candidateDir;
    while (isUnderPath(current, COUNCIL_RUNS_DIR)) {
      if (
        fs.existsSync(path.join(current, MANIFEST_NAME)) ||
        path.dirname(current) === COUNCIL_RUNS_DIR
      ) {
        runDirs.add(current);
        break;
      }
      current = path.dirname(current);
    }
  }

  return [...runDirs].sort();
}

function defaultRunDirs(): string[] {
  if (!fs.existsSync(COUNCIL_RUNS_DIR)) return [];
  return fs
    .readdirSync(COUNCIL_RUNS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("__"))
    .map((entry) => path.join(COUNCIL_RUNS_DIR, entry.name))
    .sort();
}

function printFindings(runCount: number, findings: Finding[], json: boolean): void {
  if (json) {
    console.log(
      JSON.stringify({ findings, count: findings.length, runs_scanned: runCount }, null, 2)
    );
    return;
  }

  if (findings.length === 0) {
    console.log(`OK - ${runCount} council run(s) scanned, manifest completeness checks passed.`);
    return;
  }

  console.log(`Found ${findings.length} council run issue(s):\n`);
  for (const item of findings) {
    console.log(`  ${item.file}  [${item.kind}]  ${item.message}`);
    if (item.expected) console.log(`    expected: ${item.expected}`);
    if (item.actual) console.log(`    actual:   ${item.actual}`);
  }
}

function main(): void {
  let args: CliArgs;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`[FAIL local_config_error] ${(err as Error).message}`);
    process.exit(2);
  }

  const runDirs =
    args.positional.length > 0 ? runDirsFromPositional(args.positional) : defaultRunDirs();
  const atStep = args.full ? null : args.atStep;
  const findings = runDirs.flatMap((runDir) => lintRun(runDir, atStep, args.full));

  printFindings(runDirs.length, findings, args.json);

  if (args.strict && findings.length > 0) process.exit(1);
  process.exit(0);
}

main();

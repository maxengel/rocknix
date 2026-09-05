#!/usr/bin/env npx tsx
/**
 * Council Run Summary (M64.P1.5 E7/C4 #2979)
 *
 * Walks a manifest-backed research/council-runs/** directory, reads each
 * declared Facilitator provenance sibling, aggregates token usage and duration,
 * and writes run-summary.json + run-summary.md.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../..") /* rocknix: tools/council/ is two below the repo root */;
const MANIFEST_NAME = "council-run-manifest.json";
const SUMMARY_SCHEMA_VERSION = "council-run-summary@1.0.0";

type StepKey = "step1" | "step2" | "step3" | "step4" | "step4_5";

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

interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

interface AttemptSummary {
  step: StepKey;
  member: string;
  artifact_path: string;
  provenance_path: string;
  attempt: number | null;
  outcome: string;
  duration_ms: number;
  tokens: TokenUsage | null;
  tokens_per_second: number | null;
  usage_unavailable?: {
    class: "usage_unavailable";
    reason: string;
  };
}

interface Totals {
  attempts: number;
  duration_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  tokens_per_second: number | null;
  usage_unavailable_count: number;
}

interface StepSummary {
  totals: Totals;
  attempts: AttemptSummary[];
}

interface RunSummary {
  schema_version: string;
  generated_at: string;
  run_id: string;
  topic: string;
  source_manifest: string;
  provenance_contract: string;
  min_assurance_tier: AssuranceTier | null;
  step_assurance_tiers: Partial<Record<StepKey, AssuranceTier | null>>;
  totals: Totals;
  steps: Partial<Record<StepKey, StepSummary>>;
  usage_unavailable: Array<{
    step: StepKey;
    member: string;
    artifact_path: string;
    provenance_path: string;
    attempt: number | null;
    reason: string;
  }>;
}

type AssuranceTier =
  | "client_telemetry"
  | "local_capture_provider_attested"
  | "corroborated"
  | "provider_signed";

const ASSURANCE_RANK: Record<AssuranceTier, number> = {
  client_telemetry: 0,
  local_capture_provider_attested: 1,
  corroborated: 2,
  provider_signed: 3,
};

interface CliArgs {
  runDir: string | null;
  outJson: string | null;
  outMd: string | null;
}

function relativePath(absPath: string): string {
  return path.relative(REPO_ROOT, absPath);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAssuranceTier(value: unknown): value is AssuranceTier {
  return typeof value === "string" && value in ASSURANCE_RANK;
}

function lowerAssuranceTier(
  current: AssuranceTier | null,
  candidate: AssuranceTier | null
): AssuranceTier | null {
  if (candidate === null) return current;
  if (current === null) return candidate;
  return ASSURANCE_RANK[candidate] < ASSURANCE_RANK[current] ? candidate : current;
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function sumNumbers(...values: Array<number | null>): number | null {
  let sawValue = false;
  let total = 0;
  for (const value of values) {
    if (value === null) continue;
    sawValue = true;
    total += value;
  }
  return sawValue ? total : null;
}

function normalizeTokenUsage(usage: unknown): TokenUsage | null {
  if (!isRecord(usage)) return null;

  const prompt =
    asFiniteNumber(usage.prompt_tokens) ??
    sumNumbers(
      asFiniteNumber(usage.input_tokens),
      asFiniteNumber(usage.cache_creation_input_tokens),
      asFiniteNumber(usage.cache_read_input_tokens)
    ) ??
    asFiniteNumber(usage.promptTokenCount);

  const completion =
    asFiniteNumber(usage.completion_tokens) ??
    asFiniteNumber(usage.output_tokens) ??
    sumNumbers(
      asFiniteNumber(usage.candidatesTokenCount),
      asFiniteNumber(usage.thoughtsTokenCount)
    );

  const total =
    asFiniteNumber(usage.total_tokens) ??
    asFiniteNumber(usage.totalTokenCount) ??
    sumNumbers(prompt, completion);

  if (prompt === null || completion === null || total === null) return null;
  return { prompt, completion, total };
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { runDir: null, outJson: null, outMd: null };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const expectValue = (): string => {
      const value = argv[index + 1];
      if (!value) throw new Error(`${arg} requires a value`);
      index += 1;
      return value;
    };

    if (arg === "--run-dir") {
      args.runDir = expectValue();
    } else if (arg === "--out-json") {
      args.outJson = expectValue();
    } else if (arg === "--out-md") {
      args.outMd = expectValue();
    } else if (arg.startsWith("--")) {
      throw new Error(`unknown flag: ${arg}`);
    } else if (args.runDir === null) {
      args.runDir = arg;
    } else {
      throw new Error(`unexpected positional argument: ${arg}`);
    }
  }

  if (args.runDir === null) throw new Error("--run-dir is required");
  return args;
}

function readJson(absPath: string): unknown {
  return JSON.parse(fs.readFileSync(absPath, "utf8"));
}

function readManifest(runDir: string): CouncilRunManifest {
  const manifestPath = path.join(runDir, MANIFEST_NAME);
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`[FAIL manifest_missing] ${relativePath(manifestPath)} does not exist`);
  }

  const parsed = readJson(manifestPath);
  if (!isRecord(parsed)) {
    throw new Error(
      `[FAIL manifest_schema_mismatch] ${relativePath(manifestPath)} root must be an object`
    );
  }

  const manifest = parsed as Partial<CouncilRunManifest>;
  if (typeof manifest.run_id !== "string") {
    throw new Error(
      `[FAIL manifest_schema_mismatch] ${relativePath(manifestPath)} run_id must be a string`
    );
  }
  if (!isRecord(manifest.expected_outputs_per_step)) {
    throw new Error(
      `[FAIL manifest_schema_mismatch] ${relativePath(manifestPath)} expected_outputs_per_step must be an object`
    );
  }

  return parsed as CouncilRunManifest;
}

function selectedSteps(manifest: CouncilRunManifest): StepKey[] {
  return ["step1", "step2", "step3", "step4", "step4_5"].filter((step): step is StepKey =>
    Array.isArray(manifest.expected_outputs_per_step[step as StepKey])
  );
}

function readStepAssuranceTier(runDir: string, step: StepKey): AssuranceTier | null {
  const sealPath = path.join(runDir, "verification", "seals", `${step}.seal.json`);
  if (!fs.existsSync(sealPath)) return null;
  const seal = readJson(sealPath);
  if (!isRecord(seal)) return null;
  const tier = seal.min_assurance_tier_across_seats ?? seal.min_assurance_tier;
  return isAssuranceTier(tier) ? tier : null;
}

function tokensPerSecond(tokens: TokenUsage | null, durationMs: number): number | null {
  if (!tokens || durationMs <= 0) return null;
  return Number((tokens.total / (durationMs / 1000)).toFixed(3));
}

function emptyTotals(): Totals {
  return {
    attempts: 0,
    duration_ms: 0,
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
    tokens_per_second: null,
    usage_unavailable_count: 0,
  };
}

function addAttemptToTotals(totals: Totals, attempt: AttemptSummary): void {
  totals.attempts += 1;
  totals.duration_ms += attempt.duration_ms;
  if (attempt.tokens) {
    totals.prompt_tokens += attempt.tokens.prompt;
    totals.completion_tokens += attempt.tokens.completion;
    totals.total_tokens += attempt.tokens.total;
  } else {
    totals.usage_unavailable_count += 1;
  }
}

function finalizeTotals(totals: Totals): Totals {
  const seconds = totals.duration_ms / 1000;
  return {
    ...totals,
    tokens_per_second:
      totals.total_tokens > 0 && seconds > 0
        ? Number((totals.total_tokens / seconds).toFixed(3))
        : null,
  };
}

function attemptRecordsFromProvenance(provenance: unknown): Record<string, unknown>[] {
  if (!isRecord(provenance) || !Array.isArray(provenance.attempts)) return [];
  return provenance.attempts.filter(isRecord);
}

function summarizeExpectedOutput(params: {
  runDir: string;
  step: StepKey;
  expected: ExpectedOutput;
}): AttemptSummary[] {
  const artifactPath = path.join(params.runDir, params.expected.path);
  const provenancePath = `${artifactPath}.provenance.json`;
  const relativeArtifactPath = relativePath(artifactPath);
  const relativeProvenancePath = relativePath(provenancePath);

  if (!fs.existsSync(provenancePath)) {
    return [
      {
        step: params.step,
        member: params.expected.member,
        artifact_path: relativeArtifactPath,
        provenance_path: relativeProvenancePath,
        attempt: null,
        outcome: "unavailable",
        duration_ms: 0,
        tokens: null,
        tokens_per_second: null,
        usage_unavailable: {
          class: "usage_unavailable",
          reason: "provenance_missing",
        },
      },
    ];
  }

  const provenance = readJson(provenancePath);
  const attempts = attemptRecordsFromProvenance(provenance);
  if (attempts.length === 0) {
    return [
      {
        step: params.step,
        member: params.expected.member,
        artifact_path: relativeArtifactPath,
        provenance_path: relativeProvenancePath,
        attempt: null,
        outcome: "unavailable",
        duration_ms: 0,
        tokens: null,
        tokens_per_second: null,
        usage_unavailable: {
          class: "usage_unavailable",
          reason: "attempts_missing_or_unreadable",
        },
      },
    ];
  }

  return attempts.map((attempt, index) => {
    const rawTokens = isRecord(attempt.tokens) ? attempt.tokens : null;
    const tokens = normalizeTokenUsage(rawTokens ?? attempt.usage);
    const durationMs = asFiniteNumber(attempt.duration_ms) ?? 0;
    const attemptNumber = asFiniteNumber(attempt.attempt) ?? index + 1;
    const outcome = typeof attempt.outcome === "string" ? attempt.outcome : "unknown";
    const summary: AttemptSummary = {
      step: params.step,
      member: params.expected.member,
      artifact_path: relativeArtifactPath,
      provenance_path: relativeProvenancePath,
      attempt: attemptNumber,
      outcome,
      duration_ms: durationMs,
      tokens,
      tokens_per_second: tokensPerSecond(tokens, durationMs),
    };

    if (!tokens) {
      const explicitReason =
        typeof attempt.usage_unavailable === "string" ? attempt.usage_unavailable : null;
      summary.usage_unavailable = {
        class: "usage_unavailable",
        reason: explicitReason ?? (isRecord(attempt.usage) ? "usage_unrecognized" : "usage_absent"),
      };
    }

    return summary;
  });
}

function buildSummary(runDir: string, manifest: CouncilRunManifest): RunSummary {
  const totals = emptyTotals();
  const steps: Partial<Record<StepKey, StepSummary>> = {};
  const stepAssuranceTiers: Partial<Record<StepKey, AssuranceTier | null>> = {};
  let minAssuranceTier: AssuranceTier | null = null;
  const usageUnavailable: RunSummary["usage_unavailable"] = [];

  for (const step of selectedSteps(manifest)) {
    const stepTotals = emptyTotals();
    const stepAttempts: AttemptSummary[] = [];
    const expectedOutputs = manifest.expected_outputs_per_step[step] ?? [];
    const stepAssuranceTier = readStepAssuranceTier(runDir, step);
    stepAssuranceTiers[step] = stepAssuranceTier;
    minAssuranceTier = lowerAssuranceTier(minAssuranceTier, stepAssuranceTier);

    for (const expected of expectedOutputs) {
      const attempts = summarizeExpectedOutput({ runDir, step, expected });
      for (const attempt of attempts) {
        stepAttempts.push(attempt);
        addAttemptToTotals(stepTotals, attempt);
        addAttemptToTotals(totals, attempt);
        if (attempt.usage_unavailable) {
          usageUnavailable.push({
            step,
            member: attempt.member,
            artifact_path: attempt.artifact_path,
            provenance_path: attempt.provenance_path,
            attempt: attempt.attempt,
            reason: attempt.usage_unavailable.reason,
          });
        }
      }
    }

    steps[step] = {
      totals: finalizeTotals(stepTotals),
      attempts: stepAttempts,
    };
  }

  return {
    schema_version: SUMMARY_SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
    run_id: manifest.run_id,
    topic: manifest.topic,
    source_manifest: relativePath(path.join(runDir, MANIFEST_NAME)),
    provenance_contract: manifest.provenance_contract,
    min_assurance_tier: minAssuranceTier,
    step_assurance_tiers: stepAssuranceTiers,
    totals: finalizeTotals(totals),
    steps,
    usage_unavailable: usageUnavailable,
  };
}

function formatNumber(value: number | null): string {
  if (value === null) return "usage_unavailable";
  return String(value);
}

function renderMarkdown(summary: RunSummary): string {
  const lines: string[] = [];
  lines.push(`# Council Run Summary: ${summary.run_id}`);
  lines.push("");
  lines.push(`Generated: ${summary.generated_at}`);
  lines.push(`Source manifest: \`${summary.source_manifest}\``);
  lines.push(`Provenance contract: \`${summary.provenance_contract}\``);
  lines.push(`Minimum assurance tier: \`${summary.min_assurance_tier ?? "unsealed_or_legacy"}\``);
  lines.push("");
  lines.push("## Totals");
  lines.push("");
  lines.push(
    "| Attempts | Duration ms | Prompt tokens | Completion tokens | Total tokens | Tokens/sec | Usage unavailable |"
  );
  lines.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: |");
  lines.push(
    `| ${summary.totals.attempts} | ${summary.totals.duration_ms} | ${summary.totals.prompt_tokens} | ${summary.totals.completion_tokens} | ${summary.totals.total_tokens} | ${formatNumber(summary.totals.tokens_per_second)} | ${summary.totals.usage_unavailable_count} |`
  );

  for (const step of selectedStepKeys(summary)) {
    const stepSummary = summary.steps[step];
    if (!stepSummary) continue;
    lines.push("");
    lines.push(`## ${step}`);
    lines.push("");
    lines.push(
      `Seal assurance tier: \`${summary.step_assurance_tiers[step] ?? "unsealed_or_legacy"}\``
    );
    lines.push("");
    lines.push(
      "| Member | Attempt | Outcome | Duration ms | Prompt | Completion | Total | Tokens/sec | Usage status |"
    );
    lines.push("| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | --- |");
    for (const attempt of stepSummary.attempts) {
      lines.push(
        `| ${attempt.member} | ${attempt.attempt ?? "n/a"} | ${attempt.outcome} | ${attempt.duration_ms} | ${attempt.tokens?.prompt ?? 0} | ${attempt.tokens?.completion ?? 0} | ${attempt.tokens?.total ?? 0} | ${formatNumber(attempt.tokens_per_second)} | ${attempt.usage_unavailable?.class ?? "available"} |`
      );
    }
  }

  if (summary.usage_unavailable.length > 0) {
    lines.push("");
    lines.push("## Usage Unavailable");
    lines.push("");
    lines.push("| Step | Member | Attempt | Reason | Provenance |");
    lines.push("| --- | --- | ---: | --- | --- |");
    for (const item of summary.usage_unavailable) {
      lines.push(
        `| ${item.step} | ${item.member} | ${item.attempt ?? "n/a"} | ${item.reason} | \`${item.provenance_path}\` |`
      );
    }
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

function selectedStepKeys(summary: RunSummary): StepKey[] {
  return ["step1", "step2", "step3", "step4", "step4_5"].filter((step): step is StepKey =>
    Boolean(summary.steps[step as StepKey])
  );
}

function main(): void {
  let args: CliArgs;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`[FAIL local_config_error] ${(err as Error).message}`);
    process.exit(2);
  }

  const runDir = path.resolve(args.runDir ?? "");
  try {
    const manifest = readManifest(runDir);
    const summary = buildSummary(runDir, manifest);
    const jsonPath = path.resolve(args.outJson ?? path.join(runDir, "run-summary.json"));
    const mdPath = path.resolve(args.outMd ?? path.join(runDir, "run-summary.md"));

    fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    fs.writeFileSync(mdPath, renderMarkdown(summary), "utf8");
    console.log(`Wrote ${relativePath(jsonPath)} and ${relativePath(mdPath)}`);
  } catch (err) {
    const message = (err as Error).message;
    console.error(message.startsWith("[FAIL ") ? message : `[FAIL summary_error] ${message}`);
    process.exit(1);
  }
}

main();

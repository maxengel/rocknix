#!/usr/bin/env npx tsx
/**
 * Council Facilitator — direct-API dispatcher for council member invocations
 *
 * The **Council Facilitator** is the per-member invocation helper. Given
 * `(member, prompt, output)`, it calls that member's pinned model via the
 * provider's direct HTTPS API (NOT through VS Code's runSubagent — see Finding
 * #1 in research/council-runs/2026-05-22-model-identity-verification-technique/
 * model-verification-log.md for why), captures the response body for both
 * content extraction AND model-identity verification, and writes both the
 * assistant content and a structured provenance JSON the per-break gate can
 * grep.
 *
 * Companion to the **Council Orchestrator** (.claude/skills/council/SKILL.md),
 * which drives the 6-step pipeline. Facilitator handles transport-layer and
 * budget-class retries (which it can resolve without user input); Orchestrator
 * handles semantic retries that require user judgement (prompt design issues,
 * roster degradation decisions, model-mismatch FAIL recovery). The boundary
 * is codified in
 * .claude/skills/council/references/model-verification.md § Failure recovery.
 *
 * RATIONALE / CONTEXT
 *
 * VS Code's runSubagent enforces a pre-invocation cost-tier ceiling that
 * blocks Copilot-channel premium models (the historical Opus seat in the
 * 2026-05-22 test run, Gemini 3.1 Pro Preview, GPT-5.5-Xhigh) when the
 * orchestrator's tier is below the requested tier.
 * That is the substrate constraint the test council surfaced as Finding #1.
 * This dispatcher bypasses runSubagent entirely by going direct to each
 * provider's HTTPS API, so all five members run on their declared premium
 * models regardless of the orchestrator's tier.
 *
 * USAGE
 *
 *   npx tsx tools/council/council-invoke.ts \
 *     --member <claude|gemini|gpt|kimi|mistral> \
 *     --prompt-file <path>           OR  --prompt "inline string" \
 *     --output <path-to-write-content> \
 *     [--provenance <path>]          (default: <output>.provenance.json) \
 *     [--system-prompt-file <path>] \
 *     [--max-tokens N]               (member default if omitted) \
 *     [--max-retries N]              (default 3) \
 *     [--retry-base-ms N]            (default 1000) \
 *     [--provider default|openrouter|azure|bedrock] (all members support openrouter / COUNCIL_PROVIDER=openrouter; azure/bedrock Mistral-only backups) \
 *     [--transport default|buffered|sse|eventstream] (default: member preference; Kimi uses SSE) \
 *     [--no-retry]                   (convenience for --max-retries=0; debug only) \
 *     [--per-attempt-timeout-ms N]   (default 3600000 — one hour; a high-effort seat on a large corpus can reason for 10-25 minutes) \
 *     [--total-timeout-ms N]         (default 14400000 — four hours across retries) \
 *     [--source-manifest <path>]     (Brake #5 — see SOURCE EMBEDDING below)
 *
 * SOURCE EMBEDDING (Brake #5, council-facilitator@1.1.0)
 *
 *   When `--source-manifest <path>` is provided, the Facilitator reads
 *   every file declared in the manifest's `sources[]` array, re-hashes
 *   each file with sha256, and embeds the verbatim contents into the
 *   user prompt envelope above the orchestrator's brief. Each embedded
 *   block carries the path, the verified sha256, and the byte length.
 *
 *   If any source file is missing or its on-disk sha256 differs from
 *   the manifest's declared value, the Facilitator exits with code 4
 *   (local_config_error) WITHOUT calling the provider. This protects
 *   against substrate drift between manifest authoring and member
 *   dispatch.
 *
 *   Council members invoked via direct HTTPS APIs are stateless and
 *   have NO filesystem / MCP / tool access. A prompt that instructs
 *   them to "read the file at path X" cannot be honestly satisfied —
 *   the member either fabricates or honestly refuses. Both outcomes
 *   destroy the corpus. Source embedding closes this substrate gap:
 *   members receive the actual contents to read, and cite the
 *   Facilitator-verified sha256 values in their provenance.
 *
 * EXIT CODES (machine-readable failure classes)
 *
 *   0  success — content written, model verified, provenance written
 *   1  retries_exhausted_transient — network / 5xx / 429 ran out of retries
 *   2  retries_exhausted_empty_content — reasoning preamble ate budget every attempt
 *   3  model_mismatch_no_retry — observed model ≠ declared (NEVER auto-retried;
 *                                 this is the silent-substitution failure mode
 *                                 the council was built to detect)
 *   4  local_config_error — missing env var, bad args, agent file not found,
 *                            source-manifest drift or missing file
 *                            (provenance NOT written; error is pre-call)
 *   5  permanent_provider_error — HTTP 4xx (non-429) e.g. 400/422 from
 *                                  malformed body. Provenance written.
 *
 * Retry classes are codified in the FAILURE_RETRY_POLICY constant below.
 * Per silent-failure-discipline.instructions.md Rule 8, every failure mode
 * has a distinct machine-readable class so reviewers / orchestrators / audit
 * trails can tell them apart.
 */

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, open, rm, appendFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve, basename, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
  type ConverseStreamOutput,
} from "@aws-sdk/client-bedrock-runtime";
import {
  canonicalJson,
  canonicalSha256,
  findCouncilRunDir,
  genesisSha256,
  LEDGER_NAME,
} from "./lib/council-verification.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../..") /* rocknix: this file lives in tools/council/, two below the repo root */;

function repoRelative(absPath: string): string {
  return relative(REPO_ROOT, absPath).split("\\").join("/");
}

interface SourceManifestEntry {
  path: string;
  sha256: string;
  /**
   * Witness commit (#3696, provenance schema v1.2.0): a commit whose blob at
   * `path` sha256-matches `sha256`, or null when the source was not yet
   * committed at read time. Staged by the orchestrator; passed through
   * verbatim into the provenance sibling's `source_file_commits[]`.
   */
  source_commit?: string | null;
  read_timestamp_utc?: string;
}

interface SourceManifest {
  schema_version?: string;
  council_research_run_id?: string;
  phase?: string;
  sources: SourceManifestEntry[];
}

async function loadSourceManifest(path: string): Promise<SourceManifest> {
  const raw = await readFile(resolve(path), "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as SourceManifest).sources)) {
    throw new Error(
      `[FAIL local_config_error] --source-manifest ${path} is malformed: ` +
        `expected JSON object with sources[] array`
    );
  }
  return parsed as SourceManifest;
}

/**
 * Brake #5 (council-facilitator@1.1.0) — Source content embedding.
 *
 * Members invoked via direct HTTPS APIs are stateless: they have no
 * filesystem access, no MCP, no tools. A prompt that says "read the file
 * at path X and capture its sha256 at read time" cannot be honestly
 * satisfied — the member either fabricates (claude/gemini at R8 Phase 1
 * attempt #1) or honestly refuses (gpt at R8 Phase 1 attempt #1). Both
 * outcomes destroy the corpus.
 *
 * Fix: when --source-manifest is supplied, the Facilitator reads every
 * declared source file itself, re-hashes it, fails closed on drift, and
 * embeds the verbatim contents into the user prompt envelope above the
 * orchestrator's brief. The member then receives an actual corpus to
 * read, and the declared sha256 values it must cite in provenance are
 * the ones the Facilitator already verified.
 *
 * Returns the augmented prompt. Throws (caller maps to exit 4) on any
 * file read failure or sha256 mismatch.
 */
async function embedSourcesIntoPrompt(
  userPrompt: string,
  manifest: SourceManifest,
  manifestPath: string
): Promise<string> {
  const blocks: string[] = [];
  for (let i = 0; i < manifest.sources.length; i++) {
    const entry = manifest.sources[i];
    const abs = resolve(REPO_ROOT, entry.path);
    let bytes: Buffer;
    try {
      bytes = await readFile(abs);
    } catch (err) {
      throw new Error(
        `--source-manifest entry #${i + 1} (${entry.path}) could not be read: ` +
          `${(err as Error).message}. Fix the manifest path or restore the file.`
      );
    }
    const verifiedSha256 = sha256Bytes(bytes);
    if (verifiedSha256 !== entry.sha256) {
      throw new Error(
        `--source-manifest entry #${i + 1} (${entry.path}) sha256 drift: ` +
          `manifest declares ${entry.sha256} but on-disk content hashes to ${verifiedSha256}. ` +
          `Either the file changed after the manifest was authored, or the manifest is stale. ` +
          `Refusing to embed mismatched content — re-author the manifest with current hashes.`
      );
    }
    blocks.push(
      [
        `### SOURCE ${i + 1} of ${manifest.sources.length}`,
        ``,
        `- **path:** \`${entry.path}\``,
        `- **sha256 (verified at embed time):** \`${verifiedSha256}\``,
        `- **bytes:** ${bytes.length}`,
        entry.read_timestamp_utc
          ? `- **manifest read_timestamp_utc:** \`${entry.read_timestamp_utc}\``
          : null,
        ``,
        "```",
        bytes.toString("utf8"),
        "```",
      ]
        .filter((line): line is string => line !== null)
        .join("\n")
    );
  }

  const header = [
    `# EMBEDDED SOURCE CORPUS (Council Facilitator — ${FACILITATOR_VERSION})`,
    ``,
    `The Council Facilitator pre-read and content-verified the ${manifest.sources.length} ` +
      `source file(s) declared in \`${relative(REPO_ROOT, resolve(manifestPath))}\` before ` +
      `dispatching this prompt. Each source's verbatim contents appear inline below with the ` +
      `sha256 the Facilitator computed at embed time.`,
    ``,
    `You (the council member) do NOT have filesystem access. Treat the embedded contents ` +
      `as your read-at-time corpus. Cite each source by its declared \`path\` and the ` +
      `\`sha256 (verified at embed time)\` value shown in the per-source header — those are ` +
      `the values your \`corpus.provenance.json\` must record in \`source_file_paths[]\` and ` +
      `\`source_file_hashes[]\`. Do NOT claim to have re-read or re-hashed the files yourself.`,
    ``,
    `If a source you need was not embedded, say so explicitly in your corpus and surface ` +
      `the gap to the orchestrator — do not fabricate paths, hashes, or contents.`,
    ``,
    `---`,
    ``,
    blocks.join("\n\n---\n\n"),
    ``,
    `---`,
    ``,
    `# ORCHESTRATOR BRIEF (verbatim below this line)`,
    ``,
  ].join("\n");

  return `${header}\n${userPrompt}`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MemberId = "claude" | "gemini" | "gpt" | "kimi" | "mistral";

type Substrate =
  | "anthropic-direct"
  | "foundry-direct"
  | "ai-studio"
  | "openrouter"
  | "bedrock-runtime";

type ProviderRoute = "default" | "openrouter" | "direct" | "azure" | "bedrock";
type TransportMode = "buffered" | "sse" | "eventstream";
type TransportPreference = "default" | TransportMode;
type ModelIdentitySource = "provider_response" | "facilitator_request_route";

type AttemptOutcome =
  | "success"
  | "retry" // will retry (logged in attempts, not the final outcome)
  | "transient_network"
  | "attempt_timeout"
  | "response_body_error"
  | "invalid_response_body"
  | "transient_server_error"
  | "rate_limited"
  | "empty_content"
  | "truncated_content"
  | "model_mismatch"
  | "permanent_provider_error";

type FinalOutcome =
  | "success"
  | "retries_exhausted_transient"
  | "retries_exhausted_empty_content"
  | "model_mismatch_no_retry"
  | "permanent_provider_error";

interface MemberRecipe {
  readonly id: MemberId;
  readonly substrate: Substrate;
  /** Human-readable declared model — matches the agent file's `model:` array first element. */
  readonly declaredModel: string;
  /** Endpoint URL — function so it can interpolate env vars / region constants. */
  readonly endpoint: () => string;
  /** Build the HTTP headers for this provider. */
  readonly headers: () => Record<string, string>;
  /** Build the request body. `maxTokens` is the budget for THIS attempt (may be bumped on retry). */
  readonly buildBody: (params: {
    userPrompt: string;
    systemPrompt: string | null;
    maxTokens: number;
    transport: TransportMode;
  }) => Record<string, unknown>;
  /** Extract assistant content text from the provider's response body. Returns "" if empty. */
  readonly extractContent: (response: unknown) => string;
  /** Read the model-identity field from the response body. Returns null if absent. */
  readonly extractModelField: (response: unknown) => string | null;
  /** Check whether observed model semantically matches the declared model. */
  readonly modelMatches: (observed: string) => boolean;
  /** Declared reasoning effort for this seat, when the substrate takes one. */
  readonly declaredEffort?: ReasoningEffort;
  /** Where the observed model identity came from. Defaults to provider_response. */
  readonly modelIdentitySource?: ModelIdentitySource;
  /** Provider-specific finish-reason check (returns true if content was truncated). */
  readonly wasTruncated: (response: unknown) => boolean;
  /** The env var(s) this recipe requires. Missing any → exit 4 immediately. */
  readonly requiredEnv: readonly string[];
  /** Transport used when --transport default is selected. */
  readonly defaultTransport?: TransportMode;
  /** Whether the recipe can use OpenAI-compatible SSE streaming. */
  readonly supportsSse?: boolean;
  /** Whether the recipe can use AWS Bedrock EventStream streaming. */
  readonly supportsEventStream?: boolean;
  /** Sensible default `max_tokens` for analysis-step prompts. */
  readonly defaultMaxTokens: number;
  /** Hard upper cap on `max_tokens` regardless of bumping. */
  readonly maxTokensCeiling: number;
}

interface AttemptRecord {
  attempt: number;
  started_at: string;
  duration_ms: number;
  wait_before_ms?: number;
  max_tokens: number;
  transport: TransportMode;
  http_status: number | null;
  outcome: AttemptOutcome;
  outcome_reason: string | null;
  model_field: string | null;
  model_identity_source?: ModelIdentitySource;
  finish_reason?: string | null;
  content_length: number;
  content_sha256?: string;
  stream_events?: number;
  stream_chunks?: number;
  stream_done?: boolean;
  usage?: Record<string, unknown>;
  tokens: TokenUsage | null;
  usage_unavailable?: UsageUnavailableReason;
  retry_after_ms?: number;
  response_headers?: Record<string, string>;
  response_body_sha256?: string;
  response_body_preview?: string;
  response_body_parse_error?: string;
  error_phase?: FetchErrorPhase;
  error_message?: string;
}

type UsageUnavailableReason = "usage_absent" | "usage_unrecognized";

type AssuranceTier =
  | "client_telemetry"
  | "local_capture_provider_attested"
  | "corroborated"
  | "provider_signed";

interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
  /**
   * Reasoning/thinking tokens, when the provider reports them. `null` means
   * the provider did not say — NOT that the model did no reasoning. Used by
   * verifyEffortEvidence to distinguish "reasoned" from "silently didn't".
   */
  reasoning: number | null;
}

interface Provenance {
  // ─────────────────────────────────────────────────────────────────────────
  // Composite top-level fields (RC2 of #2991 — council-research provenance
  // schema v1.1.0 alignment). The digest lint
  // (`tools/council/lint-council-research-digests.ts`) requires these four fields
  // to be present at the JSON root. We always emit them so a Facilitator-
  // dispatched member call that lands under `research/council-research/**`
  // passes both lints with zero findings.
  //
  // `source_file_paths[]` / `source_file_hashes[]` / `read_timestamps[]`
  // default to empty arrays (Facilitator receives prompt strings, not file
  // handles); they are populated from `--source-manifest` when the
  // orchestrator pre-stages a manifest (RC3 of #2991). Cross-linking
  // fields (`schema_version`, `council_research_run_id`, `phase`, …) are
  // additive: present only when invoked with `--council-research-run-id` /
  // `--phase` (i.e. inside a council-research Phase-4 deliberation).
  // ─────────────────────────────────────────────────────────────────────────
  schema_version?: string;
  council_research_run_id?: string;
  phase?: "phase-1" | "phase-2" | "phase-3" | "phase-4" | "phase-5";
  artifact_path: string;
  output_file_sha256?: string;
  agent_name?: string;
  invoker_agent_name?: string;
  runtime?: string;
  model?: string;
  source_file_paths: string[];
  source_file_hashes: string[];
  source_file_commits?: (string | null)[];
  read_timestamps?: string[];
  timestamp_utc?: string;
  // ─── Council-skill / Facilitator-specific record (preserved as-is) ──────
  facilitator_version: string;
  genesis_sha256?: string;
  prev_verdict_sha256: string | null;
  member: MemberId;
  declared_model: string;
  substrate: Substrate;
  transport: TransportMode;
  endpoint: string;
  request: {
    started_at: string;
    system_prompt_sha256: string | null;
    user_prompt_sha256: string;
  };
  attempts: AttemptRecord[];
  final: {
    outcome: FinalOutcome;
    assurance_tier: AssuranceTier;
    total_duration_ms: number;
    retries_used: number;
    /** SHA-256 of the output file after it is written to disk. */
    file_artifact_sha256?: string;
    /** Usage tokens from the final (successful) attempt, if any. */
    usage?: Record<string, unknown>;
    /** Normalized provider token counts from the final attempt, or null when unavailable. */
    tokens?: TokenUsage | null;
    usage_unavailable?: UsageUnavailableReason;
    verification: {
      result: "PASS" | "FAIL" | "UNVERIFIABLE";
      match_kind: "literal" | "semantic" | "none";
      declared: string;
      observed: string | null;
      model_identity_source?: ModelIdentitySource;
    };
    /**
     * Effort attestation, recorded alongside model attestation.
     *
     * `evidence: "reasoning_tokens"` names what was actually inspected —
     * effort is not echoed by any provider, so this is behavioural proof that
     * reasoning happened, not a self-report comparison. `observed_reasoning_tokens`
     * is null when the substrate reports no such field, which yields
     * UNVERIFIABLE rather than a false PASS.
     */
    effort_verification?: {
      result: EffortVerification;
      declared: ReasoningEffort | null;
      evidence: "reasoning_tokens";
      observed_reasoning_tokens: number | null;
    };
  };
}

// ---------------------------------------------------------------------------
// Untyped-JSON access helpers
//
// Response bodies come from external APIs and arrive as `unknown` after
// `await response.json()`. The recipe parsers below need to dig through
// loosely-typed nested structures. These helpers keep that access tidy
// without resorting to `any`.
// ---------------------------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Safe property read: returns the value if `obj` is a record, else undefined. */
function field(obj: unknown, key: string): unknown {
  return isRecord(obj) ? obj[key] : undefined;
}

/** Safe nested read by sequence of keys / array indices. */
function fieldPath(obj: unknown, ...path: Array<string | number>): unknown {
  let cur: unknown = obj;
  for (const seg of path) {
    if (typeof seg === "number") {
      cur = Array.isArray(cur) ? cur[seg] : undefined;
    } else {
      cur = field(cur, seg);
    }
    if (cur === undefined) return undefined;
  }
  return cur;
}

/** Returns the value if it's a string, otherwise null (used for `model` field reads). */
function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function asFiniteNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
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

function normalizeTokenUsage(usage: Record<string, unknown> | undefined): TokenUsage | undefined {
  if (!usage) return undefined;

  const prompt =
    asFiniteNumber(usage.prompt_tokens) ??
    sumNumbers(
      asFiniteNumber(usage.input_tokens),
      asFiniteNumber(usage.inputTokens),
      asFiniteNumber(usage.cache_creation_input_tokens),
      asFiniteNumber(usage.cache_read_input_tokens)
    ) ??
    asFiniteNumber(usage.promptTokenCount);

  const completion =
    asFiniteNumber(usage.completion_tokens) ??
    asFiniteNumber(usage.output_tokens) ??
    asFiniteNumber(usage.outputTokens) ??
    sumNumbers(
      asFiniteNumber(usage.candidatesTokenCount),
      asFiniteNumber(usage.thoughtsTokenCount)
    );

  const total =
    asFiniteNumber(usage.total_tokens) ??
    asFiniteNumber(usage.totalTokens) ??
    asFiniteNumber(usage.totalTokenCount) ??
    sumNumbers(prompt, completion);

  // Reasoning tokens, across the shapes our substrates actually emit:
  //   OpenAI-compatible / OpenRouter -> completion_tokens_details.reasoning_tokens
  //   Anthropic direct               -> thinking_tokens
  //   Gemini                         -> thoughtsTokenCount
  // Absent is NOT zero: a provider that never reports the field must leave
  // this null so the effort check reads UNVERIFIABLE instead of FAIL.
  const details = usage.completion_tokens_details;
  const reasoning =
    (isRecord(details) ? asFiniteNumber(details.reasoning_tokens) : null) ??
    asFiniteNumber(usage.reasoning_tokens) ??
    asFiniteNumber(usage.thinking_tokens) ??
    asFiniteNumber(usage.thoughtsTokenCount);

  if (prompt === null || completion === null || total === null) return undefined;
  return { prompt, completion, total, reasoning };
}

/**
 * Effort attestation — the evidence analogue of model attestation.
 *
 * Model identity is self-reported: the provider echoes `model` and
 * modelMatches() compares it. Reasoning effort is NOT self-reported — no
 * OpenAI-compatible response echoes `reasoning.effort` back — so there is
 * nothing to string-compare, and pretending otherwise would be a check that
 * always passes.
 *
 * What IS observable is whether the model reasoned at all. A seat that
 * declares a non-"none" effort and then reports ZERO reasoning tokens either
 * had its effort silently dropped or was routed to a non-reasoning path; both
 * mean the run's declared effort misdescribes how the verdict was produced.
 * That is the failure the gemini seat hid for six weeks.
 *
 * Deliberately conservative:
 *   PASS         declared effort "none", or reasoning tokens > 0
 *   FAIL         declared a real effort, provider reported reasoning = 0
 *   UNVERIFIABLE provider reported no reasoning field at all
 *
 * UNVERIFIABLE is not a pass. It is recorded so a substrate that never
 * reports reasoning tokens is visible as a gap rather than counted as proof.
 */
export type EffortVerification = "PASS" | "FAIL" | "UNVERIFIABLE";

export function verifyEffortEvidence(
  declaredEffort: ReasoningEffort | undefined,
  tokens: TokenUsage | null | undefined
): EffortVerification {
  if (!declaredEffort || declaredEffort === "none") return "PASS";
  if (!tokens || tokens.reasoning === null) return "UNVERIFIABLE";
  return tokens.reasoning > 0 ? "PASS" : "FAIL";
}

function usageUnavailableReason(
  usage: Record<string, unknown> | undefined,
  tokens: TokenUsage | undefined
): UsageUnavailableReason | undefined {
  if (tokens) return undefined;
  return usage ? "usage_unrecognized" : "usage_absent";
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolveWait) => setTimeout(resolveWait, ms));
}

async function withLedgerLock<T>(runDir: string, fn: () => Promise<T>): Promise<T> {
  const lockPath = resolve(runDir, `${LEDGER_NAME}.lock`);
  const deadline = Date.now() + 30000;

  while (true) {
    try {
      const handle = await open(lockPath, "wx");
      await handle.close();
      break;
    } catch (error) {
      const code = isRecord(error) && typeof error.code === "string" ? error.code : null;
      if (code !== "EEXIST" || Date.now() >= deadline) {
        throw new Error(`[FAIL ledger_lock_unavailable] ${lockPath}`);
      }
      await wait(50);
    }
  }

  try {
    return await fn();
  } finally {
    await rm(lockPath, { force: true });
  }
}

// ---------------------------------------------------------------------------
// Member recipes — single source of truth for every provider quirk
//
// When a recipe quirk changes (model rev, header rename, body shape), edit
// ONE entry below. The dispatcher and all five members share this table.
// ---------------------------------------------------------------------------

const FOUNDRY_BASE = "https://pspace-ai-foundry.cognitiveservices.azure.com";
const FOUNDRY_API_VERSION = "2024-08-01-preview";
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const BEDROCK_MISTRAL_LARGE3_MODEL = "mistral.mistral-large-3-675b-instruct";
const FACILITATOR_VERSION = "council-facilitator@1.2.0";

function openRouterMistralModel(): string {
  const configured = process.env.OPENROUTER_MISTRAL_MODEL?.trim();
  return configured && configured.length > 0 ? configured : "mistralai/mistral-large-2512";
}

function bedrockMistralRegion(): string {
  return process.env.BEDROCK_MISTRAL_REGION?.trim() || process.env.AWS_REGION?.trim() || "";
}

const MEMBERS: Record<MemberId, MemberRecipe> = {
  // -----------------------------------------------------------------------
  // claude — Anthropic Messages API direct
  // -----------------------------------------------------------------------
  claude: {
    id: "claude",
    substrate: "anthropic-direct",
    declaredModel: "claude-fable-5-1 (anthropic-direct, adaptive-thinking, effort=high)",
    requiredEnv: ["ANTHROPIC_API_KEY"],
    // Direct fallback moved Opus 4.8 -> Fable 5.1 (user-directed, 2026-09-03,
    // pfi-collaboration) so the fallback seats the same model as the OpenRouter
    // route. Adaptive thinking at effort=high draws thinking tokens from the
    // SAME max_tokens pool as visible output. Starting low (8192/16384)
    // truncates the corpus before completion (stop_reason=max_tokens). Fable 5.1
    // supports 128k max output, so we start at a real-headroom value and escalate.
    defaultMaxTokens: 32768,
    maxTokensCeiling: 65536,
    endpoint: () => "https://api.anthropic.com/v1/messages",
    headers: () => ({
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    }),
    buildBody: ({ userPrompt, systemPrompt, maxTokens }) => {
      const body: Record<string, unknown> = {
        model: "claude-fable-5-1",
        thinking: { type: "adaptive" },
        output_config: { effort: "high" },
        max_tokens: maxTokens,
        messages: [{ role: "user", content: userPrompt }],
      };
      if (systemPrompt) {
        body.system = systemPrompt;
      }
      return body;
    },
    extractContent: (r: unknown) => {
      const blocks = field(r, "content");
      if (!Array.isArray(blocks)) return "";
      return blocks
        .filter((b: unknown) => field(b, "type") === "text" && typeof field(b, "text") === "string")
        .map((b: unknown) => field(b, "text") as string)
        .join("");
    },
    extractModelField: (r: unknown) => asString(field(r, "model")),
    modelMatches: (observed: string) =>
      observed === "claude-fable-5-1" || observed.startsWith("claude-fable-5-1-"),
    wasTruncated: (r: unknown) => field(r, "stop_reason") === "max_tokens",
  },

  // -----------------------------------------------------------------------
  // gpt — Azure AI Foundry, GPT-5.5 deployment, openai-compat shape,
  //       reasoning_effort=xhigh, uses max_completion_tokens
  // -----------------------------------------------------------------------
  gpt: {
    id: "gpt",
    substrate: "foundry-direct",
    declaredModel: "gpt-5.5 (azure-foundry-direct, reasoning_effort=xhigh)",
    requiredEnv: ["AZURE_AI_API_KEY"],
    defaultMaxTokens: 16384,
    maxTokensCeiling: 32768,
    endpoint: () =>
      `${FOUNDRY_BASE}/openai/deployments/gpt-5.5/chat/completions?api-version=${FOUNDRY_API_VERSION}`,
    headers: () => ({
      "api-key": process.env.AZURE_AI_API_KEY ?? "",
      "Content-Type": "application/json",
    }),
    buildBody: ({ userPrompt, systemPrompt, maxTokens }) => {
      const messages: Array<Record<string, string>> = [];
      if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
      messages.push({ role: "user", content: userPrompt });
      return {
        messages,
        max_completion_tokens: maxTokens,
        reasoning_effort: "xhigh",
      };
    },
    extractContent: (r: unknown) =>
      asString(fieldPath(r, "choices", 0, "message", "content")) ?? "",
    extractModelField: (r: unknown) => asString(field(r, "model")),
    // Observed is `gpt-5.5-<datecode>` e.g. `gpt-5.5-2026-04-24`
    modelMatches: (observed: string) => observed.startsWith("gpt-5.5"),
    wasTruncated: (r: unknown) => fieldPath(r, "choices", 0, "finish_reason") === "length",
  },

  // -----------------------------------------------------------------------
  // gemini — Google AI Studio (Generative Language API), gemini-3.1-pro-preview
  //          Uses location=global semantics (no project pinning needed via this
  //          surface — see research log 2026-05-22 for the AI Studio vs Vertex
  //          pivot rationale)
  // -----------------------------------------------------------------------
  gemini: {
    id: "gemini",
    substrate: "ai-studio",
    declaredModel: "gemini-3.1-pro-preview (ai-studio)",
    requiredEnv: ["GOOGLE_AI_API_KEY"],
    defaultMaxTokens: 8192,
    maxTokensCeiling: 32768,
    endpoint: () =>
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent",
    headers: () => ({
      "X-goog-api-key": process.env.GOOGLE_AI_API_KEY ?? "",
      "Content-Type": "application/json",
    }),
    buildBody: ({ userPrompt, systemPrompt, maxTokens }) => {
      const body: Record<string, unknown> = {
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
      };
      if (systemPrompt) {
        body.systemInstruction = { parts: [{ text: systemPrompt }] };
      }
      return body;
    },
    extractContent: (r: unknown) => {
      const parts = fieldPath(r, "candidates", 0, "content", "parts");
      if (!Array.isArray(parts)) return "";
      return parts
        .filter((p: unknown) => typeof field(p, "text") === "string")
        .map((p: unknown) => field(p, "text") as string)
        .join("");
    },
    extractModelField: (r: unknown) => asString(field(r, "modelVersion")),
    modelMatches: (observed: string) => observed === "gemini-3.1-pro-preview",
    // Gemini's finishReason: "MAX_TOKENS" indicates truncation
    wasTruncated: (r: unknown) => fieldPath(r, "candidates", 0, "finishReason") === "MAX_TOKENS",
  },

  // -----------------------------------------------------------------------
  // kimi — Azure AI Foundry, Kimi-K2.6 deployment, openai-compat shape.
  //        Uses max_tokens (NOT max_completion_tokens). Reasoning preamble
  //        can eat short budgets; ≥256 minimum per azure-ai-foundry-quirks.md.
  // -----------------------------------------------------------------------
  kimi: {
    id: "kimi",
    substrate: "foundry-direct",
    declaredModel: "Kimi-K2.6 (Azure AI Foundry)",
    requiredEnv: ["AZURE_AI_API_KEY"],
    defaultTransport: "sse",
    supportsSse: true,
    defaultMaxTokens: 8192,
    maxTokensCeiling: 32768,
    endpoint: () =>
      `${FOUNDRY_BASE}/openai/deployments/Kimi-K2.6/chat/completions?api-version=${FOUNDRY_API_VERSION}`,
    headers: () => ({
      "api-key": process.env.AZURE_AI_API_KEY ?? "",
      "Content-Type": "application/json",
    }),
    buildBody: ({ userPrompt, systemPrompt, maxTokens, transport }) => {
      const messages: Array<Record<string, string>> = [];
      if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
      messages.push({ role: "user", content: userPrompt });
      const body: Record<string, unknown> = { messages, max_tokens: maxTokens };
      if (transport === "sse") {
        body.stream = true;
        body.stream_options = { include_usage: true };
      }
      return body;
    },
    extractContent: (r: unknown) =>
      asString(fieldPath(r, "choices", 0, "message", "content")) ?? "",
    extractModelField: (r: unknown) => asString(field(r, "model")),
    modelMatches: (observed: string) => observed === "Kimi-K2.6" || observed === "kimi-k2.6",
    wasTruncated: (r: unknown) => fieldPath(r, "choices", 0, "finish_reason") === "length",
  },

  // -----------------------------------------------------------------------
  // mistral — Azure AI Foundry, Mistral-Large-3 deployment, openai-compat.
  //           HARD: must use max_tokens — max_completion_tokens returns HTTP 422.
  // -----------------------------------------------------------------------
  mistral: {
    id: "mistral",
    substrate: "foundry-direct",
    declaredModel: "Mistral-Large-3 (Azure AI Foundry)",
    requiredEnv: ["AZURE_AI_API_KEY"],
    supportsSse: true,
    defaultMaxTokens: 8192,
    maxTokensCeiling: 32768,
    endpoint: () =>
      `${FOUNDRY_BASE}/openai/deployments/Mistral-Large-3/chat/completions?api-version=${FOUNDRY_API_VERSION}`,
    headers: () => ({
      "api-key": process.env.AZURE_AI_API_KEY ?? "",
      "Content-Type": "application/json",
    }),
    buildBody: ({ userPrompt, systemPrompt, maxTokens, transport }) => {
      const messages: Array<Record<string, string>> = [];
      if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
      messages.push({ role: "user", content: userPrompt });
      const body: Record<string, unknown> = { messages, max_tokens: maxTokens };
      if (transport === "sse") {
        body.stream = true;
        body.stream_options = { include_usage: true };
      }
      return body;
    },
    extractContent: (r: unknown) =>
      asString(fieldPath(r, "choices", 0, "message", "content")) ?? "",
    extractModelField: (r: unknown) => asString(field(r, "model")),
    modelMatches: (observed: string) =>
      observed === "mistral-large-3" || observed === "Mistral-Large-3",
    wasTruncated: (r: unknown) => fieldPath(r, "choices", 0, "finish_reason") === "length",
  },
};

const MISTRAL_OPENROUTER_RECIPE: MemberRecipe = {
  id: "mistral",
  substrate: "openrouter",
  declaredModel: `${openRouterMistralModel()} (OpenRouter primary for Mistral)`,
  requiredEnv: ["OPENROUTER_API_KEY"],
  supportsSse: true,
  // Start at the ceiling (2026-09-03): Mistral Large 3's catalogue maximum is
  // 209715 completion tokens; 8192/32768 capped a non-reasoning seat's visible
  // answer at a fraction of what its peers may write.
  defaultMaxTokens: 131072,
  maxTokensCeiling: 131072,
  endpoint: () => `${OPENROUTER_BASE}/chat/completions`,
  headers: () => ({
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY ?? ""}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://github.com/PossibilityTruthy/possibility-space",
    "X-Title": "Possibility Council Facilitator",
  }),
  buildBody: ({ userPrompt, systemPrompt, maxTokens, transport }) => {
    const messages: Array<Record<string, string>> = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: userPrompt });
    const body: Record<string, unknown> = {
      model: openRouterMistralModel(),
      messages,
      max_tokens: maxTokens,
      temperature: 0.3,
    };
    if (transport === "sse") {
      body.stream = true;
      body.stream_options = { include_usage: true };
    }
    return body;
  },
  extractContent: (r: unknown) => asString(fieldPath(r, "choices", 0, "message", "content")) ?? "",
  extractModelField: (r: unknown) => asString(field(r, "model")),
  modelMatches: (observed: string) => {
    const requested = openRouterMistralModel().toLowerCase();
    const actual = observed.toLowerCase();
    const requestedLeaf = requested.split("/").pop() ?? requested;
    return (
      actual === requested ||
      actual === requestedLeaf ||
      (actual.includes("mistral") && actual.includes("large"))
    );
  },
  wasTruncated: (r: unknown) => fieldPath(r, "choices", 0, "finish_reason") === "length",
};

const MISTRAL_BEDROCK_RECIPE: MemberRecipe = {
  id: "mistral",
  substrate: "bedrock-runtime",
  declaredModel: `Mistral Large 3 (${BEDROCK_MISTRAL_LARGE3_MODEL}, Amazon Bedrock)`,
  requiredEnv: ["AWS_REGION"],
  defaultMaxTokens: 8192,
  maxTokensCeiling: 10000,
  modelIdentitySource: "facilitator_request_route",
  defaultTransport: "eventstream",
  supportsEventStream: true,
  endpoint: () =>
    `bedrock-runtime:converse:${bedrockMistralRegion()}:${BEDROCK_MISTRAL_LARGE3_MODEL}`,
  headers: () => ({}),
  buildBody: ({ userPrompt, systemPrompt, maxTokens }) => {
    const body: Record<string, unknown> = {
      modelId: BEDROCK_MISTRAL_LARGE3_MODEL,
      messages: [{ role: "user", content: [{ text: userPrompt }] }],
      inferenceConfig: { maxTokens, temperature: 0.3 },
    };
    if (systemPrompt) {
      body.system = [{ text: systemPrompt }];
    }
    return body;
  },
  extractContent: (r: unknown) => {
    const blocks = fieldPath(r, "output", "message", "content");
    if (!Array.isArray(blocks)) return "";
    return blocks
      .filter((block: unknown) => typeof field(block, "text") === "string")
      .map((block: unknown) => field(block, "text") as string)
      .join("");
  },
  extractModelField: (r: unknown) => asString(field(r, "modelId")),
  modelMatches: (observed: string) => observed === BEDROCK_MISTRAL_LARGE3_MODEL,
  wasTruncated: (r: unknown) => field(r, "stopReason") === "max_tokens",
};

// ---------------------------------------------------------------------------
// OpenRouter recipes — all-member route (--provider openrouter / COUNCIL_PROVIDER)
//
// One key (OPENROUTER_API_KEY), one OpenAI-compatible endpoint, every council
// seat. Slugs verified live 2026-06-13 against https://openrouter.ai/api/v1/models
// plus a per-seat chat-completions probe. Each seat is PINNED to a single
// `model` slug with NO `models[]` fallback array: OpenRouter may route across
// providers of the SAME model (infra backup) but must never substitute a
// DIFFERENT model — that would collapse the council's N-distinct-perspectives
// invariant. Identity is verified per call via the response `model` field
// (modelMatches below); the response also carries `provider` for cross-check.
// max_tokens is uniform — OpenRouter normalizes it to each provider's param
// (e.g. GPT-5.x max_completion_tokens). Each seat also requests its MAXIMUM
// reasoning effort via OpenRouter's unified reasoning.effort knob (`max` for
// Fable 5 + GPT-5.6 Sol; xhigh where that is the provider maximum; high where
// xhigh is unsupported); non-reasoning models omit it.
//
// Substrate tier is local_capture_provider_attested (same as direct-API): the
// Facilitator still captures + verifies the response model field. OpenRouter
// is the default operational substrate (one council key, every seat); direct
// provider APIs remain available explicitly via --provider direct as the
// max-independence fallback. See model-verification.md.
// ---------------------------------------------------------------------------

/**
 * An OpenRouter council seat: the pinned model slug + the maximum reasoning
 * effort that model accepts via OpenRouter. `effort: "none"` is for
 * non-reasoning models (no `reasoning` param is sent). Effort levels are
 * grounded on OpenRouter's reasoning docs (Anthropic Claude 4.7+ Opus supports
 * `xhigh`; GPT-5.x supports `xhigh` natively per the direct-API recipe) and are
 * VERIFIED MECHANICALLY, not by hope. The previous version of this comment
 * claimed an unsupported level "surfaces as a loud provider 400, never a
 * silent downgrade". That was false: the gemini seat carried effort=xhigh
 * from 2026-07-11 to 2026-08-27 against a model that advertises only
 * high/medium/low, and nothing ever complained. Seat efforts are now checked
 * against a pinned catalogue snapshot by tools/council/lint-council-seat-efforts.ts
 * (pre-commit + CI), and each run additionally attests reasoning EVIDENCE —
 * see verifyEffortEvidence below.
 */
/**
 * OpenRouter provider-routing preferences for a seat (the request-body
 * `provider` object). Used to pin a seat to a specific upstream provider — e.g.
 * the gpt seat routes via Azure, which serves the council-baseline gpt-5.5 with
 * far more RPM/TPM headroom than OpenAI's single-provider gpt-5.5 endpoint.
 * `allow_fallbacks: false` guarantees the request never silently lands on a
 * different (rate-capped) provider. Identity is still response-attested per
 * call, so a provider pin is an availability/throughput lever, NOT a trust
 * boundary. Docs: https://openrouter.ai/docs/guides/routing/provider-selection
 */
interface OpenRouterProviderPrefs {
  order?: string[];
  only?: string[];
  ignore?: string[];
  allow_fallbacks?: boolean;
  sort?: "price" | "throughput" | "latency";
}

export type ReasoningEffort = "minimal" | "low" | "medium" | "high" | "xhigh" | "max" | "none";

export interface OpenRouterSeat {
  slug: string;
  effort: ReasoningEffort;
  /**
   * The seat's output budget, requested as `max_tokens` on EVERY attempt (no
   * ramp). Reasoning tokens and visible content share this pool, so the seat
   * must start at its ceiling: a 16k first attempt cost the claude seat a
   * Step 1 (2026-09-03, founder-goal-alignment run: 16k then 32k of reasoning
   * with zero visible content, then two timeouts). Bounded above by the
   * model's `top_provider.max_completion_tokens`; the seat-effort lint checks
   * the snapshot and fails a seat that asks for more than its model allows.
   */
  maxOutputTokens: number;
  /** Optional provider-routing pin (e.g. gpt → Azure). Omitted = OpenRouter default routing. */
  provider?: OpenRouterProviderPrefs;
}

/**
 * Semantic match for an OpenRouter-served model against its pinned slug.
 * OpenRouter echoes the served model with provider-specific quirks observed
 * live 2026-06-13/14: a trailing numeric date/build (`openai/gpt-5.5` →
 * `openai/gpt-5.5-20260423`) AND token REORDERING (`anthropic/claude-opus-4.8`
 * → `anthropic/claude-4.8-opus-20260528`). So we match order-insensitively:
 * same provider, every name token of the pin present in the observed (multiset),
 * and any leftover observed token PURELY NUMERIC (a date/build stamp). A sibling
 * model (`gpt-5.5-pro` vs `gpt-5.5`, a `-fast`/`-mini` variant, or a different
 * version digit) leaves a missing pin token or a non-numeric leftover and is
 * correctly REJECTED — the pin can only be satisfied by the same model (any
 * ordering, any re-dated build), never a different one.
 */
export function openRouterModelMatches(slug: string, observed: string): boolean {
  const norm = (s: string) => s.toLowerCase().trim();
  if (norm(slug) === norm(observed)) return true;
  const parts = (s: string): { provider: string; tokens: string[] } => {
    const lower = norm(s);
    const slash = lower.indexOf("/");
    return {
      provider: slash >= 0 ? lower.slice(0, slash) : "",
      tokens: (slash >= 0 ? lower.slice(slash + 1) : lower).split(/[-.]/).filter(Boolean),
    };
  };
  const want = parts(slug);
  const got = parts(observed);
  if (want.provider !== got.provider) return false;
  const pool = [...got.tokens];
  for (const t of want.tokens) {
    const i = pool.indexOf(t);
    if (i === -1) return false; // a required model token is absent → different model
    pool.splice(i, 1);
  }
  // Leftover observed tokens must be a date/build stamp, never a model qualifier.
  return pool.every((t) => /^[0-9]+$/.test(t));
}

function openRouterRecipe(id: MemberId, seat: OpenRouterSeat): MemberRecipe {
  const { slug, effort, provider, maxOutputTokens } = seat;
  const providerNote = provider?.order?.length ? `, via ${provider.order.join("/")}` : "";
  return {
    id,
    substrate: "openrouter",
    declaredEffort: effort,
    declaredModel: `${slug} (OpenRouter${providerNote}${effort === "none" ? "" : `, effort=${effort}`})`,
    requiredEnv: ["OPENROUTER_API_KEY"],
    // Start AT the seat's ceiling (2026-09-03, pfi-collaboration): reasoning
    // tokens consume the max_tokens budget, and the 16384 -> 32768 -> 65536
    // ramp that used to live here spent three attempts and 25 minutes
    // discovering that a high-effort seat needed the whole ceiling. Quality
    // and completeness outrank token spend for council work; there is no
    // budget reason to ramp. History: ceiling 64000 -> 131072 (2026-08-13)
    // after Fable 5 at effort=max burned the full 64k on reasoning 3/3 attempts.
    defaultMaxTokens: maxOutputTokens,
    maxTokensCeiling: maxOutputTokens,
    endpoint: () => `${OPENROUTER_BASE}/chat/completions`,
    headers: () => ({
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY ?? ""}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/PossibilityTruthy/possibility-space",
      "X-Title": "Possibility Council Facilitator",
    }),
    buildBody: ({ userPrompt, systemPrompt, maxTokens }) => {
      const messages: Array<Record<string, string>> = [];
      if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
      messages.push({ role: "user", content: userPrompt });
      // Single pinned `model`, no `models[]` fallback — see block comment above.
      const body: Record<string, unknown> = {
        model: slug,
        messages,
        max_tokens: maxTokens,
        temperature: 0.3,
      };
      // Request the seat's maximum reasoning effort via OpenRouter's unified
      // reasoning.effort knob (mapped to each provider's native param).
      if (effort !== "none") body.reasoning = { effort };
      // Pin provider routing when set (e.g. gpt → Azure). allow_fallbacks:false
      // keeps the seat off other providers of the same model entirely.
      if (provider) body.provider = provider;
      return body;
    },
    extractContent: (r: unknown) =>
      asString(fieldPath(r, "choices", 0, "message", "content")) ?? "",
    extractModelField: (r: unknown) => asString(field(r, "model")),
    modelMatches: (observed: string) => openRouterModelMatches(slug, observed),
    wasTruncated: (r: unknown) => fieldPath(r, "choices", 0, "finish_reason") === "length",
  };
}

/**
 * The seat table: slug + effort + optional provider pin, as DATA.
 *
 * Exported so tools/council/lint-council-seat-efforts.ts can validate every seat's
 * effort against a pinned OpenRouter catalogue snapshot without importing the
 * whole invoker or parsing declaredModel strings. Keep this the single source
 * of seat configuration — the recipes below are derived from it.
 */
export const OPENROUTER_SEATS: Record<Exclude<MemberId, "mistral">, OpenRouterSeat> = {
  // Claude + GPT upgraded 2026-07-11 at user direction: Fable 5 and GPT-5.6
  // Sol expose 1M/1.05M context respectively and accept reasoning effort=max.
  // GPT is provider-pinned to OpenAI. The first full-corpus activation on the
  // Azure route returned two HTTP-200 empty envelopes (no model, no content)
  // after completing max-effort inference; OpenAI is the verified-correct
  // route for GPT-5.6 Sol. allow_fallbacks:false preserves deterministic
  // routing while response-model attestation remains the identity boundary.
  // Roster (user-directed, 2026-08-27): the Claude seat returns to Fable 5,
  // REVERSING the 2026-08-12 revision that moved it to Opus 5 and reserved
  // Fable for the orchestrator tier. Operator rationale: "we might as well use
  // the most advanced model for research" — for council deliberation the seat's
  // capability outranks the seat/orchestrator decorrelation the earlier ruling
  // was protecting. That tradeoff is real and is being accepted knowingly, not
  // forgotten: the member seat and the orchestrator now share a substrate.
  //
  // Effort stays xhigh across reasoning seats, not max: on bounded review
  // corpora max over-thinks (observed as 10-13 minute attempts and
  // reasoning-budget-exhausted empty envelopes during the F6 delta rounds).
  // Fable 5 -> Fable 5.1 (user-directed, 2026-09-03, pfi-collaboration): same
  // seat, same effort; OpenRouter lists anthropic/claude-fable-5.1 since
  // 2026-09-01 (canonical anthropic/claude-fable-5.1-20260831, 1M context,
  // 128k max output). The matcher tokenizes on [-.], so this pin requires the
  // trailing "1" token and rejects a served Fable 5.
  //
  // Effort revisited 2026-09-03 (pfi-collaboration, owner direction: quality
  // outranks time and token spend). The 08-12 "max over-thinks" ruling was a
  // budget/timeout finding, and those limits are now lifted (ceilings at the
  // model maximum, one-hour attempts). Seats move to their model's maximum
  // supported effort where the output arithmetic allows it:
  //   - gpt: xhigh -> max (used 10.6k reasoning of 128k at xhigh; headroom is ample).
  //   - kimi: high -> max (max is K3's own default; 6.5k reasoning at high; the
  //     seat gets a 262144 budget, four times the others').
  //   - claude: STAYS xhigh. At xhigh Fable 5.1 spent 54k of its 128k output cap
  //     on the founder-goal-alignment Step 1 (36k reasoning + 18k visible). max
  //     would plausibly push reasoning past the cap and reproduce the
  //     zero-visible-content failure, and the cap is the model's, not ours.
  //   - gemini: STAYS high, the model's ceiling (advertises high/medium/low).
  claude: {
    slug: "anthropic/claude-fable-5.1",
    effort: "xhigh",
    maxOutputTokens: 128000,
  },
  // effort is "high", NOT xhigh: Gemini 3.1 Pro Preview advertises only
  // high/medium/low. xhigh was configured here from 2026-07-11 until it was
  // caught by a full-roster effort audit on 2026-08-27 — reasoning is
  // mandatory on this model and its default effort is medium, so an
  // unsupported value either errors or silently falls back while the run
  // record still attests effort=xhigh. high is the real ceiling for this seat.
  gemini: { slug: "google/gemini-3.1-pro-preview", effort: "high", maxOutputTokens: 65536 },
  gpt: {
    slug: "openai/gpt-6-astra",
    effort: "max",
    maxOutputTokens: 128000,
    provider: { order: ["openai"], allow_fallbacks: false },
  },
  // Kimi K3 (user-directed, 2026-08-27), 2.8T open-weight multimodal reasoner:
  // 1.05M context against K2.6's 262K, and a far stronger general index (59.7
  // vs 45.1) — K2.6 was the weakest seat on the panel by a wide margin.
  //
  // K3 advertises max/high/low (no xhigh). It ran at high from 2026-08-27 to
  // 2026-09-03 while max was considered wrong for bounded corpora on
  // budget/time grounds; with those limits lifted it runs at max, its own
  // default. Output ceiling 262144: K3's catalogue maximum is 943718, and
  // 262144 is already four times the other reasoning seats' cap.
  kimi: { slug: "moonshotai/kimi-k3", effort: "max", maxOutputTokens: 262144 },
};

export const OPENROUTER_RECIPES: Record<MemberId, MemberRecipe> = {
  claude: openRouterRecipe("claude", OPENROUTER_SEATS.claude),
  gemini: openRouterRecipe("gemini", OPENROUTER_SEATS.gemini),
  gpt: openRouterRecipe("gpt", OPENROUTER_SEATS.gpt),
  kimi: openRouterRecipe("kimi", OPENROUTER_SEATS.kimi),
  // Mistral keeps its existing env-overridable recipe; Mistral-Large-3 is not a
  // reasoning model, so no effort param applies (highest effort = its default).
  mistral: MISTRAL_OPENROUTER_RECIPE,
};

export function selectRecipe(args: CliArgs): MemberRecipe {
  // OpenRouter is the council's default operational substrate. `direct` is an
  // explicit max-independence fallback; never silently selected because a
  // council key is missing.
  if (args.provider === "default" || args.provider === "openrouter") {
    return OPENROUTER_RECIPES[args.member];
  }
  if (args.provider === "direct") return MEMBERS[args.member];
  if (args.member === "mistral") {
    if (args.provider === "azure") return MEMBERS.mistral;
    if (args.provider === "bedrock") return MISTRAL_BEDROCK_RECIPE;
    return MISTRAL_OPENROUTER_RECIPE;
  }
  if (args.provider === "azure" || args.provider === "bedrock") {
    throw new Error(`--provider ${args.provider} is currently supported only for --member mistral`);
  }
  return MEMBERS[args.member];
}

function selectTransport(args: CliArgs, recipe: MemberRecipe): TransportMode {
  if (args.transport === "default") return recipe.defaultTransport ?? "buffered";
  if (args.transport === "sse" && !recipe.supportsSse) {
    throw new Error(`--transport sse is not supported for --member ${args.member}`);
  }
  if (args.transport === "eventstream" && !recipe.supportsEventStream) {
    throw new Error(`--transport eventstream is not supported for --member ${args.member}`);
  }
  return args.transport;
}

// ---------------------------------------------------------------------------
// Retry policy — which HTTP statuses / outcomes are retryable
//
// Model-mismatch is NEVER retried — that's the silent-substitution failure
// mode the council was built to detect, and auto-retrying would mask it.
// ---------------------------------------------------------------------------

interface RetryDecision {
  shouldRetry: boolean;
  reason: AttemptOutcome;
  bumpMaxTokens: boolean;
}

function classifyAttempt(args: {
  fetchError: Error | null;
  fetchErrorPhase?: FetchErrorPhase;
  httpStatus: number | null;
  observedModel: string | null;
  declaredMatches: boolean;
  contentLength: number;
  wasTruncated: boolean;
}): RetryDecision {
  const {
    fetchError,
    fetchErrorPhase,
    httpStatus,
    observedModel,
    declaredMatches,
    contentLength,
    wasTruncated,
  } = args;

  // 1. Transport-level failure (no HTTP response at all) — retry
  if (httpStatus === null) {
    return {
      shouldRetry: true,
      reason: fetchErrorPhase === "attempt_timeout" ? "attempt_timeout" : "transient_network",
      bumpMaxTokens: false,
    };
  }

  // 2. Rate limit — retry (with backoff respecting Retry-After elsewhere)
  if (httpStatus === 429) {
    return { shouldRetry: true, reason: "rate_limited", bumpMaxTokens: false };
  }

  // 3. Server error — retry
  if (httpStatus >= 500 && httpStatus < 600) {
    return { shouldRetry: true, reason: "transient_server_error", bumpMaxTokens: false };
  }

  // 4. Auth / bad-request — DO NOT retry (config or credentials are wrong)
  if (httpStatus >= 400 && httpStatus < 500) {
    return { shouldRetry: false, reason: "permanent_provider_error", bumpMaxTokens: false };
  }

  // 5. HTTP headers arrived, but the success body was unreadable or not valid
  // JSON. This is not model empty-content; it is a provider/transport body
  // failure after headers, so keep the class distinct for diagnostics.
  if (fetchError) {
    return {
      shouldRetry: true,
      reason: fetchErrorPhase === "response_body" ? "response_body_error" : "transient_network",
      bumpMaxTokens: false,
    };
  }

  // 6. HTTP 200+ but model identity does not match — HARD FAIL, never retry
  //    This is the silent-substitution detection the gate exists for.
  if (observedModel !== null && !declaredMatches) {
    return { shouldRetry: false, reason: "model_mismatch", bumpMaxTokens: false };
  }

  // 7. HTTP 200 but content is empty — reasoning preamble ate the budget.
  //    Retry with 2× max_tokens (capped at ceiling by the dispatcher).
  if (contentLength === 0) {
    return { shouldRetry: true, reason: "empty_content", bumpMaxTokens: true };
  }

  // 8. HTTP 200, content present, but truncated — bump budget and retry.
  if (wasTruncated) {
    return { shouldRetry: true, reason: "truncated_content", bumpMaxTokens: true };
  }

  // 9. Success
  return { shouldRetry: false, reason: "success", bumpMaxTokens: false };
}

export function responseWasTruncated(
  response: unknown,
  streamFinishReason: string | null | undefined,
  wasTruncated: (response: unknown) => boolean
): boolean {
  if (response !== null && response !== undefined) {
    return wasTruncated(response);
  }

  return (
    streamFinishReason === "length" ||
    streamFinishReason === "max_tokens" ||
    streamFinishReason === "MAX_TOKENS"
  );
}

// ---------------------------------------------------------------------------
// HTTP call with per-attempt timeout
// ---------------------------------------------------------------------------

interface FetchResult {
  ok: boolean;
  status: number | null;
  json: unknown;
  error: Error | null;
  errorPhase?: FetchErrorPhase;
  retryAfterMs: number | null;
  transport: TransportMode;
  responseHeaders?: Record<string, string>;
  responseBodySha256?: string;
  responseBodyPreview?: string;
  responseBodyParseError?: string;
  streamContent?: string;
  streamModelField?: string | null;
  streamFinishReason?: string | null;
  streamUsage?: Record<string, unknown>;
  streamEvents?: number;
  streamChunks?: number;
  streamDone?: boolean;
}

type FetchErrorPhase = "request" | "attempt_timeout" | "response_body";

const RESPONSE_BODY_PREVIEW_CHARS = 2048;
const DIAGNOSTIC_RESPONSE_HEADERS = [
  "content-type",
  "retry-after",
  "x-request-id",
  "x-ms-request-id",
  "x-ms-error-code",
  "x-ratelimit-limit-requests",
  "x-ratelimit-remaining-requests",
  "x-ratelimit-reset-requests",
  "x-ratelimit-limit-tokens",
  "x-ratelimit-remaining-tokens",
  "x-ratelimit-reset-tokens",
];

interface OpenAiSseState {
  contentParts: string[];
  observedModel: string | null;
  finishReason: string | null;
  usage?: Record<string, unknown>;
  events: number;
  chunks: number;
  done: boolean;
  errorMessage: string | null;
}

interface BedrockEventStreamState {
  contentParts: string[];
  finishReason: string | null;
  usage?: Record<string, unknown>;
  events: number;
  chunks: number;
  done: boolean;
  errorMessage: string | null;
  retryableError: boolean;
  permanentError: boolean;
}

function errorFromUnknown(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(typeof error === "string" ? error : JSON.stringify(error));
}

function previewResponseBody(bodyText: string): string | undefined {
  if (bodyText.length === 0) return undefined;
  return bodyText.length > RESPONSE_BODY_PREVIEW_CHARS
    ? `${bodyText.slice(0, RESPONSE_BODY_PREVIEW_CHARS)}…[truncated]`
    : bodyText;
}

function diagnosticResponseHeaders(headers: Headers): Record<string, string> | undefined {
  const captured: Record<string, string> = {};
  for (const header of DIAGNOSTIC_RESPONSE_HEADERS) {
    const value = headers.get(header);
    if (value !== null && value.trim().length > 0) captured[header] = value;
  }
  return Object.keys(captured).length > 0 ? captured : undefined;
}

function parseRetryAfterMs(headers: Headers): number | null {
  const retryAfter = headers.get("retry-after");
  if (!retryAfter) return null;
  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds)) return seconds * 1000;
  const dateMs = Date.parse(retryAfter);
  return Number.isFinite(dateMs) ? Math.max(0, dateMs - Date.now()) : null;
}

function createAttemptTimeoutError(timeoutMs: number): Error {
  const error = new Error(`Provider attempt exceeded ${timeoutMs}ms`);
  error.name = "AttemptTimeoutError";
  return error;
}

function hardTimeoutDelayMs(timeoutMs: number): number {
  const graceMs = Math.min(5000, Math.max(50, Math.round(timeoutMs * 0.1)));
  return timeoutMs + graceMs;
}

function extractProviderErrorMessage(json: unknown): string | undefined {
  const error = field(json, "error");
  if (typeof error === "string") return error;
  const message = asString(field(error, "message")) ?? asString(field(json, "message"));
  if (message) return message;
  const code = asString(field(error, "code")) ?? asString(field(json, "code"));
  if (code) return code;
  return undefined;
}

export async function callProvider(
  url: string,
  headers: Record<string, string>,
  body: Record<string, unknown>,
  timeoutMs: number
): Promise<FetchResult> {
  const controller = new AbortController();
  const abortTimeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
  let hardTimeoutHandle: ReturnType<typeof setTimeout> | undefined;

  const timeoutResult = new Promise<FetchResult>((resolveTimeout) => {
    hardTimeoutHandle = setTimeout(() => {
      controller.abort();
      resolveTimeout({
        ok: false,
        status: null,
        json: null,
        error: createAttemptTimeoutError(timeoutMs),
        errorPhase: "attempt_timeout",
        retryAfterMs: null,
        transport: "buffered",
      });
    }, hardTimeoutDelayMs(timeoutMs));
  });

  const providerCall = (async (): Promise<FetchResult> => {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const retryAfterMs = parseRetryAfterMs(response.headers);
    const responseHeaders = diagnosticResponseHeaders(response.headers);

    let bodyText = "";
    try {
      bodyText = await response.text();
    } catch (error) {
      const bodyError = errorFromUnknown(error);
      return {
        ok: false,
        status: response.status,
        json: null,
        error: bodyError,
        errorPhase: "response_body",
        retryAfterMs,
        transport: "buffered",
        responseHeaders,
      };
    }

    const responseBodySha256 = bodyText.length > 0 ? sha256(bodyText) : undefined;
    const responseBodyPreview = response.ok ? undefined : previewResponseBody(bodyText);
    let json: unknown = null;
    let responseBodyParseError: string | undefined;
    try {
      json = bodyText.trim().length > 0 ? JSON.parse(bodyText) : null;
    } catch (error) {
      const parseError = errorFromUnknown(error);
      responseBodyParseError = parseError.message;
      if (response.ok) {
        return {
          ok: false,
          status: response.status,
          json: null,
          error: parseError,
          errorPhase: "response_body",
          retryAfterMs,
          transport: "buffered",
          responseHeaders,
          responseBodySha256,
          responseBodyPreview: previewResponseBody(bodyText),
          responseBodyParseError,
        };
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      json,
      error: null,
      retryAfterMs,
      transport: "buffered",
      responseHeaders,
      responseBodySha256,
      responseBodyPreview,
      ...(responseBodyParseError ? { responseBodyParseError } : {}),
    };
  })().catch((error: unknown): FetchResult => {
    const requestError = errorFromUnknown(error);
    return {
      ok: false,
      status: null,
      json: null,
      error: requestError,
      errorPhase: requestError.name === "AbortError" ? "attempt_timeout" : "request",
      retryAfterMs: null,
      transport: "buffered",
    };
  });

  try {
    return await Promise.race([providerCall, timeoutResult]);
  } finally {
    clearTimeout(abortTimeoutHandle);
    if (hardTimeoutHandle) clearTimeout(hardTimeoutHandle);
  }
}

function parseAwsCliErrorCode(stderr: string): string | null {
  const match = stderr.match(/An error occurred \(([^)]+)\)/);
  return match ? match[1] : null;
}

function statusFromAwsCliError(stderr: string): number {
  const code = parseAwsCliErrorCode(stderr) ?? "";
  if (/Throttling|TooManyRequests|ServiceQuotaExceeded|RateLimit/i.test(code)) return 429;
  if (/InternalServer|ServiceUnavailable|ModelTimeout|ModelNotReady/i.test(code)) return 500;
  if (/AccessDenied|Unauthorized|UnrecognizedClient|InvalidSignature|ExpiredToken/i.test(code)) {
    return 403;
  }
  if (/ResourceNotFound/i.test(code)) return 404;
  return 400;
}

function isAwsCliTimeout(stderr: string): boolean {
  return /\b(Read|Connect) timeout on endpoint URL\b/i.test(stderr);
}

export async function callBedrockConverse(
  region: string,
  body: Record<string, unknown>,
  timeoutMs: number
): Promise<FetchResult> {
  const tempDir = await mkdtemp(resolve(tmpdir(), "council-bedrock-"));
  const inputPath = resolve(tempDir, "request.json");
  await writeFile(inputPath, JSON.stringify(body), "utf8");

  try {
    return await new Promise<FetchResult>((resolveResult) => {
      const child = spawn(
        "aws",
        [
          "bedrock-runtime",
          "converse",
          "--region",
          region,
          "--cli-connect-timeout",
          "60",
          "--cli-read-timeout",
          String(Math.max(1, Math.ceil(timeoutMs / 1000))),
          "--cli-input-json",
          `file://${inputPath}`,
          "--output",
          "json",
        ],
        {
          env: { ...process.env, AWS_PAGER: "" },
          stdio: ["ignore", "pipe", "pipe"],
        }
      );

      let stdout = "";
      let stderr = "";
      let timedOut = false;
      let resolved = false;

      const finish = (result: FetchResult): void => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeoutHandle);
        resolveResult(result);
      };

      const timeoutHandle = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");
      }, timeoutMs);

      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk: string) => {
        stdout += chunk;
      });
      child.stderr.on("data", (chunk: string) => {
        stderr += chunk;
      });

      child.on("error", (error) => {
        finish({
          ok: false,
          status: null,
          json: null,
          error,
          errorPhase: "request",
          retryAfterMs: null,
          transport: "buffered",
        });
      });

      child.on("close", (code) => {
        if (timedOut) {
          finish({
            ok: false,
            status: null,
            json: null,
            error: createAttemptTimeoutError(timeoutMs),
            errorPhase: "attempt_timeout",
            retryAfterMs: null,
            transport: "buffered",
          });
          return;
        }

        if (code !== 0) {
          const preview = previewResponseBody(stderr);
          if (isAwsCliTimeout(stderr)) {
            const timeoutError = new Error(
              preview ?? "AWS CLI Bedrock call timed out before returning a response"
            );
            timeoutError.name = "AwsCliTimeoutError";
            finish({
              ok: false,
              status: null,
              json: null,
              error: timeoutError,
              errorPhase: "attempt_timeout",
              retryAfterMs: null,
              transport: "buffered",
              responseBodySha256: stderr.length > 0 ? sha256(stderr) : undefined,
              responseBodyPreview: preview,
            });
            return;
          }
          const awsErrorCode = parseAwsCliErrorCode(stderr);
          const json = {
            error: {
              code: awsErrorCode ?? `aws-cli-exit-${code ?? "unknown"}`,
              message: preview ?? "AWS CLI Bedrock call failed without stderr output",
            },
          };
          finish({
            ok: false,
            status: statusFromAwsCliError(stderr),
            json,
            error: null,
            retryAfterMs: null,
            transport: "buffered",
            responseBodySha256: stderr.length > 0 ? sha256(stderr) : undefined,
            responseBodyPreview: preview,
          });
          return;
        }

        const responseBodySha256 = stdout.length > 0 ? sha256(stdout) : undefined;
        try {
          const parsed = stdout.trim().length > 0 ? JSON.parse(stdout) : null;
          const modelId = asString(field(body, "modelId"));
          finish({
            ok: true,
            status: 200,
            json: isRecord(parsed) && modelId ? { ...parsed, modelId } : parsed,
            error: null,
            retryAfterMs: null,
            transport: "buffered",
            responseBodySha256,
          });
        } catch (error) {
          const parseError = errorFromUnknown(error);
          finish({
            ok: false,
            status: 200,
            json: null,
            error: parseError,
            errorPhase: "response_body",
            retryAfterMs: null,
            transport: "buffered",
            responseBodySha256,
            responseBodyPreview: previewResponseBody(stdout),
            responseBodyParseError: parseError.message,
          });
        }
      });
    });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function isRecordWithMessage(value: unknown): value is { message?: unknown } {
  return isRecord(value);
}

function bedrockStreamExceptionMessage(event: ConverseStreamOutput): string | null {
  const eventRecord = event as Record<string, unknown>;
  for (const key of [
    "internalServerException",
    "modelStreamErrorException",
    "validationException",
    "throttlingException",
    "serviceUnavailableException",
  ]) {
    const value = eventRecord[key];
    if (!isRecordWithMessage(value)) continue;
    const message = asString(field(value, "message")) ?? JSON.stringify(value);
    return `${key}: ${message}`;
  }
  return null;
}

function bedrockStreamExceptionIsRetryable(event: ConverseStreamOutput): boolean {
  const eventRecord = event as Record<string, unknown>;
  return (
    eventRecord.internalServerException !== undefined ||
    eventRecord.modelStreamErrorException !== undefined ||
    eventRecord.throttlingException !== undefined ||
    eventRecord.serviceUnavailableException !== undefined
  );
}

function bedrockStreamExceptionIsPermanent(event: ConverseStreamOutput): boolean {
  return (event as Record<string, unknown>).validationException !== undefined;
}

function appendBedrockStreamEvent(
  event: ConverseStreamOutput,
  state: BedrockEventStreamState
): void {
  state.events += 1;

  if (event.contentBlockDelta?.delta?.text) {
    state.contentParts.push(event.contentBlockDelta.delta.text);
    state.chunks += 1;
  }

  if (event.messageStop?.stopReason) {
    state.finishReason = event.messageStop.stopReason;
    state.done = true;
  }

  if (event.metadata?.usage) {
    state.usage = JSON.parse(JSON.stringify(event.metadata.usage)) as Record<string, unknown>;
  }

  const exceptionMessage = bedrockStreamExceptionMessage(event);
  if (exceptionMessage) {
    state.errorMessage = exceptionMessage;
    state.retryableError = bedrockStreamExceptionIsRetryable(event);
    state.permanentError = bedrockStreamExceptionIsPermanent(event);
  }
}

async function callBedrockConverseStream(
  region: string,
  body: Record<string, unknown>,
  timeoutMs: number
): Promise<FetchResult> {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
  const modelId = asString(field(body, "modelId"));
  const state: BedrockEventStreamState = {
    contentParts: [],
    finishReason: null,
    events: 0,
    chunks: 0,
    done: false,
    errorMessage: null,
    retryableError: false,
    permanentError: false,
  };

  try {
    const client = new BedrockRuntimeClient({ region });
    const response = await client.send(new ConverseStreamCommand(body), {
      abortSignal: controller.signal,
    });

    if (!response.stream) {
      return {
        ok: false,
        status: 200,
        json: modelId ? { modelId } : null,
        error: new Error("Bedrock ConverseStream response stream was absent"),
        errorPhase: "response_body",
        retryAfterMs: null,
        transport: "eventstream",
        streamContent: "",
        streamModelField: modelId,
        streamFinishReason: state.finishReason,
        streamUsage: state.usage,
        streamEvents: state.events,
        streamChunks: state.chunks,
        streamDone: state.done,
      };
    }

    for await (const event of response.stream) {
      appendBedrockStreamEvent(event, state);
      if (state.errorMessage) break;
    }

    const content = state.contentParts.join("");
    const responseJson = {
      modelId,
      output: { message: { content: [{ text: content }] } },
      stopReason: state.finishReason,
      ...(state.usage ? { usage: state.usage } : {}),
    };
    const streamError = state.errorMessage
      ? new Error(state.errorMessage)
      : state.done
        ? null
        : new Error("Bedrock ConverseStream ended before messageStop");

    return {
      ok: streamError === null,
      status: state.permanentError ? 400 : state.retryableError ? 500 : 200,
      json: responseJson,
      error: streamError,
      errorPhase: streamError ? "response_body" : undefined,
      retryAfterMs: null,
      transport: "eventstream",
      streamContent: content,
      streamModelField: modelId,
      streamFinishReason: state.finishReason,
      streamUsage: state.usage,
      streamEvents: state.events,
      streamChunks: state.chunks,
      streamDone: state.done,
    };
  } catch (error) {
    const content = state.contentParts.join("");
    const normalizedError = errorFromUnknown(error);
    const aborted = normalizedError.name === "AbortError";
    return {
      ok: false,
      status: null,
      json: {
        modelId,
        output: { message: { content: [{ text: content }] } },
        stopReason: state.finishReason,
        ...(state.usage ? { usage: state.usage } : {}),
      },
      error: aborted ? createAttemptTimeoutError(timeoutMs) : normalizedError,
      errorPhase: aborted ? "attempt_timeout" : "request",
      retryAfterMs: null,
      transport: "eventstream",
      streamContent: content,
      streamModelField: modelId,
      streamFinishReason: state.finishReason,
      streamUsage: state.usage,
      streamEvents: state.events,
      streamChunks: state.chunks,
      streamDone: state.done,
    };
  } finally {
    clearTimeout(timeoutHandle);
  }
}

function appendOpenAiSseEvent(rawEvent: string, state: OpenAiSseState): void {
  const dataLines = rawEvent
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice("data:".length).trimStart());

  if (dataLines.length === 0) return;

  const payload = dataLines.join("\n").trim();
  if (payload.length === 0) return;
  if (payload === "[DONE]") {
    state.done = true;
    return;
  }

  state.events += 1;

  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch (error) {
    state.errorMessage = `Failed to parse SSE data payload: ${(error as Error).message}`;
    return;
  }

  const providerError = field(parsed, "error");
  if (isRecord(providerError)) {
    state.errorMessage = asString(field(providerError, "message")) ?? JSON.stringify(providerError);
  }

  const observedModel = asString(field(parsed, "model"));
  if (observedModel) state.observedModel = observedModel;

  const usage = field(parsed, "usage");
  if (isRecord(usage)) state.usage = usage;

  const choices = field(parsed, "choices");
  if (!Array.isArray(choices)) return;

  for (const choice of choices) {
    const deltaContent = asString(fieldPath(choice, "delta", "content"));
    if (deltaContent && deltaContent.length > 0) {
      state.contentParts.push(deltaContent);
      state.chunks += 1;
    }

    const messageContent = asString(fieldPath(choice, "message", "content"));
    if (messageContent && messageContent.length > 0) {
      state.contentParts.push(messageContent);
      state.chunks += 1;
    }

    const finishReason = asString(field(choice, "finish_reason"));
    if (finishReason !== null) state.finishReason = finishReason;
  }
}

function consumeOpenAiSseBuffer(
  pendingBuffer: string,
  state: OpenAiSseState,
  flush: boolean
): string {
  const normalized = pendingBuffer.replace(/\r\n/g, "\n");
  const events = normalized.split("\n\n");
  const remainder = flush ? "" : (events.pop() ?? "");

  for (const rawEvent of events) {
    if (rawEvent.trim().length === 0) continue;
    appendOpenAiSseEvent(rawEvent, state);
  }
  return remainder;
}

function buildSyntheticOpenAiResponse(state: OpenAiSseState): Record<string, unknown> {
  return {
    model: state.observedModel,
    choices: [
      {
        message: { content: state.contentParts.join("") },
        finish_reason: state.finishReason,
      },
    ],
    ...(state.usage ? { usage: state.usage } : {}),
  };
}

export async function callProviderSse(
  url: string,
  headers: Record<string, string>,
  body: Record<string, unknown>,
  timeoutMs: number
): Promise<FetchResult> {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
  const state: OpenAiSseState = {
    contentParts: [],
    observedModel: null,
    finishReason: null,
    events: 0,
    chunks: 0,
    done: false,
    errorMessage: null,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const retryAfterMs = parseRetryAfterMs(response.headers);
    const responseHeaders = diagnosticResponseHeaders(response.headers);

    if (!response.ok) {
      let bodyText = "";
      try {
        bodyText = await response.text();
      } catch (error) {
        const bodyError = errorFromUnknown(error);
        return {
          ok: false,
          status: response.status,
          json: null,
          error: bodyError,
          errorPhase: "response_body",
          retryAfterMs,
          transport: "sse",
          responseHeaders,
        };
      }

      const responseBodySha256 = bodyText.length > 0 ? sha256(bodyText) : undefined;
      const responseBodyPreview = previewResponseBody(bodyText);
      let json: unknown = null;
      let responseBodyParseError: string | undefined;
      try {
        json = bodyText.trim().length > 0 ? JSON.parse(bodyText) : null;
      } catch (error) {
        responseBodyParseError = errorFromUnknown(error).message;
      }
      return {
        ok: false,
        status: response.status,
        json,
        error: null,
        retryAfterMs,
        transport: "sse",
        responseHeaders,
        responseBodySha256,
        responseBodyPreview,
        ...(responseBodyParseError ? { responseBodyParseError } : {}),
      };
    }

    if (!response.body) {
      return {
        ok: false,
        status: response.status,
        json: buildSyntheticOpenAiResponse(state),
        error: new Error("SSE response body was absent"),
        retryAfterMs,
        transport: "sse",
        responseHeaders,
        streamContent: "",
        streamModelField: state.observedModel,
        streamFinishReason: state.finishReason,
        streamUsage: state.usage,
        streamEvents: state.events,
        streamChunks: state.chunks,
        streamDone: state.done,
      };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let pendingBuffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      pendingBuffer += decoder.decode(value, { stream: true });
      pendingBuffer = consumeOpenAiSseBuffer(pendingBuffer, state, false);
      if (state.errorMessage) break;
    }

    pendingBuffer += decoder.decode();
    consumeOpenAiSseBuffer(pendingBuffer, state, true);

    const content = state.contentParts.join("");
    const terminalStopFrame = state.finishReason === "stop";
    const streamError = state.errorMessage
      ? new Error(state.errorMessage)
      : state.done || terminalStopFrame
        ? null
        : new Error("SSE stream ended before [DONE] or terminal stop frame");

    return {
      ok: streamError === null,
      status: response.status,
      json: buildSyntheticOpenAiResponse(state),
      error: streamError,
      retryAfterMs,
      transport: "sse",
      streamContent: content,
      streamModelField: state.observedModel,
      streamFinishReason: state.finishReason,
      streamUsage: state.usage,
      streamEvents: state.events,
      streamChunks: state.chunks,
      streamDone: state.done,
    };
  } catch (err) {
    const content = state.contentParts.join("");
    return {
      ok: false,
      status: null,
      json: buildSyntheticOpenAiResponse(state),
      error: err instanceof Error ? err : new Error(String(err)),
      retryAfterMs: null,
      transport: "sse",
      streamContent: content,
      streamModelField: state.observedModel,
      streamFinishReason: state.finishReason,
      streamUsage: state.usage,
      streamEvents: state.events,
      streamChunks: state.chunks,
      streamDone: state.done,
    };
  } finally {
    clearTimeout(timeoutHandle);
  }
}

// ---------------------------------------------------------------------------
// CLI parsing — small, focused; no dependency on commander/yargs
// ---------------------------------------------------------------------------

interface CliArgs {
  member: MemberId;
  promptFile: string | null;
  promptInline: string | null;
  output: string;
  provenance: string | null;
  systemPromptFile: string | null;
  provider: ProviderRoute;
  transport: TransportPreference;
  maxTokens: number | null;
  maxRetries: number;
  retryBaseMs: number;
  perAttemptTimeoutMs: number;
  totalTimeoutMs: number;
  /** RC2/RC3 of #2991 — optional council-research cross-linking fields. */
  councilResearchRunId: string | null;
  phase: "phase-1" | "phase-2" | "phase-3" | "phase-4" | "phase-5" | null;
  /** RC3 of #2991 — orchestrator-staged source-hash manifest. */
  sourceManifestPath: string | null;
  /** RC3/RC5 of #2991 — orchestrator-supplied identity strings. */
  invokerAgentName: string | null;
}

function parseArgs(argv: string[]): CliArgs {
  const args: Partial<CliArgs> = {
    promptFile: null,
    promptInline: null,
    provenance: null,
    systemPromptFile: null,
    provider:
      process.env.COUNCIL_PROVIDER === "direct"
        ? "direct"
        : process.env.COUNCIL_PROVIDER === "openrouter"
          ? "openrouter"
          : "default",
    transport: "default",
    maxTokens: null,
    maxRetries: 3,
    retryBaseMs: 1000,
    // Opus 4.8 at effort=high emitting 32k+ tokens legitimately runs 5-6 min/attempt.
    // Prior 600s total cap aborted before the high-headroom attempt could complete.
    // 2026-09-03: 360 s per attempt aborted two Fable 5.1 attempts that were
    // still reasoning legitimately; quality outranks wall-clock for council work.
    perAttemptTimeoutMs: 3_600_000,
    totalTimeoutMs: 14_400_000,
    councilResearchRunId: null,
    phase: null,
    sourceManifestPath: null,
    invokerAgentName: null,
  };
  let i = 0;
  const expect = (flag: string): string => {
    i += 1;
    if (i >= argv.length) {
      throw new Error(`Missing value for ${flag}`);
    }
    return argv[i]!;
  };
  while (i < argv.length) {
    const a = argv[i]!;
    switch (a) {
      case "--member": {
        const v = expect(a);
        if (!(v in MEMBERS)) {
          throw new Error(`Unknown --member ${v}. Valid: ${Object.keys(MEMBERS).join(", ")}`);
        }
        args.member = v as MemberId;
        break;
      }
      case "--prompt-file":
        args.promptFile = expect(a);
        break;
      case "--prompt":
        args.promptInline = expect(a);
        break;
      case "--output":
        args.output = expect(a);
        break;
      case "--provenance":
        args.provenance = expect(a);
        break;
      case "--system-prompt-file":
        args.systemPromptFile = expect(a);
        break;
      case "--provider": {
        const v = expect(a);
        if (!["default", "openrouter", "direct", "azure", "bedrock"].includes(v)) {
          throw new Error(
            `Invalid --provider ${v}. Valid: default, openrouter, direct, azure, bedrock`
          );
        }
        args.provider = v as ProviderRoute;
        break;
      }
      case "--transport": {
        const v = expect(a);
        if (!["default", "buffered", "sse", "eventstream"].includes(v)) {
          throw new Error(`Invalid --transport ${v}. Valid: default, buffered, sse, eventstream`);
        }
        args.transport = v as TransportPreference;
        break;
      }
      case "--max-tokens":
        args.maxTokens = parseInt(expect(a), 10);
        break;
      case "--max-retries":
        args.maxRetries = parseInt(expect(a), 10);
        break;
      case "--retry-base-ms":
        args.retryBaseMs = parseInt(expect(a), 10);
        break;
      case "--no-retry":
        args.maxRetries = 0;
        break;
      case "--per-attempt-timeout-ms":
        args.perAttemptTimeoutMs = parseInt(expect(a), 10);
        break;
      case "--total-timeout-ms":
        args.totalTimeoutMs = parseInt(expect(a), 10);
        break;
      case "--council-research-run-id":
        args.councilResearchRunId = expect(a);
        break;
      case "--phase": {
        const v = expect(a);
        if (!["phase-1", "phase-2", "phase-3", "phase-4", "phase-5"].includes(v)) {
          throw new Error(`Invalid --phase ${v}. Valid: phase-1..phase-5`);
        }
        args.phase = v as CliArgs["phase"];
        break;
      }
      case "--source-manifest":
        args.sourceManifestPath = expect(a);
        break;
      case "--invoker-agent-name":
        args.invokerAgentName = expect(a);
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break; // unreachable after process.exit; satisfies no-fallthrough
      default:
        throw new Error(`Unknown argument: ${a}`);
    }
    i += 1;
  }
  if (!args.member) throw new Error("--member is required");
  if (!args.output) throw new Error("--output is required");
  if (!args.promptFile && !args.promptInline) {
    throw new Error("One of --prompt-file or --prompt is required");
  }
  if (args.promptFile && args.promptInline) {
    throw new Error("Pass only one of --prompt-file or --prompt, not both");
  }
  // RC2/RC3 of #2991: --council-research-run-id and --phase travel together.
  // Either both are set (council-research Phase-4 dispatch) or both are null
  // (standalone council run under research/council-runs/**).
  if ((args.councilResearchRunId == null) !== (args.phase == null)) {
    throw new Error(
      "--council-research-run-id and --phase must both be supplied (or neither) — see " +
        ".claude/skills/council-research/references/provenance-schema.md § Phase 4"
    );
  }
  return args as CliArgs;
}

function printHelp(): void {
  console.log(`Council Facilitator — direct-API dispatcher for council member invocations

Usage:
  npx tsx tools/council/council-invoke.ts --member <id> \\
    (--prompt-file <path> | --prompt "inline") \\
    --output <path> [options]

Required:
  --member <claude|gemini|gpt|kimi|mistral>
  --output <path>                       Where assistant text content is written
  --prompt-file <path>  OR  --prompt "inline"

Options:
  --provenance <path>                   default: <output>.provenance.json
  --system-prompt-file <path>
  --source-manifest <path>              embed and verify source files before provider call
  --provider default|openrouter|direct|azure|bedrock   default=OpenRouter for all; direct=max-independence fallback; Azure/Bedrock are Mistral-only backups
  --transport default|buffered|sse|eventstream
                                      default: member preference; Kimi defaults to SSE; Bedrock defaults to EventStream
  --max-tokens N                        member default if omitted
  --max-retries N                       default 3 (0 disables retries)
  --retry-base-ms N                     default 1000 (exp. backoff base)
  --no-retry                            convenience for --max-retries=0
  --per-attempt-timeout-ms N            default 360000
  --total-timeout-ms N                  default 1800000

Exit codes:
  0  success
  1  retries_exhausted_transient
  2  retries_exhausted_empty_content
  3  model_mismatch_no_retry  (NEVER auto-retried)
  4  local_config_error  (provenance NOT written; pre-call error)
  5  permanent_provider_error
`);
}

// ---------------------------------------------------------------------------
// Main dispatcher
// ---------------------------------------------------------------------------

const EXIT = {
  success: 0,
  retries_exhausted_transient: 1,
  retries_exhausted_empty_content: 2,
  model_mismatch_no_retry: 3,
  local_config_error: 4,
  permanent_provider_error: 5,
} as const;

function sha256(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

function sha256Bytes(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function readPromptIfFile(
  promptFile: string | null,
  promptInline: string | null
): Promise<string> {
  if (promptFile) return readFile(resolve(promptFile), "utf8");
  return promptInline ?? "";
}

async function main(): Promise<number> {
  let args: CliArgs;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`[FAIL local_config_error] ${(err as Error).message}`);
    return EXIT.local_config_error;
  }

  let recipe: MemberRecipe;
  try {
    recipe = selectRecipe(args);
  } catch (err) {
    console.error(`[FAIL local_config_error] ${(err as Error).message}`);
    return EXIT.local_config_error;
  }

  let transport: TransportMode;
  try {
    transport = selectTransport(args, recipe);
  } catch (err) {
    console.error(`[FAIL local_config_error] ${(err as Error).message}`);
    return EXIT.local_config_error;
  }

  // ---- Preflight: required env vars ---------------------------------------
  for (const envVar of recipe.requiredEnv) {
    if (!process.env[envVar] || process.env[envVar] === "") {
      console.error(
        `[FAIL local_config_error] Required env var ${envVar} is not set for member=${args.member}. ` +
          `This script only uses the selected facilitator route (${recipe.substrate}); ` +
          `fix the env or select an explicitly supported backup route.`
      );
      return EXIT.local_config_error;
    }
  }

  // ---- Load prompts -------------------------------------------------------
  let userPrompt: string;
  let systemPrompt: string | null = null;
  try {
    userPrompt = await readPromptIfFile(args.promptFile, args.promptInline);
    if (args.systemPromptFile) {
      systemPrompt = await readFile(resolve(args.systemPromptFile), "utf8");
    }
  } catch (err) {
    console.error(
      `[FAIL local_config_error] Failed to read prompt file: ${(err as Error).message}`
    );
    return EXIT.local_config_error;
  }

  if (userPrompt.trim().length === 0) {
    console.error(`[FAIL local_config_error] User prompt is empty.`);
    return EXIT.local_config_error;
  }

  // ---- Brake #5: source manifest embedding --------------------------------
  // Load the manifest early so its contents can be embedded into the user
  // prompt (members are stateless and cannot read repo files themselves).
  // The same manifest is reused below to populate provenance arrays.
  let sourceManifest: SourceManifest | null = null;
  if (args.sourceManifestPath) {
    try {
      sourceManifest = await loadSourceManifest(args.sourceManifestPath);
    } catch (err) {
      console.error(`[FAIL local_config_error] ${(err as Error).message}`);
      return EXIT.local_config_error;
    }
    try {
      userPrompt = await embedSourcesIntoPrompt(
        userPrompt,
        sourceManifest,
        args.sourceManifestPath
      );
    } catch (err) {
      console.error(`[FAIL local_config_error] ${(err as Error).message}`);
      return EXIT.local_config_error;
    }
  }

  const outputPath = resolve(args.output);
  const provenancePath = resolve(args.provenance ?? `${args.output}.provenance.json`);

  // Ensure output directories exist
  await mkdir(dirname(outputPath), { recursive: true });
  if (dirname(provenancePath) !== dirname(outputPath)) {
    await mkdir(dirname(provenancePath), { recursive: true });
  }

  // ---- Retry loop ---------------------------------------------------------
  const runStart = Date.now();
  const startedAt = new Date(runStart).toISOString();
  let currentMaxTokens = args.maxTokens ?? recipe.defaultMaxTokens;
  if (currentMaxTokens > recipe.maxTokensCeiling) {
    currentMaxTokens = recipe.maxTokensCeiling;
  }

  const attempts: AttemptRecord[] = [];
  let finalOutcome: FinalOutcome = "retries_exhausted_transient";
  let finalObservedModel: string | null = null;
  let finalVerification: Provenance["final"]["verification"]["result"] = "UNVERIFIABLE";
  let finalContent = "";
  let finalUsage: Record<string, unknown> | undefined;
  let finalTokens: TokenUsage | null | undefined;
  let finalUsageUnavailable: UsageUnavailableReason | undefined;
  let lastWaitBeforeMs: number | undefined;

  const totalAttemptsAllowed = args.maxRetries + 1; // initial + retries
  let attemptIdx = 0;

  while (attemptIdx < totalAttemptsAllowed) {
    attemptIdx += 1;

    // Total wall-clock guard
    if (Date.now() - runStart > args.totalTimeoutMs) {
      console.error(
        `[FAIL retries_exhausted_transient] Total wall-clock timeout (${args.totalTimeoutMs}ms) exceeded before attempt ${attemptIdx}.`
      );
      finalOutcome = "retries_exhausted_transient";
      break;
    }

    const attemptStartMs = Date.now();
    const attemptStartedAt = new Date(attemptStartMs).toISOString();
    const body = recipe.buildBody({
      userPrompt,
      systemPrompt,
      maxTokens: currentMaxTokens,
      transport,
    });
    const url = recipe.endpoint();
    const headers = recipe.headers();

    const fetchResult =
      recipe.substrate === "bedrock-runtime"
        ? transport === "eventstream"
          ? await callBedrockConverseStream(bedrockMistralRegion(), body, args.perAttemptTimeoutMs)
          : await callBedrockConverse(bedrockMistralRegion(), body, args.perAttemptTimeoutMs)
        : transport === "sse"
          ? await callProviderSse(url, headers, body, args.perAttemptTimeoutMs)
          : await callProvider(url, headers, body, args.perAttemptTimeoutMs);
    const durationMs = Date.now() - attemptStartMs;

    // Extract response signals
    const observedModel =
      fetchResult.streamModelField !== undefined
        ? fetchResult.streamModelField
        : fetchResult.json
          ? recipe.extractModelField(fetchResult.json)
          : null;
    const declaredMatches = observedModel !== null && recipe.modelMatches(observedModel);
    const content =
      fetchResult.streamContent !== undefined
        ? fetchResult.streamContent
        : fetchResult.json
          ? recipe.extractContent(fetchResult.json)
          : "";
    const finishReason =
      fetchResult.streamFinishReason !== undefined ? fetchResult.streamFinishReason : null;
    const truncated = responseWasTruncated(
      fetchResult.json,
      fetchResult.streamFinishReason,
      recipe.wasTruncated
    );
    // Different providers expose usage at different keys: OpenAI-shape under
    // `usage`, Google AI Studio under `usageMetadata`.
    const rawUsage =
      fetchResult.streamUsage ??
      field(fetchResult.json, "usage") ??
      field(fetchResult.json, "usageMetadata");
    const usage = isRecord(rawUsage) ? rawUsage : undefined;
    const tokens = normalizeTokenUsage(usage);
    const unavailableReason = usageUnavailableReason(usage, tokens);

    // Classify the attempt
    const decision = classifyAttempt({
      fetchError: fetchResult.error,
      fetchErrorPhase: fetchResult.errorPhase,
      httpStatus: fetchResult.status,
      observedModel,
      declaredMatches,
      contentLength: content.length,
      wasTruncated: truncated,
    });

    const isFinalAttempt = attemptIdx >= totalAttemptsAllowed;
    const willRetry = decision.shouldRetry && !isFinalAttempt;

    // Build the attempt record
    const record: AttemptRecord = {
      attempt: attemptIdx,
      started_at: attemptStartedAt,
      duration_ms: durationMs,
      max_tokens: currentMaxTokens,
      transport: fetchResult.transport,
      http_status: fetchResult.status,
      outcome: willRetry ? "retry" : decision.reason,
      outcome_reason: willRetry ? decision.reason : null,
      model_field: observedModel,
      finish_reason: finishReason,
      content_length: content.length,
      tokens: tokens ?? null,
    };
    if (observedModel !== null) {
      record.model_identity_source = recipe.modelIdentitySource ?? "provider_response";
    }
    if (lastWaitBeforeMs !== undefined) record.wait_before_ms = lastWaitBeforeMs;
    if (content.length > 0) record.content_sha256 = sha256(content);
    if (fetchResult.streamEvents !== undefined) record.stream_events = fetchResult.streamEvents;
    if (fetchResult.streamChunks !== undefined) record.stream_chunks = fetchResult.streamChunks;
    if (fetchResult.streamDone !== undefined) record.stream_done = fetchResult.streamDone;
    if (usage) record.usage = usage;
    if (unavailableReason) record.usage_unavailable = unavailableReason;
    if (fetchResult.retryAfterMs !== null) record.retry_after_ms = fetchResult.retryAfterMs;
    if (fetchResult.responseHeaders) record.response_headers = fetchResult.responseHeaders;
    if (fetchResult.responseBodySha256)
      record.response_body_sha256 = fetchResult.responseBodySha256;
    if (fetchResult.responseBodyPreview)
      record.response_body_preview = fetchResult.responseBodyPreview;
    if (fetchResult.responseBodyParseError) {
      record.response_body_parse_error = fetchResult.responseBodyParseError;
    }
    if (fetchResult.errorPhase) record.error_phase = fetchResult.errorPhase;
    const providerErrorMessage = extractProviderErrorMessage(fetchResult.json);
    if (fetchResult.error) record.error_message = fetchResult.error.message;
    else if (providerErrorMessage) record.error_message = providerErrorMessage;
    else if (fetchResult.responseBodyParseError) {
      record.error_message = fetchResult.responseBodyParseError;
    }
    if (decision.reason === "model_mismatch" && fetchResult.json) {
      // Capture the mismatch detail for the audit trail
      record.error_message = `Observed model "${observedModel ?? "(absent)"}" does not match declared "${recipe.declaredModel}". NEVER auto-retried.`;
    }
    attempts.push(record);

    // Console summary (one line per attempt)
    const summary =
      `attempt=${attemptIdx}/${totalAttemptsAllowed} ` +
      `transport=${fetchResult.transport} ` +
      `http=${fetchResult.status ?? "ERR"} ` +
      `model=${observedModel ?? "(none)"} ` +
      // Surface reasoning spend per attempt: a seat that declares an effort and
      // shows reasoning=0 is the silent-downgrade signature this line exists for.
      (recipe.declaredEffort && recipe.declaredEffort !== "none"
        ? `effort=${recipe.declaredEffort} reasoning=${tokens?.reasoning ?? "n/a"} `
        : "") +
      `content=${content.length}b ` +
      `outcome=${record.outcome}` +
      (record.outcome_reason ? `(${record.outcome_reason})` : "") +
      ` duration=${durationMs}ms`;
    console.error(summary);

    if (!willRetry) {
      // Terminal attempt — set final fields
      if (decision.reason === "success") {
        finalOutcome = "success";
        finalContent = content;
        finalObservedModel = observedModel;
        finalUsage = usage;
        finalTokens = tokens ?? null;
        finalUsageUnavailable = unavailableReason;
        finalVerification = "PASS";
      } else if (decision.reason === "model_mismatch") {
        finalOutcome = "model_mismatch_no_retry";
        finalObservedModel = observedModel;
        finalVerification = "FAIL";
      } else if (decision.reason === "permanent_provider_error") {
        finalOutcome = "permanent_provider_error";
        finalObservedModel = observedModel;
        finalVerification =
          observedModel === null ? "UNVERIFIABLE" : declaredMatches ? "PASS" : "FAIL";
      } else if (decision.reason === "empty_content" || decision.reason === "truncated_content") {
        finalOutcome = "retries_exhausted_empty_content";
        finalObservedModel = observedModel;
        finalVerification = declaredMatches
          ? "PASS"
          : observedModel === null
            ? "UNVERIFIABLE"
            : "FAIL";
      } else {
        finalOutcome = "retries_exhausted_transient";
        finalObservedModel = observedModel;
        finalVerification = "UNVERIFIABLE";
      }
      break;
    }

    // Going to retry — compute backoff
    let waitMs = args.retryBaseMs * Math.pow(2, attemptIdx - 1);
    if (decision.reason === "rate_limited" && fetchResult.retryAfterMs !== null) {
      waitMs = Math.max(waitMs, fetchResult.retryAfterMs);
    }
    lastWaitBeforeMs = waitMs;

    // For empty/truncated content, bump max_tokens
    if (decision.bumpMaxTokens) {
      const bumped = Math.min(currentMaxTokens * 2, recipe.maxTokensCeiling);
      console.error(
        `  → bumping max_tokens ${currentMaxTokens} → ${bumped} for next attempt (ceiling ${recipe.maxTokensCeiling})`
      );
      currentMaxTokens = bumped;
    }
    console.error(`  → waiting ${waitMs}ms before retry`);
    await sleep(waitMs);
  }

  // ---- Write content + provenance ---------------------------------------
  let fileArtifactSha256: string | undefined;
  if (finalOutcome === "success") {
    await writeFile(outputPath, finalContent, "utf8");
    fileArtifactSha256 = sha256Bytes(await readFile(outputPath));
  }

  // RC3 of #2991 — orchestrator-staged source-hash manifest. When supplied,
  // its `sources[]` entries populate the composite top-level arrays. When
  // absent, the arrays remain empty (Facilitator consumed prompt strings
  // only) — still a valid composite shape per
  // .claude/skills/council-research/references/provenance-schema.md § Phase 4.
  //
  // NOTE (Brake #5, council-facilitator@1.1.0): `sourceManifest` was already
  // loaded above (right after prompt load) so its verified contents could be
  // embedded into the user prompt. We reuse that load here for provenance.
  const sourceFilePaths: string[] = sourceManifest ? sourceManifest.sources.map((s) => s.path) : [];
  const sourceFileHashes: string[] = sourceManifest
    ? sourceManifest.sources.map((s) => s.sha256)
    : [];
  // Witness commits (#3696) — emitted only when the manifest declares them,
  // as a full parallel array (null per entry lacking one) so the digest
  // lint's length invariant holds. Legacy manifests emit no array at all.
  const manifestDeclaresCommits =
    sourceManifest?.sources.some((s) => s.source_commit !== undefined) ?? false;
  const sourceFileCommits: (string | null)[] =
    manifestDeclaresCommits && sourceManifest
      ? sourceManifest.sources.map((s) =>
          typeof s.source_commit === "string" ? s.source_commit : null
        )
      : [];
  const readTimestamps: string[] = sourceManifest
    ? sourceManifest.sources
        .map((s) => s.read_timestamp_utc)
        .filter((t): t is string => typeof t === "string")
    : [];

  const provenance: Provenance = {
    // ─── Composite top-level fields (RC2/RC3 of #2991) ───────────────────
    artifact_path: repoRelative(outputPath),
    ...(fileArtifactSha256 ? { output_file_sha256: fileArtifactSha256 } : {}),
    source_file_paths: sourceFilePaths,
    source_file_hashes: sourceFileHashes,
    ...(manifestDeclaresCommits ? { source_file_commits: sourceFileCommits } : {}),
    ...(readTimestamps.length > 0 ? { read_timestamps: readTimestamps } : {}),
    // Cross-linking fields — present only when invoked under a council-research run.
    ...(args.councilResearchRunId
      ? {
          schema_version: sourceManifest?.schema_version ?? "1.1.0",
          council_research_run_id: args.councilResearchRunId,
          phase: args.phase!,
          agent_name: args.member,
          invoker_agent_name: args.invokerAgentName ?? "council-research orchestrator",
          runtime: recipe.substrate,
          model: recipe.declaredModel,
          timestamp_utc: startedAt,
        }
      : {}),
    // ─── Council-skill / Facilitator-specific record ─────────────────────
    facilitator_version: FACILITATOR_VERSION,
    prev_verdict_sha256: null,
    member: args.member,
    declared_model: recipe.declaredModel,
    substrate: recipe.substrate,
    transport,
    endpoint: recipe.endpoint(),
    request: {
      started_at: startedAt,
      system_prompt_sha256: systemPrompt ? sha256(systemPrompt) : null,
      user_prompt_sha256: sha256(userPrompt),
    },
    attempts,
    final: {
      outcome: finalOutcome,
      assurance_tier:
        recipe.modelIdentitySource === "facilitator_request_route"
          ? "client_telemetry"
          : "local_capture_provider_attested",
      total_duration_ms: Date.now() - runStart,
      retries_used: Math.max(0, attempts.length - 1),
      ...(fileArtifactSha256 ? { file_artifact_sha256: fileArtifactSha256 } : {}),
      ...(finalUsage ? { usage: finalUsage } : {}),
      ...(finalTokens !== undefined ? { tokens: finalTokens } : {}),
      ...(finalUsageUnavailable ? { usage_unavailable: finalUsageUnavailable } : {}),
      verification: {
        result: finalVerification,
        match_kind:
          finalObservedModel === null
            ? "none"
            : recipe.modelMatches(finalObservedModel)
              ? "semantic"
              : "none",
        declared: recipe.declaredModel,
        observed: finalObservedModel,
        ...(finalObservedModel !== null
          ? { model_identity_source: recipe.modelIdentitySource ?? "provider_response" }
          : {}),
      },
      effort_verification: {
        result: verifyEffortEvidence(recipe.declaredEffort, finalTokens),
        declared: recipe.declaredEffort ?? null,
        evidence: "reasoning_tokens",
        observed_reasoning_tokens: finalTokens?.reasoning ?? null,
      },
    },
  };

  const runDir = findCouncilRunDir(outputPath);
  if (runDir) {
    await withLedgerLock(runDir, async () => {
      const ledgerPath = resolve(runDir, LEDGER_NAME);
      let previousVerdict: unknown | null = null;
      try {
        const ledger = await readFile(ledgerPath, "utf8");
        const lines = ledger.split("\n").filter((line) => line.trim().length > 0);
        if (lines.length > 0) previousVerdict = JSON.parse(lines[lines.length - 1] ?? "null");
      } catch (error) {
        const code = isRecord(error) && typeof error.code === "string" ? error.code : null;
        if (code !== "ENOENT") throw error;
      }

      const genesisHash = genesisSha256(runDir);
      if (genesisHash) provenance.genesis_sha256 = genesisHash;
      provenance.prev_verdict_sha256 = previousVerdict ? canonicalSha256(previousVerdict) : null;

      await writeFile(provenancePath, JSON.stringify(provenance, null, 2) + "\n", "utf8");
      await appendFile(ledgerPath, canonicalJson(provenance) + "\n", "utf8");
    });
  } else {
    await writeFile(provenancePath, JSON.stringify(provenance, null, 2) + "\n", "utf8");
  }

  if (finalOutcome === "success") {
    console.error(
      `✓ ${args.member} success — wrote ${finalContent.length}b to ${basename(outputPath)} ` +
        `(provenance: ${basename(provenancePath)})`
    );
    return EXIT.success;
  }

  // Non-success: still write an empty / partial-content file? No — the
  // orchestrator can detect failure from provenance.final.outcome. Writing
  // a stub content file would invite accidental downstream use. Provenance
  // is sufficient for the audit trail.

  console.error(
    `✗ ${args.member} ${finalOutcome} — provenance: ${basename(provenancePath)} ` +
      `(attempts: ${attempts.length}, verification: ${finalVerification})`
  );

  switch (finalOutcome) {
    case "model_mismatch_no_retry":
      return EXIT.model_mismatch_no_retry;
    case "retries_exhausted_empty_content":
      return EXIT.retries_exhausted_empty_content;
    case "permanent_provider_error":
      return EXIT.permanent_provider_error;
    default:
      return EXIT.retries_exhausted_transient;
  }
}

// Run the CLI only when invoked directly (`tsx tools/council/council-invoke.ts …`),
// not when imported by a unit test (importing must not execute main() /
// process.exit()). `resolve` + `__filename` are already in scope; the
// Facilitator's invocation path uses no symlink indirection.
if (process.argv[1] && resolve(process.argv[1]) === __filename) {
  main().then(
    (code) => process.exit(code),
    (err) => {
      console.error(`[FATAL] ${err?.stack ?? err}`);
      process.exit(EXIT.local_config_error);
    }
  );
}

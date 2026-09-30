/**
 * Exact-request assessment for offline staged source preparation (#577).
 * Usage: createCanonicalRequestAssessor({seats, userPrompt, counter}).
 * Counters are trusted caller code. This module never obtains credentials or
 * calls a provider. Unsupported counters cannot produce a verified plan.
 */
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import {
  embedSourcesIntoPrompt,
  selectRecipe,
  selectTransport,
} from "../council-invoke.ts";
import { candidateSha256 } from "./council-staged-sources.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const hash = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");
const hex = (value: unknown) =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const integer = (value: unknown) =>
  Number.isSafeInteger(value) && Number(value) >= 0;
const fail = (message: string): never => {
  const error = new Error(`budget_unverified: ${message}`);
  Object.assign(error, { code: "budget_unverified" });
  throw error;
};

export interface StagedSeatConfig {
  seat_id: string;
  member: "claude" | "gemini" | "gpt" | "kimi" | "mistral";
  provider: "default" | "openrouter" | "direct" | "azure" | "bedrock";
  transport: "default" | "buffered" | "sse" | "eventstream";
  context_ceiling: number;
  output_reservations: number[];
  recipe_sha256?: string;
}

export interface RequestCounter {
  identity: { id: string; revision: string; artifact_sha256: string };
  countRequest(input: {
    request_json: string;
    request_json_sha256: string;
    body: Record<string, unknown>;
    seat: StagedSeatConfig;
    model: string;
    transport: string;
  }): Promise<{
    verified: boolean;
    // Local measurements may be real while a hosted-route bound is unknown.
    // The assessor below requires verified:true and integer bounds before use.
    input_tokens_upper_bound: number | null;
    extra_overhead_tokens: number | null;
    measured_input_tokens?: number;
    reason?: string;
    counter_witness: {
      method: string;
      model: string;
      request_json_sha256: string;
      evidence: string;
      assumptions: string[];
      [key: string]: unknown;
    };
  }>;
}

type Candidate = {
  chunk_id: string;
  ranges: Record<string, unknown>[];
  source_manifest_path: string;
  source_manifest: { sources: { path: string; sha256: string }[] };
  files: { path: string; bytes: Buffer; sha256: string; byte_length: number }[];
};

/** Pins recipe behavior without touching endpoint/headers/credential functions. */
export async function describeStagedSeat(config: StagedSeatConfig) {
  if (
    !config ||
    !["claude", "gemini", "gpt", "kimi", "mistral"].includes(config.member) ||
    !["default", "openrouter", "direct", "azure", "bedrock"].includes(
      config.provider,
    ) ||
    !["default", "buffered", "sse", "eventstream"].includes(config.transport) ||
    !config.seat_id ||
    !integer(config.context_ceiling) ||
    config.context_ceiling < 1 ||
    !Array.isArray(config.output_reservations) ||
    !config.output_reservations.length
  ) {
    fail("invalid frozen seat configuration");
  }
  const recipe = selectRecipe(config as Parameters<typeof selectRecipe>[0]);
  const transport = selectTransport(
    config as Parameters<typeof selectTransport>[0],
    recipe,
  );
  for (const n of config.output_reservations) {
    if (
      !integer(n) ||
      n < recipe.defaultMaxTokens ||
      n > recipe.maxTokensCeiling
    ) {
      fail("output reservation must preserve the recipe default and ceiling");
    }
  }
  const facilitator_sha256 = hash(
    await readFile(resolve(ROOT, "scripts/council-invoke.ts")),
  );
  const descriptor = {
    facilitator_sha256,
    member: config.member,
    provider: config.provider,
    transport,
    declared_model: recipe.declaredModel,
    substrate: recipe.substrate,
    default_max_tokens: recipe.defaultMaxTokens,
    max_tokens_ceiling: recipe.maxTokensCeiling,
    request_templates: config.output_reservations.map((maxTokens) =>
      recipe.buildBody({
        userPrompt: "",
        systemPrompt: null,
        maxTokens,
        transport,
      }),
    ),
  };
  const recipe_sha256 = hash(JSON.stringify(descriptor));
  if (
    config.recipe_sha256 !== undefined &&
    config.recipe_sha256 !== recipe_sha256
  ) {
    fail("frozen recipe changed");
  }
  return {
    seat_id: config.seat_id,
    recipe_sha256,
    context_ceiling: config.context_ceiling,
    output_reservations: [...config.output_reservations],
    descriptor,
  };
}

export async function createCanonicalRequestAssessor({
  seats,
  userPrompt,
  systemPrompt = null,
  counter,
}: {
  seats: StagedSeatConfig[];
  userPrompt: string;
  systemPrompt?: string | null;
  counter: RequestCounter;
}) {
  if (
    typeof userPrompt !== "string" ||
    (systemPrompt !== null && typeof systemPrompt !== "string")
  ) {
    fail("prompt must be exact UTF-8 text");
  }
  if (
    !counter ||
    typeof counter.countRequest !== "function" ||
    !counter.identity?.id ||
    !counter.identity.revision ||
    !hex(counter.identity.artifact_sha256)
  ) {
    fail("a pinned, reviewed complete-request counter is required");
  }
  if (
    !Array.isArray(seats) ||
    !seats.length ||
    new Set(seats.map((s) => s.seat_id)).size !== seats.length
  ) {
    fail("one unique configuration per cohort seat is required");
  }
  const configs = structuredClone(seats);
  const counterIdentity = structuredClone(counter.identity);
  const locked = await Promise.all(configs.map(describeStagedSeat));
  const frozenSeats = locked.map(
    ({ descriptor: _descriptor, ...seat }) => seat,
  );
  return {
    controlledRoot: ROOT,
    seats: frozenSeats,
    async assessRequest(candidate: Candidate) {
      const files = new Map(candidate.files.map((file) => [file.path, file]));
      if (files.size !== candidate.files.length)
        fail("duplicate candidate file path");
      const user = await embedSourcesIntoPrompt(
        userPrompt,
        candidate.source_manifest,
        resolve(ROOT, candidate.source_manifest_path),
        async (entry) => {
          const file = files.get(entry.path);
          if (
            !file ||
            !Buffer.isBuffer(file.bytes) ||
            file.bytes.length !== file.byte_length ||
            file.sha256 !== entry.sha256 ||
            hash(file.bytes) !== entry.sha256
          ) {
            fail("candidate bytes do not match the exact manifest");
          }
          return file.bytes;
        },
      );
      const assessments = [];
      for (let i = 0; i < configs.length; i++) {
        const config = configs[i];
        const fresh = await describeStagedSeat({
          ...config,
          recipe_sha256: locked[i].recipe_sha256,
        });
        const recipe = selectRecipe(
          config as Parameters<typeof selectRecipe>[0],
        );
        const transport = selectTransport(
          config as Parameters<typeof selectTransport>[0],
          recipe,
        );
        const variants = [];
        for (const output_reservation of config.output_reservations) {
          const body = recipe.buildBody({
            userPrompt: user,
            systemPrompt,
            maxTokens: output_reservation,
            transport,
          });
          const request_json = JSON.stringify(body);
          const request_json_sha256 = hash(request_json);
          const result = await counter.countRequest({
            request_json,
            request_json_sha256,
            body: structuredClone(body),
            seat: structuredClone(config),
            model: recipe.declaredModel,
            transport,
          });
          const witness = result?.counter_witness;
          if (
            result?.verified !== true ||
            !integer(result.input_tokens_upper_bound) ||
            !integer(result.extra_overhead_tokens) ||
            witness?.request_json_sha256 !== request_json_sha256 ||
            witness.model !== recipe.declaredModel ||
            typeof witness.method !== "string" ||
            !witness.method.trim() ||
            typeof witness.evidence !== "string" ||
            !witness.evidence.trim() ||
            !Array.isArray(witness.assumptions) ||
            !witness.assumptions.every((a) => typeof a === "string")
          ) {
            fail(`unsupported or unbound count for seat ${config.seat_id}`);
          }
          variants.push({
            output_reservation,
            request_json_sha256,
            input_tokens_upper_bound: result.input_tokens_upper_bound,
            extra_overhead_tokens: result.extra_overhead_tokens,
            counter_witness: {
              ...structuredClone(witness),
              counter_identity: counterIdentity,
            },
          });
        }
        const first = variants[0];
        assessments.push({
          candidate_sha256: candidateSha256(candidate),
          seat_id: config.seat_id,
          recipe_sha256: fresh.recipe_sha256,
          facilitator_sha256: fresh.descriptor.facilitator_sha256,
          system_prompt_sha256: hash(systemPrompt ?? ""),
          user_prompt_sha256: hash(user),
          request_json_sha256: first.request_json_sha256,
          input_tokens_upper_bound: first.input_tokens_upper_bound,
          extra_overhead_tokens: first.extra_overhead_tokens,
          counter_witness: first.counter_witness,
          verified: true,
          request_variants: variants,
        });
      }
      return assessments;
    },
  };
}

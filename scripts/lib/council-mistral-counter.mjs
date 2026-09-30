#!/usr/bin/env node
/**
 * Pinned local Mistral chat measurement; never provider capacity certification.
 * Usage: createMistralRequestCounter({ pythonPath, tokenizerPath }).countRequest(input)
 * The explicit Python dependency is isolated behind bounded, content-free stdio.
 */
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { isAbsolute } from "node:path";
import { isDeepStrictEqual } from "node:util";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const MODULE_SHA256 = hash(readFileSync(new URL(import.meta.url)));
const WORKER_URL = new URL("./council-mistral-tokenizer.py", import.meta.url);
export const MISTRAL_COUNTER_PINS = Object.freeze({
  model: "mistralai/mistral-large-2512",
  declared_model: "mistralai/mistral-large-2512 (OpenRouter primary for Mistral)",
  eu_declared_model:
    "mistralai/mistral-large-2512 (OpenRouter primary for Mistral, via mistral/eu)",
  mistral_common_version: "1.11.7",
  tokenizer_sha256: "e29d19ea32eb7e26e6c0572d57cb7f9eca0f4420e0e0fe6ae1cf3be94da1c0d6",
  tokenizer_version: 13,
  publisher_revision: "383ffea2c7d60dfd44ca960e8e691709d4fdb9cd",
  publisher_url:
    "https://huggingface.co/mistralai/Mistral-Large-3-675B-Instruct-2512/resolve/383ffea2c7d60dfd44ca960e8e691709d4fdb9cd/tekken.json",
});
const MAX_REQUEST_BYTES = 32 * 1024 * 1024;
const MAX_RESPONSE_BYTES = 32 * 1024;
const WORKER_ERRORS = new Set([
  "invalid_arguments",
  "invalid_request",
  "request_too_large",
  "dependency_unavailable",
  "dependency_version_mismatch",
  "tokenizer_unavailable",
  "tokenizer_mismatch",
  "tokenizer_version_mismatch",
  "tokenizer_failed",
]);
const fail = (reason) => {
  const error = new Error(`budget_unverified: ${reason}`);
  Object.assign(error, { code: "budget_unverified", reason });
  throw error;
};
const object = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const keys = (x, expected) =>
  object(x) && isDeepStrictEqual(Object.keys(x).sort(), [...expected].sort());

/** Validates the whole supported request before any subprocess is started. */
function validateInput(input, maxRequestBytes) {
  if (
    typeof input?.request_json !== "string" ||
    Buffer.byteLength(input.request_json) > maxRequestBytes ||
    hash(input.request_json) !== input.request_json_sha256
  )
    fail("request_binding");
  let body;
  try {
    body = JSON.parse(input.request_json);
  } catch {
    fail("invalid_request");
  }
  if (!isDeepStrictEqual(body, input.body)) fail("request_body_mismatch");
  const streaming = input.transport === "sse";
  const required = ["model", "messages", "max_tokens", "temperature"];
  if (streaming) required.push("stream", "stream_options");
  // Retain historical unpinned measurements. The new recipe is a separate exact
  // request shape, never an arbitrary provider preference or capacity proof.
  const pinned = object(body) && Object.hasOwn(body, "provider");
  if (pinned) required.push("provider");
  const declaredModel = pinned
    ? MISTRAL_COUNTER_PINS.eu_declared_model
    : MISTRAL_COUNTER_PINS.declared_model;
  if (
    !keys(body, required) ||
    body.model !== MISTRAL_COUNTER_PINS.model ||
    input.model !== declaredModel ||
    (pinned &&
      !isDeepStrictEqual(body.provider, {
        only: ["mistral/eu"],
        order: ["mistral/eu"],
        allow_fallbacks: false,
      })) ||
    body.max_tokens !== 131072 ||
    body.temperature !== 0.3 ||
    !["sse", "buffered"].includes(input.transport) ||
    (streaming &&
      (body.stream !== true ||
        !keys(body.stream_options, ["include_usage"]) ||
        body.stream_options.include_usage !== true))
  )
    fail("unsupported_request");
  const seat = input.seat;
  if (
    seat?.member !== "mistral" ||
    !["default", "openrouter"].includes(seat.provider) ||
    !["default", input.transport].includes(seat.transport) ||
    !Array.isArray(seat.output_reservations) ||
    !seat.output_reservations.length ||
    seat.output_reservations.some((n) => n !== 131072)
  )
    fail("unsupported_seat");
  const messages = body.messages;
  if (
    !Array.isArray(messages) ||
    ![1, 2].includes(messages.length) ||
    !messages.every(
      (m) =>
        keys(m, ["role", "content"]) && typeof m.content === "string" && m.content.isWellFormed()
    ) ||
    messages.at(-1).role !== "user" ||
    (messages.length === 2 && messages[0].role !== "system")
  )
    fail("unsupported_messages");
  return body;
}

function runWorker({ pythonPath, tokenizerPath, timeoutMs, workerSource, request }) {
  return new Promise((resolve, reject) => {
    let child,
      timer,
      done = false,
      output = [],
      diagnostic = [],
      outputBytes = 0,
      errorBytes = 0;
    function finish(reason, value) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (reason) {
        child?.kill("SIGKILL");
        try {
          fail(reason);
        } catch (error) {
          reject(error);
        }
      } else resolve(value);
    }
    // Execute the exact worker bytes whose digest is recorded, not a path that
    // could change after hashing. Request text travels only over stdin.
    try {
      child = spawn(pythonPath, ["-I", "-c", workerSource, "--tokenizer", tokenizerPath], {
        shell: false,
        env: { LANG: "C.UTF-8" },
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch {
      finish("worker_unavailable");
      return;
    }
    timer = setTimeout(() => finish("worker_timeout"), timeoutMs);
    child.on("error", () => finish("worker_unavailable"));
    child.stdin.on("error", () => finish("worker_input_failed"));
    child.stdout.on("data", (bytes) => {
      outputBytes += bytes.length;
      if (outputBytes > MAX_RESPONSE_BYTES) return finish("worker_output_limit");
      output.push(bytes);
    });
    child.stderr.on("data", (bytes) => {
      errorBytes += bytes.length;
      if (errorBytes > MAX_RESPONSE_BYTES) return finish("worker_output_limit");
      diagnostic.push(bytes);
    });
    child.on("close", (code) => {
      if (done) return;
      if (code !== 0) {
        const reason = Buffer.concat(diagnostic).toString("utf8").trim();
        return finish(WORKER_ERRORS.has(reason) ? reason : "worker_failed");
      }
      let result;
      try {
        result = JSON.parse(Buffer.concat(output).toString("utf8"));
      } catch {
        return finish("worker_invalid_response");
      }
      finish(null, result);
    });
    child.stdin.end(request);
  });
}

export function createMistralRequestCounter({
  pythonPath = process.env.COUNCIL_MISTRAL_PYTHON,
  tokenizerPath = process.env.COUNCIL_MISTRAL_TOKENIZER_PATH,
  timeoutMs = 120000,
  maxRequestBytes = MAX_REQUEST_BYTES,
  entryArtifactSha256 = MODULE_SHA256,
} = {}) {
  if (
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs < 1 ||
    timeoutMs > 300000 ||
    !Number.isSafeInteger(maxRequestBytes) ||
    maxRequestBytes < 1 ||
    maxRequestBytes > MAX_REQUEST_BYTES ||
    !/^[a-f0-9]{64}$/.test(entryArtifactSha256)
  ) {
    fail("invalid_counter_configuration");
  }
  const identity = Object.freeze({
    id: "mistral-large-2512-local-chat-measurement",
    revision: "2",
    artifact_sha256: entryArtifactSha256,
  });
  return Object.freeze({
    identity,
    async countRequest(input) {
      const body = validateInput(input, maxRequestBytes);
      if (
        typeof pythonPath !== "string" ||
        !isAbsolute(pythonPath) ||
        typeof tokenizerPath !== "string" ||
        !isAbsolute(tokenizerPath)
      ) {
        fail("counter_dependencies_not_configured");
      }
      let workerSource;
      try {
        workerSource = readFileSync(WORKER_URL, "utf8");
      } catch {
        fail("worker_unavailable");
      }
      const request = input.request_json;
      const requestSha256 = hash(request);
      const transport = input.transport;
      const declaredModel = input.model;
      const measurement = await runWorker({
        pythonPath,
        tokenizerPath,
        timeoutMs,
        workerSource,
        request,
      });
      if (
        measurement?.schema !== "council-mistral-measurement-v1" ||
        measurement.request_json_sha256 !== requestSha256 ||
        measurement.model !== MISTRAL_COUNTER_PINS.model ||
        measurement.mistral_common_version !== MISTRAL_COUNTER_PINS.mistral_common_version ||
        measurement.tokenizer_sha256 !== MISTRAL_COUNTER_PINS.tokenizer_sha256 ||
        measurement.tokenizer_version !== MISTRAL_COUNTER_PINS.tokenizer_version ||
        measurement.truncation_enabled !== false ||
        measurement.message_count !== body.messages.length ||
        !Number.isSafeInteger(measurement.measured_input_tokens) ||
        measurement.measured_input_tokens < 0 ||
        !object(measurement.dependencies) ||
        !["python", "mistral-common", "tiktoken", "pydantic", "numpy"].every(
          (name) =>
            typeof measurement.dependencies[name] === "string" &&
            measurement.dependencies[name].length > 0
        ) ||
        measurement.dependencies["mistral-common"] !==
          MISTRAL_COUNTER_PINS.mistral_common_version ||
        !Object.values(measurement.dependencies).every((v) => typeof v === "string")
      ) {
        fail("worker_witness_mismatch");
      }
      return {
        verified: false,
        reason: "provider_overhead_unverified",
        measured_input_tokens: measurement.measured_input_tokens,
        input_tokens_upper_bound: null,
        extra_overhead_tokens: null,
        counter_witness: {
          method: "MistralTokenizer.encode_chat_completion; truncate_for_context_length=False",
          request_json_sha256: requestSha256,
          evidence: MISTRAL_COUNTER_PINS.publisher_url,
          assumptions: [
            "Local publisher chat encoding only; hosted input transformations are not attested.",
            "Provider overhead and a complete input upper bound remain unverified.",
          ],
          ...MISTRAL_COUNTER_PINS,
          // RequestCounter uses the Facilitator's declared model, not wire slug.
          model: declaredModel,
          declared_model: declaredModel,
          wire_model: MISTRAL_COUNTER_PINS.model,
          adapter_sha256: MODULE_SHA256,
          worker_sha256: hash(workerSource),
          dependencies: measurement.dependencies,
          truncation_enabled: false,
          transport,
          message_count: measurement.message_count,
        },
      };
    },
  });
}

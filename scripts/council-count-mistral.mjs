#!/usr/bin/env node
/**
 * Measure a pinned local Mistral chat request without dispatch or fit certification.
 * Usage: node scripts/council-count-mistral.mjs --request FILE
 * Set COUNCIL_MISTRAL_PYTHON and COUNCIL_MISTRAL_TOKENIZER_PATH to absolute paths.
 * Exit 0 means a measurement was emitted; its budget remains unverified.
 */
import { readFileSync, openSync, readSync, closeSync, fstatSync, constants } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  createMistralRequestCounter,
  MISTRAL_COUNTER_PINS,
} from "./lib/council-mistral-counter.mjs";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const counter = createMistralRequestCounter({
  entryArtifactSha256: hash(readFileSync(new URL(import.meta.url))),
});

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== "--request" || !args[1]) {
    throw new Error("usage");
  }
  const fd = openSync(resolve(args[1]), constants.O_RDONLY | constants.O_NONBLOCK);
  let bytes;
  try {
    const max = 32 * 1024 * 1024;
    const metadata = fstatSync(fd);
    if (!metadata.isFile() || metadata.size > max) throw new Error("invalid_request_file");
    const chunks = [];
    let total = 0;
    while (total <= max) {
      const chunk = Buffer.alloc(Math.min(65536, max + 1 - total));
      const n = readSync(fd, chunk);
      if (!n) break;
      chunks.push(chunk.subarray(0, n));
      total += n;
    }
    if (total > max) throw new Error("request_too_large");
    bytes = Buffer.concat(chunks);
  } finally {
    closeSync(fd);
  }
  const request_json = new TextDecoder("utf-8", {
    fatal: true,
    ignoreBOM: true,
  }).decode(bytes);
  const body = JSON.parse(request_json);
  const result = await counter.countRequest({
    request_json,
    request_json_sha256: hash(bytes),
    body,
    model: Object.hasOwn(body, "provider")
      ? MISTRAL_COUNTER_PINS.eu_declared_model
      : MISTRAL_COUNTER_PINS.declared_model,
    transport: body.stream === true ? "sse" : "buffered",
    seat: {
      member: "mistral",
      provider: "openrouter",
      transport: "default",
      output_reservations: [131072],
    },
  });
  process.stdout.write(
    JSON.stringify({
      schema: "council-mistral-count-v1",
      counter_identity: counter.identity,
      ...result,
    }) + "\n"
  );
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    // Paths, parser errors, dependency errors and source text are not diagnostics.
    const reason =
      error?.code === "budget_unverified" ? error.reason : "invalid_request_or_configuration";
    process.stderr.write(`budget_unverified: ${reason}\n`);
    process.exitCode = 1;
  });
}

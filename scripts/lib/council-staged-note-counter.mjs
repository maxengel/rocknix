#!/usr/bin/env node
// Purpose: Require independently pinned bounds for exact raw member-note bytes.
// Usage: import { loadTrustedNoteCounter, assessNote } from this module.
// This adapter provides no production tokenizer or hosted-capacity certification.
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { TextDecoder } from "node:util";
import { canonicalJson, sha256Bytes } from "./council-staged-sources.mjs";

import { createFilePinCheck } from "./council-staged-pins.mjs";

const trustedCounters = new WeakMap();
const MAX_BYTES = 1024 * 1024;
const HASH = /^[a-f0-9]{64}$/;
const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

function fail(message) {
  throw Object.assign(new Error(`note_budget_unverified: ${message}`), {
    code: "note_budget_unverified",
  });
}

function need(condition, message) {
  if (!condition) fail(message);
}

function exact(value, keys, context) {
  need(
    value !== null &&
      typeof value === "object" &&
      Object.getPrototypeOf(value) === Object.prototype &&
      Reflect.ownKeys(value).length === keys.length &&
      keys.every((key) => {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        return descriptor && Object.hasOwn(descriptor, "value") && descriptor.enumerable;
      }),
    `${context} has missing, unknown or non-data fields`
  );
}

function text(value, maximum) {
  return (
    typeof value === "string" &&
    value.isWellFormed() &&
    value.trim().length > 0 &&
    value.length <= maximum &&
    !/[\x00-\x1f\x7f]/u.test(value)
  );
}

function freeze(value) {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

function identitySnapshot(identity) {
  exact(identity, ["id", "revision", "artifact_sha256"], "counter identity");
  need(
    text(identity.id, 1024) &&
      text(identity.revision, 1024) &&
      typeof identity.artifact_sha256 === "string" &&
      HASH.test(identity.artifact_sha256),
    "invalid counter identity"
  );
  return freeze({
    id: identity.id,
    revision: identity.revision,
    artifact_sha256: identity.artifact_sha256,
  });
}

function equalIdentity(counter, identity) {
  need(
    canonicalJson(identitySnapshot(counter.identity)) === canonicalJson(identity),
    "counter identity changed or differs from the frozen policy"
  );
}

function inputSnapshot(input) {
  exact(input, ["note_utf8", "note_sha256", "model", "recipe_sha256"], "counter input");
  need(
    typeof input.note_utf8 === "string" && input.note_utf8.isWellFormed(),
    "counter input must be exact UTF-8 text"
  );
  const bytes = Buffer.from(input.note_utf8, "utf8");
  need(
    bytes.length > 0 && bytes.length <= MAX_BYTES && input.note_sha256 === sha256Bytes(bytes),
    "counter input does not bind bounded raw note bytes"
  );
  need(
    text(input.model, 1024) &&
      typeof input.recipe_sha256 === "string" &&
      HASH.test(input.recipe_sha256),
    "counter input requires a pinned model and recipe"
  );
  return freeze({
    note_utf8: input.note_utf8,
    note_sha256: input.note_sha256,
    model: input.model,
    recipe_sha256: input.recipe_sha256,
  });
}

function resultSnapshot(result, input) {
  exact(
    result,
    ["verified", "note_sha256", "model", "recipe_sha256", "note_tokens_upper_bound", "evidence"],
    "counter result"
  );
  exact(result.evidence, ["method", "reference", "assumptions"], "counter evidence");
  need(
    result.verified === true &&
      Number.isSafeInteger(result.note_tokens_upper_bound) &&
      result.note_tokens_upper_bound >= 0,
    "counter must substantiate a verified finite note-token upper bound"
  );
  need(
    ["note_sha256", "model", "recipe_sha256"].every((key) => result[key] === input[key]),
    "counter evidence does not bind the exact note, model and recipe"
  );
  const evidence = result.evidence;
  need(
    text(evidence.method, 256) && text(evidence.reference, 4096),
    "counter evidence method or reference is missing or unbounded"
  );
  const assumptions = evidence.assumptions;
  need(
    Array.isArray(assumptions) &&
      assumptions.length <= 64 &&
      Reflect.ownKeys(assumptions).length === assumptions.length + 1,
    "counter evidence assumptions have invalid shape or count"
  );
  const copiedAssumptions = [];
  for (let index = 0; index < assumptions.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(assumptions, index);
    need(
      descriptor &&
        Object.hasOwn(descriptor, "value") &&
        descriptor.enumerable &&
        text(descriptor.value, 1024),
      "counter evidence assumption is missing or unbounded"
    );
    copiedAssumptions.push(descriptor.value);
  }
  return freeze({
    verified: true,
    note_sha256: result.note_sha256,
    model: result.model,
    recipe_sha256: result.recipe_sha256,
    note_tokens_upper_bound: result.note_tokens_upper_bound,
    evidence: {
      method: evidence.method,
      reference: evidence.reference,
      assumptions: copiedAssumptions,
    },
  });
}

function refusal(error, message) {
  if (error?.code === "note_budget_unverified") throw error;
  fail(message);
}

/** Pin an unaliased entry before/after import and on both sides of each count. */
export async function loadTrustedNoteCounter({ modulePath, expectedSha256, dependencies = [] }) {
  need(
    typeof modulePath === "string" &&
      modulePath.trim().length > 0 &&
      typeof expectedSha256 === "string" &&
      HASH.test(expectedSha256),
    "a counter module path and SHA-256 are required"
  );
  const filename = resolve(modulePath);
  // The shared checker snapshots the reviewed dependency list before its first await.
  let pin;
  try {
    pin = await createFilePinCheck({ entryPath: filename, expectedSha256, dependencies });
  } catch (error) {
    refusal(
      error,
      "counter entry must be an unaliased regular file of at most 1 MiB; entry or dependency failed pin or path verification"
    );
  }
  async function verifyEntry() {
    try {
      await pin();
    } catch (error) {
      refusal(
        error,
        "counter entry must be an unaliased regular file of at most 1 MiB; entry or dependency failed pin or path verification"
      );
    }
  }
  await verifyEntry();
  let imported;
  try {
    imported = await import(`${pathToFileURL(filename).href}?staged_note_sha256=${expectedSha256}`);
  } catch (error) {
    refusal(error, "counter module import failed");
  }
  await verifyEntry();
  const counter = imported.noteCounter;
  exact(counter, ["identity", "countNote"], "counter export");
  const identity = identitySnapshot(counter.identity);
  need(
    identity.artifact_sha256 === expectedSha256 && typeof counter.countNote === "function",
    "counter export and identity must bind the reviewed entry"
  );
  const count = counter.countNote;
  function verifyIdentity() {
    exact(counter, ["identity", "countNote"], "counter export");
    equalIdentity(counter, identity);
    need(counter.countNote === count, "counter method changed");
  }
  const capability = Object.freeze({
    identity,
    async countNote(input) {
      // Snapshot before filesystem awaits so the caller cannot change the request.
      const request = inputSnapshot(input);
      await verifyEntry();
      verifyIdentity();
      let result;
      try {
        // Snapshot before the next await; returned objects may still belong to the module.
        result = resultSnapshot(await count.call(counter, request), request);
      } catch (error) {
        refusal(error, "counter did not return verifiable note evidence");
      }
      await verifyEntry();
      verifyIdentity();
      return result;
    },
  });
  trustedCounters.set(capability, async () => {
    await verifyEntry();
    verifyIdentity();
  });
  return capability;
}

/** Verify a loader-issued capability without invoking its count method. */
export async function verifyTrustedNoteCounter(counter) {
  const verify = trustedCounters.get(counter);
  need(verify, "derived readings require the independently pinned note counter loader");
  await verify();
}

/** Bind a counter's full witness to exact bytes and the independent frozen policy. */
export async function assessNote({
  counter,
  expectedIdentity,
  bytes,
  model,
  recipeSha256,
  maxTokens,
}) {
  need(
    Buffer.isBuffer(bytes) && bytes.length > 0 && bytes.length <= MAX_BYTES,
    "note bytes are absent or exceed 1 MiB"
  );
  need(
    Number.isSafeInteger(maxTokens) && maxTokens > 0,
    "a positive safe note-token limit is required"
  );
  exact(counter, ["identity", "countNote"], "counter");
  need(typeof counter.countNote === "function", "a note counter is required");
  const identity = identitySnapshot(expectedIdentity);
  equalIdentity(counter, identity);
  const snapshot = Buffer.from(bytes);
  let note;
  try {
    note = decoder.decode(snapshot);
  } catch {
    fail("note bytes are not valid UTF-8");
  }
  const input = inputSnapshot({
    note_utf8: note,
    note_sha256: sha256Bytes(snapshot),
    model,
    recipe_sha256: recipeSha256,
  });
  const count = counter.countNote;
  let result;
  try {
    result = resultSnapshot(await count.call(counter, input), input);
  } catch (error) {
    refusal(error, "counter did not return verifiable note evidence");
  }
  exact(counter, ["identity", "countNote"], "counter");
  equalIdentity(counter, identity);
  need(counter.countNote === count, "counter method changed");
  need(
    result.note_tokens_upper_bound <= maxTokens,
    "verified note-token upper bound exceeds the frozen limit"
  );
  return freeze({ counter_identity: identity, ...result });
}

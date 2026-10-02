#!/usr/bin/env node
/**
 * Purpose: Durably bind one staged client dispatch and preserve its raw capture.
 * Usage: import { createAttemptIntent, claimDispatch, captureAttempt } from this module.
 * Capture establishes local record integrity, never accepted reading or provider identity.
 * Requires a trusted filesystem namespace: like S1, this does not sandbox a hostile
 * same-UID process that swaps ancestor directories between filesystem operations.
 */

import { constants } from "node:fs";
import { lstat, mkdir, open, readdir, link, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { canonicalJson, sha256Bytes } from "./council-staged-sources.mjs";
import { verifyPreparation } from "./council-staged-store.mjs";
import { DERIVED_CAPS, parseDerived, derivedDigest } from "./council-staged-derived-contract.mjs";

export const MAX_ATTEMPT_RECORD_BYTES = 16 * 1024 * 1024;
export const MAX_ATTEMPT_OUTPUT_BYTES = 32 * 1024 * 1024;
const INTENT_SCHEMA = "council-staged-attempt/v1";
const CONTROLLED_INTENT_SCHEMA = "council-staged-attempt/v2";
const DERIVED_INTENT_SCHEMA = "council-staged-attempt/v3";
const DISPATCH_SCHEMA = "council-staged-attempt-dispatch/v1";
const CAPTURE_SCHEMA = "council-staged-attempt-capture/v1";
const HASH = /^[a-f0-9]{64}$/;
const COMPONENT = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
// scaffold#917: from Facilitator 1.13.0 every OpenRouter attempt records the provider the response
// named (`served_provider`) and a verdict (`final.provider_verification`). Whether a receipt must carry
// them is decided by its producing Facilitator's recorded version, the frozen protocol identity, and
// never by the fields' absence: a receipt from 1.13.0 or later without them is refused, not excused.
const ROUTING_EVIDENCE_SINCE = [1, 13, 0];
const COMPLETE_ROUTING_EVIDENCE_SINCE = [1, 14, 0];
const ROUTING_RESULTS = ["PASS", "FAIL", "UNVERIFIABLE", "NOT_PINNED"];
const FILES = new Set([
  "intent.json",
  "dispatch.json",
  "output.txt",
  "provenance.json",
  "capture.json",
]);
const handles = new WeakMap();
const scopeKeys = [
  "run_id",
  "research_run_id",
  "phase",
  "step",
  "round",
  "cohort_id",
  "required_input_set_sha256",
  "question_set_sha256",
  "method_version",
  "seat_configuration_sha256",
  "anonymous_view_sha256",
];

function refuse(code, message) {
  throw Object.assign(new Error(message), { code });
}
function need(condition, message, code = "attempt_conflict") {
  if (!condition) refuse(code, message);
}
function exact(value, keys) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key))
  );
}
function label(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 1024 &&
    !/[\x00-\x1f\x7f]/u.test(value)
  );
}
function positive(value) {
  return Number.isSafeInteger(value) && value > 0;
}
function relativeName(value) {
  need(
    typeof value === "string" &&
      value.length > 0 &&
      !/[\\\0:]/u.test(value) &&
      !value.startsWith("/") &&
      !value.split("/").some((part) => !part || part === "." || part === ".."),
    "Expected an exact relative path",
    "unsafe_path"
  );
  return value;
}
function serialized(value) {
  let bytes;
  try {
    bytes = Buffer.from(`${canonicalJson(value)}\n`, "utf8");
  } catch {
    refuse("attempt_conflict", "Attempt data must be strict JSON");
  }
  need(bytes.length <= MAX_ATTEMPT_RECORD_BYTES, "Attempt record is too large");
  return bytes;
}
function clone(value) {
  return JSON.parse(serialized(value).toString("utf8"));
}
function freeze(value) {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
function digestRecord(value, key) {
  const { [key]: ignored, ...body } = value;
  return sha256Bytes(canonicalJson(body));
}
function parseCanonical(bytes) {
  try {
    const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    need(serialized(value).equals(bytes), "Attempt JSON is not canonical");
    return value;
  } catch {
    refuse("attempt_conflict", "Invalid or noncanonical attempt JSON");
  }
}

function validateIntent(intent, attemptRoot) {
  const derived = intent?.schema_version === DERIVED_INTENT_SCHEMA;
  const controlled = intent?.schema_version === CONTROLLED_INTENT_SCHEMA || derived;
  need(
    exact(intent, [
      "schema_version",
      "attempt_id",
      "operation_id",
      "node_id",
      "owner_id",
      "scope",
      "plan",
      "preparation_sha256",
      "seat",
      "inputs",
      "request_json_sha256",
      "limits",
      "intent_sha256",
      ...(controlled ? ["controller"] : []),
      ...(derived ? ["derived"] : []),
    ]),
    "Unexpected intent fields"
  );
  need(
    (intent.schema_version === INTENT_SCHEMA || controlled) &&
      COMPONENT.test(intent.attempt_id) &&
      attemptRoot === `.council-attempts/${intent.attempt_id}`,
    "Attempt identity differs from its reserved path",
    "unsafe_path"
  );
  for (const key of ["operation_id", "node_id", "owner_id"])
    need(label(intent[key]), "Invalid intent identity");
  need(exact(intent.scope, scopeKeys), "Scope must have every explicit S1 binding");
  for (const key of ["run_id", "phase", "step", "cohort_id", "method_version"])
    need(label(intent.scope[key]), "Invalid scope label");
  need(
    intent.scope.research_run_id === null || label(intent.scope.research_run_id),
    "Invalid research run"
  );
  need(Number.isSafeInteger(intent.scope.round) && intent.scope.round >= 0, "Invalid scope round");
  for (const key of [
    "required_input_set_sha256",
    "question_set_sha256",
    "seat_configuration_sha256",
  ])
    need(HASH.test(intent.scope[key] ?? ""), "Invalid scope digest");
  need(
    intent.scope.anonymous_view_sha256 === null ||
      HASH.test(intent.scope.anonymous_view_sha256 ?? ""),
    "Invalid anonymous-view digest"
  );
  need(exact(intent.plan, ["logical_root", "sha256"]), "Invalid plan binding");
  relativeName(intent.plan.logical_root);
  need(
    ![".council-attempts", ".council-controllers", ".council-readings"].includes(
      intent.plan.logical_root.split("/")[0]
    ),
    "Preparation overlaps the reserved attempt namespace",
    "unsafe_path"
  );
  for (const value of [
    intent.plan.sha256,
    intent.preparation_sha256,
    intent.request_json_sha256,
    intent.intent_sha256,
  ])
    need(HASH.test(value ?? ""), "Invalid intent digest");
  need(
    intent.intent_sha256 === digestRecord(intent, "intent_sha256"),
    "Intent digest does not match its content"
  );
  if (controlled)
    need(
      exact(intent.controller, ["logical_root", "policy_sha256"]) &&
        intent.controller.logical_root === `.council-controllers/${intent.plan.sha256}` &&
        HASH.test(intent.controller.policy_sha256 ?? ""),
      "Invalid controller policy binding"
    );
  need(
    exact(intent.seat, [
      "seat_id",
      "member",
      "provider",
      "transport",
      "declared_model",
      "recipe_sha256",
      "facilitator_sha256",
      "context_ceiling",
      "output_reservation",
    ]),
    "Unexpected seat fields"
  );
  for (const key of ["seat_id", "member", "declared_model"])
    need(label(intent.seat[key]), "Invalid seat identity");
  need(
    intent.seat.provider === "openrouter" && ["buffered", "sse"].includes(intent.seat.transport),
    "Unsupported staged route"
  );
  need(
    HASH.test(intent.seat.recipe_sha256 ?? "") && HASH.test(intent.seat.facilitator_sha256 ?? ""),
    "Invalid seat pin"
  );
  need(
    positive(intent.seat.context_ceiling) &&
      positive(intent.seat.output_reservation) &&
      intent.seat.output_reservation <= intent.seat.context_ceiling,
    "Invalid seat reservation"
  );
  need(
    exact(intent.inputs, ["source_manifest", "system_prompt_sha256", "user_prompt_sha256"]) &&
      exact(intent.inputs.source_manifest, ["path", "sha256"]),
    "Unexpected input fields"
  );
  relativeName(intent.inputs.source_manifest.path);
  need(
    derived
      ? intent.inputs.source_manifest.path ===
          `.council-readings/${intent.plan.sha256}/requests/${intent.attempt_id}/assessment.json`
      : intent.inputs.source_manifest.path.startsWith(`${intent.plan.logical_root}/`),
    "Manifest is outside the preparation",
    "unsafe_path"
  );
  if (derived) {
    need(
      exact(intent.derived, ["reading_policy_sha256", "packet_sha256", "assessment_sha256"]) &&
        Object.values(intent.derived).every(
          (value) => typeof value === "string" && HASH.test(value)
        ) &&
        intent.derived.assessment_sha256 === intent.inputs.source_manifest.sha256 &&
        new RegExp(`^d-${intent.plan.sha256}-(0|[1-9][0-9]*)$`).test(intent.attempt_id),
      "Invalid derived package binding"
    );
  }
  for (const value of [
    intent.inputs.source_manifest.sha256,
    intent.inputs.system_prompt_sha256,
    intent.inputs.user_prompt_sha256,
  ])
    need(HASH.test(value ?? ""), "Invalid input digest");
  need(
    exact(intent.limits, ["max_client_dispatches", "per_attempt_timeout_ms", "total_timeout_ms"]) &&
      intent.limits.max_client_dispatches === 1 &&
      positive(intent.limits.per_attempt_timeout_ms) &&
      positive(intent.limits.total_timeout_ms) &&
      intent.limits.per_attempt_timeout_ms <= intent.limits.total_timeout_ms,
    "Invalid finite attempt limits"
  );
}

function expectations(args) {
  const result = clone({
    expectedIntentSha256: args.expectedIntentSha256,
    expectedPlanSha256: args.expectedPlanSha256,
    expectedScope: args.expectedScope,
    expectedOwnerId: args.expectedOwnerId,
    expectedNodeId: args.expectedNodeId,
  });
  need(
    HASH.test(result.expectedIntentSha256 ?? "") &&
      HASH.test(result.expectedPlanSha256 ?? "") &&
      exact(result.expectedScope, scopeKeys) &&
      label(result.expectedOwnerId) &&
      label(result.expectedNodeId),
    "Independent intent, plan, scope, owner and node expectations are required"
  );
  return freeze(result);
}
function checkExpected(intent, expected) {
  need(
    intent.intent_sha256 === expected.expectedIntentSha256 &&
      intent.plan.sha256 === expected.expectedPlanSha256 &&
      intent.owner_id === expected.expectedOwnerId &&
      intent.node_id === expected.expectedNodeId &&
      canonicalJson(intent.scope) === canonicalJson(expected.expectedScope),
    "Intent differs from independent expected bindings"
  );
}
function sameIdentity(a, b) {
  return a.dev === b.dev && a.ino === b.ino;
}
async function directoryChain(absolute) {
  let current = path.parse(absolute).root;
  for (const segment of absolute.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    const stat = await lstat(current);
    need(
      stat.isDirectory() && !stat.isSymbolicLink(),
      "Attempt ancestors must be real directories",
      "unsafe_path"
    );
  }
  return lstat(absolute);
}
async function syncDirectory(absolute) {
  const handle = await open(
    absolute,
    constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW
  );
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}
async function location(controlledRoot, attemptRoot) {
  need(
    typeof controlledRoot === "string" &&
      path.isAbsolute(controlledRoot) &&
      path.resolve(controlledRoot) === controlledRoot,
    "controlledRoot must be an exact absolute directory",
    "unsafe_path"
  );
  need(
    typeof attemptRoot === "string" &&
      /^\.council-attempts\/[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(attemptRoot),
    "Expected the reserved attempt path",
    "unsafe_path"
  );
  return {
    controlledRoot,
    attemptRoot,
    directory: path.join(controlledRoot, attemptRoot),
    rootIdentity: await directoryChain(controlledRoot),
  };
}
async function unchanged(where) {
  need(
    sameIdentity(where.rootIdentity, await directoryChain(where.controlledRoot)),
    "Controlled root changed",
    "unsafe_path"
  );
  if (where.attemptIdentity)
    need(
      sameIdentity(where.attemptIdentity, await directoryChain(where.directory)),
      "Attempt directory changed",
      "unsafe_path"
    );
}
async function readExact(where, relative, maxBytes = MAX_ATTEMPT_RECORD_BYTES) {
  relativeName(relative);
  const filename = path.join(where.controlledRoot, relative);
  await directoryChain(path.dirname(filename));
  let handle;
  try {
    const initial = await lstat(filename);
    need(
      initial.isFile() && initial.nlink === 1,
      "Artifacts must be unaliased regular files",
      "unsafe_path"
    );
    handle = await open(filename, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    const before = await handle.stat();
    need(
      before.isFile() &&
        before.nlink === 1 &&
        sameIdentity(before, initial) &&
        sameIdentity(before, await lstat(filename)),
      "Artifact changed while opening",
      "unsafe_path"
    );
    need(before.size <= maxBytes, "Attempt artifact is too large");
    const bytes = Buffer.alloc(before.size);
    for (let offset = 0; offset < bytes.length;) {
      const { bytesRead } = await handle.read(bytes, offset, bytes.length - offset, offset);
      need(bytesRead > 0, "Artifact shortened while reading");
      offset += bytesRead;
    }
    const after = await handle.stat();
    const final = await lstat(filename);
    need(
      sameIdentity(before, after) &&
        sameIdentity(before, final) &&
        after.nlink === 1 &&
        before.size === after.size &&
        before.mtimeMs === after.mtimeMs &&
        before.ctimeMs === after.ctimeMs,
      "Artifact changed while reading",
      "unsafe_path"
    );
    await unchanged(where);
    return bytes;
  } catch (error) {
    if (error.code === "ELOOP") refuse("unsafe_path", "Symlink artifact refused");
    throw error;
  } finally {
    await handle?.close();
  }
}
async function exists(where, name) {
  try {
    await lstat(path.join(where.directory, name));
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}
async function verifyTree(where) {
  await unchanged(where);
  for (const name of await readdir(where.directory)) {
    need(FILES.has(name), "Attempt contains an unexpected artifact");
    const stat = await lstat(path.join(where.directory, name));
    need(
      stat.isFile() && stat.nlink === 1,
      "Attempt contains an aliased or nonregular artifact",
      "unsafe_path"
    );
  }
  await unchanged(where);
}
async function writeExclusive(where, name, bytes) {
  await unchanged(where);
  const handle = await open(
    path.join(where.directory, name),
    constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
    0o600
  );
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await syncDirectory(where.directory);
  await unchanged(where);
}
async function publishRecord(where, name, bytes) {
  const temporary = `.${name}-${randomUUID()}.tmp`;
  await writeExclusive(where, temporary, bytes);
  // Atomically expose only completely written and fsynced bytes. Never replace.
  try {
    await link(path.join(where.directory, temporary), path.join(where.directory, name));
  } catch (error) {
    // Only discard this operation's private, fully written duplicate on collision.
    // Other failures retain incomplete evidence and never repair the attempt.
    if (error.code === "EEXIST") {
      await unlink(path.join(where.directory, temporary));
      await syncDirectory(where.directory);
    }
    throw error;
  }
  await unlink(path.join(where.directory, temporary));
  await syncDirectory(where.directory);
  await unchanged(where);
}

async function verifyBindings(where, intent, expected) {
  validateIntent(intent, where.attemptRoot);
  checkExpected(intent, expected);
  const preparation = await verifyPreparation({
    controlledRoot: where.controlledRoot,
    logicalRoot: intent.plan.logical_root,
    expectedScope: expected.expectedScope,
    expectedPlanSha256: expected.expectedPlanSha256,
  });
  need(
    preparation.marker_sha256 === intent.preparation_sha256,
    "Preparation marker differs from intent"
  );
  if (intent.schema_version === DERIVED_INTENT_SCHEMA) {
    // This store binds exact immutable input bytes; the derived coordinator owns
    // policy semantics and fresh counting. Read only this package, never history.
    const root = `.council-readings/${intent.plan.sha256}`;
    const packageRoot = `${root}/requests/${intent.attempt_id}`;
    const policy = parseDerived(
      await readExact(where, `${root}/policy.json`, DERIVED_CAPS.policy),
      DERIVED_CAPS.policy
    );
    need(
      policy.schema_version === "council-staged-reading-policy/v2" &&
        policy.policy_sha256 === intent.derived.reading_policy_sha256 &&
        derivedDigest(policy, "policy_sha256") === policy.policy_sha256 &&
        policy.controller_policy_sha256 === intent.controller.policy_sha256 &&
        canonicalJson(policy.plan) === canonicalJson(intent.plan) &&
        canonicalJson(policy.scope) === canonicalJson(intent.scope),
      "Derived policy differs from intent"
    );
    const names = await readdir(path.join(where.controlledRoot, packageRoot));
    need(
      canonicalJson(names.sort()) ===
        canonicalJson(["assessment.json", "intent.json", "packet.json"]),
      "Derived package is incomplete or has unexpected files"
    );
    const bytes = {};
    for (const name of names)
      bytes[name] = await readExact(where, `${packageRoot}/${name}`, DERIVED_CAPS.package);
    need(
      Number.isSafeInteger(policy.limits?.max_package_bytes) &&
        policy.limits.max_package_bytes > 0 &&
        policy.limits.max_package_bytes <= DERIVED_CAPS.package &&
        Object.values(bytes).reduce((n, b) => n + b.length, 0) <= policy.limits.max_package_bytes,
      "Derived package exceeds frozen byte limit"
    );
    need(
      canonicalJson(parseDerived(bytes["intent.json"], DERIVED_CAPS.package)) ===
        canonicalJson(intent) &&
        sha256Bytes(bytes["assessment.json"]) === intent.derived.assessment_sha256 &&
        sha256Bytes(bytes["packet.json"]) === intent.derived.packet_sha256,
      "Derived package bytes changed"
    );
    const manifest = parseDerived(bytes["assessment.json"], DERIVED_CAPS.package);
    need(
      canonicalJson(manifest.sources) ===
        canonicalJson([
          { path: `${packageRoot}/packet.json`, sha256: intent.derived.packet_sha256 },
        ]),
      "Derived source projection changed"
    );
    await unchanged(where);
    return manifest;
  }
  const manifestRef = preparation.files.find(
    (file) => file.path === intent.inputs.source_manifest.path
  );
  need(
    manifestRef?.sha256 === intent.inputs.source_manifest.sha256,
    "Manifest is not bound by the preparation"
  );
  const manifestBytes = await readExact(where, manifestRef.path);
  need(sha256Bytes(manifestBytes) === manifestRef.sha256, "Manifest bytes differ from intent");
  // S1 already verifies the exact manifest shape and each source's actual bytes.
  const manifest = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(manifestBytes));
  await unchanged(where);
  return manifest;
}
async function verifyStored(where, expected) {
  await unchanged(where);
  const intent = parseCanonical(await readExact(where, `${where.attemptRoot}/intent.json`));
  const manifest = await verifyBindings(where, intent, expected);
  await verifyTree(where);
  return { intent, manifest };
}
function newHandle(where, expected, intent, writable = false, dispatchSha256 = null) {
  const handle = Object.freeze({
    intent: freeze(clone(intent)),
    controlledRoot: where.controlledRoot,
    attemptRoot: where.attemptRoot,
    outputPath: path.join(where.directory, "output.txt"),
    provenancePath: path.join(where.directory, "provenance.json"),
  });
  handles.set(handle, { where, expected, writable, dispatchSha256 });
  return handle;
}
async function revalidate(handle, requireWritable = false) {
  const state = handles.get(handle);
  need(
    state && (!requireWritable || state.writable),
    "An authentic store handle with the required authority is required",
    "invalid_attempt_handle"
  );
  const verified = await verifyStored(state.where, state.expected);
  return { ...state, ...verified };
}

/** Create a new private intent; existing directories are never repaired or replaced. */
export async function createAttemptIntent(args) {
  const expected = expectations(args),
    intent = clone(args.intent);
  const where = await location(args.controlledRoot, args.attemptRoot);
  await verifyBindings(where, intent, expected);
  const namespace = path.dirname(where.directory);
  try {
    await mkdir(namespace, { mode: 0o700 });
    await syncDirectory(where.controlledRoot);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
  await directoryChain(namespace);
  // Also flush an existing namespace: a concurrent creator may not have done so yet.
  await syncDirectory(where.controlledRoot);
  try {
    await mkdir(where.directory, { mode: 0o700 });
  } catch (error) {
    if (error.code === "EEXIST")
      refuse(
        "attempt_conflict",
        "Attempt directory already exists; verify it without repairing it"
      );
    throw error;
  }
  where.attemptIdentity = await directoryChain(where.directory);
  await syncDirectory(namespace);
  await publishRecord(where, "intent.json", serialized(intent));
  await verifyStored(where, expected);
  return newHandle(where, expected, intent);
}

/** Reverify persisted intent and preparation against independent caller expectations. */
export async function verifyAttemptIntent(args) {
  const expected = expectations(args);
  const where = await location(args.controlledRoot, args.attemptRoot);
  where.attemptIdentity = await directoryChain(where.directory);
  const { intent } = await verifyStored(where, expected);
  return newHandle(where, expected, intent);
}

/** Bounded exact artifact fingerprint for a callback-free coordinator recheck. */
export async function fingerprintAttemptArtifacts(args) {
  const where = await location(args.controlledRoot, args.attemptRoot);
  where.attemptIdentity = await directoryChain(where.directory);
  await verifyTree(where);
  const fingerprint = [];
  for (const name of [...FILES].sort()) {
    if (!(await exists(where, name))) continue;
    const bytes = await readExact(
      where,
      `${where.attemptRoot}/${name}`,
      name === "output.txt" ? MAX_ATTEMPT_OUTPUT_BYTES : MAX_ATTEMPT_RECORD_BYTES
    );
    fingerprint.push({ name, sha256: sha256Bytes(bytes), byte_length: bytes.length });
  }
  await unchanged(where);
  return freeze(fingerprint);
}

function dispatchRecord(intent) {
  const body = {
    schema_version: DISPATCH_SCHEMA,
    attempt_id: intent.attempt_id,
    intent_sha256: intent.intent_sha256,
    request_json_sha256: intent.request_json_sha256,
    max_client_dispatches: 1,
  };
  return { ...body, dispatch_sha256: sha256Bytes(canonicalJson(body)) };
}
async function readDispatch(state) {
  const record = parseCanonical(
    await readExact(state.where, `${state.where.attemptRoot}/dispatch.json`)
  );
  need(
    canonicalJson(record) === canonicalJson(dispatchRecord(state.intent)),
    "Dispatch claim differs from intent"
  );
  if (state.dispatchSha256)
    need(record.dispatch_sha256 === state.dispatchSha256, "Dispatch claim changed");
  return record;
}

/** Return only after one exclusive dispatch claim is durable. Presence forbids replay. */
export async function claimDispatch({ handle, requestJsonSha256 }) {
  const state = await revalidate(handle);
  need(
    requestJsonSha256 === state.intent.request_json_sha256,
    "Actual request differs from intent"
  );
  for (const name of ["dispatch.json", "output.txt", "provenance.json", "capture.json"]) {
    if (await exists(state.where, name))
      refuse(
        "attempt_already_dispatched",
        "Existing dispatch or result forbids dispatching this attempt"
      );
  }
  const record = dispatchRecord(state.intent);
  try {
    await writeExclusive(state.where, "dispatch.json", serialized(record));
  } catch (error) {
    if (error.code === "EEXIST")
      refuse("attempt_already_dispatched", "Another client already claimed this attempt");
    throw error;
  }
  await readDispatch(state);
  return newHandle(state.where, state.expected, state.intent, true, record.dispatch_sha256);
}

/** Preserve exact raw output/provenance bytes once; no arbitrary destination is accepted. */
export async function writeAttemptArtifactExclusive({ handle, kind, bytes }) {
  need(kind === "output" || kind === "provenance", "Unsupported attempt artifact");
  need(Buffer.isBuffer(bytes), "Attempt artifact bytes must be a Buffer");
  const snapshot = Buffer.from(bytes);
  need(
    snapshot.length <= (kind === "output" ? MAX_ATTEMPT_OUTPUT_BYTES : MAX_ATTEMPT_RECORD_BYTES),
    "Attempt artifact is too large"
  );
  const state = await revalidate(handle, true);
  await readDispatch(state);
  need(!(await exists(state.where, "capture.json")), "A captured attempt cannot be modified");
  await publishRecord(state.where, kind === "output" ? "output.txt" : "provenance.json", snapshot);
}

// Preserve raw JSON bytes, while rejecting duplicate keys at every object depth.
function parseReceipt(bytes) {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const parsed = JSON.parse(text);
    let index = 0;
    const whitespace = () => {
      while (/\s/u.test(text[index] ?? "") && index < text.length) index++;
    };
    function string() {
      const start = index++;
      while (index < text.length) {
        if (text[index] === "\\") {
          index += 2;
          continue;
        }
        if (text[index++] === '"') return JSON.parse(text.slice(start, index));
      }
      throw new Error();
    }
    function value(depth = 0) {
      need(depth <= 64, "Receipt nesting is too deep");
      whitespace();
      if (text[index] === '"') {
        string();
        return;
      }
      if (text[index] === "{" || text[index] === "[") {
        const object = text[index++] === "{",
          end = object ? "}" : "]",
          keys = new Set();
        whitespace();
        if (text[index] === end) {
          index++;
          return;
        }
        for (;;) {
          if (object) {
            whitespace();
            const key = string();
            need(!keys.has(key), "Duplicate receipt key");
            keys.add(key);
            whitespace();
            index++;
          }
          value(depth + 1);
          whitespace();
          if (text[index++] === end) return;
        }
      }
      while (index < text.length && !/[\s,}\]]/u.test(text[index])) index++;
    }
    value();
    canonicalJson(parsed); // Reject unsafe/nonfinite JSON values as well.
    return parsed;
  } catch {
    refuse("attempt_conflict", "Invalid or duplicate-key receipt JSON");
  }
}
function receiptBinding(intent) {
  return {
    intent_sha256: intent.intent_sha256,
    attempt_id: intent.attempt_id,
    operation_id: intent.operation_id,
    node_id: intent.node_id,
    owner_id: intent.owner_id,
    plan_sha256: intent.plan.sha256,
    preparation_sha256: intent.preparation_sha256,
    scope: intent.scope,
    request_json_sha256: intent.request_json_sha256,
    seat_id: intent.seat.seat_id,
    ...(intent.controller ? { controller: intent.controller } : {}),
  };
}
function optionalSame(left, right) {
  return left === undefined || right === undefined
    ? left === right
    : canonicalJson(left) === canonicalJson(right);
}
function finiteNonnegative(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/**
 * Receipt storage shapes: legacy before 1.13, single-provider in 1.13, complete observations
 * from 1.14 (#943). This selects historical verification rules, never execution authority.
 */
export function stagedRoutingContract(facilitatorVersion) {
  const match = /^council-facilitator@(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.exec(
    typeof facilitatorVersion === "string" ? facilitatorVersion : ""
  );
  if (!match) return null;
  const version = match.slice(1).map(Number);
  if (!version.every(Number.isSafeInteger)) return null;
  const before = (threshold) => {
    for (let i = 0; i < 3; i++)
      if (version[i] !== threshold[i]) return version[i] < threshold[i];
    return false;
  };
  return before(ROUTING_EVIDENCE_SINCE) ? "legacy"
    : before(COMPLETE_ROUTING_EVIDENCE_SINCE) ? "single" : "current";
}

/** Dependency-free parity with the Facilitator's verifyServedProvider; tested together. */
export function stagedRoutingVerdict(declared, observed) {
  if (!Array.isArray(declared) || declared.length === 0) return "NOT_PINNED";
  const observations = Array.isArray(observed) ? observed : [observed];
  const usable = (name) => typeof name === "string" && name.trim().length > 0;
  const matches = (name) => declared.some((candidate) =>
    typeof candidate === "string" && candidate.trim().toLowerCase() === name.trim().toLowerCase());
  if (observations.some((name) => usable(name) && !matches(name))) return "FAIL";
  if (!observations.length || observations.some((name) => !usable(name))) return "UNVERIFIABLE";
  return "PASS";
}

/** Complete observations must agree across the attempt, final list and compatibility scalars. */
export function stagedProviderObservationsProblem(attempt, routing) {
  const observations = attempt?.served_provider_observations;
  const valid = (names) => Array.isArray(names) &&
    names.every((name) => typeof name === "string" && name.trim().length > 0);
  if (!valid(observations) || !valid(routing?.observed_providers))
    return "routing_observations_missing_or_invalid";
  if (canonicalJson(observations) !== canonicalJson(routing.observed_providers))
    return "routing_observations_disagree";
  const last = observations.at(-1) ?? null;
  if (attempt.served_provider !== last || routing.observed !== last)
    return "routing_last_observation_disagrees";
  return null;
}

/**
 * Complete routing evidence judged against the frozen recipe, never the receipt's own policy.
 * Historical storage verification does not qualify an old receipt for a new reading.
 */
export function stagedRoutingProblem(receipt, admitted) {
  const routing = receipt?.final?.provider_verification;
  const attempt = receipt?.attempts?.[0];
  if (stagedRoutingContract(receipt?.facilitator_version) !== "current")
    return "routing_contract_not_current";
  if (!routing || typeof routing !== "object" || !attempt) return "routing_evidence_missing";
  if (admitted !== null && (!Array.isArray(admitted) || admitted.length === 0 ||
      admitted.some((name) => typeof name !== "string" || !name.trim())))
    return "routing_policy_invalid";
  if (canonicalJson(routing.declared ?? null) !== canonicalJson(admitted))
    return "routing_policy_differs_from_frozen_recipe";
  const observationProblem = stagedProviderObservationsProblem(attempt, routing);
  if (observationProblem) return observationProblem;
  if (routing.result !== stagedRoutingVerdict(admitted, routing.observed_providers))
    return "routing_result_contradicts_evidence";
  if (admitted !== null && attempt.outcome === "success" && routing.result !== "PASS")
    return "pinned_success_without_routing_proof";
  return null;
}

function validateReceiptEvidence(receipt, attempt, intent) {
  const final = receipt.final,
    identity = final.verification,
    effort = final.effort_verification;
  need(
    final.assurance_tier === "local_capture_provider_attested",
    "OpenRouter capture cannot claim a stronger assurance tier"
  );
  need(
    identity &&
      ["PASS", "FAIL", "UNVERIFIABLE"].includes(identity.result) &&
      ["literal", "semantic", "none"].includes(identity.match_kind) &&
      identity.declared === intent.seat.declared_model &&
      (identity.observed === null || label(identity.observed)) &&
      identity.observed === attempt.model_field,
    "Receipt identity evidence is missing or inconsistent"
  );
  need(
    attempt.model_field === null || label(attempt.model_field),
    "Attempt lacks explicit model evidence"
  );
  for (const source of [attempt.model_identity_source, identity.model_identity_source])
    need(
      source === undefined || source === "provider_response",
      "OpenRouter model evidence cannot claim a different source"
    );
  if (identity.observed === null)
    need(
      identity.match_kind === "none",
      "Missing model identity cannot have a matching identity witness"
    );
  else
    need(
      attempt.model_identity_source === "provider_response" &&
        identity.model_identity_source === "provider_response",
      "Observed identity needs its provider-response source"
    );
  need(
    attempt.http_status === null ||
      (Number.isInteger(attempt.http_status) &&
        attempt.http_status >= 100 &&
        attempt.http_status <= 599),
    "Invalid HTTP evidence"
  );
  need(
    Number.isSafeInteger(attempt.content_length) &&
      attempt.content_length >= 0 &&
      finiteNonnegative(attempt.duration_ms) &&
      finiteNonnegative(final.total_duration_ms),
    "Invalid content length or elapsed-time evidence"
  );
  need(
    attempt.finish_reason === null || label(attempt.finish_reason),
    "Attempt lacks finish evidence"
  );
  for (const key of ["stream_events", "stream_chunks"])
    if (attempt[key] !== undefined)
      need(
        Number.isSafeInteger(attempt[key]) && attempt[key] >= 0,
        "Invalid stream count evidence"
      );
  if (attempt.stream_done !== undefined)
    need(typeof attempt.stream_done === "boolean", "Invalid stream termination evidence");
  need(
    Object.hasOwn(attempt, "tokens"),
    "Attempt must explicitly preserve known or unknown token usage"
  );
  if (attempt.usage !== undefined)
    need(
      attempt.usage !== null && typeof attempt.usage === "object" && !Array.isArray(attempt.usage),
      "Invalid raw usage evidence"
    );
  if (attempt.tokens === null) {
    need(
      attempt.usage_unavailable ===
        (attempt.usage === undefined ? "usage_absent" : "usage_unrecognized"),
      "Unknown token usage needs its explicit reason"
    );
  } else {
    need(
      exact(attempt.tokens, ["prompt", "completion", "total", "reasoning"]) &&
        ["prompt", "completion", "total"].every(
          (key) => typeof attempt.tokens[key] === "number" && Number.isFinite(attempt.tokens[key])
        ) &&
        (attempt.tokens.reasoning === null ||
          (typeof attempt.tokens.reasoning === "number" &&
            Number.isFinite(attempt.tokens.reasoning))) &&
        attempt.usage !== undefined &&
        attempt.usage_unavailable === undefined,
      "Normalized token usage lacks its raw evidence"
    );
  }
  need(
    exact(effort, ["result", "declared", "evidence", "observed_reasoning_tokens"]) &&
      ["PASS", "FAIL", "UNVERIFIABLE"].includes(effort.result) &&
      (effort.declared === null ||
        ["none", "minimal", "low", "medium", "high", "xhigh", "max"].includes(effort.declared)) &&
      effort.evidence === "reasoning_tokens",
    "Receipt lacks complete effort evidence"
  );
  const observedReasoning = final.tokens?.reasoning ?? null;
  need(
    effort.observed_reasoning_tokens === observedReasoning,
    "Effort evidence differs from preserved token usage"
  );
  const expectedEffort =
    effort.declared === null || effort.declared === "none"
      ? "PASS"
      : observedReasoning === null
        ? "UNVERIFIABLE"
        : observedReasoning > 0
          ? "PASS"
          : "FAIL";
  need(effort.result === expectedEffort, "Effort result contradicts its recorded evidence");
  // scaffold#917: routing evidence, required or forbidden by the producer's recorded version. Its
  // agreement with the frozen recipe's admitted providers is checked by the controller and the
  // reading guard (stagedRoutingProblem), which can derive them; this module cannot.
  const contract = stagedRoutingContract(receipt.facilitator_version);
  need(contract !== null, "Receipt names no Facilitator release to judge its routing evidence by");
  const routing = final.provider_verification;
  if (contract === "legacy") {
    need(
      routing === undefined && !Object.hasOwn(attempt, "served_provider") &&
        !Object.hasOwn(attempt, "served_provider_observations"),
      "A Facilitator before 1.13.0 cannot have recorded routing evidence"
    );
  } else {
    need(
      exact(routing, ["result", "declared", "evidence", "observed",
        ...(contract === "current" ? ["observed_providers"] : [])]) &&
        ROUTING_RESULTS.includes(routing.result) &&
        routing.evidence === "response_provider_field" &&
        (routing.declared === null ||
          (Array.isArray(routing.declared) &&
            routing.declared.length > 0 &&
            routing.declared.every((name) => typeof name === "string" && name.trim().length > 0) &&
            new Set(routing.declared).size === routing.declared.length)) &&
        (routing.observed === null || typeof routing.observed === "string") &&
        Object.hasOwn(attempt, "served_provider") &&
        attempt.served_provider === routing.observed,
      "Receipt lacks complete routing evidence"
    );
    need(
      contract === "current"
        ? stagedProviderObservationsProblem(attempt, routing) === null
        : !Object.hasOwn(attempt, "served_provider_observations"),
      "Receipt lacks consistent complete provider observations for its producer"
    );
    need(
      routing.result === stagedRoutingVerdict(routing.declared,
        contract === "current" ? routing.observed_providers : routing.observed),
      "Routing result contradicts its recorded evidence"
    );
    need(
      (attempt.outcome !== "provider_mismatch" || routing.result === "FAIL") &&
        (attempt.outcome !== "success" || routing.result !== "FAIL"),
      "Attempt outcome contradicts its routing evidence"
    );
  }
  const outcomes = {
    success: ["success"],
    retries_exhausted_transient: [
      "transient_network",
      "attempt_timeout",
      "response_body_error",
      "invalid_response_body",
      "transient_server_error",
      "rate_limited",
    ],
    retries_exhausted_empty_content: ["empty_content", "truncated_content"],
    model_mismatch_no_retry: ["model_mismatch"],
    provider_mismatch_no_retry: ["provider_mismatch"],
    permanent_provider_error: ["permanent_provider_error"],
  };
  need(
    outcomes[final.outcome]?.includes(attempt.outcome),
    "Final outcome contradicts the sole attempt"
  );
  if (final.outcome === "success") {
    need(
      attempt.http_status >= 200 &&
        attempt.http_status < 300 &&
        attempt.content_length > 0 &&
        attempt.finish_reason !== "length" &&
        attempt.error_phase === undefined &&
        attempt.response_body_parse_error === undefined &&
        identity.result !== "FAIL",
      "Successful receipt contradicts its transport or identity evidence"
    );
    need(
      optionalSame(final.tokens, attempt.tokens) &&
        optionalSame(final.usage, attempt.usage) &&
        optionalSame(final.usage_unavailable, attempt.usage_unavailable),
      "Successful final usage differs from the sole attempt"
    );
    if (intent.seat.transport === "sse")
      need(
        Number.isSafeInteger(attempt.stream_events) &&
          Number.isSafeInteger(attempt.stream_chunks) &&
          typeof attempt.stream_done === "boolean" &&
          (attempt.stream_done || attempt.finish_reason === "stop"),
        "Successful SSE receipt lacks terminal stream evidence"
      );
  }
  for (const [key, expected] of [
    ["council_research_run_id", intent.scope.research_run_id],
    ["phase", intent.scope.phase],
  ]) {
    if (receipt[key] !== undefined)
      need(receipt[key] === expected, "Receipt cross-link differs from the bound scope");
  }
}
async function captureEvidence(state) {
  const dispatch = await readDispatch(state);
  const receiptBytes = await readExact(state.where, `${state.where.attemptRoot}/provenance.json`);
  const receipt = parseReceipt(receiptBytes),
    intent = state.intent;
  if (intent.controller) {
    const { verifyController, readController } =
      await import("./council-staged-controller-store.mjs");
    const controller = await verifyController({
      controlledRoot: state.where.controlledRoot,
      expectedPolicySha256: intent.controller.policy_sha256,
      expectedPlanSha256: intent.plan.sha256,
      expectedScope: intent.scope,
      nowMs: Date.now(),
    });
    const history = await readController({ handle: controller, nowMs: Date.now() });
    const reservation = history.events.find(
      (event) =>
        event.type === "reservation" && event.payload.attempt.attempt_id === intent.attempt_id
    );
    const authorization = history.events.find(
      (event) => event.type === "dispatch" && event.payload.attempt_id === intent.attempt_id
    );
    need(
      reservation &&
        authorization &&
        reservation.payload.attempt.intent_sha256 === intent.intent_sha256 &&
        reservation.payload.attempt.request_json_sha256 === intent.request_json_sha256 &&
        authorization.payload.reservation_sha256 === reservation.event_sha256,
      "Controlled capture lacks a bound reservation and dispatch authorization"
    );
    need(
      canonicalJson(receipt.staged_controller) ===
        canonicalJson({
          logical_root: intent.controller.logical_root,
          policy_sha256: intent.controller.policy_sha256,
          reservation_sha256: reservation.event_sha256,
          dispatch_sha256: authorization.event_sha256,
        }),
      "Receipt controller authorization differs from the immutable journal"
    );
  } else
    need(
      receipt.staged_controller === undefined,
      "Standalone receipt cannot claim controller authority"
    );
  need(
    canonicalJson(receipt.staged_attempt) === canonicalJson(receiptBinding(intent)),
    "Receipt staged binding differs from intent"
  );
  need(
    receipt.member === intent.seat.member &&
      receipt.declared_model === intent.seat.declared_model &&
      receipt.substrate === intent.seat.provider &&
      receipt.transport === intent.seat.transport &&
      receipt.endpoint === "https://openrouter.ai/api/v1/chat/completions",
    "Receipt route differs from intent"
  );
  need(label(receipt.facilitator_version), "Receipt lacks Facilitator version");
  need(
    receipt.artifact_path === `${state.where.attemptRoot}/output.txt`,
    "Receipt output path differs from the fixed attempt path"
  );
  need(
    receipt.request?.request_json_sha256 === intent.request_json_sha256 &&
      receipt.request?.max_retries === 0 &&
      receipt.request?.per_attempt_timeout_ms === intent.limits.per_attempt_timeout_ms &&
      receipt.request?.total_timeout_ms === intent.limits.total_timeout_ms &&
      receipt.request?.system_prompt_sha256 === intent.inputs.system_prompt_sha256 &&
      receipt.request?.user_prompt_sha256 === intent.inputs.user_prompt_sha256,
    "Receipt request differs from intent"
  );
  need(
    canonicalJson(receipt.source_file_paths) ===
      canonicalJson(state.manifest.sources.map((source) => source.path)) &&
      canonicalJson(receipt.source_file_hashes) ===
        canonicalJson(state.manifest.sources.map((source) => source.sha256)),
    "Receipt source evidence differs from preparation"
  );
  need(
    Array.isArray(receipt.attempts) &&
      receipt.attempts.length === 1 &&
      receipt.final?.retries_used === 0,
    "Capture requires exactly one attempt without retries"
  );
  const attempt = receipt.attempts[0];
  need(
    attempt.attempt === 1 &&
      attempt.max_tokens === intent.seat.output_reservation &&
      attempt.transport === intent.seat.transport &&
      attempt.request_json_sha256 === intent.request_json_sha256,
    "Actual attempt differs from its frozen reservation or request"
  );
  need(
    [
      "success",
      "retries_exhausted_transient",
      "retries_exhausted_empty_content",
      "model_mismatch_no_retry",
      "provider_mismatch_no_retry",
      "permanent_provider_error",
    ].includes(receipt.final.outcome),
    "Receipt final outcome is invalid"
  );
  validateReceiptEvidence(receipt, attempt, intent);
  let output = null;
  if (await exists(state.where, "output.txt")) {
    const bytes = await readExact(
      state.where,
      `${state.where.attemptRoot}/output.txt`,
      MAX_ATTEMPT_OUTPUT_BYTES
    );
    const digest = sha256Bytes(bytes);
    need(
      receipt.output_file_sha256 === digest &&
        receipt.final.file_artifact_sha256 === digest &&
        attempt.content_sha256 === digest,
      "Output digests differ from the actual preserved bytes"
    );
    const content = new TextDecoder("utf-8", {
      fatal: true,
      ignoreBOM: true,
    }).decode(bytes);
    need(
      content.length === attempt.content_length,
      "Output length differs from the recorded content"
    );
    output = {
      path: `${state.where.attemptRoot}/output.txt`,
      sha256: digest,
      byte_length: bytes.length,
    };
  } else {
    need(
      receipt.final.outcome !== "success" &&
        receipt.output_file_sha256 === undefined &&
        receipt.final.file_artifact_sha256 === undefined,
      "Successful or output-bound receipt has no output"
    );
  }
  if (receipt.final.outcome === "success")
    need(attempt.outcome === "success", "Final success contradicts attempt outcome");
  await verifyTree(state.where);
  return {
    schema_version: CAPTURE_SCHEMA,
    state: "captured",
    attempt_id: intent.attempt_id,
    intent_sha256: intent.intent_sha256,
    dispatch_sha256: dispatch.dispatch_sha256,
    provenance: {
      path: `${state.where.attemptRoot}/provenance.json`,
      sha256: sha256Bytes(receiptBytes),
      byte_length: receiptBytes.length,
    },
    output,
    provider_outcome: receipt.final.outcome,
  };
}
async function verifyCapture(state) {
  const record = parseCanonical(
    await readExact(state.where, `${state.where.attemptRoot}/capture.json`)
  );
  const evidence = await captureEvidence(state);
  const expected = {
    ...evidence,
    capture_sha256: sha256Bytes(canonicalJson(evidence)),
  };
  need(
    canonicalJson(record) === canonicalJson(expected),
    "Capture marker differs from actual immutable evidence"
  );
  return freeze(record);
}
async function captureFailure(state, operation) {
  try {
    return await operation();
  } catch (error) {
    if (error.code === "unsafe_path") throw error;
    if (await exists(state.where, "dispatch.json"))
      refuse(
        "ambiguous_attempt",
        "Dispatch exists without a complete verifiable capture; retain it and never replay this ID"
      );
    refuse("attempt_not_dispatched", "Attempt has no dispatch claim");
  }
}

/** Revalidate raw receipt/output and publish capture; recovery never dispatches. */
export async function captureAttempt({ handle }) {
  const state = await revalidate(handle);
  return captureFailure(state, async () => {
    if (await exists(state.where, "capture.json")) return verifyCapture(state);
    const evidence = await captureEvidence(state);
    const record = {
      ...evidence,
      capture_sha256: sha256Bytes(canonicalJson(evidence)),
    };
    try {
      await publishRecord(state.where, "capture.json", serialized(record));
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
    return verifyCapture(state);
  });
}

/** Read-only recovery: a complete capture re-verifies; a claimed partial attempt is ambiguous. */
export async function verifyAttemptCapture(args) {
  const handle = await verifyAttemptIntent(args);
  const state = await revalidate(handle);
  return captureFailure(state, () => verifyCapture(state));
}

/** Inspect recovery without dispatch or broadening ambiguous errors into replay authority. */
export async function inspectAttemptRecovery(args) {
  const handle = await verifyAttemptIntent(args);
  const state = await revalidate(handle);
  const base = { intent: state.intent };
  if (!(await exists(state.where, "dispatch.json"))) {
    const stray = await Promise.all(
      ["output.txt", "provenance.json", "capture.json"].map((name) => exists(state.where, name))
    );
    return freeze({
      ...base,
      state: stray.some(Boolean) ? "invalid_evidence" : "not_dispatched",
      reason: stray.some(Boolean) ? "artifacts_without_dispatch" : "intent_only",
    });
  }
  // Intent, preparation, paths and dispatch are always verified outside the
  // incomplete-evidence branch. Corruption here can never authorize a replay.
  const dispatch = await readDispatch(state);
  if (!(await exists(state.where, "provenance.json"))) {
    if (await exists(state.where, "capture.json"))
      return freeze({
        ...base,
        dispatch,
        state: "invalid_evidence",
        reason: "capture_without_provenance",
      });
    if (await exists(state.where, "output.txt")) {
      const bytes = await readExact(
        state.where,
        `${state.where.attemptRoot}/output.txt`,
        MAX_ATTEMPT_OUTPUT_BYTES
      );
      try {
        new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      } catch {
        return freeze({
          ...base,
          dispatch,
          state: "invalid_evidence",
          reason: "invalid_output_utf8",
        });
      }
    }
    await verifyTree(state.where);
    return freeze({
      ...base,
      dispatch,
      state: "incomplete",
      reason: "dispatch_without_complete_provenance",
    });
  }
  try {
    const evidence = await captureEvidence(state);
    const receipt = parseReceipt(
      await readExact(state.where, `${state.where.attemptRoot}/provenance.json`)
    );
    // Successful provenance is published only after durable output. A missing or
    // changed output with present provenance is invalid, not a replayable crash.
    if (await exists(state.where, "capture.json"))
      return freeze({
        ...base,
        dispatch,
        state: "captured",
        capture: await verifyCapture(state),
        receipt,
      });
    return freeze({ ...base, dispatch, state: "capture_ready", receipt, evidence });
  } catch (error) {
    if (error.code === "unsafe_path") throw error;
    return freeze({
      ...base,
      dispatch,
      state: "invalid_evidence",
      reason: "present_artifacts_failed_verification",
    });
  }
}

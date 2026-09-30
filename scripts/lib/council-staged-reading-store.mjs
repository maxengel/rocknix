#!/usr/bin/env node
/**
 * Purpose: Preserve one frozen reading policy and immutable raw-note bundles.
 * Usage: createReadingStore / publishAcceptedLeaf / readAcceptedLeaves.
 * This is storage integrity, not semantic acceptance or quota authority. Callers
 * revalidate preparation, authentic capture, accounting and note semantics.
 * The local filesystem is trusted; a fresh handle cannot detect a coherent
 * historical rollback without independently retained acceptance evidence.
 */
import { constants } from "node:fs";
import { link, lstat, mkdir, open, readdir, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { canonicalJson, sha256Bytes } from "./council-staged-sources.mjs";

export const MAX_READING_POLICY_BYTES = 1024 * 1024;
export const MAX_READING_BUNDLE_BYTES = 4 * 1024 * 1024;
export const MAX_READING_NOTE_BYTES = 1024 * 1024;
export const MAX_READING_RECORDS = 4096;
const HASH = /^[a-f0-9]{64}$/;
const PUBLICATION = ".publication.json";
const MAX_PUBLICATION_BYTES = 2048;
const handles = new WeakMap();

function need(value, message, code = "reading_conflict") {
  if (!value) throw Object.assign(new Error(message), { code });
}
function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function exact(value, keys) {
  return (
    object(value) &&
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key))
  );
}
function integer(value, minimum = 0) {
  return Number.isSafeInteger(value) && value >= minimum;
}
function label(value) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= 1024 &&
    !/[\x00-\x1f\x7f]/u.test(value)
  );
}
function digest(value, key) {
  const { [key]: ignored, ...body } = value;
  return sha256Bytes(canonicalJson(body));
}
function unicode(value) {
  if (typeof value === "string") {
    need(value.isWellFormed(), "Record contains malformed Unicode");
  } else if (object(value) || Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      need(key.isWellFormed(), "Record key contains malformed Unicode");
      unicode(child);
    }
  }
}
function encode(value, limit) {
  let text;
  try {
    // Canonical encoding rejects accessors, cycles, deep records and non-JSON values
    // before the scalar-value check traverses the resulting detached JSON.
    text = canonicalJson(value);
    unicode(JSON.parse(text));
  } catch {
    need(false, "Reading records must contain strict JSON");
  }
  const bytes = Buffer.from(`${text}\n`);
  need(bytes.length <= limit, "Reading record exceeds its byte bound");
  return bytes;
}
function clone(value, limit) {
  return JSON.parse(encode(value, limit).toString("utf8"));
}
function frozen(value) {
  if (object(value) || Array.isArray(value)) {
    Object.values(value).forEach(frozen);
    Object.freeze(value);
  }
  return value;
}
function parse(bytes, limit) {
  try {
    const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    need(encode(value, limit).equals(bytes), "Reading record is not canonical");
    return value;
  } catch {
    need(false, "Partial, invalid or noncanonical reading record", "reading_corrupt");
  }
}
function expectations(args) {
  need(
    HASH.test(args.expectedPlanSha256 ?? "") && HASH.test(args.expectedPolicySha256 ?? ""),
    "Independent plan and policy digests are required"
  );
  return Object.freeze({
    expectedPlanSha256: args.expectedPlanSha256,
    expectedPolicySha256: args.expectedPolicySha256
  });
}
function checkPolicy(policy, expected) {
  need(
    object(policy) &&
      object(policy.plan) &&
      policy.plan.sha256 === expected.expectedPlanSha256 &&
      policy.policy_sha256 === expected.expectedPolicySha256 &&
      digest(policy, "policy_sha256") === policy.policy_sha256,
    "Reading policy differs from its independent bindings"
  );
  need(
    object(policy.limits) &&
      integer(policy.limits.max_records, 1) &&
      policy.limits.max_records <= MAX_READING_RECORDS &&
      integer(policy.limits.max_note_bytes, 1) &&
      policy.limits.max_note_bytes <= MAX_READING_NOTE_BYTES,
    "Reading policy has invalid storage bounds"
  );
  need(
    Array.isArray(policy.members) &&
      policy.members.length > 0 &&
      policy.members.length <= policy.limits.max_records,
    "Reading policy requires a bounded member map"
  );
  const nodes = new Map();
  for (const member of policy.members) {
    need(
      object(member) &&
        ["owner_id", "member", "seat_id"].every((key) => label(member[key])) &&
        Array.isArray(member.leaves) &&
        member.leaves.length > 0 &&
        member.leaves.length <= policy.limits.max_records,
      "Reading policy has an invalid member or leaf map"
    );
    for (const leaf of member.leaves) {
      need(
        object(leaf) && label(leaf.node_id) && label(leaf.chunk_id) && !nodes.has(leaf.node_id),
        "Reading policy has an invalid or duplicate leaf node"
      );
      nodes.set(leaf.node_id, leaf);
    }
  }
  need(nodes.size <= policy.limits.max_records, "Declared leaves exceed the record bound");
  return nodes;
}
function checkBundle(bundle, policy, nodes, nodeId) {
  need(
    exact(bundle, ["record", "note_base64"]) &&
      object(bundle.record) &&
      typeof bundle.note_base64 === "string",
    "Invalid reading bundle"
  );
  const record = bundle.record;
  need(
    nodes.has(nodeId) &&
      record.node_id === nodeId &&
      record.plan_sha256 === policy.plan.sha256 &&
      record.policy_sha256 === policy.policy_sha256 &&
      HASH.test(record.accepted_sha256 ?? "") &&
      digest(record, "accepted_sha256") === record.accepted_sha256,
    "Accepted record differs from its declared node, policy or digest"
  );
  need(
    exact(record.note, ["sha256", "byte_length"]) &&
      HASH.test(record.note.sha256 ?? "") &&
      integer(record.note.byte_length) &&
      record.note.byte_length <= policy.limits.max_note_bytes,
    "Invalid bounded raw-note reference"
  );
  const noteBytes = Buffer.from(bundle.note_base64, "base64");
  need(
    noteBytes.toString("base64") === bundle.note_base64 &&
      noteBytes.length === record.note.byte_length &&
      sha256Bytes(noteBytes) === record.note.sha256,
    "Raw note bytes differ from their exact record binding"
  );
  return { record, noteBytes };
}
function sameInode(a, b) {
  return a.dev === b.dev && a.ino === b.ino;
}
async function directories(absolute) {
  let current = path.parse(absolute).root;
  for (const piece of absolute.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, piece);
    const entry = await lstat(current);
    need(
      entry.isDirectory() && !entry.isSymbolicLink(),
      "Reading ancestors must be real directories",
      "unsafe_path"
    );
  }
  return lstat(absolute);
}
async function syncDirectory(directory) {
  const fd = await open(
    directory,
    constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW
  );
  try {
    await fd.sync();
  } finally {
    await fd.close();
  }
}
async function location(controlledRoot, expected) {
  need(
    typeof controlledRoot === "string" &&
      path.isAbsolute(controlledRoot) &&
      path.resolve(controlledRoot) === controlledRoot,
    "Controlled root must be exact and absolute",
    "unsafe_path"
  );
  const logicalRoot = `.council-readings/${expected.expectedPlanSha256}`;
  return {
    controlledRoot,
    logicalRoot,
    directory: path.join(controlledRoot, logicalRoot),
    rootIdentity: await directories(controlledRoot)
  };
}
// Only the canonical publication record and its declared private source may alias.
async function publicationUnchanged(where) {
  if (!where.publication) return;
  const { identity, source, destination } = where.publication;
  for (const filename of [source, destination]) {
    const current = await lstat(filename);
    need(
      current.isFile() &&
        current.nlink === 2 &&
        sameInode(identity, current) &&
        current.size === identity.size &&
        current.mtimeMs === identity.mtimeMs &&
        current.ctimeMs === identity.ctimeMs,
      "Reading publication changed or has unexpected aliases",
      "unsafe_path"
    );
  }
}

// Legacy roots are directories. New roots are one atomically linked, complete
// publication record; an unfinished staging directory is never a selected root.
async function resolvePublication(where, expected) {
  const destination = where.directory;
  const entry = await lstat(destination);
  if (entry.isDirectory()) return where;
  need(
    entry.isFile() && entry.nlink === 2 && entry.size <= MAX_PUBLICATION_BYTES,
    "Reading root must be a legacy directory or an exact publication pair",
    "unsafe_path"
  );
  const fd = await open(
    destination,
    constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK
  );
  let bytes, identity;
  try {
    identity = await fd.stat();
    need(
      sameInode(entry, identity) &&
        identity.isFile() &&
        identity.nlink === 2 &&
        identity.size <= MAX_PUBLICATION_BYTES,
      "Reading publication changed",
      "unsafe_path"
    );
    bytes = Buffer.alloc(identity.size);
    for (let offset = 0; offset < bytes.length;) {
      const { bytesRead } = await fd.read(bytes, offset, bytes.length - offset, offset);
      need(bytesRead > 0, "Partial reading publication", "reading_corrupt");
      offset += bytesRead;
    }
    await fd.sync();
  } finally {
    await fd.close();
  }
  const record = parse(bytes, MAX_PUBLICATION_BYTES);
  need(
    exact(record, ["schema_version", "plan_sha256", "policy_sha256", "storage"]) &&
      record.schema_version === "council-reading-publication/v1" &&
      record.plan_sha256 === expected.expectedPlanSha256 &&
      record.policy_sha256 === expected.expectedPolicySha256 &&
      typeof record.storage === "string" &&
      new RegExp(`^\\.init-${expected.expectedPlanSha256}-[a-f0-9-]{36}$`).test(record.storage),
    "Reading publication differs from its independent bindings",
    "reading_conflict"
  );
  where.directory = path.join(path.dirname(destination), record.storage);
  where.publication = {
    identity,
    source: path.join(where.directory, PUBLICATION),
    destination
  };
  await directories(where.directory);
  await publicationUnchanged(where);
  await syncDirectory(path.dirname(destination));
  return where;
}

async function unchanged(where) {
  await publicationUnchanged(where);
  for (const [identity, directory] of [
    [where.rootIdentity, where.controlledRoot],
    [where.identity, where.directory],
    [where.acceptedIdentity, path.join(where.directory, "accepted")]
  ])
    if (identity)
      need(
        sameInode(identity, await directories(directory)),
        "Reading directory changed",
        "unsafe_path"
      );
}
async function read(where, relative, limit) {
  const filename = path.join(where.directory, relative);
  await directories(path.dirname(filename));
  const entry = await lstat(filename);
  need(
    entry.isFile() && entry.nlink === 1,
    "Reading artifacts must be unaliased regular files",
    "unsafe_path"
  );
  const fd = await open(filename, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const before = await fd.stat();
    need(
      sameInode(entry, before) && before.isFile() && before.nlink === 1 && before.size <= limit,
      "Invalid or oversized reading artifact",
      "reading_corrupt"
    );
    const bytes = Buffer.alloc(before.size);
    for (let offset = 0; offset < bytes.length;) {
      const { bytesRead } = await fd.read(bytes, offset, bytes.length - offset, offset);
      need(bytesRead > 0, "Reading artifact shortened", "reading_corrupt");
      offset += bytesRead;
    }
    const after = await fd.stat(),
      final = await lstat(filename);
    need(
      sameInode(before, after) &&
        sameInode(before, final) &&
        after.nlink === 1 &&
        final.nlink === 1 &&
        before.size === after.size &&
        before.mtimeMs === after.mtimeMs &&
        before.ctimeMs === after.ctimeMs,
      "Reading artifact changed while reading",
      "reading_corrupt"
    );
    await fd.sync();
    await syncDirectory(path.dirname(filename));
    await unchanged(where);
    return bytes;
  } finally {
    await fd.close();
  }
}
async function writeExclusive(where, relative, bytes) {
  await unchanged(where);
  const filename = path.join(where.directory, relative);
  const fd = await open(
    filename,
    constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
    0o600
  );
  try {
    await fd.writeFile(bytes);
    await fd.sync();
  } finally {
    await fd.close();
  }
  await syncDirectory(path.dirname(filename));
  await unchanged(where);
}
async function publish(where, relative, bytes) {
  const temporary = path.join(path.dirname(relative), `.pending-${randomUUID()}`);
  await writeExclusive(where, temporary, bytes);
  try {
    await link(path.join(where.directory, temporary), path.join(where.directory, relative));
  } catch (error) {
    if (error.code === "EEXIST") {
      // Only our fully flushed private duplicate is discarded, never prior evidence.
      await unlink(path.join(where.directory, temporary));
      await syncDirectory(path.dirname(path.join(where.directory, relative)));
    }
    throw error;
  }
  await unlink(path.join(where.directory, temporary));
  await syncDirectory(path.dirname(path.join(where.directory, relative)));
  await unchanged(where);
}
const filenameFor = (nodeId) => `${sha256Bytes(nodeId)}.json`;
async function load(where, expected, remembered = new Map()) {
  await unchanged(where);
  const entries = (await readdir(where.directory)).sort();
  need(
    canonicalJson(entries) ===
      canonicalJson(
        [...(where.publication ? [PUBLICATION] : []), "accepted", "policy.json"].sort()
      ),
    "Reading tree contains missing or unexpected artifacts",
    "reading_corrupt"
  );
  const policy = parse(
    await read(where, "policy.json", MAX_READING_POLICY_BYTES),
    MAX_READING_POLICY_BYTES
  );
  const nodes = checkPolicy(policy, expected);
  const names = (await readdir(path.join(where.directory, "accepted"))).sort();
  const namesToNodes = new Map([...nodes.keys()].map((nodeId) => [filenameFor(nodeId), nodeId]));
  need(
    names.length <= policy.limits.max_records && names.every((name) => namesToNodes.has(name)),
    "Reading tree contains an undeclared, partial or excess bundle",
    "reading_corrupt"
  );
  const bundles = new Map();
  for (const name of names) {
    const bytes = await read(where, `accepted/${name}`, MAX_READING_BUNDLE_BYTES);
    const bundle = parse(bytes, MAX_READING_BUNDLE_BYTES);
    const nodeId = namesToNodes.get(name);
    bundles.set(nodeId, {
      ...checkBundle(bundle, policy, nodes, nodeId),
      digest: sha256Bytes(bytes)
    });
  }
  for (const [nodeId, hash] of remembered)
    need(
      bundles.get(nodeId)?.digest === hash,
      "Previously observed acceptance was removed or changed",
      "reading_corrupt"
    );
  await unchanged(where);
  return { policy, nodes, bundles };
}
async function stableLoad(where, expected, remembered) {
  for (let retry = 0; ; retry++) {
    try {
      return await load(where, expected, remembered);
    } catch (error) {
      // A concurrent publisher temporarily exposes its private file or two links.
      // Persistent corruption is refused, retained and never silently repaired.
      if (!["reading_corrupt", "unsafe_path", "ENOENT"].includes(error.code) || retry >= 32)
        throw error;
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  }
}
function handleFor(where, expected, loaded) {
  const handle = Object.freeze({
    controlledRoot: where.controlledRoot,
    logicalRoot: where.logicalRoot,
    policy: frozen(clone(loaded.policy, MAX_READING_POLICY_BYTES))
  });
  handles.set(handle, {
    where,
    expected,
    remembered: new Map([...loaded.bundles].map(([id, b]) => [id, b.digest]))
  });
  return handle;
}
async function revalidate(handle) {
  const privateState = handles.get(handle);
  need(privateState, "An authentic reading-store handle is required", "invalid_reading_handle");
  const loaded = await stableLoad(
    privateState.where,
    privateState.expected,
    privateState.remembered
  );
  for (const [id, bundle] of loaded.bundles) privateState.remembered.set(id, bundle.digest);
  return { ...loaded, privateState };
}

export async function createReadingStore(args) {
  const expected = expectations(args),
    policy = clone(args.policy, MAX_READING_POLICY_BYTES);
  checkPolicy(policy, expected);
  const where = await location(args.controlledRoot, expected),
    parent = path.dirname(where.directory);
  try {
    await mkdir(parent, { mode: 0o700 });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
  await directories(parent);
  await syncDirectory(where.controlledRoot);
  // Existing evidence always wins, including empty directories and symlinks.
  // link below is the final no-overwrite arbiter if a peer publishes after this read.
  try {
    await lstat(where.directory);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return createUnpublishedReadingStore(where, expected, policy);
  }
  return verifyReadingStore({
    controlledRoot: where.controlledRoot,
    ...expected
  });
}

async function createUnpublishedReadingStore(where, expected, policy) {
  const parent = path.dirname(where.directory);
  const destination = where.directory;
  const storage = `.init-${expected.expectedPlanSha256}-${randomUUID()}`;
  where.directory = path.join(parent, storage);
  await mkdir(where.directory, { mode: 0o700 });
  where.identity = await directories(where.directory);
  await syncDirectory(parent);
  await mkdir(path.join(where.directory, "accepted"), { mode: 0o700 });
  where.acceptedIdentity = await directories(path.join(where.directory, "accepted"));
  await syncDirectory(where.directory);
  await publish(where, "policy.json", encode(policy, MAX_READING_POLICY_BYTES));
  // Validate the complete private tree before any reader can select it.
  await load(where, expected);
  await writeExclusive(
    where,
    PUBLICATION,
    encode(
      {
        schema_version: "council-reading-publication/v1",
        plan_sha256: expected.expectedPlanSha256,
        policy_sha256: expected.expectedPolicySha256,
        storage
      },
      MAX_PUBLICATION_BYTES
    )
  );
  await unchanged(where);
  try {
    await link(path.join(where.directory, PUBLICATION), destination);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    // Preserve this complete losing candidate too. Never delete prior evidence.
  }
  await syncDirectory(parent);
  return verifyReadingStore({
    controlledRoot: where.controlledRoot,
    ...expected
  });
}

export async function verifyReadingStore(args) {
  const expected = expectations(args),
    where = await resolvePublication(await location(args.controlledRoot, expected), expected);
  where.identity = await directories(where.directory);
  // Creation may have claimed the directory just before publishing its subdirectory.
  for (let retry = 0; ; retry++) {
    try {
      where.acceptedIdentity = await directories(path.join(where.directory, "accepted"));
      break;
    } catch (error) {
      if (error.code !== "ENOENT" || retry >= 32) throw error;
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  }
  return handleFor(where, expected, await stableLoad(where, expected));
}
export async function publishAcceptedLeaf({ handle, nodeId, record, noteBytes }) {
  need(
    Buffer.isBuffer(noteBytes) && noteBytes.length <= MAX_READING_NOTE_BYTES,
    "Raw note must be a bounded Buffer"
  );
  const bytes = Buffer.from(noteBytes);
  const snapshot = clone(record, MAX_READING_BUNDLE_BYTES);
  const bundle = { record: snapshot, note_base64: bytes.toString("base64") };
  const encoded = encode(bundle, MAX_READING_BUNDLE_BYTES);
  const { policy, nodes, privateState } = await revalidate(handle);
  checkBundle(bundle, policy, nodes, nodeId);
  try {
    await publish(privateState.where, `accepted/${filenameFor(nodeId)}`, encoded);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
  const loaded = await revalidate(handle),
    stored = loaded.bundles.get(nodeId);
  need(stored?.digest === sha256Bytes(encoded), "A different acceptance already owns this leaf");
  return frozen(clone(stored.record, MAX_READING_BUNDLE_BYTES));
}
export async function readAcceptedLeaves({ handle }) {
  const { nodes, bundles } = await revalidate(handle);
  return [...nodes.keys()]
    .filter((id) => bundles.has(id))
    .map((id) => {
      const bundle = bundles.get(id);
      return {
        record: frozen(clone(bundle.record, MAX_READING_BUNDLE_BYTES)),
        noteBytes: Buffer.from(bundle.noteBytes)
      };
    });
}
export async function readAcceptedLeaf({ handle, nodeId }) {
  const { nodes, bundles } = await revalidate(handle);
  need(nodes.has(nodeId), "Requested node is outside the frozen leaf map");
  const bundle = bundles.get(nodeId);
  return bundle
    ? {
        record: frozen(clone(bundle.record, MAX_READING_BUNDLE_BYTES)),
        noteBytes: Buffer.from(bundle.noteBytes)
      }
    : null;
}

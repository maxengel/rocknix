#!/usr/bin/env node
/**
 * Purpose: Persist and verify immutable, scope-bound council source preparation.
 * Usage: import { materializePreparation, verifyPreparation } from this module.
 * Prepared files are not provider receipts or accepted member-reading evidence.
 * Requires a trusted filesystem namespace: path checks do not sandbox a hostile
 * same-UID process that actively swaps ancestor directories between syscalls.
 */

import { constants } from "node:fs";
import { lstat, mkdir, open, readdir, link, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  canonicalJson,
  sha256Bytes,
  validatePlan,
} from "./council-staged-sources.mjs";

// Exact UTF-8 record bytes, including the canonical final newline, on read and write.
export const MAX_RECORD_BYTES = 16 * 1024 * 1024;

const SCHEMA = "council-staged-source-preparation/v1";
const HASH = /^[a-f0-9]{64}$/;

function refuse(code, message, cause) {
  throw Object.assign(new Error(message, { cause }), { code });
}

function relativeName(value) {
  if (
    typeof value !== "string" ||
    !value ||
    value.includes("\\") ||
    value.includes("\0") ||
    value.includes(":") ||
    value.startsWith("/") ||
    value.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    refuse("unsafe_path", "Expected an exact relative path without aliases");
  }
  return value;
}

function sameIdentity(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}

async function directoryChain(absolute, create = false) {
  const base = path.parse(absolute).root;
  let current = base;
  for (const segment of absolute
    .slice(base.length)
    .split(path.sep)
    .filter(Boolean)) {
    current = path.join(current, segment);
    if (create) {
      try {
        await mkdir(current, { mode: 0o700 });
        await syncDirectory(path.dirname(current));
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
      }
    }
    const stat = await lstat(current);
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      refuse("unsafe_path", "Preparation ancestors must be real directories");
    }
  }
  return lstat(absolute);
}

async function location(controlledRoot, logicalRoot) {
  relativeName(logicalRoot);
  if (
    [".council-attempts", ".council-controllers", ".council-readings"].includes(
      logicalRoot.split("/")[0],
    )
  )
    refuse(
      "unsafe_path",
      "Preparation overlaps reserved execution or reading storage",
    );
  if (
    typeof controlledRoot !== "string" ||
    !path.isAbsolute(controlledRoot) ||
    path.resolve(controlledRoot) !== controlledRoot
  ) {
    refuse("unsafe_path", "controlledRoot must be an exact absolute directory");
  }
  const rootIdentity = await directoryChain(controlledRoot);
  const directory = path.join(controlledRoot, logicalRoot);
  return {
    controlledRoot,
    logicalRoot,
    directory,
    rootIdentity,
    planPath: `${logicalRoot}/plan.json`,
    markerPath: `${logicalRoot}/preparation.json`,
  };
}

async function unchangedRoot(where) {
  const observed = await directoryChain(where.controlledRoot);
  if (!sameIdentity(where.rootIdentity, observed)) {
    refuse("unsafe_path", "The controlled root changed during preparation");
  }
}

function checkPlanPaths(plan, where) {
  if (plan.logical_root !== where.logicalRoot || !Array.isArray(plan.files)) {
    refuse("preparation_conflict", "The plan has a different logical root");
  }
  const seen = new Set([where.planPath, where.markerPath]);
  for (const file of plan.files) {
    relativeName(file.path);
    if (!file.path.startsWith(`${where.logicalRoot}/`) || seen.has(file.path)) {
      refuse(
        "unsafe_path",
        "Preparation files must have unique, unreserved paths",
      );
    }
    seen.add(file.path);
  }
  for (const filename of seen) {
    const parts = filename.split("/");
    for (let index = 1; index < parts.length; index += 1) {
      if (seen.has(parts.slice(0, index).join("/"))) {
        refuse(
          "unsafe_path",
          "A preparation file aliases another file's parent",
        );
      }
    }
  }
}

function serialized(value) {
  const text = `${canonicalJson(value)}\n`;
  if (Buffer.byteLength(text, "utf8") > MAX_RECORD_BYTES) {
    refuse(
      "preparation_conflict",
      "Preparation record exceeds MAX_RECORD_BYTES",
    );
  }
  return Buffer.from(text, "utf8");
}

function preparationRecord(plan) {
  const body = {
    schema_version: SCHEMA,
    logical_root: plan.logical_root,
    scope: plan.scope,
    plan_sha256: plan.plan_sha256,
    files: plan.files,
    state: "prepared",
  };
  return { ...body, marker_sha256: sha256Bytes(canonicalJson(body)) };
}

async function readExact(where, relative, inodes = new Set(), expectedLength) {
  relativeName(relative);
  const absolute = path.join(where.controlledRoot, relative);
  await directoryChain(path.dirname(absolute));
  let handle;
  try {
    const initialEntry = await lstat(absolute);
    if (!initialEntry.isFile() || initialEntry.nlink !== 1) {
      refuse(
        "unsafe_path",
        "Preparation artifacts must be unaliased regular files",
      );
    }
    handle = await open(
      absolute,
      constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
    );
    const before = await handle.stat();
    const entry = await lstat(absolute);
    if (
      !before.isFile() ||
      before.nlink !== 1 ||
      entry.isSymbolicLink() ||
      !sameIdentity(before, initialEntry) ||
      !sameIdentity(before, entry)
    ) {
      refuse(
        "unsafe_path",
        "Preparation artifacts must be unaliased regular files",
      );
    }
    const inode = `${before.dev}:${before.ino}`;
    if (inodes.has(inode))
      refuse("unsafe_path", "Preparation file identity is repeated");
    inodes.add(inode);
    if (expectedLength !== undefined && before.size !== expectedLength) {
      refuse(
        "preparation_conflict",
        "Materialized file length differs from its plan",
      );
    }
    if (expectedLength === undefined && before.size > MAX_RECORD_BYTES) {
      refuse(
        "preparation_conflict",
        "Preparation record exceeds MAX_RECORD_BYTES",
      );
    }
    // Positional reads stop at the observed length even if another process grows the file.
    const bytes = Buffer.alloc(before.size);
    let offset = 0;
    while (offset < bytes.length) {
      const { bytesRead } = await handle.read(
        bytes,
        offset,
        bytes.length - offset,
        offset,
      );
      if (bytesRead === 0)
        refuse(
          "preparation_conflict",
          "Preparation artifact shortened during reading",
        );
      offset += bytesRead;
    }
    const after = await handle.stat();
    const finalEntry = await lstat(absolute);
    if (
      !sameIdentity(before, after) ||
      !sameIdentity(before, finalEntry) ||
      after.nlink !== 1 ||
      before.size !== after.size ||
      before.mtimeMs !== after.mtimeMs ||
      before.ctimeMs !== after.ctimeMs ||
      bytes.length !== after.size
    ) {
      refuse(
        "preparation_conflict",
        "A preparation artifact changed during verification",
      );
    }
    await directoryChain(path.dirname(absolute));
    await unchangedRoot(where);
    return bytes;
  } catch (error) {
    if (error.code === "ELOOP")
      refuse("unsafe_path", "Symlink preparation artifact", error);
    throw error;
  } finally {
    await handle?.close();
  }
}

function parseRecord(bytes) {
  try {
    const value = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    );
    if (!serialized(value).equals(bytes)) {
      refuse(
        "preparation_conflict",
        "Preparation JSON bytes are not canonical",
      );
    }
    return value;
  } catch (error) {
    refuse(
      "preparation_conflict",
      "Invalid or noncanonical preparation JSON",
      error,
    );
  }
}

async function verifyTree(where, expectedFiles) {
  const expectedDirectories = new Set([where.logicalRoot]);
  for (const filename of expectedFiles) {
    let parent = path.posix.dirname(filename);
    while (parent.startsWith(`${where.logicalRoot}/`)) {
      expectedDirectories.add(parent);
      parent = path.posix.dirname(parent);
    }
  }
  async function visit(relative) {
    const absolute = path.join(where.controlledRoot, relative);
    const stat = await lstat(absolute);
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      refuse("unsafe_path", "Preparation tree contains a directory alias");
    }
    for (const name of await readdir(absolute)) {
      const child = `${relative}/${name}`;
      const childStat = await lstat(path.join(where.controlledRoot, child));
      if (
        childStat.isSymbolicLink() ||
        (!childStat.isFile() && !childStat.isDirectory())
      ) {
        refuse("unsafe_path", "Preparation tree contains an unsafe artifact");
      }
      if (childStat.isDirectory()) {
        if (!expectedDirectories.has(child)) {
          refuse(
            "preparation_conflict",
            "Preparation tree contains an unplanned directory",
          );
        }
        await visit(child);
      } else if (!expectedFiles.has(child) || childStat.nlink !== 1) {
        refuse(
          "preparation_conflict",
          "Preparation tree contains an unplanned or aliased file",
        );
      }
    }
  }
  await visit(where.logicalRoot);
}

async function readPlanFiles(where, plan, inodes = new Set()) {
  const files = [];
  for (const ref of plan.files) {
    const bytes = await readExact(where, ref.path, inodes, ref.byte_length);
    if (bytes.length !== ref.byte_length || sha256Bytes(bytes) !== ref.sha256) {
      refuse(
        "preparation_conflict",
        "A materialized preparation file has drifted",
      );
    }
    files.push({ ...ref, bytes });
  }
  validatePlan({ plan, files });
  return files;
}

/** Verify persisted bytes, complete source reconstruction and the exact expected scope. */
export async function verifyPreparation({ ...args }) {
  return (await readVerifiedPreparation(args)).marker;
}

/** Return detached bytes reconstructed solely from the verified preparation. */
export async function readVerifiedPreparation({
  controlledRoot,
  logicalRoot,
  expectedScope,
  expectedPlanSha256,
}) {
  if (!HASH.test(expectedPlanSha256 ?? "") || !expectedScope) {
    refuse(
      "preparation_conflict",
      "Verification requires an expected scope and plan digest",
    );
  }
  const expectedScopeJson = canonicalJson(expectedScope);
  const where = await location(controlledRoot, logicalRoot);
  const inodes = new Set();
  try {
    const marker = parseRecord(
      await readExact(where, where.markerPath, inodes),
    );
    const plan = parseRecord(await readExact(where, where.planPath, inodes));
    checkPlanPaths(plan, where);
    if (
      plan.plan_sha256 !== expectedPlanSha256 ||
      canonicalJson(plan.scope) !== expectedScopeJson
    ) {
      refuse(
        "preparation_conflict",
        "Expected plan or scope does not match preparation",
      );
    }
    validatePlan({ plan });
    if (canonicalJson(marker) !== canonicalJson(preparationRecord(plan))) {
      refuse(
        "preparation_conflict",
        "Preparation marker does not bind this complete plan",
      );
    }
    const files = await readPlanFiles(where, plan, inodes);
    await verifyTree(
      where,
      new Set([
        ...plan.files.map((file) => file.path),
        where.planPath,
        where.markerPath,
      ]),
    );
    await unchangedRoot(where);
    const byPath = new Map(files.map((file) => [file.path, file.bytes]));
    const slices = new Map(plan.sources.map((source) => [source.id, []]));
    for (const chunk of plan.chunks) {
      const refs = chunk.source_manifest.sources.slice(-chunk.ranges.length);
      chunk.ranges.forEach((range, index) => {
        slices.get(range.source_id).push(byPath.get(refs[index].path));
      });
    }
    const sources = plan.sources.map((source) => ({
      id: source.id,
      sha256: source.sha256,
      bytes: Buffer.concat(slices.get(source.id)),
    }));
    return { marker, plan, files, sources };
  } catch (error) {
    if (error.code === "ENOENT") {
      refuse(
        "incomplete_preparation",
        "A required preparation artifact is absent",
        error,
      );
    }
    throw error;
  }
}

async function syncDirectory(absolute) {
  const handle = await open(
    absolute,
    constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW,
  );
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function writeExclusive(where, relative, bytes) {
  const absolute = path.join(where.controlledRoot, relative);
  await directoryChain(path.dirname(absolute), true);
  const handle = await open(
    absolute,
    constants.O_WRONLY |
      constants.O_CREAT |
      constants.O_EXCL |
      constants.O_NOFOLLOW,
    0o600,
  );
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await syncDirectory(path.dirname(absolute));
}

/** Publish once. Existing complete identical preparation resumes; incomplete trees remain intact. */
export async function materializePreparation({
  controlledRoot,
  logicalRoot,
  plan,
  files,
}) {
  const outgoingPlanBytes = serialized(plan);
  plan = JSON.parse(outgoingPlanBytes.toString("utf8"));
  if (
    !Array.isArray(files) ||
    !files.every((file) => Buffer.isBuffer(file.bytes))
  ) {
    refuse("invalid_source", "Materialized preparation bytes must be Buffers");
  }
  files = files.map((file) => ({ ...file, bytes: Buffer.from(file.bytes) }));
  const where = await location(controlledRoot, logicalRoot);
  checkPlanPaths(plan, where);
  validatePlan({ plan, files });
  const record = preparationRecord(plan);
  const outgoingMarkerBytes = serialized(record);
  await directoryChain(path.dirname(where.directory), true);
  try {
    await mkdir(where.directory, { mode: 0o700 });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    return verifyPreparation({
      controlledRoot,
      logicalRoot,
      expectedScope: plan.scope,
      expectedPlanSha256: plan.plan_sha256,
    });
  }
  // Only the exclusive directory creator writes. Failed preparations are never repaired in place.
  const byPath = new Map(files.map((file) => [file.path, file]));
  for (const ref of plan.files) {
    await writeExclusive(where, ref.path, byPath.get(ref.path).bytes);
  }
  await writeExclusive(where, where.planPath, outgoingPlanBytes);
  await readPlanFiles(where, plan);
  const planBytes = await readExact(where, where.planPath);
  if (!planBytes.equals(outgoingPlanBytes))
    refuse("preparation_conflict", "Stored plan drifted before publication");
  await verifyTree(
    where,
    new Set([...plan.files.map((file) => file.path), where.planPath]),
  );
  await unchangedRoot(where);
  const temporary = `${where.logicalRoot}/.preparation-${randomUUID()}.tmp`;
  await writeExclusive(where, temporary, outgoingMarkerBytes);
  // link is an atomic create-if-absent operation; it never replaces another marker.
  await link(
    path.join(controlledRoot, temporary),
    path.join(controlledRoot, where.markerPath),
  );
  await unlink(path.join(controlledRoot, temporary));
  await syncDirectory(where.directory);
  await syncDirectory(path.dirname(where.directory));
  return verifyPreparation({
    controlledRoot,
    logicalRoot,
    expectedScope: plan.scope,
    expectedPlanSha256: plan.plan_sha256,
  });
}

#!/usr/bin/env node
/**
 * Purpose: Publish bounded immutable derived packages, never dispatch authority.
 * Usage: createDerivedReadingStore / publishDerivedRequestPackage / readDerivedRequestPackages.
 * Filesystem guards follow council-staged-reading-store. The namespace is trusted:
 * no same-UID sandbox, and fresh handles need independently retained checkpoints.
 */
import { constants } from "node:fs";
import { link, lstat, mkdir, open, opendir, unlink } from "node:fs/promises";
import path from "node:path";
import { canonicalJson, sha256Bytes } from "./council-staged-sources.mjs";
import { readVerifiedPreparation } from "./council-staged-store.mjs";
import {
  verifyController,
  readController,
} from "./council-staged-controller-store.mjs";
import {
  DERIVED_CAPS,
  derivedNeed as need,
  encodeDerived,
  cloneDerived,
  freezeDerived,
  parseDerived,
  validateDerivedPolicy,
  validateDerivedPackage,
  validateReadingCandidate,
  derivedPackageRoot,
} from "./council-staged-derived-contract.mjs";

const handles = new WeakMap(),
  clockReads = new WeakMap(),
  HASH = /^[a-f0-9]{64}$/;
const PUBLICATION = "acceptance-candidates/.publication.pending";
const PUBLICATION_BYTES = Buffer.from("council-reading-publication/v1\n");
const same = (a, b) => canonicalJson(a) === canonicalJson(b);
function expectations(args) {
  const expected = cloneDerived(
    {
      expectedPlanSha256: args.expectedPlanSha256,
      expectedPolicySha256: args.expectedPolicySha256,
      expectedControllerPolicySha256: args.expectedControllerPolicySha256,
      expectedScope: args.expectedScope,
      ...(args.expectedHead === undefined
        ? {}
        : { expectedHead: args.expectedHead }),
    },
    DERIVED_CAPS.policy,
  );
  need(
    [
      expected.expectedPlanSha256,
      expected.expectedPolicySha256,
      expected.expectedControllerPolicySha256,
    ].every((v) => typeof v === "string" && HASH.test(v)),
    "Independent plan, reading policy and controller digests are required",
  );
  return freezeDerived(expected);
}
function sameInode(a, b) {
  return a.dev === b.dev && a.ino === b.ino;
}
async function directories(absolute) {
  let current = path.parse(absolute).root;
  for (const piece of absolute
    .slice(current.length)
    .split(path.sep)
    .filter(Boolean)) {
    current = path.join(current, piece);
    const entry = await lstat(current);
    need(
      entry.isDirectory() && !entry.isSymbolicLink(),
      "Derived ancestors must be real directories",
      "unsafe_path",
    );
  }
  return lstat(absolute);
}
async function syncDirectory(directory) {
  const fd = await open(
    directory,
    constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW,
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
    "unsafe_path",
  );
  const logicalRoot = `.council-readings/${expected.expectedPlanSha256}`;
  return {
    controlledRoot,
    logicalRoot,
    directory: path.join(controlledRoot, logicalRoot),
    rootIdentity: await directories(controlledRoot),
  };
}
async function unchanged(where) {
  for (const [identity, directory] of [
    [where.rootIdentity, where.controlledRoot],
    [where.identity, where.directory],
    [where.requestsIdentity, path.join(where.directory, "requests")],
    [
      where.candidatesIdentity,
      path.join(where.directory, "acceptance-candidates"),
    ],
  ])
    if (identity)
      need(
        sameInode(identity, await directories(directory)),
        "Derived directory changed",
        "unsafe_path",
      );
}
async function read(where, relative, limit) {
  const filename = path.join(where.directory, relative);
  await directories(path.dirname(filename));
  const entry = await lstat(filename);
  need(
    entry.isFile() && entry.nlink === 1,
    "Derived artifacts must be unaliased regular files",
    "unsafe_path",
  );
  const fd = await open(
    filename,
    constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
  );
  try {
    const before = await fd.stat();
    need(
      sameInode(entry, before) &&
        before.isFile() &&
        before.nlink === 1 &&
        before.size <= limit,
      "Invalid or oversized reading artifact",
      "derived_corrupt",
    );
    const bytes = Buffer.alloc(before.size);
    for (let offset = 0; offset < bytes.length; ) {
      const { bytesRead } = await fd.read(
        bytes,
        offset,
        bytes.length - offset,
        offset,
      );
      need(bytesRead > 0, "Derived artifact shortened", "derived_corrupt");
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
      "Derived artifact changed while reading",
      "derived_corrupt",
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
    constants.O_WRONLY |
      constants.O_CREAT |
      constants.O_EXCL |
      constants.O_NOFOLLOW,
    0o600,
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

async function names(directory, maximum) {
  const result = [];
  for await (const entry of await opendir(directory)) {
    need(
      result.length < maximum,
      "Too many derived artifacts",
      "derived_corrupt",
    );
    result.push(entry.name);
  }
  return result.sort();
}
// Serialize observations on one opaque controller handle, not publications. A
// default clock is sampled when the observation executes; concurrent callers
// cannot make an earlier start time look like a deliberate clock regression.
function readClocked(handle, nowMs) {
  const next = (clockReads.get(handle) ?? Promise.resolve()).then(() =>
    readController({ handle, ...(nowMs === undefined ? {} : { nowMs }) }),
  );
  clockReads.set(
    handle,
    next.then(
      () => undefined,
      () => undefined,
    ),
  );
  return next;
}
async function original(where, expected, policy, controllerHandle, nowMs) {
  need(
    policy?.plan?.sha256 === expected.expectedPlanSha256 &&
      policy.policy_sha256 === expected.expectedPolicySha256 &&
      policy.controller_policy_sha256 ===
        expected.expectedControllerPolicySha256,
    "Independent reading policy bindings differ",
  );
  const preparation = await readVerifiedPreparation({
    controlledRoot: where.controlledRoot,
    logicalRoot: policy.plan.logical_root,
    expectedPlanSha256: expected.expectedPlanSha256,
    expectedScope: expected.expectedScope,
  });
  const handle =
    controllerHandle ??
    (await verifyController({
      controlledRoot: where.controlledRoot,
      expectedPlanSha256: expected.expectedPlanSha256,
      expectedScope: expected.expectedScope,
      expectedPolicySha256: expected.expectedControllerPolicySha256,
      ...(expected.expectedHead === undefined
        ? {}
        : { expectedHead: expected.expectedHead }),
      nowMs,
    }));
  const controller = await readClocked(handle, nowMs);
  const checked = validateDerivedPolicy({
    policy,
    preparation,
    controller: controller.policy,
  });
  return { ...checked, preparation, controller, controllerHandle: handle };
}
async function inventory(where, context) {
  const { policy, preparation, controller } = context;
  const entries = await names(
    path.join(where.directory, "requests"),
    policy.limits.max_request_packages,
  );
  const packages = new Map(),
    incomplete = [];
  for (const id of entries) {
    derivedPackageRoot(policy, id);
    const relative = `requests/${id}`,
      directory = path.join(where.directory, relative);
    const identity = await directories(directory);
    const files = await names(directory, 4);
    need(
      files.every((name) =>
        [
          "packet.json",
          "assessment.json",
          "intent.json",
          ".intent.pending",
        ].includes(name),
      ),
      "Unknown package artifact",
      "derived_corrupt",
    );
    const bytes = {};
    let total = 0;
    for (const name of files) {
      bytes[name] = await read(
        where,
        `${relative}/${name}`,
        policy.limits.max_package_bytes - total,
      );
      total += bytes[name].length;
    }
    need(
      sameInode(identity, await directories(directory)),
      "Package directory changed",
      "unsafe_path",
    );
    if (!files.includes("intent.json")) {
      incomplete.push({
        attempt_id: id,
        state: "incomplete",
        files,
        byte_length: total,
      });
      continue;
    }
    need(
      same(files, ["assessment.json", "intent.json", "packet.json"]),
      "Committed package has partial or unexpected artifacts",
      "derived_corrupt",
    );
    const checked = validateDerivedPackage({
      policy,
      preparation,
      controller: controller.policy,
      packet: parseDerived(
        bytes["packet.json"],
        policy.limits.max_package_bytes,
      ),
      assessment: parseDerived(
        bytes["assessment.json"],
        policy.limits.max_package_bytes,
      ),
      intent: parseDerived(
        bytes["intent.json"],
        policy.limits.max_package_bytes,
      ),
    });
    need(
      checked.intent.attempt_id === id,
      "Package path and intent disagree",
      "derived_corrupt",
    );
    packages.set(id, { ...checked, identity });
  }
  return { packages, incomplete };
}
function reservations(context, packages) {
  for (const event of Object.values(context.controller.state.reservations)) {
    const { attempt, budget } = event.payload;
    if (!context.nodes.get(attempt.node_id)?.parent_node_ids) continue;
    const stored = packages.get(attempt.attempt_id),
      intent = stored?.intent;
    need(
      intent &&
        same(attempt, {
          attempt_id: intent.attempt_id,
          intent_sha256: intent.intent_sha256,
          request_json_sha256: intent.request_json_sha256,
          node_id: intent.node_id,
          owner_id: intent.owner_id,
          member: intent.seat.member,
          seat_id: intent.seat.seat_id,
          output_reservation: intent.seat.output_reservation,
          context_ceiling: intent.seat.context_ceiling,
        }),
      "Reserved successor has a missing, incomplete or mismatched package",
      "derived_corrupt",
    );
    const variant = stored.assessment.assessment.request_variants.find(
      (v) => v.output_reservation === attempt.output_reservation,
    );
    need(
      same(budget, {
        input_tokens_upper_bound: variant.input_tokens_upper_bound,
        extra_overhead_tokens: variant.extra_overhead_tokens,
      }),
      "Reserved package budget differs",
      "derived_corrupt",
    );
  }
}
async function load(privateState, nowMs, publication) {
  const { where, expected, remembered } = privateState;
  await unchanged(where);
  need(
    same(await names(where.directory, 3), [
      "acceptance-candidates",
      "policy.json",
      "requests",
    ]),
    "Reading v2 tree has missing or unexpected artifacts",
    "derived_corrupt",
  );
  const policy = parseDerived(
    await read(where, "policy.json", DERIVED_CAPS.policy),
    DERIVED_CAPS.policy,
  );
  const context = await original(
    where,
    expected,
    policy,
    privateState.controllerHandle,
    nowMs,
  );
  privateState.controllerHandle = context.controllerHandle;
  const result = await inventory(where, context);
  const candidates = new Map();
  let entries = await names(
    path.join(where.directory, "acceptance-candidates"),
    context.policy.limits.max_candidates * 2 + 1,
  );
  if (entries.includes(".publication.pending")) {
    need(
      publication &&
        sameInode(
          publication,
          await lstat(path.join(where.directory, PUBLICATION)),
        ) &&
        (await read(where, PUBLICATION, PUBLICATION_BYTES.length)).equals(
          PUBLICATION_BYTES,
        ),
      "Incomplete candidate capacity publication",
      "derived_corrupt",
    );
    entries = entries.filter((name) => name !== ".publication.pending");
  } else
    need(
      !publication,
      "Candidate publication marker disappeared",
      "derived_corrupt",
    );
  need(
    entries.length <= context.policy.limits.max_candidates,
    "Candidate capacity exhausted",
    "derived_corrupt",
  );
  for (const filename of entries) {
    need(
      /^[a-f0-9]{64}\.json$/.test(filename),
      "Unexpected or incomplete candidate publication",
      "derived_corrupt",
    );
    const relative = `acceptance-candidates/${filename}`;
    const bytes = await read(
      where,
      relative,
      context.policy.limits.max_candidate_bytes,
    );
    const { bundle } = validateReadingCandidate({
      bundle: parseDerived(bytes, context.policy.limits.max_candidate_bytes),
      policy: context.policy,
    });
    need(
      filename === `${bundle.bundle_sha256}.json` &&
        bytes.equals(encodeDerived(bundle)),
      "Candidate filename or canonical bytes differ",
      "derived_corrupt",
    );
    candidates.set(bundle.bundle_sha256, {
      bundle,
      identity: await lstat(path.join(where.directory, relative)),
    });
  }
  // Include reservations appended while inventory was read. Admission still needs
  // its separate exact-head CAS; this snapshot does not grant permission to call.
  context.controller = await readClocked(context.controllerHandle, nowMs);
  reservations(context, result.packages);
  for (const event of context.controller.events) {
    if (event.type !== "acceptance") continue;
    const candidate = candidates.get(event.payload.bundle_sha256)?.bundle;
    need(
      candidate &&
        candidate.record.accepted_sha256 === event.payload.accepted_sha256 &&
        candidate.prior_head.sequence === event.sequence - 1 &&
        candidate.prior_head.event_sha256 === event.previous_event_sha256,
      "Committed reading candidate missing or mismatched",
      "derived_corrupt",
    );
  }
  for (const [id, prior] of remembered) {
    const current = result.packages.get(id);
    need(
      current &&
        same(prior.hashes, current.hashes) &&
        sameInode(prior.identity, current.identity),
      "Observed complete package was removed, replaced or mutated",
      "derived_corrupt",
    );
  }
  await unchanged(where);
  for (const [id, stored] of result.packages)
    remembered.set(id, { hashes: stored.hashes, identity: stored.identity });
  privateState.rememberedCandidates ??= new Map();
  for (const [id, prior] of privateState.rememberedCandidates) {
    const current = candidates.get(id);
    need(
      current &&
        same(prior.bundle, current.bundle) &&
        sameInode(prior.identity, current.identity),
      "Observed candidate was removed, replaced or mutated",
      "derived_corrupt",
    );
  }
  for (const [id, candidate] of candidates)
    privateState.rememberedCandidates.set(id, candidate);
  return { ...context, ...result, candidates };
}
async function stableLoad(privateState, nowMs, publication) {
  for (let retry = 0; ; retry++) {
    try {
      return await load(privateState, nowMs, publication);
    } catch (error) {
      // Linking the committed marker briefly makes two aliases. Retry, but never
      // heal a crashed publisher or reinterpret malformed committed evidence.
      if (
        !["derived_corrupt", "unsafe_path", "ENOENT"].includes(error.code) ||
        retry >= 32
      )
        throw error;
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  }
}
function privateFor(handle) {
  const state = handles.get(handle);
  need(
    state,
    "An authentic derived-store handle is required",
    "invalid_derived_handle",
  );
  return state;
}
function handleFor(state, loaded) {
  const handle = Object.freeze({
    controlledRoot: state.where.controlledRoot,
    logicalRoot: state.where.logicalRoot,
    policy: loaded.policy,
  });
  handles.set(handle, state);
  return handle;
}
async function identify(where) {
  where.identity = await directories(where.directory);
  where.requestsIdentity = await directories(
    path.join(where.directory, "requests"),
  );
  where.candidatesIdentity = await directories(
    path.join(where.directory, "acceptance-candidates"),
  );
}
export async function createDerivedReadingStore(args) {
  const expected = expectations(args),
    policy = cloneDerived(args.policy, DERIVED_CAPS.policy),
    controlledRoot = args.controlledRoot,
    nowMs = args.nowMs;
  const where = await location(controlledRoot, expected);
  const context = await original(where, expected, policy, null, nowMs);
  const parent = path.dirname(where.directory);
  try {
    await mkdir(parent, { mode: 0o700 });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
  await directories(parent);
  await syncDirectory(where.controlledRoot);
  try {
    await mkdir(where.directory, { mode: 0o700 });
  } catch (error) {
    if (error.code === "EEXIST")
      return verifyDerivedReadingStore({ controlledRoot, ...expected, nowMs });
    throw error;
  }
  where.identity = await directories(where.directory);
  await syncDirectory(parent);
  for (const name of ["requests", "acceptance-candidates"])
    await mkdir(path.join(where.directory, name), { mode: 0o700 });
  await identify(where);
  await syncDirectory(where.directory);
  await writeExclusive(
    where,
    "policy.json",
    encodeDerived(policy, DERIVED_CAPS.policy),
  );
  const state = {
    where,
    expected,
    remembered: new Map(),
    controllerHandle: context.controllerHandle,
  };
  return handleFor(state, await stableLoad(state, nowMs));
}
export async function verifyDerivedReadingStore(args) {
  const expected = expectations(args),
    where = await location(args.controlledRoot, expected),
    nowMs = args.nowMs;
  await identify(where);
  const state = {
    where,
    expected,
    remembered: new Map(),
    controllerHandle: null,
  };
  return handleFor(state, await stableLoad(state, nowMs));
}
function publicPackage(stored) {
  return freezeDerived({
    packet: cloneDerived(stored.packet),
    assessment: cloneDerived(stored.assessment),
    intent: cloneDerived(stored.intent),
    hashes: { ...stored.hashes },
  });
}
export async function readDerivedRequestPackages({ handle, nowMs }) {
  const loaded = await stableLoad(privateFor(handle), nowMs);
  return freezeDerived({
    packages: [...loaded.packages.values()].map(publicPackage),
    incomplete: loaded.incomplete,
    candidates: [...loaded.candidates.values()].map((c) =>
      cloneDerived(c.bundle),
    ),
  });
}

/** Publish inert bytes; only the original journal can commit semantic acceptance. */
export async function publishReadingCandidate({
  handle,
  bundle: supplied,
  nowMs,
}) {
  const state = privateFor(handle),
    bundle = cloneDerived(supplied, DERIVED_CAPS.candidate);
  const loaded = await stableLoad(state, nowMs);
  const checked = validateReadingCandidate({ bundle, policy: loaded.policy });
  const id = checked.bundle.bundle_sha256,
    where = state.where;
  const prior = loaded.candidates.get(id);
  if (prior) return freezeDerived(cloneDerived(prior.bundle));
  // Claim a fixed-size namespace marker before trusting the capacity count.
  // A crashed marker is retained; only this invocation can identify and remove its own file.
  try {
    await writeExclusive(where, PUBLICATION, PUBLICATION_BYTES);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const raced = (await stableLoad(state, nowMs)).candidates.get(id);
    need(
      raced,
      "Candidate publisher contended; reverify before retry",
      "derived_busy",
    );
    return freezeDerived(cloneDerived(raced.bundle));
  }
  const publication = await lstat(path.join(where.directory, PUBLICATION));
  try {
    const current = await stableLoad(state, nowMs, publication);
    const existing = current.candidates.get(id);
    if (existing) return freezeDerived(cloneDerived(existing.bundle));
    return await publishCandidateLocked(
      state,
      current,
      checked,
      nowMs,
      publication,
    );
  } finally {
    const current = await lstat(path.join(where.directory, PUBLICATION));
    need(
      sameInode(publication, current) && current.nlink === 1,
      "Candidate publication marker changed",
      "unsafe_path",
    );
    await unlink(path.join(where.directory, PUBLICATION));
    await syncDirectory(path.join(where.directory, "acceptance-candidates"));
  }
}
async function publishCandidateLocked(
  state,
  loaded,
  checked,
  nowMs,
  publication,
) {
  const where = state.where,
    id = checked.bundle.bundle_sha256;
  need(
    loaded.candidates.size < loaded.policy.limits.max_candidates,
    "Candidate capacity exhausted",
    "derived_limit_exceeded",
  );
  const temporary = `acceptance-candidates/.${id}.pending`;
  const final = `acceptance-candidates/${id}.json`;
  try {
    await writeExclusive(where, temporary, checked.bytes);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const existing = (
      await stableLoad(state, nowMs, publication)
    ).candidates.get(id);
    need(
      existing,
      "Incomplete candidate cannot be repaired",
      "derived_corrupt",
    );
    return freezeDerived(cloneDerived(existing.bundle));
  }
  try {
    await link(
      path.join(where.directory, temporary),
      path.join(where.directory, final),
    );
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    // Only our own exclusively created temporary is eligible for cleanup.
    const bytes = await read(
      where,
      final,
      loaded.policy.limits.max_candidate_bytes,
    );
    need(
      bytes.equals(checked.bytes),
      "Candidate publication conflict",
      "derived_corrupt",
    );
  }
  await unlink(path.join(where.directory, temporary));
  await syncDirectory(path.join(where.directory, "acceptance-candidates"));
  const complete = (await stableLoad(state, nowMs, publication)).candidates.get(
    id,
  );
  need(
    complete && same(complete.bundle, checked.bundle),
    "Published candidate differs",
    "derived_corrupt",
  );
  return freezeDerived(cloneDerived(complete.bundle));
}
export async function readDerivedRequestPackage({ handle, attemptId, nowMs }) {
  const loaded = await stableLoad(privateFor(handle), nowMs);
  derivedPackageRoot(loaded.policy, attemptId);
  const stored = loaded.packages.get(attemptId);
  return stored ? publicPackage(stored) : null;
}
export async function publishDerivedRequestPackage({
  handle,
  packet,
  assessment,
  intent,
  nowMs,
}) {
  // Freeze all caller data before the first await. No callback, count or provider
  // work occurs between claiming this finite directory and publishing the marker.
  const state = privateFor(handle),
    supplied = {
      packet: cloneDerived(packet),
      assessment: cloneDerived(assessment),
      intent: cloneDerived(intent),
    };
  const loaded = await stableLoad(state, nowMs);
  const checked = validateDerivedPackage({
    ...supplied,
    policy: loaded.policy,
    preparation: loaded.preparation,
    controller: loaded.controller.policy,
  });
  const id = checked.intent.attempt_id,
    relative = `requests/${id}`,
    where = state.where;
  const existing = loaded.packages.get(id);
  if (existing) {
    need(
      same(existing.hashes, checked.hashes),
      "Derived slot already contains different bytes",
    );
    return publicPackage(existing);
  }
  await unchanged(where);
  try {
    await mkdir(path.join(where.directory, relative), { mode: 0o700 });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const raced = (await stableLoad(state, nowMs)).packages.get(id);
    need(
      raced && same(raced.hashes, checked.hashes),
      "Existing incomplete or conflicting package cannot be repaired",
      "derived_slot_occupied",
    );
    return publicPackage(raced);
  }
  await syncDirectory(path.join(where.directory, "requests"));
  const identity = await directories(path.join(where.directory, relative));
  for (const key of ["packet", "assessment"])
    await writeExclusive(where, `${relative}/${key}.json`, checked.bytes[key]);
  await writeExclusive(
    where,
    `${relative}/.intent.pending`,
    checked.bytes.intent,
  );
  need(
    sameInode(
      identity,
      await directories(path.join(where.directory, relative)),
    ),
    "Package directory changed",
    "unsafe_path",
  );
  await link(
    path.join(where.directory, relative, ".intent.pending"),
    path.join(where.directory, relative, "intent.json"),
  );
  await unlink(path.join(where.directory, relative, ".intent.pending"));
  await syncDirectory(path.join(where.directory, relative));
  const complete = (await stableLoad(state, nowMs)).packages.get(id);
  need(
    complete &&
      same(complete.hashes, checked.hashes) &&
      sameInode(complete.identity, identity),
    "Published package differs",
    "derived_corrupt",
  );
  return publicPackage(complete);
}

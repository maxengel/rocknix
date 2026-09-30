#!/usr/bin/env node
// Purpose: Freeze UTF-8 sources and prepare complete, budget-verified slice plans.
// Usage: import { freezeSources, planInitialReads, validatePlan } from this module.
// No provider calls, credential reads, accepted-reading receipts or phase changes.
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { lstat, open, realpath } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";
import { TextDecoder } from "node:util";

const HASH = /^[a-f0-9]{64}$/;
const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
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

function fail(code, message) {
  const error = new Error(`${code}: ${message}`);
  error.code = code;
  throw error;
}
function need(condition, code, message) {
  if (!condition) fail(code, message);
}
function integer(value, minimum = 0) {
  return Number.isSafeInteger(value) && value >= minimum;
}
function label(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 1024 &&
    !/[\x00-\x1f\x7f]/u.test(value)
  );
}
function record(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}
function same(a, b) {
  return canonicalJson(a) === canonicalJson(b);
}
function jsonClone(value) {
  return JSON.parse(canonicalJson(value));
}
function ref(file) {
  return {
    path: file.path,
    sha256: file.sha256,
    byte_length: file.byte_length,
  };
}
function sourceRef(source) {
  return { id: source.id, ...ref(source) };
}
function utf8(bytes) {
  need(
    Buffer.isBuffer(bytes),
    "invalid_source",
    "source bytes must be a Buffer",
  );
  try {
    decoder.decode(bytes);
  } catch {
    fail("invalid_utf8", "source is not exact UTF-8");
  }
}
function safePath(path) {
  need(
    label(path) &&
      !isAbsolute(path) &&
      !path.includes("\\") &&
      path
        .split("/")
        .every((part) => part !== "" && part !== "." && part !== ".."),
    "unsafe_path",
    "expected an unambiguous relative path",
  );
  return path;
}
function within(root, path) {
  return path.startsWith(`${root}/`);
}
function boundary(bytes, offset) {
  return (
    offset === 0 || offset === bytes.length || (bytes[offset] & 0xc0) !== 0x80
  );
}

export function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

/** Local deterministic record encoding, not a provider request serialization. */
export function canonicalJson(value) {
  const seen = new Set();
  function encode(item, depth) {
    need(
      depth <= 64,
      "invalid_source",
      "JSON nesting exceeds the record bound",
    );
    if (item === null || typeof item === "string" || typeof item === "boolean")
      return JSON.stringify(item);
    if (typeof item === "number") {
      need(Number.isFinite(item), "invalid_source", "nonfinite JSON number");
      return JSON.stringify(item);
    }
    need(
      (Array.isArray(item) || record(item)) && !seen.has(item),
      "invalid_source",
      "unsupported or cyclic JSON record",
    );
    need(
      Object.getOwnPropertySymbols(item).length === 0,
      "invalid_source",
      "symbol JSON property",
    );
    seen.add(item);
    let result;
    if (Array.isArray(item)) {
      need(
        Object.keys(item).length === item.length,
        "invalid_source",
        "sparse or decorated JSON array",
      );
      result = `[${item.map((child) => encode(child, depth + 1)).join(",")}]`;
    } else {
      const keys = Object.keys(item).sort();
      need(
        keys.every(
          (key) =>
            Object.getOwnPropertyDescriptor(item, key)?.get === undefined,
        ),
        "invalid_source",
        "accessor JSON property",
      );
      result = `{${keys.map((key) => `${JSON.stringify(key)}:${encode(item[key], depth + 1)}`).join(",")}}`;
    }
    seen.delete(item);
    return result;
  }
  return encode(value, 0);
}

function checkScope(scope) {
  need(
    record(scope) &&
      scopeKeys.every((key) => Object.hasOwn(scope, key)) &&
      Object.keys(scope).every((key) => scopeKeys.includes(key)),
    "invalid_scope",
    "scope bindings must be explicit and complete",
  );
  for (const key of [
    "run_id",
    "phase",
    "step",
    "cohort_id",
    "method_version",
  ]) {
    need(label(scope[key]), "invalid_scope", `invalid ${key}`);
  }
  need(
    scope.research_run_id === null || label(scope.research_run_id),
    "invalid_scope",
    "invalid research_run_id",
  );
  need(integer(scope.round), "invalid_scope", "invalid round");
  for (const key of [
    "required_input_set_sha256",
    "question_set_sha256",
    "seat_configuration_sha256",
  ]) {
    need(HASH.test(scope[key]), "invalid_scope", `invalid ${key}`);
  }
  need(
    scope.anonymous_view_sha256 === null ||
      HASH.test(scope.anonymous_view_sha256),
    "invalid_scope",
    "invalid anonymous view",
  );
}

function checkLimits(limits) {
  need(record(limits), "invalid_source", "missing planning limits");
  for (const key of [
    "max_source_bytes",
    "max_total_bytes",
    "max_chunks",
    "max_assessments",
    "max_sources",
  ]) {
    need(integer(limits[key], 1), "invalid_source", `invalid ${key}`);
  }
  if (limits.max_assessed_bytes !== undefined)
    need(
      integer(limits.max_assessed_bytes, 1),
      "invalid_source",
      "invalid max_assessed_bytes",
    );
  // Every scan is bounded by input bytes, each assessment by both limits below.
  need(
    limits.max_source_bytes <= limits.max_total_bytes,
    "invalid_source",
    "source limit exceeds total limit",
  );
  need(
    Number.isSafeInteger(limits.max_total_bytes * 32),
    "invalid_source",
    "byte-work bound exceeds safe integer range",
  );
}

function checkSourceRefs(sources, limits) {
  need(
    Array.isArray(sources) &&
      sources.length > 0 &&
      sources.length <= limits.max_sources,
    "invalid_source",
    "source count outside bound",
  );
  const ids = new Set(),
    paths = new Set();
  let total = 0;
  for (const source of sources) {
    need(
      record(source) && label(source.id) && !ids.has(source.id),
      "invalid_source",
      "missing or duplicate source ID",
    );
    safePath(source.path);
    need(
      !paths.has(source.path),
      "unsafe_path",
      "duplicate original source path",
    );
    need(
      HASH.test(source.sha256) &&
        integer(source.byte_length) &&
        source.byte_length <= limits.max_source_bytes,
      "invalid_source",
      "invalid source hash or length",
    );
    ids.add(source.id);
    paths.add(source.path);
    total += source.byte_length;
    need(
      Number.isSafeInteger(total) && total <= limits.max_total_bytes,
      "invalid_source",
      "total source bytes exceed limit",
    );
  }
}

function checkedSourceBytes(sources, limits) {
  checkSourceRefs(sources, limits);
  return sources.map((source) => {
    utf8(source.bytes);
    need(
      source.bytes.length === source.byte_length &&
        sha256Bytes(source.bytes) === source.sha256,
      "source_drift",
      "frozen source bytes disagree with their witness",
    );
    return { ...sourceRef(source), bytes: Buffer.from(source.bytes) };
  });
}

/** Reject symlink components and source hardlink aliases before bounded reads. */
export async function freezeSources({ sourceRoot, inputs, limits }) {
  checkLimits(limits);
  checkSourceRefs(inputs, limits);
  const root = resolve(sourceRoot),
    physicalRoot = await realpath(root);
  need(
    root === physicalRoot,
    "unsafe_path",
    "source root must be its physical path",
  );
  const identities = new Set(),
    frozen = [];
  for (const input of inputs) {
    let path = root,
      finalEntry;
    for (const component of input.path.split("/")) {
      path = join(path, component);
      const entry = await lstat(path);
      need(!entry.isSymbolicLink(), "unsafe_path", "symlink in source path");
      finalEntry = entry;
    }
    need(
      finalEntry.isFile() && finalEntry.nlink === 1,
      "unsafe_path",
      "source must be a regular file without hardlink aliases",
    );
    const handle = await open(
      path,
      constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
    );
    try {
      const before = await handle.stat();
      need(
        before.isFile() &&
          before.nlink === 1 &&
          before.dev === finalEntry.dev &&
          before.ino === finalEntry.ino,
        "unsafe_path",
        "source type or identity changed before opening",
      );
      need(
        before.size === input.byte_length,
        "source_drift",
        "source length changed before reading",
      );
      const physicalPath = await realpath(path);
      const localPath = relative(physicalRoot, physicalPath);
      need(
        localPath !== ".." &&
          !localPath.startsWith("../") &&
          !isAbsolute(localPath),
        "unsafe_path",
        "source escaped its root",
      );
      const identity = `${before.dev}:${before.ino}`;
      need(
        !identities.has(identity),
        "unsafe_path",
        "source paths alias the same file",
      );
      identities.add(identity);
      // Bounded positional reads avoid unbounded readFile growth during mutation.
      const bytes = Buffer.alloc(input.byte_length);
      let offset = 0;
      while (offset < bytes.length) {
        const { bytesRead } = await handle.read(
          bytes,
          offset,
          bytes.length - offset,
          offset,
        );
        need(bytesRead > 0, "source_drift", "source shortened during reading");
        offset += bytesRead;
      }
      const after = await handle.stat(),
        current = await lstat(path);
      need(
        after.size === before.size &&
          after.mtimeMs === before.mtimeMs &&
          after.ctimeMs === before.ctimeMs &&
          current.dev === before.dev &&
          current.ino === before.ino &&
          !current.isSymbolicLink(),
        "source_drift",
        "source changed during reading",
      );
      frozen.push({ ...sourceRef(input), bytes });
    } finally {
      await handle.close();
    }
  }
  return checkedSourceBytes(frozen, limits);
}

function checkSeats(seats) {
  need(
    Array.isArray(seats) && seats.length > 0 && seats.length <= 32,
    "budget_unverified",
    "missing or excessive seats",
  );
  const ids = new Set();
  for (const seat of seats) {
    need(
      record(seat) &&
        label(seat.seat_id) &&
        !ids.has(seat.seat_id) &&
        HASH.test(seat.recipe_sha256) &&
        integer(seat.context_ceiling, 1) &&
        Array.isArray(seat.output_reservations) &&
        seat.output_reservations.length > 0 &&
        seat.output_reservations.length <= 64 &&
        seat.output_reservations.every((reservation) =>
          integer(reservation, 1),
        ),
      "budget_unverified",
      "invalid frozen seat budget",
    );
    ids.add(seat.seat_id);
  }
}

function checkAssessments(assessments, seats, candidateDigest) {
  need(
    Array.isArray(assessments) && assessments.length === seats.length,
    "budget_unverified",
    "all frozen seats require assessments",
  );
  let fits = true;
  for (let index = 0; index < seats.length; index++) {
    const seat = seats[index],
      assessment = assessments[index];
    need(
      record(assessment) &&
        assessment.seat_id === seat.seat_id &&
        assessment.verified === true &&
        assessment.recipe_sha256 === seat.recipe_sha256 &&
        assessment.candidate_sha256 === candidateDigest &&
        HASH.test(assessment.facilitator_sha256) &&
        HASH.test(assessment.system_prompt_sha256) &&
        HASH.test(assessment.user_prompt_sha256),
      "budget_unverified",
      "assessment identity is missing or differs from frozen seat",
    );
    need(
      Array.isArray(assessment.request_variants) &&
        assessment.request_variants.length === seat.output_reservations.length,
      "budget_unverified",
      "every reservation needs its own exact request witness",
    );
    for (
      let attempt = 0;
      attempt < seat.output_reservations.length;
      attempt++
    ) {
      const variant = assessment.request_variants[attempt];
      need(
        record(variant) &&
          variant.output_reservation === seat.output_reservations[attempt] &&
          HASH.test(variant.request_json_sha256) &&
          integer(variant.input_tokens_upper_bound) &&
          integer(variant.extra_overhead_tokens) &&
          record(variant.counter_witness) &&
          label(variant.counter_witness.method) &&
          variant.counter_witness.request_json_sha256 ===
            variant.request_json_sha256,
        "budget_unverified",
        "request variant or matching counter witness is missing",
      );
      const total =
        variant.input_tokens_upper_bound +
        variant.extra_overhead_tokens +
        variant.output_reservation;
      need(
        Number.isSafeInteger(total),
        "budget_unverified",
        "budget sum exceeds exact integer range",
      );
      if (total > seat.context_ceiling) fits = false;
    }
  }
  return fits;
}

function checkControls(controls, logicalRoot, limits, withBytes) {
  need(
    Array.isArray(controls) && controls.length <= limits.max_sources,
    "invalid_source",
    "invalid controls",
  );
  const paths = new Set();
  let total = 0;
  return controls.map((control) => {
    safePath(control.path);
    need(
      within(logicalRoot, control.path) &&
        !paths.has(control.path) &&
        !control.path.startsWith(`${logicalRoot}/chunks/`) &&
        ![
          `${logicalRoot}/plan.json`,
          `${logicalRoot}/preparation.json`,
        ].includes(control.path),
      "unsafe_path",
      "control path collides with preparation artifacts or escapes root",
    );
    paths.add(control.path);
    const length = withBytes ? control.bytes?.length : control.byte_length;
    need(
      HASH.test(control.sha256) && integer(length),
      "invalid_source",
      "invalid control witness",
    );
    total += length;
    need(
      Number.isSafeInteger(total) && total <= limits.max_total_bytes,
      "invalid_source",
      "control bytes exceed limit",
    );
    if (withBytes) {
      utf8(control.bytes);
      need(
        sha256Bytes(control.bytes) === control.sha256,
        "source_drift",
        "control bytes changed",
      );
    }
    return {
      path: control.path,
      sha256: control.sha256,
      byte_length: length,
      ...(withBytes ? { bytes: Buffer.from(control.bytes) } : {}),
    };
  });
}

function chunkId(index) {
  return `chunk-${String(index + 1).padStart(6, "0")}`;
}
function slicePath(root, id, sourceIndex) {
  return `${root}/chunks/${id}/source-${String(sourceIndex + 1).padStart(6, "0")}.txt`;
}
function candidateFor({ id, ranges, sources, controls, logicalRoot }) {
  const byId = new Map(
    sources.map((source, index) => [source.id, { source, index }]),
  );
  const slices = ranges.map((range) => {
    const { source, index } = byId.get(range.source_id);
    const bytes = Buffer.from(source.bytes.subarray(range.start, range.end));
    return {
      path: slicePath(logicalRoot, id, index),
      sha256: sha256Bytes(bytes),
      byte_length: bytes.length,
      bytes,
    };
  });
  const files = [
    ...controls.map((control) => ({
      ...ref(control),
      bytes: Buffer.from(control.bytes),
    })),
    ...slices,
  ];
  return {
    chunk_id: id,
    ranges: jsonClone(ranges),
    source_manifest_path: `${logicalRoot}/chunks/${id}/source-manifest.json`,
    source_manifest: {
      sources: files.map(({ path, sha256 }) => ({ path, sha256 })),
    },
    files,
  };
}
function makeRange(source, start, end) {
  return {
    source_id: source.id,
    start,
    end,
    sha256: sha256Bytes(source.bytes.subarray(start, end)),
    purpose: "primary",
  };
}
export function candidateSha256(candidate) {
  return sha256Bytes(
    canonicalJson({
      chunk_id: candidate.chunk_id,
      ranges: candidate.ranges,
      source_manifest_path: candidate.source_manifest_path,
      source_manifest: candidate.source_manifest,
      files: candidate.files.map(ref),
    }),
  );
}
function manifestFile(candidate) {
  const bytes = Buffer.from(`${canonicalJson(candidate.source_manifest)}\n`);
  return {
    path: candidate.source_manifest_path,
    sha256: sha256Bytes(bytes),
    byte_length: bytes.length,
    bytes,
  };
}

/** Stateless candidate assessments; no files or provider requests are sent here. */
export async function planInitialReads({
  scope,
  sources,
  controls = [],
  logicalRoot,
  seats,
  limits,
  assessRequest,
}) {
  checkScope(scope);
  checkLimits(limits);
  safePath(logicalRoot);
  checkSeats(seats);
  need(
    typeof assessRequest === "function",
    "budget_unverified",
    "a reviewed exact-request assessor is required",
  );
  scope = jsonClone(scope);
  limits = jsonClone(limits);
  seats = jsonClone(seats);
  sources = checkedSourceBytes(sources, limits);
  controls = checkControls(controls, logicalRoot, limits, true);
  const chunks = [],
    files = new Map(controls.map((control) => [control.path, control]));
  const workLimit = limits.max_assessed_bytes ?? limits.max_total_bytes * 32;
  let assessments = 0,
    assessedBytes = 0,
    pending = [],
    accepted;
  async function assess(ranges) {
    need(
      ++assessments <= limits.max_assessments,
      "planning_limit_exhausted",
      "request assessment limit reached",
    );
    const candidate = candidateFor({
      id: chunkId(chunks.length),
      ranges,
      sources,
      controls,
      logicalRoot,
    });
    assessedBytes += candidate.files.reduce(
      (sum, file) => sum + file.byte_length,
      0,
    );
    need(
      Number.isSafeInteger(assessedBytes) && assessedBytes <= workLimit,
      "planning_limit_exhausted",
      "candidate byte-work limit reached",
    );
    const before = canonicalJson({
      ...candidate,
      files: candidate.files.map(ref),
    });
    const result = await assessRequest(candidate);
    need(
      before ===
        canonicalJson({ ...candidate, files: candidate.files.map(ref) }) &&
        candidate.files.every(
          (file) =>
            file.bytes.length === file.byte_length &&
            sha256Bytes(file.bytes) === file.sha256,
        ),
      "budget_unverified",
      "assessor mutated candidate inputs",
    );
    const snapshot = jsonClone(result);
    return {
      candidate,
      assessments: snapshot,
      fits: checkAssessments(snapshot, seats, candidateSha256(candidate)),
    };
  }
  function finish(read) {
    need(
      chunks.length < limits.max_chunks,
      "planning_limit_exhausted",
      "chunk limit reached",
    );
    const { candidate, assessments: result } = read;
    chunks.push({
      id: candidate.chunk_id,
      ranges: candidate.ranges,
      source_manifest_path: candidate.source_manifest_path,
      source_manifest: candidate.source_manifest,
      assessments: result,
    });
    for (const file of [...candidate.files, manifestFile(candidate)]) {
      const prior = files.get(file.path);
      need(
        !prior || same(ref(prior), ref(file)),
        "unsafe_path",
        "materialized artifact collision",
      );
      files.set(file.path, file);
    }
    pending = [];
    accepted = undefined;
  }
  const fixed = await assess([]);
  need(
    fixed.fits,
    "fixed_context_overflow",
    "fixed request controls do not fit every frozen reservation",
  );
  for (const source of sources) {
    let start = 0;
    do {
      const full = makeRange(source, start, source.byte_length);
      let trial = await assess([...pending, full]);
      if (trial.fits) {
        pending.push(full);
        accepted = trial;
        break;
      }
      if (pending.length) {
        finish(accepted);
        trial = await assess([full]);
        if (trial.fits) {
          pending = [full];
          accepted = trial;
          break;
        }
      }
      let selected;
      // Descending exhaustive candidates are honest even for nonmonotone counters.
      // Explicit work limits refuse long searches rather than claiming an optimum.
      for (let end = source.byte_length - 1; end > start; end--) {
        if (source.bytes[end - 1] !== 10) continue;
        const attempt = await assess([makeRange(source, start, end)]);
        if (attempt.fits) {
          selected = attempt;
          break;
        }
      }
      if (!selected) {
        for (let end = source.byte_length - 1; end > start; end--) {
          if (!boundary(source.bytes, end) || source.bytes[end - 1] === 10)
            continue;
          const attempt = await assess([makeRange(source, start, end)]);
          if (attempt.fits) {
            selected = attempt;
            break;
          }
        }
      }
      need(
        selected,
        "minimum_slice_overflow",
        "no complete UTF-8 slice fits the frozen request budget",
      );
      start = selected.candidate.ranges[0].end;
      finish(selected);
    } while (start < source.byte_length);
  }
  if (pending.length) finish(accepted);
  const plan = {
    schema_version: "council-staged-source-plan/v1",
    scope,
    logical_root: logicalRoot,
    sources: sources.map(sourceRef),
    controls: controls.map(ref),
    seats,
    limits,
    chunks,
    files: [...files.values()].map(ref),
    planned_overlaps: [],
  };
  plan.plan_sha256 = sha256Bytes(canonicalJson(plan));
  validatePlan({ plan, sources, controls, files: [...files.values()] });
  return { plan, files: [...files.values()] };
}

/** Validate persisted plans, optionally proving exact reconstruction from files. */
export function validatePlan({ plan, sources, controls, files } = {}) {
  need(
    record(plan) && plan.schema_version === "council-staged-source-plan/v1",
    "invalid_source",
    "unsupported plan",
  );
  const { plan_sha256: digest, ...body } = plan;
  need(
    HASH.test(digest) && sha256Bytes(canonicalJson(body)) === digest,
    "source_drift",
    "plan hash changed",
  );
  checkScope(plan.scope);
  checkLimits(plan.limits);
  safePath(plan.logical_root);
  checkSeats(plan.seats);
  checkSourceRefs(plan.sources, plan.limits);
  const controlRefs = checkControls(
    plan.controls,
    plan.logical_root,
    plan.limits,
    false,
  );
  need(
    Array.isArray(plan.planned_overlaps) && plan.planned_overlaps.length === 0,
    "unplanned_overlap",
    "S1 supports primary partitions only",
  );
  need(
    Array.isArray(plan.chunks) &&
      plan.chunks.length > 0 &&
      plan.chunks.length <= plan.limits.max_chunks,
    "invalid_range",
    "invalid chunk count",
  );
  need(
    Array.isArray(plan.files),
    "invalid_source",
    "missing materialized file witnesses",
  );
  const expectedFiles = new Map(
    controlRefs.map((control) => [control.path, control]),
  );
  const offsets = new Map(plan.sources.map((source) => [source.id, 0]));
  const emptySeen = new Set(),
    pieces = new Map(plan.sources.map((source) => [source.id, []]));
  let sourceIndex = 0;
  for (let index = 0; index < plan.chunks.length; index++) {
    const chunk = plan.chunks[index],
      id = chunkId(index);
    need(
      record(chunk) &&
        chunk.id === id &&
        Array.isArray(chunk.ranges) &&
        chunk.ranges.length > 0,
      "invalid_range",
      "chunk identity or ranges invalid",
    );
    need(
      chunk.source_manifest_path ===
        `${plan.logical_root}/chunks/${id}/source-manifest.json`,
      "unsafe_path",
      "manifest path differs from planned final path",
    );
    const entries = controlRefs.map(({ path, sha256 }) => ({ path, sha256 }));
    const candidateFiles = [...controlRefs];
    const inChunk = new Set();
    for (const range of chunk.ranges) {
      const source = plan.sources[sourceIndex];
      need(
        record(range) &&
          range.purpose === "primary" &&
          !Object.hasOwn(range, "reason"),
        "unplanned_overlap",
        "unauthorized range purpose or overlap",
      );
      need(
        source &&
          range.source_id === source.id &&
          !inChunk.has(range.source_id),
        "invalid_range",
        "range order or duplicate source in chunk",
      );
      need(
        integer(range.start) &&
          integer(range.end) &&
          range.start === offsets.get(source.id) &&
          range.end >= range.start &&
          range.end <= source.byte_length &&
          HASH.test(range.sha256),
        "coverage_gap",
        "range bounds do not partition the ordered source",
      );
      need(
        range.end > range.start ||
          (source.byte_length === 0 && !emptySeen.has(source.id)),
        "invalid_range",
        "empty range is not one explicit empty-source delivery",
      );
      if (source.byte_length === 0) emptySeen.add(source.id);
      const path = slicePath(plan.logical_root, id, sourceIndex);
      const file = {
        path,
        sha256: range.sha256,
        byte_length: range.end - range.start,
      };
      need(!expectedFiles.has(path), "unsafe_path", "slice artifact alias");
      expectedFiles.set(path, file);
      entries.push({ path, sha256: range.sha256 });
      candidateFiles.push(file);
      pieces.get(source.id).push({ range, path });
      inChunk.add(source.id);
      offsets.set(source.id, range.end);
      if (range.end === source.byte_length) sourceIndex++;
    }
    need(
      same(chunk.source_manifest, { sources: entries }),
      "invalid_source",
      "manifest does not name exact ordered delivered files",
    );
    const serialized = manifestFile({
      source_manifest: chunk.source_manifest,
      source_manifest_path: chunk.source_manifest_path,
    });
    expectedFiles.set(serialized.path, ref(serialized));
    const candidateDigest = candidateSha256({
      chunk_id: id,
      ranges: chunk.ranges,
      source_manifest_path: chunk.source_manifest_path,
      source_manifest: chunk.source_manifest,
      files: candidateFiles,
    });
    need(
      checkAssessments(chunk.assessments, plan.seats, candidateDigest),
      "budget_unverified",
      "persisted chunk exceeds a frozen request budget",
    );
  }
  need(
    sourceIndex === plan.sources.length,
    "coverage_gap",
    "some required source bytes were never scheduled",
  );
  need(
    same(plan.files, [...expectedFiles.values()]),
    "invalid_source",
    "materialized file list differs from exact plan closure",
  );
  const sourceBytes =
    sources === undefined
      ? undefined
      : checkedSourceBytes(sources, plan.limits);
  if (sourceBytes)
    need(
      same(sourceBytes.map(sourceRef), plan.sources),
      "source_drift",
      "source set differs from frozen plan",
    );
  if (controls !== undefined) {
    need(
      same(
        checkControls(controls, plan.logical_root, plan.limits, true).map(ref),
        plan.controls,
      ),
      "source_drift",
      "control set differs from frozen plan",
    );
  }
  let loaded;
  if (files !== undefined) {
    need(
      Array.isArray(files) && same(files.map(ref), plan.files),
      "source_drift",
      "loaded file set differs from plan",
    );
    loaded = new Map();
    for (const file of files) {
      utf8(file.bytes);
      need(
        file.bytes.length === file.byte_length &&
          sha256Bytes(file.bytes) === file.sha256,
        "source_drift",
        "loaded artifact bytes differ from plan",
      );
      loaded.set(file.path, file.bytes);
    }
  }
  for (let index = 0; index < plan.sources.length; index++) {
    const source = plan.sources[index],
      scheduled = pieces.get(source.id);
    const bytes = loaded
      ? Buffer.concat(scheduled.map((piece) => loaded.get(piece.path)))
      : sourceBytes?.[index].bytes;
    if (!bytes) continue;
    need(
      bytes.length === source.byte_length &&
        sha256Bytes(bytes) === source.sha256,
      "source_drift",
      "primary slices do not reconstruct the exact original source",
    );
    utf8(bytes);
    for (const { range } of scheduled) {
      need(
        boundary(bytes, range.start) && boundary(bytes, range.end),
        "invalid_range",
        "range cuts a UTF-8 code point",
      );
      need(
        sha256Bytes(bytes.subarray(range.start, range.end)) === range.sha256,
        "source_drift",
        "range hash does not match original bytes",
      );
    }
  }
  return true;
}

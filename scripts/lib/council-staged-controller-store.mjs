#!/usr/bin/env node
/**
 * Purpose: Preserve frozen per-plan quotas and a durable reservation journal.
 * Usage: import { createController, reserveAttempt } from this module.
 * This store has no provider, counter, billing, reading-acceptance or replay authority.
 * Callers must independently verify those inputs at the guarded dispatch boundary.
 * The filesystem namespace and host clock are trusted, as in the S1/attempt stores.
 * A retained expectedHead detects rollback across restarts; a complete filesystem
 * rollback without an independent checkpoint is outside this local journal's proof.
 * Each handle also retains its maximum successfully observed clock. Only journal
 * event timestamps persist across fresh handles or processes.
 */
import { constants } from "node:fs";
import { lstat, mkdir, open, readdir } from "node:fs/promises";
import path from "node:path";
import { canonicalJson, sha256Bytes } from "./council-staged-sources.mjs";
import { verifyPreparation } from "./council-staged-store.mjs";

export const MAX_CONTROLLER_EVENTS = 4096;
export const MAX_CONTROLLER_RECORD_BYTES = 64 * 1024;
export const MAX_CONTROLLER_POLICY_BYTES = 1024 * 1024;
const POLICY = "council-staged-controller-policy/v1";
const EVENT = "council-staged-controller-event/v1";
const POLICY_V2 = "council-staged-controller-policy/v2";
const EVENT_V2 = "council-staged-controller-event/v2";
const POLICY_V3 = "council-staged-controller-policy/v3";
const EVENT_V3 = "council-staged-controller-event/v3";
const HASH = /^[a-f0-9]{64}$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const scopes = [
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
const handles = new WeakMap();

function fail(code, message) {
  throw Object.assign(new Error(message), { code });
}
function need(condition, message, code = "controller_conflict") {
  if (!condition) fail(code, message);
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
    value.length > 0 &&
    value.length <= 256 &&
    !/[\x00-\x1f\x7f]/u.test(value)
  );
}
function evidenceText(value, limit) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= limit &&
    !/[\x00-\x1f\x7f]/u.test(value)
  );
}
function digest(value, key) {
  const { [key]: ignored, ...body } = value;
  return sha256Bytes(canonicalJson(body));
}
function same(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}
function sum(left, right) {
  const total = left + right;
  need(integer(total), "Accounting exceeds the safe integer range");
  return total;
}
function encode(value, limit = MAX_CONTROLLER_RECORD_BYTES) {
  let bytes;
  try {
    bytes = Buffer.from(`${canonicalJson(value)}\n`);
  } catch {
    fail("controller_conflict", "Controller records must be strict JSON");
  }
  need(bytes.length <= limit, "Controller record exceeds its byte bound");
  return bytes;
}
function clone(value) {
  return JSON.parse(encode(value, MAX_CONTROLLER_POLICY_BYTES).toString());
}
function freeze(value) {
  if (object(value) || Array.isArray(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
function parse(bytes, limit) {
  try {
    const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    need(encode(value, limit).equals(bytes), "Noncanonical controller record");
    return value;
  } catch {
    fail("controller_corrupt", "Partial, invalid or noncanonical controller record");
  }
}
function relative(value) {
  need(
    typeof value === "string" &&
      value &&
      !/[\\\0:]/u.test(value) &&
      !value.startsWith("/") &&
      !value.split("/").some((piece) => !piece || piece === "." || piece === ".."),
    "Unsafe relative controller path",
    "unsafe_path"
  );
}
function identity(value) {
  return (
    exact(value, ["id", "revision", "artifact_sha256"]) &&
    label(value.id) &&
    label(value.revision) &&
    HASH.test(value.artifact_sha256 ?? "")
  );
}
function derivedPolicy(policy) {
  return [POLICY_V2, POLICY_V3].includes(policy?.schema_version);
}
function compositionPolicy(policy) {
  return policy?.schema_version === POLICY_V3;
}
function compositionSlot(policy, nodeId) {
  return compositionPolicy(policy)
    ? policy.composition.find((slot) => slot.node_id === nodeId)
    : undefined;
}
function eventVersion(policy) {
  return compositionPolicy(policy) ? EVENT_V3 : derivedPolicy(policy) ? EVENT_V2 : EVENT;
}
// v3 nodes contain N reading purposes and F composition purposes. Each needs
// exactly one terminal record, in addition to three records per charged attempt.
function terminalCapacity(policy) {
  return derivedPolicy(policy) ? policy.nodes.length : 0;
}
function finalizedOwner(state, ownerId) {
  return (
    compositionPolicy(state.policy) &&
    Object.values(state.finalizations).some((event) => event.payload.owner_id === ownerId)
  );
}
function overlaps(a, b) {
  return a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`);
}
function validHead(head) {
  return (
    exact(head, ["sequence", "event_sha256"]) &&
    integer(head.sequence) &&
    head.sequence <= MAX_CONTROLLER_EVENTS &&
    (head.sequence === 0
      ? head.event_sha256 === null
      : typeof head.event_sha256 === "string" && HASH.test(head.event_sha256))
  );
}
function validatePolicy(policy) {
  need(
    exact(policy, [
      "schema_version",
      "plan",
      "scope",
      "nodes",
      "limits",
      "money",
      "clock",
      "retry",
      "policy_sha256",
      ...(derivedPolicy(policy) ? ["reading_contract_sha256"] : []),
      ...(compositionPolicy(policy) ? ["composition"] : [])
    ]) && [POLICY, POLICY_V2, POLICY_V3].includes(policy.schema_version),
    "Unsupported controller policy"
  );
  if (derivedPolicy(policy))
    need(
      typeof policy.reading_contract_sha256 === "string" &&
        HASH.test(policy.reading_contract_sha256),
      "Derived controller requires the independently bound reading contract"
    );
  need(
    exact(policy.plan, ["logical_root", "sha256"]) && HASH.test(policy.plan.sha256 ?? ""),
    "Invalid plan binding"
  );
  relative(policy.plan.logical_root);
  need(
    ![".council-attempts", ".council-controllers", ".council-readings"].includes(
      policy.plan.logical_root.split("/")[0]
    ),
    "Preparation overlaps a reserved controller or attempt tree",
    "unsafe_path"
  );
  need(exact(policy.scope, scopes), "Every preparation scope binding is required");
  need(
    HASH.test(policy.policy_sha256 ?? "") &&
      digest(policy, "policy_sha256") === policy.policy_sha256,
    "Policy digest differs from its content"
  );
  need(
    Array.isArray(policy.nodes) && policy.nodes.length > 0 && policy.nodes.length <= 256,
    "Invalid allowed-node map"
  );
  const ids = new Set();
  for (const node of policy.nodes) {
    need(
      exact(node, ["node_id", "owner_id", "member", "seat_id", "output_reservations"]) &&
        ["node_id", "owner_id", "member", "seat_id"].every((key) => label(node[key])) &&
        !ids.has(node.node_id),
      "Invalid or duplicate allowed node"
    );
    ids.add(node.node_id);
    need(
      Array.isArray(node.output_reservations) &&
        node.output_reservations.length > 0 &&
        node.output_reservations.length <= 64 &&
        node.output_reservations.every((n, i, a) => integer(n, 1) && (i === 0 || n > a[i - 1])),
      "Frozen output variants must be strictly increasing positive integers"
    );
  }
  if (compositionPolicy(policy)) {
    need(
      Array.isArray(policy.composition) &&
        policy.composition.length > 0 &&
        policy.composition.length < policy.nodes.length,
      "Invalid composition purpose map"
    );
    const owners = new Set(),
      seats = new Set(),
      purposes = new Set(),
      paths = [];
    for (const slot of policy.composition) {
      need(
        exact(slot, ["node_id", "canonical_output_path"]) && label(slot.node_id),
        "Invalid composition slot"
      );
      const node = policy.nodes.find((n) => n.node_id === slot.node_id);
      need(
        node &&
          !purposes.has(slot.node_id) &&
          !owners.has(node.owner_id) &&
          !seats.has(node.seat_id),
        "Composition purposes, owners and seats must be distinct"
      );
      relative(slot.canonical_output_path);
      need(
        label(slot.canonical_output_path) &&
          ![
            ".git",
            ".council-attempts",
            ".council-controllers",
            ".council-readings",
            policy.plan.logical_root
          ].some((root) => overlaps(root, slot.canonical_output_path)) &&
          !paths.some((prior) => overlaps(prior, slot.canonical_output_path)),
        "Composition output paths overlap reserved artifacts or another output"
      );
      purposes.add(slot.node_id);
      owners.add(node.owner_id);
      seats.add(node.seat_id);
      paths.push(slot.canonical_output_path);
    }
    for (const node of policy.nodes) {
      const slot = policy.composition.find(
        (c) => policy.nodes.find((n) => n.node_id === c.node_id).owner_id === node.owner_id
      );
      const target = policy.nodes.find((n) => n.node_id === slot?.node_id);
      need(
        target &&
          ["owner_id", "member", "seat_id"].every((k) => target[k] === node[k]) &&
          policy.nodes.some((n) => n.owner_id === node.owner_id && !purposes.has(n.node_id)),
        "Every composition owner requires matching reading nodes and exactly one seat"
      );
    }
  }
  need(
    exact(policy.limits, [
      "max_attempts_per_node",
      "max_calls_per_member",
      "max_input_tokens",
      "max_output_tokens",
      "max_spend_units",
      "max_events",
    ]) &&
      Object.values(policy.limits).every((value) => integer(value, 1)) &&
      policy.limits.max_events >= 3 &&
      policy.limits.max_events <= MAX_CONTROLLER_EVENTS,
    "Invalid finite controller limits"
  );
  if (derivedPolicy(policy))
    need(
      policy.limits.max_events >= policy.nodes.length + 3,
      "Journal must preserve terminal capacity for every declared node"
    );
  need(
    exact(policy.money, ["currency", "units_per_currency", "evaluator_identity"]) &&
      /^[A-Z]{3}$/.test(policy.money.currency ?? "") &&
      integer(policy.money.units_per_currency, 1) &&
      identity(policy.money.evaluator_identity),
    "Invalid currency or evaluator identity"
  );
  need(
    exact(policy.clock, ["started_at_ms", "deadline_ms"]) &&
      integer(policy.clock.started_at_ms) &&
      integer(policy.clock.deadline_ms, policy.clock.started_at_ms + 1),
    "Invalid absolute clock bounds"
  );
  need(
    exact(policy.retry, ["base_delay_ms", "max_delay_ms"]) &&
      integer(policy.retry.base_delay_ms) &&
      integer(policy.retry.max_delay_ms, policy.retry.base_delay_ms),
    "Invalid bounded retry timing"
  );
}
function expected(args) {
  const result = clone({
    expectedPolicySha256: args.expectedPolicySha256,
    expectedPlanSha256: args.expectedPlanSha256,
    expectedScope: args.expectedScope,
    expectedHead: args.expectedHead ?? null,
  });
  need(
    HASH.test(result.expectedPolicySha256 ?? "") &&
      HASH.test(result.expectedPlanSha256 ?? "") &&
      exact(result.expectedScope, scopes),
    "Independent policy, plan and scope bindings are required"
  );
  if (result.expectedHead !== null)
    need(
      exact(result.expectedHead, ["sequence", "event_sha256"]) &&
        integer(result.expectedHead.sequence) &&
        (result.expectedHead.sequence === 0
          ? result.expectedHead.event_sha256 === null
          : HASH.test(result.expectedHead.event_sha256 ?? "")),
      "Invalid independent journal checkpoint"
    );
  return freeze(result);
}
function checkPolicy(policy, expectations) {
  validatePolicy(policy);
  need(
    policy.policy_sha256 === expectations.expectedPolicySha256 &&
      policy.plan.sha256 === expectations.expectedPlanSha256 &&
      same(policy.scope, expectations.expectedScope),
    "Policy differs from independent expected bindings"
  );
}
function clock(state, nowMs, deadline = false) {
  need(integer(nowMs), "Observed clock must be a nonnegative safe integer");
  need(
    nowMs >= state.clock_high_water_ms,
    "Observed clock regressed",
    "controller_clock_regression"
  );
  if (deadline)
    need(
      nowMs < state.policy.clock.deadline_ms,
      "Controller absolute deadline expired",
      "controller_deadline_exceeded"
    );
}
function live(state, nowMs) {
  clock(state, nowMs, true);
  need(
    !state.stopped,
    "Provider bound violation has stopped this controller",
    "controller_stopped"
  );
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
      "Controller ancestors must be real directories",
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
async function location(controlledRoot, planSha256) {
  need(
    typeof controlledRoot === "string" &&
      path.isAbsolute(controlledRoot) &&
      path.resolve(controlledRoot) === controlledRoot,
    "Controlled root must be exact and absolute",
    "unsafe_path"
  );
  const logicalRoot = `.council-controllers/${planSha256}`;
  return {
    controlledRoot,
    logicalRoot,
    directory: path.join(controlledRoot, logicalRoot),
    rootIdentity: await directories(controlledRoot),
  };
}
async function unchanged(where) {
  need(
    sameInode(where.rootIdentity, await directories(where.controlledRoot)),
    "Controlled root changed",
    "unsafe_path"
  );
  if (where.identity)
    need(
      sameInode(where.identity, await directories(where.directory)),
      "Controller directory changed",
      "unsafe_path"
    );
  if (where.eventsIdentity)
    need(
      sameInode(where.eventsIdentity, await directories(path.join(where.directory, "events"))),
      "Journal directory changed",
      "unsafe_path"
    );
}
async function read(where, relativePath, limit) {
  const absolute = path.join(where.directory, relativePath);
  await directories(path.dirname(absolute));
  const entry = await lstat(absolute);
  need(
    entry.isFile() && entry.nlink === 1,
    "Journal artifacts must be unaliased regular files",
    "unsafe_path"
  );
  const fd = await open(absolute, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const before = await fd.stat();
    need(
      sameInode(before, entry) && before.isFile() && before.nlink === 1 && before.size <= limit,
      "Invalid or oversized journal artifact",
      "controller_corrupt"
    );
    const bytes = Buffer.alloc(before.size);
    for (let offset = 0; offset < bytes.length;) {
      const { bytesRead } = await fd.read(bytes, offset, bytes.length - offset, offset);
      need(bytesRead > 0, "Journal artifact shortened", "controller_corrupt");
      offset += bytesRead;
    }
    const after = await fd.stat(),
      final = await lstat(absolute);
    need(
      sameInode(before, after) &&
        sameInode(before, final) &&
        after.nlink === 1 &&
        final.nlink === 1 &&
        before.size === after.size &&
        before.mtimeMs === after.mtimeMs &&
        before.ctimeMs === after.ctimeMs,
      "Journal artifact changed while reading",
      "controller_corrupt"
    );
    // A concurrent CAS writer may have written complete bytes but not yet flushed.
    // The reader independently flushes before using those bytes as durable authority.
    await fd.sync();
    await syncDirectory(path.dirname(absolute));
    await unchanged(where);
    return bytes;
  } finally {
    await fd.close();
  }
}
async function writeExclusive(where, relativePath, bytes) {
  await unchanged(where);
  const filename = path.join(where.directory, relativePath);
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
const filename = (sequence) => `events/${String(sequence).padStart(8, "0")}.json`;
function initial(policy) {
  return {
    policy,
    sequence: 0,
    head_sha256: null,
    clock_high_water_ms: policy.clock.started_at_ms,
    stopped: false,
    stop_reasons: [],
    totals: {
      reserved: { calls: 0, input_tokens: 0, output_tokens: 0, spend_units: 0 },
      measured: { input_tokens: 0, output_tokens: 0, spend_units: 0 },
      unknown: { input_tokens: 0, output_tokens: 0, spend_units: 0 },
    },
    reservations: Object.create(null),
    dispatches: Object.create(null),
    reconciliations: Object.create(null),
    successors: Object.create(null),
    attempts_per_node: Object.create(null),
    calls_per_member: Object.create(null),
    latest_per_node: Object.create(null),
    ...(derivedPolicy(policy)
      ? { acceptances: Object.create(null), reading_policy_sha256: null }
      : {}),
    ...(compositionPolicy(policy) ? { finalizations: Object.create(null) } : {})
  };
}
function validBudget(budget) {
  need(
    exact(budget, ["input_tokens_upper_bound", "extra_overhead_tokens"]) &&
      Object.values(budget).every((n) => integer(n)),
    "Complete input bounds are required"
  );
}
function retryDelay(policy, count) {
  let delay = policy.retry.base_delay_ms;
  for (let i = 1; i < count && delay < policy.retry.max_delay_ms; i++)
    delay = Math.min(
      policy.retry.max_delay_ms,
      delay > Number.MAX_SAFE_INTEGER / 2 ? policy.retry.max_delay_ms : delay * 2
    );
  return delay;
}
function checkReservation(state, payload, nowMs) {
  live(state, nowMs);
  need(
    exact(payload, [
      "attempt",
      "budget",
      "spend_witness",
      "predecessor",
      ...(compositionSlot(state.policy, payload?.attempt?.node_id) ? ["composition"] : [])
    ]),
    "Invalid reservation fields"
  );
  const { attempt, budget, spend_witness: spend, predecessor } = payload;
  need(
    exact(attempt, [
      "attempt_id",
      "intent_sha256",
      "request_json_sha256",
      "node_id",
      "owner_id",
      "member",
      "seat_id",
      "output_reservation",
      "context_ceiling",
    ]) &&
      ID.test(attempt.attempt_id ?? "") &&
      HASH.test(attempt.intent_sha256 ?? "") &&
      HASH.test(attempt.request_json_sha256 ?? "") &&
      integer(attempt.output_reservation, 1) &&
      integer(attempt.context_ceiling, 1),
    "Invalid exact attempt binding"
  );
  need(!Object.hasOwn(state.reservations, attempt.attempt_id), "Attempt ID already reserved");
  if (derivedPolicy(state.policy))
    need(!state.acceptances[attempt.node_id], "Accepted node cannot reserve another attempt");
  const node = state.policy.nodes.find((item) => item.node_id === attempt.node_id);
  need(
    node &&
      ["owner_id", "member", "seat_id"].every((key) => node[key] === attempt[key]) &&
      node.output_reservations.includes(attempt.output_reservation),
    "Attempt is outside the frozen owner/node/seat map"
  );
  need(!finalizedOwner(state, attempt.owner_id), "Finalized member cannot reserve more work");
  if (compositionSlot(state.policy, attempt.node_id)) {
    checkCompositionBinding(state, payload.composition, attempt, true);
  }
  validBudget(budget);
  const completeInput = sum(budget.input_tokens_upper_bound, budget.extra_overhead_tokens);
  need(
    sum(completeInput, attempt.output_reservation) <= attempt.context_ceiling,
    "Complete request exceeds the captured context ceiling"
  );
  need(
    exact(spend, [
      "upper_bound_units",
      "currency",
      "units_per_currency",
      "valid_until_ms",
      "evaluator_identity",
      "request_json_sha256",
      "model",
      "route",
      "evidence",
      "evidence_sha256",
    ]) &&
      integer(spend.upper_bound_units) &&
      integer(spend.valid_until_ms) &&
      spend.valid_until_ms > nowMs &&
      spend.currency === state.policy.money.currency &&
      spend.units_per_currency === state.policy.money.units_per_currency &&
      same(spend.evaluator_identity, state.policy.money.evaluator_identity) &&
      spend.request_json_sha256 === attempt.request_json_sha256 &&
      label(spend.model) &&
      HASH.test(spend.route ?? "") &&
      exact(spend.evidence, ["method", "reference", "assumptions"]) &&
      evidenceText(spend.evidence.method, 256) &&
      evidenceText(spend.evidence.reference, 4096) &&
      Array.isArray(spend.evidence.assumptions) &&
      spend.evidence.assumptions.length <= 64 &&
      spend.evidence.assumptions.every((item) => evidenceText(item, 1024)) &&
      HASH.test(spend.evidence_sha256 ?? "") &&
      spend.evidence_sha256 === sha256Bytes(canonicalJson(spend.evidence)),
    "Spend reservation is absent, expired or unbound"
  );
  const nodeCount = state.attempts_per_node[attempt.node_id] ?? 0;
  if (predecessor === null)
    need(nodeCount === 0, "A later attempt requires its terminal predecessor");
  else {
    need(
      exact(predecessor, ["attempt_id", "kind", "reason", "not_before_ms"]) &&
        ["retry", "ambiguous_replay"].includes(predecessor.kind) &&
        label(predecessor.reason) &&
        integer(predecessor.not_before_ms),
      "Invalid predecessor transition"
    );
    const prior = state.reservations[predecessor.attempt_id],
      terminal = state.reconciliations[predecessor.attempt_id];
    need(
      prior &&
        terminal &&
        state.latest_per_node[attempt.node_id] === predecessor.attempt_id &&
        !state.successors[predecessor.attempt_id] &&
        prior.payload.attempt.node_id === attempt.node_id,
      "Predecessor must be the latest terminal attempt without a successor"
    );
    const evidence = terminal.payload.evidence;
    if (predecessor.kind === "ambiguous_replay")
      need(
        ["ambiguous", "not_dispatched"].includes(evidence.classification) &&
          attempt.output_reservation === prior.payload.attempt.output_reservation,
        "Only incomplete execution supports explicit unchanged-reservation replay"
      );
    else {
      need(
        ["retryable_transport", "retryable_output"].includes(evidence.classification),
        "This outcome is not retryable"
      );
      const old = prior.payload.attempt.output_reservation;
      const next =
        evidence.classification === "retryable_transport"
          ? old
          : Math.min(
              old > Number.MAX_SAFE_INTEGER / 2 ? node.output_reservations.at(-1) : old * 2,
              node.output_reservations.at(-1)
            );
      need(
        attempt.output_reservation === next &&
          (evidence.classification !== "retryable_output" || next > old),
        "Retry must use the exact larger frozen variant and stop at the ceiling"
      );
    }
    const earliest = sum(terminal.observed_at_ms, retryDelay(state.policy, nodeCount));
    need(
      predecessor.not_before_ms >= Math.max(earliest, evidence.not_before_ms) &&
        nowMs >= predecessor.not_before_ms,
      "Retry backoff or predecessor not-before has not elapsed",
      "controller_not_before"
    );
  }
  const limits = state.policy.limits,
    totals = state.totals.reserved;
  need(
    nodeCount < limits.max_attempts_per_node &&
      (state.calls_per_member[attempt.member] ?? 0) < limits.max_calls_per_member &&
      sum(totals.input_tokens, completeInput) <= limits.max_input_tokens &&
      sum(totals.output_tokens, attempt.output_reservation) <= limits.max_output_tokens &&
      sum(totals.spend_units, spend.upper_bound_units) <= limits.max_spend_units &&
      sum(sum(totals.calls, 1) * 3, terminalCapacity(state.policy)) <= limits.max_events,
    "Frozen controller quota exhausted",
    "controller_limit_exceeded"
  );
}
function reservation(state, attemptId, intentSha256, requestJsonSha256, nowMs, admission = true) {
  if (admission) live(state, nowMs);
  else clock(state, nowMs);
  const event = state.reservations[attemptId];
  need(
    event &&
      event.payload.attempt.intent_sha256 === intentSha256 &&
      event.payload.attempt.request_json_sha256 === requestJsonSha256,
    "Expected reservation differs from journal"
  );
  if (admission) {
    need(!state.reconciliations[attemptId], "Terminal attempt cannot dispatch");
    need(
      nowMs < event.payload.spend_witness.valid_until_ms,
      "Reserved spend evidence expired",
      "controller_deadline_exceeded"
    );
    need(
      event.payload.predecessor === null || nowMs >= event.payload.predecessor.not_before_ms,
      "Reservation not-before has not elapsed",
      "controller_not_before"
    );
  }
  return event;
}
function validateEvidence(evidence) {
  need(
    exact(evidence, [
      "state",
      "capture_sha256",
      "receipt_sha256",
      "classification",
      "reason",
      "measured",
      "not_before_ms",
    ]) &&
      label(evidence.reason) &&
      integer(evidence.not_before_ms) &&
      exact(evidence.measured, ["input_tokens", "output_tokens", "spend_units"]) &&
      Object.values(evidence.measured).every((value) => value === null || integer(value)),
    "Invalid reconciliation accounting evidence"
  );
  if (evidence.state === "captured")
    need(
      HASH.test(evidence.capture_sha256 ?? "") &&
        HASH.test(evidence.receipt_sha256 ?? "") &&
        ["success", "retryable_transport", "retryable_output", "nonretryable"].includes(
          evidence.classification
        ),
      "Captured outcome lacks authentic capture bindings"
    );
  else
    need(
      ["incomplete", "not_dispatched"].includes(evidence.state) &&
        evidence.capture_sha256 === null &&
        evidence.receipt_sha256 === null &&
        (evidence.classification ===
          (evidence.state === "incomplete" ? "ambiguous" : "not_dispatched") ||
          (evidence.state === "incomplete" &&
            evidence.classification === "nonretryable" &&
            ["invalid_evidence", "invalid_provider_usage"].includes(evidence.reason))) &&
        Object.values(evidence.measured).every((n) => n === null),
      "Incomplete evidence must preserve unknown measured quantities"
    );
}
function checkAcceptance(state, payload) {
  need(derivedPolicy(state.policy), "Acceptance requires a derived-capable controller");
  need(
    exact(payload, [
      "reading_policy_sha256",
      "reading_contract_sha256",
      "bundle_sha256",
      "accepted_sha256",
      "node_id",
      "owner_id",
      "member",
      "seat_id",
      "attempt_id",
      "reconciliation_sha256",
      "parents",
    ]) &&
      [
        "reading_policy_sha256",
        "reading_contract_sha256",
        "bundle_sha256",
        "accepted_sha256",
        "reconciliation_sha256",
      ].every((key) => typeof payload[key] === "string" && HASH.test(payload[key])) &&
      ["node_id", "owner_id", "member", "seat_id"].every((key) => label(payload[key])) &&
      ID.test(payload.attempt_id ?? "") &&
      Array.isArray(payload.parents) &&
      payload.parents.length <= 32,
    "Invalid acceptance commit fields"
  );
  need(
    payload.reading_contract_sha256 === state.policy.reading_contract_sha256 &&
      (state.reading_policy_sha256 === null ||
        payload.reading_policy_sha256 === state.reading_policy_sha256),
    "Acceptance differs from the controller reading bindings"
  );
  need(!state.stopped, "Stopped controller cannot accept a reading", "controller_stopped");
  need(
    Object.keys(state.dispatches).every((id) => state.reconciliations[id]),
    "A controller dispatch still requires reconciliation",
    "controller_dispatch_pending"
  );
  need(!compositionSlot(state.policy, payload.node_id), "Composition node cannot accept a reading");
  need(!finalizedOwner(state, payload.owner_id), "Finalized member cannot accept more readings");
  const reserved = state.reservations[payload.attempt_id],
    terminal = state.reconciliations[payload.attempt_id];
  need(
    reserved &&
      terminal &&
      terminal.event_sha256 === payload.reconciliation_sha256 &&
      terminal.payload.evidence.state === "captured" &&
      terminal.payload.evidence.classification === "success" &&
      ["node_id", "owner_id", "member", "seat_id"].every(
        (key) => reserved.payload.attempt[key] === payload[key]
      ) &&
      !state.acceptances[payload.node_id],
    "Acceptance requires the unique declared node's successful reconciliation"
  );
  const parents = new Set();
  for (const parent of payload.parents) {
    need(
      exact(parent, ["node_id", "accepted_sha256", "event_sha256"]) &&
        label(parent.node_id) &&
        ["accepted_sha256", "event_sha256"].every(
          (key) => typeof parent[key] === "string" && HASH.test(parent[key])
        ) &&
        !parents.has(parent.node_id),
      "Invalid or duplicate acceptance parent"
    );
    const prior = state.acceptances[parent.node_id];
    need(
      prior &&
        prior.event_sha256 === parent.event_sha256 &&
        prior.payload.accepted_sha256 === parent.accepted_sha256 &&
        ["owner_id", "member", "seat_id"].every((key) => prior.payload[key] === payload[key]),
      "Acceptance parent must be an earlier committed reading for this owner and seat"
    );
    parents.add(parent.node_id);
  }
}
// Structural checks only. A runtime caller must reconstruct the semantic proof,
// request and candidate from independent stores; these digests do not attest them.
function checkCompositionBinding(state, binding, identity, admission) {
  need(
    exact(binding, ["proof_sha256", "head", "root"]) &&
      typeof binding.proof_sha256 === "string" &&
      HASH.test(binding.proof_sha256) &&
      validHead(binding.head) &&
      exact(binding.root, ["node_id", "accepted_sha256", "event_sha256"]) &&
      label(binding.root.node_id) &&
      typeof binding.root.accepted_sha256 === "string" &&
      HASH.test(binding.root.accepted_sha256) &&
      typeof binding.root.event_sha256 === "string" &&
      HASH.test(binding.root.event_sha256),
    "Invalid composition proof binding"
  );
  if (admission)
    need(
      binding.head.sequence === state.sequence && binding.head.event_sha256 === state.head_sha256,
      "Composition proof head is stale",
      "controller_stale_head"
    );
  const root = state.acceptances[binding.root.node_id];
  need(
    root &&
      root.event_sha256 === binding.root.event_sha256 &&
      root.payload.accepted_sha256 === binding.root.accepted_sha256 &&
      ["owner_id", "member", "seat_id"].every((k) => root.payload[k] === identity[k]),
    "Composition root must be a committed reading for this owner and seat"
  );
  const accepted = Object.values(state.acceptances).filter(
    (e) => e.payload.owner_id === identity.owner_id
  );
  const consumed = new Set(accepted.flatMap((e) => e.payload.parents.map((p) => p.node_id)));
  const frontier = accepted.filter((e) => !consumed.has(e.payload.node_id));
  need(
    frontier.length === 1 && frontier[0].payload.node_id === binding.root.node_id,
    "Composition root is not the sole current member frontier"
  );
  need(
    Object.entries(state.reservations).every(
      ([id, e]) => e.payload.attempt.owner_id !== identity.owner_id || state.reconciliations[id]
    ),
    "Composition member has unreconciled reservations"
  );
}
function checkFinalization(state, payload) {
  need(compositionPolicy(state.policy), "Finalization requires a v3 controller");
  need(
    exact(payload, [
      "node_id",
      "owner_id",
      "member",
      "seat_id",
      "attempt_id",
      "reconciliation_sha256",
      "request_json_sha256",
      "composition",
      "candidate_sha256",
      "claim_map_sha256",
      "output"
    ]) &&
      ["node_id", "owner_id", "member", "seat_id"].every((k) => label(payload[k])) &&
      ID.test(payload.attempt_id ?? "") &&
      [
        "reconciliation_sha256",
        "request_json_sha256",
        "candidate_sha256",
        "claim_map_sha256"
      ].every((k) => typeof payload[k] === "string" && HASH.test(payload[k])) &&
      exact(payload.output, ["path", "sha256", "byte_length"]) &&
      typeof payload.output.sha256 === "string" &&
      HASH.test(payload.output.sha256) &&
      integer(payload.output.byte_length, 1) &&
      payload.output.byte_length <= 4 * 1024 * 1024,
    "Invalid finalization fields"
  );
  const slot = compositionSlot(state.policy, payload.node_id);
  need(
    slot && payload.output.path === slot.canonical_output_path,
    "Finalization output differs from frozen purpose map"
  );
  need(!state.stopped, "Stopped controller cannot finalize", "controller_stopped");
  need(
    Object.keys(state.dispatches).every((id) => state.reconciliations[id]),
    "A controller dispatch still requires reconciliation",
    "controller_dispatch_pending"
  );
  const reserved = state.reservations[payload.attempt_id],
    terminal = state.reconciliations[payload.attempt_id];
  need(
    reserved &&
      terminal &&
      terminal.event_sha256 === payload.reconciliation_sha256 &&
      terminal.payload.evidence.state === "captured" &&
      terminal.payload.evidence.classification === "success" &&
      ["node_id", "owner_id", "member", "seat_id", "request_json_sha256"].every(
        (k) => reserved.payload.attempt[k] === payload[k]
      ) &&
      same(reserved.payload.composition, payload.composition) &&
      !state.finalizations[payload.node_id],
    "Finalization requires the composition node's unique successful capture and reserved proof"
  );
  checkCompositionBinding(state, payload.composition, payload, false);
}
function apply(state, event) {
  need(
    exact(event, [
      "schema_version",
      "sequence",
      "previous_event_sha256",
      "policy_sha256",
      "observed_at_ms",
      "type",
      "payload",
      "event_sha256",
    ]) &&
      event.schema_version === eventVersion(state.policy) &&
      event.sequence === state.sequence + 1 &&
      event.previous_event_sha256 === state.head_sha256 &&
      event.policy_sha256 === state.policy.policy_sha256 &&
      HASH.test(event.event_sha256 ?? "") &&
      digest(event, "event_sha256") === event.event_sha256,
    "Journal hash chain or sequence differs",
    "controller_corrupt"
  );
  clock(state, event.observed_at_ms);
  const { payload } = event;
  if (event.type === "reservation") {
    checkReservation(state, payload, event.observed_at_ms);
    const { attempt, budget, spend_witness: spend, predecessor } = payload;
    state.reservations[attempt.attempt_id] = event;
    state.attempts_per_node[attempt.node_id] = (state.attempts_per_node[attempt.node_id] ?? 0) + 1;
    state.calls_per_member[attempt.member] = (state.calls_per_member[attempt.member] ?? 0) + 1;
    state.latest_per_node[attempt.node_id] = attempt.attempt_id;
    if (predecessor) state.successors[predecessor.attempt_id] = attempt.attempt_id;
    const totals = state.totals.reserved;
    totals.calls++;
    totals.input_tokens = sum(
      totals.input_tokens,
      sum(budget.input_tokens_upper_bound, budget.extra_overhead_tokens)
    );
    totals.output_tokens = sum(totals.output_tokens, attempt.output_reservation);
    totals.spend_units = sum(totals.spend_units, spend.upper_bound_units);
  } else if (event.type === "dispatch") {
    need(
      exact(payload, ["attempt_id", "reservation_sha256", "intent_sha256", "request_json_sha256"]),
      "Invalid dispatch authorization"
    );
    const reserved = reservation(
      state,
      payload.attempt_id,
      payload.intent_sha256,
      payload.request_json_sha256,
      event.observed_at_ms
    );
    need(
      payload.reservation_sha256 === reserved.event_sha256 && !state.dispatches[payload.attempt_id],
      "Controller dispatch already claimed or mismatched"
    );
    need(
      Object.keys(state.dispatches).every((id) => state.reconciliations[id]),
      "An earlier controller dispatch still requires reconciliation",
      "controller_dispatch_pending"
    );
    state.dispatches[payload.attempt_id] = event;
  } else if (event.type === "reconciliation") {
    need(
      exact(payload, ["attempt_id", "evidence"]) &&
        state.reservations[payload.attempt_id] &&
        !state.reconciliations[payload.attempt_id],
      "Duplicate or unknown reconciliation"
    );
    validateEvidence(payload.evidence);
    need(
      payload.evidence.state !== "captured" || state.dispatches[payload.attempt_id],
      "Captured reconciliation requires a matching durable controller dispatch"
    );
    if (["invalid_evidence", "invalid_provider_usage"].includes(payload.evidence.reason)) {
      state.stopped = true;
      state.stop_reasons.push({ code: payload.evidence.reason, attempt_id: payload.attempt_id });
    }
    const prior = state.reservations[payload.attempt_id].payload;
    const bounds = {
      input_tokens: sum(prior.budget.input_tokens_upper_bound, prior.budget.extra_overhead_tokens),
      output_tokens: prior.attempt.output_reservation,
      spend_units: prior.spend_witness.upper_bound_units,
    };
    for (const key of Object.keys(bounds))
      if (payload.evidence.measured[key] !== null && payload.evidence.measured[key] > bounds[key]) {
        state.stopped = true;
        state.stop_reasons.push({
          code: "provider_bound_violation",
          attempt_id: payload.attempt_id,
          quantity: key,
          reserved: bounds[key],
          measured: payload.evidence.measured[key],
        });
      }
    state.reconciliations[payload.attempt_id] = event;
  } else if (event.type === "acceptance") {
    checkAcceptance(state, payload);
    state.acceptances[payload.node_id] = event;
    state.reading_policy_sha256 = payload.reading_policy_sha256;
  } else if (event.type === "finalization") {
    checkFinalization(state, payload);
    state.finalizations[payload.node_id] = event;
  } else fail("controller_corrupt", "Unknown journal event type");
  if (derivedPolicy(state.policy))
    need(
      sum(state.totals.reserved.calls * 3, terminalCapacity(state.policy)) <=
        state.policy.limits.max_events,
      "Journal has consumed capacity reserved for terminal records",
      "controller_limit_exceeded"
    );
  state.sequence = event.sequence;
  state.head_sha256 = event.event_sha256;
  state.clock_high_water_ms = event.observed_at_ms;
}
function measuredTotals(state) {
  for (const key of ["input_tokens", "output_tokens", "spend_units"]) {
    let total = 0,
      unknown = 0;
    for (const id of Object.keys(state.reservations)) {
      const measured = state.reconciliations[id]?.payload.evidence.measured[key] ?? null;
      if (measured === null) unknown++;
      else total = sum(total, measured);
    }
    state.totals.measured[key] = unknown ? null : total;
    state.totals.unknown[key] = unknown;
  }
}
function anchor(state, events, checkpoint) {
  if (!checkpoint) return;
  need(
    checkpoint.sequence <= state.sequence &&
      (checkpoint.sequence === 0
        ? checkpoint.event_sha256 === null
        : events[checkpoint.sequence - 1].event_sha256 === checkpoint.event_sha256),
    "Journal was rolled back or rewritten relative to its retained checkpoint",
    "controller_corrupt"
  );
}
async function load(where, expectations, remembered) {
  await unchanged(where);
  const rootEntries = (await readdir(where.directory)).sort();
  need(
    same(rootEntries, ["events", "policy.json"]),
    "Controller has missing or unexpected artifacts",
    "controller_corrupt"
  );
  const policy = parse(
    await read(where, "policy.json", MAX_CONTROLLER_POLICY_BYTES),
    MAX_CONTROLLER_POLICY_BYTES
  );
  checkPolicy(policy, expectations);
  await verifyPreparation({
    controlledRoot: where.controlledRoot,
    logicalRoot: policy.plan.logical_root,
    expectedScope: expectations.expectedScope,
    expectedPlanSha256: expectations.expectedPlanSha256,
  });
  const names = (await readdir(path.join(where.directory, "events"))).sort();
  need(
    names.length <= policy.limits.max_events &&
      names.every((name, i) => name === path.basename(filename(i + 1))),
    "Journal has a gap, unexpected artifact or too many records",
    "controller_corrupt"
  );
  const state = initial(policy),
    events = [];
  for (const name of names) {
    const event = parse(
      await read(where, `events/${name}`, MAX_CONTROLLER_RECORD_BYTES),
      MAX_CONTROLLER_RECORD_BYTES
    );
    apply(state, event);
    events.push(event);
  }
  anchor(state, events, expectations.expectedHead);
  anchor(state, events, remembered);
  measuredTotals(state);
  await unchanged(where);
  return { policy, events, state };
}
async function stableLoad(where, expectations, remembered) {
  for (let tries = 0; ; tries++) {
    try {
      return await load(where, expectations, remembered);
    } catch (error) {
      // Exclusive writers expose a sequence slot before its bytes are complete.
      // Reread briefly for concurrent progress; never alter or repair its contents.
      if (error.code !== "controller_corrupt" || tries >= 8) throw error;
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  }
}
function handleFor(where, expectations, loaded, nowMs) {
  const handle = Object.freeze({
    policy: freeze(clone(loaded.policy)),
    controlledRoot: where.controlledRoot,
    logicalRoot: where.logicalRoot,
  });
  handles.set(handle, {
    where,
    expectations,
    remembered: { sequence: loaded.state.sequence, event_sha256: loaded.state.head_sha256 },
    observedClockMs: nowMs,
  });
  return handle;
}
async function revalidate(handle) {
  const privateState = handles.get(handle);
  need(privateState, "An authentic controller handle is required", "invalid_controller_handle");
  const loaded = await stableLoad(
    privateState.where,
    privateState.expectations,
    privateState.remembered
  );
  if (loaded.state.sequence > privateState.remembered.sequence)
    privateState.remembered = {
      sequence: loaded.state.sequence,
      event_sha256: loaded.state.head_sha256,
    };
  return { privateState, ...loaded };
}
function handleClock(privateState, state, nowMs) {
  clock(state, nowMs);
  need(
    nowMs >= privateState.observedClockMs,
    "Observed clock regressed relative to this handle",
    "controller_clock_regression"
  );
}
function rememberClock(privateState, nowMs) {
  privateState.observedClockMs = Math.max(privateState.observedClockMs, nowMs);
}

/** One controller namespace per preparation digest; existing policy cannot reset it. */
export async function createController(args) {
  const expectations = expected(args),
    policy = clone(args.policy),
    nowMs = args.nowMs ?? Date.now();
  checkPolicy(policy, expectations);
  clock(initial(policy), nowMs);
  const where = await location(args.controlledRoot, expectations.expectedPlanSha256);
  await verifyPreparation({
    controlledRoot: where.controlledRoot,
    logicalRoot: policy.plan.logical_root,
    expectedScope: expectations.expectedScope,
    expectedPlanSha256: expectations.expectedPlanSha256,
  });
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
      return verifyController({ controlledRoot: where.controlledRoot, ...expectations, nowMs });
    throw error;
  }
  where.identity = await directories(where.directory);
  await syncDirectory(parent);
  await mkdir(path.join(where.directory, "events"), { mode: 0o700 });
  where.eventsIdentity = await directories(path.join(where.directory, "events"));
  await syncDirectory(where.directory);
  await writeExclusive(where, "policy.json", encode(policy, MAX_CONTROLLER_POLICY_BYTES));
  const loaded = await load(where, expectations);
  clock(loaded.state, nowMs);
  return handleFor(where, expectations, loaded, nowMs);
}

export async function verifyController(args) {
  const expectations = expected(args),
    suppliedNowMs = args.nowMs,
    where = await location(args.controlledRoot, expectations.expectedPlanSha256);
  where.identity = await directories(where.directory);
  where.eventsIdentity = await directories(path.join(where.directory, "events"));
  const loaded = await stableLoad(where, expectations);
  const nowMs = suppliedNowMs ?? Date.now();
  clock(loaded.state, nowMs);
  return handleFor(where, expectations, loaded, nowMs);
}

export async function readController({ handle, nowMs }) {
  const { privateState, policy, events, state } = await revalidate(handle);
  nowMs ??= Date.now();
  handleClock(privateState, state, nowMs);
  // Internal dictionaries have no prototype, so arbitrary allowed node labels
  // cannot mutate Object.prototype. Return an ordinary detached JSON view.
  const result = freeze(JSON.parse(JSON.stringify({ policy, events, state })));
  rememberClock(privateState, nowMs);
  return result;
}

async function append(handle, nowMs, build, expectedCurrentHead = null, guarded = false) {
  // Copy before any await: a caller cannot alter the expected head during I/O.
  const head = expectedCurrentHead === null ? null : freeze(clone(expectedCurrentHead));
  need(head === null || validHead(head), "Invalid exact current journal head");
  for (let tries = 0; tries < 64; tries++) {
    const { privateState, state } = await revalidate(handle);
    // A competing H+1 may have a later timestamp than this operation's snapshot.
    // With an exact head, classify that collision before checking its old time.
    // Unguarded legacy operations retain their original validation order.
    if (head === null) handleClock(privateState, state, nowMs);
    if (guarded && derivedPolicy(state.policy))
      need(head !== null, "Derived operation requires an exact current journal head");
    const transition = build(state);
    if (transition.existing) {
      if (head !== null) handleClock(privateState, state, nowMs);
      const result = freeze(clone(transition.existing));
      rememberClock(privateState, nowMs);
      return result;
    }
    if (head !== null)
      need(
        state.sequence === head.sequence && state.head_sha256 === head.event_sha256,
        "Journal advanced since operation verification; verify again against the current head",
        "controller_stale_head"
      );
    if (head !== null) handleClock(privateState, state, nowMs);
    need(
      state.sequence < state.policy.limits.max_events,
      "Journal record limit exhausted",
      "controller_limit_exceeded"
    );
    const body = {
      schema_version: eventVersion(state.policy),
      sequence: state.sequence + 1,
      previous_event_sha256: state.head_sha256,
      policy_sha256: state.policy.policy_sha256,
      observed_at_ms: nowMs,
      type: transition.type,
      payload: transition.payload,
    };
    const event = { ...body, event_sha256: sha256Bytes(canonicalJson(body)) };
    apply(state, event);
    measuredTotals(state);
    try {
      await writeExclusive(privateState.where, filename(event.sequence), encode(event));
    } catch (error) {
      if (error.code === "EEXIST") continue;
      throw error;
    }
    if (event.sequence > privateState.remembered.sequence) {
      privateState.remembered = { sequence: event.sequence, event_sha256: event.event_sha256 };
    }
    rememberClock(privateState, nowMs);
    return freeze(clone(event));
  }
  fail("controller_busy", "Concurrent journal updates exceeded the bounded CAS retry count");
}

/** Reserve full conservative allowances; caller budget/evidence is data, not execution authority. */
export async function reserveAttempt({
  handle,
  intent: supplied,
  verifiedBudget,
  spendWitness,
  predecessor = null,
  expectedCurrentHead = null,
  nowMs = Date.now(),
}) {
  const intent = clone(supplied),
    budget = clone(verifiedBudget),
    spend = clone(spendWitness),
    prior = predecessor === null ? null : clone(predecessor);
  return append(
    handle,
    nowMs,
    (state) => {
      need(
        (compositionSlot(state.policy, intent.node_id)
          ? intent.schema_version === "council-staged-attempt/v4"
          : (intent.schema_version === "council-staged-attempt/v2" ||
              (derivedPolicy(state.policy) &&
                intent.schema_version === "council-staged-attempt/v3")) &&
            !Object.hasOwn(intent, "composition")) &&
          HASH.test(intent.intent_sha256 ?? "") &&
          digest(intent, "intent_sha256") === intent.intent_sha256 &&
          intent.plan?.sha256 === state.policy.plan.sha256 &&
          intent.plan?.logical_root === state.policy.plan.logical_root &&
          same(intent.scope, state.policy.scope) &&
          exact(intent.controller, ["logical_root", "policy_sha256"]) &&
          intent.controller.logical_root === `.council-controllers/${state.policy.plan.sha256}` &&
          intent.controller.policy_sha256 === state.policy.policy_sha256 &&
          spend.model === intent.seat?.declared_model &&
          spend.route === intent.seat?.recipe_sha256,
        "Intent or spend witness differs from the frozen controller policy"
      );
      const attempt = {
        attempt_id: intent.attempt_id,
        intent_sha256: intent.intent_sha256,
        request_json_sha256: intent.request_json_sha256,
        node_id: intent.node_id,
        owner_id: intent.owner_id,
        member: intent.seat.member,
        seat_id: intent.seat.seat_id,
        output_reservation: intent.seat.output_reservation,
        context_ceiling: intent.seat.context_ceiling,
      };
      return {
        type: "reservation",
        payload: {
          attempt,
          budget,
          spend_witness: spend,
          predecessor: prior,
          ...(compositionSlot(state.policy, intent.node_id)
            ? { composition: intent.composition }
            : {})
        }
      };
    },
    expectedCurrentHead,
    true
  );
}

/** Fresh read for dispatch checks; terminal/stopped/expired reservations cannot dispatch. */
export async function verifyReservation({
  handle,
  attemptId,
  intentSha256,
  requestJsonSha256,
  nowMs = Date.now(),
}) {
  const { privateState, state } = await revalidate(handle);
  handleClock(privateState, state, nowMs);
  const result = freeze(
    clone(reservation(state, attemptId, intentSha256, requestJsonSha256, nowMs))
  );
  rememberClock(privateState, nowMs);
  return result;
}

/** Durable single dispatch authorization. A crash after this claim requires a new attempt ID. */
export async function claimControllerDispatch({
  handle,
  attemptId,
  intentSha256,
  requestJsonSha256,
  expectedCurrentHead = null,
  nowMs = Date.now(),
}) {
  return append(
    handle,
    nowMs,
    (state) => {
      const reserved = reservation(state, attemptId, intentSha256, requestJsonSha256, nowMs);
      return {
        type: "dispatch",
        payload: {
          attempt_id: attemptId,
          reservation_sha256: reserved.event_sha256,
          intent_sha256: intentSha256,
          request_json_sha256: requestJsonSha256,
        },
      };
    },
    expectedCurrentHead,
    true
  );
}

/**
 * Commit an independently verified candidate at its exact verification head.
 * This store authenticates journal structure, not note/counter/bundle semantics.
 * An identical existing commit is idempotent; callers must still verify its bundle.
 */
export async function commitReadingAcceptance({
  handle,
  acceptance,
  expectedCurrentHead,
  nowMs = Date.now(),
}) {
  const payload = clone(acceptance);
  return append(
    handle,
    nowMs,
    (state) => {
      need(derivedPolicy(state.policy), "Acceptance requires a derived-capable controller");
      const old = state.acceptances[payload.node_id];
      if (old) {
        need(
          same(old.payload, payload),
          "A different reading already won acceptance for this node"
        );
        return { existing: old };
      }
      return { type: "acceptance", payload };
    },
    expectedCurrentHead ?? null,
    true
  );
}

/**
 * Commit structural finalization at the independently verified head. No output is
 * written and no claim/proof semantics are verified here. Never use the event as
 * semantic authority without fresh runtime verification of its original evidence.
 */
export async function commitCompositionFinalization({
  handle,
  finalization,
  expectedCurrentHead,
  nowMs = Date.now()
}) {
  const payload = clone(finalization);
  return append(
    handle,
    nowMs,
    (state) => {
      need(compositionPolicy(state.policy), "Finalization requires a v3 controller");
      const old = state.finalizations[payload.node_id];
      if (old) {
        need(
          same(old.payload, payload),
          "A different finalization already won this composition node"
        );
        return { existing: old };
      }
      return { type: "finalization", payload };
    },
    expectedCurrentHead ?? null,
    true
  );
}

/** Reconcile once without refunds. Only independently verified evidence belongs here. */
export async function reconcileAttempt({
  handle,
  attemptId,
  evidence: supplied,
  nowMs = Date.now(),
}) {
  const evidence = clone(supplied);
  return append(handle, nowMs, (state) => {
    const old = state.reconciliations[attemptId];
    if (old) {
      need(
        same(old.payload.evidence, evidence),
        "Reconciliation differs from the immutable existing evidence"
      );
      return { existing: old };
    }
    return { type: "reconciliation", payload: { attempt_id: attemptId, evidence } };
  });
}

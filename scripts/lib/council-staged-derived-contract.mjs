#!/usr/bin/env node
/**
 * Purpose: Bind bounded derived packets to one original preparation and controller.
 * Usage: readingContractSha256, validateDerivedPolicy, createDerivedCandidate.
 * Pure structural checks only. Stored counts and parent claims are not authority:
 * guarded admission must independently recount and prove historical acceptance.
 */
import {
  canonicalJson,
  candidateSha256,
  sha256Bytes,
  validatePlan,
} from "./council-staged-sources.mjs";
import { planRereadDelivery } from "./council-staged-rereads.mjs";

export const DERIVED_CAPS = Object.freeze({
  policy: 1024 * 1024,
  package: 64 * 1024 * 1024,
  candidate: 4 * 1024 * 1024,
  capacity: 256 * 1024 * 1024,
  nodes: 256,
  records: 4096,
});
const HASH = /^[a-f0-9]{64}$/;
const CORE_KEYS = [
  "schema_version",
  "plan",
  "scope",
  "question_contract",
  "members",
  "limits",
  "note_counter_identity",
  "request_counter_identity",
];
const LIMIT_CAPS = {
  max_note_bytes: 1024 * 1024,
  max_note_tokens: Number.MAX_SAFE_INTEGER,
  max_items: 1024,
  max_reread_requests: 256,
  max_reread_bytes: 32 * 1024 * 1024,
  max_records: DERIVED_CAPS.records,
  max_request_packages: DERIVED_CAPS.records,
  max_package_bytes: DERIVED_CAPS.package,
  max_candidates: DERIVED_CAPS.records,
  max_candidate_bytes: DERIVED_CAPS.candidate,
  max_delivery_bytes: 32 * 1024 * 1024,
  max_delivery_parts: 256,
};
export function derivedNeed(value, message, code = "derived_conflict") {
  if (!value) throw Object.assign(new Error(message), { code });
}
const need = derivedNeed;
const same = (a, b) => canonicalJson(a) === canonicalJson(b);
const integer = (n, min = 0, max = Number.MAX_SAFE_INTEGER) =>
  Number.isSafeInteger(n) && n >= min && n <= max;
const label = (s) =>
  typeof s === "string" &&
  s.trim().length > 0 &&
  s.length <= 1024 &&
  !/[\x00-\x1f\x7f]/u.test(s);
const hash = (s) => typeof s === "string" && HASH.test(s);
const prose = (s) =>
  typeof s === "string" &&
  s.trim().length > 0 &&
  s.length <= 65536 &&
  !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u.test(s);
function exact(value, keys) {
  need(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).length === keys.length &&
      keys.every((key) => Object.hasOwn(value, key)),
    "Missing or unsupported derived fields",
  );
}
function list(value, min, max) {
  need(
    Array.isArray(value) && value.length >= min && value.length <= max,
    "Invalid bounded derived array",
  );
}
export function derivedDigest(value, key) {
  const { [key]: ignored, ...body } = value;
  return sha256Bytes(canonicalJson(body));
}

/** Storage integrity only. Runtime reconstruction establishes note semantics. */
export function validateReadingCandidate({ bundle: supplied, policy }) {
  const bytes = encodeDerived(supplied, policy.limits.max_candidate_bytes);
  const bundle = cloneDerived(supplied, policy.limits.max_candidate_bytes);
  exact(bundle, [
    "schema_version",
    "prior_head",
    "record",
    "note_utf8",
    "bundle_sha256",
  ]);
  need(
    bundle.schema_version === "council-staged-reading-candidate/v1",
    "Unsupported candidate",
  );
  exact(bundle.prior_head, ["sequence", "event_sha256"]);
  need(
    integer(bundle.prior_head.sequence, 0, DERIVED_CAPS.records) &&
      (bundle.prior_head.sequence === 0
        ? bundle.prior_head.event_sha256 === null
        : hash(bundle.prior_head.event_sha256)),
    "Invalid candidate prior head",
  );
  const record = bundle.record;
  exact(record, [
    "schema_version",
    "policy_sha256",
    "plan_sha256",
    "scope",
    "owner_id",
    "member",
    "seat_id",
    "node_id",
    "kind",
    "operation_id",
    "attempt",
    "parents",
    "note",
    "note_witness",
    "ranges",
    "fulfilled_requests",
    "outstanding_requests",
    "accepted_sha256",
  ]);
  need(
    record.schema_version === "council-staged-accepted-reading/v2" &&
      record.policy_sha256 === policy.policy_sha256 &&
      record.plan_sha256 === policy.plan.sha256 &&
      same(record.scope, policy.scope) &&
      ["initial", "successor"].includes(record.kind),
    "Candidate reading bindings differ",
  );
  const member = policy.members.find(
    (m) =>
      m.owner_id === record.owner_id &&
      m.member === record.member &&
      m.seat_id === record.seat_id,
  );
  const nodes = record.kind === "initial" ? member?.leaves : member?.successors;
  need(
    nodes?.some((n) => n.node_id === record.node_id) &&
      label(record.operation_id),
    "Candidate node is not declared",
  );
  exact(record.attempt, [
    "attempt_id",
    "intent_sha256",
    "request_json_sha256",
    "capture_sha256",
    "provenance_sha256",
    "reconciliation_sha256",
  ]);
  need(
    label(record.attempt.attempt_id) &&
      Object.entries(record.attempt).every(
        ([k, v]) => k === "attempt_id" || hash(v),
      ),
    "Invalid candidate attempt",
  );
  exact(record.note, ["sha256", "byte_length"]);
  need(
    typeof bundle.note_utf8 === "string" &&
      integer(record.note.byte_length, 1, policy.limits.max_note_bytes) &&
      Buffer.byteLength(bundle.note_utf8) === record.note.byte_length &&
      sha256Bytes(bundle.note_utf8) === record.note.sha256,
    "Candidate raw note differs",
  );
  list(record.parents, 0, 32);
  for (const parent of record.parents) {
    exact(parent, [
      "node_id",
      "accepted_sha256",
      "event_sha256",
      "note_sha256",
    ]);
    need(
      label(parent.node_id) &&
        [parent.accepted_sha256, parent.event_sha256, parent.note_sha256].every(
          hash,
        ),
      "Invalid candidate parent",
    );
  }
  list(record.ranges, 0, DERIVED_CAPS.records);
  list(record.fulfilled_requests, 0, policy.limits.max_delivery_parts);
  list(record.outstanding_requests, 0, policy.limits.max_reread_requests);
  need(
    hash(record.accepted_sha256) &&
      derivedDigest(record, "accepted_sha256") === record.accepted_sha256 &&
      hash(bundle.bundle_sha256) &&
      derivedDigest(bundle, "bundle_sha256") === bundle.bundle_sha256,
    "Candidate digests differ",
  );
  return { bundle: freezeDerived(bundle), bytes };
}
/** Reject non-data properties before reading even an array element or scalar. */
export function encodeDerived(value, limit = DERIVED_CAPS.package) {
  const seen = new Set();
  function data(item, depth) {
    need(depth <= 64, "Derived JSON is too deep");
    if (typeof item === "string")
      return need(item.isWellFormed(), "Malformed Unicode");
    if (item === null || typeof item === "boolean") return;
    if (typeof item === "number")
      return need(Number.isFinite(item), "Nonfinite JSON number");
    need(
      item && typeof item === "object" && !seen.has(item),
      "Non-JSON or cyclic derived data",
    );
    const array = Array.isArray(item),
      proto = Object.getPrototypeOf(item);
    need(
      array
        ? proto === Array.prototype
        : proto === Object.prototype || proto === null,
      "Derived JSON must have plain data prototypes",
    );
    const keys = Reflect.ownKeys(item);
    need(
      !array || keys.length === item.length + 1,
      "Sparse or decorated array",
    );
    seen.add(item);
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(item, key);
      need(
        typeof key === "string" &&
          key.isWellFormed() &&
          Object.hasOwn(descriptor, "value") &&
          (descriptor.enumerable || (array && key === "length")),
        "Non-data derived property",
      );
      if (array && key !== "length")
        need(
          /^(0|[1-9][0-9]*)$/.test(key) && Number(key) < item.length,
          "Invalid array index",
        );
      data(descriptor.value, depth + 1);
    }
    seen.delete(item);
  }
  data(value, 0);
  const bytes = Buffer.from(`${canonicalJson(value)}\n`);
  need(bytes.length <= limit, "Derived record exceeds its encoded byte bound");
  return bytes;
}
export const cloneDerived = (value, limit) =>
  JSON.parse(encodeDerived(value, limit).toString("utf8"));
export function freezeDerived(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freezeDerived);
    Object.freeze(value);
  }
  return value;
}
export function parseDerived(bytes, limit) {
  try {
    const value = JSON.parse(
      new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes),
    );
    need(
      encodeDerived(value, limit).equals(bytes),
      "Noncanonical derived record",
    );
    return value;
  } catch {
    need(
      false,
      "Partial, invalid or noncanonical derived record",
      "derived_corrupt",
    );
  }
}
function identity(value) {
  exact(value, ["id", "revision", "artifact_sha256"]);
  need(
    label(value.id) && label(value.revision) && hash(value.artifact_sha256),
    "Invalid counter identity",
  );
}
function questions(value) {
  exact(value, ["brief", "questions"]);
  need(prose(value.brief), "Invalid question brief");
  list(value.questions, 1, 1024);
  const ids = new Set();
  for (const q of value.questions) {
    exact(q, ["id", "text"]);
    need(
      label(q.id) && prose(q.text) && !ids.has(q.id),
      "Invalid or duplicate question",
    );
    ids.add(q.id);
  }
}
function coreNodes(core, preparation) {
  exact(core, CORE_KEYS);
  need(
    core.schema_version === "council-staged-reading-policy/v2",
    "Unsupported derived reading policy",
  );
  const plan = preparation.plan;
  validatePlan({ plan });
  exact(core.plan, ["logical_root", "sha256"]);
  need(
    same(core.plan, {
      logical_root: plan.logical_root,
      sha256: plan.plan_sha256,
    }) && same(core.scope, plan.scope),
    "Reading policy differs from original preparation",
  );
  questions(core.question_contract);
  need(
    sha256Bytes(canonicalJson(core.question_contract)) ===
      plan.scope.question_set_sha256,
    "Question contract drift",
  );
  identity(core.note_counter_identity);
  identity(core.request_counter_identity);
  for (const chunk of plan.chunks)
    for (const a of chunk.assessments) {
      need(
        same(
          a.counter_witness?.counter_identity ?? null,
          core.request_counter_identity,
        ),
        "Original request counter differs",
      );
      for (const v of a.request_variants)
        need(
          same(
            v.counter_witness?.counter_identity ?? null,
            core.request_counter_identity,
          ),
          "Original variant counter differs",
        );
    }
  exact(core.limits, Object.keys(LIMIT_CAPS));
  for (const [key, cap] of Object.entries(LIMIT_CAPS))
    need(integer(core.limits[key], 1, cap), `Invalid derived limit ${key}`);
  const capacity =
    core.limits.max_request_packages * core.limits.max_package_bytes +
    core.limits.max_candidates * core.limits.max_candidate_bytes;
  need(
    integer(capacity, 1, DERIVED_CAPS.capacity),
    "Declared derived storage exceeds total capacity",
  );
  list(core.members, plan.seats.length, plan.seats.length);
  const seats = new Map(plan.seats.map((s) => [s.seat_id, s])),
    claimed = new Set(),
    owners = new Set(),
    nodes = new Map();
  for (const member of core.members) {
    exact(member, ["owner_id", "member", "seat_id", "leaves", "successors"]);
    need(
      [member.owner_id, member.member, member.seat_id].every(label) &&
        seats.has(member.seat_id) &&
        !claimed.has(member.seat_id) &&
        !owners.has(member.owner_id),
      "Invalid or repeated member seat or owner",
    );
    claimed.add(member.seat_id);
    owners.add(member.owner_id);
    list(member.leaves, plan.chunks.length, plan.chunks.length);
    list(member.successors, 0, DERIVED_CAPS.nodes);
    const local = new Map();
    function add(node, round) {
      need(
        label(node.node_id) && !nodes.has(node.node_id),
        "Invalid or repeated logical node",
      );
      const slot = {
        ...node,
        round,
        owner_id: member.owner_id,
        member: member.member,
        seat_id: member.seat_id,
      };
      local.set(node.node_id, slot);
      nodes.set(node.node_id, slot);
    }
    member.leaves.forEach((leaf, index) => {
      exact(leaf, ["node_id", "chunk_id"]);
      need(
        leaf.chunk_id === plan.chunks[index].id,
        "Leaves must cover every ordered original chunk",
      );
      add(leaf, 0);
    });
    for (const successor of member.successors) {
      exact(successor, ["node_id", "round", "parent_node_ids"]);
      list(successor.parent_node_ids, 1, 32);
      need(
        new Set(successor.parent_node_ids).size ===
          successor.parent_node_ids.length &&
          successor.parent_node_ids.every((id) => label(id) && local.has(id)),
        "Parents must be distinct earlier nodes of this member",
      );
      need(
        successor.round ===
          1 +
            Math.max(
              ...successor.parent_node_ids.map((id) => local.get(id).round),
            ),
        "Incorrect successor round",
      );
      add(successor, successor.round);
    }
  }
  need(
    nodes.size <= DERIVED_CAPS.nodes && nodes.size <= core.limits.max_records,
    "Too many declared reading nodes",
  );
  return nodes;
}
export function readingContractSha256({ core: supplied, preparation }) {
  const core = cloneDerived(supplied, DERIVED_CAPS.policy);
  coreNodes(core, preparation);
  return sha256Bytes(
    canonicalJson({
      schema_version: "council-staged-reading-contract/v1",
      reading_policy_body: core,
    }),
  );
}
export function validateDerivedPolicy({
  policy: supplied,
  preparation,
  controller,
}) {
  const policy = cloneDerived(supplied, DERIVED_CAPS.policy);
  exact(policy, [...CORE_KEYS, "controller_policy_sha256", "policy_sha256"]);
  const { controller_policy_sha256, policy_sha256, ...core } = policy;
  const nodes = coreNodes(core, preparation);
  need(
    hash(policy_sha256) &&
      derivedDigest(policy, "policy_sha256") === policy_sha256 &&
      controller.schema_version === "council-staged-controller-policy/v2" &&
      controller_policy_sha256 === controller.policy_sha256 &&
      derivedDigest(controller, "policy_sha256") === controller_policy_sha256 &&
      same(controller.plan, policy.plan) &&
      same(controller.scope, policy.scope) &&
      controller.reading_contract_sha256 ===
        readingContractSha256({ core, preparation }),
    "Reading/controller binding differs",
  );
  need(controller.nodes.length === nodes.size, "Controller node map differs");
  const seen = new Set();
  for (const node of controller.nodes) {
    const slot = nodes.get(node.node_id),
      seat = preparation.plan.seats.find((s) => s.seat_id === slot?.seat_id);
    need(
      slot &&
        !seen.has(node.node_id) &&
        same(node, {
          node_id: slot.node_id,
          owner_id: slot.owner_id,
          member: slot.member,
          seat_id: slot.seat_id,
          output_reservations: seat.output_reservations,
        }),
      "Controller owner, seat or output map differs",
    );
    seen.add(node.node_id);
  }
  return { policy: freezeDerived(policy), nodes };
}
export function derivedPackageRoot(policy, attemptId) {
  const prefix = `d-${policy.plan.sha256}-`;
  need(
    typeof attemptId === "string" && attemptId.startsWith(prefix),
    "Derived attempt is outside the finite slot namespace",
  );
  const suffix = attemptId.slice(prefix.length);
  need(
    /^(0|[1-9][0-9]*)$/.test(suffix) &&
      integer(Number(suffix), 0, policy.limits.max_request_packages - 1),
    "Derived attempt slot is noncanonical or exhausted",
  );
  return `.council-readings/${policy.plan.sha256}/requests/${attemptId}`;
}
/** Keep the original interval immutable; the selector sees only its pending suffix. */
export function selectDerivedDelivery({
  policy,
  preparation,
  requests: supplied,
}) {
  const requests = cloneDerived(supplied, policy.limits.max_package_bytes);
  list(requests, 0, policy.limits.max_reread_requests);
  const map = new Map();
  for (const envelope of requests) {
    exact(envelope, ["origin_node_id", "request", "pending"]);
    need(label(envelope.origin_node_id), "Invalid request origin");
    exact(envelope.pending, ["start", "end", "sha256"]);
    const { request, pending } = envelope;
    // The existing selector validates exact request fields, bytes and UTF-8 boundaries.
    planRereadDelivery({
      sources: preparation.sources,
      requests: [request],
      limits: { max_bytes: 32 * 1024 * 1024, max_parts: 1, max_requests: 1 },
    });
    need(
      request.end - request.start <= policy.limits.max_reread_bytes &&
        request.item_ids.length <= policy.limits.max_items &&
        integer(pending.start) &&
        pending.start >= request.start &&
        pending.end === request.end &&
        hash(pending.sha256),
      "Pending suffix or original request exceeds its declared bounds",
    );
    const id = sha256Bytes(
      canonicalJson([envelope.origin_node_id, request.id]),
    );
    need(!map.has(id), "Repeated origin/request identity");
    map.set(id, envelope);
  }
  const selected = planRereadDelivery({
    sources: preparation.sources,
    requests: [...map].map(([id, { request, pending }]) => ({
      ...request,
      ...pending,
      id,
    })),
    limits: {
      max_bytes: policy.limits.max_delivery_bytes,
      max_parts: policy.limits.max_delivery_parts,
      max_requests: policy.limits.max_reread_requests,
    },
  });
  return {
    deliveries: selected.deliveries.map(({ request_id, range, bytes }) => ({
      origin_node_id: map.get(request_id).origin_node_id,
      request_id: map.get(request_id).request.id,
      range,
      text_utf8: bytes.toString("utf8"),
    })),
    remaining: selected.remaining.map(({ id, start, end, sha256 }) => ({
      ...map.get(id),
      pending: { start, end, sha256 },
    })),
  };
}
export function validateDerivedPacket({
  packet: supplied,
  policy,
  preparation,
}) {
  const packet = cloneDerived(supplied, policy.limits.max_package_bytes);
  exact(packet, [
    "schema_version",
    "attempt_id",
    "plan_sha256",
    "scope",
    "reading_policy_sha256",
    "node_id",
    "owner_id",
    "member",
    "seat_id",
    "source_index",
    "parents",
    "requests",
    "deliveries",
    "remaining",
  ]);
  need(
    packet.schema_version === "council-staged-derived-packet/v1" &&
      packet.plan_sha256 === policy.plan.sha256 &&
      packet.reading_policy_sha256 === policy.policy_sha256 &&
      same(packet.scope, policy.scope),
    "Packet scope or policy drift",
  );
  derivedPackageRoot(policy, packet.attempt_id);
  const member = policy.members.find((m) => m.seat_id === packet.seat_id);
  const slot = member?.successors.find((s) => s.node_id === packet.node_id);
  need(
    slot &&
      member.owner_id === packet.owner_id &&
      member.member === packet.member,
    "Packet is not a declared successor",
  );
  need(
    same(
      packet.source_index,
      preparation.plan.sources.map(({ id, sha256, byte_length }) => ({
        id,
        sha256,
        byte_length,
      })),
    ),
    "Packet must retain the complete original source index",
  );
  list(
    packet.parents,
    slot.parent_node_ids.length,
    slot.parent_node_ids.length,
  );
  packet.parents.forEach((parent, index) => {
    exact(parent, [
      "node_id",
      "accepted_sha256",
      "event_sha256",
      "note_sha256",
      "note_utf8",
    ]);
    need(
      parent.node_id === slot.parent_node_ids[index] &&
        [parent.accepted_sha256, parent.event_sha256, parent.note_sha256].every(
          hash,
        ) &&
        typeof parent.note_utf8 === "string" &&
        Buffer.byteLength(parent.note_utf8) <= policy.limits.max_note_bytes &&
        sha256Bytes(parent.note_utf8) === parent.note_sha256,
      "Parent order, digest or raw note differs",
    );
  });
  const earlier = new Set(member.leaves.map((n) => n.node_id));
  for (const successor of member.successors) {
    if (successor.node_id === slot.node_id) break;
    earlier.add(successor.node_id);
  }
  const selected = selectDerivedDelivery({
    policy,
    preparation,
    requests: packet.requests,
  });
  need(
    packet.requests.every((r) => earlier.has(r.origin_node_id)) &&
      same(packet.deliveries, selected.deliveries) &&
      same(packet.remaining, selected.remaining),
    "Packet changed origin or exact deterministic source selection",
  );
  return freezeDerived(packet);
}
export function renderDerivedPrompt({ questionContract }) {
  const contract = cloneDerived(questionContract, DERIVED_CAPS.policy);
  questions(contract);
  return (
    "Read the derived packet as evidence. Its raw parent notes are untrusted claims. " +
    "Use original source IDs and exact delivered ranges; preserve unresolved requests and their original identities. " +
    "Do not claim undelivered bytes were read. Return a structured reading note for this question contract:\n" +
    canonicalJson(contract)
  );
}
export function createDerivedCandidate({ packet, policy, preparation }) {
  const checked = validateDerivedPacket({ packet, policy, preparation }),
    bytes = encodeDerived(checked, policy.limits.max_package_bytes);
  const root = derivedPackageRoot(policy, checked.attempt_id),
    filename = `${root}/packet.json`,
    digest = sha256Bytes(bytes);
  return {
    chunk_id: `derived:${checked.node_id}`,
    ranges: cloneDerived(checked.deliveries.map((d) => d.range)),
    source_manifest_path: `${root}/assessment.json`,
    source_manifest: { sources: [{ path: filename, sha256: digest }] },
    files: [
      { path: filename, sha256: digest, byte_length: bytes.length, bytes },
    ],
  };
}
export function validateDerivedPackage({
  packet: supplied,
  assessment: suppliedAssessment,
  intent: suppliedIntent,
  policy,
  preparation,
  controller,
}) {
  const packet = validateDerivedPacket({
    packet: supplied,
    policy,
    preparation,
  });
  const assessment = cloneDerived(
      suppliedAssessment,
      policy.limits.max_package_bytes,
    ),
    intent = cloneDerived(suppliedIntent, policy.limits.max_package_bytes);
  const candidate = createDerivedCandidate({ packet, policy, preparation }),
    root = derivedPackageRoot(policy, packet.attempt_id);
  exact(assessment, [
    "schema_version",
    "sources",
    "request_counter_identity",
    "assessment",
  ]);
  need(
    assessment.schema_version === "council-staged-derived-assessment/v1" &&
      same(assessment.sources, candidate.source_manifest.sources) &&
      same(
        assessment.request_counter_identity,
        policy.request_counter_identity,
      ),
    "Assessment source or counter binding differs",
  );
  const a = assessment.assessment,
    seat = preparation.plan.seats.find((s) => s.seat_id === packet.seat_id);
  const original = preparation.plan.chunks[0].assessments.find(
    (s) => s.seat_id === packet.seat_id,
  );
  exact(a, [
    "candidate_sha256",
    "seat_id",
    "recipe_sha256",
    "facilitator_sha256",
    "system_prompt_sha256",
    "user_prompt_sha256",
    "request_json_sha256",
    "input_tokens_upper_bound",
    "extra_overhead_tokens",
    "counter_witness",
    "verified",
    "request_variants",
  ]);
  need(
    a.candidate_sha256 === candidateSha256(candidate) &&
      a.seat_id === seat.seat_id &&
      a.recipe_sha256 === seat.recipe_sha256 &&
      a.facilitator_sha256 === original.facilitator_sha256 &&
      a.verified === true &&
      [a.system_prompt_sha256, a.user_prompt_sha256].every(hash),
    "Assessment candidate, recipe or verification differs",
  );
  list(
    a.request_variants,
    seat.output_reservations.length,
    seat.output_reservations.length,
  );
  a.request_variants.forEach((v, index) => {
    exact(v, [
      "output_reservation",
      "request_json_sha256",
      "input_tokens_upper_bound",
      "extra_overhead_tokens",
      "counter_witness",
    ]);
    const witness = v.counter_witness;
    need(
      v.output_reservation === seat.output_reservations[index] &&
        hash(v.request_json_sha256) &&
        integer(v.input_tokens_upper_bound) &&
        integer(v.extra_overhead_tokens) &&
        integer(
          v.input_tokens_upper_bound +
            v.extra_overhead_tokens +
            v.output_reservation,
          1,
          seat.context_ceiling,
        ),
      "Invalid variant or context fit",
    );
    need(
      witness &&
        typeof witness === "object" &&
        !Array.isArray(witness) &&
        witness.request_json_sha256 === v.request_json_sha256 &&
        witness.model === original.counter_witness.model &&
        typeof witness.method === "string" &&
        witness.method.trim() &&
        typeof witness.evidence === "string" &&
        witness.evidence.trim() &&
        Array.isArray(witness.assumptions) &&
        witness.assumptions.every((s) => typeof s === "string") &&
        same(witness.counter_identity, policy.request_counter_identity),
      "Unbound request counter witness",
    );
  });
  for (const key of [
    "request_json_sha256",
    "input_tokens_upper_bound",
    "extra_overhead_tokens",
    "counter_witness",
  ])
    need(
      same(a[key], a.request_variants[0][key]),
      "Assessment first variant differs",
    );
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
    "controller",
    "derived",
  ]);
  need(
    intent.schema_version === "council-staged-attempt/v3" &&
      intent.attempt_id === packet.attempt_id &&
      label(intent.operation_id) &&
      intent.node_id === packet.node_id &&
      intent.owner_id === packet.owner_id &&
      same(intent.scope, policy.scope) &&
      same(intent.plan, policy.plan) &&
      intent.preparation_sha256 === preparation.marker.marker_sha256 &&
      intent.intent_sha256 === derivedDigest(intent, "intent_sha256"),
    "Intent identity or original preparation differs",
  );
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
  ]);
  const variant = a.request_variants.find(
    (v) => v.output_reservation === intent.seat.output_reservation,
  );
  need(
    variant &&
      intent.seat.seat_id === packet.seat_id &&
      intent.seat.member === packet.member &&
      intent.seat.provider === "openrouter" &&
      ["buffered", "sse"].includes(intent.seat.transport) &&
      intent.seat.declared_model === original.counter_witness.model &&
      intent.seat.recipe_sha256 === a.recipe_sha256 &&
      intent.seat.facilitator_sha256 === a.facilitator_sha256 &&
      intent.seat.context_ceiling === seat.context_ceiling &&
      intent.request_json_sha256 === variant.request_json_sha256,
    "Intent seat or selected request differs",
  );
  const bytes = {
    packet: encodeDerived(packet),
    assessment: encodeDerived(assessment),
    intent: encodeDerived(intent),
  };
  const hashes = Object.fromEntries(
    Object.entries(bytes).map(([key, value]) => [key, sha256Bytes(value)]),
  );
  need(
    same(intent.controller, {
      logical_root: `.council-controllers/${policy.plan.sha256}`,
      policy_sha256: controller.policy_sha256,
    }) &&
      same(intent.derived, {
        reading_policy_sha256: policy.policy_sha256,
        packet_sha256: hashes.packet,
        assessment_sha256: hashes.assessment,
      }) &&
      same(intent.inputs, {
        source_manifest: {
          path: `${root}/assessment.json`,
          sha256: hashes.assessment,
        },
        system_prompt_sha256: a.system_prompt_sha256,
        user_prompt_sha256: a.user_prompt_sha256,
      }),
    "Intent source, prompt or controller binding differs",
  );
  exact(intent.limits, [
    "max_client_dispatches",
    "per_attempt_timeout_ms",
    "total_timeout_ms",
  ]);
  need(
    intent.limits.max_client_dispatches === 1 &&
      integer(intent.limits.per_attempt_timeout_ms, 1, 2147478647) &&
      integer(
        intent.limits.total_timeout_ms,
        intent.limits.per_attempt_timeout_ms,
        2147478647,
      ),
    "Invalid finite attempt timeouts",
  );
  need(
    Object.values(bytes).reduce((total, value) => total + value.length, 0) <=
      policy.limits.max_package_bytes,
    "Complete package exceeds encoded byte limit",
  );
  return {
    packet,
    assessment: freezeDerived(assessment),
    intent: freezeDerived(intent),
    bytes,
    hashes,
  };
}

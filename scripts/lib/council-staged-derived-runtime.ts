/**
 * Purpose: Recount original-controller derived requests before accounting or dispatch.
 * Usage: prepareDerivedAttempt / inspectDerivedHistory / recoverDerivedAttemptPublication.
 * Request integrity is not semantic reading acceptance; Gate 4 owns that join.
 */
import { lstat, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalJson, sha256Bytes } from "./council-staged-sources.mjs";
import { readVerifiedPreparation } from "./council-staged-store.mjs";
import { createFilePinCheck } from "./council-staged-pins.mjs";
import {
  cloneDerived,
  freezeDerived,
  encodeDerived,
  derivedDigest,
  validateDerivedPolicy,
  validateDerivedPackage,
  validateDerivedPacket,
  createDerivedCandidate,
  renderDerivedPrompt,
  validateReadingCandidate,
} from "./council-staged-derived-contract.mjs";
import {
  verifyDerivedReadingStore,
  readDerivedRequestPackages,
  publishDerivedRequestPackage,
  publishReadingCandidate,
} from "./council-staged-derived-store.mjs";
import {
  verifyController,
  readController,
  reserveAttempt,
  claimControllerDispatch,
  commitReadingAcceptance,
} from "./council-staged-controller-store.mjs";
import {
  createAttemptIntent,
  verifyAttemptIntent,
  inspectAttemptRecovery,
  fingerprintAttemptArtifacts,
  claimDispatch,
  writeAttemptArtifactExclusive,
  captureAttempt,
} from "./council-staged-attempt-store.mjs";
import {
  createCanonicalRequestAssessor,
  describeStagedSeat,
  type RequestCounter,
  type StagedSeatConfig,
} from "./council-staged-request.ts";
import { verifyTrustedCounter } from "./council-staged-invocation.ts";
import {
  evaluateSpend,
  verifyTrustedSpendEvaluator,
  decideNextControlledAttempt,
  type SpendEvaluator,
} from "./council-staged-controller.ts";

import {
  loadTrustedNoteCounter,
  verifyTrustedNoteCounter,
} from "./council-staged-note-counter.mjs";
import {
  verifyReadingHistory,
  verifyReadingPacket,
  packetForReading,
  reconstructReading,
  readingAcceptancePayload,
} from "./council-staged-derived-readings.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const same = (a: any, b: any) => canonicalJson(a) === canonicalJson(b);
const publicBoundary = { reading_accepted: false, reading_proof_complete: false };
function need(value: any, message: string): asserts value {
  if (!value)
    throw Object.assign(new Error(`derived_request_refused: ${message}`), {
      code: "derived_request_refused",
    });
}
function exact(value: any, keys: string[], optional: string[] = []) {
  need(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      keys.every((k) => Object.hasOwn(value, k)) &&
      Object.keys(value).every((k) => keys.includes(k) || optional.includes(k)),
    "unexpected fields"
  );
}
export interface DerivedRuntimeConfig {
  controlled_root: string;
  expected_plan_sha256: string;
  expected_scope: Record<string, unknown>;
  expected_policy_sha256: string;
  expected_controller_policy_sha256: string;
  expected_head?: { sequence: number; event_sha256: string | null };
  seats: StagedSeatConfig[];
  note_counter?: { module_path: string; artifact_sha256: string; dependencies?: any[] };
}
function configSnapshot(supplied: DerivedRuntimeConfig): DerivedRuntimeConfig {
  const config = cloneDerived(supplied, 1_048_576);
  exact(
    config,
    [
      "controlled_root",
      "expected_plan_sha256",
      "expected_scope",
      "expected_policy_sha256",
      "expected_controller_policy_sha256",
      "seats",
    ],
    ["expected_head", "note_counter"]
  );
  need(config.controlled_root === ROOT, "controlled root must be the installed Facilitator");
  need(
    Array.isArray(config.seats) && config.seats.length > 0 && config.seats.length <= 256,
    "independent original seat configurations required"
  );
  for (const seat of config.seats) {
    exact(
      seat,
      ["seat_id", "member", "provider", "transport", "context_ceiling", "output_reservations"],
      ["recipe_sha256"]
    );
    need(
      seat.provider === "openrouter" && ["buffered", "sse"].includes(seat.transport),
      "derived transport must be explicitly selected"
    );
  }
  need(
    new Set(config.seats.map((s: any) => s.seat_id)).size === config.seats.length,
    "duplicate seat"
  );
  if (config.note_counter !== undefined) {
    exact(config.note_counter, ["module_path", "artifact_sha256"], ["dependencies"]);
    need(
      typeof config.note_counter.module_path === "string" &&
        config.note_counter.module_path === resolve(config.note_counter.module_path) &&
        /^[a-f0-9]{64}$/.test(config.note_counter.artifact_sha256),
      "independent note-counter file binding required"
    );
  }
  return freezeDerived(config);
}
function storeArgs(config: DerivedRuntimeConfig) {
  return {
    controlledRoot: config.controlled_root,
    expectedPlanSha256: config.expected_plan_sha256,
    expectedScope: config.expected_scope,
    expectedPolicySha256: config.expected_policy_sha256,
    expectedControllerPolicySha256: config.expected_controller_policy_sha256,
    ...(config.expected_head ? { expectedHead: config.expected_head } : {}),
  };
}
function controllerConfig(config: DerivedRuntimeConfig) {
  return {
    controlled_root: config.controlled_root,
    expected_plan_sha256: config.expected_plan_sha256,
    expected_scope: config.expected_scope,
    expected_policy_sha256: config.expected_controller_policy_sha256,
    ...(config.expected_head ? { expected_head: config.expected_head } : {}),
  };
}
function attemptArgs(config: DerivedRuntimeConfig, attempt: any) {
  return {
    controlledRoot: config.controlled_root,
    attemptRoot: `.council-attempts/${attempt.attempt_id}`,
    expectedIntentSha256: attempt.intent_sha256,
    expectedPlanSha256: config.expected_plan_sha256,
    expectedScope: config.expected_scope,
    expectedOwnerId: attempt.owner_id,
    expectedNodeId: attempt.node_id,
  };
}
function head(history: any) {
  return { sequence: history.state.sequence, event_sha256: history.state.head_sha256 };
}
function budget(variant: any) {
  return {
    input_tokens_upper_bound: variant.input_tokens_upper_bound,
    extra_overhead_tokens: variant.extra_overhead_tokens,
  };
}
function packageIndex(inventory: any) {
  return inventory.packages
    .map((p: any) => ({ id: p.intent.attempt_id, hashes: p.hashes }))
    .sort((a: any, b: any) => a.id.localeCompare(b.id));
}

// These are installed implementation dependencies, not filenames supplied by a request.
const RUNTIME_FILES = [
  "scripts/council-invoke.ts",
  "scripts/council-stage-sources.mjs",
  ...[
    "sources.mjs",
    "store.mjs",
    "request.ts",
    "invocation.ts",
    "controller.ts",
    "controller-store.mjs",
    "attempt-store.mjs",
    "derived-contract.mjs",
    "derived-store.mjs",
    "derived-runtime.ts",
    "derived-readings.ts",
    "readings.ts",
    "reading-store.mjs",
    "notes.mjs",
    "note-counter.mjs",
    "rereads.mjs",
    "pins.mjs",
  ].map((name) => `scripts/lib/council-staged-${name}`),
];
async function pinRuntime() {
  const records = [];
  for (const file of RUNTIME_FILES) {
    const path = resolve(ROOT, file),
      bytes = await readFile(path);
    records.push({ path, sha256: sha256Bytes(bytes), byte_length: bytes.length });
  }
  const [entry, ...dependencies] = records;
  return createFilePinCheck({ entryPath: entry.path, expectedSha256: entry.sha256, dependencies });
}

async function context(config: DerivedRuntimeConfig, prior?: any) {
  const args = storeArgs(config);
  const store = prior?.store ?? (await verifyDerivedReadingStore(args));
  const policy = store.policy;
  const prep = await readVerifiedPreparation({
    controlledRoot: config.controlled_root,
    logicalRoot: policy.plan.logical_root,
    expectedPlanSha256: config.expected_plan_sha256,
    expectedScope: config.expected_scope,
  });
  const inventory = await readDerivedRequestPackages({ handle: store });
  const controller =
    prior?.controller ??
    (await verifyController({
      ...args,
      expectedPolicySha256: config.expected_controller_policy_sha256,
    }));
  const history = await readController({ handle: controller });
  const { nodes } = validateDerivedPolicy({
    policy,
    preparation: prep,
    controller: history.policy,
  });
  const packages = new Map(inventory.packages.map((p: any) => [p.intent.attempt_id, p]));
  need(
    config.seats.length === prep.plan.seats.length,
    "every original seat must be independently supplied"
  );
  const descriptions = new Map();
  for (const seat of config.seats) {
    const description = await describeStagedSeat(seat);
    const { descriptor, ...frozenSeat } = description;
    need(
      same(
        frozenSeat,
        prep.plan.seats.find((s: any) => s.seat_id === seat.seat_id)
      ) &&
        policy.members.some((m: any) => m.seat_id === seat.seat_id && m.member === seat.member) &&
        descriptor.substrate === "openrouter",
      "original recipe, seat or transport changed"
    );
    descriptions.set(seat.seat_id, description);
  }
  return {
    config,
    store,
    policy,
    prep,
    inventory,
    packages,
    controller,
    history,
    nodes,
    descriptions,
  };
}

async function assessPacket(ctx: any, packet: any, counter: RequestCounter) {
  need(
    same(counter.identity, ctx.policy.request_counter_identity),
    "request counter identity differs from frozen policy"
  );
  await verifyTrustedCounter(counter);
  const candidate = createDerivedCandidate({ packet, policy: ctx.policy, preparation: ctx.prep });
  const seat = ctx.config.seats.find((s: any) => s.seat_id === packet.seat_id);
  const assessor = await createCanonicalRequestAssessor({
    seats: [seat],
    userPrompt: renderDerivedPrompt({ questionContract: ctx.policy.question_contract }),
    counter,
  });
  need(
    same(
      assessor.seats[0],
      ctx.prep.plan.seats.find((s: any) => s.seat_id === seat.seat_id)
    ),
    "frozen seat changed"
  );
  const [result] = await assessor.assessRequest(candidate);
  const assessment = freezeDerived(
    cloneDerived(
      {
        schema_version: "council-staged-derived-assessment/v1",
        sources: candidate.source_manifest.sources,
        request_counter_identity: ctx.policy.request_counter_identity,
        assessment: result,
      },
      ctx.policy.limits.max_package_bytes
    )
  );
  await verifyTrustedCounter(counter);
  return { candidate, assessment };
}
async function recount(ctx: any, stored: any, counter: RequestCounter) {
  validateDerivedPackage({
    ...stored,
    policy: ctx.policy,
    preparation: ctx.prep,
    controller: ctx.history.policy,
  });
  const counted = await assessPacket(ctx, stored.packet, counter);
  need(
    same(counted.assessment, stored.assessment),
    "fresh complete assessment or witness differs from stored request"
  );
  const variant = counted.assessment.assessment.request_variants.find(
    (v: any) => v.output_reservation === stored.intent.seat.output_reservation
  );
  need(variant, "selected output variant is absent");
  return { ...counted, intent: stored.intent, variant };
}

async function actualAttempt(config: DerivedRuntimeConfig, a: any) {
  const args = attemptArgs(config, a);
  try {
    const recovery = await inspectAttemptRecovery(args);
    const fingerprint = await fingerprintAttemptArtifacts(args);
    return { recovery, fingerprint };
  } catch (error: any) {
    if (error.code !== "ENOENT") throw error;
    try {
      await lstat(resolve(config.controlled_root, args.attemptRoot));
    } catch (missing: any) {
      if (missing.code === "ENOENT")
        return {
          recovery: { state: "not_dispatched", reason: "absent_directory" },
          fingerprint: null,
        };
      throw missing;
    }
    need(false, "present attempt has missing evidence; recovery cannot repair it");
  }
}
function verifyAccounting(ctx: any, reservation: any, actual: any, assessed: any) {
  const { attempt: a, spend_witness: spend } = reservation.payload;
  need(
    same(reservation.payload.budget, budget(assessed.variant)) &&
      a.request_json_sha256 === assessed.variant.request_json_sha256 &&
      a.context_ceiling === assessed.contextCeiling &&
      spend.request_json_sha256 === a.request_json_sha256 &&
      spend.model === assessed.model &&
      spend.route === assessed.recipe,
    "historical reservation or spend differs from reconstructed request"
  );
  const reconciliation = ctx.history.state.reconciliations[a.attempt_id];
  const dispatch = ctx.history.state.dispatches[a.attempt_id];
  const recovery = actual.recovery;
  if (recovery.intent)
    need(
      recovery.intent.intent_sha256 === a.intent_sha256 &&
        recovery.intent.request_json_sha256 === a.request_json_sha256 &&
        recovery.intent.controller?.policy_sha256 === ctx.history.policy.policy_sha256,
      "historical attempt differs from reservation"
    );
  if (recovery.dispatch) need(dispatch, "attempt dispatch lacks original controller authority");
  need(
    recovery.state !== "invalid_evidence",
    "historical attempt contains invalid capture evidence"
  );
  const evidence = reconciliation?.payload.evidence;
  if (recovery.state !== "captured") {
    if (!reconciliation) return;
    need(
      ["not_dispatched", "incomplete"].includes(recovery.state),
      "terminal history lacks authentic capture or conservative recovery"
    );
    const state =
      recovery.state === "not_dispatched" && !dispatch ? "not_dispatched" : "incomplete";
    need(
      evidence.state === state &&
        evidence.classification === (state === "not_dispatched" ? "not_dispatched" : "ambiguous") &&
        evidence.capture_sha256 === null &&
        evidence.receipt_sha256 === null &&
        same(evidence.measured, { input_tokens: null, output_tokens: null, spend_units: null }),
      "terminal recovery or unknown accounting changed"
    );
    return;
  }
  const { receipt, capture } = recovery;
  need(
    dispatch &&
      receipt.staged_controller?.reservation_sha256 === reservation.event_sha256 &&
      receipt.staged_controller?.dispatch_sha256 === dispatch.event_sha256,
    "capture controller binding differs"
  );
  const tokens = receipt.attempts[0].tokens;
  const measured = { input_tokens: null, output_tokens: null, spend_units: null } as any;
  if (tokens !== null) {
    need(
      [tokens.prompt, tokens.completion, tokens.total].every(
        (n) => Number.isSafeInteger(n) && n >= 0
      ) &&
        tokens.prompt <=
          assessed.variant.input_tokens_upper_bound + assessed.variant.extra_overhead_tokens &&
        tokens.completion <= a.output_reservation,
      "authentic measured usage exceeds reservation"
    );
    measured.input_tokens = tokens.prompt;
    measured.output_tokens = tokens.completion;
  }
  if (!reconciliation) return;
  need(
    evidence.state === "captured" &&
      evidence.capture_sha256 === capture.capture_sha256 &&
      evidence.receipt_sha256 === capture.provenance.sha256 &&
      same(evidence.measured, measured),
    "historical accounting differs from authentic capture"
  );
}

async function begin(
  config: DerivedRuntimeConfig,
  counter: RequestCounter,
  selectedAttemptId?: string,
  semantics = false
) {
  await verifyTrustedCounter(counter);
  const verifyRuntime = await pinRuntime();
  const ctx = await context(config);
  need(
    same(counter.identity, ctx.policy.request_counter_identity),
    "request counter identity differs from policy"
  );
  const counted = new Map(),
    artifacts = new Map();
  for (const event of ctx.history.events) {
    if (event.type !== "reservation") continue;
    const a = event.payload.attempt,
      node = ctx.nodes.get(a.node_id);
    need(node, "reservation node is outside reading policy");
    let checked: any;
    if (node.parent_node_ids) {
      const stored = ctx.packages.get(a.attempt_id);
      need(stored, "reserved derived package is unavailable");
      checked = await recount(ctx, stored, counter);
      counted.set(a.attempt_id, checked);
      checked = {
        variant: checked.variant,
        model: checked.intent.seat.declared_model,
        recipe: checked.intent.seat.recipe_sha256,
        contextCeiling: checked.intent.seat.context_ceiling,
      };
    } else {
      const chunk = ctx.prep.plan.chunks.find((c: any) => c.id === node.chunk_id);
      const assessment = chunk.assessments.find((s: any) => s.seat_id === a.seat_id);
      const variant = assessment.request_variants.find(
        (v: any) => v.output_reservation === a.output_reservation
      );
      need(variant, "initial reservation output is outside original variants");
      checked = {
        variant,
        model: variant.counter_witness.model,
        recipe: assessment.recipe_sha256,
        contextCeiling: ctx.prep.plan.seats.find((s: any) => s.seat_id === a.seat_id)
          .context_ceiling,
      };
    }
    const actual = await actualAttempt(config, a);
    verifyAccounting(ctx, event, actual, checked);
    artifacts.set(a.attempt_id, actual);
  }
  if (selectedAttemptId && !counted.has(selectedAttemptId)) {
    const stored = ctx.packages.get(selectedAttemptId);
    need(stored, "selected complete package is unavailable");
    counted.set(selectedAttemptId, await recount(ctx, stored, counter));
  }
  const verification: any = { ctx, counter, counted, artifacts, verifyRuntime };
  if (semantics) {
    need(config.note_counter, "derived execution requires an independent note-counter binding");
    verification.noteCounter = await loadTrustedNoteCounter({
      modulePath: config.note_counter.module_path,
      expectedSha256: config.note_counter.artifact_sha256,
      dependencies: config.note_counter.dependencies ?? [],
    });
    verification.semantic = await verifyReadingHistory(verification);
  }
  return verification;
}
async function finish(verification: any, evaluator?: SpendEvaluator) {
  const { ctx, counter, artifacts, verifyRuntime } = verification;
  // These functions perform fixed filesystem/descriptor reads, never counter or spend calls.
  await verifyTrustedCounter(counter);
  if (verification.noteCounter) await verifyTrustedNoteCounter(verification.noteCounter);
  if (evaluator) await verifyTrustedSpendEvaluator(evaluator);
  await verifyRuntime();
  const fresh = await context(ctx.config, ctx);
  need(same(head(ctx.history), head(fresh.history)), "controller head changed during verification");
  need(
    same(ctx.prep.marker, fresh.prep.marker) &&
      same(ctx.policy, fresh.policy) &&
      same(packageIndex(ctx.inventory), packageIndex(fresh.inventory)) &&
      same(ctx.inventory.incomplete, fresh.inventory.incomplete) &&
      same(ctx.inventory.candidates, fresh.inventory.candidates),
    "request dependencies changed during verification"
  );
  for (const [id, prior] of artifacts) {
    const actual = await actualAttempt(
      ctx.config,
      ctx.history.state.reservations[id].payload.attempt
    );
    need(same(prior, actual), "attempt artifacts changed during verification");
  }
  await verifyRuntime();
  await verifyTrustedCounter(counter);
  if (verification.noteCounter) await verifyTrustedNoteCounter(verification.noteCounter);
  if (evaluator) await verifyTrustedSpendEvaluator(evaluator);
  const last = await readController({ handle: ctx.controller });
  need(
    same(head(ctx.history), head(last)),
    "controller head changed during final dependency check"
  );
  return head(last);
}

export async function inspectDerivedHistory({
  config: supplied,
  requestCounter,
}: {
  config: DerivedRuntimeConfig;
  requestCounter: RequestCounter;
}) {
  const config = configSnapshot(supplied);
  const checked = await begin(config, requestCounter);
  const currentHead = await finish(checked);
  return freezeDerived({
    ...publicBoundary,
    provider_dispatched: false,
    request_history_verified: true,
    head: currentHead,
    derived_requests_recounted: checked.counted.size,
    totals: cloneDerived(checked.ctx.history.state.totals),
    deadline_ms: checked.ctx.history.policy.clock.deadline_ms,
  });
}

function readingResult(checked: any) {
  const { ctx, semantic } = checked;
  const frontier = [...semantic.frontier].sort().map((id) => semantic.accepted.get(id));
  const outstanding = frontier.flatMap((r: any) => r.record.outstanding_requests);
  const complete =
    ctx.policy.members.every((m: any) =>
      m.leaves.every((n: any) => semantic.accepted.has(n.node_id))
    ) &&
    outstanding.length === 0 &&
    !ctx.history.state.stopped;
  return {
    reading_proof_complete: complete,
    provider_dispatched: false,
    head: head(ctx.history),
    accepted: [...semantic.accepted.values()],
    frontier: frontier.map((p: any) => p.record.node_id),
    outstanding_requests: outstanding,
    totals: ctx.history.state.totals,
    deadline_ms: ctx.history.policy.clock.deadline_ms,
  };
}

/** Full semantic reconstruction; the request-only inspector remains separately available. */
export async function inspectCommittedReadings({ config: supplied, requestCounter }: any) {
  const config = configSnapshot(supplied);
  const checked = await begin(config, requestCounter, undefined, true);
  await finish(checked);
  return freezeDerived(cloneDerived(readingResult(checked)));
}

/** Independent coordinator selection; never inferred from a proposed proof. */
export interface CompositionSelection {
  owner_id: string;
  member: string;
  seat_id: string;
  root_node_id: string;
}
const COMPOSITION_PROOF_BYTES = 4 * 1024 * 1024;
function compositionSelection(supplied: CompositionSelection): CompositionSelection {
  const selected = cloneDerived(supplied, 8192);
  exact(selected, ["owner_id", "member", "seat_id", "root_node_id"]);
  need(
    Object.values(selected).every(
      (value) => typeof value === "string" && value.length > 0 && value.length <= 1024
    ),
    "explicit composition member and root required"
  );
  return freezeDerived(selected);
}

/** Only called with the private, freshly reconstructed semantic context. */
function compositionProof(checked: any, selected: CompositionSelection) {
  const { ctx, semantic } = checked;
  const member = ctx.policy.members.find(
    (m: any) => m.owner_id === selected.owner_id &&
      m.member === selected.member && m.seat_id === selected.seat_id
  );
  need(member, "composition member differs from original policy");
  need(!ctx.history.state.stopped, "stopped controller cannot establish composition readiness");
  for (const event of Object.values(ctx.history.state.reservations) as any[]) {
    const attempt = event.payload.attempt;
    if (attempt.owner_id === member.owner_id)
      need(ctx.history.state.reconciliations[attempt.attempt_id],
        "composition member has an unreconciled attempt");
  }
  need(
    member.leaves.every((leaf: any) => semantic.accepted.has(leaf.node_id)),
    "composition member has unread required leaves"
  );
  const frontier = [...semantic.frontier].filter(
    (id) => semantic.accepted.get(id).record.owner_id === member.owner_id
  );
  need(frontier.length === 1 && frontier[0] === selected.root_node_id,
    "composition requires the member's sole current root");
  const root = semantic.accepted.get(selected.root_node_id);
  need(root.record.outstanding_requests.length === 0,
    "composition root has outstanding rereads");

  // The policy already bounds this acyclic graph to 256 same-member nodes.
  const reachable = new Set<string>(), pending = [selected.root_node_id];
  while (pending.length) {
    const id = pending.pop()!;
    if (reachable.has(id)) continue;
    const accepted = semantic.accepted.get(id);
    need(accepted && accepted.record.owner_id === member.owner_id &&
      accepted.record.member === member.member && accepted.record.seat_id === member.seat_id,
      "composition ancestry crosses member identity");
    reachable.add(id);
    pending.push(...accepted.record.parents.map((parent: any) => parent.node_id));
  }
  need(member.leaves.every((leaf: any) => reachable.has(leaf.node_id)),
    "composition root does not cover every required leaf");
  const ancestry = [...semantic.accepted.values()]
    .filter((accepted: any) => accepted.record.owner_id === member.owner_id);
  need(ancestry.every((accepted: any) => reachable.has(accepted.record.node_id)) &&
    reachable.size === ancestry.length, "composition root omits accepted ancestry");
  const proof: any = {
    schema_version: "council-staged-composition-proof/1",
    composition_readiness_verified: true,
    provider_dispatched: false,
    finalization_accepted: false,
    scope: ctx.policy.scope,
    plan_sha256: ctx.prep.plan.plan_sha256,
    policy_sha256: ctx.policy.policy_sha256,
    controller_policy_sha256: ctx.history.policy.policy_sha256,
    head: head(ctx.history),
    selection: selected,
    required_leaves: member.leaves,
    root: {
      node_id: root.record.node_id,
      accepted_sha256: root.record.accepted_sha256,
      event_sha256: root.event.event_sha256,
      note: { ...root.record.note, utf8: root.note_utf8 },
    },
    ancestry: ancestry.map(({ record, event }: any) => ({
      node_id: record.node_id,
      kind: record.kind,
      accepted_sha256: record.accepted_sha256,
      event_sha256: event.event_sha256,
      attempt: record.attempt,
      parents: record.parents,
      note: record.note,
    })),
  };
  proof.proof_sha256 = derivedDigest(proof, "proof_sha256");
  return freezeDerived(cloneDerived(proof, COMPOSITION_PROOF_BYTES));
}

type CompositionInput = {
  config: DerivedRuntimeConfig;
  requestCounter: RequestCounter;
  selection: CompositionSelection;
};

/** Coordinator-only snapshot. Does not reserve, dispatch, finalize or seal. */
export async function buildCompositionProof({
  config: supplied, requestCounter, selection,
}: CompositionInput) {
  const config = configSnapshot(supplied), selected = compositionSelection(selection);
  const checked = await begin(config, requestCounter, undefined, true);
  const proof = compositionProof(checked, selected);
  await finish(checked);
  return proof;
}

/** Regenerate from original stores; caller hashes or verified flags are not authority. */
export async function verifyCompositionProof({
  config: supplied, requestCounter, selection, proof: suppliedProof,
}: CompositionInput & { proof: unknown }) {
  const config = configSnapshot(supplied), selected = compositionSelection(selection);
  const proposed = cloneDerived(suppliedProof, COMPOSITION_PROOF_BYTES);
  const checked = await begin(config, requestCounter, undefined, true);
  const proof = compositionProof(checked, selected);
  need(same(proposed, proof), "composition proof differs from current committed history");
  await finish(checked);
  return proof;
}

/** Construct exact next input from authenticated committed parents and original bytes. */
export async function buildReadingPacket({
  config: supplied,
  requestCounter,
  nodeId,
  attemptId,
}: any) {
  const config = configSnapshot(supplied);
  need(
    typeof nodeId === "string" && typeof attemptId === "string",
    "node and attempt IDs required"
  );
  const checked = await begin(config, requestCounter, undefined, true);
  const packet = packetForReading(checked.ctx, checked.semantic, nodeId, attemptId);
  await finish(checked);
  return packet;
}

/** Initial and successor notes share this one original-journal commit operation. */
export async function acceptCommittedReading({
  config: supplied,
  requestCounter,
  nodeId,
  attemptId,
}: any) {
  const config = configSnapshot(supplied);
  need(
    typeof nodeId === "string" && typeof attemptId === "string",
    "node and attempt IDs required"
  );
  const checked = await begin(config, requestCounter, undefined, true),
    ctx = checked.ctx;
  const old = checked.semantic.accepted.get(nodeId);
  if (old) {
    need(
      old.record.attempt.attempt_id === attemptId,
      "A different attempt already won reading acceptance"
    );
    await finish(checked);
    return freezeDerived({
      reading_accepted: true,
      provider_dispatched: false,
      reading_proof_complete: readingResult(checked).reading_proof_complete,
      ...cloneDerived(old),
    });
  }
  const reading = await reconstructReading(checked, checked.semantic, nodeId, attemptId);
  const body = {
    schema_version: "council-staged-reading-candidate/v1",
    prior_head: head(ctx.history),
    ...reading,
  };
  const bundle = { ...body, bundle_sha256: derivedDigest(body, "bundle_sha256") };
  validateReadingCandidate({ bundle, policy: ctx.policy });
  const published = await publishReadingCandidate({ handle: ctx.store, bundle });
  ctx.inventory = {
    ...ctx.inventory,
    candidates: [
      ...ctx.inventory.candidates.filter((b: any) => b.bundle_sha256 !== published.bundle_sha256),
      published,
    ].sort((a: any, b: any) => a.bundle_sha256.localeCompare(b.bundle_sha256)),
  };
  const expectedCurrentHead = await finish(checked);
  const event = await commitReadingAcceptance({
    handle: ctx.controller,
    acceptance: readingAcceptancePayload(ctx, published),
    expectedCurrentHead,
    nowMs: Date.now(),
  });
  // The journal is the linearization point. Verify that exact pair after publication;
  // a later writer may extend the journal, but cannot replace this committed event.
  const after = await readController({ handle: ctx.controller });
  const inventory = await readDerivedRequestPackages({ handle: ctx.store });
  need(
    same(after.state.acceptances[nodeId], event) &&
      inventory.candidates.some((b: any) => same(b, published)),
    "Committed event/bundle pair changed"
  );
  await verifyTrustedNoteCounter(checked.noteCounter);
  await verifyTrustedCounter(requestCounter);
  await checked.verifyRuntime();
  return freezeDerived({
    reading_accepted: true,
    reading_proof_complete: false,
    provider_dispatched: false,
    ...reading,
    event,
  });
}

function invokerConfig(config: DerivedRuntimeConfig, intent: any) {
  return freezeDerived({
    controlled_root: config.controlled_root,
    attempt_root: `.council-attempts/${intent.attempt_id}`,
    expected_intent_sha256: intent.intent_sha256,
    expected_plan_sha256: config.expected_plan_sha256,
    expected_scope: config.expected_scope,
    expected_owner_id: intent.owner_id,
    expected_node_id: intent.node_id,
    preparation_logical_root: intent.plan.logical_root,
    seat: config.seats.find((s) => s.seat_id === intent.seat.seat_id),
    controller: {
      logical_root: intent.controller.logical_root,
      expected_policy_sha256: config.expected_controller_policy_sha256,
      ...(config.expected_head ? { expected_head: config.expected_head } : {}),
    },
    derived: {
      expected_policy_sha256: config.expected_policy_sha256,
      seats: config.seats,
      ...(config.note_counter ? { note_counter: config.note_counter } : {}),
    },
  });
}
function published(config: DerivedRuntimeConfig, intent: any, handle: any, reservation: any) {
  return freezeDerived({
    ...publicBoundary,
    provider_dispatched: false,
    intent,
    invoker_config: invokerConfig(config, intent),
    reservation,
    output_path: handle.outputPath,
    provenance_path: handle.provenancePath,
    source_manifest_path: resolve(config.controlled_root, intent.inputs.source_manifest.path),
  });
}

export async function prepareDerivedAttempt({
  config: supplied,
  packet: inputPacket,
  operationId,
  outputReservation,
  limits: inputLimits,
  requestCounter,
  evaluator,
  previousAttemptId,
  explicitAmbiguousReplay = false,
}: any) {
  const config = configSnapshot(supplied),
    packet = cloneDerived(inputPacket),
    limits = cloneDerived(inputLimits);
  need(typeof operationId === "string", "operation ID required");
  await verifyTrustedSpendEvaluator(evaluator);
  const next = await decideNextControlledAttempt({
    config: controllerConfig(config),
    nodeId: packet.node_id,
    previousAttemptId,
    explicitAmbiguousReplay,
  });
  need(
    next.state === "ready" && next.output_reservation === outputReservation,
    "output is not the original controller's next authorized reservation"
  );
  const verification = await begin(config, requestCounter, undefined, true),
    ctx = verification.ctx;
  validateDerivedPacket({ packet, policy: ctx.policy, preparation: ctx.prep });
  verifyReadingPacket(ctx, verification.semantic, packet);
  const { candidate, assessment } = await assessPacket(ctx, packet, requestCounter);
  const variant = assessment.assessment.request_variants.find(
    (v: any) => v.output_reservation === outputReservation
  );
  need(variant, "output variant missing");
  const description = ctx.descriptions.get(packet.seat_id).descriptor;
  const assessmentHash = sha256Bytes(encodeDerived(assessment));
  const body = {
    schema_version: "council-staged-attempt/v3",
    attempt_id: packet.attempt_id,
    operation_id: operationId,
    node_id: packet.node_id,
    owner_id: packet.owner_id,
    scope: ctx.policy.scope,
    plan: ctx.policy.plan,
    preparation_sha256: ctx.prep.marker.marker_sha256,
    seat: {
      seat_id: packet.seat_id,
      member: packet.member,
      provider: "openrouter",
      transport: description.transport,
      declared_model: description.declared_model,
      recipe_sha256: assessment.assessment.recipe_sha256,
      facilitator_sha256: assessment.assessment.facilitator_sha256,
      context_ceiling: ctx.config.seats.find((s) => s.seat_id === packet.seat_id)!.context_ceiling,
      output_reservation: outputReservation,
    },
    inputs: {
      source_manifest: { path: candidate.source_manifest_path, sha256: assessmentHash },
      system_prompt_sha256: assessment.assessment.system_prompt_sha256,
      user_prompt_sha256: assessment.assessment.user_prompt_sha256,
    },
    request_json_sha256: variant.request_json_sha256,
    limits,
    controller: {
      logical_root: ctx.controller.logicalRoot,
      policy_sha256: ctx.history.policy.policy_sha256,
    },
    derived: {
      reading_policy_sha256: ctx.policy.policy_sha256,
      packet_sha256: candidate.files[0].sha256,
      assessment_sha256: assessmentHash,
    },
  };
  const intent = freezeDerived({ ...body, intent_sha256: derivedDigest(body, "intent_sha256") });
  const stored = await publishDerivedRequestPackage({
    handle: ctx.store,
    packet,
    assessment,
    intent,
  });
  // Only our fully validated publication is an allowed inventory delta.
  ctx.inventory = {
    ...ctx.inventory,
    packages: [
      ...ctx.inventory.packages.filter((p: any) => p.intent.attempt_id !== intent.attempt_id),
      stored,
    ],
  };
  const spendWitness = await evaluateSpend(ctx.history.policy, intent, budget(variant), evaluator);
  const expectedCurrentHead = await finish(verification, evaluator);
  const reservation = await reserveAttempt({
    handle: ctx.controller,
    intent,
    verifiedBudget: budget(variant),
    spendWitness,
    predecessor: next.predecessor,
    expectedCurrentHead,
    nowMs: Date.now(),
  });
  const attempt = await createAttemptIntent({ ...attemptArgs(config, intent), intent });
  return published(config, intent, attempt, reservation);
}

export async function recoverDerivedAttemptPublication({
  config: supplied,
  attemptId,
  requestCounter,
}: any) {
  const config = configSnapshot(supplied);
  need(typeof attemptId === "string", "attempt ID required");
  const checked = await begin(config, requestCounter, attemptId, true),
    ctx = checked.ctx;
  const reservation = ctx.history.state.reservations[attemptId];
  need(
    reservation &&
      !ctx.history.state.dispatches[attemptId] &&
      !ctx.history.state.reconciliations[attemptId],
    "publication recovery requires an undispatched, unreconciled original reservation"
  );
  const intent = checked.counted.get(attemptId).intent;
  const original = checked.artifacts.get(attemptId);
  need(
    original?.recovery.state === "not_dispatched",
    "attempt already has dispatch or incomplete execution"
  );
  await finish(checked);
  let handle;
  if (original.fingerprint !== null)
    handle = await verifyAttemptIntent(attemptArgs(config, intent));
  else {
    try {
      handle = await createAttemptIntent({ ...attemptArgs(config, intent), intent });
    } catch (error: any) {
      if (error.code !== "attempt_conflict") throw error;
      handle = await verifyAttemptIntent(attemptArgs(config, intent));
    }
  }
  const latest = await readController({ handle: ctx.controller });
  need(
    same(head(ctx.history), head(latest)),
    "controller changed during publication recovery; inspect retained evidence"
  );
  need(
    (await inspectAttemptRecovery(attemptArgs(config, intent))).state === "not_dispatched",
    "a concurrent dispatcher claimed the recovered attempt"
  );
  return published(config, intent, handle, reservation);
}

const invocations = new WeakMap<object, any>();
export async function verifyDerivedInvocation(input: any) {
  const counter = input.counter;
  const supplied = cloneDerived(input.config);
  exact(supplied, [
    "controlled_root",
    "attempt_root",
    "expected_intent_sha256",
    "expected_plan_sha256",
    "expected_scope",
    "expected_owner_id",
    "expected_node_id",
    "preparation_logical_root",
    "seat",
    "controller",
    "derived",
  ]);
  exact(supplied.derived, ["expected_policy_sha256", "seats", "note_counter"]);
  exact(supplied.controller, ["logical_root", "expected_policy_sha256"], ["expected_head"]);
  const config = configSnapshot({
    controlled_root: supplied.controlled_root,
    expected_plan_sha256: supplied.expected_plan_sha256,
    expected_scope: supplied.expected_scope,
    expected_policy_sha256: supplied.derived.expected_policy_sha256,
    expected_controller_policy_sha256: supplied.controller.expected_policy_sha256,
    seats: supplied.derived.seats,
    note_counter: supplied.derived.note_counter,
    ...(supplied.controller.expected_head
      ? { expected_head: supplied.controller.expected_head }
      : {}),
  });
  const data = cloneDerived({
    userPrompt: input.userPrompt,
    systemPrompt: input.systemPrompt,
    actualUserPrompt: input.actualUserPrompt,
    actualSourceManifest: input.actualSourceManifest,
    sourceManifestPath: input.sourceManifestPath,
    requestJson: input.requestJson,
    invocation: input.invocation,
  });
  const id = supplied.attempt_root.split("/").at(-1);
  const checked = await begin(config, counter, id, true),
    ctx = checked.ctx;
  const current = checked.counted.get(id),
    intent = current.intent;
  verifyReadingPacket(ctx, checked.semantic, ctx.packages.get(id).packet);
  need(same(supplied, invokerConfig(config, intent)), "independent invocation bindings differ");
  const handle = await verifyAttemptIntent(attemptArgs(config, intent));
  need(ctx.history.state.reservations[id], "derived invocation lacks an original reservation");
  const call = data.invocation;
  need(
    data.userPrompt === renderDerivedPrompt({ questionContract: ctx.policy.question_contract }) &&
      data.systemPrompt === null &&
      sha256Bytes(data.actualUserPrompt) === intent.inputs.user_prompt_sha256 &&
      sha256Bytes(data.requestJson) === intent.request_json_sha256 &&
      same(data.actualSourceManifest, ctx.packages.get(id).assessment) &&
      typeof data.sourceManifestPath === "string" &&
      resolve(data.sourceManifestPath) === resolve(ROOT, intent.inputs.source_manifest.path) &&
      call.member === intent.seat.member &&
      call.provider === intent.seat.provider &&
      call.transport === intent.seat.transport &&
      call.maxTokens === intent.seat.output_reservation &&
      call.maxRetries === 0 &&
      call.perAttemptTimeoutMs === intent.limits.per_attempt_timeout_ms &&
      call.totalTimeoutMs === intent.limits.total_timeout_ms &&
      call.outputPath === handle.outputPath &&
      call.provenancePath === handle.provenancePath,
    "actual canonical invocation differs from counted derived request"
  );
  await finish(checked);
  const staged = Object.freeze({
    handle,
    intent,
    requestJson: data.requestJson,
    budget: current.variant,
    store: Object.freeze({ claimDispatch, writeAttemptArtifactExclusive, captureAttempt }),
    binding: freezeDerived({
      intent_sha256: intent.intent_sha256,
      attempt_id: intent.attempt_id,
      operation_id: intent.operation_id,
      node_id: intent.node_id,
      owner_id: intent.owner_id,
      seat_id: intent.seat.seat_id,
      plan_sha256: intent.plan.sha256,
      preparation_sha256: intent.preparation_sha256,
      scope: intent.scope,
      request_json_sha256: intent.request_json_sha256,
      controller: intent.controller,
    }),
  });
  invocations.set(staged, { config, counter, id, intent });
  return staged;
}

export async function createDerivedDispatchGuard({
  staged,
  evaluator,
}: {
  staged: any;
  evaluator: SpendEvaluator;
}) {
  const saved = invocations.get(staged);
  need(saved, "authentic invocation-local derived verification required");
  await verifyTrustedSpendEvaluator(evaluator);
  let reservation: any,
    dispatch: any,
    policy: any,
    lastObserved = Date.now();
  function remaining() {
    const now = Date.now();
    need(now >= lastObserved, "clock regressed across dispatch");
    lastObserved = now;
    need(
      reservation &&
        now < reservation.payload.spend_witness.valid_until_ms &&
        now < policy.clock.deadline_ms,
      "reserved spend or original deadline expired"
    );
    return policy.clock.deadline_ms - now;
  }
  return Object.freeze({
    async claim() {
      const checked = await begin(saved.config, saved.counter, saved.id, true),
        ctx = checked.ctx;
      const current = checked.counted.get(saved.id);
      verifyReadingPacket(ctx, checked.semantic, ctx.packages.get(saved.id).packet);
      need(same(current.intent, saved.intent), "derived request changed before dispatch");
      const witness = await evaluateSpend(
        ctx.history.policy,
        current.intent,
        budget(current.variant),
        evaluator
      );
      reservation = ctx.history.state.reservations[saved.id];
      policy = ctx.history.policy;
      need(
        reservation && same(reservation.payload.spend_witness, witness),
        "fresh spend differs from original reservation"
      );
      const expectedCurrentHead = await finish(checked, evaluator);
      remaining();
      dispatch = await claimControllerDispatch({
        handle: ctx.controller,
        attemptId: saved.id,
        intentSha256: saved.intent.intent_sha256,
        requestJsonSha256: saved.intent.request_json_sha256,
        expectedCurrentHead,
        nowMs: Date.now(),
      });
      return remaining();
    },
    remaining,
    receiptBinding() {
      need(dispatch && reservation, "controller dispatch authority missing");
      return {
        logical_root: saved.intent.controller.logical_root,
        policy_sha256: policy.policy_sha256,
        reservation_sha256: reservation.event_sha256,
        dispatch_sha256: dispatch.event_sha256,
      };
    },
  });
}

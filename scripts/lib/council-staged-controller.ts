/**
 * Purpose: Account one frozen plan and admit only independently verified attempts.
 * Usage: createControlledPlan / prepareControlledAttempt / reconcileControlledAttempt.
 * Provider calls remain exclusively in the canonical Facilitator. No reading is accepted here.
 */
import { lstat, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { canonicalJson, sha256Bytes } from "./council-staged-sources.mjs";
import {
  createController,
  verifyController,
  readController,
  reserveAttempt,
  verifyReservation,
  claimControllerDispatch,
  reconcileAttempt,
} from "./council-staged-controller-store.mjs";
import {
  buildCheckedStagedAttempt,
  publishCheckedStagedAttempt,
  recheckCheckedStagedAttempt,
  type StagedAttemptSpec,
  type StagedInvokerConfig,
} from "./council-staged-invocation.ts";
import { type RequestCounter } from "./council-staged-request.ts";
import {
  inspectAttemptRecovery,
  verifyAttemptIntent,
  captureAttempt,
  stagedRoutingContract,
  stagedRoutingProblem,
} from "./council-staged-attempt-store.mjs";
import {
  FACILITATOR_VERSION,
  classifyAttempt,
  retryDelayMs,
  runCouncilInvocation,
  selectRecipe,
} from "../council-invoke.ts";
import { readConfig } from "../council-stage-sources.mjs";
import { createFilePinCheck } from "./council-staged-pins.mjs";
import { cloneDerived } from "./council-staged-derived-contract.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const HASH = /^[a-f0-9]{64}$/;
const same = (a: unknown, b: unknown) => canonicalJson(a) === canonicalJson(b);
const freeze = <T>(value: T): T => {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
};
function fail(code: string, message: string): never {
  throw Object.assign(new Error(`${code}: ${message}`), { code });
}
function exact(value: any, keys: string[], optional: string[] = []) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    keys.some((k) => !Object.hasOwn(value, k)) ||
    Object.keys(value).some((k) => !keys.includes(k) && !optional.includes(k))
  )
    fail("controller_refused", "missing or unsupported fields");
}
function positive(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}
function safeSum(...values: number[]) {
  if (values.some((v) => !Number.isSafeInteger(v) || v < 0))
    fail("controller_refused", "unsafe accounting units");
  const total = values.reduce((a, b) => a + b, 0);
  if (!Number.isSafeInteger(total))
    fail("controller_refused", "accounting exceeds exact integer range");
  return total;
}

export interface ControllerConfig {
  controlled_root: string;
  expected_policy_sha256: string;
  expected_plan_sha256: string;
  expected_scope: Record<string, unknown>;
  expected_head?: { sequence: number; event_sha256: string | null };
}
export interface SpendEvaluator {
  identity: { id: string; revision: string; artifact_sha256: string };
  evaluateSpend(input: any): Promise<any>;
}
const trustedEvaluators = new WeakMap<object, () => Promise<void>>();
function expected(config: ControllerConfig, nowMs = Date.now()) {
  exact(
    config,
    ["controlled_root", "expected_policy_sha256", "expected_plan_sha256", "expected_scope"],
    ["expected_head"]
  );
  if (config.controlled_root !== ROOT)
    fail("controller_refused", "controlled root differs from installed Facilitator");
  return {
    controlledRoot: config.controlled_root,
    expectedPolicySha256: config.expected_policy_sha256,
    expectedPlanSha256: config.expected_plan_sha256,
    expectedScope: config.expected_scope,
    ...(config.expected_head ? { expectedHead: config.expected_head } : {}),
    nowMs,
  };
}
function configForAttempt(config: StagedInvokerConfig): ControllerConfig {
  if (!config.controller) fail("controller_refused", "independent controller binding is required");
  if (config.controller.logical_root !== `.council-controllers/${config.expected_plan_sha256}`)
    fail("controller_refused", "controller root differs from the fixed plan root");
  return {
    controlled_root: config.controlled_root,
    expected_policy_sha256: config.controller.expected_policy_sha256,
    expected_plan_sha256: config.expected_plan_sha256,
    expected_scope: config.expected_scope,
    ...(config.controller.expected_head ? { expected_head: config.controller.expected_head } : {}),
  };
}

/** Reviewed evaluator selection is independent of all persisted intents/receipts. */
export async function loadTrustedSpendEvaluator({
  modulePath,
  expectedSha256,
  dependencies = [],
}: {
  modulePath: string;
  expectedSha256: string;
  dependencies?: { path: string; sha256: string; byte_length: number }[];
}): Promise<SpendEvaluator> {
  if (!HASH.test(expectedSha256))
    fail("spend_unverified", "a spend evaluator module SHA-256 is required");
  const filename = resolve(modulePath);
  const verifyPins = await createFilePinCheck({
    entryPath: filename,
    expectedSha256,
    dependencies,
  });
  const verifyEntry = verifyPins;
  await verifyEntry();
  const imported = await import(
    `${pathToFileURL(filename).href}?staged_spend_sha256=${expectedSha256}`
  );
  await verifyEntry();
  const evaluator = imported.evaluator;
  exact(evaluator?.identity, ["id", "revision", "artifact_sha256"]);
  if (
    evaluator.identity.artifact_sha256 !== expectedSha256 ||
    typeof evaluator.identity.id !== "string" ||
    !evaluator.identity.id.trim() ||
    typeof evaluator.identity.revision !== "string" ||
    !evaluator.identity.revision.trim() ||
    typeof evaluator.evaluateSpend !== "function"
  )
    fail("spend_unverified", "evaluator export and identity must bind the reviewed module");
  const identity = freeze(cloneDerived(evaluator.identity));
  const method = evaluator.evaluateSpend;
  async function verify() {
    await verifyEntry();
    const current = Object.getOwnPropertyDescriptor(evaluator, "identity");
    if (
      !current ||
      !Object.hasOwn(current, "value") ||
      !same(cloneDerived(current.value), identity) ||
      Object.getOwnPropertyDescriptor(evaluator, "evaluateSpend")?.value !== method
    )
      fail("spend_unverified", "evaluator identity or method changed");
  }
  const capability = Object.freeze({
    identity,
    async evaluateSpend(input: any) {
      const snapshot = freeze(structuredClone(input));
      await verify();
      const result = cloneDerived(await method.call(evaluator, snapshot));
      await verify();
      return result;
    },
  });
  trustedEvaluators.set(capability, verify);
  return capability;
}

export async function verifyTrustedSpendEvaluator(evaluator: SpendEvaluator) {
  const verify = trustedEvaluators.get(evaluator);
  if (!verify)
    fail("spend_unverified", "derived requests require the independently pinned spend loader");
  await verify();
}

export async function evaluateSpend(
  policy: any,
  intent: any,
  budget: any,
  evaluator: SpendEvaluator
) {
  if (!evaluator || !same(evaluator.identity, policy.money.evaluator_identity))
    fail("spend_unverified", "independently selected evaluator differs from frozen policy");
  const now = Date.now();
  const remaining = policy.clock.deadline_ms - now;
  if (!positive(remaining))
    fail("controller_deadline", "absolute deadline expired during preflight");
  const input = {
    request_json_sha256: intent.request_json_sha256,
    model: intent.seat.declared_model,
    route: intent.seat.recipe_sha256,
    currency: policy.money.currency,
    units_per_currency: policy.money.units_per_currency,
    input_tokens_upper_bound: budget.input_tokens_upper_bound,
    extra_overhead_tokens: budget.extra_overhead_tokens,
    output_reservation: intent.seat.output_reservation,
    deadline_ms: policy.clock.deadline_ms,
  };
  let timer: ReturnType<typeof setTimeout> | undefined;
  let result: any;
  try {
    result = await Promise.race([
      evaluator.evaluateSpend(input),
      new Promise((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              Object.assign(new Error("spend_unverified: evaluator exceeded remaining deadline"), {
                code: "spend_unverified",
              })
            ),
          Math.min(remaining, 2_147_483_647)
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
  exact(result, [
    "verified",
    "request_json_sha256",
    "model",
    "route",
    "currency",
    "units_per_currency",
    "upper_bound_units",
    "valid_until_ms",
    "evidence",
  ]);
  exact(result.evidence, ["method", "reference", "assumptions"]);
  const evidenceText = (value: unknown, max: number) =>
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= max &&
    !/[\x00-\x1f\x7f]/u.test(value);
  if (
    result.verified !== true ||
    !Number.isSafeInteger(result.upper_bound_units) ||
    result.upper_bound_units < 0 ||
    !positive(result.valid_until_ms) ||
    result.valid_until_ms <= Date.now() ||
    !["request_json_sha256", "model", "route", "currency", "units_per_currency"].every(
      (k) => result[k] === input[k]
    ) ||
    !evidenceText(result.evidence.method, 256) ||
    !evidenceText(result.evidence.reference, 4096) ||
    !Array.isArray(result.evidence.assumptions) ||
    result.evidence.assumptions.length > 64 ||
    !result.evidence.assumptions.every((s: any) => evidenceText(s, 1024))
  )
    fail("spend_unverified", "missing, unverified, expired or unbound complete billing evidence");
  if (Date.now() >= policy.clock.deadline_ms)
    fail("controller_deadline", "deadline expired during spend evaluation");
  return freeze({
    upper_bound_units: result.upper_bound_units,
    currency: result.currency,
    units_per_currency: result.units_per_currency,
    valid_until_ms: result.valid_until_ms,
    evaluator_identity: structuredClone(evaluator.identity),
    request_json_sha256: result.request_json_sha256,
    model: result.model,
    route: result.route,
    evidence: structuredClone(result.evidence),
    evidence_sha256: sha256Bytes(canonicalJson(result.evidence)),
  });
}

export async function createControlledPlan({
  config,
  policy,
  evaluator,
}: {
  config: ControllerConfig;
  policy: any;
  evaluator: SpendEvaluator;
}) {
  if (!evaluator || !same(policy.money?.evaluator_identity, evaluator.identity))
    fail("spend_unverified", "policy evaluator must be selected independently");
  const handle = await createController({ ...expected(config), policy });
  return {
    controller_root: handle.logicalRoot,
    policy_sha256: handle.policy.policy_sha256,
    reading_accepted: false,
    provider_dispatched: false,
  };
}
export async function inspectControlledPlan(config: ControllerConfig) {
  const handle = await verifyController(expected(config));
  return {
    ...(await readController({ handle, nowMs: Date.now() })),
    reading_accepted: false,
    provider_dispatched: false,
  };
}
function reservationFrom(events: any[], attemptId: string) {
  const event = events.find(
    (e) => e.type === "reservation" && e.payload.attempt.attempt_id === attemptId
  );
  if (!event) fail("controller_refused", "attempt has no durable reservation");
  return event;
}
function attemptExpectations(config: ControllerConfig, event: any) {
  const a = event.payload.attempt;
  return {
    controlledRoot: config.controlled_root,
    attemptRoot: `.council-attempts/${a.attempt_id}`,
    expectedIntentSha256: a.intent_sha256,
    expectedPlanSha256: config.expected_plan_sha256,
    expectedScope: config.expected_scope,
    expectedOwnerId: a.owner_id,
    expectedNodeId: a.node_id,
  };
}
function outcomeFrom(events: any[], attemptId: string) {
  return events.find((e) => e.type === "reconciliation" && e.payload.attempt_id === attemptId);
}
function validUsage(receipt: any) {
  const tokens = receipt.attempts[0].tokens;
  if (tokens === null) return { input_tokens: null, output_tokens: null, spend_units: null };
  if (
    !Number.isSafeInteger(tokens.prompt) ||
    tokens.prompt < 0 ||
    !Number.isSafeInteger(tokens.completion) ||
    tokens.completion < 0 ||
    !Number.isSafeInteger(tokens.total) ||
    tokens.total < 0
  )
    fail("controller_integrity", "provider usage is not valid nonnegative integer accounting");
  return { input_tokens: tokens.prompt, output_tokens: tokens.completion, spend_units: null };
}

/**
 * The providers a frozen seat's pin admits (null for an unpinned recipe), scaffold#917. The frozen
 * seat pins the Facilitator's bytes, and those bytes hold the seat table, so the list follows from the
 * seat's identity: it is read from the installed recipe only when the installed Facilitator IS the
 * frozen one. Otherwise nothing binds it, and the caller must refuse rather than trust a receipt.
 */
export async function frozenRoutingPolicy(
  seat: any
): Promise<{ bound: true; admitted: string[] | null } | { bound: false }> {
  const installed = sha256Bytes(await readFile(resolve(ROOT, "scripts/council-invoke.ts")));
  if (!HASH.test(seat?.facilitator_sha256 ?? "") || installed !== seat.facilitator_sha256)
    return { bound: false };
  const recipe = selectRecipe({ member: seat.member, provider: seat.provider } as never);
  return { bound: true, admitted: recipe.servedProviders ? [...recipe.servedProviders] : null };
}

/**
 * The routing gate for a captured receipt (scaffold#917). With a bound policy the installed Facilitator
 * produced the receipt, so it must carry that Facilitator's exact version; a receipt relabelled as
 * legacy is refused rather than excused. An unbound seat always refuses reconciliation: the
 * receipt's own version cannot authenticate a historical producer or grant transition authority.
 * `problem` is null when the receipt may be classified; otherwise the reason it may not.
 */
export function stagedRoutingGate(
  policy: { bound: true; admitted: string[] | null } | { bound: false },
  receipt: any
): { contract: "current" | "single" | "legacy" | null; problem: string | null } {
  if (policy.bound) {
    if (receipt?.facilitator_version !== FACILITATOR_VERSION)
      return { contract: null, problem: "producer_differs_from_frozen_facilitator" };
    return { contract: "current", problem: stagedRoutingProblem(receipt, policy.admitted) };
  }
  const contract = stagedRoutingContract(receipt?.facilitator_version);
  return {
    contract,
    problem: "routing_policy_unbound",
  };
}

/** Reconcile authentic artifacts once; this operation never dispatches or grants reading credit. */
export async function reconcileControlledAttempt({
  config,
  attemptId,
  acknowledgeStopped = false,
}: {
  config: ControllerConfig;
  attemptId: string;
  acknowledgeStopped?: boolean;
}) {
  if (typeof acknowledgeStopped !== "boolean")
    fail("controller_refused", "stopped execution acknowledgement must be a boolean decision");
  const handle = await verifyController(expected(config));
  const state = await readController({ handle, nowMs: Date.now() });
  const reservation = reservationFrom(state.events, attemptId);
  const prior = outcomeFrom(state.events, attemptId);
  let inspected: any;
  try {
    inspected = await inspectAttemptRecovery(attemptExpectations(config, reservation));
  } catch (error: any) {
    // A reservation may be flushed before its intent is published. Only a truly
    // absent directory is unstarted; permission errors or damaged records stop.
    if (error.code !== "ENOENT") throw error;
    try {
      await lstat(resolve(config.controlled_root, `.council-attempts/${attemptId}`));
    } catch (missing: any) {
      if (missing.code === "ENOENT") inspected = { state: "not_dispatched" };
      else throw missing;
    }
    if (!inspected) fail("controller_integrity", "present attempt lacks required intent evidence");
  }
  if (inspected.state === "capture_ready") {
    await captureAttempt({
      handle: await verifyAttemptIntent(attemptExpectations(config, reservation)),
    });
    inspected = await inspectAttemptRecovery(attemptExpectations(config, reservation));
  }
  const hasDispatchAuthority = state.events.some(
    (e: any) => e.type === "dispatch" && e.payload.attempt_id === attemptId
  );
  let classification = "nonretryable",
    reason = "unclassified_evidence";
  let measured = { input_tokens: null, output_tokens: null, spend_units: null } as {
    input_tokens: number | null;
    output_tokens: number | null;
    spend_units: number | null;
  };
  let delay = 0;
  if (inspected.state === "invalid_evidence") {
    classification = "nonretryable";
    reason = "invalid_evidence";
  } else if (inspected.state === "captured") {
    const receipt = inspected.receipt,
      attempt = receipt.attempts[0];
    try {
      measured = validUsage(receipt);
    } catch {
      classification = "nonretryable";
      reason = "invalid_provider_usage";
    }
    // Preserve the raw receipt's classification. A contradictory or missing
    // model/effort witness cannot be turned into a controller retry authority.
    const identity = receipt.final.verification;
    const needsIdentity = ["success", "empty_content", "truncated_content"].includes(
      attempt.outcome
    );
    // scaffold#917: routing is judged against the frozen seat's admitted providers, never the
    // receipt's own list. When the installed Facilitator is the frozen one, it produced this receipt,
    // so the receipt must carry its exact version: a relabelled "legacy" receipt is refused, not
    // excused. An unbound seat cannot authenticate any producer, including a self-declared
    // legacy one; historical capture verification grants no new transition authority (#943).
    const routingPolicy = await frozenRoutingPolicy(inspected.intent.seat);
    const routing = stagedRoutingGate(routingPolicy, receipt);
    if (reason === "invalid_provider_usage") {
      // Preserve the raw numbers in the receipt; invalid quantities cannot be
      // converted to accounting totals or permit any further admission.
    } else if (
      (identity.observed !== null && identity.match_kind === "none") ||
      identity.result === "FAIL" ||
      (needsIdentity && (identity.observed === null || identity.result !== "PASS")) ||
      receipt.final.effort_verification.result === "FAIL"
    ) {
      classification = "nonretryable";
      reason = "identity_or_effort_unverified";
    } else if (routing.problem !== null) {
      classification = "nonretryable";
      reason = "routing_unverified";
    } else {
      const decision = classifyAttempt({
        fetchError: attempt.error_phase ? new Error("preserved transport error") : null,
        fetchErrorPhase: attempt.error_phase,
        httpStatus: attempt.http_status,
        observedModel: attempt.model_field,
        declaredMatches: receipt.final.verification.match_kind !== "none",
        contentLength: attempt.content_length,
        wasTruncated: attempt.finish_reason === "length",
        ...(routing.contract === "current" && routingPolicy.bound
          ? {
              servedProviderObservations: attempt.served_provider_observations,
              servedProviders: routingPolicy.admitted,
            }
          : {}),
      });
      classification = decision.shouldRetry
        ? decision.bumpMaxTokens
          ? "retryable_output"
          : "retryable_transport"
        : decision.reason === "success"
          ? "success"
          : "nonretryable";
      reason = decision.reason;
      if (decision.reason !== attempt.outcome) {
        classification = "nonretryable";
        reason = "invalid_evidence";
      }
      if (decision.shouldRetry && classification !== "nonretryable") {
        if (
          attempt.retry_after_ms !== undefined &&
          (!Number.isSafeInteger(attempt.retry_after_ms) || attempt.retry_after_ms < 0)
        )
          fail("controller_integrity", "invalid preserved Retry-After timing");
        const ordinal = state.events.filter(
          (e: any) =>
            e.type === "reservation" &&
            e.payload.attempt.node_id === reservation.payload.attempt.node_id
        ).length;
        delay = retryDelayMs({
          baseMs: handle.policy.retry.base_delay_ms,
          attemptOrdinal: ordinal,
          reason: decision.reason,
          retryAfterMs: attempt.retry_after_ms ?? null,
        });
        if (!Number.isSafeInteger(delay) || delay < 0 || delay > handle.policy.retry.max_delay_ms) {
          classification = "nonretryable";
          reason = "retry_delay_exceeds_policy";
          delay = 0;
        }
      }
    }
  } else {
    classification =
      inspected.state === "incomplete" || hasDispatchAuthority ? "ambiguous" : "not_dispatched";
    reason =
      classification === "ambiguous"
        ? "dispatch_without_complete_capture"
        : "reserved_without_dispatch";
  }
  const notBefore = prior ? prior.payload.evidence.not_before_ms : safeSum(Date.now(), delay);
  const evidence = {
    state:
      inspected.state === "captured"
        ? "captured"
        : inspected.state === "not_dispatched" && !hasDispatchAuthority
          ? "not_dispatched"
          : "incomplete",
    capture_sha256: inspected.capture?.capture_sha256 ?? null,
    receipt_sha256: inspected.capture?.provenance.sha256 ?? null,
    classification,
    reason,
    measured,
    not_before_ms: notBefore,
  };
  if (!prior && ["incomplete", "not_dispatched"].includes(inspected.state) && !acknowledgeStopped) {
    // Missing artifacts cannot establish that the original local execution has
    // stopped. Observation and duplicate invocation must never release its slot.
    return {
      state: "recovery_required",
      accounted: false,
      event: null,
      evidence,
      reading_accepted: false,
      provider_dispatched: false,
    };
  }
  const event = await reconcileAttempt({ handle, attemptId, evidence, nowMs: Date.now() });
  return {
    state: "accounted",
    accounted: true,
    event,
    evidence,
    reading_accepted: false,
    provider_dispatched: false,
  };
}

/** Return a bounded next step, without sleeping, dispatching or inventing acceptance. */
export async function decideNextControlledAttempt({
  config,
  nodeId,
  previousAttemptId,
  explicitAmbiguousReplay = false,
}: {
  config: ControllerConfig;
  nodeId: string;
  previousAttemptId?: string;
  explicitAmbiguousReplay?: boolean;
}) {
  if (typeof explicitAmbiguousReplay !== "boolean")
    fail("controller_refused", "explicit ambiguous replay must be a boolean decision");
  const handle = await verifyController(expected(config));
  if (previousAttemptId) {
    const reconciled = await reconcileControlledAttempt({
      config,
      attemptId: previousAttemptId,
      acknowledgeStopped: explicitAmbiguousReplay,
    });
    if (!reconciled.accounted)
      return {
        state: "replay_required",
        reason: "original_execution_stop_acknowledgement_required",
      };
  }
  const state = await readController({ handle, nowMs: Date.now() });
  const node = handle.policy.nodes.find((n: any) => n.node_id === nodeId);
  if (!node) fail("controller_refused", "node is outside frozen policy");
  const attempts = state.events.filter(
    (e: any) => e.type === "reservation" && e.payload.attempt.node_id === nodeId
  );
  if (!previousAttemptId) {
    if (attempts.length)
      fail("controller_refused", "existing node attempts require an explicit predecessor");
    return {
      state: "ready",
      output_reservation: node.output_reservations[0],
      predecessor: null,
      reason: "initial_attempt",
    };
  }
  const previous = reservationFrom(state.events, previousAttemptId);
  if (
    previous.payload.attempt.node_id !== nodeId ||
    attempts.at(-1)?.event_sha256 !== previous.event_sha256
  )
    fail("controller_refused", "replay must extend the latest attempt of this node");
  const outcome = outcomeFrom(state.events, previousAttemptId);
  if (!outcome) fail("controller_refused", "predecessor lacks reconciliation");
  const evidence = outcome.payload.evidence;
  let output = previous.payload.attempt.output_reservation;
  let kind = "retry";
  if (evidence.classification === "ambiguous" || evidence.classification === "not_dispatched") {
    if (!explicitAmbiguousReplay) return { state: "replay_required", reason: evidence.reason };
    kind = "ambiguous_replay";
  } else if (evidence.classification === "retryable_output") {
    const ceiling = Math.max(...node.output_reservations);
    if (output >= ceiling) return { state: "stopped", reason: "output_ceiling_reached" };
    const next = Math.min(safeSum(output, output), ceiling);
    if (!node.output_reservations.includes(next))
      return { state: "stopped", reason: "retry_variant_unverified" };
    output = next;
  } else if (evidence.classification !== "retryable_transport")
    return { state: "stopped", reason: evidence.reason };
  const baseDelay = retryDelayMs({
    baseMs: handle.policy.retry.base_delay_ms,
    attemptOrdinal: attempts.length,
    reason: evidence.reason,
    retryAfterMs: null,
  });
  if (
    !Number.isSafeInteger(baseDelay) ||
    baseDelay < 0 ||
    baseDelay > handle.policy.retry.max_delay_ms
  )
    return { state: "stopped", reason: "retry_delay_exceeds_policy" };
  const notBefore = Math.max(evidence.not_before_ms, safeSum(outcome.observed_at_ms, baseDelay));
  if (Date.now() < notBefore)
    return { state: "waiting", reason: "retry_backoff", not_before_ms: notBefore };
  return {
    state: "ready",
    output_reservation: output,
    reason: evidence.reason,
    predecessor: {
      attempt_id: previousAttemptId,
      kind,
      reason: evidence.reason,
      not_before_ms: notBefore,
    },
  };
}

export async function prepareControlledAttempt({
  config,
  spec,
  counter,
  evaluator,
  previousAttemptId,
  explicitAmbiguousReplay = false,
}: {
  config: ControllerConfig;
  spec: StagedAttemptSpec;
  counter: RequestCounter;
  evaluator: SpendEvaluator;
  previousAttemptId?: string;
  explicitAmbiguousReplay?: boolean;
}) {
  const snapshot = structuredClone(spec);
  if (
    snapshot.controlled_root !== config.controlled_root ||
    snapshot.preparation.expected_plan_sha256 !== config.expected_plan_sha256 ||
    !same(snapshot.preparation.expected_scope, config.expected_scope)
  )
    fail("controller_refused", "attempt differs from independent controller bindings");
  const next = await decideNextControlledAttempt({
    config,
    nodeId: snapshot.node_id,
    previousAttemptId,
    explicitAmbiguousReplay,
  });
  if (next.state !== "ready") fail(`controller_${next.state}`, next.reason);
  if (snapshot.output_reservation !== next.output_reservation)
    fail("controller_refused", "request does not use the authorized next reservation");
  const handle = await verifyController(expected(config));
  const guardedHead =
    handle.policy.schema_version === "council-staged-controller-policy/v2"
      ? (await readController({ handle })).state
      : null;
  const checked = await buildCheckedStagedAttempt({
    spec: snapshot,
    counter,
    controller: {
      logical_root: handle.logicalRoot,
      expected_policy_sha256: config.expected_policy_sha256,
      ...(config.expected_head ? { expected_head: config.expected_head } : {}),
    },
  });
  const spendWitness = await evaluateSpend(
    handle.policy,
    checked.intent,
    checked.budget,
    evaluator
  );
  if (guardedHead) {
    await recheckCheckedStagedAttempt({ checked });
    await verifyTrustedSpendEvaluator(evaluator);
  }
  const reservation = await reserveAttempt({
    handle,
    intent: checked.intent,
    verifiedBudget: {
      input_tokens_upper_bound: checked.budget.input_tokens_upper_bound,
      extra_overhead_tokens: checked.budget.extra_overhead_tokens,
    },
    spendWitness,
    predecessor: next.predecessor,
    ...(guardedHead
      ? {
          expectedCurrentHead: {
            sequence: guardedHead.sequence,
            event_sha256: guardedHead.head_sha256,
          },
        }
      : {}),
    nowMs: Date.now(),
  });
  const prepared = await publishCheckedStagedAttempt({ checked });
  return { ...prepared, reservation, reading_accepted: false, provider_dispatched: false };
}

/** Actual invoker guard: fresh count/price then durable dispatch authority, never CLI-only. */
export async function createControllerDispatchGuard({
  config,
  staged,
  evaluator,
}: {
  config: StagedInvokerConfig;
  staged: any;
  evaluator: SpendEvaluator;
}) {
  if (staged.intent.schema_version === "council-staged-attempt/v3") {
    const { createDerivedDispatchGuard } = await import("./council-staged-derived-runtime.ts");
    return createDerivedDispatchGuard({ staged, evaluator });
  }
  const controller = configForAttempt(config);
  const handle = await verifyController(expected(controller));
  const intent = staged.intent;
  if (!intent.controller || intent.controller.policy_sha256 !== controller.expected_policy_sha256)
    fail("controller_refused", "controlled intent requires its independent policy");
  let lastObserved = Date.now();
  let reservation: any;
  let dispatch: any;
  function remaining() {
    const now = Date.now();
    if (now < lastObserved)
      fail("controller_clock_regression", "clock moved backwards across dispatch");
    lastObserved = now;
    if (!reservation || now >= reservation.payload.spend_witness.valid_until_ms)
      fail("spend_unverified", "spend evidence expired at dispatch");
    const ms = handle.policy.clock.deadline_ms - now;
    if (!positive(ms)) fail("controller_deadline", "absolute deadline expired at dispatch");
    return ms;
  }
  return Object.freeze({
    async claim() {
      const guardedHead =
        handle.policy.schema_version === "council-staged-controller-policy/v2"
          ? (await readController({ handle })).state
          : null;
      const fresh = await staged.reverify();
      const witness = await evaluateSpend(handle.policy, fresh.intent, fresh.budget, evaluator);
      if (guardedHead) {
        await fresh.recheck();
        await verifyTrustedSpendEvaluator(evaluator);
      }
      reservation = await verifyReservation({
        handle,
        attemptId: intent.attempt_id,
        intentSha256: intent.intent_sha256,
        requestJsonSha256: intent.request_json_sha256,
        nowMs: Date.now(),
      });
      if (
        !same(reservation.payload.spend_witness, witness) ||
        !same(reservation.payload.budget, {
          input_tokens_upper_bound: fresh.budget.input_tokens_upper_bound,
          extra_overhead_tokens: fresh.budget.extra_overhead_tokens,
        })
      )
        fail("controller_refused", "fresh request/spend bounds differ from reserved evidence");
      remaining();
      dispatch = await claimControllerDispatch({
        handle,
        attemptId: intent.attempt_id,
        intentSha256: intent.intent_sha256,
        requestJsonSha256: intent.request_json_sha256,
        ...(guardedHead
          ? {
              expectedCurrentHead: {
                sequence: guardedHead.sequence,
                event_sha256: guardedHead.head_sha256,
              },
            }
          : {}),
        nowMs: Date.now(),
      });
      return remaining();
    },
    remaining,
    receiptBinding() {
      if (!dispatch || !reservation)
        fail("controller_refused", "dispatch lacks durable controller authority");
      return {
        logical_root: handle.logicalRoot,
        policy_sha256: handle.policy.policy_sha256,
        reservation_sha256: reservation.event_sha256,
        dispatch_sha256: dispatch.event_sha256,
      };
    },
  });
}

/** Thin canonical invoker adapter. Independent module paths are never read from saved config. */
export async function runControlledAttempt({
  configPath,
  promptFile,
  systemPromptFile,
  counterModule,
  counterSha256,
  spendModule,
  spendSha256,
  counterDependencies,
  spendDependencies,
}: {
  configPath: string;
  promptFile: string;
  systemPromptFile?: string;
  counterModule: string;
  counterSha256: string;
  spendModule: string;
  spendSha256: string;
  counterDependencies?: string;
  spendDependencies?: string;
}) {
  const config = await readConfig(configPath);
  const controller = configForAttempt(config);
  const handle = await verifyController(expected(controller));
  const state = await readController({ handle, nowMs: Date.now() });
  const reservation = reservationFrom(state.events, config.attempt_root.split("/").at(-1));
  const attempt = await verifyAttemptIntent(attemptExpectations(controller, reservation));
  const intent = attempt.intent;
  const argv = [
    "--member",
    intent.seat.member,
    "--provider",
    intent.seat.provider,
    "--transport",
    intent.seat.transport,
    "--prompt-file",
    promptFile,
    "--source-manifest",
    resolve(config.controlled_root, intent.inputs.source_manifest.path),
    "--output",
    attempt.outputPath,
    "--provenance",
    attempt.provenancePath,
    "--max-tokens",
    String(intent.seat.output_reservation),
    "--max-retries",
    "0",
    "--per-attempt-timeout-ms",
    String(intent.limits.per_attempt_timeout_ms),
    "--total-timeout-ms",
    String(intent.limits.total_timeout_ms),
    "--staged-attempt-config",
    configPath,
    "--staged-counter-module",
    counterModule,
    "--staged-counter-sha256",
    counterSha256,
    "--staged-spend-module",
    spendModule,
    "--staged-spend-sha256",
    spendSha256,
  ];
  if (systemPromptFile) argv.push("--system-prompt-file", systemPromptFile);
  if (counterDependencies) argv.push("--staged-counter-dependencies", counterDependencies);
  if (spendDependencies) argv.push("--staged-spend-dependencies", spendDependencies);
  let exitCode: number;
  try {
    exitCode = await runCouncilInvocation(argv);
  } catch {
    exitCode = 1;
  }
  const reconciled = await reconcileControlledAttempt({
    config: controller,
    attemptId: intent.attempt_id,
  });
  return {
    exit_code: exitCode,
    state: reconciled.state,
    accounted: reconciled.accounted,
    event: reconciled.event,
    evidence: reconciled.evidence,
    reading_accepted: false,
  };
}

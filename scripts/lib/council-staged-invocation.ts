/**
 * Bind one canonical invocation to a materialized preparation and durable intent.
 * Usage: prepareStagedAttempt({spec, counter}); verifyStagedInvocation({...}).
 * Counter selection is a separate caller capability, never an intent field.
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readConfig } from "../council-stage-sources.mjs";
import { createFilePinCheck } from "./council-staged-pins.mjs";
import { cloneDerived } from "./council-staged-derived-contract.mjs";
import {
  canonicalJson,
  freezeSources,
  sha256Bytes,
  validatePlan,
} from "./council-staged-sources.mjs";
import { MAX_RECORD_BYTES, verifyPreparation } from "./council-staged-store.mjs";
import {
  createAttemptIntent,
  verifyAttemptIntent,
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

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const HASH = /^[a-f0-9]{64}$/;
const MAX_TIMEOUT = 2_147_478_647; // Leave room for the canonical hard-timeout grace.
const fail = (message: string): never => {
  throw Object.assign(new Error(`staged_invocation_refused: ${message}`), {
    code: "staged_invocation_refused",
  });
};
const same = (a: unknown, b: unknown) => canonicalJson(a) === canonicalJson(b);
function exactKeys(value: any, keys: string[], optional: string[] = []) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    keys.some((key) => !Object.hasOwn(value, key)) ||
    Object.keys(value).some((key) => !keys.includes(key) && !optional.includes(key))
  ) {
    fail("configuration fields are missing or unsupported");
  }
}

export interface AttemptLimits {
  max_client_dispatches: 1;
  per_attempt_timeout_ms: number;
  total_timeout_ms: number;
}
export interface StagedAttemptSpec {
  controlled_root: string;
  preparation: {
    logical_root: string;
    expected_plan_sha256: string;
    expected_scope: Record<string, unknown>;
  };
  chunk_id: string;
  seat: StagedSeatConfig;
  output_reservation: number;
  attempt_id: string;
  operation_id: string;
  node_id: string;
  owner_id: string;
  user_prompt: string;
  system_prompt?: string | null;
  limits: AttemptLimits;
}
export interface StagedInvokerConfig {
  controlled_root: string;
  attempt_root: string;
  expected_intent_sha256: string;
  expected_plan_sha256: string;
  expected_scope: Record<string, unknown>;
  expected_owner_id: string;
  expected_node_id: string;
  preparation_logical_root: string;
  chunk_id?: string;
  seat: StagedSeatConfig;
  derived?: {
    expected_policy_sha256: string;
    seats: StagedSeatConfig[];
    note_counter: { module_path: string; artifact_sha256: string; dependencies?: any[] };
  };
  controller?: {
    logical_root: string;
    expected_policy_sha256: string;
    expected_head?: { sequence: number; event_sha256: string | null };
  };
}

const checkedAttempts = new WeakMap<object, any>();
const trustedCounters = new WeakMap<object, () => Promise<void>>();
function frozen<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) frozen(child);
    Object.freeze(value);
  }
  return value;
}
function controllerBinding(binding: StagedInvokerConfig["controller"], planSha256: string) {
  if (binding === undefined) return;
  exactKeys(binding, ["logical_root", "expected_policy_sha256"], ["expected_head"]);
  if (binding.expected_head !== undefined) {
    exactKeys(binding.expected_head, ["sequence", "event_sha256"]);
    if (
      !Number.isSafeInteger(binding.expected_head.sequence) ||
      binding.expected_head.sequence < 0 ||
      (binding.expected_head.sequence === 0
        ? binding.expected_head.event_sha256 !== null
        : !HASH.test(binding.expected_head.event_sha256 ?? ""))
    )
      fail("invalid independent controller checkpoint");
  }
  if (
    binding.logical_root !== `.council-controllers/${planSha256}` ||
    !HASH.test(binding.expected_policy_sha256)
  )
    fail("controller binding requires the fixed plan root and an independent policy digest");
}

function checkLimits(limits: AttemptLimits) {
  exactKeys(limits, ["max_client_dispatches", "per_attempt_timeout_ms", "total_timeout_ms"]);
  if (
    limits.max_client_dispatches !== 1 ||
    ![limits.per_attempt_timeout_ms, limits.total_timeout_ms].every(
      (n) => Number.isSafeInteger(n) && n > 0 && n <= MAX_TIMEOUT
    ) ||
    limits.total_timeout_ms < limits.per_attempt_timeout_ms
  ) {
    fail("one dispatch and finite positive frozen timeouts are required");
  }
}
function checkSeat(seat: StagedSeatConfig) {
  exactKeys(
    seat,
    ["seat_id", "member", "provider", "transport", "context_ceiling", "output_reservations"],
    ["recipe_sha256"]
  );
  if (seat.provider !== "openrouter" || !["default", "buffered", "sse"].includes(seat.transport)) {
    fail("staged attempts support only canonical OpenRouter buffered/SSE routes");
  }
}
function checkRoot(root: string) {
  if (typeof root !== "string" || root !== ROOT)
    fail("controlled_root must be the installed Facilitator root");
}

/** Pin the independently selected entry before import, after import, and every count. */
export async function loadTrustedCounter({
  modulePath,
  expectedSha256,
  dependencies = [],
}: {
  modulePath: string;
  expectedSha256: string;
  dependencies?: { path: string; sha256: string; byte_length: number }[];
}): Promise<RequestCounter> {
  if (!HASH.test(expectedSha256)) fail("a counter module SHA-256 is required");
  const filename = resolve(modulePath);
  const verifyPins = await createFilePinCheck({
    entryPath: filename,
    expectedSha256,
    dependencies,
  });
  const verifyEntry = verifyPins;
  await verifyEntry();
  const imported = await import(`${pathToFileURL(filename).href}?staged_sha256=${expectedSha256}`);
  await verifyEntry();
  const counter = imported.counter as RequestCounter;
  if (
    counter?.identity?.artifact_sha256 !== expectedSha256 ||
    typeof counter.countRequest !== "function"
  )
    fail("counter identity does not bind the selected entry");
  const identity = frozen(cloneDerived(counter.identity));
  const method = counter.countRequest;
  const count = method.bind(counter);
  async function verify() {
    await verifyEntry();
    const current = Object.getOwnPropertyDescriptor(counter, "identity");
    if (
      !current ||
      !Object.hasOwn(current, "value") ||
      !same(cloneDerived(current.value), identity) ||
      Object.getOwnPropertyDescriptor(counter, "countRequest")?.value !== method
    )
      fail("counter identity or method changed");
  }
  const capability = Object.freeze({
    identity,
    async countRequest(input: Parameters<RequestCounter["countRequest"]>[0]) {
      const snapshot = structuredClone(input);
      await verify();
      const result = cloneDerived(await count(snapshot));
      await verify();
      return result;
    },
  });
  trustedCounters.set(capability, verify);
  return capability;
}

/** Only this loader can establish a callback-free counter verification capability. */
export async function verifyTrustedCounter(counter: RequestCounter) {
  const verify = trustedCounters.get(counter);
  if (!verify) fail("derived requests require the independently pinned trusted counter loader");
  await verify();
}

function expectedStore(config: StagedInvokerConfig) {
  return {
    controlledRoot: config.controlled_root,
    attemptRoot: config.attempt_root,
    expectedIntentSha256: config.expected_intent_sha256,
    expectedPlanSha256: config.expected_plan_sha256,
    expectedScope: config.expected_scope,
    expectedOwnerId: config.expected_owner_id,
    expectedNodeId: config.expected_node_id,
  };
}

async function assessPreparation({
  root,
  logicalRoot,
  planSha256,
  scope,
  chunkId,
  seat,
  userPrompt,
  systemPrompt,
  counter,
}: {
  root: string;
  logicalRoot: string;
  planSha256: string;
  scope: Record<string, unknown>;
  chunkId: string;
  seat: StagedSeatConfig;
  userPrompt: string;
  systemPrompt: string | null;
  counter: RequestCounter;
}) {
  checkRoot(root);
  checkSeat(seat);
  const binding = {
    controlledRoot: root,
    logicalRoot,
    expectedPlanSha256: planSha256,
    expectedScope: scope,
  };
  const marker = await verifyPreparation(binding);
  const plan = await readConfig(resolve(root, logicalRoot, "plan.json"), {
    maxBytes: MAX_RECORD_BYTES,
  });
  validatePlan({ plan });
  if (
    plan.plan_sha256 !== planSha256 ||
    !same(plan.scope, scope) ||
    plan.logical_root !== logicalRoot
  )
    fail("plan binding changed");
  const chunk = plan.chunks.find((c: any) => c.id === chunkId);
  if (!chunk) fail("chunk is not in the frozen preparation");
  const assessor = await createCanonicalRequestAssessor({
    seats: [seat],
    userPrompt,
    systemPrompt,
    counter,
  });
  const frozenSeat = plan.seats.find((s: any) => s.seat_id === seat.seat_id);
  if (!same(assessor.seats[0], frozenSeat)) fail("seat differs from the frozen plan");
  const paths = [
    chunk.source_manifest_path,
    ...chunk.source_manifest.sources.map((s: any) => s.path),
  ];
  const refs = paths.map((path: string) => {
    const ref = plan.files.find((f: any) => f.path === path);
    if (!ref) fail("chunk references an unplanned file");
    return { id: path, ...ref };
  });
  const files = await freezeSources({
    sourceRoot: root,
    inputs: refs,
    limits: {
      max_source_bytes: Math.max(...refs.map((f: any) => f.byte_length), 1),
      max_total_bytes: Math.max(
        refs.reduce((n: number, f: any) => n + f.byte_length, 0),
        1
      ),
      max_sources: refs.length,
      max_chunks: 1,
      max_assessments: 1,
    },
  });
  if (!same(JSON.parse(files[0].bytes.toString("utf8")), chunk.source_manifest))
    fail("source manifest differs from the frozen chunk");
  const candidate = {
    chunk_id: chunk.id,
    ranges: chunk.ranges,
    source_manifest_path: chunk.source_manifest_path,
    source_manifest: chunk.source_manifest,
    files: files.slice(1).map((file: any) => ({
      path: file.path,
      bytes: file.bytes,
      sha256: file.sha256,
      byte_length: file.byte_length,
    })),
  };
  const [assessment] = await assessor.assessRequest(candidate);
  const original = chunk.assessments.find((a: any) => a.seat_id === seat.seat_id);
  // Fresh authority must reproduce the frozen request and its complete bound/witness.
  // Stored verified:true never bypasses the trusted counter, even for an identical hash.
  if (!same(assessment, original))
    fail("fresh count or request differs from its original verified assessment");
  for (const variant of assessment.request_variants) {
    const total =
      variant.input_tokens_upper_bound! +
      variant.extra_overhead_tokens! +
      variant.output_reservation;
    if (!Number.isSafeInteger(total) || total > seat.context_ceiling)
      fail("complete request exceeds the frozen context ceiling");
  }
  const description = await describeStagedSeat({
    ...seat,
    recipe_sha256: assessment.recipe_sha256,
  });
  await verifyPreparation(binding);
  return { marker, plan, chunk, assessment, description, sourceManifestSha256: files[0].sha256 };
}

/** Create a private intent only after a fresh, exact, verified complete-request count. */
export async function buildCheckedStagedAttempt({
  spec: supplied,
  counter,
  controller,
}: {
  spec: StagedAttemptSpec;
  counter: RequestCounter;
  controller?: StagedInvokerConfig["controller"];
}) {
  const spec = structuredClone(supplied);
  exactKeys(
    spec,
    [
      "controlled_root",
      "preparation",
      "chunk_id",
      "seat",
      "output_reservation",
      "attempt_id",
      "operation_id",
      "node_id",
      "owner_id",
      "user_prompt",
      "limits",
    ],
    ["system_prompt"]
  );
  exactKeys(spec.preparation, ["logical_root", "expected_plan_sha256", "expected_scope"]);
  checkLimits(spec.limits);
  controllerBinding(controller, spec.preparation.expected_plan_sha256);
  const checked = await assessPreparation({
    root: spec.controlled_root,
    logicalRoot: spec.preparation.logical_root,
    planSha256: spec.preparation.expected_plan_sha256,
    scope: spec.preparation.expected_scope,
    chunkId: spec.chunk_id,
    seat: spec.seat,
    userPrompt: spec.user_prompt,
    systemPrompt: spec.system_prompt ?? null,
    counter,
  });
  const variant = checked.assessment.request_variants.find(
    (v) => v.output_reservation === spec.output_reservation
  );
  if (!variant) fail("output reservation is not a verified plan variant");
  const body = {
    schema_version: controller ? "council-staged-attempt/v2" : "council-staged-attempt/v1",
    ...(controller
      ? {
          controller: {
            logical_root: controller.logical_root,
            policy_sha256: controller.expected_policy_sha256,
          },
        }
      : {}),
    attempt_id: spec.attempt_id,
    operation_id: spec.operation_id,
    node_id: spec.node_id,
    owner_id: spec.owner_id,
    scope: spec.preparation.expected_scope,
    plan: {
      logical_root: spec.preparation.logical_root,
      sha256: spec.preparation.expected_plan_sha256,
    },
    preparation_sha256: checked.marker.marker_sha256,
    seat: {
      seat_id: spec.seat.seat_id,
      member: spec.seat.member,
      provider: spec.seat.provider,
      transport: checked.description.descriptor.transport,
      declared_model: checked.description.descriptor.declared_model,
      recipe_sha256: checked.assessment.recipe_sha256,
      facilitator_sha256: checked.assessment.facilitator_sha256,
      context_ceiling: spec.seat.context_ceiling,
      output_reservation: spec.output_reservation,
    },
    inputs: {
      source_manifest: {
        path: checked.chunk.source_manifest_path,
        sha256: checked.sourceManifestSha256,
      },
      system_prompt_sha256: checked.assessment.system_prompt_sha256,
      user_prompt_sha256: checked.assessment.user_prompt_sha256,
    },
    request_json_sha256: variant.request_json_sha256,
    limits: spec.limits,
  };
  const intent = { ...body, intent_sha256: sha256Bytes(canonicalJson(body)) };
  const invoker_config: StagedInvokerConfig = {
    controlled_root: spec.controlled_root,
    attempt_root: `.council-attempts/${spec.attempt_id}`,
    expected_intent_sha256: intent.intent_sha256,
    expected_plan_sha256: spec.preparation.expected_plan_sha256,
    expected_scope: spec.preparation.expected_scope,
    expected_owner_id: spec.owner_id,
    expected_node_id: spec.node_id,
    preparation_logical_root: spec.preparation.logical_root,
    chunk_id: spec.chunk_id,
    seat: spec.seat,
    ...(controller ? { controller: structuredClone(controller) } : {}),
  };
  const checkedAttempt = frozen({
    intent,
    invoker_config,
    budget: {
      ...structuredClone(variant),
      recipe_sha256: checked.assessment.recipe_sha256,
      facilitator_sha256: checked.assessment.facilitator_sha256,
    },
  });
  checkedAttempts.set(checkedAttempt, {
    invoker_config,
    intent,
    counter,
    sourceManifestPath: resolve(spec.controlled_root, checked.chunk.source_manifest_path),
  });
  return checkedAttempt;
}

/** Callback-free recheck after pricing an initial request on a v2 controller. */
async function recheckInitial(config: StagedInvokerConfig, intent: any, counter: RequestCounter) {
  await verifyTrustedCounter(counter);
  const marker = await verifyPreparation({
    controlledRoot: config.controlled_root,
    logicalRoot: config.preparation_logical_root,
    expectedPlanSha256: config.expected_plan_sha256,
    expectedScope: config.expected_scope,
  });
  const description = await describeStagedSeat({
    ...config.seat,
    recipe_sha256: intent.seat.recipe_sha256,
  });
  if (
    marker.marker_sha256 !== intent.preparation_sha256 ||
    description.descriptor.facilitator_sha256 !== intent.seat.facilitator_sha256 ||
    description.descriptor.declared_model !== intent.seat.declared_model ||
    description.descriptor.transport !== intent.seat.transport
  )
    fail("initial request dependencies changed during pricing");
  await verifyTrustedCounter(counter);
}

export async function recheckCheckedStagedAttempt({ checked }: any) {
  const saved = checkedAttempts.get(checked);
  if (!saved) fail("an authentic checked attempt is required");
  await recheckInitial(saved.invoker_config, saved.intent, saved.counter);
}

/** Only an opaque fresh checked result can publish an intent. Admission precedes this call. */
export async function publishCheckedStagedAttempt({
  checked,
}: {
  checked: Awaited<ReturnType<typeof buildCheckedStagedAttempt>>;
}) {
  const saved = checkedAttempts.get(checked);
  if (!saved) fail("an authentic checked attempt is required");
  const { invoker_config, intent, sourceManifestPath } = saved;
  const handle = await createAttemptIntent({ ...expectedStore(invoker_config), intent });
  return {
    invoker_config,
    intent,
    output_path: handle.outputPath,
    provenance_path: handle.provenancePath,
    source_manifest_path: sourceManifestPath,
  };
}

/** Standalone v1 compatibility: checking and publication retain the existing API. */
export async function prepareStagedAttempt(args: {
  spec: StagedAttemptSpec;
  counter: RequestCounter;
}) {
  return publishCheckedStagedAttempt({ checked: await buildCheckedStagedAttempt(args) });
}

/** Independently reverify caller bindings and actual canonical bytes before dispatch. */
export async function verifyStagedInvocation({
  config: supplied,
  counter,
  userPrompt,
  systemPrompt,
  actualUserPrompt,
  actualSourceManifest,
  sourceManifestPath,
  requestJson,
  invocation,
}: {
  config: StagedInvokerConfig;
  counter: RequestCounter;
  userPrompt: string;
  systemPrompt: string | null;
  actualUserPrompt: string;
  actualSourceManifest: unknown;
  sourceManifestPath: string | null;
  requestJson: string;
  invocation: {
    member: string;
    provider: string;
    transport: string;
    maxTokens: number | null;
    maxRetries: number;
    perAttemptTimeoutMs: number;
    totalTimeoutMs: number;
    outputPath: string;
    provenancePath: string;
  };
}) {
  if (supplied.derived !== undefined) {
    const data = cloneDerived({
      config: supplied,
      userPrompt,
      systemPrompt,
      actualUserPrompt,
      actualSourceManifest,
      sourceManifestPath,
      requestJson,
      invocation,
    });
    const { verifyDerivedInvocation } = await import("./council-staged-derived-runtime.ts");
    return verifyDerivedInvocation({ ...data, counter });
  }
  const config = structuredClone(supplied);
  exactKeys(
    config,
    [
      "controlled_root",
      "attempt_root",
      "expected_intent_sha256",
      "expected_plan_sha256",
      "expected_scope",
      "expected_owner_id",
      "expected_node_id",
      "preparation_logical_root",
      "chunk_id",
      "seat",
    ],
    ["controller"]
  );
  checkRoot(config.controlled_root);
  controllerBinding(config.controller, config.expected_plan_sha256);
  const handle = await verifyAttemptIntent(expectedStore(config));
  const intent = handle.intent;
  if (
    !same(
      intent.controller ?? null,
      config.controller
        ? {
            logical_root: config.controller.logical_root,
            policy_sha256: config.controller.expected_policy_sha256,
          }
        : null
    )
  )
    fail("controller intent differs from the independently selected policy");
  checkLimits(intent.limits);
  if (
    invocation.maxRetries !== 0 ||
    invocation.maxTokens !== intent.seat.output_reservation ||
    invocation.member !== intent.seat.member ||
    invocation.provider !== intent.seat.provider ||
    invocation.transport !== intent.seat.transport ||
    invocation.perAttemptTimeoutMs !== intent.limits.per_attempt_timeout_ms ||
    invocation.totalTimeoutMs !== intent.limits.total_timeout_ms ||
    invocation.outputPath !== handle.outputPath ||
    invocation.provenancePath !== handle.provenancePath ||
    intent.plan.logical_root !== config.preparation_logical_root ||
    sourceManifestPath === null ||
    resolve(sourceManifestPath) !==
      resolve(config.controlled_root, intent.inputs.source_manifest.path) ||
    sha256Bytes(requestJson) !== intent.request_json_sha256 ||
    sha256Bytes(actualUserPrompt) !== intent.inputs.user_prompt_sha256 ||
    sha256Bytes(systemPrompt ?? "") !== intent.inputs.system_prompt_sha256
  )
    fail("actual invocation does not match the independently bound intent");
  const checked = await assessPreparation({
    root: config.controlled_root,
    logicalRoot: config.preparation_logical_root,
    planSha256: config.expected_plan_sha256,
    scope: config.expected_scope,
    chunkId: config.chunk_id,
    seat: config.seat,
    userPrompt,
    systemPrompt,
    counter,
  });
  const variant = checked.assessment.request_variants.find(
    (v) => v.output_reservation === invocation.maxTokens
  );
  if (
    !variant ||
    variant.request_json_sha256 !== intent.request_json_sha256 ||
    checked.marker.marker_sha256 !== intent.preparation_sha256 ||
    checked.assessment.recipe_sha256 !== intent.seat.recipe_sha256 ||
    checked.assessment.facilitator_sha256 !== intent.seat.facilitator_sha256 ||
    checked.description.descriptor.declared_model !== intent.seat.declared_model ||
    checked.description.descriptor.transport !== intent.seat.transport ||
    checked.description.descriptor.substrate !== "openrouter" ||
    config.seat.seat_id !== intent.seat.seat_id ||
    config.seat.context_ceiling !== intent.seat.context_ceiling ||
    checked.chunk.source_manifest_path !== intent.inputs.source_manifest.path ||
    checked.sourceManifestSha256 !== intent.inputs.source_manifest.sha256 ||
    !same(actualSourceManifest, checked.chunk.source_manifest)
  ) {
    fail("materialized preparation does not authorize the actual invocation");
  }
  // Keep handle operations with the exact store module instance that verified it.
  // TS loaders may resolve static and dynamic imports into distinct module graphs;
  // no process-global registry or caller-forgeable authority is needed.
  return Object.freeze({
    handle,
    intent,
    requestJson,
    budget: frozen({
      ...structuredClone(variant),
      recipe_sha256: checked.assessment.recipe_sha256,
      facilitator_sha256: checked.assessment.facilitator_sha256,
    }),
    reverify: () =>
      verifyStagedInvocation({
        config,
        counter,
        userPrompt,
        systemPrompt,
        actualUserPrompt,
        actualSourceManifest,
        sourceManifestPath,
        requestJson,
        invocation: structuredClone(invocation),
      }),
    recheck: async () => {
      await recheckInitial(config, intent, counter);
      await verifyAttemptIntent(expectedStore(config));
    },
    store: Object.freeze({ claimDispatch, writeAttemptArtifactExclusive, captureAttempt }),
    binding: Object.freeze({
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
      ...(intent.controller ? { controller: intent.controller } : {}),
    }),
  });
}

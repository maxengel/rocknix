/**
 * Purpose: Accept initial notes only from verified, accounted canonical captures.
 * Usage: createReadingPolicy / acceptInitialReading / inspectReadings.
 * No dispatch, derived reread, reduction, reading-proof or phase authority.
 */
import { lstat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalJson, freezeSources, sha256Bytes } from "./council-staged-sources.mjs";
import { readVerifiedPreparation } from "./council-staged-store.mjs";
import { verifyController, readController } from "./council-staged-controller-store.mjs";
import {
  inspectAttemptRecovery,
  stagedRoutingContract,
  stagedRoutingProblem,
} from "./council-staged-attempt-store.mjs";
import {
  createReadingStore,
  verifyReadingStore,
  readAcceptedLeaves,
  publishAcceptedLeaf,
} from "./council-staged-reading-store.mjs";
import { validateInitialNote } from "./council-staged-notes.mjs";
import { assessNote } from "./council-staged-note-counter.mjs";
import { createCanonicalRequestAssessor, describeStagedSeat } from "./council-staged-request.ts";
import { FACILITATOR_VERSION, embedSourcesIntoPrompt, selectRecipe } from "../council-invoke.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const HASH = /^[a-f0-9]{64}$/;
const same = (a: any, b: any) => canonicalJson(a) === canonicalJson(b);
function fail(message: string): never {
  throw Object.assign(new Error(`reading_refused: ${message}`), { code: "reading_refused" });
}
function need(value: any, message: string): asserts value {
  if (!value) fail(message);
}
function exact(value: any, keys: string[]) {
  need(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).length === keys.length &&
      keys.every((k) => Object.hasOwn(value, k)),
    "missing or unsupported fields"
  );
}
function label(value: any, cap = 1024) {
  return (
    typeof value === "string" &&
    value.isWellFormed() &&
    value.trim() &&
    value.length <= cap &&
    !/[\x00-\x1f\x7f]/u.test(value)
  );
}
function prose(value: any, cap = 65536) {
  return typeof value === "string" && value.isWellFormed() && value.trim() && value.length <= cap;
}
function seal(body: any, key: string) {
  return { ...body, [key]: sha256Bytes(canonicalJson(body)) };
}
function digest(record: any, key: string) {
  const { [key]: ignored, ...body } = record;
  return sha256Bytes(canonicalJson(body));
}
function questionContract(contract: any) {
  exact(contract, ["brief", "questions"]);
  need(
    prose(contract.brief) &&
      Array.isArray(contract.questions) &&
      contract.questions.length > 0 &&
      contract.questions.length <= 1024,
    "invalid question contract"
  );
  const ids = new Set();
  for (const question of contract.questions) {
    exact(question, ["id", "text"]);
    need(
      label(question.id) && prose(question.text) && !ids.has(question.id),
      "invalid or duplicate question"
    );
    ids.add(question.id);
  }
}
/** Freeze this exact instruction before request assessment; sources contain original IDs. */
export function renderReadingPrompt({
  questionContract: contract,
  sources,
  deliveredRanges = [],
}: any): string {
  questionContract(contract);
  need(
    Array.isArray(sources) && sources.length > 0 && sources.length <= 1024,
    "invalid permitted source index"
  );
  const ids = new Set();
  for (const source of sources) {
    exact(source, ["id", "sha256", "byte_length"]);
    need(
      label(source.id) &&
        HASH.test(source.sha256) &&
        Number.isSafeInteger(source.byte_length) &&
        source.byte_length >= 0 &&
        !ids.has(source.id),
      "invalid permitted source"
    );
    ids.add(source.id);
  }
  need(Array.isArray(deliveredRanges), "invalid delivered ranges");
  for (const range of deliveredRanges) {
    exact(range, ["source_id", "start", "end", "sha256", "purpose"]);
    const source = sources.find((s: any) => s.id === range.source_id);
    need(
      source &&
        Number.isSafeInteger(range.start) &&
        Number.isSafeInteger(range.end) &&
        range.start >= 0 &&
        range.end >= range.start &&
        range.end <= source.byte_length &&
        HASH.test(range.sha256) &&
        range.purpose === "primary",
      "invalid delivered range"
    );
  }
  return [
    "Read the supplied initial source slices against the frozen question contract below.",
    "Return only strict JSON with exactly items, dispositions, reread_requests. dispositions must be [].",
    "Each item has exactly id, text, kinds, question_ids, dependency_ids, uncertainty, evidence. kinds is a nonempty array drawn from claim, definition, counterevidence, open-question. Open questions require nonempty uncertainty. Preserve uncertainty; use only listed question IDs and local acyclic item dependencies.",
    'Each evidence entry is {basis:"current-original",range:{source_id,start,end,sha256}} using exact UTF-8 byte offsets and SHA-256 within delivered primary ranges. No carried-note evidence or resolutions.',
    "Each reread request has exactly id, source_id, start, end, item_ids, reason. Requests may reference the full permitted source index but do not establish evidence or completed reading.",
    canonicalJson({
      question_contract: contract,
      permitted_sources: sources,
      delivered_primary_ranges: deliveredRanges,
    }),
  ].join("\n");
}
/** Assess each exact candidate with its original-range metadata in the prompt. */
export async function createReadingRequestAssessor({
  questionContract: contract,
  sources,
  seats,
  counter,
}: any) {
  const inputs = structuredClone({ contract, sources, seats });
  const identity = structuredClone(counter?.identity);
  const initial = await createCanonicalRequestAssessor({
    seats: inputs.seats,
    userPrompt: renderReadingPrompt({ questionContract: inputs.contract, sources: inputs.sources }),
    counter,
  });
  return {
    seats: initial.seats,
    async assessRequest(candidate: any) {
      need(same(counter.identity, identity), "request counter identity changed");
      const userPrompt = renderReadingPrompt({
        questionContract: inputs.contract,
        sources: inputs.sources,
        deliveredRanges: candidate.ranges,
      });
      const assessor = await createCanonicalRequestAssessor({
        seats: inputs.seats,
        userPrompt,
        counter,
      });
      need(same(assessor.seats, initial.seats), "reading assessor seat changed");
      return assessor.assessRequest(candidate);
    },
  };
}
export function readingOperationId({ policySha256, ownerId, nodeId, chunkId }: any) {
  need(
    HASH.test(policySha256) && [ownerId, nodeId, chunkId].every((x) => label(x)),
    "invalid operation binding"
  );
  return sha256Bytes(
    canonicalJson({
      policy_sha256: policySha256,
      owner_id: ownerId,
      node_id: nodeId,
      chunk_id: chunkId,
    })
  );
}
function configSnapshot(value: any) {
  const config = structuredClone(value);
  exact(config, [
    "controlled_root",
    "expected_plan_sha256",
    "expected_scope",
    "expected_policy_sha256",
    "expected_controller_policy_sha256",
  ]);
  need(
    config.controlled_root === ROOT &&
      [
        config.expected_plan_sha256,
        config.expected_policy_sha256,
        config.expected_controller_policy_sha256,
      ].every((x) => HASH.test(x)),
    "independent installed-root and policy bindings required"
  );
  return config;
}
function storeArgs(config: any) {
  return {
    controlledRoot: config.controlled_root,
    expectedPlanSha256: config.expected_plan_sha256,
    expectedPolicySha256: config.expected_policy_sha256,
  };
}
function authenticMeasured(receipt: any, reservation: any) {
  const tokens = receipt.attempts[0].tokens;
  const measured = { input_tokens: null, output_tokens: null, spend_units: null } as any;
  if (tokens !== null) {
    need(
      tokens &&
        [tokens.prompt, tokens.completion, tokens.total].every(
          (n) => Number.isSafeInteger(n) && n >= 0
        ),
      "invalid authentic provider usage"
    );
    measured.input_tokens = tokens.prompt;
    measured.output_tokens = tokens.completion;
    const bound =
      reservation.payload.budget.input_tokens_upper_bound +
      reservation.payload.budget.extra_overhead_tokens;
    need(
      Number.isSafeInteger(bound) &&
        tokens.prompt <= bound &&
        tokens.completion <= reservation.payload.attempt.output_reservation,
      "authentic provider usage exceeds reserved bound"
    );
  }
  return measured;
}
/** Global accounting includes captured attempts that were never accepted as notes. */
async function verifyTerminalHistory(config: any, prep: any, history: any) {
  for (const event of history.events) {
    if (event.type !== "reconciliation") continue;
    const reservation = history.events.find(
      (e: any) =>
        e.type === "reservation" && e.payload.attempt.attempt_id === event.payload.attempt_id
    );
    need(reservation, "terminal attempt has no reservation");
    const a = reservation.payload.attempt,
      evidence = event.payload.evidence;
    const attemptRoot = `.council-attempts/${a.attempt_id}`;
    let actual: any;
    try {
      actual = await inspectAttemptRecovery({
        controlledRoot: config.controlled_root,
        attemptRoot,
        expectedIntentSha256: a.intent_sha256,
        expectedPlanSha256: config.expected_plan_sha256,
        expectedScope: config.expected_scope,
        expectedOwnerId: a.owner_id,
        expectedNodeId: a.node_id,
      });
    } catch (error: any) {
      if (error.code !== "ENOENT") throw error;
      try {
        await lstat(resolve(config.controlled_root, attemptRoot));
      } catch (missing: any) {
        if (missing.code === "ENOENT") actual = { state: "not_dispatched" };
        else throw missing;
      }
      need(actual, "present historical attempt has invalid intent");
    }
    const hasDispatch = history.events.some(
      (e: any) => e.type === "dispatch" && e.payload.attempt_id === a.attempt_id
    );
    if (actual.state !== "captured") {
      need(
        ["not_dispatched", "incomplete"].includes(actual.state),
        "historical attempt requires verified capture or recovery"
      );
      const state =
        actual.state === "not_dispatched" && !hasDispatch ? "not_dispatched" : "incomplete";
      need(
        evidence.state === state &&
          evidence.classification ===
            (state === "not_dispatched" ? "not_dispatched" : "ambiguous") &&
          evidence.capture_sha256 === null &&
          evidence.receipt_sha256 === null &&
          same(evidence.measured, { input_tokens: null, output_tokens: null, spend_units: null }),
        "historical terminal evidence differs from actual recovery"
      );
      continue;
    }
    const { intent, capture, receipt } = actual;
    const chunk = prep.plan.chunks.find(
      (c: any) => c.source_manifest_path === intent.inputs.source_manifest.path
    );
    const assessment = chunk?.assessments.find((x: any) => x.seat_id === intent.seat.seat_id);
    const variant = assessment?.request_variants.find(
      (x: any) => x.output_reservation === intent.seat.output_reservation
    );
    const seat = prep.plan.seats.find((x: any) => x.seat_id === intent.seat.seat_id);
    need(
      variant &&
        seat &&
        intent.controller?.policy_sha256 === config.expected_controller_policy_sha256 &&
        a.output_reservation === intent.seat.output_reservation &&
        a.context_ceiling === intent.seat.context_ceiling &&
        a.context_ceiling === seat.context_ceiling &&
        a.request_json_sha256 === intent.request_json_sha256 &&
        variant.request_json_sha256 === intent.request_json_sha256 &&
        intent.seat.recipe_sha256 === seat.recipe_sha256 &&
        same(reservation.payload.budget, {
          input_tokens_upper_bound: variant.input_tokens_upper_bound,
          extra_overhead_tokens: variant.extra_overhead_tokens,
        }),
      "historical reservation differs from actual assessed request"
    );
    need(
      evidence.state === "captured" &&
        evidence.capture_sha256 === capture.capture_sha256 &&
        evidence.receipt_sha256 === capture.provenance.sha256 &&
        same(evidence.measured, authenticMeasured(receipt, reservation)),
      "historical accounting differs from authentic capture usage"
    );
  }
}
async function context(config: any, policy: any, counter: any) {
  exact(policy, [
    "schema_version",
    "plan",
    "scope",
    "controller_policy_sha256",
    "question_contract",
    "members",
    "limits",
    "note_counter_identity",
    "policy_sha256",
  ]);
  exact(policy.plan, ["logical_root", "sha256"]);
  need(
    policy.schema_version === "council-staged-reading-policy/v1" &&
      policy.policy_sha256 === config.expected_policy_sha256 &&
      digest(policy, "policy_sha256") === policy.policy_sha256 &&
      policy.plan.sha256 === config.expected_plan_sha256 &&
      same(policy.scope, config.expected_scope) &&
      policy.controller_policy_sha256 === config.expected_controller_policy_sha256,
    "policy differs from independent authority"
  );
  need(
    ![".council-attempts", ".council-controllers", ".council-readings"].includes(
      policy.plan.logical_root?.split("/")[0]
    ),
    "preparation overlaps reserved storage"
  );
  exact(policy.note_counter_identity, ["id", "revision", "artifact_sha256"]);
  need(
    label(policy.note_counter_identity.id) &&
      label(policy.note_counter_identity.revision) &&
      HASH.test(policy.note_counter_identity.artifact_sha256) &&
      counter &&
      typeof counter.countNote === "function" &&
      same(counter.identity, policy.note_counter_identity),
    "independently selected note counter differs"
  );
  exact(policy.limits, [
    "max_note_bytes",
    "max_note_tokens",
    "max_items",
    "max_reread_requests",
    "max_reread_bytes",
    "max_records",
  ]);
  const caps: any = {
    max_note_bytes: 1048576,
    max_note_tokens: Number.MAX_SAFE_INTEGER,
    max_items: 1024,
    max_reread_requests: 256,
    max_reread_bytes: Number.MAX_SAFE_INTEGER,
    max_records: 4096,
  };
  for (const key of Object.keys(caps))
    need(
      Number.isSafeInteger(policy.limits[key]) &&
        policy.limits[key] > 0 &&
        policy.limits[key] <= caps[key],
      "invalid finite reading limit"
    );
  questionContract(policy.question_contract);
  need(
    sha256Bytes(canonicalJson(policy.question_contract)) === policy.scope.question_set_sha256,
    "question contract differs from frozen scope"
  );
  const prep = await readVerifiedPreparation({
    controlledRoot: config.controlled_root,
    logicalRoot: policy.plan.logical_root,
    expectedPlanSha256: config.expected_plan_sha256,
    expectedScope: config.expected_scope,
  });
  const controller = await verifyController({
    controlledRoot: config.controlled_root,
    expectedPlanSha256: config.expected_plan_sha256,
    expectedPolicySha256: config.expected_controller_policy_sha256,
    expectedScope: config.expected_scope,
    nowMs: Date.now(),
  });
  need(same(controller.policy.plan, policy.plan), "controller preparation differs");
  const history = await readController({ handle: controller, nowMs: Date.now() });
  need(!history.state.stopped, "controller is stopped after a bound violation");
  await verifyTerminalHistory(config, prep, history);
  const { plan } = prep;
  need(
    Array.isArray(policy.members) &&
      policy.members.length > 0 &&
      policy.members.length === plan.seats.length &&
      policy.members.length <= 1024,
    "every planned seat needs one reading owner"
  );
  const owners = new Set(),
    seats = new Set(),
    nodes = new Map<string, any>();
  const sourceIndex = plan.sources.map(({ id, sha256, byte_length }: any) => ({
    id,
    sha256,
    byte_length,
  }));
  const fileMap = new Map(prep.files.map((file: any) => [file.path, file]));
  const embedded = new Map<string, string>();
  for (const chunk of plan.chunks) {
    const prompt = renderReadingPrompt({
      questionContract: policy.question_contract,
      sources: sourceIndex,
      deliveredRanges: chunk.ranges,
    });
    embedded.set(
      chunk.id,
      await embedSourcesIntoPrompt(
        prompt,
        chunk.source_manifest,
        resolve(ROOT, chunk.source_manifest_path),
        async (entry: any) => {
          const file: any = fileMap.get(entry.path);
          need(
            file && file.sha256 === entry.sha256,
            "embedded file differs from verified preparation"
          );
          return file.bytes;
        }
      )
    );
  }
  for (const member of policy.members) {
    exact(member, ["owner_id", "member", "seat_id", "leaves"]);
    need(
      [member.owner_id, member.member, member.seat_id].every((x) => label(x)) &&
        !owners.has(member.owner_id) &&
        !seats.has(member.seat_id),
      "duplicate or invalid member mapping"
    );
    owners.add(member.owner_id);
    seats.add(member.seat_id);
    const seat = plan.seats.find((s: any) => s.seat_id === member.seat_id);
    need(
      seat && Array.isArray(member.leaves) && member.leaves.length === plan.chunks.length,
      "member must cover original chunks exactly"
    );
    let descriptor: any, recipe: any;
    for (let index = 0; index < member.leaves.length; index++) {
      const leaf = member.leaves[index],
        chunk = plan.chunks[index];
      exact(leaf, ["node_id", "chunk_id"]);
      need(
        label(leaf.node_id) && leaf.chunk_id === chunk.id && !nodes.has(leaf.node_id),
        "leaf mapping is duplicated or reordered"
      );
      const node = controller.policy.nodes.find((n: any) => n.node_id === leaf.node_id);
      need(
        node &&
          node.owner_id === member.owner_id &&
          node.member === member.member &&
          node.seat_id === member.seat_id &&
          same(node.output_reservations, seat.output_reservations),
        "leaf differs from original controller declaration"
      );
      const assessment = chunk.assessments.find((a: any) => a.seat_id === member.seat_id);
      need(
        assessment &&
          assessment.system_prompt_sha256 === sha256Bytes("") &&
          assessment.user_prompt_sha256 === sha256Bytes(embedded.get(chunk.id)),
        "preparation did not use the canonical reading prompt"
      );
      // Transport is fixed by the assessment recipe pin; try only the two supported routes.
      if (!descriptor) {
        for (const transport of ["buffered", "sse"] as const) {
          const candidate: any = {
            seat_id: member.seat_id,
            member: member.member,
            provider: "openrouter",
            transport,
            context_ceiling: seat.context_ceiling,
            output_reservations: seat.output_reservations,
          };
          const described = await describeStagedSeat(candidate);
          if (described.recipe_sha256 === seat.recipe_sha256) {
            descriptor = described;
            recipe = selectRecipe(candidate);
            break;
          }
        }
        need(descriptor, "planned recipe differs from current Facilitator");
      }
      need(
        assessment.recipe_sha256 === descriptor.recipe_sha256 &&
          assessment.facilitator_sha256 === descriptor.descriptor.facilitator_sha256,
        "assessment Facilitator pin differs"
      );
      for (const variant of assessment.request_variants) {
        const request = recipe.buildBody({
          userPrompt: embedded.get(chunk.id),
          systemPrompt: null,
          maxTokens: variant.output_reservation,
          transport: descriptor.descriptor.transport,
        });
        need(
          sha256Bytes(JSON.stringify(request)) === variant.request_json_sha256,
          "assessed request differs from canonical reading request"
        );
      }
      nodes.set(leaf.node_id, { member, leaf, chunk, index, seat, descriptor, recipe, assessment });
    }
  }
  need(nodes.size <= policy.limits.max_records, "leaf allocation exceeds record limit");
  return { config, policy, prep, history, nodes };
}
/**
 * Shared authentic success check; returned bytes are data, never acceptance authority.
 *
 * `servedProviders` is the frozen recipe's admitted provider list (null for an unpinned recipe),
 * derived by the caller from the recipe it has matched against the plan's `recipe_sha256`, never
 * from the receipt (scaffold#917). It is required: omitting it is refused, not treated as unpinned.
 */
export async function readSuccessfulReadingCapture({
  recovered,
  reservation,
  reconciliation,
  model,
  declaredEffort,
  servedProviders,
  controlledRoot,
  maxNoteBytes,
}: any) {
  need(recovered.state === "captured", "attempt has no verified immutable capture");
  need(
    servedProviders === null ||
      (Array.isArray(servedProviders) &&
        servedProviders.length > 0 &&
        servedProviders.every((name: unknown) => typeof name === "string" && name.trim().length > 0)),
    "the frozen recipe's routing policy is required"
  );
  const { capture, receipt } = recovered;
  const evidence = reconciliation.payload.evidence;
  need(
    evidence.state === "captured" &&
      evidence.classification === "success" &&
      evidence.reason === "success" &&
      evidence.capture_sha256 === capture.capture_sha256 &&
      evidence.receipt_sha256 === capture.provenance.sha256,
    "capture was not successfully accounted"
  );
  const actual = receipt.attempts[0],
    identity = receipt.final.verification,
    effort = receipt.final.effort_verification;
  need(
    same(authenticMeasured(receipt, reservation), evidence.measured),
    "controller measured usage differs from authentic receipt"
  );
  need(
    receipt.final.outcome === "success" &&
      actual.outcome === "success" &&
      actual.finish_reason !== "length" &&
      capture.output &&
      label(identity.observed) &&
      identity.observed === model &&
      actual.model_field === model &&
      identity.result === "PASS" &&
      identity.match_kind !== "none" &&
      identity.model_identity_source === "provider_response" &&
      actual.model_identity_source === "provider_response",
    "actual model identity or successful bounded output is unverified"
  );
  need(
    effort.result === "PASS" &&
      effort.declared === (declaredEffort ?? null) &&
      effort.evidence === "reasoning_tokens" &&
      (!(declaredEffort && declaredEffort !== "none") ||
        (Number.isSafeInteger(effort.observed_reasoning_tokens) &&
          effort.observed_reasoning_tokens > 0)),
    "required effort evidence is unverified"
  );
  // A reading is accepted only when the receipt shows the pin held (PASS), or, for a genuinely
  // unpinned recipe, NOT_PINNED. FAIL and UNVERIFIABLE are refused. A receipt from a Facilitator
  // before 1.14.0 carries no complete observation list and is not accepted as a new reading;
  // its capture bytes stay unchanged and still re-verify under the historical storage rules.
  // The caller matched the recipe against the installed Facilitator, so that Facilitator produced
  // this receipt and its version is known exactly; a relabelled receipt cannot claim the legacy rule.
  need(
    receipt.facilitator_version === FACILITATOR_VERSION &&
      stagedRoutingContract(receipt.facilitator_version) === "current",
    "a reading needs routing evidence from the installed Facilitator that produced it"
  );
  need(
    stagedRoutingProblem(receipt, servedProviders) === null &&
      receipt.final.provider_verification.result === (servedProviders ? "PASS" : "NOT_PINNED"),
    "routing evidence does not show the provider pin held"
  );
  const sources = await freezeSources({
    sourceRoot: controlledRoot,
    inputs: [{ id: "member-note", ...capture.output }],
    limits: {
      max_source_bytes: maxNoteBytes,
      max_total_bytes: maxNoteBytes,
      max_sources: 1,
      max_chunks: 1,
      max_assessments: 1,
    },
  });
  const bytes = sources[0].bytes;
  return bytes;
}

async function expectedLeaf(
  ctx: any,
  nodeId: string,
  attemptId: string,
  counter: any,
  previousAcceptedSha256: string | null,
  savedWitness?: any
) {
  const binding = ctx.nodes.get(nodeId);
  need(binding && label(attemptId), "unknown node or attempt");
  const { member, leaf, chunk, seat, descriptor, recipe, assessment } = binding;
  const reservation = ctx.history.events.find(
    (e: any) => e.type === "reservation" && e.payload.attempt.attempt_id === attemptId
  );
  const reconciliation = ctx.history.events.find(
    (e: any) => e.type === "reconciliation" && e.payload.attempt_id === attemptId
  );
  need(reservation && reconciliation, "attempt requires completed controller accounting");
  const a = reservation.payload.attempt;
  need(
    a.node_id === nodeId &&
      a.owner_id === member.owner_id &&
      a.member === member.member &&
      a.seat_id === member.seat_id,
    "attempt belongs to another owner or node"
  );
  const recovered = await inspectAttemptRecovery({
    controlledRoot: ctx.config.controlled_root,
    attemptRoot: `.council-attempts/${attemptId}`,
    expectedIntentSha256: a.intent_sha256,
    expectedPlanSha256: ctx.config.expected_plan_sha256,
    expectedScope: ctx.config.expected_scope,
    expectedOwnerId: member.owner_id,
    expectedNodeId: nodeId,
  });
  need(recovered.state === "captured", "attempt has no verified immutable capture");
  const { intent, capture, receipt } = recovered;
  const operationId = readingOperationId({
    policySha256: ctx.policy.policy_sha256,
    ownerId: member.owner_id,
    nodeId,
    chunkId: chunk.id,
  });
  const variant = assessment.request_variants.find(
    (v: any) => v.output_reservation === intent.seat.output_reservation
  );
  need(
    variant &&
      intent.operation_id === operationId &&
      same(intent.plan, ctx.policy.plan) &&
      intent.controller?.policy_sha256 === ctx.policy.controller_policy_sha256 &&
      intent.inputs.source_manifest.path === chunk.source_manifest_path &&
      intent.inputs.source_manifest.sha256 ===
        ctx.prep.plan.files.find((f: any) => f.path === chunk.source_manifest_path)?.sha256 &&
      intent.request_json_sha256 === variant.request_json_sha256 &&
      intent.inputs.user_prompt_sha256 === assessment.user_prompt_sha256 &&
      intent.inputs.system_prompt_sha256 === assessment.system_prompt_sha256,
    "captured operation or request differs from reading leaf"
  );
  need(
    intent.seat.recipe_sha256 === descriptor.recipe_sha256 &&
      intent.seat.facilitator_sha256 === descriptor.descriptor.facilitator_sha256 &&
      intent.seat.declared_model === descriptor.descriptor.declared_model &&
      intent.seat.transport === descriptor.descriptor.transport &&
      intent.seat.context_ceiling === seat.context_ceiling,
    "captured seat differs from current pin"
  );
  const budget = reservation.payload.budget;
  need(
    a.output_reservation === intent.seat.output_reservation &&
      a.context_ceiling === intent.seat.context_ceiling &&
      a.request_json_sha256 === intent.request_json_sha256 &&
      budget.input_tokens_upper_bound === variant.input_tokens_upper_bound &&
      budget.extra_overhead_tokens === variant.extra_overhead_tokens,
    "reservation differs from the exact assessed request"
  );
  const spend = reservation.payload.spend_witness;
  need(
    spend.model === intent.seat.declared_model &&
      spend.route === intent.seat.recipe_sha256 &&
      spend.request_json_sha256 === intent.request_json_sha256,
    "spend reservation differs from actual request"
  );
  const request =
    descriptor.descriptor.request_templates[
      seat.output_reservations.indexOf(intent.seat.output_reservation)
    ];
  const bytes = await readSuccessfulReadingCapture({
    recovered,
    reservation,
    reconciliation,
    model: request.model,
    declaredEffort: recipe.declaredEffort,
    servedProviders: recipe.servedProviders ? [...recipe.servedProviders] : null,
    controlledRoot: ctx.config.controlled_root,
    maxNoteBytes: ctx.policy.limits.max_note_bytes,
  });
  const validated = validateInitialNote({
    bytes,
    sources: ctx.prep.sources,
    deliveredRanges: chunk.ranges,
    questionIds: ctx.policy.question_contract.questions.map((q: any) => q.id),
    limits: {
      max_note_bytes: ctx.policy.limits.max_note_bytes,
      max_items: ctx.policy.limits.max_items,
      max_reread_requests: ctx.policy.limits.max_reread_requests,
      max_reread_bytes: ctx.policy.limits.max_reread_bytes,
    },
  });
  const witness =
    savedWitness ??
    (await assessNote({
      counter,
      expectedIdentity: ctx.policy.note_counter_identity,
      bytes,
      model: request.model,
      recipeSha256: descriptor.recipe_sha256,
      maxTokens: ctx.policy.limits.max_note_tokens,
    }));
  const record = seal(
    {
      schema_version: "council-staged-accepted-leaf/v1",
      policy_sha256: ctx.policy.policy_sha256,
      plan_sha256: ctx.policy.plan.sha256,
      scope: ctx.policy.scope,
      owner_id: member.owner_id,
      member: member.member,
      seat_id: member.seat_id,
      node_id: nodeId,
      chunk_id: leaf.chunk_id,
      operation_id: operationId,
      previous_accepted_sha256: previousAcceptedSha256,
      attempt: {
        attempt_id: attemptId,
        intent_sha256: intent.intent_sha256,
        request_json_sha256: intent.request_json_sha256,
        capture_sha256: capture.capture_sha256,
        provenance_sha256: capture.provenance.sha256,
        reconciliation_sha256: reconciliation.event_sha256,
      },
      note: { sha256: validated.note_sha256, byte_length: bytes.length },
      note_witness: witness,
      ranges: chunk.ranges,
      reread_requests: validated.rereads,
    },
    "accepted_sha256"
  );
  return { record, noteBytes: bytes };
}
async function checkedLeaves(ctx: any, handle: any, counter: any, saved?: Map<string, any>) {
  const bundles = await readAcceptedLeaves({ handle });
  const accepted = new Map<string, any>();
  for (const bundle of bundles) {
    const binding = ctx.nodes.get(bundle.record.node_id);
    need(binding, "unknown accepted node");
    const prior = binding.member.leaves[binding.index - 1];
    const previous = prior ? accepted.get(prior.node_id)?.accepted_sha256 : null;
    need(previous !== undefined, "accepted leaves do not form an initial ordered prefix");
    if (saved)
      need(saved.has(bundle.record.node_id), "accepted set changed during verification; retry");
    const expected = await expectedLeaf(
      ctx,
      bundle.record.node_id,
      bundle.record.attempt?.attempt_id,
      counter,
      previous,
      saved?.get(bundle.record.node_id)?.note_witness
    );
    need(
      same(expected.record, bundle.record) && expected.noteBytes.equals(bundle.noteBytes),
      "accepted leaf dependencies have changed"
    );
    for (const prior of binding.member.leaves.slice(0, binding.index))
      need(accepted.has(prior.node_id), "accepted leaves do not form an initial ordered prefix");
    accepted.set(bundle.record.node_id, bundle.record);
  }
  return accepted;
}
export async function createReadingPolicy({ config: input, policy: inputPolicy, counter }: any) {
  const config = configSnapshot(input),
    policy = structuredClone(inputPolicy);
  await context(config, policy, counter);
  const handle = await createReadingStore({ ...storeArgs(config), policy });
  return {
    reading_root: handle.logicalRoot,
    policy_sha256: policy.policy_sha256,
    reading_accepted: false,
    reading_proof_complete: false,
    provider_dispatched: false,
  };
}
export async function acceptInitialReading({ config: input, attemptId, nodeId, counter }: any) {
  const config = configSnapshot(input);
  const handle = await verifyReadingStore(storeArgs(config));
  const ctx = await context(config, handle.policy, counter);
  const accepted = await checkedLeaves(ctx, handle, counter);
  const binding = ctx.nodes.get(nodeId);
  need(binding, "unknown reading leaf");
  for (const prior of binding.member.leaves.slice(0, binding.index))
    need(accepted.has(prior.node_id), "prior chunks must be accepted first");
  const prior = binding.member.leaves[binding.index - 1];
  const previous = prior ? accepted.get(prior.node_id).accepted_sha256 : null;
  const candidate = await expectedLeaf(ctx, nodeId, attemptId, counter, previous);
  // Finish all counter callbacks, then re-read authority and dependencies using
  // only those detached witnesses. Do not invoke trusted modules after recheck.
  const fresh = await context(config, handle.policy, counter);
  const again = await expectedLeaf(
    fresh,
    nodeId,
    attemptId,
    counter,
    previous,
    candidate.record.note_witness
  );
  need(
    same(candidate.record, again.record) && candidate.noteBytes.equals(again.noteBytes),
    "dependencies changed during acceptance"
  );
  const witnessed = new Map(accepted);
  witnessed.set(nodeId, candidate.record);
  await checkedLeaves(fresh, handle, counter, witnessed);
  const record = await publishAcceptedLeaf({ handle, nodeId, ...candidate });
  return {
    accepted: record,
    reading_accepted: true,
    reading_proof_complete: false,
    provider_dispatched: false,
  };
}
export async function inspectReadings({ config: input, counter }: any) {
  const config = configSnapshot(input),
    handle = await verifyReadingStore(storeArgs(config));
  const ctx = await context(config, handle.policy, counter);
  const counted = await checkedLeaves(ctx, handle, counter);
  // No counter callback is allowed after this final dependency verification.
  const fresh = await context(config, handle.policy, counter);
  const accepted = [...(await checkedLeaves(fresh, handle, counter, counted)).values()];
  const coverage = ctx.policy.members.map((member: any) => {
    const count = accepted.filter((r: any) => r.owner_id === member.owner_id).length;
    return {
      owner_id: member.owner_id,
      accepted_chunks: count,
      required_chunks: member.leaves.length,
      initial_reading_complete: count === member.leaves.length,
    };
  });
  return {
    accepted,
    coverage,
    pending_rereads: accepted.flatMap((r: any) =>
      r.reread_requests.map((request: any) => ({
        owner_id: r.owner_id,
        node_id: r.node_id,
        ...request,
      }))
    ),
    reading_proof_complete: false,
    provider_dispatched: false,
  };
}

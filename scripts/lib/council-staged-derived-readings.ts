/**
 * Purpose: Reconstruct committed notes, historical frontiers and exact pending rereads.
 * Usage: shared by the original-controller runtime; no provider or journal writes here.
 * Returned records are data. The runtime owns callback-free reread and journal commit.
 */
import { resolve } from "node:path";
import { canonicalJson, sha256Bytes } from "./council-staged-sources.mjs";
import {
  derivedNeed as need,
  derivedDigest,
  freezeDerived,
  cloneDerived,
  validateDerivedPacket,
  selectDerivedDelivery,
} from "./council-staged-derived-contract.mjs";
import { assessNote, verifyTrustedNoteCounter } from "./council-staged-note-counter.mjs";
import { validateInitialNote, validateSuccessorNote } from "./council-staged-notes.mjs";
import {
  renderReadingPrompt,
  readingOperationId,
  readSuccessfulReadingCapture,
} from "./council-staged-readings.ts";
import { embedSourcesIntoPrompt, selectRecipe } from "../council-invoke.ts";
import { createCanonicalRequestAssessor } from "./council-staged-request.ts";

const same = (a: any, b: any) => canonicalJson(a) === canonicalJson(b);
const seal = (body: any, key: string) =>
  freezeDerived({ ...body, [key]: derivedDigest(body, key) });
const key = (r: any) => canonicalJson([r.origin_node_id, r.request.id]);
const sourceIndex = (ctx: any) =>
  ctx.prep.plan.sources.map(({ id, sha256, byte_length }: any) => ({ id, sha256, byte_length }));
function pendingUnion(lists: any[], limit: number) {
  const result = new Map();
  for (const list of lists)
    for (const entry of list) {
      const id = key(entry),
        old = result.get(id);
      need(!old || same(old, entry), "Inherited request identities conflict");
      result.set(id, entry);
      need(result.size <= limit, "Outstanding request capacity exhausted");
    }
  return [...result.values()].sort((a: any, b: any) =>
    key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0
  );
}
function ownRequests(nodeId: string, rereads: any[]) {
  return rereads.map((request) => ({
    origin_node_id: nodeId,
    request,
    pending: { start: request.start, end: request.end, sha256: request.sha256 },
  }));
}
function parentBindings(parents: any[]) {
  return parents.map(({ record, event }: any) => ({
    node_id: record.node_id,
    accepted_sha256: record.accepted_sha256,
    event_sha256: event.event_sha256,
    note_sha256: record.note.sha256,
  }));
}
export function readingAcceptancePayload(ctx: any, bundle: any) {
  const r = bundle.record;
  return freezeDerived({
    reading_policy_sha256: ctx.policy.policy_sha256,
    reading_contract_sha256: ctx.history.policy.reading_contract_sha256,
    bundle_sha256: bundle.bundle_sha256,
    accepted_sha256: r.accepted_sha256,
    node_id: r.node_id,
    owner_id: r.owner_id,
    member: r.member,
    seat_id: r.seat_id,
    attempt_id: r.attempt.attempt_id,
    reconciliation_sha256: r.attempt.reconciliation_sha256,
    parents: r.parents.map(({ node_id, accepted_sha256, event_sha256 }: any) => ({
      node_id,
      accepted_sha256,
      event_sha256,
    })),
  });
}
function parentsFor(ctx: any, semantic: any, nodeId: string) {
  const node = ctx.nodes.get(nodeId);
  need(node, "Unknown reading node");
  if (!node.parent_node_ids) return [];
  return node.parent_node_ids.map((id: string) => {
    const parent = semantic.accepted.get(id);
    need(parent && semantic.frontier.has(id), "Parent is not the committed current frontier");
    return parent;
  });
}
export function packetForReading(ctx: any, semantic: any, nodeId: string, attemptId: string) {
  const node = ctx.nodes.get(nodeId);
  need(node?.parent_node_ids && !semantic.accepted.has(nodeId), "Successor slot is unavailable");
  const parents = parentsFor(ctx, semantic, nodeId);
  const requests = pendingUnion(
    parents.map((p: any) => p.record.outstanding_requests),
    ctx.policy.limits.max_reread_requests
  );
  const packet = {
    schema_version: "council-staged-derived-packet/v1",
    attempt_id: attemptId,
    plan_sha256: ctx.policy.plan.sha256,
    scope: ctx.policy.scope,
    reading_policy_sha256: ctx.policy.policy_sha256,
    node_id: nodeId,
    owner_id: node.owner_id,
    member: node.member,
    seat_id: node.seat_id,
    source_index: sourceIndex(ctx),
    parents: parentBindings(parents).map((p: any, i: number) => ({
      ...p,
      note_utf8: parents[i].note_utf8,
    })),
    requests,
    ...selectDerivedDelivery({ policy: ctx.policy, preparation: ctx.prep, requests }),
  };
  validateDerivedPacket({ packet, policy: ctx.policy, preparation: ctx.prep });
  return freezeDerived(packet);
}
export function verifyReadingPacket(ctx: any, semantic: any, packet: any) {
  const expected = packetForReading(ctx, semantic, packet.node_id, packet.attempt_id);
  need(
    same(packet, expected),
    "Derived packet differs from authentic parents or outstanding requests"
  );
}

// The canonical initial prompt includes original range metadata, beyond generic request accounting.
async function initialBindings(ctx: any, counter: any) {
  const files = new Map(ctx.prep.files.map((f: any) => [f.path, f]));
  const bindings = new Map();
  for (const chunk of ctx.prep.plan.chunks) {
    const prompt = renderReadingPrompt({
      questionContract: ctx.policy.question_contract,
      sources: sourceIndex(ctx),
      deliveredRanges: chunk.ranges,
    });
    const embedded = await embedSourcesIntoPrompt(
      prompt,
      chunk.source_manifest,
      resolve(ctx.config.controlled_root, chunk.source_manifest_path),
      async (entry: any) => {
        const file: any = files.get(entry.path);
        need(file && file.sha256 === entry.sha256, "Initial source differs from preparation");
        return file.bytes;
      }
    );
    const assessor = await createCanonicalRequestAssessor({
      seats: ctx.config.seats,
      userPrompt: prompt,
      counter,
    });
    const assessed = await assessor.assessRequest({
      chunk_id: chunk.id,
      ranges: chunk.ranges,
      source_manifest_path: chunk.source_manifest_path,
      source_manifest: chunk.source_manifest,
      files: chunk.source_manifest.sources.map((entry: any) => files.get(entry.path)),
    });
    need(
      same(assessed, chunk.assessments),
      "Initial full request recount differs from preparation"
    );
    for (const member of ctx.policy.members) {
      const seat = ctx.config.seats.find((s: any) => s.seat_id === member.seat_id);
      const recipe = selectRecipe(seat),
        description = ctx.descriptions.get(member.seat_id);
      const assessment = chunk.assessments.find((a: any) => a.seat_id === member.seat_id);
      need(
        assessment &&
          assessment.system_prompt_sha256 === sha256Bytes("") &&
          assessment.user_prompt_sha256 === sha256Bytes(embedded) &&
          assessment.recipe_sha256 === description.recipe_sha256 &&
          assessment.facilitator_sha256 === description.descriptor.facilitator_sha256,
        "Preparation did not use the canonical initial reading prompt and recipe"
      );
      for (const variant of assessment.request_variants) {
        const body = recipe.buildBody({
          userPrompt: embedded,
          systemPrompt: null,
          maxTokens: variant.output_reservation,
          transport: seat.transport,
        });
        need(
          sha256Bytes(JSON.stringify(body)) === variant.request_json_sha256,
          "Initial canonical request differs from preparation"
        );
      }
      const leaf = member.leaves.find((n: any) => n.chunk_id === chunk.id);
      bindings.set(leaf.node_id, { chunk, assessment });
    }
  }
  return bindings;
}

export async function reconstructReading(
  verification: any,
  semantic: any,
  nodeId: string,
  attemptId: string
) {
  const { ctx, artifacts, noteCounter } = verification,
    node = ctx.nodes.get(nodeId);
  need(node && !semantic.accepted.has(nodeId), "Reading node is unavailable");
  const member = ctx.policy.members.find((m: any) => m.owner_id === node.owner_id);
  const initial = !node.parent_node_ids;
  if (initial) {
    const index = member.leaves.findIndex((n: any) => n.node_id === nodeId);
    need(
      member.leaves.slice(0, index).every((n: any) => semantic.accepted.has(n.node_id)),
      "Initial readings must commit in declared order"
    );
  }
  const reservation = ctx.history.state.reservations[attemptId];
  const reconciliation = ctx.history.state.reconciliations[attemptId];
  const recovered = artifacts.get(attemptId)?.recovery;
  need(
    reservation &&
      reconciliation &&
      recovered?.state === "captured" &&
      reservation.payload.attempt.node_id === nodeId,
    "Reading requires its authentic reconciled capture"
  );
  const { intent } = recovered,
    seat = ctx.config.seats.find((s: any) => s.seat_id === node.seat_id);
  const description = ctx.descriptions.get(node.seat_id),
    recipe = selectRecipe(seat);
  need(
    intent.owner_id === node.owner_id &&
      intent.seat.member === node.member &&
      intent.seat.seat_id === node.seat_id &&
      intent.seat.recipe_sha256 === description.recipe_sha256 &&
      intent.seat.facilitator_sha256 === description.descriptor.facilitator_sha256 &&
      intent.seat.declared_model === description.descriptor.declared_model &&
      intent.seat.transport === seat.transport,
    "Captured reading seat or owner differs"
  );
  const parents = parentsFor(ctx, semantic, nodeId);
  let ranges,
    remaining = [],
    fulfilled: any[] = [];
  if (initial) {
    const { chunk, assessment } = semantic.initial.get(nodeId);
    need(
      intent.operation_id ===
        readingOperationId({
          policySha256: ctx.policy.policy_sha256,
          ownerId: node.owner_id,
          nodeId,
          chunkId: chunk.id,
        }) &&
        intent.inputs.source_manifest.path === chunk.source_manifest_path &&
        intent.inputs.user_prompt_sha256 === assessment.user_prompt_sha256 &&
        intent.inputs.system_prompt_sha256 === assessment.system_prompt_sha256 &&
        assessment.request_variants.some(
          (v: any) =>
            v.output_reservation === intent.seat.output_reservation &&
            v.request_json_sha256 === intent.request_json_sha256
        ),
      "Initial operation or request differs"
    );
    ranges = chunk.ranges;
  } else {
    const packet = ctx.packages.get(attemptId)?.packet;
    need(packet, "Successor request package missing");
    verifyReadingPacket(ctx, semantic, packet);
    ranges = [
      ...new Map(
        packet.deliveries.map((d: any) => [
          canonicalJson(d.range),
          { ...d.range, purpose: "reread" },
        ])
      ).values(),
    ];
    remaining = packet.remaining;
    fulfilled = packet.deliveries.map(({ origin_node_id, request_id, range }: any) => ({
      origin_node_id,
      request_id,
      range,
    }));
  }
  const request =
    description.descriptor.request_templates[
      seat.output_reservations.indexOf(intent.seat.output_reservation)
    ];
  need(request, "Captured output variant is not planned");
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
  const args = {
    bytes,
    sources: ctx.prep.sources,
    deliveredRanges: ranges,
    questionIds: ctx.policy.question_contract.questions.map((q: any) => q.id),
    limits: {
      max_note_bytes: ctx.policy.limits.max_note_bytes,
      max_items: ctx.policy.limits.max_items,
      max_reread_requests: ctx.policy.limits.max_reread_requests,
      max_reread_bytes: ctx.policy.limits.max_reread_bytes,
    },
  };
  const validated = initial
    ? validateInitialNote(args)
    : validateSuccessorNote({
        ...args,
        children: parents.map((p: any) => ({
          node_id: p.record.node_id,
          bytes: Buffer.from(p.note_utf8),
        })),
      });
  const witness = await assessNote({
    counter: noteCounter,
    expectedIdentity: ctx.policy.note_counter_identity,
    bytes,
    model: request.model,
    recipeSha256: description.recipe_sha256,
    maxTokens: ctx.policy.limits.max_note_tokens,
  });
  const record = seal(
    {
      schema_version: "council-staged-accepted-reading/v2",
      policy_sha256: ctx.policy.policy_sha256,
      plan_sha256: ctx.policy.plan.sha256,
      scope: ctx.policy.scope,
      owner_id: node.owner_id,
      member: node.member,
      seat_id: node.seat_id,
      node_id: nodeId,
      kind: initial ? "initial" : "successor",
      operation_id: intent.operation_id,
      attempt: {
        attempt_id: attemptId,
        intent_sha256: intent.intent_sha256,
        request_json_sha256: intent.request_json_sha256,
        capture_sha256: recovered.capture.capture_sha256,
        provenance_sha256: recovered.capture.provenance.sha256,
        reconciliation_sha256: reconciliation.event_sha256,
      },
      parents: parentBindings(parents),
      note: { sha256: validated.note_sha256, byte_length: bytes.length },
      note_witness: witness,
      ranges,
      fulfilled_requests: fulfilled,
      outstanding_requests: pendingUnion(
        [remaining, ownRequests(nodeId, validated.rereads)],
        ctx.policy.limits.max_reread_requests
      ),
    },
    "accepted_sha256"
  );
  return freezeDerived({ record, note_utf8: bytes.toString("utf8") });
}

export async function verifyReadingHistory(verification: any) {
  const { ctx, noteCounter } = verification;
  await verifyTrustedNoteCounter(noteCounter);
  need(
    same(noteCounter.identity, ctx.policy.note_counter_identity),
    "Note counter differs from frozen reading policy"
  );
  const semantic = {
    accepted: new Map(),
    frontier: new Set(),
    initial: await initialBindings(ctx, verification.counter),
  };
  const candidates = new Map(ctx.inventory.candidates.map((b: any) => [b.bundle_sha256, b]));
  for (const event of ctx.history.events) {
    if (event.type === "reservation" || event.type === "dispatch") {
      const attemptId =
        event.type === "reservation" ? event.payload.attempt.attempt_id : event.payload.attempt_id;
      const packet = ctx.packages.get(attemptId)?.packet;
      if (packet) verifyReadingPacket(ctx, semantic, packet);
    }
    if (event.type !== "acceptance") continue;
    const bundle: any = candidates.get(event.payload.bundle_sha256);
    need(
      bundle && same(readingAcceptancePayload(ctx, bundle), event.payload),
      "Acceptance event or bundle bindings differ"
    );
    const expected = await reconstructReading(
      verification,
      semantic,
      event.payload.node_id,
      event.payload.attempt_id
    );
    need(
      same(expected.record, bundle.record) && expected.note_utf8 === bundle.note_utf8,
      "Committed reading differs from authentic note semantics or counter witness"
    );
    semantic.accepted.set(event.payload.node_id, { ...expected, event });
    for (const parent of expected.record.parents) semantic.frontier.delete(parent.node_id);
    semantic.frontier.add(event.payload.node_id);
  }
  return semantic;
}

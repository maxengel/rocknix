# Committed readings on the original controller

`scripts/lib/council-staged-derived-runtime.ts` adds request-history inspection,
admission and publication recovery to the [immutable package contract](council-staged-derived-packages.md).
All requests use the original preparation and controller. Reservations preserve
cumulative calls, complete input/output bounds, spend and the original deadline.

The runtime authenticates initial and successor notes, reconstructs their committed
parent frontier, and preserves original reread identities through interval splits.
Reading policies require a distinct owner ID for every seat. Duplicate owners
refuse before contract hashing or store creation, preserving unambiguous member
lookup during semantic reconstruction.
Only an immutable candidate joined to an acceptance event in the original journal
establishes a reading. Request preparation, storage and request-only inspection
continue to grant no reading credit. Local protocol verification is separate from
semantic research quality, formal council approval and M63 consumer acceptance.

## Independent caller bindings

Every API receives a `DerivedRuntimeConfig` with exactly:

```ts
{
  controlled_root,                     // installed Facilitator root
  expected_plan_sha256,
  expected_scope,                      // complete original scope
  expected_policy_sha256,              // reading policy v2
  expected_controller_policy_sha256,   // original controller v2
  seats,                              // all original seat configurations
  expected_head,                      // optional retained controller checkpoint
  note_counter                        // required for semantic APIs and derived execution
}
```

`note_counter` has exactly `{module_path, artifact_sha256, dependencies?}`. The
entry path is absolute; the optional dependency array has the pin grammar below.
This is independently supplied caller configuration and must match the frozen
reading policy's note-counter identity. It is never read from a packet. Omission
is permitted only for the request-only `inspectDerivedHistory` operation.

Each seat has `seat_id`, `member`, `provider:"openrouter"`, an explicit
`transport:"buffered"|"sse"`, `context_ceiling`, `output_reservations`, and
optional `recipe_sha256`. The re-derived descriptor must equal the original
frozen seat. No package selects a provider route, counter module or executable.
`expected_head` detects rollback of a retained prefix. The verifier separately
captures the exact current head for each new transition.

Load the independently selected request counter with
`loadTrustedCounter({modulePath, expectedSha256, dependencies})` from
`council-staged-invocation.ts`. The semantic coordinator loads the note counter through `loadTrustedNoteCounter`
in `council-staged-note-counter.mjs`, using the config binding above. Load spend through
`loadTrustedSpendEvaluator` in `council-staged-controller.ts` with the same
argument shape. `dependencies` is an optional array of exact
`{path, sha256, byte_length}` records: absolute paths, at most 64 files and
256 MiB in total. Empty means the reviewed capability is self-contained.
The caller must supply its complete deterministic dependency set; the loader
cannot infer arbitrary JavaScript imports or hidden external state. Keep the
archived module, dependency bytes and runtime needed to reproduce old requests.

Entry and dependency bytes are checked before import, around callbacks and
after the final callback. The private loader registry provides the final file
check without executing the capability. A copied identity, saved `verified:true`
or caller-made counter is insufficient. Derived APIs require the trusted loader;
legacy initial APIs retain their existing caller interface.

## Prepare and dispatch

```ts
const prepared = await prepareDerivedAttempt({
  config, packet, operationId, outputReservation, limits,
  requestCounter, evaluator,
  previousAttemptId,          // optional; original controller retry rules apply
  explicitAmbiguousReplay,    // optional, false by default
});
```

Build authentic input with
`buildReadingPacket({config, requestCounter, nodeId, attemptId})`. It resolves the
exact declared parents from committed history, carries their raw notes and all
outstanding request envelopes, and uses the deterministic original-range selector.
Preparation independently repeats that verification at its admission head.

The packet follows the strict Gate 2 schema. `limits` has exactly
`max_client_dispatches:1`, `per_attempt_timeout_ms`, `total_timeout_ms`. The
derived prompt is `renderDerivedPrompt({questionContract})`; this version has
no system prompt. The packet contains raw notes and selected original ranges;
the assessment wrapper is its source manifest.

Preparation freshly recounts historical derived reservations and constructs the
new canonical request for every original output reservation. It publishes the
complete package, evaluates current spend, rechecks immutable dependencies and
the exact controller head without further counter/evaluator callbacks, and
reserves once. Only then does it publish the canonical v3 attempt. Failure after
reservation retains the charge and the complete request package.

The result contains the exact `intent`, `invoker_config`, original `reservation`,
and `output_path`, `provenance_path`, `source_manifest_path`. Persist the config
as caller input for the existing canonical invoker. Derived configs have a
`derived:{expected_policy_sha256,seats,note_counter}` branch; initial configs retain their
`chunk_id`. They are explicit versions, not interchangeable request disguises.

Use `runControlledAttempt` or the canonical `council-invoke.ts` staged flags.
Both retain independent module/SHA selection. Optional dependency manifests
reach the actual CLI through `--staged-counter-dependencies FILE` and
`--staged-spend-dependencies FILE`; each file contains the pin array above.
The thin `runControlledAttempt` adapter accepts `counterDependencies` and
`spendDependencies` filenames. The request package never supplies these files. The note-counter entry and its
dependencies travel in the independent invoker configuration.

The actual dispatch guard independently recounts history and the current request,
authenticates accepted notes and checks the current parent frontier,
reproduces current spend, checks dependencies, and claims the original journal's
exact next event. A competing writer makes that verification stale; it cannot
rebase onto the new head. The canonical single-dispatch claim then binds the exact
wire string to buffered/SSE capture. A changed quote cannot overwrite the original
reservation: its complete evidence must reproduce and remain valid. Publication,
inspection and recovery never themselves call a provider.

## Inspect history and recover publication

`inspectDerivedHistory({config, requestCounter})` recounts every reserved derived
package once per invocation, including failed, unaccepted, unreconciled and
not-dispatched attempts. It compares every output variant and the full nested
witness, then joins reservations to actual attempt/capture evidence. Original
initial reservations retain their original-chunk checks. Captured usage must
agree with recorded accounting and fit its reservation; unknown measured spend
stays unknown. An unreconciled request remains unreconciled.

The result contains `request_history_verified`, `head`,
`derived_requests_recounted`, `totals`, and the original `deadline_ms`, with no
reading credit. It makes no current billing-evaluator call. Historical quotes
are checked at their original event timestamps by journal replay. Later quote
or deadline expiry alone does not invalidate history or extend dispatch authority.

`recoverDerivedAttemptPublication({config, attemptId, requestCounter})` recounts
the existing reservation and complete package, then publishes the exact intent
if its directory is absent. It never reserves again or obtains a new quote.
An identical complete undispatched attempt can be returned idempotently. A
present incomplete directory is refused and retained. Existing dispatch or
terminal reconciliation forbids this publication recovery. A concurrent journal
change can leave a complete intent but makes the recovery result stale; inspect
the retained state, and let normal guarded dispatch enforce terminal authority.

To stop an unstarted or ambiguous execution, the existing
`reconcileControlledAttempt` API retains its explicit `acknowledgeStopped`
decision. Observation alone cannot prove that an earlier invoker stopped.
No-dispatch/unknown reconciliation preserves charges. A missing or incomplete
reserved package always refuses complete request-history verification.

## Accept and inspect committed readings

```ts
const accepted = await acceptCommittedReading({
  config, requestCounter, nodeId, attemptId,
});
const readings = await inspectCommittedReadings({config, requestCounter});
```

Initial v2 notes and successors share this acceptance API. The original initial
preparation must use `createReadingRequestAssessor` and `renderReadingPrompt`;
initial attempts use `readingOperationId` with the exact policy, owner, node and
chunk. Existing initial-only v1 policies keep `acceptInitialReading` and its
legacy storage. No frozen v1 policy is upgraded in place.

Acceptance requires a successfully reconciled authentic canonical capture,
verified provider model identity and declared effort, bounded raw note and
independent note-token witness. Initial leaves commit in declared order. A
successor must preserve the pure validator's evidence, dependencies and uncertainty
from every declared parent. Its request packet must match those parents' complete
outstanding envelopes. An empty new request list leaves inherited remainders intact.
Accepted successors consume their parent frontier; a competing branch can no longer
use it for a new dispatch or acceptance. Historical reservations and dispatches are
checked at their own earlier frontiers, including failed and unused attempts.

The verifier replays committed ancestry once per node and freshly recounts every
original chunk and reserved derived request with all frozen output variants. It
publishes a bounded candidate under
`.council-readings/<plan>/acceptance-candidates/<bundle-sha256>.json`, containing
raw note, complete acceptance record and prior head H. Candidate hashes contain no
future event hash. After every request/note callback, it rereads the immutable
dependencies and pinned code without callbacks, requires the same H and frontier,
and commits through `commitReadingAcceptance` at H. It verifies the event/bundle
pair before returning `reading_accepted:true`. A concurrent different winner
requires fresh verification; no witness is rebased automatically.

The acceptance result contains `record`, `note_utf8` and the committed `event`.
An identical already committed attempt returns the same event after full semantic
verification. A different attempt for the accepted node refuses. New acceptance
returns `reading_proof_complete:false`; obtain the current whole-reading result
from `inspectCommittedReadings`. Its result includes `accepted`, `frontier`,
`outstanding_requests`, `head`, cumulative `totals` and original `deadline_ms`.
`reading_proof_complete` means all declared initial leaves are committed, the
current frontier has no pending requests and the controller is not stopped. It
establishes this bounded protocol result, not a research or council verdict.

| Retained state | Recovery |
| --- | --- |
| Complete candidate without a commit | Inert. Reverify and commit at a fresh verified head; no request is fulfilled by the file. |
| Complete identical committed pair | Verify and return the same acceptance without another event or retirement. |
| Partial candidate, temporary name or hard-link alias | Retain and refuse; no automatic repair. |
| Commit with missing/mismatched candidate | Refuse semantic credit and preserve journal charges. |
| Partial journal event | Retain and refuse replay; never skip or recreate its slot. |
| Different accepted winner | Refuse the stale candidate; retain its bytes as evidence. |

Candidate count and byte limits cover inert files too. Publication serializes
the capacity check with a fixed-size `.publication.pending` marker and rechecks
capacity after acquiring it. Only its creating invocation can remove the marker;
a crashed marker is retained and refused. Unlinking the per-candidate temporary
alone does not finish publication. The marker is removed and the directory synced
before the candidate becomes eligible for journal commit. An acceptance may finish
after the dispatch deadline using the original monotonic clock, but no pending
unreconciled dispatch or stopped controller may commit. Acceptance neither charges
nor refunds token, output, call or spend quotas.

## Prove a member is ready for composition

Call buildCompositionProof({config, requestCounter, selection}), where selection
is independently supplied coordinator data with exactly owner_id, member, seat_id
and root_node_id. The selected root must be the member's sole current frontier,
cover every required initial leaf and every accepted node of that member, and
have no outstanding rereads. All of that member's reservations must be reconciled,
and the original controller must not be stopped. Another member can still be
reading; its history is verified too, but its incomplete work does not block this
member. The existing reading_proof_complete summary does not require a single
root and is insufficient for this gate.

The immutable result is council-staged-composition-proof/1, bounded to4MiB of
encoded JSON. It binds scope, plan/reading/controller policy digests, the exact
global head, explicit selection, required leaves, the exact raw root note with
its byte length/digest, and committed ancestry/attempt/capture references.
The raw note retains all structured items, evidence, counterevidence,
uncertainty and dependencies. It is never trimmed to fit. An oversized proof
refuses. composition_readiness_verified is true; provider_dispatched and
finalization_accepted remain false.

A persisted result is a snapshot, not continuing authority. Call
verifyCompositionProof({config, requestCounter, selection, proof}) before using
it. This snapshots strict caller data before awaiting, reconstructs all original
history and semantic ancestry, regenerates the entire expected proof and
compares it before the callback-free final pin/dependency/head checks. A
self-consistent rehash, caller verified flag or callback cannot substitute for
the actual committed stores. Any global head advance, even another seat's
reservation, makes an older proof stale; rebuild after fresh inspection.

These APIs write nothing and cannot reserve or dispatch a composition request,
accept its result, publish canonical output or seal a step. They retain the
original accounting and clock; an expired dispatch deadline can still permit
historical proof verification without authorizing a new call. The proof carries
coordinator identities and raw provenance and must not be included directly in
an anonymous model request. A bounded permitted model projection, finalization
event/capacity and phase/seal integration remain subsequent #577 gates.

## Limits of the evidence

The stores assume a trusted filesystem namespace. Hashes and exact-head journal
claims do not sandbox a hostile process with the same filesystem authority.
Independent digests/checkpoints remain necessary across restarts. Resource work
is bounded by the frozen node, event, package and byte caps; counters are reviewed
caller code and must deterministically reproduce their full witnesses.

Synthetic transport tests exercise the actual assessor, invoker, capture and
controller; they do not certify hosted token overhead, current model capacity,
semantic reading quality or M63 acceptance. The existing pinned Mistral measurer
still refuses to certify an unverified hosted bound. No new provider client or
credential lifecycle is introduced here.


## Composition journal contract (v3, structural only)

The controller store also supports `council-staged-controller-policy/v3` for
new preparations. Its `nodes` map includes reading and composition purposes;
`composition` declares one `{node_id, canonical_output_path}` per owner/seat.
It reserves three records per charged attempt plus one terminal record per
reading or composition node. Failed/unused/retried calls retain the original
calls, input/output tokens, spend and deadline. Existing v1/v2 stores cannot
be upgraded or reset in place.

A composition reservation requires a distinct v4 intent, the matching member's
sole committed root, no unreconciled member reservations, and a proof reference
bound to the exact admission head. `commitCompositionFinalization` takes
`{handle, finalization, expectedCurrentHead, nowMs?}` and appends a typed event
only for the successful reserved composition attempt. It binds the original
root/proof/request, reconciliation, candidate and claim-map hashes, and the
predeclared output path/hash/length. The root must still be current, the member
must have no pending reservation, and all dispatches must be reconciled.
A stopped controller refuses. Idempotent repeats return the exact prior event;
a conflicting winner or stale new commit refuses. A finalized member cannot
reserve or accept further work. Other members retain independent progress.

This low-level store verifies structure only, exactly as for reading acceptance.
It writes no canonical output and authenticates no claim semantics. Its proof
hash is data, not an attestation. The semantic APIs documented above still require
v2 and reject v3; composition dispatch is not enabled. The next runtime gate must
bind the v3 reading core, rebuild the original-controller proof, derive permitted
model inputs, count their exact requests, authenticate captures, validate claims,
and publish/recover canonical output before a finalization can support a seal.
The full prospective contract and remaining tasks are in the #577 composition
admission plan; source/package verification is not consumer acceptance.

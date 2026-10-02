# Durable accounting for staged council attempts

The controller wraps the existing staged Facilitator with a persistent budget.
It reserves call, complete input/output token and spend allowances before a
dispatch, retains charges across interruptions, and verifies captured results
before recording their measured usage. Its journal is local evidence; it does
not certify provider billing or accept a council reading.

The source preparation and standalone capture tools remain available. See
[source preparation](council-staged-sources.md) and
[durable attempt capture](council-staged-attempts.md) for their contracts.
Controller attempts add a policy binding and a dispatch-time budget check.
Existing standalone v1 captures keep their original format and meaning.

## Prerequisites and evidence

Use a verified immutable preparation, the independently expected plan and scope,
the intended owner/member/seat/node mapping, explicit finite execution limits,
and independently selected, hash-pinned request and spend evaluators. Preparation
work limits bound source scanning; they do not supply execution quotas.

A request counter must substantiate the complete input plus provider overhead.
A spend evaluator must substantiate an upper bound in the policy's integer
currency units for the exact request, model and permitted route, with a validity
deadline covering dispatch. An expired quote, missing billing category or a
catalogue price without a defensible bound is insufficient. The configured
evaluator is trusted code; its hash identifies what was reviewed, not proof that
its billing assumptions are true. The operator must review those assumptions
before a live run.

The current Mistral counter reports a local measurement and unverified hosted
bounds. It cannot authorize a controlled dispatch. This package supplies no
production spend evaluator or recommended live spending limits. Tests use
synthetic evaluators and intercepted transports to exercise the real invoker
without contacting a provider.

## Commands

Run the shipped CLI with Node24 and the pinned TypeScript runner:

```sh
npm exec --yes --package=tsx@4.22.4 -- tsx scripts/council-stage-controller.mjs verify --config controller-bindings.json
```

The controller binding file requires `controlled_root`,
`expected_policy_sha256`, `expected_plan_sha256` and `expected_scope`, with an
optional independent `expected_head` checkpoint. Expected
digests and the full scope come from the reviewed policy/preparation, independently
of the journal being verified. Do not discover a digest from an untrusted artifact
and then present that same digest as independent authority.

| Command | Required inputs | Effect |
| --- | --- | --- |
| `create` | `--config`, `--policy`, `--spend-module`, `--spend-sha256` | Verify bindings/evaluator and create the immutable policy once. |
| `verify` | `--config` | Verify policy/history and report derived state without dispatch. |
| `prepare` | `--config`, `--spec`, `--counter-module`, `--counter-sha256`, `--spend-module`, `--spend-sha256`, `--config-output` | Freshly assess and reserve an attempt, then publish its intent and caller configuration. |
| `run` | `--config` naming the prepared attempt configuration, `--prompt-file`, both evaluator module/hash pairs | Invoke the canonical Facilitator with final independent accounting checks. |
| `reconcile` | `--config` naming controller bindings, `--attempt-id` | Verify/recover and account an existing capture without dispatching; incomplete evidence remains pending by default. |
| `next` | `--config`, `--node-id` | Describe the next retry variant or recovery decision without reserving or dispatching. |

`prepare` and `next` accept `--previous-attempt ID`; `--replay-ambiguous` explicitly
requests replay only when incomplete evidence permits it and acknowledges that
the original execution has stopped. `reconcile --acknowledge-stopped` records
that same acknowledgement without preparing a replay. `run` accepts
`--system-prompt-file` when that prompt was bound during preparation. A replay
must supply a new attempt ID in the specification. The actual invoker repeats
the checks; possession of a prepared configuration is not a timeless permission
to dispatch.

Do not interpret `next` as a background retry loop or `verify` as live provider
validation. A `next` result of `ready` describes the node's retry progression;
it remains conditional on fresh `prepare` and dispatch admission, including
controller stop state, remaining quotas, deadline and evaluator evidence.
Recovery and retry decisions can also return stopped or replay-required results.

## Spend evaluator contract

A reviewed module exports `evaluator` with an `identity` containing `id`,
`revision` and `artifact_sha256`, plus an asynchronous `evaluateSpend(input)`.
The identity's artifact digest must equal the independently supplied module
digest. The loader checks the module before/after import and evaluation, rejects
aliases, and binds the evaluator identity to policy. It does not sandbox trusted
module code or certify the truth of its evidence.

The input contains `request_json_sha256`, `model`, `route` (the frozen recipe
digest), `currency`, `units_per_currency`, `input_tokens_upper_bound`,
`extra_overhead_tokens`, `output_reservation` and `deadline_ms`. The successful
result contains exactly:

```text
verified: true
request_json_sha256, model, route, currency, units_per_currency: unchanged bindings
upper_bound_units: nonnegative safe integer
valid_until_ms: future safe integer timestamp
evidence: {method: nonempty string, reference: nonempty string, assumptions: string[]}
```

The monetary bound must cover all billable categories allowed by that recipe and
route, including applicable reasoning/output behavior. The full bounded evidence
object and its digest are retained in the reservation. Keep the underlying
referenced source available for review;
a digest without the original evidence cannot explain or substantiate the bound.
The runtime refuses unverified output and re-evaluates independently before
dispatch. Changing the evaluator or currency requires a new reviewed policy,
not an edit to an existing journal.

## Policy fields

The policy schema is `council-staged-controller-policy/v1`. Its top-level fields
are exactly `schema_version`, `plan`, `scope`, `nodes`, `limits`, `money`, `clock`,
`retry` and `policy_sha256`. The self-digest covers canonical JSON without the
`policy_sha256` field; keep the independent expected digest in the caller binding.

| Field | Contents |
| --- | --- |
| `plan` | The immutable preparation's `logical_root` and `sha256`. |
| `scope` | All eleven preparation scope fields, unchanged. |
| `nodes` | Unique entries with `node_id`, `owner_id`, `member`, `seat_id` and strictly increasing `output_reservations`. |
| `limits` | Positive safe integers: `max_attempts_per_node`, `max_calls_per_member`, `max_input_tokens`, `max_output_tokens`, `max_spend_units`, `max_events`. |
| `money` | `currency`, `units_per_currency` and the reviewed `evaluator_identity` (`id`, `revision`, `artifact_sha256`). |
| `clock` | `started_at_ms` and a later absolute `deadline_ms`. |
| `retry` | Nonnegative `base_delay_ms` and a finite `max_delay_ms` no smaller than the base. |

V1 bounds each policy to 256 nodes and the journal to 4096 events. Reserve enough
event capacity for reservation, dispatch and reconciliation of every permitted
attempt. Those are storage limits, not recommended trial budgets.

### Derived-capable journal primitives (v2)

The store also supports newly created `council-staged-controller-policy/v2`
policies. Strict v2 reading policies and immutable packages use the
[derived package APIs](council-staged-derived-packages.md). The
[derived request runtime](council-staged-derived-runtime.md) adds independent
historical recount, guarded v3 admission/dispatch and publication recovery.
Initial v2 attempts also use exact-head admission on a v2 controller. The initial
preparation CLI still accepts an original chunk specification; derived preparation
uses its explicit API and the canonical invoker's derived config branch. Semantic
reading acceptance uses the [committed reading coordinator](council-staged-derived-runtime.md)
under Scaffold #577; the store event alone supplies no semantic authority.

V2 adds one exact top-level field, `reading_contract_sha256`. It binds the strict
reading core's domain-separated digest, allowing the reading policy to bind the
controller without a digest cycle. The higher coordinator must independently
reproduce that contract and check the full reading-node map. A hash supplied to
the store is data, not proof that this semantic check happened. Existing frozen
v1 policies cannot be upgraded in place.

V2 events use `council-staged-controller-event/v2` and add `acceptance` to the
existing reservation, dispatch and reconciliation types. The acceptance payload
has exactly `reading_policy_sha256`, `reading_contract_sha256`, `bundle_sha256`,
`accepted_sha256`, `node_id`, `owner_id`, `member`, `seat_id`, `attempt_id`,
`reconciliation_sha256`, and `parents`. Each of at most32 ordered parents has
exactly `node_id`, `accepted_sha256`, and `event_sha256`.

`commitReadingAcceptance({handle, acceptance, expectedCurrentHead, nowMs})`
validates the journal relationship: a successful captured reconciliation for
that declared node/owner/member/seat, no earlier acceptance for the node, a
non-stopped journal with no pending dispatch, matching reading bindings, and
unique earlier parent commits for the same owner/member/seat. It does not verify
candidate bytes, counter evidence, note semantics or the policy's parent rules.
Those checks must precede the commit in the higher coordinator. A candidate
file alone is inert, and a structurally valid event alone is not reading proof.

V2 `reserveAttempt`, `claimControllerDispatch` and `commitReadingAcceptance`
require `expectedCurrentHead: {sequence, event_sha256}`. Snapshot this head before
verification and finish callbacks before the final dependency check and store
call. The store copies the head before awaiting, compares it inside the append
transition, and writes only the next exclusive sequence. If another operation
wins, it refuses with `controller_stale_head`; repeat the full verification
before retrying. It never rebases an old verification onto the new head.
This differs from `expectedHead`, whose retained-prefix rollback semantics remain.
V1 callers retain their current append behavior.

Default verification/read timestamps are sampled after journal I/O so a concurrent
writer's newly observed event does not look like a clock rollback. Explicit
`nowMs` values are snapshotted before I/O and retain strict regression checks.

An identical existing acceptance payload returns the original verified event,
including when the journal is full or has since advanced. A different winner
for that node conflicts. The higher coordinator must still verify the existing
bundle before returning accepted success. Neither this read nor acceptance
grants a second dispatch or a refund. Further reservations on an accepted node
are refused. Reconciliation keeps its existing idempotent cleanup behavior.

Acceptance checks monotonic time but can finish after the dispatch deadline.
Calls still obey the original deadline and quote validity. Let N be the total
declared nodes, R the reserved attempts and M the frozen event limit. Creation
requires M >= N+3; reservation requires 3*(R+1)+N <= M; replay preserves
3*R+N <= M, with M <=4096. Plan enough capacity for every intended attempt and
acceptance before creating the controller. Acceptance changes only journal
capacity, leaving cumulative reserved and measured allowances unchanged.

## Journal and recovery

The journal lives under `.council-controllers/<plan_sha256>/` within the controlled
repository root. The root is fixed by the plan: a different caller label or
policy digest cannot create a fresh allowance for that same plan. An immutable
policy binds scope and limits; sequential immutable events record reservations,
dispatch decisions and reconciliations. The digest chain detects gaps and
rewritten records when checked against the expected policy and observed journal.
Detecting a self-consistent historical rollback after a fresh process restart
requires an independently retained expected journal tip; a hash chain by itself
cannot prove that a later valid suffix has not been removed. Preserve that
checkpoint separately when recovery requires rollback detection. Supply it as
`expected_head: {sequence, event_sha256}` in the caller binding (sequence zero
uses a null digest). A later journal may extend that checkpoint; it must preserve
the bound prefix. Omitting it cannot establish that a historical suffix was never
removed before this process started.

Reservation publication is exclusive and durable before dispatch. Contending
processes reread the journal and recompute allowance. Summary totals are derived
from records and cannot authorize work independently. V1 retains the full
conservative reservation even when measured usage is lower. Measured usage and
cost are reported separately; absent values stay null. This can stop a run early,
but avoids reopening allowance through late or uncertain settlement.

Each controller has at most one unreconciled dispatch. Other nodes can reserve
allowance, but their dispatch waits until the earlier attempt is reconciled.
The `run` command reconciles a complete verified capture. A duplicate `run`,
ordinary `next`, or `reconcile` with incomplete evidence leaves it pending;
observing absent artifacts cannot establish that an earlier execution stopped.
Callers of the raw canonical invoker use `reconcile` before continuing. This
prevents a late capture containing an overrun from being ignored by the next
dispatch.

A crash after reservation retains the charge even if no dispatch is proven.
Complete raw artifacts can be captured and reconciled without another call.
A dispatched attempt with genuinely incomplete evidence requires an explicit
recovery decision. First establish that its original invoker has stopped and
can no longer publish a capture; then use `reconcile --acknowledge-stopped`, or supply
`--replay-ambiguous` to `next`/`prepare`. These flags are operator assertions, not
automatic liveness checks. The local journal cannot prove remote cancellation;
unknown provider usage remains unknown and its full reservation remains charged.
The replay uses a new ID and remains separately charged.
Existing malformed or changed evidence is an integrity failure, not permission
to replay. Duplicate identical reconciliation is idempotent; a different capture
for the same reservation conflicts. Preserve partial records for diagnosis.

Do not delete or rename a controller journal to resume an interrupted run, edit
policy/totals in place, move source preparations, or reuse an old attempt ID.
These operations destroy the accounting history the guard depends on. Like the
preparation and capture stores, the journal requires a trusted local filesystem
namespace; it does not sandbox a hostile process running as the same user.

## Time and retry behavior

The absolute policy deadline includes preparation, retries, backoff and downtime.
Restarting does not reset it. Persisted not-before times prevent immediate retry
after restart. The actual invoker rechecks remaining time at dispatch, after
awaited verification and durable reservation work. Each live handle rejects time
earlier than its highest successful observation. Across fresh processes, only
journal-event timestamps persist; read-only verification does not write a
heartbeat. The controller assumes the host clock is trustworthy and cannot prove
that no manipulation occurred between persisted observations.

Retry decisions use the canonical Facilitator classification. Transport retries
keep the output reservation. Empty or truncated content may use only a larger
verified frozen reservation and stops at the ceiling. Both buffered and streamed
provider finish reasons participate in that classification. Source-integrity,
configuration and model mismatch failures stop. Every admitted retry needs a
fresh exact request assessment and spend witness. A predecessor has at most one
successor; concurrent replay requests cannot branch the same attempt.

## What the result establishes

An accounted capture establishes locally verified records and conservative budget
accounting for the attempt. It does not prove model identity beyond the authentic
receipt, accept note content, grant source coverage, add a graph parent, create a
reading proof, finalize a phase or alter an existing seal. In particular, the
legacy missing-model identity issue tracked as scaffold #665 remains relevant to
future reading acceptance even when raw capture succeeds.

Live provider-capacity evidence, billing bounds, other-seat counters, accepted
reading and phase integration, the controlled trial and verified consumer
adoption remain separate #577 delivery steps.

Accepted initial notes use the separate [reading adapter](council-staged-readings.md),
which revalidates actual captured and accounted evidence under this original
controller. It grants no new dispatch allowance or final reading proof.

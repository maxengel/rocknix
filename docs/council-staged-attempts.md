# Durable council attempt capture

This opt-in primitive binds one canonical OpenRouter buffered or SSE invocation
to an immutable source preparation. It records intent before dispatch and captures
the Facilitator's actual receipt and output. A capture preserves evidence; it does
not accept reading, produce member notes, complete a research step or update a
phase seal. Ordinary council invocation remains available with its existing routes.

Initial intents retain their v1/v2 source-preparation contract. Explicit v3
intents bind immutable derived packets through the
[derived request runtime](council-staged-derived-runtime.md), which adds historical
recount and original-controller admission. The capture format and one-dispatch
rule below apply to both; a packet does not gain initial-chunk authority.

The [Mistral local counter](council-mistral-counter.md) still returns
`verified:false` with unknown hosted-route overhead. It cannot authorize this
path. Streaming does not establish input capacity. The
[durable controller](council-staged-controller.md) adds cumulative accounting and
safe restart behavior around these attempts. Live use still needs verified
provider and spending bounds, counters for every required seat, reading/proof
integration and the controlled trial tracked in scaffold #577. No live provider
call is needed to validate these primitives with the test fixtures.

## Prepare and invoke

First create and verify an [immutable source preparation](council-staged-sources.md).
The attempt specification is caller-owned JSON, with these fields:

| Field | Meaning |
| --- | --- |
| `controlled_root` | Absolute installed repository root, containing this CLI and the canonical Facilitator |
| `preparation` | `{logical_root, expected_plan_sha256, expected_scope}` from the approved preparation; all eleven scope fields are required |
| `chunk_id` | One chunk in the frozen plan |
| `seat` | The preparation's exact `seat_id`, `member`, `provider`, `transport`, `context_ceiling`, `output_reservations` and optional `recipe_sha256` |
| `output_reservation` | One exact verified reservation from that seat; it must not be clamped |
| `attempt_id` | A fresh opaque safe path component |
| `operation_id`, `node_id`, `owner_id` | Caller-owned orchestration identities, kept in private records |
| `user_prompt`, `system_prompt` | The exact preparation prompts; system text may be null or omitted |
| `limits` | `{max_client_dispatches: 1, per_attempt_timeout_ms, total_timeout_ms}` with positive integer timeouts at most `2147478647` ms and total at least per-attempt |

These are trust inputs. The command does not infer an approved scope, owner or
context ceiling from untrusted source content. The counter is separately selected
reviewed executable code; neither the specification nor a manifest selects it.

```sh
npx tsx scripts/council-stage-attempt.mjs prepare \
  --spec attempt-spec.json \
  --counter-module reviewed-counter.mjs \
  --counter-sha256 ACTUAL_MODULE_SHA256 \
  --config-output caller-owned-attempt-config.json
```

Preparation repeats the pinned counter on the exact canonical request, checks its
model/request/evidence binding, and verifies that input bound plus overhead plus
reservation fits the frozen context ceiling. It writes an exclusive intent under
`.council-attempts/<attempt_id>/`, excluded by the seeded Git ignore policy.
The returned JSON gives the exact output,
provenance and source-manifest paths. It contains no rendered prompt text. The
configuration is written exclusively with mode `0600` outside the immutable
preparation and attempt trees; its parent directory must already exist.

Keep that caller configuration independently from the intent. The invoker uses
its expected intent/plan/scope/owner/node bindings and rechecks the preparation,
recipe, Facilitator bytes, prompts, actual serialization and trusted counter
before claiming dispatch. Supplying a stored `verified:true` cannot bypass this
fresh check. Changing Facilitator bytes invalidates old recipe pins and requires
a new preparation.

Invoke the existing `scripts/council-invoke.ts` command with the matching explicit
member/provider/transport, prompt file, source manifest, output and provenance
paths. Add:

```sh
--staged-attempt-config caller-owned-attempt-config.json \
--staged-counter-module reviewed-counter.mjs \
--staged-counter-sha256 ACTUAL_MODULE_SHA256 \
--max-retries 0 \
--max-tokens EXACT_VERIFIED_RESERVATION \
--per-attempt-timeout-ms FROZEN_PER_ATTEMPT_LIMIT \
--total-timeout-ms FROZEN_TOTAL_LIMIT
```

Only the canonical OpenRouter buffered/SSE transports are supported in this slice.
Staged direct, Azure, Bedrock and EventStream routes are refused. Redirects and
retries are disabled, and the dispatched request uses the same serialization
checked before the durable dispatch claim. The transport is bounded by remaining
total time. The guarantee is at most one client dispatch for an intent, not
exactly-once execution by a remote provider.

## Capture and recovery

The invoker writes raw output and provenance exclusively and durably, then
publishes a capture marker. It does not append staged receipts to an ordinary
research ledger, even when an ancestor contains a run manifest. The attempt tree
is outside the immutable preparation and expected reading outputs.

Use these commands to inspect a completed capture or recover a marker after an
interruption that left a complete verifiable receipt and output:

```sh
node scripts/council-stage-attempt.mjs verify \
  --config caller-owned-attempt-config.json

node scripts/council-stage-attempt.mjs capture \
  --config caller-owned-attempt-config.json
```

Neither command dispatches a request. `verify` is read-only; `capture` may
exclusively publish a missing marker after verifying the actual records. Both
require the independent caller bindings. Identical complete captures are
idempotent. Their JSON result wraps the unchanged digest-bearing record under
`capture`; `provider_dispatched:false` describes this CLI command. Successful raw receipts require matching output and all recorded
output hashes; failed receipts may have no output. Unknown model identity,
effort, usage and cost remain unknown. Historical receipts can label a raw
success `PASS` even when the observed model is null and `match_kind` is `none`;
capture preserves those actual fields. Current invocation records `UNVERIFIABLE`
and exits6 when model identity is absent. A historical `PASS` label does not establish
model identity or turn a capture into accepted reading.

| Files present | Meaning and next action |
| --- | --- |
| `intent.json` only | No durable dispatch claim; the original bound invocation can claim it once |
| `dispatch.json` without complete valid raw artifacts | Ambiguous, including a crash immediately before the HTTP call; retain evidence and do not redispatch this ID |
| Valid dispatch and complete raw artifacts, no `capture.json` | Run `capture` to validate and publish the marker without dispatch |
| Complete valid capture | Run `verify`; reuse is read-only |
| Partial, divergent or aliased records | Refuse and retain evidence; no in-place repair or overwrite |

A later controller must account for ambiguous attempts and remaining call, time
and spend limits before choosing a new attempt ID. This primitive does not grant
that replay authority. If caller-config publication fails after intent creation,
retain the orphan intent for inspection; no provider has been dispatched by
`prepare`.

Intent, dispatch, provenance and capture records are bounded at 16 MiB; raw output
is bounded at 32 MiB. An interrupted hidden publication temporary is retained as
an unexpected artifact and prevents automatic recovery, even if other final files
look complete.

Files use exclusive creation, file/directory flushes and symlink/hardlink checks.
As with source preparation, the filesystem namespace must be trusted against a
hostile same-UID process renaming ancestor directories between syscalls; Node path
APIs here do not claim `openat` confinement. Counter imports and model artifacts
remain part of caller review: an entry-module digest is not a sandbox or complete
dependency attestation.

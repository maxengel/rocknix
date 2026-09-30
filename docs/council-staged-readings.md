# Accepted initial council readings

The reading adapter accepts an initial member note only after verifying its
original source preparation, canonical request, actual provider identity and
effort, durable capture, and controller accounting. It preserves the raw note
and a separately substantiated note-token bound. Coverage counts these accepted
leaves, in each owner's original chunk order.

This builds on [source preparation](council-staged-sources.md),
[attempt capture](council-staged-attempts.md), and the
[original controller](council-staged-controller.md). Reading storage creates no
new call, token or spend allowance. A pending reread is an authorized request for
original bytes; this release does not dispatch it or grant reading-proof,
reconciliation, reduction, phase or seal completion.

## Prepare the exact reading request

Freeze a question contract `{brief, questions:[{id,text}]}`. Its canonical JSON
SHA-256 must equal the preparation scope's `question_set_sha256`. Questions have
unique IDs and nonempty text. Every planned seat has one private reading owner.

Use `createReadingRequestAssessor({questionContract,sources,seats,counter})` from
`scripts/lib/council-staged-readings.ts` as the assessor for `planInitialReads`.
`sources` is the ordered original index `{id,sha256,byte_length}`; `seats` and
`counter` have the existing canonical request assessor contracts. For each sizing
candidate this helper includes the question contract, permitted source index and
exact delivered original ranges in the prompt, then assesses the actual canonical
request. It does not substitute a byte count for a token bound.

For each planned chunk, write the exact prompt returned by
`renderReadingPrompt({questionContract,sources,deliveredRanges:chunk.ranges})`
into its staged attempt specification and prompt file. No system prompt is
permitted in this initial-reading protocol. Ordinary preparations with another
prompt are not reinterpreted as reading preparations. The question contract,
range metadata and embedded original bytes all participate in the actual request
hash and request budget.

Create the original controller before the reading policy. Each declared initial
leaf maps to an existing controller node with the same owner, member, seat and
output reservations. After the reading policy is frozen, use
`readingOperationId({policySha256,ownerId,nodeId,chunkId})` for each attempt's
`operation_id`. Prepare and run it through the existing controller CLI. Acceptance
requires an already captured and reconciled attempt; it performs neither action.

## Independent policy and CLI

The binding file contains exactly `controlled_root`, `expected_plan_sha256`,
`expected_scope`, `expected_policy_sha256` and
`expected_controller_policy_sha256`. The root must be the installed runtime root.
Use independently reviewed digests and the full original scope; reading an
artifact's own hash does not establish its authority.

The policy contains exactly:

```text
schema_version: "council-staged-reading-policy/v1"
plan: {logical_root, sha256}
scope: the complete original preparation scope
controller_policy_sha256
question_contract: {brief, questions:[{id,text}]}
members: [{owner_id, member, seat_id, leaves:[{node_id,chunk_id}]}]
limits: {max_note_bytes,max_note_tokens,max_items,max_reread_requests,max_reread_bytes,max_records}
note_counter_identity: {id,revision,artifact_sha256}
policy_sha256: SHA-256 of canonical JSON of all preceding fields
```

Each owner's leaves cover every original chunk exactly once in plan order.
Owners, seats and node IDs are unique within the policy. All limits are positive
safe integers. Hard ceilings are 1 MiB per raw note, 1,024 items, 256 reread
requests and 4,096 allocated leaves. The serialized policy must fit in 1 MiB.

All verbs use Node24 and the pinned runner:

```sh
npm exec --yes --package=tsx@4.22.4 -- tsx scripts/council-stage-readings.mjs verify --config reading-bindings.json --note-counter-module reviewed-note-counter.mjs --note-counter-sha256 REVIEWED_SHA256
```

| Verb | Additional flags | Result |
| --- | --- | --- |
| `create` | `--policy reading-policy.json` | Verify and create the immutable policy. |
| `accept` | `--attempt-id ID --node-id ID` | Accept one verified initial note, after its predecessors. |
| `verify` | None | Reverify dependencies, coverage and pending rereads. |

Every verb requires the three common flags in the example. Output is JSON with
bindings and evidence summaries; it excludes raw note text and prompt prose.
An identical acceptance is idempotent. Another attempt or changed witness for an
already accepted node conflicts. Each leaf binds its previous accepted leaf's
digest; accepted ancestry cannot be substituted while retaining later leaves.

## Member output and token evidence

The raw member response is strict UTF-8 JSON with exactly `items`, `dispositions`
and `reread_requests`. Duplicate JSON keys, invalid Unicode, extra fields and
unsupported values refuse acceptance. An initial note has empty dispositions.
Each item has exactly:

```text
{id,text,kinds,question_ids,dependency_ids,uncertainty,evidence}
```

`kinds` is a nonempty selection from `claim`, `definition`, `counterevidence` and
`open-question`. An open question preserves nonempty uncertainty. Question IDs
belong to the frozen contract, and dependencies form an acyclic local item graph.
Evidence entries are `{basis:"current-original",range:{source_id,start,end,sha256}}`.
Ranges must lie within actually delivered primary ranges and hash the exact
original UTF-8 bytes. Carried notes and resolutions await reconciliation support.

Reread requests have exactly `{id,source_id,start,end,item_ids,reason}`. They may
refer to the full permitted source index, but require valid UTF-8 boundaries,
existing local item IDs, a nonempty reason and the policy's cumulative byte bound
within that note. Acceptance derives the requested bytes' hash from verified
originals and retains the request as pending. A request earns no coverage.

An independently selected module exports `noteCounter` with `identity` and
`countNote(input)`. The loader pins an unaliased entry file, up to 1 MiB, before
and after import and counting. Its artifact digest must match the supplied pin.
The input contains exactly `note_utf8`, `note_sha256`, `model`, `recipe_sha256`.
The result contains exactly:

```text
{verified:true,note_sha256,model,recipe_sha256,note_tokens_upper_bound,
 evidence:{method,reference,assumptions}}
```

The bound covers the full raw structured note under the exact pinned wire model
and recipe, and must fit `max_note_tokens`. The full bounded evidence is retained.
The module is trusted reviewed code, not a sandbox or certification of its
assumptions. This package supplies no production note counter; fixture counts
are synthetic. Provider usage and byte length cannot replace this witness.

## Recovery and evidence boundaries

Storage is private under `.council-readings/`, alongside the original preparation,
attempts and controller journal. The logical root is
`.council-readings/<original-plan-sha256>`. New initial-reading stores publish a
`council-reading-publication/v1` record there with exactly `schema_version`,
`plan_sha256`, `policy_sha256` and `storage`. It selects a fully flushed private
`.init-<plan>-<uuid>/` directory containing policy, accepted bundles and the
record's permanent `.publication.json` source link. Only that exact two-link pair
is allowed. Consumers use the store API; the logical root is not a directory-path
promise. Existing directory stores remain readable without conversion. New publication
records require this updated reader; downgrading a reader cannot open that new
layout. Existing frozen runs keep their original code and directory storage.

The exclusive link is the publication boundary: competing creators prepare
independently and verify the winning policy; none sees a half-initialized store.
Interrupted or losing private directories remain inert evidence, never adopted,
deleted or repaired. A crash after publication leaves a complete readable pair.
Existing empty, partial, corrupt or conflicting canonical roots always refuse;
creation never overwrites them. Preserve the entire namespace for revalidation.
This repair changes initial-reading storage only; derived v2/v3 stores retain
their existing layout. No automatic garbage collection is provided.
 Original files can disappear after verified preparation;
source bytes are reconstructed from its checked slices. Altered raw outputs,
receipts, sources, policies, journal bindings or counter pins invalidate coverage.
All counter callbacks finish before the final dependency check and publication.

Actual provider-observed identity must equal the pinned OpenRouter wire model;
a broad legacy model match or PASS with no observed model cannot grant acceptance.
Required effort must have its actual evidence. Accounting must preserve authentic
known usage and unknown usage as unknown; a linked journal entry cannot conceal
a bound violation. The broader missing-model producer correction remains #665.

The local filesystem and reviewed modules remain trusted. Fresh handles cannot
prove against a coherent rollback of all local history without an independently
retained checkpoint. Private accepted records establish validated initial notes,
not provider billing, hosted capacity, research truth or final council completion.
`initial_reading_complete` means all of that owner's initial chunks were accepted;
`reading_proof_complete` remains false, including when no rereads were requested.

The next slice needs versioned derived requests for pending rereads and note
reconciliation. It must use this same original controller and cumulative quotas;
creating a fresh plan per reread would reset those quotas and is not supported.

## Derived contract primitives

[Exact rereads and successor notes](council-staged-rereads.md) supplies pure
selection and validation helpers for the next integration. This CLI continues
to accept initial leaves only; those helper results do not establish dispatch,
quota authority, stored successor acceptance or fulfilled rereads.

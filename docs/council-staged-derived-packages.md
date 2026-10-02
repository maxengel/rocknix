# Immutable derived reading packages

Gate 2 of Scaffold #577 stores exact successor input against the original source
preparation, reading policy and controller. It adds two modules:

- `scripts/lib/council-staged-derived-contract.mjs`: strict policy, packet,
  assessment and v3 intent validation; deterministic reread selection; canonical
  assessor candidate and prompt construction.
- `scripts/lib/council-staged-derived-store.mjs`: bounded immutable publication,
  verified inventory, incomplete-package diagnostics and reservation checks.

These APIs establish structural storage integrity. Parent acceptance and counter
witnesses are supplied evidence. The [request runtime](council-staged-derived-runtime.md)
adds independent recount and guarded v3 dispatch/recovery. Semantic ancestry and
accepted successors remain a subsequent gate. No store operation calls a counter, billing evaluator or provider, spends
a controller event, or retires an unresolved reread request.

## Bind a policy without a cycle

Load the original preparation with `readVerifiedPreparation`. Define the exact
reading-policy v2 core: `schema_version`, `plan`, `scope`, `question_contract`,
`members`, `limits`, `note_counter_identity`, `request_counter_identity`.
`readingContractSha256({core, preparation})` validates the core before returning
its domain-separated digest. Bind that digest as `reading_contract_sha256` in
the original v2 controller policy. Finally add `controller_policy_sha256` and
the reading policy's own `policy_sha256` (canonical body digest, excluding that
field). A completed v1 store cannot be upgraded in place.

One member maps each original seat to every ordered original chunk and a finite
list of successor slots. Each successor names distinct earlier parents of that
same member and has round `1 + max(parent rounds)`. Controller node ownership,
seat and output variants must match the entire map. The request counter identity
must match every original assessment variant. Missing historical identities are
refused; there is no implicit counter migration.

See the [exact schemas and limits](../scripts/lib/council-staged-derived-contract.mjs).
The hard maximum is 256 logical nodes, 32 parents per successor, 4096 package
slots, 64 MiB per package and 256 MiB of declared package/candidate capacity.
Encoded packet, assessment and intent bytes together must fit the package limit.
Storage capacity is independent of context capacity and the controller's budget.

## Build the exact candidate

An attempt ID is `d-<original-plan-sha256>-<slot>`, with canonical decimal slot
from zero through `max_request_packages - 1`. The packet carries original source
IDs, raw parent note UTF-8 and immutable original reread requests. Each request
retains `{origin_node_id, request, pending}` across rounds; only the pending
suffix advances. `selectDerivedDelivery` keys the existing range selector by
`sha256(canonicalJson([origin_node_id, request.id]))`. Raw bytes, BOM, CRLF and
UTF-8 boundaries are preserved. Empty requests permit a note-only reduction;
storage does not establish that discarding inherited work is semantically valid.

`createDerivedCandidate({packet, policy, preparation})` supplies the canonical
request assessor with the full packet as its one source. Its internal chunk
label is `derived:<node_id>`, never an original preparation chunk. Use
`renderDerivedPrompt({questionContract: policy.question_contract})` when creating
the existing `createCanonicalRequestAssessor`. The assessment wrapper contains
the packet's `sources` projection, counter identity and complete assessment.
Only the projection enters candidate hashing; the full wrapper's bytes enter
the intent hash. This avoids hashing an assessment into itself.

The v3 intent keeps the controlled-v2 bindings and adds `derived`, binding the
reading policy, packet file and assessment file hashes. The attempt store and
invoker accept it through an explicit derived branch; initial v1/v2 paths keep
their original manifest rules. The packet pairing tests use the ordinary
invoker with synthetic transport to prove request/provenance compatibility;
they establish no guarded dispatch or live provider acceptance.

## Publish and inspect

`createDerivedReadingStore({controlledRoot, policy, expectedPlanSha256,
expectedPolicySha256, expectedControllerPolicySha256, expectedScope})` returns an
opaque handle. `verifyDerivedReadingStore` takes those independent expectations
without `policy`; both accept an optional retained controller `expectedHead` and
`nowMs`. Verification rereads the original preparation and controller. A fresh
handle needs an independently retained checkpoint to detect historical rollback.

`publishDerivedRequestPackage({handle, packet, assessment, intent})` snapshots
inputs before I/O, exclusively creates the finite slot directory, fsyncs packet
and assessment, then fsyncs `.intent.pending`, links `intent.json` exclusively,
removes its own temporary and fsyncs the directory. Identical complete bytes are
idempotent. A competing creator may return `derived_slot_occupied`; inspecting
and retrying identical completed bytes is safe. Incomplete slots are never
repaired or deleted by these APIs. Use another declared slot if available.

`readDerivedRequestPackages({handle})` returns `{packages, incomplete, candidates}`;
`readDerivedRequestPackage({handle, attemptId})` returns a complete package or
`null`. Returned records are detached and frozen. Unknown artifacts, symlinks,
hard-link aliases, FIFOs, oversized or malformed committed files refuse reads.
Complete packages observed through a handle cannot disappear or change. Every
controller reservation for a successor requires its complete matching package
and budget. Missing evidence refuses history without refunding a charge.

The tree is fixed: `policy.json`, `requests/`, and bounded immutable
`acceptance-candidates/`. Candidates alone are inert; the
[committed reading coordinator](council-staged-derived-runtime.md) joins them to
original-controller acceptance events and authentic note semantics. Expired/stopped controllers remain inspectable; these
reads are not admission. Concurrent default clock observations are ordered per
controller handle; explicitly regressing clocks still refuse. As with the
existing stores, the filesystem namespace is trusted, not a sandbox against a
hostile same-UID process swapping ancestors between operations.

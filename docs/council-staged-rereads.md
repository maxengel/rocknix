# Exact rereads and successor note validation

These pure helpers select exact original-source packets and check structured
successor notes. They do not call providers, reserve budgets, accept stored
readings, retire outstanding rereads or create coverage. The reading CLI still
accepts initial leaves only. Derived invocation and successor acceptance require
the follow-on integration below.

## Select exact original bytes

```js
import { planRereadDelivery } from "./scripts/lib/council-staged-rereads.mjs";
const packet = planRereadDelivery({
  sources,  // [{id, sha256, bytes:Buffer}] from verified frozen preparation
  requests, // one independently verified parent's validated rereads
  limits: { max_bytes: 32768, max_parts: 8, max_requests: 32 },
});
```

Example limits are illustrative byte/record bounds, not model-token certification.
Each request has exactly `id`, `source_id`, `start`, `end`, `sha256`, `item_ids`
and `reason`, matching `validateInitialNote(...).rereads`. Every source and request
is validated before selection, including requests too late to fit. IDs must be
unique; intervals are nonempty half-open UTF-8 ranges with exact original hashes.

Process requests in locale-independent code-unit ID order. Take a prefix subject
to byte and part limits, splitting oversized intervals at UTF-8 boundaries. Later
requests never jump ahead of unfinished work. A packet unable to fit its first
requested code point fails with `reread_no_progress`; malformed inputs fail with
`invalid_reread_request`.

The result is exactly:

```text
{
  deliveries: [{request_id, range:{source_id,start,end,sha256}, bytes:Buffer}],
  remaining: [{id,source_id,start,end,sha256,item_ids,reason}],
  delivered_bytes
}
```

`delivered_bytes` counts bytes included in this packet, not network delivery.
Returned Buffers and remaining requests are detached. Overlapping and adjacent
requests stay separate; repeated physical bytes count again. No coalescing,
deduplication, normalization, clipping or semantic substitution occurs.

Retain the immutable original request and every split mapping. A partial request's
remaining interval starts exactly where its selected prefix ended, with a hash
of that suffix. Feed remaining requests into the next selection. An empty list
only establishes selected coverage. Actual captured delivery and accepted successor
proof remain necessary for fulfillment.

Hard caps:1024 sources,256 requests/parts,32MiB selected bytes. Caller limits are
positive safe integers within those caps. Preparation separately bounds the
already-frozen source Buffers.

## Validate a successor note

`validateSuccessorNote({bytes,sources,deliveredRanges,questionIds,limits,children})`
is exported by `scripts/lib/council-staged-notes.mjs`. Limits retain the initial
four fields: `max_note_bytes`, `max_items`, `max_reread_requests`, `max_reread_bytes`.
Explicit parsing uses `parseMemberNote(bytes,{maxBytes,kind:"successor"})`; the
default initial-note API preserves its behavior.

Children have exactly `{node_id,bytes}`. The caller must independently verify their
accepted capture, scope, owner, accounting and assignment before use. This helper
checks local structure and original-range hashes, not that external authority.
Caps:32 children,1MiB per child,32MiB aggregate,1024 total consumed items/dispositions.
The caller's `max_items` independently bounds output size.

The body remains exactly `{items,dispositions,reread_requests}`. Items retain the
initial seven fields: `id`, `text`, `kinds`, `question_ids`, `dependency_ids`,
`uncertainty`, `evidence`. Evidence has one of these exact shapes:

```text
{basis:"current-original",range:{source_id,start,end,sha256}}
{basis:"carried-note",child_node_id,item_id,range:{source_id,start,end,sha256}}
```

Current originals must lie wholly in actually delivered ranges with
`purpose:"reread"`. Carried evidence must name an item in a consumed child, one of
that item's exact original ranges, and the same target as its disposition. All
ranges are rehashed from frozen originals. A new item with no child contribution
needs current-original evidence.

Every child item gets exactly one disposition:

```text
{child_node_id,item_id,action,result_item_id,reason}
```

| Action | Required preservation |
| --- | --- |
| retain | Exact text, uncertainty, tag/question/evidence sets and mapped dependencies. Local IDs may change through the disposition map. |
| merge | Original evidence/question union, counterevidence/open-question tags, nonempty uncertainty and mapped dependencies. |
| qualify | Same preservation as merge; prose may change. |
| duplicate | Exactly equivalent final payload plus an equivalent child with a nonduplicate disposition to the same result. Circular pairs refuse. |

Targets must exist and reasons must be nonempty. There is no drop action. A child
dependency may collapse inside one result only when both endpoints have merge
dispositions to it. Every other mapped dependency survives and the output graph
stays acyclic. Structural checks cannot prove semantic equivalence of rewritten
prose; review remains necessary.

There is no resolved-item marker. Open-question tags and nonempty uncertainty must
survive. New model rereads retain the initial strict schema and return as pending
requests; they never replace the coordinator's inherited outstanding ledger.
Omitting new requests cannot erase a parent's undelivered remainder.

Return shape: `{body,note_sha256,rereads,reread_bytes}`; refusals use
`invalid_member_note`. No field asserts acceptance, fulfillment or completion.

## Required runtime integration

Freeze bounded successor nodes in the original controller before execution.
Missing slots stop. Preserve the SAME original plan/controller and cumulative
call/input/output/spend/deadline limits; never create a new plan per reread.

The versioned derived intent/invoker must bind exact accepted parent hashes,
original ranges and split mappings, count the complete canonical request including
raw children and metadata, and reverify dependencies at actual dispatch. New
artifact storage cannot create new execution authority. The current initial-only
intent and reading stores must not accept arbitrary extra files.

After capture/accounting, verify exact model/effort, every terminal attempt's
actual usage, note-token witnesses and immutable ancestry. Finish all callbacks
before final dependency checks. Only an accepted successor retires delivered
request segments. Reduction/root proof and phase/ledger/seal integration remain
separate #577/#524 requirements.

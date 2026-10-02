# Offline council source preparation

This is the first executable slice of scaffold #577. It prepares exact UTF-8 source
slices, ordinary Facilitator manifests and complete-request budget witnesses. It
never invokes a provider, accepts member reading, creates notes or enables a staged
council. Existing direct council calls retain their routes and retry behavior.

The caller supplies the complete permitted source list and frozen scope. Preparation
proves coverage of that declared list; it does not establish that the list satisfies
an external research contract. The caller also owns the truth of model context
ceilings and counter evidence. These are explicit trust inputs, not inferred from
file sizes or a successful JSON parse.

Use [durable attempt capture](council-staged-attempts.md) for bound raw receipts
and the [controller](council-staged-controller.md) for cumulative execution
accounting and safe restart. Neither extends preparation into accepted reading;
the live evidence and reading/proof gates remain explicit.

## Commands

Use the same TypeScript runner required by `council-invoke.ts`:

```sh
npx tsx scripts/council-stage-sources.mjs prepare \
  --spec preparation-spec.json \
  --counter-module reviewed-counter.mjs \
  --counter-sha256 ACTUAL_MODULE_SHA256

node scripts/council-stage-sources.mjs verify \
  --root /absolute/path/to/installed/repository \
  --logical-root prepared/opaque-id \
  --scope frozen-scope.json \
  --plan-sha256 ACTUAL_PLAN_SHA256
```

The specification is strict UTF-8 JSON with no duplicate object keys, at most
4 MiB. It contains:

| Field             | Contract                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| `source_root`     | Physical absolute directory containing originals and control inputs                                          |
| `controlled_root` | Absolute root of the repository containing the invoked preparation CLI and canonical Facilitator             |
| `logical_root`    | Unique safe relative destination, such as `prepared/opaque-id`; chosen before counting                       |
| `sources`         | Ordered `{id, path, sha256, byte_length}` entries, relative to `source_root`                                 |
| `controls`        | Same input shape; common brief/index documents repeated in every manifest and excluded from primary coverage |
| `user_prompt`     | Exact common Facilitator user brief; control documents can carry longer shared material                      |
| `system_prompt`   | Exact string or null                                                                                         |
| `scope`           | Explicit frozen bindings listed below                                                                        |
| `seats`           | Locked member/provider/transport/context/reservation configurations listed below                             |
| `limits`          | Explicit work limits listed below                                                                            |

Every scope field is required: `run_id`, `research_run_id` (or null), `phase`,
`step`, `round`, `cohort_id`, `required_input_set_sha256`, `question_set_sha256`,
`method_version`, `seat_configuration_sha256`, `anonymous_view_sha256` (or null).
The hash fields bind the caller's approved contracts. This command does not
allocate a research UUID or establish a formal phase.

Each seat specifies `seat_id`, `member`, `provider`, `transport`,
`context_ceiling`, and ordered `output_reservations`. An optional `recipe_sha256`
asserts an existing pin; otherwise the adapter derives and returns a pin from the
current Facilitator bytes and recipe behavior. Reservations cannot be lower than
the selected recipe default or higher than its ceiling. Every reservation receives
its own exact request hash and count witness. A cohort cannot be verified from
one member's count alone.

When a recipe's default equals its ceiling, that is the only permitted output
amount. The canonical OpenRouter Mistral recipe uses `131072` for both, so its
preparation configuration uses `output_reservations: [131072]`. The complete
input and overhead must still fit alongside this reserve within the frozen
context ceiling. There is no output escalation available on that route; an
unchanged-reservation transport retry is a separate controller concern. Backup
routes have their own recipe limits and must be selected and assessed explicitly.

Limits require positive safe integers: `max_sources`, `max_source_bytes`,
`max_total_bytes`, `max_chunks`, `max_assessments`. Optional `max_assessed_bytes`
bounds cumulative candidate source/control bytes; its default is
`max_total_bytes * 32`. Input bytes and controls are each checked against their
respective total ceiling. These limits bound planner work, not model tokens.
Plan and completion records have a separate 16 MiB UTF-8 limit.

## Counter and request boundary

The counter is reviewed executable code explicitly selected on the command line.
Source specifications cannot choose it. Its file must be a regular, unaliased
UTF-8 file at most 1 MiB, matching the supplied SHA-256. Counter imports and model
artifacts remain part of the caller's review; hashing the entry module alone is
not a dependency attestation or a sandbox. It exports `counter` matching
`RequestCounter` in `scripts/lib/council-staged-request.ts`.

`counter.identity` has `id`, `revision` and `artifact_sha256`; the CLI requires
the latter to match the selected module. The module may compute this hash from
its own file at import time. `countRequest` receives the exact `JSON.stringify`
provider body, its hash, recipe model, transport and seat configuration. It returns
`verified`, `input_tokens_upper_bound`, `extra_overhead_tokens` and a
`counter_witness` with `method`, `model`, matching `request_json_sha256`, `evidence`
and explicit `assumptions`. It must substantiate framing and any extra overhead.
Unsupported models or unresolved overhead must return unverified or throw.

The adapter uses the canonical Facilitator's renderer and recipe. Its injected
reader supplies candidate bytes at final logical paths, retaining the ordinary
embedder's source-hash checks and headers. It calls no endpoint or credential
function. `candidate_sha256` binds ranges, manifests and exact file references;
each reservation's count separately binds the actual rendered request. The
planner checks the budget arithmetic itself for every frozen seat and reservation.

A [pinned Mistral local-measurement adapter](council-mistral-counter.md) is bundled
separately. It returns a real `measured_input_tokens` value with `verified:false`
and null `input_tokens_upper_bound` / `extra_overhead_tokens`, because hosted-route
overhead is unresolved. The assessor refuses that result. Test counters remain
explicitly synthetic and prove boundary handling only. Missing, unsupported or
unverified counters produce `budget_unverified`, never a ready plan based on byte
estimates or a local measurement alone.
For programmatic use, honor the canonical adapter's returned `controlledRoot`
when materializing; the CLI enforces this relationship. The generic store can also
serve another reviewed assessor whose execution root is explicitly bound.

## Files and resume

Whole files remain whole when they fit. Otherwise the planner chooses the last
fitting newline, then a UTF-8 code-point boundary for a long line. Exact whitespace,
BOM, CRLF and empty files are preserved. Every primary byte appears exactly once.
This slice emits no contextual overlaps and rejects undeclared overlaps. Source
identities remain in the private plan; member manifests use opaque controlled
names and list only delivered controls and slices.

Token counts need not be monotone under concatenation. Candidate search is
deterministic and bounded, with no binary-search fit assumption. A very long file
may exhaust the configured work limit before finding a fit; this is an explicit
`planning_limit_exhausted` refusal, not a statement that no possible plan exists.
An oversized fixed brief/index produces `fixed_context_overflow`.

The store exclusively creates `<logical_root>/`, writes exact files and
`plan.json`, re-verifies them, then publishes `preparation.json` with state
`prepared`. It flushes files/directories and refuses divergent output. A partial
directory or leftover unpublished marker never resumes as complete. Identical
completed preparation is idempotent. Verification checks canonical record bytes,
expected scope/plan digest, exact artifact set and reconstructed original hashes.

Files and directories must be free of traversal, symlink and hardlink aliases.
The filesystem namespace must be trusted against a hostile same-UID process
renaming ancestor directories between syscalls. These Node path APIs do not claim
`openat` confinement. Interrupted evidence is retained for diagnosis; use a new
opaque destination after resolving a failed preparation instead of overwriting it.

The completion marker proves source preparation only. It is not a provider receipt,
accepted coverage, note ancestry proof, research output or phase seal. The separate
[durable attempt capture primitive](council-staged-attempts.md) binds one opt-in
invocation and its authentic receipt to a verified preparation. Bounded controller
accounting, member notes/reduction/rereads, final proof joins, phase adapters and a
controlled five-seat trial remain under #577 and the #571/#524 toolchain convergence
work before live adoption.

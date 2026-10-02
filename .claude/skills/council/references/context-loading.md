# Context loading

This file replaces the dangling `research/prompts/trio-process-v2.md`
reference that lived in the legacy `.github/agents/trio-council.agent.md`.
It defines the **mandatory source-document reading list** that every
member subagent MUST consume in Step 1 (initial analysis) of the
pipeline, before producing any output.

The point of mandatory context loading is to guarantee that every
member analyzes the **complete, uncompacted** source material — not a
conversational summary, not a paraphrase, not what the orchestrator
"thinks the problem is." Each member reads the same files via
`read_file`.

## The hard rule

**Every Step 1 member-subagent invocation MUST include a `read_file`
list in its prompt.** The orchestrator (this skill) is responsible for
assembling the list before invoking each member.

A member subagent that produces analysis without having consumed the
required reading list is invalid output — flag and retry that member.

## How the orchestrator assembles the reading list

The orchestrator builds the per-run reading list from three sources, in
this order of precedence:

### 1. Caller-provided sources

If a parent skill (e.g. `council-research` at Phase 4 handoff) or the
user explicitly provides a list of source files, **those files are
authoritative** — include all of them in the reading list verbatim. Do
not omit any.

### 2. Problem-context-implied sources

Derive additional source files from the problem statement itself:

- Issue numbers mentioned → fetch with `mcp_github_issue_read` and
  include the body + relevant comments as resolved paths or inline
  context blocks
- File paths mentioned → include them directly via `read_file`
- Spec documents named (e.g. "the council-infrastructure spec") →
  resolve to the canonical path under `docs/planning/**/` and include
- Bedrock references → include the named document under
  `docs/architecture/bedrock/`

### 3. Standing project context

Every council run on this project includes these files by default,
unless explicitly excluded by the caller:

- `AGENTS.md` (the repo's foundational agent guide; `CLAUDE.md` where
  present — the Copilot vendor file is retired, scaffold#556)
- Any `applyTo`-matched instruction file under
  `.github/instructions/` that the problem context falls under
- `specs/kno-spec.kno` if the problem touches `.kno` format,
  schemas, or entity modeling
- `docs/architecture/bedrock/kno-foundational-principles.md` if the
  problem touches bedrock principles, format invariants, or
  cross-cutting architecture

If the problem statement is purely about process / methodology (e.g.,
"how should we structure phase X"), the bedrock + kno-spec inclusions
can be skipped — surface the omission so the user can override.

## Archive and request scope

An acquisition archive preserves material collected for possible use. A
member request contains the inputs required for its **topic, phase and
step**. Collection, hashing or inclusion in a preparation inventory does
not itself designate mandatory reading. Establish membership from the
caller-provided requirements, applicable standing context and existing
phase contract. Preserve complete required sources; resolve a scope
conflict rather than silently dropping a named input. Explain material
inclusions and exclusions, including conditional sources, historical
background and duplicate canonical/generated representations. Overlap
alone does not authorize omitting a required file.

Keep coordinator controls, acquisition receipts and historical diagnostics
separate from member evidence unless the phase calls for them. Follow the
existing Phase 0 prior-work and Phase 3/4 sequestration rules. Later steps
receive their prescribed peer artifacts; do not concatenate every phase's
inputs into a single supposed minimum. Facilitator calls are stateless:
the legacy `read_file` wording means verified source embedding, not tools
or retained conversation memory. Apply each step's existing input handoff;
neither previous reading nor a prior API call supplies hidden context.

When diagnosing a capacity or reliability concern, inspect comparable
successful and failed Facilitator receipts before claiming a systemic
problem. Compare the model, provider, transport, actual prompt-token use,
output allowance, finish reason and retry outcome. This is incident
diagnosis, not a mandatory historical audit for every run. Prior success
does not prove that a larger current request fits; keep these operational
observations out of independent member prompts.

Budget the **complete proposed request** after source embedding: source
envelope, brief, system/messages and required step artifacts, using the
relevant tokenizer where available. Include the output reservation and
state what provider overhead remains unobserved. Wire bytes are not token
counts. Check the requests the selected scope actually requires; label
archive-wide measurements as specimens, not minimum requirements. A small
successful probe establishes reachability, not full-request capacity.

Distinguish **input overflow**, **output truncation or reasoning-budget
exhaustion**, **transport/provider failure**, and **verification failure**.
SSE changes response transport, not input capacity; output-budget retries
do not shrink the input or create a chunked-reading protocol. An oversized
archive/specimen alone does not justify removing a roster seat, making a
new-method issue a prerequisite, or declaring that issue ready. First
resolve the required request and use the existing phase/step contracts.
If complete required inputs still cannot fit, report that specific
constraint under the existing failure/roster rules. Do not silently
compact sources, invent reading/reconciliation rounds, or compress the
council pipeline to make it fit.

## Exclusions (hard)

Members MUST NOT read files under:

- `research/archive/` — superseded research; reading it biases toward
  abandoned approaches
- `research/trio-runs/` — previous council outputs; reading prior
  council deliberations biases the current one toward earlier
  conclusions

The orchestrator MUST enforce these exclusions when assembling the
reading list. If a caller-provided source falls under an excluded
path, refuse the inclusion and surface the conflict to the user.

**Completion-record excision inside framing documents.** A framing
document embedded "verbatim" (e.g. a program plan's council-scope
section) may have accumulated completion records for PRIOR council
runs — paragraphs that summarize an earlier run's ruling. Those
paragraphs are prior council conclusions and carry the same bias risk
as reading a prior run directory. Excise them from the embedded
framing and mark the excision in place (e.g. `[excised: run-1
completion record — prior-run conclusions are excluded per the
independence guard]`) so members can see something was removed and
why, without seeing the content. Record the excision in the run
README. (Origin: 2026-08-17 q3q4 run, pfi-collaboration — § Council
scope contained the run-1 ruling summary by the time run 2 convened.)

## How members consume the list

Each member subagent's Step 1 prompt MUST contain a section
explicitly enumerating the reading list, formatted as:

```
## Mandatory context loading

Before beginning analysis, read each of the following files in full
using `read_file`. Do NOT paraphrase, summarize, or skim. Your
analysis MUST cite specific evidence from these files where relevant.

- {path-1}
- {path-2}
- …
```

The member's first actions in Step 1 are the `read_file` calls. Only
after the full reading list is consumed does substantive analysis
begin.

## Re-loading on recursion

Per [`tie-breaking-recursion.md`](tie-breaking-recursion.md), recursion
rounds (`r2`, `r3`, …) start at Step 2 — there is no per-round Step 1.
Therefore the **mandatory reading list is loaded once per council run**,
not once per round. The orchestrator does not re-emit the reading list
to member subagents in recursion rounds; the round-N prompts focus
exclusively on the prior round's per-member artifacts.

If new source material surfaces mid-run (e.g., a related issue is
filed during the deliberation), the orchestrator MUST surface this to
the user and ask whether to **abort and restart** the council with the
expanded reading list, rather than smuggling the new material into a
recursion round.

## Cross-references

- [`pipeline.md`](pipeline.md) § "Mandatory context loading" — invokes
  this file at the right moment in the pipeline
- [`output-conventions.md`](output-conventions.md) — defines the
  `provenance.json` sibling, which records which files the member
  actually consumed (so violations of this rule are auditable
  post-hoc)

## Request-size and transport recovery

This section began with the Mistral seat, which left the roster over its 262,144-token
window (scaffold#915). Its rules apply to any seat whose window binds a request, such
as Grok 4.7's 500,000 tokens in the `grok-shadow` arm, and to Mistral if it returns.

Use the retained recovery examples (scaffold's forge, docs/planning/council-five-seat-794/recovery-20260924.md)
and the existing output-budget bug (the source estate's issue 4971)
before treating a large-packet failure as a streaming defect. Search both
`research/council-research/` and `research/council-runs/`, including relevant
branch history; a checkout may lack the newer run's files.

Three different quantities need different handling:

- **Transport chunks:** SSE events and network byte fragments arrive from the
  provider. The Facilitator reassembles partial UTF-8 and event lines. There is
  no caller-selected SSE byte-chunk size; `stream_chunks` counts nonempty
  content deltas, not input partitions or network reads. A tiny 404 or 401
  before any events is an access failure, not evidence of a chunk-parser fault.
- **Request budget:** count the complete embedded request plus reserved output
  against the exact route's window. Mistral's 131072 default caused a 400
  even when all original input fit. The #4971 ordinary-call workaround uses
  an explicit `--max-tokens` that fits the remaining window; the successful
  R4946 retry retained its inputs and requested 90000 instead of 131072.
  Preserve both attempts and their actual allowances. Do not silently alter
  an anchored recipe, staged reservation or controlled experiment. Record
  and freeze any permitted per-stage allowance before invocation, recount
  retries, and reject truncated output. Historical answer lengths do not
  guarantee a future answer fits. #4971's automatic-budget fix remains open.
- **Input partitions:** R4412 split a claim-review deck into disjoint 53-claim
  bundles with separate source manifests, captures and a combined review
  ledger. This is phase-specific review partitioning, not proof of general
  multi-call source reading. Calls have no hidden shared memory. Preserve
  required coverage and each phase's existing semantic/gate contract; use
  the qualified #577 path when the task needs general bounded reading.

A concrete SSE precedent is R16 Phase 1: 178977 prompt tokens, 32768 reserved
output, 13858 completed output tokens, HTTP 200, verified model and terminal
DONE. Later ordinary buffered calls also succeeded above 200000 prompt
tokens with explicit allowances. Compare exact receipts, finish/retry
reasons, source scope, timeouts and model identity; neither transport is a
universal fix. Keep diagnostics and historical outputs outside fresh member
prompts. Full five-seat presence remains mandatory.

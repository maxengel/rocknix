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

- `.github/copilot-instructions.md` (the repo's foundational agent
  guide)
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
README. (Origin: 2026-08-17 q3q4 run — § Council scope contained the
run-1 ruling summary by the time run 2 convened.)

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

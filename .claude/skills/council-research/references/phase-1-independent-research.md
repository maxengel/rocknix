# Phase 1 — Independent research

**Purpose:** Each member subagent independently produces its own research
corpus from the same prompt and the same orchestrator-staged source
corpus (in-repo pointers **plus** orchestrator-pre-fetched external
primary sources — see § External-source acquisition under the
stateless-member substrate), but is free to weight, interpret, and
argue from that shared corpus differently and reach different
conclusions. The output is N parallel corpora — NOT a single synthesis
— that Phase 2 will cross-reference.

> **Substrate reality (load-bearing):** members are invoked via the
> Council Facilitator over direct HTTPS APIs and are **stateless — no
> filesystem, no web, no MCP, no tools**. A member cannot fetch a URL
> or read a file at invocation time. Every byte a member reasons over
> is text the orchestrator embedded into the prompt via the source
> manifest. The external-research requirement below is therefore
> satisfied by the **orchestrator** fetching external primary sources
> at Phase-1 time and embedding them — NOT by members fetching. Any
> instruction in this file that reads as "the member fetches" means
> "the member cites the orchestrator-embedded fresh external source."

**Who executes:** Each active member subagent (`council-member-claude`,
`council-member-gemini`, `council-member-gpt`, `council-member-kimi`,
and `council-member-muse` when each is in the locked roster),
invoked one at a time by the council-research orchestrator.

**Inputs the orchestrator provides each member:**

- The research topic / question (verbatim from the council-research caller)
- A list of in-repo source pointers (file paths and/or directory paths)
  that every member MUST read — this is the equivalent of the council
  skill's `context-loading.md` mandatory-context-loading list
- The `council_research_run_id` UUID (so the member can populate it
  in their provenance sibling)
- The output directory the member writes to (`phase-1-research/<member>/`)
- Explicit instruction to emit a sibling `.provenance.json` per
  [`provenance-schema.md`](provenance-schema.md)

**Outputs each member produces:**

```
phase-1-research/<member>/
├── corpus.md                  # the member's research output (free-form structure)
├── corpus.provenance.json     # sibling per provenance-schema.md
└── (optional: notes/, drafts/, intermediate working files)
```

Each member's `corpus.md` MUST contain at minimum:

- Restatement of the research topic in the member's own words (proves
  the member read the prompt, not just the file list)
- All source-file findings the member considers relevant, organized
  however the member chooses
- **External research with full citations (URLs, titles, dates).**
  External grounding is REQUIRED, not optional, for any
  bedrock-adjacent topic. The minimum floor is **3 external
  citations** (academic papers, standards documents, vendor docs, OSS
  repos, or peer-portal reports). Because members are stateless (see
  the substrate-reality note above), these citations point at the
  **orchestrator-pre-fetched external primary sources embedded via the
  source manifest** — the member reads the embedded fresh text and
  cites it by URL/title/`accessed_utc`/`content_sha256` exactly as the
  manifest declares. A member MAY additionally surface
  pretraining-knowledge of other external prior art, but such
  additions MUST be tier-flagged as un-fetched (tier-(c)-unverified)
  and do NOT count toward the 3-citation floor. A corpus that cites
  only in-repo paths is a Phase 1 failure — see Failure modes below.
  The point of N parallel corpora is input diversity; in-repo-only or
  pretraining-only corpora collapse to pretraining-prior agreement
  (the M64.P1.5 E7 echo-chamber pattern).
- A "Strongest claims" section listing the 3–7 propositions the
  member is most confident about
- An "Open questions" section listing what the member could not resolve

## Anti-self-reference — protect Phase 3 anonymization

The member MUST NOT include phrasing that would let a downstream
adversarial reviewer (Phase 3) identify the corpus as the member's
own work and treat it more gently. Specifically banned in `corpus.md`:

- First-person identity tags: "as Claude", "from Gemini's perspective",
  "I, GPT-5, observe…", model-name self-references of any kind
- Stylistic fingerprints the member uses as a recognizable signature
  in other contexts (e.g., a member's habitual section-naming
  convention used self-referentially: "my usual three-pillar framing")
- Citations to the member's own prior council artifacts by name when
  the in-repo path alone would suffice

The orchestrator's Phase 3 invocation prompt will refer to every
Phase 1 corpus by an anonymized handle (`Corpus-A`, `Corpus-B`, …) —
see [`phase-3-adversarial-review.md`](phase-3-adversarial-review.md)
§ Double-blind sequestration. Self-referential phrasing in the corpus
undermines that anonymization.

The orchestrator does NOT prescribe the structure beyond those minimums
— different models excel at different structures, and forcing uniformity
in Phase 1 would defeat the point of input diversity. Uniform structure
re-emerges in Phase 2 (clinical synthesis) where the Researcher Agent
maps every member's corpus into a single structured synthesis.

## Invocation discipline — Facilitator-mandatory, serial, one at a time

**HARD RULE (inherited from
[`.claude/skills/council/SKILL.md`](../../council/SKILL.md) § Hard rules):**
All Phase 1 member invocations MUST go through
`scripts/council-invoke.ts` (the Council Facilitator). The orchestrator
is **forbidden** from invoking members via `runSubagent`, `curl`,
ad-hoc `fetch`, MCP provider tools, or any other path that bypasses the
Facilitator. The Facilitator is the provenance and model-verification
wrapper; bypassing it produces untrusted artifacts and silently
collapses substrate diversity to the orchestrator's own model (see
the 2026-05-22 model-identity-verification run log (the source estate's repository, research/council-runs/)
Finding #1 — `runSubagent` cost-tier ceiling silently substitutes
orchestrator substrate for pinned member substrate).

The Facilitator runs in the orchestrator's terminal — not as a subagent
— so the invocation surface for Phase 1 is `run_in_terminal` calling
`npx tsx scripts/council-invoke.ts ...`. The five council-member
`.agent.md` files are descriptive metadata (substrate pinning,
identity, prompt-shaping conventions); they are NOT a dispatcher
surface and `runSubagent` against them is the documented failure mode.

**Per-member invocation shape:**

```bash
npx tsx scripts/council-invoke.ts \
  --member {claude|gemini|gpt|kimi|muse} \
  --prompt-file research/council-research/<run-dir>/phase-1-research/KICKOFF-PROMPT.md \
  --output research/council-research/<run-dir>/phase-1-research/<member>/corpus.md \
  --council-research-run-id <run-id-from-run-id.txt> \
  --phase phase-1 \
  --source-manifest research/council-research/<run-dir>/phase-1-research/.manifest.sha256.json \
  --invoker-agent-name council-member-<member>
```

The four `--council-research-run-id` / `--phase` / `--source-manifest`
/ `--invoker-agent-name` flags are mandatory for council-research runs
(RC3 source-manifest binding from #2991). They cause the Facilitator
to emit the composite top-level `facilitator_*` flat fields in the
sibling `corpus.provenance.json` that
[`scripts/lint-council-research-provenance.ts`](../../../scripts/lint-council-research-provenance.ts)
verifies. Omitting them produces an artifact that the lint will FAIL.

**Exit-code handling** (per `scripts/council-invoke.ts` USAGE block):

| Code | Meaning                              | Response                                                                                |
| ---- | ------------------------------------ | --------------------------------------------------------------------------------------- |
| 0    | success                              | proceed to next member                                                                  |
| 1    | retries exhausted, transient         | pause; surface to user; consider falling back to (N-1) roster                           |
| 2    | retries exhausted, empty content     | same as 1                                                                               |
| 3    | model mismatch, no retry             | **HALT.** Substrate did not match pin. Do NOT proceed. Re-evaluate Facilitator routing. |
| 4    | local config error (env vars, paths) | fix the local config; re-invoke                                                         |
| 5    | permanent provider error             | pause; surface to user; consider falling back to (N-1)                                  |

After each Facilitator invocation returns exit 0, run
`npx tsx scripts/lint-council-research-provenance.ts --strict
research/council-research/<run-dir>/phase-1-research/<member>/`
before invoking the next member. The lint must pass before advancing.

**Serial, one at a time.** Do NOT parallelize Facilitator invocations.
Citations:

- `agent-terminal-safety` (estate-local; scaffold: development-principles § Security + bash-tool guardrails)
  — "Do not call run_in_terminal multiple times in parallel"
- [`.claude/skills/council/references/pipeline.md`](../../council/references/pipeline.md)
  — "Invoke each active member subagent **one at a time**" — same
  rationale: shared output-directory writes + deterministic run logs

**The word "parallel" in "independent parallel research" describes the
conceptual parallelism** (each member produces an independent corpus
from the same prompt, free of cross-member contamination). It is NOT a
literal parallel-execution requirement. Wall-clock duration is not a
decision axis here per
`no-cheap-reasoning` (estate-local rule: never route methodology reasoning to a cheaper model);
correctness — substrate verification, no runner desync, no shared-state
collisions in the output directory, deterministic ordering — is.

**Order of invocation:** Alphabetical by member short name (claude →
gemini → gpt → kimi → muse). Stable order makes the run log easier
to audit and makes re-runs deterministic.

**Between members:** Surface a one-paragraph summary to the user
("claude produced corpus emphasizing X; about to invoke gemini") so the
user can intervene before the next member starts if the prior corpus
revealed something unexpected.

## External-source acquisition under the stateless-member substrate

This section resolves what would otherwise be a contradiction in this
file: members are **Facilitator-mandatory and stateless** (no web, no
filesystem), yet Phase 1 **requires** fresh external grounding. A
stateless member cannot fetch. The requirement is satisfied by the
**orchestrator** performing the fetch at Phase-1 time and embedding the
result — this is the ONLY honest realization of the external-research
mandate, and it is mandatory, not optional.

**Why this exists.** If external grounding is left to the members, it
silently collapses to pretraining recall: members emit plausible URLs,
titles, and dates from memory with no `content_sha256`, no
`accessed_utc`, and no guarantee the cited spec still says what the
member remembers. That is the circular-evidence / pretraining-prior
failure the methodology exists to prevent (and the exact gap a prior
run's empty `external_sources[]` arrays demonstrate). Orchestrator
pre-fetch makes the freshness real and auditable.

**Orchestrator procedure (run BEFORE writing the manifest and BEFORE
invoking the first member):**

1. **Enumerate the required external source families** from the
   research question, the Phase 0 forward directives (if any), and the
   topic's standards landscape. A run's Phase 0 / kickoff MAY name a
   mandatory minimum set (e.g. specific RFCs or specs that MUST be
   re-fetched); honor it exactly.
2. **Fetch each source fresh** with the orchestrator's web-fetch tool
   at Phase-1 time. Capture the fetch UTC timestamp.
3. **Persist** each fetched body to
   `phase-1-research/_fetched-sources/<slug>.md` (or `.txt`) so the
   bytes are on disk, re-hashable, and embeddable.
4. **Hash** each persisted file with sha256 (`content_sha256`).
5. **Stage** every persisted external source into
   `phase-1-research/.manifest.sha256.json` `sources[]` alongside the
   in-repo sources, so the Facilitator embeds the verbatim fresh text
   into every member's prompt (Brake #5 source embedding). Members
   read identical embedded corpora — preserving independence while
   guaranteeing shared fresh grounding.
6. **Record the fetch provenance** so it survives into Phase 5: keep an
   orchestrator-authored `phase-1-research/_fetched-sources/index.json`
   mapping each `<slug>` → `{url, title, accessed_utc, content_sha256,
path}`. Phase 5's per-claim provenance table draws external
   `accessed_utc` + `content_sha256` from this index.

**Division of labor (explicit):**

| Concern                                   | Owner                                                   |
| ----------------------------------------- | ------------------------------------------------------- |
| Fetching external primary sources         | **Orchestrator** (has web-fetch; members are stateless) |
| `accessed_utc` + `content_sha256` capture | **Orchestrator** (it performed the fetch)               |
| Embedding fresh text into member prompts  | **Facilitator** (manifest `sources[]` → Brake #5)       |
| Reading + interpreting the embedded text  | **Member** (independent weighting → corpus)             |
| Citing the embedded sources by URL/sha    | **Member** (in `corpus.md` + `external_sources[]`)      |
| Surviving fetch provenance into Phase 5   | **Orchestrator** (`_fetched-sources/index.json`)        |

**Member-side expectation.** Because the fresh external text arrives
embedded, a member's `corpus.provenance.json` `external_sources[]` MUST
cite the embedded sources using the `url`, `accessed_utc`, and
`content_sha256` the manifest/embed header declares — the member does
NOT claim to have fetched them itself (the Facilitator embed header
states this verbatim). This keeps the external-citation floor honest
without asking a stateless member to do the impossible.

## Independence — what each member MUST and MUST NOT read

**MUST read** (the mandatory-context-loading equivalent):

- The research topic / question prompt (verbatim from the caller)
- The list of in-repo source pointers the council-research caller
  provided
- The member's own `.agent.md` file (so the member knows its identity
  for provenance population)

**MUST NOT read**:

- Any other member's `phase-1-research/<other-member>/` directory
  (would contaminate Phase 1 independence)
- Any prior `research/council-research/<earlier-topic>/` directory
  (would bias the current deliberation — same exclusion the council
  skill's `context-loading.md` makes for `research/trio-runs/`)
- Any `research/archive/` content (superseded by design)

The orchestrator's invocation prompt to each member MUST include these
exclusions explicitly. The member's provenance sibling MUST populate
`context_excluded[]` with the paths it was told to avoid (proves it
saw the exclusion rule).

## Failure modes to watch

| Failure mode                                                                              | Detection                                                                                                                                     | Response                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Member returns corpus that restates the prompt without independent research               | Word-count of "Strongest claims" section < 3 propositions, or external-research section empty when topic clearly invites it                   | Pause; ask the member to extend; re-verify before proceeding                                                                                                                                                                                                                                                                                                                                                               |
| Member returns corpus with fewer than 3 external citations on a bedrock-adjacent topic    | Count of unique external URLs / titles / standards / DOIs in corpus < 3                                                                       | First confirm the **orchestrator** staged ≥3 external sources into the manifest (if not, the gap is the orchestrator's pre-fetch step, not the member — fix § External-source acquisition and re-invoke). If sources WERE embedded but the member ignored them, re-invoke with the embedded-source-citation requirement restated. Do NOT silently accept an in-repo-only corpus — it corrupts Phase 2's diversity premise. |
| Orchestrator staged fewer than the required external sources before invoking members      | `phase-1-research/.manifest.sha256.json` `sources[]` contains < 3 external (non-in-repo) entries, or `_fetched-sources/index.json` is missing | **Blocking, pre-invocation.** This is an orchestrator failure, not a member failure. Perform the § External-source acquisition procedure (fetch fresh, persist, hash, stage into the manifest) before invoking any member. A run whose members never received fresh external text cannot satisfy the external-grounding mandate no matter how the members are re-prompted.                                                 |
| Member uses self-referential phrasing (first-person model name, signature stylistic tags) | Grep `corpus.md` for the model's short name in first-person constructions                                                                     | Re-invoke with the anti-self-reference rule restated; if persistent, the orchestrator strips identifying phrases before Phase 3 anonymization (and records the strip in the run log)                                                                                                                                                                                                                                       |
| Member reads a forbidden directory (e.g., a sibling member's corpus)                      | `context_excluded[]` in provenance does NOT list the directory; OR sibling-member-specific terminology appears in corpus                      | Pause; do NOT use this member's corpus in Phase 2; escalate                                                                                                                                                                                                                                                                                                                                                                |
| Member's `corpus.provenance.json` is missing                                              | File absence at end-of-invocation                                                                                                             | Pause; ask the member to emit the sibling; if member cannot, treat as Phase 1 failure for that member and decide whether to fall back to (N-1)-member roster for the rest of the run                                                                                                                                                                                                                                       |
| Two members produce nearly-identical corpora                                              | Manual review at orchestrator-side cross-phase summary                                                                                        | Document as a finding (low input-diversity for this topic) but proceed; the Phase 3 adversarial review will surface whether this is a sign of a clear consensus or a sign of pretraining-prior agreement                                                                                                                                                                                                                   |

## Methodology primitives applied

Both primitives in [`methodology-primitives.md`](methodology-primitives.md) apply here:

- **Orchestrator-computed input hash manifest (adj-5).** Before invoking the first member, write `phase-1-research/.manifest.sha256.json` covering the in-repo source pointers / corpus seeds **plus the orchestrator-pre-fetched external primary sources** (see § External-source acquisition under the stateless-member substrate — the manifest is the embedding surface that delivers fresh external text to stateless members). Each member's invocation prompt MUST instruct it to verify the manifest hashes before reading any input, and to record `sources[].sha256_verified_against_manifest` in `corpus.provenance.json`.
- **Fingerprint independence check (adj-6) — corpus-cross-citation variant.** After all corpora are saved but BEFORE Phase 2 begins, compute the self-citation rate for each member: `self_citations / total_citations` where `self_citations` are citations recognizably pointing at content the member's vendor authored (vendor docs, vendor blog, vendor papers). Threshold tuning is content-prevalence-dependent (not 1/N); flag any member whose rate exceeds the mean by more than 2× as a candidate self-anchoring case for the mini-retro. Save findings to `phase-1-research/.fingerprint-check.json`. This is INFORMATIVE for Phase 1 (does not block advancement to Phase 2 unless extreme) but feeds Phase 5's per-claim citation independence check.

## Cross-references

- [`methodology-primitives.md`](methodology-primitives.md) — hash manifest + fingerprint check primitives
- [`phase-2-clinical-synthesis.md`](phase-2-clinical-synthesis.md) — what Phase 2 does with the N corpora
- [`model-roster.md`](model-roster.md) — which members participate
- [`provenance-schema.md`](provenance-schema.md) — sibling-file shape
- [`output-directory-structure.md`](output-directory-structure.md) — where Phase 1 outputs land

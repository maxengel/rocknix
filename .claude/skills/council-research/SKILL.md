---
name: council-research
description: Orchestrate the 5-phase council-research methodology — independent parallel research (one corpus per member) → clinical synthesis (Researcher Agent, N-to-N, NO adversarial framing) → adversarial peer review → council deliberation (delegates to the `council` skill) → deliverable with per-claim provenance and per-artifact attestation. Use when the user says "council-research", "research methodology", "research-then-deliberate", "comprehensive research with adversarial review", "5-phase analysis", or any request for bedrock-adjacent / architecturally-consequential research that demands multi-model input diversity AND fresh tool-using research up front. Pairs with the lighter `council` skill (which handles deliberation when inputs already exist).
license: Apache-2.0
tools: [readFile, edit, search, runSubagent, todos]
agents:
  [
    council-member-claude,
    council-member-gemini,
    council-member-gpt,
    council-member-kimi,
    council-member-muse,
    Researcher Agent,
  ]
# Single-element prioritized list — see `.claude/skills/council/references/model-verification.md`.
model:
  - "Claude Opus 4.8 (copilot)"
argument-hint: "Describe the research topic that needs multi-agent input diversity AND fresh research"
metadata:
  version: 1.9.1
  revision_note: "v1.9.1 (2026-09-28): roster text follows the council's definitive five, with Muse Spark 1.3 in the seat Mistral held (scaffold#915), and states the five-seat rule in place of the old 4/3 degeneration; no phase contract change. v1.8.3 (2026-09-09): route research preflight to the shared archive/request scope and capacity-diagnosis guidance; no phase contract, roster or invocation change. v1.8.2 (2026-06-03): codified exclusive gate-artifact writes and added the gate-artifact lint as a standing phase-closeout check. Gate JSON files are authored one path at a time, then parsed and linted before advancement."
  origin: "M64.P1.5 Epic 2 / #2824 (council-infrastructure spec). Wraps the `council` skill (M64.P1.5 Epic 1 / #2826) in a 5-phase research pipeline. The hard invariant — Phase 2 (clinical synthesis) MUST NOT include adversarial framing — was learned the hard way during M64.P1 single-agent R-spikes; the per-artifact attestation requirement was added 2026-05-19 in response to a provenance investigation during R7 (#2809) audit. v1.1.0 (2026-05-22): added double-blind sequestration to Phase 3 and Phase 4, external-fetch floor (≥3 citations) and anti-self-reference to Phase 1, kickoff-conformance gate + verdict-conflict rule + hash-recomputation advisory to Phase 2, in response to the council-on-council trial-run meta-findings (model fingerprint independence, echo-chamber amplification, and kickoff drift surfaced empirically during the run's own Phase 3 audit). v1.2.0 (2026-05-26): promoted adj-2..adj-6 from the 2026-05-24 R2 (researcher-federation-substrate, Issue #2978) run — Phase 3 fingerprint-check augmented with bidirectional content-variance check (adj-2), severity-weighted critique density (adj-3) replacing raw mention-count proxy, and sequestered-evaluator subagent for tied-min qualitative comparison (adj-4); orchestrator-computed input hash manifest (adj-5) and generalized fingerprint independence check (adj-6) extracted to `references/methodology-primitives.md` and applied per-phase across Phases 1, 2, 4, and 5. Refinement adj-1 (canonical tie-handling rule) deferred to post-Phase-5 meta-council. v1.3.0 (2026-05-27, #3049): added Phase 0 (prior-run evaluation) as a conditionally-required preamble phase that runs BEFORE Phase 1 when any Phase 1 corpus source path matches `research/**` or `docs/research/**`. The trigger is mechanically detectable (grep-able for a future lint). Phase 0 reconciles prior in-repo artifacts against the new run's scope via a delta-disposition table (vocabulary: `accept-current`, `accept-prior`, `accept-blended`, `open-question`, `methodological-only`) plus an evidence-tier audit that scopes the new run's external grounding. Outputs: `phase-0-prior-run-evaluation/evaluation.md` + sibling `.provenance.json`, plus `delta-amendments.md` when any disposition is `accept-blended` or `accept-prior`. Origin: the R2-210 retrofitted Phase 0 (`research/council-research/2026-05-24-researcher-federation-substrate/phase-0-prior-run-evaluation/`) that closed #2992, which empirically confirmed Phase 3 GPT OBJECTION 1 — 0 of 11 R2-200 Phase-2 'Strong'-tier claims had independently-fetched external grounding, reducing council convergence to five readings of the R2-100 durable artifact. R2-210 is the canonical example; new Phase 0 passes should adapt its shape, not its conclusions. Cross-link: `.github/instructions/research-versioning.instructions.md` for the R-N00 run-version convention Phase 0 artifacts must use. Full procedural language in `references/phase-0-prior-run-evaluation.md`. v1.4.0 (2026-05-28, #2991 RC2–RC6): hardened the provenance substrate around the orchestrator/facilitator boundary. (RC2) `scripts/council-invoke.ts` now emits **composite Facilitator provenance** with FLAT top-level fields (`artifact_path`, `output_file_sha256`, `source_file_paths[]`, `source_file_hashes[]`, plus `facilitator_*` metadata) — the orchestrator-staged source-hash manifest binds into the same provenance record the Facilitator emits. (RC3) New CLI flags `--council-research-run-id`, `--phase`, `--source-manifest`, `--invoker-agent-name` with paired both-or-neither validation on `--council-research-run-id` + `--phase`; manifest JSON shape and orchestrator 5-step workflow documented in `references/provenance-schema.md`. (RC4) Output file hashing is read-back-from-disk (`sha256(await readFile(outputPath))`), not buffer-hash — `references/provenance-schema.md` carries paired CORRECT/WRONG snippets and the three rationales. (RC5) `scripts/lint-council-research-digests.ts --fix-artifact-paths` repairs misspelled/relocated `artifact_path` fields with a `fileHasOutputMismatch` safety guard that refuses to repair when the output hash is also wrong (prevents the lint from masking the very drift it exists to surface). (RC6) Per-run `.digest-drift-allowlist.json` mechanism (preserved-historical-corpus runs absorb known drift as evidence, not failure) + `council-research-lint-summary` pre-commit hook running `scripts/summarize-council-research-lints.ts --strict research/council-research/` (provenance lint has no allowlist surface — absence of `blocking_count` is treated as all-blocking). Regression coverage: `scripts/__tests__/council-invoke-composite-provenance.test.ts` (2 tests), `scripts/__tests__/lint-council-research-digests.test.ts` (7 tests), `scripts/__tests__/council-research-lint-summary.test.ts` (3 tests). Production corpus (297 historical findings on the 2026-05-24 R2 run) absorbed by the per-run allowlist → strict exit 0. v1.5.0 (2026-05-31, #2891 R9-100 closeout / #3081): added Rule 10 — gitignored/untracked tooling MUST NOT appear in `source_file_paths[]`; only committed content inputs are verifiable sources. `scripts/lint-council-research-digests.ts` now emits a `gitignored-source` finding via memoized `git check-ignore` (fired after exists-check, before hash-check), deliberately scoped to gitignored (NOT untracked via `git ls-files`, which would false-positive on a run's own pre-first-commit sources). `scripts/lint-council-research-provenance.ts` walker now skips `_inputs/**` subtrees — committed non-derived content inputs a run consumes (e.g. a byte-identical copy of a prior run's corpus) are root inputs verified by downstream hash pins, not run-generated artifacts, so they are exempt from the derived-artifact `.provenance.json` sibling requirement. Regression: `scripts/__tests__/lint-council-research-digests.test.ts` grows to 8 tests (added 'reports gitignored sources'). Surfaced during R9-100 because its run directory was authored entirely pre-first-commit; a 1-level provenance metadata-chain cascade (artifacts citing sibling `.provenance.json` files re-pin on post-hoc source edits) was resolved in the same closeout — a methodology-eats-substrate finding."
---

# Council-research

For the choice between an advisory preliminary review, formal council and
fresh council research, read [Review formats](../council/references/review-formats.md).
The preliminary review does not complete any phase or acceptance gate here.

You are the **council-research orchestrator**. You coordinate a structured
5-phase research-then-deliberate pipeline across the registered member
subagents (`council-member-claude`, `council-member-gemini`,
`council-member-gpt`, `council-member-kimi` and `council-member-muse`, all five
required) AND the `Researcher Agent` for clinical synthesis,
delegating to the `council` skill for the final deliberation. Your job
is to drive the process; the member subagents and the Researcher Agent
do the substantive thinking; the `council` skill handles deliberation.

## When to use

Run when **all** of these are true:

- The research topic is bedrock-adjacent or architecturally consequential
  (the deliverable will shape a foundational principle, a schema, an
  identity model, a primitive, or a release shape)
- Fresh tool-using research is required up front — the inputs do not
  yet exist as a corpus the caller can hand to a deliberation
- Multi-model input diversity is the point — a single model reading
  the same source materials would systematically under-cover blind
  spots an N-model parallel research pass surfaces

Common triggers:

- The user says "council-research", "research methodology",
  "research-then-deliberate", "comprehensive research with adversarial
  review", "5-phase analysis"
- A bedrock-adjacent R-spike (M64.P1 R8–R16 and beyond)
- A schema redesign whose validity depends on competing prior-art the
  agent has not yet read
- A retro / RCA whose root cause hypothesis competes with adversarial
  alternatives that need to be researched, not just deliberated

## When NOT to use

- The inputs already exist as a corpus — use the lighter `council`
  skill directly; council-research's Phase 1 + Phase 2 are wasted work
  when the research is already done
- Single-model questions where the answer is well-known or trivially
  verifiable
- Time-sensitive incident response (council-research is bounded but
  not instantaneous — use single-model judgment + later council-research
  review if the decision merits revisiting)
- Pure code-review / debugging tasks (use `code-auditor`, not council-research)

If you only need deliberation, invoke the `council` skill instead.
If the topic is well-scoped and a single model can produce a complete
analysis, do not invoke this skill at all.

## The 5 phases (with conditional Phase 0 and repair-only Phase 2.5)

```
Phase 0 — Prior-run evaluation  ←── REQUIRED when any Phase 1 corpus
   Delta-disposition table over prior in-repo artifact(s);   source path matches `research/**`
   evidence-tier audit; verification log                     or `docs/research/**`
   (skipped when all Phase 1 sources are external or         (see references/phase-0-prior-
    non-research-corpus in-repo material)                      run-evaluation.md)
                            │
                            ▼
Phase 1 — Independent research
   N members produce N parallel corpora from the same prompt
   (serial subagent invocation; no literal parallelism — see phase-1)
   (members are stateless: the ORCHESTRATOR pre-fetches + embeds the
    required external primary sources via the manifest — see phase-1
    § External-source acquisition under the stateless-member substrate)
                            │
                            ▼
Phase 2 — Clinical synthesis  ←── HARD INVARIANT: NO ADVERSARIAL FRAMING
   Researcher Agent does N-to-N cross-reference over the N corpora
   Produces ONE structured synthesis document
                   │
                   ▼
Phase 2.5 — Semantic neutralization  ←── REQUIRED for R<N>-200+ Phase 3 replay
                                           and cross-run recurrence families
  Orchestrator normalizes Phase 2 / claim-card inputs into shuffled,
  atomic claim records with private claim maps and sentinel controls
                            │
                            ▼
Phase 3 — Adversarial peer review
  Each member reads the sequestered Phase 3 bundle and produces an
  adversarial critique (every member is now Devil's Advocate against
  the synthesis or normalized claim set)
                            │
                            ▼
Phase 4 — Council deliberation     ──── DELEGATES TO `council` skill
   The `council` skill runs its full 6-step pipeline against the
   Phase 2 synthesis + Phase 3 adversarial reviews as inputs
                            │
                            ▼
Phase 5 — Deliverable
   Final artifact with per-claim provenance + per-artifact attestation
   Authored by the orchestrator from Phase 4 output
```

Each phase has one corresponding reference in `references/`. Each phase
output emits a sibling `.provenance.json` per the provenance schema.

## Hard invariant — Phase 2 MUST NOT include adversarial framing

Clinical synthesis is **neutral, factual, source-structured**. The
Researcher Agent in Phase 2 produces a synthesis that maps what each of
the N corpora claims, where they agree, where they diverge, and what
each cites — without taking a position on which is right.

Adversarial work belongs ONLY in Phase 3 (adversarial review) and
Phase 4 (council deliberation). **Mixing adversarial framing into
Phase 2 corrupts the dataset Phase 3 operates on** — Phase 3 needs to
critique the synthesis from the standpoint of someone seeing it neutral.
If the synthesis is already prejudicial, the adversarial review either
becomes meta-critique (less useful) or doubles down (worse).

This invariant is stated in three places: here in SKILL.md (above),
in [`references/phase-2-clinical-synthesis.md`](references/phase-2-clinical-synthesis.md)
(first 30 lines), and in the Tier-3 enforcement file
`council-research.instructions.md` (E5 deliverable).
Triple statement is intentional per the precedent in
`silent-failure-discipline.instructions.md`: critical invariants are
stated wherever they could be missed; never in a single place.

## Hard invariant — Phase 0 REQUIRED when consuming prior in-repo artifacts

A council-research run that ingests a prior in-repo research artifact
as Phase 1 corpus material does not produce independent corroboration
of the prior run's picks — it produces N readers re-reading the same
upstream document. Phase 0 (prior-run evaluation) makes that
inheritance legible **before** Phase 1 begins, via a delta-disposition
table, an evidence-tier audit, and a verification log.

**Trigger (mechanically detectable).** Phase 0 is REQUIRED when any
intended Phase 1 corpus source path matches `research/**` or
`docs/research/**` in this repository, OR when the kickoff prompt
names a prior run's deliverable / transition return / working notes /
phase artifact as input material, OR when the new run is a
re-iteration of a prior research question (any R-N00 run with
`N ≥ 2` per `research-versioning.instructions.md`).

**Skipped** when every Phase 1 corpus source is external (web-fetched
at Phase 1 time) or non-research-corpus in-repo material (specs, code,
instruction files, runbooks, RFCs).

**Outputs:** `phase-0-prior-run-evaluation/evaluation.md` + sibling
`.provenance.json`; plus `delta-amendments.md` + sibling provenance
when any disposition is `accept-blended` or `accept-prior`.

**Disposition vocabulary** (the complete set; do not invent labels):
`accept-current`, `accept-prior`, `accept-blended`, `open-question`,
`methodological-only`.

**Retrofitted passes are legitimate.** When the Phase 0 requirement
post-dates a shipped run, a retrofitted Phase 0 produces the same
outputs and applies amendments as a dated header on the existing
Phase 5 deliverable. Substrate picks do not change. The canonical
retrofitted example is R2-210
(`research/council-research/2026-05-24-researcher-federation-substrate/phase-0-prior-run-evaluation/`,
closed the source estate's issue 2992).

This invariant is stated in three places: here in SKILL.md (above),
in [`references/phase-0-prior-run-evaluation.md`](references/phase-0-prior-run-evaluation.md)
(the full procedural language), and the Tier-3 enforcement file
`council-research.instructions.md` (E5 deliverable) — when present —
is the lint surface. Triple statement is intentional per the same
precedent as the Phase-2 invariant above.

## Your responsibilities

1. **Accept the research topic** from the user (or upstream skill) and
   set up the output directory under `research/council-research/` per
   [`references/output-directory-structure.md`](references/output-directory-structure.md)
2. **Determine the active roster** per [`references/model-roster.md`](references/model-roster.md)
   (all five: claude, gemini, gpt, kimi and muse; a missing seat halts Setup for
   diagnosis and repair, never a reduced roster)
3. **Generate a `council_research_run_id` UUID** and propagate it
   through every phase invocation so provenance records cross-link
4. **Determine whether Phase 0 is required** by inspecting the
   intended Phase 1 source manifest; if any source path matches
   `research/**` or `docs/research/**`, run Phase 0 BEFORE Phase 1
   per [`references/phase-0-prior-run-evaluation.md`](references/phase-0-prior-run-evaluation.md)
5. **Run each of the 5 phases in order** by invoking the relevant
   subagent(s) per the per-phase references. **Before invoking any
   Phase 1 member**, pre-fetch the run's required external primary
   sources (members are stateless and cannot fetch), persist them under
   `phase-1-research/_fetched-sources/`, capture `accessed_utc` +
   `content_sha256`, and stage them into the Phase 1 source manifest so
   the Facilitator embeds them — see
   [`references/phase-1-independent-research.md`](references/phase-1-independent-research.md)
   § External-source acquisition under the stateless-member substrate
6. **Track progress** using the `todos` tool — one todo per (phase, member)
   pair plus the synthesis checkpoints
7. **Run the per-phase boundary gate** after EVERY phase, before advancing —
   write the artifact, write its `.provenance.json` sibling **at write time**,
   run the phase-scoped provenance + digest lints, and run the source-fact
   probe for content artifacts. Full checklist:
   [`references/orchestrator-runbook-checklist.md`](references/orchestrator-runbook-checklist.md).
   Backfilling provenance/probes at run closeout (instead of per phase) is the
   failure this gate prevents — it turns one-phase rework into whole-run rework.
8. **Verify outputs exist on disk** before advancing to the next phase
9. **Verify `.provenance.json` siblings exist** alongside every phase output
   (absence = pause + escalate per
   [`subagent-orchestration.instructions.md`](../../../.github/instructions/subagent-orchestration.instructions.md))
10. **Ensure every `source_file_paths[]` entry is a committed content input**,
    never gitignored or scratch tooling. A source that is gitignored (e.g.
    a helper under `tmp/`) cannot be re-verified from a fresh checkout, so
    `scripts/lint-council-research-digests.ts` emits a `gitignored-source`
    finding even when the file exists and hashes correctly. Committed,
    non-derived inputs that a run consumes (e.g. a byte-identical copy of a
    prior run's corpus) live under the run's `_inputs/` directory —
    git-tracked, hash-pinned by every consuming artifact, and exempt from the
    derived-artifact `.provenance.json` sibling requirement
    (`_inputs/` files are root inputs, not run-generated artifacts)
11. **Run the source-fact probe at end-of-phase** for Phase 2, Phase 3,
    Phase 4 deliberation output, and Phase 5 — see § Source-fact probe
12. **Run the lint summary at closeout** with
    `npx tsx scripts/summarize-council-research-lints.ts <run-dir>` before
    reporting integrity status. Do not infer or invent ad hoc summarizer
    script names; this checked-in command is the durable human-summary
    surface for provenance + digest findings. If any phase replay or
    superseded attempt exists, also run strict summaries over each accepted
    canonical-chain directory and record both results in the run README: the
    full-root posture, and the canonical-chain posture. Never report a run as
    fully clean when only the canonical chain is clean; say that the canonical
    chain is clean and name the preserved superseded findings separately.
13. **Synthesize cross-phase themes** between phases so the user stays
    informed (the user should be able to read a one-paragraph summary
    between each phase rather than having to read the artifact)
14. **Author the final deliverable** in Phase 5 with full per-claim
    provenance + per-artifact attestation

## Source-fact probe

**Run at end-of-phase** for any phase that produces a content artifact
(Phase 2 synthesis, Phase 3 reviews, Phase 4 council deliberation output,
Phase 5 deliverable). This is the consumer-side verification primitive
that closes the structural gap the per-artifact attestation declares.

Procedure (4 steps):

```text
1. READ the phase-N output file (synthesis, adversarial review, or deliverable).

2. EXTRACT N source-specific claims that were NOT in your (the calling
   agent's) invocation prompt:

   - Small outputs (< 500 lines):  sample 5 claims
   - Larger outputs (>= 500 lines): sample 10 claims

   A "source-specific claim" is a claim that cites a fact, quote, number,
   file path, line number, or relationship not present verbatim in the
   calling agent's invocation prompt. Headers, restated prompt content,
   and meta-prose ("this analysis shows...") do NOT count.

3. LOCATE each claim's source via the sibling .provenance.json:

   - For each claim, identify which entry in source_file_paths[] it cites
   - Verify that path appears in source_file_paths[]
   - Verify source_file_hashes[] at the same index matches
     sha256sum of the actual file content NOW (this verifies the
     executor really read the version of the source they claim)

4. VERIFY each claim against the actual source file content:

   - Open the source file via read_file
   - Confirm the cited fact / quote / number actually appears in the file

   - If ALL N claims verify → PASS; executor honesty presumed
   - If ANY claim fails to verify → FAIL; pause + escalate per
     subagent-output-verification.instructions.md (do NOT silently re-run
     the phase or quietly drop the claim)
```

Consumer-side re-hash command (Bash one-liner):

```bash
# Run from repo root. Replace <phase-N-output>.provenance.json with the actual sibling file.
paste \
  <(jq -r '.source_file_paths[]' <phase-N-output>.provenance.json) \
  <(jq -r '.source_file_hashes[]' <phase-N-output>.provenance.json) \
  | while read -r path claimed_hash; do
      actual_hash=$(sha256sum "$path" 2>/dev/null | awk '{print $1}')
      if [[ "$actual_hash" != "$claimed_hash" ]]; then
        echo "MISMATCH: $path (claimed $claimed_hash, actual $actual_hash)"
      fi
    done
```

A mismatch indicates one of: (a) the source file changed between read
and verify (rare — investigate); (b) the executor fabricated the hash
(serious — escalate); (c) the executor read a different version of
the file than the verifier (investigate which is canonical).

## Provenance — declared by executor, verified by consumer

Every Phase 1–5 output file MUST emit a sibling `.provenance.json` per
[`references/provenance-schema.md`](references/provenance-schema.md).
The schema requires source-file SHA-256 digests captured **at read time**
(not at end-of-phase) so the attestation cannot be backfilled after the
fact. Each executing agent is responsible for appending
`{path, sha256, timestamp_utc}` to its phase's `.provenance.json` working
file immediately when it reads a source.

The skill cannot enforce honest self-reporting — provenance is **declared
by the executor**. The consumer (the next phase, the user, an auditor) is
responsible for **verifying** the declarations via:

1. The consumer-side re-hash command above
2. The source-fact probe procedure above

Absence of `.provenance.json` for any phase output = pause + escalate;
do not advance to the next phase.

### Facilitator-delegated provenance (v1.4.0 — RC2–RC5 of #2991)

When a phase step is delegated to a Facilitator via `scripts/council-invoke.ts`,
the Facilitator emits a **composite** provenance record that binds the
orchestrator's source-hash manifest into the same artifact the Facilitator
writes. The record shape is FLAT at the top level (`artifact_path`,
`output_file_sha256`, `source_file_paths[]`, `source_file_hashes[]`, plus
`facilitator_version`, `council_research_run_id`, `phase`, `invoker_agent_name`).
Orchestrator workflow:

1. Stage a source-hash manifest JSON (`{schema_version, council_research_run_id, phase, sources: [{path, sha256, read_timestamp_utc}]}`) under the run directory.
2. Invoke with `--source-manifest <path> --council-research-run-id <id> --phase <phase-N> --invoker-agent-name <name>`.
3. The Facilitator hashes the output file by **reading it back from disk** (never buffer-hash) and merges manifest sources into the composite provenance.

If digest drift surfaces on a preserved historical corpus (e.g. a retroactive
re-hash of a pre-v1.4.0 run), add a per-run `.digest-drift-allowlist.json`
at the run root with `allow_all_digest_findings_for_run: true` and the
`allowed_kinds` array; the digest lint and summary-gate hook will report
those findings as allowlisted (informational) rather than blocking. New
runs without an allowlist remain fully strict — every digest finding blocks.

## Gate-artifact authoring discipline

Gate JSON artifacts (`.source-fact-probe.json`, `.fingerprint-check.json`,
and phase-local hash manifests) are **exclusive-write artifacts**. The
orchestrator MUST NOT create or edit the same gate path through multiple
tool calls in parallel, and MUST NOT batch gate-artifact writes in a
parallel tool group. Parallel reads are fine; gate writes are serialized:

```text
1. Derive the artifact content.
2. Write exactly one gate artifact path through one write mechanism.
3. Parse it (`jq empty <artifact>` or equivalent JSON parse).
4. Run `npx tsx scripts/lint-council-research-gates.ts --strict <phase-dir>`
   when `.source-fact-probe.json` or `.fingerprint-check.json` is present.
5. Only then write the next dependent gate artifact or advance phases.
```

This is a methodology rule, not a preference. A duplicate or racing write can
leave a gate JSON file syntactically concatenated, stale, or internally
inconsistent while the prose work looks complete. The gate-artifact lint
re-derives hashes, byte counts, line counts, and sampled source hashes from
disk so stale gate metadata is caught before the next phase consumes it.

Full specification (JSON schema, paired CORRECT/WRONG read-back snippets,
`--fix-artifact-paths` safety semantics, allowlist mechanism, summary-gate
two-surface table): [`references/provenance-schema.md`](references/provenance-schema.md).

At run closeout, always summarize the two mechanical lints through the
checked-in closeout command:

```bash
npx tsx scripts/summarize-council-research-lints.ts research/council-research/<run-dir>/
```

Use `--json` when another script or audit artifact needs the combined
summary object, and `--strict` when the closeout should fail on **blocking**
findings. This command is the canonical summary surface; ad hoc `/tmp`
summarizers are not process artifacts and must not be cited as workflow.

**Allowlist-aware exit semantics (v1.1.0 — RC6 Part 2, #2991):** `--strict`
exits non-zero only when the summary's `total_blocking` is > 0. Findings
inside a `.digest-drift-allowlist.json` scope (preserved-historical-corpus
runs, see e.g. the 2026-05-24 researcher-federation-substrate run) are
reported as allowlisted, contribute to `total_allowed`, and do NOT cause
strict exit. This is intentional: a preserved corpus's known drift is
evidence, not a workflow-blocking failure. New runs without an allowlist
remain fully strict — every finding is blocking. The two existing
pre-commit hooks (`council-research-provenance`, `council-research-digests`)
already enforce this gate at commit time; the summary script is the
human-readable closeout surface that explains why the gate did or did
not fire.

## Double-blind & anti-echo protocols (v1.1.0)

A council-research run on the `council` skill's own substrate
(2026-05-22) empirically surfaced three failure modes that no
single-shot read of the methodology catches:

1. **Model-fingerprint independence.** A member adversarially reviewing
   a corpus that carries its own stylistic fingerprint under-critiques
   that corpus, even when not explicitly told which is its own.
2. **Echo-chamber amplification.** A synthesis built on corpora that
   share pretraining priors can converge on artifacts that look like
   strong consensus but are actually shared-prior agreement —
   especially when corpora cite only in-repo paths and skip external
   prior art.
3. **Kickoff drift.** A synthesis can be locally faithful to its
   inputs while silently re-scoping the caller's original kickoff
   question (turning "one option among N" into "the recommendation").

The v1.1.0 mitigations, distributed across the phase references:

| Failure mode                         | Phase | Mitigation                                                                                                                                                          |
| ------------------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Echo-chamber amplification (input)   | 1     | External-fetch floor: ≥3 external citations required per corpus on bedrock-adjacent topics; in-repo-only output is a fail                                           |
| Stylistic-fingerprint leakage        | 1     | Anti-self-reference: members must not first-person-tag their corpus with model identity                                                                             |
| Kickoff drift                        | 2     | Kickoff-conformance check added to the Phase 2 verification gate; verdict-conflict rule (lowest verdict wins)                                                       |
| Provenance-hash corruption           | 2     | Hash-recomputation advisory: post-edit recomputes APPEND, never overwrite the at-read-time digest                                                                   |
| Model-fingerprint independence       | 3     | Double-blind sequestration baseline; after repeated failure, Phase 2.5 normalized claim deck + shuffled non-author review bundles + fingerprint/semantic-bias gates |
| Fingerprint bias carrying to council | 4     | Sequestration extended into Phase 4: anonymized `Review-A`…`Review-N` handles, re-randomized mapping, post-phase check                                              |

These are not optional. The full procedural language lives in each
phase reference — follow it as written. Skipping the sequestration
steps or the fingerprint independence checks is the council-research
equivalent of skipping the source-fact probe: the methodology can no
longer claim to deliver what its description advertises.

## Roster and Foundry quirks

See [`references/model-roster.md`](references/model-roster.md) for the
full roster definition and provider-quirks cross-reference. Council-research
inherits the council skill's **five verified members required** rule. If any
member is unavailable or unverified, halt for diagnosis and repair; do not
reduce the roster. Keep the same five across all member phases. An approved
replacement requires a fresh run from Phase 1, after any required Phase 0;
do not carry four-member conclusions into a late fifth member's inputs.

## Output layout

```
research/council-research/YYYY-MM-DD-<topic>/
├── README.md                       # written at end-of-run
├── phase-0-prior-run-evaluation/   # present ONLY when Phase 0 triggered
│   ├── evaluation.md
│   ├── evaluation.provenance.json
│   ├── delta-amendments.md         # present when any disposition is
│   └── delta-amendments.provenance.json   #   accept-blended or accept-prior
├── phase-1-research/
│   ├── claude/
│   ├── gemini/
│   ├── gpt/
│   ├── kimi/
│   └── muse/
├── phase-2-synthesis/
│   ├── 07-<topic>-synthesis.md
│   └── 07-<topic>-synthesis.provenance.json
├── phase-3-adversarial/
│   ├── claude-adversarial-review.md
│   ├── claude-adversarial-review.provenance.json
│   ├── gemini-adversarial-review.md
│   ├── ...
├── phase-4-deliberation/
│   └── (the council skill's full output layout, transplanted here;
│        see references/output-directory-structure.md)
└── phase-5-deliverable/
    ├── deliverable.md
    └── deliverable.provenance.json
```

See [`references/output-directory-structure.md`](references/output-directory-structure.md)
for the full layout including the path-collision rationale with the
council skill's `research/trio-runs/` path.

## Per-phase references

Read the relevant reference before invoking each phase:

| Phase | Reference                                                                                  | What it covers                                                                                  |
| ----- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| 0     | [`references/phase-0-prior-run-evaluation.md`](references/phase-0-prior-run-evaluation.md) | Conditional preamble; trigger detection; delta-disposition table; evidence-tier audit; retrofit |
| 1     | [`references/phase-1-independent-research.md`](references/phase-1-independent-research.md) | Per-member tool-using research; serial subagent invocation; corpus shape                        |
| 2     | [`references/phase-2-clinical-synthesis.md`](references/phase-2-clinical-synthesis.md)     | Researcher Agent invocation; N-to-N cross-reference; **hard invariant**: no adversarial framing |
| 3     | [`references/phase-3-adversarial-review.md`](references/phase-3-adversarial-review.md)     | Per-member adversarial review of the Phase 2 synthesis                                          |
| 4     | [`references/phase-4-council-deliberation.md`](references/phase-4-council-deliberation.md) | Handoff to the `council` skill (deliberation)                                                   |
| 5     | [`references/phase-5-deliverable.md`](references/phase-5-deliverable.md)                   | Final deliverable authoring; per-claim provenance                                               |

Cross-cutting references:

| Reference                                                                                      | What it covers                                                                                                                                                                                |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`references/model-roster.md`](references/model-roster.md)                                     | Five required members; provider diagnostics; fresh-run replacement rules                                                                                                                          |
| [`references/provenance-schema.md`](references/provenance-schema.md)                           | Per-artifact attestation JSON Schema; per-phase field-population; consumer re-hash                                                                                                            |
| [`references/output-directory-structure.md`](references/output-directory-structure.md)         | Canonical layout; path-collision rationale with the council skill                                                                                                                             |
| [`references/orchestrator-runbook-checklist.md`](references/orchestrator-runbook-checklist.md) | **Per-phase boundary gate** — pre-flight (external pre-fetch), per-phase closeout (provenance sibling at write-time + scoped lints + source-fact probe), run closeout. Run after EVERY phase. |

## Relationship to the `council` skill

The `council` skill is **a substrate**. council-research **uses** the
council skill for Phase 4 deliberation. The council skill can be
invoked standalone (when the inputs already exist); council-research
is invoked when fresh research is needed up front.

| You want to ...                                                  | Invoke ...                                             |
| ---------------------------------------------------------------- | ------------------------------------------------------ |
| Get N models to deliberate over inputs you already have          | `council` skill                                        |
| Run fresh multi-model research, then synthesize, then deliberate | `council-research` skill (this skill)                  |
| Just get one model's analysis                                    | Neither — invoke the relevant single subagent directly |

The council skill's
[`When NOT to use`](../council/SKILL.md#when-not-to-use) section
explicitly redirects to `council-research` for "fresh research belongs
in `council-research` Phase 1, not in the council's initial analysis
step." This skill is the back-direction of that cross-reference.

## Notes

- **This skill is methodology, not enforcement.** The hard invariant,
  the source-fact probe, and the provenance schema are guidance. The
  Tier-3 instruction file `council-research.instructions.md` (E5
  deliverable) provides the enforcement layer for authored artifacts.
- **5 phases, not 6.** The 6-step internal pipeline of the council
  skill is invoked from Phase 4; do not confuse the 6 deliberation
  steps with the 5 research phases. Phase 4 IS one phase that delegates
  to a 6-step substrate. Phase 2.5 is a repair-only neutralizing
  transform used for `R<N>-200+` Phase 3 replays after repeated
  independence failure, not a standing sixth phase.
- **Honesty over polish.** A council-research run that surfaces an
  adversarial critique strong enough to overturn the synthesis is
  more valuable than one that produces a smooth-reading deliverable
  with hidden disagreements. The structure exists to surface
  disagreement, not to suppress it.
- **Versioned repair over quiet rewrite.** A failed phase gate is an
  evidence artifact, not a draft to polish into a pass. Preserve the
  failed directory, create a versioned replay sibling (for example,
  `phase-3-adversarial-r11-120/`), document lineage and methodology
  delta, and let downstream phases consume only a replay whose gate
  passes or is explicitly adjudicated.
- **One council-research per topic per day.** If you need to re-run
  the same topic on the same date, append a `-r{N}` suffix to the
  topic slug (`2026-05-20-vocabulary-r2/`). Do NOT overwrite a prior
  run's directory.

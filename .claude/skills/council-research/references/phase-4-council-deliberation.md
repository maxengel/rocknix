# Phase 4 — Council deliberation

**Purpose:** Hand off the Phase 2 synthesis + N Phase-3 adversarial
reviews to the [`council` skill](../../council/SKILL.md) for full
6-step deliberation. The council produces a single recommended
direction (with dissent recorded) that Phase 5 will write up as the
final deliverable.

**Who executes:** The `council` skill (which itself invokes the same
trio-\* member subagents serially through its 6-step pipeline).
council-research's Phase 4 is a **delegation**, not a re-implementation.

## Scope — invocation cardinality

**The council is invoked ONCE per Phase 4 run; NOT once per claim,
not once per source, not once per Phase-3 review.** The whole
deliberation pipeline runs against one bundled input set (Phase 2
synthesis + N Phase 3 reviews + original sources) and produces one
bundled output (the council's winning revised plan + per-member
votes).

This scope statement matters because a future caller could
reasonably mis-imagine that "rigorous research" requires per-claim
deliberation (sub-council per claim, aggregate the verdicts). That
shape would be quadratic in claims, would corrupt the council's
synthesis-checkpoint discipline, and would mean every recursion round
(`-r2`, `-r3`, …) runs N times instead of once. Don't do it.

The council is a single deliberation primitive; council-research's
Phase 4 is a single invocation of that primitive. If a topic needs
more than one council deliberation (e.g., one for "what's the
problem" and one for "what to do about it"), structure as TWO
council-research runs, not as N sub-councils inside one Phase 4.

## Pre-flight — lint prior-phase outputs before consuming them

Before invoking the council skill, the orchestrator MUST run the
cross-corpus provenance lint over Phases 1–3:

```bash
npx tsx scripts/lint-council-research-provenance.ts --strict \
  research/council-research/<run-dir>/phase-1-research/ \
  research/council-research/<run-dir>/phase-2-synthesis/ \
  research/council-research/<run-dir>/phase-3-adversarial/
```

The lint enforces facilitator attestation across all prior phases and
the cross-corpus collision check (issue #3059). Phase 4 MUST NOT
proceed if any FAIL is reported.

## How council-research wraps the council

The council skill expects its inputs as a problem context. council-research's Phase 4 packages the prior phases into that context:

| Council-skill input       | Council-research source                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Problem statement         | The council-research research topic / question + a one-paragraph framing produced by the orchestrator                                                                                                                                                                                                                                                                                                          |
| Mandatory context loading | The Phase-3-redacted synthesis (`phase-3-adversarial/.synthesis-redacted.md`) + each member's Phase 3 adversarial review **under anonymized `Review-A`…`Review-N` handles** (see Double-blind extension below) + the original Phase 1 source pointers (per [`context-loading.md`](../../council/references/context-loading.md) conventions; council-research provides this list verbatim to the council skill) |
| Active roster             | Inherited from council-research's Setup (do NOT re-detect mid-run; if Phase 1 used 5, 4, or 3 members and Phase 3 used that same locked roster, Phase 4 uses that roster)                                                                                                                                                                                                                                      |
| Output directory          | `research/council-research/<run-dir>/phase-4-deliberation/` — see below                                                                                                                                                                                                                                                                                                                                        |

## Double-blind extension into Phase 4

Phase 3's sequestration (anonymized `Corpus-A`…`Corpus-N` handles)
MUST extend into Phase 4. The same fingerprint-defense argument applies
recursively: a council member deliberating on Phase 3 reviews will
under-critique the review labelled as its own. The mitigation is the
same mechanism, one layer up.

### Sequestration rules for Phase 4

1. **Anonymized review handles.** Phase 3 reviews are referenced in
   the Phase 4 invocation prompt and inputs bundle by opaque handles
   (`Review-A`, `Review-B`, …), NOT by member short-name paths. The
   orchestrator maintains a private
   `phase-4-deliberation/.review-handle-map.json` recording which
   handle maps to which member. **The handle assignment is
   re-randomized for Phase 4** — do NOT reuse the Phase 3 corpus
   handle assignment (a member who pattern-matched their own corpus
   in Phase 3 could carry the mapping forward).
2. **Corpus handle continuity.** Phase 1 corpora referenced in Phase 4
   continue to use the Phase 3 `Corpus-A`…`Corpus-N` handles — same
   mapping as Phase 3, so a member's reasoning chains across phases
   are preserved.
3. **Review-author attribution stripped.** If any Phase 3 review
   internally references its own author by member short-name ("as a
   Claude-class model I observe…"), the orchestrator MUST sanitize
   the review before adding it to the Phase 4 bundle. Save the
   sanitized copies as `phase-4-deliberation/.reviews-sanitized/Review-X.md`
   and use those, NOT the originals. The originals are retained
   un-modified for audit.
4. **No `.provenance.json` siblings of reviews in the Phase 4 bundle.**
   Same rationale as Phase 3 — the `agent_name` field would defeat
   anonymization.
5. **Anti-deduction + self-attribution prohibitions** — same verbatim
   prompt language as Phase 3, restated for Phase 4 inputs.

### Post-Phase-4 fingerprint independence check

After all Phase 4 deliberation steps (initial analysis through peer
votes) complete but BEFORE Phase 5 begins, the orchestrator MUST run
the same fingerprint independence check defined for Phase 3, applied
to Phase 4's peer-review and vote outputs. Pass criterion: the rate at
which a member's most-favorably-treated `Review-X` is its own is no
higher than 1/N. Fail response: pause + escalate; either re-invoke
the failing Phase 4 steps with sequestration re-emphasized, or abandon
the deliberation and document the failure mode.

Results saved to `phase-4-deliberation/.fingerprint-check.json`.

#### Single clean-majority round — the pairwise metric is degenerate

The "most-favorably-treated `Review-X`" rate is a **pairwise
vote-pattern metric**: it measures iterated self-preference across the
deliberation. When Step 4 produces a **clean majority on the first
round** (no tie-breaking recursion is triggered), there is no iterated
pattern to evaluate — each member casts a single vote, and "the rate at
which a member's most-favorably-treated review is its own" has no
multi-round signal to compute over. In that case the operative gate is
the **self-preference check on the single vote round** (did any member
vote for the revised plan it can deduce is its own?), and the pairwise
metric is recorded as **`NOT_EVALUABLE_SINGLE_ROUND`**, which is a
**PASS-equivalent — do NOT escalate**. The fingerprint-check artifact
MUST record `NOT_EVALUABLE_SINGLE_ROUND` explicitly (not silently omit
the metric) so the degenerate case is auditable and distinguishable
from a metric that was computed and passed.

Escalation on the fingerprint check is reserved for (a) a single-round
**self-preference violation** (a member demonstrably favored its own
de-anonymizable plan), or (b) a multi-round recursion in which the
iterated pairwise rate exceeds 1/N. A first-round clean majority with
no self-preference violation is a clean PASS.

The council skill's 6 steps (initial analysis → peer review → revised
approaches → peer votes → issue → handoff) run in full inside Phase 4.
council-research does NOT skip, abbreviate, or re-order those steps.

## Output directory — the council skill's layout transplanted

The council skill's default output is
`research/trio-runs/YYYY-MM-DD-{topic}/`. For Phase 4 of a
council-research run, transplant that layout under
`phase-4-deliberation/`:

```
research/council-research/<run-dir>/phase-4-deliberation/
├── README.md                              # council's per-run README (NOT council-research's top-level README)
├── claude-analysis.md                     # Step 1 outputs
├── claude-analysis.provenance.json
├── gemini-analysis.md
├── gemini-analysis.provenance.json
├── gpt-analysis.md
├── gpt-analysis.provenance.json
├── kimi-analysis.md
├── kimi-analysis.provenance.json
├── muse-analysis.md
├── muse-analysis.provenance.json
├── peer_reviews/
│   ├── claude_peer_review.md              # Step 2 outputs
│   ├── gemini_peer_review.md
│   ├── gpt_peer_review.md
│   ├── kimi_peer_review.md
│   └── muse_peer_review.md
├── revised_approaches/
│   ├── claude-revised_plan.md             # Step 3 outputs
│   ├── gemini-revised_plan.md
│   ├── gpt-revised_plan.md
│   ├── kimi-revised_plan.md
│   └── muse-revised_plan.md
└── peer_votes/
    ├── claude_vote.md                     # Step 4 outputs
    ├── gemini_vote.md
    ├── gpt_vote.md
    ├── kimi_vote.md
    └── muse_vote.md
```

Tie-breaking recursion adds `-r{N}` suffixes per the council skill's
[`tie-breaking-recursion.md`](../../council/references/tie-breaking-recursion.md).

## Invocation discipline

The orchestrator invokes the council skill with:

- A problem statement that begins with the council-research run's
  research topic, followed by a one-paragraph framing of what the
  Phase 2 synthesis says and what the Phase 3 reviews surfaced
- The mandatory-context-loading list: Phase 2 synthesis +
  Phase 3 reviews + Phase 1 source pointers
- The output directory override: `phase-4-deliberation/` (within the
  council-research run directory)
- The roster (locked from Setup; do NOT re-detect)
- The `council_research_run_id` UUID (propagated into the council's
  output README for cross-linking)

The council skill then runs autonomously through its 6 steps. The
council-research orchestrator does NOT intervene between steps; the
council is a black-box primitive for the duration of Phase 4.

### Lighter regime — no standalone-council seal machinery

council-research runs the council under a **lighter provenance
regime** than a standalone council run. The integrity substrate for a
council-research run is: sibling `.provenance.json` files, the
council-research provenance + digest lints, the adj-5 input manifest,
and the adj-6 fingerprint/citation-independence check. council-research
does **NOT** layer the standalone-council "seal" machinery (the
council skill's own run-seal / seal-verification artifacts) on top of
Phase 4. Do not look for, generate, or verify a council seal inside a
council-research Phase 4 — its absence is by design, not a gap. The
mechanically-checkable attestation that Phase 4 routed every member
through the Facilitator is the `facilitator_version` field on each
member artifact's `.provenance.json` (enforced by
`lint-council-research-provenance.ts --strict`), not a seal.

The council skill's Step 5 (issue creation) is OPTIONAL in
council-research context — Phase 5 (deliverable) is where the
council-research run produces its consolidated artifact, and that
artifact replaces the council's standalone issue creation. If a GitHub
issue is needed for the council-research outcome, file it from Phase 5
after the consolidated deliverable lands.

## Verification before advancing to Phase 5

The orchestrator MUST verify before moving to Phase 5:

1. The council skill's full output layout exists under
   `phase-4-deliberation/` (Step 1–4 artifacts for every active member)
2. Every analysis / peer-review / revised-plan / vote artifact has its
   sibling `.provenance.json` per the council skill's
   [`output-conventions.md`](../../council/references/output-conventions.md)
3. The council reached a winning plan (majority emerged); OR the
   council ran to the max recursion round and the user made a
   tie-break decision (recorded in `peer_votes/user-decision-r{N}.md`)
4. The source-fact probe passes for the winning revised plan (the
   document Phase 5 will consolidate from)
5. The council's per-run README is written and references back to the
   council-research run via the `council_research_run_id`

If verification fails: pause + escalate per
[`subagent-orchestration.instructions.md`](../../../../.github/instructions/subagent-orchestration.instructions.md).

## Failure modes to watch

| Failure mode                                                                                   | Detection                                                                                                         | Response                                                                                                                         |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Council recursion hits max round without majority                                              | Council skill's `tie-breaking-recursion.md` enforces a cap and surfaces a tie-break request to the user           | Make the user-level tie-break call; record in `peer_votes/user-decision-r{N}.md`; proceed to Phase 5 with the user's chosen plan |
| Council skill writes outside the transplanted output directory                                 | Filesystem check at end-of-Phase-4                                                                                | Investigate — likely a council-skill bug or a misconfigured invocation; do NOT proceed to Phase 5 with split artifacts           |
| Council's Step 1 analyses don't cite Phase 2 / Phase 3 inputs                                  | Source-fact probe applied to the analyses surfaces 0% citations of `phase-2-synthesis/` or `phase-3-adversarial/` | The mandatory-context-loading list was not respected; pause; investigate whether the invocation prompt was malformed             |
| Roster drifted mid-Phase-4 (e.g., a locked Foundry member became unreachable mid-deliberation) | Council skill should detect at Setup, not mid-run; if it changes, the run is corrupted                            | Abort Phase 4; restart with the now-current roster; document the drift                                                           |

## What Phase 4 does NOT do

- Re-do Phase 2 synthesis (the council's Step 1 reads Phase 2's output;
  it does NOT re-synthesize from raw corpora)
- Re-do Phase 3 adversarial review (the council's Step 2 peer-review
  operates on Step 1 analyses, NOT on Phase 3 reviews — Phase 3 reviews
  are inputs to Step 1, not Step 2)
- Aggregate per-claim verdicts (the council deliberates over the
  problem as a whole; per-claim aggregation would be a different
  methodology, not council-research)
- Author the final deliverable (that's Phase 5)

## Methodology primitives applied

Both primitives in [`methodology-primitives.md`](methodology-primitives.md) apply here:

- **Orchestrator-computed input hash manifest (adj-5).** Before delegating to the `council` skill, write `phase-4-deliberation/.manifest.sha256.json` covering the Phase-3 reviews (sanitized + anonymized under re-randomized Review-X handles) + the redacted synthesis + the N anonymized corpora + Phase-3's `.fingerprint-check.json`. The council skill's per-member invocations MUST verify the manifest before reading any input.
- **Fingerprint independence check (adj-6) — vote-pattern collusion variant.** After each council recursion round completes (Step 4 — peer votes), compute the pairwise vote-agreement rate `votes_in_agreement(M, M') / total_votes` for every member pair. Pass iff no pair exceeds `1/(N-1) + tolerance` (tolerance defaults to 0.10 for small N). Save findings to `phase-4-deliberation/.fingerprint-check.json` with one entry per round. A failure here is **echo-chamber detection** — two members are voting together at above-chance rates, contaminating the council's diversity premise. Pause + escalate; the user adjudicates whether to re-invoke the round with sequestration re-emphasized or accept the winning plan with the collusion finding flagged in the Phase 5 deliverable.

## Cross-references

- [`SKILL.md`](../SKILL.md) — the orchestrator-level discipline this phase fits into
- [`methodology-primitives.md`](methodology-primitives.md) — hash manifest + fingerprint check primitives
- [`phase-2-clinical-synthesis.md`](phase-2-clinical-synthesis.md) — produces one of Phase 4's input documents
- [`phase-3-adversarial-review.md`](phase-3-adversarial-review.md) — produces the other input documents
- [`phase-5-deliverable.md`](phase-5-deliverable.md) — consumes Phase 4's winning plan
- [`../../council/SKILL.md`](../../council/SKILL.md) — the substrate this phase delegates to
- [`../../council/references/pipeline.md`](../../council/references/pipeline.md) — the 6-step pipeline that runs inside Phase 4
- [`provenance-schema.md`](provenance-schema.md) — sibling-file shape
- [`output-directory-structure.md`](output-directory-structure.md) — full layout including Phase 4

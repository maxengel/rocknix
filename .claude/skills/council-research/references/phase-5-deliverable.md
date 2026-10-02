# Phase 5 — Deliverable

**Purpose:** Author the council-research run's final consolidated
artifact — the document any downstream consumer reads to understand
what the council-research run concluded. Carries per-claim provenance
(every claim links back to a phase output) AND per-artifact
attestation (the deliverable itself has a `.provenance.json` sibling).

**Who executes:** The council-research orchestrator (the agent running
the council-research skill — NOT a delegated subagent). Phase 5 is
synthesis-of-deliberation work, and the orchestrator has the full
cross-phase context.

## Pre-flight — lint prior-phase outputs before consuming them

Before drafting the deliverable, the orchestrator MUST run the
cross-corpus provenance lint over every accepted prior-phase directory. If a
phase replay or corrected attempt superseded an earlier phase directory, use
the accepted canonical directory here and do not treat the superseded directory
as a Phase 5 input:

```bash
npx tsx scripts/lint-council-research-provenance.ts --strict \
  research/council-research/<run-dir>/phase-1-research/ \
  research/council-research/<run-dir>/phase-2-synthesis/ \
  research/council-research/<run-dir>/<canonical-phase-3-dir>/ \
  research/council-research/<run-dir>/phase-4-deliberation/
```

Facilitator attestation and substrate non-collision (issue #3059) must
hold across every phase the deliverable will cite. Halt and remediate
upstream before writing the deliverable if any FAIL appears.

## Inputs

The orchestrator reads (with provenance digest capture at read time):

- **Phase 4 winning plan** — `phase-4-deliberation/revised_approaches/<winner>-revised_plan.md`
  (or `<winner>-revised_plan-r{N}.md` if recursion occurred)
- **Phase 2 synthesis** — `phase-2-synthesis/07-<topic>-synthesis.md`
  (for claims that originated in synthesis and survived deliberation)
- **All Phase 3 adversarial reviews from the accepted Phase 3 attempt** —
  `phase-3-adversarial/<member>-adversarial-review.md` for a standard run, or
  the corresponding `phase-3-adversarial-r<issue>-<version>/...` paths when a
  replay/corrected attempt is canonical
  (for objections that were addressed in Phase 4 vs. those left as
  acknowledged dissent)
- **Council Phase-4 vote records** — `phase-4-deliberation/peer_votes/<member>_vote.md`
  (for the vote tally and any user tie-break decision)
- **Phase 1 corpora** — `phase-1-research/<member>/corpus.md`
  (for claims that originated in independent research and trace back
  through synthesis → deliberation to the deliverable)
- **Original source pointers** Phase 1 was seeded with (for primary-source citations)

## Output

```
phase-5-deliverable/
├── deliverable.md
└── deliverable.provenance.json
```

The `deliverable.md` MUST contain:

1. **Header** — research topic, council-research run ID, date,
   active roster, link to council-research run README
2. **Executive summary** (3–5 paragraphs) — the council-research
   run's conclusion in compressed form; suitable for a downstream
   consumer (e.g., a planning doc, an Epic body, a bedrock proposal)
   to quote directly
3. **Recommended direction** — the winning plan from Phase 4, restated
   in the deliverable's voice (NOT verbatim — restated so the
   deliverable is the canonical artifact, not a pointer)
4. **Per-claim provenance table** — every load-bearing claim in the
   deliverable maps to:
   - Which phase artifact it originated in (Phase 1 corpus path,
     Phase 2 synthesis section, Phase 3 review path, Phase 4
     analysis / revised-plan path)
   - Which original source(s) ultimately cited (file path + section
     or URL)
   - Strength tier (Strong / Moderate / Emerging / Speculative —
     matches the Researcher Agent's evidence tiers)
5. **Acknowledged dissent** — Phase 3 objections that survived
   Phase 4 deliberation without being addressed, recorded so the
   downstream consumer knows the council-research outcome is not
   unanimous on these specific points
6. **What's out of scope for this council-research run** — questions
   the topic touched but the run did NOT resolve; pointers to where
   they should be addressed (follow-up council-research, single-agent
   research, separate Milestone, etc.)
7. **Provenance footer** — the `.provenance.json` filename next to
   the deliverable, with an explanation that downstream consumers
   should verify the per-artifact attestation via the consumer-side
   re-hash command in [`../SKILL.md`](../SKILL.md) `## Source-fact probe`

The `deliverable.provenance.json` follows the schema in
[`provenance-schema.md`](provenance-schema.md), with the per-phase
Phase-5 specifics:

- `source_file_paths[]` — every phase-N artifact the orchestrator read
  while authoring the deliverable (Phase 4 winner, Phase 2 synthesis,
  Phase 3 reviews, etc.)
- `source_file_hashes[]` — captured at read time
- `agent_name` — "council-research orchestrator (`<model>`)"
- `invoker_agent_name` — the agent that invoked council-research
  (the user, a parent skill, or another agent)
- `runtime` / `runtime_version` — orchestrator's runtime per KU2
  resolution

## Per-claim provenance — the table shape

The per-claim provenance table is the load-bearing structural primitive
of the deliverable. Every claim that influences a downstream decision
MUST appear in this table. Shape:

| #   | Claim (one sentence) | Originating phase      | Originating artifact                                                                   | Original source(s)                                                  | Strength                          |
| --- | -------------------- | ---------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------- |
| 1   | `<example claim>`    | Phase 2 synthesis      | `phase-2-synthesis/07-{topic}-synthesis.md` § Key Findings § Theme 1                   | `docs/architecture/bedrock/kno-foundational-principles.md` § P10    | Strong (3 corpora converged)      |
| 2   | `<example claim>`    | Phase 1 (gemini)       | `phase-1-research/gemini/corpus.md` § Strongest claims § #4                            | `research/2026_05_07-bedrock-capabilities-blueprints-elevation/...` | Moderate                          |
| 3   | `<example claim>`    | Phase 4 (winning plan) | `phase-4-deliberation/revised_approaches/{winner}-revised_plan-r2.md` § Recommendation | Synthesizes Phase 2 + Phase 3 objection #2                          | Strong (council majority adopted) |

If a claim cannot be sourced to a phase artifact and ultimately to a
real source file or external citation, that claim does NOT belong in
the deliverable. Period.

## Verification before declaring Phase 5 complete

The orchestrator MUST verify:

1. `deliverable.md` and `deliverable.provenance.json` exist on disk
2. `deliverable.provenance.json` validates against [`provenance-schema.md`](provenance-schema.md)
3. The source-fact probe (4 steps in [`../SKILL.md`](../SKILL.md) `## Source-fact probe`)
   passes for `deliverable.md` — this is the LAST chance to catch
   fabrication before downstream consumers act on the deliverable
4. The consumer-side re-hash command passes (`source_file_hashes[]`
   matches re-computed `sha256sum`)
5. Every load-bearing claim has a row in the per-claim provenance
   table (manual review — there is no mechanical check that catches
   "load-bearing claim not in the table"; the orchestrator MUST scan
   the deliverable's executive summary and recommended-direction
   sections and confirm each material claim is in the table)
6. The top-level README of the council-research run directory
   (`research/council-research/<run-dir>/README.md`) is written and
   references the deliverable
7. If any phase replay or superseded attempt exists, the canonical-chain
   strict lint summary passes over the accepted phase directories, and the
   top-level README separately reports any full-root residual findings from
   preserved superseded material
8. **Decision propagation (push rule).** If the deliverable's verdict
   settles a question (a recommended direction, a naming/vocabulary
   ratification, an architecture decision the consuming Epic will
   adopt), the orchestrator sweeps open issues + in-grace planning
   docs for framings the verdict settles, updates them
   (read-then-rewrite), and records a `## Propagation` section in
   `deliverable.md` listing what was searched and updated — or
   `Propagation: none found`. See
   `decision-propagation` (estate-local; scaffold: development-principles § Meta-work — decisions are recorded, then propagated).

If verification fails: pause + escalate per
[`subagent-orchestration.instructions.md`](../../../../.github/instructions/subagent-orchestration.instructions.md).
Do NOT silently re-author or silently drop claims; both would obscure
the failure for future audit.

## The top-level run README

After Phase 5's deliverable lands, write
`research/council-research/<run-dir>/README.md`. This is the entry
point for anyone returning to the council-research run later.
Contents:

- Research topic (one paragraph)
- Active roster (3, 4, or 5 members; reachability evidence for
  `council-member-kimi` and `council-member-muse` when applicable)
- Phase-by-phase summary (one paragraph each):
  - Phase 1: which members produced corpora; any notable input-diversity findings
  - Phase 2: the synthesis's central claims; any prohibited-framing recurrences
  - Phase 3: the strongest objections each member raised
  - Phase 4: vote tally; recursion rounds if any; winning plan link
  - Phase 5: deliverable link; per-claim provenance row count
- Canonical chain table: the accepted directory/artifact set for each phase,
  including any version-suffixed replay that superseded an earlier attempt
- Superseded materials and lint posture: every preserved non-canonical phase
  attempt, why it is superseded, whether it has known digest/provenance drift,
  the full-root lint result, and the canonical-chain strict lint result
- The deliverable's executive summary, verbatim
- Link to the GitHub issue (if Phase 5 filed one)
- Any user tie-break decisions (Phase 4)
- Date the run completed; total duration

## Failure modes to watch

| Failure mode                                                                                        | Detection                                                                                                        | Response                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Per-claim provenance table is incomplete (load-bearing claims without rows)                         | Manual scan during verification                                                                                  | Pause; author missing rows; re-verify                                                                                                                                                                                                                                 |
| Deliverable cites a phase artifact that doesn't exist on disk                                       | `source_file_paths[]` paths fail `test -f`                                                                       | Investigate — typo in path, or fabricated reference; escalate per [`subagent-orchestration.instructions.md`](../../../../.github/instructions/subagent-orchestration.instructions.md)                                                                        |
| `deliverable.provenance.json` source digests don't match re-hash                                    | Consumer-side re-hash mismatch                                                                                   | Investigate; the orchestrator should never produce mismatched digests since it captured them at read time — a mismatch suggests the source changed mid-Phase-5 or the orchestrator failed to capture properly                                                         |
| The deliverable's recommendations contradict the Phase 4 winning plan                               | Manual comparison of `revised_approaches/<winner>-revised_plan.md` with `deliverable.md` § Recommended direction | Investigate; the deliverable should restate Phase 4's winner, not override it. If a divergence is intentional (e.g., the orchestrator caught a Phase 4 oversight), document it in `## Acknowledged dissent` and surface to the user before declaring Phase 5 complete |
| Acknowledged dissent section omits a Phase 3 objection the council acknowledged but did not address | Manual cross-check against Phase 3 reviews + Phase 4 peer-review/revised-plan threads                            | Add the missing dissent; re-verify                                                                                                                                                                                                                                    |
| Full-root lint reports findings only in preserved superseded material                               | Compare whole-run summary with canonical-chain strict summaries and the README's canonical-chain table           | Do not rewrite superseded provenance. Record the full-root caveat and canonical-chain pass separately. Phase 5 may complete only if every accepted canonical-chain directory passes strict lint.                                                                      |

## Methodology primitives applied

Both primitives in [`methodology-primitives.md`](methodology-primitives.md) apply here:

- **Orchestrator-computed input hash manifest (adj-5).** Before authoring the deliverable, write `phase-5-deliverable/.manifest.sha256.json` covering the Phase-4 winning revised plan + the per-claim provenance lookup table (all upstream phase artifacts that any deliverable claim cites). The deliverable's `deliverable.provenance.json` MUST record `sources[].sha256_verified_against_manifest` for every cited artifact.
- **Fingerprint independence check (adj-6) — per-claim citation independence variant.** After the deliverable is drafted but BEFORE it is declared final, walk every substantive claim's provenance row and identify which Phase-1 corpus (or Phase-3 review) is cited as ground truth. Compute the per-member citation rate `member_citations / total_claim_citations`. Pass iff no single member's contributions are cited at rate > `1/N + tolerance` (tolerance defaults to 0.10). Save findings to `phase-5-deliverable/.fingerprint-check.json`. A failure means the deliverable is disproportionately grounded in one member's work — even when Phase 4 produced a balanced winning plan. Pause + re-balance the deliverable's claim sourcing where genuinely possible (multiple corpora may support the same claim); if the imbalance is empirically justified, document it in `## Acknowledged dissent` and proceed under ADJUDICATED.
  - **Expected-ADJUDICATED note (R20 lesson).** Marginal per-member exceedances are the _structurally expected_ signature when the council adopts **single-origin distinctives** on the merits — a unique claim only one corpus originated (e.g. a boundary criterion or field-semantics nuance) necessarily concentrates its citation on that member, because re-attributing it elsewhere would fabricate provenance. When the exceedance (a) is marginal (within ~0.05 of threshold), (b) traces to council-adopted unique warrants rather than systematic over-reliance, and (c) the majority of claims rest on convergent or external ground truth, reach ADJUDICATED deliberately with that three-part justification recorded — this is the methodology working, not a near-miss. (Origin: R20-200 Phase 5, claude/gpt at 0.32 vs 0.30, opposite sides of the vote split.)
  - **Ground-truth attribution, NOT plan-author attribution (mandatory — spurious-FAIL trap).** Each claim MUST be attributed to the **Phase-1 corpus (or Phase-3 review) it draws its warrant from** — its ground truth — NOT to the author of the Phase-4 winning plan. The deliverable's § Recommended direction restates ONE member's winning plan, so every claim trivially traces _through_ that one member. Attributing claims to the plan's author therefore drives that member's citation rate toward `≈ 1.0` (or, with mixed sourcing, `≈ 0.50`) and produces a **spurious adj-6 FAIL** that says nothing about input-diversity — it merely restates that one plan won, which is the expected Phase-4 outcome. The independence the check actually measures is whether the deliverable's _evidence base_ over-concentrates on one member's original research, which is visible only at the ground-truth layer. The orchestrator MUST record this attribution rule in `.fingerprint-check.json` (a `winning_plan_author_note` field) and a `per_claim_attribution` map showing the ground-truth source of each claim, so an auditor can confirm the rates were computed against ground truth and not against the plan author.
- **Per-claim provenance citation requirement.** The deliverable's provenance table MUST cite each upstream phase's `.fingerprint-check.json` verdict inline wherever a claim's provenance chain crosses a phase boundary, so a reader can audit the independence guarantee at every transition the claim survived.

## Cross-references

- [`SKILL.md`](../SKILL.md) — the orchestrator-level discipline this phase fits into
- [`methodology-primitives.md`](methodology-primitives.md) — hash manifest + fingerprint check primitives
- [`phase-4-council-deliberation.md`](phase-4-council-deliberation.md) — what produced the winning plan
- [`provenance-schema.md`](provenance-schema.md) — sibling-file shape (deliverable.provenance.json)
- [`output-directory-structure.md`](output-directory-structure.md) — where Phase 5 outputs land (and the top-level README)
- [`subagent-orchestration.instructions.md`](../../../../.github/instructions/subagent-orchestration.instructions.md) — the calling-agent verification rule downstream consumers should follow when reading this deliverable

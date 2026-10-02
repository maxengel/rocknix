# Phase 0 — Prior-Run Evaluation

> **Required first phase** when any Phase 1 corpus source resolves to a
> prior in-repo research artifact (rather than an externally-fetched
> source). Reconciles the prior artifact against the new run's scope
> **before** Phase 1 corpora are gathered. Codified 2026-05-27 as
> the source estate's issue 3049,
> promoted from the R2-210 retrofit that closed
> the source estate's issue 2992.

## When Phase 0 is required (mechanical trigger)

Phase 0 is REQUIRED for a council-research run when **any** of the
following holds at run setup:

1. **Any** source the orchestrator plans to seed into Phase 1 corpora
   resolves to a path matching `research/**` or `docs/research/**` in
   this repository (i.e. a prior council-research run, council run, or
   research-spike deliverable / synthesis / phase artifact).
2. **Any** prior run's deliverable, transition return, working notes,
   or phase artifact is cited in the kickoff prompt as input material
   the members are expected to read.
3. The new run is explicitly a **re-iteration** of a prior research
   question (e.g. the R-spike re-run chain
   the source estate's issues 2892 to 2898;
   any run whose version label uses the R-N00 convention from
   `research-versioning` (estate-local convention; adopt an R-N00 run-version convention per estate)
   with `N ≥ 2`).

Phase 0 is **not** required when every Phase 1 corpus source is either
external (fetched via web tools at Phase 1 time) or non-research-corpus
in-repo material (specs, code, instruction files, runbooks, RFCs).
Reading a spec or a bedrock document during Phase 1 is normal corpus
gathering, not a prior-run inheritance.

**Mechanically detectable.** The trigger is grep-able: walk the
intended Phase 1 source manifest, regex each path against
`^(research/|docs/research/)`, and if any matches, Phase 0 is required.
A future lint can enforce this against committed run directories by
checking for the presence of `phase-0-prior-run-evaluation/evaluation.md`
when any Phase 1 corpus's `.provenance.json` `source_file_paths[]`
contains a matching path.

## Why Phase 0 exists

A council-research run that consumes a prior in-repo artifact as Phase 1
corpus material does not produce **independent corroboration** of the
prior run's picks — it produces N readers re-reading the same upstream
document. The "convergence" appears strong but reduces to shared
inheritance. The R2-200 run (2026-05-24, federation substrate) was
audited empirically in its retrofitted Phase 0: 0 of 11 Phase-2
"Strong"-tier claims had independently-fetched external grounding;
6 of 11 reduced to two readings of the R2-100 durable artifact, and
5 of 11 were mixed R2-100 + shared in-repo RFCs.

Phase 0 closes this gap by making the inheritance **legible** before
the council deliberates — disposition-by-disposition — so the Phase 5
deliverable can honestly characterize its own evidence tier rather than
claiming re-validation it did not perform.

## Required Phase 0 inputs

- The prior in-repo artifact(s) being consumed — durable deliverables,
  transition return reports, working notes, synthesis files, prior
  adversarial reviews. Enumerate every file the new run will read.
- The new run's research question / scope statement (typically the
  kickoff prompt or the parent research issue body).
- The list of external sources the new run's Phase 1 corpora **will**
  fetch (to scope the evidence-tier audit; if zero, that itself is the
  finding).

## Required Phase 0 outputs

A Phase 0 pass produces these artifacts under
`research/council-research/<run-dir>/phase-0-prior-run-evaluation/`:

| File                               | Required           | Purpose                                     |
| ---------------------------------- | ------------------ | ------------------------------------------- |
| `evaluation.md`                    | yes                | Delta table, evidence-tier audit, log       |
| `evaluation.provenance.json`       | yes                | Sibling provenance with source-file digests |
| `delta-amendments.md`              | when blended/prior | Amendment text for Phase 5 deliverable      |
| `delta-amendments.provenance.json` | when above present | Sibling provenance                          |

Provenance siblings follow [`provenance-schema.md`](provenance-schema.md).

## Disposition vocabulary

Every substantive delta between the prior artifact and the new run's
intended scope MUST be assigned exactly one disposition:

| Disposition           | Meaning                                                 |
| --------------------- | ------------------------------------------------------- |
| `accept-current`      | New run's position stands; prior was over-committed.    |
| `accept-prior`        | Reinstate prior; new run regressed or silently dropped. |
| `accept-blended`      | Neither fully right; amend deliverable to combine.      |
| `open-question`       | Reasonable disagreement; record for downstream work.    |
| `methodological-only` | Delta is about how, not what; no substrate change.      |

These five labels are the complete vocabulary. Do not invent additional
labels mid-run — if a delta resists classification, that itself is a
finding: surface it as `open-question` and explain why in the row's
reasoning column.

## Required structure of `evaluation.md`

Follow this section ordering. The structure is fixed because Phase 4
deliberation and Phase 5 authoring depend on locating specific sections
by heading.

1. **Header block** — Run ID, run version (R-N00 per
   `research-versioning` (estate-local convention; adopt an R-N00 run-version convention per estate)),
   pass type (fresh vs. retrofitted), authored date, tracking issue,
   methodology gap statement (if retrofitted), methodology version.
2. **Naming glossary** — When more than one run of the same research
   issue exists, define each run-version label cited in this document
   (e.g. "R2-100 — older run at `<path>`; R2-200 — newer run at
   `<path>`"). Cross-link
   `research-versioning` (estate-local convention; adopt an R-N00 run-version convention per estate).
3. **§0 Scope and constraint** — Which two (or more) artifacts are
   being reconciled; the disposition vocabulary inline; verification
   discipline statement (per
   [`subagent-orchestration.instructions.md`](../../../../.github/instructions/subagent-orchestration.instructions.md)).
4. **§1 Delta-disposition table** — One row per substantive delta;
   columns `#`, `Axis`, `Direction` (e.g. `sharper-in-current`,
   `sharper-in-prior`, `contradictory`, `orthogonal-elaboration`),
   `Disposition`, `Reasoning`. Closes with a summary count.
5. **§2 Substantive conclusion** — One or two paragraphs naming what
   the deltas collectively mean for the new run's deliverable.
6. **§3 Evidence-tier audit** — Audit the new run's planned Phase 1
   corpora (or, retrofitted, the as-shipped corpora) for evidence tier:
   (a) prior run re-reading, (b) shared in-repo prior art,
   (c) independently-fetched external sources. State the count per
   tier. If (c) is zero, name it.
7. **§4 Verification log** — Per
   [`subagent-orchestration.instructions.md`](../../../../.github/instructions/subagent-orchestration.instructions.md),
   record every consequential dispositional claim verified by the
   calling agent against source files at cited line numbers. No
   summary-trust; if a claim was not independently verified, mark it
   so.
8. **§5 Methodology-eats-substrate note** — When the research topic
   is structurally analogous to the reconciliation problem this Phase
   0 pass just performed, surface it explicitly per
   `methodology-eats-substrate` (estate-local finding class).
   Omit the section when the analogy doesn't apply.
9. **§6 Required deliverable amendments** — If any disposition is
   `accept-blended` or `accept-prior`, enumerate the amendments and
   point at `delta-amendments.md` for the concrete amendment text.
10. **§7 References** — Every source-of-truth artifact cited;
    governance references (tracking issues, parent research issues,
    Epic identifiers); relevant instruction files.

## Verification discipline

Per
[`subagent-orchestration.instructions.md`](../../../../.github/instructions/subagent-orchestration.instructions.md),
Phase 0 is dispositionally consequential — its outputs drive Phase 5
amendments. The Researcher Agent (or any delegated subagent) may
enumerate deltas but the **calling orchestrator agent** MUST verify
every consequential dispositional claim against source files at cited
line numbers before accepting it into §1's table. Verification log
entries belong in §4.

## Fresh vs. retrofitted passes

A Phase 0 pass is **fresh** when it runs before Phase 1 begins — the
intended state. A pass is **retrofitted** when it runs after Phase 5
has shipped (typically because the Phase 0 requirement post-dates the
run). Retrofitted passes are legitimate and produce the same outputs;
they MUST mark themselves as retrofitted in the header block and name
the methodology gap explicitly. The R2-210 pass (closed
the source estate's issue 2992)
is the canonical retrofitted example.

A retrofitted pass does **not** trigger re-running Phases 1–5. Its
amendments are applied as a dated amendment header on the existing
Phase 5 deliverable; substrate picks do not change.

## Naming

Phase 0 artifacts MUST use the R-N00 versioning convention from
`research-versioning` (estate-local convention; adopt an R-N00 run-version convention per estate)
to disambiguate runs. When citing a prior run's run-version (e.g.
`R2-100`) and the new run's run-version (e.g. `R2-200`), define both
in the Naming glossary block at the top of `evaluation.md`. Never
write bare `R2` when you mean a specific run.

## Canonical example

The R2-210 retrofitted Phase 0 at
`research/council-research/2026-05-24-researcher-federation-substrate/phase-0-prior-run-evaluation/evaluation.md` (the source estate's repository)
exemplifies every required output: header block with retrofitted-pass
marker, naming glossary, 18-row delta-disposition table, evidence-tier
audit confirming 0-of-11 external grounding, eight-row verification
log, methodology-eats-substrate note, five required deliverable
amendments (sibling
`delta-amendments.md` (the source estate's repository)),
and references block.

When authoring a new Phase 0 pass, read the R2-210 evaluation first as
the working template, then adapt the section structure to your run's
deltas. Do not copy R2-210's dispositional conclusions; copy its
**shape**.

## What Phase 0 is NOT

- Phase 0 is **not** a re-run of the prior research. It does not
  re-fetch external sources or re-derive the prior run's picks. It
  reconciles the prior artifact against the new scope.
- Phase 0 is **not** adversarial — adversarial framing belongs to
  Phase 3 (per the hard invariant declared in
  [`phase-2-clinical-synthesis.md`](phase-2-clinical-synthesis.md)
  and [SKILL.md](../SKILL.md)). Phase 0 is **clinical**: it
  enumerates, attributes, and disposes. A `contradictory` direction
  is a factual observation, not an objection.
- Phase 0 is **not** an audit of the prior run's correctness. It
  audits the **delta** between the prior run and the new scope, and
  the **evidence tier** the new run will inherit. The prior run's
  correctness is the prior run's problem.

## Provenance

Like every other phase output, `evaluation.md` and (when present)
`delta-amendments.md` MUST emit sibling `.provenance.json` files per
[`provenance-schema.md`](provenance-schema.md). Source-file SHA-256
digests for every artifact cited in the disposition table MUST be
captured **at read time**, not at end-of-phase. Absence of provenance
= pause + escalate per
[`subagent-orchestration.instructions.md`](../../../../.github/instructions/subagent-orchestration.instructions.md).

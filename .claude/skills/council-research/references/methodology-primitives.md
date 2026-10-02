# Methodology primitives

Reusable orchestrator-side primitives the 5-phase pipeline depends on.
Both primitives in this doc were promoted from one-off mitigations
applied during the 2026-05-24 researcher-federation-substrate run
(see that run's `phase-3-adversarial/.fingerprint-check.json` for the
empirical origin); they are now mandatory baseline discipline across
all council-research runs from v1.2.0 onward.

## 1. Orchestrator-computed input hash manifest (adj-5)

**Problem this solves.** Subagent-emitted `corpus.provenance.json`
files record `sources[].sha256` of the inputs the subagent claims it
read. When subagents emit `sha256: null` (Foundry-hosted members,
network-fetch members, models that don't compute hashes by default)
the per-claim provenance trail loses a load-bearing integrity check:
later phases cannot prove "the corpus this Phase-2 synthesis was
built on is the same corpus Phase-3 reviewers saw."

**The primitive — hash inversion.** The orchestrator, NOT the
subagents, computes the canonical hash manifest over every input
artifact at the moment that artifact enters a phase's sequestered
bundle. Subagents are then prompted to **echo** the manifest hashes
back in their provenance files (or to recompute and the orchestrator
verifies). Either direction works because the orchestrator's manifest
is the source of truth.

### When to compute

A hash manifest MUST be written at the start of each phase that hands
inputs to a subagent:

| Phase                  | Manifest location                            | Covers                                                                      |
| ---------------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| Phase 1 (research)     | `phase-1-research/.manifest.sha256.json`     | The source pointers / corpus seeds + any pre-staged reference docs          |
| Phase 2 (synthesis)    | `phase-2-synthesis/.manifest.sha256.json`    | The N Phase-1 corpora the Researcher Agent will read                        |
| Phase 3 (adversarial)  | `phase-3-adversarial/.manifest.sha256.json`  | The sequestered bundle: redacted synthesis + N anonymized corpora           |
| Phase 4 (deliberation) | `phase-4-deliberation/.manifest.sha256.json` | The Phase-3 reviews (sanitized + anonymized) + redacted synthesis + corpora |
| Phase 5 (deliverable)  | `phase-5-deliverable/.manifest.sha256.json`  | The Phase-4 winning revised plan + per-claim provenance lookup table        |

### Manifest schema

```json
{
  "$comment": "Orchestrator-computed canonical input manifest. Subagents echo these hashes back in their provenance files.",
  "phase": "phase-3-adversarial",
  "computed_at": "<ISO-8601 UTC>",
  "computed_by": "orchestrator (council-research v<X.Y.Z>)",
  "council_research_run_id": "<UUID>",
  "files": {
    "<relative/path/from/manifest>": {
      "sha256": "<hex>",
      "bytes": <int>,
      "description": "<one-line role description>"
    }
  }
}
```

### Subagent verification contract

Each phase's invocation prompt MUST instruct the subagent to:

1. Read `.manifest.sha256.json` at the start of work
2. For each file path listed in `files`, compute the SHA-256 of the
   bytes the subagent actually read and confirm it equals the manifest
   value
3. Record the manifest path + the verified hashes in the subagent's
   own `corpus.provenance.json` under
   `sources[].sha256_verified_against_manifest: <manifest-path>`
4. If any hash disagrees, abort and report — do NOT proceed with a
   different file than the manifest declares

The orchestrator verifies the subagent's echoed hashes against the
manifest before accepting the artifact. Any disagreement is an
input-integrity failure → pause + escalate (subagent read the wrong
file, the file was mutated mid-phase, or the subagent hallucinated
the hash).

### What this primitive does NOT replace

- Per-artifact provenance siblings (`<artifact>.provenance.json`) —
  those still capture the model identity, tool calls, and reasoning
  trace; the hash manifest only handles input-byte integrity
- Source-fact probe — still required after each phase to verify
  artifact claims are grounded in cited sources
- Bedrock conformance checks — orthogonal concern

---

## 2. Fingerprint independence check (adj-6, generalized)

**Problem this solves.** Each phase has a different mechanism by
which model identity ("fingerprint") can leak in and bias outputs.
The Phase 3 self-match test (defined in
[`phase-3-adversarial-review.md`](phase-3-adversarial-review.md)
§ "Model-fingerprint independence check") was the first instance;
this section generalizes it as a reusable orchestrator loop applied
at every phase where a fingerprint-leak failure mode exists.

**Semantic fingerprint is a first-class risk.** A fingerprint is not
limited to prose style, first-person phrasing, or member names. A member
can recognize its own prior output through the semantic choices it made:
which taxonomy it used, which evidence tier it treated as decisive, which
normative strength it assigned, which implementation consequence it
defended, or which open question it elevated. When a run shows this
failure mode, the next repair must change the information geometry of the
phase input. Prompt emphasis and cosmetic anonymization are insufficient.

### The general loop

For each phase P with a fingerprint risk surface:

1. **Define the structural metric.** Pick a measurable property of the
   phase's outputs that should be independent of "which member
   produced which input" if sequestration is working.
2. **Compute the expected-random rate.** If the metric is a
   most-similar / most-favorable / most-aligned matching across N
   members, the expected random rate is 1/N (uniform null).
3. **Measure the observed rate** from the phase's output artifacts +
   the orchestrator-private handle map.
4. **Compare to threshold.** Pass iff `observed ≤ 1/N` (some noise
   tolerance is acceptable for small N — see per-phase doc).
5. **Save findings.** Write `phase-<N>-<name>/.fingerprint-check.json`
   with the metric, observed rate, threshold, verdict, and a
   `tie_observations[]` block for ambiguous cases. Gate artifacts are
   exclusive-write files: never batch parallel write tools against the
   gate path or its paired `.source-fact-probe.json`; write one path,
   parse it, run `npx tsx scripts/lint-council-research-gates.ts --strict <phase-dir>`,
   then proceed.
6. **Fail response.** Pause + escalate. The next phase CANNOT consume
   bias-contaminated inputs silently.

### Per-phase risk surfaces

| Phase                  | Risk surface                                                                                                         | Structural metric                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 1 (research)     | **Corpus-cross-citation independence** — training-data leakage / self-anchoring                                      | For each member M, count citations in M's corpus that point at content recognizably from M's prior published work (e.g., docs M's vendor authored, M's vendor's blog). Rate = `self_citations / total_citations`. Expected null is content-prevalence-based, not 1/N; per-phase doc TBD.                                                                                    |
| Phase 2 (synthesis)    | **Researcher Agent fingerprint** — synthesizer phrase-bias                                                           | For each member M, compute a phrase-overlap metric between the synthesis prose and M's corpus prose (e.g., shared N-gram count normalized by corpus length). Pass iff no single member dominates phrase-overlap by more than a tunable factor over the mean.                                                                                                                |
| Phase 3 (adversarial)  | **Least-critique-of-self** plus **semantic self-fingerprint** — review under-attacks own corpus or own thesis family | Severity-weighted critique density per (M, corpus) for corpus-shaped bundles; for `R<N>-200+` semantic replays, claim-level critique density, sentinel calibration, non-author coverage, and semantic-bias checks over shuffled normalized claims. Flag when M's least-critiqued corpus/claim family is its own at rate > 1/N or when same-author overlap remains decisive. |
| Phase 4 (deliberation) | **Vote-pattern collusion / echo-chamber**                                                                            | For each pair (M, M'), count `votes_in_agreement(M, M') / total_votes`. Pass iff no pair exceeds `1/(N-1) + tolerance`. Per-recursion-round measurement.                                                                                                                                                                                                                    |
| Phase 5 (deliverable)  | **Per-claim citation independence**                                                                                  | For each substantive claim in the deliverable, identify which Phase-1 corpus (or Phase-3 review) is cited as ground truth. Pass iff no single member's contributions are cited at rate > `1/N + tolerance` across the deliverable's claims.                                                                                                                                 |

The per-phase doc (`phase-<N>-*.md`) for each phase MUST link back to
this primitive and specify (a) its metric, (b) its threshold, (c) its
fail response. Phase-3's instance is the worked example.

### Pass / fail / adjudicated outcomes

Three terminal states per check:

- **PASS** — observed rate ≤ threshold; proceed to next phase
- **FAIL** — observed rate > threshold; pause + escalate; either
  create a versioned replay for the failed phase, or abandon the run
  and document for mini-retro. Do not proceed to the next phase on
  failed inputs, and do not overwrite the failed phase artifacts.
- **ADJUDICATED** — observed rate > threshold BUT either the
  bidirectional content-variance check (adj-2) supports an alternative
  hypothesis OR the sequestered-evaluator (adj-4) returns a verdict
  that disambiguates the ambiguous case. Proceeding under ADJUDICATED
  is permitted only when both (i) the alternative hypothesis is
  documented in `.fingerprint-check.json` and (ii) the user (or a
  side-council, when one is convened — see `tie-handling-rule.md`
  once it exists) explicitly approves continuation.

`.fingerprint-check.json` MUST record which terminal state the check
reached and, for ADJUDICATED, the full disambiguation record.

### Phase replay after a gate failure

When a fingerprint or source-fact gate fails, the failed artifact is part
of the evidence trail. The orchestrator does not edit it into a pass. The
repair path is:

1. Preserve the failed phase directory and its gate artifact exactly as
   produced.
2. Choose a run-version label using
   `research-versioning` (estate-local convention; adopt an R-N00 run-version convention per estate):
   `R<N>-110` for same-methodology phase replay, `R<N>-120` for targeted
   phase methodology refinement, or `R<N>-200` for a full rerun/material
   contract change.
3. Create a version-suffixed phase sibling (for example,
   `phase-3-adversarial-r11-120/`) and a replay metadata artifact that
   names the parent version, failed gate, replay reason, and methodology
   delta.
4. Rebuild the phase input manifest under the replay directory.
5. Run the phase again under the replay contract.
6. Only permit the next phase to consume the replay directory after its
   gate artifact records `verdict: "PASS"` or an explicitly approved
   `verdict: "ADJUDICATED"` with `phase4_allowed: true`.

For Phase 3 fingerprint failures, the first replay repair should use the
claim-card projection protocol in
[`phase-3-adversarial-review.md`](phase-3-adversarial-review.md). Claim
cards reduce stylistic fingerprint leakage while preserving equal evidence
coverage across all corpus handles.

If that targeted replay also fails a fingerprint, severity-parity, or
semantic-bias gate, do not keep replaying the same phase shape. Escalate
to `R<N>-200+` and change the phase input contract: Phase 2.5 normalized
claim records, shuffled per-member claim bundles, hidden sentinel
controls, non-author/leave-one-author-out review assignment, and private
claim reconstruction after all reviews are saved. This is a material
methodology/input-contract change, not another `R<N>-120` replay.

**Cross-run recurrence escalation.** The escalation trigger applies across
a methodological family, not only within a single run directory. If a
prior related council-research run has already shown that claim-card
projection preserves a semantic self-fingerprint, a later run in the same
family MUST skip the `R<N>-120` claim-card replay as its next repair and
move directly to an `R<N>-200+` semantic replay. Replay metadata must name
the prior failed gate and any prior passing semantic replay that justifies
the escalation. For sequenced bedrock / registry runs where the failure
class is already known, the orchestrator SHOULD use the semantic-neutral
Phase 2.5 contract for the first Phase 3 replay, and may use it for the
initial Phase 3 invocation when the expected review target is organized
around prior member theses rather than independent source facts.

`R<N>-200+` Phase 3 replay metadata MUST list both the baseline Phase 3
gates and these semantic-independence gates: `normalized claim deck`,
`non-author review assignment`, `sentinel calibration`, `critique density
sufficiency`, `semantic bias risk`, and `private claim reconstruction`.
The mechanically-checkable subset is enforced by
`scripts/lint-council-research-replay-metadata.ts`.

### Where the per-claim provenance picks this up

Phase 5's deliverable cites `phase-<N>-*/.fingerprint-check.json`
verdicts inline wherever a claim's provenance chain crosses a phase
boundary. A reader of the deliverable can therefore audit the
independence guarantee at every phase transition the claim survived.

---

## Cross-references

- [`phase-3-adversarial-review.md`](phase-3-adversarial-review.md) — first concrete instance of the fingerprint check
- [`phase-4-council-deliberation.md`](phase-4-council-deliberation.md) — vote-pattern variant
- [`phase-5-deliverable.md`](phase-5-deliverable.md) — per-claim citation variant
- [`provenance-schema.md`](provenance-schema.md) — sibling-file shape
- [`output-directory-structure.md`](output-directory-structure.md) — where manifests and fingerprint-check artifacts land

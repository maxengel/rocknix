# Phase 3 — Adversarial peer review

**Purpose:** Each member subagent reads the Phase 2 clinical synthesis
and produces an adversarial critique — identifying weaknesses, hidden
assumptions, missing perspectives, prior-art the synthesis didn't
cite, and counter-arguments to every load-bearing claim. Adversarial
work belongs HERE and in Phase 4, NEVER in Phase 2.

**Who executes:** Each active member subagent (`council-member-claude`,
`council-member-gemini`, `council-member-gpt`, `council-member-kimi`,
and `council-member-muse` when each is in the locked roster),
invoked one at a time by the council-research orchestrator.

## Why a separate phase from Phase 2

Phase 2 produced a neutral synthesis. Phase 3 critiques that synthesis
adversarially. The separation is structural:

- **Phase 2** asked "what does the corpus say?" — descriptive
- **Phase 3** asks "what would a sharp critic say is wrong with this
  synthesis?" — evaluative

Mixing them (a single phase that both synthesizes and critiques)
would either suppress weak critiques (because they undermine the
synthesis the same agent just produced) or warp the synthesis to fit
the critique. Two phases, two agents, two artifacts; the seam is
load-bearing.

## Double-blind sequestration — the load-bearing independence discipline

**The single largest threat to Phase 3's adversarial signal is a member
treating its own Phase 1 corpus more gently than its peers'.** Models
are strongly biased to defend prior output that carries their own
stylistic and reasoning fingerprint, even when they are not explicitly
told which corpus is theirs. R11-100 surfaced the operational version of
this failure: anonymized raw corpora plus an anti-deduction instruction
still produced a Phase 3 fingerprint-check FAIL. Instruction-level
emphasis is therefore not enough; the live review bundle must reduce the
fingerprint signal available to the reviewer.

The mitigation is **double-blind sequestration with neutral projection**:
every member adversarial review is invoked against anonymized inputs,
and Phase 1 corpora are projected into uniform claim cards before they
enter the live member bundle. Raw Phase 1 prose remains available to the
orchestrator for audit and source-fact checks, but members receive the
claim-card projection unless the orchestrator documents a specific
reason a style-normalized appendix is required.

### Claim-card projection contract

For each anonymized `Corpus-X`, the orchestrator authors a neutral claim
card artifact before member invocation. The projection removes member
name, provenance sibling, directory path, first-person phrasing, and
distinctive prose style while preserving the corpus's substantive claims.

Each claim card uses this shape:

| Field                        | Requirement                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| `claim`                      | One load-bearing claim from the source corpus, restated in neutral third-person prose                   |
| `evidence cited`             | Source files, standards, prior run artifacts, or issue inputs the corpus cited for that claim           |
| `source hashes`              | SHA-256 hash(es) for the cited source artifact(s), copied from the source corpus provenance or manifest |
| `uncertainty`                | The corpus's caveat, open question, or confidence level for the claim                                   |
| `implementation consequence` | What accepting the claim would require downstream                                                       |

The projection is not a synthesis and not a critique. It is a normalized
evidence index for adversarial review. If a claim cannot be represented
without quoting raw prose, quote the smallest necessary passage and mark
it as a style-bearing appendix item. Full raw corpora do not enter the
live review bundle after any fingerprint failure.

## Semantic-neutral Phase 2.5 — required after repeated Phase 3 independence failure

Claim-card projection removes prose style, but R11-120 showed that a
reviewer can still recognize and protect its own thesis through the
claim's semantic shape: which distinction it considers load-bearing,
which evidence tier it elevates, which policy consequence it defends,
and which open question it treats as decisive. That is a **semantic
self-fingerprint**, not a stylistic fingerprint. Further prompt emphasis
does not repair it.

When a targeted Phase 3 replay using claim-card projection still fails a
fingerprint, severity-parity, or semantic-bias gate, the next replay MUST
use a materially new `R<N>-200+` contract with a neutralizing Phase 2.5
before Phase 3 member invocation. Phase 2.5 is an orchestrator-authored
transformation, not a new synthesis and not an adversarial critique. It
normalizes the Phase 2 synthesis and Phase 1 claim cards into atomic,
shuffled, source-grounded claim records that can be reviewed without
corpus grouping.

**Cross-run recurrence rule.** The "targeted replay still fails" trigger
is not scoped only to one run directory. If a council-research family has
already produced a claim-card Phase 3 replay that failed fingerprint,
severity-parity, or semantic-bias gates, then later runs in that same
methodological family MUST NOT repeat the claim-card replay as the next
repair. They escalate directly to an `R<N>-200+` semantic replay. A
methodological family is a sequence of runs that shares the same council-
research substrate, phase contract, and failure class even when the
research question changes (for example, the R10/R11/R12 registry and
capability-bedrock sequence). The replay metadata must name the prior
failed gate and the prior passing semantic replay, so the escalation is
auditable rather than implicit.

**Default for sequenced bedrock / registry runs.** When a new run belongs
to a family that has already demonstrated semantic self-fingerprint, the
orchestrator SHOULD start Phase 3 with the `R<N>-200+` semantic-neutral
contract instead of waiting for another claim-card failure. If the
orchestrator chooses the lighter claim-card contract anyway, the reason
must be recorded in the Phase 3 replay plan or gate artifact before any
member invocation. A bare "no prior failure in this exact run" rationale
is insufficient once the failure class is known across the family.

### Phase 2.5 normalized claim record

Each live claim record uses this shape:

| Field                        | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `claim_id`                   | Opaque shuffled identifier; MUST NOT encode corpus, member, or source ordering                                                                                                                                                                                                                                                                                                                                                                                                         |
| `claim_text`                 | One atomic claim, restated in neutral third-person prose                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `claim_type`                 | One of the run's pre-registered categories, e.g. `policy_model`, `identity_model`, `evidence_tier`, `release_state`, `mirror_authority`                                                                                                                                                                                                                                                                                                                                                |
| `normative_strength`         | `must`, `should`, `may`, or `open`. **Divergent-front rule (R20 lesson):** a claim drawn from a synthesis _divergence_ (a position one or some corpora hold against others) MUST carry `open`, never `must`/`should`/`may` — assigning normative strength to one side of an unresolved divergence presents it as settled and reviewers will (correctly) flag the deck itself. All five R20 reviewers independently raised this against `should`/`may`-strength divergent-front claims. |
| `evidence_kind`              | `fresh_external`, `inherited_in_repo`, `blended`, or `unsupported_background`                                                                                                                                                                                                                                                                                                                                                                                                          |
| `decision_surface`           | `schema`, `evaluator`, `public_label`, `policy`, `future_research`, or another pre-registered surface                                                                                                                                                                                                                                                                                                                                                                                  |
| `evidence_refs`              | Source paths, standards, prior run artifacts, or issue inputs that ground the claim                                                                                                                                                                                                                                                                                                                                                                                                    |
| `source_hashes`              | SHA-256 hash(es) for cited sources, copied from the manifest/provenance chain                                                                                                                                                                                                                                                                                                                                                                                                          |
| `uncertainty`                | Caveat, open question, confidence boundary, or explicit `none stated`                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `implementation_consequence` | What accepting the claim would require downstream                                                                                                                                                                                                                                                                                                                                                                                                                                      |

The live claim record MUST NOT contain member names, `Corpus-X` handles,
raw Phase 1 prose, member directory paths, or provenance siblings that
name `agent_name`. The orchestrator saves the private mapping separately
as `normalized-claims/private-claim-map.json`; that file is never sent to
members and is revealed only in the post-review gate artifact.

### Shuffled claim review bundles

For an `R<N>-200+` semantic replay, each member receives a per-member
review bundle assembled from the normalized claim deck:

1. **No corpus grouping in the live bundle.** Claims are shuffled as a
   single list. There is no `Corpus-A`, `Corpus-B`, or equivalent object
   for a reviewer to recognize, rank, or defend.
2. **Leave-one-author-out by default.** If the reviewer is one of the
   original Phase 1 authors, the live bundle excludes claims whose private
   map traces only to that reviewer. The claim still receives review from
   the other roster members; it is not dropped from the phase.
3. **Non-author reviewers may receive the full deck.** If a critic who
   did not author any Phase 1 corpus is available through the approved
   Council Facilitator path, that critic can review the full shuffled deck
   and their output can serve as independent adjudication for contested
   claims.
4. **Same-author review is advisory.** If operational constraints force a
   reviewer to see a claim that maps to their own Phase 1 corpus, that
   reviewer flags it as `advisory_due_to_author_overlap` after the review
   is complete; the claim cannot be used to unblock Phase 4 unless at
   least one non-author reviewer or an independent adjudicator also
   reviews it.
5. **Hidden calibration controls.** The orchestrator mixes at least three
   sentinel claims into each review bundle: one known-weak claim, one
   known-strong claim, and one semantic-neighbor claim that is close to a
   real claim but changes the decision consequence. The live bundle does
   not label them as controls. The answer key lives at
   `sentinels/private-answer-key.json` and is not sent to members.

### R&lt;N&gt;-200+ Phase 3 gate set

An `R<N>-200+` semantic replay inherits the normal Phase 3 gates and adds
these mandatory gates, enforced in replay metadata by
`scripts/lint-council-research-replay-metadata.ts`:

- **normalized claim deck** — every live claim follows the Phase 2.5
  record shape and carries no author/corpus identifiers;
- **non-author review assignment** — every non-sentinel claim has at
  least one non-author review, and any same-author overlap is marked
  advisory;
- **sentinel calibration** — reviewers catch the known-weak claim, do not
  falsely reject the known-strong claim as unsupported, and distinguish
  the semantic-neighbor claim from the real claim it resembles;
- **critique density sufficiency** — each reviewer supplies enough
  claim-level objections across categories for the gate to distinguish
  independent critique from sparse agreement;
- **semantic bias risk** — the post-review gate checks whether a reviewer
  is still protecting a recognizable thesis family even when no corpus
  object exists in the live bundle;
- **private claim reconstruction** — the orchestrator reconstructs claim
  coverage against the private claim map only after all reviews are saved,
  then records coverage gaps and owner-overlap status in the gate artifact.

Phase 4 may consume an `R<N>-200+` replay only when the replay metadata
and `.fingerprint-check.json` agree that all inherited and semantic gates
pass, or when the user explicitly approves an `ADJUDICATED` gate with
`phase4_allowed: true`.

### Sequestration rules

The Phase 3 invocation for member M MUST satisfy ALL of the following:

1. **Anonymized corpus handles.** Phase 1 corpora are referenced in
   the invocation prompt and the inputs bundle by opaque handles
   (`Corpus-A`, `Corpus-B`, `Corpus-C`, …), NOT by member short-name
   directory paths. The orchestrator maintains a private
   `phase-3-adversarial/.handle-map.json` (NOT distributed to members)
   recording which handle maps to which member. The handle assignment
   is randomized per Phase 3 invocation — do NOT use a stable mapping
   that a member could memorize across runs.
2. **Member M does NOT receive raw own-prose as an input.** Member M's
   own corpus is represented in the bundle (so M is critiquing the same
   N evidence streams the synthesis was built from), but only through
   the neutral `Corpus-X` claim-card projection. M is NOT told which
   handle is its own work, and M MUST NOT attempt to deduce it. The
   invocation prompt restates this rule verbatim.
3. **Synthesis attribution stripped.** If the Phase 2 synthesis cites
   corpora by member short-name (e.g., "claude's strongest claim was…"),
   the orchestrator MUST produce a Phase-3-only redacted copy at
   `phase-3-adversarial/.synthesis-redacted.md` where every short-name
   is replaced with the corresponding `Corpus-X` handle. The redacted
   copy is what Phase 3 members read; the original synthesis is NOT in
   the Phase 3 invocation bundle.
4. **The bundle distributed to members carries NO `.provenance.json`
   siblings and NO handle map.** The original
   `phase-1-research/<member>/corpus.provenance.json` files name the
   `agent_name` (e.g., `council-member-claude`) and would defeat the
   anonymization. The live member bundle includes the redacted synthesis,
   `claim-cards/Corpus-X.md` files, and source index material only — no
   provenance sibling, no `.handle-map.json`, and no raw member directory
   path travels with the invocation.

   **Boundary-gate provenance (authored AFTER all N reviews are saved).**
   The Phase 4 pre-flight lint (see
   [`phase-4-council-deliberation.md`](phase-4-council-deliberation.md)
   § Pre-flight) runs `lint-council-research-provenance.ts --strict` over
   the WHOLE `phase-3-adversarial/` directory, which requires a sibling
   for every `.md` — scaffolding included. This is intentional, and it
   does NOT contradict the first paragraph: once all reviews are saved
   (and ONLY then — there is no live-run de-anonymization risk because
   members are stateless and never receive sibling files), the
   orchestrator MUST author lightweight **derived-provenance** siblings
   per [`provenance-schema.md`](provenance-schema.md) v1.1.0:
   - each `claim-cards/Corpus-X.md` → `Corpus-X.md.provenance.json`
     with `derivation_kind: "claim-card-projection"` and
     `derived_from_artifact_path` pointing at the handle's real
     `phase-1-research/<member>/corpus.md`;
   - `.synthesis-redacted.md` → `.synthesis-redacted.md.provenance.json`
     with `derivation_kind: "sequestered-redaction"`, derived from the
     Phase 2 synthesis;
   - `_phase3-adversarial-prompt.md` →
     `_phase3-adversarial-prompt.md.provenance.json` with
     `derivation_kind: "orchestrator-prompt"`.

   These siblings carry digest bindings (`artifact_path`,
   `output_file_sha256`, `source_file_paths[]`, `source_file_hashes[]`)
   but **no member attestation**. They reveal nothing about the
   handle→member mapping that is not already openly recorded in the
   gate artifact after member work completes.
   Authoring them is what makes the Phase 4 boundary gate pass without
   re-introducing the de-anonymization that this rule's first paragraph
   prevents. (Rule-4-vs-lint-scope was a stale-prose contradiction
   surfaced + reconciled during the R8 run, 2026-05-30.)

5. **Anti-deduction instruction.** The Phase 3 invocation prompt
   includes verbatim: "Do NOT attempt to determine which of
   Corpus-A…Corpus-N is your own prior work. If you find yourself
   pattern-matching on stylistic fingerprints to identify authorship,
   stop — the methodology depends on you treating all N corpora as if
   they were all written by other agents. Critique each corpus and the
   synthesis with equal rigor."
6. **Self-attribution prohibition.** The member's `<member>-adversarial-review.md`
   MUST NOT contain phrasing like "this is similar to my Phase 1
   reasoning" or "Corpus-B appears to be my own work". If such phrasing
   appears, the review FAILS the sequestration check and the orchestrator
   pauses + escalates.

### Model-fingerprint independence check (mandatory, post-Phase-3)

After all Phase 3 reviews are saved but BEFORE Phase 4 begins, the
orchestrator MUST run a fingerprint independence check across the
N reviews. This phase's fingerprint check is the canonical instance
of the methodology primitive defined in
[`methodology-primitives.md`](methodology-primitives.md) §
"Fingerprint independence check"; that doc is the source of truth for
the loop shape, threshold, and escalation rules. Phase-3-specific
details:

1. For each member M's review, identify the corpus that the review
   critiqued least severely. **Severity-weighted critique density (adj-3):**
   compute `density(M, corpus_X) = Σ(severity_weight × mention_count)`
   over §4 "Dropped or distorted Phase 1 claims" mentions, where
   severity weights are `{SEVERE: 4, HIGH: 3, MEDIUM: 2, LOW: 1}`.
   Members MUST emit a severity tag per objection in §1 and per
   dropped-claim entry in §4 — standardize this in the invocation
   prompt. Raw mention-count (the v1.1.0 proxy) is now deprecated.
2. Cross-reference against the private `.handle-map.json`: is the
   least-critiqued corpus statistically more likely to be M's own?
3. **Pass criterion:** across the N members, the rate at which a
   member's least-critiqued corpus is its own is no higher than
   1/N (random chance for N=3: 33%; N=4: 25%; N=5: 20%). A single
   self-coincidence is within noise; two or more is a sequestration
   failure regardless of the explanation offered.
4. **Bidirectional content-variance check (adj-2, mandatory companion).**
   The negative self-match test above can produce ambiguous ties when
   the same corpus is least-critiqued by multiple non-owner reviewers
   — that pattern is structural evidence of content-property variance
   (the corpus genuinely has less to critique), NOT self-favoritism.
   For every corpus that is in the least-critiqued tier for ANY
   reviewer, compute the severity-weighted density across ALL
   non-owner reviewers. If `mean(non_owner_density) ≤ owner_density`
   for corpus X, the content-variance hypothesis is supported and
   becomes a documented mitigating factor when interpreting a tie
   involving corpus X. Record per-corpus mitigation findings in
   `.fingerprint-check.json` under
   `bidirectional_content_variance_check[]`. This check is informative,
   not pass/fail on its own — its role is to disambiguate tied-min
   readings.
5. **Sequestered-evaluator step (adj-4).** When the strict-lowest test
   produces an ambiguous tie that demands a qualitative
   depth-of-critique comparison between an owner's critique and
   non-owners' critiques of the same corpus, that comparison MUST be
   performed by a FRESH subagent invocation with no knowledge of the
   handle map and no access to the run's prior context. The
   orchestrator passes the subagent only
   `{owner_critique_redacted, non_owner_critiques_redacted}` — author
   handles further stripped or re-randomized — and asks for a
   severity/depth comparability rating on a fixed 5-point scale.
   This prevents the qualitative-comparison step from importing the
   bias it is trying to detect. Save the subagent's verdict to
   `.fingerprint-check.json` under `sequestered_evaluator_verdicts[]`.
6. **Coverage and parity companion gates.** A Phase 3 review passes the
   sequestration gate only if it also satisfies all of these checks:
   - coverage parity: every review must critique every `Corpus-X` at
     least once, and no corpus may receive less than half the median
     count of substantive critique entries unless the reviewer documents
     a content-property reason;
   - severity distribution parity: severe/high objections must not be
     concentrated only on non-owner handles while owner handles receive
     only low-severity treatment;
   - unsupported-claim detection: every load-bearing Phase 2 claim the
     reviewer accepts or rejects must identify whether the claim-card
     bundle supports it, omits it, or contradicts it;
   - no self-attribution or style-identification language;
   - orchestrator raw-corpus spot check: the orchestrator samples claim
     cards against the raw corpora after reviews are saved to verify the
     projection did not hide material claims.
7. **Fail response:** if the check fails, pause + escalate. The Phase 4
   deliberation CANNOT proceed on Phase 3 inputs that show fingerprint
   bias — the council would inherit and amplify the bias. Preserve the
   failed Phase 3 directory as evidence, create a versioned phase replay
   per [`methodology-primitives.md`](methodology-primitives.md) § "Phase
   replay after a gate failure". The first replay repair may use
   claim-card projection only when this failure class has not already
   recurred in the run's methodological family. If claim-card projection
   has already failed in a prior related run, or if the claim-card replay
   fails in the current run, the next repair MUST be an `R<N>-200+`
   semantic replay with Phase 2.5 normalized claim records, shuffled
   per-member review bundles, hidden sentinel controls, and non-author/
   leave-one-author-out review assignment. Silent acceptance is banned.

The `.handle-map.json` and the fingerprint-check results MUST be saved
to `phase-3-adversarial/.fingerprint-check.json` for audit and for
the Phase 5 deliverable's per-claim provenance to reference. The
schema for that file is:

```json
{
  "handle_map": { "Corpus-A": "<member-shortname>", ... },
  "severity_weighted_density": { "<member>": { "Corpus-X": <number>, ... }, ... },
  "least_critiqued_per_member": { "<member>": "Corpus-X", ... },
   "coverage_parity": { "<member>": { "Corpus-X": { "critique_entries": <number>, "meets_floor": <bool> } } },
   "severity_distribution_parity": { "verdict": "PASS|FAIL", "notes": "..." },
   "unsupported_claim_detection": { "verdict": "PASS|FAIL", "unsupported_claims": [...] },
   "self_attribution_language": { "verdict": "PASS|FAIL", "findings": [...] },
   "raw_corpus_spot_check": { "performed": <bool>, "verdict": "PASS|FAIL", "sampled_cards": [...] },
   "semantic_replay_gates": {
      "normalized_claim_deck": { "verdict": "PASS|FAIL", "claim_count": <int>, "findings": [...] },
      "non_author_review_assignment": { "verdict": "PASS|FAIL", "review_matrix": {...}, "advisory_reviews": [...] },
      "sentinel_calibration": { "verdict": "PASS|FAIL", "sentinel_results": [...] },
      "critique_density_sufficiency": { "verdict": "PASS|FAIL", "per_reviewer": {...} },
      "semantic_bias_risk": { "verdict": "PASS|FAIL", "findings": [...] },
      "private_claim_reconstruction": { "verdict": "PASS|FAIL", "coverage_by_source": {...} }
   },
  "self_match_count": <int>,
  "threshold_n_inverse": <float>,
  "pass_strict_lowest": <bool>,
  "tie_observations": [...],
  "bidirectional_content_variance_check": [
    { "corpus": "Corpus-X", "owner_density": <n>, "non_owner_mean_density": <n>, "content_variance_supported": <bool> }
  ],
  "sequestered_evaluator_verdicts": [
    { "corpus": "Corpus-X", "verdict": "<5-point scale rating>", "subagent_provenance": {...} }
  ],
   "verdict": "PASS|FAIL|ADJUDICATED",
   "phase4_allowed": <bool>,
  "user_adjudication": {...}
}
```

## Pre-flight — lint prior-phase outputs before consuming them

Before composing each member's Phase 3 invocation prompt, the
orchestrator MUST run the cross-corpus provenance lint over both
Phase 1 and Phase 2 outputs:

```bash
npx tsx scripts/lint-council-research-provenance.ts --strict \
  research/council-research/<run-dir>/phase-1-research/ \
  research/council-research/<run-dir>/phase-2-synthesis/
```

The lint must pass before any Phase 3 invocation. A FAIL means a
prior-phase artifact lost facilitator attestation or two members
collapsed to the same substrate (issue #3059); halt and remediate
the prior phase before sequestering for adversarial review.

## Inputs the orchestrator provides each member

When invoking each member for Phase 3, the orchestrator's prompt
MUST include:

1. **The Phase-3-only redacted synthesis** — for a standard or
   claim-card replay this is `phase-3-adversarial/.synthesis-redacted.md`,
   with member short-names replaced by `Corpus-X` handles. For an
   `R<N>-200+` semantic replay, this is
   `normalized-claims/synthesis-target.md`: a Phase-2.5 neutralized
   synthesis excerpt with no corpus handles, used only to preserve the
   target of critique.
2. **The sequestered review bundle for that member.** For the first
   claim-card replay, this is the N anonymized `claim-cards/Corpus-X.md`
   projections. For an `R<N>-200+` semantic replay, this is only
   `review-bundles/<member>-claim-bundle.json`: shuffled normalized
   claims excluding that member's own-source claims when leave-one-author-
   out applies, plus hidden sentinel controls.
3. **The original source pointers** Phase 1 was seeded with, plus any
   source index material needed to verify card evidence without exposing
   author identity
4. **The `council_research_run_id` UUID**
5. **Output location:** `phase-3-adversarial/<member>-adversarial-review.md`
6. **Provenance instruction:** emit the sibling
   `<member>-adversarial-review.provenance.json` per the
   [`provenance-schema.md`](provenance-schema.md)
7. **Adversarial mandate** — explicit:

   > Your job is to find what's WRONG with the redacted Phase 2
   > synthesis. Not what's lightly improvable, not what's stylistically
   > off — what's **wrong**. Hidden assumptions the synthesis treats as
   > fact. Prior art the synthesis doesn't cite. Counter-arguments to
   > load-bearing claims. Claims from the N corpora that got dropped
   > or distorted. Frame your review as if you're trying to convince a
   > skeptical reader that the synthesis should NOT be adopted as-is.
   > Be the strongest critic you can be. The point of this phase is
   > to surface weakness, not to validate consensus.

8. **Sequestration rules** — verbatim per the Double-blind
   sequestration section above (anti-deduction instruction +
   self-attribution prohibition). For `R<N>-200+` semantic replay, also
   include: "Do not infer claim authorship from topic, taxonomy, evidence
   preference, or policy consequence. Treat every claim as written by an
   external proponent whose identity you cannot know."

For an `R<N>-200+` semantic replay, the Facilitator invocation MUST use
`source-manifests/<member>.source-manifest.json`, not a global manifest.
The per-member manifest includes only that member's review bundle,
`normalized-claims/synthesis-target.md`, and source index material. It
MUST NOT include other members' bundles, `normalized-claims/claims.json`,
`normalized-claims/private-claim-map.json`, or
`sentinels/private-answer-key.json`.

## What each member produces

```
phase-3-adversarial/<member>-adversarial-review.md
phase-3-adversarial/<member>-adversarial-review.provenance.json
```

The `<member>-adversarial-review.md` MUST contain:

- **Strongest objections** (3–7 numbered objections, ranked by severity)
  — each with: claim being critiqued, the counter-argument, the
  evidence (citation), the consequence if uncorrected
- **Hidden assumptions the synthesis makes** — assumptions the synthesis
  treats as established that the member thinks are debatable, with the
  member's reasoning
- **Missing perspectives / prior-art** — what the synthesis didn't cite
  that it should have, with the member's external citations
- **Dropped or distorted Phase 1 claims** — specific claims from any
  member's Phase 1 corpus that the synthesis omitted or restated in a
  way that changed the meaning, with the original citation and the
  reframed citation side-by-side
- **What the synthesis got right** — brief, honest; the adversarial
  framing is for honest critique, not for performative negativity

For an `R<N>-200+` semantic replay, the review MUST additionally contain
a machine-readable claim ledger section with one row per reviewed claim:

| Field                     | Meaning                                                                 |
| ------------------------- | ----------------------------------------------------------------------- |
| `claim_id`                | Opaque ID from the review bundle                                        |
| `verdict`                 | `accept`, `revise`, `reject`, or `insufficient_evidence`                |
| `severity`                | `SEVERE`, `HIGH`, `MEDIUM`, `LOW`, or `NONE`                            |
| `critique`                | The adversarial reason for the verdict                                  |
| `evidence_assessment`     | Whether cited evidence supports, omits, contradicts, or under-specifies |
| `implementation_risk`     | Concrete downstream risk if the synthesis adopts the claim unchanged    |
| `possible_author_overlap` | `none_detected`; reviewers MUST NOT speculate on member identity        |

The ledger is the input to the critique-density, sentinel-calibration,
semantic-bias, and private-reconstruction gates. A review that only
offers narrative prose for an `R<N>-200+` semantic replay is incomplete.

## Invocation discipline — serial, alphabetical

Same as Phase 1: invoke each member one at a time, alphabetical order
(claude → gemini → gpt → kimi → muse). Reasons identical to Phase 1
(`agent-terminal-safety`, council-skill precedent, no-cheap-reasoning).

**Between members:** Surface a one-paragraph summary to the user
("claude's strongest objection was X; about to invoke gemini") so the
user can intervene.

## Independence — what each member MUST and MUST NOT read

**MUST read:**

- The Phase-3-only redacted synthesis (`phase-3-adversarial/.synthesis-redacted.md`)
- The sequestered review bundle for their invocation: either the N
  anonymized claim-card projections for first replay repair, or the
  per-member shuffled normalized claim bundle for `R<N>-200+` semantic
  replay
- The original source pointers from Phase 1
- The member's own `.agent.md` (for provenance population)

**MUST NOT read:**

- The un-redacted Phase 2 synthesis (`phase-2-synthesis/07-<topic>-synthesis.md`)
  — author short-names would defeat anonymization
- `phase-1-research/<member>/` paths in their member-named form — only
  the anonymized handle paths are in the bundle
- The `.handle-map.json` (orchestrator-private)
- `normalized-claims/private-claim-map.json` or
  `sentinels/private-answer-key.json` during an `R<N>-200+` semantic
  replay (orchestrator-private until all reviews are saved)
- Any other member's `phase-3-adversarial/` review (would contaminate
  the independence of the adversarial critique — every member must
  produce their critique from their own reasoning, not by piggy-backing
  on a peer's review)
- Any `corpus.provenance.json` siblings (would reveal `agent_name`)
- Any prior `research/council-research/<earlier-topic>/` directory

The orchestrator MUST sequence Phase 3 invocations so each member only
sees prior members' critiques AFTER their own is written and saved.
Practically: invoke claude first, claude writes their review; then
invoke gemini with a prompt that does NOT include claude's review
(only Phase 2 synthesis + corpora). Repeat for gpt, kimi, and muse
when they are in the locked roster.

## Verification before advancing to Phase 4

The orchestrator MUST verify before moving to Phase 4:

1. Every active member produced their `<member>-adversarial-review.md`
   on disk
2. Every review has its `<member>-adversarial-review.provenance.json`
   sibling
3. Every provenance sibling validates against
   [`provenance-schema.md`](provenance-schema.md)
4. The source-fact probe (SKILL.md `## Source-fact probe`) passes for
   EACH review (not just one — every review is its own artifact)
5. The fingerprint/boundary gate passes. For `R<N>-200+` semantic
   replays, this includes the normalized-claim, non-author-assignment,
   sentinel-calibration, critique-density, semantic-bias, and private-
   reconstruction gates.
6. The cross-phase summary the orchestrator surfaces to the user
   includes the strongest objection from each review (the user should
   see the adversarial signal in raw form before Phase 4 starts)

If any verification fails: pause + escalate per
[`subagent-orchestration.instructions.md`](../../../../.github/instructions/subagent-orchestration.instructions.md).

## Failure modes to watch

| Failure mode                                                                                  | Detection                                                                                    | Response                                                                                                                                                      |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Member's review is meek (mostly "this is good")                                               | Word-count of "Strongest objections" section is short; subjective scan of objection severity | Re-invoke with the adversarial mandate emphasized; document the recurrence for the mini-retro (some models are more meek by pretraining default; track which) |
| Member's review attacks the wrong target (critiques Phase 1 corpora instead of the synthesis) | Manual scan: are objections about the synthesis, or about specific Phase-1 corpora?          | Re-invoke with the target clarified                                                                                                                           |
| Two members' reviews are nearly-identical                                                     | Manual scan during cross-phase summary                                                       | Document as a finding (low adversarial diversity) but proceed; Phase 4 will decide whether the consensus critique is robust                                   |
| Provenance sibling missing for one member's review                                            | File absence                                                                                 | Pause; emit; if cannot, decide whether to fall back to (N-1) reviews for Phase 4                                                                              |
| Member reads a sibling's already-saved review                                                 | `context_loaded[]` in provenance lists a sibling review path                                 | Pause; do NOT use this member's review for Phase 4; escalate (this is an independence violation that biases Phase 4)                                          |

## Cross-references

- [`SKILL.md`](../SKILL.md) — the orchestrator-level discipline this phase fits into
- [`methodology-primitives.md`](methodology-primitives.md) — hash manifest + generalized fingerprint check primitives this phase's check instantiates
- [`phase-2-clinical-synthesis.md`](phase-2-clinical-synthesis.md) — what produced the synthesis this phase critiques
- [`phase-4-council-deliberation.md`](phase-4-council-deliberation.md) — what consumes the synthesis + the N adversarial reviews
- [`provenance-schema.md`](provenance-schema.md) — sibling-file shape
- [`output-directory-structure.md`](output-directory-structure.md) — where Phase 3 outputs land

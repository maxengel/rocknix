# Output directory structure

All council-research artifacts land under a single dated topic
directory rooted at `research/council-research/`. The layout makes
the 5-phase trail auditable — every claim in the Phase 5 deliverable
can be traced backward through phase outputs to the original source
files.

## Top-level path

```
research/council-research/YYYY-MM-DD-<topic>/
```

- `YYYY-MM-DD` — UTC date of the council-research run start (the
  `mcp_time_get_current_time` result at Setup; do not rely on local
  date)
- `<topic>` — kebab-case short slug for the research topic (≤ 6
  words). Derived from the council-research caller's research
  question; surface the chosen slug to the user at Setup so they can
  override before the directory is created
- If multiple council-research runs happen on the same date for the
  same topic, append a `-r{N}` suffix to the slug:
  `2026-05-20-vocabulary-r2/`. This is **distinct** from the
  in-run recursion suffix the council skill uses during Phase 4
  tie-breaking (`peer_review-r2.md`, etc.).

## Path collision with the council skill

The council skill defines its output path as
`research/trio-runs/YYYY-MM-DD-<topic>/`. council-research's
top-level is `research/council-research/YYYY-MM-DD-<topic>/`. Both
are valid; they coexist. The split exists by design:

- A **standalone council deliberation** (no fresh research; inputs
  already exist) lands under `research/trio-runs/`. The council skill
  was authored for this case and its output conventions assume this
  path.
- A **council-research run** (the 5-phase wrapped pipeline) lands
  under `research/council-research/`. Phase 4 of council-research
  invokes the council skill, but with the output directory
  **transplanted** under `phase-4-deliberation/` of the
  council-research run, not at the council skill's default path.

Why this matters:

1. A reader can tell at a glance whether they're looking at a
   standalone council deliberation or a council-research run (top
   directory name)
2. The council skill's existing path schema is unchanged — it does
   not have to learn a new layout, and standalone council runs (which
   may continue indefinitely for non-research-heavy deliberations)
   keep their natural home at `research/trio-runs/`
3. council-research's `phase-4-deliberation/` simply becomes the
   "current run directory" the council skill operates on for that
   Phase 4 — passed in via the invocation
4. The split paths make it trivial to count, audit, or grep across
   only-council-research runs (without including standalone council
   runs): `find research/council-research/ -name '*.provenance.json'`

The council skill is invoked with an explicit output-directory
override in Phase 4 — see [`phase-4-council-deliberation.md`](phase-4-council-deliberation.md)
`## How council-research wraps the council`.

## Full layout

```
research/council-research/YYYY-MM-DD-<topic>/
├── README.md                              # written at end of Phase 5
├── _probe/                                # Setup reachability probes, if run
│   ├── claude.md
│   ├── claude.md.provenance.json
│   ├── gemini.md
│   ├── gemini.md.provenance.json
│   ├── gpt.md
│   ├── gpt.md.provenance.json
│   ├── kimi.md
│   ├── kimi.md.provenance.json
│   ├── muse.md
│   ├── muse.md.provenance.json
│   └── prompt.txt                         # input prompt only; no provenance sibling
│
├── phase-1-research/                      # Phase 1 — Independent research
│   ├── claude/
│   │   ├── corpus.md
│   │   ├── corpus.provenance.json
│   │   └── (member's optional notes / drafts)
│   ├── gemini/
│   │   ├── corpus.md
│   │   ├── corpus.provenance.json
│   │   └── …
│   ├── gpt/
│   │   ├── corpus.md
│   │   ├── corpus.provenance.json
│   │   └── …
│   ├── kimi/
│   │   ├── corpus.md
│   │   ├── corpus.provenance.json
│   │   └── …
│   └── muse/
│       ├── corpus.md
│       ├── corpus.provenance.json
│       └── …
│
├── phase-2-synthesis/                     # Phase 2 — Clinical synthesis (Researcher Agent)
│   ├── 00-working-notes.md
│   ├── 01-inventory.md
│   ├── 02-clusters.md
│   ├── 03-extractions.md
│   ├── 04-cross-references.md
│   ├── 05-synthesis-notes.md
│   ├── 06-deliverable.md
│   ├── 07-<topic>-synthesis.md            # the document Phase 3 reviews
│   └── 07-<topic>-synthesis.provenance.json
│
├── phase-3-adversarial/                   # Phase 3 — Adversarial peer review
│   ├── claude-adversarial-review.md
│   ├── claude-adversarial-review.provenance.json
│   ├── gemini-adversarial-review.md
│   ├── gemini-adversarial-review.provenance.json
│   ├── gpt-adversarial-review.md
│   ├── gpt-adversarial-review.provenance.json
│   ├── kimi-adversarial-review.md
│   ├── kimi-adversarial-review.provenance.json
│   ├── muse-adversarial-review.md
│   └── muse-adversarial-review.provenance.json
│
├── phase-4-deliberation/                  # Phase 4 — Council skill output (transplanted layout)
│   ├── README.md                          # council skill's per-run README
│   ├── claude-analysis.md                 # Step 1
│   ├── claude-analysis.provenance.json
│   ├── gemini-analysis.md
│   ├── gemini-analysis.provenance.json
│   ├── gpt-analysis.md
│   ├── gpt-analysis.provenance.json
│   ├── kimi-analysis.md
│   ├── kimi-analysis.provenance.json
│   ├── muse-analysis.md
│   ├── muse-analysis.provenance.json
│   ├── peer_reviews/                      # Step 2
│   │   ├── claude_peer_review.md
│   │   ├── gemini_peer_review.md
│   │   ├── gpt_peer_review.md
│   │   ├── kimi_peer_review.md
│   │   └── muse_peer_review.md
│   ├── revised_approaches/                # Step 3
│   │   ├── claude-revised_plan.md
│   │   ├── gemini-revised_plan.md
│   │   ├── gpt-revised_plan.md
│   │   ├── kimi-revised_plan.md
│   │   └── muse-revised_plan.md
│   └── peer_votes/                        # Step 4
│       ├── claude_vote.md
│       ├── gemini_vote.md
│       ├── gpt_vote.md
│       ├── kimi_vote.md
│       └── muse_vote.md
│
└── phase-5-deliverable/                   # Phase 5 — Deliverable
    ├── deliverable.md
    └── deliverable.provenance.json
```

Setup reachability probe outputs are Markdown artifacts when they have
provenance siblings. Do not write `_probe/<member>.txt` or
`_probe/<member>.txt.md`; use `_probe/<member>.md` with
`_probe/<member>.md.provenance.json`. The digest lint derives the
expected artifact path from the provenance filename and requires a
Markdown sibling. Raw prompt/input files that are not output artifacts
may remain `.txt` when they have no `.provenance.json` sibling.

Recursion rounds during Phase 4 add `-r{N}` suffixed files inside
`phase-4-deliberation/` per the council skill's
[`tie-breaking-recursion.md`](../../council/references/tie-breaking-recursion.md).

## Phase replay layout

Phase replays live as version-suffixed siblings of the original phase
directory. They never overwrite the original phase output. A replay is
used when a phase gate fails or a phase-specific repair is needed while
earlier phases remain valid inputs.

Example: R11-100 Phase 3 fingerprint check fails, but Phase 0, Phase 1,
and Phase 2 remain valid. The repair is a targeted Phase 3 methodology
refinement, so the replay version is R11-120 and the layout is:

```text
research/council-research/YYYY-MM-DD-<topic>/
├── phase-3-adversarial/                  # failed R11-100 Phase 3 evidence
│   └── .fingerprint-check.json           # verdict FAIL, phase4_allowed false
└── phase-3-adversarial-r11-120/
    ├── replay-plan.md
    ├── replay-plan.md.provenance.json
    ├── .replay-metadata.json
    ├── .manifest.sha256.json
    ├── claim-cards/
    │   ├── Corpus-A.md
    │   ├── Corpus-A.md.provenance.json
    │   ├── Corpus-B.md
    │   ├── Corpus-B.md.provenance.json
    │   └── ...
    ├── _phase3-adversarial-prompt.md
    ├── _phase3-adversarial-prompt.md.provenance.json
    ├── <member>-adversarial-review.md
    ├── <member>-adversarial-review.provenance.json
    └── .fingerprint-check.json           # replay gate result
```

The replay metadata JSON records lineage and gate status, but it is not a
substitute for Markdown artifact provenance. Every replay Markdown
artifact still follows the normal sibling `.provenance.json` rule. When a
replay directory reaches `phase4_allowed: true`, Phase 4 records that
directory as its Phase 3 input source. Phase 4 must not consume the failed
original directory.

If a targeted Phase 3 replay still fails fingerprint/severity/semantic
independence, the next replay is an `R<N>-200+` semantic replay with a
Phase 2.5 normalized claim deck and per-member shuffled review bundles.
This escalation also applies across a methodological family: if a prior
related council-research run already showed that claim-card projection
preserves semantic self-fingerprint, a later run in the family moves
directly to the `R<N>-200+` layout as its next repair instead of repeating
an `R<N>-120` claim-card replay. The original failed directories remain
in place; the semantic replay gets its own version-suffixed sibling:

```text
research/council-research/YYYY-MM-DD-<topic>/
├── phase-3-adversarial/                  # failed R<N>-100 Phase 3 evidence
├── phase-3-adversarial-r11-120/          # failed targeted claim-card replay
│   └── .fingerprint-check.json           # verdict FAIL, phase4_allowed false
└── phase-3-adversarial-r11-200/
  ├── replay-plan.md
  ├── replay-plan.md.provenance.json
  ├── .replay-metadata.json
  ├── .manifest.sha256.json
  ├── normalized-claims/
  │   ├── synthesis-target.md           # neutral critique target, no corpus handles
  │   ├── synthesis-target.md.provenance.json
  │   ├── claims.json                   # live deck: no member/corpus handles
  │   └── private-claim-map.json        # orchestrator-private until gate
  ├── sentinels/
  │   ├── sentinel-claims.json          # live controls, mixed into bundles
  │   └── private-answer-key.json       # orchestrator-private until gate
  ├── review-bundles/
  │   ├── claude-claim-bundle.json
  │   ├── gemini-claim-bundle.json
  │   ├── gpt-claim-bundle.json
  │   ├── kimi-claim-bundle.json
  │   └── muse-claim-bundle.json
  ├── source-manifests/
  │   ├── claude.source-manifest.json   # Facilitator input manifest for Claude only
  │   ├── gemini.source-manifest.json
  │   ├── gpt.source-manifest.json
  │   ├── kimi.source-manifest.json
  │   └── muse.source-manifest.json
  ├── _phase3-adversarial-prompt.md
  ├── _phase3-adversarial-prompt.md.provenance.json
  ├── <member>-adversarial-review.md
  ├── <member>-adversarial-review.provenance.json
  ├── .source-fact-probe.json
  └── .fingerprint-check.json           # semantic replay gate result
```

`normalized-claims/private-claim-map.json` and
`sentinels/private-answer-key.json` are part of the durable evidence trail
but are never passed in a member source manifest. They become inspectable
only after all member reviews are saved and the orchestrator writes the
post-review gate artifact.

## Canonical phase chain and superseded attempts

The unsuffixed phase directory is canonical only until a replay or corrected
attempt supersedes it. Once a version-suffixed phase sibling records a passing
gate, or an explicitly adjudicated gate with continuation allowed, that sibling
becomes the accepted phase attempt for downstream phases.

Rules:

- Preserve superseded phase directories as evidence. Do not edit a failed or
  drifted attempt into a pass.
- Phase 4 and Phase 5 consume only the accepted canonical attempt for each
  phase. Their source manifests and provenance paths must point at the accepted
  attempt, not at a superseded sibling.
- The top-level run README must include a canonical-chain table naming the
  accepted directory for each phase and a superseded-materials note naming every
  preserved non-canonical phase attempt.
- If a superseded attempt has digest drift, leave the drift visible. Closeout
  reports both the full-root lint posture and the canonical-chain strict posture.
  A clean canonical chain does not imply a clean full root.
- The `.digest-drift-allowlist.json` mechanism is a whole-run historical trust
  posture, not a path-level exception for fresh canonical-chain work. Do not use
  a broad run allowlist to hide findings in a canonical accepted chain.

## Naming rules

| Artifact                               | Filename                                                                                | Phase                     |
| -------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------- |
| Per-member Phase 1 corpus              | `phase-1-research/<member>/corpus.md`                                                   | 1                         |
| Per-member Phase 1 provenance          | `phase-1-research/<member>/corpus.provenance.json`                                      | 1                         |
| Researcher Agent synthesis             | `phase-2-synthesis/07-<topic>-synthesis.md`                                             | 2                         |
| Researcher Agent synthesis provenance  | `phase-2-synthesis/07-<topic>-synthesis.provenance.json`                                | 2                         |
| Per-member Phase 3 review              | `phase-3-adversarial/<member>-adversarial-review.md`                                    | 3                         |
| Per-member Phase 3 review provenance   | `phase-3-adversarial/<member>-adversarial-review.provenance.json`                       | 3                         |
| Versioned phase replay plan            | `phase-<N>-<name>-r<issue>-<version>/replay-plan.md`                                    | replay                    |
| Versioned phase replay metadata        | `phase-<N>-<name>-r<issue>-<version>/.replay-metadata.json`                             | replay                    |
| Phase replay claim-card projection     | `phase-3-adversarial-r<issue>-<version>/claim-cards/Corpus-X.md`                        | Phase 3 replay            |
| Semantic replay synthesis target       | `phase-3-adversarial-r<issue>-<version>/normalized-claims/synthesis-target.md`          | Phase 3 replay            |
| Semantic replay normalized claims      | `phase-3-adversarial-r<issue>-<version>/normalized-claims/claims.json`                  | Phase 3 replay            |
| Semantic replay private claim map      | `phase-3-adversarial-r<issue>-<version>/normalized-claims/private-claim-map.json`       | Phase 3 replay            |
| Semantic replay review bundle          | `phase-3-adversarial-r<issue>-<version>/review-bundles/<member>-claim-bundle.json`      | Phase 3 replay            |
| Semantic replay member source manifest | `phase-3-adversarial-r<issue>-<version>/source-manifests/<member>.source-manifest.json` | Phase 3 replay            |
| Semantic replay sentinel controls      | `phase-3-adversarial-r<issue>-<version>/sentinels/sentinel-claims.json`                 | Phase 3 replay            |
| Per-member Phase 4 analysis            | `phase-4-deliberation/<member>-analysis.md`                                             | 4                         |
| Per-member Phase 4 peer review         | `phase-4-deliberation/peer_reviews/<member>_peer_review.md`                             | 4                         |
| Per-member Phase 4 revised plan        | `phase-4-deliberation/revised_approaches/<member>-revised_plan.md`                      | 4                         |
| Per-member Phase 4 vote                | `phase-4-deliberation/peer_votes/<member>_vote.md`                                      | 4                         |
| Recursion-round Phase 4 artifacts      | append `-r{N}` before `.md` extension                                                   | 4                         |
| User tie-break decision (if hit)       | `phase-4-deliberation/peer_votes/user-decision-r{N}.md`                                 | 4                         |
| Final deliverable                      | `phase-5-deliverable/deliverable.md`                                                    | 5                         |
| Final deliverable provenance           | `phase-5-deliverable/deliverable.provenance.json`                                       | 5                         |
| Top-level run README                   | `README.md` (at run-dir root)                                                           | written at end of Phase 5 |

Member short names: `claude`, `gemini`, `gpt`, `kimi`, `muse` (shadow arms: `grok`, `deepseek`; runs sealed before scaffold#915: `mistral`).
Lowercase; no version suffixes (`claude-4`, `kimi-26`, `mistral-3`) in filenames — version
provenance lives in the `.provenance.json` `model` field.

The hyphen-vs-underscore split inside Phase 4 (`<member>-analysis.md`
with hyphen; `peer_reviews/<member>_peer_review.md` with underscore)
matches the council skill's existing convention exactly. Do NOT
normalize — several downstream tools key off these exact names.

## Top-level README

Written at end of Phase 5 (NOT incrementally during the run, to avoid
partial-state corruption). See [`phase-5-deliverable.md`](phase-5-deliverable.md)
`## The top-level run README` for required contents.

## What goes WHERE — quick reference

| You need to …                                | Go to …                                                                                                                     |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| See each member's independent research       | `phase-1-research/<member>/corpus.md`                                                                                       |
| See the clinical synthesis                   | `phase-2-synthesis/07-<topic>-synthesis.md`                                                                                 |
| See an adversarial critique of the synthesis | `phase-3-adversarial/<member>-adversarial-review.md`                                                                        |
| See the council's deliberation in full       | `phase-4-deliberation/` (full council skill layout)                                                                         |
| See the council's winning plan               | `phase-4-deliberation/revised_approaches/<winner>-revised_plan.md` (or `-r{N}` if recursed)                                 |
| See the final deliverable                    | `phase-5-deliverable/deliverable.md`                                                                                        |
| See the per-claim provenance table           | inside `phase-5-deliverable/deliverable.md`                                                                                 |
| Verify per-artifact attestation              | any `<artifact>.provenance.json` + the consumer-side re-hash command in [`../SKILL.md`](../SKILL.md) `## Source-fact probe` |
| See the run summary at-a-glance              | `README.md` at the run-dir root                                                                                             |

## Pre-existing siblings and reuse

If a council-research run reads sources that are themselves
`.provenance.json`-bearing artifacts (e.g., a prior council-research
run's deliverable consumed as input to a new run), the new run's
`source_file_paths[]` includes the source artifact's path and
`source_file_hashes[]` includes its sha256sum. The new run does NOT
re-emit the source's provenance file or re-verify its source-fact
probe — that's the source artifact's owner's responsibility, already
discharged at the source artifact's creation.

This means provenance is **per-artifact**, not per-content. A claim
that propagates Phase 1 → Phase 2 → Phase 5 carries provenance at
each phase output independently; the Phase 5 reader who wants to
trace a claim back to its original source follows the chain through
the per-claim provenance table to the Phase 4 winning plan, to the
Phase 2 synthesis, to a Phase 1 corpus, to the corpus's
`source_file_paths[]`, to the original source file.

## Cross-references

- [`SKILL.md`](../SKILL.md) — the orchestrator-level discipline that uses this layout
- [`phase-1-independent-research.md`](phase-1-independent-research.md) — Phase 1 outputs
- [`phase-2-clinical-synthesis.md`](phase-2-clinical-synthesis.md) — Phase 2 outputs
- [`phase-3-adversarial-review.md`](phase-3-adversarial-review.md) — Phase 3 outputs
- [`phase-4-council-deliberation.md`](phase-4-council-deliberation.md) — Phase 4 outputs (council skill layout transplanted)
- [`phase-5-deliverable.md`](phase-5-deliverable.md) — Phase 5 outputs + top-level README contents
- [`provenance-schema.md`](provenance-schema.md) — `.provenance.json` shape
- [`../../council/references/output-conventions.md`](../../council/references/output-conventions.md) — the council skill's output conventions (for the Phase-4 transplanted layout)

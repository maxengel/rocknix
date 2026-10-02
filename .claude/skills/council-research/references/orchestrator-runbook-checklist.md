# Orchestrator runbook checklist (per-phase boundary gate)

This checklist exists because a real run (`2026-06-29-review-agent-contracts`,
M78 P0) executed all five phases and only discovered at closeout that
provenance siblings, the source-fact probe, and gate artifacts were missing —
then had to backfill them. Every item below is already described elsewhere in
this skill; this file consolidates them into a **gate the orchestrator runs
after each phase**, so a gap surfaces in minutes (one phase of rework) instead
of at the end (whole-run backfill). The mechanical lints
(`lint-council-research-provenance`, `-digests`, `-gates`, `summarize-…`)
already enforce these at commit time — the discipline is to run them
**per phase**, not just once at the end.

## Pre-flight (before Phase 1)

- [ ] Distinguish the acquired archive from required phase/step requests;
      apply [Archive and request scope](../../council/references/context-loading.md#archive-and-request-scope)
      when selecting sources and assessing capacity or invocation failures.
- [ ] Verify and lock all five members; a failed seat halts for diagnosis, never a smaller roster.
- [ ] Generate the `council_research_run_id`; create the run dir + `.run-id`.
- [ ] **Decide Phase 0:** any Phase 1 source under `research/**` or
      `docs/research/**`, or a prior run named as input → Phase 0 REQUIRED.
- [ ] **External-source pre-fetch (the most-skipped step):** members are
      stateless and cannot web-fetch. For any bedrock-adjacent topic, the
      orchestrator pre-fetches the required external primary sources, persists
      them under `phase-1-research/_fetched-sources/` with `accessed_utc` +
      `content_sha256`, and stages them into the Phase 1 source manifest so the
      Facilitator embeds them. Skipping this is why corpora come back with 0
      external citations and the anti-echo floor (≥3) silently fails.

## Per-phase closeout gate (run after EVERY phase, before advancing)

For the phase you just produced:

1. [ ] **Write the artifact(s)** to disk.
2. [ ] **Write the `.provenance.json` sibling immediately** — at write time,
       not at run closeout. Capture `source_file_paths[]` + `source_file_hashes[]`
       for every source actually read. Facilitator-delegated steps emit this
       automatically; **orchestrator/Researcher-authored** artifacts
       (Phase 2 synthesis + pass artifacts, Phase 5 deliverable, every
       `_*-prompt.md` / `KICKOFF-PROMPT.md`) do NOT — you must write them.
   - Prompt files → add `"derivation_kind": "orchestrator-prompt"`.
   - Researcher intermediate pass artifacts → `"orchestrator-scaffolding"`.
   - Do NOT assert `manifest_verification: PASS` unless you actually
     verified a `.manifest.sha256.json`; omit the field rather than lie.
3. [ ] **Run the boundary lints scoped to the phase dir:**
       `npx tsx scripts/lint-council-research-provenance.ts --strict <phase-dir>`
       and `… lint-council-research-digests.ts --strict <phase-dir>`. Both must
       be 0-finding before advancing.
4. [ ] **Source-fact probe** for any content artifact (Phase 2 synthesis,
       Phase 3 reviews, Phase 4 deliberation output, Phase 5 deliverable):
       sample 5 claims (<500 lines) or 10 (≥500), verify each against the
       cited source, and write `.source-fact-probe.json`. Then
       `… lint-council-research-gates.ts --strict <phase-dir>`.
5. [ ] **Gate-artifact discipline:** write each gate JSON exactly once through
       one mechanism; parse it; never batch gate writes in a parallel group.
6. [ ] **Sequestration (Phase 3/4):** at minimum anonymize review handles
       (`Review-A…N`, re-randomized). For `R<N>-200+` replays after an
       independence failure, run Phase 2.5 normalization. Baseline
       anonymization is the floor, not the ceiling.

## Run closeout (after Phase 5)

- [ ] `npx tsx scripts/summarize-council-research-lints.ts --strict <run-dir>/`
      → `Total findings: 0` (or only allowlisted). Report the posture honestly;
      if only the canonical chain is clean, say so and name preserved
      superseded findings separately.
- [ ] Write the run `README.md`.
- [ ] Post the deliverable to the tracker issue; feed downstream issues.

## The one-line rule

**Never advance to phase N+1 until phase N is provenance-clean, probe-passed,
and lint-green.** If you find yourself backfilling provenance at the end, you
skipped this gate — the cost is whole-run rework instead of one-phase rework.

## Origin

Codified 2026-06-29 from the `2026-06-29-review-agent-contracts` run
(M78 P0, issue #3496), where the design outcome was sound but provenance
siblings (12), the source-fact probe (phases 2 & 5), and gate artifacts were
all backfilled at closeout, and the Phase-1 external-citation floor was unmet
because external sources were not pre-fetched for the stateless members.

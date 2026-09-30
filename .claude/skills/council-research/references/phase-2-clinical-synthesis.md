# Phase 2 — Clinical synthesis

**Purpose:** Cross-reference the N parallel corpora Phase 1 produced
into a single structured synthesis. Surface where the corpora agree,
where they disagree, what each cites, and what gaps exist across all
of them. The synthesis is the dataset Phase 3 (adversarial review)
will operate on.

**Who executes:** The `Researcher Agent` subagent (single invocation
per Phase 2), invoked by the council-research orchestrator.

## Hard invariant — no adversarial framing

**The Researcher Agent's Phase 2 synthesis MUST NOT include adversarial
framing.** No "this claim is weak", no "claude is wrong about X", no
"the better answer is Y", no rebuttals, no rankings of corpus quality.

Clinical synthesis is **neutral, factual, source-structured**: it maps
what each corpus says, where corpora converge, where they diverge, and
what each cites — without taking a position on which is right.

**Why this matters:** Phase 3 (adversarial review) needs to critique
the synthesis from the standpoint of someone seeing it neutral. If the
synthesis is already prejudicial, the adversarial review either becomes
meta-critique (less useful) or doubles down on the existing prejudice
(actively harmful). The structural separation between neutral synthesis
(Phase 2) and adversarial work (Phase 3 + Phase 4) is the load-bearing
discipline of the entire council-research methodology.

This invariant is stated in three places: in the council-research
[`SKILL.md`](../SKILL.md) `## Hard invariant` section, here in the first
30 lines of the Phase 2 reference, and in the Tier-3 enforcement file
`council-research.instructions.md` (E5 deliverable).
Triple statement is intentional per the precedent in
`silent-failure-discipline` (estate-local; scaffold: incident-response + development-principles fail-loud rules):
critical invariants are stated wherever they could be missed; never in
a single place.

---

## Pre-flight — lint prior-phase outputs before consuming them

Before composing the Researcher Agent's prompt for Phase 2, the
orchestrator MUST run the cross-corpus provenance lint over all of
Phase 1's `phase-1-research/<member>/` directories:

```bash
npx tsx scripts/lint-council-research-provenance.ts --strict \
  research/council-research/<run-dir>/phase-1-research/
```

The lint enforces (a) facilitator-attested provenance on every corpus
and (b) the cross-corpus `cross-corpus-model-collision` check that
fails when two or more Phase 1 members were silently routed to the
same underlying model — the R8 substrate-collapse failure mode
(issue #3059). A FAIL here means Phase 1's corpora are NOT independent
and Phase 2 MUST NOT proceed; pause and re-run the offending
member(s) through the Facilitator. See
[`council-substrate-integrity.instructions.md`](../../../../.github/instructions/council-substrate-integrity.instructions.md).

---

## Inputs the orchestrator provides

When invoking the Researcher Agent for Phase 2, the orchestrator's
prompt MUST include:

1. **Research question** — verbatim from the council-research caller
2. **Scope** — the N `phase-1-research/<member>/corpus.md` files (the N
   corpora the Researcher Agent will cross-reference) and the original
   in-repo source pointers from Phase 1
3. **Mode** — `Synthesis` (the Researcher Agent's default mode); never
   `Applied Research`, `Landscape Analysis`, or `Gap Analysis` for
   Phase 2 (those modes are appropriate for different research goals
   but corrupt the neutrality this phase needs)
4. **Output location** — `phase-2-synthesis/`
5. **The hard invariant** — restated verbatim in the invocation prompt:

   > **HARD INVARIANT — NO ADVERSARIAL FRAMING.** Your Phase 2 synthesis
   > must be neutral, factual, source-structured. Do NOT take a position
   > on which corpus is correct. Do NOT include "this claim is weak",
   > "X is wrong about Y", "the better answer is Z", rebuttals, or
   > rankings of corpus quality. Map what each corpus says, where they
   > converge, where they diverge, what each cites — without judgement.
   > Adversarial work belongs in Phase 3 and Phase 4, NOT here. If
   > you find yourself wanting to argue, stop and re-frame as observation.

6. **Provenance instruction** — the per-artifact attestation prompt:

   > Per the council-research skill, when you complete Pass 6 (Output)
   > and save your deliverable at
   > `phase-2-synthesis/07-<topic>-synthesis.md`, ALSO write a sibling
   > `07-<topic>-synthesis.provenance.json` to the same directory
   > following the schema at
   > `.claude/skills/council-research/references/provenance-schema.md`.
   > Populate `source_file_paths[]` from your Pass 1 inventory,
   > `source_file_hashes[]` by running `sha256sum` on each path AT READ
   > TIME (not at end-of-phase, so the attestation cannot be backfilled),
   > and the runtime-identity fields from your session context. The
   > council-research orchestrator will verify these post-hoc.

7. **The `council_research_run_id` UUID** — for provenance cross-linking
8. **Output mode = Synthesis** — explicitly named so the Researcher
   Agent does not default to a different mode if the prompt is
   ambiguous to it

## What the Researcher Agent does

The Researcher Agent's existing 6-pass methodology applies in full
(see [`.claude/agents/researcher.agent.md`](../../../agents/researcher.agent.md)
§ "Multi-Pass Iterative Process"):

| Pass                       | What                                                                                          | Output file in `phase-2-synthesis/`                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1 — Inventory              | Catalog all source files (the N corpora + original source pointers)                           | `01-inventory.md`                                                                        |
| 2 — Clustering             | Group sources by theme                                                                        | `02-clusters.md`                                                                         |
| 3 — Deep Read              | Extract key claims, evidence, and citations from each                                         | `03-extractions.md`                                                                      |
| 4 — N-to-N Cross-Reference | Compare every corpus against every other; surface agreements, tensions, complementarity, gaps | `04-cross-references.md`                                                                 |
| 5 — Synthesis              | Distill into coherent themes; rank by evidence strength                                       | `05-synthesis-notes.md`                                                                  |
| 6 — Output                 | Produce the final structured synthesis                                                        | `06-deliverable.md` + `07-<topic>-synthesis.md` + `07-<topic>-synthesis.provenance.json` |

Plus the Researcher Agent's `00-working-notes.md` (running progress).

**Pass 4 is the heart of Phase 2** — the N-to-N cross-reference is what
distinguishes clinical synthesis from "summarization-of-summaries". The
Researcher Agent's existing methodology requires comparing every
document pair, recording agreements / tensions / complementarity / gaps
with citations. This is the same discipline Phase 2 needs.

## Outputs

```
phase-2-synthesis/
├── 00-working-notes.md
├── 01-inventory.md
├── 02-clusters.md
├── 03-extractions.md
├── 04-cross-references.md
├── 05-synthesis-notes.md
├── 06-deliverable.md
├── 07-<topic>-synthesis.md          # the synthesis document Phase 3 reviews
└── 07-<topic>-synthesis.provenance.json
```

The `07-<topic>-synthesis.md` is the document Phase 3 operates on. It
should contain:

- **Executive summary** (3–5 paragraphs) — neutral, no rebuttal
- **Key findings** organized by theme, with citations back to corpora
  and original sources
- **Cross-cutting patterns** that span themes (meta-patterns only
  surfaced by N-to-N comparison)
- **Evidence matrix** — finding × supporting sources × evidence-strength
  tier (Strong / Moderate / Emerging / Speculative)
- **Open questions & gaps** — areas the corpus does not resolve, contradictions that remain unresolved (state neutrally as "claude and gpt diverge on X" — do NOT say "claude is wrong")
- **Source index** — every document the synthesis cited

## Verification before advancing to Phase 3

The orchestrator MUST verify before moving to Phase 3:

1. The `07-<topic>-synthesis.md` exists on disk
2. The sibling `07-<topic>-synthesis.provenance.json` exists
3. The sibling has the expected schema fields populated (see [`provenance-schema.md`](provenance-schema.md))
4. The source-fact probe (4 steps in SKILL.md `## Source-fact probe`) passes
5. Manual scan of the synthesis for prohibited adversarial framing —
   grep for tells like "wrong", "weak", "better answer", "the strongest
   plan", "incorrect" used in evaluative (not quoted) contexts
6. **Kickoff-conformance check (NEW).** Compare the synthesis's framing,
   strongest-claim list, and recommended-direction language against the
   council-research caller's original kickoff document (the topic
   statement, in-scope / out-of-scope notes, working hypotheses, and
   open questions the orchestrator received at Setup). A synthesis that
   reaches conclusions the kickoff explicitly placed out-of-scope, or
   that silently re-scopes "this is one option among N" into "this is
   the recommendation", is a structural defect even if every individual
   claim source-verifies. The kickoff is the contract Phase 2 is
   answering; conformance to that contract is part of the gate. If
   conformance fails, treat as a Phase 2 failure (re-invoke Researcher
   Agent with the kickoff re-emphasized; do NOT advance to Phase 3
   with a re-scoped synthesis).
7. **Verdict-conflict rule (NEW).** If the gate produces conflicting
   verdicts across checks (e.g. source-fact probe PASS but
   kickoff-conformance FAIL; or synthesis-language scan PASS but
   evidence-tier inflation visible on inspection), the **lower verdict
   wins** and the orchestrator MUST surface the conflict to the user
   before proceeding. Do not average, do not let the higher verdict
   overwrite the lower. The point of the multi-check gate is to catch
   what any single check misses; conflict between checks is the gate
   working as designed, not a paradox to resolve quietly.

If verification fails: pause + escalate per
[`subagent-orchestration.instructions.md`](../../../../.github/instructions/subagent-orchestration.instructions.md).
Do NOT silently re-invoke the Researcher Agent or silently delete the
output; both would obscure the failure for future audit.

## Source-file hash recomputation advisory

The Researcher Agent emits `source_file_hashes[]` in the synthesis's
`.provenance.json` at read time. If Phase 1 corpora are touched between
Phase 2 emission and Phase 3 invocation (e.g. by a synthesis correction
pass, a typo fix, or any other edit), those hashes will mismatch on
re-probe. Two acceptable handling patterns:

1. **Treat the mismatch as the gate signal it is.** If a corpus was
   modified post-synthesis, the synthesis is now out-of-date with
   respect to that corpus — the correct response is to re-invoke the
   Researcher Agent for a v2 synthesis against the updated corpus, NOT
   to recompute the hashes to make the mismatch disappear.
2. **Append a `hash_advisory` block to the `.provenance.json`** that
   records the post-edit recomputation alongside (NOT replacing) the
   original at-read-time hashes, with an explanation of why the corpus
   was edited and confirmation that the synthesis's claims still hold
   against the updated corpus. The recomputation MUST be done by the
   orchestrator (the verifier), NOT by the emitting agent, and MUST
   include the edit's commit SHA (or, if uncommitted, a diff snippet).

Silent hash overwrite is banned. The original at-read-time digest is
the attestation; if it changes, the change must be recorded.

## Failure modes to watch

| Failure mode                                                                                           | Detection                                                                             | Response                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Synthesis takes a position                                                                             | Grep for evaluative language outside quotes; manual scan of `07-<topic>-synthesis.md` | Pause; re-invoke Researcher Agent with the invariant emphasized; document the recurrence for the mini-retro                                                                                                                                                            |
| Source-file digests don't match                                                                        | `sha256sum` mismatch via the consumer-side re-hash command                            | Investigate: did the source change between read and verify? Did the agent fabricate? Did the agent read a different version? Escalate per [`subagent-orchestration.instructions.md`](../../../../.github/instructions/subagent-orchestration.instructions.md) |
| `.provenance.json` missing                                                                             | File absence at end-of-Phase-2                                                        | Pause; instruct Researcher Agent to emit it; if cannot, treat as Phase 2 failure and decide whether to redo Phase 2 or abandon the council-research run                                                                                                                |
| Source-fact probe surfaces a claim that doesn't verify                                                 | Per the SKILL.md probe procedure                                                      | FAIL the probe; pause + escalate; do NOT silently re-run                                                                                                                                                                                                               |
| Researcher Agent's mode silently shifted (e.g., produced Applied Research output instead of Synthesis) | Output shape doesn't match the Synthesis mode structure                               | Re-invoke with explicit mode statement; if persists across re-invocations, file a follow-up to extend `researcher.agent.md`'s mode-handling                                                                                                                            |

## Methodology primitives applied

Both primitives in [`methodology-primitives.md`](methodology-primitives.md) apply here:

- **Orchestrator-computed input hash manifest (adj-5).** Before invoking the Researcher Agent, write `phase-2-synthesis/.manifest.sha256.json` covering the N Phase-1 corpora. The Researcher Agent's prompt MUST instruct it to verify the manifest hashes before reading any corpus, and to record `sources[].sha256_verified_against_manifest` in the synthesis provenance file.
- **Fingerprint independence check (adj-6) — Researcher Agent phrasing-bias variant.** After the synthesis is saved but BEFORE Phase 3 begins, compute a phrase-overlap metric between the synthesis prose and each member's corpus prose (shared N-gram count normalized by corpus length, N=8 recommended starting point — tune per run). Pass iff no single member's phrase-overlap exceeds the mean by more than a tunable factor (default 1.5×). Save findings to `phase-2-synthesis/.fingerprint-check.json`. A failure here means the Researcher Agent's clinical-synthesis mandate (P10 / DC-3 attached attribution) was contaminated by phrasing prior — pause + re-invoke with the synthesis-mode invariant restated, or escalate.

## Cross-references

- [`SKILL.md`](../SKILL.md) — the orchestrator-level discipline this phase fits into
- [`methodology-primitives.md`](methodology-primitives.md) — hash manifest + fingerprint check primitives
- [`phase-1-independent-research.md`](phase-1-independent-research.md) — what produced the N corpora this phase synthesizes
- [`phase-3-adversarial-review.md`](phase-3-adversarial-review.md) — what consumes this phase's output
- [`provenance-schema.md`](provenance-schema.md) — sibling-file shape
- [`output-directory-structure.md`](output-directory-structure.md) — where Phase 2 outputs land
- [`.claude/agents/researcher.agent.md`](../../../agents/researcher.agent.md) — the Researcher Agent's full methodology

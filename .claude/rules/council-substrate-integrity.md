---
description: Hard, mechanically-enforced rules for any council or council-research invocation. Every council member call MUST go through the Council Facilitator (`tools/council/council-invoke.ts`). `runSubagent`, ad-hoc `curl`/`fetch`, MCP provider tools, and bespoke scripts are FORBIDDEN as council member invocation paths. Auto-loads on every council / council-research artifact so the rule is in the orchestrator's context at the relevant moment, not buried inside a skill reference doc the orchestrator may not open.
paths:
  - "research/council-research/**"
  - "research/council-runs/**"
  - ".claude/skills/council-research/**"
  - ".claude/skills/council/**"
  - ".claude/agents/council-member-*.agent.md"
  - "tools/council/council-invoke.ts"
  - "tools/council/lib/council-verification.ts"
---

<!--
PROVENANCE (#260 — adopted, not authored):
  source: PossibilityTruthy/possibility-space .claude/rules/council-substrate-integrity.md
  adopted: 2026-08-02 · transform: de-generated (pspace generates it from agent-instructions/;
  scaffold authors it directly), agent paths .github/agents/ -> .claude/agents/ (the corpus
  agents category). No auto-sync: refresh = deliberate re-review.
-->

# Council Substrate Integrity

> **The Council depends on input diversity. Input diversity requires that
> each member runs on its declared model. The Facilitator is the only
> mechanism that verifies that. Bypassing the Facilitator silently
> collapses the council to a single substrate and destroys its value.**

This rule was promoted from `.claude/skills/council/SKILL.md` § "Hard
rules" to a top-level auto-loading instruction file so the rule is in
the orchestrator's context whenever it touches a council or
council-research artifact — not buried inside a skill reference doc
the orchestrator may not have opened on the turn that matters.

> **Adoption scope (scaffold, 2026-08-02 — #260):** rules 1–3 (Facilitator-only
> invocation, forbidden paths, HALT on exit 3) bind EVERYWHERE the council skills
> are seeded, unconditionally. Rules 4, 5, and 7 reference the pinned-verifier
> lint stack (`lint-council-research-*.ts`, `verifier-pins.json`) which pspace
> carries and scaffolded estates do not yet — where that tooling is absent, the
> orchestrator performs the same checks manually (verify each provenance record's
> `facilitator_version` + served-model identity before advancing) and the lint
> stack's adoption is tracked as follow-up work. Rule 6 (substrate edits are
> orchestrator-only) binds everywhere as written.

## Hard rules (mechanical)

1. **Every council member invocation MUST go through
   [`tools/council/council-invoke.ts`](../../tools/council/council-invoke.ts).**
   This applies to **all phases of all skills** that invoke a member:
   - `council` skill Steps 1–4 + tie-break recursion rounds
   - `council-research` skill Phase 1 (independent research) and
     Phase 4 (deliberation)
   - Any future skill that consumes a `council-member-*` agent

2. **The following invocation paths are FORBIDDEN for council members:**
   - `runSubagent` against `council-member-*` agent files
   - Direct provider HTTPS calls via `curl`, `fetch`, or `wget`
   - MCP provider tools (Anthropic / OpenAI / Google / Azure AI / etc.)
   - Hand-rolled JSON artifacts that do not pass through the Facilitator
   - Any orchestrator-side fan-out that bypasses the per-call
     model-verification gate

3. **HALT on Facilitator exit 3** (`model_mismatch_no_retry`).
   The Facilitator's per-call brake fires when the observed substrate
   does not match the declared pin. Do NOT auto-retry. Do NOT proceed
   to the next member. Surface to the user, re-evaluate routing.

4. **Run the post-hoc lint between members.**
   After every successful Facilitator invocation, run:

   ```bash
   npx tsx scripts/lint-council-research-provenance.ts --strict \
     research/council-research/<run-dir>/phase-1-research/<member>/
   ```

   This is the orchestrator's mechanical defense against
   `facilitator_version` absence and (per Brake #2 below)
   cross-corpus model-identity collisions. **Do not advance to the
   next member if this lint fails.**

5. **Phase boundary gate.** Before starting Phase 2 (or any
   downstream phase) the orchestrator MUST run
   `scripts/lint-council-research-provenance.ts --strict` and
   `scripts/lint-council-research-digests.ts --strict` against the
   full prior-phase directory. A failing lint blocks the phase
   transition — no exceptions, no "fix later" path.

6. **Substrate edits are orchestrator-only, never subagent-side.**
   The pinned verifier scripts, [`verifier-pins.json`](../../verifier-pins.json),
   and the council / council-research skill reference docs are
   substrate. A subagent (`runSubagent`, Researcher Agent, execution
   subagent, council member) MUST NEVER write to them. Substrate
   changes are made by the orchestrator directly, reviewed in their
   own diff, and committed promptly in their own small commit —
   never folded silently into an unrelated working tree.

7. **Every pin sha change documents itself.** When a pinned file's
   bytes change, the [`verifier-pins.json`](../../verifier-pins.json)
   entry MUST move to the structured form `{ sha, repin_reason,
repinned_at }` with a non-empty reason and a fresh timestamp in the
   SAME diff. A bare re-hash with no rationale is a
   `verifier_pin_unaccountable_repin` failure. Never restore an
   in-scope substrate file to an older commit's content via a stale
   stash — that is the `stale_blob_regression` signature; if a revert
   is genuinely intended, record it in `.stale-blob-allowlist`.

## Why this rule exists

The R8 vocabulary-research council-research run (2026-05-27,
issue #3059) is the canonical substrate-collapse incident:

- The orchestrator invoked all 5 council members via `runSubagent`
  instead of `tools/council/council-invoke.ts`.
- All 5 produced corpora that attributed themselves to the
  orchestrator's own model (`claude-opus-4.7`).
- The artifact-shape was structurally correct (`.provenance.json`
  siblings present, source digests valid, no missing fields), so the
  existing lints (provenance, digests) passed.
- The cross-corpus signature — "all five members ran on the same
  substrate" — was not detected by any mechanical check at the time.

Phase 1 produced 5 corpora that were not 5 independent perspectives.
The whole council-research premise (input diversity) collapsed. The
substrate-collapse was only noticed by a human reviewing the corpora,
not by any automated gate.

## Mechanical defenses (all in place as of issue #3059)

| Defense                                        | Layer                      | What it catches                                                                                                |
| ---------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Facilitator exit 3                             | per-call, runtime          | Observed model ≠ pinned model on a single member call                                                          |
| `facilitator-attestation-missing` lint finding | post-hoc, pre-commit       | Phase 1 member provenance missing `facilitator_version` (i.e., invocation bypassed the Facilitator)            |
| `cross-corpus-model-collision` lint finding    | post-hoc, pre-commit       | Two or more Phase 1 member corpora attest to the same `model_id`                                               |
| `lint-no-direct-council-member-invocation`     | static, pre-commit         | Skill / instruction / agent files contain banned `runSubagent` or `curl` patterns targeting `council-member-*` |
| `verifier_pin_unaccountable_repin` finding     | accountability, pre-commit | A pinned file's sha changed vs HEAD without a `repin_reason` + fresh `repinned_at` — i.e. a silent re-pin      |
| `stale_blob_regression` finding                | accountability, pre-commit | An in-scope substrate / skill file reverted to an OLDER-commit's blob (the stale-stash signature)              |
| Phase reference docs invoke lint as Step 1     | orchestrator discipline    | Forces the orchestrator to run the post-hoc lint between members                                               |
| This instruction file                          | auto-load                  | Puts the Hard Rules in the orchestrator's context at the moment they apply                                     |

## Evidence immutability — auto-formatter exclusion

Council-research evidence under `research/council-research/**` is
**byte-immutable** once generated: every non-Phase-1 output `.md`/`.py`
has a sibling `.provenance.json` whose `output_file_sha256` pins the
exact bytes. Any tool that rewrites a single byte (a trailing-whitespace
stripper, an end-of-file newline fixer, `black`, a line-ending
normaliser, `prettier`) invalidates the digest and corrupts the
provenance chain.

There is **one** enforcement surface for both pre-commit and CI: CI
(`.github/workflows/ci.yml`) runs `pre-commit/action`, i.e. it executes
the very same hooks. So excluding the evidence tree in the hook config
covers both venues at once.

| Mutator                                                                            | Where excluded                                                                                  |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `trailing-whitespace`, `end-of-file-fixer`, `mixed-line-ending`, `black`, `flake8` | `.pre-commit-config.yaml` — each hook's `exclude:` regex carries `research/council-research/.*` |
| `prettier`                                                                         | `.prettierignore` — `research/council-research/` entry                                          |

**Backstop (loud-failure invariant):** the council-research **digest
lint** runs in pre-commit _and_ CI. If a future hook ever mutates an
evidence byte without an exclusion, the digest no longer matches the
sibling `output_file_sha256` and the commit/CI **fails loudly** — it
cannot silently corrupt provenance. The exclusions above are the
prevention layer; the digest lint is the detection layer. When adding
**any** new mutating hook, add `research/council-research/.*` to its
`exclude:` block in the same change — verified by the digest lint on the
next council-research commit.

## Self-check before any council member invocation

- [ ] Am I about to call `runSubagent` with `agentName` starting with
      `council-member-`? **STOP.** Use `tools/council/council-invoke.ts`.
- [ ] Am I about to `curl`, `fetch`, or call an MCP tool against an
      LLM provider for council deliberation? **STOP.** Use
      `tools/council/council-invoke.ts`.
- [ ] Have I read the relevant phase reference doc and the council
      skill's § Hard rules section on this turn? If no, read them now.
- [ ] After this invocation completes, will I run the provenance +
      digest lints before invoking the next member? If no, plan to.

## Cross-references

- [`.claude/skills/council/SKILL.md`](../../.claude/skills/council/SKILL.md)
  § Hard rules — the original, canonical statement of these rules
- [`.claude/skills/council-research/references/phase-1-independent-research.md`](../../.claude/skills/council-research/references/phase-1-independent-research.md)
  § Invocation discipline — the Phase 1 -specific application
- [`tools/council/council-invoke.ts`](../../tools/council/council-invoke.ts)
  — the Facilitator implementation
- [`scripts/lint-council-research-provenance.ts`](../../scripts/lint-council-research-provenance.ts)
  — the post-hoc provenance + cross-corpus identity lint
- [`scripts/lint-no-direct-council-member-invocation.ts`](../../scripts/lint-no-direct-council-member-invocation.ts)
  — the static lint on skill / instruction / agent files
- [`subagent-output-verification.instructions.md`](subagent-output-verification.instructions.md)
  — the sibling rule on never trusting subagent-summarized content
  for dispositional decisions; substrate collapse is a structural
  form of the same trust failure
- [`found-failure-discipline.instructions.md`](found-failure-discipline.instructions.md)
  — every observed failure must be fixed, tracked, or documented;
  this file is the durable Outcome-B record for the R8 incident's
  brake-system gap

## Durable failure record — 2026-05-30 working-tree drift

A second substrate-integrity gap surfaced while finishing the R8 work.
The working tree had accumulated two classes of silent change to the
council substrate that no gate caught:

1. **Silent re-pin (Gap 1).** `tools/council/council-invoke.ts` was
   legitimately upgraded (Opus 4.7 → 4.8) and `verifier-pins.json` was
   re-hashed to match — but the byte-integrity check (`verify-pins.ts`)
   passes whenever the manifest and the file agree, so a writer who
   edits a pinned script AND updates its pin in the same motion leaves
   no review-visible trace of WHY the pin moved. Hash-pinning protects
   against tampering only if the writer cannot also move the manifest;
   in a same-repo manifest, they always can.

2. **Stale-blob regression (Gap 2).** Two substrate files
   (`.claude/skills/council-research/SKILL.md` reverted 1.4.0 → 1.2.0,
   and `scripts/lint-council-research-digests.ts` losing 42 lines) had
   been silently reverted to the _valid_ content of an OLDER commit —
   the signature of a stale stash applied over newer work. Because the
   reverted content was itself well-formed, content lints and the
   verifier pins (the reverted blob is a legitimate past value) were
   all blind to it. The regression was only visible relative to HEAD,
   which nothing checked at commit time.

The three walls added in response:

- **Wall #1 (Gap 1):** `verifier-pins.json` moves to schema
  `council-verifier-pins@2.0.0` (structured pins) and
  `verify-pins.ts` gains `verifyPinAccountability()` — every sha change
  vs HEAD must carry a non-empty `repin_reason` and a fresh
  `repinned_at`, or fail `verifier_pin_unaccountable_repin`.
- **Wall #2 (Gap 2):** `scripts/check-stale-blob-drift.ts` flags any
  in-scope substrate / skill file whose working-tree blob matches a
  non-HEAD ancestor commit, and blocks with a `.stale-blob-allowlist`
  override for intentional reverts.
- **Wall #3:** Hard rules 6 and 7 above, this record, and the two new
  rows in the mechanical-defenses table.

## Origin

Codified 2026-05-28 in response to issue #3059. R8 council-research
substrate collapsed silently because the orchestrator-level brake
surface had a gap: no mechanical check prevented `runSubagent`
bypass of the Facilitator. This file plus the three companion lints
close that gap. Extended 2026-05-31 with the three-wall response to
the working-tree-drift incident documented above.

# Pipeline — the 6-step council process

The council pipeline is **member-count-parameterized**: every step that
says "each member" iterates over the active roster determined in Setup
per [`member-roster.md`](member-roster.md). The roster is fixed for the
duration of a single council run — you do not re-detect mid-run.

## Setup (before Step 1)

When the user provides a problem context:

1. **Determine the output directory** per
   [`output-conventions.md`](output-conventions.md):
   `research/council-runs/YYYY-MM-DD-{topic}/`
2. **Determine the active roster** per
   [`member-roster.md`](member-roster.md). Surface the chosen roster
   (3 or 4 members) to the user before proceeding.
3. **Create the directory layout** (initial analyses at the top level;
   subdirectories for `peer_reviews/`, `revised_approaches/`,
   `peer_votes/`) and write `council-run-manifest.json` per
   [`output-conventions.md`](output-conventions.md) § "Run manifest".
4. **Anchor the run genesis** before invoking any member:

   ```bash
   npx tsx scripts/council-run-start.ts --run-dir {output_dir}
   ```

   This writes `verification/genesis.json`, creates
   `verification-anchors/<run_id>`, commits the genesis file on that
   branch, and pushes it to the configured remote. It also verifies
   `verifier-pins.json` before any mutation. If the command fails, halt
   setup; do not start an unanchored non-legacy run or a run with drifting
   verifier bytes.

5. **Set up the todo list** with one todo per (step, member) pair plus
   the cross-step synthesis checkpoints.

## Mandatory context loading

**Before Step 1 begins**, every member subagent invocation MUST include
the full `read_file` list from
[`context-loading.md`](context-loading.md) in its prompt. This
guarantees each member analyzes the complete, uncompacted source
material — not a summary. **Exclusions:** members must NOT read files
under `research/archive/` (superseded), `research/council-runs/`
(current council outputs), or `research/trio-runs/` (legacy council
outputs); reading prior council outputs biases the current deliberation.

## Anti-self-citation constraint

Per-member prompts critique **proposals**, not observations of the run
that produced those proposals. Do NOT cite the analyses, peer reviews,
or revised plans as empirical evidence about the technique itself. The
deliberation's value comes from independent reasoning about the
technique on its merits; using the run's own artifacts as evidence for
the technique's claims is circular.

Empirical observations of the run — timing data, gate outcomes, member
failures, self-identification mistakes, in-band process patterns — go
in orchestrator-authored artifacts (`model-verification-log.md`,
`run-summary.md`, `step5-meta-retrospective.md`). They do not go in
Step 2, Step 3, Step 4, or Step 4.5 member prompts.

Source case: the 2026-05-22
[`step5-meta-retrospective.md`](../../../../research/council-runs/2026-05-22-model-identity-verification-technique/step5-meta-retrospective.md)
documents the self-citation pattern that this rule prevents.

## Mandatory model-verification gate

**At every break between steps** (after Step 1, Step 2, Step 3, Step 4,
and after each tie-break recursion round), the **Council Orchestrator**
MUST run the model-verification gate per
[`model-verification.md`](model-verification.md) before advancing. The
gate compares each member's observed-model against its declared-model:

- **Direct-API (default)** — read each member's per-invocation
  `*.provenance.json` sibling (written by the **Council Facilitator**,
  `tools/council/council-invoke.ts`). The `final.verification.result` field
  is the per-member gate outcome; `final.outcome` distinguishes
  retry-exhaustion classes from model-mismatch FAIL.
- **Copilot-subagent (legacy fallback)** — read Cache Explorer / OTLP
  logs when the orchestrator runs at a cost tier that permits
  premium-model invocation via `runSubagent`.

Record every gate outcome in `model-verification-log.md` (schema in
[`output-conventions.md`](output-conventions.md)). The gate returns
PASS / FAIL / UNVERIFIABLE.

- **PASS** → advance to the next step.
- **FAIL** → halt the run, surface the mismatch, recover per
  `model-verification.md` § Failure recovery (re-run, degrade roster,
  or abort — NEVER silently substitute another model into a missing
  seat).
- **UNVERIFIABLE** → default to halting and asking the user to enable
  the file-logging settings + restart the session.

The gate is **the gate that decides whether the prior step can be
trusted as input to the next step**. Skipping it lets corruption
propagate silently through the pipeline.

## Step 1 — Initial analysis

Invoke each active member via the **Council Facilitator**. Every seat is
a different provider, so the whole roster can run in parallel (the ledger
is lock-protected); run smaller batches only if you want to watch each
seat land. Each member reads identical input regardless of ordering. For
each member:

1. Compose the Step 1 prompt (a shared prompt that lists the required
   source-document `read_file` instructions per
   [`context-loading.md`](context-loading.md) plus the step-specific
   ask: produce a thorough analysis, no code changes).
2. Write the prompt to `{output_dir}/_prompts/step1-{member}.md` (or
   reference a shared `step1-shared.md` if the prompt is identical
   across members).
3. Invoke the Council Facilitator:

   ```bash
   npx tsx tools/council/council-invoke.ts \
     --member <claude|gemini|gpt|kimi|mistral> \
     --prompt-file {output_dir}/_prompts/step1-shared.md \
     --output {output_dir}/{member}-analysis.md
   ```

   This writes the member's analysis content to
   `{member}-analysis.md` and the per-invocation provenance to
   `{member}-analysis.md.provenance.json` (the verification-gate input).
   If the command exits non-zero, stop and surface the provider failure;
   do not synthesize a substitute output.

Member-to-file mapping:

| Member                   | Output file                                  | Required env        |
| ------------------------ | -------------------------------------------- | ------------------- |
| `council-member-claude`  | `claude-analysis.md` (+ `.provenance.json`)  | `ANTHROPIC_API_KEY` |
| `council-member-gemini`  | `gemini-analysis.md` (+ `.provenance.json`)  | `GOOGLE_AI_API_KEY` |
| `council-member-gpt`     | `gpt-analysis.md` (+ `.provenance.json`)     | `AZURE_AI_API_KEY`  |
| `council-member-kimi`    | `kimi-analysis.md` (+ `.provenance.json`)    | `AZURE_AI_API_KEY`  |
| `council-member-mistral` | `mistral-analysis.md` (+ `.provenance.json`) | `AZURE_AI_API_KEY`  |

**After all members complete:**

1. Write the Step 1 seal, then lint, then verify. The seal comes FIRST:
   on genesis-anchored runs the ledger exists from the Setup probes
   onward, so `lint-council-run --at-step N` requires the step seal to
   already exist and fails with `seal-missing` if linted pre-seal
   (observed 2026-08-17, q3q4 run, step 1 boundary).

   ```bash
   npx tsx scripts/write-step-seal.ts --run-dir {output_dir} --step 1
   npx tsx tools/council/lint-council-run.ts --at-step 1 --strict {output_dir}
   npx tsx scripts/verify-chain.ts --strict {output_dir}
   npx tsx scripts/verify-seals.ts --strict {output_dir}
   ```

2. Stop on any lint finding — the lint verifies every Step 1 output,
   provenance sibling, model-verification wrapper field, and post-write
   file hash declared in `council-run-manifest.json`. The same
   seal → lint → chain → seals order applies at every later step
   boundary.

3. **Run the model-verification gate** per
   [`model-verification.md`](model-verification.md). For direct-API
   members, read each `provenance.json` and inspect
   `final.verification.result` plus `final.outcome`. Transcribe the
   per-member observed model and verification result into
   `model-verification-log.md`. Halt on any FAIL
   (`final.outcome == "model_mismatch_no_retry"`) or UNVERIFIABLE.
4. **Inspect non-success outcomes.** If any member's
   `final.outcome != "success"` (e.g. retries exhausted, permanent
   provider error), surface the partial-step state to the user before
   options per [`model-verification.md`](model-verification.md) §
   Failure recovery: fix-and-rerun the missing member, degrade the
   roster, or abort.
5. Briefly **summarize the key themes and divergences** across the
   analyses before proceeding to Step 2.

## Step 2 — Peer review

Each member reads the **other members'** analyses (not their own) and
writes a peer review. Invoke via the Council Facilitator with a
Step 2 prompt generated by `scripts/build-council-prompt.ts`; the
helper reads `council-run-manifest.json`, injects the other members'
Step 1 analyses, and fails closed with `required_sibling_missing` if a
declared sibling is absent.

```bash
npx tsx scripts/build-council-prompt.ts \
   --step 2 \
   --member <member> \
   --run-dir {output_dir} \
   --out {output_dir}/_prompts/step2-<member>.md
```

If the command exits non-zero, stop and fix the manifest or missing
sibling artifact before invoking the member. Do not hand-build the
prompt. The prompt builder reads `{output_dir}/_prompts/step2-template.md`
when present; otherwise it uses the canonical future-run template in
`.claude/skills/council/references/prompt-templates/step2-template.md`.

| Member                   | Reads                                | Writes                                                                                        |
| ------------------------ | ------------------------------------ | --------------------------------------------------------------------------------------------- |
| `council-member-claude`  | every other member's `*-analysis.md` | `peer_reviews/claude_peer_review.md` (+ `peer_reviews/claude_peer_review.md.provenance.json`) |
| `council-member-gemini`  | every other member's `*-analysis.md` | `peer_reviews/gemini_peer_review.md` (+ provenance)                                           |
| `council-member-gpt`     | every other member's `*-analysis.md` | `peer_reviews/gpt_peer_review.md` (+ provenance)                                              |
| `council-member-kimi`    | every other member's `*-analysis.md` | `peer_reviews/kimi_peer_review.md` (+ provenance)                                             |
| `council-member-mistral` | every other member's `*-analysis.md` | `peer_reviews/mistral_peer_review.md` (+ provenance)                                          |

**After all members complete:**

1. Write the Step 2 seal, then lint, then verify (seal first — see the
   Step 1 boundary note):

   ```bash
   npx tsx scripts/write-step-seal.ts --run-dir {output_dir} --step 2
   npx tsx tools/council/lint-council-run.ts --at-step 2 --strict {output_dir}
   npx tsx scripts/verify-chain.ts --strict {output_dir}
   npx tsx scripts/verify-seals.ts --strict {output_dir}
   ```

2. Stop on any lint finding before invoking the next step.

3. **Run the model-verification gate** per
   [`model-verification.md`](model-verification.md) (read each
   peer-review `provenance.json`). Append the outcome to
   `model-verification-log.md`. Halt on FAIL or UNVERIFIABLE.
4. Surface any non-success Facilitator outcomes per Step 1 ¶ 4.
5. Summarize the key **agreements and disagreements** across reviews.

## Step 3 — Revised approaches

Each member reads the **other members'** peer reviews (not their own)
and produces a revised plan that incorporates the critiques. Invoke
via the Council Facilitator with a Step 3 prompt generated by
`scripts/build-council-prompt.ts`:

```bash
npx tsx scripts/build-council-prompt.ts \
   --step 3 \
   --member <member> \
   --run-dir {output_dir} \
   --out {output_dir}/_prompts/step3-<member>.md
```

If the command exits non-zero, stop and fix the manifest or missing
sibling artifact before invoking the member. Do not hand-build the
prompt. The prompt builder reads `{output_dir}/_prompts/step3-template.md`
when present; otherwise it uses the canonical future-run template in
`.claude/skills/council/references/prompt-templates/step3-template.md`.

| Member                   | Reads                                                | Writes                                                      |
| ------------------------ | ---------------------------------------------------- | ----------------------------------------------------------- |
| `council-member-claude`  | every other member's `peer_reviews/*_peer_review.md` | `revised_approaches/claude-revised_plan.md` (+ provenance)  |
| `council-member-gemini`  | every other member's `peer_reviews/*_peer_review.md` | `revised_approaches/gemini-revised_plan.md` (+ provenance)  |
| `council-member-gpt`     | every other member's `peer_reviews/*_peer_review.md` | `revised_approaches/gpt-revised_plan.md` (+ provenance)     |
| `council-member-kimi`    | every other member's `peer_reviews/*_peer_review.md` | `revised_approaches/kimi-revised_plan.md` (+ provenance)    |
| `council-member-mistral` | every other member's `peer_reviews/*_peer_review.md` | `revised_approaches/mistral-revised_plan.md` (+ provenance) |

**After all members complete:**

1. Write the Step 3 seal, then lint, then verify (seal first — see the
   Step 1 boundary note):

   ```bash
   npx tsx scripts/write-step-seal.ts --run-dir {output_dir} --step 3
   npx tsx tools/council/lint-council-run.ts --at-step 3 --strict {output_dir}
   npx tsx scripts/verify-chain.ts --strict {output_dir}
   npx tsx scripts/verify-seals.ts --strict {output_dir}
   ```

2. Stop on any lint finding before invoking the next step.

3. **Run the model-verification gate** per
   [`model-verification.md`](model-verification.md). Append the
   outcome to `model-verification-log.md`. Halt on FAIL or
   UNVERIFIABLE.
4. Surface any non-success Facilitator outcomes per Step 1 ¶ 4.
5. Summarize **how each revised plan differs** from its initial
   analysis.

## Step 4 — Peer votes

Each member reads the **other members'** revised plans and votes on
which is strongest. Members may NOT vote for themselves. Invoke via
the Council Facilitator with a Step 4 prompt generated by
`scripts/build-council-prompt.ts`:

```bash
npx tsx scripts/build-council-prompt.ts \
   --step 4 \
   --member <member> \
   --run-dir {output_dir} \
   --out {output_dir}/_prompts/step4-<member>.md
```

If the command exits non-zero, stop and fix the manifest or missing
sibling artifact before invoking the member. Do not hand-build the
prompt. The prompt builder reads `{output_dir}/_prompts/step4-template.md`
when present; otherwise it uses the canonical future-run template in
`.claude/skills/council/references/prompt-templates/step4-template.md`.

| Member                   | Reads                                                       | Writes                                      |
| ------------------------ | ----------------------------------------------------------- | ------------------------------------------- |
| `council-member-claude`  | every other member's `revised_approaches/*-revised_plan.md` | `peer_votes/claude_vote.md` (+ provenance)  |
| `council-member-gemini`  | every other member's `revised_approaches/*-revised_plan.md` | `peer_votes/gemini_vote.md` (+ provenance)  |
| `council-member-gpt`     | every other member's `revised_approaches/*-revised_plan.md` | `peer_votes/gpt_vote.md` (+ provenance)     |
| `council-member-kimi`    | every other member's `revised_approaches/*-revised_plan.md` | `peer_votes/kimi_vote.md` (+ provenance)    |
| `council-member-mistral` | every other member's `revised_approaches/*-revised_plan.md` | `peer_votes/mistral_vote.md` (+ provenance) |

**After all members complete:**

1. Write the Step 4 seal, then lint, then verify (seal first — see the
   Step 1 boundary note):

   ```bash
   npx tsx scripts/write-step-seal.ts --run-dir {output_dir} --step 4
   npx tsx tools/council/lint-council-run.ts --at-step 4 --strict {output_dir}
   npx tsx scripts/verify-chain.ts --strict {output_dir}
   npx tsx scripts/verify-seals.ts --strict {output_dir}
   ```

2. Stop on any lint finding before invoking the next step.

3. **Run the model-verification gate** per
   [`model-verification.md`](model-verification.md). Append the
   outcome to `model-verification-log.md`. Halt on FAIL or
   UNVERIFIABLE.
4. Surface any non-success Facilitator outcomes per Step 1 ¶ 4.
5. Tally the votes per [`voting-rules.md`](voting-rules.md):

- **Majority winner:** summarize the reasoning and present the winner
  to the user. If the winning margin is narrow per
  [`voting-rules.md`](voting-rules.md) § "Margin-driven consensus
  integration", offer the opt-in Step 4.5 consensus integration round;
  otherwise proceed to Step 5.
- **Plurality winner (4-member only):** summarize the reasoning,
  present the plurality result + dissent to the user, and ask whether
  to accept the plurality or recurse for stronger consensus.
- **Tie:** **do not pause for user input.** Recurse through Steps 2–4
  per [`tie-breaking-recursion.md`](tie-breaking-recursion.md) until a
  winner emerges or the max-round cap is hit.

## Step 4.5 — Consensus integration (opt-in)

Step 4.5 is an opt-in synthesis round for narrow-margin wins where the
vote produced a winner but also surfaced substantive dissent primitives
that should travel into Step 5. It is NOT a convergence-forcing round:
the winning plan remains the base, and conflicting dissents are carried
as explicit dissent rather than flattened.

Source case: the 2026-05-22
[`step5-meta-retrospective.md`](../../../../research/council-runs/2026-05-22-model-identity-verification-technique/step5-meta-retrospective.md)
identified the 3-1-1 vote's unresolved dissent primitives as a handoff
risk.

Trigger: offer Step 4.5 when the winner's margin is ≤ 2 votes, including
3-1-1, 3-2, 2-1-1, and other fragmented narrow wins. Skip by default
for 4-1, 5-0, or any unambiguous wide majority unless the user opts in.

When the user opts in:

1. Choose the winning author or a designated synthesizer.
2. Add `revised_approaches/consensus_plan.md` to
   `council-run-manifest.json` under `expected_outputs_per_step.step4_5`.
3. Generate a prompt that includes the winning revised plan and all vote
   files. Keep run observations out of the prompt per the
   anti-self-citation constraint.
4. Invoke the Council Facilitator to write
   `revised_approaches/consensus_plan.md` plus its provenance sibling.
5. Write and verify the Step 4.5 seal:

   ```bash
   npx tsx scripts/write-step-seal.ts --run-dir {output_dir} --step 4_5
   npx tsx scripts/verify-chain.ts --strict {output_dir}
   npx tsx scripts/verify-seals.ts --strict {output_dir}
   ```

6. Run `npx tsx tools/council/lint-council-run.ts --full --strict
{output_dir}` and the model-verification gate for the consensus-plan
   invocation. Halt on FAIL, UNVERIFIABLE, or missing provenance.
7. Use `consensus_plan.md` as the Step 5 handoff input.

Required `consensus_plan.md` shape:

```markdown
# Consensus integration plan

## Winning plan as base

## Dissent primitives integrated into the base

## Dissents that conflict with the base

## Step 5 handoff content
```

## Step 5 — Create issue

After the user selects (or accepts) a winning plan, invoke **one**
member subagent (preferably the author of the winning plan) to create a
comprehensive GitHub issue based on the selected plan. The issue should:

- Open with a one-paragraph context summary
- List clear phases with specific, actionable todos
- Reference the source artifacts under the output directory (so the
  deliberation trail is auditable)
- Carry appropriate labels and milestone per the project's
  `product-specs` skill conventions

## Step 6 — Begin work

Before handoff, write the close-out summaries:

```bash
npx tsx scripts/council-run-summary.ts --run-dir {output_dir}
```

This writes `run-summary.json` and `run-summary.md`, including token
usage, attempt duration, `tokens_per_second`, and any
`usage_unavailable` rows. Link `run-summary.md` from the run `README.md`.

Hand off to the user. The issue from Step 5 is the starting point for
execution. Remind the user of the execution principles:

- Plan before implementing
- Move slowly and deliberately
- Quality, maintainability, correctness, and security are the decision axes
- Pause at decision points
- Do not commit code without review

The council's job ends at handoff. Execution itself is governed by the
project's normal per-issue workflow (`issue-workflow.instructions.md`)
and the `begin-delivery` / `begin-exploration` / `mini-retro` / `futro` skills.

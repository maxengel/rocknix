# Pipeline — the 6-step council process

The council pipeline requires **all five members**: every step that
says "each member" iterates over the complete roster verified in Setup
per [`member-roster.md`](member-roster.md). The roster is fixed for the
duration of a single council run — you do not re-detect mid-run.

## Setup (before Step 1)

When the user provides a problem context:

Scope the actual member requests using
[`context-loading.md` § Archive and request scope](context-loading.md#archive-and-request-scope)
before treating an archive-size estimate as a roster or methodology blocker.

1. **Determine the output directory** per
   [`output-conventions.md`](output-conventions.md):
   `research/council-runs/YYYY-MM-DD-{topic}/`
2. **Determine the active roster** per
   [`member-roster.md`](member-roster.md). Surface the chosen roster
   (all five members) to the user before proceeding. A failed seat blocks
   Setup for diagnosis; do not reduce or change an anchored roster in place.
For an authorized shadow campaign, apply [shadow experiments](shadow-experiments.md)
and select its explicit five-seat profile before Setup. Every arm gets a separate
manifest, genesis, ledger and seals. The default profile is definitive, with Muse in the fifth seat;
the fifth-seat evaluation runs the `grok-shadow` and `deepseek-shadow` arms beside every definitive run (scaffold#915).

3. **Create the directory layout** (initial analyses at the top level;
   subdirectories for `peer_reviews/`, `revised_approaches/`,
   `peer_votes/`) and write `council-run-manifest.json` per
   [`output-conventions.md`](output-conventions.md) § "Run manifest".
4. **Pre-flight the substrate** (scaffold#571 / #524) — run the checks
   the corpus ships beside the Facilitator; halt Setup on any
   finding:

   ```bash
   node scripts/verify-pins.ts
   node scripts/lint-council-seat-efforts.ts --strict
   npx tsx --test scripts/__tests__/council-invoke-routing.node-test.ts
   node --test scripts/council-toolchain.node-test.mjs
   ```

   The first proves every pinned verifier's bytes match `verifier-pins.json`
   and that any re-pin carries a reason; the second proves every seat's
   effort and output ceiling against the pinned catalog snapshot
   `council-seat-efforts.json`; the third proves route selection and each
   seat's pin, effort and ceiling, plus buffered/SSE actual-invoker and CLI
   identity failures (scaffold#665). `council-facilitator@<semver>` in the
   provenance siblings is the substrate version these checks vouch for.
   The fourth executes all seven standalone helpers against a fake transport,
   with local disposable anchors and no provider or Forge writes. It proves
   tooling behavior, not live key access or council conclusions. Node 24 runs
   the helpers natively; no application package manager or SDK is required.
5. **Anchor the run genesis** before invoking any member:

   ```bash
   node scripts/council-run-start.ts --run-dir {output_dir}
   ```

   This checks the manifest, recipe binding and accountable pins, then writes
   `verification/genesis.json` and creates `verification-anchors/<run_id>`
   with Git plumbing. The working branch and index never change; the anchor
   tree contains only genesis, never a seal key or unrelated staged files.
   Live publishing requires the in-tree Forge preflight to report `ready`,
   selects that same machine credential by file reference, and reads back
   the remote ref before recording `verification/anchor-receipt.json`.
   A refusal prints the existing protocol's next action, never a personal-token
   fallback. `--no-push` is local/offline setup only and cannot authorize calls.
   Retry identical setup safely; do not replace a missing existing seal key.
   The generated 0600 key is ignored by the seeded policy; it may alternatively
   be supplied through `COUNCIL_SEAL_HMAC_KEY`. Neither key belongs in Git.

6. **Set up the todo list** with one todo per (step, member) pair plus
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
the 2026-05-22 council run step-5 meta-retrospective (the source estate's repository, research/council-runs/)
documents the self-citation pattern that this rule prevents.

## Mandatory model-verification gate

**At every break between steps** (after Step 1, Step 2, Step 3, Step 4,
and after each tie-break recursion round), the **Council Orchestrator**
MUST run the model-verification gate per
[`model-verification.md`](model-verification.md) before advancing. The
gate compares each member's observed-model against its declared-model:

- **OpenRouter (default)** — read each member's per-invocation
  `*.provenance.json` sibling (written by the **Council Facilitator**,
  `scripts/council-invoke.ts`). The `final.verification.result` field
  is the per-member gate outcome; `final.outcome` distinguishes
  retry-exhaustion classes from model-mismatch FAIL. Content success
  with missing/blank model identity is `UNVERIFIABLE`, not PASS; the
  Facilitator retains the content but exits 6. No Setup or later step
  advances on content success alone.
- **Historical harness/direct-provider records** are audit material, not
  proof for a new anchored OpenRouter run.

Current runs also require `final.effort_verification.result == "PASS"`.
Positive provider reasoning tokens show that a reasoning seat reasoned; they
do **not** attest its exact effort level. Missing evidence remains UNVERIFIABLE.
(Mistral's non-reasoning recipe, outside every profile since scaffold#915, needed no
reasoning field.) Recipe identity is
bound by `roster_contract`, derived from the installed Facilitator; there is
no second editable roster JSON. Coordinator preference and observed runtime
identity remain separate, with `voting: false`.

Record every gate outcome in `model-verification-log.md` (schema in
[`output-conventions.md`](output-conventions.md)). The gate returns
PASS / FAIL / UNVERIFIABLE.

- **PASS** → advance to the next step.
- **FAIL** → halt the run, surface the mismatch, recover per
  `model-verification.md` § Failure recovery (repair and retry, or hold the run — never reduce the roster or
  silently substitute another model into a missing seat).
- **UNVERIFIABLE** → halt by default and preserve the evidence. For a
  direct API response, investigate its provider/transport model field;
  restarting the harness or enabling Copilot logging cannot supply it.
  Follow [`model-verification.md`](model-verification.md) before retrying
  or restarting. All five identities must pass before advancement.

The gate is **the gate that decides whether the prior step can be
trusted as input to the next step**. Skipping it lets corruption
propagate silently through the pipeline.

## Step 1 — Initial analysis

Invoke each active member via the **Council Facilitator**. Every seat is
a different provider, so the whole roster can run in parallel (the ledger
is lock-protected); run smaller batches only if you want to watch each
seat land. Each member reads identical input regardless of ordering (the
2026-09-03 limits audit retired the "one at a time" guidance — it only
added wall-clock). For each member:

1. Compose the Step 1 prompt (a shared prompt that lists the required
   source-document `read_file` instructions per
   [`context-loading.md`](context-loading.md) plus the step-specific
   ask: produce a thorough analysis, no code changes).
2. Write the prompt to `{output_dir}/_prompts/step1-{member}.md` (or
   reference a shared `step1-shared.md` if the prompt is identical
   across members).
3. Invoke the Council Facilitator:

   ```bash
   node scripts/council-invoke.ts \
     --member <claude|gemini|gpt|kimi|muse> \
     --prompt-file {output_dir}/_prompts/step1-shared.md \
     --output {output_dir}/{member}-analysis.md \
     --source-manifest {output_dir}/source-manifest.json
   ```

   This writes the member's analysis content to
   `{member}-analysis.md` and the per-invocation provenance to
   `{member}-analysis.md.provenance.json` (the verification-gate input).
   If the command exits non-zero, stop and surface the classified failure
   or identity uncertainty; do not synthesize a substitute output.

   The source manifest contains `sources: [{"path": "repo-relative.md",
   "sha256": "<digest>"}]` for the full mandatory context. The Facilitator
   embeds verified bytes; filenames alone do not give a stateless model file
   access. Anchored calls reject ignored sources, traversal and symlinks.
   Existing output/sidecar files are never overwritten. A previous failed or
   unverifiable invocation halts further calls in that run; preserve it for
   the recovery decision rather than deleting evidence to retry.

Member-to-file mapping:

| Member                   | Output file                                  | Required env        |
| ------------------------ | -------------------------------------------- | ------------------- |
| `council-member-claude`  | `claude-analysis.md` (+ `.provenance.json`)  | `OPENROUTER_API_KEY` |
| `council-member-gemini`  | `gemini-analysis.md` (+ `.provenance.json`)  | `OPENROUTER_API_KEY` |
| `council-member-gpt`     | `gpt-analysis.md` (+ `.provenance.json`)     | `OPENROUTER_API_KEY` |
| `council-member-kimi`    | `kimi-analysis.md` (+ `.provenance.json`)    | `OPENROUTER_API_KEY` |
| `council-member-muse`    | `muse-analysis.md` (+ `.provenance.json`)    | `OPENROUTER_API_KEY` |

**After all members complete:**

1. Write the Step 1 seal, then lint, then verify. The seal comes FIRST:
   on genesis-anchored runs the ledger exists from the Setup probes
   onward, so `lint-council-run --at-step N` requires the step seal to
   already exist and fails with `seal-missing` if linted pre-seal
   (observed 2026-08-17, q3q4 run, step 1 boundary).

   ```bash
   node scripts/write-step-seal.ts --run-dir {output_dir} --step 1
   node scripts/lint-council-run.ts --at-step 1 --strict {output_dir}
   node scripts/verify-chain.ts --strict {output_dir}
   node scripts/verify-seals.ts --strict {output_dir}
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
   Failure recovery: diagnose and repair the missing member, then retry;
   otherwise hold the run with its evidence intact.
5. Briefly **summarize the key themes and divergences** across the
   analyses before proceeding to Step 2.

## Step 2 — Peer review

Each member reads the **other members'** analyses (not their own) and
writes a peer review. Invoke via the Council Facilitator with a
Step 2 prompt generated by `scripts/build-council-prompt.ts`; the
helper reads `council-run-manifest.json`, verifies the prior step's artifacts,
ledger and seals, and injects every other member's Step 1 analysis exactly once.
Missing or invalid siblings fail with `prior_step_unverified`; self is excluded.

```bash
node scripts/build-council-prompt.ts \
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
| `council-member-muse`    | every other member's `*-analysis.md` | `peer_reviews/muse_peer_review.md` (+ provenance)                                             |

**After all members complete:**

1. Write the Step 2 seal, then lint, then verify (seal first — see the
   Step 1 boundary note):

   ```bash
   node scripts/write-step-seal.ts --run-dir {output_dir} --step 2
   node scripts/lint-council-run.ts --at-step 2 --strict {output_dir}
   node scripts/verify-chain.ts --strict {output_dir}
   node scripts/verify-seals.ts --strict {output_dir}
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
node scripts/build-council-prompt.ts \
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
| `council-member-muse`    | every other member's `peer_reviews/*_peer_review.md` | `revised_approaches/muse-revised_plan.md` (+ provenance)    |

**After all members complete:**

1. Write the Step 3 seal, then lint, then verify (seal first — see the
   Step 1 boundary note):

   ```bash
   node scripts/write-step-seal.ts --run-dir {output_dir} --step 3
   node scripts/lint-council-run.ts --at-step 3 --strict {output_dir}
   node scripts/verify-chain.ts --strict {output_dir}
   node scripts/verify-seals.ts --strict {output_dir}
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
node scripts/build-council-prompt.ts \
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
| `council-member-muse`    | every other member's `revised_approaches/*-revised_plan.md` | `peer_votes/muse_vote.md` (+ provenance)    |

**After all members complete:**

1. Write the Step 4 seal, then lint, then verify (seal first — see the
   Step 1 boundary note):

   ```bash
   node scripts/write-step-seal.ts --run-dir {output_dir} --step 4
   node scripts/lint-council-run.ts --at-step 4 --strict {output_dir}
   node scripts/verify-chain.ts --strict {output_dir}
   node scripts/verify-seals.ts --strict {output_dir}
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
- **Plurality winner (2-1-1-1, all five valid ballots):** summarize the reasoning,
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
the 2026-05-22 council run step-5 meta-retrospective (the source estate's repository, research/council-runs/)
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
   node scripts/write-step-seal.ts --run-dir {output_dir} --step 4_5
   node scripts/verify-chain.ts --strict {output_dir}
   node scripts/verify-seals.ts --strict {output_dir}
   ```

6. Run `node scripts/lint-council-run.ts --full --strict
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

After the user selects (or accepts) a winning plan, the orchestrator creates
or updates the corresponding **Forge** issue through the estate's approved
machine route. Reconcile existing stories instead of creating duplicates;
member models do not receive publishing credentials. The issue should:

- Open with a one-paragraph context summary
- List clear phases with specific, actionable todos
- Reference the source artifacts under the output directory (so the
  deliberation trail is auditable)
- Carry appropriate labels and milestone per the project's
  `product-specs` skill conventions

## Step 6 — Begin work

Before handoff, write the close-out summaries:

```bash
node scripts/council-run-summary.ts --run-dir {output_dir}
```

This writes `run-summary.json` and `run-summary.md`, including token
usage, attempt duration, `tokens_per_second`, and any
`usage_unavailable` rows. Link `run-summary.md` from the run `README.md`.
The summary refuses incomplete, legacy or invalid runs before writing, and
includes each recursion round separately. Its totals cover manifest-declared
outputs, not Setup probes. Missing usage is unknown, not observed zero; HMAC
seals prove local continuity, not independent provider-signed attestation.

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

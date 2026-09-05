# Model verification

> The council's value comes from **N distinct model perspectives**. A
> silently-substituted model duplicates an existing seat and destroys
> the adversarial value of the entire run. Verification is therefore
> not optional bookkeeping — it is the gate that decides whether the
> prior step can be trusted as input to the next step.

This file defines the **per-break verification checkpoint** the
Council Orchestrator runs between every pipeline step, the verification
mechanisms it uses, and the artifact (`model-verification-log.md`) it
produces. Pairs with the prioritized-array `model:` declarations on
each member agent and the per-invocation provenance JSON the Council
Facilitator emits.

**Substrate-of-record:** direct-API via the **Council Facilitator**
(`tools/council/council-invoke.ts`). The Facilitator captures the response
body of every invocation and writes a structured `*.provenance.json`
sibling alongside each member's output. The gate reads that JSON
directly — no Cache Explorer view, no OTLP log scrape, no human-eye-
on-debug-panel required. The runSubagent / Copilot-subagent path is
documented as a legacy fallback in § Substrate B below, retained for
tenants whose orchestrator tier permits premium-model invocation.

## Why this exists

Three failure modes the verification gate prevents:

1. **Silent picker leakage** — If the named model is unavailable AND
   no array is provided, VS Code falls back to "the currently selected
   model in model picker." A subagent invocation can then run on the
   wrong model with no visible warning. The prioritized-array form
   (even single-element) eliminates this — but only if every member
   agent uses it.
2. **Cross-member duplication** — A multi-element fallback chain that
   substitutes Claude for Gemini would produce two Claude analyses
   masquerading as a Claude + Gemini deliberation. The council's
   adversarial machinery (peer review, voting) collapses silently.
3. **Trust drift across steps** — Even if Step 1 ran on the right
   models, the next invocation might silently degrade. Without a
   per-break check the corruption propagates: Step 2 peer-reviews
   contaminated Step 1 outputs, Step 3 builds on contaminated peer
   reviews, and so on. By the time a vote tally lands the deliberation
   is no longer the deliberation we think it is.

The verification gate stops the chain of trust the moment any link
breaks.

## Verification mechanisms by substrate

Members can run on one of two substrates, with **different verification
mechanisms** and **different trust grades**. Direct-API is the
substrate-of-record; Copilot-subagent is retained as a documented
fallback for orchestrators whose cost-tier permits premium-model
invocation.

### Substrate A — direct-API via the Council Facilitator (substrate-of-record)

All five members can be invoked through `tools/council/council-invoke.ts`
("Council Facilitator"), which calls each provider's HTTPS API
directly:

| Member  | Provider HTTPS endpoint                                                                                   | Model returned in response               |
| ------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| claude  | `api.anthropic.com/v1/messages` (with `thinking.type=adaptive`, `output_config.effort=high`)              | `model: "claude-fable-5-1"`              |
| gpt     | `cognitiveservices.azure.com/openai/deployments/gpt-5.5/chat/completions` (with `reasoning_effort=xhigh`) | `model: "gpt-5.5-<datecode>"`            |
| gemini  | `generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent`                  | `modelVersion: "gemini-3.1-pro-preview"` |
| kimi    | `cognitiveservices.azure.com/openai/deployments/Kimi-K2.6/chat/completions`                               | `model: "Kimi-K2.6"`                     |
| mistral | `cognitiveservices.azure.com/openai/deployments/Mistral-Large-3/chat/completions`                         | `model: "mistral-large-3"`               |

**Primary mechanism:** the `model` (or `modelVersion`) field of each
provider's response body, captured by the Facilitator and persisted in
the per-invocation `*.provenance.json` sibling. The Orchestrator reads
provenance JSON directly; no debug panel inspection required.

**What the Council Facilitator captures:**

- `facilitator_version` — the provenance contract version emitted by
  `tools/council/council-invoke.ts`.
- `attempts[].content_sha256` — SHA-256 of the assistant content
  extracted from a provider response before it is written to disk.
- `final.file_artifact_sha256` — SHA-256 of the output Markdown file
  after the Facilitator writes it to disk. This binds the canonical
  analysis/review/plan/vote file to the response the Facilitator
  captured.
- `genesis_sha256` — SHA-256 of `verification/genesis.json` when the
  run was started through `scripts/council-run-start.ts`.
- `prev_verdict_sha256` — SHA-256 of the previous ledger verdict's
  canonical JSON, or `null` for the first verdict in a run.
- `final.usage` and `attempts[].usage` — provider token usage fields
  when the provider returns them.
- `final.verification` — declared model, observed model, match kind,
  and PASS / FAIL / UNVERIFIABLE result.

The two hashes serve different invariants: `content_sha256` binds the
provider response content, while `file_artifact_sha256` binds the
on-disk artifact downstream steps will read. The per-step completeness
gate verifies the latter before a file becomes input to the next step.

## Chain

For non-legacy runs, the Facilitator appends every provenance verdict
to a single per-run `ledger.jsonl` file under a single-writer lock. Each
line is canonical JSON for the same provenance object written to the
artifact's `.provenance.json` sibling. The next verdict records
`prev_verdict_sha256 = SHA-256(canonical JSON of the previous ledger
line)`. The first verdict records `prev_verdict_sha256: null`.

`scripts/verify-chain.ts --strict {run_dir}` verifies:

- the ledger exists for non-legacy runs;
- every ledger line parses as JSON;
- every `genesis_sha256` matches `verification/genesis.json` when a
  genesis file exists;
- every `prev_verdict_sha256` matches the canonical hash of the
  previous verdict.

This detects deletion or rewriting of any middle verdict. Truncation of
the final verdict is detected by step seals, because a plain hash chain
has no successor link after the last verdict.

## External anchoring

`scripts/council-run-start.ts --run-dir {output_dir}` initializes the
verification substrate for a new run. It writes
`verification/genesis.json` with the run id, roster hash, aliases hash,
verifier-pins hash when present, Facilitator version, timestamp, and the
anchor branch name. It then commits that genesis file on
`verification-anchors/<run_id>` and pushes the branch to the configured
remote. Use `--no-push` only for local dry-run validation.

Every later provenance verdict records the local genesis hash. A total
local-filesystem rewrite has to preserve both the local chain and the
externally anchored genesis hash, which makes the rewrite detectable by
comparing the local `verification/genesis.json` to the anchor branch.

If the anchor push fails, halt the run-start and resolve the git/remote
failure before invoking any member. Do not continue with an unanchored
run unless the user explicitly chooses to restart as a legacy/degraded
run and records that choice in the run README. If an anchor branch is
later force-pushed or its genesis file differs from the local file,
treat the run as tampered until a human compares the branch history,
local ledger, and artifact provenance trail.

## Assurance tiers

Every Facilitator provenance verdict records `final.assurance_tier` so
readers can distinguish which verification substrate actually supported
the model-identity claim. The current tier enum is intentionally ordered
from lowest to highest assurance:

| Tier                              | Meaning                                                                |
| --------------------------------- | ---------------------------------------------------------------------- |
| `client_telemetry`                | Client/router telemetry asserted the model, without provider response. |
| `local_capture_provider_attested` | Local Facilitator captured the provider response model field.          |
| `corroborated`                    | Two or more independent local channels agree on the observed identity. |
| `provider_signed`                 | Provider-signed attestation binds the response to a model identity.    |

Direct-API Facilitator runs currently emit
`local_capture_provider_attested`. The higher tiers are reserved for
future provider-signed attestation or independent corroboration channels;
do not label a run with those tiers until the corresponding verifier
exists.

Step seals carry both `min_assurance_tier` and
`min_assurance_tier_across_seats`. They are the minimum tier among the
verdicts sealed through that step, using the ordering above. Run summaries
and close-out comments must describe the run at the minimum observed tier,
not the best seat's tier.

Tier degradation is allowed; tier dishonesty is not. A run may mix
verification substrates as long as every verdict and seal reports the tier
that actually supported it. The threat model is silent substitution or
overstated assurance, not honest substrate diversity.

## Verifier integrity

`verifier-pins.json` pins the exact bytes of the Council Facilitator,
completeness lint, chain verifier, seal verifier, seal writer, run-start
anchor writer, and shared verification helpers. The pre-commit hook
`council-verifier-pins` runs `scripts/verify-pins.ts` whenever one of
those files or `verifier-pins.json` changes. `scripts/council-run-start.ts`
also runs the same check before it writes genesis or creates an anchor
branch.

Changes to `verifier-pins.json` require CODEOWNERS review because the pins
define which verifier bytes future council runs trust. If a verifier file
changes intentionally, regenerate the corresponding hash in
`verifier-pins.json`, explain the verifier behavior change in the commit,
and keep the pin update in the same commit as the verifier change. If the
preflight fails during run start, halt setup and resolve the pin mismatch;
do not continue with an unverifiable verifier set.

**Trust grade: high.** The response body comes from the model's
inference layer, not from any routing layer above. There is no
intermediate substrate that could lie about the model identity.

**Declared-vs-observed matching is SEMANTIC, not literal.** Observed
strings are version-stamped or sometimes lowercase
(`anthropic/claude-5-fable-20260609`, `openai/gpt-5.6-sol-20260709`,
`mistral-large-3`); declared strings in the
agent file are human-readable
(`anthropic/claude-fable-5 (OpenRouter, effort=max)`,
`openai/gpt-5.6-sol (OpenRouter via Azure, effort=max)`,
`Mistral-Large-3 (Azure AI Foundry)`). The Facilitator implements
per-member `modelMatches()` predicates that PASS when the observed
string encodes the declared model. Both strings are recorded verbatim
in `provenance.json.final.verification` so the match decision is
auditable post-hoc.

**Required env vars:** `ANTHROPIC_API_KEY` (claude), `AZURE_AI_API_KEY`
(gpt + kimi + mistral), `GOOGLE_AI_API_KEY` (gemini). The Facilitator
fails fast (exit 4) when any required var is unset — it never falls
back to a different model, because the council depends on N distinct
attested perspectives. (For the OpenRouter route — Substrate C below —
the single required var is `OPENROUTER_API_KEY`.)

### Substrate C — OpenRouter (all-member, single-key)

All five members are invoked through `tools/council/council-invoke.ts` on OpenRouter
by default (`--provider openrouter` is the explicit equivalent; use
`--provider direct` only for the max-independence fallback), routing every
seat through OpenRouter's OpenAI-compatible endpoint with a single
`OPENROUTER_API_KEY`. Each seat is pinned to one model slug
(`anthropic/claude-fable-5`, `google/gemini-3.1-pro-preview`,
`openai/gpt-5.6-sol`, `moonshotai/kimi-k2.6`; mistral keeps its env-overridable
slug) with **no `models[]` fallback array** — OpenRouter may route across
providers of the SAME model (infra backup), but a request can never resolve to
a DIFFERENT model. Each reasoning seat also requests its maximum supported
reasoning effort via OpenRouter's unified `reasoning.effort` (`max` for Fable
5 + GPT-5.6 Sol, `xhigh` for Gemini + Kimi; Mistral-Large-3 is not a reasoning
model).

The **gpt seat** additionally pins `provider: { order: ["openai"],
allow_fallbacks: false }`. The first full-corpus activation on the Azure route
returned two HTTP-200 empty envelopes (no model identity, no content); the run
halted correctly as UNVERIFIABLE. OpenAI is the subsequently live-verified
route for `gpt-5.6-sol`; fallbacks remain disabled. The provider pin is an
availability/correctness lever — identity is still response-attested per call.

**Primary mechanism:** identical to Substrate A — the Facilitator captures the
response-body `model` field and verifies it against the pinned slug. OpenRouter
echoes the served model order-insensitively and with a build/date suffix
(`anthropic/claude-fable-5` → `anthropic/claude-5-fable-20260609`), so the
per-member matcher (`openRouterModelMatches`) accepts that form but **rejects
sibling / version / variant / wrong-provider substitutions** (covered by
`scripts/__tests__/council-invoke-routing.test.ts`). The response also carries a
`provider` field as a cross-check.

**Assurance tier:** `local_capture_provider_attested` — the same enum value as
Substrate A, because identity comes from a captured response field, not from
request-route telemetry.

**Trust grade: high, with one honest caveat.** OpenRouter is a routing layer
_above_ the inference layer — unlike direct-API (Substrate A), where "there is
no intermediate substrate that could lie about the model identity." The
N-distinct-perspectives invariant is preserved by per-seat model pinning (no
cross-model fallback) plus the `cross-corpus-model-collision` lint, and identity
is still response-attested — but the trust surface is one aggregator rather than
N independent provider APIs. **OpenRouter is the operational default;
direct-API (Substrate A) remains the explicit maximum-independence fallback**
(one key versus N provider credentials), chosen deliberately with the
aggregator trust shift recorded here.

### Substrate B — Copilot subagent (BYOM, legacy fallback)

Members `council-member-claude` / `council-member-gemini` /
`council-member-gpt` may also invoke via VS Code Copilot's BYOM channel
IF the orchestrator's cost-tier permits premium-model invocation. This
path does not work when the orchestrator runs at a tier below the
declared premium models — `runSubagent` returns
`model exceeds the current model's cost tier (15x vs 0x)` before the
subagent can be reached. That cost-tier rejection was Finding #1 of
the 2026-05-22 test council run (see
[`research/council-runs/2026-05-22-model-identity-verification-technique/model-verification-log.md`](../../../../research/council-runs/2026-05-22-model-identity-verification-technique/model-verification-log.md))
and is the reason direct-API became the substrate-of-record.

When this path is available, verification relies on VS Code debug
surfaces (which observe the BYOM channel from above):

| Mechanism                     | What it shows                                                                                                         | Where it lives                                                        | When to consult                                                                   |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Cache Explorer** (Preview)  | Per-turn model name, cache hit %, duration, timestamp                                                                 | Agent Debug Log panel → Cache Explorer tab                            | Primary Copilot-substrate verification source                                     |
| **Agent Flow Chart**          | Visualises the subagent call tree for a turn                                                                          | Agent Debug Log panel → Agent Flow Chart tab                          | When the call shape is in doubt (did the orchestrator actually invoke the agent?) |
| **Chat Debug view**           | Raw system prompt, user prompt, context, tool payloads                                                                | Right-click in Chat view → Diagnostics / Open Chat Debug              | When you need the exact prompt that ran                                           |
| **OTLP JSON session export**  | Structured, scriptable audit trail of every chat turn (request shape, model id, tokens, duration)                     | File logs on disk (enabled by the `.vscode/settings.json` keys below) | Post-hoc / scriptable verification — grep across N turns                          |
| **`/troubleshoot`** slash cmd | In-chat queries against captured session events ("what model ran turn N?", "list all model switches in this session") | Chat input                                                            | Ad-hoc verification mid-session                                                   |

**Trust grade: medium.** Cache Explorer / OTLP / `/troubleshoot` all
report what VS Code's routing infrastructure says it did. A bug or
drift in that infrastructure could in principle produce a Cache
Explorer entry that doesn't match the actual API call. Unlikely in
practice but a documented limitation.

The on-disk OTLP logs require two settings (already added to
`.vscode/settings.json`):

```jsonc
"github.copilot.chat.agentDebugLog.fileLogging.enabled": true,
"github.copilot.chat.fileLogging.enabled": true,
```

Without these, the Cache Explorer view still works in the current
session but the logs do not persist across reloads — post-hoc
verification becomes impossible.

## The per-break verification gate

After every step that invokes member subagents (Steps 1, 2, 3, 4, and
each tie-break recursion round), the Orchestrator runs this gate
**before** advancing to the next step:

1. **For each (member, invocation) pair in the active roster, apply
   the verification mechanism appropriate to that member's substrate:**
   - **Direct-API (Council Facilitator)** — read the per-invocation
     `*.provenance.json` sibling that the Facilitator wrote alongside
     each member's output. The `final.verification.observed` field is
     the model the provider self-reported; `final.outcome` is the
     terminal status (`success`, `model_mismatch_no_retry`, etc.).
     This is the substrate-of-record.
   - **Copilot subagents (legacy fallback)** — open Cache Explorer
     (or read the OTLP log file for the corresponding turn), find the
     subagent's invocation, read the model name. Use only if the
     orchestrator's cost tier permits premium-model invocation; the
     Facilitator path is preferred.
2. **Compare to the declared model** in the member's agent file
   (`.claude/agents/council-member-{model}.agent.md` → `model:`
   array, first element). Use SEMANTIC matching (an observed
   `gpt-5.5-2026-04-24` PASSes against declared `gpt-5.5
(azure-foundry-direct, reasoning_effort=xhigh)` because it encodes
   the declared model). The Facilitator's per-member `modelMatches()`
   predicate implements this rule for direct-API; Copilot-subagent
   verifications match manually.
3. **Append a row to `model-verification-log.md`** in the council run
   output directory (see [`output-conventions.md`](output-conventions.md)
   for the canonical path and schema). The row includes the substrate,
   the verification mechanism used, both strings verbatim, and the
   result.
4. **Decide one of three outcomes:**

| Outcome          | Trigger                                                                                                                                           | Action                                                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PASS**         | Every member's invocation in this step ran on its declared model                                                                                  | Append PASS row(s) to the log and advance to the next step                                                                                                            |
| **FAIL**         | Any member's invocation ran on a model other than its declared model                                                                              | **Halt the run.** Surface the mismatch to the user; do NOT advance. The contaminated step's outputs cannot be used as input to the next step. See § Failure recovery. |
| **UNVERIFIABLE** | The verification mechanism for that member is unavailable in this session (Cache Explorer disabled, OTLP not on disk, response body not captured) | Surface the limitation to the user; ask whether to proceed (degraded trust) or halt. Default is to halt and ask the user to fix the substrate prereq + retry.         |

The gate is symmetric across all roster sizes — 5-member council
verifies five models; 4-member verifies four; 3-member trio verifies
three. The same procedure applies in tie-break recursion rounds.

## Failure recovery

When the gate returns FAIL:

1. **Do not silently re-run** the offending member on the same step
   without surfacing the mismatch — a silent retry can mask a
   systemic auth / quota / routing issue that will recur.
2. **Investigate the cause** with the user. Common cases:
   - Named model unavailable (org quota, region issue, model
     deprecation in Copilot's BYOM channel)
   - Foundry endpoint misconfigured (Kimi-K2.6 specifically — see
     user memory `azure-ai-foundry-quirks.md`)
   - Single-string `model:` field (shouldn't be possible after the
     array-form conversion, but verify)
3. **Decide with the user** between:
   - **Fix and re-run the step** — if the cause is recoverable
     (e.g., quota refresh, settings tweak). Re-running discards the
     contaminated outputs.
   - **Degrade the roster** — if the model is permanently
     unreachable today, the orchestrator can drop that member's seat
     and continue as a smaller council per
     [`member-roster.md`](member-roster.md). Note the degradation in
     the verification log.
   - **Abort the run** — if the degraded roster would fall below
     3 members or the user prefers to wait.

The "silently substitute another model into the missing seat" option
is **explicitly NOT on the menu.** That is what destroyed the
adversarial value in the first place; offering it as a recovery would
re-introduce the failure mode.

### What the Council Facilitator retries automatically (and what it doesn't)

The Facilitator retries failure classes it can resolve without user
input; everything else surfaces to the Orchestrator for a user
decision. The split is by design — a transient network blip should
not bother the user, but a model-mismatch absolutely should.

| Failure class                            | Retryable by Facilitator?        | Why                                                                                              |
| ---------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------ |
| Transient network / fetch error          | ✅ yes                           | Provider blip; nothing semantic about the call                                                   |
| HTTP 429 rate limit                      | ✅ yes (respects `Retry-After`)  | Provider throttle; backoff is correct                                                            |
| HTTP 5xx server error                    | ✅ yes                           | Provider transient                                                                               |
| HTTP 200 + empty content                 | ✅ yes (auto-bumps `max_tokens`) | Reasoning preamble ate budget (Kimi/Gemini quirk); 2× budget, capped at provider max             |
| HTTP 200 + truncated content             | ✅ yes (auto-bumps `max_tokens`) | Same root cause as empty                                                                         |
| HTTP 401 / 403 / 404 (auth/config)       | ❌ no                            | Credentials or endpoint wrong; retry won't help                                                  |
| HTTP 400 / 422 (bad request)             | ❌ no                            | Body shape is wrong (e.g. Mistral with `max_completion_tokens`); retry won't help                |
| HTTP 200 + **observed model ≠ declared** | ❌ **NEVER**                     | This is the silent-substitution failure mode the gate exists to catch. Auto-retry would mask it. |

When the Facilitator exhausts its retry budget on a retryable class,
or encounters a non-retryable failure, it writes a `provenance.json`
with `final.outcome != "success"` and exits with a distinct code
(1=transient exhaustion, 2=empty exhaustion, 3=model mismatch,
5=permanent provider). The Orchestrator inspects the outcome and
surfaces the partial-step state to the user per § Failure recovery
above.

## Verification log schema

The per-run `model-verification-log.md` artifact records every gate
outcome chronologically. Schema lives in
[`output-conventions.md`](output-conventions.md) § "Model verification log."

A minimal entry:

```markdown
### Step 1 · r1 · 2026-07-11T04:09:54Z

| Member | Declared model                                           | Observed model                    | Result | Notes |
| ------ | -------------------------------------------------------- | --------------------------------- | ------ | ----- |
| claude | anthropic/claude-fable-5 (OpenRouter, effort=max)        | anthropic/claude-5-fable-20260609 | PASS   | —     |
| gemini | google/gemini-3.1-pro-preview (OpenRouter, effort=xhigh) | google/gemini-3.1-pro-preview     | PASS   | —     |
| gpt    | openai/gpt-5.6-sol (OpenRouter via Azure, effort=max)    | openai/gpt-5.6-sol-20260709       | PASS   | —     |
| kimi   | moonshotai/kimi-k2.6 (OpenRouter, effort=xhigh)          | moonshotai/kimi-k2.6              | PASS   | —     |

Gate outcome: **PASS** — advancing to Step 2.
```

## Why single-element arrays (not multi-element fallback chains)

Every member's `model:` field is a **single-element prioritized list**:

```yaml
model:
  - "anthropic/claude-fable-5 (OpenRouter, effort=max)"
```

A multi-element chain like:

```yaml
# DO NOT DO THIS in member agents
model:
  - "anthropic/claude-fable-5 (OpenRouter, effort=max)"
  - "Claude Sonnet 4.5 (copilot)"
```

would let VS Code substitute Sonnet for Fable when Fable is unavailable.
For the **orchestrator** that might be acceptable (orchestration is
deterministic pipeline logic). For a **council member** it is not —
the council's value is N distinct perspectives, and Sonnet-in-Fable's-seat
plus Fable-in-Fable's-seat are not two distinct perspectives. They are
the same model family analysing the same problem with marginally
different weights, masquerading as two separate seats.

The roster-degradation machinery (4→3→refuse) is the **only**
permitted response to a missing model. The single-element array form
forces failures to surface there, where they belong.

## Cross-references

- [`tools/council/council-invoke.ts`](../../../../tools/council/council-invoke.ts)
  — the **Council Facilitator**: per-member direct-API dispatcher,
  retry policy, and `provenance.json` emitter that this gate reads
- [`member-roster.md`](member-roster.md) — declares the active
  roster and the 4→3→refuse degradation rules that this file
  defers to
- [`pipeline.md`](pipeline.md) — every per-member step ends with
  "Run the model-verification gate per `model-verification.md` before
  advancing"
- [`output-conventions.md`](output-conventions.md) § "Model
  verification log" — canonical path and schema for the per-run
  log artifact
- [`.vscode/settings.json`](../../../../.vscode/settings.json) —
  the two file-logging keys the legacy Copilot-subagent path depends on
- [`docs/reference/agent-file-conventions.md`](../../../../docs/reference/agent-file-conventions.md)
  — documents the prioritized-array `model:` form repo-wide
- [`scripts/lint-agent-model-arrays.ts`](../../../../scripts/lint-agent-model-arrays.ts)
  — PR-time lint that enforces the array-form invariants this gate
  depends on (`.github/instructions/lint-with-rule.instructions.md`
  pattern: the rule and the lint ship together)
- [`research/council-runs/2026-05-22-model-identity-verification-technique/model-verification-log.md`](../../../../research/council-runs/2026-05-22-model-identity-verification-technique/model-verification-log.md)
  — the run that surfaced the runSubagent cost-tier ceiling and drove
  the direct-API pivot
- VS Code docs — [Custom agents](https://code.visualstudio.com/docs/copilot/customization/custom-agents)
  (`model:` field accepts string OR prioritized array)

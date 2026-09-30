# Model roster

Council-research requires the same **five verified members** as the council
skill. The roster is locked at Setup for all member phases. A missing,
incomplete or unverified member halts the run for diagnosis and repair;
there is no fallback to four or three.

## Cross-reference

The authoritative roster definition is the council skill's
[`member-roster.md`](../../council/references/member-roster.md).
This file inherits that definition; it does NOT redefine roster
behavior. Where this file adds anything, it's for council-research
specifics (multi-phase locking, Phase-1 invocation order, etc.).

## Members

| Member short name | Subagent file                                    | Canonical OpenRouter model / effort                    | Context   | Phases participated           |
| ----------------- | ------------------------------------------------ | ------------------------------------------------------ | --------- | ----------------------------- |
| `claude`          | `.claude/agents/council-member-claude.agent.md`  | `anthropic/claude-fable-5.1`, effort=`xhigh` (Fable 5.1 since 2026-09-09)                                                  | 1,000,000 | 1, 3, 4                       |
| `gemini`          | `.claude/agents/council-member-gemini.agent.md`  | `google/gemini-3.8-flash`, effort=`high`                                                                             | 1,048,576 | 1, 3, 4                       |
| `gpt`             | `.claude/agents/council-member-gpt.agent.md`     | `openai/gpt-6-astra`, OpenAI provider, effort=`max` (GPT-6 Astra at the highest effort, operator direction 2026-09-09)     | 1,050,000 | 1, 3, 4                       |
| `kimi`            | `.claude/agents/council-member-kimi.agent.md`    | `moonshotai/kimi-k3`, effort=`max`, provider pin modal → sail-research → together → moonshotai (no fallbacks; 2026-09-08) | 1,048,576 | 1, 3, 4 (required) |
| `muse`            | `.claude/agents/council-member-muse.agent.md`    | `meta/muse-spark-1.3`, effort=`max`, provider pin `meta` (the fifth seat since 2026-09-27, scaffold#915) | 1,048,576 | 1, 3, 4 (required) |

Phase 2 (clinical synthesis) is executed by the **Researcher Agent**
(`.claude/agents/researcher.agent.md`), NOT by the council-member-\* members.
Phase 5 (deliverable) is executed by the **council-research
orchestrator** (the agent running this skill).

## Substrate: OpenRouter default, direct-API fallback

Every member is invoked through the Council Facilitator
(`scripts/council-invoke.ts`). Two substrates are available, locked at Setup:

- **OpenRouter (default; explicit `--provider openrouter`)** — one
  `OPENROUTER_API_KEY` covers all five individually pinned seats. Fable 5.1
  requests effort=`xhigh` (not `max`: on bounded corpora `max` over-thinks
  into empty envelopes); GPT-6 Astra requests effort=`max` — the operator's
  2026-09-09 direction ("the highest reasoning level we can get from
  OpenRouter for ChatGPT 6 Astra"), a directed exception to that caution, with
  `openai/gpt-6-astra-pro` recorded as the escalation if `max` on the standard
  endpoint falls short; Gemini requests effort=`high`. Kimi K3 requests
  effort=`max`, matching its pinned default and existing canonical recipe;
  its declared supported set is `max/high/low`. Neither seat declares `xhigh`;
  an unsupported setting must not be recorded as verified effort. Muse Spark 1.3
  requests effort=`max`, its highest. The pins of record are `OPENROUTER_RECIPES` in
  `scripts/council-invoke.ts` (roster revision 2026-09-09, scaffold#562);
  this table mirrors them. GPT is OpenAI-provider-pinned with fallbacks
  disabled: the Azure route passed PONG but twice returned HTTP-200 empty
  envelopes on the first 179k-token corpus; the identical corpus succeeded on
  OpenAI with response-model verification PASS. The Facilitator fails closed
  when the key is absent; it never silently reroutes.
- **Direct-API (`--provider direct`)** — per-provider keys
  (`ANTHROPIC_API_KEY`, `AZURE_AI_API_KEY`, `GOOGLE_AI_API_KEY`); explicit
  maximum-independence fallback, retaining the prior provider recipes.

Both routes emit the same attestation tier
(`local_capture_provider_attested`); see
[`../../council/references/model-verification.md`](../../council/references/model-verification.md)
§ Substrate C for the pinning + honest aggregator trust-shift detail.

## Reachability check

At Setup, probe all five members through the Facilitator. Retain probe
artifacts and provenance, record the complete roster and require every
identity to pass before Phase 1. Probe success does not prove corpus fit.

If a member fails later, halt at that phase and diagnose before retrying
the same member. A provider/model or roster-contract change requires a
fresh run; never continue the existing run with four members.

## Foundry quirks (Kimi-K2.6 and Mistral-Large-3)

`council-member-kimi` and `council-member-mistral` have historical routes through
Azure AI Foundry's OpenAI-compatible chat-completions endpoints. Known
quirks (inherited from the council skill and the member agent files):

| Quirk                                       | Symptom                                                                                     | Workaround                                                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| No `/models` listing                        | `GET /models` returns 404                                                                   | Pass deployment name explicitly; do NOT auto-discover                                                            |
| Dual-header auth                            | OpenAI-compat SDKs send `Authorization: Bearer`; Azure expects `api-key:`                   | Send BOTH headers — Foundry ignores whichever it doesn't need                                                    |
| `response_format: json_object` flaky        | HTTP 200 but unparseable content after long waits on some Foundry-direct members            | Prompt-level "respond with valid JSON only" + tolerant parser + retry; same pattern council-member-\* agents use |
| Token parameter differs by deployment       | Mistral rejects `max_completion_tokens`; GPT requires it; Kimi and Mistral use `max_tokens` | Invoke through the Council Facilitator so per-member request shaping stays centralized                           |
| Reasoning preamble eats short token budgets | Empty `content` with HTTP 200 on very small token budgets                                   | Use `max_tokens >= 256` for Foundry calls that need visible output                                               |

These quirks affect the council skill (Phase 4) and Phase 1/3
invocations of `council-member-kimi` and `council-member-mistral`. The
mitigations live in those skills, the Council Facilitator, and the agent
files; council-research inherits them automatically — there is no
council-research-specific Foundry handling beyond the reachability check
and the five-seat failure-recovery rule.

## Request-size recovery

The shared [request-size and transport recovery reference](../../council/references/context-loading.md#request-size-and-transport-recovery)
owns the #4971 output-budget workaround, retained SSE/large-input examples
and phase-specific input-partition precedent. Read it before diagnosing
a seat's request-size failure or replacing a consumer's existing budget guidance.
It does not change the installed recipe, staged reservation or five-seat rule.

## Foundry probe artifact

Reachability is established empirically at Setup. Historical probe
evidence at this skill's authoring/update time:

- Path: `tmp/kimi-foundry-probe-2026-05-18T15-44-11-507Z.json`
- Probe script: `tmp/kimi-foundry-probe.mjs`
- Result summary: basic completion ✓, tool calling ✓, json_mode ✗ (timeout-then-empty), `/models` listing ✗ (404), long-context 50k ✓, streaming ✓, large output ✓
- Mistral probe: recorded in `.claude/agents/council-member-mistral.agent.md`
  (2026-05-22; HTTP 200; response body `model=mistral-large-3`; returned `PONG`)

The probe artifact is informational, not authoritative. council-research
Setup should run a fresh reachability check (single basic-completion
call to each Foundry member) rather than trusting stale probes.

## Five-seat phase coverage

- **Phase 1:** five independent corpora from the locked roster.
- **Phase 2:** clinical synthesis cross-references all five corpora.
- **Phase 3:** five verified adversarial reviews.
- **Phase 4:** all five complete the council pipeline and valid ballots.
- **Phase 5:** preserve all five sources and dissent in the deliverable.

Missing work blocks the next phase; it does not shrink the source set or
voting denominator. Preserve historical reduced-roster runs as historical
evidence without treating them as satisfying this policy.

## Failure recovery and reserves

Follow the canonical council
[`member-roster.md`](../../council/references/member-roster.md) for route,
authentication, context and streaming diagnosis. A PONG probe proves
reachability, not full-request capacity. Use the approved bounded-reading
workflow when needed; do not drop a member or required originals.

No reserve is enabled. A prospective replacement requires owner selection,
canonical Facilitator support and verification before a fresh five-seat run.
Restart at Phase 1, after any required Phase 0, with a new genesis for Phase 4.
Do not swap mid-run, add a sixth vote or append a fifth member to an existing
four-member deliberation. The shared roster reference owns these rules;
this wrapper only adds phase coverage and restart scope.

## Cross-references

- [`SKILL.md`](../SKILL.md) — orchestrator-level roster discipline (Setup-time locking)
- [`phase-1-independent-research.md`](phase-1-independent-research.md) — per-member Phase 1 invocation
- [`phase-3-adversarial-review.md`](phase-3-adversarial-review.md) — per-member Phase 3 invocation
- [`phase-4-council-deliberation.md`](phase-4-council-deliberation.md) — Phase 4 inherits roster from Setup
- [`../../council/references/member-roster.md`](../../council/references/member-roster.md) — the authoritative roster definition this file inherits
- [`../../council/references/voting-rules.md`](../../council/references/voting-rules.md) — five-member voting rules
- [`../../council/references/model-verification.md`](../../council/references/model-verification.md) — direct-API substrate and provider-attested model identity

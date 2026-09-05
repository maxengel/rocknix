# Member roster

The council pipeline runs across an **active roster** of member
subagents. The roster is determined at Setup and **fixed for the
duration of one council run** — never re-detected mid-run, because
mid-run roster changes corrupt the voting tally and the per-member
output filenames.

## Available members

All five members are invoked via the **Council Facilitator**
(`tools/council/council-invoke.ts`) on the all-member **OpenRouter** route by
default. One council key reaches five individually pinned model slugs; every
response is model-identity-verified by the Facilitator. Direct-provider APIs
remain an explicit max-independence fallback (`--provider direct`), never a
silent fallback when the council key is absent. See
[`model-verification.md`](model-verification.md) § Substrate C.

| Subagent                 | Canonical model / effort                               | Substrate  | Required env         | Context   |
| ------------------------ | ------------------------------------------------------ | ---------- | -------------------- | --------- |
| `council-member-claude`  | `anthropic/claude-fable-5.1`, effort=`xhigh`           | OpenRouter | `OPENROUTER_API_KEY` | 1,000,000 |
| `council-member-gemini`  | `google/gemini-3.1-pro-preview`, effort=`high`         | OpenRouter | `OPENROUTER_API_KEY` | model pin |
| `council-member-gpt`     | `openai/gpt-5.6-sol`, OpenAI provider, effort=`max`    | OpenRouter | `OPENROUTER_API_KEY` | 1,050,000 |
| `council-member-kimi`    | `moonshotai/kimi-k3`, effort=`max`                     | OpenRouter | `OPENROUTER_API_KEY` | model pin |
| `council-member-mistral` | `mistralai/mistral-large-2512`, native (non-reasoning) | OpenRouter | `OPENROUTER_API_KEY` | model pin |

Roster history (all user-directed; the Facilitator's `OPENROUTER_SEATS` table is
the authority, this table mirrors it):

- **2026-08-12** — Claude seat Fable 5 → Opus 5; reasoning seats `max` → `xhigh`.
  `max` over-thinks bounded review corpora (10–13 minute attempts and
  reasoning-budget-exhausted empty envelopes during the F6 delta rounds, which the
  Facilitator classed UNVERIFIABLE). `xhigh` stays the working tier for
  review-shaped work.
- **2026-08-27** — Claude seat back to Fable 5 ("use the most advanced model for
  research"; the seat/orchestrator decorrelation the 08-12 ruling protected is
  traded away knowingly). Kimi K2.6 → **Kimi K3** (1.05M context vs 262K; K2.6 was
  the weakest seat by a wide margin). Gemini `xhigh` → `high`: Gemini 3.1 Pro
  Preview advertises only high/medium/low, and an unsupported value errors or
  silently falls back while the record still attests `xhigh`. Kimi K3 advertises
  max/high/low, so `high` is its usable ceiling too. Enforced by
  `scripts/lint-council-seat-efforts.ts` against `council-seat-efforts.json`.
- **2026-09-03** (this repo) — Claude seat Fable 5 → **Fable 5.1**
  (`anthropic/claude-fable-5.1`, listed on OpenRouter 2026-09-01), same `xhigh`.
  Coordination (the `council` orchestrator, which runs pipeline logic rather than
  member analysis) is declared on **Opus 5**. The direct-API Claude fallback
  moved Opus 4.8 → Fable 5.1 as well.

- **2026-09-03, later** (this repo) — limits revisited at owner direction ("time shouldn't be
  a concern, nor budget"). Every seat now requests its full output ceiling on the first
  attempt (Fable 5.1 and GPT 128000, Gemini 65536, Kimi 262144, Mistral 131072); the
  Facilitator's per-attempt timeout is one hour and the total four hours. Efforts rise to
  the model maximum where the output arithmetic allows: GPT `xhigh` → **`max`**, Kimi
  `high` → **`max`** (K3's own default). Claude stays `xhigh` because at xhigh it already
  used 54k of its 128k output cap on a real Step 1, and `max` risks the cap; Gemini stays
  `high`, its ceiling. Rationale and the full audit: `docs/council-limits.md`.

Live verification: see `research/seat-probes/` for dated Facilitator PONG probes
of every seat (HTTP 200, provider-attested model identity, effort evidence).

## Substrate (OpenRouter default, direct-provider fallback)

The Facilitator's per-invocation `provenance.json` sibling carries the
OpenRouter response body's served `model` field, which the per-break
model-verification gate compares semantically against the pinned slug.
**Trust grade: high** (`local_capture_provider_attested`) — OpenRouter is an
aggregator, but cannot silently substitute a sibling model because every seat
uses one `model` slug (no fallback array) and the response identity is gated.

| Substrate                 | Endpoint shape                                                           | Verification source                                                                       | Trust grade |
| ------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ----------- |
| `anthropic-direct`        | `api.anthropic.com/v1/messages`                                          | `provenance.json.final.verification.observed` (Facilitator reads `response.model`)        | High        |
| `ai-studio`               | `generativelanguage.googleapis.com/v1beta/models/<id>:generateContent`   | `provenance.json.final.verification.observed` (Facilitator reads `response.modelVersion`) | High        |
| `foundry-direct`          | `cognitiveservices.azure.com/openai/deployments/<name>/chat/completions` | `provenance.json.final.verification.observed` (Facilitator reads `response.model`)        | High        |
| `openrouter`              | `openrouter.ai/api/v1/chat/completions`                                  | `provenance.json.final.verification.observed` (Facilitator reads `response.model`)        | High        |
| Copilot subagent (legacy) | VS Code `runSubagent` against `council-member-*.agent.md`                | VS Code Cache Explorer or OTLP file logs                                                  | Medium      |

The legacy Copilot-subagent path is documented in
[`model-verification.md`](model-verification.md) § Substrate B for
orchestrators whose cost-tier permits premium-model invocation.
Direct-API is the substrate-of-record.

## Roster configurations

| Roster                       | Members                                   | When to use                                                                                  |
| ---------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Council (5-member)**       | claude + gemini + gpt + kimi + mistral    | **Default** when both `council-member-kimi` and `council-member-mistral` are reachable       |
| **Council (4-member)**       | claude + gemini + gpt + (kimi OR mistral) | Fallback when exactly one of `council-member-kimi` / `council-member-mistral` is unreachable |
| **Trio (3-member)**          | claude + gemini + gpt                     | Fallback when both `council-member-kimi` and `council-member-mistral` are unreachable        |
| **Degenerate (≤ 2 members)** | any 2 or fewer                            | **Not a valid council run** — see § Degenerate cases                                         |

## Reachability check (probe)

At Setup, probe each member using the Council Facilitator itself — a
trivial PONG prompt is the canonical reachability check. This
double-serves: it confirms reachability AND produces the first
verification-gate-eligible `provenance.json` entry.

For each member in the desired roster:

1. Confirm the agent file exists at
   `.claude/agents/council-member-{member}.agent.md`.
2. Confirm `OPENROUTER_API_KEY` is set (the canonical all-member route).
3. Issue a trivial probe via the Facilitator:

   ```bash
   npx tsx tools/council/council-invoke.ts \
     --member <claude|gemini|gpt|kimi|mistral> \
     --provider openrouter \
     --prompt "Reply with exactly the single word PONG and nothing else." \
     --output {output_dir}/_probe/{member}.txt \
     --max-tokens 4096 \
     --max-retries 1
   ```

4. **PASS** — Facilitator exits 0; `provenance.json.final.outcome` is
   `success`; observed model matches declared. Member is reachable.
5. **FAIL** — Any non-zero exit code or non-success outcome. Read the
   provenance to classify (transient / auth / model-mismatch /
   permanent). Degrade the roster per § Degeneration order.

The `_probe/` outputs and provenance files MUST be retained in the run
directory — they ARE the Setup-stage rows of the verification log
(transcribe their `final.verification` into `model-verification-log.md`).

For environments where the Facilitator is unavailable (e.g. CI without
the required env vars), the legacy Foundry curl-probe pattern is
retained in the [model-verification.md](model-verification.md) §
Substrate B section.

## Degeneration order

When a member is unreachable at Setup, degrade in this order:

- 5 → 4: drop `council-member-mistral` first if Mistral-Large-3 is
  unreachable but Kimi K3 is; drop `council-member-kimi` first if
  Kimi is unreachable but Mistral is. (Both share `AZURE_AI_API_KEY`,
  so a missing Foundry env typically takes both at once and the
  roster degenerates straight to 3.)
- 4 → 3: drop whichever Foundry-direct member is the cause; fall back
  to claude + gemini + gpt.
- The anthropic-direct (claude) and ai-studio (gemini) members are
  assumed reachable when their env vars are set; if either probe FAILs
  on auth or permanent provider error, **abort the run** and ask the
  user to fix the env (rotate the key, refresh the AI Studio quota,
  etc.). Do not silently substitute.

**Hard rule:** never silently fill a vacant seat with a second
invocation of a different member — that would put two members on the
same underlying provider and destroy the council's adversarial value.
Degradation always shrinks the roster; it never re-routes a seat.

## Degenerate cases

A council run requires **at least 3 reachable members**. If only 2 or
fewer are reachable:

| Reachable members | Action                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 5                 | Run as 5-member council (default)                                                                                               |
| 4                 | Run as 4-member council (fallback, surface the missing member)                                                                  |
| 3                 | Run as 3-member trio (fallback, surface both missing members)                                                                   |
| 2                 | **Refuse to run.** Surface the issue to the user; suggest single-model analysis + later council review when the roster recovers |
| 1                 | **Refuse to run.** This is single-model analysis — invoke the relevant member subagent directly without the council wrapper     |
| 0                 | **Refuse to run.** Surface the infrastructure issue                                                                             |

The minimum-3 floor exists because peer review and voting both require
each member to read **other** members' work; a 2-member council would
reduce to mutual review, which is structurally different and not what
this skill is designed for.

## Roster invariants

- A member that appears in Step 1 MUST appear in every subsequent step
  (2, 3, 4). You cannot add a member mid-run.
- A member that **fails mid-run** triggers user escalation per the
  SKILL.md hard rules — do not silently drop the member, as that
  changes both the file layout and the voting tally.
- The same member never reviews / votes on its own output. The
  per-member file mapping in [`pipeline.md`](pipeline.md) enforces this
  by construction ("reads every **other** member's …").

## Cross-references

- [`pipeline.md`](pipeline.md) — references the active roster at every
  per-member step
- [`voting-rules.md`](voting-rules.md) — voting matrices differ by
  roster size (3, 4, or 5)
- [`output-conventions.md`](output-conventions.md) — output filenames
  use the member's short name (`claude`, `gemini`, `gpt`, `kimi`,
  `mistral`)
- [`model-verification.md`](model-verification.md) — the per-break
  gate; substrate-mechanism mapping (Copilot vs Foundry-direct) is
  central to the gate's behaviour

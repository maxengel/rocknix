# Model verification log

Per-break gate results. Substrate: OpenRouter via the Council Facilitator
(`tools/council/council-invoke.ts`); each row reads the per-invocation
`*.provenance.json` sibling's `final.verification`. PASS advances; FAIL or
UNVERIFIABLE halts.

| Gate | Seat | Declared | Observed | Result | Outcome | Duration |
| --- | --- | --- | --- | --- | --- | ---: |
| Setup (reachability probe) | claude | `anthropic/claude-fable-5.1 (OpenRouter, effort=xhigh)` | `anthropic/claude-fable-5.1` | **PASS** | success | 4s |
| Setup (reachability probe) | gemini | `google/gemini-3.1-pro-preview (OpenRouter, effort=high)` | `google/gemini-3.1-pro-preview` | **PASS** | success | 2s |
| Setup (reachability probe) | gpt | `openai/gpt-6-astra (OpenRouter, via openai, effort=max)` | `openai/gpt-6-astra` | **PASS** | success | 2s |
| Setup (reachability probe) | kimi | `moonshotai/kimi-k3 (OpenRouter, effort=max)` | `moonshotai/kimi-k3` | **PASS** | success | 1s |
| Setup (reachability probe) | mistral | `mistralai/mistral-large-2512 (OpenRouter primary for Mistral)` | `mistralai/mistral-large-2512` | **PASS** | success | 1s |
| Step 1 (initial analysis) | claude | `anthropic/claude-fable-5.1 (OpenRouter, effort=xhigh)` | `anthropic/claude-fable-5.1` | **PASS** | success | 948s |
| Step 1 (initial analysis) | gemini | `google/gemini-3.1-pro-preview (OpenRouter, effort=high)` | `google/gemini-3.1-pro-preview` | **PASS** | success | 96s |
| Step 1 (initial analysis) | gpt | `openai/gpt-6-astra (OpenRouter, via openai, effort=max)` | `openai/gpt-6-astra` | **PASS** | success | 1038s |
| Step 1 (initial analysis) | kimi | `moonshotai/kimi-k3 (OpenRouter, effort=max)` | `moonshotai/kimi-k3` | **PASS** | success | 565s |
| Step 1 (initial analysis) | mistral | `mistralai/mistral-large-2512 (OpenRouter primary for Mistral)` | `mistralai/mistral-large-2512` | **PASS** | success | 150s |

## Gate verdicts

- **Setup → Step 1: PASS** (5/5 identity verified, zero FAIL/UNVERIFIABLE).
- **Step 1 → Step 2: PASS** (5/5). Step 1 outputs are trusted as Step 2 input.

## Orchestrator notes (not member-visible)

- `council-run-manifest.json` was written at Setup with `provenance_contract:
  council-facilitator@1.0.0`, copied from the schema document's worked example.
  The Facilitator and the anchored genesis both declare **1.2.0**, so the lint
  refused Step 1 until corrected. Corrected after the Step 1 outputs landed and
  recorded in the manifest's `orchestrator_corrections`; the genesis binds the
  roster and verifier-pin hashes, not the manifest bytes, so the anchor stands.
  Orchestrator error, no member or identity implication.
- The `gpt` seat is **GPT-6 Astra** (`openai/gpt-6-astra`), seated 2026-09-05
  replacing GPT-5.6 Sol; probe record in `research/seat-probes/2026-09-05-astra/`.
- Coordination ran on **Claude Opus 5**, the roster's declared coordination tier,
  decorrelated from the Fable 5.1 deliberation seat.
- Step 1 durations ranged 96s (gemini) to 1038s (gpt). Gemini's analysis is the
  shortest by volume (11 KB against 47–76 KB) and was checked for substance
  before advancing: it is dense, not truncated, and raises four distinct
  failure modes. Volume is not a quality gate.

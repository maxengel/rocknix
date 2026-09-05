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

## Orchestrator verification of a disputed code claim (Step 2)

`gemini_peer_review.md` asserts that `gpt-analysis.md` misread
`SaveStateRepository::getNextFreeSlot()` and that it returns `-99` only when all
100,000 slots are full. `claude_peer_review.md` and `mistral_peer_review.md`
both hold that GPT is right. The claim is load-bearing (KEEP BOTH on an
auto-state conflict, which the schema predicts is the commonest kind), so the
orchestrator settled it against the source rather than by majority:

- `SaveStateRepository::refresh()` initialises `int slot = -1` and only
  `matchSlotFile()` assigns a slot; `matchAutoFile()` does not. An auto state is
  therefore stored with `slot == -1`.
- `getNextFreeSlot()` returns `firstslot` only when `states.size() == 0`. A
  repository holding an auto state is not empty, so that branch is skipped.
- The descending scan `for (int i = 99999; i >= 0; --i)` looks for a state whose
  `slot == i`; the auto state's `-1` matches no `i >= 0`.
- Control therefore reaches `return -99`.

**GPT and Claude are correct; Gemini is not.** Recorded here rather than injected
into any member prompt: the Step 3 prompts carry the peer reviews, so the
deliberation is already in a position to correct itself, and the orchestrator
does not put its own findings into members' mouths.

## Gate verdicts, continued

- **Step 2 → Step 3: PASS** (5/5 identity verified).
- **Step 3 → Step 4: PASS** (5/5).
- **Step 4 → r2: PASS** (5/5). Tally 2-2-1 is a genuine tie under
  `voting-rules.md` (5-member roster), so the run recurses per
  `tie-breaking-recursion.md` rather than pausing. The 1-vote outlier
  (`kimi-revised_plan.md`) stays in the candidate set.

## Round-1 vote tally (orchestrator record, not member-visible)

| Voter | Voted for |
| --- | --- |
| claude | `gpt-revised_plan.md` |
| gemini | `gpt-revised_plan.md` |
| gpt | `claude-revised_plan.md` |
| kimi | `claude-revised_plan.md` |
| mistral | `kimi-revised_plan.md` |

`gpt` 2 · `claude` 2 · `kimi` 1 → **2-2-1 tie → recurse to r2.**

The tally is deliberately absent from every r2 prompt. A vote count is an
in-band observation of the run, and SKILL.md § responsibilities item 7 keeps
those out of member prompts; telling the members which two plans led would
bias the round toward them rather than toward the evidence.

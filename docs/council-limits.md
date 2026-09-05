# Council limits audit (2026-09-03)

Owner direction during the founder-goal-alignment run: quality outranks time and token spend, and
the council substrate must not carry limits that reduce quality. This audit lists every limit found
in the substrate and the skill, what it did, and what changed.

## What went wrong

On Step 1 the claude seat (Fable 5.1, effort xhigh) received `max_tokens` 16384, spent all of it on
reasoning, returned no visible content, was retried at 32768 with the same result, then twice hit the
six-minute per-attempt timeout at 65536 while still reasoning. Retries exhausted, no analysis. A
manual re-run with `--max-tokens 131072` and a thirty-minute window succeeded in eleven minutes
(36k reasoning tokens, 18k visible). Nothing about the model was wrong; the defaults were.

## Limits found and disposition

| Limit | Where | Was | Now | Why |
| --- | --- | --- | --- | --- |
| First-attempt output budget, OpenRouter seats | `openRouterRecipe` `defaultMaxTokens` | 16384, doubled per retry | the seat's full ceiling on attempt 1 | Reasoning shares the pool with visible content; a ramp spends attempts and time discovering the ceiling was needed |
| Output ceiling, OpenRouter seats | `openRouterRecipe` `maxTokensCeiling` | 131072 for every seat | per seat: Fable 5.1 128000, GPT-5.6 Sol 128000, Gemini 65536, Kimi K3 262144 | Ceilings now match each model's catalogue maximum (Kimi capped at 4x the others; its catalogue max is 943718) |
| Mistral output budget | `MISTRAL_OPENROUTER_RECIPE` | 8192 default, 32768 ceiling | 131072 both | Model allows 209715; the seat's visible answer was capped far below its peers |
| Per-attempt timeout | Facilitator CLI default | 360 s | 3600 s | Aborted two legitimate attempts mid-reasoning |
| Total timeout | Facilitator CLI default | 30 min | 4 h | Follows from the above with three retries |
| GPT seat effort | `OPENROUTER_SEATS.gpt` | xhigh | **max** | Model supports max; used 10.6k of 128k at xhigh, ample headroom |
| Kimi seat effort | `OPENROUTER_SEATS.kimi` | high | **max** | Model supports max and defaults to it; 6.5k reasoning at high; 262144 budget |
| Claude seat effort | `OPENROUTER_SEATS.claude` | xhigh | xhigh, unchanged | At xhigh it used 54k of a 128k cap that is the model's, not ours; max risks reproducing the zero-content failure with no larger ceiling to buy |
| Gemini seat effort | `OPENROUTER_SEATS.gemini` | high | high, unchanged | The model's ceiling (advertises high/medium/low) |
| Retry count | Facilitator CLI default | 3 | 3, unchanged | Still useful for transient provider errors; with budgets at ceiling the doubling bump is a no-op |
| Temperature | `openRouterRecipe` body | 0.3 | 0.3, unchanged | Deliberately low for analytic work; not a capability limit |
| Parallelism guidance | `pipeline.md` Step 1 | "one at a time (or batches of 2 to 3)" | whole roster in parallel | Five providers, lock-protected ledger; batching only added wall-clock |
| Setup probe budget | `member-roster.md` | `--max-tokens 4096` | unchanged | A one-word reachability probe; not a deliberation call |
| Tie-break recursion cap | `tie-breaking-recursion.md` | r5 | unchanged | A structural signal that the problem is under-specified, not a spend cap; the user decides at the cap |
| Step 4.5 trigger | `voting-rules.md` | offered at margin of 2 or less | unchanged | Opt-in; the orchestrator may offer it on any margin |

## New guard

`scripts/lint-council-seat-efforts.ts` now snapshots each model's `max_completion_tokens` and fails a
seat whose `maxOutputTokens` exceeds it; a seat below its model maximum is reported as a chosen limit
so it stays visible. Run `--refresh` to update the snapshot, `--strict` in pre-flight.

## Orchestrator-side limits (per run, not substrate)

These live in prompts the orchestrator writes and are choices, not defaults:

- Step 1 brief excerpt length (this run: "about forty words or fewer") and Part B reading time
  ("five minutes"). Both shape form, not depth; revisit per commission.
- The canonical Step 2 to 4 templates are one paragraph each and speak of "the technique". The
  builder honors run-local `_prompts/stepN-template.md`; write task-specific templates that keep the
  anti-self-citation constraint and the filename-reference rule.

## Upstream

possibility-space carries the same defaults this audit changed. Reconcile there once this repo has
run a full council on the new settings.

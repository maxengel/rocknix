# Model verification log: 2026-09-30-rasteratops-fork-plan-r2

Per-break gate outcomes, append-only. Substrate: OpenRouter through the Council
Facilitator (council-facilitator@1.14.0), definitive profile. No in-run Setup probes
(#343); reachability from `research/seat-probes/2026-09-30-muse-roster/` and run 1.

### Step 1 · r1 · 2026-09-30T14:38:21Z

| Member | Substrate | Declared model | Observed model | Verification mechanism | Result | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| claude | OpenRouter | anthropic/claude-fable-5.1 (OpenRouter, effort=xhigh) | anthropic/claude-fable-5.1 | Response body `model` field | PASS | effort PASS (29202 reasoning tokens); served by Anthropic; 11.7 min |
| gemini | OpenRouter | google/gemini-3.8-flash (OpenRouter, effort=high) | google/gemini-3.8-flash | Response body `model` field | PASS | effort PASS (13728 reasoning tokens); served by Google AI Studio; 1.9 min |
| gpt    | OpenRouter (OpenAI-pinned) | openai/gpt-6-astra (OpenRouter, via openai, effort=max) | openai/gpt-6-astra | Response body `model` field | PASS | effort PASS (14502 reasoning tokens); served by OpenAI; 12.6 min |
| kimi   | OpenRouter (provider pin) | moonshotai/kimi-k3 (OpenRouter, via modal/sail-research/together/moonshotai, effort=max) | moonshotai/kimi-k3 | Response body `model` field | PASS | effort PASS (53089 reasoning tokens); served by Modal; 11.3 min |
| muse   | OpenRouter (Meta-pinned) | meta/muse-spark-1.3 (OpenRouter, via meta, effort=max) | meta/muse-spark-1.3 | Response body `model` field | PASS | effort PASS (33314 reasoning tokens); served by Meta; 6.2 min |

Gate outcome: **PASS** — all five analyses on their declared models at their declared efforts; advancing to Step 2 after the seal, lint, chain and seals.

### Step 2 · r1 · 2026-09-30T14:48:06Z

| Member | Substrate | Declared model | Observed model | Verification mechanism | Result | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| claude | OpenRouter | anthropic/claude-fable-5.1 (OpenRouter, effort=xhigh) | anthropic/claude-fable-5.1 | Response body `model` field | PASS | effort PASS (13524 reasoning tokens); served by Anthropic; 5.5 min |
| gemini | OpenRouter | google/gemini-3.8-flash (OpenRouter, effort=high) | google/gemini-3.8-flash | Response body `model` field | PASS | effort PASS (3838 reasoning tokens); served by Google AI Studio; 0.7 min |
| gpt    | OpenRouter (OpenAI-pinned) | openai/gpt-6-astra (OpenRouter, via openai, effort=max) | openai/gpt-6-astra | Response body `model` field | PASS | effort PASS (11870 reasoning tokens); served by OpenAI; 8.5 min |
| kimi   | OpenRouter (provider pin) | moonshotai/kimi-k3 (OpenRouter, via modal/sail-research/together/moonshotai, effort=max) | moonshotai/kimi-k3 | Response body `model` field | PASS | effort PASS (27867 reasoning tokens); served by Modal; 6.1 min |
| muse   | OpenRouter (Meta-pinned) | meta/muse-spark-1.3 (OpenRouter, via meta, effort=max) | meta/muse-spark-1.3 | Response body `model` field | PASS | effort PASS (7646 reasoning tokens); served by Meta; 2.2 min |

Gate outcome: **PASS** — all five on their declared models at their declared efforts; advancing to Step 3 after the seal, lint, chain and seals.

### Step 3 · r1 · 2026-09-30T14:55:01Z

| Member | Substrate | Declared model | Observed model | Verification mechanism | Result | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| claude | OpenRouter | anthropic/claude-fable-5.1 (OpenRouter, effort=xhigh) | anthropic/claude-fable-5.1 | Response body `model` field | PASS | effort PASS (7415 reasoning tokens); served by Anthropic; 4.2 min |
| gemini | OpenRouter | google/gemini-3.8-flash (OpenRouter, effort=high) | google/gemini-3.8-flash | Response body `model` field | PASS | effort PASS (6969 reasoning tokens); served by Google AI Studio; 0.9 min |
| gpt    | OpenRouter (OpenAI-pinned) | openai/gpt-6-astra (OpenRouter, via openai, effort=max) | openai/gpt-6-astra | Response body `model` field | PASS | effort PASS (8286 reasoning tokens); served by OpenAI; 5.6 min |
| kimi   | OpenRouter (provider pin) | moonshotai/kimi-k3 (OpenRouter, via modal/sail-research/together/moonshotai, effort=max) | moonshotai/kimi-k3 | Response body `model` field | PASS | effort PASS (12803 reasoning tokens); served by Modal; 3.3 min |
| muse   | OpenRouter (Meta-pinned) | meta/muse-spark-1.3 (OpenRouter, via meta, effort=max) | meta/muse-spark-1.3 | Response body `model` field | PASS | effort PASS (11055 reasoning tokens); served by Meta; 2.1 min |

Gate outcome: **PASS** — all five on their declared models at their declared efforts; advancing to Step 4 after the seal, lint, chain and seals.

### Step 4 · r1 · 2026-09-30T14:59:21Z

| Member | Substrate | Declared model | Observed model | Verification mechanism | Result | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| claude | OpenRouter | anthropic/claude-fable-5.1 (OpenRouter, effort=xhigh) | anthropic/claude-fable-5.1 | Response body `model` field | PASS | effort PASS (8783 reasoning tokens); served by Anthropic; 2.7 min |
| gemini | OpenRouter | google/gemini-3.8-flash (OpenRouter, effort=high) | google/gemini-3.8-flash | Response body `model` field | PASS | effort PASS (4384 reasoning tokens); served by Google AI Studio; 0.5 min |
| gpt    | OpenRouter (OpenAI-pinned) | openai/gpt-6-astra (OpenRouter, via openai, effort=max) | openai/gpt-6-astra | Response body `model` field | PASS | effort PASS (5572 reasoning tokens); served by OpenAI; 3.1 min |
| kimi   | OpenRouter (provider pin) | moonshotai/kimi-k3 (OpenRouter, via modal/sail-research/together/moonshotai, effort=max) | moonshotai/kimi-k3 | Response body `model` field | PASS | effort PASS (5361 reasoning tokens); served by Modal; 1.1 min |
| muse   | OpenRouter (Meta-pinned) | meta/muse-spark-1.3 (OpenRouter, via meta, effort=max) | meta/muse-spark-1.3 | Response body `model` field | PASS | effort PASS (17245 reasoning tokens); served by Meta; 2.6 min |

Gate outcome: **PASS** — all five ballots on their declared models at their declared efforts; the round is tallied after the seal, lint, chain and seals.

# Model verification log: 2026-09-30-rasteratops-fork-plan

Per-break gate outcomes, append-only. Substrate: OpenRouter through the Council
Facilitator (council-facilitator@1.14.0), definitive profile.

### Setup · PONG probes · 2026-09-30T14:18:07Z

| Member | Substrate | Declared model | Observed model | Verification mechanism | Result | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| claude | OpenRouter | anthropic/claude-fable-5.1 (OpenRouter, effort=xhigh) | anthropic/claude-fable-5.1 | Response body `model` field | PASS | served by Anthropic; FAIL effort |
| gemini | OpenRouter | google/gemini-3.8-flash (OpenRouter, effort=high) | google/gemini-3.8-flash | Response body `model` field | PASS | served by Google AI Studio; PASS effort |
| gpt    | OpenRouter (OpenAI-pinned) | openai/gpt-6-astra (OpenRouter, via openai, effort=max) | openai/gpt-6-astra | Response body `model` field | PASS | served by OpenAI; PASS effort |
| kimi   | OpenRouter (provider pin) | moonshotai/kimi-k3 (OpenRouter, via modal/sail-research/together/moonshotai, effort=max) | moonshotai/kimi-k3 | Response body `model` field | PASS | served by Modal; PASS effort |
| muse   | OpenRouter (Meta-pinned) | meta/muse-spark-1.3 (OpenRouter, via meta, effort=max) | meta/muse-spark-1.3 | Response body `model` field | PASS | served by Meta; PASS effort |

Gate outcome: **PASS** — all five seats reachable on their declared models; advancing to Step 1.

### Step 1 · r1 · 2026-09-30T14:23:06Z

| Member | Substrate | Declared model | Observed model | Verification mechanism | Result | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| claude | OpenRouter | anthropic/claude-fable-5.1 (OpenRouter, effort=xhigh) | anthropic/claude-fable-5.1 | Response body `model` field | PASS | effort PASS (23214 reasoning tokens); served by Anthropic; 9.5 min |
| gemini | OpenRouter | google/gemini-3.8-flash (OpenRouter, effort=high) | google/gemini-3.8-flash | Response body `model` field | PASS | effort PASS (11296 reasoning tokens); served by Google AI Studio; 1.9 min |
| gpt    | OpenRouter (OpenAI-pinned) | openai/gpt-6-astra (OpenRouter, via openai, effort=max) | openai/gpt-6-astra | Response body `model` field | PASS | effort PASS (19990 reasoning tokens); served by OpenAI; 17.4 min |
| kimi   | OpenRouter (provider pin) | moonshotai/kimi-k3 (OpenRouter, via modal/sail-research/together/moonshotai, effort=max) | moonshotai/kimi-k3 | Response body `model` field | PASS | effort PASS (46418 reasoning tokens); served by Modal; 11.3 min |
| muse   | OpenRouter (Meta-pinned) | meta/muse-spark-1.3 (OpenRouter, via meta, effort=max) | meta/muse-spark-1.3 | Response body `model` field | PASS | effort PASS (31968 reasoning tokens); served by Meta; 4.9 min |

Gate outcome: **PASS** — all five analyses on their declared models at their declared efforts; seal, lint, chain and seals verified; advancing to Step 2.

# Seat probe: the definitive roster after the 2026-09-30 toolchain import

Scaffold's council toolchain 7be6721b (council-facilitator@1.14.0), landed in the fork the same day (D-WORKFLOW-088). Every seat of the definitive profile probed through the Facilitator on the OpenRouter route with `reasoning-prompt.md` (a seating puzzle with no valid solution: five equally spaced seats have no opposite pair). All five answered 0 with the right reason.

| Seat | Served model | Identity | Effort declared | Effort | Reasoning tokens | Served provider | Provider gate | Seconds | Tier |
| --- | --- | --- | --- | --- | ---: | --- | --- | ---: | --- |
| claude | anthropic/claude-fable-5.1 | PASS | xhigh | PASS | 577 | Anthropic | NOT_PINNED | 16.5 | local_capture_provider_attested |
| gemini | google/gemini-3.8-flash | PASS | high | PASS | 4371 | Google AI Studio | NOT_PINNED | 22.6 | local_capture_provider_attested |
| gpt | openai/gpt-6-astra | PASS | max | PASS | 516 | OpenAI | PASS | 15.6 | local_capture_provider_attested |
| kimi | moonshotai/kimi-k3 | PASS | max | PASS | 5003 | Modal | PASS | 64.8 | local_capture_provider_attested |
| muse | meta/muse-spark-1.3 | PASS | max | PASS | 2176 | Meta | PASS | 22.4 | local_capture_provider_attested |

Each seat's `*.txt.provenance.json` is the evidence; `*.invoke.log` is the Facilitator's stderr. Outputs written outside a run directory are unbound diagnostics, never council evidence.

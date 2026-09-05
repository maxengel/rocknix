# Seat probes: first verification on serval (2026-09-05)

Every seat probed through the Facilitator (`tools/council/run invoke`, the
OpenRouter route on the single council key) right after the import (#70).
Each `*.txt` has its `.provenance.json` sibling; these ran outside any council
run, so they appear in no ledger.

| Seat | Served model (response body) | Identity | Note |
| --- | --- | --- | --- |
| claude | `anthropic/claude-fable-5.1` | PASS | "ok" |
| gemini | `google/gemini-3.1-pro-preview` | PASS | "ok" |
| gpt | `openai/gpt-5.6-sol` | PASS | "ok" |
| kimi | `moonshotai/kimi-k3` | PASS | second attempt; see below |
| mistral | `mistralai/mistral-large-2512` | PASS | "ok" |

**Kimi's first attempt was UNVERIFIABLE, and that was the probe's fault.** The
first pass used `--max-tokens 64 --no-retry`; Kimi K3 runs at effort `max`
and spends reasoning tokens before any content, so a 64-token cap returned
an empty envelope the Facilitator rightly classed `retries_exhausted_transient`
/ UNVERIFIABLE (`kimi-attempt1-64-token-cap.txt.provenance.json`, kept as the
record). The roster's canonical probe (`--max-tokens 4096 --max-retries 1`)
answered PONG in 901 ms with 28 reasoning tokens. Do not probe a reasoning
seat with a tiny output cap.

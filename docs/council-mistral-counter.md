# Offline Mistral request measurement

`scripts/council-count-mistral.mjs` measures the publisher's local chat encoding
of an exact Mistral request. Every successful result remains `verified: false`,
with `input_tokens_upper_bound: null` and `extra_overhead_tokens: null`.
`measured_input_tokens` is useful evidence, but OpenRouter/provider transformations
and their upper bound are unresolved. The source-preparation assessor therefore
refuses this counter with `budget_unverified`, including in a mixed cohort.

## Install the dependencies explicitly

Use Node 24 and Python 3.12. Installation needs access to the Python package index
and the public publisher artifact; counting uses only the installed local files.
No provider API key is required. From the repository root:

```sh
COUNTER_HOME="${XDG_CACHE_HOME:-$HOME/.cache}/council-mistral-1.11.7"
python3.12 -m venv "$COUNTER_HOME/venv"
"$COUNTER_HOME/venv/bin/python" -m pip install \
  -r scripts/lib/council-mistral-requirements.txt
"$COUNTER_HOME/venv/bin/python" -m pip check
node scripts/setup-council-mistral-tokenizer.mjs \
  --destination "$COUNTER_HOME/tekken.json"
export COUNCIL_MISTRAL_PYTHON="$COUNTER_HOME/venv/bin/python"
export COUNCIL_MISTRAL_TOKENIZER_PATH="$COUNTER_HOME/tekken.json"
```

Both environment references must be absolute paths. The Python environment must
include the **base dependencies** of `mistral-common==1.11.7`; do not install with
`--no-deps`. The requirements retain the Python 3.12-compatible NumPy constraint
`numpy<2.4`; a freeze from a Python 3.14 environment is not a Python 3.12 lockfile.
Transitive package versions are resolved by pip for the selected interpreter.
`pip check` validates that installed closure; these requirements do not claim a
cross-platform, hash-locked transitive environment.

The setup helper downloads only the fixed [publisher artifact][tokenizer]. It
requires exactly 16,753,777 bytes and SHA-256
`e29d19ea32eb7e26e6c0572d57cb7f9eca0f4420e0e0fe6ae1cf3be94da1c0d6`.
Its download is capped at that byte length and 120 seconds. A matching existing
file is reused without a network call; an incompatible existing file fails without
being overwritten. If setup is interrupted while creating its new file, the next
setup attempt refuses that incomplete artifact. Inspect and remove only that
failed setup artifact, then rerun explicit setup. Keep the basename `tekken.json`:
the publisher loader uses it
to select the tokenizer. The counter separately verifies its runtime artifact and
uses an owned snapshot before the library opens it.

## Count the exact request

```sh
node scripts/council-count-mistral.mjs --request /absolute/path/request.json
```

Supply the exact UTF-8 JSON provider body, not a prompt extracted from it. The
request SHA-256 binds the measurement to those bytes. The supported recipe is
OpenRouter `mistralai/mistral-large-2512`, with text-only user or system/user
messages, temperature `0.3`, and the full `max_tokens: 131072` output reservation.
The adapter also admits the canonical optional SSE fields. Unknown fields, tools,
multimodal content, unsupported roles/models/routes, duplicate JSON keys and
invalid Unicode fail. An explicitly transmitted empty system message remains
part of the measured request. Truncation is disabled.

Successful stdout is one JSON measurement containing the observed input count,
exact request digest and local worker/package/tokenizer provenance. It contains
no request text. Invalid input, a missing or changed dependency, worker failure
or a processing limit produces a failure instead of an estimated count. The
bounded worker receives the request through stdin with a restricted environment;
it does not need inherited provider credentials.

The CLI accepts at most 32 MiB of request bytes. The adapter limits worker stdout
and stderr to 32 KiB each and defaults to a 120-second timeout. A programmatic
caller may lower the input limit or select a timeout from 1 to 300,000 ms; it
cannot raise the request-byte ceiling. The worker independently enforces its
request bound and verifies the tokenizer before measuring.

| Outcome | Machine-readable signal | Meaning |
| --- | --- | --- |
| Local measurement | Exit 0; stdout JSON schema `council-mistral-count-v1`, `verified: false`, reason `provider_overhead_unverified` | Exact local count available; provider budget unresolved |
| CLI or adapter refusal | Exit 1; stderr `budget_unverified: <reason>` | Input, configuration or worker validation failed; no count emitted |
| Preparation refusal | `budget_unverified` from the existing assessor | An unverified counter cannot make a preparation plan ready |

Adapter reasons distinguish unconfigured dependencies, unsupported request/seat
shape, request binding, worker availability, timeout, output limits and witness
mismatch. The adapter preserves allowlisted, content-free dependency/tokenizer
refusal codes; arbitrary worker stderr becomes `worker_failed` without copying
its text. The successful witness records the actual installed dependency versions
for later comparison.

The entry also exports `counter` for the existing explicit `--counter-module`
boundary:

```sh
COUNTER_SHA256="$(node --input-type=module -e \
  'import { createHash } from "node:crypto"; import { readFileSync } from "node:fs"; process.stdout.write(createHash("sha256").update(readFileSync("scripts/council-count-mistral.mjs")).digest("hex"))')"
npm exec --yes --package=tsx@4.22.4 -- tsx scripts/council-stage-sources.mjs prepare \
  --spec preparation-spec.json \
  --counter-module scripts/council-count-mistral.mjs \
  --counter-sha256 "$COUNTER_SHA256"
```

This preparation command is expected to refuse with `budget_unverified`. An
assumption string cannot promote the local measurement to a verified budget.
The selected entry hash also does not replace review of the Python worker,
installed dependency closure and tokenizer artifact. See the [preparation
boundary](council-staged-sources.md#counter-and-request-boundary).

## Verification

After explicit setup, run the counter's real-tokenizer tests:

```sh
npm exec --yes --package=tsx@4.22.4 -- tsx \
  --test --test-isolation=none scripts/__tests__/council-mistral-counter.test.ts
```

The `council-preparation-safety` PR job creates a Python 3.12 virtual environment,
installs the declared base dependency closure, verifies the pinned artifact, and
runs this suite as its own explicit invocation. Missing dependencies fail; tests
must not skip, cancel or report TODO. The independent suite floor prevents other
preparation tests from hiding an absent counter suite. CI downloads public setup
dependencies, uses read-only repository permission, and makes no provider calls.

Provider overhead certification, the other model counters, durable attempts and
receipts, and the controlled council trial remain under #577. A successful offline
measurement does not dispatch a council member or establish model fit.

[tokenizer]: https://huggingface.co/mistralai/Mistral-Large-3-675B-Instruct-2512/blob/383ffea2c7d60dfd44ca960e8e691709d4fdb9cd/tekken.json

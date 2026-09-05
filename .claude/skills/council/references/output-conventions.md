# Output conventions

All council artifacts land under a single dated topic directory. The
layout makes the deliberation trail auditable — every claim in every
artifact can be traced back to the inputs that produced it.

## Output directory

```
research/council-runs/YYYY-MM-DD-{topic}/
```

- `YYYY-MM-DD` — UTC date of council run start (the `mcp_time_get_current_time`
  result at Setup; do not rely on local date)
- `{topic}` — kebab-case short slug for the deliberation topic (≤ 6
  words). Derive from the problem statement; surface the chosen slug
  to the user at Setup so they can override

If multiple council runs happen on the same date for the same topic,
append a `-r{N}` suffix to the slug:
`2026-05-18-federation-substrate-r2/`. (Note: this is **distinct** from
the in-run round suffix used by [`tie-breaking-recursion.md`](tie-breaking-recursion.md).)

**Historical note:** Runs created before 2026-05-22 live under
`research/trio-runs/`. That directory is retained as-shipped for
provenance; new runs go under `research/council-runs/`. Do NOT migrate
historical runs — the names they recorded were the names at the time.

## Top-level layout (5-member roster)

```
research/council-runs/2026-05-22-model-identity-verification-technique/
├── README.md                              # one-paragraph context + roster + outcome
├── model-verification-log.md              # per-break gate results across all steps
├── run-summary.json                       # token + duration roll-up from provenance
├── run-summary.md                         # human-readable token + duration roll-up
├── ledger.jsonl                           # H2 provenance hash chain, non-legacy runs
├── verification/
│   ├── genesis.json                       # H2 externally anchored genesis manifest
│   ├── seal-key.local                     # local HMAC key, never committed to anchor branch
│   └── seals/
│       ├── step1.seal.json
│       ├── step2.seal.json
│       ├── step3.seal.json
│       └── step4.seal.json
├── claude-analysis.md                     # Step 1 outputs (one per member)
├── claude-analysis.md.provenance.json
├── gemini-analysis.md
├── gemini-analysis.md.provenance.json
├── gpt-analysis.md
├── gpt-analysis.md.provenance.json
├── kimi-analysis.md                       # 4-member roster and up
├── kimi-analysis.md.provenance.json
├── mistral-analysis.md                    # 5-member roster only
├── mistral-analysis.md.provenance.json
├── peer_reviews/
│   ├── claude_peer_review.md              # Step 2 outputs
│   ├── gemini_peer_review.md
│   ├── gpt_peer_review.md
│   ├── kimi_peer_review.md
│   └── mistral_peer_review.md
├── revised_approaches/
│   ├── claude-revised_plan.md             # Step 3 outputs
│   ├── gemini-revised_plan.md
│   ├── gpt-revised_plan.md
│   ├── kimi-revised_plan.md
│   ├── mistral-revised_plan.md
│   └── consensus_plan.md                  # Step 4.5 output, opt-in only
└── peer_votes/
    ├── claude_vote.md                     # Step 4 outputs
    ├── gemini_vote.md
    ├── gpt_vote.md
    ├── kimi_vote.md
    └── mistral_vote.md
```

Recursion rounds add `-r{N}` suffixed files in the relevant
subdirectory per [`tie-breaking-recursion.md`](tie-breaking-recursion.md).

## Run manifest

Every new council run writes `council-run-manifest.json` at Setup, before
Step 1 member invocation begins. The manifest is the inventory authority
for completeness checks: the lint does not guess the active roster or infer
which artifacts should exist from directory contents alone.

Schema:

```json
{
  "schema_version": "council-run-manifest@1.0.0",
  "run_id": "2026-05-22-model-identity-verification-technique",
  "created_at": "2026-05-22T15:42:18Z",
  "topic": "model-identity-verification-technique",
  "roster": ["claude", "gemini", "gpt", "kimi", "mistral"],
  "provenance_contract": "council-facilitator@1.0.0",
  "expected_outputs_per_step": {
    "step1": [
      {
        "path": "claude-analysis.md",
        "member": "claude",
        "kind": "initial-analysis"
      }
    ],
    "step2": [
      {
        "path": "peer_reviews/gemini_peer_review.md",
        "member": "gemini",
        "kind": "peer-review"
      }
    ],
    "step3": [
      {
        "path": "revised_approaches/gpt-revised_plan.md",
        "member": "gpt",
        "kind": "revised-plan"
      }
    ],
    "step4": [
      {
        "path": "peer_votes/kimi_vote.md",
        "member": "kimi",
        "kind": "peer-vote"
      }
    ],
    "step4_5": [
      {
        "path": "revised_approaches/consensus_plan.md",
        "member": "claude",
        "kind": "consensus-integration"
      }
    ]
  }
}
```

Rules:

- `run_id` matches the output directory basename.
- `created_at` is the UTC timestamp captured at Setup.
- `roster` uses member short names only: `claude`, `gemini`, `gpt`,
  `kimi`, `mistral`.
- `provenance_contract` declares the provenance shape the run expects.
  New runs use `council-facilitator@1.0.0`, which requires
  `facilitator_version` and `final.file_artifact_sha256`. Historical
  runs may use a `legacy-*` value when they predate those fields; the
  manifest documents that compatibility boundary explicitly.
- Every `path` is relative to the run directory and resolves inside it.
- Every declared output path implies a required provenance sibling at
  `<path>.provenance.json` (for example, `claude-analysis.md` implies
  `claude-analysis.md.provenance.json`).
- Step 1 emits one output per roster member.
- Step 2 emits one peer review per roster member, excluding self only in
  the prompt inputs; each member still writes exactly one peer-review
  artifact.
- Step 3 emits one revised plan per roster member.
- Step 4 emits one vote per roster member.
- Step 4.5 is optional. When used, it emits exactly one
  `revised_approaches/consensus_plan.md` output from the winning author
  or designated synthesizer, with a provenance sibling.
- Recursion rounds append `-r{N}` to the relevant `path` values and add
  those outputs to the same step key.

## Filename rules

| Artifact                  | Filename                                                         |
| ------------------------- | ---------------------------------------------------------------- |
| Initial analysis          | `{member-short}-analysis.md`                                     |
| Provenance sibling        | `{member-short}-analysis.md.provenance.json`                     |
| Peer review               | `peer_reviews/{member-short}_peer_review.md`                     |
| Revised plan              | `revised_approaches/{member-short}-revised_plan.md`              |
| Vote                      | `peer_votes/{member-short}_vote.md`                              |
| Consensus integration     | `revised_approaches/consensus_plan.md`                           |
| Recursion-round artifacts | append `-r{N}` before the `.md` extension                        |
| Final issue body draft    | `final-issue-draft.md` (Step 5 output)                           |
| User tie-break decision   | `peer_votes/user-decision-r{N}.md` (only when max-round cap hit) |
| Model verification log    | `model-verification-log.md` (per-break gate results)             |

Member short names: `claude`, `gemini`, `gpt`, `kimi`, `mistral`. Use
lowercase; do not include version suffixes (`claude-4`, `kimi-26`,
`mistral-3`) in filenames — version provenance lives in the
`.provenance.json` sibling.

The hyphen-vs-underscore split is intentional and matches the legacy
`trio-council` agent: `{member}-analysis.md` uses a hyphen (parallel
to `{member}-revised_plan.md`); peer reviews and votes use underscores
(`{member}_peer_review.md`, `{member}_vote.md`). Do NOT normalize —
several downstream tools key off these exact names.

## Provenance sibling

Every declared member output MUST have a sibling at
`<output>.provenance.json`. The Council Facilitator writes the sibling,
not the member model and not the orchestrator by hand. Current-contract
schema:

```json
{
  "facilitator_version": "council-facilitator@1.0.0",
  "member": "claude",
  "declared_model": "anthropic/claude-fable-5 (OpenRouter, effort=max)",
  "substrate": "openrouter",
  "endpoint": "https://openrouter.ai/api/v1/chat/completions",
  "request": {
    "started_at": "2026-05-22T15:42:18Z",
    "system_prompt_sha256": "sha256-or-null",
    "user_prompt_sha256": "sha256"
  },
  "attempts": [
    {
      "attempt": 1,
      "started_at": "2026-05-22T15:42:18Z",
      "duration_ms": 1200,
      "max_tokens": 8192,
      "http_status": 200,
      "outcome": "success",
      "outcome_reason": "success",
      "model_field": "anthropic/claude-5-fable-20260609",
      "content_length": 12345,
      "content_sha256": "sha256",
      "usage": {
        "input_tokens": 1000,
        "output_tokens": 2000
      },
      "tokens": {
        "prompt": 1000,
        "completion": 2000,
        "total": 3000
      }
    }
  ],
  "final": {
    "outcome": "success",
    "total_duration_ms": 1200,
    "retries_used": 0,
    "file_artifact_sha256": "sha256",
    "usage": {
      "input_tokens": 1000,
      "output_tokens": 2000
    },
    "tokens": {
      "prompt": 1000,
      "completion": 2000,
      "total": 3000
    },
    "verification": {
      "result": "PASS",
      "match_kind": "semantic",
      "declared": "anthropic/claude-fable-5 (OpenRouter, effort=max)",
      "observed": "anthropic/claude-5-fable-20260609"
    }
  }
}
```

Rules:

- `attempts[].content_sha256` is the hash of the assistant content
  extracted from the provider response.
- `final.file_artifact_sha256` is the hash of the Markdown file after
  the Facilitator writes it to disk; this is what the completeness lint
  re-validates before downstream steps consume the output.
- `usage` is copied from the provider when present. OpenAI-compatible
  providers usually return `usage`; Google AI Studio returns
  `usageMetadata`; the Facilitator records either shape without
  normalizing provider-specific field names.
- `tokens` is the Facilitator-normalized token shape:
  `prompt`, `completion`, and `total`. If a provider response lacks
  usable usage metadata, the Facilitator records `tokens: null` and
  `usage_unavailable: "usage_absent"` or `"usage_unrecognized"` on
  the attempt. Successful final provenance carries the same explicit
  marker when applicable.
- Historical runs may declare a `legacy-*` `provenance_contract` in the
  manifest. The completeness lint still enforces output and provenance
  presence plus the Facilitator core shape, but it does not require
  `facilitator_version` or `final.file_artifact_sha256` for those
  historical artifacts.

## Ledger and step seals

Non-legacy council runs produce a top-level `ledger.jsonl`. Each line is
canonical JSON for one Facilitator provenance verdict, in append order.
Each verdict records `prev_verdict_sha256`, forming the tamper-evidence
chain verified by `scripts/verify-chain.ts`.

At each step boundary, the orchestrator writes
`verification/seals/{step}.seal.json` via `scripts/write-step-seal.ts`:

```json
{
  "step_n": "step1",
  "chain_terminal_sha256": "sha256-of-terminal-verdict",
  "verdict_count": 5,
  "expected_verdict_count": 5,
  "min_assurance_tier": "local_capture_provider_attested",
  "min_assurance_tier_across_seats": "local_capture_provider_attested",
  "signature": "hmac-sha256:..."
}
```

Rules:

- `chain_terminal_sha256` is the canonical hash of the last verdict
  included at the step boundary.
- `verdict_count` and `expected_verdict_count` are derived from
  `council-run-manifest.json` and must match.
- `min_assurance_tier` and `min_assurance_tier_across_seats` are the
  minimum `final.assurance_tier` value among all verdicts sealed through
  that step.
- `signature` is an HMAC over the canonical seal payload, using
  `COUNCIL_SEAL_HMAC_KEY` or `verification/seal-key.local`.
- `scripts/verify-seals.ts --strict {run_dir}` verifies seal terminal
  hashes, verdict counts, and signatures. This catches truncation of the
  final verdict that a hash chain alone cannot detect.

## Model verification log

Every council run produces a top-level `model-verification-log.md`
recording the per-break gate outcomes defined in
[`model-verification.md`](model-verification.md). The orchestrator
appends one section per gate invocation (Step 1, 2, 3, 4, plus each
tie-break recursion round); the file grows over the lifetime of the
run.

Schema for each section:

```markdown
### Step {N} · r{R} · {ISO-8601 UTC timestamp}

| Member  | Substrate                 | Declared model                                           | Observed model                    | Verification mechanism      | Result | Notes |
| ------- | ------------------------- | -------------------------------------------------------- | --------------------------------- | --------------------------- | ------ | ----- |
| claude  | OpenRouter                | anthropic/claude-fable-5 (OpenRouter, effort=max)        | anthropic/claude-5-fable-20260609 | Response body `model` field | PASS   | —     |
| gemini  | OpenRouter                | google/gemini-3.1-pro-preview (OpenRouter, effort=xhigh) | google/gemini-3.1-pro-preview     | Response body `model` field | PASS   | —     |
| gpt     | OpenRouter (Azure-pinned) | openai/gpt-5.6-sol (OpenRouter via Azure, effort=max)    | openai/gpt-5.6-sol-20260709       | Response body `model` field | PASS   | —     |
| kimi    | OpenRouter                | moonshotai/kimi-k2.6 (OpenRouter, effort=xhigh)          | moonshotai/kimi-k2.6              | Response body `model` field | PASS   | —     |
| mistral | OpenRouter                | mistralai/mistral-large-2512 (OpenRouter)                | mistralai/mistral-large-2512      | Response body `model` field | PASS   | —     |

Gate outcome: **PASS** — advancing to Step {N+1}.
```

Field rules:

- **Step** — numeric pipeline step (1–4); recursion rounds keep the
  same step number and increment `r`.
- **r** — recursion round (`r1` for the initial pass through Steps
  2–4; `r2`, `r3`, … for tie-break rounds).
- **Timestamp** — the `mcp_time_get_current_time` result at gate
  evaluation, in UTC, ISO-8601 (`2026-05-22T15:42:18Z`).
- **Substrate** — `OpenRouter` (default; `OpenRouter (Azure-pinned)` for the gpt seat), or the direct-API fallbacks `anthropic-direct`, `ai-studio`, `foundry-direct`. The substrate
  determines which verification mechanism applies.
- **Declared model** — first element of the member agent file's
  `model:` array (read at gate time, not at run start, to catch
  intra-run agent-file edits).
- **Observed model** — the model identity actually served. For Copilot
  subagents this is the model name from Cache Explorer or OTLP logs.
  For OpenRouter and Foundry-direct members this is the `model` field of
  the chat-completions response body (provider-attested ground truth).
- **Verification mechanism** — the specific source the orchestrator
  used (e.g. `Cache Explorer turn N`, `OTLP log file: <path>:<line>`,
  `Response body \`model\` field`).
- **Result** — `PASS` (declared model and observed model match
  semantically — e.g. `"anthropic/claude-fable-5 (OpenRouter, effort=max)"` matches a response-body `model: "anthropic/claude-5-fable-20260609"`; `"openai/gpt-5.6-sol (OpenRouter via Azure, effort=max)"`
  matches a response body `model: "openai/gpt-5.6-sol-20260709"`), `FAIL`
  (declared and observed mismatch), or `UNVERIFIABLE` (the
  verification mechanism is unavailable in this session).
- **Notes** — free text. Required on FAIL and UNVERIFIABLE; optional
  on PASS (use `—` when empty).
- **Gate outcome** — explicit single-line conclusion: `**PASS** —
advancing to Step N+1` / `**FAIL** — halting; see Notes` /
  `**UNVERIFIABLE** — awaiting user decision`.

The verification log is **append-only**. Never edit a prior section
to change its outcome — the chain of trust depends on the log
reflecting what the orchestrator actually observed at each break.

## Run summary

The output directory's top-level `run-summary.json` and
`run-summary.md` are written at close-out by
`scripts/council-run-summary.ts --run-dir <run-dir>`. The summary walks
the manifest-declared outputs and their provenance siblings, aggregates
per-step / per-member / per-attempt token counts, and derives
`tokens_per_second` from `tokens.total / duration_ms`.

Rules:

- `run-summary.json` uses `schema_version:
council-run-summary@1.0.0`.
- `tokens.{prompt,completion,total}` is the normalized token shape.
  Raw provider usage remains in each provenance sibling under `usage`.
- Missing or unrecognized provider usage is recorded as
  `usage_unavailable` with a reason (`usage_absent`,
  `usage_unrecognized`, `provenance_missing`, or
  `attempts_missing_or_unreadable`). It is never represented as `0`.
- Historical runs may still produce useful summaries from raw `usage`
  payloads even when they predate `attempts[].tokens` and
  `final.tokens`.

## README.md

The output directory's top-level `README.md` is written **at the end of
the council run**, summarizing:

- Problem context (one paragraph)
- Active roster (3 vs 4) and reachability evidence
- Round-by-round summary (r1, r2, r3, …) with vote tallies
- **Model verification summary** — link to `model-verification-log.md`;
  total gate count; count of PASS / FAIL / UNVERIFIABLE outcomes;
  prose summary of any FAIL or UNVERIFIABLE breaks and how they were
  recovered
- **Run summary** — link to `run-summary.md` and note total tokens,
  total wall-clock attempt duration, and any `usage_unavailable` rows
- Final winning plan + link to its `revised_approaches/*-revised_plan.md`
  (or `revised_approaches/*-revised_plan-r{N}.md`)
- Link to the GitHub issue created in Step 5
- Any user decisions (plurality acceptance, tie-break)

The README is the canonical entry point for anyone returning to the
council run later. It is NOT the output of any single member — the
orchestrator writes it.

## Cross-references

- [`pipeline.md`](pipeline.md) — defines per-step file emission
- [`tie-breaking-recursion.md`](tie-breaking-recursion.md) — defines
  the `-r{N}` suffix rules
- [`context-loading.md`](context-loading.md) — defines what gets
  recorded in `context_loaded[]` in the provenance sibling
- [`member-roster.md`](member-roster.md) — defines the member-short
  names used in filenames
- [`model-verification.md`](model-verification.md) — defines the
  per-break gate procedure that populates the model-verification log

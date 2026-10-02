# Output conventions

All council artifacts land under a single dated topic directory. The
layout makes the deliberation trail auditable — every claim in every
artifact can be traced back to the inputs that produced it.

## Output directory

```
research/council-runs/YYYY-MM-DD-{topic}/
```

- `YYYY-MM-DD` — UTC date of council run start from a checked clock
  (`date -u` or a time tool). MCP availability is not a prerequisite.
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
│   ├── anchor-receipt.json                # remote readback, or explicit local-only setup
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
├── kimi-analysis.md                       # required member
├── kimi-analysis.md.provenance.json
├── muse-analysis.md                       # required member (the fifth seat since scaffold#915)
├── muse-analysis.md.provenance.json
├── peer_reviews/
│   ├── claude_peer_review.md              # Step 2 outputs
│   ├── gemini_peer_review.md
│   ├── gpt_peer_review.md
│   ├── kimi_peer_review.md
│   └── muse_peer_review.md
├── revised_approaches/
│   ├── claude-revised_plan.md             # Step 3 outputs
│   ├── gemini-revised_plan.md
│   ├── gpt-revised_plan.md
│   ├── kimi-revised_plan.md
│   ├── muse-revised_plan.md
│   └── consensus_plan.md                  # Step 4.5 output, opt-in only
└── peer_votes/
    ├── claude_vote.md                     # Step 4 outputs
    ├── gemini_vote.md
    ├── gpt_vote.md
    ├── kimi_vote.md
    └── muse_vote.md
```

Recursion rounds add `-r{N}` suffixed files in the relevant
subdirectory per [`tie-breaking-recursion.md`](tie-breaking-recursion.md).

## Run manifest

Every new council run writes `council-run-manifest.json` at Setup, before
Step 1 member invocation begins. The manifest is the inventory authority
for completeness checks: the lint does not guess the active roster or infer
which artifacts should exist from directory contents alone.

Generate the complete initial inventory and recipe identity from the installed
helpers (Node 24, repository root), then save the printed JSON as the manifest.
Replace the run ID/topic and coordinator preference with this run's facts; do
not replace an existing anchored manifest. No model slug or digest is copied
from this document:

```bash
node --input-type=module <<'JS'
import { FACILITATOR_VERSION } from "./scripts/council-invoke.ts";
import { MEMBER_IDS, rosterIdentity } from "./scripts/lib/council-roster.ts";
const runId = "YYYY-MM-DD-topic";
const rows = [
  ["step1", "", "-analysis", "initial-analysis"],
  ["step2", "peer_reviews/", "_peer_review", "peer-review"],
  ["step3", "revised_approaches/", "-revised_plan", "revised-plan"],
  ["step4", "peer_votes/", "_vote", "peer-vote"],
];
console.log(JSON.stringify({
  schema_version: "council-run-manifest@1.0.0",
  run_id: runId, created_at: new Date().toISOString(), topic: "Replace with the question",
  roster: MEMBER_IDS, provenance_contract: FACILITATOR_VERSION,
  roster_contract: rosterIdentity(),
  coordinator: { harness: "codex", requested_model: "your-coordinator-preference",
    observed_model: null, observation: "unverified", voting: false },
  expected_outputs_per_step: Object.fromEntries(rows.map(([step, dir, suffix, kind]) =>
    [step, MEMBER_IDS.map(member => ({ member, kind, path: `${dir}${member}${suffix}.md` }))])),
}, null, 2));
JS
```

Rules:

- `run_id` matches the output directory basename for a standalone council.
  A nested research Phase 4 run uses `<research-run>/phase-4-deliberation`
  (or its `phase-4-deliberation-r<N>-<NNN>` replay name). Its genesis,
  ledger and seals retain the same five-member requirements. Default lint
  scans disclose pre-1.10.0 research runs they exclude; an explicit path
  still runs verification and never implies a current-contract upgrade.
- `created_at` is the UTC timestamp captured at Setup.
- `roster` uses member short names only: `claude`, `gemini`, `gpt`,
  `kimi`, `muse` for the installed `definitive` profile.
  Runs sealed before scaffold#915 name `mistral`.
- `provenance_contract` declares the provenance shape the run expects.
  New runs use the installed `FACILITATOR_VERSION` (1.6.0 for this adoption),
  not a hard-coded old example. `roster_contract` is `rosterIdentity()` from
  `scripts/lib/council-roster.ts`: version, digest and provider derived from
  current Facilitator recipes. It is not a second configuration authority.
  Historical records stay unchanged; they cannot qualify as current run proof.
- All five installed members are required; `roster_decision` cannot waive this;
  no installed seat is optional. An anchored run's
  roster, coordinator and verifier pins are immutable.
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
  those outputs to the same step key. Declare complete member sets for all
  Steps 2–4 before a new round (at most five rounds). Helpers accept
  `--round N`; round-specific seals such as `step2-r2.seal.json` preserve
  the previous round's seal. Step 1 does not recur.

### Coordinator block (corpus 4.7.0)

The manifest records who orchestrated the run, as observed — separately from
the harness profile's preference (`SKILL.md` § Coordinator):

```json
"coordinator": {
  "harness": "claude-code",
  "requested_model": "claude-opus-5",
  "observed_model": null,
  "observation": "unverified",
  "voting": false
}
```

- `harness` — `claude-code` | `codex` | `copilot` | `tursi`.
- `requested_model` — the profile's preferred coordinator model for that
  harness, as listed in `SKILL.md` § Coordinator.
- `observed_model` — the model the runtime itself reported, when the harness
  exposes one; otherwise `null` with `observation: "unverified"`. Never copy
  `requested_model` into `observed_model`: an inferred identity is the
  substrate-collapse signature the Facilitator exists to prevent, and it is not
  attested here either.
- Required and checked by the shipped standalone helpers. The coordinator is
  non-voting. Earlier run records are not amended to simulate observation.

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

Member short names: `claude`, `gemini`, `gpt`, `kimi`, `muse`
(historical runs: `mistral`). Use
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
  "facilitator_version": "council-facilitator@1.6.0",
  "roster_contract": { "version": "council-facilitator@1.6.0", "sha256": "installed-recipe-digest", "provider": "openrouter" },
  "artifact_path": "research/council-runs/<run-id>/claude-analysis.md",
  "output_file_sha256": "sha256",
  "genesis_sha256": "sha256-of-anchored-genesis",
  "prev_verdict_sha256": null,
  "member": "claude",
  "declared_model": "anthropic/claude-fable-5.1 (OpenRouter, effort=xhigh)",
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
      "model_field": "anthropic/claude-fable-5.1-20260831",
      "content_length": 12345,
      "content_sha256": "sha256",
      "usage": {
        "input_tokens": 1000,
        "output_tokens": 2000
      },
      "tokens": {
        "prompt": 1000,
        "completion": 2000,
        "total": 3000,
        "reasoning": 500
      }
    }
  ],
  "final": {
    "outcome": "success",
    "assurance_tier": "local_capture_provider_attested",
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
      "total": 3000,
      "reasoning": 500
    },
    "verification": {
      "result": "PASS",
      "match_kind": "semantic",
      "declared": "anthropic/claude-fable-5.1 (OpenRouter, effort=xhigh)",
      "observed": "anthropic/claude-fable-5.1-20260831",
      "model_identity_source": "provider_response"
    },
    "effort_verification": {
      "result": "PASS",
      "declared": "xhigh",
      "evidence": "reasoning_tokens",
      "observed_reasoning_tokens": 500
    }
  }
}
```

Rules:

- `attempts[].content_sha256` is the hash of the assistant content
  extracted from the provider response.
- This is an illustrative excerpt, not a hand-authored receipt. The sidecar
  must equal the corresponding canonical ledger entry. Model identity,
  recipe binding, declared effort, and provider reasoning evidence are
  independently checked; content success or a CLI exit 0 is not sufficient.
- `final.file_artifact_sha256` is the hash of the Markdown file after
  the Facilitator writes it to disk; this is what the completeness lint
  re-validates before downstream steps consume the output.
- `usage` is copied from the provider when present. OpenAI-compatible
  providers usually return `usage`; Google AI Studio returns
  `usageMetadata`; the Facilitator records either shape without
  normalizing provider-specific field names.
- `tokens` is the Facilitator-normalized token shape:
  `prompt`, `completion`, `total`, and `reasoning` (nullable). If a provider response lacks
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
  This is local tamper evidence, not a provider-signed attestation. The key's
  hash is bound in genesis; the key stays private, ignored and owner-only.
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
| claude  | OpenRouter                 | anthropic/claude-fable-5.1 (OpenRouter, effort=xhigh)   | anthropic/claude-fable-5.1-20260831 | Response body `model` field | PASS   | —     |
| gemini  | OpenRouter                 | google/gemini-3.8-flash (OpenRouter, effort=high)       | google/gemini-3.8-flash-20260902    | Response body `model` field | PASS   | —     |
| gpt     | OpenRouter (OpenAI-pinned) | openai/gpt-6-astra (OpenRouter, via openai, effort=max) | openai/gpt-6-astra-20260903         | Response body `model` field | PASS   | —     |
| kimi    | OpenRouter (provider pin)  | moonshotai/kimi-k3 (OpenRouter, effort=max)             | moonshotai/kimi-k3                  | Response body `model` field | PASS   | —     |
| muse    | OpenRouter (Meta-pinned)   | meta/muse-spark-1.3 (OpenRouter, via meta, effort=max)  | meta/muse-spark-1.3                 | Response body `model` field | PASS   | —     |

Gate outcome: **PASS** — advancing to Step {N+1}.
```

Field rules:

- **Step** — numeric pipeline step (1–4); recursion rounds keep the
  same step number and increment `r`.
- **r** — recursion round (`r1` for the initial pass through Steps
  2–4; `r2`, `r3`, … for tie-break rounds).
- **Timestamp** — a checked clock at gate evaluation, in UTC, ISO-8601
  (`2026-05-22T15:42:18Z`); no MCP dependency.
- **Substrate** — `OpenRouter` for new anchored runs, with provider routing
  taken from the installed recipe (the GPT seat is OpenAI-pinned). Older
  direct-provider/harness entries remain historical audit material.
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
  semantically — e.g. `"anthropic/claude-fable-5.1 (OpenRouter, effort=xhigh)"` matches a response-body `model: "anthropic/claude-fable-5.1-20260831"`; `"openai/gpt-6-astra (OpenRouter, via openai, effort=max)"`
  matches a response body `model: "openai/gpt-6-astra-20260903"`), `FAIL`
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

- `run-summary.json` uses `schema_version: council-run-summary@1.1.0`.
  The command verifies complete current-contract artifacts, ledger and seals
  before writing. `usage_scope: declared_outputs_excluding_setup_probes`
  labels its totals, which cover declared outputs, excluding Setup probes;
  each recursion round is separate. Custom filenames remain under the run
  directory as `run-summary-<name>.json` / `.md`.
- `tokens.{prompt,completion,total}` is the normalized token shape.
  Raw provider usage remains in each provenance sibling under `usage`.
- Missing or unrecognized provider usage is recorded per attempt as
  `usage_unavailable` with a reason (`usage_absent` or `usage_unrecognized`),
  never as an observed `0`. Totals sum available counts; consult
  `usage_unavailable_count` before treating them as complete accounting.
- Historical/partial runs may be inspected separately, but this verifier
  refuses to produce a current verified summary for them. Failed validation
  does not overwrite an existing summary.

## README.md

The output directory's top-level `README.md` is written **at the end of
the council run**, summarizing:

- Problem context (one paragraph)
- Active roster (3, 4, or 5) and reachability evidence
- Round-by-round summary (r1, r2, r3, …) with vote tallies
- **Model verification summary** — link to `model-verification-log.md`;
  total gate count; count of PASS / FAIL / UNVERIFIABLE outcomes;
  prose summary of any FAIL or UNVERIFIABLE breaks and how they were
  recovered
- **Run summary** — link to `run-summary.md` and note total tokens,
  total wall-clock attempt duration, and any `usage_unavailable` rows
- Final winning plan + link to its `revised_approaches/*-revised_plan.md`
  (or `revised_approaches/*-revised_plan-r{N}.md`)
- Link to the Forge issue created or updated in Step 5
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

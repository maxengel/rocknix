# Member roster

The council pipeline runs across an **active roster** of member
subagents. The roster is determined at Setup and **fixed for the
duration of one council run** — never re-detected mid-run, because
mid-run roster changes corrupt the voting tally and the per-member
output filenames.

## Available members

All five members are invoked via the **Council Facilitator**
(`scripts/council-invoke.ts`) on the all-member **OpenRouter** route by
default. One council key reaches five individually pinned model slugs; every
response is model-identity-verified by the Facilitator. Direct-provider APIs
remain an explicit max-independence fallback (`--provider direct`), never a
silent fallback when the council key is absent. See
[`model-verification.md`](model-verification.md) § Substrate C.

| Subagent                 | Canonical model / effort                               | Substrate  | Required env         | Context   |
| ------------------------ | ------------------------------------------------------ | ---------- | -------------------- | --------- |
| `council-member-claude`  | `anthropic/claude-fable-5.1`, effort=`xhigh`                                                    | OpenRouter | `OPENROUTER_API_KEY` | 1,000,000 |
| `council-member-gemini`  | `google/gemini-3.8-flash`, effort=`high`                                                        | OpenRouter | `OPENROUTER_API_KEY` | 1,048,576 |
| `council-member-gpt`     | `openai/gpt-6-astra`, OpenAI provider, effort=`max`                                             | OpenRouter | `OPENROUTER_API_KEY` | 1,050,000 |
| `council-member-kimi`    | `moonshotai/kimi-k3`, effort=`max`, provider pin modal → sail-research → together → moonshotai | OpenRouter | `OPENROUTER_API_KEY` | 1,048,576 |
| `council-member-muse`    | `meta/muse-spark-1.3`, effort=`max`, provider pin `meta`                                        | OpenRouter | `OPENROUTER_API_KEY` | 1,048,576 |

Fable 5.1 + GPT-6 Astra were live-verified through the Facilitator on
2026-09-09 in the source estate (response-model identity PASS for both;
reasoning tokens > 0 at the declared effort — `reasoning=16` for gpt at `max`,
`reasoning=143` for claude at `xhigh` on a reasoning prompt), the source estate's
PR #4453; the OpenRouter catalog reports 1M and 1.05M context respectively.
Their predecessors, Fable 5 + GPT-5.6 Sol, were live-verified the same way on
2026-07-11. The seats moved by operator direction on 2026-09-09 (scaffold#562).

Roster history (all operator-directed; the Facilitator's `OPENROUTER_SEATS`
table is the authority and this table mirrors it — scaffold#571):

- **2026-08-12** — Claude seat Fable 5 → Opus 5; reasoning seats `max` → `xhigh`.
  `max` over-thought bounded review corpora (10–13 minute attempts and
  reasoning-budget-exhausted empty envelopes during the F6 delta rounds, classed
  UNVERIFIABLE).
- **2026-08-27** — Claude seat back to Fable 5 ("use the most advanced model for
  research"; the seat/orchestrator decorrelation the 08-12 ruling protected is
  traded away knowingly). Kimi K2.6 → **Kimi K3**. Gemini `xhigh` → `high`:
  Gemini 3.1 Pro Preview advertises only high/medium/low, and an unsupported value
  errors or silently falls back while the record still attests `xhigh` — the
  six-week gap `scripts/lint-council-seat-efforts.ts` now closes against the
  pinned catalog snapshot `council-seat-efforts.json`.
- **2026-09-03** — limits revisited (pfi-collaboration; owner direction: quality
  outranks time and token spend). Every seat requests its full output ceiling on
  the first attempt (Fable 5.1 and GPT-6 Astra 128000, Gemini 65536, Kimi 262144,
  Mistral 131072); the Facilitator's per-attempt timeout is one hour and the total
  four hours. GPT `xhigh` → `max`; Kimi `high` → **`max`** (K3's own default).
  Claude stays `xhigh`: at xhigh Fable 5.1 used 54k of its 128k output cap on a
  real Step 1, and `max` risks a cap that is the model's, not ours. Gemini stays
  `high`, its ceiling. The seat lint also fails a seat whose ceiling exceeds its
  model's `max_completion_tokens`.
- **2026-09-08** — Kimi provider pin (the source estate's issue 4184): unpinned routing put
  a 180k-token bundle on 4 tok/s providers three times in a row; the seat is pinned
  to modal → sail-research → together → moonshotai with fallbacks off. An
  availability lever, not a trust boundary — identity stays response-attested.
- **2026-09-09** — Claude seat Fable 5 → **Fable 5.1**; GPT seat GPT-5.6 Sol →
  **GPT-6 Astra** at `max` (scaffold#562). `openai/gpt-6-astra-pro`
  (`reasoning.mode=pro`) is the recorded escalation.
- **2026-09-10** — the three Facilitator lineages (scaffold corpus, the source estate,
  pfi-collaboration) converge in the corpus as `council-facilitator@1.3.0`
  (scaffold#571); this table, the seat table, the seat lint, the verifier pins and
  the routing test travel together by cascade.
- **2026-09-10** — Gemini seat 3.1 Pro Preview → **3.8 Flash** at `high` (owner ruling on
  scaffold#621 after a catalog + benchmark + live-probe investigation: no newer Gemini Pro
  exists; 3.8 Flash is higher on every third-party index, a third of the price, same
  context, ceiling and efforts). The direct AI Studio fallback follows by model name.
- **2026-09-27** — fifth seat Mistral Large 3 → **Muse Spark 1.3** at `max`, 131072 output,
  Meta-only route (owner ruling, scaffold#915; Facilitator 1.12.0). Mistral's 262,144-token
  window could not take a complete council request (one research Phase 4 Step 1 measured
  356,630 tokens), and no Mistral model lists more; the other four seats read about
  1,000,000.
- **2026-10-02** — Rasteratops keeps the installed five seats. Future fifth-seat
  changes come through reviewed imports from the other projects (D-WORKFLOW-135),
  following the refresh procedure in [`IMPORTED-FROM.md`](../IMPORTED-FROM.md).

## Coordinator (not a seat)

The model orchestrating a run is the harness's — Claude Code → Claude Opus 5,
Codex → GPT-5.6 Sol, VS Code Copilot → the skill's frontmatter `model:` — and
it never votes. The profiles, the identity policy and the interim nature of the
arrangement are in [`SKILL.md`](../SKILL.md) § Coordinator; the run manifest
records what actually ran ([`output-conventions.md`](output-conventions.md)
§ Run manifest, `coordinator` block).

Mistral sits in no run profile since scaffold#915; its recipe remains for runs sealed
before that change. That recipe pins `mistral/eu`
with provider fallback disabled: September 25 controls isolated shared-pool 429s on
`mistral/zdr` (the
canonical recovery record (scaffold's forge, docs/planning/council-five-seat-794/recovery-20260924.md)).
The seat left the roster over capacity, not routing: a routing success never proved
that every later phase fits its context budget.

## Substrate (OpenRouter default, direct-provider fallback)

The Facilitator's per-invocation `provenance.json` sibling carries the
OpenRouter response body's served `model` field, which the per-break
model-verification gate compares semantically against the pinned slug.
**Trust grade: high** (`local_capture_provider_attested`) — OpenRouter is an
aggregator, but cannot silently substitute a sibling model because every seat
uses one `model` slug (no fallback array) and the response identity is gated.

| Substrate                 | Endpoint shape                                                           | Verification source                                                                       | Trust grade |
| ------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ----------- |
| `anthropic-direct`        | `api.anthropic.com/v1/messages`                                          | `provenance.json.final.verification.observed` (Facilitator reads `response.model`)        | High        |
| `ai-studio`               | `generativelanguage.googleapis.com/v1beta/models/<id>:generateContent`   | `provenance.json.final.verification.observed` (Facilitator reads `response.modelVersion`) | High        |
| `foundry-direct`          | `cognitiveservices.azure.com/openai/deployments/<name>/chat/completions` | `provenance.json.final.verification.observed` (Facilitator reads `response.model`)        | High        |
| `openrouter`              | `openrouter.ai/api/v1/chat/completions`                                  | `provenance.json.final.verification.observed` (Facilitator reads `response.model`)        | High        |
| Copilot subagent (legacy) | VS Code `runSubagent` against `council-member-*.agent.md`                | VS Code Cache Explorer or OTLP file logs                                                  | Medium      |

The legacy Copilot-subagent path is documented in
[`model-verification.md`](model-verification.md) § Substrate B for
orchestrators whose cost-tier permits premium-model invocation.
Direct-API is the substrate-of-record.

## Preliminary review shares these pins

The [three-model preliminary review](review-formats.md) selects Claude, Gemini
and GPT from this same canonical recipe projection. It is a separate advisory
format, never a reduced council or a recovery path for an unavailable seat.
Model, effort, output ceiling and provider routing stay identical for shared seats.

## Five-seat requirement

Every definitive council requires all five standard members: **claude, gemini,
gpt, kimi and muse** (Muse replaced Mistral on 2026-09-27, scaffold#915). All five must produce verified, complete work at
each member stage. Four-seat and three-seat fallback is prohibited, even
when an old manifest contains `roster_decision`. A missing perspective can
change both the dissent and the outcome; a smaller vote is not equivalent.

The roster is locked before genesis. The coordinator is non-voting and
cannot fill a member seat. Historical reduced-roster artifacts retain their
original provenance but do not satisfy this requirement.

## Reachability and capacity checks

At Setup, probe **every** member through the Council Facilitator using a
small PONG request. Retain the output and provenance under `_probe/` and
record each result in `model-verification-log.md`.

```bash
node scripts/council-invoke.ts \
  --member <claude|gemini|gpt|kimi|muse> --provider openrouter \
  --prompt "Reply with exactly the single word PONG and nothing else." \
  --output {output_dir}/_probe/{member}.txt --max-tokens 4096 --max-retries 1
```

Exit 0, `final.outcome=success` and verified observed identity establish
reachability only. They do not prove that the full member request fits.
Measure the actual request, including system text, sources, prior-stage
inputs and output reservation, against the selected model/provider limit.
Do not remove sources, lower required effort or drop a seat to make it fit.
Use the approved bounded-reading workflow when needed and supported; keep
its implementation and live capacity/acceptance evidence separate.

## Failure recovery

Any missing, incomplete, FAIL or UNVERIFIABLE member **halts advancement**.
Preserve successful and failed artifacts, attempts and provenance. Diagnose
the failing layer before retrying:

1. **Routing:** inspect the pinned slug and live endpoint availability.
   A no-endpoints 404 occurs before model execution; smaller chunks cannot
   repair it. A batch variant is a different transport, not a slug alias.
2. **Authentication/access:** verify the intended endpoint and documented
   credential custody. A 401 alone does not prove rotation is needed.
3. **Capacity:** count input plus reserved output. Distinguish a context
   rejection from output truncation; preserve all required source coverage.
4. **Streaming:** inspect transport, terminal events, finish reason and
   captured chunks. SSE does not enlarge a model's context window.

Repair and retry the same pinned member under the existing retry/verification
rules, or hold the run. Never advance with the remaining four, fill a seat
with another incumbent, shrink the voting denominator, or count the
coordinator. After a roster or substrate-contract change, create a fresh
genesis and restart independent Step 1 for all five; do not append a late
fifth opinion to a reduced-roster result. For council-research, restart at
Phase 1 (after any required Phase 0).

## Future roster updates

Use the installed `definitive` profile: Claude, Gemini, GPT, Kimi and Muse.
pixelelated takes future fifth-seat changes through reviewed imports from the
other projects (D-WORKFLOW-135). Importing a candidate's tooling does not select
it for this fork. An adopted replacement records the decision and brings its
exact model, provider, effort, capacity and identity checks together with tests
and accountable pins. Then lock a fresh five-member roster and restart from
Step 1; for council-research, restart from Phase 1 after any required Phase 0.

## Roster invariants

- The same five members participate in Steps 1–4 and every tie-break round.
- Every member reviews and votes on other members' work, never its own.
- No valid five-seat vote exists until all five verified ballots are valid.
- Missing work blocks the next stage; the diagnostic record is the checkpoint.

## Cross-references

- [`pipeline.md`](pipeline.md) — setup and stage gates
- [`voting-rules.md`](voting-rules.md) — five valid ballots, fixed denominator
- [`output-conventions.md`](output-conventions.md) — manifest and artifact paths
- [`model-verification.md`](model-verification.md) — identity and failure recovery

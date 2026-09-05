---
paths:
  - "**"
description: "Adversarial-analysis routing — never use the rubber-duck agent; use only the verified multi-model council process, with pinned Fable 5.1 and GPT-5.6 Sol seats. Read before requesting a challenge pass, independent adversarial analysis, or council deliberation."
---

<!--
PROVENANCE (owner-directed + adopted reference):
  owner decision: 2026-07-13 — rubber-duck is prohibited; adversarial work routes to council.
  reference: PossibilityTruthy/possibility-space@6e09be974fba633996a4266e12c50cfcafe2cd23
  sources:
    .claude/skills/council/references/member-roster.md
    .claude/skills/council/references/model-verification.md
    tools/council/council-invoke.ts
  adapted: routing rule only. scaffold's verified council substrate is tracked by #136;
  until it lands, unavailable council work fails closed rather than using a substitute.
-->

# Adversarial analysis routes through council

## Hard routing rule

1. **Never invoke the `rubber-duck` agent.** This includes the Task-tool
   `rubber-duck` type and any renamed one-model "challenge my work" substitute.
2. **Use council for genuinely adversarial work.** Independent challenge passes,
   competing interpretations, pre-mortem-style critique, and structured disagreement
   belong to the verified multi-model `council` process.
3. **Do not build a pseudo-council.** Multiple ordinary subagents, one reviewer asked
   to role-play opposition, or unverified model calls do not satisfy this rule.
4. **Fail closed when council is unavailable.** The session-skill substrate ships in
   the corpus as of #260 (2026-08-02): the `council` / `council-research` /
   `begin-exploration` skills, the `council-member-*` agent definitions, and the
   Facilitator (`tools/council/council-invoke.ts`, OpenRouter route). Council is AVAILABLE
   wherever that corpus is seeded and `OPENROUTER_API_KEY` is configured — run it via
   the `council` skill. Where the key is missing or a seat fails verification, pause
   and surface the missing prerequisite. Do not silently fall back to rubber-duck or
   another single-model critic. (#136 remains the CI/workflow-side adoption tracker.)

Routine evidence work is unchanged: use direct inspection, the `code-review` specialist
for focused diff bugs, and `code-auditor` for its defined Epic/Milestone methodology.
Those are verification processes, not substitutes for a requested adversarial council.

## Council model floor

The seeded council preserves the verified model contract (binding now that the
skill family ships; #136 extends the same floor to CI review agents):

| Seat | Required model | Effort | Context | Routing |
| --- | --- | --- | ---: | --- |
| Claude | `anthropic/claude-fable-5.1` | `xhigh` | 1,000,000 | One pinned slug; no cross-model fallback |
| GPT | `openai/gpt-5.6-sol` | `max` | 1,050,000 | OpenRouter provider pinned to OpenAI; `allow_fallbacks: false` |

- **Deprecated:** Claude Fable 5, Claude Opus 5, Claude Opus 4.8, and GPT-5.5 must not occupy these seats (Fable 5 retired from the Claude seat 2026-09-03; Opus 5 is the coordination model, not a member). Kimi K2.6 must not occupy the Kimi seat (K3 since 2026-08-27).
- Each invocation must capture the served model from the provider response and pass the
  council's semantic identity gate before its output becomes input to the next stage.
- A missing or mismatched seat shrinks or halts the roster per the council contract; it
  never substitutes another model into that seat.
- Council stages remain serial-gated even when member calls within a stage run in
  parallel. The active roster is fixed for the run.

## Why

Adversarial value comes from distinct, attested model perspectives and structured peer
review—not from a generic "be critical" prompt. Silent fallback or a single-model critic
creates confidence without independence, which is worse than skipping the ceremony
honestly.

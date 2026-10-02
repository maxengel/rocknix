---
description: "Adversarial-review routing — code audits select a local, cross-lab two-model or extended three-model review; a formal council remains five verified seats. All external reviewers use the Facilitator. Read before an audit, challenge pass or council deliberation."
paths:
  - "**"
---

<!--
PROVENANCE (owner-directed + adopted reference):
  owner decision: 2026-07-13 — rubber-duck is prohibited; adversarial work routes to council.
  reference: the source estate, commit 6e09be974fba633996a4266e12c50cfcafe2cd23
  sources:
    .claude/skills/council/references/member-roster.md
    .claude/skills/council/references/model-verification.md
    scripts/council-invoke.ts
  adapted: routing rule only. scaffold's verified council substrate is tracked by #136;
  until it lands, unavailable council work fails closed rather than using a substitute.
-->

# Adversarial analysis routes through council

## Hard routing rule

1. **Never invoke the `rubber-duck` agent.** This includes the Task-tool
   `rubber-duck` type and any renamed one-model "challenge my work" substitute.
2. **Use the requested review workflow.** A `code-auditor` review follows its
   explicit levels and Phase 4.6 (D-WORKFLOW-137); it is not a council run.
   Other formal adversarial deliberation uses the five-seat council. The explicitly scoped
   [three-model preliminary review](../../.claude/skills/council/references/review-formats.md)
   is limited to advisory readiness questions before authoring. It cannot decide
   contested claims, supply an approval, or replace a required council gate.
   Competing design proposals and formal decision-making belong to the verified
   five-seat `council` process. Code-auditor independently verifies implementation
   claims against artifacts; it does not acquire council decision authority.
3. **Do not build a pseudo-council.** Multiple ordinary subagents, one reviewer asked
   to role-play opposition, or unverified model calls do not satisfy this rule.
4. **Fail closed when council is unavailable.** The session-skill substrate ships in
   the corpus as of #260 (2026-08-02): the `council` / `council-research` /
   `begin-exploration` skills, the `council-member-*` agent definitions, and the
   Facilitator (`scripts/council-invoke.ts`, OpenRouter route). The tooling is installed where that corpus is seeded; actual
   readiness requires fresh verification of all five members and request capacity
   through the `council` skill. Where the key is missing or a seat fails verification, pause
   and surface the missing prerequisite. Do not silently fall back to rubber-duck or
   another single-model critic. (#136 remains the CI/workflow-side adoption tracker.)

Routine evidence work is unchanged: use direct inspection, the `code-review` specialist
for focused diff bugs, and `code-auditor` for its defined Epic/Milestone methodology.
Those are verification processes, not substitutes for a requested adversarial council.

## Code audits are a separate workflow

An ordinary independent code audit has the primary auditor plus one external
reviewer from a different model lab; an explicitly extended audit adds a third
lab. OpenAI-led audits prefer pinned Fable 5.1; Anthropic-led audits prefer
pinned GPT-6 Astra. The two milestone passes are calls, not extra seats. Follow
[code-auditor review levels](../skills/code-auditor/references/review-levels.md)
and record the actual primary/reviewer identities. Unknown identity or an
unavailable reviewer does not justify a same-lab substitution.

These audits reuse the Facilitator's installed recipes and per-call provenance
checks, not council genesis, voting, five-seat availability or formal council
completion. Local Issue reviews make no independent-review claim. A release
explicitly escalated to council still requires all five seats and its own full
protocol. Version-based depth recommendations never waive VM or migration QA.

## Council model floor

The seeded council preserves the verified model contract (binding now that the
skill family ships; #136 extends the same floor to CI review agents):

| Seat | Required model | Effort | Context | Routing |
| --- | --- | --- | ---: | --- |
| Claude | `anthropic/claude-fable-5.1` | `xhigh` | 1,000,000 | One pinned slug; no cross-model fallback. `xhigh`, not `max`: on bounded corpora `max` over-thinks into empty envelopes |
| GPT | `openai/gpt-6-astra` | `max` | 1,050,000 | OpenRouter provider pinned to OpenAI; `allow_fallbacks: false`. `max` is the operator's 2026-09-09 direction; `openai/gpt-6-astra-pro` is the recorded escalation |

- **Deprecated:** Claude Opus 4.8 and GPT-5.5 must not occupy these seats; Claude Fable 5 and
  GPT-5.6 Sol retired from them on 2026-09-09 (scaffold#562).
- Each invocation must capture the served model from the provider response and pass the
  council's semantic identity gate before its output becomes input to the next stage.
- For a formal council run, all five seats are required. A missing or mismatched seat halts advancement for
  diagnosis and repair per the council contract; never shrink the roster or silently
  substitute a reserve. See the canonical council roster reference.
- Council stages remain serial-gated even when member calls within a stage run in
  parallel. The active roster is fixed for the run.

## Seats write to different lengths, and length is not quality

The gemini and mistral seats (Mistral held the fifth seat until Muse Spark 1.3 replaced it, scaffold#915, 2026-09-27) returned **substantially shorter artifacts than the
other three, every time**. Maintainer, 2026-09-05: *"Gemini and Mistral will
always come back with thinner plans."* On the conflict-resolution run their
round-2 plans were a few pages against roughly seventy kilobytes each from
claude, gpt and kimi — and gemini's few pages carried the whole architecture,
including the argument that made two other seats change position on deletion
propagation.

So do not read brevity as a defect, and do not report it as one. A short
artifact from these two seats is the expected shape of their output, not a
signal that the seat under-performed, mis-parsed the prompt, or hit a token
cap. Check the seat's log for `outcome=success` and a completion count well
under the cap before wondering; on that run both seats finished in around
70-110 s while the long seats ran 12-17 minutes, which is the same fact seen
from the other side.

**The consequence to watch is the vote, not the prose.** Members vote on each
other's plans, and a plan that is thorough-looking is easy to mistake for a
plan that is thorough. Across both rounds of the conflict-resolution run,
gemini and mistral received **zero votes between them** while their arguments
were adopted by name into the winning positions. Two rounds is far too small a
sample to separate "shorter" from "less complete", and nothing here justifies
weighting a vote or changing a prompt mid-run. It does justify the
orchestrator reading all five plans rather than ranking them by weight, and
carrying a losing seat's specific contributions into Step 5 by name — which the
vote prompt already asks every member to do under **Record dissent**.

## Why

Adversarial value comes from distinct, attested model perspectives and structured peer
review—not from a generic "be critical" prompt. Silent fallback or a single-model critic
creates confidence without independence, which is worse than skipping the ceremony
honestly.

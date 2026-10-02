# Council, Step 4.5: consensus integration on the winning plan (the plan to fork ROCKNIX as rasteratops, #338)

Your revised plan (`revised_approaches/claude-revised_plan.md`) won the council's vote,
three ballots to two, over gpt's revised plan. The owner has opted into this
integration round. Its purpose is narrow: your plan stays the base; the other four
members' dissent primitives are integrated where they do not conflict with that base;
where they conflict, the conflict is listed, not flattened into false agreement.

## Mandatory context loading

Embedded in this request, verified byte for byte:

- research/council-runs/2026-09-30-rasteratops-fork-plan-r2/revised_approaches/claude-revised_plan.md: the base
- research/council-runs/2026-09-30-rasteratops-fork-plan-r2/peer_votes/claude_vote.md
- research/council-runs/2026-09-30-rasteratops-fork-plan-r2/peer_votes/gemini_vote.md
- research/council-runs/2026-09-30-rasteratops-fork-plan-r2/peer_votes/gpt_vote.md
- research/council-runs/2026-09-30-rasteratops-fork-plan-r2/peer_votes/kimi_vote.md
- research/council-runs/2026-09-30-rasteratops-fork-plan-r2/peer_votes/muse_vote.md
- research/council-runs/2026-09-30-rasteratops-fork-plan-r2/revised_approaches/gemini-revised_plan.md
- research/council-runs/2026-09-30-rasteratops-fork-plan-r2/revised_approaches/gpt-revised_plan.md
- research/council-runs/2026-09-30-rasteratops-fork-plan-r2/revised_approaches/kimi-revised_plan.md
- research/council-runs/2026-09-30-rasteratops-fork-plan-r2/revised_approaches/muse-revised_plan.md

The five ballots carry the dissent notes; the four other revised plans are there so a
primitive a ballot names can be read at its source. Read all ten in full.

## What to produce

One markdown document with exactly these four headings, in this order:

```
# Consensus integration plan

## Winning plan as base

## Dissent primitives integrated into the base

## Dissents that conflict with the base

## Step 5 handoff content
```

- **Winning plan as base:** your plan, restated complete and self-contained, with every
  change from the integration marked in place (a bracketed note naming the source seat).
  A reader must be able to execute from this section alone.
- **Dissent primitives integrated into the base:** each primitive you absorbed, one per
  bullet: the seat it came from, what it is, where it now lives in the base, and why it
  does not conflict.
- **Dissents that conflict with the base:** each primitive you did not absorb because it
  conflicts: the seat, the primitive, the conflicting element of the base, and what
  would have to be true for the dissent to win. Never resolve these by averaging.
- **Step 5 handoff content:** the material the plan's issue is written from: a
  one-paragraph context; the phases with entry and exit criteria an agent can verify
  (a frame at the panel's size, a build's BUILD_ID, a suite's PASS line, a stamp, a
  measurement, a digest); the register rows to write, each as the sentence the row
  would carry; the owner's questions, each with the decision it unblocks; and what is
  explicitly outside 0.0.1. Size every piece of work by what it must prove and what it
  depends on. Do not estimate work in days, hours or weeks: this project treats time as
  a measurement written after the fact, never as a plan.

## How to write it

- Cite the seat and the passage for every primitive.
- Keep the base's exit criteria as runnable checks bound to a manifest digest.
- Do not comment on the council process, the vote, or the other members' quality.
- Structured markdown; tables where alternatives are compared; reasoning, not only
  conclusions.

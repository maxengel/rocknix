# Voting rules

Tally Step 4 only after **all five** members have submitted valid, verified
ballots. The denominator is always five. Missing work, abstention, model
failure or a recorded roster exception cannot reduce it.

## Vote shape

Each `peer_votes/{member}_vote.md` must contain:

1. One explicit winner chosen from the other four members' revised plans.
2. Reasoning comparing that choice with the alternatives reviewed.
3. Optional dissent notes identifying reservations to carry into delivery.

Never infer a choice from prose. A missing, malformed, self-directed or
unverified ballot blocks the round. Preserve its evidence, diagnose and
retry that member; otherwise hold the run. Do not label four valid ballots
plus an abstention a completed five-seat council.

## Five-member decision matrix

Each member has four eligible choices, but the **council-wide candidate
set has five plans**. A cyclic 1-1-1-1-1 vote is possible without self-votes.

| Tally | Outcome | Action |
| --- | --- | --- |
| 4-1, 3-2, 3-1-1 | Majority (at least 3 of 5) | Present the winner and dissent, then follow the handoff/acceptance gate. |
| 2-1-1-1 | Plurality only | Present the plurality and dissent; ask whether to accept it or recurse. Never call it a majority. |
| 2-2-1 | Tie | Recurse with all five members and all current plans eligible; retain the outlier's dissent. |
| 1-1-1-1-1 | Fragmented tie | Recurse once; if still fragmented, surface all five plans and the failure to converge. |
| Fewer than five valid ballots | Incomplete round | Hold for diagnosis and repair; no result may advance. |

The no-self-vote rule limits one plan to four votes. Historical three- or
four-member matrices are not admission rules for new runs.

## Margin-driven consensus integration

Step 4.5 is an opt-in integration round, not a voting-system redesign
and not a convergence-forcing tie-break. Use it when Step 4 produces a
winner but the margin suggests substantive dissent primitives should be
carried into the handoff.

Source case: the 2026-05-22 council run step-5 meta-retrospective (the source estate's repository, research/council-runs/)
captured a 3-1-1 vote where dissent primitives were useful but not
automatically integrated into the winning handoff.

Offer Step 4.5 when the winning margin is ≤ 2 votes, including:

- 3-1-1 in a 5-member roster
- 3-2 in a 5-member roster
- 2-1-1-1 when the user accepts the five-ballot plurality
- Any tie-break result where the final winner is clear but dissent notes
  contain non-conflicting implementation primitives

Do not offer Step 4.5 by default for 4-1 outcomes unless the user
explicitly asks for a consensus integration pass. Wide wins proceed to
Step 5 with dissent notes carried as supporting context. A 5-0 outcome
is impossible without a self-vote.

When Step 4.5 runs, the winning plan remains the base. The synthesizer
integrates dissent primitives only where they do not conflict with that
base, and explicitly lists conflicting dissents rather than flattening
them into false agreement.

## Self-vote handling

A member that votes for itself (in violation of the pipeline) renders
the entire vote round invalid. Treat as a process failure:

1. Surface the self-vote to the user.
2. Diagnose and retry the invalid ballot with the no-self-vote instruction.
   Preserve the failed attempt; do not tally or advance until all five
   members have valid, verified ballots.

## Cross-references

- [`pipeline.md`](pipeline.md) — defines when voting happens (Step 4)
  and the per-member file mapping
- [`member-roster.md`](member-roster.md) — defines the active roster
  and its mandatory five-seat participation rule
- [`tie-breaking-recursion.md`](tie-breaking-recursion.md) — defines
  what happens when a tie occurs

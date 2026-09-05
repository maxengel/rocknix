# Voting rules

After Step 4 (peer votes), tally each member's vote and determine the
outcome. The decision matrix depends on the active roster size.

## Vote shape

Each member's `peer_votes/{member}_vote.md` MUST contain:

1. A single explicit **winner choice** — the name of the member whose
   revised plan is strongest. Members MUST NOT vote for themselves.
2. **Reasoning** — at least one paragraph explaining why the chosen
   plan is strongest relative to the alternatives reviewed.
3. **Dissent notes** (optional but encouraged) — specific
   reservations about the chosen plan that should inform execution.

If a vote file is missing the explicit winner choice, treat the member
as **abstaining** and surface the issue to the user. Do not infer a
winner from the prose.

## 3-member roster (trio)

3 members each cast 1 vote for one of the **other 2** members. Possible
distributions:

| Tally                       | Outcome                 | Action                                                               |
| --------------------------- | ----------------------- | -------------------------------------------------------------------- |
| 2 votes for A, 1 vote for B | **Majority winner = A** | Present winner to user, proceed to Step 5                            |
| 1 vote each for A, B, C     | **Tie**                 | Recurse per [`tie-breaking-recursion.md`](tie-breaking-recursion.md) |

Note: a 2-of-3 tally is structurally the maximum achievable when nobody
self-votes (each member is voting from a 2-option ballot).

## 4-member roster (council)

4 members each cast 1 vote for one of the **other 3** members. Possible
distributions:

| Tally                                                                    | Outcome                                                  | Action                                                                                                         |
| ------------------------------------------------------------------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 3+ votes for A                                                           | **Majority winner = A**                                  | Present winner to user, proceed to Step 5                                                                      |
| 2 votes for A, no other plan at 2                                        | **Plurality winner = A**                                 | Present plurality + dissent to user; **ask** whether to accept the plurality or recurse for stronger consensus |
| 2 votes for A, 2 votes for B                                             | **Tie (2-2)**                                            | Recurse per [`tie-breaking-recursion.md`](tie-breaking-recursion.md)                                           |
| 1 vote each for A, B, C, D                                               | **Fragmented (impossible: only 3 candidates available)** | N/A — each member votes on 3 candidates, so 4 votes distributed across at most 3 candidates                    |
| 1 vote each for 3 candidates, with one candidate getting 2 (i.e., 2-1-1) | **Plurality winner = A**                                 | Same as 2-with-no-other-at-2 above                                                                             |

**The pivot rule for 4-member roster:** a clear majority (3+) advances
without user input. A plurality (2 with no peer) pauses for user input
because the dissent is meaningful. A genuine tie (2-2) recurses.

## 5-member roster (council)

5 members each cast 1 vote for one of the **other 4** members. Possible
distributions across the 4 candidates each member faces:

| Tally                                                                                                  | Outcome                  | Action                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 3+ votes for A                                                                                         | **Majority winner = A**  | Present winner to user, proceed to Step 5                                                                                                                                                                                                                                |
| 2 votes for A, no other plan at 2                                                                      | **Plurality winner = A** | Present plurality + dissent to user; **ask** whether to accept the plurality or recurse for stronger consensus                                                                                                                                                           |
| 2 votes for A, 2 votes for B, 1 vote for C                                                             | **Tie (2-2-1)**          | Recurse per [`tie-breaking-recursion.md`](tie-breaking-recursion.md) with the full roster and all current revised plans still eligible. The 1-vote outlier is recorded as dissent but is not dropped.                                                                    |
| 1 vote each for 4 different members (1-1-1-1-1 across 4 candidates impossible — 5 votes, 4 candidates) | **Fragmented**           | A fragmented vote (no candidate above 1) means the deliberation failed to converge. Recurse per [`tie-breaking-recursion.md`](tie-breaking-recursion.md) one round; if still fragmented, surface to user with all five revised plans + the fragmentation as the finding. |
| 1-1-1-1-1 (impossible with 5 votes across 4 candidates)                                                | **N/A**                  | At least one candidate must receive 2 votes by pigeonhole                                                                                                                                                                                                                |

**The pivot rule for 5-member roster:** a clear majority (3+) advances
without user input. A plurality (2 with no peer) still pauses for user
input. A 2-2-1 tie recurses through the full Step 2 → Step 3 → Step 4
loop with all roster members and all current revised plans still in the
candidate set; the 1-vote outlier is carried as dissent and remains
eligible to converge in a later round.

## Why the matrices differ by roster size

In a 3-member trio, any non-tie outcome is automatically a majority
(2-of-3). The trio has no "plurality" case. The 4-member council
introduces the plurality case (2-of-4 with no other at 2). The 5-member
council retains the plurality case but adds the 2-2-1 partial-tie case
— where two candidates tie at 2 each and a third receives 1 "protest"
vote. The recursive path keeps the full roster active and keeps all
current revised plans eligible, because the outlier may contain the
primitive that lets the next peer-review / refinement / vote cycle
converge.

## Member abstention

If a member abstains (missing or invalid vote file), reduce the
effective vote count by 1 and re-evaluate against the matrices:

| Effective votes | Treat as                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| 5               | 5-member roster                                                                                          |
| 4               | 4-member roster                                                                                          |
| 3               | 3-member roster                                                                                          |
| 2               | **Refuse to decide.** Surface the abstention to the user; either retry the abstaining member or escalate |

Do **not** silently promote a plurality into a majority because an
abstention shrank the denominator. Abstention should always be surfaced.

## Margin-driven consensus integration

Step 4.5 is an opt-in integration round, not a voting-system redesign
and not a convergence-forcing tie-break. Use it when Step 4 produces a
winner but the margin suggests substantive dissent primitives should be
carried into the handoff.

Source case: the 2026-05-22
[`step5-meta-retrospective.md`](../../../../research/council-runs/2026-05-22-model-identity-verification-technique/step5-meta-retrospective.md)
captured a 3-1-1 vote where dissent primitives were useful but not
automatically integrated into the winning handoff.

Offer Step 4.5 when the winning margin is ≤ 2 votes, including:

- 3-1-1 in a 5-member roster
- 3-2 in a 5-member roster
- 2-1-1 in a 4-member roster when the user accepts the plurality
- Any tie-break result where the final winner is clear but dissent notes
  contain non-conflicting implementation primitives

Do not offer Step 4.5 by default for 4-1 or 5-0 outcomes unless the user
explicitly asks for a consensus integration pass. Wide wins proceed to
Step 5 with dissent notes carried as supporting context.

When Step 4.5 runs, the winning plan remains the base. The synthesizer
integrates dissent primitives only where they do not conflict with that
base, and explicitly lists conflicting dissents rather than flattening
them into false agreement.

## Self-vote handling

A member that votes for itself (in violation of the pipeline) renders
the entire vote round invalid. Treat as a process failure:

1. Surface the self-vote to the user.
2. Ask whether to retry that member's vote with explicit instruction
   not to self-vote, or to treat the self-voting member as
   abstaining and re-tally.

## Cross-references

- [`pipeline.md`](pipeline.md) — defines when voting happens (Step 4)
  and the per-member file mapping
- [`member-roster.md`](member-roster.md) — defines the active roster
  size that drives which matrix applies
- [`tie-breaking-recursion.md`](tie-breaking-recursion.md) — defines
  what happens when a tie occurs

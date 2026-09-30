# Tie-breaking recursion

When Step 4 (peer votes) produces a tie per
[`voting-rules.md`](voting-rules.md), the council recurses through
Steps 2–4 with the **current round's revised plans as input**, rather
than pausing for the user or arbitrarily promoting one plan. Each
recursion round is numbered `r2`, `r3`, `r4`, …

The goal is **organic synthesis** — forcing members to engage with the
strongest elements of each other's work usually converges within
1–2 extra rounds.

## When recursion triggers

A complete five-ballot round recurses on **2-2-1** or **1-1-1-1-1**.
Keep all five members and every current revised plan eligible; the outlier
can contain the dissent that improves the next round. A five-ballot
plurality (2-1-1-1) pauses for user acceptance or a requested recursion.
An incomplete round is a failure-recovery checkpoint, not a tie-break.

## Per-round procedure

Let `N` be the round number (`r2` for the first recursion, `r3` for the
second, …).

### Round-N Step 2 (peer review)

Each member reads the **other members' current-round revised plans** —
NOT the original analyses, NOT the previous round's revised plans. The
council always operates on the most recent revisions.

Output files:

```
peer_reviews/{member}_peer_review-r{N}.md
```

### Round-N Step 3 (revised approaches)

Each member reads the **other members' round-N peer reviews** and
produces a new revised plan incorporating the round-N feedback.

Output files:

```
revised_approaches/{member}-revised_plan-r{N}.md
```

### Round-N Step 4 (peer votes)

Each member reads the **other members' round-N revised plans** and
votes again.

Output files:

```
peer_votes/{member}_vote-r{N}.md
```

Tally per the same matrices in [`voting-rules.md`](voting-rules.md).

## Termination conditions

The recursion terminates when **any** of these is true:

1. **Majority emerges** — a plan wins per the active roster's majority
   rule. Proceed to Step 5 with the winning plan.
2. **Plurality emerges (2-1-1-1, all five ballots)** — pause for user input per
   [`voting-rules.md`](voting-rules.md).
3. **Max-round cap is hit** — see below.

### Max-round cap

Recurse at most through **`r5`** (i.e., the first recursion is `r2`,
the last permitted is `r5`, total 4 extra rounds). If `r5` Step 4
still produces a tie:

1. **Stop the recursion.**
2. Surface the persistent tie to the user with all `r{N}` artifacts
   linked, and **ask the user to decide directly** which plan
   advances. Document the user's decision in the council run's output
   directory as `peer_votes/user-decision-r{N+1}.md`.
3. Treat the user's decision as authoritative and proceed to Step 5
   with the selected plan.

The cap exists because a 4-round recursion that fails to converge is
strong evidence that the problem itself is under-specified or the
candidate plans are genuinely incommensurable — at that point, more
recursion adds cost without adding signal. **Cheap-reasoning self-check:**
the cap is not about "saving rounds" — it's a structural signal that
the problem needs reframing, not more deliberation.

## Round numbering invariants

- The first recursion is **`r2`**, not `r1`. The original (non-recursive)
  round is implicitly `r1` and uses the unsuffixed filenames defined in
  [`pipeline.md`](pipeline.md) — do NOT rename them.
- Round numbering is **continuous** — if `r2` produces a tie, the next
  round is `r3` (not `r2.1`).
- Every member produces an artifact in every round. A member that
  appeared in `r1` MUST appear in every recursion round, per the
  roster invariants in [`member-roster.md`](member-roster.md).

## Output-directory layout under recursion

```
research/council-runs/YYYY-MM-DD-{topic}/
├── {member}-analysis.md              # r1, unsuffixed
├── peer_reviews/
│   ├── {member}_peer_review.md       # r1, unsuffixed
│   ├── {member}_peer_review-r2.md    # first recursion
│   └── {member}_peer_review-r3.md    # …
├── revised_approaches/
│   ├── {member}-revised_plan.md      # r1
│   ├── {member}-revised_plan-r2.md
│   └── …
└── peer_votes/
    ├── {member}_vote.md              # r1
    ├── {member}_vote-r2.md
    └── …
```

See [`output-conventions.md`](output-conventions.md) for the full
output-directory specification.

## Cross-references

- [`pipeline.md`](pipeline.md) — defines the per-step file naming
  for `r1`
- [`voting-rules.md`](voting-rules.md) — defines what counts as a tie
- [`member-roster.md`](member-roster.md) — roster invariants under
  recursion
- [`output-conventions.md`](output-conventions.md) — full output layout

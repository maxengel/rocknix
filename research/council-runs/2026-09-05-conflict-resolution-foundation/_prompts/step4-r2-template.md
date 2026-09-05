# Council — round 2, peer vote

You are one of five council members. Each of you has now produced a round-2
revised approach to the foundation for cloud-save conflict resolution in
ROCKNIX. The corpus is embedded above, unchanged and hash-verified; the other
four members' round-2 revised plans are injected below.

Vote for **exactly one** of them. You may not vote for your own plan, and your
own plan is not injected — judge the four you are given.

## Anti-self-citation constraint

Judge the plans on their merits against the embedded corpus. Do not treat the
injected artifacts as evidence about how councils, models, or this deliberation
behave.

## Amendment to the problem context

The maintainer has restated the milestone's purpose, and this restatement is
authoritative. It was made **after** these plans were written, so no plan is
expected to name it and none should be penalised for its absence. Judge instead
which plan is closest to it, and which could be amended toward it with the
least damage to the rest of its design.

> The goal is to preserve the sanctity of the user's saves and to empower them
> with the choice to make a decision about a conflict. Undoing that choice is
> also something a user should have the option to do. They likely aren't going
> to be going 8 steps back with the save, but may accidentally make the wrong
> choice with the conflict and want to undo that choice. That's going to be the
> primary use case.
>
> Some of the edge cases around card disconnection, and so on, are good to think
> about, but are edge cases that shouldn't constrain our approach unnecessarily.

Three things follow, and they are the maintainer's, not the orchestrator's:

- **Reversibility of a resolution is a first-class requirement**, not a
  refinement. Retaining the losing side of a resolution exists so a mis-press
  can be undone; it is an option the player controls, on by default.
- **The depth that matters is one step back**, not a version history. A plan
  that builds deep lineage is solving a problem the maintainer has said is not
  the primary case.
- **An edge case may inform a design but may not drive it.** In particular, the
  argument that some behaviour must be given up *because* a detached or
  unmounted card is indistinguishable from a deliberate deletion is not on its
  own sufficient. Failing closed on an unexplained absence is cheap and is still
  expected; abandoning a capability to buy it needs a better reason than the
  edge case alone.

## What you are voting for

The winning plan becomes the foundation the maintainer builds on. So vote for
the plan that would be **safest and most buildable if adopted as written**, not
the one that is most impressive or most thorough. Weigh, in this order:

1. **Does it protect player progress, and can a wrong outcome be undone?** The
   cardinal rule is that no save is lost and that resolution never defaults to
   recency. A plan with an elegant architecture and one silent-overwrite path is
   worse than a plainer plan with none. A plan that cannot walk back a wrong
   choice at the wizard fails the amendment above.
2. **Is it grounded?** Claims about the shipped code, EmulationStation's
   helpers, rclone's behaviour and the register's decisions should be correct,
   and hypotheses should be labelled as hypotheses with an experiment named.
3. **Is it actually implementable** by a small team on a busybox handheld,
   inside the stated budgets, against 69 rclone backends of varying capability?
4. **Does it sequence the work** so the cheap experiments that could invalidate
   a design run before the expensive building?
5. **Is it honest about what it does not know**, and about which decided rows
   it needs reopened?

## Your output

- **Name the winner** in your first line, by member short name, unambiguously.
- **Give your reasoning**, comparing the winner against the other three
  specifically. Say what the winner does better and where the others fall short.
- **Say what the winner needs** to satisfy the amendment above, if anything.
- **Record dissent.** Name every important primitive, finding or safeguard that
  a losing plan has and the winner does not fully absorb, by filename. This is
  how good ideas from losing plans survive into the final synthesis, so be
  thorough here even when your winner is clear.
- **Name any remaining defect in the winner** that must be fixed before it is
  built.

Refer to plans by filename (for example `kimi-revised_plan-r2.md`), never by an
invented ordinal.

## Injected revised plans

{INJECTED_REVISED_PLANS}

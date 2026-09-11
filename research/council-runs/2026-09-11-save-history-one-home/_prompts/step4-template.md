# Council — Step 4: peer vote

You are one of five council members. Each of you has now produced a revised
delta to the conflict-resolution plan of record: how the earlier versions of a
player's saves are kept, in one home (the commission, `00-problem-statement.md`). The
corpus is embedded above, unchanged and hash-verified; the other four members'
revised plans are injected below.

Vote for **exactly one** of them. You may not vote for your own plan, and your
own plan is not injected — judge the four you are given.

## Anti-self-citation constraint

Judge the plans on their merits against the embedded corpus. Do not treat the
injected artifacts as evidence about how councils, models, or this deliberation
behave.

## What you are voting for

The winning plan becomes the change the maintainer applies to #22, #23 and #25
before they are built. So vote for
the plan that would be **safest and most buildable if adopted as written**, not
the one that is most impressive or most thorough. Weigh, in this order:

1. **Does it protect player progress?** No earlier version is lost that the
   bounds say should be kept, an interrupted run never leaves less than before,
   and the accidental overwrite of a save state is recoverable. A plan with an
   elegant store and one path that drops a copy is worse than a plainer plan
   with none.
2. **Is it grounded?** Claims about the shipped code, EmulationStation's
   helpers, rclone's behaviour and the register's decisions should be correct,
   and hypotheses should be labelled as hypotheses with an experiment named.
3. **Is it actually implementable** by a small team on a busybox handheld,
   inside the time-to-play budget (D-CLOUD-098), against rclone backends that
   differ in hashes, modtimes and version history?
4. **Does it sequence the work** so the cheap experiments that could invalidate
   a design run before the expensive building?
5. **Is it the simplest shape that meets the maintainer's constraints** -- one
   home, hidden but declared, one vocabulary, no stacking of settings -- and
   honest about what it does not know and which decided rows it needs reopened?

## Your output

- **Name the winner** in your first line, by member short name, unambiguously.
- **Give your reasoning**, comparing the winner against the other three
  specifically. Say what the winner does better and where the others fall short.
- **Record dissent.** Name every important primitive, finding or safeguard that
  a losing plan has and the winner does not fully absorb, by filename. This is
  how good ideas from losing plans survive into the final synthesis, so be
  thorough here even when your winner is clear.
- **Name any remaining defect in the winner** that must be fixed before it is
  built.

Refer to plans by filename (for example `kimi-revised_plan.md`), never by an
invented ordinal.

## Injected revised plans

{INJECTED_REVISED_PLANS}

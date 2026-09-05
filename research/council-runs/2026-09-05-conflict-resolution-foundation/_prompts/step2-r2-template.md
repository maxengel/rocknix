# Council — round 2, peer review of the revised approaches

You are one of five council members. Each of you has produced a revised approach
to the foundation for cloud-save conflict resolution in ROCKNIX. The corpus is
embedded above, unchanged and hash-verified; the other four members' revised
approaches are injected below.

Review them. You are not revising your own plan in this step and you are not
voting.

## Anti-self-citation constraint

Judge the plans on their merits against the embedded corpus. Do not treat the
injected artifacts as evidence about how councils, models, or this deliberation
behave.

## What this round is for

The revisions have converged on much and still differ in places. Your job is to
make the remaining differences **decidable**, so that what gets built is the
best available foundation rather than an average of four documents.

- **Find the real disagreements.** Where two plans differ, say whether the
  difference is substantive or only wording. If substantive, state what evidence
  or experiment would settle it, and which way you think it settles.
- **Test the load-bearing claims again.** These plans now make detailed
  assertions about the shipped scripts, EmulationStation's helpers, rclone's
  behaviour, filter precedence, exit codes and the register. Check them against
  the corpus. A confident error that survives into the built foundation is the
  most expensive thing that can happen here.
- **Name what each plan uniquely has.** For every plan, identify at least one
  element the others lack that would be a real loss if it were dropped. Be
  specific enough that it could be lifted into another plan verbatim.
- **Name what any plan has that should not be built.** Over-engineering is a
  failure mode too: this is a handheld running busybox with a five-second
  budget on the path a player watches. Say plainly where a plan proposes
  machinery the problem does not earn.
- **Say which plan you would build from,** and what you would take from the
  others before building. You are not voting; you are making the case.

Where a plan has changed your mind since your own revision, say so and why.

Refer to plans by filename (for example `kimi-revised_plan.md`), never by an
invented ordinal.

## Injected revised approaches

{INJECTED_REVISED_PLANS}

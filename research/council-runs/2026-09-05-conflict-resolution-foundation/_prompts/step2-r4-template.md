# Council — round 4, peer review of the revised approaches

You are one of five council members. Each of you has produced a revised
approach to the foundation for cloud-save conflict resolution in ROCKNIX. The
corpus is embedded above, unchanged and hash-verified; the other four members'
current revised approaches are injected below.

Review them. You are not revising your own plan in this step and you are not
voting.

## Anti-self-citation constraint

Judge the plans on their merits against the embedded corpus. Do not treat the
injected artifacts as evidence about how councils, models, or this deliberation
behave.

## Amendment to the problem context — two maintainer decisions

Both are authoritative, both were made **after** the injected plans were
written, and neither is open for argument. No plan is expected to name them and
none should be criticised for their absence. What matters is which plans are
closest to them, and what each would have to change.

### The purpose, restated

> The goal is to preserve the sanctity of the user's saves and to empower them
> with the choice to make a decision about a conflict. Undoing that choice is
> also something a user should have the option to do. They likely aren't going
> to be going 8 steps back with the save, but may accidentally make the wrong
> choice with the conflict and want to undo that choice. That's going to be the
> primary use case.
>
> Some of the edge cases around card disconnection, and so on, are good to think
> about, but are edge cases that shouldn't constrain our approach unnecessarily.

So: reversibility is a first-class requirement, the depth that matters is one
step back rather than a version history, and an edge case may inform a design
but may not drive it. In particular, the argument that a capability must be
given up *because* a detached or unmounted card is indistinguishable from a
deliberate deletion is not on its own sufficient. Failing closed on an
unexplained absence is cheap and is still expected; abandoning a capability to
buy it needs a better reason than the edge case alone.

### Where the undo lives, and where it does not

The plans divided on whether version one ships a control the player can press.
The maintainer has settled it:

> I don't want to add more complexity to the user during conflict resolution.
> The goal there is to get the user going as quickly as possible.

**Version one retains the discarded copy, on by default, bounded by a count, and
ships no undo control.** The wizard's done page says what was discarded and that
the copies are kept. Nothing in the resolution flow offers to put one back. A
plan that makes an on-device undo surface a version-one requirement is now
over-scoped, and a plan that builds lineage or receipt machinery deeper than one
step back is solving a problem the maintainer has said is not the primary case.

Restoring a discarded copy becomes a **separate tool**, tracked as its own
issue, and the maintainer has given it a shape:

> an option that allows you to essentially go back through conflict resolution
> flow and use it as a history restore flow, almost like a time machine, to
> overwrite the existing save with something from the past

That is the wizard's own compare-and-choose surface, pointed at a game's
retained past versions instead of at a live conflict, reached from outside the
moment of resolution.

**One consequence lands inside version one even though the tool does not.**
Nothing reads the discard store in version one, so nothing will catch a store
shape that a later reader cannot drive a picker from — one keyed only by a
timestamp, or one that drops which game, which slot, which device produced the
copy, and which side won. The store is designed now for a reader that does not
exist yet. Say whether each plan's retention design survives that requirement.

## Two questions this round must answer concretely

The plans have converged on the architecture. What is left divides into
differences a builder would have to *choose* between and differences that could
simply be *lifted* from one plan into another. Separating those two is the main
job of this round, and the following two questions are where the separation is
hardest.

**1. Walk the restore tool through each plan's retention store.** For every
plan, state literally what a later reader does to answer "show me the retained
past versions of *this game*, newest first, with a thumbnail, the producing
device, and which side won" — the path it opens, what it must read, and what it
must scan that it does not need. Say whether every field that question needs is
present at the moment of the discard, or whether the reader would have to
consult a manifest, an audit log or an apply record that the plan itself says
may be overwritten, rotated or removed by then. Do not accept a plan's own
assurance that its store is sufficient; trace it.

**2. Sort every remaining difference into liftable or architectural.** A
*liftable* difference is a rule, a field, a path shape or an ordering that could
be moved from one plan into another without disturbing anything else — say
which direction it should move. An *architectural* difference is one where
taking both is incoherent and a builder has to pick. Be strict: most
disagreements at this stage are liftable, and calling one architectural when it
is not is how a decision gets made by argument that should have been made by
integration. If you conclude that nothing architectural remains between two
plans, say so plainly.

## What this round is for

The plans have converged on the architecture. What remains are the places where
they still genuinely differ, the places where all of them agree without the
corpus having settled the point, and now the places where the maintainer's
decisions above cut against what a plan proposes.

- **Find the real disagreements.** Where two plans differ, say whether the
  difference is substantive or only wording. If substantive, state what evidence
  or experiment would settle it, and which way you think it settles.
- **Test the load-bearing claims again.** A confident error that survives into
  the built foundation is the most expensive thing that can happen here.
- **Say which plans the amendments cost, and how much.** Naming a version-one
  requirement the maintainer has just descoped is a real defect; so is retention
  the later restore tool could not read.
- **Name what each plan uniquely has.** For every plan, identify at least one
  element the others lack that would be a real loss if it were dropped, specific
  enough to be lifted verbatim.
- **Name what any plan has that should not be built.** This is a handheld
  running busybox with a five-second budget on the path a player watches.
- **Say which plan you would build from,** and what you would take from the
  others before building. You are not voting; you are making the case.

Where a plan has changed your mind since your own revision, say so and why.

Refer to plans by filename (for example `kimi-revised_plan-r3.md`), never by an
invented ordinal.

## Injected revised approaches

{INJECTED_REVISED_PLANS}

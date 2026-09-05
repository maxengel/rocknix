# Council — round 4, revised approach

You are one of five council members. You have each produced a revised approach
to the foundation for cloud-save conflict resolution in ROCKNIX, and the other
four have now reviewed all of them. The corpus is embedded above, unchanged and
hash-verified; those four reviews are injected below.

Now produce **your round-4 revised approach**: the foundation you would
actually build, having heard this second round of critique. This is the artifact
the council votes on next, so it must stand on its own — a reader should be able
to act on it without having read any analysis, review, or earlier revision.

## Anti-self-citation constraint

Reason about the substance on its merits, against the embedded corpus. Do not
treat the injected reviews as evidence about how councils, models, or this
deliberation behave.

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

## What this revision is, given where the round landed

The reviews you are about to read were asked to sort every remaining difference
between the plans into two kinds: differences that could simply be **lifted**
from one plan into another, and differences where taking both is incoherent and
a builder has to **pick**. Read what they concluded before you revise.

That framing decides what this revision is for. Where a difference is liftable
and a reviewer said it should move into your plan, **move it** — do not argue
for your own wording of the same rule. Where a reviewer says it should move out
of your plan, take it out or say why the reviewer is wrong on the substance.
Prose ownership is worth nothing here; the council is trying to converge on one
buildable document, and a difference kept only because you wrote it your way is
a difference that costs a builder time.

Where a difference genuinely requires a pick, that is the small set worth your
argument. Name each one, state the choice you make, and give the reason a
builder could act on. If you believe no such difference remains between your
plan and another, say so explicitly rather than implying it.

## What this revision must do

Three revisions have closed the easy distance. What remains are the places where
the plans genuinely disagree, and the places where all four agree without the
corpus having settled the point. Both are dangerous, and this round exists to
deal with them rather than to polish prose.

- **Settle, do not average.** Where the reviews identified a substantive
  disagreement, take a position and give the reason. If the evidence does not
  yet exist, say which experiment settles it and what your plan does in the
  meantime under each outcome. Do not adopt a compromise that no reviewer
  argued for.
- **Separate what the corpus settles from what the council merely agrees on.**
  A position held by everyone and evidenced by nobody is the most expensive
  kind of error, because no reviewer is left to catch it. Mark those explicitly.
- **Concede what was refuted**, naming the reviewer and the file, and correct
  it. A revision that quietly drops a refuted claim is worse than one that owns
  it. Where a review misread you, say so and make the argument better.
- **Adopt what others got right**, crediting them by filename. You are not
  scored on originality.
- **Refuse what the problem does not earn.** This is a handheld running busybox
  with a five-second budget on a path the player watches. Where a reviewer or a
  plan proposes machinery beyond that, say so and cut it.
- **Keep the load-bearing separable from the optional.** Get the load-bearing
  parts wrong and the milestone is unsafe; the rest can follow later. Make the
  boundary explicit.
- **State decision changes explicitly.** If your approach requires reopening a
  decided register row, name the ID, state the change as a new refinement
  citing the old row, and give the argument. If it needs no reopening, say so.
- **Pay the amendments.** If your plan named an on-device undo surface as a
  version-one requirement, remove it and re-home its design to the separate
  restore tool. If it carries lineage, generation tracking or receipts deeper
  than one step back, justify each against the maintainer's stated primary
  case or cut it. State plainly what your retention store records, and whether
  a later restore tool could drive a picker from it.
- **Be honest about what is still unmeasured**, and name the experiment that
  settles each hypothesis about rclone, bisync, RetroArch, a backend, or the
  hardware.

Refer to members and artifacts by filename (for example `gpt-analysis.md`,
`kimi_peer_review-r4.md`), never by an invented ordinal.

## Injected peer reviews

{INJECTED_PEER_REVIEWS}

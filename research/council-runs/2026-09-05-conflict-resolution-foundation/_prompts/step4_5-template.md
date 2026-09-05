# Council — consensus integration

The council has settled on a base. `claude-revised_plan-r4.md` is that base, it
is injected below, and **you are not re-opening the choice**. Your job is to
produce `consensus_plan.md`: the base, with the other plans' contributions
integrated where they fit, and the ones that genuinely conflict listed as
conflicts rather than blended into false agreement.

The four members' closing assessments of the field are injected after the base.
Read them for the provisions they say should travel and for the defects they say
the base still carries. Judge those on their merits against the embedded corpus.

## Anti-self-citation constraint

Reason about the substance against the embedded corpus. Do not treat the
injected artifacts as evidence about how councils, models, or this deliberation
behave, and do not describe or characterise the process that produced them.

## Two maintainer decisions bind this document

### Reversibility, and where it lives

> The goal is to preserve the sanctity of the user's saves and to empower them
> with the choice to make a decision about a conflict. Undoing that choice is
> also something a user should have the option to do. They likely aren't going
> to be going 8 steps back with the save, but may accidentally make the wrong
> choice with the conflict and want to undo that choice. That's going to be the
> primary use case.
>
> Some of the edge cases around card disconnection, and so on, are good to think
> about, but are edge cases that shouldn't constrain our approach unnecessarily.

> I don't want to add more complexity to the user during conflict resolution.
> The goal there is to get the user going as quickly as possible.

Version one retains the discarded copy, on by default, bounded by a count, and
ships **no undo control**. Restoring one is a separate tool with its own issue,
shaped as the wizard's compare surface pointed at a game's retained past
versions. The store is designed now for that reader; nothing in version one
reads it, so nothing will catch a shape the tool cannot use.

### Cost discipline — new, and binding on every fix below

> Those concerns seem valid. We need to not overcomplicate our solution in a way
> that adds undue complexity, computational, and memory overhead to our
> processes.

This is a handheld: busybox, an SD card doing the writing, and a five-second
budget on the path a player watches after exiting a game. So:

- **Name the cost of every safeguard you adopt** — process spawns, remote round
  trips, bytes copied, bytes held in memory, files kept on the card — and say
  what it buys. A safeguard whose cost you cannot state has not been designed.
- **Prefer the form that removes a rule over the form that adds one.** Where
  holding a case rather than promoting it makes the design smaller, that is the
  better fix, not the more cautious one.
- **Do not buy a guarantee the one-player model does not need.** Machinery for
  simultaneous writers, deep lineage, or version graphs is out.
- Where a fix genuinely costs something and is still worth it, say so plainly
  and state the price. One such fix is named below.

## The blockers the base must clear

The closing assessments identify defects in the base that must be fixed here,
not deferred. At least these:

1. **Capture must not hard-link a save into staging.** A hard link shares the
   inode, so an emulator writing a battery save in place afterwards changes
   bytes already treated as sealed and hashed. Require an independent copy, and
   upload the same bytes that were hashed. *This one costs real work per changed
   save at exit; state the price and pay it.*
2. **Testing that the session lock is free is not holding it.** Specify an
   acquisition-and-hold contract with an explicit lock order, and show that
   capture's independence from the transfer lock cannot deadlock.
3. **Repeated observation is not evidence of completeness.** The base promotes
   an incomplete or mismatched declared multi-file unit to an unknown-provenance
   one-way transfer after two unchanged full passes. An interrupted upload stays
   identically incomplete indefinitely. Remove the promotion and hold the unit,
   while letting unrelated work proceed.
4. **Distinct local backup and restore roots are a shipped, documented
   configuration**, not a hypothetical. Either support the two roles explicitly
   or fail closed for that configuration; never silently treat them as one tree.
   Carry the context binding to pending operations, not only to the agreement
   record.

Work through the closing assessments for any further defect of the base and
treat it the same way. Where a fix is claimed but its cost is not stated, state
it.

## Required shape

```markdown
# Consensus integration plan

## Winning plan as base

## Dissent primitives integrated into the base

## Dissents that conflict with the base

## Step 5 handoff content
```

Under **integrated**, credit each provision by the filename it came from and say
in one line what it costs. Under **conflict**, state both positions and why they
cannot both hold; do not resolve a genuine conflict by averaging. Under
**handoff**, give what the issues need: the load-bearing requirements, the
acceptance conditions, the ordered experiments, and the register rows that need
the maintainer's word — marked as proposals, since register IDs are the
maintainer's to assign.

Keep every claim's marking: what the corpus settles, what is a council position,
and what is unmeasured with the experiment that settles it.

Refer to members and artifacts by filename, never by an invented ordinal.

## The base

{INJECTED_BASE}

## Closing assessments

{INJECTED_VOTES}

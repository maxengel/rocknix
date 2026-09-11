# Council -- consensus integration

The council has settled on a base. `claude-revised_plan.md` is that base, it is
injected below, and **you are not re-opening the choice**. Your job is to produce
`consensus_plan.md`: the base, with the other plans' contributions integrated where
they fit, and the ones that genuinely conflict listed as conflicts rather than
blended into false agreement. The four losing revised plans are embedded above
this brief with the corpus, hash-verified, so you can take a provision from its
source rather than from a ballot's summary of it.

The five members' closing assessments are injected after the base. Read them for
the provisions they say should travel and for the defects they say the base still
carries. Judge those on their merits against the embedded corpus.

## Anti-self-citation constraint

Reason about the substance against the embedded corpus. Do not treat the injected
artifacts as evidence about how councils, models, or this deliberation behave, and
do not describe or characterise the process that produced them.

## The maintainer's decisions that bind this document

The decided register rows D-CLOUD-095..100, D-UI-039, D-QA-015/017 and the plan
of record's rows (in `decision-register-excerpt.md`) are binding. And, given after
the vote, on 2026-09-11, the steer that decides every trade below:

> It seems like if we were to optimize for time to play and minimize bandwidth and
> the number of back-and-forth exchanges, a hybrid is needed. We don't want to have
> to deal with making sync take longer than it should, while obviously balancing
> the sanctity of a game save.

So the invariant of the base -- nothing becomes the current save in the cloud, and
nothing leaves it, unless that version is already in the store -- is the floor, and
**above that floor the cheapest sufficient form wins**: fewest round trips, fewest
bytes over the handheld's Wi-Fi, no operation on the launch path, and an exit sync
no longer than the store's invariant strictly requires. Where the base and a losing
plan meet the floor equally, take the cheaper one and say so.

## Cost discipline, binding on every provision

This is a handheld: busybox, an SD card doing the writing, a Wi-Fi link, and the
two time-to-play numbers of D-CLOUD-098 (interface -> first frame; exit -> next
first frame) measured by the runner on every image.

- **Name the cost of every safeguard you adopt** -- round trips, bytes up and down,
  process spawns, files on the card, seconds on the exit sync -- and what it buys.
- **Prefer the form that removes a rule over the form that adds one.**
- **Do not buy a guarantee the one-player, few-devices model does not need.** No
  lease, no lock service, no version graph.
- **Nothing new on the launch path.** State for each provision whether it runs in
  the exit sync (cancellable by a launch), in a full pass, or never on the device.

## The blockers the base must clear

The closing assessments name defects in the base that must be fixed here, not
deferred. At least these:

1. **The transaction shape.** Bytes first, record last, the record is the commit
   point; an entry without a valid record is an orphan swept on full passes;
   dedupe against the newest entry; copy, never move, for anything that leaves the
   head. State the interrupt outcome at each point.
2. **Deferral as a pair under the admission ceiling.** A publish never goes out
   ahead of what protects the version it displaces; both defer together; the
   ceiling counts store bytes.
3. **Reserve the newest deliberate conflict loser** from routine count pruning.
4. **A decided deletion is not an unexplained absence.** "Never a game's only copy"
   must not make every REMOVE EVERYWHERE result a permanent, cap-exempt entry.
5. **Every stored byte counts against the 256 MiB cap**, or the exemption is
   stated with its measurement.
6. **Shared settings on a shared store.** What one device's count, and OFF, mean
   for the others -- the cheapest sufficient rule.
7. **The `--delete-excluded` audit** of every shipped command and the user's
   RCLONEOPTS path, as a requirement with an experiment, not a residual.
8. **Migration**, in full: today's `Saves-replaced/<stamp>/` folders and the
   device-local `.cache/cloud_sync/replaced/`, folded copy-verify-retire, the
   legacy events classified honestly, no question to the player, and a
   mixed-version fleet boundary.
9. **The `in_store` flag's fragility** when device state is cleared: how a full
   pass repopulates it.
10. **The freshness cost of a longer exit sync**: a launch cancels it more often,
    so more publishes defer and the other device sees a staler cloud. Bound it,
    measure it (#135's cell, store-first against the plain delta, on WebDAV and
    on SFTP), and say what the player sees.

Work through the closing assessments for any further defect and treat it the
same way. Where a fix is claimed but its cost is not stated, state it.

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
**handoff**, give what the issues need: the load-bearing requirements in build
order, the acceptance conditions, the ordered experiments with the hazard each
exposes, the changes to #22 R1-R9, #23 and #25 stated row by row, and the
register rows that need the maintainer's word -- marked as proposals, since
register IDs are the maintainer's to assign.

Keep every claim's marking: what the corpus settles, what is a council position,
and what is unmeasured with the experiment that settles it.

Refer to members and artifacts by filename, never by an invented ordinal.

## The base

{INJECTED_BASE}

## Closing assessments

{INJECTED_VOTES}

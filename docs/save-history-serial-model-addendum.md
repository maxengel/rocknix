# Save history under the serial-use model -- what D-CLOUD-102 changes

Maintainer, 2026-09-12: *"we can assume that sync is never happening between two
boxes or consoles at the same time. The goal is not to allow two consoles to be
sharing the same save at the same time. The primary use case is someone switching
from one console to the other ... If anything, we would want to prevent concurrent
usage of the same save directory."*

The council run of 2026-09-11 (`research/council-runs/2026-09-11-save-history-one-home/`)
was commissioned without this constraint, and a good part of its deliberation went
to the two-devices-publishing-at-once race: GPT's counterexample in Step 2, the
store-first invariant's strongest argument in Steps 3 and 4, the ancestry test
(F14), the two-pruner rules (B6, E6) and the E5 experiment. This addendum states
what the constraint changes and what it leaves, so the maintainer can decide how
the plan is amended.

## What the constraint removes

| In the consensus plan | Under D-CLOUD-102 |
| --- | --- |
| Escrow on every publish, justified by "a version is in the cloud the moment it is acknowledged, even under a race" | The race is prevented, not reconciled, so escrow's concurrency argument is gone. What remains of its case: 2× bytes instead of 3× on hashless backends, and recovery of the accidental overwrite by construction. Both are also met by **retain-from-stage** (below). |
| F14, the disguised race reclassified by an ancestry test | Not needed; a second device that publishes over a version it never restored is the ordinary both-changed conflict R4 already sends to the wizard. |
| B6's concurrent-pruner rules and E6 | Downgraded to a defensive check; only one device prunes at a time by assumption. |
| E5 (two devices through the barrier schedule) | Replaced by E5': the hand-off schedule -- A exits, B starts, B restores, B plays, B exits, A starts -- with no lost version and no false conflict. |
| GPT's recorded residual (a version unrecoverable until the next retain) | Moot in serial use: the device about to overwrite the head is the device that restored it, so it holds the old bytes in its stage. |

## What the constraint gives: retain-from-stage

In serial use, the device that is about to publish a change is the device whose
startup sync restored the cloud's current version, so its capture stage holds that
version's bytes (D-CLOUD-078: content-addressed copies of every save the manifest
claims). The old head therefore never has to be copied cloud-to-cloud: **retain the
old version from the stage into `.history/` (one upload of S), then publish the new
one (one upload of S).** Two uploads of S in total, the same as store-first, with a
store that holds only *displaced* versions -- fewer entries, no `in_store` flag, and
the delta's original shape. When the stage lacks the old version -- the first pass
after cutover on a legacy head, or a device that skipped its restore and is about to
overwrite a version it never had -- that is exactly R4's both-changed case, and the
wizard's loser path retains the cloud copy. Nothing new is needed for it.

Cost per changed save at exit: one extra spawn and one extra upload of S, on every
backend alike; no download; nothing on the launch path. This is the "hybrid" the
maintainer asked for: the delta's simplicity with the council's transaction shape
(bytes first, record last, dedupe, copy never move, deferral as a pair).

## What the constraint does not ask for: a lock

Maintainer, 2026-09-12, thinking it through: *"whether now or with the future
conflict resolution, we actually try to, via hidden files or hidden directories, let
another client know when there may need to be a lock file of some sort placed on a
game while it launched. Maybe this is too restrictive and would be aggravating
because we're babysitting the user's gameplay and conflict resolution can take care
of this."* It would be, and it has a failure mode worse than the problem: a console
that dies mid-game, or goes offline, leaves a lock the other console honours until
somebody clears it. **No lock, no marker, no hidden file** (D-CLOUD-103).

The prevention rule an earlier draft of this addendum proposed is also unnecessary,
and is withdrawn. The case it guarded -- a console that publishes without having
restored, because the commute had no network -- is already the classifier's
both-changed case (R4): the cloud changed since this console's agreement and this
console changed too, so the wizard shows both. A console that is behind with no
local change is simply restored by the startup sync. Nothing new is needed.

## What the constraint gives conflict resolution

*"The bigger point is for conflict resolution to assume that serial play is the
dominant way in which saves are being drafted ... one person isn't playing the same
game at the same time in two places."* So when the wizard does show two versions,
they were made in sequence by one person: the home console's after the commute
console's, or the other way round. Two things follow, and one question:

- **Order them by publish sequence, not by clock.** Each version's `<seq>` and its
  manifest entry say which console published it and after which agreement. The
  wizard can say *played later on <console>* and *played earlier on <console>*
  truthfully, where today it can only say *cloud* and *this device*. Clocks stay
  untrusted; the sequence is causal.
- **Both versions are real progress**, so KEEP BOTH and the retained loser matter
  more, not less: the realistic conflict is a commute session that never synced
  meeting an evening session at home, and the player may want both.
- **The open question (D-CLOUD-103's open half):** may the wizard rest its cursor on
  the version played later, so the common case is one press? D-CLOUD-032's rule is
  that resolution never *defaults* to recency; a pre-selected cursor with the choice
  still the player's is a weaker thing than a default, but it is the maintainer's
  call.

## What the constraint leaves untouched

One hidden home inside the saves folder, declared in a README (D-CLOUD-095); the
transaction shape (B1); deferral as a pair (B2); the deliberate loser reserved (B3);
deletion vs absence (B4); every byte counted (B5); one fleet-wide setting with
last-edit-wins -- now trivially safe, since edits are serial (B6, P-1); the
`--delete-excluded` audit (B7); migration in full (B8); the freshness measurement
(B10, #135); the heal from the stage (F13, D-CLOUD-100); save states and
auto-states kept (D-CLOUD-099); the bounds (D-CLOUD-096); the reader (#25).

## The choice for the maintainer

1. **Amend by hand.** The session drafts the amendment to the consensus plan and the
   tracker text: retain-from-stage replaces escrow as the mechanism (the invariant
   "nothing leaves the head unless it is in the store" stands; "nothing becomes the
   head unless it is in the store" is dropped), F14/E5/E6 are replaced as above, no
   prevention rule, and the wizard orders the two sides by publish sequence. The
   maintainer reads it beside `final-issue-draft.md`. **Chosen 2026-09-12.**
2. **A short council follow-up** on one question -- *under serial single-writer
   use, is retain-from-stage plus the prevention rule the cheapest sufficient form,
   and what does it miss?* -- with this addendum and D-CLOUD-102 added to the
   corpus. Three to four hours; the five seats have the whole corpus already.

The session's recommendation is 1, with 2 held in reserve if the amendment's
reading raises a doubt: the constraint simplifies rather than complicates, and the
council's engineering (B1-B10) carries over unchanged.

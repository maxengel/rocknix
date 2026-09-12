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

## What the constraint asks for: prevention

"If anything, we would want to prevent concurrent usage." The cheapest sufficient
form uses what the plan already has. Every pass reads every device's manifest
(D-CLOUD-045). Each manifest records its device's last publish. So the reconciler
can see, at startup and before a publish, that **another device has published since
this device's agreement and this device has not restored it**. In serial use that
means the player picked up the second console without letting it sync. The plan
already sends the *changed-on-both-sides* case to the wizard; prevention adds one
rule ahead of it: **a device whose agreement is behind another device's publication
does not publish until it has restored** -- the startup sync's ordinary job -- and if
it cannot restore (no network), the card says so and the game plays on the local
save, with the publish deferred, not dropped. No lease, no lock object, no new
write: a read of manifests the pass already makes.

Whether the interface should also *warn* when a game is launched on a device that
is behind the cloud (a "your other console has newer saves" card, cancellable) is
the maintainer's call; it touches the launch path (D-CLOUD-098) and D-CLOUD-038's
gate.

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
   head unless it is in the store" is dropped), F14/E5/E6 are replaced as above, and
   the prevention rule is added to R4/R5. The maintainer reads it beside
   `final-issue-draft.md`.
2. **A short council follow-up** on one question -- *under serial single-writer
   use, is retain-from-stage plus the prevention rule the cheapest sufficient form,
   and what does it miss?* -- with this addendum and D-CLOUD-102 added to the
   corpus. Three to four hours; the five seats have the whole corpus already.

The session's recommendation is 1, with 2 held in reserve if the amendment's
reading raises a doubt: the constraint simplifies rather than complicates, and the
council's engineering (B1-B10) carries over unchanged.

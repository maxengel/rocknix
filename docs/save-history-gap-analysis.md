# Save history: what #11 covers, what it does not, and one home for both

Maintainer, 2026-09-11: *"So, saves replaced something that is permanent. It doesn't
make sense, even with our existing naming scheme, which is discarded saves. Is this
meant to be a permanent part of our structure? If so, we should think about whether
this is even the right way of handling it. ... having two different homes for two
different events is confusing. I'd recommend that we house these within the saves
folder if possible and include readmes, but they need to be named clearly. We could
even consider whether these should be hidden directories so users are not tempted to
touch them. We want to keep this all as simple as possible for the end user."*

## 1. What exists and what is planned

| Mechanism | Status | Where | Written by | What it keeps | Depth |
| --- | --- | --- | --- | --- | --- |
| `Saves-replaced/<run stamp>/<path>` | shipped (D-CLOUD-014, pruned since #105) | sibling of `Saves` | rclone `--backup-dir` on every backup | the cloud copy a backup overwrote, no metadata | one run (#132) |
| local `/storage/.cache/cloud_sync/replaced/<stamp>` | shipped | device | rclone `--backup-dir` on every restore | the device copy a restore overwrote | one run |
| `Saves-discarded/<unit>/<seq>/record.json + members` | planned, #22 R9 (D-CLOUD-036) | sibling of `Saves` | the reconciler, on a wizard decision | the losing side of a conflict, with sha256, producer, core, slot | per save, 1–9, default 3 (#23) |
| the restore tool | planned, #25 | device menu | reads the store | discarded saves; `-replaced/` copies "labelled separately" | -- |

So the plan as written institutionalises **two sibling folders with two names, two
shapes and two depths** for what a player experiences as one thing: *the version I had
before*. The maintainer's objection lands on the plan, not only on today's folder, and
this is the moment to change it, before #22 is built.

## 2. Gap analysis: what conflict resolution (#11) resolves

**Covered.** Two devices that both changed the same save since their last agreement.
The classifier (sha256 identity against local agreement) sees it, the wizard asks, the
loser goes to the store with its record, bounded per save, and #25 can bring it back.
The drawer-device case is this, provided the player played on the stale device.

**Not covered, and real regardless of #11:**

1. **A replacement nobody decided.** One side changed, so nothing is a conflict, and the
   cloud's previous copy is set aside by rclone with no record and for one run. Three
   daily-use shapes: a save truncated by a crash or power loss mid-write and sent by the
   exit sync; a device that restored a week-old copy and then played; a save state
   replaced on every exit of a game by design. In each the good copy survives until the
   next backup that replaces anything, on any device -- one play session on a
   pick-up-and-play handheld. (#132.)
2. **Nothing checks what is about to be published.** A battery save that shrank to zero
   bytes or filled with zeros publishes like any other change; the classifier tests
   identity, not validity. A format-aware sanity check (size within the format's known
   sizes, not all-zero, for the handful of formats the allowlist names) before a
   publish is a separate gate no issue holds yet.
3. **Save states churn the history.** Auto-states replace on every exit; with history on
   they dominate whatever store exists and push game saves out of a count-bounded one.
   Whether states get history at all, or only manual slots, is undecided.
4. **Two homes, two vocabularies.** `-replaced` and `-discarded` are our words for our
   events; the player has one word. #25 already has to explain the difference on its
   page.
5. **Self-hosted providers have nothing behind us.** Dropbox keeps 30 days of versions;
   WebDAV, SFTP and SMB (#133's matrix) keep nothing. Our store is the only history
   those users have.
6. **The public page does not show the layout.** `Saves-replaced` was never in front
   of anyone (documentation-accuracy gate).

## 3. Options for one home

| | A. Two siblings (the plan) | B. One hidden store inside `Saves` | C. Suffixed copies beside the file |
| --- | --- | --- | --- |
| Where | `Saves-replaced/`, `Saves-discarded/` | `Saves/.history/<unit>/<seq>/` | `Saves/<system>/Zelda.srm.bak-1` |
| Written by | rclone `--backup-dir` / the reconciler | **the reconciler only** (R1), retain-before-publish -- the ordering rule #25 already states | rclone `--suffix` |
| Metadata | none / `record.json` | `record.json` with `reason: discarded \| replaced \| deleted`, sha256, size, producer, device, time; a `README.md` at the root | none |
| Depth | one run / per save 1–9 | per save N (the #23 setting), plus an age cap and a total-size cap | per file N, script-pruned |
| Restore | #25 for discarded; "labelled separately" for replaced | #25 for both, the reason as the label | by hand |
| Hidden | no | dot-prefixed; excluded from restores by an allowlist rule ahead of `+ /savestates/**` (the `.snapshots` pattern R2 already carries) | no -- clutter beside every save |
| Cost | as planned | one small extra transfer per replaced save (copy the cloud's current version into the store before publishing); `--backup-dir` retired | filter rules so suffixed copies never restore to a device; a pruning sweep |
| rclone constraint | none | `--backup-dir` may not overlap its destination -- which is why the store is written by `copyto`, not by `--backup-dir` | `--suffix` is native |

**Recommendation: B.** It is what the maintainer asked for -- one home, inside the saves
folder, hidden, named plainly, with a README and a manifest -- and it costs the plan one
change: R9's store moves from a sibling to `Saves/.history/` and gains a `reason`, and the
reconciler retains the cloud's current copy before every publish, not only after a
wizard decision. `--backup-dir` goes; the one-run folder goes with it (after a grace
period for anything still in it). #25 reads one store and labels by reason. The count
setting stays the player's; the age and size caps are ours and bounded.

## 4. Open decisions (the epic's checklist)

1. One store, hidden, inside `Saves` (B) -- or a visible sibling with the same shape?
2. Retention: per-save count (the #23 setting; default 3 or 5?), age cap (90 days?), total
   size cap (256 MiB?) -- oldest first, and never the only copy of a game.
3. Save states: history for manual slots only, for none, or for all?
4. A publish gate: refuse or flag a save that shrank to zero or is all zeros, per format.
5. Interim, until #22 lands: widen `Saves-replaced` to N runs / D days (#132's option 1)
   so today's users have more than one session of protection.
6. Whether this design change goes through a council round before it is locked -- the
   #11 plan came out of one.

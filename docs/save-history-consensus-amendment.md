# Amendment to the save-history consensus plan under D-CLOUD-102/103

Applies to `research/council-runs/2026-09-11-save-history-one-home/revised_approaches/consensus_plan.md`
(the plan of record for #134) and to `final-issue-draft.md` (the tracker text), after
the maintainer's rulings of 2026-09-12: one console at a time (D-CLOUD-102); no lock,
and conflict resolution assumes serial play (D-CLOUD-103). Drafted by hand, the path
the maintainer chose; a council follow-up stays in reserve. Everything not named here
stands as the consensus plan has it.

## 1. The invariant, narrowed

| Consensus plan | Amended |
| --- | --- |
| **B-2 store-first, two halves:** *escrow* -- every publication uploads its version into the store before the head is written; *retain* -- a head not known to be in the store is copied into the store before anything overwrites or deletes it. | **Retain only.** *Nothing leaves the cloud's current save unless that version is already in the store.* The escrow half is dropped: with one console at a time there is no race that a pre-published copy protects against, and the accidental overwrite is covered by the retain. |
| Retain copies the head cloud-to-cloud (server-side where the backend can, streamed through the handheld where it cannot). | **Retain from the stage.** The console about to publish is the console that restored the current version, so its capture stage holds those bytes (D-CLOUD-078). The displaced version is uploaded from the stage into `.history/<unit>/<seq>/`, then the new version is published. Two uploads of S on every backend; no download; no server-side copy needed. |
| `in_store` per unit, derived from `store_seq` in the own manifest (B-3, B9). | **Dropped.** The retain runs whenever the head is about to be replaced and the stage holds the head's bytes; dedupe against the newest entry (B1) makes a repeat harmless. When the stage lacks them -- the first pass after cutover on a legacy head, or a console publishing over a version it never restored -- see §3. |
| B-5 / F14: the disguised race reclassified by an ancestry test. | **Dropped.** There is no disguised race to detect. |
| B6 concurrent pruners; E6. | **Downgraded to a guard:** owner-scoped deletion stays (a console deletes only entries carrying its own id), because it is free and it makes a mistaken concurrent run harmless; the two-pruner experiment becomes a regression cell, not a gate. |
| E5: two devices through the barrier schedule. | **E5', the hand-off:** A plays and exits (publish); B starts, restores, plays, exits (retain A's version from the stage, publish B's); A starts, restores. Asserted: `.history/` holds A's version once, B's head is current, no conflict shown, no duplicate entry, both consoles' time-to-play numbers within budget. Then the missed-sync variant in §3. |

The cost line (F12's ledger) becomes: per changed save at exit, **+1 spawn and +S up**
on every backend (the retain from the stage), plus the ~1 KiB record; no download, no
hashless re-fetch for the retained copy because its bytes are the stage's and their
hash is known. Nothing on the launch path. This is smaller than both the consensus
plan's escrow (+2 spawns, +S up; +3 and +S down on hashless) and the original delta's
cloud-to-cloud copy (+S down and +S up on hashless).

## 2. What is unchanged, and still load-bearing

B1 the transaction shape (bytes first, record last, the record the commit point, orphans
swept, dedupe, copy never move); B2 deferral as a pair under the admission ceiling, the
ceiling counting store bytes; B3 the newest deliberate conflict loser reserved; B4 a
decided deletion is not an unexplained absence; B5 every stored byte counted; B6's one
fleet-wide setting with last-edit-wins (now trivially safe -- edits are serial); B7 the
`--delete-excluded` audit; B8 migration in full, copy-verify-retire, `legacy` as the
honest label; B10 the freshness measurement in #135's cell; F11-F13, F15-F20 as
written, F13's heal from the stage in particular; the bounds and their priority
(D-CLOUD-096, P-2); the reader (#25) labelling by reason; the README at the saves
root and inside the store (D-CLOUD-095).

## 3. The missed sync, and what conflict resolution assumes

The realistic failure of the hand-off is a commute session with no network: the
commute console exits without publishing; the player plays the same game at home and
publishes; the commute console comes online and finds the cloud changed since its
agreement while it changed too. That is R4's **both-changed** case, and it goes to the
wizard as the plan of record already says. No prevention rule is added (D-CLOUD-103):
a console that is behind with no local change is simply restored by its startup sync;
a console that is behind with a local change is shown the two versions.

What D-CLOUD-103 adds is an **assumption the wizard may use**: the two versions were
made in sequence by one person. So, in #23:

- **Columns as the source has them; order shown, not swapped.** The cloud's version
  stays on the left and this console's on the right (D-CLOUD-041, D-CLOUD-104). Under
  each, one line says which console played it and whether it is the later or the
  earlier session -- *played later on <console name>* / *played earlier on <console
  name>* (D-NET-001's names) -- ordered by publish sequence, never by clock.
- **The cursor opens on the newer version** (D-CLOUD-104), whichever column it is in,
  so the common resolution of a missed sync is one press. D-CLOUD-032 stands: nothing
  is kept without that press, and the other version is retained in the store.
- **KEEP BOTH stays first-class.** Both versions are real progress; the retained loser
  and KEEP BOTH are the common resolution of a missed sync, not the edge case.

When the stage lacks the displaced version (§1, third row) and the case is *not*
both-changed -- the first pass after cutover on a legacy head -- the retain copies the
head cloud-to-cloud once, as the consensus plan's legacy retain did (one server-side
copy, or one download and upload on a backend without it), and marks the entry
`legacy`. That is a one-time cost per save at cutover, not a per-exit cost.

## 4. Changes to the tracker text (`final-issue-draft.md`)

- **#134 body, "the design on one screen":** replace the store-first paragraph with §1's
  invariant and mechanism; drop the ancestry test from the design; add the serial-play
  assumption and the missed-sync path from §3.
- **#134 experiments table:** E5 → E5' (hand-off, then the missed-sync variant); E6 → a
  regression cell; the rest unchanged.
- **#22 R5 (the exit push):** the ledger per §1's cost line; "retain from the stage,
  then publish"; the pair deferral unchanged.
- **#22 R4 (the classifier):** no new class; a note that the both-changed case under
  D-CLOUD-103 is the missed sync and is ordered by publish sequence for the wizard.
- **#22 R9 (the store):** entries are displaced versions (`replaced`, `discarded`,
  `deleted`, `suspect`, `legacy`); `published` is removed from the reason set; the
  `store_seq` manifest field (P-5) is not needed and is withdrawn.
- **#23 (the wizard):** the compare surface keeps its columns, gains the later/earlier
  line under each, and opens with the cursor on the newer version (D-CLOUD-104).
- **#25 (the reader):** unchanged, minus the `published` label.
- **Register proposals:** P-5 withdrawn; P-6's ledger replaced by §1's; P-12's residual
  narrows to the legacy cutover copy; the rest as drafted. P-14 (the cursor) is decided: D-CLOUD-104.

## 5. What this costs the player, stated

Interface to first frame: unchanged. Exit to the next first frame: unchanged in the
worst case; the exit sync is longer by one upload of the changed save's size and one
spawn, measured by #135 before the budget is set. A missed sync is one wizard page,
ordered so the later session is obvious, with KEEP BOTH beside the choice.

## 6. The launch rule and the stage, after the maintainer's review (2026-09-12)

D-CLOUD-109 replaces cancel-on-launch: a launch waits for an in-flight exit sync,
which bounds itself to a budget of a few seconds (#135) and past it ends with a
connectivity outcome; never minutes; time-based bounds; connectivity checks first.
D-CLOUD-110 shrinks the stage to the last-agreed-version cache: the new save is hashed
and uploaded from the ROM folder, since nothing writes it during the upload. The
retain from the stage and the heal from the stage (D-CLOUD-108) read that cache and
are unchanged. R6's "an automatic pass holding the lock is cancelled" becomes "is
waited for, to its budget"; #21's seal copy of the new version is dropped.

## 7. The heal, after the maintainer's review (2026-09-12)

D-CLOUD-114: the card names the emulator as the source of the corrupted file and says
it was replaced with the last known good version and kept with the earlier versions;
the suspect file's bytes are kept in `.history/` as a real version (F13's exact
descriptor is not enough -- the player may want to look at or restore the file), shown
by #25 as SET ASIDE AS DAMAGED. The second occurrence for a game still asks.


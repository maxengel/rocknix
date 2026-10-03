# Cloud layout and migration contract (#356)

Current source: the #383 remediation, with image qualification pending.
The step1 implementation now has a retained retry record and strict marker
validation. Host controls pass; the #356 image/upgrade/fleet criteria remain open.

## Implemented layout

The shipped defaults name `/Rasteratops/Saves`, `/Rasteratops/Backups`, and
`/Rasteratops/Content`. `/GAMES` and `/ROCKNIX/Saves` are recognized earlier
defaults; a custom path or an explicit empty content root remains deliberate.
`cloud_migrate_layout` derives the destination from the shipped defaults.
A populated backup tier can remain independently at its existing pointer.

The existing commands have separate responsibilities:

| Command | Implemented behavior |
| --- | --- |
| `--state` | reports configured pointers, classified folder state, current-folder existence and the marker text |
| `--join` / `--settle` | select a populated earlier saves layout when this device's default has no saves, or settle an empty setup; preserve independent settings/content choices |
| `--follow` | follow an existing current saves folder only when the previous saves folder has no files; do not strand a populated settings tier |
| `--keep` | remember the deliberate earlier-folder choice |
| apply | move tiers by copy, verify and source removal; a marked fleet destination may merge, preserving differing versions on the replaced shelf |

MOVE / KEEP USING / NOT NOW follow D-CLOUD-160. Merges follow D-CLOUD-168.
D-CLOUD-169 covers fresh/empty devices and clouds holding both roots; it does
not guarantee that an arbitrary old build understands a future layout.
Boot preparation precedes transfer and the dialog follows the actual card's
lifetime (D-CLOUD-173). Preparation moves pointers where allowed, not files.

The writer stores exactly `layout=2\n` at `/Rasteratops/.layout` after verified
completion or fresh seeding. The shared reader accepts only complete canonical
layout1/layout2 bytes; absent is a supported predecessor. Malformed and newer
markers refuse default-layout transitions before writes. Custom layouts elsewhere
are independent and seeding does not label them as the default layout.

## Numbered transition and recovery

`migration_step_1` is the explicit predecessor→layout2 dispatcher entry. A
layout2 marker can coexist with files an older device subsequently wrote in an
old root, so that device still takes step1 using the existing protected merge
behavior. There are no invented future steps; an unsupported version is refused.

Before tier mutation, `/storage/.config/cloud-layout-migration.json` records
schema1, step1, source/target versions, source paths, initial configured choices,
remote configuration fingerprint and progress. It is JSON, never sourced as shell.
The record is written through a temporary file, synchronized and renamed. Each
completed tier updates it and logs `migration step=1 from=1 to=2 stage=...`.
Retries re-check actual cloud bytes rather than trusting the stage as proof.
Normal OAuth token refresh is excluded from the fingerprint; other connection
changes or an unrelated pointer choice refuse recovery against a different scope.

Pointers still advance only after their copy verifies. The original paths remain
available even when live pointers now name the destination. A failed deletion or
marker publication reports failure and keeps the record. Publication is read back
before the record is removed. Repeating a completed move is harmless; a second
device without the mover's record follows the completed layout. This marker is
not a distributed lock or provider transaction.

`--needs-step` recognizes retained work. `--state` reports `migration-pending`,
which the interface offers as TRY AGAIN / NOT NOW. Join/follow do not rewrite the
unfinished mover's pointers, and setup cannot seed over it. A changed/corrupt
record fails closed. Image frames and power-loss qualification are still required.

## Compatibility and remaining acceptance

RC2 has no knowledge of this future protocol; documentation cannot change a
shipped binary. The VM qualification must identify that predecessor and prove
its actual upgrade behavior. A version-aware candidate presented a future marker
is a separate case. Setup/scan/move/follow are covered by the strict transition
boundary; this does not claim a new per-transfer network check on every direct
backup or restore. The actor/state map and image qualification must name those
boundaries explicitly.

`tools/rasteratops-cloud-layout-test` exercises real production scripts with the
image's rclone1.75.1 in local synthetic clouds. T26 covers malformed/future/extra
marker text through apply/follow/settle/seeding. T23 covers failure at every copy,
source deletion and marker publication, boot/scan retry visibility, retained
payloads, safe repeat and a follower without the mover's state. Before/after
receipts live under `docs/qa-logs/2026-10-03-m7-p1/`. These are host regressions,
not two-guest or clean-install/RC2-upgrade qualification. Actor × T01–T26 mapping and actual RC2/run101 partial-state host controls now
exist in `cloud-folder-state-table.md` and `../qa-logs/2026-10-03-m7-coverage/`.
Provider behavior, paired guests, upgrade application and actual guest recovery
remain open under #356/#365/#391.

## Recovery of state written before the local record (#391)

Actual RC2 and run101 scripts now create the upgrade fixtures. Earlier moves
could leave current primary pointers while the original content or discarded
shelf remained behind. Explicit move/preview recognizes only the known earlier
default content paths and owned discarded shelves, then uses the same recorded
copy/verify/delete/publication path. It does not treat an arbitrary custom
folder ending in `/Content` as one of the old defaults. Custom/root content
choices remain independent; an unmarked conflicting shelf is refused, and a
marked fleet merge retains both differing progress versions.

Current saves/backups pointers remain authoritative: recovering an earlier
shelf or content never reselects either old live tier. The optional
`source.discarded` field in schema1 retains the shelf independently; older
schema1 records derive it from their saved original saves source. A content-only
preview lists only content (or none when empty). An already-current explicit
apply can finish missing marker publication while retaining its no-move status
and the exact configured pointer spellings.

Known old content with current primary pointers is eligible for boot retry.
The folder scan also reports a remaining old shelf as pending. Marker-only
interruption has no local clue: explicit apply or wizard seeding can finish it;
no new per-sync marker probe or fabricated historical journal is introduced.
Host controls include a second interruption during recovery and exact old
script hashes. These controls do not replace the candidate upgrade rehearsal.

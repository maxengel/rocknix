# Cloud layout and migration contract (#356)

Current source: the #383 remediation, with image qualification pending.
This distinguishes the implemented layout2 transition from the general
versioned-migration contract requested in #356. The latter is not complete.

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

The writer currently stores `layout=2` at `/Rasteratops/.layout` after a move
or seeding. This is evidence of a fleet-created destination, not a lock or a
transaction commit. A later tier may refuse after earlier tiers completed;
those pointer changes must remain accurately visible and retries must preserve
both sides. #365/T23 still needs the image retry/fleet recovery receipt.

## Unfinished version contract

There is no dispatcher that walks numbered migrations yet.
`fleet_made()` currently accepts a line beginning `layout=` rather than
checking an exact supported version. The marker reader exposes the value but
does not establish general forward compatibility. RC2 has no knowledge of
this future protocol; documentation cannot make an already shipped reader
understand a new marker.

Before #356 can close, executable coverage and implementation must establish:

- explicit supported-version parsing, including malformed and newer markers;
- numbered transitions and journal entries, with retry behavior after each
  tier and a marker that never falsely declares an incomplete transition;
- a two-guest proof of each supported predecessor transition and follow;
- a defined refusal or safe read behavior for an unknown newer layout, with
  evidence that no older shape is recreated or unknown layout overwritten.

These are open criteria, not a disposition to ship them or a claim that the
existing host72-case suite covers them. The concrete current transition is
modeled in `cloud-folder-state-table.md`; every image receipt must name the
source build and the marker/configuration it exercised.

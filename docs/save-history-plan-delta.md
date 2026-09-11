# Save history: the delta to the council-derived #11 plan

Maintainer, 2026-09-11: *"I think we need to be crisp about what we're changing in the
council-derived plan and can take it and put it through another council run if
necessary."* This is the crisp list. Everything not named here stays as #21–#25, #35 and
the register rows D-CLOUD-030..053 have it.

## What changes

| Where | Today / planned | Change | Why |
| --- | --- | --- | --- |
| #22 R9, D-CLOUD-036 | store at `<SAVES_REMOTE>-discarded/`, written on a wizard decision | store at **`<SAVES_REMOTE>/.history/<unit>/<seq>/`**; `record.json` gains **`reason: discarded \| replaced \| deleted \| suspect`**; a **`README.md`** at `<SAVES_REMOTE>/` (and one inside `.history/`) says what the folder is and that the device menu restores from it | one home, hidden, declared (D-CLOUD-095) |
| #22 R1/R9 | retain the loser before the winner replaces it (wizard only) | **retain-before-publish for every publish that overwrites a cloud copy**, decided or not: `copyto` the cloud's current version into the store with a record, then publish | the replacements nobody decides are the common case (#132) |
| `cloud_backup`, `cloud_restore` | rclone `--backup-dir` to `-replaced/<stamp>` (cloud) and `.cache/cloud_sync/replaced/<stamp>` (device), one run deep | **retired** once the reconciler is the only writer (R1); until then unchanged (D-CLOUD-097: no interim) | one mechanism, with metadata |
| #22 R2 allowlist | `- /savestates/.snapshots/**` ahead of `+ /savestates/**` (a guard with no writer) | **`- /.history/**`** ahead of every include; `.snapshots` rule dropped | the store must never restore to a device or be mirrored away by a `sync` |
| #23 retention settings | KEEP DISCARDED SAVES (switch) · DISCARDED SAVES KEPT PER SAVE (1–9, default 3) on the cloud-saves page | the two rows **nest behind one row** (SAVE HISTORY) under SAVE MANAGEMENT, worded for the whole store (KEEP EARLIER VERSIONS OF SAVES · VERSIONS KEPT PER SAVE); age (90 d) and total (256 MiB) caps are **ours, not rows** (D-CLOUD-096, D-UI-039) | fewer rows in one window; one vocabulary |
| #25 reader | reads `-discarded/`, labels `-replaced/` copies separately | reads **one store**, the `reason` as the label (YOU CHOSE THE OTHER · REPLACED BY A SYNC · DELETED · SET ASIDE AS DAMAGED) | one story for the player |
| #22 R4 classifier | identity (sha256 vs local agreement) | adds a **`suspect`** class: zero length, or all one byte, where the previous version was neither -- **decision (4) pending:** auto-heal (keep the cloud's good copy, set the suspect one aside, tell the player in the game's words) or refuse and ask | a validity check has no home today |
| Save states | in scope of the store like any file | **decision (3) pending:** manual slots only, none, or all; auto-states (`.state.auto`) replace on every exit and would dominate a count-bounded store | churn vs. coverage |
| Public docs | layout not shown | the cloud-sync page shows the layout table with `.history/` and the README text | documentation-accuracy gate |

## What does not change

The classifier's identity rule, the wizard's questions and done page, the count setting
being the player's, "keep discarded saves" on by default and shallow (D-CLOUD-032), the
cloud as the store's home (D-CLOUD-036), the ordering rule *retain first, then install*
(D-CLOUD-041, #25), publications and retirements (D-CLOUD-047), the reconciler as the only
writer (R1), the transport (D-CLOUD-052).

## The question for the council, if it runs

*Given #11's plan as decided, does moving the retention store to one hidden folder inside
the saves folder, writing to it on every overwriting publish with a reason, and bounding
it by count, age and size, weaken any property the plan relies on -- and what does it
cost the time to play (D-CLOUD-098)?* Members read this file, `docs/save-history-gap-analysis.md`,
#22 R1–R9 and D-CLOUD-030..053.

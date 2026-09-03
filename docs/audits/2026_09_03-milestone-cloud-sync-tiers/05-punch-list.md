# Punch List — Cloud-Sync Tier Restructure (2026-09-03)

| PL | Sev | Category | Finding | Where |
| --- | --- | --- | --- | --- |
| PL-01 (resolved 2b626195d8) | **High** | Interaction Defect | #53 size verification disabled on every upgraded device | `cloud_backup:678` |
| PL-02 | **Medium** | Correctness | Staging pipeline masks collection failure; partial backup reports success | `backuptool:297` |
| PL-03 | **Medium** | Correctness | Music is backed up from the wrong path | `backuptool` DEFAULT |
| PL-04 | **Medium** | Coverage Gap | Four ES system paths are in no tier | `backuptool` DEFAULT |
| PL-05 | **Medium** | Test Gap | Leak scan word-splits member names, fails open | `backuptool:364` |
| PL-06 | **Medium** | Documentation Gap | Five user-visible changes with no rocknix.org update | #42 |
| PL-07 | Low | AC Drift | #56 AC 3 describes the superseded layout | issue #56 |
| PL-08 | Low | AC Gap | Wizard never states what it *will* create | `GuiMenu.cpp` done step |
| PL-09 | Low | Spec Drift | #58 AC 1 is unsatisfiable as written | issue #58 |
| PL-10 | Low | Test Gap | The `unsupported` branch has never produced output | `cloud_content_restore --scan` |
| PL-11 | Low | UX | `MY SELECTED SYSTEMS` is a dead end before any selection exists | `GuiMenu.cpp` + `--selected` |

---

## PL-01 — High — the #53 size verification is disabled

**What:** `cloud_backup:678` gates on `ls "${BACKUPFOLDER}"/*.zip "${BACKUPFOLDER}"/*.tar.gz`.
busybox `ls` exits non-zero when either glob is unmatched — the normal state now that
`backuptool` writes one format and rotates the other away. `local_sum` stays empty,
which gates off the post-upload size check at line 833.

**Why:** that check is the guard added for #53, where a backup reported success while
transferring nothing. This removes the detection for a shipped data-loss bug.

**Evidence:**
```
$ ls /storage/roms/backup/*.zip /storage/roms/backup/*.tar.gz >/dev/null 2>&1; echo $?
1                                    # only .tar.gz present
```
Expected: gate passes and `local_sum` is populated. Actual: block skipped.

**Fix:** use the shape the sibling loop at `cloud_backup:749` already uses —
iterate both globs with `[ -f "${archive}" ] || continue` and accumulate — rather
than branching on `ls`'s exit status.

**Acceptance:** with only `.tar.gz` present, a backup logs the size comparison and
writes `system-backup.uploaded`; a second backup skips the re-upload.

## PL-02 — Medium — staging pipeline masks collection failure

**What:** `backuptool:297` is `if ! tar -cf - -T list | tar -xf - -C staging`. No
`pipefail`, so the guard reads the extracting tar's status.

**Evidence (device):** first stage alone with a missing input → `exit=1`; with an
unwritable target → `exit=1`; the pipeline as written → `exit=0`, guard silent.

**Fix:** `set -o pipefail` around the pipeline, or test `${PIPESTATUS[0]}`.

**Acceptance:** a staging run that cannot read an input fails the backup instead of
writing a short archive.

## PL-03 — Medium — music backed up from the wrong path

**What:** `6785076383` added `/storage/roms/music/*`. ES's `music` system reads
`/storage/.config/gmu/playlists`; `/storage/roms/music` is an empty leftover.

**Fix:** add `/storage/.config/gmu/playlists/*`. Keep or drop the roms path
(harmless either way).

**Acceptance:** a playlist created in ES appears in the archive.

## PL-04 — Medium — four ES system paths are in no tier

**What:** `/storage/.config/{gmu/playlists,idtech,modules,scummvm/games}` are captured
by no tier. A ScummVM or idTech player loses their entries on restore.

**Fix:** add them to `backuptool` DEFAULT. Derive from `es_systems.cfg` `<path>`
entries outside `/storage/roms` rather than hardcoding, so the list cannot drift.

**Acceptance:** every ES `<path>` resolves to exactly one tier; a script asserts it.

## PL-05 — Medium — leak scan fails open on names with spaces

**What:** `backuptool:364` expands `${SCANLIST}` unquoted. Latent today (0/103 members
contain a space) and becomes live under user-installed theme paths.

**Fix:** feed member names via a loop or a NUL-safe list rather than word-splitting.

**Acceptance:** an archive with a spaced `.cfg` member and a planted credential warns.

## PL-06 — Medium — documentation not prepared

**What:** tar archives, the ROMs/BIOS layout, folder seeding, system selection and the
changed dialog text are all user-visible, with no `ROCKNIX/rocknix.org` change prepared.
`documentation-accuracy` calls this a hard gate before upstream.

**Fix:** extend #42 with these five, or open the docs PR.

## PL-07 — Low — #56 AC 3 describes the superseded layout

Still says `Content/bios` exists with per-system folders described-not-created.
D-CLOUD-018 replaced that with `ROMs/` + `BIOS/`. `issue-tracking.md` requires editing
the body in the same action as the superseding decision. **Fix:** edit #56's body.

## PL-08 — Low — the wizard never says what it *will* create

#56 AC 8 has two halves; only "what exists afterwards" shipped. **Fix:** add a
pre-statement to the configure step, or amend the AC to match what was built.

## PL-09 — Low — #58 AC 1 is unsatisfiable as written

Archives are built from `find -type f`, so no symlink member can exist to restore; and
tar fails on a *directory* member landing on a live symlink exactly as unzip does
(proven, exit 1). **Fix:** rewrite the AC to what tar actually buys — permissions,
ownership, and no skip-list.

## PL-10 — Low — the `unsupported` branch has never produced output

`--scan` emits `name|bytes|0` for a system this device cannot run. Only the `|1` branch
has been observed, so the marking is an assertion that has never had a chance to fail.
**Fix:** plant a cloud directory for a system absent from `es_systems.cfg` and confirm
the `0` flag and the ES row's note.

## PL-11 — Low — `MY SELECTED SYSTEMS` is a dead end before any selection exists

ES offers the row unconditionally; `--selected` exits 1 with "No systems are selected
for this device." No bad state results (the exit precedes the last-run stamp), but it
is a first-run dead end. **Fix:** gate the row on a selection existing, or make the
message send the player to the picker.

## Phase 7 — resolution gate

| Item | Outcome | Evidence |
| --- | --- | --- |
| PL-01 | **Resolved** | `2b626195d8`; verified on device — with one format present, `archives` collects 1 and `local_sum` is non-empty, so the #53 check runs |
| PL-02 | **Resolved** | `2b626195d8`; verified on device — pipeline now `exit=1` on an unreadable input |
| PL-03 | **Resolved** | `2b626195d8`; verified on device — `storage/.config/gmu/playlists/probe.m3u` present in a real archive |
| PL-04 | **Resolved** | `2b626195d8`; verified on device — `scummvm/games`, `gmu/playlists`, `modules` all present in a real archive |
| PL-05 | **Resolved** | `2b626195d8`; verified BOTH directions — fires on a planted credential in a spaced filename, silent on clean input |
| PL-06 | **Deferred** | to #42, with the five changes enumerated in a comment (`#42-comment-5520951697`) rather than left as "docs drift" |
| PL-07 | **Resolved** | #56 body edited; AC 3 now describes `Content/ROMs` + `Content/BIOS` and cites D-CLOUD-018 |
| PL-08 | **Resolved** | ES `031173f7eb` — the wizard states what it will write before listing what exists |
| PL-09 | **Resolved** | #58 body edited; the unsatisfiable AC struck through with the reason, replaced by the permissions/ownership criterion that tar actually delivers |
| PL-10 | **Deferred** | the harness gap is closed — `tools/cloud-round-trip` now plants a directory for a system absent from `es_systems.cfg` and asserts the `\|0` flag — but it has not yet **run**. Writing a test that would produce the output is not the same as producing it. Tracked on **#35** (round-trip QA on two VMs), which owns the execution. |
| PL-11 | **Resolved** | ES `031173f7eb` — both selected-systems rows offer the picker instead of an error when no selection exists |

Deferrals are named rather than silent, per the resolution-gate contract. The five code
findings — every one that would ship in an image — are resolved and device-verified.


---

**Audit issue:** https://github.com/maxengel/rocknix/issues/60

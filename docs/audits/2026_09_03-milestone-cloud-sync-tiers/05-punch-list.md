# Punch List — Cloud-Sync Tier Restructure (2026-09-03)

| PL | Sev | Category | Finding | Where |
| --- | --- | --- | --- | --- |
| PL-01 | **High** | Interaction Defect | #53 size verification disabled on every upgraded device | `cloud_backup:678` |
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

## PL-07 … PL-11 — Low

- **PL-07:** #56 AC 3 still describes `Content/bios` + README-described systems.
  D-CLOUD-018 superseded it; `issue-tracking.md` requires editing the body in the same
  action. Edit it.
- **PL-08:** #56 AC 8 has two halves; only "what exists afterwards" shipped. Either add
  a pre-statement to the configure step or amend the AC.
- **PL-09:** #58 AC 1 cannot be satisfied — archives hold only regular files, so no
  symlink member exists; and tar fails on a directory member over a live symlink
  exactly as unzip does. Rewrite the AC to what tar actually buys (permissions,
  ownership, no skip-list).
- **PL-10:** `--scan`'s `|0` unsupported branch has never produced output. Plant a
  directory for a system this device lacks and confirm it is marked.
- **PL-11:** ES offers `MY SELECTED SYSTEMS` before any selection exists; the script
  exits 1 with "No systems are selected". Gate the row on a selection existing, or make
  the message send the player to the picker.

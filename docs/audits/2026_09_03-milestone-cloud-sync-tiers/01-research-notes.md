# Research Notes — Cloud-Sync Tier Restructure

**Auditor:** Code Auditor skill · **Date:** 2026-09-03
**Subject:** commits `1cd78f4a6c`..`e98fdd84f7` + ES `00a258f9d7`
**Spec:** issues #56, #58, #59; decision register D-CLOUD-018..021

---

## The tier model as implemented

| Tier | Selector | Mechanism |
| --- | --- | --- |
| Saves | allowlist of patterns over `BACKUPPATH=/storage/roms` | `cloud_sync-rules.txt`, ends `- /**` |
| Content | dirs ES declares as systems (`<path>` under /storage/roms) + `bios`, minus saves-owned dirs, minus `SAVE_EXCLUDES` file patterns | `cloud_content_backup:list_local_dirs` + `SAVE_EXCLUDES` |
| System backup | explicit path list | `backuptool:DEFAULT[]` |

## F-01 — Four ES system paths are in NO tier (pre-existing, exposed by today's model)

Enumerated on a running H700 from the shipped `es_systems.cfg`:

```
/storage/.config/gmu/playlists      <- music
/storage/.config/idtech             <- idTech / Doom
/storage/.config/modules            <- tools
/storage/.config/scummvm/games      <- ScummVM game entries
```

Against the three tiers:
- **Saves** operates over `/storage/roms` only (`BACKUPPATH`) → out of range.
- **Content** requires the path to be under `/storage/roms` (`list_local_dirs`
  iterates `${DEST}/*/`, `DEST=/storage/roms`) → out of range.
- **System backup** covers `/storage/.config/{fancontrol.conf,backuptool.conf,
  system/configs,ppsspp,retroarch,moonlight,game}` and `${ESPATH}` bits. **None of
  the four.**

A player using ScummVM or idTech loses their game entries on restore, silently.

Pre-existing (backuptool never covered them), but in scope: today's work made the
tier model explicit and closed the `bezels`/`music`/`themes` gap while leaving these.

## F-02 — `6785076383` backs up the wrong location for music (introduced today)

That commit added to `backuptool:DEFAULT`:

```
/storage/roms/bezels/*
/storage/roms/music/*
/storage/roms/themes/*
```

But ES's `music` system reads `/storage/.config/gmu/playlists`, and
`/storage/roms/music` is a leftover directory — confirmed empty on the device and
absent from the `<path>` set. So the line backs up an empty directory while the
data it is named for is captured by nothing (F-01).

`bezels` and `themes` are not ES systems at all, so those two lines are the only
capture those directories have and are correct. Music is the miss.

**Verified:** `grep -oP '(?<=<path>)[^<]+' es_systems.cfg | grep -v '^/storage/roms/'`
returns the four paths above; `/storage/roms/music` does not appear in the `<path>`
set at all.

## F-03 — Staging pipeline masks collection failure; an incomplete backup reports success

`backuptool:297`:

```bash
if ! tar -cf - -T "${SENDLIST}" 2>/dev/null | tar -xf - -C "${STAGING}" 2>/dev/null
```

The script sets neither `set -o pipefail` nor `set -e` (verified: no match in the
file). A bash pipeline's status is the **last** command's, so the guard tests the
*extracting* tar, not the *collecting* one.

**Proven on the device, in three steps:**

| Probe | Result |
| --- | --- |
| first stage alone, one missing input | `exit=1` |
| first stage alone, unwritable output | `exit=1` |
| the pipeline as written, same missing input | `exit=0`, guard did not fire |

So the collecting tar reliably reports failure and the pipeline reliably discards it.
The second guard (`tar -czf ... -C staging storage`) only catches a *totally* empty
staging tree; a partial one produces a valid, smaller archive and a SUCCESS message.

Realistic triggers: disk full during staging (~17 MB on a near-full card), a read
permission error, or a file removed between `find` building FILELIST and the staging
tar reading it.

This is the project's recurring failure class — reporting success while having
transferred less than intended (#53; blindspot 13).

**Fix:** `set -o pipefail` for the pipeline, test `${PIPESTATUS[0]}`, or drop the pipe.

## F-04 — Leak scan word-splits member names; fails open on any name with a space

`backuptool:364`:

```bash
LEAKS=$(tar -xzOf "${BACKUPFILE}" ${SCANLIST} 2>/dev/null | grep -acE ...)
```

`${SCANLIST}` is unquoted, so a member name containing a space splits into two
non-existent members. busybox tar then errors (suppressed by `2>/dev/null`) and those
members are **not scanned** — the check fails open, which for a credential scan is the
wrong direction.

**Currently latent:** 0 of 103 scanned members contain a space in the archive built on
the device today. It becomes live the first time a `.cfg`/`.conf`/`.ini` path acquires
one — plausible under `${ESPATH}/themes/*`, which is user-installed content.

Note this was NOT a regression risk under the old `unzip -p '*.cfg'` form, which used
patterns rather than an expanded member list. The tar port introduced it.

## F-05 — HIGH — the #53 size verification is now disabled on every upgraded device

`cloud_backup:678`:

```bash
if ls "${BACKUPFOLDER}"/*.zip "${BACKUPFOLDER}"/*.tar.gz >/dev/null 2>&1; then
    local_sum=$(md5sum ...); local_bytes=$(cat ... | wc -c)
fi
```

busybox `ls` returns **non-zero when any argument is unmatched**, and an unmatched
glob stays literal in bash. Verified on the device: with only `.tar.gz` present,
`ls .../*.zip .../*.tar.gz` → `exit=1`. So the block is skipped and `local_sum` stays
empty.

**That is the normal steady state after this change.** `backuptool` writes `.tar.gz`
and rotates the previous archive into `archive/`, so `BACKUPFOLDER` holds exactly one
format.

Tracing `local_sum=""` downstream:

| Line | Consequence |
| --- | --- |
| 688 | skip-if-unchanged never fires → the 17 MB archive is re-uploaded every backup (wasteful, safe) |
| **833** | `[ -n "${local_sum}" ]` gates the **post-upload size verification** — it never runs |
| 854 | `uploaded_marker` never written, compounding line 688 |

Line 833's check is the guard added for **#53** — "cloud_backup reported a successful
upload while sending nothing, because the remote offered neither modtimes nor hashes
and rclone compared by size". This change silently switches it off.

The sibling loop at `cloud_backup:749` does it correctly:
`for archive in ...*.zip ...*.tar.gz; do [ -f "${archive}" ] || continue`. Line 678
needs the same shape rather than `ls`'s exit status.

**Severity: High.** Not data loss by itself, but it removes the detection for a
data-loss bug this project has already shipped once, on essentially every device, and
it does so invisibly.

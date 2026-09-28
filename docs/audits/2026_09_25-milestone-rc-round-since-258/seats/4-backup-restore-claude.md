# Council seat 4 — backup-restore: upstream audit of the fork-only diff `e9ff9dbd11..314e339bad`

## Summary

The bucket replaces the zip-based `backuptool` with a staged, verified, tar.gz settings archive: dated, device-labelled names; a pre-restore snapshot with a boot marker for revert; credential stripping for `system.cfg`, `es_settings.cfg`, `retroarch.cfg`, the emulators' RetroAchievements token files and the offline proxy folder; seed-identical pruning; rotation of previous archives into `archive/`; and a post-write leak scan. It also adds a `zip` target package with a gcc-14 configure patch. The read-both/write-new handling of every earlier archive shape (fixed-name zip, dated zip, dated `_BACKUP.tar.gz`, labelled `_SETTINGS.tar.gz`) is present in the hunk and is the strongest part of the work.

Three findings carry the bucket. First, every location list is expanded unquoted (`(${DEFAULT[@]})`, `find ${COMPRESSLOCATIONS[@]}`), so any backed-up path with a space — an ES custom collection named "Best Games", newly in the default list — is split, dropped by `find` with stderr discarded, and the run still says SETTINGS BACKED UP TO THIS DEVICE. Second, the "last line of defence" leak scan only prints a warning; the script exits 0, and by the diff's own account its output is discarded in the EmulationStation chain that immediately uploads the archive, so a detected credential goes to the cloud anyway. Third, the pre-restore snapshot is written through the same seed-pruning `write_archive`, so a failed restore that has already overwritten a stock file cannot put it back, while the screen says DON'T WORRY - YOUR SETTINGS ARE UNCHANGED. The `zip` package is orphaned by this very bucket (backuptool no longer calls `zip`), and several comments describe the code as it was rather than as it is.

## Findings

### F-BR-01: Unquoted array expansion silently drops every backed-up path that contains a space
- **Severity:** High
- **Category:** Data loss
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 +16,860 @@`: `COMPRESSLOCATIONS=(${LOCATIONS[@]})` and `COMPRESSLOCATIONS=(${DEFAULT[@]})` (three occurrences in the `backuptool.conf` block)
- `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, same hunk, `write_archive`: `find ${COMPRESSLOCATIONS[@]} -type f 2>/dev/null > "${FILELIST}"`
- `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, same hunk, `DEFAULT=(`: `$(find ${ESPATH}/themes/* -type d -maxdepth 0 ... 2>/dev/null)`
- **What:** The glob results in `DEFAULT` are correct single elements, but the copy into `COMPRESSLOCATIONS` and the `find` invocation both re-expand them unquoted, word-splitting any element with a space; `find` fails on the fragments, its stderr is discarded and its exit status is never read, so the file is omitted and the archive is announced complete.
- **Failure scenario:** Player creates an ES custom collection "Best Games" → `/storage/.config/emulationstation/collections/custom-Best Games.cfg` is matched by the new `${ESPATH}/collections/*` line → `COMPRESSLOCATIONS` holds `.../custom-Best` and `Games.cfg` → `find` prints "No such file" to `/dev/null` → the file is absent from `FILELIST`, the archive lists back whole (`tar -tzf`), the run prints `SETTINGS BACKED UP TO THIS DEVICE.` → on the restored device the collection is gone. Same for a bezel or theme directory with a space under `/storage/roms/bezels/*` / `/storage/roms/themes/*` (both new in `DEFAULT`), and for any custom `LOCATIONS` entry.
- **Evidence:** `COMPRESSLOCATIONS=(${LOCATIONS[@]})`, `COMPRESSLOCATIONS=(${DEFAULT[@]})`, `find ${COMPRESSLOCATIONS[@]} -type f 2>/dev/null` — no quotes, no `IFS` change. I looked for a later check of `find`'s status, a count of locations against `FILELIST`, or any `IFS=$'\n'` — none in the hunk. The removed code had the same mechanism (`zip -9 -r ${BACKUPFILE} ${COMPRESSLOCATIONS[@]}`), but this diff adds the exposed paths and adds the "whole or not at all" verification whose comment claims the property this defect breaks.
- **Fix:** `COMPRESSLOCATIONS=("${LOCATIONS[@]}")` / `("${DEFAULT[@]}")`; `find "${COMPRESSLOCATIONS[@]}" -type f`; build the themes list into the array with a loop or `mapfile -d ''` instead of `$(find ...)`; and treat a `find` that reported an unreadable location as `return 2` rather than sending its stderr to `/dev/null`.
- **Confidence:** high — shell word-splitting semantics visible entirely in the hunk.

### F-BR-02: The credential scan warns but the backup exits 0, and the chain that uploads never sees the warning
- **Severity:** High
- **Category:** Security
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 +16,860 @@`, `"backup")` branch, from `# Last line of defence` through `note "SETTINGS BACKED UP TO THIS DEVICE."`
- **What:** When `LEAKS -gt 0` the script prints a yellow warning, logs it, then continues to `sync`, prints two success notes and exits 0. There is no `why` line, no non-zero exit and no quarantine of the archive, so the archive stands under the name every `.tar.gz` glob matches.
- **Failure scenario:** A config file in a custom `LOCATIONS` carries a live key the strips do not know → the scan counts it → `backuptool backup` exits 0 → the settings-tier chain the diff describes (`backuptool backup && cloud_backup --system-only`) runs `cloud_backup`, which (per the comment) uploads what `newest_backup` names → the credential is in the cloud, and the only trace is a console line the diff says EmulationStation discards.
- **Evidence:** `WARN="${LEAKS} LINE(S) IN THIS BACKUP LOOK LIKE PASSWORDS OR KEYS. ..."; echo -e ...; logger ...` followed directly by `sync` / `note "SETTINGS BACKED UP TO THIS DEVICE."`. The diff's own comments: "Last line of defence: the archive can be synced to the cloud, so never ship one carrying a populated credential", and, in `why()`, "This tool's output is discarded in EmulationStation's chains today". I looked for an exit code, a `.partial`/rename on detection, or a `why` line in this branch — none.
- **Fix:** On `LEAKS -gt 0` under `STRIP=1`: rename the archive to a suffix no reader globs (e.g. `.tar.gz.review`), print `why "THIS BACKUP MAY HOLD A PASSWORD OR KEY"`, `fail` with a distinct exit code, and have the chain treat that code as "do not upload". If the maintainers want the warn-and-continue behaviour for the console flow, gate it on a flag the chain does not pass.
- **Confidence:** high — control flow is fully in the hunk; the chain's behaviour is asserted by the diff's comments and `cloud_backup` itself is outside the packet.

### F-BR-03: Secret handling is a fixed name list plus a case-sensitive lowercase scan; any key spelled otherwise travels unstripped and unwarned
- **Severity:** High
- **Category:** Security
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 +16,860 @@`, `LEAKS=$(find "${SCANDIR}" ... -exec grep -hE '^(([a-z_.]*[_.])?(password|passwd|pass|token|secret|apikey|api_key|stream_key|access_key|secret_key|private_key|wifi_key)[0-9]*|key|[a-z_.]*\.key|Token|ApiToken|RA_Token|RA_Password) *[=:] *"?[^"[:space:]]+' {} +`
- `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, same hunk, `write_archive`: `sed -E '/^[^#]*\.(key|password|token)=/d' "${SYSCFG}"`; the `RATOKENFILES`, `RATOKENSETTINGS`, `RATOKENDIRS` arrays
- **What:** Everything that is stripped is named in advance; everything else relies on a scan whose prefix class `[a-z_.]*` admits no capital and whose capitalised alternatives are four literal words. The diff repeatedly describes `LOCATIONS=(/storage/.config)` as a supported configuration.
- **Failure scenario:** Under `LOCATIONS=(/storage/.config)`, a `.conf` line `PrivateKey = <base64>` or `PresharedKey = <base64>`: `^` then `[a-z_.]*` cannot consume `P`; `Token|ApiToken|RA_Token|RA_Password` do not match; result: not stripped, not counted, uploaded. Lowercase gaps too: `passphrase=x` fails because `pass` must be followed by `[0-9]*` then ` *[=:]`, and `p` is neither; `psk=`, `pin=`, `client_id` (correctly not a secret) vs `ClientSecret=` (secret, unmatched). In `system.cfg`, a key ending `.secret=` or `.passphrase=` survives the `sed` and the scan (whether such keys exist is outside the packet).
- **Evidence:** the regex quoted above; the comment "Named, not matched case-insensitively, so a catalogue's `Password = ...` stays out" — but the catalogues it names (PPSSPP `assets/lang/*.ini`) are already pruned by the `REGENERABLE` list before the scan runs, so the reason for case-sensitivity no longer applies to the scan set. I tried to find a hold-back by prefix for anything other than `raofflineproxy/`, or a `-i` — neither is present.
- **Fix:** Scan the config members case-insensitively (`grep -hiE`) with the word list extended (`passphrase|psk|preshared_?key|private_?key|client_?secret|access_?token|refresh_?token|auth`), and hold back by prefix the directories that hold key material rather than settings (as `RATOKENDIRS` already does for the proxy). Pair with F-BR-02 so a hit blocks the upload.
- **Confidence:** medium — the regex behaviour is certain from the hunk; which key-material files actually live under `/storage/.config` on a ROCKNIX device is outside the packet.

### F-BR-04: The revert copy cannot put back files a failed restore has already overwritten when they were seed-identical or outside the location list — and the screen says they are unchanged
- **Severity:** Medium
- **Category:** Data loss
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 +16,860 @@`, `"restore")`: `write_archive "${SNAPSHOT}" 0`
- `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, same hunk, `write_archive`: the `/usr/config/${REL}` `cmp -s` pruning loop (runs regardless of `STRIP`)
- `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, same hunk: `fail "THE RESTORE COULDN'T FINISH. DON'T WORRY - YOUR SETTINGS ARE UNCHANGED. TRY AGAIN."`
- **What:** The snapshot is bounded by the current `COMPRESSLOCATIONS` and pruned of every file byte-identical to `/usr/config`. The archive being restored may write files outside both sets. `tar -xzf SNAPSHOT -C /` therefore restores only part of what the failed extraction touched, and the message asserts a full revert.
- **Failure scenario:** Device B has a stock `retroarch.cfg` (identical to `/usr/config/retroarch/retroarch.cfg`, so pruned from the snapshot). Restore of device A's archive extracts A's customised `retroarch.cfg`, then tar fails on a later member (card full, I/O error). Revert extracts the snapshot — no `retroarch.cfg` in it — and the screen prints DON'T WORRY - YOUR SETTINGS ARE UNCHANGED while RetroArch now runs A's configuration. Same for any member the source's custom `LOCATIONS` covered but B's default list does not; and the boot-time `.restore-in-progress` revert (consumer outside the packet) has the same snapshot to work from.
- **Evidence:** `write_archive "${SNAPSHOT}" 0` — `STRIP` only gates the credential branches; the pruning loop (`if [ -f "/usr/config/${REL}" ] && cmp -s ...; then PRUNED=...; continue`) runs unconditionally. The comment "putting it back must give the player exactly the settings they had" is contradicted by the pruning comment "the image has it, so the backup need not" — the image has the seed, but the revert never re-copies the seed. I looked for a restore-side "reset pruned paths to seed" step or a snapshot built from the archive's member list — neither exists.
- **Fix:** Build the snapshot from the intersection of `tar -tzf "${BACKUPFILE}"` members with files that exist on disk (no seed pruning, no `LOCATIONS` bound), and record members that do not yet exist so the revert can delete them. Until then, the failure text must not claim "UNCHANGED".
- **Confidence:** high — every step is in the hunk.

### F-BR-05: Seed-identical pruning makes a restore non-authoritative on a device whose copy has diverged
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 +16,860 @@`, `write_archive`: the `REL="${F#/storage/.config/}"` / `cmp -s "/usr/config/${REL}" "${F}"` loop
- **What:** A file identical to the seed on the backing-up device is left out of the archive; on restore, nothing resets the target device's copy, so the target keeps whatever it had. "Restore settings" therefore does not make two devices match, which is the premise of the cross-device journey the diff describes.
- **Failure scenario:** Device A: stock `ppsspp.ini` (pruned). Device B: player-edited `ppsspp.ini`. B runs RESTORE SETTINGS FROM THE CLOUD from A's archive → `SETTINGS RESTORED.` → B still has its edited `ppsspp.ini`. A player who "reset to how it was on the other device" gets a mixture.
- **Evidence:** the pruning loop and its comment "the image has it, so the backup need not" — true for a freshly flashed device only. I looked for a manifest of pruned paths in the archive or a restore step that copies `/usr/config` over them — none.
- **Fix:** Either stop pruning files that are in the default list (they are small; the 16.4 MB was PPSSPP assets and the cheat DB, already covered by `REGENERABLE`), or write a `storage/.config/.backuptool-seeded` member listing the pruned relative paths and have restore copy the seed over each.
- **Confidence:** high on mechanics; whether upstream wants authoritative restore is a product decision, so this may land as documented behaviour rather than a fix.

### F-BR-06: Files outside `/storage` are collected into staging and then silently dropped from the archive
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 +16,860 @@`, `write_archive`: `tar -czf "${TARGET}.partial" -C "${STAGING}" storage`
- **What:** The collector strips the leading `/` and stages every path; the final `tar` archives only the `storage` subtree. Any custom `LOCATIONS` entry outside `/storage` is staged, not archived, and no count or warning notices.
- **Failure scenario:** `LOCATIONS=(/storage/.config/retroarch/* /flash/extlinux/extlinux.conf)` (a user keeping a boot tweak) → `${STAGING}/flash/extlinux/extlinux.conf` exists → `tar ... storage` omits it → `tar -tzf` lists back fine → SETTINGS BACKED UP. If *every* entry is outside `/storage`, `tar` fails on a missing `storage` operand and the run says THE BACKUP COULDN'T FINISH with no reason a player can act on.
- **Evidence:** `tar -cf - -T "${SENDLIST}" | tar -xf - -C "${STAGING}"` then `tar -czf ... -C "${STAGING}" storage`. I looked for a listing of `${STAGING}`'s top-level entries or a check of the send list against the archive's member count — neither exists.
- **Fix:** Archive `-C "${STAGING}" .` and accept `./storage/...` member names in every reader (they already extract at `/` correctly), or enumerate `${STAGING}`'s top-level directories; and compare `wc -l < SENDLIST` (adjusted for staged substitutions) with `tar -tzf | grep -vc '/$'` before renaming `.partial`.
- **Confidence:** high — busybox and GNU tar both strip the leading slash; the `storage` operand is literal in the hunk.

### F-BR-07: `ARCHIVED_*.zip` files the old code left at the backup root are never rotated or trimmed
- **Severity:** Medium
- **Category:** Upgrade path
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 +16,860 @@`, removed lines: `ARCHIVEFILENAME="ARCHIVED_${OS_NAME}_BACKUP-${TODAY}.zip"; mv ${BACKUPFILE} "${BACKUPFOLDER}/${ARCHIVEFILENAME}"`
- `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, same hunk, `trim_archive`: `"${ARCHIVEFOLDER}"/ARCHIVED_*.zip`
- `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, same hunk, `newest_backup`: the three globs
- **What:** The old script wrote `ARCHIVED_ROCKNIX_BACKUP-<yy-mm-dd_H_M_S>.zip` into `${BACKUPFOLDER}` (the root, `/storage/roms/backup`). The new `trim_archive` looks for `ARCHIVED_*.zip` only under `archive/`, where the old code never wrote; `newest_backup`'s globs require a `-${OS_NAME}_BACKUP.zip` suffix, which those names do not have; the `backup` verb rotates only `PREVIOUS=$(newest_backup)`. So every pre-existing `ARCHIVED_*.zip` stays at the root indefinitely, unbounded, and — per this diff's own description of the cloud allowlist as `backup/*.zip` — is matched by the upload filter.
- **Failure scenario:** Upgraded device with seven `ARCHIVED_ROCKNIX_BACKUP-*.zip` at `/storage/roms/backup/` → after any number of new backups, all seven remain; `trim_archive`'s `ARCHIVED_*.zip` glob never matches anything.
- **Evidence:** removed `mv ${BACKUPFILE} "${BACKUPFOLDER}/${ARCHIVEFILENAME}"`; new `ARCHIVEFOLDER="${SETTINGS_BACKUPS}/archive"` and the `ls -1 "${ARCHIVEFOLDER}"/ARCHIVED_*.zip` glob. The `upgrade-and-install.md` rule asks "an artifact written by the old code" be accounted for; the hunk's "Already written" reasoning covers the archive *formats* but not these files' *location*. I looked for a one-time sweep of `${SETTINGS_BACKUPS}/ARCHIVED_*.zip` into `archive/` — none.
- **Fix:** In the `backup` verb (or at script start), move `"${SETTINGS_BACKUPS}"/ARCHIVED_"${OS_NAME}"_BACKUP-*.zip` into `${ARCHIVEFOLDER}` re-stamped from `date -r` (the same treatment `PREVIOUS` gets), so the existing `ARCHIVED_*.zip` glob in `trim_archive` finally has something to match; idempotent and interruptible per the rule's migration section.
- **Confidence:** high — both the old write path and the new globs are in the hunk; whether the current cloud allowlist matches `backup/*.zip` is outside the packet.

### F-BR-08: `trim_archive` can delete the pre-restore snapshot it was just handed when the device clock is behind the archives' dates
- **Severity:** Medium
- **Category:** Data loss
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 +16,860 @@`, `"restore")`: `write_archive "${SNAPSHOT}" 0; case $? in 0) trim_archive ;;`
- `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, same hunk, `trim_archive`: the `sort -r | cut -f2- | tail -n +$((ARCHIVE_KEEP + 1))` pipeline keyed on the name's date
- **What:** The snapshot's name carries `BACKUP_STAMP` from the current clock; trimming keeps the three lexically newest names. If the clock reads earlier than the dates already in `archive/`, the snapshot sorts oldest and is removed immediately, before the extraction it exists to protect. `SNAPSHOT` and `RESTORE_MARK` still name it.
- **Failure scenario:** RTC-less handheld, clock at 2025-01-01 after a factory reset, `archive/` already holding three `2026_09_*` archives pulled from the cloud → snapshot `2025_01_01-...-PRE_RESTORE-...` written → `trim_archive` deletes it → `.restore-in-progress` points at a missing file → extraction fails or power is cut → `tar -xzf "${SNAPSHOT}"` fails → THE RESTORE COULDN'T FINISH, AND SOME OF YOUR SETTINGS COULDN'T BE PUT BACK; the boot-time verify has nothing to put back.
- **Evidence:** the `case $? in 0) trim_archive` immediately after writing; the key `k = (n ~ /^[0-9][0-9][0-9][0-9]_/) ? n : "0000_" n` and `sort -r`. The comment explains the date-keying choice (KILL3) but does not exempt the file just written. I looked for `SNAPSHOT` being excluded from the trim or for the trim running before the write — neither.
- **Fix:** Run `trim_archive` *before* writing the snapshot (bounding at `ARCHIVE_KEEP` plus one), or pass the snapshot path and `grep -vxF` it out of the trim candidates.
- **Confidence:** medium — the mechanics are certain; the frequency of a clock behind the archive dates depends on time persistence on RTC-less devices, which is outside the packet.

### F-BR-09: Every backup copies the whole content twice under `mktemp -d`, and the second copy is unnecessary
- **Severity:** Medium
- **Category:** Resource
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 +16,860 @@`, `write_archive`: `STAGING=$(mktemp -d)` / `tar -cf - -T "${SENDLIST}" | tar -xf - -C "${STAGING}"`
- `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, same hunk, `"backup")`: `SCANDIR=$(mktemp -d); tar -xzf "${BACKUPFILE}" -C "${SCANDIR}"`
- `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, same hunk, `DEFAULT=(`: `/storage/roms/bezels/*`, `/storage/roms/themes/*`
- **What:** Staging duplicates every file; the leak scan then extracts the *entire* archive again to grep three extensions, although `tar -tzf` has already produced the member list and busybox tar reads member names from a file with `-T` (which is exactly how the collector avoided the space-splitting the comment worries about). Both copies land wherever `mktemp` puts them (default `/tmp`). The default list now includes whole bezel and theme trees, which the diff itself says can run to hundreds of megabytes.
- **Failure scenario:** Player with a 400 MB theme under `/storage/roms/themes/` on a 1 GB device: staging writes 400 MB to `/tmp`; if `/tmp` is RAM-backed the device runs out of memory mid-backup (`fail` cannot even print); if `/tmp` is on `/storage`, the backup needs roughly 3× the content size free (staging + `.partial` + scan extract).
- **Evidence:** the two `mktemp -d` calls and the full-archive `tar -xzf` into `SCANDIR`; the comment "rather than expanding the member list into tar's arguments: unquoted, a member name containing a space split" — which `-T` avoids without extracting everything. I looked for `TMPDIR`/`-p "${SETTINGS_BACKUPS}"` or a size guard — none.
- **Fix:** `mktemp -d -p "${SETTINGS_BACKUPS}"` (same filesystem as the target, which also keeps `mv -f` atomic); for the scan, `printf '%s\n' "${SCANLIST}" > list; tar -xzf "${BACKUPFILE}" -C "${SCANDIR}" -T list`; consider `find ... -size -1M` or a documented cap for `/storage/roms/themes/*`.
- **Confidence:** medium — the copies are certain from the hunk; the mount type and size of `/tmp` on the image are outside the packet.

### F-BR-10: The `zip` package is orphaned by this bucket
- **Severity:** Low
- **Category:** Build/packaging
- **Where:** `packages/compress/zip/package.mk:1-24`
- `packages/compress/zip/patches/fix-compile-with-gcc14.patch` (whole file)
- `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 +16,860 @@`: `for TOOL in tar gzip`
- **What:** The package exists to provide `zip`, which the removed `backuptool` called. The new `backuptool` writes tar.gz and reads legacy zips with `unzip` (busybox); nothing in this diff references the `zip` binary or depends on the package. Shipping a 2008 codebase with a hand-edited `configure` for no consumer is cost without benefit. Separately: `PKG_DEPENDS_TARGET="make:host gcc:host bzip2"` (`package.mk:11`) is the pre-`toolchain` LibreELEC idiom, `make_target` passes no `LDFLAGS`, and `makeinstall_target` (`package.mk:20-24`) has mismatched indentation.
- **Failure scenario:** none demonstrated (build-time weight; a maintainer question, not a runtime fault).
- **Evidence:** `PKG_NAME="zip"`; no `zip` invocation anywhere in the new `backuptool`; the stale comment "busybox provides unzip but not zip" sits above a loop that checks `tar gzip`. I looked for any `PKG_DEPENDS_TARGET` adding `zip` in this diff — none; other buckets are outside the packet.
- **Fix:** Drop the package from this submission unless another bucket's package depends on it, in which case move it to that bucket and name the consumer. If kept, align the dependency line with ROCKNIX's current `package.mk` conventions (rule file not in the packet) and fix the indentation.
- **Confidence:** medium — certain within this bucket; a consumer elsewhere in the fork cannot be excluded from the packet.

### F-BR-11: Comments describe the previous code, not this one
- **Severity:** Low
- **Category:** Documentation
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 +16,860 @@`: `# Guard the tool this whole path depends on. busybox provides unzip but not zip, so a missing package means backup dies with a bare "zip: not found"` above `for TOOL in tar gzip`
- `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, same hunk: `# ... rotate the previous archive into an archive folder that the cloud allowlist (backup/*.zip) does not match` versus, in `write_archive`, `(every glob here and in cloud_backup ends in .tar.gz)`
- `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, same hunk: `# busybox grep -f with an EMPTY pattern file ... piping that into zip would hand it an empty list`
- **What:** Three comments name `zip` behaviour the code no longer has, and two comments give different shapes for the cloud allowlist. A reader (or the next auditor) cannot tell from the file which allowlist is live.
- **Failure scenario:** none demonstrated.
- **Evidence:** quoted above; the code beneath each checks `tar gzip`, writes `.tar.gz`, and pipes into `tar`, not `zip`.
- **Fix:** Reword the three comments to the tar flow; state the allowlist pattern once, in one place, matching `cloud_backup`.
- **Confidence:** high.

### F-BR-12: Player text: destination without tier, a reserved verb, an instruction the device cannot follow, protocol lines and tool stderr on the console
- **Severity:** Low
- **Category:** Player text
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 +16,860 @@`: `note "COPY IT SOMEWHERE SAFE, OR BACK UP TO THE CLOUD UNDER GAME SETTINGS > MANAGE CLOUD STORAGE."`
- same hunk: `WARN="${LEAKS} LINE(S) IN THIS BACKUP LOOK LIKE PASSWORDS OR KEYS. CHECK IT BEFORE SHARING IT OR SENDING IT TO THE CLOUD."`
- same hunk: `why() { echo ">>> why ${1}"; }` and every `why` call preceding `fail` on the console flow
- same hunk, tar branch: `tar -xzf "${BACKUPFILE}" -C / -X "${SKIP}" >/dev/null` (stderr not redirected)
- same hunk: `fail "THIS DEVICE'S SETTINGS BACKUP IS DAMAGED. NOTHING WAS CHANGED. BACK UP SETTINGS AGAIN."`
- **What:** (a) `es-player-text.md` § Four tiers: "The label says what and where" — BACK UP TO THE CLOUD omits the tier (SETTINGS). (b) Same section: the only verbs are *back up* and *restore*; "SENDING IT TO THE CLOUD" introduces a third. (c) "CHECK IT" asks the player to inspect an archive on a device with no file viewer (`es-player-text.md` § Anti-patterns, console-first). (d) `>>> why ...` is printed to the same console the player reads on the console flows — a protocol token the D-UI-028 table says a screen never shows. (e) On the tar branch a failing `tar` writes `tar: can't open 'storage/.config/...'` to the screen. (f) The DAMAGED advice is wrong for the fresh-device journey the diff describes: the newest archive may have come from the cloud, so "BACK UP SETTINGS AGAIN" on a device with nothing to back up neither fixes the damaged file nor tells the player to restore from the cloud again; and the damaged file stays newest until a later-stamped one exists.
- **Failure scenario:** none demonstrated for (a)–(e); for (f), fresh device with a truncated cloud download → every RESTORE attempt says DAMAGED and points at BACK UP.
- **Evidence:** strings quoted above against the rule text; the diff's own `why()` comment concedes the line is "shown verbatim on the console flows".
- **Fix:** "BACK UP SETTINGS TO THE CLOUD UNDER ..."; "CHECK IT BEFORE ... BACKING IT UP TO THE CLOUD" (or drop the sentence once F-BR-02 blocks the upload); route `>>> why` to a fd the ES page reads and the console does not; add `2>&1 >/dev/null | logger -t backuptool` around the extract; for (f) move the damaged file to `archive/` with a `.damaged` suffix and say "RESTORE SETTINGS FROM THE CLOUD AGAIN, OR BACK UP SETTINGS FIRST."
- **Confidence:** high — text and rule are both in the packet; menu names in (a) cannot be checked against the interface (0 interface files in this bucket).

### F-BR-13: `"${RATOKENDIRS[@]#/}"'*'` appends the wildcard to the last array element only
- **Severity:** Low
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 +16,860 @@`, tar branch: `printf '%s\n' ... "${RATOKENFILES[@]#/}" "${RATOKENDIRS[@]#/}"'*' > "${SKIP}"`
- same hunk, zip branch: `SKIP=(... "${RATOKENDIRS[@]#/}"'*')`
- **What:** With one element the result is `storage/.config/raofflineproxy/*` as intended; adding a second directory to `RATOKENDIRS` makes the first an exact-name pattern that matches no member, so that folder's token cache would be extracted on restore.
- **Failure scenario:** `RATOKENDIRS=(/storage/.config/raofflineproxy/ /storage/.config/other/)` → skip list gets `storage/.config/raofflineproxy/` (no `*`) and `storage/.config/other/*` → an archive written before the hold-back restores the proxy's cache.
- **Evidence:** bash appends adjacent literal text to the final word of a `"${a[@]}"` expansion only. The hold-back side (`grep -F "${CANDIDATE}"`) iterates the array correctly, so the two sides diverge as soon as the array grows.
- **Fix:** `for D in "${RATOKENDIRS[@]}"; do printf '%s\n' "${D#/}*"; done >> "${SKIP}"` (and the same for the zip `SKIP` array).
- **Confidence:** high.

### F-BR-14: Zip-branch member parsing truncates names at the first space, so a symlinked path with a space is not skipped and busybox unzip aborts
- **Severity:** Low
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 +16,860 @@`, zip branch: `for ENTRY in $(unzip -l "${BACKUPFILE}" 2>/dev/null | awk 'NF>3 && $4 ~ /^storage\// {print $4}')`
- **What:** `$4` is the first word of the name; `for ... in $(...)` splits again. `[ -L "/${ENTRY}" ]` then tests a path that does not exist, the entry is not added to `SKIP`, and the "exists but is not a regular file" abort the branch exists to prevent returns.
- **Failure scenario:** Legacy zip holding `storage/.config/emulationstation/themes/My Theme/theme.xml` where `My Theme` is a symlink on the device → parsed as `.../themes/My` → not skipped → unzip aborts → revert path (F-BR-04 applies).
- **Evidence:** the awk `{print $4}` and unquoted `$(...)`. Uncommon (needs a legacy zip and a symlink with a space) but the branch's stated purpose is exactly this class.
- **Fix:** `unzip -l ... | awk 'NF>3 && $4 ~ /^storage\// { $1=$2=$3=""; sub(/^ +/, ""); print }' | while IFS= read -r ENTRY`.
- **Confidence:** high.

### F-BR-15: No lock: two concurrent backups share the stamp and the `.partial` name
- **Severity:** Low
- **Category:** Concurrency
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 +16,860 @@`, `"backup")`: `rm -f "${SETTINGS_BACKUPS}"/*.tar.gz.partial 2>/dev/null`; `write_archive "${BACKUPFILE}" 1`
- **What:** The diff describes two entry points (the console flow and EmulationStation's chain/transfer page). A second run started in the same second targets the same `${TARGET}.partial`; the first run's `rm -f *.partial` removes the other's in-flight file, or the two `mv -f` clobber. Neither run detects the other.
- **Failure scenario:** ES chain and console `backuptool backup` within one second → one run's `tar -czf` writes to a path the other just unlinked → its `tar -tzf` on the unlinked inode still passes, `mv -f` fails → THE BACKUP COULDN'T FINISH with a working archive from the other run — or both succeed and one silently overwrites the other.
- **Evidence:** no `flock`, no pid file, no check of `.partial` age before removal. I looked for any lock acquisition in the hunk — none; `cloud_backup`'s lock (referenced by the rule text's "A SYNC IS ALREADY RUNNING") is outside the packet and does not cover this tool.
- **Fix:** `exec 9>"${SETTINGS_BACKUPS}/.backuptool.lock"; flock -n 9 || fail "A BACKUP IS ALREADY RUNNING. WAIT FOR IT TO FINISH, THEN TRY AGAIN."`; only remove `.partial` files older than a few minutes.
- **Confidence:** medium — the race is certain; how often two entry points coincide is a usage question.

### F-BR-16: Bluetooth pairing cache silently removed from the default list
- **Severity:** Low
- **Category:** Upgrade path
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 +16,860 @@`: removed `-    /storage/.cache/bluetooth/*` from `DEFAULT=(`
- **What:** Paired controllers were restored by every previous backup and are not by this one. The change is defensible (link keys are credentials, D-INFRA-010 as the diff cites it), but nothing in the diff says so, and the post-restore sentence names only Wi-Fi and account passwords.
- **Failure scenario:** Upgraded player restores on a new device, controller no longer pairs, message says nothing about Bluetooth.
- **Evidence:** the removed line; no comment beside it; `note "SETTINGS RESTORED. WI-FI AND ACCOUNT PASSWORDS ARE NOT PART OF A BACKUP AND MUST BE ENTERED AGAIN."`. The legacy zip branch still extracts `storage/.cache/bluetooth/*` from old archives, so behaviour differs by archive age.
- **Fix:** A comment naming the reason, and add "AND BLUETOOTH PAIRINGS" to the restore note (or restore the entry if the removal was accidental).
- **Confidence:** high.

### F-BR-17: "Nothing to back up" is reported as a failure that tells the player to try again
- **Severity:** Low
- **Category:** Player text
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 +16,860 @@`, `write_archive`: `if [ ! -s "${FILELIST}" ]; then ... return 2`; `"backup")`: `2) ... fail "THE BACKUP COULDN'T FINISH WHILE GATHERING YOUR SETTINGS. NOTHING WAS WRITTEN, ... TRY AGAIN."`
- **What:** Return 2 covers both "an input could not be read" and "every file was pruned as seed-identical / the list is empty". The second is not an error and retrying cannot change it.
- **Failure scenario:** A `backuptool.conf` that sources cleanly but does not set `LOCATIONS` → `COMPRESSLOCATIONS=()` → empty `FILELIST` → TRY AGAIN, forever.
- **Evidence:** the two `return 2` sites in `write_archive` and the single `2)` case in the caller.
- **Fix:** Return a distinct code (e.g. 4) for an empty list and say "THERE'S NOTHING TO BACK UP YET. YOUR SETTINGS ARE STILL THE STANDARD ONES."
- **Confidence:** high.

### F-BR-18: `SETTINGS_BACKUPS` is read from `cloud_sync.conf` without shell expansion
- **Severity:** Low
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 +16,860 @@`: `_configured=$(sed -n 's/^SETTINGS_BACKUPS="\{0,1\}\([^"]*\)"\{0,1\}$/\1/p' /storage/.config/cloud_sync.conf | head -1)`
- **What:** A value written with a variable reference is taken literally.
- **Failure scenario:** `SETTINGS_BACKUPS="${CONTENTPATH}/backup"` → `mkdir -p '${CONTENTPATH}/backup'` creates a directory literally named `${CONTENTPATH}` relative to the cwd, and every backup lands there while `cloud_backup` (which presumably sources the file) uploads from the real path — the exact mismatch the comment says this block was added to prevent.
- **Evidence:** the `sed` capture and `[ -n "${_configured}" ] && SETTINGS_BACKUPS="${_configured}"`. Whether `cloud_sync.conf` ever carries an unexpanded reference is outside the packet; the rule file names `CONTENTPATH` as a key in that file.
- **Fix:** Reject values containing `$` (fall back to the default and log), or source the file in a subshell and echo the variable.
- **Confidence:** medium.

### F-BR-19: `fail()` sleeps five seconds even when the caller asked for `--no-restart`
- **Severity:** Low
- **Category:** Player text
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 +16,860 @@`: `fail() { ...; sleep 5; exit 1; }`; `"backup")` end: `sleep 3`
- **What:** The diff says the transfer page has its own outcome to show and asked for `--no-restart` so the script would not take the screen; the failure and success sleeps still hold the page for 3–5 seconds with nothing to read.
- **Failure scenario:** none demonstrated beyond delay.
- **Evidence:** `NO_RESTART` is consulted only at the restore success tail; `fail` and the backup tail ignore it.
- **Fix:** `[ "${NO_RESTART}" -eq 1 ] || sleep 5` in `fail`; same for the trailing `sleep 3`.
- **Confidence:** high.

## Upstream fit

A ROCKNIX maintainer reading this as a pull request would push back on:

- **An unused package.** `packages/compress/zip` is added in the same change that removes the only `zip` call (F-BR-10). Either name the consumer or drop it. If kept, the `PKG_DEPENDS_TARGET="make:host gcc:host bzip2"` line and the OpenELEC copyright header read as a verbatim LibreELEC import; that is acceptable only if the file is verbatim and the project's `package.mk` conventions (not in this packet) allow the old dependency idiom. The gcc-14 configure patch has no provenance header; Info-ZIP is unmaintained so it cannot go upstream, but a one-line origin (Debian/Fedora patch name or "written here") is what a reviewer will ask for.
- **Fork vocabulary in an upstream file.** The `backuptool` comments cite decision IDs (D-UI-022, D-CLOUD-078, D-INFRA-010, D-RA-002…), fork issue numbers (#26, #45, #52, #105, #151, #165, #169, #221, #273), VM kill-test names (KILL3, KILL18), dated maintainer conversations and review dates. None resolves in the ROCKNIX tracker. The reasoning is good; the references have to become self-contained sentences or the comment block will be asked to shrink by two thirds.
- **Soft dependencies on fork-only components.** `backuptool` now reads `/storage/.config/cloud_sync.conf` (`SETTINGS_BACKUPS` / `BACKUPFOLDER`), probes `cloud_device_id --label`, writes `.restore-in-progress` for `chksysconfig verify`, `.restore-finish-pending` and `.cloud-journey-pending` for EmulationStation, and prints `>>> why` lines for a transfer page. Each degrades gracefully when the consumer is absent (checked in the hunk: `[ -x "${tool}" ]`, `[ -f cloud_sync.conf ]`, opt-in flags), but upstream will ask that the markers and the protocol line be documented or dropped, and that `--then-cloud` not ship without the cloud feature.
- **Scope beyond "backup and restore fixes."** The default list changes shape: `/storage/.cache/bluetooth/*` removed (F-BR-16), `/storage/roms/bezels/*`, `/storage/roms/themes/*`, gmu/idtech/modules/scummvm added, `es_*.cfg` narrowed to two files, path moved from `/storage/.emulationstation` to `/storage/.config/emulationstation`. Each is a behaviour change for every existing user and wants its own sentence in the PR description.
- **A credential scanner that does not gate anything** (F-BR-02). Upstream security review will treat "warn and upload" as no control; either it blocks or it should not be described as a last line of defence.
- **Commit hygiene** cannot be judged: the packet is a squashed range diff with no commit boundaries. The single hunk header for `backuptool` (`-15,54 +16,860`) suggests a rewrite; upstream will want it split into the format change, the credential handling, the rotation, and the text.

## Coverage boundary

Things this packet does not let me judge:

- **`cloud_backup` / `cloud_restore`** — the actual allowlist (the diff says both `backup/*.zip` and "every glob … ends in .tar.gz"), whether `archive/` and the unstripped `PRE_RESTORE` snapshots are excluded from *every* tier including any content sync that spans `/storage/roms`, how the chain reads `backuptool`'s exit status, and whether downloads are renamed on completion (bears on F-BR-02, F-BR-07, F-BR-12f).
- **`cloud_device_id --label`** — output shape and stability; `DEVICE_LABEL` is passed through `tr -cd 'A-Za-z0-9_-'` so the worst case is an empty label, which the name handles.
- **Consumers of the three marker files** — `chksysconfig verify` for `.restore-in-progress`, EmulationStation for `.restore-finish-pending` and `.cloud-journey-pending`. The `upgrade-and-install.md` rule asks whether each has a consumer; 0 interface files are in this bucket, so I cannot confirm.
- **EmulationStation's transfer page** — how it consumes `>>> why`, exit codes and `--no-restart`, and whether ES rewrites `es_settings.cfg` on its own way out after a restore (which would clobber the restored file before the reboot).
- **The image's busybox configuration and mounts** — `tar -T`/`-X`, `unzip -t`, `date -r`, `sed -E`, `cmp`, `flock`; whether `/tmp` is tmpfs and its size (F-BR-09); whether `/storage/.emulationstation` is a symlink to `/storage/.config/emulationstation`.
- **`/usr/config` contents** — which `/storage/.config` paths are seeded (drives F-BR-04/05), which are symlinks (`es_input.cfg`), and whether `system.cfg` carries keys the `\.(key|password|token)=` sed misses (F-BR-03).
- **Other fork scripts** — anything else depending on the `zip` package; `tools/vocabulary-check`'s allowlist for the new strings; `tools/vm-upgrade-rehearsal` seeds proving the zip→tar and `ARCHIVED_*.zip` upgrade paths; the "Already written" line the rule requires in each bug's code trace.
- **The packaging rule file** the brief refers to ("how a `package.mk` binds its variables late") was not embedded, so `packages/compress/zip/package.mk` was not checked against it. The full Info-ZIP `unix/configure` is also outside the packet, so whether the `generic` target executes test binaries under cross-compilation, or links `bzip2`, was not judged.

**Corpus read (as embedded by the Facilitator; not re-read or re-hashed here):**
`/workspace/repos/rocknix/docs/audits/2026_09_25-milestone-rc-round-since-258/seats/4-backup-restore.diff` — `afdfe5a267ed458189834034cd4b1a308ffb9dd06569760dc6b41e743a6c0b59`;
`/workspace/repos/rocknix/.claude/skills/code-auditor/references/anti-patterns.md` — `fd825c0505ae772ca2a6651eefe642581aaa147c254fed8cf50db1f8f1bde678`;
`/workspace/repos/rocknix/.claude/rules/upgrade-and-install.md` — `de4a683f9a36f9100e6fd98be11ad84d736f370374c40f74c445a2b81eca1995`;
`/workspace/repos/rocknix/.claude/rules/es-player-text.md` — `97c0816eabd3088ce94e3d45dec8042c1796afa3c295a9a8d080597ece817145`.
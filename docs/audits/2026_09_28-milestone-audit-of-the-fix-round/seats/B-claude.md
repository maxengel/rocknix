> Redacted by the orchestrator, 2026-09-28: credential-shaped example strings in this seat's prose (test fixtures and pattern examples the seat quoted) were replaced by `<credential-shaped example redacted>` so the file can be committed past the push guard (`.githooks/secret-patterns`); nothing else was changed.

# Council seat B — adversarial review of stream B's fix round (packet B)

## corpus.provenance.json

```json
{
  "packet": "B",
  "council_facilitator": "council-facilitator@1.2.0",
  "read_mode": "embedded-by-facilitator; no filesystem access; hashes recorded as verified at embed time",
  "manifest": "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/B.manifest.json",
  "manifest_read_timestamp_utc": "2026-09-28T13:57:25Z",
  "source_file_paths": [
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/B.diff",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/B.report.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/B.findings.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/B.items.md",
    ".claude/rules/engineering-practices.md",
    ".claude/rules/upgrade-and-install.md",
    ".claude/rules/es-player-text.md",
    ".claude/rules/rclone-cloud-sync.md"
  ],
  "source_file_hashes": [
    "ce7a0298ce2ae629427e243535c9c7183bc0a501f885e538325ff0f81440c140",
    "06984c781d54277555cc9bf8464279a79a7c7ca9c4582b0a21ba0cd798a8e126",
    "f03480bf2a5c951f3f5190b12c3eb2a3e7cab391423595d4e50ce1c97efcdff7",
    "979221ee3b4dc5723c27fddf02aac38365b734720a524830033d06f8bf62f5dc",
    "7f1eb012edc986ee2975abacb44f1a662f2a111a6ded1a1a623a84af509eef7d",
    "d79a1084e85117ba566d23af7fbf3633c44290a6c490f9125e1fd9df061f8cfd",
    "c401103eba4ada9d0e757a2b8522e7ed9558a17eb4da72b65615795163f33c86",
    "62478bddb5b706a91f7d9f6900eeffc46b06a6aacdcfc0d554ba17465035001c"
  ],
  "sources_not_embedded_that_were_needed": [
    "cloud_backup (its SETTINGS_BACKUPS read and its --include, cited by backuptool's comments)",
    "es-core PidLock (the other writer of /tmp/.system.cfg.lock and <lock>.reap)",
    "chksysconfig's valid()/restore() and the head of wifictl's saved_wifi (context lines, not in the diff)",
    "automount's mount of /storage/roms (the hunk in the diff is external_node_present only)"
  ]
}
```

Everything below cites the diff by its `@@` hunk headers and quoted lines. Where a callee is context (not in the diff) I say so.

---

## 1. Punch items (`B.items.md`)

**PL-003 (High) — holds (harness half); guest half cannot tell from the packet.**
Mechanism: `wifictl` `@@ -249,18 +330,59 @@` reads the key with `"${NMCLI}" --escape no -s -g 802-11-wireless-security.psk connection show id "${name}"`. Case: y2 `#307 PL-003: a passphrase with ':' and '\'` expects `wifi.key = 'ab:cd\ef12345'` against a shim that escapes unless `--escape no` (`esc()` in the y2 nmcli shim). The acceptance's second clause (`get_setting wifi.key` on the guest) needs the guest; the report lists it as owed.

**PL-004 (High) — holds.**
`@@ -185,35 +266,271 @@`: `COMPRESSLOCATIONS=("${LOCATIONS[@]}")` (quoted), the theme folders read one per line (`while IFS= read -r THEME ... done < <(find ...)`), and `@@ -286,16 +642,100 @@` walks one location at a time (`find "${CANON}" -type f >> "${FILELIST}" 2>/dev/null || FIND_RC=$?`) with `return 2` on any non-zero find. Cases: four `#307 PL-004:` checks in y1 including `storage/roms/my games/save.cfg`; the report says all FAIL at the base. The member-count check (`STAGED -ne SENT+SANITISED`, `@@ -508,22 +1019,89 @@`) closes the "collector drops a file silently" hole as well.

**PL-005 (High) — holds.**
`@@ -508,22 +1019,89 @@`: `LEAKS=$(credential_lines "${STAGING}")` before `tar -czf "${TARGET}.partial"`; `return 5` when `LEAKS -gt 0`; `@@ -780,16 +1504,26 @@` maps 5 to `why "A SIGN-IN WAS FOUND IN THE BACKUP"` + `fail` (exit 1, so the `&&` chain stops). Case: y1 `#307 PL-005` asserts non-zero rc, the why, the previous archive unchanged, no `.partial`, and the log count.

**PL-006 (High) — holds.**
`CREDENTIAL_KEYS` is applied with `grep -ciE` (case-insensitive) in `credential_lines`; the token shapes are `CREDENTIAL_TOKENS`. Cases: five `p7sign` positives (`Password=`, `PrivateKey =`, `ClientSecret=`, a private-key block in `.txt`, an `access_token` in `.json`) and one negative (`lang/` catalogue, `DisableLocalPassword`, `input_enable_hotkey`, `default_open_gui_key`).

**PL-007 (High) — holds.**
`snapshot_members` (`@@ -185,35 +266,271 @@`) builds the copy from the archive's member list (`MEMBERS`), keeping every member that exists (`-L` or `-f`) and listing the rest in `NEWLIST`; `revert_restore` extracts the copy and removes `NEWLIST` paths. Case: y1 `#307 PL-007` with `other/x.cfg` outside the device list reads `ORIGINAL` after a cut restore, and `other/new.cfg` is gone. The mark's `+<path>` lines are read by `chksysconfig` (`@@ -106,18 +106,96 @@`), tested in the lifted-function cases.

**PL-008 (High) — holds.**
`@@ -286,16 +642,100 @@`: the own folder is skipped per location (`case "${CANON}" in "${OWN}"|"${OWN}"/*) continue`) and stripped from the list by the one checked awk filter (`index($0, ENVIRON["OWN"]) == 1 ... { next }` with `|| ... return 2`). Cases: `LOCATIONS=(/storage/roms)` and `LOCATIONS=(/storage/.config)` with `SETTINGS_BACKUPS` inside it; no member under the backups folder. Note the stream chose *exclude* over *refuse* (report, decision 2); the acceptance says "holds no member", which the diff meets.

**PL-009 (High) — holds.**
`snapshot_members` returns 2 (tar failed) or 3 (listing/count/rename failed), and only 4 for an empty `KEEP`; the caller (`@@ -611,54 +1208,135 @@`) maps `*)` to `COULDN'T KEEP A COPY OF YOUR CURRENT SETTINGS` before the mark and the extraction. Case: y1 `#307 PL-009` with a `chmod 000` file: `f1='LIVE'`. (See G2-B-01 for a path where 4 is returned wrongly.)

**PL-010 (High) — holds.**
`DEVICEONLY=(rclone.conf, cloud_sync-device-id, .previous)` (`@@ -254,6 +571,41 @@`) is in the tar `-X` list (`@@ -666,15 +1344,17 @@`) and the zip `-x` list (`@@ -689,42 +1369,47 @@`), and held back at backup (`@@ -382,6 +828,15 @@`). Cases: tar, zip, and the backup of `/storage/.config`. Note the pre-restore copy still keeps the device's own `rclone.conf` under `archive/` (it is a member that exists); that copy is on-device and excluded from every backup by PL-008.

**PL-011 (High) — holds.**
`write_setting_line` (`@@ -237,18 +331,31 @@`) returns 0 only after `awk ... > tmp && mv -f tmp conf`; `set_setting` (`@@ -332,10 +447,13 @@`) returns that status past the lock's release. Case: y3 `#307 PL-011` (read-only *folder*) rc non-zero, file unchanged. The acceptance's literal "read-only file" is not the fixture: a 0444 file is replaced by `rename()` and the write legitimately succeeds, so the folder is the right fixture.

**PL-031 (Medium) — holds.**
`join_wifi` compares `wifi_dev_connection` (GENERAL.CONNECTION of `WIFI_DEV`) to the name, brings the profile up with `ifname "${WIFI_DEV}"`, and re-reads before `joined`. Case: y2 `#307 PL-031` with B up on wlan1: `up` recorded as `B ifname wlan0`, wlan0 on B.

**PL-035 (Medium) — holds.**
`CANON=$(readlink -f "${LOC}")` makes `/storage/./.config/system/configs/system.cfg` the exact `SYSCFG` path the strip matches; an empty sourced list (`NAMED=0`) falls back to `DEFAULT` with `YOUR OWN BACKUP LIST IS EMPTY, SO THE STANDARD ONE WAS USED.` Cases: y1 `#307 PL-035` ×2.

**PL-036 (Medium) — holds.**
`archive_members` prints zip names whole (`substr($0, index($0, $4))`), and the sanitisers read `to_log sed ... || SANITISE_RC=1` (`@@ -464,8 +967,10 @@` ff.) with `return 2`. Cases: `my link.cfg` skipped whole; a `sed` shim that dies part-way writes nothing.

**PL-037 (Medium) — holds.**
The seed list (`SEEDED` → `storage/.config/.backuptool-seeds`, `@@ -332,15 +772,17 @@`, `@@ -508,22 +1019,89 @@`) is read at restore (`@@ -611,54 +1208,135 @@`) and each seed copied back from `/usr/config` after extraction (`@@ -689,42 +1369,47 @@`), with the seeds appended to `MEMBERS` so the pre-restore copy covers them. Case: `es_settings.cfg` reset to the image's copy; the list not left on the device.

**PL-038 (Medium) — holds.**
`case "${CANON}" in /storage|/storage/*) ;; *) OUTSIDE="${LOC}"` → `return 6` → `YOUR OWN BACKUP LIST NAMES A FOLDER A BACKUP CAN'T CARRY`. Case: `/flash/x`.

**PL-039 (Medium) — holds.**
The mark is written to `.tmp`, moved with `mv -fT`, read back (`head -n 1 = SNAPSHOT`, line count `1 + NEWLIST`) before `RESTORING SETTINGS...`; a failure ends the run. Cases: a directory at `.restore-in-progress.tmp` (PL-039) and at the mark's path (G-B-08).

**PL-040 (Medium) — holds.**
Third sed's value class `([&;]*[^[:space:]\"'&;]+|[&;]+)` (`@@ -72,11 +82,15 @@`). Case: `x.password=&y=QAKEY9` → `x.password=<redacted>`, and `<credential-shaped example redacted>&softname=es` still ends at `&`.

**PL-041 (Medium) — holds in part.**
The shell half is there: the lock is born with its pid (`echo "$$" > "${J_CONF_LOCK}.$$"` then `ln`), so "the PID write's result is ignored" no longer applies (the `ln` runs only if the `echo` succeeded); the reap re-reads and removes under `flock -x 9` on `"${J_CONF_LOCK}.reap"` (`@@ -208,17 +288,31 @@`). Case: y3 two-waiter case with B's `rm` slowed (overlap 0). What the acceptance names — a two-contender case *in `tools/wait-lock-test`* and *an ES unit test* — is not in this packet; the report says wait-lock-test is unchanged and the ES test is E1's. Also see G2-B-04.

**PL-044 (Medium) — holds.**
`remove_checked "${dst}"` (`rm -rf` then `[ ! -e ]`) gates `cp -rf` in `restore_default` and the PortMaster path (`@@ -52,7 +63,11 @@`, `@@ -134,7 +141,13 @@`). Case: y4 `#307 PL-044`, no `retroarch/retroarch`.

**PL-045 (Medium) — holds.**
`chksysconfig` `@@ -106,18 +106,96 @@` asks `/proc/mounts` (`awk -v m="${roms}" '$2 == m'`) for a copy or created file under the roms folder and leaves the mark when it is not mounted. Case: y4 `#307 PL-045` (mark kept, `not mounted yet` logged). See G2-B-02 for what this now depends on.

**PL-046 (Medium) — holds.**
`filter_tree` (`rocknix-evidence` `@@ -100,22 +100,47 @@`) counts a file filtered only after `mv -f` succeeds; a file neither replaced nor removed sets `RAW` and the collection exits 1 before any archive. Cases: y4 `#307 PL-046` ×2.

**PL-064 (Medium) — holds (the startup half); "usable means one assignment" cannot tell.**
`verify` (`@@ -126,14 +204,36 @@`) keeps and promotes a `.tmp` when neither `CFG` nor `BACKUP` is `valid` and the `.tmp` is; a failed promotion keeps it (`kept_tmp`) and skips the reseed (`@@ -146,6 +246,11 @@`). Case: y4 `#307 PL-064` ×2. The `valid()` predicate ("one assignment") is context outside the diff.

**PL-077 (Low) — holds.**
`take_lock` (`flock -n 9` on the backups folder), `STAMP_EPOCH`/`stamp_at` with a `while [ -e ]` step for both the archive and the snapshot; the evidence collector stages in `.collect.XXXXXX` and `ln`s to the first free name. Cases: refused second run, two archives in one second (backup and evidence). The harness's `date` shim answers only `+%s` and `+%Y_%m_%d-%H%M%S`, so the passing case also proves the image's `date -d "@N"` works — the fallback would have looped on the shimmed name.

---

## 2. The first audit's findings (`B.findings.md`) — the stream's answers against the diff

### claude seat

| ID | Verdict | Where in the diff |
|---|---|---|
| G-B-01 | **Answered.** `.backup/.bak/.tmp/.old` beside `SYSCFG`, `ESCFG`, `RACFG`, `RATOKENFILES`, `RATOKENSETTINGS`, `DEVICEONLY` are held back (`@@ -417,15 +872,37 @@`); the scan's case list adds `*.backup|*.bak|*.cfg.*|*.conf.*|*.ini.*`. Case y1 `#307 audit G-B-01` plants three records and a `.backup` config. | backuptool |
| G-B-02 | **Answered.** `unset SETTINGS_BACKUPS BACKUPFOLDER` inside the sourcing subshell (`@@ -22,11 +26,25 @@`). Case `BACKUPFOLDER=` alone lands in `mybackups`. | backuptool |
| G-B-03 | **Answered.** `(^\|[^A-Za-z0-9])sk-[A-Za-z0-9_-]{24,}` in `CREDENTIAL_TOKENS`; the fixture is built from printf pieces. | backuptool |
| G-B-04 | **Answered**, and the follow-up is a real correction: the first cut's `mountpoint -q` is gone; `finish_restore` reads `/proc/mounts` field 2 and falls back to the folder test when the table cannot be read (`under_roms`). Cases: the bwrap bind, and `PROC_MOUNTS=/nonexistent`. The dependency this introduces is G2-B-02. | chksysconfig |
| G-B-05 | **Withdrawal holds as reasoning.** The corrected header (`@@ -154,11 +168,62 @@`) states the real bound (pid wrap at `pid_max` 4194304, a wait bounded by the impostor's life, logged at 30 s) and why no start-time check (RTC-less clock step). The `pid_max` figure is a fact outside the packet. | 001-functions |
| G-B-06 | **Answered.** `bad` counted per created file still present or a dangling link; `echo failed` when `bad -ne 0`. Case y4 dangling link in a 555 folder → `failed`. | chksysconfig |
| G-B-07 | **Answered.** `passkey='pass"?[[:space:]]*[=:]'` replaces a bare `pass` in the fast path (`@@ -58,12 +64,16 @@`). Case: `test passed:` and `bypass mode on` fork nothing; `ScreenScraperPass=` still redacted. | 001-functions |
| G-B-08 | **Answered (evidence added, no script change).** `mv -fT "${RESTORE_MARK}.tmp" "${RESTORE_MARK}"` is in the diff; the y1 case puts a folder at the mark's path and expects the refusal. The claim that the image's busybox `mv` has `-T` is proven only when the harness finds `BB` (the wrappers exec the image's applets). | backuptool |
| G-B-09 | **Answered.** In the seed loop: `grep -qxF "storage/.config/${REL}" "${MEMBERS}" && continue`. Case: stale list naming `test/seed` → archive copy wins. | backuptool |
| G-B-10 | **Answered.** `credential_lines` checks `find`'s status, each grep's (`RC -le 1`), returns 1 with nothing printed; `write_archive` maps that to `return 3`. Cases: find shim, grep shim. | backuptool |
| G-B-11 | **Answered.** Root `ARCHIVED_*.zip` move to `archive/upstream-era/`, which `trim_archive`'s non-recursive `ls` globs never reach (`@@ -752,20 +1437,59 @@`, `@@ -552,11 +1130,20 @@`). Case: four zips, all four kept. | backuptool |
| G-B-12 | **Answered.** The one checked awk filter drops `OWN/`, `STAGE`, `/storage/.cache/log/cores/`, `/storage/.cache/log/evidence/` (`@@ -286,16 +642,100 @@`). Case `LOCATIONS=(/storage/.cache)`. | backuptool |
| G-B-13 | **Answered.** `unreaped` counter, `sleep 1` after the first, `return 1` at five (`@@ -208,17 +288,31 @@`). Case: stale lock in a 555 folder ends in <15 s. | 001-functions |
| G-B-14 | **Withdrawal plausible, not fully checkable.** The diff shows `rows=$(saved_wifi) \|\| return 2`; the body of `saved_wifi` that decides its non-zero exit (`profiles=$(... connection show) \|\| return 1`) is context, not in the diff. The withdrawal's line reference (wifictl l.229) is outside the packet. | wifictl |
| G-B-15 | **Answered.** `collect` takes `flock -n 7` on the evidence folder and `rm -rf "${EVIDENCE_DIR}"/.collect.*` under it (`@@ -141,9 +166,21 @@`). Case: planted `.collect.p7dead` cleared. | rocknix-evidence |

### gpt seat

| ID | Verdict | Where in the diff |
|---|---|---|
| G-B-01 | **Answered.** `if ! archive_members "${BACKUPFILE}" > "${MEMBERS}"` → `DAMAGED`; the zip lister runs under `set -o pipefail`. Case: listing stops after one name → nothing written, `f1='LIVE1' f2='LIVE2'`. (The same fail-closed shape is *missing* for the `KEEP` list one step later — G2-B-01.) | backuptool |
| G-B-02 | **Answered.** `listed_files` returns 1 on a failed `tar -tzf` before counting; used for the `.partial` and the pre-restore copy. Cases ×2. | backuptool |
| G-B-03 | **Answered** (with claude G-B-10). | backuptool |
| G-B-04 | **Answered.** The filter's awk, `wc -l`, and `mv -f` are one `if ! ... \|\| ! ... \|\| ! ...` chain returning 2. Case: awk shim → `rc ≠ 0`, one archive. | backuptool |
| G-B-05 | **Answered** (as claude G-B-06). | chksysconfig |
| G-B-06 | **Answered.** The zip move runs before `write_archive`; a failed `mkdir -p \|\| mv -f` ends the run with the existing `THE BACKUP COULDN'T FINISH...` sentence. Case: `archive/upstream-era` planted as a file. | backuptool |
| G-B-07 | **Answered.** `filter_tree` lists to a temp first and returns 1 on a failed `find`; `collect` exits 1 (`Nothing was archived: the credential filter couldn't finish.`). Case: find shim. | rocknix-evidence |
| G-B-08 | **Answered.** The `+` lines are checked with `under_roms` and set `pending=1` regardless of `snap`. Case: mark with no copy, created file under roms, not mounted → mark kept. | chksysconfig |
| G-B-09 | **Answered** (as claude G-B-02). | backuptool |
| G-B-10 | **Answered.** `kept_tmp=1` on a failed `mv`, then `elif [ -n "${kept_tmp}" ]` skips the reseed. Case: mv shim → `.tmp kept`. | chksysconfig |
| G-B-11 | **Answered.** Settings cleared first and checked; the SSID read is `\|\| return 2`; both settings put back if `nmcli connection delete` fails (`@@ -221,15 +266,50 @@`). Cases: set-fails, ssid-fails. One residue: the put-back writes `wifi.key "${key}"` even when the original had no key line (empty ≠ absent). | wifictl |
| G-B-12 | **Withdrawal holds** (as claude G-B-05). | 001-functions |
| G-B-13 | **Answered.** `keep_meta` returns `stat && chmod && touch`; every caller does `\|\| SANITISE_RC=1`. Case: chmod shim. | backuptool |
| G-B-14 | **Answered.** `LOCKED` is a precondition; the no-lock branch writes `dump NOT KEPT -- the cores folder could not be locked` and exits (`@@ -152,6 +193,12 @@`). Case: flock shim. But that branch exits without `prune_ring` — G2-B-05. | rocknix-corekeep |
| G-B-15 | **Answered in the harness.** `p7ev` and `p7ck` bind `${P7M}/bb` wrappers for the applets both scripts call, and two probes assert `IMG:` for 5 and 8 applets respectively. Note both probes are gated on `[ -n "${BB}" ]`: without the image's busybox the y1/y4 shims that `exec /p7bb/...` would fail outright rather than silently pass, so the gate is honest. | tools/last-good-scripts-test |
| G-B-16 | **Answered in part.** The seed reset's `mkdir -p` and `cp -f`, and the four sanitiser `sed`/`grep`s, go through `to_log`. Still bare: `cp "${SEEDED}" "${STAGING}${SEEDLIST}"` and the staging `mkdir -p`s in `write_archive` (`@@ -508,22 +1019,89 @@`, `@@ -441,22 +918,48 @@`) — their stderr reaches the screen. Low; the pipe case shows nothing to a player, the console case would. | backuptool |

---

## 3. Findings of this review

### G2-B-01: `snapshot_members` reads a write failure on its own `KEEP` list as "nothing to copy" or as a shorter copy
- **Severity:** Medium (the same shape the packet rated High as gpt G-B-01; lower here only because the trigger is a failed write on `/tmp`, not a damaged archive)
- **Category:** Guards must fail closed / restore safety (false "unchanged")
- **Where:** `backuptool`, `snapshot_members` in `@@ -185,35 +266,271 @@`
- **What:** `KEEP=$(mktemp)` and `: > "${NEWLIST}"` are unchecked; every `printf '%s\n' ... >> "${KEEP}"` and `>> "${NEWLIST}"` in the loop is unchecked and the loop continues past a failure; `awk '!seen[$0]++' "${KEEP}" > "${KEEP}.unique" && mv -f` leaves `KEEP` as it was when awk cannot write. Then `if [ ! -s "${KEEP}" ] ... return 4` — the code the caller reads as "nothing on this device for the restore to replace; no copy needed" — and a *partial* `KEEP` passes every later check (`tar -T "${KEEP}"`, `LISTED -ne "$(wc -l < "${KEEP}")"` compare the archive against the same short list) and returns 0.
- **Failure scenario:** `/tmp` (tmpfs, RAM) is within a few KB of full when a restore starts (it is where `MEMBERS`, `NEWLIST`, `SEEDS`, `KEEP` and every `to_log` temp go). `archive_members > MEMBERS` fits; the `KEEP` writes hit ENOSPC part-way. Outcome A (nothing written to KEEP): return 4, `SNAPSHOT=""`, `NEWLIST` also empty, so no mark is written and the extraction runs with no way back. Outcome B (KEEP written part-way): a short pre-restore copy is made and verified against itself; a cut restore's `revert_restore` puts back only the kept members and the screen says `DON'T WORRY - YOUR SETTINGS ARE UNCHANGED.`
- **Evidence:** the quoted lines; `MEMBERS` is protected (`if ! archive_members ... > "${MEMBERS}"` fails when the redirected tar cannot write) while `KEEP` is not; `credential_lines` in the same hunk does check its own `LIST=$(mktemp) || return 1`. I looked for a count of `KEEP + NEWLIST` against the `storage/` file members, or a status on the writes, or the list kept under `/storage/.cache` with the staging — none present.

### G2-B-02: the boot revert now waits on a fact about `automount` that the packet does not contain
- **Severity:** Medium (cannot tell; a regression if the fact is false for any device or the VM)
- **Category:** Dependency evidence / bounded failure
- **Where:** `chksysconfig`, `finish_restore` in `@@ -106,18 +106,96 @@`
- **What:** A copy or created file under `${roms}` is acted on only when `/proc/mounts` has a row with `$2 == /storage/roms` (`mounted=1`). If on some device or image `/storage/roms` is never a mount point (a plain directory on `/storage`), `mounted` is 0 at every verify pass of every boot, `pending=1`, and the mark is left "for the next check this boot" for ever: the cut restore is never reverted, `.restore-reverted` is never written, and nothing tells the player. The pre-fix code (directory test) at least acted; the first cut (`mountpoint`) was withdrawn for a related reason; this cut trades one assumption for another.
- **Failure scenario:** a GENERIC_X64 guest or a one-card device whose automount does not bind `/storage/roms`; a restore is cut; every boot logs `on a folder not mounted yet` and the tree stays half-restored.
- **Evidence:** the comment's claim "automount always mounts /storage/roms (a bind of games-internal or games-external, or the overlay)" is prose; the `automount` hunk in the diff (`@@ -187,8 +187,20 @@`) is `external_node_present` only. The harness proves the mounted and unmounted branches with `ROMS_ROOT` fixtures, not the image's mount order; the report lists the one-card cut-restore proof as owed. Nothing bounds the deferral (e.g., fall back to the folder test after N boots or once `001-setup` has run).

### G2-B-03: `backuptool` sources `cloud_sync.conf`, which the cloud rule (as rewritten this round) says is never sourced with a command in it
- **Severity:** Medium (a contract disagreement between two streams; executes conf content as root on every backup/restore)
- **Category:** Seam / D-CLOUD-142
- **Where:** `backuptool` `@@ -22,11 +26,25 @@`: `_configured=$( unset SETTINGS_BACKUPS BACKUPFOLDER; . /storage/.config/cloud_sync.conf >/dev/null 2>&1; printf ... )`
- **What:** The justification in the hunk is "Read the way cloud_backup reads it -- the file sourced, in a subshell". `rclone-cloud-sync.md` § "What the audit's fixes changed" says: "`cloud_sync.conf` is never sourced with a command in it (D-CLOUD-142); the content scripts read their values as text." Whatever guard that decision placed in the cloud scripts, `backuptool` has none: a conf line that is a command runs, as root, in the subshell, with its output discarded, before anything is checked.
- **Failure scenario:** a `cloud_sync.conf` corrupted or hand-edited to contain a command line (the case D-CLOUD-142 exists for) — `backuptool backup` executes it; the value read may still be sane, so nothing is logged.
- **Evidence:** the quoted line; the rule text. What would settle it: `cloud_backup`'s current `SETTINGS_BACKUPS` read in stream A's packet (whether it still sources, or refuses a conf with a command). A secondary consequence: a value that fails `backuptool`'s `/storage/*` test falls back to `/storage/roms/backup` while `cloud_backup` (outside the packet) may still use the configured folder — the #35 two-folders shape for that class of value.

### G2-B-04: an empty settings lock is reaped 0.2 s after it is seen, and the only writer that can leave one is the interface
- **Severity:** Low (seam; the shell's own create cannot produce the case)
- **Category:** Lock whose reader and writer may disagree
- **Where:** `001-functions` `@@ -166,28 +231,43 @@` (`[ -n "${holder}" ] || sleep 0.2 2>/dev/null || sleep 1`) and `@@ -208,17 +288,31 @@` (the reap: `read -r now`; `[ "${now}" = "${holder}" ] || exit 0` — both empty, so true; `case "${now}" in '' ...` skips `kill -0`; `rm -f ... && echo removed`)
- **What:** With `ln` the shell never leaves an empty lock, so an empty lock is either the no-`ln` fallback or the interface's `PidLock`. If `PidLock` creates the file and then writes the pid (two steps), a 200 ms stall between them on a loaded 1 GB handheld is a theft: the shell removes the interface's lock under the reap flock and takes its own; both then write `system.cfg`.
- **Evidence:** the quoted lines. What would settle it: `PidLock`'s create in es-core (link-into-place like the shell, or `O_EXCL` then write). If the former, this cannot happen; if the latter, the grace should be longer or the interface should link.

### G2-B-05: the no-lock exit of `rocknix-corekeep` skips the ring prune, recreating the unbounded-notes shape F-PB-15 fixed
- **Severity:** Low
- **Category:** Resource bounds / incomplete fix
- **Where:** `rocknix-corekeep` `@@ -152,6 +193,12 @@` (`if [ "${LOCKED}" -ne 1 ]; then note ...; logger ...; exit 0; fi`) versus `@@ -162,6 +209,7 @@` and `@@ -194,9 +246,5 @@`, where the other two exits call `prune_ring`
- **What:** On a build without `flock` on `PATH`, every crash writes a note and none is ever pruned. The stream's own F-PB-15 text: "the notes of dumps refused for space were never counted, so they grew without bound." Pruning is a set of `rm -f`s and is safe to run unserialised.
- **Failure scenario:** `flock` absent; a crash-looping emulator leaves thousands of notes in `/storage/.cache/log/cores`.
- **Evidence:** the three exit paths as quoted; only one lacks the call.

### G2-B-06: the core handler's `flock 8` has no bound
- **Severity:** Low
- **Category:** Fail gracefully (bounded waits, D-CLOUD-075 shape)
- **Where:** `rocknix-corekeep` `@@ -139,6 +154,32 @@`: `{ exec 8<"${CORE_DIR}"; } 2>/dev/null && command -v flock >/dev/null 2>&1 && flock 8 && LOCKED=1`
- **What:** A second crash's handler blocks indefinitely on a first handler that has stalled (a `gzip` on a hanging card), and with it the crashing process's exit and restart — the very cost F-PB-16 was fixed to avoid.
- **Evidence:** no `-w` on the `flock`, no timeout around it; F-PB-21's test proves waiting, not ending.

### G2-B-07: the seed list's extraction has no status, so a partial seed reset is reported as a completed restore
- **Severity:** Low
- **Category:** Guards must fail closed (silent partial)
- **Where:** `backuptool` restore `@@ -611,54 +1208,135 @@`: `case "${ARCHIVE_KIND}" in tar) tar -xzOf ... ;; *) unzip -p ... ;; esac | while ... done > "${SEEDS}"`
- **What:** The pipeline's status is the `while`'s (0). A member that cannot be read gives an empty or short `SEEDS`; the reset applies to what was read; the run says the restore finished. The edited files PL-037 exists to reset stay edited, silently. Not a data-loss path (the reset writes the image's own copies), but the same shape the stream fixed for `archive_members`.
- **Evidence:** no `pipefail`, no read-back of the list against the archive.

### G2-B-08: `join_wifi` writes the two settings unchecked, so a half-written pair can follow `joined`
- **Severity:** Low
- **Category:** Persistence correctness (the sibling of gpt G-B-11, fixed for `forget` only)
- **Where:** `wifictl` `@@ -249,18 +330,59 @@`: `set_setting wifi.ssid "${ssid}"` / `set_setting wifi.key "${psk}"` with no status read
- **What:** `set_setting` now returns 1 on a write that did not land (PL-011) or a lock it could not take (F-PB-06). A failed second write leaves `wifi.ssid` on the new network with the old network's key; the settings-driven connect paths then fail against the new SSID. The device is joined, so `joined` is true, but nothing is logged. F-WF-02 covered the empty-key overwrite, not this.
- **Evidence:** the two unchecked calls; contrast `forget_wifi` in `@@ -221,15 +266,50 @@`, which checks both.

### G2-B-09: `forget` clears `wifi.ssid`/`wifi.key` by SSID even when another remembered profile carries that SSID
- **Severity:** Low (design edge)
- **Category:** Correctness
- **Where:** `wifictl` `@@ -221,15 +266,50 @@`: `[ "${named}" = "${name}" ] || [ "${named}" = "${ssid}" ]`
- **What:** NetworkManager deduplicates profile names ("Home", "Home 1") for one SSID; forgetting "Home 1" clears the settings that name "Home" although the "Home" profile is still remembered and may be the one in use. The settings-driven paths (ENABLE WI-FI, the wizard) then have nothing to connect from while NM still has the network.
- **Evidence:** the match is on the SSID string alone; no check that another remaining profile has the same SSID.

### G2-B-10: the bracket-escaped exclusion is proven for busybox `tar -X`, not for busybox `unzip -x`
- **Severity:** Low (coverage; fails closed by revert)
- **Category:** Dependency evidence
- **Where:** `backuptool` zip branch `@@ -689,42 +1369,47 @@`: `SKIP=(... "${LINKS[@]}")` with `glob_literal` names, passed to `unzip -o ... -x`
- **What:** The gpt F-BR-13 case (`[x] link.cfg`) runs the tar branch only; the zip case (PL-036) uses a name without glob characters. If the image's `unzip -x` does not treat `[[]x]` as a pattern, a live symlink whose name holds `[ ] * ?` is not excluded, `unzip` refuses it ("exists but is not a regular file") and the restore reverts — the abort the list exists to prevent.
- **Evidence:** the two harness cases as written; no zip case with a bracketed symlink name.

---

## 4. Sweep rows (#308) — spot-checks against the diff

Fixed rows checked (eight):

- **claude F-PB-13** — `automount` `@@ -187,8 +187,20 @@`: `internal=$(basename "$(readlink -f "/sys/class/block/${part}/..")")` when `/sys/class/block/${part}/partition` exists. Three y4 cases (sda2 root, mmcblk1 external, mmcblk0p2 root). ✔
- **claude F-BR-09** — `STAGING=$(mktemp -d "${STAGING_PREFIX}XXXXXX")` under `/storage/.cache` (`@@ -441,22 +918,48 @@`); the scan reads the staged tree, no second extraction. Case counts exactly one `mktemp -d`. ✔
- **claude F-WF-05** — `list_wifi` pipes through `nm_unescape` (`@@ -63,12 +68,17 @@`). ✔
- **claude F-PB-16** — the `cat > /dev/null 2>&1` is removed (`@@ -112,9 +113,13 @@`); `head -c "$(( CORE_MAX_BYTES + 1 ))"` and `RAW -gt CORE_MAX_BYTES` (`@@ -169,7 +217,14 @@`). ✔
- **gpt F-PB-15** — `prune_ring` sorts by `$(NF-2)` (the epoch, read from the right) over `core.*.txt`, deleting note and dump together (`@@ -139,6 +154,32 @@`). ✔
- **gpt F-BR-14** — `archive_ok` zip branch `unzip -l ... && unzip -p ... >/dev/null` (`@@ -185,35 +266,271 @@`); the y1 case corrupts a member's payload and keeps the directory intact. That busybox `unzip -p` checks CRCs is proven only when `BB` is found. ✔ (conditional)
- **gpt F-PB-17** — `parse_savestate_arguments` reads each value as the argument after its flag (`@@ -193,38 +197,33 @@`); the ROM-name case in y4. ✔
- **claude F-BR-19** — `if [ -t 1 ]; then sleep 5; fi` / `sleep 3` (`@@ -124,10 +151,16 @@`, `@@ -808,65 +1542,11 @@`). ✔

Withdrawn rows, judged where the packet allows:

- **F-PB-07** (busybox awk exits 1 on an unreadable input): the diff's `write_setting_line` renames only after `awk ... && mv` succeeds, so *if* awk exits non-zero nothing is renamed — the mechanism agrees with the withdrawal; the awk exit fact is outside the packet.
- **F-PB-10** (interface strips ANSI), **F-WF-04** (`WIFI_DEV` at file scope), **F-CS-09**, **F-PB-14**, **F-VM-18**, **F-PB-17** (design intent): all rest on files outside the packet. Note `wifi_dev_connection` (new) presupposes `WIFI_DEV`, so F-WF-04's claim is load-bearing for the fix.
- **F-BR-12(d)** (`>>> why` on another descriptor): the withdrawal is consistent with `es-player-text.md` § Outcome vocabulary ("Why comes from a `>>> why <sentence>` line the scripts print"); moving it would break the reader named there.
- **F-WF-09**: refuted by the diff itself — section u exists and is edited (`@@ -2718,13 +2735,18 @@`, `@@ -2810,7 +2832,7 @@`).
- **F-PB-08** pid-reuse half: the original withdrawal reason (tmpfs) was wrong and the stream says so; the corrected reason is in the diff (see claude G-B-05 above).

---

## 5. Seams

1. **The settings lock (`001-functions` ↔ es-core `PidLock`).** Both sides assume: the file holds one pid as a number; a stale holder is reaped under `flock` on `<lock>.reap`; the reaper re-reads and compares before `rm`. The diff keeps all three (`@@ -208,17 +288,31 @@`). It adds a fourth assumption the interface may not share: that a lock is *born with its pid* (hard link), so the shell reaps an empty lock after 0.2 s (G2-B-04). The `.reap` file is created and never removed; the `<lock>.<pid>` temp is removed after the link.
2. **`>>> why` and the interface's maintenance dialog.** The interface composes `COULDN'T FINISH - <why>` from the same stdout. Every new why sentence in the diff (`A SIGN-IN WAS FOUND IN THE BACKUP`, `THERE'S NOTHING TO BACK UP YET`, `A SETTINGS BACKUP OR RESTORE IS ALREADY RUNNING`, `YOUR OWN BACKUP LIST NAMES A FOLDER A BACKUP CAN'T CARRY`, `THIS DEVICE CAN'T RESTORE SETTINGS...`) appears in `es-player-text.md`'s D-UI-112 list as proposed words; the other outcome lines are unchanged. `backuptool`'s new `note` lines (`KEEPING N FILE(S)...`) are plain stdout, which the comment says the interface discards. Agreement holds; the words await the maintainer.
3. **`wifictl` ↔ the picker (`WifiText`).** `saved` is byte-for-byte unchanged (guard case in y2); `saved --ssid` is opt-in with `\t`/`\\` escaping the ES side must undo; `list` now unescapes, which makes it agree with `current`/`saved` (the picker compares exactly). `forget` now exits 2 for "could not ask" — the picker must not read 2 as "not a remembered network"; that reader is outside the packet.
4. **`backuptool` ↔ `cloud_backup`.** Three assumptions in the diff about the other side: (a) `SETTINGS_BACKUPS` is read the same way (G2-B-03: the rule says the cloud side changed); (b) the upload matches `--include=/*.{zip,tar.gz}` at the root only, which is what makes `archive/` and `archive/upstream-era/` safe (comments at `@@ -752,20 +1437,59 @@`, `@@ -780,16 +1504,26 @@`); (c) the settings tier's chain is `backuptool backup && cloud_backup --system-only`, so exit 1 on codes 4/5/6 stops the upload. None of the three is in this packet.
5. **`backuptool` ↔ `chksysconfig` (same stream).** Mark v2: line 1 the copy (or empty), then `+/storage/<path>` lines; the reader ignores anything else and skips `..`. Writer (`printf '%s\n' "${SNAPSHOT}"; sed 's/^/+/' "${NEWLIST}"`) and reader (`case "${p}" in +/storage/*)`) agree. Old readers take line 1 only (report, decision 3).
6. **`redact_credentials` ↔ `rocknix-evidence` ↔ the push guard.** The evidence collector sources the redaction from `001-functions` (y4 binds it). The backup scan's `sk-` is anchored while `.githooks/secret-patterns`' is not (the harness comment "the guard's own sk- is unanchored"), which is why the fixture is built from pieces — an intentional divergence worth recording so the two are not "unified" by accident.
7. **`chksysconfig` ↔ `automount`.** The revert's precondition is now `/storage/roms` present as a mount (G2-B-02).
8. **The shared harness.** Stream B edits sections f, k and u and appends block y; block y uses helpers defined elsewhere in the file (`src_of`, `check`, `BB`, `BB_HOST`, `${TMP}/bbin`, `FN`, `BT_REL`, `CHK_REL`, `WIFICTL_REL`, `RE_REL`). If another stream changed those helpers' contracts the block breaks loudly (the shims `exec /p7bb/...`), not silently.
9. **`rocknix-corekeep` ↔ `core_pattern`.** The cap now keys on `%E` as `$5` and falls back to the 15-character comm; whether the image's `core_pattern` passes `%E`, and that `core_pipe_limit` is 0 (the basis for reading nothing when disarmed), are outside the packet.

---

## 6. Coverage boundary — what this packet cannot settle

- **Context code the fixes lean on:** `valid()` and `restore()` in `chksysconfig`; `newest_backup`, `DEFAULT`'s body, `RATOKENFILES`/`RCLONECFG`/`ARCHIVE_KEEP`, the `PREVIOUS` rotation and `write_archive`'s tail (the final `mv` and `rm -rf STAGING`) in `backuptool`; the alive branch of `wait_lock` and `get_setting` in `001-functions`; the head of `saved_wifi` and `WIFI_DEV` in `wifictl`; `parse_savestate_arguments`' call site in `runemu.sh`.
- **Busybox facts the harness proves only when `BB` is found:** `mv -T`, `date -d @N`, `unzip -p` CRC checking, `tar -X` globbing (proven by the `[x] link.cfg` case), `unzip -x` bracket globbing (not proven, G2-B-10), `flock` as an applet (both `backuptool` verbs now hard-require it), `sleep 0.2`.
- **Facts about the image:** `kernel.pid_max` (the G-B-05/G-B-12 bound), `core_pipe_limit` and `%E` in `core_pattern`, that `automount` always mounts `/storage/roms` (G2-B-02), that `/storage/.cache` is always the internal card.
- **The other side of each seam:** es-core `PidLock`'s create; `WifiText`'s handling of `forget` exit 2 and its eventual `saved --ssid` reader; `cloud_backup`'s conf read and include; the maintenance dialog's rendering of the new sentences at 640×480.
- **The scan against lived-in configs:** `CREDENTIAL_KEYS` has a bare `key` and `pass` alternative applied to every `.cfg/.conf/.ini` under the standard list; it was run against shipped seeds only (report). A false positive on a common emulator or theme file would refuse *every* settings backup on that device and stop the settings tier's upload with `A SIGN-IN WAS FOUND IN THE BACKUP`. The VM/guest run the report owes is the artifact; nothing in this packet stands in for it.
- **Runtime proofs the report itself lists as owed:** PL-003 on the guest, PL-031 with two adapters, PL-045/PL-007 with the KILL18 fixture and a real boot, the one-card cut restore (G-B-04), `wifictl saved --ssid` against real NetworkManager, the upgrade rehearsal with a cut `system.cfg` and a whole `.tmp`.
- **Process claims not checkable here:** the 504/0 suite result, the `--old` FAIL counts, the vocabulary-check and push-guard runs, and the `filter-branch` rewrite — the report's FAIL-then-PASS lines are quoted as the stream's claims throughout, checked only against the cases as written in the diff.
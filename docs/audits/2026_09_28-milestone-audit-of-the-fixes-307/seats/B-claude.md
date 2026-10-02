> Redacted by the orchestrator, 2026-09-28: one credential-shaped example in the G-B finding about the sign-in scan's `sk-` pattern was replaced by a placeholder in angle brackets so the file can be committed past the push guard (`.githooks/secret-patterns`); nothing else in the seat's output was changed.

# Audit of the fixes — stream B (backuptool and the rocknix scripts), seat verdict

Corpus: the 8 embedded sources (paths and sha256 as given in the per-source headers; I did not re-read or re-hash anything). Every citation below is to a hunk in `seats/B.diff` by file, hunk header (`@@ … @@`) and function name, or to a named case in `seats/B.harness.txt`.

---

## 1. Per punch item

| Item | Verdict | Where in the diff (the line that shows it) | Notes |
|---|---|---|---|
| **PL-003** saved-network join stores nmcli's escaped passphrase | **holds** | `wifictl`, `join_wifi` hunk: `psk=$("${NMCLI}" --escape no -s -g 802-11-wireless-security.psk …) && ssid=$(… --escape no -g 802-11-wireless.ssid …) && [ -n "${ssid}" ]` gates the two `set_setting` calls; a failed read logs and leaves settings. | Harness y2 `#307 PL-003` asserts `wifi.key = 'ab:cd\ef12345'` against a shim that escapes unless `--escape no`. The guest half of the acceptance (`get_setting wifi.key` after a real join) is correctly listed as owed. |
| **PL-004** unquoted arrays drop paths with spaces | **holds** | `backuptool`: `COMPRESSLOCATIONS=("${LOCATIONS[@]}")` / `("${DEFAULT[@]}")`; themes via `while IFS= read -r THEME … done < <(find …)`; `write_archive` per-location `find "${CANON}" -type f >> "${FILELIST}" 2>/dev/null \|\| FIND_RC=$?` → `return 2`; `STAGED -ne SENT+SANITISED` → 2; `LISTED -ne STAGED` → 3. | Four harness cases (space path, `My Theme`, unreadable folder, collector dropping a file). Member count asserted against the walk as the acceptance asked. |
| **PL-005** scan warns and still publishes | **holds** | `write_archive`: `[ "${STRIP}" = "1" ] && [ "$(credential_lines "${STAGING}")" -gt 0 ]` → `rm -rf STAGING; return 5`, before any `tar -czf "${TARGET}.partial"`; backup `case 5)` → `why "A SIGN-IN WAS FOUND IN THE BACKUP"` + `fail` (exit 1). | No `.partial` is ever written for a refused run, so "the partial removed" is met vacuously. The case asserts the previous archive unchanged, no `.partial`, and the log count. See G-B-01 (a file class the scan never looks at) and G-B-03 (a false-positive shape). |
| **PL-006** scan class admits no capital | **holds in part** | `CREDENTIAL_KEYS` used with `grep -ciE`; lang kept out by path (`*/lang/*\|*/locale/*\|*/translations/*`); `CREDENTIAL_TOKENS` carries the pre-push shapes. | The key-shape pass runs only on `*.cfg\|*.conf\|*.ini\|*.nmconnection\|*.psk`; a `.backup` record with `wifi.key=` is never key-scanned (G-B-01). Six harness cases, one negative. |
| **PL-007** snapshot covers the device's list, not the archive's members | **holds** | `snapshot_members` (KEEP = members that exist, NEWLIST = members that do not, `tar -czf … -C / -T KEEP`, listed-back count); restore writes the mark as `SNAPSHOT` + `+<path>` lines; `revert_restore` extracts the copy and removes NEWLIST; `chksysconfig finish_restore` reads `tail -n +2 "${mark}"` and removes `+/storage/*` entries. | Four cases incl. both chksysconfig shapes. Old one-line marks still read (`tail -n +2` empty → `created=0`). |
| **PL-008** backup folder nested into a backup | **holds** | `write_archive`: `OWN=$(readlink -f "${SETTINGS_BACKUPS}")`; location `case "${CANON}" in "${OWN}"\|"${OWN}"/*) continue`; files under it removed with `awk 'index($0, ENVIRON["OWN"]) != 1'` and logged. | Two cases (`/storage/roms`, `/storage/.config` with the folder inside). Excluded, not refused — the report says so and why. |
| **PL-009** failed snapshot reads as empty device | **holds** | `snapshot_members` returns 4 only when `KEEP` is empty; 2 on tar failure, 3 on count/mv failure; restore `case` treats only 4 as "nothing to copy", `*)` → `fail "COULDN'T KEEP A COPY…"` before the mark or the extraction. | Case: `chmod 000 locked.cfg` → rc≠0, `f1` still LIVE. |
| **PL-010** legacy restore takes the cloud identity | **holds** | `DEVICEONLY=(rclone.conf, cloud_sync-device-id, .previous)`; in the tar `SKIP` file and the zip `SKIP` array (`"${DEVICEONLY[@]#/}"`), in the seeds loop, and held back at backup (`for CANDIDATE in "${DEVICEONLY[@]}" … echo >> SECRETLIST`). | Three cases (tar, zip, backup hold-back). The `Already written:` answer is the right one: field archives keep the files; the restore no longer applies them. |
| **PL-011** failed settings write returns 0 | **holds** | `001-functions write_setting_line`: `awk … > tmp && mv -f tmp cfg` → `return 0`, else `rm -f tmp; return 1`; `set_setting`: `write_setting_line …; rc=$?; rm -f lock; return ${rc}`; `del_setting` returns `rc` too. | Case: read-only folder → rc≠0, file unchanged. |
| **PL-031** join reports success on the wrong interface | **holds** | `wifictl join_wifi`: `if [ "$(wifi_dev_connection)" != "${name}" ]; then nmcli -w 90 connection up id "${name}" ifname "${WIFI_DEV}" … ; [ "$(wifi_dev_connection)" = "${name}" ] \|\| return 1`. | Case: B up on wlan1, join B → `B ifname wlan0` recorded, joined only once wlan0 reads B. Device proof needs two adapters (report says so). |
| **PL-035** `/.` spelling, empty list | **holds** | `CANON=$(readlink -f "${LOC}")` before every membership test; `NAMED=0` loop → `DEFAULT` with `YOUR OWN BACKUP LIST IS EMPTY, SO THE STANDARD ONE WAS USED.` | "Refuse an empty entry" is implemented as *skip an empty element, fall back when all are empty*; the two cases cover both halves of the acceptance. |
| **PL-036** unchecked sanitisers; whitespace lost in the legacy inspection | **holds** | `archive_members` prints `substr($0, index($0, $4))` (whole name); the zip branch reads `"${MEMBERS}"` with `IFS= read -r`; each sanitiser sets `SANITISE_RC=1` (grep's `[ $? -le 1 ]`), `SANITISE_RC -ne 0` → return 2. | Two cases (`my link.cfg` symlink kept; a sed that dies part-way → nothing written). |
| **PL-037** seed-pruned file not reset on restore | **holds** | `SEEDED` collected at prune time, copied into staging as `storage/.config/.backuptool-seeds`; restore reads it (`tar -xzOf` / `unzip -p`), filters, appends to `MEMBERS` (so the copy covers them), skips it in both `SKIP` lists, `cp -f /usr/config/REL` after extraction; a failed `cp` → `EXTRACT_RC=1`. | Two cases. See G-B-09 for a stale-list edge. |
| **PL-038** location outside `/storage` dropped silently | **holds** | `case "${CANON}" in /storage\|/storage/*) ;; *) OUTSIDE="${LOC}"` → `return 6` → `why "YOUR OWN BACKUP LIST NAMES A FOLDER A BACKUP CAN'T CARRY"`. | Case with `/flash/x` bound in. |
| **PL-039** restore mark unchecked | **holds** | `{ printf …; sed 's/^/+/' NEWLIST; } > mark.tmp && mv -fT mark.tmp mark && [ "$(head -n 1 mark)" = "${SNAPSHOT}" ] && [ "$(wc -l < mark)" -eq 1+N ]` else `fail` before `RESTORING SETTINGS...`. | Case: a directory at `.tmp` stops the restore before extraction and restart. The `-T` branch itself is untested (G-B-08). |
| **PL-040** redaction misses a leading `&`/`;` | **holds** | `001-functions redact_credentials` third `sed`: value class `([&;]*[^[:space:]\"'&;]+\|[&;]+)`. | Two cases incl. the `&softname=es` boundary guard. |
| **PL-041** (shell half) two waiters reap each other's lock | **holds in part** | `wait_lock`: born with the pid (`echo "$$" > lock.$$ && ln lock.$$ lock`), reaped once under `flock -x 9` on `"${J_CONF_LOCK}.reap"` with a re-read and a `kill -0` inside the lock. | The acceptance names `tools/wait-lock-test`; the two-contender case is in `last-good-scripts-test` y3 instead (the file was outside the stream's list — a fair reason, stated). The pid-reuse withdrawal is argued wrongly (G-B-05); a residual spin remains (G-B-13). |
| **PL-044** `rm -rf` unchecked before `cp -rf` | **holds** | `factoryreset restore_default`: `if ! remove_checked "${dst}"; then fail …; return 1; fi` before `cp -rf`; the PortMaster path likewise. | Case: a 555 subfolder → rc≠0, no `retroarch/retroarch`. |
| **PL-045** marker consumed while unmounted | **holds** | `chksysconfig finish_restore`: `case "${snap}" in "${roms}"/*) mountpoint -q "${roms}" 2>/dev/null \|\| pending=1 ;; *) [ -d dirname ] \|\| pending=1`. | The mount is tested, as asked. Whether `mountpoint` exists on the image is not evidenced by the packet, and the case cannot tell the two apart (G-B-04). |
| **PL-046** filtered file counted when `mv` fails | **holds** | `rocknix-evidence filter_tree`: `FILTERED` incremented only inside `if mv -f …; then`; else `rm -f` both, `RAW` counted if still present, function returns `[ "${RAW}" -eq 0 ]`; `collect` exits 1 before any tar when it fails. | Two cases (mv fails → left out; mv and rm fail → no archive). |
| **PL-077** same-second names | **holds** | `backuptool take_lock` (`exec 9<dir && flock -n 9`), `sweep_leftovers`, `while [ -e "${BACKUPFILE}" ]; do STAMP_EPOCH+1 …`; `rocknix-evidence`: `mktemp -d "${EVIDENCE_DIR}/.collect.XXXXXX"`, `ln "${tmp}" "${out}"` loop over `-2-evidence.tar.gz`… | Three cases. |

Items added past the plan (PL-064 upgrade half in `chksysconfig verify`, F-PB-20, the E2 launch-command finding): each has a case and a stated requester; they reach past the plan's list but not past the stream's files.

---

## 2. Findings

### G-B-01: The last-good record `system.cfg.backup` is neither stripped nor scanned, so a custom `LOCATIONS=(/storage/.config)` ships the Wi-Fi key
- **Severity:** High
- **Category:** Credentials (the same class as PL-005/PL-008)
- **Where:** `backuptool`, `write_archive` (`SYSCFG=".../system.cfg"` and `grep -qxF "${SYSCFG}" "${SECRETLIST}"` — exact path only), `credential_lines` (`*.cfg|*.conf|*.ini|*.nmconnection|*.psk)` case), `CREDENTIAL_TOKENS` (upper-case `PASSWORD|…` only). The record's existence and path: `chksysconfig` hunk `valid "${BACKUP}"` and the harness lift `CFG="${CFG_PATH}/system.cfg"; BACKUP="${CFG}.backup"` (y4).
- **What:** chksysconfig keeps `/storage/.config/system/configs/system.cfg.backup` as the last-good copy of the live file, which carries `wifi.key=` and `root.password=`. The strip applies to `system.cfg` by exact path; the key-shape scan is gated on extension and `.backup` is not one; the token scan is upper-case-only. A selection that covers `system/configs/` collects the record whole, the scan finds nothing, the archive is named and uploaded by the settings tier's chain.
- **Failure scenario:** a player sets `LOCATIONS=(/storage/.config)` — the exact selection the plan's PL-008 acceptance names as supported — and backs up with `--then-cloud`; their Wi-Fi passphrase and root password leave the device.
- **Evidence:** looked for `system.cfg.backup` (or a `*.backup` glob) in `SECRETLIST` hold-backs (`RCLONECFG`, `SYSCFG`, `ESCFG`, `RACFG`, `RATOKENSETTINGS`, `DEVICEONLY`) — not there; in the `credential_lines` extension case — not there; the `CREDENTIAL_KEYS` regex would match `wifi.key=SECRET` (`[a-z0-9_.-]*\.key`) and `root.password=x` (`root.` + `password`) if the file were scanned. The passing PL-008 case (`LOCATIONS=(/storage/.config)`) is built by `p7reset`, which writes no `.backup`, so it cannot see this. **Not verifiable from the packet:** whether `DEFAULT` names `system/configs/*` (then every standard backup is exposed) or the file exactly (then only custom lists are) — one grep of `DEFAULT=(` settles it.

### G-B-02: The `BACKUPFOLDER` fallback in the new `SETTINGS_BACKUPS` read can never fire
- **Severity:** Medium
- **Category:** Upgrade path / `Already written:`
- **Where:** `backuptool`, hunk `@@ -22,11 +26,22 @@`: `SETTINGS_BACKUPS="/storage/roms/backup"` immediately followed by `_configured=$( . /storage/.config/cloud_sync.conf …; printf '%s' "${SETTINGS_BACKUPS:-${BACKUPFOLDER:-}}" )`.
- **What:** the subshell inherits `SETTINGS_BACKUPS` already set to the default. A conf that carries only `BACKUPFOLDER=` (the un-migrated shape the comment itself names, D-UI-022) leaves the default in place, so `BACKUPFOLDER` is never read. The old `sed` pair read `BACKUPFOLDER` when `SETTINGS_BACKUPS` was absent; this is a regression of exactly the "archives into one folder, uploads from another" bug (#35) the comment above it recounts.
- **Failure scenario:** a device whose `cloud_sync_helper` migration has not run (or failed) and whose conf still says `BACKUPFOLDER="/storage/roms/mybackups"`: backuptool writes to `/storage/roms/backup`, `cloud_backup` (if it honours `BACKUPFOLDER`) uploads from `mybackups` — an old archive, or nothing, reported as done.
- **Evidence:** the two lines quoted; bash variable inheritance into `( … )`. No harness case has a conf with `BACKUPFOLDER` alone (F-BR-18's case sets `SETTINGS_BACKUPS="${CONTENTPATH}/backup"`). Mitigation outside the diff (the helper migrating on every update) cannot be confirmed from the packet. The fix is one word: `unset SETTINGS_BACKUPS BACKUPFOLDER` inside the subshell before sourcing.

### G-B-03: `sk-` is unanchored in the backup's token scan, so a long kebab-case identifier refuses every backup as "A SIGN-IN"
- **Severity:** Medium
- **Category:** Regression introduced by the fix (false positive on a refusing guard)
- **Where:** `backuptool`, `CREDENTIAL_TOKENS=…|sk-[A-Za-z0-9_-]{24,}|…`, applied with `grep -IcE` to every non-binary staged file; contrast `001-functions` `marks`, where the same stream changed `sk-` to `(^|[^A-Za-z0-9])sk-` because `"disk-" and "task-" are not keys`.
- **What:** `ma<sk- and 24 more characters>`, `desk-…`, `risk-…` — any `sk-` followed by 24 or more `[A-Za-z0-9_-]` — matches. The standard list now carries the player's whole theme folders and "presentation assets" (bezel `.cfg`, theme XML), where kebab-case asset names are ordinary. A hit is not a warning any more (PL-005): the run ends with `A SIGN-IN WAS FOUND IN THE BACKUP, SO IT WASN'T KEPT.` and only the journal names the file.
- **Failure scenario:** a theme with one such image name makes every settings backup fail with a message that tells the player they have a password in their theme; there is no in-reach recovery (`es-player-text.md` § Fail gracefully).
- **Evidence:** the regex text; the `while … DEFAULT+=("${THEME}")` loop; `credential_lines` scanning all files. The PL-006 negative fixture (`clean.cfg`, `lang/ru_RU.ini`) contains no such identifier, so the suite cannot see it. The stream's own #221 note ("a clean backup that warns teaches people to ignore the one that matters") applies more strongly to a clean backup that is refused.

### G-B-04: `mountpoint` is the one new external command the harness does not run through the image's busybox, and its absence would defer every cut-restore revert for ever
- **Severity:** Medium
- **Category:** Guards must fail closed / dependency evidence
- **Where:** `chksysconfig finish_restore`: `mountpoint -q "${roms}" 2>/dev/null || pending=1`. Harness header applet list (`tar unzip find readlink mktemp flock stat mv cp ln touch chmod sed awk head tail wc cut tr cmp dirname basename mkdir rm date`) — no `mountpoint`; y4 `p7chk` runs with `PATH="${TMP}/bbin:${PATH}"`.
- **What:** if the image's busybox lacks the `mountpoint` applet, `command not found` is swallowed by `2>/dev/null`, `pending=1` every boot, and the mark is never consumed: the sysinit pass and the `001-setup` pass both say "not mounted yet" and the tree stays half-restored with the mark in place (D-CLOUD-078 KILL18 undone). The PL-045 case passes identically whether `mountpoint` exists (a plain directory is not a mountpoint) or not (command missing) — it has no positive branch (a mounted `ROMS_ROOT`, e.g. a bwrap `--bind`, with the mark consumed).
- **Failure scenario:** as above; the log would show the same line every boot, which is the only tell.
- **Evidence:** the applet list, the `|| pending=1` shape, the absence of a "mounted → proceeds" case. The plan required every added command to be checked against the guest's busybox list; the report does not name this check. **Cannot tell from the packet** whether the applet is present; `busybox --list | grep mountpoint` on the image settles it.

### G-B-05: The F-PB-08 pid-reuse withdrawal argues the wrong boundary
- **Severity:** Low
- **Category:** Withdrawal reason that does not hold
- **Where:** `001-functions`, the `wait_lock` header comment: "The pid-reuse half of F-PB-08 does not arise: J_CONF_LOCK is on /tmp, a tmpfs, so no lock outlives the boot that wrote it."; `B.report.md` F-PB-08 row.
- **What:** tmpfs rules out a lock surviving a reboot; it says nothing about a pid wrapping within one boot. A stale holder's pid taken by an unrelated live process makes `kill -0` succeed in both the wait branch and the reap's re-check, and the waiter waits for as long as that process lives.
- **Failure scenario:** rare (needs pid wrap on a long-running device; `pid_max` 32768 on 32-bit ARM), bounded by the impostor's lifetime, reported by `wait_lock_say`'s "waited on" line.
- **Evidence:** the comment text; `kill -0 "${holder}"` and `kill -0 "${now}" … && exit 0` in the reap block. Looked for a start-time or comm check on the holder — none.

### G-B-06: `finish_restore` says `reverted` even when created files could not be removed
- **Severity:** Low
- **Category:** Guards must fail closed (success reported over a partial)
- **Where:** `chksysconfig finish_restore`: the removal loop counts `bad`, then `say "… ($((created - bad)) gone)"; echo reverted > "${said}"` unconditionally on that branch.
- **What:** the interface reads `said` (per the comment) and tells the player the copy was put back; a tree with `bad > 0` leftover files is announced as reverted. The stream's own backuptool rule ("Unchanged is said only when both happened") is not applied here.
- **Failure scenario:** a created file on a read-only or errored path stays; the player is told their settings are as they were.
- **Evidence:** the quoted lines; looked for a `bad -gt 0` branch writing a different word — none. Rare as root.

### G-B-07: The redaction's fast path now forks on every line containing `pass`
- **Severity:** Low
- **Category:** Regression against the fix's own stated aim (F-PB-18: "forked a sed for nothing")
- **Where:** `001-functions redact_credentials`: `[[ "${line}" =~ (${words}|pass|${marks}) ]]`.
- **What:** `words` already had `passw`; adding bare `pass` sends "test passed", "bypass", "passthrough", "compass" lines through `sed`. The `sk-` anchoring removed one fork source and this adds a commoner one.
- **Failure scenario:** verbose-mode logging on a handheld pays a fork per such line; no correctness effect.
- **Evidence:** the line; the F-PB-18 case only proves `disk-`/`task-` take the fast path.

### G-B-08: `mv -fT` on the restore mark — the `-T` branch is untested and busybox support is not evidenced in the packet
- **Severity:** Low
- **Category:** Dependency evidence / test that cannot fail on the intended input
- **Where:** `backuptool` restore: `mv -fT "${RESTORE_MARK}.tmp" "${RESTORE_MARK}"`; harness PL-039 fixture `mkdir -p "${P7S}/.config/.restore-in-progress.tmp"`.
- **What:** the fixture puts a directory at the `.tmp` path, so `printf > .tmp` fails before `mv` runs; the case the comment describes ("a folder in the mark's place") — a directory at `${RESTORE_MARK}` — is never exercised. If the image's `mv` lacked `-T`, every restore would fail at the mark with `COULDN'T KEEP A COPY OF YOUR CURRENT SETTINGS` (while the copy was in fact kept).
- **Evidence:** the fixture; the passing restore cases (PL-010, PL-037) prove `-fT` only if `${BB}` was non-empty in the stream's run, which the packet does not show. One `busybox mv --help` on the image settles it.

### G-B-09: A seed list archived by an older image is honoured by a newer one
- **Severity:** Low
- **Category:** Upgrade path (downgrade/re-upgrade edge)
- **Where:** `backuptool`: `[ "${F}" = "${SEEDLIST}" ] && continue` (new-image backups skip it); restore's `grep -qxF "${SEEDLIST#/}" "${MEMBERS}"` → seed loop overwrites after extraction.
- **What:** an image before PL-037 extracts `.backuptool-seeds` "as an inert file" (report). If that older image then backs up a custom list covering `/storage/.config`, the stale list becomes a member; a later new-image restore of that archive resets every listed file to the seed *after* extracting the archive's own (edited) copies of them.
- **Failure scenario:** new → old → new image with a custom list; edits made between are replaced by defaults and the restore says completed. Contrived; noted because the `Already written:` line calls the old-image case inert.
- **Evidence:** the two code paths; no member-provenance check on the seed list.

### G-B-10: `credential_lines` skips a file it cannot read, and reads an unwalkable tree as clean
- **Severity:** Low
- **Category:** Guards must fail closed
- **Where:** `backuptool credential_lines`: `N=$(( ${N:-0} + $(grep -IcE … "${F}" 2>/dev/null || true) ))`; `find "${TREE}" -type f -print0` unchecked; caller `[ "$(credential_lines …)" -gt 0 ]`.
- **What:** a `grep` that prints nothing (unreadable file) makes the arithmetic `$(( 0 + ))` fail; `N` stays as it was and the file is passed over; a failed `find` yields `TOTAL=0`. The staging is the script's own, written as root, so the exposure is small — but the scan's shape defaults to "proceed" when its machinery breaks.
- **Evidence:** the quoted lines; looked for a status check on `find` or a non-numeric guard on `N` — none.

### G-B-11: The upstream-era `ARCHIVED_*.zip` rotation deletes the player's oldest archives on the first backup after the update, and the row carries no `Already written:` line
- **Severity:** Low
- **Category:** Upgrade path (non-destructive first)
- **Where:** `backuptool` backup case: `for OLD in "${SETTINGS_BACKUPS}"/ARCHIVED_*.zip … mv … ; ROTATED_OLD=1; done; [ -n "${ROTATED_OLD:-}" ] && trim_archive`; `B.report.md` F-BR-07 row.
- **What:** every such zip is moved under a dated name and immediately subject to the `ARCHIVE_KEEP` trim, so all but the newest few are removed with a `logger` line and nothing on screen. The copies of those zips already in the cloud (the finding's point) are untouched — `cloud_backup` is outside the stream. The report's F-BR-07 row states neither.
- **Evidence:** the loop and the trailing `trim_archive`; harness F-BR-07 plants one zip, so the trim's deletion path is not shown.

### G-B-12: Core dumps and evidence bundles are collectable by a custom list, and `-I` hides them from the scan
- **Severity:** Low
- **Category:** Credentials (custom list; `rocknix-corekeep`'s "never collected, never uploaded" promise)
- **Where:** `backuptool write_archive` exclusions (`OWN`, `STAGING_PREFIX` only); `rocknix-corekeep`: `note "credentials  a core is process memory: … 0600, never collected, never uploaded."`
- **What:** PL-008 excluded the backups folder unconditionally; `/storage/.cache/log/cores/*.gz` is not excluded, and `grep -I` treats the gzips as binary. A `LOCATIONS=(/storage)` or `(/storage/.cache)` list carries them to the cloud.
- **Evidence:** the exclusion list; looked for `CORE_DIR`/`cores` in `write_archive` — absent. Unlikely list; the promise is the reason to note it.

### G-B-13: `wait_lock` still spins without a sleep when the lock exists, is stale, and the reap cannot run
- **Severity:** Low
- **Category:** Residual of F-PB-06 (not a regression)
- **Where:** `001-functions wait_lock`: the `misses` counter only counts `[ ! -e "${J_CONF_LOCK}" ]`; the reap block's `9>"${J_CONF_LOCK}.reap" 2>/dev/null` fails silently on an unwritable folder and the loop continues without a sleep.
- **What:** a read-only `/tmp` holding a stale lock loops at once; the old code did the same. The F-PB-06 comment names "a read-only /tmp" as covered; only the empty-path branch is.
- **Evidence:** the loop structure; no `sleep` on the stale/unreaped path.

### G-B-14: `forget` maps every non-zero `saved_wifi` to exit 2
- **Severity:** Low
- **Category:** Correctness (cannot tell)
- **Where:** `wifictl forget_wifi`: `rows=$(saved_wifi) || return 2`.
- **What:** if `saved_wifi` exits 1 on "no saved networks" (its contract is outside the diff), a forget on a device with none reads as "could not ask" rather than "not a remembered network". `join_wifi` already did this, so the behaviour is at least consistent.
- **Evidence:** the line; `saved_wifi`'s body is not in the packet.

### G-B-15: A collection killed before the filter leaves an unfiltered `.collect.*` tree that nothing sweeps
- **Severity:** Low
- **Category:** Leftovers (pre-existing shape, now hidden)
- **Where:** `rocknix-evidence collect`: `stage=$(mktemp -d "${EVIDENCE_DIR}/.collect.XXXXXX")`; no counterpart to backuptool's `sweep_leftovers`.
- **What:** raw journals and pstore text sit in a dot-folder on the card until someone finds them. The old layout had the same leftover under a visible name.
- **Evidence:** looked for a `rm -rf "${EVIDENCE_DIR}"/.collect.*` at the start of `collect` — none.

---

## 3. Sweep rows

**Fixed rows spot-checked against the diff (holds unless noted):**

- **claude F-PB-13** (`automount`): `part=…; if [ -e /sys/class/block/${part}/partition ]; then internal=$(basename "$(readlink -f …/..)")` — holds; three cases incl. two regression guards.
- **gpt F-PB-16** (`del_setting` literal): `awk 'index($0, ENVIRON["K"] "=") != 1'` replaces `sed -i "/^${1}=/d"` — holds.
- **gpt F-PB-17** (`runemu.sh`): the flag values come from the argument list (`case "${PREVIOUS}" in -state_slot) …`); the joined-string cut is gone — holds. The E2 platform read (`for ARG in "${@:2}"; … -P?*)`) — holds.
- **claude F-WF-05** (`list_wifi | nm_unescape`) — holds. **F-WF-06 / gpt F-WF-04** (`saved_state` on the last tab) — holds. **F-WF-07** (`|| return 2`) — holds, with G-B-14. **F-WF-01 / gpt F-WF-07** (forget clears `wifi.ssid`/`wifi.key` when they name the network by SSID or profile name) — holds.
- **claude F-BR-13** (`RATOKENDIR_PATTERNS+=("${D#/}*")` per element) — holds. **gpt F-BR-13** (`LINKS` built for both archive kinds, `glob_literal` escaping `[]*?`) — holds; a backslash in a member name is not escaped (fnmatch reads it as an escape), an edge.
- **gpt F-BR-14** (`unzip -l … && unzip -p …`) — holds; the case damages a payload under an intact directory.
- **gpt F-BR-16** (`keep_meta`, `-T "${MEMBERLIST}"` of files only) — holds.
- **claude F-BR-19 / gpt F-BR-20** (`[ -t 1 ]` sleeps; `to_log` for tar/unzip stderr) — holds.
- **claude F-BR-18** — **holds in part**: sourcing in a subshell and refusing a non-`/storage` result are there; the `BACKUPFOLDER` half is dead (G-B-02), and `${CONTENTPATH}` resolves only if the conf itself sets it (defaults are not sourced here), so "means the same folder to both" is not guaranteed.
- **claude F-BR-07** — holds (moves and trims), with G-B-11.
- **gpt F-PB-15 / F-PB-21 / claude F-PB-16 / gpt F-PB-20** (`rocknix-corekeep`): `prune_ring` by `$(NF-2)` newest-first over notes; `exec 8<dir && flock 8`; no `cat >/dev/null` when disarmed; `head -c $((cap+1))` and `RAW -gt cap`; `case "${EXEPATH##*!}"` then the 15-character comm — all hold. Whether `core_pattern` passes `%E` as `$5` is outside the packet.
- **claude F-BR-08 / gpt F-BR-15** (`trim_archive "${SNAPSHOT}"` with `awk '$0 != ENVIRON["KEEP"]'`) — holds during the restore; the copy is unprotected against a later trim before the boot revert (a manual backup run after a cut restore), an edge.

**Withdrawals I can judge from the packet:**

- **F-PB-14, F-VM-18** (not stream B's files): the plan grants `sysutils/systemd/scripts/` and "system.d units named by your rows"; a `system.conf.d` drop-in and GENERIC_X64 are outside — the routing holds.
- **claude F-PB-08** (pid-reuse half): the tmpfs reason **does not hold** for in-boot reuse (G-B-05); the create-window half is fixed.
- **claude F-PB-07**: the busybox-awk-exits-1 observation and the section-c contract argument are coherent; the EIO-mid-read case is honestly left open. Reasonable.
- **F-WF-09**: the harness text references section u ("as in u", the report's section-u shim edits) — consistent with an existing wifictl test; plausible.
- **F-BR-12(d)**: `>>> why` is the stdout protocol the maintenance dialog reads — a protocol change across repos; plausible.
- **F-PB-10, F-WF-04, F-PB-17, F-CS-09**: each cites a file outside the packet (`GuiMenu.cpp`, `wifictl:37`, `handheld-evidence.md`, `rocknix/sources/post-update`); cannot judge.
- **claude F-BR-16** (Bluetooth): resolved by documenting the deliberate omission in a comment; a documentation answer to a documentation finding — consistent.

---

## 4. Coverage boundary

Not judgeable from this packet, stated rather than guessed:

- **Callees outside the diff:** `newest_backup`, `valid` (chksysconfig), `saved_wifi`'s exit codes, `pin_wifi`, `wait_lock_say`, `RATOKENFILES`/`RATOKENSETTINGS`, `ARCHIVE_KEEP`/`CORE_KEEP`, the tail of `write_archive` after the `LISTED` check (the `.partial → TARGET` rename), the full `DEFAULT` list (decides G-B-01's reach), the old `finish_restore`'s reading of the mark's first line (the "old image reads line 1 alone" claim).
- **Runtime facts on the image:** busybox applet set and options — `mountpoint` (G-B-04), `mv -T` (G-B-08), `date -d @epoch`, `date -r`, `tar -O`, `unzip -p` CRC behaviour, `flock` fd form, `readlink -f`, `stat -c %a`, `mktemp -d TEMPLATE`. The harness claims to run the listed applets through the image's busybox; whether `${BB}` was non-empty in the run that produced `468 PASS` is not in the packet.
- **The kernel's `core_pattern`** (does `%E` arrive as `$5`), `core_pipe_limit`, and the pipe-abandon behaviour the disarmed exit relies on.
- **The other side of each interface:** `cloud_backup`'s `--include=/*.{zip,tar.gz}` and its `SETTINGS_BACKUPS`/`BACKUPFOLDER` read (G-B-02's consequence), `cloud_sync_helper`'s migration (G-B-02's mitigation), the ES `WifiText` picker and whether the interface re-writes `wifi.ssid` after `forget`, `maintenancePlainLine`, the maintenance dialog's handling of the new `>>> why` sentences (frames owed, as the report says).
- **The harness edits outside the block** (sections f, k, u) — described in the report, not in the packet; whether the replaced checks kept their strength cannot be checked here.
- **Device/VM proofs** the report itself lists as owed (PL-003 guest join, PL-031 two adapters, PL-045/PL-007 KILL18 reboot, PL-005 chain stop and a lived-in device's standard backup not being refused, PL-064 upgrade rehearsal).

---

## corpus.provenance (as embedded; not re-read or re-hashed by me)

- `docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/B.diff` — `ff93e2eb0be81284ddfc2a55046714964b0d35a21b97123f73f38f941f234cd9`
- `docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/B.harness.txt` — `864318fea93c963da4bee809ed00e842572da117ae2571f39489714889799b9f`
- `docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/B.plan.md` — `ae55a7b1e51f40a0253859915d191ef93d5825f0fb63778ec0a7ec2f9d526fff`
- `docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/B.report.md` — `012187faf38cffce61b43c3012129058062e2270ccc4ee2437d40edce91b1e27`
- `.claude/rules/engineering-practices.md` — `d6f88a6f4cd9c61b0e6ef728625c6a1cec9dc6f58e1db578cf0987f10f870c1a`
- `.claude/rules/upgrade-and-install.md` — `de4a683f9a36f9100e6fd98be11ad84d736f370374c40f74c445a2b81eca1995`
- `.claude/rules/packaging-and-patches.md` — `2a44db10f4f179198b9366239eabe0900e1701145beced181536eb18bcbc0746`
- `.claude/rules/es-player-text.md` — `554225c68e627a3bde8969a77f177aea14f5bcd85b0bcc740631d402a5f1f7a7`

No source I needed was missing from the embed; the gaps above are callees and runtime facts, not un-embedded files.
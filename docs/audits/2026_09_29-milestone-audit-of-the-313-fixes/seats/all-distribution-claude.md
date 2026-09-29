# Council seat: all-distribution packet (#313 fixes, `1b0d233657`..`02546235c1`)

Read: `seats/all-distribution.diff` (sha256 `eb6d9140…654f0f`) against `seats/items.md` (sha256 `7017bd2d…8ac97`), judged by the four embedded rule files. Everything below cites the diff's hunks; nothing outside the six embedded sources was read.

Noted, not audited (upstream's or the proxy author's code, per the brief): `RK3326/options`, `RK3566/options` (batteryplus off), `SM4450`/`SM8250` kernel config line moves, `linux/package.mk` (`makeinstall_host` removed from `makeinstall_target`), `rocknix-abl/package.mk` (new sha256, `PKG_ARCH` line removed), `virtual/image/package.mk` (`initramfs` dropped from the dependency list), `raofflineproxy/package.mk` (pin `c1bd3724` → `248ce5a`, sha256), `patches/008` hunk header, `raofflineproxy-rcheevos`/`-libchdr` comment lines, `emulationstation/package.mk` (pin bump — the ES packet's).

---

## 1. Per-item verdicts

**PL-001 (migration deletes a tier copied onto itself)** — **holds.** `cloud_migrate_layout` `@@ -44,6 +44,69 @@` adds `clean_path` (runs of `/` folded, `.` parts dropped, no trailing `/`, `..` → return 1), `folder_key` (leading `/` forced, case folded unless the cloud says `"CaseInsensitive":false`), `same_folder`, `inside_folder`, `rel_inside`. `@@ -426,15 +504,37 @@`: all three pointers are cleaned in `main` before any compare, and a `..` pointer returns 4 with the couldn't-be-read why. Every compare from `@@ -443,16 +543,17 @@` down is `same_folder`/`inside_folder`, not `=`. `relocate` `@@ -248,6 +311,21 @@` refuses when `same_folder "${src#*:}" "${dst#*:}"` and excludes a destination nested in the source. The trailing-slash conf `SAVES_REMOTE="/ROCKNIX/Saves/"` cleans to `/ROCKNIX/Saves`, `same_folder` with `NEW_SAVES` is true, nothing is moved. The harness case and "run 2 of the proofs" are outside the packet. See G3-D-05 for the reader this item left as it was.

**PL-002 (CR passes `conf_valid`, five copies)** — **holds.** All three `conf_valid` copies (`cloud_backup @@ -1026,35 +1046,42 @@`, `cloud_restore @@ -1087,35 +1107,42 @@`, `cloud_sync_helper @@ -230,35 +250,42 @@`) add, before any other rule on every line, `t = s; gsub(/\t/, "", t); if (t ~ /[[:cntrl:]]/) bad("a control character other than a tab")`, and `rest()` and the comment-line test lose `\r`/`[[:space:]]` for `[ \t]`. The two content readers (`cloud_content_backup @@ -113,33 +113,80 @@`, `cloud_content_restore @@ -116,33 +116,80 @@`) do the same in `conf_get` and exit 2 from `END`; `cloud_setup`'s `conf_get` mirrors them. A CR anywhere in the file is refused by all five (six). Cases are outside the packet. See G3-D-02 for the one control byte the check does not see.

**PL-003 (backuptool sources the conf)** — **holds.** `backuptool @@ -27,24 +27,49 @@`: `conf_text_value` is an awk that takes the first `KEY=` line, accepts `"…"`, `'…'` or a bare word with an optional `# comment` after a blank, refuses `$`, backtick, backslash and control characters in the value, and prints nothing (exit 1) otherwise. The `. /storage/.config/cloud_sync.conf` subshell is gone; `SETTINGS_BACKUPS` is read first, `BACKUPFOLDER` second, and a refused value logs and falls to the standard folder. Case outside the packet.

**PL-004 (failed safety copy restored over the valid conf)** — **holds**, both scripts. `cloud_backup @@ -1157,9 +1189,25 @@` and `cloud_restore @@ -1218,9 +1250,25 @@`: the first branch is `if ! { cp -f … && cmp -s … && conf_valid "${pre_cleanup}"; }` → remove the copy, log, run on with the file as sourced; only after that does the cleanup run, and the put-back `elif mv -f "${pre_cleanup}" "${conf_file}"` (`@@ -1167,8 +1215,8 @@`) is reached only from a copy that passed all three. The `[ -s pre_cleanup ]` test is gone. Case outside the packet.

**PL-005 (redaction fast path lets `--pass X` through)** — **holds** on the trigger; the sed half is outside the shown hunk. `001-functions @@ -73,7 +80,17 @@`: `passflag='(^|[[:space:]])--?[A-Za-z0-9_.-]*pass[[:space:]]'` joins the `[[ =~ ]]` trigger, with `keyname`, `keyflag`, and `words` gaining `passphrase` and `access[_-]?key` (`@@ -63,7 +67,10 @@`). `launcher --pass qa-value` now takes the sed path. The comment says the sed "has always redacted that shape"; the sed rules shown in `@@ -86,7 +103,7 @@` are the two quoted-value rules only — the unquoted/flag rule is context not in the diff, so end-to-end masking of the acceptance's two lines is not verifiable here.

**PL-006 (failed snapshot worklist reads as "nothing to protect")** — **holds** on every `mktemp` the hunks show. `backuptool @@ -197,14 +222,35 @@`: `tmp_file` (mktemp checked, non-empty, regular, not a link, empty) and `to_log` returning 125 without it. `snapshot_members @@ -468,10 +577,20 @@`/`@@ -482,15 +601,33 @@`: `KEEP=$(tmp_file) || return 3`, unreadable `MEMBERS` or unwritable `NEWLIST` → 3, every append `|| { WHOLE=0; break; }`, per-file counts checked against `wc -l`, and 4 only after that chain passes with an empty `KEEP`. `write_archive` and the restore replace every visible `mktemp` (`FILELIST/SECRETLIST/SENDLIST`, `REGENERABLE`, `KEPT/SEEDED`, `MEMBERLIST`, `MEMBERS/NEWLIST/SEEDS`, `SEEDRAW`, `SKIP`) with checked helpers and counted writes; the tar `-X` file is counted against `${#SKIPS[@]}` (`@@ -1351,10 +1649,23 @@`). Whether any `mktemp` remains outside the hunks cannot be seen from a diff. Cases outside the packet. See G3-D-06 for one count that can refuse a whole backup.

**PL-007 (an archive overwrites the recovery marker)** — **holds.** `backuptool @@ -606,6 +743,24 @@` defines `RESTORE_CONTROL` (the mark, its `.tmp`, `.restore-reverted`, `.restore-finish-pending`, `.cloud-journey-pending`); `@@ -722,10 +885,13 @@` drops them from the backup's list by exact path (`($0 in ctrl)`); `@@ -1334,6 +1623,15 @@` puts them, the settings backups folder (`…/*`) and the snapshot by name into one `SKIPS` used by both `tar -X` and `unzip -x`; `snapshot_members @@ -482,15 +601,33 @@` never lists them as kept or created, so the revert cannot remove the fresh mark. Case outside the packet.

**PL-008 (quoted password starting with whitespace)** — **holds.** `backuptool @@ -364,7 +413,7 @@`: `[=:][[:space:]]*("[[:space:]]*)?[^"[:space:]]+`. `password = " leading-text"` matches; `password = "   "` does not (documented in `@@ -351,7 +397,10 @@`).

**PL-009 (dot component walks past the saves guard)** — **holds.** `cloud_setup @@ -259,6 +310,43 @@`: `case "${path}/" in *//*|*/./*|*/../*)` before the sibling check; `/Mine/Backups/.` → `/Mine/Backups/./` matches, canon is `/Mine/Backups`, the offer is `Try /Mine/Saves.` (a `backups`/`content` last part becomes `Saves`). A path that cleans to nothing says "can't be empty". See G3-D-07 for the trailing slash this now refuses.

**PL-010** — outside the packet (ES).

**PL-011** — outside the packet (`.githooks` is not an upstream-bound path; not in the diff).

**PL-012** — outside the packet (same).

**PL-013** — not in the diff. The embedded `engineering-practices.md` (sha256 `9a41f84b…bcd6`) § "A read is free" carries the corrected example `s/((token|key|passw[a-z]*|psk|user)[=:])[^ ]*/\1***/Ig` and the sentence that a masking pattern is proven on a fake `key=SECRET` line first. `tools/rules-check` is outside the packet.

**PL-014 (credentials already in `cloud_sync.log`)** — **holds.** New `cloud_log_scrub`: once per family, `cloud_sync.log*` through `SCRUB_SED` (old `cloud_remote` failure lines cut to `rclone <verb> failed (<code>)`, `k=v` masked on a cut-off line, `cloud_oauth`'s sign-in words `<redacted>` unless one of the fixed sentences) and `es_log*.txt` through `ES_AWK` (`cloud_remote create: <output>` and its continuation lines masked), then every line through `redact_credentials`; temp-and-rename, re-read on growth, replaced only when the line count is unchanged and something changed; stamp `/storage/.cache/cloud_sync/log-scrubbed` written per family only after every file of it succeeded; a missing log folder records done. Installed by `rclone/package.mk @@ -72,6 +72,10 @@`, run in the foreground by `autostart/102-cloud-saves @@ -15,10 +15,19 @@` before the capture pass. Verified that the build's own `rclone config create failed (1)` line does not match the first rule (`[a-z]+ [^ ]+( .*)? failed` needs an argument between verb and `failed`). The planted-line case and the "Already written" line are outside the packet. Whether the trim's leftover is named `cloud_sync.log.*` is outside the packet.

**PL-015 (escaped quote refused)** — **holds.** In every `conf_valid` copy's `dq()`: `if (c == "\\") { if (i == n) return 0; d = …; if (d == "\"" || d == "\\" || d == "$" || d == "`") { val = val c d; i += 2; continue } bad(…) }`; the three `conf_get` copies accept the same four and store the unescaped character. `RCLONEOPTS="--exclude \"*.tmp\" --progress"` passes. Folder keys still refuse a backslash in `whole()`. Every refusal names `line N: <shape>` in `CONF_WHY`, logged by `load_config` (`@@ -1095,6 +1125,8 @@`, `@@ -1156,6 +1186,8 @@`) and by `update_cloud_sync_config` (`@@ -312,7 +342,7 @@`, `@@ -466,7 +496,7 @@`); the content scripts log the why from `conf_get`'s stdout.

**PL-016 (revert proceeds with an unreadable mount table)** — **holds.** `chksysconfig @@ -127,31 +141,48 @@`: `under_roms` with `mounted` empty says once "the mount table cannot be read, so whether the roms folder is mounted is not known; a restore's files there wait for a later check" and returns 0 (waits). The directory test survives only for a mark that says `roms-mounted=no`, read with `sed -n 's/^roms-mounted=//p' … | head -n 1`. Case outside the packet.

**PL-017 (upstream-era move overwrites)** — **holds.** `backuptool @@ -1472,16 +1782,33 @@`: `DEST` loops to `<name>-kept-<BACKUP_STAMP>[-N].zip` while anything exists at it, `mv -n`, then `[ ! -e "${OLD}" ] && [ -f "${DEST}" ]` since `mv -n` succeeds without moving. Case outside the packet.

**PL-018, PL-019** — outside the packet (ES).

**PL-020 (`#elif 0` read as live)** — **holds.** Both generators' `drop_dead` (`rotation-table-fba.py @@ -14,45 +14,69 @@`, `rotation-table-mame.py @@ -14,46 +14,66 @@`) keep `[arm, taken]` per open `#if`; traced: `#if 0/#elif 0` → arm `no`; `#if 0/#elif 1` → arm `yes`; `#if FOO/#elif 1/#else` → `maybe`, then `no`; `#if 1/#elif X` → `no`; `#ifdef/#else` → both `maybe`; nested `#if 1` under a dead arm stays blanked. The two copies are byte-identical in `LEXEME`, `strip_comments`, `blank_strings`, `drop_dead`. Fixture and the five tables are outside the packet.

**PL-021 (`conf_get` takes the last assignment)** — **holds.** `cloud_setup @@ -103,25 +105,74 @@`: `if (!found) { found = 1; first = v; … }` — the first; the `tail -n 1` reader is gone. A key set in a form `source` reads and this does not (indented, `export`, `+=`) exits 2 (`other`), and every caller refuses (`@@ -382,7 +470,13 @@`, `@@ -412,7 +506,10 @@` `STATE=unreadable`, `@@ -473,7 +570,12 @@`, `@@ -572,10 +674,17 @@`). Case outside the packet; `conf_set` (whether it replaces or appends) is outside the diff — see coverage.

**PL-022 (busybox unzip passes a damaged stored member)** — **holds**, by a different mechanism the acceptance allows: `backuptool @@ -406,42 +455,102 @@` `zip_stored_ok` computes each `Stored` member's CRC-32 with busybox's `crc32` applet (same polynomial as zip) from `unzip -p` and compares with the `unzip -lv` column; `archive_ok` for zips is `unzip -l && unzip -p && zip_stored_ok`. `@@ -1203,6 +1418,14 @@`: a build without `crc32` refuses every zip restore with THIS DEVICE CAN'T RESTORE SETTINGS — wider than the acceptance's "a legacy ZIP with stored members is refused", but on the safe side. Whether the image's busybox has the applet, and prints `unzip -lv` with a CRC column, is outside the packet — see G3-D-01 for what happens when the column is absent. Cases outside the packet.

**PL-023, PL-024, PL-025, PL-026, PL-027** — outside the packet (`tools/`, `.githooks`, `.claude/rules` are not in the diff).

**PL-028 (member outside `storage/` extracted, never rolled back)** — **holds.** `backuptool @@ -406,42 +455,102 @@`: `archive_members` lists every member (zip names read between the two dashed rules after the time column); `foreign_member` prints the first that is not under `storage/` or carries a `.`/`..` part and exits 0; `@@ -1230,24 +1453,63 @@` refuses on 0 before the snapshot and extraction with THIS BACKUP HOLDS FILES A RESTORE CAN'T PUT BACK…, and on any status other than 0/1 refuses as "could not be read back". Cases outside the packet.

**PL-029** — no code; the proofs are outside the packet.

**PL-030** — outside the packet (ES).

**PL-031 (a failed comparison replaced by a cache count)** — **holds** for the ctl; the interface half is outside the packet. `raofflineproxy-ctl @@ -1001,6 +1043,24 @@` `added_count`: the measured count, else `unknown` when cached > 0, else 0. `write_stamp @@ -1008,11 +1068,12 @@` goes through it (the `${10:-${CACHED}}` default is gone); `do_topup @@ -2094,7 +2234,7 @@`/`@@ -2143,9 +2283,6 @@` drops `ADDED="${CACHED}"`; `do_scan @@ -1916,6 +2011,9 @@`, `do_topup @@ -2215,10 +2355,13 @@` and `cancelled @@ -1694,12 +1783,18 @@` all pass through `added_count` and log the unknown. Passing `unknown` back through `added_count` is idempotent.

**PL-032 (attempt ownership does not make a closed state final)** — **holds** in the packet. `cloud_oauth @@ -144,12 +144,26 @@`: `write_owned(attempt, owner, from_status, …)` checks attempt, session id and allowed source statuses under the state lock. `@@ -502,11 +537,37 @@`: signed-in is written only `from_status=(None, "starting", "waiting")` with `owner=self.gen`; refused, the remote just made is `rclone config delete`d and the call returns `CLOSED_EARLY` — so a close without a successor attempt (a cancel's idle, a timeout's failed) cannot be reopened. `@@ -1765,11 +1850,29 @@`: a restart claims the state (`starting`, new `session`) before killing the old rclone, and a start that fails writes `failed` under its own gen. `@@ -2105,13 +2231,27 @@` and `@@ -2217,9 +2357,20 @@`: `waiting` only from `starting`. `@@ -2275,11 +2426,13 @@`: the final `failed` only from `starting`/`waiting`. `_CREATE_LOCK` serialises creates; `end` joins a saving collector for up to 45 s. The failing-first case is outside the packet; `cmd_serve`'s reset order and `end`'s lock context are outside the diff.

**PL-033 (dual-stack listener)** — **holds** by the acceptance's first arm: the lines are named — `raofflineproxy-ctl @@ -904,8 +908,16 @@` and `cheevos_ppsspp.sh @@ -66,6 +66,10 @@`: `proxy_service.py`'s `ThreadingTCPServer` keeps `AF_INET` (patched client, line 267), `boot.py` lines 32 and 58, `config.py:367` default `127.0.0.1`. Those files are the pinned client's at `248ce5a`, not in the packet, so the line numbers are recorded here as the fix's claim, not checked.

**PL-034 (capture past the age bound)** — **holds** by the acceptance's "cancellation shown" arm, in code: `cloud_capture @@ -192,6 +204,29 @@` `EXIT_BOUND_MS=100000`, `past_exit_bound` (exit mode, elapsed from the first run's `_UP0_MS`, handed to the re-run as `CLOUD_CAPTURE_UP0_MS` in `@@ -1556,16 +1591,26 @@` and `@@ -1579,7 +1624,7 @@`); checked before `capture_lock` and again after it, `finish 1 "too-slow"`, nothing committed. The 120 s gate is untouched. The harness case is outside the packet.

---

## 2. Findings

### G3-D-01: `zip_stored_ok` cannot tell "no stored members" from "the listing has no CRC column"
- **Severity:** Medium (conditional on the image's busybox)
- **Category:** Guard cannot report absence (fails open; blindspot 22's shape)
- **Where:** `backuptool` `@@ -406,42 +455,102 @@`, `zip_stored_ok`
- **What:** `L` holds only lines where `$2 == "Stored"` and `match($0, /hh:mm <8 hex>  /)` succeeds. busybox `unzip -v` prints the verbose (CRC) columns only when built with `CONFIG_DESKTOP`; without it `-v` is accepted and lists in the `-l` shape. Then no line matches, the `while read … done < "${L}"` loop runs zero times, `RC` stays 0, and `archive_ok` passes. The `command -v crc32` guard at `@@ -1203,6 +1418,14 @@` checks the hash tool, not the listing's shape.
- **Failure scenario:** a legacy `.zip` with a stored member whose bytes were damaged, on a busybox whose `unzip -lv` has no CRC column → `unzip -p` copies it unchecked (the measured PL-022 behaviour), `zip_stored_ok` returns 0, the damaged bytes are restored as settings.
- **Evidence:** `unzip -lv "${1}" 2>/dev/null | awk '$2 == "Stored" && match(…)'` → `> "${L}"`; `local … RC=0`; `return ${RC}`. Refutation tried: an `unzip -lv` that rejects `-v` makes the pipe fail under `pipefail` and returns 1 (closed) — only the accepted-but-short listing is the open case; whether the image's busybox is built that way is not in the packet.
- **Fix:** before the loop, assert the `-lv` output carries the `CRC-32` header (or that its count of file lines with an 8-hex column equals `-l`'s file count) and refuse with the same THIS DEVICE CAN'T RESTORE SETTINGS why when it does not; run the healthy/damaged stored cases on the image's busybox as the acceptance asks.
- **Confidence:** medium on the mechanism; the trigger is a build option outside the packet.

### G3-D-02: `conf_valid`'s control-character refusal does not see a NUL byte
- **Severity:** Medium
- **Category:** Configuration validated on bytes other than the ones bash reads (fail-open validation; the PL-002 shape)
- **Where:** `cloud_backup @@ -1026,35 +1046,42 @@`, `cloud_restore @@ -1087,35 +1107,42 @@`, `cloud_sync_helper @@ -230,35 +250,42 @@` (`t = s; gsub(/\t/, "", t); if (t ~ /[[:cntrl:]]/)`), and the `conf_get` copies in `cloud_content_backup`, `cloud_content_restore`, `cloud_setup`
- **What:** the check is a regex over awk's `$0`. busybox awk (the device's, per `upgrade-and-install.md` § under the device's tools) holds a record as a C string, so a NUL truncates `$0` at the byte; the grammar and the cntrl test never see what follows. `bash -n` passes the file too. `rclone-cloud-sync.md` states the fix "refuses any control character but a tab, in all five readers" — NUL is one.
- **Failure scenario:** `EXTRA="x"<NUL>#$(cmd)` → every reader sees `EXTRA="x"` and passes. What `source` then does with the byte — drop it and read `"x"#$(cmd)` as one word (the command runs), or stop at it (every later key silently gone) — is bash's evalfile behaviour, outside the packet; either way a file a guard exists to refuse is accepted, and for the content scripts a `CONTENT_REMOTE` line cut by a NUL reads as a shorter folder.
- **Evidence:** no byte-level test precedes the awk in any copy; the only pre-awk checks are `-s` and `bash -n`. Refutation tried: GNU awk would match `[[:cntrl:]]` on a NUL — the device's awk is busybox.
- **Fix:** one byte count before the awk in every copy — `[ "$(tr -d '\000' < "$1" | wc -c)" -eq "$(wc -c < "$1")" ]`, refusing with "a NUL byte" — and a planted-NUL case run under the image's busybox.
- **Confidence:** medium (busybox awk's truncation is inferred from its string handling, not measured here).

### G3-D-03: `settings_base` treats a missing final newline as a torn write on a claim about writers outside the packet
- **Severity:** Medium (conditional)
- **Category:** Last-known-good logic built on an unverified invariant
- **Where:** `001-functions` `@@ -317,6 +339,49 @@` `settings_base`; `chksysconfig @@ -73,11 +73,25 @@` `backup()`
- **What:** a `system.cfg` whose last byte is not `\n` has its last line dropped (`head -n "$n"`) or replaced from `system.cfg.backup` (the awk merge), on the strength of "every writer ends the file with a newline — the interface's SystemConf, the shell's awk and sort, the image's seed". SystemConf is in the ES repository, not this packet; the shell writers are in the hunk and do end with a newline.
- **Failure scenario:** any writer that leaves no final newline (the interface's save if it does not emit one; a hand `printf`; a `sed -i` on a file that never had one) → the next `set_setting`/`del_setting`/`sort_settings` drops that key or reinstates the backup's older value for it; the comment itself notes `wifi.key` sorts last.
- **Evidence:** `if [ -s "${J_CONF}" ] && [ -z "$(tail -c 1 "${J_CONF}" 2>/dev/null)" ]; then cat …; return; fi` — everything else is the cut path; the invariant is asserted in the comment, not shown.
- **Fix:** the item's code trace names the line in SystemConf's writer that emits the final newline (its "Already written" answer), and the harness's case feeds a whole file without a final newline and asserts what happens to its last key.
- **Confidence:** low-medium; the mechanism is exact, the trigger is a writer not in the packet.

### G3-D-04: RetroArch patch 0018's new mechanism is unproven on a guest by its own text
- **Severity:** Medium
- **Category:** Verification gap on a shipped emulator patch (§ Verify the artifact; § A name is not a behaviour)
- **Where:** `retroarch/patches/0018-auto-slot-survives-content-load.patch` (`command.c` `command_record_append_config`, `configuration.c` hunks)
- **What:** the Auto-slot answer is now `config_get_entry(conf, "state_slot") != main_slot && config_get_int(...) && slot < 0`. This is right only if `config_append_file` installs a new entry (pointer) for a key the main config already had; if it updated the existing entry's value in place, the pointers are equal, `command_append_auto_slot` is always false, and the slot is scanned over at content load — the regression 0018 exists to stop. `libretro-common`'s `config_file.c` is not in the packet. The patch's own prose: "reading the answer from the load's own entries (2026-09-28) has not yet run on a guest."
- **Failure scenario:** launcher append config `state_slot = -1`, main `retroarch.cfg` `state_slot = 0` → if pointers are equal → `found_last_state_slot` runs and the load-state key no longer loads `Probe.state.auto` (the 2026-09-26 symptom).
- **Evidence:** the three prose lines added at the top of the patch; the compare in `command_record_append_config`; no guest run recorded for this cut.
- **Fix:** run the patch's own 2026-09-26 procedure on a guest at the candidate's image (no `found_last_state_slot` line; the monitor-sent load-state key loads `Probe.state.auto`) and record `config_file.c`'s `config_append_file` line that re-points the key.
- **Confidence:** medium — I believe upstream's `config_append_file` pilfers the new file's entry list and re-points the hash map, which would make the compare right; the point is that the packet ships a changed mechanism it says is unproven.

### G3-D-05: `cloud_migrate_layout`'s `conf_value` reads a single-quoted or bare pointer as the whole line, and the new folder logic then moves the pointer off the player's saves
- **Severity:** Medium
- **Category:** Two readers of one file; a migration acting on a pointer it misread
- **Where:** `cloud_migrate_layout`, `conf_value` (context above `@@ -44,6 +44,69 @@`: `grep -m1 "^$1=" "${SYNC_CONF}" | cut -d'"' -f2`); `main @@ -426,15 +504,37 @@` onward
- **What:** `cut` without `-s` passes a line with no `"` whole, so `SAVES_REMOTE='/Mine/Saves'` or `SAVES_REMOTE=/Mine/Saves` — both forms `conf_valid` accepts — yield `saves=SAVES_REMOTE='/Mine/Saves'`. `clean_path` keeps it (no `..`), `same_folder` with `NEW_SAVES` is false, and the tier's listing under `${remote}SAVES_REMOTE='/Mine/Saves'/…` finds nothing on a cloud that lists an absent prefix as empty; the branch the diff's own comment names ("A tier with nothing stored only has its pointer moved") writes `SAVES_REMOTE=/ROCKNIX/Saves`. PL-001 set out to read "a pointer as the folder it names" and left this reader unchanged.
- **Failure scenario:** a hand-edited conf with a single-quoted pointer on a bucket-style cloud (S3/B2 list an absent prefix as empty) → TIDY UP offers the move → `--apply` moves the pointer only → every sync reads an empty folder and the next exit sync writes to it; the library is split, nothing deleted. On Dropbox the listing errors and `list_or_stop` (outside the diff) presumably stops.
- **Evidence:** `conf_value` as quoted; `printf -v "${ptr}" '%s' "${cleaned}"` normalises what it is given. `has_files`, `list_or_stop`, `set_pointer` are outside the diff.
- **Fix:** replace `conf_value` with the shared `conf_get` grammar (first assignment, three quoting forms, exit 2 otherwise) and refuse on 2 with the couldn't-be-read why, as `cloud_setup` now does; a harness case with a single-quoted pointer.
- **Confidence:** medium (the reached branch depends on the backend's listing of an absent folder).

### G3-D-06: `write_archive`'s send-list count assumes `FILELIST` holds no repeated path
- **Severity:** Low (fails closed: refuses a backup that would have been right)
- **Category:** Count invariant on an input whose shape is outside the hunk
- **Where:** `backuptool @@ -903,11 +1101,27 @@`
- **What:** `NHELD_UNIQUE=$(sort -u "${SECRETLIST}" | wc -l)` and `[ "${NSEND}" -eq $((NFILES - NHELD_UNIQUE)) ]`, justified as "the list having no repeats". `grep -vxF -f SECRETLIST FILELIST` removes every occurrence of a held-back path; if `FILELIST` names one twice, `NSEND` is one short and the backup is refused with "the list of files to send could not be written whole".
- **Failure scenario:** a custom `LOCATIONS` (the REGENERABLE comment says these exist) naming both `/storage/.config` and `/storage/.config/rclone` → `rclone.conf` twice in `FILELIST`, once in `SECRETLIST` → every backup refused. How `FILELIST` is built is outside the diff.
- **Evidence:** the two counts and the `-eq`; no dedupe of `FILELIST` in any hunk.
- **Fix:** `awk '!seen[$0]++'` over `FILELIST` where the kept list is written (`@@ -772,7 +943,14 @@`), or compare against the number of held occurrences (`grep -cxF -f`) rather than unique names.
- **Confidence:** medium on mechanism, low on whether the input occurs.

### G3-D-07: a trailing-slash saves pointer is tolerated by the migration and refused by `--check-syncpath`
- **Severity:** Low
- **Category:** Upgrade path (two tools disagree on a stored value nothing rewrites)
- **Where:** `cloud_setup @@ -259,6 +310,43 @@` (`case "${path}/" in *//*…`); `cloud_migrate_layout @@ -426,15 +504,37 @@`
- **What:** `SAVES_REMOTE="/ROCKNIX/Saves/"` — the very conf PL-001 protects — now cleans to the current layout in the migration ("nothing to move", pointer left as is), while `cloud_setup --check-syncpath` with no argument reads that value and refuses it ("can't have an empty part … Try /ROCKNIX/Saves."). No hunk rewrites the stored pointer cleaned.
- **Failure scenario:** an upgraded device with the trailing slash → whichever page calls `--check-syncpath` on the current folder shows a refusal for a folder that syncs. Who calls it without an argument is in the interface, outside the packet.
- **Evidence:** the two hunks as cited; `set_pointer` is written only for a moved tier.
- **Fix:** one of: `cloud_sync_helper`'s merge rewrites the three pointers through `clean_path` once (a `.bak` is taken there already); or the no-argument `--check-syncpath` cleans before checking, as the migration does.
- **Confidence:** medium.

### G3-D-08: `on_load_changed` casts the signal's user data to `Osk *` with the connect site outside the packet
- **Severity:** Low (verify)
- **Category:** Type assumption in C
- **Where:** `cloud-signin-window.c @@ -648,6 +662,15 @@`: `if (data) ((Osk *) data)->field_recorded = FALSE;`
- **What:** the function's parameter list is cut by the hunk header; whether `load-changed` was connected with the `Osk` as user data is not in the diff. If `data` is anything else (a `GtkWindow *`, the `WebKitWebView`), this writes a `gboolean` into that object.
- **Failure scenario:** none demonstrated; memory corruption in the sign-in window if the assumption is wrong.
- **Evidence:** the cast; `on_probe` uses `osk` from its own data, which does not settle `on_load_changed`'s.
- **Fix:** one visit to the `g_signal_connect(… "load-changed" …)` line; if it does not pass the `Osk`, store it in the `Osk` and connect with it.
- **Confidence:** low that it is wrong; the check costs one line.

### G3-D-09: the three `conf_get` copies refuse a `$NAME` or a continuation that `conf_valid` accepts, so the tiers can read `RCLONE_NET_OPTS` differently
- **Severity:** Low
- **Category:** Two readers of one file (seam)
- **Where:** `cloud_content_backup @@ -113,33 +113,80 @@`, `cloud_content_restore @@ -116,33 +116,80 @@`, `cloud_setup @@ -103,25 +105,74 @@` (`if (d == "$" || d == "`") { ok = 0; … }`, `"a value continued onto the next line, which this reader does not follow"`) vs `conf_valid`'s `dq()` (`$NAME`/`${NAME}` accepted, `\` at end of line continues)
- **What:** `RCLONE_NET_OPTS="${SOME_VAR}"` or a backslash-continued value passes `conf_valid`, so the saves scripts run with the expanded value; `conf_get` returns 2 and the content scripts log and fall to the shipped bound. For the folder keys `whole()` refuses the same shapes, so those agree.
- **Failure scenario:** a hand-edited `RCLONE_NET_OPTS` with a reference → saves tier uses it, content tier silently uses the default; both say COMPLETED.
- **Evidence:** the hunks as cited. Refutation tried: no shipped writer emits either shape.
- **Fix:** either `conf_valid` refuses `$` in `RCLONE_NET_OPTS` as it does in folder values, or the discrepancy is written into the grammar's comment as accepted.
- **Confidence:** high on the disagreement, low on its weight.

---

## 3. Seams

- **`001-functions` redaction ↔ `cloud_log_scrub` (PL-005 ↔ PL-014):** the scrub sources `001-functions` and refuses to run without `redact_credentials`; its own `SCRUB_SED`/`ES_AWK` shapes are the log-specific half and the function is the credential half. They agree. `backuptool`'s `CREDENTIAL_KEYS` (PL-008) is a second, separately maintained list (`passphrase`, `access_key`, `secret_key`, `.key` there; `passphrase`, `access[_-]?key`, `[_.-]key` here) for a different purpose (scan to publish vs mask a line); they do not have to agree and do not.
- **`001-functions` lock ↔ `set_settings` ↔ `wifictl`:** `wait_lock`'s `ln -T` (G2-B-03) is what `set_settings` (G2-B-11) takes; `wifictl` `@@ -289,24 +289,25 @@`/`@@ -376,9 +377,12 @@` calls `set_settings` for both pairs and logs a put-back that fails. Agree. `settings_base` (E-core-03) ↔ `chksysconfig backup()`: both read "last byte is `\n`" as whole; agree (and share G3-D-03's assumption).
- **`backuptool` lists/marks/checks (PL-006, PL-007, PL-022, PL-028, G2-B-02) ↔ `chksysconfig` (PL-016):** the mark's last line `roms-mounted=<yes|no|unknown>` is written and checked by `tail -n 1` and `wc -l = 2 + NEWLIST`; `chksysconfig` reads it with `sed -n 's/^roms-mounted=//p' | head -n 1` and treats `no` alone as the folder-judged case. Token and position agree. `RESTORE_CONTROL` is excluded consistently from the backup list, `snapshot_members`, and `SKIPS`. `archive_members` no longer filters `storage/`, and `foreign_member` is what refuses — the filter moved, not vanished. `snapshot_members` skips `${SETTINGS_BACKUPS}/*` and `SKIPS` excludes the same folder: agree. How an older `chksysconfig` reads the new last line is outside the diff (coverage).
- **Readers of `cloud_sync.conf`:** `conf_valid` ×3 are byte-identical; `conf_get` ×3 are identical except `cloud_setup`'s unquoted `${SYNC_CONF}` (a constant path). `backuptool`'s `conf_text_value` is stricter on escapes and `$` (right for a folder key) and wider on the bare-word class (`[^ \t"';&|<>()]*` vs `[A-Za-z0-9_.\/:@%+,=-]*` — `backup*` passes there and fails `conf_valid`; harmless, literal). `cloud_migrate_layout`'s `conf_value` was not brought to the grammar (G3-D-05). Outcome words: YOUR CLOUD SYNC SETTINGS COULDN'T BE READ is shared by the content scripts, `cloud_setup`, and the migration's `..` refusal; `backuptool`'s THIS BACKUP HOLDS FILES A RESTORE CAN'T PUT BACK is new and marked "proposed" in the code — its place in the player-text rule is outside the packet.
- **Proxy ctl ↔ its stamps (PL-031, G2-D-01, G2-D-03):** `added_count` is the one writer of `added=`; `write_stamp`, `do_scan`, `do_topup`, `cancelled` all route through it and pass `unknown` back through it unchanged. The two `head_game_id` copies (shell heredoc, `list_jobs` python) are byte-identical. `pending_lock`/`ack_index_pending`/`write_index_pending` agree on fd 6 and the safe sides. The IPv4 sentence in `cheevos_ppsspp.sh` and the ctl's `port_listening` name the same lines. The reader of `added=unknown` is the interface, outside.
- **`cloud_oauth` ↔ `cloud-signin-window.c` (G2-C-01):** the `field` state file is `CLOUD_SIGNIN_FIELD_FILE = state_path("field")`, unlinked before the window starts, removed by `reset_state`, written once per page by the probe, consumed by the status handler (`open`/`loading`). Agree.
- **`091-retired-vm-fixes` ↔ `097-retired-rescue-masks`:** `MASKS_NOTE` and `NOTE` are the same string `/run/retired-rescue-masks.stamped`; the stamp paths match. Either run order works (traced both).

---

## 4. Refutations (tried, failed to break)

- `conf_valid`: `X=a b`, `X=$(c)`, `X=a$(c)`, `X='a'b`, `X="a"b`, `X=a;c`, `X=(a b)`, `export X=`, indented `X=`, `X="a\` + `$(c)"` — all refused; `X="a\"b"`, `X=a #c`, `X=` — accepted as intended.
- `conf_text_value`: `"…" # a "quoted" comment` reads the value alone; `#` inside quotes kept; empty value falls to `BACKUPFOLDER`.
- `clean_path`/`folder_key`: `/ROCKNIX/Saves/`, `//ROCKNIX///Saves`, `/./ROCKNIX/Saves`, empty `content` — normalised; `/ROCKNIX/../Saves` — refused.
- `drop_dead`: the four acceptance shapes, `#if FOO/#elif 1/#else`, nested `#if 1` under `#if 0`, `#ifdef/#else`, `#elifdef` — all as the C preprocessor would.
- `head_game_id`: `"GameId":15` cut from `153`, nested `Sets[].GameId`, escaped quotes, a top-level array — all fall to the whole-body parse.
- `SCRUB_SED`: the build's own `rclone config create failed (1)` untouched; an old `create <name> <type> url=… pass=…` line cut to `create failed (1)`. A line whose rclone words contain a second `failed (N)` gets the last code — cosmetic, not filed.
- `redact_credentials` trigger: `hotkey=`, `keyboard=`, `monkey=` — not triggered; `--pass X`, `Passphrase=`, `--b2-key X`, `access_key_id=` — triggered.
- `CREDENTIAL_KEYS`: `password = "   "` — not matched, as documented.
- `foreign_member`: `./storage/x`, `storage/`, `storage/.config/x` — pass; `storage/./x`, `tmp/x`, `/storage/x` — refused.
- PL-032 orderings: late signed-in after `idle`/`failed` → refused and the remote deleted; restart's `waiting` after the collector's `failed` → refused, the phone gets the state's error.
- `set_settings`: odd argument count, a key not starting alphanumeric — returns 1 before touching the file.
- `mv -n` loop: first collision `-kept-<STAMP>.zip`, second `-kept-<STAMP>-2.zip`.
- `091` AGAIN mode: a symlink or a file with other bytes at a listed path is left; `097`/`091` in either order reach the unmask.
- `ES_AWK` offsets: `"cloud_remote create: "` is 21 characters; `i + 20`/`i + 21` are right.
- `zip_stored_ok`'s `while read … done < "${L}"`: `crc32` reads the pipe from `unzip -p`, not `L`.
- `stage_times`: an empty stage's literal `*` fails `stat`, prints nothing; `.tmp.*` never in the glob.
- `cancelled()` leaves `READY_AFTER` in `/tmp` if the EXIT trap does not sweep it — a temp file, not filed.
- `cloud_setup`'s unquoted `[ -f ${SYNC_CONF} ]` — a constant path; not filed.

---

## 5. Coverage boundary

Not judgeable from this packet:
- Every harness case, proof and tool the acceptances name (`tools/last-good-scripts-test`, `vm-qa`, `vm-upgrade-rehearsal`, `rules-check`, the rotation fixture and the five tables) — `tools/` is not an upstream-bound path.
- `.githooks` (PL-011, PL-012, PL-026) and the ES repository (PL-010, PL-018, PL-019, PL-030, PL-031's reader, `SystemConf`'s writer, `CloudText::parseScanStamp`, the caller of `--check-syncpath`, the reader of `STATE=unreadable`).
- The pinned RAOfflineProxy sources at `248ce5a` (PL-033's named lines; `storage.py`'s schema the ctl reads) and `libretro-common`'s `config_file.c` (G3-D-04).
- Device tools: whether the image's busybox has `crc32`, prints `unzip -lv` with a CRC column, supports `ln -T`, `mv -n`, `sed -E`, `cmp`, and how its awk treats a NUL (G3-D-01, G3-D-02).
- Callees outside the hunks: `chksysconfig`'s parsing of the mark's `+` lines by a build before this one; `cloud_setup`'s `conf_set` (replace or append — first-wins readers depend on it); `cloud_migrate_layout`'s `list_or_stop`, `has_files`, `set_pointer`, `migrate_content`, `derived_content`, `resumable`; `backuptool`'s `glob_literal`, `fail`, the revert body in `chksysconfig` beyond the hunk; the remaining sed rules of `redact_credentials`; `cloud_oauth`'s `cmd_serve` reset order and whether `end` is called under a lock; the `FILELIST` construction; whether any `mktemp` remains outside the shown hunks.
- Ordering at boot: that no other autostart script or service writes `cloud_sync.log` or `es_log*.txt` before `102-cloud-saves` runs the scrub, and that ES starts only after it — asserted in the scrub's comment.
- The "Already written" line for each fix (upgrade-and-install.md) — the code traces are not in the packet; from the diff alone: PL-014 answers its own; the mark's new last line, `added=unknown`, the `session` key in the sign-in state, `foreign_member` on pre-fork archives, and `settings_base` on a newline-less file each depend on a reader or writer outside it.

---

## corpus.provenance.json

```json
{
  "member": "council seat, all-distribution packet (#313 fixes)",
  "facilitator": "council-facilitator@1.2.0",
  "manifest": "docs/audits/2026_09_29-milestone-audit-of-the-313-fixes/seats/all-distribution.manifest.json",
  "read_timestamp_utc": "2026-09-29T00:18:21Z",
  "source_file_paths": [
    "/workspace/repos/rocknix/docs/audits/2026_09_29-milestone-audit-of-the-313-fixes/seats/all-distribution.diff",
    "/workspace/repos/rocknix/docs/audits/2026_09_29-milestone-audit-of-the-313-fixes/seats/items.md",
    "/workspace/repos/rocknix/.claude/rules/engineering-practices.md",
    "/workspace/repos/rocknix/.claude/rules/upgrade-and-install.md",
    "/workspace/repos/rocknix/.claude/skills/code-auditor/references/anti-patterns.md",
    "/workspace/repos/rocknix/.claude/rules/rclone-cloud-sync.md"
  ],
  "source_file_hashes": [
    "eb6d91402aee1bb1f0999cbc76abb5ac43d4ed8b55e7a275bc599d9c2c654f0f",
    "7017bd2d9f3927d24c85f19a21069dd5fe118dee79b732b8b9042c49a488ac97",
    "9a41f84b4bf10534f5e8d1de3c165acafb6937807d98e84017b024076b23bdcd",
    "d79a1084e85117ba566d23af7fbf3633c44290a6c490f9125e1fd9df061f8cfd",
    "fd825c0505ae772ca2a6651eefe642581aaa147c254fed8cf50db1f8f1bde678",
    "81fbe525fa15c58b4a319b634df16e7ef84492fffeee7ccc97aea381fcc896bd"
  ],
  "hashes_verified_by": "facilitator at embed time; not re-read or re-hashed by this member",
  "sources_not_embedded_and_needed": [
    "tools/last-good-scripts-test (every acceptance's harness case)",
    ".githooks/pre-commit, .githooks/pre-push (PL-011, PL-012, PL-026)",
    "the EmulationStation packet (PL-010, PL-018, PL-019, PL-030, the readers of added=unknown and STATE=unreadable, SystemConf's writer)",
    "RAOfflineProxy sources at 248ce5a (PL-033's named lines)",
    "libretro-common config_file.c (patch 0018's mechanism)"
  ]
}
```
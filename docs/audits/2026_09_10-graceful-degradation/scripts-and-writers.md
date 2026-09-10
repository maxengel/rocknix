# Audit: cloud & settings writers against D-CLOUD-077 / D-CLOUD-078

Read-only; nothing changed. Sources read from `/workspace/repos/rocknix` on `next` (`d452f185b6`), ES at the pinned `e4609335458` via `git show` (the local ES checkout is on another branch and still carries the pre-#99 exit codes, so I did not trust its working tree).

Two facts that shape most rows below:

- **On the image `sed`, `mv`, `cp` are busybox** (`CONFIG_SED/MV/CP=y`; no GNU sed package in the target). Busybox `sed -i` writes a temp file and `rename(2)`s it: **atomic replace**. `cp`, `>` and `cat >` are **truncate-then-write**. `mv` across filesystems (tmpfs `/tmp` or `/var` → `/storage`) degrades to copy+unlink, i.e. truncate-then-write. Nothing in scope calls `fsync`; `backuptool` alone calls `sync` after writing.
- **The surfaces show different things.** The sync card (`ThreadedCloudSync`) shows a script line only if it contains `%`, ` / `, or the words ERROR/FAILED/WARN (case-insensitive), plus `>>> doing network`; its outcome line is one of `COMPLETED SUCCESSFULLY` / `SKIPPED - ANOTHER CLOUD SYNC IS RUNNING` / `SKIPPED - NO NETWORK CONNECTION` / `SKIPPED - A GAME WAS STARTED` / `FAILED - SEE /var/log/cloud_sync.log`. The transfer page (`GuiCloudTransfer`) shows **no free-text script lines at all** — only `>>> unit|doing|removed`, `Transferred:`, `Checks:` and `*` per-file lines; its done state is `COMPLETED SUCCESSFULLY` / `STOPPED` / the two SKIPPEDs / `FAILED`, footer `PRESS ANY BUTTON TO CLOSE`, no retry. The console (`/usr/bin/run` → `foot -F`) shows everything verbatim, colours and all — used for the settings restore (`cloud_restore --yes --system-only && backuptool restore`), the journey restore, and the two on-device `backuptool` rows. `backuptool`'s own output is `>/dev/null 2>&1` in every ES chain, so its `fail`/`note` lines reach a player only on the console flows.

## 1. Write inventory

Columns: **W** what is written · **Chk** positive success check before it counts · **Rep** how the old is replaced · **Sup** superseded record removed once, after · **Kill** what a kill/power cut at each step leaves · **B** bounded (D-CLOUD-075) · **Msg** player-facing failure text (verbatim) · **Reach** recovery/retry in reach · **V** verdict.

### chksysconfig · 001-setup · save-sysconfig.service (`projects/ROCKNIX/packages/rocknix/…`)

| # | fn | W | Chk | Rep | Sup | Kill | B | Msg | Reach | V | Fix |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `chksysconfig backup` (runs **only** at shutdown, `Before=shutdown.target`) | `system.cfg.backup` | only `grep a` ≠ "binary"; an **empty or hostname-less file passes** | `cp` = truncate+write **in place** | overwritten unconditionally, every clean shutdown | mid-cp: half `.backup`; a forced power-off never runs it | n/a | none | — | **FAILS** — #102 exactly: the defaulted `system.cfg` was copied over the good `.backup` at the next clean reboot | validate first (`-s`, not binary, `^system.hostname=`); write `.backup.tmp` + `mv`; also take it at boot after `verify` passes (a forced power-off never reaches shutdown, so the only fresh good copy is the one taken at boot) |
| 2 | `chksysconfig restore` | `system.cfg` from `.backup` | none | `cp` in place | n/a | half `system.cfg`; re-verified next boot | n/a | none | — | partial | `cp` to tmp + `mv` |
| 3 | `chksysconfig verify` (boot, from `001-setup`) | `rsync -a /usr/config/ /storage/.config` when `retroarch-core-options.cfg` or `retroarch.cfg` is empty/missing **or** `system.hostname` absent | n/a | rsync per-file temp+rename | **never consults `.backup`** for the empty/no-hostname case (only for "binary"); and `rsync -a` without `--ignore-existing` replaces **every** config that differs from defaults, not the missing one | n/a | n/a | none (the player sees `H700`, Wi-Fi off) | none | **FAILS** — "defaults win" (D-CLOUD-078's named gap) | order: current valid → keep; else `.backup` valid → restore it; else defaults. Scope the rsync to the missing file(s) or `--ignore-existing` — **check intent upstream first** (`git log -S rsync -- chksysconfig`) |
| 4 | `sort_settings` (`001-functions`, boot) | `system.cfg` rewritten sorted | none: `cat \| grep \| sort > tmp; mv` — no `pipefail`, no size check | temp+**rename** (atomic) | n/a | mid-write: live intact ✓; but an unreadable/EIO source → empty tmp → `mv` → **empty config** | n/a | none | — | partial | `[ -s tmp ] && grep -q '^system.hostname=' tmp \|\| { rm tmp; return; }` |

### 001-functions `set_setting` / `del_setting` / `wait_lock`

| # | fn | W | Chk | Rep | Sup | Kill | B | Msg | Reach | V | Fix |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 5 | `set_setting` = `del_setting` (`sed -i /^k=/d`) then `echo k=v >>` | one key | none | sed: rename-atomic; append: in place | n/a | kill **between the two** → key gone → that setting reads as default; kill mid-append → partial trailing line (ignored by anchored readers) | lock is unbounded but stale-safe since #98 | none | — | partial (never empty, one key can revert) | one `sed -i -e "/^k=/d" -e "\$a k=v"` under one lock hold = one rename |
| 6 | `set_setting` when `system.cfg` is **missing** | copies `/usr/config/.../system.cfg` | — | cp | — | defaults win if the file was ever deleted | — | — | — | by design | — |
| 7 | `wait_lock` | `/tmp/.system.cfg.lock` (tmpfs) | noclobber create | — | trap removes own | stale lock reclaimed | logs after 30 s | — | — | holds | — |

**Cross-repo, named because #102 names them:** ES `SystemConf::saveSystemConf` writes `system.cfg.tmp` (good) and then **copies** it into the live file with `std::ofstream dst(mSystemConfFile); dst << src.rdbuf()` — truncate+stream — and removes the tmp. The atomic step exists and is then thrown away; a cut between truncate and close leaves an empty/half `system.cfg` with the complete `.tmp` sitting beside it that nothing reads. Fix is one line: `std::rename(tmp, live)`. ES also **does not take `/tmp/.system.cfg.lock`**, so its read-modify-write races every shell `set_setting` (automount/perfmode/uimode write at boot). `Settings::saveFile` → pugixml `doc.save_file(path)` in place, no backup; ES rewrites it on every boot (`ViewController::goToStart` saves `LastSystem`). Fix: save to `path + ".tmp"`, rename.

### backuptool (`projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`)

| # | fn | W | Chk | Rep | Sup | Kill | B | Msg | Reach | V | Fix |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 8 | `backup`: rotation | `mv <previous archive> archive/`, then `rm` beyond `ARCHIVE_KEEP=3` | none | rename | keeps 3 (holds (3)) | **rotation happens before the new archive exists**: a kill after `mv` leaves **no archive at the root** → `restore` says nothing to restore though `archive/` holds three; `cloud_backup` phase 2 sends nothing and exits 0 | n/a | `Backup failed…; no backup file was written.` (true, but omits that the previous one was moved away) | re-run | partial | rotate **after** the new archive is verified, or let `newest_backup` fall back to `archive/` |
| 9 | `backup`: the archive | `tar -czf ${BACKUPFILE}` **directly under the final dated name** | error path `rm -f`; the leak scan reads it back (`tar -tzf`), but that is a credential check, not an integrity gate | in place | see 8 | SIGKILL/power cut → **half `.tar.gz` under the "newest" name**; `cloud_backup` uploads it unverified and it counts toward `CLOUD_BACKUP_KEEP`; `backuptool restore` refuses it (`Backup archive is damaged`) and has no fallback | n/a | (discarded in ES chains → page says `FAILED`) | re-run backup | **FAILS** (half state carries the good name) | write `${BACKUPFILE}.partial`, `tar -tzf` it, `mv`; every existing glob (`*_SETTINGS.tar.gz`, `*.tar.gz`) already ignores `.partial` |
| 10 | `backup`: staging | `mktemp -d` + `tar -cf - \| tar -xf` under `pipefail` | ✓ | tmp dir | rm'd | litter in /tmp | — | `Backup failed while collecting files; no backup file was written.` | — | holds | — |
| 11 | `restore` | `tar -xzf … -C /` over the live tree | `tar -tzf` **before** extracting ✓ | in place, file by file | **no pre-restore snapshot**; nothing to revert to | mid-extract → half-restored tree (mix of old and archive), no reboot | n/a | `Restore reported errors. Check 'logger' output; the device will NOT reboot.` | none | **FAILS** (2)(3): no last-good kept | before extracting, archive the same file list to `${ARCHIVEFOLDER}/<stamp>-PRE_RESTORE-…tar.gz` (reuse the staging block; `archive/` is not scanned by `newest_backup`, add `*PRE_RESTORE*` to the rotation's `ls`); on failure extract it back and say so |
| 12 | `restore` | `touch .restore-finish-pending` | after extraction | — | ES clears it on FINISH (main.cpp:810) | fine | — | — | — | holds | — |
| 13 | `backup` | `sync` then messages | — | — | — | — | — | — | — | holds | — |

### cloud_sync_helper (runs at **every** `cloud_backup`/`cloud_restore` start via `load_config`, and from `post-update`)

| # | fn | W | Chk | Rep | Sup | Kill | B | Msg | Reach | V | Fix |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 14 | `update_cloud_sync_rules` | `cloud_sync-rules.txt.bak` | **none** — `cp -f` of whatever is there | truncate+write | overwritten every run | a truncated rules file is copied over the last good `.bak` on the very next run | — | — | — | **FAILS** (same shape as #1) | copy only if current passes `grep -q '^- /\*\*'` (the allowlist's catch-all); tmp+mv |
| 15 | `update_cloud_sync_rules` | `cloud_sync-rules.txt` ← `mv /tmp/cloud_sync-rules.new` | none | **cross-filesystem `mv` = copy+unlink = truncate+write** (root is squashfs, `/var` is tmpfs — `var.mount`; `/tmp` is not on `/storage`) | — | half allowlist, catch-all `- /**` (written last) lost first. Mitigated: the helper re-runs before every saves transfer and re-appends the defaults, so rclone never reads the torn file — but the player's own rules past the cut are gone, and #14 then destroys the copy | — | none | — | partial | build in `${target}.new` (same dir) + `mv` (rename) |
| 16 | `update_cloud_sync_config` | `cloud_sync.conf.bak` | none | truncate+write | overwritten every run | as 14 | — | — | — | partial | as 14 (`bash -n` as the validity check) |
| 17 | `migrate_key` / new-default loop | `echo KEY=… >> cloud_sync.conf` | none | append | — | partial trailing line → `source` errors mid-file; **`cloud_backup`/`cloud_restore` do not check `source`'s status** → run with e.g. `SAVES_REMOTE` unset → `remote:/` | — | none | — | partial (microsecond window; consequence large) | `bash -n conf \|\| cp conf.bak conf`; `source … \|\| clean_exit 1` |
| 18 | `main` | 3× `sed -i` verbose strip; `BACKUPMETHOD` sync→copy; `.pre-copy-default`; marker | — | rename each | `.pre-copy-default` **never removed** | fine | — | — | — | holds ((3) cosmetic) | — |
| 19 | `cloud_sync_cleanup_duplicates.sh` | `conf.cleaned` (same dir) → `mv` on `&&` | awk success | rename | — | live intact | — | `Duplicate variable assignments removed…` **printed even when awk failed** | — | holds for data; **uses `gensub` (gawk-only)** — on busybox awk it fails every time and lies | `awk` portable `sub()`; print only on success |

### cloud_backup

| # | fn | W | Chk | Rep | Sup | Kill | B | Msg | Reach | V | Fix |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 20 | `backup_game_saves` | `rclone copy/sync SAVESPATH → SAVES_REMOTE` | rclone exit; `network_lost_during_run` probes | per-object atomic on cloud backends; a cut copy leaves the old object | **copy mode (default): an overwritten cloud save has no kept copy**; sync mode: `--backup-dir …-replaced/<stamp>`, never pruned | per file old-or-new ✓; run partial → non-zero, stamp records it | ✓ `RCLONE_NET_OPTS` + fallback | card: `Game saves backup failed: Temporary failure, retry may help` (from `report_rclone_error`, shown because "failed"); then `FAILED - SEE /var/log/cloud_sync.log` | GAME SETTINGS row (not named on the card) | partial | `--backup-dir` in copy mode too (`--update` with a wrong clock overwrites a newer cloud save); after exit 0/9 prune `-replaced/*` to the newest stamp (one cycle, D-CLOUD-078 (3)) |
| 21 | via `cloud_saves_root record` | `saves-root` | identity re-read after run ✓ | `echo >` truncate | — | empty → "no record" → next check passes unchecked | — | — | — | P3 | tmp+mv |
| 22 | `rclone rmdirs --leave-root` | remote empty dirs | only after 0/9 | — | — | — | ✓ | `Empty-directory cleanup failed (non-fatal)` (shown) | — | holds | — |
| 23 | `backup_system_files` | `copyto <archive>` under its **dated name** (never overwrites); `device.json`; retention `deletefile` beyond KEEP, only this device's labelled archives, only after success; marker `settings-backup.uploaded` written **only after `rclone size` equals local bytes** | ✓ positive (bytes) | new object per backup | ✓ trimmed after success | copy cut → old objects untouched, marker unwritten → resent next run ✓ | ✓ | `Failed to create/access remote backup directory (exit code: 3)` (shown, **exit code on screen**); `The cloud copy did not come back the size we sent (X vs Y); it will be sent again next time` — **not shown** (no keyword) so the card says only `FAILED - SEE /var/log…` | row | **holds** (the model case) — with one hole: it uploads whatever `*.tar.gz` sits at the root with **no integrity check**, so #9's half archive goes up and counts toward KEEP | `tar -tzf` (or `gzip -t`) before `copyto`; skip and say so |
| 24 | `device.json` | local `cat >` + remote `copyto` | — | truncate (local); object (remote) | — | half local json, regenerated every upload | ✓ | — | — | holds in effect | — |
| 25 | `record_last_run` | `last-backup` / `last-settings-backup` | — | `printf >` truncate | — | empty → row reads "never"; `--recent` treats it as "no successful backup" → full pass (fails safe) | — | — | — | partial | tmp+rename exactly as ES's `recordOutcome` already does |

### cloud_restore

| # | fn | W | Chk | Rep | Sup | Kill | B | Msg | Reach | V | Fix |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 26 | `restore_game_saves` | `rclone copy SAVES_REMOTE → SAVESPATH` | exit + probes | rclone 1.75 local dest: `.partial` + rename → **old or new per file** ✓ | **an overwritten local save has no kept copy**. `--update` only on the automatic paths (startup/SYNC SAVES) and only by mtime; the manual RESTORE SAVES row passes none | half run → some files new, rest old; reported FAILED though what arrived is good | ✓ | card: `Remote path check failed: …` / `Game saves restore failed: …` (shown); `The saves folder … is on a different card…` — **not shown**; its second line names a CLI (`run: cloud_setup --accept-saves-root`) | row | partial — D-CLOUD-078's second named gap | `--backup-dir /storage/.cache/cloud_sync/replaced/<stamp>` on the saves restore; prune to the newest stamp after a good run |
| 27 | `restore_system_files` | `copyto <newest archive> → SETTINGS_BACKUPS/<same name>` | `folder_has_archives` positive; `--ignore-times` (#53) | partial+rename; never deletes local | old local archives stay (then `backuptool` rotation) | cut → nothing partial ✓ | ✓ | console only: `No backup for this device. The cloud holds backups from: A B` / `There is no settings backup in the cloud yet` (good words) | — | **holds**; `backuptool restore` verifies before extracting | — |
| 28 | `record_last_run` | `last-restore` / `last-settings-restore` | — | truncate | — | as 25 | — | — | — | partial | tmp+mv |

### cloud_content_backup / cloud_content_restore

| # | fn | W | Chk | Rep | Sup | Kill | B | Msg | Reach | V | Fix |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 29 | backup: `rclone copy` per system; gamelist `--update` pass | remote objects | exit; `network_gone` → 69 with stamp | per-object atomic | copy-only; a differing cloud ROM is replaced (a re-upload is the intent) | old-or-new per file | ✓ | page shows nothing but `FAILED`; console: `Backup of nes failed (rclone exit 3).` (**exit code**) / `The network went away while backing up nes (rclone exit 5). Stopped.` | page: none | holds by design | wording only |
| 30 | restore: `rclone copy` per system | `/storage/roms/<sys>` | as 29 | partial+rename | copy-only, never deletes | old-or-new per file | ✓ | `Restore of nes failed (rclone exit 3).` | none | holds | wording |
| 31 | `--match --apply` | `rclone delete/sync --max-delete` **local** | root positively confirmed non-empty before any deletion ✓ (rule 3); `--max-delete` cap | in place | deletions final — **D-CLOUD-023**, cloud is the record | cap is not a transaction (documented: exits 7 having removed up to N) | ✓ | page: `REMOVED N FILES FROM THIS DEVICE` + per-system; `Refusing to change anything: the cloud content folder lists nothing.` (console) | — | holds by decision | — |
| 32 | `--set-systems` | `content-systems` | — | `printf >` **truncate** | — | **empty file = "none selected" (a real answer by the script's own comment)** → every later `--selected` says `No systems are selected for this device.` | — | that line | re-pick | **FAILS** (2): a kill turns the choice into a different valid choice | write `.tmp` + `mv` (two lines) |
| 33 | stamps `last-content-backup/restore/match` | — | — | truncate | — | as 25 | — | — | — | partial | tmp+mv |
| 34 | `--scan` | `/tmp/cloud-scan.*` only | exit 69 when the listing failed and the network is gone ✓ | — | rm on EXIT | — | ✓ | `No network connection. Skipped.` (stderr) | — | holds (script side; whether the pinned picker reads the code: not determined here, #105 says it did not) | — |

### cloud_capture (the reference implementation — every row holds)

| # | fn | W | Chk | Rep | Sup | Kill | V |
|---|---|---|---|---|---|---|---|
| 35 | `seal` | `stage/<sha256>` | stat before/after equal; 64-hex hash; inode ≠ source; `cp -p` → `.tmp.$$.N` → `mv` | rename, content-addressed (existing seal kept) | stage GC after write removes unreferenced seals | litter `.tmp.<pid>.*` swept by pid liveness | holds |
| 36 | merge → manifest | `manifest-<id>.json` | jq output validated twice; inode/mtime unchanged since load (else re-run once, then `manifest-moved`); card unchanged | `mktemp` in same dir → `mv -f` | corrupt manifest moved aside as `.corrupt-<ts>` (**never pruned** — P3); newer schema refused | previous manifest intact at every step (the script says so in each error) | holds |
| 37 | `finish` | `last-capture` (one line per mode), `capture-failures` (tail 20) | — | temp + `mv -f` | ✓ | never torn | holds |
| 38 | id adoption | `mv manifest-<old-id> → <new>` once, never over an existing file | ✓ | rename | — | — | holds |

### cloud_device_id · cloud_saves_root · cloud_net_ready · 102-cloud-saves

| # | fn | W | Rep | Kill | V | Fix |
|---|---|---|---|---|---|---|
| 39 | `cloud_device_id` | `cloud_sync-device-id` | `printf >` truncate | empty → `[ -s ]` false → regenerated deterministically from the permanent MAC (machine-id fallback only without an adapter) | holds in effect | — |
| 40 | `heal_poisoned` | `.previous` (append, `grep -qxF` idempotent) **before** the new id | append | kill between → old id still stored → heals again next run | holds; `.previous` never pruned **by design** (restore reads it) | — |
| 41 | `cloud_saves_root record/accept` | `saves-root` | `echo >` truncate | empty → "no record" → next check passes without comparing | P3 | tmp+mv |
| 42 | `cloud_net_ready` | log only; `>>> doing network` once | — | — | holds (bounded: `--wait 60` + 3 s grace, nmcli calls under `timeout 5`) | — |
| 43 | `102-cloud-saves` | spawns `cloud_capture --full` detached | — | — | holds | — |

### cloud_setup · cloud_remote · cloud_oauth · cloud_migrate_layout

| # | fn | W | Chk | Rep | Kill | V | Fix |
|---|---|---|---|---|---|---|---|
| 44 | `cloud_setup --set-saves-remote` | 3 keys via 3 separate `sed -i`/appends | `syncpath_problem` probes the provider **before** writing ✓ | rename each | kill between → SAVES new, SETTINGS/CONTENT old (inconsistent trio, no data loss; re-run fixes) | partial | one `sed -i` with three `-e` |
| 45 | `--use-content-root`, `--seed-folders` | conf line; remote `mkdir` + `README.txt` only if absent; reports what **exists** (`lsf`, never `lsjson --stat`) | ✓ positive | — | — | holds | — |
| 46 | `cloud_remote create` | rclone.conf remote | `lsd` after create; **rolled back** (`config delete`) on failure; refuses an existing name | rclone's own write (atomicity not determined) | — | holds | — |
| 47 | `cloud_oauth _write_config` | same pattern as 46; `/var/run/cloud_oauth/session.json` | verify then delete on failure ✓ | `open(w)`+`json.dump` on tmpfs | torn JSON → `read_state` → `{}` → `idle` (fails safe) | holds | — |
| 48 | `cloud_migrate_layout relocate` | remote copy → `rclone check` (whole output grepped) → `purge`; conf `sed -i` **after** both moves | ✓ | — | kill between purge and conf → device points at the purged folder until re-run; re-run heals (`has_files old` false → skip → conf written) | partial, self-healing; messages already say "Both folders are intact; nothing was removed" | — |

### post-update / 003-upgrade / rocknix-update / init

| # | fn | W | Rep | Kill | V | Fix |
|---|---|---|---|---|---|---|
| 49 | `post-update` (rocknix) | `rsync -a --delete --exclude=configs /usr/config/system/`; `rsync --ignore-existing game`; `cp -f retroarch-core-options.cfg` (**in place, every update, by upstream design**); 2× `sed -i` on system.cfg; helper (§E) | rsync/sed rename ✓; cp truncate | a cut during that `cp -f` leaves an **empty core-options file → next boot `verify()` (#3) rsyncs the whole default tree → `system.cfg` defaults win** | partial → chains into #3 | `cp` via tmp+mv; and #3's scoping |
| 50 | `rclone/sources/post-update` | — | — | **not installed by `rclone/package.mk`** (only `rocknix/sources/post-update` is copied to `/usr/share/post-update`) — an orphan duplicate of the cloud block | dead file | delete or wire it in |
| 51 | `rocknix-update` | `curl -o /storage/.update/<name>.tar` then `.sha256`, checksum after | in place under the final name | half `.tar` → next boot `init check_update` finds `*.tar`, avfs/tar fails, `do_cleanup` deletes it, reboots (fails closed at the cost of a boot) | partial | download as `<name>.part`, `mv` after the checksum matches |
| 52 | `init update_file` | `dd conv=fsync` KERNEL/SYSTEM onto `/flash` **in place** | — | power cut mid-write = unbootable; no A/B | upstream design, out of remit | noted only |

## 2. Messages

Graded against "what did not happen, in the player's words, then how to recover"; no codes/paths/`logger`.

**Card outcome lines (ES, pinned):** `FAILED - SEE /var/log/cloud_sync.log` — fails (log path, no recovery). The four SKIPPED/COMPLETED lines pass. `WAITING FOR THE NETWORK...` passes.

**Transfer page done state:** `FAILED` alone; no summary of what is in place (the `N FILES BACKED UP/RESTORED` summary is gated on `mExit == 0`); no retry — fails on all three counts, as #105 already tabulates.

**Script lines the card can show (contain FAILED/ERROR/WARN):**
- `Game saves backup failed: Temporary failure, retry may help` / `…: Directory not found or permission denied` / `…: Fatal error - rclone giving up` (`report_rclone_error`) — rclone's taxonomy in the player's face; no recovery line.
- `Failed to create/access remote backup directory (exit code: 3)` / `Failed to access remote backup directory (exit code: 3)` — exit code on screen.
- `Remote path check failed: …`, `Settings backup file transfer failed: …`, `Settings backup file restore failed: …`, `Empty-directory cleanup failed (non-fatal)`.
- `Game saves backup: COMPLETED WITH ERRORS` / `Settings backup file transfer: COMPLETED WITH ERRORS` — a partial success reported as errors.
- `Warning: Duplicate variable assignments detected in cloud_sync.conf` (first line of a multi-line `echo -e`).

**Script lines that exist but the card never shows (no keyword), so the player gets `FAILED - SEE …` with no reason:** `Your cloud storage did not respond. Check that it is still set up and that its sign-in has not expired.` (good words, wasted); `You must configure rclone before using this tool. Run \`rclone config\` to get started.` (also CLI-facing); `RESTOREPATH (…) differs from SAVESPATH (…)…remove RESTOREPATH from cloud_sync.conf`; `The saves folder /storage/roms is on a different card than the last time saves were synced (now uuid:…, last time uuid:…).` + `Nothing was transferred. If the second card is missing, put it back; if the change is intended, run: cloud_setup --accept-saves-root` (right idea, names a CLI); `The cloud copy did not come back the size we sent (X vs Y); it will be sent again next time` (the #53 guard's own words — the one line that says what is and is not in place, and it never reaches the card); `Remote remote:/ROCKNIX/Saves is not accessible`.

**Console flows (everything visible):** `====================================` rules, `=> CLOUD RESTORE UTILITY`, `Log file: /var/log/cloud_sync.log`, ANSI colours; `cloud_content_*`: `Backup of nes failed (rclone exit 3).`, `Restore of nes failed (rclone exit 3).`, `The network went away while backing up nes (rclone exit 5). Stopped.`, `rclone is not configured. Use Game Settings > Cloud > Connect Or Repair Cloud Storage first.` (names a menu path — verify it still exists after D-UI-022's relabel).

**backuptool `fail`/`note`:** `No settings backup found in /storage/roms/backup. Nothing to restore.` (path); `Backup archive is damaged (/storage/roms/backup/….tar.gz). Restore aborted; nothing was changed.` (right shape, path); `Restore reported errors. Check 'logger' output; the device will NOT reboot.` — fails (developer-facing, and untrue about state: the tree is half-restored); `Restore complete. Wifi/account passwords are not part of backups and must be re-entered.` ("Wi-Fi" per convention); `Cannot create a backup: 'tar' is missing from this image.`; `Backup failed while collecting files; no backup file was written.` / `Backup failed; no backup file was written.` (good shape; omits that the previous archive was rotated away, #8); `Backup complete: /storage/roms/backup/….tar.gz` (path); `Warning: N credential-looking line(s) in … Review before sharing or syncing it.`; `Error loading custom backuptool configs. Using defaults.`

Suggested shapes (one per failure class, for the card's keyword filter to pick up and for the console): `WE COULDN'T FINISH BACKING UP YOUR SAVES. WHAT DID ARRIVE IS IN YOUR CLOUD; THE REST IS AS IT WAS. TRY AGAIN FROM GAME SETTINGS.` · `YOUR CLOUD DIDN'T ANSWER. CHECK IT UNDER MANAGE CLOUD STORAGE, THEN TRY AGAIN.` · `YOUR SETTINGS WERE ONLY PARTLY RESTORED. THE PREVIOUS SETTINGS WERE PUT BACK. TRY AGAIN.` The exit code stays in the `log_message` line's log half only (log the code with `"false"`, echo the words).

## 3. Prioritised fixes

### P1 — a kill leaves an empty/half state, or defaults win

1. **`chksysconfig` (#1, #3, #49).** Smallest change, no new file (keeps exactly one record at rest and needs no migration): `valid() { [ -s f ] && ! grep -qa … binary && grep -q '^system.hostname=' f; }`; `backup()` copies only a valid file, to `.backup.tmp` then `mv`, and runs at boot after `verify` as well as at shutdown; `verify()` tries `.backup` (if valid) for **every** invalid case before touching defaults, and the blanket `rsync -a /usr/config/ /storage/.config` is scoped to the missing retroarch files (or `--ignore-existing`) — **confirm upstream intent first** (`git log -S'rsync -a /usr/config' -- …/chksysconfig`). *Test:* fixture with a good `system.cfg` + `.backup`; `truncate -s0 system.cfg`; `chksysconfig verify` → hostname equals `.backup`'s, not `H700`; repeat with `.backup` also empty → defaults; `chksysconfig backup` with an empty current → `.backup` unchanged (cmp). *Upgrade:* an upgraded device's `.backup` may already be a default copy (RG SP) — the first valid boot replaces it; if the live file is also default it gets blessed (already lost). Fresh install: identical path. (D-CLOUD-078's text proposes `.last-good`; I recommend keeping the `.backup` name so there is one record and no migration.)
2. **ES `SystemConf::saveSystemConf` copy → `std::rename(tmp, live)`; `Settings::saveFile` to `.tmp` + rename; take `/tmp/.system.cfg.lock` (noclobber) around the shell-shaped read-modify-write.** Cross-repo (`ROCKNIX/emulationstation-next`), bump `PKG_VERSION`. *Test:* `tests/` ASan-style unit that kills between open and close is awkward; a VM test: `strace -e inject=write:error=EIO` on ES while flipping a switch, then `cat system.cfg` — content or previous, never empty. *Upgrade:* none.
3. **`backuptool backup` (#8, #9):** `tar -czf "${BACKUPFILE}.partial"` → `tar -tzf` → `mv`; move the rotation `mv PREVIOUS archive/` **after** that `mv`. *Test:* `PATH` shim `tar` that emits 1 MiB then `kill -9 $PPID` → assert the previous archive is still the only `*.tar.gz` at the root, a `.partial` exists, `newest_backup` unchanged; `cloud_backup --system-only` afterwards uploads the previous one and skips the `.partial`. *Upgrade:* none — every reader's glob already excludes `.partial`.
4. **`backuptool restore` (#11):** pre-restore snapshot into `archive/<stamp>-PRE_RESTORE-…tar.gz` (reuse the staging block, ~15 lines); on a failed extraction, extract it back and say `YOUR SETTINGS WERE ONLY PARTLY RESTORED. THE PREVIOUS SETTINGS WERE PUT BACK.`; add `*PRE_RESTORE*` to the rotation's `ls`. *Test:* shim `tar` that extracts two members then dies → `system.cfg` equals the pre-restore copy. *Upgrade:* none.
5. **`cloud_content_restore --set-systems` (#32):** `.tmp` + `mv`. *Test:* `kill -9` a `printf` shim → file is either the old selection or the new one, never empty. *Upgrade:* none.

### P2 — no positive check / superseded never removed / revert cheap but absent

6. **`--backup-dir` for one cycle (#20, #26).** Restore: `--backup-dir /storage/.cache/cloud_sync/replaced/<stamp>`; backup in copy mode: `--backup-dir ${REMOTENAME}${SAVES_REMOTE%/}-replaced/<stamp>` (the sync-mode path already exists); after exit 0/9 delete every `replaced/*` but the newest stamp (also fixes sync mode's never-pruned history). *Test:* seed a newer local save, run `cloud_restore --yes --saves-only`, assert the loser is under `replaced/<stamp>/…` and the previous stamp dir is gone. *Upgrade:* new dir under `.cache`; nothing to migrate; disk bounded to one cycle.
7. **`cloud_backup` phase 2 (#23):** `tar -tzf`/`unzip -t` before `copyto`; skip a damaged archive with `THE SETTINGS ARCHIVE ON THIS DEVICE IS DAMAGED. BACK UP SETTINGS AGAIN.` *Test:* plant a truncated `*.tar.gz` at the root → nothing uploaded, marker unwritten, exit non-zero.
8. **`cloud_sync_helper` (#14–#17):** build the merged rules in `${target}.new` (same filesystem) + `mv`; take `.bak` only from a file that passes a validity check (`^- /\*\*` for rules; `bash -n` for conf); in `cloud_backup`/`cloud_restore`, `source … || clean_exit 1` and `bash -n` first, falling back to `.bak`. *Test:* `truncate` the rules file to its first half; run the helper → `.bak` still the full previous file; `cloud_backup --yes --saves-only` refuses a conf that fails `bash -n`. *Upgrade:* none.
9. **`sort_settings` guard; `set_setting` as one `sed -i -e '/^k=/d' -e '$a k=v'`.** *Test:* `chmod 000 system.cfg`-style unreadable source → `sort_settings` leaves the file alone; kill shim between delete and append no longer possible.
10. **Stamps via tmp+rename** (#25, #28, #33, #21, #39): one `write_stamp()` helper duplicated into each script (there is no shared library) mirroring `ThreadedCloudSync::recordOutcome`. *Test:* kill shim on `printf` → previous stamp remains.
11. **`rocknix-update` (#51):** download as `.part`, `mv` after the checksum. *Test:* kill curl mid-download → no `*.tar` in `.update`, next boot does not attempt an update.
12. **`cloud_setup --set-saves-remote` (#44):** one `sed -i` with three expressions.

### P3 — messages and cosmetics

13. Reword per §2; make every failure line carry a keyword the card shows **or** move the outcome into the exit path ES already names; drop `(rclone exit N)`/`(exit code: N)` from echoed text (keep in the log half); `Wifi` → `Wi-Fi`; `Log file:` line to log-only; `cloud_setup --accept-saves-root` → the menu row's name; verify `Game Settings > Cloud > Connect Or Repair Cloud Storage` still names a real row.
14. Prune `manifest-*.corrupt-*` and `cloud_sync.conf.pre-copy-default` after one successful run; delete the orphan `rclone/sources/post-update`; fix `cloud_sync_cleanup_duplicates.sh`'s `gensub`.
15. `.claude/rules`/D-CLOUD-078 text: recommend `.backup` (existing name) over a new `.last-good` so the "exactly one record at rest" rule is met without a migration.

## 4. Where "holds already" is the verdict

`cloud_capture` end to end (seals, manifest, stamps, adoption, GC); `cloud_backup` phase 2's marker-after-size-check and labelled retention; `cloud_restore` phase 2 (download then verify-before-extract in `backuptool`); `cloud_device_id` (deterministic regeneration, `.previous` append-first); `cloud_remote`/`cloud_oauth` (create → verify → roll back); `cloud_migrate_layout` (copy → check → purge → conf; self-healing re-run); `cloud_setup --seed-folders` (positive existence check); `cloud_net_ready`; `102-cloud-saves`; the D-CLOUD-075 bounds (`RCLONE_NET_OPTS` + fallback on every socket-opening rclone call in all five transfer scripts, probes tighter, `nmcli` under `timeout`).

## 5. Not determinable from reading

- **ext4 semantics after a power cut.** No writer fsyncs; rename-based writers are strictly better than truncate-based ones, but `mv` without `fsync` can still leave a zero-length file at the new name on a cut. For the two config files a `sync -f` (or `fsync` in ES) after the rename is cheap; whether `auto_da_alloc` (default on) was in effect on the RG SP's mount is not visible in `init` (no explicit `data=`/`auto_da_alloc` options).
- **rclone's own `rclone.conf` write atomicity** (cloud_remote/cloud_oauth rely on it).
- **Is gawk in the image?** If not, `cloud_sync_cleanup_duplicates.sh` has never worked (busybox awk lacks `gensub`) and prints success regardless.
- **Does the pinned picker read `--scan`'s exit 69?** #105 says it ignored it; I did not trace the ES caller (`GuiMenu.cpp:3869` runs it through `executeScriptLegacy`, which returns lines, not a code).
- **Whether ES rewrites `es_settings.cfg` during the 5 s before `backuptool restore`'s `systemctl reboot`** (it saves only on change, so probably not — but the restore runs while ES is alive under `foot`, and a save in that window would clobber the restored file).
- **`Paths::getSystemConfFilePath()`** was not located by grep at the pinned commit; #102 confirms ES's `system.cfg` is `/storage/.config/system/configs/system.cfg`.
- Whether the maintainer wants `verify()`'s whole-tree `rsync -a` narrowed — it is upstream JELOS code and may be intentional ("restore everything if any are missing").
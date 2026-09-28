# Punch List — the whole feature drop, both repositories, against upstream
**Generated:** 2026-09-28
**Source Audit:** `docs/audits/2026_09_25-milestone-rc-round-since-258/04-analysis.md`
**Total Items:** 80 (Critical: 1, High: 30, Medium: 43, Low: 6) -- PL-079 and PL-080 added 2026-09-28 from stream A's reading
---

## Instructions for Executing Agent

Each item is one fix with its acceptance named; items are ordered by severity, then by the packet they came from. The maintainer's order is `release-candidates.md` step 6: the Critical and the Highs are resolved (Phase 7) before any PR is cut, and a fix that changes the build goes back to step 2. Every fix carries its `Already written:` line (D-WORKFLOW-050) and, where the acceptance names `tools/last-good-scripts-test`, the case is written first and seen to FAIL on the unfixed script (`engineering-practices.md` § Guards must fail closed). The seats' evidence is in `02-forward-audit.md` § Verification under the finding's number; the packets and the seats' outputs are under `seats/`.

---

## Critical Priority
## PL-001: `--match --apply` deletes a system whose cloud listing failed, and enforces no previewed plan
- **Severity:** Critical
- **Category:** Data loss (guards fail closed)
- **Source Finding:** F-CS-01 (both seats) + F-CS-03 (gpt)
- **Owner area:** cloud_content_restore
- **Where:** projects/ROCKNIX/packages/network/rclone/sources/cloud_content_restore:565-596, 661-708
- **What:** `match_plan_one` treats an `rclone lsf` that failed (network, auth) as an absent system and plans `remove`; apply recomputes the plan and passes its own count to `--max-delete`, so the guard the comment at `:696-703` promises cannot trip. Fix: a listing whose exit status is not 0 (or rclone's 3/4 for a genuinely absent path) aborts the plan for that system with `COULDN'T FINISH`; the preview writes its per-system plan to a file; apply reads it, passes those counts to `--max-delete`, and refuses a system whose verb changed.
- **Acceptance:** `tools/last-good-scripts-test` case: a system whose listing returns 5 is neither planned nor removed; a system planned `remove` in the preview and `sync` at apply is refused; the `--max-delete` count on apply equals the preview's

## High Priority
## PL-002: The shared rotation generators sit outside their consumers' build stamps
- **Severity:** High
- **Category:** Correctness
- **Source Finding:** F-EM-01 (gpt)
- **Owner area:** packages emulators (rotation tables)
- **Where:** the rotation generators and the `-lr` recipes that consume them (bucket 9)
- **What:** A change to a generator does not invalidate the packages that embed its table, so a wrong table ships silently on a warm root. Fix: the generator files live under (or are hashed into) each consumer's `PKG_DIR`, or the recipe's `PKG_VERSION`/stamp input names them.
- **Acceptance:** editing a generator and running `./scripts/build <core>` rebuilds the core (the `build_target` stamp moves)
## PL-003: The saved-network join stores nmcli's escaped passphrase
- **Severity:** High
- **Category:** Correctness (target tool)
- **Source Finding:** F-WF-02 (gpt)
- **Owner area:** wifictl
- **Where:** projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:261-263
- **What:** `nmcli -s -g 802-11-wireless-security.psk` escapes `:` and `\` (confirmed on guest d: `ab\:cd\\ef12345` for `ab:cd\ef12345`) and the value is written to `wifi.key` as is. Fix: `--escape no` (or `nm_unescape`, which the name paths already use), and the exit status checked before `set_setting`.
- **Acceptance:** `tools/last-good-scripts-test` case: a PSK with `:` and `\` round-trips through join and read back byte for byte; on the guest, `get_setting wifi.key` after a join equals the value typed
## PL-004: An unquoted array expansion drops every backed-up path that contains a space
- **Severity:** High
- **Category:** Guards fail closed (data loss)
- **Source Finding:** F-BR-01 (claude)
- **Owner area:** backuptool
- **Where:** projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool (the location arrays)
- **What:** The location list is expanded unquoted into `zip`/`find`, so a path with a space becomes two paths that do not exist and the archive is written short, exit 0. Fix: `"${LOCATIONS[@]}"` everywhere the arrays reach a command; the archive's member count asserted against the walk's.
- **Acceptance:** a location named `my games/` is in the archive; the scripts test constructs it and fails the unfixed script
## PL-005: The credential scan warns and the backup still exits 0; detected credentials do not block publication
- **Severity:** High
- **Category:** Credentials
- **Source Finding:** F-BR-02 (claude) + F-BR-04 (gpt)
- **Owner area:** backuptool
- **Where:** backuptool (the credential scan and the publish step)
- **What:** Both seats: the scan runs on the `.partial` archive, logs a WARN and the run continues to rename and, with `--then-cloud`, upload. Fix: a positive detection ends the run with `COULDN'T FINISH - A SIGN-IN WAS FOUND IN THE BACKUP` before the rename, the partial removed.
- **Acceptance:** a settings tree seeded with a `pass =` line produces no archive and the outcome line; `tools/last-good-scripts-test` case
## PL-006: The credential scan's prefix class admits no capital, so `Password=` and `TOKEN=` pass under a custom `LOCATIONS`
- **Severity:** High
- **Category:** Credentials
- **Source Finding:** F-BR-03 (claude)
- **Owner area:** backuptool
- **Where:** backuptool (the scan's prefix class)
- **What:** The default set is covered by name; a custom location's files are scanned with a lowercase-only class. Fix: a case-insensitive match (`grep -i`) and the class widened to the shapes `.githooks/pre-push` already carries.
- **Acceptance:** `Password=<long literal>` in a custom location is caught; the scripts test covers it
## PL-007: The pre-restore snapshot covers the device's selection, not the archive's members
- **Severity:** High
- **Category:** Correctness
- **Source Finding:** F-BR-01 (gpt)
- **Owner area:** backuptool
- **Where:** backuptool (the pre-restore snapshot)
- **What:** The snapshot taken before a restore walks the device's `LOCATIONS`, so a member of the archive outside that set is replaced with nothing kept; the rollback then reports the device unchanged. Fix: snapshot the archive's member list (the paths `unzip -l` prints) intersected with what exists on the device.
- **Acceptance:** restoring an archive with a member outside `LOCATIONS` and rolling back restores the original file
## PL-008: A broad custom selection nests the backup directory's own credential-bearing snapshots into the archive
- **Severity:** High
- **Category:** Credentials
- **Source Finding:** F-BR-02 (gpt)
- **Owner area:** backuptool
- **Where:** backuptool (custom `LOCATIONS` and the backup directory)
- **What:** A `LOCATIONS` entry that contains the backup directory pulls the previous snapshots (which carry `rclone.conf`) into the new archive. Fix: the backup directory and the snapshot directory are excluded unconditionally, whatever the selection.
- **Acceptance:** an archive made with `LOCATIONS=/storage/.config` holds no member under the backup directory
## PL-009: A failed snapshot collection reads as an empty device
- **Severity:** High
- **Category:** Guards fail closed
- **Source Finding:** F-BR-05 (gpt)
- **Owner area:** backuptool
- **Where:** backuptool (the snapshot collector)
- **What:** The collector's failure is indistinguishable from nothing to collect, so a restore proceeds with no rollback record. Fix: a distinct return code for "nothing to collect"; any other failure ends the restore before it writes.
- **Acceptance:** a collector made to fail (an unreadable location) aborts the restore with the outcome line; the scripts test covers it
## PL-010: A legacy restore overwrites the device's cloud identity
- **Severity:** High
- **Category:** Upgrade path
- **Source Finding:** F-BR-12 (gpt)
- **Owner area:** backuptool
- **Where:** backuptool (the legacy restore's exclusions)
- **What:** Restoring an archive from the old format writes `storage/.config/rclone/rclone.conf` over the device's own, so two devices end up as one identity in the cloud. Fix: add the rclone config (and `cloud_device_id`'s record) to both exclusion lists, the legacy path included.
- **Acceptance:** a legacy archive carrying an `rclone.conf` leaves the device's untouched; the scripts test covers it
## PL-011: A failed settings write returns success
- **Severity:** High
- **Category:** Guards fail closed
- **Source Finding:** F-PB-08 (gpt)
- **Owner area:** rocknix scripts (settings)
- **Where:** projects/ROCKNIX/packages/rocknix/sources/scripts (`write_setting_line`)
- **What:** `write_setting_line`'s failure branch ends in `rm -f` of the temporary and returns 0, so `set_setting` reports a value it did not write. Fix: return non-zero from the failure branch and let `set_setting` say so.
- **Acceptance:** `set_setting` on a read-only file exits non-zero; the scripts test covers it
## PL-012: `--all` restores ROMs and never BIOS, and re-anchors the media filters
- **Severity:** High
- **Category:** Correctness
- **Source Finding:** F-CS-02 (claude) = F-CS-13 (gpt)
- **Owner area:** cloud_content_restore
- **Where:** cloud_content_restore (`--all`, `remote_for`)
- **What:** `--all` sets `DIRS=("")` and `remote_for("")` resolves to the ROMs container; only `--selected` appends BIOS; the media excludes are anchored to a system root that `--all` does not use. Fix: `--all` enumerates ROMs and BIOS as the selected path does, with the same anchors.
- **Acceptance:** a journey restore with `--all` brings `BIOS/` down; `tools/cloud-round-trip` asserts a BIOS file's presence after `--all`
## PL-013: A cancel during the scan's image pass downloads everything already queued first
- **Severity:** High
- **Category:** Concurrency
- **Source Finding:** F-RA-01 (claude)
- **Owner area:** raofflineproxy-ctl
- **Where:** raofflineproxy-ctl (`run_image_pass`, the scan's cancel)
- **What:** The image pass's pool drains its queue before the interrupt is honoured, so a CANCEL on the page waits for every queued download. Fix: catch the interrupt inside the pool's loop and `pool.shutdown(cancel_futures=True)`.
- **Acceptance:** CANCEL during the image pass ends the run inside two seconds on the guest (a frame series shows the page close)
## PL-014: The folder rescan deletes FileData the collections and the filter index still point at
- **Severity:** High
- **Category:** Use after free
- **Source Finding:** F-ES-01 (claude, bucket 8)
- **Owner area:** EmulationStation SystemData / collections
- **Where:** es-app/src/SystemData.cpp (`rescanIfFolderChanged`), the collections' file pointers
- **What:** The rescan clears the root folder and repopulates; a collection or filter index that held pointers into the old tree reads freed memory on its next draw -- the class `es-code-traps.md` § A rescan that deletes FileData names. Fix: drop the collections' and the filter index's references before the clear (as the view is dropped), re-point after.
- **Acceptance:** the rescan soak on the VM (a folder changed under a game list with a collection open, 200 iterations) runs with no crash; `es-syntax-check` PASS
## PL-015: A root-level saves path nests the settings and content folders inside it
- **Severity:** High
- **Category:** Data layout
- **Source Finding:** F-RS-03 (gpt) = F-RS-01 (claude)
- **Owner area:** cloud_setup
- **Where:** cloud_setup:385-390 (`--set-saves-remote`)
- **What:** With the saves remote at the cloud's root the derived settings and content paths land under it, so a later saves sync's `--backup-dir` and prune walk the other tiers. Fix: refuse a saves remote at the root or derive the siblings beside it, never inside.
- **Acceptance:** `cloud_setup --set-saves-remote /` is refused with the reason, or the derived paths are `/ROCKNIX/Settings` beside `/ROCKNIX/Saves`; the scripts test covers both
## PL-016: Text typed on the phone before the window is up is never delivered
- **Severity:** High
- **Category:** Least surprise
- **Source Finding:** F-RS-08 (gpt) = F-RS-02 (claude)
- **Owner area:** cloud_oauth (the phone page)
- **Where:** cloud_oauth:910 (`poll()`)
- **What:** The page's `poll()` sets `ready = open;` and nothing sends what the box already holds once the window opens. Fix: on the transition to ready, send the box's content as one `type=` post and reset `sent`.
- **Acceptance:** typing on the phone page before the window opens reaches the field after it opens (a guest run with the page driven by curl and the window's log)
## PL-017: The phone page's Back button bypasses the box's text model
- **Severity:** High
- **Category:** Least surprise
- **Source Finding:** F-RS-09 (gpt)
- **Owner area:** cloud_oauth (the phone page)
- **Where:** cloud_oauth:815
- **What:** The named-key buttons post `key=BackSpace` without trimming `box.value` or decrementing `sent`, so the device's field and the phone's box differ by a character after every correction and a password is sent altered. Fix: Back trims the box and the count; the other named keys likewise route through the model.
- **Acceptance:** typing `abc`, Back, `d` on the phone page leaves `abd` in the field on guest d (the sign-in window's log); a doctest of the page's script if it is testable, else the guest run
## PL-018: `wait` returns at a successful sign-in while the bridge still holds the pad's grab
- **Severity:** High
- **Category:** Input handling (pending a fact)
- **Source Finding:** F-RS-11 (gpt)
- **Owner area:** cloud_oauth (`wait`, `GamepadBridge`)
- **Where:** cloud_oauth:1925-1943, 1385-1400, 1492-1507; ApiSystem.cpp:573-582
- **What:** The marker branch skips the `pad_is_free` loop and the bridge releases only when the window dies, so the interface re-initialises SDL under a foreign EVIOCGRAB -- the ordering its own comments say leaves it without a pad. Fix: the bridge releases the grab when the `signed-in` marker appears (the Finishing-up page takes no input) and `wait`'s marker branch runs the `pad_is_free` loop first.
- **Acceptance:** on the guest with a uinput gamepad, or on the RG35XX SP on its own yes: after an on-device sign-in the pad moves the menu without a restart -- the fact goes in `docs/releases/device-facts.md`
## PL-019: The QEMU quirk scripts write to a read-only `/etc` and nothing they write exists on a booted guest
- **Severity:** High
- **Category:** Packaging (fork-only)
- **Source Finding:** F-PB-02 / F-PB-03 (claude) + F-VM-04/05, F-PB-04/05/06 (gpt)
- **Owner area:** GENERIC_X64 quirks
- **Where:** projects/ROCKNIX/packages/hardware/quirks/devices/QEMU Standard PC (Q35 + ICH9, 2009)/091-101
- **What:** Confirmed on guest d: `/etc` is the squashfs, the journal carries `Read-only file system` from the quirk pass, hostnamed runs from `/usr/lib` with no drop-in. Every unit-graph finding filed against these scripts (the cycle, the oneshot's restart, the multiline ExecStart, the tmpfiles socket paths) describes files that never exist. Fix: delete the `/etc` writers (091-101), keep only what writes under `/storage` or `/run` and is proven needed by a boot without it.
- **Acceptance:** `journalctl -b | grep -c 'Read-only file system'` on a guest reads 0; vm-qa all suites PASS on the image without the scripts
## PL-020: An incomplete rules file can replace the live allowlist, and the consumers do not check for the catch-all
- **Severity:** High
- **Category:** Data loss
- **Source Finding:** F-CS-05 (gpt)
- **Owner area:** cloud_sync_helper / cloud_backup
- **Where:** cloud_sync_helper:90-106; cloud_backup:1329,1345
- **What:** The defaults are appended unchecked and the candidate is renamed over the live file unconditionally; the allowlist's last line (`- /**`) is what keeps the ROMs out of the saves sync. Fix: check the `cat`, then `grep -qx -- '- /\*\*'` on the candidate before the rename; `cloud_backup` and `cloud_restore` refuse a rules file without the anchored catch-all.
- **Acceptance:** a candidate cut before its last line is not installed and the helper says so; `cloud_backup` with a rules file lacking the catch-all ends `COULDN'T FINISH`; both in the scripts test
## PL-021: Pruning by name order can delete the replaced-saves folder or the archive this run just wrote
- **Severity:** High
- **Category:** Data loss
- **Source Finding:** F-CS-06 (gpt)
- **Owner area:** cloud_backup
- **Where:** cloud_backup:1226-1235, 1433-1434, 1886-1899
- **What:** The replaced-saves root is shared by every device on the cloud and its folders are named by timestamp alone; the prune keeps the lexically greatest, so another device's clock ahead (or this device's corrected backwards) makes this run purge its own folder; the settings retention sorts the same way. Fix: pin this run's folder and archive by name and prune the rest by count.
- **Acceptance:** the scripts test seeds a future-dated sibling folder and asserts the run's own folder survives the prune
## PL-022: A second quirk tree nothing installs contradicts the installed one
- **Severity:** High
- **Category:** Packaging (fork-only)
- **Source Finding:** F-VM-04 (claude)
- **Owner area:** packages/hardware/quirks
- **Where:** packages/hardware/quirks/platforms/GENERIC_X64/ (seven files, `73b20caf86`)
- **What:** The only `quirks` recipe copies from the projects tree; the seven scripts at the top level are dead since June and disagree with the installed `090-ui_service`. Fix: `git rm -r packages/hardware/quirks/platforms/GENERIC_X64`.
- **Acceptance:** the path is gone from `next`; `tools/pkgcheck quirks` PASS; the guest's installed set unchanged
## PL-023: A root shell on ttyS0 on every GENERIC_X64 boot
- **Severity:** High
- **Category:** Security (if published)
- **Source Finding:** F-VM-03 (claude)
- **Owner area:** GENERIC_X64 filesystem overlay
- **Where:** projects/ROCKNIX/devices/GENERIC_X64/filesystem/usr/lib/systemd/system/serial-debug-shell.service
- **What:** Active on guest d through the static `rocknix.target.wants` symlink and `console=ttyS0` on every boot; the QA channel `tools/vm-serial` depends on. Fix: `ConditionVirtualization=vm` on the unit, so the QA path stays and a GENERIC_X64 install on hardware does not carry it; a register row on whether GENERIC_X64 is ever published.
- **Acceptance:** `systemctl show serial-debug-shell.service -p ConditionResult` is `yes` on the guest; the unit file carries the condition; the register row exists
## PL-024: A settings-lock timeout is followed by the read-modify-write anyway
- **Severity:** High
- **Category:** Guards fail closed
- **Source Finding:** F-ES-02 (gpt, 8b)
- **Owner area:** EmulationStation SystemConf
- **Where:** es-core/src/SystemConf.cpp:195-199
- **What:** After five seconds without the lock the interface saves its stale snapshot over whatever the script wrote. Fix: on timeout, re-read the file and apply only this save's dirty keys (`changedConf`), or refuse and log; never the whole snapshot.
- **Acceptance:** a unit test with the lock held by another process: the interface's save keeps a key the other writer changed; `es-syntax-check` PASS
## PL-025: The layout migration moves the old root's backups into Saves
- **Severity:** High
- **Category:** Data layout
- **Source Finding:** F-CS-08 (gpt)
- **Owner area:** cloud_migrate_layout
- **Where:** cloud_migrate_layout:99-116, 256-262
- **What:** The presence test excludes `backup/**` and `Backups/**`; the relocation copies the root unfiltered, so the settings archives land under `/ROCKNIX/Saves/backup/` before the backups' own move. Fix: relocate with the same excludes, and move the backups first.
- **Acceptance:** the scripts test seeds an old root with `saves` and `backup/` and asserts nothing under `Saves/backup/` after `--apply`
## PL-026: The pointers are rewritten only after both moves, and the backups' resume check compares the saves source
- **Severity:** High
- **Category:** Recoverability
- **Source Finding:** F-CS-09 (gpt)
- **Owner area:** cloud_migrate_layout
- **Where:** cloud_migrate_layout:265-273, 306-307
- **What:** A run that moved the saves and died before the pointers leaves `SAVES_REMOTE` at the emptied path, and the next run refuses the new folder as "already exists" because `resumable` is given the saves source for the backups destination too. Fix: write each pointer as its tier lands; pass each tier its own source.
- **Acceptance:** the scripts test kills the migration between the two moves and asserts the second run completes
## PL-027: A listing that fails reads as an empty folder, and the pointers move with nothing copied
- **Severity:** High
- **Category:** Guards fail closed
- **Source Finding:** F-CS-10 (gpt)
- **Owner area:** cloud_migrate_layout
- **Where:** cloud_migrate_layout:48-49, 77-78
- **What:** `[ -n "$(rclone lsf ... 2>/dev/null | head -1)" ]` discards the exit status. Fix: `rclone lsd "$1" >/dev/null || fail` before any presence test; a failed listing aborts the migration.
- **Acceptance:** the scripts test points the migration at a dead endpoint and asserts no pointer changes
## PL-028: A saves phase that moved nothing (rclone 9) hides a failed settings phase
- **Severity:** High
- **Category:** Outcome vocabulary
- **Source Finding:** F-CS-12 (gpt)
- **Owner area:** cloud_backup / cloud_restore
- **Where:** cloud_restore:1859-1860 and the twin in cloud_backup
- **What:** `[ overall -eq 0 ] && overall=SYSTEM_STATUS` skips the settings result when the saves returned 9, and the run says COMPLETED. Fix: `case ${overall} in 0|9) overall=${...SYSTEM_STATUS} ;; esac`.
- **Acceptance:** the scripts test: saves 9 beside a failed settings phase ends `COULDN'T FINISH`; `tools/cloud-round-trip`'s settings phase asserts the outcome
## PL-029: The settings-first restore promises the ticks and restores everything after the restart
- **Severity:** High
- **Category:** Least surprise
- **Source Finding:** F-ES-01 (gpt, 8a)
- **Owner area:** EmulationStation main.cpp / backuptool marker
- **Where:** es-app/src/main.cpp:966-967; GuiMenu.cpp:4663
- **What:** The dialog says ANYTHING ELSE YOU TICKED IS RESTORED AFTER THE RESTART; the continuation runs `cloud_content_restore --all` and `cloud_restore --yes` unconditionally. Fix: the marker `backuptool` writes carries the ticks (tiers, and whether a system selection file exists) and `main` builds the command from them.
- **Acceptance:** on the guest: settings + saves ticked, settings first, restart -- the journal shows no `cloud_content_restore` run; a frame of the done page lists the two tiers
## PL-030: Cloud folder names reach the shell unquoted
- **Severity:** High
- **Category:** Shell injection
- **Source Finding:** F-ES-03 (gpt, 8a)
- **Owner area:** EmulationStation GuiMenu (the system picker)
- **Where:** es-app/src/guis/GuiMenu.cpp:4233-4234; cloud_content_restore `--set-systems`
- **What:** The picked names are joined and passed inside double quotes to a shell; `$(`, backticks and `"` are live. Fix: `cloudShellQuote(picked)` (used three lines away already), and the script refuses a system name outside `[A-Za-z0-9._-]`.
- **Acceptance:** a cloud folder named `a$(touch /tmp/x)b` picked on the guest leaves no `/tmp/x`; the script's refusal is in the scripts test

## Medium Priority
## PL-031: The saved-network join reports success on the wrong interface
- **Severity:** Medium
- **Category:** Correctness
- **Source Finding:** F-WF-01 (gpt)
- **Owner area:** wifictl
- **Where:** wifictl:181-196
- **What:** The join's success test reads the first active connection, not the interface it joined on. Fix: test the named device's state.
- **Acceptance:** the scripts test: a join with another interface up reports the joined one's state
## PL-032: Patch 0017's sharp-size tables never apply on the shipped font, and 0017 carries 0016's line as stale context
- **Severity:** Medium
- **Category:** Correctness
- **Source Finding:** F-RW-01 (claude) + F-RW-01 (gpt)
- **Owner area:** RetroArch patch 0017
- **Where:** the RetroArch widget patches 0016/0017 and `retroarch.cfg` (`video_font_path`)
- **What:** The tables are keyed to a face the shipped configuration does not select, and the patch depends on context 0016 changed. Fix: key the tables on the shipped face (or apply to the resolved face), regenerate the stack.
- **Acceptance:** a `RARCH_LOG` line on the guest names the table applied; `frame-diff` shows the widget text at a sharp size
## PL-033: Printing the QEMU arguments unlinks the socket paths (and, with the disk passed as `--monitor`, the disk)
- **Severity:** Medium
- **Category:** Guards fail closed
- **Source Finding:** F-VM-01 (gpt)
- **Owner area:** tools/generic-x64-vm
- **Where:** tools/generic-x64-vm (`qemu-args`)
- **What:** A read-only verb runs the cleanup of a start. Fix: `qemu-args` touches nothing.
- **Acceptance:** `generic-x64-vm qemu-args` on a running guest's paths leaves them
## PL-034: Automatically chosen RetroArch dimensions become the player's after the first boot
- **Severity:** Medium
- **Category:** Upgrade path
- **Source Finding:** F-VM-03 (gpt)
- **Owner area:** GENERIC_X64 quirks (RetroArch dimensions)
- **Where:** the quirk that writes `video_fullscreen_x/y`
- **What:** The generated values are written into the player's `retroarch.cfg` and never regenerated. Fix: write them to the per-device overlay the launcher reads, not the player's file.
- **Acceptance:** after a resolution change on the guest the values follow; `vm-upgrade-rehearsal` asserts the player's cfg unchanged
## PL-035: An empty custom selection, or a path spelled with `/.`, escapes the policy's exclusions
- **Severity:** Medium
- **Category:** Credentials
- **Source Finding:** F-BR-03 (gpt)
- **Owner area:** backuptool
- **Where:** backuptool (custom location spelling)
- **What:** The exclusions match spellings, not resolved paths. Fix: normalise each location with `readlink -f` before matching, refuse an empty entry.
- **Acceptance:** the scripts test: `/storage/./.config` is excluded like `/storage/.config`
## PL-036: Unchecked collection errors, and whitespace lost in the legacy inspection
- **Severity:** Medium
- **Category:** Correctness
- **Source Finding:** F-BR-06 / F-BR-07 (gpt)
- **Owner area:** backuptool
- **Where:** backuptool (collection; the legacy inspection)
- **What:** A collection error can produce a partial backup marked complete; the legacy inspection splits on whitespace. Fix: check the collector's status; read the listing with `-print0`/`IFS=`.
- **Acceptance:** the scripts test covers a member with a space in the legacy path
## PL-037: Seed pruning leaves an edited file on restore
- **Severity:** Medium
- **Category:** Upgrade path
- **Source Finding:** F-BR-08 (gpt)
- **Owner area:** backuptool
- **Where:** backuptool (seed pruning)
- **What:** A file pruned as identical to its seed at backup time is not restored over a later edit. Fix: record pruned names in the archive and restore them by copying the seed.
- **Acceptance:** the scripts test: an edited `es_settings.cfg` after a backup that pruned it is reset on restore
## PL-038: A custom location outside `/storage` is dropped silently
- **Severity:** Medium
- **Category:** Least surprise
- **Source Finding:** F-BR-09 (gpt)
- **Owner area:** backuptool
- **Where:** backuptool (custom locations)
- **What:** Fix: refuse it with the reason on the console flow.
- **Acceptance:** the scripts test: `/flash/x` in `LOCATIONS` ends with the refusal line
## PL-039: The restore mark's write is unchecked
- **Severity:** Medium
- **Category:** Guards fail closed
- **Source Finding:** F-BR-11 (gpt)
- **Owner area:** backuptool
- **Where:** backuptool (the restore mark)
- **What:** Fix: check the write and say so before the restart.
- **Acceptance:** the scripts test: an unwritable mark path ends the restore before the restart
## PL-040: The redaction misses a value starting with `&` or `;`
- **Severity:** Medium
- **Category:** Credentials
- **Source Finding:** F-PB-01 (gpt)
- **Owner area:** rocknix-evidence (redaction)
- **Where:** projects/ROCKNIX/packages/rocknix/sources/scripts/001-functions:79
- **What:** Fix: widen the unquoted-value class.
- **Acceptance:** the redaction test covers `&y=KEY` at a value's start
## PL-041: Two waiters can remove each other's stale lock, and the PID write's result is ignored
- **Severity:** Medium
- **Category:** Concurrency
- **Source Finding:** F-PB-02 (gpt) + F-ES-06 (gpt, 8b)
- **Owner area:** wait_lock / AtomicFileUtil PidLock
- **Where:** 001-functions `wait_lock`:221; es-core/src/utils/AtomicFileUtil.cpp:161, 213-214
- **What:** Both lock implementations re-read then unlink in two steps. Fix: `O_EXCL` on a rename-in of the PID; the lock carries its PID before it is visible.
- **Acceptance:** `tools/wait-lock-test` and an ES unit test with two contenders on a stale lock
## PL-042: The tmpfiles rules would create regular files at socket paths
- **Severity:** Medium
- **Category:** Correctness (fork-only)
- **Source Finding:** F-PB-06 (gpt)
- **Owner area:** GENERIC_X64 quirks
- **Where:** 098-dbus-fd-improvements
- **What:** Dead with PL-019's removal.
- **Acceptance:** gone with the quirk set
## PL-043: The build `.env` is written at parse time and an old 0644 copy is not tightened
- **Severity:** Medium
- **Category:** Credentials
- **Source Finding:** F-PB-07 (gpt)
- **Owner area:** Makefile / scripts/get_env
- **Where:** Makefile:162
- **What:** Fix: `chmod 0600` before the write, remove on exit.
- **Acceptance:** `stat -c %a .env` during a build reads 600
## PL-044: `rm -rf` unchecked before `cp -rf`
- **Severity:** Medium
- **Category:** Guards fail closed
- **Source Finding:** F-PB-09 (gpt)
- **Owner area:** factoryreset
- **Where:** factoryreset:55-56
- **What:** Fix: check each step and stop.
- **Acceptance:** the scripts test: a failing `rm` does not reach the `cp`
## PL-045: The restore marker is consumed when the snapshot's folder exists unmounted
- **Severity:** Medium
- **Category:** Correctness
- **Source Finding:** F-PB-10 (gpt)
- **Owner area:** chksysconfig
- **Where:** chksysconfig (`finish_restore`)
- **What:** Fix: test the mount, not the directory.
- **Acceptance:** the scripts test: an unmounted folder leaves the marker
## PL-046: A filtered file is counted when the `mv` fails
- **Severity:** Medium
- **Category:** Guards fail closed
- **Source Finding:** F-PB-13 (gpt)
- **Owner area:** rocknix-evidence
- **Where:** rocknix-evidence:112
- **What:** Fix: count on the `mv`'s success.
- **Acceptance:** the evidence test: a failing `mv` is not counted
## PL-047: A failed README probe overwrites the owner's note
- **Severity:** Medium
- **Category:** Guards fail closed
- **Source Finding:** F-RS-02 (gpt)
- **Owner area:** cloud_setup
- **Where:** cloud_setup (`--seed-folders`)
- **What:** Fix: distinguish "absent" from "could not list" before writing.
- **Acceptance:** the scripts test: a listing that fails writes nothing
## PL-048: `self.configured` is set before the remote is created and verified
- **Severity:** Medium
- **Category:** Correctness
- **Source Finding:** F-RS-05 (gpt)
- **Owner area:** cloud_oauth
- **Where:** cloud_oauth (`submit`, `configured`)
- **What:** Fix: set it after `_write_config` returns ok.
- **Acceptance:** a unit test of the session's state transitions
## PL-049: `cancel`'s SIGTERM skips the serve's `finally`, orphaning the window
- **Severity:** Medium
- **Category:** Resource
- **Source Finding:** F-RS-06 (gpt) = F-RS-05 (claude)
- **Owner area:** cloud_oauth
- **Where:** cloud_oauth:570-595, 1847-1853
- **What:** Fix: a SIGTERM handler that raises, so the cleanup runs.
- **Acceptance:** `cloud_oauth cancel` with the page up closes the window (the guest's window log)
## PL-050: An rclone that exits without a token leaves the on-device session `waiting`; a serve whose port is taken dies with a traceback and status `starting`
- **Severity:** Medium
- **Category:** Least surprise
- **Source Finding:** F-RS-07 (gpt) + F-RS-22 (claude)
- **Owner area:** cloud_oauth
- **Where:** cloud_oauth:231-262; the serve's port-taken traceback
- **What:** Fix: after `proc.wait()` with no token, `write_state(status="failed", error=failure_reason())`; catch `EADDRINUSE` and write the same.
- **Acceptance:** a unit test of `_collect` with a process that exits early; the status reads failed
## PL-051: Paths are written into the conf through an unescaped `sed` replacement, and the conf is sourced
- **Severity:** Medium
- **Category:** Shell safety
- **Source Finding:** F-RS-10 (gpt)
- **Owner area:** cloud_setup
- **Where:** cloud_setup (the `sed` that writes the conf)
- **What:** Fix: escape `|`, `&`, `\` in the replacement (or write with `printf` and a quoted value); validate the path's characters.
- **Acceptance:** the scripts test: a path with `&` round-trips
## PL-052: A relative `--retire` argument is unlinked relative to the working directory
- **Severity:** Medium
- **Category:** Correctness
- **Source Finding:** F-CS-04 (gpt)
- **Owner area:** cloud_capture
- **Where:** cloud_capture:411-419, 249-251
- **What:** Fix: `retire_rel` refuses anything not under `${ROOT}/`; the rm runs on `${ROOT}/${rel}`.
- **Acceptance:** the scripts test: a relative argument is refused
## PL-053: The migration purges the source after a point-in-time check
- **Severity:** Medium
- **Category:** Data loss (window)
- **Source Finding:** F-CS-07 (gpt)
- **Owner area:** cloud_migrate_layout
- **Where:** cloud_migrate_layout:99-116
- **What:** Fix: delete the verified files by list, then `rmdirs`.
- **Acceptance:** the scripts test: a file added after the check survives
## PL-054: The send card says NOW ON YOUR ACCOUNT on an empty queue without the flush stamp
- **Severity:** Medium
- **Category:** Outcome vocabulary
- **Source Finding:** F-RA-01 (gpt)
- **Owner area:** ProxyCards
- **Where:** es-app/src/ProxyCards.cpp:97-109
- **What:** Fix: require the stamp for the sentence; `COMPLETED` alone otherwise.
- **Acceptance:** a unit test of the outcome; the VM proof's send card
## PL-055: The offline index's marker is consumed before the listing succeeds
- **Severity:** Medium
- **Category:** Correctness
- **Source Finding:** F-RA-02 (gpt) = F-RA-03 (claude)
- **Owner area:** raofflineproxy-ctl
- **Where:** raofflineproxy-ctl:1584-1586
- **What:** Fix: remove the marker after the listing returns 0.
- **Acceptance:** the scripts test: a listing that fails leaves the marker
## PL-056: Two top-up watchers on one progress file
- **Severity:** Medium
- **Category:** Concurrency
- **Source Finding:** F-RA-03 (gpt)
- **Owner area:** ProxyCards
- **Where:** es-app/src/ProxyCards.cpp:412-418
- **What:** Fix: `if (sTopUpRunning.exchange(true)) return;`.
- **Acceptance:** a unit test; the VM proof shows one top-up card
## PL-057: The bulk summary reads only `patch:` rows and turns unreadable unlocks into none
- **Severity:** Medium
- **Category:** Correctness
- **Source Finding:** F-RA-04 / F-RA-05 (gpt)
- **Owner area:** raofflineproxy-ctl
- **Where:** raofflineproxy-ctl:593, 612-618
- **What:** Fix: enumerate `achievementsets:` rows too; report a damaged row as unknown.
- **Acceptance:** the scripts test seeds an achievementsets-only game and a bad unlock row
## PL-058: The refresh helper reports success over a failed drop
- **Severity:** Medium
- **Category:** Outcome vocabulary
- **Source Finding:** F-RA-06 (gpt)
- **Owner area:** raofflineproxy-refresh
- **Where:** raofflineproxy-refresh:73-85, 201, 224
- **What:** Fix: count the failure.
- **Acceptance:** the helper's test: a failing drop is in `M failed`
## PL-059: The scan cap has no cursor past files that cannot be cached, and truncation is not on the page
- **Severity:** Medium
- **Category:** Correctness
- **Source Finding:** F-RA-07 (gpt)
- **Owner area:** raofflineproxy-ctl
- **Where:** raofflineproxy-ctl:1144-1149, 1426-1428
- **What:** Fix: a cursor kept between runs; `note TRUNCATED` to the page.
- **Acceptance:** the scripts test with 5,001 uncacheable files reaches the 5,001st on the second run; the page's frame reads the note
## PL-060: Image-pass failures are dropped and a scan with nothing new never repairs them
- **Severity:** Medium
- **Category:** Outcome vocabulary
- **Source Finding:** F-RA-08 (gpt)
- **Owner area:** raofflineproxy-ctl
- **Where:** raofflineproxy-ctl (`run_image_pass` callers, :1438-1444)
- **What:** Fix: carry the pass's result into the stamp; run it on the nothing-new path.
- **Acceptance:** the scripts test: a failing image pass ends the scan `COULDN'T FINISH`
## PL-061: The exit capture is not among the launch guards
- **Severity:** Medium
- **Category:** Concurrency
- **Source Finding:** F-ES-04 (gpt, 8a)
- **Owner area:** EmulationStation FileData
- **Where:** es-app/src/FileData.cpp:725-760, 1075-1111
- **What:** Fix: the capture joins the `stillRunning` list.
- **Acceptance:** a relaunch inside the capture's run waits (the journal's order on the guest)
## PL-062: The hub's gated rows keep offering setup after setup completes
- **Severity:** Medium
- **Category:** Correctness
- **Source Finding:** F-ES-02 (gpt, 8a)
- **Owner area:** EmulationStation GuiMenu
- **Where:** es-app/src/guis/GuiMenu.cpp:4010, 6463, 7303
- **What:** Fix: FINISH reopens the hub, or the gated callback re-checks at the press.
- **Acceptance:** a walk: setup from a gated row, FINISH, the row runs
## PL-063: Every writer shares `path.tmp` under `O_TRUNC`
- **Severity:** Medium
- **Category:** Concurrency
- **Source Finding:** F-ES-01 (gpt, 8b)
- **Owner area:** EmulationStation AtomicFileUtil
- **Where:** es-core/src/utils/AtomicFileUtil.cpp:41, 65
- **What:** Fix: a per-call unique name (`mkstemp` in the same directory).
- **Acceptance:** a unit test with two concurrent writers leaves a whole file
## PL-064: Startup deletes a temporary the previous writer may have needed, and usable means one assignment
- **Severity:** Medium
- **Category:** Upgrade path
- **Source Finding:** F-ES-03 (gpt, 8b)
- **Owner area:** EmulationStation SystemConf
- **Where:** es-core/src/SystemConf.cpp:138-153
- **What:** Fix: when the live file fails and no `.backup` exists, read `.tmp` before deleting it; usable means complete.
- **Acceptance:** a unit test with a cut live file, a whole `.tmp` and no backup loads the `.tmp`
## PL-065: `readText` reports success after `open`, not after the read
- **Severity:** Medium
- **Category:** Guards fail closed
- **Source Finding:** F-ES-04 (gpt, 8b)
- **Owner area:** EmulationStation AtomicFileUtil
- **Where:** es-core/src/utils/AtomicFileUtil.cpp:117-119
- **What:** Fix: fail `ok` on `in.bad()` and on a size short of `stat`.
- **Acceptance:** a unit test with a read that fails part-way returns ok=false
## PL-066: The game-list pass's failure is dropped
- **Severity:** Medium
- **Category:** Outcome vocabulary
- **Source Finding:** F-CS-11 (gpt)
- **Owner area:** cloud_content_backup / cloud_content_restore
- **Where:** cloud_content_backup:570-578; cloud_content_restore:1103-1105
- **What:** Fix: fold its status into `RC` under the same `0|9` rule.
- **Acceptance:** the scripts test: a failing game-list copy ends `COULDN'T FINISH`
## PL-067: The capture's final check and rename are not one step
- **Severity:** Medium
- **Category:** Concurrency
- **Source Finding:** F-CS-14 (gpt)
- **Owner area:** cloud_capture
- **Where:** cloud_capture (`finish`)
- **What:** Fix: a lock file around `finish`.
- **Acceptance:** the scripts test: two captures serialise
## PL-068: Save-state DELETE and COPY check the interface's own sync, not the transfer lock
- **Severity:** Medium
- **Category:** Concurrency
- **Source Finding:** F-CS-15 (gpt)
- **Owner area:** EmulationStation GuiSaveState
- **Where:** es-app/src/guis/GuiSaveState.cpp:412-418, 450, 469
- **What:** Fix: test the lock (`flock -n /var/run/cloud_sync.lock true`).
- **Acceptance:** a walk with `cloud_backup` running from the shell: DELETE is refused with the reason
## PL-069: Every sync leaks a joinable thread
- **Severity:** Medium
- **Category:** Resource
- **Source Finding:** F-CS-16 (gpt)
- **Owner area:** EmulationStation ThreadedCloudSync
- **Where:** es-app/src/ThreadedCloudSync.cpp:46, 49, 690
- **What:** Fix: `mHandle->detach()` after construction; delete the handle in the destructor.
- **Acceptance:** `ls /proc/<es>/task | wc -l` on the guest is flat across 50 exit syncs
## PL-070: `unzip -t || unzip -l` makes a listing pass for an integrity test
- **Severity:** Medium
- **Category:** Guards fail closed
- **Source Finding:** F-CS-17 (gpt)
- **Owner area:** cloud_backup
- **Where:** cloud_backup:654
- **What:** Fix: probe `unzip -t` once; where supported, let its failure stand.
- **Acceptance:** the scripts test: a damaged archive under busybox fails the check
## PL-071: `migrate_content`'s failure is dropped
- **Severity:** Medium
- **Category:** Outcome vocabulary
- **Source Finding:** F-CS-18 (gpt)
- **Owner area:** cloud_migrate_layout
- **Where:** cloud_migrate_layout:311-320
- **What:** Fix: propagate it.
- **Acceptance:** the scripts test: a failing content move ends non-zero
## PL-072: A sync that moved files and then lost the link says SKIPPED with no in-place clause
- **Severity:** Medium
- **Category:** Outcome vocabulary
- **Source Finding:** F-CS-19 (gpt)
- **Owner area:** EmulationStation ThreadedCloudSync
- **Where:** es-app/src/ThreadedCloudSync.cpp:364-365 (the 69 branch)
- **What:** Fix: keep the in-place clause on the 69 branch when `mMoved`.
- **Acceptance:** a unit test of the outcome lines; a guest run with the link cut mid-transfer

## Low Priority
## PL-073: The in-place bootloader updater copies nothing and still writes the UPDATE hint
- **Severity:** Low
- **Category:** Dead code
- **Source Finding:** F-VM-01 / F-VM-02 (claude) + F-VM-02 (gpt)
- **Owner area:** GENERIC_X64 bootloader
- **Where:** projects/ROCKNIX/devices/GENERIC_X64/bootloader/update.sh
- **What:** Fix: ship the files it expects and install syslinux properly, or delete the script and the hint.
- **Acceptance:** either the guest's `/flash` changes on an update, or the script is gone
## PL-074: rclone's stderr excerpt is logged verbatim on a failed remote creation
- **Severity:** Low
- **Category:** Credentials
- **Source Finding:** F-RS-04 (gpt)
- **Owner area:** cloud_oauth
- **Where:** cloud_oauth:260, 338
- **What:** Fix: log a fixed sentence and keep rclone's text out of `cloud_sync.log`.
- **Acceptance:** the log line after a failed create carries no rclone text
## PL-075: The `_WIN32` branch deletes before it renames
- **Severity:** Low
- **Category:** Portability
- **Source Finding:** F-ES-05 (gpt, 8b)
- **Owner area:** EmulationStation AtomicFileUtil
- **Where:** es-core/src/utils/AtomicFileUtil.cpp:42-64
- **What:** Fix: `MoveFileEx` with replace, or the header says Linux.
- **Acceptance:** the header's contract matches the branch
## PL-076: The x64 RetroArch profile names an armhf core-updater endpoint
- **Severity:** Low
- **Category:** Correctness
- **Source Finding:** F-RW-02 (gpt)
- **Owner area:** RetroArch GENERIC_X64 profile
- **Where:** projects/ROCKNIX/packages/emulators/.../sources/GENERIC_X64/retroarch.cfg
- **What:** Fix: the x86_64 endpoint, or none.
- **Acceptance:** the cfg line
## PL-077: Same-second concurrent runs share names
- **Severity:** Low
- **Category:** Concurrency
- **Source Finding:** F-BR-10 (gpt) + F-PB-03 (gpt)
- **Owner area:** backuptool / rocknix-evidence
- **Where:** the same-second names
- **What:** Fix: `mktemp`-style staging.
- **Acceptance:** two runs in one second leave two archives
## PL-078: The fork-only guard's history range and rename cases
- **Severity:** Low
- **Category:** Fork-only
- **Source Finding:** F-PB-11 / F-PB-12 (gpt)
- **Owner area:** EmulationStation fork's pre-push
- **Where:** the ES fork's `.githooks/pre-push`
- **What:** Fix in the fork's hook; never ships.
- **Acceptance:** the hook's own test

## PL-079: A content match could delete N64 `.fla` saves
- **Severity:** High
- **Category:** Data loss
- **Source Finding:** gpt F-CS-02 (Critical as filed; missed by the verification pass -- its number is shared with the Claude seat's F-CS-02)
- **Owner area:** cloud_content_backup / cloud_content_restore
- **Where:** projects/ROCKNIX/packages/network/rclone/sources/cloud_sync-rules.txt:27; cloud_content_backup (the content excludes); cloud_content_restore (`--match`)
- **What:** The saves allowlist adds `.fla`, but the content tier's exclusions did not, so a `.fla` game save under a system folder counted as content to upload, overwrite or delete on a match. Fixed by stream A (`ff2bdc65a6`): `.fla` is the saves tier's in both content scripts.
- **Acceptance:** the scripts test's case A25: a match over a system holding `Game.fla` plans no removal of it (FAIL on the old tree: `plan 'n64|remove|2|15'; Game.fla DELETED`)

## PL-080: A long cloud listing was read as a stall and ended the automatic run
- **Severity:** Medium
- **Category:** Correctness
- **Source Finding:** claude F-CS-13 (fell through both lists)
- **Owner area:** cloud_backup
- **Where:** cloud_backup (the automatic run's stall ceiling)
- **What:** The stall bound saw no bytes moving during a large listing and ended the run at the ceiling. Fixed by stream A (`fd6878278a`): a growing listing is progress towards the ceiling.
- **Acceptance:** the scripts test's case A30: a listing that grows for longer than the stall bound completes (FAIL on the old tree: `rc 124 after 4s`)

---

## Phase 7 resolution gate

Recorded per item as it is resolved: the outcome (resolved / deferred / rejected), the commit or issue, the evidence. Open until then.

| Item | Severity | Outcome | Evidence |
| --- | --- | --- | --- |
| PL-001 | Critical | | |
| PL-002 | High | | |
| PL-003 | High | | |
| PL-004 | High | | |
| PL-005 | High | | |
| PL-006 | High | | |
| PL-007 | High | | |
| PL-008 | High | | |
| PL-009 | High | | |
| PL-010 | High | | |
| PL-011 | High | | |
| PL-012 | High | | |
| PL-013 | High | | |
| PL-014 | High | | |
| PL-015 | High | | |
| PL-016 | High | | |
| PL-017 | High | | |
| PL-018 | High | | |
| PL-019 | High | | |
| PL-020 | High | | |
| PL-021 | High | | |
| PL-022 | High | | |
| PL-023 | High | | |
| PL-024 | High | | |
| PL-025 | High | | |
| PL-026 | High | | |
| PL-027 | High | | |
| PL-028 | High | | |
| PL-029 | High | | |
| PL-030 | High | | |
| PL-031 | Medium | | |
| PL-032 | Medium | | |
| PL-033 | Medium | | |
| PL-034 | Medium | | |
| PL-035 | Medium | | |
| PL-036 | Medium | | |
| PL-037 | Medium | | |
| PL-038 | Medium | | |
| PL-039 | Medium | | |
| PL-040 | Medium | | |
| PL-041 | Medium | | |
| PL-042 | Medium | | |
| PL-043 | Medium | | |
| PL-044 | Medium | | |
| PL-045 | Medium | | |
| PL-046 | Medium | | |
| PL-047 | Medium | | |
| PL-048 | Medium | | |
| PL-049 | Medium | | |
| PL-050 | Medium | | |
| PL-051 | Medium | | |
| PL-052 | Medium | | |
| PL-053 | Medium | | |
| PL-054 | Medium | | |
| PL-055 | Medium | | |
| PL-056 | Medium | | |
| PL-057 | Medium | | |
| PL-058 | Medium | | |
| PL-059 | Medium | | |
| PL-060 | Medium | | |
| PL-061 | Medium | | |
| PL-062 | Medium | | |
| PL-063 | Medium | | |
| PL-064 | Medium | | |
| PL-065 | Medium | | |
| PL-066 | Medium | | |
| PL-067 | Medium | | |
| PL-068 | Medium | | |
| PL-069 | Medium | | |
| PL-070 | Medium | | |
| PL-071 | Medium | | |
| PL-072 | Medium | | |
| PL-073 | Low | | |
| PL-074 | Low | | |
| PL-075 | Low | | |
| PL-076 | Low | | |
| PL-077 | Low | | |
| PL-078 | Low | | |
| PL-079 | High | | |
| PL-080 | Medium | | |

## Punch index

```yaml
punch_index:
- id: PL-001
  severity: Critical
  category: "Data loss (guards fail closed)"
  source_finding: "F-CS-01 (both seats) + F-CS-03 (gpt)"
  owner_area: "cloud_content_restore"
  where: "projects/ROCKNIX/packages/network/rclone/sources/cloud_content_restore:565-596, 661-708"
  acceptance: "`tools/last-good-scripts-test` case: a system whose listing returns 5 is neither planned nor removed; a system planned `remove` in the preview and `sync` at apply is refused; the `--max-delete` count on apply equals the preview's"
  outcome: open
- id: PL-002
  severity: High
  category: "Correctness"
  source_finding: "F-EM-01 (gpt)"
  owner_area: "packages emulators (rotation tables)"
  where: "the rotation generators and the `-lr` recipes that consume them (bucket 9)"
  acceptance: "editing a generator and running `./scripts/build <core>` rebuilds the core (the `build_target` stamp moves)"
  outcome: open
- id: PL-003
  severity: High
  category: "Correctness (target tool)"
  source_finding: "F-WF-02 (gpt)"
  owner_area: "wifictl"
  where: "projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:261-263"
  acceptance: "`tools/last-good-scripts-test` case: a PSK with `:` and `\` round-trips through join and read back byte for byte; on the guest, `get_setting wifi.key` after a join equals the value typed"
  outcome: open
- id: PL-004
  severity: High
  category: "Guards fail closed (data loss)"
  source_finding: "F-BR-01 (claude)"
  owner_area: "backuptool"
  where: "projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool (the location arrays)"
  acceptance: "a location named `my games/` is in the archive; the scripts test constructs it and fails the unfixed script"
  outcome: open
- id: PL-005
  severity: High
  category: "Credentials"
  source_finding: "F-BR-02 (claude) + F-BR-04 (gpt)"
  owner_area: "backuptool"
  where: "backuptool (the credential scan and the publish step)"
  acceptance: "a settings tree seeded with a `pass =` line produces no archive and the outcome line; `tools/last-good-scripts-test` case"
  outcome: open
- id: PL-006
  severity: High
  category: "Credentials"
  source_finding: "F-BR-03 (claude)"
  owner_area: "backuptool"
  where: "backuptool (the scan's prefix class)"
  acceptance: "`Password=<long literal>` in a custom location is caught; the scripts test covers it"
  outcome: open
- id: PL-007
  severity: High
  category: "Correctness"
  source_finding: "F-BR-01 (gpt)"
  owner_area: "backuptool"
  where: "backuptool (the pre-restore snapshot)"
  acceptance: "restoring an archive with a member outside `LOCATIONS` and rolling back restores the original file"
  outcome: open
- id: PL-008
  severity: High
  category: "Credentials"
  source_finding: "F-BR-02 (gpt)"
  owner_area: "backuptool"
  where: "backuptool (custom `LOCATIONS` and the backup directory)"
  acceptance: "an archive made with `LOCATIONS=/storage/.config` holds no member under the backup directory"
  outcome: open
- id: PL-009
  severity: High
  category: "Guards fail closed"
  source_finding: "F-BR-05 (gpt)"
  owner_area: "backuptool"
  where: "backuptool (the snapshot collector)"
  acceptance: "a collector made to fail (an unreadable location) aborts the restore with the outcome line; the scripts test covers it"
  outcome: open
- id: PL-010
  severity: High
  category: "Upgrade path"
  source_finding: "F-BR-12 (gpt)"
  owner_area: "backuptool"
  where: "backuptool (the legacy restore's exclusions)"
  acceptance: "a legacy archive carrying an `rclone.conf` leaves the device's untouched; the scripts test covers it"
  outcome: open
- id: PL-011
  severity: High
  category: "Guards fail closed"
  source_finding: "F-PB-08 (gpt)"
  owner_area: "rocknix scripts (settings)"
  where: "projects/ROCKNIX/packages/rocknix/sources/scripts (`write_setting_line`)"
  acceptance: "`set_setting` on a read-only file exits non-zero; the scripts test covers it"
  outcome: open
- id: PL-012
  severity: High
  category: "Correctness"
  source_finding: "F-CS-02 (claude) = F-CS-13 (gpt)"
  owner_area: "cloud_content_restore"
  where: "cloud_content_restore (`--all`, `remote_for`)"
  acceptance: "a journey restore with `--all` brings `BIOS/` down; `tools/cloud-round-trip` asserts a BIOS file's presence after `--all`"
  outcome: open
- id: PL-013
  severity: High
  category: "Concurrency"
  source_finding: "F-RA-01 (claude)"
  owner_area: "raofflineproxy-ctl"
  where: "raofflineproxy-ctl (`run_image_pass`, the scan's cancel)"
  acceptance: "CANCEL during the image pass ends the run inside two seconds on the guest (a frame series shows the page close)"
  outcome: open
- id: PL-014
  severity: High
  category: "Use after free"
  source_finding: "F-ES-01 (claude, bucket 8)"
  owner_area: "EmulationStation SystemData / collections"
  where: "es-app/src/SystemData.cpp (`rescanIfFolderChanged`), the collections' file pointers"
  acceptance: "the rescan soak on the VM (a folder changed under a game list with a collection open, 200 iterations) runs with no crash; `es-syntax-check` PASS"
  outcome: open
- id: PL-015
  severity: High
  category: "Data layout"
  source_finding: "F-RS-03 (gpt) = F-RS-01 (claude)"
  owner_area: "cloud_setup"
  where: "cloud_setup:385-390 (`--set-saves-remote`)"
  acceptance: "`cloud_setup --set-saves-remote /` is refused with the reason, or the derived paths are `/ROCKNIX/Settings` beside `/ROCKNIX/Saves`; the scripts test covers both"
  outcome: open
- id: PL-016
  severity: High
  category: "Least surprise"
  source_finding: "F-RS-08 (gpt) = F-RS-02 (claude)"
  owner_area: "cloud_oauth (the phone page)"
  where: "cloud_oauth:910 (`poll()`)"
  acceptance: "typing on the phone page before the window opens reaches the field after it opens (a guest run with the page driven by curl and the window's log)"
  outcome: open
- id: PL-017
  severity: High
  category: "Least surprise"
  source_finding: "F-RS-09 (gpt)"
  owner_area: "cloud_oauth (the phone page)"
  where: "cloud_oauth:815"
  acceptance: "typing `abc`, Back, `d` on the phone page leaves `abd` in the field on guest d (the sign-in window's log); a doctest of the page's script if it is testable, else the guest run"
  outcome: open
- id: PL-018
  severity: High
  category: "Input handling (pending a fact)"
  source_finding: "F-RS-11 (gpt)"
  owner_area: "cloud_oauth (`wait`, `GamepadBridge`)"
  where: "cloud_oauth:1925-1943, 1385-1400, 1492-1507; ApiSystem.cpp:573-582"
  acceptance: "on the guest with a uinput gamepad, or on the RG35XX SP on its own yes: after an on-device sign-in the pad moves the menu without a restart -- the fact goes in `docs/releases/device-facts.md`"
  outcome: open
- id: PL-019
  severity: High
  category: "Packaging (fork-only)"
  source_finding: "F-PB-02 / F-PB-03 (claude) + F-VM-04/05, F-PB-04/05/06 (gpt)"
  owner_area: "GENERIC_X64 quirks"
  where: "projects/ROCKNIX/packages/hardware/quirks/devices/QEMU Standard PC (Q35 + ICH9, 2009)/091-101"
  acceptance: "`journalctl -b | grep -c 'Read-only file system'` on a guest reads 0; vm-qa all suites PASS on the image without the scripts"
  outcome: open
- id: PL-020
  severity: High
  category: "Data loss"
  source_finding: "F-CS-05 (gpt)"
  owner_area: "cloud_sync_helper / cloud_backup"
  where: "cloud_sync_helper:90-106; cloud_backup:1329,1345"
  acceptance: "a candidate cut before its last line is not installed and the helper says so; `cloud_backup` with a rules file lacking the catch-all ends `COULDN'T FINISH`; both in the scripts test"
  outcome: open
- id: PL-021
  severity: High
  category: "Data loss"
  source_finding: "F-CS-06 (gpt)"
  owner_area: "cloud_backup"
  where: "cloud_backup:1226-1235, 1433-1434, 1886-1899"
  acceptance: "the scripts test seeds a future-dated sibling folder and asserts the run's own folder survives the prune"
  outcome: open
- id: PL-022
  severity: High
  category: "Packaging (fork-only)"
  source_finding: "F-VM-04 (claude)"
  owner_area: "packages/hardware/quirks"
  where: "packages/hardware/quirks/platforms/GENERIC_X64/ (seven files, `73b20caf86`)"
  acceptance: "the path is gone from `next`; `tools/pkgcheck quirks` PASS; the guest's installed set unchanged"
  outcome: open
- id: PL-023
  severity: High
  category: "Security (if published)"
  source_finding: "F-VM-03 (claude)"
  owner_area: "GENERIC_X64 filesystem overlay"
  where: "projects/ROCKNIX/devices/GENERIC_X64/filesystem/usr/lib/systemd/system/serial-debug-shell.service"
  acceptance: "`systemctl show serial-debug-shell.service -p ConditionResult` is `yes` on the guest; the unit file carries the condition; the register row exists"
  outcome: open
- id: PL-024
  severity: High
  category: "Guards fail closed"
  source_finding: "F-ES-02 (gpt, 8b)"
  owner_area: "EmulationStation SystemConf"
  where: "es-core/src/SystemConf.cpp:195-199"
  acceptance: "a unit test with the lock held by another process: the interface's save keeps a key the other writer changed; `es-syntax-check` PASS"
  outcome: open
- id: PL-025
  severity: High
  category: "Data layout"
  source_finding: "F-CS-08 (gpt)"
  owner_area: "cloud_migrate_layout"
  where: "cloud_migrate_layout:99-116, 256-262"
  acceptance: "the scripts test seeds an old root with `saves` and `backup/` and asserts nothing under `Saves/backup/` after `--apply`"
  outcome: open
- id: PL-026
  severity: High
  category: "Recoverability"
  source_finding: "F-CS-09 (gpt)"
  owner_area: "cloud_migrate_layout"
  where: "cloud_migrate_layout:265-273, 306-307"
  acceptance: "the scripts test kills the migration between the two moves and asserts the second run completes"
  outcome: open
- id: PL-027
  severity: High
  category: "Guards fail closed"
  source_finding: "F-CS-10 (gpt)"
  owner_area: "cloud_migrate_layout"
  where: "cloud_migrate_layout:48-49, 77-78"
  acceptance: "the scripts test points the migration at a dead endpoint and asserts no pointer changes"
  outcome: open
- id: PL-028
  severity: High
  category: "Outcome vocabulary"
  source_finding: "F-CS-12 (gpt)"
  owner_area: "cloud_backup / cloud_restore"
  where: "cloud_restore:1859-1860 and the twin in cloud_backup"
  acceptance: "the scripts test: saves 9 beside a failed settings phase ends `COULDN'T FINISH`; `tools/cloud-round-trip`'s settings phase asserts the outcome"
  outcome: open
- id: PL-029
  severity: High
  category: "Least surprise"
  source_finding: "F-ES-01 (gpt, 8a)"
  owner_area: "EmulationStation main.cpp / backuptool marker"
  where: "es-app/src/main.cpp:966-967; GuiMenu.cpp:4663"
  acceptance: "on the guest: settings + saves ticked, settings first, restart -- the journal shows no `cloud_content_restore` run; a frame of the done page lists the two tiers"
  outcome: open
- id: PL-030
  severity: High
  category: "Shell injection"
  source_finding: "F-ES-03 (gpt, 8a)"
  owner_area: "EmulationStation GuiMenu (the system picker)"
  where: "es-app/src/guis/GuiMenu.cpp:4233-4234; cloud_content_restore `--set-systems`"
  acceptance: "a cloud folder named `a$(touch /tmp/x)b` picked on the guest leaves no `/tmp/x`; the script's refusal is in the scripts test"
  outcome: open
- id: PL-031
  severity: Medium
  category: "Correctness"
  source_finding: "F-WF-01 (gpt)"
  owner_area: "wifictl"
  where: "wifictl:181-196"
  acceptance: "the scripts test: a join with another interface up reports the joined one's state"
  outcome: open
- id: PL-032
  severity: Medium
  category: "Correctness"
  source_finding: "F-RW-01 (claude) + F-RW-01 (gpt)"
  owner_area: "RetroArch patch 0017"
  where: "the RetroArch widget patches 0016/0017 and `retroarch.cfg` (`video_font_path`)"
  acceptance: "a `RARCH_LOG` line on the guest names the table applied; `frame-diff` shows the widget text at a sharp size"
  outcome: open
- id: PL-033
  severity: Medium
  category: "Guards fail closed"
  source_finding: "F-VM-01 (gpt)"
  owner_area: "tools/generic-x64-vm"
  where: "tools/generic-x64-vm (`qemu-args`)"
  acceptance: "`generic-x64-vm qemu-args` on a running guest's paths leaves them"
  outcome: open
- id: PL-034
  severity: Medium
  category: "Upgrade path"
  source_finding: "F-VM-03 (gpt)"
  owner_area: "GENERIC_X64 quirks (RetroArch dimensions)"
  where: "the quirk that writes `video_fullscreen_x/y`"
  acceptance: "after a resolution change on the guest the values follow; `vm-upgrade-rehearsal` asserts the player's cfg unchanged"
  outcome: open
- id: PL-035
  severity: Medium
  category: "Credentials"
  source_finding: "F-BR-03 (gpt)"
  owner_area: "backuptool"
  where: "backuptool (custom location spelling)"
  acceptance: "the scripts test: `/storage/./.config` is excluded like `/storage/.config`"
  outcome: open
- id: PL-036
  severity: Medium
  category: "Correctness"
  source_finding: "F-BR-06 / F-BR-07 (gpt)"
  owner_area: "backuptool"
  where: "backuptool (collection; the legacy inspection)"
  acceptance: "the scripts test covers a member with a space in the legacy path"
  outcome: open
- id: PL-037
  severity: Medium
  category: "Upgrade path"
  source_finding: "F-BR-08 (gpt)"
  owner_area: "backuptool"
  where: "backuptool (seed pruning)"
  acceptance: "the scripts test: an edited `es_settings.cfg` after a backup that pruned it is reset on restore"
  outcome: open
- id: PL-038
  severity: Medium
  category: "Least surprise"
  source_finding: "F-BR-09 (gpt)"
  owner_area: "backuptool"
  where: "backuptool (custom locations)"
  acceptance: "the scripts test: `/flash/x` in `LOCATIONS` ends with the refusal line"
  outcome: open
- id: PL-039
  severity: Medium
  category: "Guards fail closed"
  source_finding: "F-BR-11 (gpt)"
  owner_area: "backuptool"
  where: "backuptool (the restore mark)"
  acceptance: "the scripts test: an unwritable mark path ends the restore before the restart"
  outcome: open
- id: PL-040
  severity: Medium
  category: "Credentials"
  source_finding: "F-PB-01 (gpt)"
  owner_area: "rocknix-evidence (redaction)"
  where: "projects/ROCKNIX/packages/rocknix/sources/scripts/001-functions:79"
  acceptance: "the redaction test covers `&y=KEY` at a value's start"
  outcome: open
- id: PL-041
  severity: Medium
  category: "Concurrency"
  source_finding: "F-PB-02 (gpt) + F-ES-06 (gpt, 8b)"
  owner_area: "wait_lock / AtomicFileUtil PidLock"
  where: "001-functions `wait_lock`:221; es-core/src/utils/AtomicFileUtil.cpp:161, 213-214"
  acceptance: "`tools/wait-lock-test` and an ES unit test with two contenders on a stale lock"
  outcome: open
- id: PL-042
  severity: Medium
  category: "Correctness (fork-only)"
  source_finding: "F-PB-06 (gpt)"
  owner_area: "GENERIC_X64 quirks"
  where: "098-dbus-fd-improvements"
  acceptance: "gone with the quirk set"
  outcome: open
- id: PL-043
  severity: Medium
  category: "Credentials"
  source_finding: "F-PB-07 (gpt)"
  owner_area: "Makefile / scripts/get_env"
  where: "Makefile:162"
  acceptance: "`stat -c %a .env` during a build reads 600"
  outcome: open
- id: PL-044
  severity: Medium
  category: "Guards fail closed"
  source_finding: "F-PB-09 (gpt)"
  owner_area: "factoryreset"
  where: "factoryreset:55-56"
  acceptance: "the scripts test: a failing `rm` does not reach the `cp`"
  outcome: open
- id: PL-045
  severity: Medium
  category: "Correctness"
  source_finding: "F-PB-10 (gpt)"
  owner_area: "chksysconfig"
  where: "chksysconfig (`finish_restore`)"
  acceptance: "the scripts test: an unmounted folder leaves the marker"
  outcome: open
- id: PL-046
  severity: Medium
  category: "Guards fail closed"
  source_finding: "F-PB-13 (gpt)"
  owner_area: "rocknix-evidence"
  where: "rocknix-evidence:112"
  acceptance: "the evidence test: a failing `mv` is not counted"
  outcome: open
- id: PL-047
  severity: Medium
  category: "Guards fail closed"
  source_finding: "F-RS-02 (gpt)"
  owner_area: "cloud_setup"
  where: "cloud_setup (`--seed-folders`)"
  acceptance: "the scripts test: a listing that fails writes nothing"
  outcome: open
- id: PL-048
  severity: Medium
  category: "Correctness"
  source_finding: "F-RS-05 (gpt)"
  owner_area: "cloud_oauth"
  where: "cloud_oauth (`submit`, `configured`)"
  acceptance: "a unit test of the session's state transitions"
  outcome: open
- id: PL-049
  severity: Medium
  category: "Resource"
  source_finding: "F-RS-06 (gpt) = F-RS-05 (claude)"
  owner_area: "cloud_oauth"
  where: "cloud_oauth:570-595, 1847-1853"
  acceptance: "`cloud_oauth cancel` with the page up closes the window (the guest's window log)"
  outcome: open
- id: PL-050
  severity: Medium
  category: "Least surprise"
  source_finding: "F-RS-07 (gpt) + F-RS-22 (claude)"
  owner_area: "cloud_oauth"
  where: "cloud_oauth:231-262; the serve's port-taken traceback"
  acceptance: "a unit test of `_collect` with a process that exits early; the status reads failed"
  outcome: open
- id: PL-051
  severity: Medium
  category: "Shell safety"
  source_finding: "F-RS-10 (gpt)"
  owner_area: "cloud_setup"
  where: "cloud_setup (the `sed` that writes the conf)"
  acceptance: "the scripts test: a path with `&` round-trips"
  outcome: open
- id: PL-052
  severity: Medium
  category: "Correctness"
  source_finding: "F-CS-04 (gpt)"
  owner_area: "cloud_capture"
  where: "cloud_capture:411-419, 249-251"
  acceptance: "the scripts test: a relative argument is refused"
  outcome: open
- id: PL-053
  severity: Medium
  category: "Data loss (window)"
  source_finding: "F-CS-07 (gpt)"
  owner_area: "cloud_migrate_layout"
  where: "cloud_migrate_layout:99-116"
  acceptance: "the scripts test: a file added after the check survives"
  outcome: open
- id: PL-054
  severity: Medium
  category: "Outcome vocabulary"
  source_finding: "F-RA-01 (gpt)"
  owner_area: "ProxyCards"
  where: "es-app/src/ProxyCards.cpp:97-109"
  acceptance: "a unit test of the outcome; the VM proof's send card"
  outcome: open
- id: PL-055
  severity: Medium
  category: "Correctness"
  source_finding: "F-RA-02 (gpt) = F-RA-03 (claude)"
  owner_area: "raofflineproxy-ctl"
  where: "raofflineproxy-ctl:1584-1586"
  acceptance: "the scripts test: a listing that fails leaves the marker"
  outcome: open
- id: PL-056
  severity: Medium
  category: "Concurrency"
  source_finding: "F-RA-03 (gpt)"
  owner_area: "ProxyCards"
  where: "es-app/src/ProxyCards.cpp:412-418"
  acceptance: "a unit test; the VM proof shows one top-up card"
  outcome: open
- id: PL-057
  severity: Medium
  category: "Correctness"
  source_finding: "F-RA-04 / F-RA-05 (gpt)"
  owner_area: "raofflineproxy-ctl"
  where: "raofflineproxy-ctl:593, 612-618"
  acceptance: "the scripts test seeds an achievementsets-only game and a bad unlock row"
  outcome: open
- id: PL-058
  severity: Medium
  category: "Outcome vocabulary"
  source_finding: "F-RA-06 (gpt)"
  owner_area: "raofflineproxy-refresh"
  where: "raofflineproxy-refresh:73-85, 201, 224"
  acceptance: "the helper's test: a failing drop is in `M failed`"
  outcome: open
- id: PL-059
  severity: Medium
  category: "Correctness"
  source_finding: "F-RA-07 (gpt)"
  owner_area: "raofflineproxy-ctl"
  where: "raofflineproxy-ctl:1144-1149, 1426-1428"
  acceptance: "the scripts test with 5,001 uncacheable files reaches the 5,001st on the second run; the page's frame reads the note"
  outcome: open
- id: PL-060
  severity: Medium
  category: "Outcome vocabulary"
  source_finding: "F-RA-08 (gpt)"
  owner_area: "raofflineproxy-ctl"
  where: "raofflineproxy-ctl (`run_image_pass` callers, :1438-1444)"
  acceptance: "the scripts test: a failing image pass ends the scan `COULDN'T FINISH`"
  outcome: open
- id: PL-061
  severity: Medium
  category: "Concurrency"
  source_finding: "F-ES-04 (gpt, 8a)"
  owner_area: "EmulationStation FileData"
  where: "es-app/src/FileData.cpp:725-760, 1075-1111"
  acceptance: "a relaunch inside the capture's run waits (the journal's order on the guest)"
  outcome: open
- id: PL-062
  severity: Medium
  category: "Correctness"
  source_finding: "F-ES-02 (gpt, 8a)"
  owner_area: "EmulationStation GuiMenu"
  where: "es-app/src/guis/GuiMenu.cpp:4010, 6463, 7303"
  acceptance: "a walk: setup from a gated row, FINISH, the row runs"
  outcome: open
- id: PL-063
  severity: Medium
  category: "Concurrency"
  source_finding: "F-ES-01 (gpt, 8b)"
  owner_area: "EmulationStation AtomicFileUtil"
  where: "es-core/src/utils/AtomicFileUtil.cpp:41, 65"
  acceptance: "a unit test with two concurrent writers leaves a whole file"
  outcome: open
- id: PL-064
  severity: Medium
  category: "Upgrade path"
  source_finding: "F-ES-03 (gpt, 8b)"
  owner_area: "EmulationStation SystemConf"
  where: "es-core/src/SystemConf.cpp:138-153"
  acceptance: "a unit test with a cut live file, a whole `.tmp` and no backup loads the `.tmp`"
  outcome: open
- id: PL-065
  severity: Medium
  category: "Guards fail closed"
  source_finding: "F-ES-04 (gpt, 8b)"
  owner_area: "EmulationStation AtomicFileUtil"
  where: "es-core/src/utils/AtomicFileUtil.cpp:117-119"
  acceptance: "a unit test with a read that fails part-way returns ok=false"
  outcome: open
- id: PL-066
  severity: Medium
  category: "Outcome vocabulary"
  source_finding: "F-CS-11 (gpt)"
  owner_area: "cloud_content_backup / cloud_content_restore"
  where: "cloud_content_backup:570-578; cloud_content_restore:1103-1105"
  acceptance: "the scripts test: a failing game-list copy ends `COULDN'T FINISH`"
  outcome: open
- id: PL-067
  severity: Medium
  category: "Concurrency"
  source_finding: "F-CS-14 (gpt)"
  owner_area: "cloud_capture"
  where: "cloud_capture (`finish`)"
  acceptance: "the scripts test: two captures serialise"
  outcome: open
- id: PL-068
  severity: Medium
  category: "Concurrency"
  source_finding: "F-CS-15 (gpt)"
  owner_area: "EmulationStation GuiSaveState"
  where: "es-app/src/guis/GuiSaveState.cpp:412-418, 450, 469"
  acceptance: "a walk with `cloud_backup` running from the shell: DELETE is refused with the reason"
  outcome: open
- id: PL-069
  severity: Medium
  category: "Resource"
  source_finding: "F-CS-16 (gpt)"
  owner_area: "EmulationStation ThreadedCloudSync"
  where: "es-app/src/ThreadedCloudSync.cpp:46, 49, 690"
  acceptance: "`ls /proc/<es>/task | wc -l` on the guest is flat across 50 exit syncs"
  outcome: open
- id: PL-070
  severity: Medium
  category: "Guards fail closed"
  source_finding: "F-CS-17 (gpt)"
  owner_area: "cloud_backup"
  where: "cloud_backup:654"
  acceptance: "the scripts test: a damaged archive under busybox fails the check"
  outcome: open
- id: PL-071
  severity: Medium
  category: "Outcome vocabulary"
  source_finding: "F-CS-18 (gpt)"
  owner_area: "cloud_migrate_layout"
  where: "cloud_migrate_layout:311-320"
  acceptance: "the scripts test: a failing content move ends non-zero"
  outcome: open
- id: PL-072
  severity: Medium
  category: "Outcome vocabulary"
  source_finding: "F-CS-19 (gpt)"
  owner_area: "EmulationStation ThreadedCloudSync"
  where: "es-app/src/ThreadedCloudSync.cpp:364-365 (the 69 branch)"
  acceptance: "a unit test of the outcome lines; a guest run with the link cut mid-transfer"
  outcome: open
- id: PL-073
  severity: Low
  category: "Dead code"
  source_finding: "F-VM-01 / F-VM-02 (claude) + F-VM-02 (gpt)"
  owner_area: "GENERIC_X64 bootloader"
  where: "projects/ROCKNIX/devices/GENERIC_X64/bootloader/update.sh"
  acceptance: "either the guest's `/flash` changes on an update, or the script is gone"
  outcome: open
- id: PL-074
  severity: Low
  category: "Credentials"
  source_finding: "F-RS-04 (gpt)"
  owner_area: "cloud_oauth"
  where: "cloud_oauth:260, 338"
  acceptance: "the log line after a failed create carries no rclone text"
  outcome: open
- id: PL-075
  severity: Low
  category: "Portability"
  source_finding: "F-ES-05 (gpt, 8b)"
  owner_area: "EmulationStation AtomicFileUtil"
  where: "es-core/src/utils/AtomicFileUtil.cpp:42-64"
  acceptance: "the header's contract matches the branch"
  outcome: open
- id: PL-076
  severity: Low
  category: "Correctness"
  source_finding: "F-RW-02 (gpt)"
  owner_area: "RetroArch GENERIC_X64 profile"
  where: "projects/ROCKNIX/packages/emulators/.../sources/GENERIC_X64/retroarch.cfg"
  acceptance: "the cfg line"
  outcome: open
- id: PL-077
  severity: Low
  category: "Concurrency"
  source_finding: "F-BR-10 (gpt) + F-PB-03 (gpt)"
  owner_area: "backuptool / rocknix-evidence"
  where: "the same-second names"
  acceptance: "two runs in one second leave two archives"
  outcome: open
- id: PL-078
  severity: Low
  category: "Fork-only"
  source_finding: "F-PB-11 / F-PB-12 (gpt)"
  owner_area: "EmulationStation fork's pre-push"
  where: "the ES fork's `.githooks/pre-push`"
  acceptance: "the hook's own test"
  outcome: open
- id: PL-079
  severity: High
  category: "Data loss"
  source_finding: "gpt F-CS-02 (Critical as filed; missed by the verification pass -- its number is shared with the Claude seat's F-CS-02)"
  owner_area: "cloud_content_backup / cloud_content_restore"
  where: "projects/ROCKNIX/packages/network/rclone/sources/cloud_sync-rules.txt:27; cloud_content_backup (the content excludes); cloud_content_restore (`--match`)"
  acceptance: "the scripts test's case A25: a match over a system holding `Game.fla` plans no removal of it (FAIL on the old tree: `plan 'n64|remove|2|15'; Game.fla DELETED`)"
  outcome: open
- id: PL-080
  severity: Medium
  category: "Correctness"
  source_finding: "claude F-CS-13 (fell through both lists)"
  owner_area: "cloud_backup"
  where: "cloud_backup (the automatic run's stall ceiling)"
  acceptance: "the scripts test's case A30: a listing that grows for longer than the stall bound completes (FAIL on the old tree: `rc 124 after 4s`)"
  outcome: open
```

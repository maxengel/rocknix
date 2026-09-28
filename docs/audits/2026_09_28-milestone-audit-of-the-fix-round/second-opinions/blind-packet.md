# The evidence, without the verdicts

## The criteria: the punch items with their acceptance text

# The punch items stream A owned (with the acceptance text each carries; #307)

- **PL-001** (Critical) `--match --apply` deletes a system whose cloud listing failed, and enforces no previewed plan -- `tools/last-good-scripts-test` case: a system whose listing returns 5 is neither planned nor removed; a system planned `remove` in the preview and `sync` at apply is refused; the `--max-delete` count on apply equals the preview's
- **PL-012** (High) `--all` restores ROMs and never BIOS, and re-anchors the media filters -- a journey restore with `--all` brings `BIOS/` down; `tools/cloud-round-trip` asserts a BIOS file's presence after `--all`
- **PL-015** (High) A root-level saves path nests the settings and content folders inside it -- `cloud_setup --set-saves-remote /` is refused with the reason, or the derived paths are `/ROCKNIX/Settings` beside `/ROCKNIX/Saves`; the scripts test covers both
- **PL-020** (High) An incomplete rules file can replace the live allowlist, and the consumers do not check for the catch-all -- a candidate cut before its last line is not installed and the helper says so; `cloud_backup` with a rules file lacking the catch-all ends `COULDN'T FINISH`; both in the scripts test
- **PL-021** (High) Pruning by name order can delete the replaced-saves folder or the archive this run just wrote -- the scripts test seeds a future-dated sibling folder and asserts the run's own folder survives the prune
- **PL-025** (High) The layout migration moves the old root's backups into Saves -- the scripts test seeds an old root with `saves` and `backup/` and asserts nothing under `Saves/backup/` after `--apply`
- **PL-026** (High) The pointers are rewritten only after both moves, and the backups' resume check compares the saves source -- the scripts test kills the migration between the two moves and asserts the second run completes
- **PL-027** (High) A listing that fails reads as an empty folder, and the pointers move with nothing copied -- the scripts test points the migration at a dead endpoint and asserts no pointer changes
- **PL-028** (High) A saves phase that moved nothing (rclone 9) hides a failed settings phase -- the scripts test: saves 9 beside a failed settings phase ends `COULDN'T FINISH`; `tools/cloud-round-trip`'s settings phase asserts the outcome
- **PL-030** (High) Cloud folder names reach the shell unquoted -- a cloud folder named `a$(touch /tmp/x)b` picked on the guest leaves no `/tmp/x`; the script's refusal is in the scripts test
- **PL-051** (Medium) Paths are written into the conf through an unescaped `sed` replacement, and the conf is sourced -- the scripts test: a path with `&` round-trips
- **PL-052** (Medium) A relative `--retire` argument is unlinked relative to the working directory -- the scripts test: a relative argument is refused
- **PL-053** (Medium) The migration purges the source after a point-in-time check -- the scripts test: a file added after the check survives
- **PL-066** (Medium) The game-list pass's failure is dropped -- the scripts test: a failing game-list copy ends `COULDN'T FINISH`
- **PL-067** (Medium) The capture's final check and rename are not one step -- the scripts test: two captures serialise
- **PL-070** (Medium) `unzip -t || unzip -l` makes a listing pass for an integrity test -- the scripts test: a damaged archive under busybox fails the check
- **PL-071** (Medium) `migrate_content`'s failure is dropped -- the scripts test: a failing content move ends non-zero
- **PL-079** (High) A content match could delete N64 `.fla` saves -- the scripts test's case A25: a match over a system holding `Game.fla` plans no removal of it (FAIL on the old tree: `plan 'n64|remove|2|15'; Game.fla DELETED`)
- **PL-080** (Medium) A long cloud listing was read as a stall and ended the automatic run -- the scripts test's case A30: a listing that grows for longer than the stall bound completes (FAIL on the old tree: `rc 124 after 4s`)

# The punch items stream B owned (with the acceptance text each carries; #307)

- **PL-003** (High) The saved-network join stores nmcli's escaped passphrase -- `tools/last-good-scripts-test` case: a PSK with `:` and `\` round-trips through join and read back byte for byte; on the guest, `get_setting wifi.key` after a join equals the value typed
- **PL-004** (High) An unquoted array expansion drops every backed-up path that contains a space -- a location named `my games/` is in the archive; the scripts test constructs it and fails the unfixed script
- **PL-005** (High) The credential scan warns and the backup still exits 0; detected credentials do not block publication -- a settings tree seeded with a `pass =` line produces no archive and the outcome line; `tools/last-good-scripts-test` case
- **PL-006** (High) The credential scan's prefix class admits no capital, so `Password=` and `TOKEN=` pass under a custom `LOCATIONS` -- `Password=<long literal>` in a custom location is caught; the scripts test covers it
- **PL-007** (High) The pre-restore snapshot covers the device's selection, not the archive's members -- restoring an archive with a member outside `LOCATIONS` and rolling back restores the original file
- **PL-008** (High) A broad custom selection nests the backup directory's own credential-bearing snapshots into the archive -- an archive made with `LOCATIONS=/storage/.config` holds no member under the backup directory
- **PL-009** (High) A failed snapshot collection reads as an empty device -- a collector made to fail (an unreadable location) aborts the restore with the outcome line; the scripts test covers it
- **PL-010** (High) A legacy restore overwrites the device's cloud identity -- a legacy archive carrying an `rclone.conf` leaves the device's untouched; the scripts test covers it
- **PL-011** (High) A failed settings write returns success -- `set_setting` on a read-only file exits non-zero; the scripts test covers it
- **PL-031** (Medium) The saved-network join reports success on the wrong interface -- the scripts test: a join with another interface up reports the joined one's state
- **PL-035** (Medium) An empty custom selection, or a path spelled with `/.`, escapes the policy's exclusions -- the scripts test: `/storage/./.config` is excluded like `/storage/.config`
- **PL-036** (Medium) Unchecked collection errors, and whitespace lost in the legacy inspection -- the scripts test covers a member with a space in the legacy path
- **PL-037** (Medium) Seed pruning leaves an edited file on restore -- the scripts test: an edited `es_settings.cfg` after a backup that pruned it is reset on restore
- **PL-038** (Medium) A custom location outside `/storage` is dropped silently -- the scripts test: `/flash/x` in `LOCATIONS` ends with the refusal line
- **PL-039** (Medium) The restore mark's write is unchecked -- the scripts test: an unwritable mark path ends the restore before the restart
- **PL-040** (Medium) The redaction misses a value starting with `&` or `;` -- the redaction test covers `&y=KEY` at a value's start
- **PL-041** (Medium) Two waiters can remove each other's stale lock, and the PID write's result is ignored -- `tools/wait-lock-test` and an ES unit test with two contenders on a stale lock
- **PL-044** (Medium) `rm -rf` unchecked before `cp -rf` -- the scripts test: a failing `rm` does not reach the `cp`
- **PL-045** (Medium) The restore marker is consumed when the snapshot's folder exists unmounted -- the scripts test: an unmounted folder leaves the marker
- **PL-046** (Medium) A filtered file is counted when the `mv` fails -- the evidence test: a failing `mv` is not counted
- **PL-064** (Medium) Startup deletes a temporary the previous writer may have needed, and usable means one assignment -- a unit test with a cut live file, a whole `.tmp` and no backup loads the `.tmp`
- **PL-077** (Low) Same-second concurrent runs share names -- two runs in one second leave two archives

# The punch items stream C owned (with the acceptance text each carries; #307)

- **PL-015** (High) A root-level saves path nests the settings and content folders inside it -- `cloud_setup --set-saves-remote /` is refused with the reason, or the derived paths are `/ROCKNIX/Settings` beside `/ROCKNIX/Saves`; the scripts test covers both
- **PL-016** (High) Text typed on the phone before the window is up is never delivered -- typing on the phone page before the window opens reaches the field after it opens (a guest run with the page driven by curl and the window's log)
- **PL-017** (High) The phone page's Back button bypasses the box's text model -- typing `abc`, Back, `d` on the phone page leaves `abd` in the field on guest d (the sign-in window's log); a doctest of the page's script if it is testable, else the guest run
- **PL-018** (High) `wait` returns at a successful sign-in while the bridge still holds the pad's grab -- on the guest with a uinput gamepad; a device fact, when one is taken, is a row in `docs/releases/device-facts.md`
- **PL-030** (High) Cloud folder names reach the shell unquoted -- a cloud folder named `a$(touch /tmp/x)b` picked on the guest leaves no `/tmp/x`; the script's refusal is in the scripts test
- **PL-047** (Medium) A failed README probe overwrites the owner's note -- the scripts test: a listing that fails writes nothing
- **PL-048** (Medium) `self.configured` is set before the remote is created and verified -- a unit test of the session's state transitions
- **PL-049** (Medium) `cancel`'s SIGTERM skips the serve's `finally`, orphaning the window -- `cloud_oauth cancel` with the page up closes the window (the guest's window log)
- **PL-050** (Medium) An rclone that exits without a token leaves the on-device session `waiting`; a serve whose port is taken dies with a traceback and status `starting` -- a unit test of `_collect` with a process that exits early; the status reads failed
- **PL-051** (Medium) Paths are written into the conf through an unescaped `sed` replacement, and the conf is sourced -- the scripts test: a path with `&` round-trips
- **PL-074** (Low) rclone's stderr excerpt is logged verbatim on a failed remote creation -- the log line after a failed create carries no rclone text

# The punch items stream D owned (with the acceptance text each carries; #307)

- **PL-013** (High) A cancel during the scan's image pass downloads everything already queued first -- CANCEL during the image pass ends the run inside two seconds on the guest (a frame series shows the page close)
- **PL-055** (Medium) The offline index's marker is consumed before the listing succeeds -- the scripts test: a listing that fails leaves the marker
- **PL-057** (Medium) The bulk summary reads only `patch:` rows and turns unreadable unlocks into none -- the scripts test seeds an achievementsets-only game and a bad unlock row
- **PL-058** (Medium) The refresh helper reports success over a failed drop -- the helper's test: a failing drop is in `M failed`
- **PL-059** (Medium) The scan cap has no cursor past files that cannot be cached, and truncation is not on the page -- the scripts test with 5,001 uncacheable files reaches the 5,001st on the second run; the page's frame reads the note
- **PL-060** (Medium) Image-pass failures are dropped and a scan with nothing new never repairs them -- the scripts test: a failing image pass ends the scan `COULDN'T FINISH`

# The punch items stream E1 owned (with the acceptance text each carries; #307)

- **PL-024** (High) A settings-lock timeout is followed by the read-modify-write anyway -- a unit test with the lock held by another process: the interface's save keeps a key the other writer changed; `es-syntax-check` PASS
- **PL-041** (Medium) Two waiters can remove each other's stale lock, and the PID write's result is ignored -- `tools/wait-lock-test` and an ES unit test with two contenders on a stale lock
- **PL-063** (Medium) Every writer shares `path.tmp` under `O_TRUNC` -- a unit test with two concurrent writers leaves a whole file
- **PL-064** (Medium) Startup deletes a temporary the previous writer may have needed, and usable means one assignment -- a unit test with a cut live file, a whole `.tmp` and no backup loads the `.tmp`
- **PL-065** (Medium) `readText` reports success after `open`, not after the read -- a unit test with a read that fails part-way returns ok=false
- **PL-068** (Medium) Save-state DELETE and COPY check the interface's own sync, not the transfer lock -- a walk with `cloud_backup` running from the shell: DELETE is refused with the reason
- **PL-069** (Medium) Every sync leaks a joinable thread -- `ls /proc/<es>/task | wc -l` on the guest is flat across 50 exit syncs
- **PL-072** (Medium) A sync that moved files and then lost the link says SKIPPED with no in-place clause -- a unit test of the outcome lines; a guest run with the link cut mid-transfer
- **PL-075** (Low) The `_WIN32` branch deletes before it renames -- the header's contract matches the branch
- **PL-078** (Low) The fork-only guard's history range and rename cases -- the hook's own test

# The punch items stream E2 owned (with the acceptance text each carries; #307)

- **PL-014** (High) The folder rescan deletes FileData the collections and the filter index still point at -- the rescan soak on the VM (a folder changed under a game list with a collection open, 200 iterations) runs with no crash; `es-syntax-check` PASS
- **PL-029** (High) The settings-first restore promises the ticks and restores everything after the restart -- on the guest: settings + saves ticked, settings first, restart -- the journal shows no `cloud_content_restore` run; a frame of the done page lists the two tiers
- **PL-030** (High) Cloud folder names reach the shell unquoted -- a cloud folder named `a$(touch /tmp/x)b` picked on the guest leaves no `/tmp/x`; the script's refusal is in the scripts test
- **PL-054** (Medium) The send card says NOW ON YOUR ACCOUNT on an empty queue without the flush stamp -- a unit test of the outcome; the VM proof's send card
- **PL-056** (Medium) Two top-up watchers on one progress file -- a unit test; the VM proof shows one top-up card
- **PL-061** (Medium) The exit capture is not among the launch guards -- a relaunch inside the capture's run waits (the journal's order on the guest)
- **PL-062** (Medium) The hub's gated rows keep offering setup after setup completes -- a walk: setup from a gated row, FINISH, the row runs
- **PL-068** (Medium) Save-state DELETE and COPY check the interface's own sync, not the transfer lock -- a walk with `cloud_backup` running from the shell: DELETE is refused with the reason

# The punch items stream F1 owned (with the acceptance text each carries; #307)

- **PL-019** (High) The QEMU quirk scripts write to a read-only `/etc` and nothing they write exists on a booted guest -- `journalctl -b | grep -c 'Read-only file system'` on a guest reads 0; vm-qa all suites PASS on the image without the scripts
- **PL-022** (High) A second quirk tree nothing installs contradicts the installed one -- the path is gone from `next`; `tools/pkgcheck quirks` PASS; the guest's installed set unchanged
- **PL-023** (High) A root shell on ttyS0 on every GENERIC_X64 boot -- `systemctl show serial-debug-shell.service -p ConditionResult` is `yes` on the guest; the unit file carries the condition; the register row exists
- **PL-033** (Medium) Printing the QEMU arguments unlinks the socket paths (and, with the disk passed as `--monitor`, the disk) -- `generic-x64-vm qemu-args` on a running guest's paths leaves them
- **PL-034** (Medium) Automatically chosen RetroArch dimensions become the player's after the first boot -- after a resolution change on the guest the values follow; `vm-upgrade-rehearsal` asserts the player's cfg unchanged
- **PL-042** (Medium) The tmpfiles rules would create regular files at socket paths -- gone with the quirk set
- **PL-073** (Low) The in-place bootloader updater copies nothing and still writes the UPDATE hint -- either the guest's `/flash` changes on an update, or the script is gone
- **PL-076** (Low) The x64 RetroArch profile names an armhf core-updater endpoint -- the cfg line

# The punch items stream F2 owned (with the acceptance text each carries; #307)

- **PL-002** (High) The shared rotation generators sit outside their consumers' build stamps -- editing a generator and running `./scripts/build <core>` rebuilds the core (the `build_target` stamp moves)
- **PL-032** (Medium) Patch 0017's sharp-size tables never apply on the shipped font, and 0017 carries 0016's line as stale context -- a `RARCH_LOG` line on the guest names the table applied; `frame-diff` shows the widget text at a sharp size
- **PL-043** (Medium) The build `.env` is written at parse time and an old 0644 copy is not tightened -- `stat -c %a .env` during a build reads 600
- **PL-076** (Low) The x64 RetroArch profile names an armhf core-updater endpoint -- the cfg line


## The orchestrator's reads of the code, commands and their outputs (verdict lines removed)

## Verification (Phase 4.5, running; a finding is written here the moment it is checked)

_The orchestrator's own reads of the highest-risk follow-up hunks, made before the seat outputs were opened (so they are independent of them); each names the artifact and what would have refuted it._

### O-1 (A, `91231adf43`) -- the migration's verification reads rclone's exit status and an exact count
**Read:** `cloud_migrate_layout`: `check_clean()` returns 1 unless `$1 -eq 0` and the output matches `(^|[^0-9])0 differences found`; both call sites (`relocate`, `resumable`) run `out=$(rclone check ...)` and call `check_clean $? "${out}"` on the very next line, so `$?` is rclone's status. "10 differences found" no longer matches. The harness case A31 constructs ten differences and asserts the pointer stays and RC is non-zero.
**Would refute it:** a statement between the assignment and the check (none), or a caller that still greps the output (none; `grep -n 'differences found'` finds only `check_clean`).

### O-2 (A, `79c2f15725`) -- the pointer is read back before the old folder is removed
**Read:** in `relocate`, `set_pointer` (line 33 of the function) returns non-zero unless `conf_value "$1"` reads back the value just written; a failure returns 2 before "Removing the old folder" (lines 37-38, the `rclone delete` and `rmdirs`); the caller treats rc 2 apart from "SOME FILES DIDN'T FINISH" and the why is `YOUR CLOUD SYNC SETTINGS COULDN'T BE SAVED` (in the card's table since ES `87b182fbe`).
**Would refute it:** a delete before the pointer write, or a read-back that reads the value from memory; neither.

### O-3 (A, `d5f24b05aa`) -- `conf_valid` is a grammar
**Read:** `cloud_backup:1017`: `bash -n` and then an awk grammar -- `KEY=` then a double-quoted value in which only `$NAME`/`${NAME}` expansions, no backticks, no backslashes but a trailing continuation are allowed; the five path keys refuse `$`, backtick, backslash, control characters and multi-line values (`whole()`); a continuation line is parsed by the same `dq()`; anything after the closing quote but space or a comment is bad. The first 45 lines read; the bare and single-quoted branches are below the cut and are the seats' to read.

### O-4 (B, `a7163034df`) -- the credential scan fails closed
**Read:** `backuptool`'s `credential_lines`: `find` into a list file, a failed walk returns 1; each `grep -c` keeps its status and a status above 1 or an empty count returns 1; the caller distinguishes a scan that could not run (return 3, the staging removed) from a scan that found a leak (return 5).

### O-5 (B, `59f0fbf0bc`) -- the boot's revert reads the mount table
**Read:** `chksysconfig`: `/proc/mounts` read with awk on the mount-point field; unreadable table falls back to the folder test with a `say` line; `under_roms` answers "waits" only when the table says the roms folder is not mounted; the marker's created paths are judged too. Proven on the guest: the runner's `B-kill18-reboot` 7 PASS on `1b0d233657` where `4234be0b6b` deferred the revert for ever.

### O-6 (E2, ES `f4c9549ba`) -- the capture gate refuses at its bound
**Read:** `FileData.cpp`: after the bounded wait, the launch continues only if the capture in flight is no longer the one waited on; else `sCaptureWaitedOn` is cleared, a warning is logged and a one-button `GuiMsgBox` with `YOUR LAST GAME'S SAVES ARE STILL BEING RECORDED. TRY AGAIN IN A MOMENT.` is shown, and the game is not started; a capture older than `CaptureHungSeconds` (120, steady clock from `sCaptureStartedMs`) is taken as hung and stops holding launches, with a log line. Proven on the guest (run 2, `E2-pl061` 11 PASS, the refusal on its frame).

### O-7 (E2, ES `71a67ed1b`) -- the journey record is read whole and replaced or not at all
**Read:** `JourneyTiers.h`: the reader requires `saves=`, `content=`, `media=` each exactly once with a value of 0 or 1, else the record is unknown; `replaceRecord` removes the old record, refuses if it still exists, writes the new one, and reports `OldRecordStands` when the old one can be neither replaced nor removed -- the restore then does not start (`COULDN'T SAVE WHAT YOU TICKED, SO NOTHING WAS RESTORED.`, proposed).

### O-8 (C, `db843bf27d`) -- the sign-in state is written under a file lock by its owner only
**Read:** `cloud_oauth`: `_state_locked()` takes an `flock(LOCK_EX)` on `session.lock` around every read-modify-write; each serve stamps an attempt id and `write_owned` refuses a write whose attempt is not the state's; `_fail_owned` checks the status set and the ownership under the lock; a superseded holder no longer writes failure over the new attempt.

### O-9 (D, `ebcbf19817`) -- the scan cursor is kept only after the run's jobs
**Read:** `raofflineproxy-ctl` and `cache-images`: the listing writes `scan-cursor.next` (`propose_cursor`); `commit_cursor` moves it into place after the jobs and reads it back against the proposed value, failing the run (exit 1, `SOMETHING_WENT_WRONG`) when it cannot; the exit trap removes `.next`, so a cancelled run leaves the old cursor. Proven on the guest (run 2, `D-pl059` PASS: the cursor kept only after the jobs, no `.next` left).

### O-10 (B, `316bb02e5d`) -- the exclusions are one checked filter
**Read:** `backuptool`: one awk pass drops the own backups folder, the staging prefix, the cores and the evidence folders from the file list into `.kept`; the count of kept lines, the count of dropped ones and the `mv` into place are each checked in one `||` chain, and any failure logs, removes every list and returns 2 -- nothing written. Before, two unchecked passes and a count that only logged.

### O-11 (B, `97db4608d4`) -- the last-good records beside a stripped file are held back
**Read:** `backuptool`: the key scan's file classes now include `*.backup`, `*.bak`, `*.cfg.*`, `*.conf.*`, `*.ini.*`; for every file the backup strips or holds back (`system.cfg`, `es_settings.cfg`, the RetroArch config, the token files, the device-only set) its `.backup`, `.bak`, `.tmp` and `.old` neighbours present in the list are added to the held-back list, with a count logged. D-CLOUD-147.

### O-12 (E1, ES `44705df2d`) -- a cut live file against a whole record
**Read:** `es-core` `AtomicFile`: a live file that is not complete, shorter than a whole `.backup`, a prefix of it, and no newer than the record (`st_mtime <= backup + 1`) is treated as cut of the record and the record loads; a save made onto such a base is written and not recorded as last known good (`baseWhole`); the recovered file's mode is the most private of the copies on disk. A live file cut *after* the record was made has a newer mtime and falls to the existing `liveCut` handling.

### O-13 (E1, ES `5e390e128`) -- the reap guard is tried without blocking
**Read:** `removeIfStill` takes the guard with `LOCK_NB` in a loop until the acquire's own deadline; when it cannot, it returns false and the acquire fails rather than removing the holder's lock -- nothing is removed without the guard.

### O-14 (D, `dfdc3a6891`) -- one rule for a ready game
**Read:** `raofflineproxy-ctl`'s comparison: a game is ready when the account's unlocks row exists and an achievement-set row names its `GameId` (parsed from the first 512 characters of the row, else from the whole body; a body that cannot be parsed contributes nothing). The stream reports the count going from 3 to the correct 2, and a `grep` that cannot read now fails the comparison rather than counting zero (below the read's cut; the seats' to confirm).

### O-15 (D, `adf852a4b7`) -- only a listener PPSSPP can reach counts
**Read:** the `/proc/net/tcp{,6}` match accepts `127.0.0.1:8080`, `0.0.0.0:8080` and `::ffff:127.0.0.1:8080` and no longer `::` or `::1`; the harness case constructs each. **A question for the seats:** a service bound to `::` on a dual-stack kernel (`bindv6only=0`) does serve `127.0.0.1`, so dropping `::` is stricter than the fact; it is harmless only if the proxy never binds `::`, which the packet's `raofflineproxy` bind should show.

### O-16 (C, `8b5655a4dc`) -- a saves folder named like its own sibling is refused
**Read:** `cloud_setup`'s `syncpath_problem`: the typed path, case-folded, is refused when it equals `<parent>/Backups` or `<parent>/Content`, with the folder to use (`Try <parent>/Saves.`); the derived siblings are exactly those two names, so the collision set is complete. An already-aliased configuration is read as it stands (the accepted-risk ledger of the fix audit).

### O-17 (F1, `16ae2219ca`) -- the take-backs remove exact names, once
**Read:** the two take-back scripts list the exact paths the retired quirks wrote and remove those; each runs until its files are gone, then writes a stamp under `/storage/.cache` and exits early on every later boot; the rescue and emergency masks are removed by name. The harness's F1 cases: an owner's own drop-in (`weston.service.d/10-generic-x64.conf` named after the pattern but the owner's) survives; the take-back boot's journal says so; a second boot changes nothing.

### O-18 (F2, `f53264dcb0`) -- 0018 decides Auto when the configuration loads
**Read:** the patch's answer is taken in `config_load_file` from the `--appendconfig` list right after RetroArch appends those files, the last file that sets `state_slot` winning as in the load, so the answer describes what RetroArch read, not what is at those paths by content-load time; a `-1` in the main config is not this launch's request and is scanned, reset or restored over as upstream does. The harness compiles the helper with RetroArch's own config parser over ten append lists (expects `0100001111`); the runner's `F2-autoslot` on `1b0d233657`: 9 PASS, the log's `Keeping the Auto slot` line and the `-1` not sticking.

### O-19 (F2, `9f1d126d24`) -- a kept guest's Control1 splice is repaired
**Read:** `start_mupen64plus.sh` on GENERIC_X64 only, when the config holds the `[Retroid Pocket Gamepad]` header: an awk pass drops exactly the six pasted lines as a block, writes a temporary, and replaces the config only if the temporary is non-empty; the case F2-5b asserts that exactly those six lines leave a player's copy and that the player's own `plugin = 5` and `ScreenWidth = 1280` stay.

### O-20 (seam: the proxy's outcome tokens x the interface's tables)
**Read:** `raofflineproxy-ctl` prints `SOME_IMAGES_NOT_SAVED`, `TOOK_TOO_LONG`, `LIBRARY_UNREADABLE`, `SOMETHING_WENT_WRONG` and `CANCELLED` as its why tokens; `CloudText.cpp` maps the first three (lines 988-1000) and `CANCELLED`; `SOMETHING_WENT_WRONG` has no row of its own, and needs none: the stamp's why is read back with its underscores as spaces (`CloudText.cpp:285-288`) and anything the table does not know reads as `SOMETHING WENT WRONG` (`:1008`, `:1124`), which is the same sentence.

### O-21 (seam: the settings lock, the scripts x the interface)
**Read:** `profile.d/001-functions` (the scripts' side, B `f3622d3a2d`) and `es-core/src/utils/AtomicFileUtil.cpp` (the interface's side, E1 `5e390e128`) name the same lock (`/tmp/.system.cfg.lock`), the same contents (the holder's pid alone), the same birth (written to `<lock>.<pid>` and hard-linked), and the same reap guard (`<lock>.reap` under `flock`); the scripts' comment cites the interface's `PidLock` and the interface's cites the scripts. D-INFRA-012 (pid-only, bounded by `pid_max`) is written on both sides.

_The seats' Highs, each re-read against the source on `next` (the distribution) or the ES branch at `87b182fbe`, with the command where one settles it._

### G2-A-01 (claude, A) -- a tier whose pointer names its destination under another spelling is copied onto itself and its files deleted
**Seat's claim:** the PL-026 guards compare the conf's raw string with the constant (`/ROCKNIX/Saves`); `SAVES_REMOTE="/ROCKNIX/Saves/"` is not equal, so the tier is treated as unmoved, copied onto itself, verified clean and its source files deleted -- the same folder.
**Checked:** `cloud_migrate_layout` lines 447, 455, 531, 537, 546, 548, 565, 577, 594: every compare is `[ "${saves}" != "${NEW_SAVES}" ]` on the raw value; the `${1%/}` normalisations at 109, 188, 499-505 are inside helpers, not before these compares; `relocate` has no `src == dst` refusal (its first twelve lines read). A trailing slash in the conf reaches the compare as written. Whether `rclone copy X X` exits 0 was not run here; the delete that follows runs `rclone delete "${src}" --files-from-raw` on the same folder regardless.

### G2-A-01 (gpt, A) -- `conf_valid` accepts an executable "comment" after a carriage return
**Seat's claim:** `rest()` accepts `\r` as whitespace before `#`; bash does not, so `EXTRA="x"<CR>#$(cmd)` passes the validator and runs `cmd` when sourced.
**Checked:** `cloud_backup:1017` `conf_valid`: `function rest(s, i) { if (substr(s, i) !~ /^([ \t\r]+(#.*)?)?$/) bad() }` -- a CR is in the class; `whole()` inspects the parsed value only; `bash -n` accepts the line. The same grammar is in `cloud_restore` and `cloud_sync_helper`. A33's seven shapes do not include a CR.

### G2-A-02 (gpt, A) -- a failed safety copy can overwrite the valid configuration
**Seat's claim:** the duplicate-cleanup fallback restores `.pre-cleanup.$$` on `-s` alone, so a `cp` that failed part-way (a full card) leaves a truncated prefix that then replaces the untouched valid file.
**Checked:** `cloud_backup` (the block at the first `pre_cleanup`): `if cp -f ... && cleanup && conf_valid; then ... elif [ -s "${pre_cleanup}" ] && mv -f "${pre_cleanup}" "${conf_file}"; then` -- the `elif` runs when `cp` itself failed; nothing records that the copy completed and nothing validates the copy before the move. `cloud_restore` carries the same block (5 references).

### G2-B-01 (gpt, B) -- reading the backup-folder setting executes `cloud_sync.conf`
**Seat's claim:** `backuptool` sources the configuration to read `SETTINGS_BACKUPS`, against the rule that the file is never sourced with a command in it.
**Checked:** `backuptool:42`: `_configured=$( unset SETTINGS_BACKUPS BACKUPFOLDER; . /storage/.config/cloud_sync.conf >/dev/null 2>&1; printf ...)` -- a subshell, but a source; the `case` after it validates the string only. The cloud scripts gate their own sourcing on `conf_valid` (O-3); `backuptool` has no such gate.

### G2-B-02 (gpt, B) -- the redaction fast path lets `--pass value` through
**Seat's claim:** the argument-mode detector recognises `pass` only before `=` or `:`; the flag form takes the fast path unredacted.
**Checked by running it:** `source profile.d/001-functions; redact_credentials 'launcher --pass qa-value'` prints `launcher --pass qa-value`; `'x --RA_Pass qa-value'` prints unchanged; `'pass=qa-value'` is masked.

### G2-B-04 (gpt, B) -- a failed snapshot worklist reads as "nothing to protect"
**Seat's claim:** `snapshot_members`'s `KEEP=$(mktemp)` and its appends are unchecked; an empty worklist returns 4, which the caller reads as no members to protect, and the restore extracts without a snapshot.
**Checked:** `backuptool` `snapshot_members` lines 3, 17, 24-27: `KEEP=$(mktemp)` unchecked, `printf ... >> "${KEEP}"` unchecked, `[ ! -s "${KEEP}" ]` returns 4 whatever emptied it.

### G2-B-05 (gpt, B) -- extraction applies members the snapshot never covers
**Seat's claim:** the snapshot lists `storage/*` regular files; extraction runs the whole archive minus a skip list, so a member outside `storage/` (a legacy or foreign archive's `tmp/...`) is written to `/` and never rolled back.
**Checked:** `archive_members` filters `^storage/` (line 5's awk and the tar case at 479-480); `tar -xzf ... -C / -X "${SKIP}"` (1356) and the unzip equivalent extract everything not skipped; nothing refuses an archive with a member outside `storage/`.

### G2-B-06 (gpt, B) -- an archive can overwrite the recovery marker that protects its own extraction
**Seat's claim:** `RESTORE_MARK` is written and verified before extraction but not excluded from it; an archive carrying `storage/.config/.restore-in-progress` (a stale marker captured by an earlier broad backup) overwrites the fresh one.
**Checked:** `backuptool:1302` sets the marker; the skip list at 1355 holds the ppsspp assets and the token files, not the marker; `grep -n RESTORE_MARK | grep -i skip` finds nothing.

### G2-B-07 (gpt, B) -- a quoted password beginning with whitespace passes the key scan
**Seat's claim:** the value suffix `"?[^"[:space:]]+` cannot consume a space after the opening quote.
**Checked by running it:** `printf 'password = " leading-text"\npassword = "plain"\n' | grep -ciE "$CREDENTIAL_KEYS"` prints 1 -- the leading-space line does not match.

### G2-C-04 (gpt, C) -- dot components bypass the tier-separation guard
**Seat's claim:** `/Mine/Backups/.` passes `syncpath_problem`; `dirname` makes the siblings `/Mine/Backups/Backups` and `/Mine/Backups/Content`, inside the saves folder.
**Checked by running it:** `syncpath_problem '/Mine/Backups/.'` returns 0 (accepted) on `next`'s `cloud_setup`; the function rejects `"`, `$`, backtick, backslash and control characters, and the two sibling names, and nothing else.

### G2-E-core-01 (gpt, E-core) -- an escaped inner quote ends the masked range
**Seat's claim:** in `maskValueEnd`'s enclosing-quote branch the inner-quote test runs before the backslash escape, so `sh -c 'tool --password "front\" back"'` leaves `back` unmasked.
**Checked:** `es-core/src/utils/StringUtil.cpp` `maskValueEnd`: the `inner != 0` branch (lines +31..+34 of the function: `if (c == inner) inner = 0`) precedes the single-quote backslash branch (+38..+40); the double-quote escape at +22..+25 applies only when the enclosing quote is `"`. Under a `'`-enclosing command an inner `\"` closes the inner quote.

### G2-E-tests-01 (gpt, E-tests) and G2-I-02 (gpt, I) -- the hooks' scan fails open when its pipeline fails
**Seat's claim:** `hits="$(git diff ... | awk | grep -E | sed | head -5 || true)"`; an invalid pattern, or a missing tool, yields an empty `hits` and the hook exits 0.
**Checked by running it:** a copy of `.githooks/pre-commit` in a scratch repository with a staged `<credential-shaped example redacted>` line: with `SECRET_PATTERNS='devpassword=[A-Za-z0-9._%-]{4,}'` it refuses (rc 1); with `SECRET_PATTERNS='['` grep and sed print errors and the hook exits **0**.

### G2-I-01 (claude and gpt, I) -- the audit-packet path exemption removes the scan from a pushed path
**Seat's claim:** both hooks skip `docs/audits/*/seats/*.diff` by name on a comment's justification ("a verbatim copy of a range the guards have already read"), which nothing checks; a packet built from unpushed worktree branches, or a line appended to one, is never scanned.
**Checked:** `.githooks/pre-commit` (`grep -v -E '^docs/audits/[^/:]+/seats/[^/:]+\.diff: '`) and `.githooks/pre-push` (`case "$f" in docs/audits/*/seats/*.diff) continue`) as the seat says; this very audit's packets were built from branches that were merged, but the exemption cannot tell that.

### G2-I-10 (gpt, I) -- the rule's log-redaction example preserves the secret
**Seat's claim:** `engineering-practices.md`'s example `sed -E 's/((token|key|passw[a-z]*|psk|user)[=:][^ ]*)/\1***/Ig'` puts the value inside group 1 and prints it back with stars.
**Checked:** the line is in the rule; the proof runner found the same on 2026-09-28 (its `common.sh` carries the corrected form); the session's memory was corrected this morning, the rule was not.

_The blindspot screen's repeats (an agent's pre-screen of the 67 entries against the round's diffs, `/workspace/tmp/rocknix-session/blindspot-screen-fix-round.md`: 15 repeated, 32 avoided, 21 not relevant), the ones that survived the orchestrator's read:_

### BS-1 (blindspots 10, 35, 62; C) -- passwords already written to a persistent log stay on the card
**Screen's claim:** C stopped `cloud_remote` logging rclone's failure output with `pass=<password>` in it, but did nothing about lines already in `cloud_sync.log`; `/var/log` is persistent (D-SYS-001), so a device that ever had a failed `config create` keeps a plaintext cloud password.
**Checked:** `packages/sysutils/busybox/system.d/var-log.mount` binds `/var/log` to `/storage/.cache/log` (D-SYS-001, on by default); C's diff replaces `log("rclone %s failed (%d): %s" % (...))` with a line without the output; no scrub of the existing log anywhere (`grep -n 'scrub\|pass=' cloud_sync_helper` finds nothing).

### BS-2 (blindspots 12, 46; C x A) -- two readers of one file disagree on a duplicated key
**Screen's claim:** C's `conf_get` takes the last assignment; the automatic sync's duplicate cleanup keeps the first, so after a cleanup the scripts use the first while the hub's line named the last.
**Checked:** `cloud_setup:117` `value="$(grep "^$1=" ... | tail -n 1)"`; `cloud_sync_cleanup_duplicates.sh`'s header: "keeping only the first occurrence".

### BS-3 (blindspot 8, 43; B) -- the ZIP check passes a damaged stored member
**Screen's claim:** B's comment says busybox has no `-t` and that `unzip -p` verifies every member's CRC; both false on busybox 1.36.1.
**Checked by running it:** the image's own busybox (`build.ROCKNIX-GENERIC_X64.x86_64/image/system/usr/bin/busybox`, 1.36.1) on a ZIP with a damaged *stored* member: `unzip -t` rc 0, `unzip -p` rc 0; on a damaged *deflated* member: rc 1 and 1; the host's Info-ZIP reports both (rc 2 and 9).

### BS-4 (blindspot 39; D, C) -- skipped checks count as PASSED
**Screen's claim:** D adds 23 SKIP branches (a pinned tarball absent) and C one; the harness's verdict counts only FAILs.
**Checked:** `tools/last-good-scripts-test:10224`: `if [ "${FAIL}" -eq 0 ]; then echo "PASSED"`; a SKIP is printed and not counted; vm-qa run 69's scripts.log on the build host holds 0 SKIP lines (the pinned tarballs are there), so the hazard is a host without them, where the same run would read PASSED over 23 unrun checks.

### BS-5 (blindspots 50, 55; F1) -- the rehearsal's wait reads the previous boot's line
**Screen's claim:** `tools/vm-upgrade-rehearsal` waits for "Autostart complete" in `/var/log/boot.log`, which is appended and persistent, so the previous boot's line satisfies the wait at once and the "autostart finished" check cannot fail.
**Checked:** `tools/vm-upgrade-rehearsal:129-132`; `packages/sysutils/autostart/sources/autostart:7,10` appends (`>>`) to `/var/log/boot.log` and never truncates it; `/var/log` is persistent (BS-1).

### The Mediums (71), triaged: those that allege a defect in shipped behaviour, read or run by the orchestrator; the rest are test, harness, lint or documentation gaps and go to the punch list on the seat's evidence

| Finding | The seat's claim, in short | Orchestrator | Grade |
| --- | --- | --- | --- |
| G2-A-05 (claude, A) | the new grammar refuses shapes bash accepts and the old validator passed -- an escaped quote inside a double-quoted value | **ran it:** `RCLONEOPTS="--exclude \"*.tmp\" --progress"` in a conf, `conf_valid` rc 1; the shipped defaults carry none, a hand edit may | _(grade withheld)_ |
| G2-B-08 (gpt, B) | with an unreadable mount table the revert proceeds on the folder's parent existing | `chksysconfig:144-147`: `[ -d "$(dirname ...)" ] \|\| return 0; return 1` -- an existing parent reads as "not waiting" | **confirmed, Medium** -- the fallback fails open; it should wait |
| G2-B-10 (gpt, B) | the upstream-era move can replace an older archived ZIP of the same name | `backuptool:1479`: `mv -f "${OLD}" "${ARCHIVEFOLDER}/upstream-era/"` | _(grade withheld)_ |
| G2-E-core-04 (gpt, E-core) | the fallback that selects a backup requires only usable key-values, not a whole record | `AtomicFileUtil.cpp:308` computes `backupWhole`; `:370` selects on `backupOk && isUsableKeyValues(backup)` | _(grade withheld)_ |
| G2-E-app-02 (claude, E-app) / G2-E-app-03 (gpt) | the BIOS-only path writes the selection, ignores the result and calls `onDone()` without a press | `GuiMenu.cpp:4211-4215` | _(grade withheld)_ |
| G2-F2-01 (gpt, F2) | every `#elif` after a not-yet-taken branch is read as live whatever its expression | both generators' `preprocess`: `stack[-1] = 'gone' if stack[-1] in ('one','gone') else 'live'` on `elif`, so `#if 0 / #elif 0` reads live | _(grade withheld)_ |
| G2-E-app-01 (claude, E-app) | `runCopy` takes no lock and cannot wait on `transferGone` | `SaveStateBookkeeper.cpp:203` `runCopy` after the lock logic at 64-156; the lock is the delete's | _(grade withheld)_ |
| G2-E-app-01 (gpt, E-app) | a saved profile whose name equals the current SSID outranks the active profile | `WifiText.cpp:23,61` mark the active flag; the precedence is the picker's | _(grade withheld)_ |
| G2-D-02 (gpt, D) | when `games_made_ready` fails its callers substitute the number of cache operations | `raofflineproxy-ctl:1917,2220` set `ADDED`/`MADE` inside `&&` chains | _(grade withheld)_ |
| G2-C-03 (gpt, C) | the success path writes `signed-in` without honouring `superseded` | `cloud_oauth:506` `write_owned(self.attempt, status="signed-in")` -- the attempt id refuses a different attempt; a close without a new attempt is the gap | _(grade withheld)_ |
| G2-E-core-02, -03, -05, -06, -07 (gpt, E-core); G2-E-core-01 (claude) | the recovery overwrites without the lock; only the first save over a cut base is excluded; the mode on a failed restore; pending changes dropped when a load fails; a false conflict from `confMap`; a quoted string ending at the first enclosing byte | not read individually here | _(grade withheld)_ |
| G2-B-09, -11 (gpt, B); G2-B-02 (claude, B) | the seed manifest's unchecked read; persistence failures of the SSID/key pair; a device whose roms folder is never a mount point waits for ever | not read individually here | _(grade withheld)_ |
| G2-C-01 (claude, C); G2-C-01, -02 (gpt, C) | keystrokes before a focused field dropped and not resent; the reader's value forms; a backward status transition | not read | _(grade withheld)_ |
| G2-D-01 (gpt, D); G2-D-03 (gpt, D) | a GameId split at the 512-character prefix; the token check and the marker's removal not one operation | not read | _(grade withheld)_ |
| G2-F1-01..04 (gpt, F1) | migrations that stop on a stamp alone; the first run deleting any file at a listed path; ownership records from a generated value; a socket node as proof of an exited owner | not read; F1's part (a) decision is on record | _(grade withheld)_ |
| G2-A-02, -03, -06 (claude, A); G2-A-03, -04 (gpt, A) | a cut between the pointer write and the delete; two surfaces disagreeing on `69 gaps`; the lock held through the sealing walk; other assignment forms read as absent; an ignored plan-removal failure | not read individually; G2-A-02 is #309 PL-002's subject | _(grade withheld)_ |
| G2-I-04 (claude, I) | the harness under vm-qa runs with SIGPIPE ignored (Python's disposition survives `execv`) | the wrapper resets SIGINT only | _(grade withheld)_ |
| G2-I-02 (claude), G2-I-03 (gpt) | pre-commit's grep runs over `<path>: +<content>`, so a credential-shaped path is a hit | the awk labels the line with its path | _(grade withheld)_ |
| G2-I-05, -06 (claude); G2-I-05..09 (gpt) | the lint's bullet form, section boundary, seat attribution, id formats, the pattern file's load check | the lint's G2 gap fixed in this audit (its own tool); the rest | _(grade withheld)_ |
| the E-tests Mediums (claude 01-04; gpt 02, 04-09) | tests that cannot fail on half their claim, doubles that hide the queued-callback lifetime, an allocator-dependent oracle, a trust-boundary check that names the wrong remote, unchecked process creation in a driver | the seats' per-suite tables | **leads, Medium** -- the ES test suites; none blocks the candidate |


## The interaction audit (findings withheld)

### 3.5 Cross-system interaction audit

#### Interaction: the cloud scripts (A) x the interface's cards and pages (E2)
**State shared:** the `>>> why` sentences and the stamps' third field; the match plan file `/storage/.cache/cloud_sync/content-match-plan`.
**Wipe risk:** a sentence a script prints that the card's table lacks reads in English (the emitter-table unit test guards it); a plan used up by an apply that the page retries (E2 removed TRY AGAIN for a match).
**Test coverage:** PARTIAL -- the unit test over the emitter table; the walk's MATCH preview on the guest (A-pl001 PASS); the planless apply's why is in the table (ES `87b182fbe`).
**Finding:** _(withheld)_

#### Interaction: the proxy and its ctl (D) x the RetroAchievements cards (E2)
**State shared:** the scan's stamp tokens and counts (`added=`, `truncated=`, `cursor_saved=`), the index marker's token.
**Wipe risk:** a token the card does not know; a marker removed by an older top-up.
**Test coverage:** PARTIAL -- O-20; the runner's D-pl059 and D-pl013 on the guest.
**Finding:** _(withheld)_

#### Interaction: the settings file's lock (E1) x the scripts' lock (B)
**State shared:** `/tmp/.system.cfg.lock`, its `.reap` guard, the pid-only contents.
**Wipe risk:** a reap by one side of a live holder of the other.
**Test coverage:** TESTED on each side (the ES file tests; `tools/wait-lock-test`); the intersection (the interface holding while a script waits, and the reverse) is the runner's E1-pl024 (PASS on `1b0d233657`).
**Finding:** _(withheld)_

#### Interaction: `wifictl` (B) x the Wi-Fi picker (E1/E2)
**State shared:** the `saved` output the picker parses; the join's return read as an exit code.
**Wipe risk:** a column added to `saved` that the parser does not expect (B added `--ssid` as a separate form, `saved` unchanged); the join's answer type (E2's `5a37c7981` makes the old bool shape not compile).
**Test coverage:** PARTIAL -- the picker still reads `saved` (PL-003 on #309); the runner's E1-wifi on a stand-in wifictl (no adapter on the guest).
**Finding:** _(withheld)_

#### Interaction: the capture gate (E2) x `cloud_capture`'s lock (A, PL-067)
**State shared:** the capture's completion, which the gate waits on.
**Wipe risk:** a capture that never completes (A's lock held) holding every launch -- bounded by the 120 s hung rule (O-6).
**Test coverage:** the runner's E2-pl061 with a delayed capture (PASS); a capture blocked on A's lock is UNTESTED as such.
**Finding:** _(withheld)_

#### Interaction: the shared harness (`tools/last-good-scripts-test`) x every stream
**State shared:** one file, six appended blocks, two kept-both merges by hand, the integrator's fixture commit.
**Wipe risk:** a block's helper name colliding with another's; a merge that dropped a case.
**Test coverage:** TESTED -- the whole file PASSED after every merge (vm-qa 69 scripts suite 333 s, 844+ checks); the case counts per block are in the reports.
**Finding:** _(withheld)_

#### Interaction: the retired GENERIC_X64 quirks (F1) x a kept guest's state (the upgrade path)
**State shared:** the files the old quirks left under `/storage`; the take-back stamps.
**Wipe risk:** an owner's own drop-in removed (fixed: exact names); a downgrade rewriting the files (stated).
**Test coverage:** PARTIAL -- the harness's rehearsal seeds; the rehearsal itself could not run this round (the QA pair was in use) -- **an intersection the VM has not shown on `1b0d233657`**.
**Finding:** _(withheld)_

### 3.6 What's missing?

_(each with its search trail)_

- **The upgrade rehearsal on `1b0d233657`** -- `ls /workspace/artifacts/rocknix-images/qa-1b0d233657-*/` shows vm-qa run 69 only; the runner's row says the rehearsal takes the QA pair. Missing, and the coverage line above.
- **A second seat over the follow-ups** -- this audit.
- **The public docs** -- `documentation-accuracy.md`'s gate; #42 (pre-existing tracked scope).
- **Scripts for E1's follow-up proofs, three of E2's and the migration on WebDAV** -- the runner's "3 NOT RUN" (`proofs-307.md`); the migration's proof exists as harness cases (A31, A32 not constructible as root) and not on a guest.

### 3.6.5 Audit-prescription verification

Every confirmed High distilled to its shape and grepped for that shape across the tree (the commands quoted), each occurrence classified:

| Defect class (the High) | Grep | Site / Sibling / Adjacent | Verdict |
| --- | --- | --- | --- |
| A CR accepted as whitespace before a comment (G2-A-01 gpt) | `grep -n '\[ \\t\\r\]' projects/ROCKNIX/packages/network/rclone/sources/*` | Site `cloud_backup:1043`; Sibling `cloud_restore:1104`; Sibling `cloud_sync_helper:247`; **Adjacent `cloud_content_backup:128`, `cloud_content_restore:131`** (two copies the seat did not name) | FIX-NOW, all five |
| A reader that sources `cloud_sync.conf` without the validator (G2-B-01) | `grep -rn '\. /storage/.config/cloud_sync.conf' projects/ROCKNIX/packages` | Site `backuptool:42`; no sibling | FIX-NOW |
| A fallback that restores a copy on `-s` alone (G2-A-02) | `grep -rn 'elif \[ -s .*&& mv -f' .../rclone/sources .../rocknix/sources/scripts` | Site `cloud_backup:1170`; Sibling `cloud_restore:1231` | FIX-NOW, both |
| A scan whose pipeline failure reads as no match (G2-E-tests-01 / G2-I-02) | `grep -n 'head -5 \|\| true' .githooks/* ~/Development/.../qa-integration/.githooks/*` | Site distribution `pre-commit`, `pre-push`; **Adjacent the ES fork's `pre-commit:16`, `pre-push:149`** (the same pipeline) | FIX-NOW, all four |
| A path-keyed exemption from the scan (G2-I-01) | `grep -n 'seats/\*\.diff' .githooks/* (both repos)` | Site distribution `pre-push:211,228`, `pre-commit:20`; the ES fork has none | FIX-NOW |
| A masking example that keeps the value (G2-I-10) | `grep -rn '\\1\*\*\*' .claude/rules docs` | Site `engineering-practices.md:555`; no sibling (the memory was corrected this morning) | FIX-NOW |
| A raw string compare where a path compare was meant (G2-A-01 claude) | `grep -n '!= "/ROCKNIX' cloud_backup cloud_sync_helper cloud_setup` | Site `cloud_migrate_layout` (nine compares); no sibling elsewhere | FIX-NOW |
| An unchecked `mktemp` feeding a guard (G2-B-04) | `grep -n '=\$(mktemp)$' backuptool` | Site `backuptool:473` (`KEEP`); **Siblings 207, 650, 651, 652, 758, 775, 1093** (`ERR`, `FILELIST`, `SECRETLIST`, `SENDLIST`, `REGENERABLE`, `KEPT`, `SEEDED`, `MEMBERLIST`) | FIX-NOW: one checked helper for all nine |
| A control file the archive can overwrite (G2-B-06) | `grep -n RESTORE_MARK backuptool` against the skip lists | Site the marker; Adjacent the snapshot's own path (`SNAPSHOT`) -- a member of that name would overwrite the pre-restore copy | FIX-NOW, both |
| A value regex that cannot consume a leading space inside quotes (G2-B-07) | the `CREDENTIAL_KEYS` line | Site only | FIX-NOW |
| A fast-path detector narrower than the redactor (G2-B-02) | `passkey=` in `001-functions` | Site only | FIX-NOW |
| A path validator that ignores `.`/`..` (G2-C-04) | `syncpath_problem` | Site only; Adjacent none (`cloud_migrate_layout` normalises `${1%/}` but never sees a typed path) | FIX-NOW |
| An inner-quote test before the escape (G2-E-core-01) | `maskValueEnd` | Site only | FIX-NOW |
| A credential in a persistent log (BS-1) | `cloud_sync.log`; `/var/log` bind | Site `cloud_remote`'s old line; Adjacent every other script that once logged rclone's stderr (`log_message` of `rclone` output in `cloud_backup`/`cloud_restore` before PL-074) -- the one-time scrub covers the file whatever wrote it | FIX-NOW (the scrub) |

Verdict on the prescription check: **PARTIAL until the fixes land** -- every site is enumerated; the two content-script copies of the grammar and the ES fork's hooks were found by the grep and not by any seat.


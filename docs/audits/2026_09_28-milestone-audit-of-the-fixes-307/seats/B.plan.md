# Fix stream B: backuptool and the rocknix scripts -- audit #307 / #308 (D-WORKFLOW-054, D-WORKFLOW-055)
You are an Opus 5.5 subagent executing a plan this lane defined from a two-seat adversarial audit. Work only in your worktree, only in the files you own, run every item to an outcome, and return a report. Nothing you do reaches a device, a QA guest, an image build or the `next` branch: you deliver a branch, and the integrator builds.
## Your worktree and branch

- Worktree: `/workspace/repos/rocknix.worktrees/pl-b`, branch `feature/pl-b`, cut from `next`. `cd` there for everything; commit there. The primary checkouts (`/workspace/repos/rocknix` on `next`; the ES checkout `/home/max/Development/emulationstation-next.worktrees/qa-integration`) are read-only for you.
- The rules live in `/workspace/repos/rocknix/.claude/rules/` (read them from there; your ROCKNIX worktree carries the same copies). Open before you start: `engineering-practices.md` (§ Guards must fail closed, § Verify the artifact not the report, § A failure you find is yours to fix, § Before deleting a duplicate), `upgrade-and-install.md` (every fix answers what it does to what earlier builds already wrote), `working-principles.md` § Pre-flight, `packaging-and-patches.md`, and `rclone-cloud-sync.md` where your files are cloud scripts. Cite the decision-register rows your items name (`docs/decision-register.md`) rather than re-arguing them.
## The files you own (exclusive -- another stream owns everything else)

`projects/ROCKNIX/packages/rocknix/sources/scripts/` (`backuptool`, `wifictl`, `factoryreset`, `chksysconfig`, `rocknix-evidence`, and the others there), `projects/ROCKNIX/packages/rocknix/profile.d/001-functions` (`wait_lock`, `write_setting_line`, `set_setting`, the redaction), `projects/ROCKNIX/packages/sysutils/systemd/scripts/` (`userconfig-setup`, `post-update`), the `system.d` units under `projects/ROCKNIX/packages/` named by your rows; plus your block in `tools/last-good-scripts-test`. NOT the rclone package (A), NOT raofflineproxy (D), NOT GENERIC_X64 (F1).

If a fix genuinely needs a file outside this list, do not touch it: say so in the report under that item and leave the item open with the reason.
## How you prove a fix (scripts and recipes)

- `tools/last-good-scripts-test` (run from your worktree root: `./tools/last-good-scripts-test`; read its header first for how cases are written, how the image's busybox is used for the applets the device has, and how fixtures are made) is the harness. Add your cases at the END of the file in ONE block headed `# ---- audit #307, stream B ----` (other streams append their own blocks; the integrator merges). A case is written FIRST and seen to FAIL on the unfixed script -- paste the FAIL line in the report -- then the fix, then the whole suite PASS; quote the final PASS count.
- A recipe (`package.mk`) edit is followed by `tools/pkgcheck <package>`; quote its output. Late binding: toolchain and path variables only inside functions.
- A script that will run under busybox is tested through the image's busybox as the harness does; every external command you add is one the device has (`command -v` in the guest's busybox list in `generic-x64-vm-testing.md` § What the guest's busybox lacks, or a package dependency).
- Every word a player reads (a `>>> why` line, a console line) follows `es-player-text.md` § Outcome vocabulary: `COMPLETED`, `COULDN'T FINISH - <why>`, `SKIPPED - <reason>`, everyday register, no exit codes or paths on a screen.
## Commits

One commit per punch item (a sweep group may share one). Title `<package or script>: <text>` under 72 characters, no spaces before the colon; a blank line; a body that names the item (`#307 PL-NNN`) and the finding, says what the test case is, and carries the `Already written:` line -- how the fix treats what earlier builds already wrote on a device (D-WORKFLOW-050; "nothing is written" is an acceptable answer when true). End every commit message with:

```
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Never `--no-verify`, never a bare `git stash`, never edit a shell script while a run of it is in flight (the harness reads scripts by offset).

## The punch items (the contract; each has the verdict it was read from, with lines)
## PL-003: The saved-network join stores nmcli's escaped passphrase
- **Severity:** High
- **Category:** Correctness (target tool)
- **Source Finding:** F-WF-02 (gpt)
- **Owner area:** wifictl
- **Where:** projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:261-263
- **What:** `nmcli -s -g 802-11-wireless-security.psk` escapes `:` and `\` (confirmed on guest d: `ab\:cd\\ef12345` for `ab:cd\ef12345`) and the value is written to `wifi.key` as is. Fix: `--escape no` (or `nm_unescape`, which the name paths already use), and the exit status checked before `set_setting`.
- **Acceptance:** `tools/last-good-scripts-test` case: a PSK with `:` and `\` round-trips through join and read back byte for byte; on the guest, `get_setting wifi.key` after a join equals the value typed
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-WF-02 (gpt, 2-wifi) -- the saved-network join stores nmcli's escaped passphrase
**Seat's claim:** `join_wifi` reads `nmcli -s -g 802-11-wireless-security.psk connection show id <name>` and writes it to `wifi.key` as is; nmcli's terse/get-values output escapes `:` and `\`, so a passphrase with either is stored altered.
**Checked:** `wifictl:261-263` is as the seat says, with no `--escape no` and no `nm_unescape` on the psk path (the name paths use `nm_unescape`). Whether `-g` with a single field escapes the value is the target tool's behaviour: **to be run on the guest** (`nmcli connection add type wifi ... psk 'a:b'` then the same `-g` read) once proof-298 frees guest d.
**Run on guest d (2026-09-27 23:52 UTC, build `7911c53bb4`):** `nmcli connection add type wifi ... wifi-sec.psk 'ab:cd\ef12345'`, then `nmcli -s -g 802-11-wireless-security.psk connection show qa-esc` printed `ab\:cd\\ef12345`; `--escape no` printed the value as typed; the test connection was deleted afterwards. So `-g` escapes `:` and `\` exactly as the seat said, and `wifictl:261-263` stores the escaped form.
**Verdict:** **High stands, confirmed on the target's own nmcli.** Fix: `--escape no` (or `nm_unescape`) on that read, and the exit status checked before `set_setting`.
</details>
## PL-004: An unquoted array expansion drops every backed-up path that contains a space
- **Severity:** High
- **Category:** Guards fail closed (data loss)
- **Source Finding:** F-BR-01 (claude)
- **Owner area:** backuptool
- **Where:** projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool (the location arrays)
- **What:** The location list is expanded unquoted into `zip`/`find`, so a path with a space becomes two paths that do not exist and the archive is written short, exit 0. Fix: `"${LOCATIONS[@]}"` everywhere the arrays reach a command; the archive's member count asserted against the walk's.
- **Acceptance:** a location named `my games/` is in the archive; the scripts test constructs it and fails the unfixed script
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-BR-01 (claude, 4-backup-restore) -- an unquoted array expansion drops every backed-up path with a space
**Checked:** `backuptool:193, 198, 201` copy the location arrays unquoted (`COMPRESSLOCATIONS=(${LOCATIONS[@]})`, `(${DEFAULT[@]})`) and `:298` runs `find ${COMPRESSLOCATIONS[@]} -type f 2>/dev/null` -- a path with a space splits, `find` errors into `/dev/null`, its status is never read, and the archive lists back whole and reports `SETTINGS BACKED UP TO THIS DEVICE.` A custom collection named with a space (`custom-Best Games.cfg` under `collections/`, a path the tool now backs up) is the failing input.
**Verdict:** survived -- **High** stands (the project's signature failure: success reported over a loss; `engineering-practices.md` § Guards must fail closed). Fix: quote the expansions (`"${LOCATIONS[@]}"`, `"${COMPRESSLOCATIONS[@]}"`), read `find`'s status, and add a fixture with a space to `tools/last-good-scripts-test`'s backuptool cases.
### F-BR-01 (gpt, 4-backup-restore) -- the pre-restore snapshot covers the device's selection, not the archive's members
**Checked:** `backuptool:627-629` writes the snapshot with `write_archive "${SNAPSHOT}" 0` over the device's own `COMPRESSLOCATIONS`; `:714` rolls back with `tar -xzf "${SNAPSHOT}" -C /` and `:718` then says `YOUR SETTINGS ARE UNCHANGED`. An archive made under a broader `LOCATIONS` than the restoring device's overwrites files outside the snapshot, and a failed extraction leaves them overwritten while the message says unchanged; files the archive created are never removed.
**Verdict:** survived at **High** (a false "unchanged" over a partial restore; the path needs a mismatched selection and a mid-way failure, so uncommon): snapshot from the incoming archive's member list (`tar -tzf`, intersected with what exists), record the members that did not exist, and remove them on rollback.
</details>
## PL-005: The credential scan warns and the backup still exits 0; detected credentials do not block publication
- **Severity:** High
- **Category:** Credentials
- **Source Finding:** F-BR-02 (claude) + F-BR-04 (gpt)
- **Owner area:** backuptool
- **Where:** backuptool (the credential scan and the publish step)
- **What:** Both seats: the scan runs on the `.partial` archive, logs a WARN and the run continues to rename and, with `--then-cloud`, upload. Fix: a positive detection ends the run with `COULDN'T FINISH - A SIGN-IN WAS FOUND IN THE BACKUP` before the rename, the partial removed.
- **Acceptance:** a settings tree seeded with a `pass =` line produces no archive and the outcome line; `tools/last-good-scripts-test` case
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-BR-02 (claude, 4-backup-restore) -- the credential scan warns and the backup still exits 0
**Checked:** after `LEAKS -gt 0` the branch prints the yellow `WARN`, `logger`s it, then runs `sync`, `note "SETTINGS BACKED UP TO THIS DEVICE."` and the second note, and falls off the case with status 0. The settings tier's chain (`backuptool backup && cloud_backup --system-only`) then uploads the archive; the interface discards this tool's console output, so the only trace is a journal line.
**Verdict:** survived -- **High** (a credential leaving the device, D-INFRA-006's rule applied to the cloud): a hit ends the run with a distinct exit code and a `>>> why` line in the outcome vocabulary (`COULDN'T FINISH - THIS BACKUP HOLDS WHAT LOOKS LIKE A PASSWORD OR KEY`), the archive renamed aside (`.held`) so no `.tar.gz` glob sends it, and the chain stops on the status.
### F-BR-02 (gpt, 4-backup-restore) -- a broad custom selection nests the backup directory's own credential-bearing snapshots
**Checked:** nothing in `write_archive` excludes `${SETTINGS_BACKUPS}` (`/storage/roms/backup`) or `${ARCHIVEFOLDER}`; the prune list is the regenerable set and the `SKIP` list is PPSSPP's assets and cache plus the RetroAchievements token files. The defaults (`DEFAULT=`) never select the backup directory, so the default run is safe; a custom `LOCATIONS=(/storage)` or `(/storage/roms)` collects `archive/*-PRE_RESTORE-*.tar.gz` (written with `STRIP=0`, keys inside) into a cloud-eligible archive, and the leak scan reads only `.cfg|.conf|.ini` members.
**Verdict:** survived at **High** (a credential leaving the device under a configuration the tool documents as supported): exclude `${SETTINGS_BACKUPS}` from every selection, unconditionally, and refuse a selection that contains it.
### F-BR-04 (gpt, 4-backup-restore) -- detected credentials do not block publication
**Checked:** the same branch as the Claude seat's F-BR-02 (above); the GPT seat adds that the scan runs after the `.partial` rename, so the archive is already under the name the globs match when the warning prints.
**Verdict:** survived, **High**, both seats: the scan runs on the `.partial` before the rename, and a hit renames it aside instead of publishing (with the exit code and the `>>> why` line).
</details>
## PL-006: The credential scan's prefix class admits no capital, so `Password=` and `TOKEN=` pass under a custom `LOCATIONS`
- **Severity:** High
- **Category:** Credentials
- **Source Finding:** F-BR-03 (claude)
- **Owner area:** backuptool
- **Where:** backuptool (the scan's prefix class)
- **What:** The default set is covered by name; a custom location's files are scanned with a lowercase-only class. Fix: a case-insensitive match (`grep -i`) and the class widened to the shapes `.githooks/pre-push` already carries.
- **Acceptance:** `Password=<long literal>` in a custom location is caught; the scripts test covers it
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-BR-03 (claude, 4-backup-restore) -- the credential scan's prefix class admits no capital
**Checked:** the scan's regex (`backuptool`, the `LEAKS=$(find ...)` line) anchors on `^(([a-z_.]*[_.])?(password|passwd|pass|token|secret|...)[0-9]*|key|[a-z_.]*\.key|Token|ApiToken|RA_Token|RA_Password) *[=:]`; a `PrivateKey = ...`, `PresharedKey = ...` or `ClientSecret=` line in a file under a custom `LOCATIONS` is neither stripped nor counted. The comment says case-sensitivity is deliberate (a catalogue's `Password = Пароль` must not warn); the cost is a class of real keys.
**Verdict:** survived at **High** for a custom `LOCATIONS` (the default set is covered by the named strips): match the key word case-insensitively, and keep the translation catalogues out by path (`locale/`, `*.po`, `*.lang`) rather than by case, which is what the case-sensitivity was protecting.
### F-BR-03 (gpt, 4-backup-restore) -- an empty custom selection, or a path spelled with `/.`, escapes the policy
**Checked:** `backuptool:193` takes `LOCATIONS` from the sourced conf as is; an empty `LOCATIONS=()` leaves `COMPRESSLOCATIONS` empty and `:298`'s `find ${COMPRESSLOCATIONS[@]} -type f` then walks the working directory -- the whole filesystem from `/`, reported as a success. The `/storage/.config/.` spelling defeats the exact-path membership of the token files (`grep -qxF`), a contrived input.
**Verdict:** survived at **Medium**: a selection that is empty after sourcing falls back to `DEFAULT` with the existing warning, and every location is canonicalised (`readlink -f`) before the membership checks.
</details>
## PL-007: The pre-restore snapshot covers the device's selection, not the archive's members
- **Severity:** High
- **Category:** Correctness
- **Source Finding:** F-BR-01 (gpt)
- **Owner area:** backuptool
- **Where:** backuptool (the pre-restore snapshot)
- **What:** The snapshot taken before a restore walks the device's `LOCATIONS`, so a member of the archive outside that set is replaced with nothing kept; the rollback then reports the device unchanged. Fix: snapshot the archive's member list (the paths `unzip -l` prints) intersected with what exists on the device.
- **Acceptance:** restoring an archive with a member outside `LOCATIONS` and rolling back restores the original file
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-BR-01 (claude, 4-backup-restore) -- an unquoted array expansion drops every backed-up path with a space
**Checked:** `backuptool:193, 198, 201` copy the location arrays unquoted (`COMPRESSLOCATIONS=(${LOCATIONS[@]})`, `(${DEFAULT[@]})`) and `:298` runs `find ${COMPRESSLOCATIONS[@]} -type f 2>/dev/null` -- a path with a space splits, `find` errors into `/dev/null`, its status is never read, and the archive lists back whole and reports `SETTINGS BACKED UP TO THIS DEVICE.` A custom collection named with a space (`custom-Best Games.cfg` under `collections/`, a path the tool now backs up) is the failing input.
**Verdict:** survived -- **High** stands (the project's signature failure: success reported over a loss; `engineering-practices.md` § Guards must fail closed). Fix: quote the expansions (`"${LOCATIONS[@]}"`, `"${COMPRESSLOCATIONS[@]}"`), read `find`'s status, and add a fixture with a space to `tools/last-good-scripts-test`'s backuptool cases.
### F-BR-01 (gpt, 4-backup-restore) -- the pre-restore snapshot covers the device's selection, not the archive's members
**Checked:** `backuptool:627-629` writes the snapshot with `write_archive "${SNAPSHOT}" 0` over the device's own `COMPRESSLOCATIONS`; `:714` rolls back with `tar -xzf "${SNAPSHOT}" -C /` and `:718` then says `YOUR SETTINGS ARE UNCHANGED`. An archive made under a broader `LOCATIONS` than the restoring device's overwrites files outside the snapshot, and a failed extraction leaves them overwritten while the message says unchanged; files the archive created are never removed.
**Verdict:** survived at **High** (a false "unchanged" over a partial restore; the path needs a mismatched selection and a mid-way failure, so uncommon): snapshot from the incoming archive's member list (`tar -tzf`, intersected with what exists), record the members that did not exist, and remove them on rollback.
</details>
## PL-008: A broad custom selection nests the backup directory's own credential-bearing snapshots into the archive
- **Severity:** High
- **Category:** Credentials
- **Source Finding:** F-BR-02 (gpt)
- **Owner area:** backuptool
- **Where:** backuptool (custom `LOCATIONS` and the backup directory)
- **What:** A `LOCATIONS` entry that contains the backup directory pulls the previous snapshots (which carry `rclone.conf`) into the new archive. Fix: the backup directory and the snapshot directory are excluded unconditionally, whatever the selection.
- **Acceptance:** an archive made with `LOCATIONS=/storage/.config` holds no member under the backup directory
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-BR-02 (claude, 4-backup-restore) -- the credential scan warns and the backup still exits 0
**Checked:** after `LEAKS -gt 0` the branch prints the yellow `WARN`, `logger`s it, then runs `sync`, `note "SETTINGS BACKED UP TO THIS DEVICE."` and the second note, and falls off the case with status 0. The settings tier's chain (`backuptool backup && cloud_backup --system-only`) then uploads the archive; the interface discards this tool's console output, so the only trace is a journal line.
**Verdict:** survived -- **High** (a credential leaving the device, D-INFRA-006's rule applied to the cloud): a hit ends the run with a distinct exit code and a `>>> why` line in the outcome vocabulary (`COULDN'T FINISH - THIS BACKUP HOLDS WHAT LOOKS LIKE A PASSWORD OR KEY`), the archive renamed aside (`.held`) so no `.tar.gz` glob sends it, and the chain stops on the status.
### F-BR-02 (gpt, 4-backup-restore) -- a broad custom selection nests the backup directory's own credential-bearing snapshots
**Checked:** nothing in `write_archive` excludes `${SETTINGS_BACKUPS}` (`/storage/roms/backup`) or `${ARCHIVEFOLDER}`; the prune list is the regenerable set and the `SKIP` list is PPSSPP's assets and cache plus the RetroAchievements token files. The defaults (`DEFAULT=`) never select the backup directory, so the default run is safe; a custom `LOCATIONS=(/storage)` or `(/storage/roms)` collects `archive/*-PRE_RESTORE-*.tar.gz` (written with `STRIP=0`, keys inside) into a cloud-eligible archive, and the leak scan reads only `.cfg|.conf|.ini` members.
**Verdict:** survived at **High** (a credential leaving the device under a configuration the tool documents as supported): exclude `${SETTINGS_BACKUPS}` from every selection, unconditionally, and refuse a selection that contains it.
</details>
## PL-009: A failed snapshot collection reads as an empty device
- **Severity:** High
- **Category:** Guards fail closed
- **Source Finding:** F-BR-05 (gpt)
- **Owner area:** backuptool
- **Where:** backuptool (the snapshot collector)
- **What:** The collector's failure is indistinguishable from nothing to collect, so a restore proceeds with no rollback record. Fix: a distinct return code for "nothing to collect"; any other failure ends the restore before it writes.
- **Acceptance:** a collector made to fail (an unreadable location) aborts the restore with the outcome line; the scripts test covers it
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-BR-05 (gpt, 4-backup-restore) -- a failed snapshot reads as an empty device
**Checked:** `write_archive` returns 2 on the pipeline error (`:333`), on a failed prune (`:358`) and when nothing was collected (`:457`); the restore's `case` (`:630-636`) treats every 2 as "nothing on the device to keep", clears the snapshot and goes on to extract with no rollback. A settings tree that exists but could not be staged is destroyed without a copy.
**Verdict:** survived -- **High**: a distinct return code for "nothing to collect" (or a positive check that the selection is empty) so that a failure keeps `fail "COULDN'T KEEP A COPY ..."`.
</details>
## PL-010: A legacy restore overwrites the device's cloud identity
- **Severity:** High
- **Category:** Upgrade path
- **Source Finding:** F-BR-12 (gpt)
- **Owner area:** backuptool
- **Where:** backuptool (the legacy restore's exclusions)
- **What:** Restoring an archive from the old format writes `storage/.config/rclone/rclone.conf` over the device's own, so two devices end up as one identity in the cloud. Fix: add the rclone config (and `cloud_device_id`'s record) to both exclusion lists, the legacy path included.
- **Acceptance:** a legacy archive carrying an `rclone.conf` leaves the device's untouched; the scripts test covers it
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-BR-12 (gpt, 4-backup-restore) -- a legacy restore overwrites the device's cloud identity
**Checked:** `write_archive` holds `rclone.conf` back from every new archive (`backuptool:282, 367, 381`); neither restore branch excludes it -- the tar branch's `SKIP` (`:675`) and the zip branch's (`:692`) carry PPSSPP's assets and cache and the RetroAchievements token files only. An archive from before the hold-back, or from another device, puts its `rclone.conf` over the current one and the restore reports success. `upgrade-and-install.md` § Fixing forward is not enough, exactly.
**Verdict:** survived -- **High**: add `storage/.config/rclone/rclone.conf` to both `SKIP` lists (the restore side of the fix the backup side already has).
</details>
## PL-011: A failed settings write returns success
- **Severity:** High
- **Category:** Guards fail closed
- **Source Finding:** F-PB-08 (gpt)
- **Owner area:** rocknix scripts (settings)
- **Where:** projects/ROCKNIX/packages/rocknix/sources/scripts (`write_setting_line`)
- **What:** `write_setting_line`'s failure branch ends in `rm -f` of the temporary and returns 0, so `set_setting` reports a value it did not write. Fix: return non-zero from the failure branch and let `set_setting` say so.
- **Acceptance:** `set_setting` on a read-only file exits non-zero; the scripts test covers it
<details><summary>The audit's verdict(s) this item rests on</summary>
- **F-PB-08** (a failed settings write returns success): `write_setting_line`'s failure branch ends in `rm -f "${J_CONF}.tmp"` (the function's status is the `rm`'s), and `set_setting` ends in `rm -f "${J_CONF_LOCK}"` after it (`:337-338`); an `awk` that fails on a full disk reports 0 to every caller. **Survived, High** (success reported over a failure; `engineering-practices.md` § Guards must fail closed): capture the writer's status and return it through both layers.
</details>
## PL-031: The saved-network join reports success on the wrong interface
- **Severity:** Medium
- **Category:** Correctness
- **Source Finding:** F-WF-01 (gpt)
- **Owner area:** wifictl
- **Where:** wifictl:181-196
- **What:** The join's success test reads the first active connection, not the interface it joined on. Fix: test the named device's state.
- **Acceptance:** the scripts test: a join with another interface up reports the joined one's state
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-WF-01 (gpt, 2-wifi) -- the join reports success on the wrong interface
**Seat's claim:** `saved_wifi` enumerates every profile and `connection up id <name>` names no interface, so a profile active on another adapter reads as joined while `WIFI_DEV` is on a different network.
**Checked:** `join_wifi:252-267` as described; `current_wifi` scopes to `ifname "${WIFI_DEV}"`, the join does not. The scenario needs two wireless adapters; every target handheld has one, and the VM has one.
**Verdict:** survived at **Medium** (down from High: not a common path on a handheld; a USB adapter makes it real). Fix as the seat says: `ifname "${WIFI_DEV}"` on `connection up`, and the active state read for that interface before `joined`.
</details>
## PL-035: An empty custom selection, or a path spelled with `/.`, escapes the policy's exclusions
- **Severity:** Medium
- **Category:** Credentials
- **Source Finding:** F-BR-03 (gpt)
- **Owner area:** backuptool
- **Where:** backuptool (custom location spelling)
- **What:** The exclusions match spellings, not resolved paths. Fix: normalise each location with `readlink -f` before matching, refuse an empty entry.
- **Acceptance:** the scripts test: `/storage/./.config` is excluded like `/storage/.config`
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-BR-03 (claude, 4-backup-restore) -- the credential scan's prefix class admits no capital
**Checked:** the scan's regex (`backuptool`, the `LEAKS=$(find ...)` line) anchors on `^(([a-z_.]*[_.])?(password|passwd|pass|token|secret|...)[0-9]*|key|[a-z_.]*\.key|Token|ApiToken|RA_Token|RA_Password) *[=:]`; a `PrivateKey = ...`, `PresharedKey = ...` or `ClientSecret=` line in a file under a custom `LOCATIONS` is neither stripped nor counted. The comment says case-sensitivity is deliberate (a catalogue's `Password = Пароль` must not warn); the cost is a class of real keys.
**Verdict:** survived at **High** for a custom `LOCATIONS` (the default set is covered by the named strips): match the key word case-insensitively, and keep the translation catalogues out by path (`locale/`, `*.po`, `*.lang`) rather than by case, which is what the case-sensitivity was protecting.
### F-BR-03 (gpt, 4-backup-restore) -- an empty custom selection, or a path spelled with `/.`, escapes the policy
**Checked:** `backuptool:193` takes `LOCATIONS` from the sourced conf as is; an empty `LOCATIONS=()` leaves `COMPRESSLOCATIONS` empty and `:298`'s `find ${COMPRESSLOCATIONS[@]} -type f` then walks the working directory -- the whole filesystem from `/`, reported as a success. The `/storage/.config/.` spelling defeats the exact-path membership of the token files (`grep -qxF`), a contrived input.
**Verdict:** survived at **Medium**: a selection that is empty after sourcing falls back to `DEFAULT` with the existing warning, and every location is canonicalised (`readlink -f`) before the membership checks.
</details>
## PL-036: Unchecked collection errors, and whitespace lost in the legacy inspection
- **Severity:** Medium
- **Category:** Correctness
- **Source Finding:** F-BR-06 / F-BR-07 (gpt)
- **Owner area:** backuptool
- **Where:** backuptool (collection; the legacy inspection)
- **What:** A collection error can produce a partial backup marked complete; the legacy inspection splits on whitespace. Fix: check the collector's status; read the listing with `-print0`/`IFS=`.
- **Acceptance:** the scripts test covers a member with a space in the legacy path
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-BR-06 / F-BR-07 (gpt, 4-backup-restore) -- unchecked collection; whitespace lost in the legacy inspection
**Checked:** `find`'s status is ignored (`:298`, as in F-BR-01) and the sanitising `sed`/`grep` writes have no status checks; the zip branch's `for ENTRY in $(unzip -l ... | awk '{print $4}')` (`:694`) truncates a member name at its first space, so a symlinked path with a space is not skipped and busybox unzip aborts the restore this branch was written to save.
**Verdict:** survived at **Medium** each; F-BR-07's first half is F-BR-01 (High) and is fixed with it.
</details>
## PL-037: Seed pruning leaves an edited file on restore
- **Severity:** Medium
- **Category:** Upgrade path
- **Source Finding:** F-BR-08 (gpt)
- **Owner area:** backuptool
- **Where:** backuptool (seed pruning)
- **What:** A file pruned as identical to its seed at backup time is not restored over a later edit. Fix: record pruned names in the archive and restore them by copying the seed.
- **Acceptance:** the scripts test: an edited `es_settings.cfg` after a backup that pruned it is reset on restore
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-BR-08 (gpt, 4-backup-restore) -- seed pruning leaves an edited file on restore
**Checked:** `:341` skips a file equal to the image's seed (`cmp -s "/usr/config/${REL}" "${F}"`); a later restore extracts only the archive's members, so a file edited since the backup is not put back to the seed the backup represented. The tool says the settings were restored.
**Verdict:** survived at **Medium** (a design choice with a wrong edge; the regenerable set is the OS's, a seed-equal player file is not): record the seed-equal paths in the archive (a manifest member) and reset them on restore, or say in the outcome that unchanged-from-default files were not touched.
</details>
## PL-038: A custom location outside `/storage` is dropped silently
- **Severity:** Medium
- **Category:** Least surprise
- **Source Finding:** F-BR-09 (gpt)
- **Owner area:** backuptool
- **Where:** backuptool (custom locations)
- **What:** Fix: refuse it with the reason on the console flow.
- **Acceptance:** the scripts test: `/flash/x` in `LOCATIONS` ends with the refusal line
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-BR-09 (gpt, 4-backup-restore) -- a custom location outside `/storage` is dropped silently
**Checked:** the archive is written from the staging tree's `storage` subtree only (`tar -czf "${TARGET}.partial" -C "${STAGING}" storage`); the conf's own example allows `/some/other/folder/file.name*`.
**Verdict:** survived at **Medium**: refuse (with the warning) a location outside `/storage`, or stage the whole selection.
</details>
## PL-039: The restore mark's write is unchecked
- **Severity:** Medium
- **Category:** Guards fail closed
- **Source Finding:** F-BR-11 (gpt)
- **Owner area:** backuptool
- **Where:** backuptool (the restore mark)
- **What:** Fix: check the write and say so before the restart.
- **Acceptance:** the scripts test: an unwritable mark path ends the restore before the restart
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-BR-11 (gpt) -- the restore mark's write is unchecked
**Checked:** `printf ... > "${RESTORE_MARK}.tmp" && mv -f ...` (`:652`) with no failure branch; the extraction proceeds without the mark.
**Verdict:** survived at **Medium**: the mark's write is a precondition of the extraction (fail with the "couldn't keep a copy" message).
</details>
## PL-040: The redaction misses a value starting with `&` or `;`
- **Severity:** Medium
- **Category:** Credentials
- **Source Finding:** F-PB-01 (gpt)
- **Owner area:** rocknix-evidence (redaction)
- **Where:** projects/ROCKNIX/packages/rocknix/sources/scripts/001-functions:79
- **What:** Fix: widen the unquoted-value class.
- **Acceptance:** the redaction test covers `&y=KEY` at a value's start
<details><summary>The audit's verdict(s) this item rests on</summary>
- **F-PB-01** (redaction misses a value starting with `&` or `;`): `001-functions:79`'s unquoted-value class `[^[:space:]"'&;]+` consumes nothing when the value begins with one of them. **Survived, Medium** (an uncommon password shape; fix the class to allow a leading `&;` or match `[^[:space:]"']+`).
</details>
## PL-041: Two waiters can remove each other's stale lock, and the PID write's result is ignored
- **Severity:** Medium
- **Category:** Concurrency
- **Source Finding:** F-PB-02 (gpt) + F-ES-06 (gpt, 8b)
- **Owner area:** wait_lock / AtomicFileUtil PidLock
- **Where:** 001-functions `wait_lock`:221; es-core/src/utils/AtomicFileUtil.cpp:161, 213-214
- **What:** Both lock implementations re-read then unlink in two steps. Fix: `O_EXCL` on a rename-in of the PID; the lock carries its PID before it is visible.
- **Acceptance:** `tools/wait-lock-test` and an ES unit test with two contenders on a stale lock
**Your half of PL-041 is `wait_lock` in `001-functions` only;** the PidLock half (AtomicFileUtil.cpp) is stream E1's.
<details><summary>The audit's verdict(s) this item rests on</summary>
- **F-PB-02** (two waiters can remove each other's lock): `wait_lock` re-reads the holder before `rm -f` (`:221`) and the trap removes only its own pid's lock; a window between the re-read and the `rm` remains. **Survived, Medium** (two waiters on one stale lock within microseconds): replace the read-then-remove with an atomic rename of the stale lock aside.
### F-PB-02 / F-PB-03 (claude, 10-packages-and-build) -- the QEMU quirk scripts write to read-only paths
**Checked on guest d, 23:53 UTC:** `/etc` is on the read-only squashfs and `/etc/systemd/system` does not exist; the journal records `Read-only file system` from `097-disable-rescue-completely` (lines 20 and 33) and from `mkdir /etc/systemd/journald.conf.d`; `systemd-hostnamed.service` runs from `/usr/lib` with no drop-in. Every `mkdir -p /etc/...` and `cat <<EOF >/etc/...` in 093 and 094 fails the same way, silently but for the journal. **Survived, High as filed**: the whole 091-101 set is inert where it writes under `/etc`, so the VM image has been booting on the units as shipped, and the scripts' claims (F-VM-04/05, F-PB-04/05/06 on the gpt side) describe files that never exist. Fix: remove the set (D-UI-079's lane question does not arise -- these are fork-only files), keep only what writes under `/storage` or `/run` and is proven needed by a boot without it.
### F-ES-06 (gpt, 8b-es-core) -- the stale-lock cleanup can remove a new owner's lock
**Checked:** `AtomicFileUtil.cpp:213-214` re-reads and unlinks in two steps, `:161` discards the PID write's result. The same defect as the gpt seat's F-PB-02 on `wait_lock` (verified Medium above). **Survived, Medium**: `O_EXCL` on a rename-in of the PID, and a lock file that carries the PID before it is visible.
</details>
## PL-044: `rm -rf` unchecked before `cp -rf`
- **Severity:** Medium
- **Category:** Guards fail closed
- **Source Finding:** F-PB-09 (gpt)
- **Owner area:** factoryreset
- **Where:** factoryreset:55-56
- **What:** Fix: check each step and stop.
- **Acceptance:** the scripts test: a failing `rm` does not reach the `cp`
<details><summary>The audit's verdict(s) this item rests on</summary>
- **F-PB-09** (`factoryreset`'s `rm -rf` unchecked before `cp -rf`): `factoryreset:55-56`; a destination that survives the `rm` gets the defaults nested inside it and the reset reports success. **Survived, Medium**: `remove_checked` exists in the same script; use it.
</details>
## PL-045: The restore marker is consumed when the snapshot's folder exists unmounted
- **Severity:** Medium
- **Category:** Correctness
- **Source Finding:** F-PB-10 (gpt)
- **Owner area:** chksysconfig
- **Where:** chksysconfig (`finish_restore`)
- **What:** Fix: test the mount, not the directory.
- **Acceptance:** the scripts test: an unmounted folder leaves the marker
<details><summary>The audit's verdict(s) this item rests on</summary>
- **F-PB-10** (`finish_restore` consumes the marker when the snapshot's folder exists unmounted): `chksysconfig:113-127` defers only on `! -d "$(dirname snap)"`; a parent directory present on the internal tree while the volume is not mounted reads as "missing or damaged" and the marker is removed. **Survived, Medium** (the parent must exist internally): test the mount (`mountpoint -q` on the backups' volume) rather than the directory.
</details>
## PL-046: A filtered file is counted when the `mv` fails
- **Severity:** Medium
- **Category:** Guards fail closed
- **Source Finding:** F-PB-13 (gpt)
- **Owner area:** rocknix-evidence
- **Where:** rocknix-evidence:112
- **What:** Fix: count on the `mv`'s success.
- **Acceptance:** the evidence test: a failing `mv` is not counted
<details><summary>The audit's verdict(s) this item rests on</summary>
- **F-PB-13** (`rocknix-evidence` counts a filtered file when the `mv` fails): `rocknix-evidence:112` is `mv -f ...; FILTERED=$((FILTERED + 1))` unchecked and `filter_tree` returns 0. A rename in one directory failing is rare; the bundle would then say filtered over a raw log. **Survived, Medium**: check the `mv`, and refuse the archive when any file is neither filtered nor removed.
</details>
## PL-077: Same-second concurrent runs share names
- **Severity:** Low
- **Category:** Concurrency
- **Source Finding:** F-BR-10 (gpt) + F-PB-03 (gpt)
- **Owner area:** backuptool / rocknix-evidence
- **Where:** the same-second names
- **What:** Fix: `mktemp`-style staging.
- **Acceptance:** two runs in one second leave two archives
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-BR-10 (gpt) -- same-second concurrent runs share names
**Verdict:** **Low**: the interface runs one chain at a time and the cloud lock serialises the cloud runs; two manual backups in one second is the only path. A lock file costs one line and is worth it.
- **F-PB-03** (same-second evidence collections share a staging directory): **Low**, contrived; a `mktemp -d` staging costs one line.
### F-PB-02 / F-PB-03 (claude, 10-packages-and-build) -- the QEMU quirk scripts write to read-only paths
**Checked on guest d, 23:53 UTC:** `/etc` is on the read-only squashfs and `/etc/systemd/system` does not exist; the journal records `Read-only file system` from `097-disable-rescue-completely` (lines 20 and 33) and from `mkdir /etc/systemd/journald.conf.d`; `systemd-hostnamed.service` runs from `/usr/lib` with no drop-in. Every `mkdir -p /etc/...` and `cat <<EOF >/etc/...` in 093 and 094 fails the same way, silently but for the journal. **Survived, High as filed**: the whole 091-101 set is inert where it writes under `/etc`, so the VM image has been booting on the units as shipped, and the scripts' claims (F-VM-04/05, F-PB-04/05/06 on the gpt side) describe files that never exist. Fix: remove the set (D-UI-079's lane question does not arise -- these are fork-only files), keep only what writes under `/storage` or `/run` and is proven needed by a boot without it.
</details>
## The sweep rows (#308): the seats' Mediums and Lows in your files, 49 rows

Every row gets a verdict. For each: read the seat's full finding in `/workspace/repos/rocknix/docs/audits/2026_09_25-milestone-rc-round-since-258/seats/<packet>-<seat>.md` under its id; read the code it names; then either **fix** it (the same proof rule: a case first where a case can exist, a commit naming `#308 <packet> <seat> <id>`) or **withdraw** it with one honest line (refuted with the line that refutes it; a duplicate of a punch item -- name it; fork-only prose or upstream fit for the PR-prep pass #256; not in your files -- name the stream). Do not skip a row and do not fix by description: read the line first.

| packet | seat | id | severity | title | where |
| --- | --- | --- | --- | --- | --- |
| 10-packages-and-build | claude | F-PB-06 | Medium | `wait_lock` spins at 100% CPU when the lock cannot be created for any reason other than "i | `projects/ROCKNIX/packages/rocknix/profile.d/001-functions` hunk `@@ -89,25 +167 |
| 10-packages-and-build | claude | F-PB-07 | Medium | `write_setting_line` replaces `system.cfg` with awk's output without the emptiness/hostnam | `projects/ROCKNIX/packages/rocknix/profile.d/001-functions` hunk `@@ -89,25 +167 |
| 10-packages-and-build | claude | F-PB-08 | Medium | Stale-lock detection can steal a live lock in the create window, and pid reuse defeats `ki | `projects/ROCKNIX/packages/rocknix/profile.d/001-functions` hunk `@@ -89,25 +167 |
| 10-packages-and-build | claude | F-PB-10 | Medium | `factoryreset`'s player-facing last line carries ANSI escape sequences | `projects/ROCKNIX/packages/rocknix/sources/scripts/factoryreset:38` (`echo -e "\ |
| 10-packages-and-build | claude | F-PB-11 | Medium | `finish_restore` can declare the safety copy missing at 1.7 s and drop the marker while th | `projects/ROCKNIX/packages/rocknix/sources/scripts/chksysconfig` hunk `@@ -1,34 |
| 10-packages-and-build | claude | F-PB-13 | Medium | `external_node_present` mis-derives the internal disk for `sdXN`-rooted devices, so an abs | `projects/ROCKNIX/packages/rocknix/sources/scripts/automount:191` (`internal=$(g |
| 10-packages-and-build | claude | F-PB-14 | Medium | `RuntimeWatchdogSec=15s` is argued against the Allwinner timeout ceiling, not against susp | `projects/ROCKNIX/packages/sysutils/systemd/config/system.conf.d/20-watchdog.con |
| 10-packages-and-build | claude | F-PB-16 | Low | `rocknix-corekeep` streams the whole core through the pipe when disarmed, and the cut/whol | `projects/ROCKNIX/packages/rocknix/sources/scripts/rocknix-corekeep` (the `if [ |
| 10-packages-and-build | claude | F-PB-17 | Low | Evidence snapshot runs `top`, `journalctl`, `df` and writes to the card every five minutes | `projects/ROCKNIX/packages/rocknix/system.d/rocknix-evidence.timer:5-7`, `projec |
| 10-packages-and-build | claude | F-PB-18 | Low | `redact_credentials` misses `Pass`/`login` spellings and forks on every "disk-" line | `projects/ROCKNIX/packages/rocknix/profile.d/001-functions` hunk `@@ -25,6 +25,7 |
| 2-wifi | claude | F-WF-01 | Medium | `forget` deletes the profile but leaves `wifi.ssid`/`wifi.key` naming the forgotten networ | - `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:226-236` (`forget_w |
| 2-wifi | claude | F-WF-02 | Medium | `join` writes `wifi.key` from an unchecked read; a failed read is indistinguishable from a | - `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:261-263` |
| 2-wifi | claude | F-WF-04 | Medium | `current_wifi` uses `${WIFI_DEV}` without `wait_for_wifi`, unlike every other device-touch | - `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:193-199` (`current_ |
| 2-wifi | claude | F-WF-05 | Medium | `saved`/`current` are unescaped; if `list` is not, exact-match marking and the CONNECTED r | - `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:181-187, 196, 213` |
| 2-wifi | claude | F-WF-06 | Low | A name containing a tab parses in ES but can neither be joined nor forgotten by the script | - `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:230, 256` (`awk -F' |
| 2-wifi | claude | F-WF-07 | Low | `forget` reports NetworkManager-unreachable as a refusal (exit 1), unlike `current` and `j | - `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:229` (`rows=$(saved |
| 2-wifi | claude | F-WF-09 | Low | The four new `wifictl` subcommands have no script-level test in the packet, and they run u | - `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:185-267` |
| 2-wifi | claude | F-WF-10 | Low | Fork-internal references and stale row names in comments destined upstream | - `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:17, 175, 239-241` ( |
| 2-wifi | claude | F-WF-12 | Low | `current`/`list` speak SSID; `saved`/`join`/`forget` speak profile id; the picker treats t | - `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:195-196` (SSID from |
| 4-backup-restore | claude | F-BR-05 | Medium | Seed-identical pruning makes a restore non-authoritative on a device whose copy has diverg | `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 |
| 4-backup-restore | claude | F-BR-06 | Medium | Files outside `/storage` are collected into staging and then silently dropped from the arc | `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 |
| 4-backup-restore | claude | F-BR-07 | Medium | `ARCHIVED_*.zip` files the old code left at the backup root are never rotated or trimmed | `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 |
| 4-backup-restore | claude | F-BR-08 | Medium | `trim_archive` can delete the pre-restore snapshot it was just handed when the device cloc | `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 |
| 4-backup-restore | claude | F-BR-09 | Medium | Every backup copies the whole content twice under `mktemp -d`, and the second copy is unne | `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 |
| 4-backup-restore | claude | F-BR-11 | Low | Comments describe the previous code, not this one | `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 |
| 4-backup-restore | claude | F-BR-12 | Low | Player text: destination without tier, a reserved verb, an instruction the device cannot f | `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 |
| 4-backup-restore | claude | F-BR-13 | Low | `"${RATOKENDIRS[@]#/}"'*'` appends the wildcard to the last array element only | `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 |
| 4-backup-restore | claude | F-BR-14 | Low | Zip-branch member parsing truncates names at the first space, so a symlinked path with a s | `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 |
| 4-backup-restore | claude | F-BR-15 | Low | No lock: two concurrent backups share the stamp and the `.partial` name | `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 |
| 4-backup-restore | claude | F-BR-16 | Low | Bluetooth pairing cache silently removed from the default list | `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 |
| 4-backup-restore | claude | F-BR-17 | Low | "Nothing to back up" is reported as a failure that tells the player to try again | `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 |
| 4-backup-restore | claude | F-BR-18 | Low | `SETTINGS_BACKUPS` is read from `cloud_sync.conf` without shell expansion | `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 |
| 4-backup-restore | claude | F-BR-19 | Low | `fail()` sleeps five seconds even when the caller asked for `--no-restart` | `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, hunk `@@ -15,54 |
| 5-cloud-sync-and-saves | claude | F-CS-09 | Medium | `post-update` deleted; consumers that read `cloud_sync.conf` without the helper see pre-mi | `cloud_backup`/`cloud_restore` `load_config` (helper runs there); `cloud_content |
| 10-packages-and-build | gpt | F-PB-15 | Medium | Core retention is neither newest-first nor fully bounded | `projects/ROCKNIX/packages/rocknix/sources/scripts/rocknix-corekeep`: new-file h |
| 10-packages-and-build | gpt | F-PB-16 | Medium | Deleting a setting still interprets its key as a regular expression | `projects/ROCKNIX/packages/rocknix/profile.d/001-functions`: hunk beginning at n |
| 10-packages-and-build | gpt | F-PB-17 | Medium | Save-state arguments can be taken from the ROM filename | `projects/ROCKNIX/packages/rocknix/sources/scripts/runemu.sh`: hunk beginning at |
| 10-packages-and-build | gpt | F-PB-21 | Medium | Concurrent core handlers can defeat the free-space floor | `projects/ROCKNIX/packages/rocknix/sources/scripts/rocknix-corekeep`: new-file h |
| 2-wifi | gpt | F-WF-03 | Medium | Connection profile names are substituted for SSIDs | `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:206–214,252–263` |
| 2-wifi | gpt | F-WF-04 | Medium | Tab-containing names parse successfully but cannot be acted on | `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:226–231,252–257` |
| 2-wifi | gpt | F-WF-07 | Medium | Forget leaves the settings-held copy of the network intact | `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:226–248` |
| 4-backup-restore | gpt | F-BR-13 | Medium | Tar restores can replace OS-managed symlinks | `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:@@ -15,54 +16,860 |
| 4-backup-restore | gpt | F-BR-14 | Medium | ZIP integrity failure is overridden by a successful listing | `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:@@ -15,54 +16,860 |
| 4-backup-restore | gpt | F-BR-15 | Medium | Rotation can delete the snapshot about to protect a restore | `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:@@ -15,54 +16,860 |
| 4-backup-restore | gpt | F-BR-16 | Medium | Staging substitutes new filesystem metadata for original metadata | `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:@@ -15,54 +16,860 |
| 4-backup-restore | gpt | F-BR-17 | Medium | Interrupted snapshots evade cleanup and retention | `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:@@ -15,54 +16,860 |
| 4-backup-restore | gpt | F-BR-19 | Medium | A backup containing only sanitizable settings fails before sanitization | `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:@@ -15,54 +16,860 |
| 4-backup-restore | gpt | F-BR-20 | Low | Raw tool errors bypass the player-text contract | `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:@@ -15,54 +16,860 |
| 7-generic-x64-vm | gpt | F-VM-18 | Medium | The supplied watchdog policy contradicts the claimed VM recovery behavior | - `packages/hardware/quirks/platforms/GENERIC_X64/095-kernel-early-boot-fixes:59 |

## The report

Write `/workspace/tmp/rocknix-session/streams/B-report.md` (create the directory if needed) and return its content as your final message. It carries: the branch and `git log --oneline <base>..HEAD`; per punch item -- **outcome** (resolved / open with reason), the commit, the test case's name, the FAIL line seen before the fix and the PASS after, the `Already written:` answer, and anything the integrator must prove on the VM or a device; per sweep row -- fixed (commit) or withdrawn (reason); the harness's final line (the `tools/last-good-scripts-test` PASS count); and a short list of what you could not do and why. No claim without its artifact: a commit hash, a test's output line, a grep.

## Do not

- Build an image or run `make`, `scripts/build`, `scripts/image`; touch `/workspace/repos/rocknix.worktrees/generic-x64` or `devices` (build worktrees); ssh to any host or guest; run `tools/vm-*` or `generic-x64-vm`; touch `/workspace/artifacts`.
- Push; commit on `next` or `test/qa-integration`; create or remove worktrees; edit files outside your list; read `~/.config/council/env`, `~/.ROCKNIX/`, or anything under `~/.config/<the external forge>/`.
- Ask questions: nobody is watching this stream; decide from the rules and say what you decided in the report. If an item is blocked, leave it open with the reason and go on.

## Run to completion

Wait for every command you start with bounded loops; return only when every punch item and every sweep row has an outcome. A few hours is expected.

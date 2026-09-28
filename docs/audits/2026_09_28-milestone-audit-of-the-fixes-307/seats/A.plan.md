# Fix stream A: the cloud scripts (rclone package) -- audit #307 / #308 (D-WORKFLOW-054, D-WORKFLOW-055)
You are an Opus 5.5 subagent executing a plan this lane defined from a two-seat adversarial audit. Work only in your worktree, only in the files you own, run every item to an outcome, and return a report. Nothing you do reaches a device, a QA guest, an image build or the `next` branch: you deliver a branch, and the integrator builds.
## Your worktree and branch

- Worktree: `/workspace/repos/rocknix.worktrees/pl-a`, branch `feature/pl-a`, cut from `next`. `cd` there for everything; commit there. The primary checkouts (`/workspace/repos/rocknix` on `next`; the ES checkout `/home/max/Development/emulationstation-next.worktrees/qa-integration`) are read-only for you.
- The rules live in `/workspace/repos/rocknix/.claude/rules/` (read them from there; your ROCKNIX worktree carries the same copies). Open before you start: `engineering-practices.md` (§ Guards must fail closed, § Verify the artifact not the report, § A failure you find is yours to fix, § Before deleting a duplicate), `upgrade-and-install.md` (every fix answers what it does to what earlier builds already wrote), `working-principles.md` § Pre-flight, `packaging-and-patches.md`, and `rclone-cloud-sync.md` where your files are cloud scripts. Cite the decision-register rows your items name (`docs/decision-register.md`) rather than re-arguing them.
## The files you own (exclusive -- another stream owns everything else)

`projects/ROCKNIX/packages/network/rclone/sources/`: `cloud_backup`, `cloud_restore`, `cloud_content_backup`, `cloud_content_restore`, `cloud_sync_helper`, `cloud_migrate_layout`, `cloud_capture`, `cloud_saves_root`, `cloud_net_ready`, `cloud_sync-rules.txt`, `cloud_sync-rules.txt.defaults`, `cloud_sync.conf`, `cloud_sync.conf.defaults`, `cloud_sync_cleanup_duplicates.sh`; plus your block in `tools/last-good-scripts-test` and `tools/cloud-round-trip` if a case belongs there. NOT `cloud_setup`, `cloud_oauth`, `cloud_remote`, `cloud_device_id` (stream C).

If a fix genuinely needs a file outside this list, do not touch it: say so in the report under that item and leave the item open with the reason.
## How you prove a fix (scripts and recipes)

- `tools/last-good-scripts-test` (run from your worktree root: `./tools/last-good-scripts-test`; read its header first for how cases are written, how the image's busybox is used for the applets the device has, and how fixtures are made) is the harness. Add your cases at the END of the file in ONE block headed `# ---- audit #307, stream A ----` (other streams append their own blocks; the integrator merges). A case is written FIRST and seen to FAIL on the unfixed script -- paste the FAIL line in the report -- then the fix, then the whole suite PASS; quote the final PASS count.
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
## PL-001: `--match --apply` deletes a system whose cloud listing failed, and enforces no previewed plan
- **Severity:** Critical
- **Category:** Data loss (guards fail closed)
- **Source Finding:** F-CS-01 (both seats) + F-CS-03 (gpt)
- **Owner area:** cloud_content_restore
- **Where:** projects/ROCKNIX/packages/network/rclone/sources/cloud_content_restore:565-596, 661-708
- **What:** `match_plan_one` treats an `rclone lsf` that failed (network, auth) as an absent system and plans `remove`; apply recomputes the plan and passes its own count to `--max-delete`, so the guard the comment at `:696-703` promises cannot trip. Fix: a listing whose exit status is not 0 (or rclone's 3/4 for a genuinely absent path) aborts the plan for that system with `COULDN'T FINISH`; the preview writes its per-system plan to a file; apply reads it, passes those counts to `--max-delete`, and refuses a system whose verb changed.
- **Acceptance:** `tools/last-good-scripts-test` case: a system whose listing returns 5 is neither planned nor removed; a system planned `remove` in the preview and `sync` at apply is refused; the `--max-delete` count on apply equals the preview's

## High Priority
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-CS-01 (claude, 5-cloud-sync-and-saves) -- a failed per-system listing in `--match --apply` deletes that system's local content
**Checked:** `cloud_content_restore:572` decides presence with `if rclone lsf "${src}" ... 2>/dev/null | grep -q .`; a listing that *fails* (a 429 after rclone's own retries, the link dropping between calls) produces no output and takes the `else` at `:586` -- "Absent from the cloud entirely: its content goes" -- and in apply mode `match_run` recomputes the plan per system (`planned=$(match_plan_one "${sys}")`) and runs `rclone delete "${DEST}/${sys}" ... --max-delete "${files}"` (`:674-676`) with `files` the count from that same failed plan, so the bound is the whole system. The file's own header rule says an empty or failed listing must never mean delete everything; `cloud_root_populated` guards the root, not the system.
**Verdict:** survived -- **Critical** (data loss in the one content action that deletes, D-CLOUD-023, on a transient error): read `rclone lsf`'s exit status apart from its emptiness (`set -o pipefail` in the subshell, or capture the listing first and test `$?`), treat a failure as *unknown* and skip the system with a `>>> why` line, and never recompute the plan under apply -- apply what the preview showed.
### F-CS-03 (gpt, 5-cloud-sync-and-saves) -- apply recomputes the deletion plan instead of enforcing the preview
**Checked:** `cloud_content_restore:661` runs `planned=$(match_plan_one "${sys}")` in preview and in apply alike, and `:676`/`:708` pass the apply run's own `files` to `--max-delete`; the comment at `:696-703` says `--max-delete` is "the fail-closed half: if reality has drifted from the preview the player agreed to", but nothing carries the preview's counts across -- there is no plan file, token or limit argument (`:871-872` only flips `apply`). The guard can trip only if the count changes between the dry run and the real run seconds later. **Survived, High** (Critical as filed; the deletion is bounded by a fresh plan, not by nothing, but the guard the comment promises does not exist). Fix: the preview writes its per-system plan; apply reads it, passes those counts to `--max-delete`, and refuses a system whose verb changed. One fix with F-CS-01.
</details>
## PL-012: `--all` restores ROMs and never BIOS, and re-anchors the media filters
- **Severity:** High
- **Category:** Correctness
- **Source Finding:** F-CS-02 (claude) = F-CS-13 (gpt)
- **Owner area:** cloud_content_restore
- **Where:** cloud_content_restore (`--all`, `remote_for`)
- **What:** `--all` sets `DIRS=("")` and `remote_for("")` resolves to the ROMs container; only `--selected` appends BIOS; the media excludes are anchored to a system root that `--all` does not use. Fix: `--all` enumerates ROMs and BIOS as the selected path does, with the same anchors.
- **Acceptance:** a journey restore with `--all` brings `BIOS/` down; `tools/cloud-round-trip` asserts a BIOS file's presence after `--all`
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-CS-02 (claude, 5-cloud-sync-and-saves) -- `--all` restores `ROMs/` and never `BIOS`
**Checked:** `cloud_content_restore:1044-1045` sets `DIRS=("")` for `--all`; `remote_for ""` (`:252-256`) is `${ROOT}ROMs/`, so the run copies the ROMs root and nothing under `${ROOT}BIOS`; `--selected` adds `bios` by an explicit check the `--all` case lacks. `main.cpp:966` composes `cloud_content_restore --all` for the first-device journey, and the page says everything was restored.
**Verdict:** survived -- **High** (a partial restore on the journey's first run, reported complete): `--all` adds `bios` when `${ROOT}BIOS` exists, as `--selected` does; a proof on the VM with a BIOS file in the QA cloud.
### F-CS-13 (gpt) = F-CS-02 (claude): `--all` restores ROMs and never BIOS -- both seats, **survived High** above.
</details>
## PL-020: An incomplete rules file can replace the live allowlist, and the consumers do not check for the catch-all
- **Severity:** High
- **Category:** Data loss
- **Source Finding:** F-CS-05 (gpt)
- **Owner area:** cloud_sync_helper / cloud_backup
- **Where:** cloud_sync_helper:90-106; cloud_backup:1329,1345
- **What:** The defaults are appended unchecked and the candidate is renamed over the live file unconditionally; the allowlist's last line (`- /**`) is what keeps the ROMs out of the saves sync. Fix: check the `cat`, then `grep -qx -- '- /\*\*'` on the candidate before the rename; `cloud_backup` and `cloud_restore` refuse a rules file without the anchored catch-all.
- **Acceptance:** a candidate cut before its last line is not installed and the helper says so; `cloud_backup` with a rules file lacking the catch-all ends `COULDN'T FINISH`; both in the scripts test
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-CS-05 (gpt, 5-cloud-sync-and-saves) -- an incomplete rules file can replace the live allowlist
**Checked:** `cloud_sync_helper:90-106`: `: > new`, the user's rules, then `cat /usr/config/cloud_sync-rules.txt.defaults >> new` unchecked, then `mv -f new rules` unconditionally; the `grep -q '^- /\*\*'` at `:51` is unanchored and tests the *old* file. `cloud_backup:1329`/`:1345` pass `--filter-from /storage/.config/cloud_sync-rules.txt` with no check that the file ends in the catch-all. The rules are an allowlist, so a file cut before its last line includes everything under the saves root -- the ROMs -- in the next sync. The trigger is a write failure on `/storage` (a full card is ordinary on a handheld). **Survived, High** (Critical as filed; needs the failure at that step). Fix: check the `cat`, then `grep -qx -- '- /\*\*'` on the candidate before the rename; `cloud_backup` refuses a rules file without the anchored catch-all.
</details>
## PL-021: Pruning by name order can delete the replaced-saves folder or the archive this run just wrote
- **Severity:** High
- **Category:** Data loss
- **Source Finding:** F-CS-06 (gpt)
- **Owner area:** cloud_backup
- **Where:** cloud_backup:1226-1235, 1433-1434, 1886-1899
- **What:** The replaced-saves root is shared by every device on the cloud and its folders are named by timestamp alone; the prune keeps the lexically greatest, so another device's clock ahead (or this device's corrected backwards) makes this run purge its own folder; the settings retention sorts the same way. Fix: pin this run's folder and archive by name and prune the rest by count.
- **Acceptance:** the scripts test seeds a future-dated sibling folder and asserts the run's own folder survives the prune
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-CS-06 (gpt, 5-cloud-sync-and-saves) -- pruning by name order can delete the folder this run just wrote
**Checked:** `cloud_backup:1433-1434` names the replaced-saves folder `<SAVES_REMOTE>-replaced/<YYYY_MM_DD-HHMMSS>` -- one root shared by every device on the cloud, no device id in the name; `prune_replaced_remote` (`:1226-1235`) lists the root, `sort -r | tail -n +2`, and purges everything but the lexically greatest. So a folder written by another device whose clock is ahead, or by this device before its clock was corrected backwards, outranks this run's folder, and this run purges what it has just written; the settings retention at `:1886-1899` sorts archive names the same way. **Survived, High** (one player, many devices is the model; clocks on RTC-less handhelds are exactly the ones that jump). Fix: never prune the folder or archive this run wrote (pin its name), prune the rest by count.
</details>
## PL-025: The layout migration moves the old root's backups into Saves
- **Severity:** High
- **Category:** Data layout
- **Source Finding:** F-CS-08 (gpt)
- **Owner area:** cloud_migrate_layout
- **Where:** cloud_migrate_layout:99-116, 256-262
- **What:** The presence test excludes `backup/**` and `Backups/**`; the relocation copies the root unfiltered, so the settings archives land under `/ROCKNIX/Saves/backup/` before the backups' own move. Fix: relocate with the same excludes, and move the backups first.
- **Acceptance:** the scripts test seeds an old root with `saves` and `backup/` and asserts nothing under `Saves/backup/` after `--apply`
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-CS-08 (gpt, 5-cloud-sync-and-saves) -- the layout migration moves the old root's backups into Saves
**Checked:** `cloud_migrate_layout:256-262` decides the saves are "at the root" with `has_files ... --exclude saves/**` (and `has_files` itself excludes `backup/**`, `Backups/**`), then `relocate` (`:99-116`) copies `${saves_src}` unfiltered, so a root that held `backup/` beside the saves carries it into `/ROCKNIX/Saves/backup/` before the backups' own relocation looks for it. The main text's own line -- "which would move the whole folder, backups included, into Saves" -- names the hazard and guards only the subfolder case. **Survived, High**: relocate with the same excludes, and move the backups first.
</details>
## PL-026: The pointers are rewritten only after both moves, and the backups' resume check compares the saves source
- **Severity:** High
- **Category:** Recoverability
- **Source Finding:** F-CS-09 (gpt)
- **Owner area:** cloud_migrate_layout
- **Where:** cloud_migrate_layout:265-273, 306-307
- **What:** A run that moved the saves and died before the pointers leaves `SAVES_REMOTE` at the emptied path, and the next run refuses the new folder as "already exists" because `resumable` is given the saves source for the backups destination too. Fix: write each pointer as its tier lands; pass each tier its own source.
- **Acceptance:** the scripts test kills the migration between the two moves and asserts the second run completes
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-CS-09 (gpt, 5-cloud-sync-and-saves) -- the pointers are rewritten only after both moves, and the resume check compares the wrong source
**Checked:** `:265-273` runs `resumable "${remote}${saves_src}" "${remote}${dest}"` for `NEW_SAVES` *and* `NEW_BACKUPS` -- the backups destination is judged against the saves source -- and `:306-307` writes both pointers only after both relocations. A run that moved the saves and died before the pointers leaves `SAVES_REMOTE` at the emptied old path; the next run finds the new folder present and, comparing it with an empty source, refuses (`REFUSING: ... already exists`). **Survived, High**: write each pointer as its tier lands, and pass each tier its own source to `resumable`.
</details>
## PL-027: A listing that fails reads as an empty folder, and the pointers move with nothing copied
- **Severity:** High
- **Category:** Guards fail closed
- **Source Finding:** F-CS-10 (gpt)
- **Owner area:** cloud_migrate_layout
- **Where:** cloud_migrate_layout:48-49, 77-78
- **What:** `[ -n "$(rclone lsf ... 2>/dev/null | head -1)" ]` discards the exit status. Fix: `rclone lsd "$1" >/dev/null || fail` before any presence test; a failed listing aborts the migration.
- **Acceptance:** the scripts test points the migration at a dead endpoint and asserts no pointer changes
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-CS-10 (gpt, 5-cloud-sync-and-saves) -- a listing that fails reads as an empty folder
**Checked:** `:48-49` and `:77-78`: `[ -n "$(rclone lsf "$1" 2>/dev/null | head -1)" ]` -- the exit status is discarded, so a cloud that does not answer is a cloud with nothing in it, and `main` goes on to rewrite the pointers (`:306-307`) with nothing copied. **Survived, High** (the guards-fail-closed rule, verbatim). Fix: `rclone lsd "$1" >/dev/null || fail "could not list ..."` before any presence test.
</details>
## PL-028: A saves phase that moved nothing (rclone 9) hides a failed settings phase
- **Severity:** High
- **Category:** Outcome vocabulary
- **Source Finding:** F-CS-12 (gpt)
- **Owner area:** cloud_backup / cloud_restore
- **Where:** cloud_restore:1859-1860 and the twin in cloud_backup
- **What:** `[ overall -eq 0 ] && overall=SYSTEM_STATUS` skips the settings result when the saves returned 9, and the run says COMPLETED. Fix: `case ${overall} in 0|9) overall=${...SYSTEM_STATUS} ;; esac`.
- **Acceptance:** the scripts test: saves 9 beside a failed settings phase ends `COULDN'T FINISH`; `tools/cloud-round-trip`'s settings phase asserts the outcome
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-CS-12 (gpt, 5-cloud-sync-and-saves) -- a saves phase that moved nothing hides a failed settings phase
**Checked:** `cloud_restore:1859-1860` (`overall=${RESTORE_STATUS}; [ "${overall}" -eq 0 ] && overall=${RESTORE_SYSTEM_STATUS}`) and its twin in `cloud_backup`; the outcome word treats `0|9` as complete (`:727`, `:680`), so rclone's 9 (nothing to transfer) on the saves keeps the settings phase's failure out of `overall`, and the run says `COMPLETED`. **Survived, High**: the outcome rule (D-UI-030) says a part that failed is not completed, and a settings backup that silently did not happen is the tier a player finds missing later. Fix: `case ${overall} in 0|9) overall=${...SYSTEM_STATUS} ;; esac`.
</details>
## PL-030: Cloud folder names reach the shell unquoted
- **Severity:** High
- **Category:** Shell injection
- **Source Finding:** F-ES-03 (gpt, 8a)
- **Owner area:** EmulationStation GuiMenu (the system picker)
- **Where:** es-app/src/guis/GuiMenu.cpp:4233-4234; cloud_content_restore `--set-systems`
- **What:** The picked names are joined and passed inside double quotes to a shell; `$(`, backticks and `"` are live. Fix: `cloudShellQuote(picked)` (used three lines away already), and the script refuses a system name outside `[A-Za-z0-9._-]`.
- **Acceptance:** a cloud folder named `a$(touch /tmp/x)b` picked on the guest leaves no `/tmp/x`; the script's refusal is in the scripts test

## Medium Priority
**Your half of PL-030 is the script side only:** `cloud_content_restore --set-systems` refuses a system name outside `[A-Za-z0-9._-]` with a clear line; the C++ quoting is stream E2's.
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-ES-03 (gpt, 8b-es-core) -- startup deletes a temporary the previous writer may have needed
**Checked:** `SystemConf.cpp:138-139` removes `system.cfg.tmp` and `system.cfg.backup.tmp` before anything is read; the loader then takes the live file if `isUsableSystemConf` (one qualifying assignment, no NUL) and otherwise `.backup`. A device upgrading from the pre-#102 writer -- which truncated the live file and streamed the temporary into it -- can arrive with a cut live file and a complete `.tmp`, and no `.backup` yet; the cut file passes the usability test if one assignment survived, is parsed, and is recorded as last-good. The `Already written` question D-WORKFLOW-050 asks was not asked of `.tmp`. **Survived, Medium** (Critical as filed; the window is the old writer's last save before the upgrade). Fix: when the live file fails or is shorter than `.tmp`, and no `.backup` exists, read `.tmp` before deleting it; and make usable mean complete (a trailer line, or size against the record).
### F-ES-03 (gpt, 8a-es-app) -- cloud folder names reach the shell unquoted
**Checked:** `GuiMenu.cpp:4084-4127`: the picker's rows come from `cloud_content_restore --scan`, one `name|...` line per folder in the cloud, `name` taken as `p[0]`; `:4233-4234` joins the picked names with spaces and runs `"/usr/bin/cloud_content_restore --set-systems \"" + picked + "\""` through `executeScriptLegacy` (a shell). Double quotes leave `$(`, backticks and `"` live, so a cloud folder named `$(reboot)` runs. The names are the owner's own cloud (or another of their devices'), which bounds the exposure; the fork has `cloudShellQuote` for exactly this and uses it three lines away for the serve command. **Survived, High** (shell injection from data is the class, whoever writes the data). Fix: `cloudShellQuote(picked)`, and the script side refuses a system name outside `[A-Za-z0-9._-]`.
</details>
## PL-052: A relative `--retire` argument is unlinked relative to the working directory
- **Severity:** Medium
- **Category:** Correctness
- **Source Finding:** F-CS-04 (gpt)
- **Owner area:** cloud_capture
- **Where:** cloud_capture:411-419, 249-251
- **What:** Fix: `retire_rel` refuses anything not under `${ROOT}/`; the rm runs on `${ROOT}/${rel}`.
- **Acceptance:** the scripts test: a relative argument is refused
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-CS-04 (gpt, 5-cloud-sync-and-saves) -- a relative `--retire` argument is unlinked relative to the working directory
**Checked:** `cloud_capture:411-419` `retire_rel` strips `${ROOT}/`, refuses another absolute path (`/*) return 1`), and lets a relative argument through unchanged; `:428` records the raw argument in `RETIRE_ACCEPTED`, and `:249-251` runs `rm -f -- "${_p}"` on it -- so `gb/x.state` is recorded as a saves-folder path and removed from wherever the process's cwd is. The only caller is the interface, which passes absolute paths, and the unlink needs `--unlink`. **Survived, Medium** (Critical as filed: the code is as described; the input that reaches it is not). Fix: `retire_rel` refuses anything not under `${ROOT}/`, and the rm runs on `${ROOT}/${rel}`.
</details>
## PL-053: The migration purges the source after a point-in-time check
- **Severity:** Medium
- **Category:** Data loss (window)
- **Source Finding:** F-CS-07 (gpt)
- **Owner area:** cloud_migrate_layout
- **Where:** cloud_migrate_layout:99-116
- **What:** Fix: delete the verified files by list, then `rmdirs`.
- **Acceptance:** the scripts test: a file added after the check survives
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-CS-07 (gpt, 5-cloud-sync-and-saves) -- the layout migration purges the source after a point-in-time check
**Checked:** `cloud_migrate_layout:99-116` copies, runs `rclone check --one-way` (every source file present and matching), then `rclone purge "${src}"`; nothing is deleted file by file and no lock is taken, so a file another device writes into the old layout between the check and the purge is lost. The window is seconds and the writer would have to be mid-sync on the old build. **Survived, Medium** (Critical as filed). Fix: delete the verified files by list (`rclone delete --files-from`), then `rmdirs`, so anything newer survives for the next run.
</details>
## PL-066: The game-list pass's failure is dropped
- **Severity:** Medium
- **Category:** Outcome vocabulary
- **Source Finding:** F-CS-11 (gpt)
- **Owner area:** cloud_content_backup / cloud_content_restore
- **Where:** cloud_content_backup:570-578; cloud_content_restore:1103-1105
- **What:** Fix: fold its status into `RC` under the same `0|9` rule.
- **Acceptance:** the scripts test: a failing game-list copy ends `COULDN'T FINISH`
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-CS-11 (gpt, 5-cloud-sync-and-saves) -- the game-list pass's failure is dropped
**Checked:** `cloud_content_backup:570-578` reads `RC=$?` from the media transfer, then runs the `gamelist.xml` copy with `|| true`; `cloud_content_restore:1103-1105` the same. A game list that failed to move leaves the stamp `COMPLETED`. **Survived, Medium** (High as filed; one file per system, `--update` so nothing is overwritten wrongly). Fix: fold its status into `RC` under the same `0|9` rule.
</details>
## PL-067: The capture's final check and rename are not one step
- **Severity:** Medium
- **Category:** Concurrency
- **Source Finding:** F-CS-14 (gpt)
- **Owner area:** cloud_capture
- **Where:** cloud_capture (`finish`)
- **What:** Fix: a lock file around `finish`.
- **Acceptance:** the scripts test: two captures serialise
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-CS-14 (gpt, 5-cloud-sync-and-saves) -- the capture's final check and rename are not one step
**Checked:** `cloud_capture`'s `finish` stats, re-reads the card identity, then `mv`s; two captures never run at once (one game at a time, and the exit sync follows the capture on the same thread in `FileData.cpp:1076-1111`), and the restore is behind the transfer lock. **Survived, Medium** (High as filed): a lock file around `finish` costs nothing and closes the theoretical window.
</details>
## PL-070: `unzip -t || unzip -l` makes a listing pass for an integrity test
- **Severity:** Medium
- **Category:** Guards fail closed
- **Source Finding:** F-CS-17 (gpt)
- **Owner area:** cloud_backup
- **Where:** cloud_backup:654
- **What:** Fix: probe `unzip -t` once; where supported, let its failure stand.
- **Acceptance:** the scripts test: a damaged archive under busybox fails the check
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-CS-17 (gpt, 5-cloud-sync-and-saves) -- `unzip -t || unzip -l` makes a listing pass for an integrity test
**Checked:** `cloud_backup:654`: exactly that; a damaged archive that fails `-t` passes `-l`. The later size comparison is the only other check. **Survived, Medium** (High as filed). Fix: probe once whether `unzip -t` is supported on this busybox and, where it is, let its failure stand.
</details>
## PL-071: `migrate_content`'s failure is dropped
- **Severity:** Medium
- **Category:** Outcome vocabulary
- **Source Finding:** F-CS-18 (gpt)
- **Owner area:** cloud_migrate_layout
- **Where:** cloud_migrate_layout:311-320
- **What:** Fix: propagate it.
- **Acceptance:** the scripts test: a failing content move ends non-zero
<details><summary>The audit's verdict(s) this item rests on</summary>
### F-CS-18 (gpt, 5-cloud-sync-and-saves) -- `migrate_content`'s failure is dropped
**Checked:** `cloud_migrate_layout:311-320`: the call's status is ignored and `main` returns 0 with "Done." **Survived, Medium** (High as filed): propagate it.
</details>
## The sweep rows (#308): the seats' Mediums and Lows in your files, 26 rows

Every row gets a verdict. For each: read the seat's full finding in `/workspace/repos/rocknix/docs/audits/2026_09_25-milestone-rc-round-since-258/seats/<packet>-<seat>.md` under its id; read the code it names; then either **fix** it (the same proof rule: a case first where a case can exist, a commit naming `#308 <packet> <seat> <id>`) or **withdraw** it with one honest line (refuted with the line that refutes it; a duplicate of a punch item -- name it; fork-only prose or upstream fit for the PR-prep pass #256; not in your files -- name the stream). Do not skip a row and do not fix by description: read the line first.

| packet | seat | id | severity | title | where |
| --- | --- | --- | --- | --- | --- |
| 5-cloud-sync-and-saves | claude | F-CS-04 | Medium | `cloud_restore` keeps five seconds of console sleeps under `--yes`/`--automatic`, and othe | `cloud_restore` hunks `@@ -571,26 +1809,43 @@` (`sleep 2`), `@@ -599,23 +1854,43 |
| 5-cloud-sync-and-saves | claude | F-CS-06 | Medium | The rules-file "whole" guard matches the new first rule, not the catch-all | `cloud_sync_helper` hunk `@@ -36,13 +36,24 @@`; `cloud_sync-rules.txt.defaults` |
| 5-cloud-sync-and-saves | claude | F-CS-08 | Medium | `sweep_partials` walks the entire ROMs tree after every restore, including the boot-time a | `cloud_restore` hunk `@@ -415,30 +1260,144 @@` (`sweep_partials`), hunk `@@ -481 |
| 5-cloud-sync-and-saves | claude | F-CS-10 | Medium | `prune_replaced_remote` keeps the lexically newest stamp folder, so a device with its cloc | `cloud_backup` hunk `@@ -342,43 +1220,95 @@` (`prune_replaced_remote`), hunk `@@ |
| 5-cloud-sync-and-saves | claude | F-CS-11 | Medium | The rules merge activates every previously inert user rule on upgrade | `cloud_sync_helper` hunk `@@ -50,38 +61,83 @@` |
| 5-cloud-sync-and-saves | claude | F-CS-12 | Medium | A customised `RESTOREPATH` refuses every saves transfer with a fix that needs a shell | `cloud_backup` hunk `@@ -188,36 +786,164 @@` and `cloud_restore` hunk `@@ -264,3 |
| 5-cloud-sync-and-saves | claude | F-CS-16 | Low | `overall` masks a failed settings phase when the saves phase returns 9 | `cloud_backup` hunk `@@ -522,53 +1922,88 @@`; `cloud_restore` hunk `@@ -599,23 + |
| 5-cloud-sync-and-saves | claude | F-CS-17 | Low | Dead `--delete-excluded` warning and stale config comments | `cloud_backup` hunk `@@ -268,6 +998,19 @@` (strip) and `@@ -284,31 +1027,166 @@` |
| 5-cloud-sync-and-saves | claude | F-CS-18 | Low | `cloud_sync_helper` rewrites the conf, the rules and both `.bak`s on every run — every gam | `cloud_sync_helper` hunks `@@ -36,13 +36,24 @@`, `@@ -50,38 +61,83 @@`, `@@ -94, |
| 5-cloud-sync-and-saves | claude | F-CS-20 | Low | `cloud_capture` calls `timedatectl` without a timeout on the synchronous game-exit path | `cloud_capture` (new), `SYNCED="false"; [ "$(timedatectl show -p NTPSynchronized |
| 5-cloud-sync-and-saves | claude | F-CS-21 | Low | Listings run with the transfer's retry count | `cloud_restore` hunk `@@ -481,79 +1481,316 @@` (`REMOTE_FILES=$(rclone ls … "${R |
| 5-cloud-sync-and-saves | claude | F-CS-22 | Low | The conf `.bak` fallback is deleted at the end of every completed run, so it is absent whe | `cloud_backup` hunk `@@ -179,7 +755,29 @@` and `cloud_restore` hunk `@@ -255,7 + |
| 5-cloud-sync-and-saves | claude | F-CS-23 | Low | `cloud_migrate_layout` runs rclone unbounded, without the lock, and verifies by size on ha | `cloud_migrate_layout` (new), `relocate`, `resumable`, `has_files` |
| 5-cloud-sync-and-saves | claude | F-CS-24 | Low | A run cut by the network after it moved files stamps 69, which the rows read as SKIPPED | `cloud_backup` `network_lost_during_run` → `clean_exit "${EXIT_NO_NETWORK}"` → ` |
| 5-cloud-sync-and-saves | claude | F-CS-25 | Low | A saves folder configured at the remote root makes `--backup-dir` overlap the destination | `cloud_backup` hunk `@@ -400,90 +1330,257 @@` (`replaced_root="${SAVES_REMOTE%/} |
| 5-cloud-sync-and-saves | claude | F-CS-27 | Low | rclone's `package.mk` now depends on a browser engine, Python and a fork package | `projects/ROCKNIX/packages/network/rclone/package.mk` hunk `@@ -4,18 +4,41 @@` |
| 5-cloud-sync-and-saves | gpt | F-CS-20 | Medium | Saves-root recording can succeed without recording anything | - `projects/ROCKNIX/packages/network/rclone/sources/cloud_saves_root:@@ -0,0 +1, |
| 5-cloud-sync-and-saves | gpt | F-CS-21 | Medium | A no-op full capture deletes the quarantined manifest | - `projects/ROCKNIX/packages/network/rclone/sources/cloud_capture:@@ -0,0 +1,153 |
| 5-cloud-sync-and-saves | gpt | F-CS-22 | Medium | Adopt can inherit another game's unit and can falsely report recording | - `projects/ROCKNIX/packages/network/rclone/sources/cloud_capture:@@ -0,0 +1,153 |
| 5-cloud-sync-and-saves | gpt | F-CS-26 | Medium | Match reports planned removals as actual removals and promises nonexistent backups | - `projects/ROCKNIX/packages/network/rclone/sources/cloud_content_restore:@@ -0, |
| 5-cloud-sync-and-saves | gpt | F-CS-28 | Medium | Reachable LAN remotes are rejected without a default route | - `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup:@@ -34,6 +378,9 |
| 5-cloud-sync-and-saves | gpt | F-CS-29 | Medium | The oldest automatic bound needs two helper runs to reach 90 seconds | - `projects/ROCKNIX/packages/network/rclone/sources/cloud_sync_helper:@@ -109,39 |
| 5-cloud-sync-and-saves | gpt | F-CS-30 | Medium | Content scans and transfers do not describe the same file set | - `projects/ROCKNIX/packages/network/rclone/sources/cloud_content_backup:@@ -0,0 |
| 5-cloud-sync-and-saves | gpt | F-CS-34 | Medium | Advertised network ceilings do not cover all cloud commands | - `projects/ROCKNIX/packages/network/rclone/sources/cloud_restore:@@ -562,6 +179 |
| 5-cloud-sync-and-saves | gpt | F-CS-35 | Medium | An undated legacy archive sorts newer than dated archives | - `projects/ROCKNIX/packages/network/rclone/sources/cloud_restore:@@ -481,79 +14 |
| 5-cloud-sync-and-saves | gpt | F-CS-37 | Low | Shipped configuration comments still call sync the default | - `projects/ROCKNIX/packages/network/rclone/sources/cloud_sync.conf:@@ -34,16 +5 |

## The report

Write `/workspace/tmp/rocknix-session/streams/A-report.md` (create the directory if needed) and return its content as your final message. It carries: the branch and `git log --oneline <base>..HEAD`; per punch item -- **outcome** (resolved / open with reason), the commit, the test case's name, the FAIL line seen before the fix and the PASS after, the `Already written:` answer, and anything the integrator must prove on the VM or a device; per sweep row -- fixed (commit) or withdrawn (reason); the harness's final line (the `tools/last-good-scripts-test` PASS count); and a short list of what you could not do and why. No claim without its artifact: a commit hash, a test's output line, a grep.

## Do not

- Build an image or run `make`, `scripts/build`, `scripts/image`; touch `/workspace/repos/rocknix.worktrees/generic-x64` or `devices` (build worktrees); ssh to any host or guest; run `tools/vm-*` or `generic-x64-vm`; touch `/workspace/artifacts`.
- Push; commit on `next` or `test/qa-integration`; create or remove worktrees; edit files outside your list; read `~/.config/council/env`, `~/.ROCKNIX/`, or anything under `~/.config/possibility-forge/`.
- Ask questions: nobody is watching this stream; decide from the rules and say what you decided in the report. If an item is blocked, leave it open with the reason and go on.

## Run to completion

Wait for every command you start with bounded loops; return only when every punch item and every sweep row has an outcome. A few hours is expected.

# Audit — bucket 5-cloud-sync-and-saves (fork e9ff9dbd11..314e339bad; ES bccd715707..7eae8ed913)

## 1. Summary

The bucket replaces the console-driven rclone tools with a scripted cloud tier (saves, settings archive, ROMs/BIOS, game content) driven from EmulationStation: exit-code sentinels 75/69, a flock, bounded automatic and deliberate runs, a `>>> ` protocol read by a sync card (`ThreadedCloudSync`) and a transfer page (`GuiCloudTransfer`/`CloudTransferJob`), a save-manifest recorder (`cloud_capture`), a card-identity guard, a network-settle gate, config/rules migration in `cloud_sync_helper`, and a save-state manager with off-thread bookkeeping. The shell layer is unusually well reasoned in its comments, and the ES pure-text code has real tests. The reasoning has not been carried evenly across scripts: `cloud_backup` and `cloud_restore` are no longer structurally in sync (restore still sleeps five seconds under `--yes --automatic`), and the content tier lacks the guards the saves tier has. The three findings that matter most: (1) `cloud_content_restore --match --apply` reads a *failed* per-system listing as "absent from the cloud" and deletes that system's local content, against a plan recomputed after the preview the player agreed to; (2) `cloud_content_restore --all` — the command the first-device journey runs — restores `ROMs/` only and never `BIOS`, reporting "Restored everything."; (3) `ThreadedCloudSync` leaks a joinable `std::thread` (never joined or detached) on every startup and game-exit sync. Several Medium findings are upgrade-path or parity gaps the rule files explicitly warn about.

## 2. Findings

### F-CS-01: A failed per-system listing in `--match --apply` deletes that system's local content
- **Severity:** High
- **Category:** Data loss
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_content_restore` (new file, hunk `@@ -0,0 +1,1128 @@`), functions `match_plan_one` and `match_run`
- **What:** `match_plan_one` decides "absent from the cloud" with `rclone lsf "${src}" … 2>/dev/null | grep -q .`, which is false both for an empty/absent folder and for a listing that *errored*; in apply mode `match_run` recomputes the plan per system (`planned=$(match_plan_one "${sys}")`) rather than using the preview's, then runs `rclone delete "${DEST}/${sys}" … --max-delete "${files}"` where `files` is the count from that same failed plan.
- **Failure scenario:** `cloud_root_populated` passes (root lists), then a transient error on one system's listing (429/5xx after three low-level retries, a Wi-Fi drop that returns before the next call) → verb `remove` → every ROM in `/storage/roms/<sys>` not matched by the save/metadata excludes is deleted, `rmdir` follows. The preview may have shown `sync|0|0` for that system a moment earlier.
- **Evidence:** `if rclone lsf "${src}" "${RCLONE_LIST_OPTS[@]}" 2>/dev/null | grep -q .; then … else # Absent from the cloud entirely: its content goes` ; in `match_run`: `planned=$(match_plan_one "${sys}")` inside the apply loop, then `rclone delete "${DEST}/${sys}" … --max-delete "${files}"`. The header's own rule 3 says "An empty or failed listing must never mean 'delete everything'". Refutation attempted: looked for an exit-status check on `lsf` (none — status is discarded by the pipe), for reuse of the preview's numbers at apply time (none), for a `network_gone` check before the delete (only after a failed `sync`), and for the `stop_no_network` path on the `remove` branch (absent). The comment on `--max-delete` ("the fail-closed half: if reality has drifted from the preview the player agreed to, this aborts") does not describe the code — `files` is not the preview's number.
- **Fix:** Capture `lsf`'s exit status separately (`PIPESTATUS[0]`) and treat non-zero, non-3 as "could not plan" (the `*)` branch already exists for that); confirm absence by the parent listing as `absent_not_broken` does; pass the preview's per-system counts into `--apply` (e.g. via stdin or a temp plan file) and abort a system whose recomputed plan differs.
- **Confidence:** high on the code path; medium on likelihood (one failed listing among thirty after the root succeeded is a blip, but blips are the normal case on a handheld per `upgrade-and-install.md`).

### F-CS-02: `cloud_content_restore --all` restores `ROMs/` only and never `BIOS`; the first-device journey runs it
- **Severity:** High
- **Category:** Correctness
- **Where:** `cloud_content_restore` (new file), the `--all)` case, `remote_for`, `resolve_src`, the transfer loop; `es-app/tests/unit/CloudTextTests.cpp` (new file), `transferKind` test ("The journey's first restore (main.cpp)")
- **What:** `--all` sets `DIRS=("")`; `remote_for ""` yields `${ROOT}ROMs/`, so the run copies `remote:/ROCKNIX/Content/ROMs/` into `/storage/roms/` and never touches `${ROOT}BIOS`. `--selected` adds `bios` explicitly (`exists_remote "${ROOT}BIOS" && … DIRS+=("bios")`); `--all` has no such step. On the flat and pre-CONTENT_REMOTE layouts `resolve_src ""` falls through to `${new}` and copies nothing.
- **Failure scenario:** Fresh device, first-restore journey (`cloud_content_restore --all ; … cloud_restore --yes` per the unit test's string) → every system's ROMs arrive, BIOS does not, the page says `Restored everything.` and exits 0 → games that need BIOS fail to boot with no indication the restore was partial.
- **Evidence:** `remote_for() { case "$1" in bios) echo "${ROOT}BIOS" ;; *) echo "${ROOT}ROMs/$1" ;; esac; }`; `--all) DIRS=("") ;;`; `SRC="$(resolve_src "${DIR}")" … rclone copy "${SRC}" "${TARGET}"`; usage says `--all copy the whole remote content root`. Refutation attempted: looked for a second unit for BIOS under `--all`, for `--all` being an unused legacy switch (the test cites main.cpp composing it), and for BIOS living under `ROMs/` in the current layout (it does not — `cloud_content_backup`'s `remote_for` writes `BIOS` beside `ROMs`).
- **Fix:** Make `--all` expand to the listed systems plus `bios` when the cloud has it (reuse `--selected`'s BIOS clause and `--list`'s union), or restore `${ROOT}ROMs/` and `${ROOT}BIOS` as two units.
- **Confidence:** medium — the composition in main.cpp is outside the packet; the test string is the evidence it uses `--all`.

### F-CS-03: `ThreadedCloudSync` leaks a joinable thread per sync
- **Severity:** Medium
- **Category:** Resource
- **Where:** `es-app/src/ThreadedCloudSync.cpp` (new file), constructor and `~ThreadedCloudSync`; `es-app/src/ThreadedCloudSync.h`, `std::thread* mHandle`
- **What:** The constructor does `mHandle = new std::thread(&ThreadedCloudSync::run, this)`; `run()` ends with `delete this`; the destructor neither joins nor detaches, and the `std::thread` object is never deleted. A terminated joinable pthread keeps its stack and TCB until joined.
- **Failure scenario:** Startup sync + one game-exit sync per game → one leaked thread stack (8 MiB VA, ~100–200 KiB resident) per sync for the life of the ES process; a session of a few hundred game exits leaks tens of MB RSS on a device with 1 GB.
- **Evidence:** `mHandle = new std::thread(&ThreadedCloudSync::run, this);` … `ThreadedCloudSync::~ThreadedCloudSync() { mWndNotification->close(); mWndNotification = nullptr; if (ThreadedCloudSync::mInstance == this) … }` … `delete this;`. Refutation attempted: searched the diff for `mHandle->detach()`, `join()` or `delete mHandle` — none.
- **Fix:** `std::thread(&ThreadedCloudSync::run, this).detach();` and drop `mHandle` (the `CloudTransferJob` code in the same bucket already does this).
- **Confidence:** high.

### F-CS-04: `cloud_restore` keeps five seconds of console sleeps under `--yes`/`--automatic`, and other parity gaps with `cloud_backup`
- **Severity:** Medium
- **Category:** Resource
- **Where:** `cloud_restore` hunks `@@ -571,26 +1809,43 @@` (`sleep 2`), `@@ -599,23 +1854,43 @@` (`sleep 3`), `@@ -264,36 +852,160 @@` (`sleep 3` in `check_rclone_config` and `check_internet`); compare `cloud_backup` hunk `@@ -7,6 +7,350 @@` (`pause()`)
- **What:** `cloud_backup` replaced its pauses with `pause()` ("Under --yes nobody is reading … seven seconds of them was over a third of an 18-second game-exit sync"); `cloud_restore` did not: `sleep 2` between phases and `sleep 3` before the summary run on every headless restore, including the `--automatic` half of the startup sync that holds the launch gate.
- **Failure scenario:** Startup sync on any device: restore half completes in ~2 s of work and then sits 5 s doing nothing before the backup half starts; the card and the launch gate are held 5 s longer per boot.
- **Evidence:** restore `main()`: `# Add a pause for better visual separation between operations\n    sleep 2` and `# Add a final pause before exiting\n    sleep 3` (unchanged context in the post-change file); no `pause` function exists in `cloud_restore`. Further parity gaps in the same file: `check_internet` is unconditional in restore's `main` (backup gates it on `--system-only`) — one extra remote round trip per automatic run; restore uses `` `rclone listremotes | head -1` `` where backup added `first_remote` to avoid a ~1 s rclone start; restore's summary prints `Settings backup: COMPLETED`/`Game saves: COMPLETED` for a phase skipped by `--saves-only`/`--system-only` (backup fixed this with `SAVES_OUTCOME`/`SETTINGS_OUTCOME`, #126). `rclone-cloud-sync.md`: "Keep these two scripts structurally in sync". Refutation attempted: looked for an `--automatic` branch that skips the sleeps — none.
- **Fix:** Port `pause()`, `first_remote`, the conditional `check_internet` and the `*_OUTCOME` words to `cloud_restore`.
- **Confidence:** high.

### F-CS-05: Cancel restamping misses the settings stamps and the automatic/sync-composed runs; rows regress to #203's COULDN'T FINISH
- **Severity:** Medium
- **Category:** Player text
- **Where:** `es-app/src/CloudTransferJob.cpp` (new), `restampStoppedParts` PARTS table; `es-app/src/ThreadedCloudSync.cpp` (new), `run()` block `if (cancelled && mOrigin == Origin::Manual)`; `cloud_backup` hunk `@@ -172,6 +602,152 @@` (`record_last_run`), `cloud_restore` hunk `@@ -248,6 +638,182 @@`
- **What:** The scripts write `last-settings-backup`/`last-settings-restore` under `--system-only` (`[ "${SYSTEM_ONLY}" -eq 1 ] && name="settings-backup"`); the page's restamp table maps `cloud_backup`→`last-backup` and `cloud_restore`→`last-restore` only. The card restamps the script stamp only for a Manual Backup/Restore verb; a cancelled automatic run (`Origin::Exit`/`Startup`) or a cancelled manual sync (verb Sync) leaves the scripts' trap-written `epoch 130` in `last-backup`/`last-restore`.
- **Failure scenario:** Player cancels BACK UP SETTINGS TO THE CLOUD on the transfer page → `last-settings-backup` = `<epoch> 130` → the settings row reads COULDN'T FINISH, IT WAS STOPPED. Player launches a game over the startup sync → `last-restore` or `last-backup` = `<epoch> 130` → the BACK UP SAVES / RESTORE SAVES rows read COULDN'T FINISH for a run nobody saw fail — the exact shape #203 fixed for the other case.
- **Evidence:** `static const Part PARTS[] = { { "cloud_content_backup", "last-content-backup" }, { "cloud_content_restore", "last-content-restore" }, { "cloud_restore", "last-restore" }, { "cloud_backup", "last-backup" } };` vs `local name="backup" why=""; [ "${SYSTEM_ONLY}" -eq 1 ] && name="settings-backup"`; `if (cancelled && mOrigin == Origin::Manual) { … if (verb == CloudText::Verb::Backup || verb == CloudText::Verb::Restore) writeStamp(…)`. Refutation attempted: looked for the settings stamps anywhere in the ES diff and for a restamp on automatic origins — none.
- **Fix:** Add `--system-only` → `last-settings-*` to the table (keyed on the flag), and in `ThreadedCloudSync` restamp whichever script stamps carry an mtime ≥ this run's start for every cancelled origin, using the same `restampStoppedParts` logic.
- **Confidence:** high on the writers in the packet; the row reader is outside.

### F-CS-06: The rules-file "whole" guard matches the new first rule, not the catch-all
- **Severity:** Medium
- **Category:** Convention
- **Where:** `cloud_sync_helper` hunk `@@ -36,13 +36,24 @@`; `cloud_sync-rules.txt.defaults` hunk `@@ -5,9 +5,26 @@`
- **What:** `grep -q '^- /\*\*' "${rules}"` is meant to prove the file ends in its catch-all `- /**` before taking a `.bak`; the same diff puts `- /**/*.db` at line 6 of every rules file, which that regex also matches. A file truncated anywhere after line 6 passes as whole and is copied over the last good `.bak`.
- **Failure scenario:** Rules file torn before `- /**` (any non-atomic writer, a power loss during a hand edit) → guard passes → `.bak` replaced with the torn copy → the fallback the guard exists for is gone. Consequence is bounded because the merge rebuilds the file from defaults on the next run, but the guard no longer tests what its comment says.
- **Evidence:** `if grep -q '^- /\*\*' "${rules}"; then cp -f "${rules}" "${rules}.bak.tmp" …` under the comment "the allowlist ends in its catch-all '- /**', and a file cut before that line is not a rules file"; new defaults begin `- /**/*.db`, `- /**/*.db-wal`, …. Refutation attempted: checked whether the merge reads the `.bak` (it does not — so the damage is to the safety copy only).
- **Fix:** `grep -qx -- '- /\*\*' "${rules}"` (anchor the whole line), or test that the *last* non-comment line is `- /**`.
- **Confidence:** high.

### F-CS-07: The transfer page hardcodes A/B in text and matches TRY AGAIN on the literal `"a"` while CLOSE uses `BUTTON_BACK`
- **Severity:** Medium
- **Category:** Convention
- **Where:** `es-app/src/guis/GuiCloudTransfer.cpp` (new), `input()` (`config->isMappedTo("a", input)`), `getHelpPrompts()` (`HelpPrompt("a", …)` beside `HelpPrompt(BUTTON_BACK, …)`), `update()` footer strings
- **What:** `es-ui-style-guide.md` § Interaction rules: refer to buttons by cardinal position, "South confirms, East cancels by default, and the player can swap them, so never hardcode 'press A'". The footer says `A  TRY AGAIN     B  CLOSE` and `PRESS B TO CANCEL.`; the retry check is on `"a"` while back is `BUTTON_BACK`.
- **Failure scenario:** Invert-buttons on: `BUTTON_BACK` is `"a"`, so pressing the back button on a failed run triggers TRY AGAIN (the `"a"` check precedes the generic close), the other button closes, and the help bar shows both prompts on the same button. The footer text is wrong on every swapped controller.
- **Evidence:** `if (!o.completed && config->isMappedTo("a", input)) { … mJob = CloudTransferJob::start(…)`; `prompts.push_back(HelpPrompt("a", _("TRY AGAIN")));` then `HelpPrompt(BUTTON_BACK, …)`; `_("A  TRY AGAIN     B  CLOSE")`, `_("THIS CAN TAKE A WHILE. PRESS B TO CANCEL.")`, `_("PRESS B TO CANCEL.")`. Refutation attempted: looked for `BUTTON_OK` in the file — absent; the same file uses `BUTTON_BACK`, so the swap-aware macro family is available.
- **Fix:** Use `BUTTON_OK` for retry; drop the letters from the footer (the help bar already names the buttons) or word it by action ("TRY AGAIN, OR CLOSE").
- **Confidence:** medium-high (`BUTTON_OK`'s definition is outside the packet).

### F-CS-08: `sweep_partials` walks the entire ROMs tree after every restore, including the boot-time automatic one
- **Severity:** Medium
- **Category:** Resource
- **Where:** `cloud_restore` hunk `@@ -415,30 +1260,144 @@` (`sweep_partials`), hunk `@@ -481,79 +1481,316 @@` (`sweep_partials "${SAVESPATH}"`)
- **What:** `find "$1" -type f -name '*.????????.partial' -exec rm -f {} \;` over `SAVESPATH` (`/storage/roms`) runs unconditionally after the saves transfer — the whole ROM library, not the allowlisted directories — outside every rclone bound (`SYNC_DEADLINE` covers rclone only).
- **Failure scenario:** 40k-file library on a slow SD, cold cache at boot → several seconds of directory walking on the time-to-play path, every boot with SYNC SAVES DURING STARTUP on; the walk also `-exec rm` per match (one process per file if any exist).
- **Evidence:** `sweep_partials() { [ -d "$1" ] || return 0; find "$1" -type f -name '*.????????.partial' -exec rm -f {} \; 2>/dev/null; }` … `RESTORE_STATUS=$?; sweep_partials "${SAVESPATH}"`. Refutation attempted: looked for an `--automatic`/`--recent` skip, a restriction to `savefiles/savestates/screenshots`, or `-newer` the run's start — none.
- **Fix:** Sweep only when the transfer did not complete (rclone renames on success, so a completed run leaves none), restrict to the allowlisted directories, or `-newer` a marker touched at run start; `-delete`/`+` instead of `\;`.
- **Confidence:** medium (the cost depends on library size; the unconditional walk is certain).

### F-CS-09: `post-update` deleted; consumers that read `cloud_sync.conf` without the helper see pre-migration keys until a backup/restore has run
- **Severity:** Medium
- **Category:** Upgrade path
- **Where:** `cloud_backup`/`cloud_restore` `load_config` (helper runs there); `cloud_content_backup` and `cloud_content_restore` (new, `[ -f /storage/.config/cloud_sync.conf ] && source …`, `ROOT="${REMOTENAME}${CONTENT_REMOTE:+${CONTENT_REMOTE}/}"`); `cloud_migrate_layout` (new, `conf_value SAVES_REMOTE`, `saves_src="${saves}"`, `relocate "${remote}${saves_src}" …`); deleted `sources/post-update`
- **What:** The only on-update run of `cloud_sync_helper` (the deleted `post-update`) is gone; the helper now runs only from `load_config`. A device upgraded from upstream holds `SYNCPATH`/`SYNCPATH_BACKUP` and no `SAVES_REMOTE`/`SETTINGS_REMOTE`/`CONTENT_REMOTE` until its first `cloud_backup`/`cloud_restore`. The content scripts and `cloud_migrate_layout` read the new keys raw, with no fallback to the old names.
- **Failure scenario:** (a) Upgrade, open the content picker, back up: `CONTENT_REMOTE` empty → `ROOT=remote:` → ROMs land at `remote:ROMs/<sys>`; after the first saves run the helper derives `CONTENT_REMOTE="/GAMES/Content"` and `resolve_src`'s three fallbacks (`ROMs/<sys>`, flat `<sys>`, legacy root `<sys>`) never look at `remote:ROMs/<sys>` → that upload is orphaned. (b) Upgrade, press TIDY UP YOUR CLOUD FOLDERS: `saves=""`, `saves_src=""` → `--check` prints "Would move … remote:  ->  remote:/ROCKNIX/Saves"; `--apply` runs `rclone copy remote: remote:/ROCKNIX/Saves` — rclone's overlap refusal applies to sync/move, not copy — duplicating the account root into the new folder; the one-way check then fails on the nested copies so `purge` is not reached, but the duplicate stays.
- **Evidence:** `deleted file mode 100644 … sources/post-update`; content scripts: `[ -f /storage/.config/cloud_sync.conf ] && source /storage/.config/cloud_sync.conf` with no helper call ("this script reads the config without running cloud_sync_helper, so on the first run after an update it may not"); `cloud_migrate_layout`: `saves=$(conf_value SAVES_REMOTE)`, `local saves_src="${saves}"`, `relocate "${remote}${saves_src}" "${remote}${NEW_SAVES}" "saves"`. `upgrade-and-install.md`: "cloud_sync_helper only appends what is missing, so an option absent from defaults never reaches an upgraded device." Refutation attempted: looked for an `[ -z "${SAVES_REMOTE}" ]` refusal in `cloud_migrate_layout` (none), for a `SYNCPATH` fallback in the content scripts (none), and for any other on-update trigger of the helper in the packet (none).
- **Fix:** Have every conf consumer run `cloud_sync_helper` first or read old-name fallbacks (`${CONTENT_REMOTE:-${CONTENTPATH:-}}` etc.); make `cloud_migrate_layout` refuse on an empty `SAVES_REMOTE`; restore an on-update hook or document why the OS-level `post-update` covers it.
- **Confidence:** medium — an ES page may run the helper or `cloud_setup` before these rows (outside the packet).

### F-CS-10: `prune_replaced_remote` keeps the lexically newest stamp folder, so a device with its clock behind destroys the record it just wrote
- **Severity:** Medium
- **Category:** Data loss
- **Where:** `cloud_backup` hunk `@@ -342,43 +1220,95 @@` (`prune_replaced_remote`), hunk `@@ -400,90 +1330,257 @@` (`--backup-dir=…/$(date +%Y_%m_%d-%H%M%S)`, `prune_replaced_remote "${REMOTENAME}${replaced_root}"`)
- **What:** The one-cycle record (D-CLOUD-078) is `Saves-replaced/<local wall-clock stamp>`; after a full run the script deletes every folder but the newest by name. A no-RTC handheld whose clock has not yet synced (the startup sync runs seconds after the link settles) stamps a 1970/2019 folder that sorts oldest, and its own prune removes it while keeping another device's or an older folder.
- **Failure scenario:** Startup sync before NTP: this run replaces ten cloud saves into `Saves-replaced/2019_01_01-000012`; `sort -r | tail -n +2` deletes that folder because `2026_09_25-…` (last week's) sorts first → the previous copies of exactly the files this run overwrote are gone immediately.
- **Evidence:** `rclone lsf --dirs-only "${root}/" … | tr -d '/' | grep . | sort -r | tail -n +2 | while read -r d; do … rclone purge "${root}/${d}"`; `all_opts+=("--backup-dir=${REMOTENAME}${replaced_root}/$(date +%Y_%m_%d-%H%M%S)")`; the same script notes "a wrong mtime — written before the clock was set, on a device with no RTC", and `cloud_capture` records `clock_synced` for the same reason. Refutation attempted: looked for a clock-sync check before pruning, or for pruning by rclone modtime rather than name — none.
- **Fix:** Skip the prune unless `timedatectl show -p NTPSynchronized` says yes (as `cloud_capture` already asks), or prune by folder modtime (`lsf --format tp`), or never prune the folder this run created.
- **Confidence:** medium (needs an unsynced clock at the time of a full run; common on the first boot of the day for no-RTC devices).

### F-CS-11: The rules merge activates every previously inert user rule on upgrade
- **Severity:** Medium
- **Category:** Upgrade path
- **Where:** `cloud_sync_helper` hunk `@@ -50,38 +61,83 @@`
- **What:** The old helper appended user rules *after* `- /**`, where rclone never reached them ("a customization was silently ignored while still being visible in the file"); the new helper moves every non-default, non-comment line to the *top*, above the db excludes and the allowlist. Whatever a user typed in the last year — including attempts that never worked — becomes the first-match rule set on the next run, with no notice.
- **Failure scenario:** A user who once added `+ /roms/**` or `+ /**` (trying to sync ROMs; it did nothing) updates → the next backup (including the game-exit `--recent` run, which uses the same rules) uploads the ROM library into the saves folder, the #71 failure by another route. A stale `- /savestates/**` silently stops states syncing.
- **Evidence:** "User rules go FIRST, then the defaults … Placing them ahead of the defaults is also what lets a user's '+ include' beat a default exclusion"; extraction `if ! grep -Fxq -e "$line" /usr/config/cloud_sync-rules.txt.defaults; then echo "$line" >> /tmp/cloud_sync-rules.user`. Refutation attempted: looked for a one-shot marker (as the BACKUPMETHOD migration has), a log line naming the promoted rules, or a sanity check refusing a `+ /**`-class rule — none.
- **Fix:** One-shot migration with a marker: log every promoted rule; refuse to promote a rule that would include a ROM/BIOS path (or require it to sit below the db excludes); or promote only rules added *after* this build (keep pre-existing extras in place, commented, with a log line).
- **Confidence:** medium (depends on how many users edited the file; the mechanism is certain).

### F-CS-12: A customised `RESTOREPATH` refuses every saves transfer with a fix that needs a shell
- **Severity:** Medium
- **Category:** Upgrade path
- **Where:** `cloud_backup` hunk `@@ -188,36 +786,164 @@` and `cloud_restore` hunk `@@ -264,36 +852,160 @@` (`load_config`, RESTOREPATH block); `cloud_sync_helper` hunk `@@ -109,39 +182,171 @@` (RESTOREPATH warning)
- **What:** The old upstream conf invited editing `RESTOREPATH` ("Changing the below to be different from BACKUPPATH will prevent data from being replaced on restore"). A device that did so now fails `load_config` on every backup and restore — the startup sync, the game-exit sync, every row — until the player "Remove[s] the RESTOREPATH line from your cloud sync settings", which nothing on the device offers.
- **Failure scenario:** Upgrade with `RESTOREPATH="/storage/roms/restore"` → every cloud run exits 1 with `AN OLD FOLDER SETTING IS IN THE WAY`; the only remedy is SSH and an editor. `rclone-cloud-sync.md` console-first rule; `upgrade-and-install.md`: "A prompt is a failure mode, not a solution" — this is a refusal without even the prompt.
- **Evidence:** `if [ -n "${RESTOREPATH:-}" ] && [ "${RESTOREPATH%/}" != "${SAVESPATH%/}" ]; then … log_message "… Remove the RESTOREPATH line from your cloud sync settings, then try again." … clean_exit 1`; the helper only logs it. Refutation attempted: looked for the helper commenting the key out or an ES row that edits it — none in the packet.
- **Fix:** Have the helper comment the line out once (`sed -i 's/^RESTOREPATH=/# retired (D-CLOUD-040): &/'`) with a log line; the semantics are gone, so the value is not a choice the player can still exercise.
- **Confidence:** medium (an ES setup page outside the packet might offer to fix it).

### F-CS-13: The deliberate stall ceiling reads no progress from a listing in progress
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `cloud_backup` and `cloud_restore` hunks `@@ -7,6 +7,350 @@` / `@@ -7,6 +7,324 @@` (`progress_mark`, `bounded_rclone`)
- **What:** `progress_mark` counts bytes, checks, files and deletes; rclone's `Checks: 0 / 0, -, Listed N` line (which `CloudTransferJob`'s comment calls "the first sign of life on a run against a large remote") contributes nothing, so a directory whose listing takes longer than `DELIBERATE_CEILING_SECONDS` (36 s by default) is killed as a stall with 124 → YOUR CLOUD STOPPED ANSWERING.
- **Failure scenario:** First BACK UP SAVES against a `screenshots/` folder with ~30k files on Google Drive (~1000 entries per ~1 s call) or a large flat folder on S3 (1000/page) → no check completes for >36 s → kill, `Couldn't finish: your cloud stopped answering`, TRY AGAIN hits the same wall every time.
- **Evidence:** the awk reads `/^Transferred:/`, `/^Checks:/` (first number only: `sub(/[^0-9].*$/, "", s)`) and `/^Deleted:/`; `Listed` is never read. `if [ $((now - since)) -ge "${DELIBERATE_CEILING_SECONDS}" ]; then ended=1; kill -TERM`. Refutation attempted: checked whether rclone begins checks before a directory's listing completes (the march needs both sides of a directory), and whether `Listed` growth is counted — it is not.
- **Fix:** Add the `Listed` count as a fifth field in `progress_mark`/`advance_mark`.
- **Confidence:** medium (depends on remote size and backend paging; the blind spot is certain).

### F-CS-14: `setupSaveState` on the `racommands` path deletes the launched state before copying it to "its new slot"
- **Severity:** Medium
- **Category:** Data loss
- **Where:** `es-app/src/SaveState.cpp` hunk `@@ -163,10 +181,10 @@`
- **What:** Upstream copied the launched state to a *free* slot (`makeStateFilename(nextSlot)`, guarded by `slot + 1 != nextSlot`); the fork replaced `nextSlot` with `slot`, so `mNewSlotFile` is the launched state's own file: `removeFile(mNewSlotFile)` deletes it, then `copyFile(fileName, mNewSlotFile)` fails on a source that no longer exists.
- **Failure scenario:** Any device on the built-in layout (the `es_savestates.cfg` link absent — the cfg's own comment describes that window before PL-001) launches slot 3 → `.state3` removed, copy fails → the state is gone; only the `.auto` copy made a line earlier survives, and `onGameEnded`'s upstream logic for `mNewSlotFile` runs against a missing file.
- **Evidence:** `-if (incrementalSaveStates && nextSlot >= 0 && slot + 1 != nextSlot)` → `+if (incrementalSaveStates)`; `-mNewSlotFile = makeStateFilename(nextSlot);` → `+mNewSlotFile = makeStateFilename(slot);` followed by unchanged `Utils::FileSystem::removeFile(mNewSlotFile); if (Utils::FileSystem::copyFile(fileName, mNewSlotFile))`. This sits inside the `if (racommands)` block; the shipped cfg entry has no `racommands` attribute, so the path is dead while the file is present. Refutation attempted: looked for a guard `mNewSlotFile != fileName` — none; `makeStateFilename` is outside the packet.
- **Fix:** Delete the copy-to-new-slot block (no renumbering, no free-slot semantics remain) or guard `if (mNewSlotFile != fileName)`.
- **Confidence:** medium (reachability depends on the cfg link, managed by scripts outside the packet; the self-collision is certain if `makeStateFilename(slot) == fileName`).

### F-CS-15: A content backup with nothing to send exits 1 and reads COULDN'T FINISH - SOMETHING WENT WRONG
- **Severity:** Medium
- **Category:** Player text
- **Where:** `cloud_content_backup` (new), `--selected)` and `--all)` cases; `es-app/src/CloudTransferJob.cpp` `run()` tail
- **What:** "Nothing to back up: none of the systems you picked have anything on this device." exits 1 with no `>>> why`; the page turns exit 1 with no why into `mFailed.push_back({ …, whyForCode(1) })` = SOMETHING WENT WRONG. `backup_game_saves` returns 0 with a warning for the same situation.
- **Failure scenario:** Player ticks systems the device has no ROMs for (a fresh device that picked before restoring) → BACK UP shows COULDN'T FINISH, SOMETHING WENT WRONG, TRY AGAIN; the row stamps nothing (exit before the lock) so the last outcome is stale.
- **Evidence:** `if [ ${#DIRS[@]} -eq 0 ]; then echo "Nothing to back up: …"; exit 1; fi`; `if (mFailed.empty() && ret != CloudExit::LockHeld && ret != CloudExit::NoNetwork) mFailed.push_back({ Utils::String::toUpper(mUnitLabel), ThreadedCloudSync::whyForCode(ret) });`. Refutation attempted: looked for a `>>> why` or a zero exit on that branch — none.
- **Fix:** Exit 0 with the sentence (nothing failed), or print a `>>> why` in the vocabulary and let the page say SKIPPED.
- **Confidence:** medium (whether ES gates the row on `--list` is outside the packet).

### F-CS-16: `overall` masks a failed settings phase when the saves phase returns 9
- **Severity:** Low
- **Category:** Correctness
- **Where:** `cloud_backup` hunk `@@ -522,53 +1922,88 @@`; `cloud_restore` hunk `@@ -599,23 +1854,43 @@`
- **What:** `local overall=${BACKUP_STATUS}; [ "${overall}" -eq 0 ] && overall=${BACKUP_SYSTEM_STATUS}` — a saves phase that exits 9 (a completion) with a failed settings phase yields 9, COMPLETED.
- **Failure scenario:** Only with `--error-on-no-transfer` in `RCLONEOPTS` (rclone returns 9 only then): saves unchanged (9), archive upload fails (5) → exit 9, stamp `epoch 9`, page COMPLETED.
- **Evidence:** the two lines quoted; `outcome_word` treats 9 as COMPLETED. Refutation attempted: confirmed 9 is treated as success everywhere else, so the branch is inconsistent, not merely narrow.
- **Fix:** `case "${overall}" in 0|9) overall=${BACKUP_SYSTEM_STATUS} ;; esac`.
- **Confidence:** high on the code; the trigger needs a user flag.

### F-CS-17: Dead `--delete-excluded` warning and stale config comments
- **Severity:** Low
- **Category:** Documentation
- **Where:** `cloud_backup` hunk `@@ -268,6 +998,19 @@` (strip) and `@@ -284,31 +1027,166 @@` (`[[ "${RCLONEOPTS}" == *"--delete-excluded"* ]]`); `cloud_sync.conf` hunk `@@ -34,16 +56,81 @@` and `cloud_sync.conf.defaults` hunk `@@ -29,21 +51,67 @@`
- **What:** `load_config` strips `--delete-excluded` unconditionally, so the nested-SETTINGS_REMOTE warning that tests for it can never fire; both conf files still ship `--delete-excluded` in `RCLONEOPTS` and still say `### The default is "sync"` two lines above `BACKUPMETHOD="copy"`.
- **Failure scenario:** none demonstrated (a player reading the conf believes a flag is active that is not).
- **Evidence:** `RCLONEOPTS=$(echo "${RCLONEOPTS}" | sed 's/--delete-excluded//g')` precedes `if [ "${BACKUPMETHOD}" == "sync" ] && [[ "${RCLONEOPTS}" == *"--delete-excluded"* ]]`; `## Backup method\n### The default is "sync", which creates a 1:1 match … BACKUPMETHOD="copy"`.
- **Fix:** Drop the warning or test the original value; remove `--delete-excluded` from the shipped `RCLONEOPTS`; fix the comments in both files (`rclone-cloud-sync.md`'s claim that backup keeps the flag also needs updating).
- **Confidence:** high.

### F-CS-18: `cloud_sync_helper` rewrites the conf, the rules and both `.bak`s on every run — every game exit
- **Severity:** Low
- **Category:** Resource
- **Where:** `cloud_sync_helper` hunks `@@ -36,13 +36,24 @@`, `@@ -50,38 +61,83 @@`, `@@ -94,13 +150,30 @@`, `@@ -109,39 +182,171 @@`; `cloud_backup` `load_config`
- **What:** `load_config` runs the helper before every transfer, including `--recent --automatic`; the helper unconditionally copies the conf to `.new` and renames it over the live file, rebuilds the rules file, and rewrites both `.bak`s — four to six flash writes per game exit even when nothing changed.
- **Failure scenario:** none demonstrated beyond wear and mtime churn (the mtime churn also makes every settings archive differ, since backuptool captures `.config`).
- **Evidence:** `cp -f "${conf}" "${work}"` … `if conf_valid "${work}" && mv -f "${work}" "${conf}"`; `: > "${rules}.new" … mv -f "${rules}.new" "${rules}"`; `cp -f "${rules}" "${rules}.bak.tmp" && mv -f … "${rules}.bak"` with no change detection.
- **Fix:** `cmp -s` before each rename; skip the rules/conf rewrite when the merged output equals the live file.
- **Confidence:** high.

### F-CS-19: The sync card strips non-ASCII from script output, including `>>> offer` arguments
- **Severity:** Low
- **Category:** Correctness
- **Where:** `es-app/src/ThreadedCloudSync.cpp` `run()` (`for (char c : text) if (c >= 32 && c < 127) clean += c;`)
- **What:** The transfer page's `cleanLine` keeps UTF-8 (fixed for #85); the card's loop does not, so a `SAVES_REMOTE` with a non-ASCII name arrives in `mOfferArgs` with those bytes removed, and `CloudOffer::present` receives a folder name that is not the configured one.
- **Failure scenario:** `SAVES_REMOTE="/Spiele/Spielstände"` absent in the cloud → startup sync's `>>> offer create-saves-folder|/Spiele/Spielstände` → card presents an offer about `/Spiele/Spielstnde`; what the offer's action does with it is outside the packet.
- **Evidence:** quoted loop; compare `CloudTransferJob::cleanLine` ("Printable ASCII and every UTF-8 byte").
- **Fix:** Reuse `CloudTransferJob::cleanLine` (or `CloudText`) for the card.
- **Confidence:** medium (depends on `CloudOffer`).

### F-CS-20: `cloud_capture` calls `timedatectl` without a timeout on the synchronous game-exit path
- **Severity:** Low
- **Category:** Resource
- **Where:** `cloud_capture` (new), `SYNCED="false"; [ "$(timedatectl show -p NTPSynchronized --value 2>/dev/null)" = "yes" ]`
- **What:** `cloud_net_ready` wraps every `nmcli` in `timeout 5` because "an unanswered D-Bus call would otherwise wait forever"; `cloud_capture`, run synchronously by ES after every game (per the rule file), makes a D-Bus call to timedated with no bound.
- **Failure scenario:** timedated not answering (a wedged bus after a suspend) → the exit capture blocks for sd-bus's default 25 s → the game-exit flow and the card wait on it.
- **Evidence:** the unbounded call; `nm_state() { timeout 5 nmcli -g STATE general 2>/dev/null; }` in `cloud_net_ready`.
- **Fix:** `timeout 2 timedatectl …`, defaulting to `false`.
- **Confidence:** medium.

### F-CS-21: Listings run with the transfer's retry count
- **Severity:** Low
- **Category:** Convention
- **Where:** `cloud_restore` hunk `@@ -481,79 +1481,316 @@` (`REMOTE_FILES=$(rclone ls … "${RCLONE_NET_OPTS_ARRAY[@]}"`); `cloud_backup` hunk `@@ -491,29 +1588,332 @@` (`rclone size … "${RCLONE_NET_OPTS_ARRAY[@]}"`)
- **What:** `rclone-cloud-sync.md`: "Never give a listing the transfer's count" (#143: 230 s at ten retries on a refused S3 endpoint). `rclone ls` (recursive over all devices' folders) and `rclone size` carry `RCLONE_NET_OPTS` (ten).
- **Failure scenario:** S3 endpoint dies between `check_internet` and the settings phase → the listing rides the SDK backoff until the 36 s deliberate ceiling ends it (bounded, but wrongly attributed as a stall).
- **Evidence:** the two calls; every other listing in the same scripts uses `RCLONE_LIST_OPTS`.
- **Fix:** `RCLONE_LIST_OPTS` on both.
- **Confidence:** high.

### F-CS-22: The conf `.bak` fallback is deleted at the end of every completed run, so it is absent when a torn conf is next met
- **Severity:** Low
- **Category:** Correctness
- **Where:** `cloud_backup` hunk `@@ -179,7 +755,29 @@` and `cloud_restore` hunk `@@ -255,7 +821,29 @@` (`clean_exit`: `rm -f /storage/.config/cloud_sync.conf.bak …`); `cloud_sync_helper` `update_cloud_sync_config` (`conf_valid || return 1` without taking a `.bak`)
- **What:** `load_config` documents "The helper's copy from before this run's update is the fallback"; but the helper refuses to take a `.bak` from a torn conf, and the previous run's `.bak` was removed by `clean_exit` on success. A conf torn between runs therefore has no fallback and the run refuses ("no good copy to fall back on").
- **Failure scenario:** Power loss while ES's setup page writes the conf (outside the packet) → next run refuses and tells the player to set up cloud storage again, although a good copy existed until the last run's `clean_exit`.
- **Evidence:** `case "${exit_code}" in 0|9) rm -f /storage/.config/cloud_sync.conf.bak …`; `if conf_valid "${conf}"; then cp -f "${conf}" "${conf}.bak.tmp" … else … return 1`.
- **Fix:** Keep the `.bak` (it is one small file; D-CLOUD-079's "one record at rest" can be satisfied by overwriting it, not removing it).
- **Confidence:** high on the code; the tear is rare now that the helper writes atomically.

### F-CS-23: `cloud_migrate_layout` runs rclone unbounded, without the lock, and verifies by size on hashless remotes
- **Severity:** Low
- **Category:** Correctness
- **Where:** `cloud_migrate_layout` (new), `relocate`, `resumable`, `has_files`
- **What:** Every rclone call uses rclone's defaults (60 s connect, 5 min idle, 10 low-level and 3 whole-run retries — the behaviour #101 removed everywhere else), no `take_cloud_lock` (a startup or game-exit sync can run against the folder mid-move), and `rclone check --one-way` compares sizes only on WebDAV/SFTP/SMB/FTP, so "verify by content" (`upgrade-and-install.md`) is size-only there. `has_files "$1" "$2"` expands `${extra}` unquoted (`--exclude saves/**` is subject to pathname expansion).
- **Failure scenario:** Migration starts, game exits, `cloud_backup --recent` writes into `/GAMES` while `relocate` is copying it → files written after the copy's listing are purged with the source.
- **Evidence:** `rclone copy "${src}" "${dst}" --create-empty-src-dirs=false`, `rclone purge "${src}"`, no `flock`, no `RCLONE_NET_OPTS`; `--exclude 'backup/**' --exclude 'Backups/**' ${extra}`.
- **Fix:** Take the lock, apply `RCLONE_NET_OPTS`, pass `--download` to `check` when `rclone backend features` reports no hashes, quote `${extra}` as an array.
- **Confidence:** high on the omissions.

### F-CS-24: A run cut by the network after it moved files stamps 69, which the rows read as SKIPPED
- **Severity:** Low
- **Category:** Player text
- **Where:** `cloud_backup` `network_lost_during_run` → `clean_exit "${EXIT_NO_NETWORK}"` → `record_last_run`; `cloud_content_backup`/`cloud_content_restore` `stop_no_network` → `record_outcome … "${EXIT_NO_NETWORK}"`
- **What:** The page learned (#153) that "Skipped means nothing was touched" and reads a 69 after progress as COULDN'T FINISH; the scripts' stamps still record a bare 69 after files moved, and `parseLastRun` maps 69 to `SkippedNoNetwork`.
- **Failure scenario:** Content restore lands three of five systems, link drops → page says COULDN'T FINISH, the row under it says SKIPPED, NO NETWORK.
- **Evidence:** `record_outcome content-restore "${EXIT_NO_NETWORK}"` after units were restored; `else if (code == CloudExit::NoNetwork) r.outcome = Outcome::SkippedNoNetwork;`.
- **Fix:** Stamp a why token when progress was made (`… 69 SOME_FILES_DIDN'T_FINISH`) and let `parseLastRun` prefer a why over the sentinel, or stamp 6.
- **Confidence:** medium (the row reader is outside the packet).

### F-CS-25: A saves folder configured at the remote root makes `--backup-dir` overlap the destination
- **Severity:** Low
- **Category:** Correctness
- **Where:** `cloud_backup` hunk `@@ -400,90 +1330,257 @@` (`replaced_root="${SAVES_REMOTE%/}-replaced"`)
- **What:** `SAVES_REMOTE=""` or `"/"` (the empty-cloud logic explicitly contemplates "a saves folder configured AT the root") gives `--backup-dir=remote:-replaced/<stamp>`, which is inside `remote:/`; rclone refuses a backup-dir that overlaps the destination, so every saves backup fails.
- **Failure scenario:** Root-configured user → `COULDN'T FINISH - SOMETHING WENT WRONG` on every backup after this build.
- **Evidence:** the quoted line and `all_opts+=("--backup-dir=${REMOTENAME}${replaced_root}/…")`. 
- **Fix:** Refuse `--backup-dir` (or place it under a fixed sibling) when `SAVES_REMOTE` is root.
- **Confidence:** medium (rclone's overlap rule for `--backup-dir` is asserted from the script's own comment "rclone refuses a --backup-dir that overlaps the destination").

### F-CS-26: `stopForLaunch` signals once; a run whose `>>> pid` has not arrived is marked stopped but keeps running
- **Severity:** Low
- **Category:** Concurrency
- **Where:** `es-app/src/CloudTransferJob.cpp` `stopForLaunch`
- **What:** `job->mStoppedForGame = true; if (pid > 0) ::kill(-pid, …)` — with `mPid == 0` nothing is killed and nothing retries; `ThreadedCloudSync::cancelForLaunch` polls for the pid for this reason. The run then completes and its outcome reads SKIPPED - YOU STARTED A GAME.
- **Failure scenario:** STOP IT AND PLAY pressed within the first tens of milliseconds of a run (the seam the class comment calls rare).
- **Evidence:** the quoted lines; compare `cancelForLaunch`'s loop "Its first line had not arrived when we looked … Signal it as soon as it says who it is."
- **Fix:** Re-send on the reader thread when `>>> pid` arrives with `mStoppedForGame` already set.
- **Confidence:** medium (the caller's wait is outside the packet).

### F-CS-27: rclone's `package.mk` now depends on a browser engine, Python and a fork package
- **Severity:** Low
- **Category:** Build/packaging
- **Where:** `projects/ROCKNIX/packages/network/rclone/package.mk` hunk `@@ -4,18 +4,41 @@`
- **What:** `PKG_DEPENDS_TARGET="toolchain fuse rsync qrencode Python3 webkitgtk cloud-signin-window glib-networking jq"` — the sign-in browser and its TLS stack ride on the rclone package for scripts (`cloud_oauth`, `cloud_remote`) that are not in this bucket, and `cloud-signin-window` is not in the packet.
- **Failure scenario:** none demonstrated on-device; the image grows by WebKitGTK on every target that ships rclone.
- **Evidence:** the quoted line and the `cp cloud_oauth`/`cp cloud_remote` lines.
- **Fix:** Split the sign-in surface into its own package (`cloud-signin-window` already exists) that depends on rclone, not the reverse.
- **Confidence:** high on the dependency; the size cost is not measurable from the packet.

### F-CS-28: Test provenance and rule files have drifted from the code; no French for the new strings
- **Severity:** Low
- **Category:** Test gap
- **Where:** `es-app/tests/unit/CloudTextTests.cpp` "every protocol shape an emitter prints" table; `.claude/rules/rclone-cloud-sync.md`; `.claude/rules/es-player-text.md` § D-UI-051
- **What:** The table attributes `>>> why THE UPLOAD COULDN'T FINISH` to `cloud_content_backup:158` and `cloud_content_restore:162`; neither script in the diff prints that sentence (they print `why_for`'s), and several `>>> why` sentences the scripts do print (`YOUR SAVES FOLDER ISN'T ON THIS DEVICE`, `THIS DEVICE'S SETTINGS BACKUP IS DAMAGED`, `THE COPY IN YOUR CLOUD ISN'T COMPLETE`, `AN OLD FOLDER SETTING IS IN THE WAY`) are absent, so the "no emitter's line is unplaceable" guarantee is checked against a stale list. `rclone-cloud-sync.md` still says "there is no PKG_SHA256", "Tools entries are the symlinks", "`--delete-excluded` is safe on backup … cloud_backup now warns", and the manager calls `--rescan` — each contradicted by this diff. The bucket adds dozens of `_("")` strings and no `.po` change is in the packet (D-UI-051: French in the same commit).
- **Failure scenario:** none demonstrated.
- **Evidence:** `{ ">>> why THE UPLOAD COULDN'T FINISH", ProtocolKind::Why, "cloud_content_backup:158, cloud_content_restore:162" }`; `grep` of the two scripts' `echo ">>> why`/`say_why` sites shows `why_for` and `YOUR CLOUD STORAGE ISN'T SET UP YET` only.
- **Fix:** Regenerate the table from the scripts (a build-time grep would keep it honest); update the rule file; add the French or say where it lives.
- **Confidence:** high for the table; medium for the `.po` (may be in another bucket).

## 3. Upstream fit

- **The distribution half cannot merge without the ES half.** Removing the `/usr/config/modules/cloud_{backup,restore}.sh` symlinks (package.mk hunk `@@ -47,7 +87,13 @@`) deletes the only entry point upstream ES has; the scripts speak a `>>> ` protocol, exit 75/69, take `--automatic`/`--recent`, and gate on `cloud_net_ready`, none of which upstream ES reads. A maintainer will ask for the ES pin bump and the package in one coordinated change, with the Tools symlinks kept until then.
- **Scope of the rclone package.** One package now installs eleven scripts, a manifest recorder with its own JSON schema (`docs/save-manifest-schema.md`, outside the packet), a network gate, a card guard, and depends on jq, Python3, qrencode, WebKitGTK, glib-networking and a fork package (F-CS-27). Upstream would split: rclone (binary + backup/restore/helper), cloud-setup (setup/oauth/remote/signin), and the manifest tooling as its own package or left in the fork until #22 lands.
- **Version bump bundled in.** rclone 1.71.0 → 1.75.1 with per-arch hashes is a separate, reviewable change; the comment "pinned to OUR version" and the stripped-size aside will not survive review.
- **Comments are a fork changelog.** Nearly every function carries fork issue numbers (#21, #83, #94, #99…), decision IDs (D-CLOUD-xxx, D-UI-xxx), dates, VM names (MinIO, LINK5, "guest d") and quotes from the maintainer. Upstream reviewers will ask for the reasoning kept and the provenance moved to commit messages; `tools/last-good-scripts-test` and `tools/cloud-round-trip` are referenced from shipped scripts and do not exist upstream.
- **Deleted `post-update`.** Removing a package's update hook needs a stated replacement (F-CS-09); upstream's own `post-update` still expects to call the helper.
- **Config defaults changed underneath users.** `BACKUPMETHOD` default flipped to `copy` with a one-shot rewrite of existing configs, the layout defaults moved from `/GAMES` to `/ROCKNIX/*`, and `RESTOREPATH` retired with a hard refusal — each is a behaviour change to upstream users' existing setups and should be called out in the PR body rather than discovered.
- **`es_savestates.cfg`** relies on `userconfig-setup` and the OS `post-update` linking it (both outside this bucket); the file's own comment says so. Ship the three together.
- **Hygiene.** SPDX headers and ROCKNIX copyright present on every new script; no credentials, tokens, personal paths or host names beyond device labels in comments. Rule files in the standard (`rclone-cloud-sync.md`) describe the pre-diff package in several places (F-CS-28) — a PR that changes the contract should change the doc in the same change. Odd indentation in `SaveState.cpp` (`else\n\t\t\t  if (!fileName.empty())`) and the `cloud_sync-rules.txt`/`.defaults` duplication (identical content in two files) would draw comments.

## 4. Coverage boundary

Not judged from this packet, needed to close several findings:

- **Scripts outside the bucket but called by it:** `cloud_setup` (`--seed-folders`, `--accept-saves-root`, `--check`), `cloud_device_id` (`--label`, `--previous`, `--legacy` — the archive-retention and manifest-adoption logic depends entirely on what it returns), `cloud_oauth`, `cloud_remote`, `backuptool` (archive naming, `--then-cloud`, the `>>> why` lines the test table attributes to it), `runemu.sh`/`setsettings.sh` (what `-state_slot -1`/`-state_file` alone do; where `.srm` files are written — `row_retroarch` records the save beside the ROM, and a device with `savefiles_in_content_dir` off would capture states but no game saves).
- **ES code outside the bucket:** `main.cpp` (the startup and journey compositions; whether `--all` is truly what runs), `GuiMenu` (the row readers `cloudLastRunDetail`, menu paths named in messages — `GAME SETTINGS > MANAGE CLOUD STORAGE` vs `MANAGE CLOUD STORAGE > BACK UP TO THE CLOUD` are both used), `FileData::launchGame` (the capture call and launch gate that consume `stopForLaunch`/`cancelForLaunch`), `CloudOffer`, `ProxyCards`, `OfflineAchievements`, `AsyncNotificationComponent` (thread-safety of `updateText`/`close` from the worker), `SaveState.h` (`isSlotValid`, `makeStateFilename`), `SaveStateConfigFile` (the `racommands` default without the cfg), `Utils::String::shellQuote`, `ApiSystem::executeScriptLegacy`, `SaveStateBookkeeper::shutdown`'s caller, `DisplayAspect`, the `.po` files.
- **OS pieces:** `userconfig-setup` and the OS-level `post-update` (who seeds `/storage/.config` and links `es_savestates.cfg`; whether anything else runs `cloud_sync_helper` on update), `var-log.mount` (the scripts disagree on whether `/var/log` is tmpfs), `essway.service` KillMode.
- **Runtime facts asserted in comments and not testable here:** busybox applet coverage (`find -quit`, `sed` `\n` in replacements, `timeout -k`, `flock -n`, `sleep 0.25`), rclone 1.75.1 behaviour (`copy` on overlapping paths, `--max-delete` on `delete`, `rclone size` on a file path, `--backup-dir` with `--no-traverse`), Dropbox/Drive listing rates that decide F-CS-13's likelihood, and every VM/device proof the comments cite (`tools/last-good-scripts-test` cases h and n, `tools/cloud-round-trip`, `tools/cloud-capture-stamp-test`) — none of those tools or their outputs are in the packet, so the shell logic here is judged by reading, not by a run.
- **Layout arithmetic** in `GuiCloudTransfer` and `GuiSaveState` (row heights, label shares, the 640x480 fits) needs frames; nothing in the packet proves or refutes the numbers.
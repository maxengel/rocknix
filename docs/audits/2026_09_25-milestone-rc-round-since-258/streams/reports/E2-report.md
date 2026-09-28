# Stream E2 report: EmulationStation application (audit #307 / #308)

**Branch:** `feature/pl-e2` in `/home/max/Development/emulationstation-next.worktrees/pl-e2`. Base `7eae8ed91` (the ROCKNIX pin). 39 commits, nothing pushed, working tree clean. The branch builds nothing and touches no device.

The commit titles were rewritten once, locally, before this report, to meet the brief's `<package>: <text>` shape. Only the first line of each message changed, and the tree is identical to the pre-rewrite tip (`git diff 72cdc4ed3 HEAD` is empty). The hashes below are final.

```
git log --oneline 7eae8ed91..HEAD
187ff9f1c FileData: no rotation record from a launch that did not run
6c4b0b688 tests: cases for LaunchCommand.h, beside runemu.sh's own reading
c48d8d469 SystemData: the link-up index retry at most once in ten minutes
cc8c5ccb4 ThreadedHasher: an offline index counts nothing and toasts nothing
5443b5301 AppWindow: workers stop posting once main() lets the window go
fe8ed1551 GuiMenu: INCREMENTAL SAVE STATES cites the launcher that reads it
111c9be66 GuiMenu: cloudSetupPresent's comment back above it
9f02eeec0 GuiMenu: the hub rows dim with MultiLineMenuEntry::setDimmed
52ba93160 GuiMenu: the content picker moves BIOS alone; an empty file counts
bf8c6ce75 GuiMenu: the transfer form's switches let go of the rebuild
98c7592c8 GuiMenu: the sync row and its confirmation read the same run
731252c61 GuiMenu: cloud_remote create's output is masked in the log
fa57923af SaveStateBookkeeper: a queued deletion waits out a cloud transfer
0a470e5dc GuiMenu: CONNECTED says whether saves already sync
a65103644 GuiMenu: the sign-in wait trusts the listener; leaving cancels it
ca4133e3c ViewController: nothing from before is written after a reset
275c4200f GuiMenu: a maintenance failure says the script's why
39d5a9d6d GuiMenu: two cloud row descriptions back to one line
e98bfda4b GuiMenu: one cloud_setup --info on the hub; a changed folder shows
3b5b851ec GuiMenu: the restore page's passwords reach the disk
ec943c803 GuiMenu: restore page Wi-Fi behind a spinner; LATER, FINISH true
c053babb3 RetroAchievements: no FileData walk on the summary's worker thread
19319821c RetroAchievements: offline, the summary does not ask for a web key
5a7afc4ca GuiCloudTransfer: the player's own buttons, and a help bar for them
53a444e91 TextFit: the long-job pages fit a line on characters, not bytes
c2302ef25 ViewController: forget screenshot caches when the library changes
bcbe0cf88 FileData: a deferred launch finds its save state again by file
ab01c79b6 FileData: a capture failure is said even when the exit is superseded
d96c8979e FileData: PLAY NOW's answer does not outlive its launch
7b7f2f9ee OfflineAchievements: stop only the run that holds the lock
0adda3f78 FileData: a launch waits for the last game's capture
9b7b1d3a2 SystemData: a rescan keeps the FileData of files still on disk
d75fb3866 GuiMenu: a cloud row greyed before setup runs once setup is done
1209ac249 GuiMenu: the picked cloud folder names reach the shell quoted
8fb12b185 JourneyTiers: the settings-first continuation runs what was ticked
c6c7b24af ProxyCards: drop the send-showing flag nothing read
bbfa1d43b ProxyCards: a stopped top-up says so; a why is this run's own
8b6d47d46 ProxyCards: one top-up watcher, and a request that waits is kept
1cf15dead ProxyCards: the account sentence needs the flush stamp
```

**Rules read this session:** everything under `.claude/rules/` from the session context, plus a line-by-line diff against `next` for the five that differ: `engineering-practices`, `upgrade-and-install` (D-WORKFLOW-050 "Already written"), `es-native-ui` (§ The cards at the link's return, D-UI-109), `es-player-text` and `es-code-traps`.

**Decision rows cited:** D-UI-109, D-UI-093, D-UI-107, D-UI-022, D-UI-023, D-UI-028/030, D-UI-078, D-UI-095, D-INFRA-010 and D-WORKFLOW-050.

## Test harness this stream added

`es-app/tests/unit/**` is E1's, so this stream's cases live in two places:

- **`tests/app-unit/`**: a CMake and doctest project built with the host compiler under AddressSanitizer and UBSan. It holds three binaries:
  - `app-unit-tests`: the pure headers.
  - `proxycards-tests`: the shipped `ProxyCards.cpp`, copied at configure time and compiled against doubles in `tests/app-unit/fakes/`.
  - `bookkeeper-tests`: the shipped `SaveStateBookkeeper.cpp` against doubles, with a real flock held by a real process.
- **`tests/*.py`**: scripts in the shape of `cloud-oauth-lifetime.py`. Each one extracts a shipped function from the source unchanged, compiles it against doubles and runs it.

New header-only files: `AppWindow.h`, `FolderMerge.h`, `JourneyTiers.h`, `RunLock.h` and `TextFit.h`. No CMakeLists outside my list changed.

## Punch items

### PL-014: resolved, `9b7b1d3a2`

- **Change:** the rescan no longer uses `clear()` + `populateFolder`. It reads the folder into a fresh tree and merges it (`FolderMerge::merge`):
  - a file still on disk keeps its FileData, so the collections, the group folder and the hasher's queue stay valid;
  - new entries move in and are indexed;
  - vanished entries have their collection entries dropped (without `needsSave`) and the group folder's pointer removed, then they are deleted;
  - the fresh tree's duplicates are deleted with the filter index set aside;
  - the group's view is dropped and remade.
- **Wait:** the rescan now waits while the index, the scraper or a game holds files.
- **Test:** `app-unit-tests`, `FolderMergeTests.cpp`, three cases.
  - FAIL against today's semantics: `CHECK( tree.deleted.count(h) == 0 ) is NOT correct!` three times, and `CHECK( find(live, "/r/b.nes") == b )`.
  - PASS: 9 of 9 cases then, 52 assertions.
- **Already written:** nothing inherited. The tree is memory, and the folder and custom collection files are only read.
- **Integrator, on the VM:** the soak. Change a folder under a game list with a collection open, 200 iterations, no crash. The SystemData half (collections, group folder, index, views) has not been exercised against the real classes.

### PL-029: resolved, `8fb12b185`

- **Change:** the restore form writes the ticks on YES to `/storage/.cache/cloud_sync/journey-tiers` (`JourneyTiers.h`). That directory is not captured by the settings backup.
  - `--then-cloud` is passed only when something besides settings is ticked, and the dialog without "ANYTHING ELSE" is used otherwise.
  - `main()` builds the continuation from the record, and the prompt names the ticked tiers.
  - A record with no marker is removed.
- **Test:** `JourneyTiersTests.cpp`, six cases.
  - FAIL (today's command, extracted unchanged): `CHECK_FALSE( has(cmd, "cloud_content_restore") ) is NOT correct!` with `rc=0 ; _t=0 ; { /usr/bin/cloud_content_restore --all ; } ...`.
  - PASS: 30 assertions.
- **Already written:** read both. A marker from an earlier build has no record, so it keeps the old continuation and the old prompt.
- **Strings:** eight new, with French.
- **Integrator, on the VM:** tick settings and saves, restore settings first, restart, answer YES. The journal must show no `cloud_content_restore`. The done page lists the tiers the continuation ran (SAVES); the settings tier reported on its own page before the restart.

### PL-030: resolved (C++ half), `1209ac249`

- **Change:** `cloudSetSystemsCommand` sends the joined names as one argument through `cloudShellQuote`.
- **Test:** `tests/cloud-set-systems-quoting.py`.
  - FAIL: 3 of 5, e.g. `FAIL ['a$(touch .../ran)b']: the name ran a command (ran was created)`.
  - PASS: 5 of 5.
- **Already written:** nothing inherited.
- **Stream A's half:** the script's refusal of names outside `[A-Za-z0-9._-]`.

### PL-054: resolved, `1cf15dead`

- **Change:** the account sentence is said only when the flush stamp came. With an empty queue and no stamp the card reads COMPLETED alone, with token `completed`.
- **Test:** `proxycards-tests`, "send card: an empty queue without the flush stamp says COMPLETED alone".
  - FAIL: `CHECK( card->action.empty() )`, with action `WHAT YOU EARNED OFFLINE IS NOW ON YOUR ACCOUNT. | NOW ON YOUR ACCOUNT.`
  - PASS.
- **Already written:** nothing inherited; the card's words are not stored.

### PL-056: resolved, `8b6d47d46`

- **Change:** `topUp` records the request and starts a watcher only when `sTopUpRunning.exchange(true)` finds none running.
  - A bare exchange would have dropped the index's `--after-index` run, the one that lists newly found games. So the single watcher runs the requests that arrive while it works, the index's first.
  - A later run waits for a running game to end.
- **Test:** "top-up: two requests, one watcher at a time, and the second still runs".
  - FAIL: `CHECK( maxOpen.load() == 1 )` with `CHECK( 2 == 1 )`, plus a COULDN'T FINISH card.
  - PASS: the ctl ran `[topup, topup --after-index]`.
- **Already written:** nothing inherited.

### PL-061: resolved, `0adda3f78`

- **Change:** the exit marks the capture in flight by its generation. `captureGate` is first among the launch gates.
  - It waits 300 ms on the interface thread, then up to 10 s behind RECORDING YOUR LAST GAME'S SAVES... (new string, with French).
  - A launch that waited owns the exit sync.
  - Past the bound the game starts anyway, and that capture is not waited for again.
- **Test:** `tests/launch-capture-gate.py`.
  - FAIL against a gate that never waits: five checks, e.g. `FAIL a slow capture: the launch waits behind the spinner`.
  - PASS: nine checks.
- **Already written:** nothing inherited.
- **Integrator, on the VM:** relaunch inside a capture and read the journal order. "launch: waiting for the last game's saves to be recorded" or "... were recorded first" comes before the second "Attempting to launch game...".

### PL-062: resolved, `d75fb3866`

- **Change:** a gated row re-checks `rclone.conf` (uncached) at the press. Once it finds the cloud set up it runs, and stops drawing dim.
  - This covers every page with gated rows.
  - The transfer rows share one press handler, so a current run still opens its page.
- **Test:** `tests/cloud-gated-row.py`.
  - FAIL: `FAIL after setup: the press ran the row 0 times and pushed 1 page(s) -- dialog: NO CLOUD STORAGE IS SET UP ...` and `the row still draws dimmed`.
  - PASS.
- **Already written:** nothing inherited.
- **Integrator:** the walk. Set up from a gated row, FINISH, and the row runs.

### PL-068, E2's half (added by the coordinator): resolved, `fa57923af`

- **Change:** the bookkeeper's queued deletion waits while `/var/run/cloud_sync.lock` is held. The check is my own `RunLock::held`, a shared flock taken for an instant.
  - It polls twice a second and logs "waits" and "goes ahead".
  - At exit it waits five seconds and then does not delete; the file stays.
  - The lock path is a macro so the test can hold its own lock. The integrator may point the call at E1's `isFlockHeld` once merged.
- **Test:** `bookkeeper-tests`, three cases.
  - FAIL: `CHECK( fileExists(state) )` "the state was deleted under a transfer", also at exit.
  - PASS: 3 of 3, 10 assertions.
- **Already written:** nothing inherited.
- **Integrator, on the VM:** hold the lock with `flock /var/run/cloud_sync.lock sleep 60`, queue a DELETE from the manager, and read the journal.

## Sweep rows (#308): 70 rows

Withdrawn rows marked "no stream" name files that appear in no stream's list: CloudTransferJob, CaptureRotation*, DisplayAspect*, NetworkThread, GuiScraperRun, GuiScraperStart, GuiBios, LaunchCommand.h, OfflineScanJob and `tests/credential-quoting.py`. Those rows are the integrator's.

| # | packet / seat / id | verdict |
|---|---|---|
| 1 | 1-raoffline claude F-RA-05 | fixed `cc8c5ccb4`. `tests/hasher-offline-index.py` FAIL "got: INDEXING COMPLETED. UPDATE GAMELISTS TO APPLY CHANGES."; PASS 5 checks. It also closes the empty-queue race where the threads could delete the hasher before `start()` read it. |
| 2 | 1-raoffline claude F-RA-08 | fixed `7b7f2f9ee`. `RunLockTests`: FAIL `CHECK( 3202022 == 0 )` (a live pid under an unheld lock); PASS. `stopRun` requires the lock held and `raofflineproxy-ctl` in the pid's cmdline. |
| 3 | 1-raoffline claude F-RA-09 | fixed `bbfa1d43b`. Three cases FAIL then PASS: a stop for a game says SKIPPED - YOU STARTED A GAME; the why comes only from this run's stamp; SOME GAMES COULDN'T BE SAVED appears without the scan instruction (one new string, with French). |
| 4 | 1-raoffline claude F-RA-14 | fixed `5a7afc4ca`. Retry on `BUTTON_OK`, no letters, help bar drawn by the page. No test (InputConfig and Window). |
| 5 | 1-raoffline claude F-RA-15 | fixed `19319821c`. The offline branch drops the web-key check; the `proxyOffline` header is corrected. No test. |
| 6 | 1-raoffline claude F-RA-16 | withdrawn, refuted: `es-untranslated: 564 fork string(s) in the source, 564 with French, 0 without`. |
| 7 | 1-raoffline claude F-RA-17 | fixed for ProxyCards: `c6c7b24af` (`sSendShowing`) and `8b6d47d46` (`sTopUpRunning` now read, `TopUpEnd` gone). `(void) self` in OfflineScanJob.cpp: no stream. Scripts: stream D. |
| 8 | 1-raoffline claude F-RA-18 | fixed `c053babb3`. The worker no longer walks FileData; the page constructor fills the console name. No test. |
| 9 | 5-cloud claude F-CS-05 | withdrawn, not mine: CloudTransferJob.cpp (no stream), ThreadedCloudSync (E1). |
| 10 | 5-cloud claude F-CS-07 | fixed `5a7afc4ca`. |
| 11 | 5-cloud claude F-CS-15 | withdrawn, not mine: `cloud_content_backup` (A), CloudTransferJob (no stream). |
| 12 | 5-cloud claude F-CS-26 | withdrawn, not mine: CloudTransferJob (no stream). |
| 13 | 8-es claude F-ES-02 | fixed `ec943c803`. Wi-Fi via `networkApplyWifi`, with system.cfg written first. No test. |
| 14 | 8-es claude F-ES-03 | fixed `e98bfda4b`. One `cloud_setup --info`; the unused name is dropped. |
| 15 | 8-es claude F-ES-04 | duplicate of PL-030, `1209ac249`. |
| 16 | 8-es claude F-ES-05 | withdrawn, not mine: GuiScraperRun.cpp (no stream). |
| 17 | 8-es claude F-ES-06 | withdrawn, not mine: GuiBios.cpp (no stream). |
| 18 | 8-es claude F-ES-07 | fixed `d96c8979e`. PLAY NOW is consumed at `launchGame` entry. No test. |
| 19 | 8-es claude F-ES-08 | fixed in part, `187ff9f1c`: `recordAfterSession` is called only after exit 0, which covers both of the finding's failed-launch scenarios. The -1→0 fold and the log's age are in CaptureRotation (no stream). |
| 20 | 8-es claude F-ES-09 | fixed `c48d8d469`. The link-up index retry runs at most once per 10 minutes. No test. |
| 21 | 8-es claude F-ES-10 | fixed `ca4133e3c`. `ViewController::configurationReplaced()` stops `saveState` after a maintenance restart and after the settings-first restart. No test. |
| 22 | 8-es claude F-ES-11 | fixed `bcbe0cf88`. The state is carried by file and re-found in `launchNow`. `tests/launch-deferred-state.py` FAIL "handed an object the refresh deleted"; PASS. |
| 23 | 8-es claude F-ES-12 | fixed `ec943c803`. The LATER row appears only when the marker exists. |
| 24 | 8-es claude F-ES-13 | fixed `275c4200f`. `maintenanceWhy`: `tests/maintenance-why.py` FAIL `got "tar: short read"`; PASS. It keeps backuptool's fuller fail sentence when that sentence carries the why. |
| 25 | 8-es claude F-ES-14 | fixed `39d5a9d6d`, measured with FreeType on Roboto-Bold at 20 px/780 and 15 px/620. WITH MY PHONE (929/780) and CHANGE CLOUD FOLDER (path-dependent) were shortened; two new strings with French. CONNECT OR REPAIR (771/780) and WI-FI PASSWORD (732/780) fit and were left. |
| 26 | 8-es claude F-ES-15 | fixed `c2302ef25`. `forgetScreenshots()` is called on a changed rescan and in `reloadAllGames`. No test. |
| 27 | 8-es claude F-ES-16 | fixed `a65103644`. `sleep_for` replaces the shell `sleep`. |
| 28 | 8-es claude F-ES-17 | withdrawn: D-INFRA-010 decided "The SSH setup page still shows the password in full ... masking it would defeat the page". The style guide could cite it as the exception (integrator's). |
| 29 | 8-es claude F-ES-18 | fixed `fe8ed1551`. The comment now cites `setsettings.sh set_savestates`, where `0|2|false|none` means auto-index off, so `0` and `2` were one behaviour. |
| 30 | 8-es claude F-ES-19 | withdrawn, refuted: nothing in either tree reads `clouddrive.mounted`; `rclonectl` was dropped in `e35e5e85b0` (#6). |
| 31 | 8-es claude F-ES-20 | fixed `6c4b0b688`. `LaunchCommandTests.cpp`, 5 cases (header untouched). They found a runemu.sh divergence (see below). |
| 32 | 8-es claude F-ES-21 | fixed `731252c61`. `maskSecrets` on the logged output. |
| 33 | 8-es claude F-ES-22 | withdrawn, not mine: GuiScraperStart.cpp (no stream). |
| 34 | 8-es claude F-ES-23 | withdrawn, refuted and not mine: GuiBios.cpp:28-30 hold raw UTF-8 `EF 81 98` / `EF 81 B1` / `EF 84 A7` (U+F058/F071/F127). |
| 35 | 8-es claude F-ES-25 | fixed `9f02eeec0`. `CloudDimmableEntry` deleted. Behaviour diff: the same 0x50; the survivor applies the dim at once instead of on the next frame; nothing else. |
| 36 | 8-es claude F-ES-26 | fixed `5443b5301`. `AppWindow::post` / `closing()` (lock held across the post). `AppWindowTests` FAIL `CHECK( w.postsAfterGone == 0 )`; PASS. Also applied to ProxyCards' workers. |
| 37 | 8-es claude F-ES-27 | fixed `e98bfda4b`. The editor's success reopens the hub (push, then close). |
| 38 | 8-es claude F-ES-28 | withdrawn, not mine: GuiBios.cpp (no stream). |
| 39 | 8-es claude F-ES-29 | withdrawn, not mine: `es-app/tests/unit/README.md` (E1). |
| 40 | 8-es claude F-ES-30 | withdrawn, refuted: `start()` calls `Process()` synchronously (ThreadedScraper.cpp:310), and it resets `sProgress` (:37) before the worker starts (:53) and before the page is pushed. |
| 41 | 1-raoffline gpt F-RA-16 | duplicate of claude F-RA-08, `7b7f2f9ee`. |
| 42 | 1-raoffline gpt F-RA-17 | fixed `bbfa1d43b`. |
| 43 | 1-raoffline gpt F-RA-21 | **not fixed.** es-code-traps.md on `next` names it #300's follow-up ("not a one-line change"). The stall bound (ES `9202ebed5`) caps the freeze at about 40 s. Moving the fetch changes the hasher's lifecycle: `mInstance`, the lookup-day stamp, NO GAMES FIT and the exception answer. Row 20's back-off limits the repeats meanwhile. |
| 44 | 1-raoffline gpt F-RA-22 | fixed `5a7afc4ca`. |
| 45 | 1-raoffline gpt F-RA-23 | fixed `53a444e91`. `TextFitTests`: FAIL `CHECK( validUtf8(s) )` (14 checks); PASS. |
| 46 | 1-raoffline gpt F-RA-25 | withdrawn, refuted by design: es-native-ui.md on `next`, § The cards at the link's return (D-UI-109), describes "the send card, and the top-up's card stacked under it". The top-up attaching during the send's outcome is that batch, so `sSendShowing` was dead (row 7). |
| 47 | 5-cloud gpt F-CS-23 | withdrawn, not mine: CloudTransferJob (no stream). |
| 48 | 5-cloud gpt F-CS-24 | withdrawn, not mine: CloudTransferJob (no stream). |
| 49 | 5-cloud gpt F-CS-32 | fixed `53a444e91`. |
| 50 | 5-cloud gpt F-CS-36 | fixed `5a7afc4ca`. |
| 51 | 8a gpt F-ES-05 | fixed `ab01c79b6`. The capture-failure toast now comes before the generation check. No test. |
| 52 | 8a gpt F-ES-06 | fixed `ec943c803`. The cloud-menu row passes `consumeMarker=true`; the history in `d676ceb6a` explains the old `false`. |
| 53 | 8a gpt F-ES-07 | duplicate of claude F-ES-02, `ec943c803`. |
| 54 | 8a gpt F-ES-08 | withdrawn, not mine: CaptureRotation (no stream). The call-site gate `187ff9f1c` covers only failed launches. |
| 55 | 8a gpt F-ES-09 | fixed `c2302ef25`. |
| 56 | 8a gpt F-ES-10 | fixed `52ba93160`. Rows count files that would move, whatever their size. BIOS alone moves with selection `bios`, because `--selected` refuses an empty selection before adding bios. No test. |
| 57 | 8a gpt F-ES-11 | fixed `bf8c6ce75`. The switches' callbacks are cleared in `onFinalize`. No test. |
| 58 | 8a gpt F-ES-12 | withdrawn, not mine: GuiScraperRun (no stream). |
| 59 | 8a gpt F-ES-13 | withdrawn, not mine: GuiScraperRun (no stream). |
| 60 | 8a gpt F-ES-14 | withdrawn, upstream fit for #256: WIN32 is never built for ROCKNIX and no Windows toolchain exists here, so a guarded path would be unproven. |
| 61 | 8a gpt F-ES-15 | withdrawn, not mine: GuiScraperRun (no stream). |
| 62 | 8a gpt F-ES-16 | fixed `98c7592c8`. `cloudLatestRun` is shared. `tests/cloud-sync-last-run.py` FAIL "explains an older run than the row shows"; PASS. |
| 63 | 8a gpt F-ES-17 | fixed `a65103644`. `cloudOAuthOwnSession`. `tests/cloud-oauth-lifetime.py` against the old source: `FAIL phone: ... cancelled 0 times` on all four routes; PASS. |
| 64 | 8a gpt F-ES-18 | fixed `a65103644`. `tests/cloud-oauth-await.py` FAIL "a listener that says it failed is not a started sign-in"; PASS. |
| 65 | 8a gpt F-ES-19 | fixed `0a470e5dc`. The advice follows `cloudsaves.startup` and `cloudsaves.gameexit`; the false "ROMS AND BIOS ... NEVER INCLUDED" is gone. Three new strings, with French. |
| 66 | 8a gpt F-ES-20 | withdrawn: D-INFRA-010 (duplicate of row 28). |
| 67 | 8a gpt F-ES-21 | withdrawn, not mine: DisplayAspectText.cpp (no stream). |
| 68 | 8a gpt F-ES-22 | withdrawn, not mine: GuiScraperStart (no stream). |
| 69 | 8b gpt F-ES-10 | withdrawn, not mine: `tests/credential-quoting.py` (no stream). |
| 70 | 8b gpt F-ES-13 | fixed in part, `5a7afc4ca` (the two pages' letters). GuiScraperRun's PRESS B TO CANCEL has no stream. The sign-in window's CHOOSE WITH A describes `cloud-signin-window.c`'s own binding (stream C). |

## Found on the way (not punch or sweep)

- **Fixed `3b5b851ec`:** the FINISH RESTORE PROCESS sub-pages (RetroAchievements, ScreenScraper, netplay) never wrote their passwords to disk. `addInputTextConfigRow` sets memory only, and `GuiSettings::save` writes nothing on a page with no save function. A restart lost them.
- **For stream B:** `runemu.sh` reads the platform with `${ARGUMENTS##*-P}`. A netplay `--nick 'My-Player'` after `-Psnes` makes the launcher read `layer'`. The case is pinned in `LaunchCommandTests.cpp`.
- **For stream A:** `cloud_content_restore --selected` could add bios before refusing an empty selection; the picker writes `bios` today as the workaround.
- **Test trap, for the integrator (E1's area):** `build-tests/es-unit-tests` is a committed binary. After `git checkout` of it, its mtime is newer than its objects, so the next `cmake --build` does not relink and runs the old binary. Mine read 124 cases instead of 128. Remove the file before building.
- **Rule conflict:** es-player-text.md § Outcome vocabulary, Recover, still says `TRY AGAIN (A)` beside `CLOSE (B)`. `5a7afc4ca` follows es-ui-style-guide.md (no letters, help bar drawn by the page). The player-text sentence wants rewording in the ROCKNIX repo.
- **Not covered by the gate:** ThreadedCloudSync (E1), OfflineScanJob and CloudTransferJob still post from their own threads without `AppWindow::post`.
- **Menu map:** no rows were added, moved or renamed, so `docs/es-menu-map.md` needs no change. The LATER row is now conditional, two row descriptions changed, and the CONNECTED prose changed. The style guide's quoted `RESTORE SETTINGS FIRST, THEN RESTART?` still ships.

## Harness final lines

- **es-syntax-check:** `PASS`. OK on FileData.cpp, GuiCloudTransfer.cpp, GuiMenu.cpp, GuiOfflineScan.cpp, GuiRetroAchievements.cpp, main.cpp, OfflineAchievements.cpp, ProxyCards.cpp, RetroAchievements.cpp, SaveStateBookkeeper.cpp, SystemData.cpp, ThreadedHasher.cpp, views/ViewController.cpp, and views/gamelist/ISimpleGameListView.cpp (a dependent of the changed FileData.h).
- **E1's unit suite** (`es-app/tests/unit`, relinked in `build-tests`, then the committed binary restored): `test cases: 128 | 128 passed`, `assertions: 1360 | 1360 passed`. The case list is identical to the base commit's.
- **tests/app-unit:**
  - `app-unit-tests`: 21 cases, 119 assertions, SUCCESS.
  - `proxycards-tests`: 6 cases, 31 assertions, SUCCESS.
  - `bookkeeper-tests`: 3 cases, 10 assertions, SUCCESS.
- **Scripts:** cloud-set-systems-quoting 5 of 5; cloud-gated-row, launch-capture-gate, launch-deferred-state, maintenance-why, cloud-oauth-await, cloud-sync-last-run and hasher-offline-index PASS; cloud-oauth-lifetime PASS on all four routes.
- **Translations and vocabulary:** `es-untranslated: 564 fork string(s) in the source, 564 with French, 0 without`. `vocabulary-check: 146 string(s) ... 0 wrong`. `msgfmt -c` OK. French was appended at the end only.
- **Comments and line endings:** the ASCII-comment grep over every changed `es-app` file prints nothing, and no CRLF was introduced.

## Could not do

- **gpt F-RA-21:** moving the hash-library fetch off the interface thread is #300's follow-up and a lifecycle change; row 20's back-off is in meanwhile.
- **gpt F-ES-14:** no Windows toolchain to prove a WIN32 path.
- **Files in no stream's list:** CloudTransferJob, CaptureRotation*, DisplayAspect*, NetworkThread, GuiScraperRun, GuiScraperStart, GuiBios, LaunchCommand.h, OfflineScanJob, `tests/credential-quoting.py`. The rows that live there are the integrator's (see the table).
- **Unproven here, left for the integrator's VM steps** (each named in its commit): the PL-014 soak; the PL-029 journal; the PL-061 journal order; the PL-062 walk; PL-068 with a held lock; the frames at 640x480 for the long-job pages' help bar and the two shortened descriptions.

## Follow-up (2026-09-28, on test/qa-integration da702d8b6)

`git merge test/qa-integration` fast-forwarded `feature/pl-e2` to da702d8b6. `build-tests/` was deleted and rebuilt from scratch, as was the app-unit build directory. The follow-up adds 18 commits on `feature/pl-e2`, da702d8b6..435a506b5, all local: no image builds, no guests, no pushes. Every commit whose change has a testable seam had its test seen to FAIL first, with the failure quoted in the body; the commits with no test say why (a word, prose, a signature, or a frame the VM should take). Every body carries an `Already written:` line. Every title matches `^[a-zA-Z0-9_*./-]+: ` and is 72 characters or fewer. One title had a space before its colon. I renamed it to `es-app:` with `filter-branch --msg-filter` over this range and removed the backup refs.

### Commits

| Commit | Title | Seen to fail first |
| --- | --- | --- |
| e30e4dcb9 | GuiMenu: MANAGE SAVED NETWORKS says CONNECTED, as the picker does | a word (no test) |
| c0def453a | GuiWifi: a join that failed says why, by wifictl's exit code | WifiTextTests.cpp:221 `CHECK( 1 == 0 )` |
| d17a68460 | es-app: the scripts' whys in the player's language; one cleanLine | adopts E1's tested helpers |
| 4a87044e7 | GuiScraperRun: the player's own buttons, and a line cut on characters | TextFit's cases |
| 6ae936577 | GuiScraperStart: two comments back to ASCII | the ASCII-comment grep: 2 lines, then 0 |
| 72ef97b54 | GuiBios: file paths as the system expects them; DETAILS only with rows | none (frames) |
| 96da6e7d6 | tests/unit: the README names every source; no count to go stale | prose |
| df44e0ab9 | DisplayAspectText: an extensionless dotted name keeps its dot | `CHECK(  == Dr. Mario )` |
| 190f62550 | CaptureRotation: no record without a launch; a zero where it corrects | CaptureRotationTextTests.cpp:129, 130, 135 |
| d388c2800 | tests: credential-quoting no longer passes std::string(value) | self-test 2 of 9 failed, rc 2; a constructed site read quoted (rc 0) |
| 6b806dd50 | CloudTransferJob: a stop before the pid line reaches the run | jobs-tests 3 of 3 failed (4020 ms, 4021 ms, `CHECK_FALSE( true )`) |
| 8eb4c6821 | ThreadedCloudSync: restamp only the part a stop interrupted, everywhere | CloudTextTests.cpp: 5 assertions in 2 cases |
| 451a2bbd8 | OfflineScanJob: run() without a self it never used | signature only (no test) |
| 4d1ddebc1 | OfflineScanJob: post through AppWindow, as the offer the card asks does | JobsTests.cpp:155 `CHECK( {?} == 1 )` |
| 760458b82 | LaunchCommand: tokens are whole words; its cases join es-unit-tests | LaunchCommandTests.cpp:82-84 (`ro`, `x`, `y'`) |
| 5b6d2e638 | SaveStateBookkeeper: ask the transfer lock the way the manager does | BookkeeperTests.cpp:142 |
| cb32a0481 | CloudText: words for SOME_IMAGES_NOT_SAVED; the scan's why table tested | CloudTextTests.cpp:1443, 1444 |
| 435a506b5 | OfflineAchievementsText: a null unlock count is unknown, not none | OfflineAchievementsTextTests.cpp:332 |

### Task 1: E1's helpers

- **`CloudText::localizedWhy`** is now used on the cloud rows (`cloudReadLastRun` in GuiMenu) and on the transfer page's done line (GuiCloudTransfer): d17a68460. CloudTransferJob keeps the scripts' English why in its failed items and hands it to the page, and the page localizes it where it draws. ThreadedCloudSync already used it (E1).
- **`CloudText::cleanLine`** is now used by CloudTransferJob and OfflineScanJob; their own `cleanLine` only delegates to it: d17a68460.
- **`ApiSystem::joinWifiNetwork` returns the join's exit code** (the other half of claude F-WF-03 / gpt F-WF-06): c0def453a. It returns the script's code when that is non-zero, else 0 or 1 from `WifiText::parseJoin`. GuiWifi picks the words with `WifiText::joinFailure`:
  - code 2: THE WI-FI SERVICE DIDN'T ANSWER. TRY AGAIN IN A MOMENT.
  - any other failure: the forget-and-rejoin key advice.
  - French added.
- **F-WF-11:** MANAGE SAVED NETWORKS marks the joined network CONNECTED instead of IN USE: e30e4dcb9.
  - **For the integrator:** `docs/es-menu-map.md` line 221 still reads "IN USE beside the one the device is on". It should read CONNECTED.
  - No other row's words changed. The msgid CONNECTED already existed with its French.

### Task 2: the 18 rows withdrawn as "not in my files", and the halves

| Row | Finding | Outcome |
| --- | --- | --- |
| 7 | 1-raoffline claude F-RA-17, the OfflineScanJob part | fixed 451a2bbd8. `(void) self` is gone from OfflineScanJob and from CloudTransferJob, which had the same copy. |
| 9 | 5-cloud claude F-CS-05 | fixed 8eb4c6821. The settings stamps are restamped, and the card restamps for every cancelled origin, not only a manual backup or restore. |
| 11 | 5-cloud claude F-CS-15 | ES half withdrawn: **no ES change is needed.** The page already reads a script's exit 0 as COMPLETED and a `>>> why` line as COULDN'T FINISH - <why>. The fix is the script's two `exit 1` "Nothing to back up" branches in `cloud_content_backup` (`--selected` and `--all`). **For the integrator:** that script half is in no stream's brief. I recommend `exit 0` with the sentence, as the finding suggests and as `backup_game_saves` does. |
| 12 | 5-cloud claude F-CS-26 | fixed 6b806dd50. A stop that arrives before the pid is kept and sent when the pid arrives. |
| 16 | 8-es claude F-ES-05 | fixed 4a87044e7 |
| 17 | 8-es claude F-ES-06 | fixed 72ef97b54 |
| 19 | 8-es claude F-ES-08, the CaptureRotation part | fixed 190f62550. A log with no launch banner writes no record, a log older than the launch is not read, and a zero is written where it corrects an earlier turn or the table. |
| 31 | 8-es claude F-ES-20 | now fixed in full, 760458b82. The header reads whole shell words (the words `replaceOptionValue` reads), and its cases moved into es-unit-tests with a netplay-nick case, an escaped-ROM case and a save-state-rewrite case. |
| 33 | 8-es claude F-ES-22 | fixed 6ae936577 |
| 34 | 8-es claude F-ES-23 | still withdrawn, refuted: GuiBios.cpp:28-30 hold raw UTF-8. |
| 38 | 8-es claude F-ES-28 | fixed 72ef97b54 |
| 39 | 8-es claude F-ES-29 | fixed 96da6e7d6. The README since also names LaunchCommand.h and jobs-tests (760458b82). |
| 47 | 5-cloud gpt F-CS-23 | fixed 8eb4c6821. Only the part the trap stamped 130 this run is restamped; a finished part keeps its outcome. |
| 48 | 5-cloud gpt F-CS-24 | fixed 6b806dd50. This also stops a run that had already completed from being called stopped. |
| 54 | 8a gpt F-ES-08 | fixed 190f62550 |
| 58 | 8a gpt F-ES-12 | withdrawn, refuted. The page scales its line pitches by design, within bounds. GuiCloudTransfer's constructor derives it: `getHeight` includes line spacing and a glyph is about 2/3 of its row. The tallest real theme uses 0.88 of the screen height, under the 0.9 threshold. |
| 59 | 8a gpt F-ES-13 | fixed 4a87044e7 |
| 61 | 8a gpt F-ES-15 | fixed 4a87044e7 |
| 67 | 8a gpt F-ES-21 | fixed df44e0ab9 |
| 68 | 8a gpt F-ES-22 | fixed 6ae936577 |
| 69 | 8b gpt F-ES-10 | fixed d388c2800 |
| 70 | 8b gpt F-ES-13, the GuiScraperRun part | fixed 4a87044e7. The sign-in window's CHOOSE WITH A is left as it is: that binding is `cloud-signin-window.c`'s (ROCKNIX repo, stream C). |
| NetworkThread | 8-es claude F-ES-09 (row 20) | nothing remains. The back-off is in `SystemData::startIndexesAtStart` (c48d8d469), which NetworkThread's post calls. |

### Task 3: routing the posts through `AppWindow::post`

Done in 4d1ddebc1.

- **OfflineScanJob:** `changed()` posts through AppWindow now. A dropped post clears the pending mark.
- **ThreadedCloudSync:** its one post is `CloudOffer::present`'s, which the card calls from its worker after the linger. That post now goes through AppWindow. The card's other hand-off, `ProxyCards::afterSync`, already did.
- **CloudTransferJob:** posts nothing. The page reads the job under its lock each frame, so there is nothing to route.
- **Left, and why:** ThreadedCloudSync updates its own AsyncNotificationComponent and closes it from its destructor by direct call, not by post. A run still lingering when main() tears the window down touches a component the window owned. AppWindow cannot gate a direct call. Fixing it means tying the thread's life to the window's, which changes who owns the card. **This is for the integrator.**

### Beyond the list

- **5b6d2e638:** the note from my first report ("point the bookkeeper at E1's `isFlockHeld` once merged") is done. The bookkeeper and the manager's refusal now ask one check, and it fails closed on a lock file that cannot be opened.
  - `RunLock::held` has no application caller left. It stays, pinned by its own cases; retiring it is the integrator's call.
- **Found and fixed on the way (cb32a0481):** at 640x480 the scan page showed the French of SOME GAMES COULDN'T BE SAVED. TRY THE SCAN AGAIN. cut off with an ellipsis: 521 px on a 499 px line. The page now drops the trailing instruction instead of clipping (`shortenWhy` / `chooseThatFits`).
- **Behaviour change to know (8eb4c6821):** a manual backup cancelled before its script wrote any stamp no longer gets `cancelled` written over the last real run's stamp. It keeps that run's stamp, as the transfer page always did.

### Coordinator items (stream D)

1. **SOME_IMAGES_NOT_SAVED** (cb32a0481). **PROPOSED words, for the maintainer to approve:**
   - Scan page and the SCAN GAMES question: `SOME ACHIEVEMENT IMAGES COULDN'T BE SAVED. TRY THE SCAN AGAIN.`
   - Top-up card: `SOME ACHIEVEMENT IMAGES COULDN'T BE SAVED`, without the instruction, as the card already does for SOME_GAMES_NOT_SAVED (F-RA-09).
   - French for both: CERTAINES IMAGES DE SUCCÈS N’ONT PAS PU ÊTRE ENREGISTRÉES[. RELANCEZ L’ANALYSE.]
   - The table moved to `CloudText::scanWhy` / `topUpWhy`, so it now has a doctest case. OfflineAchievements and ProxyCards delegate to it, and proxycards-tests now read the shipped words.
   - Measured at 15 px against the scan page's 499 px line: the whole sentence is 516 px, so the page shows its first sentence (351 px); the French short form is 471 px. At 1280x800 the whole sentence fits.
   - Already written: no stamp an earlier build wrote carries the token.
2. **`unlocked: null`** (435a506b5):
   - `parseStoreGame` reads null as unknown (`StoreGame::unlockedKnown`). A 0 is still a count, and a count the summary leaves out still reads 0, as its existing case pins.
   - The game's row on the offline summary says `YOUR PROGRESS COULDN'T BE READ` with no bar, instead of the points line and "0 of 12". **This is also proposed wording.** French: VOTRE PROGRESSION N’A PAS PU ÊTRE LUE. It is 257 px English and 306 px French, one line on both panels.
   - Already written: nothing to migrate. The summary is read fresh each time the page opens, and a ctl from before D's change never writes null.

### Suite lines (final, from scratch, head 435a506b5)

```
es-unit-tests:    test cases: 159 | 159 passed | 0 failed   assertions: 1646 | 1646 passed
es-file-tests:    test cases:  12 |  12 passed | 0 failed   assertions: 3291 | 3291 passed
app-unit-tests:   test cases:  16 |  16 passed | 0 failed   assertions:  106 |  106 passed
proxycards-tests: test cases:   6 |   6 passed | 0 failed   assertions:   31 |   31 passed
bookkeeper-tests: test cases:   4 |   4 passed | 0 failed   assertions:   15 |   15 passed
jobs-tests (new): test cases:   4 |   4 passed | 0 failed   assertions:   21 |   21 passed
tests/*.py (10 scripts, every one rc 0): cloud-gated-row PASS; cloud-oauth-await PASS;
  cloud-oauth-lifetime PASS; cloud-set-systems-quoting 5 of 5; cloud-sync-last-run PASS;
  credential-quoting 10 sites, 10 quoted, 0 bare; hasher-offline-index PASS;
  launch-capture-gate PASS; launch-deferred-state PASS; maintenance-why PASS
es-syntax-check: 24 of 24 .cpp touched since da702d8b6 PASS; and at the head, 43 of 43
  other sources that include one of the 11 changed headers (ApiSystem, CaptureRotation,
  CaptureRotationText, CloudText, CloudTransferJob, LaunchCommand, OfflineAchievementsText,
  OfflineScanJob, RetroAchievements, ThreadedCloudSync, WifiText) PASS
es-untranslated: 585 fork string(s) in the source, 585 with French, 0 without (rc 0)
vocabulary-check: 153 string(s) judged, 0 wrong (rc 0)
msgfmt -c (toolchain) on the French catalogue: clean
ASCII comments: es-app/src 0; the 9 in es-core are upstream's (present in base bccd71570)
```

### For the integrator

- `docs/es-menu-map.md:221`: IN USE should read CONNECTED.
- `cloud_content_backup`: exit 0 on "Nothing to back up" (claude F-CS-15's script half; unassigned).
- `runemu.sh` still reads `${ARGUMENTS##*-P}`, which finds a `-P` inside a quoted netplay nick (stream B). The manifest now reads whole words, so for such a nick the launcher and the manifest disagree until runemu.sh changes. The case is pinned in es-app/tests/unit/LaunchCommandTests.cpp.
- The sync card's direct calls from a thread that outlives the window (Task 3, above).
- Three strings wait on the maintainer's approval: SOME ACHIEVEMENT IMAGES COULDN'T BE SAVED[. TRY THE SCAN AGAIN.] and YOUR PROGRESS COULDN'T BE READ.
- Frames at 640x480 the VM should take:
  - the scan page ending on SOME_IMAGES_NOT_SAVED, in English and French;
  - the offline summary with a null row;
  - the cloud rows in a French interface;
  - the scraper run's help bar;
  - BIOS CHECK with no rows (no DETAILS).
- Rules read for this pass: es-player-text.md (outcome vocabulary, register), player-language.md (brevity is not clipping), es-native-ui.md, es-code-traps.md (ASCII comments, pure text's home), engineering-practices.md (guards fail closed; before deleting a duplicate), and upgrade-and-install.md (the `Already written:` lines).

## Follow-up 2 (2026-09-28, scripts at next 4476f90394)

I added one commit on `feature/pl-e2`: **13b16a77e** `CloudText: the scripts' newer whys translated; emitter table regenerated`. I read the scripts from the merged head with `git show`, without changing `/workspace/repos/rocknix`. Nothing was built, started in a guest or pushed.

**Changes:**

- **The four sentences from stream A are now in `CloudText::whySentences`,** the table that `localizedWhy` reads. Every place that translates a why for the rows, the transfer page or the sync card goes through that one table:
  - SOMETHING CHANGED SINCE YOU CHECKED
  - COULDN'T RECORD WHICH CARD YOUR SAVES ARE ON
  - THE NEW FOLDER ALREADY HAS FILES IN IT
  - YOU WENT OFFLINE PART-WAY THROUGH
- **The regenerated table found five more sentences,** added to backuptool (stream B) since f0f263b8cc, and I added them too. Without them the table's own check fails:
  - THIS DEVICE CAN'T RESTORE SETTINGS
  - A SETTINGS BACKUP OR RESTORE IS ALREADY RUNNING
  - THERE'S NOTHING TO BACK UP YET
  - A SIGN-IN WAS FOUND IN THE BACKUP
  - YOUR OWN BACKUP LIST NAMES A FOLDER A BACKUP CAN'T CARRY
- **French for all nine** is appended to the end of the catalogue.
- **The offline stamp.** `parseLastRun` reads "69 gaps YOU WENT OFFLINE PART-WAY THROUGH" as COULDN'T FINISH with that sentence as its why. The row's gaps branch passes the why through `localizedWhy`, and uses the token's generic phrase only when a stamp carries no why. Per D-UI-023, the row's line shows only the outcome word. The sentence appears in the row's confirmation, after "LAST TIME IT COULDN'T FINISH:". Before this commit it was already the stamp's own sentence, but shown in English. It is now translated.
- **The emitter table is regenerated** from the scripts at 4476f90394, with their line numbers:
  - 32 `>>> why` sentences.
  - `>>> unit everything` is gone. In its place are a per-system unit (`cloud_content_backup:572`, `cloud_content_restore:1363` and `:810`) and a BIOS unit (`:1363`).
  - `>>> removed` and `>>> offer` point at their new lines.
  - EmulationStation's own protocol lines are re-pointed as well. The first restore's tiers moved from main.cpp to JourneyTiers.h.

**Test.** `es-unit-tests` CloudTextTests.cpp: the regenerated table, plus a new case, "the stamp's offline why reads as COULDN'T FINISH with its own sentence". Run against `whySentences` as it was, it failed 14 assertions in 3 cases:
- `:692 isKnownWhy(p.text)` x8
- `:703 sentences.size() >= 32`
- `:728 isKnownWhy(r.why)`
- `:736 isKnownWhy(why)` x4

After the change: 160 of 160 cases pass, with 1706 assertions.

**Suites on 13b16a77e:**
```
es-unit-tests:    test cases: 160 | 160 passed | 0 failed   assertions: 1706 | 1706 passed
es-file-tests:    test cases:  12 |  12 passed | 0 failed   assertions: 3291 | 3291 passed
app-unit-tests:   test cases:  16 |  16 passed | 0 failed   assertions:  106 |  106 passed
proxycards-tests: test cases:   6 |   6 passed | 0 failed   assertions:   31 |   31 passed
bookkeeper-tests: test cases:   4 |   4 passed | 0 failed   assertions:   15 |   15 passed
jobs-tests:       test cases:   4 |   4 passed | 0 failed   assertions:   21 |   21 passed
tests/*.py: all 10 rc 0 (credential-quoting 10 sites, 10 quoted, 0 bare)
es-syntax-check: CloudText.cpp PASS (the only source touched; no header changed)
es-untranslated: 594 fork string(s), 594 with French, 0 without
vocabulary-check: 156 judged, 0 wrong
msgfmt -c: clean
```

**Notes:**
- **The Follow-up integrator note on claude F-CS-15 is resolved.** At 4476f90394, both of `cloud_content_backup`'s "Nothing to back up" branches record outcome 0 and exit 0.
- **One gap not fixed (for the integrator):** the maintenance dialogs (`runMaintenanceCommand` in GuiMenu, used by the backuptool flows) show a script's why without translating it. That covers backuptool's new sentences too. These dialogs are neither the rows nor the transfer page. Fixing it means choosing between backuptool's longer English line and the translated short why, and that is a choice about the words players see. I left it.

## Follow-up 3 (2026-09-28)

I fast-forwarded `feature/pl-e2` to `test/qa-integration` b4f3b762a, which brings in the `.githooks/pre-commit` credential scan. That hook ran on each of the three commits below and passed them. Nothing was built, run on a guest, or pushed.

| Commit | Finding | Test first seen to FAIL |
| --- | --- | --- |
| 6caac243c | GuiWifi: the network you're on joins by its profile, not its SSID | WifiTextTests.cpp:246, 247, 248, 254, 262 (5 assertions) |
| 4a0c77fa0 | GuiCloudTransfer: a match says what it removed and where to start again | CloudTextTests.cpp:1502, 1503, 1507 (x2), 1509 |
| 42f9e8851 | GuiRetroAchievementsSettings: a page close no longer waits on a sign-in | CheevosRetryTests.cpp:100, 101, 106 |

### 1. claude F-WF-12 / gpt F-WF-03, the picker's half: fixed in 6caac243c

`wifictl` uses two different names for a network:
- `current` and `list` report the SSID.
- `saved` and `join` use the profile's name, which need not match the SSID (a renamed profile, or NetworkManager's "Home 1").

The problem was the connected row. It is the SSID, and pressing it, or typing that name under INPUT MANUALLY, passed the SSID to `wifictl join`. When the profile had a different name, the join refused. The player then read "COULDN'T CONNECT TO HOME" with advice to forget and rejoin the network they were already on.

What changed:
- The connected row now carries a `PickerRow::profile`: the profile named like its SSID if there is one, otherwise the only profile that is up.
  - If two profiles are up and neither matches (a second adapter; `saved`'s ACTIVE flag covers any adapter, while `current` is this device's), the picker does not guess. It joins by the row's name, as before.
- GuiWifi hands `WifiText::joinName` / `manualJoinName` to the join, and keeps the row's own name for everything the player reads.
- "Could not ask" stays separate from "none" (E1's e5cfa708e). When the saved list could not be read, no profile is claimed.

**Still open (script side, for the integrator):** a scanned SSID whose profile has a different name and is not currently up still can't be marked SAVED. `wifictl saved` prints profile names only, not their SSIDs, and the finding's fix needs it to print both.

### 2. gpt F-CS-26, the page's half: fixed in 4a0c77fa0

Stream A's 258b5eca38 made `>>> removed` count rclone's actual deletions, so the done page's "REMOVED N FILES FROM THIS DEVICE" line is now true.

- **Line 5, the in-place note:** it said "N FILES WERE REMOVED FROM THIS DEVICE. YOUR CLOUD STILL HAS THEM." A match removes only what the cloud does *not* have (D-CLOUD-023), so the second sentence was the opposite of the truth. It now gives the count only (`CloudText::matchRemovedNote`, with the plural built from a format string).
- **The retry:** a match's apply uses up its preview's plan (PL-001), so the same command run again is always refused with "SOMETHING CHANGED SINCE YOU CHECKED".
  - The done page no longer offers TRY AGAIN for a match, on either the help bar or the OK button (`GuiCloudTransfer::retries`).
  - Line 7 instead points to the row that checks again: `TRY AGAIN: MATCH THIS DEVICE TO THE CLOUD` (`CloudText::matchRecovery`). This follows the card's existing TRY AGAIN: <row> shape.
- **French:** added for the three new strings. At 15 px on the page's 499 px line they measure 290–367 px.

**For the integrator:** `es-player-text.md`'s Outcome vocabulary still says two things this change contradicts:
- the match's in-place sentence ends "YOUR CLOUD STILL HAS THEM";
- the page offers TRY AGAIN for every run that didn't complete.

That rule file is in the distribution repo.

### 3. claude F-RA-19: fixed in 42f9e8851

The problem: the settings page's save runs on the interface thread. It signed in whenever the switch was on and there was no token. Offline the token stays empty, so every close of the page made a request the screen had to wait for.

The seat's suggested fix (skip the sign-in when the device has no address) doesn't cover its own failure scenario: a hotspot with a route and no DNS does have an address. So the save now decides by who the sign-in is for (`CheevosRetry::saveSignIn`):
- **Nothing changed and no token:** this belongs to the background token check (`CheckCheevosTokenComponent` in NetworkThread, which runs on the watchers' thread and retries when the network comes up; I confirmed this in `check()`). The page asks it to run now through the new `NetworkThread::checkCheevosTokenSoon`, which makes the same reset the link-up does, and does not wait.
- **The player changed something and there is an address:** it signs in on the page, as before, and they are told the result.
- **The same change with no address:** no request is made. The old token is cleared, the existing "couldn't reach" message is shown straight away, and the background check is asked to run so it retries at link-up.
- The check is asked for only after the switch has been written. Otherwise a switch that had just been turned on would read as off, and the check would do nothing and never retry.

No new strings. **VM step for the integrator:** with the link down, open and close RETROACHIEVEMENTS SETTINGS. The journal should say "the token check is asked to sign in". Bring the link up, and the token should arrive.

### Suites on 42f9e8851

```
es-unit-tests:    test cases: 163 | 163 passed | 0 failed   assertions: 1743 | 1743 passed
es-file-tests:    test cases:  12 |  12 passed | 0 failed   assertions: 3291 | 3291 passed
app-unit-tests:   test cases:  16 |  16 passed | 0 failed   assertions:  106 |  106 passed
proxycards-tests: test cases:   6 |   6 passed | 0 failed   assertions:   31 |   31 passed
bookkeeper-tests: test cases:   4 |   4 passed | 0 failed   assertions:   15 |   15 passed
jobs-tests:       test cases:   4 |   4 passed | 0 failed   assertions:   21 |   21 passed
tests/*.py: all 10 rc 0 (credential-quoting 10 sites, 10 quoted, 0 bare)
es-syntax-check PASS: WifiText.cpp, GuiWifi.cpp, GuiMenu.cpp, ApiSystem.cpp; CloudText.cpp,
  GuiCloudTransfer.cpp, FileData.cpp, main.cpp; GuiRetroAchievementsSettings.cpp,
  NetworkThread.cpp, CheevosRetry.cpp (each file touched, and every includer of a changed header)
es-untranslated: 595 fork string(s), 595 with French, 0 without
vocabulary-check: 156 judged, 0 wrong
msgfmt -c: clean
```

## Follow-up 4 (2026-09-28): the audit of the fixes, E2-claude.md and E2-gpt.md

This round added 11 commits on `feature/pl-e2`. Before the last one (12aa39edb, which builds on E1's work) I merged `test/qa-integration` f7a520414 (E1's audit fixes) as a83937b7f; it merged without conflicts. Nothing was built, run on a guest, or pushed. Each fix below had its test run against the tree as it was and seen to fail before the fix, and each commit quotes that failure. The findings I withdrew each give the line of code that settles them.

| Commit | What it does |
| --- | --- |
| b7b0927ff | ProxyCards: a top-up stopped for a game holds its queue for that game |
| 1113aa8dc | CloudTransferJob: a stop's look and its mark are one step, under the lock |
| 71a67ed1b | JourneyTiers: a record read whole, and one that cannot be replaced stops |
| f4c9549ba | FileData: the capture gate refuses at its bound and takes no sync early |
| 4313a8f53 | GuiMenu: a changed cloud folder brings the player back to its row |
| 5a37c7981 | ApiSystem: a join's answer is a type that cannot read as a truth value |
| e6c5cbbe3 | CloudText: the page names every part it composes; Wi-Fi says what failed |
| 766caa3f4 | tests: two cases that held only for a non-root user and an idle runner |
| df954c563 | CaptureRotationText: the own-launch claim of earlier builds is retired |
| 9b89369dc | SaveStateBookkeeper: a deletion holds the transfer lock while it runs |
| 12aa39edb | CloudTransferJob: a stop restamps against the stamps from before its run |

### E2-claude.md

- **G-E2-01** (`joinWifiNetwork`'s callers): **the caller question was already answered; the guard is new in 5a37c7981.**
  - There is one caller, `GuiWifi::join`. It was rewritten for the integer answer in c0def453a, and 6caac243c then passes it the profile's name. No other caller exists in either tree.
  - The risk the seat named, a later caller writing `if (joinWifiNetwork(x))`, is now blocked by the compiler. The function returns `WifiText::JoinAnswer`, which does not convert to bool. It has `code` and `joined()`, and two `static_assert`s pin that.
  - The header's stale "True only when…" paragraph is rewritten.
- **G-E2-02** (STOP IT AND PLAY over a queued top-up): **fixed in b7b0927ff.**
  - One correction to the seat's reasoning: `topUpRunning()` reads the ctl's running file, not the watcher's flag.
  - The bug is real all the same. When the stopped run's card ends, the game hasn't started yet, so the queued run started under the launch.
  - `stopTopUp` now sets a hold. The watcher waits for that game to start and then end. If no game starts within a minute (the player backed out at a later question), the hold lets go.
  - The watcher now waits before each run, not once before both. A hold with nothing queued behind it is cleared.
- **G-E2-03** (a second `onFinalize`): **withdrawn, refuted.**
  - `GuiSettings::onFinalize` is a single slot (GuiSettings.h:117). Neither kind of page registers a second finalizer.
  - The three sign-in pages register only through `cloudOAuthOwnSession` (GuiMenu.cpp 7260, 7287, 7398). `cloudSetupPresent` and `cloudSetupSetButtons` register none.
  - `cloudOpenTransfer` registers only at 4904.
- **G-E2-04** (a temporary save state): **withdrawn, refuted.**
  - `isSaveStateInfoTemporary` is never set true or read. It appears only at FileData.h:58 (initialised to false) and :72 (the declaration).
  - Every save state handed to a launch comes from the repository: `GuiSaveState`'s callback (the repository's states plus the three shared ones) or `getGameAutoSave` (a state from `getSaveStates`).
- **G-E2-05** (does `populateFolder` index?): **withdrawn, refuted.**
  - `populateFolder` (SystemData.cpp:520–650) calls nothing that indexes.
  - The filter index is filled only by `indexAllGameFilters`, from `getIndex(true)`, and by the named `addToIndex` callers. The merge's own `arrived()` is the only thing that indexes a fresh entry.
- **G-E2-06**: **first half fixed in f4c9549ba; second half withdrawn by design.**
  - First half: the exit generation now moves only when the capture gate actually lets the launch go. While a launch waits, the capture's post leaves the exit sync to the gate.
  - Still open: if a later question's KEEP WAITING stops a launch this gate already let through, the last session's saves wait for the next exit sync (`--recent`) or the startup sync. They are delayed, not lost.
  - The 300 ms wait on the interface thread is withdrawn by design. es-ui-style-guide.md § Waiting says "a spinner that flashes for 100 ms is worse than none", and the comment in the code says so.
- **G-E2-07** (line 7 left empty): **withdrawn by design.**
  - The offer is on the page's own help bar, drawn with the player's own buttons. That is the rule's "buttons by position, never by letter". Repeating it as text on line 7 would put one offer on two surfaces.
  - A match's page does use line 7 now, for `TRY AGAIN: MATCH THIS DEVICE TO THE CLOUD` (4a0c77fa0).
  - For the integrator: the rule's "on line 7" wants to say "on the page's help bar".
- **G-E2-08**: **(b) and (c) fixed in e6c5cbbe3; (a) is the rule's to change.**
  - (c) The page now translates every label EmulationStation composes (`CloudText::unitLabels`). Two of them are new msgids, with French.
  - (b) FINISH RESTORE SETUP's WI-FI PASSWORD and NETWORK SETTINGS' Wi-Fi apply now say the picker's words, `COULDN'T CONNECT TO <network>. CHECK THE KEY AND TRY AGAIN.`, instead of upstream's WI-FI CONFIGURATION ERROR.
  - (a) is for the integrator: the rule's outcome table still says `SKIPPED - A GAME WAS STARTED`, where the card, the page and the top-up all say `YOU STARTED A GAME`.
- **G-E2-09**: **(a) and (b) fixed in 766caa3f4; (c) acknowledged, no change.**
  - (a) The unopenable-lock case now uses a link that points at itself (ELOOP for everyone, root included). It still fails against the fail-open check it guards, as shown in the commit.
  - (b) The stop-before-pid cases now retry up to five times and fail after five losses.
  - (c) There was no unfixed version of FolderMerge, captureGate or AppWindow to run, because this stream wrote them. Their "failed first" lines were runs against a stand-in for the old behaviour, and the commits said so. The behaviour they replace is proved on the VM, which is the integrator's.

### E2-gpt.md

- **G-E2-01 and G-E2-02** (the journey record): **fixed in 71a67ed1b.**
  - A record now counts only if all three tiers are present, each 0 or 1. A damaged one offers everything instead of silently consuming the marker.
  - `JourneyTiers::replaceRecord` removes any old record before writing. If the write then fails, there is no record, so the start offers everything and names everything.
  - If an old record can be neither replaced nor removed, the restore does not start. It says **(proposed words)** `COULDN'T SAVE WHAT YOU TICKED, SO NOTHING WAS RESTORED.`, with French.
- **G-E2-03** (the capture gate): **fixed in f4c9549ba.**
  - At the ten-second bound the launch is now refused. It says **(proposed words)** `YOUR LAST GAME'S SAVES ARE STILL BEING RECORDED. TRY AGAIN IN A MOMENT.`, with French. The next press waits again.
  - `cloud_capture` ignores SIGTERM by design, so stopping it isn't an option.
  - Only a capture older than 120 s, which is hung rather than slow, stops holding the device, and that is logged as a warning.
- **G-E2-04**: fixed in b7b0927ff (same finding as claude's G-E2-02).
- **G-E2-05** (a late stop): **fixed in 1113aa8dc.** The stop's check and its mark now both happen under the run's lock, which is the lock the run's end holds. A test pause at that point in the code reproduces the race.
- **G-E2-06** (wrong own-launch records already on devices): **fixed in df954c563.**
  - Records are now written, and trusted, only with a new line, `from=checked-launch`.
  - An older `from=own-launch` record is read the way #288 read the unmarked ones: the core's table stands in until the game's next exit rewrites the record.
  - **For the integrator:**
    - `tools/vm-qa`'s fixture (line 346 on next) writes `turns=1\nfrom=own-launch\n` for Bobl.nes. It needs `from=checked-launch`, or frame-diff will show Bobl turned by the core's table instead of by the record.
    - D-UI-094 needs a new row refining it.
- **Coverage requests** (the seat's § 4 and sweep notes):
  - The restamp policy is 8eb4c6821 plus 12aa39edb below; E1's 54d5699b2 holds the snapshot.
  - PL-068's gap between checking the lock and acting is closed by 9b89369dc, below.
  - The `joinWifiNetwork` type change is 5a37c7981.
  - F-CS-15's script half was already fixed by stream A: at 4476f90394 both "Nothing to back up" branches exit 0.
  - Still open: the notification card closed by direct call after the linger. I noted this in Follow-up 1 § Task 3.

### The orchestrator's findings

- **G-E2-O1**: **fixed in 4313a8f53.**
  - `openCloud(window, onFolderRow)`: the folder editor's onDone reopens the hub with the cursor on CHANGE CLOUD FOLDER, using `setCursorHere` as the rebuilt wizard pages do.
  - Test: `tests/cloud-folder-reopen.py` checks the shipped source and failed three ways before the fix.
  - The real proof is the walk: confirm-cloud-folder frame 05 should show the hub with CHANGE CLOUD FOLDER focused and its new line visible.
- **G-E2-O2**: **fixed in 12aa39edb.** The transfer page now snapshots the stamps with `ThreadedCloudSync::readStamps` before its command runs, and calls the snapshot restamp. The test is in jobs-tests.

### Also fixed: 9b89369dc (gpt's PL-068 coverage note)

- The bookkeeper checked that the transfer lock was free and then deleted. A transfer starting in that gap ran alongside the deletion, and `cloud_capture` takes only its own `.capture.lock`, so nothing else closed it.
- The deletion now takes the lock, exclusive and non-blocking the way the scripts take it, and holds it through the retire and unlink. The scripts wait up to a second for a busy lock, which is longer than a deletion takes.
- The manager's DELETE and COPY refusal now tells this process's own hold from a transfer's (`SaveStateBookkeeper::holdsTransferLock`). A press during a deletion is queued, not refused.
- Test: a new bookkeeper-tests case tries `flock -n` from another process during the deletion. It failed against the old check.

### Suites (from scratch, head 12aa39edb)

```
es-unit-tests:       test cases: 170 | 170 passed | 0 failed   assertions: 1801 | 1801 passed
es-file-tests:       test cases:  21 |  21 passed | 0 failed   assertions: 3346 | 3346 passed
es-file-tests-win32: test cases:   2 |   2 passed | 0 failed   assertions:   14 |   14 passed
app-unit-tests:      test cases:  18 |  18 passed | 0 failed   assertions:  119 |  119 passed
proxycards-tests:    test cases:   7 |   7 passed | 0 failed   assertions:   40 |   40 passed
bookkeeper-tests:    test cases:   5 |   5 passed | 0 failed   assertions:   20 |   20 passed
jobs-tests:          test cases:   6 |   6 passed | 0 failed   assertions:   28 |   28 passed
tests/*.py: all 11 rc 0 (cloud-folder-reopen new; launch-capture-gate 15 ok;
  credential-quoting 10 sites, 10 quoted, 0 bare)
es-syntax-check: 15 of 15 .cpp changed since 42f9e8851 PASS (E1's merge included), and
  85 of 85 sources that include one of the 11 headers changed since then
es-untranslated: 599 fork string(s), 599 with French, 0 without
vocabulary-check: 155 judged, 0 wrong
msgfmt -c: clean
ASCII comments in es-app/src: 0
```

### For the integrator

- `tools/vm-qa` line 346: write `from=checked-launch` (df954c563).
- D-UI-094: add a refining row (df954c563).
- `es-player-text.md`:
  - "on line 7" should say "on the page's help bar" (G-E2-07);
  - `SKIPPED - A GAME WAS STARTED` should be `SKIPPED - YOU STARTED A GAME` (G-E2-08a);
  - Follow-up 3's two match notes still stand.
- Proposed words awaiting approval:
  - `COULDN'T SAVE WHAT YOU TICKED, SO NOTHING WAS RESTORED.`
  - `YOUR LAST GAME'S SAVES ARE STILL BEING RECORDED. TRY AGAIN IN A MOMENT.`
- VM steps:
  - walk confirm-cloud-folder frame 05 (G-E2-O1);
  - a slow capture refused at the bound;
  - STOP IT AND PLAY over a queued top-up, with the journal showing "the queued run waits for that game".

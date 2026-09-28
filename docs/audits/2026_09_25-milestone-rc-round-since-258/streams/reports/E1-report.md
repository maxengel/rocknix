# Stream E1 report -- EmulationStation core (#307 / #308)

**Branch:** `feature/pl-e1` in `/home/max/Development/emulationstation-next.worktrees/pl-e1`, cut from `7eae8ed91` (the ROCKNIX pin). 22 commits, not pushed. Every file touched is in E1's list (`git diff --name-only 7eae8ed91..HEAD`: `.githooks/`, `es-core/src/**`, `es-app/src/{CloudText,ThreadedCloudSync,SaveState,WifiText}.*`, `es-app/src/guis/{GuiSaveState.cpp,GuiWifi.*}`, `es-app/tests/unit/**`, the fr `.po`, where lines were only added at the end).

```
git log --oneline 7eae8ed91..HEAD
e5cfa708e GuiWifi: "could not ask" is not "none"; the connected row is checked
a82dcdf4c Font: a later tab stop allows for the columns before it
d5312fabd .githooks/pre-push: ROCKNIX's master found by URL; build-tests/ stays
dcf7fa8c7 StringUtil: maskSecrets masks the whole shell word of a value
27fc01928 SaveState: the racommands path no longer copies a state onto itself
2f5fd6332 SaveState: swap a core only in the command's own word, not the ROM's
1de5230f8 CloudText: the scripts' whys in the player's language; table current
0ca44924c CloudText: a status that is not a whole number is not a success
579491cba ThreadedCloudSync: keep a script line's UTF-8 on its way to the card
f412119ad .githooks/pre-push: read renames, root commits and unknown tips
8fb11f498 ThreadedCloudSync: a 69 after bytes moved keeps the in-place clause
9ee2a5ef8 ThreadedCloudSync: one lock for the running sync; the pointer atomic
f67be8b9c ThreadedCloudSync: detach the sync's thread instead of leaking it
6e58988f8 GuiSaveState: DELETE and COPY ask the transfer lock, not only the card
dac8aba9d AtomicFileUtil: the header says its guarantees are POSIX's
b8c225da1 SystemConf: a cut system.cfg loads the whole .tmp; records are whole
944193685 SystemConf: no save without the settings lock; the change waits
c499c67dc AtomicFileUtil: the lock's budget is read on every pass
409f44917 AtomicFileUtil: the lock is born with its pid; stale ones reaped once
b4faa9c61 AtomicFileUtil: a replaced file keeps its mode; records copy it
587440205 AtomicFileUtil: readText is ok only when the read reached the end
7949a2529 AtomicFileUtil: a temporary of each write's own, never path.tmp
```

Every commit carries the item or row ID, the test case, the FAIL and PASS lines, an `Already written:` line (22 of 22, checked with `grep -c '^Already written:'`) and the Co-Authored-By trailer.

**How the "before" lines were produced.** Where a fix changed code that was already in a testable place (AtomicFileUtil's writeText, readText and PidLock, maskSecrets, the hook), the test ran against the unfixed code as it stood. Where the rule sat inside something that cannot be built in a test (SystemConf, the card, GuiWifi, SaveState, Font), I first moved it out unchanged into a pure function (a "faithful extraction", marked as such in the code), watched the test fail against that, and then fixed it. The FAIL lines for those items come from the extraction, not from the untouched original. F-ES-07 was run both ways: against the original code and against HEAD at 409f44917.

**A new test binary.** `es-file-tests` (`es-app/tests/unit/AtomicFileTests.cpp`) exists because `es-unit-tests` is, by its own README, the binary that touches no file. The new one works in a scratch directory under `$TMPDIR` and forks the processes that play the other writer or the other waiter. The README and CMakeLists.txt both say so.

## Punch items (#307)

| Item | Outcome | Commit | Test case | Before -> after |
|---|---|---|---|---|
| **PL-024** | **resolved** | 944193685 | es-file-tests "a save that cannot get the lock writes nothing, and both writers' keys survive (PL-024)" | Before: `AtomicFileTests.cpp:435: CHECK( first == LockedSave::LockBusy ) values: CHECK( 0 == 1 )` and `:442: CHECK( last.find("a=2\n") != npos )` failed (the other writer's rename landed over the save). After: PASS. |
| **PL-041** (PidLock half) | **resolved** | 409f44917 | "the lock carries its holder's pid from the moment it exists (PL-041)"; "two waiters on a stale lock never both hold it (PL-041)" | Before: `CHECK( emptySeen.load() == 0 ) values: CHECK( 1809 == 0 )`; `CHECK( overlaps == 0 ) values: CHECK( 23 == 0 )` and `CHECK( failures == 0 ) values: CHECK( 9 == 0 )`. After: PASS in 7 runs (tmpfs and disk). |
| **PL-063** | **resolved** | 7949a2529 | "two writers at once leave one whole file, never a mix of both (PL-063)" | Before: `CHECK( failed.load() == 0 ) values: CHECK( 389 == 0 )` (400/400 on disk). After: PASS. |
| **PL-064** | **resolved in ES; the upgrade case also needs stream B** | b8c225da1 | "a cut live file beside a whole temporary and no record loads the temporary"; "usable means complete ..."; "the choices that were already right stay right" | Before (extraction): `:465 values: CHECK( 3 == 1 )`, `:473 CHECK( 0 == 1 )`, `:479 CHECK( 4 == 1 )`, `:494 CHECK_FALSE( c.record ) values: CHECK_FALSE( true )`. After: PASS. |
| **PL-065** | **resolved** | 587440205 | "a read that fails after the file opened is not a read (PL-065)" | Before: `:171` and `:175 CHECK_FALSE( ok ) values: CHECK_FALSE( true )` (a directory; /proc/self/mem). After: PASS. |
| **PL-068** | **resolved in code; the walk is the integrator's** | 6e58988f8 | "the transfer lock reads as held while a script holds it, and only then (PL-068)" | `isFlockHeld` is new, so it had no unfixed version to fail against. The gate's own before and after is the acceptance's VM walk. |
| **PL-069** | **resolved** (claude F-CS-03 is the same finding) | f67be8b9c | "a thread that ends unjoined keeps its stack; a detached one gives it back (PL-069)", which exercises the pattern because the class needs a Window | Unjoined: VmSize +229456 KiB for 20 threads. Detached: +8196 KiB. The task count is the same before and after. |
| **PL-072** | **resolved** | 8fb11f498 | es-unit-tests "a sync that moved saves and then lost the network keeps what moved in every candidate (#307 PL-072)" | Before (extraction): `CloudTextTests.cpp:547 candidate.find(inPlace)` failed x2; `:550 values: CHECK( THEY GO UP WITH YOUR ACHIEVEMENTS WHEN YOU'RE BACK. == THE SAVES THAT MADE IT ARE ON BOTH SIDES. NOTHING ELSE CHANGED. )`. After: PASS. |
| **PL-075** | **resolved** (a documentation change) | dac8aba9d | none possible: no host here builds the `_WIN32` branch | `grep -n "_WIN32 branches" es-core/src/utils/AtomicFileUtil.h` |
| **PL-078** | **resolved** | f412119ad | new `.githooks/pre-push-test` (scratch repo, the stdin lines git would send) | Against the old hook: `FAIL a root commit with a secret, first push`, `FAIL a rename that adds a secret`, `FAIL a secret over a remote tip this clone lacks`, `FAIL history holding a secret, first push to another remote`. After: PASS. |

**Already written, per item** (the full text is in each commit):
- **PL-024:** nothing new is written. A change refused for the lock stays in memory and is written at the next save.
- **PL-041:** old locks are judged as before. `/tmp/.system.cfg.lock.reap` is a new, harmless file.
- **PL-063:** leftover `path.tmp` files are never written again. The live file keeps the same bytes under the same name.
- **PL-064:** this is the fix for what the pre-#102 writer left behind. A whole `.tmp` is read and written back ("read both").
- **PL-065:** records made from fragments are replaced at the next whole load.
- **PL-068 / PL-069 / PL-072 / PL-075 / PL-078:** nothing written.

**Design choices I made (the brief said decide, not ask):**
- **PL-024:** the save is refused and the change kept (the brief's "refuse and log" option). The other option, "re-read and apply only the dirty keys", is what the code already did, and it still lost the other writer's rename.
- **PL-041:** stale locks are reaped under an flock guard rather than by renaming the lock aside. With the rename-aside approach, a release that happens during the aside window leaves a live pid's lock orphaned, and every later waiter hangs on it.
- **PL-072:** the fix keeps SKIPPED and the `no-network` token and keeps the in-place clause in every candidate. This keeps `exitSyncOwed`'s owed sync working.

## Sweep rows (#308), plus the two added mid-stream

| Packet | Seat | ID | Outcome |
|---|---|---|---|
| 1-raoffline | claude | F-RA-04 | **withdrawn:** refuted for SystemConf. The save writes only the keys set since the last save (`changedConf`), merged onto the file re-read under the lock (`SystemConf::applyChanges`). Nothing in ES sets or reads `hardcore_was` (`grep -rn hardcore_was es-app/src es-core/src` finds nothing), so a save cannot bring it back. The mirroring code is in GuiRetroAchievementsSettings.cpp, which is E2's. |
| 1-raoffline | claude | F-RA-19 | **withdrawn:** not in E1's files (GuiRetroAchievementsSettings.cpp, E2) |
| 1-raoffline | claude | F-RA-21 | **withdrawn:** not in E1's files (GuiRetroAchievementsSettings.cpp is E2's; backuptool's exclusion list is B's) |
| 2-wifi | claude | F-WF-03 | **fixed** e5cfa708e. The other half is open: choosing the join-failure words by exit code needs `ApiSystem::joinWifiNetwork` to return the code, and ApiSystem.cpp is E2's. |
| 2-wifi | claude | F-WF-08 | **fixed** e5cfa708e |
| 2-wifi | claude | F-WF-11 | **withdrawn:** the word to change is MANAGE SAVED NETWORKS' `IN USE` in GuiMenu.cpp (E2). The picker's CONNECTED already agrees with the toast and the forget dialog ("YOU'RE CONNECTED TO IT NOW..."). |
| 2-wifi | claude | F-WF-13 | **withdrawn:** refuted. The French is at the base's `.po` lines 2926, 4546 and 4591-4603. |
| 5-cloud-sync-and-saves | claude | F-CS-03 | **withdrawn:** a duplicate of PL-069 (f67be8b9c) |
| 5-cloud-sync-and-saves | claude | F-CS-14 | **fixed** 27fc01928, with the guard `newSlotFile != fileName`. No unit test can reach `setupSaveState`; the VM steps are in the commit. |
| 5-cloud-sync-and-saves | claude | F-CS-19 | **fixed** 579491cba (`CloudText::cleanLine`) |
| 5-cloud-sync-and-saves | claude | F-CS-28 | **fixed** 1de5230f8 (the emitter table regenerated from next f0f263b8cc). The rule-file half (`rclone-cloud-sync.md`) is in the distribution repo and is flagged for you. |
| 8-es-menus-and-core | claude | F-ES-24 | **withdrawn:** this is D-UI-093 as decided ("a toast waits while a progress card is up"; the maintainer: "That should be something we always avoid"). Letting a toast over the hasher card would be the pop-up over a pop-up the row forbids. |
| 2-wifi | gpt | F-WF-05 | **fixed** e5cfa708e: the connected row and a typed current name now go through `wifictl join` |
| 2-wifi | gpt | F-WF-06 | **fixed** e5cfa708e (the same finding as claude F-WF-03) |
| 2-wifi | gpt | F-WF-08 | **fixed** e5cfa708e: the toast is `<glyph> <name> : CONNECTED` |
| 5-cloud-sync-and-saves | gpt | F-CS-25 | **fixed** 9ee2a5ef8. No test can reach it (the class needs a Window, and a race needs a TSan build). |
| 5-cloud-sync-and-saves | gpt | F-CS-27 | **fixed** 0ca44924c. Before: `CloudTextTests.cpp:137..:143` and `:157..:161`, `:433`, `:434` failed. |
| 5-cloud-sync-and-saves | gpt | F-CS-31 | **fixed on the card** 1de5230f8: 23 sentences paired, 18 new French strings. The transfer page and the rows (CloudTransferJob, GuiCloudTransfer, GuiMenu) can call `CloudText::localizedWhy`, but those files are not E1's. Flagged. |
| 5-cloud-sync-and-saves | gpt | F-CS-33 | **fixed** 2f5fd6332 (`Utils::CommandLine::replaceOptionValue`, header-only) |
| 8b-es-core | gpt | F-ES-07 | **fixed** c499c67dc (the SystemConf half is in 944193685) |
| 8b-es-core | gpt | F-ES-08 | **fixed** b4faa9c61 |
| 8b-es-core | gpt | F-ES-09 | **fixed** dcf7fa8c7 (StringUtil.cpp's CRLF line endings kept) |
| 8b-es-core | gpt | F-ES-11 | **fixed** a82dcdf4c (`TabStops::fromColumns`, header-only). Every shipped tabbed text has one tab per line, and those stops come out the same. |
| 8b-es-core | gpt | F-ES-12 | **withdrawn:** refuted. The card's size is set once in the constructor (`AsyncNotificationComponent.cpp:75`, `:99`) before the first render, and `Window` only moves it (`Window.cpp:1199` `setPosition`). The width a candidate is chosen against never changes. |
| 10-packages-and-build | gpt | F-PB-18 | **fixed** d5312fabd. It is not a duplicate of PL-078: this one is about the base a `pr/*` branch is compared with, which is now found by its ROCKNIX URL instead of falling back to `origin/master`. |
| 10-packages-and-build | gpt | F-PB-19 | **fixed** d5312fabd: `build-tests/` added to PERSONAL_PATTERNS. I decided the hook should refuse these on `pr/*`: cutting the PR by content is the plan, and the hook is the backstop, as in the distribution's own guard. Test before (hook at f412119ad): `FAIL a pr/* push carrying build-tests/es-unit-tests`, `FAIL a pr/* push with only the fork's master to compare with`. After: 12 cases, PASS. |

## Harness, final state

- `es-unit-tests`: **144/144 cases, 1573 assertions, SUCCESS** (the base had 128 cases and 1360 assertions).
- `es-file-tests`: **12/12 cases, 3291 assertions, SUCCESS**, on tmpfs and on the /workspace disk.
- `.githooks/pre-push-test`: **PASS** (12 cases).
- `tools/es-syntax-check --tree <wt> --with <wt>/es-app/src`: **PASS**, every file OK:
  - CloudText.cpp, SaveState.cpp, ThreadedCloudSync.cpp, WifiText.cpp
  - GuiSaveState.cpp, GuiWifi.cpp
  - Settings.cpp, SystemConf.cpp, Font.cpp, AtomicFileUtil.cpp, StringUtil.cpp
  - and the users of the changed headers: main.cpp, GuiMenu.cpp, NetworkThread.cpp, FileData.cpp, ProxyCards.cpp, CloudTransferJob.cpp, GuiCloudTransfer.cpp, ApiSystem.cpp, AsyncNotificationComponent.cpp, TextComponent.cpp, GuiGameAchievements.cpp, Window.cpp
- Non-ASCII comment scan over every touched `.cpp`/`.h`: nothing found.
- The toolchain's `xgettext` over es-app and es-core: the new msgids are in the `.pot`. `msgmerge` into fr keeps their French. `msgfmt --check`: clean.
- `tools/es-untranslated --es-src <wt>`: **573 fork strings, 573 with French, 0 without**.
- `tools/vocabulary-check --es <wt>`: **148 judged, 0 wrong**.
- The tracked `build-tests/es-unit-tests`, which every test build rewrites, was restored with `git checkout`. The worktree is clean.

## For you to prove or route (I could not do these here)

1. **PL-064, the upgrade case:** `chksysconfig verify` (rocknix-sysconfig.service, at sysinit, before ES) still runs `rm -f system.cfg.tmp` unread (chksysconfig:134-136). On a real boot, ES never sees the whole `.tmp` the finding describes. Stream B's chksysconfig needs the same read first.
2. **PL-041, the shell half:** `wait_lock` should take `flock "${J_CONF_LOCK}.reap"` around its re-read and `rm`. Until it does, a shell reaper and ES's reaper can still meet in that window (this is B's).
3. **PL-068:** the worker's queued delete (SaveStateBookkeeper.cpp, which runs `cloud_capture --retire --unlink` and never takes the lock) still runs without the lock. That file is not E1's; DELETE is re-checked at YES. VM walk: run `cloud_backup` from a shell, press DELETE and COPY, and confirm both are refused with "A SYNC IS ALREADY RUNNING. / WAIT FOR IT TO FINISH, THEN TRY AGAIN."
4. **PL-069 on the VM:** measure `grep VmSize /proc/$(pidof emulationstation)/status` across 50 exit syncs. It should stay flat; without the fix it grows about 8 MiB per sync. The acceptance's `ls /proc/<pid>/task | wc -l` cannot see this leak (the test above shows why).
5. **PL-072:** on a guest, cut the link part way through a transfer and read the card's frame at 640x480, including whether the in-place clause alone fits the line.
6. **PL-024 on the VM:** put a live pid in `/tmp/.system.cfg.lock` (for example a `sleep 60` process), change a setting in ES, and check that the log says nothing was written and the file is unchanged. Then remove the lock, change another setting, and check that both are in the file.
7. **F-CS-14 on the VM:** the steps are in 27fc01928. With the `es_savestates.cfg` link removed and incremental save states on, launch slot 3 from the manager; `.state3` should survive.
8. **Wi-Fi picker:** a frame at 640x480 of the subtitle, the CHECK AGAIN NOW? box and the toast.
9. **Words E2's pages should adopt:** `CloudText::localizedWhy` for the rows and the transfer page (F-CS-31); `CloudText::cleanLine` for CloudTransferJob; an exit code from `ApiSystem::joinWifiNetwork` (F-WF-03); IN USE -> CONNECTED in MANAGE SAVED NETWORKS (F-WF-11).
10. **F-PB-19:** untrack `build-tests/es-unit-tests` and add `build-tests/` to `.gitignore`. Neither file is E1's.
11. **F-CS-28:** fix the drift in `rclone-cloud-sync.md` (distribution repo).
12. **es-menu-map:** no row was added, moved or renamed. The picker gained a subtitle and a dialog, not a row or a screen.

**Residuals I am naming, not fixing:**
- A SystemConf reload (the Wi-Fi picker's join) drops pending changes. This was already true; refused saves now make it slightly more likely.
- A process killed between creating its temporary and the rename leaves `<file>.tmp.<pid>.<n>` litter.
- A mid-file EIO cannot be produced on this host, so the part-way read failure is unproven directly. It takes the same `read() < 0` branch as the two cases that are tested.

---

## Follow-up: the audit of the fixes (2026-09-28)

**Merge.** `git merge test/qa-integration` fast-forwarded `feature/pl-e1` from e5cfa708e to 42f9e8851. It carries E2's three passes, the integrator's commits and `.githooks/pre-commit`. Baseline on the merged tree: es-unit-tests 163/1743, es-file-tests 12/3291, both passing.

**Commits since the merge** (`git log --oneline 42f9e8851..HEAD`):
```
44d174436 tests/unit: readText's case fails a read part way through a file
a299fc50f .githooks: a long scan says so; any-case URL; no patterns, no push
b9b2e3ca1 AtomicFileUtil: the _WIN32 readText reads an empty file; it compiles
162d2fedb tests/unit: PL-069's case holds ThreadedCloudSync, at this host's stack
b036967fc StringUtil: a value quoted inside a quoted command is masked again
33a904591 CloudText: cleanLine drops an escape by its grammar, not to a letter
54d5699b2 ThreadedCloudSync: a stop restamps what its run wrote, by the file
44705df2d SystemConf: a file cut short of its record loads the record; no leak
800c818d3 SystemConf: a reload keeps the changes a refused save is holding
5e390e128 AtomicFileUtil: the reap guard is bounded, and fails closed
```
Each commit has the finding ID, the case written first with its FAIL line, the PASS count, es-syntax-check, and an `Already written:` line. Where a case exercises a rule I moved into a pure function, the FAIL was seen against that function with the old behaviour kept (as in the first pass).

### Claude seat (E1-claude.md)

| ID | Outcome |
|---|---|
| G-E1-01 (Critical, "the join result is inverted") | **Withdrawn, refuted on the integrated tree.** E2's c0def453a made `int ApiSystem::joinWifiNetwork` (ApiSystem.h:282) return wifictl's exit code: 0 only when "joined", 1 for an exit 0 that printed no "joined" (ApiSystem.cpp:677-685). GuiWifi uses `GuiLoading<int>` and `code != 0` (GuiWifi.cpp:164-169). grep finds no other caller. Nothing else in my GuiWifi change assumes the old bool: `enableWifi` still returns bool and is read as bool (:214-215); `getSavedWifiNetworks` and `getCurrentWifiSsid` still return bool "answered" as `Answer` stores them; 6caac243c's join-by-profile goes through the same int path. |
| G-E1-02 (cut live file wins over a whole .backup; the next save records it) | **Fixed** 44705df2d, with gpt G-E1-04. `chooseConfig` now loads the record when the live file is incomplete, is the start of the whole record, and is no newer than it. A hand edit made after the record (for example over the network share, with no final line end) stays the owner's. `saveUnderLock` reports whether the text it merged onto was whole; a save onto a cut file is written but not recorded. Before: `AtomicFileTests.cpp:809 ... CHECK( 0 == 2 )`, `:830 CHECK_FALSE( true )`. |
| G-E1-03 (diff carries changes in neither plan nor report) | **Withdrawn.** These are four commits made on test/qa-integration after my first report, in E1's files; the audit's diff was the range restricted to those files. Each carries its own `Already written:` line: 8eb4c6821 (the restamp, #308 F-CS-05/F-CS-23), 13b16a77e (the regenerated emitter table and the new whys), cb32a0481 (scanWhy's words), 35f02d3d4 (the untrack and `.gitignore`). (b) does not drift: OfflineAchievements.cpp:255-257 and ProxyCards.cpp:167-169 now delegate to `CloudText::scanWhy`/`topUpWhy`. The substance of (a) is claude G-E1-04, fixed below. |
| G-E1-04 (stale stop stamp taken as this run's when the clock is behind) | **Fixed** 54d5699b2, with gpt G-E1-06. The card now snapshots its command's script stamps at construction (`ThreadedCloudSync::readStamps`: text, inode, mtime; the scripts write each stamp to a new file and rename it). At the stop it restamps only a file written since, whatever its epoch. A stamp that already carries one of ES's tokens is never this run's. Before: `CloudTextTests.cpp:1490 ... .empty() ) is NOT correct!` and `:1498 values: CHECK( 0 == 1 )`. |
| G-E1-05 (PL-069 test host-dependent, cannot fail) | **Fixed** 162d2fedb, with gpt G-E1-07. Thresholds now come from this host's default thread stack size (8192 KiB here). A new case reads ThreadedCloudSync.cpp/.h (comments stripped) and requires no `new std::thread`, no `std::thread*` member, and the `.detach()` start. Pointed at 7eae8ed91's files: `:771`, `:772`, `:773` FAIL. |
| G-E1-06 (`_WIN32` readText reports an empty file as not read) | **Fixed** b9b2e3ca1. The Windows branch now uses C stdio with `ferror`. New test binary `es-file-tests-win32` compiles AtomicFileUtil.cpp with `_WIN32` defined for that one object. Before: `AtomicFileWin32Tests.cpp:53: CHECK( ok ) values: CHECK( false )`. The same check caught a Windows compile break I had introduced in 44705df2d (a `::stat` outside the guard: `error: aggregate '...::stat ls' has incomplete type`); now guarded. `g++ -D_WIN32 -Wall -fsyntax-only` is clean. |
| G-E1-07 (cleanLine's escape handling swallows text) | **Fixed** 33a904591. Escapes are now dropped by the ECMA-48 grammar (CSI to its final byte, OSC to BEL or ESC-backslash, a two-byte escape, a lone ESC). Before: `:572 values: CHECK( itle>>> offer ... )`, `:573 itlehy IT WAS STOPPED`, `:574 id 12`, `:575 de`. |
| G-E1-08 (first push scans whole history silently; case-sensitive URL) | **Fixed** a299fc50f. The hook counts the commits and says "reading the N commit(s) <remote> is not known to hold"; the ROCKNIX URL is matched in lower case. While testing a copy of the hook I found it **failed open with no `secret-patterns` beside it**: SECRET_PATTERNS was unset and every push passed. pre-push now refuses in that case and pre-commit says why. Against HEAD's hook: three FAILs (the progress line, the URL case, no pattern file). Now 15 ok, PASS. |
| G-E1-09 (PL-068 gated at the button, not the write) | **Withdrawn, fixed by E2.** fa57923af and 5b6d2e638: the queued deletion waits out the transfer lock at the write, through the same `isFlockHeld` (SaveStateBookkeeper.cpp:57-90). COPY's copy runs at the press, right after the gate (GuiSaveState.cpp:513); only its manifest record is queued, and it waits the same way (:73). |
| G-E1-10 (build-tests/es-unit-tests stays tracked) | **Withdrawn, fixed by the integrator.** 35f02d3d4 untracked it and ignores `build-tests/`; `git ls-files build-tests` prints nothing. |
| F-CS-31 note (backuptool's two-sentence why) | **Refuted.** backuptool:1089 `why` prints "THIS DEVICE CAN'T RESTORE SETTINGS" alone; the long form at :1090 is `fail`'s console line. CloudText.cpp:398 pairs the protocol line. |
| Coverage 5 (`CloudTransferJob::running()` under `sInstanceLock`) | **Checked, no inversion.** `running()` takes CloudTransferJob's own `sMutex` (CloudTransferJob.cpp:42-51). CloudTransferJob calls into ThreadedCloudSync only through `whyForCode` and `restampStoppedParts`, neither of which locks. |

### GPT seat (E1-gpt.md)

| ID | Outcome |
|---|---|
| G-E1-01 (reap flock blocks past the budget) | **Fixed** 5e390e128. The guard is tried with LOCK_NB every 5 ms until the acquire's deadline. Before: `AtomicFileTests.cpp:400 values: CHECK( -1 == 0 )` (the alarm killed an acquire still blocked); `:401 CHECK( 5000 < 3000 )`. |
| G-E1-02 (guard failure reinstates the race) | **Fixed** 5e390e128. Without the guard nothing is removed (fail closed), and the budget ends the wait. B's `wait_lock` takes the same flock and fails closed the same way (next db0f669bf4). Before: `:421 values: CHECK( 1 == 0 )`; `:422` the stale lock had been removed and taken. |
| G-E1-03 (a reload discards retained changes) | **Fixed** 800c818d3. `loadSystemConf(keepPending)` keeps each unsaved change whose key the file still holds as it was when the change was made, and drops one somebody wrote since (wifictl join's wifi.ssid). The rule is `pendingAfterReload`; GuiWifi's reload keeps pending changes. The default (nothing kept) stays for GuiMenu's reloads after a settings restore or factory reset, whose job is to drop them. Before: `:757 values: CHECK( 0 == 2 )`. |
| G-E1-04 | **Fixed** 44705df2d (= claude G-E1-02). |
| G-E1-05 (recovery from a private .tmp makes 0644 copies) | **Fixed** 44705df2d. The recovery's mode is now the permission bits every copy shares (live, .tmp and .backup ANDed). Before: `:850` and `:859 values: CHECK( 420 == 384 )`. |
| G-E1-06 | **Fixed** 54d5699b2 (= claude G-E1-04). Before: `CloudTextTests.cpp:1469`/`:1470`: `"1789000000 130 cancelled"` was taken as this run's. |
| G-E1-07 | **Fixed** 162d2fedb (= claude G-E1-05). |
| PL-065 "holds in part" (the fixture failed on the first read) | **Fixture added** 44d174436. es-file-tests defines its own `read()` that fails part way. Against the base's readText: `base readText: ok=1 size=8191 failure reached=1` (the prefix returned as the whole file). At this tree: not read, "". |
| Coverage 6 (`sh -c 'tool --password "front back"'`) | **Leak confirmed and fixed** b036967fc. The base 7eae8ed91 masked it; my own F-ES-09 rewrite (dcf7fa8c7) regressed it, and both inner-quoted forms went to the log unmasked. Inside a quoted string, the inner command's quotes now keep a word whole. Before: `MaskSecretsTests.cpp:187 values: CHECK( sh -c 'tool --password "front back"' == ... )`, and `:188`-`:190` likewise. |

### Every suite's line, final
- `es-unit-tests`: **167/167 cases, 1764 assertions, SUCCESS**
- `es-file-tests`: **21/21 cases, 3346 assertions, SUCCESS** (tmpfs and the /workspace disk)
- `es-file-tests-win32` (new): **2/2 cases, 14 assertions, SUCCESS**
- `.githooks/pre-push-test`: **PASS** (15 ok)
- E2's `tests/app-unit`, built out of tree in /workspace/tmp:
  - app-unit-tests 16/106
  - proxycards-tests 6/31
  - bookkeeper-tests 4/15
  - jobs-tests 4/21
  - all SUCCESS
- `tests/credential-quoting.py`: rc=0, "10 credential call site(s), 10 quoted, 0 bare"
- `tools/es-syntax-check --tree <wt>` (build tree c0f4f4da0): **PASS**, 18 files OK:
  - CloudText, ThreadedCloudSync, GuiWifi
  - SystemConf, AtomicFileUtil, StringUtil, Settings
  - and the users of the changed headers: CloudTransferJob, GuiCloudTransfer, GuiMenu, main, NetworkThread, ApiSystem, FileData, ProxyCards, SaveStateBookkeeper, GuiSaveState, AsyncNotificationComponent
- `g++ -std=c++17 -D_WIN32 -Wall -fsyntax-only es-core/src/utils/AtomicFileUtil.cpp`: clean
- Non-ASCII comment scan over every touched `.cpp`/`.h`: nothing
- `tools/es-untranslated`: 595 fork strings, 595 with French, 0 without. `tools/vocabulary-check`: 156 judged, 0 wrong. `msgfmt --check` on fr: clean. No new player string in this follow-up.

### For you
1. **CloudTransferJob** (not E1's file) still calls the clock-based `restampStoppedParts(command, time_t, token)`. It now carries the token rule, but not the file-identity rule. The fix is to take `ThreadedCloudSync::readStamps(mCommand)` at the job's start and call the new overload with it.
2. The G-E1-03 split is deliberate: GuiMenu's reloads after a restore or factory reset (:319, :4788) keep the default, which drops pending changes. If either should keep them, it passes `true`.
3. `/tmp/.system.cfg.lock.reap` as a directory now makes settings saves refuse, where they used to go ahead unguarded. The log says the lock was not free.
4. The VM proofs from the first report still stand: PL-024 live-lock, PL-068 walk, PL-069 VmSize, PL-072 frame, F-CS-14 slot 3, and the Wi-Fi frames. Add one for G-E1-03: have a save refused behind a held lock, join a network from the picker, free the lock, then save; the refused change lands and the joined network's keys are the join's.

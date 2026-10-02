# Council review — stream E2 (EmulationStation application), audit #307 / #308

## Corpus provenance

Read-at-time corpus, as embedded by the Facilitator (I did not re-read or re-hash any file):

| path | sha256 (verified at embed time) |
|---|---|
| `docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/E2.diff` | `fcacb2165a1d6341c9b95397119ac6429728ac9f4a8be537e4d417e900307820` |
| `docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/E2.plan.md` | `0e1f3960099d3a87b5c1e33d7900075aa07666b72ed64d322747c0b80efb3eb8` |
| `docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/E2.report.md` | `7cbe8d4573354fb5f7e116b38d91fa0bb827529cb6fa43360535c1f092a9c5dd` |
| `.claude/rules/engineering-practices.md` | `d6f88a6f4cd9c61b0e6ef728625c6a1cec9dc6f58e1db578cf0987f10f870c1a` |
| `.claude/rules/upgrade-and-install.md` | `de4a683f9a36f9100e6fd98be11ad84d736f370374c40f74c445a2b81eca1995` |
| `.claude/rules/es-player-text.md` | `554225c68e627a3bde8969a77f177aea14f5bcd85b0bcc740631d402a5f1f7a7` |
| `.claude/rules/es-native-ui.md` | `48cd5ac727b6d05d0e5acf5a17e7591d96a56e574d27f48a5c0210c5499afcb7` |
| `.claude/rules/es-code-traps.md` | `9d5d6995714c9a1287c84f0c02a92de244271a4bdad8e53d29bb61115ba51d0f` |
| `.claude/rules/es-ui-style-guide.md` | `150d0ac637626d771871eab48db995d8fc46c69ed7cf786240213649d264ad02` |

Hunk citations below are the `@@` headers as they appear in `E2.diff`.

---

## 1. Per punch item

### PL-014 — the folder rescan deletes FileData the collections and the filter index still point at

**Verdict: holds in part.** The diff replaces `clear()` + `populateFolder` with a read-into-fresh-tree-and-merge (`SystemData.cpp` `@@ -325,26 +386,129 @@`; `FolderMerge.h` new). A file still on disk keeps its object; only vanished entries are deleted, and before each deletion `dropCollectionEntries(game)` finds and removes every collection wrapper by path while the source is alive (`SystemData.cpp` `@@ -296,6 +301,46 @@`). The group system's virtual folder is edited in `Tree::attach`/`Tree::vanished`, and the rescan is now refused while the hasher, the scraper or a game holds pointers (`if (ThreadedHasher::isRunning() || ThreadedScraper::isRunning() || FileData::GetRunningGame() != nullptr)`), leaving `mFolderScannedAt` unrecorded so it retries.

What is missing against the item:
- The mechanism differs from the verdict's ("drop the collections' and the filter index's references before the clear, re-point after"). It addresses the same holders and more; I consider the substitution sound, but it is a substitution.
- The acceptance ("rescan soak on the VM, 200 iterations, no crash") is not in the packet.
- The only test in the packet (`tests/app-unit/FolderMergeTests.cpp`) exercises the pure header against a node fake. The `SystemData` adapter — `FindByPath` + `view->remove(entry)`/`delete entry`, `groupFolder->mChildren` surgery, the `mFilterIndex = nullptr` window around `delete fresh` — has no test. The report's "FAIL against today's semantics" line for this test cannot be a run of the unfixed code (the header is new); it is a stand-in.
- Whether `populateFolder` indexes what it creates decides whether the merge double-counts (see G-E2-05). Not decidable from the packet.

### PL-029 — the settings-first restore promises the ticks and restores everything

**Verdict: holds (code); acceptance unproven.** The restore form writes the ticks to `JourneyTiers::PATH` on YES only when something besides settings is ticked, passes `--then-cloud` only then, and asks a question without "ANYTHING ELSE" otherwise (`GuiMenu.cpp` `@@ -4655,14 +4738,41 @@`). `main.cpp` reads the record uncached, builds the continuation with `JourneyTiers::command(journeyTiers)` — `cloud_restore --yes --saves-only` for saves, `cloud_content_restore --selected [--with-media|--media-only]` for content — and names the ticked tiers in the prompt (`main.cpp` `@@ -944,35 +946,86 @@`). `JourneyTiersTests.cpp` pins "settings and saves ticked restore saves and no ROMs" (`CHECK_FALSE(has(cmd, "cloud_content_restore"))`).

Deviations and gaps:
- The verdict named "the marker `backuptool` writes carries the ticks"; the stream used a sidecar record and left `backuptool` alone (another stream's). Whether `backuptool restore` leaves `/storage/.cache/cloud_sync/journey-tiers` untouched is asserted in comments ("the settings backup deliberately does not capture" it) and not shown.
- `Already written` is answered by "read both": a marker with no record keeps the old `--all` continuation and the old prompt (`JourneyTiers::command` `!t.known` branch; `main.cpp` question selection). Correct against D-WORKFLOW-050.
- The acceptance's "a frame of the done page lists the two tiers" cannot be satisfied as written (settings ran before the restart); the report says so. The journal check is a VM step.
- `items` for the page is counted from `/storage/.cache/cloud_sync/content-systems` — a file name the diff assumes is `--set-systems`'s output; not shown.

### PL-030 — cloud folder names reach the shell unquoted

**Verdict: holds (C++ half).** `cloudSetSystemsCommand` joins the names and passes one `cloudShellQuote`d argument (`GuiMenu.cpp` `@@ -4008,6 +4035,23 @@`; both call sites at `@@ -4227,11 +4298,11 @@` and the new BIOS-alone path). `tests/cloud-set-systems-quoting.py` compiles the shipped functions and runs the built command through `/bin/sh` against a recording stub with `a$(touch …)b`, backticks, a closing-quote injection and `it's`. The script-side refusal is stream A's, as the plan says.

### PL-054 — the send card says NOW ON YOUR ACCOUNT without the flush stamp

**Verdict: holds.** `ProxyCards.cpp` `@@ -114,10 +127,18 @@`: the two account sentences are pushed only `if (sent)`; token stays `sent ? "sent" : "completed"`. `ProxyCardsTests.cpp` "send card: an empty queue without the flush stamp says COMPLETED alone" (`CHECK(card->action.empty())`) fails on the old branch and passes on the new; the sibling case with the stamp keeps the sentence.

### PL-056 — two top-up watchers on one progress file

**Verdict: holds, with G-E2-02.** `topUp` records the request in `sTopUpWanted` and starts a watcher only when `sTopUpRunning.exchange(true)` was false (`@@ -414,8 +492,10 @@`); `topUpWatcher` drains requests and hands off with the `load()`/`exchange(true)` re-check (`@@ -294,20 +333,60 @@`). I traced the handoff race (a request arriving between the watcher's `exchange(0)` and its `sTopUpRunning = false`, and between that and its `load()`): in every ordering exactly one of the two threads owns the request. The test "two requests, one watcher at a time, and the second still runs" asserts `maxOpen == 1` and both ctl runs. The stream went past the verdict's one-line `exchange` fix (queuing, a wait for a running game); that extra behaviour is where G-E2-02 lives.

### PL-061 — the exit capture is not among the launch guards

**Verdict: holds in part.** `captureGate` (`FileData.cpp` `@@ -773,10 +823,68 @@`) is called first among the gates (`@@ -826,6 +934,9 @@`), waits up to 300 ms inline then up to 10 s behind `RECORDING YOUR LAST GAME'S SAVES...`, and gives up once per capture (`sCaptureGivenUp`). The exit marks the capture in flight before spawning its thread (`@@ -1073,6 +1194,8 @@`) and clears it with a generation-checked `compare_exchange_strong` (`@@ -1084,21 +1207,27 @@`). Not the named mechanism (joining the `stillRunning` list in `launchWhenGone`) but a gate with the same effect. The journal-order acceptance is a VM step. See G-E2-06 for the generation bump.

### PL-062 — the hub's gated rows keep offering setup after setup completes

**Verdict: holds.** `cloudAddGatedEntry`'s handler re-checks `exists("/storage/.config/rclone/rclone.conf", false)` at the press, undims through a weak pointer and runs the action (`GuiMenu.cpp` `@@ -5866,8 +6006,24 @@`); `cloudAddTransferRow` shares one `press` between its two branches so the current-run redirect survives (`@@ -5127,16 +5240,9 @@`). `tests/cloud-gated-row.py` builds a row unconfigured, presses (dialog, no run), flips the config, presses (runs once, undimmed). The walk is a VM step.

### PL-068 (E2's half; added by the coordinator, not in the plan)

**Verdict: holds, callee outside the packet.** `transferGone` polls `Utils::AtomicFile::isFlockHeld(CLOUD_SYNC_LOCK_PATH)` every 500 ms and, once the worker is stopping, five seconds more before refusing the deletion (`SaveStateBookkeeper.cpp` `@@ -29,8 +37,65 @@`). `isFlockHeld` is E1's and not shown; the "fails closed on an unopenable lock file" property is asserted by the test "a lock file that cannot be opened is taken as held", which itself cannot run as root (G-E2-09).

---

## 2. Findings

### G-E2-01: `joinWifiNetwork` changed from `bool` (true = joined) to `int` (0 = joined); no caller is in the packet
- **Severity:** Medium (High if any caller still tests the return as a truth value)
- **Category:** Signature inversion / unverifiable caller
- **Where:** `es-app/src/ApiSystem.cpp` `@@ -674,12 +674,14 @@`; `es-app/src/ApiSystem.h` `@@ -275,7 +275,11 @@`
- **What:** The return's truthiness inverts (`0` on success). Every caller must be rewritten; `-fsyntax-only` accepts an unchanged `if (joinWifiNetwork(name))` and the old `bool ok = joinWifiNetwork(...)`. The report says GuiWifi picks words with `WifiText::joinFailure` (commit `c0def453a`), but `GuiWifi.cpp` is not in the diff, and `WifiText::joinFailure` (`WifiText.cpp` `@@ -94,6 +106,11 @@`) has no caller anywhere in the packet. The header also keeps its old first paragraph ("True only when the script said "joined"") above the new contract.
- **Failure scenario:** a join that succeeds is reported as failed and the key-advice dialog shows; a join that fails with rc 2 is reported as joined.
- **Evidence:** I looked for `joinWifiNetwork(` and `joinFailure(` outside the two files and found neither. The harness line names 24 `.cpp` checked but does not list GuiWifi.cpp. One visit to `GuiWifi.cpp` settles it.

### G-E2-02: STOP IT AND PLAY over a top-up with a second request queued starts the queued run while the launch is waiting for the top-up to be gone
- **Severity:** Medium
- **Category:** Concurrency / gate interplay
- **Where:** `es-app/src/ProxyCards.cpp` `@@ -294,20 +333,60 @@` (`topUpWatcher`), `@@ -425,7 +505,12 @@` (`stopTopUp`)
- **What:** The watcher's wait before a queued run is `if (!first) while (FileData::GetRunningGame() != nullptr) sleep(1s)`. A launch that chose STOP IT AND PLAY is not a running game: per the plan's own PL-061 verdict, the launch's `stillRunning` wait "covers the sync, the transfer, the send and the top-up", i.e. it waits on `ProxyCards::topUpRunning()` (`sTopUpRunning`), which stays true for the whole watcher lifetime. So: `stopTopUp()` signals the current ctl (once; `RunLock::holder`), it exits 143, `runTopUp` says SKIPPED for five seconds, the watcher loops, finds the index's request, sees no game running (the launch is waiting), and starts a new ctl. `sTopUpRunning` never drops; the launch waits its bound; `sTopUpStoppedForGame` was reset by the new run. Exactly PL-056's two-request scenario plus a launch.
- **Failure scenario:** link returns + index completes (two requests); the player launches over the first run's card and picks STOP IT AND PLAY; the second run starts under the spinner and the launch either waits out its bound or starts with the ctl running — the outcome the question promised not to produce.
- **Evidence:** the wait condition in `topUpWatcher`; `stopTopUp` signals once; nothing in the diff tells the watcher a stop for a game is pending. `launchWhenGone`'s body is outside the packet; the finding is conditional on it waiting on `topUpRunning()`, which the plan states.

### G-E2-03: two new `onFinalize` registrations on pages that may already register one
- **Severity:** Medium (cannot tell from the packet)
- **Category:** Callback registration / lifetime
- **Where:** `es-app/src/guis/GuiMenu.cpp` `@@ -6006,12 +6162,34 @@` (`cloudOAuthOwnSession`), `@@ -4767,6 +4878,18 @@` (transfer form `s->onFinalize([content, media] …)`)
- **What:** The stream's own harness models `GuiSettings::onFinalize` as a single slot (`tests/cloud-oauth-lifetime.py`: `void onFinalize(const std::function<void()>& f) { finalize = f; }`). If the real `GuiSettings` is single-slot, `cloudOAuthOwnSession(s)` either replaces a finalizer the sign-in page already set (the hunk at `@@ -7178,6 +7375,7 @@` closes a `});` block immediately before the new call, which may be one) or is replaced by one set later; the same for the transfer form. In the harness `cloudOAuthShowSignIn` is a stub, so the harness cannot see a collision.
- **Failure scenario:** the sign-in page's own cleanup (a poll thread, a session) runs and the `cloud_oauth cancel` never does, or the reverse.
- **Evidence:** no `onFinalize` accumulation semantics visible in the packet; two different finalizers registered on OAuth pages in the diff (`cloudOAuthOwnSession` at three call sites). One visit to `GuiSettings.h` (`mOnFinalizeFunc` vs a vector) settles it.

### G-E2-04: `rememberSaveState`/`launchNow` drop a chosen state that is not one of the repository's live objects
- **Severity:** Medium (cannot tell from the packet)
- **Category:** Regression risk introduced by a fix
- **Where:** `es-app/src/FileData.cpp` `@@ -728,9 +737,50 @@`
- **What:** `rememberSaveState` records `state->fileName` for any `saveStateInfo` that is not the empty/auto/new shared object; it never consults `LaunchGameOptions::isSaveStateInfoTemporary` (the field is visible in the `FileData.h` context at `@@ -70,6 +70,11 @@`). A deferred launch then sets `saveStateInfo = nullptr` and re-finds it only among `getSaveStates(game)`; a temporary object is not there, so the launch starts without it (or `ViewController::launch` re-prompts — outside the packet). The `tests/launch-deferred-state.py` fake `LaunchGameOptions` has no temporary flag, so the case is untested.
- **Failure scenario:** any path that hands a temporary `SaveState` to `launchGame` and is then deferred by a gate (STOP IT AND PLAY, PLAY NOW, the new capture gate) loses the choice; the temporary also leaks (never handed to the launch that would have deleted it).
- **Evidence:** the field's existence and the absence of any reference to it in the new code. One visit to the users of `isSaveStateInfoTemporary` settles whether such temporaries carry file names.

### G-E2-05: the merge's filter-index bookkeeping depends on whether `populateFolder` indexes
- **Severity:** Low (cannot tell from the packet)
- **Category:** Index bookkeeping
- **Where:** `es-app/src/SystemData.cpp` `@@ -325,26 +386,129 @@` (`Tree::arrived` → `addToIndex`; `mFilterIndex = nullptr; delete fresh; mFilterIndex = index;`)
- **What:** The code assumes the fresh tree is "never indexed": arrived entries are indexed in `arrived()`, kept-file twins are deleted with the index set aside. If `populateFolder` indexes what it creates, every arrived game is counted twice and every twin is counted once and never removed.
- **Failure scenario:** filter counts drift after each rescan; no crash.
- **Evidence:** the original finding's "re-index the filter after `populateFolder`" suggests `populateFolder` does not index, which is consistent with the diff; the packet cannot confirm it.

### G-E2-06: `captureGate` bumps `sExitGeneration` before the launch is certain, and stalls the interface thread
- **Severity:** Low
- **Category:** Gate side effect
- **Where:** `es-app/src/FileData.cpp` `@@ -773,10 +823,68 @@`
- **What:** `++sExitGeneration` happens when the spinner goes up, so the capture's post skips the exit sync ("another game was launched since; its exit syncs"). The relaunch then meets the remaining gates; KEEP WAITING at any of them refuses the launch, and the owed exit sync has already been forfeited. Also the first 300 ms are a `sleep_for(20 ms)` loop on the interface thread — a deliberate trade the comment defends, but a frozen frame.
- **Failure scenario:** capture slow → spinner → relaunch → a top-up question → KEEP WAITING; the last session's saves are not synced until the next exit.
- **Evidence:** no other `++sExitGeneration` on a launch path in the diff; the bump precedes `pushGui(new GuiLoading…)`.

### G-E2-07: the failed-run footer is emptied; the rule places TRY AGAIN / CLOSE on line 7
- **Severity:** Low
- **Category:** Player text / rule deviation
- **Where:** `es-app/src/guis/GuiCloudTransfer.cpp` `@@ -803,10 +816,13 @@`; `es-app/src/guis/GuiOfflineScan.cpp` `@@ -316,7 +340,9 @@`
- **What:** `es-player-text.md` § Recover, as embedded, says the page offers TRY AGAIN beside CLOSE "on line 7 … buttons by position, never by letter". The fix drops the words from line 7 (`std::string()`) and relies on a help bar drawn only when `fullScreenMenus()`. The report frames this as a conflict with an "(A)" wording that the embedded rule no longer carries; the deviation that remains is the empty line 7.
- **Failure scenario:** none functional; a blank seventh line where the rule expects the recovery sentence.
- **Evidence:** the two footer hunks; the rule text.

### G-E2-08: three player-text observations
- **Severity:** Low
- **Category:** Vocabulary
- **Where:** `ProxyCards.cpp` `@@ -294,20 +333,60 @@` (`_("SKIPPED - YOU STARTED A GAME")`); `GuiMenu.cpp` `@@ -7498,17 +7713,37 @@` (`_("WI-FI CONFIGURATION ERROR")`); `JourneyTiers.h` (`>>> tier` labels)
- **What:** (a) The outcome table in `es-player-text.md` reads `SKIPPED - A GAME WAS STARTED`; the diff uses `YOU STARTED A GAME`. No `.po` entry was added, so the msgid pre-exists (the sync card's, per the comment) — the rule's table, not the code, is likely stale; noting it so the rule keeper can reconcile. (b) `WI-FI CONFIGURATION ERROR` is an upstream string in developer register ("everyday, not formal", D-UI-031) reused on a fork flow the stream rewrote. (c) The continuation's tier labels (`SAVES`, `ROMS AND BIOS`, `ROMS, BIOS, AND GAME CONTENT`) travel as raw English protocol text, as before; whether the page localizes them is outside the packet.
- **Evidence:** the hunks; the `.po` hunk carries none of the three.

### G-E2-09: test evidence that is environment-bound or stand-in
- **Severity:** Low
- **Category:** Test evidence
- **Where:** `tests/app-unit/BookkeeperTests.cpp` (mode-0 case), `tests/app-unit/JobsTests.cpp` (`stopBeforeThePid`), report §"Punch items" FAIL lines for PL-014, PL-061, F-ES-26
- **What:** (a) `REQUIRE_MESSAGE(::access(lock, R_OK) != 0, …)` fails the case outright under root, which is how a device runs. (b) `REQUIRE_MESSAGE(logged("group 0"), …)` requires the test to win a race against a detached thread's first `read`; on a loaded runner the case fails rather than skips. (c) The FAIL-before-fix lines for `FolderMerge`, `captureGate` and `AppWindow` are runs against stand-ins the stream wrote — the code under test is new — not against the unfixed tree; they are not the "seen to fail on the unfixed code" the plan asked for.
- **Evidence:** the `REQUIRE`s in the two files; the absence of any old-code path those three tests could exercise.

---

## 3. Sweep rows

Spot-checked as fixed, against the diff:

| row | verdict on the diff |
|---|---|
| 1-raoffline claude F-RA-05 | ✔ `ThreadedHasher.cpp` `@@ -59,6 +59,14 @@` sets `mTotal = 0` in the offline branch; `tests/hasher-offline-index.py` asserts no card, no threads, no toast. |
| F-RA-08 / gpt F-RA-16 | ✔ `OfflineAchievements.cpp` `@@ -315,10 +291,10 @@` signals `RunLock::holder(SCAN_LOCK, "raofflineproxy-ctl")`; `RunLock.h` fails the shared `flock` before trusting the pid and checks `/proc/<pid>/cmdline`. `RunLockTests.cpp` holds a real lock. Fails *open* only where it cannot open the file (returns 0 → no stop), acceptable for a root-owned lock. |
| F-RA-09 / gpt F-RA-17 | ✔ `ProxyCards.cpp` `@@ -234,6 +257,19 @@`, `@@ -294,20 +333,60 @@`: 143/130 read as stopped, `stoppedForGame` says SKIPPED, `topUpWhy(stamped ? s.why : "")`. Subject to G-E2-02. |
| F-CS-07 / F-RA-14 / gpt F-RA-22 / gpt F-CS-36 | ✔ `GuiCloudTransfer.cpp` `@@ -223,7 +224,9 @@`, `@@ -322,7 +325,7 @@`, `@@ -499,16 +502,22 @@`; `GuiOfflineScan.cpp` `@@ -115,7 +119,7 @@`, `@@ -167,7 +171,7 @@`, `@@ -215,16 +219,23 @@`: `BUTTON_OK`, help bar drawn by the page. G-E2-07 on the footer. |
| 8-es claude F-ES-07 | ✔ `FileData.cpp` `@@ -773,10 +823,68 @@`: `sPlayThroughSend.exchange(false)` at entry, `!playThroughSend` at the send gate (`@@ -864,7 +975,7 @@`). |
| F-ES-10 | ✔ `ViewController.cpp` `@@ -35,6 +36,12 @@`, `@@ -62,6 +69,14 @@`; both restart sites call `configurationReplaced()` (`GuiMenu.cpp` `@@ -304,13 +307,37 @@`, `@@ -4676,6 +4786,7 @@`). Whether any other exit-time writer exists is outside the packet. |
| F-ES-11 | ✔ with G-E2-04. |
| F-ES-13 | ✔ `maintenanceWhy` (`GuiMenu.cpp` `@@ -304,13 +307,37 @@`), used at `@@ -336,7 +363,7 @@`; `tests/maintenance-why.py`. |
| F-ES-25 | ✔ `CloudDimmableEntry` deleted (`@@ -4986,24 +5109,14 @@`); `CloudHubRows::Row::entry` is a `weak_ptr<MultiLineMenuEntry>`. Behaviour diff stated in the comment ("applies the dim at once"), per § Before deleting a duplicate. |
| F-ES-26 | ✔ `AppWindow.h`; `AppWindow::closing()` after the main loop (`main.cpp` `@@ -1261,6 +1314,11 @@`); posts routed in GuiMenu, ProxyCards, OfflineScanJob, CloudOffer, FileData. The lock is held across `postToUiThread` — sound as long as `Window::postToUiThread` only queues. |
| 8a gpt F-ES-05 | ✔ `FileData.cpp` `@@ -1084,21 +1207,27 @@`: toast before the generation check. |
| 8a gpt F-ES-16 | ✔ `cloudLatestRun` shared by detail and why (`GuiMenu.cpp` `@@ -4438,13 +4512,16 @@`, `@@ -4472,7 +4555,7 @@`); `tests/cloud-sync-last-run.py`. |
| 8a gpt F-ES-17 / F-ES-18 | ✔ `cloudOAuthOwnSession` / `cloudSetupPresent` hand-off; `if (understood) return false;` (`@@ -6967,9 +7150,19 @@`); the two Python harnesses. G-E2-03 on the finalize slot. |
| 8b gpt F-ES-10 | ✔ `tests/credential-quoting.py`: `std::string` moved from `QUOTING_CALLS` to `WRAPPERS`, `QUOTED_ARG` requires a literal or a quoting call as the argument, and the flat operand scan still catches a bare name nested inside the wrapper; nine self-test cases run before the scan and exit 2 on failure. |
| 5-cloud claude F-CS-26 / gpt F-CS-24 | ✔ `CloudTransferJob.cpp` `@@ -95,13 +94,48 @@`, `@@ -208,8 +242,12 @@`: request kept in `mStopSignal`, delivered by whichever side sees pid and request together (Dekker-shaped on seq_cst atomics — I checked the four orderings); completion-after-stop clears the flags at `@@ -610,6 +648,17 @@` for `ret == 0 || ret == 9`. The claim that a stopped script never exits 0 is the scripts' (outside). |
| 8-es claude F-ES-08 / 8a gpt F-ES-08 | ✔ `CaptureRotation.cpp` `@@ -145,25 +145,31 @@` (mtime against `started`, `shouldRecord`); `CaptureRotationText.cpp` `@@ -41,6 +41,20 @@`; call site gated on `exitCode == 0` (`FileData.cpp` `@@ -984,8 +1095,18 @@`). Pre-#288 records still migrate (`recordFromOwnLaunch` false → write). |
| F-ES-20 | ✔ `LaunchCommand.h` reads whole words via `Utils::CommandLine::wordEnd` (callee outside). |

Withdrawals I can judge from the packet:
- **gpt F-RA-25** (send exclusion released early): the embedded `es-native-ui.md` § The cards at the link's return (D-UI-109) says "the send card, and the top-up's card stacked under it" — the withdrawal's reason holds against the rule as embedded.
- **gpt F-RA-21** (hash fetch on the interface thread): the embedded `es-code-traps.md` says "moving the fetch off it is #300's follow-up, not a one-line change" — the deferral is consistent with the rule; the 10-minute back-off (`SystemData.cpp` `@@ -936,6 +1100,28 @@`) is in the diff as the interim.
- **claude F-RA-16** (no French): the `.po` hunk appends French for every string added in the diff's source (I matched the eight journey questions, the two restore questions, `RECORDING…`, `YOUR SAVES ARE IN:`, the phone line, the three CONNECTED-page strings, `YOUR PROGRESS COULDN'T BE READ`, msgid byte-for-byte including `\n\n`); the 564/585/594 counts are the report's.
- **F-ES-17 / 8a F-ES-20** (D-INFRA-010), **F-ES-19**, **F-ES-23**, **F-ES-30**, **8a F-ES-12**, **8a F-ES-14**: each cites a register row or code outside the packet; I cannot judge them. The reasons are of the kind the plan allows (a register decision, a refuting line, upstream fit).
- The first pass's "not mine" withdrawals (GuiBios, GuiScraperRun, GuiScraperStart, DisplayAspectText, CaptureRotation, CloudTransferJob, OfflineScanJob, LaunchCommand.h, credential-quoting) were reversed in the follow-up and are visibly fixed in the diff.

---

## 4. Coverage boundary

Stated, not guessed:

1. **The packet is a subset of what the report claims.** The report names changes to `GuiWifi.cpp` (c0def453a), `CloudText.{h,cpp}` (d17a68460, cb32a0481, 13b16a77e), `ThreadedCloudSync.{h,cpp}` (8eb4c6821), `es-app/tests/unit/*` (LaunchCommandTests, WifiTextTests, CloudTextTests, CaptureRotationTextTests, OfflineAchievementsTextTests, README), and the `DisplayAspect` cache — none is in the diff, while other non-owned files (CaptureRotation, CloudTransferJob, GuiBios, GuiScraperRun, WifiText, credential-quoting) are. Consequently the `.po` carries msgids whose sources are absent (`SOME ACHIEVEMENT IMAGES…`, `SOME GAMES COULDN'T BE SAVED`, the nine why sentences, the two Wi-Fi strings), and these calls are made to code not shown: `CloudText::localizedWhy/cleanLine/scanWhy/topUpWhy/shortenWhy`, `ThreadedCloudSync::restampStoppedParts`, `DisplayAspect::forgetScreenshots`, `WifiText::joinFailure`'s caller. F-CS-05 / F-CS-23 (restamping), F-ES-15 / 8a F-ES-09 (screenshot cache), the `cleanLine` "same line for every input" claim, and the whole of F-WF-03's GuiWifi half are therefore unjudged.
2. **Callees whose contract the fixes rely on and the packet cannot show:** `Utils::AtomicFile::isFlockHeld` (fail-closed on an unopenable file), `Utils::AtomicFile::writeText`, `Utils::CommandLine::wordEnd`, `Utils::String::maskSecrets`, `MultiLineMenuEntry::setDimmed`, `Window::renderHelpPromptsEarly(const Transform4x4f&)`, `GuiSettings::onFinalize` (G-E2-03), `SystemData::populateFolder` (G-E2-05), `FolderData`'s friendship with `SystemData` (the local `Tree` reaches `mChildren`), `SaveState::fileName` and `isSaveStateInfoTemporary`'s users (G-E2-04), `ViewController::launch` with a null `saveStateInfo`, `launchWhenGone`'s `stillRunning` list (G-E2-02), `recordMtime`/`fromTable` in CaptureRotation, `tstart` and `exitCode` in `launchGame`, GuiCloudTransfer's tier-label localization, and whether `backuptool restore` leaves `/storage/.cache/cloud_sync` alone.
3. **Compile-level claims** (`es-syntax-check` PASS per file, `<set>`/`<thread>`/`<chrono>` includes, the ASCII-comment grep, CRLF) are the report's; the packet has no harness output.
4. **Commit bodies** — every `Already written:` line — are not in the packet; I judged the property from the code (the marker-without-record branch, `shouldRecord` on pre-#288 records, `RunLock` on stale lock files) and found each honoured where the code is visible.
5. **Runtime and device**: every VM acceptance (the PL-014 soak, the PL-029 journal, the PL-061 order, the PL-062 walk, PL-068 under a held lock, the 640x480 frames); the deadlock/race analyses in G-E2-02 and F-CS-24 are reasoned from the diff, not observed. The `AppWindow` gate cannot cover `ThreadedCloudSync`'s direct card calls (the report says so), which remain a post-`closing()` hazard outside this packet.
# Council seat E-app — audit of the fix round, packet `seats/E-app.diff`

**Read-at-time corpus:** the 13 embedded sources, cited by the paths and hashes in the per-source headers (provenance block at the end). I did not re-read or re-hash anything.

**What the packet is and is not.** The diff covers 44 distinct files under `es-app/src` (two of them, `views/ViewController.cpp` and `views/ViewController.h`, appear **twice** with identical hunks — a packet-assembly artefact, see G2-E-app-10). It does **not** carry: `CloudText.*`, `ApiSystem.*`, `AppWindow.h`, `CaptureRotation*`, `CheevosRetry*`, `CloudTransferJob*`, `DisplayAspect.*`, `SaveStateRepository*`, `ThreadedScraper*`, `utils/CommandLineUtil.h`, `utils/AtomicFileUtil.*`, `SystemConf.*`, `Settings.*`, `MultiLineMenuEntry`, `WatchersManager`, any test source (`es-app/tests/unit/**`, `tests/app-unit/**`, `tests/*.py`), or any script. Every verdict below that depends on one of those says so. The reports' FAIL→PASS lines are claims; none of the tests they name is in the packet, so I could not check a single case for whether it can fail.

---

## 1. Punch items

### E2's items (`E2.items.md`)

| Item | Verdict | Where in the diff / what is missing |
|---|---|---|
| **PL-014** (rescan deletes FileData others hold) | **holds by mechanism; the acceptance (the 200-iteration soak) is a runtime not in the packet** | `FolderMerge.h` (new, whole); `SystemData.cpp @@ -325,26 +386,129 @@`: the early return while `ThreadedHasher::isRunning() \|\| ThreadedScraper::isRunning() \|\| FileData::GetRunningGame() != nullptr` (folder time not recorded), the fresh tree (`FolderData* fresh = new FolderData(...)`, `populateFolder(fresh, fileMap)`), `Tree::vanished` (drops collection entries, group-folder pointer, then `delete n`), `Tree::arrived` (`addToIndex`), `mFilterIndex = nullptr; delete fresh; mFilterIndex = index;`, and the group view dropped/remade. Three load-bearing assumptions are outside the diff: (a) `IGameListView::remove(entry)` deletes the collection entry (the comment says it mirrors `deleteCollectionFiles`); (b) `FolderData` keeps no by-name map beside `mChildren` that `Tree::attach`'s direct `groupFolder->mChildren.push_back(n)` bypasses; (c) `populateFolder` and the `FileData` constructor index nothing (the G-E2-05 withdrawal). |
| **PL-029** (settings-first restore restores everything) | **holds by mechanism; journal and frame not in packet** | `JourneyTiers.h` `record`/`parse`/`command`; `GuiMenu.cpp @@ -4655,14 +4738,57 @@`: record written on YES only when `rest`, `--then-cloud` appended only when `rest`, the no-rest question drops "ANYTHING ELSE YOU TICKED"; `main.cpp @@ -944,35 +946,86 @@`: the continuation is `JourneyTiers::command(journeyTiers)`, and a marker with no record keeps the old command and prompt (read both). With settings+saves ticked, `command()` emits only `cloud_restore --yes --saves-only` — no `cloud_content_restore`, as the acceptance asks. The page's `items`/`itemsAfterContent` arithmetic for the new command is not judgeable here (coverage § 6). |
| **PL-030** (folder names reach the shell unquoted) | **holds for the C++ half, contingent on `cloudShellQuote`** | `GuiMenu.cpp` `cloudSetSystemsCommand` joins the names and wraps them once in `cloudShellQuote(picked)`; the save func (`@@ -4227,11 +4298,11 @@`) and the BIOS-alone path call it. `cloudShellQuote` is only forward-declared in the diff (`static std::string cloudShellQuote(const std::string& value);`); its body is not in the packet, and the acceptance's guest run and the script's own refusal are stream A's. |
| **PL-054** (NOW ON YOUR ACCOUNT without the flush stamp) | **holds** | `ProxyCards.cpp @@ -114,10 +137,18 @@`: the two account sentences are pushed only `if (sent)`; token stays `completed` otherwise, outcome word `COMPLETED` — inside the outcome vocabulary. |
| **PL-056** (two top-up watchers) | **holds by mechanism; the unit test is not in the packet** | `ProxyCards.cpp @@ -414,8 +526,10 @@` `topUp`: `sTopUpWanted \|= kind; if (sTopUpRunning.exchange(true)) return;` else one watcher; `topUpWatcher` drains the bits, index's run first. I traced the exchange/store interleavings: no request is lost (a request landing between the watcher's `exchange(0)` and its `sTopUpRunning = false` is picked up by the re-check or by the request's own new watcher). Residual: G2-E-app-05. |
| **PL-061** (exit capture not among the launch guards) | **holds by mechanism; the journal order is the guest's** | `FileData.cpp @@ -773,10 +839,95 @@` `captureGate` is called before the sync check (`@@ -826,6 +977,9 @@`); the exit sets `sCaptureStartedMs` and `sCaptureInFlight = generation` before the thread (`@@ -1073,6 +1237,11 @@`); the thread clears it with `compare_exchange_strong(mine, 0)` so a later exit's slot is never zeroed by an earlier capture. The generation moves only on the go path of the spinner's callback. Residuals: G2-E-app-04 (the 120 s hung branch). |
| **PL-062** (gated rows keep offering setup) | **holds** | `GuiMenu.cpp @@ -5866,8 +6026,24 @@`: the press re-stats `rclone.conf` uncached, un-dims the entry through a weak pointer and runs `action()`; `cloudAddTransferRow` (`@@ -5127,16 +5256,9 @@`) hands the gated branch the same `press` that checks for a current run. |
| **PL-068** (E2 half: the queued deletion) | **holds in part** | DELETE: `SaveStateBookkeeper.cpp` `transferGone` (waits on `Utils::AtomicFile::isFlockHeld`, gives up 5 s after stop) and `TransferLock::take` (exclusive, non-blocking, held through retire and unlink) in `runDelete(w, job)`. COPY: the worker still calls `runCopy(job)` unchanged (`@@ -110,7 +246,7 @@`); `runCopy` takes no `Worker*` and so cannot call `transferGone`. See G2-E-app-01. |

### E1's items (`E1.items.md`)

| Item | Verdict |
|---|---|
| **PL-068** (manager half) | **holds by mechanism** — `GuiSaveState.cpp` `savesTreeBusy`: the card's words when `ThreadedCloudSync::isRunning()`, else `isFlockHeld("/var/run/cloud_sync.lock") && !SaveStateBookkeeper::holdsTransferLock()` → `A SYNC IS ALREADY RUNNING.` / `WAIT FOR IT TO FINISH, THEN TRY AGAIN.` (both in the outcome vocabulary). Asked at DELETE, again at YES, and at COPY. The walk is the guest's. |
| **PL-069** (leaked joinable thread) | **holds by mechanism** — `ThreadedCloudSync.cpp` constructor: `std::thread(&ThreadedCloudSync::run, this).detach();`, `mHandle` removed from `ThreadedCloudSync.h`. The `ls /proc/<es>/task` acceptance is a runtime (and E1 says the task count cannot see this leak). |
| **PL-072** (SKIPPED with no in-place clause) | **holds in part / mechanism present** — `ThreadedCloudSync.cpp @@ -557,6 +568,12 @@`: `keepInPlace = mMoved && ret == CloudExit::NoNetwork && !cancelled && !gaps`, passed to `CloudText::actionCandidates(inPlace, recoveries, keepInPlace)` in both the no-network and the generic branch. The candidate rule itself is CloudText's (outside); the 640×480 frame is the guest's. |
| **PL-024, PL-041, PL-063, PL-064, PL-065, PL-075, PL-078** | **cannot tell from the packet** — core (`AtomicFileUtil`, `SystemConf`) and hook files are not in `E-app.diff`. |

---

## 2. The first audit's findings, as the diff shows them

### E1, claude seat

- **G-E1-01** (join result inverted) — **withdrawal holds on the caller side.** `GuiWifi.cpp` `join` uses `GuiLoading<WifiText::JoinAnswer>` and `if (!answer.joined())`; `WifiText.h` defines `JoinAnswer { int code = 1; bool joined() const { return code == 0; } }` with no bool conversion. The callee's return type (`ApiSystem::joinWifiNetwork`) is outside the packet; the compile itself is the proof, and the syntax-check line is a claim.
- **G-E1-02** — core files; **not in packet**.
- **G-E1-03** (unplanned changes) — **withdrawal holds for what is visible.** `ThreadedCloudSync.cpp` carries `readStamps`/`restampStoppedParts`; `OfflineAchievements.cpp` `scanWhy` and `ProxyCards.cpp` `topUpWhy` are one-line delegations to `CloudText::scanWhy`/`topUpWhy` (no drift). The four commits' `Already written:` lines are not in the packet.
- **G-E1-04** (stale stop stamp by wall clock) — **answered in part.** The snapshot (`mStampsBefore = readStamps(mCommand)` in the constructor) and the four-argument `restampStoppedParts` are in the diff; the comparison (`CloudText::stampsToRestamp(..., &before)`) is outside. Note: `ThreadedCloudSync.h` says the identity is "inode and change time", while `readStamps` builds it from `st_ino` and `st_mtim` (modification time). Harmless for temp-and-rename writers, but the header and the code disagree.
- **G-E1-05, -06, -07, -08** — tests/core/hook; **not in packet**.
- **G-E1-09** (gate at the button, not the write) — **answered in part.** DELETE now waits and holds the lock (`runDelete`); the COPY record does not (G2-E-app-01). E1's follow-up sentence "only its manifest record is queued, and it waits the same way (:73)" is contradicted by the unchanged `runCopy(job)` call.
- **G-E1-10** — `.gitignore`; **not in packet**.

### E1, gpt seat

- **G-E1-01, -02, -04, -05, -07** — core/tests; **not in packet**.
- **G-E1-03** (reload discards retained changes) — **answered in part**: the call site `SystemConf::getInstance()->loadSystemConf(true)` is in `GuiWifi::join`; the `keepPending` rule is SystemConf's (outside).
- **G-E1-06** — same as claude G-E1-04, **answered in part**.

### E2, claude seat

- **G-E2-01** (`joinWifiNetwork` inversion, unverifiable caller) — **answered on the visible side**: the only caller in the diff is `GuiWifi::join`, rewritten for `JoinAnswer`; the type cannot be tested as a truth value. ApiSystem's side and the `static_assert`s are outside.
- **G-E2-02** (STOP IT AND PLAY starts the queued top-up) — **answered.** `stopTopUp` sets `sTopUpHeldForLaunch` before the signal; `waitForTheGame` (called before every run after the watcher's first) waits up to `LaunchStartSeconds` for `GetRunningGame() != nullptr`, then while it runs. Residual: G2-E-app-05.
- **G-E2-03** (second `onFinalize` replaces the first) — **cannot tell from the packet.** The diff shows `s->onFinalize` in `cloudOpenTransfer` and `cloudOAuthOwnSession`'s `s->onFinalize`; whether those pages register another elsewhere in the base is not visible (the `});` immediately before `cloudOAuthOwnSession(s)` in `cloudOAuthShowSignIn` closes something I cannot see). The withdrawal rests on line citations outside the packet.
- **G-E2-04** (temporary save state dropped) — **cannot tell from the packet**; `FileData.h` shows `isSaveStateInfoTemporary` declared, and `rememberSaveState` handles exactly the three shared states by identity. If any writer sets the flag, the diff would silently launch without the state (it logs a warning); the report says none exists.
- **G-E2-05** (does `populateFolder` index?) — **cannot tell**; `populateFolder` is outside. The diff's correctness (`mFilterIndex = nullptr` around `delete fresh`, `arrived` → `addToIndex`) depends on the answer being "no".
- **G-E2-06** (generation moved early; 300 ms stall) — **answered for the first half**: `++sExitGeneration` sits only on the callback's go path; the capture's post honours `sCaptureWaitedOn`. The 300 ms wait is retained by design, and `es-ui-style-guide.md` § Waiting ("a spinner that flashes for 100 ms is worse than none") supports it; the interface thread does sleep in 20 ms steps for up to 300 ms. The KEEP-WAITING residual (saves delayed to the next sync) is acknowledged in the report and visible in the code.
- **G-E2-07** (footer emptied) — **withdrawal holds, and the rule is already aligned.** `es-player-text.md` § Recover (in this packet) now reads "TRY AGAIN (the confirm button, south) beside CLOSE (the back button, east ...) on the page's help bar". The pages draw the bar (`renderHelpPromptsEarly` in `GuiCloudTransfer::render`, `GuiOfflineScan::render`, `GuiScraperRun::render`).
- **G-E2-08** — (b) **answered**: both Wi-Fi applies now say `COULDN'T CONNECT TO %s.` + `CHECK THE KEY AND TRY AGAIN.` (`openRestoreRelink`, `openNetworkSettings`). (c) `CloudText::unitLabels` is outside; the labels `JourneyTiers::command` emits (`SAVES`, `ROMS AND BIOS`, `GAME CONTENT`, `ROMS, BIOS, AND GAME CONTENT`, and the old `RESTORING ROMS AND BIOS` / `RESTORING SAVES`) are what it must know. (a) **the report's premise is wrong for the card**: the rule's table (in this packet) has `SKIPPED - YOU STARTED A GAME` in the *Card* column and `SKIPPED, A GAME WAS STARTED` in the *Row token* column. `ProxyCards` writes `SKIPPED - YOU STARTED A GAME` on a card — that matches the rule. See G2-E-app-09.
- **G-E2-09** (test evidence) — tests not in packet; **cannot tell**.

### E2, gpt seat

- **G-E2-01, G-E2-02** (journey record) — **answered.** `JourneyTiers::replaceRecord` removes first, writes through the supplied writer, and reports `OldRecordStands` when anything is left; `parse` is `known` only with `journey-tiers=1` and all three tiers each exactly once as `0`/`1`; `GuiMenu` stops the restore on `OldRecordStands` and `main.cpp` offers everything on `!known`.
- **G-E2-03** (capture guard bypass after timeout) — **answered at 10 s**: the callback refuses (`GuiMsgBox` "YOUR LAST GAME'S SAVES ARE STILL BEING RECORDED. TRY AGAIN IN A MOMENT.") while `sCaptureInFlight == capturing`. The bypass survives at 120 s by design (G2-E-app-04).
- **G-E2-04** — as claude G-E2-02, **answered**.
- **G-E2-05** (late stop in CloudTransferJob) — **not in packet**.
- **G-E2-06** (already-wrong own-launch records) — **cannot tell**: only the call-site gate (`if (exitCode == 0) CaptureRotation::recordAfterSession(..., tstart)`) is here; the `from=checked-launch` repair is CaptureRotation's (outside).

---

## 3. Findings

### G2-E-app-01: COPY's queued manifest record still runs without the transfer lock

- **Severity:** Medium
- **Category:** Guard still fails open on the path the verdict named (PL-068) / report contradicts the diff
- **Where:** `es-app/src/SaveStateBookkeeper.cpp`, worker loop hunk `@@ -110,7 +246,7 @@` (`if (job.kind == Delete) runDelete(w, job); else runCopy(job);`) against `runDelete(Worker* w, ...)` at `@@ -29,8 +44,129 @@`.
- **What:** Only `runDelete` gained `transferGone(w, job)` and `TransferLock`. `runCopy(job)` is called unchanged, with no `Worker*`, so it cannot wait on the stop-aware `transferGone` and takes no lock. E1's follow-up (G-E1-09) states the COPY's record "is queued, and it waits the same way (:73)"; the diff shows no such call.
- **Failure scenario:** The manager's COPY passes `savesTreeBusy` (lock free), copies the file at the press, and queues the record job. A `cloud_backup --saves-only` starts from a shell (or the exit sync) before the worker reaches the job. The worker writes the manifest record under the running transfer — the manifest read/write overlap PL-068 was opened for, on the copy path.
- **Evidence:** the two hunks above; I looked for any hunk changing `runCopy`'s signature or body and found none.

### G2-E-app-02: the BIOS-alone content run proceeds on an unchecked `--set-systems`

- **Severity:** Medium
- **Category:** Guard reports success over a failure it could not see / consent skipped
- **Where:** `es-app/src/guis/GuiMenu.cpp` `cloudContentSystemPicker`, hunk `@@ -4137,13 +4183,38 @@` (`if (found.empty() && biosToMove) { ...; ApiSystem::executeScriptLegacy(cloudSetSystemsCommand({ "bios" })); onDone(); return; }`).
- **What:** The new path writes the selection through `executeScriptLegacy`, discards its result, and calls `onDone()` at once — no picker, no button press on the verb. Nothing checks that the selection file now says `bios`.
- **Failure scenario:** `/storage/.cache/cloud_sync/content-systems` holds the previous run's picks (say `snes nes`). The BIOS-alone case fires; `cloud_content_restore --set-systems 'bios'` fails (script refuses the name, disk full, script missing) with no visible error. `onDone()` runs the transfer with `--selected`, which reads `snes nes` — systems the player did not tick, in either direction (upload or download).
- **Evidence:** the hunk; the existing save-func path (`@@ -4227,11 +4298,11 @@`) has the same discarded return, but that path is followed by the player's own press on the picker's verb, which the new branch skips. Whether `executeScriptLegacy` exposes an exit status at all is outside the packet (`ApiSystem`).

### G2-E-app-03: a transfer lock that cannot be *created* makes the deletion spin and log every 200 ms until exit

- **Severity:** Low
- **Category:** Bounded failure
- **Where:** `es-app/src/SaveStateBookkeeper.cpp` `runDelete`, the `for (;;)` around `held.take()`.
- **What:** `transferGone` answers true when the lock file does not exist (`isFlockHeld` on a missing file); `TransferLock::take` then `open(O_CREAT)`s it. If the create fails (e.g. `/var/run` not writable in some harness or a mount gone read-only), `take()` returns false forever; the loop sleeps 200 ms and logs "waits: the transfer lock was taken as the deletion began" on every pass, with no bound until `w->stop`.
- **Failure scenario:** A deletion queued on a host where the lock path cannot be created: the tile stays hidden (`isPending`) indefinitely, `es_log.txt` grows five lines a second, and the log's sentence names the wrong cause (a transfer taking the lock).
- **Evidence:** `take()` distinguishes no open-failure from an flock-busy; the caller cannot tell them apart. The stop-path bound (`giveUpAt` +5 s) exists only inside `transferGone`, not in this loop.

### G2-E-app-04: the hung-capture branch admits the overlap and keeps admitting it

- **Severity:** Low
- **Category:** Gate side effect (design trade, stated but with a residue not stated)
- **Where:** `es-app/src/FileData.cpp` `captureGate`: `if (captureAgeSeconds() >= CaptureHungSeconds) { LOG(LogWarning) ...; return true; }`.
- **What:** Past 120 s the launch goes, but `sCaptureInFlight` is not cleared or re-armed, so every subsequent launch also passes at once with the same warning — and the capture thread is still alive, still able to finish and post its exit-sync decision. The report calls a >10 s capture "stalled" and a >120 s one "hung"; nothing measured in the packet says `cloud_capture` cannot legitimately run that long (a first capture of a large saves tree on a slow card is the case to ask about).
- **Failure scenario:** Capture at 130 s, still hashing; launch admitted; the game writes a save the capture is hashing; manifest records a hash the file no longer has — the PL-061 scenario, now with a warning in the log.
- **Evidence:** the branch; no `sCaptureInFlight.store(0)` or `sCaptureStartedMs` reset on that path. Whether `cloud_capture`'s runtime distribution justifies 120 s is outside the packet.

### G2-E-app-05: a top-up request that arrives after the watcher has exited starts a run that does not wait for a launch in flight

- **Severity:** Low
- **Category:** Concurrency / gate interplay (residue of G-E2-02)
- **Where:** `es-app/src/ProxyCards.cpp` `topUpWatcher` (`if (!first) waitForTheGame(); first = false;`) and the watcher's exit (`sTopUpHeldForLaunch = false; return;`).
- **What:** The hold set by `stopTopUp` is honoured only by the *same* watcher's next run. If the stopped run was the last queued, the watcher exits and clears the hold; a request that arrives seconds later (e.g. the index ending during the launch's remaining gates) spawns a fresh watcher whose first run skips `waitForTheGame()` and starts under the launching game. The narrow interleaving where a request lands between the watcher's `exchange(0)` and its re-check hands the request to a new watcher the same way.
- **Failure scenario:** Top-up running, nothing queued; STOP IT AND PLAY; card ends, watcher exits; the hasher finishes and calls `topUp(window, true)`; the ctl starts while the game is launching — the player was told "IT'LL TRY AGAIN NEXT TIME YOU'RE CONNECTED".
- **Evidence:** the `first` flag and the exit path; `topUp()` has no check of `GetRunningGame()` or of a pending launch.

### G2-E-app-06: `RunLock::holder` names the holder by a substring of another process's argv

- **Severity:** Low
- **Category:** A check that matches a substring where an exact answer exists
- **Where:** `es-app/src/RunLock.h` `holder`: `if (line.find(program) == std::string::npos) return 0;` on `/proc/<pid>/cmdline`.
- **What:** The lock being held proves *some* process holds it; the pid comes from the file, which the ctl writes only after taking the lock (the header says so). In that window, or after a pid write that failed, the file may hold a stale pid. The cmdline test then accepts any process whose argv contains `raofflineproxy-ctl` — `tail -f` on its log, a `grep`, an editor — and `stopRun` sends it SIGTERM.
- **Failure scenario:** stale pid reused by `sh -c "grep ... raofflineproxy-ctl ..."`; STOP IT AND PLAY kills the grep, reports success, the ctl keeps running, the launch waits for a ctl that was never signalled.
- **Evidence:** the substring test; an exact test (first argv element's basename, NUL-delimited) exists and is not used. Whether the ctl ever leaves a stale pid under a held lock is stream D's.

### G2-E-app-07: a deletion holding the transfer lock can turn the exit sync into `SKIPPED - A SYNC IS ALREADY RUNNING`

- **Severity:** Low
- **Category:** Lock whose two sides assume different durations (seam E-app ↔ scripts)
- **Where:** `es-app/src/SaveStateBookkeeper.cpp` `TransferLock` comment ("the scripts give a busy lock a second -- longer than a retire and an unlink") and `FileData.cpp`'s exit path that starts `cloud_backup --yes --saves-only --recent --automatic`.
- **What:** The deletion now holds `/var/run/cloud_sync.lock` exclusively for the length of `cloud_capture --retire --unlink` (a script run). The scripts' one-second wait is asserted, not measured, in the packet. If the retire takes longer on a slow card, any transfer starting meanwhile exits 75 and its card says a sync was already running when none was.
- **Failure scenario:** DELETE pressed just after a game exits; the exit sync starts, finds the lock held by the deletion for 1.5 s, says `SKIPPED - A SYNC IS ALREADY RUNNING`, stamps `lock-held`; the saves of that session wait for the next sync, and the card's sentence is untrue.
- **Evidence:** the two hunks; no measurement of retire duration, and the scripts' wait is outside the packet.

### G2-E-app-08: `exitCode == 0` is a broader gate than the defect it closes

- **Severity:** Low
- **Category:** Fix reaches past its item
- **Where:** `es-app/src/FileData.cpp @@ -984,8 +1138,18 @@`: `if (exitCode == 0) CaptureRotation::recordAfterSession(...); else LOG(...)`.
- **What:** The finding (F-ES-08) was a launch that failed *before* RetroArch's banner. The gate also drops the record for any session that ran fully and ended non-zero (a core crash after the rotation was read, an emulator that exits 1 on quit). The comment concedes it ("A crash after a real session keeps the record it had") and says CaptureRotation now checks the log's age and banner itself — which, if true, already covers the failed-launch case, making the call-site gate redundant where it is right and lossy where it is wrong.
- **Failure scenario:** A game rotated by the core's request, session played, RetroArch exits non-zero at quit; the record keeps yesterday's turn, or the core's table stands in, and the screenshot viewer shows the wrong orientation until a clean exit.
- **Evidence:** the hunk; what exit codes `runemu.sh` returns after a real session, and CaptureRotation's own checks, are outside the packet.

### G2-E-app-09: the report's "rule to change" for `SKIPPED - YOU STARTED A GAME` reads the wrong column

- **Severity:** Low
- **Category:** Provenance of a handover item (the integrator would act on a false premise)
- **Where:** `E2.report.md` Follow-up 4, G-E2-08 (a); `es-player-text.md` § Outcome vocabulary table.
- **What:** The rule's *Card* column already reads `SKIPPED - YOU STARTED A GAME`; only the *Row token* column reads `SKIPPED, A GAME WAS STARTED`. `ProxyCards.cpp` writes the former on a card, so card and rule agree and no rule change is needed for it. What the packet cannot show is whether the top-up writes a row stamp for this outcome (no `recordOutcome`/`writeStamp` call is visible in `runTopUp`), which is where a row-token question would arise.
- **Failure scenario:** The integrator edits the rule's table on the report's instruction and introduces the inconsistency the table currently does not have.
- **Evidence:** the table as embedded; the `outcome = _("SKIPPED - YOU STARTED A GAME")` hunk.

### G2-E-app-10: the packet duplicates two files

- **Severity:** Low
- **Category:** Packet integrity
- **Where:** `seats/E-app.diff`: `es-app/src/views/ViewController.cpp` and `ViewController.h` each appear twice with identical `index 13a1b26ec..8b2813571` / `2c76cbf31..995d18281` headers.
- **What:** Harmless for review (the hunks are identical), but the diff is not a clean `git diff` output; a tool that applies or counts it will double the ViewController hunks, and the byte count in the manifest includes the duplicate.
- **Evidence:** the two occurrences in the embedded source.

---

## 4. Sweep rows

**Fixed rows spot-checked against the diff (eleven):**

| Row | Verdict |
|---|---|
| 1-raoffline claude F-RA-05 (`ThreadedHasher` offline index toasts) | visible: `mTotal = 0;` after the queue is drained (`@@ -59,6 +59,14 @@`); the early return it relies on is below the hunk (claim). |
| 1-raoffline claude F-RA-08 / gpt F-RA-16 (`stopRun` kills a stale pid) | visible: `RunLock::holder(SCAN_LOCK, "raofflineproxy-ctl")`, `pid <= 1 → false`. See G2-E-app-06 for the residue. |
| 1-raoffline claude F-RA-09 / gpt F-RA-17 (stopped top-up; why this run's) | visible: `stopped`, `stoppedForGame`, `stamped = s.ran && s.when >= startedAt`, `topUpWhy(stamped ? s.why : "")`, the SKIPPED branch. |
| 1-raoffline claude F-RA-14 / gpt F-RA-22 (`GuiOfflineScan` retry on `BUTTON_OK`) | visible in `input`, `getHelpPrompts`, `render`. |
| 1-raoffline claude F-RA-18 (no FileData walk on the worker) | visible: `getUserSummaryFromDevice` drops `getFileData`; `GuiRetroAchievements` constructor fills `consoleName`. |
| 8-es claude F-ES-07 (PLAY NOW consumed at entry) | visible: `const bool playThroughSend = sPlayThroughSend.exchange(false);` at the top of `launchGame`; the send gate reads it. |
| 8-es claude F-ES-10 (nothing written after a reset) | visible: `ViewController::configurationReplaced()` in `maintenanceRestart` and the settings-first completed action; `saveState` returns early. Whether anything else calls `Settings::saveFile()` at exit is outside the packet. |
| 8-es claude F-ES-11 (deferred launch's save state) | visible: `saveStateFile` in `LaunchGameOptions`, `rememberSaveState`, `launchNow` re-find with a warning. |
| 8a gpt F-ES-17 / F-ES-18 (OAuth session left; `understood` fails closed) | visible: `sOAuthSessionPages`, `cloudOAuthOwnSession`, the erase in `cloudSetupPresent`; `if (understood) return false;` before the `url` fallback. |
| 2-wifi claude F-WF-12 / gpt F-WF-03 (join by profile) | visible: `PickerRow::profile`, `joinName`, `manualJoinName`, `GuiWifi::act`/`join(name, profile)`. |
| 5-cloud gpt F-CS-25 (mInstance atomic, one lock) | visible: `std::atomic<ThreadedCloudSync*>`, `start()` checks and installs under one hold, `run()` clears under the lock outside the card branch, the destructor locks. |

Also visible and consistent with their rows: F-ES-03 (one `cloudSetupInfo()`), F-ES-05/F-ES-15 (scraper page bar), F-ES-06/F-ES-28 (GuiBios rows, DETAILS), F-ES-08 (call-site gate; residue G2-E-app-08), F-ES-09 (ten-minute throttle), F-ES-12 (LATER row), F-ES-13 (`maintenanceWhy`), F-ES-14 (two strings), F-ES-16 (`sleep_for`), F-ES-19 gpt (CONNECTED prose), F-ES-20 (`launchToken` by whole words; `launchArgument`'s body is not in the hunk — see § 6), F-ES-21 (`maskSecrets`), F-ES-25 (`CloudDimmableEntry` gone), F-ES-26 (`AppWindow::post` at the call sites), F-ES-27 (hub rebuilt on folder change), F-ES-10 gpt (BIOS alone; residue G2-E-app-02), F-ES-11 gpt (switch callbacks cleared), F-ES-16 gpt (`cloudLatestRun`), F-ES-21 gpt (`DisplayAspectText` whitelist), F-CS-07/F-CS-36 (transfer page bar), F-CS-14 (slot copy guard), F-CS-19/F-CS-31 (`cleanLine`, `localizedWhy` call sites), F-CS-26 (`retries()`, `matchRemovedNote`, `matchRecovery`), F-CS-32/F-RA-23 (`TextFit`), F-CS-33 (`replaceOptionValue` call), PL-057 (`unlockedKnown` → `progressUnknown`).

**Withdrawn rows I can judge from the packet:**

- **F-RA-25 gpt** (top-up card under the send card): `es-native-ui.md` § The cards at the link's return (D-UI-109) says "the send card, and the top-up's card stacked under it" — the withdrawal's reason holds.
- **F-ES-24 claude** (toast over the hasher card): D-UI-093 in the same file ("a queued toast is not started while a card is up") — holds.
- **G-E2-07** (see § 2): the rule in the packet already reads "on the page's help bar" — holds.
- **F-ES-23 claude** (GuiBios raw UTF-8): the GuiBios hunks do not reach lines 28-30 — cannot judge.
- **F-ES-17/F-ES-20 gpt** (SSH password shown, D-INFRA-010), **F-ES-19 claude** (`clouddrive.mounted`), **F-ES-30 claude** (ThreadedScraper), **F-ES-14 gpt** (WIN32), **F-RA-04/F-WF-13 (E1)**, **F-ES-12 (both E1's and E2's)** — the deciding files are outside the packet; cannot judge.
- **F-RA-21 gpt** (fetch on the interface thread) — honestly reported as *not fixed*; the ten-minute throttle (`startIndexesAtStart`) is the mitigation and is visible.

---

## 5. Seams

| Seam | What each side assumes | Does the diff keep them agreeing? |
|---|---|---|
| **`CloudText` (core/pure text) ↔ every page** | The pages call `scanWhy`, `topUpWhy`, `cleanLine`, `localizedWhy`, `unitLabel`, `shortenWhy`, `chooseThatFits`, `actionCandidates`, `matchRemovedNote`, `matchRecovery`, `transferKind`, `scriptStampNames`, `stampsToRestamp`, `StampText`, `outcomeCandidates`. | Not verifiable here — `CloudText.*` is outside. The E2 report's syntax-check lines are the only evidence the signatures match. `JourneyTiers::command`'s six labels must be in `unitLabels` (G-E2-08 c). |
| **Scripts' stamps ↔ the card and rows** | The card snapshots each stamp `scriptStampNames(command)` names, by inode+mtime, and restamps a file written since with `CloudExit::Stopped` + the token; the rows read `parseLastRun`. The scripts must keep writing stamps by temp-and-rename (a rewrite in place with a preserved mtime would not be "written since"). | Agrees as far as the card's side shows; the mtime-vs-"change time" wording (G-E1-04 note) should be settled in the header. |
| **`raofflineproxy-ctl` lock ↔ `RunLock`** | The ctl takes an flock on `SCAN_LOCK` and then writes its pid; `stopRun` trusts the pid only while the lock is held and the cmdline names the ctl. `runTopUp` reads rc `143`/`130` as "stopped". | The order (lock, then pid) is asserted in `RunLock.h`; the ctl and how `rc` is derived from the child's status are outside (stream D). G2-E-app-06. |
| **`wifictl` ↔ the picker** | `current`/`list` speak SSIDs; `saved`/`join` speak profile names; `join` exits 0/1/2/124 and prints `joined`. `ApiSystem` returns `bool` "answered" from `getSavedWifiNetworks`/`getCurrentWifiSsid` and `WifiText::JoinAnswer` from `joinWifiNetwork`. | The picker's side is consistent (`savedKnown`/`currentKnown`, `profile`, `joinFailure(2)`). ApiSystem and the script are outside; the still-open `saved` SSID column is named in the report. |
| **Settings lock (`SystemConf`) ↔ the interface** | E1 made saves refusable and reloads pending-aware. `openRestoreRelink` now calls `saveSystemConf()` on close and passes the key from memory to `enableWifi`; `GuiWifi::join` reloads with `loadSystemConf(true)`. | Consistent at the call sites; a refused save leaves the key in memory only until the next save (E1's stated residual). |
| **Transfer lock `/var/run/cloud_sync.lock` ↔ scripts** | The interface reads it with `isFlockHeld` (manager, bookkeeper) and now *takes* it exclusively for a deletion; the scripts wait one second for a busy lock; `cloud_capture` takes only `.capture.lock`. | The manager and the bookkeeper now ask one check (E2's 5b6d2e638). The duration assumption is unmeasured (G2-E-app-07); COPY's record does not take it (G2-E-app-01). |
| **`cloud_content_restore`/`backuptool` ↔ JourneyTiers and the picker** | `--set-systems '<names>'` (one quoted argument, split by the script), `--selected`, `--with-media`/`--media-only`, `bios` accepted in a selection as the tier, `--selected` refusing an empty selection; `backuptool restore --then-cloud --no-restart` writes the marker; the settings restore leaves `/storage/.cache/cloud_sync` alone. | All asserted in comments; stream A/B side outside. The picker's `bios` write is documented as a workaround for the script's ordering — if A changes the script, the workaround still reads as a valid selection per the comment. |
| **`AppWindow` (new header, not in packet) ↔ the workers** | `post(window, fn)` returns `false` once `closing()` has run; `FileData`, `ProxyCards`, `OfflineScanJob`, `GuiMenu` route through it; `main.cpp` calls `closing()` after the loop. | The call sites are consistent; the header's semantics are the report's claim. The card's direct component calls after the linger remain (report, Task 3). |
| **The shared test harness** | `tests/app-unit` compiles `ProxyCards.cpp` and `SaveStateBookkeeper.cpp` against fakes; `CLOUD_SYNC_LOCK_PATH` is the macro seam. | Not in the packet; nothing to check beyond the macro's presence. |

---

## 6. Coverage boundary

Stated plainly, the things I could not judge from this packet:

- **Every test.** No test source is in the diff; "seen to FAIL first" is a claim throughout. Whether any case cannot fail (the brief's specific concern) is unjudged.
- **Callees outside the diff** that the fixes stand on: `Utils::AtomicFile::isFlockHeld`/`writeText`, `Utils::CommandLine::wordEnd`/`replaceOptionValue`, `CloudText::*`, `CheevosRetry::saveSignIn`, `CaptureRotation::recordAfterSession(…, tstart)`, `DisplayAspect::forgetScreenshots`, `AppWindow::post`/`closing`, `MultiLineMenuEntry::setDimmed`, `WatchersManager::ResetComponent`, `Utils::String::maskSecrets`, `SystemConf::loadSystemConf(bool)`, `ApiSystem::joinWifiNetwork`/`getSavedWifiNetworks`/`getCurrentWifiSsid`/`executeScriptLegacy`, `SaveStateRepository::isEnabled`/`getSaveStates`, `IGameListView::remove`, `FolderData::addChild`/`removeChild`/`FindByPath`, `~FileData`'s index bookkeeping, `ViewController::launch` (whether it re-enters `launchGame`, which the PLAY-NOW and capture-gate designs assume), `cloudShellQuote`'s body, `launchArgument`'s body (the hunk changed only its comment; if it still uses `rfind(" --key=")` the header's two readers disagree on what a word is).
- **Runtime facts:** the exit codes `runemu.sh` returns after a real session (G2-E-app-08), how `rc` is formed for the top-up ctl (143 vs raw status), `cloud_capture`'s runtime distribution (G2-E-app-04), the retire's duration against the scripts' one-second wait (G2-E-app-07), whether the toggle's disable path calls `ProxyCards::stopTopUp` (which would mislabel its stop as "for a game") or `OfflineAchievements::stopRun`.
- **`GuiCloudTransfer`'s counter** for the journey continuation: `items = saves ? 1 : 0 + N picked systems`, `itemsAfterContent = 0`, with saves now *before* the content script's announcement and a BIOS unit the content script emits (per E2's Follow-up 2) not counted; the page's constructor and counting rule are outside the diff.
- **Whether `GuiCloudTransfer::getHelpPrompts`' running branch still offers CANCEL only when `cancellable()`** — the running-state footer no longer distinguishes, and the running-branch prompts are not in the hunk.
- **Frames, walks and journals** the acceptances name (PL-014 soak, PL-029 journal, PL-061 order, PL-062 walk, PL-068 walk, PL-069 VmSize, PL-072 frame, the 640×480 frames for the new strings) — all guest work.
- **The `Already written:` lines** for the E-app commits — not in the packet; from the diff alone, the read-both shape is visible for JourneyTiers (marker with no record), the null unlock count (`unlockedKnown` defaults true), and the restamp (old stamps read as before); the CaptureRotation repair (`from=checked-launch`) is outside.

---

## corpus.provenance.json

```json
{
  "council_member": "E-app auditor",
  "facilitator": "council-facilitator@1.2.0",
  "read_mode": "embedded corpus; no filesystem access; hashes as verified at embed time by the Facilitator",
  "source_file_paths": [
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/E-app.diff",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/E1.report.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/E2.report.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/E1.findings.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/E2.findings.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/E1.items.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/E2.items.md",
    ".claude/rules/engineering-practices.md",
    ".claude/rules/upgrade-and-install.md",
    ".claude/rules/es-player-text.md",
    ".claude/rules/es-native-ui.md",
    ".claude/rules/es-code-traps.md",
    ".claude/rules/es-ui-style-guide.md"
  ],
  "source_file_hashes": [
    "eb5d6c94aefa126087e9371f40e6e7cb9ad440a6f0f8fedc9c0ffa154b024b13",
    "654dff75600876daeb9162948bb36ffdb504913066e0b0cadda82a5a174b082e",
    "4e80f3ecb71487e7f11f655935eb878969d2063e25d54b10fbd7be6e55b989d9",
    "6a72853bb704067abb739809c34125484a5aa41f492c6821b3083103701ebaf7",
    "4cfcc1ade60afa464ab1055ee53e3b7200b856d0a2bd505dd9f5891da2bd73fd",
    "1717b7d820a008285ec26be8fd534469d85dd8fec231e84bff480a2480f37599",
    "4c1462730ae807beb9ef0beb893677591d6eb414f6aea6cc2f8600ec94a2e675",
    "7f1eb012edc986ee2975abacb44f1a662f2a111a6ded1a1a623a84af509eef7d",
    "d79a1084e85117ba566d23af7fbf3633c44290a6c490f9125e1fd9df061f8cfd",
    "c401103eba4ada9d0e757a2b8522e7ed9558a17eb4da72b65615795163f33c86",
    "48cd5ac727b6d05d0e5acf5a17e7591d96a56e574d27f48a5c0210c5499afcb7",
    "9d5d6995714c9a1287c84f0c02a92de244271a4bdad8e53d29bb61115ba51d0f",
    "150d0ac637626d771871eab48db995d8fc46c69ed7cf786240213649d264ad02"
  ],
  "sources_needed_but_not_embedded": [
    "es-app/src/CloudText.{h,cpp}",
    "es-app/src/AppWindow.h",
    "es-app/src/ApiSystem.{h,cpp}",
    "es-app/src/CaptureRotation*.{h,cpp}",
    "es-app/src/CheevosRetry.{h,cpp}",
    "es-app/src/CloudTransferJob.{h,cpp}",
    "es-app/src/DisplayAspect.{h,cpp}",
    "es-core/src/utils/AtomicFileUtil.{h,cpp}",
    "es-core/src/utils/CommandLineUtil.h",
    "es-core/src/SystemConf.{h,cpp}",
    "es-app/tests/unit/**",
    "tests/app-unit/**",
    "tests/*.py"
  ],
  "packet_anomalies": [
    "es-app/src/views/ViewController.cpp and .h appear twice in E-app.diff with identical hunks"
  ]
}
```
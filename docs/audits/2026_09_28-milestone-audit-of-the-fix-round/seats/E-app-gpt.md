# E-app audit

**Result: five Medium and two Low findings. The packet does not support closing every acceptance item or first-audit finding.**

The most consequential remaining paths are:

- pressing the connected Wi-Fi row can select an inactive, same-name profile;
- a top-up watcher hand-off can discard the hold established by STOP IT AND PLAY;
- the new BIOS-only path proceeds without confirming that its selection was saved;
- the capture gate still permits a launch over a live capture after 120 seconds.

This is a source review, **not a test or device sign-off**. I used only the embedded corpus; I did not access files, recompute hashes, compile, or run tests.

**Citation convention:** `S1`–`S13` identify the declared path and Facilitator-supplied SHA-256 pairs recorded in `corpus.provenance.json` below. Hunk references identify lines within **S1, the embedded diff**, not separately read source files. Reports S2/S3 and claimed dispositions S4/S5 are treated as claims.

## 1. Punch-item verdicts

Where acceptance expressly requires a guest run, frame, or test, source changes alone establish at most **holds in part**. “Cannot tell” does not mean the fix is absent from the integrated tree; it means its implementation or acceptance evidence is outside this packet.

### E1 items — S6

| Item | Verdict | Evidence and remaining boundary |
|---|---|---|
| **PL-024** — refuse settings writes without the settings lock | **Cannot tell from the packet** | The `SystemConf` save implementation and held-lock test are absent. `GuiWifi::join` now calls `loadSystemConf(true)`, but that is not evidence that saves refuse correctly. S1, `es-app/src/guis/GuiWifi.cpp`, `@@ -141,25 +156,35 @@`. |
| **PL-041** — stale settings-lock contenders | **Cannot tell from the packet** | Neither `PidLock` nor the shell `wait_lock` implementation is embedded. The new `RunLock` is a different mechanism: it observes a script’s `flock` before signalling. It cannot establish PL-041. |
| **PL-063** — private temporary per writer | **Cannot tell from the packet** | `AtomicFileUtil::writeText` and its concurrent-writer test are absent. Calling that helper from `GuiMenu` does not establish its temporary-file guarantees. |
| **PL-064** — recover a whole legacy temporary | **Cannot tell from the packet** | `chooseConfig`, `SystemConf` recovery, and startup cleanup are absent. The cross-stream startup-deletion question raised in S2 cannot be settled here. |
| **PL-065** — fail a partial read | **Cannot tell from the packet** | Neither `readText` nor the reported injected-read-failure test is embedded. |
| **PL-068** — DELETE/COPY observe the transfer lock | **Holds in part** | `savesTreeBusy` checks `isFlockHeld`, DELETE rechecks at YES, and queued deletion now takes an exclusive lock through its work. S1, `es-app/src/guis/GuiSaveState.cpp`, `@@ -13,8 +13,28 @@`, `@@ -415,19 +435,29 @@`, `@@ -466,10 +496,11 @@`; `es-app/src/SaveStateBookkeeper.cpp`, `@@ -29,8 +44,129 @@`. The helper’s failure semantics, complete COPY write path, and required shell-backup walk are not supplied. |
| **PL-069** — leaked joinable sync threads | **Holds in part** | The allocation is replaced by `std::thread(&ThreadedCloudSync::run, this).detach()`, and `mHandle` is removed. S1, `es-app/src/ThreadedCloudSync.cpp`, `@@ -43,7 +48,12 @@`; `.h`, `@@ -168,11 +190,12 @@`. This addresses the visible ownership leak. No guest measurement is embedded. Also, the specified task-count acceptance alone is insufficient to detect resources retained by an already-ended, unjoined thread. |
| **PL-072** — preserve the partial-transfer clause | **Holds in part** | The card computes `keepInPlace` for `mMoved && ret == CloudExit::NoNetwork` and passes it to `actionCandidates` on both relevant paths. S1, `ThreadedCloudSync.cpp`, `@@ -557,6 +568,12 @@`, `@@ -584,10 +601,13 @@`, `@@ -623,11 +643,10 @@`. The candidate-builder implementation and mid-transfer guest frame are absent. |
| **PL-075** — Windows atomic-write contract | **Cannot tell from the packet** | The relevant header and `_WIN32` implementation are outside S1. |
| **PL-078** — hook history/rename coverage | **Cannot tell from the packet** | No hook implementation or hook test is embedded. S2’s PASS lines are not substitutes for them. |

### E2 items — S7

| Item | Verdict | Evidence and remaining boundary |
|---|---|---|
| **PL-014** — preserve live `FileData` across rescans | **Holds in part** | `FolderMerge::merge` keeps same-path, same-kind objects, transfers arrivals, and invokes `vanished` only for removals/type changes. `SystemData` drops collection/group references and views, and defers under a hasher, scraper, or game. S1, `es-app/src/FolderMerge.h`, `@@ -0,0 +1,74 @@`; `es-app/src/SystemData.cpp`, `@@ -296,6 +301,46 @@`, `@@ -325,26 +386,129 @@`. The real collection/view/destructor interactions and required 200-iteration soak are not demonstrated. |
| **PL-029** — carry the selected restore tiers across restart | **Holds in part** | A complete known record with saves alone generates only `cloud_restore --yes --saves-only`; `main` reads the record and uses that command. S1, `es-app/src/JourneyTiers.h`, `@@ -0,0 +1,159 @@`; `es-app/src/main.cpp`, `@@ -944,35 +946,86 @@`; `GuiMenu.cpp`, `@@ -4655,14 +4738,57 @@`. No guest journal is supplied. The acceptance asks for a done-page frame listing two tiers; the visible continuation contains only SAVES, with SETTINGS reported before restart, not a combined two-tier result. |
| **PL-030** — quote cloud folder names | **Holds in part** | The concatenated double-quoted command is replaced with `cloudShellQuote(picked)`. S1, `GuiMenu.cpp`, `@@ -4008,6 +4035,23 @@`, `@@ -4227,11 +4298,11 @@`. The quote helper’s body, backend name validation, and malicious-name guest test are absent. Selection persistence is a separate unresolved issue: **G2-E-app-03**. |
| **PL-054** — require a flush stamp for the account claim | **Holds in part** | Both account sentences are now inside `if (sent)`; the empty-queue/no-stamp branch can say COMPLETED without claiming delivery. S1, `es-app/src/ProxyCards.cpp`, `@@ -114,10 +137,18 @@`. Determination of `sent`, its freshness, the test, and the VM proof are outside the visible hunk. |
| **PL-056** — one top-up watcher | **Holds in part** | `sTopUpWanted` coalesces requests and `sTopUpRunning.exchange(true)` selects an owner. S1, `ProxyCards.cpp`, `@@ -294,20 +343,84 @@`, `@@ -414,8 +526,10 @@`. The ownership hand-off still loses a launch hold: **G2-E-app-02**. No one-card VM proof is supplied. |
| **PL-061** — guard launch against exit capture | **Holds in part** | Launch now calls `captureGate`; the spinner’s ten-second bound refuses rather than launching. S1, `es-app/src/FileData.cpp`, `@@ -773,10 +839,95 @@`, `@@ -826,6 +977,9 @@`. However, a capture aged 120 seconds is expressly bypassed while still live: **G2-E-app-04**. No guest ordering proof is supplied. |
| **PL-062** — a setup-gated row works after setup | **Holds in part** | The press rechecks `rclone.conf` uncached, undims the row, and invokes its action. Transfer rows preserve the common running-job handler. S1, `GuiMenu.cpp`, `@@ -5866,8 +6026,24 @@`, `@@ -5127,16 +5256,9 @@`, `@@ -5144,7 +5266,17 @@`. The required setup/FINISH/press walk is absent. |
| **PL-068** — transfer-lock gate | **Holds in part** | Same verdict and evidence as E1 PL-068 above. The deletion’s check/act race is visibly addressed by taking the lock; that does not establish the complete COPY path. |

## 2. First-audit findings: review of claimed answers

For wholly omitted implementations or tests, I use **cannot tell from the packet** rather than “not answered”: absence from this application packet is not evidence that a claimed fix failed.

### E1 findings — S4, claims explained in S2

| Finding | Assessment of the claimed answer |
|---|---|
| **Claude G-E1-01** — inverted Wi-Fi join result | **Answered in part.** The visible caller now uses `GuiLoading<WifiText::JoinAnswer>` and `answer.joined()`, not a boolean interpreted as an exit code. `JoinAnswer` has no boolean conversion. S1, `GuiWifi.cpp`, `@@ -141,25 +156,35 @@`; `WifiText.h`, `@@ -65,12 +72,69 @@`. The `ApiSystem` declaration/producer and complete caller inventory are absent. This is not evidence for repeating the original Critical inversion claim. |
| **Claude G-E1-02** — truncated live config wins | **Cannot tell.** `chooseConfig` and save/recovery logic are absent. |
| **Claude G-E1-03** — unreported changes/provenance | **Answered in part.** Delegation to the shared why tables is visible: `OfflineAchievements::scanWhy` calls `CloudText::scanWhy`, and `topUpWhy` calls its CloudText counterpart. S1, `OfflineAchievements.cpp`, `@@ -250,35 +251,10 @@`; `ProxyCards.cpp`, `@@ -137,19 +168,21 @@`. Commit provenance, `Already written:` bodies, emitter-table changes, and untracking are not independently established by this diff. |
| **Claude G-E1-04** — clock-based stale-stop attribution | **Answered in part.** The constructor snapshots stamps, the stop path passes that snapshot, and `readStamps` collects text plus inode/mtime identity. S1, `ThreadedCloudSync.cpp`, `@@ -19,19 +19,24 @@`, `@@ -521,19 +529,21 @@`, `@@ -817,6 +847,43 @@`. The decisive `CloudText::stampsToRestamp` comparison is absent. |
| **Claude G-E1-05** — ineffective thread-leak test | **Cannot tell.** The revised test and CMake wiring are absent. The production detach change is visible, but does not prove the test fails on regression. |
| **Claude G-E1-06** — Windows empty-file read | **Cannot tell.** Neither implementation nor Windows test is embedded. |
| **Claude G-E1-07** — escape parser consumes text | **Cannot tell.** Callers now delegate to `CloudText::cleanLine`; the parser grammar itself is absent. |
| **Claude G-E1-08** — hook scan silence/case handling | **Cannot tell.** Hook changes and constructed failures are absent. |
| **Claude G-E1-09** — DELETE guarded only at button | **Answered in part.** The final diff goes beyond the first claimed answer: `runDelete` actually holds an exclusive transfer lock. S1, `SaveStateBookkeeper.cpp`, `@@ -29,8 +44,129 @@`. Complete COPY serialization and the guest walk remain unverified. |
| **Claude G-E1-10** — binary remains tracked | **Cannot tell.** Neither the deletion from the index nor `.gitignore` is in this packet. |
| **GPT G-E1-01** — reap guard exceeds deadline | **Cannot tell.** `PidLock` is absent. |
| **GPT G-E1-02** — reap-guard failure opens race | **Cannot tell.** `PidLock` and the matching shell guard are absent. |
| **GPT G-E1-03** — reload loses retained changes | **Answered in part.** The picker requests `loadSystemConf(true)`, but the implementation of that policy is absent. S1, `GuiWifi.cpp`, `@@ -141,25 +156,35 @@`. |
| **GPT G-E1-04** — incomplete live configuration | **Cannot tell.** Same missing implementation as Claude G-E1-02. |
| **GPT G-E1-05** — recovery loosens permissions | **Cannot tell.** The recovery mode chain is absent. |
| **GPT G-E1-06** — same-second stop attribution | **Answered in part.** The snapshot mechanism is wired into the sync card; the selector that must compare it is absent. Same hunks as Claude G-E1-04. |
| **GPT G-E1-07** — leak test cannot detect production regression | **Cannot tell.** Same missing test as Claude G-E1-05. |

### E2 findings — S5, claims explained in S3

| Finding | Assessment of the claimed answer |
|---|---|
| **Claude G-E2-01** — changed join signature/callers | **Answered in part.** The typed answer and rewritten caller are visible; the producer and inventory are not. Same evidence as E1 Claude G-E1-01. |
| **Claude G-E2-02** — queued top-up runs under launch | **Answered in part.** The hold and wait address the normal same-watcher sequence, but not ownership hand-off or a first run of the successor watcher. **G2-E-app-02** gives a concrete remaining interleaving. S1, `ProxyCards.cpp`, `@@ -294,20 +343,84 @@`, `@@ -425,7 +539,14 @@`. |
| **Claude G-E2-03** — finalizer replacement | **Cannot validate the withdrawal from this packet.** The new registrations are visible, but `GuiSettings::onFinalize` and complete page/helper bodies needed to establish “only one registration” are absent. No contradictory second registration is shown. |
| **Claude G-E2-04** — non-repository save state discarded | **Cannot validate the withdrawal from this packet.** The new mechanism assumes a repository state and re-finds it by filename. S1, `FileData.cpp`, `@@ -728,9 +753,50 @@`. The claim that every producer satisfies this assumption requires the omitted launch callers/repository code. |
| **Claude G-E2-05** — duplicate filter indexing | **Cannot validate the withdrawal from this packet.** The merge’s `arrived` indexing and temporary `mFilterIndex = nullptr` are visible, but the body of `populateFolder` is not. S1, `SystemData.cpp`, `@@ -325,26 +386,129 @@`. |
| **Claude G-E2-06** — capture gate claims exit sync early | **Answered in part.** Generation advancement moved to the successful spinner completion branch. It still precedes the actual deferred launch and later questions, so the reported KEEP WAITING residual remains. S1, `FileData.cpp`, `@@ -773,10 +839,95 @@`. The short synchronous wait has support in S13 § Waiting; I do not treat that design choice alone as a defect. |
| **Claude G-E2-07** — empty failed-run footer | **Answered; withdrawal holds.** Mapped help prompts are rendered by the pages, and the current supplied player-text rule explicitly places retry/close on the help bar. S1, `GuiCloudTransfer.cpp`, `@@ -499,30 +513,33 @@`, `@@ -803,10 +825,18 @@`; `GuiOfflineScan.cpp`, `@@ -215,16 +219,23 @@`, `@@ -316,7 +340,9 @@`; S10 § Recover. |
| **Claude G-E2-08** — outcome wording, Wi-Fi wording, English tiers | **Answered in part.** The Wi-Fi wording is changed, and `unitName` delegates to `CloudText::unitLabel`. S1, `GuiMenu.cpp`, `@@ -7498,17 +7733,42 @@`, `@@ -9238,9 +9505,12 @@`; `GuiCloudTransfer.cpp`, `@@ -499,30 +513,33 @@`. The label table/French catalogue are absent. The supplied S10 outcome table already says YOU STARTED A GAME, so that reported documentation follow-up is no longer open in this corpus. |
| **Claude G-E2-09** — test fidelity/environment dependence | **Cannot tell.** No revised test bodies are embedded. S3’s acknowledgement of stand-in FAIL-before cases is appropriately narrower than proof against the original implementation, but it does not establish the VM behavior. |
| **GPT G-E2-01** — failed replacement replays old journey selection | **Answered at the visible record-policy level.** `replaceRecord` removes/checks the old record first, checks failed-write cleanup, and returns `OldRecordStands`; the caller refuses before starting the restore. S1, `JourneyTiers.h`, `@@ -0,0 +1,159 @@`; `GuiMenu.cpp`, `@@ -4655,14 +4738,57 @@`. Filesystem helper semantics/tests remain outside this packet. |
| **GPT G-E2-02** — incomplete record means empty selection | **Answered.** All three tier keys must occur exactly once with 0/1 values. Otherwise `known` remains false, and only a **known** empty record is silently consumed. S1, `JourneyTiers.h`, new-file hunk; `main.cpp`, `@@ -944,35 +946,86 @@`. |
| **GPT G-E2-03** — capture timeout bypass | **Answered in part.** The ten-second timeout now refuses, but the 120-second age exception reinstates the same overlap for an older live capture. **G2-E-app-04**. |
| **GPT G-E2-04** — stopped top-up immediately replaced | **Answered in part.** Same remaining hand-off defect as Claude G-E2-02. |
| **GPT G-E2-05** — late stop overwrites completion | **Cannot tell.** `CloudTransferJob.cpp` and its synchronization test are not embedded. |
| **GPT G-E2-06** — already-wrong rotation records | **Cannot tell.** The reader/writer change to `from=checked-launch` is not embedded. The visible `exitCode == 0` call-site gate is forward protection, not proof of repair for existing records. S1, `FileData.cpp`, `@@ -984,8 +1138,18 @@`. |

## 3. Findings

### G2-E-app-01: The connected Wi-Fi row can join an inactive namesake

- **Severity:** Medium
- **Category:** Wrong action introduced by connected-row revalidation
- **Where:** S1, `es-app/src/WifiText.cpp`, `@@ -73,15 +85,49 @@`; downstream call in `es-app/src/guis/GuiWifi.cpp`, `@@ -83,23 +89,44 @@`, `@@ -141,25 +156,35 @@`.
- **What:** A saved profile whose **name** equals the current SSID takes precedence over the profile marked active, even when the namesake is inactive.
- **Failure scenario:** `current` is `Home`; saved profiles contain inactive `Home` and active `Home 1`. The connected row is assigned profile `Home`, not `Home 1`. Pressing it now requests the inactive profile. With stale credentials this produces a needless failure; with a renamed profile targeting another SSID it can request another network while the subsequent notice still uses the original row name.
- **Evidence:**
  ```cpp
  if (isSaved(joinedNow))
      joinedProfile = joinedNow;
  else
  ```
  Only the `else` branch examines `network.inUse`. `GuiWifi` passes `WifiText::joinName(row)` through to `joinWifiNetwork(profile)`. I looked for an active-status check on the same-name candidate; none appears in this selection rule.
  
  The backend is not embedded, so the directly established wrong outcome is **the wrong profile argument**. Its documented contract in `WifiText.h` makes that argument operational, not merely a display label.

A regression case should include an inactive SSID-named profile beside one active renamed profile, not just the “no same-name profile exists” case.

### G2-E-app-02: A top-up watcher hand-off discards the pending-launch hold

- **Severity:** Medium
- **Category:** Concurrency / cancellation hand-off
- **Where:** S1, `es-app/src/ProxyCards.cpp`, `@@ -294,20 +343,84 @@`, especially `topUpWatcher`; hold creation at `@@ -425,7 +539,14 @@`.
- **What:** The old watcher clears `sTopUpHeldForLaunch` when another watcher has acquired ownership, and the successor’s first run skips `waitForTheGame` regardless.
- **Failure scenario:**
  1. STOP IT AND PLAY sets the hold and stops the current ctl.
  2. The old watcher finds no pending request and stores `sTopUpRunning = false`.
  3. A request arrives, sets a wanted bit, acquires the flag, and starts a successor watcher.
  4. The old watcher sees that ownership was taken and clears the hold.
  5. The successor performs its first ctl run without waiting for the pending game.
  
  The queued/background work therefore starts again during the launch window the follow-up intended to protect.
- **Evidence:**
  ```cpp
  if (sTopUpWanted.load() == 0 || sTopUpRunning.exchange(true))
  {
      sTopUpHeldForLaunch = false;
      return;
  }
  ```
  and:
  ```cpp
  if (!first)
      waitForTheGame();
  first = false;
  runTopUp(window, kind == 2);
  ```
  “No request remains” and “another watcher took the request” are different states, but both erase the hold. I found neither transfer of the hold to the successor nor a first-run check that would preserve it.

This needs a deterministic hand-off test paused immediately after the old watcher lowers `sTopUpRunning`, rather than only two requests handled by one continuously running watcher.

### G2-E-app-03: The BIOS-only path proceeds without confirming its selection was saved

- **Severity:** Medium
- **Category:** Unchecked persistence precondition / wrong transfer selection
- **Where:** S1, `es-app/src/guis/GuiMenu.cpp`, `@@ -4137,13 +4183,38 @@`; related unchecked setter at `@@ -4227,11 +4298,11 @@`.
- **What:** The new BIOS-only shortcut invokes its continuation unconditionally after trying to persist the selection.
- **Failure scenario:** The content-selection file cannot be replaced—for example, storage is full or the directory is unwritable. `--set-systems bios` returns without saving `bios`. The UI still calls `onDone()`. A downstream `--selected` run then sees the previous selection or no selection, rather than the BIOS-only choice this branch promised.
- **Evidence:**
  ```cpp
  ApiSystem::executeScriptLegacy(cloudSetSystemsCommand({ "bios" }));
  onDone();
  return;
  ```
  The ordinary picker save function also discards the setter’s answer. The known-tier continuation in `JourneyTiers::command` consumes `--selected`; it does not carry the selection in its command.

  I looked for a status check or read-back between this write and `onDone`; there is none. Shell quoting establishes which argument was sent, **not that it was persisted**. The setter implementation is outside the packet; the failure scenario is a normally returning setter that did not change the stored selection.

Expose a fallible setter result and confirm the requested selection before continuing. A failed persistence operation should not silently reuse another operation’s selection.

### G2-E-app-04: “Hung” capture classification still permits a game over a live capture

- **Severity:** Medium
- **Category:** Guard bypass / incomplete data-integrity fix
- **Where:** S1, `es-app/src/FileData.cpp`, `@@ -88,6 +89,30 @@`, `@@ -773,10 +839,95 @@`.
- **What:** Capture age is treated as proof that overlap is acceptable. The gate returns true without stopping, fencing, or clearing the live capture.
- **Failure scenario:** A capture is blocked on slow storage for 121 seconds, then resumes. A launch during that interval takes the age exception and the emulator writes saves while the earlier capture is still processing them. This reintroduces the overlap PL-061 was intended to prevent.
- **Evidence:**
  ```cpp
  if (captureAgeSeconds() >= CaptureHungSeconds)
  {
      LOG(LogWarning) << ...;
      return true;
  }
  ```
  `CaptureHungSeconds` is 120. This branch follows a nonzero `sCaptureInFlight` load. The normal completion path only clears that slot after the capture command returns; no cancellation or stale-result fence is introduced by the exception.

  I specifically checked the newer ten-second branch: it correctly refuses. This finding is about the **remaining 120-second exception**, not the superseded first implementation.

If an escape from a stuck capture is required, the escaped capture must cease to be an authoritative writer. A backend mechanism that already rejects such stale results would need to be supplied; it is not shown here.

### G2-E-app-05: RunLock accepts a command-line mention as proof of lock ownership

- **Severity:** Medium
- **Category:** Process identity / unsafe signalling
- **Where:** S1, `es-app/src/RunLock.h`, `@@ -0,0 +1,74 @@`; `es-app/src/OfflineAchievements.cpp`, `@@ -315,10 +291,10 @@`.
- **What:** `holder` establishes that some process blocks the lock, then accepts the PID stored in the file if its command line contains the program name anywhere. Neither test establishes that this PID is the ctl holding that lock.
- **Failure scenario:** A stale lock file contains PID P, now reused by a process whose argument names a `raofflineproxy-ctl` log or script. A new ctl acquires the lock but has not yet rewritten the PID. STOP IT AND PLAY reads P; the substring test passes, and `stopRun` sends SIGTERM to the unrelated process.
- **Evidence:**
  ```cpp
  if (line.find(program) == std::string::npos)
      return 0;
  return pid;
  ```
  The caller then executes:
  ```cpp
  return ::kill((pid_t) pid, SIGTERM) == 0;
  ```
  I looked for an exact invocation check and an association between the lock holder and the stored PID. The new helper has neither. Its own header identifies the lock-acquired/PID-not-yet-written interval, so that interval is not excluded by the intended protocol.

A test should hold the lock in one process while its file names a different live process carrying the program text in an argument. An unheld-lock test does not exercise this case.

### G2-E-app-06: Top-up stamp ownership still depends on wall-clock ordering

- **Severity:** Low
- **Category:** Outcome provenance / inherited stamp
- **Where:** S1, `es-app/src/ProxyCards.cpp`, `@@ -173,7 +206,7 @@`, `@@ -247,7 +293,11 @@`, `@@ -278,7 +328,6 @@`, `@@ -294,20 +343,84 @@`.
- **What:** The code’s statement that a stamp belongs to this run is implemented as a timestamp comparison. That does not distinguish an unchanged earlier stamp from one this run wrote.
- **Failure scenario:** An earlier ctl run leaves a stamp in wall-clock second T. A new run starts in the same second, or after the clock moves backward, and exits without writing a stamp. The old stamp qualifies. Its cached/error counts can manufacture `sawWork`; its counts or why can then be reported as this run’s.
- **Evidence:**
  ```cpp
  const bool stamped = s.ran && s.when >= startedAt;
  if (!sawWork && stamped && (s.cached > 0 || s.errors > 0))
      sawWork = true;
  ```
  `stamped` also selects `added`, `ready`, and the failure why. I found no before/after stamp identity or run identifier in this function. The same packet introduces a before/after file snapshot for cloud stop stamps, but does not apply an equivalent provenance rule here.

`lastScan` itself is not embedded. A guarantee there would need to distinguish **this run**, not merely reject future timestamps; same-second attribution remains a counterexample to this consumer’s rule.

### G2-E-app-07: Launch tokens are bounded as shell words but not decoded as arguments

- **Severity:** Low
- **Category:** Command parsing / incomplete token fix
- **Where:** S1, `es-app/src/LaunchCommand.h`, `@@ -4,32 +4,48 @@`.
- **What:** The reader now avoids matches inside other quoted words, but returns the raw command substring rather than the shell argument’s value. It also cannot recognize an option whose whole word is quoted.
- **Failure scenario:** For valid command text:
  ```text
  runemu -P"snes" --core="snes9x"
  ```
  the shell arguments contain `-Psnes` and `--core=snes9x`, while the helper’s values retain the quotes. For `runemu "--core=snes9x"`, the prefix comparison starts on a quote and misses the option altogether.
- **Evidence:**
  ```cpp
  if (command.compare(i, prefix.size(), prefix) == 0)
      value = command.substr(i + prefix.size(), end - i - prefix.size());
  ```
  There is no quote removal or escape decoding between word-boundary detection and returning the value. I looked for normalization of the word before prefix matching; none exists in the visible function.

The directly demonstrated defect is the helper result. The manifest-writing callers are outside these hunks, so I am not claiming an observed damaged manifest. The header’s stated contract—recording what the emulator was handed—requires this distinction.

## 4. Sweep spot-checks

These are implementation spot-checks of claims in S2/S3, not endorsements of their reported test runs.

| Claimed fixed row | Spot-check result |
|---|---|
| **F-CS-14** — save state copied onto itself | The guard compares generic paths before `removeFile(mNewSlotFile)`. This prevents the literal same-path deletion described. S1, `SaveState.cpp`, `@@ -181,10 +136,20 @@`. The slot-3 VM proof is absent. |
| **F-RA-14/F-RA-22; F-CS-07/F-CS-36** — swapped buttons | Visible retry bindings use `BUTTON_OK`; full-screen pages render their own help bars; literal A/B footer instructions are removed. S1, `GuiOfflineScan.cpp`, `@@ -115,7 +119,7 @@`, `@@ -215,16 +219,23 @@`; `GuiCloudTransfer.cpp`, `@@ -223,7 +224,10 @@`, `@@ -499,30 +513,33 @@`. This agrees with S13 § Interaction rules. |
| **F-RA-18** — worker walks `FileData` | The worker-side lookup is removed, and the page constructor fills the console name from its lookup. S1, `RetroAchievements.cpp`, `@@ -425,17 +425,19 @@`; `GuiRetroAchievements.cpp`, `@@ -367,6 +377,13 @@`. |
| **F-ES-07** — PLAY NOW answer leaks into later launch | `sPlayThroughSend.exchange(false)` is now at launch entry, independently of whether the send is still running. S1, `FileData.cpp`, `@@ -773,10 +839,95 @@`, `@@ -864,7 +1018,7 @@`. The named stale-bit path is addressed. |
| **F-ES-11** — deferred save-state pointer | The options carry a filename; `launchNow` clears the pointer and looks it up again before handing it on. S1, `FileData.cpp`, `@@ -728,9 +753,50 @@`. This visibly addresses repository refresh during the gate; the all-callers assumption remains unverified. |
| **F-RA-08/F-RA-16** — stale PID signalling | The unheld-lock case is improved, but the identity check remains insufficient. **G2-E-app-05**. |
| **F-RA-09/F-RA-17** — stopped top-up and its own why | Player-stop outcomes and separation from non-game stops are visible. The “own why” part still relies on clock ordering: **G2-E-app-06**. S1, `ProxyCards.cpp`, `@@ -234,6 +267,19 @@`, `@@ -247,7 +293,11 @@`, `@@ -294,20 +343,84 @@`. |
| **F-ES-06/F-ES-28** — BIOS filename case/help | Paths use a raw `MultiLineMenuEntry` rather than the uppercasing helper; DETAILS is conditional on nonempty `mBios`, and help is refreshed after loading. S1, `GuiBios.cpp`, `@@ -244,6 +244,8 @@`, `@@ -265,7 +267,14 @@`, `@@ -304,7 +313,11 @@`. |
| **F-ES-21, 8a GPT** — extensionless dotted title | Only recognized image extensions are removed. The visible rule preserves the content portion of `Dr. Mario-…`. S1, `DisplayAspectText.cpp`, `@@ -37,11 +37,21 @@`. |
| **F-ES-27 / G-E2-O1** — changed cloud folder and focus | The editor’s success rebuilds the hub with `openCloud(window, true)`, and the folder row receives `onFolderRow` as its focus argument. S1, `GuiMenu.cpp`, `@@ -5156,7 +5288,7 @@`, `@@ -5270,11 +5407,26 @@`. No confirming frame is supplied. |
| **F-CS-26, GPT** — match outcome/retry | The same-command retry is suppressed for a match and the footer points to the preview row. S1, `GuiCloudTransfer.cpp`, `@@ -309,6 +313,16 @@`, `@@ -803,10 +825,18 @@`. The removed-file note delegates to an unembedded helper. The current S10 rule agrees with this design. |
| **F-ES-26** — workers post after window shutdown | Posting sites are rerouted and `main` calls `AppWindow::closing()` before teardown. S1, `main.cpp`, `@@ -1261,6 +1314,11 @@`; `OfflineScanJob.cpp`, `@@ -93,8 +95,13 @@`, `@@ -102,9 +109,14 @@`. The gate implementation is absent, and direct card use is not protected merely by changing posting sites. |

### Withdrawals that can be judged

- **F-RA-25, stacked send/top-up cards:** the design reason **holds**. S11’s explicit “cards at the link’s return” section specifies the batch with the top-up stacked under the send card. I did not report that intentional pairing as duplicate work.
- **F-ES-24, toast waiting behind a card:** the design reason **holds** under S11’s D-UI-093 rule.
- **F-RA-21, moving the hash fetch off the interface thread:** S12 explicitly identifies this as the outstanding #300 lifecycle follow-up. The ten-minute retry throttle is visible, but it does not remove the synchronous freeze. Treat this as a supported deferral, not a fix.
- **F-WF-13, existing French; F-ES-23, original BIOS glyph bytes; F-ES-30, scraper reset order; F-ES-19, no remaining reader of an obsolete setting:** the artifacts needed to uphold these withdrawals are absent.
- **F-ES-17 / 8a F-ES-20, full SSH password exception:** the cited D-INFRA-010 decision is not embedded. S13 gives the general masking rule; the report alone cannot establish its exception.

Several documentation follow-ups in S3 are already reflected in supplied S10: mapped help-bar retry, YOU STARTED A GAME, and the match’s count-only in-place statement. Those should not be reopened from the older report text.

## 5. Cross-stream seams

| Seam | Assumptions on both sides | Assessment |
|---|---|---|
| **Wi-Fi join answer** | Producer returns `JoinAnswer`, with 0 meaning confirmed joined and 2 meaning service unavailable; caller must not treat it as bool. | The caller/type agree visibly. `ApiSystem` and `wifictl` are absent. Profile identity remains wrong in G2-E-app-01. |
| **SSID versus profile name** | Scan/current name an SSID; saved/join name a profile. | The consumer now represents both, but still treats an SSID-named profile as authoritative without checking whether it is active. Inactive renamed profiles also remain an acknowledged producer-format gap in S3. |
| **Cloud content selection** | `--set-systems` persists exactly the chosen names; `--selected` later reads that state. | Quoting is routed through a helper, but persistence is not confirmed. G2-E-app-03. Backend validation and atomic-write behavior are absent. |
| **Settings-first continuation** | The tier record and content selection survive the settings restore; the journey marker indicates a completed settings phase. | Tier parsing and known/legacy command choice are visible. Backup exclusions and marker writer behavior are not. The three artifacts cannot be certified as a coordinated transaction here. |
| **Transfer lock versus save-state writers** | All conflicting writers use the same `/var/run/cloud_sync.lock`; held/unreadable is not “free.” | Deletion now participates in the lock, rather than only observing it. `isFlockHeld`, complete COPY behavior, and external scripts remain unverified. The GUI exemption for `holdsTransferLock()` makes inspecting COPY particularly important. |
| **Cloud cancellation stamps** | Snapshot file identity distinguishes this run’s trap from old outcomes; only interrupted parts are restamped. | Snapshot collection/call wiring are present. `stampsToRestamp`, `scriptStampNames`, script writers, and the `CloudTransferJob` snapshot caller are absent. |
| **Proxy scan stamps** | A last-scan stamp supplies outcome/counts for the run whose card is ending. | The visible consumer uses only wall-clock ordering, not run identity. G2-E-app-06. |
| **Offline summary `null`** | Producer uses `unlocked: null` for unreadable progress; consumer must not display zero earned. | The consumer carries `unlockedKnown` through to a no-bar “couldn’t be read” row. S1, `OfflineAchievementsText.cpp`, `@@ -162,8 +162,15 @@`; `RetroAchievements.cpp`, `@@ -444,6 +446,7 @@`; `GuiRetroAchievements.cpp`, `@@ -216,10 +216,15 @@`, `@@ -237,13 +242,16 @@`. Producer schema/French rendering are absent. |
| **UI lifetime** | No worker dereferences a destroyed window or card, including after the event loop ends. | `AppWindow` posting sites do not by themselves prove this. Detached workers still directly update/close card pointers, including after linger sleeps. The ownership/teardown implementation is required. S3 itself leaves this open; I have not promoted that claim into a proven UAF without the core source. |
| **Launch command grammar** | Save-state rewriting, manifest parsing, and the launcher interpret the same words and values. | Nickname substring matching is improved, but argument decoding remains incomplete in G2-E-app-07. `CommandLineUtil` and the launcher are absent. |
| **Shared settings lock/recovery** | C++ and shell use compatible stale-lock reaping, deadlines, and last-good rules. | Neither complete side is embedded. App call sites cannot establish agreement. |

## 6. Coverage boundary and requests to the orchestrator

The following gaps prevent stronger conclusions:

1. **Core implementations:** `AtomicFileUtil`, `SystemConf`, `CloudText`, and `CommandLineUtil`. These decide numerous E1 dispositions, actual fail-closed behavior, stamp identity selection, and quoting/parsing guarantees.
2. **Application implementations omitted from S1:** `AppWindow.h`, `ApiSystem` join producer, `CloudTransferJob`, rotation-record readers/writers, complete `GuiSettings` finalization behavior, and full COPY execution.
3. **Lifetime/ownership:** window and notification destruction, worker shutdown, and all direct card access. The sync thread is detached; the packet does not show how its card remains valid through shutdown.
4. **Backend contracts:** cloud marker/selection/stamp writers, `wifictl`, ctl lock/PID publication, and the launcher. Their runtime command names appear, but their implementations do not.
5. **Tests:** no unit-test or harness source is embedded in S1. The reported FAIL/PASS output therefore remains attributed evidence, not independently examined regression coverage.
6. **Runtime acceptance:** no required guest journal, screenshot, rescan soak, lock-refusal walk, leak measurement, or slow-capture/top-up hand-off run is supplied.
7. **Additional referenced policy:** `packaging-and-patches.md`, `rclone-cloud-sync.md`, the menu map, and the cited SSH-password exception decision are not embedded. I have not inferred their contents.

These are requests for missing evidence, **not fabricated missing-fix findings**. The two repeated `ViewController` diff blocks were treated as one change.

---

## `corpus.provenance.json`

The arrays are parallel and ordered by `source_ids`. Hashes are exactly those supplied as **verified at embed time** by the Facilitator; none was independently recomputed.

```json
{
  "audit_packet": "E-app",
  "packet_range_as_stated": "7eae8ed91..87b182fbe",
  "corpus_mode": "embedded_read_at_time",
  "source_hash_algorithm": "sha256",
  "source_hash_origin": "Council Facilitator; verified at embed time",
  "facilitator_manifest_read_timestamp_utc": "2026-09-28T13:57:25Z",
  "independent_filesystem_access": false,
  "independent_hash_verification": false,
  "tests_or_builds_executed": [],
  "source_ids": [
    "S1",
    "S2",
    "S3",
    "S4",
    "S5",
    "S6",
    "S7",
    "S8",
    "S9",
    "S10",
    "S11",
    "S12",
    "S13"
  ],
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
  "evidence_policy": {
    "diff": "Source-level evidence limited to the embedded hunks.",
    "reports": "Attributed claims, including test results and commit provenance.",
    "findings_tables": "Prior findings and claimed answers, not accepted verdicts.",
    "rules": "Embedded policy text at the supplied read time."
  },
  "missing_artifacts": [
    {
      "artifact": "AtomicFileUtil and SystemConf implementations and tests",
      "status": "not embedded",
      "needed_for": "Settings-lock, temporary-file, recovery, permissions, partial-read, and pending-change verdicts."
    },
    {
      "artifact": "CloudText implementation and tests",
      "status": "not embedded",
      "needed_for": "Stamp identity selection, script stamp names, candidate preservation, escape parsing, and localization tables."
    },
    {
      "artifact": "CommandLineUtil and launcher implementation",
      "status": "not embedded",
      "needed_for": "Shared shell-word and argument-value contract."
    },
    {
      "artifact": "AppWindow implementation and window/notification ownership and teardown",
      "status": "not embedded",
      "needed_for": "Posting-gate correctness and detached-worker card lifetime."
    },
    {
      "artifact": "ApiSystem join declaration/implementation and wifictl producer",
      "status": "not embedded",
      "needed_for": "JoinAnswer producer contract and SSID/profile mapping."
    },
    {
      "artifact": "CloudTransferJob implementation and synchronization tests",
      "status": "not embedded",
      "needed_for": "Late-stop race, stop-before-pid handling, and snapshot restamping."
    },
    {
      "artifact": "CaptureRotation and CaptureRotationText reader/writer implementations",
      "status": "not embedded",
      "needed_for": "Repair or retirement of previously written own-launch records."
    },
    {
      "artifact": "Complete GuiSettings finalization, populateFolder, collection/view removal, and save-state COPY implementations",
      "status": "not embedded",
      "needed_for": "Withdrawal validation, rescan ownership, and COPY serialization."
    },
    {
      "artifact": "Cloud scripts and offline-achievements ctl lock, selection, marker, and stamp writers",
      "status": "not embedded",
      "needed_for": "Cross-stream producer/consumer agreement."
    },
    {
      "artifact": "Unit-test sources, harness sources, hook changes, catalogue changes, and repository index evidence",
      "status": "not embedded",
      "needed_for": "Reported regression coverage, hook behavior, French coverage, and binary untracking."
    },
    {
      "artifact": "Guest acceptance artifacts",
      "status": "not embedded",
      "needed_for": "Journals, frames, rescan soak, lock walks, thread-resource measurements, and launch/top-up ordering."
    },
    {
      "artifact": "packaging-and-patches.md, rclone-cloud-sync.md, menu map, and D-INFRA-010 exception decision",
      "status": "not embedded",
      "needed_for": "Policy or contract claims referring to those documents."
    }
  ]
}
```
# E2 audit of the fixes

**Disposition: several fixes hold at the source level, but E2 is not ready for blanket closure.** The packet exposes persistence failure paths, a capture guard that deliberately stops guarding after its timeout, and a cancellation problem introduced by queued top-ups. Collection cleanup, notification lifetimes, and several cross-stream helpers still require evidence outside this packet.

I reviewed the embedded diff in full. **I did not access a filesystem, execute tests, or independently verify hashes.** The report’s test results remain claims; the test implementations are evidence of what was tested, not evidence that those tests ran.

Citations **S1–S9** identify the sources in `corpus.provenance.json` below. Code paths and hunk coordinates are locations **within S1**, not separately read files. The principal standards applied are fail-closed guards and artifact verification [S4], already-written compatibility [S5], and the four ES rules [S6–S9].

## 1. Punch-item verdicts

| Item | Verdict | Evidence and remaining limit |
|---|---|---|
| **PL-014 — rescan/FileData lifetimes** | **Holds in part** | `FolderMerge::merge` preserves matching live objects and moves only new objects. `SystemData::rescanIfFolderChanged` explicitly drops collection entries before deleting vanished games, removes grouped top-level references, indexes arrivals, and drops/remakes affected views. This is a substantive alternative to clearing and rebuilding everything. **However, the pure-node tests do not exercise the real collection removal, destructors, filter index, or views.** Those callees and the required 200-iteration soak are not established here. [S1: `FolderMerge.h`, `@@ -0,0 +1,74 @@`; `SystemData.cpp`, `@@ -325,26 +386,129 @@`; `FolderMergeTests.cpp`] |
| **PL-029 — restore continuation honors ticks** | **Holds in part** | The normal path now records the three remaining tiers and builds the continuation conditionally. In particular, saves-only selects `cloud_restore --yes --saves-only` and does not add `cloud_content_restore`. But failed record replacement can reuse old selections, and an incomplete record can silently discard the continuation: **G-E2-01/02**. Backend preservation of the selection file and the restart acceptance run are not proved. [S1: `JourneyTiers.h`, `@@ -0,0 +1,113 @@`; `GuiMenu.cpp`, `@@ -4655,14 +4738,41 @@`; `main.cpp`, `@@ -944,35 +946,86 @@`] |
| **PL-030 — quote cloud folder names** | **Holds in part** | Both picker paths use `cloudSetSystemsCommand`, which calls `cloudShellQuote(picked)` instead of constructing double-quoted shell text. The harness checks command substitution, backticks, injected double quotes, and an apostrophe through `/bin/sh`. **The quoting helper’s body is not embedded**, nor is the backend name-validation change or guest result. The requested call-site substitution is present; end-to-end closure is not established. [S1: `GuiMenu.cpp`, `@@ -4008,6 +4035,23 @@`, `@@ -4227,11 +4298,11 @@`; `tests/cloud-set-systems-quoting.py`] |
| **PL-054 — account sentence needs flush stamp** | **Holds** | The account-sentence candidates are now added only inside `if (sent)`. An empty queue without that evidence retains `COMPLETED` without claiming delivery to the account. The two tests distinguish these outcomes explicitly. [S1: `ProxyCards.cpp`, `@@ -114,10 +127,18 @@`; `ProxyCardsTests.cpp`, the two “send card” cases] |
| **PL-056 — one top-up watcher** | **Holds for the exclusion mechanism** | Requests are accumulated before `sTopUpRunning.exchange(true)`, and the watcher’s relinquish/reclaim sequence addresses requests arriving during shutdown of the watcher. The two-request test checks both serialization and preservation of the index request. **The new queue has a separate cancellation regression, G-E2-04.** No actual VM card observation is supplied. [S1: `ProxyCards.cpp`, `@@ -294,20 +333,60 @@`, `@@ -414,8 +492,10 @@`; `ProxyCardsTests.cpp`] |
| **PL-061 — launch waits for capture** | **Holds in part** | The in-flight generation is published before the worker starts, and normal short/long captures are waited for. But after ten seconds the launch proceeds while the capture remains active, and later launches explicitly bypass that same capture: **G-E2-03**. This does not close the original overlap scenario for slow captures. [S1: `FileData.cpp`, `@@ -773,10 +823,68 @@`, `@@ -1073,6 +1194,8 @@`; `tests/launch-capture-gate.py`] |
| **PL-062 — gated row works after setup** | **Holds** | The formerly gated callback rechecks `exists(..., false)` at the press, undims the entry, and calls the action. Transfer rows retain the shared handler that reopens an existing job. The harness tests a row built before configuration and pressed after configuration. [S1: `GuiMenu.cpp`, `@@ -5127,16 +5240,9 @@`, `@@ -5866,8 +6006,24 @@`; `tests/cloud-gated-row.py`] |

### Supplemental PL-068

PL-068 is in the delivered code and report, although it is not one of the original punch sections in S2.

**Verdict: holds in part.** `transferGone` waits while the shared helper reports a held lock and abandons a waiting deletion after the shutdown grace period. The tests cover an already-held lock, an inaccessible lock file, and shutdown with one waiting deletion.

This is nevertheless a **lock-state probe, not a retained exclusion lock**. The packet does not show the complete deletion/retirement path or whether it acquires exclusion before mutating files and manifests. A transfer starting immediately after the successful probe is therefore not covered by the supplied test or established safe by this packet. The implementation of `Utils::AtomicFile::isFlockHeld` is also outside the diff.  
[S1: `SaveStateBookkeeper.cpp`, `@@ -29,8 +37,65 @@`; `BookkeeperTests.cpp`]

## 2. Findings

### G-E2-01: A failed journey-record replacement can replay an earlier selection

- **Severity:** Medium
- **Category:** Persistence / fail-open continuation
- **Where:** `es-app/src/guis/GuiMenu.cpp`, hunk `@@ -4655,14 +4738,41 @@`; consumer in `main.cpp`, `@@ -944,35 +946,86 @@`.
- **What:** Failure to write the new selection merely logs a warning. The settings restore still starts. The comment assumes failure leaves “a marker and no record,” but an earlier record may already occupy the same path.
- **Failure scenario:** A previous attempt left a ROMs-and-BIOS record. A new attempt selects settings and saves. Record replacement fails while leaving the previous file intact; the settings restore subsequently succeeds. At restart, `main` parses the previous record and offers/builds the wrong continuation. The new prompt names those old tiers, so this is not a hidden command beyond that prompt, but it breaks the selections promised by the original form.
- **Evidence:** The failure branch has no return or invalidation:

  ```cpp
  if (!Utils::AtomicFile::writeText(record, JourneyTiers::record(...)))
      LOG(LogWarning) << "... the start will offer everything";
  ```

  Execution then reaches `new GuiCloudTransfer(...)`. Startup accepts whichever record exists at `JourneyTiers::PATH`; there is no association with this restore attempt. `JourneyTiersTests.cpp` tests serialization and command composition, not record replacement failure. A successful-write prerequisite or an explicit stale-record handling path would refute this; neither is shown. [S1]

The safe behavior needs to be defined for **both** “no record could be created” and “an old record could not be replaced,” rather than treating them as the same state.

### G-E2-02: An incomplete journey record is treated as an intentional empty selection

- **Severity:** Medium
- **Category:** Parsing / loss of resumable work
- **Where:** `es-app/src/JourneyTiers.h`, hunk `@@ -0,0 +1,113 @@`, `parse`; `main.cpp`, hunk `@@ -944,35 +946,86 @@`.
- **What:** `known` means only that the first line matched. It does not mean the record was read whole, despite the field’s comment. Missing or invalid tier lines silently remain false.
- **Failure scenario:** The record is read as:

  ```text
  journey-tiers=1
  ```

  `parse` returns `known=true` with no selected tiers. Startup interprets that as “nothing else was ticked” and removes **both the journey marker and record**, without offering the continuation. A truncated or damaged record therefore loses work rather than being recognized as unknown.
- **Evidence:**

  ```cpp
  t.known = true;
  ...
  if (lines[i] == "saves=1")   t.saves = true;
  ```

  followed by:

  ```cpp
  if (journeyPending && journeyTiers.known && !journeyTiers.any())
  {
      std::remove(journeyMarker.c_str());
      Utils::FileSystem::removeFile(journeyRecord);
  }
  ```

  There is no requirement that all three keys exist with valid values. Tests reject a missing/wrong header but do not test a valid header with missing or malformed fields. [S1]

An explicitly serialized all-zero selection and an incomplete read need distinct outcomes before consuming a durable marker. This is the fail-closed requirement in S4.

### G-E2-03: The capture guard allows the original overlap after its timeout

- **Severity:** Medium
- **Category:** Concurrency / guard bypass
- **Where:** `es-app/src/FileData.cpp`, hunk `@@ -773,10 +823,68 @@`, `captureGate`.
- **What:** The timeout bounds the player’s wait, but it does not end or isolate the capture. It authorizes the launch while the protected operation remains active.
- **Failure scenario:** A capture is still hashing saves after ten seconds. The gate sets `sCaptureGivenUp`, launches the next game, and that game writes the files being captured. Subsequent launches also skip waiting for the same capture. This is the original PL-061 scenario, delayed rather than prevented.
- **Evidence:**

  ```cpp
  sCaptureGivenUp = capturing;
  break;
  ```

  leads to the completion callback:

  ```cpp
  [window, game, options](bool) { launchNow(window, game, options); }
  ```

  and future entries return immediately for:

  ```cpp
  capturing == sCaptureGivenUp.load()
  ```

  No cancellation, join, snapshot, or “capture has stopped publishing” acknowledgement is shown. The hung-capture harness intentionally models a capture that never finishes and asserts that a launch occurs anyway. [S1: `tests/launch-capture-gate.py`, “a hung capture” case]

This is an explicit implementation trade-off, not an accidental omission. However, it is not the protection described by the punch item. A bounded wait should transition to a safe failure mechanism, not simply stop enforcing the guard [S4].

### G-E2-04: Stopping a top-up can immediately start a queued top-up

- **Severity:** Medium
- **Category:** Cancellation / queued background work
- **Where:** `es-app/src/ProxyCards.cpp`, hunks `@@ -173,7 +196,7 @@`, `@@ -294,20 +333,60 @@`, and `@@ -425,7 +505,12 @@`.
- **What:** The queue preserves pending requests, but it has no durable “a launch is waiting for this stop” state. Its game check waits only for a game that is **already running**.
- **Failure scenario:** A link-return top-up runs; an index request is queued. The player selects STOP IT AND PLAY while no game is running yet. The current ctl exits. When its outcome ends, the watcher takes the queued request. Because the game has not started yet, the `GetRunningGame()` loop does not wait, and the watcher starts another top-up. The launch can meet fresh work instead of receiving the stopped state it asked for.
- **Evidence:**

  ```cpp
  if (!first)
      while (FileData::GetRunningGame() != nullptr)
          ...
  ...
  if (wanted & 2)
      runTopUp(window, true);
  if (wanted & 1)
      runTopUp(window, false);
  ```

  Every new run begins with:

  ```cpp
  sTopUpStoppedForGame = false;
  ```

  The watcher does not inspect a launch-stop condition before dispatching queued work. It also performs the game check only once before potentially dispatching **both** bits.

  The tests cover two requests and a stopped run separately. The stop test sets `fake.gameRunning = true` before `stopTopUp`; it does not exercise a queued request while a launch is still pending. [S1: `ProxyCardsTests.cpp`]

Preserving the index request is useful, but deferring it requires accounting for the pending launch—not merely the eventual running game.

### G-E2-05: A late stop can publish stopped state after completion cleanup

- **Severity:** Medium
- **Category:** Concurrency / cancellation outcome
- **Where:** `es-app/src/CloudTransferJob.cpp`, hunks `@@ -82,10 +81,10 @@`, `@@ -95,13 +94,48 @@`, and `@@ -610,6 +648,17 @@`.
- **What:** The new successful-completion correction clears stop flags only once. The stop methods check `finished()` separately from setting those flags and requesting a signal.
- **Failure scenario:** A stop observes “not finished” and is descheduled. The worker completes successfully, performs the new flag-clearing check, and publishes completion. The stop resumes, sets a stop flag and calls `requestStop` against the completed run. Thus the correction does not make “a completed run is not stopped” an atomic invariant.
- **Evidence:** The stop path is:

  ```cpp
  if (job == nullptr || job->finished())
      return false;
  job->mStoppedByPlayer = true;
  job->requestStop(SIGTERM);
  ```

  The worker’s shown finalization holds `mMutex` and does:

  ```cpp
  if ((mStoppedForGame || mStoppedByPlayer) && (ret == 0 || ret == 9))
  {
      mStoppedForGame = false;
      mStoppedByPlayer = false;
  }
  ```

  before publishing `mFinished`. The flag stores in the stop path are not part of that critical section. The test sends a stop while a command is deliberately still running; it does not pause a stop between the finished check and flag publication. [S1: `JobsTests.cpp`, “a run that completed is not called stopped…”]

An outer synchronization mechanism serializing both complete operations would refute this; none is shown in the packet. The full methods should be checked for that before closing the finding. The visible fix handles an ordinary late stop, not this publication race.

### G-E2-06: Already-wrong own-launch rotation records have no delivered repair mechanism

- **Severity:** Medium
- **Category:** Upgrade / inherited artifact
- **Where:** `es-app/src/CaptureRotation.cpp`, hunk `@@ -145,25 +145,31 @@`; `CaptureRotationText.cpp`, `@@ -41,6 +41,20 @@`; `FileData.cpp`, `@@ -984,8 +1095,18 @@`.
- **What:** The new checks prevent some future bad records, but the packet does not deliver a way to distinguish records already falsely stamped `from=own-launch` by the old code.
- **Failure scenario:** A device upgrades with a record that the previous failed-launch path wrote using another game’s log. That record already carries the supposedly authoritative provenance marker. The game is not launched again, so the new writer checks never run for it.
- **Evidence:** The changed call-site comment expressly identifies the old failure as writing another game’s turn, or zero, as this game’s `from=own-launch`. The new changes gate future writes by exit status, log time, and a launch banner. The shown record decision still uses the existing provenance predicate:

  ```cpp
  return !(recordFromOwnLaunch(existingRecord)
      && parseRecord(existingRecord) == turns);
  ```

  No new provenance version, old-record invalidation, or migration is delivered in these hunks. Records from **before** the provenance marker existed are a different case; those are not the bad records at issue here. [S1]

The complete reader and any companion migration are not embedded, so this is an **unclosed inherited-state finding**, not a claim that no other stream could address it. Supply that mechanism or add an explicit distrust/migration path before claiming the S5 “Already written” requirement is satisfied.

## 3. Sweep spot-checks

These checks cover more than five claimed fixed rows. “Visible fix holds” does not certify the report’s execution results.

| Sweep row(s) | Check against the diff |
|---|---|
| **1-raoffline claude F-RA-05** | **Visible fix holds:** after clearing the queue, `ThreadedHasher` now sets `mTotal = 0`. The constructor/destructor extraction harness checks no worker/card, no completion toast, and no top-up. Real hasher lifecycle execution remains unobserved. [S1: `ThreadedHasher.cpp`, `@@ -59,6 +59,14 @@`; `tests/hasher-offline-index.py`] |
| **F-RA-14/22; F-CS-07/36; scraper F-ES-05/15** | **Visible input/help change holds:** retry uses `BUTTON_OK`; fixed A/B footer instructions are removed; the three long-job pages explicitly render help when topmost in fullscreen-menu mode. This matches S8/S9. Layout and actual swapped-controller behavior still need frames/input tests. [S1: `GuiOfflineScan.cpp`, `GuiCloudTransfer.cpp`, `GuiScraperRun.cpp`, their `input`, `render`, and footer hunks] |
| **1-raoffline claude F-RA-18** | **Visible threading change holds:** the worker-side `getFileData` lookup is removed from `getUserSummaryFromDevice`; the constructor performs the lookup for console name and hash. [S1: `RetroAchievements.cpp`, `@@ -425,17 +425,19 @@`; `GuiRetroAchievements.cpp`, `@@ -367,6 +377,13 @@`] |
| **8-es claude F-ES-07** | **Visible fix holds:** `sPlayThroughSend.exchange(false)` occurs at `launchGame` entry, rather than only when the send-running condition is true. It no longer remains set merely because the send ended before relaunch. [S1: `FileData.cpp`, launch-entry addition and `@@ -864,7 +975,7 @@`] |
| **8-es claude F-ES-11** | **Holds for the tested repository-state case:** a deferred state is resolved again by filename. **Broader ownership is unproved:** the real options also have `isSaveStateInfoTemporary`, which the fake options omit, and the new helpers do not distinguish that ownership case. The full launch/cleanup path is needed before certifying all states. [S1: `FileData.cpp`, `@@ -728,9 +737,50 @@`; `FileData.h`; `tests/launch-deferred-state.py`] |
| **8-es claude F-ES-10** | **Visible protection holds for `ViewController::saveState`:** `configurationReplaced()` causes that method to return before persisting last-system state. It is not evidence that every other exit-time settings writer is suppressed. [S1: `ViewController.cpp`, `@@ -62,6 +69,14 @@`; maintenance/settings-restart call sites] |
| **8a gpt F-ES-16** | **Visible fix holds:** both the row detail and confirmation now call `cloudLatestRun`, which compares manual, exit, and startup timestamps. The fixture tests an older failed manual run followed by a newer successful exit run. [S1: `GuiMenu.cpp`, `@@ -4438,13 +4512,16 @@` and following hunks; `tests/cloud-sync-last-run.py`] |
| **8a gpt F-ES-17/18** | **Visible mechanisms hold:** ownership is handed forward without cancelling the preceding page’s session; closing the owning page requests cancellation. A script that understood `info` but never reported waiting no longer falls back to `url`. Real finalize/destruction semantics and cancellation behavior require the omitted callees. [S1: `GuiMenu.cpp`, `@@ -6006,12 +6162,34 @@`, `@@ -6967,9 +7150,19 @@`; OAuth harnesses] |
| **8a gpt F-ES-21** | **Visible fix holds for the named case:** only recognized image extensions are removed, preserving the dot in an extensionless `Dr. Mario-…` name. [S1: `DisplayAspectText.cpp`, `@@ -37,11 +37,21 @@`] |
| **5-cloud F-CS-05/23** | **Cannot verify the restamping policy:** `CloudTransferJob` now delegates to `ThreadedCloudSync::restampStoppedParts`, but that implementation is not embedded. The job harness explicitly stubs it with an empty function. Delegation is visible; correct stamp selection is not. [S1: `CloudTransferJob.cpp`, `@@ -643,57 +692,25 @@`; `JobsTests.cpp`] |

### Withdrawals and deferrals

- **F-RA-25, send/top-up card overlap:** the design-based withdrawal is supported by **S7’s specific D-UI-109 rule**, which explicitly allows the send and top-up cards as a stacked batch. I do not treat that overlap itself as a defect.
- **F-RA-21, hash fetch blocking the interface:** this remains an acknowledged deferral, not a resolved bug. S8 explicitly identifies the off-thread fetch as follow-up work. The ten-minute back-off limits repetitions; it does not remove the blocking fetch.
- **SSH-password findings F-ES-17 / 8a F-ES-20:** the claimed D-INFRA-010 exception cannot be verified. Its decision-register row is not embedded, while S9 states the general masking rule. The exception needs its actual source.
- **F-ES-19, unused `clouddrive.mounted`; F-ES-30, synchronous scraper reset; F-ES-23, raw BIOS icon bytes:** the report’s repository-wide searches, unchanged code, or byte observations are not supplied by this diff. I cannot validate those refutations from S3 alone.
- **8a F-ES-12, scraper compression:** the relevant constructor geometry and measured frames are not embedded. The later withdrawal cannot be independently confirmed.
- **F-CS-15, “nothing to back up” exits:** the later report says the backend branches were fixed, but those script changes are outside this packet. Route closure to the script review rather than adopting that statement as evidence.
- The report’s original **A/B wording conflict** is no longer present in the supplied rules: S6’s recovery section now specifies mapped confirm/back controls, consistent with S9.

## 4. Coverage boundary and requests to the orchestrator

The following are **not cleared** by this audit:

1. **Real collection/index lifetime correctness:** complete collection removal, `FileData`/folder destruction, indexing, view-removal behavior, and the 200-iteration rescan soak.
2. **Notification teardown:** `AppWindow` demonstrably gates *posts*. The diff still contains detached workers making direct calls such as `card->close()` after a five-second linger. The actual `Window`/notification ownership and teardown implementations are not embedded, so the broader lifetime claim cannot be closed.
3. **Deletion/transfer exclusion:** the complete retirement/unlink path and shared lock helper are required to settle the check-then-act interval in supplemental PL-068.
4. **Cross-stream implementations:** shared restamping, `CloudText` localization/cleaning, the shell-quoting helper, and the command-word parser are not fully available here.
5. **API migration:** `joinWifiNetwork` changes from boolean success to **zero-on-success** integer status. Its consumers are not embedded. Old boolean use can compile while reversing behavior, so syntax-check claims alone are insufficient.
6. **Save-state ownership:** temporary-state cleanup and the complete deferred `ViewController::launch` path are missing.
7. **Backend/upgrade behavior:** preservation of journey selections through settings restore; content flags and BIOS-only behavior; launcher token agreement; existing rotation records and potentially stale capture-manifest hashes.
8. **Execution evidence:** no independently inspectable build/test logs, guest journals, rescan soak, restart walk, or 640×480 English/French frames are embedded.
9. **Decision/map evidence:** `docs/decision-register.md` and `docs/es-menu-map.md` are not embedded.

These gaps are surfaced for integration review; no contents or hashes for the missing artifacts have been invented.

## `corpus.provenance.json`

```json
{
  "corpus_mode": "embedded read-at-time corpus",
  "citation_order": "S1 through S9 correspond to the array positions below",
  "filesystem_access": false,
  "tests_executed_by_auditor": false,
  "independent_file_reads_or_hashing": false,
  "hash_provenance": "SHA-256 values supplied by the Council Facilitator and verified at embed time; not independently recomputed by this auditor",
  "facilitator_manifest_read_timestamp_utc": "2026-09-28T04:20:24Z",
  "source_file_paths": [
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/E2.diff",
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/E2.plan.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/E2.report.md",
    ".claude/rules/engineering-practices.md",
    ".claude/rules/upgrade-and-install.md",
    ".claude/rules/es-player-text.md",
    ".claude/rules/es-native-ui.md",
    ".claude/rules/es-code-traps.md",
    ".claude/rules/es-ui-style-guide.md"
  ],
  "source_file_hashes": [
    "fcacb2165a1d6341c9b95397119ac6429728ac9f4a8be537e4d417e900307820",
    "0e1f3960099d3a87b5c1e33d7900075aa07666b72ed64d322747c0b80efb3eb8",
    "7cbe8d4573354fb5f7e116b38d91fa0bb827529cb6fa43360535c1f092a9c5dd",
    "d6f88a6f4cd9c61b0e6ef728625c6a1cec9dc6f58e1db578cf0987f10f870c1a",
    "de4a683f9a36f9100e6fd98be11ad84d736f370374c40f74c445a2b81eca1995",
    "554225c68e627a3bde8969a77f177aea14f5bcd85b0bcc740631d402a5f1f7a7",
    "48cd5ac727b6d05d0e5acf5a17e7591d96a56e574d27f48a5c0210c5499afcb7",
    "9d5d6995714c9a1287c84f0c02a92de244271a4bdad8e53d29bb61115ba51d0f",
    "150d0ac637626d771871eab48db995d8fc46c69ed7cf786240213649d264ad02"
  ],
  "missing_evidence": [
    "Complete collection, folder, FileData, filter-index, and view-removal implementations",
    "Window and AsyncNotificationComponent ownership and teardown implementations",
    "Complete deletion/retirement path and AtomicFile lock/write helpers",
    "Shared restamping, CloudText helpers, cloudShellQuote, and command-word parser implementations",
    "All joinWifiNetwork consumers and complete deferred save-state ownership/cleanup paths",
    "Backend scripts and companion upgrade or rotation-record migrations",
    "Independent execution logs, guest journals, soak results, and UI frames",
    "docs/decision-register.md, including the claimed D-INFRA-010 exception",
    "docs/es-menu-map.md"
  ]
}
```